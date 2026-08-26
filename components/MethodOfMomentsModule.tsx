import React, { useState, useEffect, useMemo } from 'react';
import { playSynthTone } from '../utils/sound';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseMomentInput, calculateMethodOfMoments, integrateRawPeakMoments, RawPeakMomentsResult } from '../utils/physics';
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
  Area,
  AreaChart
} from 'recharts';
import {
  Info,
  AlertTriangle,
  TrendingUp,
  Ruler,
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
  Check,
  FileText,
  Upload,
  ArrowRight,
  TrendingDown,
  Gauge,
  Sigma,
  Crosshair,
  Maximize,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';
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
    desc: 'Uniform fluorite CeO2 nanopowder exhibiting pure linear variance progression with zero microstrain curvature.'
  },
  {
    name: 'Nanocrystalline Ni (Size + Strain)',
    wavelength: 1.54056,
    twoTheta0: 44.51,
    data: "0.20, 0.00210, 0.000012\n0.35, 0.00395, 0.000038\n0.50, 0.00612, 0.000088\n0.65, 0.00862, 0.000168\n0.80, 0.01145, 0.000288\n0.95, 0.01460, 0.000455\n1.10, 0.01810, 0.000680\n1.25, 0.02192, 0.000970",
    desc: 'Severe plastic deformation nickel sample displaying noticeable quadratic curvature from lattice microstrain.'
  },
  {
    name: 'Ultrafine Anatase TiO2 (Nanopowder)',
    wavelength: 1.54056,
    twoTheta0: 25.28,
    data: "0.25, 0.00295, 0.000021\n0.40, 0.00485, 0.000055\n0.55, 0.00682, 0.000108\n0.70, 0.00886, 0.000182\n0.85, 0.01096, 0.000280\n1.00, 0.01314, 0.000405\n1.15, 0.01538, 0.000558",
    desc: 'High surface-area anatase nanocrystals evaluated by progressive integration ranges up to 1.15 degrees.'
  },
  {
    name: 'Cold-Worked Cu-Al Alloy (High Strain)',
    wavelength: 1.54056,
    twoTheta0: 43.30,
    data: "0.30, 0.00340, 0.000030\n0.50, 0.00650, 0.000100\n0.70, 0.01040, 0.000250\n0.90, 0.01510, 0.000510\n1.10, 0.02060, 0.000920\n1.30, 0.02690, 0.001530",
    desc: 'Dense dislocation networks driving dominant quadratic curvature in the variance-range plot.'
  },
  {
    name: 'Ball-Milled WC-Co (Cermet Hardmetal)',
    wavelength: 1.54056,
    twoTheta0: 35.64,
    data: "0.20, 0.00245, 0.000018\n0.35, 0.00460, 0.000062\n0.50, 0.00715, 0.000145\n0.65, 0.01010, 0.000275\n0.80, 0.01342, 0.000460\n0.95, 0.01710, 0.000710\n1.10, 0.02115, 0.001040",
    desc: 'Heavily milled refractory tungsten carbide exhibiting both nanoscale grain refinement and residual microstress.'
  },
  {
    name: 'Deformed 316L Stainless Steel (Stacking Faults)',
    wavelength: 1.54056,
    twoTheta0: 50.75,
    data: "0.25, 0.00280, 0.000028\n0.45, 0.00560, 0.000095\n0.65, 0.00890, 0.000220\n0.85, 0.01275, 0.000430\n1.05, 0.01715, 0.000740\n1.25, 0.02210, 0.001160",
    desc: 'Austenitic alloy featuring high 4th moment kurtosis and asymmetric line broadening from planar faults.'
  }
];

const RAW_SCAN_SAMPLE = `# 2Theta [deg], Intensity [counts]
27.50 120
27.60 125
27.70 132
27.80 145
27.90 170
28.00 230
28.10 360
28.20 620
28.30 1150
28.40 2100
28.50 3300
28.55 3520
28.60 3250
28.70 2050
28.80 1120
28.90 590
29.00 340
29.10 215
29.20 160
29.30 140
29.40 128
29.50 122
29.60 118`;

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
  const [burgersVectorNm, setBurgersVectorNm] = useState<number>(0.25);
  const [expSubTab, setExpSubTab] = useState<'wavelength' | 'instrument' | 'corrections'>('wavelength');

  // Input modes: 'table' (direct variance table) or 'rawProfile' (integrate raw scan) or 'synthetic'
  const [inputMode, setInputMode] = useState<'table' | 'rawProfile' | 'synthetic'>('table');
  const [inputData, setInputData] = useState<string>(MOMENT_PRESETS[0].data);
  const [rawScanText, setRawScanText] = useState<string>(RAW_SCAN_SAMPLE);
  const [activeResultTab, setActiveResultTab] = useState<'variancePlot' | 'reducedPlot' | 'momentsKurtosis' | 'rawInspector' | 'tableDetails'>('variancePlot');

  // Interactive slider for raw window inspection
  const [inspectSigma, setInspectSigma] = useState<number>(0.5);

  // Synthetic peak parameters for interactive profile moment calculator
  const [synthCentroid, setSynthCentroid] = useState<number>(38.2);
  const [synthFwhm, setSynthFwhm] = useState<number>(0.35);
  const [synthMixingEta, setSynthMixingEta] = useState<number>(0.5); // 0=Gaussian, 1=Lorentzian
  const [synthMicrostrain, setSynthMicrostrain] = useState<number>(0.002);

  const [result, setResult] = useState<MethodOfMomentsResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_moment_analysis_current');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [rawIntegrationResult, setRawIntegrationResult] = useState<RawPeakMomentsResult | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState<number>(-1);

  // Calculate raw integration when in raw profile mode
  useEffect(() => {
    if (inputMode === 'rawProfile') {
      const res = integrateRawPeakMoments(rawScanText, twoTheta0 > 0 ? twoTheta0 : undefined, 9);
      setRawIntegrationResult(res);
      if (res && res.twoThetaCentroid > 0) {
        setTwoTheta0(parseFloat(res.twoThetaCentroid.toFixed(2)));
      }
    }
  }, [rawScanText, inputMode]);

  // Recalculate Method of Moments whenever inputs change
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
          shapeK,
          burgersVectorNm
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
    shapeK,
    burgersVectorNm
  ]);

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 400);
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 800);
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('tick');
    }, 1200);
    setTimeout(() => {
      setComputingStep(4);
      playSynthTone('chime');
    }, 1600);
    setTimeout(() => {
      setAppState('results');
    }, 2000);
  };

  const handleApplyPreset = (preset: typeof MOMENT_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setTwoTheta0(preset.twoTheta0);
    setInputData(preset.data);
    setInputMode('table');
    playSynthTone('tick');
  };

  const handleTransferRawMoments = () => {
    if (!rawIntegrationResult) return;
    let text = "# Sigma_deg, Variance_deg2, mu3_rad3, mu4_rad4\n";
    rawIntegrationResult.momentPoints.forEach(p => {
      text += `${p.sigmaDeg.toFixed(3)}, ${p.varianceDeg2.toFixed(6)}, ${p.thirdMomentRad3?.toExponential(4) || '0.0'}, ${p.fourthMomentRad4?.toExponential(4) || '0.0'}\n`;
    });
    setInputData(text);
    setInputMode('table');
    playSynthTone('chime');
  };

  const handleCopyLaTeX = () => {
    if (!result) return;
    const latex = `\\begin{align*}
\\text{Wilson Variance-Range Relation: } W(\\sigma) &= W_0 + K_1 \\cdot \\sigma + K_2 \\cdot \\sigma^2 \\\\
\\text{Linear Slope } K_1 &= ${result.slopeK1.toExponential(4)} \\text{ rad} \\quad \\implies \\quad D_V = ${result.sizeNm.toFixed(2)} \\text{ nm} \\\\
\\text{Quadratic Curvature } K_2 &= ${result.quadraticK2.toExponential(4)} \\quad \\implies \\quad \\langle\\epsilon^2\\rangle^{1/2} = ${(result.rmsStrain * 100).toFixed(4)}\\% \\\\
\\text{Dislocation Density } \\rho &= ${result.dislocationDensity ? result.dislocationDensity.toExponential(3) : 'N/A'} \\text{ m}^{-2} \\\\
\\text{Regression Fit Quality } R^2 &= ${result.rSquared.toFixed(5)}
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    let csv = "Sigma_deg,Sigma_rad,Variance_deg2,Variance_rad2,Fitted_W_deg2,Residual_deg2,Linear_Size_Part_deg2,Quadratic_Strain_Part_deg2,Kurtosis,Excess_Kurtosis,Skewness\n";
    result.points.forEach((p, idx) => {
      const f = result.fittedPoints[idx];
      csv += `${p.sigmaDeg},${p.sigmaRad.toFixed(6)},${p.varianceDeg2.toFixed(6)},${p.varianceRad2.toFixed(8)},${f?.fittedWDeg2.toFixed(6) || ''},${f?.residualDeg2?.toFixed(6) || ''},${f?.linearComponentDeg2.toFixed(6) || ''},${f?.quadraticComponentDeg2.toFixed(6) || ''},${p.kurtosis ? p.kurtosis.toFixed(4) : ''},${p.excessKurtosis ? p.excessKurtosis.toFixed(4) : ''},${p.skewness ? p.skewness.toFixed(4) : ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Method_of_Moments_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate synthetic profile moments
  const syntheticMomentsData = useMemo(() => {
    const x0 = synthCentroid;
    const fwhm = synthFwhm;
    const eta = synthMixingEta;
    const strain = synthMicrostrain;
    const step = 0.005;
    const maxSpan = 1.6;
    const numPoints = Math.floor((2 * maxSpan) / step);

    const grid: { x: number; intensity: number }[] = [];
    const sigmaG = Math.max(0.01, fwhm / (2 * Math.sqrt(2 * Math.log(2))));
    const gammaL = Math.max(0.01, fwhm / 2);

    for (let i = 0; i <= numPoints; i++) {
      const x = x0 - maxSpan + i * step;
      const dx = x - x0;
      const g = Math.exp(-(dx * dx) / (2 * sigmaG * sigmaG)) / (sigmaG * Math.sqrt(2 * Math.PI));
      const l = (1 / Math.PI) * (gammaL / (dx * dx + gammaL * gammaL));
      const pv = eta * l + (1 - eta) * g;
      grid.push({ x, intensity: pv });
    }

    const sigmaList = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.05, 1.15, 1.25];
    const DEG_TO_RAD = Math.PI / 180;

    return sigmaList.map(sig => {
      let m0 = 0;
      let m2 = 0;
      let m3 = 0;
      let m4 = 0;

      for (const pt of grid) {
        if (Math.abs(pt.x - x0) <= sig) {
          const dxRad = (pt.x - x0) * DEG_TO_RAD;
          m0 += pt.intensity * step;
          m2 += (dxRad * dxRad) * pt.intensity * step;
          m3 += Math.pow(dxRad, 3) * pt.intensity * step;
          m4 += Math.pow(dxRad, 4) * pt.intensity * step;
        }
      }

      // Add synthetic microstrain curvature
      const strainVarianceAddition = 4 * (strain * strain) * Math.pow(Math.tan((x0 / 2) * DEG_TO_RAD), 2) * (sig * DEG_TO_RAD) * (sig * DEG_TO_RAD);
      const wRad2 = m0 > 0 ? (m2 / m0) + strainVarianceAddition : 0;
      const mu4Rad4 = m0 > 0 ? (m4 / m0) + 3 * strainVarianceAddition * strainVarianceAddition : 0;
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
  }, [synthCentroid, synthFwhm, synthMixingEta, synthMicrostrain]);

  const handleLoadSyntheticToInput = () => {
    let text = "# Synthetic Moment Profile\n";
    syntheticMomentsData.forEach(p => {
      text += `${p.sigmaDeg.toFixed(2)}, ${p.varianceDeg2.toFixed(6)}, ${p.fourthMomentRad4?.toExponential(4)}\n`;
    });
    setTwoTheta0(synthCentroid);
    setInputData(text);
    setInputMode('table');
    playSynthTone('chime');
  };

  // Chart data for Variance Parabola
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
        residualDeg2: f?.residualDeg2,
        kurtosis: p.kurtosis
      };
    });
  }, [result]);

  // Chart data for Reduced Variance W/sigma vs sigma
  const chartReducedData = useMemo(() => {
    if (!result) return [];
    return result.points.map((p, idx) => {
      const f = result.fittedPoints[idx];
      const wOverSigmaObs = p.varianceDeg2 / p.sigmaDeg;
      const wOverSigmaFit = f ? f.fittedWDeg2 / p.sigmaDeg : 0;
      const linearSlopeIntercept = (result.interceptW0 / (p.sigmaRad || 1e-6) + result.slopeK1) * (180 / Math.PI);
      return {
        sigmaDeg: p.sigmaDeg,
        wOverSigmaObs,
        wOverSigmaFit,
        linearSlopeIntercept
      };
    });
  }, [result]);

  // Chart data for Kurtosis & Higher Moments Evolution
  const chartKurtosisData = useMemo(() => {
    if (!result) return [];
    return result.points.map(p => ({
      sigmaDeg: p.sigmaDeg,
      kurtosis: p.kurtosis || 3.0,
      excessKurtosis: p.excessKurtosis || 0.0,
      skewness: p.skewness || 0.0,
      fourthMomentRad4: p.fourthMomentRad4 ? p.fourthMomentRad4 * 1e6 : 0
    }));
  }, [result]);

  const momentsWalkthroughSteps: WizardStep[] = [
    {
      title: 'Progressive Integration Range (σ = Δ2θ)',
      subtitle: 'Truncation Limits Around Peak Centroid 2θ₀',
      explanation: 'Calculates the profile variance W(σ) = μ₂ of the diffraction line as a function of the integration truncation range σ = |2θ - 2θ₀|. Broad tails carry crucial information regarding crystallite size and lattice microstrain.',
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
      title: 'Kurtosis & Statistical Tail Decay',
      subtitle: 'Leptokurtic (> 3) vs. Platykurtic (< 3) Peak Tails',
      explanation: 'Evaluates the 4th moment μ₄ to determine peak sharpness and tail decay. Lorentzian/Cauchy profiles exhibit heavy tails (leptokurtic, Kurtosis > 3), while Gaussian profiles exhibit light tails (kurtosis = 3).',
      tip: 'High kurtosis (> 4) indicates a strong Lorentzian character typically associated with small crystallite dimensions and planar stacking faults.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Method of Moments & Variance-Range Parabolic Analysis"
        description="Master Wilson-Langford variance progression, linear size separation (K₁), quadratic microstrain curvature (K₂), and dislocation density."
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
          statement={`Sample yields volume-weighted crystallite size D_V = ${convertLength(result.sizeNm * 10, lengthUnit).toFixed(1)} ${lengthUnit} (area-weighted ⟨L⟩_A ≈ ${convertLength(result.areaWeightedSizeNm! * 10, lengthUnit).toFixed(1)} ${lengthUnit}) with an RMS microstrain ⟨ε²⟩¹/² of ${(result.rmsStrain * 100).toFixed(3)}%.`}
          contextNote={`Linear size slope K₁ = ${result.slopeK1.toExponential(3)} rad; Quadratic strain curvature K₂ = ${result.quadraticK2.toExponential(3)}. Dislocation density estimated at ρ ≈ ${result.dislocationDensity?.toExponential(2) || '0.0'} m⁻² (R² = ${result.rSquared.toFixed(4)}, Quality Score = ${result.qualityScore}/100).`}
          metrics={[
            { label: 'D_V Volume Size', value: convertLength(result.sizeNm * 10, lengthUnit).toFixed(1), unit: lengthUnit },
            { label: '⟨L⟩_A Area Size', value: convertLength(result.areaWeightedSizeNm! * 10, lengthUnit).toFixed(1), unit: lengthUnit },
            { label: 'RMS Microstrain', value: (result.rmsStrain * 100).toFixed(3), unit: '%' },
            { label: 'Dislocation Density', value: result.dislocationDensity ? result.dislocationDensity.toExponential(2) : '0.0', unit: 'm⁻²' }
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
                Wilson-Langford Variance Parabola
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
              Separates crystallite size and microstrain by analyzing profile variance <span className="font-mono text-indigo-300">W</span> and kurtosis <span className="font-mono text-indigo-300">μ₄</span> across progressive integration limits <span className="font-mono text-indigo-300">σ</span>. The linear slope yields reciprocal domain size <span className="font-mono text-indigo-300">(1/D_V)</span>, while quadratic curvature gives mean-square strain <span className="font-mono text-indigo-300">⟨ε²⟩</span> and dislocation density.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative z-20">
            {appState === 'results' && (
              <button
                onClick={() => setAppState('setup')}
                className="px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 rounded-2xl text-xs font-bold font-mono transition-all flex items-center gap-2 shadow-lg active:scale-95"
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
              title={p.desc}
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover/btn:text-indigo-300 group-hover/btn:animate-pulse" />
              <span>{p.name.split(' (')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. SETUP STATE VIEW */}
      {appState === 'setup' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-[#050C17]/90 rounded-2xl border border-white/10 gap-2">
            <button
              onClick={() => setInputMode('table')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'table'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-200 border border-indigo-500/50 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Variance-Range Table (σ, W, μ₄)</span>
            </button>
            <button
              onClick={() => setInputMode('rawProfile')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'rawProfile'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-200 border border-indigo-500/50 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Raw 2θ vs Intensity Profile Integrator</span>
            </button>
            <button
              onClick={() => setInputMode('synthetic')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'synthetic'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-200 border border-indigo-500/50 shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Synthetic Peak & Moment Simulator</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Experimental Geometry & Physics Parameters */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-5 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experimental Physics</h3>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 shadow-inner">
                    Wilson Form
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
                    <Activity className="w-3 h-3" />
                    Instrument
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
                    Microstructure
                  </button>
                </div>

                {/* Sub-tab 1: Radiation */}
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
                          Instrumental Standard FWHM [degrees 2θ]
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

                {/* Sub-tab 3: Corrections & Microstructure parameters */}
                {expSubTab === 'corrections' && (
                  <div className="space-y-4 relative z-10">
                    <div className="group/input">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Burgers Vector Magnitude (b) [nm]
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={burgersVectorNm}
                        onChange={(e) => setBurgersVectorNm(parseFloat(e.target.value) || 0.25)}
                        className="w-full px-3 py-2 bg-black/40 text-white border border-white/10 rounded-xl text-xs font-mono outline-none focus:border-indigo-500/50 shadow-inner"
                        placeholder="0.25 nm (for Dislocation Density ρ)"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">Used to calculate Dislocation Density ρ = 2√3 ⟨ε²⟩½ / (D_V · b)</span>
                    </div>

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

            {/* Right Column: Input Interface according to active inputMode */}
            <div className="lg:col-span-7 space-y-6">
              {inputMode === 'table' && (
                <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Variance-Range Dataset Matrix</h3>
                    </div>
                    <button
                      onClick={() => setInputData('')}
                      className="text-[10px] text-slate-400 hover:text-rose-400 font-mono transition-colors"
                    >
                      Clear Data
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Format: <code>Range_σ [deg], Variance_W [deg²], μ₃ [rad³] (opt), μ₄ [rad⁴] (opt)</code></span>
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
                    <span className="text-slate-400">Parsed range cuts: <strong className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{result?.points?.length || 0}</strong></span>
                    {result && result.points.length >= 3 ? (
                      <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Ready for Wilson-Langford Regression
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" /> Minimum 3 range points required
                      </span>
                    )}
                  </div>
                </div>
              )}

              {inputMode === 'rawProfile' && (
                <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-purple-500/30 transition-all duration-500 relative overflow-hidden group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Raw Peak Profile Scan & Integrator</h3>
                    </div>
                    {rawIntegrationResult && (
                      <button
                        onClick={handleTransferRawMoments}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-md transition-all flex items-center gap-1"
                      >
                        <span>Transfer {rawIntegrationResult.momentPoints.length} Moments to Analysis</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">Paste Raw 2θ vs Intensity Scan:</label>
                      <textarea
                        rows={7}
                        value={rawScanText}
                        onChange={(e) => setRawScanText(e.target.value)}
                        className="w-full p-3 bg-black/60 text-purple-300 font-mono text-xs border border-white/10 rounded-xl outline-none focus:border-purple-500/50 custom-scrollbar shadow-inner"
                      />
                    </div>

                    {rawIntegrationResult && (
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                        <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Profile Characterization:</div>
                        <div className="flex justify-between"><span>Auto Centroid 2θ₀:</span> <span className="text-white font-bold">{rawIntegrationResult.twoThetaCentroid.toFixed(3)}°</span></div>
                        <div className="flex justify-between"><span>Observed FWHM:</span> <span className="text-indigo-300 font-bold">{rawIntegrationResult.fwhm.toFixed(3)}°</span></div>
                        <div className="flex justify-between"><span>Integral Breadth β_I:</span> <span className="text-purple-300 font-bold">{rawIntegrationResult.integralBreadthDeg.toFixed(3)}°</span></div>
                        <div className="flex justify-between"><span>Shape Factor 2FWHM/β_I:</span> <span className="text-emerald-300 font-bold">{rawIntegrationResult.shapeFactorPhi.toFixed(3)}</span></div>
                        <div className="flex justify-between"><span>Lorentzian Fraction η:</span> <span className="text-amber-300 font-bold">{(rawIntegrationResult.lorentzianFractionEta * 100).toFixed(1)}%</span></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inputMode === 'synthetic' && (
                <div className="bg-[#080E1A]/90 p-5 rounded-3xl border border-white/10 shadow-xl space-y-4 hover:border-emerald-500/30 transition-all duration-500">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Synthetic Profile & Moment Simulator</h3>
                    </div>
                    <button
                      onClick={handleLoadSyntheticToInput}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold shadow-md transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use in Method of Moments</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Centroid 2θ₀ ({synthCentroid}°)</label>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="0.1"
                        value={synthCentroid}
                        onChange={(e) => setSynthCentroid(parseFloat(e.target.value))}
                        className="w-full accent-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">FWHM (Size Broadening: {synthFwhm}°)</label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.2"
                        step="0.01"
                        value={synthFwhm}
                        onChange={(e) => setSynthFwhm(parseFloat(e.target.value))}
                        className="w-full accent-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Voigt Mixing η ({synthMixingEta.toFixed(2)} - {synthMixingEta > 0.6 ? 'Lorentzian' : 'Gaussian'})</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={synthMixingEta}
                        onChange={(e) => setSynthMixingEta(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Lattice Microstrain ({(synthMicrostrain * 100).toFixed(3)}%)</label>
                      <input
                        type="range"
                        min="0"
                        max="0.01"
                        step="0.0005"
                        value={synthMicrostrain}
                        onChange={(e) => setSynthMicrostrain(parseFloat(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Methodology Guide */}
              <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-indigo-500/20 shadow-[0_8px_30px_rgba(99,102,241,0.05)] space-y-3 hover:border-indigo-500/40 transition-colors duration-500 relative overflow-hidden group">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 relative z-10">
                  <Info className="w-4 h-4" />
                  Wilson-Langford Variance-Range Formula
                </h4>
                <div 
                  className="text-white text-xs sm:text-sm py-3 px-3 bg-black/60 rounded-xl border border-white/10 font-mono overflow-x-auto text-center shadow-inner relative z-10"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(
                      'W(\\sigma) = W_0 + \\frac{\\lambda \\sigma}{\\pi^2 D_V \\cos\\theta_0} + 4 \\langle\\epsilon^2\\rangle \\tan^2\\theta_0 \\cdot \\sigma^2',
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
                  Ready for Method of Moments Regression
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  {result?.points?.length || 0} Range Points Configured | Peak Centroid 2θ₀ = {twoTheta0}° | λ = {wavelength} Å
                </p>
              </div>
            </div>

            <button
              onClick={startComputation}
              disabled={!result || result.points.length < 3}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-2.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Calculator className="w-5 h-5" />
              <span>Execute Wilson-Langford Moments Analysis</span>
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
                Deconvolving volume size D_V, area size ⟨L⟩_A & RMS microstrain ⟨ε²⟩½...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-400 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 3 ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300 shadow-md' : 'bg-black/40 border-white/5 text-slate-500'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">4</span>
                Evaluating Dislocation Density ρ & statistical moment kurtosis...
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
              title="Wilson-Langford Variance-Range Analysis"
              formula="W(\\sigma) = W_0 + \\frac{\\lambda \\sigma}{\\pi^2 D_V \\cos\\theta_0} + 4 \\langle\\epsilon^2\\rangle \\tan^2\\theta_0 \\cdot \\sigma^2"
              description="Separates crystallite domain size and microstrain by evaluating profile variance across progressive integration cutoffs σ. Linear slope gives domain size, quadratic curvature gives microstrain distortion."
              variables={[
                { symbol: 'D_V', name: 'Volume-Weighted Size', value: convertLength(result.sizeNm * 10, lengthUnit), unit: lengthUnit },
                { symbol: '⟨L⟩_A', name: 'Area-Weighted Size', value: convertLength((result.areaWeightedSizeNm || 0) * 10, lengthUnit), unit: lengthUnit },
                { symbol: '⟨ε²⟩', name: 'Mean-Square Strain', value: (result.rmsStrain * result.rmsStrain) * 10000, unit: 'x10⁻⁴' },
                { symbol: 'K_1', name: 'Linear Slope (Size)', value: result.slopeK1, unit: 'rad' },
                { symbol: 'K_2', name: 'Curvature (Strain)', value: result.quadraticK2, unit: '' }
              ]}
              result={convertLength(result.sizeNm * 10, lengthUnit)}
              resultUnit={lengthUnit}
              resultName="D_V (Volume Size)"
            />
          </motion.div>

          {/* Primary Microstructural Metric Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* 1. Volume-Weighted Crystallite Size D_V */}
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
                <div className="flex justify-between"><span>Length in Å:</span> <span className="text-slate-200 font-bold">{(result.sizeNm * 10).toFixed(1)} Å</span></div>
                <div className="flex justify-between"><span>Area Size ⟨L⟩_A:</span> <span className="text-indigo-300 font-bold">{result.areaWeightedSizeNm?.toFixed(2)} nm</span></div>
                <div className="flex justify-between"><span>Linear Slope K₁:</span> <span className="text-slate-300 font-bold">{result.slopeK1.toExponential(3)} rad</span></div>
              </div>
            </div>

            {/* 2. RMS Microstrain */}
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
                <div className="flex justify-between"><span>Intercept W₀:</span> <span className="text-slate-300 font-bold">{result.interceptW0.toExponential(3)} rad²</span></div>
              </div>
            </div>

            {/* 3. Dislocation Density */}
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-amber-500/30 shadow-[0_8px_30px_rgba(245,158,11,0.1)] relative overflow-hidden group hover:border-amber-400/60 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Grid className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Dislocation Density</span>
                </div>
                <Zap className="w-4 h-4 text-amber-400/50" />
              </div>
              <div className="flex items-baseline gap-2 mt-1 relative z-10">
                <span className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-amber-300 font-mono tracking-tight">
                  {result.dislocationDensity ? result.dislocationDensity.toExponential(2) : '0.0'}
                </span>
                <span className="text-amber-300 text-xs font-mono font-semibold">m⁻²</span>
              </div>
              <div className="mt-4 pt-3 border-amber-500/20 space-y-1 text-[11px] font-mono text-slate-400 border-t">
                <div className="flex justify-between"><span>In cm⁻²:</span> <span className="text-slate-200 font-bold">{result.dislocationDensity ? (result.dislocationDensity * 1e-4).toExponential(2) : '0.0'} cm⁻²</span></div>
                <div className="flex justify-between"><span>Burgers vector b:</span> <span className="text-amber-300 font-bold">{result.burgersVectorNm || 0.25} nm</span></div>
                <div className="flex justify-between"><span>Kurtosis β₂:</span> <span className="text-slate-300 font-bold">{result.meanKurtosis.toFixed(2)}</span></div>
              </div>
            </div>

            {/* 4. Fit Quality & Regression Score */}
            <div className="bg-[#050C17]/90 p-5 rounded-3xl border border-emerald-500/30 shadow-[0_8px_30px_rgba(16,185,129,0.1)] relative overflow-hidden group hover:border-emerald-400/60 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Quality Score (R²)</span>
                </div>
                <Gauge className="w-4 h-4 text-emerald-400/50" />
              </div>
              <div className="flex items-baseline gap-2 mt-1 relative z-10">
                <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-emerald-300 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  {result.qualityScore || 95}
                </span>
                <span className="text-emerald-300 text-sm font-mono font-semibold">/100</span>
              </div>
              <div className="mt-4 pt-3 border-emerald-500/20 space-y-1 text-[11px] font-mono text-slate-400 border-t">
                <div className="flex justify-between"><span>Fit R²:</span> <span className="text-slate-200 font-bold">{result.rSquared.toFixed(5)}</span></div>
                <div className="flex justify-between"><span>Points:</span> <span className="text-emerald-300 font-bold">{result.points.length} ranges</span></div>
                <div className="flex justify-between"><span>Profile Shape:</span> <span className="text-slate-300 font-bold">{result.meanKurtosis > 3.5 ? 'Leptokurtic' : 'Gaussian'}</span></div>
              </div>
            </div>
          </motion.div>

          {/* Interactive Visualizer Navigation Tabs */}
          <div className="bg-[#050C17]/90 p-2 rounded-2xl border border-white/10 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveResultTab('variancePlot')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeResultTab === 'variancePlot' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Variance-Range Parabola W(σ)</span>
            </button>
            <button
              onClick={() => setActiveResultTab('reducedPlot')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeResultTab === 'reducedPlot' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Reduced Plot W/σ vs σ</span>
            </button>
            <button
              onClick={() => setActiveResultTab('momentsKurtosis')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeResultTab === 'momentsKurtosis' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Moments & Kurtosis Hierarchy</span>
            </button>
            <button
              onClick={() => setActiveResultTab('rawInspector')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeResultTab === 'rawInspector' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Integration Range Window Inspector</span>
            </button>
            <button
              onClick={() => setActiveResultTab('tableDetails')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeResultTab === 'tableDetails' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-inner' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data Matrix & Residuals</span>
            </button>
          </div>

          {/* Tab 1: Variance Parabola W(sigma) vs sigma */}
          {activeResultTab === 'variancePlot' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Wilson Variance-Range Parabola: W(σ) = W₀ + K₁σ + K₂σ²</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Linear slope yields domain size D_V = {result.sizeNm.toFixed(2)} nm | Quadratic curvature yields ⟨ε²⟩½ = {(result.rmsStrain * 100).toFixed(3)}%
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Observed</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Quadratic Fit</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Linear Size</span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartVarianceData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="sigmaDeg" stroke="#94a3b8" label={{ value: 'Integration Cutoff Range σ (deg 2θ)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                    <YAxis stroke="#94a3b8" label={{ value: 'Profile Variance W (deg²)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1230', borderColor: 'rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" />
                    <Scatter name="Observed Variance W(σ)" dataKey="varianceDeg2" fill="#6366f1" />
                    <Line type="monotone" name="Quadratic Fit W(σ)" dataKey="fittedWDeg2" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Linear Size Component" dataKey="linearComponentDeg2" stroke="#38bdf8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" name="Quadratic Strain Component" dataKey="quadraticComponentDeg2" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 2: Langford Reduced Variance Plot */}
          {activeResultTab === 'reducedPlot' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Langford Reduced Variance Plot: W(σ)/σ vs σ</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Linearized form: W/σ = K₁ + K₂·σ. Intercept gives size factor K₁, slope gives microstrain K₂.
                  </p>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartReducedData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="sigmaDeg" stroke="#94a3b8" label={{ value: 'Range σ (deg)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                    <YAxis stroke="#94a3b8" label={{ value: 'Reduced Variance W/σ (deg)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1230', borderColor: 'rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" />
                    <Scatter name="Observed W/σ" dataKey="wOverSigmaObs" fill="#6366f1" />
                    <Line type="monotone" name="Fitted W/σ" dataKey="wOverSigmaFit" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 3: Moments & Kurtosis Hierarchy */}
          {activeResultTab === 'momentsKurtosis' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Kurtosis (β₂ = μ₄ / W²) & 4th Statistical Moment Evolution</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Average Kurtosis = {result.meanKurtosis.toFixed(2)} | Gaussian Benchmark = 3.0 (Leptokurtic tails indicate Cauchy/Lorentzian character)
                  </p>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartKurtosisData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="sigmaDeg" stroke="#94a3b8" label={{ value: 'Integration Range σ (deg)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                    <YAxis stroke="#94a3b8" label={{ value: 'Kurtosis (μ₄ / W²)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1230', borderColor: 'rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" />
                    <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Gaussian β₂ = 3', fill: '#ef4444', position: 'insideTopRight' }} />
                    <Line type="monotone" name="Kurtosis β₂" dataKey="kurtosis" stroke="#10b981" strokeWidth={2.5} dot />
                    <Line type="monotone" name="Excess Kurtosis γ₂" dataKey="excessKurtosis" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 4: Raw Window Inspector */}
          {activeResultTab === 'rawInspector' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-sky-400" />
                    <span>Dynamic Integration Window [2θ₀ - σ, 2θ₀ + σ]</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Explore how expanding truncation range σ progressively incorporates the asymptotic tail decay.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                  <span className="text-xs font-mono text-slate-300">Active σ Window:</span>
                  <span className="text-sm font-mono font-bold text-sky-400">±{inspectSigma.toFixed(2)}°</span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={inspectSigma}
                  onChange={(e) => setInspectSigma(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>σ = 0.10° (Peak Core)</span>
                  <span>σ = 0.75° (Intermediate Tail)</span>
                  <span>σ = 1.50° (Deep Background)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black/50 rounded-2xl border border-white/5 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Integration Bounds:</span>
                  <span className="text-sky-300 font-bold">{(twoTheta0 - inspectSigma).toFixed(2)}° → {(twoTheta0 + inspectSigma).toFixed(2)}°</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Estimated Variance W(σ):</span>
                  <span className="text-indigo-300 font-bold">
                    {(result.interceptW0 + result.slopeK1 * (inspectSigma * Math.PI / 180) + result.quadraticK2 * Math.pow(inspectSigma * Math.PI / 180, 2)).toExponential(3)} rad²
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Asymptotic Tail Law:</span>
                  <span className="text-emerald-300 font-bold">~ 1 / (Δ2θ)² decay</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Data Matrix & Residuals */}
          {activeResultTab === 'tableDetails' && (
            <div className="bg-[#080E1A]/90 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Variance-Range Regression Matrix & Residuals</span>
                </h4>
                <button
                  onClick={handleDownloadCSV}
                  className="px-3 py-1.5 bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 bg-black/40">
                      <th className="p-3">σ (deg)</th>
                      <th className="p-3">σ (rad)</th>
                      <th className="p-3">Obs W (deg²)</th>
                      <th className="p-3">Fit W (deg²)</th>
                      <th className="p-3">Residual (deg²)</th>
                      <th className="p-3">Linear Part</th>
                      <th className="p-3">Quadratic Part</th>
                      <th className="p-3">Kurtosis β₂</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {result.points.map((p, idx) => {
                      const f = result.fittedPoints[idx];
                      return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-bold text-indigo-300">{p.sigmaDeg.toFixed(2)}</td>
                          <td className="p-3 text-slate-400">{p.sigmaRad.toFixed(5)}</td>
                          <td className="p-3 text-purple-300 font-bold">{p.varianceDeg2.toFixed(6)}</td>
                          <td className="p-3 text-emerald-300">{f?.fittedWDeg2.toFixed(6)}</td>
                          <td className="p-3 text-amber-300">{f?.residualDeg2 ? f.residualDeg2.toExponential(2) : '0.0'}</td>
                          <td className="p-3 text-sky-300">{f?.linearComponentDeg2.toFixed(6)}</td>
                          <td className="p-3 text-amber-300">{f?.quadraticComponentDeg2.toFixed(6)}</td>
                          <td className="p-3 text-slate-400">{p.kurtosis ? p.kurtosis.toFixed(2) : '3.0'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Analysis & Python Code Exporter */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <AIAnalysis
              methodName="Method of Moments (Wilson-Langford Variance Parabola)"
              resultData={{
                crystalliteSizeNm: result.sizeNm,
                areaWeightedSizeNm: result.areaWeightedSizeNm,
                rmsMicrostrainPercent: result.rmsStrain * 100,
                dislocationDensityM2: result.dislocationDensity,
                slopeK1: result.slopeK1,
                quadraticK2: result.quadraticK2,
                interceptW0: result.interceptW0,
                meanKurtosis: result.meanKurtosis,
                fitRSquared: result.rSquared,
                qualityScore: result.qualityScore,
                twoThetaCentroid: twoTheta0,
                wavelengthAngstrom: wavelength,
                shapeMultiplierK: shapeK,
                burgersVectorNm: burgersVectorNm
              }}
            />
            <PythonCodeExporter
              methodName="Method of Moments (Wilson-Langford Variance-Range Analysis)"
              customScript={`import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

# 1. Experimental Range Cutoff & Variance Data
# Format: Range sigma [deg], Variance W [deg^2]
data = np.array([
${result.points.map(p => `    [${p.sigmaDeg}, ${p.varianceDeg2}],`).join('\n')}
])

sigma_deg, W_deg2 = data[:, 0], data[:, 1]
sigma_rad = np.radians(sigma_deg)
W_rad2 = W_deg2 * (np.pi / 180.0)**2

# 2. Wilson-Langford Variance-Range Model: W(sigma) = W0 + K1*sigma + K2*sigma^2
def wilson_variance_model(sig, W0, K1, K2):
    return W0 + K1 * sig + K2 * (sig**2)

popt, pcov = curve_fit(wilson_variance_model, sigma_rad, W_rad2)
W0_fit, K1_fit, K2_fit = popt

# Physical Constants & Parameters
wavelength = ${wavelength} * 1e-10  # meters
two_theta_0 = np.radians(${twoTheta0})
theta_0 = two_theta_0 / 2.0
cos_theta = np.cos(theta_0)
tan_theta = np.tan(theta_0)
shape_K = ${shapeK}
burgers_vector = ${burgersVectorNm} * 1e-9  # meters

# 3. Deconvolving Microstructural Parameters
# Volume-Weighted Domain Size D_V
D_V = (shape_K * wavelength) / (np.pi**2 * K1_fit * cos_theta)  # meters
# Area-Weighted Domain Size <L>_A
L_A = D_V / 2.0  # meters
# RMS Microstrain <epsilon^2>^(1/2)
rms_strain = np.sqrt(max(0, K2_fit)) / (2.0 * tan_theta)
# Dislocation Density rho
rho = (2.0 * np.sqrt(3.0) * rms_strain) / (D_V * burgers_vector)

print("="*60)
print("METHOD OF MOMENTS (WILSON-LANGFORD) XRD ANALYSIS")
print("="*60)
print(f"Volume-Weighted Size (D_V):       {D_V * 1e9:.2f} nm")
print(f"Area-Weighted Size (<L>_A):       {L_A * 1e9:.2f} nm")
print(f"RMS Microstrain (<e^2>^0.5):      {rms_strain * 100:.4f} %")
print(f"Dislocation Density (rho):        {rho:.3e} m^-2")
print(f"Linear Size Factor (K1):          {K1_fit:.4e} rad")
print(f"Quadratic Strain Factor (K2):     {K2_fit:.4e}")
print("="*60)

# 4. Publication-Ready Plot
sig_fine = np.linspace(sigma_rad.min(), sigma_rad.max(), 200)
W_fit_fine = wilson_variance_model(sig_fine, W0_fit, K1_fit, K2_fit)
W_linear_fine = W0_fit + K1_fit * sig_fine

plt.figure(figsize=(7, 5), dpi=300)
plt.plot(np.degrees(sigma_rad), np.degrees(np.degrees(W_rad2)), 'o', color='#4f46e5', label='Observed Variance $W(\\sigma)$')
plt.plot(np.degrees(sig_fine), np.degrees(np.degrees(W_fit_fine)), '-', color='#9333ea', lw=2, label='Quadratic Fit ($W_0 + K_1\\sigma + K_2\\sigma^2$)')
plt.plot(np.degrees(sig_fine), np.degrees(np.degrees(W_linear_fine)), '--', color='#0284c7', label='Linear Size Component ($K_1\\sigma$)')
plt.xlabel('Integration Range $\\sigma = \\Delta(2\\theta)$ [deg]', fontsize=11)
plt.ylabel('Profile Variance $W(\\sigma)$ [deg$^2$]', fontsize=11)
plt.title(f'Method of Moments ($D_V={D_V * 1e9:.1f}$ nm, $\\langle\\epsilon^2\\rangle^{{1/2}}={rms_strain * 100:.3f}\\%$)', fontsize=12)
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(frameon=True)
plt.tight_layout()
plt.show()
`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
