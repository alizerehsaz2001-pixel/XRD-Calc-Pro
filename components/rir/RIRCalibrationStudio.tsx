import React, { useState, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
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
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Scatter,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import { RIRMatrixPhase } from './RIRMatrixInspector';

export interface CalibDataPoint {
  id: string;
  weightRatio: number; // W_A / W_B (e.g. Analyte / Standard mass ratio)
  intensityRatio: number; // I_A / I_B (measured peak intensity ratio)
}

interface RIRCalibrationStudioProps {
  phases: RIRMatrixPhase[];
  onApplyRIR: (targetPhaseId: string, calibratedRIR: number) => void;
}

export const RIRCalibrationStudio: React.FC<RIRCalibrationStudioProps> = ({
  phases,
  onApplyRIR
}) => {
  const [calibMode, setCalibMode] = useState<'single' | 'multi' | 'spiking'>('multi');

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

  // Spiking / Internal Standard State
  const [spikeAddedWtPct, setSpikeAddedWtPct] = useState(15.0); // 15 wt% Corundum standard added
  const [spikeStdPhaseRIR, setSpikeStdPhaseRIR] = useState(1.00);
  const [spikeStdIntensity, setSpikeStdIntensity] = useState(2500);
  const [targetPhaseId, setTargetPhaseId] = useState<string>(phases[0]?.id || '');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

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
      return { slope: 0, intercept: 0, r2: 0, stdErr: 0, calibRIR: 0, residuals: [] };
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

    const residuals = calibPoints.map(pt => ({
      weightRatio: pt.weightRatio,
      residual: Number((pt.intensityRatio - (slope * pt.weightRatio + intercept)).toFixed(4))
    }));

    return { slope, intercept, r2, stdErr: stdErrSlope, calibRIR, stdErrRIR, residuals };
  }, [calibPoints, calibRIRB]);

  // Fitted regression line points
  const regressionLineData = useMemo(() => {
    if (calibPoints.length < 2) return [];
    const xs = calibPoints.map(p => p.weightRatio);
    const minX = Math.max(0, Math.min(...xs) * 0.8);
    const maxX = Math.max(...xs) * 1.2;
    const step = (maxX - minX) / 20;
    const pts = [];
    for (let x = minX; x <= maxX; x += step) {
      pts.push({
        weightRatio: Number(x.toFixed(3)),
        fittedRatio: Number((multiPointStats.slope * x + multiPointStats.intercept).toFixed(3))
      });
    }
    return pts;
  }, [calibPoints, multiPointStats]);

  // Spiking Absolute Analysis
  const spikingResults = useMemo(() => {
    // When adding w_s of standard with RIR_s, intensity I_s:
    // for each phase i: W_i = (I_i / I_s) * (RIR_s / RIR_i) * w_s / (1 - w_s/100)
    const stdInt = spikeStdIntensity > 0 ? spikeStdIntensity : 1;
    const stdRir = spikeStdPhaseRIR > 0 ? spikeStdPhaseRIR : 1;
    const w_s_fraction = spikeAddedWtPct / 100;
    const originalMassFactor = 1 / (1 - Math.min(0.9, Math.max(0.01, w_s_fraction)));

    let totalCrystallineAbsolute = 0;
    const phaseAbsolute = phases.map(p => {
      const pRir = p.rir > 0 ? p.rir : 1.0;
      const absInMixture = (p.intensity / stdInt) * (stdRir / pRir) * spikeAddedWtPct;
      const absInOriginalSample = absInMixture * originalMassFactor;
      totalCrystallineAbsolute += absInOriginalSample;
      return {
        ...p,
        absInMixture,
        absInOriginalSample
      };
    });

    const amorphousAbsolute = Math.max(0, 100 - totalCrystallineAbsolute);

    return {
      phaseAbsolute,
      totalCrystallineAbsolute,
      amorphousAbsolute
    };
  }, [phases, spikeAddedWtPct, spikeStdPhaseRIR, spikeStdIntensity]);

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
              Calibrate empirical $I/I_c$ values from laboratory standards using single-point binary mixtures or multi-point linear regressions.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl flex gap-1.5 shadow-inner">
          <button
            onClick={() => { playSynthTone('tick'); setCalibMode('multi'); }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              calibMode === 'multi'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Multi-Point Linear
          </button>
          <button
            onClick={() => { playSynthTone('tick'); setCalibMode('single'); }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              calibMode === 'single'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Single-Point (1:1)
          </button>
          <button
            onClick={() => { playSynthTone('tick'); setCalibMode('spiking'); }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              calibMode === 'spiking'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Spiking Method
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
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Point Inputs */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-bold text-slate-200 text-sm block">Standard Mixture Datasets</span>
                    <span className="text-[11px] text-slate-400">$(W_A/W_B)$ vs $(I_A/I_B)$ data points</span>
                  </div>
                  <button
                    onClick={() => {
                      const newId = Math.random().toString(36).substring(2, 9);
                      setCalibPoints(prev => [
                        ...prev,
                        { id: newId, weightRatio: 2.5, intensityRatio: 8.6 }
                      ]);
                      playSynthTone('tick');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Point</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Mass Ratio $W_A / W_B$</span>
                    <span>Int. Ratio $I_A / I_B$</span>
                    <span className="w-8"></span>
                  </div>
                  {calibPoints.map((pt, idx) => (
                    <div key={pt.id} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                      <input
                        type="number"
                        step="0.05"
                        value={pt.weightRatio}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setCalibPoints(prev => prev.map(p => p.id === pt.id ? { ...p, weightRatio: val } : p));
                        }}
                        className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-xs outline-none focus:border-amber-500/60 transition-colors"
                      />
                      <input
                        type="number"
                        step="0.05"
                        value={pt.intensityRatio}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setCalibPoints(prev => prev.map(p => p.id === pt.id ? { ...p, intensityRatio: val } : p));
                        }}
                        className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-xs outline-none focus:border-amber-500/60 transition-colors"
                      />
                      {calibPoints.length > 2 && (
                        <button
                          onClick={() => {
                            setCalibPoints(prev => prev.filter(p => p.id !== pt.id));
                            playSynthTone('tick');
                          }}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Standard Reference RIR ($K_B$):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={calibRIRB}
                    onChange={(e) => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                    className="w-24 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 font-mono text-xs text-right outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
            </div>

            {/* Right: Chart & Regression Stats */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="font-bold text-slate-200 text-sm">Linear Calibration Regression Fit</span>
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                    $y =$ {multiPointStats.slope.toFixed(3)}$x$ {multiPointStats.intercept >= 0 ? '+' : ''}{multiPointStats.intercept.toFixed(3)}
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="weightRatio"
                        stroke="#64748b"
                        fontSize={11}
                        name="W_A/W_B"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickLine={false}
                      />
                      <YAxis stroke="#64748b" fontSize={11} name="I_A/I_B" type="number" tickLine={false} />
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const pt = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs font-mono text-slate-200 shadow-xl">
                                <div className="text-slate-400">Mass Ratio ($W_A/W_B$): {pt.weightRatio}</div>
                                <div className="text-amber-400 font-bold">Intensity Ratio: {pt.intensityRatio ?? pt.fittedRatio}</div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        data={regressionLineData}
                        dataKey="fittedRatio"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Scatter
                        data={calibPoints}
                        dataKey="intensityRatio"
                        fill="#6366f1"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Regression Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Goodness $R^2$</span>
                    <span className="text-lg font-mono font-black text-emerald-400 mt-1 block">
                      {multiPointStats.r2.toFixed(4)}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Slope ($m$)</span>
                    <span className="text-lg font-mono font-black text-cyan-400 mt-1 block">
                      {multiPointStats.slope.toFixed(3)}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Extracted $RIR_A$</span>
                    <span className="text-lg font-mono font-black text-amber-400 mt-1 block">
                      {multiPointStats.calibRIR.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Target Phase:</span>
              <select
                value={targetPhaseId}
                onChange={(e) => setTargetPhaseId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500/60 w-full sm:w-64"
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current RIR: {p.rir})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleApply(multiPointStats.calibRIR)}
              className="w-full sm:w-auto px-6 py-3 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Calibrated RIR ({multiPointStats.calibRIR.toFixed(2)}) to Phase</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: Single-Point Calibration */}
      {calibMode === 'single' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Single-Point Binary Calibration Equation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When mixing a target analyte ($A$) with a known reference standard ($B$, typically Corundum with $RIR_B = 1.0$) in a known mass ratio $W_A/W_B$:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex justify-center text-amber-300 overflow-x-auto">
              <span dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'RIR_A = RIR_B \\times \\left(\\frac{I_A}{I_B}\\right) \\times \\left(\\frac{W_B}{W_A}\\right)',
                  { throwOnError: false, displayMode: true }
                )
              }} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Analyte Int. ($I_A$)</label>
              <input
                type="number"
                value={calibIntensityA}
                onChange={(e) => setCalibIntensityA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Std Int. ($I_B$)</label>
              <input
                type="number"
                value={calibIntensityB}
                onChange={(e) => setCalibIntensityB(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Std RIR ($K_B$)</label>
              <input
                type="number"
                step="0.1"
                value={calibRIRB}
                onChange={(e) => setCalibRIRB(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mass Ratio ($W_A/W_B$)</label>
              <input
                type="number"
                step="0.1"
                value={calibWeightRatioAB}
                onChange={(e) => setCalibWeightRatioAB(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-300/80 font-bold block">Calibrated RIR Value</span>
              <span className="text-4xl font-mono font-black text-amber-400 mt-1 block">
                {singlePointRIR.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={targetPhaseId}
                onChange={(e) => setTargetPhaseId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:border-amber-500/60"
              >
                {phases.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Current: {p.rir})</option>
                ))}
              </select>
              <button
                onClick={() => handleApply(singlePointRIR)}
                className="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-md active:scale-95"
              >
                Apply RIR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Spiking & Direct Amorphous Extraction */}
      {calibMode === 'spiking' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <FlaskConical className="w-4 h-4" />
              <span>Internal Standard Spiking & Absolute Phase Recovery</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              By adding a known mass fraction (W_S) of an internal crystalline standard into the sample, absolute phase weights are determined independently of matrix attenuation, allowing direct determination of amorphous matrix content:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center flex justify-center text-indigo-300 overflow-x-auto">
              <span dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'W_i^{\\text{orig}} = \\frac{I_i}{I_s} \\cdot \\frac{RIR_s}{RIR_i} \\cdot W_s \\cdot \\frac{1}{1 - W_s / 100}',
                  { throwOnError: false, displayMode: true }
                )
              }} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spike Added ($W_S$ wt%)</label>
              <input
                type="number"
                step="1"
                value={spikeAddedWtPct}
                onChange={(e) => setSpikeAddedWtPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500/60"
              />
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard Peak Int. ($I_S$)</label>
              <input
                type="number"
                value={spikeStdIntensity}
                onChange={(e) => setSpikeStdIntensity(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500/60"
              />
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Standard RIR ($RIR_S$)</label>
              <input
                type="number"
                step="0.1"
                value={spikeStdPhaseRIR}
                onChange={(e) => setSpikeStdPhaseRIR(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">Spike-Corrected Absolute Phase Quantification</span>
              <span className="font-mono text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                Calculated Amorphous Content: {spikingResults.amorphousAbsolute.toFixed(1)} wt%
              </span>
            </div>
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left font-sans">Phase Name</th>
                  <th className="px-4 py-3 text-right">Int (I)</th>
                  <th className="px-4 py-3 text-right">RIR</th>
                  <th className="px-4 py-3 text-right text-indigo-300">In Spiked Blend</th>
                  <th className="px-4 py-3 text-right text-emerald-300 font-bold">In Original Sample</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {spikingResults.phaseAbsolute.map(p => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-200 font-sans">{p.name}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{p.intensity}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{p.rir.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-indigo-300">{p.absInMixture.toFixed(2)} wt%</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">{p.absInOriginalSample.toFixed(2)} wt%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
