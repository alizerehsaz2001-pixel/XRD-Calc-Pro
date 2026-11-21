import React, { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Layers,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Target,
} from 'lucide-react';
import { DLPhaseCandidate, DLExplainabilityReport } from '../../types';
import {
  PerturbationParams,
  SpectralPoint,
  NeuralEngineSettings,
  applySpectralPerturbation,
  computeDLExplainabilityReport,
} from '../../utils/dlPhysicsNeuralEngine';
import { identifyPhasesDL } from '../../utils/physics';
import { playSynthTone } from '../../utils/sound';

interface ExplainabilityUncertaintyStudioProps {
  parsedPoints: SpectralPoint[];
  selectedCandidate: DLPhaseCandidate | null;
  candidates: DLPhaseCandidate[];
  engineConfig: NeuralEngineSettings;
  wavelengthA: number;
  baseReport: DLExplainabilityReport | null;
  onTriggerMixtureMode?: () => void;
  onSelectCandidate?: (cand: DLPhaseCandidate) => void;
}

const DEFAULT_PERTURBATION: PerturbationParams = {
  noisePct: 0,
  broadeningDeg: 0,
  baselineDriftPct: 0,
  zeroShiftDeg: 0,
};

const STATUS_META: Record<
  'matched' | 'shifted' | 'preferred_orientation' | 'missing',
  { label: string; colorClass: string }
> = {
  matched: {
    label: '● Matched',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
  },
  shifted: {
    label: '▲ Strained / Shifted',
    colorClass: 'text-amber-600 dark:text-amber-400',
  },
  preferred_orientation: {
    label: '▲ Texture / Intensity',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
  },
  missing: {
    label: '✖ Unobserved',
    colorClass: 'text-rose-600 dark:text-rose-400',
  },
};

export const ExplainabilityUncertaintyStudio: React.FC<ExplainabilityUncertaintyStudioProps> = ({
  parsedPoints,
  selectedCandidate,
  candidates,
  engineConfig,
  wavelengthA,
  baseReport,
  onTriggerMixtureMode,
  onSelectCandidate,
}) => {
  const [perturbation, setPerturbation] = useState<PerturbationParams>(DEFAULT_PERTURBATION);
  const [showResidualTrace, setShowResidualTrace] = useState(true);
  const [showDerivativeTrace, setShowDerivativeTrace] = useState(false);
  const [showCalcTrace, setShowCalcTrace] = useState(true);
  const [selectedPeakTT, setSelectedPeakTT] = useState<number | null>(null);

  const isPerturbed =
    perturbation.noisePct > 0 ||
    perturbation.broadeningDeg > 0 ||
    perturbation.baselineDriftPct > 0 ||
    Math.abs(perturbation.zeroShiftDeg) > 0.001;

  // Non-destructive live stress-test recomputation when sliders move
  const perturbedState = useMemo(() => {
    if (!isPerturbed || !selectedCandidate || parsedPoints.length === 0) {
      return null;
    }
    const perturbedPoints = applySpectralPerturbation(parsedPoints, perturbation);
    const liveResult = identifyPhasesDL(perturbedPoints, false, {
      kernelSize: engineConfig.kernelSize ?? 5,
      filters: engineConfig.filters ?? 64,
      depth: engineConfig.depth ?? 6,
      pooling: engineConfig.pooling ?? 'max',
      activation: engineConfig.activation ?? 'GELU',
      optimization: engineConfig.optimization ?? 'AdamW',
      learningRate: engineConfig.learningRate ?? 0.001,
      confidenceThreshold: engineConfig.confidenceThreshold ?? 0.35,
      batchNorm: engineConfig.batchNorm ?? true,
      multiScale: engineConfig.multiScale ?? true,
      dropout: engineConfig.dropout ?? 0.15,
      ...engineConfig,
      wavelength: wavelengthA,
    });
    const matchedLiveCand =
      liveResult.candidates.find((c) => c.phase_name === selectedCandidate.phase_name) ||
      liveResult.candidates[0] ||
      selectedCandidate;
    const liveTop = liveResult.candidates[0] || selectedCandidate;
    const liveReport = computeDLExplainabilityReport(
      perturbedPoints,
      matchedLiveCand,
      liveResult.candidates,
      engineConfig,
      wavelengthA
    );
    return {
      report: liveReport,
      topPhaseName: liveTop.phase_name,
      topConfidencePct: liveTop.confidence_score,
      rankRetained: liveTop.phase_name === selectedCandidate.phase_name,
      confidenceDeltaPct: Number(
        (liveReport.meanConfidencePct - (baseReport?.meanConfidencePct ?? selectedCandidate.confidence_score)).toFixed(1)
      ),
    };
  }, [isPerturbed, perturbation, parsedPoints, selectedCandidate, engineConfig, wavelengthA, baseReport]);

  const activeReport = perturbedState?.report ?? baseReport;

  const chartData = useMemo(() => {
    if (!activeReport) return [];
    return activeReport.gradCamCurve.map((pt) => ({
      ...pt,
      gradCamScaled: Number((pt.gradCam * 100).toFixed(1)),
    }));
  }, [activeReport]);

  if (!selectedCandidate || !activeReport) {
    return (
      <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-8 text-center">
        <Eye className="w-8 h-8 text-indigo-500 mx-auto mb-3 opacity-80" />
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Explainability &amp; Uncertainty Studio Ready
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
          Run Phase Identification on an XRD pattern to inspect 1D Grad-CAM saliency, per-peak (hkl) occlusion attributions, Monte Carlo Dropout epistemic uncertainty, and live noise stress tests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Telemetry Strip (4 max, strict tabular-nums) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            MC-Dropout Confidence (N={activeReport.mcPasses})
          </div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeReport.meanConfidencePct.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              ± {activeReport.confidenceStdPct.toFixed(2)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            95% CI [{activeReport.ci95LowPct.toFixed(1)}%, {activeReport.ci95HighPct.toFixed(1)}%]
          </div>
        </div>

        <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Epistemic Entropy &amp; Margin
          </div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              H = {activeReport.predictiveEntropy.toFixed(3)}
            </span>
            <span
              className={`text-xs font-semibold ${
                activeReport.decisionMarginPct >= 15
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              Δ +{activeReport.decisionMarginPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {activeReport.decisionMarginPct >= 15
              ? '● Well-separated top candidate'
              : '▲ Close polymorph / mixture overlap'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Physics Bragg Calibration
          </div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeReport.zeroShiftDeg >= 0 ? '+' : ''}
              {activeReport.zeroShiftDeg.toFixed(3)}°
            </span>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              ε {activeReport.isotropicStrainPct >= 0 ? '+' : ''}
              {activeReport.isotropicStrainPct.toFixed(2)}%
            </span>
          </div>
          <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Disp: {activeReport.displacementMm >= 0 ? '+' : ''}
            {activeReport.displacementMm.toFixed(2)} mm · Rwp {activeReport.profileRwpPct.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Texture &amp; Residual Audit
          </div>
          <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeReport.unexplainedPeaks.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">unmatched peaks</span>
          </div>
          <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            March-Dollase anomaly: {(activeReport.textureAnomalyScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Main 1D Grad-CAM + Residual Saliency Chart */}
      <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Activity className="w-4 h-4" />
              <span>1D Grad-CAM Saliency &amp; Peak Attribution Profile</span>
              {isPerturbed && (
                <span className="text-amber-600 dark:text-amber-400">· LIVE PERTURBATION ACTIVE</span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active phase: <strong className="text-slate-900 dark:text-white">{activeReport.candidateName}</strong> ({activeReport.formula}) · λ = {wavelengthA.toFixed(5)} Å · Click any (hkl) row below to inspect its Bragg angle on the plot.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCalcTrace((v) => !v)}
              className={`px-2.5 py-1.5 rounded-sm border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showCalcTrace
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              Calc Fit
            </button>
            <button
              type="button"
              onClick={() => setShowResidualTrace((v) => !v)}
              className={`px-2.5 py-1.5 rounded-sm border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showResidualTrace
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              Residual (Iobs−Icalc)
            </button>
            <button
              type="button"
              onClick={() => setShowDerivativeTrace((v) => !v)}
              className={`px-2.5 py-1.5 rounded-sm border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showDerivativeTrace
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-700 dark:text-cyan-300'
                  : 'bg-slate-50 dark:bg-[#0B0F19] border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              dI/d2θ Channel
            </button>
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="gradCamAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis
                dataKey="twoTheta"
                type="number"
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                label={{
                  value: 'Diffraction Angle 2θ (deg)',
                  position: 'insideBottom',
                  offset: -12,
                  style: { fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' },
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                domain={showResidualTrace ? [-45, 110] : [0, 110]}
                label={{
                  value: 'Intensity / Saliency (%)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 12,
                  style: { fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B0F19',
                  borderColor: '#334155',
                  borderRadius: '2px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#f8fafc',
                }}
                formatter={(val: any, name: string) => {
                  const n = Number(val);
                  if (name === 'gradCamScaled') return [`${n.toFixed(1)}%`, '1D Grad-CAM Weight'];
                  if (name === 'obsIntensity') return [`${n.toFixed(1)}`, 'Observed I(2θ)'];
                  if (name === 'calcIntensity') return [`${n.toFixed(1)}`, 'Calculated I(2θ)'];
                  if (name === 'residual') return [`${n >= 0 ? '+' : ''}${n.toFixed(1)}`, 'Residual'];
                  if (name === 'derivative') return [`${n.toFixed(1)}`, 'dI/d2θ'];
                  return [val, name];
                }}
                labelFormatter={(label) => `2θ = ${label}°`}
              />
              <Area
                type="monotone"
                dataKey="gradCamScaled"
                fill="url(#gradCamAreaFill)"
                stroke="#f59e0b"
                strokeWidth={1.5}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="obsIntensity"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {showCalcTrace && (
                <Line
                  type="monotone"
                  dataKey="calcIntensity"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showResidualTrace && (
                <Line
                  type="monotone"
                  dataKey="residual"
                  stroke="#f43f5e"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showDerivativeTrace && (
                <Line
                  type="monotone"
                  dataKey="derivative"
                  stroke="#06b6d4"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {selectedPeakTT !== null && (
                <ReferenceLine
                  x={selectedPeakTT}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: `${selectedPeakTT.toFixed(2)}°`,
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 11,
                    fontFamily: 'monospace',
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Inline legend */}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-500 inline-block" /> Observed I(2θ)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2.5 bg-amber-500/40 border border-amber-500 inline-block" /> 1D Grad-CAM Attribution
          </span>
          {showCalcTrace && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Calculated Phase Profile
            </span>
          )}
          {showResidualTrace && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" /> Difference Curve
            </span>
          )}
        </div>
      </div>

      {/* Two-Column Middle Row: MC-Dropout Candidate Distribution + Live Perturbation Stress Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: MC-Dropout Epistemic Uncertainty Distribution */}
        <div className="lg:col-span-6 bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                <Target className="w-4 h-4 text-indigo-500" />
                <span>MC-Dropout Epistemic Confidence (Top-5)</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                p_drop = {(Number(engineConfig.dropout) || 0.15).toFixed(2)}
              </span>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  layout="vertical"
                  data={activeReport.mcCandidates}
                  margin={{ top: 4, right: 24, left: 6, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                    unit="%"
                  />
                  <YAxis
                    type="category"
                    dataKey="phaseName"
                    width={132}
                    tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F19',
                      borderColor: '#334155',
                      borderRadius: '2px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any, _name: string, props: any) => {
                      const d = props?.payload;
                      return [
                        `${Number(val).toFixed(1)}% (±${d?.stdPct?.toFixed(2)}%, 95% CI ${d?.ciLowPct}–${d?.ciHighPct}%)`,
                        'Mean Confidence',
                      ];
                    }}
                  />
                  <Bar dataKey="meanConfidencePct" radius={[0, 2, 2, 0]} barSize={18} isAnimationActive={false}>
                    {activeReport.mcCandidates.map((entry, idx) => (
                      <Cell
                        key={entry.phaseName}
                        fill={
                          entry.phaseName === activeReport.candidateName
                            ? '#6366f1'
                            : idx === 0
                            ? '#10b981'
                            : '#475569'
                        }
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            {activeReport.mcCandidates.map((cand) => {
              const matchingFull = candidates.find((c) => c.phase_name === cand.phaseName);
              const isSelected = cand.phaseName === activeReport.candidateName;
              return (
                <button
                  key={cand.phaseName}
                  type="button"
                  onClick={() => {
                    if (matchingFull && onSelectCandidate) {
                      onSelectCandidate(matchingFull);
                      playSynthTone('tick');
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-sm text-left text-xs font-mono tabular-nums transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="truncate font-semibold">{cand.phaseName}</span>
                  <span className="whitespace-nowrap shrink-0">
                    {cand.meanConfidencePct.toFixed(1)}% ± {cand.stdPct.toFixed(2)}%
                    <span className="text-slate-400 ml-2 hidden sm:inline">
                      [{cand.ciLowPct.toFixed(0)}–{cand.ciHighPct.toFixed(0)}%]
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Non-Destructive Live Perturbation Robustness Stress Tester */}
        <div className="lg:col-span-6 bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                <Sliders className="w-4 h-4 text-cyan-500" />
                <span>Live Perturbation Stress Tester</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPerturbation(DEFAULT_PERTURBATION);
                  playSynthTone('tick');
                }}
                disabled={!isPerturbed}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-sm border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:border-slate-400 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Inject synthetic detector noise, Scherrer peak broadening, amorphous background drift, or goniometer zero-shift non-destructively to verify model stability.
            </p>

            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-mono tabular-nums mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Gaussian Detector Noise</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {perturbation.noisePct.toFixed(0)}% σ
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={perturbation.noisePct}
                  onChange={(e) =>
                    setPerturbation((prev) => ({ ...prev, noisePct: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono tabular-nums mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Crystallite Peak Broadening (ΔFWHM)</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    +{perturbation.broadeningDeg.toFixed(2)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.6}
                  step={0.05}
                  value={perturbation.broadeningDeg}
                  onChange={(e) =>
                    setPerturbation((prev) => ({ ...prev, broadeningDeg: Number(e.target.value) }))
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono tabular-nums mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Amorphous Baseline Drift</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    +{perturbation.baselineDriftPct.toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={perturbation.baselineDriftPct}
                  onChange={(e) =>
                    setPerturbation((prev) => ({
                      ...prev,
                      baselineDriftPct: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono tabular-nums mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Goniometer Zero-Point Shift</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {perturbation.zeroShiftDeg >= 0 ? '+' : ''}
                    {perturbation.zeroShiftDeg.toFixed(2)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-0.4}
                  max={0.4}
                  step={0.02}
                  value={perturbation.zeroShiftDeg}
                  onChange={(e) =>
                    setPerturbation((prev) => ({
                      ...prev,
                      zeroShiftDeg: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Live Stress-Test Verdict */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            {perturbedState ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-sm p-3 text-xs font-mono tabular-nums">
                <div className="flex items-center gap-2">
                  {perturbedState.rankRetained ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {perturbedState.rankRetained
                        ? `Rank #1 Retained (${perturbedState.topPhaseName})`
                        : `Rank Shifted → ${perturbedState.topPhaseName}`}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Perturbed Confidence: {perturbedState.report.meanConfidencePct.toFixed(1)}% (Δ{' '}
                      {perturbedState.confidenceDeltaPct >= 0 ? '+' : ''}
                      {perturbedState.confidenceDeltaPct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Baseline pattern active (0% perturbation). Drag any slider to run live inference stress test.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unexplained Residual Peaks Callout (if detected) */}
      {activeReport.unexplainedPeaks.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/35 rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                {activeReport.unexplainedPeaks.length} Unexplained Residual Diffraction Peak
                {activeReport.unexplainedPeaks.length > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-mono tabular-nums">
                Secondary phase or impurity candidates at 2θ ={' '}
                {activeReport.unexplainedPeaks
                  .map((p) => `${p.twoTheta.toFixed(2)}° (res +${p.residual.toFixed(0)})`)
                  .join(' · ')}
              </p>
            </div>
          </div>
          {onTriggerMixtureMode && (
            <button
              type="button"
              onClick={onTriggerMixtureMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Run Multi-Phase Mixture Mode</span>
            </button>
          )}
        </div>
      )}

      {/* Per-Peak (hkl) Occlusion Attribution Audit Table */}
      <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Per-Peak (hkl) Occlusion Attribution &amp; Bragg Residual Audit
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Click a row to highlight reflection on the Grad-CAM plot above
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3">(hkl)</th>
                <th className="py-2.5 px-3">2θ Ref (°)</th>
                <th className="py-2.5 px-3">2θ Obs (°)</th>
                <th className="py-2.5 px-3">Δ2θ (°)</th>
                <th className="py-2.5 px-3">d (Å)</th>
                <th className="py-2.5 px-3">I_obs / I_ref</th>
                <th className="py-2.5 px-3">Grad-CAM</th>
                <th className="py-2.5 px-3">Occlusion Impact</th>
                <th className="py-2.5 px-3">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {activeReport.peakAttributions.map((pk, idx) => {
                const targetTT = pk.obsTwoTheta ?? pk.refTwoTheta;
                const isSelected = selectedPeakTT !== null && Math.abs(selectedPeakTT - targetTT) < 0.05;
                const meta = STATUS_META[pk.status];
                return (
                  <tr
                    key={`${pk.hkl}-${pk.refTwoTheta}-${idx}`}
                    onClick={() => {
                      setSelectedPeakTT(isSelected ? null : targetTT);
                      playSynthTone('tick');
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{pk.hkl}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{pk.refTwoTheta.toFixed(2)}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {pk.obsTwoTheta !== null ? pk.obsTwoTheta.toFixed(2) : '—'}
                    </td>
                    <td
                      className={`py-2 px-3 ${
                        Math.abs(pk.deltaTwoTheta) > 0.2
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {pk.deltaTwoTheta >= 0 ? '+' : ''}
                      {pk.deltaTwoTheta.toFixed(3)}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{pk.dSpacingA.toFixed(4)}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {pk.obsIntensity.toFixed(0)} / {pk.refIntensity.toFixed(0)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${Math.round(pk.gradCamWeight * 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">
                          {(pk.gradCamWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      −{pk.occlusionDeltaPct.toFixed(1)}%
                    </td>
                    <td className={`py-2 px-3 font-semibold whitespace-nowrap ${meta.colorClass}`}>
                      {meta.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
