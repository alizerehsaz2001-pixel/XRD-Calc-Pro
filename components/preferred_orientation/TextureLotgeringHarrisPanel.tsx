import React, { useState } from 'react';
import { Award, BarChart3, Gauge, Activity, Compass } from 'lucide-react';
import { TextureAnalysisMetrics, PreferredOrientationReflection } from '../../utils/preferredOrientationPhysics';

interface TextureLotgeringHarrisPanelProps {
  metrics: TextureAnalysisMetrics;
  reflections: PreferredOrientationReflection[];
  targetFamily: string;
  onTargetFamilyChange: (family: string) => void;
}

export const TextureLotgeringHarrisPanel: React.FC<TextureLotgeringHarrisPanelProps> = ({
  metrics,
  reflections,
  targetFamily,
  onTargetFamilyChange
}) => {
  const [activeTab, setActiveTab] = useState<'Lotgering' | 'Harris' | 'Statistics'>('Lotgering');

  const families = [
    { id: '00l', label: '(00l) Basal / c-axis' },
    { id: 'h00', label: '(h00) a-axis' },
    { id: 'hk0', label: '(hk0) Prismatic' },
    { id: 'hhh', label: '(hhh) Octahedral {111}' }
  ];

  return (
    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm dark:shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-inner">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
              Quantitative Texture Metrology & Orientation Indices
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">
              Lotgering Orientation Factor (F), Harris Texture Coefficients (TC), ASTM Dispersion (σ), and Texture Entropy (S)
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl p-1 shadow-inner">
          {(['Lotgering', 'Harris', 'Statistics'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab === 'Lotgering' ? 'Lotgering Factor' : tab === 'Harris' ? 'Harris TC Matrix' : 'Entropy & Statistics'}
            </button>
          ))}
        </div>
      </div>

      {/* Lotgering Factor View */}
      {activeTab === 'Lotgering' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Gauge Visualization */}
          <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-emerald-500 transition-all duration-700 ease-out"
                  strokeWidth="10"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 * (1 - metrics.lotgeringF)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
                  {metrics.lotgeringF.toFixed(3)}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Lotgering F
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-2 font-mono">
              0.00 (Random) → 1.00 (Single Crystal)
            </span>
          </div>

          {/* Orientation Family Selector & Fractions */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Target Crystallographic Plane Family:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {families.map(f => (
                  <button
                    key={f.id}
                    onClick={() => onTargetFamilyChange(f.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                      targetFamily === f.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'bg-white dark:bg-black/40 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Formula Math & Fraction Breakdown */}
            <div className="p-4 bg-white dark:bg-black/60 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Observed Target Fraction (p):</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{metrics.lotgeringP.toFixed(4)}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Random Standard Fraction (p₀):</span>
                <strong className="text-slate-500">{metrics.lotgeringP0.toFixed(4)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 font-sans">
                Formula: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">F = (p - p₀) / (1 - p₀)</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Harris Texture Coefficient Matrix */}
      {activeTab === 'Harris' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {reflections.map((refl, idx) => {
              const isEnhanced = refl.harrisTC > 1.05;
              const isSuppressed = refl.harrisTC < 0.95;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    isEnhanced
                      ? 'bg-teal-500/10 border-teal-500/30'
                      : isSuppressed
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-white dark:bg-black/40 border-slate-200 dark:border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
                      {refl.hkl}
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      isEnhanced ? 'text-teal-600 dark:text-teal-400' : isSuppressed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                    }`}>
                      TC: {refl.harrisTC.toFixed(2)}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isEnhanced ? 'bg-teal-500' : 'bg-slate-400'}`}
                      style={{ width: `${Math.min(100, (refl.harrisTC / 3) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-white dark:bg-black/60 rounded-xl border border-slate-200 dark:border-white/5 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>TC &gt; 1.00: Preferred Growth Direction</span>
            <span>TC = 1.00: Isotropic Standard</span>
            <span>TC &lt; 1.00: Suppressed Out-of-Plane</span>
          </div>
        </div>
      )}

      {/* Statistics & Entropy View */}
      {activeTab === 'Statistics' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
              <Activity className="w-4 h-4 text-indigo-500" /> ASTM Degree of Texture (σ_TC)
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
              {metrics.degreeOfOrientationSigma.toFixed(3)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Standard deviation from isotropic random orientation (0 = perfectly random).</p>
          </div>

          <div className="p-4 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
              <Compass className="w-4 h-4 text-purple-500" /> Texture Entropy (S_tex)
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
              {metrics.textureEntropy.toFixed(3)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Information-theoretic disorder metric across measured reflection intensities.</p>
          </div>

          <div className="p-4 bg-white dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase mb-1">
              <Gauge className="w-4 h-4 text-amber-500" /> Est. Orientation FWHM (Δα)
            </div>
            <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
              {metrics.estimatedFwhmAlphaDeg.toFixed(1)}°
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Estimated rocking curve dispersion angular spread.</p>
          </div>
        </div>
      )}
    </div>
  );
};
