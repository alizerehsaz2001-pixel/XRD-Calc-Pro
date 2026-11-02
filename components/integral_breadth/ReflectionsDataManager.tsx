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
  Zap, 
  Info,
  Maximize2,
  Activity,
  BarChart2,
  Target,
  Layers
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
  const [graphicMode, setGraphicMode] = useState<'spectrum' | 'shape' | 'geometry'>('spectrum');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);

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

  const activeSelectedIdx = useMemo(() => {
    if (parsedPeaks.length === 0) return 0;
    return Math.min(selectedPeakIdx, parsedPeaks.length - 1);
  }, [parsedPeaks.length, selectedPeakIdx]);

  const enrichedPeaks = useMemo(() => {
    if (parsedPeaks.length === 0) return [];
    const maxI = Math.max(...parsedPeaks.map(p => p.iMax), 1);
    return parsedPeaks.map((p, idx) => {
      const betaObs = p.iMax > 0 ? p.area / p.iMax : 0;
      const phi = betaObs > 0 ? p.fwhm / betaObs : 0.78;
      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
      const dSpacing = Math.sin(thetaRad) > 1e-6 ? wavelength / (2 * Math.sin(thetaRad)) : 0;
      const hklVal = p.hkl || [1, 1, 1];
      const hklLabel = `(${hklVal[0]}${hklVal[1]}${hklVal[2]})`;
      let shapeType: 'Cauchy' | 'Voigt' | 'Gauss' = 'Voigt';
      if (phi <= 0.67) shapeType = 'Cauchy';
      else if (phi >= 0.88) shapeType = 'Gauss';

      return {
        ...p,
        idx,
        betaObs,
        phi,
        dSpacing,
        hklVal,
        hklLabel,
        shapeType,
        relIntensity: (p.iMax / maxI) * 100
      };
    });
  }, [parsedPeaks, wavelength]);

  // Syntax validation for raw mode
  const validationInfo = useMemo(() => {
    if (!inputData.trim()) return { errors: ['Dataset is empty. Add reflections to begin analysis.'], warnings: [], validCount: 0 };
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
    if (enrichedPeaks.length === 0) return null;
    const ttValues = enrichedPeaks.map(p => p.twoTheta);
    const minTT = Math.min(...ttValues);
    const maxTT = Math.max(...ttValues);
    const spreadTT = maxTT - minTT;

    const avgBeta = enrichedPeaks.reduce((a, b) => a + b.betaObs, 0) / enrichedPeaks.length;
    const avgPhi = enrichedPeaks.reduce((a, b) => a + b.phi, 0) / enrichedPeaks.length;

    let profileNature = 'Voigt (Mixed Size & Microstrain)';
    let natureColor = 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    if (avgPhi <= 0.68) {
      profileNature = 'Cauchy / Lorentzian (Size Dominant)';
      natureColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    } else if (avgPhi >= 0.88) {
      profileNature = 'Gaussian (Microstrain Dominant)';
      natureColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }

    return {
      count: enrichedPeaks.length,
      minTT,
      maxTT,
      spreadTT,
      avgBeta,
      avgPhi,
      profileNature,
      natureColor
    };
  }, [enrichedPeaks]);

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
      twoTheta: parseFloat((peak.twoTheta + 0.5).toFixed(2))
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

    setNewTwoTheta('');
    setNewFwhm('');
    setNewArea('');
    setNewImax('1000');
    setNewH('');
    setNewK('');
    setNewL('');
    setIsAddFormOpen(false);
    setSelectedPeakIdx(updated.length - 1);
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
      iMax: Math.round(p.iMax * factor),
      area: parseFloat((p.area * factor).toFixed(1))
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
    const header = "2Theta_deg,FWHM_deg,Area_counts_deg,Imax_counts,Beta_obs_deg,Shape_phi,h,k,l\n";
    const rows = enrichedPeaks.map(p => {
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      return `${p.twoTheta},${p.fwhm},${p.area},${p.iMax},${p.betaObs.toFixed(4)},${p.phi.toFixed(4)},${h},${k},${l}`;
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
        onInputChange(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeInspectPeak = enrichedPeaks[hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx] || enrichedPeaks[0];

  return (
    <div className="bg-[#070D18] rounded-3xl border border-white/10 shadow-xl overflow-hidden">
      {/* Header & Mode Switcher Ribbon */}
      <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-purple-950/25 via-indigo-950/15 to-[#070D18]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Reflections Data (2θ, Area, I_max [, h k l])
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-[9px] font-mono tabular-nums font-bold text-purple-300">
                {parsedPeaks.length} Peak{parsedPeaks.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
              2θ (°), FWHM (°), Area (cts·°), I_max (cts) • β_obs = Area / I_max
            </p>
          </div>
        </div>

        {/* View Switcher: Table vs Raw Text */}
        <div className="flex items-center gap-1 bg-[#050A14] p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3 h-3" />
            <span>Interactive</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Raw CSV</span>
          </button>
        </div>
      </div>

      {/* INTERACTIVE SCIENTIFIC GRAPHIC CANVAS */}
      {enrichedPeaks.length > 0 && (
        <div className="bg-[#040811] border-b border-white/5 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-[#091122] p-0.5 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setGraphicMode('spectrum')}
                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  graphicMode === 'spectrum'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Activity className="w-2.5 h-2.5" />
                XRD Stick Spectrum
              </button>
              <button
                type="button"
                onClick={() => setGraphicMode('shape')}
                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                  graphicMode === 'shape'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <BarChart2 className="w-2.5 h-2.5" />
                Voigt Shape φ Map
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
                β = Area/I_max Box
              </button>
            </div>

            {activeInspectPeak && (
              <div className="flex items-center gap-2 text-[9px] font-mono tabular-nums">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                  #{activeInspectPeak.idx + 1} {activeInspectPeak.hklLabel}
                </span>
                <span className="text-white font-bold">{activeInspectPeak.twoTheta.toFixed(2)}°</span>
                <span className="text-amber-300 font-bold">β={activeInspectPeak.betaObs.toFixed(3)}°</span>
                <span className="text-cyan-300 font-bold">φ={activeInspectPeak.phi.toFixed(3)}</span>
              </div>
            )}
          </div>

          <div className="relative bg-[#060B16] rounded-xl border border-white/5 p-2 overflow-hidden">
            {graphicMode === 'spectrum' && (() => {
              const svgW = 480;
              const svgH = 142;
              const padL = 32;
              const padR = 18;
              const padT = 22;
              const padB = 24;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;

              const min2T = Math.max(5, Math.floor((reflectionStats?.minTT || 20) - 8));
              const max2T = Math.min(165, Math.ceil((reflectionStats?.maxTT || 90) + 8));
              const span2T = Math.max(10, max2T - min2T);

              const xOf = (tt: number) => padL + ((tt - min2T) / span2T) * plotW;
              const yOf = (relI: number) => padT + plotH - (Math.min(100, Math.max(0, relI)) / 100) * plotH;

              const numSamples = 170;
              const profilePts: string[] = [];
              const fillPts: string[] = [`${padL},${padT + plotH}`];
              for (let i = 0; i <= numSamples; i++) {
                const tt = min2T + (i / numSamples) * span2T;
                let intensity = 0;
                enrichedPeaks.forEach(p => {
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
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-34 select-none overflow-visible">
                  <defs>
                    <linearGradient id="stdSpectrumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

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

                  <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="rgba(255,255,255,0.18)" />

                  {ticks.map((t, i) => {
                    const tx = xOf(t);
                    return (
                      <g key={i}>
                        <line x1={tx} y1={padT + plotH} x2={tx} y2={padT + plotH + 4} stroke="rgba(255,255,255,0.25)" />
                        <text x={tx} y={svgH - 5} textAnchor="middle" className="fill-slate-400 font-mono text-[8px]">
                          {t.toFixed(0)}°
                        </text>
                      </g>
                    );
                  })}

                  <polygon points={fillPts.join(' ')} fill="url(#stdSpectrumGrad)" />
                  <polyline fill="none" stroke="#c084fc" strokeWidth="1.25" strokeOpacity="0.7" points={profilePts.join(' ')} />

                  {enrichedPeaks.map((p) => {
                    const cx = xOf(p.twoTheta);
                    const topY = yOf(p.relIntensity);
                    const baseY = padT + plotH;
                    const isSelected = p.idx === (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
                    const rectHalfW = Math.max(3, (p.betaObs / span2T) * plotW * 4.5);

                    return (
                      <g
                        key={p.idx}
                        className="cursor-pointer"
                        onClick={() => setSelectedPeakIdx(p.idx)}
                        onMouseEnter={() => setHoveredPeakIdx(p.idx)}
                        onMouseLeave={() => setHoveredPeakIdx(null)}
                      >
                        <rect
                          x={cx - rectHalfW}
                          y={topY}
                          width={rectHalfW * 2}
                          height={baseY - topY}
                          fill={isSelected ? 'rgba(34,211,238,0.18)' : 'rgba(168,85,247,0.08)'}
                          stroke={isSelected ? '#22d3ee' : 'rgba(168,85,247,0.35)'}
                          strokeWidth={isSelected ? 1 : 0.6}
                          strokeDasharray={isSelected ? 'none' : '2 1'}
                          rx={1.5}
                        />
                        <line
                          x1={cx}
                          y1={baseY}
                          x2={cx}
                          y2={topY}
                          stroke={isSelected ? '#22d3ee' : '#c084fc'}
                          strokeWidth={isSelected ? 2.2 : 1.5}
                        />
                        <circle
                          cx={cx}
                          cy={topY}
                          r={isSelected ? 3.5 : 2.3}
                          fill={isSelected ? '#22d3ee' : '#c084fc'}
                          stroke="#050A14"
                          strokeWidth="1"
                        />
                        <text
                          x={cx}
                          y={Math.max(10, topY - 5)}
                          textAnchor="middle"
                          className={`font-mono text-[8px] font-bold ${isSelected ? 'fill-cyan-300' : 'fill-purple-300'}`}
                        >
                          {p.hklLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}

            {graphicMode === 'shape' && (() => {
              const svgW = 480;
              const svgH = 142;
              const padL = 42;
              const padR = 16;
              const padT = 20;
              const padB = 24;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;

              const minPhi = 0.55;
              const maxPhi = 1.02;
              const yOfPhi = (phi: number) => {
                const clamped = Math.min(maxPhi, Math.max(minPhi, phi));
                return padT + plotH - ((clamped - minPhi) / (maxPhi - minPhi)) * plotH;
              };

              const yCauchy = yOfPhi(0.6366);
              const yGauss = yOfPhi(0.9394);
              const colW = plotW / Math.max(1, enrichedPeaks.length);

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-34 select-none overflow-visible">
                  {/* Gaussian limit line (0.939) */}
                  <line x1={padL} y1={yGauss} x2={padL + plotW} y2={yGauss} stroke="#10b981" strokeDasharray="3 3" strokeOpacity="0.6" />
                  <text x={padL - 4} y={yGauss + 3} textAnchor="end" className="fill-emerald-400 font-mono text-[7px]">0.939 (G)</text>

                  {/* Cauchy limit line (0.637) */}
                  <line x1={padL} y1={yCauchy} x2={padL + plotW} y2={yCauchy} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity="0.6" />
                  <text x={padL - 4} y={yCauchy + 3} textAnchor="end" className="fill-blue-400 font-mono text-[7px]">0.637 (C)</text>

                  <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="rgba(255,255,255,0.18)" />

                  {enrichedPeaks.map((p, idx) => {
                    const cx = padL + (idx + 0.5) * colW;
                    const cy = yOfPhi(p.phi);
                    const isSelected = p.idx === (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
                    const dotColor = p.shapeType === 'Cauchy' ? '#60a5fa' : p.shapeType === 'Gauss' ? '#34d399' : '#c084fc';

                    return (
                      <g
                        key={p.idx}
                        className="cursor-pointer"
                        onClick={() => setSelectedPeakIdx(p.idx)}
                        onMouseEnter={() => setHoveredPeakIdx(p.idx)}
                        onMouseLeave={() => setHoveredPeakIdx(null)}
                      >
                        <line x1={cx} y1={padT + plotH} x2={cx} y2={cy} stroke={dotColor} strokeWidth={isSelected ? 2 : 1.2} strokeOpacity="0.6" />
                        <circle cx={cx} cy={cy} r={isSelected ? 4.5 : 3.2} fill={dotColor} stroke="#050A14" strokeWidth="1" />
                        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white font-mono text-[7.5px] font-bold">
                          {p.phi.toFixed(2)}
                        </text>
                        <text x={cx} y={svgH - 6} textAnchor="middle" className="fill-slate-400 font-mono text-[7.5px]">
                          {p.hklLabel}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}

            {graphicMode === 'geometry' && activeInspectPeak && (() => {
              const svgW = 480;
              const svgH = 142;
              const padL = 28;
              const padR = 165;
              const padT = 20;
              const padB = 22;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;
              const cx = padL + plotW / 2;
              const baseY = padT + plotH;
              const peakTopY = padT + 6;
              const peakH = baseY - peakTopY;

              const eqRectW = plotW * 0.44;
              const fwhmW = eqRectW * Math.min(1.05, Math.max(0.55, activeInspectPeak.phi));

              const curvePts: string[] = [];
              const fillPts: string[] = [`${padL},${baseY}`];
              const steps = 80;
              for (let i = 0; i <= steps; i++) {
                const normX = (i / steps) - 0.5;
                const px = padL + (i / steps) * plotW;
                const u = (normX * plotW) / (eqRectW / 2);
                const g = Math.exp(-0.785 * u * u);
                const c = 1 / (1 + 0.65 * u * u);
                const yVal = 0.5 * g + 0.5 * c;
                const py = baseY - yVal * peakH;
                curvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                fillPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }
              fillPts.push(`${padL + plotW},${baseY}`);

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-34 select-none overflow-visible">
                  <line x1={padL} y1={baseY} x2={padL + plotW} y2={baseY} stroke="rgba(255,255,255,0.2)" />
                  <polygon points={fillPts.join(' ')} fill="rgba(168,85,247,0.2)" />
                  <polyline fill="none" stroke="#c084fc" strokeWidth="1.8" points={curvePts.join(' ')} />

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

                  <line x1={cx - eqRectW / 2} y1={peakTopY + peakH * 0.3} x2={cx + eqRectW / 2} y2={peakTopY + peakH * 0.3} stroke="#22d3ee" strokeWidth="1.5" />
                  <text x={cx} y={peakTopY + peakH * 0.3 - 4} textAnchor="middle" className="fill-cyan-200 font-mono text-[8px] font-bold">
                    β_obs = {activeInspectPeak.betaObs.toFixed(4)}°
                  </text>

                  <line x1={cx - fwhmW / 2} y1={peakTopY + peakH * 0.5} x2={cx + fwhmW / 2} y2={peakTopY + peakH * 0.5} stroke="#fbbf24" strokeWidth="1.3" />
                  <text x={cx} y={peakTopY + peakH * 0.5 + 9} textAnchor="middle" className="fill-amber-300 font-mono text-[7.5px] font-bold">
                    FWHM = {activeInspectPeak.fwhm.toFixed(3)}°
                  </text>

                  <g transform={`translate(${padL + plotW + 12}, ${padT})`}>
                    <rect x="0" y="0" width="148" height={plotH} rx="6" fill="#091122" stroke="rgba(255,255,255,0.08)" />
                    <text x="8" y="15" className="fill-cyan-300 font-mono text-[8px] font-bold uppercase">
                      Peak #{activeInspectPeak.idx + 1} {activeInspectPeak.hklLabel}
                    </text>
                    <text x="8" y="29" className="fill-slate-400 font-mono text-[7.5px]">
                      Area = {activeInspectPeak.area.toFixed(1)} cts·°
                    </text>
                    <text x="8" y="42" className="fill-slate-400 font-mono text-[7.5px]">
                      I_max = {activeInspectPeak.iMax.toFixed(0)} cts
                    </text>
                    <text x="8" y="56" className="fill-amber-300 font-mono text-[8px] font-bold">
                      β_obs = {activeInspectPeak.betaObs.toFixed(4)}°
                    </text>
                    <text x="8" y="70" className="fill-purple-300 font-mono text-[8px] font-bold">
                      φ = FWHM/β = {activeInspectPeak.phi.toFixed(3)}
                    </text>
                    <text x="8" y="84" className="fill-emerald-300 font-mono text-[8px] font-bold">
                      d_hkl = {activeInspectPeak.dSpacing.toFixed(3)} Å
                    </text>
                  </g>
                </svg>
              );
            })()}
          </div>
        </div>
      )}

      {/* Dataset Health & Physical Summary Strip */}
      {reflectionStats && (
        <div className="px-4 py-2 bg-[#050A14] border-b border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono tabular-nums">
          <div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-sans font-bold">2θ Range</span>
            <span className="text-white font-bold">{reflectionStats.minTT.toFixed(1)}°–{reflectionStats.maxTT.toFixed(1)}°</span>
          </div>

          <div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Mean β_obs</span>
            <span className="text-amber-300 font-bold">{reflectionStats.avgBeta.toFixed(3)}°</span>
          </div>

          <div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Mean Shape (φ)</span>
            <span className="text-cyan-300 font-bold">{reflectionStats.avgPhi.toFixed(3)}</span>
          </div>

          <div>
            <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-sans font-bold">Regime</span>
            <span className={`px-1.5 py-0.5 rounded border text-[8.5px] font-bold inline-block truncate max-w-full ${reflectionStats.natureColor}`}>
              {reflectionStats.profileNature.split(' ')[0]}
            </span>
          </div>
        </div>
      )}

      {/* ACTION TOOLBAR */}
      <div className="p-2.5 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 bg-[#060C18]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Peak</span>
          </button>

          <button
            type="button"
            onClick={handleSortAscending}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            title="Sort reflections in ascending 2θ order"
          >
            <ArrowUpDown className="w-3 h-3 text-purple-400" />
            <span>Sort 2θ</span>
          </button>

          <button
            type="button"
            onClick={handleNormalizeIntensities}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            title="Scale peak areas such that maximum peak I_max = 1000 counts"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Normalize</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 text-pink-300 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
            title="Generate synthetic Bragg reflections"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>Synthetic Lab</span>
          </button>
        </div>

        {/* Right Action Group: Upload, Copy, Download */}
        <div className="flex items-center gap-1">
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
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Import reflections from CSV, TXT, or XY file"
          >
            <Upload className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Download reflections as CSV"
          >
            <Download className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleCopyClipboard}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Copy reflections to clipboard"
          >
            {copiedNotification ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Show formatting help"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
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
            className="overflow-hidden bg-[#050A14] p-3.5 border-b border-purple-500/30 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add New Reflection
              </span>
              {parseFloat(newArea) > 0 && parseFloat(newImax) > 0 && (
                <span className="text-[10px] font-mono tabular-nums text-cyan-300 font-bold">
                  β_obs = {(parseFloat(newArea) / parseFloat(newImax)).toFixed(4)}°
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div>
                <label className="text-[8px] text-slate-400 uppercase block mb-1">2θ (deg)*</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="28.44"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0A101C] text-white border border-white/10 rounded-lg focus:border-purple-500/50 outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="text-[8px] text-slate-400 uppercase block mb-1">FWHM (deg)</label>
                <input
                  type="number"
                  step="0.005"
                  placeholder="0.22"
                  value={newFwhm}
                  onChange={(e) => setNewFwhm(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0A101C] text-white border border-white/10 rounded-lg focus:border-purple-500/50 outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="text-[8px] text-slate-400 uppercase block mb-1">Area (cts·°)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="230"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0A101C] text-white border border-white/10 rounded-lg focus:border-purple-500/50 outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="text-[8px] text-slate-400 uppercase block mb-1">I_max (cts)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="1000"
                  value={newImax}
                  onChange={(e) => setNewImax(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0A101C] text-white border border-white/10 rounded-lg focus:border-purple-500/50 outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Miller (h k l):</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="h"
                    value={newH}
                    onChange={(e) => setNewH(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0A101C] text-purple-300 border border-white/10 rounded-md text-center font-mono tabular-nums text-xs outline-none"
                  />
                  <input
                    type="number"
                    placeholder="k"
                    value={newK}
                    onChange={(e) => setNewK(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0A101C] text-purple-300 border border-white/10 rounded-md text-center font-mono tabular-nums text-xs outline-none"
                  />
                  <input
                    type="number"
                    placeholder="l"
                    value={newL}
                    onChange={(e) => setNewL(e.target.value)}
                    className="w-9 px-1.5 py-1 bg-[#0A101C] text-purple-300 border border-white/10 rounded-md text-center font-mono tabular-nums text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPeak}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-wider text-[10px] shadow-md shadow-purple-600/30 cursor-pointer"
              >
                Insert Peak
              </button>
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
            className="overflow-hidden bg-[#050A14] p-3.5 border-b border-white/10 space-y-2 text-xs text-slate-300 font-mono"
          >
            <div className="flex justify-between items-center text-white font-bold font-sans text-[11px]">
              <span>Supported Reflection Formats:</span>
              <button onClick={() => setShowFormatHelp(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#0A101C] p-2 rounded-xl border border-white/5">
                <span className="text-purple-400 font-bold block mb-0.5">Standard (with FWHM):</span>
                <code>28.44, 0.22, 230, 1000, 1 1 1</code>
              </div>
              <div className="bg-[#0A101C] p-2 rounded-xl border border-white/5">
                <span className="text-purple-400 font-bold block mb-0.5">Integral Breadth (Area &amp; I_max):</span>
                <code>28.44, 230, 1000, 1 1 1</code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEW: Interactive Reflection Cards vs Raw CSV Editor */}
      {viewMode === 'table' ? (
        <div className="max-h-[410px] overflow-y-auto custom-scrollbar p-2.5 space-y-2">
          {enrichedPeaks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#050A14] border border-dashed border-white/10 space-y-2">
              <AlertCircle className="w-7 h-7 text-purple-400/60 mx-auto" />
              <p className="text-xs font-bold text-slate-300">No reflections loaded in dataset</p>
            </div>
          ) : (
            enrichedPeaks.map((peak) => {
              const isSelected = peak.idx === (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
              const matchingResult = results[peak.idx];

              let shapeBadge = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
              if (peak.shapeType === 'Cauchy') shapeBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
              else if (peak.shapeType === 'Gauss') shapeBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

              return (
                <div
                  key={peak.idx}
                  onClick={() => setSelectedPeakIdx(peak.idx)}
                  onMouseEnter={() => setHoveredPeakIdx(peak.idx)}
                  onMouseLeave={() => setHoveredPeakIdx(null)}
                  className={`rounded-xl border p-2.5 transition-all font-mono tabular-nums ${
                    isSelected
                      ? 'bg-[#0C1526] border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.12)]'
                      : 'bg-[#09101E] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-slate-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                        #{peak.idx + 1}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        β_obs = {peak.betaObs.toFixed(3)}°
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${shapeBadge}`}>
                        φ = {peak.phi.toFixed(2)} ({peak.shapeType})
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                        d = {peak.dSpacing.toFixed(3)} Å
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {matchingResult && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInspectPeak({ result: matchingResult, index: peak.idx });
                          }}
                          className="p-1 rounded hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                          title="Inspect single-line Voigt derivation"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateRow(peak.idx);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Duplicate reflection"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRow(peak.idx);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete reflection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-1.5 items-center">
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5">2θ (°)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={peak.twoTheta}
                        onChange={(e) => handleUpdateRow(peak.idx, 'twoTheta', e.target.value)}
                        className="w-full px-1.5 py-1 bg-[#050A14] text-white font-bold border border-white/10 focus:border-purple-500/60 rounded-lg text-xs outline-none tabular-nums"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5">FWHM (°)</label>
                      <input
                        type="number"
                        step="0.005"
                        value={peak.fwhm}
                        onChange={(e) => handleUpdateRow(peak.idx, 'fwhm', e.target.value)}
                        className="w-full px-1.5 py-1 bg-[#050A14] text-amber-300 font-bold border border-white/10 focus:border-amber-500/60 rounded-lg text-xs outline-none tabular-nums"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5">Area</label>
                      <input
                        type="number"
                        step="1"
                        value={peak.area}
                        onChange={(e) => handleUpdateRow(peak.idx, 'area', e.target.value)}
                        className="w-full px-1.5 py-1 bg-[#050A14] text-emerald-300 font-bold border border-white/10 focus:border-emerald-500/60 rounded-lg text-xs outline-none tabular-nums"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5">I_max</label>
                      <input
                        type="number"
                        step="50"
                        value={peak.iMax}
                        onChange={(e) => handleUpdateRow(peak.idx, 'iMax', e.target.value)}
                        className="w-full px-1.5 py-1 bg-[#050A14] text-cyan-300 font-bold border border-white/10 focus:border-cyan-500/60 rounded-lg text-xs outline-none tabular-nums"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[7.5px] font-sans font-bold text-slate-500 uppercase block mb-0.5 text-center">(h k l)</label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="number"
                          value={peak.hklVal[0]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'h', e.target.value)}
                          className="w-full py-1 bg-[#050A14] text-purple-300 text-center rounded-md border border-white/10 focus:border-purple-500/60 outline-none text-[11px] font-bold tabular-nums"
                        />
                        <input
                          type="number"
                          value={peak.hklVal[1]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'k', e.target.value)}
                          className="w-full py-1 bg-[#050A14] text-purple-300 text-center rounded-md border border-white/10 focus:border-purple-500/60 outline-none text-[11px] font-bold tabular-nums"
                        />
                        <input
                          type="number"
                          value={peak.hklVal[2]}
                          onChange={(e) => handleUpdateRow(peak.idx, 'l', e.target.value)}
                          className="w-full py-1 bg-[#050A14] text-purple-300 text-center rounded-md border border-white/10 focus:border-purple-500/60 outline-none text-[11px] font-bold tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* RAW CSV / TSV TEXT EDITOR */
        <div className="p-3 space-y-2">
          <div className="relative">
            <textarea
              value={inputData}
              onChange={(e) => onInputChange(e.target.value)}
              rows={7}
              className="w-full px-3 py-2.5 bg-[#050A14] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-2xl focus:ring-1 focus:ring-purple-500/20 outline-none font-mono tabular-nums text-xs leading-relaxed"
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
