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
    <div className="bg-[#0B0F19] rounded-xl border border-slate-800 transition-all shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-[#070A12]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Reflections Data (2θ, Area, I_max [, h k l])
              </h3>
              <span className="text-[10px] font-mono tabular-nums text-slate-500">
                · {parsedPeaks.length} Reflections · Stokes–Wilson β = Area / I_max
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Integral Breadth Metrology · Equivalent Rectangular Profile &amp; Miller Indexing
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Table vs Raw Text) */}
        <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Table className="w-3 h-3" />
            Cards ({parsedPeaks.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <FileText className="w-3 h-3" />
            Raw Matrix
          </button>
        </div>
      </div>

      {/* INTERACTIVE SCIENTIFIC GRAPHIC CANVAS */}
      {enrichedPeaks.length > 0 && (
        <div className="bg-[#070A12] border-b border-slate-800 p-3 space-y-2.5">
          {/* Graphic Mode Selector Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-[#0B0F19] p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setGraphicMode('spectrum')}
                className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  graphicMode === 'spectrum'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                <Activity className="w-2.5 h-2.5" />
                XRD Stick Spectrum
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('broadening')}
                className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  graphicMode === 'broadening'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                <BarChart2 className="w-2.5 h-2.5" />
                β Deconvolution
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('geometry')}
                className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  graphicMode === 'geometry'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                <Target className="w-2.5 h-2.5" />
                β = Area/I_max Geometry
              </button>
            </div>

            {activeInspectPeak && (
              <div className="flex items-center gap-2 text-[9px] font-mono tabular-nums text-slate-400">
                <span className="text-slate-500 uppercase">Active:</span>
                <span className="text-slate-200 font-bold">
                  #{activeInspectPeak.idx + 1} {activeInspectPeak.hklLabel}
                </span>
                <span>·</span>
                <span className="text-sky-400 font-bold">2θ={activeInspectPeak.twoTheta.toFixed(2)}°</span>
                <span>·</span>
                <span className="text-amber-400 font-bold">β_obs={activeInspectPeak.betaObs.toFixed(4)}°</span>
                <span>·</span>
                <span className="text-emerald-400 font-bold">φ={activeInspectPeak.shapePhi.toFixed(3)}</span>
              </div>
            )}
          </div>

          {/* SVG Graphic Viewport */}
          <div className="relative bg-[#070A12] rounded-lg border border-slate-800/90 p-2 overflow-hidden">
            {graphicMode === 'spectrum' && (() => {
              const svgW = 540;
              const svgH = 162;
              const padL = 36;
              const padR = 18;
              const padT = 24;
              const padB = 28;
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
                  const visSigma = Math.max(0.45, p.betaObs * 1.4);
                  const dx = (tt - p.twoTheta) / visSigma;
                  if (Math.abs(dx) < 6) {
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

              const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => min2T + f * span2T);

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40 select-none overflow-visible">
                  <defs>
                    <linearGradient id="ibCadSpectrumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="ibCadRectGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal reference grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((g, idx) => {
                    const gy = padT + plotH * (1 - g);
                    return (
                      <g key={idx}>
                        <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#1E293B" strokeDasharray="2 3" strokeWidth="0.75" />
                        <text x={padL - 5} y={gy + 2.5} textAnchor="end" className="fill-slate-500 font-mono text-[7px]">
                          {Math.round(g * 100)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis baseline */}
                  <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#334155" strokeWidth="1" />
                  <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#334155" strokeWidth="1" />

                  {/* X-axis 2theta ticks */}
                  {ticks.map((t, i) => {
                    const tx = xOf(t);
                    return (
                      <g key={i}>
                        <line x1={tx} y1={padT + plotH} x2={tx} y2={padT + plotH + 4} stroke="#475569" />
                        <text x={tx} y={svgH - 6} textAnchor="middle" className="fill-slate-400 font-mono text-[8px]">
                          {t.toFixed(0)}°
                        </text>
                      </g>
                    );
                  })}
                  <text x={padL + plotW} y={svgH - 6} textAnchor="end" className="fill-sky-400 font-mono font-bold text-[7.5px]">
                    2θ (deg) →
                  </text>

                  {/* Synthesized XRD Envelope Area & Curve */}
                  <polygon points={fillPts.join(' ')} fill="url(#ibCadSpectrumGrad)" />
                  <polyline
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1.35"
                    strokeOpacity="0.85"
                    points={profilePts.join(' ')}
                  />

                  {/* Reflection Sticks, Equivalent Beta Rectangles & HKL Labels */}
                  {enrichedPeaks.map((p) => {
                    const cx = xOf(p.twoTheta);
                    const topY = yOf(p.relIntensity);
                    const baseY = padT + plotH;
                    const isSelected = p.idx === (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
                    const rectHalfW = Math.max(3.5, (p.betaObs / span2T) * plotW * 4.5);

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
                            fill={isSelected ? 'url(#ibCadRectGrad)' : 'rgba(56,189,248,0.07)'}
                            stroke={isSelected ? '#10B981' : 'rgba(56,189,248,0.35)'}
                            strokeWidth={isSelected ? 1.2 : 0.7}
                            strokeDasharray={isSelected ? 'none' : '2 1'}
                            rx={1}
                          />
                        )}

                        {/* Main Bragg Stick */}
                        <line
                          x1={cx}
                          y1={baseY}
                          x2={cx}
                          y2={topY}
                          stroke={p.isExcluded ? '#EF4444' : isSelected ? '#10B981' : '#38BDF8'}
                          strokeWidth={isSelected ? 2.2 : 1.4}
                          strokeDasharray={p.isExcluded ? '2 2' : 'none'}
                          opacity={p.isExcluded ? 0.45 : 1}
                        />

                        {/* Peak Apex Dot */}
                        <circle
                          cx={cx}
                          cy={topY}
                          r={isSelected ? 3.5 : 2.3}
                          fill={p.isExcluded ? '#EF4444' : isSelected ? '#10B981' : '#38BDF8'}
                          stroke="#070A12"
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
                              ? 'fill-emerald-300'
                              : 'fill-sky-300/90'
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
              const svgW = 540;
              const svgH = 162;
              const padL = 38;
              const padR = 38;
              const padT = 24;
              const padB = 28;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;

              const maxBeta = Math.max(...enrichedPeaks.map(p => p.betaObs), 0.1) * 1.2;
              const maxD = Math.max(...enrichedPeaks.map(p => p.apparentSizeNm || 0), 25) * 1.15;
              const colW = plotW / Math.max(1, enrichedPeaks.length);
              const barW = Math.min(28, Math.max(10, colW * 0.5));

              const dPts: string[] = [];
              enrichedPeaks.forEach((p, idx) => {
                if (p.isExcluded || p.apparentSizeNm <= 0) return;
                const cx = padL + (idx + 0.5) * colW;
                const cy = padT + plotH - Math.min(plotH, (p.apparentSizeNm / maxD) * plotH);
                dPts.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
              });

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40 select-none overflow-visible">
                  {/* Horizontal beta gridlines */}
                  {[0.25, 0.5, 0.75, 1].map((g, i) => {
                    const gy = padT + plotH * (1 - g);
                    const val = maxBeta * g;
                    const dVal = maxD * g;
                    return (
                      <g key={i}>
                        <line x1={padL} y1={gy} x2={padL + plotW} y2={gy} stroke="#1E293B" strokeDasharray="2 3" strokeWidth="0.75" />
                        <text x={padL - 5} y={gy + 2.5} textAnchor="end" className="fill-slate-400 font-mono text-[7px]">
                          {val.toFixed(2)}°
                        </text>
                        <text x={padL + plotW + 5} y={gy + 2.5} textAnchor="start" className="fill-emerald-400/80 font-mono text-[7px]">
                          {dVal.toFixed(0)}nm
                        </text>
                      </g>
                    );
                  })}

                  <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#334155" />
                  <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#334155" />
                  <line x1={padL + plotW} y1={padT} x2={padL + plotW} y2={padT + plotH} stroke="#065F46" strokeDasharray="2 2" />

                  {/* Stacked Deconvolution Bars: Instrumental (Amber) + Structural Sample (Cyan) */}
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
                          fill="#38BDF8"
                          fillOpacity={isSelected ? 0.85 : 0.55}
                          stroke={isSelected ? '#E0F2FE' : '#38BDF8'}
                          strokeWidth={isSelected ? 1.2 : 0.7}
                          rx={1.5}
                        />
                        {/* Instrumental Breadth (Bottom foundation) */}
                        <rect
                          x={cx - barW / 2}
                          y={baseY - instH}
                          width={barW}
                          height={instH}
                          fill="#F59E0B"
                          fillOpacity={0.8}
                          rx={1}
                        />
                        {/* Value label above bar */}
                        <text
                          x={cx}
                          y={Math.max(11, baseY - totalH - 5)}
                          textAnchor="middle"
                          className={`font-mono text-[7.5px] font-bold ${isSelected ? 'fill-sky-200' : 'fill-sky-400'}`}
                        >
                          {p.betaObs.toFixed(3)}°
                        </text>
                        {/* X-axis label */}
                        <text x={cx} y={svgH - 12} textAnchor="middle" className="fill-slate-200 font-mono text-[8px] font-bold">
                          {p.hklLabel}
                        </text>
                        <text x={cx} y={svgH - 3} textAnchor="middle" className="fill-slate-500 font-mono text-[7px]">
                          {p.twoTheta.toFixed(1)}°
                        </text>
                      </g>
                    );
                  })}

                  {/* Apparent Size D_app Trajectory */}
                  {dPts.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      points={dPts.join(' ')}
                    />
                  )}
                  {enrichedPeaks.map((p, idx) => {
                    if (p.isExcluded || p.apparentSizeNm <= 0) return null;
                    const cx = padL + (idx + 0.5) * colW;
                    const cy = padT + plotH - Math.min(plotH, (p.apparentSizeNm / maxD) * plotH);
                    return (
                      <circle
                        key={`d-${p.idx}`}
                        cx={cx}
                        cy={cy}
                        r={2.5}
                        fill="#10B981"
                        stroke="#070A12"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Mini Legend */}
                  <g transform={`translate(${padL + 6}, 10)`}>
                    <rect x="0" y="-6" width="7" height="7" rx="1" fill="#38BDF8" />
                    <text x="10" y="0" className="fill-slate-300 font-mono text-[7.5px]">β_sample (Size+Strain)</text>
                    <rect x="125" y="-6" width="7" height="7" rx="1" fill="#F59E0B" />
                    <text x="135" y="0" className="fill-slate-300 font-mono text-[7.5px]">β_inst (Instrument)</text>
                    <circle cx="242" cy="-2.5" r="3" fill="#10B981" />
                    <text x="249" y="0" className="fill-emerald-300 font-mono text-[7.5px]">D_app (nm)</text>
                  </g>
                </svg>
              );
            })()}

            {graphicMode === 'geometry' && activeInspectPeak && (() => {
              const svgW = 540;
              const svgH = 162;
              const padL = 32;
              const padR = 190; // Right side reserved for live Stokes-Wilson metrology card
              const padT = 24;
              const padB = 26;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;
              const cx = padL + plotW / 2;
              const baseY = padT + plotH;
              const peakTopY = padT + 8;
              const peakH = baseY - peakTopY;

              const eqRectW = plotW * 0.44;
              const fwhmW = eqRectW * Math.min(1.05, Math.max(0.55, activeInspectPeak.shapePhi));

              const curvePts: string[] = [];
              const fillPts: string[] = [`${padL},${baseY}`];
              const steps = 100;
              for (let i = 0; i <= steps; i++) {
                const normX = (i / steps) - 0.5;
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
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40 select-none overflow-visible">
                  {/* Baseline */}
                  <line x1={padL} y1={baseY} x2={padL + plotW} y2={baseY} stroke="#334155" strokeWidth="1" />

                  {/* Bell Curve Area (= Integrated Area) */}
                  <polygon points={fillPts.join(' ')} fill="rgba(56,189,248,0.16)" />
                  <polyline fill="none" stroke="#38BDF8" strokeWidth="1.8" points={curvePts.join(' ')} />

                  {/* Equivalent Integral Breadth Rectangle (Height = I_max, Width = beta_obs = Area / I_max) */}
                  <rect
                    x={cx - eqRectW / 2}
                    y={peakTopY}
                    width={eqRectW}
                    height={peakH}
                    fill="rgba(16,185,129,0.10)"
                    stroke="#10B981"
                    strokeWidth="1.3"
                    strokeDasharray="4 2"
                    rx="1.5"
                  />

                  {/* I_max vertical arrow */}
                  <line x1={cx} y1={baseY} x2={cx} y2={peakTopY} stroke="#64748B" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx={cx} cy={peakTopY} r="3" fill="#38BDF8" stroke="#070A12" strokeWidth="1" />
                  <text x={cx} y={peakTopY - 6} textAnchor="middle" className="fill-sky-300 font-mono text-[8px] font-bold">
                    I_max = {activeInspectPeak.iMax.toFixed(0)} cts
                  </text>

                  {/* Beta_obs horizontal dimension line */}
                  <line
                    x1={cx - eqRectW / 2}
                    y1={peakTopY + peakH * 0.3}
                    x2={cx + eqRectW / 2}
                    y2={peakTopY + peakH * 0.3}
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={peakTopY + peakH * 0.3 - 4}
                    textAnchor="middle"
                    className="fill-emerald-300 font-mono text-[8px] font-bold"
                  >
                    β_obs = {activeInspectPeak.betaObs.toFixed(4)}°
                  </text>

                  {/* FWHM horizontal indicator at half height */}
                  <line
                    x1={cx - fwhmW / 2}
                    y1={peakTopY + peakH * 0.5}
                    x2={cx + fwhmW / 2}
                    y2={peakTopY + peakH * 0.5}
                    stroke="#F59E0B"
                    strokeWidth="1.3"
                  />
                  <text
                    x={cx}
                    y={peakTopY + peakH * 0.5 + 10}
                    textAnchor="middle"
                    className="fill-amber-300 font-mono text-[7.5px] font-bold"
                  >
                    FWHM ≈ {activeInspectPeak.fwhmEst.toFixed(3)}° (φ={activeInspectPeak.shapePhi.toFixed(2)})
                  </text>

                  {/* X-axis 2theta center */}
                  <text x={cx} y={svgH - 6} textAnchor="middle" className="fill-slate-300 font-mono text-[8px] font-bold">
                    2θ = {activeInspectPeak.twoTheta.toFixed(2)}° · {activeInspectPeak.hklLabel}
                  </text>

                  {/* Right Panel Telemetry Card inside SVG */}
                  <g transform={`translate(${padL + plotW + 12}, ${padT - 4})`}>
                    <rect x="0" y="0" width="172" height={plotH + 8} rx="6" fill="#0B0F19" stroke="#1E293B" />
                    <text x="10" y="15" className="fill-sky-400 font-mono text-[8px] font-bold uppercase">
                      Stokes–Wilson Box Law
                    </text>
                    <line x1="10" y1="20" x2="162" y2="20" stroke="#1E293B" />
                    <text x="10" y="33" className="fill-slate-400 font-mono text-[7.5px]">
                      Area = {activeInspectPeak.area.toFixed(1)} cts·°
                    </text>
                    <text x="10" y="45" className="fill-slate-400 font-mono text-[7.5px]">
                      I_max = {activeInspectPeak.iMax.toFixed(0)} cts
                    </text>
                    <text x="10" y="59" className="fill-emerald-400 font-mono text-[8px] font-bold">
                      β_obs = {activeInspectPeak.betaObs.toFixed(4)}°
                    </text>
                    <text x="10" y="72" className="fill-sky-400 font-mono text-[8px] font-bold">
                      β_samp = {activeInspectPeak.betaSampleDeg.toFixed(4)}°
                    </text>
                    <text x="10" y="85" className="fill-amber-400 font-mono text-[8px] font-bold">
                      d_hkl = {activeInspectPeak.dSpacing.toFixed(4)} Å
                    </text>
                    <text x="10" y="98" className="fill-slate-200 font-mono text-[8px] font-bold">
                      D_app ≈ {activeInspectPeak.apparentSizeNm > 0 ? `${activeInspectPeak.apparentSizeNm.toFixed(1)} nm` : '—'}
                    </text>
                    <text x="10" y="111" className="fill-slate-500 font-mono text-[7px]">
                      Shape φ = {activeInspectPeak.shapePhi.toFixed(3)} ({activeInspectPeak.shapePhi < 0.72 ? 'Lorentz-dom' : activeInspectPeak.shapePhi > 0.88 ? 'Gauss-dom' : 'Voigt mix'})
                    </text>
                  </g>
                </svg>
              );
            })()}
          </div>
        </div>
      )}

      {/* Dataset Summary Metrics Banner (Unboxed inline telemetry) */}
      {datasetStats && (
        <div className="px-4 py-2 bg-[#070A12] border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono tabular-nums">
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider">Active / Total</span>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">{datasetStats.active} / {datasetStats.total}</span>
              {datasetStats.excluded > 0 && (
                <span className="text-amber-400 font-bold text-[8px]">
                  ({datasetStats.excluded} excl)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider">2θ Window</span>
            <span className="text-sky-400 font-bold">{datasetStats.minTT.toFixed(1)}°–{datasetStats.maxTT.toFixed(1)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider">Mean β_obs</span>
            <span className="text-amber-400 font-bold">{datasetStats.avgBeta.toFixed(4)}°</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider">Mean β_sample</span>
            <span className="text-emerald-400 font-bold">{datasetStats.avgSampleBeta.toFixed(4)}°</span>
          </div>
        </div>
      )}

      {/* Quick Action Toolbar */}
      <div className="px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-1.5 bg-[#0B0F19]">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Add Peak Button */}
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              isAddFormOpen 
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
                : 'bg-[#070A12] border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300'
            }`}
          >
            <Plus className="w-3 h-3 text-sky-400" />
            Add Peak
          </button>

          {/* Sort Ascending */}
          <button
            type="button"
            onClick={handleSortAscending}
            title="Sort reflections strictly by 2θ ascending"
            className="px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-[#070A12] border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 whitespace-nowrap shrink-0 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 text-sky-400" />
            Sort 2θ
          </button>

          {/* Scale / Normalize I_max to 1000 */}
          <button
            type="button"
            onClick={handleNormalizeIntensities}
            title="Normalize peak intensities so max(I_max) = 1000 while preserving β_obs = Area / I_max"
            className="px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-[#070A12] border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 whitespace-nowrap shrink-0 transition-all cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            Norm I_max
          </button>

          {/* Synthetic Peak Generator Modal Button */}
          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className="px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-[#070A12] border border-slate-800 hover:border-sky-500/50 text-sky-300 whitespace-nowrap shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            Synthetic
          </button>

          {/* HKL Algorithmic Indexer Modal Button */}
          <button
            type="button"
            onClick={() => setShowHKLModal(true)}
            className="px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-[#070A12] border border-slate-800 hover:border-amber-500/50 text-amber-300 whitespace-nowrap shrink-0 transition-all cursor-pointer"
          >
            <BrainCircuit className="w-3 h-3 text-amber-400" />
            Index (h k l)
          </button>

          {/* Profile Shape Calculator */}
          <button
            type="button"
            onClick={() => setShowCalcModal(true)}
            className="px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-[#070A12] border border-slate-800 hover:border-emerald-500/50 text-emerald-300 whitespace-nowrap shrink-0 transition-all cursor-pointer"
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
                className="px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-[#070A12] border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 whitespace-nowrap shrink-0 transition-all cursor-pointer"
              >
                <Atom className="w-3 h-3 text-sky-400" />
                Presets
                <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
              </button>

              <AnimatePresence>
                {isPresetsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-[#070A12] border border-slate-700 rounded-lg shadow-2xl p-1 z-50 max-h-60 overflow-y-auto custom-scrollbar"
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
                        className={`w-full text-left p-2 rounded-md hover:bg-sky-500/10 transition-colors cursor-pointer ${
                          selectedMaterial === preset.label ? 'bg-sky-500/15 text-sky-300' : 'text-slate-300'
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
              className="px-2 py-1 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0 transition-all cursor-pointer"
            >
              Reset Excl
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyToClipboard}
            title="Copy reflection data to clipboard"
            className="p-1.5 rounded-md bg-[#070A12] border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            {copiedNotification ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import reflection data from file (CSV, TXT)"
            className="p-1.5 rounded-md bg-[#070A12] border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
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
            className="p-1.5 rounded-md bg-[#070A12] border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            title="Formatting & Integral Breadth Guide"
            className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
              showFormatHelp ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' : 'bg-[#070A12] border-slate-800 text-slate-400 hover:text-white'
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
            className="overflow-hidden bg-[#070A12] border-b border-slate-800 p-3.5 text-xs font-mono space-y-2 text-slate-300"
          >
            <div className="flex items-center justify-between text-sky-400 font-bold uppercase text-[10px]">
              <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Integral Breadth Data Format Guide</span>
              <button type="button" onClick={() => setShowFormatHelp(false)} className="text-slate-500 hover:text-white cursor-pointer">✕</button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Each diffraction reflection is defined by its Bragg angle <strong className="text-sky-300">2θ</strong> (°), integrated net peak area <strong className="text-emerald-300">Area</strong> (counts·°), peak height <strong className="text-amber-300">I_max</strong> (counts), and optional Miller indices <strong className="text-slate-200">(h k l)</strong>.
            </p>
            <div className="bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800 space-y-1 text-[10px]">
              <div className="text-slate-400"><strong className="text-sky-300">Standard:</strong> <span className="text-slate-200">2θ, Area, I_max [, h k l]</span> (e.g. <span className="text-sky-400">28.44, 230, 1000, 1 1 1</span>)</div>
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
            className="overflow-hidden bg-[#070A12] border-b border-slate-800 p-3 space-y-2.5"
          >
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-sky-400 flex items-center justify-between">
              <span>Quick Add Reflection</span>
              {parseFloat(newArea) > 0 && parseFloat(newImax) > 0 && (
                <span className="text-emerald-400 font-mono tabular-nums font-bold">
                  β_obs = {(parseFloat(newArea) / parseFloat(newImax)).toFixed(4)}°
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[8px] font-mono font-bold text-slate-400 uppercase block mb-1">2θ (deg)*</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="28.44"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0B0F19] text-sky-300 border border-slate-800 rounded-md text-xs font-mono tabular-nums outline-none focus:border-sky-500/60"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono font-bold text-slate-400 uppercase block mb-1">Area (cts·°)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="230"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0B0F19] text-emerald-300 border border-slate-800 rounded-md text-xs font-mono tabular-nums outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="text-[8px] font-mono font-bold text-slate-400 uppercase block mb-1">I_max (cts)*</label>
                <input
                  type="number"
                  step="50"
                  placeholder="1000"
                  value={newImax}
                  onChange={(e) => setNewImax(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0B0F19] text-amber-300 border border-slate-800 rounded-md text-xs font-mono tabular-nums outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">Miller (h k l):</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="h"
                    value={newH}
                    onChange={(e) => setNewH(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0B0F19] text-slate-200 border border-slate-800 rounded text-xs font-mono tabular-nums text-center outline-none focus:border-sky-500/60"
                  />
                  <input
                    type="number"
                    placeholder="k"
                    value={newK}
                    onChange={(e) => setNewK(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0B0F19] text-slate-200 border border-slate-800 rounded text-xs font-mono tabular-nums text-center outline-none focus:border-sky-500/60"
                  />
                  <input
                    type="number"
                    placeholder="l"
                    value={newL}
                    onChange={(e) => setNewL(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0B0F19] text-slate-200 border border-slate-800 rounded text-xs font-mono tabular-nums text-center outline-none focus:border-sky-500/60"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!newTwoTheta || !newArea || !newImax}
                className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/50 disabled:opacity-40 text-sky-200 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3 h-3" />
                Append Peak
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Display Area */}
      {viewMode === 'table' ? (
        /* INTERACTIVE REFLECTION CARDS / COMPACT GRID */
        <div className="max-h-[410px] overflow-y-auto custom-scrollbar p-2.5 space-y-2 bg-[#070A12]">
          {enrichedPeaks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No reflections loaded. Click <strong className="text-sky-400">&quot;Add Peak&quot;</strong>, <strong className="text-sky-400">&quot;Synthetic&quot;</strong>, or choose a preset to begin.
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
                  className={`rounded-lg border p-2.5 transition-all font-mono tabular-nums ${
                    peak.isExcluded
                      ? 'bg-red-950/10 border-red-500/25 opacity-55'
                      : isSelected
                      ? 'bg-[#0B0F19] border-sky-500/50'
                      : 'bg-[#0B0F19]/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Row: Unboxed Telemetry Readouts & Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExcludePeak(peak.idx);
                        }}
                        title={peak.isExcluded ? 'Include reflection in regression' : 'Exclude reflection as outlier'}
                        className={`p-1 rounded border transition-colors cursor-pointer ${
                          peak.isExcluded
                            ? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
                            : 'bg-[#070A12] border-slate-800 text-emerald-400 hover:text-sky-300'
                        }`}
                      >
                        {peak.isExcluded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>

                      <span className="font-bold text-slate-300">
                        #{peak.idx + 1}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-bold text-amber-400">
                        β_obs={peak.betaObs.toFixed(4)}°
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-bold text-sky-400">
                        d={peak.dSpacing.toFixed(3)}Å
                      </span>

                      {peak.apparentSizeNm > 0 && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="font-bold text-emerald-400">
                            D≈{peak.apparentSizeNm.toFixed(1)}nm
                          </span>
                        </>
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
                        className="p-1 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800/60 cursor-pointer"
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
                        className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800/60 cursor-pointer"
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
                      <label className="text-[7.5px] font-mono font-bold text-slate-500 uppercase block mb-0.5">2θ (deg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peak.twoTheta}
                        onChange={(e) => handleUpdateRow(peak.idx, 'twoTheta', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 bg-[#070A12] border border-slate-800 rounded text-xs font-mono tabular-nums font-bold outline-none focus:border-sky-500/60 ${
                          peak.isExcluded ? 'line-through text-slate-500' : 'text-sky-300'
                        }`}
                      />
                    </div>

                    {/* Area Input */}
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-mono font-bold text-slate-500 uppercase block mb-0.5">Area (cts·°)</label>
                      <input
                        type="number"
                        step="1"
                        value={peak.area}
                        onChange={(e) => handleUpdateRow(peak.idx, 'area', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 bg-[#070A12] border border-slate-800 rounded text-xs font-mono tabular-nums font-bold outline-none focus:border-emerald-500/60 ${
                          peak.isExcluded ? 'line-through text-slate-500' : 'text-emerald-300'
                        }`}
                      />
                    </div>

                    {/* I_max Input */}
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-mono font-bold text-slate-500 uppercase block mb-0.5">I_max (cts)</label>
                      <input
                        type="number"
                        step="50"
                        value={peak.iMax}
                        onChange={(e) => handleUpdateRow(peak.idx, 'iMax', parseFloat(e.target.value) || 1000)}
                        className={`w-full px-2 py-1 bg-[#070A12] border border-slate-800 rounded text-xs font-mono tabular-nums font-bold outline-none focus:border-amber-500/60 ${
                          peak.isExcluded ? 'line-through text-slate-500' : 'text-amber-300'
                        }`}
                      />
                    </div>

                    {/* Miller Indices (h k l) */}
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-mono font-bold text-slate-500 uppercase block mb-0.5 text-center">Planes (h k l)</label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          value={peak.hklVal[0]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'h', e.target.value)}
                          className="w-full py-1 bg-[#070A12] text-[11px] text-slate-200 font-mono tabular-nums font-bold text-center rounded outline-none border border-slate-800 focus:border-sky-500/60"
                        />
                        <input
                          type="number"
                          value={peak.hklVal[1]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'k', e.target.value)}
                          className="w-full py-1 bg-[#070A12] text-[11px] text-slate-200 font-mono tabular-nums font-bold text-center rounded outline-none border border-slate-800 focus:border-sky-500/60"
                        />
                        <input
                          type="number"
                          value={peak.hklVal[2]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'l', e.target.value)}
                          className="w-full py-1 bg-[#070A12] text-[11px] text-slate-200 font-mono tabular-nums font-bold text-center rounded outline-none border border-slate-800 focus:border-sky-500/60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Micro-Bar: Deconvolution Partition (Sample vs Instrumental Breadth) */}
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center gap-2 text-[8px]">
                    <span className="text-sky-400 uppercase font-mono font-bold">β_sample: {peak.betaSampleDeg.toFixed(4)}° ({sampleSharePct.toFixed(0)}%)</span>
                    <div className="flex-1 h-1.5 bg-amber-500/30 rounded-sm overflow-hidden flex">
                      <div
                        className="h-full bg-sky-400 transition-all"
                        style={{ width: `${sampleSharePct}%` }}
                      />
                    </div>
                    <span className="text-amber-400 font-mono">β_inst: {peak.betaInstDeg.toFixed(3)}°</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* MONOSPACE RAW CSV TEXT MODE */
        <div className="p-3 space-y-2 bg-[#070A12]">
          <div className="relative font-mono text-xs">
            <textarea
              value={inputData}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="28.44, 230, 1000, 1 1 1&#10;47.30, 280, 950, 2 2 0&#10;56.12, 350, 900, 3 1 1"
              className="w-full h-44 px-4 py-3 bg-[#0B0F19] text-sky-300 border border-slate-800 focus:border-sky-500/50 rounded-lg outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700 font-mono tabular-nums text-xs"
              spellCheck="false"
            />
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAutoClean}
                title="Format & clean whitespace"
                className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400 hover:text-sky-300 bg-[#070A12] px-2 py-0.5 rounded border border-slate-800 transition-colors cursor-pointer"
              >
                Auto-Format
              </button>
              <div className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest bg-[#070A12] px-2 py-0.5 rounded border border-slate-800">
                2θ, Area, I_max [, h k l]
              </div>
            </div>
          </div>

          {/* Real-time Syntax Warnings / Errors */}
          {validationInfo.errors.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/40 p-2.5 rounded-lg space-y-1">
              <div className="text-[9px] font-mono font-bold uppercase text-red-400 flex items-center gap-1.5">
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
            <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-lg space-y-1">
              <div className="text-[9px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
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
