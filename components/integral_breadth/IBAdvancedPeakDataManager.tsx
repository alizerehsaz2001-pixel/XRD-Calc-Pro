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
  Eye,
  EyeOff,
  Layers,
  Zap,
  BrainCircuit,
  Info,
  Calculator,
  ChevronDown,
  Atom,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IBAdvancedInput, IBAdvancedResult } from '../../types';
import {
  parseIBAdvancedInput,
  IBDecouplingMethodKey,
  computeDeKeijserVoigtFractions,
  computeLangfordVoigtBreadth,
} from '../../utils/physics';
import { useSettings } from '../SettingsContext';
import { isDarkTheme } from '../../utils/themeSystem';
import { IBAdvancedSyntheticModal } from './IBAdvancedSyntheticModal';
import { IBAdvancedHKLModal } from './IBAdvancedHKLModal';
import { IBAdvancedProfileCalcModal } from './IBAdvancedProfileCalcModal';
import {
  IBReflectionsGraphic,
  IBGraphicMode,
  IBGraphicPeak,
} from './IBReflectionsGraphic';

interface IBAdvancedPeakDataManagerProps {
  inputData: string;
  onInputChange: (newData: string) => void;
  wavelength: number;
  constantK: number;
  instBetaIB: number;
  instrumentalMode: 'constant' | 'caglioti';
  cagliotiParams: { U: number; V: number; W: number };
  decouplingMethod: IBDecouplingMethodKey;
  materialDensityGcm3: number;
  youngsModulusGPa: number;
  excludedIndices: number[];
  onToggleExcludePeak: (index: number) => void;
  onResetExclusions: () => void;
  selectedMaterial: string;
  onSelectPreset?: (preset: any) => void;
  materialPresets?: Array<{
    label: string;
    data: string;
    desc: string;
    youngsModulus?: number;
    density?: number;
  }>;
  result?: IBAdvancedResult | null;
}

const DECOUPLING_LABELS: Record<IBDecouplingMethodKey, string> = {
  voigt_exact: 'de Keijser Voigt',
  hw_voigt: 'Halder–Wagner',
  squared: 'Gaussian Quad.',
  linear: 'Cauchy Linear',
  none: 'No Deconv.',
};

export const IBAdvancedPeakDataManager: React.FC<IBAdvancedPeakDataManagerProps> = ({
  inputData,
  onInputChange,
  wavelength,
  constantK,
  instBetaIB,
  instrumentalMode,
  cagliotiParams,
  decouplingMethod,
  materialDensityGcm3: _materialDensityGcm3,
  youngsModulusGPa: _youngsModulusGPa,
  excludedIndices,
  onToggleExcludePeak,
  onResetExclusions,
  selectedMaterial,
  onSelectPreset,
  materialPresets = [],
  result,
}) => {
  const { theme } = useSettings();
  const dark = isDarkTheme(theme);

  const [viewMode, setViewMode] = useState<'cards' | 'matrix' | 'raw'>('cards');
  const [graphicMode, setGraphicMode] = useState<IBGraphicMode>('spectrum');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [hoveredPeakIdx, setHoveredPeakIdx] = useState<number | null>(null);

  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [showFormatHelp, setShowFormatHelp] = useState<boolean>(false);
  const [showSyntheticModal, setShowSyntheticModal] = useState<boolean>(false);
  const [showHKLModal, setShowHKLModal] = useState<boolean>(false);
  const [showCalcModal, setShowCalcModal] = useState<boolean>(false);
  const [isPresetsDropdownOpen, setIsPresetsDropdownOpen] = useState<boolean>(false);

  // Quick add form state
  const [newTwoTheta, setNewTwoTheta] = useState<string>('');
  const [newArea, setNewArea] = useState<string>('');
  const [newImax, setNewImax] = useState<string>('1000');
  const [newH, setNewH] = useState<string>('');
  const [newK, setNewK] = useState<string>('');
  const [newL, setNewL] = useState<string>('');
  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);

  const parsedPeaks: IBAdvancedInput[] = useMemo(() => {
    return parseIBAdvancedInput(inputData);
  }, [inputData]);

  const activeSelectedIdx = useMemo(() => {
    if (parsedPeaks.length === 0) return 0;
    return Math.min(selectedPeakIdx, parsedPeaks.length - 1);
  }, [parsedPeaks.length, selectedPeakIdx]);

  // Derived physical metrics per reflection
  const enrichedPeaks = useMemo(() => {
    if (parsedPeaks.length === 0) return [];
    const maxI = Math.max(...parsedPeaks.map((p) => p.iMax), 1);
    const maxArea = Math.max(...parsedPeaks.map((p) => p.area), 1);

    return parsedPeaks.map((peak, idx) => {
      const isExcluded = excludedIndices.includes(idx);
      const betaObs = peak.iMax > 0 ? peak.area / peak.iMax : 0;
      const thetaRad = (peak.twoTheta / 2) * (Math.PI / 180);
      const sinTheta = Math.sin(thetaRad);
      const cosTheta = Math.cos(thetaRad);
      const dSpacing = sinTheta > 1e-6 ? wavelength / (2 * sinTheta) : 0;

      let betaInstDeg = instBetaIB;
      if (instrumentalMode === 'caglioti') {
        const tanTheta = Math.tan(thetaRad);
        const fwhmSq =
          cagliotiParams.U * tanTheta * tanTheta +
          cagliotiParams.V * tanTheta +
          cagliotiParams.W;
        const fwhmInst = Math.sqrt(Math.max(1e-6, fwhmSq));
        betaInstDeg = fwhmInst * 1.064467;
      }

      let betaSampleDeg = betaObs;
      if (
        result?.pointsExtended?.[idx] &&
        Math.abs(result.pointsExtended[idx].twoTheta - peak.twoTheta) < 0.01
      ) {
        betaSampleDeg = result.pointsExtended[idx].betaSampleDeg;
      } else if (decouplingMethod === 'voigt_exact') {
        const obsPhi = peak.fwhm && betaObs > 0 ? peak.fwhm / betaObs : 0.78;
        const obsFrac = computeDeKeijserVoigtFractions(obsPhi);
        const instFrac = computeDeKeijserVoigtFractions(0.8226);
        const bCs = Math.max(
          0,
          betaObs * obsFrac.fCauchy - betaInstDeg * instFrac.fCauchy
        );
        const bGs = Math.sqrt(
          Math.max(
            0,
            Math.pow(betaObs * obsFrac.fGauss, 2) -
              Math.pow(betaInstDeg * instFrac.fGauss, 2)
          )
        );
        betaSampleDeg = computeLangfordVoigtBreadth(bCs, bGs);
      } else if (decouplingMethod === 'squared') {
        betaSampleDeg = Math.sqrt(
          Math.max(0, betaObs * betaObs - betaInstDeg * betaInstDeg)
        );
      } else if (decouplingMethod === 'hw_voigt') {
        if (betaObs > betaInstDeg) {
          betaSampleDeg =
            betaObs - (betaInstDeg * betaInstDeg) / Math.max(1e-6, betaObs);
        } else {
          betaSampleDeg = 0;
        }
      } else if (decouplingMethod === 'linear') {
        betaSampleDeg = Math.max(0, betaObs - betaInstDeg);
      }

      const apparentSizeNm =
        betaSampleDeg > 1e-5 && cosTheta > 1e-5
          ? (constantK * wavelength) /
            (((betaSampleDeg * Math.PI) / 180) * cosTheta) /
            10
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
        relArea: (peak.area / maxArea) * 100,
      };
    });
  }, [
    parsedPeaks,
    excludedIndices,
    wavelength,
    constantK,
    instBetaIB,
    instrumentalMode,
    cagliotiParams,
    decouplingMethod,
    result,
  ]);

  const graphicPeaks: IBGraphicPeak[] = useMemo(
    () =>
      enrichedPeaks.map((p) => ({
        idx: p.idx,
        twoTheta: p.twoTheta,
        fwhm: p.fwhmEst,
        area: p.area,
        iMax: p.iMax,
        betaObs: p.betaObs,
        shapePhi: p.shapePhi,
        dSpacing: p.dSpacing,
        hklLabel: p.hklLabel,
        relIntensity: p.relIntensity,
        isExcluded: p.isExcluded,
        betaInstDeg: p.betaInstDeg,
        betaSampleDeg: p.betaSampleDeg,
        apparentSizeNm: p.apparentSizeNm,
      })),
    [enrichedPeaks]
  );

  // Validation
  const validationInfo = useMemo(() => {
    if (!inputData.trim()) {
      return {
        errors: [
          'Dataset is empty. Add reflections (2θ, Area, I_max [, h k l]) to begin analysis.',
        ],
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
          `Line ${index + 1}: Insufficient values (found ${parts.length}, need at least 3: 2θ, Area, I_max).`
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
        errors.push(
          `Line ${index + 1}: Maximum Intensity I_max (${imax}) must be positive.`
        );
        return;
      }

      const beta = area / imax;
      if (beta > 6.0) {
        warnings.push(
          `Line ${index + 1}: Integral breadth β = ${beta.toFixed(2)}° is unusually large (> 6°). Check Area/I_max units.`
        );
      }

      if (parts.length === 6 || parts.length >= 7) {
        const h = parts.length === 6 ? parts[3] : parts[4];
        const k = parts.length === 6 ? parts[4] : parts[5];
        const l = parts.length === 6 ? parts[5] : parts[6];
        if (h === 0 && k === 0 && l === 0) {
          warnings.push(
            `Line ${index + 1}: (0, 0, 0) is physically invalid for diffracted planes.`
          );
        }
      }

      validCount++;
    });

    if (validCount > 0 && validCount < 2) {
      warnings.push(
        'Dataset contains only 1 reflection. At least 2 reflections are required for linear size-strain regression.'
      );
    }

    return { errors, warnings, validCount };
  }, [inputData]);

  // Dataset summary stats
  const datasetStats = useMemo(() => {
    if (enrichedPeaks.length === 0) return null;
    const ttList = enrichedPeaks.map((p) => p.twoTheta);
    const minTT = Math.min(...ttList);
    const maxTT = Math.max(...ttList);
    const spread = maxTT - minTT;
    const avgBeta =
      enrichedPeaks.reduce((sum, p) => sum + p.betaObs, 0) / enrichedPeaks.length;
    const avgSampleBeta =
      enrichedPeaks.reduce((sum, p) => sum + p.betaSampleDeg, 0) /
      enrichedPeaks.length;
    const activeCount = enrichedPeaks.filter((p) => !p.isExcluded).length;

    return {
      total: enrichedPeaks.length,
      active: activeCount,
      excluded: excludedIndices.length,
      minTT,
      maxTT,
      spread,
      avgBeta,
      avgSampleBeta,
    };
  }, [enrichedPeaks, excludedIndices]);

  const serializePeaks = (peaks: IBAdvancedInput[]): string => {
    return peaks
      .map((p) => {
        const hklStr = p.hkl ? `, ${p.hkl.join(' ')}` : '';
        if (p.fwhm !== undefined && p.fwhm > 0) {
          return `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.iMax.toFixed(0)}${hklStr}`;
        }
        return `${p.twoTheta.toFixed(2)}, ${p.area.toFixed(1)}, ${p.iMax.toFixed(0)}${hklStr}`;
      })
      .join('\n');
  };

  const handleUpdateRow = (
    index: number,
    field: keyof IBAdvancedInput | 'h' | 'k' | 'l',
    value: any
  ) => {
    const updated = [...parsedPeaks];
    if (!updated[index]) return;

    if (field === 'h' || field === 'k' || field === 'l') {
      const currentHkl = updated[index].hkl || [1, 1, 1];
      const h = field === 'h' ? parseInt(value, 10) || 0 : currentHkl[0];
      const k = field === 'k' ? parseInt(value, 10) || 0 : currentHkl[1];
      const l = field === 'l' ? parseInt(value, 10) || 0 : currentHkl[2];
      updated[index] = { ...updated[index], hkl: [h, k, l] };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    onInputChange(serializePeaks(updated));
  };

  const handleDeleteRow = (index: number) => {
    const updated = parsedPeaks.filter((_, i) => i !== index);
    onInputChange(serializePeaks(updated));
    if (selectedPeakIdx >= updated.length) {
      setSelectedPeakIdx(Math.max(0, updated.length - 1));
    }
  };

  const handleDuplicateRow = (index: number) => {
    const peak = parsedPeaks[index];
    if (!peak) return;
    const duplicated: IBAdvancedInput = {
      ...peak,
      twoTheta: parseFloat((peak.twoTheta + 0.5).toFixed(2)),
      hkl: peak.hkl ? [...peak.hkl] : undefined,
    };
    const updated = [
      ...parsedPeaks.slice(0, index + 1),
      duplicated,
      ...parsedPeaks.slice(index + 1),
    ];
    onInputChange(serializePeaks(updated));
    setSelectedPeakIdx(index + 1);
  };

  const handleSortAscending = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onInputChange(serializePeaks(sorted));
  };

  const handleNormalizeIntensities = () => {
    if (parsedPeaks.length === 0) return;
    const maxI = Math.max(...parsedPeaks.map((p) => p.iMax));
    if (maxI <= 0) return;
    const scale = 1000 / maxI;
    const normalized = parsedPeaks.map((p) => ({
      ...p,
      area: parseFloat((p.area * scale).toFixed(1)),
      iMax: Math.round(p.iMax * scale),
    }));
    onInputChange(serializePeaks(normalized));
  };

  const handleQuickAdd = () => {
    const tt = parseFloat(newTwoTheta);
    const area = parseFloat(newArea);
    const imax = parseFloat(newImax) || 1000;

    if (
      isNaN(tt) ||
      isNaN(area) ||
      tt <= 0 ||
      tt >= 180 ||
      area <= 0 ||
      imax <= 0
    ) {
      return;
    }

    let hkl: [number, number, number] | undefined = undefined;
    if (newH !== '' && newK !== '' && newL !== '') {
      hkl = [
        parseInt(newH, 10) || 0,
        parseInt(newK, 10) || 0,
        parseInt(newL, 10) || 0,
      ];
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

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(inputData);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleExportCSV = () => {
    let csv =
      '2Theta_deg,Area,Imax,Observed_Beta_deg,Sample_Beta_deg,d_Angstrom,h,k,l\n';
    enrichedPeaks.forEach((p) => {
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      csv += `${p.twoTheta.toFixed(2)},${p.area.toFixed(1)},${p.iMax.toFixed(0)},${p.betaObs.toFixed(4)},${p.betaSampleDeg.toFixed(4)},${p.dSpacing.toFixed(4)},${h},${k},${l}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `ib_reflections_${selectedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split('\n');
      const validRows: string[] = [];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (
          !trimmed ||
          trimmed.startsWith('#') ||
          trimmed.toLowerCase().includes('theta') ||
          trimmed.toLowerCase().includes('area')
        ) {
          return;
        }
        const parts = trimmed
          .split(/[\s,]+/)
          .map((s) => parseFloat(s))
          .filter((n) => !isNaN(n));
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
    onInputChange(serializePeaks(parsedPeaks));
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
        accept=".csv,.txt,.dat,.xy"
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
                2θ · Area · I<sub>max</sub> · (h k l) · Stokes–Wilson β = Area/I<sub>max</sub>
              </span>
            </div>
          </div>

          <div
            className={`inline-flex items-center p-0.5 rounded-md border text-[10px] font-mono font-semibold ${
              dark ? 'bg-[#070A12] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
            role="tablist"
            aria-label="Advanced integral breadth reflections view"
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

        {/* Unboxed Dataset Summary Bar */}
        {datasetStats && (
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums text-[10.5px]">
            <div className="flex items-center gap-2 flex-wrap text-slate-500">
              <span className={dark ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'}>
                {datasetStats.active}/{datasetStats.total} Active
              </span>
              {datasetStats.excluded > 0 && (
                <span className={dark ? 'text-amber-300' : 'text-amber-700'}>
                  ({datasetStats.excluded} excl)
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span>
                2θ{' '}
                <strong className={dark ? 'text-slate-200' : 'text-slate-800'}>
                  {datasetStats.minTT.toFixed(1)}°–{datasetStats.maxTT.toFixed(1)}°
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Mean β<sub>obs</sub>{' '}
                <strong className={dark ? 'text-amber-300' : 'text-amber-700'}>
                  {datasetStats.avgBeta.toFixed(4)}°
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Mean β<sub>s</sub>{' '}
                <strong className={dark ? 'text-emerald-300' : 'text-emerald-700'}>
                  {datasetStats.avgSampleBeta.toFixed(4)}°
                </strong>
              </span>
            </div>

            <span className="text-[10px] text-slate-500">
              {DECOUPLING_LABELS[decouplingMethod] || decouplingMethod}
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
            hasDeconvolution={true}
            instrumentalMode={instrumentalMode}
            instBetaIB={instBetaIB}
            cagliotiParams={cagliotiParams}
            decouplingLabel={DECOUPLING_LABELS[decouplingMethod] || decouplingMethod}
            onToggleExcludePeak={onToggleExcludePeak}
            controlledMode={graphicMode}
            onModeChange={setGraphicMode}
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
            title="Sort reflections strictly by 2θ ascending"
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
          >
            <ArrowUpDown className="w-3 h-3 text-sky-500" />
            <span>Sort 2θ</span>
          </button>

          <button
            type="button"
            onClick={handleNormalizeIntensities}
            title="Normalize peak intensities so max(I_max) = 1000 while preserving β_obs = Area / I_max"
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Norm I_max</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
          >
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>Synthesize</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHKLModal(true)}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
          >
            <BrainCircuit className="w-3 h-3 text-amber-500" />
            <span>Index (hkl)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalcModal(true)}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
          >
            <Calculator className="w-3 h-3 text-emerald-500" />
            <span>Calc β</span>
          </button>

          {materialPresets.length > 0 && (
            <div className="relative" ref={presetsRef}>
              <button
                type="button"
                onClick={() => setIsPresetsDropdownOpen(!isPresetsDropdownOpen)}
                className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
              >
                <Atom className="w-3 h-3 text-sky-500" />
                <span>Presets</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {isPresetsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className={`absolute top-full left-0 mt-1 w-64 border rounded-lg shadow-xl p-1 z-50 max-h-60 overflow-y-auto custom-scrollbar ${
                      dark
                        ? 'bg-[#070A12] border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {materialPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (onSelectPreset) onSelectPreset(preset);
                          setIsPresetsDropdownOpen(false);
                          setSelectedPeakIdx(0);
                        }}
                        className={`w-full text-left p-2 rounded-md transition-colors cursor-pointer ${
                          selectedMaterial === preset.label
                            ? dark
                              ? 'bg-sky-500/15 text-sky-300'
                              : 'bg-sky-50 text-sky-900'
                            : dark
                              ? 'hover:bg-slate-800/80'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-semibold">{preset.label}</div>
                        <div className="text-[9.5px] text-slate-500 font-mono truncate">
                          {preset.desc}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Action Group */}
        <div className="flex items-center gap-1">
          {excludedIndices.length > 0 && (
            <button
              type="button"
              onClick={onResetExclusions}
              className={`px-2 py-1.5 rounded-md border text-[10px] font-mono font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                dark
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/35'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              Reset Excl
            </button>
          )}

          {viewMode === 'raw' && (
            <button
              type="button"
              onClick={handleAutoClean}
              className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
              title="Format and clean whitespace"
            >
              <RefreshCw className="w-3 h-3 text-emerald-500" />
              <span>Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import reflection data from file (CSV, TXT)"
            className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
          >
            <Upload className="w-3 h-3 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Download reflections as CSV"
            className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyToClipboard}
            title="Copy reflection data to clipboard"
            aria-label="Copy reflection data to clipboard"
            className={`p-1.5 rounded-md border cursor-pointer transition-colors ${subtleBtnClass}`}
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
            title="Formatting & Integral Breadth Guide"
            aria-label="Formatting & Integral Breadth Guide"
            className={`p-1.5 rounded-md border cursor-pointer transition-colors ${subtleBtnClass}`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
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
            className={`mx-3.5 p-3 rounded-lg border text-[11px] font-mono space-y-2 overflow-hidden ${
              dark
                ? 'bg-[#070A12] border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span
                className={`flex items-center gap-1.5 ${
                  dark ? 'text-sky-300' : 'text-sky-800'
                }`}
              >
                <Info className="w-3.5 h-3.5" /> Integral Breadth Data Format Guide
              </span>
              <button
                type="button"
                onClick={() => setShowFormatHelp(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label="Close format guide"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              Each diffraction reflection is defined by its Bragg angle 2θ (°),
              integrated net peak Area (counts·°), peak height I_max (counts), and
              optional Miller indices (h k l).
            </p>
            <div
              className={`p-2 rounded border space-y-1 text-[10.5px] ${
                dark ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <span className="text-slate-500">Standard: </span>
                <code className={dark ? 'text-cyan-300' : 'text-sky-900'}>
                  28.44, 230, 1000, 1 1 1
                </code>
              </div>
              <div>
                <span className="text-slate-500">With FWHM: </span>
                <code className={dark ? 'text-emerald-300' : 'text-emerald-800'}>
                  28.44, 0.23, 230, 1000, 1 1 1
                </code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Quick Add Form */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`mx-3.5 p-3 rounded-lg border space-y-2.5 overflow-hidden ${
              dark
                ? 'bg-[#070A12] border-sky-500/40'
                : 'bg-sky-50/50 border-sky-300'
            }`}
          >
            <div className="text-[11px] font-semibold flex items-center justify-between">
              <span className={dark ? 'text-sky-300' : 'text-sky-900'}>
                Quick Add Reflection
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

            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">2θ (°)*</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="28.44"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md tabular-nums outline-none ${
                    dark
                      ? 'bg-[#0B0F19] text-sky-300 border-slate-700 focus:border-sky-400'
                      : 'bg-white text-sky-900 border-slate-300 focus:border-sky-600'
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
                  className={`w-full px-2 py-1.5 border rounded-md tabular-nums outline-none ${
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
                  step="50"
                  placeholder="1000"
                  value={newImax}
                  onChange={(e) => setNewImax(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md tabular-nums outline-none ${
                    dark
                      ? 'bg-[#0B0F19] text-amber-300 border-slate-700 focus:border-amber-400'
                      : 'bg-white text-amber-800 border-slate-300 focus:border-amber-600'
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
                        className={`w-10 px-1.5 py-1 border rounded-md text-xs font-mono tabular-nums text-center outline-none ${
                          dark
                            ? 'bg-[#0B0F19] text-slate-200 border-slate-700 focus:border-sky-400'
                            : 'bg-white text-slate-900 border-slate-300 focus:border-sky-600'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={!newTwoTheta || !newArea || !newImax}
                className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors disabled:opacity-40 ${
                  dark
                    ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    : 'bg-sky-700 text-white hover:bg-sky-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Append Peak</span>
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
                className={`p-8 text-center rounded-lg border border-dashed text-xs font-mono ${
                  dark
                    ? 'bg-[#070A12] border-slate-800 text-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-600'
                }`}
              >
                No reflections loaded. Click Add Peak, Synthesize, or Presets to begin.
              </div>
            ) : (
              enrichedPeaks.map((peak) => {
                const isSelected =
                  peak.idx ===
                  (hoveredPeakIdx !== null ? hoveredPeakIdx : activeSelectedIdx);
                const sampleSharePct =
                  peak.betaObs > 0
                    ? Math.min(100, Math.max(0, (peak.betaSampleDeg / peak.betaObs) * 100))
                    : 0;
                const instPct = Math.max(0, 100 - sampleSharePct);

                return (
                  <div
                    key={peak.idx}
                    onClick={() => setSelectedPeakIdx(peak.idx)}
                    onMouseEnter={() => setHoveredPeakIdx(peak.idx)}
                    onMouseLeave={() => setHoveredPeakIdx(null)}
                    className={`rounded-lg border p-2.5 transition-colors cursor-pointer font-mono tabular-nums ${
                      peak.isExcluded
                        ? dark
                          ? 'bg-rose-950/15 border-rose-500/25 opacity-50'
                          : 'bg-rose-50/50 border-rose-200 opacity-55'
                        : isSelected
                          ? dark
                            ? 'bg-[#080D18] border-sky-500/60'
                            : 'bg-sky-50/40 border-sky-400'
                          : dark
                            ? 'bg-[#070A12] border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Unboxed Telemetry Row */}
                    <div
                      className={`flex items-center justify-between gap-2 pb-2 mb-2 border-b text-[10.5px] ${
                        dark ? 'border-slate-800/90' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExcludePeak(peak.idx);
                          }}
                          title={
                            peak.isExcluded
                              ? 'Include reflection in regression'
                              : 'Exclude reflection as outlier'
                          }
                          className={`px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                            peak.isExcluded
                              ? dark
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                                : 'bg-rose-50 text-rose-700 border-rose-300'
                              : dark
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                                : 'bg-sky-50 text-sky-800 border-sky-300'
                          }`}
                        >
                          {peak.isExcluded ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          <span>#{peak.idx + 1}</span>
                        </button>

                        <span
                          className={`font-bold ${dark ? 'text-cyan-300' : 'text-sky-800'}`}
                        >
                          {peak.hklLabel}
                        </span>
                        <span className="text-slate-500" aria-hidden="true">
                          ·
                        </span>
                        <span
                          className={
                            dark ? 'text-amber-300 font-bold' : 'text-amber-800 font-bold'
                          }
                        >
                          β {peak.betaObs.toFixed(4)}°
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
                        {peak.apparentSizeNm > 0 && (
                          <>
                            <span className="text-slate-500" aria-hidden="true">
                              ·
                            </span>
                            <span
                              className={
                                dark
                                  ? 'text-emerald-400 font-semibold'
                                  : 'text-emerald-700 font-semibold'
                              }
                            >
                              D≈{peak.apparentSizeNm.toFixed(1)} nm
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPeakIdx(peak.idx);
                            setGraphicMode('geometry');
                          }}
                          title="Inspect Stokes–Wilson Box Law Geometry"
                          aria-label="Inspect Stokes–Wilson Box Law Geometry"
                          className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors cursor-pointer"
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
                          aria-label="Duplicate reflection"
                          className="p-1 text-slate-400 hover:text-sky-400 rounded transition-colors cursor-pointer"
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
                          aria-label="Delete reflection"
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
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
                            handleUpdateRow(
                              peak.idx,
                              'twoTheta',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`w-full px-1.5 py-1 border rounded text-[11px] font-semibold outline-none ${
                            peak.isExcluded ? 'line-through opacity-60' : ''
                          } ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-sky-300 focus:border-sky-400'
                              : 'bg-slate-50 border-slate-300 text-sky-900 focus:border-sky-600'
                          }`}
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[9.5px] font-sans font-medium text-slate-500 block mb-0.5">
                          Area (cts·°)
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={peak.area}
                          onChange={(e) =>
                            handleUpdateRow(
                              peak.idx,
                              'area',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`w-full px-1.5 py-1 border rounded text-[11px] font-semibold outline-none ${
                            peak.isExcluded ? 'line-through opacity-60' : ''
                          } ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-emerald-300 focus:border-emerald-400'
                              : 'bg-slate-50 border-slate-300 text-emerald-800 focus:border-emerald-600'
                          }`}
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[9.5px] font-sans font-medium text-slate-500 block mb-0.5">
                          I<sub>max</sub> (cts)
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={peak.iMax}
                          onChange={(e) =>
                            handleUpdateRow(
                              peak.idx,
                              'iMax',
                              parseFloat(e.target.value) || 1000
                            )
                          }
                          className={`w-full px-1.5 py-1 border rounded text-[11px] font-semibold outline-none ${
                            peak.isExcluded ? 'line-through opacity-60' : ''
                          } ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-amber-300 focus:border-amber-400'
                              : 'bg-slate-50 border-slate-300 text-amber-800 focus:border-amber-600'
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
                                  ? 'bg-[#0B0F19] border-slate-800 text-slate-200 focus:border-sky-400'
                                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Broadening Deconvolution Partition Bar */}
                    <div className="mt-2 pt-1.5 space-y-1">
                      <div
                        className={`h-1.5 w-full rounded-xs overflow-hidden flex ${
                          dark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                        title={`Instrumental ${instPct.toFixed(0)}% · Sample ${sampleSharePct.toFixed(0)}%`}
                      >
                        <div
                          className="h-full bg-amber-500/80"
                          style={{ width: `${instPct}%` }}
                        />
                        <div
                          className="h-full bg-sky-500/85"
                          style={{ width: `${sampleSharePct}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-slate-500">
                        <span>
                          β<sub>sample</sub>{' '}
                          <strong className={dark ? 'text-sky-300' : 'text-sky-800'}>
                            {peak.betaSampleDeg.toFixed(4)}° ({sampleSharePct.toFixed(0)}%)
                          </strong>
                        </span>
                        <span>
                          β<sub>inst</sub>{' '}
                          <strong className={dark ? 'text-amber-300' : 'text-amber-700'}>
                            {peak.betaInstDeg.toFixed(4)}°
                          </strong>{' '}
                          · φ {peak.shapePhi.toFixed(2)}
                        </span>
                      </div>
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
                  <th className="py-1.5 px-2">Area</th>
                  <th className="py-1.5 px-2">I_max</th>
                  <th className="py-1.5 px-2 text-center">(h k l)</th>
                  <th className="py-1.5 px-2 text-right">β_obs</th>
                  <th className="py-1.5 px-2 text-right">β_s</th>
                  <th className="py-1.5 px-2 text-right">d (Å)</th>
                  <th className="py-1.5 px-2 text-right">D_app</th>
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
                        peak.isExcluded
                          ? 'opacity-45'
                          : isSelected
                            ? dark
                              ? 'bg-sky-500/12'
                              : 'bg-sky-50'
                            : dark
                              ? 'hover:bg-slate-900/60'
                              : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExcludePeak(peak.idx);
                          }}
                          className={`inline-flex items-center gap-1 cursor-pointer ${
                            peak.isExcluded
                              ? 'text-rose-400'
                              : dark
                                ? 'text-cyan-300'
                                : 'text-sky-700'
                          }`}
                          title={peak.isExcluded ? 'Include peak' : 'Exclude peak'}
                        >
                          {peak.isExcluded ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          <span>{peak.idx + 1}</span>
                        </button>
                      </td>
                      <td className="py-1 px-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="0.01"
                          value={peak.twoTheta}
                          onChange={(e) =>
                            handleUpdateRow(
                              peak.idx,
                              'twoTheta',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`w-15 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-sky-300 focus:border-sky-400'
                              : 'bg-slate-50 border-slate-300 text-sky-900 focus:border-sky-600'
                          }`}
                        />
                      </td>
                      <td className="py-1 px-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          step="1"
                          value={peak.area}
                          onChange={(e) =>
                            handleUpdateRow(
                              peak.idx,
                              'area',
                              parseFloat(e.target.value) || 0
                            )
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
                            handleUpdateRow(
                              peak.idx,
                              'iMax',
                              parseFloat(e.target.value) || 1000
                            )
                          }
                          className={`w-14 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-amber-300 focus:border-amber-400'
                              : 'bg-slate-50 border-slate-300 text-amber-800 focus:border-amber-600'
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
                                  ? 'bg-[#0B0F19] border-slate-800 text-slate-200 focus:border-sky-400'
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
                          dark ? 'text-sky-300' : 'text-sky-800'
                        }`}
                      >
                        {peak.betaSampleDeg.toFixed(3)}°
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-400">
                        {peak.dSpacing.toFixed(3)}
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right font-semibold ${
                          dark ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      >
                        {peak.apparentSizeNm > 0
                          ? `${peak.apparentSizeNm.toFixed(1)}`
                          : '—'}
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
              placeholder="28.44, 230, 1000, 1 1 1&#10;47.30, 280, 950, 2 2 0&#10;56.12, 350, 900, 3 1 1"
              className={`w-full h-44 px-3 py-2.5 border rounded-lg outline-none custom-scrollbar leading-relaxed font-mono tabular-nums text-xs ${
                dark
                  ? 'bg-[#070A12] text-sky-300 border-slate-800 focus:border-sky-500/50 placeholder:text-slate-600'
                  : 'bg-slate-50 text-sky-900 border-slate-300 focus:border-sky-600 placeholder:text-slate-400'
              }`}
              spellCheck="false"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>
                {validationInfo.validCount} valid reflection
                {validationInfo.validCount === 1 ? '' : 's'}
              </span>
              <span>2θ, Area, I_max [, h k l]</span>
            </div>

            {validationInfo.errors.length > 0 && (
              <div
                className={`p-2.5 rounded-lg border font-mono text-[10px] space-y-1 ${
                  dark
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                {validationInfo.errors.slice(0, 3).map((err, i) => (
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
                {validationInfo.warnings.slice(0, 3).map((warn, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>{warn}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
              youngsModulus: youngsMod,
            });
          }
        }}
      />

      <IBAdvancedHKLModal
        isOpen={showHKLModal}
        onClose={() => setShowHKLModal(false)}
        wavelength={wavelength}
        currentPeaks={parsedPeaks.map((p) => ({
          twoTheta: p.twoTheta,
          area: p.area,
          iMax: p.iMax,
          fwhm: p.fwhm,
          h: p.hkl ? p.hkl[0] : undefined,
          k: p.hkl ? p.hkl[1] : undefined,
          l: p.hkl ? p.hkl[2] : undefined,
        }))}
        onApplyIndices={(indexed) => {
          const updated = indexed.map((item) => ({
            twoTheta: item.twoTheta,
            area: item.area,
            iMax: item.iMax,
            fwhm: item.fwhm,
            hkl: [item.h, item.k, item.l] as [number, number, number],
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
