import React, { useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  RefreshCw,
  Sliders,
  Activity,
  Database,
  Zap,
  Ruler,
  Info,
  BookOpen,
  Atom,
  Layers,
  AlertTriangle,
  Loader2,
  Play,
  Sparkles,
  Check
} from 'lucide-react';
import { WHResult } from '../../types';
import { parseScherrerInput, XRAY_WAVELENGTHS } from '../../utils/physics';
import { WHPeakDataManager } from './WHPeakDataManager';

export type WHStrainModel =
  | 'UDM'
  | 'USDM'
  | 'UDEDM'
  | 'SSP'
  | 'Halder-Wagner'
  | 'mWH'
  | 'Stephens'
  | 'Monshi-Scherrer';

export interface WHPresetItem {
  name: string;
  data: string;
  wavelength: number;
  k: number;
  desc: string;
  icon: string;
  youngsModulus: number;
  density: number;
  material: string;
}

export interface WHRecomputeFeedback {
  timestamp: string;
  message: string;
  warnings: string[];
}

interface WHSolverOpticsConsoleProps {
  presets: WHPresetItem[];
  strainModel: WHStrainModel;
  onSelectStrainModel: (model: WHStrainModel, immediate?: boolean) => void;
  wavelength: number;
  setWavelength: (v: number) => void;
  constantK: number;
  setConstantK: (v: number) => void;
  instFwhm: number;
  setInstFwhm: (v: number) => void;
  instrumentalMode: 'constant' | 'caglioti';
  setInstrumentalMode: (m: 'constant' | 'caglioti') => void;
  isDecouplingEnabled: boolean;
  setIsDecouplingEnabled: (v: boolean) => void;
  broadeningModel: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
  setBroadeningModel: (m: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt') => void;
  cagliotiU: number;
  setCagliotiU: (v: number) => void;
  cagliotiV: number;
  setCagliotiV: (v: number) => void;
  cagliotiW: number;
  setCagliotiW: (v: number) => void;
  youngsModulusGPa: number;
  setYoungsModulusGPa: (v: number) => void;
  selectedMaterial: string;
  setSelectedMaterial: (v: string) => void;
  isModulusEnabled: boolean;
  setIsModulusEnabled: (v: boolean) => void;
  burgersVectorNm: number;
  setBurgersVectorNm: (v: number) => void;
  isDensityEnabled: boolean;
  setIsDensityEnabled: (v: boolean) => void;
  materialDensityGcm3: number;
  setMaterialDensityGcm3: (v: number) => void;
  dislocationQParam: number;
  setDislocationQParam: (v: number) => void;
  ch00Param: number;
  setCh00Param: (v: number) => void;
  inputData: string;
  setInputData: (v: string) => void;
  excludedIndices: number[];
  setExcludedIndices: (v: number[]) => void;
  onToggleExcludePeak: (idx: number) => void;
  configSection: 'all' | 'model' | 'optics' | 'elastic' | 'peaks';
  setConfigSection: (s: 'all' | 'model' | 'optics' | 'elastic' | 'peaks') => void;
  autoCalculate: boolean;
  setAutoCalculate: (v: boolean) => void;
  hasPendingChanges: boolean;
  isCalculating: boolean;
  result: WHResult | null;
  bestFitModelItem: { modelName: string; rSquared: number } | null;
  renderedModelFormulaHtml: string;
  transferNotice: string | null;
  showDecouplingExplanation: boolean;
  setShowDecouplingExplanation: (v: boolean) => void;
  showDensityExplanation: boolean;
  setShowDensityExplanation: (v: boolean) => void;
  recomputeFeedback: WHRecomputeFeedback | null;
  setRecomputeFeedback: (f: WHRecomputeFeedback | null) => void;
  onReset: () => void;
  onImportFromScherrer: () => void;
  onRefineDislocationQ: () => void;
  onStartCalculation: () => void;
  onAutoOptimizeAll: () => void;
}

const MODEL_META: {
  id: WHStrainModel;
  short: string;
  subtitle: string;
  tooltip: string;
}[] = [
  { id: 'UDM', short: 'UDM', subtitle: 'Isotropic Strain', tooltip: 'Uniform Deformation Model (Isotropic Strain)' },
  { id: 'USDM', short: 'USDM', subtitle: 'Uniform Stress', tooltip: 'Uniform Stress Deformation Model (Anisotropic E_hkl)' },
  { id: 'UDEDM', short: 'UDEDM', subtitle: 'Energy Density', tooltip: 'Uniform Deformation Energy Density Model' },
  { id: 'SSP', short: 'SSP', subtitle: 'High-Angle Fit', tooltip: 'Size-Strain Plot (High-Angle Weighted)' },
  { id: 'Halder-Wagner', short: 'H–W', subtitle: 'Parabolic Voigt', tooltip: 'Halder-Wagner Parabolic Voigt Decoupling' },
  { id: 'mWH', short: 'mWH', subtitle: 'Ungár Contrast', tooltip: 'Ungár Modified W-H (Dislocation Contrast C_hkl)' },
  { id: 'Stephens', short: 'Stephens', subtitle: 'Aniso. Tensor', tooltip: 'Stephens Anisotropic Microstrain Tensor' },
  { id: 'Monshi-Scherrer', short: 'Monshi', subtitle: 'Log Linearized', tooltip: 'Monshi-Scherrer Logarithmic Linearization' }
];

const ANODE_LINES = [
  { key: 'Cu Kα', symbol: 'Cu', lambda: XRAY_WAVELENGTHS['Cu Kα'] || 1.5406, keV: 8.05, color: '#22d3ee' },
  { key: 'Mo Kα', symbol: 'Mo', lambda: XRAY_WAVELENGTHS['Mo Kα'] || 0.71073, keV: 17.45, color: '#38bdf8' },
  { key: 'Co Kα', symbol: 'Co', lambda: XRAY_WAVELENGTHS['Co Kα'] || 1.78897, keV: 6.93, color: '#f59e0b' }
];

export const WHSolverOpticsConsole: React.FC<WHSolverOpticsConsoleProps> = ({
  presets,
  strainModel,
  onSelectStrainModel,
  wavelength,
  setWavelength,
  constantK,
  setConstantK,
  instFwhm,
  setInstFwhm,
  instrumentalMode,
  setInstrumentalMode,
  isDecouplingEnabled,
  setIsDecouplingEnabled,
  broadeningModel,
  setBroadeningModel,
  cagliotiU,
  setCagliotiU,
  cagliotiV,
  setCagliotiV,
  cagliotiW,
  setCagliotiW,
  youngsModulusGPa,
  setYoungsModulusGPa,
  selectedMaterial,
  setSelectedMaterial,
  isModulusEnabled,
  setIsModulusEnabled,
  burgersVectorNm,
  setBurgersVectorNm,
  isDensityEnabled,
  setIsDensityEnabled,
  materialDensityGcm3,
  setMaterialDensityGcm3,
  dislocationQParam,
  setDislocationQParam,
  ch00Param,
  setCh00Param,
  inputData,
  setInputData,
  excludedIndices,
  setExcludedIndices,
  onToggleExcludePeak,
  configSection,
  setConfigSection,
  autoCalculate,
  setAutoCalculate,
  hasPendingChanges,
  isCalculating,
  result,
  bestFitModelItem,
  renderedModelFormulaHtml,
  transferNotice,
  showDecouplingExplanation,
  setShowDecouplingExplanation,
  showDensityExplanation,
  setShowDensityExplanation,
  recomputeFeedback,
  setRecomputeFeedback,
  onReset,
  onImportFromScherrer,
  onRefineDislocationQ,
  onStartCalculation,
  onAutoOptimizeAll
}) => {
  const uid = useId().replace(/:/g, '');
  const parsedPeaks = useMemo(() => parseScherrerInput(inputData), [inputData]);

  const evalInstAt = (twoThetaDeg: number): number => {
    if (!isDecouplingEnabled) return 0;
    if (instrumentalMode === 'constant') return Math.max(0, instFwhm);
    const tanT = Math.tan(((twoThetaDeg / 2) * Math.PI) / 180);
    return Math.sqrt(Math.max(0, cagliotiU * tanT * tanT + cagliotiV * tanT + cagliotiW));
  };

  const telemetry = useMemo(() => {
    const activeCount = Math.max(0, parsedPeaks.length - excludedIndices.length);
    const avgBetaObs =
      parsedPeaks.length > 0
        ? parsedPeaks.reduce((acc, p) => acc + p.fwhmObs, 0) / parsedPeaks.length
        : 0;
    const avgInst =
      parsedPeaks.length > 0
        ? parsedPeaks.reduce((acc, p) => acc + evalInstAt(p.twoTheta), 0) / parsedPeaks.length
        : instFwhm;
    const signalRatio = avgInst > 1e-4 ? avgBetaObs / avgInst : 0;
    const activeR2 = result?.regression.rSquared ?? 0;
    const minTT = parsedPeaks.length > 0 ? Math.min(...parsedPeaks.map(p => p.twoTheta)) : 20;
    const maxTT = parsedPeaks.length > 0 ? Math.max(...parsedPeaks.map(p => p.twoTheta)) : 90;
    const photonKeV = 12.3984 / Math.max(0.1, wavelength);
    const activeAnode = ANODE_LINES.find(a => Math.abs(a.lambda - wavelength) < 0.005);

    const floorViolations = parsedPeaks.filter((p, idx) => {
      if (excludedIndices.includes(idx) || !isDecouplingEnabled) return false;
      return p.fwhmObs <= evalInstAt(p.twoTheta) * 1.05;
    }).length;

    return {
      activeCount,
      totalCount: parsedPeaks.length,
      avgBetaObs,
      avgInst,
      signalRatio,
      activeR2,
      minTT,
      maxTT,
      photonKeV,
      activeAnodeLabel: activeAnode ? activeAnode.key : `λ ${wavelength.toFixed(3)} Å`,
      floorViolations
    };
  }, [
    parsedPeaks,
    excludedIndices,
    isDecouplingEnabled,
    instrumentalMode,
    instFwhm,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    result,
    wavelength
  ]);

  // R² Dial Gauge Geometry
  const r2Clamped = Math.max(0, Math.min(1, telemetry.activeR2));
  const dialRadius = 24;
  const dialCircumference = 2 * Math.PI * dialRadius;
  const dialDashOffset = dialCircumference * (1 - r2Clamped);
  const dialStroke =
    r2Clamped >= 0.92 ? '#34d399' : r2Clamped >= 0.8 ? '#22d3ee' : '#f59e0b';

  // Live IRF SVG Curve Data (10° to 110° 2θ)
  const irfChart = useMemo(() => {
    const svgW = 340;
    const svgH = 102;
    const padL = 32;
    const padR = 12;
    const padT = 14;
    const padB = 20;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;
    const baseY = padT + plotH;

    const minDeg = 10;
    const maxDeg = 110;
    const samples: { tt: number; inst: number }[] = [];
    for (let deg = minDeg; deg <= maxDeg; deg += 2) {
      samples.push({ tt: deg, inst: evalInstAt(deg) });
    }

    const peakMaxFwhm = parsedPeaks.length > 0 ? Math.max(...parsedPeaks.map(p => p.fwhmObs)) : 0.4;
    const instMax = Math.max(...samples.map(s => s.inst), 0.15);
    const maxY = Math.max(0.3, peakMaxFwhm * 1.18, instMax * 1.25);

    const xOf = (tt: number) => padL + ((Math.max(minDeg, Math.min(maxDeg, tt)) - minDeg) / (maxDeg - minDeg)) * plotW;
    const yOf = (val: number) => baseY - Math.min(1, Math.max(0, val / maxY)) * plotH;

    const linePts = samples.map(s => `${xOf(s.tt).toFixed(1)},${yOf(s.inst).toFixed(1)}`).join(' ');
    const areaPts = `${padL},${baseY} ${linePts} ${padL + plotW},${baseY}`;

    const peakDots = parsedPeaks.map((p, idx) => {
      const instHere = evalInstAt(p.twoTheta);
      const isExcluded = excludedIndices.includes(idx);
      const isNearFloor = isDecouplingEnabled && p.fwhmObs <= instHere * 1.08;
      return {
        cx: xOf(p.twoTheta),
        cy: yOf(p.fwhmObs),
        instY: yOf(instHere),
        twoTheta: p.twoTheta,
        fwhm: p.fwhmObs,
        hkl: p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`,
        isExcluded,
        isNearFloor
      };
    });

    return { svgW, svgH, padL, padR, padT, padB, plotW, plotH, baseY, maxY, linePts, areaPts, peakDots, xOf, yOf };
  }, [parsedPeaks, excludedIndices, isDecouplingEnabled, instrumentalMode, instFwhm, cagliotiU, cagliotiV, cagliotiW]);

  // Live Ungár Dislocation Contrast Curve SVG (H² from 0 to 0.34)
  const contrastChart = useMemo(() => {
    const svgW = 320;
    const svgH = 88;
    const padL = 30;
    const padR = 14;
    const padT = 12;
    const padB = 18;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;
    const baseY = padT + plotH;

    const evalC = (h2: number) => Math.max(0.01, ch00Param * (1 - dislocationQParam * h2));
    const vals = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.333].map(h2 => ({ h2, c: evalC(h2) }));
    const maxC = Math.max(0.45, ...vals.map(v => v.c) ) * 1.1;

    const xOf = (h2: number) => padL + (Math.min(0.34, Math.max(0, h2)) / 0.34) * plotW;
    const yOf = (c: number) => baseY - Math.min(1, Math.max(0, c / maxC)) * plotH;

    const linePts = vals.map(v => `${xOf(v.h2).toFixed(1)},${yOf(v.c).toFixed(1)}`).join(' ');
    const areaPts = `${padL},${baseY} ${linePts} ${xOf(0.333).toFixed(1)},${baseY}`;

    const peakPoints = parsedPeaks
      .filter(p => p.hkl && (p.hkl[0] !== 0 || p.hkl[1] !== 0 || p.hkl[2] !== 0))
      .map((p, idx) => {
        const [h, k, l] = p.hkl!;
        const sumSq = h * h + k * k + l * l;
        const h2 = sumSq > 0 ? (h * h * k * k + k * k * l * l + l * l * h * h) / (sumSq * sumSq) : 0;
        const cVal = evalC(h2);
        return {
          cx: xOf(h2),
          cy: yOf(cVal),
          label: `(${h}${k}${l})`,
          h2,
          cVal,
          idx
        };
      });

    return { svgW, svgH, padL, padT, plotW, plotH, baseY, maxC, linePts, areaPts, peakPoints, xOf, yOf };
  }, [ch00Param, dislocationQParam, parsedPeaks]);

  // Wavelength position along 0.5 Å – 2.3 Å X-ray spectrum bar
  const lambdaPct = Math.max(4, Math.min(96, ((wavelength - 0.5) / (2.3 - 0.5)) * 100));

  return (
    <div className="bg-[#0A0E18] rounded-xl border border-slate-800/90 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.85)] relative overflow-hidden">
      {/* Precision Calibrated Phosphor Top Hairline */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan-400 via-sky-500/70 to-emerald-400/50" />

      {/* ==================== CONSOLE HEADER & OPTICAL BEAMLINE SCHEMATIC ==================== */}
      <div className="p-4 sm:p-5 border-b border-slate-800/90 bg-gradient-to-b from-[#0E1525]/80 to-[#0A0E18]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#060911] border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(34,211,238,0.18)]">
              <Settings className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">
                Solver &amp; Optics Configuration
              </h2>
              <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5 truncate">
                {strainModel} · λ = {wavelength.toFixed(4)} Å · {telemetry.photonKeV.toFixed(2)} keV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setAutoCalculate(!autoCalculate)}
              className={`px-2.5 py-1.5 rounded-md border text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                autoCalculate
                  ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200'
                  : 'bg-[#060911] border-slate-700/90 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
              title={
                autoCalculate
                  ? 'Auto-Calc is ON: solver updates live on every change'
                  : 'Manual Calc mode: adjust parameters freely, then press Start Calculation'
              }
            >
              {autoCalculate ? 'Live: ON' : 'Manual'}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-2.5 py-1.5 rounded-md border border-slate-700/90 bg-[#060911] hover:bg-slate-800/90 text-[10px] font-mono font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Reset solver and optics parameters to Silicon defaults"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* BESPOKE GRAPHIC #1: Live Optical Beamline & Fit Precision Instrument Display */}
        <div className="mt-4 rounded-lg bg-[#060911] border border-slate-800/90 overflow-hidden">
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between gap-2 border-b border-slate-800/70">
            <span className="text-[10px] font-mono text-slate-400 tracking-wide">
              Optical Beamline &amp; Fit Telemetry
            </span>
            <span className="text-[10px] font-mono tabular-nums text-cyan-300">
              {selectedMaterial.split('(')[0].trim()} · 2θ {telemetry.minTT.toFixed(0)}°–{telemetry.maxTT.toFixed(0)}°
            </span>
          </div>

          <div className="grid grid-cols-12 items-center px-3 py-2.5 gap-2">
            {/* Left 8 cols: Live SVG Bragg–Brentano Optical Schematic */}
            <div className="col-span-8">
              <svg viewBox="0 0 245 78" className="w-full h-[74px] select-none overflow-visible">
                <defs>
                  <linearGradient id={`beamIn-${uid}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.45" />
                  </linearGradient>
                  <linearGradient id={`beamOut-${uid}`} x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.35" />
                  </linearGradient>
                  <pattern id={`microGrid-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
                    <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#1e293b" strokeWidth="0.45" opacity="0.55" />
                  </pattern>
                </defs>

                {/* Subtle Blueprint Grid */}
                <rect x="0" y="0" width="245" height="78" fill={`url(#microGrid-${uid})`} rx="4" />

                {/* Focusing Circle Arc */}
                <path
                  d="M 28 32 A 95 62 0 0 1 212 32"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.9"
                  strokeDasharray="2.5 2.5"
                />

                {/* X-Ray Anode Tube */}
                <g transform="translate(8, 15)">
                  <rect x="0" y="0" width="38" height="22" rx="3" fill="#0B1120" stroke="#334155" strokeWidth="1" />
                  <rect x="3" y="4" width="6" height="14" rx="1" fill="#22d3ee" opacity="0.85" />
                  <text x="12" y="10" fill="#e2e8f0" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                    {telemetry.activeAnodeLabel.split(' ')[0]}
                  </text>
                  <text x="12" y="18" fill="#64748b" fontSize="5.8" fontFamily="monospace">
                    {wavelength.toFixed(2)}Å
                  </text>
                </g>

                {/* Divergence Slit */}
                <line x1="63" y1="26" x2="63" y2="34" stroke="#64748b" strokeWidth="1.8" />
                <line x1="63" y1="40" x2="63" y2="48" stroke="#64748b" strokeWidth="1.8" />

                {/* Incident X-Ray Beam */}
                <line x1="46" y1="28" x2="118" y2="57" stroke={`url(#beamIn-${uid})`} strokeWidth="2.1" />
                <line x1="46" y1="28" x2="118" y2="57" stroke="#67e8f9" strokeWidth="0.7" strokeDasharray="3 3" />

                {/* Crystalline Sample Stage with Lattice Planes */}
                <g transform="translate(96, 56)">
                  <rect x="0" y="2" width="46" height="10" rx="2" fill="#0F172A" stroke="#38bdf8" strokeWidth="0.9" />
                  {/* Atomic plane lines */}
                  <line x1="5" y1="5" x2="41" y2="5" stroke="#22d3ee" strokeWidth="0.6" opacity="0.6" />
                  <line x1="5" y1="8.5" x2="41" y2="8.5" stroke="#34d399" strokeWidth="0.6" opacity="0.5" />
                  <circle cx="23" cy="2" r="2.6" fill="#22d3ee" />
                  <text x="23" y="20" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="monospace">
                    {telemetry.activeCount} (hkl)
                  </text>
                </g>

                {/* Diffracted Bragg Rays Fan (scaled by active 2θ spread) */}
                <line x1="119" y1="57" x2="188" y2="21" stroke={`url(#beamOut-${uid})`} strokeWidth="1.3" opacity="0.45" />
                <line x1="119" y1="57" x2="195" y2="29" stroke={`url(#beamOut-${uid})`} strokeWidth="2.1" />
                <line x1="119" y1="57" x2="199" y2="38" stroke={`url(#beamOut-${uid})`} strokeWidth="1.2" opacity="0.45" />

                {/* Bragg Angle Arc */}
                <path d="M 140 57 A 22 22 0 0 0 135 45" fill="none" stroke="#f59e0b" strokeWidth="1" />
                <text x="145" y="54" fill="#fbbf24" fontSize="6" fontFamily="monospace">
                  2θ
                </text>

                {/* IRF / Detector Module */}
                <g transform="translate(194, 15)">
                  <rect
                    x="0"
                    y="0"
                    width="44"
                    height="26"
                    rx="3"
                    fill="#0B1120"
                    stroke={isDecouplingEnabled ? '#0ea5e9' : '#475569'}
                    strokeWidth="1"
                  />
                  <text x="22" y="10" textAnchor="middle" fill={isDecouplingEnabled ? '#38bdf8' : '#94a3b8'} fontSize="6" fontFamily="monospace" fontWeight="bold">
                    {isDecouplingEnabled ? (instrumentalMode === 'caglioti' ? 'CAGLIOTI' : 'IRF ON') : 'RAW'}
                  </text>
                  <text x="22" y="19" textAnchor="middle" fill="#94a3b8" fontSize="5.6" fontFamily="monospace">
                    {isDecouplingEnabled ? `β₀ ${telemetry.avgInst.toFixed(2)}°` : 'No Sub'}
                  </text>
                </g>
              </svg>
            </div>

            {/* Right 4 cols: Circular Precision R² Arc Gauge */}
            <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-800/80 pl-2">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90 select-none">
                  <circle
                    cx="30"
                    cy="30"
                    r={dialRadius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={dialRadius}
                    fill="none"
                    stroke={dialStroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={dialCircumference}
                    strokeDashoffset={dialDashOffset}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono tabular-nums">
                  <span className="text-[8px] text-slate-400 leading-none">R²</span>
                  <span className="text-[11px] font-bold text-white leading-tight mt-0.5">
                    {result ? r2Clamped.toFixed(3) : '—'}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-0.5 truncate max-w-full">
                {bestFitModelItem ? `Best: ${bestFitModelItem.modelName}` : 'Ready'}
              </span>
            </div>
          </div>

          {/* 4-Cell Crisp Telemetry Footer inside Instrument Display */}
          <div className="grid grid-cols-4 gap-px bg-slate-800/80 border-t border-slate-800/80 font-mono tabular-nums">
            <div className="bg-[#080C15] px-2.5 py-1.5">
              <span className="text-[9px] text-slate-500 block">Peaks</span>
              <span className="text-[11px] font-bold text-white">
                {telemetry.activeCount}/{telemetry.totalCount}
              </span>
            </div>
            <div className="bg-[#080C15] px-2.5 py-1.5">
              <span className="text-[9px] text-slate-500 block">β_obs/β₀</span>
              <span
                className={`text-[11px] font-bold ${
                  !isDecouplingEnabled
                    ? 'text-slate-300'
                    : telemetry.signalRatio >= 2.0
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {!isDecouplingEnabled ? 'Raw' : telemetry.signalRatio > 0 ? `${telemetry.signalRatio.toFixed(1)}×` : '—'}
              </span>
            </div>
            <div className="bg-[#080C15] px-2.5 py-1.5">
              <span className="text-[9px] text-slate-500 block">Adj R²</span>
              <span className="text-[11px] font-bold text-cyan-300">
                {result?.regression.adjustedRSquared !== undefined
                  ? result.regression.adjustedRSquared.toFixed(3)
                  : '—'}
              </span>
            </div>
            <div className="bg-[#080C15] px-2.5 py-1.5">
              <span className="text-[9px] text-slate-500 block">State</span>
              <span
                className={`text-[11px] font-bold ${
                  telemetry.floorViolations > 0
                    ? 'text-amber-400'
                    : hasPendingChanges && !autoCalculate
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {telemetry.floorViolations > 0
                  ? '▲ Floor'
                  : hasPendingChanges && !autoCalculate
                  ? 'Pending'
                  : 'Nominal'}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Way Precision Section Filter with Smooth Active Indicator */}
        <div className="mt-3.5 grid grid-cols-5 gap-1 p-1 bg-[#060911] rounded-lg border border-slate-800/90">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'model', label: 'Model' },
              { id: 'optics', label: 'Optics' },
              { id: 'elastic', label: 'Elastic' },
              { id: 'peaks', label: 'Peaks' }
            ] as const
          ).map(tab => {
            const active = configSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setConfigSection(tab.id)}
                className={`relative py-1.5 px-1 rounded-md text-[10px] font-mono font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
                  active ? 'text-cyan-200' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId={`wh-config-tab-${uid}`}
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    className="absolute inset-0 rounded-md bg-cyan-500/18 border border-cyan-500/45"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== CONFIGURATION SECTIONS BODY ==================== */}
      <div className="p-4 sm:p-5 space-y-6">
        {/* ==================== 01. SIZE-STRAIN FORMALISM ==================== */}
        {(configSection === 'all' || configSection === 'model') && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>01. Size–Strain Formalism</span>
              </h3>
              <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                {strainModel}
              </span>
            </div>

            {/* 8-Model Comparative Matrix with Live R² Micro-Bars */}
            <div className="grid grid-cols-2 gap-1.5 font-mono tabular-nums">
              {MODEL_META.map(m => {
                const comp = result?.modelComparisons?.find(c => c.modelName === m.id);
                const isSel = strainModel === m.id;
                const r2Val = comp ? Math.max(0, Math.min(1, comp.rSquared)) : 0;
                const barWidth = `${Math.round(r2Val * 100)}%`;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectStrainModel(m.id)}
                    title={m.tooltip}
                    className={`group relative px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer overflow-hidden ${
                      isSel
                        ? 'bg-cyan-500/12 border-cyan-400/70 shadow-[inset_0_1px_0_rgba(34,211,238,0.2)]'
                        : 'bg-[#060911] border-slate-800/90 hover:border-slate-700 hover:bg-[#0D1322]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-1.5">
                      <span
                        className={`text-[11px] font-bold tracking-tight truncate ${
                          isSel ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {m.short}
                      </span>
                      <span
                        className={`text-[10px] font-bold shrink-0 ${
                          comp?.isBestFit
                            ? 'text-emerald-400'
                            : isSel
                            ? 'text-cyan-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {comp ? `${comp.isBestFit ? '★ ' : ''}${comp.rSquared.toFixed(3)}` : '—'}
                      </span>
                    </div>
                    <div className="text-[9.5px] font-sans text-slate-400 truncate mt-0.5">
                      {m.subtitle}
                    </div>
                    {/* Precision R² Quality Micro-Bar */}
                    <div className="mt-1.5 h-1 w-full bg-slate-800/90 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          comp?.isBestFit
                            ? 'bg-emerald-400'
                            : isSel
                            ? 'bg-cyan-400'
                            : 'bg-slate-600 group-hover:bg-slate-500'
                        }`}
                        style={{ width: comp ? barWidth : '0%' }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Etched Mathematical Blueprint Plate */}
            <div
              className="p-3.5 rounded-lg bg-[#060911] border border-slate-800/90 space-y-2.5 relative overflow-hidden"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(148,163,184,0.12) 1px, transparent 1px)',
                backgroundSize: '12px 12px'
              }}
            >
              <div
                className="text-xs text-cyan-100 py-1 overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: renderedModelFormulaHtml }}
              />
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="flex items-center justify-between bg-[#0A0E18]/90 px-2.5 py-1 rounded border border-slate-800/80">
                  <span className="text-slate-400">Size D</span>
                  <strong className="text-emerald-300">
                    {strainModel === 'SSP' || strainModel === 'Halder-Wagner' ? 'Slope' : 'Intercept'}
                  </strong>
                </div>
                <div className="flex items-center justify-between bg-[#0A0E18]/90 px-2.5 py-1 rounded border border-slate-800/80">
                  <span className="text-slate-400">Strain ε</span>
                  <strong className="text-cyan-300">
                    {strainModel === 'SSP' || strainModel === 'Halder-Wagner'
                      ? 'Intercept'
                      : strainModel === 'Monshi-Scherrer'
                      ? 'Log Scale'
                      : 'Slope'}
                  </strong>
                </div>
              </div>
            </div>

            {/* BESPOKE GRAPHIC #2: Ungár Dislocation Contrast Curve (mWH / Stephens) */}
            {(strainModel === 'mWH' || strainModel === 'Stephens') && (
              <div className="p-3.5 bg-[#060911] rounded-lg border border-emerald-500/30 space-y-3 font-mono tabular-nums">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="text-emerald-300 font-semibold">
                    Contrast C_hkl = C_h00(1 − q·H²)
                  </span>
                  <button
                    type="button"
                    onClick={onRefineDislocationQ}
                    className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold text-[10px] cursor-pointer transition-colors whitespace-nowrap"
                    title="Numerically optimize q across [-1.8, 2.75] to maximize R²"
                  >
                    Auto-Refine q
                  </button>
                </div>

                {/* Live SVG Dislocation Contrast Curve */}
                <div className="bg-[#0A0E18] rounded-md border border-slate-800/90 p-2">
                  <svg
                    viewBox={`0 0 ${contrastChart.svgW} ${contrastChart.svgH}`}
                    className="w-full h-[84px] select-none overflow-visible"
                  >
                    <defs>
                      <linearGradient id={`ungarGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Axes & Orientation Guides */}
                    <line
                      x1={contrastChart.padL}
                      y1={contrastChart.padT}
                      x2={contrastChart.padL}
                      y2={contrastChart.baseY}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <line
                      x1={contrastChart.padL}
                      y1={contrastChart.baseY}
                      x2={contrastChart.padL + contrastChart.plotW}
                      y2={contrastChart.baseY}
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    {[
                      { h2: 0, lbl: 'h00' },
                      { h2: 0.25, lbl: 'hh0' },
                      { h2: 0.333, lbl: 'hhh' }
                    ].map(g => (
                      <g key={g.lbl}>
                        <line
                          x1={contrastChart.xOf(g.h2)}
                          y1={contrastChart.padT}
                          x2={contrastChart.xOf(g.h2)}
                          y2={contrastChart.baseY}
                          stroke="#1e293b"
                          strokeWidth="0.8"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={contrastChart.xOf(g.h2)}
                          y={contrastChart.svgH - 4}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="6.5"
                          fontFamily="monospace"
                        >
                          ({g.lbl})
                        </text>
                      </g>
                    ))}
                    <text
                      x="8"
                      y={contrastChart.padT + contrastChart.plotH / 2}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="6.5"
                      fontFamily="monospace"
                      transform={`rotate(-90 8 ${contrastChart.padT + contrastChart.plotH / 2})`}
                    >
                      C_hkl
                    </text>

                    <polygon points={contrastChart.areaPts} fill={`url(#ungarGrad-${uid})`} />
                    <polyline
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.7"
                      points={contrastChart.linePts}
                    />

                    {/* Active Peak Orientation Markers */}
                    {contrastChart.peakPoints.map(pt => (
                      <g key={`${pt.label}-${pt.idx}`}>
                        <circle
                          cx={pt.cx}
                          cy={pt.cy}
                          r="2.8"
                          fill="#22d3ee"
                          stroke="#060911"
                          strokeWidth="0.9"
                        />
                        <text
                          x={pt.cx}
                          y={Math.max(10, pt.cy - 5)}
                          textAnchor="middle"
                          fill="#a5f3fc"
                          fontSize="6"
                          fontFamily="monospace"
                        >
                          {pt.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Anisotropy q</span>
                      <span className="text-emerald-300 font-bold">{dislocationQParam.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.8"
                      step="0.05"
                      value={dislocationQParam}
                      onChange={e => setDislocationQParam(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Base C_h00</span>
                      <span className="text-emerald-300 font-bold">{ch00Param.toFixed(3)}</span>
                    </div>
                    <input
                      type="number"
                      step="0.005"
                      min="0.05"
                      max="0.60"
                      value={ch00Param}
                      onChange={e => setCh00Param(parseFloat(e.target.value) || 0.285)}
                      className="w-full px-2.5 py-1 bg-[#0A0E18] text-emerald-300 border border-slate-700 rounded-md text-xs font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Cu Screw (q=2.26)', q: 2.26, c: 0.304 },
                    { label: 'Cu Edge (q=1.65)', q: 1.65, c: 0.304 },
                    { label: 'Fe BCC (q=2.67)', q: 2.67, c: 0.285 },
                    { label: 'Si Iso (q=1.35)', q: 1.35, c: 0.215 }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDislocationQParam(preset.q);
                        setCh00Param(preset.c);
                      }}
                      className="px-2 py-1.5 rounded-md bg-[#0A0E18] hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-emerald-300 cursor-pointer text-left truncate transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ==================== 02. X-RAY OPTICS & INSTRUMENTAL IRF ==================== */}
        {(configSection === 'all' || configSection === 'optics') && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>02. X-Ray Optics &amp; Instrumental IRF</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {isDecouplingEnabled ? broadeningModel : 'Raw / Off'}
              </span>
            </div>

            {/* Calibration Standard Specimen Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-slate-400" />
                  <span>Reference Specimen Presets</span>
                </label>
                <button
                  type="button"
                  onClick={onImportFromScherrer}
                  className="text-[10px] font-mono font-semibold text-amber-300 hover:text-amber-200 cursor-pointer transition-colors"
                  title="Import active peak list and optics from Scherrer Studio"
                >
                  Import Scherrer →
                </button>
              </div>
              {transferNotice && (
                <p className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-md border border-amber-500/30">
                  {transferNotice}
                </p>
              )}
              <div className="grid grid-cols-3 gap-1.5 font-mono tabular-nums">
                {presets.map(p => {
                  const isActiveMat = selectedMaterial === p.material;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setInputData(p.data);
                        setWavelength(p.wavelength);
                        setConstantK(p.k);
                        if (p.material) setSelectedMaterial(p.material);
                        if (p.youngsModulus) {
                          setYoungsModulusGPa(p.youngsModulus);
                          setIsModulusEnabled(true);
                        }
                        if (p.density) setMaterialDensityGcm3(p.density);
                        setExcludedIndices([]);
                        setRecomputeFeedback(null);
                      }}
                      className={`px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isActiveMat
                          ? 'bg-cyan-500/12 border-cyan-400/60 text-white'
                          : 'bg-[#060911] border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      title={p.desc}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${isActiveMat ? 'text-cyan-200' : 'text-slate-200'}`}>
                          {p.icon}
                        </span>
                        <span className="text-[9px] text-slate-500">{p.density}g</span>
                      </div>
                      <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                        E₀ {p.youngsModulus} GPa
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wavelength (λ) + Emission Spectrum Indicator & Shape Factor K */}
            <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800/90 space-y-3.5 font-mono tabular-nums">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-sans font-medium text-slate-300 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      Wavelength (λ)
                    </label>
                    <span className="text-[10px] text-slate-500">Å</span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={String(wavelength) === 'NaN' ? '' : wavelength}
                    onChange={e => setWavelength(parseFloat(e.target.value) || 1.5406)}
                    className="w-full px-3 py-1.5 bg-[#0A0E18] text-cyan-300 border border-slate-700 focus:border-cyan-400 rounded-md outline-none text-xs font-bold"
                  />
                  <div className="grid grid-cols-3 gap-1">
                    {ANODE_LINES.map(anode => {
                      const active = Math.abs(wavelength - anode.lambda) < 0.001;
                      return (
                        <button
                          key={anode.key}
                          type="button"
                          onClick={() => setWavelength(anode.lambda)}
                          className={`py-1 rounded border text-[10px] font-semibold transition-colors cursor-pointer ${
                            active
                              ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                              : 'bg-[#0A0E18] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {anode.symbol}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-sans font-medium text-slate-300 flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-cyan-400" />
                      Shape Factor (K)
                    </label>
                    <span className="text-[10px] text-slate-500">Habit</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={String(constantK) === 'NaN' ? '' : constantK}
                    onChange={e => setConstantK(parseFloat(e.target.value) || 0.9)}
                    className="w-full px-3 py-1.5 bg-[#0A0E18] text-white border border-slate-700 focus:border-cyan-400 rounded-md outline-none text-xs font-bold"
                  />
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { val: 0.9, label: '0.90' },
                      { val: 0.94, label: '0.94' },
                      { val: 1.0, label: '1.00' }
                    ].map(item => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setConstantK(item.val)}
                        className={`py-1 rounded border text-[10px] font-semibold transition-colors cursor-pointer ${
                          Math.abs(constantK - item.val) < 1e-4
                            ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                            : 'bg-[#0A0E18] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* X-Ray Emission Spectrum Bar */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[9.5px] text-slate-400">
                  <span>Hard X-Ray (Mo 0.71 Å)</span>
                  <span className="text-cyan-300 font-semibold">
                    {telemetry.photonKeV.toFixed(2)} keV
                  </span>
                  <span>Soft (Cr 2.29 Å)</span>
                </div>
                <div className="relative h-2 rounded-full bg-gradient-to-r from-sky-500/40 via-cyan-400/45 to-amber-500/40 border border-slate-800">
                  {/* Tick markers for Mo, Cu, Co */}
                  {[0.7107, 1.5406, 1.789].map(l => {
                    const pct = ((l - 0.5) / (2.3 - 0.5)) * 100;
                    return (
                      <span
                        key={l}
                        className="absolute top-0 bottom-0 w-px bg-slate-300/40"
                        style={{ left: `${pct}%` }}
                      />
                    );
                  })}
                  {/* Active Wavelength Needle */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-3.5 rounded-sm bg-cyan-300 border border-slate-950 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-200"
                    style={{ left: `${lambdaPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* BESPOKE GRAPHIC #3: Instrumental Deconvolution & Live Caglioti Resolution Envelope */}
            <div className="p-3.5 bg-[#060911] rounded-lg border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-100">
                  Instrumental Resolution (β_inst)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDecouplingExplanation(!showDecouplingExplanation)}
                    className="text-[10px] text-slate-400 hover:text-cyan-300 font-mono flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-800 cursor-pointer transition-colors"
                    title="Explain instrumental broadening subtraction"
                  >
                    <Info className="w-3 h-3" />
                    <span>Law</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDecouplingEnabled(!isDecouplingEnabled)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border transition-colors cursor-pointer ${
                      isDecouplingEnabled
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/45'
                        : 'bg-[#0A0E18] border-slate-700 text-slate-400'
                    }`}
                  >
                    {isDecouplingEnabled ? 'Active' : 'Bypassed'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showDecouplingExplanation && (
                  <motion.div
                    key="wh-decoupling-explanation"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-2.5 bg-[#0A0E18] rounded-md border border-slate-700 text-[11px] space-y-1.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-cyan-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Instrumental Deconvolution Laws
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDecouplingExplanation(false)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      Subtracts diffractometer slit and focal-spot broadening{' '}
                      <code className="text-amber-300 font-mono">β_inst(2θ)</code> from measured peak widths{' '}
                      <code className="text-cyan-300 font-mono">β_obs</code>.
                    </p>
                    <div className="bg-[#060911] p-1.5 rounded font-mono text-[10px] text-center text-slate-200 border border-slate-800">
                      Gauss: √(β_obs² − β_inst²) · Lorentz: β_obs − β_inst
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live SVG Resolution Envelope vs Observed Reflections */}
              {isDecouplingEnabled && (
                <div className="bg-[#0A0E18] rounded-md border border-slate-800/90 p-2">
                  <div className="flex items-center justify-between px-1 mb-1 text-[9px] font-mono text-slate-400">
                    <span>Observed β_obs (dots) vs IRF Floor β_inst (amber)</span>
                    <span className="text-amber-300 tabular-nums">
                      {instrumentalMode === 'constant'
                        ? `Flat ${instFwhm.toFixed(3)}°`
                        : 'Caglioti(2θ)'}
                    </span>
                  </div>
                  <svg
                    viewBox={`0 0 ${irfChart.svgW} ${irfChart.svgH}`}
                    className="w-full h-[94px] select-none overflow-visible"
                  >
                    <defs>
                      <linearGradient id={`irfFloor-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid & Y Labels */}
                    {[0, 0.5, 1].map((frac, i) => {
                      const val = irfChart.maxY * frac;
                      const y = irfChart.yOf(val);
                      return (
                        <g key={i}>
                          <line
                            x1={irfChart.padL}
                            y1={y}
                            x2={irfChart.padL + irfChart.plotW}
                            y2={y}
                            stroke="#1e293b"
                            strokeWidth="0.7"
                            strokeDasharray={frac === 0 ? undefined : '2 2'}
                          />
                          <text
                            x={irfChart.padL - 4}
                            y={y + 2.5}
                            textAnchor="end"
                            fill="#64748b"
                            fontSize="6.5"
                            fontFamily="monospace"
                          >
                            {val.toFixed(2)}°
                          </text>
                        </g>
                      );
                    })}

                    {/* X-Axis Ticks (2θ) */}
                    {[20, 40, 60, 80, 100].map(deg => {
                      const x = irfChart.xOf(deg);
                      return (
                        <g key={deg}>
                          <line
                            x1={x}
                            y1={irfChart.baseY}
                            x2={x}
                            y2={irfChart.baseY + 3.5}
                            stroke="#475569"
                            strokeWidth="0.8"
                          />
                          <text
                            x={x}
                            y={irfChart.svgH - 4}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="6.5"
                            fontFamily="monospace"
                          >
                            {deg}°
                          </text>
                        </g>
                      );
                    })}

                    {/* Shaded Instrumental Floor Area + Curve */}
                    <polygon points={irfChart.areaPts} fill={`url(#irfFloor-${uid})`} />
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.6"
                      strokeDasharray={instrumentalMode === 'constant' ? '4 2' : undefined}
                      points={irfChart.linePts}
                    />

                    {/* Measured Peaks + Margin Stems Above IRF Floor */}
                    {irfChart.peakDots.map((pt, i) => (
                      <g key={i} opacity={pt.isExcluded ? 0.3 : 1}>
                        <line
                          x1={pt.cx}
                          y1={pt.cy}
                          x2={pt.cx}
                          y2={pt.instY}
                          stroke={pt.isNearFloor ? '#f59e0b' : '#22d3ee'}
                          strokeWidth="1"
                          strokeDasharray="1.5 1.5"
                          opacity="0.7"
                        />
                        <circle
                          cx={pt.cx}
                          cy={pt.cy}
                          r="3.2"
                          fill={pt.isNearFloor ? '#f59e0b' : '#22d3ee'}
                          stroke="#060911"
                          strokeWidth="1"
                        />
                      </g>
                    ))}
                  </svg>
                </div>
              )}

              {isDecouplingEnabled ? (
                <div className="space-y-3 font-mono tabular-nums">
                  {/* Profile Subtraction Law */}
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1.5">Deconvolution Law</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt'] as const).map(bm => (
                        <button
                          key={bm}
                          type="button"
                          onClick={() => setBroadeningModel(bm)}
                          className={`py-1.5 px-2 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                            broadeningModel === bm
                              ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                              : 'bg-[#0A0E18] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {bm === 'Gaussian' ? 'Gaussian' : bm === 'Lorentzian' ? 'Lorentzian' : 'P-Voigt'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Constant vs Caglioti Switch */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['constant', 'caglioti'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setInstrumentalMode(mode)}
                        className={`py-1.5 px-2 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer ${
                          instrumentalMode === mode
                            ? 'bg-slate-800/90 border-amber-500/50 text-amber-200'
                            : 'bg-[#0A0E18] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'constant' ? 'Constant FWHM' : 'Caglioti (U, V, W)'}
                      </button>
                    ))}
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={String(instFwhm) === 'NaN' ? '' : instFwhm}
                          onChange={e => setInstFwhm(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-3 py-1.5 bg-[#0A0E18] text-amber-300 border border-slate-700 focus:border-amber-400 rounded-md text-xs font-bold outline-none"
                          placeholder="0.10"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                          ° 2θ
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {[0, 0.05, 0.1, 0.12].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setInstFwhm(v)}
                            className={`px-2 py-1.5 rounded-md border text-[10px] cursor-pointer transition-colors ${
                              Math.abs(instFwhm - v) < 1e-4
                                ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 font-bold'
                                : 'bg-[#0A0E18] border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {v === 0 ? '0°' : `${v}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">U (tan²θ)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiU}
                            onChange={e => setCagliotiU(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-[#0A0E18] text-amber-300 border border-slate-700 focus:border-amber-400 rounded-md text-xs font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">V (tanθ)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiV}
                            onChange={e => setCagliotiV(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-[#0A0E18] text-amber-300 border border-slate-700 focus:border-amber-400 rounded-md text-xs font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">W (const)</label>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiW}
                            onChange={e => setCagliotiW(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-[#0A0E18] text-amber-300 border border-slate-700 focus:border-amber-400 rounded-md text-xs font-bold outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                        <span>β_inst(30°) = {evalInstAt(30).toFixed(3)}°</span>
                        <span>β_inst(70°) = {evalInstAt(70).toFixed(3)}°</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: 'Lab XRD', u: 0.005, v: -0.002, w: 0.015 },
                          { label: 'Synchrotron', u: 0.0004, v: -0.0002, w: 0.001 },
                          { label: 'High-Res', u: 0.002, v: -0.001, w: 0.006 }
                        ].map(cp => (
                          <button
                            key={cp.label}
                            type="button"
                            onClick={() => {
                              setCagliotiU(cp.u);
                              setCagliotiV(cp.v);
                              setCagliotiW(cp.w);
                            }}
                            className="py-1 px-1.5 rounded-md bg-[#0A0E18] hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-amber-300 cursor-pointer transition-colors"
                          >
                            {cp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2.5 px-3 bg-[#0A0E18] rounded-md border border-dashed border-slate-700 text-center text-[11px] text-slate-400 font-mono">
                  Deconvolution bypassed (β_sample = β_obs)
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== 03. CONTINUUM ELASTICITY & DEFECT CONSTANTS ==================== */}
        {(configSection === 'all' || configSection === 'elastic') && (
          <section className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span>03. Elasticity, Dislocations &amp; Density</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowDensityExplanation(!showDensityExplanation)}
                  className="text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors"
                  title="Explain density and SSA formula"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsModulusEnabled(!isModulusEnabled)}
                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border transition-colors cursor-pointer ${
                    isModulusEnabled || strainModel === 'USDM' || strainModel === 'UDEDM'
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/45'
                      : 'bg-[#060911] border-slate-700 text-slate-400'
                  }`}
                >
                  {isModulusEnabled || strainModel === 'USDM' || strainModel === 'UDEDM'
                    ? 'Stress ON'
                    : 'Stress Off'}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showDensityExplanation && (
                <motion.div
                  key="wh-density-explanation"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-2.5 bg-[#060911] rounded-md border border-slate-700 text-[11px] space-y-1.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-cyan-300 font-semibold">
                    <span>Elastic &amp; Surface Area Coupling</span>
                    <button
                      type="button"
                      onClick={() => setShowDensityExplanation(false)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="bg-[#0A0E18] p-1.5 rounded text-center text-slate-200 font-mono text-[10px] border border-slate-800">
                    σ = E₀·ε · ρ_WS = 2√3·|ε|/(D·b) · SSA = 6000/(ρ·D)
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3.5 rounded-lg bg-[#060911] border border-slate-800/90 space-y-3 font-mono tabular-nums">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-sans text-[11px] font-medium text-slate-300">
                    Young&apos;s Modulus (E₀)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={youngsModulusGPa}
                      onChange={e => setYoungsModulusGPa(parseFloat(e.target.value) || 130)}
                      className="w-full px-3 py-1.5 bg-[#0A0E18] text-white border border-slate-700 focus:border-cyan-400 rounded-md text-xs font-bold outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                      GPa
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-sans text-[11px] font-medium text-slate-300">
                    Burgers Vector (b)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={burgersVectorNm}
                      onChange={e => setBurgersVectorNm(parseFloat(e.target.value) || 0.25)}
                      className="w-full px-3 py-1.5 bg-[#0A0E18] text-white border border-slate-700 focus:border-cyan-400 rounded-md text-xs font-bold outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                      nm
                    </span>
                  </div>
                </div>
              </div>

              {/* Stiffness Spectrum Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9.5px] text-slate-400">
                  <span>Elastic Stiffness Scale</span>
                  <span className="text-cyan-300 font-semibold">{youngsModulusGPa} GPa</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(4, Math.min(100, (youngsModulusGPa / 400) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Material Density ρ */}
              <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-[11px] font-medium text-slate-300">
                    Material Density (ρ) for SSA
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDensityEnabled(!isDensityEnabled)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                      isDensityEnabled
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/45'
                        : 'bg-[#0A0E18] border-slate-700 text-slate-400'
                    }`}
                  >
                    {isDensityEnabled ? 'SSA ON' : 'Off'}
                  </button>
                </div>
                {isDensityEnabled ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={String(materialDensityGcm3) === 'NaN' ? '' : materialDensityGcm3}
                      onChange={e => setMaterialDensityGcm3(parseFloat(e.target.value) || 2.33)}
                      className="w-full px-3 py-1.5 bg-[#0A0E18] text-white border border-slate-700 focus:border-cyan-400 rounded-md text-xs font-bold outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                      g/cm³
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">SSA calculation disabled</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ==================== 04. DIFFRACTION REFLECTIONS ==================== */}
        {(configSection === 'all' || configSection === 'peaks') && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>04. Diffraction Reflections (2θ, FWHM, hkl)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {parsedPeaks.length} peaks
              </span>
            </div>

            <WHPeakDataManager
              inputData={inputData}
              onInputChange={newVal => setInputData(newVal)}
              wavelength={wavelength}
              constantK={constantK}
              instFwhm={instFwhm}
              isDecouplingEnabled={isDecouplingEnabled}
              broadeningModel={broadeningModel}
              excludedIndices={excludedIndices}
              onToggleExcludePeak={onToggleExcludePeak}
              onSelectPreset={(data, name, ym, den) => {
                setInputData(data);
                if (name) setSelectedMaterial(name);
                if (ym) {
                  setYoungsModulusGPa(ym);
                  setIsModulusEnabled(true);
                }
                if (den) setMaterialDensityGcm3(den);
                setExcludedIndices([]);
                setRecomputeFeedback(null);
              }}
            />
          </section>
        )}
      </div>

      {/* ==================== ANCHORED START CALCULATION COMMAND DOCK ==================== */}
      <div className="p-4 sm:p-5 bg-gradient-to-t from-[#05080F] to-[#080C16] border-t border-slate-800/90 space-y-2.5">
        {hasPendingChanges && !autoCalculate && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/35 text-[11px] font-mono text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Parameters modified — press Start Calculation to solve</span>
          </div>
        )}

        <button
          type="button"
          onClick={onStartCalculation}
          disabled={isCalculating || parsedPeaks.length < 2}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
            hasPendingChanges && !autoCalculate
              ? 'bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35),inset_0_1px_0_rgba(255,255,255,0.45)]'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
          }`}
          title="Validate reflections, sort ascending 2θ, refine anisotropy q (for mWH/Stephens), and compute all 8 Williamson–Hall models"
        >
          {isCalculating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Calculating {strainModel} Fit...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>Start Calculation ({strainModel})</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onAutoOptimizeAll}
          disabled={isCalculating || parsedPeaks.length < 2}
          className="w-full py-2.5 px-3 bg-[#0A0F1B] hover:bg-slate-800/90 text-emerald-300 font-mono font-semibold rounded-lg border border-slate-700/90 hover:border-emerald-500/45 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs whitespace-nowrap"
          title="Optimize dislocation contrast q and apply the highest-R² physically valid Size–Strain model"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Auto-Optimize Best Model &amp; q</span>
        </button>

        {recomputeFeedback && (
          <div className="p-3 rounded-lg bg-[#0A0F1B] border border-cyan-500/35 font-mono text-[10px] space-y-1.5">
            <div className="flex items-center justify-between text-cyan-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Converged · {recomputeFeedback.timestamp}</span>
              </span>
              <button
                type="button"
                onClick={() => setRecomputeFeedback(null)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-200 leading-relaxed tabular-nums">
              {recomputeFeedback.message}
            </p>
            {recomputeFeedback.warnings.length > 0 && (
              <div className="pt-1.5 border-t border-slate-800 space-y-1 text-amber-300 text-[10px]">
                {recomputeFeedback.warnings.map((w, idx) => (
                  <p key={idx}>▲ {w}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
