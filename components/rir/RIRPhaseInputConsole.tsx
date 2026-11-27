import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FlaskConical,
  Layers,
  Play,
  Plus,
  Scale,
  Sliders,
  Trash2,
  TrendingUp,
  Upload
} from 'lucide-react';
import { RIRAssignedPeak, RIRPhase } from '../ReferenceIntensityRatioModule';
import { DATABASE_PRESETS } from './RIRDatabaseExplorer';
import { computeBraggReciprocal, computeHubbardSnyderI100 } from './rirMathUtils';
import { playSynthTone } from '../../utils/sound';

interface RIRPhaseComputedLite {
  id: string;
  reducedIntensity: number;
  crystallineFraction: number;
  totalSampleFraction: number;
  errMarginCrystalline: number;
  errMarginTotal: number;
  tau: number;
  textureCvPct: number;
  isInternalStandard: boolean;
}

interface RIRPhaseInputConsoleProps {
  phases: RIRPhase[];
  phaseResults: RIRPhaseComputedLite[];
  wavelengthA: number;
  anodeLabel: string;

  // Phase mutations
  onAddPhase: () => void;
  onUpdatePhase: (id: string, field: keyof RIRPhase, value: string | number) => void;
  onApplyDBPresetToPhase: (id: string, presetName: string) => void;
  onRemovePhase: (id: string) => void;
  onApplyBulkPhases: (newPhases: Omit<RIRPhase, 'id' | 'color'>[]) => void;

  // Multi-peak drawer
  expandedMultiPeakPhases: Record<string, boolean>;
  onToggleMultiPeakDrawer: (phaseId: string) => void;
  onAddAssignedPeak: (phaseId: string) => void;
  onUpdateAssignedPeak: (phaseId: string, peakId: string, field: keyof RIRAssignedPeak, val: string | number) => void;
  onRemoveAssignedPeak: (phaseId: string, peakId: string) => void;

  // Quantification Regime & Amorphous
  internalStandardMode: boolean;
  setInternalStandardMode: (v: boolean) => void;
  standardPhaseId: string;
  setStandardPhaseId: (v: string) => void;
  standardAddedWtPct: number;
  setStandardAddedWtPct: (v: number) => void;
  measuredAmorphousPct: number;
  amorphousErrWtPct: number;
  rawOriginalSampleCrystSum: number;
  amorphousWtPct: number;
  setAmorphousWtPct: (v: number) => void;
  amorphousDensity: number;
  setAmorphousDensity: (v: number) => void;
  amorphousMac: number;
  setAmorphousMac: (v: number) => void;

  // Brindley Microabsorption
  useBrindley: boolean;
  setUseBrindley: (v: boolean) => void;
  particleDiameterUm: number;
  setParticleDiameterUm: (v: number) => void;
  brindleyIterations: number;
  onOpenBrindleyInspector: () => void;

  // Uncertainty
  intensityUncertaintyPct: number;
  setIntensityUncertaintyPct: (v: number) => void;
  rirUncertaintyPct: number;
  setRirUncertaintyPct: (v: number) => void;

  // Actions
  onNormalizeIntensities: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRunQuantification: () => void;
  calculationFlash: boolean;
}

const DEFAULT_BULK_TEMPLATE = `# Name, hkl, 2Theta[deg], Intensity[cps], RIR[I/Ic], Density[g/cm3], MAC[cm2/g]
Quartz (α-SiO₂), (101), 26.64, 8500, 3.60, 2.65, 34.9
Calcite (CaCO₃), (104), 29.40, 4200, 2.00, 2.71, 76.4
Corundum (α-Al₂O₃), (113), 43.36, 1500, 1.00, 3.98, 31.8`;

function parseBulkCSV(raw: string): Omit<RIRPhase, 'id' | 'color'>[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  const parsed: Omit<RIRPhase, 'id' | 'color'>[] = [];
  for (const line of lines) {
    const parts = line.split(/[,\t;]+/).map((s) => s.trim());
    if (parts.length < 4) continue;

    // Support both "Name, hkl, 2Theta, Intensity, RIR, Density, MAC"
    // and compact "Name, Intensity, RIR"
    const name = parts[0];
    const secondNum = Number(parts[1]);
    if (!Number.isNaN(secondNum) && parts.length <= 5) {
      // Compact numeric row: Name, 2Theta, Intensity, RIR, [Density]
      const twoTheta = Number(parts[1]) || 30.0;
      const intensity = Math.max(0, Number(parts[2]) || 0);
      const rir = Math.max(0.05, Number(parts[3]) || 1.0);
      const density = Math.max(0.5, Number(parts[4]) || 3.0);
      parsed.push({
        name,
        hkl: '(100)',
        twoTheta,
        intensity,
        rir,
        density,
        mac: 50.0,
        relIntensity: 100,
        notes: 'Imported from CSV paste'
      });
    } else {
      const hkl = parts[1] || '(100)';
      const twoTheta = Number(parts[2]) || 30.0;
      const intensity = Math.max(0, Number(parts[3]) || 0);
      const rir = Math.max(0.05, Number(parts[4]) || 1.0);
      const density = Math.max(0.5, Number(parts[5]) || 3.0);
      const mac = Math.max(1.0, Number(parts[6]) || 50.0);
      parsed.push({
        name,
        hkl,
        twoTheta,
        intensity,
        rir,
        density,
        mac,
        relIntensity: 100,
        notes: 'Imported from CSV paste'
      });
    }
  }
  return parsed;
}

export const RIRPhaseInputConsole: React.FC<RIRPhaseInputConsoleProps> = ({
  phases,
  phaseResults,
  wavelengthA,
  anodeLabel,
  onAddPhase,
  onUpdatePhase,
  onApplyDBPresetToPhase,
  onRemovePhase,
  onApplyBulkPhases,
  expandedMultiPeakPhases,
  onToggleMultiPeakDrawer,
  onAddAssignedPeak,
  onUpdateAssignedPeak,
  onRemoveAssignedPeak,
  internalStandardMode,
  setInternalStandardMode,
  standardPhaseId,
  setStandardPhaseId,
  standardAddedWtPct,
  setStandardAddedWtPct,
  measuredAmorphousPct,
  amorphousErrWtPct,
  rawOriginalSampleCrystSum,
  amorphousWtPct,
  setAmorphousWtPct,
  amorphousDensity,
  setAmorphousDensity,
  amorphousMac,
  setAmorphousMac,
  useBrindley,
  setUseBrindley,
  particleDiameterUm,
  setParticleDiameterUm,
  brindleyIterations,
  onOpenBrindleyInspector,
  intensityUncertaintyPct,
  setIntensityUncertaintyPct,
  rirUncertaintyPct,
  setRirUncertaintyPct,
  onNormalizeIntensities,
  onImportJSON,
  onRunQuantification,
  calculationFlash
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<'builder' | 'bulk_csv'>('builder');
  const [bulkText, setBulkText] = useState<string>(DEFAULT_BULK_TEMPLATE);
  const [openConfigSection, setOpenConfigSection] = useState<'regime' | 'brindley' | 'uncertainty' | null>('regime');

  const bulkParsedPreview = useMemo(() => parseBulkCSV(bulkText), [bulkText]);

  const serializeCurrentPhasesToCSV = () => {
    const header = '# Name, hkl, 2Theta[deg], Intensity[cps], RIR[I/Ic], Density[g/cm3], MAC[cm2/g]';
    const rows = phases.map(
      (p) =>
        `${p.name}, ${p.hkl}, ${p.twoTheta.toFixed(2)}, ${p.intensity}, ${p.rir.toFixed(2)}, ${(p.density || 3.0).toFixed(2)}, ${(p.mac || 50.0).toFixed(1)}`
    );
    setBulkText([header, ...rows].join('\n'));
    playSynthTone('tick');
  };

  return (
    <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
      {/* Header & Input Mode Segmented Control */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
            Phase Mixture & Solver Configuration
          </h2>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
            <span>{phases.length} crystalline phases</span>
            <span aria-hidden="true">·</span>
            <span>{anodeLabel} (λ = {wavelengthA.toFixed(4)} Å)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#070B12] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => { playSynthTone('tick'); setInputMode('builder'); }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                inputMode === 'builder'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Phase Builder
            </button>
            <button
              type="button"
              onClick={() => { playSynthTone('tick'); setInputMode('bulk_csv'); }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                inputMode === 'bulk_csv'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bulk CSV Paste
            </button>
          </div>

          {inputMode === 'builder' && (
            <button
              type="button"
              onClick={onAddPhase}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Phase</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Interactive Phase Builder */}
      {inputMode === 'builder' ? (
        <div className="p-4 space-y-3 max-h-[540px] overflow-y-auto custom-scrollbar">
          {phases.map((phase, idx) => {
            const computed = phaseResults[idx];
            const { dSpacingA } = computeBraggReciprocal(phase.twoTheta, wavelengthA);
            const multiSummary = phase.peaks && phase.peaks.length > 0 ? computeHubbardSnyderI100(phase.peaks) : null;
            const isStd = internalStandardMode && phase.id === standardPhaseId;

            return (
              <div
                key={phase.id}
                className={`p-3.5 rounded-xl border transition-colors space-y-3 ${
                  isStd
                    ? 'bg-amber-950/15 border-amber-500/40'
                    : 'bg-[#070B12] border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Row 1: Phase Name + Quick ICDD Fill + Delete */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: phase.color }}
                    />
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => onUpdatePhase(phase.id, 'name', e.target.value)}
                      className="bg-transparent font-semibold text-sm text-slate-100 outline-none border-b border-transparent focus:border-cyan-500/60 transition-colors w-full truncate"
                    />
                    {isStd && (
                      <span className="text-[10px] font-mono font-semibold text-amber-300 shrink-0">
                        Internal Std ({standardAddedWtPct}%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onApplyDBPresetToPhase(phase.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 text-[11px] rounded-md px-2 py-1 outline-none font-mono max-w-[130px]"
                      title="Autofill constants from ICDD PDF-2 library"
                    >
                      <option value="" disabled>
                        ICDD Fill...
                      </option>
                      {DATABASE_PRESETS.map((db, dbIdx) => (
                        <option key={dbIdx} value={db.name}>
                          {db.name} (K={db.rir})
                        </option>
                      ))}
                    </select>

                    {phases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemovePhase(phase.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
                        title="Remove phase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Compact 7-Parameter Scientific Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono tabular-nums">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">hkl</label>
                    <input
                      type="text"
                      value={phase.hkl}
                      onChange={(e) => onUpdatePhase(phase.id, 'hkl', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 text-slate-200 rounded-md px-2 py-1 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 flex justify-between">
                      <span>2θ (°)</span>
                      <span className="text-slate-500">{dSpacingA.toFixed(2)}Å</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={phase.twoTheta}
                      onChange={(e) => onUpdatePhase(phase.id, 'twoTheta', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 text-slate-200 rounded-md px-2 py-1 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-cyan-300 font-semibold block">Int. I (cps)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={phase.intensity}
                      onChange={(e) => onUpdatePhase(phase.id, 'intensity', Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-cyan-500/40 focus:border-cyan-400 text-cyan-200 font-semibold rounded-md px-2 py-1 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block" title="Reference relative peak intensity (100% for primary line)">
                      I<sub>rel</sub> (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={phase.relIntensity || 100}
                      onChange={(e) =>
                        onUpdatePhase(phase.id, 'relIntensity', Math.min(100, Math.max(1, parseFloat(e.target.value) || 100)))
                      }
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 text-slate-200 rounded-md px-2 py-1 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">RIR (I/I<sub>c</sub>)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={phase.rir}
                      onChange={(e) => onUpdatePhase(phase.id, 'rir', Math.max(0.05, parseFloat(e.target.value) || 1.0))}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 text-emerald-300 font-semibold rounded-md px-2 py-1 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">ρ (g/cm³)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      value={phase.density || 3.0}
                      onChange={(e) => onUpdatePhase(phase.id, 'density', Math.max(0.5, parseFloat(e.target.value) || 3.0))}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 text-slate-200 rounded-md px-2 py-1 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block">μ/ρ (cm²/g)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={phase.mac || 50}
                      onChange={(e) => onUpdatePhase(phase.id, 'mac', Math.max(1, parseFloat(e.target.value) || 50))}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500/60 text-slate-200 rounded-md px-2 py-1 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Row 3: Live Per-Phase Telemetry & Hubbard-Snyder Multi-Peak Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70 text-[11px] font-mono tabular-nums">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400">
                    <span>
                      I/K = <strong className="text-slate-200">{(computed?.reducedIntensity || 0).toFixed(1)}</strong>
                    </span>
                    {useBrindley && (
                      <span className="text-cyan-400">
                        τ = {(computed?.tau || 1).toFixed(3)}
                      </span>
                    )}
                    {!isStd && (
                      <span>
                        Bulk ={' '}
                        <strong className="text-emerald-300">
                          {(computed?.totalSampleFraction || 0).toFixed(2)} ± {(computed?.errMarginTotal || 0).toFixed(2)} wt%
                        </strong>
                      </span>
                    )}
                    {multiSummary && multiSummary.peakCount > 1 && (
                      <span className={multiSummary.textureCvPct > 15 ? 'text-amber-400' : 'text-slate-400'}>
                        Texture CV: {multiSummary.textureCvPct.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleMultiPeakDrawer(phase.id)}
                    className="text-[11px] font-sans font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3 h-3" />
                    <span>
                      {phase.peaks && phase.peaks.length > 0
                        ? `Multi-Peak (${phase.peaks.length} lines)`
                        : 'Multi-Peak Hubbard–Snyder'}
                    </span>
                  </button>
                </div>

                {/* Multi-Reflection Hubbard-Snyder Sub-Drawer */}
                {expandedMultiPeakPhases[phase.id] && (
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono font-semibold text-slate-200 block">
                          Hubbard–Snyder Summed-Intensity Estimator: Î₁₀₀ = ΣIⱼ / Σ(I_rel,j / 100)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Intensity-weighted averaging prevents weak lines from amplifying noise and quantifies texture bias.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddAssignedPeak(phase.id)}
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-medium flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Line</span>
                      </button>
                    </div>

                    {!phase.peaks || phase.peaks.length === 0 ? (
                      <div className="text-[11px] text-slate-400 py-1">
                        Single reflection {phase.hkl} ({phase.intensity} cps) active. Add 2+ reflections to check preferred orientation dispersion.
                      </div>
                    ) : (
                      <div className="space-y-1.5 font-mono tabular-nums">
                        <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 px-1">
                          <span className="col-span-2">hkl</span>
                          <span className="col-span-2">2θ (°)</span>
                          <span className="col-span-3">I_obs (cps)</span>
                          <span className="col-span-2">I_rel (%)</span>
                          <span className="col-span-2 text-right">Dev.</span>
                          <span className="col-span-1 text-center">Del</span>
                        </div>
                        {phase.peaks.map((pk, pkIdx) => {
                          const dev = multiSummary?.perPeakI100[pkIdx]?.deviationPct ?? 0;
                          return (
                            <div key={pk.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                              <input
                                type="text"
                                value={pk.hkl}
                                onChange={(e) => onUpdateAssignedPeak(phase.id, pk.id, 'hkl', e.target.value)}
                                className="col-span-2 bg-slate-900 border border-slate-800 text-slate-200 rounded px-1.5 py-1 text-xs outline-none"
                              />
                              <input
                                type="number"
                                step="0.05"
                                value={pk.twoTheta}
                                onChange={(e) => onUpdateAssignedPeak(phase.id, pk.id, 'twoTheta', parseFloat(e.target.value) || 0)}
                                className="col-span-2 bg-slate-900 border border-slate-800 text-slate-200 rounded px-1.5 py-1 text-xs outline-none"
                              />
                              <input
                                type="number"
                                min="0"
                                value={pk.intensity}
                                onChange={(e) =>
                                  onUpdateAssignedPeak(phase.id, pk.id, 'intensity', Math.max(0, parseFloat(e.target.value) || 0))
                                }
                                className="col-span-3 bg-slate-900 border border-cyan-500/40 text-cyan-200 font-semibold rounded px-1.5 py-1 text-xs outline-none"
                              />
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={pk.relIntensity}
                                onChange={(e) =>
                                  onUpdateAssignedPeak(
                                    phase.id,
                                    pk.id,
                                    'relIntensity',
                                    Math.min(100, Math.max(1, parseFloat(e.target.value) || 100))
                                  )
                                }
                                className="col-span-2 bg-slate-900 border border-slate-800 text-slate-200 rounded px-1.5 py-1 text-xs outline-none"
                              />
                              <span
                                className={`col-span-2 text-right text-[10px] ${
                                  Math.abs(dev) > 15 ? 'text-amber-400' : 'text-slate-400'
                                }`}
                              >
                                {dev >= 0 ? '+' : ''}{dev.toFixed(1)}%
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemoveAssignedPeak(phase.id, pk.id)}
                                className="col-span-1 text-slate-500 hover:text-rose-400 flex justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode 2: Bulk CSV / Peak Paste */
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">
              Paste comma- or tab-delimited phase lines from HighScore, DIFFRAC.EVA, Match!, or Excel:
            </span>
            <button
              type="button"
              onClick={serializeCurrentPhasesToCSV}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Load Current Table
            </button>
          </div>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full bg-[#070B12] border border-slate-800 focus:border-cyan-500/60 rounded-xl p-3 font-mono tabular-nums text-xs text-slate-200 leading-relaxed outline-none resize-y"
            placeholder={DEFAULT_BULK_TEMPLATE}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Detected <strong className="text-emerald-400">{bulkParsedPreview.length}</strong> valid phase rows
            </span>
            <button
              type="button"
              disabled={bulkParsedPreview.length === 0}
              onClick={() => {
                onApplyBulkPhases(bulkParsedPreview);
                setInputMode('builder');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Apply {bulkParsedPreview.length} Phases</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Solver Physics Accordions (Flat Hairline Dividers, Zero Nested Cards) */}
      <div className="border-t border-slate-800 divide-y divide-slate-800">
        {/* Accordion 1: Quantification Regime & Amorphous Matrix */}
        <div>
          <button
            type="button"
            onClick={() => setOpenConfigSection(openConfigSection === 'regime' ? null : 'regime')}
            className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Quantification Regime & Amorphous Matrix
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>{internalStandardMode ? `Spiking (${standardAddedWtPct}%)` : `Adiabatic · Amorph ${amorphousWtPct}%`}</span>
              {openConfigSection === 'regime' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {openConfigSection === 'regime' && (
            <div className="px-5 pb-4 pt-1 space-y-3 bg-[#070B12]/60">
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#070B12] border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => { playSynthTone('tick'); setInternalStandardMode(false); }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                    !internalStandardMode ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Chung Adiabatic (Σw = 1)
                </button>
                <button
                  type="button"
                  onClick={() => { playSynthTone('tick'); setInternalStandardMode(true); }}
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                    internalStandardMode ? 'bg-amber-600/90 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Internal Standard Spiking
                </button>
              </div>

              {internalStandardMode ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 block">Spiked Standard Phase</label>
                      <select
                        value={standardPhaseId}
                        onChange={(e) => setStandardPhaseId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none focus:border-amber-500/60"
                      >
                        {phases.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (RIR: {p.rir})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-slate-400">Added Standard W<sub>s</sub></span>
                        <span className="text-amber-300 font-semibold">{standardAddedWtPct.toFixed(1)} wt%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="0.5"
                        value={standardAddedWtPct}
                        onChange={(e) => setStandardAddedWtPct(parseFloat(e.target.value) || 10.0)}
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono tabular-nums">
                    <span className="text-slate-400">
                      Measured Amorphous = <strong className="text-amber-300">{measuredAmorphousPct.toFixed(2)} ± {amorphousErrWtPct.toFixed(2)} wt%</strong>
                    </span>
                    <span className={rawOriginalSampleCrystSum > 100.5 ? 'text-rose-400' : 'text-slate-400'}>
                      Raw Σw<sub>cryst</sub> = {rawOriginalSampleCrystSum.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-300">Amorphous Matrix Fraction</span>
                    <span className="text-rose-400 font-semibold">{amorphousWtPct.toFixed(0)} wt%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="1"
                    value={amorphousWtPct}
                    onChange={(e) => setAmorphousWtPct(parseFloat(e.target.value) || 0)}
                    className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1 font-mono tabular-nums text-xs">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] text-slate-400">ρ<sub>am</sub> (g/cm³)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="6.0"
                    step="0.05"
                    value={amorphousDensity}
                    onChange={(e) => setAmorphousDensity(Math.max(0.5, parseFloat(e.target.value) || 2.2))}
                    className="w-20 bg-slate-900 border border-slate-800 text-slate-200 rounded-md px-2 py-1 text-right text-xs outline-none focus:border-cyan-500/60"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] text-slate-400">μ/ρ<sub>am</sub> (cm²/g)</label>
                  <input
                    type="number"
                    min="1"
                    max="250"
                    step="1"
                    value={amorphousMac}
                    onChange={(e) => setAmorphousMac(Math.max(1, parseFloat(e.target.value) || 30))}
                    className="w-20 bg-slate-900 border border-slate-800 text-slate-200 rounded-md px-2 py-1 text-right text-xs outline-none focus:border-cyan-500/60"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Brindley Microabsorption */}
        <div>
          <button
            type="button"
            onClick={() => setOpenConfigSection(openConfigSection === 'brindley' ? null : 'brindley')}
            className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                Brindley Microabsorption Correction (Volume-Weighted μ̄)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className={useBrindley ? 'text-cyan-400' : 'text-slate-500'}>
                {useBrindley ? `Active · D=${particleDiameterUm}µm (${brindleyIterations} iter)` : 'Off'}
              </span>
              {openConfigSection === 'brindley' ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          </button>

          {openConfigSection === 'brindley' && (
            <div className="px-5 pb-4 pt-1 space-y-3 bg-[#070B12]/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Self-consistent spherical-grain transmission factor τ<sub>i</sub>(μ<sub>i</sub> − μ̄<sub>vol</sub>, D)
                </span>
                <button
                  type="button"
                  onClick={() => { playSynthTone('tick'); setUseBrindley(!useBrindley); }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    useBrindley ? 'bg-cyan-600 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {useBrindley ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="space-y-1.5 font-mono tabular-nums">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Mean Grain Diameter D</span>
                  <span className="text-cyan-300 font-semibold">{particleDiameterUm.toFixed(1)} µm</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="45"
                  step="0.5"
                  value={particleDiameterUm}
                  onChange={(e) => setParticleDiameterUm(parseFloat(e.target.value) || 5.0)}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Critical fine-powder regime: |Δμ|·D &lt; 0.1</span>
                  <button
                    type="button"
                    onClick={onOpenBrindleyInspector}
                    className="text-cyan-400 hover:underline font-sans"
                  >
                    Open Brindley Curves →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Uncertainty Propagation */}
        <div>
          <button
            type="button"
            onClick={() => setOpenConfigSection(openConfigSection === 'uncertainty' ? null : 'uncertainty')}
            className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">
                Jacobian Uncertainty Parameters
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
              <span>±{intensityUncertaintyPct}% I · ±{rirUncertaintyPct}% K</span>
              {openConfigSection === 'uncertainty' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {openConfigSection === 'uncertainty' && (
            <div className="px-5 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070B12]/60 font-mono tabular-nums">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Intensity Error (±ΔI)</span>
                  <span className="text-indigo-300 font-semibold">±{intensityUncertaintyPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.5"
                  value={intensityUncertaintyPct}
                  onChange={(e) => setIntensityUncertaintyPct(parseFloat(e.target.value) || 3.0)}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">RIR Catalog Error (±ΔK)</span>
                  <span className="text-emerald-300 font-semibold">±{rirUncertaintyPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={rirUncertaintyPct}
                  onChange={(e) => setRirUncertaintyPct(parseFloat(e.target.value) || 5.0)}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anchored Bottom Action Bar */}
      <div className="px-5 py-3.5 border-t border-slate-800 bg-[#070B12] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImportJSON}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import JSON</span>
          </button>
          <button
            type="button"
            onClick={onNormalizeIntensities}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
            title="Scale maximum peak intensity to 10,000 cps"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Scale 10k</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRunQuantification}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            calculationFlash
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
          }`}
        >
          {calculationFlash ? <FlaskConical className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{calculationFlash ? 'Quantification Updated' : 'Run RIR Quantification'}</span>
        </button>
      </div>
    </div>
  );
};
