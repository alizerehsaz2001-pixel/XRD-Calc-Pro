import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  BookOpen
} from 'lucide-react';
import { ScientificMathControl } from './ScientificMathControl';
import { PythonCodeExporter } from './PythonCodeExporter';
import { GoogleGenAI, Type } from '@google/genai';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const WH_PRESETS = [
  { 
    name: 'Silicon NIST SRM 640', 
    data: "28.44, 0.12, 1, 1, 1\n47.30, 0.15, 2, 2, 0\n56.12, 0.18, 3, 1, 1\n69.13, 0.22, 4, 0, 0\n76.38, 0.25, 3, 3, 1\n88.03, 0.28, 4, 2, 2", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Nearly zero-strain strain-free reference standard',
    icon: '💎',
    youngsModulus: 130,
    density: 2.33,
    material: 'Silicon (Si)'
  },
  { 
    name: 'Nanocrystalline ZnO Wurtzite', 
    data: "31.77, 0.38, 1, 0, 0\n34.42, 0.41, 0, 0, 2\n36.25, 0.44, 1, 0, 1\n47.54, 0.52, 1, 0, 2\n56.60, 0.60, 1, 1, 0\n62.86, 0.68, 1, 0, 3\n67.96, 0.74, 1, 1, 2", 
    wavelength: 1.5406, 
    k: 0.94, 
    desc: 'Semiconductor nanoparticles with shape and microstrain broadening',
    icon: '⚡',
    youngsModulus: 140,
    density: 5.61,
    material: 'Zinc Oxide (ZnO)'
  },
  { 
    name: 'Cold-Worked 316L Stainless Steel', 
    data: "43.60, 0.48, 1, 1, 1\n50.79, 0.65, 2, 0, 0\n74.69, 0.88, 2, 2, 0\n90.69, 1.12, 3, 1, 1\n95.96, 1.25, 2, 2, 2", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Austenitic fcc alloy with high dislocation density and lattice strain',
    icon: '⚙️',
    youngsModulus: 193,
    density: 7.98,
    material: 'Iron / Ferritic Steel (Fe)'
  },
  { 
    name: 'Anatase TiO2 Nanoparticles', 
    data: "25.28, 0.45, 1, 0, 1\n37.80, 0.52, 0, 0, 4\n48.05, 0.62, 2, 0, 0\n53.89, 0.68, 1, 0, 5\n55.06, 0.70, 2, 1, 1\n62.69, 0.81, 2, 0, 4", 
    wavelength: 1.5406, 
    k: 0.94, 
    desc: 'Tetragonal photocatalyst with anisotropic crystallite domains',
    icon: '⚪',
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
    icon: '🎞️',
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
    icon: '☀️',
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
  const [showDensityExplanation, setShowDensityExplanation] = useState<boolean>(false);
  const [showDecouplingExplanation, setShowDecouplingExplanation] = useState<boolean>(false);
  
  // Excluded peak indices for outlier filtration
  const [excludedIndices, setExcludedIndices] = useState<number[]>([]);

  // Input Data: 2Theta, FWHM, h, k, l
  const [inputData, setInputData] = useState<string>("28.44, 0.25, 4, 0, 0\n47.30, 0.28, 2, 2, 0\n56.12, 0.32, 2, 2, 2\n69.13, 0.38, 4, 4, 0\n76.38, 0.42, 6, 2, 0");
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt'>('Gaussian');
  const [strainModel, setStrainModel] = useState<'UDM' | 'USDM' | 'UDEDM' | 'SSP' | 'Halder-Wagner' | 'mWH' | 'Stephens' | 'Monshi-Scherrer'>('UDM');
  
  // Diagnostic Visualizer Tab
  const [activeTab, setActiveTab] = useState<'fit' | 'residuals' | 'apparentSizes' | 'dislocationTensor' | 'comparison'>('fit');

  const [result, setResult] = useState<WHResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_wh_current');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const isFirstRender = useRef(true);

  // AI Smart Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
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
    setExcludedIndices([]);
    setInputData("28.44, 0.25, 4, 0, 0\n47.30, 0.28, 2, 2, 0\n56.12, 0.32, 2, 2, 2\n69.13, 0.38, 4, 4, 0\n76.38, 0.42, 6, 2, 0");
    setStrainModel('UDM');
    setBroadeningModel('Gaussian');
  };

  const handleClear = () => {
    setInputData("");
    setExcludedIndices([]);
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
      isModulusEnabled ? youngsModulusGPa : undefined,
      strainModel,
      currentPreset?.name,
      currentExcluded,
      burgersVectorNm,
      isDensityEnabled ? materialDensityGcm3 : undefined,
      dislocationQParam
    );
    setResult(computed);
    if (computed) {
      localStorage.setItem('xrd_wh_current', JSON.stringify(computed));
    }
  };

  const handleCalculateWithSimulation = () => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 300);
    setTimeout(() => setSimulationStep(3), 600);
    setTimeout(() => setSimulationStep(4), 900);
    setTimeout(() => setSimulationStep(5), 1200);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      executeCalculation();
    }, 1500);
  };

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
    dislocationQParam
  ]);

  // Outlier toggle per peak
  const toggleExcludePeak = (index: number) => {
    setExcludedIndices(prev => {
      const next = prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index];
      return next;
    });
  };

  // AI Smart Generation / Paper extraction
  const handleAiSmartGenerate = async (promptOverride?: string) => {
    const textToRun = promptOverride || aiPrompt;
    if (!textToRun.trim()) return;

    setIsAiLoading(true);
    setAiSuccessMessage('');
    try {
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert X-ray diffraction crystallographer. Extract or synthesize XRD peak parameters for Williamson-Hall size-strain analysis based on this description:
"${textToRun}".

Requirements:
1. Provide 4 to 8 realistic diffraction peaks.
2. For each peak, give 2Theta (deg), FWHM (deg), and Miller indices (h, k, l).
3. Suggest the appropriate X-ray wavelength (usually 1.5406 for Cu Kalpha), Young's Modulus E (GPa), material density (g/cm^3), and appropriate physical strain model (UDM, USDM, UDEDM, SSP, Halder-Wagner, or mWH).

Respond strictly with a JSON object matching this schema:
{
  "materialName": "string",
  "wavelength": number,
  "youngsModulusGPa": number,
  "densityGcm3": number,
  "strainModel": "UDM" | "USDM" | "UDEDM" | "SSP" | "Halder-Wagner" | "mWH",
  "peaks": [
    { "twoTheta": number, "fwhm": number, "h": number, "k": number, "l": number }
  ],
  "rationale": "string"
}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              materialName: { type: Type.STRING },
              wavelength: { type: Type.NUMBER },
              youngsModulusGPa: { type: Type.NUMBER },
              densityGcm3: { type: Type.NUMBER },
              strainModel: { type: Type.STRING },
              peaks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    twoTheta: { type: Type.NUMBER },
                    fwhm: { type: Type.NUMBER },
                    h: { type: Type.NUMBER },
                    k: { type: Type.NUMBER },
                    l: { type: Type.NUMBER }
                  },
                  required: ['twoTheta', 'fwhm', 'h', 'k', 'l']
                }
              },
              rationale: { type: Type.STRING }
            },
            required: ['materialName', 'wavelength', 'peaks']
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
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
        }
      }
    } catch (err: any) {
      setAiSuccessMessage('Error invoking AI Assistant. Please verify data format.');
    } finally {
      setIsAiLoading(false);
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

  // Prepare chart data for Main Regression View
  const chartData = useMemo(() => {
    if (!result || !result.pointsExtended) return [];
    
    // Sort all points by X
    return result.pointsExtended.map(p => {
      const fitY = result.regression.slope * p.x + result.regression.intercept;
      const stdDev = result.regression.rmse || 0.001;
      const confidenceBound = stdDev * 2.0; // 95% CI
      return {
        x: p.x,
        y: p.y,
        fit: fitY,
        fitRange: [Math.max(0, fitY - confidenceBound), fitY + confidenceBound],
        residual: p.residual || (p.y - fitY),
        twoTheta: p.twoTheta,
        hkl: p.hkl ? `(${p.hkl.join('')})` : '',
        isExcluded: p.isExcluded,
        apparentSizeNm: p.singlePeakSizeNm,
        dSpacing: p.dSpacing
      };
    }).sort((a, b) => a.x - b.x);
  }, [result]);

  // Model-specific axis labels
  const getXAxisLabel = () => {
    switch (strainModel) {
      case 'USDM': return '4 sin(θ) / E_hkl (GPa⁻¹)';
      case 'UDEDM': return '4 sin(θ) / √E_hkl (GPa⁻⁰·⁵)';
      case 'SSP': return 'd² · β* (Å² · Å⁻¹)';
      case 'Halder-Wagner': return 'β* / (d*)² (Å)';
      case 'mWH': return 'K · √C_hkl (Å⁻¹)';
      case 'Monshi-Scherrer': return 'ln(1 / cos θ)';
      default: return '4 sin(θ) (Dimensionless)';
    }
  };

  const getYAxisLabel = () => {
    switch (strainModel) {
      case 'SSP': return '(d · β*)² (Dimensionless)';
      case 'Halder-Wagner': return '(β* / d*)² (Dimensionless)';
      case 'mWH': return 'ΔK = 2β cos(θ) / λ (Å⁻¹)';
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
              <span className="text-cyan-300 font-bold">{d.x.toFixed(5)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Y ({(getYAxisLabel().split('(')[0] || '').trim()}):</span> 
              <span className="text-cyan-300 font-bold">{d.y.toFixed(5)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Linear Fit Y:</span> 
              <span className="text-rose-400 font-bold">{d.fit.toFixed(5)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Residual (Y - Ŷ):</span> 
              <span className={`font-bold ${Math.abs(d.residual) < 0.001 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {d.residual >= 0 ? '+' : ''}{d.residual.toFixed(5)}
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* ================= LEFT CONFIGURATION PANEL (4 Cols) ================= */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0A101C]/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_35px_rgba(34,211,238,0.08)] border border-cyan-500/30 relative overflow-hidden group transition-all hover:border-cyan-500/50">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20 group-hover:bg-cyan-500/20 transition-all duration-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl translate-y-20 -translate-x-20 group-hover:bg-rose-500/20 transition-all duration-700 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-4 mb-6 relative z-10 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#0a0500] rounded-2xl border border-cyan-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] overflow-hidden">
                <Settings className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider mb-0.5">
                  Williamson-Hall
                </h2>
                <p className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-500/70 uppercase tracking-[0.25em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-[pulse_2s_ease-in-out_infinite]" />
                  Size & Microstrain Studio
                </p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-400 bg-slate-900/80 hover:bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-slate-700/80 hover:border-cyan-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Reset config to default values"
            >
              <RefreshCw className="w-3 h-3 text-cyan-500" /> Reset
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            {/* Model Selector Pill Group */}
            <div className="bg-[#070D18] p-3.5 rounded-2xl border border-emerald-500/30">
              <label className="block text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-[0.2em] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Physics Model
                </span>
                <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {strainModel}
                </span>
              </label>
              
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'UDM', label: 'UDM', title: 'Uniform Deformation Model (Isotropic Strain)' },
                  { id: 'USDM', label: 'USDM', title: 'Uniform Stress Model (Anisotropic Ehkl)' },
                  { id: 'UDEDM', label: 'UDEDM', title: 'Uniform Deformation Energy Density Model' },
                  { id: 'SSP', label: 'SSP', title: 'Size-Strain Plot (High Angle Weighted)' },
                  { id: 'Halder-Wagner', label: 'H-W', title: 'Halder-Wagner Voigt Decoupling' },
                  { id: 'mWH', label: 'mWH', title: 'Modified W-H (Dislocation Contrast C)' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setStrainModel(m.id as any)}
                    className={`py-1.5 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      strainModel === m.id
                        ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.35)] scale-[1.02]'
                        : 'bg-black/40 border-white/5 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title={m.title}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* KaTeX Formula Display */}
              <div className="mt-3 p-2.5 bg-[#0A101C] rounded-xl border border-emerald-500/20 text-center">
                <div 
                  className="text-xs text-emerald-300 font-sans py-0.5 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: katex.renderToString(
                    strainModel === 'UDM' ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\varepsilon \\sin(\\theta)' :
                    strainModel === 'USDM' ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + \\frac{4\\sigma \\sin(\\theta)}{E_{hkl}}' :
                    strainModel === 'UDEDM' ? '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\sin(\\theta) \\sqrt{\\frac{2u}{E_{hkl}}}' :
                    strainModel === 'SSP' ? '(d \\cdot \\beta^*)^2 = \\frac{K}{D}(d^2 \\beta^*) + \\left(\\frac{\\varepsilon}{2}\\right)^2' :
                    strainModel === 'Halder-Wagner' ? '\\left(\\frac{\\beta^*}{d^*}\\right)^2 = \\frac{1}{D} \\frac{\\beta^*}{(d^*)^2} + \\left(\\frac{\\varepsilon}{2}\\right)^2' :
                    '\\Delta K = \\frac{0.9}{D} + \\alpha K \\bar{C}^{1/2}',
                    { throwOnError: false }
                  ) }}
                />
              </div>
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

            {/* Elastic Stress, Burgers Vector & Optional Material Density */}
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
              </div>
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
                    }}
                    className="px-2 py-1 bg-black/40 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-lg text-[8px] font-mono text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <span>{p.icon}</span>
                    <span>{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Raw Peak Input Textarea */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-emerald-400" />
                  Peak Data (2θ, FWHM, h, k, l)
                </label>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[8px] font-black uppercase text-red-400 hover:bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Clear
                </button>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full h-28 px-3 py-2 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/60 rounded-xl outline-none font-mono text-xs leading-relaxed custom-scrollbar"
                placeholder="2θ, FWHM, h, k, l"
                spellCheck="false"
              />
            </div>

            {/* Action Button */}
            {!isSimulationRunning ? (
              <button
                onClick={handleCalculateWithSimulation}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-rose-500 to-amber-500 hover:from-cyan-400 hover:via-rose-400 hover:to-amber-400 text-black font-extrabold uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Run Full W-H Refinement</span>
              </button>
            ) : (
              <div className="bg-[#070D18] p-4 rounded-2xl border border-cyan-500/40 text-center">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Step {simulationStep}/5: Refining Size-Strain State...
                </p>
              </div>
            )}
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
              strainModel === 'SSP' ? '(d\\beta^*)^2 = \\frac{K}{D}(d^2 \\beta^*) + \\left(\\frac{\\varepsilon}{2}\\right)^2' :
              strainModel === 'Halder-Wagner' ? '\\left(\\frac{\\beta^*}{d^*}\\right)^2 = \\frac{1}{D} \\frac{\\beta^*}{(d^*)^2} + \\left(\\frac{\\varepsilon}{2}\\right)^2' :
              '\\beta \\cos(\\theta) = \\frac{K\\lambda}{D} + 4\\varepsilon \\sin(\\theta)'
            }
            description={`Decoupled regression result for ${strainModel}. Slope directly encodes strain while Y-intercept yields pure grain dimension.`}
            variables={[
              { symbol: 'Slope', name: 'Regression Gradient', value: result.regression.slope, unit: '' },
              { symbol: 'Intercept', name: 'Y-Intercept', value: result.regression.intercept, unit: 'Å⁻¹' },
              { symbol: 'K', name: 'Shape Factor', value: constantK, unit: '' },
              { symbol: 'λ', name: 'Wavelength', value: wavelength, unit: 'Å' }
            ]}
            result={result.sizeInterceptNm}
            resultUnit="nm"
            resultName="Decoupled Crystallite Size (D)"
          />
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Crystallite Size */}
          <div className="bg-gradient-to-br from-[#050A14] to-[#081020] p-5 rounded-2xl border border-emerald-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Crystallite Size</span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline">
                {result && result.sizeInterceptNm > 0 && result.sizeInterceptNm < 500
                  ? result.sizeInterceptNm.toFixed(1)
                  : '> 250'}
                <span className="text-sm font-bold text-emerald-400 ml-1.5">nm</span>
              </p>
              <p className="text-[9px] font-mono text-slate-400 mt-1.5 uppercase truncate" title={result && result.sizeInterceptNm > 0 ? `Exact: ${result.sizeInterceptNm.toFixed(3)} nm` : 'Bulk / Strain-Dominated'}>
                {result && result.sizeInterceptNm > 0 ? `Exact: ${result.sizeInterceptNm.toFixed(3)} nm` : 'Bulk / Strain-Dominated'}
              </p>
            </div>
          </div>

          {/* Microstrain */}
          <div className="bg-gradient-to-br from-[#050A14] to-[#081020] p-5 rounded-2xl border border-cyan-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Microstrain (ε)</span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                {result ? `${result.strainPercent.toFixed(3)}%` : '-'}
              </p>
              <p className="text-[9px] font-mono text-slate-400 mt-1.5 uppercase truncate" title={result ? `ε = ${(result.strainPercent / 100).toExponential(3)}` : ''}>
                {result ? `ε = ${(result.strainPercent / 100).toExponential(3)}` : '-'}
              </p>
            </div>
          </div>

          {/* Fit Quality R² */}
          <div className="bg-gradient-to-br from-[#050A14] to-[#081020] p-5 rounded-2xl border border-purple-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest truncate">Fit Quality (R²)</span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                {result ? result.regression.rSquared.toFixed(4) : '-'}
              </p>
              <p className="text-[9px] font-mono text-slate-400 mt-1.5 uppercase truncate">
                {result && result.regression.rSquared > 0.9 ? 'Strong Linearity' : 'High Anisotropy'}
              </p>
            </div>
          </div>

          {/* Dislocation Density */}
          <div className="bg-gradient-to-br from-[#050A14] to-[#081020] p-5 rounded-2xl border border-rose-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest truncate">Dislocations (ρ)</span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline">
                {(() => {
                  if (result?.dislocationDensity10_14 === undefined) return '-';
                  const val = result.dislocationDensity10_14 * 1e14;
                  if (val === 0) return '0';
                  const [mantissa, exp] = val.toExponential(2).split('e');
                  return (
                    <>
                      {mantissa}
                      <span className="text-sm font-bold text-rose-400 ml-1 font-sans tracking-normal">×10<sup className="font-mono">{exp.replace('+', '')}</sup></span>
                    </>
                  );
                })()}
              </p>
              <p className="text-[9px] font-mono text-slate-400 mt-1.5 uppercase truncate">
                m⁻² (Williamson-Smallman)
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic Visualizer Tab Navigation */}
        <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
              {[
                { id: 'fit', label: 'W-H Regression Plot', icon: TrendingUp },
                { id: 'residuals', label: 'Residuals Diagnostic', icon: Activity },
                { id: 'apparentSizes', label: 'Apparent Size D_hkl', icon: BarChart2 },
                { id: 'dislocationTensor', label: 'Dislocations & Stress', icon: Atom },
                { id: 'comparison', label: 'Multi-Model Studio', icon: Layers }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)] font-extrabold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
                className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-white/5 border border-white/10 text-[9px] font-black uppercase text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>{copiedNotice ? 'Copied!' : 'Copy Report'}</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[9px] font-black uppercase text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MAIN REGRESSION PLOT */}
          {activeTab === 'fit' && (
            <div className="h-[420px] w-full min-h-0 min-w-0">
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
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0}/>
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
                    <Area
                      type="monotone"
                      dataKey="fitRange"
                      stroke="none"
                      fill="url(#whConfidenceGrad)"
                      name="95% Confidence Band"
                    />
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
                      dataKey="y" 
                      fill="#22d3ee" 
                      shape="circle" 
                      r={6} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* TAB 2: RESIDUALS DIAGNOSTIC */}
          {activeTab === 'residuals' && (
            <div className="h-[420px] w-full min-h-0 min-w-0 flex flex-col">
              <div className="flex items-center justify-between mb-2 text-[9px] font-mono text-slate-400">
                <span>Durbin-Watson Autocorrelation: <strong className="text-cyan-300">{result?.regression.durbinWatson?.toFixed(3) || '2.0'}</strong> (Target ~ 2.0)</span>
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
                  <ReferenceLine y={result?.sizeInterceptNm || 0} stroke="#22d3ee" strokeWidth={2} strokeDasharray="4 4" label={{ value: `Global D_WH = ${result?.sizeInterceptNm?.toFixed(1)} nm`, fill: '#22d3ee', fontSize: 10 }} />
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
            <div className="h-[420px] w-full overflow-y-auto custom-scrollbar p-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#070D18] p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Dislocation Density (ρ)</span>
                  <p className="text-xl font-mono font-black text-rose-400">
                    {result?.dislocationDensity10_14 ? `${result.dislocationDensity10_14.toFixed(3)} × 10¹⁴` : 'N/A'}
                    <span className="text-[9px] text-slate-400 ml-1">m⁻²</span>
                  </p>
                  <p className="text-[8px] text-slate-500 mt-2 font-mono">
                    Relation: ρ = 2√3 · ε / (D · b) with Burgers vector b = {burgersVectorNm} nm
                  </p>
                </div>

                <div className="bg-[#070D18] p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Specific Surface Area (SSA)</span>
                  <p className="text-xl font-mono font-black text-cyan-400">
                    {result?.specificSurfaceAreaM2g ? `${result.specificSurfaceAreaM2g.toFixed(2)}` : 'N/A'}
                    <span className="text-[9px] text-slate-400 ml-1">m²/g</span>
                  </p>
                  <p className="text-[8px] text-slate-500 mt-2 font-mono">
                    SSA = 6000 / (ρ_mat · D) with material density {materialDensityGcm3} g/cm³
                  </p>
                </div>

                <div className="bg-[#070D18] p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Deformation Energy (u)</span>
                  <p className="text-xl font-mono font-black text-purple-400">
                    {result?.energyDensityKjM3 !== undefined ? `${result.energyDensityKjM3.toFixed(2)}` : 'N/A'}
                    <span className="text-[9px] text-slate-400 ml-1">kJ/m³</span>
                  </p>
                  <p className="text-[8px] text-slate-500 mt-2 font-mono">
                    Lattice internal stress: {result?.stressMPa !== undefined ? `${result.stressMPa.toFixed(1)} MPa` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Formula & Microstructural Physics */}
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 text-xs font-mono text-slate-300 space-y-2">
                <p className="font-bold text-cyan-400 uppercase text-[10px]">Microstructural Decoupling Principle:</p>
                <p className="text-[10px] leading-relaxed text-slate-400">
                  Diffraction peak broadening arises from two independent physical mechanisms: finite crystallite domain boundaries (Scherrer Cauchy contribution, ~1/cosθ) and microscopic lattice strain caused by dislocations, point defects, and grain boundaries (Stokes-Wilson Gaussian contribution, ~tanθ). Williamson-Hall constructs a linear reciprocal coordinate system where the slope yields strain ε and the y-intercept isolates the genuine strain-free crystallite size D.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: MULTI-MODEL COMPARISON STUDIO */}
          {activeTab === 'comparison' && (
            <div className="h-[420px] w-full overflow-y-auto custom-scrollbar">
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-[10px] text-left border-collapse bg-black/40 font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[8px] uppercase tracking-wider bg-black/60 font-black">
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-2">Size D (nm)</th>
                      <th className="py-2.5 px-2">Strain ε (%)</th>
                      <th className="py-2.5 px-2">Stress σ (MPa)</th>
                      <th className="py-2.5 px-2">Energy u (kJ/m³)</th>
                      <th className="py-2.5 px-2">Fit R²</th>
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
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setStrainModel(m.modelName as any)}
                            disabled={strainModel === m.modelName}
                            className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
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
        </div>

        {/* Peak-by-Peak Table with Outlier Toggles */}
        {result && result.pointsExtended && result.pointsExtended.length > 0 && (
          <div className="bg-[#050A14] rounded-3xl border border-slate-800 p-6 shadow-2xl relative">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-cyan-400">
                  <Binary className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Peak Management & Outlier Filtering
                  </h3>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">
                    Toggle individual peaks to exclude from regression without losing data
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                {result.points.length} Active / {result.pointsExtended.length} Total
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-[10px] text-left border-collapse bg-black/20 font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[8px] uppercase tracking-wider bg-black/40 font-black">
                    <th className="py-2 px-2 text-center">Status</th>
                    <th className="py-2 px-2">2θ (°)</th>
                    <th className="py-2 px-2">FWHM (°)</th>
                    <th className="py-2 px-2">β_sample (°)</th>
                    <th className="py-2 px-2">hkl</th>
                    <th className="py-2 px-2">d (Å)</th>
                    <th className="py-2 px-2">X Coord</th>
                    <th className="py-2 px-2">Y Coord</th>
                    <th className="py-2 px-2">Residual</th>
                    <th className="py-2 px-3 text-right">Apparent Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.pointsExtended.map((p, idx) => (
                    <tr 
                      key={idx} 
                      className={`transition-colors ${p.isExcluded ? 'opacity-40 bg-rose-500/5' : 'hover:bg-cyan-500/5'}`}
                    >
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleExcludePeak(idx)}
                          className={`p-1 rounded transition-colors ${p.isExcluded ? 'text-slate-500 hover:text-rose-400' : 'text-cyan-400 hover:text-cyan-300'}`}
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
                      <td className="py-2 px-2 text-slate-400">{p.dSpacing ? p.dSpacing.toFixed(3) : '-'}</td>
                      <td className="py-2 px-2 text-slate-400">{p.x.toFixed(4)}</td>
                      <td className="py-2 px-2 text-slate-400">{p.y.toFixed(5)}</td>
                      <td className="py-2 px-2 font-mono">
                        {p.residual !== undefined ? (
                          <span className={Math.abs(p.residual) < 0.001 ? 'text-emerald-400' : 'text-amber-400'}>
                            {p.residual >= 0 ? '+' : ''}{p.residual.toFixed(5)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">
                        {p.singlePeakSizeNm > 0 ? `${p.singlePeakSizeNm.toFixed(2)} nm` : '∞'}
                      </td>
                    </tr>
                  ))}
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
