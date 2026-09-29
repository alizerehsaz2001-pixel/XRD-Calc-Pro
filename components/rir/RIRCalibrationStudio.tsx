import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Scale,
  FlaskConical,
  BookOpen,
  Info,
  RefreshCw,
  Sliders,
  Check,
  Zap,
  HelpCircle,
  Download,
  Copy,
  ArrowRight,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import { RIRMatrixPhase } from './RIRMatrixInspector';
import { DATABASE_PRESETS } from './RIRDatabaseExplorer';

export interface CalibDataPoint {
  id: string;
  weightRatio: number; // W_A / W_B (e.g. Analyte / Standard mass ratio)
  intensityRatio: number; // I_A / I_B (measured peak intensity ratio)
}

export interface SpikingPoint {
  id: string;
  spikedStandardWtPct: number; // w_s (e.g., 5%, 10%, 15%, 20%)
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
  const [calibWeightRatioAB, setCalibWeightRatioAB] = useState(1.0); // 1:1 mixture

  // Multi Point Mode State
  const [calibPoints, setCalibPoints] = useState<CalibDataPoint[]>([
    { id: '1', weightRatio: 0.25, intensityRatio: 0.85 },
    { id: '2', weightRatio: 0.50, intensityRatio: 1.72 },
    { id: '3', weightRatio: 1.00, intensityRatio: 3.45 },
    { id: '4', weightRatio: 1.50, intensityRatio: 5.15 },
    { id: '5', weightRatio: 2.00, intensityRatio: 6.90 },
  ]);

  // Method of Standard Additions (Multi-Spiking) State
  const [spikingPoints, setSpikingPoints] = useState<SpikingPoint[]>([
    { id: 's1', spikedStandardWtPct: 5.0, measuredIntensityRatio: 4.80 },
    { id: 's2', spikedStandardWtPct: 10.0, measuredIntensityRatio: 2.35 },
    { id: 's3', spikedStandardWtPct: 15.0, measuredIntensityRatio: 1.52 },
    { id: 's4', spikedStandardWtPct: 20.0, measuredIntensityRatio: 1.10 },
  ]);

  // Target Phase & Application
  const [targetPhaseId, setTargetPhaseId] = useState<string>(phases[0]?.id || '');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Universal Reference Converter State
  const [converterSourceRIR, setConverterSourceRIR] = useState<number>(3.41); // Quartz
  const [converterSourceRef, setConverterSourceRef] = useState<string>('Corundum');
  const [converterTargetRef, setConverterTargetRef] = useState<string>('Quartz');

  // Single point calculated RIR:
  // (I_A / I_B) = (RIR_A / RIR_B) * (W_A / W_B) => RIR_A = RIR_B * (I_A / I_B) / (W_A / W_B)
  const singlePointRIR = useMemo(() => {
    if (calibIntensityB <= 0 || calibWeightRatioAB <= 0) return 0;
    return calibRIRB * (calibIntensityA / calibIntensityB) / calibWeightRatioAB;
  }, [calibIntensityA, calibIntensityB, calibRIRB, calibWeightRatioAB]);

  // Multi-point linear regression:
  // y = I_A / I_B, x = W_A / W_B
  // slope m = RIR_A / RIR_B => RIR_A = m * RIR_B
  const multiPointStats = useMemo(() => {
    if (calibPoints.length < 2) {
      return { slope: 0, intercept: 0, r2: 0, stdErrSlope: 0, calibRIR: 0, stdErrRIR: 0, residuals: [] };
    }
    const n = calibPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
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
    const stdErrSlope = denominator > 0 ? Math.sqrt(variance / (sumXX - (sumX * sumX) / n)) : 0;

    const calibRIR = slope * calibRIRB;
    const stdErrRIR = stdErrSlope * calibRIRB;

    const residuals = calibPoints.map(pt => {
      const fitted = slope * pt.weightRatio + intercept;
      const res = pt.intensityRatio - fitted;
      return {
        id: pt.id,
        weightRatio: pt.weightRatio,
        measured: pt.intensityRatio,
        fitted: Number(fitted.toFixed(3)),
        residual: Number(res.toFixed(4))
      };
    });

    return { slope, intercept, r2, stdErrSlope, calibRIR, stdErrRIR, residuals };
  }, [calibPoints, calibRIRB]);

  // Fitted regression line points for charting
  const regressionChartData = useMemo(() => {
    if (calibPoints.length < 2) return [];
    const xs = calibPoints.map(p => p.weightRatio);
    const minX = Math.max(0, Math.min(...xs) * 0.7);
    const maxX = Math.max(...xs) * 1.25;
    const numPts = 25;
    const step = (maxX - minX) / (numPts - 1);

    const pts: any[] = [];
    for (let i = 0; i < numPts; i++) {
      const x = minX + i * step;
      const fitted = multiPointStats.slope * x + multiPointStats.intercept;
      const ci95 = 1.96 * multiPointStats.stdErrSlope * x;
      pts.push({
        weightRatio: Number(x.toFixed(3)),
        fittedRatio: Number(fitted.toFixed(3)),
        ciUpper: Number((fitted + ci95).toFixed(3)),
        ciLower: Number(Math.max(0, fitted - ci95).toFixed(3))
      });
    }
    return pts;
  }, [calibPoints, multiPointStats]);

  // Multi-point table operations
  const addCalibPoint = () => {
    playSynthTone('tick');
    const last = calibPoints[calibPoints.length - 1];
    const newX = last ? Number((last.weightRatio + 0.5).toFixed(2)) : 1.0;
    const newY = last ? Number((last.intensityRatio * 1.4).toFixed(2)) : 3.0;
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
    setCalibPoints(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  // Standard Additions / Multi-Spiking Regression
  const spikingStats = useMemo(() => {
    // In standard addition: (I_std / I_unknown) * (RIR_unknown / RIR_std) = w_s / w_unknown
    // Let Y = 1 / (I_unknown / I_std) = I_std / I_unknown, X = w_s (wt%)
    // Y = (RIR_std / (RIR_unknown * w_unknown)) * w_s
    const pts = spikingPoints.map(p => ({
      x: p.spikedStandardWtPct,
      y: p.measuredIntensityRatio > 0 ? 1 / p.measuredIntensityRatio : 0
    }));

    if (pts.length < 2) return { slope: 0, intercept: 0, r2: 0, estimatedUnknownWtPct: 0 };

    const n = pts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
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

    // Unknown wt% in original mixture = (1 / slope) * (RIR_std / RIR_unknown)
    const estimatedUnknownWtPct = slope > 0 ? Math.min(100, Math.max(0, 1 / slope)) : 0;

    return { slope, intercept, r2, estimatedUnknownWtPct };
  }, [spikingPoints]);

  const handleApply = (rirValue: number) => {
    const target = targetPhaseId || (phases[0]?.id || '');
    if (!target) return;
    playSynthTone('success');
    const rounded = Number(rirValue.toFixed(2));
    onApplyRIR(target, rounded);
    const pName = phases.find(p => p.id === target)?.name || 'Phase';
    setAppliedNotification(`Successfully applied RIR = ${rounded} to ${pName}!`);
    setTimeout(() => setAppliedNotification(null), 4000);
  };

  // Reference standards mapping for Universal Converter
  const REF_STANDARDS: Record<string, number> = {
    'Corundum': 1.00,
    'Quartz': 3.41,
    'Silicon': 4.70,
    'Zincite': 5.43,
    'Calcite': 2.98,
    'Magnetite': 4.80
  };

  const convertedRIR = useMemo(() => {
    const rirSrcBase = REF_STANDARDS[converterSourceRef] || 1.0;
    const rirTgtBase = REF_STANDARDS[converterTargetRef] || 1.0;
    // RIR_cor = RIR_src * rirSrcBase
    // RIR_tgt = RIR_cor / rirTgtBase
    const rirCorundum = converterSourceRIR * rirSrcBase;
    return rirCorundum / rirTgtBase;
  }, [converterSourceRIR, converterSourceRef, converterTargetRef]);

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              RIR Calibration & Spiking Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Calibrate empirical $I/I_c$ values from laboratory standards using single-point binary mixtures, multi-point linear regressions, or standard addition spiking curves.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-inner">
          <button
            onClick={() => { playSynthTone('tick'); setCalibMode('multi'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              calibMode === 'multi'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Multi-Point Linear
          </button>
          <button
            onClick={() => { playSynthTone('tick'); setCalibMode('single'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              calibMode === 'single'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Single-Point (1:1)
          </button>
          <button
            onClick={() => { playSynthTone('tick'); setCalibMode('spiking'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              calibMode === 'spiking'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Standard Additions
          </button>
          <button
            onClick={() => { playSynthTone('tick'); setCalibMode('converter'); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              calibMode === 'converter'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Universal Converter
          </button>
        </div>
      </div>

      {/* Notification */}
      {appliedNotification && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{appliedNotification}</span>
          </div>
          <button onClick={() => setAppliedNotification(null)} className="text-emerald-400 hover:text-emerald-200 font-bold">✕</button>
        </div>
      )}

      {/* MODE 1: Multi-Point Linear Calibration */}
      {calibMode === 'multi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Left Column: Data Points Table & Target Phase (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Calibration Data Pairs</span>
                </span>
                <button
                  onClick={addCalibPoint}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pair</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2">
                  <span className="col-span-5">Mass Ratio ($W_A/W_B$)</span>
                  <span className="col-span-5">Peak Int. ($I_A/I_B$)</span>
                  <span className="col-span-2 text-center">Action</span>
                </div>

                {calibPoints.map((pt, idx) => (
                  <div key={pt.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <input
                      type="number"
                      step="0.1"
                      value={pt.weightRatio}
                      onChange={(e) => updateCalibPoint(pt.id, 'weightRatio', parseFloat(e.target.value) || 0)}
                      className="col-span-5 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={pt.intensityRatio}
                      onChange={(e) => updateCalibPoint(pt.id, 'intensityRatio', parseFloat(e.target.value) || 0)}
                      className="col-span-5 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-amber-500"
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

              {/* Standard RIR Reference Value */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Standard Phase RIR ($RIR_B$):</span>
                  <span className="font-mono font-bold text-amber-300">{calibRIRB.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  step="0.05"
                  value={calibRIRB}
                  onChange={(e) => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono outline-none focus:border-amber-500"
                />
              </div>

              {/* Target Phase in Active Mixture */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assign Calibrated RIR to Active Phase:
                </label>
                <select
                  value={targetPhaseId}
                  onChange={(e) => setTargetPhaseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
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

          {/* Right Column: Regression Plot & Live Statistics (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Stats Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Calibrated RIR</span>
                <span className="text-xl font-black font-mono text-amber-400 mt-0.5 block">
                  {multiPointStats.calibRIR.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400"> ± {multiPointStats.stdErrRIR.toFixed(2)}</span>
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Goodness $R^2$</span>
                <span className="text-xl font-black font-mono text-emerald-400 mt-0.5 block">
                  {(multiPointStats.r2 * 100).toFixed(2)}%
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Slope ($m$)</span>
                <span className="text-lg font-black font-mono text-indigo-400 mt-0.5 block">
                  {multiPointStats.slope.toFixed(3)}
                </span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Intercept ($c$)</span>
                <span className="text-lg font-black font-mono text-slate-300 mt-0.5 block">
                  {multiPointStats.intercept.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Regression Chart */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">
                  Linear Calibration Curve: (I_A / I_B) = (RIR_A / RIR_B) · (W_A / W_B)
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  y = {multiPointStats.slope.toFixed(2)}x {multiPointStats.intercept >= 0 ? '+' : ''} {multiPointStats.intercept.toFixed(2)}
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={regressionChartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis
                      dataKey="weightRatio"
                      stroke="#94a3b8"
                      label={{ value: 'Mass Ratio (W_A / W_B)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      label={{ value: 'Intensity Ratio (I_A / I_B)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-mono text-slate-200">
                              <div>Mass Ratio: <strong>{d.weightRatio}</strong></div>
                              <div className="text-amber-400">Fitted Ratio: <strong>{d.fittedRatio}</strong></div>
                              <div className="text-slate-400 text-[10px]">95% CI: [{d.ciLower} - {d.ciUpper}]</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="ciUpper" stroke="#f59e0b" strokeDasharray="2 2" dot={false} strokeOpacity={0.4} />
                    <Line type="monotone" dataKey="ciLower" stroke="#f59e0b" strokeDasharray="2 2" dot={false} strokeOpacity={0.4} />
                    <Line type="monotone" dataKey="fittedRatio" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: Single Point (1:1 Mixture) Calibration */}
      {calibMode === 'single' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Single 1:1 Standard Mixture Inputs</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Analyte Peak Area ($I_A$)</label>
                <input
                  type="number"
                  value={calibIntensityA}
                  onChange={(e) => setCalibIntensityA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Standard Peak Area ($I_B$)</label>
                <input
                  type="number"
                  value={calibIntensityB}
                  onChange={(e) => setCalibIntensityB(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Standard RIR ($RIR_B$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calibRIRB}
                  onChange={(e) => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Mass Ratio ($W_A / W_B$)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calibWeightRatioAB}
                  onChange={(e) => setCalibWeightRatioAB(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block">Calculated Reference Ratio</span>
              <div className="text-3xl font-black font-mono text-amber-400 mt-2">
                RIR = {singlePointRIR.toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Empirical Corundum ratio determined from 1:1 binary mixture: RIR_A = RIR_B · (I_A / I_B) / (W_A / W_B).
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">Target Phase to Update:</label>
              <select
                value={targetPhaseId}
                onChange={(e) => setTargetPhaseId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Multi-Spiking Additions Matrix</span>
            </h3>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-slate-500 px-2">
                <span className="col-span-6">Added Standard (w_s wt%)</span>
                <span className="col-span-6">Peak Ratio (I_unk / I_std)</span>
              </div>
              {spikingPoints.map((sp) => (
                <div key={sp.id} className="grid grid-cols-12 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="number"
                    step="1"
                    value={sp.spikedStandardWtPct}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSpikingPoints(prev => prev.map(p => p.id === sp.id ? { ...p, spikedStandardWtPct: val } : p));
                    }}
                    className="col-span-6 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono outline-none"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={sp.measuredIntensityRatio}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSpikingPoints(prev => prev.map(p => p.id === sp.id ? { ...p, measuredIntensityRatio: val } : p));
                    }}
                    className="col-span-6 bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-950/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 block">Extrapolated Original Sample Fraction</span>
              <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
                {spikingStats.estimatedUnknownWtPct.toFixed(1)} wt%
              </div>
              <div className="text-xs text-slate-400 mt-2">
                Determined by linear regression of reciprocal intensity ratio 1/(I_unk/I_std) against spiked standard mass percentage (R² = {(spikingStats.r2 * 100).toFixed(1)}%).
              </div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>Standard Additions Slope:</span>
                <span className="font-mono text-amber-400 font-bold">{spikingStats.slope.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Linear Regression $R^2$:</span>
                <span className="font-mono text-emerald-400 font-bold">{(spikingStats.r2 * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: Universal Reference Standard Converter */}
      {calibMode === 'converter' && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-6 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Universal Reference Ratio Conversion Matrix</h3>
              <p className="text-xs text-slate-400">Convert RIR values between Corundum (α-Al₂O₃), Quartz, Silicon, and Zincite standards.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">Source Reference Standard</label>
              <select
                value={converterSourceRef}
                onChange={(e) => setConverterSourceRef(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                {Object.keys(REF_STANDARDS).map(std => (
                  <option key={std} value={std}>{std} (RIR: {REF_STANDARDS[std]})</option>
                ))}
              </select>
              <input
                type="number"
                step="0.05"
                value={converterSourceRIR}
                onChange={(e) => setConverterSourceRIR(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono outline-none"
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
                onChange={(e) => setConverterTargetRef(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                {Object.keys(REF_STANDARDS).map(std => (
                  <option key={std} value={std}>{std} (RIR: {REF_STANDARDS[std]})</option>
                ))}
              </select>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Converted RIR (I / I_target)</span>
                <span className="text-2xl font-black font-mono text-amber-400">{convertedRIR.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
