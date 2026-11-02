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
  Zap, 
  BrainCircuit,
  Info,
  Calculator,
  ChevronDown,
  Atom,
  BarChart2,
  Activity,
  Maximize2,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IBAdvancedInput, IBAdvancedResult } from '../../types';
import { parseIBAdvancedInput } from '../../utils/physics';
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
  // Graphic mode: 'spectrum' (Diffraction Pattern Stick & Profile Map), 'broadening' (Deconvolved Beta Bar/Curve), 'geometry' (Single Peak Area/I_max Equivalent Rectangle)
  const [graphicMode, setGraphicMode] = useState<'spectrum' | 'broadening' | 'geometry'>('spectrum');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);

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

  // Ensure selectedPeakIdx stays in bounds
  const activeSelectedIdx = useMemo(() => {
    if (parsedPeaks.length === 0) return 0;
    return Math.min(selectedPeakIdx, parsedPeaks.length - 1);
  }, [parsedPeaks.length, selectedPeakIdx]);

  // Derived physical metrics per peak for graphics & table
  const enrichedPeaks = useMemo(() => {
    if (parsedPeaks.length === 0) return [];
    const maxI = Math.max(...parsedPeaks.map(p => p.iMax), 1);
    const maxArea = Math.max(...parsedPeaks.map(p => p.area), 1);

    return parsedPeaks.map((peak, idx) => {
      const isExcluded = excludedIndices.includes(idx);
      const betaObs = peak.iMax > 0 ? peak.area / peak.iMax : 0;
      const thetaRad = (peak.twoTheta / 2) * (Math.PI / 180);
      const sinTheta = Math.sin(thetaRad);
      const cosTheta = Math.cos(thetaRad);
      const dSpacing = sinTheta > 1e-6 ? wavelength / (2 * sinTheta) : 0;

      // Instrumental breadth at this 2theta
      let betaInstDeg = instBetaIB;
      if (instrumentalMode === 'caglioti') {
        const tanTheta = Math.tan(thetaRad);
        const fwhmSq = cagliotiParams.U * tanTheta * tanTheta + cagliotiParams.V * tanTheta + cagliotiParams.W;
        const fwhmInst = Math.sqrt(Math.max(1e-6, fwhmSq));
        betaInstDeg = fwhmInst * 1.064467; // Gaussian integral breadth conversion
      }

      // Sample deconvolved breadth
      let betaSampleDeg = betaObs;
      if (decouplingMethod === 'squared') {
        betaSampleDeg = Math.sqrt(Math.max(0, betaObs * betaObs - betaInstDeg * betaInstDeg));
      } else if (decouplingMethod === 'hw_voigt') {
        if (betaObs > betaInstDeg) {
          betaSampleDeg = betaObs - (betaInstDeg * betaInstDeg) / Math.max(1e-6, betaObs);
        } else {
          betaSampleDeg = 0;
        }
      } else if (decouplingMethod === 'linear') {
        betaSampleDeg = Math.max(0, betaObs - betaInstDeg);
      }

      const apparentSizeNm = (betaSampleDeg > 1e-5 && cosTheta > 1e-5)
        ? (constantK * wavelength) / ((betaSampleDeg * Math.PI / 180) * cosTheta) / 10
        : 0;

      const fwhmEst = peak.fwhm && peak.fwhm > 0 ? peak.fwhm : betaObs * 0.78;
      const shapePhi = betaObs > 0 ? fwhmEst / betaObs : 0.78;

      const hklVal = peak.hkl || [1, 1, 1];
      const hklLabel = `(${hklVal[0]}${hklVal[1]}${hklVal[2]})`;

      return {
        ...peak,
        idx,
        isExcluded,
        betaObs,
        betaInstDeg: Math.min(betaObs, betaInstDeg),
        betaSampleDeg,
        dSpacing,
        apparentSizeNm,
        fwhmEst,
        shapePhi,
        hklVal,
        hklLabel,
        relIntensity: (peak.iMax / maxI) * 100,
        relArea: (peak.area / maxArea) * 100
      };
    });
  }, [parsedPeaks, excludedIndices, wavelength, constantK, instBetaIB, instrumentalMode, cagliotiParams, decouplingMethod]);

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

      let area = parts[1];
      let imax = parts[2];
      if (parts.length === 4 || parts.length >= 7) {
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
    if (enrichedPeaks.length === 0) return null;
    const ttList = enrichedPeaks.map(p => p.twoTheta);
    const minTT = Math.min(...ttList);
    const maxTT = Math.max(...ttList);
    const spread = maxTT - minTT;
    const avgBeta = enrichedPeaks.reduce((sum, p) => sum + p.betaObs, 0) / enrichedPeaks.length;
    const avgSampleBeta = enrichedPeaks.reduce((sum, p) => sum + p.betaSampleDeg, 0) / enrichedPeaks.length;
    const activeCount = enrichedPeaks.filter(p => !p.isExcluded).length;

    return {
      total: enrichedPeaks.length,
      active: activeCount,
      excluded: excludedIndices.length,
      minTT,
      maxTT,
      spread,
      avgBeta,
      avgSampleBeta
    };
  }, [enrichedPeaks, excludedIndices]);

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
      twoTheta: parseFloat((peak.twoTheta + 0.5).toFixed(2)),
      hkl: peak.hkl ? [...peak.hkl] : undefined
    };
    const updated = [...parsedPeaks.slice(0, index + 1), duplicated, ...parsedPeaks.slice(index + 1)];
    onInputChange(serializePeaks(updated));
  };

  const handleSortAscending = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onInputChange(serializePeaks(sorted));
  };

  const handleNormalizeIntensities = () => {
    if (parsedPeaks.length === 0) return;
    const maxI = Math.max(...parsedPeaks.map(p => p.iMax));
    if (maxI <= 0) return;
    const scale = 1000 / maxI;
    const normalized = parsedPeaks.map(p => ({
      ...p,
      area: parseFloat((p.area * scale).toFixed(1)),
      iMax: Math.round(p.iMax * scale)
    }));
    onInputChange(serializePeaks(normalized));
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

    setNewTwoTheta('');
    setNewArea('');
    setNewImax('1000');
    setNewH('');
    setNewK('');
    setNewL('');
    setIsAddFormOpen(false);
    setSelectedPeakIdx(updated.length - 1);
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(inputData);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = '2Theta_deg,Area,Imax,Observed_Beta_deg,Sample_Beta_deg,d_Angstrom,h,k,l\n';
    enrichedPeaks.forEach(p => {
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      csv += `${p.twoTheta.toFixed(2)},${p.area.toFixed(1)},${p.iMax.toFixed(0)},${p.betaObs.toFixed(4)},${p.betaSampleDeg.toFixed(4)},${p.dSpacing.toFixed(4)},${h},${k},${l}\n`;
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

  const handleAutoClean = () => {
    const cleaned = serializePeaks(parsedPeaks);
    onInputChange(cleaned);
  };

  // Active peak for geometric inspector
  const activeInspectPeak = enrichedPeaks[hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx] || enrichedPeaks[0];

  return (
    <div className="bg-[#070D18] rounded-2xl border border-white/10 hover:border-pink-500/30 transition-all shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-pink-950/25 via-purple-950/15 to-[#070D18]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/40 rounded-xl text-pink-400 shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Reflections Data (2θ, Area, I_max [, h k l])
              </h3>
              <span className="text-[9px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {parsedPeaks.length} Peaks
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
              β_obs = Area / I_max • Equivalent Rectangular Breadth &amp; Miller Planes
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Table vs Raw Text) */}
        <div className="flex items-center gap-1 bg-[#050A14] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3 h-3" />
            Interactive
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3 h-3" />
            Raw Matrix
          </button>
        </div>
      </div>

      {/* INTERACTIVE SCIENTIFIC GRAPHIC CANVAS */}
      {enrichedPeaks.length > 0 && (
        <div className="bg-[#040811] border-b border-white/5 p-3 space-y-2.5">
          {/* Graphic Mode Selector Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-[#091122] p-0.5 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setGraphicMode('spectrum')}
                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  graphicMode === 'spectrum'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Activity className="w-2.5 h-2.5" />
                XRD Stick Spectrum
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('broadening')}
                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  graphicMode === 'broadening'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <BarChart2 className="w-2.5 h-2.5" />
                β Deconvolution
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('geometry')}
                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  graphicMode === 'geometry'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Target className="w-2.5 h-2.5" />
                β = Area/I_max Geometry
              </button>
            </div>

            {activeInspectPeak && (
              <div className="flex items-center gap-2 text-[9px] font-mono tabular-nums">
                <span className="text-slate-500">Selected:</span>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                  #{activeInspectPeak.idx + 1} {activeInspectPeak.hklLabel}
                </span>
                <span className="text-pink-300 font-bold">{activeInspectPeak.twoTheta.toFixed(2)}°</span>
                <span className="text-amber-300 font-bold">β={activeInspectPeak.betaObs.toFixed(3)}°</span>
              </div>
            )}
          </div>

          {/* SVG Graphic Viewport */}
          <div className="relative bg-[#060B16] rounded-xl border border-white/5 p-2 overflow-hidden">
            {graphicMode === 'spectrum' && (() => {
              const svgW = 480;
              const svgH = 148;
              const padL = 32;
              const padR = 18;
              const padT = 24;
              const padB = 26;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;

              const min2T = Math.max(5, Math.floor((datasetStats?.minTT || 20) - 8));
              const max2T = Math.min(165, Math.ceil((datasetStats?.maxTT || 90) + 8));
              const span2T = Math.max(10, max2T - min2T);

              const xOf = (tt: number) => padL + ((tt - min2T) / span2T) * plotW;
              const yOf = (relI: number) => padT + plotH - (Math.min(100, Math.max(0, relI)) / 100) * plotH;

              // Generate continuous synthesized XRD profile curve across plotW
              const numSamples = 180;
              const profilePts: string[] = [];
              const fillPts: string[] = [`${padL},${padT + plotH}`];
              for (let i = 0; i <= numSamples; i++) {
                const tt = min2T + (i / numSamples) * span2T;
                let intensity = 0;
                enrichedPeaks.forEach(p => {
                  if (p.isExcluded) return;
                  // Visual width exaggerated slightly so narrow peaks are visible as bell curves
                  const visSigma = Math.max(0.45, p.betaObs * 1.4);
                  const dx = (tt - p.twoTheta) / visSigma;
                  if (Math.abs(dx) < 6) {
                    // Pseudo-Voigt bell
                    const gauss = Math.exp(-dx * dx);
                    const cauchy = 1 / (1 + dx * dx * 1.5);
                    intensity += p.relIntensity * (0.5 * gauss + 0.5 * cauchy);
                  }
                });
                const px = padL + (i / numSamples) * plotW;
                const py = yOf(Math.min(100, intensity));
                profilePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                fillPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }
              fillPts.push(`${padL + plotW},${padT + plotH}`);

              // Generate 5 angular ticks
              const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => min2T + f * span2T);

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-36 select-none overflow-visible">
                  <defs>
                    <linearGradient id="ibSpectrumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="ibRectGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal reference grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((g, idx) => {
                    const gy = padT + plotH * (1 - g);
                    return (
                      <g key={idx}>
                        <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
                        <text x={padL - 5} y={gy + 3} textAnchor="end" className="fill-slate-600 font-mono text-[7px]">
                          {Math.round(g * 100)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis baseline */}
                  <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

                  {/* X-axis 2theta ticks */}
                  {ticks.map((t, i) => {
                    const tx = xOf(t);
                    return (
                      <g key={i}>
                        <line x1={tx} y1={padT + plotH} x2={tx} y2={padT + plotH + 4} stroke="rgba(255,255,255,0.25)" />
                        <text x={tx} y={svgH - 6} textAnchor="middle" className="fill-slate-400 font-mono text-[8px]">
                          {t.toFixed(0)}°
                        </text>
                      </g>
                    );
                  })}
                  <text x={padL + plotW} y={svgH - 6} textAnchor="end" className="fill-pink-400/80 font-mono font-bold text-[7px]">
                    2θ (deg)
                  </text>

                  {/* Synthesized XRD Envelope Area & Curve */}
                  <polygon points={fillPts.join(' ')} fill="url(#ibSpectrumGrad)" />
                  <polyline
                    fill="none"
                    stroke="#f472b6"
                    strokeWidth="1.25"
                    strokeOpacity="0.7"
                    points={profilePts.join(' ')}
                  />

                  {/* Reflection Sticks, Equivalent Beta Rectangles & HKL Labels */}
                  {enrichedPeaks.map((p) => {
                    const cx = xOf(p.twoTheta);
                    const topY = yOf(p.relIntensity);
                    const baseY = padT + plotH;
                    const isSelected = p.idx === (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
                    // Equivalent breadth rectangle visual width (scaled so beta is clearly legible)
                    const rectHalfW = Math.max(3, (p.betaObs / span2T) * plotW * 4.5);

                    return (
                      <g
                        key={p.idx}
                        className="cursor-pointer"
                        onClick={() => setSelectedPeakIdx(p.idx)}
                        onMouseEnter={() => setHoveredPeakIdx(p.idx)}
                        onMouseLeave={() => setHoveredPeakIdx(null)}
                      >
                        {/* Equivalent Integral Breadth Box (Area / I_max) */}
                        {!p.isExcluded && (
                          <rect
                            x={cx - rectHalfW}
                            y={topY}
                            width={rectHalfW * 2}
                            height={baseY - topY}
                            fill={isSelected ? 'url(#ibRectGrad)' : 'rgba(244,114,182,0.08)'}
                            stroke={isSelected ? '#22d3ee' : 'rgba(244,114,182,0.3)'}
                            strokeWidth={isSelected ? 1 : 0.6}
                            strokeDasharray={isSelected ? 'none' : '2 1'}
                            rx={1.5}
                          />
                        )}

                        {/* Main Bragg Stick */}
                        <line
                          x1={cx}
                          y1={baseY}
                          x2={cx}
                          y2={topY}
                          stroke={p.isExcluded ? '#ef4444' : isSelected ? '#22d3ee' : '#f472b6'}
                          strokeWidth={isSelected ? 2.2 : 1.5}
                          strokeDasharray={p.isExcluded ? '2 2' : 'none'}
                          opacity={p.isExcluded ? 0.45 : 1}
                        />

                        {/* Peak Apex Dot */}
                        <circle
                          cx={cx}
                          cy={topY}
                          r={isSelected ? 3.5 : 2.3}
                          fill={p.isExcluded ? '#ef4444' : isSelected ? '#22d3ee' : '#f472b6'}
                          stroke="#050A14"
                          strokeWidth="1"
                        />

                        {/* Miller Index & Beta Tag */}
                        <text
                          x={cx}
                          y={Math.max(10, topY - 6)}
                          textAnchor="middle"
                          className={`font-mono text-[8px] font-bold transition-all ${
                            p.isExcluded
                              ? 'fill-red-400/60 line-through'
                              : isSelected
                              ? 'fill-cyan-300'
                              : 'fill-purple-300/90'
                          }`}
                        >
                          {p.hklLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}

            {graphicMode === 'broadening' && (() => {
              const svgW = 480;
              const svgH = 148;
              const padL = 36;
              const padR = 16;
              const padT = 22;
              const padB = 26;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;

              const maxBeta = Math.max(...enrichedPeaks.map(p => p.betaObs), 0.1) * 1.18;
              const colW = plotW / Math.max(1, enrichedPeaks.length);
              const barW = Math.min(28, Math.max(10, colW * 0.52));

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-36 select-none overflow-visible">
                  {/* Horizontal beta gridlines */}
                  {[0.25, 0.5, 0.75, 1].map((g, i) => {
                    const gy = padT + plotH * (1 - g);
                    const val = maxBeta * g;
                    return (
                      <g key={i}>
                        <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 3" />
                        <text x={padL - 5} y={gy + 3} textAnchor="end" className="fill-slate-500 font-mono text-[7px]">
                          {val.toFixed(2)}°
                        </text>
                      </g>
                    );
                  })}

                  <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="rgba(255,255,255,0.18)" />

                  {/* Stacked Deconvolution Bars: Instrumental (Amber) + Structural Sample (Pink/Cyan) */}
                  {enrichedPeaks.map((p, idx) => {
                    const cx = padL + (idx + 0.5) * colW;
                    const baseY = padT + plotH;
                    const totalH = (p.betaObs / maxBeta) * plotH;
                    const instH = (p.betaInstDeg / maxBeta) * plotH;
                    const sampH = Math.max(0, totalH - instH);
                    const isSelected = p.idx === (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);

                    return (
                      <g
                        key={p.idx}
                        className="cursor-pointer"
                        onClick={() => setSelectedPeakIdx(p.idx)}
                        onMouseEnter={() => setHoveredPeakIdx(p.idx)}
                        onMouseLeave={() => setHoveredPeakIdx(null)}
                        opacity={p.isExcluded ? 0.35 : 1}
                      >
                        {/* Sample Structural Breadth (Top portion) */}
                        <rect
                          x={cx - barW / 2}
                          y={baseY - totalH}
                          width={barW}
                          height={sampH}
                          fill={isSelected ? '#22d3ee' : '#ec4899'}
                          fillOpacity={0.75}
                          stroke={isSelected ? '#67e8f9' : '#f472b6'}
                          strokeWidth={isSelected ? 1.2 : 0.6}
                          rx={2}
                        />
                        {/* Instrumental Breadth (Bottom foundation) */}
                        <rect
                          x={cx - barW / 2}
                          y={baseY - instH}
                          width={barW}
                          height={instH}
                          fill="#f59e0b"
                          fillOpacity={0.75}
                          rx={1}
                        />
                        {/* Value label above bar */}
                        <text
                          x={cx}
                          y={Math.max(10, baseY - totalH - 5)}
                          textAnchor="middle"
                          className={`font-mono text-[7.5px] font-bold ${isSelected ? 'fill-cyan-300' : 'fill-pink-300'}`}
                        >
                          {p.betaObs.toFixed(3)}°
                        </text>
                        {/* X-axis label */}
                        <text x={cx} y={svgH - 12} textAnchor="middle" className="fill-slate-300 font-mono text-[8px] font-bold">
                          {p.hklLabel}
                        </text>
                        <text x={cx} y={svgH - 3} textAnchor="middle" className="fill-slate-500 font-mono text-[7px]">
                          {p.twoTheta.toFixed(1)}°
                        </text>
                      </g>
                    );
                  })}

                  {/* Mini Legend */}
                  <g transform={`translate(${padL + 6}, 10)`}>
                    <rect x="0" y="-6" width="7" height="7" rx="1.5" fill="#ec4899" />
                    <text x="10" y="0" className="fill-slate-300 font-mono text-[7.5px]">β_sample (Size+Strain)</text>
                    <rect x="115" y="-6" width="7" height="7" rx="1.5" fill="#f59e0b" />
                    <text x="125" y="0" className="fill-slate-300 font-mono text-[7.5px]">β_inst (Instrument)</text>
                  </g>
                </svg>
              );
            })()}

            {graphicMode === 'geometry' && activeInspectPeak && (() => {
              const svgW = 480;
              const svgH = 148;
              const padL = 32;
              const padR = 165; // Right side reserved for live geometric formula readout
              const padT = 22;
              const padB = 24;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;
              const cx = padL + plotW / 2;
              const baseY = padT + plotH;
              const peakTopY = padT + 8;
              const peakH = baseY - peakTopY;

              // Equivalent rectangle width in pixels (fixed proportional representation)
              const eqRectW = plotW * 0.44;
              const fwhmW = eqRectW * Math.min(1.05, Math.max(0.55, activeInspectPeak.shapePhi));

              // Generate bell curve around cx with integral breadth matching eqRectW
              const curvePts: string[] = [];
              const fillPts: string[] = [`${padL},${baseY}`];
              const steps = 90;
              for (let i = 0; i <= steps; i++) {
                const normX = (i / steps) - 0.5; // -0.5 to 0.5
                const px = padL + (i / steps) * plotW;
                const u = (normX * plotW) / (eqRectW / 2);
                const g = Math.exp(-0.785 * u * u);
                const c = 1 / (1 + 0.65 * u * u);
                const yVal = 0.55 * g + 0.45 * c;
                const py = baseY - yVal * peakH;
                curvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                fillPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }
              fillPts.push(`${padL + plotW},${baseY}`);

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-36 select-none overflow-visible">
                  {/* Baseline */}
                  <line x1={padL} y1={baseY} x2={padL + plotW} y2={baseY} stroke="rgba(255,255,255,0.2)" />

                  {/* Bell Curve Area (= Integrated Area) */}
                  <polygon points={fillPts.join(' ')} fill="rgba(236,72,153,0.18)" />
                  <polyline fill="none" stroke="#f472b6" strokeWidth="1.8" points={curvePts.join(' ')} />

                  {/* Equivalent Integral Breadth Rectangle (Height = I_max, Width = beta_obs = Area / I_max) */}
                  <rect
                    x={cx - eqRectW / 2}
                    y={peakTopY}
                    width={eqRectW}
                    height={peakH}
                    fill="rgba(34,211,238,0.12)"
                    stroke="#22d3ee"
                    strokeWidth="1.3"
                    strokeDasharray="4 2"
                    rx="2"
                  />

                  {/* I_max vertical arrow */}
                  <line x1={cx} y1={baseY} x2={cx} y2={peakTopY} stroke="#a855f7" strokeWidth="1.2" strokeDasharray="2 2" />
                  <circle cx={cx} cy={peakTopY} r="3" fill="#22d3ee" />
                  <text x={cx} y={peakTopY - 5} textAnchor="middle" className="fill-cyan-300 font-mono text-[8px] font-bold">
                    I_max = {activeInspectPeak.iMax.toFixed(0)} cts
                  </text>

                  {/* Beta_obs horizontal dimension line */}
                  <line
                    x1={cx - eqRectW / 2}
                    y1={peakTopY + peakH * 0.32}
                    x2={cx + eqRectW / 2}
                    y2={peakTopY + peakH * 0.32}
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={peakTopY + peakH * 0.32 - 4}
                    textAnchor="middle"
                    className="fill-cyan-200 font-mono text-[8px] font-bold"
                  >
                    β_obs = {activeInspectPeak.betaObs.toFixed(4)}°
                  </text>

                  {/* FWHM horizontal indicator at half height */}
                  <line
                    x1={cx - fwhmW / 2}
                    y1={peakTopY + peakH * 0.5}
                    x2={cx + fwhmW / 2}
                    y2={peakTopY + peakH * 0.5}
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                  />
                  <text
                    x={cx}
                    y={peakTopY + peakH * 0.5 + 9}
                    textAnchor="middle"
                    className="fill-amber-300 font-mono text-[7px] font-bold"
                  >
                    FWHM ≈ {activeInspectPeak.fwhmEst.toFixed(3)}°
                  </text>

                  {/* X-axis 2theta center */}
                  <text x={cx} y={svgH - 6} textAnchor="middle" className="fill-pink-300 font-mono text-[8px] font-bold">
                    2θ = {activeInspectPeak.twoTheta.toFixed(2)}° {activeInspectPeak.hklLabel}
                  </text>

                  {/* Right Panel Telemetry Card inside SVG */}
                  <g transform={`translate(${padL + plotW + 12}, ${padT})`}>
                    <rect x="0" y="0" width="148" height={plotH} rx="6" fill="#091122" stroke="rgba(255,255,255,0.08)" />
                    <text x="8" y="15" className="fill-cyan-300 font-mono text-[8px] font-bold uppercase">
                      Equivalent Box Law
                    </text>
                    <text x="8" y="28" className="fill-slate-400 font-mono text-[7.5px]">
                      Area = {activeInspectPeak.area.toFixed(1)} cts·°
                    </text>
                    <text x="8" y="40" className="fill-slate-400 font-mono text-[7.5px]">
                      I_max = {activeInspectPeak.iMax.toFixed(0)} cts
                    </text>
                    <text x="8" y="54" className="fill-amber-300 font-mono text-[8px] font-bold">
                      β_obs = {activeInspectPeak.betaObs.toFixed(4)}°
                    </text>
                    <text x="8" y="66" className="fill-pink-300 font-mono text-[8px] font-bold">
                      β_samp = {activeInspectPeak.betaSampleDeg.toFixed(4)}°
                    </text>
                    <text x="8" y="78" className="fill-emerald-300 font-mono text-[8px] font-bold">
                      d_hkl = {activeInspectPeak.dSpacing.toFixed(3)} Å
                    </text>
                    <text x="8" y="92" className="fill-purple-300 font-mono text-[8px] font-bold">
                      D_app ≈ {activeInspectPeak.apparentSizeNm > 0 ? `${activeInspectPeak.apparentSizeNm.toFixed(1)} nm` : '—'}
                    </text>
                  </g>
                </svg>
              );
            })()}
          </div>
        </div>
      )}

      {/* Dataset Summary Metrics Banner */}
      {datasetStats && (
        <div className="px-3.5 py-2 bg-[#050A14] border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono tabular-nums">
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-black text-[7.5px] tracking-wider">Active / Total</span>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400 font-bold">{datasetStats.active} / {datasetStats.total}</span>
              {datasetStats.excluded > 0 && (
                <span className="text-amber-400 font-bold text-[8px] bg-amber-500/10 px-1 rounded">
                  -{datasetStats.excluded}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-black text-[7.5px] tracking-wider">2θ Window</span>
            <span className="text-pink-300 font-bold">{datasetStats.minTT.toFixed(1)}°–{datasetStats.maxTT.toFixed(1)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-black text-[7.5px] tracking-wider">Mean β_obs</span>
            <span className="text-amber-300 font-bold">{datasetStats.avgBeta.toFixed(3)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-black text-[7.5px] tracking-wider">Mean β_sample</span>
            <span className="text-cyan-300 font-bold">{datasetStats.avgSampleBeta.toFixed(3)}°</span>
          </div>
        </div>
      )}

      {/* Quick Action Toolbar */}
      <div className="p-2.5 border-b border-white/5 flex flex-wrap items-center justify-between gap-1.5 bg-[#060C18]">
        <div className="flex flex-wrap items-center gap-1">
          {/* Add Peak Button */}
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all cursor-pointer ${
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
            className="px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-300 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 text-pink-400" />
            Sort 2θ
          </button>

          {/* Scale / Normalize I_max to 1000 */}
          <button
            type="button"
            onClick={handleNormalizeIntensities}
            title="Normalize peak intensities so max(I_max) = 1000 while preserving β_obs = Area / I_max"
            className="px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 bg-white/5 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            Norm I_max
          </button>

          {/* Synthetic Peak Generator Modal Button */}
          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className="px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 hover:border-pink-500/70 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            Synthetic
          </button>

          {/* HKL Algorithmic Indexer Modal Button */}
          <button
            type="button"
            onClick={() => setShowHKLModal(true)}
            className="px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 bg-purple-500/15 border border-purple-500/40 text-purple-300 hover:border-purple-500/70 transition-all cursor-pointer"
          >
            <BrainCircuit className="w-3 h-3 text-purple-400" />
            (h k l)
          </button>

          {/* Profile Shape Calculator */}
          <button
            type="button"
            onClick={() => setShowCalcModal(true)}
            className="px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:border-emerald-500/70 transition-all cursor-pointer"
          >
            <Calculator className="w-3 h-3 text-emerald-400" />
            Calc β
          </button>

          {/* Material Presets Selector */}
          {materialPresets.length > 0 && (
            <div className="relative" ref={presetsRef}>
              <button
                type="button"
                onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
                className="px-2 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-300 transition-all cursor-pointer"
              >
                <Atom className="w-3 h-3 text-pink-400" />
                Presets
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
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
                          setSelectedPeakIdx(0);
                        }}
                        className={`w-full text-left p-2 rounded-lg hover:bg-pink-500/10 transition-colors cursor-pointer ${
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
              className="px-1.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
            >
              Reset Excl
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyToClipboard}
            title="Copy reflection data to clipboard"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
          >
            {copiedNotification ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import reflection data from file (CSV, TXT)"
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
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
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            title="Formatting & Integral Breadth Guide"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showFormatHelp ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
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
            className="overflow-hidden bg-[#050A14] border-b border-pink-500/30 p-3.5 text-xs font-mono space-y-2 text-slate-300"
          >
            <div className="flex items-center justify-between text-pink-400 font-black uppercase text-[10px]">
              <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Integral Breadth Data Format Guide</span>
              <button type="button" onClick={() => setShowFormatHelp(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Each diffraction reflection is defined by its Bragg angle <strong className="text-pink-300">2θ</strong> (°), integrated net peak area <strong className="text-emerald-300">Area</strong> (counts·°), peak height <strong className="text-cyan-300">I_max</strong> (counts), and optional Miller indices <strong className="text-purple-300">(h k l)</strong>.
            </p>
            <div className="bg-[#0A101C] p-2.5 rounded-xl border border-white/5 space-y-1 text-[10px]">
              <div className="text-slate-400"><strong className="text-pink-300">Standard:</strong> <span className="text-slate-200">2θ, Area, I_max [, h k l]</span> (e.g. <span className="text-pink-400">28.44, 230, 1000, 1 1 1</span>)</div>
              <div className="text-slate-400"><strong className="text-emerald-300">With FWHM:</strong> <span className="text-slate-200">2θ, FWHM, Area, I_max [, h k l]</span> (e.g. <span className="text-emerald-400">28.44, 0.23, 230, 1000, 1 1 1</span>)</div>
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
            className="overflow-hidden bg-[#050A14] border-b border-pink-500/30 p-3 space-y-2.5"
          >
            <div className="text-[9px] font-black uppercase tracking-widest text-pink-400 flex items-center justify-between">
              <span>Quick Add Reflection</span>
              {parseFloat(newArea) > 0 && parseFloat(newImax) > 0 && (
                <span className="text-cyan-300 font-mono tabular-nums font-bold">
                  β_obs = {(parseFloat(newArea) / parseFloat(newImax)).toFixed(4)}°
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">2θ (deg)*</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="28.44"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0A101C] text-pink-300 border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-pink-500/60"
                />
              </div>

              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Area (cts·°)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="230"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0A101C] text-emerald-300 border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">I_max (cts)*</label>
                <input
                  type="number"
                  step="50"
                  placeholder="1000"
                  value={newImax}
                  onChange={(e) => setNewImax(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0A101C] text-cyan-300 border border-white/10 rounded-lg text-xs font-mono tabular-nums outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase">Miller (h k l):</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="h"
                    value={newH}
                    onChange={(e) => setNewH(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0A101C] text-purple-300 border border-white/10 rounded-md text-xs font-mono tabular-nums text-center outline-none focus:border-purple-500/60"
                  />
                  <input
                    type="number"
                    placeholder="k"
                    value={newK}
                    onChange={(e) => setNewK(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0A101C] text-purple-300 border border-white/10 rounded-md text-xs font-mono tabular-nums text-center outline-none focus:border-purple-500/60"
                  />
                  <input
                    type="number"
                    placeholder="l"
                    value={newL}
                    onChange={(e) => setNewL(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0A101C] text-purple-300 border border-white/10 rounded-md text-xs font-mono tabular-nums text-center outline-none focus:border-purple-500/60"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!newTwoTheta || !newArea || !newImax}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-40 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-pink-500/20 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Append
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Display Area */}
      {viewMode === 'table' ? (
        /* INTERACTIVE REFLECTION CARDS / COMPACT GRID (Fits sidebar without awkward horizontal scrolling) */
        <div className="max-h-[410px] overflow-y-auto custom-scrollbar p-2.5 space-y-2">
          {enrichedPeaks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No reflections loaded. Click <strong className="text-pink-400">&quot;Add Peak&quot;</strong>, <strong className="text-pink-400">&quot;Synthetic&quot;</strong>, or choose a preset to begin.
            </div>
          ) : (
            enrichedPeaks.map((peak) => {
              const isSelected = peak.idx === (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
              const sampleSharePct = peak.betaObs > 0 ? Math.min(100, Math.max(0, (peak.betaSampleDeg / peak.betaObs) * 100)) : 0;

              return (
                <div
                  key={peak.idx}
                  onClick={() => setSelectedPeakIdx(peak.idx)}
                  onMouseEnter={() => setHoveredPeakIdx(peak.idx)}
                  onMouseLeave={() => setHoveredPeakIdx(null)}
                  className={`rounded-xl border p-2.5 transition-all font-mono tabular-nums ${
                    peak.isExcluded
                      ? 'bg-red-950/10 border-red-500/25 opacity-55'
                      : isSelected
                      ? 'bg-[#0C1526] border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.12)]'
                      : 'bg-[#09101E] border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Top Row: Peak Badge, Computed Beta & d-spacing Readouts, and Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExcludePeak(peak.idx);
                        }}
                        title={peak.isExcluded ? 'Include reflection in regression' : 'Exclude reflection as outlier'}
                        className={`p-1 rounded-md border transition-colors cursor-pointer ${
                          peak.isExcluded
                            ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                            : 'bg-white/5 border-white/10 text-emerald-400 hover:text-pink-300'
                        }`}
                      >
                        {peak.isExcluded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>

                      <span className="text-[10px] font-black text-slate-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                        #{peak.idx + 1}
                      </span>

                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        β_obs = {peak.betaObs.toFixed(4)}°
                      </span>

                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                        d = {peak.dSpacing.toFixed(3)} Å
                      </span>

                      {peak.apparentSizeNm > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/25">
                          D ≈ {peak.apparentSizeNm.toFixed(1)} nm
                        </span>
                      )}
                    </div>

                    {/* Row Actions */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPeakIdx(peak.idx);
                          setGraphicMode('geometry');
                        }}
                        title="Inspect Equivalent Rectangle Geometry"
                        className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-white/5 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateRow(peak.idx);
                        }}
                        title="Duplicate reflection"
                        className="p-1 text-slate-400 hover:text-pink-300 rounded hover:bg-white/5 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(peak.idx);
                        }}
                        title="Delete reflection"
                        className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Inline Editable Inputs for 2Theta, Area, I_max, and Miller (h k l) */}
                  <div className="grid grid-cols-12 gap-1.5 items-center">
                    {/* 2-Theta Input */}
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5">2θ (deg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peak.twoTheta}
                        onChange={(e) => handleUpdateRow(peak.idx, 'twoTheta', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 bg-[#050A14] border border-white/10 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:border-pink-500/60 ${
                          peak.isExcluded ? 'line-through text-slate-500' : 'text-pink-300'
                        }`}
                      />
                    </div>

                    {/* Area Input */}
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5">Area (cts·°)</label>
                      <input
                        type="number"
                        step="1"
                        value={peak.area}
                        onChange={(e) => handleUpdateRow(peak.idx, 'area', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 bg-[#050A14] border border-white/10 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:border-emerald-500/60 ${
                          peak.isExcluded ? 'line-through text-slate-500' : 'text-emerald-300'
                        }`}
                      />
                    </div>

                    {/* I_max Input */}
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5">I_max (cts)</label>
                      <input
                        type="number"
                        step="50"
                        value={peak.iMax}
                        onChange={(e) => handleUpdateRow(peak.idx, 'iMax', parseFloat(e.target.value) || 1000)}
                        className={`w-full px-2 py-1 bg-[#050A14] border border-white/10 rounded-lg text-xs font-mono tabular-nums font-bold outline-none focus:border-cyan-500/60 ${
                          peak.isExcluded ? 'line-through text-slate-500' : 'text-cyan-300'
                        }`}
                      />
                    </div>

                    {/* Miller Indices (h k l) */}
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5 text-center">Planes (h k l)</label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          value={peak.hklVal[0]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'h', e.target.value)}
                          className="w-full py-1 bg-[#050A14] text-[11px] text-purple-300 font-mono tabular-nums font-bold text-center rounded-md outline-none border border-white/10 focus:border-purple-500/60"
                        />
                        <input
                          type="number"
                          value={peak.hklVal[1]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'k', e.target.value)}
                          className="w-full py-1 bg-[#050A14] text-[11px] text-purple-300 font-mono tabular-nums font-bold text-center rounded-md outline-none border border-white/10 focus:border-purple-500/60"
                        />
                        <input
                          type="number"
                          value={peak.hklVal[2]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'l', e.target.value)}
                          className="w-full py-1 bg-[#050A14] text-[11px] text-purple-300 font-mono tabular-nums font-bold text-center rounded-md outline-none border border-white/10 focus:border-purple-500/60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Micro-Bar: Deconvolution Partition (Sample vs Instrumental Breadth) */}
                  <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center gap-2 text-[8px]">
                    <span className="text-slate-500 uppercase font-sans font-bold">β_sample: {peak.betaSampleDeg.toFixed(4)}° ({sampleSharePct.toFixed(0)}%)</span>
                    <div className="flex-1 h-1.5 bg-amber-500/30 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-cyan-400 transition-all"
                        style={{ width: `${sampleSharePct}%` }}
                      />
                    </div>
                    <span className="text-amber-400/80">β_inst: {peak.betaInstDeg.toFixed(3)}°</span>
                  </div>
                </div>
              );
            })
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
              className="w-full h-44 px-4 py-3 bg-[#0A101C] text-pink-300 border border-white/10 focus:border-pink-500/50 rounded-xl focus:ring-1 focus:ring-pink-500/20 outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700 shadow-inner font-mono tabular-nums text-xs"
              spellCheck="false"
            />
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAutoClean}
                title="Format & clean whitespace"
                className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-pink-300 bg-black/80 hover:bg-black px-2 py-0.5 rounded border border-white/10 transition-colors cursor-pointer"
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
