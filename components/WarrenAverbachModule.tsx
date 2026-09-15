import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseWAInput, calculateWarrenAverbach } from '../utils/physics';
import { WAResult, WAMetrics } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import { DislocationMetricsVisualizer } from './DislocationMetricsVisualizer';
import { WarrenAverbachMetricsSummary } from './WarrenAverbachMetricsSummary';
import { WarrenAverbachPeakConverterModal } from './WarrenAverbachPeakConverterModal';
import { WhatDoesThisMeanTooltip } from './common/WhatDoesThisMeanTooltip';
import { GuidedWalkthroughWizard, WizardStep } from './common/GuidedWalkthroughWizard';
import { PhysicalMeaningSummary } from './common/PhysicalMeaningSummary';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine
} from 'recharts';
import {  
  Info, 
  BookOpen, 
  Activity, 
  TrendingDown, 
  Sparkles, 
  Loader2, 
  Atom, 
  Binary, 
  Ruler, 
  Zap, 
  Database, 
  Settings, 
  FlaskConical, 
  Network, 
  ChevronDown, 
  RefreshCw, 
  Trash2, 
  Download, 
  Layers,
  Wand2,
  Sliders,
  BarChart3,
  GitBranch,
  ShieldCheck,
  Flame,
  FileText,
  Copy,
  Check,
  Code,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MaterialPreset {
  label: string;
  d1: number;
  d2: number;
  d3?: number;
  d4?: number;
  burgersVector: number; // nm
  youngsModulus: number; // GPa
  contrastFactor?: number;
  desc: string;
  data: string;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  { 
    label: 'Gold (Au) Nanocrystals', 
    d1: 2.3551, 
    d2: 1.1776,
    d3: 0.7850,
    d4: 0.5888,
    burgersVector: 0.288,
    youngsModulus: 78,
    contrastFactor: 0.304,
    desc: 'FCC (111), (222), (333), and (444) harmonics',
    data: `# L[nm], A(d1), A(d2), A(d3), A(d4)
1, 0.985, 0.952, 0.910, 0.865
2, 0.960, 0.895, 0.820, 0.742
3, 0.932, 0.835, 0.730, 0.628
4, 0.901, 0.774, 0.640, 0.525
5, 0.868, 0.712, 0.555, 0.435
6, 0.832, 0.650, 0.475, 0.355
8, 0.755, 0.530, 0.335, 0.220
10, 0.680, 0.425, 0.225, 0.125
12, 0.605, 0.330, 0.145, 0.065
15, 0.500, 0.215, 0.070, 0.020
20, 0.360, 0.095, 0.015, 0.002
25, 0.240, 0.035, 0.002, 0.000`
  },
  { 
    label: 'Copper (Cu) ECAP Deformed', 
    d1: 2.0871, 
    d2: 1.0435,
    d3: 0.6957,
    burgersVector: 0.256,
    youngsModulus: 128,
    contrastFactor: 0.304,
    desc: 'High dislocation density FCC (111)/(222)/(333)',
    data: `# L[nm], A(d1), A(d2), A(d3)
1, 0.970, 0.885, 0.810
2, 0.925, 0.770, 0.655
3, 0.875, 0.665, 0.520
4, 0.820, 0.570, 0.405
5, 0.765, 0.485, 0.315
6, 0.710, 0.410, 0.240
8, 0.605, 0.285, 0.135
10, 0.510, 0.190, 0.070
15, 0.330, 0.065, 0.012
20, 0.200, 0.015, 0.001
25, 0.110, 0.002, 0.000`
  },
  { 
    label: 'Titanium (Ti) Grade 2 (HCP)', 
    d1: 2.5570, 
    d2: 1.2785, 
    d3: 0.8523,
    burgersVector: 0.295,
    youngsModulus: 105,
    contrastFactor: 0.250,
    desc: 'HCP prismatic (100), (200), (300) harmonics',
    data: `# L[nm], A(d1), A(d2), A(d3)
1, 0.982, 0.930, 0.875
2, 0.950, 0.860, 0.760
3, 0.915, 0.790, 0.650
4, 0.878, 0.720, 0.550
5, 0.835, 0.655, 0.460
6, 0.790, 0.590, 0.380
8, 0.700, 0.470, 0.250
10, 0.615, 0.365, 0.155
15, 0.430, 0.170, 0.035
20, 0.285, 0.065, 0.005`
  },
  { 
    label: 'Silicon (Si) SRM 640', 
    d1: 3.1355, 
    d2: 1.5678, 
    burgersVector: 0.384,
    youngsModulus: 130,
    desc: 'NIST Standard low-strain (111)/(222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.995, 0.988
2, 0.988, 0.972
3, 0.980, 0.954
4, 0.971, 0.935
5, 0.962, 0.915
8, 0.930, 0.850
10, 0.905, 0.805
15, 0.835, 0.685
20, 0.755, 0.560
25, 0.670, 0.440
30, 0.585, 0.330`
  },
  { 
    label: 'Nickel (Ni) Ball-Milled', 
    d1: 2.0340, 
    d2: 1.0170, 
    burgersVector: 0.249,
    youngsModulus: 200,
    desc: 'Nanocrystalline Ni (111) & (222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.965, 0.870
2, 0.915, 0.745
3, 0.860, 0.630
4, 0.800, 0.525
5, 0.740, 0.435
8, 0.580, 0.235
10, 0.485, 0.145
15, 0.300, 0.040
20, 0.175, 0.008`
  },
  { 
    label: 'Stainless Steel 316L', 
    d1: 2.0780, 
    d2: 1.0390, 
    burgersVector: 0.254,
    youngsModulus: 193,
    desc: 'Austenitic work-hardened (111)/(222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.960, 0.880
2, 0.910, 0.765
3, 0.855, 0.655
4, 0.798, 0.552
5, 0.740, 0.460
8, 0.585, 0.260
10, 0.490, 0.170
15, 0.315, 0.055
20, 0.190, 0.012`
  },
  { 
    label: 'Tungsten (W) Heavy Alloy', 
    d1: 2.2380, 
    d2: 1.1190, 
    burgersVector: 0.274,
    youngsModulus: 411,
    desc: 'BCC Refractory (110) & (220)',
    data: `# L[nm], A(d1), A(d2)
1, 0.975, 0.920
2, 0.940, 0.835
3, 0.900, 0.745
4, 0.855, 0.655
5, 0.810, 0.575
8, 0.680, 0.380
10, 0.595, 0.280
15, 0.420, 0.120
20, 0.285, 0.040`
  },
  { 
    label: 'Ceria (CeO2) Catalyst', 
    d1: 3.1240, 
    d2: 1.5620, 
    burgersVector: 0.383,
    youngsModulus: 220,
    desc: 'Fluorite oxide nanocrystals (111)/(222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.975, 0.930
2, 0.935, 0.845
3, 0.885, 0.750
4, 0.835, 0.660
5, 0.780, 0.575
8, 0.630, 0.370
10, 0.535, 0.265
15, 0.350, 0.105
20, 0.215, 0.030`
  },
  { 
    label: 'Zinc Oxide (ZnO) Nanorods', 
    d1: 2.8140, 
    d2: 1.4070, 
    burgersVector: 0.325,
    youngsModulus: 140,
    desc: 'Wurtzite hexagonal (100)/(200)',
    data: `# L[nm], A(d1), A(d2)
1, 0.970, 0.920
2, 0.930, 0.830
3, 0.880, 0.735
4, 0.825, 0.640
5, 0.770, 0.550
8, 0.615, 0.340
10, 0.515, 0.230
15, 0.320, 0.075`
  }
];

export const WarrenAverbachModule: React.FC = () => {
  const [d1, setD1] = useState<number>(MATERIAL_PRESETS[0].d1);
  const [d2, setD2] = useState<number>(MATERIAL_PRESETS[0].d2);
  const [d3, setD3] = useState<number | undefined>(MATERIAL_PRESETS[0].d3);
  const [d4, setD4] = useState<number | undefined>(undefined);
  const [showOrder3, setShowOrder3] = useState<boolean>(true);
  const [showOrder4, setShowOrder4] = useState<boolean>(false);

  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIAL_PRESETS[0].label);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [inputData, setInputData] = useState<string>(MATERIAL_PRESETS[0].data);
  const [result, setResult] = useState<WAResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [shapeFactor, setShapeFactor] = useState<number>(1.0);
  const [instrumentalCorrection, setInstrumentalCorrection] = useState<string>('Stokes');
  const [backgroundModel, setBackgroundModel] = useState<string>('Linear');
  const [strainModel, setStrainModel] = useState<string>('Dislocation (Wilkens)');
  const [hookCorrectionMode, setHookCorrectionMode] = useState<'linear_tangent' | 'polynomial' | 'spline_regularization' | 'none'>('linear_tangent');
  const [contrastFactorC, setContrastFactorC] = useState<number>(0.304);
  const [contrastPreset, setContrastPreset] = useState<string>('fcc_111_edge');
  
  // Advanced Refinement Parameters
  const [instrumentalFactor, setInstrumentalFactor] = useState<number>(0.005);
  const [backgroundOffset, setBackgroundOffset] = useState<number>(0.02);
  const [cutoffRadiusValue, setCutoffRadiusValue] = useState<number>(50.0); // nm

  // Visualization toggles
  const [showHookComparison, setShowHookComparison] = useState<boolean>(false);
  const [showNumberWeighted, setShowNumberWeighted] = useState<boolean>(true);
  const [showLogNormalFit, setShowLogNormalFit] = useState<boolean>(true);
  const [wilkensPlotMode, setWilkensPlotMode] = useState<'linearized' | 'rms_decay'>('linearized');

  // AI Crystallographic Advisor State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Python Code Export State
  const [copiedPython, setCopiedPython] = useState<boolean>(false);

  const [selectedDomainIndex, setSelectedDomainIndex] = useState<number>(0);
  const [selectedOrderPlotL, setSelectedOrderPlotL] = useState<number>(5);
  const [burgersVector, setBurgersVector] = useState<number>(MATERIAL_PRESETS[0].burgersVector);
  const [youngsModulus, setYoungsModulus] = useState<number>(MATERIAL_PRESETS[0].youngsModulus);

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'size_pv' | 'strain_wilkens' | 'order_plots' | 'defect_topography' | 'metrics_report' | 'ai_advisor' | 'python_export'>('size_pv');
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isDEstimatorOpen, setIsDEstimatorOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [calcMode, setCalcMode] = useState<'bragg' | 'bragghkl'>('bragg');
  const [calcLambda, setCalcLambda] = useState(1.5406);
  const [calc2Theta1, setCalc2Theta1] = useState(38.18);
  const [calc2Theta2, setCalc2Theta2] = useState(81.72);
  const [calcLatticeA, setCalcLatticeA] = useState(4.078);
  const [calcHKL1, setCalcHKL1] = useState('1 1 1');
  const [calcHKL2, setCalcHKL2] = useState('2 2 2');

  const handleReset = () => {
    const defaultPreset = MATERIAL_PRESETS[0];
    setD1(defaultPreset.d1);
    setD2(defaultPreset.d2);
    setD3(defaultPreset.d3);
    setD4(defaultPreset.d4);
    setShowOrder3(true);
    setShowOrder4(true);
    setSelectedMaterial(defaultPreset.label);
    setInputData(defaultPreset.data);
    setBurgersVector(defaultPreset.burgersVector);
    setYoungsModulus(defaultPreset.youngsModulus);
    setContrastFactorC(defaultPreset.contrastFactor || 0.304);
    setContrastPreset('fcc_111_edge');
    setShapeFactor(1.0);
    setStrainModel('Dislocation (Wilkens)');
    setInstrumentalCorrection('Stokes');
    setBackgroundModel('Linear');
    setHookCorrectionMode('linear_tangent');
    setInstrumentalFactor(0.005);
    setBackgroundOffset(0.02);
    setCutoffRadiusValue(50.0);
  };

  const handleClear = () => {
    setInputData("");
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "L_nm,A_size,P_V_L,P_N_L,RMS_Strain,MS_Strain\n";
    const rows = result.sizeDistribution.map((row, i) => {
      const strain = result.strainDistribution[i]?.rms_strain || 0;
      const msStrain = result.strainDistribution[i]?.ms_strain || 0;
      return `${row.L_nm.toFixed(2)},${row.A_size.toFixed(6)},${(row.Pv_L || 0).toFixed(6)},${(row.Pn_L || 0).toFixed(6)},${strain.toExponential(6)},${msStrain.toExponential(6)}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warren_averbach_analysis_${selectedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMaterialMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCalculate = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const points = parseWAInput(inputData);
      const computed = calculateWarrenAverbach(
        d1, 
        d2, 
        points, 
        shapeFactor, 
        strainModel,
        instrumentalCorrection,
        backgroundModel,
        instrumentalFactor,
        backgroundOffset,
        cutoffRadiusValue,
        hookCorrectionMode,
        showOrder3 ? d3 : undefined,
        showOrder4 ? d4 : undefined,
        burgersVector,
        youngsModulus,
        contrastFactorC
      );
      setResult(computed);
      setIsAnalyzing(false);
      
      // Auto-set selected order plot point if available
      if (computed.orderPlots && computed.orderPlots.length > 0) {
        const defaultPt = computed.orderPlots.find(p => p.L_nm >= 4) || computed.orderPlots[0];
        setSelectedOrderPlotL(defaultPt.L_nm);
      }

      setTimeout(() => {
        document.getElementById('wa-results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 300);
  };

  // Run calculation on mount once
  useEffect(() => {
    handleCalculate();
  }, []);

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const res = await fetch('/api/gemini/generate-wa-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.dataString) {
        setInputData(data.dataString);
        if (data.d1) setD1(data.d1);
        if (data.d2) setD2(data.d2);
        if (data.d3) {
          setD3(data.d3);
          setShowOrder3(true);
        }
        if (data.burgersVector) setBurgersVector(data.burgersVector);
        if (data.youngsModulus) setYoungsModulus(data.youngsModulus);
        if (data.contrastFactor) setContrastFactorC(data.contrastFactor);
        setSelectedMaterial(`AI: ${searchQuery}`);
      }
    } catch (error) {
      console.error("Error generating data via server API:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateAiReport = async () => {
    if (!result || !result.metrics) return;
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const res = await fetch('/api/gemini/wa-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: result.metrics,
          materialName: selectedMaterial,
          d1,
          d2,
          d3: showOrder3 ? d3 : undefined,
          d4: showOrder4 ? d4 : undefined,
          burgersVector,
          youngsModulus,
          contrastFactorC
        })
      });

      if (!res.ok) {
        throw new Error(`Advisor service returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.report) {
        setAiReport(data.report);
      } else {
        setReportError(data.error || 'Failed to generate crystallographic advisory report.');
      }
    } catch (err: any) {
      setReportError(err.message || 'Error communicating with AI crystallographic advisor.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePythonScript = (): string => {
    if (!result) return '# Please execute Warren-Averbach analysis first.';
    return `"""
Warren-Averbach XRD Microstructural Analysis Script
Generated by XRD-Calc Pro (Warren-Averbach Suite)
Material: ${selectedMaterial}
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

# Input reflection lattice parameters
d1 = ${d1.toFixed(4)}   # Primary reflection [Angstroms]
d2 = ${d2.toFixed(4)}   # Secondary reflection [Angstroms]
${showOrder3 && d3 ? `d3 = ${d3.toFixed(4)}   # Third reflection [Angstroms]\n` : ''}${showOrder4 && d4 ? `d4 = ${d4.toFixed(4)}   # Fourth reflection [Angstroms]\n` : ''}b = ${burgersVector.toFixed(4)} * 1e-9 # Burgers vector [meters]
E = ${youngsModulus} * 1e9             # Young's modulus [Pa]
C_bar = ${contrastFactorC.toFixed(3)}          # Dislocation contrast factor

# Experimental Fourier coefficients
# Format: [L_nm, A(d1), A(d2), ...]
data = np.array([
${result.sizeDistribution.map(r => `    [${r.L_nm.toFixed(1)}, ${r.A_size.toFixed(5)}]`).join(',\n')}
])

L = data[:, 0]
A_size = data[:, 1]

# 1. Calculate Area-Weighted Column Length <D>_A
dL = np.gradient(L)
dA_dL = np.gradient(A_size, L)
initial_slope = np.abs(dA_dL[0])
D_A = 1.0 / initial_slope if initial_slope > 0 else np.nan

# 2. Calculate Volume-Weighted Column Length Distribution P_V(L)
d2A_dL2 = np.gradient(dA_dL, L)
Pv_L = np.maximum(0, L * d2A_dL2)
if np.max(Pv_L) > 0:
    Pv_L /= np.max(Pv_L)

print(f"=== Warren-Averbach Crystallographic Results ===")
print(f"Area-weighted column length <D>_A: {D_A:.2f} nm")
print(f"Dislocation density rho: ${result.metrics.dislocationDensity10_14.toFixed(3)}e14 m^-2")
print(f"Wilkens arrangement parameter M: ${result.metrics.wilkensArrangementParameterM.toFixed(2)}")

# 3. Plot Size Fourier Coefficients and Column Distribution
fig, ax1 = plt.subplots(figsize=(8, 5))

color = 'tab:red'
ax1.set_xlabel('Column Length L [nm]')
ax1.set_ylabel('Size Fourier Coefficient A_S(L)', color=color)
ax1.plot(L, A_size, 'o-', color=color, label='A_S(L)')
ax1.tick_params(axis='y', labelcolor=color)
ax1.grid(True, alpha=0.3)

ax2 = ax1.twinx()
color = 'tab:blue'
ax2.set_ylabel('Normalized P_V(L) [arb. units]', color=color)
ax2.fill_between(L, Pv_L, alpha=0.3, color=color)
ax2.plot(L, Pv_L, '-', color=color, label='P_V(L)')
ax2.tick_params(axis='y', labelcolor=color)

plt.title('Warren-Averbach Size Deconvolution: ${selectedMaterial}')
fig.tight_layout()
plt.show()
`;
  };

  const parsedPointsForMath = useMemo(() => {
    try {
      const pts = parseWAInput(inputData);
      const targetPt = pts.find(p => p.L_nm >= 5) || pts[0] || { L_nm: 5, A1: 0.85, A2: 0.70 };
      return targetPt;
    } catch {
      return { L_nm: 5, A1: 0.85, A2: 0.70 };
    }
  }, [inputData]);

  // Selected Order Plot Line for Regression Tab
  const activeOrderPlot = useMemo(() => {
    if (!result?.orderPlots) return null;
    return result.orderPlots.find(p => Math.abs(p.L_nm - selectedOrderPlotL) < 0.1) || result.orderPlots[0];
  }, [result, selectedOrderPlotL]);

  const waWalkthroughSteps: WizardStep[] = [
    {
      title: 'Choose Reflection Orders & Material',
      subtitle: 'Harmonic Setup (e.g. 111, 222, 333)',
      explanation: 'Warren-Averbach requires at least 2 harmonic orders of the same crystallographic plane family (such as Au (111) and (222)). Size broadening is independent of reflection order, whereas microstrain broadening scales quadratically with diffraction order (1/d²).',
      tip: 'Higher harmonic orders (d2, d3) exhibit faster Fourier decay because lattice microstrains degrade coherence over larger reciprocal vectors s = 1/d.'
    },
    {
      title: 'Hook Effect Correction',
      subtitle: 'Correcting Low-L Curvature Artifacts',
      explanation: 'Experimental background truncation or instrument slit errors cause the Fourier size coefficients A(L) to curve upward at small L (< 2 nm). The Hook correction calculates the true initial slope by linear tangent extrapolation.',
      tip: 'The area-weighted column length <D>_A is directly equal to the negative inverse of the initial slope: <D>_A = -1 / (dA_S / dL)_{L=0}.'
    },
    {
      title: 'Fourier Deconvolution (Stokes Method)',
      subtitle: 'ln A(L, s) = ln A_S(L) - 2π²L²⟨ε²⟩_L · s²',
      explanation: 'For each column length L, we plot ln A(L) against s² = (1/d)². The vertical intercept at s²=0 gives the pure size coefficient A_S(L), and the downward slope gives the RMS microstrain ⟨ε²⟩_L.',
      tip: 'Notice that as L increases, the slope becomes steeper because strain inhomogeneities span larger coherent crystallite columns.'
    },
    {
      title: 'Dislocation Density & Wilkens Cutoff',
      subtitle: 'Krivoglaz-Wilkens Microstructure Model',
      explanation: 'Using the Wilkens strain function and Burgers vector b, we determine the dislocation density ρ (lines/m²) and the effective dislocation interaction radius Re.',
      tip: 'Dislocation densities in severely deformed metals typically range from 10¹⁴ to 10¹⁶ m⁻², with Re/L ratio revealing dislocation screening.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Guided Walkthrough Wizard */}
      <GuidedWalkthroughWizard
        moduleName="Warren-Averbach Fourier Peak Deconvolution"
        description="Master harmonic Fourier order separation, Hook effect correction, and Wilkens dislocation density analysis."
        steps={waWalkthroughSteps}
        presetNames={MATERIAL_PRESETS.map(p => p.label)}
        onLoadBenchmarkPreset={(idx) => {
          const p = MATERIAL_PRESETS[idx];
          if (p) {
            setSelectedMaterial(p.label);
            setD1(p.d1);
            setD2(p.d2);
            setD3(p.d3);
            setShowOrder3(!!p.d3);
            setBurgersVector(p.burgersVector);
            setInputData(p.data);
          }
        }}
      />

      {/* 2. Physical Meaning Verdict Banner */}
      {result && result.metrics && (
        <PhysicalMeaningSummary
          title="Warren-Averbach Physical Microstructure Verdict"
          tone={result.metrics.dislocationDensityM2 > 5e15 ? 'warning' : 'success'}
          statement={`Sample exhibits an area-weighted column length ⟨D⟩_A of ${result.metrics.areaWeightedColumnLengthNm.toFixed(1)} nm with a dislocation density of ${(result.metrics.dislocationDensityM2).toExponential(2)} m⁻² and strain energy of ${result.metrics.apparentStrainEnergyKJm3.toFixed(2)} kJ/m³.`}
          contextNote={`Crystallite size distribution peaks at a mode diameter of ${result.metrics.crystalliteSizeDistributionModeNm.toFixed(1)} nm. ${result.metrics.dislocationDensityM2 > 1e15 ? 'High dislocation density indicates severe plastic strain / work hardening.' : 'Low dislocation density indicates well-annealed, low-defect crystallites.'}`}
          metrics={[
            { label: '⟨D⟩_A Area Size', value: result.metrics.areaWeightedColumnLengthNm.toFixed(1), unit: 'nm' },
            { label: '⟨D⟩_V Vol Size', value: result.metrics.volumeWeightedColumnLengthNm.toFixed(1), unit: 'nm' },
            { label: 'Wilkens Re', value: result.metrics.wilkensCutoffRadiusNm.toFixed(1), unit: 'nm' },
            { label: 'Dislocation ρ', value: result.metrics.dislocationDensityM2.toExponential(2), unit: 'm⁻²' }
          ]}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      
      {/* Input Configuration Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050914]/90 backdrop-blur-3xl p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative group transition-all z-20 ring-1 ring-white/10 ring-inset">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl border border-rose-500/30 text-rose-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300 tracking-tight font-sans">
                  WA Engine
                </h2>
                <p className="text-[10px] text-rose-400 mt-0.5 uppercase font-bold tracking-[0.2em] font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Warren-Averbach Suite
                </p>
              </div>
            </div>

            <button 
              onClick={handleReset}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-2 font-mono shadow-sm"
              title="Reset config to default material"
            >
              <RefreshCw className="w-3 h-3" /> 
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            
            {/* Material Presets Selector */}
            <div className="p-4 rounded-2xl border border-white/5 bg-black/40 relative z-30">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2.5">
                Crystallographic Material Preset
              </label>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 hover:border-rose-500/30 rounded-xl outline-none transition-all flex items-center justify-between shadow-inner"
                >
                  <span className="text-xs font-bold text-rose-400 truncate">
                    {selectedMaterial}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isMaterialMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMaterialMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0A101C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] py-2 backdrop-blur-3xl"
                    >
                      <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {MATERIAL_PRESETS.map((m) => (
                          <button
                            key={m.label}
                            onClick={() => {
                              setSelectedMaterial(m.label);
                              setD1(m.d1);
                              setD2(m.d2);
                              if (m.d3) {
                                setD3(m.d3);
                                setShowOrder3(true);
                              } else {
                                setShowOrder3(false);
                              }
                              setBurgersVector(m.burgersVector);
                              setYoungsModulus(m.youngsModulus);
                              setInputData(m.data);
                              setIsMaterialMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 flex flex-col items-start hover:bg-white/5 transition-colors text-left ${selectedMaterial === m.label ? 'bg-rose-500/10' : ''}`}
                          >
                            <span className={`text-xs font-bold ${selectedMaterial === m.label ? 'text-rose-400' : 'text-slate-200'}`}>
                              {m.label}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {m.desc} (E={m.youngsModulus}GPa, b={m.burgersVector}nm)
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Action Tools Bar: Peak Converter & AI Synthesizer */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsConverterOpen(true)}
                className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Peak to Fourier</span>
              </button>

              <button
                onClick={() => setIsDEstimatorOpen(!isDEstimatorOpen)}
                className="p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Atom className="w-3.5 h-3.5" />
                <span>d-Spacing Tool</span>
              </button>
            </div>

            {/* AI Synthesizer */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-rose-400" />
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  AI Material Generator
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Cold-rolled Brass (70/30)"
                  className="flex-1 px-3.5 py-2 bg-black/60 text-slate-200 placeholder:text-slate-600 border border-white/10 rounded-xl text-xs font-sans outline-none focus:border-rose-500/40 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  {isThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Reflection Orders d-Spacings */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  Reflection Orders (d-spacings)
                </label>
                <div className="flex gap-2 text-[9px] font-mono">
                  <button
                    onClick={() => setShowOrder3(!showOrder3)}
                    className={`px-2 py-0.5 rounded border transition-colors ${showOrder3 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-black/40 border-white/10 text-slate-500'}`}
                  >
                    Order 3 (d₃)
                  </button>
                  <button
                    onClick={() => setShowOrder4(!showOrder4)}
                    className={`px-2 py-0.5 rounded border transition-colors ${showOrder4 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-black/40 border-white/10 text-slate-500'}`}
                  >
                    Order 4 (d₄)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono">d₁ (Order 1, Å)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={d1}
                    onChange={(e) => {
                      setD1(parseFloat(e.target.value) || 2.3551);
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono">d₂ (Order 2, Å)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={d2}
                    onChange={(e) => {
                      setD2(parseFloat(e.target.value) || 1.1776);
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                {showOrder3 && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono">d₃ (Order 3, Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={d3 || ''}
                      placeholder="e.g. 0.7850"
                      onChange={(e) => {
                        setD3(parseFloat(e.target.value) || undefined);
                        setSelectedMaterial('Custom');
                      }}
                      className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                    />
                  </div>
                )}

                {showOrder4 && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-mono">d₄ (Order 4, Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={d4 || ''}
                      placeholder="e.g. 0.5888"
                      onChange={(e) => {
                        setD4(parseFloat(e.target.value) || undefined);
                        setSelectedMaterial('Custom');
                      }}
                      className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dislocation Contrast Factor & Physics Controls */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                    Contrast & Dislocation Model
                  </label>
                </div>
                <span className="text-[9px] font-mono text-rose-400/80 font-semibold">Wilkens Dislocation</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Contrast Preset (C̄)</label>
                  <select
                    value={contrastPreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContrastPreset(val);
                      if (val === 'fcc_111_edge') setContrastFactorC(0.304);
                      else if (val === 'fcc_111_screw') setContrastFactorC(0.165);
                      else if (val === 'bcc_110_edge') setContrastFactorC(0.285);
                      else if (val === 'bcc_110_screw') setContrastFactorC(0.145);
                      else if (val === 'hcp_ti') setContrastFactorC(0.250);
                    }}
                    className="w-full px-2 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-[11px] font-mono outline-none"
                  >
                    <option value="fcc_111_edge">FCC (111) Edge (0.304)</option>
                    <option value="fcc_111_screw">FCC (111) Screw (0.165)</option>
                    <option value="bcc_110_edge">BCC (110) Edge (0.285)</option>
                    <option value="bcc_110_screw">BCC (110) Screw (0.145)</option>
                    <option value="hcp_ti">HCP (100) Ti (0.250)</option>
                    <option value="custom">Custom C̄</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Avg Contrast Factor C̄</label>
                  <input
                    type="number"
                    step="0.005"
                    min="0.05"
                    max="1.0"
                    value={contrastFactorC}
                    onChange={(e) => {
                      setContrastFactorC(parseFloat(e.target.value) || 0.304);
                      setContrastPreset('custom');
                    }}
                    className="w-full px-3 py-1.5 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Hook Correction</label>
                  <select
                    value={hookCorrectionMode}
                    onChange={(e) => setHookCorrectionMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-[11px] font-mono outline-none"
                  >
                    <option value="linear_tangent">Tangent Linearization</option>
                    <option value="spline_regularization">Spline Regularization (Curvature-safe)</option>
                    <option value="polynomial">Monotonic Regularization</option>
                    <option value="none">Raw (No Hook Corr.)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Strain Model</label>
                  <select
                    value={strainModel}
                    onChange={(e) => setStrainModel(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-[11px] font-mono outline-none"
                  >
                    <option value="Dislocation (Wilkens)">Wilkens Dislocation</option>
                    <option value="Gaussian">Gaussian Model</option>
                    <option value="Lorentzian">Lorentzian Model</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Inst. Broadening</label>
                  <select
                    value={instrumentalCorrection}
                    onChange={(e) => setInstrumentalCorrection(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-[11px] font-mono outline-none"
                  >
                    <option value="Stokes">Stokes Deconvolution</option>
                    <option value="Voigt">Voigt Broadening</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Background</label>
                  <select
                    value={backgroundModel}
                    onChange={(e) => setBackgroundModel(e.target.value)}
                    className="w-full px-2 py-1.5 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-[11px] font-mono outline-none"
                  >
                    <option value="Linear">Linear Baseline</option>
                    <option value="Spline">Exponential Decay</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fourier Array Text Input */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-rose-400" />
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Fourier Harmonic Coefficients
                  </label>
                </div>
                <button
                  onClick={handleClear}
                  className="text-[9px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>

              <textarea
                value={inputData}
                onChange={(e) => {
                  setInputData(e.target.value);
                  setSelectedMaterial('Custom');
                }}
                className="w-full h-36 px-4 py-3 bg-black/60 text-rose-400 border border-white/10 rounded-xl font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-rose-500/40 custom-scrollbar shadow-inner"
                spellCheck={false}
              />
            </div>

            {/* Analyze Action Button */}
            <button
              onClick={handleCalculate}
              disabled={isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-[0.2em] font-mono rounded-2xl shadow-xl shadow-rose-950/40 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Harmonics...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Execute Warren-Averbach Analysis</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Scientific Formulation Card */}
        <div className="bg-[#050914]/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 space-y-4 ring-1 ring-white/10 ring-inset">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
              Warren-Averbach Formalism
            </h3>
          </div>
          <div className="p-3.5 bg-black/60 rounded-xl border border-white/5 text-center font-mono text-xs text-emerald-400">
            ln A(L, s) = ln A_S(L) - 2π² L² ⟨ε²⟩_L s²
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            By plotting <span className="font-mono text-slate-300">ln A(L)</span> against <span className="font-mono text-slate-300">s² = 1/d²</span>, the intercept yields the pure size Fourier coefficient <span className="font-mono text-rose-400">A_S(L)</span>, while the slope yields the RMS microstrain <span className="font-mono text-cyan-400">⟨ε²⟩_L¹/²</span>.
          </p>
        </div>

      </div>

      {/* Results & Visual Analysis Column */}
      <div id="wa-results-section" className="lg:col-span-8 space-y-6">
        
        {/* Verification Control */}
        {result && (
          <ScientificMathControl
            title="Warren-Averbach Microstrain Harmonic Verification"
            formula="\langle \varepsilon_L^2 \rangle^{1/2} = \sqrt{\frac{\ln(A_1 / A_2)}{2 \pi^2 L^2 (1/d_2^2 - 1/d_1^2)}}"
            description="Deconvolve domain particle size from lattice microstrains across reflection orders."
            variables={[
              { symbol: 'A_1', name: 'Order 1 Harmonic', value: parsedPointsForMath.A1, unit: '' },
              { symbol: 'A_2', name: 'Order 2 Harmonic', value: parsedPointsForMath.A2, unit: '' },
              { symbol: 'L', name: 'Fourier Length', value: parsedPointsForMath.L_nm, unit: 'nm' },
              { symbol: 'd_1', name: 'd-spacing (Order 1)', value: d1, unit: 'Å' },
              { symbol: 'd_2', name: 'd-spacing (Order 2)', value: d2, unit: 'Å' }
            ]}
            result={
              (() => {
                const s1 = 1 / d1;
                const s2 = 1 / d2;
                const num = Math.log(parsedPointsForMath.A1 / parsedPointsForMath.A2);
                const den = 2 * Math.PI * Math.PI * parsedPointsForMath.L_nm * parsedPointsForMath.L_nm * (s2*s2 - s1*s1);
                return den !== 0 && num / den > 0 ? Math.sqrt(num / den) : 0;
              })()
            }
            resultUnit=""
            resultName="Calculated RMS Microstrain ⟨ε²⟩¹/²"
          />
        )}

        {/* Analysis Navigation Tabs */}
        <div className="bg-slate-950/80 p-2 rounded-2xl border border-white/5 flex flex-wrap gap-2 ring-1 ring-white/10 ring-inset">
          {[
            { id: 'size_pv', label: '1. Size & Column Length Distributions', icon: TrendingDown },
            { id: 'strain_wilkens', label: '2. Microstrain & Wilkens Model', icon: Activity },
            { id: 'order_plots', label: '3. Harmonic Order Plots ln A vs 1/d²', icon: BarChart3 },
            { id: 'defect_topography', label: '4. Dislocation Topography', icon: Layers },
            { id: 'metrics_report', label: '5. Quantitative Report & LaTeX', icon: FileText },
            { id: 'ai_advisor', label: '6. AI Crystallographic Advisor', icon: BrainCircuit },
            { id: 'python_export', label: '7. Python / SciPy Script Exporter', icon: Code }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAnalysisTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAnalysisTab(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Size Fourier Decay A_S(L) & Column Distributions (P_V, P_N, Log-Normal) */}
        {activeAnalysisTab === 'size_pv' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                    Size Deconvolution & Column Length Distributions
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Area-weighted ⟨D⟩_A = {result?.metrics?.areaWeightedColumnLengthNm.toFixed(1)} nm · Number-weighted ⟨D⟩_N = {result?.metrics?.numberWeightedColumnLengthNm ? result.metrics.numberWeightedColumnLengthNm.toFixed(1) : '—'} nm
                  </p>
                </div>

                {/* Display Toggles */}
                <div className="flex flex-wrap items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10 text-[10px] font-mono">
                  <button
                    onClick={() => setShowNumberWeighted(!showNumberWeighted)}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      showNumberWeighted ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    P_N(L) Number-Weighted
                  </button>

                  <button
                    onClick={() => setShowLogNormalFit(!showLogNormalFit)}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      showLogNormalFit ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Log-Normal Fit
                  </button>
                </div>
              </div>

              {/* Metrics Highlights Row */}
              {result?.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-black/30 rounded-xl border border-white/5 font-mono text-[11px] relative z-10">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Area-Weighted ⟨D⟩_A:</span>
                    <span className="text-rose-400 font-bold">{result.metrics.areaWeightedColumnLengthNm.toFixed(2)} nm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Number-Weighted ⟨D⟩_N:</span>
                    <span className="text-amber-400 font-bold">{result.metrics.numberWeightedColumnLengthNm ? `${result.metrics.numberWeightedColumnLengthNm.toFixed(2)} nm` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Log-Normal Median D₀:</span>
                    <span className="text-purple-400 font-bold">{result.metrics.logNormalMedianNm ? `${result.metrics.logNormalMedianNm.toFixed(2)} nm` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Log-Normal Variance σ:</span>
                    <span className="text-emerald-400 font-bold">{result.metrics.logNormalSigma ? result.metrics.logNormalSigma.toFixed(3) : '—'}</span>
                  </div>
                </div>
              )}

              {!result ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-mono text-xs">Computing Fourier profile...</span>
                </div>
              ) : (
                <div className="h-[420px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.sizeDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="sizeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="L_nm" 
                        label={{ value: 'Column Length L [nm]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        domain={[0, 1.05]}
                        label={{ value: 'Fourier Size Coeff A_S(L)', angle: -90, position: 'insideLeft', fill: '#f43f5e', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 1.05]}
                        label={{ value: 'Normalized Distributions P(L)', angle: 90, position: 'insideRight', fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', fontFamily: 'monospace' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="A_size"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        fill="url(#sizeGrad)"
                        name="A_S(L) (Fourier Size Coeff)"
                        activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
                      />

                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="Pv_L"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        fill="url(#pvGrad)"
                        name="P_V(L) Volume Distribution"
                        activeDot={{ r: 5, fill: '#fff', stroke: '#38bdf8', strokeWidth: 2 }}
                      />

                      {showNumberWeighted && (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="Pn_L"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          name="P_N(L) Number-Weighted"
                        />
                      )}

                      {showLogNormalFit && (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="logNormalFit"
                          stroke="#c084fc"
                          strokeWidth={2}
                          dot={false}
                          name="Analytical Log-Normal Fit"
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: RMS Microstrain & Wilkens Dislocation Model */}
        {activeAnalysisTab === 'strain_wilkens' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Microstrain Field & Wilkens Dislocation Model
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Dislocation density ρ = {result?.metrics?.dislocationDensity10_14.toFixed(3)} × 10¹⁴ m⁻² · Wilkens R² = {result?.metrics?.wilkensR2 !== undefined ? result.metrics.wilkensR2.toFixed(4) : '—'}
                  </p>
                </div>

                {/* Plot Mode Switcher */}
                <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setWilkensPlotMode('linearized')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      wilkensPlotMode === 'linearized'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Wilkens Linear Plot (⟨ε²⟩ vs ln 1/L)
                  </button>
                  <button
                    onClick={() => setWilkensPlotMode('rms_decay')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      wilkensPlotMode === 'rms_decay'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    RMS Strain Decay ⟨ε²⟩¹/² vs L
                  </button>
                </div>
              </div>

              {/* Wilkens Formalism Box */}
              <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px] mb-4 relative z-10">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Dislocation Density ρ:</span>
                  <span className="text-cyan-400 font-bold">{result?.metrics?.dislocationDensity10_14.toFixed(3)} × 10¹⁴ m⁻²</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Wilkens Parameter M:</span>
                  <span className="text-emerald-400 font-bold">{result?.metrics?.wilkensArrangementParameterM.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Cutoff Radius R_e:</span>
                  <span className="text-rose-400 font-bold">{result?.metrics?.wilkensCutoffRadiusNm.toFixed(1)} nm</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Dislocation Contrast C̄:</span>
                  <span className="text-amber-400 font-bold">{result?.metrics?.contrastFactorC ? result.metrics.contrastFactorC.toFixed(3) : contrastFactorC.toFixed(3)}</span>
                </div>
              </div>

              {!result ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-mono text-xs">Computing strain field...</span>
                </div>
              ) : wilkensPlotMode === 'linearized' ? (
                <div className="h-[400px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={result.strainDistribution
                        .filter(d => d.L_nm > 0 && d.ms_strain > 0)
                        .map(d => ({
                          ...d,
                          ln_inv_L: Math.log(1 / d.L_nm),
                          fit_ms_strain: Math.max(0, (result.metrics?.dislocationDensity10_14 || 1) * 1e14 * (contrastFactorC || 0.3) * (burgersVector * 1e-9) ** 2 / (4 * Math.PI) * Math.log(result.metrics?.wilkensCutoffRadiusNm || 50 / d.L_nm))
                        }))}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis 
                        dataKey="ln_inv_L" 
                        type="number"
                        domain={['dataMin - 0.2', 'dataMax + 0.2']}
                        label={{ value: 'ln(1 / L) [ln(nm⁻¹)]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        tickFormatter={(val) => Number(val).toExponential(1)}
                        label={{ value: 'Mean Square Microstrain ⟨ε_L²⟩', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                        formatter={(val: any) => Number(val).toExponential(4)}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <Scatter dataKey="ms_strain" fill="#06b6d4" name="Observed ⟨ε_L²⟩" />
                      <Line
                        type="linear"
                        dataKey="fit_ms_strain"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        dot={false}
                        name="Wilkens Linear Regression Fit"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.strainDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="strainGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="L_nm" 
                        label={{ value: 'Column Length L [nm]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        tickFormatter={(val) => Number(val).toExponential(1)}
                        label={{ value: 'RMS Strain ⟨ε²⟩¹/²', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                        formatter={(val: any) => Number(val).toExponential(4)}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rms_strain" 
                        stroke="#06b6d4" 
                        strokeWidth={3} 
                        fill="url(#strainGrad)" 
                        name="RMS Strain ⟨ε²⟩¹/²" 
                        activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Harmonic Order Regressions ln A(L) vs 1/d² */}
        {activeAnalysisTab === 'order_plots' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Multi-Reflection Order Regression: ln A(L) vs 1/d²
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Isolate Size (intercept at 1/d² → 0) and Microstrain (slope) for specific column length L
                  </p>
                </div>

                {result?.orderPlots && result.orderPlots.length > 0 && (
                  <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-slate-400">Select L:</span>
                    <select
                      value={selectedOrderPlotL}
                      onChange={(e) => setSelectedOrderPlotL(parseFloat(e.target.value))}
                      className="bg-transparent text-rose-400 text-xs font-mono font-bold outline-none cursor-pointer"
                    >
                      {result.orderPlots.map((op) => (
                        <option key={op.L_nm} value={op.L_nm} className="bg-[#0b1120] text-white">
                          L = {op.L_nm.toFixed(1)} nm
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {activeOrderPlot ? (
                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Size Intercept A_S(L):</span>
                      <span className="text-rose-400 font-bold text-sm">{activeOrderPlot.A_size.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">RMS Microstrain:</span>
                      <span className="text-cyan-400 font-bold text-sm">{activeOrderPlot.rms_strain.toExponential(3)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Regression R²:</span>
                      <span className="text-emerald-400 font-bold text-sm">{activeOrderPlot.r2.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeOrderPlot.points} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis 
                          dataKey="s2" 
                          type="number"
                          domain={['dataMin - 0.1', 'dataMax + 0.1']}
                          label={{ value: '1 / d² [Å⁻²]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          dataKey="lnA" 
                          label={{ value: 'ln A(L, s)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '10px' }}
                        />
                        <Scatter dataKey="lnA" fill="#f43f5e" name="Observed Harmonic Point" />
                        <Line
                          type="linear"
                          dataKey="lnA"
                          stroke="#a855f7"
                          strokeWidth={2}
                          dot={false}
                          name="Order Regression Line"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 font-mono text-xs">
                  Run calculation to view order regression plots.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Defect Topography & Microstrain Field */}
        {activeAnalysisTab === 'defect_topography' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Crystallite Grain Defect & Strain Topography
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Localized microstructural lattice strain energy & dislocation arrangement
                  </p>
                </div>
              </div>

              {result && (
                <div className="w-full relative z-10">
                  {(() => {
                    const validStrains = result.strainDistribution.filter(d => d.rms_strain > 0 && Number.isFinite(d.rms_strain));
                    if (validStrains.length === 0) return <div className="text-slate-500 text-center text-sm font-mono py-10">No valid strain data</div>;

                    const activeIndex = Math.min(selectedDomainIndex, validStrains.length - 1);
                    const activeItem = validStrains[activeIndex >= 0 ? activeIndex : 0] || validStrains[0];
                    const b_m = burgersVector * 1e-9;
                    const L_m = activeItem.L_nm * 1e-9;
                    const dislDensity = activeItem.rms_strain > 0 ? (2 * Math.sqrt(3) * activeItem.rms_strain) / (L_m * b_m) : 0;
                    const strainEnergy = 1.5 * (youngsModulus * 1e9) * (activeItem.rms_strain ** 2);
                    const energyKJ = strainEnergy / 1000;

                    return (
                      <div className="space-y-6">
                        <DislocationMetricsVisualizer
                          dislDensity={dislDensity}
                          energyKJ={energyKJ}
                          burgersVectorNm={burgersVector}
                          youngsModulusGpa={youngsModulus}
                          columnLengthNm={activeItem.L_nm}
                          rmsStrain={activeItem.rms_strain}
                        />

                        {/* Interactive Sliders for Physical Constants */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-black/40 rounded-2xl border border-white/5">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Burgers Vector (b):</span>
                              <span className="text-rose-400 font-bold">{burgersVector.toFixed(3)} nm</span>
                            </div>
                            <input
                              type="range"
                              min="0.15"
                              max="0.45"
                              step="0.005"
                              value={burgersVector}
                              onChange={(e) => setBurgersVector(parseFloat(e.target.value))}
                              className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Young's Modulus (E):</span>
                              <span className="text-rose-400 font-bold">{youngsModulus} GPa</span>
                            </div>
                            <input
                              type="range"
                              min="40"
                              max="450"
                              step="5"
                              value={youngsModulus}
                              onChange={(e) => setYoungsModulus(parseInt(e.target.value))}
                              className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Quantitative Report & LaTeX */}
        {activeAnalysisTab === 'metrics_report' && result?.metrics && (
          <WarrenAverbachMetricsSummary
            metrics={result.metrics}
            result={result}
            materialName={selectedMaterial}
            d1={d1}
            d2={d2}
            d3={showOrder3 ? d3 : undefined}
            d4={showOrder4 ? d4 : undefined}
            burgersVector={burgersVector}
            youngsModulus={youngsModulus}
            onDownloadCSV={handleDownloadCSV}
          />
        )}

        {/* Tab 6: AI Crystallographic Advisor */}
        {activeAnalysisTab === 'ai_advisor' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <BrainCircuit className="w-5 h-5 text-rose-400" />
                    AI Crystallographic Diagnostician & Advisor
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Automated domain size-strain decoupling validation, Wilkens parameter interpretation, and beamline tips
                  </p>
                </div>

                <button
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingReport || !result}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 disabled:opacity-40 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Diagnosing Spectrum...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Crystallographic Diagnosis</span>
                    </>
                  )}
                </button>
              </div>

              {/* Material & Analysis Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs mb-6 relative z-10">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Analyzed Material:</span>
                  <span className="text-rose-400 font-bold">{selectedMaterial}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Harmonics Evaluated:</span>
                  <span className="text-slate-200 font-bold">{showOrder4 ? '4 Orders' : showOrder3 ? '3 Orders' : '2 Orders'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Avg Contrast Factor C̄:</span>
                  <span className="text-cyan-400 font-bold">{contrastFactorC.toFixed(3)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Hook Correction:</span>
                  <span className="text-emerald-400 font-bold">{hookCorrectionMode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Wilkens R²:</span>
                  <span className="text-purple-400 font-bold">{result?.metrics?.wilkensR2 !== undefined ? result.metrics.wilkensR2.toFixed(4) : '—'}</span>
                </div>
              </div>

              {reportError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-mono mb-4">
                  {reportError}
                </div>
              )}

              {aiReport ? (
                <div className="space-y-4 relative z-10">
                  <div className="p-6 bg-black/60 rounded-2xl border border-white/10 font-sans text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap selection:bg-rose-500/30 selection:text-white">
                    {aiReport}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiReport);
                        alert('Crystallographic report copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold rounded-xl border border-white/10 flex items-center gap-2 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5 text-rose-400" />
                      <span>Copy Full Report</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 font-mono text-xs space-y-3 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-slate-400 font-medium">Click "Generate Crystallographic Diagnosis" to produce an AI-assisted physical appraisal.</p>
                  <p className="text-[11px] text-slate-600 max-w-md mx-auto">
                    The engine reviews your Fourier size coefficients, Wilkens dislocation screening factor M, strain decay, and contrast factor parameters to deliver rigorous crystallographic insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Python / SciPy Script Exporter */}
        {activeAnalysisTab === 'python_export' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <Code className="w-5 h-5 text-emerald-400" />
                    Python & SciPy Warren-Averbach Reproducibility Script
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Standalone executable script using NumPy, SciPy, and Matplotlib
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatePythonScript());
                    setCopiedPython(true);
                    setTimeout(() => setCopiedPython(false), 2500);
                  }}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {copiedPython ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPython ? 'Copied to Clipboard' : 'Copy Python Code'}</span>
                </button>
              </div>

              <div className="relative z-10">
                <pre className="p-5 bg-black/70 rounded-2xl border border-white/10 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar selection:bg-emerald-500/30 selection:text-white">
                  <code>{generatePythonScript()}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tabular Data Indices Card */}
        <div className="bg-slate-950/80 backdrop-blur-2xl rounded-[2.5rem] ring-1 ring-white/10 ring-inset border border-emerald-500/20 overflow-hidden relative shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-black/40 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-black/60 rounded-xl border border-emerald-500/30">
                <Network className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-slate-100 tracking-tight font-sans">
                  Harmonic Coefficients & Microstrain Indices
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono mt-0.5">
                  Tabulated Fourier Spectrum with Number & Volume Weighted Distributions
                </p>
              </div>
            </div>

            {result && (
              <button
                onClick={handleDownloadCSV}
                className="text-[9px] font-bold font-mono uppercase tracking-widest text-slate-300 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-black/40 border-b border-white/5 font-mono">
                <tr>
                  <th className="px-6 py-4 font-bold">L [nm]</th>
                  <th className="px-6 py-4 font-bold">A_size (Fourier)</th>
                  <th className="px-6 py-4 font-bold">P_V(L) Volume Dist.</th>
                  <th className="px-6 py-4 font-bold">P_N(L) Number Dist.</th>
                  <th className="px-6 py-4 font-bold">RMS Strain ⟨ε²⟩¹/²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {result && result.sizeDistribution.map((row, i) => (
                  <tr key={`${row.L_nm}-${i}`} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-300">
                      {row.L_nm.toFixed(1)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-rose-400">
                      {row.A_size.toFixed(5)}
                    </td>
                    <td className="px-6 py-3.5 text-cyan-400 font-medium">
                      {(row.Pv_L || 0).toFixed(4)}
                    </td>
                    <td className="px-6 py-3.5 text-amber-400 font-medium">
                      {(row.Pn_L || 0).toFixed(4)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-400">
                      {result.strainDistribution[i]?.rms_strain ? result.strainDistribution[i].rms_strain.toExponential(4) : '0.0000e+0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Peak Profile to Fourier Converter Modal */}
      <WarrenAverbachPeakConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        wavelength={calcLambda}
        onApplyData={(dataStr, newD1, newD2) => {
          setInputData(dataStr);
          setD1(newD1);
          setD2(newD2);
          setSelectedMaterial('Custom (Transformed)');
        }}
      />

      </div>
    </div>
  );
};
