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
  BrainCircuit,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScherrerInput } from '../../types';
import { parseScherrerInput } from '../../utils/physics';
import { useSettings } from '../SettingsContext';
import { isDarkTheme } from '../../utils/themeSystem';
import { WHSyntheticPeakModal } from './WHSyntheticPeakModal';
import { WHHKLIndexAssistModal } from './WHHKLIndexAssistModal';
import {
  WHReflectionsGraphic,
  WHEnrichedPeak,
  WHRegressionSummary,
} from './WHReflectionsGraphic';

interface WHPeakDataManagerProps {
  inputData: string;
  onInputChange: (newData: string) => void;
  wavelength: number;
  constantK: number;
  instFwhm: number;
  instrumentalMode?: 'constant' | 'caglioti';
  cagliotiU?: number;
  cagliotiV?: number;
  cagliotiW?: number;
  strainModel?: string;
  isDecouplingEnabled: boolean;
  broadeningModel: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
  excludedIndices: number[];
  onToggleExcludePeak: (index: number) => void;
  onSelectPreset?: (
    data: string,
    name?: string,
    youngsModulus?: number,
    density?: number
  ) => void;
}

export const WHPeakDataManager: React.FC<WHPeakDataManagerProps> = ({
  inputData,
  onInputChange,
  wavelength,
  constantK,
  instFwhm,
  instrumentalMode = 'constant',
  cagliotiU = 0.004,
  cagliotiV = -0.002,
  cagliotiW = 0.01,
  strainModel = 'UDM',
  isDecouplingEnabled,
  broadeningModel,
  excludedIndices,
  onToggleExcludePeak,
  onSelectPreset,
}) => {
  const { theme } = useSettings();
  const dark = isDarkTheme(theme);

  // Mode state: 'cards' | 'matrix' | 'raw'
  const [viewMode, setViewMode] = useState<'cards' | 'matrix' | 'raw'>('cards');
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedPeaks: ScherrerInput[] = useMemo(() => {
    return parseScherrerInput(inputData);
  }, [inputData]);

  const safeSelectedIdx =
    parsedPeaks.length > 0 ? Math.min(selectedPeakIndex, parsedPeaks.length - 1) : 0;

  // Syntax validation for raw mode & health checks
  const validationInfo = useMemo(() => {
    if (!inputData.trim()) {
      return {
        errors: ['Dataset is empty. Add peaks (2θ, FWHM, h, k, l) to begin analysis.'],
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
      if (parts.length < 2) {
        errors.push(
          `Line ${index + 1}: Insufficient values (found ${parts.length}, need at least 2: 2θ and FWHM).`
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
          warnings.push(
            `Line ${index + 1}: (0, 0, 0) is physically invalid for diffracted planes.`
          );
        }
      }

      validCount++;
    });

    if (validCount > 0 && validCount < 3) {
      warnings.push(
        `Dataset contains ${validCount} peak(s). At least 3 non-collinear reflections are recommended for Williamson-Hall linear regression.`
      );
    }

    return { errors, warnings, validCount };
  }, [inputData]);

  // Caglioti / Constant instrumental broadening at 2θ
  const evalInstAt = (twoThetaDeg: number): number => {
    if (!isDecouplingEnabled) return 0;
    if (instrumentalMode === 'constant') return Math.max(0, instFwhm);
    const tanT = Math.tan(((twoThetaDeg / 2) * Math.PI) / 180);
    return Math.sqrt(Math.max(0, cagliotiU * tanT * tanT + cagliotiV * tanT + cagliotiW));
  };

  // Compute base derived physics for each reflection
  const baseDerivedList = useMemo(() => {
    return parsedPeaks.map((peak, idx) => {
      const thetaRad = (peak.twoTheta / 2) * (Math.PI / 180);
      const sinTheta = Math.sin(thetaRad);
      const cosTheta = Math.cos(thetaRad);

      const dSpacing = sinTheta > 0 ? wavelength / (2 * sinTheta) : 0;
      const fourSinTheta = 4 * sinTheta;
      const instFwhmAtPeak = evalInstAt(peak.twoTheta);

      let betaSampleDeg = peak.fwhmObs;
      let isNearInstLimit = false;
      if (instFwhmAtPeak > 0) {
        if (peak.fwhmObs <= instFwhmAtPeak * 1.03) {
          isNearInstLimit = true;
        }
        if (broadeningModel === 'Lorentzian') {
          betaSampleDeg = Math.max(0.001, peak.fwhmObs - instFwhmAtPeak);
        } else if (broadeningModel === 'Pseudo-Voigt') {
          const diffSq = Math.pow(peak.fwhmObs, 2) - Math.pow(instFwhmAtPeak, 2);
          const betaGauss = diffSq > 0 ? Math.sqrt(diffSq) : 0.001;
          const betaLorentz = Math.max(0.001, peak.fwhmObs - instFwhmAtPeak);
          betaSampleDeg = Math.max(0.001, 0.5 * betaGauss + 0.5 * betaLorentz);
        } else {
          const diffSq = Math.pow(peak.fwhmObs, 2) - Math.pow(instFwhmAtPeak, 2);
          betaSampleDeg = diffSq > 0 ? Math.sqrt(diffSq) : 0.001;
        }
      }

      const betaSampleRad = (betaSampleDeg * Math.PI) / 180;
      const betaCosThetaRad = betaSampleRad * cosTheta;
      const betaCosThetaMrad = betaCosThetaRad * 1000;

      const apparentSizeNm =
        betaSampleRad > 0 && cosTheta > 0
          ? (constantK * (wavelength * 0.1)) / (betaSampleRad * cosTheta)
          : 0;

      const sampleSharePct =
        peak.fwhmObs > 0
          ? Math.min(100, Math.max(0, (betaSampleDeg / peak.fwhmObs) * 100))
          : 100;

      return {
        ...peak,
        idx,
        isExcluded: excludedIndices.includes(idx),
        derived: {
          dSpacing,
          fourSinTheta,
          instFwhmAtPeak,
          betaSampleDeg,
          betaCosThetaRad,
          betaCosThetaMrad,
          apparentSizeNm,
          sampleSharePct,
          isNearInstLimit,
          residualMrad: null as number | null,
          isOutlier: false,
        },
      };
    });
  }, [
    parsedPeaks,
    excludedIndices,
    wavelength,
    constantK,
    instFwhm,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    isDecouplingEnabled,
    broadeningModel,
  ]);

  // Live OLS regression preview + per-reflection residual & outlier detection
  const { whRegressionPreview, enrichedPeaks, outlierCount } = useMemo(() => {
    const active = baseDerivedList.filter((p) => !p.isExcluded);
    if (active.length < 2) {
      return {
        whRegressionPreview: null as WHRegressionSummary | null,
        enrichedPeaks: baseDerivedList as WHEnrichedPeak[],
        outlierCount: 0,
      };
    }

    const n = active.length;
    const sumX = active.reduce((s, p) => s + p.derived.fourSinTheta, 0);
    const sumY = active.reduce((s, p) => s + p.derived.betaCosThetaMrad, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;
    let num = 0;
    let den = 0;
    let ssTot = 0;

    active.forEach((p) => {
      const dx = p.derived.fourSinTheta - meanX;
      const dy = p.derived.betaCosThetaMrad - meanY;
      num += dx * dy;
      den += dx * dx;
      ssTot += dy * dy;
    });

    const slopeMrad = den > 1e-12 ? num / den : 0;
    const interceptMrad = meanY - slopeMrad * meanX;

    let ssRes = 0;
    active.forEach((p) => {
      const yPred = interceptMrad + slopeMrad * p.derived.fourSinTheta;
      ssRes += Math.pow(p.derived.betaCosThetaMrad - yPred, 2);
    });

    const rSquared = ssTot > 1e-12 ? Math.max(0, 1 - ssRes / ssTot) : 1;
    const rmsResidualMrad = Math.sqrt(ssRes / Math.max(1, n));
    const interceptRad = interceptMrad / 1000;
    const sizeNm =
      interceptRad > 1e-6 ? (constantK * wavelength * 0.1) / interceptRad : 0;
    const strainPercent = (slopeMrad / 1000) * 100;

    const outlierThreshold = Math.max(0.35, rmsResidualMrad * 1.45);
    let outliers = 0;

    const withResiduals: WHEnrichedPeak[] = baseDerivedList.map((p) => {
      const yPred = interceptMrad + slopeMrad * p.derived.fourSinTheta;
      const residualMrad = p.derived.betaCosThetaMrad - yPred;
      const isOutlier =
        !p.isExcluded && n >= 4 && Math.abs(residualMrad) > outlierThreshold;
      if (isOutlier) outliers++;
      return {
        ...p,
        derived: {
          ...p.derived,
          residualMrad,
          isOutlier,
        },
      };
    });

    return {
      whRegressionPreview: {
        slopeMrad,
        interceptMrad,
        sizeNm,
        strainPercent,
        rSquared,
        rmsResidualMrad,
      },
      enrichedPeaks: withResiduals,
      outlierCount: outliers,
    };
  }, [baseDerivedList, constantK, wavelength]);

  // Dataset summary stats
  const datasetStats = useMemo(() => {
    if (parsedPeaks.length === 0) return null;
    const ttList = parsedPeaks.map((p) => p.twoTheta);
    const minTT = Math.min(...ttList);
    const maxTT = Math.max(...ttList);
    const spread = maxTT - minTT;
    const avgFwhm =
      parsedPeaks.reduce((sum, p) => sum + p.fwhmObs, 0) / parsedPeaks.length;
    const activeCount = parsedPeaks.filter(
      (_, idx) => !excludedIndices.includes(idx)
    ).length;

    return {
      total: parsedPeaks.length,
      active: activeCount,
      excluded: excludedIndices.length,
      minTT,
      maxTT,
      spread,
      avgFwhm,
    };
  }, [parsedPeaks, excludedIndices]);

  // Serialize peaks back to CSV lines
  const serializePeaksToText = (peaks: ScherrerInput[]): string => {
    return peaks
      .map((p) => {
        const tt = p.twoTheta.toFixed(3);
        const f = p.fwhmObs.toFixed(4);
        if (p.hkl) {
          return `${tt}, ${f}, ${p.hkl[0]}, ${p.hkl[1]}, ${p.hkl[2]}`;
        }
        return `${tt}, ${f}`;
      })
      .join('\n');
  };

  const handleUpdateCell = (
    index: number,
    field: 'twoTheta' | 'fwhmObs' | 'h' | 'k' | 'l',
    val: string
  ) => {
    const updated = [...parsedPeaks];
    const peak = { ...updated[index] };

    if (field === 'twoTheta') {
      peak.twoTheta = parseFloat(val) || 0;
    } else if (field === 'fwhmObs') {
      peak.fwhmObs = parseFloat(val) || 0;
    } else {
      const currentHkl = peak.hkl || [1, 1, 1];
      const h = field === 'h' ? parseInt(val, 10) || 0 : currentHkl[0];
      const k = field === 'k' ? parseInt(val, 10) || 0 : currentHkl[1];
      const l = field === 'l' ? parseInt(val, 10) || 0 : currentHkl[2];
      peak.hkl = [h, k, l];
    }

    updated[index] = peak;
    onInputChange(serializePeaksToText(updated));
  };

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

  const handleDeleteRow = (index: number) => {
    const updated = parsedPeaks.filter((_, idx) => idx !== index);
    onInputChange(serializePeaksToText(updated));
    if (selectedPeakIndex >= updated.length) {
      setSelectedPeakIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleDuplicateRow = (index: number) => {
    const target = parsedPeaks[index];
    if (!target) return;
    const duplicated: ScherrerInput = {
      twoTheta: parseFloat((target.twoTheta + 0.5).toFixed(3)),
      fwhmObs: target.fwhmObs,
      hkl: target.hkl ? [...target.hkl] : undefined,
    };
    const updated = [...parsedPeaks];
    updated.splice(index + 1, 0, duplicated);
    onInputChange(serializePeaksToText(updated));
    setSelectedPeakIndex(index + 1);
  };

  const handleSortAscending = () => {
    const sorted = [...parsedPeaks].sort((a, b) => a.twoTheta - b.twoTheta);
    onInputChange(serializePeaksToText(sorted));
  };

  const handleFormatCleanText = () => {
    if (parsedPeaks.length === 0) return;
    const cleaned = [...parsedPeaks]
      .sort((a, b) => a.twoTheta - b.twoTheta)
      .map((p) => {
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

  const handleCopyCSV = () => {
    const header = '2Theta_deg,FWHM_deg,h,k,l\n';
    const body = parsedPeaks
      .map((p) => {
        const h = p.hkl ? p.hkl[0] : '';
        const k = p.hkl ? p.hkl[1] : '';
        const l = p.hkl ? p.hkl[2] : '';
        return `${p.twoTheta.toFixed(3)},${p.fwhmObs.toFixed(4)},${h},${k},${l}`;
      })
      .join('\n');

    navigator.clipboard.writeText(header + body);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleDownloadCSV = () => {
    const header =
      '2Theta_deg,FWHM_deg,h,k,l,d_spacing_A,beta_inst_deg,beta_sample_deg,4sinTheta,betaCosTheta_mrad,apparent_size_nm\n';
    const body = enrichedPeaks
      .map((p) => {
        const d = p.derived;
        const h = p.hkl ? p.hkl[0] : '';
        const k = p.hkl ? p.hkl[1] : '';
        const l = p.hkl ? p.hkl[2] : '';
        return `${p.twoTheta.toFixed(4)},${p.fwhmObs.toFixed(4)},${h},${k},${l},${d.dSpacing.toFixed(4)},${d.instFwhmAtPeak.toFixed(4)},${d.betaSampleDeg.toFixed(4)},${d.fourSinTheta.toFixed(4)},${d.betaCosThetaMrad.toFixed(4)},${d.apparentSizeNm.toFixed(2)}`;
      })
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `williamson_hall_peaks_${new Date().toISOString().slice(0, 10)}.csv`;
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
        const lines = content.split('\n');
        const cleanLines = lines.filter((line) => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return false;
          if (
            t.toLowerCase().includes('theta') ||
            t.toLowerCase().includes('fwhm') ||
            t.toLowerCase().includes('2th')
          ) {
            return false;
          }
          return true;
        });
        onInputChange(cleanLines.join('\n'));
      }
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
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.dat,.xy,.tsv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header & 3-Way View Switcher */}
      <div
        className={`px-3.5 py-3 border-b space-y-2 ${
          dark ? 'border-slate-800 bg-[#0D1320]' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Layers
              className={`w-4 h-4 shrink-0 ${dark ? 'text-cyan-400' : 'text-sky-700'}`}
            />
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-xs font-semibold tracking-tight">
                Reflections Data
              </h3>
              <span className="text-[10.5px] font-mono text-slate-500">
                2θ · FWHM · (h k l)
              </span>
            </div>
          </div>

          {/* 3-Way Data View Switcher */}
          <div
            className={`inline-flex items-center p-0.5 rounded-md border text-[10px] font-mono font-semibold ${
              dark ? 'bg-[#070A12] border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
            role="tablist"
            aria-label="Reflections data view mode"
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

        {/* Unboxed Dataset Health & Regression Readiness Bar */}
        {datasetStats && (
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums text-[10.5px]">
            <div className="flex items-center gap-2 flex-wrap text-slate-500">
              <span className={dark ? 'text-cyan-300 font-bold' : 'text-sky-800 font-bold'}>
                {datasetStats.active}/{datasetStats.total} Active
              </span>
              <span aria-hidden="true">·</span>
              <span>
                2θ{' '}
                <strong className={dark ? 'text-slate-200' : 'text-slate-800'}>
                  {datasetStats.minTT.toFixed(1)}°–{datasetStats.maxTT.toFixed(1)}°
                </strong>{' '}
                (Δ{datasetStats.spread.toFixed(1)}°)
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Mean β{' '}
                <strong className={dark ? 'text-amber-300' : 'text-amber-700'}>
                  {datasetStats.avgFwhm.toFixed(3)}°
                </strong>
              </span>
              {outlierCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      dark ? 'text-rose-300' : 'text-rose-700'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {outlierCount} High Residual
                  </span>
                </>
              )}
            </div>

            {datasetStats.active >= 3 ? (
              <span
                className={`inline-flex items-center gap-1 font-semibold text-[10px] ${
                  dark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                <Check className="w-3 h-3" />
                W-H Fit Ready
                {whRegressionPreview ? ` · R² ${whRegressionPreview.rSquared.toFixed(3)}` : ''}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 font-semibold text-[10px] ${
                  dark ? 'text-amber-400' : 'text-amber-700'
                }`}
                title="Needs at least 3 active peaks for robust linear regression"
              >
                <AlertCircle className="w-3 h-3" /> Need ≥3 Peaks
              </span>
            )}
          </div>
        )}
      </div>

      {/* ================= UPGRADED INTERACTIVE SCIENTIFIC GRAPHIC CONSOLE ================= */}
      {enrichedPeaks.length > 0 && (
        <div className="px-3.5">
          <WHReflectionsGraphic
            enrichedPeaks={enrichedPeaks}
            whRegressionPreview={whRegressionPreview}
            selectedPeakIndex={safeSelectedIdx}
            onSelectPeakIndex={setSelectedPeakIndex}
            onToggleExcludePeak={onToggleExcludePeak}
            wavelength={wavelength}
            constantK={constantK}
            instFwhm={instFwhm}
            instrumentalMode={instrumentalMode}
            cagliotiU={cagliotiU}
            cagliotiV={cagliotiV}
            cagliotiW={cagliotiW}
            isDecouplingEnabled={isDecouplingEnabled}
            broadeningModel={broadeningModel}
            strainModel={strainModel}
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
            title="Sort peaks in ascending 2θ order"
          >
            <ArrowUpDown className="w-3 h-3 text-sky-500" />
            <span>Sort 2θ</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHKLModal(true)}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Algorithmic HKL plane indexing assist"
          >
            <BrainCircuit className="w-3 h-3 text-sky-500" />
            <span>Index (hkl)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSyntheticModal(true)}
            className={`px-2.5 py-1.5 rounded-md border text-[10.5px] font-mono font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Simulate diffraction peaks with specified size and strain"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Synthesize</span>
          </button>
        </div>

        {/* Data Import / Export Controls */}
        <div className="flex items-center gap-1">
          {viewMode === 'raw' && (
            <button
              type="button"
              onClick={handleFormatCleanText}
              className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
              title="Clean formatting and align columns"
            >
              <RefreshCw className="w-3 h-3 text-emerald-500" />
              <span>Format</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Import peak data from CSV or TXT file"
          >
            <Upload className="w-3 h-3 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className={`px-2 py-1.5 rounded-md border text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${subtleBtnClass}`}
            title="Download enriched peak dataset as CSV"
          >
            <Download className="w-3 h-3 text-slate-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCSV}
            className={`p-1.5 rounded-md border cursor-pointer transition-colors ${subtleBtnClass}`}
            title="Copy CSV to clipboard"
            aria-label="Copy CSV to clipboard"
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
            title="Format guidelines"
            aria-label="Format guidelines"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
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
            className={`mx-3.5 p-3 rounded-lg border text-[11px] space-y-1.5 font-mono overflow-hidden ${
              dark
                ? 'bg-[#070A12] border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span className={dark ? 'text-cyan-300' : 'text-sky-800'}>
                Williamson-Hall Peak Data Format
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
            <p className="text-[11px] text-slate-500 font-sans">
              Enter one diffraction reflection per row. Comma, space, or tab delimiters are accepted.
            </p>
            <div
              className={`p-2 rounded border text-[10.5px] space-y-0.5 ${
                dark
                  ? 'bg-[#0B0F19] border-slate-800 text-cyan-300'
                  : 'bg-white border-slate-200 text-sky-900'
              }`}
            >
              <p>2θ (deg), FWHM (deg), h, k, l</p>
              <p className="text-slate-500">28.440, 0.2500, 1, 1, 1</p>
              <p className="text-slate-500">47.300, 0.2800, 2, 2, 0</p>
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
            className={`mx-3.5 p-3 rounded-lg border space-y-2.5 overflow-hidden ${
              dark
                ? 'bg-[#070A12] border-sky-500/40'
                : 'bg-sky-50/50 border-sky-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className={dark ? 'text-sky-300' : 'text-sky-900'}>
                Add Diffraction Reflection
              </span>
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label="Cancel add peak"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-mono text-slate-500 mb-1">
                  2θ (°)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="38.50"
                  value={newTwoTheta}
                  onChange={(e) => setNewTwoTheta(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md text-xs font-mono tabular-nums outline-none ${
                    dark
                      ? 'bg-[#0B0F19] text-cyan-300 border-slate-700 focus:border-cyan-400'
                      : 'bg-white text-sky-900 border-slate-300 focus:border-sky-600'
                  }`}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-mono text-slate-500 mb-1">
                  FWHM (°)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  placeholder="0.32"
                  value={newFwhm}
                  onChange={(e) => setNewFwhm(e.target.value)}
                  className={`w-full px-2 py-1.5 border rounded-md text-xs font-mono tabular-nums outline-none ${
                    dark
                      ? 'bg-[#0B0F19] text-amber-300 border-slate-700 focus:border-amber-400'
                      : 'bg-white text-amber-800 border-slate-300 focus:border-amber-600'
                  }`}
                />
              </div>

              {(['h', 'k', 'l'] as const).map((axis) => {
                const val = axis === 'h' ? newH : axis === 'k' ? newK : newL;
                const setter =
                  axis === 'h' ? setNewH : axis === 'k' ? setNewK : setNewL;
                return (
                  <div key={axis}>
                    <label className="block text-[10px] font-mono text-slate-500 mb-1">
                      {axis}
                    </label>
                    <input
                      type="number"
                      placeholder="1"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      className={`w-full px-2 py-1.5 border rounded-md text-xs font-mono tabular-nums outline-none ${
                        dark
                          ? 'bg-[#0B0F19] text-slate-200 border-slate-700 focus:border-cyan-400'
                          : 'bg-white text-slate-900 border-slate-300 focus:border-sky-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  dark
                    ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                    : 'bg-sky-700 text-white hover:bg-sky-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Append Reflection</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Reflections Data Views: Cards | Matrix Table | Raw CSV */}
      <div className="px-3.5 pb-3.5">
        {viewMode === 'cards' && (
          <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
            {enrichedPeaks.map((peak, idx) => {
              const isExcluded = peak.isExcluded;
              const isSelected = idx === safeSelectedIdx;
              const currentHkl = peak.hkl || [1, 1, 1];
              const instPct = Math.max(0, Math.min(100, 100 - peak.derived.sampleSharePct));

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPeakIndex(idx)}
                  className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    isExcluded
                      ? dark
                        ? 'opacity-50 bg-rose-950/15 border-rose-500/25'
                        : 'opacity-55 bg-rose-50/50 border-rose-200'
                      : isSelected
                        ? dark
                          ? 'bg-[#080D18] border-sky-500/60'
                          : 'bg-sky-50/40 border-sky-400'
                        : dark
                          ? 'bg-[#070A12] border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Row: Peak Identity, d-spacing, Residual / Size, Row Actions */}
                  <div
                    className={`flex items-center justify-between gap-2 pb-2 mb-2 border-b font-mono tabular-nums text-[10.5px] ${
                      dark ? 'border-slate-800/90' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExcludePeak(idx);
                        }}
                        className={`px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                          isExcluded
                            ? dark
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                              : 'bg-rose-50 text-rose-700 border-rose-300'
                            : dark
                              ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                              : 'bg-sky-50 text-sky-800 border-sky-300'
                        }`}
                        title={
                          isExcluded
                            ? 'Click to include in Williamson-Hall regression'
                            : 'Click to exclude outlier from regression'
                        }
                      >
                        {isExcluded ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        <span>#{idx + 1}</span>
                      </button>

                      <span
                        className={`font-bold ${dark ? 'text-cyan-300' : 'text-sky-800'}`}
                      >
                        ({currentHkl.join('')})
                      </span>
                      <span className="text-slate-500" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-500">
                        d{' '}
                        <strong className={dark ? 'text-slate-200' : 'text-slate-800'}>
                          {peak.derived.dSpacing > 0
                            ? `${peak.derived.dSpacing.toFixed(3)} Å`
                            : '—'}
                        </strong>
                      </span>

                      {peak.derived.isOutlier && !isExcluded && (
                        <>
                          <span className="text-slate-500" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[10px] ${
                              dark ? 'text-rose-300' : 'text-rose-700'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Outlier
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`font-semibold ${
                          dark ? 'text-amber-300' : 'text-amber-800'
                        }`}
                        title="Apparent single-peak Scherrer size"
                      >
                        D<sub>app</sub>{' '}
                        {peak.derived.apparentSizeNm > 0
                          ? `${peak.derived.apparentSizeNm.toFixed(1)} nm`
                          : '—'}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateRow(idx);
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
                            handleDeleteRow(idx);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete reflection"
                          aria-label="Delete reflection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Editable Fields (Clean Hairline Grid, No Nested Card-in-Card Boxes) */}
                  <div
                    className="grid grid-cols-12 gap-2.5 items-end font-mono tabular-nums"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="col-span-4">
                      <label className="block text-[9.5px] font-sans font-medium text-slate-500 mb-0.5">
                        2θ Angle (°)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={peak.twoTheta}
                        onChange={(e) =>
                          handleUpdateCell(idx, 'twoTheta', e.target.value)
                        }
                        className={`w-full px-2 py-1 rounded border text-[11px] font-semibold outline-none transition-colors ${
                          dark
                            ? 'bg-[#0B0F19] border-slate-800 text-cyan-300 focus:border-cyan-400'
                            : 'bg-slate-50 border-slate-300 text-sky-900 focus:border-sky-600'
                        }`}
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-[9.5px] font-sans font-medium text-slate-500 mb-0.5">
                        FWHM β<sub>obs</sub> (°)
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        value={peak.fwhmObs}
                        onChange={(e) =>
                          handleUpdateCell(idx, 'fwhmObs', e.target.value)
                        }
                        className={`w-full px-2 py-1 rounded border text-[11px] font-semibold outline-none transition-colors ${
                          dark
                            ? 'bg-[#0B0F19] border-slate-800 text-amber-300 focus:border-amber-400'
                            : 'bg-slate-50 border-slate-300 text-amber-800 focus:border-amber-600'
                        }`}
                      />
                    </div>

                    <div className="col-span-4">
                      <label className="block text-[9.5px] font-sans font-medium text-slate-500 mb-0.5 text-center">
                        Miller (h k l)
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['h', 'k', 'l'] as const).map((axis, aIdx) => (
                          <input
                            key={axis}
                            type="number"
                            value={currentHkl[aIdx]}
                            onChange={(e) =>
                              handleUpdateCell(idx, axis, e.target.value)
                            }
                            className={`w-full text-center py-1 rounded border text-[11px] font-semibold outline-none transition-colors ${
                              dark
                                ? 'bg-[#0B0F19] border-slate-800 text-slate-200 focus:border-cyan-400'
                                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                            }`}
                            placeholder={axis}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Broadening Partition Bar + W-H Coordinates & Fit Residual */}
                  <div className="mt-2 pt-1.5 space-y-1">
                    {isDecouplingEnabled && (
                      <div
                        className={`h-1.5 w-full rounded-xs overflow-hidden flex ${
                          dark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}
                        title={`Instrumental ${instPct.toFixed(0)}% · Sample ${peak.derived.sampleSharePct.toFixed(0)}%`}
                      >
                        <div
                          className="h-full bg-amber-500/80"
                          style={{ width: `${instPct}%` }}
                        />
                        <div
                          className="h-full bg-sky-500/85"
                          style={{ width: `${peak.derived.sampleSharePct}%` }}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] font-mono tabular-nums text-slate-500">
                      <span>
                        4sinθ{' '}
                        <strong className={dark ? 'text-slate-200' : 'text-slate-800'}>
                          {peak.derived.fourSinTheta.toFixed(3)}
                        </strong>{' '}
                        · β<sub>s</sub>cosθ{' '}
                        <strong
                          className={dark ? 'text-emerald-400' : 'text-emerald-700'}
                        >
                          {peak.derived.betaCosThetaMrad.toFixed(2)} mrad
                        </strong>
                      </span>

                      <span className="flex items-center gap-2">
                        <span>
                          β<sub>s</sub> {peak.derived.betaSampleDeg.toFixed(3)}° (
                          {peak.derived.sampleSharePct.toFixed(0)}%)
                        </span>
                        {peak.derived.residualMrad !== null && (
                          <span
                            className={
                              peak.derived.isOutlier
                                ? dark
                                  ? 'text-rose-300 font-bold'
                                  : 'text-rose-700 font-bold'
                                : ''
                            }
                          >
                            Δ {peak.derived.residualMrad >= 0 ? '+' : ''}
                            {peak.derived.residualMrad.toFixed(2)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'matrix' && (
          <div
            className={`max-h-80 overflow-auto custom-scrollbar rounded-lg border ${
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
                  <th className="py-1.5 px-2">β_obs (°)</th>
                  <th className="py-1.5 px-2 text-center">(h k l)</th>
                  <th className="py-1.5 px-2 text-right">d (Å)</th>
                  <th className="py-1.5 px-2 text-right">β_s (°)</th>
                  <th className="py-1.5 px-2 text-right">4sinθ</th>
                  <th className="py-1.5 px-2 text-right">βcosθ</th>
                  <th className="py-1.5 px-2 text-right">Δ Fit</th>
                  <th className="py-1.5 px-2 text-right">Act</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${dark ? 'divide-slate-800/80' : 'divide-slate-200'}`}
              >
                {enrichedPeaks.map((peak, idx) => {
                  const isSelected = idx === safeSelectedIdx;
                  const currentHkl = peak.hkl || [1, 1, 1];
                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedPeakIndex(idx)}
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
                            onToggleExcludePeak(idx);
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
                          <span>{idx + 1}</span>
                        </button>
                      </td>
                      <td
                        className="py-1 px-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="number"
                          step="0.001"
                          value={peak.twoTheta}
                          onChange={(e) =>
                            handleUpdateCell(idx, 'twoTheta', e.target.value)
                          }
                          className={`w-16 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-cyan-300 focus:border-cyan-400'
                              : 'bg-slate-50 border-slate-300 text-sky-900 focus:border-sky-600'
                          }`}
                        />
                      </td>
                      <td
                        className="py-1 px-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="number"
                          step="0.001"
                          value={peak.fwhmObs}
                          onChange={(e) =>
                            handleUpdateCell(idx, 'fwhmObs', e.target.value)
                          }
                          className={`w-16 px-1.5 py-0.5 rounded border text-[10.5px] outline-none ${
                            dark
                              ? 'bg-[#0B0F19] border-slate-800 text-amber-300 focus:border-amber-400'
                              : 'bg-slate-50 border-slate-300 text-amber-800 focus:border-amber-600'
                          }`}
                        />
                      </td>
                      <td
                        className="py-1 px-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-0.5">
                          {(['h', 'k', 'l'] as const).map((axis, aIdx) => (
                            <input
                              key={axis}
                              type="number"
                              value={currentHkl[aIdx]}
                              onChange={(e) =>
                                handleUpdateCell(idx, axis, e.target.value)
                              }
                              className={`w-7 text-center py-0.5 rounded border text-[10px] outline-none ${
                                dark
                                  ? 'bg-[#0B0F19] border-slate-800 text-slate-200 focus:border-cyan-400'
                                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right text-slate-400">
                        {peak.derived.dSpacing.toFixed(3)}
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right font-semibold ${
                          dark ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      >
                        {peak.derived.betaSampleDeg.toFixed(3)}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {peak.derived.fourSinTheta.toFixed(3)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-semibold">
                        {peak.derived.betaCosThetaMrad.toFixed(2)}
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right ${
                          peak.derived.isOutlier
                            ? dark
                              ? 'text-rose-300 font-bold'
                              : 'text-rose-700 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {peak.derived.residualMrad !== null
                          ? `${peak.derived.residualMrad >= 0 ? '+' : ''}${peak.derived.residualMrad.toFixed(2)}`
                          : '—'}
                      </td>
                      <td
                        className="py-1 px-1.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
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
              className={`w-full h-44 px-3 py-2 border rounded-lg outline-none font-mono tabular-nums text-xs leading-relaxed custom-scrollbar ${
                dark
                  ? 'bg-[#070A12] text-cyan-300 border-slate-800 focus:border-cyan-500/60'
                  : 'bg-slate-50 text-sky-900 border-slate-300 focus:border-sky-600'
              }`}
              placeholder="2θ, FWHM, h, k, l"
              spellCheck="false"
            />

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
                {validationInfo.warnings.map((warn, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
          currentPeaks={parsedPeaks.map((p) => ({
            twoTheta: p.twoTheta,
            fwhmObs: p.fwhmObs,
            h: p.hkl ? p.hkl[0] : undefined,
            k: p.hkl ? p.hkl[1] : undefined,
            l: p.hkl ? p.hkl[2] : undefined,
          }))}
          wavelength={wavelength}
          onApplyIndices={(indexedPeaks) => {
            const formatted = indexedPeaks
              .map(
                (p) =>
                  `${p.twoTheta.toFixed(3)}, ${p.fwhmObs.toFixed(4)}, ${p.h}, ${p.k}, ${p.l}`
              )
              .join('\n');
            onInputChange(formatted);
          }}
          onClose={() => setShowHKLModal(false)}
        />
      )}
    </div>
  );
};
