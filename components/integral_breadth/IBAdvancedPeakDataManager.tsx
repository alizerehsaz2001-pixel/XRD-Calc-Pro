import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Table, 
  Plus, 
  Trash2, 
  ArrowUpDown, 
  Check, 
  AlertCircle, 
  Copy, 
  Download, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Sliders, 
  Layers, 
  Zap, 
  Database,
  BrainCircuit,
  Info,
  CopyCheck,
  Calculator,
  ChevronDown,
  Atom
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IBAdvancedInput, IBAdvancedResult } from '../../types';
import { parseIBAdvancedInput, validateHKLAgainstCrystalSystem } from '../../utils/physics';
import { IBAdvancedSyntheticModal } from './IBAdvancedSyntheticModal';
import { IBAdvancedHKLModal } from './IBAdvancedHKLModal';
import { IBAdvancedProfileCalcModal } from './IBAdvancedProfileCalcModal';

interface IBAdvancedPeakDataManagerProps {
  inputData: string;
  onInputChange: (newData: string) => void;
  wavelength: number;
  constantK: number;
  instBetaIB: number;
  instrumentalMode: 'constant' | 'caglioti';
  cagliotiParams: { U: number; V: number; W: number };
  decouplingMethod: 'linear' | 'squared' | 'hw_voigt' | 'none';
  materialDensityGcm3: number;
  youngsModulusGPa: number;
  excludedIndices: number[];
  onToggleExcludePeak: (index: number) => void;
  onResetExclusions: () => void;
  selectedMaterial: string;
  onSelectPreset?: (preset: any) => void;
  materialPresets?: Array<{ label: string; data: string; desc: string; youngsModulus?: number; density?: number }>;
  result?: IBAdvancedResult | null;
}

export const IBAdvancedPeakDataManager: React.FC<IBAdvancedPeakDataManagerProps> = ({
  inputData,
  onInputChange,
  wavelength,
  constantK,
  instBetaIB,
  instrumentalMode,
  cagliotiParams,
  decouplingMethod,
  materialDensityGcm3,
  youngsModulusGPa,
  excludedIndices,
  onToggleExcludePeak,
  onResetExclusions,
  selectedMaterial,
  onSelectPreset,
  materialPresets = [],
  result
}) => {
  // Mode state: 'table' vs 'raw'
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [showFormatHelp, setShowFormatHelp] = useState<boolean>(false);
  const [showSyntheticModal, setShowSyntheticModal] = useState<boolean>(false);
  const [showHKLModal, setShowHKLModal] = useState<boolean>(false);
  const [showCalcModal, setShowCalcModal] = useState<boolean>(false);
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState<boolean>(false);

  // New Reflection quick add form state
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('');
  const [newImax, setNewImax] = useState<string>('1000');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);

  // File upload hidden ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);

  // Parsed reflections from inputData
  const parsedPeaks: IBAdvancedInput[] = useMemo(() => {
    return parseIBAdvancedInput(inputData);
  }, [inputData]);

  // Syntax validation for raw mode & health checks
  const validationInfo = useMemo(() => {
    if (!inputData.trim()) return { errors: ['Dataset is empty. Add reflections (2θ, Area, I_max [, h k l]) to begin analysis.'], warnings: [], validCount: 0 };
    const lines = inputData.split('\n');
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
      if (parts.length < 3) {
        errors.push(`Line ${index + 1}: Insufficient values (found ${parts.length}, need at least 3: 2θ, Area, I_max).`);
        return;
      }

      const tt = parts[0];
      if (tt <= 0 || tt >= 180) {
        errors.push(`Line ${index + 1}: Bragg angle 2θ (${tt}°) is out of valid range (0° < 2θ < 180°).`);
        return;
      }

      // Check Area & Imax depending on whether parts[1] is FWHM or Area
      let area = parts[1];
      let imax = parts[2];
      if (parts.length === 4 || parts.length >= 7) {
        // format with FWHM: 2theta, fwhm, area, imax
        area = parts[2];
        imax = parts[3];
      }

      if (area <= 0) {
        errors.push(`Line ${index + 1}: Integrated Area (${area}) must be positive.`);
        return;
      }
      if (imax <= 0) {
        errors.push(`Line ${index + 1}: Maximum Intensity I_max (${imax}) must be positive.`);
        return;
      }

      const beta = area / imax;
      if (beta > 6.0) {
        warnings.push(`Line ${index + 1}: Integral breadth β = ${beta.toFixed(2)}° is unusually large (> 6°). Check Area/I_max units.`);
      }

      // Check HKL if present
      if (parts.length === 6 || parts.length >= 7) {
        const h = parts.length === 6 ? parts[3] : parts[4];
        const k = parts.length === 6 ? parts[4] : parts[5];
        const l = parts.length === 6 ? parts[5] : parts[6];
        if (h === 0 && k === 0 && l === 0) {
          warnings.push(`Line ${index + 1}: (0, 0, 0) is physically invalid for diffracted planes.`);
        }
      }

      validCount++;
    });

    if (validCount > 0 && validCount < 2) {
      warnings.push(`Dataset contains only 1 reflection. At least 2 reflections are required for linear size-strain regression.`);
    }

    return { errors, warnings, validCount };
  }, [inputData]);

  // Dataset statistics
  const datasetStats = useMemo(() => {
    if (parsedPeaks.length === 0) return null;
    const ttList = parsedPeaks.map(p => p.twoTheta);
    const minTT = Math.min(...ttList);
    const maxTT = Math.max(...ttList);
    const spread = maxTT - minTT;
    const avgBeta = parsedPeaks.reduce((sum, p) => sum + (p.iMax > 0 ? p.area / p.iMax : 0), 0) / parsedPeaks.length;
    const activeCount = parsedPeaks.filter((_, idx) => !excludedIndices.includes(idx)).length;

    return {
      total: parsedPeaks.length,
      active: activeCount,
      excluded: excludedIndices.length,
      minTT,
      maxTT,
      spread,
      avgBeta
    };
  }, [parsedPeaks, excludedIndices]);

  // Serialize peaks back to string
  const serializePeaks = (peaks: IBAdvancedInput[]): string => {
    return peaks.map(p => {
      const hklStr = p.hkl ? `, ${p.hkl.join(' ')}` : '';
      if (p.fwhm !== undefined && p.fwhm > 0) {
        return `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.iMax.toFixed(0)}${hklStr}`;
      }
      return `${p.twoTheta.toFixed(2)}, ${p.area.toFixed(1)}, ${p.iMax.toFixed(0)}${hklStr}`;
    }).join('\n');
  };

  // Row operations in Table View
  const handleUpdateRow = (index: number, field: keyof IBAdvancedInput | 'h' | 'k' | 'l', value: any) => {
    const updated = [...parsedPeaks];
    if (!updated[index]) return;

    if (field === 'h' || field === 'k' || field === 'l') {
      const currentHkl = updated[index].hkl || [1, 1, 1];
      const h = field === 'h' ? (parseInt(value, 10) || 0) : currentHkl[0];
      const k = field === 'k' ? (parseInt(value, 10) || 0) : currentHkl[1];
      const l = field === 'l' ? (parseInt(value, 10) || 0) : currentHkl[2];
      updated[index] = { ...updated[index], hkl: [h, k, l] };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    onInputChange(serializePeaks(updated));
  };

  const handleDeleteRow = (index: number) => {
    const updated = parsedPeaks.filter((_, i) => i !== index);
    onInputChange(serializePeaks(updated));
  };

  const handleDuplicateRow = (index: number) => {
    const peak = parsedPeaks[index];
    if (!peak) return;
    const duplicated: IBAdvancedInput = {
      ...peak,
      twoTheta: parseFloat((peak.twoTheta + 0.1).toFixed(2)),
      hkl: peak.hkl ? [...peak.hkl] : undefined
    };
    const updated = [...parsedPeaks.slice(0, index + 1), duplicated, ...parsedPeaks.slice(index + 1)];
    onInputChange(serializePeaks(updated));
  };

  const handleSortAscending = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onInputChange(serializePeaks(sorted));
  };

  const handleQuickAdd = () => {
    const tt = parseFloat(newTwoTheta);
    const area = parseFloat(newArea);
    const imax = parseFloat(newImax) || 1000;

    if (isNaN(tt) || isNaN(area) || tt <= 0 || tt >= 180 || area <= 0 || imax <= 0) return;

    let hkl: [number, number, number] | undefined = undefined;
    if (newH !== '' && newK !== '' && newL !== '') {
      hkl = [parseInt(newH, 10) || 0, parseInt(newK, 10) || 0, parseInt(newL, 10) || 0];
    }

    const newPeak: IBAdvancedInput = { twoTheta: tt, area, iMax: imax, hkl };
    const updated = [...parsedPeaks, newPeak];
    onInputChange(serializePeaks(updated));

    // Reset quick add form
    setNewTwoTheta('');
    setNewArea('');
    setNewImax('1000');
    setNewH('');
    setNewK('');
    setNewL('');
    setIsAddFormOpen(false);
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(inputData);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = '2Theta_deg,Area,Imax,Observed_Beta_deg,h,k,l\n';
    parsedPeaks.forEach(p => {
      const beta = p.iMax > 0 ? (p.area / p.iMax).toFixed(4) : '0';
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      csv += `${p.twoTheta.toFixed(2)},${p.area.toFixed(1)},${p.iMax.toFixed(0)},${beta},${h},${k},${l}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ib_reflections_${selectedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split('\n');
      const validRows: string[] = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().includes('theta') || trimmed.toLowerCase().includes('area')) return;
        const parts = trimmed.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
        if (parts.length >= 3 && parts[0] > 0 && parts[0] < 180) {
          validRows.push(trimmed);
        }
      });

      if (validRows.length > 0) {
        onInputChange(validRows.join('\n'));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Format and Auto-clean raw data
  const handleAutoClean = () => {
    const cleaned = serializePeaks(parsedPeaks);
    onInputChange(cleaned);
  };

  return (
    <div className="bg-[#070D18] rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all shadow-inner overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-pink-950/20 via-slate-900/40 to-[#070D18]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/10 border border-pink-500/30 rounded-xl text-pink-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">
                Reflections Data (2θ, Area, I_max [, h k l])
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {parsedPeaks.length} Peaks
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
              β_obs = Area / I_max • Integral Breadth profile breadths & Miller indices
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Table vs Raw Text) */}
        <div className="flex items-center gap-1.5 bg-[#0A101C] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Grid Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
              viewMode === 'raw'
                ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Raw CSV
          </button>
        </div>
      </div>

      {/* Dataset Summary Metrics Banner */}
      {datasetStats && (
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase font-black text-[8px]">Active / Total:</span>
            <span className="text-emerald-400 font-bold">{datasetStats.active} / {datasetStats.total}</span>
            {datasetStats.excluded > 0 && (
              <span className="text-amber-400 font-bold text-[8px] bg-amber-500/10 px-1 rounded">
                ({datasetStats.excluded} excl)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase font-black text-[8px]">2θ Range:</span>
            <span className="text-pink-300 font-bold">{datasetStats.minTT.toFixed(1)}° – {datasetStats.maxTT.toFixed(1)}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase font-black text-[8px]">Angular Span:</span>
            <span className="text-cyan-300 font-bold">{datasetStats.spread.toFixed(1)}° 2θ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase font-black text-[8px]">Mean β_obs:</span>
            <span className="text-amber-300 font-bold">{datasetStats.avgBeta.toFixed(3)}°</span>
          </div>
        </div>
      )}

      {/* Quick Action Toolbar */}
      <div className="p-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 bg-[#050A14]/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Add Peak Button */}
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
              isAddFormOpen 
                ? 'bg-pink-500/30 border-pink-500/60 text-pink-200' 
                : 'bg-white/5 border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-300'
            }`}
          >
            <Plus className="w-3 h-3 text-pink-400" />
            Add Peak
          </button>

          {/* Sort Ascending */}
          <button
            type="button"
            onClick={handleSortAscending}
            title="Sort reflections strictly by 2θ ascending"
            className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-300 transition-all"
          >
            <ArrowUpDown className="w-3 h-3 text-pink-400" />
            Sort 2θ
          </button>

          {/* Synthetic Peak Generator Modal Button */}
          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 hover:border-pink-500/70 transition-all shadow-inner"
          >
            <Sparkles className="w-3 h-3 text-pink-400 animate-pulse" />
            Synthetic
          </button>

          {/* HKL Algorithmic Indexer Modal Button */}
          <button
            type="button"
            onClick={() => setShowHKLModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:border-purple-500/70 transition-all"
          >
            <BrainCircuit className="w-3 h-3 text-purple-400" />
            (h k l) Assist
          </button>

          {/* Profile Shape Calculator */}
          <button
            type="button"
            onClick={() => setShowCalcModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:border-emerald-500/70 transition-all"
          >
            <Calculator className="w-3 h-3 text-emerald-400" />
            Profile Calc
          </button>

          {/* Material Presets Selector */}
          {materialPresets.length > 0 && (
            <div className="relative" ref={presetsRef}>
              <button
                type="button"
                onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
                className="px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-300 transition-all"
              >
                <Atom className="w-3 h-3 text-pink-400" />
                Presets
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              <AnimatePresence>
                {isPresetsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-[#050A14] border border-pink-500/30 rounded-xl shadow-2xl p-1 z-50 max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    {materialPresets.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (onSelectPreset) onSelectPreset(preset);
                          setIsPresetsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg hover:bg-pink-500/10 transition-colors ${
                          selectedMaterial === preset.label ? 'bg-pink-500/20 text-pink-300' : 'text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div className="text-[8px] text-slate-500 font-mono truncate">{preset.desc}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right action group: Copy, Import, Export, Format info */}
        <div className="flex items-center gap-1">
          {excludedIndices.length > 0 && (
            <button
              type="button"
              onClick={onResetExclusions}
              className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all mr-1"
            >
              Reset Excluded
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyToClipboard}
            title="Copy reflection data to clipboard"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-300 transition-colors"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import reflection data from file (CSV, TXT)"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv,.txt,.dat,.xy" 
            className="hidden" 
          />

          <button
            type="button"
            onClick={handleExportCSV}
            title="Download reflections as CSV"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            title="Formatting & Integral Breadth Guide"
            className={`p-1.5 rounded-lg border transition-colors ${
              showFormatHelp ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Format Help Dropdown */}
      <AnimatePresence>
        {showFormatHelp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#050A14] border-b border-pink-500/30 p-4 text-xs font-mono space-y-2 text-slate-300"
          >
            <div className="flex items-center gap-2 text-pink-400 font-black uppercase text-[10px]">
              <Info className="w-4 h-4" />
              Integral Breadth Data Format Guide
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In Integral Breadth analysis, each reflection is specified by its Bragg position <strong className="text-pink-300">2θ</strong> (°), integrated peak area <strong className="text-emerald-300">Area</strong> (count·deg or a.u.), and peak maximum intensity <strong className="text-cyan-300">I_max</strong> (counts).
            </p>
            <div className="bg-[#0A101C] p-2.5 rounded-xl border border-white/5 space-y-1 text-[10px]">
              <div className="text-slate-400"><strong className="text-pink-300">Standard:</strong> <span className="text-slate-200">2θ, Area, I_max [, h k l]</span> (e.g. <span className="text-pink-400">28.44, 230, 1000, 1 1 1</span>)</div>
              <div className="text-slate-400"><strong className="text-emerald-300">With FWHM:</strong> <span className="text-slate-200">2θ, FWHM, Area, I_max [, h k l]</span> (e.g. <span className="text-emerald-400">28.44, 0.23, 230, 1000, 1 1 1</span>)</div>
              <div className="text-slate-500 mt-1 pt-1 border-t border-white/5 italic">
                Observed breadth is strictly computed as β_obs = Area / I_max. Miller planes (h k l) enable anisotropic stress & dislocation contrast models.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Quick Add Peak Form */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#050A14] border-b border-pink-500/30 p-3 space-y-2"
          >
            <div className="text-[9px] font-black uppercase tracking-widest text-pink-400 flex items-center justify-between">
              <span>Quick Add Reflection</span>
              {parseFloat(newArea) > 0 && parseFloat(newImax) > 0 && (
                <span className="text-cyan-300 font-mono font-bold">
                  β_obs = {(parseFloat(newArea) / parseFloat(newImax)).toFixed(4)}°
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div>
                <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">2θ (deg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="28.44"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0A101C] text-pink-300 border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-pink-500/60"
                />
              </div>

              <div>
                <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Area (a.u.)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="230"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0A101C] text-emerald-300 border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">I_max (cts)</label>
                <input
                  type="number"
                  step="50"
                  placeholder="1000"
                  value={newImax}
                  onChange={(e) => setNewImax(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#0A101C] text-cyan-300 border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Miller (h k l)</label>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    placeholder="h"
                    value={newH}
                    onChange={(e) => setNewH(e.target.value)}
                    className="px-2 py-1.5 bg-[#0A101C] text-purple-300 border border-white/10 rounded-lg text-xs font-mono text-center outline-none"
                  />
                  <input
                    type="number"
                    placeholder="k"
                    value={newK}
                    onChange={(e) => setNewK(e.target.value)}
                    className="px-2 py-1.5 bg-[#0A101C] text-purple-300 border border-white/10 rounded-lg text-xs font-mono text-center outline-none"
                  />
                  <input
                    type="number"
                    placeholder="l"
                    value={newL}
                    onChange={(e) => setNewL(e.target.value)}
                    className="px-2 py-1.5 bg-[#0A101C] text-purple-300 border border-white/10 rounded-lg text-xs font-mono text-center outline-none"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={!newTwoTheta || !newArea || !newImax}
                  className="w-full py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-pink-500/20 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Append
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Display Area */}
      {viewMode === 'table' ? (
        /* GRID TABLE MODE */
        <div className="overflow-x-auto custom-scrollbar max-h-[380px] p-2 space-y-1.5">
          {parsedPeaks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No reflections loaded. Click <strong className="text-pink-400">"Add Peak"</strong>, <strong className="text-pink-400">"Synthetic"</strong>, or choose a preset to begin.
            </div>
          ) : (
            <div className="min-w-[650px] space-y-1">
              {/* Table Column Headers */}
              <div className="grid grid-cols-12 gap-1.5 px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5">
                <span className="col-span-1 text-center">Active</span>
                <span className="col-span-1">#</span>
                <span className="col-span-2">2θ (deg)</span>
                <span className="col-span-2">Area</span>
                <span className="col-span-2">I_max</span>
                <span className="col-span-2">β_obs (deg)</span>
                <span className="col-span-1 text-center">(h k l)</span>
                <span className="col-span-1 text-right">Action</span>
              </div>

              {/* Rows */}
              {parsedPeaks.map((peak, idx) => {
                const isExcluded = excludedIndices.includes(idx);
                const betaObs = peak.iMax > 0 ? peak.area / peak.iMax : 0;
                const thetaRad = (peak.twoTheta / 2) * (Math.PI / 180);
                const sinTheta = Math.sin(thetaRad);
                const cosTheta = Math.cos(thetaRad);
                const dSpacing = sinTheta > 0 ? wavelength / (2 * sinTheta) : 0;

                // Deconvolved beta sample
                let betaInstDeg = instBetaIB;
                if (instrumentalMode === 'caglioti') {
                  const tanTheta = Math.tan(thetaRad);
                  const vSq = cagliotiParams.U * tanTheta * tanTheta + cagliotiParams.V * tanTheta + cagliotiParams.W;
                  betaInstDeg = Math.sqrt(Math.max(1e-6, vSq));
                }
                let betaSampleDeg = betaObs;
                if (decouplingMethod === 'squared') {
                  betaSampleDeg = Math.sqrt(Math.max(0, betaObs * betaObs - betaInstDeg * betaInstDeg));
                } else if (decouplingMethod === 'hw_voigt') {
                  const ratio = betaInstDeg / Math.max(1e-6, betaObs);
                  betaSampleDeg = betaObs * Math.sqrt(Math.max(0.0001, 1 - ratio * ratio));
                } else if (decouplingMethod === 'linear') {
                  betaSampleDeg = Math.max(0, betaObs - betaInstDeg);
                }

                const apparentSizeNm = (betaSampleDeg > 0 && cosTheta > 0)
                  ? (constantK * wavelength) / ((betaSampleDeg * Math.PI / 180) * cosTheta) / 10
                  : 0;

                const hklVal = peak.hkl || [1, 1, 1];

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-1.5 items-center px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                      isExcluded 
                        ? 'bg-red-950/10 border-red-500/20 opacity-50' 
                        : 'bg-[#0A101C] border-white/5 hover:border-pink-500/30'
                    }`}
                  >
                    {/* Exclude Toggle */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => onToggleExcludePeak(idx)}
                        title={isExcluded ? 'Include reflection in regression' : 'Exclude reflection as outlier'}
                        className={`p-1 rounded-md transition-colors ${
                          isExcluded 
                            ? 'text-red-400 hover:bg-red-500/20' 
                            : 'text-slate-400 hover:text-pink-300 hover:bg-white/5'
                        }`}
                      >
                        {isExcluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Peak Index */}
                    <span className="col-span-1 text-[10px] font-bold text-slate-500">
                      #{idx + 1}
                    </span>

                    {/* 2-Theta Input */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={peak.twoTheta}
                        onChange={(e) => handleUpdateRow(idx, 'twoTheta', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 bg-[#050A14] border border-white/10 rounded text-xs font-mono font-bold outline-none focus:border-pink-500/60 ${
                          isExcluded ? 'line-through text-slate-500' : 'text-pink-300'
                        }`}
                      />
                    </div>

                    {/* Area Input */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="1"
                        value={peak.area}
                        onChange={(e) => handleUpdateRow(idx, 'area', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 bg-[#050A14] border border-white/10 rounded text-xs font-mono font-bold outline-none focus:border-emerald-500/60 ${
                          isExcluded ? 'line-through text-slate-500' : 'text-emerald-300'
                        }`}
                      />
                    </div>

                    {/* Imax Input */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="50"
                        value={peak.iMax}
                        onChange={(e) => handleUpdateRow(idx, 'iMax', parseFloat(e.target.value) || 1000)}
                        className={`w-full px-2 py-1 bg-[#050A14] border border-white/10 rounded text-xs font-mono font-bold outline-none focus:border-cyan-500/60 ${
                          isExcluded ? 'line-through text-slate-500' : 'text-cyan-300'
                        }`}
                      />
                    </div>

                    {/* Computed Beta & Apparent Size */}
                    <div className="col-span-2 flex flex-col justify-center">
                      <span className="text-[11px] font-mono font-bold text-amber-300">
                        {betaObs.toFixed(4)}°
                      </span>
                      <span className="text-[8px] text-slate-500">
                        D ≈ {apparentSizeNm > 0 ? `${apparentSizeNm.toFixed(1)} nm` : '—'}
                      </span>
                    </div>

                    {/* Miller Indices (h k l) */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        <input
                          type="number"
                          value={hklVal[0]}
                          onChange={(e) => handleUpdateRow(idx, 'h', e.target.value)}
                          className="w-4 bg-transparent text-[10px] text-purple-300 font-mono text-center outline-none border-b border-white/10 focus:border-purple-500"
                        />
                        <input
                          type="number"
                          value={hklVal[1]}
                          onChange={(e) => handleUpdateRow(idx, 'k', e.target.value)}
                          className="w-4 bg-transparent text-[10px] text-purple-300 font-mono text-center outline-none border-b border-white/10 focus:border-purple-500"
                        />
                        <input
                          type="number"
                          value={hklVal[2]}
                          onChange={(e) => handleUpdateRow(idx, 'l', e.target.value)}
                          className="w-4 bg-transparent text-[10px] text-purple-300 font-mono text-center outline-none border-b border-white/10 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Actions: Duplicate / Delete */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateRow(idx)}
                        title="Duplicate reflection"
                        className="p-1 text-slate-500 hover:text-pink-300 rounded hover:bg-white/5"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        title="Delete reflection"
                        className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* MONOSPACE RAW CSV TEXT MODE */
        <div className="p-3 space-y-2">
          <div className="relative font-mono text-xs">
            <textarea
              value={inputData}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="28.44, 230, 1000, 1 1 1&#10;47.30, 280, 950, 2 2 0&#10;56.12, 350, 900, 3 1 1"
              className="w-full h-44 px-4 py-3 bg-[#0A101C] text-pink-300 border border-white/10 focus:border-pink-500/50 rounded-xl focus:ring-1 focus:ring-pink-500/20 outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700 shadow-inner font-mono text-xs"
              spellCheck="false"
            />
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAutoClean}
                title="Format & clean whitespace"
                className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-pink-300 bg-black/80 hover:bg-black px-2 py-0.5 rounded border border-white/10 transition-colors"
              >
                Auto-Format
              </button>
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded border border-white/10">
                2θ, Area, I_max [, h k l]
              </div>
            </div>
          </div>

          {/* Real-time Syntax Warnings / Errors */}
          {validationInfo.errors.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/40 p-2.5 rounded-xl space-y-1">
              <div className="text-[9px] font-black uppercase text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Syntax Error Detected
              </div>
              {validationInfo.errors.slice(0, 3).map((err, i) => (
                <div key={i} className="text-[10px] text-red-300 font-mono pl-5">
                  • {err}
                </div>
              ))}
            </div>
          )}

          {validationInfo.warnings.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl space-y-1">
              <div className="text-[9px] font-black uppercase text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Dataset Health Advisory
              </div>
              {validationInfo.warnings.slice(0, 3).map((warn, i) => (
                <div key={i} className="text-[10px] text-amber-300/90 font-mono pl-5">
                  • {warn}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <IBAdvancedSyntheticModal
        isOpen={showSyntheticModal}
        onClose={() => setShowSyntheticModal(false)}
        wavelength={wavelength}
        onGenerate={(dataString, materialName, density, youngsMod) => {
          onInputChange(dataString);
          if (onSelectPreset) {
            onSelectPreset({
              label: materialName,
              data: dataString,
              desc: 'Synthetically generated microstructural peak dataset',
              density,
              youngsModulus: youngsMod
            });
          }
        }}
      />

      <IBAdvancedHKLModal
        isOpen={showHKLModal}
        onClose={() => setShowHKLModal(false)}
        wavelength={wavelength}
        currentPeaks={parsedPeaks.map(p => ({
          twoTheta: p.twoTheta,
          area: p.area,
          iMax: p.iMax,
          fwhm: p.fwhm,
          h: p.hkl ? p.hkl[0] : undefined,
          k: p.hkl ? p.hkl[1] : undefined,
          l: p.hkl ? p.hkl[2] : undefined
        }))}
        onApplyIndices={(indexed) => {
          const updated = indexed.map(item => ({
            twoTheta: item.twoTheta,
            area: item.area,
            iMax: item.iMax,
            fwhm: item.fwhm,
            hkl: [item.h, item.k, item.l] as [number, number, number]
          }));
          onInputChange(serializePeaks(updated));
        }}
      />

      <IBAdvancedProfileCalcModal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        onApplyCalculatedPeak={(tt, area, imax, fwhm, h, k, l) => {
          let hkl: [number, number, number] | undefined = undefined;
          if (h !== undefined && k !== undefined && l !== undefined) {
            hkl = [h, k, l];
          }
          const newPeak: IBAdvancedInput = { twoTheta: tt, area, iMax: imax, fwhm, hkl };
          const updated = [...parsedPeaks, newPeak];
          onInputChange(serializePeaks(updated));
        }}
      />
    </div>
  );
};
