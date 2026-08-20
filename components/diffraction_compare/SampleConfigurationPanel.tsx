import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FlaskConical, 
  Database, 
  Layers3, 
  Upload, 
  Plus, 
  Trash2, 
  Sliders, 
  Check, 
  FileText, 
  Edit3, 
  Sparkles,
  ChevronDown,
  ArrowLeftRight,
  Layers,
  Sparkle
} from 'lucide-react';
import { parseContinuousRawData, extractPeaksFromRawPoints } from './compareUtils';

interface SampleConfigurationPanelProps {
  sampleAInputMode: 'active' | 'custom' | 'file';
  setSampleAInputMode: (mode: 'active' | 'custom' | 'file') => void;
  activeMaterialName: string;
  customNameA: string;
  setCustomNameA: (name: string) => void;
  customFormulaA: string;
  setCustomFormulaA: (formula: string) => void;
  customPatternA: string;
  setCustomPatternA: (pattern: string) => void;
  
  sampleBInputMode: 'preset' | 'custom' | 'file';
  setSampleBInputMode: (mode: 'preset' | 'custom' | 'file') => void;
  selectedSampleBIndex: number;
  setSelectedSampleBIndex: (idx: number) => void;
  customNameB: string;
  setCustomNameB: (name: string) => void;
  customFormulaB: string;
  setCustomFormulaB: (formula: string) => void;
  customPatternB: string;
  setCustomPatternB: (pattern: string) => void;
  
  materialsDb: any[];
  
  // Phase C (Secondary Phase)
  hasPhaseC: boolean;
  setHasPhaseC: (enabled: boolean) => void;
  selectedPhaseCIndex: number;
  setSelectedPhaseCIndex: (idx: number) => void;
  scalePhaseC: number;
  setScalePhaseC: (scale: number) => void;

  // Phase D (Tertiary Phase)
  hasPhaseD: boolean;
  setHasPhaseD: (enabled: boolean) => void;
  selectedPhaseDIndex: number;
  setSelectedPhaseDIndex: (idx: number) => void;
  scalePhaseD: number;
  setScalePhaseD: (scale: number) => void;

  onSwapSamples: () => void;
  onRawDataUploadedA?: (points: { twoTheta: number; intensity: number }[]) => void;
}

export const SampleConfigurationPanel: React.FC<SampleConfigurationPanelProps> = ({
  sampleAInputMode,
  setSampleAInputMode,
  activeMaterialName,
  customNameA,
  setCustomNameA,
  customFormulaA,
  setCustomFormulaA,
  customPatternA,
  setCustomPatternA,
  
  sampleBInputMode,
  setSampleBInputMode,
  selectedSampleBIndex,
  setSelectedSampleBIndex,
  customNameB,
  setCustomNameB,
  customFormulaB,
  setCustomFormulaB,
  customPatternB,
  setCustomPatternB,
  
  materialsDb,
  
  hasPhaseC,
  setHasPhaseC,
  selectedPhaseCIndex,
  setSelectedPhaseCIndex,
  scalePhaseC,
  setScalePhaseC,

  hasPhaseD,
  setHasPhaseD,
  selectedPhaseDIndex,
  setSelectedPhaseDIndex,
  scalePhaseD,
  setScalePhaseD,

  onSwapSamples,
  onRawDataUploadedA
}) => {
  const { t } = useTranslation();
  const [dragActiveA, setDragActiveA] = useState(false);
  const [fileStatsA, setFileStatsA] = useState<string | null>(null);

  const handleFileUploadA = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const rawPts = parseContinuousRawData(text);
        if (rawPts.length > 0) {
          const extracted = extractPeaksFromRawPoints(rawPts, 25);
          const patternStr = extracted.map(p => `${p.twoTheta}, ${p.intensity}`).join('\n');
          setCustomPatternA(patternStr);
          setCustomNameA(file.name.replace(/\.[^/.]+$/, ''));
          setFileStatsA(`${rawPts.length} points, ${extracted.length} peaks detected`);
          setSampleAInputMode('custom');
          if (onRawDataUploadedA) onRawDataUploadedA(rawPts);
        } else {
          setCustomPatternA(text);
          setCustomNameA(file.name.replace(/\.[^/.]+$/, ''));
          setSampleAInputMode('custom');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Primary 2-Column Sample Configuration (A vs B) with Center Swap Button */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
        {/* Sample A: Target / Experimental */}
        <div className="bg-[#080d1a] border-2 border-emerald-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Sample A (Target / Experimental Pattern)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {sampleAInputMode === 'active' ? 'Active Applet Workspace Data' : 'Custom / Uploaded Experimental Reflections'}
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
                <button
                  onClick={() => setSampleAInputMode('active')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    sampleAInputMode === 'active'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setSampleAInputMode('custom')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    sampleAInputMode === 'custom'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {sampleAInputMode === 'active' ? (
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Source:</span>
                  <span className="font-bold text-emerald-400">{activeMaterialName}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                  Using real computed reflections directly from the main XRD calculation workspace.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sample Name</label>
                    <input
                      type="text"
                      value={customNameA}
                      onChange={(e) => setCustomNameA(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Formula</label>
                    <input
                      type="text"
                      value={customFormulaA}
                      onChange={(e) => setCustomFormulaA(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      2θ, Intensity Peaks List (or 2θ(I))
                    </label>
                    {fileStatsA && <span className="text-[10px] text-emerald-400 font-mono">{fileStatsA}</span>}
                  </div>
                  <textarea
                    rows={3}
                    value={customPatternA}
                    onChange={(e) => setCustomPatternA(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 font-mono text-xs focus:border-emerald-500 outline-none resize-none leading-relaxed"
                    placeholder="25.87(30), 31.77(100), 32.19(70)..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sample B: Reference Standard (Model Phase 1) */}
        <div className="bg-[#080d1a] border-2 border-indigo-500/30 p-5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
                    Sample B (Reference Standard / Model Phase 1)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {sampleBInputMode === 'preset' ? 'Crystallographic Database Preset' : 'Custom Reference Reflections'}
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
                <button
                  onClick={() => setSampleBInputMode('preset')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    sampleBInputMode === 'preset'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Database
                </button>
                <button
                  onClick={() => setSampleBInputMode('custom')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    sampleBInputMode === 'custom'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {sampleBInputMode === 'preset' ? (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Select Database Standard Material
                  </label>
                  <select
                    value={selectedSampleBIndex}
                    onChange={(e) => setSelectedSampleBIndex(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {materialsDb.map((mat, idx) => (
                      <option key={idx} value={idx}>
                        {mat.name} ({mat.formula}) - {mat.crystalSystem || 'Crystalline'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>Crystal System: <strong className="text-slate-200">{materialsDb[selectedSampleBIndex]?.crystalSystem || 'Standard'}</strong></span>
                  <span>Space Group: <strong className="text-slate-200">{materialsDb[selectedSampleBIndex]?.spaceGroup || '-'}</strong></span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Standard Name</label>
                    <input
                      type="text"
                      value={customNameB}
                      onChange={(e) => setCustomNameB(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Formula</label>
                    <input
                      type="text"
                      value={customFormulaB}
                      onChange={(e) => setCustomFormulaB(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Reference Peaks List (2θ, I)
                  </label>
                  <textarea
                    rows={3}
                    value={customPatternB}
                    onChange={(e) => setCustomPatternB(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 font-mono text-xs focus:border-indigo-500 outline-none resize-none leading-relaxed"
                    placeholder="25.87(30), 31.77(100), 32.19(70)..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary & Tertiary Multi-Phase Additions (Phase C and Phase D) */}
      <div className="bg-[#080d1a] border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers3 className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Multi-Phase Mixture Deconvolution (Phase C & Phase D)
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasPhaseC(!hasPhaseC)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                hasPhaseC 
                  ? 'bg-purple-900/60 text-purple-200 border-purple-500/50' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {hasPhaseC ? 'Phase C (Active)' : '+ Add Phase C'}
            </button>

            <button
              onClick={() => setHasPhaseD(!hasPhaseD)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                hasPhaseD 
                  ? 'bg-rose-900/60 text-rose-200 border-rose-500/50' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {hasPhaseD ? 'Phase D (Active)' : '+ Add Phase D'}
            </button>
          </div>
        </div>

        {/* Phase C & D Configurations */}
        {(hasPhaseC || hasPhaseD) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            {hasPhaseC && (
              <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-800/40 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    Phase C (Secondary)
                  </span>
                  <span className="font-mono text-purple-300 font-bold">Scale: {(scalePhaseC * 100).toFixed(0)}%</span>
                </div>
                <select
                  value={selectedPhaseCIndex}
                  onChange={(e) => setSelectedPhaseCIndex(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-purple-500 outline-none"
                >
                  {materialsDb.map((mat, idx) => (
                    <option key={idx} value={idx}>{mat.name} ({mat.formula})</option>
                  ))}
                </select>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={scalePhaseC}
                  onChange={(e) => setScalePhaseC(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {hasPhaseD && (
              <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-800/40 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    Phase D (Tertiary)
                  </span>
                  <span className="font-mono text-rose-300 font-bold">Scale: {(scalePhaseD * 100).toFixed(0)}%</span>
                </div>
                <select
                  value={selectedPhaseDIndex}
                  onChange={(e) => setSelectedPhaseDIndex(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-rose-500 outline-none"
                >
                  {materialsDb.map((mat, idx) => (
                    <option key={idx} value={idx}>{mat.name} ({mat.formula})</option>
                  ))}
                </select>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={scalePhaseD}
                  onChange={(e) => setScalePhaseD(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
