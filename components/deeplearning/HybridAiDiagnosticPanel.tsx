import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { DLAiDiagnosticReview, DLExplainabilityReport, DLPhaseCandidate } from '../../types';

interface HybridAiDiagnosticPanelProps {
  selectedCandidate: DLPhaseCandidate | null;
  explainabilityReport: DLExplainabilityReport | null;
  review: DLAiDiagnosticReview | null;
  isLoading: boolean;
  error: string | null;
  onRunReview: () => void;
  onOpenChatModal: () => void;
  onNavigateModule?: (moduleId: string) => void;
  onTriggerMixtureMode?: () => void;
}

const VERDICT_STYLES: Record<
  DLAiDiagnosticReview['verdict'],
  { label: string; textClass: string; borderClass: string }
> = {
  confirmed: {
    label: '● Phase Match Confirmed',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/35',
  },
  possible_mixture: {
    label: '▲ Possible Multi-Phase Mixture',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/35',
  },
  preferred_orientation: {
    label: '▲ Preferred Orientation Suspected',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    borderClass: 'border-cyan-500/35',
  },
  ambiguous_polymorph: {
    label: '▲ Ambiguous Polymorph Overlap',
    textClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/35',
  },
  low_confidence: {
    label: '✖ Low Confidence — Verify Pattern',
    textClass: 'text-rose-600 dark:text-rose-400',
    borderClass: 'border-rose-500/35',
  },
};

export const HybridAiDiagnosticPanel: React.FC<HybridAiDiagnosticPanelProps> = ({
  selectedCandidate,
  explainabilityReport,
  review,
  isLoading,
  error,
  onRunReview,
  onOpenChatModal,
  onNavigateModule,
  onTriggerMixtureMode,
}) => {
  if (!selectedCandidate) return null;

  const verdictStyle = review ? VERDICT_STYLES[review.verdict] : null;

  return (
    <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Hybrid Crystallographic Diagnostic Review</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Combines local 1D-CNN Bragg aberration &amp; MC-Dropout metrics with structured Gemini crystallographic verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenChatModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] hover:border-slate-400 dark:hover:border-slate-600 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-500" />
            <span>Ask Follow-Up</span>
          </button>

          <button
            type="button"
            onClick={onRunReview}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reviewing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{review ? 'Re-Run AI Review' : 'Run Gemini Diagnostic Review'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline local telemetry context before/during review */}
      {explainabilityReport && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
          <span>
            Candidate: <strong className="text-slate-800 dark:text-slate-200">{selectedCandidate.phase_name}</strong>
          </span>
          <span>·</span>
          <span>
            MC Conf: {explainabilityReport.meanConfidencePct.toFixed(1)}% ± {explainabilityReport.confidenceStdPct.toFixed(2)}%
          </span>
          <span>·</span>
          <span>
            Zero-Shift: {explainabilityReport.zeroShiftDeg >= 0 ? '+' : ''}
            {explainabilityReport.zeroShiftDeg.toFixed(3)}°
          </span>
          <span>·</span>
          <span>
            Strain: {explainabilityReport.isotropicStrainPct >= 0 ? '+' : ''}
            {explainabilityReport.isotropicStrainPct.toFixed(2)}%
          </span>
          <span>·</span>
          <span>Unmatched Peaks: {explainabilityReport.unexplainedPeaks.length}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-sm border border-rose-500/40 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Gemini Diagnostic Review Unavailable</div>
            <div className="mt-0.5 opacity-90">{error}</div>
          </div>
        </div>
      )}

      {!review && !isLoading && !error && (
        <div className="mt-4 p-4 rounded-sm border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-[#0B0F19] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Click <strong className="text-slate-900 dark:text-white">Run Gemini Diagnostic Review</strong> to audit polymorph ambiguity, preferred orientation, unexplained residual peaks, and recommended Rietveld refinement constraints for{' '}
            <strong className="text-slate-900 dark:text-white">{selectedCandidate.phase_name}</strong>.
          </p>
        </div>
      )}

      {review && verdictStyle && (
        <div className="mt-4 space-y-4">
          {/* Verdict + Executive Summary */}
          <div className={`p-3.5 rounded-sm border bg-slate-50 dark:bg-[#0B0F19] ${verdictStyle.borderClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${verdictStyle.textClass}`}>
                {verdictStyle.label} — {review.verdictLabel}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Model: {review.modelUsed}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
              {review.executiveSummary}
            </p>
          </div>

          {/* Structured Diagnostic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19]">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                Uncertainty &amp; Margin Calibration
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {review.confidenceCalibration}
              </p>
            </div>

            <div className="p-3.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19]">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
                Polymorph &amp; Texture Assessment
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {review.polymorphAndTextureCheck}
              </p>
            </div>
          </div>

          {/* Peak Diagnostics & Recommended Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-sm border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Key Reflection Findings
              </div>
              <ul className="space-y-1.5">
                {review.peakDiagnostics.map((item, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-sm border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Recommended Refinement Actions
              </div>
              <ul className="space-y-1.5">
                {review.recommendedNextSteps.map((step, i) => (
                  <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Module Handoff Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {review.verdict === 'possible_mixture' && onTriggerMixtureMode && (
              <button
                type="button"
                onClick={onTriggerMixtureMode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Deconvolve Mixture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onNavigateModule && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateModule('rietveld')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] hover:border-indigo-500/60 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Verify in Rietveld Refinement</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateModule('texture')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] hover:border-cyan-500/60 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Check Texture / Pole Figure</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-500" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
