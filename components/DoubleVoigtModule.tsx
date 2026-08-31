import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseDoubleVoigtInput, calculateDoubleVoigt } from '../utils/physics';
import { DoubleVoigtResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import {
  Activity,
  Atom,
  Copy,
  Database,
  FlaskConical,
  Layers,
  Ruler,
  Trash2,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Download,
  Info,
  Sparkles,
  BarChart2,
  Sliders,
  Maximize2,
  RefreshCw,
  Zap,
  AlertTriangle,
  Award,
  ArrowRight,
  GitBranch,
  Compass,
  BookOpen,
  Eye,
  EyeOff,
  Scale,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

// Specialized Subcomponents
import { DoubleVoigtColumnDistributionChart } from './double_voigt/DoubleVoigtColumnDistributionChart';
import { DoubleVoigtCauchyPlot } from './double_voigt/DoubleVoigtCauchyPlot';
import { DoubleVoigtGaussianPlot } from './double_voigt/DoubleVoigtGaussianPlot';
import { DoubleVoigtSinglePeakTable } from './double_voigt/DoubleVoigtSinglePeakTable';
import { DoubleVoigtVoigtProfileSimulator } from './double_voigt/DoubleVoigtVoigtProfileSimulator';
import { DoubleVoigtMicrostructureSummary } from './double_voigt/DoubleVoigtMicrostructureSummary';

const XRAY_WAVELENGTHS = [
  { label: 'Cu Kα1', value: 1.54056 },
  { label: 'Cu Kα (avg)', value: 1.5418 },
  { label: 'Mo Kα1', value: 0.7093 },
  { label: 'Co Kα1', value: 1.78897 },
  { label: 'Fe Kα1', value: 1.93604 },
  { label: 'Cr Kα1', value: 2.2897 },
  { label: 'Ag Kα1', value: 0.55941 }
];

const DV_PRESETS = [
  {
    name: 'Nanocrystalline CeO2 Powder',
    wavelength: 1.54056,
    instFwhm: 0.05,
    data: "28.55, 0.32, 0.65, 1, 1, 1\n33.08, 0.35, 0.60, 2, 0, 0\n47.48, 0.42, 0.55, 2, 2, 0\n56.34, 0.48, 0.50, 3, 1, 1\n59.09, 0.51, 0.48, 2, 2, 2\n69.41, 0.58, 0.45, 4, 0, 0",
    desc: 'Cubic fluorite structure (NIST SRM 674b) exhibiting mixed size and microstrain broadening.'
  },
  {
    name: 'Ball-Milled Nanostructured Ni',
    wavelength: 1.54056,
    instFwhm: 0.08,
    data: "44.51, 0.45, 0.70, 1, 1, 1\n51.85, 0.52, 0.62, 2, 0, 0\n76.37, 0.71, 0.52, 2, 2, 0\n92.94, 0.88, 0.45, 3, 1, 1\n98.44, 0.95, 0.42, 2, 2, 2",
    desc: 'Heavy plastic deformation leading to substantial dislocation density and microstrain.'
  },
  {
    name: 'Sol-Gel TiO2 Anatase',
    wavelength: 1.54056,
    instFwhm: 0.06,
    data: "25.28, 0.38, 0.58, 1, 0, 1\n37.80, 0.42, 0.55, 0, 0, 4\n48.05, 0.49, 0.51, 2, 0, 0\n53.89, 0.54, 0.48, 1, 0, 5\n55.08, 0.56, 0.47, 2, 1, 1\n62.69, 0.62, 0.44, 2, 0, 4",
    desc: 'Tetragonal nanocrystals with anisotropic crystallite growth habit along c-axis.'
  },
  {
    name: 'ZnO Wurtzite Nanorods',
    wavelength: 1.54056,
    instFwhm: 0.07,
    data: "31.77, 0.30, 0.62, 1, 0, 0\n34.42, 0.28, 0.68, 0, 0, 2\n36.25, 0.33, 0.60, 1, 0, 1\n47.54, 0.40, 0.54, 1, 0, 2\n56.60, 0.45, 0.51, 1, 1, 0\n62.86, 0.50, 0.48, 1, 0, 3",
    desc: 'Hexagonal wurtzite nanoparticles showing polar c-axis elongated rod morphology.'
  },
  {
    name: 'Plastically Deformed Austenitic Steel (γ-Fe)',
    wavelength: 1.54056,
    instFwhm: 0.06,
    data: "43.60, 0.48, 0.68, 1, 1, 1\n50.78, 0.55, 0.60, 2, 0, 0\n74.68, 0.76, 0.51, 2, 2, 0\n90.67, 0.92, 0.44, 3, 1, 1\n95.95, 0.99, 0.40, 2, 2, 2",
    desc: 'FCC matrix with dense planar dislocation networks, stacking faults, and elastic strain energy.'
  },
  {
    name: 'Nanocrystalline Gold Standard (SRM 660)',
    wavelength: 1.54056,
    instFwhm: 0.04,
    data: "38.18, 0.24, 0.72, 1, 1, 1\n44.39, 0.26, 0.68, 2, 0, 0\n64.58, 0.31, 0.60, 2, 2, 0\n77.55, 0.36, 0.55, 3, 1, 1\n81.72, 0.38, 0.52, 2, 2, 2",
    desc: 'Monodisperse noble metal nanocrystals with low defect density and sharp size distribution.'
  }
];

export const DoubleVoigtModule: React.FC = () => {
  const { lengthUnit = 'Å' } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [instFwhm, setInstFwhm] = useState<number>(0.06);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [instEta, setInstEta] = useState<number>(0.5);
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0.0);
  const [applyLPFactor, setApplyLPFactor] = useState<boolean>(false);
  const [monochromatorAngle, setMonochromatorAngle] = useState<number>(26.4);
  const [kAlpha2Correction, setKAlpha2Correction] = useState<boolean>(false);
  const [shapeK, setShapeK] = useState<number>(1.0);

  const [expSubTab, setExpSubTab] = useState<'wavelength' | 'instrument' | 'corrections'>('wavelength');

  const [inputData, setInputData] = useState<string>(DV_PRESETS[0].data);
  const [activePlotTab, setActivePlotTab] = useState<
    'distribution' | 'cauchy' | 'gaussian' | 'single_peak' | 'profile' | 'concept' | 'summary'
  >('distribution');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [interactiveEta, setInteractiveEta] = useState<number>(0.60);
  const [excludedPeakIndices, setExcludedPeakIndices] = useState<number[]>([]);

  const [result, setResult] = useState<DoubleVoigtResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_double_voigt_current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.cauchyFit &&
          typeof parsed.cauchyFit.rSquared === 'number' &&
          parsed.gaussianFit &&
          typeof parsed.gaussianFit.rSquared === 'number' &&
          typeof parsed.volumeSizeDvNm === 'number' &&
          typeof parsed.areaSizeDaNm === 'number' &&
          Array.isArray(parsed.points)
        ) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [copiedNotification, setCopiedNotification] = useState(false);
  const isFirstRender = useRef(true);

  // Recalculate Double-Voigt with inclusion flags
  useEffect(() => {
    const parsedPeaks = parseDoubleVoigtInput(inputData);
    if (parsedPeaks.length >= 2) {
      // Mark exclusion
      const annotatedPeaks = parsedPeaks.map((p, idx) => ({
        ...p,
        isExcluded: excludedPeakIndices.includes(idx)
      }));

      const computed = calculateDoubleVoigt(
        wavelength,
        instFwhm,
        annotatedPeaks,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        {
          zeroShiftDeg,
          instEta,
          applyLPFactor,
          monochromatorAngleDeg: monochromatorAngle,
          kAlpha2Correction,
          shapeK
        }
      );
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_double_voigt_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
    isFirstRender.current = false;
  }, [
    wavelength,
    instFwhm,
    inputData,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    instEta,
    zeroShiftDeg,
    applyLPFactor,
    monochromatorAngle,
    kAlpha2Correction,
    shapeK,
    excludedPeakIndices
  ]);

  const handleApplyPreset = (preset: typeof DV_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setInstFwhm(preset.instFwhm);
    setInputData(preset.data);
    setSelectedPeakIdx(0);
    setExcludedPeakIndices([]);
  };

  const handleTogglePeakExclusion = (index: number) => {
    setExcludedPeakIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleCopyLaTeX = () => {
    if (!result || !result.cauchyFit || !result.gaussianFit) return;
    const latex = `\\begin{align*}
\\text{Cauchy Line: } \\beta_C^*(s) &= \\frac{1}{D_V} + 2 e_C \\cdot s \\quad (m_C = ${(result.cauchyFit.slope ?? 0).toFixed(4)}, C_C = ${(result.cauchyFit.intercept ?? 0).toFixed(4)}, R^2 = ${(result.cauchyFit.rSquared ?? 0).toFixed(4)}) \\\\
\\text{Gaussian Line: } (\\beta_G^*(s))^2 &= \\left(\\frac{1}{\\pi D_G}\\right)^2 + 8\\pi e_G^2 \\cdot s^2 \\quad (m_G = ${(result.gaussianFit.slope ?? 0).toFixed(4)}, C_G = ${(result.gaussianFit.intercept ?? 0).toFixed(4)}, R^2 = ${(result.gaussianFit.rSquared ?? 0).toFixed(4)}) \\\\
D_V &= ${(result.volumeSizeDvNm ?? 0).toFixed(2)} \\text{ nm}, \\quad D_A = ${(result.areaSizeDaNm ?? 0).toFixed(2)} \\text{ nm}, \\quad D_G = ${(result.gaussianSizeDgNm ?? 0).toFixed(2)} \\text{ nm} \\\\
e_C &= ${((result.cauchyStrainEc ?? 0) * 100).toFixed(4)}\\%, \\quad e_G = ${((result.gaussianStrainEg ?? 0) * 100).toFixed(4)}\\%, \\quad \\langle e^2 \\rangle^{1/2} = ${((result.rmsStrain ?? 0) * 100).toFixed(4)}\\% \\\\
\\rho_d &= ${(result.dislocationDensityM2 ?? 0).toExponential(2)} \\text{ m}^{-2}
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (!result || !result.points) return;
    let csv = "2Theta (deg),hkl,s (nm^-1),s^2 (nm^-2),beta_C* (nm^-1),(beta_G*)^2 (nm^-2),Single D_V (nm),Single Da (nm),Single Strain (%),Excluded\n";
    result.points.forEach(p => {
      const hklStr = p.hkl ? `"${p.hkl.join('')}"` : '""';
      const excStr = p.isExcluded ? 'YES' : 'NO';
      csv += `${p.twoTheta},${hklStr},${p.s.toFixed(6)},${p.s2.toFixed(6)},${p.betaCStar.toFixed(6)},${p.betaGStarSq.toFixed(6)},${p.singleDvNm.toFixed(4)},${p.singleDaNm.toFixed(4)},${p.singleStrain !== undefined ? (p.singleStrain * 100).toFixed(4) : ''},${excStr}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Double_Voigt_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Concept simulation profile data for interactive Double-Voigt breakdown
  const conceptProfileData = React.useMemo(() => {
    const numPoints = 100;
    const center = 38.0;
    const fwhm = 0.40;
    const halfWidth = fwhm * 3.5;
    const gamma = fwhm / 2;
    const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2));

    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const x = (center - halfWidth) + (i / (numPoints - 1)) * (2 * halfWidth);
      const dx = x - center;

      const cauchy = (1 / Math.PI) * (gamma / (dx * dx + gamma * gamma)) * (Math.PI * gamma);
      const gaussian = Math.exp(-(dx * dx) / (2 * sigma * sigma));
      const voigt = interactiveEta * cauchy + (1 - interactiveEta) * gaussian;

      points.push({
        twoTheta: parseFloat(x.toFixed(3)),
        voigt: parseFloat(voigt.toFixed(4)),
        cauchySize: parseFloat((interactiveEta * cauchy).toFixed(4)),
        gaussianStrain: parseFloat(((1 - interactiveEta) * gaussian).toFixed(4))
      });
    }

    return points;
  }, [interactiveEta]);

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Atom className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">Double-Voigt Method (Langford & Balzar)</h2>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Advanced Microstructure v2.5
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Separation of Cauchy (crystallite size) and Gaussian (microstrain) line broadening with column-length distribution and dislocation density.
                </p>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
            </span>
            {DV_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 text-xs font-mono rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 hover:border-white/25 transition-all cursor-pointer"
                title={preset.desc}
              >
                {preset.name.split(' ')[0]} {preset.name.split(' ')[1] || ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Left Controls & Right Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Experimental Inputs & Parameters */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Step 1: Experimental Parameters */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-white/20 transition-colors duration-500">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step 1
                </span>
                <FlaskConical className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experimental Setup</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">λ & Instrument</span>
            </div>

            {/* Sub-tabs for Instrumental Setup */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setExpSubTab('wavelength')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'wavelength'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Ruler className="w-3 h-3" />
                Radiation
              </button>

              <button
                onClick={() => setExpSubTab('instrument')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'instrument'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3 h-3" />
                Instrumental
              </button>

              <button
                onClick={() => setExpSubTab('corrections')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'corrections'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-3 h-3" />
                Corrections
              </button>
            </div>

            {/* Tab 1: Wavelength & Zero Shift */}
            {expSubTab === 'wavelength' && (
              <div className="space-y-4">
                <div className="group/input">
                  <label className="block text-xs font-semibold text-slate-300 mb-2 group-hover/input:text-indigo-300 transition-colors">
                    X-Ray Radiation Wavelength (λ) [{lengthUnit}]
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value), lengthUnit))}
                      className="w-full px-3 py-2 bg-black/40 text-indigo-300 border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 hover:border-white/20 transition-colors cursor-pointer appearance-none shadow-inner"
                    >
                      {XRAY_WAVELENGTHS.map((w) => (
                        <option key={w.label} value={convertLength(w.value, lengthUnit)}>
                          {w.label} ({convertLength(w.value, lengthUnit).toFixed(4)} {lengthUnit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.00001"
                      value={convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value) || 1.54056, lengthUnit))}
                      className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 hover:border-white/20 transition-colors shadow-inner"
                      placeholder={`Custom ${lengthUnit}`}
                    />
                  </div>
                </div>

                {/* Shape Habit Multiplier */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">Shape Habit Multiplier (K):</span>
                    <span className="text-indigo-300 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      K = {shapeK.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.80"
                    max="1.20"
                    step="0.01"
                    value={shapeK}
                    onChange={(e) => setShapeK(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0.89 (Spherical)</span>
                    <span>1.00 (Standard)</span>
                    <span>1.07 (Octahedral)</span>
                  </div>
                </div>

                {/* Goniometer Zero-Shift */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      Goniometer Zero-Shift (Δ2θ₀)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
                        zeroShiftDeg !== 0 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold' 
                          : 'bg-black/60 text-slate-400 border-white/5'
                      }`}>
                        {zeroShiftDeg > 0 ? `+${zeroShiftDeg.toFixed(2)}` : zeroShiftDeg.toFixed(2)}° 2θ
                      </span>
                      {zeroShiftDeg !== 0 && (
                        <button
                          onClick={() => setZeroShiftDeg(0)}
                          className="text-[10px] text-indigo-400 hover:underline font-mono cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.01"
                    value={zeroShiftDeg}
                    onChange={(e) => setZeroShiftDeg(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Instrumental Broadening */}
            {expSubTab === 'instrument' && (
              <div className="space-y-4">
                <div className="group/input">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-300 group-hover/input:text-indigo-300 transition-colors">
                      Instrumental Profile Resolution
                    </label>
                    <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 text-[10px] font-mono shadow-inner">
                      <button
                        onClick={() => setInstrumentalMode('constant')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          instrumentalMode === 'constant' ? 'bg-indigo-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Constant
                      </button>
                      <button
                        onClick={() => setInstrumentalMode('caglioti')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          instrumentalMode === 'caglioti' ? 'bg-indigo-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Caglioti
                      </button>
                    </div>
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.001"
                          value={instFwhm}
                          onChange={(e) => setInstFwhm(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                          placeholder="0.06"
                        />
                        <span className="text-xs text-slate-400 font-mono">° 2θ</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">U (tan²θ)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiU}
                            onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">V (tanθ)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiV}
                            onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-mono mb-1">W (const)</span>
                          <input
                            type="number"
                            step="0.001"
                            value={cagliotiW}
                            onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-black/40 text-white border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instrumental Cauchy Fraction */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-1.5 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">Instrumental Voigt Fraction (η_inst):</span>
                    <span className="text-indigo-300 font-mono font-bold">{instEta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={instEta}
                    onChange={(e) => setInstEta(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>0.0 (Pure Gaussian Inst)</span>
                    <span>1.0 (Pure Cauchy Inst)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Corrections */}
            {expSubTab === 'corrections' && (
              <div className="space-y-4">
                {/* LP Factor */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Lorentz-Polarization (L-P) Factor Correction
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Geometry weighting correction
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApplyLPFactor(!applyLPFactor)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        applyLPFactor ? 'bg-indigo-500' : 'bg-white/10'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          applyLPFactor ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* K-Alpha2 Splitting */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Kα₂ Doublet Splitting Correction
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rachinger doublet stripping
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setKAlpha2Correction(!kAlpha2Correction)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      kAlpha2Correction ? 'bg-indigo-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        kAlpha2Correction ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Peak Data Input */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-white/20 transition-colors duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step 2
                </span>
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reflections Input</h3>
              </div>
              <button
                onClick={() => setInputData('')}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 bg-black/40 rounded-lg border border-transparent hover:border-red-500/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              One reflection per line: <code className="text-indigo-300 bg-black/60 px-1.5 py-0.5 rounded font-mono shadow-inner border border-white/5 text-[11px]">2θ [°], FWHM [°], η [0..1], h, k, l</code>
            </p>

            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full p-3.5 bg-black/60 text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 hover:border-white/20 transition-all custom-scrollbar leading-relaxed shadow-inner"
            />

            <div className="flex items-center justify-between text-[11px] font-mono pt-1">
              <span className="text-slate-400">
                Parsed: <strong className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{result?.points?.length || 0}</strong>
              </span>
              {result && result.points.length >= 2 ? (
                <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready for deconvolution
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Min 2 reflections
                </span>
              )}
            </div>
          </div>

          {/* Theoretical Guide Formulation Box */}
          <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/20 shadow-inner space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4" />
              Double-Voigt & Balzar Formulation
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Separates pure physical profile <span className="font-mono text-indigo-300">f(x)</span> from instrumental broadening <span className="font-mono text-amber-300">g(x)</span> without truncation error:
            </p>
            <div 
              className="text-white text-xs py-2 px-3 bg-black/60 rounded-xl border border-white/10 font-mono overflow-x-auto text-center shadow-inner"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'D_A = \\frac{1}{\\pi \\beta_{G,S}^*} \\cdot \\exp(k^2) \\cdot \\text{erfc}(k), \\quad k = \\frac{\\beta_{C,S}^*}{\\sqrt{\\pi}\\beta_{G,S}^*}',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
          </div>
        </div>

        {/* Right Column: Key Results & Interactive Analysis Views */}
        <div className="lg:col-span-7 space-y-6">
          
          {result ? (
            <>
              {/* Scientific Math Control Banner */}
              <ScientificMathControl
                title="Double-Voigt Dual Extrapolation"
                formula="\begin{aligned} \beta_C^*(s) &= \frac{1}{D_V} + 2e_C s \\ (\beta_G^*(s))^2 &= \left(\frac{1}{\pi D_G}\right)^2 + 8\pi e_G^2 s^2 \end{aligned}"
                description="Deconvolutes instrumental broadening and separates structural effects into Cauchy (crystallite size) and Gaussian (microstrain) components."
                variables={[
                  { symbol: 'D_V', name: 'Volume Size', value: convertLength((result.volumeSizeDvNm ?? 0) * 10, lengthUnit), unit: lengthUnit },
                  { symbol: 'D_A', name: 'Area Size', value: convertLength((result.areaSizeDaNm ?? 0) * 10, lengthUnit), unit: lengthUnit },
                  { symbol: 'e_C', name: 'Cauchy Strain', value: (result.cauchyStrainEc ?? 0) * 100, unit: '%' },
                  { symbol: 'e_G', name: 'Gaussian Strain', value: (result.gaussianStrainEg ?? 0) * 100, unit: '%' }
                ]}
                result={convertLength((result.volumeSizeDvNm ?? 0) * 10, lengthUnit)}
                resultUnit={lengthUnit}
                resultName="⟨D_V⟩ (Volume-Weighted Size)"
              />

              {/* Primary Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Volume Size */}
                <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/30 shadow-[0_8px_30px_rgba(99,102,241,0.1)] relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Ruler className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Volume Size (D_V)</span>
                    </div>
                    <WhatDoesThisMeanTooltip
                      term="Volume-Weighted Size ⟨D_V⟩"
                      symbol="⟨D_V⟩"
                      explanation="Crystallite diameter weighted by crystal volume (D⁴/D³). Larger crystallites dominate this metric."
                      physicalInterpretation="⟨D_V⟩ represents the average crystallite size seen by X-ray scattering power. Always larger than or equal to area-weighted size ⟨D_A⟩."
                      ruleOfThumb="Ratio ⟨D_V⟩ / ⟨D_A⟩ ≈ 1.0 for monodisperse crystals; > 1.35 indicates polydispersity."
                    />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                      {convertLength((result.volumeSizeDvNm ?? 0) * 10, lengthUnit).toFixed(1)}
                    </span>
                    <span className="text-indigo-300 text-sm font-mono font-semibold">{lengthUnit}</span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between"><span>Area Size D_A:</span> <span className="text-purple-300 font-bold">{convertLength((result.areaSizeDaNm ?? 0) * 10, lengthUnit).toFixed(1)} {lengthUnit}</span></div>
                    <div className="flex justify-between"><span>Polydispersity:</span> <span className="text-cyan-300 font-bold">{result.polydispersityIndex !== undefined ? result.polydispersityIndex.toFixed(2) : '1.00'}</span></div>
                  </div>
                </div>

                {/* Cauchy Strain */}
                <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-purple-500/30 shadow-[0_8px_30px_rgba(168,85,247,0.1)] relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-purple-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Cauchy Strain (e_C)</span>
                    </div>
                    <Layers className="w-4 h-4 text-purple-400/50" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                      {((result.cauchyStrainEc ?? 0) * 100).toFixed(4)}
                    </span>
                    <span className="text-purple-300 text-sm font-mono font-semibold">%</span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between"><span>Gaussian e_G:</span> <span className="text-purple-300 font-bold">{((result.gaussianStrainEg ?? 0) * 100).toFixed(4)}%</span></div>
                    <div className="flex justify-between"><span>Cauchy R²:</span> <span className="text-indigo-300 font-bold">{result.cauchyFit ? ((result.cauchyFit.rSquared ?? 0) * 100).toFixed(1) : '—'}%</span></div>
                  </div>
                </div>

                {/* RMS Strain */}
                <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-cyan-500/30 shadow-[0_8px_30px_rgba(6,182,212,0.1)] relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Dislocation ρ_d</span>
                    </div>
                    <Atom className="w-4 h-4 text-cyan-400/50" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                      {result.dislocationDensityM2 !== undefined ? result.dislocationDensityM2.toExponential(2) : '—'}
                    </span>
                    <span className="text-cyan-300 text-[10px] font-mono font-semibold">m⁻²</span>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 text-[11px] font-mono text-slate-400">
                    <div className="flex justify-between"><span>RMS Strain:</span> <span className="text-cyan-300 font-bold">{((result.rmsStrain ?? 0) * 100).toFixed(4)}%</span></div>
                    <div className="flex justify-between"><span>Gaussian R²:</span> <span className="text-purple-300 font-bold">{result.gaussianFit ? ((result.gaussianFit.rSquared ?? 0) * 100).toFixed(1) : '—'}%</span></div>
                  </div>
                </div>
              </div>

              {/* Interactive Analysis Tabbed Container */}
              <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">
                
                {/* Tab Navigation Menu */}
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-black/60 rounded-2xl border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setActivePlotTab('distribution')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePlotTab === 'distribution'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Column Distribution P(L)</span>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('cauchy')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePlotTab === 'cauchy'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Cauchy (β_C* vs s)</span>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('gaussian')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePlotTab === 'gaussian'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Gaussian ((β_G*)² vs s²)</span>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('single_peak')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePlotTab === 'single_peak'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Single Peaks & Exclusions</span>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('profile')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePlotTab === 'profile'
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Profile Tails & Kernels</span>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('concept')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePlotTab === 'concept'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Voigt Mechanics</span>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('summary')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePlotTab === 'summary'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Verdict & Exports</span>
                  </button>
                </div>

                {/* Tab Views Render */}
                {activePlotTab === 'distribution' && (
                  <DoubleVoigtColumnDistributionChart result={result} />
                )}

                {activePlotTab === 'cauchy' && (
                  <DoubleVoigtCauchyPlot result={result} />
                )}

                {activePlotTab === 'gaussian' && (
                  <DoubleVoigtGaussianPlot result={result} />
                )}

                {activePlotTab === 'single_peak' && (
                  <DoubleVoigtSinglePeakTable
                    result={result}
                    selectedPeakIdx={selectedPeakIdx}
                    onSelectPeak={setSelectedPeakIdx}
                    onTogglePeakExclusion={handleTogglePeakExclusion}
                  />
                )}

                {activePlotTab === 'profile' && (
                  <DoubleVoigtVoigtProfileSimulator
                    result={result}
                    selectedPeakIdx={selectedPeakIdx}
                    onSelectPeak={setSelectedPeakIdx}
                    interactiveEta={interactiveEta}
                    onChangeInteractiveEta={setInteractiveEta}
                  />
                )}

                {activePlotTab === 'concept' && (
                  <div className="space-y-4 bg-[#030710]/70 p-4 sm:p-6 rounded-2xl border border-amber-500/20 relative shadow-inner">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          Interactive Voigt Component Mechanics
                        </h4>
                      </div>
                      <div className="text-xs text-amber-300 font-bold">
                        η = {interactiveEta.toFixed(2)} ({((1 - interactiveEta) * 100).toFixed(0)}% Gaussian / {(interactiveEta * 100).toFixed(0)}% Cauchy)
                      </div>
                    </div>

                    <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between text-xs text-slate-300 font-mono">
                        <span>Pure Gaussian (η = 0.0, Strain Broadening)</span>
                        <span>Pure Cauchy (η = 1.0, Size Broadening)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={interactiveEta}
                        onChange={(e) => setInteractiveEta(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                      />
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      The Pseudo-Voigt function is a linear combination <span className="font-mono text-amber-300">V(2θ) = η · L(2θ) + (1-η) · G(2θ)</span>. While Gaussian strain decay produces fast exponential drop-offs, Cauchy size broadening decays as a slow <span className="font-mono text-indigo-300">1/(Δ2θ)²</span> power-law, defining crystallite size behavior in reciprocal space.
                    </p>
                  </div>
                )}

                {activePlotTab === 'summary' && (
                  <DoubleVoigtMicrostructureSummary
                    result={result}
                    wavelength={wavelength}
                    onCopyLaTeX={handleCopyLaTeX}
                    onDownloadCSV={handleDownloadCSV}
                    copiedNotification={copiedNotification}
                  />
                )}
              </div>

              {/* AI & Python Exporters */}
              <div className="space-y-4">
                <AIAnalysis methodName="Double-Voigt Method (Langford & Balzar)" resultData={result} />
                <PythonCodeExporter
                  methodName="Double-Voigt Method"
                  parameters={{
                    wavelength: Number(wavelength),
                    twoTheta: result.points.map(p => p.twoTheta),
                    betaL: result.points[0]?.betaCStar || 0.18,
                    betaG: result.points[0]?.betaGStar || 0.12,
                    x: result.points.map(p => p.s),
                    yCauchy: result.points.map(p => p.betaCStar),
                    yGaussian: result.points.map(p => p.betaGStarSq)
                  }}
                />
              </div>
            </>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Peak Data</p>
              <p className="text-xs text-slate-400">Enter at least 2 valid peak profiles to execute Double-Voigt convolution analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
