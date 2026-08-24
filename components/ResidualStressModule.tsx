import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Calculator,
  Info,
  LineChart,
  Plus,
  Trash2,
  Zap,
  TrendingDown,
  TrendingUp,
  Settings,
  Scale,
  Sparkles,
  Sliders,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Gauge,
  Box,
  ChevronRight,
  Upload,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Split,
  Crosshair,
  AlertCircle,
  FileText,
  BarChart2,
  Compass,
  BookOpen,
  ShieldCheck,
  Cpu,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Target
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ComposedChart,
  Area,
  ErrorBar
} from 'recharts';

import { playSynthTone } from '../utils/sound';
import { useSettings, convertLength, convertToAngstrom, LengthUnit } from './SettingsContext';
import {
  computeResidualStressAnalysis,
  ResidualStressPoint,
  ResidualStressFullAnalysis,
  XecModel,
  XecResult,
  calculateXEC,
  DolleHaukAnalysis,
  StressTensor2D,
  KNOWN_XEC_MATERIALS
} from '../utils/residualStressPhysics';

import { StressTensorVisualizer } from './residual_stress/StressTensorVisualizer';
import { DolleHaukSplitView } from './residual_stress/DolleHaukSplitView';
import { DepthProfilingWorkbench } from './residual_stress/DepthProfilingWorkbench';
import { XecCalculatorModal } from './residual_stress/XecCalculatorModal';
import { ResidualStressReport } from './residual_stress/ResidualStressReport';
import { PhysicsGuideTab } from './residual_stress/PhysicsGuideTab';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';

export interface DataPoint {
  id: string;
  psi: number; // Tilt angle in degrees (-90 to +90)
  twoTheta: number; // Measured 2Theta (deg)
  intensity: number; // Peak height / area (a.u.)
  fwhm: number; // Full Width at Half Max (deg)
  error2Theta: number; // Peak center uncertainty (+- deg)
  enabled: boolean; // Outlier toggle
}

export interface MaterialPreset {
  name: string;
  plane: string;
  E: number; // GPa
  nu: number;
  twoTheta0: number; // deg
  wavelength: number;
  description: string;
  defaultData: { psi: number; twoTheta: number; intensity?: number; fwhm?: number }[];
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    name: 'Ferritic Steel (Fe-α)',
    plane: '(211)',
    E: 211,
    nu: 0.28,
    twoTheta0: 156.40,
    wavelength: 1.54056, // Cu K-alpha
    description: 'Shot-peened structural steel with strong surface compressive residual stress',
    defaultData: [
      { psi: -60, twoTheta: 157.58, intensity: 820, fwhm: 0.45 },
      { psi: -45, twoTheta: 157.14, intensity: 910, fwhm: 0.42 },
      { psi: -30, twoTheta: 156.76, intensity: 1050, fwhm: 0.38 },
      { psi: -15, twoTheta: 156.51, intensity: 1180, fwhm: 0.36 },
      { psi: 0, twoTheta: 156.40, intensity: 1250, fwhm: 0.35 },
      { psi: 15, twoTheta: 156.52, intensity: 1160, fwhm: 0.36 },
      { psi: 30, twoTheta: 156.78, intensity: 1020, fwhm: 0.39 },
      { psi: 45, twoTheta: 157.15, intensity: 880, fwhm: 0.43 },
      { psi: 60, twoTheta: 157.60, intensity: 790, fwhm: 0.46 },
    ]
  },
  {
    name: 'Aluminum Alloy (Al 7075-T6)',
    plane: '(311)',
    E: 71,
    nu: 0.33,
    twoTheta0: 139.30,
    wavelength: 1.54056,
    description: 'Aerospace aluminum alloy heat-affected zone exhibiting tensile stress',
    defaultData: [
      { psi: -60, twoTheta: 138.02, intensity: 650, fwhm: 0.52 },
      { psi: -45, twoTheta: 138.51, intensity: 780, fwhm: 0.48 },
      { psi: -30, twoTheta: 138.93, intensity: 920, fwhm: 0.44 },
      { psi: -15, twoTheta: 139.19, intensity: 1100, fwhm: 0.41 },
      { psi: 0, twoTheta: 139.30, intensity: 1200, fwhm: 0.40 },
      { psi: 15, twoTheta: 139.18, intensity: 1120, fwhm: 0.41 },
      { psi: 30, twoTheta: 138.92, intensity: 940, fwhm: 0.43 },
      { psi: 45, twoTheta: 138.50, intensity: 810, fwhm: 0.47 },
      { psi: 60, twoTheta: 138.00, intensity: 670, fwhm: 0.51 },
    ]
  },
  {
    name: 'Titanium Alloy (Ti-6Al-4V)',
    plane: '(213)',
    E: 114,
    nu: 0.34,
    twoTheta0: 142.10,
    wavelength: 1.54056,
    description: 'Laser powder bed fusion (LPBF) additive manufacturing as-built tensile state',
    defaultData: [
      { psi: -50, twoTheta: 143.12, intensity: 710, fwhm: 0.58 },
      { psi: -35, twoTheta: 142.68, intensity: 850, fwhm: 0.54 },
      { psi: -20, twoTheta: 142.31, intensity: 990, fwhm: 0.50 },
      { psi: 0, twoTheta: 142.10, intensity: 1150, fwhm: 0.48 },
      { psi: 20, twoTheta: 142.32, intensity: 1010, fwhm: 0.50 },
      { psi: 35, twoTheta: 142.69, intensity: 880, fwhm: 0.53 },
      { psi: 50, twoTheta: 143.15, intensity: 730, fwhm: 0.57 },
    ]
  },
  {
    name: 'Inconel 718 (Psi-Split Shear)',
    plane: '(311)',
    E: 205,
    nu: 0.29,
    twoTheta0: 141.20,
    wavelength: 1.54056,
    description: 'Laser surface cladded component displaying psi-splitting due to surface shear stress τ₁₃',
    defaultData: [
      { psi: -60, twoTheta: 142.85, intensity: 610, fwhm: 0.50 },
      { psi: -45, twoTheta: 142.22, intensity: 740, fwhm: 0.46 },
      { psi: -30, twoTheta: 141.72, intensity: 890, fwhm: 0.43 },
      { psi: -15, twoTheta: 141.40, intensity: 1040, fwhm: 0.41 },
      { psi: 0, twoTheta: 141.20, intensity: 1180, fwhm: 0.40 },
      { psi: 15, twoTheta: 141.35, intensity: 1060, fwhm: 0.41 },
      { psi: 30, twoTheta: 141.58, intensity: 910, fwhm: 0.42 },
      { psi: 45, twoTheta: 141.98, intensity: 770, fwhm: 0.45 },
      { psi: 60, twoTheta: 142.50, intensity: 630, fwhm: 0.49 },
    ]
  },
  {
    name: 'Alumina Ceramic (Al₂O₃)',
    plane: '(116)',
    E: 380,
    nu: 0.24,
    twoTheta0: 145.80,
    wavelength: 1.54056,
    description: 'Precision ground ceramic bearing race with severe surface compression (-820 MPa)',
    defaultData: [
      { psi: -60, twoTheta: 147.25, intensity: 540, fwhm: 0.32 },
      { psi: -40, twoTheta: 146.52, intensity: 780, fwhm: 0.30 },
      { psi: -20, twoTheta: 146.00, intensity: 1100, fwhm: 0.28 },
      { psi: 0, twoTheta: 145.80, intensity: 1350, fwhm: 0.27 },
      { psi: 20, twoTheta: 146.01, intensity: 1080, fwhm: 0.28 },
      { psi: 40, twoTheta: 146.53, intensity: 760, fwhm: 0.30 },
      { psi: 60, twoTheta: 147.26, intensity: 520, fwhm: 0.33 },
    ]
  }
];

export const ResidualStressModule: React.FC = () => {
  const { lengthUnit = 'Å' } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // State variables
  const [youngsModulus, setYoungsModulus] = useState<number>(MATERIAL_PRESETS[0].E);
  const [poissonsRatio, setPoissonsRatio] = useState<number>(MATERIAL_PRESETS[0].nu);
  const [unstressedTwoTheta, setUnstressedTwoTheta] = useState<number>(MATERIAL_PRESETS[0].twoTheta0);
  const [wavelength, setWavelength] = useState<number>(1.54056);
  const [azimuthPhi, setAzimuthPhi] = useState<number>(0);
  const [activePlane, setActivePlane] = useState<string>(MATERIAL_PRESETS[0].plane);
  const [linearMuCm, setLinearMuCm] = useState<number>(2420);
  const [activeXecModel, setActiveXecModel] = useState<XecModel>('isotropic');
  const [s1Override, setS1Override] = useState<number | null>(null);
  const [halfS2Override, setHalfS2Override] = useState<number | null>(null);

  const [dataPoints, setDataPoints] = useState<ResidualStressPoint[]>(() =>
    MATERIAL_PRESETS[0].defaultData.map((p, i) => ({
      id: String(i + 1),
      psi: p.psi,
      phi: 0,
      twoTheta: p.twoTheta,
      intensity: p.intensity || 1000,
      fwhm: p.fwhm || 0.4,
      error2Theta: 0.01,
      enabled: true,
    }))
  );

  const [activeTab, setActiveTab] = useState<'classical' | 'dolle_hauk' | 'tensor' | 'depth' | 'report' | 'guide'>('classical');
  const [viewMode, setViewMode] = useState<'dSpacing' | 'microstrain'>('dSpacing');
  const [showErrorBars, setShowErrorBars] = useState<boolean>(true);
  const [showUnstressedLine, setShowUnstressedLine] = useState<boolean>(true);

  const [isXecModalOpen, setIsXecModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [rawImportText, setRawImportText] = useState('');
  const [importError, setImportError] = useState('');

  const [appState, setAppState] = useState<'setup' | 'computing' | 'results'>('setup');
  const [computingStep, setComputingStep] = useState<number>(-1);

  const startComputation = () => {
    setAppState('computing');
    setComputingStep(0);
    playSynthTone('tick');
    setTimeout(() => {
      setComputingStep(1);
      playSynthTone('tick');
    }, 450);
    setTimeout(() => {
      setComputingStep(2);
      playSynthTone('tick');
    }, 900);
    setTimeout(() => {
      setComputingStep(3);
      playSynthTone('chime');
    }, 1350);
    setTimeout(() => {
      setAppState('results');
    }, 1800);
  };

  const xec: XecResult = useMemo(() => {
    const defaultMat = KNOWN_XEC_MATERIALS.ferrite_fe;
    const base = calculateXEC(defaultMat, [2, 1, 1], activeXecModel, youngsModulus, poissonsRatio);
    if (s1Override !== null) base.s1 = s1Override;
    if (halfS2Override !== null) base.halfS2 = halfS2Override;
    return base;
  }, [youngsModulus, poissonsRatio, activeXecModel, s1Override, halfS2Override]);

  const currentAnalysis = useMemo(() => {
    return computeResidualStressAnalysis(
      dataPoints,
      wavelength,
      unstressedTwoTheta,
      xec,
      linearMuCm,
      'side_inclination'
    );
  }, [dataPoints, wavelength, unstressedTwoTheta, xec, linearMuCm]);

  const d0 = currentAnalysis?.d0 ?? (wavelength / (2 * Math.sin((unstressedTwoTheta / 2) * (Math.PI / 180))));
  const twoTheta0 = currentAnalysis?.twoTheta0 ?? unstressedTwoTheta;
  const processedPoints = currentAnalysis?.points ?? [];
  const linearFit = currentAnalysis?.linearFit ?? { slope: 0, intercept: 0, rSquared: 0, syx: 0, sSlope: 0, sIntercept: 0, chiSquared: 0, n: 0 };
  const stress_MPa = currentAnalysis?.stress_MPa ?? 0;
  const stressError_MPa = currentAnalysis?.stressError_MPa ?? 0;
  const stressType = currentAnalysis?.stressType ?? 'Zero Stress';
  
  const dolleHauk: DolleHaukAnalysis = currentAnalysis?.dolleHauk ?? {
    pairs: [],
    sigmaPhi: 0,
    sigmaPhiError: 0,
    tau13: 0,
    tau13Error: 0,
    hasSignificantSplitting: false,
    rSquaredA1: 0,
    rSquaredA2: 0,
    slopeA1: 0,
    slopeA2: 0,
  };

  const stressTensor: StressTensor2D = currentAnalysis?.stressTensor ?? {
    sigma11: 0,
    sigma11Error: 0,
    sigma22: 0,
    sigma22Error: 0,
    tau12: 0,
    tau12Error: 0,
    tau13: 0,
    tau23: 0,
    sigma1: 0,
    sigma2: 0,
    principalAngleDeg: 0,
    tauMax: 0,
    vonMises: 0,
    hydrostaticStress: 0,
  };

  const diagnostics = currentAnalysis?.diagnostics ?? {
    hasCurvature: false,
    curvatureDirection: 'none' as const,
    quadraticTermA2: 0,
    depthGradientSeverity: 'low' as const,
    hasTextureOscillations: false,
    oscillationAmplitudeMicrostrain: 0,
    crossoverPsiDeg: 0,
    crossoverSin2Psi: 0,
    theoreticalD0: d0
  };

  const chartData = useMemo(() => {
    if (!currentAnalysis) return [];
    return processedPoints.map(p => ({
      id: p.id,
      psi: p.psi,
      sin2psi: Number(p.sin2psi.toFixed(4)),
      twoTheta: p.twoTheta,
      dSpacing: Number(convertLength(p.d, lengthUnit as LengthUnit).toFixed(6)),
      fittedD: Number(convertLength(p.fittedD || p.d, lengthUnit as LengthUnit).toFixed(6)),
      microstrain: Number(p.microstrain.toFixed(1)),
      fittedMicrostrain: Number((((p.fittedD || p.d) - d0) / d0 * 1e6).toFixed(1)),
      errorD: Number(convertLength(p.errorD || 0.0001, lengthUnit as LengthUnit).toFixed(6)),
      errorMicrostrain: Number((p.errorMicrostrain || 50).toFixed(1)),
      enabled: p.enabled
    }));
  }, [currentAnalysis, processedPoints, d0, lengthUnit]);

  const loadPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
    setYoungsModulus(preset.E);
    setPoissonsRatio(preset.nu);
    setUnstressedTwoTheta(preset.twoTheta0);
    setActivePlane(preset.plane);
    setS1Override(null);
    setHalfS2Override(null);
    setDataPoints(
      preset.defaultData.map((p, idx) => ({
        id: String(idx + 1),
        psi: p.psi,
        phi: 0,
        twoTheta: p.twoTheta,
        intensity: p.intensity || 1000,
        fwhm: p.fwhm || 0.4,
        error2Theta: 0.01,
        enabled: true,
      }))
    );
  };

  const addPoint = () => {
    const newId = String(Date.now());
    const lastPoint = dataPoints[dataPoints.length - 1];
    const newPsi = lastPoint ? Math.min(85, lastPoint.psi + 15) : 0;
    setDataPoints(prev => [
      ...prev,
      {
        id: newId,
        psi: newPsi,
        phi: azimuthPhi,
        twoTheta: unstressedTwoTheta,
        intensity: 1000,
        fwhm: 0.4,
        error2Theta: 0.01,
        enabled: true,
      },
    ]);
  };

  const removePoint = (id: string) => {
    setDataPoints(prev => prev.filter(p => p.id !== id));
  };

  const updatePoint = (id: string, field: keyof ResidualStressPoint, val: any) => {
    setDataPoints(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const togglePoint = (id: string) => {
    setDataPoints(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleExportCSV = () => {
    if (!currentAnalysis) return;
    let csv = 'Psi_deg,Sin2Psi,TwoTheta_deg,DSpacing_A,Strain,FittedD_A,Residual_A\n';
    currentAnalysis.points.forEach(p => {
      csv += `${p.psi},${p.sin2psi.toFixed(6)},${p.twoTheta.toFixed(4)},${p.d.toFixed(6)},${p.strain.toExponential(6)},${(p.fittedD || p.d).toFixed(6)},${(p.residualD || 0).toExponential(6)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `residual_stress_${activePlane.replace(/[{}]/g, '')}_${azimuthPhi}deg.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = () => {
    setImportError('');
    if (!rawImportText.trim()) {
      setImportError('Please paste valid CSV or whitespace-delimited XRD data');
      return;
    }
    const lines = rawImportText.trim().split('\n');
    const newPoints: ResidualStressPoint[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#') || line.toLowerCase().includes('psi')) continue;
      const parts = line.split(/[\s,;\t]+/).filter(Boolean);
      if (parts.length >= 2) {
        const psi = parseFloat(parts[0]);
        const twoTheta = parseFloat(parts[1]);
        const intensity = parts.length >= 3 ? parseFloat(parts[2]) : 500;
        const fwhm = parts.length >= 4 ? parseFloat(parts[3]) : 0.3;
        if (!isNaN(psi) && !isNaN(twoTheta)) {
          newPoints.push({
            id: String(i + 1),
            psi,
            phi: azimuthPhi,
            twoTheta,
            intensity,
            fwhm,
            error2Theta: 0.01,
            enabled: true,
          });
        }
      }
    }
    if (newPoints.length < 3) {
      setImportError('Failed to parse at least 3 valid (Psi, 2Theta) points');
      return;
    }
    setDataPoints(newPoints);
    setIsImportModalOpen(false);
    setRawImportText('');
  };

    const residualStressWalkthroughSteps: WizardStep[] = [
      {
        title: 'Choose Material & Diffracting Plane (hkl)',
        subtitle: 'X-ray Elastic Constants (XEC: S₁, ½S₂)',
        explanation: 'Residual stress measurement requires high Bragg angles (2θ > 120°) so that small lattice strain shifts produce large measurable peak displacements Δ2θ. We select elastic modulus E, Poisson ratio ν, or anisotropic Kroner / Voigt / Reuss bounds.',
        tip: 'Higher 2θ angles dramatically increase precision because cot(θ) approaches zero: ε = -½ cot(θ) Δ(2θ).'
      },
      {
        title: 'Measure Sample Tilts (sin²ψ Scan)',
        subtitle: 'ψ Angles from 0° to 60° (Iso-inclination or Side-inclination)',
        explanation: 'By tilting the sample at angles ψ, the scattering vector probes strain in different directions. In a biaxial planar stress state, the measured d-spacing shifts linearly with sin²ψ: d(ψ) = d₀ + d₀ · ½S₂ · σ_φ · sin²ψ.',
        tip: 'A negative slope indicates compressive residual stress (surface compression helps prevent fatigue cracks); a positive slope indicates tensile stress.'
      },
      {
        title: 'Detecting ψ-Splitting & Shear Stress',
        subtitle: 'Dölle-Hauk Elliptical Separation (τ₁₃ / τ₂₃)',
        explanation: 'When d(ψ⁺) differs from d(ψ⁻), an open ellipse appears in the sin²ψ plot. This is ψ-splitting caused by out-of-plane shear stresses (τ₁₃). The average (a₁) yields normal stress, while the difference (a₂) extracts shear stress.',
        tip: 'If significant splitting is detected, never fit a simple linear line across all points; use the Dölle-Hauk tab.'
      },
      {
        title: 'Constructing 3D Stress Tensor & ASTM E915 Audit',
        subtitle: 'Full Triaxial State (σ₁₁, σ₂₂, σ₃₃, τ₁₂, τ₁₃, τ₂₃) & Von Mises Yield Criterion',
        explanation: 'By combining measurements across multiple azimuth angles φ (0°, 45°, 90°), we reconstruct the complete 3D stress tensor and calculate the Von Mises equivalent stress to compare against material yield strength.',
        tip: 'Strain-free cross-over angle sin²ψ* = -S₁ / (½S₂) occurs around ψ ≈ 33° where d(ψ*) = d₀ regardless of stress magnitude.'
      }
    ];

    return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 0. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="sin²ψ Residual Stress & Triaxial Elasticity Tensor"
        description="Master XEC elastic constants, tilt goniometer geometries, ψ-splitting shear deconvolution, and ASTM E915 compliance."
        steps={residualStressWalkthroughSteps}
        presetNames={MATERIAL_PRESETS.map(p => `${p.name} (${p.plane})`)}
        onLoadBenchmarkPreset={(idx) => {
          const p = MATERIAL_PRESETS[idx];
          if (p) loadPreset(p);
        }}
      />

      {/* 0.5 Physical Meaning Verdict Banner */}
      {appState === 'results' && (
        <PhysicalMeaningSummary
          title="ASTM E915 / EN 15305 Residual Stress Verdict"
          tone={stress_MPa < -50 ? 'success' : stress_MPa > 100 ? 'warning' : 'info'}
          statement={`Material exhibits ${stressType.toLowerCase()} of ${stress_MPa.toFixed(1)} ± ${stressError_MPa.toFixed(1)} MPa with ${dolleHauk.hasSignificantSplitting ? `detectable surface shear (τ₁₃ = ${dolleHauk.tau13.toFixed(1)} MPa)` : 'negligible shear splitting'}.`}
          contextNote={`Regression linearity R² = ${linearFit.rSquared.toFixed(4)}. Strain-free cross-over point located at ψ* = ${diagnostics.crossoverPsiDeg.toFixed(1)}° (where d equals unstressed d₀ = ${d0.toFixed(4)} ${lengthUnit}). ${stress_MPa < 0 ? 'Surface compressive stress provides enhanced fatigue and stress-corrosion resistance.' : 'Surface tensile stress may increase susceptibility to microcracking.'}`}
          metrics={[
            { label: 'Normal Stress σ_φ', value: stress_MPa.toFixed(1), unit: 'MPa' },
            { label: 'Shear Stress τ₁₃', value: dolleHauk.tau13.toFixed(1), unit: 'MPa' },
            { label: 'Von Mises σ_vM', value: stressTensor.vonMises.toFixed(1), unit: 'MPa' },
            { label: 'Linearity R²', value: linearFit.rSquared.toFixed(4), unit: '' }
          ]}
        />
      )}

      {/* 1. Header Hero */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
                Residual Stress Deconvolution
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-md">
                  sin²ψ & Dölle-Hauk
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Triaxial stress tensors, direction-dependent XEC models, ψ-splitting deconvolution & ASTM E915 / EN 15305 compliance
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Preset Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {appState === 'results' && (
            <button
              onClick={() => setAppState('setup')}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 animate-in fade-in"
            >
              <RotateCcw className="w-4 h-4" />
              Edit Parameters
            </button>
          )}
          <div className="relative">
            <select
              onChange={e => {
                const preset = MATERIAL_PRESETS.find(p => p.name === e.target.value);
                if (preset) loadPreset(preset);
              }}
              defaultValue={MATERIAL_PRESETS[0].name}
              className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none hover:border-indigo-500 cursor-pointer shadow-sm"
            >
              {MATERIAL_PRESETS.map(p => (
                <option key={p.name} value={p.name}>
                  Preset: {p.name} {p.plane}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsXecModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Cpu className="w-4 h-4 text-indigo-500" />
            XEC Model ({xec.model.toUpperCase()})
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all"
            title="Import XRD Data"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCSV}
            className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SETUP STATE VIEW */}
      {appState === 'setup' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Elasticity & Geometry Setup (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-500" />
                    Elasticity & Goniometer Setup
                  </h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                    Plane {activePlane}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Young's Modulus E (GPa)
                    </label>
                    <input
                      type="number"
                      value={youngsModulus}
                      onChange={e => setYoungsModulus(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Poisson's Ratio (ν)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={poissonsRatio}
                      onChange={e => setPoissonsRatio(Math.max(0.01, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Stress-Free 2θ₀ (deg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={unstressedTwoTheta}
                      onChange={e => setUnstressedTwoTheta(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Wavelength λ (Å)
                    </label>
                    <input
                      type="number"
                      step="0.00001"
                      value={wavelength}
                      onChange={e => setWavelength(Math.max(0.1, Number(e.target.value)))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* XEC Summary Card */}
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">S₁ (Elastic Compliance):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{xec.s1.toFixed(2)} TPa⁻¹</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">½S₂ (Shear Compliance):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{xec.halfS2.toFixed(2)} TPa⁻¹</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Marion-Cohen ψ*:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{diagnostics.crossoverPsiDeg.toFixed(2)}°</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Measured Tilt Points Table (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Diffraction Tilt Series ({dataPoints.length} Points)
                    </h4>
                  </div>
                  <button
                    onClick={addPoint}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tilt Angle
                  </button>
                </div>

                <div className="max-h-[300px] overflow-auto pr-1 custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 z-10 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-2 text-[10px] text-slate-400">Include</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">ψ Tilt (°)</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">Peak 2θ (°)</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">±Δ2θ</th>
                        <th className="py-2 px-2 text-[10px] text-slate-400">FWHM (°)</th>
                        <th className="py-2 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {dataPoints.map(p => (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!p.enabled ? 'opacity-40' : ''}`}
                        >
                          <td className="py-1.5 px-2">
                            <button
                              onClick={() => togglePoint(p.id)}
                              className="text-slate-400 hover:text-indigo-600"
                            >
                              {p.enabled ? <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                            </button>
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              value={p.psi}
                              onChange={e => updatePoint(p.id, 'psi', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={p.twoTheta}
                              onChange={e => updatePoint(p.id, 'twoTheta', Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              step="0.001"
                              value={p.error2Theta}
                              onChange={e => updatePoint(p.id, 'error2Theta', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <input
                              type="number"
                              step="0.01"
                              value={p.fwhm}
                              onChange={e => updatePoint(p.id, 'fwhm', Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono text-slate-600 dark:text-slate-400"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <button
                              onClick={() => removePoint(p.id)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ready & Compute Action Banner */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>{processedPoints.length} Active Tilt Points Ready</span>
                </div>
                <button
                  onClick={startComputation}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95"
                >
                  <Activity className="w-4 h-4" />
                  <span>Compute Residual Stress (sin²ψ & Dölle-Hauk)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPUTING STATE VIEW */}
      {appState === 'computing' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300 min-h-[400px]">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <Compass className="w-10 h-10 text-indigo-500 animate-pulse" />
          </div>
          
          <div className="space-y-4 w-full max-w-lg">
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">1</span>
                Converting 2θ to d-spacing & evaluating lattice strains (ε_ψ)...
              </span>
              {computingStep > 0 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 1 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">2</span>
                Calculating X-ray Elastic Constants (S₁, ½S₂) via {xec.model.toUpperCase()}...
              </span>
              {computingStep > 1 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 2 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">3</span>
                Performing weighted linear & elliptical Dölle-Hauk sin²ψ regression...
              </span>
              {computingStep > 2 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
            
            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${computingStep >= 3 ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 shadow-md' : 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800/50 text-slate-400 dark:text-slate-600'}`}>
              <span className="font-mono text-sm font-bold flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-slate-950 flex items-center justify-center text-xs">4</span>
                Constructing 3D Triaxial Stress Tensor & ASTM E915 / EN 15305 audit...
              </span>
              {computingStep > 3 && <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in" />}
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULTS STATE VIEW */}
      {appState === 'results' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Key Physical Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Metric 1: Residual Normal Stress */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Residual Normal Stress (σ_φ)
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  stress_MPa < 0
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : stress_MPa > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                }`}>
                  {stressType}
                </span>
              </div>
              <div className="my-2">
                <div className={`text-2xl font-black font-mono tracking-tight ${
                  stress_MPa < 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : stress_MPa > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {stress_MPa.toFixed(1)} <span className="text-sm font-bold">± {stressError_MPa.toFixed(1)} MPa</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Slope ∂d/∂sin²ψ: {(linearFit.slope * 1000).toFixed(4)} × 10⁻³ {lengthUnit}
              </span>
            </div>

            {/* Metric 2: Shear Stress τ13 (ψ-Split) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Shear Stress (τ₁₃)
                </span>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                  ψ-Split
                </span>
              </div>
              <div className="my-2">
                <div className={`text-2xl font-black font-mono tracking-tight ${
                  Math.abs(dolleHauk.tau13) > 10
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {dolleHauk.tau13.toFixed(1)} <span className="text-sm font-bold">± {dolleHauk.tau13Error.toFixed(1)} MPa</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {dolleHauk.hasSignificantSplitting ? 'Significant surface shear' : 'Minimal shear splitting'}
              </span>
            </div>

            {/* Metric 3: Goodness of Fit & Linearity */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Linearity (R²) & Cross-Over
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                  ASTM E915
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-slate-800 dark:text-slate-200">
                  {linearFit.rSquared.toFixed(4)}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Strain-Free ψ*: {diagnostics.crossoverPsiDeg.toFixed(1)}° (sin²ψ* = {diagnostics.crossoverSin2Psi.toFixed(3)})
              </span>
            </div>

            {/* Metric 4: Von Mises Equivalent */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Von Mises Stress (σ_vM)
                </span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                  Triaxial
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono tracking-tight text-purple-600 dark:text-purple-400">
                  {stressTensor.vonMises.toFixed(1)} <span className="text-sm font-bold">MPa</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Hydrostatic σ_H: {stressTensor.hydrostaticStress.toFixed(1)} MPa
              </span>
            </div>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {[
              { id: 'classical', label: 'Classical sin²ψ', icon: Activity },
              { id: 'dolle_hauk', label: 'Dölle-Hauk (ψ-Split)', icon: Split },
              { id: 'tensor', label: '3D Stress Tensor', icon: Box },
              { id: 'depth', label: 'Depth Profiling', icon: Layers },
              { id: 'report', label: 'ASTM Audit Report', icon: FileText },
              { id: 'guide', label: 'Scattering Physics', icon: BookOpen },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: CLASSICAL sin²ψ ANALYSIS */}
          {activeTab === 'classical' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Chart (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      {viewMode === 'dSpacing' ? `Interplanar d-Spacing vs sin²ψ (${lengthUnit})` : 'Microstrain (ε_ψ) vs sin²ψ (µε)'}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {processedPoints.length} active diffraction angles | Radiation λ = {wavelength} Å
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        onClick={() => setViewMode('dSpacing')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          viewMode === 'dSpacing'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        d-Spacing
                      </button>
                      <button
                        onClick={() => setViewMode('microstrain')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          viewMode === 'microstrain'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Microstrain (µε)
                      </button>
                    </div>

                    <button
                      onClick={() => setShowErrorBars(!showErrorBars)}
                      className={`p-1.5 rounded-xl border text-[10px] font-bold ${
                        showErrorBars
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title="Toggle Error Bars"
                    >
                      ±σ
                    </button>
                  </div>
                </div>

                {/* Recharts Canvas */}
                <div className="h-[320px] w-full my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                      <XAxis
                        dataKey="sin2psi"
                        type="number"
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                        label={{ value: 'sin²ψ (Tilt Angle Coordinate)', position: 'bottom', offset: 0, fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                      />
                      <YAxis
                        dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                        tickFormatter={v => (viewMode === 'dSpacing' ? Number(v).toFixed(4) : Math.round(v).toString())}
                        label={{
                          value: viewMode === 'dSpacing' ? `d-Spacing (${lengthUnit})` : 'Lattice Strain ε_ψ (µε)',
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 11,
                          fill: isDarkMode ? '#cbd5e1' : '#475569',
                          fontWeight: 'bold'
                        }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#090d16' : '#ffffff',
                          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                        formatter={(val: any, name: string) => [
                          viewMode === 'dSpacing' ? `${Number(val).toFixed(5)} ${lengthUnit}` : `${Number(val).toFixed(1)} µε`,
                          name === 'fittedD' || name === 'fittedMicrostrain' ? 'Linear Regression' : 'Measured Peak'
                        ]}
                      />
                      {showUnstressedLine && viewMode === 'dSpacing' && (
                        <ReferenceLine
                          y={convertLength(d0, lengthUnit as LengthUnit)}
                          stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                          strokeDasharray="4 4"
                          label={{
                            value: `d₀ = ${convertLength(d0, lengthUnit as LengthUnit).toFixed(4)} ${lengthUnit}`,
                            position: 'insideTopRight',
                            fontSize: 10,
                            fill: isDarkMode ? '#94a3b8' : '#64748b'
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey={viewMode === 'dSpacing' ? 'fittedD' : 'fittedMicrostrain'}
                        stroke={isDarkMode ? '#818cf8' : '#4f46e5'}
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Scatter
                        dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                        fill={isDarkMode ? '#38bdf8' : '#0284c7'}
                        shape="circle"
                        r={5}
                      >
                        {showErrorBars && (
                          <ErrorBar
                            dataKey={viewMode === 'dSpacing' ? 'errorD' : 'errorMicrostrain'}
                            width={4}
                            strokeWidth={1.5}
                            stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                          />
                        )}
                      </Scatter>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-500">
                    S₁: <strong className="text-slate-800 dark:text-slate-200">{xec.s1.toFixed(2)} TPa⁻¹</strong> | ½S₂: <strong className="text-emerald-600 dark:text-emerald-400">{xec.halfS2.toFixed(2)} TPa⁻¹</strong>
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    Marion-Cohen ψ* = {diagnostics.crossoverPsiDeg.toFixed(2)}°
                  </span>
                </div>
              </div>

              {/* Data Summary (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Active Regression Parameters</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">Plane {activePlane}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Slope (∂d/∂sin²ψ)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {(linearFit.slope * 1000).toFixed(4)} × 10⁻³ {lengthUnit}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Intercept (d_ψ=0)</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {convertLength(linearFit.intercept, lengthUnit as LengthUnit).toFixed(5)} {lengthUnit}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Stress σ_φ</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {stress_MPa.toFixed(1)} ± {stressError_MPa.toFixed(1)} MPa
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Linearity R²</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {linearFit.rSquared.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[280px]">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Tilt Series Angles ({dataPoints.length})
                    </h4>
                  </div>
                  <div className="flex-1 overflow-auto pr-1 custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 z-10 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-1 px-1 text-[10px] text-slate-400">ψ (°)</th>
                          <th className="py-1 px-1 text-[10px] text-slate-400">2θ (°)</th>
                          <th className="py-1 px-1 text-[10px] text-slate-400">d ({lengthUnit})</th>
                          <th className="py-1 px-1 text-[10px] text-slate-400">Strain (µε)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {processedPoints.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-1.5 px-1">{p.psi}°</td>
                            <td className="py-1.5 px-1">{p.twoTheta.toFixed(2)}°</td>
                            <td className="py-1.5 px-1 font-bold text-slate-800 dark:text-slate-200">{convertLength(p.d, lengthUnit as LengthUnit).toFixed(5)}</td>
                            <td className="py-1.5 px-1 text-indigo-600 dark:text-indigo-400 font-bold">{p.microstrain.toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DÖLLE-HAUK ψ-SPLITTING */}
          {activeTab === 'dolle_hauk' && (
            <DolleHaukSplitView
              dolleHauk={dolleHauk}
              d0={d0}
              lengthUnit={lengthUnit}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 3: STRESS TENSOR & MOHR CIRCLE */}
          {activeTab === 'tensor' && (
            <StressTensorVisualizer
              tensor={stressTensor}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 4: DEPTH PROFILING (MOORE-EVANS) */}
          {activeTab === 'depth' && (
            <DepthProfilingWorkbench
              twoTheta0={twoTheta0}
              wavelength={wavelength}
              linearMuCm={linearMuCm}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 5: ASTM COMPLIANCE & REPORT */}
          {activeTab === 'report' && (
            <ResidualStressReport
              analysis={currentAnalysis}
              lengthUnit={lengthUnit}
            />
          )}

          {/* TAB 6: SCATTERING PHYSICS GUIDE */}
          {activeTab === 'guide' && (
            <PhysicsGuideTab />
          )}
        </div>
      )}

      {/* XEC Calculator Modal */}
      <XecCalculatorModal
        isOpen={isXecModalOpen}
        onClose={() => setIsXecModalOpen(false)}
        onApply={(e, nu, s1, halfS2, model, plane) => {
          setYoungsModulus(e);
          setPoissonsRatio(nu);
          setS1Override(s1);
          setHalfS2Override(halfS2);
          setActiveXecModel(model);
          setActivePlane(plane);
        }}
        currentE={youngsModulus}
        currentNu={poissonsRatio}
      />

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                Import XRD Tilt Series Data
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Paste two-column or multi-column data (e.g. <code>Psi [deg], 2Theta [deg], error, intensity, FWHM</code>):
            </p>
            <textarea
              value={rawImportText}
              onChange={e => setRawImportText(e.target.value)}
              placeholder={`-60.0   157.58\n-45.0   157.14\n-30.0   156.76\n0.0     156.40\n30.0    156.78\n45.0    157.15\n60.0    157.60`}
              rows={8}
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
            />
            {importError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                {importError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCSV}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Load Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
