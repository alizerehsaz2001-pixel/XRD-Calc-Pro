import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ScherrerResult } from '../../types';
import {
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Download,
  Check,
  FileText,
  BookOpen,
  Eye,
  EyeOff,
  Filter,
  RotateCcw,
  Code,
  BarChart2,
  Calculator,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MeanCrystalliteCalculationTrace } from './MeanCrystalliteCalculationTrace';
import { MathFormula } from '../common/MathFormula';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  Cell,
  ComposedChart,
} from 'recharts';

export type SizingAverageMethod = 'weighted' | 'arithmetic' | 'volume' | 'area' | 'harmonic';
type DisplayUnit = 'nm' | 'A' | 'pm' | 'um';

export interface MeanCrystalliteSizingCardProps {
  validResults: ScherrerResult[];
  allResults?: ScherrerResult[];
  onTogglePeakExclusion?: (index: number) => void;
  onAutoPruneOutliers?: () => void;
  onIncludeAllPeaks?: () => void;
  constantK: number;
  wavelength: number;
  precision: number;
  averageType: SizingAverageMethod;
  onAverageTypeChange: (method: SizingAverageMethod) => void;
  materialDensity: number;
  onMaterialDensityChange: (density: number, label?: string) => void;
  selectedMaterial: string;
  materialOptions: { label: string; density: number; crystal: string }[];
  whSlope?: number;
  instFwhm?: number;
  broadeningModel?: string;
}

const MOMENT_META: {
  id: SizingAverageMethod;
  symbol: string;
  texSymbol: string;
  label: string;
  formula: string;
  texFormula: string;
  desc: string;
}[] = [
  {
    id: 'weighted',
    symbol: 'D_int',
    texSymbol: 'D_{\\mathrm{int}}',
    label: 'Intensity-Weighted',
    formula: 'Σ(I·D) / ΣI',
    texFormula: '\\tfrac{\\sum I_i D_i}{\\sum I_i}',
    desc: 'Weighted by Bragg peak intensity (standard XRD practice)',
  },
  {
    id: 'arithmetic',
    symbol: 'D_num',
    texSymbol: 'D_{\\mathrm{num}}',
    label: 'Number Mean',
    formula: 'ΣD / N',
    texFormula: '\\tfrac{1}{N}\\sum D_i',
    desc: 'Unweighted arithmetic mean across resolved planes (TEM comparable)',
  },
  {
    id: 'volume',
    symbol: 'D_V',
    texSymbol: 'D_V',
    label: 'Volume-Weighted',
    formula: 'ΣD⁴ / ΣD³',
    texFormula: '\\tfrac{\\sum D_i^4}{\\sum D_i^3}',
    desc: 'ISO 26824 / ASTM E2865 volume-weighted crystallite moment',
  },
  {
    id: 'area',
    symbol: 'D_A',
    texSymbol: 'D_A',
    label: 'Area-Weighted',
    formula: 'ΣD³ / ΣD²',
    texFormula: '\\tfrac{\\sum D_i^3}{\\sum D_i^2}',
    desc: 'Surface-area weighted moment for catalysis and adsorption',
  },
  {
    id: 'harmonic',
    symbol: 'D_H',
    texSymbol: 'D_H',
    label: 'Harmonic Mean',
    formula: 'N / Σ(1/D)',
    texFormula: '\\tfrac{N}{\\sum D_i^{-1}}',
    desc: 'Harmonic effective broadening mean matching ⟨β cos θ⟩',
  },
];

export const MeanCrystalliteSizingCard: React.FC<MeanCrystalliteSizingCardProps> = ({
  validResults,
  allResults = [],
  onTogglePeakExclusion,
  onAutoPruneOutliers,
  onIncludeAllPeaks,
  constantK,
  wavelength,
  precision,
  averageType,
  onAverageTypeChange,
  materialDensity,
  onMaterialDensityChange,
  selectedMaterial,
  materialOptions,
  whSlope = 0,
  instFwhm = 0.1,
  broadeningModel = 'Gaussian',
}) => {
  const [copiedMode, setCopiedMode] = useState<'summary' | 'markdown' | 'latex' | 'unit' | null>(null);
  const [showFacetTable, setShowFacetTable] = useState(true);
  const [workspaceView, setWorkspaceView] = useState<'summary' | 'chart' | 'trace'>('summary');
  const [traceTab, setTraceTab] = useState<'trace' | 'models' | 'physics' | 'diagnostics'>('trace');
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('nm');
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [customDensityInput, setCustomDensityInput] = useState<string>(materialDensity.toString());
  const densityDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCustomDensityInput(materialDensity.toString());
  }, [materialDensity]);

  useEffect(() => {
    if (!isMaterialDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (densityDropdownRef.current && !densityDropdownRef.current.contains(e.target as Node)) {
        setIsMaterialDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMaterialDropdownOpen]);

  const totalReflectionsCount = allResults.length > 0 ? allResults.length : validResults.length;
  const excludedReflectionsCount = allResults.filter((r) => r.excluded).length;
  const unresolvedReflectionsCount = allResults.filter(
    (r) => !r.excluded && (r.error || r.sizeNm <= 0)
  ).length;

  // 1. Multi-moment statistical synthesis
  const sizingStats = useMemo(() => {
    if (validResults.length === 0) {
      return {
        count: 0,
        arithmetic: 0,
        weighted: 0,
        volume: 0,
        area: 0,
        harmonic: 0,
        geometricMean: 0,
        geometricStdDev: 1,
        median: 0,
        iqr: 0,
        q1: 0,
        q3: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        sem: 0,
        ci95: 0,
        pdi: 0,
        relDispersion: 0,
        anisotropyIndex: 1,
        avgPlanes: 0,
        avgDSpacing: 0,
        outlierCount: 0,
      };
    }

    const count = validResults.length;
    const sizes = validResults.map((r) => r.sizeNm);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);

    const sum = sizes.reduce((acc, val) => acc + val, 0);
    const arithmetic = sum / count;

    let totalWeight = 0;
    let weightedSum = 0;
    validResults.forEach((r) => {
      const weight = r.intensity && r.intensity > 0 ? r.intensity : 1;
      weightedSum += r.sizeNm * weight;
      totalWeight += weight;
    });
    const weighted = totalWeight > 0 ? weightedSum / totalWeight : arithmetic;

    const sumD4 = sizes.reduce((acc, d) => acc + Math.pow(d, 4), 0);
    const sumD3 = sizes.reduce((acc, d) => acc + Math.pow(d, 3), 0);
    const volume = sumD3 > 0 ? sumD4 / sumD3 : arithmetic;

    const sumD2 = sizes.reduce((acc, d) => acc + Math.pow(d, 2), 0);
    const area = sumD2 > 0 ? sumD3 / sumD2 : arithmetic;

    const sumInv = sizes.reduce((acc, d) => acc + 1 / Math.max(0.01, d), 0);
    const harmonic = sumInv > 0 ? count / sumInv : arithmetic;

    const logSum = sizes.reduce((acc, d) => acc + Math.log(Math.max(0.1, d)), 0);
    const geometricMean = Math.exp(logSum / count);
    const logVar =
      count > 1
        ? sizes.reduce(
            (acc, d) => acc + Math.pow(Math.log(Math.max(0.1, d)) - Math.log(geometricMean), 2),
            0
          ) /
          (count - 1)
        : 0;
    const geometricStdDev = Math.exp(Math.sqrt(logVar));

    const sorted = [...sizes].sort((a, b) => a - b);
    const median =
      count % 2 === 1
        ? sorted[Math.floor(count / 2)]
        : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
    const q1 = sorted[Math.floor((count - 1) * 0.25)];
    const q3 = sorted[Math.floor((count - 1) * 0.75)];
    const iqr = Math.max(0, q3 - q1);

    let currentMean = weighted;
    if (averageType === 'arithmetic') currentMean = arithmetic;
    else if (averageType === 'volume') currentMean = volume;
    else if (averageType === 'area') currentMean = area;
    else if (averageType === 'harmonic') currentMean = harmonic;

    const variance =
      count > 1
        ? sizes.reduce((acc, d) => acc + Math.pow(d - currentMean, 2), 0) / (count - 1)
        : 0;
    const stdDev = Math.sqrt(variance);
    const sem = count > 1 ? stdDev / Math.sqrt(count) : 0;

    const tTable = [0, 12.71, 4.3, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23];
    const tCrit = count <= 10 && count > 0 ? tTable[count - 1] || 2.23 : 1.96 + 2.4 / count;
    const ci95 = count > 1 ? tCrit * sem : 0;

    const pdi = currentMean > 0 ? Math.pow(stdDev / currentMean, 2) : 0;
    const relDispersion = currentMean > 0 ? (stdDev / currentMean) * 100 : 0;
    const anisotropyIndex = min > 0 ? max / min : 1;
    const avgPlanes = Math.round(
      validResults.reduce((acc, r) => acc + (r.coherencePlanesN || 0), 0) / count
    );
    const avgDSpacing = validResults.reduce((acc, r) => acc + (r.dSpacing || 0), 0) / count;
    const outlierCount =
      stdDev > 0 ? sizes.filter((s) => Math.abs(s - currentMean) / stdDev > 1.8).length : 0;

    return {
      count,
      arithmetic,
      weighted,
      volume,
      area,
      harmonic,
      geometricMean,
      geometricStdDev,
      median,
      iqr,
      q1,
      q3,
      min,
      max,
      stdDev,
      sem,
      ci95,
      pdi,
      relDispersion,
      anisotropyIndex,
      avgPlanes,
      avgDSpacing,
      outlierCount,
    };
  }, [validResults, averageType]);

  const currentSizeNm = useMemo(() => {
    switch (averageType) {
      case 'arithmetic':
        return sizingStats.arithmetic;
      case 'volume':
        return sizingStats.volume;
      case 'area':
        return sizingStats.area;
      case 'harmonic':
        return sizingStats.harmonic;
      case 'weighted':
      default:
        return sizingStats.weighted;
    }
  }, [averageType, sizingStats]);

  const totalValidIntensity = useMemo(
    () => validResults.reduce((acc, r) => acc + (r.intensity && r.intensity > 0 ? r.intensity : 1), 0),
    [validResults]
  );

  const chartData = useMemo(() => {
    const source = allResults.length > 0 ? allResults : validResults;
    return source
      .map((r, idx) => {
        const weightPct =
          !r.excluded && r.sizeNm > 0 && totalValidIntensity > 0
            ? ((r.intensity && r.intensity > 0 ? r.intensity : 1) / totalValidIntensity) * 100
            : 0;
        const delta = r.sizeNm - currentSizeNm;
        const isOutlier = sizingStats.stdDev > 0 && Math.abs(delta) / sizingStats.stdDev > 1.8;
        return {
          name: r.hkl ? `(${r.hkl.join('')})` : `#${idx + 1}`,
          twoTheta: r.twoTheta,
          size: r.sizeNm > 0 ? r.sizeNm : 0,
          delta,
          weightPct,
          planesN: r.coherencePlanesN || 0,
          isOutlier,
          excluded: !!r.excluded,
          error: !!r.error || r.sizeNm <= 0,
        };
      })
      .filter((d) => !d.excluded && !d.error);
  }, [validResults, allResults, totalValidIntensity, currentSizeNm, sizingStats.stdDev]);

  const microstructuralProperties = useMemo(() => {
    if (currentSizeNm <= 0) {
      return {
        dislocation10_14: 0,
        ssaM2g: 0,
        particleVolumeNm3: 0,
        particleMassG: 0,
        surfaceToVolumeRatio: 0,
        surfaceAtomFractionPct: 0,
      };
    }

    const dislocation10_14 = 100 / Math.pow(currentSizeNm, 2);
    const ssaM2g = materialDensity > 0 ? 6000 / (materialDensity * currentSizeNm) : 0;
    const rNm = currentSizeNm / 2;
    const particleVolumeNm3 = (4 / 3) * Math.PI * Math.pow(rNm, 3);
    const particleMassG = particleVolumeNm3 * 1e-21 * materialDensity;
    const surfaceToVolumeRatio = currentSizeNm > 0 ? 6 / currentSizeNm : 0;

    const dShellNm = Math.max(0.22, (sizingStats.avgDSpacing || 2.5) / 10);
    const coreRatio = Math.max(0, (currentSizeNm - 2 * dShellNm) / currentSizeNm);
    const surfaceAtomFractionPct = Math.min(99.9, (1 - Math.pow(coreRatio, 3)) * 100);

    return {
      dislocation10_14,
      ssaM2g,
      particleVolumeNm3,
      particleMassG,
      surfaceToVolumeRatio,
      surfaceAtomFractionPct,
    };
  }, [currentSizeNm, materialDensity, sizingStats.avgDSpacing]);

  const regimeInfo = useMemo(() => {
    if (currentSizeNm <= 0)
      return {
        label: 'Awaiting Active Reflections',
        tone: 'text-slate-500 dark:text-slate-400',
        desc: 'Ensure at least one reflection has FWHM > β_inst',
      };
    if (currentSizeNm < 10)
      return {
        label: 'Quantum Confinement (<10 nm)',
        tone: 'text-indigo-700 dark:text-indigo-300',
        desc: 'Extreme nanoscale regime with high surface atom fraction (>15%). Strong Scherrer broadening.',
      };
    if (currentSizeNm < 50)
      return {
        label: 'Optimal Scherrer Window (10–50 nm)',
        tone: 'text-emerald-700 dark:text-emerald-400',
        desc: 'Ideal analytical window for the Scherrer equation. Finite size broadening dominates optics.',
      };
    if (currentSizeNm < 100)
      return {
        label: 'Nanocrystalline Regime (50–100 nm)',
        tone: 'text-sky-700 dark:text-sky-400',
        desc: 'High reliability. Ensure instrumental line profile deconvolution is calibrated.',
      };
    if (currentSizeNm < 200)
      return {
        label: 'Approaching Optics Limit (100–200 nm)',
        tone: 'text-amber-700 dark:text-amber-400',
        desc: 'Approaching diffractometer resolution boundary. Sample broadening is small relative to slit optics.',
      };
    return {
      label: 'Instrument-Dominated (>200 nm)',
      tone: 'text-rose-700 dark:text-rose-400',
      desc: 'Exceeds reliable Scherrer boundary. Broadening is dominated by instrumental resolution.',
    };
  }, [currentSizeNm]);

  const pdiClassification = useMemo(() => {
    if (sizingStats.pdi < 0.05)
      return { label: 'Monodisperse', tone: 'text-emerald-700 dark:text-emerald-400' };
    if (sizingStats.pdi < 0.2)
      return { label: 'Moderate', tone: 'text-amber-700 dark:text-amber-400' };
    return { label: 'Anisotropic / Broad', tone: 'text-indigo-700 dark:text-indigo-300' };
  }, [sizingStats.pdi]);

  const activeMomentMeta = MOMENT_META.find((m) => m.id === averageType) ?? MOMENT_META[0];

  const formatScaledSize = (nmVal: number, unit: DisplayUnit) => {
    if (unit === 'A') return (nmVal * 10).toFixed(Math.max(1, precision - 1));
    if (unit === 'pm') return (nmVal * 1000).toFixed(0);
    if (unit === 'um') return (nmVal / 1000).toFixed(4);
    return nmVal.toFixed(precision);
  };

  const unitLabel = (unit: DisplayUnit) => (unit === 'A' ? 'Å' : unit === 'um' ? 'µm' : unit);

  const openTraceAt = (tab: 'trace' | 'models' | 'physics' | 'diagnostics') => {
    setTraceTab(tab);
    setWorkspaceView('trace');
  };

  const handleCopySummary = (type: 'summary' | 'markdown' | 'latex' | 'unit') => {
    let text = '';
    if (type === 'summary') {
      text = `The coherent scattering domain size of ${selectedMaterial} was determined via the Scherrer equation (K = ${constantK}, λ = ${wavelength} Å, ${broadeningModel} instrumental deconvolution, β_inst = ${instFwhm}°) across N = ${sizingStats.count}/${totalReflectionsCount} resolved Bragg reflections, yielding a ${averageType} mean crystallite size of ${currentSizeNm.toFixed(precision)} ± ${sizingStats.stdDev.toFixed(2)} nm (95% CI: ±${sizingStats.ci95.toFixed(2)} nm; volume-weighted D_V = ${sizingStats.volume.toFixed(precision)} nm, number mean D_num = ${sizingStats.arithmetic.toFixed(precision)} nm), corresponding to an estimated specific surface area of ${microstructuralProperties.ssaM2g.toFixed(1)} m²/g and a dislocation density of δ = ${microstructuralProperties.dislocation10_14.toFixed(2)} × 10¹⁴ m⁻².`;
    } else if (type === 'markdown') {
      text = `### Crystallite Size & Microstructure Report (Scherrer Method)
- **Primary Mean Size (${averageType})**: ${currentSizeNm.toFixed(precision)} nm
- **95% Confidence Interval**: ${currentSizeNm.toFixed(precision)} ± ${sizingStats.ci95.toFixed(2)} nm (SEM: ${sizingStats.sem.toFixed(2)} nm)
- **Standard Deviation (s)**: ${sizingStats.stdDev.toFixed(2)} nm (CV: ${sizingStats.relDispersion.toFixed(1)}%)
- **Total Reflections**: ${sizingStats.count} active resolved / ${totalReflectionsCount} total (${excludedReflectionsCount} excluded)
- **Polydispersity Index (PDI)**: ${sizingStats.pdi.toFixed(3)} (${pdiClassification.label})
- **Intensity-Weighted ($D_{int}$)**: ${sizingStats.weighted.toFixed(precision)} nm
- **Arithmetic Number Mean ($D_{num}$)**: ${sizingStats.arithmetic.toFixed(precision)} nm
- **Volume-Weighted ($D_V$)**: ${sizingStats.volume.toFixed(precision)} nm
- **Area-Weighted ($D_A$)**: ${sizingStats.area.toFixed(precision)} nm
- **Harmonic Mean ($D_H$)**: ${sizingStats.harmonic.toFixed(precision)} nm
- **Log-Normal Geometric Mean ($D_g$)**: ${sizingStats.geometricMean.toFixed(precision)} nm ($\\sigma_g$ = ${sizingStats.geometricStdDev.toFixed(3)})
- **Median ($D_{50}$)**: ${sizingStats.median.toFixed(precision)} nm (IQR: ${sizingStats.iqr.toFixed(2)} nm, Q1–Q3: ${sizingStats.q1.toFixed(1)}–${sizingStats.q3.toFixed(1)} nm)
- **Specific Surface Area (SSA)**: ${microstructuralProperties.ssaM2g.toFixed(1)} m²/g (${selectedMaterial}, ρ = ${materialDensity} g/cm³)
- **Surface Atom Fraction ($f_{surf}$)**: ${microstructuralProperties.surfaceAtomFractionPct.toFixed(1)}%
- **Dislocation Density ($\\delta$)**: ${microstructuralProperties.dislocation10_14.toFixed(2)} × 10¹⁴ m⁻²
- **Anisotropy Ratio**: ${sizingStats.anisotropyIndex.toFixed(2)}:1`;
    } else if (type === 'latex') {
      const rowsLatex = validResults
        .map((r, i) => {
          const hklStr = r.hkl ? `(${r.hkl.join('')})` : `Peak ${i + 1}`;
          const disloc = (100 / Math.pow(r.sizeNm, 2)).toFixed(2);
          return `${hklStr} & ${r.twoTheta.toFixed(2)} & ${r.dSpacing ? r.dSpacing.toFixed(3) : '-'} & ${r.fwhmObs.toFixed(3)} & ${r.betaCorrected.toFixed(3)} & ${r.sizeNm.toFixed(precision)} & ${disloc} \\\\`;
        })
        .join('\n');
      text = `\\begin{table}[htbp]
\\centering
\\caption{Scherrer Crystallite Sizing and Microstructural Parameters for ${selectedMaterial} ($\\lambda = ${wavelength}$ \\AA, $K = ${constantK}$)}
\\begin{tabular}{lcccccc}
\\hline
Reflection $(hkl)$ & $2\\theta$ ($^\\circ$) & $d_{hkl}$ (\\AA) & $\\beta_{\\text{obs}}$ ($^\\circ$) & $\\beta_{\\text{sample}}$ ($^\\circ$) & $D_{hkl}$ (nm) & $\\delta$ ($10^{14}$ m$^{-2}$) \\\\
\\hline
${rowsLatex}
\\hline
\\multicolumn{5}{l}{\\textbf{Mean Crystallite Size (${averageType.toUpperCase()})}} & \\textbf{${currentSizeNm.toFixed(precision)} $\\pm$ ${sizingStats.stdDev.toFixed(2)}} & \\textbf{${microstructuralProperties.dislocation10_14.toFixed(2)}} \\\\
\\hline
\\end{tabular}
\\end{table}`;
    } else if (type === 'unit') {
      text = `${currentSizeNm.toFixed(precision)} nm | ${(currentSizeNm * 10).toFixed(1)} Å | ${(currentSizeNm * 1000).toFixed(0)} pm | ${(currentSizeNm / 1000).toFixed(4)} µm`;
    }

    navigator.clipboard?.writeText(text);
    setCopiedMode(type);
    setTimeout(() => setCopiedMode(null), 2200);
  };

  const handleDownloadCSV = () => {
    const csvHeader =
      'Peak_Index,Status,TwoTheta_deg,hkl,dSpacing_A,FWHM_deg,Beta_Corrected_deg,Intensity,Size_nm,Deviation_from_Mean_nm,Deviation_Pct,Weight_Pct,Dislocation_Density_10_14_m2,Coherent_Planes\n';
    const totalIntensity = validResults.reduce((acc, r) => acc + (r.intensity || 1), 0);
    const sourceList = allResults.length > 0 ? allResults : validResults;
    const csvRows = sourceList
      .map((r, idx) => {
        const hklStr = r.hkl ? `"(${r.hkl.join('')})"` : `"Peak ${idx + 1}"`;
        const status = r.excluded ? 'Excluded' : r.error ? 'Unresolved' : 'Active';
        const dev = r.sizeNm > 0 ? r.sizeNm - currentSizeNm : 0;
        const devPct = currentSizeNm > 0 && r.sizeNm > 0 ? (dev / currentSizeNm) * 100 : 0;
        const weightPct =
          !r.excluded && r.sizeNm > 0 && totalIntensity > 0
            ? ((r.intensity || 1) / totalIntensity) * 100
            : 0;
        const disloc = r.sizeNm > 0 ? 100 / Math.pow(r.sizeNm, 2) : 0;
        return `${idx + 1},${status},${r.twoTheta.toFixed(3)},${hklStr},${r.dSpacing ? r.dSpacing.toFixed(3) : 'N/A'},${r.fwhmObs.toFixed(3)},${r.betaCorrected.toFixed(3)},${r.intensity || 0},${r.sizeNm > 0 ? r.sizeNm.toFixed(precision) : 'N/A'},${dev.toFixed(2)},${devPct.toFixed(1)},${weightPct.toFixed(1)},${disloc > 0 ? disloc.toFixed(2) : 'N/A'},${r.coherencePlanesN || 'N/A'}`;
      })
      .join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `mean_crystallite_sizing_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const momentValues: Record<SizingAverageMethod, number> = {
    weighted: sizingStats.weighted,
    arithmetic: sizingStats.arithmetic,
    volume: sizingStats.volume,
    area: sizingStats.area,
    harmonic: sizingStats.harmonic,
  };

  const maxMomentVal = Math.max(
    1e-6,
    sizingStats.weighted,
    sizingStats.arithmetic,
    sizingStats.volume,
    sizingStats.area,
    sizingStats.harmonic
  );

  return (
    <section className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      {/* ================================================================= */}
      {/* TOP INSTRUMENT HEADER & WORKSPACE SWITCHER                        */}
      {/* ================================================================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
        <div className="space-y-1 min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Mean Crystallite Sizing & Moment Synthesis
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-200">
              {sizingStats.count} / {totalReflectionsCount} reflections resolved
            </span>
            {excludedReflectionsCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{excludedReflectionsCount} excluded</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>
              {activeMomentMeta.label} ({activeMomentMeta.symbol})
            </span>
            <span aria-hidden="true">·</span>
            <span className={`font-medium ${regimeInfo.tone}`} title={regimeInfo.desc}>
              {regimeInfo.label}
            </span>
          </div>
        </div>

        {/* Unified View Segmented Switcher + Compact Publication Exports */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-0.5 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            {(
              [
                { id: 'summary', label: 'Synthesis', icon: null },
                { id: 'chart', label: 'Distribution', icon: BarChart2 },
                { id: 'trace', label: 'Math Trace', icon: Calculator },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = workspaceView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setWorkspaceView(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2.5">
            <button
              type="button"
              onClick={() => handleCopySummary('summary')}
              title="Copy publication-ready manuscript paragraph"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedMode === 'summary' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{copiedMode === 'summary' ? 'Copied' : 'Cite'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopySummary('latex')}
              title="Copy LaTeX journal table"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedMode === 'latex' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Code className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline">{copiedMode === 'latex' ? 'Copied' : 'LaTeX'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopySummary('markdown')}
              title="Copy Markdown lab report"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedMode === 'markdown' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline">{copiedMode === 'markdown' ? 'Copied' : 'MD'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              title="Download CSV spreadsheet"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* BODY CONTENT                                                      */}
      {/* ================================================================= */}
      <div className="p-5 lg:p-6 space-y-5">
        {/* VIEW 2: FACET-BY-FACET DISTRIBUTION CHART */}
        {workspaceView === 'chart' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-950/60 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Facet-by-Facet Crystallite Size Distribution (D_hkl)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Apparent domain sizes across resolved Miller planes against {activeMomentMeta.symbol} ={' '}
                  <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                    {currentSizeNm.toFixed(precision)} ± {sizingStats.stdDev.toFixed(2)} nm
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
                  Within ±1.8σ
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                  Outlier (|Z| &gt; 1.8)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 h-0 border-t border-dashed border-amber-500 inline-block" />
                  Active Mean
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 14, right: 24, left: 4, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    unit=" nm"
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono tabular-nums shadow-lg space-y-1 text-slate-800 dark:text-slate-200">
                          <div className="font-sans font-semibold text-slate-900 dark:text-white">
                            {d.name} · 2θ = {d.twoTheta.toFixed(2)}°
                          </div>
                          <div>
                            D_hkl = <strong>{d.size.toFixed(precision)} nm</strong>
                          </div>
                          <div className={d.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            Δ Mean = {d.delta >= 0 ? '+' : ''}
                            {d.delta.toFixed(2)} nm
                          </div>
                          <div className="text-slate-500 dark:text-slate-400">
                            Weight {d.weightPct.toFixed(1)}% · ~{d.planesN} planes
                          </div>
                        </div>
                      );
                    }}
                  />
                  {sizingStats.count > 1 && sizingStats.stdDev > 0 && (
                    <ReferenceArea
                      y1={Math.max(0, currentSizeNm - sizingStats.stdDev)}
                      y2={currentSizeNm + sizingStats.stdDev}
                      fill="#0ea5e9"
                      fillOpacity={0.09}
                    />
                  )}
                  <ReferenceLine
                    y={currentSizeNm}
                    stroke="#d97706"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: `${activeMomentMeta.symbol} ${currentSizeNm.toFixed(1)} nm`,
                      fill: '#d97706',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      position: 'insideTopRight',
                    }}
                  />
                  <Bar dataKey="size" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isOutlier ? '#f59e0b' : '#0284c7'}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* PRIMARY 2-ZONE HERO & MICROSTRUCTURE MATRIX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Zone: Primary Crystallite Size Readout & Quantile Span Ruler */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="space-y-3">
              {/* Top Kicker + Unit Switcher */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>{activeMomentMeta.label}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    (<MathFormula tex={activeMomentMeta.texSymbol} />)
                  </span>
                </div>
                <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                  {(['nm', 'A', 'pm', 'um'] as DisplayUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setDisplayUnit(u)}
                      className={`px-1.5 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                        displayUnit === u
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {unitLabel(u)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Authoritative Measurement */}
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {formatScaledSize(currentSizeNm, displayUnit)}
                </span>
                <span className="text-xl font-semibold font-mono text-blue-600 dark:text-sky-400">
                  {unitLabel(displayUnit)}
                </span>
                {sizingStats.count > 1 && (
                  <span className="text-sm font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    ± {formatScaledSize(sizingStats.stdDev, displayUnit)} {unitLabel(displayUnit)}
                  </span>
                )}
              </div>

              {/* Unboxed Precision Uncertainty Line */}
              {sizingStats.count > 1 ? (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  <span>
                    95% CI <strong className="text-slate-900 dark:text-white">±{sizingStats.ci95.toFixed(2)} nm</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <span>
                    SEM <strong className="text-slate-800 dark:text-slate-200">{sizingStats.sem.toFixed(2)} nm</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  <span>
                    CV <strong className="text-slate-800 dark:text-slate-200">{sizingStats.relDispersion.toFixed(1)}%</strong>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Single reflection active — include ≥ 2 resolved peaks for confidence intervals.
                </p>
              )}

              {/* Log-Normal & Instrument Constants Line */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <span>
                  <MathFormula tex="D_g" className="text-slate-600 dark:text-slate-300" />{' '}
                  <strong className="text-slate-700 dark:text-slate-200">{sizingStats.geometricMean.toFixed(1)} nm</strong>{' '}
                  (<MathFormula tex="\sigma_g" className="text-slate-600 dark:text-slate-300" /> {sizingStats.geometricStdDev.toFixed(2)})
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <MathFormula tex={`K = ${constantK}`} className="text-slate-600 dark:text-slate-300" />
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <MathFormula tex={`\\lambda = ${wavelength}\\,\\text{\\AA}`} className="text-slate-600 dark:text-slate-300" />
                </span>
              </div>
            </div>

            {/* Quantile Span Ruler (Min · Q1 · D50 · Q3 · Max) */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              {sizingStats.count > 1 && sizingStats.max > sizingStats.min && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    <span>
                      Min <strong className="text-slate-800 dark:text-slate-200">{sizingStats.min.toFixed(1)}</strong>
                    </span>
                    <span>
                      Q₁ <strong className="text-slate-700 dark:text-slate-300">{sizingStats.q1.toFixed(1)}</strong>
                    </span>
                    <span>
                      D₅₀ <strong className="text-slate-900 dark:text-white">{sizingStats.median.toFixed(1)}</strong>
                    </span>
                    <span>
                      Q₃ <strong className="text-slate-700 dark:text-slate-300">{sizingStats.q3.toFixed(1)}</strong>
                    </span>
                    <span>
                      Max <strong className="text-slate-800 dark:text-slate-200">{sizingStats.max.toFixed(1)} nm</strong>
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-200/90 dark:bg-slate-800 rounded-full overflow-hidden">
                    {(() => {
                      const span = Math.max(0.01, sizingStats.max - sizingStats.min);
                      const q1Left = Math.max(0, Math.min(100, ((sizingStats.q1 - sizingStats.min) / span) * 100));
                      const q3Right = Math.max(0, Math.min(100, ((sizingStats.q3 - sizingStats.min) / span) * 100));
                      const medPos = Math.max(0, Math.min(100, ((sizingStats.median - sizingStats.min) / span) * 100));
                      const meanPos = Math.max(0, Math.min(100, ((currentSizeNm - sizingStats.min) / span) * 100));
                      return (
                        <>
                          <div
                            className="absolute top-0 bottom-0 bg-blue-500/30 dark:bg-sky-400/30"
                            style={{ left: `${q1Left}%`, width: `${Math.max(4, q3Right - q1Left)}%` }}
                            title={`IQR (Q1–Q3): ${sizingStats.q1.toFixed(1)}–${sizingStats.q3.toFixed(1)} nm`}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-700 dark:bg-white/80"
                            style={{ left: `${medPos}%` }}
                            title={`Median D50: ${sizingStats.median.toFixed(2)} nm`}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-blue-600 dark:bg-sky-400"
                            style={{ left: `${meanPos}%` }}
                            title={`Active Mean (${activeMomentMeta.symbol}): ${currentSizeNm.toFixed(2)} nm`}
                          />
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => handleCopySummary('unit')}
                  className="text-left hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer truncate"
                  title="Click to copy all unit conversions"
                >
                  {(currentSizeNm * 10).toFixed(1)} Å · {(currentSizeNm * 1000).toFixed(0)} pm ·{' '}
                  {(currentSizeNm / 1000).toFixed(4)} µm
                </button>
                <span className="shrink-0 font-sans text-[11px]">
                  {copiedMode === 'unit' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                  ) : (
                    'Click to copy'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Zone: Clean 2×2 Hairline-Divided Microstructural Matrix */}
          <div className="lg:col-span-7 flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/60 overflow-visible">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-200 dark:divide-slate-800 flex-1">
              {/* Cell 1: Dislocation Density */}
              <div className="p-4 sm:p-5 sm:border-r sm:border-b border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Dislocation Density (<MathFormula tex="\delta" />)
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {microstructuralProperties.dislocation10_14.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">×10¹⁴ lines/m²</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Williamson–Smallman</span>
                  <span aria-hidden="true">·</span>
                  <MathFormula tex="\delta = 1/D^2" className="text-slate-700 dark:text-slate-300" />
                </div>
              </div>

              {/* Cell 2: Specific Surface Area + Inline Density Selector */}
              <div className="p-4 sm:p-5 sm:border-b border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Specific Surface Area (SSA)</span>
                  <div className="relative" ref={densityDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsMaterialDropdownOpen((o) => !o)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
                      title="Change crystal density ρ used in SSA = 6000 / (ρ·D)"
                    >
                      <span>ρ = {materialDensity} g/cm³</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {isMaterialDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 z-50 space-y-1.5 text-xs">
                        <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          Crystal Density (SSA)
                        </div>
                        <div className="max-h-52 overflow-y-auto space-y-0.5">
                          {materialOptions.map((mat) => (
                            <button
                              key={mat.label}
                              type="button"
                              onClick={() => {
                                onMaterialDensityChange(mat.density, mat.label);
                                setCustomDensityInput(mat.density.toString());
                                setIsMaterialDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                                selectedMaterial === mat.label
                                  ? 'bg-blue-50 dark:bg-sky-950/60 text-blue-700 dark:text-sky-300 font-medium'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate">{mat.label}</span>
                              <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                                {mat.density}
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 px-1">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Custom ρ</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              min="0.1"
                              value={customDensityInput}
                              onChange={(e) => {
                                setCustomDensityInput(e.target.value);
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  onMaterialDensityChange(val, 'Custom Density');
                                }
                              }}
                              className="w-20 px-2 py-1 text-right font-mono text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-[10px] font-mono text-slate-400">g/cm³</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {microstructuralProperties.ssaM2g.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">m² / g</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <span className="truncate">{selectedMaterial}</span>
                  <span aria-hidden="true">·</span>
                  <MathFormula tex="\mathrm{SSA} = 6000/(\rho D)" className="text-slate-700 dark:text-slate-300 shrink-0" />
                </div>
              </div>

              {/* Cell 3: Coherent Lattice Planes & Surface Atom Fraction */}
              <div className="p-4 sm:p-5 sm:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Coherent Lattice Layers (<MathFormula tex="N = D/d_{hkl}" />)
                </div>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                    ~{sizingStats.avgPlanes}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">planes</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  <span>
                    <MathFormula tex="\bar{d}" /> = {sizingStats.avgDSpacing.toFixed(2)} Å
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    <MathFormula tex="f_{\mathrm{surf}}" /> ≈ {microstructuralProperties.surfaceAtomFractionPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Cell 4: Facet Anisotropy & Polydispersity */}
              <div className="p-4 sm:p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Anisotropy &amp; Dispersion</span>
                  <span className={`text-[11px] font-medium ${pdiClassification.tone}`}>
                    {pdiClassification.label}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2 font-mono tabular-nums">
                  <span className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {sizingStats.anisotropyIndex.toFixed(2)}:1
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    PDI {sizingStats.pdi.toFixed(3)}
                  </span>
                </div>
                <div className="mt-2 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>
                    {sizingStats.min.toFixed(1)}–{sizingStats.max.toFixed(1)} nm
                  </span>
                  <span aria-hidden="true">·</span>
                  <MathFormula tex="D_{\max}/D_{\min}" className="text-slate-700 dark:text-slate-300" />
                </div>
              </div>
            </div>

            {/* Quiet Contextual Derivation Bar */}
            <div className="px-4 sm:px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Spherical-equivalent microstructure estimates from{' '}
                <MathFormula tex={activeMomentMeta.texSymbol} className="text-slate-800 dark:text-slate-200" />.
              </span>
              <button
                type="button"
                onClick={() => openTraceAt('physics')}
                className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-sky-400 hover:underline cursor-pointer whitespace-nowrap"
              >
                <span>Inspect physical derivations</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* CONTEXTUAL SCIENTIFIC WARNINGS (NON-HUE-ONLY, NO THICK LEFT BORDER) */}
        {(Math.abs(whSlope) > 0.0008 || currentSizeNm > 150) && (
          <div className="space-y-2.5">
            {Math.abs(whSlope) > 0.0008 && (
              <div className="px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Microstrain Contamination:</strong> Williamson–Hall slope indicates lattice strain (ε ≈{' '}
                  <span className="font-mono">{(Math.abs(whSlope) * 100).toFixed(2)}%</span>). Peak broadening includes strain; pure Scherrer sizing will underestimate true crystallite dimensions.
                </div>
              </div>
            )}
            {currentSizeNm > 150 && (
              <div className="px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/30 flex items-start gap-2.5 text-xs text-rose-950 dark:text-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Instrument Resolution Boundary:</strong> Calculated size (
                  <span className="font-mono">{currentSizeNm.toFixed(1)} nm</span>) approaches or exceeds typical lab diffractometer resolution (~100–150 nm). Verify β_inst calibration against a NIST SRM 640/660 standard.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5-MOMENT STATISTICAL SYNTHESIS STRIP */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Statistical Moment Synthesis — Select Primary Averaging Model
            </div>
            <button
              type="button"
              onClick={() => openTraceAt('models')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Compare XRD vs. TEM moments</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60">
            {MOMENT_META.map((method) => {
              const isActive = averageType === method.id;
              const val = momentValues[method.id];
              const pctWidth = Math.max(8, Math.min(100, (val / maxMomentVal) * 100));
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => onAverageTypeChange(method.id)}
                  title={method.desc}
                  className={`relative p-3.5 text-left transition-colors cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'bg-blue-50/70 dark:bg-sky-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-sky-400"
                    />
                  )}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-sm ${
                        isActive ? 'text-blue-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <MathFormula tex={method.texSymbol} />
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />}
                  </div>

                  <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums">
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      {val.toFixed(precision)}
                    </span>
                    <span className="text-[11px] text-slate-400">nm</span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className="h-1 w-full bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={isActive ? 'h-full bg-blue-600 dark:bg-sky-400' : 'h-full bg-slate-400/60 dark:bg-slate-600'}
                        style={{ width: `${pctWidth}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1 text-[10.5px]">
                      <span className="text-slate-600 dark:text-slate-300 truncate">{method.label}</span>
                      <span className="text-slate-500 dark:text-slate-400 shrink-0 hidden xl:inline">
                        <MathFormula tex={method.texFormula} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* EXPANDABLE MATH TRACE VIEW (WHEN ACTIVE) */}
        <AnimatePresence>
          {workspaceView === 'trace' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <MeanCrystalliteCalculationTrace
                validResults={validResults}
                constantK={constantK}
                wavelength={wavelength}
                precision={precision}
                averageType={averageType}
                currentSizeNm={currentSizeNm}
                materialDensity={materialDensity}
                selectedMaterial={selectedMaterial}
                instFwhm={instFwhm}
                broadeningModel={broadeningModel}
                whSlope={whSlope}
                initialTab={traceTab}
                onClose={() => setWorkspaceView('summary')}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* FACET-BY-FACET REFLECTION CONTRIBUTIONS MATRIX */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                Facet-by-Facet Reflection Contributions
              </h4>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Active {sizingStats.count} / {totalReflectionsCount}
                {excludedReflectionsCount > 0 ? ` · ${excludedReflectionsCount} excluded` : ''}
                {unresolvedReflectionsCount > 0 ? ` · ${unresolvedReflectionsCount} at limit` : ''}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onAutoPruneOutliers && sizingStats.outlierCount > 0 && (
                <button
                  type="button"
                  onClick={onAutoPruneOutliers}
                  title="Automatically exclude outlier reflections (|Z| > 1.8)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Filter className="w-3 h-3" />
                  <span>
                    Prune {sizingStats.outlierCount} Outlier{sizingStats.outlierCount > 1 ? 's' : ''}
                  </span>
                </button>
              )}

              {onIncludeAllPeaks && excludedReflectionsCount > 0 && (
                <button
                  type="button"
                  onClick={onIncludeAllPeaks}
                  title="Re-include all excluded reflections"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Include All ({totalReflectionsCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowFacetTable((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{showFacetTable ? 'Collapse' : 'Expand'}</span>
                {showFacetTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showFacetTable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-x-auto"
              >
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400">
                      {onTogglePeakExclusion && <th className="py-2.5 px-3 text-center">Use</th>}
                      <th className="py-2.5 px-3.5">Reflection</th>
                      <th className="py-2.5 px-3 text-right">2θ (°)</th>
                      <th className="py-2.5 px-3 text-right">d (Å)</th>
                      <th className="py-2.5 px-3 text-right">β_obs / β_s (°)</th>
                      <th className="py-2.5 px-3 text-right">Weight (I%)</th>
                      <th className="py-2.5 px-3 text-right">Size D_hkl (nm)</th>
                      <th className="py-2.5 px-3 text-right">Δ Mean</th>
                      <th className="py-2.5 px-3 text-right">δ (10¹⁴ m⁻²)</th>
                      <th className="py-2.5 px-3.5 text-right">Planes (N)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {(allResults.length > 0 ? allResults : validResults).map((r, idx) => {
                      const hklLabel = r.hkl ? `(${r.hkl.join('')})` : `#${idx + 1}`;
                      const isExcluded = !!r.excluded;
                      const hasError = !!r.error || r.sizeNm <= 0;
                      const delta = !hasError ? r.sizeNm - currentSizeNm : 0;
                      const deltaPct = !hasError && currentSizeNm > 0 ? (delta / currentSizeNm) * 100 : 0;
                      const disloc = !hasError ? 100 / Math.pow(r.sizeNm, 2) : 0;
                      const weightPct =
                        !isExcluded && !hasError && totalValidIntensity > 0
                          ? ((r.intensity && r.intensity > 0 ? r.intensity : 1) / totalValidIntensity) * 100
                          : 0;
                      const isOutlier =
                        !isExcluded &&
                        !hasError &&
                        sizingStats.stdDev > 0 &&
                        Math.abs(delta) / sizingStats.stdDev > 1.8;

                      return (
                        <tr
                          key={idx}
                          className={`transition-colors ${
                            isExcluded
                              ? 'opacity-45 bg-slate-50/60 dark:bg-slate-950/50'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {onTogglePeakExclusion && (
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => onTogglePeakExclusion(idx)}
                                className={`w-6 h-6 rounded-md inline-flex items-center justify-center transition-colors cursor-pointer border ${
                                  isExcluded
                                    ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                                }`}
                                title={
                                  isExcluded
                                    ? 'Include reflection in mean sizing'
                                    : 'Exclude reflection from mean sizing'
                                }
                              >
                                {isExcluded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </td>
                          )}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 dark:text-white">{hklLabel}</span>
                            {isOutlier && (
                              <span
                                className="ml-1.5 font-sans text-[11px] font-medium text-amber-700 dark:text-amber-400"
                                title="Statistical outlier (|Z| > 1.8)"
                              >
                                · Outlier
                              </span>
                            )}
                            {isExcluded && (
                              <span className="ml-1.5 font-sans text-[11px] text-slate-400">· Excluded</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {r.twoTheta.toFixed(3)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                            {r.dSpacing ? r.dSpacing.toFixed(3) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {r.fwhmObs.toFixed(3)} /{' '}
                            <span className="text-slate-800 dark:text-slate-200">{r.betaCorrected.toFixed(3)}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-2">
                              <div className="hidden sm:block w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600/80 dark:bg-sky-400/80"
                                  style={{ width: `${Math.min(100, weightPct)}%` }}
                                />
                              </div>
                              <span className="text-slate-700 dark:text-slate-300">
                                {!isExcluded && !hasError ? `${weightPct.toFixed(1)}%` : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">
                            {hasError ? (
                              <span className="text-rose-600 dark:text-rose-400 font-sans text-[11px] font-medium">
                                β_obs ≤ β_inst
                              </span>
                            ) : (
                              <span className="text-slate-900 dark:text-white">
                                {r.sizeNm.toFixed(precision)}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {hasError || isExcluded ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <span
                                className={
                                  delta >= 0
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }
                              >
                                {delta >= 0 ? '+' : ''}
                                {delta.toFixed(2)} ({deltaPct >= 0 ? '+' : ''}
                                {deltaPct.toFixed(1)}%)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                            {hasError ? '—' : disloc.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3.5 text-right text-slate-700 dark:text-slate-300">
                            {hasError ? '—' : `~${r.coherencePlanesN || '—'}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
