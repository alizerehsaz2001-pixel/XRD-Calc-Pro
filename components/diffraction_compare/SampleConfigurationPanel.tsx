import React, { useState, useMemo } from 'react';
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
  ChevronUp,
  ArrowLeftRight,
  Layers,
  Sparkle,
  Palette,
  Settings2,
  SlidersHorizontal,
  Activity,
  Search,
  HelpCircle,
  Zap,
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  CurveColorPalette, 
  CompareEngineSettings, 
  PeakShapeFunction 
} from './types';
import { 
  parseContinuousRawData, 
  extractPeaksFromRawPoints,
  PRESET_COLOR_SWATCHES 
} from './compareUtils';

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

  // Color & Engine Props
  activePalette: CurveColorPalette;
  onUpdateCustomColor: (key: keyof CurveColorPalette, color: string) => void;
  engineSettings: CompareEngineSettings;
  setEngineSettings: React.Dispatch<React.SetStateAction<CompareEngineSettings>>;

  onSwapSamples: () => void;
  onOpenSearchMatch?: () => void;
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

  activePalette,
  onUpdateCustomColor,
  engineSettings,
  setEngineSettings,

  onSwapSamples,
  onOpenSearchMatch,
  onRawDataUploadedA
}) => {
  const { t } = useTranslation();
  const [fileStatsA, setFileStatsA] = useState<string | null>(null);
  const [isDraggingA, setIsDraggingA] = useState(false);
  const [showMultiPhaseDrawer, setShowMultiPhaseDrawer] = useState(false);
  const [showEngineDrawer, setShowEngineDrawer] = useState(false);
  const [dbSearchQueryB, setDbSearchQueryB] = useState('');

  // Filter materials for reference database
  const filteredMaterialsB = useMemo(() => {
    if (!dbSearchQueryB.trim()) return materialsDb.map((m, i) => ({ material: m, originalIndex: i }));
    const q = dbSearchQueryB.toLowerCase();
    return materialsDb
      .map((m, i) => ({ material: m, originalIndex: i }))
      .filter(({ material }) => 
        material.name.toLowerCase().includes(q) ||
        (material.formula && material.formula.toLowerCase().includes(q)) ||
        (material.crystalSystem && material.crystalSystem.toLowerCase().includes(q))
      );
  }, [materialsDb, dbSearchQueryB]);

  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const rawPts = parseContinuousRawData(text);
        if (rawPts.length > 0) {
          const extracted = extractPeaksFromRawPoints(rawPts, 30);
          const patternStr = extracted.map(p => `${p.twoTheta.toFixed(2)}, ${p.intensity.toFixed(1)}`).join('\n');
          setCustomPatternA(patternStr);
          setCustomNameA(file.name.replace(/\.[^/.]+$/, ''));
          setFileStatsA(`${rawPts.length} data points, ${extracted.length} peaks detected`);
          setSampleAInputMode('custom');
          if (onRawDataUploadedA) onRawDataUploadedA(rawPts);
        } else {
          setCustomPatternA(text);
          setCustomNameA(file.name.replace(/\.[^/.]+$/, ''));
          setFileStatsA(`Loaded text file: ${file.name}`);
          setSampleAInputMode('custom');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDropA = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingA(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const loadExamplePatternA = (type: 'ha' | 'tio2' | 'lifepo4') => {
    if (type === 'ha') {
      setCustomNameA('HAp Experimental');
      setCustomFormulaA('Ca10(PO4)6(OH)2');
      setCustomPatternA('25.87(30), 31.77(100), 32.19(70), 32.90(60), 34.04(25), 39.81(20), 46.71(35), 49.46(30)');
    } else if (type === 'tio2') {
      setCustomNameA('TiO2 Anatase/Rutile');
      setCustomFormulaA('TiO2');
      setCustomPatternA('25.30(100), 27.45(50), 37.80(25), 48.05(35), 54.30(60), 55.05(20)');
    } else if (type === 'lifepo4') {
      setCustomNameA('LiFePO4 Delithiated');
      setCustomFormulaA('Li1-xFePO4');
      setCustomPatternA('17.15(25), 20.65(30), 25.55(100), 29.70(45), 32.20(30), 35.60(80)');
    }
  };

  const selectedMaterialB = materialsDb[selectedSampleBIndex] || materialsDb[0];

  return (
    <div className="space-y-4">
      {/* Primary 2-Column Sample Configuration (A vs B) with Center Swap Button */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
        {/* Sample A: Target / Experimental */}
        <div 
          className="bg-[#080d1a] border-2 p-4 lg:p-5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden transition-all"
          style={{ borderColor: `${activePalette.colorA}50` }}
        >
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-2 rounded-xl border flex items-center justify-center shadow-sm"
                  style={{ 
                    backgroundColor: `${activePalette.colorA}18`,
                    borderColor: `${activePalette.colorA}40`,
                    color: activePalette.colorA 
                  }}
                >
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs lg:text-sm font-extrabold uppercase tracking-wider" style={{ color: activePalette.colorA }}>
                      Sample A: Target / Experimental
                    </h3>
                    <input
                      type="color"
                      value={activePalette.colorA}
                      onChange={(e) => onUpdateCustomColor('colorA', e.target.value)}
                      className="w-5 h-5 rounded-md cursor-pointer border border-slate-700 bg-transparent p-0"
                      title="Click to customize Sample A curve color"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {sampleAInputMode === 'active' ? 'Real-time calculation from current session' : 'Custom reflection list or uploaded scan'}
                  </p>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
                <button
                  id="btn-sampleA-active"
                  onClick={() => setSampleAInputMode('active')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    sampleAInputMode === 'active'
                      ? 'shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleAInputMode === 'active' ? { backgroundColor: activePalette.colorA, color: '#000000' } : {}}
                >
                  Active Session
                </button>
                <button
                  id="btn-sampleA-custom"
                  onClick={() => setSampleAInputMode('custom')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    sampleAInputMode === 'custom'
                      ? 'shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleAInputMode === 'custom' ? { backgroundColor: activePalette.colorA, color: '#000000' } : {}}
                >
                  Custom / File
                </button>
              </div>
            </div>

            {/* Content Area */}
            {sampleAInputMode === 'active' ? (
              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Material:</span>
                  <span className="font-bold text-sm font-mono" style={{ color: activePalette.colorA }}>
                    {activeMaterialName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Using real crystallographic reflections and intensity values computed in the active Bragg diffraction workspace.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Synchronized with Workspace
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Sample Name</label>
                    <input
                      type="text"
                      value={customNameA}
                      onChange={(e) => setCustomNameA(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
                      placeholder="e.g. Bio-HAp Sintered"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Chemical Formula</label>
                    <input
                      type="text"
                      value={customFormulaA}
                      onChange={(e) => setCustomFormulaA(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 outline-none"
                      placeholder="e.g. Ca10(PO4)6(OH)2"
                    />
                  </div>
                </div>

                {/* Drag and Drop Zone or Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                      <span>2θ, Intensity Peak List</span>
                      <span className="text-slate-500 font-normal text-[9px]">(or 2θ(I) format)</span>
                    </label>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        <Upload className="w-3 h-3" />
                        <span>Upload File (.xy/.csv/.raw)</span>
                        <input
                          type="file"
                          accept=".xy,.csv,.dat,.txt,.raw"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              processUploadedFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Drag & Drop Wrapper */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingA(true); }}
                    onDragLeave={() => setIsDraggingA(false)}
                    onDrop={handleDropA}
                    className={`relative rounded-xl border transition-all ${
                      isDraggingA 
                        ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50' 
                        : 'border-slate-800 bg-slate-900/90'
                    }`}
                  >
                    <textarea
                      rows={3}
                      value={customPatternA}
                      onChange={(e) => setCustomPatternA(e.target.value)}
                      className="w-full bg-transparent p-2.5 text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                      placeholder="25.87(30), 31.77(100), 32.19(70), 32.90(60)..."
                    />
                    {isDraggingA && (
                      <div className="absolute inset-0 bg-cyan-950/80 backdrop-blur-xs flex items-center justify-center text-cyan-300 font-mono text-xs font-bold rounded-xl pointer-events-none">
                        Drop XRD File (.xy / .csv / .dat / .raw) here
                      </div>
                    )}
                  </div>

                  {fileStatsA && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                      <span>✓ {fileStatsA}</span>
                      <button 
                        onClick={() => setFileStatsA(null)} 
                        className="text-slate-500 hover:text-slate-300 text-[9px]"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Quick Format Loaders */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono">Quick Formats:</span>
                    <button
                      type="button"
                      onClick={() => loadExamplePatternA('ha')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      HAp Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => loadExamplePatternA('tio2')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      TiO₂ Anatase
                    </button>
                    <button
                      type="button"
                      onClick={() => loadExamplePatternA('lifepo4')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      LiFePO₄ Battery
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sample B: Reference Standard (Model Phase 1) */}
        <div 
          className="bg-[#080d1a] border-2 p-4 lg:p-5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden transition-all"
          style={{ borderColor: `${activePalette.colorB}50` }}
        >
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-2 rounded-xl border flex items-center justify-center shadow-sm"
                  style={{ 
                    backgroundColor: `${activePalette.colorB}18`,
                    borderColor: `${activePalette.colorB}40`,
                    color: activePalette.colorB 
                  }}
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs lg:text-sm font-extrabold uppercase tracking-wider" style={{ color: activePalette.colorB }}>
                      Sample B: Reference Standard
                    </h3>
                    <input
                      type="color"
                      value={activePalette.colorB}
                      onChange={(e) => onUpdateCustomColor('colorB', e.target.value)}
                      className="w-5 h-5 rounded-md cursor-pointer border border-slate-700 bg-transparent p-0"
                      title="Click to customize Sample B curve color"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {sampleBInputMode === 'preset' ? 'Searchable crystallographic materials library' : 'User-specified reference pattern'}
                  </p>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
                <button
                  id="btn-sampleB-preset"
                  onClick={() => setSampleBInputMode('preset')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    sampleBInputMode === 'preset'
                      ? 'shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleBInputMode === 'preset' ? { backgroundColor: activePalette.colorB, color: '#000000' } : {}}
                >
                  Database
                </button>
                <button
                  id="btn-sampleB-custom"
                  onClick={() => setSampleBInputMode('custom')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    sampleBInputMode === 'custom'
                      ? 'shadow-sm ring-1 ring-white/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleBInputMode === 'custom' ? { backgroundColor: activePalette.colorB, color: '#000000' } : {}}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Content Area */}
            {sampleBInputMode === 'preset' ? (
              <div className="space-y-3 text-xs">
                {/* Search / Filter for database materials */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={dbSearchQueryB}
                    onChange={(e) => setDbSearchQueryB(e.target.value)}
                    placeholder="Search database standards (e.g. HAp, TiO2, Quartz, Spinel, Battery)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 outline-none"
                  />
                  {dbSearchQueryB && (
                    <button
                      onClick={() => setDbSearchQueryB('')}
                      className="text-slate-500 hover:text-slate-300 absolute right-2.5 top-2 text-[10px] font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={selectedSampleBIndex}
                    onChange={(e) => setSelectedSampleBIndex(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {filteredMaterialsB.map(({ material, originalIndex }) => (
                      <option key={originalIndex} value={originalIndex}>
                        {material.name} ({material.formula}) - {material.crystalSystem || 'Crystalline'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Material Card Info */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Phase Name:</span>
                    <strong className="text-indigo-300 font-bold">{selectedMaterialB.name}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Crystal System: <strong className="text-slate-200">{selectedMaterialB.crystalSystem || 'Hexagonal'}</strong></span>
                    <span>Space Group: <strong className="text-slate-200">{selectedMaterialB.spaceGroup || 'P63/m'}</strong></span>
                  </div>
                </div>

                {onOpenSearchMatch && (
                  <button
                    type="button"
                    onClick={onOpenSearchMatch}
                    className="w-full py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-amber-400"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auto Search-Match Best Database Phase</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Standard Name</label>
                    <input
                      type="text"
                      value={customNameB}
                      onChange={(e) => setCustomNameB(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                      placeholder="e.g. Standard ICDD 09-0432"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Chemical Formula</label>
                    <input
                      type="text"
                      value={customFormulaB}
                      onChange={(e) => setCustomFormulaB(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                      placeholder="e.g. Ca10(PO4)6(OH)2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Reference Peak List (2θ, I)
                  </label>
                  <textarea
                    rows={3}
                    value={customPatternB}
                    onChange={(e) => setCustomPatternB(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none resize-none leading-relaxed"
                    placeholder="25.87(30), 31.77(100), 32.19(70)..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Central Quick Swap Action Bar */}
      <div className="flex items-center justify-center gap-3">
        <button
          id="btn-swap-samples"
          onClick={onSwapSamples}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all shadow-md active:scale-95 cursor-pointer hover:border-cyan-400"
          title="Swap Sample A and Reference B roles"
        >
          <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
          <span>⇄ Swap Sample A & Reference B</span>
        </button>
      </div>

      {/* Expandable Advanced Drawers (Multi-Phase Deconvolution & Simulation Physics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drawer 1: Multi-Phase Mixture Deconvolution */}
        <div className="bg-[#080d1a] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowMultiPhaseDrawer(!showMultiPhaseDrawer)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Layers3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <span>Multi-Phase Mixture Deconvolution</span>
                  {(hasPhaseC || hasPhaseD) && (
                    <span className="px-2 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                      {hasPhaseC && hasPhaseD ? 'Phases C & D Active' : 'Phase C Active'}
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Synthesize secondary & tertiary phases with real-time NNLS fraction solving
                </p>
              </div>
            </div>
            {showMultiPhaseDrawer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showMultiPhaseDrawer && (
            <div className="p-4 pt-0 border-t border-slate-800/80 space-y-4 text-xs font-mono animate-in fade-in duration-200">
              {/* Secondary Phase C */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-phase-c"
                      checked={hasPhaseC}
                      onChange={(e) => setHasPhaseC(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 cursor-pointer accent-purple-500"
                    />
                    <label htmlFor="toggle-phase-c" className="font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePalette.colorC }} />
                      <span>Secondary Phase C</span>
                    </label>
                  </div>

                  {hasPhaseC && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-purple-300 font-bold">Scale: {(scalePhaseC * 100).toFixed(0)}%</span>
                      <input
                        type="color"
                        value={activePalette.colorC}
                        onChange={(e) => onUpdateCustomColor('colorC', e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border border-slate-700 bg-transparent"
                        title="Pick Phase C color"
                      />
                    </div>
                  )}
                </div>

                {hasPhaseC && (
                  <div className="space-y-2 pt-1">
                    <select
                      value={selectedPhaseCIndex}
                      onChange={(e) => setSelectedPhaseCIndex(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs outline-none"
                    >
                      {materialsDb.map((mat, idx) => (
                        <option key={idx} value={idx}>
                          {mat.name} ({mat.formula})
                        </option>
                      ))}
                    </select>

                    <div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.5"
                        step="0.05"
                        value={scalePhaseC}
                        onChange={(e) => setScalePhaseC(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tertiary Phase D */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-phase-d"
                      checked={hasPhaseD}
                      onChange={(e) => setHasPhaseD(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-600 cursor-pointer accent-rose-500"
                    />
                    <label htmlFor="toggle-phase-d" className="font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activePalette.colorD }} />
                      <span>Tertiary Phase D</span>
                    </label>
                  </div>

                  {hasPhaseD && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-rose-300 font-bold">Scale: {(scalePhaseD * 100).toFixed(0)}%</span>
                      <input
                        type="color"
                        value={activePalette.colorD}
                        onChange={(e) => onUpdateCustomColor('colorD', e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border border-slate-700 bg-transparent"
                        title="Pick Phase D color"
                      />
                    </div>
                  )}
                </div>

                {hasPhaseD && (
                  <div className="space-y-2 pt-1">
                    <select
                      value={selectedPhaseDIndex}
                      onChange={(e) => setSelectedPhaseDIndex(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs outline-none"
                    >
                      {materialsDb.map((mat, idx) => (
                        <option key={idx} value={idx}>
                          {mat.name} ({mat.formula})
                        </option>
                      ))}
                    </select>

                    <div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.5"
                        step="0.05"
                        value={scalePhaseD}
                        onChange={(e) => setScalePhaseD(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer 2: Simulation Physics & Peak Profile Parameters */}
        <div className="bg-[#080d1a] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
          <button
            onClick={() => setShowEngineDrawer(!showEngineDrawer)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <span>Diffraction Physics & Profile Functions</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  Pseudo-Voigt broadening, Scherrer FWHM, background & noise modeling
                </p>
              </div>
            </div>
            {showEngineDrawer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showEngineDrawer && (
            <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 text-xs font-mono animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Peak Shape Function
                  </label>
                  <select
                    value={engineSettings.peakShape}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, peakShape: e.target.value as PeakShapeFunction }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs outline-none"
                  >
                    <option value="pseudoVoigt">Pseudo-Voigt (η·L + (1-η)·G)</option>
                    <option value="pearsonVII">Pearson VII</option>
                    <option value="gaussian">Gaussian (Instrumental)</option>
                    <option value="lorentzian">Lorentzian (Crystallite Size)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      FWHM Broadening (2θ)
                    </label>
                    <span className="text-[11px] text-cyan-400 font-bold">{engineSettings.fwhm.toFixed(2)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.80"
                    step="0.02"
                    value={engineSettings.fwhm}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, fwhm: parseFloat(e.target.value) }))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      Lorentzian Mixing (η)
                    </label>
                    <span className="text-[11px] text-indigo-400 font-bold">{(engineSettings.eta * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={engineSettings.eta}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, eta: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      Background Floor
                    </label>
                    <span className="text-[11px] text-amber-400 font-bold">{engineSettings.backgroundLevel.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.2"
                    value={engineSettings.backgroundLevel}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, backgroundLevel: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
