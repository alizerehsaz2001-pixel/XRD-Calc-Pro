import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Table,
  LayoutGrid,
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
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../../types';
import {
  parseIntegralBreadthInput,
  computeDeKeijserVoigtFractions,
} from '../../utils/physics';
import { useSettings } from '../SettingsContext';
import { isDarkTheme } from '../../utils/themeSystem';
import { SyntheticReflectionGeneratorModal } from './SyntheticReflectionGeneratorModal';
import { ReflectionInspectionDrawer } from './ReflectionInspectionDrawer';
import { IBReflectionsGraphic, IBGraphicPeak } from './IBReflectionsGraphic';

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
  selectedMaterial: _selectedMaterial,
  onSelectPreset,
  results = [],
}) => {
  const { theme } = useSettings();
  const dark = isDarkTheme(theme);

  const [viewMode, setViewMode] = useState<'cards' | 'matrix' | 'raw'>('cards');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);

  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [showFormatHelp, setShowFormatHelp] = useState<boolean>(false);
  const [showSyntheticModal, setShowSyntheticModal] = useState<boolean>(false);
  const [selectedInspectPeak, setSelectedInspectPeak] = useState<{
    result: IntegralBreadthResult;
    index: number;
  } | null>(null);

  // Quick Add form state
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newFwhm, setNewFwhm] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('');
  const [newImax, setNewImax] = useState<string>('1000');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedPeaks = useMemo(() => {
    return parseIntegralBreadthInput(inputData);
  }, [inputData]);

  const activeSelectedIdx = useMemo(() => {
    if (parsedPeaks.length === 0) return 0;
    return Math.min(selectedPeakIdx, parsedPeaks.length - 1);
  }, [parsedPeaks.length, selectedPeakIdx]);

  const enrichedPeaks = useMemo(() => {
    if (parsedPeaks.length === 0) return [];
    const maxI = Math.max(...parsedPeaks.map((p) => p.iMax), 1);
    return parsedPeaks.map((p, idx) => {
      const betaObs = p.iMax > 0 ? p.area / p.iMax : 0;
      const phi = betaObs > 0 ? p.fwhm / betaObs : 0.78;
      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
      const dSpacing =
        Math.sin(thetaRad) > 1e-6 ? wavelength / (2 * Math.sin(thetaRad)) : 0;
      const hklVal = p.hkl || [1, 1, 1];
      const hklLabel = `(${hklVal[0]}${hklVal[1]}${hklVal[2]})`;
      let shapeType: 'Cauchy' | 'Voigt' | 'Gauss' = 'Voigt';
      if (phi <= 0.67) shapeType = 'Cauchy';
      else if (phi >= 0.88) shapeType = 'Gauss';

      const voigtFractions = computeDeKeijserVoigtFractions(phi);

      return {
        ...p,
        idx,
        betaObs,
        phi,
        dSpacing,
        hklVal,
        hklLabel,
        shapeType,
        voigtFractions,
        relIntensity: (p.iMax / maxI) * 100,
      };
    });
  }, [parsedPeaks, wavelength]);

  const graphicPeaks: IBGraphicPeak[] = useMemo(
    () =>
      enrichedPeaks.map((p) => ({
        idx: p.idx,
        twoTheta: p.twoTheta,
        fwhm: p.fwhm,
        area: p.area,
        iMax: p.iMax,
        betaObs: p.betaObs,
        shapePhi: p.phi,
        dSpacing: p.dSpacing,
        hklLabel: p.hklLabel,
        relIntensity: p.relIntensity,
      })),
    [enrichedPeaks]
  );

  // Syntax validation for raw mode
  const validationInfo = useMemo(() => {
    if (!inputData.trim()) {
      return {
        errors: ['Dataset is empty. Add reflections to begin analysis.'],
        warnings: [],
        validCount: 0,
      };
    }
    const lines = inputData.split('\n');
    const errors: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed
        .split(/[\s,]+/)
        .map((s) => parseFloat(s))
        .filter((n) => !isNaN(n));
      if (parts.length < 3) {
        errors.push(
          `Line ${index + 1}: Insufficient values (found ${parts.length}, need at least 3: 2θ, Area, Imax).`
        );
        return;
      }

      const tt = parts[0];
      if (tt <= 0 || tt >= 180) {
        errors.push(
          `Line ${index + 1}: Bragg angle 2θ (${tt}°) is out of valid range (0° < 2θ < 180°).`
        );
        return;
      }

      if (parts.length === 3) {
        const area = parts[1];
        const imax = parts[2];
        if (area <= 0 || imax <= 0) {
          errors.push(
            `Line ${index + 1}: Area (${area}) and I_max (${imax}) must be positive.`
          );
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
          errors.push(
            `Line ${index + 1}: Area (${area}) and I_max (${imax}) must be positive.`
          );
          return;
        }
        const beta = area / imax;
        const phi = fwhm / beta;
        if (phi < 0.55 || phi > 1.1) {
          warnings.push(
            `Line ${index + 1}: Apparent shape factor φ = ${phi.toFixed(2)} is outside standard Voigt regime (0.637–0.939).`
          );
        }
      }
      validCount++;
    });

    return { errors, warnings, validCount };
  }, [inputData]);

  // Aggregate statistics
  const reflectionStats = useMemo(() => {
    if (enrichedPeaks.length === 0) return null;
    const ttValues = enrichedPeaks.map((p) => p.twoTheta);
    const minTT = Math.min(...ttValues);
    const maxTT = Math.max(...ttValues);
    const spreadTT = maxTT - minTT;
    const avgBeta =
      enrichedPeaks.reduce((a, b) => a + b.betaObs, 0) / enrichedPeaks.length;
    const avgPhi =
      enrichedPeaks.reduce((a, b) => a + b.phi, 0) / enrichedPeaks.length;

    let profileRegime = 'Voigt (Mixed Size & Strain)';
    if (avgPhi <= 0.68) profileRegime = 'Cauchy (Size-Dominant)';
    else if (avgPhi >= 0.88) profileRegime = 'Gaussian (Strain-Dominant)';

    return {
      count: enrichedPeaks.length,
      minTT,
      maxTT,
      spreadTT,
      avgBeta,
      avgPhi,
      profileRegime,
    };
  }, [enrichedPeaks]);

  const serializePeaks = (peaks: IntegralBreadthInput[]): string => {
    return peaks
      .map((p) => {
        const hklStr =
          p.hkl && Array.isArray(p.hkl) && p.hkl.length === 3
            ? `, ${p.hkl.join(' ')}`
            : '';
        return `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.iMax.toFixed(0)}${hklStr}`;
      })
      .join('\n');
  };

  const handleUpdateRow = (
    index: number,
    field: keyof IntegralBreadthInput | 'h' | 'k' | 'l',
    value: string
  ) => {
    const updated = [...parsedPeaks];
    const peak = { ...updated[index] };

    if (field === 'twoTheta') peak.twoTheta = parseFloat(value) || 0;
    if (field === 'fwhm') peak.fwhm = parseFloat(value) || 0;
    if (field === 'area') peak.area = parseFloat(value) || 0;
    if (field === 'iMax') peak.iMax = parseFloat(value) || 0;

    if (field === 'h' || field === 'k' || field === 'l') {
      const currentHkl = peak.hkl || [0, 0, 0];
      const h = field === 'h' ? parseInt(value, 10) || 0 : currentHkl[0];
      const k = field === 'k' ? parseInt(value, 10) || 0 : currentHkl[1];
      const l = field === 'l' ? parseInt(value, 10) || 0 : currentHkl[2];
      peak.hkl = [h, k, l];
    }

    updated[index] = peak;
    onInputChange(serializePeaks(updated));
  };

  const handleDeleteRow = (index: number) => {
    const updated = parsedPeaks.filter((_, idx) => idx !== index);
    onInputChange(serializePeaks(updated));
    if (selectedPeakIdx >= updated.length) {
      setSelectedPeakIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleDuplicateRow = (index: number) => {
    const peak = parsedPeaks[index];
    const duplicated: IntegralBreadthInput = {
      ...peak,
      twoTheta: parseFloat((peak.twoTheta + 0.5).toFixed(2)),
    };
    const updated = [
      ...parsedPeaks.slice(0, index + 1),
      duplicated,
      ...parsedPeaks.slice(index + 1),
    ];
    onInputChange(serializePeaks(updated));
    setSelectedPeakIdx(index + 1);
  };

  const handleAddPeak = () => {
    const tt = parseFloat(newTwoTheta);
    const f = parseFloat(newFwhm);
    const a = parseFloat(newArea);
    const imax = parseFloat(newImax) || 1000;

    if (
      isNaN(tt) ||
      tt <= 0 ||
      tt >= 180 ||
      isNaN(a) ||
      a <= 0 ||
      isNaN(imax) ||
      imax <= 0
    ) {
      return;
    }

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
      hkl,
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
    const maxI = Math.max(...parsedPeaks.map((p) => p.iMax));
    if (maxI <= 0) return;

    const factor = 1000 / maxI;
    const normalized = parsedPeaks.map((p) => ({
      ...p,
      iMax: Math.round(p.iMax * factor),
      area: parseFloat((p.area * factor).toFixed(1)),
    }));
    onInputChange(serializePeaks(normalized));
  };

  const handleAutoCleanDelimiters = () => {
    if (!inputData.trim()) return;
    onInputChange(serializePeaks(parsedPeaks));
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(inputData);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleDownloadCSV = () => {
    if (parsedPeaks.length === 0) return;
    const header =
      '2Theta_deg,FWHM_deg,Area_counts_deg,Imax_counts,Beta_obs_deg,Shape_phi,h,k,l\n';
    const rows = enrichedPeaks
      .map((p) => {
        const h = p.hkl ? p.hkl[0] : '';
        const k = p.hkl ? p.hkl[1] : '';
        const l = p.hkl ? p.hkl[2] : '';
        return `${p.twoTheta},${p.fwhm},${p.area},${p.iMax},${p.betaObs.toFixed(4)},${p.phi.toFixed(4)},${h},${k},${l}`;
      })
      .join('\n');

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
      if (content) onInputChange(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const subtleBtnClass = dark
    ? 'bg-[#070A12] hover:bg-slate-900 border-slate-800 text-slate-200'
    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div
      className={`rounded-xl border overflow-hidden space-y-3 transition-colors ${
        dark
          ? 'bg-[#0B0F19] border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.txt,.xy,.dat"
        className="hidden"
      />

      {/* Top Header & 3-Way Data View Switcher */}
      <div
        className={`px-3.5 py-3 border-b space-y-2 ${
          dark ? 'border-slate-800 bg-[#0D1320]' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Layers
              className={`w-4 h-4 shrink-0 ${dark ? 'text-sky-400' : 'text-sky-700'}`}
            />
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-xs font-semibold tracking-tight">
                Reflections Data
              </h3>
              <span className="text-[10.5px] font-mono text-slate-500">
                2θ · FWHM · Area · I<sub>max</sub> · (h k l)
              </span>
            </div>
          </div>

          <div
            className={`inline-flex items-center p-0.5 rounded-md border text-[10px] font-mono font-semibold ${
              dark ? 'bg-[#070A12] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
            role="tablist"
            aria-label="Integral breadth reflections view mode"
          >
            {[
              { id: 'cards' as const, label: 'Cards', icon: LayoutGrid },
              { id: 'matrix' as const, label: 'Matrix', icon: Table },
              { id: 'raw' as const, label: 'CSV', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setViewMode(tab.id)}
                  className={`px-2 py-1 rounded transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? dark
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                        : 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                      : dark
                        ? 'text-slate-400 hover:text-slate-200 border border-transparent'
                        : 'text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unboxed Dataset Health & Voigt Summary Strip */}
        {reflectionStats && (
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums text-[10.5px]">
            <div className="flex items-center gap-2 flex-wrap text-slate-500">
              <span className={dark ? 'text-cyan-300 font-bold' : 'text-sky-800 font-bold'}>
                {reflectionStats.count} Peak{reflectionStats.count === 1 ? '' : 's'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                2θ{' '}
                <strong className={dark ? 'text-slate-200' : 'text-slate-800'}>
                  {reflectionStats.minTT.toFixed(1)}°–{reflectionStats.maxTT.toFixed(1)}°
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Mean β{' '}
                <strong className={dark ? 'text-amber-300' : 'text-amber-700'}>
                  {reflectionStats.avgBeta.toFixed(3)}°
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Mean φ{' '}
                <strong className={dark ? 'text-violet-300' : 'text-violet-700'}>
                  {reflectionStats.avgPhi.toFixed(3)}
                </strong>
              </span>
            </div>

            <span
              className={`font-semibold text-[10px] ${
                dark ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              {reflectionStats.profileRegime}
            </span>
          </div>
        )}
      </div>

      {/* UPGRADED INTERACTIVE SCIENTIFIC GRAPHIC CONSOLE */}
      {graphicPeaks.length > 0 && (
        <div className="px-3.5">
          <IBReflectionsGraphic
            peaks={graphicPeaks}
            selectedPeakIdx={activeSelectedIdx}
            onSelectPeakIdx={setSelectedPeakIdx}
            hoveredPeakIdx={hoveredPeakIdx}
            onHoverPeakIdx={setHoveredPeakIdx}
            wavelength={wavelength}
            constantK={constantK}
            hasDeconvolution={false}
          />
        </div>
      )}

      {/* Action Toolbar */}
      <div className="px-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              dark
                ? 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-200'
                : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Peak</span>
          </button>

          <button
            type="button"
            onClick={handleSortAscending}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Sort reflections in ascending 2θ order"
          >
            <ArrowUpDown className="w-3 h-3 text-sky-500" />
            <span>Sort 2θ</span>
          </button>

          <button
            type="button"
            onClick={handleNormalizeIntensities}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Scale peak areas so maximum peak I_max = 1000 counts"
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Normalize</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Generate synthetic Bragg reflections"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Synthesize</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {viewMode === 'raw' && (
            <button
              type="button"
              onClick={handleAutoCleanDelimiters}
              className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
              title="Auto-clean delimiters and align columns"
            >
              <RefreshCw className="w-3 h-3 text-emerald-500" />
              <span>Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Import reflections from CSV, TXT, or XY file"
          >
            <Upload className="w-3 h-3 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Download reflections as CSV"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyClipboard}
            className={`p-1.5 rounded-md border cursor-pointer transition-colors ${subtleBtnClass}`}
            title="Copy reflections to clipboard"
            aria-label="Copy reflections to clipboard"
          >
            {copiedNotification ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowFormatHelp(!showFormatHelp)}
            className={`p-1.5 rounded-md border cursor-pointer transition-colors ${subtleBtnClass}`}
            title="Show formatting help"
            aria-label="Show formatting help"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Format Help Expandable */}
      <AnimatePresence>
        {showFormatHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mx-3.5 p-3 rounded-lg border text-[11px] space-y-2 font-mono overflow-hidden ${
              dark
                ? 'bg-[#070A12] border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex justify-between items-center font-semibold">
              <span className={dark ? 'text-cyan-300' : 'text-sky-800'}>
                Supported Integral Breadth Formats
              </span>
              <button
                type="button"
                onClick={() => setShowFormatHelp(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label="Close format help"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
              <div
                className={`p-2 rounded border ${
                  dark ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-slate-500 block mb-0.5">Standard (with FWHM):</span>
                <code className={dark ? 'text-cyan-300' : 'text-sky-900'}>
                  28.44, 0.22, 230, 1000, 1 1 1
                </code>
              </div>
              <div
                className={`p-2 rounded border ${
                  dark ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <span className="text-slate-500 block mb-0.5">Area &amp; I_max only:</span>
                <code className={dark ? 'text-cyan-300' : 'text-sky-900'}>
                  28.44, 230, 1000, 1 1 1
                </code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Expandable Form */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`mx-3.5 p-3 rounded-lg border space-y-2.5 overflow-hidden ${
              dark
                ? 'bg-[#070A12] border-sky-500/40'
                : 'bg-sky-50/50 border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className={dark ? 'text-sky-300' : 'text-sky-900'}>
                Add New Diffraction Reflection
              </span>
              {parseFloat(newArea) > 0 && parseFloat(newImax) > 0 && (
                <span
                  className={`font-mono tabular-nums ${
                    dark ? 'text-emerald-300' : 'text-emerald-700'
                  }`}
                >
                  β_obs = {(parseFloat(newArea) / parseFloat(newImax)).toFixed(4)}°
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">2θ (°)*</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="28.44"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md outline-none tabular-nums ${
                    dark
                      ? 'bg-[#0B0F19] text-cyan-300 border-slate-700 focus:border-cyan-400'
                      : 'bg-white text-sky-900 border-slate-300 focus:border-sky-600'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">FWHM (°)</label>
                <input
                  type="number"
                  step="0.005"
                  placeholder="0.22"
                  value={newFwhm}
                  onChange={(e) => setNewFwhm(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md outline-none tabular-nums ${
                    dark
                      ? 'bg-[#0B0F19] text-amber-300 border-slate-700 focus:border-amber-400'
                      : 'bg-white text-amber-800 border-slate-300 focus:border-amber-600'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Area (cts·°)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="230"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md outline-none tabular-nums ${
                    dark
                      ? 'bg-[#0B0F19] text-emerald-300 border-slate-700 focus:border-emerald-400'
                      : 'bg-white text-emerald-800 border-slate-300 focus:border-emerald-600'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">I_max (cts)*</label>
                <input
                  type="number"
                  step="1"
                  placeholder="1000"
                  value={newImax}
                  onChange={(e) => setNewImax(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md outline-none tabular-nums ${
                    dark
                      ? 'bg-[#0B0F19] text-slate-200 border-slate-700 focus:border-cyan-400'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-sky-600'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-500">Miller (h k l):</span>
                <div className="flex gap-1">
                  {(['h', 'k', 'l'] as const).map((axis) => {
                    const val = axis === 'h' ? newH : axis === 'k' ? newK : newL;
                    const setter =
                      axis === 'h' ? setNewH : axis === 'k' ? setNewK : setNewL;
                    return (
                      <input
                        key={axis}
                        type="number"
                        placeholder={axis}
                        value={val}
                        onChange={(e) => setter(e.target.value)}
                        className={`w-10 px-1.5 py-1 border rounded-md text-center font-mono tabular-nums text-xs outline-none ${
                          dark
                            ? 'bg-[#0B0F19] text-slate-200 border-slate-700 focus:border-cyan-400'
                            : 'bg-white text-slate-900 border-slate-300 focus:border-sky-600'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPeak}
                className={`px-3 py-1.5 rounded-md font-mono font-semibold text-[11px] inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  dark
                    ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    : 'bg-sky-700 text-white hover:bg-sky-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Peak</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Reflections Views: Cards | Matrix | Raw CSV */}
      <div className="px-3.5 pb-3.5">
        {viewMode === 'cards' && (
          <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
            {enrichedPeaks.length === 0 ? (
              <div
                className={`p-8 text-center rounded-lg border border-dashed space-y-2 ${
                  dark
                    ? 'bg-[#070A12] border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-300 text-slate-600'
                }`}
              >
                <AlertCircle className="w-6 h-6 mx-auto opacity-60" />
                <p className="text-xs font-medium">No reflections loaded in dataset</p>
              </div>
            ) : (
              enrichedPeaks.map((peak) => {
                const isSelected =
                  peak.idx ===
                  (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
                const matchingResult = results[peak.idx];
                const cauchyPct = Math.round(
                  Math.max(0, Math.min(1, peak.voigtFractions.fCauchy)) * 100
                );

                return (
                  <div
                    key={peak.idx}
                    onClick={() => setSelectedPeakIdx(peak.idx)}
                    onMouseEnter={() => setHoveredPeakIdx(peak.idx)}
                    onMouseLeave={() => setHoveredPeakIdx(null)}
                    className={`rounded-lg border p-2.5 transition-colors cursor-pointer font-mono tabular-nums ${
                      isSelected
                        ? dark
                          ? 'bg-[#080D18] border-sky-500/60'
                          : 'bg-sky-50/40 border-sky-400'
                        : dark
                          ? 'bg-[#070A12] border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Unboxed Telemetry Header */}
                    <div
                      className={`flex items-center justify-between gap-2 pb-2 mb-2 border-b text-[10.5px] ${
                        dark ? 'border-slate-800/90' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-500">
                          #{peak.idx + 1}
                        </span>
                        <span
                          className={`font-bold ${
                            dark ? 'text-cyan-300' : 'text-sky-800'
                          }`}
                        >
                          {peak.hklLabel}
                        </span>
                        <span className="text-slate-500" aria-hidden="true">
                          ·
                        </span>
                        <span className={dark ? 'text-amber-300 font-bold' : 'text-amber-800 font-bold'}>
                          β {peak.betaObs.toFixed(4)}°
                        </span>
                        <span className="text-slate-500" aria-hidden="true">
                          ·
                        </span>
                        <span className={dark ? 'text-violet-300 font-semibold' : 'text-violet-800 font-semibold'}>
                          φ {peak.phi.toFixed(2)} ({peak.shapeType})
                        </span>
                        <span className="text-slate-500" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-slate-500">
                          d{' '}
                          <strong className={dark ? 'text-slate-200' : 'text-slate-800'}>
                            {peak.dSpacing.toFixed(3)} Å
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {matchingResult && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInspectPeak({
                                result: matchingResult,
                                index: peak.idx,
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-sky-400 rounded transition-colors cursor-pointer"
                            title="Inspect single-line Voigt derivation"
                            aria-label="Inspect single-line Voigt derivation"
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
                          className="p-1 text-slate-400 hover:text-sky-400 rounded transition-colors cursor-pointer"
                          title="Duplicate reflection"
                          aria-label="Duplicate reflection"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(peak.idx);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete reflection"
                          aria-label="Delete reflection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Editable Fields */}
                    <div
                      className="grid grid-cols-12 gap-2 items-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="col-span-3">
                        <label className="text-[9.5px] font-sans font-medium text-slate-500 block mb-0.5">
                          2θ (°)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={peak.twoTheta}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'twoTheta', e.target.value)
                          }
                          className={`w-full px-1.5 py-1 border rounded text-[11px] font-semibold outline-none ${
                            dark
                              ? 'bg-[#0B0F19] text-cyan-300 border-slate-800 focus:border-cyan-400'
                              : 'bg-slate-50 text-sky-900 border-slate-300 focus:border-sky-600'
                          }`}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9.5px] font-sans font-medium text-slate-500 block mb-0.5">
                          FWHM
                        </label>
                        <input
                          type="number"
                          step="0.005"
                          value={peak.fwhm}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'fwhm', e.target.value)
                          }
                          className={`w-full px-1.5 py-1 border rounded text-[11px] font-semibold outline-none ${
                            dark
                              ? 'bg-[#0B0F19] text-amber-300 border-slate-800 focus:border-amber-400'
                              : 'bg-slate-50 text-amber-800 border-slate-300 focus:border-amber-600'
                          }`}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9.5px] font-sans font-medium text-slate-500 block mb-0.5">
                          Area
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={peak.area}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'area', e.target.value)
                          }
                          className={`w-full px-1.5 py-1 border rounded text-[11px] font-semibold outline-none ${
                            dark
                              ? 'bg-[#0B0F19] text-emerald-300 border-slate-800 focus:border-emerald-400'
                              : 'bg-slate-50 text-emerald-800 border-slate-300 focus:border-emerald-600'
                          }`}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9.5px] font-sans font-medium text-slate-500 block mb-0.5">
                          I<sub>max</sub>
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={peak.iMax}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'iMax', e.target.value)
                          }
                          className={`w-full px-1.5 py-1 border rounded text-[11px] font-semibold outline-none ${
                            dark
                              ? 'bg-[#0B0F19] text-slate-200 border-slate-800 focus:border-cyan-400'
                              : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-sky-600'
                          }`}
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[9.5px] font-sans font-medium text-slate-500 block mb-0.5 text-center">
                          (h k l)
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['h', 'k', 'l'] as const).map((axis, aIdx) => (
                            <input
                              key={axis}
                              type="number"
                              value={peak.hklVal[aIdx]}
                              onChange={(e) =>
                                handleUpdateRow(peak.idx, axis, e.target.value)
                              }
                              className={`w-full py-1 text-center border rounded text-[11px] font-semibold outline-none ${
                                dark
                                  ? 'bg-[#0B0F19] text-slate-200 border-slate-800 focus:border-cyan-400'
                                  : 'bg-slate-50 text-slate-900 border-slate-300 focus:border-sky-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Voigt Cauchy/Gauss Partition Micro-Bar */}
                    <div className="mt-2 pt-1.5 flex items-center gap-2 text-[9.5px] text-slate-500">
                      <span className={dark ? 'text-sky-300' : 'text-sky-800'}>
                        f<sub>C</sub> {cauchyPct}%
                      </span>
                      <div
                        className={`flex-1 h-1.5 rounded-xs overflow-hidden flex ${
                          dark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                        title={`Cauchy (Size): ${cauchyPct}% · Gauss (Strain): ${100 - cauchyPct}%`}
                      >
                        <div
                          className="h-full bg-sky-500/85"
                          style={{ width: `${cauchyPct}%` }}
                        />
                        <div
                          className="h-full bg-emerald-500/80"
                          style={{ width: `${100 - cauchyPct}%` }}
                        />
                      </div>
                      <span className={dark ? 'text-emerald-300' : 'text-emerald-700'}>
                        f<sub>G</sub> {100 - cauchyPct}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewMode === 'matrix' && (
          <div
            className={`max-h-96 overflow-auto custom-scrollbar rounded-lg border ${
              dark ? 'border-slate-800 bg-[#070A12]' : 'border-slate-200 bg-white'
            }`}
          >
            <table className="w-full text-left border-collapse font-mono tabular-nums text-[10.5px]">
              <thead
                className={`sticky top-0 z-10 border-b text-[9.5px] uppercase tracking-wider ${
                  dark
                    ? 'bg-[#0D1320] border-slate-800 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <tr>
                  <th className="py-1.5 px-2">#</th>
                  <th className="py-1.5 px-2">2θ (°)</th>
                  <th className="py-1.5 px-2">FWHM</th>
                  <th className="py-1.5 px-2">Area</th>
                  <th className="py-1.5 px-2">I_max</th>
                  <th className="py-1.5 px-2 text-center">(h k l)</th>
                  <th className="py-1.5 px-2 text-right">β_obs</th>
                  <th className="py-1.5 px-2 text-right">φ</th>
                  <th className="py-1.5 px-2 text-right">d (Å)</th>
                  <th className="py-1.5 px-2 text-right">Act</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${dark ? 'divide-slate-800/80' : 'divide-slate-200'}`}
              >
                {enrichedPeaks.map((peak) => {
                  const isSelected = peak.idx === activeSelectedIdx;
                  return (
                    <tr
                      key={peak.idx}
                      onClick={() => setSelectedPeakIdx(peak.idx)}
                      onMouseEnter={() => setHoveredPeakIdx(peak.idx)}
                      onMouseLeave={() => setHoveredPeakIdx(null)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? dark
                            ? 'bg-sky-500/12'
                            : 'bg-sky-50'
                          : dark
                            ? 'hover:bg-slate-900/60'
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-1.5 px-2 text-slate-500">{peak.idx + 1}</td>
                      <td className="py-1 px-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.01"
                          value={peak.twoTheta}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'twoTheta', e.target.value)
                          }
                          className={`w-15 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-cyan-300 focus:border-cyan-400'
                              : 'bg-slate-50 border-slate-300 text-sky-900 focus:border-sky-600'
                          }`}
                        />
                      </td>
                      <td className="py-1 px-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.005"
                          value={peak.fwhm}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'fwhm', e.target.value)
                          }
                          className={`w-14 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-amber-300 focus:border-amber-400'
                              : 'bg-slate-50 border-slate-300 text-amber-800 focus:border-amber-600'
                          }`}
                        />
                      </td>
                      <td className="py-1 px-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="1"
                          value={peak.area}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'area', e.target.value)
                          }
                          className={`w-14 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-emerald-300 focus:border-emerald-400'
                              : 'bg-slate-50 border-slate-300 text-emerald-800 focus:border-emerald-600'
                          }`}
                        />
                      </td>
                      <td className="py-1 px-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="50"
                          value={peak.iMax}
                          onChange={(e) =>
                            handleUpdateRow(peak.idx, 'iMax', e.target.value)
                          }
                          className={`w-14 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-slate-200 focus:border-cyan-400'
                              : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                          }`}
                        />
                      </td>
                      <td className="py-1 px-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-0.5">
                          {(['h', 'k', 'l'] as const).map((axis, aIdx) => (
                            <input
                              key={axis}
                              type="number"
                              value={peak.hklVal[aIdx]}
                              onChange={(e) =>
                                handleUpdateRow(peak.idx, axis, e.target.value)
                              }
                              className={`w-6 text-center py-0.5 rounded border text-[10px] outline-none ${
                                dark
                                  ? 'bg-[#0B0F19] border-slate-800 text-slate-200 focus:border-cyan-400'
                                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right font-bold ${
                          dark ? 'text-amber-300' : 'text-amber-800'
                        }`}
                      >
                        {peak.betaObs.toFixed(3)}°
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right font-semibold ${
                          dark ? 'text-violet-300' : 'text-violet-800'
                        }`}
                      >
                        {peak.phi.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-400">
                        {peak.dSpacing.toFixed(3)}
                      </td>
                      <td
                        className="py-1 px-1.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(peak.idx)}
                          className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Delete reflection"
                          aria-label="Delete reflection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === 'raw' && (
          <div className="space-y-2">
            <textarea
              value={inputData}
              onChange={(e) => onInputChange(e.target.value)}
              rows={7}
              className={`w-full px-3 py-2.5 border rounded-lg outline-none font-mono tabular-nums text-xs leading-relaxed custom-scrollbar ${
                dark
                  ? 'bg-[#070A12] text-cyan-300 border-slate-800 focus:border-cyan-500/60'
                  : 'bg-slate-50 text-sky-900 border-slate-300 focus:border-sky-600'
              }`}
              placeholder="28.44, 0.22, 230, 1000, 1 1 1"
              spellCheck="false"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>
                {validationInfo.validCount} valid reflection
                {validationInfo.validCount === 1 ? '' : 's'} parsed
              </span>
              <span>2θ, FWHM, Area, I_max, h k l</span>
            </div>

            {validationInfo.errors.length > 0 && (
              <div
                className={`p-2.5 rounded-lg border font-mono text-[10px] space-y-1 ${
                  dark
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                {validationInfo.errors.map((err, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            {validationInfo.warnings.length > 0 && (
              <div
                className={`p-2.5 rounded-lg border font-mono text-[10px] space-y-1 ${
                  dark
                    ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}
              >
                {validationInfo.warnings.slice(0, 3).map((w, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
              icon: '🧪',
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
