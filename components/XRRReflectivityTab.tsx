import React, { useState, useMemo, useCallback } from 'react';
import {
  XRRDataPoint,
  FitQualityResult,
  CriticalAngleResult,
  KiessigAnalysisResult
} from '../utils/xrrPhysics';
import {
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  Activity,
  Crosshair,
  Maximize2,
  Eye,
  SlidersHorizontal
} from 'lucide-react';

interface XRRReflectivityTabProps {
  dataPoints: XRRDataPoint[];
  fitQuality: FitQualityResult;
  critAngleResult: CriticalAngleResult | null;
  kiessigResult: KiessigAnalysisResult | null;
  hasExpData: boolean;
}

type ScaleMode = 'log' | 'fresnel_compensated' | 'linear';
type XAxisUnit = 'theta' | 'qz';
type OpticalWindow = 'full' | 'critical' | 'kiessig' | 'porod';

interface TransformedPoint {
  theta: number;
  twoTheta: number;
  qz: number;
  rawRCalc: number;
  rawRExp: number | null;
  rawFresnelR: number | null;
  rCalc: number;
  rExp: number | null;
  fresnelR: number | null;
  logRCalc: number;
  logResidual: number | null;
  rCalcMin?: number;
  rCalcMax?: number;
  ciRange?: [number, number];
}

const SUPERSCRIPTS: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹'
};

function formatDecadeTick(exp: number): string {
  const rounded = Math.round(exp);
  if (Math.abs(exp - rounded) > 0.05) return exp.toFixed(1);
  const str = String(rounded)
    .split('')
    .map((ch) => SUPERSCRIPTS[ch] ?? ch)
    .join('');
  return `10${str}`;
}

function formatSci(val: number | null | undefined, sig = 2): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  if (val === 0) return '0.00';
  if (val >= 0.01 && val <= 10) return val.toFixed(4);
  const exp = Math.floor(Math.log10(Math.abs(val)));
  const mantissa = val / Math.pow(10, exp);
  const expSup = String(exp)
    .split('')
    .map((ch) => SUPERSCRIPTS[ch] ?? ch)
    .join('');
  return `${mantissa.toFixed(sig)}×10${expSup}`;
}

export const XRRReflectivityTab: React.FC<XRRReflectivityTabProps> = ({
  dataPoints,
  fitQuality,
  critAngleResult,
  kiessigResult,
  hasExpData
}) => {
  const [scaleMode, setScaleMode] = useState<ScaleMode>('log');
  const [xAxisUnit, setXAxisUnit] = useState<XAxisUnit>('theta');
  const [opticalWindow, setOpticalWindow] = useState<OpticalWindow>('full');
  const [showFresnelRef, setShowFresnelRef] = useState<boolean>(true);
  const [showConfidence, setShowConfidence] = useState<boolean>(false);
  const [showKiessigMarkers, setShowKiessigMarkers] = useState<boolean>(true);
  const [showOpticalRegimes, setShowOpticalRegimes] = useState<boolean>(true);
  const [hoverPoint, setHoverPoint] = useState<TransformedPoint | null>(null);

  // Full scan bounds
  const scanBounds = useMemo(() => {
    if (dataPoints.length === 0) {
      return { minTheta: 0, maxTheta: 5, minQz: 0, maxQz: 0.7 };
    }
    return {
      minTheta: dataPoints[0].theta,
      maxTheta: dataPoints[dataPoints.length - 1].theta,
      minQz: dataPoints[0].qz,
      maxQz: dataPoints[dataPoints.length - 1].qz
    };
  }, [dataPoints]);

  // Optical window slice bounds for interactive regime inspection
  const windowBounds = useMemo(() => {
    const thetaC = critAngleResult?.thetaCritDeg ?? 0.25;
    const qzC = critAngleResult?.qzCrit ?? 0.035;
    const { minTheta, maxTheta, minQz, maxQz } = scanBounds;

    if (opticalWindow === 'critical') {
      const thHi = Math.min(maxTheta, Math.max(minTheta + 0.4, thetaC * 3.2));
      const qHi = Math.min(maxQz, Math.max(minQz + 0.05, qzC * 3.2));
      return { minTheta, maxTheta: thHi, minQz, maxQz: qHi };
    }
    if (opticalWindow === 'kiessig') {
      const thLo = Math.max(minTheta, thetaC * 0.9);
      const thHi = Math.min(maxTheta, Math.max(thLo + 0.8, minTheta + (maxTheta - minTheta) * 0.65));
      const qLo = Math.max(minQz, qzC * 0.9);
      const qHi = Math.min(maxQz, Math.max(qLo + 0.1, minQz + (maxQz - minQz) * 0.65));
      return { minTheta: thLo, maxTheta: thHi, minQz: qLo, maxQz: qHi };
    }
    if (opticalWindow === 'porod') {
      const thLo = Math.min(maxTheta - 0.5, Math.max(minTheta + (maxTheta - minTheta) * 0.35, thetaC * 2.0));
      const qLo = Math.min(maxQz - 0.08, Math.max(minQz + (maxQz - minQz) * 0.35, qzC * 2.0));
      return { minTheta: thLo, maxTheta, minQz: qLo, maxQz };
    }
    return scanBounds;
  }, [opticalWindow, scanBounds, critAngleResult]);

  // Transform & filter chart data inside active optical window
  const chartData = useMemo<TransformedPoint[]>(() => {
    return dataPoints
      .filter((pt) => {
        if (xAxisUnit === 'theta') {
          return pt.theta >= windowBounds.minTheta - 1e-6 && pt.theta <= windowBounds.maxTheta + 1e-6;
        }
        return pt.qz >= windowBounds.minQz - 1e-6 && pt.qz <= windowBounds.maxQz + 1e-6;
      })
      .map((pt) => {
        let rCalcVal = pt.rCalc;
        let rExpVal: number | null = pt.rExp ?? null;
        let fresnelVal: number | null = pt.fresnelR ?? null;
        const logRCalc = pt.rCalc > 0 ? Math.log10(Math.max(1e-12, pt.rCalc)) : -10;

        if (scaleMode === 'log') {
          rCalcVal = pt.rCalc > 0 ? Math.log10(Math.max(1e-10, pt.rCalc)) : -9.5;
          rExpVal = pt.rExp && pt.rExp > 0 ? Math.log10(Math.max(1e-10, pt.rExp)) : null;
          fresnelVal = pt.fresnelR && pt.fresnelR > 0 ? Math.log10(Math.max(1e-10, pt.fresnelR)) : null;
        } else if (scaleMode === 'fresnel_compensated') {
          const qz4 = Math.pow(Math.max(0.015, pt.qz), 4);
          rCalcVal = pt.rCalc * qz4;
          rExpVal = pt.rExp ? pt.rExp * qz4 : null;
          fresnelVal = pt.fresnelR ? pt.fresnelR * qz4 : null;
        }

        const logResidual =
          pt.rExp && pt.rExp > 0 && pt.rCalc > 0
            ? Math.log10(pt.rExp) - Math.log10(pt.rCalc)
            : null;

        const rCalcMin =
          pt.rCalcMin && scaleMode === 'log' ? Math.log10(Math.max(1e-10, pt.rCalcMin)) : undefined;
        const rCalcMax =
          pt.rCalcMax && scaleMode === 'log' ? Math.log10(Math.min(1.2, pt.rCalcMax)) : undefined;

        return {
          theta: Number(pt.theta.toFixed(4)),
          twoTheta: Number(pt.twoTheta.toFixed(4)),
          qz: Number(pt.qz.toFixed(5)),
          rawRCalc: pt.rCalc,
          rawRExp: pt.rExp ?? null,
          rawFresnelR: pt.fresnelR ?? null,
          rCalc: rCalcVal,
          rExp: rExpVal,
          fresnelR: fresnelVal,
          logRCalc,
          logResidual,
          rCalcMin,
          rCalcMax,
          ciRange:
            rCalcMin !== undefined && rCalcMax !== undefined
              ? [Math.min(rCalcMin, rCalcMax), Math.max(rCalcMin, rCalcMax)]
              : undefined
        };
      });
  }, [dataPoints, scaleMode, xAxisUnit, windowBounds]);

  // Optical summary statistics derived directly from reflectivity curve
  const profileSummary = useMemo(() => {
    if (dataPoints.length === 0) {
      return {
        rMax: 1,
        rMin: 1e-6,
        decades: 6,
        qRangeLabel: '0.000 – 0.000 Å⁻¹',
        thRangeLabel: '0.00° – 0.00°'
      };
    }
    let rMax = 0;
    let rMin = 1;
    for (const pt of dataPoints) {
      if (pt.rCalc > rMax) rMax = pt.rCalc;
      if (pt.rCalc > 0 && pt.rCalc < rMin) rMin = pt.rCalc;
    }
    const decades = Math.max(0, Math.log10(Math.max(1e-12, rMax)) - Math.log10(Math.max(1e-12, rMin)));
    return {
      rMax,
      rMin,
      decades,
      qRangeLabel: `${dataPoints[0].qz.toFixed(3)} – ${dataPoints[dataPoints.length - 1].qz.toFixed(3)} Å⁻¹`,
      thRangeLabel: `${dataPoints[0].theta.toFixed(2)}° – ${dataPoints[dataPoints.length - 1].theta.toFixed(2)}°`
    };
  }, [dataPoints]);

  // Visible Kiessig maxima inside current window
  const visibleKiessigPeaks = useMemo(() => {
    if (!kiessigResult?.peaks) return [];
    return kiessigResult.peaks
      .filter((pk) => {
        if (xAxisUnit === 'theta') {
          return pk.theta >= windowBounds.minTheta && pk.theta <= windowBounds.maxTheta;
        }
        return pk.qz >= windowBounds.minQz && pk.qz <= windowBounds.maxQz;
      })
      .slice(0, 14);
  }, [kiessigResult, xAxisUnit, windowBounds]);

  // Y-axis bounds & decade ticks
  const yDomain = useMemo<[number | 'auto', number | 'auto']>(() => {
    if (scaleMode === 'log') {
      const floorExp = Math.max(-9, Math.min(-5, Math.floor(Math.log10(Math.max(1e-9, profileSummary.rMin))) - 0.5));
      return [floorExp, 0.35];
    }
    if (scaleMode === 'linear') {
      return [0, 1.05];
    }
    return ['auto', 'auto'];
  }, [scaleMode, profileSummary.rMin]);

  const logTicks = useMemo(() => {
    if (scaleMode !== 'log') return undefined;
    const minExp = typeof yDomain[0] === 'number' ? Math.ceil(yDomain[0]) : -9;
    const ticks: number[] = [];
    for (let e = minExp; e <= 0; e += 1) {
      ticks.push(e);
    }
    return ticks;
  }, [scaleMode, yDomain]);

  const areaBaseValue = useMemo(() => {
    if (scaleMode === 'log') {
      return typeof yDomain[0] === 'number' ? yDomain[0] : -9;
    }
    return 0;
  }, [scaleMode, yDomain]);

  const xLabel =
    xAxisUnit === 'theta'
      ? 'Grazing Incident Angle θ (deg)'
      : 'Momentum Transfer Vector qz = (4π/λ)·sin(θ) (Å⁻¹)';

  const yLabel =
    scaleMode === 'log'
      ? 'Reflectivity R (log₁₀)'
      : scaleMode === 'fresnel_compensated'
      ? 'Porod R · qz⁴ (Å⁻⁴)'
      : 'Specular Reflectivity R';

  const handleChartMouseMove = useCallback((state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const payload = state.activePayload[0].payload as TransformedPoint;
      setHoverPoint(payload);
    }
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    setHoverPoint(null);
  }, []);

  const critLinePos = critAngleResult
    ? xAxisUnit === 'theta'
      ? critAngleResult.thetaCritDeg
      : critAngleResult.qzCrit
    : null;

  const winMinX = xAxisUnit === 'theta' ? windowBounds.minTheta : windowBounds.minQz;
  const winMaxX = xAxisUnit === 'theta' ? windowBounds.maxTheta : windowBounds.maxQz;
  const showCritZone =
    showOpticalRegimes &&
    critLinePos !== null &&
    critLinePos > winMinX &&
    critLinePos < winMaxX;

  const curveColor = scaleMode === 'fresnel_compensated' ? '#818cf8' : '#38bdf8';

  return (
    <div id="xrr-reflectivity-container" className="space-y-4">
      {/* 1. Optical Instrument Calibration & Viewport Control Ribbon */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-3.5 space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Primary Axis & Window Segmented Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Y-Scale Mode */}
            <div className="flex items-center gap-0.5 bg-[#070A12] p-1 rounded-sm border border-slate-800 text-xs font-mono">
              {[
                { id: 'log' as ScaleMode, label: 'Log₁₀(R)' },
                { id: 'fresnel_compensated' as ScaleMode, label: 'Porod R·qz⁴' },
                { id: 'linear' as ScaleMode, label: 'Linear R' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setScaleMode(m.id)}
                  className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    scaleMode === m.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* X-Axis Domain Toggle */}
            <div className="flex items-center gap-0.5 bg-[#070A12] p-1 rounded-sm border border-slate-800 text-xs font-mono">
              {[
                { id: 'theta' as XAxisUnit, label: 'Angle θ (°)' },
                { id: 'qz' as XAxisUnit, label: 'Vector qz (Å⁻¹)' }
              ].map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setXAxisUnit(u.id)}
                  className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    xAxisUnit === u.id
                      ? 'bg-slate-200 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>

            {/* Optical Region Zoom Presets */}
            <div className="flex items-center gap-0.5 bg-[#070A12] p-1 rounded-sm border border-slate-800 text-xs font-mono">
              <Maximize2 className="w-3 h-3 text-slate-500 mx-1.5 shrink-0" />
              {[
                { id: 'full' as OpticalWindow, label: 'Full Scan' },
                { id: 'critical' as OpticalWindow, label: 'Critical Edge' },
                { id: 'kiessig' as OpticalWindow, label: 'Kiessig Fringes' },
                { id: 'porod' as OpticalWindow, label: 'Porod Tail' }
              ].map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setOpticalWindow(w.id)}
                  className={`px-2 py-1 rounded-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    opticalWindow === w.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Unboxed Goodness-of-Fit / Simulation Status Readout */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-300">
            {hasExpData ? (
              <>
                <span className="text-emerald-400 font-semibold">● Fitted Profile</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span>
                  Log-RMSE <strong className="text-cyan-400">{fitQuality.logRmse.toFixed(4)}</strong>
                </span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span>
                  R<sub>wp</sub> <strong className="text-emerald-400">{fitQuality.rwp.toFixed(2)}%</strong>
                </span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span>
                  χ² <strong className="text-amber-400">{fitQuality.chiSquare.toFixed(3)}</strong>
                </span>
              </>
            ) : (
              <>
                <span className="text-cyan-400 font-semibold">● Parratt Matrix Ready</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-400">{chartData.length} / {dataPoints.length} pts</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-300">{profileSummary.decades.toFixed(1)} decades</span>
              </>
            )}
          </div>
        </div>

        {/* Layer Visibility Matrix */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80 text-xs font-mono text-slate-300">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Trace Overlays
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showFresnelRef}
                onChange={(e) => setShowFresnelRef(e.target.checked)}
                className="accent-cyan-400 cursor-pointer"
              />
              <span>Fresnel Substrate R_F</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showKiessigMarkers}
                onChange={(e) => setShowKiessigMarkers(e.target.checked)}
                className="accent-purple-400 cursor-pointer"
              />
              <span>Kiessig Maxima ({visibleKiessigPeaks.length})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showOpticalRegimes}
                onChange={(e) => setShowOpticalRegimes(e.target.checked)}
                className="accent-emerald-400 cursor-pointer"
              />
              <span>Critical Reflection Zone</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="accent-sky-400 cursor-pointer"
              />
              <span>95% Uncertainty Band</span>
            </label>
          </div>

          {critAngleResult && (
            <div className="text-[11px] font-mono tabular-nums text-emerald-400">
              θc = {critAngleResult.thetaCritDeg.toFixed(3)}° · qc = {critAngleResult.qzCrit.toFixed(4)} Å⁻¹
            </div>
          )}
        </div>
      </div>

      {/* 2. Primary High-Resolution Specular Reflectivity Canvas */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-sm p-4 space-y-3">
        {/* Title Bar + Live Crosshair Coordinate HUD */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-100 tracking-tight">
                Specular X-Ray Reflectivity Profile R({xAxisUnit === 'theta' ? 'θ' : 'qz'})
              </h4>
              <p className="text-[11px] font-mono text-slate-400">
                Dynamic interference response across critical edge, Kiessig waveguides &amp; Porod decay
              </p>
            </div>
          </div>

          {/* Live Cursor Probe Coordinate Strip */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono tabular-nums bg-[#070A12] border border-slate-800 px-3 py-1.5 rounded-sm">
            <Crosshair className={`w-3.5 h-3.5 ${hoverPoint ? 'text-cyan-400' : 'text-slate-500'}`} />
            {hoverPoint ? (
              <>
                <span className="text-slate-300">
                  θ = <strong className="text-white">{hoverPoint.theta.toFixed(3)}°</strong>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">
                  qz = <strong className="text-cyan-300">{hoverPoint.qz.toFixed(4)} Å⁻¹</strong>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">
                  R<sub>calc</sub> = <strong className="text-sky-400">{formatSci(hoverPoint.rawRCalc)}</strong>
                </span>
                {hoverPoint.rawFresnelR && hoverPoint.rawFresnelR > 0 && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300">
                      R/R<sub>F</sub> ={' '}
                      <strong className="text-amber-400">
                        {(hoverPoint.rawRCalc / hoverPoint.rawFresnelR).toFixed(2)}×
                      </strong>
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-slate-400">
                Hover curve to inspect exact θ, qz, R(θ) &amp; Fresnel ratio R/R_F
              </span>
            )}
          </div>
        </div>

        {/* Trace Legend Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-slate-200">
              <span
                className="w-4 h-0.5 inline-block"
                style={{ backgroundColor: curveColor }}
              />
              Parratt Specular R_calc
            </span>
            {showFresnelRef && (
              <span className="flex items-center gap-2">
                <span className="w-4 h-0 border-t border-dashed border-slate-400 inline-block" />
                Ideal Fresnel R_F
              </span>
            )}
            {hasExpData && (
              <span className="flex items-center gap-2 text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Measured R_exp
              </span>
            )}
            {critAngleResult && (
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-3 h-0 border-t border-dashed border-emerald-400 inline-block" />
                Critical Edge ({xAxisUnit === 'theta' ? `θc ${critAngleResult.thetaCritDeg.toFixed(3)}°` : `qc ${critAngleResult.qzCrit.toFixed(3)}`})
              </span>
            )}
            {showKiessigMarkers && visibleKiessigPeaks.length > 0 && (
              <span className="flex items-center gap-2 text-purple-300">
                <span className="w-3 h-0 border-t border-dotted border-purple-400 inline-block" />
                Kiessig Maxima
              </span>
            )}
          </div>

          <span className="text-slate-500 tabular-nums">
            Span: {xAxisUnit === 'theta' ? `${winMinX.toFixed(2)}° – ${winMaxX.toFixed(2)}°` : `${winMinX.toFixed(3)} – ${winMaxX.toFixed(3)} Å⁻¹`}
          </span>
        </div>

        {/* Main ComposedChart SVG Stage */}
        <div className="h-[410px] w-full bg-[#070A12] p-2.5 rounded-sm border border-slate-800 cursor-crosshair">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 18, right: 24, left: 16, bottom: 26 }}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              <defs>
                <linearGradient id="xrrSpecCyanFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.28} />
                  <stop offset="65%" stopColor="#0284c7" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#070A12" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="xrrPorodIndigoFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.28} />
                  <stop offset="70%" stopColor="#6366f1" stopOpacity={0.07} />
                  <stop offset="100%" stopColor="#070A12" stopOpacity={0.0} />
                </linearGradient>
                <filter id="xrrBeamGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" strokeOpacity={0.85} />

              <XAxis
                dataKey={xAxisUnit}
                type="number"
                domain={[winMinX, winMaxX]}
                allowDataOverflow
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                tickFormatter={(v: number) =>
                  xAxisUnit === 'theta' ? `${v.toFixed(2)}°` : v.toFixed(3)
                }
                label={{
                  value: xLabel,
                  position: 'insideBottom',
                  offset: -14,
                  fill: '#94a3b8',
                  fontSize: 11,
                  fontFamily: 'monospace'
                }}
              />

              <YAxis
                stroke="#64748b"
                ticks={logTicks}
                domain={yDomain}
                allowDataOverflow
                width={54}
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                tickFormatter={(val: number) => {
                  if (scaleMode === 'log') return formatDecadeTick(val);
                  if (scaleMode === 'fresnel_compensated') return val.toExponential(1);
                  return val.toFixed(2);
                }}
                label={{
                  value: yLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: -2,
                  fill: '#94a3b8',
                  fontSize: 11,
                  fontFamily: 'monospace'
                }}
              />

              {/* Total External Reflection Plateau Shading (θ < θc) */}
              {showCritZone && critLinePos !== null && (
                <ReferenceArea
                  x1={winMinX}
                  x2={critLinePos}
                  fill="rgba(16, 185, 129, 0.08)"
                  stroke="none"
                  label={{
                    value: 'Total Reflection (θ < θc)',
                    position: 'insideBottomLeft',
                    fill: '#34d399',
                    fontSize: 10,
                    fontFamily: 'monospace'
                  }}
                />
              )}

              {/* 95% Confidence Band Area */}
              {showConfidence && scaleMode === 'log' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="ciRange"
                    stroke="none"
                    fill="rgba(56, 189, 248, 0.16)"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rCalcMax"
                    stroke="#38bdf8"
                    strokeOpacity={0.4}
                    strokeDasharray="2 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rCalcMin"
                    stroke="#38bdf8"
                    strokeOpacity={0.4}
                    strokeDasharray="2 3"
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}

              {/* Custom High-Precision Scientific Crosshair Tooltip */}
              <Tooltip
                cursor={{ stroke: '#22d3ee', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const pt = payload[0].payload as TransformedPoint;
                  const ratio =
                    pt.rawFresnelR && pt.rawFresnelR > 0
                      ? pt.rawRCalc / pt.rawFresnelR
                      : null;

                  return (
                    <div className="bg-[#0B0F19]/95 border border-slate-700 rounded-sm p-3 shadow-2xl font-mono text-[11px] tabular-nums space-y-1.5 min-w-[230px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-300">
                        <span>θ = <strong className="text-white">{pt.theta.toFixed(4)}°</strong></span>
                        <span>2θ = <strong className="text-slate-200">{pt.twoTheta.toFixed(3)}°</strong></span>
                      </div>
                      <div className="flex items-center justify-between text-cyan-300">
                        <span className="text-slate-400">Scattering qz:</span>
                        <strong>{pt.qz.toFixed(5)} Å⁻¹</strong>
                      </div>
                      <div className="flex items-center justify-between text-sky-400">
                        <span className="text-slate-400">Parratt R_calc:</span>
                        <strong>{formatSci(pt.rawRCalc)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Log₁₀(R_calc):</span>
                        <strong>{pt.logRCalc.toFixed(3)}</strong>
                      </div>
                      {pt.rawFresnelR !== null && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Fresnel R_F / Ratio:</span>
                          <strong className="text-amber-400">
                            {ratio !== null ? `${ratio.toFixed(2)}×` : '—'}
                          </strong>
                        </div>
                      )}
                      {pt.rawRExp !== null && (
                        <div className="pt-1 border-t border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-rose-400">
                            <span>Measured R_exp:</span>
                            <strong>{formatSci(pt.rawRExp)}</strong>
                          </div>
                          {pt.logResidual !== null && (
                            <div className="flex items-center justify-between text-amber-300">
                              <span>Δlog₁₀(R):</span>
                              <strong>
                                {pt.logResidual >= 0 ? `+${pt.logResidual.toFixed(4)}` : pt.logResidual.toFixed(4)}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {/* Critical Angle / Critical Vector Marker */}
              {critLinePos !== null && critLinePos >= winMinX && critLinePos <= winMaxX && (
                <ReferenceLine
                  x={critLinePos}
                  stroke="#10b981"
                  strokeDasharray="4 3"
                  strokeWidth={1.6}
                  label={{
                    value:
                      xAxisUnit === 'theta'
                        ? `θc = ${critAngleResult!.thetaCritDeg.toFixed(3)}°`
                        : `qc = ${critAngleResult!.qzCrit.toFixed(3)} Å⁻¹`,
                    fill: '#34d399',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    position: 'insideTopRight'
                  }}
                />
              )}

              {/* Kiessig Interference Fringe Maxima Reference Ticks */}
              {showKiessigMarkers &&
                visibleKiessigPeaks.map((pk, idx) => (
                  <ReferenceLine
                    key={`fringe-${idx}`}
                    x={xAxisUnit === 'theta' ? pk.theta : pk.qz}
                    stroke="rgba(192, 132, 252, 0.35)"
                    strokeDasharray="2 3"
                    strokeWidth={1}
                    label={
                      idx < 7
                        ? {
                            value: `m${pk.order ?? idx + 1}`,
                            position: 'top',
                            fill: '#c084fc',
                            fontSize: 9,
                            fontFamily: 'monospace'
                          }
                        : undefined
                    }
                  />
                ))}

              {/* Ideal Fresnel Substrate Envelope */}
              {showFresnelRef && (
                <Line
                  type="monotone"
                  dataKey="fresnelR"
                  stroke="#64748b"
                  strokeDasharray="5 4"
                  strokeWidth={1.3}
                  dot={false}
                  isAnimationActive={false}
                  name="fresnelR"
                />
              )}

              {/* Specular Parratt Area Fill + Luminous Phosphor Trace */}
              <Area
                type="monotone"
                dataKey="rCalc"
                baseValue={areaBaseValue}
                stroke={curveColor}
                strokeWidth={2.3}
                fill={
                  scaleMode === 'fresnel_compensated'
                    ? 'url(#xrrPorodIndigoFill)'
                    : 'url(#xrrSpecCyanFill)'
                }
                filter="url(#xrrBeamGlow)"
                dot={false}
                activeDot={{ r: 4, fill: '#22d3ee', stroke: '#070A12', strokeWidth: 2 }}
                isAnimationActive={false}
                name="rCalc"
              />

              {/* Experimental Data Scatter */}
              {hasExpData && (
                <Line
                  type="linear"
                  dataKey="rExp"
                  stroke="transparent"
                  strokeWidth={0}
                  dot={{ r: 2.3, fill: '#f43f5e', stroke: '#881337', strokeWidth: 0.7 }}
                  activeDot={{ r: 4.5, fill: '#fb7185', stroke: '#fff', strokeWidth: 1 }}
                  isAnimationActive={false}
                  name="rExp"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Synchronized Log-Residual Diagnostics (when experimental curve is present) */}
        {hasExpData && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
              <span className="flex items-center gap-2 text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                Residual Error Trace: Δlog₁₀(R) = log₁₀(R_exp) − log₁₀(R_calc)
              </span>
              <span className="text-emerald-400 font-semibold">
                R² = {fitQuality.rSquared.toFixed(4)} · Tolerance Band ±0.15 dec
              </span>
            </div>
            <div className="h-32 w-full bg-[#070A12] p-2 rounded-sm border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 24, left: 16, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" strokeOpacity={0.75} />
                  <XAxis
                    dataKey={xAxisUnit}
                    type="number"
                    domain={[winMinX, winMaxX]}
                    allowDataOverflow
                    stroke="#64748b"
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    width={54}
                    tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
                    domain={[-0.6, 0.6]}
                  />
                  <ReferenceArea y1={-0.15} y2={0.15} fill="rgba(16, 185, 129, 0.08)" stroke="none" />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F19',
                      borderColor: '#334155',
                      borderRadius: '2px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                    formatter={(v: any) => [typeof v === 'number' ? v.toFixed(4) : v, 'Δlog₁₀(R)']}
                  />
                  <Line
                    type="monotone"
                    dataKey="logResidual"
                    stroke="#fbbf24"
                    strokeWidth={1.6}
                    dot={false}
                    isAnimationActive={false}
                    name="Δlog₁₀(R)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 4. 4-Column Optical Profile Telemetry Deck */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-slate-800 bg-[#070A12] divide-y lg:divide-y-0 lg:divide-x divide-slate-800 rounded-sm">
          <div className="p-3 space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Critical Edge (θc / qc)
            </div>
            <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
              {critAngleResult ? `${critAngleResult.thetaCritDeg.toFixed(3)}°` : '—'}
              <span className="text-[11px] text-slate-400 font-normal ml-1.5">
                {critAngleResult ? `(${critAngleResult.qzCrit.toFixed(3)} Å⁻¹)` : ''}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 tabular-nums">
              {critAngleResult ? `Surface ρ ≈ ${critAngleResult.densityEst.toFixed(2)} g/cm³` : 'Sub-critical plateau'}
            </div>
          </div>

          <div className="p-3 space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Kiessig Modulation
            </div>
            <div className="text-sm font-mono font-bold text-purple-300 tabular-nums">
              {kiessigResult && kiessigResult.periodQz > 0
                ? `Δqz = ${kiessigResult.periodQz.toFixed(4)} Å⁻¹`
                : 'Monolayer / Thick'}
            </div>
            <div className="text-[11px] font-mono text-slate-400 tabular-nums">
              {kiessigResult && kiessigResult.estimatedThickness > 0
                ? `d_est = ${(kiessigResult.estimatedThickness / 10).toFixed(2)} nm (${kiessigResult.estimatedThickness.toFixed(1)} Å)`
                : 'No discrete fringes resolved'}
            </div>
          </div>

          <div className="p-3 space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Dynamic Range
            </div>
            <div className="text-sm font-mono font-bold text-cyan-400 tabular-nums">
              {profileSummary.decades.toFixed(2)} decades
            </div>
            <div className="text-[11px] font-mono text-slate-400 tabular-nums">
              R_min = {formatSci(profileSummary.rMin)}
            </div>
          </div>

          <div className="p-3 space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Scattering Coverage
            </div>
            <div className="text-sm font-mono font-bold text-slate-100 tabular-nums">
              {profileSummary.thRangeLabel}
            </div>
            <div className="text-[11px] font-mono text-slate-400 tabular-nums">
              qz: {profileSummary.qRangeLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
