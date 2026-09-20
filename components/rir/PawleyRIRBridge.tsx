import React, { useState } from 'react';
import {
  GitMerge,
  Layers,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronDown,
  Plus
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import { RIRMatrixPhase } from './RIRMatrixInspector';
import { PAWLEY_PRESETS } from '../pawley_lebail/PawleyPresetsDb';
import { generateReflections } from '../pawley_lebail/PawleyLeBailEngine';
import { DATABASE_PRESETS, RIRDatabaseItem } from './RIRDatabaseExplorer';

interface PawleyRIRBridgeProps {
  currentPhases: RIRMatrixPhase[];
  onImportDecomposedPhase: (newPhase: RIRMatrixPhase) => void;
  onUpdatePhaseIntensity: (phaseId: string, refinedIntensity: number) => void;
}

export const PawleyRIRBridge: React.FC<PawleyRIRBridgeProps> = ({
  currentPhases,
  onImportDecomposedPhase,
  onUpdatePhaseIntensity
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PAWLEY_PRESETS[0].id);
  const [selectedReflectionIdx, setSelectedReflectionIdx] = useState<number>(0);
  const [targetPhaseId, setTargetPhaseId] = useState<string>(currentPhases[0]?.id || '');
  const [simulatedScaleFactor, setSimulatedScaleFactor] = useState<number>(1000);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Active selected Pawley preset
  const activePreset = PAWLEY_PRESETS.find(p => p.id === selectedPresetId) || PAWLEY_PRESETS[0];

  // Match corresponding RIR reference database item if available
  const matchedDbItem: RIRDatabaseItem | undefined = DATABASE_PRESETS.find(db =>
    db.formula.toLowerCase() === activePreset.formula.toLowerCase() ||
    db.name.toLowerCase().includes(activePreset.name.split(' ')[0].toLowerCase())
  );

  // Compute Pawley/Le Bail reflections for selected preset
  const reflections = React.useMemo(() => {
    try {
      const refs = generateReflections(
        activePreset.system,
        activePreset.lattice,
        activePreset.wavelength,
        activePreset.profile.zeroShift || 0,
        [10.0, 70.0],
        activePreset.spaceGroupNumber
      );
      return refs.sort((a, b) => b.intensity - a.intensity);
    } catch {
      return [];
    }
  }, [activePreset]);

  const activeReflection = reflections[selectedReflectionIdx] || reflections[0];
  const calculatedIntegratedArea = activeReflection
    ? Math.round(activeReflection.intensity * simulatedScaleFactor)
    : 1000;

  const handleImportAsNewPhase = () => {
    playSynthTone('success');
    const assignedRir = matchedDbItem ? matchedDbItem.rir : 1.0;
    const assignedDensity = matchedDbItem ? matchedDbItem.density : 3.0;
    const assignedMac = matchedDbItem ? matchedDbItem.macCu : 45.0;

    const newPhase: RIRMatrixPhase = {
      id: Math.random().toString(36).substring(2, 9),
      name: `${activePreset.name.split(' ')[0]} (Pawley Refined)`,
      hkl: activeReflection ? `(${activeReflection.h} ${activeReflection.k} ${activeReflection.l})` : '(100)',
      twoTheta: activeReflection ? Number(activeReflection.twoTheta.toFixed(2)) : 30.0,
      intensity: calculatedIntegratedArea,
      rir: assignedRir,
      density: assignedDensity,
      mac: assignedMac
    };

    onImportDecomposedPhase(newPhase);
    setImportNotification(`Successfully transferred "${newPhase.name}" (Peak: ${newPhase.intensity} cps) into RIR Phase Engine.`);
    setTimeout(() => setImportNotification(null), 3500);
  };

  const handleApplyToExistingPhase = () => {
    if (!targetPhaseId) return;
    playSynthTone('success');
    onUpdatePhaseIntensity(targetPhaseId, calculatedIntegratedArea);
    const targetName = currentPhases.find(p => p.id === targetPhaseId)?.name || 'Phase';
    setImportNotification(`Updated "${targetName}" peak intensity to ${calculatedIntegratedArea} cps.`);
    setTimeout(() => setImportNotification(null), 3500);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Pawley & Le Bail Deconvolution → RIR Pipeline Bridge</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Integrated Workflow
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Directly feed whole-pattern decomposed Bragg reflection intensities (free from peak overlap) into Chung adiabatic mass calculations.
            </p>
          </div>
        </div>
      </div>

      {/* Notification */}
      {importNotification && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{importNotification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset & Reflection Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Source Decomposed Crystal Phase
              </label>
              <div className="relative">
                <select
                  value={selectedPresetId}
                  onChange={(e) => {
                    setSelectedPresetId(e.target.value);
                    setSelectedReflectionIdx(0);
                    playSynthTone('tick');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500/60 appearance-none"
                >
                  {PAWLEY_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.formula}, SG #{p.spaceGroupNumber})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Target Bragg Peak (hkl / 2θ)
              </label>
              <div className="relative">
                <select
                  value={selectedReflectionIdx}
                  onChange={(e) => {
                    setSelectedReflectionIdx(parseInt(e.target.value, 10));
                    playSynthTone('tick');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500/60 appearance-none"
                >
                  {reflections.slice(0, 15).map((ref, idx) => (
                    <option key={idx} value={idx}>
                      ({ref.h} {ref.k} {ref.l}) at 2θ = {ref.twoTheta.toFixed(2)}° (Rel Int: {ref.intensity.toFixed(1)}%)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Detailed Selected Peak Inspection */}
          {activeReflection && (
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Reflection</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">
                  ({activeReflection.h} {activeReflection.k} {activeReflection.l})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Bragg Angle 2θ</span>
                <span className="font-mono font-bold text-slate-200 text-sm">
                  {activeReflection.twoTheta.toFixed(3)}°
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">d-Spacing</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {activeReflection.dSpacing.toFixed(4)} Å
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-bold block">Decomposed Area</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {calculatedIntegratedArea} cps
                </span>
              </div>
            </div>
          )}

          {/* Pattern Scaling Multiplier */}
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Whole Pattern Experimental Intensity Multiplier:</span>
              <span className="font-mono text-indigo-300 font-bold">{simulatedScaleFactor}×</span>
            </div>
            <input
              type="range"
              min="100"
              max="5000"
              step="50"
              value={simulatedScaleFactor}
              onChange={(e) => setSimulatedScaleFactor(parseFloat(e.target.value) || 1000)}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Bridge Actions & Reference Match (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Reference Library Match</span>
              {matchedDbItem ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  Matched
                </span>
              ) : (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  Default Fallback
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Phase Name:</span>
                <span className="font-bold text-slate-100">{matchedDbItem ? matchedDbItem.name : activePreset.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Associated RIR (I/Ic):</span>
                <span className="font-mono font-bold text-indigo-400">{matchedDbItem ? matchedDbItem.rir.toFixed(2) : '1.00'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Theoretical Density:</span>
                <span className="font-mono text-slate-300">{matchedDbItem ? matchedDbItem.density : '3.00'} g/cm³</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Linear MAC (Cu Kα):</span>
                <span className="font-mono text-slate-300">{matchedDbItem ? matchedDbItem.macCu : '45.0'} cm²/g</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            <button
              onClick={handleImportAsNewPhase}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Import as New RIR Mixture Phase</span>
            </button>

            {currentPhases.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={targetPhaseId}
                  onChange={(e) => setTargetPhaseId(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold outline-none"
                >
                  {currentPhases.map(p => (
                    <option key={p.id} value={p.id}>
                      Update {p.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleApplyToExistingPhase}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Overwrite selected phase intensity with Pawley decomposed value"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Update</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
