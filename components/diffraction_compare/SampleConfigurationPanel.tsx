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
  ChevronDown
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
  
  // Phase C (Multi-phase mixture)
  hasPhaseC: boolean;
  setHasPhaseC: (enabled: boolean) => void;
  selectedPhaseCIndex: number;
  setSelectedPhaseCIndex: (idx: number) => void;
  scalePhaseC: number;
  setScalePhaseC: (scale: number) => void;

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
          // Fallback to text lines
          setCustomPatternA(text);
          setCustomNameA(file.name.replace(/\.[^/.]+$/, ''));
          setSampleAInputMode('custom');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sample A: Target / Experimental */}
      <div className="bg-[#080d1a] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {t('Sample A: Target / Experimental')}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {sampleAInputMode === 'active' ? t('Active Results') : t('Custom / Uploaded Pattern')}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
              <button
                onClick={() => setSampleAInputMode('active')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  sampleAInputMode === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('Active')}
              </button>
              <button
                onClick={() => setSampleAInputMode('custom')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  sampleAInputMode === 'custom'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('Custom / Raw')}
              </button>
            </div>
          </div>

          {sampleAInputMode === 'active' ? (
            <div className="bg-[#030712] p-3 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 font-mono">
                  {activeMaterialName || t('Active Material Analysis')}
                </span>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  {t('Live App Context')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {t('Using the current calculated Bragg diffraction results from the main workspace.')}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customNameA}
                  onChange={(e) => setCustomNameA(e.target.value)}
                  placeholder={t('Sample Name (e.g., Sintered BaTiO3)')}
                  className="bg-[#030712] border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-emerald-500/50 outline-none font-mono"
                />
                <input
                  type="text"
                  value={customFormulaA}
                  onChange={(e) => setCustomFormulaA(e.target.value)}
                  placeholder={t('Formula (e.g., BaTiO3)')}
                  className="bg-[#030712] border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-emerald-500/50 outline-none font-mono"
                />
              </div>

              {/* Drag and Drop File Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActiveA(true); }}
                onDragLeave={() => setDragActiveA(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActiveA(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUploadA(e.dataTransfer.files[0]);
                  }
                }}
                className={`border border-dashed rounded-xl p-2.5 transition-all text-center flex items-center justify-between gap-2 ${
                  dragActiveA 
                    ? 'border-emerald-400 bg-emerald-950/30' 
                    : 'border-slate-800 bg-[#030712]/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 text-left">
                  <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-300 font-mono font-bold truncate">
                      {fileStatsA || t('Drop Raw XRD (.xy, .csv, .dat, .txt)')}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {t('Auto-extracts peaks with sub-bin interpolation')}
                    </p>
                  </div>
                </div>

                <label className="cursor-pointer px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono font-bold rounded-lg border border-slate-700 shrink-0 transition-colors">
                  {t('Browse')}
                  <input
                    type="file"
                    accept=".xy,.csv,.dat,.txt,.raw"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUploadA(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              <div>
                <textarea
                  value={customPatternA}
                  onChange={(e) => setCustomPatternA(e.target.value)}
                  rows={2}
                  placeholder="25.87(30), 31.77(100), 32.19(70)... or 2theta, int"
                  className="w-full bg-[#030712] border border-slate-800 text-emerald-300 font-mono text-[11px] p-2 rounded-xl focus:border-emerald-500/50 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sample B: Reference Standard + Optional Phase C */}
      <div className="bg-[#080d1a] border border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {t('Sample B: Reference Phase')}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  {sampleBInputMode === 'preset' ? t('Database Standard') : t('Custom Reference')}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
              <button
                onClick={() => setSampleBInputMode('preset')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  sampleBInputMode === 'preset'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('Database')}
              </button>
              <button
                onClick={() => setSampleBInputMode('custom')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  sampleBInputMode === 'custom'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t('Custom')}
              </button>
            </div>
          </div>

          {sampleBInputMode === 'preset' ? (
            <div className="space-y-2">
              <select
                value={selectedSampleBIndex}
                onChange={(e) => setSelectedSampleBIndex(Number(e.target.value))}
                className="w-full bg-[#030712] border border-slate-800 text-indigo-300 font-mono text-xs p-2.5 rounded-xl outline-none focus:border-indigo-500/50"
              >
                {materialsDb.map((mat, i) => (
                  <option key={i} value={i}>
                    {mat.name} ({mat.formula}) - {mat.crystalSystem || 'N/A'}
                  </option>
                ))}
              </select>

              {/* Multi-Phase C Toggle Accordion */}
              <div className="bg-[#030712] p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers3 className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      {t('Secondary Phase C (Multi-Phase Deconvolution)')}
                    </span>
                  </div>

                  <button
                    onClick={() => setHasPhaseC(!hasPhaseC)}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all border ${
                      hasPhaseC
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {hasPhaseC ? t('Enabled') : t('+ Add Phase C')}
                  </button>
                </div>

                {hasPhaseC && (
                  <div className="space-y-2 pt-1 border-t border-slate-800/60 animate-in fade-in">
                    <select
                      value={selectedPhaseCIndex}
                      onChange={(e) => setSelectedPhaseCIndex(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-purple-300 font-mono text-[11px] p-2 rounded-lg outline-none focus:border-purple-500/50"
                    >
                      {materialsDb.map((mat, i) => (
                        <option key={i} value={i}>
                          {mat.name} ({mat.formula})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                      <span>{t('Phase C Scale / Weight')}:</span>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={scalePhaseC}
                        onChange={(e) => setScalePhaseC(parseFloat(e.target.value))}
                        className="w-32 accent-purple-500 cursor-pointer"
                      />
                      <span className="text-purple-300 font-bold w-10 text-right">{scalePhaseC.toFixed(2)}x</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customNameB}
                  onChange={(e) => setCustomNameB(e.target.value)}
                  placeholder={t('Reference Name')}
                  className="bg-[#030712] border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-indigo-500/50 outline-none font-mono"
                />
                <input
                  type="text"
                  value={customFormulaB}
                  onChange={(e) => setCustomFormulaB(e.target.value)}
                  placeholder={t('Formula')}
                  className="bg-[#030712] border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:border-indigo-500/50 outline-none font-mono"
                />
              </div>
              <textarea
                value={customPatternB}
                onChange={(e) => setCustomPatternB(e.target.value)}
                rows={2}
                placeholder="25.87(30), 31.77(100), 32.19(70)..."
                className="w-full bg-[#030712] border border-slate-800 text-indigo-300 font-mono text-[11px] p-2 rounded-xl focus:border-indigo-500/50 outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
