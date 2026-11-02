import React from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, X, Activity, MoveHorizontal, Layers3, SlidersHorizontal, Atom } from 'lucide-react';

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
              <h3 className="text-base font-bold text-white">{t('Crystallographic Compare & Quantification Reference')}</h3>
              <p className="text-xs text-slate-400 font-mono">{t('Rietveld Residuals, Caglioti Physics, RIR Weights & Strain Separation')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-mono">
          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-[11px]">
              <Activity className="w-4 h-4" />
              <span>01. Quantitative Residual Metrics (Rp, Rwp, χ², Cosine & Durbin-Watson)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              · <strong className="text-rose-400">Profile Residual (Rp) & Weighted (Rwp):</strong> Measure relative discrepancy between experimental Sample A and the composite reference model using Poisson counting weights w_i = 1 / max(I_obs, 1).
              <br />
              · <strong className="text-emerald-400">Cosine Similarity & Spearman ρ:</strong> Evaluate vector-angle alignment and rank-order correlation across the full 2θ range.
              <br />
              · <strong className="text-cyan-400">Durbin-Watson (d_DW):</strong> Detects serial correlation in the difference curve (values near 2.0 indicate uncorrelated random counting noise).
            </p>
          </div>

          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-[11px]">
              <Atom className="w-4 h-4" />
              <span>02. Caglioti Resolution & Cu Kα₁/Kα₂ Doublet Physics</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              · <strong className="text-cyan-300">Caglioti Dispersion:</strong> Models angle-dependent instrumental broadening via FWHM²(θ) = U·tan²θ + V·tanθ + W.
              <br />
              · <strong className="text-amber-300">Cu Kα₁/Kα₂ Doublet & Rachinger Strip:</strong> Synthesizes the 2:1 Kα₁ (1.540598 Å) and Kα₂ (1.544426 Å) doublet splitting at high angles, or strips Kα₂ contributions via the analytical Rachinger recursion.
            </p>
          </div>

          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[11px]">
              <MoveHorizontal className="w-4 h-4" />
              <span>03. Zero-Shift (Δ2θ₀) vs. Specimen Displacement vs. Lattice Strain (ε)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              · Observed peak shifts follow Δ2θ(θ) = Δ2θ₀ - (2s/R)·cos(θ) - 2ε·tan(θ)·(180/π).
              <br />
              · The <strong className="text-amber-300">Zero-Shift & Strain</strong> tab performs weighted linear regression across all indexed reflections to separate constant goniometer zero-offset (Δ2θ₀) from true physical lattice expansion or contraction (ε = Δd/d).
            </p>
          </div>

          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold uppercase text-[11px]">
              <Layers3 className="w-4 h-4" />
              <span>04. Analytical NNLS + Reference Intensity Ratio (I/Ic RIR) & Residual Search</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              · Converts non-negative least-squares spectral scale factors into physical weight percentages using Corundum reference intensity ratios: wt%_k = (I_k / RIR_k) / Σ(I_j / RIR_j).
              <br />
              · Use <strong className="text-amber-300">Residual Unmatched Search</strong> inside the Search-Match modal to identify secondary impurity phases (Phase C and Phase D) directly from unexplained peaks in Sample A.
            </p>
          </div>

          <div className="bg-[#030712] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[11px]">
              <SlidersHorizontal className="w-4 h-4" />
              <span>05. View Modes, Y-Axis Scaling & Precision Peak Caliper</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              · Switch Y-Scale between <strong className="text-white">Linear I</strong>, <strong className="text-white">Square Root √I</strong>, and <strong className="text-white">Log₁₀(I + 1)</strong> to inspect weak trace reflections (&lt;2% intensity).
              <br />
              · Activate the <strong className="text-emerald-300">Caliper Tool</strong> to select any two reflections from dropdowns or by clicking the chart, with ±0.01° fine-stepping.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            {t('Got It')}
          </button>
        </div>
      </div>
    </div>
  );
};
