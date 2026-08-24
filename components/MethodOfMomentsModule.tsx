import React, { useState, useEffect, useRef, useMemo } from 'react';
import { playSynthTone } from '../utils/sound';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseMomentInput, calculateMethodOfMoments } from '../utils/physics';
import { MethodOfMomentsResult, MomentDataPoint } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Info,
  AlertTriangle,
  TrendingUp,
  Ruler,
  ChevronDown,
  Atom,
  Download,
  Trash2,
  Database,
  FlaskConical,
  Activity,
  Layers,
  CheckCircle,
  Copy,
  Sparkles,
  RotateCcw,
  BarChart2,
  Sliders,
  Award,
  Zap,
  HelpCircle,
  Maximize2,
  BarChart3,
  Cpu,
  Calculator,
  Check
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

const MOMENT_PRESETS = [
  {
    name: 'CeO2 Nanocrystals (Pure Size)',
    wavelength: 1.54056,
    twoTheta0: 28.55,
    data: "0.20, 0.00182, 0.000009\n0.30, 0.00285, 0.000022\n0.40, 0.00392, 0.000041\n0.50, 0.00498, 0.000067\n0.60, 0.00605, 0.000099\n0.70, 0.00714, 0.000139\n0.80, 0.00822, 0.000185\n0.90, 0.00931, 0.000238\n1.00, 0.01041, 0.000299",
    desc: 'Uniform fluorite nanopowder exhibiting strong linear variance progression governed predominantly by size broadening.'
  },
  {
    name: 'Nanocrystalline Nickel (Size + Strain)',
    wavelength: 1.54056,
    twoTheta0: 44.51,
    data: "0.20, 0.00210, 0.000012\n0.35, 0.00395, 0.000038\n0.50, 0.00612, 0.000088\n0.65, 0.00862, 0.000168\n0.80, 0.01145, 0.000288\n0.95, 0.01460, 0.000455\n1.10, 0.01810, 0.000680\n1.25, 0.02192, 0.000970",
    desc: 'Severe plastic deformation nickel sample displaying noticeable quadratic curvature from lattice microstrain.'
  },
  {
    name: 'Ultrafine Anatase TiO2 (High Surface Area)',
    wavelength: 1.54056,
    twoTheta0: 25.28,
    data: "0.25, 0.00295, 0.000021\n0.40, 0.00485, 0.000055\n0.55, 0.00682, 0.000108\n0.70, 0.00886, 0.000182\n0.85, 0.01096, 0.000280\n1.00, 0.01314, 0.000405\n1.15, 0.01538, 0.000558",
    desc: 'Anatase nanocrystals evaluated by integration range cutoffs up to 1.15 degrees.'
  },
  {
    name: 'Cold-Worked Cu Alloy (High Strain)',
    wavelength: 1.54056,
    twoTheta0: 43.30,
    data: "0.30, 0.00340, 0.000030\n0.50, 0.00650, 0.000100\n0.70, 0.01040, 0.000250\n0.90, 0.01510, 0.000510\n1.10, 0.02060, 0.000920\n1.30, 0.02690, 0.001530",
    desc: 'High density dislocations driving significant quadratic curvature in variance-range plot.'
  }
];

export const MethodOfMomentsModule: React.FC = () => {
  const { lengthUnit = 'Å' } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [twoTheta0, setTwoTheta0] = useState<number>(28.55);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [instFwhm, setInstFwhm] = useState<number>(0.05);
  const [zeroShiftDeg, setZeroShiftDeg] = useState<number>(0.0);
  const [applyLPFactor, setApplyLPFactor] = useState<boolean>(false);
  const [monochromatorAngle, setMonochromatorAngle] = useState<number>(26.4);
  const [kAlpha2Correction, setKAlpha2Correction] = useState<boolean>(false);
  const [shapeK, setShapeK] = useState<number>(1.0);
  const [expSubTab, setExpSubTab] = useState<'wavelength' | 'instrument' | 'corrections'>('wavelength');

  const [inputData, setInputData] = useState<string>(MOMENT_PRESETS[0].data);
  const [activeTab, setActiveTab] = useState<'variancePlot' | 'reducedPlot' | 'generator' | 'kurtosis'>('variancePlot');

  // Synthetic peak parameters for interactive profile moment calculator
  const [synthCentroid, setSynthCentroid] = useState<number>(38.2);
  const [synthFwhm, setSynthFwhm] = useState<number>(0.35);
  const [synthMixingEta, setSynthMixingEta] = useState<number>(0.5); // 0=Gaussian, 1=Lorentzian

  const [result, setResult] = useState<MethodOfMomentsResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_moment_analysis_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [copiedNotification, setCopiedNotification] = useState(false);
  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState<number>(-1);

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 500);
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 1000);
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('chime');
    }, 1500);
    setTimeout(() => {
      setAppState('results');
    }, 2000);
  };

  // Recalculate whenever inputs change
  useEffect(() => {
    const parsedMoments = parseMomentInput(inputData);
    if (parsedMoments.length >= 3) {
      const computed = calculateMethodOfMoments(
        wavelength,
        twoTheta0,
        parsedMoments,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        instFwhm,
        {
          zeroShiftDeg,
          applyLPFactor,
          monochromatorAngleDeg: monochromatorAngle,
          kAlpha2Correction,
          shapeK
        }
      );
      setResult(computed);
      if (computed) {
        localStorage.setItem('xrd_moment_analysis_current', JSON.stringify(computed));
      }
    } else {
      setResult(null);
    }
  }, [
    wavelength,
    twoTheta0,
    inputData,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    instFwhm,
    zeroShiftDeg,
    applyLPFactor,
    monochromatorAngle,
    kAlpha2Correction,
    shapeK
  ]);

  const handleApplyPreset = (preset: typeof MOMENT_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setTwoTheta0(preset.twoTheta0);
    setInputData(preset.data);
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Variance-Range Relation: } W(\\sigma) &= W_0 + K_1 \\cdot \\sigma + K_2 \\cdot \\sigma^2 \\\\
\\text{Linear Slope } K_1 &= ${result.slopeK1.toExponential(4)} \\text{ rad}, \\quad \\text{Quadratic } K_2 = ${result.quadraticK2.toExponential(4)} \\\\
\\text{Volume-Weighted Size } D_V &= ${result.sizeNm.toFixed(2)} \\text{ nm}, \\quad \\text{RMS Microstrain } \\langle\\epsilon^2\\rangle^{1/2} = ${(result.rmsStrain * 100).toFixed(4)}\\%
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    let csv = "Sigma_deg,Sigma_rad,Variance_deg2,Variance_rad2,Fitted_Variance_deg2,Linear_Part_deg2,Quadratic_Part_deg2,Kurtosis\n";
    result.points.forEach((p, idx) => {
      const f = result.fittedPoints[idx];
      csv += `${p.sigmaDeg},${p.sigmaRad.toFixed(6)},${p.varianceDeg2.toFixed(6)},${p.varianceRad2.toFixed(8)},${f?.fittedWDeg2.toFixed(6) || ''},${f?.linearComponentDeg2.toFixed(6) || ''},${f?.quadraticComponentDeg2.toFixed(6) || ''},${p.kurtosis ? p.kurtosis.toFixed(4) : ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Method_of_Moments_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate synthetic profile moments (Integration range sigma vs Variance W & Kurtosis)
  const syntheticMomentsData = useMemo(() => {
    const x0 = synthCentroid;
    const fwhm = synthFwhm;
    const eta = synthMixingEta; // Pseudo-Voigt eta
    const step = 0.005;
    const maxSpan = 1.5;
    const numPoints = Math.floor((2 * maxSpan) / step);

    // Build grid
    const grid: { x: number; intensity: number }[] = [];
    const sigmaG = fwhm / (2 * Math.sqrt(2 * Math.log(2)));
    const gammaL = fwhm / 2;

    for (let i = 0; i <= numPoints; i++) {
      const x = x0 - maxSpan + i * step;
      const dx = x - x0;
      // Gaussian component
      const g = Math.exp(-(dx * dx) / (2 * sigmaG * sigmaG)) / (sigmaG * Math.sqrt(2 * Math.PI));
      // Lorentzian component
      const l = (1 / Math.PI) * (gammaL / (dx * dx + gammaL * gammaL));
      // Pseudo-Voigt
      const pv = eta * l + (1 - eta) * g;
      grid.push({ x, intensity: pv });
    }

    // Now compute moments M0, M1, M2(W), M4 for cutoffs sigma from 0.1 to 1.2 deg
    const sigmaList = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05, 1.15];
    const DEG_TO_RAD = Math.PI / 180;

    return sigmaList.map(sig => {
      let m0 = 0;
      let m1 = 0;
      let m2 = 0;
      let m4 = 0;

      for (const pt of grid) {
        if (Math.abs(pt.x - x0) <= sig) {
          const dxRad = (pt.x - x0) * DEG_TO_RAD;
          m0 += pt.intensity * step;
          m1 += pt.x * pt.intensity * step;
          m2 += (dxRad * dxRad) * pt.intensity * step;
          m4 += Math.pow(dxRad, 4) * pt.intensity * step;
        }
      }

      const wRad2 = m0 > 0 ? m2 / m0 : 0;
      const mu4Rad4 = m0 > 0 ? m4 / m0 : 0;
      const wDeg2 = wRad2 * (180 / Math.PI) * (180 / Math.PI);
      const kurtosis = wRad2 > 0 ? mu4Rad4 / (wRad2 * wRad2) : 3.0;

      return {
        sigmaDeg: sig,
        sigmaRad: sig * DEG_TO_RAD,
        varianceDeg2: wDeg2,
        varianceRad2: wRad2,
        fourthMomentRad4: mu4Rad4,
        kurtosis
      };
    });
  }, [synthCentroid, synthFwhm, synthMixingEta]);

  const handleLoadSyntheticToInput = () => {
    let text = "";
    syntheticMomentsData.forEach(p => {
      text += `${p.sigmaDeg.toFixed(2)}, ${p.varianceDeg2.toFixed(6)}, ${p.fourthMomentRad4?.toFixed(9)}\n`;
    });
    setTwoTheta0(synthCentroid);
    setInputData(text);
  };

  // Chart data for Tab 1 (W vs sigma)
  const chartVarianceData = useMemo(() => {
    if (!result) return [];
    return result.points.map((p, idx) => {
      const f = result.fittedPoints[idx];
      return {
        sigmaDeg: p.sigmaDeg,
        varianceDeg2: p.varianceDeg2,
        fittedWDeg2: f?.fittedWDeg2,
        linearComponentDeg2: f?.linearComponentDeg2,
        quadraticComponentDeg2: f?.quadraticComponentDeg2,
        kurtosis: p.kurtosis
      };
    });
  }, [result]);

  // Chart data for Tab 2 (Reduced Variance W / sigma vs sigma)
  const chartReducedData = useMemo(() => {
    if (!result) return [];
    return result.points.map((p, idx) => {
      const f = result.fittedPoints[idx];
      const wOverSigmaObs = p.varianceDeg2 / p.sigmaDeg;
      const wOverSigmaFit = f ? f.fittedWDeg2 / p.sigmaDeg : 0;
      return {
        sigmaDeg: p.sigmaDeg,
        wOverSigmaObs,
        wOverSigmaFit
      };
    });
  }, [result]);

  const momentsWalkthroughSteps: WizardStep[] = [
    {
      title: 'Define Integration Range (σ = Δ2θ)',
      subtitle: 'Progressive Cutoff Limits Around Peak Centroid 2θ₀',
      explanation: 'Calculates the variance W(σ) = μ₂ of the diffraction line as a function of the integration truncation range σ = |2θ - 2θ₀|. Broad tails carry crucial information regarding crystallite size and lattice strain.',
      tip: 'Ensure background subtraction is clean; over-subtraction artificially dampens higher-order moments.'
    },
    {
      title: 'Wilson-Langford Variance-Range Parabola',
      subtitle: 'W(σ) = W₀ + K₁·σ + K₂·σ²',
      explanation: 'The slope K₁ (linear term) is governed entirely by crystallite size broadening: K₁ = λ / (π² · D_V · cosθ₀). The curvature K₂ (quadratic term) is governed by microstrain: K₂ = 4 · ⟨ε²⟩ · tan²θ₀.',
      tip: 'In a purely size-broadened sample (e.g. CeO2 nanocrystals), K₂ ≈ 0 and the plot is a straight line!'
    },
    {
      title: 'Reduced Variance Plot: W(σ)/σ vs. σ',
      subtitle: 'Direct Visual Separation of Size vs. Strain',
      explanation: 'Dividing variance by σ yields W(σ)/σ = K₁ + K₂·σ. The vertical intercept directly reveals size constant K₁, while any non-zero slope immediately reveals microstrain K₂.',
      tip: 'A horizontal line in the reduced variance plot proves that the sample is strain-free.'
    },
    {
      title: 'Kurtosis & Peak Shape Factor β_I / FWHM',
      subtitle: 'Leptokurtic (> 3) vs. Platykurtic (< 3) Peak Tails',
      explanation: 'Evaluates the 4th moment μ₄ to determine peak sharpness and tail decay. Cauchy/Lorentzian profiles exhibit heavy tails (leptokurtic), while Gaussian profiles exhibit light tails (kurtosis = 3).',
      tip: 'High kurtosis (> 4) indicates a strong Lorentzian character typically associated with small crystallite dimensions and planar stacking faults.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Method of Moments & Variance-Range Parabolic Analysis"
        description="Master Wilson-Langford variance progression, linear size separation (K₁), and quadratic microstrain curvature (K₂)."
        steps={momentsWalkthroughSteps}
        presetNames={MOMENT_PRESETS.map(p => p.name)}
        onLoadBenchmarkPreset={(idx) => {
          const p = MOMENT_PRESETS[idx];
          if (p) handleApplyPreset(p);
        }}
      />

      {/* 0.5 Physical Meaning Verdict Banner */}
      {result && (
        <PhysicalMeaningSummary
          title="Method of Moments Physical Microstructure Verdict"
          tone={result.rmsStrain > 0.003 ? 'warning' : 'success'}
          statement={`Sample yields volume-weighted crystallite size D_V = ${convertLength(result.sizeNm * 10, lengthUnit).toFixed(1)} ${lengthUnit} with an RMS microstrain ⟨ε²⟩¹/² of ${(result.rmsStrain * 100).toFixed(3)}%.`}
          contextNote={`Linear size slope K₁ = ${result.slopeK1.toExponential(3)} rad; Quadratic strain curvature K₂ = ${result.quadraticK2.toExponential(3)}. ${result.quadraticK2 < 1e-4 ? 'Negligible quadratic curvature confirms predominantly size-broadened, strain-free crystallites.' : 'Noticeable quadratic curvature reveals internal dislocation strain.'}`}
          metrics={[
            { label: 'D_V Volume Size', value: convertLength(result.sizeNm * 10, lengthUnit).toFixed(1), unit: lengthUnit },
            { label: 'RMS Microstrain', value: (result.rmsStrain * 100).toFixed(3), unit: '%' },
            { label: 'Size Slope K₁', value: result.slopeK1.toExponential(2), unit: 'rad' },
            { label: 'Strain Curve K₂', value: result.quadraticK2.toExponential(2), unit: '' }
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
              <span>Statistical Profile Analysis • Second & Fourth Statistical Moments</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-400 tracking-tight flex flex-wrap items-center gap-3">
              Method of Moments
              <span className="text-xs font-mono font-normal text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/30 shadow-inner">
                Variance-Range Analysis
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Separates crystallite size and microstrain by analyzing profile variance <span className="font-mono text-indigo-300">W</span> and kurtosis <span className="font-mono text-indigo-300">μ₄</span> across integration ranges <span className="font-mono text-indigo-300">σ</span>. The linear slope yields reciprocal domain size <span className="font-mono text-indigo-300">(1/D_V)</span>, while quadratic curvature gives mean-square strain <span className="font-mono text-indigo-300">⟨ε²⟩</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative z-20">
            {appState === 'results' && (
              <button
                onClick={() => setAppState('setup')}
                className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg active:scale-95 animate-in fade-in"
              >
                <RotateCcw className="w-4 h-4 text-indigo-300" />
                Edit Parameters
              </button>
            )}
            <button
              onClick={handleCopyLaTeX}
              disabled={!result}
              className="px-3.5 py-2.5 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Copy LaTeX formula"
            >
              {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              {copiedNotification ? 'Copied!' : 'LaTeX'}
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={!result}
              className="px-3.5 py-2.5 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selector Row */}
      <div className="bg-[#050C17]/90 p-4 sm:p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative z-20 hover:border-indigo-500/30 transition-colors duration-500">
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 font-bold uppercase tracking-wider">
          <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          <span>Curated Experimental Datasets</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {MOMENT_PRESETS.map((p) => (
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

      {/* 1. SETUP STATE VIEW */}
      {appState === 'setup' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Experimental Geometry */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experimental Geometry</h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 shadow-inner">
                    Wilson Method
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
                    Radiation & Centroid
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

                {/* Sub-tab 1: Wavelength & Centroid */}
                {expSubTab === 'wavelength' && (
                  <div className="space-y-4 relative z-10">
                    <div className="group/input">
                      <label className="block text-xs font-semibold text-slate-300 mb-2 group-hover/input:text-indigo-300 transition-colors">
                        Radiation Wavelength (λ) [{lengthUnit}]
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

                    <div className="group/input">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-slate-300 group-hover/input:text-indigo-300 transition-colors">
                          Peak Centroid (2θ₀) [degrees]
                        </label>
                        <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          θ₀ = {(twoTheta0 / 2).toFixed(2)}°
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={twoTheta0}
                        onChange={(e) => setTwoTheta0(parseFloat(e.target.value) || 28.55)}
                        className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 hover:border-white/20 transition-colors shadow-inner"
                        placeholder="2θ₀ in degrees"
                      />
                    </div>

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
                  </div>
                )}

                {/* Sub-tab 2: Instrumental */}
                {expSubTab === 'instrument' && (
                  <div className="space-y-4 relative z-10">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setInstrumentalMode('constant')}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          instrumentalMode === 'constant'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-inner'
                            : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        Constant FWHM
                      </button>
                      <button
                        onClick={() => setInstrumentalMode('caglioti')}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          instrumentalMode === 'caglioti'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-inner'
                            : 'bg-black/40 text-slate-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        Caglioti Polynomial
                      </button>
                    </div>

                    {instrumentalMode === 'constant' ? (
                      <div className="group/input">
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Instrumental FWHM [degrees 2θ]
                        </label>
                        <input
                          type="number"
                          step="0.005"
                          value={instFwhm}
                          onChange={(e) => setInstFwhm(parseFloat(e.target.value) || 0.05)}
                          className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
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
                )}

                {/* Sub-tab 3: Corrections */}
                {expSubTab === 'corrections' && (
                  <div className="space-y-4 relative z-10">
                    <div className="p-3 bg-black/40 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-white block">Lorentz-Polarization (L-P) Factor</span>
                          <span className="text-[10px] text-slate-400">Angular scattering geometry correction</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setApplyLPFactor(!applyLPFactor)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${applyLPFactor ? 'bg-indigo-500' : 'bg-white/10'}`}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${applyLPFactor ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between shadow-inner">
                      <div>
                        <span className="text-xs font-semibold text-white block">Kα₂ Doublet Splitting Correction</span>
                        <span className="text-[10px] text-slate-400">Rachinger doublet stripping</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setKAlpha2Correction(!kAlpha2Correction)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${kAlpha2Correction ? 'bg-indigo-500' : 'bg-white/10'}`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${kAlpha2Correction ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Variance Data & Formula */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Range Cutoffs & Variance Data</h3>
                  </div>
                  <button
                    onClick={() => setInputData('')}
                    className="text-[10px] text-slate-400 hover:text-rose-400 font-mono transition-colors"
                  >
                    Clear Table
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Format: <code>Range_σ [deg], Variance_W [deg²], μ₄ [deg⁴] (opt)</code></span>
                  </div>
                  <textarea
                    rows={8}
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="0.20, 0.0021, 0.000015\n0.35, 0.0039, 0.000042\n0.50, 0.0058, 0.000088\n0.65, 0.0079, 0.000152\n0.80, 0.0101, 0.000238"
                    spellCheck={false}
                    className="w-full p-4 bg-black/60 text-indigo-300 font-mono text-xs border border-white/10 rounded-2xl outline-none focus:border-indigo-500/50 hover:border-white/20 transition-all custom-scrollbar leading-relaxed shadow-inner relative z-10"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                  <span className="text-slate-400">Parsed range points: <strong className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{result?.points?.length || 0}</strong></span>
                  {result && result.points.length >= 3 ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" /> Ready for Moment Regression
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" /> Minimum 3 range points required
                    </span>
                  )}
                </div>
              </div>

              {/* Methodology Guide */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/20 shadow-[0_8px_30px_rgba(99,102,241,0.05)] space-y-4 hover:border-indigo-500/40 transition-colors duration-500 relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
                  <Info className="w-4 h-4" />
                  Methodology & Formula Guide
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                  Evaluating profile variance <span className="font-mono text-indigo-300">W</span> against integration limits <span className="font-mono text-indigo-300">σ</span> yields a linear-quadratic regression:
                </p>
                <div 
                  className="text-white text-xs sm:text-sm py-3 px-3 bg-black/60 rounded-xl border border-white/10 font-mono overflow-x-auto text-center shadow-inner relative z-10"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(
                      'W(\\sigma) = W_0 + K_1 \\cdot \\sigma + K_2 \\cdot \\sigma^2',
                      { throwOnError: false, displayMode: true }
                    )
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Banner */}
          <div className="p-6 bg-[#050C17]/95 rounded-3xl border border-indigo-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Ready for Variance-Range Method of Moments
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {result?.points?.length || 0} Range Points Configured | Peak Centroid 2θ₀ = {twoTheta0}°
                </p>
              </div>
            </div>

            <button
              onClick={startComputation}
              disabled={!result || result.points.length < 3}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Calculator className="w-5 h-5" />
              <span>Compute Method of Moments (Variance-Range W)</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. COMPUTING STATE VIEW */}
      {appState === 'computing' && (
        <div className="bg-[#050C17]/95 rounded-3xl p-12 border border-indigo-500/30 shadow-2xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-indigo-950 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 0 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">1</span>
                Subtracting instrumental resolution & Caglioti broadening...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 1 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">2</span>
                Performing Wilson Variance-Range regression W(σ) = W₀ + K₁σ + K₂σ²...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 2 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">3</span>
                Deconvolving volume-weighted size ⟨D⟩_v & RMS microstrain ⟨ε²⟩¹/²...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 3 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">4</span>
                Evaluating 4th statistical moment μ₄ & profile shape kurtosis...
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}

      {/* 3. RESULTS STATE VIEW */}
      {appState === 'results' && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <ScientificMathControl
              title="Variance-Range Analysis"
              formula="W(\\sigma) = W_0 + \\frac{\\lambda \\sigma}{\\pi^2 D_V \\cos\\theta_0} + 4 \\langle\\epsilon^2\\rangle \\tan^2\\theta_0 \\cdot \\sigma^2"
              description="Separates crystallite size and microstrain by analyzing profile variance W across integration ranges σ. Linear slope gives domain size, quadratic curvature gives strain."
              variables={[
                { symbol: 'D_V', name: 'Volume Size', value: convertLength(result.sizeNm * 10, lengthUnit), unit: lengthUnit },
                { symbol: '⟨ε²⟩', name: 'Mean-Square Strain', value: (result.rmsStrain * result.rmsStrain) * 10000, unit: 'x10⁻⁴' },
                { symbol: 'K_1', name: 'Linear Slope (Size)', value: result.slopeK1, unit: '' },
                { symbol: 'K_2', name: 'Curvature (Strain)', value: result.quadraticK2, unit: '' }
              ]}
              result={convertLength(result.sizeNm * 10, lengthUnit)}
              resultUnit={lengthUnit}
              resultName="D_V (Volume Size)"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* Volume-Weighted Crystallite Size D_V */}
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/30 shadow-[0_8px_30px_rgba(99,102,241,0.1)] relative overflow-hidden group hover:border-indigo-400/60 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Volume Size (D_V)</span>
                </div>
                <Award className="w-4 h-4 text-indigo-400/50" />
              </div>
              <div className="flex items-baseline gap-2 mt-1 relative z-10">
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  {result.sizeNm.toFixed(2)}
                </span>
                <span className="text-indigo-300 text-sm font-mono font-semibold">nm</span>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-500/20 space-y-1 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between"><span>Length:</span> <span className="text-slate-200 font-bold">{(result.sizeNm * 10).toFixed(1)} Å</span></div>
                <div className="flex justify-between"><span>Linear Slope K₁:</span> <span className="text-indigo-300 font-bold">{result.slopeK1.toExponential(3)}</span></div>
              </div>
            </div>

            {/* RMS Microstrain */}
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-purple-500/30 shadow-[0_8px_30px_rgba(168,85,247,0.1)] relative overflow-hidden group hover:border-purple-400/60 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">RMS Microstrain</span>
                </div>
                <Activity className="w-4 h-4 text-purple-400/50" />
              </div>
              <div className="flex items-baseline gap-2 mt-1 relative z-10">
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  {(result.rmsStrain * 100).toFixed(3)}
                </span>
                <span className="text-purple-300 text-sm font-mono font-semibold">%</span>
              </div>
              <div className="mt-4 pt-3 border-purple-500/20 space-y-1 text-[11px] font-mono text-slate-400 border-t">
                <div className="flex justify-between"><span>⟨ε²⟩:</span> <span className="text-slate-200 font-bold">{(result.rmsStrain * result.rmsStrain).toExponential(3)}</span></div>
                <div className="flex justify-between"><span>Curvature K₂:</span> <span className="text-purple-300 font-bold">{result.quadraticK2.toExponential(3)}</span></div>
              </div>
            </div>

            {/* Regression Linearity */}
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:border-emerald-400/60 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Fit Quality (R²)</span>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-400/50" />
              </div>
              <div className="flex items-baseline gap-2 mt-1 relative z-10">
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {result.rSquared.toFixed(4)}
                </span>
              </div>
              <div className="mt-4 pt-3 border-emerald-500/20 space-y-1 text-[11px] font-mono text-slate-400 border-t">
                <div className="flex justify-between"><span>Intercept W₀:</span> <span className="text-slate-200 font-bold">{result.interceptW0.toExponential(3)}</span></div>
                <div className="flex justify-between"><span>Points:</span> <span className="text-emerald-300 font-bold">{result.points.length} ranges</span></div>
              </div>
            </div>
          </motion.div>

          {/* Interactive Visualizer Navigation Tabs */}
          <div className="bg-[#050C17]/90 p-2 rounded-2xl border border-white/10 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('variancePlot')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'variancePlot' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Variance-Range Plot W(σ)
            </button>
            <button
              onClick={() => setActiveTab('reducedPlot')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'reducedPlot' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reduced Plot W/σ vs σ
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'generator' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Synthetic Profile Generator
            </button>
          </div>

          {/* Tab 1: Variance Plot */}
          {activeTab === 'variancePlot' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Variance W(σ) vs Integration Range σ
              </h4>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartVarianceData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="sigmaDeg" stroke="#94a3b8" label={{ value: 'Integration Range σ (deg)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                    <YAxis stroke="#94a3b8" label={{ value: 'Variance W (deg²)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1230', borderColor: 'rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" />
                    <Scatter name="Observed W(σ)" dataKey="varianceDeg2" fill="#6366f1" />
                    <Line type="monotone" name="Quadratic Fit" dataKey="fittedWDeg2" stroke="#a855f7" strokeWidth={2} dot={false} />
                    <Line type="monotone" name="Linear Component (Size)" dataKey="linearComponentDeg2" stroke="#38bdf8" strokeDasharray="5 5" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 2: Reduced Plot */}
          {activeTab === 'reducedPlot' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Reduced Variance W/σ vs σ (Langford-Wilson Plot)
              </h4>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartReducedData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="sigmaDeg" stroke="#94a3b8" label={{ value: 'Range σ (deg)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                    <YAxis stroke="#94a3b8" label={{ value: 'W/σ (deg)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1230', borderColor: 'rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" />
                    <Scatter name="Observed W/σ" dataKey="wOverSigmaObs" fill="#6366f1" />
                    <Line type="monotone" name="Fitted W/σ" dataKey="wOverSigmaFit" stroke="#a855f7" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 3: Synthetic Generator */}
          {activeTab === 'generator' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Synthetic Profile & Moment Simulator</h4>
                  <p className="text-xs text-slate-400">Synthesize pseudo-Voigt profiles and calculate statistical moments</p>
                </div>
                <button
                  onClick={handleLoadSyntheticToInput}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg"
                >
                  Load to Current Analysis
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Centroid 2θ₀</label>
                  <input
                    type="number"
                    step="0.1"
                    value={synthCentroid}
                    onChange={(e) => setSynthCentroid(parseFloat(e.target.value) || 38.2)}
                    className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">FWHM (deg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={synthFwhm}
                    onChange={(e) => setSynthFwhm(parseFloat(e.target.value) || 0.35)}
                    className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Mixing Factor η: {synthMixingEta.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={synthMixingEta}
                    onChange={(e) => setSynthMixingEta(parseFloat(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis & Python Code Exporter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <AIAnalysis
              methodName="Method of Moments (Variance-Range W)"
              resultData={{
                crystalliteSizeNm: result.sizeNm,
                rmsMicrostrainPercent: result.rmsStrain * 100,
                slopeK1: result.slopeK1,
                quadraticK2: result.quadraticK2,
                fitRSquared: result.rSquared,
                twoThetaCentroid: twoTheta0,
                wavelengthAngstrom: wavelength
              }}
            />
            <PythonCodeExporter
              methodName="Method of Moments (Variance-Range W)"
              customScript={`import numpy as np
from scipy.optimize import curve_fit

# Experimental Data (Range sigma [deg], Variance W [deg^2])
data = np.array([
${result.points.map(p => `    [${p.sigmaDeg}, ${p.varianceDeg2}],`).join('\n')}
])

sigma_deg, W_deg2 = data[:, 0], data[:, 1]
sigma_rad = np.radians(sigma_deg)
W_rad2 = W_deg2 * (np.pi / 180)**2

# Wilson Variance-Range Quadratic Model: W(sigma) = W0 + K1*sigma + K2*sigma^2
def wilson_model(sig, W0, K1, K2):
    return W0 + K1 * sig + K2 * (sig**2)

popt, pcov = curve_fit(wilson_model, sigma_rad, W_rad2)
W0, K1, K2 = popt

wavelength = ${wavelength} * 1e-10  # meters
two_theta_0 = np.radians(${twoTheta0})
theta_0 = two_theta_0 / 2.0

# Volume-Weighted Domain Size
D_V = wavelength / (np.pi**2 * K1 * np.cos(theta_0))  # meters
# RMS Microstrain
rms_strain = np.sqrt(K2) / (2.0 * np.tan(theta_0))

print(f"Volume-weighted size D_V: {D_V * 1e9:.2f} nm")
print(f"RMS microstrain: {rms_strain * 100:.4f} %")
`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
