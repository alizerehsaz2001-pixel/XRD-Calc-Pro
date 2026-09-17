import React, { useMemo } from 'react';
import { Award, Check, Sparkles, ArrowRight, Activity, Zap, TrendingDown, Layers, ShieldCheck } from 'lucide-react';
import { CrystalSystem, DriftFunctionType, PeakInput } from './CohenPresetsDb';

interface ModelResult {
  a: number;
  b: number;
  c: number;
  sigmaA: number;
  D: number;
  rmsTwoTheta: number;
  sumResidualSquare: number;
  rwpPct?: number;
  gof?: number;
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
      type: 'sample_displacement',
      label: 'Sample Height Displacement',
      formula: 'cos²θ sinθ',
      context: 'Goniometer sample plane z-axis displacement offset',
      geometry: 'Goniometer Alignment Offset'
    },
    {
      type: 'bradley_jay',
      label: 'Bradley-Jay',
      formula: 'cos²θ',
      context: 'Debye-Scherrer film camera film shrinkage & absorption',
      geometry: 'Debye-Scherrer Camera'
    },
    {
      type: 'hess_hagg',
      label: 'Hess-Hägg',
      formula: 'sin²(2θ)',
      context: 'Focusing Guinier / Seemann-Bohlin geometry cameras',
      geometry: 'Guinier Camera'
    },
    {
      type: 'zero_shift',
      label: 'Detector Zero-Shift',
      formula: 'cosθ',
      context: 'Mechanical detector 2θ zero-point encoder calibration offset',
      geometry: 'Encoder Offset'
    },
    {
      type: 'flat_specimen',
      label: 'Flat Specimen & Transparency',
      formula: 'cotθ (cosθ / sinθ)',
      context: 'Flat specimen surface aberration & penetration transparency',
      geometry: 'Thick/Low-Absorption Specimen'
    },
    {
      type: 'dual_drift',
      label: 'Dual-Drift (NR + Zero-Shift)',
      formula: 'D₁·f_NR(θ) + D₂·cosθ',
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

  // Evaluate all models
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

  // Find best model by minimum RMS 2Theta
  const bestModel = useMemo(() => {
    if (!results.length) return null;
    return [...results].sort((a, b) => (a.result.rmsTwoTheta || 999) - (b.result.rmsTwoTheta || 999))[0];
  }, [results]);

  if (!results.length) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Systematic Drift Function Multi-Model Benchmark
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automatic evaluation across all systematic error drift models to identify the optimal diffractometer fit
          </p>
        </div>

        {bestModel && bestModel.type !== activeDriftType && (
          <button
            type="button"
            onClick={() => onSelectDriftType(bestModel.type)}
            className="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md hover:opacity-90 flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Best Model ({bestModel.label})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {results.map(item => {
          const isBest = bestModel?.type === item.type;
          const isActive = activeDriftType === item.type;
          const res = item.result;

          return (
            <div
              key={item.type}
              onClick={() => onSelectDriftType(item.type)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                isActive
                  ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-md'
                  : isBest
                  ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20 hover:border-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
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
                        Best Fit
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

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800/80 mb-2 truncate">
                  {item.formula}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.context}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Refined a₀:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                    {res.a.toFixed(precision + 1)} Å
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">RMS Δ2θ:</span>
                  <span className={`font-mono font-bold ${
                    isBest ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    ±{res.rmsTwoTheta.toFixed(4)}°
                  </span>
                </div>

                {res.rwpPct !== undefined && res.rwpPct > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Weighted R_wp:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      {res.rwpPct.toFixed(2)}%
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Drift Coeff D:</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {res.D.toExponential(2)}
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
