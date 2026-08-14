import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, X, Activity, MoveHorizontal, Layers3, SlidersHorizontal, Sparkles } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#080d1a] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t('How to Interpret XRD Compare & Residuals')}</h3>
              <p className="text-xs text-slate-400 font-mono">{t('Crystallographic Match & Diagnostics User Guide')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-mono">
          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px]">
              <Activity className="w-4 h-4" />
              <span>1. Quantitative Residual Metrics (Rp, Rwp, Pearson r)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              • <strong className="text-rose-400">Profile Residual (Rp):</strong> Sum of absolute differences |I_A - I_B| divided by total intensity. Values below 10-15% denote excellent profile agreement.
              <br />
              • <strong className="text-amber-400">Weighted Profile Residual (Rwp):</strong> Gives higher statistical weight to strong diffraction peaks.
              <br />
              • <strong className="text-emerald-400">Pearson Cross-Correlation (r):</strong> Measure of shape and peak profile alignment. Values &gt; 95% indicate strong phase identity.
            </p>
          </div>

          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
              <MoveHorizontal className="w-4 h-4" />
              <span>2. Position Shifts (Δ2θ) & Lattice Strain</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              • A positive shift (+Δ2θ) indicates unit cell contraction (smaller d-spacing), often caused by smaller ionic substitutions or compressive stress.
              <br />
              • A negative shift (-Δ2θ) indicates unit cell expansion (larger d-spacing).
              <br />
              • Click <strong className="text-amber-300">Auto Align</strong> to compensate for zero-point detector offset or sample displacement errors.
            </p>
          </div>

          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px]">
              <Layers3 className="w-4 h-4" />
              <span>3. Unindexed Reflections & Multi-Phase Deconvolution</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              • Any peaks in Sample A that do not match reference Sample B appear in the <strong className="text-indigo-300">Extra / Impurity Peaks</strong> list.
              <br />
              • Use <strong className="text-purple-300">Secondary Phase C</strong> and the <strong className="text-purple-300">Phase Fractions Solver</strong> to deconvolve biphasic mixtures (e.g. HAp + β-TCP).
            </p>
          </div>

          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
              <SlidersHorizontal className="w-4 h-4" />
              <span>4. View Modes (3-Pane Stacked, Unified Overlay, Butterfly Mirror, 1st Derivative)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              • <strong className="text-white">3-Pane Stacked:</strong> Stacked view showing Sample A, Sample B, and the Delta Residual profile simultaneously.
              <br />
              • <strong className="text-white">Unified Overlay:</strong> Direct overlay on single axis with filled areas.
              <br />
              • <strong className="text-white">Butterfly Mirror:</strong> Mirrors Reference B below zero for symmetry inspection.
              <br />
              • <strong className="text-white">1st Derivative:</strong> Computes dI/d2θ to identify subtle shoulders and hidden doublet peaks.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
          >
            {t('Got It')}
          </button>
        </div>
      </div>
    </div>
  );
};
