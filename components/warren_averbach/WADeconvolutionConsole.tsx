import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Lock,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Table2,
  Trash2,
  Waves
} from 'lucide-react';
import { WAInputPoint, WAReciprocalOrderInfo } from '../../types';
import { computeFourierFromBraggProfile } from '../../utils/physics';

export interface WAMaterialPresetItem {
  id: string;
  name: string;
  system: string;
  hklPair: string;
  d1: number;
  d2: number;
  d3?: number;
  d4?: number;
  burgersNm: number;
  youngsGPa: number;
  contrastC: number;
  cutoffRadius: number;
  densityGcm3: number;
  data: string;
  description: string;
}

export type WAInputMode = 'direct_peaks' | 'fourier_coeffs' | 'profile_dft';
export type WAReciprocalUnit = 'd' | 's' | 'twoTheta';

interface WADeconvolutionConsoleProps {
  presets: WAMaterialPresetItem[];
  activePresetId: string;
  onLoadPreset: (preset: WAMaterialPresetItem) => void;

  // Input Mode
  inputMode: WAInputMode;
  setInputMode: (mode: WAInputMode) => void;

  // Reciprocal lattice & reflection orders (d in Angstroms)
  d1: number;
  setD1: (v: number) => void;
  d2: number;
  setD2: (v: number) => void;
  d3: number | undefined;
  setD3: (v: number | undefined) => void;
  d4: number | undefined;
  setD4: (v: number | undefined) => void;
  enableOrder3: boolean;
  setEnableOrder3: (v: boolean) => void;
  enableOrder4: boolean;
  setEnableOrder4: (v: boolean) => void;

  // Direct Peaks inputs
  directWavelength: number;
  setDirectWavelength: (v: number) => void;
  directFwhmInst: number;
  setDirectFwhmInst: (v: number) => void;
  directPeak1TwoTheta: number;
  setDirectPeak1TwoTheta: (v: number) => void;
  directPeak1Fwhm: number;
  setDirectPeak1Fwhm: (v: number) => void;
  directPeak1Eta: number;
  setDirectPeak1Eta: (v: number) => void;
  directPeak2TwoTheta: number;
  setDirectPeak2TwoTheta: (v: number) => void;
  directPeak2Fwhm: number;
  setDirectPeak2Fwhm: (v: number) => void;
  directPeak2Eta: number;
  setDirectPeak2Eta: (v: number) => void;
  directUsePeak3: boolean;
  setDirectUsePeak3: (v: boolean) => void;
  directPeak3TwoTheta: number;
  setDirectPeak3TwoTheta: (v: number) => void;
  directPeak3Fwhm: number;
  setDirectPeak3Fwhm: (v: number) => void;
  directPeak3Eta: number;
  setDirectPeak3Eta: (v: number) => void;
  directHookSim: number;
  setDirectHookSim: (v: number) => void;
  onSynthesizeFromPeaks: () => void;
  onOpenPeakConverterModal: () => void;

  // Fourier CSV & parsed points
  dataInput: string;
  setDataInput: (v: string) => void;
  parsedPoints: WAInputPoint[];
  onApplyDFTResult: (res: { dataString: string; d1: number; d2: number; hasInstStandard: boolean }) => void;

  // Physics & Correction Parameters
  shapeFactor: number;
  setShapeFactor: (v: number) => void;
  strainModel: string;
  setStrainModel: (v: string) => void;
  instrumentalCorrection: string;
  setInstrumentalCorrection: (v: string) => void;
  backgroundModel: string;
  setBackgroundModel: (v: string) => void;
  instrumentalFactor: number;
  setInstrumentalFactor: (v: number) => void;
  backgroundOffset: number;
  setBackgroundOffset: (v: number) => void;
  cutoffRadiusValue: number;
  setCutoffRadiusValue: (v: number) => void;
  hookEffectCorrection: 'none' | 'linear_tangent' | 'polynomial' | 'spline_regularization';
  setHookEffectCorrection: (v: 'none' | 'linear_tangent' | 'polynomial' | 'spline_regularization') => void;
  hookMinL: number | undefined;
  setHookMinL: (v: number | undefined) => void;
  hookMaxL: number | undefined;
  setHookMaxL: (v: number | undefined) => void;
  burgersVectorNm: number;
  setBurgersVectorNm: (v: number) => void;
  youngsModulusGPa: number;
  setYoungsModulusGPa: (v: number) => void;
  contrastFactorC: number;
  setContrastFactorC: (v: number) => void;
  materialDensityGcm3: number;
  setMaterialDensityGcm3: (v: number) => void;

  // Diagnostics & Execution
  reciprocalOrders?: WAReciprocalOrderInfo[];
  harmonicRatioD1D2?: number;
  harmonicCheckPassed?: boolean;
  diagnosticWarnings?: string[];
  onTriggerCalculation: () => void;
  calculationFlash: boolean;
}

const ANODE_OPTIONS = [
  { label: 'Cu Kα₁', lambda: 1.5406 },
  { label: 'Co Kα₁', lambda: 1.789 },
  { label: 'Mo Kα₁', lambda: 0.7107 }
];

const generateSampleBraggScan = (
  twoTheta0: number,
  fwhmDeg: number,
  eta: number,
  peakHeight: number,
  bgBase: number,
  seedOffset: number
): string => {
  const halfSpan = Math.max(1.8, fwhmDeg * 4.5);
  const step = Math.max(0.02, (halfSpan * 2) / 90);
  const sigma = fwhmDeg / (2 * Math.sqrt(2 * Math.LN2));
  const gamma = fwhmDeg / 2;
  const rows: string[] = [`# 2Theta[deg], Intensity[counts] (Peak @ ${twoTheta0.toFixed(2)}°)`];
  let idx = 0;
  for (let tt = twoTheta0 - halfSpan; tt <= twoTheta0 + halfSpan + 1e-6; tt += step) {
    const dx = tt - twoTheta0;
    const g = Math.exp(-(dx * dx) / (2 * sigma * sigma));
    const l = 1 / (1 + (dx * dx) / (gamma * gamma));
    const pv = eta * l + (1 - eta) * g;
    const bg = bgBase + (tt - (twoTheta0 - halfSpan)) * 1.4;
    const ripple = Math.sin((idx + seedOffset) * 12.9898) * Math.sqrt(Math.max(10, bg + peakHeight * pv)) * 0.18;
    const intensity = Math.max(1, bg + peakHeight * pv + ripple);
    rows.push(`${tt.toFixed(3)}, ${intensity.toFixed(1)}`);
    idx++;
  }
  return rows.join('\n');
};

export const WADeconvolutionConsole: React.FC<WADeconvolutionConsoleProps> = ({
  presets,
  activePresetId,
  onLoadPreset,
  inputMode,
  setInputMode,
  d1,
  setD1,
  d2,
  setD2,
  d3,
  setD3,
  d4,
  setD4,
  enableOrder3,
  setEnableOrder3,
  enableOrder4,
  setEnableOrder4,
  directWavelength,
  setDirectWavelength,
  directFwhmInst,
  setDirectFwhmInst,
  directPeak1TwoTheta,
  setDirectPeak1TwoTheta,
  directPeak1Fwhm,
  setDirectPeak1Fwhm,
  directPeak1Eta,
  setDirectPeak1Eta,
  directPeak2TwoTheta,
  setDirectPeak2TwoTheta,
  directPeak2Fwhm,
  setDirectPeak2Fwhm,
  directPeak2Eta,
  setDirectPeak2Eta,
  directUsePeak3,
  setDirectUsePeak3,
  directPeak3TwoTheta,
  setDirectPeak3TwoTheta,
  directPeak3Fwhm,
  setDirectPeak3Fwhm,
  directPeak3Eta,
  setDirectPeak3Eta,
  directHookSim,
  setDirectHookSim,
  onSynthesizeFromPeaks,
  onOpenPeakConverterModal,
  dataInput,
  setDataInput,
  parsedPoints,
  onApplyDFTResult,
  shapeFactor,
  setShapeFactor,
  strainModel,
  setStrainModel,
  instrumentalCorrection,
  setInstrumentalCorrection,
  backgroundModel,
  setBackgroundModel,
  instrumentalFactor,
  setInstrumentalFactor,
  backgroundOffset,
  setBackgroundOffset,
  cutoffRadiusValue,
  setCutoffRadiusValue,
  hookEffectCorrection,
  setHookEffectCorrection,
  hookMinL,
  setHookMinL,
  hookMaxL,
  setHookMaxL,
  burgersVectorNm,
  setBurgersVectorNm,
  youngsModulusGPa,
  setYoungsModulusGPa,
  contrastFactorC,
  setContrastFactorC,
  materialDensityGcm3,
  setMaterialDensityGcm3,
  harmonicRatioD1D2,
  harmonicCheckPassed = true,
  diagnosticWarnings = [],
  onTriggerCalculation,
  calculationFlash
}) => {
  const [sectionFilter, setSectionFilter] = useState<'all' | 'orders' | 'input' | 'physics'>('all');
  const [recipUnit, setRecipUnit] = useState<WAReciprocalUnit>('s');
  const [fourierSubView, setFourierSubView] = useState<'grid' | 'csv'>('grid');

  // Profile DFT state
  const [dftOrder1Text, setDftOrder1Text] = useState<string>(() =>
    generateSampleBraggScan(38.18, 0.44, 0.55, 4200, 120, 1)
  );
  const [dftOrder2Text, setDftOrder2Text] = useState<string>(() =>
    generateSampleBraggScan(81.72, 0.92, 0.35, 1950, 95, 7)
  );
  const [dftInstText, setDftInstText] = useState<string>('');
  const [showDftInst, setShowDftInst] = useState<boolean>(false);
  const [dftFeedback, setDftFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeLambda = directWavelength > 0 ? directWavelength : 1.5406;
  const sMaxEwald = 2 / safeLambda;

  const dToDisplayVal = (dVal: number): number => {
    if (!Number.isFinite(dVal) || dVal <= 0) return 0;
    if (recipUnit === 'd') return Number(dVal.toFixed(4));
    if (recipUnit === 's') return Number((1 / dVal).toFixed(4));
    const sinT = safeLambda / (2 * dVal);
    if (sinT >= 1) return 180;
    return Number(((2 * Math.asin(sinT) * 180) / Math.PI).toFixed(3));
  };

  const displayValToD = (val: number): number => {
    if (!Number.isFinite(val) || val <= 0) return 1.0;
    if (recipUnit === 'd') return Math.max(0.2, val);
    if (recipUnit === 's') return Math.max(0.2, 1 / val);
    const clampedTT = Math.max(1, Math.min(175, val));
    const sinT = Math.sin((clampedTT * Math.PI) / 360);
    return Math.max(0.2, safeLambda / (2 * sinT));
  };

  const activeOrders = useMemo(() => {
    const list: { order: number; d: number; s: number; s2: number; q: number; twoTheta?: number; ratio: number }[] = [];
    const raw: { order: number; d?: number }[] = [
      { order: 1, d: d1 },
      { order: 2, d: d2 },
      ...(enableOrder3 && d3 ? [{ order: 3, d: d3 }] : []),
      ...(enableOrder4 && d4 ? [{ order: 4, d: d4 }] : [])
    ];
    for (const item of raw) {
      if (item.d && item.d > 0) {
        const s = 1 / item.d;
        const sinT = safeLambda / (2 * item.d);
        const tt = sinT > 0 && sinT <= 1 ? (2 * Math.asin(sinT) * 180) / Math.PI : undefined;
        list.push({
          order: item.order,
          d: item.d,
          s,
          s2: s * s,
          q: 2 * Math.PI * s,
          twoTheta: tt,
          ratio: d1 > 0 ? d1 / item.d : item.order
        });
      }
    }
    return list;
  }, [d1, d2, d3, d4, enableOrder3, enableOrder4, safeLambda]);

  const handleLockExactHarmonics = () => {
    if (d1 <= 0) return;
    setD2(Number((d1 / 2).toFixed(4)));
    if (enableOrder3) setD3(Number((d1 / 3).toFixed(4)));
    if (enableOrder4) setD4(Number((d1 / 4).toFixed(4)));
  };

  const handleSyncDirectPeakHarmonics = () => {
    const sinT1 = Math.sin((directPeak1TwoTheta * Math.PI) / 360);
    if (sinT1 <= 0) return;
    const d1FromP1 = safeLambda / (2 * sinT1);
    const sinT2 = Math.min(0.995, safeLambda / (2 * (d1FromP1 / 2)));
    const tt2 = (2 * Math.asin(sinT2) * 180) / Math.PI;
    setDirectPeak2TwoTheta(Number(tt2.toFixed(2)));
    if (directUsePeak3) {
      const sinT3 = safeLambda / (2 * (d1FromP1 / 3));
      if (sinT3 < 0.995) {
        setDirectPeak3TwoTheta(Number(((2 * Math.asin(sinT3) * 180) / Math.PI).toFixed(2)));
      }
    }
  };

  const serializePointsToCSV = (rows: WAInputPoint[]) => {
    const hasA3 = rows.some(r => r.A3 !== undefined && Number.isFinite(r.A3));
    const hasA4 = rows.some(r => r.A4 !== undefined && Number.isFinite(r.A4));
    const header = hasA4
      ? '# L[nm], A(d1), A(d2), A(d3), A(d4)'
      : hasA3
      ? '# L[nm], A(d1), A(d2), A(d3)'
      : '# L[nm], A(d1), A(d2)';
    const lines = rows.map(r => {
      const cols = [r.L_nm.toFixed(1), r.A1.toFixed(4), r.A2.toFixed(4)];
      if (hasA3) cols.push((r.A3 ?? r.A2 * 0.8).toFixed(4));
      if (hasA4) cols.push((r.A4 ?? (r.A3 ?? r.A2) * 0.8).toFixed(4));
      return `${r.isExcluded ? '!' : ''}${cols.join(', ')}`;
    });
    return [header, ...lines].join('\n');
  };

  const handleUpdateGridRow = (index: number, field: 'L_nm' | 'A1' | 'A2' | 'A3' | 'isExcluded', val: number | boolean) => {
    const next = parsedPoints.map((pt, i) => (i === index ? { ...pt, [field]: val } : pt));
    setDataInput(serializePointsToCSV(next));
  };

  const handleAddGridRow = () => {
    const last = parsedPoints[parsedPoints.length - 1];
    const nextL = last ? Number((last.L_nm + 5).toFixed(1)) : 1.0;
    const nextA1 = last ? Math.max(0.02, Number((last.A1 * 0.72).toFixed(4))) : 0.92;
    const nextA2 = last ? Math.max(0.01, Number((last.A2 * 0.65).toFixed(4))) : 0.84;
    const nextRow: WAInputPoint = {
      L_nm: nextL,
      A1: nextA1,
      A2: nextA2,
      ...(enableOrder3 ? { A3: last?.A3 ? Math.max(0.005, Number((last.A3 * 0.58).toFixed(4))) : 0.72 } : {})
    };
    setDataInput(serializePointsToCSV([...parsedPoints, nextRow]));
  };

  const handleRemoveGridRow = (index: number) => {
    if (parsedPoints.length <= 2) return;
    const next = parsedPoints.filter((_, i) => i !== index);
    setDataInput(serializePointsToCSV(next));
  };

  const handleFixMonotonicity = () => {
    if (parsedPoints.length < 2) return;
    const sorted = [...parsedPoints].sort((a, b) => a.L_nm - b.L_nm);
    let prev1 = 1.0;
    let prev2 = 1.0;
    const fixed = sorted.map(pt => {
      const a1 = Math.max(0.002, Math.min(prev1, pt.A1));
      const a2 = Math.max(0.001, Math.min(prev2, Math.min(a1 * 0.995, pt.A2)));
      prev1 = a1;
      prev2 = a2;
      return { ...pt, A1: a1, A2: a2 };
    });
    setDataInput(serializePointsToCSV(fixed));
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = String(ev.target?.result || '');
      if (text.trim()) {
        setDataInput(text.trim());
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const dftPreview = useMemo(() => {
    if (inputMode !== 'profile_dft') return null;
    try {
      return computeFourierFromBraggProfile({
        order1Profile: dftOrder1Text,
        order2Profile: dftOrder2Text,
        instProfile: showDftInst ? dftInstText : undefined,
        wavelength: safeLambda,
        maxL_nm: 25
      });
    } catch {
      return null;
    }
  }, [inputMode, dftOrder1Text, dftOrder2Text, showDftInst, dftInstText, safeLambda]);

  const handleRunDFTExtraction = () => {
    const res = computeFourierFromBraggProfile({
      order1Profile: dftOrder1Text,
      order2Profile: dftOrder2Text,
      instProfile: showDftInst ? dftInstText : undefined,
      wavelength: safeLambda,
      maxL_nm: 25
    });
    onApplyDFTResult({
      dataString: res.dataString,
      d1: res.d1,
      d2: res.d2,
      hasInstStandard: showDftInst && dftInstText.trim().length > 20
    });
    setDftFeedback(
      `Extracted A(L): 1/d₁=${res.s1.toFixed(4)} Å⁻¹, 1/d₂=${res.s2.toFixed(4)} Å⁻¹ (s₂/s₁=${(res.s2 / Math.max(1e-5, res.s1)).toFixed(3)}×)`
    );
  };

  const handleLoadSampleDft = () => {
    setDirectWavelength(1.5406);
    setDftOrder1Text(generateSampleBraggScan(38.18, 0.44, 0.55, 4200, 120, 1));
    setDftOrder2Text(generateSampleBraggScan(81.72, 0.92, 0.35, 1950, 95, 7));
    if (showDftInst) {
      setDftInstText(generateSampleBraggScan(38.18, 0.085, 0.2, 6500, 40, 19));
    }
    setDftFeedback('Loaded synthetic Au (111)/(222) noisy Bragg scans.');
  };

  const fourierDiagnostics = useMemo(() => {
    const active = parsedPoints.filter(p => !p.isExcluded);
    const inversions = active.filter(p => p.A2 > p.A1 * 1.005).length;
    const outOfRange = active.filter(p => p.A1 <= 0 || p.A1 > 1.05 || p.A2 <= 0 || p.A2 > 1.05).length;
    return { total: parsedPoints.length, active: active.length, inversions, outOfRange };
  }, [parsedPoints]);

  const directPeaksSvgPaths = useMemo(() => {
    if (inputMode !== 'direct_peaks') return null;
    const buildCurve = (twoTheta: number, fwhmDeg: number, eta: number) => {
      const cosT = Math.max(0.08, Math.cos((twoTheta * Math.PI) / 360));
      const fwhmS = (fwhmDeg * (Math.PI / 180) * cosT) / safeLambda;
      const effW = Math.max(0.002, fwhmS);
      const halfSpan = 0.05;
      const pts: string[] = [];
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const ds = -halfSpan + (2 * halfSpan * i) / steps;
        const sigma = effW / (2 * Math.sqrt(2 * Math.LN2));
        const gamma = effW / 2;
        const g = Math.exp(-(ds * ds) / (2 * sigma * sigma));
        const l = 1 / (1 + (ds * ds) / (gamma * gamma));
        const yNorm = eta * l + (1 - eta) * g;
        const xPx = 18 + (i / steps) * 264;
        const yPx = 74 - yNorm * 58;
        pts.push(`${i === 0 ? 'M' : 'L'}${xPx.toFixed(1)},${yPx.toFixed(1)}`);
      }
      return pts.join(' ');
    };
    return {
      p1: buildCurve(directPeak1TwoTheta, directPeak1Fwhm, directPeak1Eta),
      p2: buildCurve(directPeak2TwoTheta, directPeak2Fwhm, directPeak2Eta),
      p3: directUsePeak3 ? buildCurve(directPeak3TwoTheta, directPeak3Fwhm, directPeak3Eta) : null
    };
  }, [
    inputMode,
    directPeak1TwoTheta,
    directPeak1Fwhm,
    directPeak1Eta,
    directPeak2TwoTheta,
    directPeak2Fwhm,
    directPeak2Eta,
    directUsePeak3,
    directPeak3TwoTheta,
    directPeak3Fwhm,
    directPeak3Eta,
    safeLambda
  ]);

  const showOrders = sectionFilter === 'all' || sectionFilter === 'orders';
  const showInput = sectionFilter === 'all' || sectionFilter === 'input';
  const showPhysics = sectionFilter === 'all' || sectionFilter === 'physics';

  return (
    <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Console Header */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-[#0E1420]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Sliders className="w-4 h-4 text-sky-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 truncate">
              1/d &amp; Deconvolution Console
            </h3>
          </div>
          <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
            λ = {safeLambda.toFixed(4)} Å
          </span>
        </div>

        {/* 4-Way Section Filter */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'orders', label: '1/d Orders' },
              { id: 'input', label: 'Input Mode' },
              { id: 'physics', label: 'Physics' }
            ] as const
          ).map(tab => {
            const active = sectionFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSectionFilter(tab.id)}
                className={`relative py-1 text-[10px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="wa-console-section"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    className="absolute inset-0 bg-slate-800 rounded-md border border-slate-700"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Material Reference Selector */}
        <div className="mt-2.5 flex items-center gap-2">
          <select
            value={activePresetId}
            onChange={e => {
              const found = presets.find(p => p.id === e.target.value);
              if (found) onLoadPreset(found);
            }}
            aria-label="Material Reference Preset"
            className="flex-1 min-w-0 px-2.5 py-1.5 text-[11px] font-medium bg-slate-950 text-slate-100 border border-slate-800 rounded-md focus:outline-none focus:border-sky-500"
          >
            {presets.map(p => (
              <option key={p.id} value={p.id} className="bg-[#0B0F17] text-slate-100">
                {p.name} — {p.hklPair} ({p.system})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              const found = presets.find(p => p.id === activePresetId) || presets[0];
              if (found) onLoadPreset(found);
            }}
            title="Reload Active Material Preset"
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Sections */}
      <div className="divide-y divide-slate-800/90">
        {/* SECTION 01: RECIPROCAL 1/d & HARMONIC ORDERS */}
        {showOrders && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-sky-400">01</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Reciprocal 1/d Orders
                </span>
              </div>
              <div className="inline-flex bg-slate-950 border border-slate-800 rounded-md p-0.5">
                {(
                  [
                    { id: 's', label: '1/d' },
                    { id: 'd', label: 'd (Å)' },
                    { id: 'twoTheta', label: '2θ (°)' }
                  ] as const
                ).map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setRecipUnit(u.id)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors ${
                      recipUnit === u.id
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live 1/d Reciprocal-Space Ewald Axis SVG Graphic */}
            <div className="bg-[#070B12] border border-slate-800/90 rounded-lg p-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                <span className="text-slate-400">
                  Reciprocal Axis <span className="text-sky-400 font-semibold">s = 1/d (Å⁻¹)</span>
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    harmonicCheckPassed ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  s₂/s₁ = {(harmonicRatioD1D2 ?? (d2 > 0 ? d1 / d2 : 2)).toFixed(3)}×{' '}
                  {harmonicCheckPassed ? 'HARMONIC' : 'CHECK RATIO'}
                </span>
              </div>

              <svg viewBox="0 0 320 74" className="w-full h-[74px] overflow-visible select-none">
                <defs>
                  <linearGradient id="waEwaldGradDark" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.06" />
                  </linearGradient>
                </defs>
                <rect x="14" y="14" width="286" height="36" rx="3" fill="url(#waEwaldGradDark)" />
                <line x1="14" y1="50" x2="306" y2="50" stroke="#334155" strokeWidth="1" />
                <line x1="300" y1="10" x2="300" y2="54" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                <text x="298" y="9" textAnchor="end" fill="#fbbf24" className="text-[8px] font-mono">
                  2/λ = {sMaxEwald.toFixed(2)} Å⁻¹
                </text>

                {[0, 0.25, 0.5, 0.75, 1.0].map(frac => {
                  const tx = 14 + frac * 286;
                  const sVal = frac * sMaxEwald;
                  return (
                    <g key={frac}>
                      <line x1={tx} y1="50" x2={tx} y2="54" stroke="#475569" strokeWidth="1" />
                      <text x={tx} y="64" textAnchor="middle" fill="#94a3b8" className="text-[8px] font-mono">
                        {sVal.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {activeOrders.length >= 2 && (() => {
                  const x1 = 14 + Math.min(1, activeOrders[0].s / sMaxEwald) * 286;
                  const x2 = 14 + Math.min(1, activeOrders[1].s / sMaxEwald) * 286;
                  const midX = (x1 + x2) / 2;
                  return (
                    <path
                      d={`M ${x1} 22 Q ${midX} 6 ${x2} 22`}
                      fill="none"
                      stroke={harmonicCheckPassed ? '#10b981' : '#f59e0b'}
                      strokeWidth="1.2"
                      strokeDasharray="2.5 2"
                    />
                  );
                })()}

                {activeOrders.map((ord, idx) => {
                  const clampedFrac = Math.max(0.02, Math.min(1.0, ord.s / sMaxEwald));
                  const sx = 14 + clampedFrac * 286;
                  const colors = ['#38bdf8', '#a855f7', '#10b981', '#f59e0b'];
                  const col = colors[idx % colors.length];
                  return (
                    <g key={ord.order}>
                      <line x1={sx} y1="20" x2={sx} y2="50" stroke={col} strokeWidth="2" />
                      <circle cx={sx} cy="20" r="3.2" fill={col} />
                      <text
                        x={sx}
                        y={idx % 2 === 0 ? 15 : 44}
                        textAnchor="middle"
                        fill={col}
                        className="text-[8.5px] font-mono font-bold"
                      >
                        s{ord.order}={ord.s.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Order Inputs */}
            <div className="space-y-1.5">
              {[
                { order: 1, label: 'Order 1 (hkl)', val: d1, setter: (v: number) => setD1(v), removable: false, accent: 'text-sky-400' },
                { order: 2, label: 'Order 2 (2h 2k 2l)', val: d2, setter: (v: number) => setD2(v), removable: false, accent: 'text-purple-400' },
                ...(enableOrder3
                  ? [
                      {
                        order: 3,
                        label: 'Order 3 (3h 3k 3l)',
                        val: d3 ?? Number((d1 / 3).toFixed(4)),
                        setter: (v: number) => setD3(v),
                        removable: true,
                        accent: 'text-emerald-400'
                      }
                    ]
                  : []),
                ...(enableOrder4
                  ? [
                      {
                        order: 4,
                        label: 'Order 4 (4h 4k 4l)',
                        val: d4 ?? Number((d1 / 4).toFixed(4)),
                        setter: (v: number) => setD4(v),
                        removable: true,
                        accent: 'text-amber-400'
                      }
                    ]
                  : [])
              ].map(row => {
                const s = row.val > 0 ? 1 / row.val : 0;
                const s2 = s * s;
                return (
                  <div
                    key={row.order}
                    className="grid grid-cols-12 items-center gap-2 px-2.5 py-1.5 bg-slate-950/70 border border-slate-800/80 rounded-md"
                  >
                    <div className="col-span-4 min-w-0">
                      <div className={`text-[10px] font-semibold truncate ${row.accent}`}>{row.label}</div>
                      <div className="text-[9.5px] font-mono tabular-nums text-slate-400">
                        s²={s2.toFixed(3)} Å⁻²
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div className="relative">
                        <input
                          type="number"
                          step={recipUnit === 'twoTheta' ? '0.05' : '0.0005'}
                          value={dToDisplayVal(row.val)}
                          onChange={e => {
                            const num = parseFloat(e.target.value);
                            if (Number.isFinite(num) && num > 0) {
                              row.setter(Number(displayValToD(num).toFixed(4)));
                            }
                          }}
                          className="w-full px-2 py-1 pr-8 text-[11px] font-mono tabular-nums bg-slate-900 text-slate-100 border border-slate-700/80 rounded focus:outline-none focus:border-sky-500"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 pointer-events-none">
                          {recipUnit === 's' ? 'Å⁻¹' : recipUnit === 'd' ? 'Å' : '°'}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center justify-end gap-1 text-right">
                      <span className="text-[10px] font-mono tabular-nums text-slate-400">
                        {recipUnit === 's' ? `${row.val.toFixed(3)}Å` : `${s.toFixed(3)}`}
                      </span>
                      {row.removable && (
                        <button
                          type="button"
                          onClick={() => {
                            if (row.order === 3) {
                              setEnableOrder3(false);
                              setEnableOrder4(false);
                            } else if (row.order === 4) {
                              setEnableOrder4(false);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                          title={`Remove Order ${row.order}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Controls Bar */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleLockExactHarmonics}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold text-sky-300 bg-sky-950/60 border border-sky-800/70 rounded-md hover:bg-sky-900/50 transition-colors"
              >
                <Lock className="w-3 h-3" />
                Lock Exact sₙ = n·s₁
              </button>
              <div className="flex items-center gap-1.5">
                {!enableOrder3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEnableOrder3(true);
                      if (!d3 || d3 <= 0) setD3(Number((d1 / 3).toFixed(4)));
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Order 3
                  </button>
                )}
                {enableOrder3 && !enableOrder4 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEnableOrder4(true);
                      if (!d4 || d4 <= 0) setD4(Number((d1 / 4).toFixed(4)));
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Order 4
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 02: 3-MODE INPUT UX */}
        {showInput && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-sky-400">02</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Data Input Mode
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenPeakConverterModal}
                className="text-[10px] font-mono font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Stokes Modal ↗
              </button>
            </div>

            {/* 3-Mode Segmented Switcher */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              {(
                [
                  { id: 'direct_peaks', label: 'Direct Peaks', icon: Activity },
                  { id: 'fourier_coeffs', label: 'Fourier A(L)', icon: Table2 },
                  { id: 'profile_dft', label: 'Profile DFT', icon: Waves }
                ] as const
              ).map(m => {
                const Icon = m.icon;
                const active = inputMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setInputMode(m.id)}
                    className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10.5px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                      active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="wa-input-mode"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 bg-sky-600 rounded-md shadow-xs"
                      />
                    )}
                    <Icon className="w-3 h-3 relative z-10 shrink-0" />
                    <span className="relative z-10">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* MODE A: DIRECT PEAKS */}
            {inputMode === 'direct_peaks' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                      Anode λ (Å)
                    </label>
                    <select
                      value={directWavelength}
                      onChange={e => setDirectWavelength(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-[11px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-100"
                    >
                      {ANODE_OPTIONS.map(a => (
                        <option key={a.label} value={a.lambda} className="bg-[#0B0F17]">
                          {a.label} ({a.lambda})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                      FWHM_inst (°)
                    </label>
                    <input
                      type="number"
                      step="0.005"
                      min="0"
                      max="0.5"
                      value={directFwhmInst}
                      onChange={e => setDirectFwhmInst(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                      Hook ({Math.round(directHookSim * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.15"
                      step="0.01"
                      value={directHookSim}
                      onChange={e => setDirectHookSim(parseFloat(e.target.value))}
                      className="w-full accent-sky-500 mt-1.5"
                    />
                  </div>
                </div>

                {/* Live Reciprocal-Space Pseudo-Voigt Peak Overlay SVG */}
                {directPeaksSvgPaths && (
                  <div className="bg-[#070B12] border border-slate-800/90 rounded-lg p-2">
                    <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 mb-1">
                      <span>Reciprocal-Space Profile I(Δs)</span>
                      <span className="flex items-center gap-2">
                        <span className="text-sky-400">― Ord 1</span>
                        <span className="text-purple-400">― Ord 2</span>
                        {directUsePeak3 && <span className="text-emerald-400">― Ord 3</span>}
                      </span>
                    </div>
                    <svg viewBox="0 0 300 84" className="w-full h-[80px] select-none">
                      <line x1="18" y1="74" x2="282" y2="74" stroke="#334155" strokeWidth="1" />
                      <line x1="150" y1="10" x2="150" y2="74" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                      <path d={directPeaksSvgPaths.p1} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
                      <path d={directPeaksSvgPaths.p2} fill="none" stroke="#a855f7" strokeWidth="1.8" />
                      {directPeaksSvgPaths.p3 && (
                        <path d={directPeaksSvgPaths.p3} fill="none" stroke="#10b981" strokeWidth="1.6" strokeDasharray="4 2" />
                      )}
                      <text x="150" y="82" textAnchor="middle" fill="#64748b" className="text-[8px] font-mono">
                        Δs = 0 (Å⁻¹)
                      </text>
                    </svg>
                  </div>
                )}

                <div className="space-y-2">
                  {[
                    {
                      idx: 1,
                      color: 'text-sky-400',
                      tt: directPeak1TwoTheta,
                      setTt: setDirectPeak1TwoTheta,
                      fwhm: directPeak1Fwhm,
                      setFwhm: setDirectPeak1Fwhm,
                      eta: directPeak1Eta,
                      setEta: setDirectPeak1Eta
                    },
                    {
                      idx: 2,
                      color: 'text-purple-400',
                      tt: directPeak2TwoTheta,
                      setTt: setDirectPeak2TwoTheta,
                      fwhm: directPeak2Fwhm,
                      setFwhm: setDirectPeak2Fwhm,
                      eta: directPeak2Eta,
                      setEta: setDirectPeak2Eta
                    },
                    ...(directUsePeak3
                      ? [
                          {
                            idx: 3,
                            color: 'text-emerald-400',
                            tt: directPeak3TwoTheta,
                            setTt: setDirectPeak3TwoTheta,
                            fwhm: directPeak3Fwhm,
                            setFwhm: setDirectPeak3Fwhm,
                            eta: directPeak3Eta,
                            setEta: setDirectPeak3Eta
                          }
                        ]
                      : [])
                  ].map(pk => {
                    const sinT = Math.sin((pk.tt * Math.PI) / 360);
                    const sVal = sinT > 0 ? (2 * sinT) / safeLambda : 0;
                    const dVal = sVal > 0 ? 1 / sVal : 0;
                    return (
                      <div
                        key={pk.idx}
                        className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-md space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-bold ${pk.color}`}>Order {pk.idx} Bragg Peak</span>
                          <span className="font-mono tabular-nums text-slate-400">
                            1/d={sVal.toFixed(4)} Å⁻¹ · d={dVal.toFixed(3)} Å
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <span className="block text-[9px] text-slate-500">2θ (°)</span>
                            <input
                              type="number"
                              step="0.05"
                              value={pk.tt}
                              onChange={e => pk.setTt(parseFloat(e.target.value) || 10)}
                              className="w-full px-1.5 py-1 text-[11px] font-mono tabular-nums bg-slate-900 border border-slate-700/80 rounded text-slate-100"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-500">FWHM (°)</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.02"
                              value={pk.fwhm}
                              onChange={e => pk.setFwhm(Math.max(0.02, parseFloat(e.target.value) || 0.1))}
                              className="w-full px-1.5 py-1 text-[11px] font-mono tabular-nums bg-slate-900 border border-slate-700/80 rounded text-slate-100"
                            />
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-500">η (Lorentz)</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0"
                              max="1"
                              value={pk.eta}
                              onChange={e => pk.setEta(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                              className="w-full px-1.5 py-1 text-[11px] font-mono tabular-nums bg-slate-900 border border-slate-700/80 rounded text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleSyncDirectPeakHarmonics}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-sky-300 bg-sky-950/60 border border-sky-800/70 rounded hover:bg-sky-900/50 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Sync Harmonic 2θₙ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectUsePeak3(!directUsePeak3)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-sky-400"
                  >
                    {directUsePeak3 ? '− Hide 3rd Order' : '+ Add 3rd Order'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onSynthesizeFromPeaks}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Deconvolve Voigt &amp; Refresh A(L)
                </button>
              </div>
            )}

            {/* MODE B: FOURIER A(L) SPREADSHEET + RAW CSV */}
            {inputMode === 'fourier_coeffs' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex bg-slate-950 border border-slate-800 rounded p-0.5">
                    <button
                      type="button"
                      onClick={() => setFourierSubView('grid')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        fourierSubView === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                    >
                      Table Grid ({parsedPoints.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFourierSubView('csv')}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                        fourierSubView === 'csv' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                    >
                      Raw CSV
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.dat"
                      onChange={handleCsvFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-300 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800"
                    >
                      <FileUp className="w-3 h-3" /> Import
                    </button>
                    {fourierDiagnostics.inversions > 0 && (
                      <button
                        type="button"
                        onClick={handleFixMonotonicity}
                        className="px-2 py-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-700 rounded"
                      >
                        Fix A₂&gt;A₁
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Mini A(L) Multi-Order Decay Sparkline */}
                {parsedPoints.length >= 2 && (() => {
                  const maxL = Math.max(...parsedPoints.map(p => p.L_nm), 10);
                  const toX = (L: number) => 16 + (L / maxL) * 268;
                  const toY = (A: number) => 64 - Math.max(0, Math.min(1.05, A)) * 52;
                  const pathA1 = parsedPoints
                    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.L_nm).toFixed(1)},${toY(p.A1).toFixed(1)}`)
                    .join(' ');
                  const pathA2 = parsedPoints
                    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.L_nm).toFixed(1)},${toY(p.A2).toFixed(1)}`)
                    .join(' ');
                  const hasA3 = parsedPoints.some(p => p.A3 !== undefined);
                  const pathA3 = hasA3
                    ? parsedPoints
                        .filter(p => p.A3 !== undefined)
                        .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.L_nm).toFixed(1)},${toY(p.A3!).toFixed(1)}`)
                        .join(' ')
                    : '';
                  return (
                    <div className="bg-[#070B12] border border-slate-800/90 rounded-lg p-2">
                      <div className="flex items-center justify-between text-[9.5px] font-mono mb-1">
                        <span className="text-slate-400">A(L) Harmonic Decay</span>
                        <span className="flex items-center gap-2">
                          <span className="text-sky-400">● A₁</span>
                          <span className="text-purple-400">● A₂</span>
                          {hasA3 && <span className="text-emerald-400">● A₃</span>}
                        </span>
                      </div>
                      <svg viewBox="0 0 300 72" className="w-full h-[68px] select-none">
                        <line x1="16" y1="12" x2="284" y2="12" stroke="#1e293b" strokeDasharray="2 2" />
                        <line x1="16" y1="64" x2="284" y2="64" stroke="#334155" />
                        <path d={pathA1} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
                        <path d={pathA2} fill="none" stroke="#a855f7" strokeWidth="1.8" />
                        {pathA3 && <path d={pathA3} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />}
                        {parsedPoints.map((p, i) => (
                          <g key={i}>
                            <circle cx={toX(p.L_nm)} cy={toY(p.A1)} r="2.2" fill={p.isExcluded ? '#64748b' : '#38bdf8'} />
                            <circle
                              cx={toX(p.L_nm)}
                              cy={toY(p.A2)}
                              r="2.2"
                              fill={p.A2 > p.A1 * 1.005 ? '#f59e0b' : p.isExcluded ? '#64748b' : '#a855f7'}
                            />
                          </g>
                        ))}
                      </svg>
                    </div>
                  );
                })()}

                {fourierSubView === 'grid' ? (
                  <div className="border border-slate-800 rounded-md overflow-hidden">
                    <div className="max-h-52 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-[10.5px] font-mono tabular-nums">
                        <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[9.5px] text-slate-400">
                          <tr>
                            <th className="py-1 px-1.5 text-left">L(nm)</th>
                            <th className="py-1 px-1.5 text-left text-sky-400">A₁</th>
                            <th className="py-1 px-1.5 text-left text-purple-400">A₂</th>
                            {enableOrder3 && <th className="py-1 px-1.5 text-left text-emerald-400">A₃</th>}
                            <th className="py-1 px-1 text-center">Use</th>
                            <th className="py-1 px-1"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70">
                          {parsedPoints.map((pt, idx) => (
                            <tr
                              key={idx}
                              className={pt.isExcluded ? 'opacity-45 bg-slate-950/90' : 'bg-slate-950/40'}
                            >
                              <td className="p-1">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={pt.L_nm}
                                  onChange={e => handleUpdateGridRow(idx, 'L_nm', parseFloat(e.target.value) || 0.5)}
                                  className="w-11 px-1 py-0.5 bg-transparent border border-transparent hover:border-slate-700 focus:border-sky-500 rounded text-slate-100 focus:outline-none"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pt.A1}
                                  onChange={e => handleUpdateGridRow(idx, 'A1', parseFloat(e.target.value) || 0.01)}
                                  className="w-14 px-1 py-0.5 bg-transparent border border-transparent hover:border-slate-700 focus:border-sky-500 rounded text-slate-100 focus:outline-none"
                                />
                              </td>
                              <td className="p-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={pt.A2}
                                  onChange={e => handleUpdateGridRow(idx, 'A2', parseFloat(e.target.value) || 0.01)}
                                  className={`w-14 px-1 py-0.5 bg-transparent border border-transparent hover:border-slate-700 focus:border-sky-500 rounded focus:outline-none ${
                                    pt.A2 > pt.A1 * 1.005 ? 'text-amber-400 font-bold' : 'text-slate-100'
                                  }`}
                                />
                              </td>
                              {enableOrder3 && (
                                <td className="p-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pt.A3 ?? ''}
                                    onChange={e => handleUpdateGridRow(idx, 'A3', parseFloat(e.target.value) || 0.01)}
                                    className="w-14 px-1 py-0.5 bg-transparent border border-transparent hover:border-slate-700 focus:border-sky-500 rounded text-slate-100 focus:outline-none"
                                  />
                                </td>
                              )}
                              <td className="p-1 text-center">
                                <input
                                  type="checkbox"
                                  checked={!pt.isExcluded}
                                  onChange={e => handleUpdateGridRow(idx, 'isExcluded', !e.target.checked)}
                                  className="accent-sky-500 rounded"
                                />
                              </td>
                              <td className="p-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGridRow(idx)}
                                  className="text-slate-500 hover:text-rose-400"
                                  title="Delete row"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-2.5 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleAddGridRow}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add L Step
                      </button>
                      <span className="text-[9.5px] font-mono text-slate-400">
                        {fourierDiagnostics.active}/{fourierDiagnostics.total} active
                      </span>
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={7}
                    value={dataInput}
                    onChange={e => setDataInput(e.target.value)}
                    spellCheck={false}
                    placeholder="# L[nm], A(d1), A(d2), [A(d3)]"
                    className="w-full p-2.5 text-[11px] font-mono bg-slate-950 text-sky-200 border border-slate-800 rounded-md focus:outline-none focus:border-sky-500 custom-scrollbar"
                  />
                )}
              </div>
            )}

            {/* MODE C: RAW BRAGG PROFILE COMPLEX STOKES DFT */}
            {inputMode === 'profile_dft' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Raw <code className="font-mono text-slate-200">2θ, I</code> → Reciprocal DFT
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadSampleDft}
                    className="text-[10px] font-semibold text-sky-400 hover:underline"
                  >
                    Load Au (111)/(222) Scan
                  </button>
                </div>

                {dftPreview && (dftPreview.peak1Points.length >= 4 || dftPreview.peak2Points.length >= 4) && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: `Ord 1 · 1/d=${dftPreview.s1.toFixed(3)}`, pts: dftPreview.peak1Points, color: '#38bdf8' },
                      { label: `Ord 2 · 1/d=${dftPreview.s2.toFixed(3)}`, pts: dftPreview.peak2Points, color: '#a855f7' }
                    ].map(panel => {
                      const xs = panel.pts.map(p => p.twoTheta);
                      const ys = panel.pts.map(p => p.intensity);
                      const minX = Math.min(...xs);
                      const maxX = Math.max(...xs);
                      const maxY = Math.max(...ys, 1);
                      const spanX = Math.max(0.01, maxX - minX);
                      const curve = panel.pts
                        .map((p, i) => {
                          const x = 6 + ((p.twoTheta - minX) / spanX) * 128;
                          const y = 46 - (p.intensity / maxY) * 38;
                          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ');
                      const bgLine = panel.pts
                        .map((p, i) => {
                          const x = 6 + ((p.twoTheta - minX) / spanX) * 128;
                          const y = 46 - (p.bg / maxY) * 38;
                          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ');
                      return (
                        <div
                          key={panel.label}
                          className="bg-[#070B12] border border-slate-800 rounded p-1.5"
                        >
                          <div className="text-[9px] font-mono text-slate-400 truncate mb-0.5">
                            {panel.label}
                          </div>
                          <svg viewBox="0 0 140 52" className="w-full h-[50px]">
                            <path d={bgLine} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />
                            <path d={curve} fill="none" stroke={panel.color} strokeWidth="1.5" />
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9.5px] font-semibold text-sky-400 mb-1">
                      Order 1 (2θ, Intensity)
                    </label>
                    <textarea
                      rows={4}
                      value={dftOrder1Text}
                      onChange={e => setDftOrder1Text(e.target.value)}
                      spellCheck={false}
                      className="w-full p-1.5 text-[10px] font-mono bg-slate-950 text-slate-200 border border-slate-800 rounded focus:outline-none focus:border-sky-500 custom-scrollbar"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] font-semibold text-purple-400 mb-1">
                      Order 2 (2θ, Intensity)
                    </label>
                    <textarea
                      rows={4}
                      value={dftOrder2Text}
                      onChange={e => setDftOrder2Text(e.target.value)}
                      spellCheck={false}
                      className="w-full p-1.5 text-[10px] font-mono bg-slate-950 text-slate-200 border border-slate-800 rounded focus:outline-none focus:border-sky-500 custom-scrollbar"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowDftInst(!showDftInst)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-sky-400"
                  >
                    {showDftInst
                      ? '− Hide Instrumental Standard (LaB₆/Si)'
                      : '+ Optional Instrumental Standard (Complex Stokes)'}
                  </button>
                  {showDftInst && (
                    <textarea
                      rows={3}
                      value={dftInstText}
                      onChange={e => setDftInstText(e.target.value)}
                      placeholder="# Standard 2Theta, Intensity (optional)"
                      spellCheck={false}
                      className="mt-1.5 w-full p-1.5 text-[10px] font-mono bg-slate-950 text-slate-200 border border-slate-800 rounded focus:outline-none focus:border-sky-500"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRunDFTExtraction}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-[11px] font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Waves className="w-3.5 h-3.5" />
                  Extract Fourier A(L) via Complex DFT
                </button>

                {dftFeedback && (
                  <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-800/60 rounded px-2.5 py-1.5">
                    {dftFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 03: CONTRAST, INSTRUMENTAL & HOOK PHYSICS */}
        {showPhysics && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-sky-400">03</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                Deconvolution &amp; Dislocation Physics
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                  Instrumental Deconv
                </label>
                <select
                  value={instrumentalCorrection}
                  onChange={e => setInstrumentalCorrection(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] bg-slate-950 text-slate-100 border border-slate-800 rounded"
                >
                  <option value="None">None (Pre-Deconvolved)</option>
                  <option value="Stokes">Stokes (Voigt Kernel)</option>
                  <option value="Voigt">Voigt Reciprocal</option>
                </select>
              </div>
              <div>
                <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                  Background Filter
                </label>
                <select
                  value={backgroundModel}
                  onChange={e => setBackgroundModel(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] bg-slate-950 text-slate-100 border border-slate-800 rounded"
                >
                  <option value="None">None (Pre-Subtracted)</option>
                  <option value="Linear">Linear Offset</option>
                  <option value="Spline">Decay Spline</option>
                </select>
              </div>
            </div>

            {inputMode === 'direct_peaks' && instrumentalCorrection !== 'None' && (
              <div className="text-[10px] text-sky-300 bg-sky-950/40 border border-sky-800/60 rounded px-2.5 py-1.5 flex items-center justify-between gap-2">
                <span>Direct Peaks already subtracts FWHM_inst via Voigt.</span>
                <button
                  type="button"
                  onClick={() => {
                    setInstrumentalCorrection('None');
                    setBackgroundModel('None');
                  }}
                  className="font-bold underline shrink-0"
                >
                  Set None
                </button>
              </div>
            )}

            {(instrumentalCorrection !== 'None' || backgroundModel !== 'None') && (
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {instrumentalCorrection !== 'None' && (
                  <div>
                    <div className="flex justify-between text-[9.5px] font-mono text-slate-400">
                      <span>β*_inst (nm⁻¹)</span>
                      <span className="tabular-nums text-slate-200">{instrumentalFactor.toFixed(4)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.03"
                      step="0.0005"
                      value={instrumentalFactor}
                      onChange={e => setInstrumentalFactor(parseFloat(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                )}
                {backgroundModel !== 'None' && (
                  <div>
                    <div className="flex justify-between text-[9.5px] font-mono text-slate-400">
                      <span>BG Offset</span>
                      <span className="tabular-nums text-slate-200">{backgroundOffset.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.12"
                      step="0.005"
                      value={backgroundOffset}
                      onChange={e => setBackgroundOffset(parseFloat(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                  Hook Effect Solver
                </label>
                <select
                  value={hookEffectCorrection}
                  onChange={e =>
                    setHookEffectCorrection(
                      e.target.value as 'none' | 'linear_tangent' | 'polynomial' | 'spline_regularization'
                    )
                  }
                  className="w-full px-2 py-1.5 text-[11px] bg-slate-950 text-slate-100 border border-slate-800 rounded"
                >
                  <option value="linear_tangent">Linear Tangent Extrap.</option>
                  <option value="polynomial">Monotonic Norm.</option>
                  <option value="spline_regularization">Spline Regularization</option>
                  <option value="none">None (Raw A_S)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9.5px] font-mono uppercase text-slate-400 mb-1">
                  Strain Profile
                </label>
                <select
                  value={strainModel}
                  onChange={e => setStrainModel(e.target.value)}
                  className="w-full px-2 py-1.5 text-[11px] bg-slate-950 text-slate-100 border border-slate-800 rounded"
                >
                  <option value="Gaussian">Gaussian (Exact WA)</option>
                  <option value="Lorentzian">Lorentzian (Cauchy Eq.)</option>
                </select>
              </div>
            </div>

            {/* Hook Tangent Fit Window */}
            <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-md">
              <div className="flex items-center justify-between text-[9.5px] mb-1.5">
                <span className="font-mono uppercase text-slate-400">
                  Initial Slope Window [L_min, L_max] nm
                </span>
                {(hookMinL !== undefined || hookMaxL !== undefined) && (
                  <button
                    type="button"
                    onClick={() => {
                      setHookMinL(undefined);
                      setHookMaxL(undefined);
                    }}
                    className="text-sky-400 font-semibold hover:underline"
                  >
                    Auto
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="Auto L_min"
                  value={hookMinL ?? ''}
                  onChange={e => setHookMinL(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-900 border border-slate-700/80 rounded text-slate-100"
                />
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  placeholder="Auto L_max"
                  value={hookMaxL ?? ''}
                  onChange={e => setHookMaxL(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-900 border border-slate-700/80 rounded text-slate-100"
                />
              </div>
            </div>

            {/* Dislocation & Material Constants */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9.5px] font-mono text-slate-400 mb-0.5">Contrast C̄</label>
                <input
                  type="number"
                  step="0.005"
                  min="0.05"
                  max="0.6"
                  value={contrastFactorC}
                  onChange={e => setContrastFactorC(Math.max(0.05, parseFloat(e.target.value) || 0.25))}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-mono text-slate-400 mb-0.5">Burgers b (nm)</label>
                <input
                  type="number"
                  step="0.005"
                  min="0.1"
                  max="1.0"
                  value={burgersVectorNm}
                  onChange={e => setBurgersVectorNm(Math.max(0.1, parseFloat(e.target.value) || 0.25))}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-mono text-slate-400 mb-0.5">Young&apos;s E (GPa)</label>
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="600"
                  value={youngsModulusGPa}
                  onChange={e => setYoungsModulusGPa(Math.max(10, parseFloat(e.target.value) || 100))}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-mono text-slate-400 mb-0.5">Density ρ (g/cm³)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="25"
                  value={materialDensityGcm3}
                  onChange={e => setMaterialDensityGcm3(Math.max(0.5, parseFloat(e.target.value) || 8.0))}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-mono text-slate-400 mb-0.5">Cutoff R_e (nm)</label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  max="300"
                  value={cutoffRadiusValue}
                  onChange={e => setCutoffRadiusValue(Math.max(5, parseFloat(e.target.value) || 50))}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-mono text-slate-400 mb-0.5">Shape K (D_eq)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="2.0"
                  value={shapeFactor}
                  onChange={e => setShapeFactor(Math.max(0.5, parseFloat(e.target.value) || 1.0))}
                  className="w-full px-2 py-1 text-[11px] font-mono tabular-nums bg-slate-950 border border-slate-800 rounded text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-0.5">
              <span>Quick C̄_hkl:</span>
              <div className="flex items-center gap-1.5 font-mono">
                {[
                  { label: 'FCC 111', val: 0.19 },
                  { label: 'FCC 200', val: 0.305 },
                  { label: 'BCC 110', val: 0.285 },
                  { label: 'Iso', val: 0.25 }
                ].map(c => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setContrastFactorC(c.val)}
                    className={`px-1.5 py-0.5 rounded border transition-colors ${
                      Math.abs(contrastFactorC - c.val) < 0.005
                        ? 'border-sky-500 text-sky-300 bg-sky-950/60'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diagnostic Warnings Strip */}
      {diagnosticWarnings.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-950/35 border-t border-amber-900/60 space-y-1">
          {diagnosticWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-[10.5px] text-amber-300 leading-snug">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Anchored Bottom Command Bar */}
      <div className="p-3.5 bg-[#0E1420] border-t border-slate-800">
        <button
          type="button"
          onClick={onTriggerCalculation}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
            calculationFlash
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white'
          }`}
        >
          {calculationFlash ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Warren–Averbach Updated
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Warren–Averbach Calculation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WADeconvolutionConsole;
