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
  CopyCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScherrerInput } from '../../types';
import { parseScherrerInput } from '../../utils/physics';
import { WHSyntheticPeakModal } from './WHSyntheticPeakModal';
import { WHHKLIndexAssistModal } from './WHHKLIndexAssistModal';

interface WHPeakDataManagerProps {
  inputData: string;
  onInputChange: (newData: string) => void;
  wavelength: number;
  constantK: number;
  instFwhm: number;
  isDecouplingEnabled: boolean;
  broadeningModel: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
  excludedIndices: number[];
  onToggleExcludePeak: (index: number) => void;
  onSelectPreset?: (data: string, name?: string, youngsModulus?: number, density?: number) => void;
}

export const WHPeakDataManager: React.FC<WHPeakDataManagerProps> = ({
  inputData,
  onInputChange,
  wavelength,
  constantK,
  instFwhm,
  isDecouplingEnabled,
  broadeningModel,
  excludedIndices,
  onToggleExcludePeak,
  onSelectPreset
}) => {
  // Mode state: 'table' vs 'raw'
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [showFormatHelp, setShowFormatHelp] = useState<boolean>(false);
  const [showSyntheticModal, setShowSyntheticModal] = useState<boolean>(false);
  const [showHKLModal, setShowHKLModal] = useState<boolean>(false);

  // New Reflection quick add form state
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newFwhm, setNewFwhm] = useState<string>('');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);

  // File upload hidden ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed reflections from inputData
  const parsedPeaks: ScherrerInput[] = useMemo(() => {
    return parseScherrerInput(inputData);
  }, [inputData]);

  // Syntax validation for raw mode & health checks
  const validationInfo = useMemo(() => {
    if (!inputData.trim()) return { errors: ['Dataset is empty. Add peaks (2θ, FWHM, h, k, l) to begin analysis.'], warnings: [] };
    const lines = inputData.split('\n');
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
      if (parts.length < 2) {
        errors.push(`Line ${index + 1}: Insufficient values (found ${parts.length}, need at least 2: 2θ and FWHM).`);
        return;
      }

      const tt = parts[0];
      if (tt <= 0 || tt >= 180) {
        errors.push(`Line ${index + 1}: Bragg angle 2θ (${tt}°) is out of valid range (0° < 2θ < 180°).`);
        return;
      }

      const fwhm = parts[1];
      if (fwhm <= 0) {
        errors.push(`Line ${index + 1}: FWHM (${fwhm}°) must be strictly positive.`);
        return;
      }

      if (parts.length >= 5) {
        const h = parts[2];
        const k = parts[3];
        const l = parts[4];
        if (h === 0 && k === 0 && l === 0) {
          warnings.push(`Line ${index + 1}: (0, 0, 0) is physically invalid for diffracted planes.`);
        }
      }

      validCount++;
    });

    if (validCount > 0 && validCount < 3) {
      warnings.push(`Dataset contains ${validCount} peak(s). At least 3 non-collinear reflections are strongly recommended for reliable Williamson-Hall linear regression.`);
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
    const avgFwhm = parsedPeaks.reduce((sum, p) => sum + p.fwhmObs, 0) / parsedPeaks.length;

    const activeCount = parsedPeaks.filter((_, idx) => !excludedIndices.includes(idx)).length;

    return {
      total: parsedPeaks.length,
      active: activeCount,
      excluded: excludedIndices.length,
      minTT,
      maxTT,
      spread,
      avgFwhm
    };
  }, [parsedPeaks, excludedIndices]);

  // Calculate live single-peak properties
  const getPeakDerivedProps = (peak: ScherrerInput) => {
    const thetaRad = (peak.twoTheta / 2) * (Math.PI / 180);
    const sinTheta = Math.sin(thetaRad);
    const cosTheta = Math.cos(thetaRad);

    // d-spacing: lambda / (2 * sin(theta))
    const dSpacing = sinTheta > 0 ? wavelength / (2 * sinTheta) : 0;
    
    // Deconvolution of instrumental broadening
    let betaSampleDeg = peak.fwhmObs;
    if (isDecouplingEnabled && instFwhm > 0) {
      if (broadeningModel === 'Lorentzian') {
        betaSampleDeg = Math.max(0.001, peak.fwhmObs - instFwhm);
      } else {
        // Gaussian / Pseudo-Voigt approximation
        const diffSq = Math.pow(peak.fwhmObs, 2) - Math.pow(instFwhm, 2);
        betaSampleDeg = diffSq > 0 ? Math.sqrt(diffSq) : 0.001;
      }
    }

    const betaSampleRad = (betaSampleDeg * Math.PI) / 180;
    // Apparent Scherrer size: D = (K * lambda) / (beta * cos(theta))  [in nm]
    // (lambda in Angstroms -> convert to nm: lambda/10 or multiply by 0.1)
    const apparentSizeNm = (betaSampleRad > 0 && cosTheta > 0)
      ? ((constantK * (wavelength * 0.1)) / (betaSampleRad * cosTheta))
      : 0;

    return {
      dSpacing,
      betaSampleDeg,
      apparentSizeNm
    };
  };

  // Convert array of ScherrerInput back to text string
  const serializePeaksToText = (peaks: ScherrerInput[]): string => {
    return peaks.map(p => {
      const tt = p.twoTheta.toFixed(3);
      const f = p.fwhmObs.toFixed(4);
      if (p.hkl) {
        return `${tt}, ${f}, ${p.hkl[0]}, ${p.hkl[1]}, ${p.hkl[2]}`;
      }
      return `${tt}, ${f}`;
    }).join('\n');
  };

  // Update a single cell in the table
  const handleUpdateCell = (index: number, field: 'twoTheta' | 'fwhmObs' | 'h' | 'k' | 'l', val: string) => {
    const updated = [...parsedPeaks];
    const peak = { ...updated[index] };

    if (field === 'twoTheta') {
      peak.twoTheta = parseFloat(val) || 0;
    } else if (field === 'fwhmObs') {
      peak.fwhmObs = parseFloat(val) || 0;
    } else if (field === 'h' || field === 'k' || field === 'l') {
      const currentHkl = peak.hkl || [1, 1, 1];
      const h = field === 'h' ? (parseInt(val, 10) || 0) : currentHkl[0];
      const k = field === 'k' ? (parseInt(val, 10) || 0) : currentHkl[1];
      const l = field === 'l' ? (parseInt(val, 10) || 0) : currentHkl[2];
      peak.hkl = [h, k, l];
    }

    updated[index] = peak;
    onInputChange(serializePeaksToText(updated));
  };

  // Add new reflection from form
  const handleAddPeak = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tt = parseFloat(newTwoTheta);
    const f = parseFloat(newFwhm);

    if (isNaN(tt) || tt <= 0 || tt >= 180 || isNaN(f) || f <= 0) return;

    let hkl: [number, number, number] | undefined = undefined;
    const h = parseInt(newH, 10);
    const k = parseInt(newK, 10);
    const l = parseInt(newL, 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      hkl = [h, k, l];
    }

    const updated = [...parsedPeaks, { twoTheta: tt, fwhmObs: f, hkl }];
    onInputChange(serializePeaksToText(updated));

    // Reset inputs
    setNewTwoTheta('');
    setNewFwhm('');
    setNewH('');
    setNewK('');
    setNewL('');
    setIsAddFormOpen(false);
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    const updated = parsedPeaks.filter((_, idx) => idx !== index);
    onInputChange(serializePeaksToText(updated));
  };

  // Duplicate row
  const handleDuplicateRow = (index: number) => {
    const target = parsedPeaks[index];
    if (!target) return;
    const duplicated: ScherrerInput = {
      twoTheta: parseFloat((target.twoTheta + 0.05).toFixed(3)),
      fwhmObs: target.fwhmObs,
      hkl: target.hkl ? [...target.hkl] : undefined
    };
    const updated = [...parsedPeaks];
    updated.splice(index + 1, 0, duplicated);
    onInputChange(serializePeaksToText(updated));
  };

  // Sort by 2Theta ascending
  const handleSortAscending = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onInputChange(serializePeaksToText(sorted));
  };

  // Auto-format / clean raw text
  const handleFormatCleanText = () => {
    if (parsedPeaks.length === 0) return;
    const cleaned = parsedPeaks
      .sort((a, b) => a.twoTheta - b.twoTheta)
      .map(p => {
        const tt = p.twoTheta.toFixed(3).padStart(7, ' ');
        const f = p.fwhmObs.toFixed(4).padStart(7, ' ');
        if (p.hkl) {
          return `${tt}, ${f}, ${String(p.hkl[0]).padStart(2, ' ')}, ${String(p.hkl[1]).padStart(2, ' ')}, ${String(p.hkl[2]).padStart(2, ' ')}`;
        }
        return `${tt}, ${f}`;
      })
      .join('\n');
    onInputChange(cleaned);
  };

  // Copy CSV to clipboard
  const handleCopyCSV = () => {
    const header = "2Theta_deg,FWHM_deg,h,k,l\n";
    const body = parsedPeaks.map(p => {
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      return `${p.twoTheta.toFixed(3)},${p.fwhmObs.toFixed(4)},${h},${k},${l}`;
    }).join('\n');

    navigator.clipboard.writeText(header + body);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Export CSV file
  const handleDownloadCSV = () => {
    const header = "2Theta_deg,FWHM_deg,h,k,l,d_spacing_A,apparent_size_nm\n";
    const body = parsedPeaks.map(p => {
      const derived = getPeakDerivedProps(p);
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      return `${p.twoTheta.toFixed(4)},${p.fwhmObs.toFixed(4)},${h},${k},${l},${derived.dSpacing.toFixed(4)},${derived.apparentSizeNm.toFixed(2)}`;
    }).join('\n');

    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `williamson_hall_peaks_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Strip out any CSV headers if present
        const lines = content.split('\n');
        const cleanLines = lines.filter(line => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return false;
          // check if header line
          if (t.toLowerCase().includes('theta') || t.toLowerCase().includes('fwhm') || t.toLowerCase().includes('2th')) return false;
          return true;
        });
        onInputChange(cleanLines.join('\n'));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-[#070D18] rounded-2xl border border-white/10 overflow-hidden space-y-3 transition-all hover:border-cyan-500/30">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.dat,.xy,.tsv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header & View Mode Switcher */}
      <div className="p-3.5 pb-2 border-b border-white/5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Title & Badge */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Peak Data</span>
                <span className="text-[9px] text-slate-400 font-mono font-normal">(2θ, FWHM, h, k, l)</span>
              </h3>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#0A101C] p-0.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)] font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3 h-3" />
              <span>Grid Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)] font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Raw CSV</span>
            </button>
          </div>
        </div>

        {/* Dataset Health & Statistics Bar */}
        {datasetStats && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[9px]">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {datasetStats.active} Active / {datasetStats.total} Total
              </span>
              <span className="text-slate-400">
                2θ: <strong className="text-cyan-300">{datasetStats.minTT.toFixed(1)}°</strong> → <strong className="text-cyan-300">{datasetStats.maxTT.toFixed(1)}°</strong> (Δ={datasetStats.spread.toFixed(1)}°)
              </span>
            </div>

            {/* Regression readiness */}
            {datasetStats.active >= 3 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Fit Ready
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1" title="Needs at least 3 peaks for robust linear regression">
                <AlertCircle className="w-3 h-3" /> Need ≥3 Peaks
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="px-3.5 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {/* Quick Add Form Trigger */}
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>Add Peak</span>
          </button>

          {/* Sort 2Theta */}
          <button
            type="button"
            onClick={handleSortAscending}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Sort peaks in ascending 2θ order"
          >
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <span>Sort 2θ</span>
          </button>

          {/* HKL Indexing Assist */}
          <button
            type="button"
            onClick={() => setShowHKLModal(true)}
            className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Algorithmic HKL plane indexing assist"
          >
            <BrainCircuit className="w-3 h-3 text-purple-400" />
            <span>Index (hkl)</span>
          </button>

          {/* Synthetic Generator */}
          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Simulate diffraction peaks with specified size and strain"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Synthesize</span>
          </button>
        </div>

        {/* Data Import/Export Tools */}
        <div className="flex items-center gap-1">
          {viewMode === 'raw' && (
            <button
              type="button"
              onClick={handleFormatCleanText}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer"
              title="Clean formatting and align columns"
            >
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400" />
              <span>Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer"
            title="Import peak data from CSV or TXT file"
          >
            <Upload className="w-2.5 h-2.5 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer"
            title="Download peak dataset as CSV"
          >
            <Download className="w-2.5 h-2.5 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCSV}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer"
            title="Copy CSV to clipboard"
          >
            {copiedNotification ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
            title="Format guidelines"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Format Help Info Box */}
      <AnimatePresence>
        {showFormatHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-3.5 p-3 bg-[#0A101C] rounded-xl border border-cyan-500/20 text-[10px] space-y-1.5 font-mono text-slate-300"
          >
            <div className="flex items-center justify-between text-cyan-300 font-bold">
              <span>Williamson-Hall Peak Data Format</span>
              <button onClick={() => setShowFormatHelp(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <p className="text-[9px] text-slate-400 font-sans">
              Enter one diffraction reflection per row. Comma, space, or tab delimiters are accepted.
            </p>
            <div className="bg-black/60 p-2 rounded text-[9px] text-emerald-300 border border-white/5 space-y-0.5">
              <p>2θ (deg), FWHM (deg), h, k, l</p>
              <p className="text-slate-500">28.440, 0.250, 1, 1, 1</p>
              <p className="text-slate-500">47.300, 0.280, 2, 2, 0</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Inline Bar */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddPeak}
            className="mx-3.5 p-3 bg-[#0A101C] rounded-xl border border-emerald-500/30 space-y-2"
          >
            <div className="flex items-center justify-between text-[9px] font-black uppercase text-emerald-400 tracking-wider">
              <span>Add New Diffraction Peak</span>
              <button type="button" onClick={() => setIsAddFormOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">2θ (°)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="38.50"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">FWHM (°)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="0.32"
                  value={newFwhm}
                  onChange={(e) => setNewFwhm(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">h</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newH}
                  onChange={(e) => setNewH(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-purple-300 border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">k</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newK}
                  onChange={(e) => setNewK(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-purple-300 border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">l</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newL}
                  onChange={(e) => setNewL(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-purple-300 border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-black uppercase rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Append Peak</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main View: Grid Table vs Raw CSV Text */}
      <div className="px-3.5 pb-3">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto max-h-56 custom-scrollbar rounded-xl border border-white/10 bg-[#0A101C]">
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="sticky top-0 bg-[#060B14] z-10 text-slate-400 uppercase text-[8px] tracking-wider border-b border-white/10 select-none">
                <tr>
                  <th className="py-2 px-2 text-center w-8">Active</th>
                  <th className="py-2 px-2">2θ (deg)</th>
                  <th className="py-2 px-2">FWHM (deg)</th>
                  <th className="py-2 px-2 text-center">h k l</th>
                  <th className="py-2 px-2">d (Å)</th>
                  <th className="py-2 px-2">D_app (nm)</th>
                  <th className="py-2 px-2 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedPeaks.map((peak, idx) => {
                  const isExcluded = excludedIndices.includes(idx);
                  const derived = getPeakDerivedProps(peak);
                  const currentHkl = peak.hkl || [1, 1, 1];

                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors ${isExcluded ? 'opacity-40 bg-rose-500/5' : 'hover:bg-cyan-500/5'}`}
                    >
                      {/* Active/Exclude Check */}
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleExcludePeak(idx)}
                          className={`p-1 rounded transition-colors ${isExcluded ? 'text-slate-500 hover:text-rose-400' : 'text-emerald-400 hover:text-emerald-300'}`}
                          title={isExcluded ? 'Click to include in Williamson-Hall regression' : 'Click to exclude outlier'}
                        >
                          {isExcluded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </td>

                      {/* 2Theta Input */}
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.001"
                          value={peak.twoTheta}
                          onChange={(e) => handleUpdateCell(idx, 'twoTheta', e.target.value)}
                          className="w-20 px-1.5 py-0.5 bg-[#070D18] text-white border border-white/10 rounded font-bold font-mono text-[10px] outline-none focus:border-cyan-500"
                        />
                      </td>

                      {/* FWHM Input */}
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.001"
                          value={peak.fwhmObs}
                          onChange={(e) => handleUpdateCell(idx, 'fwhmObs', e.target.value)}
                          className="w-18 px-1.5 py-0.5 bg-[#070D18] text-emerald-300 border border-white/10 rounded font-mono text-[10px] outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* HKL 3 compact inputs */}
                      <td className="py-1.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1 bg-[#070D18] px-1 py-0.5 rounded border border-white/10">
                          <input
                            type="number"
                            value={currentHkl[0]}
                            onChange={(e) => handleUpdateCell(idx, 'h', e.target.value)}
                            className="w-5 text-center bg-transparent text-purple-300 font-bold font-mono text-[9px] outline-none"
                            placeholder="h"
                          />
                          <span className="text-slate-600">:</span>
                          <input
                            type="number"
                            value={currentHkl[1]}
                            onChange={(e) => handleUpdateCell(idx, 'k', e.target.value)}
                            className="w-5 text-center bg-transparent text-purple-300 font-bold font-mono text-[9px] outline-none"
                            placeholder="k"
                          />
                          <span className="text-slate-600">:</span>
                          <input
                            type="number"
                            value={currentHkl[2]}
                            onChange={(e) => handleUpdateCell(idx, 'l', e.target.value)}
                            className="w-5 text-center bg-transparent text-purple-300 font-bold font-mono text-[9px] outline-none"
                            placeholder="l"
                          />
                        </div>
                      </td>

                      {/* d-spacing */}
                      <td className="py-1.5 px-2 text-slate-400">
                        {derived.dSpacing > 0 ? derived.dSpacing.toFixed(3) : '-'}
                      </td>

                      {/* Apparent Size */}
                      <td className="py-1.5 px-2 font-bold text-cyan-300">
                        {derived.apparentSizeNm > 0 ? `${derived.apparentSizeNm.toFixed(1)} nm` : '-'}
                      </td>

                      {/* Actions: Duplicate & Delete */}
                      <td className="py-1.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(idx)}
                            className="p-1 text-slate-500 hover:text-cyan-300 rounded transition-colors"
                            title="Duplicate reflection"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                            title="Delete reflection"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={inputData}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full h-36 px-3 py-2 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/60 rounded-xl outline-none font-mono text-xs leading-relaxed custom-scrollbar"
              placeholder="2θ, FWHM, h, k, l"
              spellCheck="false"
            />

            {/* Validation Feedback */}
            {validationInfo.errors.length > 0 && (
              <div className="p-2 bg-rose-950/30 rounded-lg border border-rose-500/30 text-rose-300 font-mono text-[9px] space-y-0.5">
                {validationInfo.errors.map((err, i) => (
                  <p key={i} className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            {validationInfo.warnings.length > 0 && (
              <div className="p-2 bg-amber-950/30 rounded-lg border border-amber-500/30 text-amber-300 font-mono text-[9px] space-y-0.5">
                {validationInfo.warnings.map((warn, i) => (
                  <p key={i} className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{warn}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Synthetic Modal */}
      {showSyntheticModal && (
        <WHSyntheticPeakModal
          wavelength={wavelength}
          constantK={constantK}
          instFwhm={instFwhm}
          onApply={(formattedData, systemName, youngsModulus, density) => {
            onInputChange(formattedData);
            if (onSelectPreset) {
              onSelectPreset(formattedData, systemName, youngsModulus, density);
            }
          }}
          onClose={() => setShowSyntheticModal(false)}
        />
      )}

      {/* HKL Index Assist Modal */}
      {showHKLModal && (
        <WHHKLIndexAssistModal
          currentPeaks={parsedPeaks.map(p => ({
            twoTheta: p.twoTheta,
            fwhmObs: p.fwhmObs,
            h: p.hkl ? p.hkl[0] : undefined,
            k: p.hkl ? p.hkl[1] : undefined,
            l: p.hkl ? p.hkl[2] : undefined
          }))}
          wavelength={wavelength}
          onApplyIndices={(indexedPeaks) => {
            const formatted = indexedPeaks.map(p => `${p.twoTheta.toFixed(3)}, ${p.fwhmObs.toFixed(4)}, ${p.h}, ${p.k}, ${p.l}`).join('\n');
            onInputChange(formatted);
          }}
          onClose={() => setShowHKLModal(false)}
        />
      )}
    </div>
  );
};
