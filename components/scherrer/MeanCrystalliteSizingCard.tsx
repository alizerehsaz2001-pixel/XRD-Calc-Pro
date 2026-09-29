import React, { useState, useMemo } from 'react';
import { ScherrerResult } from '../../types';
import { 
  Zap, Copy, CheckCircle2, Sparkles, ChevronDown, ChevronUp, 
  AlertTriangle, Scale, Atom, Layers, Compass, Download, Check, FileText,
  HelpCircle, Lightbulb, BookOpen, Eye, EyeOff, Filter, RotateCcw, Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MeanCrystalliteCalculationTrace } from './MeanCrystalliteCalculationTrace';

export type SizingAverageMethod = 'weighted' | 'arithmetic' | 'volume' | 'area' | 'harmonic';

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
  broadeningModel = 'Gaussian'
}) => {
  const [copiedMode, setCopiedMode] = useState<'summary' | 'markdown' | 'latex' | 'unit' | null>(null);
  const [showFacetTable, setShowFacetTable] = useState(true);
  const [showTrace, setShowTrace] = useState(false);
  const [traceTab, setTraceTab] = useState<'trace' | 'models' | 'physics' | 'diagnostics'>('trace');
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [customDensityInput, setCustomDensityInput] = useState<string>(materialDensity.toString());

  const totalReflectionsCount = allResults.length > 0 ? allResults.length : validResults.length;
  const excludedReflectionsCount = allResults.filter(r => r.excluded).length;
  const unresolvedReflectionsCount = allResults.filter(r => !r.excluded && (r.error || r.sizeNm <= 0)).length;

  // 1. Compute multi-method statistical metrics
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
        outlierCount: 0
      };
    }

    const count = validResults.length;
    const sizes = validResults.map(r => r.sizeNm);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);

    // Arithmetic
    const sum = sizes.reduce((acc, val) => acc + val, 0);
    const arithmetic = sum / count;

    // Intensity Weighted
    let totalWeight = 0;
    let weightedSum = 0;
    validResults.forEach(r => {
      const weight = r.intensity && r.intensity > 0 ? r.intensity : 1;
      weightedSum += r.sizeNm * weight;
      totalWeight += weight;
    });
    const weighted = totalWeight > 0 ? weightedSum / totalWeight : arithmetic;

    // Volume-Weighted (D_V = sum(D^4) / sum(D^3))
    const sumD4 = sizes.reduce((acc, d) => acc + Math.pow(d, 4), 0);
    const sumD3 = sizes.reduce((acc, d) => acc + Math.pow(d, 3), 0);
    const volume = sumD3 > 0 ? sumD4 / sumD3 : arithmetic;

    // Area-Weighted (D_A = sum(D^3) / sum(D^2))
    const sumD2 = sizes.reduce((acc, d) => acc + Math.pow(d, 2), 0);
    const area = sumD2 > 0 ? sumD3 / sumD2 : arithmetic;

    // Harmonic Mean (D_H = N / sum(1/D_i))
    const sumInv = sizes.reduce((acc, d) => acc + (1 / Math.max(0.01, d)), 0);
    const harmonic = sumInv > 0 ? count / sumInv : arithmetic;

    // Geometric Mean & Log-Normal Std Dev
    const logSum = sizes.reduce((acc, d) => acc + Math.log(Math.max(0.1, d)), 0);
    const geometricMean = Math.exp(logSum / count);
    const logVar = sizes.reduce((acc, d) => acc + Math.pow(Math.log(Math.max(0.1, d)) - Math.log(geometricMean), 2), 0) / count;
    const geometricStdDev = Math.exp(Math.sqrt(logVar));

    // Median & Quartiles
    const sorted = [...sizes].sort((a, b) => a - b);
    const median = count % 2 === 1
      ? sorted[Math.floor(count / 2)]
      : (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
    const q1 = sorted[Math.floor((count - 1) * 0.25)];
    const q3 = sorted[Math.floor((count - 1) * 0.75)];
    const iqr = Math.max(0, q3 - q1);

    // Determine current mean based on selected averaging method
    let currentMean = weighted;
    if (averageType === 'arithmetic') currentMean = arithmetic;
    else if (averageType === 'volume') currentMean = volume;
    else if (averageType === 'area') currentMean = area;
    else if (averageType === 'harmonic') currentMean = harmonic;

    // Variance & Standard Deviation
    const variance = count > 1
      ? sizes.reduce((acc, d) => acc + Math.pow(d - currentMean, 2), 0) / (count - 1)
      : 0;
    const stdDev = Math.sqrt(variance);
    const sem = count > 1 ? stdDev / Math.sqrt(count) : 0;

    // Student's t critical value for 95% confidence
    const tTable = [0, 12.71, 4.30, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23];
    const tCrit = count <= 10 && count > 0 ? (tTable[count - 1] || 2.23) : (1.96 + 2.4 / count);
    const ci95 = count > 1 ? tCrit * sem : 0;

    // Polydispersity Index (PDI)
    const pdi = currentMean > 0 ? Math.pow(stdDev / currentMean, 2) : 0;
    const relDispersion = currentMean > 0 ? (stdDev / currentMean) * 100 : 0;

    // Anisotropy & lattice planes
    const anisotropyIndex = min > 0 ? max / min : 1;
    const avgPlanes = Math.round(validResults.reduce((acc, r) => acc + (r.coherencePlanesN || 0), 0) / count);
    const avgDSpacing = validResults.reduce((acc, r) => acc + (r.dSpacing || 0), 0) / count;

    // Outlier count (|Z| > 1.8)
    const outlierCount = stdDev > 0
      ? sizes.filter(s => Math.abs(s - currentMean) / stdDev > 1.8).length
      : 0;

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
      outlierCount
    };
  }, [validResults, averageType]);

  // Active mean size in nanometers
  const currentSizeNm = useMemo(() => {
    switch (averageType) {
      case 'arithmetic': return sizingStats.arithmetic;
      case 'volume': return sizingStats.volume;
      case 'area': return sizingStats.area;
      case 'harmonic': return sizingStats.harmonic;
      case 'weighted':
      default:
        return sizingStats.weighted;
    }
  }, [averageType, sizingStats]);

  // Live Microstructural Properties based on chosen mean & density
  const microstructuralProperties = useMemo(() => {
    if (currentSizeNm <= 0) {
      return {
        dislocation10_14: 0,
        ssaM2g: 0,
        particleVolumeNm3: 0,
        particleMassG: 0,
        surfaceToVolumeRatio: 0,
        surfaceAtomFractionPct: 0
      };
    }

    // Dislocation density: delta = 1 / D^2 (10^14 lines/m^2)
    const dislocation10_14 = 100 / Math.pow(currentSizeNm, 2);

    // Specific Surface Area: SSA = 6000 / (rho * D_nm) in m^2/g
    const ssaM2g = materialDensity > 0 ? (6000 / (materialDensity * currentSizeNm)) : 0;

    // Single spherical particle volume & mass
    const rNm = currentSizeNm / 2;
    const particleVolumeNm3 = (4 / 3) * Math.PI * Math.pow(rNm, 3);
    const particleMassG = particleVolumeNm3 * 1e-21 * materialDensity;
    const surfaceToVolumeRatio = currentSizeNm > 0 ? (6 / currentSizeNm) : 0;

    // Surface atom dispersion fraction: f_surf = 1 - ((D - 2*d_shell)/D)^3
    const dShellNm = Math.max(0.22, (sizingStats.avgDSpacing || 2.5) / 10);
    const coreRatio = Math.max(0, (currentSizeNm - 2 * dShellNm) / currentSizeNm);
    const surfaceAtomFractionPct = Math.min(99.9, (1 - Math.pow(coreRatio, 3)) * 100);

    return {
      dislocation10_14,
      ssaM2g,
      particleVolumeNm3,
      particleMassG,
      surfaceToVolumeRatio,
      surfaceAtomFractionPct
    };
  }, [currentSizeNm, materialDensity, sizingStats.avgDSpacing]);

  // Physical regime assessment
  const regimeInfo = useMemo(() => {
    if (currentSizeNm <= 0) return { label: 'Awaiting Active Reflections', color: 'slate', desc: 'Ensure at least one reflection has FWHM > β_inst' };
    if (currentSizeNm < 10) {
      return { 
        label: 'Quantum Confinement (<10 nm)', 
        color: 'indigo',
        desc: 'Extreme nanoscale regime with high surface atom fraction (>15%). Strong Scherrer peak broadening.'
      };
    }
    if (currentSizeNm < 50) {
      return { 
        label: 'Optimal Scherrer Window (10–50 nm)', 
        color: 'emerald',
        desc: 'Gold-standard analytical window for the Scherrer formula. Finite size broadening strongly dominates instrumental optics.'
      };
    }
    if (currentSizeNm < 100) {
      return { 
        label: 'Nanocrystalline Regime (50–100 nm)', 
        color: 'cyan',
        desc: 'High reliability. Broadening is clearly measurable; ensure instrumental line profile deconvolution is calibrated.'
      };
    }
    if (currentSizeNm < 200) {
      return { 
        label: 'Approaching Optics Limit (100–200 nm)', 
        color: 'amber',
        desc: 'Approaching diffractometer resolution boundary. Sample broadening is small relative to slit optics.'
      };
    }
    return { 
      label: 'Instrument-Dominated (>200 nm)', 
      color: 'rose',
      desc: 'Exceeds reliable Scherrer boundary. Sample broadening is dominated by instrumental resolution.'
    };
  }, [currentSizeNm]);

  // Polydispersity classification
  const pdiClassification = useMemo(() => {
    if (sizingStats.pdi < 0.05) return { label: 'Monodisperse (<0.05)', color: 'text-emerald-400' };
    if (sizingStats.pdi < 0.20) return { label: 'Moderate Polydispersity (0.05–0.20)', color: 'text-amber-400' };
    return { label: 'Broad / Anisotropic (>0.20)', color: 'text-purple-400' };
  }, [sizingStats.pdi]);

  // Copy publication summary
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
- **Log-Normal Geometric Mean ($D_g$)**: ${sizingStats.geometricMean.toFixed(precision)} nm ($\sigma_g$ = ${sizingStats.geometricStdDev.toFixed(3)})
- **Median ($D_{50}$)**: ${sizingStats.median.toFixed(precision)} nm (IQR: ${sizingStats.iqr.toFixed(2)} nm, Q1–Q3: ${sizingStats.q1.toFixed(1)}–${sizingStats.q3.toFixed(1)} nm)
- **Specific Surface Area (SSA)**: ${microstructuralProperties.ssaM2g.toFixed(1)} m²/g (${selectedMaterial}, ρ = ${materialDensity} g/cm³)
- **Surface Atom Fraction ($f_{surf}$)**: ${microstructuralProperties.surfaceAtomFractionPct.toFixed(1)}%
- **Dislocation Density ($\delta$)**: ${microstructuralProperties.dislocation10_14.toFixed(2)} × 10¹⁴ m⁻²
- **Anisotropy Ratio**: ${sizingStats.anisotropyIndex.toFixed(2)}:1`;
    } else if (type === 'latex') {
      const rowsLatex = validResults.map((r, i) => {
        const hklStr = r.hkl ? `(${r.hkl.join('')})` : `Peak ${i + 1}`;
        const disloc = (100 / Math.pow(r.sizeNm, 2)).toFixed(2);
        return `${hklStr} & ${r.twoTheta.toFixed(2)} & ${r.dSpacing ? r.dSpacing.toFixed(3) : '-'} & ${r.fwhmObs.toFixed(3)} & ${r.betaCorrected.toFixed(3)} & ${r.sizeNm.toFixed(precision)} & ${disloc} \\\\`;
      }).join('\n');
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

    navigator.clipboard.writeText(text);
    setCopiedMode(type);
    setTimeout(() => setCopiedMode(null), 2500);
  };

  // Download Sizing Breakdown CSV
  const handleDownloadCSV = () => {
    const csvHeader = 'Peak_Index,Status,TwoTheta_deg,hkl,dSpacing_A,FWHM_deg,Beta_Corrected_deg,Intensity,Size_nm,Deviation_from_Mean_nm,Deviation_Pct,Weight_Pct,Dislocation_Density_10_14_m2,Coherent_Planes\n';
    const totalIntensity = validResults.reduce((acc, r) => acc + (r.intensity || 1), 0);
    const sourceList = allResults.length > 0 ? allResults : validResults;
    const csvRows = sourceList.map((r, idx) => {
      const hklStr = r.hkl ? `"(${r.hkl.join('')})"` : `"Peak ${idx + 1}"`;
      const status = r.excluded ? 'Excluded' : r.error ? 'Unresolved' : 'Active';
      const dev = r.sizeNm > 0 ? r.sizeNm - currentSizeNm : 0;
      const devPct = currentSizeNm > 0 && r.sizeNm > 0 ? (dev / currentSizeNm) * 100 : 0;
      const weightPct = !r.excluded && r.sizeNm > 0 && totalIntensity > 0 ? ((r.intensity || 1) / totalIntensity) * 100 : 0;
      const disloc = r.sizeNm > 0 ? 100 / Math.pow(r.sizeNm, 2) : 0;
      return `${idx + 1},${status},${r.twoTheta.toFixed(3)},${hklStr},${r.dSpacing ? r.dSpacing.toFixed(3) : 'N/A'},${r.fwhmObs.toFixed(3)},${r.betaCorrected.toFixed(3)},${r.intensity || 0},${r.sizeNm > 0 ? r.sizeNm.toFixed(precision) : 'N/A'},${dev.toFixed(2)},${devPct.toFixed(1)},${weightPct.toFixed(1)},${disloc > 0 ? disloc.toFixed(2) : 'N/A'},${r.coherencePlanesN || 'N/A'}`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mean_crystallite_sizing_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalValidIntensity = useMemo(
    () => validResults.reduce((acc, r) => acc + (r.intensity && r.intensity > 0 ? r.intensity : 1), 0),
    [validResults]
  );

  return (
    <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] border border-amber-500/25 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group/size-card transition-all">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* --- Card Header --- */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500/30 to-amber-600/10 rounded-2xl border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Zap className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl font-black text-white tracking-tight">Mean Crystallite Sizing</h3>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                <span>·</span>
                <span className="text-amber-400 font-bold">
                  {sizingStats.count} / {totalReflectionsCount} Reflections Resolved
                </span>
                {excludedReflectionsCount > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-slate-500">{excludedReflectionsCount} Excluded</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span>Statistical Microstructure Synthesis</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/90 font-sans font-semibold">
                {averageType === 'weighted' && 'Intensity-Weighted Volume (D_int)'}
                {averageType === 'arithmetic' && 'Number / Arithmetic Mean (D_num)'}
                {averageType === 'volume' && 'Volume-Weighted Moment (D_V = ΣD⁴/ΣD³)'}
                {averageType === 'area' && 'Surface Area-Weighted Moment (D_A = ΣD³/ΣD²)'}
                {averageType === 'harmonic' && 'Harmonic Effective Broadening Mean (D_H)'}
              </span>
              <span className="text-slate-600">·</span>
              <span className={
                regimeInfo.color === 'indigo' ? 'text-indigo-300' :
                regimeInfo.color === 'emerald' ? 'text-emerald-300' :
                regimeInfo.color === 'cyan' ? 'text-cyan-300' :
                regimeInfo.color === 'amber' ? 'text-amber-300' :
                'text-rose-300'
              } title={regimeInfo.desc}>
                {regimeInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Publication Exporters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Inspect Math & Why Button */}
          <button
            onClick={() => {
              setShowTrace(!showTrace);
              setTraceTab('trace');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border ${
              showTrace 
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300 hover:text-amber-200'
            }`}
            title="Inspect step-by-step mathematical calculation trace, peak deconvolution, and physical meaning"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>{showTrace ? 'Hide Trace' : 'Inspect Math & Why'}</span>
          </button>

          {/* Copy Manuscript Prose Button */}
          <button
            onClick={() => handleCopySummary('summary')}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Copy publication-ready manuscript paragraph (ACS/Nature/IEEE format)"
          >
            {copiedMode === 'summary' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Prose Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Cite Prose</span>
              </>
            )}
          </button>

          {/* Copy LaTeX Table Button */}
          <button
            onClick={() => handleCopySummary('latex')}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Copy LaTeX journal table of all reflections & mean sizing"
          >
            {copiedMode === 'latex' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">LaTeX Copied!</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">LaTeX</span>
              </>
            )}
          </button>

          {/* Copy Markdown Report Button */}
          <button
            onClick={() => handleCopySummary('markdown')}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Copy formatted Markdown report for lab notebooks"
          >
            {copiedMode === 'markdown' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">MD Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">MD Report</span>
              </>
            )}
          </button>

          {/* Download CSV */}
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="Download full reflection & facet sizing spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* --- Main Grid: Hero Metric + Statistical Uncertainty & Key Microstructural Cards --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        
        {/* Left Col: Hero Size Display with Confidence Intervals, Distribution Quantile Ruler & Unit Conversions */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-black/60 p-6 rounded-2xl border border-amber-500/25 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-bold text-amber-400 uppercase tracking-wider">
                {averageType === 'weighted' && 'Intensity-Weighted Mean (D_int)'}
                {averageType === 'arithmetic' && 'Number / Arithmetic Mean (D_num)'}
                {averageType === 'volume' && 'Volume-Weighted Mean (D_V)'}
                {averageType === 'area' && 'Area-Weighted Mean (D_A)'}
                {averageType === 'harmonic' && 'Harmonic Mean (D_H)'}
              </span>
              <span>
                K = {constantK} · λ = {wavelength} Å
              </span>
            </div>

            {/* Primary Sizing Hero Value */}
            <div className="flex items-baseline gap-2.5 mt-2">
              <span 
                className="text-5xl sm:text-6xl font-black text-white font-mono tabular-nums tracking-tighter" 
                style={{ textShadow: '0 0 30px rgba(245,158,11,0.3)' }}
              >
                {currentSizeNm.toFixed(precision)}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">nm</span>
              {sizingStats.count > 1 && (
                <span className="text-sm font-mono text-slate-400 ml-1 tabular-nums">
                  ± {sizingStats.stdDev.toFixed(2)} nm
                </span>
              )}
            </div>

            {/* Clean Unboxed Statistical Metadata */}
            {sizingStats.count > 1 ? (
              <div className="flex flex-wrap items-center gap-2 mt-2.5 font-mono text-[11px] text-slate-300 tabular-nums">
                <span className="text-amber-300 font-semibold">
                  95% CI: ±{sizingStats.ci95.toFixed(2)} nm
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">
                  SEM: <strong className="text-slate-200">{sizingStats.sem.toFixed(2)} nm</strong>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">
                  CV: <strong className="text-slate-200">{sizingStats.relDispersion.toFixed(1)}%</strong>
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic mt-1 font-mono">
                Single reflection active · Include ≥2 reflections for confidence intervals.
              </p>
            )}

            {/* Log-Normal & Polydispersity Unboxed Metadata */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums">
              <span className="text-slate-400">
                PDI: <strong className={pdiClassification.color}>{sizingStats.pdi.toFixed(3)}</strong> ({pdiClassification.label})
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Log-Normal D_g: <strong className="text-indigo-300">{sizingStats.geometricMean.toFixed(1)} nm</strong> (σ_g = {sizingStats.geometricStdDev.toFixed(2)})
              </span>
            </div>

            {/* Visual Quantile Span Bar (Min -> Q1 -> Median -> Q3 -> Max) */}
            {sizingStats.count > 1 && sizingStats.max > sizingStats.min && (
              <div className="mt-4 pt-3 border-t border-slate-800/70 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 tabular-nums">
                  <span>Min: <strong className="text-slate-200">{sizingStats.min.toFixed(1)}</strong></span>
                  <span>Q₁: <strong className="text-indigo-300">{sizingStats.q1.toFixed(1)}</strong></span>
                  <span>D₅₀: <strong className="text-amber-300">{sizingStats.median.toFixed(1)}</strong></span>
                  <span>Q₃: <strong className="text-indigo-300">{sizingStats.q3.toFixed(1)}</strong></span>
                  <span>Max: <strong className="text-slate-200">{sizingStats.max.toFixed(1)} nm</strong></span>
                </div>
                <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  {(() => {
                    const span = Math.max(0.01, sizingStats.max - sizingStats.min);
                    const q1Left = Math.max(0, Math.min(100, ((sizingStats.q1 - sizingStats.min) / span) * 100));
                    const q3Right = Math.max(0, Math.min(100, ((sizingStats.q3 - sizingStats.min) / span) * 100));
                    const medPos = Math.max(0, Math.min(100, ((sizingStats.median - sizingStats.min) / span) * 100));
                    const meanPos = Math.max(0, Math.min(100, ((currentSizeNm - sizingStats.min) / span) * 100));
                    return (
                      <>
                        <div
                          className="absolute top-0 bottom-0 bg-indigo-500/35"
                          style={{ left: `${q1Left}%`, width: `${Math.max(4, q3Right - q1Left)}%` }}
                          title={`Interquartile Range (Q1–Q3): ${sizingStats.q1.toFixed(1)}–${sizingStats.q3.toFixed(1)} nm`}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-1 bg-amber-400"
                          style={{ left: `${meanPos}%` }}
                          title={`Active Mean: ${currentSizeNm.toFixed(2)} nm`}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white/80"
                          style={{ left: `${medPos}%` }}
                          title={`Median (D50): ${sizingStats.median.toFixed(2)} nm`}
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Unit Conversions with quick-copy */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono text-[11px] tabular-nums">
            <div
              onClick={() => handleCopySummary('unit')}
              className="flex items-center gap-2 flex-wrap text-slate-300 hover:text-amber-300 cursor-pointer transition-colors"
              title="Click to copy all length unit conversions"
            >
              <span className="font-bold text-white">{(currentSizeNm * 10).toFixed(Math.max(1, precision - 1))} Å</span>
              <span className="text-slate-600">·</span>
              <span>{(currentSizeNm * 1000).toFixed(0)} pm</span>
              <span className="text-slate-600">·</span>
              <span>{(currentSizeNm / 1000).toFixed(4)} µm</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-300">f_surf ≈ {microstructuralProperties.surfaceAtomFractionPct.toFixed(1)}%</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono">
              {copiedMode === 'unit' ? 'Copied!' : 'Click units to copy'}
            </span>
          </div>
        </div>

        {/* Right Col: 4 Microstructural Property Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Card 1: Dislocation Density */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/90 transition-all hover:bg-slate-900 hover:border-amber-500/30 flex flex-col justify-between group/disloc">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>Dislocation (δ)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrace(true);
                      setTraceTab('physics');
                    }}
                    className="text-slate-500 hover:text-amber-400 cursor-pointer transition-colors p-0.5"
                    title="Why δ = 1/D²? Click to inspect physical derivation"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </span>
                <Atom className="w-3.5 h-3.5 text-amber-400/70" />
              </div>
              <span className="text-xl font-mono tabular-nums font-bold text-amber-300">
                {microstructuralProperties.dislocation10_14.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">×10¹⁴ lines/m²</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
              <span>δ = 1 / D²</span>
              <button
                type="button"
                onClick={() => {
                  setShowTrace(true);
                  setTraceTab('physics');
                }}
                className="text-[10px] text-amber-400/80 hover:text-amber-300 font-sans cursor-pointer"
              >
                Why?
              </button>
            </div>
          </div>

          {/* Card 2: Specific Surface Area (SSA) with Dynamic Material Density */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/90 transition-all hover:bg-slate-900 hover:border-emerald-500/30 flex flex-col justify-between group/ssa">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>Specific Surface</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrace(true);
                      setTraceTab('physics');
                    }}
                    className="text-slate-500 hover:text-emerald-400 cursor-pointer transition-colors p-0.5"
                    title="Why SSA = 6000 / (ρ·D)? Click to inspect derivation"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </span>
                <Scale className="w-3.5 h-3.5 text-emerald-400/70" />
              </div>
              <span className="text-xl font-mono tabular-nums font-bold text-emerald-300">
                {microstructuralProperties.ssaM2g.toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">m² / g</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
              <span className="truncate" title={selectedMaterial}>ρ = {materialDensity} g/cm³</span>
              <button
                type="button"
                onClick={() => {
                  setShowTrace(true);
                  setTraceTab('physics');
                }}
                className="text-[10px] text-emerald-400/80 hover:text-emerald-300 font-sans cursor-pointer shrink-0 ml-1"
              >
                Why?
              </button>
            </div>
          </div>

          {/* Card 3: Coherent Lattice Planes */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/90 transition-all hover:bg-slate-900 hover:border-indigo-500/30 flex flex-col justify-between group/planes">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>Coherent Planes</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrace(true);
                      setTraceTab('physics');
                    }}
                    className="text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors p-0.5"
                    title="Why N = D / d? Click to inspect coherent layer meaning"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </span>
                <Layers className="w-3.5 h-3.5 text-indigo-400/70" />
              </div>
              <span className="text-xl font-mono tabular-nums font-bold text-indigo-300">
                ~{sizingStats.avgPlanes}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">lattice layers</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Mean d = {sizingStats.avgDSpacing.toFixed(2)} Å</span>
              <button
                type="button"
                onClick={() => {
                  setShowTrace(true);
                  setTraceTab('physics');
                }}
                className="text-[10px] text-indigo-400/80 hover:text-indigo-300 font-sans cursor-pointer"
              >
                Why?
              </button>
            </div>
          </div>

          {/* Card 4: Facet Anisotropy Ratio */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/90 transition-all hover:bg-slate-900 hover:border-purple-500/30 flex flex-col justify-between group/aniso">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>Anisotropy</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrace(true);
                      setTraceTab('physics');
                    }}
                    className="text-slate-500 hover:text-purple-400 cursor-pointer transition-colors p-0.5"
                    title="What does Anisotropy Ratio mean for morphology? Click to inspect"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </span>
                <Compass className="w-3.5 h-3.5 text-purple-400/70" />
              </div>
              <span className="text-xl font-mono tabular-nums font-bold text-purple-300">
                {sizingStats.anisotropyIndex.toFixed(2)}:1
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">D_max / D_min</span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{sizingStats.min.toFixed(1)}–{sizingStats.max.toFixed(1)} nm</span>
              <button
                type="button"
                onClick={() => {
                  setShowTrace(true);
                  setTraceTab('physics');
                }}
                className="text-[10px] text-purple-400/80 hover:text-purple-300 font-sans cursor-pointer"
              >
                Why?
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* --- Microstrain & Resolution Alerts (if applicable) --- */}
      {Math.abs(whSlope) > 0.0008 && (
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Microstrain Contamination Warning:</strong> Williamson-Hall slope indicates lattice strain (ε ≈ {(Math.abs(whSlope) * 100).toFixed(2)}%). Peak broadening contains both size and strain components; pure Scherrer sizing will underestimate true crystallite dimensions.
          </span>
        </div>
      )}

      {currentSizeNm > 150 && (
        <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Instrument Resolution Boundary:</strong> Calculated crystallite size ({currentSizeNm.toFixed(1)} nm) approaches or exceeds the typical lab diffractometer broadening limit (~100–150 nm). Ensure instrumental broadening (FWHM_inst) is rigorously subtracted using a standard calibrant (NIST SRM 640/660).
          </span>
        </div>
      )}

      {/* --- Comprehensive 5-Method Averaging Bar --- */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col space-y-4 relative z-10">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Select Primary Averaging Model
            </span>
            <button
              type="button"
              onClick={() => {
                setShowTrace(true);
                setTraceTab('models');
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors"
              title="Why 5 different averaging methods? Compare XRD vs TEM and publication standards"
            >
              <BookOpen className="w-3 h-3 text-indigo-400" />
              <span>Why 5 Models?</span>
            </button>
          </div>

          {/* 5 Averaging Method Segmented Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800/90 text-xs">
            {[
              { id: 'weighted', label: 'Intensity-Weighted', symbol: 'D_int', val: sizingStats.weighted, desc: 'Weighted by Bragg peak intensity (standard)' },
              { id: 'arithmetic', label: 'Arithmetic Mean', symbol: 'D_num', val: sizingStats.arithmetic, desc: 'Simple number mean across all planes' },
              { id: 'volume', label: 'Volume-Weighted', symbol: 'D_V', val: sizingStats.volume, desc: 'ISO/ASTM volume-weighted crystallite dimension' },
              { id: 'area', label: 'Area-Weighted', symbol: 'D_A', val: sizingStats.area, desc: 'Surface-area weighted dimension' },
              { id: 'harmonic', label: 'Harmonic Mean', symbol: 'D_H', val: sizingStats.harmonic, desc: 'Harmonic mean matching ⟨β cos θ⟩' }
            ].map((method) => {
              const isActive = averageType === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => onAverageTypeChange(method.id as SizingAverageMethod)}
                  className={`px-3 py-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/90'
                  }`}
                  title={method.desc}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-extrabold">{method.symbol}</span>
                    {isActive && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-mono tabular-nums text-sm font-black">{method.val.toFixed(precision)}</span>
                    <span className="text-[9px] opacity-80">nm</span>
                  </div>
                  <span className={`text-[9px] truncate mt-0.5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Statistical Bar: Total Reflections Controls, Outlier Filter, and Quick Material Density Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 text-[11px] font-mono text-slate-400">
          
          {/* Total Reflections & Outlier Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-900/50 px-3.5 py-1.5 rounded-xl border border-slate-800 tabular-nums">
              <span>Total Reflections: <strong className="text-white">{totalReflectionsCount}</strong></span>
              <span className="text-slate-600">·</span>
              <span>Active: <strong className="text-emerald-400">{sizingStats.count}</strong></span>
              {excludedReflectionsCount > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>Excluded: <strong className="text-amber-400">{excludedReflectionsCount}</strong></span>
                </>
              )}
              {unresolvedReflectionsCount > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span>Limit: <strong className="text-rose-400">{unresolvedReflectionsCount}</strong></span>
                </>
              )}
            </div>

            {onAutoPruneOutliers && sizingStats.outlierCount > 0 && (
              <button
                type="button"
                onClick={onAutoPruneOutliers}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Automatically exclude outlier reflections (|Z| > 1.8) from Mean Crystallite Sizing"
              >
                <Filter className="w-3 h-3" />
                <span>Prune {sizingStats.outlierCount} Outlier{sizingStats.outlierCount > 1 ? 's' : ''}</span>
              </button>
            )}

            {onIncludeAllPeaks && excludedReflectionsCount > 0 && (
              <button
                type="button"
                onClick={onIncludeAllPeaks}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-sans font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Re-include all excluded reflections in Mean Crystallite Sizing"
              >
                <RotateCcw className="w-3 h-3 text-emerald-400" />
                <span>Include All ({totalReflectionsCount})</span>
              </button>
            )}
          </div>

          {/* Material & Density Tuning + Toggle Facet Matrix */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-sans font-semibold text-slate-400">Crystal Density (SSA):</span>
            <div className="relative">
              <button
                onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>{selectedMaterial} ({materialDensity} g/cm³)</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isMaterialDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 border-b border-slate-800">
                    Select Crystal Density
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {materialOptions.map(mat => (
                      <button
                        key={mat.label}
                        onClick={() => {
                          onMaterialDensityChange(mat.density, mat.label);
                          setCustomDensityInput(mat.density.toString());
                          setIsMaterialDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          selectedMaterial === mat.label 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-medium">{mat.label}</span>
                        <span className="font-mono text-[10px] text-slate-400">{mat.density} g/cm³</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Density Direct Input */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-400">Custom:</span>
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
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      placeholder="g/cm³"
                    />
                    <span className="text-[9px] text-slate-500">g/cm³</span>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Facet Breakdown Matrix */}
            <button
              onClick={() => setShowFacetTable(!showFacetTable)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{showFacetTable ? 'Hide' : 'View'} Reflections ({totalReflectionsCount})</span>
              {showFacetTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </div>

      {/* --- Expandable Facet-by-Facet Crystallite Sizing & Total Reflections Matrix --- */}
      <AnimatePresence>
        {showFacetTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-5 border-t border-slate-800/80 overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white">
                  Total Reflections & Facet-by-Facet Sizing Contributions
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                Reference: {averageType.toUpperCase()} Mean = {currentSizeNm.toFixed(precision)} nm · Click Use toggle to include/exclude peak
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs font-mono tabular-nums">
                <thead className="bg-slate-900/80 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    {onTogglePeakExclusion && <th className="px-3 py-2.5 text-center">Use</th>}
                    <th className="px-3 py-2.5">Reflection</th>
                    <th className="px-3 py-2.5">2θ (°)</th>
                    <th className="px-3 py-2.5">d (Å)</th>
                    <th className="px-3 py-2.5">β_obs / β_phys (°)</th>
                    <th className="px-3 py-2.5">Weight (I%)</th>
                    <th className="px-3 py-2.5">Size D_hkl (nm)</th>
                    <th className="px-3 py-2.5">Δ from Mean</th>
                    <th className="px-3 py-2.5">Dislocation δ</th>
                    <th className="px-3 py-2.5">Planes (N)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(allResults.length > 0 ? allResults : validResults).map((r, idx) => {
                    const hklLabel = r.hkl ? `(${r.hkl.join('')})` : `#${idx + 1}`;
                    const isExcluded = !!r.excluded;
                    const hasError = !!r.error || r.sizeNm <= 0;
                    const delta = !hasError ? r.sizeNm - currentSizeNm : 0;
                    const deltaPct = !hasError && currentSizeNm > 0 ? (delta / currentSizeNm) * 100 : 0;
                    const disloc = !hasError ? 100 / Math.pow(r.sizeNm, 2) : 0;
                    const weightPct = !isExcluded && !hasError && totalValidIntensity > 0
                      ? (((r.intensity && r.intensity > 0 ? r.intensity : 1) / totalValidIntensity) * 100)
                      : 0;
                    const isOutlier = !isExcluded && !hasError && sizingStats.stdDev > 0 && Math.abs(delta) / sizingStats.stdDev > 1.8;

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isExcluded ? 'opacity-45 bg-slate-950/40' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        {onTogglePeakExclusion && (
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => onTogglePeakExclusion(idx)}
                              className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors cursor-pointer border ${
                                isExcluded
                                  ? 'bg-slate-900 border-slate-700 text-slate-500 hover:text-amber-400'
                                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                              }`}
                              title={isExcluded ? 'Click to include reflection in Mean Sizing' : 'Click to exclude reflection from Mean Sizing'}
                            >
                              {isExcluded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </td>
                        )}
                        <td className="px-3 py-2 font-bold text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isExcluded ? 'bg-slate-600' : hasError ? 'bg-rose-500' : isOutlier ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <span>{hklLabel}</span>
                          {isOutlier && (
                            <span className="text-[9px] text-amber-400 font-sans font-semibold" title="Statistical outlier (|Z| > 1.8)">
                              · Outlier
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-300">{r.twoTheta.toFixed(3)}°</td>
                        <td className="px-3 py-2 text-slate-400">{r.dSpacing ? r.dSpacing.toFixed(3) : '-'}</td>
                        <td className="px-3 py-2 text-slate-400">
                          {r.fwhmObs.toFixed(3)}° / <span className="text-slate-200">{r.betaCorrected.toFixed(3)}°</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          <div className="flex items-center gap-2">
                            <span>{r.intensity !== undefined ? r.intensity.toFixed(0) : '100'}</span>
                            {!isExcluded && !hasError && (
                              <span className="text-[10px] text-slate-500">({weightPct.toFixed(1)}%)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-bold text-amber-300">
                          {hasError ? (
                            <span className="text-rose-400 text-[10px] uppercase">β_obs ≤ β_inst</span>
                          ) : (
                            `${r.sizeNm.toFixed(precision)} nm`
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold">
                          {hasError || isExcluded ? (
                            <span className="text-slate-600">—</span>
                          ) : (
                            <span className={delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {delta >= 0 ? '+' : ''}{delta.toFixed(2)} nm ({deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {hasError ? '—' : `${disloc.toFixed(2)} ×10¹⁴`}
                        </td>
                        <td className="px-3 py-2 text-indigo-300">
                          {hasError ? '—' : `~${r.coherencePlanesN || '-'}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Expandable Live Calculation Trace & Explainer --- */}
      <AnimatePresence>
        {showTrace && (
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
              onClose={() => setShowTrace(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
