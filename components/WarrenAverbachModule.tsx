import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseWAInput, calculateWarrenAverbach, synthesizeWAHarmonicsFromPeaks } from '../utils/physics';
import { WAResult, WAMetrics } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import { DislocationMetricsVisualizer } from './DislocationMetricsVisualizer';
import { WarrenAverbachMetricsSummary } from './WarrenAverbachMetricsSummary';
import { WarrenAverbachPeakConverterModal } from './WarrenAverbachPeakConverterModal';
import { WarrenAverbachHarmonicsManager } from './WarrenAverbachHarmonicsManager';
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
  const [showHookComparison, setShowHookComparison] = useState<boolean>(true);
  const [showTangentLine, setShowTangentLine] = useState<boolean>(true);
  const [showNumberWeighted, setShowNumberWeighted] = useState<boolean>(true);
  const [showLogNormalFit, setShowLogNormalFit] = useState<boolean>(true);
  const [wilkensPlotMode, setWilkensPlotMode] = useState<'linearized' | 'rms_decay'>('linearized');

  // Interactive Hook-Effect Fit Window [L_min, L_max] (nm)
  const [hookMinL, setHookMinL] = useState<number>(2.0);
  const [hookMaxL, setHookMaxL] = useState<number>(8.0);

  // User-friendly Direct Peak FWHM Workflow Mode
  const [inputWorkflowMode, setInputWorkflowMode] = useState<'fourier_table' | 'direct_peaks'>('fourier_table');
  const [directPeak1Pos, setDirectPeak1Pos] = useState<number>(38.18);
  const [directPeak1Fwhm, setDirectPeak1Fwhm] = useState<number>(0.42);
  const [directPeak1Eta, setDirectPeak1Eta] = useState<number>(0.62);
  const [directPeak2Pos, setDirectPeak2Pos] = useState<number>(81.72);
  const [directPeak2Fwhm, setDirectPeak2Fwhm] = useState<number>(0.88);
  const [directPeak2Eta, setDirectPeak2Eta] = useState<number>(0.45);
  const [directInstFwhm, setDirectInstFwhm] = useState<number>(0.07);
  const [directHookStrength, setDirectHookStrength] = useState<number>(0.03);
  const [directComparativeMetrics, setDirectComparativeMetrics] = useState<{
    apparentScherrerSizeNm: number;
    williamsonHallSizeNm: number;
    williamsonHallStrain: number;
  } | null>(null);

  // AI Crystallographic Advisor State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [copiedAiReport, setCopiedAiReport] = useState<boolean>(false);

  // Python Code Export State
  const [copiedPython, setCopiedPython] = useState<boolean>(false);

  const [selectedDomainIndex, setSelectedDomainIndex] = useState<number>(0);
  const [selectedOrderPlotL, setSelectedOrderPlotL] = useState<number>(5);
  const [burgersVector, setBurgersVector] = useState<number>(MATERIAL_PRESETS[0].burgersVector);
  const [youngsModulus, setYoungsModulus] = useState<number>(MATERIAL_PRESETS[0].youngsModulus);

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'harmonics_editor' | 'size_pv' | 'strain_wilkens' | 'order_plots' | 'defect_topography' | 'metrics_report' | 'ai_advisor' | 'python_export'>('size_pv');
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

  // Synchronize Direct Peak FWHM sliders -> Fourier Harmonics table when in direct_peaks mode
  useEffect(() => {
    if (inputWorkflowMode !== 'direct_peaks') return;
    const synth = synthesizeWAHarmonicsFromPeaks({
      peaks: [
        { order: 1, twoTheta: directPeak1Pos, fwhmObs: directPeak1Fwhm, etaObs: directPeak1Eta },
        { order: 2, twoTheta: directPeak2Pos, fwhmObs: directPeak2Fwhm, etaObs: directPeak2Eta }
      ],
      fwhmInst: directInstFwhm,
      wavelength: calcLambda,
      maxL_nm: 25,
      simulateHookStrength: directHookStrength
    });
    setInputData(synth.dataString);
    setD1(synth.d1);
    setD2(synth.d2);
    setShowOrder3(false);
    setShowOrder4(false);
    setDirectComparativeMetrics({
      apparentScherrerSizeNm: synth.apparentScherrerSizeNm,
      williamsonHallSizeNm: synth.williamsonHallSizeNm,
      williamsonHallStrain: synth.williamsonHallStrain
    });
  }, [
    inputWorkflowMode,
    calcLambda,
    directPeak1Pos,
    directPeak1Fwhm,
    directPeak1Eta,
    directPeak2Pos,
    directPeak2Fwhm,
    directPeak2Eta,
    directInstFwhm,
    directHookStrength
  ]);

  const runWarrenAverbachCalculation = (scrollToResults = false) => {
    const points = parseWAInput(inputData);
    if (points.length < 2) return;
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
      contrastFactorC,
      { minL: hookMinL, maxL: hookMaxL },
      inputWorkflowMode === 'direct_peaks' && directComparativeMetrics ? directComparativeMetrics : undefined
    );
    setResult(computed);

    if (computed.orderPlots && computed.orderPlots.length > 0) {
      const hasCurrent = computed.orderPlots.some(p => Math.abs(p.L_nm - selectedOrderPlotL) < 0.1);
      if (!hasCurrent) {
        const defaultPt = computed.orderPlots.find(p => p.L_nm >= 4) || computed.orderPlots[0];
        setSelectedOrderPlotL(defaultPt.L_nm);
      }
    }

    if (scrollToResults) {
      setTimeout(() => {
        document.getElementById('wa-results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleCalculate = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      runWarrenAverbachCalculation(true);
      setIsAnalyzing(false);
    }, 150);
  };

  // Live auto-reactive calculation whenever parameters or harmonic table change
  useEffect(() => {
    runWarrenAverbachCalculation(false);
  }, [
    inputData,
    d1,
    d2,
    d3,
    d4,
    showOrder3,
    showOrder4,
    shapeFactor,
    strainModel,
    instrumentalCorrection,
    backgroundModel,
    instrumentalFactor,
    backgroundOffset,
    cutoffRadiusValue,
    hookCorrectionMode,
    burgersVector,
    youngsModulus,
    contrastFactorC,
    hookMinL,
    hookMaxL,
    inputWorkflowMode,
    directComparativeMetrics
  ]);

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
    <div className="space-y-5">
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
            setD4(p.d4);
            setShowOrder3(!!p.d3);
            setShowOrder4(!!p.d4);
            setBurgersVector(p.burgersVector);
            setYoungsModulus(p.youngsModulus);
            if (p.contrastFactor) setContrastFactorC(p.contrastFactor);
            setInputData(p.data);
          }
        }}
      />

      {/* 2. Scientific Workbench Header & Live Microstructure Telemetry Deck */}
      <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-400 shrink-0">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight font-sans">
                  Warren-Averbach Fourier Microstructure Workbench
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] font-mono font-bold">
                  {selectedMaterial}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono tabular-nums">
                  {showOrder4 ? '4 Harmonic Orders' : showOrder3 ? '3 Harmonic Orders' : '2 Harmonic Orders'} (d₁/d₂ = {(d1 / Math.max(0.0001, d2)).toFixed(2)}×)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Model-independent separation of coherent column-length distribution P(L), distance-dependent microstrain ⟨ε²(L)⟩¹/², and Krivoglaz-Wilkens dislocation screening.
              </p>
            </div>
          </div>

          {/* Quick Action Workbench Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsConverterOpen(true)}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Stokes Synthesizer</span>
            </button>

            <button
              onClick={() => setIsDEstimatorOpen(!isDEstimatorOpen)}
              className={`px-3 py-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                isDEstimatorOpen
                  ? 'bg-purple-500/25 text-purple-200 border-purple-500/50'
                  : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>d-Spacing Calc</span>
            </button>

            {result && (
              <button
                onClick={handleDownloadCSV}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>CSV</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-3 py-2 bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              title="Reset to default benchmark material"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 1-Click Material Benchmark Presets Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>1-Click Crystallographic Reference Standards:</span>
            <span className="text-slate-500">Click any standard to load harmonic series & elastic constants</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MATERIAL_PRESETS.map((m) => {
              const isSelected = selectedMaterial === m.label;
              const shortLabel = m.label.split(' (')[0];
              return (
                <button
                  key={m.label}
                  onClick={() => {
                    setInputWorkflowMode('fourier_table');
                    setSelectedMaterial(m.label);
                    setD1(m.d1);
                    setD2(m.d2);
                    if (m.d3) {
                      setD3(m.d3);
                      setShowOrder3(true);
                    } else {
                      setShowOrder3(false);
                    }
                    if (m.d4) {
                      setD4(m.d4);
                      setShowOrder4(true);
                    } else {
                      setShowOrder4(false);
                    }
                    setBurgersVector(m.burgersVector);
                    setYoungsModulus(m.youngsModulus);
                    if (m.contrastFactor) setContrastFactorC(m.contrastFactor);
                    setInputData(m.data);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold shadow-sm'
                      : 'bg-slate-950/90 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title={`${m.label} — ${m.desc}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-rose-400' : 'bg-slate-600'}`} />
                  <span>{shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Bragg / (hkl) d-Spacing Calculator Drawer */}
        <AnimatePresence>
          {isDEstimatorOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/30 space-y-3 mt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider">
                      Harmonic Interplanar d-Spacing Calculator (Bragg 2θ & Cubic hkl)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCalcMode('bragg')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                        calcMode === 'bragg' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      From Bragg Angles (2θ₁, 2θ₂)
                    </button>
                    <button
                      onClick={() => setCalcMode('bragghkl')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                        calcMode === 'bragghkl' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      From Cubic Lattice a & (hkl)
                    </button>
                    <button
                      onClick={() => setIsDEstimatorOpen(false)}
                      className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs font-mono"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {calcMode === 'bragg' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end font-mono text-xs tabular-nums">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Wavelength λ (Å)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={calcLambda}
                        onChange={(e) => setCalcLambda(parseFloat(e.target.value) || 1.5406)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Order 1 Peak 2θ₁ (°)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calc2Theta1}
                        onChange={(e) => setCalc2Theta1(parseFloat(e.target.value) || 38.18)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sky-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Order 2 Peak 2θ₂ (°)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calc2Theta2}
                        onChange={(e) => setCalc2Theta2(parseFloat(e.target.value) || 81.72)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-purple-300"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const rad1 = (calc2Theta1 * Math.PI) / 360;
                        const rad2 = (calc2Theta2 * Math.PI) / 360;
                        const newD1 = Number((calcLambda / (2 * Math.sin(rad1))).toFixed(4));
                        const newD2 = Number((calcLambda / (2 * Math.sin(rad2))).toFixed(4));
                        setD1(newD1);
                        setD2(newD2);
                        setD3(Number((newD1 / 3).toFixed(4)));
                        setSelectedMaterial('Custom (Bragg 2θ)');
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all"
                    >
                      Apply d₁={(calcLambda / (2 * Math.sin((calc2Theta1 * Math.PI) / 360))).toFixed(3)}Å, d₂={(calcLambda / (2 * Math.sin((calc2Theta2 * Math.PI) / 360))).toFixed(3)}Å
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end font-mono text-xs tabular-nums">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Cubic Lattice a (Å)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={calcLatticeA}
                        onChange={(e) => setCalcLatticeA(parseFloat(e.target.value) || 4.078)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Order 1 (h k l)</label>
                      <input
                        type="text"
                        value={calcHKL1}
                        onChange={(e) => setCalcHKL1(e.target.value)}
                        placeholder="1 1 1"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sky-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Order 2 (2h 2k 2l)</label>
                      <input
                        type="text"
                        value={calcHKL2}
                        onChange={(e) => setCalcHKL2(e.target.value)}
                        placeholder="2 2 2"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-purple-300"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const parseHkl = (str: string) => {
                          const parts = str.trim().split(/[\s,]+/).map(Number);
                          if (parts.length === 3 && parts.every(n => !isNaN(n))) return parts;
                          return [1, 1, 1];
                        };
                        const [h1, k1, l1] = parseHkl(calcHKL1);
                        const [h2, k2, l2] = parseHkl(calcHKL2);
                        const sq1 = Math.sqrt(h1 * h1 + k1 * k1 + l1 * l1) || 1;
                        const sq2 = Math.sqrt(h2 * h2 + k2 * k2 + l2 * l2) || 2;
                        const newD1 = Number((calcLatticeA / sq1).toFixed(4));
                        const newD2 = Number((calcLatticeA / sq2).toFixed(4));
                        setD1(newD1);
                        setD2(newD2);
                        setD3(Number((newD1 / 3).toFixed(4)));
                        setSelectedMaterial(`Custom (a=${calcLatticeA}Å)`);
                      }}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all"
                    >
                      Apply Cubic Harmonic dₙ
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live 6-Card Microstructure Telemetry Strip */}
        {result && result.metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 font-mono tabular-nums">
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[9px] text-slate-400 uppercase block">⟨D⟩_A Area Size</span>
              <div className="text-base font-bold text-rose-400 mt-0.5">
                {result.metrics.areaWeightedColumnLengthNm.toFixed(1)} <span className="text-[10px] text-slate-500">nm</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                Slope: {result.metrics.initialSlope.toFixed(3)} nm⁻¹
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[9px] text-slate-400 uppercase block">⟨D⟩_V Volume Size</span>
              <div className="text-base font-bold text-sky-400 mt-0.5">
                {result.metrics.volumeWeightedColumnLengthNm.toFixed(1)} <span className="text-[10px] text-slate-500">nm</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                Mode: {result.metrics.crystalliteSizeDistributionModeNm.toFixed(1)} nm
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[9px] text-slate-400 uppercase block">Polydispersity PDI</span>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {(result.metrics.polydispersityIndex || (result.metrics.volumeWeightedColumnLengthNm / Math.max(0.1, result.metrics.areaWeightedColumnLengthNm))).toFixed(2)}
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                ⟨D⟩_V / ⟨D⟩_A ratio
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[9px] text-slate-400 uppercase block">RMS Strain @ 5nm</span>
              <div className="text-base font-bold text-cyan-400 mt-0.5">
                {((result.metrics.rmsStrainAt5nm || 0) * 100).toFixed(3)} <span className="text-[10px] text-slate-500">%</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {(result.metrics.rmsStrainAt5nm || 0).toExponential(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[9px] text-slate-400 uppercase block">Dislocation ρ</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {result.metrics.dislocationDensity10_14.toFixed(2)} <span className="text-[10px] text-slate-500">×10¹⁴</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                lines / m² (C̄={contrastFactorC.toFixed(2)})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/90">
              <span className="text-[9px] text-slate-400 uppercase block">Wilkens Param M</span>
              <div className="text-base font-bold text-purple-400 mt-0.5">
                {result.metrics.wilkensArrangementParameterM.toFixed(2)}
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                R_e = {result.metrics.wilkensCutoffRadiusNm.toFixed(1)} nm
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 items-start">
      
      {/* Input Configuration Column */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-[#0B0F17] p-5 rounded-2xl border border-slate-800 shadow-2xl relative z-20">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/15 rounded-xl border border-rose-500/30 text-rose-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-tight font-sans">
                  Deconvolution Parameters
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Harmonic Orders, Hook Window & Input
                </p>
              </div>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-rose-500/40 rounded-lg text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1.5"
              >
                <span className="max-w-[110px] truncate">{selectedMaterial.split(' (')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMaterialMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMaterialMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute top-[calc(100%+6px)] right-0 w-72 bg-[#0A101C] border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-[100] py-1.5"
                  >
                    <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
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
                            if (m.d4) {
                              setD4(m.d4);
                              setShowOrder4(true);
                            } else {
                              setShowOrder4(false);
                            }
                            setBurgersVector(m.burgersVector);
                            setYoungsModulus(m.youngsModulus);
                            setInputData(m.data);
                            setIsMaterialMenuOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 flex flex-col items-start hover:bg-slate-900 transition-colors text-left ${selectedMaterial === m.label ? 'bg-rose-500/10' : ''}`}
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

          <div className="space-y-4 relative z-10">
            {/* AI Synthesizer */}
            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    AI Material Generator
                  </label>
                </div>
                <span className="text-[9px] font-mono text-slate-500">Synthesize any alloy</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Cold-rolled Brass (70/30)"
                  className="flex-1 px-3 py-1.5 bg-slate-900 text-slate-200 placeholder:text-slate-600 border border-slate-800 rounded-lg text-xs font-sans outline-none focus:border-rose-500/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                >
                  {isThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Reflection Orders d-Spacings with Harmonic Ratio Lock */}
            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  Reflection Orders (dₙ)
                </label>
                <div className="flex gap-1.5 text-[9px] font-mono">
                  <button
                    onClick={() => setShowOrder3(!showOrder3)}
                    className={`px-2 py-0.5 rounded border transition-colors ${showOrder3 ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    +Order 3
                  </button>
                  <button
                    onClick={() => setShowOrder4(!showOrder4)}
                    className={`px-2 py-0.5 rounded border transition-colors ${showOrder4 ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    +Order 4
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">d₁ (Order 1, Å)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={d1}
                    onChange={(e) => {
                      setD1(parseFloat(e.target.value) || 2.3551);
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 text-sky-300 border border-slate-800 rounded-lg text-xs font-bold outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400">d₂ (Order 2, Å)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={d2}
                    onChange={(e) => {
                      setD2(parseFloat(e.target.value) || 1.1776);
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 text-purple-300 border border-slate-800 rounded-lg text-xs font-bold outline-none focus:border-purple-500/50"
                  />
                </div>

                {showOrder3 && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">d₃ (Order 3, Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={d3 || ''}
                      placeholder="e.g. 0.7850"
                      onChange={(e) => {
                        setD3(parseFloat(e.target.value) || undefined);
                        setSelectedMaterial('Custom');
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 text-emerald-300 border border-slate-800 rounded-lg text-xs font-bold outline-none focus:border-emerald-500/50"
                    />
                  </div>
                )}

                {showOrder4 && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400">d₄ (Order 4, Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={d4 || ''}
                      placeholder="e.g. 0.5888"
                      onChange={(e) => {
                        setD4(parseFloat(e.target.value) || undefined);
                        setSelectedMaterial('Custom');
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 text-amber-300 border border-slate-800 rounded-lg text-xs font-bold outline-none focus:border-amber-500/50"
                    />
                  </div>
                )}
              </div>

              {/* Harmonic Ratio Status & 1-Click Auto-Lock */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] font-mono tabular-nums">
                <span className={Math.abs(d1 / Math.max(0.0001, d2) - 2.0) < 0.08 ? 'text-emerald-400' : 'text-amber-400'}>
                  Ratio d₁/d₂ = {(d1 / Math.max(0.0001, d2)).toFixed(3)}×
                </span>
                <button
                  onClick={() => {
                    setD2(Number((d1 / 2).toFixed(4)));
                    if (showOrder3) setD3(Number((d1 / 3).toFixed(4)));
                    if (showOrder4) setD4(Number((d1 / 4).toFixed(4)));
                  }}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[9px] uppercase tracking-wider transition-colors"
                  title="Set d₂ = d₁/2, d₃ = d₁/3, d₄ = d₁/4 for exact harmonic planes"
                >
                  Lock Exact d₁/n
                </button>
              </div>
            </div>

            {/* Dislocation Contrast Factor & Physics Controls */}
            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Contrast & Hook Physics
                  </label>
                </div>
                <span className="text-[9px] font-mono text-cyan-400 font-semibold">Krivoglaz-Wilkens</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono uppercase">Contrast Preset (C̄)</label>
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
                    className="w-full px-2 py-1.5 bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-[11px] font-mono outline-none"
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
                  <label className="text-[9px] text-slate-400 font-mono uppercase">Avg Contrast C̄</label>
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
                    className="w-full px-2.5 py-1.5 bg-slate-900 text-rose-400 border border-slate-800 rounded-lg text-xs font-mono tabular-nums font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono uppercase">Hook Correction</label>
                  <select
                    value={hookCorrectionMode}
                    onChange={(e) => setHookCorrectionMode(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-[11px] font-mono outline-none"
                  >
                    <option value="linear_tangent">Tangent Linearization</option>
                    <option value="spline_regularization">Spline Regularization</option>
                    <option value="polynomial">Monotonic Regularization</option>
                    <option value="none">Raw (No Hook Corr.)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-mono uppercase">Strain Model</label>
                  <select
                    value={strainModel}
                    onChange={(e) => setStrainModel(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-[11px] font-mono outline-none"
                  >
                    <option value="Dislocation (Wilkens)">Wilkens Dislocation</option>
                    <option value="Gaussian">Gaussian Model</option>
                    <option value="Lorentzian">Lorentzian Model</option>
                  </select>
                </div>
              </div>

              {hookCorrectionMode === 'linear_tangent' && (
                <div className="pt-2 border-t border-slate-800 space-y-2 font-mono tabular-nums">
                  <div className="flex items-center justify-between text-[9px] text-slate-400">
                    <span className="uppercase text-rose-300 font-bold">Hook Tangent Window [L_min, L_max]</span>
                    <span className="text-emerald-400 font-bold">[{hookMinL.toFixed(1)}, {hookMaxL.toFixed(1)}] nm</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>L_min (skip hook)</span>
                        <span className="text-slate-200">{hookMinL.toFixed(1)} nm</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="6.0"
                        step="0.5"
                        value={hookMinL}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setHookMinL(Math.min(v, hookMaxL - 1.0));
                        }}
                        className="w-full accent-rose-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>L_max (tangent end)</span>
                        <span className="text-slate-200">{hookMaxL.toFixed(1)} nm</span>
                      </div>
                      <input
                        type="range"
                        min="3.0"
                        max="15.0"
                        step="0.5"
                        value={hookMaxL}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setHookMaxL(Math.max(v, hookMinL + 1.0));
                        }}
                        className="w-full accent-rose-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Input Switcher: Fourier Table vs Direct Peak FWHM Sliders */}
            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Input Mode
                  </label>
                </div>
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-mono">
                  <button
                    onClick={() => setInputWorkflowMode('fourier_table')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      inputWorkflowMode === 'fourier_table'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Fourier A(L)
                  </button>
                  <button
                    onClick={() => {
                      setInputWorkflowMode('direct_peaks');
                      setSelectedMaterial('Live Peak Deconvolution');
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      inputWorkflowMode === 'direct_peaks'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Direct Peaks (FWHM)
                  </button>
                </div>
              </div>

              {inputWorkflowMode === 'direct_peaks' ? (
                <div className="space-y-3 pt-1 font-mono tabular-nums">
                  {/* Live Dual-Order Bragg Peak Profile SVG Visualizer */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span className="uppercase font-bold text-emerald-400">Live Bragg Peak Broadening Preview</span>
                      <span>Inst. g(2θ) = {directInstFwhm.toFixed(2)}°</span>
                    </div>
                    <svg viewBox="0 0 320 96" className="w-full h-24 rounded-lg bg-[#070B12] border border-slate-800/80">
                      {/* Grid Lines */}
                      <line x1="0" y1="80" x2="320" y2="80" stroke="#1e293b" strokeWidth="1" />
                      <line x1="160" y1="8" x2="160" y2="80" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="1" />
                      {(() => {
                        const evalPV = (x: number, fwhm: number, eta: number) => {
                          const w = Math.max(0.05, fwhm * 28);
                          const u = x / (w * 0.5);
                          const gauss = Math.exp(-Math.LN2 * u * u);
                          const lor = 1 / (1 + u * u);
                          return eta * lor + (1 - eta) * gauss;
                        };
                        const pts1: string[] = [];
                        const pts2: string[] = [];
                        const ptsInst1: string[] = [];
                        for (let px = 10; px <= 150; px += 2) {
                          const dx = px - 80;
                          const y = 80 - evalPV(dx, directPeak1Fwhm, directPeak1Eta) * 62;
                          const yInst = 80 - evalPV(dx, Math.max(0.04, directInstFwhm), 0.2) * 52;
                          pts1.push(`${px},${y.toFixed(1)}`);
                          ptsInst1.push(`${px},${yInst.toFixed(1)}`);
                        }
                        for (let px = 170; px <= 310; px += 2) {
                          const dx = px - 240;
                          const y = 80 - evalPV(dx, directPeak2Fwhm, directPeak2Eta) * 58;
                          pts2.push(`${px},${y.toFixed(1)}`);
                        }
                        return (
                          <>
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="1.2"
                              strokeDasharray="2 2"
                              points={ptsInst1.join(' ')}
                            />
                            <polygon
                              fill="rgba(56, 189, 248, 0.16)"
                              points={`10,80 ${pts1.join(' ')} 150,80`}
                            />
                            <polyline
                              fill="none"
                              stroke="#38bdf8"
                              strokeWidth="2"
                              points={pts1.join(' ')}
                            />
                            <polygon
                              fill="rgba(168, 85, 247, 0.16)"
                              points={`170,80 ${pts2.join(' ')} 310,80`}
                            />
                            <polyline
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="2"
                              points={pts2.join(' ')}
                            />
                            <text x="80" y="92" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                              Order 1 ({directPeak1Pos.toFixed(1)}°, β={directPeak1Fwhm.toFixed(2)}°)
                            </text>
                            <text x="240" y="92" textAnchor="middle" fill="#a855f7" fontSize="8" fontFamily="monospace">
                              Order 2 ({directPeak2Pos.toFixed(1)}°, β={directPeak2Fwhm.toFixed(2)}°)
                            </text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Peak 1 Controls */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/25 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-sky-400 font-bold uppercase">Order 1 Peak (2θ₁ = {directPeak1Pos.toFixed(2)}°)</span>
                      <span className="text-slate-400">d₁ = {d1.toFixed(4)} Å</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>FWHM₁</span>
                          <span className="text-sky-300 font-bold">{directPeak1Fwhm.toFixed(3)}°</span>
                        </div>
                        <input
                          type="range"
                          min="0.10"
                          max="1.50"
                          step="0.01"
                          value={directPeak1Fwhm}
                          onChange={(e) => setDirectPeak1Fwhm(parseFloat(e.target.value))}
                          className="w-full accent-sky-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Lorentz η₁</span>
                          <span className="text-sky-300 font-bold">{directPeak1Eta.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.95"
                          step="0.05"
                          value={directPeak1Eta}
                          onChange={(e) => setDirectPeak1Eta(parseFloat(e.target.value))}
                          className="w-full accent-sky-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Peak 2 Controls */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/25 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-purple-400 font-bold uppercase">Order 2 Peak (2θ₂ = {directPeak2Pos.toFixed(2)}°)</span>
                      <span className="text-slate-400">d₂ = {d2.toFixed(4)} Å</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>FWHM₂</span>
                          <span className="text-purple-300 font-bold">{directPeak2Fwhm.toFixed(3)}°</span>
                        </div>
                        <input
                          type="range"
                          min="0.15"
                          max="2.50"
                          step="0.01"
                          value={directPeak2Fwhm}
                          onChange={(e) => setDirectPeak2Fwhm(parseFloat(e.target.value))}
                          className="w-full accent-purple-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Lorentz η₂</span>
                          <span className="text-purple-300 font-bold">{directPeak2Eta.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.95"
                          step="0.05"
                          value={directPeak2Eta}
                          onChange={(e) => setDirectPeak2Eta(parseFloat(e.target.value))}
                          className="w-full accent-purple-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instrumental & Hook Sliders */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Inst. FWHM</span>
                        <span className="text-emerald-400 font-bold">{directInstFwhm.toFixed(3)}°</span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="0.20"
                        step="0.005"
                        value={directInstFwhm}
                        onChange={(e) => setDirectInstFwhm(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Hook Drop</span>
                        <span className="text-amber-400 font-bold">{(directHookStrength * 100).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.00"
                        max="0.12"
                        step="0.005"
                        value={directHookStrength}
                        onChange={(e) => setDirectHookStrength(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 h-1 bg-slate-950 rounded-lg cursor-pointer mt-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-slate-400">Format: L[nm], A(d₁), A(d₂)...</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveAnalysisTab('harmonics_editor')}
                        className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase"
                        title="Open Full Harmonics Spreadsheet Manager"
                      >
                        <Sliders className="w-3 h-3" /> Grid Editor
                      </button>
                      <button
                        onClick={handleClear}
                        className="text-[9px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={inputData}
                    onChange={(e) => {
                      setInputData(e.target.value);
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full h-28 px-3 py-2 bg-slate-900 text-rose-300 border border-slate-800 rounded-xl font-mono tabular-nums text-xs leading-relaxed resize-none focus:outline-none focus:border-rose-500/40 custom-scrollbar"
                    spellCheck={false}
                    placeholder="# L[nm], A(d1), A(d2)&#10;1, 0.985, 0.952"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setIsConverterOpen(true)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                    >
                      <Wand2 className="w-3 h-3" /> Stokes Synthesizer
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Prefix <code className="text-rose-400">!</code> to exclude row
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Analyze Action Button */}
            {!isAnalyzing ? (
              <button
                onClick={handleCalculate}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Recompute & Focus Charts</span>
              </button>
            ) : (
              <div className="bg-slate-900 p-3 rounded-xl border border-rose-500/40 text-center">
                <p className="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing Harmonics...
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Scientific Formulation Card */}
        <div className="bg-[#0B0F17] p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
              Warren-Averbach Formalism
            </h3>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono text-xs text-emerald-400">
            ln A(L, s) = ln A_S(L) - 2π² L² ⟨ε²⟩_L s²
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Plotting <span className="font-mono text-slate-200">ln A(L)</span> against <span className="font-mono text-slate-200">s² = 1/d²</span> at each column length <span className="font-mono text-slate-200">L</span> yields pure size <span className="font-mono text-rose-400">A_S(L)</span> from the intercept and microstrain <span className="font-mono text-cyan-400">⟨ε_L²⟩¹/²</span> from the slope.
          </p>
        </div>

      </div>

      {/* Results & Visual Analysis Column */}
      <div id="wa-results-section" className="lg:col-span-8 space-y-6">
        
        {/* Verification Control */}
        {result && (
          <ScientificMathControl
            title="Warren-Averbach Microstrain Harmonic Verification (Unit-Consistent L in Å)"
            formula="\langle \varepsilon_L^2 \rangle^{1/2} = \sqrt{\frac{\ln(A_1 / A_2)}{2 \pi^2 (10 \cdot L_{\text{nm}})^2 (1/d_2^2 - 1/d_1^2)}}"
            description="Deconvolve domain particle size from lattice microstrains across reflection orders with L converted from nm to Å to match d-spacings in Å."
            variables={[
              { symbol: 'A_1', name: 'Order 1 Harmonic', value: parsedPointsForMath.A1, unit: '' },
              { symbol: 'A_2', name: 'Order 2 Harmonic', value: parsedPointsForMath.A2, unit: '' },
              { symbol: 'L', name: 'Fourier Length', value: parsedPointsForMath.L_nm, unit: 'nm (=10 Å)' },
              { symbol: 'd_1', name: 'd-spacing (Order 1)', value: d1, unit: 'Å' },
              { symbol: 'd_2', name: 'd-spacing (Order 2)', value: d2, unit: 'Å' }
            ]}
            result={
              (() => {
                const s1 = 1 / d1;
                const s2 = 1 / d2;
                const L_Angstrom = parsedPointsForMath.L_nm * 10.0;
                const num = Math.log(parsedPointsForMath.A1 / parsedPointsForMath.A2);
                const den = 2 * Math.PI * Math.PI * (L_Angstrom * L_Angstrom) * (s2 * s2 - s1 * s1);
                return den !== 0 && num / den > 0 ? Math.sqrt(num / den) : 0;
              })()
            }
            resultUnit=""
            resultName="Calculated RMS Microstrain ⟨ε_L²⟩¹/²"
          />
        )}

        {/* Analysis Navigation Tabs */}
        <div className="bg-[#0B0F17] p-2 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {[
            { id: 'size_pv', code: '01', label: 'Size & Column P(L)', icon: TrendingDown },
            { id: 'strain_wilkens', code: '02', label: 'Microstrain & Wilkens', icon: Activity },
            { id: 'order_plots', code: '03', label: 'Order Plots ln A vs s²', icon: BarChart3 },
            { id: 'harmonics_editor', code: '04', label: 'Harmonics & Stokes', icon: Binary },
            { id: 'defect_topography', code: '05', label: 'Defect Topography', icon: Layers },
            { id: 'metrics_report', code: '06', label: 'Quantitative Report', icon: FileText },
            { id: 'ai_advisor', code: '07', label: 'AI Diagnostician', icon: BrainCircuit },
            { id: 'python_export', code: '08', label: 'Python / SciPy Code', icon: Code }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAnalysisTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAnalysisTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-[11px] font-mono font-bold tracking-wide transition-all flex items-center gap-2 border text-left ${
                  isActive
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className={`px-1.5 py-0.5 rounded text-[9px] tabular-nums ${isActive ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                  {tab.code}
                </span>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 0: Fourier Harmonic Coefficients & Stokes Deconvolution Manager */}
        {activeAnalysisTab === 'harmonics_editor' && (
          <div className="space-y-6">
            {/* Interactive Harmonics Grid & Text Manager */}
            <WarrenAverbachHarmonicsManager
              inputData={inputData}
              onChangeInputData={(newData) => {
                setInputData(newData);
                setSelectedMaterial('Custom');
              }}
              d1={d1}
              d2={d2}
              d3={showOrder3 ? d3 : undefined}
              d4={showOrder4 ? d4 : undefined}
              result={result}
              onOpenPeakConverter={() => setIsConverterOpen(true)}
            />

            {/* Fourier Harmonic Decay Curves & Stokes Breakdown */}
            {result?.harmonicsTable && result.harmonicsTable.length > 0 && (
              <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5 font-sans">
                      <Binary className="w-5 h-5 text-indigo-400" />
                      Multi-Order Fourier Harmonic Decay Curves Aₙ(L) & Pure Size A_S(L)
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                      Separation of Pure Size Fourier Decay A_S(L) and Strain Distortions A_D(L, sₙ)
                    </p>
                  </div>
                </div>

                {/* Harmonics Multi-Order Chart */}
                <div className="h-[380px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.harmonicsTable} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="L_nm" 
                        label={{ value: 'Column Length L [nm]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        domain={[0, 1.05]}
                        label={{ value: 'Fourier Cosine Harmonic Coeff A(L)', angle: -90, position: 'insideLeft', fill: '#818cf8', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', fontFamily: 'monospace' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

                      <Line
                        type="monotone"
                        dataKey="A_size"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#f43f5e' }}
                        name="Pure Size A_S(L)"
                      />

                      {result.harmonicsTable[0]?.A_size_tangent !== undefined && (
                        <Line
                          type="monotone"
                          dataKey="A_size_tangent"
                          stroke="#fb7185"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          name="Hook Tangent Extrapolation"
                        />
                      )}

                      <Line
                        type="monotone"
                        dataKey="A1_sample"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#38bdf8' }}
                        name={`Order 1 (d=${d1.toFixed(3)}Å)`}
                      />

                      <Line
                        type="monotone"
                        dataKey="A2_sample"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#a855f7' }}
                        name={`Order 2 (d=${d2.toFixed(3)}Å)`}
                      />

                      {showOrder3 && d3 && (
                        <Line
                          type="monotone"
                          dataKey="A3_sample"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#10b981' }}
                          name={`Order 3 (d=${d3.toFixed(3)}Å)`}
                        />
                      )}

                      {showOrder4 && d4 && (
                        <Line
                          type="monotone"
                          dataKey="A4_sample"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#f59e0b' }}
                          name={`Order 4 (d=${d4.toFixed(3)}Å)`}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Microstrain Distortions Fourier Factors A_D(L, s) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono uppercase">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Distortion Factor Decomposition A_D(L, sₙ)
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Lattice microstrain causes Fourier coefficients to decay faster at higher diffraction orders (s = 1/d):
                    </p>
                    <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-cyan-300 text-center border border-slate-800">
                      Aₙ(L) = A_S(L) × A_D(L, sₙ) = A_S(L) × exp(-2π² L² ⟨ε_L²⟩ sₙ²)
                    </div>
                  </div>

                  <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono uppercase">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Hook Effect Elimination
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Instrumental truncation or baseline curvature can cause an initial downward concave deviation at L → 0. The linear tangent extrapolated to L=0 recovers the true area-weighted column length ⟨D⟩_A = -1 / (dA_S/dL)_(L→0).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Size Fourier Decay A_S(L) & Column Distributions (P_V, P_N, Log-Normal) */}
        {activeAnalysisTab === 'size_pv' && (
          <div className="space-y-5">
            <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5 font-sans">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                    Size Deconvolution & Column Length Distributions P(L)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono tabular-nums uppercase tracking-widest mt-1">
                    Area-weighted ⟨D⟩_A = {result?.metrics?.areaWeightedColumnLengthNm.toFixed(1)} nm · Volume-weighted ⟨D⟩_V = {result?.metrics?.volumeWeightedColumnLengthNm.toFixed(1)} nm · PDI = {result?.metrics?.polydispersityIndex ? result.metrics.polydispersityIndex.toFixed(2) : '—'}
                  </p>
                </div>

                {/* Display Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-[10px] font-mono">
                  <button
                    onClick={() => setShowTangentLine(!showTangentLine)}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      showTangentLine ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    ⟨D⟩_A Tangent
                  </button>

                  <button
                    onClick={() => setShowHookComparison(!showHookComparison)}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      showHookComparison ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Pre-Hook Raw A_S
                  </button>

                  <button
                    onClick={() => setShowNumberWeighted(!showNumberWeighted)}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      showNumberWeighted ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    P_N(L) Number Dist.
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 bg-slate-950/90 rounded-xl border border-slate-800 font-mono tabular-nums text-[11px] relative z-10">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Area-Weighted ⟨D⟩_A:</span>
                    <span className="text-rose-400 font-bold">{result.metrics.areaWeightedColumnLengthNm.toFixed(2)} nm</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Volume-Weighted ⟨D⟩_V:</span>
                    <span className="text-sky-400 font-bold">{result.metrics.volumeWeightedColumnLengthNm.toFixed(2)} nm</span>
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
                    <span className="text-slate-500 block text-[9px] uppercase">Polydispersity (⟨D⟩_V/⟨D⟩_A):</span>
                    <span className="text-emerald-400 font-bold">{result.metrics.polydispersityIndex ? result.metrics.polydispersityIndex.toFixed(2) : '—'}</span>
                  </div>
                </div>
              )}

              {!result ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-mono text-xs">Computing Fourier profile...</span>
                </div>
              ) : (
                <>
                  <div className="h-[400px] w-full relative z-10">
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
                          type="number"
                          domain={[0, 'dataMax']}
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
                          contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                          itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', fontFamily: 'monospace' }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                        
                        {result.metrics?.areaWeightedColumnLengthNm && (
                          <ReferenceLine
                            yAxisId="left"
                            x={Number(result.metrics.areaWeightedColumnLengthNm.toFixed(2))}
                            stroke="#fb7185"
                            strokeDasharray="3 3"
                            label={{
                              value: `⟨D⟩_A = ${result.metrics.areaWeightedColumnLengthNm.toFixed(1)}nm`,
                              fill: '#fb7185',
                              fontSize: 10,
                              position: 'top'
                            }}
                          />
                        )}

                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="A_size"
                          stroke="#f43f5e"
                          strokeWidth={3}
                          fill="url(#sizeGrad)"
                          name="A_S(L) (Hook-Corrected Size)"
                          activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
                        />

                        {showTangentLine && (
                          <Line
                            yAxisId="left"
                            type="linear"
                            dataKey="A_size_tangent"
                            stroke="#fda4af"
                            strokeWidth={2}
                            strokeDasharray="6 4"
                            dot={false}
                            name="Initial Tangent → ⟨D⟩_A"
                          />
                        )}

                        {showHookComparison && (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="A_size_raw"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={{ r: 3, fill: '#10b981' }}
                            name="Raw Pre-Hook A_S(L)"
                          />
                        )}

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
                            dataKey="logNormal_fit"
                            stroke="#c084fc"
                            strokeWidth={2.5}
                            dot={false}
                            name="Analytical Log-Normal Fit"
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Interactive 1D Coherent Crystallite Column Schematic SVG */}
                  {result.metrics && (
                    <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-rose-400" />
                          Physical Coherent Column Model Along Diffraction Vector s ⊥ (hkl)
                        </span>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400">
                          P_V(L) ∝ L · (d²A_S / dL²) · Mode D_mode = {result.metrics.crystalliteSizeDistributionModeNm.toFixed(1)} nm
                        </span>
                      </div>

                      <svg viewBox="0 0 680 110" className="w-full h-28 rounded-lg bg-[#070B12] border border-slate-800/90">
                        {/* Crystallite Grain Boundary Outline */}
                        <ellipse cx="165" cy="55" rx="135" ry="42" fill="rgba(244, 63, 94, 0.06)" stroke="#334155" strokeDasharray="4 3" strokeWidth="1.5" />
                        {/* Coherent Unit Cell Columns of varying length L */}
                        {[
                          { y: 25, len: 120, label: 'L₁ (Edge Chord)' },
                          { y: 40, len: 210, label: `⟨D⟩_A = ${result.metrics.areaWeightedColumnLengthNm.toFixed(1)} nm`, color: '#fb7185' },
                          { y: 55, len: 256, label: `⟨D⟩_V = ${result.metrics.volumeWeightedColumnLengthNm.toFixed(1)} nm`, color: '#38bdf8' },
                          { y: 70, len: 195, label: 'Lᵢ Column' },
                          { y: 85, len: 105, label: 'Lₙ' }
                        ].map((col, idx) => {
                          const xStart = 165 - col.len / 2;
                          return (
                            <g key={idx}>
                              <rect
                                x={xStart}
                                y={col.y - 5}
                                width={col.len}
                                height={9}
                                rx={2}
                                fill={col.color ? `${col.color}22` : 'rgba(148, 163, 184, 0.12)'}
                                stroke={col.color || '#475569'}
                                strokeWidth={col.color ? '1.5' : '1'}
                              />
                              {/* Lattice planes ticks inside column */}
                              {Array.from({ length: Math.floor(col.len / 14) }).map((_, tIdx) => (
                                <line
                                  key={tIdx}
                                  x1={xStart + (tIdx + 1) * 14}
                                  y1={col.y - 4}
                                  x2={xStart + (tIdx + 1) * 14}
                                  y2={col.y + 3}
                                  stroke={col.color || '#64748b'}
                                  strokeOpacity="0.45"
                                  strokeWidth="1"
                                />
                              ))}
                            </g>
                          );
                        })}

                        {/* Explanatory Callouts on Right Side of Schematic */}
                        <line x1="330" y1="14" x2="330" y2="96" stroke="#1e293b" strokeWidth="1" />

                        <g transform="translate(348, 22)" fontFamily="monospace">
                          <rect x="0" y="0" width="10" height="10" rx="2" fill="rgba(251, 113, 133, 0.25)" stroke="#fb7185" />
                          <text x="16" y="9" fill="#f8fafc" fontSize="10" fontWeight="bold">
                            Area-Weighted Mean ⟨D⟩_A = {result.metrics.areaWeightedColumnLengthNm.toFixed(1)} nm
                          </text>
                          <text x="16" y="21" fill="#94a3b8" fontSize="9">
                            Extracted from initial tangent intercept: -1 / (dA_S/dL) at L → 0
                          </text>

                          <rect x="0" y="34" width="10" height="10" rx="2" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" />
                          <text x="16" y="43" fill="#f8fafc" fontSize="10" fontWeight="bold">
                            Volume-Weighted Mean ⟨D⟩_V = {result.metrics.volumeWeightedColumnLengthNm.toFixed(1)} nm
                          </text>
                          <text x="16" y="55" fill="#94a3b8" fontSize="9">
                            Integral of A_S(L): weights longer central crystallite chords (PDI = {(result.metrics.polydispersityIndex || (result.metrics.volumeWeightedColumnLengthNm / Math.max(0.1, result.metrics.areaWeightedColumnLengthNm))).toFixed(2)})
                          </text>

                          <text x="0" y="75" fill="#10b981" fontSize="9">
                            • d₁ = {d1.toFixed(4)} Å, d₂ = {d2.toFixed(4)} Å | Hook Window: [{hookMinL.toFixed(1)}, {hookMaxL.toFixed(1)}] nm
                          </text>
                        </g>
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: RMS Microstrain & Wilkens Dislocation Model */}
        {activeAnalysisTab === 'strain_wilkens' && (
          <div className="space-y-6">
            <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5 font-sans">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Microstrain Field & Wilkens Dislocation Model
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono tabular-nums uppercase tracking-widest mt-1">
                    Dislocation density ρ = {result?.metrics?.dislocationDensity10_14.toFixed(3)} × 10¹⁴ m⁻² · Strain @ 5nm = {result?.metrics?.rmsStrainAt5nm !== undefined ? `${(result.metrics.rmsStrainAt5nm * 100).toFixed(3)}%` : '—'} · Wilkens R² = {result?.metrics?.wilkensR2 !== undefined ? result.metrics.wilkensR2.toFixed(4) : '—'}
                  </p>
                </div>

                {/* Plot Mode Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setWilkensPlotMode('linearized')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      wilkensPlotMode === 'linearized'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Wilkens Linear Plot (⟨ε_L²⟩ vs ln 1/L)
                  </button>
                  <button
                    onClick={() => setWilkensPlotMode('rms_decay')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      wilkensPlotMode === 'rms_decay'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    RMS Strain Decay ⟨ε_L²⟩¹/² vs L
                  </button>
                </div>
              </div>

              {/* Wilkens Formalism Box */}
              <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono tabular-nums text-[11px] mb-4 relative z-10">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Dislocation Density ρ:</span>
                  <span className="text-cyan-400 font-bold">{result?.metrics?.dislocationDensity10_14.toFixed(3)} × 10¹⁴ m⁻²</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">RMS Strain (L=5nm):</span>
                  <span className="text-sky-400 font-bold">{result?.metrics?.rmsStrainAt5nm !== undefined ? `${(result.metrics.rmsStrainAt5nm * 100).toFixed(3)}%` : '—'}</span>
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
                          ln_inv_L: Math.log(1 / d.L_nm)
                        }))}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis 
                        dataKey="ln_inv_L" 
                        type="number"
                        domain={['dataMin - 0.15', 'dataMax + 0.15']}
                        tickFormatter={(val) => Number(val).toFixed(2)}
                        label={{ value: 'ln(1 / L) [ln(nm⁻¹)]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        tickFormatter={(val) => Number(val).toExponential(1)}
                        label={{ value: 'Mean Square Microstrain ⟨ε_L²⟩', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                        formatter={(val: any) => Number(val).toExponential(4)}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <Scatter dataKey="ms_strain" fill="#06b6d4" name="Observed ⟨ε_L²⟩" />
                      <Line
                        type="linear"
                        dataKey="wilkens_fit_ms"
                        stroke="#f43f5e"
                        strokeWidth={2.5}
                        dot={false}
                        name="Wilkens Logarithmic Regression Fit"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.strainDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="strainGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="L_nm" 
                        type="number"
                        domain={[0, 'dataMax']}
                        label={{ value: 'Column Length L [nm]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        tickFormatter={(val) => Number(val).toExponential(1)}
                        label={{ value: 'RMS Strain ⟨ε_L²⟩¹/²', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px' }}
                        formatter={(val: any) => Number(val).toExponential(4)}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <ReferenceLine
                        x={5}
                        stroke="#38bdf8"
                        strokeDasharray="3 3"
                        label={{ value: 'L = 5nm Benchmark', fill: '#38bdf8', fontSize: 10, position: 'top' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rms_strain" 
                        stroke="#06b6d4" 
                        strokeWidth={3} 
                        fill="url(#strainGrad)" 
                        name="Observed RMS Strain ⟨ε_L²⟩¹/²" 
                        activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="wilkens_fit_rms"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        dot={false}
                        name="Wilkens Dislocation Strain Fit"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Harmonic Order Regressions ln A(L) vs 1/d² */}
        {activeAnalysisTab === 'order_plots' && (
          <div className="space-y-6">
            <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5 font-sans">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Multi-Reflection Order Regression: ln A(L) vs 1/d²
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
                    Isolate Size (intercept at 1/d² → 0) and Microstrain (slope) across column length L
                  </p>
                </div>

                {result?.orderPlots && result.orderPlots.length > 0 && (
                  <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Scrub L:</span>
                    <input
                      type="range"
                      min={0}
                      max={result.orderPlots.length - 1}
                      step={1}
                      value={Math.max(0, result.orderPlots.findIndex(op => Math.abs(op.L_nm - selectedOrderPlotL) < 0.1))}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value, 10);
                        if (result.orderPlots[idx]) {
                          setSelectedOrderPlotL(result.orderPlots[idx].L_nm);
                        }
                      }}
                      className="w-28 accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <select
                      value={selectedOrderPlotL}
                      onChange={(e) => setSelectedOrderPlotL(parseFloat(e.target.value))}
                      className="bg-transparent text-rose-400 text-xs font-mono tabular-nums font-bold outline-none cursor-pointer"
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

              {/* 1-Click Quick L-Slice Selector Pills */}
              {result?.orderPlots && result.orderPlots.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-800/80 font-mono tabular-nums text-[10px]">
                  <span className="text-slate-500 uppercase mr-1">Column L Slices:</span>
                  {result.orderPlots.map((op) => {
                    const isSel = Math.abs(op.L_nm - selectedOrderPlotL) < 0.1;
                    return (
                      <button
                        key={op.L_nm}
                        onClick={() => setSelectedOrderPlotL(op.L_nm)}
                        className={`px-2 py-1 rounded-md border transition-all ${
                          isSel
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {op.L_nm.toFixed(0)}nm
                      </button>
                    );
                  })}
                </div>
              )}

              {activeOrderPlot ? (
                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/90 rounded-xl border border-slate-800 font-mono tabular-nums text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Column Length L:</span>
                      <span className="text-slate-100 font-bold text-sm">{activeOrderPlot.L_nm.toFixed(1)} nm ({(activeOrderPlot.L_nm * 10).toFixed(0)} Å)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Size Intercept A_S(L):</span>
                      <span className="text-rose-400 font-bold text-sm">{activeOrderPlot.A_size.toFixed(4)} (ln={Math.log(Math.max(1e-6, activeOrderPlot.A_size)).toFixed(3)})</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">RMS Microstrain ⟨ε_L²⟩¹/²:</span>
                      <span className="text-cyan-400 font-bold text-sm">{activeOrderPlot.rms_strain.toExponential(3)} ({(activeOrderPlot.rms_strain * 100).toFixed(3)}%)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Linearity R²:</span>
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
                          domain={[0, 'dataMax + 0.1']}
                          tickFormatter={(val) => Number(val).toFixed(2)}
                          label={{ value: 's² = 1 / d² [Å⁻²]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          label={{ value: 'ln A(L, s)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0b1120', border: '1px solid #1e293b', borderRadius: '12px', padding: '10px' }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                        <Scatter dataKey="lnA" fill="#f43f5e" name="Observed Harmonic ln A(L, s_n)" />
                        <Line
                          type="linear"
                          dataKey="fittedLnA"
                          stroke="#a855f7"
                          strokeWidth={2.5}
                          dot={false}
                          name="Linear Order Regression Fit"
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
            <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-5 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5 font-sans">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Crystallite Grain Defect & Strain Topography
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
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
                      <div className="space-y-5">
                        <DislocationMetricsVisualizer
                          dislDensity={dislDensity}
                          energyKJ={energyKJ}
                          burgersVectorNm={burgersVector}
                          youngsModulusGpa={youngsModulus}
                          columnLengthNm={activeItem.L_nm}
                          rmsStrain={activeItem.rms_strain}
                        />

                        {/* Interactive Sliders for Physical Constants */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/90 rounded-xl border border-slate-800 font-mono tabular-nums">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-slate-400">
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
                              className="w-full accent-rose-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-slate-400">
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
                              className="w-full accent-rose-500 h-1 bg-slate-900 rounded-lg cursor-pointer"
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
            <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5 font-sans">
                    <BrainCircuit className="w-5 h-5 text-rose-400" />
                    AI Crystallographic Diagnostician & Advisor
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
                    Automated domain size-strain decoupling validation, Wilkens parameter interpretation, and beamline tips
                  </p>
                </div>

                <button
                  onClick={handleGenerateAiReport}
                  disabled={isGeneratingReport || !result}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-950/90 rounded-xl border border-slate-800 font-mono tabular-nums text-xs mb-5 relative z-10">
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
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono mb-4">
                  {reportError}
                </div>
              )}

              {aiReport ? (
                <div className="space-y-4 relative z-10">
                  <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 font-sans text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap selection:bg-rose-500/30 selection:text-white">
                    {aiReport}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiReport);
                        setCopiedAiReport(true);
                        setTimeout(() => setCopiedAiReport(false), 2500);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-xl border border-slate-800 flex items-center gap-2 transition-all"
                    >
                      {copiedAiReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{copiedAiReport ? 'Copied to Clipboard!' : 'Copy Full Report'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-14 text-center text-slate-500 font-mono text-xs space-y-3 relative z-10">
                  <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-slate-300 font-medium">Click "Generate Crystallographic Diagnosis" to produce an AI-assisted physical appraisal.</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Reviews Fourier size coefficients, Wilkens dislocation screening factor M, strain decay, and contrast factor parameters to deliver rigorous crystallographic insights.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Python / SciPy Script Exporter */}
        {activeAnalysisTab === 'python_export' && (
          <div className="space-y-6">
            <div className="bg-[#0B0F17] p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 relative z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2.5 font-sans">
                    <Code className="w-5 h-5 text-emerald-400" />
                    Python & SciPy Warren-Averbach Reproducibility Script
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
                    Standalone executable script using NumPy, SciPy, and Matplotlib
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatePythonScript());
                    setCopiedPython(true);
                    setTimeout(() => setCopiedPython(false), 2500);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {copiedPython ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPython ? 'Copied to Clipboard' : 'Copy Python Code'}</span>
                </button>
              </div>

              <div className="relative z-10">
                <pre className="p-5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar selection:bg-emerald-500/30 selection:text-white">
                  <code>{generatePythonScript()}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tabular Data Indices Card */}
        <div className="bg-[#0B0F17] rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">
          <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/30">
                <Network className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100 tracking-tight font-sans">
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
                className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-300 hover:text-emerald-400 bg-slate-900 hover:bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar relative z-10">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-900 sticky top-0 z-10 border-b border-slate-800 font-mono">
                <tr>
                  <th className="px-5 py-3 font-bold">L [nm]</th>
                  <th className="px-5 py-3 font-bold">A_S(L) Pure Size</th>
                  <th className="px-5 py-3 font-bold">P_V(L) Volume Dist.</th>
                  <th className="px-5 py-3 font-bold">P_N(L) Number Dist.</th>
                  <th className="px-5 py-3 font-bold">RMS Strain ⟨ε_L²⟩¹/²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums text-xs">
                {result && result.sizeDistribution.map((row, i) => {
                  const strainVal = result.strainDistribution[i]?.rms_strain || 0;
                  const aPct = Math.max(0, Math.min(100, row.A_size * 100));
                  const pvPct = Math.max(0, Math.min(100, (row.Pv_L || 0) * 100));
                  return (
                    <tr key={`${row.L_nm}-${i}`} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-5 py-2.5 font-bold text-slate-200">
                        {row.L_nm.toFixed(1)}
                      </td>
                      <td className="px-5 py-2.5 font-bold text-rose-400">
                        <div className="flex items-center gap-2.5">
                          <span className="w-16">{row.A_size.toFixed(5)}</span>
                          <div className="w-14 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-rose-500" style={{ width: `${aPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-sky-400 font-medium">
                        <div className="flex items-center gap-2.5">
                          <span className="w-14">{(row.Pv_L || 0).toFixed(4)}</span>
                          <div className="w-12 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-sky-400" style={{ width: `${pvPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-amber-400 font-medium">
                        {(row.Pn_L || 0).toFixed(4)}
                      </td>
                      <td className="px-5 py-2.5 font-bold text-emerald-400">
                        {strainVal > 0 ? `${(strainVal * 100).toFixed(3)}% (${strainVal.toExponential(2)})` : '0.000%'}
                      </td>
                    </tr>
                  );
                })}
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

export default WarrenAverbachModule;

