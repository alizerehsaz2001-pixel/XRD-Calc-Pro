import React, { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Info,
  RotateCcw,
  Target,
} from 'lucide-react';
import { LatexInline, ProtocolHeader, StatusIndicator } from './ProtocolShared';

export interface ChecklistStep {
  text: string;
  desc: string;
  tolerance: string;
}

export const LAB_CHECKLIST_STEPS: ChecklistStep[] = [
  {
    text: 'Zero-Height Flat Specimen Mounting',
    desc: 'Level powder flush with holder rim using glass slide shear without pressing preferred-orientation platelets.',
    tolerance: '|s| ≤ 25 µm',
  },
  {
    text: 'NIST Standard Calibration Scan (LaB₆ / Si)',
    desc: 'Collect SRM 660c (LaB₆) or SRM 640f (Si) under identical slit optics to parameterize instrumental FWHM & zero-shift.',
    tolerance: 'R_wp < 5%',
  },
  {
    text: 'High-Density Step Size & Dwell Collection',
    desc: 'Collect ≥ 8–10 data points across the narrowest peak FWHM to avoid centroid distortion or Fourier truncation.',
    tolerance: 'Δ2θ ≤ 0.02°',
  },
  {
    text: 'Baseline & Chebyshev Background Modeling',
    desc: 'Determine air-scatter / fluorescence baseline across clean inter-peak intervals before deconvolving overlapping reflections.',
    tolerance: 'Order ≤ 6',
  },
  {
    text: 'Kα₂ Stripping or Full Doublet Convolution',
    desc: 'Account for Cu Kα₁/Kα₂ splitting (λ₂/λ₁ = 1.00248, 0.5 intensity ratio) across middle and high 2θ reflections.',
    tolerance: '2:1 Ratio',
  },
  {
    text: 'Microstructural Validation & Journal Sign-Off',
    desc: 'Confirm β_obs > 1.15·β_inst before computing Scherrer/W-H size & strain; export CIF/SOP metadata bundle.',
    tolerance: 'GoF ≈ 1.0–1.5',
  },
];

interface SopDisplacementSectionProps {
  checklist: boolean[];
  onToggleChecklist: (idx: number) => void;
  onResetChecklist: () => void;
  dispHeight: number;
  setDispHeight: (val: number) => void;
  gonioRadius: number;
  setGonioRadius: (val: number) => void;
  dispThetaTrue: number;
  setDispThetaTrue: (val: number) => void;
  checklistParams: { rFactor: number; rBragg: number; chi2: number; converged: boolean };
}

export const SopDisplacementSection: React.FC<SopDisplacementSectionProps> = ({
  checklist,
  onToggleChecklist,
  onResetChecklist,
  dispHeight,
  setDispHeight,
  gonioRadius,
  setGonioRadius,
  dispThetaTrue,
  setDispThetaTrue,
  checklistParams,
}) => {
  const [copiedSop, setCopiedSop] = useState(false);
  const [hoverCurveTheta, setHoverCurveTheta] = useState<number | null>(null);

  const checklistCount = checklist.filter(Boolean).length;
  const checklistScore = Math.round((checklistCount / LAB_CHECKLIST_STEPS.length) * 100);

  const thetaRad = ((dispThetaTrue / 2) * Math.PI) / 180;
  const dispDeltaRad = (2 * dispHeight * Math.cos(thetaRad)) / gonioRadius;
  const dispDeltaDeg = (dispDeltaRad * 180) / Math.PI;
  const dispThetaShifted = dispThetaTrue + dispDeltaDeg;

  const lambda = 1.54056;
  const dTrue = lambda / (2 * Math.sin(thetaRad));
  const dApparent = lambda / (2 * Math.sin(((dispThetaShifted / 2) * Math.PI) / 180));
  const dStrainArtifactPct = ((dApparent - dTrue) / dTrue) * 100;

  const buildSopMarkdown = () => `# XRD LABORATORY STANDARD OPERATING PROCEDURE (SOP) AUDIT
Generated: ${new Date().toISOString().split('T')[0]}
Audit Compliance Score: ${checklistScore}% (${checklistCount}/${LAB_CHECKLIST_STEPS.length} Gates)

## Verification Gates
${LAB_CHECKLIST_STEPS.map((s, i) => `- [${checklist[i] ? 'X' : ' '}] ${s.text} (${s.tolerance}) — ${s.desc}`).join('\n')}

## Specimen Displacement Calibration Summary
- Specimen Height Offset (s): ${dispHeight >= 0 ? '+' : ''}${dispHeight.toFixed(3)} mm (${Math.round(dispHeight * 1000)} µm)
- Goniometer Radius (R): ${gonioRadius} mm
- Reference Peak Position (2θ₀): ${dispThetaTrue.toFixed(2)}°
- Induced Angular Shift (Δ2θ): ${dispDeltaDeg >= 0 ? '+' : ''}${dispDeltaDeg.toFixed(4)}°
- Apparent d-Spacing Artifact: ${dApparent.toFixed(4)} Å vs True ${dTrue.toFixed(4)} Å (${dStrainArtifactPct >= 0 ? '+' : ''}${dStrainArtifactPct.toFixed(3)}%)

## Refinement Convergence Readout
- R_wp: ${checklistParams.rFactor.toFixed(1)}%
- R_Bragg: ${checklistParams.rBragg.toFixed(1)}%
- Goodness of Fit (χ²): ${checklistParams.chi2.toFixed(2)}
- Status: ${checklistParams.converged ? 'CONVERGED' : 'IN PROGRESS'}
`;

  const handleCopySop = () => {
    navigator.clipboard.writeText(buildSopMarkdown());
    setCopiedSop(true);
    setTimeout(() => setCopiedSop(false), 2000);
  };

  const handleDownloadSop = () => {
    const blob = new Blob([buildSopMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xrd-sop-audit-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gradeTone =
    checklistScore === 100 ? 'nominal' : checklistScore >= 60 ? 'warning' : 'critical';
  const gradeLabel =
    checklistScore === 100
      ? 'Publication Ready (Grade A)'
      : checklistScore >= 60
      ? 'Partial Compliance (Grade B)'
      : 'Preliminary Setup (Grade C)';

  const absShift = Math.abs(dispDeltaDeg);
  const shiftStatus =
    absShift < 0.005
      ? { tone: 'nominal' as const, label: 'Nominal Alignment' }
      : absShift <= 0.025
      ? { tone: 'warning' as const, label: 'Moderate Height Drift' }
      : { tone: 'critical' as const, label: 'Severe Shift Aberration' };

  return (
    <div className="space-y-8">
      <ProtocolHeader
        badge="SOP-01 • Experimental Calibration"
        badgeTone="indigo"
        title="Laboratory Refinement Roadmap & Alignment Protocol"
        subtitle="Verify pre-acquisition hardware tolerances and benchmark specimen displacement aberrations prior to profile fitting or Rietveld convergence."
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetChecklist}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={handleDownloadSop}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Download size={13} /> Export .MD
            </button>
            <button
              type="button"
              onClick={handleCopySop}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedSop ? <Check size={13} /> : <Copy size={13} />}
              {copiedSop ? 'SOP Copied' : 'Copy SOP Report'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        <div className="md:col-span-5 lg:col-span-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Audit Compliance Score
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-4xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {checklistScore}
                </span>
                <span className="text-sm font-mono font-semibold text-slate-500">%</span>
              </div>
            </div>
            <Award className="w-6 h-6 text-indigo-500 shrink-0" />
          </div>

          <div className="mt-5 space-y-2.5">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  checklistScore === 100
                    ? 'bg-emerald-500'
                    : checklistScore >= 60
                    ? 'bg-indigo-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${checklistScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <StatusIndicator tone={gradeTone} label={gradeLabel} />
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {checklistCount}/{LAB_CHECKLIST_STEPS.length} Gates
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 lg:col-span-8 bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 shrink-0 self-start sm:self-center">
            <Target className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                Empirical Calibration Standard
              </h3>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                IUCr / ASTM E975
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Systematic peak position drift from specimen height offset (<span className="font-mono text-white">s</span>) biases unit-cell parameters proportionally to{' '}
              <span className="font-mono text-cyan-300">cosθ</span>. Completing instrument standard subtraction and zero-height mounting prevents false microstrain and cell-volume errors up to <span className="font-mono font-semibold text-white">0.4%</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-indigo-500" />
            Pre-Refinement Verification Gates
          </h3>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Click a gate to toggle verification status
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {LAB_CHECKLIST_STEPS.map((step, idx) => {
            const checked = checklist[idx];
            return (
              <button
                key={idx}
                id={`checklist-item-${idx}`}
                type="button"
                onClick={() => onToggleChecklist(idx)}
                className={`p-4 rounded-xl text-left border transition-colors flex items-start gap-3.5 ${
                  checked
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    checked
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {checked && <Check size={12} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4
                      className={`text-sm font-bold leading-snug ${
                        checked
                          ? 'text-indigo-950 dark:text-indigo-100'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {idx + 1}. {step.text}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                      {step.tolerance}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[10px] font-mono font-bold uppercase tracking-wider rounded border border-rose-200 dark:border-rose-500/30">
                Bragg-Brentano Optical Aberration
              </span>
              <StatusIndicator tone={shiftStatus.tone} label={shiftStatus.label} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white pt-1">
              Specimen Displacement Calibration Simulator
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
              Offsetting the specimen surface by height <span className="font-mono font-semibold">s</span> relative to the focusing axis shifts measured Bragg positions by{' '}
              <LatexInline tex="\Delta 2\theta = \frac{2s}{R}\cos\theta" className="text-slate-900 dark:text-slate-100 font-semibold" />.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDispHeight(0);
                setDispThetaTrue(28.443);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 whitespace-nowrap"
            >
              Si (111) Flush 28.44°
            </button>
            <button
              type="button"
              onClick={() => {
                setDispHeight(0.12);
                setDispThetaTrue(21.358);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 whitespace-nowrap"
            >
              LaB₆ (100) +120 µm
            </button>
            <button
              type="button"
              onClick={() => {
                setDispHeight(-0.18);
                setDispThetaTrue(35.152);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 whitespace-nowrap"
            >
              Al₂O₃ (104) -180 µm
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Surface Offset (s)</span>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      dispHeight === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {dispHeight > 0 ? '+' : ''}
                    {dispHeight.toFixed(3)} mm ({Math.round(dispHeight * 1000)} µm)
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.3"
                  max="0.3"
                  step="0.005"
                  value={dispHeight}
                  onChange={(e) => setDispHeight(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>-300 µm Recessed</span>
                  <span>0 Flush</span>
                  <span>+300 µm Raised</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Goniometer Radius (R)</span>
                  <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                    {gonioRadius} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="320"
                  step="5"
                  value={gonioRadius}
                  onChange={(e) => setGonioRadius(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>150 mm Benchtop</span>
                  <span>240 mm</span>
                  <span>320 mm HR</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>True Bragg Angle (2θ₀)</span>
                  <span className="font-mono tabular-nums font-bold text-cyan-600 dark:text-cyan-400">
                    {dispThetaTrue.toFixed(2)}°
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="110"
                  step="0.5"
                  value={dispThetaTrue}
                  onChange={(e) => setDispThetaTrue(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                <Info size={12} className="text-indigo-500" />
                <span>Apparent Lattice Artifact</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-1">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">True d (Cu Kα₁)</span>
                  <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {dTrue.toFixed(4)} Å
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Apparent Δd/d</span>
                  <span
                    className={`font-bold tabular-nums ${
                      Math.abs(dStrainArtifactPct) > 0.1
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {dStrainArtifactPct >= 0 ? '+' : ''}
                    {dStrainArtifactPct.toFixed(3)}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                {absShift > 0.05
                  ? 'Peak offset exceeds typical step resolution. Correct specimen mounting or enable cosθ displacement parameter prior to lattice refinement.'
                  : absShift > 0.015
                  ? 'Measurable peak drift that mimics artificial lattice strain unless refined as specimen displacement.'
                  : 'Within routine laboratory mounting tolerances for general phase analysis.'}
              </p>
            </div>
          </div>

          <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1D Profile Shift Overlay
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">— True</span>
                  <span className="text-rose-500">— Observed</span>
                </div>
              </div>

              <div className="h-44 w-full bg-slate-950 rounded-lg border border-slate-800 p-2 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 220 110" preserveAspectRatio="none">
                  {[25, 50, 75].map((y) => (
                    <line key={y} x1="10" y1={y} x2="210" y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="0.6" />
                  ))}
                  <line x1="10" y1="95" x2="210" y2="95" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />

                  {(() => {
                    const pxPerDeg = 220;
                    const clampedShiftPx = Math.max(-75, Math.min(75, dispDeltaDeg * pxPerDeg));
                    const centerTrue = 110;
                    const centerShifted = 110 + clampedShiftPx;
                    const sigmaPx = 11;

                    const makeCurve = (cx: number) =>
                      Array.from({ length: 101 }, (_, i) => {
                        const x = 10 + (i / 100) * 200;
                        const y = 78 * Math.exp(-Math.pow(x - cx, 2) / (2 * sigmaPx * sigmaPx));
                        return `${x.toFixed(1)},${(95 - y).toFixed(1)}`;
                      }).join(' ');

                    return (
                      <>
                        <line x1={centerTrue} y1="12" x2={centerTrue} y2="95" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
                        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={makeCurve(centerTrue)} />
                        {Math.abs(dispDeltaDeg) > 1e-4 && (
                          <>
                            <line x1={centerShifted} y1="12" x2={centerShifted} y2="95" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
                            <polyline fill="none" stroke="#f43f5e" strokeWidth="2" points={makeCurve(centerShifted)} />
                            <line x1={centerTrue} y1="30" x2={centerShifted} y2="30" stroke="#38bdf8" strokeWidth="1.5" />
                            <circle cx={centerShifted} cy="30" r="2.2" fill="#38bdf8" />
                          </>
                        )}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">True 2θ₀</span>
                  <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {dispThetaTrue.toFixed(3)}°
                  </span>
                </div>
                <div className="border-x border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block">Shift Δ2θ</span>
                  <span className={`text-xs font-bold tabular-nums ${dispHeight === 0 ? 'text-slate-500' : 'text-rose-500'}`}>
                    {dispDeltaDeg >= 0 ? '+' : ''}{dispDeltaDeg.toFixed(4)}°
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Obs 2θ</span>
                  <span className={`text-xs font-bold tabular-nums ${dispHeight === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {dispThetaShifted.toFixed(3)}°
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Goniometer Ray Geometry & cosθ Drift
                </span>
                <span className="text-[10px] font-mono text-cyan-500 font-semibold">
                  s = {dispHeight > 0 ? '+' : ''}{dispHeight.toFixed(2)} mm
                </span>
              </div>

              <div className="h-44 w-full bg-slate-950 rounded-lg border border-slate-800 p-2 relative overflow-hidden">
                <svg
                  className="w-full h-full cursor-crosshair"
                  viewBox="0 0 220 110"
                  onMouseLeave={() => setHoverCurveTheta(null)}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xSvg = ((e.clientX - rect.left) / rect.width) * 220;
                    if (xSvg >= 115 && xSvg <= 208) {
                      setHoverCurveTheta(10 + ((xSvg - 115) / 93) * 110);
                    } else {
                      setHoverCurveTheta(null);
                    }
                  }}
                >
                  <path d="M 12,86 A 48,48 0 0,1 100,86" fill="none" stroke="rgba(16,185,129,0.28)" strokeWidth="1" strokeDasharray="3,3" />
                  <circle cx="16" cy="76" r="3.5" fill="#818cf8" />
                  <text x="16" y="92" fontSize="6.5" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">SRC</text>
                  <circle cx="96" cy="76" r="3.5" fill="#22d3ee" />
                  <text x="96" y="92" fontSize="6.5" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">DET</text>

                  <line x1="36" y1="54" x2="76" y2="54" stroke="#10b981" strokeWidth="1.2" opacity="0.7" />
                  <circle cx="56" cy="54" r="1.8" fill="#10b981" />
                  <line x1="16" y1="76" x2="56" y2="54" stroke="#10b981" strokeWidth="0.9" strokeDasharray="2,2" opacity="0.65" />
                  <line x1="56" y1="54" x2="96" y2="76" stroke="#10b981" strokeWidth="0.9" strokeDasharray="2,2" opacity="0.65" />

                  {(() => {
                    const yShiftPx = dispHeight * 45;
                    const surfY = 54 - yShiftPx;
                    const xHit = 56 - yShiftPx / 0.55;
                    const yAtDetX = surfY + 0.55 * (96 - xHit);
                    return (
                      <>
                        <line x1="36" y1={surfY} x2="76" y2={surfY} stroke="#f43f5e" strokeWidth="1.8" />
                        <circle cx={xHit} cy={surfY} r="2.1" fill="#f43f5e" />
                        <line x1="16" y1="76" x2={xHit} y2={surfY} stroke="#f43f5e" strokeWidth="1" opacity="0.9" />
                        <line x1={xHit} y1={surfY} x2="96" y2={yAtDetX} stroke="#f43f5e" strokeWidth="1.1" />
                        <circle cx="96" cy={yAtDetX} r="2.2" fill="#f43f5e" />
                      </>
                    );
                  })()}

                  <line x1="108" y1="10" x2="108" y2="100" stroke="rgba(148,163,184,0.18)" strokeWidth="0.8" />
                  <text x="162" y="13" fontSize="6.5" fontFamily="monospace" fill="#94a3b8" textAnchor="middle">SHIFT Δ2θ vs 2θ</text>
                  <line x1="115" y1="56" x2="208" y2="56" stroke="rgba(148,163,184,0.35)" strokeWidth="0.8" strokeDasharray="2,2" />
                  <line x1="115" y1="20" x2="115" y2="92" stroke="rgba(148,163,184,0.35)" strokeWidth="0.8" />

                  {(() => {
                    const pts: string[] = [];
                    for (let t = 10; t <= 120; t += 5) {
                      const rad = ((t / 2) * Math.PI) / 180;
                      const shift = ((2 * dispHeight * Math.cos(rad)) / gonioRadius) * (180 / Math.PI);
                      const px = 115 + ((t - 10) / 110) * 93;
                      const py = 56 - Math.max(-32, Math.min(32, shift * 160));
                      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                    }
                    const selX = 115 + ((dispThetaTrue - 10) / 110) * 93;
                    const selY = 56 - Math.max(-32, Math.min(32, dispDeltaDeg * 160));
                    return (
                      <>
                        <polyline fill="none" stroke="#38bdf8" strokeWidth="1.8" points={pts.join(' ')} />
                        <circle cx={selX} cy={selY} r="3" fill="#f43f5e" stroke="#ffffff" strokeWidth="0.75" />
                        {hoverCurveTheta !== null && (() => {
                          const hRad = ((hoverCurveTheta / 2) * Math.PI) / 180;
                          const hShift = ((2 * dispHeight * Math.cos(hRad)) / gonioRadius) * (180 / Math.PI);
                          const hx = 115 + ((hoverCurveTheta - 10) / 110) * 93;
                          const hy = 56 - Math.max(-32, Math.min(32, hShift * 160));
                          return (
                            <>
                              <line x1={hx} y1="20" x2={hx} y2="92" stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="2,2" />
                              <circle cx={hx} cy={hy} r="2.2" fill="#fbbf24" />
                              <text x="162" y="103" fontSize="6.5" fontFamily="monospace" fill="#fbbf24" textAnchor="middle">
                                2θ={hoverCurveTheta.toFixed(1)}° → Δ={hShift >= 0 ? '+' : ''}{hShift.toFixed(4)}°
                              </text>
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}
                  {hoverCurveTheta === null && (
                    <text x="162" y="103" fontSize="6" fontFamily="monospace" fill="#64748b" textAnchor="middle">
                      10° ─── 2θ ─── 120°
                    </text>
                  )}
                </svg>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-200">Focusing Circle Rule:</span> Displacement aberration scales with <span className="font-mono">cosθ</span> and is largest at low angles (<span className="font-mono">2θ &lt; 40°</span>), whereas high-angle reflections converge toward zero shift.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
