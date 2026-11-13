import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { parseScherrerInput, calculateWilliamsonHall, XRAY_WAVELENGTHS } from '../utils/physics';
import { WHResult, WHPoint, WHModelComparisonItem } from '../types';
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
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  Ruler, 
  Check, 
  Atom, 
  Binary, 
  Download, 
  RefreshCw, 
  Trash2, 
  Loader2, 
  Activity, 
  Layers, 
  Zap, 
  Settings, 
  BarChart2, 
  Sliders, 
  Sparkles, 
  Copy, 
  Eye, 
  EyeOff,
  Info,
  BookOpen,
  BrainCircuit,
  FileText,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { ScientificMathControl } from './ScientificMathControl';
import { PythonCodeExporter } from './PythonCodeExporter';
import { WHPeakDataManager } from './williamson_hall/WHPeakDataManager';
import { WHCadSchematic } from './williamson_hall/WHCadSchematic';
import { NanoCrystalliteSimulatorView } from './scherrer/NanoCrystalliteSimulatorView';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const WH_PRESETS = [
  { 
    name: 'Silicon NIST SRM 640', 
    data: "28.44, 0.12, 1, 1, 1\n47.30, 0.15, 2, 2, 0\n56.12, 0.18, 3, 1, 1\n69.13, 0.22, 4, 0, 0\n76.38, 0.25, 3, 3, 1\n88.03, 0.28, 4, 2, 2", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Nearly strain-free reference standard',
    icon: 'Si',
    youngsModulus: 130,
    density: 2.33,
    material: 'Silicon (Si)'
  },
  { 
    name: 'Nanocrystalline ZnO Wurtzite', 
    data: "31.77, 0.38, 1, 0, 0\n34.42, 0.41, 0, 0, 2\n36.25, 0.44, 1, 0, 1\n47.54, 0.52, 1, 0, 2\n56.60, 0.60, 1, 1, 0\n62.86, 0.68, 1, 0, 3\n67.96, 0.74, 1, 1, 2", 
    wavelength: 1.5406, 
    k: 0.94, 
    desc: 'Semiconductor nanoparticles with shape & microstrain',
    icon: 'ZnO',
    youngsModulus: 140,
    density: 5.61,
    material: 'Zinc Oxide (ZnO)'
  },
  { 
    name: 'Cold-Worked 316L Stainless Steel', 
    data: "43.60, 0.48, 1, 1, 1\n50.79, 0.65, 2, 0, 0\n74.69, 0.88, 2, 2, 0\n90.69, 1.12, 3, 1, 1\n95.96, 1.25, 2, 2, 2", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Austenitic fcc alloy with high dislocation density',
    icon: '316L',
    youngsModulus: 193,
    density: 7.98,
    material: 'Iron / Ferritic Steel (Fe)'
  },
  { 
    name: 'Anatase TiO2 Nanoparticles', 
    data: "25.28, 0.45, 1, 0, 1\n37.80, 0.52, 0, 0, 4\n48.05, 0.62, 2, 0, 0\n53.89, 0.68, 1, 0, 5\n55.06, 0.70, 2, 1, 1\n62.69, 0.81, 2, 0, 4", 
    wavelength: 1.5406, 
    k: 0.94, 
    desc: 'Tetragonal photocatalyst with anisotropic domains',
    icon: 'TiO₂',
    youngsModulus: 230,
    density: 3.89,
    material: 'Alumina (Al2O3)'
  },
  { 
    name: 'Strained Cu Thin Film', 
    data: "43.30, 0.45, 1, 1, 1\n50.43, 0.58, 2, 0, 0\n74.13, 0.76, 2, 2, 0\n89.93, 0.98, 3, 1, 1", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Epitaxially strained metallic fcc thin film',
    icon: 'Cu',
    youngsModulus: 120,
    density: 8.96,
    material: 'Copper (Cu)'
  },
  { 
    name: 'Perovskite MAPbI3 Film', 
    data: "14.08, 0.22, 1, 1, 0\n19.98, 0.26, 1, 1, 2\n24.47, 0.31, 2, 2, 0\n28.41, 0.35, 2, 2, 2\n31.85, 0.39, 3, 1, 2\n40.64, 0.48, 2, 2, 4", 
    wavelength: 1.5406, 
    k: 0.943, 
    desc: 'Organometallic halide photovoltaic absorber layer',
    icon: 'MAPbI₃',
    youngsModulus: 15,
    density: 4.16,
    material: 'Quartz (SiO2)'
  }
];

const MODULUS_PRESETS = [
  { name: 'Silicon (Si)', value: 130, desc: 'Cubic semiconductor crystal, [100] direction dynamic average' },
  { name: 'Alumina (Al2O3)', value: 380, desc: 'Corundum sintered refractory ceramic' },
  { name: 'Copper (Cu)', value: 120, desc: 'High-ductility fcc coin metal' },
  { name: 'Iron / Ferritic Steel (Fe)', value: 200, desc: 'Mechanical baseline structural alloy' },
  { name: 'Quartz (SiO2)', value: 70, desc: 'Trigonal silica polymorph crystal' },
  { name: 'PMMA Polymeric Glass', value: 3.2, desc: 'Amorphous thermo-plastic polymer network' }
];

export const WilliamsonHallModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [isDecouplingEnabled, setIsDecouplingEnabled] = useState<boolean>(true);
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [youngsModulusGPa, setYoungsModulusGPa] = useState<number>(130);
  const [isModulusEnabled, setIsModulusEnabled] = useState<boolean>(false);
  const [burgersVectorNm, setBurgersVectorNm] = useState<number>(0.25);
  const [isDensityEnabled, setIsDensityEnabled] = useState<boolean>(true);
  const [materialDensityGcm3, setMaterialDensityGcm3] = useState<number>(2.33);
  const [dislocationQParam, setDislocationQParam] = useState<number>(2.0);
  const [ch00Param, setCh00Param] = useState<number>(0.285);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);
  const [showDensityExplanation, setShowDensityExplanation] = useState<boolean>(false);
  const [showDecouplingExplanation, setShowDecouplingExplanation] = useState<boolean>(false);
  const [showMathModal, setShowMathModal] = useState<boolean>(false);
  
  // Excluded peak indices for outlier filtration
  const [excludedIndices, setExcludedIndices] = useState<number[]>([]);

  // Input Data: 2Theta, FWHM, h, k, l
  const [inputData, setInputData] = useState<string>("28.44, 0.25, 4, 0, 0\n47.30, 0.28, 2, 2, 0\n56.12, 0.32, 2, 2, 2\n69.13, 0.38, 4, 4, 0\n76.38, 0.42, 6, 2, 0");
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt'>('Gaussian');
  const [strainModel, setStrainModel] = useState<'UDM' | 'USDM' | 'UDEDM' | 'SSP' | 'Halder-Wagner' | 'mWH' | 'Stephens' | 'Monshi-Scherrer'>('UDM');
  
  // Diagnostic Visualizer Tab & Plot HUD Toggles
  const [activeTab, setActiveTab] = useState<'fit' | 'pattern' | 'residuals' | 'apparentSizes' | 'dislocationTensor' | 'comparison' | 'nanoSim' | 'advisor'>('fit');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showZeroStrainLine, setShowZeroStrainLine] = useState<boolean>(true);
  const [schematicMode, setSchematicMode] = useState<'decoupling' | 'scaling' | 'lattice'>('decoupling');

  const [result, setResult] = useState<WHResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_wh_current');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const isFirstRender = useRef(true);

  // AI Smart Assistant & Advisor Report
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);
  const [advisorReport, setAdvisorReport] = useState<string | null>(null);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const handleReset = () => {
    setWavelength(1.5406);
    setConstantK(0.9);
    setInstFwhm(0.1);
    setInstrumentalMode('constant');
    setCagliotiU(0.005);
    setCagliotiV(-0.002);
    setCagliotiW(0.015);
    setYoungsModulusGPa(130);
    setIsModulusEnabled(false);
    setBurgersVectorNm(0.25);
    setMaterialDensityGcm3(2.33);
    setDislocationQParam(2.0);
    setCh00Param(0.285);
    setExcludedIndices([]);
    setInputData("28.44, 0.25, 4, 0, 0\n47.30, 0.28, 2, 2, 0\n56.12, 0.32, 2, 2, 2\n69.13, 0.38, 4, 4, 0\n76.38, 0.42, 6, 2, 0");
    setStrainModel('UDM');
    setBroadeningModel('Gaussian');
    setAdvisorReport(null);
  };

  const handleSelectStrainModel = (newModel: typeof strainModel) => {
    setStrainModel(newModel);
    if (newModel === 'USDM' || newModel === 'UDEDM') {
      setIsModulusEnabled(true);
    }
  };

  const handleImportFromScherrer = () => {
    try {
      const rawTransfer = localStorage.getItem('xrd_wh_transfer_payload') || localStorage.getItem('xrd_scherrer_current');
      if (!rawTransfer) {
        setTransferNotice('No active Scherrer Studio dataset found in session.');
        setTimeout(() => setTransferNotice(null), 3500);
        return;
      }
      const parsed = JSON.parse(rawTransfer);
      if (parsed.inputData) {
        setInputData(parsed.inputData);
      } else if (Array.isArray(parsed.results) && parsed.results.length > 0) {
        const lines = parsed.results.map((r: any) => {
          const hklPart = r.hkl && r.hkl.length === 3 ? `, ${r.hkl[0]}, ${r.hkl[1]}, ${r.hkl[2]}` : '';
          return `${Number(r.twoTheta).toFixed(3)}, ${Number(r.fwhmObs).toFixed(3)}${hklPart}`;
        }).join('\n');
        setInputData(lines);
      }
      if (parsed.wavelength) setWavelength(parsed.wavelength);
      if (parsed.constantK) setConstantK(parsed.constantK);
      if (typeof parsed.instFwhm === 'number') setInstFwhm(parsed.instFwhm);
      if (parsed.useCaglioti !== undefined) {
        setInstrumentalMode(parsed.useCaglioti ? 'caglioti' : 'constant');
      }
      if (parsed.caglioti) {
        setCagliotiU(parsed.caglioti.u ?? 0.005);
        setCagliotiV(parsed.caglioti.v ?? -0.002);
        setCagliotiW(parsed.caglioti.w ?? 0.015);
      }
      if (parsed.materialDensity) setMaterialDensityGcm3(parsed.materialDensity);
      if (parsed.burgersVectorNm) setBurgersVectorNm(parsed.burgersVectorNm);
      setExcludedIndices([]);
      setTransferNotice(`Imported ${parsed.selectedMaterial || 'Scherrer dataset'} (λ = ${parsed.wavelength || wavelength} Å)`);
      setTimeout(() => setTransferNotice(null), 4000);
    } catch (e) {
      setTransferNotice('Could not parse Scherrer dataset.');
      setTimeout(() => setTransferNotice(null), 3500);
    }
  };

  const handleClear = () => {
    setInputData("");
    setExcludedIndices([]);
    setAdvisorReport(null);
  };

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // Calculation trigger
  const executeCalculation = (currentExcluded: number[] = excludedIndices) => {
    const peaks = parseScherrerInput(inputData);
    const currentPreset = MODULUS_PRESETS.find(p => p.value === youngsModulusGPa);
    const computed = calculateWilliamsonHall(
      wavelength, 
      constantK, 
      isDecouplingEnabled ? instFwhm : 0, 
      peaks, 
      broadeningModel,
      isDecouplingEnabled ? instrumentalMode : 'constant',
      { U: cagliotiU, V: cagliotiV, W: cagliotiW },
      isModulusEnabled || strainModel === 'USDM' || strainModel === 'UDEDM' ? youngsModulusGPa : undefined,
      strainModel,
      currentPreset?.name,
      currentExcluded,
      burgersVectorNm,
      isDensityEnabled ? materialDensityGcm3 : undefined,
      dislocationQParam,
      ch00Param
    );
    setResult(computed);
    if (computed) {
      localStorage.setItem('xrd_wh_current', JSON.stringify(computed));
    }
  };

  const handleCalculateWithSimulation = () => {
    executeCalculation();
  };

  // Memoized KaTeX formula HTML for zero-jitter rendering
  const renderedModelFormulaHtml = useMemo(() => {
    const tex =
      strainModel === 'UDM'
        ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\varepsilon \\sin(\\theta)'
        : strainModel === 'USDM'
        ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + \\frac{4\\sigma \\sin(\\theta)}{E_{hkl}}'
        : strainModel === 'UDEDM'
        ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\sin(\\theta) \\sqrt{\\frac{2u}{E_{hkl}}}'
        : strainModel === 'SSP'
        ? '(d \\cdot \\beta^*)^2 = \\frac{K}{D}(d^2 \\beta^*) + (2\\varepsilon)^2'
        : strainModel === 'Halder-Wagner'
        ? '\\left(\\frac{\\beta^*}{d^*}\\right)^2 = \\frac{K}{D} \\frac{\\beta^*}{(d^*)^2} + (2\\varepsilon)^2'
        : strainModel === 'mWH'
        ? '\\Delta K = \\frac{K}{D} + \\alpha \\left(K \\bar{C}_{hkl}^{1/2}\\right)'
        : strainModel === 'Stephens'
        ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\varepsilon \\sin(\\theta)\\sqrt{1 + 2.5 H^2}'
        : '\\ln(\\beta) = \\ln\\left(\\frac{K\\lambda}{D}\\right) + \\ln\\left(\\frac{1}{\\cos\\theta}\\right)';
    return katex.renderToString(tex, { throwOnError: false });
  }, [strainModel]);

  const bestFitModelItem = useMemo(() => {
    if (!result?.modelComparisons || result.modelComparisons.length === 0) return null;
    return result.modelComparisons.find(m => m.isBestFit) || result.modelComparisons[0];
  }, [result]);

  const meanApparentScherrerNm = useMemo(() => {
    const pts = (result?.pointsExtended || []).filter(p => !p.isExcluded && p.singlePeakSizeNm > 0 && p.singlePeakSizeNm < 1000);
    if (pts.length === 0) return 0;
    return pts.reduce((acc, p) => acc + p.singlePeakSizeNm, 0) / pts.length;
  }, [result]);

  // Instant recalculation on parameter changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!result) {
        executeCalculation();
      }
      return;
    }
    executeCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wavelength, 
    constantK, 
    instFwhm, 
    inputData, 
    broadeningModel, 
    instrumentalMode, 
    isDecouplingEnabled,
    cagliotiU, 
    cagliotiV, 
    cagliotiW, 
    youngsModulusGPa, 
    isModulusEnabled, 
    strainModel,
    excludedIndices,
    burgersVectorNm,
    isDensityEnabled,
    materialDensityGcm3,
    dislocationQParam,
    ch00Param
  ]);

  // Outlier toggle per peak
  const toggleExcludePeak = (index: number) => {
    setExcludedIndices(prev => {
      const next = prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index];
      return next;
    });
  };

  const handleAutoPruneOutliers = () => {
    if (!result || !result.pointsExtended) return;
    const toExclude: number[] = [];
    result.pointsExtended.forEach((p, idx) => {
      if (p.studentizedResidual !== undefined && Math.abs(p.studentizedResidual) > 1.8) {
        toExclude.push(idx);
      }
    });
    if (toExclude.length > 0 && result.pointsExtended.length - toExclude.length >= 2) {
      setExcludedIndices(toExclude);
    }
  };

  // Server-Side AI Smart Generation / Synthetic Data Retrieval
  const handleAiSmartGenerate = async (promptOverride?: string) => {
    const textToRun = promptOverride || aiPrompt;
    if (!textToRun.trim()) return;

    setIsAiLoading(true);
    setAiSuccessMessage('');
    try {
      const res = await fetch('/api/gemini/generate-wh-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToRun, wavelength })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const parsed = json.data;
        if (parsed.peaks && parsed.peaks.length > 0) {
          const lines = parsed.peaks.map((p: any) => `${p.twoTheta.toFixed(3)}, ${p.fwhm.toFixed(4)}, ${p.h}, ${p.k}, ${p.l}`).join('\n');
          setInputData(lines);
          if (parsed.wavelength) setWavelength(parsed.wavelength);
          if (parsed.youngsModulusGPa) {
            setYoungsModulusGPa(parsed.youngsModulusGPa);
            setIsModulusEnabled(true);
          }
          if (parsed.densityGcm3) setMaterialDensityGcm3(parsed.densityGcm3);
          if (parsed.strainModel) setStrainModel(parsed.strainModel);
          setExcludedIndices([]);
          setAiSuccessMessage(`Loaded ${parsed.materialName || 'dataset'}: ${parsed.rationale || 'Data successfully structured.'}`);
          setAdvisorReport(null);
        }
      } else {
        setAiSuccessMessage(json.error || 'Failed to generate peak parameters.');
      }
    } catch (err: any) {
      setAiSuccessMessage('Error invoking AI Assistant: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Server-Side AI Crystallographic Line-Profile Advisor
  const handleGenerateAdvisorReport = async () => {
    if (!result) return;
    setIsAdvisorLoading(true);
    setAdvisorError(null);
    setActiveTab('advisor');

    try {
      const payload = {
        modelApplied: strainModel,
        broadeningCorrection: broadeningModel,
        radiationWavelengthA: wavelength,
        shapeFactorK: constantK,
        crystalliteSizeNm: result.sizeInterceptNm,
        latticeMicrostrainPercent: result.strainPercent,
        internalStressMPa: result.stressMPa,
        strainEnergyDensityKjM3: result.energyDensityKjM3,
        dislocationDensity10_14_m2: result.dislocationDensity10_14,
        specificSurfaceAreaM2g: result.specificSurfaceAreaM2g,
        regression: result.regression,
        modelComparisons: result.modelComparisons,
        peaks: result.pointsExtended
      };

      const res = await fetch('/api/gemini/williamson-hall-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });

      const json = await res.json();
      if (json.success && json.text) {
        setAdvisorReport(json.text);
      } else {
        setAdvisorError(json.error || 'Failed to generate advisory report.');
      }
    } catch (err: any) {
      setAdvisorError(err.message || 'Network error communicating with AI Advisor.');
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  // Comprehensive CSV Download
  const handleDownloadCSV = () => {
    if (!result || !result.pointsExtended) return;
    const header = "Peak_Index,2Theta_deg,FWHM_obs_deg,FWHM_inst_deg,Beta_sample_deg,d_spacing_A,q_vector_A_inv,h,k,l,X_coord,Y_coord,Y_fit,Residual,Apparent_Size_nm,Dislocation_Density_10_14_m2,Status\n";
    const rows = result.pointsExtended.map((p, idx) => {
      const yFit = result.regression.slope * p.x + result.regression.intercept;
      const res = p.isExcluded ? 'EXCLUDED' : (p.residual !== undefined ? p.residual.toFixed(6) : (p.y - yFit).toFixed(6));
      const h = p.hkl ? p.hkl[0] : '';
      const k = p.hkl ? p.hkl[1] : '';
      const l = p.hkl ? p.hkl[2] : '';
      return `${idx + 1},${p.twoTheta.toFixed(4)},${p.fwhmObs.toFixed(4)},${p.fwhmInst.toFixed(4)},${p.betaCorrectedDeg.toFixed(4)},${p.dSpacing?.toFixed(4) || ''},${p.qVector?.toFixed(4) || ''},${h},${k},${l},${p.x.toFixed(6)},${p.y.toFixed(6)},${yFit.toFixed(6)},${res},${p.singlePeakSizeNm.toFixed(3)},${p.dislocationDensity10_14?.toFixed(4) || ''},${p.isExcluded ? 'Excluded' : 'Active'}`;
    }).join("\n");
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `williamson_hall_${strainModel}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Publication Summary Report
  const handleCopyReport = () => {
    if (!result) return;
    const report = `=====================================================
WILLIAMSON-HALL SIZE-STRAIN XRD ANALYSIS REPORT
=====================================================
Method / Model: ${strainModel} (${result.broadeningModelUsed || broadeningModel} deconvolution)
Radiation Wavelength: ${wavelength} Å (K = ${constantK})
Instrumental IRF: ${instrumentalMode === 'constant' ? `Constant (${instFwhm}°)` : `Caglioti (U=${cagliotiU}, V=${cagliotiV}, W=${cagliotiW})`}

DECOUPLED STRUCTURAL RESULTS:
- Volume-Weighted Crystallite Size (D): ${result.sizeInterceptNm > 0 ? `${result.sizeInterceptNm.toFixed(2)} nm` : 'Infinite / Bulk limit'}
- Lattice Microstrain (ε): ${(result.strainPercent / 100).toExponential(4)} (${result.strainPercent.toFixed(4)}%)
${result.stressMPa !== undefined ? `- Internal Lattice Stress (σ): ${result.stressMPa.toFixed(2)} MPa\n` : ''}${result.energyDensityKjM3 !== undefined ? `- Deformation Energy Density (u): ${result.energyDensityKjM3.toFixed(2)} kJ/m³\n` : ''}- Dislocation Density (ρ): ${result.dislocationDensity10_14 ? `${result.dislocationDensity10_14.toFixed(3)} × 10¹⁴ m⁻²` : 'N/A'}
- Specific Surface Area (SSA): ${result.specificSurfaceAreaM2g ? `${result.specificSurfaceAreaM2g.toFixed(2)} m²/g` : 'N/A'}

REGRESSION STATISTICS:
- Equation: Y = (${result.regression.slope.toFixed(6)}) · X + (${result.regression.intercept.toFixed(6)})
- Coefficient of Determination (R²): ${result.regression.rSquared.toFixed(5)}
- Adjusted R²: ${result.regression.adjustedRSquared ? result.regression.adjustedRSquared.toFixed(5) : 'N/A'}
- Pearson Correlation (r): ${result.regression.pearsonR ? result.regression.pearsonR.toFixed(5) : 'N/A'}
- Durbin-Watson Autocorrelation: ${result.regression.durbinWatson ? result.regression.durbinWatson.toFixed(3) : 'N/A'}
- Root Mean Square Error (RMSE): ${result.regression.rmse ? result.regression.rmse.toExponential(4) : 'N/A'}

PEAKS ANALYZED (${result.points.length} Active, ${excludedIndices.length} Excluded):
${result.pointsExtended?.map((p, i) => `  [${i + 1}] 2θ = ${p.twoTheta.toFixed(3)}° | FWHM = ${p.fwhmObs.toFixed(3)}° | hkl = (${p.hkl?.join('') || '-'}) | D_apparent = ${p.singlePeakSizeNm.toFixed(2)} nm | Status: ${p.isExcluded ? 'EXCLUDED' : 'ACTIVE'}`).join('\n')}
=====================================================`;

    navigator.clipboard.writeText(report);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  // Prepare chart data for Main Regression View with exact Student-t hyperbolic 95% confidence bands
  const chartData = useMemo(() => {
    if (!result || !result.pointsExtended) return [];
    
    const activePts = result.pointsExtended.filter(p => !p.isExcluded);
    const n = activePts.length;
    const meanX = n > 0 ? activePts.reduce((acc, p) => acc + p.x, 0) / n : 0;
    const sxx = activePts.reduce((acc, p) => acc + Math.pow(p.x - meanX, 2), 0);
    // Student-t 95% critical value (two-tailed) for df = n - 2
    const df = Math.max(1, n - 2);
    const tCrit = df === 1 ? 4.303 : df === 2 ? 3.182 : df === 3 ? 2.776 : df === 4 ? 2.571 : df <= 6 ? 2.447 : df <= 10 ? 2.228 : 1.96;
    const syx = result.regression.rmse ? result.regression.rmse * Math.sqrt(n / Math.max(1, n - 2)) : 0.0005;

    return result.pointsExtended.map(p => {
      const fitY = result.regression.slope * p.x + result.regression.intercept;
      const leverage = n > 0 && sxx > 1e-12 ? (1 / n) + Math.pow(p.x - meanX, 2) / sxx : 1;
      const confidenceBound = tCrit * syx * Math.sqrt(leverage);
      return {
        x: p.x,
        y: p.y,
        yActive: p.isExcluded ? null : p.y,
        yExcluded: p.isExcluded ? p.y : null,
        fit: fitY,
        fitRange: [fitY - confidenceBound, fitY + confidenceBound],
        residual: p.residual ?? (p.y - fitY),
        studentizedResidual: p.studentizedResidual ?? 0,
        twoTheta: p.twoTheta,
        hkl: p.hkl ? `(${p.hkl.join('')})` : '',
        isExcluded: p.isExcluded,
        apparentSizeNm: p.singlePeakSizeNm,
        dSpacing: p.dSpacing,
        eHklGPa: p.eHklGPa,
        contrastFactorC: p.contrastFactorC,
        hSquared: p.hSquared
      };
    }).sort((a, b) => a.x - b.x);
  }, [result]);

  // Synthesize Full XRD Diffractogram Pattern comparing Total (Size+Strain) vs Strain-Free (Size-Only)
  const xrdPatternData = useMemo(() => {
    if (!result || !result.pointsExtended || result.pointsExtended.length === 0) return [];
    const active = result.pointsExtended.filter(p => !p.isExcluded);
    if (active.length === 0) return [];

    const minTT = Math.max(10, Math.floor(Math.min(...active.map(p => p.twoTheta)) - 6));
    const maxTT = Math.min(110, Math.ceil(Math.max(...active.map(p => p.twoTheta)) + 6));
    const step = 0.2;
    const pts: { twoTheta: number; totalProfile: number; sizeOnlyProfile: number }[] = [];

    const sizeD = result.sizeInterceptNm > 0 && result.sizeInterceptNm < 1000 ? result.sizeInterceptNm : 80;

    for (let tt = minTT; tt <= maxTT; tt += step) {
      let sumTotal = 18; // baseline background
      let sumSizeOnly = 18;

      active.forEach((p, idx) => {
        const dx = tt - p.twoTheta;
        const fwhmTotal = Math.max(0.08, p.fwhmObs);
        const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
        // Theoretical strain-free FWHM from decoupled size D + instrumental
        const betaSizeDeg = ((constantK * wavelength * 0.1) / (sizeD * Math.max(0.1, Math.cos(thetaRad)))) * (180 / Math.PI);
        const fwhmSizeOnly = Math.max(0.06, Math.sqrt(Math.pow(betaSizeDeg, 2) + Math.pow(p.fwhmInst || 0.08, 2)));

        if (Math.abs(dx) < fwhmTotal * 5) {
          const amp = 850 / (1 + idx * 0.18);
          const halfG = fwhmTotal / 2;
          const gauss = Math.exp(-Math.LN2 * Math.pow(dx / halfG, 2));
          const lorentz = 1 / (1 + Math.pow(dx / halfG, 2));
          sumTotal += amp * (0.5 * gauss + 0.5 * lorentz);
        }
        if (Math.abs(dx) < fwhmSizeOnly * 5) {
          const amp = 850 / (1 + idx * 0.18);
          const halfG0 = fwhmSizeOnly / 2;
          const gauss0 = Math.exp(-Math.LN2 * Math.pow(dx / halfG0, 2));
          const lorentz0 = 1 / (1 + Math.pow(dx / halfG0, 2));
          sumSizeOnly += amp * (0.5 * gauss0 + 0.5 * lorentz0);
        }
      });

      pts.push({
        twoTheta: Number(tt.toFixed(2)),
        totalProfile: Math.round(sumTotal),
        sizeOnlyProfile: Math.round(sumSizeOnly)
      });
    }
    return pts;
  }, [result, constantK, wavelength]);

  // Model-specific axis labels
  const getXAxisLabel = () => {
    switch (strainModel) {
      case 'USDM': return '4 sin(θ) / E_hkl (GPa⁻¹)';
      case 'UDEDM': return '4 sin(θ) / √E_hkl (GPa⁻⁰·⁵)';
      case 'SSP': return 'd² · β* (Å)';
      case 'Halder-Wagner': return 'β* / (d*)² (Å)';
      case 'mWH': return 'K · √C_hkl (Å⁻¹)';
      case 'Stephens': return '4 sin(θ) · √(1 + 2.5 H²) (Anisotropic)';
      case 'Monshi-Scherrer': return 'ln(1 / cos θ)';
      default: return '4 sin(θ) (Dimensionless)';
    }
  };

  const getYAxisLabel = () => {
    switch (strainModel) {
      case 'SSP': return '(d · β*)² (Dimensionless)';
      case 'Halder-Wagner': return '(β* / d*)² (Dimensionless)';
      case 'mWH': return 'ΔK = β cos(θ) / λ (Å⁻¹)';
      case 'Monshi-Scherrer': return 'ln(β_sample rad)';
      default: return 'β_sample · cos(θ) (rad)';
    }
  };

  // Tooltip customizer
  const CustomRegressionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#0A101C] text-white p-4 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.25)] border border-cyan-500/40 text-xs font-mono">
          <div className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-white/10">
            <span className="font-black text-cyan-400 uppercase tracking-wider">
              {d.twoTheta ? `${d.twoTheta.toFixed(2)}° 2θ` : 'Peak point'} {d.hkl}
            </span>
            {d.isExcluded && (
              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Excluded
              </span>
            )}
          </div>
          <div className="space-y-1.5 text-[10px]">
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">X ({(getXAxisLabel().split('(')[0] || '').trim()}):</span> 
              <span className="text-cyan-300 font-bold">{d.x?.toFixed(5)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Y ({(getYAxisLabel().split('(')[0] || '').trim()}):</span> 
              <span className="text-cyan-300 font-bold">{d.y?.toFixed(5)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Linear Fit Y:</span> 
              <span className="text-rose-400 font-bold">{d.fit?.toFixed(5)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Residual (Y - Ŷ):</span> 
              <span className={`font-bold ${Math.abs(d.residual) < 0.001 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {d.residual >= 0 ? '+' : ''}{d.residual?.toFixed(5)}
              </span>
            </p>
            <p className="flex justify-between gap-6 pt-1 border-t border-white/5">
              <span className="text-slate-400">Apparent D_hkl:</span> 
              <span className="text-emerald-300 font-bold">{d.apparentSizeNm?.toFixed(2)} nm</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 items-start">
      {/* ================= TOP EXECUTIVE WILLIAMSON-HALL HEADER & 5-CARD KPI STRIP (12 Cols) ================= */}
      <div className="lg:col-span-12 bg-[#0B0F19] border border-slate-800 rounded-md shadow-2xl overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500" />
        <div className="p-4 sm:p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider font-mono">
                  WILLIAMSON–HALL STUDIO // SIZE–STRAIN DECOUPLING & ANISOTROPY SOLVER
                </h2>
                <span className="px-2 py-0.5 rounded-xs bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                  8 SOLVER MODELS
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                  STUDENT-T 95% CI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Separates coherent crystallite size broadening (β_D ∝ 1/cosθ) from lattice microstrain broadening (β_ε ∝ 4ε·tanθ) across multiple (hkl) reflections.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {bestFitModelItem && bestFitModelItem.modelName !== strainModel && (
              <button
                type="button"
                onClick={() => handleSelectStrainModel(bestFitModelItem.modelName as any)}
                className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Automatically switch to the model with the highest R² fit quality for this dataset"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Select Best Model ({bestFitModelItem.modelName})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleImportFromScherrer}
              className="px-3 py-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Import Scherrer</span>
            </button>
            <button
              type="button"
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copiedNotice ? 'Copied!' : 'Copy Report'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* 5-Card Executive Size-Strain Metrology KPI Strip */}
        <div className="p-4 bg-[#070A12] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono tabular-nums">
          {/* Card 1: Decoupled Size D */}
          <div className="bg-[#0B0F19] border border-slate-800 p-3 rounded relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>1. True Size D_WH</span>
              <span className="text-emerald-400 font-bold">From Y-Intercept</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {result && result.sizeInterceptNm > 0 && result.sizeInterceptNm < 500
                ? result.sizeInterceptNm.toFixed(2)
                : '> 250'}{' '}
              <span className="text-xs text-emerald-400">nm</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Apparent Scherrer ⟨D⟩ = {meanApparentScherrerNm > 0 ? `${meanApparentScherrerNm.toFixed(1)} nm` : '—'}
            </div>
          </div>

          {/* Card 2: Microstrain ε */}
          <div className="bg-[#0B0F19] border border-slate-800 p-3 rounded relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500" />
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>2. Microstrain ε</span>
              <span className="text-cyan-400 font-bold">From Slope ({strainModel})</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {result ? result.strainPercent.toFixed(4) : '—'} <span className="text-xs text-cyan-400">%</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {result
                ? result.regression.slope < 0
                  ? 'Compressive / Anisotropic (-ε)'
                  : result.strainPercent < 0.05
                  ? 'Low Strain (<0.05%)'
                  : 'Tensile / Defect Broadened'
                : '—'}
            </div>
          </div>

          {/* Card 3: Fit Quality R² */}
          <div className="bg-[#0B0F19] border border-slate-800 p-3 rounded relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-500" />
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>3. Fit Linearity R²</span>
              <span className="text-purple-400 font-bold">N={result?.points.length ?? 0} Peaks</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {result ? result.regression.rSquared.toFixed(4) : '—'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {result && result.regression.rSquared >= 0.92
                ? 'Nominal Linear Fit'
                : 'Anisotropic Scatter (Try SSP/USDM)'}
            </div>
          </div>

          {/* Card 4: Dislocation Density ρ */}
          <div className="bg-[#0B0F19] border border-slate-800 p-3 rounded relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500" />
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>4. Dislocations ρ_WS</span>
              <span className="text-rose-400 font-bold">b={burgersVectorNm}nm</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {result?.dislocationDensity10_14 !== undefined ? result.dislocationDensity10_14.toFixed(2) : '—'}{' '}
              <span className="text-xs text-rose-400">×10¹⁴ m⁻²</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {result?.dislocationDensity10_14 && result.dislocationDensity10_14 > 0
                ? `Mean Spacing L_d ≈ ${(100 / Math.sqrt(result.dislocationDensity10_14)).toFixed(1)} nm`
                : 'ρ = 2√3·|ε| / (D·b)'}
            </div>
          </div>

          {/* Card 5: Lattice Stress & SSA */}
          <div className="bg-[#0B0F19] border border-slate-800 p-3 rounded relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500" />
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
              <span>5. Stress σ & Surface</span>
              <span className="text-amber-400 font-bold">E={youngsModulusGPa} GPa</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {result?.stressMPa !== undefined
                ? `${result.stressMPa.toFixed(0)} MPa`
                : result?.specificSurfaceAreaM2g
                ? `${result.specificSurfaceAreaM2g.toFixed(1)} m²/g`
                : '—'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {result?.energyDensityKjM3 !== undefined
                ? `Energy u = ${result.energyDensityKjM3.toFixed(1)} kJ/m³`
                : `SSA = ${result?.specificSurfaceAreaM2g ? `${result.specificSurfaceAreaM2g.toFixed(1)} m²/g` : 'Enable E/ρ'}`}
            </div>
          </div>
        </div>
      </div>

      {/* ================= FULL-WIDTH 3-MODE INTERACTIVE CAD SCHEMATIC & MODEL GUIDE (12 Cols) ================= */}
      <div className="lg:col-span-12">
        <WHCadSchematic
          result={result}
          strainModel={strainModel}
          onSelectStrainModel={handleSelectStrainModel}
          wavelength={wavelength}
          constantK={constantK}
          broadeningModel={broadeningModel}
          instFwhm={instFwhm}
          isDecouplingEnabled={isDecouplingEnabled}
          burgersVectorNm={burgersVectorNm}
          youngsModulusGPa={youngsModulusGPa}
        />
      </div>

      {/* ================= LEFT CONFIGURATION PANEL (4 Cols) ================= */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0B0F19] p-5 sm:p-6 rounded-md shadow-2xl border border-slate-800 relative overflow-hidden group transition-all">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500" />
          
          <div className="flex items-center justify-between gap-4 mb-5 relative z-10 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Settings className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                  Solver & Optics Configuration
                </h2>
                <p className="text-[10px] font-mono tabular-nums text-cyan-400 uppercase tracking-widest mt-0.5">
                  Model: {strainModel} · λ = {wavelength.toFixed(4)} Å
                </p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset config to default values"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" /> Reset
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            {/* Model Selector Group */}
            <div className="bg-[#070A12] p-3.5 rounded border border-slate-800">
              <label className="block text-[10px] font-mono font-bold text-emerald-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  1. Select Size–Strain Model
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-xs border border-emerald-500/30">
                  {strainModel}
                </span>
              </label>
              
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'UDM', label: 'UDM', title: 'Uniform Deformation Model (Isotropic Strain)' },
                  { id: 'USDM', label: 'USDM', title: 'Uniform Stress Deformation Model (Anisotropic E_hkl)' },
                  { id: 'UDEDM', label: 'UDEDM', title: 'Uniform Deformation Energy Density Model' },
                  { id: 'SSP', label: 'SSP', title: 'Size-Strain Plot (High Angle Weighted)' },
                  { id: 'Halder-Wagner', label: 'H-W', title: 'Halder-Wagner Voigt Parabolic Decoupling' },
                  { id: 'mWH', label: 'mWH', title: 'Ungár Modified W-H (Dislocation Contrast C_hkl)' },
                  { id: 'Stephens', label: 'Stephens', title: 'Stephens Anisotropic Microstrain Tensor' },
                  { id: 'Monshi-Scherrer', label: 'Monshi', title: 'Monshi-Scherrer Logarithmic Linearization' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectStrainModel(m.id as any)}
                    className={`py-1.5 px-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer truncate ${
                      strainModel === m.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title={m.title}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Memoized KaTeX Formula Display */}
              <div className="mt-3 p-2.5 bg-slate-950 rounded border border-slate-800 text-center">
                <div 
                  className="text-xs text-emerald-300 font-sans py-0.5 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: renderedModelFormulaHtml }}
                />
              </div>

              {/* Ungár Dislocation Contrast Parameter Controls for mWH / Stephens */}
              {(strainModel === 'mWH' || strainModel === 'Stephens') && (
                <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-emerald-300 font-bold uppercase">Dislocation Contrast C_hkl = C_h00(1 - q·H²)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-1">
                        <span>Anisotropy q:</span>
                        <span className="text-emerald-300 font-bold">{dislocationQParam.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="-2.0"
                        max="2.8"
                        step="0.05"
                        value={dislocationQParam}
                        onChange={(e) => setDislocationQParam(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-1">
                        <span>Base C_h00:</span>
                        <span className="text-emerald-300 font-bold">{ch00Param.toFixed(3)}</span>
                      </div>
                      <input
                        type="number"
                        step="0.005"
                        min="0.05"
                        max="0.60"
                        value={ch00Param}
                        onChange={(e) => setCh00Param(parseFloat(e.target.value) || 0.285)}
                        className="w-full px-2 py-1 bg-[#0A101C] text-emerald-300 border border-white/10 rounded-lg font-mono text-[10px] font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: 'Cu Screw (q=2.26)', q: 2.26, c: 0.304 },
                      { label: 'Cu Edge (q=1.65)', q: 1.65, c: 0.304 },
                      { label: 'Fe BCC Screw (q=2.67)', q: 2.67, c: 0.285 },
                      { label: 'Si Isotropic (q=1.35)', q: 1.35, c: 0.215 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setDislocationQParam(preset.q);
                          setCh00Param(preset.c);
                        }}
                        className="px-1.5 py-0.5 rounded bg-black/50 hover:bg-emerald-500/20 border border-white/10 text-[8px] font-mono text-slate-300 hover:text-emerald-300 cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wavelength & Shape Factor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#070D18] p-3.5 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    Wavelength (λ)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={String(wavelength) === 'NaN' ? '' : wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value) || 1.5406)}
                    className="w-full px-3 py-2 bg-[#0A101C] text-cyan-300 border border-white/10 focus:border-cyan-500/60 rounded-xl outline-none font-mono text-xs font-bold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[9px] font-black text-slate-500 font-mono">Å</div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {['Cu Kα', 'Mo Kα', 'Co Kα'].map(name => (
                    <button
                      key={name}
                      onClick={() => setWavelength(XRAY_WAVELENGTHS[name] || 1.5406)}
                      className={`py-1 px-0.5 rounded-lg border text-[7px] font-black uppercase tracking-tight transition-all cursor-pointer ${
                        Math.abs(wavelength - (XRAY_WAVELENGTHS[name] || 0)) < 0.001
                          ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold'
                          : 'bg-black/40 border-white/5 text-slate-400'
                      }`}
                    >
                      {name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape Factor K */}
              <div className="bg-[#070D18] p-3.5 rounded-2xl border border-white/10 hover:border-rose-500/40 transition-all">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-rose-400" />
                    Shape Factor (K)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={String(constantK) === 'NaN' ? '' : constantK}
                    onChange={(e) => setConstantK(parseFloat(e.target.value) || 0.9)}
                    className="w-full px-3 py-2 bg-[#0A101C] text-rose-300 border border-white/10 focus:border-rose-500/60 rounded-xl outline-none font-mono text-xs font-bold"
                  />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {[0.9, 0.94, 1.0].map(val => (
                    <button
                      key={val}
                      onClick={() => setConstantK(val)}
                      className={`py-1 px-0.5 rounded-lg border text-[8px] font-black transition-all cursor-pointer ${
                        constantK === val
                          ? 'bg-rose-500 text-black border-rose-400 font-extrabold'
                          : 'bg-black/40 border-white/5 text-slate-400'
                      }`}
                    >
                      K={val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instrumental Broadening & Profile */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-amber-500/30">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Instrumental Deconvolution
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDecouplingExplanation(!showDecouplingExplanation)}
                    className="text-[9px] text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>Why?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDecouplingEnabled(!isDecouplingEnabled)}
                    className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                      isDecouplingEnabled 
                        ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
                        : 'bg-black/30 border-white/5 text-slate-500'
                    }`}
                  >
                    {isDecouplingEnabled ? 'Correction ON' : 'Raw / Off'}
                  </button>
                </div>
              </div>

              {/* Decoupling Explanation Banner */}
              <AnimatePresence>
                {showDecouplingExplanation && (
                  <motion.div
                    key="wh-decoupling-explanation"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 text-xs space-y-1.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Why Decouple Instrumental Broadening?
                      </span>
                      <button onClick={() => setShowDecouplingExplanation(false)} className="text-slate-400 hover:text-white text-[10px]">✕</button>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                      Diffractometer optical components (X-ray tube focus, divergence slits, monochromators) introduce non-sample line broadening <code className="text-amber-300 font-mono">β_inst</code>.
                    </p>
                    <div className="bg-black/60 p-1.5 rounded font-mono text-[9px] text-center text-amber-200 border border-white/5">
                      Gaussian: β_sample² = β_obs² - β_inst² | Lorentzian: β_sample = β_obs - β_inst
                    </div>
                    <p className="text-[9px] text-slate-400">
                      <strong>Without decoupling:</strong> Peaks appear broader than true crystal domains, underestimating size D and artificially altering regression slopes. Turning it off is suitable when evaluating raw uncalibrated diffractograms.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isDecouplingEnabled ? (
                <>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Model:</span>
                    <div className="flex gap-1">
                      {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt'] as const).map(bm => (
                        <button
                          key={bm}
                          onClick={() => setBroadeningModel(bm)}
                          className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer ${
                            broadeningModel === bm
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-black/40 text-slate-400 border border-white/5 hover:text-slate-200'
                          }`}
                        >
                          {bm === 'Gaussian' ? 'Gauss' : bm === 'Lorentzian' ? 'Lorentz' : 'P-Voigt'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(['constant', 'caglioti'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setInstrumentalMode(mode)}
                        className={`py-1.5 px-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          instrumentalMode === mode 
                            ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                            : 'bg-black/40 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'constant' ? 'Constant FWHM' : 'Caglioti Curve'}
                      </button>
                    ))}
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={String(instFwhm) === 'NaN' ? '' : instFwhm}
                        onChange={(e) => setInstFwhm(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-[#0A101C] text-amber-300 border border-white/10 rounded-xl font-mono text-xs font-bold outline-none"
                        placeholder="FWHM (deg)"
                      />
                      <div className="flex gap-1 shrink-0">
                        {[0, 0.05, 0.1].map(v => (
                          <button
                            key={v}
                            onClick={() => setInstFwhm(v)}
                            className="px-2 py-1 bg-black/40 border border-white/5 rounded-lg text-[8px] font-mono text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                          >
                            {v === 0 ? '0°' : `${v}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <label className="block text-[8px] font-mono text-slate-400 text-center">U (tan²θ)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cagliotiU}
                          onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-1 bg-[#0A101C] text-amber-300 border border-white/10 rounded-lg text-center font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-slate-400 text-center">V (tanθ)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cagliotiV}
                          onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-1 bg-[#0A101C] text-amber-300 border border-white/10 rounded-lg text-center font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-slate-400 text-center">W (const)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cagliotiW}
                          onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-1 bg-[#0A101C] text-amber-300 border border-white/10 rounded-lg text-center font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-2.5 bg-black/40 rounded-xl border border-dashed border-white/10 text-center text-[9px] text-slate-500 font-mono">
                  Deconvolution disabled (β_sample = β_obs).
                </div>
              )}
            </div>

            {/* Elastic Stress, Burgers Vector & Material Density */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5" />
                  Elasticity & SSA Density
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowDensityExplanation(!showDensityExplanation)}
                    className="text-purple-400 hover:text-purple-300 cursor-pointer"
                    title="Why use Material Density?"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModulusEnabled(!isModulusEnabled)}
                    className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-lg border transition-colors cursor-pointer ${
                      isModulusEnabled 
                        ? 'bg-purple-500 text-black border-purple-400 font-bold' 
                        : 'bg-black/30 border-white/5 text-slate-500'
                    }`}
                  >
                    {isModulusEnabled ? 'Stress ON' : 'Modulus Off'}
                  </button>
                </div>
              </div>

              {/* Density Explanation Box */}
              <AnimatePresence>
                {showDensityExplanation && (
                  <motion.div
                    key="wh-density-explanation"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs space-y-1.5 overflow-hidden font-mono"
                  >
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span>Why use Material Density ρ (g/cm³)?</span>
                      <button onClick={() => setShowDensityExplanation(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal font-sans">
                      Converts XRD crystallite diameter D into <strong>Specific Surface Area (m²/g)</strong>:
                    </p>
                    <div className="bg-black/60 p-1.5 rounded text-center text-purple-300 text-[10px] border border-white/5">
                      SSA = (6 × 10³) / (ρ × D_volume) [m²/g]
                    </div>
                    <p className="text-[9px] text-slate-400 font-sans">
                      <strong>Why optional?</strong> W-H size (nm), microstrain (ε), and stress (MPa) are independent of material density.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Young's Modulus (E)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={youngsModulusGPa}
                      onChange={(e) => setYoungsModulusGPa(parseFloat(e.target.value) || 130)}
                      className="w-full px-2.5 py-1.5 bg-[#0A101C] text-purple-300 border border-white/10 rounded-xl font-mono text-xs font-bold"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-mono">GPa</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Burgers Vector (b)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={burgersVectorNm}
                      onChange={(e) => setBurgersVectorNm(parseFloat(e.target.value) || 0.25)}
                      className="w-full px-2.5 py-1.5 bg-[#0A101C] text-purple-300 border border-white/10 rounded-xl font-mono text-xs font-bold"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-mono">nm</span>
                  </div>
                </div>
              </div>

              {/* Material Density Section */}
              <div className="pt-2.5 border-t border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                    Material Density ρ (SSA)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDensityEnabled(!isDensityEnabled)}
                    className={`px-1.5 py-0.5 text-[7px] font-black uppercase rounded border transition-colors cursor-pointer ${
                      isDensityEnabled ? 'bg-purple-500 text-black border-purple-400' : 'bg-black/30 border-white/5 text-slate-500'
                    }`}
                  >
                    {isDensityEnabled ? 'SSA ON' : 'Optional Off'}
                  </button>
                </div>
                {isDensityEnabled ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={String(materialDensityGcm3) === 'NaN' ? '' : materialDensityGcm3}
                      onChange={(e) => setMaterialDensityGcm3(parseFloat(e.target.value) || 2.33)}
                      className="w-full px-2.5 py-1.5 bg-[#0A101C] text-purple-300 border border-white/10 rounded-xl font-mono text-xs font-bold"
                      placeholder="Density in g/cm³..."
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-mono">g/cm³</span>
                  </div>
                ) : (
                  <div className="p-1.5 bg-black/40 rounded-lg text-center text-[8px] text-slate-500 font-mono">
                    SSA Calculation Disabled
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant & Dataset Loader */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Dataset Assistant
                </label>
                <button
                  type="button"
                  onClick={handleImportFromScherrer}
                  className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[8px] font-black uppercase tracking-wider text-amber-300 transition-colors cursor-pointer"
                  title="Import active peak list & instrument parameters from Scherrer Studio"
                >
                  Import Scherrer Studio
                </button>
              </div>
              {transferNotice && (
                <p className="text-[8px] font-mono text-amber-300 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 mb-2">
                  {transferNotice}
                </p>
              )}
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Nanocrystalline Anatase TiO2"
                  className="flex-1 px-3 py-1.5 bg-[#0A101C] text-cyan-300 border border-white/10 rounded-xl text-xs outline-none focus:border-cyan-500/60 font-mono placeholder:text-slate-600"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAiSmartGenerate();
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAiSmartGenerate()}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Load
                </button>
              </div>

              {aiSuccessMessage && (
                <p className="text-[8px] font-mono text-cyan-300 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20 mb-2">
                  {aiSuccessMessage}
                </p>
              )}

              {/* Quick Preset Badges */}
              <div className="flex flex-wrap gap-1 mt-2">
                {WH_PRESETS.slice(0, 6).map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setInputData(p.data);
                      setWavelength(p.wavelength);
                      setConstantK(p.k);
                      if (p.youngsModulus) {
                        setYoungsModulusGPa(p.youngsModulus);
                        setIsModulusEnabled(true);
                      }
                      if (p.density) setMaterialDensityGcm3(p.density);
                      setExcludedIndices([]);
                      setAdvisorReport(null);
                    }}
                    className="px-2 py-1 bg-black/40 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-lg text-[8px] font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <span>{p.icon}</span>
                    <span>{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Peak Data Manager (Dual Grid/Raw Editor with HKL indexing and Synthetic Synthesis) */}
            <WHPeakDataManager
              inputData={inputData}
              onInputChange={(newVal) => setInputData(newVal)}
              wavelength={wavelength}
              constantK={constantK}
              instFwhm={instFwhm}
              isDecouplingEnabled={isDecouplingEnabled}
              broadeningModel={broadeningModel}
              excludedIndices={excludedIndices}
              onToggleExcludePeak={toggleExcludePeak}
              onSelectPreset={(data, name, ym, den) => {
                setInputData(data);
                if (ym) {
                  setYoungsModulusGPa(ym);
                  setIsModulusEnabled(true);
                }
                if (den) setMaterialDensityGcm3(den);
                setExcludedIndices([]);
              }}
            />

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCalculateWithSimulation}
                className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold uppercase tracking-wider rounded border border-cyan-400 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Recompute W–H Size–Strain Fit</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateAdvisorReport}
                disabled={isAdvisorLoading || !result}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
              >
                {isAdvisorLoading ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <BrainCircuit className="w-4 h-4 text-cyan-400" />}
                <span>{isAdvisorLoading ? 'Analyzing Line Profiles...' : 'AI Crystallographic Advisor'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT RESULTS & DIAGNOSTIC STUDIO (8 Cols) ================= */}
      <div className="lg:col-span-8 space-y-6">
        {/* Math Control KaTeX Dynamic Inspector */}
        {result && (
          <ScientificMathControl
            title={`Williamson-Hall ${strainModel} Verification`}
            formula={
              strainModel === 'USDM' ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + \\frac{4\\sigma \\sin(\\theta)}{E_{hkl}}' :
              strainModel === 'UDEDM' ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\sin(\\theta) \\sqrt{\\frac{2u}{E_{hkl}}}' :
              strainModel === 'SSP' ? '(d\\beta^*)^2 = \\frac{K}{D}(d^2 \\beta^*) + (2\\varepsilon)^2' :
              strainModel === 'Halder-Wagner' ? '\\left(\\frac{\\beta^*}{d^*}\\right)^2 = \\frac{K}{D} \\frac{\\beta^*}{(d^*)^2} + (2\\varepsilon)^2' :
              strainModel === 'mWH' ? '\\Delta K = \\frac{K}{D} + \\alpha \\left(K \\bar{C}_{hkl}^{1/2}\\right)' :
              strainModel === 'Stephens' ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\varepsilon \\sin(\\theta)\\sqrt{1 + 2.5 H^2}' :
              strainModel === 'Monshi-Scherrer' ? '\\ln(\\beta) = \\ln\\left(\\frac{K\\lambda}{D}\\right) + \\ln\\left(\\frac{1}{\\cos\\theta}\\right)' :
              '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\varepsilon \\sin(\\theta)'
            }
            description={`Decoupled regression result for ${strainModel} (SE_slope = ±${(result.regression.stdErrorSlope || 0).toExponential(2)}, SE_int = ±${(result.regression.stdErrorIntercept || 0).toExponential(2)}).`}
            variables={[
              { symbol: 'Slope', name: 'Regression Gradient', value: result.regression.slope, unit: strainModel === 'USDM' ? 'MPa' : strainModel === 'UDEDM' ? '√(GPa)' : strainModel === 'SSP' || strainModel === 'Halder-Wagner' ? 'Å⁻¹' : '' },
              { symbol: 'Intercept', name: 'Y-Intercept', value: result.regression.intercept, unit: strainModel === 'mWH' ? 'Å⁻¹' : strainModel === 'SSP' || strainModel === 'Halder-Wagner' || strainModel === 'Monshi-Scherrer' ? '' : 'rad' },
              { symbol: 'K', name: 'Shape Factor', value: constantK, unit: '' },
              { symbol: 'λ', name: 'Wavelength', value: wavelength, unit: 'Å' }
            ]}
            result={result.sizeInterceptNm}
            resultUnit="nm"
            resultName="Decoupled Crystallite Size (D)"
          />
        )}

        {/* Diagnostic Visualizer Tab Navigation */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500" />
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 rounded border border-slate-800">
              {[
                { id: 'fit', label: '01. W-H Regression', icon: TrendingUp },
                { id: 'comparison', label: '02. 8-Model Matrix', icon: Layers },
                { id: 'apparentSizes', label: '03. D_hkl vs D_WH', icon: BarChart2 },
                { id: 'pattern', label: '04. XRD Pattern', icon: Zap },
                { id: 'residuals', label: '05. Residuals', icon: Activity },
                { id: 'dislocationTensor', label: '06. Elasticity & ρ', icon: Atom },
                { id: 'nanoSim', label: '07. Forward Sim', icon: Sliders },
                { id: 'advisor', label: '08. AI Advisor', icon: BrainCircuit }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-2.5 py-1.5 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === tab.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold uppercase text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>{copiedNotice ? 'Copied!' : 'Copy Report'}</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="px-2.5 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MAIN REGRESSION PLOT */}
          {activeTab === 'fit' && (
            <div className="space-y-3">
              {/* Interactive Plot HUD Controls */}
              {result && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#070D18] rounded-xl border border-white/5 font-mono tabular-nums text-[9px]">
                  <div className="flex flex-wrap items-center gap-3 text-slate-400">
                    <span>
                      Equation: <strong className="text-white">Y = ({result.regression.slope.toExponential(3)})·X + ({result.regression.intercept.toExponential(3)})</strong>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>
                      RMSE: <strong className="text-cyan-300">{result.regression.rmse ? result.regression.rmse.toExponential(2) : '-'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowConfidenceBand(!showConfidenceBand)}
                      className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase cursor-pointer transition-colors ${
                        showConfidenceBand
                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                          : 'bg-black/40 text-slate-500 border-white/10'
                      }`}
                    >
                      95% CI Band
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowZeroStrainLine(!showZeroStrainLine)}
                      className={`px-2 py-0.5 rounded border text-[8px] font-bold uppercase cursor-pointer transition-colors ${
                        showZeroStrainLine
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-black/40 text-slate-500 border-white/10'
                      }`}
                    >
                      ε=0 Floor (Kλ/D)
                    </button>
                  </div>
                </div>
              )}

              <div className="h-[390px] w-full min-h-0 min-w-0">
                {!result || chartData.length < 2 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                    <TrendingUp className="w-8 h-8 text-cyan-500/30 mb-2" />
                    <span>Enter at least 2 active peaks to generate the Williamson-Hall regression plot.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                      <defs>
                        <linearGradient id="whConfidenceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.16}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="x" 
                        type="number"
                        domain={['auto', 'auto']}
                        label={{ 
                          value: getXAxisLabel(), 
                          position: 'bottom', 
                          offset: 25, 
                          fill: '#94a3b8', 
                          fontSize: 10, 
                          fontWeight: 900, 
                          fontFamily: 'monospace' 
                        }}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        label={{ 
                          value: getYAxisLabel(), 
                          angle: -90, 
                          position: 'left', 
                          offset: 10, 
                          fill: '#94a3b8', 
                          fontSize: 10, 
                          fontWeight: 900, 
                          fontFamily: 'monospace' 
                        }}
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                        tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <Tooltip content={<CustomRegressionTooltip />} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }} />
                      {showZeroStrainLine && result.regression.intercept > 0 && (
                        <ReferenceLine
                          y={result.regression.intercept}
                          stroke="#10b981"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          label={{
                            value: `Size Floor Kλ/D (${result.sizeInterceptNm.toFixed(1)} nm)`,
                            fill: '#10b981',
                            fontSize: 9,
                            position: 'insideBottomRight'
                          }}
                        />
                      )}
                      {showConfidenceBand && (
                        <Area
                          type="monotone"
                          dataKey="fitRange"
                          stroke="none"
                          fill="url(#whConfidenceGrad)"
                          name="95% Confidence Band"
                        />
                      )}
                      <Line 
                        type="monotone" 
                        dataKey="fit" 
                        stroke="#f43f5e" 
                        strokeWidth={2} 
                        dot={false} 
                        name={`${strainModel} Fit Line`}
                        activeDot={false}
                        strokeDasharray="4 4"
                      />
                      <Scatter 
                        name="Active Bragg Peaks" 
                        dataKey="yActive" 
                        fill="#22d3ee" 
                        shape="circle" 
                        r={6} 
                      />
                      {excludedIndices.length > 0 && (
                        <Scatter 
                          name="Excluded Outliers" 
                          dataKey="yExcluded" 
                          fill="#f43f5e" 
                          shape="cross" 
                          r={5} 
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* TAB 1B: SYNTHESIZED FULL XRD DIFFRACTOGRAM PATTERN */}
          {activeTab === 'pattern' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#070D18] rounded-xl border border-white/5 font-mono tabular-nums text-[9px] text-slate-400">
                <span>
                  Synthesized Pseudo-Voigt Diffractogram comparing <strong className="text-cyan-300">Observed (Size + Strain)</strong> vs. <strong className="text-emerald-300">Strain-Free Domain Reference (ε = 0)</strong>
                </span>
                <span>λ = {wavelength.toFixed(4)} Å</span>
              </div>
              <div className="h-[390px] w-full min-h-0 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={xrdPatternData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="twoTheta"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      label={{ value: 'Diffraction Angle 2θ (degrees)', position: 'bottom', offset: 25, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <YAxis
                      label={{ value: 'Intensity (a.u.)', angle: -90, position: 'left', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0A101C', borderColor: 'rgba(34,211,238,0.4)', borderRadius: '12px', fontFamily: 'monospace', fontSize: '10px' }}
                      labelFormatter={(val) => `2θ = ${Number(val).toFixed(2)}°`}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }} />
                    <Area
                      type="monotone"
                      dataKey="totalProfile"
                      name="Total Broadened Profile (Size + Microstrain)"
                      stroke="#22d3ee"
                      fill="rgba(34,211,238,0.15)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="sizeOnlyProfile"
                      name="Strain-Free Scherrer Profile (ε = 0)"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 2: RESIDUALS DIAGNOSTIC */}
          {activeTab === 'residuals' && (
            <div className="h-[420px] w-full min-h-0 min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-2 px-3 py-2 bg-[#070D18] rounded-xl border border-white/5 text-[9px] font-mono tabular-nums text-slate-400">
                <span>Durbin-Watson Autocorrelation: <strong className="text-cyan-300">{result?.regression.durbinWatson?.toFixed(3) || '2.000'}</strong> (Ideal ≈ 2.0)</span>
                <span>RMSE: <strong className="text-rose-300">{result?.regression.rmse ? result.regression.rmse.toExponential(3) : '-'}</strong></span>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="twoTheta" 
                      type="number"
                      domain={['auto', 'auto']}
                      label={{ value: '2θ Diffraction Angle (°)', position: 'bottom', offset: 25, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      label={{ value: 'Residual (Y - Ŷ)', angle: -90, position: 'left', offset: 10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Tooltip content={<CustomRegressionTooltip />} />
                    <ReferenceLine y={0} stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" />
                    <Scatter name="Residuals (Y - Ŷ)" dataKey="residual" fill="#f43f5e" shape="diamond" r={6} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: APPARENT SIZE D_HKL PROFILE */}
          {activeTab === 'apparentSizes' && (
            <div className="h-[420px] w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="hkl" 
                    label={{ value: 'Crystal Reflection (h k l)', position: 'bottom', offset: 25, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    label={{ value: 'Apparent Size D_hkl (nm)', angle: -90, position: 'left', offset: 10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Tooltip formatter={(val: any) => [`${Number(val).toFixed(2)} nm`, 'Apparent Size']} />
                  <ReferenceLine y={result?.sizeInterceptNm || 0} stroke="#22d3ee" strokeWidth={2} strokeDasharray="4 4" label={{ value: `Decoupled D_WH = ${result?.sizeInterceptNm?.toFixed(1)} nm`, fill: '#22d3ee', fontSize: 10 }} />
                  <Bar dataKey="apparentSizeNm" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isExcluded ? '#475569' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* TAB 4: DISLOCATION & ELASTIC STATE */}
          {activeTab === 'dislocationTensor' && (
            <div className="h-[420px] w-full overflow-y-auto custom-scrollbar p-2 space-y-4 font-mono tabular-nums">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#070D18] p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Dislocation Density (ρ)</span>
                  <p className="text-xl font-mono tabular-nums font-black text-rose-400">
                    {result?.dislocationDensity10_14 ? `${result.dislocationDensity10_14.toFixed(3)} × 10¹⁴` : 'N/A'}
                    <span className="text-[9px] text-slate-400 ml-1">m⁻²</span>
                  </p>
                  <p className="text-[8px] text-slate-500 mt-2 font-mono">
                    ρ = 2√3 · |ε| / (D · b), b = {burgersVectorNm} nm
                  </p>
                </div>

                <div className="bg-[#070D18] p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Specific Surface Area (SSA)</span>
                  <p className="text-xl font-mono tabular-nums font-black text-cyan-400">
                    {result?.specificSurfaceAreaM2g ? `${result.specificSurfaceAreaM2g.toFixed(2)}` : 'N/A'}
                    <span className="text-[9px] text-slate-400 ml-1">m²/g</span>
                  </p>
                  <p className="text-[8px] text-slate-500 mt-2 font-mono">
                    SSA = 6000 / (ρ_mat · D), ρ_mat = {materialDensityGcm3} g/cm³
                  </p>
                </div>

                <div className="bg-[#070D18] p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Deformation Energy (u)</span>
                  <p className="text-xl font-mono tabular-nums font-black text-purple-400">
                    {result?.energyDensityKjM3 !== undefined ? `${result.energyDensityKjM3.toFixed(2)}` : 'N/A'}
                    <span className="text-[9px] text-slate-400 ml-1">kJ/m³</span>
                  </p>
                  <p className="text-[8px] text-slate-500 mt-2 font-mono">
                    Internal Stress σ = {result?.stressMPa !== undefined ? `${result.stressMPa.toFixed(1)} MPa` : 'Enable E_hkl'}
                  </p>
                </div>
              </div>

              {/* Per-Reflection Anisotropic Elasticity & Dislocation Contrast Inspector */}
              {result?.pointsExtended && result.pointsExtended.length > 0 && (
                <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      Directional Anisotropy Tensor (E_hkl, H², Contrast C_hkl)
                    </span>
                    <span className="text-[8px] text-slate-400">
                      C_hkl = {ch00Param.toFixed(3)}·(1 - {dislocationQParam.toFixed(2)}·H²)
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-left text-[9px] font-mono tabular-nums">
                      <thead className="bg-black/50 text-slate-400 uppercase text-[8px]">
                        <tr>
                          <th className="py-1.5 px-2">(h k l)</th>
                          <th className="py-1.5 px-2">2θ (°)</th>
                          <th className="py-1.5 px-2">Cubic Invariant H²</th>
                          <th className="py-1.5 px-2">Modulus E_hkl (GPa)</th>
                          <th className="py-1.5 px-2">Contrast C_hkl</th>
                          <th className="py-1.5 px-2 text-right">ρ_hkl (×10¹⁴ m⁻²)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {result.pointsExtended.map((p, idx) => (
                          <tr key={idx} className={p.isExcluded ? 'opacity-40' : ''}>
                            <td className="py-1.5 px-2 text-purple-300 font-bold">
                              {p.hkl ? `(${p.hkl.join(' ')})` : `Peak #${idx + 1}`}
                            </td>
                            <td className="py-1.5 px-2 text-cyan-300">{p.twoTheta.toFixed(2)}°</td>
                            <td className="py-1.5 px-2 text-slate-300">
                              {p.hSquared !== undefined ? p.hSquared.toFixed(4) : '0.0000'}
                            </td>
                            <td className="py-1.5 px-2 text-emerald-300 font-bold">
                              {p.eHklGPa !== undefined ? `${p.eHklGPa.toFixed(1)} GPa` : `${youngsModulusGPa.toFixed(1)} GPa`}
                            </td>
                            <td className="py-1.5 px-2 text-amber-300">
                              {p.contrastFactorC !== undefined ? p.contrastFactorC.toFixed(4) : '-'}
                            </td>
                            <td className="py-1.5 px-2 text-right text-rose-300 font-bold">
                              {p.dislocationDensity10_14 !== undefined ? p.dislocationDensity10_14.toFixed(3) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MULTI-MODEL COMPARISON STUDIO */}
          {activeTab === 'comparison' && (
            <div className="h-[420px] w-full overflow-y-auto custom-scrollbar">
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-[10px] text-left border-collapse bg-black/40 font-mono tabular-nums">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[8px] uppercase tracking-wider bg-black/60 font-black">
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-2">Size D (nm)</th>
                      <th className="py-2.5 px-2">Strain ε (%)</th>
                      <th className="py-2.5 px-2">Stress σ (MPa)</th>
                      <th className="py-2.5 px-2">Energy u (kJ/m³)</th>
                      <th className="py-2.5 px-2">Fit R²</th>
                      <th className="py-2.5 px-2">Adj-R²</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result?.modelComparisons?.map((m) => (
                      <tr 
                        key={m.modelName} 
                        className={`hover:bg-cyan-500/5 transition-colors ${strainModel === m.modelName ? 'bg-cyan-500/10' : ''}`}
                      >
                        <td className="py-2.5 px-3 font-bold text-cyan-400 flex items-center gap-1.5">
                          {strainModel === m.modelName && <Check className="w-3 h-3 text-emerald-400" />}
                          <span>{m.label}</span>
                          {m.isBestFit && (
                            <span className="px-1.5 py-0.2 rounded text-[7px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Best Fit
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-emerald-300 font-bold">
                          {m.sizeNm > 0 ? `${m.sizeNm.toFixed(2)} nm` : '∞ (Bulk)'}
                        </td>
                        <td className="py-2.5 px-2 text-cyan-300">
                          {m.strainPercent.toFixed(4)}%
                        </td>
                        <td className="py-2.5 px-2 text-rose-300">
                          {m.stressMPa !== undefined ? `${m.stressMPa.toFixed(1)}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-purple-300">
                          {m.energyDensityKjM3 !== undefined ? `${m.energyDensityKjM3.toFixed(1)}` : '-'}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-amber-300">
                          {m.rSquared.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-2 text-slate-400">
                          {m.adjustedRSquared !== undefined ? m.adjustedRSquared.toFixed(4) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleSelectStrainModel(m.modelName as any)}
                            disabled={strainModel === m.modelName}
                            className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              strainModel === m.modelName
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-black/50 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10'
                            }`}
                          >
                            {strainModel === m.modelName ? 'Active' : 'Apply'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-500 mt-2 font-mono leading-relaxed">
                * Note: Models differ in their handling of anisotropic elastic constants (USDM/UDEDM), high-angle reflection weighting (SSP), or dislocation contrast factors (mWH).
              </p>
            </div>
          )}

          {/* TAB 5B: NANO-CRYSTALLITE FORWARD SIMULATOR (Merged from XRD Nano) */}
          {activeTab === 'nanoSim' && (
            <div className="pt-2">
              <NanoCrystalliteSimulatorView
                wavelength={wavelength}
                kFactor={constantK}
                instFwhm={instFwhm}
                onApplySimulatedPeaks={(simPeaks) => {
                  const text = simPeaks
                    .map(p => {
                      const hklPart = p.hkl && p.hkl.length === 3 ? `, ${p.hkl[0]}, ${p.hkl[1]}, ${p.hkl[2]}` : '';
                      return `${p.twoTheta.toFixed(3)}, ${p.fwhmObs.toFixed(3)}${hklPart}`;
                    })
                    .join('\n');
                  setInputData(text);
                  setExcludedIndices([]);
                  setActiveTab('fit');
                }}
              />
            </div>
          )}

          {/* TAB 6: AI CRYSTALLOGRAPHIC ADVISOR */}
          {activeTab === 'advisor' && (
            <div className="h-[420px] w-full overflow-y-auto custom-scrollbar p-3">
              {isAdvisorLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3 text-cyan-400 font-mono text-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <p className="text-center font-bold uppercase tracking-widest text-xs">
                    Gemini 3.1 Pro Thinking: Performing Line-Profile Microstructural Evaluation...
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Evaluating anisotropic broadening, dislocation contrast factors, and strain energy density.
                  </p>
                </div>
              ) : advisorError ? (
                <div className="p-4 bg-rose-950/30 rounded-2xl border border-rose-500/30 text-rose-300 text-xs font-mono">
                  <p className="font-bold mb-1">Advisory Generation Error</p>
                  <p className="text-[10px] text-rose-400">{advisorError}</p>
                </div>
              ) : advisorReport ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                        AI Line-Profile Expert Analysis
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      Model: Gemini 3.1 Pro Preview (High Thinking)
                    </span>
                  </div>
                  <div className="prose prose-invert prose-xs max-w-none text-slate-300 text-[11px] leading-relaxed font-sans space-y-3">
                    <Markdown>{advisorReport}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3 font-mono text-xs">
                  <BrainCircuit className="w-10 h-10 text-cyan-500/40" />
                  <div>
                    <h4 className="font-black text-white uppercase text-sm mb-1">AI Line-Profile Advisor</h4>
                    <p className="text-[10px] text-slate-400 max-w-md">
                      Generate an in-depth crystallographic and dislocation report comparing all Williamson-Hall models, identifying anisotropic strain scatter, and providing publication-ready microstructural insights.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAdvisorReport}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider text-xs rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                  >
                    Generate Report Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Peak-by-Peak Table with Outlier Toggles */}
        {result && result.pointsExtended && result.pointsExtended.length > 0 && (
          <div className="bg-[#0B0F19] rounded-md border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500" />
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
                  <Binary className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Peak Management & Studentized Outlier Diagnostics
                  </h3>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">
                    Toggle individual reflections to exclude high-residual outliers from regression
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoPruneOutliers}
                  className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  title="Automatically exclude reflections with studentized residual |t_i| > 1.8"
                >
                  Auto-Prune Outliers (|t| &gt; 1.8)
                </button>
                {excludedIndices.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setExcludedIndices([])}
                    className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    Include All
                  </button>
                )}
                <span className="text-[9px] font-mono tabular-nums text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  ● {result.points.length} Active / {result.pointsExtended.length} Total
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-[10px] text-left border-collapse bg-black/20 font-mono tabular-nums">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[8px] uppercase tracking-wider bg-black/40 font-black">
                    <th className="py-2 px-2 text-center">Status</th>
                    <th className="py-2 px-2">2θ (°)</th>
                    <th className="py-2 px-2">FWHM (°)</th>
                    <th className="py-2 px-2">β_sample (°)</th>
                    <th className="py-2 px-2">(h k l)</th>
                    <th className="py-2 px-2">E_hkl / C_hkl</th>
                    <th className="py-2 px-2">X Coord</th>
                    <th className="py-2 px-2">Y Coord</th>
                    <th className="py-2 px-2">Residual (t_i)</th>
                    <th className="py-2 px-3 text-right">Apparent D_hkl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.pointsExtended.map((p, idx) => {
                    const absT = Math.abs(p.studentizedResidual || 0);
                    const barPct = Math.min(100, Math.round((absT / 2.5) * 100));
                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${p.isExcluded ? 'opacity-40 bg-rose-500/5' : 'hover:bg-cyan-500/5'}`}
                      >
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExcludePeak(idx)}
                            className={`p-1 rounded transition-colors cursor-pointer ${p.isExcluded ? 'text-slate-500 hover:text-rose-400' : 'text-cyan-400 hover:text-cyan-300'}`}
                            title={p.isExcluded ? 'Include peak in regression' : 'Exclude peak from regression'}
                          >
                            {p.isExcluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="py-2 px-2 text-cyan-400 font-bold">{p.twoTheta.toFixed(3)}°</td>
                        <td className="py-2 px-2 text-slate-400">{p.fwhmObs.toFixed(3)}°</td>
                        <td className="py-2 px-2 text-emerald-400">{p.betaCorrectedDeg.toFixed(3)}°</td>
                        <td className="py-2 px-2 text-purple-300 font-bold">
                          {p.hkl ? `(${p.hkl.join(' ')})` : '-'}
                        </td>
                        <td className="py-2 px-2 text-slate-400">
                          <span>{p.eHklGPa ? `${p.eHklGPa.toFixed(0)} GPa` : '-'}</span>
                          {p.contrastFactorC !== undefined && (
                            <span className="text-[8px] text-emerald-400/80 block">C={p.contrastFactorC.toFixed(3)}</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-slate-400">{p.x.toFixed(4)}</td>
                        <td className="py-2 px-2 text-slate-400">{p.y.toFixed(5)}</td>
                        <td className="py-2 px-2 font-mono tabular-nums">
                          {p.residual !== undefined ? (
                            <div className="space-y-0.5">
                              <span className={absT < 1.5 ? 'text-emerald-400' : absT < 2.0 ? 'text-amber-400' : 'text-rose-400'}>
                                {p.residual >= 0 ? '+' : ''}{p.residual.toFixed(5)}
                              </span>
                              {p.studentizedResidual !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] text-slate-500">
                                    t={p.studentizedResidual >= 0 ? '+' : ''}{p.studentizedResidual.toFixed(2)}σ
                                  </span>
                                  <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${absT < 1.5 ? 'bg-emerald-400' : absT < 2.0 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                      style={{ width: `${barPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {p.singlePeakSizeNm > 0 ? `${p.singlePeakSizeNm.toFixed(2)} nm` : '∞'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Standalone Python Code Exporter */}
        {result && (
          <PythonCodeExporter 
            methodName={`Williamson-Hall ${strainModel} Analysis`}
            parameters={{
              wavelength: Number(wavelength),
              twoTheta: result.points.map(p => p.twoTheta),
              beta: result.pointsExtended ? result.pointsExtended.map(p => p.fwhmObs) : [],
              shapeFactor: Number(constantK || 0.9),
              strainModel: strainModel,
              x: result.points.map(p => p.x),
              y: result.points.map(p => p.y)
            }}
          />
        )}
      </div>
    </div>
  );
};
