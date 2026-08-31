import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseDoubleVoigtInput, calculateDoubleVoigt } from '../utils/physics';
import { DoubleVoigtResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
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
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

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
    desc: 'Cubic fluorite structure exhibiting mixed size and microstrain broadening.'
  },
  {
    name: 'Ball-Milled Nanostructured Ni',
    wavelength: 1.54056,
    instFwhm: 0.08,
    data: "44.51, 0.45, 0.70, 1, 1, 1\n51.85, 0.52, 0.62, 2, 0, 0\n76.37, 0.71, 0.52, 2, 2, 0\n92.94, 0.88, 0.45, 3, 1, 1\n98.44, 0.95, 0.42, 2, 2, 2",
    desc: 'Heavy plastic deformation leading to substantial dislocation density and strain.'
  },
  {
    name: 'Sol-Gel TiO2 Anatase',
    wavelength: 1.54056,
    instFwhm: 0.06,
    data: "25.28, 0.38, 0.58, 1, 0, 1\n37.80, 0.42, 0.55, 0, 0, 4\n48.05, 0.49, 0.51, 2, 0, 0\n53.89, 0.54, 0.48, 1, 0, 5\n55.08, 0.56, 0.47, 2, 1, 1\n62.69, 0.62, 0.44, 2, 0, 4",
    desc: 'Tetragonal nanocrystals with anisotropic crystallite growth.'
  },
  {
    name: 'ZnO Wurtzite Nanorods',
    wavelength: 1.54056,
    instFwhm: 0.07,
    data: "31.77, 0.30, 0.62, 1, 0, 0\n34.42, 0.28, 0.68, 0, 0, 2\n36.25, 0.33, 0.60, 1, 0, 1\n47.54, 0.40, 0.54, 1, 0, 2\n56.60, 0.45, 0.51, 1, 1, 0\n62.86, 0.50, 0.48, 1, 0, 3",
    desc: 'Hexagonal wurtzite nanoparticles showing c-axis elongated morphology.'
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
  const [activePlotTab, setActivePlotTab] = useState<'concept' | 'cauchy' | 'gaussian' | 'profile' | 'summary'>('concept');
  const [selectedPeakIdx, setSelectedPeakIdx] = useState<number>(0);
  const [interactiveEta, setInteractiveEta] = useState<number>(0.60);
  const [activeStepHover, setActiveStepHover] = useState<number | null>(null);

  const [result, setResult] = useState<DoubleVoigtResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_double_voigt_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [copiedNotification, setCopiedNotification] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const parsedPeaks = parseDoubleVoigtInput(inputData);
    if (parsedPeaks.length >= 2) {
      const computed = calculateDoubleVoigt(
        wavelength,
        instFwhm,
        parsedPeaks,
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
    shapeK
  ]);

  const handleApplyPreset = (preset: typeof DV_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setInstFwhm(preset.instFwhm);
    setInputData(preset.data);
    setSelectedPeakIdx(0);
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Cauchy Line: } \\beta_C^*(s) &= \\frac{1}{D_V} + 2 e_C \\cdot s \\quad (m_C = ${result.cauchyFit.slope.toFixed(4)}, C_C = ${result.cauchyFit.intercept.toFixed(4)}, R^2 = ${result.cauchyFit.rSquared.toFixed(4)}) \\\\
\\text{Gaussian Line: } (\\beta_G^*(s))^2 &= \\left(\\frac{1}{\\pi D_G}\\right)^2 + 8\\pi e_G^2 \\cdot s^2 \\quad (m_G = ${result.gaussianFit.slope.toFixed(4)}, C_G = ${result.gaussianFit.intercept.toFixed(4)}, R^2 = ${result.gaussianFit.rSquared.toFixed(4)}) \\\\
D_V &= ${result.volumeSizeDvNm.toFixed(2)} \\text{ nm}, \\quad D_A = ${result.areaSizeDaNm.toFixed(2)} \\text{ nm}, \\quad D_G = ${result.gaussianSizeDgNm.toFixed(2)} \\text{ nm} \\\\
e_C &= ${(result.cauchyStrainEc * 100).toFixed(4)}\\%, \\quad e_G = ${(result.gaussianStrainEg * 100).toFixed(4)}\\%, \\quad \\langle e^2 \\rangle^{1/2} = ${(result.rmsStrain * 100).toFixed(4)}\\%
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (!result || !result.points) return;
    let csv = "2Theta (deg),hkl,s (nm^-1),s^2 (nm^-2),beta_C* (nm^-1),(beta_G*)^2 (nm^-2),Single D_V (nm)\n";
    result.points.forEach(p => {
      const hklStr = p.hkl ? `"${p.hkl.join('')}"` : '""';
      csv += `${p.twoTheta},${hklStr},${p.s.toFixed(6)},${p.s2.toFixed(6)},${p.betaCStar.toFixed(6)},${p.betaGStarSq.toFixed(6)},${p.singleDvNm.toFixed(4)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Double_Voigt_Analysis_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Cauchy chart data
  const cauchyChartData = React.useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const xVals = result.points.map(p => p.s);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const pad = (maxX - minX) * 0.15 || 0.1;
    const startX = 0; // Show intercept clearly at s = 0
    const endX = maxX + pad;

    const points = result.points.map(p => ({
      x: p.s,
      y: p.betaCStar,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      singleDvNm: p.singleDvNm
    }));

    const line = [
      { x: startX, fitY: result.cauchyFit.slope * startX + result.cauchyFit.intercept },
      { x: endX, fitY: result.cauchyFit.slope * endX + result.cauchyFit.intercept }
    ];

    return { points, line, startX, endX };
  }, [result]);

  // Generate Gaussian chart data
  const gaussianChartData = React.useMemo(() => {
    if (!result || result.points.length < 2) return null;
    const xVals = result.points.map(p => p.s2);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const pad = (maxX - minX) * 0.15 || 0.01;
    const startX = 0; // Show intercept clearly at s^2 = 0
    const endX = maxX + pad;

    const points = result.points.map(p => ({
      x: p.s2,
      y: p.betaGStarSq,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      betaGStar: p.betaGStar
    }));

    const line = [
      { x: startX, fitY: result.gaussianFit.slope * startX + result.gaussianFit.intercept },
      { x: endX, fitY: result.gaussianFit.slope * endX + result.gaussianFit.intercept }
    ];

    return { points, line, startX, endX };
  }, [result]);

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

  // Generate Voigt profile deconvolution curve simulation for selected peak
  const selectedPeakProfileData = React.useMemo(() => {
    if (!result || !result.points || result.points.length === 0) return null;
    const peakIdx = Math.min(selectedPeakIdx, result.points.length - 1);
    const peak = result.points[peakIdx];
    if (!peak) return null;

    const parsedInput = parseDoubleVoigtInput(inputData)[peakIdx];
    const eta = parsedInput?.eta || 0.5;
    const fwhm = parsedInput?.fwhmObs || 0.4;
    const center = peak.twoTheta;

    // Generate x-range around 2theta +/- 3 * fwhm
    const numPoints = 120;
    const halfWidth = fwhm * 3;
    const profilePoints = [];

    const gamma = fwhm / 2; // Cauchy HWHM
    const sigma = fwhm / (2 * Math.sqrt(2 * Math.LN2)); // Gaussian sigma

    for (let i = 0; i < numPoints; i++) {
      const x = (center - halfWidth) + (i / (numPoints - 1)) * (2 * halfWidth);
      const dx = x - center;

      // Cauchy/Lorentzian component L(x)
      const cauchy = (1 / Math.PI) * (gamma / (dx * dx + gamma * gamma)) * (Math.PI * gamma); // Normalized peak height 1

      // Gaussian component G(x)
      const gaussian = Math.exp(-(dx * dx) / (2 * sigma * sigma));

      // Pseudo-Voigt combination
      const voigt = eta * cauchy + (1 - eta) * gaussian;

      profilePoints.push({
        twoTheta: parseFloat(x.toFixed(3)),
        voigt: parseFloat(voigt.toFixed(4)),
        cauchy: parseFloat((eta * cauchy).toFixed(4)),
        gaussian: parseFloat(((1 - eta) * gaussian).toFixed(4))
      });
    }

    return {
      peak,
      eta,
      fwhm,
      data: profilePoints
    };
  }, [result, selectedPeakIdx, inputData]);

  // Size Comparison Data for Bar Chart
  const sizeComparisonData = React.useMemo(() => {
    if (!result) return [];
    return [
      { name: 'Volume Size (D_V)', size: result.volumeSizeDvNm, color: '#6366f1' },
      { name: 'Area Size (D_A)', size: result.areaSizeDaNm, color: '#a855f7' },
      { name: 'Gaussian Size (D_G)', size: result.gaussianSizeDgNm, color: '#06b6d4' }
    ];
  }, [result]);

  const dvWalkthroughSteps: WizardStep[] = [
    {
      title: 'Prepare Observed Peaks & Instrumental Breadth',
      subtitle: 'Input (2θ, FWHM_obs, η_obs, hkl)',
      explanation: 'Every Bragg reflection is modeled as a pseudo-Voigt or true Voigt profile characterized by its FWHM and Lorentzian mixing fraction η. The instrumental broadening (g-profile) is subtracted using Caglioti parameters or constant slit corrections.',
      tip: 'Ensure that the Lorentzian fraction η_obs reflects true profile tails; higher η gives a larger Cauchy component.'
    },
    {
      title: 'Voigt Deconvolution (Balzar-Popa Inversion)',
      subtitle: 'Separating Cauchy (β_fC) & Gaussian (β_fG) Integral Breadths',
      explanation: 'Using the parabolic Voigt relation (β_C* = β_fC / β_f, β_G* = β_fG / β_f), we isolate the true specimen Cauchy integral breadth β_fC and Gaussian integral breadth β_fG in reciprocal space units (nm⁻¹).',
      tip: 'If Cauchy component β_C exceeds the total breadth, the profile is purely Lorentzian (size-dominated without detectable Gaussian microstrain).'
    },
    {
      title: 'Dual Linear Extrapolations: β_C* and (β_G*)²',
      subtitle: 'Intercepts = Crystallite Sizes; Slopes = Microstrains',
      explanation: '1. Cauchy plot: β_C* vs. s (where s = 2sinθ/λ) yields area-weighted size ⟨D_A⟩ from the vertical intercept and Cauchy strain e_C from the slope.\n2. Gaussian plot: (β_G*)² vs. s² yields volume-weighted size ⟨D_V⟩ from the intercept and Gaussian strain e_G from the slope.',
      tip: 'Area-weighted size ⟨D_A⟩ is fundamentally smaller than volume-weighted size ⟨D_V⟩. Their ratio ⟨D_V⟩ / ⟨D_A⟩ indicates size polydispersity!'
    },
    {
      title: 'Column Length Distribution & Summary',
      subtitle: 'Log-Normal & Gaussian Column Length Functions',
      explanation: 'From ⟨D_A⟩ and ⟨D_V⟩, we calculate the full column-length distribution and overall RMS microstrain ⟨e²⟩¹/² = √(e_C² + e_G²).',
      tip: 'A high ⟨D_V⟩/⟨D_A⟩ ratio (> 1.5) points to wide particle size distribution (polydispersity) or anisotropic crystal habit.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Double-Voigt Method (Langford / Balzar Formalism)"
        description="Master pseudo-Voigt deconvolution, Cauchy vs. Gaussian reciprocal integral breadths, and volume vs. area crystallite sizes."
        steps={dvWalkthroughSteps}
        presetNames={DV_PRESETS.map(p => p.name)}
        onLoadBenchmarkPreset={(idx) => {
          const p = DV_PRESETS[idx];
          if (p) handleApplyPreset(p);
        }}
      />

      {/* 0.5 Physical Meaning Verdict Banner */}
      {result && (
        <PhysicalMeaningSummary
          title="Double-Voigt Physical Crystallite & Strain Verdict"
          tone={result.rmsStrain > 0.003 ? 'warning' : 'success'}
          statement={`Sample exhibits volume-weighted crystallite size ⟨D_V⟩ = ${convertLength(result.volumeSizeDvNm * 10, lengthUnit).toFixed(1)} ${lengthUnit} and area-weighted size ⟨D_A⟩ = ${convertLength(result.areaSizeDaNm * 10, lengthUnit).toFixed(1)} ${lengthUnit} with an RMS microstrain of ${(result.rmsStrain * 100).toFixed(3)}%.`}
          contextNote={`Polydispersity ratio ⟨D_V⟩ / ⟨D_A⟩ = ${(result.volumeSizeDvNm / (result.areaSizeDaNm || 1)).toFixed(2)}. ${result.volumeSizeDvNm / (result.areaSizeDaNm || 1) > 1.4 ? 'High polydispersity ratio indicates significant nanoparticle size spread or anisotropic growth.' : 'Uniform crystallite size distribution.'}`}
          metrics={[
            { label: '⟨D_V⟩ Vol Size', value: convertLength(result.volumeSizeDvNm * 10, lengthUnit).toFixed(1), unit: lengthUnit },
            { label: '⟨D_A⟩ Area Size', value: convertLength(result.areaSizeDaNm * 10, lengthUnit).toFixed(1), unit: lengthUnit },
            { label: 'RMS Microstrain', value: (result.rmsStrain * 100).toFixed(3), unit: '%' },
            { label: 'Polydispersity', value: (result.volumeSizeDvNm / (result.areaSizeDaNm || 1)).toFixed(2), unit: '' }
          ]}
        />
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#020813] via-[#0B1230] to-[#060A20] p-6 md:p-10 border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.15)] group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-purple-600/30 transition-colors duration-700" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Advanced Convolution Profile Analysis • Langford Double-Voigt Method</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-400 tracking-tight flex flex-wrap items-center gap-3">
              Double-Voigt Method
              <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/30 shadow-inner">
                Voigt-Voigt Deconvolution
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Deconvolutes size and strain broadening into Voigt functions in reciprocal space <span className="font-mono text-indigo-300">(s = 2sinθ / λ)</span>. By separating Cauchy and Gaussian components, it extracts volume-weighted <span className="font-mono text-indigo-300">(D_V)</span> and area-weighted <span className="font-mono text-indigo-300">(D_A)</span> sizes alongside root-mean-square microstrains.
            </p>
          </div>
        </div>
      </div>

      {/* Experimental Sample Presets Toolbar */}
      <div className="bg-[#050C17]/90 p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-20 hover:border-indigo-500/30 transition-colors duration-500">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-wider">
          <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          <span>Curated Experimental Presets</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {DV_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black/50 hover:bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all flex-1 md:flex-none text-center shadow-inner flex items-center justify-center gap-1.5 group/btn"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:text-indigo-300 group-hover/btn:animate-pulse" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Input Data */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Instrument Settings Card */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />

            <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step 1
                </span>
                <Atom className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experimental Configuration</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Configured
              </span>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex p-1 bg-black/50 rounded-xl border border-white/10 gap-1 relative z-10">
              <button
                onClick={() => setExpSubTab('wavelength')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'wavelength'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sliders className="w-3 h-3" />
                Radiation & K
              </button>

              <button
                onClick={() => setExpSubTab('instrument')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                  expSubTab === 'instrument'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-3 h-3" />
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

            {/* Tab 1: Wavelength, Shape K, and Zero Shift */}
            {expSubTab === 'wavelength' && (
              <div className="space-y-4 relative z-10">
                {/* Wavelength Picker */}
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

                {/* Crystallite Shape Scale K */}
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

                {/* Goniometer Zero-Shift Correction */}
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
                          className="text-[10px] text-indigo-400 hover:underline font-mono"
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
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Corrects systematic zero error: 2θ_corr = 2θ_obs + Δ2θ₀
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Instrumental Broadening & Caglioti */}
            {expSubTab === 'instrument' && (
              <div className="space-y-4 relative z-10">
                {/* Instrumental Mode Toggle */}
                <div className="group/input">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-300 group-hover/input:text-indigo-300 transition-colors">
                      Instrumental Profile Resolution
                    </label>
                    <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 text-[10px] font-mono shadow-inner">
                      <button
                        onClick={() => setInstrumentalMode('constant')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          instrumentalMode === 'constant' ? 'bg-indigo-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Constant
                      </button>
                      <button
                        onClick={() => setInstrumentalMode('caglioti')}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          instrumentalMode === 'caglioti' ? 'bg-indigo-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
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
                        />
                        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">°2θ FWHM</span>
                      </div>
                      <div className="flex gap-2">
                        {[0, 0.05, 0.08, 0.12].map(val => (
                          <button 
                            key={val}
                            type="button"
                            onClick={() => setInstFwhm(val)}
                            className={`flex-1 py-1 rounded-lg border text-[9px] font-black transition-all ${instFwhm === val ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'}`}
                          >
                            {val === 0 ? '0 (Raw)' : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-1 mb-1 overflow-x-auto pb-1">
                        {[
                          { name: '0 (Raw)', u: 0, v: 0, w: 0 },
                          { name: 'Lab XRD', u: 0.005, v: -0.002, w: 0.015 },
                          { name: 'Synchrotron', u: 0.0002, v: -0.0001, w: 0.001 }
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setCagliotiU(preset.u);
                              setCagliotiV(preset.v);
                              setCagliotiW(preset.w);
                            }}
                            className="px-2 py-1 bg-black/40 border border-white/10 rounded-md text-[9px] font-mono text-slate-300 hover:text-indigo-400 hover:border-indigo-500/40 whitespace-nowrap"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
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

                {/* Instrumental Profile Cauchy Fraction Slider (instEta) */}
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
                  <p className="text-[10px] text-slate-400 leading-tight pt-1">
                    Langford Subtraction: β_C,S = β_C,obs - β_C,inst & β_G,S² = β_G,obs² - β_G,inst²
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Advanced Corrections */}
            {expSubTab === 'corrections' && (
              <div className="space-y-4 relative z-10">
                {/* Lorentz-Polarization (L-P) Factor Toggle */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Lorentz-Polarization (L-P) Factor Correction
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Adjusts line breadth for scattering geometry weighting
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyLPFactor(!applyLPFactor)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
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

                  {applyLPFactor && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <label className="text-[10px] text-slate-300 font-mono block">
                        Monochromator Angle (2θ_m)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMonochromatorAngle(0)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-mono border ${
                            monochromatorAngle === 0 
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                              : 'bg-black/60 text-slate-400 border-white/5'
                          }`}
                        >
                          Unpolarized (0°)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMonochromatorAngle(26.4)}
                          className={`py-1 px-2 rounded-lg text-[10px] font-mono border ${
                            monochromatorAngle === 26.4 
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                              : 'bg-black/60 text-slate-400 border-white/5'
                          }`}
                        >
                          Graphite (26.4°)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* K-Alpha2 Doublet Wavelength Correction */}
                <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Kα₂ Doublet Splitting Correction
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Rachinger doublet stripping at higher 2θ angles
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setKAlpha2Correction(!kAlpha2Correction)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
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

          {/* Peak Data Input */}
          <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-white/20 transition-colors duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step 2
                </span>
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Reflections Input</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputData('')}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors px-2.5 py-1.5 bg-black/40 rounded-lg hover:bg-white/5 border border-transparent hover:border-red-500/20 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              One reflection per line: <code className="text-indigo-300 bg-black/60 px-1.5 py-0.5 rounded font-mono shadow-inner border border-white/5 text-[11px]">2θ [deg], FWHM [deg], η [0..1], h, k, l</code>
            </p>

            <div className="relative group/textarea">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[30px] pointer-events-none group-focus-within/textarea:bg-indigo-500/10 transition-colors" />
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows={9}
                spellCheck={false}
                className="w-full p-4 bg-black/60 text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 hover:border-white/20 transition-all custom-scrollbar leading-relaxed shadow-inner relative z-10"
              />
            </div>

            {/* Input Peak Counter */}
            <div className="flex items-center justify-between text-[11px] font-mono pt-1">
              <span className="text-slate-400">Parsed reflections: <strong className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{result?.points?.length || 0}</strong></span>
              {result && result.points.length >= 2 ? (
                <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" /> Ready for deconvolution
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Minimum 2 reflections
                </span>
              )}
            </div>
          </div>

          {/* Theoretical Summary Box */}
          <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/20 shadow-[0_8px_30px_rgba(99,102,241,0.05)] space-y-4 hover:border-indigo-500/40 transition-colors duration-500 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Step 3
              </span>
              <Info className="w-4 h-4" />
              Double-Voigt Formulation Guide
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed relative z-10">
              Calculates area-weighted crystallite size <span className="font-mono text-indigo-300">(D_A)</span> via Langford&apos;s formula by integrating the combined Cauchy and Gaussian Voigt contributions:
            </p>
            <div 
              className="text-white text-xs sm:text-sm py-3 px-3 bg-black/60 rounded-xl border border-white/10 font-mono overflow-x-auto text-center shadow-inner relative z-10"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(
                  'D_A = \\frac{1}{\\pi \\beta_{G,S}^*} \\cdot \\exp(k^2) \\cdot \\text{erfc}(k)',
                  { throwOnError: false, displayMode: true }
                )
              }}
            />
            <div className="bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/20 space-y-1.5 hover:bg-indigo-500/10 transition-colors relative z-10">
              <span className="text-indigo-400 font-bold block flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Voigt Parameter Ratio:</span>
              <div 
                className="text-slate-200 text-center bg-black/40 py-1.5 px-2 rounded-lg"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    'k = \\frac{\\beta_{C,S}^*}{\\sqrt{\\pi} \\beta_{G,S}^*}',
                    { throwOnError: false, displayMode: false }
                  )
                }}
              />
            </div>
          </div>

        </div>

        {/* Right Column: Key Results & Interactive Visualizers */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Key Microstructural Results */}
          {result ? (
            <>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <ScientificMathControl
                  title="Double-Voigt Extrapolation"
                  formula="\begin{aligned} \beta_C^*(s) &= \frac{1}{D_V} + 2e_C s \\ (\beta_G^*(s))^2 &= \left(\frac{1}{\pi D_G}\right)^2 + 8\pi e_G^2 s^2 \end{aligned}"
                  description="Deconvolutes instrumental broadening and separates structural effects into Cauchy (crystallite size) and Gaussian (microstrain) components."
                  variables={[
                    { symbol: 'D_V', name: 'Volume Size', value: convertLength(result.volumeSizeDvNm * 10, lengthUnit), unit: lengthUnit },
                    { symbol: 'D_G', name: 'Gaussian Size', value: convertLength(result.gaussianSizeDgNm * 10, lengthUnit), unit: lengthUnit },
                    { symbol: 'e_C', name: 'Cauchy Strain', value: result.cauchyStrainEc * 100, unit: '%' },
                    { symbol: 'e_G', name: 'Gaussian Strain', value: result.gaussianStrainEg * 100, unit: '%' }
                  ]}
                  result={convertLength(result.volumeSizeDvNm * 10, lengthUnit)}
                  resultUnit={lengthUnit}
                  resultName="D_V (Volume-Weighted Size)"
                />
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
              
              {/* Volume-Weighted Size D_V */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/30 shadow-[0_8px_30px_rgba(99,102,241,0.1)] relative overflow-hidden group hover:border-indigo-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Ruler className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Volume Size (D_V)</span>
                  </div>
                  <WhatDoesThisMeanTooltip
                    term="Volume-Weighted Size ⟨D_V⟩"
                    symbol="⟨D_V⟩"
                    explanation="Crystallite diameter weighted by crystal volume (D⁴/D³). Larger crystallites scatter more photons and dominate this metric."
                    physicalInterpretation="⟨D_V⟩ represents the average crystallite size seen by X-ray scattering power. It is always larger than or equal to area-weighted size ⟨D_A⟩."
                    ruleOfThumb="Ratio ⟨D_V⟩ / ⟨D_A⟩ ≈ 1.0 for monodisperse crystals; > 1.4 indicates polydispersity or anisotropic morphology."
                  />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                    {convertLength(result.volumeSizeDvNm * 10, lengthUnit).toFixed(2)}
                  </span>
                  <span className="text-indigo-300 text-sm font-mono font-semibold">{lengthUnit}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between"><span>Area Size D_A:</span> <span className="text-slate-200 font-bold">{convertLength(result.areaSizeDaNm * 10, lengthUnit).toFixed(2)} {lengthUnit}</span></div>
                  <div className="flex justify-between"><span>Gaussian Size D_G:</span> <span className="text-slate-200 font-bold">{convertLength(result.gaussianSizeDgNm * 10, lengthUnit).toFixed(2)} {lengthUnit}</span></div>
                </div>
              </div>

              {/* Cauchy Strain e_C */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-purple-500/30 shadow-[0_8px_30px_rgba(168,85,247,0.1)] relative overflow-hidden group hover:border-purple-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Cauchy Strain (e_C)</span>
                  </div>
                  <Layers className="w-4 h-4 text-purple-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    {(result.cauchyStrainEc * 100).toFixed(4)}
                  </span>
                  <span className="text-purple-300 text-sm font-mono font-semibold">%</span>
                </div>
                <div className="mt-4 pt-3 border-t border-purple-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between"><span>Gaussian Strain e_G:</span> <span className="text-slate-200 font-bold">{(result.gaussianStrainEg * 100).toFixed(4)}%</span></div>
                  <div className="flex justify-between"><span>Cauchy Slope m_C:</span> <span className="text-slate-200 font-bold">{result.cauchyFit.slope.toFixed(4)}</span></div>
                </div>
              </div>

              {/* Root-Mean-Square Strain */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-cyan-500/30 shadow-[0_8px_30px_rgba(6,182,212,0.1)] relative overflow-hidden group hover:border-cyan-400/60 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-cyan-500/20 transition-colors" />
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">RMS Strain ⟨e²⟩¹/²</span>
                  </div>
                  <Activity className="w-4 h-4 text-cyan-400/50" />
                </div>
                <div className="flex items-baseline gap-2 mt-1 relative z-10">
                  <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-cyan-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    {(result.rmsStrain * 100).toFixed(4)}
                  </span>
                  <span className="text-cyan-300 text-sm font-mono font-semibold">%</span>
                </div>
                <div className="mt-4 pt-3 border-t border-cyan-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between"><span>Cauchy R²:</span> <span className="text-indigo-300 font-bold">{(result.cauchyFit.rSquared * 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>Gaussian R²:</span> <span className="text-purple-300 font-bold">{(result.gaussianFit.rSquared * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            </motion.div>
            </>
          ) : (
            <div className="bg-[#080E1A]/90 p-8 rounded-3xl border border-dashed border-white/20 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Insufficient Peak Data</p>
              <p className="text-xs text-slate-400">Enter at least 2 valid peak profiles to execute Double-Voigt convolution analysis.</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <AIAnalysis methodName="Double-Voigt Method (Langford)" resultData={result} />
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
          )}

          {/* Interactive Plots Navigation Container */}
          {result && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5">

              {/* Method Stepper Pipeline */}
              <div className="bg-[#050C17]/90 p-4 rounded-2xl border border-indigo-500/20 shadow-inner space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Double-Voigt Logical Execution Pipeline</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Click any step to inspect physics
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => setActivePlotTab('profile')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activePlotTab === 'profile'
                        ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Step 1
                      </span>
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mb-0.5">1. Profile Deconvolution</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Strip instrumental broadening g(2θ)</p>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('concept')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activePlotTab === 'concept'
                        ? 'bg-indigo-500/10 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Step 2
                      </span>
                      <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mb-0.5">2. Voigt Split (L vs G)</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Separate Cauchy & Gaussian parts</p>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('cauchy')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activePlotTab === 'cauchy' || activePlotTab === 'gaussian'
                        ? 'bg-purple-500/10 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Step 3
                      </span>
                      <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mb-0.5">3. Dual Regressions</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Extract D_V from s and e_G from s²</p>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('summary')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activePlotTab === 'summary'
                        ? 'bg-emerald-500/10 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Step 4
                      </span>
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h5 className="text-xs font-bold text-white mb-0.5">4. Microstructure</h5>
                    <p className="text-[10px] text-slate-400 leading-tight">Synthesize D_V, D_A, and strain e_G</p>
                  </button>
                </div>
              </div>
              
              {/* Tab Selector Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10 w-full sm:w-auto">
                  <button
                    onClick={() => setActivePlotTab('concept')}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all flex-1 sm:flex-none text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      activePlotTab === 'concept'
                        ? 'bg-indigo-500 text-black shadow-lg shadow-indigo-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Concept Simulation</span>
                  </button>

                  <button
                    onClick={() => setActivePlotTab('cauchy')}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all flex-1 sm:flex-none text-center cursor-pointer ${
                      activePlotTab === 'cauchy'
                        ? 'bg-indigo-500 text-black shadow-lg shadow-indigo-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Cauchy Plot (β_C* vs s)
                  </button>

                  <button
                    onClick={() => setActivePlotTab('gaussian')}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all flex-1 sm:flex-none text-center cursor-pointer ${
                      activePlotTab === 'gaussian'
                        ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Gaussian Plot ((β_G*)^2 vs s^2)
                  </button>

                  <button
                    onClick={() => setActivePlotTab('profile')}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all flex-1 sm:flex-none text-center cursor-pointer ${
                      activePlotTab === 'profile'
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Profile Deconvolution
                  </button>

                  <button
                    onClick={() => setActivePlotTab('summary')}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all flex-1 sm:flex-none text-center cursor-pointer ${
                      activePlotTab === 'summary'
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Size Spectrum
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono flex items-center gap-2 transition-all border border-white/10 hover:border-white/20"
                    title="Export CSV"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleCopyLaTeX}
                    className={`px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all border ${
                      copiedNotification 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}
                  >
                    {copiedNotification ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedNotification ? 'Copied LaTeX!' : 'Copy LaTeX'}</span>
                  </button>
                </div>
              </div>

              {/* Tab 0: Interactive Concept Simulation Tab */}
              {activePlotTab === 'concept' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5 bg-[#030710]/60 p-5 sm:p-6 rounded-2xl border border-indigo-500/30 relative shadow-inner"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        <span>Interactive Voigt Component Breakdown Visualizer</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Move the Lorentzian fraction slider below to see how a Voigt peak splits into Cauchy (Size) and Gaussian (Strain) curves.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-indigo-300">
                      <span>Lorentzian Fraction (η):</span>
                      <strong className="text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                        {interactiveEta.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Interactive Control Slider */}
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-indigo-400 font-bold flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        Adjust Peak Profile Shape (η = Lorentzian Area / Total Area)
                      </span>
                      <span className="text-slate-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-[11px]">
                        {interactiveEta > 0.70 
                          ? 'Crystallite Size Broadening Dominates (Heavy Tails)' 
                          : interactiveEta < 0.35 
                          ? 'Lattice Microstrain Broadening Dominates (Gaussian Core)' 
                          : 'Convoluted Size + Microstrain Profile'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0.05"
                      max="0.95"
                      step="0.01"
                      value={interactiveEta}
                      onChange={(e) => setInteractiveEta(parseFloat(e.target.value))}
                      className="w-full accent-indigo-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
                      <span className="text-purple-400 font-bold">← η = 0.05 (Pure Gaussian / Strain)</span>
                      <span className="text-slate-300 font-semibold">η = 0.50 (Voigt Balance)</span>
                      <span className="text-indigo-400 font-bold">η = 0.95 (Pure Cauchy / Domain Size) →</span>
                    </div>
                  </div>

                  {/* Live Simulation Chart */}
                  <div className="h-72 sm:h-96 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={conceptProfileData} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="twoTheta"
                          type="number"
                          domain={['auto', 'auto']}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Diffraction Angle 2θ [°]',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#818cf8',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Normalized Intensity [a.u.]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#818cf8',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-indigo-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-indigo-400 font-bold border-b border-white/10 pb-1">
                                    2θ = {d.twoTheta}°
                                  </div>
                                  <div>Total Voigt V(2θ): <span className="text-white font-bold">{d.voigt}</span></div>
                                  <div>Cauchy (Size): <span className="text-indigo-400 font-bold">{d.cauchySize}</span></div>
                                  <div>Gaussian (Strain): <span className="text-purple-400 font-bold">{d.gaussianStrain}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        <Line
                          type="monotone"
                          dataKey="voigt"
                          name="Observed Peak Profile V(2θ)"
                          stroke="#ffffff"
                          strokeWidth={3}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="cauchySize"
                          name="Cauchy (Lorentzian) Component → Size Broadening (D_V)"
                          stroke="#818cf8"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="gaussianStrain"
                          name="Gaussian Component → Microstrain Broadening (e_G)"
                          stroke="#c084fc"
                          strokeWidth={2}
                          strokeDasharray="2 2"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Physical Explanation Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                        <Ruler className="w-4 h-4 text-indigo-400" />
                        <span>Cauchy Component (Lorentzian Wings)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        Lorentzian broadening extends far into the tail wings. It is caused by **crystallite boundary size limitations**.
                      </p>
                      <div className="bg-black/60 p-2 rounded text-center text-indigo-200 font-mono text-[11px] border border-white/5">
                        β_C*(s) = (1 / D_V) + 2 e_C · s
                      </div>
                    </div>

                    <div className="bg-purple-950/30 p-3.5 rounded-2xl border border-purple-500/30 space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span>Gaussian Component (Peak Core)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        Gaussian broadening forms the central peak core. It is caused by **lattice microstrains and d-spacing distributions**.
                      </p>
                      <div className="bg-black/60 p-2 rounded text-center text-purple-200 font-mono text-[11px] border border-white/5">
                        (β_G*(s))² = (1 / π D_G)² + 8π e_G² · s²
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 1: Cauchy Chart */}
              {activePlotTab === 'cauchy' && cauchyChartData && (
                <div className="space-y-4 bg-[#030710]/50 p-4 sm:p-6 rounded-2xl border border-white/5 relative shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-2">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Linear Cauchy Regression: <strong className="text-indigo-400">β_C* = 1/D_V + 2 e_C · s</strong></span>
                    <span className="bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-slate-400">Intercept (s=0): <strong className="text-indigo-300">{result.cauchyFit.intercept.toFixed(4)} nm⁻¹</strong></span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="x"
                          type="number"
                          domain={[cauchyChartData.startX, cauchyChartData.endX]}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Scattering Vector s = 2 sin θ / λ [nm⁻¹]',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#818cf8',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          dataKey="y"
                          type="number"
                          domain={['auto', 'auto']}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Cauchy Breadth β_C* [nm⁻¹]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#818cf8',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-indigo-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-indigo-400 font-bold border-b border-white/10 pb-1">
                                    {data.hkl ? `Reflection: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
                                  </div>
                                  <div>2θ: <span className="text-indigo-300">{data.twoTheta?.toFixed(2)}°</span></div>
                                  <div>s: <span className="text-indigo-300">{data.x?.toFixed(4)} nm⁻¹</span></div>
                                  <div>β_C*: <span className="text-indigo-300">{data.y?.toFixed(4)} nm⁻¹</span></div>
                                  <div>Single D_V: <span className="text-emerald-400 font-bold">{data.singleDvNm?.toFixed(2)} nm</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        {/* Intercept Line */}
                        <ReferenceLine 
                          x={0} 
                          stroke="#818cf8" 
                          strokeDasharray="4 4" 
                          label={{ value: "s = 0", fill: "#818cf8", fontSize: 10, position: "top" }} 
                        />

                        <Line
                          data={cauchyChartData.line}
                          type="linear"
                          dataKey="fitY"
                          name={`Cauchy Fit: β_C* = ${result.cauchyFit.slope.toFixed(4)}s + ${result.cauchyFit.intercept.toFixed(4)} (R² = ${(result.cauchyFit.rSquared*100).toFixed(1)}%)`}
                          stroke="#818cf8"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={false}
                        />

                        <Scatter
                          data={cauchyChartData.points}
                          name="Measured Cauchy Reflections"
                          fill="#a5b4fc"
                          stroke="#6366f1"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 2: Gaussian Chart */}
              {activePlotTab === 'gaussian' && gaussianChartData && (
                <div className="space-y-4 bg-[#030710]/50 p-4 sm:p-6 rounded-2xl border border-white/5 relative shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-2">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Linear Gaussian Regression: <strong className="text-purple-400">(β_G*)^2 = (1/π D_G)^2 + 8π e_G^2 · s^2</strong></span>
                    <span className="bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 text-slate-400">Intercept (s²=0): <strong className="text-purple-300">{result.gaussianFit.intercept.toFixed(5)} nm⁻²</strong></span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="x"
                          type="number"
                          domain={[gaussianChartData.startX, gaussianChartData.endX]}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 's² [nm⁻²]',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#c084fc',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          dataKey="y"
                          type="number"
                          domain={['auto', 'auto']}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: '(β_G*)² [nm⁻²]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#c084fc',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-purple-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-purple-400 font-bold border-b border-white/10 pb-1">
                                    {data.hkl ? `Reflection: ${data.hkl}` : `2θ = ${data.twoTheta?.toFixed(2)}°`}
                                  </div>
                                  <div>2θ: <span className="text-purple-300">{data.twoTheta?.toFixed(2)}°</span></div>
                                  <div>s²: <span className="text-purple-300">{data.x?.toFixed(4)} nm⁻²</span></div>
                                  <div>(β_G*)²: <span className="text-purple-300">{data.y?.toFixed(5)} nm⁻²</span></div>
                                  <div>β_G*: <span className="text-purple-300">{data.betaGStar?.toFixed(4)} nm⁻¹</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        <ReferenceLine 
                          x={0} 
                          stroke="#c084fc" 
                          strokeDasharray="4 4" 
                          label={{ value: "s² = 0", fill: "#c084fc", fontSize: 10, position: "top" }} 
                        />

                        <Line
                          data={gaussianChartData.line}
                          type="linear"
                          dataKey="fitY"
                          name={`Gaussian Fit: (β_G*)² = ${result.gaussianFit.slope.toFixed(4)}s² + ${result.gaussianFit.intercept.toFixed(5)} (R² = ${(result.gaussianFit.rSquared*100).toFixed(1)}%)`}
                          stroke="#c084fc"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={false}
                        />

                        <Scatter
                          data={gaussianChartData.points}
                          name="Measured Gaussian Reflections"
                          fill="#e9d5ff"
                          stroke="#a855f7"
                          strokeWidth={2}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 3: Peak Profile Deconvolution Simulator */}
              {activePlotTab === 'profile' && selectedPeakProfileData && (
                <div className="space-y-4 bg-[#030710]/50 p-4 sm:p-6 rounded-2xl border border-white/5 relative shadow-inner">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-slate-300">
                      Select Reflection to Inspect Deconvoluted Voigt Components:
                    </span>

                    {/* Reflection Picker */}
                    <select
                      value={selectedPeakIdx}
                      onChange={(e) => setSelectedPeakIdx(parseInt(e.target.value))}
                      className="px-3 py-1.5 bg-black/40 text-cyan-300 border border-cyan-500/30 rounded-xl outline-none font-bold hover:border-cyan-400/50 transition-colors cursor-pointer appearance-none"
                    >
                      {result.points.map((p, idx) => (
                        <option key={idx} value={idx}>
                          Peak #{idx+1}: 2θ = {p.twoTheta.toFixed(2)}° {p.hkl ? `(${p.hkl.join('')})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono bg-black/40 p-3 rounded-2xl border border-white/5 shadow-inner">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Position</span>
                      <strong className="text-white">{selectedPeakProfileData.peak.twoTheta.toFixed(2)}° 2θ</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">FWHM Obs</span>
                      <strong className="text-cyan-300">{selectedPeakProfileData.fwhm.toFixed(3)}°</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Lorentzian Fraction η</span>
                      <strong className="text-indigo-300">{selectedPeakProfileData.eta.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Apparent Size D_V</span>
                      <strong className="text-emerald-400">{selectedPeakProfileData.peak.singleDvNm.toFixed(2)} nm</strong>
                    </div>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedPeakProfileData.data} margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis
                          dataKey="twoTheta"
                          type="number"
                          domain={['auto', 'auto']}
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Diffraction Angle 2θ [°]',
                            position: 'insideBottom',
                            offset: -15,
                            fill: '#06b6d4',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <YAxis
                          type="number"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Normalized Intensity [a.u.]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#06b6d4',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-cyan-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-cyan-400 font-bold border-b border-white/10 pb-1">
                                    2θ = {d.twoTheta}°
                                  </div>
                                  <div>Total Voigt I: <span className="text-white font-bold">{d.voigt}</span></div>
                                  <div>Cauchy Component: <span className="text-indigo-400 font-bold">{d.cauchy}</span></div>
                                  <div>Gaussian Component: <span className="text-purple-400 font-bold">{d.gaussian}</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                        <Line
                          type="monotone"
                          dataKey="voigt"
                          name="Composite Voigt Profile V(2θ)"
                          stroke="#06b6d4"
                          strokeWidth={3}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="cauchy"
                          name="Cauchy (Lorentzian) Profile L(2θ)"
                          stroke="#818cf8"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="gaussian"
                          name="Gaussian Profile G(2θ)"
                          stroke="#c084fc"
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tab 4: Size Distribution Spectrum Bar Chart */}
              {activePlotTab === 'summary' && sizeComparisonData && (
                <div className="space-y-4 bg-[#030710]/50 p-4 sm:p-6 rounded-2xl border border-white/5 relative shadow-inner">
                  <div className="text-xs font-mono text-slate-300">
                    <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">Microstructural Size Metric Spectrum comparison derived from Langford Voigt deconvolution</span>
                  </div>

                  <div className="h-72 sm:h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sizeComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          tick={{ fill: '#e2e8f0', fontSize: 12, fontFamily: 'monospace' }} 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                          label={{
                            value: 'Crystallite Size [nm]',
                            angle: -90,
                            position: 'insideLeft',
                            offset: -10,
                            fill: '#10b981',
                            fontSize: 12,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-[#050C17]/95 border border-emerald-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1">
                                  <div className="text-emerald-400 font-bold border-b border-white/10 pb-1">
                                    {d.name}
                                  </div>
                                  <div>Calculated Size: <span className="text-white font-bold">{d.size.toFixed(2)} nm</span></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="size" name="Crystallite Size [nm]" radius={[12, 12, 0, 0]}>
                          {sizeComparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Reflection Parameters Summary Table */}
          {result && result.points && (
            <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-colors duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
              <div className="flex items-center justify-between relative z-10">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Double-Voigt Reflection Deconvolution Table
                </h3>
                <span className="text-xs font-mono text-slate-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                  <strong className="text-indigo-400">{result.points.length}</strong> peaks deconvoluted
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar relative z-10 bg-black/40 rounded-2xl border border-white/5">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase bg-black/40">
                      <th className="py-3 px-4 font-semibold tracking-wider">2θ [°]</th>
                      <th className="py-3 px-4 font-semibold tracking-wider">hkl</th>
                      <th className="py-3 px-4 font-semibold tracking-wider">s [nm⁻¹]</th>
                      <th className="py-3 px-4 font-semibold tracking-wider">s² [nm⁻²]</th>
                      <th className="py-3 px-4 font-semibold tracking-wider text-indigo-400">β_C* [nm⁻¹]</th>
                      <th className="py-3 px-4 font-semibold tracking-wider text-purple-400">(β_G*)² [nm⁻²]</th>
                      <th className="py-3 px-4 font-semibold tracking-wider text-emerald-400">Single D_V [nm]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {result.points.map((p, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setSelectedPeakIdx(idx);
                          setActivePlotTab('profile');
                        }}
                        className={`hover:bg-indigo-500/10 transition-colors cursor-pointer ${selectedPeakIdx === idx ? 'bg-indigo-500/20 border-l-2 border-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]' : 'border-l-2 border-transparent'}`}
                      >
                        <td className="py-3 px-4 font-bold text-white">{p.twoTheta.toFixed(2)}°</td>
                        <td className="py-3 px-4 text-indigo-300">
                          <span className="bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{p.hkl ? `(${p.hkl.join('')})` : '-'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{p.s.toFixed(4)}</td>
                        <td className="py-3 px-4 text-slate-400">{p.s2.toFixed(4)}</td>
                        <td className="py-3 px-4 text-indigo-300 font-bold bg-indigo-500/5">{p.betaCStar.toFixed(4)}</td>
                        <td className="py-3 px-4 text-purple-300 font-bold bg-purple-500/5">{p.betaGStarSq.toFixed(5)}</td>
                        <td className="py-3 px-4 text-emerald-400 font-bold bg-emerald-500/5">{p.singleDvNm.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
