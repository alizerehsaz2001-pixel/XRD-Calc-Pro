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
  Layers, 
  BrainCircuit,
  Activity,
  TrendingUp,
  Compass
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
  // Mode state: 'table' (zero-scroll cards) vs 'raw' (CSV text)
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  // Graphic mode: 'pattern' | 'broadening' | 'whLocus'
  const [graphicMode, setGraphicMode] = useState<'pattern' | 'broadening' | 'whLocus'>('whLocus');
  const [selectedPeakIndex, setSelectedPeakIndex] = useState<number>(0);

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

  const safeSelectedIdx = parsedPeaks.length > 0
    ? Math.min(selectedPeakIndex, parsedPeaks.length - 1)
    : 0;

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

  // Calculate live single-peak properties
  const getPeakDerivedProps = (peak: ScherrerInput) => {
    const thetaRad = (peak.twoTheta / 2) * (Math.PI / 180);
    const sinTheta = Math.sin(thetaRad);
    const cosTheta = Math.cos(thetaRad);

    // d-spacing: lambda / (2 * sin(theta))
    const dSpacing = sinTheta > 0 ? wavelength / (2 * sinTheta) : 0;
    const fourSinTheta = 4 * sinTheta;
    
    // Deconvolution of instrumental broadening
    let betaSampleDeg = peak.fwhmObs;
    const effInst = isDecouplingEnabled ? instFwhm : 0;
    if (effInst > 0) {
      if (broadeningModel === 'Lorentzian') {
        betaSampleDeg = Math.max(0.001, peak.fwhmObs - effInst);
      } else if (broadeningModel === 'Pseudo-Voigt') {
        const ratio = Math.min(0.99, effInst / Math.max(effInst + 0.0001, peak.fwhmObs));
        const val = peak.fwhmObs * (1 - 0.5 * ratio - 0.5 * ratio * ratio);
        betaSampleDeg = Math.max(0.001, val);
      } else {
        // Gaussian
        const diffSq = Math.pow(peak.fwhmObs, 2) - Math.pow(effInst, 2);
        betaSampleDeg = diffSq > 0 ? Math.sqrt(diffSq) : 0.001;
      }
    }

    const betaSampleRad = (betaSampleDeg * Math.PI) / 180;
    const betaCosThetaRad = betaSampleRad * cosTheta;
    const betaCosThetaMrad = betaCosThetaRad * 1000;

    // Apparent Scherrer size: D = (K * lambda) / (beta * cos(theta)) [in nm]
    const apparentSizeNm = (betaSampleRad > 0 && cosTheta > 0)
      ? ((constantK * (wavelength * 0.1)) / (betaSampleRad * cosTheta))
      : 0;

    return {
      dSpacing,
      fourSinTheta,
      betaSampleDeg,
      betaCosThetaRad,
      betaCosThetaMrad,
      apparentSizeNm
    };
  };

  // Enriched peaks list + live linear regression preview for the graphic
  const enrichedPeaks = useMemo(() => {
    return parsedPeaks.map((p, idx) => ({
      ...p,
      idx,
      isExcluded: excludedIndices.includes(idx),
      derived: getPeakDerivedProps(p)
    }));
  }, [parsedPeaks, excludedIndices, wavelength, constantK, instFwhm, isDecouplingEnabled, broadeningModel]);

  const whRegressionPreview = useMemo(() => {
    const active = enrichedPeaks.filter(p => !p.isExcluded);
    if (active.length < 2) return null;
    const n = active.length;
    const sumX = active.reduce((s, p) => s + p.derived.fourSinTheta, 0);
    const sumY = active.reduce((s, p) => s + p.derived.betaCosThetaMrad, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;
    let num = 0;
    let den = 0;
    active.forEach(p => {
      const dx = p.derived.fourSinTheta - meanX;
      const dy = p.derived.betaCosThetaMrad - meanY;
      num += dx * dy;
      den += dx * dx;
    });
    const slopeMrad = den > 1e-12 ? num / den : 0; // in mrad
    const interceptMrad = meanY - slopeMrad * meanX;
    // Size from intercept (mrad -> rad)
    const interceptRad = interceptMrad / 1000;
    const sizeNm = interceptRad > 1e-6 ? (constantK * wavelength * 0.1) / interceptRad : 0;
    const strainPercent = (slopeMrad / 1000) * 100;
    return { slopeMrad, interceptMrad, sizeNm, strainPercent };
  }, [enrichedPeaks, constantK, wavelength]);

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

  // Update a single cell in the card
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
    setSelectedPeakIndex(updated.length - 1);

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
    if (selectedPeakIndex >= updated.length) {
      setSelectedPeakIndex(Math.max(0, updated.length - 1));
    }
  };

  // Duplicate row
  const handleDuplicateRow = (index: number) => {
    const target = parsedPeaks[index];
    if (!target) return;
    const duplicated: ScherrerInput = {
      twoTheta: parseFloat((target.twoTheta + 0.5).toFixed(3)),
      fwhmObs: target.fwhmObs,
      hkl: target.hkl ? [...target.hkl] : undefined
    };
    const updated = [...parsedPeaks];
    updated.splice(index + 1, 0, duplicated);
    onInputChange(serializePeaksToText(updated));
    setSelectedPeakIndex(index + 1);
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
        const lines = content.split('\n');
        const cleanLines = lines.filter(line => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return false;
          if (t.toLowerCase().includes('theta') || t.toLowerCase().includes('fwhm') || t.toLowerCase().includes('2th')) return false;
          return true;
        });
        onInputChange(cleanLines.join('\n'));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activePeak = enrichedPeaks[safeSelectedIdx];

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
      <div className="p-3.5 pb-2.5 border-b border-white/5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Reflections Data</span>
                <span className="text-[9px] text-slate-400 font-mono font-normal">(2θ, FWHM, h k l)</span>
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
              <span>Cards</span>
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
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 font-mono tabular-nums text-[9px]">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ● {datasetStats.active}/{datasetStats.total} ACTIVE
              </span>
              <span className="text-slate-400">
                2θ: <strong className="text-cyan-300">{datasetStats.minTT.toFixed(1)}°</strong>–<strong className="text-cyan-300">{datasetStats.maxTT.toFixed(1)}°</strong> (Δ{datasetStats.spread.toFixed(1)}°)
              </span>
            </div>

            {datasetStats.active >= 3 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="w-3 h-3" /> W-H Ready
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1 font-bold" title="Needs at least 3 peaks for robust linear regression">
                <AlertCircle className="w-3 h-3" /> Need ≥3 Peaks
              </span>
            )}
          </div>
        )}
      </div>

      {/* ================= INTERACTIVE SCIENTIFIC GRAPHIC BANNER ================= */}
      {enrichedPeaks.length > 0 && (
        <div className="mx-3.5 bg-[#040811] rounded-xl border border-cyan-500/20 overflow-hidden">
          {/* Graphic Mode Selector Ribbon */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#080F1E] border-b border-white/5">
            <div className="flex items-center gap-1">
              {[
                { id: 'whLocus', label: 'W-H Locus', icon: TrendingUp },
                { id: 'pattern', label: '2θ Pattern', icon: Activity },
                { id: 'broadening', label: 'Size vs Strain', icon: Compass }
              ].map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setGraphicMode(m.id as any)}
                    className={`px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      graphicMode === m.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
            {activePeak && (
              <span className="text-[8px] font-mono tabular-nums text-slate-400">
                #{safeSelectedIdx + 1} <strong className="text-cyan-300">{activePeak.twoTheta.toFixed(2)}°</strong>
                {activePeak.hkl ? ` (${activePeak.hkl.join('')})` : ''}
              </span>
            )}
          </div>

          {/* Graphic Canvas */}
          <div className="p-2 relative">
            {graphicMode === 'whLocus' && (
              <div>
                <svg viewBox="0 0 340 125" className="w-full h-28 overflow-visible">
                  {/* Grid lines */}
                  {[25, 55, 85].map(y => (
                    <line key={y} x1="36" y1={y} x2="326" y2={y} stroke="rgba(148,163,184,0.08)" strokeDasharray="2 2" />
                  ))}
                  {[80, 140, 200, 260, 320].map(x => (
                    <line key={x} x1={x} y1="12" x2={x} y2="100" stroke="rgba(148,163,184,0.08)" strokeDasharray="2 2" />
                  ))}
                  {/* Axes */}
                  <line x1="36" y1="12" x2="36" y2="100" stroke="#334155" strokeWidth="1" />
                  <line x1="36" y1="100" x2="328" y2="100" stroke="#334155" strokeWidth="1" />
                  <text x="182" y="118" textAnchor="middle" fill="#64748b" fontSize="7.5" fontFamily="monospace">
                    X = 4·sin(θ) [Strain Lever Arm]
                  </text>
                  <text x="10" y="56" textAnchor="middle" fill="#64748b" fontSize="7.5" fontFamily="monospace" transform="rotate(-90 10 56)">
                    β·cosθ (mrad)
                  </text>

                  {(() => {
                    const xs = enrichedPeaks.map(p => p.derived.fourSinTheta);
                    const ys = enrichedPeaks.map(p => p.derived.betaCosThetaMrad);
                    const minX = 0;
                    const maxX = Math.max(2.5, ...xs) * 1.08;
                    const minY = 0;
                    const maxY = Math.max(4, ...ys, whRegressionPreview ? whRegressionPreview.interceptMrad * 1.3 : 0) * 1.15;

                    const mapX = (x: number) => 36 + ((x - minX) / Math.max(0.001, maxX - minX)) * 288;
                    const mapY = (y: number) => 100 - Math.min(88, Math.max(0, ((y - minY) / Math.max(0.001, maxY - minY)) * 86));

                    const yIntPx = whRegressionPreview ? mapY(Math.max(0, whRegressionPreview.interceptMrad)) : 80;
                    const yEndVal = whRegressionPreview ? whRegressionPreview.interceptMrad + whRegressionPreview.slopeMrad * maxX : 0;
                    const yEndPx = mapY(yEndVal);

                    return (
                      <>
                        {/* Zero-strain reference horizontal line from intercept */}
                        {whRegressionPreview && whRegressionPreview.interceptMrad > 0 && (
                          <>
                            <line
                              x1="36"
                              y1={yIntPx}
                              x2="324"
                              y2={yIntPx}
                              stroke="#10b981"
                              strokeWidth="1"
                              strokeDasharray="2 3"
                              opacity="0.5"
                            />
                            <circle cx="36" cy={yIntPx} r="3" fill="#10b981" />
                            <text x="41" y={Math.max(18, yIntPx - 4)} fill="#10b981" fontSize="7" fontFamily="monospace" fontWeight="bold">
                              Kλ/D={whRegressionPreview.interceptMrad.toFixed(2)}
                            </text>
                          </>
                        )}

                        {/* Linear Fit Line */}
                        {whRegressionPreview && (
                          <line
                            x1="36"
                            y1={yIntPx}
                            x2="324"
                            y2={yEndPx}
                            stroke="#f43f5e"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                          />
                        )}

                        {/* Points */}
                        {enrichedPeaks.map((p, idx) => {
                          const cx = mapX(p.derived.fourSinTheta);
                          const cy = mapY(p.derived.betaCosThetaMrad);
                          const isSelected = idx === safeSelectedIdx;
                          return (
                            <g
                              key={idx}
                              onClick={() => setSelectedPeakIndex(idx)}
                              className="cursor-pointer"
                            >
                              {isSelected && (
                                <circle cx={cx} cy={cy} r="7" fill="rgba(34,211,238,0.18)" stroke="#22d3ee" strokeWidth="0.8" />
                              )}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isSelected ? 4 : 3}
                                fill={p.isExcluded ? '#64748b' : isSelected ? '#22d3ee' : '#38bdf8'}
                                stroke="#040811"
                                strokeWidth="1"
                              />
                              <text
                                x={cx}
                                y={cy - 6}
                                textAnchor="middle"
                                fill={p.isExcluded ? '#64748b' : isSelected ? '#22d3ee' : '#cbd5e1'}
                                fontSize="6.5"
                                fontFamily="monospace"
                              >
                                {p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
                {whRegressionPreview && (
                  <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5 text-[8px] font-mono tabular-nums">
                    <span className="text-emerald-400">
                      Intercept D: <strong>{whRegressionPreview.sizeNm > 0 && whRegressionPreview.sizeNm < 500 ? `${whRegressionPreview.sizeNm.toFixed(1)} nm` : 'Bulk'}</strong>
                    </span>
                    <span className="text-rose-400">
                      Slope ε: <strong>{whRegressionPreview.strainPercent.toFixed(3)}%</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {graphicMode === 'pattern' && (
              <div>
                <svg viewBox="0 0 340 120" className="w-full h-28 overflow-visible">
                  <line x1="20" y1="98" x2="326" y2="98" stroke="#334155" strokeWidth="1" />
                  {[20, 40, 60, 80, 100].map(deg => {
                    const x = 20 + ((deg - 10) / 90) * 306;
                    return (
                      <g key={deg}>
                        <line x1={x} y1="98" x2={x} y2="102" stroke="#475569" strokeWidth="1" />
                        <text x={x} y="111" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                          {deg}°
                        </text>
                      </g>
                    );
                  })}

                  {enrichedPeaks.map((p, idx) => {
                    const cx = Math.min(324, Math.max(22, 20 + ((p.twoTheta - 10) / 90) * 306));
                    const isSelected = idx === safeSelectedIdx;
                    // Height inversely proportional to FWHM for visual clarity
                    const normH = Math.min(72, Math.max(24, 22 / Math.max(0.12, p.fwhmObs)));
                    const topY = 98 - normH;
                    const halfW = Math.min(18, Math.max(3.5, p.fwhmObs * 14));

                    return (
                      <g
                        key={idx}
                        onClick={() => setSelectedPeakIndex(idx)}
                        className="cursor-pointer"
                        opacity={p.isExcluded ? 0.35 : 1}
                      >
                        <path
                          d={`M ${cx - halfW * 2} 98 Q ${cx - halfW * 0.5} ${98 - normH * 0.15}, ${cx} ${topY} Q ${cx + halfW * 0.5} ${98 - normH * 0.15}, ${cx + halfW * 2} 98`}
                          fill={isSelected ? 'rgba(34,211,238,0.22)' : 'rgba(16,185,129,0.12)'}
                          stroke={isSelected ? '#22d3ee' : '#10b981'}
                          strokeWidth={isSelected ? '1.5' : '1'}
                        />
                        <line x1={cx} y1="98" x2={cx} y2={topY} stroke={isSelected ? '#22d3ee' : '#10b981'} strokeWidth="1" strokeDasharray="2 2" />
                        <text
                          x={cx}
                          y={topY - 4}
                          textAnchor="middle"
                          fill={isSelected ? '#22d3ee' : '#94a3b8'}
                          fontSize="6.5"
                          fontFamily="monospace"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                        >
                          {p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(1)}°`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {activePeak && (
                  <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5 text-[8px] font-mono tabular-nums text-slate-400">
                    <span>d = <strong className="text-cyan-300">{activePeak.derived.dSpacing.toFixed(3)} Å</strong></span>
                    <span>β_sample = <strong className="text-emerald-300">{activePeak.derived.betaSampleDeg.toFixed(3)}°</strong></span>
                    <span>D_app = <strong className="text-amber-300">{activePeak.derived.apparentSizeNm.toFixed(1)} nm</strong></span>
                  </div>
                )}
              </div>
            )}

            {graphicMode === 'broadening' && activePeak && (
              <div>
                <svg viewBox="0 0 340 118" className="w-full h-28 overflow-visible">
                  <line x1="20" y1="96" x2="320" y2="96" stroke="#334155" strokeWidth="1" />
                  {/* Observed Broadening Outer Profile */}
                  <path
                    d="M 45 96 C 105 96, 130 18, 170 18 C 210 18, 235 96, 295 96"
                    fill="rgba(34,211,238,0.08)"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                  />
                  {/* Sample Broadening (Deconvoluted) */}
                  <path
                    d="M 70 96 C 118 96, 140 28, 170 28 C 200 28, 222 96, 270 96"
                    fill="rgba(16,185,129,0.14)"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                  {/* Instrumental IRF */}
                  {isDecouplingEnabled && instFwhm > 0 && (
                    <path
                      d="M 122 96 C 148 96, 158 46, 170 46 C 182 46, 192 96, 218 96"
                      fill="rgba(245,158,11,0.15)"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                    />
                  )}
                  {/* FWHM dimension lines */}
                  <line x1="115" y1="57" x2="225" y2="57" stroke="#22d3ee" strokeWidth="1" />
                  <text x="170" y="13" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                    Peak #{safeSelectedIdx + 1} ({activePeak.twoTheta.toFixed(2)}°): β_obs = {activePeak.fwhmObs.toFixed(3)}° → β_sample = {activePeak.derived.betaSampleDeg.toFixed(3)}°
                  </text>
                  <text x="48" y="42" fill="#22d3ee" fontSize="7" fontFamily="monospace">● β_obs</text>
                  <text x="48" y="54" fill="#10b981" fontSize="7" fontFamily="monospace">● β_sample (Size+Strain)</text>
                  <text x="48" y="66" fill="#f59e0b" fontSize="7" fontFamily="monospace">● β_inst ({isDecouplingEnabled ? `${instFwhm}°` : 'Off'})</text>
                </svg>
                <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5 text-[8px] font-mono tabular-nums text-slate-400">
                  <span>4·sinθ = <strong className="text-cyan-300">{activePeak.derived.fourSinTheta.toFixed(4)}</strong></span>
                  <span>β·cosθ = <strong className="text-emerald-300">{activePeak.derived.betaCosThetaMrad.toFixed(3)} mrad</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="px-3.5 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus className="w-3 h-3" />
            <span>Add Peak</span>
          </button>

          <button
            type="button"
            onClick={handleSortAscending}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Sort peaks in ascending 2θ order"
          >
            <ArrowUpDown className="w-3 h-3 text-cyan-400" />
            <span>Sort 2θ</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHKLModal(true)}
            className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
            title="Algorithmic HKL plane indexing assist"
          >
            <BrainCircuit className="w-3 h-3 text-purple-400" />
            <span>Index (hkl)</span>
          </button>

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
                  className="w-full px-2 py-1.5 bg-[#070D18] text-white border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-emerald-500"
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
                  className="w-full px-2 py-1.5 bg-[#070D18] text-white border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">h</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newH}
                  onChange={(e) => setNewH(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-purple-300 border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">k</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newK}
                  onChange={(e) => setNewK(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-purple-300 border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[8px] font-mono text-slate-400 mb-0.5">l</label>
                <input
                  type="number"
                  placeholder="1"
                  value={newL}
                  onChange={(e) => setNewL(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#070D18] text-purple-300 border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-purple-500"
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

      {/* Main View: Zero-Scroll Reflection Cards vs Raw CSV Text */}
      <div className="px-3.5 pb-3.5">
        {viewMode === 'table' ? (
          <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
            {enrichedPeaks.map((peak, idx) => {
              const isExcluded = peak.isExcluded;
              const isSelected = idx === safeSelectedIdx;
              const currentHkl = peak.hkl || [1, 1, 1];

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPeakIndex(idx)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isExcluded
                      ? 'opacity-45 bg-rose-950/10 border-rose-500/20'
                      : isSelected
                      ? 'bg-[#0C1628] border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.08)]'
                      : 'bg-[#0A101C] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Card Top Telemetry Ribbon */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/5 font-mono tabular-nums text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExcludePeak(idx);
                        }}
                        className={`px-1.5 py-0.5 rounded font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                          isExcluded
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                        title={isExcluded ? 'Click to include in Williamson-Hall regression' : 'Click to exclude outlier'}
                      >
                        {isExcluded ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                        <span>#{idx + 1}</span>
                      </button>

                      <span className="text-purple-300 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        ({currentHkl.join('')})
                      </span>

                      <span className="text-slate-400">
                        d=<strong className="text-slate-200">{peak.derived.dSpacing > 0 ? `${peak.derived.dSpacing.toFixed(3)}Å` : '-'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-bold" title="Apparent single-peak Scherrer size">
                        D={peak.derived.apparentSizeNm > 0 ? `${peak.derived.apparentSizeNm.toFixed(1)}nm` : '-'}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateRow(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-cyan-300 rounded transition-colors cursor-pointer"
                          title="Duplicate reflection"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete reflection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Inputs Row (Zero Horizontal Scroll) */}
                  <div className="grid grid-cols-12 gap-2 items-center font-mono tabular-nums">
                    {/* 2Theta Input (4 cols) */}
                    <div className="col-span-4">
                      <label className="block text-[7px] uppercase tracking-wider text-slate-400 mb-0.5">
                        2θ Angle (°)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={peak.twoTheta}
                        onChange={(e) => handleUpdateCell(idx, 'twoTheta', e.target.value)}
                        className="w-full px-2 py-1 bg-[#060B14] text-cyan-300 border border-white/10 rounded-lg font-bold font-mono tabular-nums text-[10px] outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* FWHM Input (4 cols) */}
                    <div className="col-span-4">
                      <label className="block text-[7px] uppercase tracking-wider text-slate-400 mb-0.5">
                        FWHM β_obs (°)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={peak.fwhmObs}
                        onChange={(e) => handleUpdateCell(idx, 'fwhmObs', e.target.value)}
                        className="w-full px-2 py-1 bg-[#060B14] text-emerald-300 border border-white/10 rounded-lg font-bold font-mono tabular-nums text-[10px] outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Miller Indices h k l (4 cols) */}
                    <div className="col-span-4">
                      <label className="block text-[7px] uppercase tracking-wider text-slate-400 mb-0.5 text-center">
                        Miller (h k l)
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-[#060B14] p-0.5 rounded-lg border border-white/10">
                        <input
                          type="number"
                          value={currentHkl[0]}
                          onChange={(e) => handleUpdateCell(idx, 'h', e.target.value)}
                          className="w-full py-0.5 text-center bg-transparent text-purple-300 font-bold font-mono tabular-nums text-[10px] outline-none focus:bg-purple-500/10 rounded"
                          placeholder="h"
                        />
                        <input
                          type="number"
                          value={currentHkl[1]}
                          onChange={(e) => handleUpdateCell(idx, 'k', e.target.value)}
                          className="w-full py-0.5 text-center bg-transparent text-purple-300 font-bold font-mono tabular-nums text-[10px] outline-none focus:bg-purple-500/10 rounded"
                          placeholder="k"
                        />
                        <input
                          type="number"
                          value={currentHkl[2]}
                          onChange={(e) => handleUpdateCell(idx, 'l', e.target.value)}
                          className="w-full py-0.5 text-center bg-transparent text-purple-300 font-bold font-mono tabular-nums text-[10px] outline-none focus:bg-purple-500/10 rounded"
                          placeholder="l"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={inputData}
              onChange={(e) => onInputChange(e.target.value)}
              className="w-full h-40 px-3 py-2 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/60 rounded-xl outline-none font-mono tabular-nums text-xs leading-relaxed custom-scrollbar"
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
