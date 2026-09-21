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
  ChevronDown,
  Info,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../../types';
import { parseIntegralBreadthInput } from '../../utils/physics';
import { SyntheticReflectionGeneratorModal } from './SyntheticReflectionGeneratorModal';
import { ReflectionInspectionDrawer } from './ReflectionInspectionDrawer';

interface ReflectionsDataManagerProps {
  inputData: string;
  onInputChange: (newData: string) => void;
  wavelength: number;
  constantK: number;
  materialDensity: number;
  selectedMaterial: string;
  onSelectPreset?: (preset: any) => void;
  results?: IntegralBreadthResult[];
}

export const ReflectionsDataManager: React.FC<ReflectionsDataManagerProps> = ({
  inputData,
  onInputChange,
  wavelength,
  constantK,
  materialDensity,
  selectedMaterial,
  onSelectPreset,
  results = []
}) => {
  // Mode state: 'table' vs 'raw'
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [showFormatHelp, setShowFormatHelp] = useState<boolean>(false);
  const [showSyntheticModal, setShowSyntheticModal] = useState<boolean>(false);
  const [selectedInspectPeak, setSelectedInspectPeak] = useState<{ result: IntegralBreadthResult; index: number } | null>(null);

  // New Reflection quick add form state
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newFwhm, setNewFwhm] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('');
  const [newImax, setNewImax] = useState<string>('1000');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);

  // File upload hidden ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed reflections from inputData
  const parsedPeaks = useMemo(() => {
    return parseIntegralBreadthInput(inputData);
  }, [inputData]);

  // Syntax validation for raw mode
  const validationInfo = useMemo(() => {
    if (!inputData.trim()) return { errors: ['Dataset is empty. Add reflections to begin analysis.'], warnings: [] };
    const lines = inputData.split('\n');
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
      if (parts.length < 3) {
        errors.push(`Line ${index + 1}: Insufficient values (found ${parts.length}, need at least 3: 2θ, Area, Imax).`);
        return;
      }

      const tt = parts[0];
      if (tt <= 0 || tt >= 180) {
        errors.push(`Line ${index + 1}: Bragg angle 2θ (${tt}°) is out of valid range (0° < 2θ < 180°).`);
        return;
      }

      if (parts.length === 3) {
        const area = parts[1];
        const imax = parts[2];
        if (area <= 0 || imax <= 0) {
          errors.push(`Line ${index + 1}: Area (${area}) and I_max (${imax}) must be positive.`);
          return;
        }
      } else if (parts.length >= 4) {
        const fwhm = parts[1];
        const area = parts[2];
        const imax = parts[3];
        if (fwhm <= 0) {
          warnings.push(`Line ${index + 1}: FWHM (${fwhm}°) is non-positive.`);
        }
        if (area <= 0 || imax <= 0) {
          errors.push(`Line ${index + 1}: Area (${area}) and I_max (${imax}) must be positive.`);
          return;
        }
        const beta = area / imax;
        const phi = fwhm / beta;
        if (phi < 0.55 || phi > 1.1) {
          warnings.push(`Line ${index + 1}: Apparent shape factor φ = ${phi.toFixed(2)} is outside standard Voigt regime (0.637–0.939).`);
        }
      }
      validCount++;
    });

    return { errors, warnings, validCount };
  }, [inputData]);

  // Aggregate statistics across current reflection set
  const reflectionStats = useMemo(() => {
    if (parsedPeaks.length === 0) return null;
    const ttValues = parsedPeaks.map(p => p.twoTheta);
    const minTT = Math.min(...ttValues);
    const maxTT = Math.max(...ttValues);
    const spreadTT = maxTT - minTT;

    const betaValues = parsedPeaks.map(p => p.area / p.iMax);
    const phiValues = parsedPeaks.map(p => p.fwhm / (p.area / p.iMax));
    const avgPhi = phiValues.reduce((a, b) => a + b, 0) / phiValues.length;

    let profileNature = 'Voigt (Mixed Size & Microstrain)';
    let natureColor = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    if (avgPhi <= 0.68) {
      profileNature = 'Cauchy / Lorentzian (Size-Broadening Dominant)';
      natureColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    } else if (avgPhi >= 0.88) {
      profileNature = 'Gaussian (Microstrain / Defect Dominant)';
      natureColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }

    return {
      count: parsedPeaks.length,
      minTT,
      maxTT,
      spreadTT,
      avgPhi,
      profileNature,
      natureColor
    };
  }, [parsedPeaks]);

  // Convert parsed peaks list back to string format
  const serializePeaks = (peaks: IntegralBreadthInput[]): string => {
    return peaks.map(p => {
      const hklStr = p.hkl && Array.isArray(p.hkl) && p.hkl.length === 3 ? `, ${p.hkl.join(' ')}` : '';
      return `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.iMax.toFixed(0)}${hklStr}`;
    }).join('\n');
  };

  // Table row update
  const handleUpdateRow = (index: number, field: keyof IntegralBreadthInput | 'h' | 'k' | 'l', value: string) => {
    const updated = [...parsedPeaks];
    const peak = { ...updated[index] };

    if (field === 'twoTheta') peak.twoTheta = parseFloat(value) || 0;
    if (field === 'fwhm') peak.fwhm = parseFloat(value) || 0;
    if (field === 'area') peak.area = parseFloat(value) || 0;
    if (field === 'iMax') peak.iMax = parseFloat(value) || 0;

    if (field === 'h' || field === 'k' || field === 'l') {
      const currentHkl = peak.hkl || [0, 0, 0];
      const h = field === 'h' ? (parseInt(value, 10) || 0) : currentHkl[0];
      const k = field === 'k' ? (parseInt(value, 10) || 0) : currentHkl[1];
      const l = field === 'l' ? (parseInt(value, 10) || 0) : currentHkl[2];
      peak.hkl = [h, k, l];
    }

    updated[index] = peak;
    onInputChange(serializePeaks(updated));
  };

  const handleDeleteRow = (index: number) => {
    const updated = parsedPeaks.filter((_, idx) => idx !== index);
    onInputChange(serializePeaks(updated));
  };

  const handleDuplicateRow = (index: number) => {
    const peak = parsedPeaks[index];
    const duplicated: IntegralBreadthInput = {
      ...peak,
      twoTheta: peak.twoTheta + 1.0 // offset slightly so it doesn't overlap identically
    };
    const updated = [...parsedPeaks.slice(0, index + 1), duplicated, ...parsedPeaks.slice(index + 1)];
    onInputChange(serializePeaks(updated));
  };

  const handleAddPeak = () => {
    const tt = parseFloat(newTwoTheta);
    const f = parseFloat(newFwhm);
    const a = parseFloat(newArea);
    const imax = parseFloat(newImax) || 1000;

    if (isNaN(tt) || tt <= 0 || tt >= 180 || isNaN(a) || a <= 0 || isNaN(imax) || imax <= 0) return;

    // If FWHM is omitted or 0, estimate from area and imax
    const calculatedBeta = a / imax;
    const finalFwhm = !isNaN(f) && f > 0 ? f : calculatedBeta * 0.8;

    let hkl: [number, number, number] | undefined = undefined;
    const h = parseInt(newH, 10);
    const k = parseInt(newK, 10);
    const l = parseInt(newL, 10);
    if (!isNaN(h) && !isNaN(k) && !isNaN(l)) {
      hkl = [h, k, l];
    }

    const newPeak: IntegralBreadthInput = {
      twoTheta: tt,
      fwhm: finalFwhm,
      area: a,
      iMax: imax,
      hkl
    };

    const updated = [...parsedPeaks, newPeak];
    onInputChange(serializePeaks(updated));

    // Reset form
    setNewTwoTheta('');
    setNewFwhm('');
    setNewArea('');
    setNewImax('1000');
    setNewH('');
    setNewK('');
    setNewL('');
    setIsAddFormOpen(false);
  };

  const handleSortAscending = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onInputChange(serializePeaks(sorted));
  };

  const handleNormalizeIntensities = () => {
    if (parsedPeaks.length === 0) return;
    const maxI = Math.max(...parsedPeaks.map(p => p.iMax));
    if (maxI <= 0) return;

    const factor = 1000 / maxI;
    const normalized = parsedPeaks.map(p => ({
      ...p,
      iMax: 1000,
      area: p.area * factor
    }));
    onInputChange(serializePeaks(normalized));
  };

  const handleAutoCleanDelimiters = () => {
    if (!inputData.trim()) return;
    const cleaned = serializePeaks(parsedPeaks);
    onInputChange(cleaned);
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(inputData);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleDownloadCSV = () => {
    if (parsedPeaks.length === 0) return;
    const header = "2Theta_deg,FWHM_deg,Area_counts_deg,Imax_counts,h,k,l\n";
    const rows = parsedPeaks.map(p => {
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      return `${p.twoTheta},${p.fwhm},${p.area},${p.iMax},${h},${k},${l}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflections_integral_breadth_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Attempt parsing
        const peaks = parseIntegralBreadthInput(content);
        if (peaks.length > 0) {
          onInputChange(content);
        } else {
          // If raw, try splitting lines
          onInputChange(content);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-[#070D18] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
      {/* Header & Mode Switcher Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Reflections Dataset</h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300">
                {parsedPeaks.length} Peak{parsedPeaks.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              2θ (deg), FWHM (deg), Area (counts·°), I_max (counts), [h k l]
            </p>
          </div>
        </div>

        {/* View Switcher: Table vs Raw Text */}
        <div className="flex items-center gap-1.5 bg-[#050A14] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Interactive Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Raw CSV Text</span>
          </button>
        </div>
      </div>

      {/* Dataset Health & Physical Summary Strip */}
      {reflectionStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0A101C] p-3 rounded-2xl border border-white/5 text-xs font-mono">
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-sans font-bold">2θ Range</span>
            <span className="text-white font-bold">{reflectionStats.minTT.toFixed(2)}° – {reflectionStats.maxTT.toFixed(2)}°</span>
            <span className="text-[9px] text-slate-500 block">Δ2θ = {reflectionStats.spreadTT.toFixed(1)}°</span>
          </div>

          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Mean Shape (φ)</span>
            <span className="text-amber-300 font-bold">{reflectionStats.avgPhi.toFixed(3)}</span>
            <span className="text-[9px] text-slate-500 block">FWHM / β_obs</span>
          </div>

          <div className="col-span-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Profile Diagnosis</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold truncate ${reflectionStats.natureColor}`}>
                {reflectionStats.profileNature}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ACTION TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Add Reflection button */}
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Peak</span>
          </button>

          {/* Sort by 2theta */}
          <button
            type="button"
            onClick={handleSortAscending}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sort reflections in ascending 2θ order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
            <span>Sort 2θ</span>
          </button>

          {/* Normalize Intensities */}
          <button
            type="button"
            onClick={handleNormalizeIntensities}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Scale peak areas such that maximum peak I_max = 1000 counts"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Normalize</span>
          </button>

          {/* Synthetic Generator */}
          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-pink-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Generate synthetic Bragg reflections for FCC, BCC, Diamond or Hexagonal structures"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Synthetic Lab</span>
          </button>
        </div>

        {/* Right Action Group: Upload, Copy, Download */}
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt,.xy,.dat"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Import reflections from CSV, TXT, or XY file"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Download reflections as CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopyClipboard}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Copy reflections to clipboard"
          >
            {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Show formatting help"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* QUICK ADD FORM EXPANDABLE */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-[#0A101C] p-4 rounded-2xl border border-purple-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add New Reflection
              </span>
              <span className="text-[10px] font-mono text-slate-500">Live Integral Breadth = Area / I_max</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div>
                <label className="text-[9px] text-slate-400 block mb-1">2θ (deg)*</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 28.44"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#050A14] text-white border border-white/10 rounded-xl focus:border-purple-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-400 block mb-1">FWHM (deg)</label>
                <input
                  type="number"
                  step="0.005"
                  placeholder="e.g. 0.22"
                  value={newFwhm}
                  onChange={(e) => setNewFwhm(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#050A14] text-white border border-white/10 rounded-xl focus:border-purple-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-400 block mb-1">Area (counts·°)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 230"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#050A14] text-white border border-white/10 rounded-xl focus:border-purple-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-400 block mb-1">I_max (counts)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 1000"
                  value={newImax}
                  onChange={(e) => setNewImax(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#050A14] text-white border border-white/10 rounded-xl focus:border-purple-500/50 outline-none"
                />
              </div>
            </div>

            {/* Optional Miller Indices HKL */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">Miller (h k l):</span>
              <div className="flex gap-1.5 w-40">
                <input
                  type="number"
                  placeholder="h"
                  value={newH}
                  onChange={(e) => setNewH(e.target.value)}
                  className="w-12 px-2 py-1 bg-[#050A14] text-purple-300 border border-white/10 rounded-lg text-center font-mono text-xs outline-none"
                />
                <input
                  type="number"
                  placeholder="k"
                  value={newK}
                  onChange={(e) => setNewK(e.target.value)}
                  className="w-12 px-2 py-1 bg-[#050A14] text-purple-300 border border-white/10 rounded-lg text-center font-mono text-xs outline-none"
                />
                <input
                  type="number"
                  placeholder="l"
                  value={newL}
                  onChange={(e) => setNewL(e.target.value)}
                  className="w-12 px-2 py-1 bg-[#050A14] text-purple-300 border border-white/10 rounded-lg text-center font-mono text-xs outline-none"
                />
              </div>

              <div className="flex-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-3 py-1 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddPeak}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  Insert Reflection
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORMAT HELP EXPANDABLE */}
      <AnimatePresence>
        {showFormatHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-[#0A101C] p-4 rounded-2xl border border-white/10 space-y-2 text-xs text-slate-300 font-mono"
          >
            <div className="flex justify-between items-center text-white font-bold font-sans">
              <span>Supported Input Formats:</span>
              <button onClick={() => setShowFormatHelp(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-purple-400 font-bold block mb-1">Standard (5 Columns):</span>
                <code>28.44, 0.22, 230, 1000, 1 1 1</code>
                <p className="text-[9px] text-slate-500 mt-1 font-sans">2θ, FWHM, Area, I_max, Miller (h k l)</p>
              </div>
              <div className="bg-[#050A14] p-2.5 rounded-xl border border-white/5">
                <span className="text-purple-400 font-bold block mb-1">Minimal (3 Columns):</span>
                <code>28.44, 230, 1000</code>
                <p className="text-[9px] text-slate-500 mt-1 font-sans">2θ, Area, I_max (auto-computes FWHM)</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEW: Interactive Table Grid vs Raw Text Editor */}
      {viewMode === 'table' ? (
        <div className="space-y-2">
          {parsedPeaks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#050A14] border border-dashed border-white/10 space-y-3">
              <AlertCircle className="w-8 h-8 text-purple-400/60 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No reflections loaded in dataset</p>
              <p className="text-xs text-slate-500 font-mono">
                Click &quot;Add Peak&quot;, upload a CSV, or choose a standard material preset above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#050A14]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider bg-[#070D18]">
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">2θ (°)</th>
                    <th className="py-2.5 px-3">FWHM (°)</th>
                    <th className="py-2.5 px-3">Area (cts·°)</th>
                    <th className="py-2.5 px-3">I_max</th>
                    <th className="py-2.5 px-3">β_Obs (°)</th>
                    <th className="py-2.5 px-3">Shape φ</th>
                    <th className="py-2.5 px-3">h k l</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {parsedPeaks.map((peak, idx) => {
                    const betaObs = peak.area / peak.iMax;
                    const phi = peak.fwhm / betaObs;
                    
                    let shapeBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                    let shapeLabel = 'Voigt';
                    if (phi <= 0.67) {
                      shapeBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                      shapeLabel = 'Cauchy';
                    } else if (phi >= 0.88) {
                      shapeBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                      shapeLabel = 'Gauss';
                    }

                    const matchingResult = results[idx];

                    return (
                      <tr key={idx} className="hover:bg-purple-500/10 transition-colors group">
                        {/* Index */}
                        <td className="py-2.5 px-3 text-slate-500 font-bold">
                          {idx + 1}
                        </td>

                        {/* 2Theta */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            value={peak.twoTheta}
                            onChange={(e) => handleUpdateRow(idx, 'twoTheta', e.target.value)}
                            className="w-20 px-2 py-1 bg-[#0A101C] text-white font-bold border border-transparent hover:border-white/10 focus:border-purple-500/50 rounded-lg outline-none"
                          />
                        </td>

                        {/* FWHM */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="0.005"
                            value={peak.fwhm}
                            onChange={(e) => handleUpdateRow(idx, 'fwhm', e.target.value)}
                            className="w-18 px-2 py-1 bg-[#0A101C] text-slate-300 border border-transparent hover:border-white/10 focus:border-purple-500/50 rounded-lg outline-none"
                          />
                        </td>

                        {/* Area */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="1"
                            value={peak.area}
                            onChange={(e) => handleUpdateRow(idx, 'area', e.target.value)}
                            className="w-20 px-2 py-1 bg-[#0A101C] text-slate-300 border border-transparent hover:border-white/10 focus:border-purple-500/50 rounded-lg outline-none"
                          />
                        </td>

                        {/* Imax */}
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="1"
                            value={peak.iMax}
                            onChange={(e) => handleUpdateRow(idx, 'iMax', e.target.value)}
                            className="w-20 px-2 py-1 bg-[#0A101C] text-slate-300 border border-transparent hover:border-white/10 focus:border-purple-500/50 rounded-lg outline-none"
                          />
                        </td>

                        {/* Live Calculated Beta_Obs */}
                        <td className="py-2.5 px-3 font-bold text-amber-300">
                          {betaObs.toFixed(3)}°
                        </td>

                        {/* Live Shape Factor Phi */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{phi.toFixed(2)}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${shapeBadge}`}>
                              {shapeLabel}
                            </span>
                          </div>
                        </td>

                        {/* HKL */}
                        <td className="py-2.5 px-2">
                          <div className="flex gap-1 w-24">
                            <input
                              type="number"
                              placeholder="h"
                              value={peak.hkl ? peak.hkl[0] : ''}
                              onChange={(e) => handleUpdateRow(idx, 'h', e.target.value)}
                              className="w-7 px-1 py-1 bg-[#0A101C] text-purple-300 text-center rounded border border-transparent hover:border-white/10 focus:border-purple-500/50 outline-none text-xs"
                            />
                            <input
                              type="number"
                              placeholder="k"
                              value={peak.hkl ? peak.hkl[1] : ''}
                              onChange={(e) => handleUpdateRow(idx, 'k', e.target.value)}
                              className="w-7 px-1 py-1 bg-[#0A101C] text-purple-300 text-center rounded border border-transparent hover:border-white/10 focus:border-purple-500/50 outline-none text-xs"
                            />
                            <input
                              type="number"
                              placeholder="l"
                              value={peak.hkl ? peak.hkl[2] : ''}
                              onChange={(e) => handleUpdateRow(idx, 'l', e.target.value)}
                              className="w-7 px-1 py-1 bg-[#0A101C] text-purple-300 text-center rounded border border-transparent hover:border-white/10 focus:border-purple-500/50 outline-none text-xs"
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {matchingResult && (
                              <button
                                type="button"
                                onClick={() => setSelectedInspectPeak({ result: matchingResult, index: idx })}
                                className="p-1 rounded-lg hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                                title="Inspect detailed single-line Voigt derivation"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(idx)}
                              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Duplicate reflection row"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete reflection"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* RAW CSV / TSV TEXT EDITOR */
        <div className="space-y-2">
          <div className="relative">
            <textarea
              value={inputData}
              onChange={(e) => onInputChange(e.target.value)}
              rows={7}
              className="w-full px-3 py-2.5 bg-[#050A14] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-2xl focus:ring-1 focus:ring-purple-500/20 outline-none font-mono text-xs leading-relaxed"
              placeholder="28.44, 0.22, 230, 1000, 1 1 1"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAutoCleanDelimiters}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Auto-Clean Delimiters
            </button>

            <span className="text-[10px] font-mono text-slate-500">
              {validationInfo.validCount} valid reflection{validationInfo.validCount === 1 ? '' : 's'} parsed
            </span>
          </div>

          {/* Syntax Validation Error & Warning Banners */}
          {validationInfo.errors.length > 0 && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Syntax Errors Found:
              </span>
              <ul className="text-[10px] text-red-300 font-mono list-disc list-inside space-y-0.5">
                {validationInfo.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {validationInfo.warnings.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Experimental Shape Warnings:
              </span>
              <ul className="text-[10px] text-amber-300 font-mono list-disc list-inside space-y-0.5">
                {validationInfo.warnings.slice(0, 3).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Synthetic Reflection Generator Modal */}
      <SyntheticReflectionGeneratorModal
        isOpen={showSyntheticModal}
        onClose={() => setShowSyntheticModal(false)}
        wavelength={wavelength}
        onGenerate={(dataString, title, density, youngs) => {
          onInputChange(dataString);
          if (onSelectPreset) {
            onSelectPreset({
              name: title,
              data: dataString,
              wavelength,
              k: constantK,
              density,
              youngsModulusGPa: youngs,
              desc: 'Synthetically generated idealized diffraction profile.',
              icon: '🧪'
            });
          }
        }}
      />

      {/* Detailed Reflection Step-by-Step Inspector Modal */}
      {selectedInspectPeak && (
        <ReflectionInspectionDrawer
          reflection={selectedInspectPeak.result}
          index={selectedInspectPeak.index}
          wavelength={wavelength}
          constantK={constantK}
          materialDensity={materialDensity}
          instFwhm={0.05}
          onClose={() => setSelectedInspectPeak(null)}
        />
      )}
    </div>
  );
};
