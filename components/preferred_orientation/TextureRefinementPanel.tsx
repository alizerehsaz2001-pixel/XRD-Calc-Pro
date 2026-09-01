import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Play, RefreshCw, Sliders, TrendingDown, Target } from 'lucide-react';
import { RefinementFitMetrics, refinePreferredOrientation, PreferredOrientationReflection, TextureModelType } from '../../utils/preferredOrientationPhysics';

interface TextureRefinementPanelProps {
  reflections: PreferredOrientationReflection[];
  textureModel: TextureModelType;
  currentR1: number;
  currentR2?: number;
  currentF1: number;
  currentF2?: number;
  onApplyRefinedParams: (r1: number, f1: number, r2?: number, f2?: number) => void;
}

export const TextureRefinementPanel: React.FC<TextureRefinementPanelProps> = ({
  reflections,
  textureModel,
  currentR1,
  currentR2 = 1.0,
  currentF1,
  currentF2 = 0.0,
  onApplyRefinedParams
}) => {
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [habitHypothesis, setHabitHypothesis] = useState<'Platelet' | 'Needle' | 'Bimodal'>('Platelet');
  const [fitResult, setFitResult] = useState<RefinementFitMetrics | null>(null);

  const handleRunRefinement = () => {
    setIsRefining(true);
    setTimeout(() => {
      const res = refinePreferredOrientation(
        reflections,
        textureModel,
        { r1: currentR1, r2: currentR2, f1: currentF1, f2: currentF2 },
        habitHypothesis
      );
      setFitResult(res);
      setIsRefining(false);
    }, 250);
  };

  return (
    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              Non-Linear Least Squares Parameter Refinement
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Optimizes March parameter (r) and oriented volume fraction (f) to minimize profile residual R_wp
            </p>
          </div>
        </div>

        {/* Habit Hypothesis Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Habit Hypothesis:</span>
          <div className="flex items-center gap-1 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-inner">
            {(['Platelet', 'Needle', 'Bimodal'] as const).map(h => (
              <button
                key={h}
                onClick={() => setHabitHypothesis(h)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                  habitHypothesis === h
                    ? 'bg-indigo-500 text-white shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {h === 'Platelet' ? 'Platelet (r < 1)' : h === 'Needle' ? 'Needle (r > 1)' : 'Bimodal Dual'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action & Results Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Run Button */}
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 shadow-inner">
          <button
            onClick={handleRunRefinement}
            disabled={isRefining || reflections.length === 0}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRefining ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRefining ? 'Solving Least Squares...' : 'Run Levenberg-Marquardt Solver'}
          </button>

          <span className="text-[10px] text-slate-500 font-mono text-center">
            {reflections.length} active reflection planes in matrix
          </span>
        </div>

        {/* Refined Results Display */}
        {fitResult ? (
          <div className="md:col-span-2 p-5 bg-white dark:bg-black/60 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 space-y-4 shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Refined r₁</span>
                <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {fitResult.refinedR1.toFixed(3)}
                </span>
                {fitResult.uncertaintyR1 && (
                  <span className="text-[10px] text-slate-500 block font-mono">±{fitResult.uncertaintyR1.toFixed(4)}</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Refined Fraction f₁</span>
                <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">
                  {(fitResult.refinedFraction1 * 100).toFixed(1)}%
                </span>
                {fitResult.uncertaintyFraction1 && (
                  <span className="text-[10px] text-slate-500 block font-mono">±{(fitResult.uncertaintyFraction1 * 100).toFixed(2)}%</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Profile R_wp</span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {fitResult.rwp.toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">Rp: {fitResult.rp.toFixed(2)}%</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Reduced χ²</span>
                <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
                  {fitResult.reducedChiSquared.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">{fitResult.iterations} iterations</span>
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => onApplyRefinedParams(
                fitResult.refinedR1,
                fitResult.refinedFraction1,
                fitResult.refinedR2,
                fitResult.refinedFraction2
              )}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Refined Parameters To Active Workspace
            </button>
          </div>
        ) : (
          <div className="md:col-span-2 p-6 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
            <Target className="w-8 h-8 text-indigo-400 mb-2 opacity-50" />
            Click &quot;Run Levenberg-Marquardt Solver&quot; to compute the global minimum error state and parameter uncertainties.
          </div>
        )}
      </div>
    </div>
  );
};
