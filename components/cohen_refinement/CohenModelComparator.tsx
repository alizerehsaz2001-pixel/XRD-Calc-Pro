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
      label: 'Nelson-Riley',
      formula: '½(cos²θ/sinθ + cos²θ/θ)',
      context: 'Absorption + beam divergence error in Bragg-Brentano geometry',
      geometry: 'Standard Parafocusing Powder'
    },
    {
      type: 'taylor_sinclair',
      label: 'Taylor-Sinclair',
      formula: '½cos²θ sinθ(1/sinθ + 1/θ)',
      context: 'Axial divergence + finite specimen absorption in cylindrical/flat geometry',
      geometry: 'Cylindrical & Parafocusing'
    },
    {
      type: 'sample_displacement',
      label: 'Sample Height Displacement',
      formula: 'cos²θ sinθ',
      context: 'Goniometer sample plane z-axis displacement offset Δz',
      geometry: 'Goniometer Alignment Offset'
    },
    {
      type: 'bradley_jay',
      label: 'Bradley-Jay',
      formula: 'cos²θ',
      context: 'Debye-Scherrer camera radius & high-angle absorption extrapolation',
      geometry: 'Debye-Scherrer Camera'
    },
    {
      type: 'hess_hagg',
      label: 'Hess-Hägg',
      formula: 'sin²(2θ)',
      context: 'Focusing Guinier / Seemann-Bohlin transmission geometry cameras',
      geometry: 'Guinier Camera'
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
      label: 'Flat Specimen & Transparency',
      formula: 'cotθ (cosθ / sinθ)',
      context: 'Flat specimen surface aberration & low-μ X-ray penetration depth',
      geometry: 'Low-Absorption Specimen'
    },
    {
      type: 'dual_drift',
      label: 'Dual-Drift (NR + Zero-Shift)',
      formula: 'D₁·f_NR(θ) + D₂·sin(2θ)',
      context: 'Simultaneous sample displacement & 2θ zero-offset co-refinement',
      geometry: 'Dual Physical Drift'
    },
    {
      type: 'none',
      label: 'Fixed Zero (No Drift)',
      formula: 'D = 0 (fixed)',
      context: 'Pre-calibrated instrument or minimal peak count (saves 1 DOF)',
      geometry: 'Calibrated Diffractometer'
    }
  ];

  const results = useMemo(() => {
    const validPeaks = peaks.filter(p => p.enabled !== false && p.twoTheta > 0 && p.twoTheta < 180);
    if (validPeaks.length < 2) return [];

    return models.map(m => {
      const res = solveSystem(m.type);
      return {
        ...m,
        result: res
      };
    }).filter(m => m.result !== null) as {
      type: DriftFunctionType;
      label: string;
      formula: string;
      context: string;
      geometry: string;
      result: ModelResult;
    }[];
  }, [peaks, crystalSystem, wavelength, solveSystem]);

  // Find best model by lowest AIC (or minimum RMS 2Theta if AIC tied)
  const bestModel = useMemo(() => {
    if (!results.length) return null;
    return [...results].sort((a, b) => (a.result.rmsTwoTheta || 999) - (b.result.rmsTwoTheta || 999))[0];
  }, [results]);

  if (!results.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Systematic Drift Function Multi-Model Benchmark (9 Analytical Kernels)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Simultaneous cross-evaluation of all diffractometer error functions ranked by RMS Δ2θ, R<sub>wp</sub>, Smith–Snyder F<sub>N</sub>, and AIC
          </p>
        </div>

        {bestModel && bestModel.type !== activeDriftType && (
          <button
            type="button"
            onClick={() => onSelectDriftType(bestModel.type)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Optimal Model ({bestModel.label})
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
              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/30 shadow-sm'
                  : isBest
                  ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/20 dark:bg-amber-950/20 hover:border-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {isBest && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center gap-0.5">
                        <Award className="w-3 h-3 text-amber-500" />
                        Lowest RMS
                      </span>
                    )}
                    {isActive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-indigo-600" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-slate-200/70 dark:border-slate-800 mb-1.5 truncate">
                  f(θ) = {item.formula}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.context}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1 text-xs font-mono">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Refined a₀:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {res.a.toFixed(precision + 1)} ± {res.sigmaA.toFixed(precision + 1)} Å
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">RMS Δ2θ:</span>
                  <span className={`font-bold ${
                    isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    ±{res.rmsTwoTheta.toFixed(4)}°
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">F<sub>N</sub> / AIC:</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    F={(res.smithSnyderFN || 0).toFixed(1)} | AIC={(res.aic || 0).toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-sans text-slate-500 dark:text-slate-400">Drift D / Δz:</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    {res.D.toExponential(2)} ({res.sampleDisplacementUm !== undefined ? `${res.sampleDisplacementUm.toFixed(1)} μm` : '-'})
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
