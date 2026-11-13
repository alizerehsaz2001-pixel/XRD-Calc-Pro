import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FlaskConical, 
  Database, 
  Layers3, 
  Upload, 
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  SlidersHorizontal,
  Search,
  Zap,
  CheckCircle2,
  Scale,
  Atom,
  Crosshair,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import { 
  CurveColorPalette, 
  CompareEngineSettings, 
  PeakShapeFunction 
} from './types';
import { 
  parseContinuousRawData, 
  extractPeaksFromRawPoints,
  estimateMaterialRir
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

  // Optional Quick Alignment & Telemetry Props
  shiftTwoTheta?: number;
  setShiftTwoTheta?: (shift: number) => void;
  scaleSampleB?: number;
  setScaleSampleB?: (scale: number) => void;
  onAutoAlign?: () => void;
  peaksCountA?: number;
  peaksCountB?: number;
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
  onRawDataUploadedA,
  shiftTwoTheta = 0,
  setShiftTwoTheta,
  scaleSampleB = 1.0,
  setScaleSampleB,
  onAutoAlign,
  peaksCountA,
  peaksCountB
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
  const selectedMaterialC = materialsDb[selectedPhaseCIndex] || materialsDb[1] || materialsDb[0];
  const selectedMaterialD = materialsDb[selectedPhaseDIndex] || materialsDb[2] || materialsDb[0];

  const defaultRirB = useMemo(() => estimateMaterialRir(selectedMaterialB), [selectedMaterialB]);
  const defaultRirC = useMemo(() => estimateMaterialRir(selectedMaterialC), [selectedMaterialC]);
  const defaultRirD = useMemo(() => estimateMaterialRir(selectedMaterialD), [selectedMaterialD]);

  return (
    <div className="space-y-3">
      {/* Primary 2-Column Specimen Configuration (Channel A vs Channel B) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 relative">
        {/* CHANNEL A: TARGET / EXPERIMENTAL SPECIMEN */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-lg flex flex-col justify-between shadow-xl relative overflow-hidden">
          {/* Top 2px Calibrated Signal Accent Bar */}
          <div className="h-0.5 w-full" style={{ backgroundColor: activePalette.colorA }} />

          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="p-1.5 rounded-md border flex items-center justify-center shrink-0"
                  style={{ 
                    backgroundColor: `${activePalette.colorA}15`,
                    borderColor: `${activePalette.colorA}40`,
                    color: activePalette.colorA 
                  }}
                >
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#070A12] border border-slate-800 text-[9px] font-mono font-bold text-slate-300">
                      CH-A
                    </span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider truncate" style={{ color: activePalette.colorA }}>
                      EXPERIMENTAL TARGET SPECIMEN
                    </h3>
                    <input
                      type="color"
                      value={activePalette.colorA}
                      onChange={(e) => onUpdateCustomColor('colorA', e.target.value)}
                      className="w-4 h-4 rounded cursor-pointer border border-slate-700 bg-transparent p-0 shrink-0"
                      title="Customize Channel A trace color"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>{sampleAInputMode === 'active' ? 'Live Bragg Session Feed' : 'Custom / Ascii Scan Input'}</span>
                    {peaksCountA !== undefined && (
                      <span className="text-sky-400 font-bold tabular-nums">
                        · {peaksCountA} Reflections
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode Switch */}
              <div className="flex items-center bg-[#070A12] border border-slate-800 p-0.5 rounded-md shrink-0">
                <button
                  id="btn-sampleA-active"
                  onClick={() => setSampleAInputMode('active')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    sampleAInputMode === 'active'
                      ? 'text-slate-950 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleAInputMode === 'active' ? { backgroundColor: activePalette.colorA } : {}}
                >
                  Workspace
                </button>
                <button
                  id="btn-sampleA-custom"
                  onClick={() => setSampleAInputMode('custom')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    sampleAInputMode === 'custom'
                      ? 'text-slate-950 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleAInputMode === 'custom' ? { backgroundColor: activePalette.colorA } : {}}
                >
                  Custom / File
                </button>
              </div>
            </div>

            {/* Content Area */}
            {sampleAInputMode === 'active' ? (
              <div className="p-3.5 bg-[#070A12] rounded-md border border-slate-800 text-xs space-y-2 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Active Workspace Material:</span>
                  <span className="font-bold text-xs tabular-nums" style={{ color: activePalette.colorA }}>
                    {activeMaterialName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Directly coupled to the active Bragg structure factor &amp; crystallographic reflection generator.
                </p>
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>REAL-TIME TELEMETRY LINK ACTIVE</span>
                  </span>
                  <span className="text-slate-500">Cu Kα₁ = 1.54056 Å</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block mb-1">
                      Specimen Identifier
                    </label>
                    <input
                      type="text"
                      value={customNameA}
                      onChange={(e) => setCustomNameA(e.target.value)}
                      className="w-full bg-[#070A12] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-sky-500 outline-none"
                      placeholder="e.g. Bio-HAp Sintered"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block mb-1">
                      Chemical Formula
                    </label>
                    <input
                      type="text"
                      value={customFormulaA}
                      onChange={(e) => setCustomFormulaA(e.target.value)}
                      className="w-full bg-[#070A12] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-sky-500 outline-none"
                      placeholder="e.g. Ca10(PO4)6(OH)2"
                    />
                  </div>
                </div>

                {/* Drag and Drop Zone or Textarea */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center gap-1.5">
                      <span>2θ (°), Relative Intensity Peak Array</span>
                    </label>
                    
                    <label className="text-[10px] font-mono text-sky-400 hover:text-sky-300 font-bold cursor-pointer flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30">
                      <Upload className="w-3 h-3" />
                      <span>Import (.xy/.csv/.raw)</span>
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

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingA(true); }}
                    onDragLeave={() => setIsDraggingA(false)}
                    onDrop={handleDropA}
                    className={`relative rounded-md border transition-colors ${
                      isDraggingA 
                        ? 'border-sky-400 bg-sky-950/30' 
                        : 'border-slate-800 bg-[#070A12]'
                    }`}
                  >
                    <textarea
                      rows={3}
                      value={customPatternA}
                      onChange={(e) => setCustomPatternA(e.target.value)}
                      className="w-full bg-transparent p-2 text-slate-200 font-mono text-xs tabular-nums focus:outline-none resize-none leading-relaxed"
                      placeholder="25.87(30), 31.77(100), 32.19(70), 32.90(60)..."
                    />
                    {isDraggingA && (
                      <div className="absolute inset-0 bg-sky-950/85 flex items-center justify-center text-sky-300 font-mono text-xs font-bold rounded-md pointer-events-none">
                        Drop Powder Diffraction File (.xy / .csv / .dat / .raw)
                      </div>
                    )}
                  </div>

                  {fileStatsA && (
                    <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-sky-400">
                      <span>✓ {fileStatsA}</span>
                      <button 
                        onClick={() => setFileStatsA(null)} 
                        className="text-slate-500 hover:text-slate-300 text-[9px]"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Quick Format Loaders */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Templates:</span>
                    <button
                      type="button"
                      onClick={() => loadExamplePatternA('ha')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#070A12] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                    >
                      HAp Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => loadExamplePatternA('tio2')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#070A12] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                    >
                      TiO₂ Anatase
                    </button>
                    <button
                      type="button"
                      onClick={() => loadExamplePatternA('lifepo4')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#070A12] hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                    >
                      LiFePO₄ Cathode
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CHANNEL B: REFERENCE STANDARD (MODEL PHASE 1) */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-lg flex flex-col justify-between shadow-xl relative overflow-hidden">
          {/* Top 2px Calibrated Signal Accent Bar */}
          <div className="h-0.5 w-full" style={{ backgroundColor: activePalette.colorB }} />

          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div 
                  className="p-1.5 rounded-md border flex items-center justify-center shrink-0"
                  style={{ 
                    backgroundColor: `${activePalette.colorB}15`,
                    borderColor: `${activePalette.colorB}40`,
                    color: activePalette.colorB 
                  }}
                >
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#070A12] border border-slate-800 text-[9px] font-mono font-bold text-slate-300">
                      CH-B
                    </span>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider truncate" style={{ color: activePalette.colorB }}>
                      REFERENCE STANDARD (PRIMARY PHASE)
                    </h3>
                    <input
                      type="color"
                      value={activePalette.colorB}
                      onChange={(e) => onUpdateCustomColor('colorB', e.target.value)}
                      className="w-4 h-4 rounded cursor-pointer border border-slate-700 bg-transparent p-0 shrink-0"
                      title="Customize Channel B trace color"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span>{sampleBInputMode === 'preset' ? 'Indexed Crystallographic DB' : 'Custom Reference Array'}</span>
                    {peaksCountB !== undefined && (
                      <span className="text-indigo-300 font-bold tabular-nums">
                        · {peaksCountB} Reflections
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mode Switch */}
              <div className="flex items-center bg-[#070A12] border border-slate-800 p-0.5 rounded-md shrink-0">
                <button
                  id="btn-sampleB-preset"
                  onClick={() => setSampleBInputMode('preset')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    sampleBInputMode === 'preset'
                      ? 'text-slate-950 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleBInputMode === 'preset' ? { backgroundColor: activePalette.colorB } : {}}
                >
                  Database
                </button>
                <button
                  id="btn-sampleB-custom"
                  onClick={() => setSampleBInputMode('custom')}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    sampleBInputMode === 'custom'
                      ? 'text-slate-950 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={sampleBInputMode === 'custom' ? { backgroundColor: activePalette.colorB } : {}}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Content Area */}
            {sampleBInputMode === 'preset' ? (
              <div className="space-y-2.5 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={dbSearchQueryB}
                    onChange={(e) => setDbSearchQueryB(e.target.value)}
                    placeholder="Filter ICDD/COD standards by name, formula, or crystal system..."
                    className="w-full bg-[#070A12] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 outline-none"
                  />
                  {dbSearchQueryB && (
                    <button
                      onClick={() => setDbSearchQueryB('')}
                      className="text-slate-500 hover:text-slate-300 absolute right-2.5 top-1.5 text-[10px] font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={selectedSampleBIndex}
                    onChange={(e) => {
                      const nextIdx = parseInt(e.target.value);
                      setSelectedSampleBIndex(nextIdx);
                      const nextMat = materialsDb[nextIdx];
                      if (nextMat) {
                        setEngineSettings(prev => ({ ...prev, rirB: estimateMaterialRir(nextMat) }));
                      }
                    }}
                    className="w-full bg-[#070A12] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none cursor-pointer"
                  >
                    {filteredMaterialsB.map(({ material, originalIndex }) => (
                      <option key={originalIndex} value={originalIndex}>
                        {material.name} ({material.formula}) — {material.crystalSystem || 'Crystalline'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Material Telemetry Grid */}
                <div className="p-2.5 bg-[#070A12] rounded-md border border-slate-800 text-[11px] font-mono tabular-nums space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Standard Phase:</span>
                    <strong className="text-indigo-300 font-bold truncate max-w-[230px]">{selectedMaterialB.name}</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80 text-[10px]">
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px]">System</span>
                      <span className="text-slate-200 font-bold">{selectedMaterialB.crystalSystem || 'Hexagonal'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase text-[9px]">Space Group</span>
                      <span className="text-slate-200 font-bold">{selectedMaterialB.spaceGroup || 'P63/m'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block uppercase text-[9px]">Corundum I/Ic</span>
                      <span className="text-sky-400 font-bold">{(engineSettings.rirB ?? defaultRirB).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {onOpenSearchMatch && (
                  <button
                    type="button"
                    onClick={onOpenSearchMatch}
                    className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run Automated Search-Match Against Database</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block mb-1">
                      Standard Identifier
                    </label>
                    <input
                      type="text"
                      value={customNameB}
                      onChange={(e) => setCustomNameB(e.target.value)}
                      className="w-full bg-[#070A12] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                      placeholder="e.g. Standard ICDD 09-0432"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block mb-1">
                      Chemical Formula
                    </label>
                    <input
                      type="text"
                      value={customFormulaB}
                      onChange={(e) => setCustomFormulaB(e.target.value)}
                      className="w-full bg-[#070A12] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 outline-none"
                      placeholder="e.g. Ca10(PO4)6(OH)2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block mb-1">
                    Reference Reflection List (2θ, I)
                  </label>
                  <textarea
                    rows={3}
                    value={customPatternB}
                    onChange={(e) => setCustomPatternB(e.target.value)}
                    className="w-full bg-[#070A12] border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs tabular-nums focus:border-indigo-500 outline-none resize-none leading-relaxed"
                    placeholder="25.87(30), 31.77(100), 32.19(70)..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INTEGRATED GONIOMETER ALIGNMENT, SCALING & SWAP CONSOLE */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2.5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 font-mono text-xs tabular-nums">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            id="btn-swap-samples"
            onClick={onSwapSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#070A12] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md text-xs font-bold transition-colors cursor-pointer"
            title="Swap Experimental Sample A and Reference B channels"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
            <span>Swap Ch-A / Ch-B</span>
          </button>

          {setShiftTwoTheta && (
            <div className="flex items-center gap-2 bg-[#070A12] border border-slate-800 px-2.5 py-1 rounded-md">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Ref B Shift (Δ2θ):</span>
              <button
                type="button"
                onClick={() => setShiftTwoTheta(Number((shiftTwoTheta - 0.02).toFixed(2)))}
                className="p-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.01"
                value={shiftTwoTheta}
                onChange={(e) => setShiftTwoTheta(parseFloat(e.target.value))}
                className="w-24 accent-sky-400 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setShiftTwoTheta(Number((shiftTwoTheta + 0.02).toFixed(2)))}
                className="p-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="w-14 text-right font-bold text-sky-400">
                {shiftTwoTheta > 0 ? `+${shiftTwoTheta.toFixed(2)}°` : `${shiftTwoTheta.toFixed(2)}°`}
              </span>
              {shiftTwoTheta !== 0 && (
                <button
                  type="button"
                  onClick={() => setShiftTwoTheta(0)}
                  className="p-0.5 text-slate-500 hover:text-slate-200 cursor-pointer"
                  title="Reset 2Theta shift"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {setScaleSampleB && (
            <div className="flex items-center gap-2 bg-[#070A12] border border-slate-800 px-2.5 py-1 rounded-md">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Scale B:</span>
              <input
                type="range"
                min="0.1"
                max="2.5"
                step="0.05"
                value={scaleSampleB}
                onChange={(e) => setScaleSampleB(parseFloat(e.target.value))}
                className="w-20 accent-indigo-400 cursor-pointer"
              />
              <span className="w-11 text-right font-bold text-indigo-300">
                {(scaleSampleB * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
          {onAutoAlign && (
            <button
              type="button"
              onClick={onAutoAlign}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-md text-xs font-bold transition-colors cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
              <span>Cross-Correlation Auto-Align</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Drawers (Multi-Phase Deconvolution & Simulation Physics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Drawer 1: Multi-Phase Mixture Deconvolution + RIR Corundum Weights */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => setShowMultiPhaseDrawer(!showMultiPhaseDrawer)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#070A12] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Layers3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <span>MULTI-PHASE MIXTURE &amp; CORUNDUM RIR (I/Ic)</span>
                  {(hasPhaseC || hasPhaseD) && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[9px] font-mono">
                      {hasPhaseC && hasPhaseD ? 'CH-C + CH-D ACTIVE' : 'CH-C ACTIVE'}
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Synthesize secondary/tertiary crystalline phases with NNLS + Corundum matrix-flushing weights
                </p>
              </div>
            </div>
            {showMultiPhaseDrawer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showMultiPhaseDrawer && (
            <div className="p-4 pt-3 border-t border-slate-800 bg-[#070A12] space-y-3 text-xs font-mono">
              {/* Primary Phase B RIR calibration */}
              <div className="p-2.5 bg-[#0B0F19] rounded-md border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-300 text-[11px]">Primary Ref B Corundum RIR (I/Ic):</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="20"
                    value={engineSettings.rirB ?? defaultRirB}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, rirB: Math.max(0.1, parseFloat(e.target.value) || 1.0) }))}
                    className="w-20 bg-[#070A12] border border-slate-700 rounded px-2 py-1 text-right text-indigo-300 font-bold tabular-nums text-xs outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setEngineSettings(prev => ({ ...prev, rirB: defaultRirB }))}
                    className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer"
                    title="Reset to database RIR"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Secondary Phase C */}
              <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-phase-c"
                      checked={hasPhaseC}
                      onChange={(e) => setHasPhaseC(e.target.checked)}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-purple-500"
                    />
                    <label htmlFor="toggle-phase-c" className="font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: activePalette.colorC }} />
                      <span>Secondary Phase C</span>
                    </label>
                  </div>

                  {hasPhaseC && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-purple-300 font-bold tabular-nums">Scale: {(scalePhaseC * 100).toFixed(0)}%</span>
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
                      onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        setSelectedPhaseCIndex(idx);
                        const mat = materialsDb[idx];
                        if (mat) {
                          setEngineSettings(prev => ({ ...prev, rirC: estimateMaterialRir(mat) }));
                        }
                      }}
                      className="w-full bg-[#070A12] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs outline-none"
                    >
                      {materialsDb.map((mat, idx) => (
                        <option key={idx} value={idx}>
                          {mat.name} ({mat.formula})
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Pattern Scale Factor</span>
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
                      <div className="flex items-center justify-between bg-[#070A12] px-2.5 py-1.5 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400">RIR (I/Ic):</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="20"
                          value={engineSettings.rirC ?? defaultRirC}
                          onChange={(e) => setEngineSettings(prev => ({ ...prev, rirC: Math.max(0.1, parseFloat(e.target.value) || 1.0) }))}
                          className="w-16 bg-transparent text-right text-purple-300 font-bold tabular-nums text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tertiary Phase D */}
              <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toggle-phase-d"
                      checked={hasPhaseD}
                      onChange={(e) => setHasPhaseD(e.target.checked)}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-rose-500"
                    />
                    <label htmlFor="toggle-phase-d" className="font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: activePalette.colorD }} />
                      <span>Tertiary Phase D</span>
                    </label>
                  </div>

                  {hasPhaseD && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-rose-300 font-bold tabular-nums">Scale: {(scalePhaseD * 100).toFixed(0)}%</span>
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
                      onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        setSelectedPhaseDIndex(idx);
                        const mat = materialsDb[idx];
                        if (mat) {
                          setEngineSettings(prev => ({ ...prev, rirD: estimateMaterialRir(mat) }));
                        }
                      }}
                      className="w-full bg-[#070A12] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs outline-none"
                    >
                      {materialsDb.map((mat, idx) => (
                        <option key={idx} value={idx}>
                          {mat.name} ({mat.formula})
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Pattern Scale Factor</span>
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
                      <div className="flex items-center justify-between bg-[#070A12] px-2.5 py-1.5 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400">RIR (I/Ic):</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="20"
                          value={engineSettings.rirD ?? defaultRirD}
                          onChange={(e) => setEngineSettings(prev => ({ ...prev, rirD: Math.max(0.1, parseFloat(e.target.value) || 1.0) }))}
                          className="w-16 bg-transparent text-right text-rose-300 font-bold tabular-nums text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer 2: Simulation Physics, Caglioti Resolution & Cu Ka1/Ka2 Doublets */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-lg overflow-hidden shadow-lg">
          <button
            onClick={() => setShowEngineDrawer(!showEngineDrawer)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#070A12] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <span>CAGLIOTI (U,V,W) RESOLUTION &amp; Kα₁/Kα₂ OPTICS</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Configure profile kernel, Caglioti angular dispersion, and Rachinger Kα₂ stripping
                </p>
              </div>
            </div>
            {showEngineDrawer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showEngineDrawer && (
            <div className="p-4 pt-3 border-t border-slate-800 bg-[#070A12] space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Profile Convolution Kernel
                  </label>
                  <select
                    value={engineSettings.peakShape}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, peakShape: e.target.value as PeakShapeFunction }))}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs outline-none cursor-pointer"
                  >
                    <option value="pseudoVoigt">Pseudo-Voigt (η·L + (1-η)·G)</option>
                    <option value="pearsonVII">Pearson VII (Exponent m)</option>
                    <option value="gaussian">Gaussian (Instrumental)</option>
                    <option value="lorentzian">Lorentzian (Cauchy Size)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Intensity Normalization
                  </label>
                  <select
                    value={engineSettings.normalizationMode}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, normalizationMode: e.target.value as 'max100' | 'unitArea' | 'raw' }))}
                    className="w-full bg-[#0B0F19] border border-slate-800 rounded px-2.5 py-1.5 text-sky-300 text-xs outline-none cursor-pointer"
                  >
                    <option value="max100">Max Peak = 100% (Standard)</option>
                    <option value="unitArea">Unit Integrated Area (∫I d2θ)</option>
                    <option value="raw">Raw Unscaled Counts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      Base FWHM₀ (W = FWHM₀²)
                    </label>
                    <span className="text-[11px] text-sky-400 font-bold tabular-nums">{engineSettings.fwhm.toFixed(2)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.80"
                    step="0.02"
                    value={engineSettings.fwhm}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, fwhm: parseFloat(e.target.value) }))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>

                {engineSettings.peakShape === 'pearsonVII' ? (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Pearson VII Exponent (m)
                      </label>
                      <span className="text-[11px] text-indigo-400 font-bold tabular-nums">{(engineSettings.pearsonM ?? 1.5).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="4.0"
                      step="0.1"
                      value={engineSettings.pearsonM ?? 1.5}
                      onChange={(e) => setEngineSettings(prev => ({ ...prev, pearsonM: parseFloat(e.target.value) }))}
                      className="w-full accent-indigo-400 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">
                        Lorentzian Mixing (η)
                      </label>
                      <span className="text-[11px] text-indigo-400 font-bold tabular-nums">{(engineSettings.eta * 100).toFixed(0)}%</span>
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
                )}
              </div>

              {/* Caglioti (U, V, W) & Cu Ka1/Ka2 Physics Controls */}
              <div className="p-3 bg-[#0B0F19] rounded-md border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-bold text-[11px]">
                    <input
                      type="checkbox"
                      checked={!!engineSettings.enableCaglioti}
                      onChange={(e) => setEngineSettings(prev => ({ ...prev, enableCaglioti: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded accent-sky-400 cursor-pointer"
                    />
                    <Atom className="w-3.5 h-3.5 text-sky-400" />
                    <span>Caglioti Dispersion: FWHM²(θ) = U·tan²θ + V·tanθ + W</span>
                  </label>
                </div>

                {engineSettings.enableCaglioti && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px] text-slate-400">U (Microstrain Term):</span>
                        <span className="text-[10px] text-sky-300 font-bold tabular-nums">{(engineSettings.cagliotiU ?? 0.04).toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="0.25"
                        step="0.005"
                        value={engineSettings.cagliotiU ?? 0.04}
                        onChange={(e) => setEngineSettings(prev => ({ ...prev, cagliotiU: parseFloat(e.target.value) }))}
                        className="w-full accent-sky-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[10px] text-slate-400">V (Optics / Axial):</span>
                        <span className="text-[10px] text-indigo-300 font-bold tabular-nums">{(engineSettings.cagliotiV ?? -0.02).toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="-0.10"
                        max="0.10"
                        step="0.005"
                        value={engineSettings.cagliotiV ?? -0.02}
                        onChange={(e) => setEngineSettings(prev => ({ ...prev, cagliotiV: parseFloat(e.target.value) }))}
                        className="w-full accent-indigo-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!engineSettings.enableKa2Doublet}
                      onChange={(e) => setEngineSettings(prev => ({ ...prev, enableKa2Doublet: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded accent-amber-400 cursor-pointer"
                    />
                    <span>Cu Kα₁/Kα₂ Doublet (2:1)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!engineSettings.stripKa2}
                      onChange={(e) => setEngineSettings(prev => ({ ...prev, stripKa2: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded accent-emerald-400 cursor-pointer"
                    />
                    <span>Rachinger Kα₂ Strip</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      Background Floor
                    </label>
                    <span className="text-[11px] text-amber-400 font-bold tabular-nums">{engineSettings.backgroundLevel.toFixed(1)}%</span>
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

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase">
                      Poisson Noise (σ)
                    </label>
                    <span className="text-[11px] text-rose-400 font-bold tabular-nums">{engineSettings.noiseLevel.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={engineSettings.noiseLevel}
                    onChange={(e) => setEngineSettings(prev => ({ ...prev, noiseLevel: parseFloat(e.target.value) }))}
                    className="w-full accent-rose-400 cursor-pointer"
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
