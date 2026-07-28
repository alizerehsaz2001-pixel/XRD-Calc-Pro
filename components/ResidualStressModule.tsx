import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  BarChart2
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

import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';

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

// Reusable animated number component
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 1, className = '' }: { value: number, prefix?: string, suffix?: string, decimals?: number, className?: string }) => {
  return (
    <motion.span 
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
      className={className}
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </motion.span>
  );
};

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
  
  // Material Elastic Properties & Inputs
  const [youngsModulus, setYoungsModulus] = useState<number>(211); // E in GPa
  const [poissonsRatio, setPoissonsRatio] = useState<number>(0.28); // nu
  const [wavelength, setWavelength] = useState<number>(1.54056); // Cu K-alpha
  const [unstressedTwoTheta, setUnstressedTwoTheta] = useState<number>(156.40);
  
  // UI Controls & Toggles
  const [viewMode, setViewMode] = useState<'dSpacing' | 'microstrain'>('dSpacing');
  const [showUnstressedLine, setShowUnstressedLine] = useState<boolean>(true);
  const [showErrorBars, setShowErrorBars] = useState<boolean>(true);
  const [showPeakProfiles, setShowPeakProfiles] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [rawImportText, setRawImportText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Data points (Psi and 2Theta)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { id: 'p1', psi: -60, twoTheta: 157.58, intensity: 820, fwhm: 0.45, error2Theta: 0.015, enabled: true },
    { id: 'p2', psi: -45, twoTheta: 157.14, intensity: 910, fwhm: 0.42, error2Theta: 0.012, enabled: true },
    { id: 'p3', psi: -30, twoTheta: 156.76, intensity: 1050, fwhm: 0.38, error2Theta: 0.010, enabled: true },
    { id: 'p4', psi: -15, twoTheta: 156.51, intensity: 1180, fwhm: 0.36, error2Theta: 0.008, enabled: true },
    { id: 'p5', psi: 0, twoTheta: 156.40, intensity: 1250, fwhm: 0.35, error2Theta: 0.008, enabled: true },
    { id: 'p6', psi: 15, twoTheta: 156.52, intensity: 1160, fwhm: 0.36, error2Theta: 0.008, enabled: true },
    { id: 'p7', psi: 30, twoTheta: 156.78, intensity: 1020, fwhm: 0.39, error2Theta: 0.010, enabled: true },
    { id: 'p8', psi: 45, twoTheta: 157.15, intensity: 880, fwhm: 0.43, error2Theta: 0.012, enabled: true },
    { id: 'p9', psi: 60, twoTheta: 157.60, intensity: 790, fwhm: 0.46, error2Theta: 0.015, enabled: true },
  ]);

  const loadPreset = (preset: MaterialPreset) => {
    setYoungsModulus(preset.E);
    setPoissonsRatio(preset.nu);
    setWavelength(preset.wavelength);
    setUnstressedTwoTheta(preset.twoTheta0);
    setDataPoints(preset.defaultData.map((d, idx) => ({
      id: 'p' + idx + '_' + Date.now(),
      psi: d.psi,
      twoTheta: d.twoTheta,
      intensity: d.intensity || 1000,
      fwhm: d.fwhm || 0.40,
      error2Theta: 0.010,
      enabled: true
    })));
  };

  // Advanced Analysis Engine
  const analysisResult = useMemo(() => {
    const activePoints = dataPoints.filter(p => p.enabled);
    if (activePoints.length < 2) return null;
    
    // Unstressed reference lattice parameter
    const theta0Rad = (unstressedTwoTheta / 2) * (Math.PI / 180);
    const d0 = wavelength / (2 * Math.sin(theta0Rad));
    
    // Convert 2Theta to d-spacing and sin^2(psi)
    const processedPoints = activePoints.map(p => {
      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
      const d = wavelength / (2 * Math.sin(thetaRad));
      const psiRad = p.psi * (Math.PI / 180);
      const sin2psi = Math.sin(psiRad) ** 2;
      const sin2absPsi = Math.sin(2 * Math.abs(psiRad));
      
      // Error propagation for d-spacing error:
      // d = wavelength / (2 * sin(theta))
      // delta_d = | - (wavelength * cos(theta) / (2 * sin^2(theta))) | * delta_theta_rad
      const errRad = ((p.error2Theta || 0.01) / 2) * (Math.PI / 180);
      const errorD = (wavelength * Math.cos(thetaRad) / (2 * (Math.sin(thetaRad) ** 2))) * errRad;
      const errorMicrostrain = (errorD / d0) * 1e6;
      
      const strain = (d - d0) / d0;
      const microstrain = strain * 1e6;
      
      return {
        ...p,
        d,
        errorD,
        sin2psi,
        sin2absPsi,
        strain,
        microstrain,
        errorMicrostrain
      };
    });
    
    // Sort by sin2psi
    const sortedPoints = [...processedPoints].sort((a, b) => a.sin2psi - b.sin2psi);
    
    // Linear regression for d vs sin^2(psi)
    const n = sortedPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    sortedPoints.forEach(p => {
      sumX += p.sin2psi;
      sumY += p.d;
      sumXY += p.sin2psi * p.d;
      sumXX += p.sin2psi * p.sin2psi;
    });
    
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    // Fit statistics & R-squared
    const meanY = sumY / n;
    let ssTot = 0, ssRes = 0;
    sortedPoints.forEach(p => {
      ssTot += (p.d - meanY) ** 2;
      const predictedY = slope * p.sin2psi + intercept;
      ssRes += (p.d - predictedY) ** 2;
    });
    
    const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));
    const syx = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
    const sSlope = n > 2 && (n * sumXX - sumX * sumX) > 0 
      ? syx * Math.sqrt(n / (n * sumXX - sumX * sumX)) 
      : 0;
    
    // Principal Stress calculation
    // slope (m) = d0 * ( (1 + nu) / E ) * sigma
    // sigma = m * E / ( d0 * (1 + nu) )
    const E_MPa = youngsModulus * 1000;
    const stress_MPa = (slope * E_MPa) / (d0 * (1 + poissonsRatio));
    const stressError_MPa = (sSlope * E_MPa) / (d0 * (1 + poissonsRatio));

    // Psi-Splitting / Shear Stress analysis (tau_13)
    // Group points by matching positive and negative psi angles
    const psiMap = new Map<number, { posD?: number; negD?: number }>();
    sortedPoints.forEach(p => {
      const absPsi = Math.abs(p.psi);
      if (absPsi === 0) return;
      const curr = psiMap.get(absPsi) || {};
      if (p.psi > 0) curr.posD = p.d;
      else if (p.psi < 0) curr.negD = p.d;
      psiMap.set(absPsi, curr);
    });

    let shearStress_MPa = 0;
    let hasPsiSplitting = false;
    let psiSplitPairsCount = 0;
    let sumX_shear = 0, sumY_shear = 0, sumXY_shear = 0, sumXX_shear = 0;

    psiMap.forEach((val, absPsi) => {
      if (val.posD !== undefined && val.negD !== undefined) {
        psiSplitPairsCount++;
        const sin2absPsi = Math.sin(2 * (absPsi * Math.PI / 180));
        const diffD = (val.posD - val.negD) / 2;
        sumX_shear += sin2absPsi;
        sumY_shear += diffD;
        sumXY_shear += sin2absPsi * diffD;
        sumXX_shear += sin2absPsi * sin2absPsi;
      }
    });

    if (psiSplitPairsCount >= 2 && (psiSplitPairsCount * sumXX_shear - sumX_shear * sumX_shear) !== 0) {
      const shearSlope = (psiSplitPairsCount * sumXY_shear - sumX_shear * sumY_shear) / (psiSplitPairsCount * sumXX_shear - sumX_shear * sumX_shear);
      shearStress_MPa = (shearSlope * E_MPa) / (d0 * (1 + poissonsRatio));
      hasPsiSplitting = Math.abs(shearStress_MPa) > 15;
    }

    // Prepare chart data with fitted values and error bounds
    const chartData = sortedPoints.map(p => {
      const fittedD = slope * p.sin2psi + intercept;
      const fittedMicrostrain = ((fittedD - d0) / d0) * 1e6;
      
      return {
        id: p.id,
        name: `${p.psi}°`,
        psi: p.psi,
        sin2psi: p.sin2psi,
        dSpacing: p.d,
        errorD: p.errorD,
        dSpacingMin: p.d - p.errorD,
        dSpacingMax: p.d + p.errorD,
        fittedD: fittedD,
        microstrain: p.microstrain,
        errorMicrostrain: p.errorMicrostrain,
        microstrainMin: p.microstrain - p.errorMicrostrain,
        microstrainMax: p.microstrain + p.errorMicrostrain,
        fittedMicrostrain: fittedMicrostrain,
        intensity: p.intensity,
        fwhm: p.fwhm
      };
    });

    return {
      d0,
      slope,
      intercept,
      rSquared,
      syx,
      sSlope,
      stress_MPa,
      stressError_MPa,
      stressType: stress_MPa > 0 ? 'Tensile' : 'Compressive',
      shearStress_MPa,
      hasPsiSplitting,
      psiSplitPairsCount,
      chartData
    };
  }, [dataPoints, youngsModulus, poissonsRatio, wavelength, unstressedTwoTheta]);

  const addPoint = () => {
    const last = dataPoints[dataPoints.length - 1];
    const newPsi = last ? Math.min(90, last.psi + 15) : 0;
    setDataPoints([...dataPoints, { 
      id: 'p' + Date.now(), 
      psi: newPsi, 
      twoTheta: last ? last.twoTheta : unstressedTwoTheta,
      intensity: 1000,
      fwhm: 0.40,
      error2Theta: 0.010,
      enabled: true
    }]);
  };

  const removePoint = (id: string) => {
    setDataPoints(dataPoints.filter(p => p.id !== id));
  };

  const togglePointEnabled = (id: string) => {
    setDataPoints(dataPoints.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const updatePoint = (id: string, field: keyof DataPoint, value: any) => {
    setDataPoints(dataPoints.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Process raw pasted text into diffraction data
  const handleBatchImport = () => {
    setImportError(null);
    if (!rawImportText.trim()) {
      setImportError('Please paste or type measurement lines.');
      return;
    }

    const lines = rawImportText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#') && !l.toLowerCase().startsWith('psi'));
    const parsed: DataPoint[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(/[\s,\t]+/).map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        parsed.push({
          id: `imp_${i}_${Date.now()}`,
          psi: parts[0],
          twoTheta: parts[1],
          intensity: parts[2] && !isNaN(parts[2]) ? parts[2] : 1000,
          fwhm: parts[3] && !isNaN(parts[3]) ? parts[3] : 0.40,
          error2Theta: parts[4] && !isNaN(parts[4]) ? parts[4] : 0.010,
          enabled: true
        });
      }
    }

    if (parsed.length < 2) {
      setImportError('Could not parse at least 2 valid data rows. Expected format: Psi 2Theta [Intensity] [FWHM] [Error]');
      return;
    }

    setDataPoints(parsed);
    setIsImportModalOpen(false);
    setRawImportText('');
  };

  // Export current diffraction dataset as CSV
  const exportAsCSV = () => {
    const headers = 'psi_deg,two_theta_deg,intensity_au,fwhm_deg,error_2theta_deg,enabled\n';
    const rows = dataPoints.map(p => `${p.psi},${p.twoTheta},${p.intensity},${p.fwhm},${p.error2Theta},${p.enabled}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diffraction_residual_stress_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy LaTeX / ASCII report summary
  const copyReportSummary = () => {
    if (!analysisResult) return;
    const report = `=== RESIDUAL STRESS DIFFRACTION REPORT ===
Material Elastic Modulus (E): ${youngsModulus} GPa
Poisson's Ratio (ν): ${poissonsRatio}
Wavelength (λ): ${wavelength} Å
Unstressed 2θ₀: ${unstressedTwoTheta}° (d₀ = ${analysisResult.d0.toFixed(5)} Å)

=== RESULTS ===
Principal Stress (σ₁₁): ${analysisResult.stress_MPa.toFixed(1)} ± ${analysisResult.stressError_MPa.toFixed(1)} MPa (${analysisResult.stressType})
Shear Stress (τ₁₃): ${analysisResult.shearStress_MPa.toFixed(1)} MPa
Fit Quality (R²): ${analysisResult.rSquared.toFixed(4)}
Slope (m): ${(analysisResult.slope * 1000).toFixed(4)} × 10⁻³ Å

Active Diffraction Points: ${dataPoints.filter(p => p.enabled).length}`;

    navigator.clipboard.writeText(report);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // Render Lattice Box Diagram
  const renderLatticeBox = () => {
    if (!analysisResult) return null;
    const isTensile = analysisResult.stress_MPa > 0;
    const maxStress = 1200; // Scaling denominator
    const intensity = Math.min(Math.abs(analysisResult.stress_MPa) / maxStress, 1);
    
    const scaleX = isTensile ? 1 + (0.35 * intensity) : 1 - (0.35 * intensity);
    const scaleY = isTensile ? 1 - (0.12 * intensity) : 1 + (0.12 * intensity);
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        <motion.div 
          animate={{ scaleX, scaleY }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className={`w-16 h-16 border-[3px] flex items-center justify-center rounded-xl ${
            isTensile 
              ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)]' 
              : 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-current opacity-60" />
        </motion.div>
        
        {/* Force Direction Vectors */}
        <motion.div 
          animate={{ x: isTensile ? 32 * intensity : -16 * intensity, opacity: intensity > 0.05 ? 1 : 0 }}
          className={`absolute left-[50%] ml-10 text-2xl font-black ${isTensile ? 'text-rose-500' : 'text-blue-500'}`}
        >
          {isTensile ? '→' : '←'}
        </motion.div>
        <motion.div 
          animate={{ x: isTensile ? -32 * intensity : 16 * intensity, opacity: intensity > 0.05 ? 1 : 0 }}
          className={`absolute right-[50%] mr-10 text-2xl font-black ${isTensile ? 'text-rose-500' : 'text-blue-500'}`}
        >
          {isTensile ? '←' : '→'}
        </motion.div>
      </div>
    );
  };

  // Generate synthetic Gaussian-Lorentzian Pseudo-Voigt peak profile data for Stacked Inspector
  const generatedPeakProfiles = useMemo(() => {
    if (!showPeakProfiles) return [];
    
    const activePoints = dataPoints.filter(p => p.enabled);
    if (activePoints.length === 0) return [];

    // Find min and max 2theta for range
    const allTwoThetas = activePoints.map(p => p.twoTheta);
    const min2T = Math.min(...allTwoThetas, unstressedTwoTheta) - 1.2;
    const max2T = Math.max(...allTwoThetas, unstressedTwoTheta) + 1.2;
    const steps = 120;
    const stepSize = (max2T - min2T) / steps;

    const profileData = [];

    for (let i = 0; i <= steps; i++) {
      const tt = min2T + i * stepSize;
      const pointObj: any = { twoTheta: tt };

      // Reference peak 2Theta0
      const sig0 = 0.35 / 2.355;
      const refInt = 100 * Math.exp(-Math.pow(tt - unstressedTwoTheta, 2) / (2 * sig0 * sig0));
      pointObj['refPeak'] = refInt;

      activePoints.forEach(p => {
        const sig = (p.fwhm || 0.40) / 2.355;
        const normHeight = ((p.intensity || 1000) / 1250) * 100;
        const peakVal = normHeight * Math.exp(-Math.pow(tt - p.twoTheta, 2) / (2 * sig * sig));
        pointObj[`peak_${p.psi}`] = peakVal;
      });

      profileData.push(pointObj);
    }

    return profileData;
  }, [dataPoints, unstressedTwoTheta, showPeakProfiles]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Enhanced Header Panel */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none mix-blend-screen">
          <Activity className="w-64 h-64 text-indigo-400" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              Diffraction Strain & Stress Core
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Residual Stress Analyzer
            </h2>
            <p className="text-indigo-200/80 text-sm md:text-base font-medium leading-relaxed">
              Determine macroscopic residual stresses (tensile, compressive & shear) in industrial components via <span className="text-white font-bold">sin²ψ Bragg diffraction peak shifts</span> with full uncertainty propagation.
            </p>
          </div>
          
          {/* Quick Material Presets Menu */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 w-full md:w-auto">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Material & Alloy Presets
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-2">
              {MATERIAL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset)}
                  className="px-3 py-2 bg-white/5 hover:bg-indigo-500/30 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-white/5 transition-all text-left flex flex-col gap-0.5 active:scale-95 group"
                >
                  <span className="truncate w-full font-bold">{preset.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-indigo-400/80 group-hover:text-indigo-300 font-mono">{preset.plane} reflection</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Settings & Diffraction Dataset (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Elastic Constants Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 relative z-10">
              <Scale className="w-5 h-5 text-indigo-500" />
              Elastic Constants & Baseline Parameters
            </h3>
            
            <div className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between items-center">
                  <span>Young's Modulus (E)</span>
                  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg font-mono text-xs">{youngsModulus} GPa</span>
                </label>
                <input
                  type="range"
                  min="40"
                  max="600"
                  step="1"
                  value={youngsModulus}
                  onChange={e => setYoungsModulus(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between items-center">
                  <span>Poisson's Ratio (ν)</span>
                  <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg font-mono text-xs">{poissonsRatio.toFixed(3)}</span>
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="0.48"
                  step="0.005"
                  value={poissonsRatio}
                  onChange={e => setPoissonsRatio(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Wavelength λ ({lengthUnit})
                  </label>
                  <input 
                    type="number"
                    step="0.0001"
                    value={convertLength(wavelength, lengthUnit)}
                    onChange={e => setWavelength(convertToAngstrom(Number(e.target.value), lengthUnit))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Stress-Free 2θ₀ (°)
                  </label>
                  <input 
                    type="number"
                    step="0.005"
                    value={unstressedTwoTheta}
                    onChange={e => setUnstressedTwoTheta(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Data Entry & Management Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[460px]">
            <div className="flex items-center justify-between mb-4 shrink-0 flex-wrap gap-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Diffraction Data Points ({dataPoints.filter(p => p.enabled).length}/{dataPoints.length})
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  title="Import dataset or paste CSV/text"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import
                </button>

                <button
                  onClick={exportAsCSV}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                  title="Export data as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export
                </button>

                <button 
                  onClick={addPoint}
                  className="px-3 py-1.5 bg-blue-500 text-white hover:bg-blue-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
                  <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                    <th className="py-2.5 px-1.5 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px] w-8 text-center">On</th>
                    <th className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">ψ Tilt (°)</th>
                    <th className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">Peak 2θ (°)</th>
                    <th className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">±Err (°)</th>
                    <th className="py-2.5 px-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px] text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <AnimatePresence>
                    {dataPoints.map((point) => (
                      <motion.tr 
                        key={point.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${!point.enabled ? 'opacity-40 line-through' : ''}`}
                      >
                        <td className="py-2 px-1 text-center">
                          <input
                            type="checkbox"
                            checked={point.enabled}
                            onChange={() => togglePointEnabled(point.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            title="Toggle point inclusion"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={point.psi}
                            onChange={(e) => updatePoint(point.id, 'psi', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.001"
                            value={point.twoTheta}
                            onChange={(e) => updatePoint(point.id, 'twoTheta', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            step="0.001"
                            value={point.error2Theta}
                            onChange={(e) => updatePoint(point.id, 'error2Theta', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none text-slate-600 dark:text-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => removePoint(point.id)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors"
                            title="Delete point"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {dataPoints.length === 0 && (
                <div className="py-12 text-center text-sm font-medium text-slate-500 flex flex-col items-center gap-2">
                  <Activity className="w-8 h-8 opacity-20" />
                  No measurement data points present.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visualization, Stress Results & Graphs (7 cols) */}
        <div className="xl:col-span-7 space-y-6 flex flex-col">
          
          {/* Top Result Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Stress Metric Card */}
            <div className={`sm:col-span-2 p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-center transition-colors duration-500 ${
              analysisResult 
                ? (analysisResult.stress_MPa > 0 
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                  : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50')
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              {/* Background Lattice Box Animation */}
              <div className="absolute right-6 top-0 bottom-0 w-32 opacity-25 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
                {renderLatticeBox()}
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    Principal Residual Stress (σ₁₁)
                  </div>
                  <button
                    onClick={copyReportSummary}
                    className="px-2 py-1 bg-white/60 dark:bg-black/40 hover:bg-white dark:hover:bg-black text-[10px] font-bold rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-1 transition-all"
                  >
                    {copiedNotification ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    {copiedNotification ? 'Copied' : 'Report'}
                  </button>
                </div>

                <div className="flex items-baseline gap-3">
                  <div className={`text-5xl md:text-6xl font-black tracking-tighter ${
                    analysisResult 
                      ? (analysisResult.stress_MPa > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400')
                      : 'text-slate-400'
                  }`}>
                    {analysisResult ? <AnimatedNumber value={Math.abs(analysisResult.stress_MPa)} decimals={1} /> : '---'}
                  </div>
                  <div className={`text-lg font-bold ${
                    analysisResult 
                      ? (analysisResult.stress_MPa > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400')
                      : 'text-slate-400'
                  }`}>
                    MPa
                  </div>
                  {analysisResult && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
                      ± {analysisResult.stressError_MPa.toFixed(1)} MPa
                    </span>
                  )}
                </div>
                
                {analysisResult && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm ${
                      analysisResult.stress_MPa > 0
                        ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800'
                        : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
                    }`}>
                      {analysisResult.stress_MPa > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {analysisResult.stressType} Strain
                    </motion.div>

                    {analysisResult.hasPsiSplitting && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60">
                        <Split className="w-3.5 h-3.5 text-amber-500" />
                        Psi-Split Shear τ₁₃ = {analysisResult.shearStress_MPa.toFixed(1)} MPa
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Regression Fit Metrics */}
            <div className="flex flex-col gap-4">
              <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-center relative overflow-hidden group">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 relative z-10">
                  Fit Quality (R²)
                </div>
                <div className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tighter relative z-10">
                  {analysisResult ? <AnimatedNumber value={analysisResult.rSquared} decimals={4} /> : '---'}
                </div>
                {analysisResult && analysisResult.rSquared < 0.90 && (
                   <div className="text-[10px] text-amber-500 font-bold mt-1 relative z-10 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" /> Nonlinearity detected
                   </div>
                )}
              </div>
              <div className="bg-white dark:bg-slate-900 p-4.5 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-center relative overflow-hidden group">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 relative z-10">
                  Slope m (Å / sin²ψ)
                </div>
                <div className="text-xl font-black text-slate-700 dark:text-slate-300 font-mono tracking-tighter relative z-10 flex items-baseline">
                  {analysisResult ? <AnimatedNumber value={analysisResult.slope * 1000} decimals={3} /> : '---'}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">×10⁻³ {lengthUnit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chart Plot Container */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col flex-1 min-h-[420px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-indigo-500" />
                {viewMode === 'dSpacing' ? 'Interplanar d-Spacing' : 'Microstrain'} vs sin²ψ Plot
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowErrorBars(!showErrorBars)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    showErrorBars 
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="Toggle error bars on points"
                >
                  ± Error Bars
                </button>

                <button
                  onClick={() => setShowPeakProfiles(!showPeakProfiles)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    showPeakProfiles 
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400' 
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="Toggle stacked diffraction peak profiles"
                >
                  <BarChart2 className="w-3.5 h-3.5 inline mr-1" />
                  Peak Profiles
                </button>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('dSpacing')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'dSpacing'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    d ({lengthUnit})
                  </button>
                  <button
                    onClick={() => setViewMode('microstrain')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      viewMode === 'microstrain'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    με
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full relative min-h-[300px]">
              {analysisResult && analysisResult.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={analysisResult.chartData}
                    margin={{ top: 15, right: 20, bottom: 25, left: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis 
                      dataKey="sin2psi" 
                      type="number"
                      domain={[0, 'auto']}
                      tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#e2e8f0', strokeWidth: 2 }}
                      label={{ value: 'sin²ψ', position: 'bottom', offset: 5, fill: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 12, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                      type="number"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                      tickLine={false}
                      tickFormatter={(val) => viewMode === 'dSpacing' ? val.toFixed(4) : Math.round(val).toString()}
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#e2e8f0', strokeWidth: 2 }}
                      label={{ 
                        value: viewMode === 'dSpacing' ? `Interplanar d (${lengthUnit})` : 'Microstrain (με)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -5, 
                        fill: isDarkMode ? '#cbd5e1' : '#475569', 
                        fontSize: 12, 
                        fontWeight: 'bold' 
                      }}
                    />
                    <RechartsTooltip
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(value: number, name: string, item: any) => {
                        if (viewMode === 'dSpacing') {
                          if (name === 'dSpacing') return [`${convertLength(value, lengthUnit).toFixed(5)} ${lengthUnit} (ψ=${item.payload.psi}°)`, 'Measured d'];
                          if (name === 'fittedD') return [`${convertLength(value, lengthUnit).toFixed(5)} ${lengthUnit}`, 'Linear Fit'];
                        } else {
                          if (name === 'microstrain') return [`${value.toFixed(1)} με (ψ=${item.payload.psi}°)`, 'Measured Strain'];
                          if (name === 'fittedMicrostrain') return [`${value.toFixed(1)} με`, 'Linear Fit Strain'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `sin²ψ = ${Number(label).toFixed(3)}`}
                    />

                    {/* Baseline d0 Reference Line */}
                    {showUnstressedLine && (
                      <ReferenceLine 
                        yAxisId="left" 
                        y={viewMode === 'dSpacing' ? analysisResult.d0 : 0} 
                        stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{ 
                          value: viewMode === 'dSpacing' ? `d₀ = ${convertLength(analysisResult.d0, lengthUnit).toFixed(4)} ${lengthUnit}` : 'd₀ Baseline (0 με)', 
                          fill: isDarkMode ? '#94a3b8' : '#64748b', 
                          fontSize: 11, 
                          position: 'insideTopLeft',
                          fontWeight: 'bold' 
                        }} 
                      />
                    )}

                    {/* Filled Strain Area */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey={viewMode === 'dSpacing' ? 'fittedD' : 'fittedMicrostrain'}
                      baseLine={viewMode === 'dSpacing' ? analysisResult.d0 : 0}
                      fill={analysisResult.stress_MPa > 0 ? 'url(#colorTensile)' : 'url(#colorCompressive)'}
                      fillOpacity={0.2}
                      stroke="none"
                      isAnimationActive={true}
                    />
                    
                    <defs>
                      <linearGradient id="colorTensile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? '#fb7185' : '#e11d48'} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={isDarkMode ? '#fb7185' : '#e11d48'} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompressive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? '#60a5fa' : '#2563eb'} stopOpacity={0}/>
                        <stop offset="95%" stopColor={isDarkMode ? '#60a5fa' : '#2563eb'} stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>

                    <Line
                      yAxisId="left"
                      dataKey={viewMode === 'dSpacing' ? 'fittedD' : 'fittedMicrostrain'}
                      stroke={analysisResult.stress_MPa > 0 ? (isDarkMode ? '#fb7185' : '#e11d48') : (isDarkMode ? '#60a5fa' : '#2563eb')}
                      strokeWidth={3}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={true}
                    />

                    {/* Scatter Points with optional Error Bars */}
                    <Scatter
                      yAxisId="left"
                      dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                      fill={isDarkMode ? '#e2e8f0' : '#0f172a'}
                      line={false}
                      shape="circle"
                      r={5}
                    >
                      {showErrorBars && (
                        <ErrorBar 
                          dataKey={viewMode === 'dSpacing' ? 'errorD' : 'errorMicrostrain'} 
                          width={4} 
                          strokeWidth={1.5} 
                          stroke={isDarkMode ? '#94a3b8' : '#475569'} 
                        />
                      )}
                    </Scatter>
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="text-center space-y-3">
                    <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Enable at least 2 diffraction data points to generate plot
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Legend / Plot Controls Footer */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-200" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Measured (ψ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-3.5 border-t-2 rounded-full ${analysisResult?.stress_MPa > 0 ? 'border-rose-500' : 'border-blue-500'}`} />
                  <span className="font-bold text-[10px] uppercase tracking-wider">Linear Regression</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 border-t border-dashed border-slate-400" />
                  <span className="font-bold text-[10px] uppercase tracking-wider">d₀ Reference</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Stacked Peak Profile Inspector */}
          {showPeakProfiles && generatedPeakProfiles.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-500" />
                  Diffraction Peak Shift Inspector (2θ Peak Profiles at Tilt Angles)
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Pseudo-Voigt Fit Simulation
                </span>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={generatedPeakProfiles} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis 
                      dataKey="twoTheta" 
                      tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      tickFormatter={(val) => Number(val).toFixed(2)}
                      label={{ value: 'Diffraction Angle 2θ (°)', position: 'bottom', offset: 0, fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      label={{ value: 'Relative Intensity', angle: -90, position: 'insideLeft', fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                    />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [Number(value).toFixed(1), name === 'refPeak' ? 'd₀ Reference Peak' : `ψ = ${name.replace('peak_', '')}°`]}
                      labelFormatter={(label) => `2θ = ${Number(label).toFixed(3)}°`}
                    />
                    
                    {/* Stress-Free 2Theta0 Reference Peak */}
                    <Line 
                      type="monotone" 
                      dataKey="refPeak" 
                      stroke="#94a3b8" 
                      strokeDasharray="3 3" 
                      strokeWidth={1.5} 
                      dot={false} 
                      name="refPeak"
                    />

                    {/* Individual Peak Lines per Psi */}
                    {dataPoints.filter(p => p.enabled).map((p, idx) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
                      const strokeColor = colors[idx % colors.length];
                      return (
                        <Line
                          key={p.id}
                          type="monotone"
                          dataKey={`peak_${p.psi}`}
                          stroke={strokeColor}
                          strokeWidth={2}
                          dot={false}
                        />
                      );
                    })}
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-500" />
                  Import Diffraction Dataset
                </h3>
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Paste space-, comma-, or tab-separated diffraction measurements. Each line represents one tilt angle:
                <br />
                <code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded mt-1 inline-block text-indigo-600 dark:text-indigo-400">
                  Psi_deg  TwoTheta_deg  [Intensity]  [FWHM]  [Error]
                </code>
              </p>

              <textarea
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                placeholder={`-60  157.58  820  0.45  0.015\n-45  157.14  910  0.42  0.012\n-30  156.76  1050 0.38  0.010\n0    156.40  1250 0.35  0.008\n30   156.78  1020 0.39  0.010\n60   157.60  790  0.46  0.015`}
                rows={8}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
              />

              {importError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {importError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchImport}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Import Dataset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Interactive Sensitivity & Interpretation Guide */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <h3 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-indigo-200 relative z-10">
          <Layers className="w-6 h-6 text-indigo-400" />
          Diffraction Graph & Stress Physics Guide
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Factor 1: Stress Magnitude & Sign */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 text-rose-400 text-sm font-black uppercase tracking-wider mb-4">
              <div className="p-2 bg-rose-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              Slope (m) ➔ Normal Stress (σ₁₁)
            </div>
            <div className="text-sm text-indigo-100/70 leading-relaxed space-y-2">
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-rose-400/50" /> <span className="block"><strong className="text-white">Tensile (σ₁₁ &gt; 0):</strong> Positive slope (line tilts upward). Interplanar spacing d increases at higher tilt ψ.</span></span>
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-rose-400/50" /> <span className="block"><strong className="text-white">Compressive (σ₁₁ &lt; 0):</strong> Negative slope (line tilts downward). Surface lattice planes contract under compression.</span></span>
            </div>
          </div>

          {/* Factor 2: Psi-Splitting Shear Stress */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 text-amber-400 text-sm font-black uppercase tracking-wider mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <Split className="w-5 h-5" />
              </div>
              Psi-Splitting ➔ Shear Stress (τ₁₃)
            </div>
            <div className="text-sm text-indigo-100/70 leading-relaxed space-y-2">
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400/50" /> <span className="block"><strong className="text-white">Shear Vector:</strong> When surface shear stresses exist, positive (+ψ) and negative (-ψ) tilt branches split apart into an elliptical loop.</span></span>
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400/50" /> <span className="block"><strong className="text-white">Shear Magnitude:</strong> τ₁₃ is derived directly from the slope of (d₊ - d₋)/2 vs sin(2|ψ|).</span></span>
            </div>
          </div>

          {/* Factor 3: Elastic Constants E and nu */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 text-indigo-400 text-sm font-black uppercase tracking-wider mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              Elastic Constants (E, ν)
            </div>
            <div className="text-sm text-indigo-100/70 leading-relaxed space-y-2">
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400/50" /> <span className="block"><strong className="text-white">Young's Modulus (E):</strong> Stiffer materials require larger lattice strain to reach identical stress levels.</span></span>
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400/50" /> <span className="block"><strong className="text-white">Uncertainty Propagation:</strong> Peak position error ±Δ2θ translates directly to standard stress error ±Δσ.</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
