import React, { useState, useEffect, useMemo } from 'react';
import { playSynthTone } from '../utils/sound';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseMomentInput, calculateMethodOfMoments, integrateRawPeakMoments, RawPeakMomentsResult } from '../utils/physics';
import { MethodOfMomentsResult } from '../types';
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
  Area
} from 'recharts';
import {
  Info,
  TrendingUp,
  Ruler,
  Atom,
  Download,
  Database,
  FlaskConical,
  Activity,
  CheckCircle,
  Copy,
  Sparkles,
  Sliders,
  Zap,
  Check,
  ArrowRight,
  Gauge,
  Crosshair,
  Grid
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { AIAnalysis } from './AIAnalysis';
import { PythonCodeExporter } from './PythonCodeExporter';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';
import { VarianceRangeDatasetMatrix } from './moments/VarianceRangeDatasetMatrix';
import { MomentsCadSchematic } from './moments/MomentsCadSchematic';

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
    formula: 'CeO₂',
    name: 'CeO2 Nanocrystals (Pure Size)',
    tag: 'SRM 674b • K₂ ≈ 0',
    wavelength: 1.54056,
    twoTheta0: 28.55,
    data: "0.20, 0.00182, 0.000009\n0.30, 0.00285, 0.000022\n0.40, 0.00392, 0.000041\n0.50, 0.00498, 0.000067\n0.60, 0.00605, 0.000099\n0.70, 0.00714, 0.000139\n0.80, 0.00822, 0.000185\n0.90, 0.00931, 0.000238\n1.00, 0.01041, 0.000299",
    desc: 'Uniform fluorite CeO2 nanopowder exhibiting pure linear variance progression with zero microstrain curvature.'
  },
  {
    formula: 'Ni',
    name: 'Nanocrystalline Ni (Size + Strain)',
    tag: 'SPD FCC • High K₂',
    wavelength: 1.54056,
    twoTheta0: 44.51,
    data: "0.20, 0.00210, 0.000012\n0.35, 0.00395, 0.000038\n0.50, 0.00612, 0.000088\n0.65, 0.00862, 0.000168\n0.80, 0.01145, 0.000288\n0.95, 0.01460, 0.000455\n1.10, 0.01810, 0.000680\n1.25, 0.02192, 0.000970",
    desc: 'Severe plastic deformation nickel sample displaying noticeable quadratic curvature from lattice microstrain.'
  },
  {
    formula: 'TiO₂',
    name: 'Ultrafine Anatase TiO2 (Nanopowder)',
    tag: '14 nm • High K₁',
    wavelength: 1.54056,
    twoTheta0: 25.28,
    data: "0.25, 0.00295, 0.000021\n0.40, 0.00485, 0.000055\n0.55, 0.00682, 0.000108\n0.70, 0.00886, 0.000182\n0.85, 0.01096, 0.000280\n1.00, 0.01314, 0.000405\n1.15, 0.01538, 0.000558",
    desc: 'High surface-area anatase nanocrystals evaluated by progressive integration ranges up to 1.15 degrees.'
  },
  {
    formula: 'Cu–Al',
    name: 'Cold-Worked Cu-Al Alloy (High Strain)',
    tag: 'Dislocation Forest',
    wavelength: 1.54056,
    twoTheta0: 43.30,
    data: "0.30, 0.00340, 0.000030\n0.50, 0.00650, 0.000100\n0.70, 0.01040, 0.000250\n0.90, 0.01510, 0.000510\n1.10, 0.02060, 0.000920\n1.30, 0.02690, 0.001530",
    desc: 'Dense dislocation networks driving dominant quadratic curvature in the variance-range plot.'
  },
  {
    formula: 'WC–Co',
    name: 'Ball-Milled WC-Co (Cermet Hardmetal)',
    tag: 'Milled Cermet',
    wavelength: 1.54056,
    twoTheta0: 35.64,
    data: "0.20, 0.00245, 0.000018\n0.35, 0.00460, 0.000062\n0.50, 0.00715, 0.000145\n0.65, 0.01010, 0.000275\n0.80, 0.01342, 0.000460\n0.95, 0.01710, 0.000710\n1.10, 0.02115, 0.001040",
    desc: 'Heavily milled refractory tungsten carbide exhibiting both nanoscale grain refinement and residual microstress.'
  },
  {
    formula: '316L',
    name: 'Deformed 316L Stainless Steel (Stacking Faults)',
    tag: 'Leptokurtic β₂ > 4',
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
  const [selectedPresetName, setSelectedPresetName] = useState<string>(MOMENT_PRESETS[0].name);
  const [rawScanText, setRawScanText] = useState<string>(RAW_SCAN_SAMPLE);
  const [activeResultTab, setActiveResultTab] = useState<'variancePlot' | 'reducedPlot' | 'momentsKurtosis' | 'rawInspector' | 'tableDetails'>('variancePlot');

  // Interactive slider for raw window inspection
  const [inspectSigma, setInspectSigma] = useState<number>(0.65);

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

  // Memoized KaTeX formula
  const wilsonFormulaHtml = useMemo(
    () =>
      katex.renderToString(
        'W(\\sigma) = W_0 + \\frac{K\\lambda \\cdot \\sigma}{\\pi^2 D_V \\cos\\theta_0} + 4 \\langle\\varepsilon^2\\rangle \\tan^2\\theta_0 \\cdot \\sigma^2',
        { throwOnError: false, displayMode: true }
      ),
    []
  );

  // Calculate raw integration when in raw profile mode
  useEffect(() => {
    if (inputMode === 'rawProfile') {
      const res = integrateRawPeakMoments(rawScanText, twoTheta0 > 0 ? twoTheta0 : undefined, 9);
      setRawIntegrationResult(res);
      if (res && res.twoThetaCentroid > 0) {
        setTwoTheta0(parseFloat(res.twoThetaCentroid.toFixed(2)));
      }
    }
  }, [rawScanText, inputMode, twoTheta0]);

  // Recalculate Method of Moments instantaneously whenever inputs change
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

  const handleApplyPreset = (preset: typeof MOMENT_PRESETS[0]) => {
    setWavelength(preset.wavelength);
    setTwoTheta0(preset.twoTheta0);
    setInputData(preset.data);
    setSelectedPresetName(preset.name);
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
      let m4 = 0;

      for (const pt of grid) {
        if (Math.abs(pt.x - x0) <= sig) {
          const dxRad = (pt.x - x0) * DEG_TO_RAD;
          m0 += pt.intensity * step;
          m2 += (dxRad * dxRad) * pt.intensity * step;
          m4 += Math.pow(dxRad, 4) * pt.intensity * step;
        }
      }

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

  // Synthetic peak profile curve for real-time visualization in simulator
  const syntheticProfileCurve = useMemo(() => {
    const x0 = synthCentroid;
    const fwhm = Math.max(0.05, synthFwhm);
    const eta = synthMixingEta;
    const step = fwhm / 25;
    const span = Math.max(0.8, fwhm * 3.5);
    const points: { twoTheta: number; profile: number; gaussian: number; lorentzian: number }[] = [];
    const sigmaG = fwhm / (2 * Math.sqrt(2 * Math.log(2)));
    const gammaL = fwhm / 2;

    for (let x = x0 - span; x <= x0 + span + 0.0001; x += step) {
      const dx = x - x0;
      const g = Math.exp(-(dx * dx) / (2 * sigmaG * sigmaG));
      const l = 1 / (1 + (dx * dx) / (gammaL * gammaL));
      const pv = eta * l + (1 - eta) * g;
      points.push({
        twoTheta: parseFloat(x.toFixed(3)),
        profile: parseFloat((pv * 100).toFixed(1)),
        gaussian: parseFloat(((1 - eta) * g * 100).toFixed(1)),
        lorentzian: parseFloat((eta * l * 100).toFixed(1))
      });
    }
    return points;
  }, [synthCentroid, synthFwhm, synthMixingEta]);

  // Dynamic window inspection profile curve for Tab 4 visualization
  const inspectorProfileCurve = useMemo(() => {
    const x0 = twoTheta0 || 28.55;
    const span = 1.6;
    const step = 0.02;
    const fwhm = 0.35;
    const sigmaG = fwhm / (2 * Math.sqrt(2 * Math.log(2)));
    const gammaL = fwhm / 2;
    const eta = 0.45;

    const pts: { twoTheta: number; totalIntensity: number; windowIntensity: number | null; outsideIntensity: number }[] = [];
    let totalArea = 0;
    let windowArea = 0;

    for (let x = x0 - span; x <= x0 + span + 0.001; x += step) {
      const dx = x - x0;
      const g = Math.exp(-(dx * dx) / (2 * sigmaG * sigmaG));
      const l = 1 / (1 + (dx * dx) / (gammaL * gammaL));
      const val = parseFloat(((eta * l + (1 - eta) * g) * 100).toFixed(2));
      totalArea += val * step;

      const inWindow = Math.abs(dx) <= inspectSigma + 1e-4;
      if (inWindow) {
        windowArea += val * step;
      }

      pts.push({
        twoTheta: parseFloat(x.toFixed(3)),
        totalIntensity: val,
        windowIntensity: inWindow ? val : null,
        outsideIntensity: inWindow ? 0 : val
      });
    }

    const capturedPct = totalArea > 0 ? (windowArea / totalArea) * 100 : 100;
    return { pts, capturedPct: Math.min(100, Math.max(0, capturedPct)) };
  }, [twoTheta0, inspectSigma]);

  const handleLoadSyntheticToInput = () => {
    let text = "# Synthetic Moment Profile\n";
    syntheticMomentsData.forEach(p => {
      text += `${p.sigmaDeg.toFixed(2)}, ${p.varianceDeg2.toFixed(6)}, ${p.fourthMomentRad4?.toExponential(4)}\n`;
    });
    setTwoTheta0(synthCentroid);
    setInputData(text);
    setSelectedPresetName('Synthetic Profile');
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
      title: 'Progressive Integration Range (σ = Δ2θ/2)',
      subtitle: 'Truncation Limits Around Peak Centroid 2θ₀',
      explanation: 'Calculates the profile variance W(σ) = μ₂ of a single diffraction line as a function of the symmetric integration cutoff σ = |2θ - 2θ₀|. Broad Cauchy tails carry crucial information regarding crystallite size and lattice microstrain.',
      tip: 'Ensure background subtraction is clean; over-subtraction artificially dampens higher-order moments.'
    },
    {
      title: 'Wilson-Langford Variance-Range Parabola',
      subtitle: 'W(σ) = W₀ + K₁·σ + K₂·σ²',
      explanation: 'The linear slope K₁ is governed entirely by crystallite size broadening: K₁ = Kλ / (π² · D_V · cosθ₀). The quadratic curvature K₂ is governed by microstrain: K₂ = 4 · ⟨ε²⟩ · tan²θ₀.',
      tip: 'In a purely size-broadened sample (e.g. CeO2 nanocrystals), K₂ ≈ 0 and the plot is a straight line!'
    },
    {
      title: 'Langford Reduced Variance Plot: W(σ)/σ vs. σ',
      subtitle: 'Direct Linearization of Size vs. Strain',
      explanation: 'Dividing variance by σ yields W(σ)/σ ≈ K₁ + K₂·σ. The vertical Y-intercept directly reveals size constant K₁, while any non-zero slope immediately reveals microstrain K₂.',
      tip: 'A horizontal line in the reduced variance plot proves that the sample is strain-free.'
    },
    {
      title: 'Kurtosis & Statistical Tail Decay',
      subtitle: 'Leptokurtic (β₂ > 3) vs. Gaussian (β₂ = 3) Peak Tails',
      explanation: 'Evaluates the 4th central moment μ₄ to determine peak sharpness and tail decay. Lorentzian/Cauchy profiles exhibit heavy tails (leptokurtic, β₂ > 3.5), while Gaussian profiles exhibit light tails (β₂ = 3.0).',
      tip: 'High kurtosis (> 4) indicates a strong Lorentzian character typically associated with small crystallite dimensions and planar stacking faults.'
    }
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-16 px-2 sm:px-4">
      {/* 1. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Method of Moments & Variance-Range Parabolic Workstation"
        description="Single-peak Wilson–Langford variance progression W(σ) = W₀ + K₁σ + K₂σ², separating volume size D_V (linear slope K₁) from RMS microstrain ⟨ε²⟩¹/² (quadratic curvature K₂)."
        steps={momentsWalkthroughSteps}
        presetNames={MOMENT_PRESETS.map(p => p.name)}
        onLoadBenchmarkPreset={(idx) => {
          const p = MOMENT_PRESETS[idx];
          if (p) handleApplyPreset(p);
        }}
      />

      {/* 2. Executive CAD Metrology Header & Benchmark Preset Bar */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
        <div className="px-4 py-3.5 bg-[#070A12] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                WILSON–LANGFORD MOMENTS ENGINE
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                SINGLE-PEAK SIZE–STRAIN DECOUPLING
              </span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                2θ₀ = {twoTheta0.toFixed(2)}° • λ = {convertLength(wavelength, lengthUnit).toFixed(4)} {lengthUnit}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Method of Moments &amp; Variance–Range Parabola</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Evaluates the 2nd central moment (variance <span className="font-mono text-indigo-300">W(σ)</span>) and 4th moment (kurtosis <span className="font-mono text-emerald-300">β₂ = μ₄/W²</span>) across progressive truncation limits <span className="font-mono text-cyan-300">±σ</span> around peak centroid <span className="font-mono text-white">2θ₀</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLaTeX}
              disabled={!result}
              className="px-3 py-1.5 bg-[#0B0F19] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              title="Copy LaTeX summary"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{copiedNotification ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={!result}
              className="px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
              title="Download CSV analysis table"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Benchmark Presets Strip */}
        <div className="px-4 py-2.5 bg-[#0B0F19] border-b border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reference Variance–Range Datasets:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 w-full">
            {MOMENT_PRESETS.map((p) => {
              const isSelected = selectedPresetName === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  title={p.desc}
                  className={`px-2.5 py-1.5 rounded border text-left transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-500/15 border-indigo-500/50 text-white'
                      : 'bg-[#070A12] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold text-indigo-300">{p.formula}</span>
                    <span className="text-[9px] font-mono text-slate-400 tabular-nums">{p.twoTheta0}°</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                    {p.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Card Executive Microstructural & Moment KPI Strip */}
        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-[#070A12] font-mono tabular-nums">
            {/* Card 1: Volume Domain Size D_V & Area Size <L>_A */}
            <div className="p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <Ruler className="w-3.5 h-3.5" /> 1. Volume Size D_V
                </span>
                <span>Slope K₁</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">
                  {convertLength(result.sizeNm * 10, lengthUnit).toFixed(2)}
                </span>
                <span className="text-xs text-cyan-400 font-bold">{lengthUnit}</span>
                <span className="text-[11px] text-slate-500 ml-auto">
                  ({result.sizeNm.toFixed(1)} nm)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Area ⟨L⟩_A: <strong className="text-slate-200">{result.areaWeightedSizeNm?.toFixed(1)} nm</strong></span>
                <span>K₁: <strong className="text-cyan-300">{result.slopeK1.toExponential(2)}</strong></span>
              </div>
            </div>

            {/* Card 2: RMS Microstrain */}
            <div className="p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <TrendingUp className="w-3.5 h-3.5" /> 2. RMS Strain ⟨ε²⟩¹/²
                </span>
                <span>Curvature K₂</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">
                  {(result.rmsStrain * 1000).toFixed(3)}
                </span>
                <span className="text-xs text-amber-400 font-bold">×10⁻³</span>
                <span className="text-[11px] text-slate-400 ml-auto">
                  ({(result.rmsStrain * 100).toFixed(3)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>⟨ε²⟩: <strong className="text-slate-200">{(result.rmsStrain * result.rmsStrain).toExponential(2)}</strong></span>
                <span>K₂: <strong className="text-amber-300">{result.quadraticK2.toExponential(2)}</strong></span>
              </div>
            </div>

            {/* Card 3: Dislocation Density */}
            <div className="p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1 text-purple-400 font-bold">
                  <Grid className="w-3.5 h-3.5" /> 3. Dislocations ρ
                </span>
                <span>b = {burgersVectorNm.toFixed(2)} nm</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">
                  {result.dislocationDensity ? result.dislocationDensity.toExponential(2) : '0.00e+0'}
                </span>
                <span className="text-xs text-purple-400 font-bold">m⁻²</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>In cm⁻²: <strong className="text-slate-200">{result.dislocationDensity ? (result.dislocationDensity * 1e-4).toExponential(2) : '0.0'}</strong></span>
                <span className="text-purple-300">2√3·ε / (D_V·b)</span>
              </div>
            </div>

            {/* Card 4: 4th Moment Kurtosis */}
            <div className="p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Activity className="w-3.5 h-3.5" /> 4. Kurtosis β₂ = μ₄/W²
                </span>
                <span>Gaussian = 3.0</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">
                  {result.meanKurtosis.toFixed(2)}
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  (γ₂ = {(result.meanKurtosis - 3).toFixed(2)})
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Tail Regime:</span>
                <strong className={result.meanKurtosis > 3.5 ? 'text-amber-300' : 'text-emerald-300'}>
                  {result.meanKurtosis > 3.5 ? 'LEPTOKURTIC (CAUCHY)' : 'MESOKURTIC (GAUSS)'}
                </strong>
              </div>
            </div>

            {/* Card 5: Regression Fit Quality */}
            <div className="p-3.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1 text-indigo-400 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> 5. Parabola Fit R²
                </span>
                <span>{result.points.length} Range Cuts</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">
                  {result.rSquared.toFixed(5)}
                </span>
                <span className="text-xs text-indigo-400 font-bold ml-auto">
                  Score {result.qualityScore || 95}/100
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Intercept W₀:</span>
                <strong className="text-slate-200">{result.interceptW0.toExponential(2)} rad²</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive 3-Mode CAD Method of Moments Schematic & Pedagogical Guide */}
      <MomentsCadSchematic
        result={result}
        twoTheta0={twoTheta0}
        wavelength={wavelength}
        shapeK={shapeK}
        inspectSigma={inspectSigma}
        onInspectSigmaChange={setInspectSigma}
      />

      {/* 4. Physical Meaning Verdict Banner */}
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

      {/* 5. Main Unified Side-by-Side CAD Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (4 cols): Experimental Physics & Input Source Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card A: Experimental Geometry & Physics Parameters */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Experimental Physics &amp; Corrections
                </h3>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                Wilson Form
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Sub-tab Navigation */}
              <div className="grid grid-cols-3 p-1 bg-[#070A12] rounded border border-slate-800 gap-1">
                <button
                  type="button"
                  onClick={() => setExpSubTab('wavelength')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    expSubTab === 'wavelength'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>Radiation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpSubTab('instrument')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    expSubTab === 'instrument'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>Instrument</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExpSubTab('corrections')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    expSubTab === 'corrections'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Defects</span>
                </button>
              </div>

              {/* Sub-tab 1: Radiation & Peak Centroid */}
              {expSubTab === 'wavelength' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
                      X-Ray Wavelength (λ) [{lengthUnit}]
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={convertLength(wavelength, lengthUnit)}
                        onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value), lengthUnit))}
                        className="w-full px-2.5 py-1.5 bg-[#070A12] text-indigo-300 border border-slate-700 rounded text-xs font-mono outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {XRAY_WAVELENGTHS.map((w) => (
                          <option key={w.label} value={convertLength(w.value, lengthUnit)}>
                            {w.label} ({convertLength(w.value, lengthUnit).toFixed(4)})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.0001"
                        value={convertLength(wavelength, lengthUnit)}
                        onChange={(e) => setWavelength(convertToAngstrom(parseFloat(e.target.value) || 1.54056, lengthUnit))}
                        className="w-full px-2.5 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs font-mono tabular-nums outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[11px] font-mono font-semibold text-slate-300">
                        Peak Centroid (2θ₀) [deg]
                      </label>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 tabular-nums">
                        θ₀ = {(twoTheta0 / 2).toFixed(2)}°
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={twoTheta0}
                      onChange={(e) => setTwoTheta0(parseFloat(e.target.value) || 28.55)}
                      className="w-full px-2.5 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs font-mono tabular-nums outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="p-3 bg-[#070A12] rounded border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300">Shape Habit Factor (K):</span>
                      <span className="text-indigo-300 font-bold tabular-nums">K = {shapeK.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.20"
                      step="0.01"
                      value={shapeK}
                      onChange={(e) => setShapeK(parseFloat(e.target.value))}
                      className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>0.89 (Sphere)</span>
                      <span>1.00 (Cubic/Wilson)</span>
                      <span>1.07 (Octahedral)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Instrumental Variance Subtraction */}
              {expSubTab === 'instrument' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInstrumentalMode('constant')}
                      className={`py-1.5 px-2.5 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        instrumentalMode === 'constant'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-[#070A12] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Constant FWHM
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstrumentalMode('caglioti')}
                      className={`py-1.5 px-2.5 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        instrumentalMode === 'caglioti'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-[#070A12] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Caglioti (U,V,W)
                    </button>
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div>
                      <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1.5">
                        Instrumental Standard FWHM [deg 2θ]
                      </label>
                      <input
                        type="number"
                        step="0.005"
                        value={instFwhm}
                        onChange={(e) => setInstFwhm(parseFloat(e.target.value) || 0.05)}
                        className="w-full px-2.5 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs font-mono tabular-nums outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] font-mono text-slate-500 block mt-1">
                        Subtracts additive Gaussian variance W_inst = β_inst² / (8 ln 2)
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 font-mono">
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">U (tan²θ)</span>
                        <input
                          type="number"
                          step="0.001"
                          value={cagliotiU}
                          onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs tabular-nums outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">V (tanθ)</span>
                        <input
                          type="number"
                          step="0.001"
                          value={cagliotiV}
                          onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs tabular-nums outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 mb-1">W (const)</span>
                        <input
                          type="number"
                          step="0.001"
                          value={cagliotiW}
                          onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs tabular-nums outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                      Goniometer Zero-Shift Δ(2θ₀) [deg]
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={zeroShiftDeg}
                      onChange={(e) => setZeroShiftDeg(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs font-mono tabular-nums outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Microstructure & Physical Corrections */}
              {expSubTab === 'corrections' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono font-semibold text-slate-300 mb-1">
                      Burgers Vector Magnitude (b) [nm]
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={burgersVectorNm}
                      onChange={(e) => setBurgersVectorNm(parseFloat(e.target.value) || 0.25)}
                      className="w-full px-2.5 py-1.5 bg-[#070A12] text-white border border-slate-700 rounded text-xs font-mono tabular-nums outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      Governs Dislocation Density ρ = 2√3 ⟨ε²⟩¹/² / (D_V · b)
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#070A12] rounded border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-semibold text-white block">Lorentz–Polarization (L–P)</span>
                      <span className="text-[10px] text-slate-400">Angular scattering intensity correction</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setApplyLPFactor(!applyLPFactor)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${applyLPFactor ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${applyLPFactor ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {applyLPFactor && (
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        Monochromator 2θ_M [deg] (Graphite = 26.4°)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={monochromatorAngle}
                        onChange={(e) => setMonochromatorAngle(parseFloat(e.target.value) || 26.4)}
                        className="w-full px-2.5 py-1 bg-[#070A12] text-white border border-slate-700 rounded text-xs font-mono tabular-nums"
                      />
                    </div>
                  )}

                  <div className="p-2.5 bg-[#070A12] rounded border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-semibold text-white block">Kα₂ Doublet Stripping</span>
                      <span className="text-[10px] text-slate-400">Rachinger variance subtraction</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setKAlpha2Correction(!kAlpha2Correction)}
                      className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${kAlpha2Correction ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${kAlpha2Correction ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              )}

              {/* Governing Wilson Equation Box */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="uppercase font-bold text-indigo-300 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Governing Parabola Law
                  </span>
                  <span>Additive Moments</span>
                </div>
                <div
                  className="py-2 px-2 bg-[#070A12] border border-slate-800 rounded text-white text-xs overflow-x-auto text-center"
                  dangerouslySetInnerHTML={{ __html: wilsonFormulaHtml }}
                />
              </div>
            </div>
          </div>

          {/* Card B: Input Mode Switcher & Raw/Synthetic Generators */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-[#070A12] border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Moment Data Source Mode
              </span>
              <span className="text-[10px] font-mono text-slate-400">Live Sync</span>
            </div>

            <div className="p-3 space-y-3">
              <div className="grid grid-cols-3 gap-1 bg-[#070A12] p-1 rounded border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('table')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    inputMode === 'table'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('rawProfile')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    inputMode === 'rawProfile'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>Raw Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('synthetic')}
                  className={`py-1.5 px-2 rounded text-[11px] font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    inputMode === 'synthetic'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>Simulator</span>
                </button>
              </div>

              {inputMode === 'table' && (
                <div className="p-3 bg-[#070A12] border border-slate-800 rounded space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Active Dataset:</span>
                    <span className="text-indigo-300 font-bold truncate max-w-[180px]">{selectedPresetName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Edit individual range cutoffs <span className="font-mono text-white">σ</span> and variances <span className="font-mono text-white">W(σ)</span> directly in the <strong>Spreadsheet Matrix</strong> below, or switch to <strong>Raw Scan</strong> / <strong>Simulator</strong> to integrate moments from an intensity profile.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveResultTab('tableDetails')}
                    className="w-full py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Open Full Spreadsheet Matrix Tab
                  </button>
                </div>
              )}

              {inputMode === 'rawProfile' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">
                      Paste Raw 2θ [deg] vs Intensity [counts] Scan:
                    </label>
                    <textarea
                      rows={6}
                      value={rawScanText}
                      onChange={(e) => setRawScanText(e.target.value)}
                      className="w-full p-2.5 bg-[#070A12] text-indigo-300 font-mono text-xs border border-slate-700 rounded outline-none focus:border-indigo-500"
                    />
                  </div>

                  {rawIntegrationResult && (
                    <div className="bg-[#070A12] p-3 rounded border border-slate-800 space-y-2 text-xs font-mono tabular-nums">
                      <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                        Numerical Peak Integration Summary
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">1st Moment Centroid 2θ₀:</span>
                        <span className="text-white font-bold">{rawIntegrationResult.twoThetaCentroid.toFixed(3)}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Observed FWHM / β_I:</span>
                        <span className="text-cyan-300 font-bold">
                          {rawIntegrationResult.fwhm.toFixed(3)}° / {rawIntegrationResult.integralBreadthDeg.toFixed(3)}°
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lorentzian Fraction η:</span>
                        <span className="text-amber-300 font-bold">{(rawIntegrationResult.lorentzianFractionEta * 100).toFixed(1)}%</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTransferRawMoments}
                        className="w-full mt-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Load {rawIntegrationResult.momentPoints.length} Integrated Moments</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'synthetic' && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="h-28 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={syntheticProfileCurve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                        <XAxis dataKey="twoTheta" stroke="#64748b" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[0, 'auto']} />
                        <ReferenceLine x={synthCentroid} stroke="#f59e0b" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="profile" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="gaussian" stroke="#38bdf8" strokeDasharray="3 3" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="lorentzian" stroke="#c084fc" strokeDasharray="3 3" strokeWidth={1} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 tabular-nums">
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400">Centroid 2θ₀:</span>
                        <span className="text-indigo-300 font-bold">{synthCentroid.toFixed(2)}°</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="0.1"
                        value={synthCentroid}
                        onChange={(e) => setSynthCentroid(parseFloat(e.target.value))}
                        className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400">Peak FWHM (Size):</span>
                        <span className="text-cyan-300 font-bold">{synthFwhm.toFixed(2)}°</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.2"
                        step="0.01"
                        value={synthFwhm}
                        onChange={(e) => setSynthFwhm(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400">Lorentzian Mixing η:</span>
                        <span className="text-emerald-300 font-bold">{synthMixingEta.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={synthMixingEta}
                        onChange={(e) => setSynthMixingEta(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400">Synthetic Microstrain:</span>
                        <span className="text-amber-300 font-bold">{(synthMicrostrain * 100).toFixed(3)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.01"
                        step="0.0005"
                        value={synthMicrostrain}
                        onChange={(e) => setSynthMicrostrain(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadSyntheticToInput}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Synthetic Moments to Workstation</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Interactive Plots, Window Inspector & Spreadsheet Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {/* Interactive Visualizer Navigation Tabs */}
          <div className="bg-[#0B0F19] p-1.5 rounded-md border border-slate-800 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveResultTab('variancePlot')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'variancePlot'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>01. Variance Parabola W(σ)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('reducedPlot')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'reducedPlot'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>02. Langford Linear Plot (W/σ)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('momentsKurtosis')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'momentsKurtosis'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>03. 4th Moment Kurtosis β₂</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('rawInspector')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'rawInspector'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>04. Window Inspector (±σ)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveResultTab('tableDetails')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeResultTab === 'tableDetails'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span>05. Dataset Matrix ({result?.points.length || 0})</span>
            </button>
          </div>

          {/* Tab 1: Variance Parabola W(sigma) vs sigma */}
          {activeResultTab === 'variancePlot' && result && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Wilson Variance–Range Parabola: W(σ) = W₀ + K₁σ + K₂σ²</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    Linear Size Tangent K₁ → D_V = {result.sizeNm.toFixed(2)} nm | Quadratic Strain Curvature K₂ → ⟨ε²⟩¹/² = {(result.rmsStrain * 100).toFixed(3)}%
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Observed W</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-purple-400 inline-block" /> Total Fit</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Linear Size</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Strain Part</span>
                </div>
              </div>

              <div className="h-80 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartVarianceData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="sigmaDeg"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Integration Cutoff Range σ = |2θ − 2θ₀| (deg)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Profile Variance W(σ) (deg²)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#070A12', borderColor: '#334155', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px' }} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Scatter name="Observed Variance W(σ)" dataKey="varianceDeg2" fill="#6366f1" />
                    <Line type="monotone" name="Quadratic Fit W(σ)" dataKey="fittedWDeg2" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" name="Linear Size Component (W₀ + K₁σ)" dataKey="linearComponentDeg2" stroke="#38bdf8" strokeDasharray="5 5" strokeWidth={1.8} dot={false} />
                    <Line type="monotone" name="Quadratic Strain Component (K₂σ²)" dataKey="quadraticComponentDeg2" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.8} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 2: Langford Reduced Variance Plot */}
          {activeResultTab === 'reducedPlot' && result && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Langford Reduced Variance Linearization: W(σ)/σ vs. σ</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Dividing by σ linearizes the parabola: Y-Intercept = K₁ (Size Slope), Line Slope = K₂ (Microstrain).
                  </p>
                </div>
              </div>

              <div className="h-80 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartReducedData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="sigmaDeg"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Integration Range Cutoff σ (deg)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Reduced Variance W(σ)/σ (deg)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#070A12', borderColor: '#334155', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px' }} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Scatter name="Observed W(σ)/σ" dataKey="wOverSigmaObs" fill="#22d3ee" />
                    <Line type="monotone" name="Linearized Fit (K₁ + K₂·σ)" dataKey="wOverSigmaFit" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 3: Moments & Kurtosis Hierarchy */}
          {activeResultTab === 'momentsKurtosis' && result && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Pearson Kurtosis (β₂ = μ₄ / W²) &amp; Excess Kurtosis (γ₂ = β₂ − 3)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                    Mean Kurtosis β₂ = {result.meanKurtosis.toFixed(2)} | Gaussian Reference = 3.00 (Values &gt; 3.5 indicate heavy Lorentzian size/fault tails)
                  </p>
                </div>
              </div>

              <div className="h-80 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartKurtosisData} margin={{ top: 10, right: 25, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="sigmaDeg"
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Integration Range σ (deg)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      label={{ value: 'Kurtosis (μ₄ / W²)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#070A12', borderColor: '#334155', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px' }} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <ReferenceLine y={3} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Gaussian Limit β₂ = 3.0', fill: '#ef4444', position: 'insideTopRight', fontSize: 10 }} />
                    <Line type="monotone" name="Kurtosis β₂" dataKey="kurtosis" stroke="#10b981" strokeWidth={2.5} dot />
                    <Line type="monotone" name="Excess Kurtosis γ₂" dataKey="excessKurtosis" stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.8} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 4: Raw Window Inspector */}
          {activeResultTab === 'rawInspector' && result && (
            <div className="bg-[#0B0F19] p-4 rounded-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    <span>Dynamic Integration Window Inspector [2θ₀ − σ, 2θ₀ + σ]</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Inspect how widening the symmetric cutoff σ captures asymptotic Lorentzian tails and shifts the size/strain variance ratio.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#070A12] px-3 py-1.5 rounded border border-slate-800 font-mono tabular-nums">
                  <span className="text-xs text-slate-400">Active Window:</span>
                  <span className="text-xs font-bold text-cyan-300">±{inspectSigma.toFixed(2)}°</span>
                </div>
              </div>

              <div className="h-64 w-full bg-[#070A12] p-2 rounded border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={inspectorProfileCurve.pts} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="windowAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="twoTheta" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#070A12', borderColor: '#334155', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace' }} />
                    <ReferenceLine x={twoTheta0} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: '2θ₀', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                    <ReferenceLine x={parseFloat((twoTheta0 - inspectSigma).toFixed(2))} stroke="#22d3ee" strokeDasharray="2 2" />
                    <ReferenceLine x={parseFloat((twoTheta0 + inspectSigma).toFixed(2))} stroke="#22d3ee" strokeDasharray="2 2" />
                    <Area type="monotone" dataKey="windowIntensity" stroke="#06b6d4" strokeWidth={2} fill="url(#windowAreaGrad)" name="Integrated Window" />
                    <Line type="monotone" dataKey="totalIntensity" stroke="#64748b" strokeDasharray="3 3" strokeWidth={1.5} dot={false} name="Full Peak Profile" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5">
                <input
                  type="range"
                  min="0.10"
                  max="1.50"
                  step="0.05"
                  value={inspectSigma}
                  onChange={(e) => setInspectSigma(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>σ = 0.10° (Bragg Core)</span>
                  <span>σ = 0.75° (Intermediate Wing)</span>
                  <span>σ = 1.50° (Asymptotic Tail)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#070A12] rounded border border-slate-800 text-xs font-mono tabular-nums">
                <div>
                  <span className="text-slate-500 block text-[10px]">Angular Span:</span>
                  <span className="text-cyan-300 font-bold">{(twoTheta0 - inspectSigma).toFixed(2)}° → {(twoTheta0 + inspectSigma).toFixed(2)}°</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Captured Area M₀:</span>
                  <span className="text-emerald-300 font-bold">{inspectorProfileCurve.capturedPct.toFixed(1)}% of total</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Variance W(σ):</span>
                  <span className="text-indigo-300 font-bold">
                    {(result.interceptW0 + result.slopeK1 * (inspectSigma * Math.PI / 180) + result.quadraticK2 * Math.pow(inspectSigma * Math.PI / 180, 2)).toExponential(3)} rad²
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Size / Strain Ratio:</span>
                  <span className="text-amber-300 font-bold">
                    {((result.slopeK1 * (inspectSigma * Math.PI / 180)) / Math.max(1e-12, result.quadraticK2 * Math.pow(inspectSigma * Math.PI / 180, 2))).toFixed(2)}× (K₁σ / K₂σ²)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Full Editable Variance-Range Dataset Matrix (also shown below when on other tabs for quick editing) */}
          <VarianceRangeDatasetMatrix
            inputData={inputData}
            onInputDataChange={setInputData}
            result={result}
            twoTheta0={twoTheta0}
            wavelength={wavelength}
            shapeK={shapeK}
          />
        </div>
      </div>

      {/* 6. Scientific Math Control & AI / Python Exporters */}
      {result && (
        <div className="space-y-5 pt-2">
          <ScientificMathControl
            title="Wilson–Langford Variance–Range Deconvolution"
            formula="W(\\sigma) = W_0 + \\frac{K\\lambda \\cdot \\sigma}{\\pi^2 D_V \\cos\\theta_0} + 4 \\langle\\varepsilon^2\\rangle \\tan^2\\theta_0 \\cdot \\sigma^2"
            description="Separates crystallite domain size and microstrain from a single reflection by evaluating profile variance across progressive integration cutoffs σ. Linear slope gives domain size, quadratic curvature gives microstrain distortion."
            variables={[
              { symbol: 'D_V', name: 'Volume-Weighted Size', value: convertLength(result.sizeNm * 10, lengthUnit), unit: lengthUnit },
              { symbol: '⟨L⟩_A', name: 'Area-Weighted Size', value: convertLength((result.areaWeightedSizeNm || 0) * 10, lengthUnit), unit: lengthUnit },
              { symbol: '⟨ε²⟩', name: 'Mean-Square Strain', value: (result.rmsStrain * result.rmsStrain) * 10000, unit: '×10⁻⁴' },
              { symbol: 'K_1', name: 'Linear Slope (Size)', value: result.slopeK1, unit: 'rad' },
              { symbol: 'K_2', name: 'Curvature (Strain)', value: result.quadraticK2, unit: '' }
            ]}
            result={convertLength(result.sizeNm * 10, lengthUnit)}
            resultUnit={lengthUnit}
            resultName="D_V (Volume Size)"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
