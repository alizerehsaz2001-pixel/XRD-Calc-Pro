import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  Scale,
  RefreshCw,
  Sliders,
  Check,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import { RIRMatrixPhase } from './RIRMatrixInspector';

export interface CalibDataPoint {
  id: string;
  weightRatio: number; // W_A / W_B
  intensityRatio: number; // I_A / I_B
}

export interface SpikingPoint {
  id: string;
  spikedStandardWtPct: number; // w_s in final blend (wt%)
  measuredIntensityRatio: number; // I_unknown / I_standard
}

interface RIRCalibrationStudioProps {
  phases: RIRMatrixPhase[];
  onApplyRIR: (targetPhaseId: string, calibratedRIR: number) => void;
}

export const RIRCalibrationStudio: React.FC<RIRCalibrationStudioProps> = ({
  phases,
  onApplyRIR
}) => {
  const [calibMode, setCalibMode] = useState<'multi' | 'single' | 'spiking' | 'converter'>('multi');

  // Single Point Mode State
  const [calibIntensityA, setCalibIntensityA] = useState(4800);
  const [calibIntensityB, setCalibIntensityB] = useState(1200);
  const [calibRIRB, setCalibRIRB] = useState(1.0); // Corundum standard
  const [calibWeightRatioAB, setCalibWeightRatioAB] = useState(1.0);

  // Multi Point Mode State
  const [calibPoints, setCalibPoints] = useState<CalibDataPoint[]>([
    { id: '1', weightRatio: 0.25, intensityRatio: 0.85 },
    { id: '2', weightRatio: 0.50, intensityRatio: 1.72 },
    { id: '3', weightRatio: 1.00, intensityRatio: 3.45 },
    { id: '4', weightRatio: 1.50, intensityRatio: 5.15 },
    { id: '5', weightRatio: 2.00, intensityRatio: 6.90 }
  ]);

  // Method of Standard Additions (Multi-Spiking) State
  // Example: Unknown Quartz (RIR=3.41, true orig ~42 wt%) spiked with Corundum (RIR=1.0)
  const [spikingUnknownRir, setSpikingUnknownRir] = useState<number>(3.41);
  const [spikingStdRir, setSpikingStdRir] = useState<number>(1.0);
  const [spikingPoints, setSpikingPoints] = useState<SpikingPoint[]>([
    { id: 's1', spikedStandardWtPct: 5.0, measuredIntensityRatio: 27.1 },
    { id: 's2', spikedStandardWtPct: 10.0, measuredIntensityRatio: 12.8 },
    { id: 's3', spikedStandardWtPct: 15.0, measuredIntensityRatio: 8.1 },
    { id: 's4', spikedStandardWtPct: 20.0, measuredIntensityRatio: 5.7 }
  ]);

  // Target Phase & Application
  const [targetPhaseId, setTargetPhaseId] = useState<string>(phases[0]?.id || '');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Universal Reference Converter State
  const [converterSourceRIR, setConverterSourceRIR] = useState<number>(3.41);
  const [converterSourceRef, setConverterSourceRef] = useState<string>('Corundum');
  const [converterTargetRef, setConverterTargetRef] = useState<string>('Quartz');

  // Single point RIR: RIR_A = RIR_B * (I_A / I_B) / (W_A / W_B)
  const singlePointRIR = useMemo(() => {
    if (calibIntensityB <= 0 || calibWeightRatioAB <= 0) return 0;
    return (calibRIRB * (calibIntensityA / calibIntensityB)) / calibWeightRatioAB;
  }, [calibIntensityA, calibIntensityB, calibRIRB, calibWeightRatioAB]);

  // Multi-point linear regression: y = I_A / I_B, x = W_A / W_B
  const multiPointStats = useMemo(() => {
    if (calibPoints.length < 2) {
      return { slope: 0, intercept: 0, r2: 0, stdErrSlope: 0, calibRIR: 0, stdErrRIR: 0, residuals: [] };
    }
    const n = calibPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    calibPoints.forEach(pt => {
      sumX += pt.weightRatio;
      sumY += pt.intensityRatio;
      sumXY += pt.weightRatio * pt.intensityRatio;
      sumXX += pt.weightRatio * pt.weightRatio;
    });

    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTot = calibPoints.reduce((acc, pt) => acc + Math.pow(pt.intensityRatio - yMean, 2), 0);
    const ssRes = calibPoints.reduce((acc, pt) => acc + Math.pow(pt.intensityRatio - (slope * pt.weightRatio + intercept), 2), 0);
    const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

    const variance = n > 2 ? ssRes / (n - 2) : 0;
    const sxx = sumXX - (sumX * sumX) / n;
    const stdErrSlope = sxx > 0 ? Math.sqrt(variance / sxx) : 0;

    const calibRIR = slope * calibRIRB;
    const stdErrRIR = stdErrSlope * calibRIRB;

    const residuals = calibPoints.map(pt => {
      const fitted = slope * pt.weightRatio + intercept;
      return {
        id: pt.id,
        weightRatio: pt.weightRatio,
        measured: pt.intensityRatio,
        fitted: Number(fitted.toFixed(3)),
        residual: Number((pt.intensityRatio - fitted).toFixed(4))
      };
    });

    return { slope, intercept, r2, stdErrSlope, calibRIR, stdErrRIR, residuals };
  }, [calibPoints, calibRIRB]);

  // Combined regression line + actual scatter points for ComposedChart
  const regressionChartData = useMemo(() => {
    if (calibPoints.length < 2) return [];
    const sorted = [...calibPoints].sort((a, b) => a.weightRatio - b.weightRatio);
    const xs = sorted.map(p => p.weightRatio);
    const minX = Math.max(0, Math.min(...xs) * 0.75);
    const maxX = Math.max(...xs) * 1.15;
    const gridPts = new Set<number>();

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      gridPts.add(Number((minX + (i / steps) * (maxX - minX)).toFixed(3)));
    }
    sorted.forEach(p => gridPts.add(Number(p.weightRatio.toFixed(3))));

    const xArr = Array.from(gridPts).sort((a, b) => a - b);
    const ptMap = new Map<number, number>();
    sorted.forEach(p => ptMap.set(Number(p.weightRatio.toFixed(3)), p.intensityRatio));

    return xArr.map(x => {
      const fitted = multiPointStats.slope * x + multiPointStats.intercept;
      const ci95 = 1.96 * multiPointStats.stdErrSlope * Math.max(0.05, x);
      const measuredVal = ptMap.has(x) ? ptMap.get(x)! : null;
      return {
        weightRatio: x,
        fittedRatio: Number(fitted.toFixed(3)),
        ciUpper: Number((fitted + ci95).toFixed(3)),
        ciLower: Number(Math.max(0, fitted - ci95).toFixed(3)),
        measuredRatio: measuredVal
      };
    });
  }, [calibPoints, multiPointStats]);

  // Multi-point operations
  const addCalibPoint = () => {
    playSynthTone('tick');
    const last = calibPoints[calibPoints.length - 1];
    const newX = last ? Number((last.weightRatio + 0.5).toFixed(2)) : 1.0;
    const newY = last ? Number((multiPointStats.slope * newX + multiPointStats.intercept).toFixed(2)) : 3.0;
    setCalibPoints(prev => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), weightRatio: newX, intensityRatio: newY }
    ]);
  };

  const removeCalibPoint = (id: string) => {
    playSynthTone('tick');
    setCalibPoints(prev => prev.filter(p => p.id !== id));
  };

  const updateCalibPoint = (id: string, field: 'weightRatio' | 'intensityRatio', val: number) => {
    setCalibPoints(prev => prev.map(p => (p.id === id ? { ...p, [field]: val } : p)));
  };

  // Standard Additions / Multi-Spiking Rigorous Regression
  // w_s in final blend => mass ratio added per 100g orig sample: X_s = 100 * w_s / (100 - w_s)
  // Y = (I_std / I_unk) * (RIR_unk / RIR_std) = (1 / w_unk_orig_pct) * X_s
  // Slope m = 1 / w_unk_orig_pct => w_unk_orig_pct = 1 / m (in %, or fraction * 100)
  const spikingStats = useMemo(() => {
    const validPts = spikingPoints.filter(p => p.spikedStandardWtPct > 0 && p.spikedStandardWtPct < 99 && p.measuredIntensityRatio > 0);
    if (validPts.length < 2) {
      return { slope: 0, intercept: 0, r2: 0, estimatedUnknownWtPct: 0, chartData: [] };
    }

    const rirScale = (spikingUnknownRir > 0 ? spikingUnknownRir : 1.0) / (spikingStdRir > 0 ? spikingStdRir : 1.0);
    const pts = validPts
      .map(p => {
        const xBlendRatio = p.spikedStandardWtPct / (100 - p.spikedStandardWtPct); // w_s / (1 - w_s)
        const yScaledIntRatio = (1 / p.measuredIntensityRatio) * rirScale; // (I_std / I_unk) * (K_unk / K_std)
        return {
          x: Number(xBlendRatio.toFixed(4)),
          y: Number(yScaledIntRatio.toFixed(4)),
          ws: p.spikedStandardWtPct
        };
      })
      .sort((a, b) => a.x - b.x);

    const n = pts.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    pts.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const denom = n * sumXX - sumX * sumX;
    const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssTot = pts.reduce((acc, p) => acc + Math.pow(p.y - yMean, 2), 0);
    const ssRes = pts.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

    // Since Y = (1 / w_unk_orig) * X  (where w_unk_orig is fractional 0..1)
    const estimatedUnknownWtPct = slope > 0 ? Math.min(100, Math.max(0, (1 / slope) * 100)) : 0;

    const chartData = pts.map(p => ({
      x: p.x,
      measuredY: p.y,
      fittedY: Number((slope * p.x + intercept).toFixed(4))
    }));

    return { slope, intercept, r2, estimatedUnknownWtPct, chartData };
  }, [spikingPoints, spikingUnknownRir, spikingStdRir]);

  const handleApply = (rirValue: number) => {
    const target = targetPhaseId || phases[0]?.id || '';
    if (!target) return;
    playSynthTone('success');
    const rounded = Number(rirValue.toFixed(2));
    onApplyRIR(target, rounded);
    const pName = phases.find(p => p.id === target)?.name || 'Phase';
    setAppliedNotification(`Applied RIR = ${rounded.toFixed(2)} to ${pName}.`);
    setTimeout(() => setAppliedNotification(null), 4000);
  };

  const REF_STANDARDS: Record<string, number> = {
    Corundum: 1.0,
    Quartz: 3.41,
    Silicon: 4.7,
    Zincite: 5.43,
    Calcite: 2.98,
    Magnetite: 4.8
  };

  const convertedRIR = useMemo(() => {
    const rirSrcBase = REF_STANDARDS[converterSourceRef] || 1.0;
    const rirTgtBase = REF_STANDARDS[converterTargetRef] || 1.0;
    const rirCorundum = converterSourceRIR * rirSrcBase;
    return rirCorundum / rirTgtBase;
  }, [converterSourceRIR, converterSourceRef, converterTargetRef]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-2xl flex flex-col gap-5 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 tracking-tight">
              RIR Calibration &amp; Standard Additions Studio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibrate empirical <span className="font-mono text-slate-200">I/I<sub>c</sub></span> values from multi-point linear regressions, 1:1 binary standards, or spiking curves.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-slate-950/90 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1">
          {[
            { id: 'multi', label: 'Multi-Point Linear' },
            { id: 'single', label: 'Single-Point (1:1)' },
            { id: 'spiking', label: 'Standard Additions' },
            { id: 'converter', label: 'Reference Converter' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => {
                playSynthTone('tick');
                setCalibMode(m.id as 'multi' | 'single' | 'spiking' | 'converter');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                calibMode === m.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification */}
      {appliedNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
          <button onClick={() => setAppliedNotification(null)} className="text-emerald-400 hover:text-emerald-200 font-bold">✕</button>
        </div>
      )}

      {/* MODE 1: Multi-Point Linear Calibration */}
      {calibMode === 'multi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Calibration Data Pairs</span>
                </span>
                <button
                  onClick={addCalibPoint}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pair</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2">
                  <span className="col-span-5">Mass Ratio (W<sub>A</sub>/W<sub>B</sub>)</span>
                  <span className="col-span-5">Peak Int. (I<sub>A</sub>/I<sub>B</sub>)</span>
                  <span className="col-span-2 text-center">Del</span>
                </div>

                {calibPoints.map(pt => (
                  <div key={pt.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <input
                      type="number"
                      step="0.1"
                      value={pt.weightRatio}
                      onChange={e => updateCalibPoint(pt.id, 'weightRatio', parseFloat(e.target.value) || 0)}
                      className="col-span-5 bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2 py-1 text-xs font-mono tabular-nums outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={pt.intensityRatio}
                      onChange={e => updateCalibPoint(pt.id, 'intensityRatio', parseFloat(e.target.value) || 0)}
                      className="col-span-5 bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2 py-1 text-xs font-mono tabular-nums outline-none focus:border-amber-500"
                    />
                    <div className="col-span-2 flex justify-center">
                      {calibPoints.length > 2 && (
                        <button
                          onClick={() => removeCalibPoint(pt.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Standard Reference RIR (RIR<sub>B</sub>):</span>
                  <span className="font-mono tabular-nums font-bold text-amber-300">{calibRIRB.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  value={calibRIRB}
                  onChange={e => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assign Calibrated RIR to Active Phase:
                </label>
                <select
                  value={targetPhaseId}
                  onChange={e => setTargetPhaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                >
                  {phases.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current RIR: {p.rir})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleApply(multiPointStats.calibRIR)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Calibrated RIR ({multiPointStats.calibRIR.toFixed(2)})</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Calibrated RIR</span>
                <span className="text-lg font-black font-mono tabular-nums text-amber-400 mt-0.5 block">
                  {multiPointStats.calibRIR.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400"> ± {multiPointStats.stdErrRIR.toFixed(2)}</span>
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Goodness R²</span>
                <span className="text-lg font-black font-mono tabular-nums text-emerald-400 mt-0.5 block">
                  {(multiPointStats.r2 * 100).toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Slope (m)</span>
                <span className="text-lg font-black font-mono tabular-nums text-indigo-400 mt-0.5 block">
                  {multiPointStats.slope.toFixed(3)}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Intercept (c)</span>
                <span className="text-lg font-black font-mono tabular-nums text-slate-300 mt-0.5 block">
                  {multiPointStats.intercept.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">
                  Linear Calibration Fit: I<sub>A</sub>/I<sub>B</sub> = (RIR<sub>A</sub>/RIR<sub>B</sub>) · (W<sub>A</sub>/W<sub>B</sub>)
                </span>
                <span className="text-[11px] font-mono tabular-nums text-amber-400 font-bold">
                  y = {multiPointStats.slope.toFixed(3)}x {multiPointStats.intercept >= 0 ? '+' : ''} {multiPointStats.intercept.toFixed(3)}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={regressionChartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                    <XAxis
                      dataKey="weightRatio"
                      type="number"
                      domain={['auto', 'auto']}
                      stroke="#94a3b8"
                      fontSize={11}
                      label={{ value: 'Mass Ratio (W_A / W_B)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      label={{ value: 'Intensity Ratio (I_A / I_B)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-mono tabular-nums text-slate-200">
                              <div>Mass Ratio: <strong>{d.weightRatio}</strong></div>
                              <div className="text-amber-400">Fitted OLS: <strong>{d.fittedRatio}</strong></div>
                              {d.measuredRatio !== null && (
                                <div className="text-emerald-400">Measured: <strong>{d.measuredRatio}</strong></div>
                              )}
                              <div className="text-slate-400 text-[10px]">95% CI: [{d.ciLower} – {d.ciUpper}]</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="ciUpper" stroke="#f59e0b" strokeDasharray="3 3" dot={false} strokeOpacity={0.35} isAnimationActive={false} />
                    <Line type="monotone" dataKey="ciLower" stroke="#f59e0b" strokeDasharray="3 3" dot={false} strokeOpacity={0.35} isAnimationActive={false} />
                    <Line type="monotone" dataKey="fittedRatio" stroke="#f59e0b" strokeWidth={2.2} dot={false} isAnimationActive={false} />
                    <Scatter dataKey="measuredRatio" fill="#10b981" name="Measured Pairs" isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Single Point (1:1 Mixture) Calibration */}
      {calibMode === 'single' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Single 1:1 Standard Mixture Inputs</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Analyte Peak Area (I<sub>A</sub>)</label>
                <input
                  type="number"
                  value={calibIntensityA}
                  onChange={e => setCalibIntensityA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono tabular-nums outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Standard Peak Area (I<sub>B</sub>)</label>
                <input
                  type="number"
                  value={calibIntensityB}
                  onChange={e => setCalibIntensityB(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono tabular-nums outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Standard RIR (RIR<sub>B</sub>)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calibRIRB}
                  onChange={e => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono tabular-nums outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Mass Ratio (W<sub>A</sub> / W<sub>B</sub>)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calibWeightRatioAB}
                  onChange={e => setCalibWeightRatioAB(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-mono tabular-nums outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block">Calculated Reference Ratio</span>
              <div className="text-3xl font-black font-mono tabular-nums text-amber-400 mt-2">
                RIR = {singlePointRIR.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Empirical Corundum ratio: RIR<sub>A</sub> = RIR<sub>B</sub> · (I<sub>A</sub> / I<sub>B</sub>) / (W<sub>A</sub> / W<sub>B</sub>).
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">Target Phase to Update:</label>
              <select
                value={targetPhaseId}
                onChange={e => setTargetPhaseId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (RIR: {p.rir})</option>
                ))}
              </select>

              <button
                onClick={() => handleApply(singlePointRIR)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply Single-Point RIR ({singlePointRIR.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Method of Standard Additions */}
      {calibMode === 'spiking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>Multi-Spiking Standard Additions</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Unknown RIR (K<sub>unk</sub>)</label>
                <input
                  type="number"
                  step="0.05"
                  value={spikingUnknownRir}
                  onChange={e => setSpikingUnknownRir(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono tabular-nums outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Spike Std RIR (K<sub>std</sub>)</label>
                <input
                  type="number"
                  step="0.05"
                  value={spikingStdRir}
                  onChange={e => setSpikingStdRir(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono tabular-nums outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2">
                <span className="col-span-6">Spike in Blend w<sub>s</sub> (wt%)</span>
                <span className="col-span-6">Measured (I<sub>unk</sub> / I<sub>std</sub>)</span>
              </div>
              {spikingPoints.map(sp => (
                <div key={sp.id} className="grid grid-cols-12 gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <input
                    type="number"
                    step="1"
                    value={sp.spikedStandardWtPct}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setSpikingPoints(prev => prev.map(p => (p.id === sp.id ? { ...p, spikedStandardWtPct: val } : p)));
                    }}
                    className="col-span-6 bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1 text-xs font-mono tabular-nums outline-none"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={sp.measuredIntensityRatio}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setSpikingPoints(prev => prev.map(p => (p.id === sp.id ? { ...p, measuredIntensityRatio: val } : p)));
                    }}
                    className="col-span-6 bg-slate-950 border border-slate-700 text-slate-200 rounded-md px-2.5 py-1 text-xs font-mono tabular-nums outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Original Analyte</span>
                <div className="text-2xl font-black font-mono tabular-nums text-emerald-400 mt-0.5">
                  {spikingStats.estimatedUnknownWtPct.toFixed(1)} wt%
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Additions Slope (1/w)</span>
                <div className="text-lg font-bold font-mono tabular-nums text-amber-400 mt-0.5">
                  {spikingStats.slope.toFixed(3)}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Regression R²</span>
                <div className="text-lg font-bold font-mono tabular-nums text-cyan-400 mt-0.5">
                  {(spikingStats.r2 * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spikingStats.chartData} margin={{ top: 8, right: 20, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                  <XAxis
                    dataKey="x"
                    stroke="#94a3b8"
                    fontSize={10}
                    label={{ value: 'Spike Mass Ratio w_s / (1 - w_s)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    label={{ value: '(I_std / I_unk) · (K_unk / K_std)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="fittedY" stroke="#f59e0b" strokeWidth={2} dot={false} name="OLS Fit" isAnimationActive={false} />
                  <Line type="monotone" dataKey="measuredY" stroke="#10b981" strokeWidth={0} dot={{ r: 4, fill: '#10b981' }} name="Measured" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: Universal Reference Standard Converter */}
      {calibMode === 'converter' && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Universal Reference Ratio Conversion Matrix</h3>
              <p className="text-xs text-slate-400">Convert RIR values cleanly between Corundum (α-Al₂O₃), Quartz, Silicon, and Zincite standards.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">Source Reference Standard</label>
              <select
                value={converterSourceRef}
                onChange={e => setConverterSourceRef(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
              >
                {Object.keys(REF_STANDARDS).map(std => (
                  <option key={std} value={std}>{std} (RIR: {REF_STANDARDS[std]})</option>
                ))}
              </select>
              <input
                type="number"
                step="0.05"
                value={converterSourceRIR}
                onChange={e => setConverterSourceRIR(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums outline-none"
                placeholder="Source RIR value"
              />
            </div>

            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">Target Reference Standard</label>
              <select
                value={converterTargetRef}
                onChange={e => setConverterTargetRef(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none"
              >
                {Object.keys(REF_STANDARDS).map(std => (
                  <option key={std} value={std}>{std} (RIR: {REF_STANDARDS[std]})</option>
                ))}
              </select>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Converted RIR (I / I<sub>target</sub>)</span>
                <span className="text-2xl font-black font-mono tabular-nums text-amber-400">{convertedRIR.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
