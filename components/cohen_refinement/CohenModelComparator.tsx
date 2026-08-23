import React, { useMemo } from 'react';
import { Award, Check, Sparkles, ArrowRight, Activity, Zap } from 'lucide-react';
import { CrystalSystem, DriftFunctionType, PeakInput } from './CohenPresetsDb';

interface CohenModelComparatorProps {
  peaks: PeakInput[];
  crystalSystem: CrystalSystem;
  wavelength: number;
  activeDriftType: DriftFunctionType;
  onSelectDriftType: (drift: DriftFunctionType) => void;
  solveSystem: (drift: DriftFunctionType) => {
    a: number;
    b: number;
    c: number;
    sigmaA: number;
    D: number;
    rmsTwoTheta: number;
    sumResidualSquare: number;
  } | null;
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
  const models: { type: DriftFunctionType; label: string; formula: string; context: string }[] = [
    {
      type: 'nelson_riley',
      label: 'Nelson-Riley',
      formula: '½(cos²θ/sinθ + cos²θ/θ)',
      context: 'Best for standard Bragg-Brentano flat specimen geometry'
    },
    {
      type: 'sample_displacement',
      label: 'Sample Displacement',
      formula: 'cos²θ sinθ',
      context: 'Direct goniometer sample height offset correction'
    },
    {
      type: 'bradley_jay',
      label: 'Bradley-Jay',
      formula: 'cos²θ',
      context: 'Debye-Scherrer cylindrical camera approximation'
    },
    {
      type: 'hess_hagg',
      label: 'Hess-Hägg',
      formula: 'sin²(2θ)',
      context: 'Guinier focusing camera geometry'
    },
    {
      type: 'zero_shift',
      label: 'Pure Zero-Shift',
      formula: 'cosθ',
      context: 'Constant 2θ detector mechanical zero-point error'
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
    }).filter(m => m.result !== null);
  }, [peaks, crystalSystem, wavelength, solveSystem]);

  // Find best model by minimum RMS 2Theta
  const bestModel = useMemo(() => {
    if (!results.length) return null;
    return [...results].sort((a, b) => (a.result?.rmsTwoTheta || 999) - (b.result?.rmsTwoTheta || 999))[0];
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
            Automatic evaluation across all 5 standard error drift formulations to find the optimal diffractometer fit
          </p>
        </div>

        {bestModel && bestModel.type !== activeDriftType && (
          <button
            type="button"
            onClick={() => onSelectDriftType(bestModel.type)}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Best Fit ({bestModel.label})
          </button>
        )}
      </div>

      {/* Grid of Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map(m => {
          const isSelected = activeDriftType === m.type;
          const isBest = bestModel?.type === m.type;
          const r = m.result!;

          return (
            <div
              key={m.type}
              onClick={() => onSelectDriftType(m.type)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                  : isBest
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 hover:border-amber-400'
                  : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span>{m.label}</span>
                    {isBest && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase flex items-center gap-0.5 shadow-sm">
                        <Award className="w-2.5 h-2.5" />
                        Best Fit
                      </span>
                    )}
                  </div>
                  {isSelected ? (
                    <span className="p-1 rounded-full bg-indigo-600 text-white">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">Select</span>
                  )}
                </div>

                <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-1 rounded border border-slate-200 dark:border-slate-800 my-1.5 text-center">
                  {m.formula}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-slate-500 text-[11px]">Refined a:</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      {r.a.toFixed(precision + 1)} <span className="text-[10px]">± {r.sigmaA.toFixed(precision + 2)} Å</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline font-mono">
                    <span className="text-slate-500 text-[11px]">RMS Δ2θ:</span>
                    <span className={`font-bold ${
                      r.rmsTwoTheta < 0.02 ? 'text-emerald-600 dark:text-emerald-400' : r.rmsTwoTheta < 0.05 ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {r.rmsTwoTheta.toFixed(4)}°
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline font-mono text-[11px]">
                    <span className="text-slate-500">Drift D:</span>
                    <span className="text-slate-700 dark:text-slate-300">{r.D.toExponential(2)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800/60 pt-2 leading-tight">
                {m.context}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
