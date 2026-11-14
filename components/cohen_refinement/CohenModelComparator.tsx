import React, { useMemo } from 'react';
import { Award, Check, Sparkles, Zap } from 'lucide-react';
import { CrystalSystem, DriftFunctionType, PeakInput } from './CohenPresetsDb';

export interface ModelResult {
  a: number;
  b: number;
  c: number;
  sigmaA: number;
  D: number;
  rmsTwoTheta: number;
  sumResidualSquare: number;
  rwpPct?: number;
  gof?: number;
  aic?: number;
  aicc?: number;
  bic?: number;
  driftPValue?: number;
  driftSignificant?: boolean;
  smithSnyderFN?: number;
  sampleDisplacementUm?: number;
}

interface CohenModelComparatorProps {
  peaks: PeakInput[];
  crystalSystem: CrystalSystem;
  wavelength: number;
  activeDriftType: DriftFunctionType;
  onSelectDriftType: (drift: DriftFunctionType) => void;
  solveSystem: (drift: DriftFunctionType) => ModelResult | null;
  precision?: number;
}

export const CohenModelComparator: React.FC<CohenModelComparatorProps> = ({
  peaks,
  crystalSystem,
  wavelength,
  activeDriftType,
  onSelectDriftType,
  solveSystem,
  precision = 4
}) => {
  const models: { type: DriftFunctionType; label: string; formula: string; context: string; geometry: string }[] = [
    {
      type: 'nelson_riley',
      label: 'Nelson–Riley',
      formula: 'sinθ·cos²θ + sin²θ·cos²θ/θ',
      context: 'Exact sin²θ transform of Δd/d ∝ ½(cos²θ/sinθ + cos²θ/θ) Bragg-Brentano drift',
      geometry: 'Standard Parafocusing Powder'
    },
    {
      type: 'taylor_sinclair',
      label: 'Taylor–Sinclair',
      formula: '2·sin²θ·cos²θ / θ',
      context: 'Axial divergence + finite specimen absorption slit-aperture kernel (Δd/d ∝ cos²θ/θ)',
      geometry: 'Cylindrical & Parafocusing'
    },
    {
      type: 'sample_displacement',
      label: 'Specimen z-Displacement',
      formula: 'cos²θ·sinθ',
      context: 'Goniometer focusing-circle sample plane z-offset Δ2θ = −(2Δz/R)cosθ',
      geometry: 'Goniometer Alignment Offset'
    },
    {
      type: 'bradley_jay',
      label: 'Bradley–Jay',
      formula: 'cos²θ',
      context: 'Debye–Scherrer camera radius & high-angle absorption extrapolation',
      geometry: 'Debye–Scherrer Camera'
    },
    {
      type: 'hess_hagg',
      label: 'Hess–Hägg Transparency',
      formula: 'sin²(2θ)',
      context: 'Specimen X-ray penetration depth (1/μ) & Guinier camera asymmetry',
      geometry: 'Transparency / Guinier'
    },
    {
      type: 'zero_shift',
      label: 'Detector Zero-Shift',
      formula: 'sin(2θ)',
      context: 'Mechanical detector 2θ zero-point encoder calibration offset Δ2θ₀',
      geometry: 'Encoder Zero Offset'
    },
    {
      type: 'flat_specimen',
      label: 'Flat Specimen',
      formula: 'cos²θ·(1 − ½sinθ)',
      context: 'Flat specimen horizontal beam divergence & surface curvature bias',
      geometry: 'Flat-Plate Divergence'
    },
    {
      type: 'dual_drift',
      label: 'Dual-Drift (NR + Zero)',
      formula: 'D₁·g_NR(θ) + D₂·sin(2θ)',
      context: 'Simultaneous Nelson–Riley displacement/absorption & 2θ zero-offset co-refinement',
      geometry: 'Coupled Dual Drift'
    },
    {
      type: 'none',
      label: 'Fixed Zero (Null Model)',
      formula: 'D = 0 (fixed)',
      context: 'Pre-calibrated zero-drift reference (null baseline for Partial F-test)',
      geometry: 'Calibrated Diffractometer'
    }
  ];

  const results = useMemo(() => {
    const validPeaks = peaks.filter(p => p.enabled !== false && p.twoTheta > 0 && p.twoTheta < 180);
    if (validPeaks.length < 2) return [];

    const raw = models
      .map(m => ({ ...m, result: solveSystem(m.type) }))
      .filter(m => m.result !== null) as {
      type: DriftFunctionType;
      label: string;
      formula: string;
      context: string;
      geometry: string;
      result: ModelResult;
    }[];

    if (!raw.length) return [];
    const minAicc = Math.min(...raw.map(r => r.result.aicc ?? r.result.aic ?? 0));
    const rawWeights = raw.map(r => {
      const delta = (r.result.aicc ?? r.result.aic ?? 0) - minAicc;
      return Math.exp(-0.5 * Math.min(40, delta));
    });
    const sumWeights = Math.max(1e-12, rawWeights.reduce((acc, w) => acc + w, 0));

    return raw.map((item, idx) => ({
      ...item,
      deltaAicc: (item.result.aicc ?? item.result.aic ?? 0) - minAicc,
      akaikeWeightPct: (rawWeights[idx] / sumWeights) * 100
    }));
  }, [peaks, crystalSystem, wavelength, solveSystem]);

  // Rank optimal model by lowest small-sample corrected AICc (prevents overfitting)
  const bestModel = useMemo(() => {
    if (!results.length) return null;
    return [...results].sort((a, b) => a.deltaAicc - b.deltaAicc)[0];
  }, [results]);

  if (!results.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Systematic Drift Multi-Model Benchmark (AICc &amp; Partial F-Test)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Information-theoretic comparison of 9 analytical aberration kernels using small-sample AICc, Akaike evidence weights wᵢ, and Partial F-test vs D = 0
          </p>
        </div>

        {bestModel && bestModel.type !== activeDriftType && (
          <button
            type="button"
            onClick={() => onSelectDriftType(bestModel.type)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Best AICc ({bestModel.label})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map(item => {
          const isBest = bestModel?.type === item.type;
          const isActive = activeDriftType === item.type;
          const res = item.result;

          return (
            <div
              key={item.type}
              onClick={() => onSelectDriftType(item.type)}
              className={`p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'border-cyan-500 dark:border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-1 ring-cyan-500/30'
                  : isBest
                  ? 'border-amber-400 dark:border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/20 hover:border-amber-500'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isBest && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center gap-0.5">
                        <Award className="w-3 h-3 text-amber-500" />
                        Best AICc
                      </span>
                    )}
                    {isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-cyan-600" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-cyan-700 dark:text-cyan-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 mb-1.5 truncate">
                  g_D(θ) = {item.formula}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.context}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 space-y-1 text-xs font-mono tabular-nums">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Refined a₀:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {res.a.toFixed(precision + 1)} ± {res.sigmaA.toFixed(precision + 1)} Å
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">RMS Δ2θ / F_N:</span>
                  <span className={`font-bold ${isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    ±{res.rmsTwoTheta.toFixed(4)}° · F={(res.smithSnyderFN || 0).toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">ΔAICc / Weight:</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    +{item.deltaAicc.toFixed(1)} ({item.akaikeWeightPct.toFixed(1)}%)
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                    {item.type === 'none' ? 'Null Baseline:' : 'F-test p / Δz:'}
                  </span>
                  <span className={`text-[11px] ${
                    item.type !== 'none' && res.driftSignificant ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.type === 'none'
                      ? '0 drift DOF'
                      : `p=${(res.driftPValue ?? 1).toFixed(3)} · ${res.sampleDisplacementUm !== undefined ? `${res.sampleDisplacementUm.toFixed(1)}μm` : '-'}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
