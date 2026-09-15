import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseIBAdvancedInput, calculateIBAdvanced, XRAY_WAVELENGTHS } from '../utils/physics';
import { IBAdvancedResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import { PythonCodeExporter } from './PythonCodeExporter';
import Markdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import voigtBg from '../src/assets/images/voigt_ui_bg_1786057688362.jpg';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  RefreshCw, 
  Trash2, 
  Settings2, 
  TrendingUp, 
  ChevronDown, 
  Zap, 
  Download, 
  Database, 
  Activity, 
  Layers, 
  CheckCircle, 
  FlaskConical, 
  Loader2, 
  Box,
  Sparkles,
  Copy,
  Cpu,
  BarChart2,
  Sliders,
  Check,
  Eye,
  EyeOff,
  BookOpen,
  GitCompare,
  Atom,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MATERIAL_PRESETS = [
  { 
    label: 'Silicon (Si) NIST 640', 
    data: "28.44, 230, 1000, 1 1 1\n47.30, 280, 950, 2 2 0\n56.12, 350, 900, 3 1 1\n69.13, 400, 850, 4 0 0\n76.38, 450, 800, 3 3 1",
    desc: 'Standard Reference Material (Minimal Strain)',
    youngsModulus: 130,
    density: 2.33
  },
  { 
    label: 'Cerium Oxide (CeO2)', 
    data: "28.55, 310, 1200, 1 1 1\n33.08, 410, 1100, 2 0 0\n47.48, 550, 1000, 2 2 0\n56.33, 620, 950, 3 1 1\n59.08, 680, 900, 2 2 2",
    desc: 'Nanocrystalline Ceria (High Microstrain)',
    youngsModulus: 220,
    density: 7.22
  },
  { 
    label: 'Titanium Dioxide (Anatase)', 
    data: "25.28, 380, 1150, 1 0 1\n37.80, 440, 1020, 0 0 4\n48.05, 520, 980, 2 0 0\n53.89, 580, 920, 1 0 5\n55.06, 610, 890, 2 1 1\n62.69, 700, 840, 2 0 4",
    desc: 'Tetragonal Anatase Nanoparticles',
    youngsModulus: 178,
    density: 3.89
  },
  { 
    label: 'Zinc Oxide (ZnO)', 
    data: "31.77, 300, 1200, 1 0 0\n34.42, 340, 1150, 0 0 2\n36.25, 310, 1250, 1 0 1\n47.54, 430, 1050, 1 0 2\n56.60, 500, 980, 1 1 0\n62.86, 560, 930, 1 0 3",
    desc: 'Wurtzite Nanorods (Anisotropic Broadening)',
    youngsModulus: 140,
    density: 5.61
  },
  { 
    label: 'Aluminum (Al)', 
    data: "38.47, 450, 1100, 1 1 1\n44.72, 480, 1050, 2 0 0\n65.10, 520, 1000, 2 2 0\n78.23, 560, 950, 3 1 1",
    desc: 'Annealed FCC Aluminum Powder',
    youngsModulus: 70,
    density: 2.70
  },
  { 
    label: 'Iron (Fe) Nanopowder', 
    data: "44.67, 850, 900, 1 1 0\n65.02, 920, 850, 2 0 0\n82.33, 1100, 800, 2 1 1",
    desc: 'BCC Iron Nanoparticles (High Defect Density)',
    youngsModulus: 211,
    density: 7.87
  },
  { 
    label: 'Stainless Steel 316L', 
    data: "43.6, 320, 1000, 1 1 1\n50.8, 380, 950, 2 0 0\n74.7, 450, 850, 2 2 0\n90.7, 520, 800, 3 1 1\n95.9, 580, 750, 2 2 2",
    desc: 'Austenitic SS (Deformation-Induced Strain)',
    youngsModulus: 193,
    density: 7.98
  }
];

const K_FACTORS = [
  { label: 'Integral Breadth', value: 1.0, desc: 'Exact factor when using Integral Breadth (Recommended)', icon: '∫' },
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown morphologies', icon: '⚡' },
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical particles', icon: '⚪' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Platelets/Disks', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

export const IntegralBreadthAdvancedModule: React.FC = () => {
  const { lengthUnit = 'Å' } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(1.0);
  const [instBetaIB, setInstBetaIB] = useState<number>(0.05);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  
  // Size-strain deconvolution & separation state
  const [decouplingMethod, setDecouplingMethod] = useState<'linear' | 'squared' | 'hw_voigt' | 'none'>('linear');
  const [separationMethod, setSeparationMethod] = useState<'udm' | 'usdm' | 'hw' | 'ssp' | 'udedm' | 'mwh'>('udm');
  const [youngsModulusGPa, setYoungsModulusGPa] = useState<number>(130);
  const [materialDensityGcm3, setMaterialDensityGcm3] = useState<number>(2.33);

  // Outlier exclusion indices
  const [excludedIndices, setExcludedIndices] = useState<number[]>([]);

  // Visualizer tab
  const [activeChartTab, setActiveChartTab] = useState<'fit' | 'residuals' | 'apparentSizes' | 'elasticState' | 'modelMatrix' | 'advisor'>('fit');

  // Input Data
  const [inputData, setInputData] = useState<string>(MATERIAL_PRESETS[0].data);
  const [result, setResult] = useState<IBAdvancedResult | null>(null);
  
  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIAL_PRESETS[0].label);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const [selectedKType, setSelectedKType] = useState<string>('Integral Breadth');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);

  // AI smart load
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [copiedSummaryNotification, setCopiedSummaryNotification] = useState<boolean>(false);

  // AI Advisor State
  const [isAdvisorLoading, setIsAdvisorLoading] = useState<boolean>(false);
  const [advisorReport, setAdvisorReport] = useState<string | null>(null);
  const [advisorError, setAdvisorError] = useState<string | null>(null);

  const matMenuRef = useRef<HTMLDivElement>(null);
  const kMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (matMenuRef.current && !matMenuRef.current.contains(event.target as Node)) {
        setIsMaterialMenuOpen(false);
      }
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    setWavelength(1.5406);
    setConstantK(1.0);
    setSelectedKType('Integral Breadth');
    setInstBetaIB(0.05);
    setInputData(MATERIAL_PRESETS[0].data);
    setSelectedMaterial(MATERIAL_PRESETS[0].label);
    setInstrumentalMode('constant');
    setCagliotiU(0.005);
    setCagliotiV(-0.002);
    setCagliotiW(0.015);
    setDecouplingMethod('linear');
    setSeparationMethod('udm');
    setYoungsModulusGPa(130);
    setMaterialDensityGcm3(2.33);
    setExcludedIndices([]);
    setAdvisorReport(null);
  };

  const handleClear = () => {
    setInputData("");
    setExcludedIndices([]);
    setAdvisorReport(null);
  };

  const toggleExcludePeak = (index: number) => {
    setExcludedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const resetExclusions = () => {
    setExcludedIndices([]);
  };

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // Core Calculation Function
  const runCalculation = (currentExclusions: number[] = excludedIndices) => {
    const peaks = parseIBAdvancedInput(inputData);
    if (peaks.length < 2) {
      setResult(null);
      return;
    }
    const computed = calculateIBAdvanced(
      wavelength,
      constantK,
      instBetaIB,
      peaks,
      instrumentalMode,
      { U: cagliotiU, V: cagliotiV, W: cagliotiW },
      decouplingMethod,
      youngsModulusGPa > 0 ? youngsModulusGPa : undefined,
      separationMethod,
      materialDensityGcm3 > 0 ? materialDensityGcm3 : 2.33,
      currentExclusions
    );
    setResult(computed);
  };

  const handleCalculateWithSimulation = () => {
    if (isSimulationRunning) return;
    
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 250);
    setTimeout(() => setSimulationStep(3), 500);
    setTimeout(() => setSimulationStep(4), 750);
    setTimeout(() => setSimulationStep(5), 1000);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      runCalculation();
    }, 1250);
  };

  // Initial and reactive calculation
  useEffect(() => {
    runCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wavelength,
    constantK,
    instBetaIB,
    instrumentalMode,
    cagliotiU,
    cagliotiV,
    cagliotiW,
    decouplingMethod,
    youngsModulusGPa,
    separationMethod,
    materialDensityGcm3,
    excludedIndices,
    inputData
  ]);

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const res = await fetch('/api/gemini/generate-ib-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, wavelength })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const formattedData = data.data.map((p: any) => {
          const hklStr = p.hkl && Array.isArray(p.hkl) ? `, ${p.hkl.join(' ')}` : '';
          return `${p.twoTheta.toFixed(2)}, ${p.area.toFixed(1)}, ${p.iMax ? p.iMax.toFixed(0) : '1000'}${hklStr}`;
        }).join('\n');
        setInputData(formattedData);
        setSelectedMaterial(`AI: ${searchQuery}`);
        setExcludedIndices([]);
        setAdvisorReport(null);
      }
    } catch (error: any) {
      console.error("Error generating advanced IB data:", error);
    } finally {
      setIsThinking(false);
    }
  };

  // Generate peer-reviewed AI advisor report
  const handleGenerateAdvisorReport = async () => {
    if (!result) return;
    setIsAdvisorLoading(true);
    setAdvisorError(null);
    setActiveChartTab('advisor');

    try {
      const payload = {
        materialName: selectedMaterial,
        wavelength,
        decouplingMethod,
        separationMethod,
        results: {
          crystalliteSizeNm: result.sizeInterceptNm,
          microstrainPercent: result.strainPercent,
          rSquared: result.regression.rSquared,
          adjustedRSquared: result.regression.adjustedRSquared,
          slope: result.regression.slope,
          intercept: result.regression.intercept,
          stressMPa: result.stressMPa,
          energyDensityKjM3: result.energyDensityKjM3,
          dislocationDensity10_14: result.dislocationDensity10_14,
          specificSurfaceAreaM2g: result.specificSurfaceAreaM2g
        },
        advancedResult: result
      };

      const res = await fetch('/api/gemini/ib-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success && json.report) {
        setAdvisorReport(json.report);
      } else {
        setAdvisorError(json.error || 'Failed to synthesize crystallographic report.');
      }
    } catch (err: any) {
      setAdvisorError(err.message || 'Network error communicating with AI Advisor.');
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "Reflection_2Theta_deg,HKL,d_spacing_A,beta_Obs_deg,beta_Inst_deg,beta_Sample_deg,X_Coord,Y_Coord,Y_Fit,Residual,Single_Peak_Size_nm,DislocationDensity_10_14_m2,SpecificSurfaceArea_m2_g,IsExcluded\n";
    const rows = (result.pointsExtended || []).map((p) => {
      const fitY = result.regression.slope * p.x + result.regression.intercept;
      const hklStr = p.hkl ? `"${p.hkl.join(' ')}"` : '""';
      return `${p.twoTheta.toFixed(4)},${hklStr},${p.dSpacing?.toFixed(4) || ''},${p.betaObsDeg.toFixed(4)},${p.betaInstDeg.toFixed(4)},${p.betaSampleDeg.toFixed(4)},${p.x.toFixed(6)},${p.y.toFixed(6)},${fitY.toFixed(6)},${(p.residual !== undefined ? p.residual : p.y - fitY).toFixed(6)},${p.singlePeakSizeNm.toFixed(2)},${p.dislocationDensity10_14?.toFixed(3) || ''},${p.specificSurfaceAreaM2g?.toFixed(2) || ''},${p.isExcluded ? 'TRUE' : 'FALSE'}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ib_advanced_${separationMethod}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyPublicationSummary = () => {
    if (!result) return;
    const summary = `Crystallite Size and Lattice Microstrain Analysis (Integral Breadth Method)
================================================================================
Material / Sample: ${selectedMaterial}
Radiation Wavelength: ${wavelength} Å (Shape Factor K = ${constantK})
Instrumental Mode: ${instrumentalMode === 'constant' ? `Constant β_inst = ${instBetaIB}°` : `Caglioti Curve (U=${cagliotiU}, V=${cagliotiV}, W=${cagliotiW})`}
Decoupling Mode: ${decouplingMethod.toUpperCase()}
Separation Model: ${separationMethod.toUpperCase()}
--------------------------------------------------------------------------------
Apparent Crystallite Size (D): ${result.sizeInterceptNm > 0 && result.sizeInterceptNm < 1000 ? `${result.sizeInterceptNm.toFixed(2)} nm` : '> 250 nm'}
Lattice Microstrain (ε): ${(result.strainPercent / 100 * 1000).toFixed(3)} × 10⁻³ (${result.strainPercent.toFixed(4)} %)
Young's Modulus (E): ${youngsModulusGPa} GPa
Lattice Stress (σ): ${result.stressMPa !== undefined ? `${result.stressMPa.toFixed(2)} MPa` : 'N/A'}
Strain Energy Density (u): ${result.energyDensityKjM3 !== undefined ? `${result.energyDensityKjM3.toFixed(3)} kJ/m³` : 'N/A'}
Dislocation Density (ρ_d): ${result.dislocationDensity10_14 !== undefined ? `${result.dislocationDensity10_14.toFixed(3)} × 10¹⁴ m⁻²` : 'N/A'}
Specific Surface Area (SSA): ${result.specificSurfaceAreaM2g !== undefined ? `${result.specificSurfaceAreaM2g.toFixed(2)} m²/g` : 'N/A'} (Density = ${materialDensityGcm3} g/cm³)
--------------------------------------------------------------------------------
Goodness of Fit:
  R² = ${result.regression.rSquared.toFixed(5)}
  Adjusted R² = ${result.regression.adjustedRSquared?.toFixed(5) || 'N/A'}
  Pearson r = ${result.regression.pearsonR?.toFixed(5) || 'N/A'}
  RMSE = ${result.regression.rmse?.toExponential(3) || 'N/A'}
  Durbin-Watson = ${result.regression.durbinWatson?.toFixed(3) || 'N/A'}
  Excluded Reflections: ${excludedIndices.length > 0 ? excludedIndices.map(i => `#${i + 1}`).join(', ') : 'None'}
================================================================================`;
    navigator.clipboard.writeText(summary);
    setCopiedSummaryNotification(true);
    setTimeout(() => setCopiedSummaryNotification(false), 2200);
  };

  const handleCopyJSON = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Prepare chart data with inclusion/exclusion status
  const chartData = useMemo(() => {
    if (!result) return [];
    const stdDev = Math.sqrt(
      result.points.reduce((sum, pt) => {
        const yPred = result.regression.slope * pt.x + result.regression.intercept;
        return sum + Math.pow(pt.y - yPred, 2);
      }, 0) / Math.max(1, result.points.length - 2)
    );
    const confidenceBound = stdDev * 2.0;

    return (result.pointsExtended || []).map((pe, idx) => {
      const fitY = result.regression.slope * pe.x + result.regression.intercept;
      return {
        originalIndex: idx,
        x: pe.x,
        y: pe.y,
        fit: fitY,
        fitRange: [Math.max(0, fitY - confidenceBound), fitY + confidenceBound],
        residual: pe.residual !== undefined ? pe.residual : pe.y - fitY,
        twoTheta: pe.twoTheta,
        betaSample: pe.betaSampleDeg,
        singleSize: pe.singlePeakSizeNm || 0,
        isExcluded: pe.isExcluded || false,
        hklStr: pe.hkl ? `(${pe.hkl.join(' ')})` : ''
      };
    }).sort((a, b) => a.x - b.x);
  }, [result]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      
      let xLabel = 'X (4sinθ)';
      let yLabel = 'Y (βcosθ)';
      if (separationMethod === 'hw') {
        xLabel = 'X (β/(tanθ·sinθ))';
        yLabel = 'Y (β/tanθ)²';
      } else if (separationMethod === 'ssp') {
        xLabel = 'X (d²·βcosθ)';
        yLabel = 'Y (d·βcosθ)²';
      } else if (separationMethod === 'udedm') {
        xLabel = 'X (4sinθ·√(2/E))';
        yLabel = 'Y (βcosθ)';
      } else if (separationMethod === 'usdm') {
        xLabel = 'X (4sinθ/E)';
        yLabel = 'Y (βcosθ)';
      } else if (separationMethod === 'mwh') {
        xLabel = 'X (s·√C_hkl)';
        yLabel = 'Y (βcosθ)';
      }

      return (
        <div className="bg-[#0A101C] text-white p-4 rounded-xl shadow-[0_0_30px_rgba(244,114,182,0.15)] border border-pink-500/30 text-xs font-mono">
          <p className="font-black mb-3 text-pink-400 border-b border-white/5 pb-2 uppercase tracking-widest flex justify-between items-center gap-4">
            <span>Reflection {d.twoTheta?.toFixed(2)}° 2θ {d.hklStr}</span>
            {d.isExcluded && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                EXCLUDED
              </span>
            )}
          </p>
          <div className="space-y-2 text-[10px]">
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">β_sample</span> <span className="text-pink-300 font-bold">{d.betaSample?.toFixed(4)}°</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">{xLabel}</span> <span className="text-cyan-300 font-bold">{d.x?.toExponential(3)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">{yLabel}</span> <span className="text-cyan-300 font-bold">{d.y?.toExponential(3)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Apparent Size</span> <span className="text-emerald-300 font-bold">{d.singleSize > 0 ? `${d.singleSize.toFixed(1)} nm` : '> 250 nm'}</span></p>
            <p className="flex justify-between gap-6 border-t border-white/5 pt-2 mt-2">
              <span className="text-slate-500 uppercase">Residual (ΔY)</span>
              <span className={`font-bold ${d.residual > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {d.residual > 0 ? '+' : ''}{d.residual?.toExponential(2)}
              </span>
            </p>
          </div>
          <p className="text-[9px] text-slate-500 mt-2 italic text-center">Click point to toggle outlier exclusion</p>
        </div>
      );
    }
    return null;
  };

  const getMethodFormula = () => {
    switch (separationMethod) {
      case 'hw':
        return "\\left(\\frac{\\beta}{\\tan\\theta}\\right)^2 = \\frac{K\\lambda}{D} \\left(\\frac{\\beta}{\\tan\\theta \\sin\\theta}\\right) + 16\\varepsilon^2";
      case 'ssp':
        return "\\left(d_{hkl} \\beta \\cos\\theta\\right)^2 = \\frac{K\\lambda}{D} \\left(d_{hkl}^2 \\beta \\cos\\theta\\right) + \\frac{\\varepsilon^2}{4}";
      case 'udedm':
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + 4 \\sin\\theta \\sqrt{\\frac{2u}{E}}";
      case 'usdm':
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + \\frac{4\\sigma}{E} \\sin\\theta";
      case 'mwh':
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + \\alpha s \\sqrt{C_{hkl}}";
      case 'udm':
      default:
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + 4 \\varepsilon \\sin\\theta";
    }
  };

  const getDecouplingFormula = () => {
    switch (decouplingMethod) {
      case 'linear':
        return "\\beta_{\\text{sample}} = \\beta_{\\text{obs}} - \\beta_{\\text{inst}} \\quad \\text{(Lorentzian/Cauchy)}";
      case 'squared':
        return "\\beta_{\\text{sample}}^2 = \\beta_{\\text{obs}}^2 - \\beta_{\\text{inst}}^2 \\quad \\text{(Gaussian)}";
      case 'hw_voigt':
        return "\\beta_{\\text{sample}} = \\beta_{\\text{obs}} \\sqrt{1 - (\\beta_{\\text{inst}}/\\beta_{\\text{obs}})^2} \\quad \\text{(Halder-Wagner Voigt)}";
      case 'none':
      default:
        return "\\beta_{\\text{sample}} = \\beta_{\\text{obs}} \\quad \\text{(Raw Instrumental Bypass)}";
    }
  };

  // Build python script for custom script exporter
  const generateCustomPythonScript = (): string => {
    return `#!/usr/bin/env python3
# ==============================================================================
# Integral Breadth (IB) Advanced Analysis - ${separationMethod.toUpperCase()} Model
# Decoupling Mode: ${decouplingMethod.toUpperCase()} | Wavelength: ${wavelength} A
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

wavelength = ${wavelength}  # Angstrom
K = ${constantK}
inst_beta = ${instBetaIB}  # degrees
youngs_modulus_GPa = ${youngsModulusGPa}
density_g_cm3 = ${materialDensityGcm3}

# Raw reflections: (2theta, area, imax)
raw_data = np.array([
${(result?.pointsExtended || []).map(p => `    [${p.twoTheta}, ${p.betaObsDeg * 1000}, 1000]`).join(',\n')}
])

two_theta = raw_data[:, 0]
area = raw_data[:, 1]
i_max = raw_data[:, 2]

# Instrumental deconvolution
beta_obs_rad = (area / i_max) * (np.pi / 180.0)
beta_inst_rad = inst_beta * (np.pi / 180.0)

${decouplingMethod === 'squared' 
  ? 'beta_sample_rad = np.sqrt(np.maximum(0, beta_obs_rad**2 - beta_inst_rad**2))'
  : decouplingMethod === 'hw_voigt'
  ? 'beta_sample_rad = beta_obs_rad * np.sqrt(np.maximum(1e-6, 1.0 - (beta_inst_rad / beta_obs_rad)**2))'
  : decouplingMethod === 'none'
  ? 'beta_sample_rad = beta_obs_rad'
  : 'beta_sample_rad = np.maximum(0, beta_obs_rad - beta_inst_rad)'}

theta_rad = (two_theta / 2.0) * (np.pi / 180.0)
cos_t = np.cos(theta_rad)
sin_t = np.sin(theta_rad)
tan_t = np.tan(theta_rad)

# Coordinate transformation for ${separationMethod.toUpperCase()}
${separationMethod === 'hw'
  ? 'x = beta_sample_rad / (tan_t * sin_t)\ny = (beta_sample_rad / tan_t)**2'
  : separationMethod === 'ssp'
  ? 'd_spacing = wavelength / (2.0 * sin_t)\nx = (d_spacing**2) * beta_sample_rad * cos_t\ny = (d_spacing * beta_sample_rad * cos_t)**2'
  : separationMethod === 'udedm'
  ? `E_Pa = youngs_modulus_GPa * 1e9\nx = 4.0 * sin_t * np.sqrt(2.0 / E_Pa)\ny = beta_sample_rad * cos_t`
  : separationMethod === 'usdm'
  ? `E_Pa = youngs_modulus_GPa * 1e9\nx = 4.0 * sin_t / E_Pa\ny = beta_sample_rad * cos_t`
  : `x = 4.0 * sin_t\ny = beta_sample_rad * cos_t`}

# Linear Regression
slope, intercept, r_val, p_val, std_err = stats.linregress(x, y)
r_squared = r_val**2

# Derive Physical Parameters
${separationMethod === 'hw'
  ? 'D_nm = (K * wavelength) / slope / 10.0 if slope > 0 else 0\nstrain = np.sqrt(np.abs(intercept)) / 4.0'
  : separationMethod === 'ssp'
  ? 'D_nm = (K * wavelength) / slope / 10.0 if slope > 0 else 0\nstrain = np.sqrt(np.abs(intercept)) / 2.0'
  : separationMethod === 'udedm'
  ? 'D_nm = (K * wavelength) / intercept / 10.0 if intercept > 0 else 0\nu_density = slope**2\nstrain = np.sqrt((2.0 * u_density) / E_Pa)'
  : separationMethod === 'usdm'
  ? 'D_nm = (K * wavelength) / intercept / 10.0 if intercept > 0 else 0\nstress_MPa = slope / 1e6\nstrain = slope / E_Pa'
  : 'D_nm = (K * wavelength) / intercept / 10.0 if intercept > 0 else 0\nstrain = slope'}

print("==================================================")
print(f"Integral Breadth ${separationMethod.toUpperCase()} Regression")
print(f"R-squared: {r_squared:.5f}")
print(f"Unified Crystallite Size (D): {D_nm:.2f} nm")
print(f"Lattice Microstrain (epsilon): {strain * 1000:.3f} x 10^-3 ({strain * 100:.4f} %)")
print("==================================================")

# Plot
plt.figure(figsize=(7, 5), dpi=120)
plt.scatter(x, y, color='crimson', label='Reflections (IB)', zorder=3)
x_fit = np.linspace(np.min(x), np.max(x), 100)
plt.plot(x_fit, slope * x_fit + intercept, 'b--', label=f'Fit (R^2={r_squared:.4f})')
plt.title('Integral Breadth Advanced Analysis (${separationMethod.toUpperCase()})')
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend()
plt.tight_layout()
plt.show()
`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050A14] p-7 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
            <img src={voigtBg} alt="Voigt Configuration" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />
          </div>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-700 pointer-events-none" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500 blur-md opacity-20" />
                <div className="p-2.5 bg-[#070D18] rounded-xl border border-pink-500/30 relative">
                  <Settings2 className="w-5 h-5 text-pink-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-widest uppercase">IB Adv Config</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-black tracking-widest flex items-center gap-1.5">
                  <span>Size-strain deconvolution</span>
                  {excludedIndices.length > 0 && (
                    <span className="text-amber-400 font-mono font-bold lowercase">
                      ({excludedIndices.length} excluded)
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-pink-400 bg-white/5 hover:bg-pink-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-pink-500/30 transition-all flex items-center gap-1.5 mt-1 relative overflow-hidden group/btn"
              title="Reset all settings to default"
            >
              <RefreshCw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" /> Reset
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            {/* AI Smart Load Input */}
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all group/load relative overflow-hidden">
              <label className="block text-[10px] font-black text-pink-400/90 mb-2 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                AI Smart Load
              </label>
              <div className="flex gap-2 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className="text-slate-600 font-mono text-xs">&gt;_</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Ceria, Anatase TiO2, ZnO Nanorods"
                  className="flex-1 pl-8 pr-4 py-2.5 bg-[#0A101C] text-pink-300 border border-white/10 focus:border-pink-500/50 rounded-lg focus:ring-1 focus:ring-pink-500/20 outline-none text-xs transition-all placeholder:text-slate-700 font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-3 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 disabled:bg-slate-800/10 disabled:text-slate-700 text-pink-400 hover:text-pink-300 font-bold rounded-lg transition-all flex items-center justify-center min-w-[75px] gap-1.5 border border-pink-500/30 hover:border-pink-500/60 disabled:border-slate-800 text-xs"
                >
                  {isThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span className="font-mono uppercase tracking-widest font-black">Load</span>
                </button>
              </div>
            </div>

            {/* Diffraction Parameters Box */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-pink-500/30 transition-colors shadow-inner relative overflow-hidden group/params">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                Diffraction Parameters
              </h3>

              <div className="space-y-4">
                {/* Wavelength */}
                <div className="relative z-20">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Source Wavelength ({lengthUnit})
                    </label>
                    <span className="text-[9px] font-mono text-pink-400 font-bold">
                      {wavelength.toFixed(4)} Å
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={String(wavelength) === 'NaN' ? '' : convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(Number(e.target.value), lengthUnit))}
                      className="w-full px-4 py-2.5 bg-[#0A101C] text-pink-300 border border-white/10 focus:border-pink-500/50 rounded-lg focus:ring-1 focus:ring-pink-500/20 outline-none font-mono text-sm transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black text-slate-600">{lengthUnit}</div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                    {Object.entries(XRAY_WAVELENGTHS).slice(0, 4).map(([name, val]) => (
                      <button
                        key={name}
                        onClick={() => setWavelength(val)}
                        className={`py-1.5 px-0.5 rounded border text-[8px] font-black uppercase tracking-tight transition-all
                          ${Math.abs(wavelength - val) < 1e-4 
                            ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' 
                            : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'
                          }
                        `}
                      >
                        {name.replace(' Kα', '').replace(' (avg)', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape Factor K */}
                <div ref={kMenuRef} className="relative z-10">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Shape Factor (K)
                    </label>
                    <span className="text-[9px] font-mono text-pink-400 font-bold">K = {constantK.toFixed(3)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                      className="flex-1 px-4 py-2.5 bg-[#0A101C] text-pink-300 border border-white/10 hover:border-pink-500/40 rounded-lg outline-none transition-all flex items-center justify-between group shadow-inner"
                    >
                      <span className="text-[10px] font-mono font-black text-pink-400 truncate max-w-[130px]">
                        {selectedKType}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      value={String(constantK) === 'NaN' ? '' : constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value) || 1.0);
                        setSelectedKType('Custom');
                      }}
                      className="w-20 px-3 py-2.5 bg-[#0A101C] text-pink-400 border border-white/10 focus:border-pink-500/50 rounded-lg focus:ring-1 focus:ring-pink-500/20 outline-none font-mono text-xs font-black text-center transition-all"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {isKTypeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        className="absolute top-[110%] left-0 right-0 bg-[#070D18] border border-pink-500/30 rounded-xl shadow-[0_5px_30px_rgba(0,0,0,0.5)] overflow-hidden z-[100] py-1 max-h-[250px] overflow-y-auto custom-scrollbar"
                      >
                        {K_FACTORS.map((k) => (
                          <button
                            key={k.label}
                            onClick={() => {
                              if (k.value > 0) setConstantK(k.value);
                              setSelectedKType(k.label);
                              setIsKTypeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-pink-500/10 transition-colors ${selectedKType === k.label ? 'bg-pink-500/5' : ''}`}
                          >
                            <span className="text-sm bg-black/50 w-8 h-8 flex items-center justify-center rounded-lg border border-white/5">{k.icon}</span>
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${selectedKType === k.label ? 'text-pink-400' : 'text-slate-300'}`}>{k.label} {k.value !== 0 && `(${k.value})`}</span>
                              <span className="text-[8px] text-slate-500 font-mono font-bold leading-tight truncate max-w-[150px]">{k.desc}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Instrumental Resolution Mode */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Instrumental Broadening
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInstrumentalMode('constant')}
                      className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                        instrumentalMode === 'constant'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                          : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Constant β_inst
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstrumentalMode('caglioti')}
                      className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                        instrumentalMode === 'caglioti'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                          : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Caglioti Curve
                    </button>
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.005"
                          value={String(instBetaIB) === 'NaN' ? '' : instBetaIB}
                          onChange={(e) => setInstBetaIB(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 bg-[#0A101C] text-amber-300 border border-white/10 focus:border-amber-500/50 rounded-lg focus:ring-1 focus:ring-amber-500/20 outline-none font-mono text-xs transition-all"
                          placeholder="e.g. 0.05"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-600">deg 2θ</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0, 0.03, 0.05, 0.08].map(val => (
                          <button 
                            key={val}
                            type="button"
                            onClick={() => setInstBetaIB(val)}
                            className={`py-1 rounded border text-[8px] font-black transition-all ${Math.abs(instBetaIB - val) < 1e-4 ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'}`}
                          >
                            {val === 0 ? '0 (Raw)' : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-[#0A101C] p-3 rounded-xl border border-amber-500/15 shadow-inner">
                      <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono uppercase mb-1">
                        <span>FWHM² = U·tan²θ + V·tanθ + W</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCagliotiU(0.0048);
                            setCagliotiV(-0.0018);
                            setCagliotiW(0.0125);
                          }}
                          className="text-amber-400 hover:underline"
                        >
                          NIST Si 640
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">U</span>
                          <input
                            type="number"
                            step="0.001"
                            value={String(cagliotiU) === 'NaN' ? '' : cagliotiU}
                            onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 rounded text-center outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">V</span>
                          <input
                            type="number"
                            step="0.001"
                            value={String(cagliotiV) === 'NaN' ? '' : cagliotiV}
                            onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 rounded text-center outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">W</span>
                          <input
                            type="number"
                            step="0.001"
                            value={String(cagliotiW) === 'NaN' ? '' : cagliotiW}
                            onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 rounded text-center outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Size-Strain Deconvolution Box */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-pink-500/30 transition-colors shadow-inner relative space-y-4">
              <h3 className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                Deconvolution & Separation Model
              </h3>

              {/* Decoupling Mode */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  1. Peak Decoupling Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'linear', label: 'Linear (Cauchy)', desc: 'β_s = β_obs - β_inst' },
                    { id: 'squared', label: 'Squared (Gauss)', desc: 'β_s² = β_obs² - β_inst²' },
                    { id: 'hw_voigt', label: 'HW Voigt', desc: 'Parabolic Voigt' },
                    { id: 'none', label: 'Raw (None)', desc: 'No inst correction' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDecouplingMethod(d.id as any)}
                      className={`p-2 rounded-lg text-left transition-all border ${
                        decouplingMethod === d.id
                          ? 'bg-pink-500/20 border-pink-500/60 text-pink-300 shadow-inner'
                          : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                      title={d.desc}
                    >
                      <div className="text-[9px] font-black uppercase">{d.label}</div>
                      <div className="text-[8px] font-mono text-slate-500 truncate">{d.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Separation Model (All 6 Models) */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  2. Size-Strain Separation Model
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'udm', label: 'UDM', title: 'Uniform Deformation Model' },
                    { id: 'usdm', label: 'USDM', title: 'Uniform Stress Deformation Model' },
                    { id: 'udedm', label: 'UDEDM', title: 'Uniform Deformation Energy Density Model' },
                    { id: 'ssp', label: 'SSP', title: 'Size-Strain Plot (d-weighted)' },
                    { id: 'hw', label: 'H-W Voigt', title: 'Halder-Wagner Parabolic Voigt' },
                    { id: 'mwh', label: 'mWH', title: 'Modified W-H (Dislocation C_hkl)' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSeparationMethod(m.id as any)}
                      className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border text-center ${
                        separationMethod === m.id
                          ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/60 text-pink-300 shadow-inner'
                          : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                      title={m.title}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mechanical & Continuum Properties */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="bg-[#0A101C] rounded-lg border border-white/5 p-3 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Young's Modulus (E)</span>
                    <span className="text-xs font-mono font-black text-pink-400">{youngsModulusGPa} GPa</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="600"
                    step="1"
                    value={String(youngsModulusGPa) === 'NaN' ? '' : youngsModulusGPa}
                    onChange={(e) => setYoungsModulusGPa(parseInt(e.target.value) || 130)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[
                      { name: 'Al', val: 70 },
                      { name: 'Si', val: 130 },
                      { name: 'Fe', val: 211 },
                      { name: 'CeO2', val: 220 }
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setYoungsModulusGPa(preset.val)}
                        className={`flex-1 py-0.5 rounded border text-[8px] font-mono ${youngsModulusGPa === preset.val ? 'bg-pink-500/20 border-pink-500/50 text-pink-300' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-400'}`}
                      >
                        {preset.name} ({preset.val})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0A101C] rounded-lg border border-white/5 p-3 space-y-2 shadow-inner">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Material Density (ρ)</span>
                    <span className="text-xs font-mono font-black text-emerald-400">{materialDensityGcm3.toFixed(2)} g/cm³</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="15.0"
                    step="0.05"
                    value={String(materialDensityGcm3) === 'NaN' ? '' : materialDensityGcm3}
                    onChange={(e) => setMaterialDensityGcm3(parseFloat(e.target.value) || 2.33)}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="text-[8px] text-slate-500 font-mono">
                    Used for Specific Surface Area (SSA = 6000 / (ρ·D))
                  </div>
                </div>
              </div>
            </div>

            {/* Presets & Peak Data */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors shadow-inner relative">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Atom className="w-3.5 h-3.5 text-emerald-400" />
                  Presets & Peak Breadths
                </h3>
                <div className="flex gap-2">
                  {excludedIndices.length > 0 && (
                    <button 
                      onClick={resetExclusions}
                      className="text-[8px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-all"
                    >
                      Reset Excluded
                    </button>
                  )}
                  <button 
                    onClick={handleClear}
                    className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              </div>
              
              <div className={`relative mb-3 ${isMaterialMenuOpen ? 'z-50' : 'z-10'}`} ref={matMenuRef}>
                <button
                  onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                  className="w-full px-3 py-2.5 bg-[#0A101C] border border-white/10 hover:border-emerald-500/40 rounded-lg outline-none transition-all flex items-center justify-between shadow-inner"
                >
                  <span className="text-xs font-black text-emerald-300 truncate">
                    {selectedMaterial}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isMaterialMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMaterialMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-1.5 backdrop-blur-3xl"
                    >
                      <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {MATERIAL_PRESETS.map((m) => (
                          <button
                            key={m.label}
                            onClick={() => {
                              setSelectedMaterial(m.label);
                              setInputData(m.data);
                              if (m.youngsModulus) setYoungsModulusGPa(m.youngsModulus);
                              if (m.density) setMaterialDensityGcm3(m.density);
                              setExcludedIndices([]);
                              setAdvisorReport(null);
                              setIsMaterialMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 flex flex-col items-start hover:bg-white/5 transition-colors rounded-xl ${selectedMaterial === m.label ? 'bg-emerald-500/10' : ''}`}
                          >
                            <span className={`text-xs font-black ${selectedMaterial === m.label ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {m.label}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                              {m.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative font-mono text-xs">
                <textarea
                  value={inputData}
                  onChange={(e) => {
                    setInputData(e.target.value);
                    setSelectedMaterial('Custom Data');
                  }}
                  placeholder="28.44, 230, 1000, 1 1 1&#10;47.30, 280, 950, 2 2 0"
                  className="w-full h-32 px-4 py-3 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/50 rounded-lg focus:ring-1 focus:ring-emerald-500/20 outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700 shadow-inner"
                  spellCheck="false"
                />
                <div className="absolute top-2 right-2 text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black/80 px-2 py-0.5 rounded border border-white/10">
                  2θ, Area, Imax [, h k l]
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            {!isSimulationRunning ? (
              <button
                onClick={handleCalculateWithSimulation}
                disabled={parseIBAdvancedInput(inputData).length < 2}
                className={`w-full py-4 font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${
                  parseIBAdvancedInput(inputData).length >= 2
                     ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white shadow-[0_0_20px_rgba(244,114,182,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]' 
                     : 'bg-[#070D18] text-slate-600 cursor-not-allowed border border-white/5 shadow-inner'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Analyze Model
              </button>
            ) : (
              <div className="bg-[#070D18] p-5 rounded-2xl border border-pink-500/30 overflow-hidden relative shadow-[inset_0_0_20px_rgba(244,114,182,0.05)]">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-pink-400 animate-spin" /> Advanced Regression Processing
                </h4>
                <div className="space-y-2.5 relative z-10 w-full flex flex-col">
                  {[
                    { step: 1, label: 'Parsing Profile Breadths & HKL Planes', icon: Database },
                    { step: 2, label: 'Calibrating Instrumental Broadening Curve', icon: FlaskConical },
                    { step: 3, label: `Decoupling Broadening (${decouplingMethod.toUpperCase()})`, icon: Activity },
                    { step: 4, label: `Executing ${separationMethod.toUpperCase()} Regression`, icon: Layers },
                    { step: 5, label: 'Deriving Microstructural Elastic & Defect Tensors', icon: CheckCircle }
                  ].map((s) => {
                     const Icon = s.icon;
                     const isActive = simulationStep === s.step;
                     const isDone = simulationStep > s.step;
                     return (
                       <div key={s.step} className={`flex items-center gap-2.5 w-full transition-all ${isActive ? 'opacity-100' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                         <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isActive ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                           <Icon className="w-3 h-3" />
                         </div>
                         <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-pink-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                           {s.label}
                         </span>
                       </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Column */}
      <div className="lg:col-span-8 space-y-6">
        {result && (
          <ScientificMathControl
            title={`Size-Strain Separation (${separationMethod.toUpperCase()} Model)`}
            formula={getMethodFormula()}
            description={`${separationMethod === 'udm' ? 'Uniform Deformation Model (UDM)' : separationMethod === 'usdm' ? 'Uniform Stress Deformation Model (USDM)' : separationMethod === 'hw' ? 'Halder-Wagner (HW) Voigt parabolic deconvolution' : separationMethod === 'ssp' ? 'Size-Strain Plot (SSP) method' : separationMethod === 'mwh' ? 'Modified Williamson-Hall with dislocation contrast factors' : 'Uniform Deformation Energy Density Model (UDEDM)'} separating lattice microstrain and crystallite size contributions.`}
            variables={[
              { symbol: 'Slope', name: 'Regression Slope', value: result.regression.slope, unit: '' },
              { symbol: 'Intercept', name: 'Regression Intercept', value: result.regression.intercept, unit: '' },
              { symbol: 'R²', name: 'Coefficient of Determination', value: result.regression.rSquared, unit: '' },
              { symbol: 'Adj R²', name: 'Adjusted R-Squared', value: result.regression.adjustedRSquared || result.regression.rSquared, unit: '' },
              { symbol: 'E', name: 'Young\'s Modulus', value: youngsModulusGPa, unit: 'GPa' },
              { symbol: 'ρ', name: 'Material Density', value: materialDensityGcm3, unit: 'g/cm³' }
            ]}
            result={result.sizeInterceptNm}
            resultUnit="nm"
            resultName="Unified Crystallite Size (D)"
          />
        )}

        {/* 5-Card Multi-Metric Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Crystallite Size */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-4 rounded-2xl border border-emerald-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Box className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Unified Size (D)</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {result && result.sizeInterceptNm > 0 && result.sizeInterceptNm < 1000 ? result.sizeInterceptNm.toFixed(1) : '> 250'}
                </span>
                <span className="text-xs font-black text-emerald-400 uppercase">nm</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[8px] text-slate-500 uppercase tracking-wider font-mono">
              Model Intercept
            </div>
          </div>

          {/* Microstrain */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-4 rounded-2xl border border-cyan-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="p-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Microstrain (ε)</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {result ? (result.strainPercent / 100 * 1000).toFixed(2) : '-'}
                </span>
                <span className="text-[10px] font-bold text-cyan-400">×10⁻³</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[8px] text-slate-500 uppercase tracking-wider font-mono truncate">
              {result ? `${result.strainPercent.toFixed(3)}% strain` : '-'}
            </div>
          </div>

          {/* Stress & Energy */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-4 rounded-2xl border border-pink-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="p-1 rounded bg-pink-500/10 border border-pink-500/30 text-pink-400">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest">Lattice Stress (σ)</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {result && result.stressMPa !== undefined ? result.stressMPa.toFixed(1) : '-'}
                </span>
                <span className="text-[10px] font-bold text-pink-400">MPa</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[8px] text-slate-500 uppercase tracking-wider font-mono truncate">
              u = {result?.energyDensityKjM3?.toFixed(2) || '-'} kJ/m³
            </div>
          </div>

          {/* Dislocation Density & Specific Surface Area */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-4 rounded-2xl border border-amber-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="p-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Atom className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Dislocation (ρ_d)</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {result?.dislocationDensity10_14 !== undefined ? result.dislocationDensity10_14.toFixed(2) : '-'}
                </span>
                <span className="text-[9px] font-bold text-amber-400">×10¹⁴ m⁻²</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[8px] text-slate-500 uppercase tracking-wider font-mono truncate">
              SSA = {result?.specificSurfaceAreaM2g !== undefined ? `${result.specificSurfaceAreaM2g.toFixed(1)} m²/g` : '-'}
            </div>
          </div>

          {/* Fit Quality R² */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-4 rounded-2xl border border-purple-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="p-1 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Fit Quality (R²)</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {result ? result.regression.rSquared.toFixed(4) : '-'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[8px] text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Adj: {result?.regression.adjustedRSquared ? result.regression.adjustedRSquared.toFixed(3) : '-'}</span>
              <span>r={result?.regression.pearsonR ? result.regression.pearsonR.toFixed(3) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Visualizer Tabs Header */}
        <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col overflow-hidden">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-white/5 relative z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'fit', label: `${separationMethod.toUpperCase()} Regression`, icon: TrendingUp },
                { id: 'residuals', label: 'Residuals', icon: Activity },
                { id: 'apparentSizes', label: 'Peak Sizes', icon: BarChart2 },
                { id: 'elasticState', label: 'Tensors', icon: Cpu },
                { id: 'modelMatrix', label: 'Model Matrix', icon: GitCompare },
                { id: 'advisor', label: 'AI Advisor', icon: BookOpen }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeChartTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChartTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-inner'
                        : 'bg-[#070D18] text-slate-500 hover:text-slate-300 border border-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPublicationSummary}
                className="px-2.5 py-1.5 bg-[#070D18] hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                title="Copy Publication-ready summary"
              >
                {copiedSummaryNotification ? <Check className="w-3 h-3 text-emerald-400" /> : <FileSpreadsheet className="w-3 h-3" />}
                {copiedSummaryNotification ? 'Copied!' : 'Summary'}
              </button>
              <button
                onClick={handleDownloadCSV}
                className="px-2.5 py-1.5 bg-[#070D18] hover:bg-pink-500/10 text-slate-400 hover:text-pink-300 border border-white/5 hover:border-pink-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> CSV
              </button>
              <button
                onClick={handleCopyJSON}
                className="px-2.5 py-1.5 bg-[#070D18] hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> {copiedNotification ? 'Copied!' : 'JSON'}
              </button>
            </div>
          </div>

          {/* Tab 1: Regression Chart */}
          {activeChartTab === 'fit' && (
            <div className="flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-2 px-2 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-2">
                  <span>Model: <span className="text-pink-400 font-bold">{separationMethod.toUpperCase()}</span></span>
                  <span className="text-slate-600">|</span>
                  <span>Decoupling: <span className="text-amber-400 font-bold">{decouplingMethod.toUpperCase()}</span></span>
                </span>
                {result && (
                  <span className="text-cyan-300">
                    y = {result.regression.slope.toFixed(5)}x + {result.regression.intercept.toFixed(5)}
                  </span>
                )}
              </div>
              <div className="flex-1 w-full min-h-0 bg-[#070D18] rounded-2xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="x" 
                      type="number" 
                      domain={['auto', 'auto']}
                      label={{ 
                        value: separationMethod === 'hw' ? 'X = β/(tanθ·sinθ)' : separationMethod === 'ssp' ? 'X = d²·βcosθ' : separationMethod === 'udedm' ? 'X = 4sinθ·√(2/E)' : separationMethod === 'usdm' ? 'X = 4sinθ/E' : separationMethod === 'mwh' ? 'X = s·√C_hkl' : 'X = 4 sin(θ)', 
                        position: 'bottom', 
                        offset: 20, 
                        fill: '#94a3b8', 
                        fontSize: 10, 
                        fontWeight: 900, 
                        fontFamily: 'monospace' 
                      }}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                      tickFormatter={(val) => val.toExponential(1)}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      label={{ 
                        value: separationMethod === 'hw' ? 'Y = (β/tanθ)²' : separationMethod === 'ssp' ? 'Y = (d·βcosθ)²' : 'Y = β_sample cos(θ)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -10, 
                        fill: '#94a3b8', 
                        fontSize: 10, 
                        fontWeight: 900, 
                        fontFamily: 'monospace' 
                      }}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                      tickFormatter={(val) => val.toExponential(1)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }} />
                    <Area
                      type="monotone"
                      dataKey="fitRange"
                      stroke="none"
                      fill="#fb7185"
                      fillOpacity={0.1}
                      name="95% Confidence Band"
                    />
                    <Scatter 
                      name="Active Reflections" 
                      data={chartData.filter(d => !d.isExcluded)}
                      dataKey="y" 
                      fill="#f472b6" 
                      shape="circle"
                      r={5}
                      onClick={(e: any) => e && e.originalIndex !== undefined && toggleExcludePeak(e.originalIndex)}
                      cursor="pointer"
                    />
                    {chartData.some(d => d.isExcluded) && (
                      <Scatter 
                        name="Excluded Outliers" 
                        data={chartData.filter(d => d.isExcluded)}
                        dataKey="y" 
                        fill="#64748b" 
                        shape="cross"
                        r={6}
                        onClick={(e: any) => e && e.originalIndex !== undefined && toggleExcludePeak(e.originalIndex)}
                        cursor="pointer"
                      />
                    )}
                    <Line 
                      type="monotone" 
                      dataKey="fit" 
                      stroke="#fb7185" 
                      strokeWidth={2} 
                      dot={false} 
                      name="Fitted Regression Line"
                      activeDot={false}
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 2: Residuals */}
          {activeChartTab === 'residuals' && (
            <div className="flex flex-col h-[400px]">
              <div className="mb-2 text-[10px] font-mono text-slate-400">
                Fit Residuals (Observed Y - Fitted Y) across reflection angles 2θ (Validates strain isotropy and deconvolution model)
              </div>
              <div className="flex-1 w-full bg-[#070D18] rounded-2xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="twoTheta" 
                      type="number" 
                      domain={['auto', 'auto']}
                      label={{ value: 'Diffraction Angle 2θ (°)', position: 'bottom', offset: 20, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      label={{ value: 'Residual (ΔY)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                      tickFormatter={(val) => val.toExponential(1)}
                    />
                    <Tooltip />
                    <Line type="monotone" dataKey={() => 0} stroke="#64748b" strokeDasharray="3 3" name="Zero Error Baseline" dot={false} />
                    <Scatter name="Residuals" dataKey="residual" fill="#38bdf8" shape="circle" r={6} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 3: Reflection Apparent Sizes */}
          {activeChartTab === 'apparentSizes' && (
            <div className="flex flex-col h-[400px]">
              <div className="mb-2 text-[10px] font-mono text-slate-400">
                Local Apparent Crystallite Size D_hkl for each reflection compared against Global Separated Size D
              </div>
              <div className="flex-1 w-full bg-[#070D18] rounded-2xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="twoTheta" 
                      tickFormatter={(val) => `${val.toFixed(1)}°`}
                      label={{ value: 'Reflection 2θ (°)', position: 'bottom', offset: 20, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      label={{ value: 'Apparent Size (nm)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    />
                    <Tooltip />
                    <Bar dataKey="singleSize" name="Apparent Size (nm)" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, index) => (
                        <Cell key={`cell-${index}`} fill={d.isExcluded ? '#475569' : index % 2 === 0 ? '#10b981' : '#34d399'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 4: Tensors */}
          {activeChartTab === 'elasticState' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] overflow-y-auto custom-scrollbar">
              <div className="bg-[#070D18] p-5 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> Continuum Elastic & Defect Tensors
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Young's Modulus (E):</span>
                    <span className="text-white font-bold">{youngsModulusGPa} GPa</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Microstrain (ε):</span>
                    <span className="text-cyan-300 font-bold">{result ? (result.strainPercent / 100).toExponential(3) : '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Lattice Stress (σ = ε·E):</span>
                    <span className="text-pink-300 font-bold">{result?.stressMPa?.toFixed(2) || '-'} MPa</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Strain Energy Density (u = ½·ε²·E):</span>
                    <span className="text-amber-300 font-bold">{result?.energyDensityKjM3?.toFixed(3) || '-'} kJ/m³</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Dislocation Line Density (ρ_d):</span>
                    <span className="text-amber-300 font-bold">{result?.dislocationDensity10_14?.toFixed(3) || '-'} × 10¹⁴ m⁻²</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Specific Surface Area (SSA):</span>
                    <span className="text-emerald-300 font-bold">{result?.specificSurfaceAreaM2g?.toFixed(2) || '-'} m²/g</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#070D18] p-5 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> Regression Statistical Metrics
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Coefficient of Determination (R²):</span>
                    <span className="text-purple-300 font-bold">{result?.regression.rSquared.toFixed(5) || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Adjusted R²:</span>
                    <span className="text-purple-300 font-bold">{result?.regression.adjustedRSquared?.toFixed(5) || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Pearson Correlation (r):</span>
                    <span className="text-emerald-300 font-bold">{result?.regression.pearsonR?.toFixed(5) || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Root Mean Square Error (RMSE):</span>
                    <span className="text-cyan-300 font-bold">{result?.regression.rmse?.toExponential(3) || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Durbin-Watson Statistic:</span>
                    <span className="text-cyan-300 font-bold">{result?.regression.durbinWatson?.toFixed(3) || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Slope Std Error:</span>
                    <span className="text-slate-300 font-bold">{result?.regression.stdErrorSlope?.toExponential(3) || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Intercept Std Error:</span>
                    <span className="text-slate-300 font-bold">{result?.regression.stdErrorIntercept?.toExponential(3) || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Model Matrix */}
          {activeChartTab === 'modelMatrix' && (
            <div className="flex flex-col h-[400px] overflow-y-auto custom-scrollbar">
              <div className="mb-3 text-[10px] font-mono text-slate-400 flex justify-between items-center">
                <span>Multi-Model Comparative Matrix across all 6 Size-Strain separation formalisms</span>
                <span className="text-emerald-400 font-bold text-[9px]">★ HIGHEST R² IDENTIFIES BEST-FIT PHYSICAL MODEL</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#070D18]">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-[9px] text-slate-400 font-sans uppercase tracking-widest font-black">
                      <th className="px-3 py-3">Model</th>
                      <th className="px-3 py-3 text-emerald-400">Size D (nm)</th>
                      <th className="px-3 py-3 text-cyan-400">Strain (×10⁻³)</th>
                      <th className="px-3 py-3 text-pink-400">Stress (MPa)</th>
                      <th className="px-3 py-3 text-purple-400">R²</th>
                      <th className="px-3 py-3">RMSE</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {(result?.modelComparisons || []).map((m) => {
                      const isCurrent = separationMethod.toUpperCase() === m.modelName.toUpperCase() || 
                        (separationMethod === 'hw' && m.modelName === 'Halder-Wagner');
                      return (
                        <tr key={m.modelName} className={`hover:bg-white/5 transition-colors ${isCurrent ? 'bg-pink-500/10' : ''}`}>
                          <td className="px-3 py-3 font-bold flex items-center gap-2">
                            <span className={isCurrent ? 'text-pink-400' : 'text-white'}>{m.label}</span>
                            {m.isBestFit && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                                BEST FIT
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 font-bold text-emerald-300">
                            {m.sizeNm > 0 && m.sizeNm < 1000 ? `${m.sizeNm.toFixed(1)} nm` : '> 250 nm'}
                          </td>
                          <td className="px-3 py-3 font-bold text-cyan-300">
                            {(m.strainPercent / 100 * 1000).toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-pink-300">
                            {m.stressMPa !== undefined ? m.stressMPa.toFixed(1) : '-'}
                          </td>
                          <td className="px-3 py-3 font-bold text-purple-300">
                            {m.rSquared.toFixed(4)}
                          </td>
                          <td className="px-3 py-3 text-slate-400 font-mono text-[10px]">
                            {m.rmse.toExponential(2)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => {
                                const methodKey = m.modelName === 'Halder-Wagner' ? 'hw' : m.modelName.toLowerCase();
                                setSeparationMethod(methodKey as any);
                                setActiveChartTab('fit');
                              }}
                              disabled={isCurrent}
                              className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all border ${
                                isCurrent 
                                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 cursor-default'
                                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                              }`}
                            >
                              {isCurrent ? 'Active' : 'Apply'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 6: AI Crystallographic Line-Profile Advisor */}
          {activeChartTab === 'advisor' && (
            <div className="flex flex-col h-[400px] overflow-y-auto custom-scrollbar bg-[#070D18] p-5 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    AI Crystallographic Line-Profile Advisor
                  </span>
                </div>
                <button
                  onClick={handleGenerateAdvisorReport}
                  disabled={isAdvisorLoading || !result}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  {isAdvisorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {advisorReport ? 'Regenerate Analysis' : 'Generate Comprehensive Report'}
                </button>
              </div>

              {isAdvisorLoading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">
                    Synthesizing crystallite size, lattice microstrain anisotropy, and dislocation physics...
                  </p>
                </div>
              )}

              {advisorError && !isAdvisorLoading && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                  {advisorError}
                </div>
              )}

              {advisorReport && !isAdvisorLoading && (
                <div className="text-slate-300 text-xs leading-relaxed space-y-3 font-sans prose prose-invert max-w-none">
                  <Markdown>{advisorReport}</Markdown>
                </div>
              )}

              {!advisorReport && !isAdvisorLoading && !advisorError && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <BookOpen className="w-10 h-10 mb-3 text-slate-600" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Crystallographic Advisor Idle
                  </p>
                  <p className="text-[11px] max-w-md font-mono">
                    Click "Generate Comprehensive Report" to receive deep domain insights on microstrain anisotropy, dislocation density, and Voigt profile deconvolution for {selectedMaterial}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Python Code Exporter Module */}
        <PythonCodeExporter
          methodName={`Integral Breadth (${separationMethod.toUpperCase()} Model)`}
          parameters={{
            wavelength,
            shapeFactor: constantK,
            fwhmInst: instBetaIB,
            youngsModulus: youngsModulusGPa,
            materialDensity: materialDensityGcm3,
            separationMethod,
            decouplingMethod
          }}
          customScript={generateCustomPythonScript()}
        />

        {/* Peak Deconstruction Table */}
        {result && result.pointsExtended && result.pointsExtended.length > 0 && (
          <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6 relative z-10 px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Peak Deconstruction & Calculated Sizes</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-mono">
                    {decouplingMethod.toUpperCase()} deconvolution &bull; {separationMethod.toUpperCase()} coordinate transformation
                  </p>
                </div>
              </div>

              {excludedIndices.length > 0 && (
                <span className="text-[9px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                  {excludedIndices.length} outlier(s) excluded from regression
                </span>
              )}
            </div>

            <div className="relative z-10 overflow-x-auto rounded-xl border border-white/5 bg-[#070D18]/60 shadow-inner">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[9px] text-slate-400 font-sans uppercase tracking-widest font-black">
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-emerald-400">Reflection (2θ)</th>
                    <th className="px-3 py-3 text-cyan-400">HKL</th>
                    <th className="px-3 py-3">d (Å)</th>
                    <th className="px-3 py-3">β_Obs (°)</th>
                    <th className="px-3 py-3">β_Inst (°)</th>
                    <th className="px-3 py-3">β_Sample (°)</th>
                    <th className="px-4 py-3 font-sans font-black text-pink-400">Single D (nm)</th>
                    <th className="px-3 py-3 text-amber-400">ρ_d (×10¹⁴)</th>
                    <th className="px-3 py-3 text-right">Residual (ΔY)</th>
                    <th className="px-3 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {result.pointsExtended.map((p, idx) => {
                    const isEx = p.isExcluded || excludedIndices.includes(idx);
                    return (
                      <tr 
                        key={idx} 
                        className={`hover:bg-white/5 transition-colors group/row ${isEx ? 'opacity-40 line-through bg-red-950/10' : ''}`}
                      >
                        <td className="px-3 py-3 text-center">
                          {isEx ? (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase font-black font-sans">
                              Excl
                            </span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-black font-sans">
                              Fit
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">
                          {p.twoTheta.toFixed(3)}°
                        </td>
                        <td className="px-3 py-3 font-bold text-cyan-300">
                          {p.hkl ? `(${p.hkl.join(' ')})` : '-'}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {p.dSpacing ? p.dSpacing.toFixed(3) : '-'}
                        </td>
                        <td className="px-3 py-3 text-slate-400">
                          {p.betaObsDeg.toFixed(4)}°
                        </td>
                        <td className="px-3 py-3 text-slate-500">
                          {p.betaInstDeg.toFixed(4)}°
                        </td>
                        <td className="px-3 py-3 text-slate-300 font-bold">
                          {p.betaSampleDeg > 0 ? `${p.betaSampleDeg.toFixed(4)}°` : '0.0000°'}
                        </td>
                        <td className="px-4 py-3 font-bold text-pink-400">
                          {p.singlePeakSizeNm > 0 && p.singlePeakSizeNm < 1000 ? (
                            `${p.singlePeakSizeNm.toFixed(2)} nm`
                          ) : (
                            <span className="text-amber-400 text-[10px] uppercase font-black">&gt; 250 nm (∞)</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-amber-300 font-mono">
                          {p.dislocationDensity10_14 !== undefined ? p.dislocationDensity10_14.toFixed(2) : '-'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[10px] text-slate-400">
                          {p.residual !== undefined ? (
                            <span className={p.residual > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                              {p.residual > 0 ? '+' : ''}{p.residual.toExponential(2)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExcludePeak(idx)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isEx
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                            }`}
                            title={isEx ? 'Include reflection in fit' : 'Exclude reflection as outlier'}
                          >
                            {isEx ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
