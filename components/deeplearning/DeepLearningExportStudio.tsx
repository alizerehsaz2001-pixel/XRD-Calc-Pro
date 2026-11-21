import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode, FileJson, FileText, Table } from 'lucide-react';
import { DLAiDiagnosticReview, DLExplainabilityReport, DLPhaseResult } from '../../types';
import { getPythonEngineCode } from '../../utils/dlPythonExporter';
import { playSynthTone } from '../../utils/sound';

interface DeepLearningExportStudioProps {
  engineConfig: any;
  result: DLPhaseResult | null;
  explainabilityReport: DLExplainabilityReport | null;
  aiReview: DLAiDiagnosticReview | null;
  wavelengthA: number;
  pointsCount: number;
}

const ARCH_OPTIONS = [
  { id: 'cnn', label: '1D-ResNet CNN' },
  { id: 'transformer', label: 'XRD-Former Attention' },
  { id: 'graph_gnn', label: 'Crystal Graph GNN' },
  { id: 'rag_pipeline', label: 'Hybrid Vector RAG' },
] as const;

export const DeepLearningExportStudio: React.FC<DeepLearningExportStudioProps> = ({
  engineConfig,
  result,
  explainabilityReport,
  aiReview,
  wavelengthA,
  pointsCount,
}) => {
  const [selectedArch, setSelectedArch] = useState<'cnn' | 'transformer' | 'graph_gnn' | 'rag_pipeline'>('cnn');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const pythonCode = useMemo(
    () => getPythonEngineCode(selectedArch, engineConfig),
    [selectedArch, engineConfig]
  );

  const markdownReport = useMemo(() => {
    const lines: string[] = [
      '# Deep Learning XRD Phase Identification & Explainability Report',
      '',
      `- Generated: ${new Date().toISOString()}`,
      `- Radiation Wavelength: ${wavelengthA.toFixed(5)} Å`,
      `- Input Data Points: ${pointsCount}`,
      `- Active Engine: ${engineConfig.activation} · ${engineConfig.filters} filters · kernel ${engineConfig.kernelSize} · dropout ${engineConfig.dropout}`,
      '',
    ];

    if (result?.candidates && result.candidates.length > 0) {
      lines.push('## Ranked Phase Candidates', '');
      lines.push('| Rank | Phase | Formula | System | Confidence (%) | Hanawalt FOM | Zero Shift (°) | Strain (%) |');
      lines.push('|---:|---|---|---|---:|---:|---:|---:|');
      result.candidates.slice(0, 6).forEach((c, idx) => {
        lines.push(
          `| ${idx + 1} | ${c.phase_name} | ${c.formula} | ${c.crystalSystem || '—'} | ${c.confidence_score.toFixed(1)} | ${c.hanawaltFom?.toFixed(1) ?? '—'} | ${c.zeroShiftDeg?.toFixed(3) ?? '0.000'} | ${c.fitted_strain_pct?.toFixed(3) ?? '0.000'} |`
        );
      });
      lines.push('');
    }

    if (explainabilityReport) {
      lines.push(
        `## Explainability & MC-Dropout Uncertainty (${explainabilityReport.candidateName})`,
        '',
        `- MC-Dropout Confidence (N=${explainabilityReport.mcPasses}): **${explainabilityReport.meanConfidencePct.toFixed(1)}% ± ${explainabilityReport.confidenceStdPct.toFixed(2)}%** (95% CI: ${explainabilityReport.ci95LowPct.toFixed(1)}%–${explainabilityReport.ci95HighPct.toFixed(1)}%)`,
        `- Predictive Shannon Entropy: **${explainabilityReport.predictiveEntropy.toFixed(3)}** | Decision Margin: **+${explainabilityReport.decisionMarginPct.toFixed(1)}%**`,
        `- Physics Bragg Calibration: Zero Shift **${explainabilityReport.zeroShiftDeg.toFixed(4)}°** | Displacement **${explainabilityReport.displacementMm.toFixed(3)} mm** | Isotropic Strain **${explainabilityReport.isotropicStrainPct.toFixed(3)}%** | Profile Rwp **${explainabilityReport.profileRwpPct.toFixed(1)}%**`,
        `- Texture Anomaly Score: **${(explainabilityReport.textureAnomalyScore * 100).toFixed(0)}%** | Unexplained Residual Peaks: **${explainabilityReport.unexplainedPeaks.length}**`,
        ''
      );

      if (explainabilityReport.peakAttributions.length > 0) {
        lines.push('### Top (hkl) Peak Attributions', '');
        lines.push('| (hkl) | 2θ Ref (°) | 2θ Obs (°) | Δ2θ (°) | d (Å) | Grad-CAM | Occlusion Δ (%) | Status |');
        lines.push('|---|---:|---:|---:|---:|---:|---:|---|');
        explainabilityReport.peakAttributions.slice(0, 12).forEach((pk) => {
          lines.push(
            `| ${pk.hkl} | ${pk.refTwoTheta.toFixed(2)} | ${pk.obsTwoTheta !== null ? pk.obsTwoTheta.toFixed(2) : '—'} | ${pk.deltaTwoTheta.toFixed(3)} | ${pk.dSpacingA.toFixed(4)} | ${(pk.gradCamWeight * 100).toFixed(0)}% | -${pk.occlusionDeltaPct.toFixed(1)}% | ${pk.status} |`
          );
        });
        lines.push('');
      }
    }

    if (aiReview) {
      lines.push(
        `## Gemini Crystallographic Diagnostic Review (${aiReview.modelUsed})`,
        '',
        `- Verdict: **${aiReview.verdictLabel}**`,
        `- Summary: ${aiReview.executiveSummary}`,
        `- Confidence Calibration: ${aiReview.confidenceCalibration}`,
        `- Polymorph & Texture Check: ${aiReview.polymorphAndTextureCheck}`,
        '',
        '### Recommended Refinement Steps',
        ...aiReview.recommendedNextSteps.map((s) => `- ${s}`),
        ''
      );
    }

    return lines.join('\n');
  }, [result, explainabilityReport, aiReview, wavelengthA, pointsCount, engineConfig]);

  const peakAttributionCsv = useMemo(() => {
    const header = 'hkl,ref_2theta_deg,obs_2theta_deg,delta_2theta_deg,d_spacing_A,ref_intensity,obs_intensity,gradcam_weight,occlusion_delta_pct,status';
    if (!explainabilityReport) return header;
    const rows = explainabilityReport.peakAttributions.map((pk) =>
      [
        `"${pk.hkl}"`,
        pk.refTwoTheta.toFixed(3),
        pk.obsTwoTheta !== null ? pk.obsTwoTheta.toFixed(3) : '',
        pk.deltaTwoTheta.toFixed(4),
        pk.dSpacingA.toFixed(5),
        pk.refIntensity.toFixed(2),
        pk.obsIntensity.toFixed(2),
        pk.gradCamWeight.toFixed(4),
        pk.occlusionDeltaPct.toFixed(2),
        pk.status,
      ].join(',')
    );
    return [header, ...rows].join('\n');
  }, [explainabilityReport]);

  const telemetryJson = useMemo(() => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        wavelengthA,
        pointsCount,
        engineConfig,
        candidates: result?.candidates?.slice(0, 8) || [],
        explainability: explainabilityReport
          ? {
              ...explainabilityReport,
              gradCamCurve: explainabilityReport.gradCamCurve.filter((_, idx) => idx % 2 === 0),
            }
          : null,
        aiReview,
      },
      null,
      2
    );
  }, [wavelengthA, pointsCount, engineConfig, result, explainabilityReport, aiReview]);

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSynthTone('success');
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    playSynthTone('tick');
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const slug = (explainabilityReport?.candidateName || 'xrd_dl_run')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 32);

  return (
    <div className="space-y-4">
      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
              <span>Publication Report (.md)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Complete phase ranking, MC-Dropout uncertainty, Bragg zero-shift/strain calibration, peak attribution table, and Gemini diagnostic audit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerDownload(`${slug}_report.md`, markdownReport, 'text/markdown')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy('md', markdownReport)}
              className="px-2.5 py-2 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 hover:border-slate-400 cursor-pointer"
              title="Copy Markdown"
            >
              {copiedKey === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Table className="w-4 h-4" />
              <span>Peak Attribution CSV</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Spreadsheet-ready per-(hkl) reflection table with 2θ residuals, d-spacings, Grad-CAM weights, and occlusion importance scores.
            </p>
          </div>
          <button
            type="button"
            disabled={!explainabilityReport}
            onClick={() => triggerDownload(`${slug}_peak_attribution.csv`, peakAttributionCsv, 'text/csv')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-mono font-bold cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .csv</span>
          </button>
        </div>

        <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm p-4 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              <FileJson className="w-4 h-4" />
              <span>Full Telemetry Bundle (.json)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Structured JSON archive of hyperparameters, top candidates, Grad-CAM trace, MC-Dropout posteriors, and Gemini review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => triggerDownload(`${slug}_telemetry.json`, telemetryJson, 'application/json')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Synchronized PyTorch Model Exporter */}
      <div className="bg-white dark:bg-[#070A12] border border-slate-200 dark:border-slate-800 rounded-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            <FileCode className="w-4 h-4 text-indigo-500" />
            <span>Synchronized PyTorch Model Blueprint</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {ARCH_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedArch(opt.id);
                  playSynthTone('tick');
                }}
                className={`px-2.5 py-1 rounded-sm text-xs font-mono font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedArch === opt.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-50 dark:bg-[#0B0F19] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleCopy('py', pythonCode)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] text-xs font-mono text-slate-700 dark:text-slate-300 hover:border-slate-400 cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedKey === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'py' ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={() => triggerDownload(`xrd_${selectedArch}_model.py`, pythonCode, 'text/x-python')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-slate-900 dark:bg-indigo-600 text-white text-xs font-mono font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.py</span>
            </button>
          </div>
        </div>

        <pre className="p-4 text-[11px] font-mono leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#050810] overflow-x-auto max-h-[420px]">
          <code>{pythonCode}</code>
        </pre>
      </div>
    </div>
  );
};
