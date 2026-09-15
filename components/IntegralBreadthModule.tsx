import React, { useState, useEffect, useMemo } from 'react';
import { IntegralBreadthInput, IntegralBreadthResult, IBAdvancedResult } from '../types';
import { 
  parseIntegralBreadthInput, 
  calculateIntegralBreadth, 
  calculateIBAdvanced, 
  synthesizeIBPeakProfile,
  XRAY_WAVELENGTHS 
} from '../utils/physics';
import { 
  Info, 
  BookOpen, 
  Activity, 
  Sparkles, 
  Loader2, 
  ChevronDown, 
  Check, 
  Database, 
  Zap, 
  BarChart2, 
  Settings,
  Download,
  Copy,
  Layers,
  TrendingUp,
  Cpu,
  Boxes,
  Compass,
  FileCode2,
  RefreshCw,
  Eye,
  Sliders,
  Award,
  Target,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from './SettingsContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  Area,
  AreaChart
} from 'recharts';
import { MorphologyVisualizer } from './MorphologyVisualizer';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import integralBg from '../src/assets/images/integral_breadth_ui_bg_1786057501341.jpg';

const K_FACTORS = [
  { label: 'Integral Breadth (K=1.0)', value: 1.0, desc: 'Exact theoretical factor for volume-weighted Integral Breadth method', icon: '∫' },
  { label: 'Standard Average (0.9)', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies', icon: '⚡' },
  { label: 'Spherical (0.94)', value: 0.94, desc: 'Optimized for isotropic spherical particles', icon: '⚪' },
  { label: 'Cubic {100} (0.943)', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111} (0.84)', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral (0.94)', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Tetrahedral (0.73)', value: 0.73, desc: 'Calculated for triangular/tetrahedral geometries', icon: '▲' },
  { label: 'Platelets/Disks (0.89)', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods (1.10)', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

const MATERIAL_PRESETS = [
  { 
    name: 'Silicon (NIST 640 Si)', 
    data: "28.44, 0.22, 230, 1000, 1 1 1\n47.30, 0.26, 280, 950, 2 2 0\n56.12, 0.31, 350, 900, 3 1 1\n69.13, 0.36, 420, 850, 4 0 0\n76.38, 0.41, 480, 800, 3 3 1\n88.03, 0.47, 560, 750, 4 2 2", 
    wavelength: 1.5406, 
    k: 1.0, 
    density: 2.33,
    youngsModulusGPa: 130,
    desc: 'High-purity NIST silicon line profile standard with cubic symmetry.',
    icon: '💎'
  },
  { 
    name: 'Nanocrystalline Ceria (CeO2)', 
    data: "28.55, 0.42, 420, 1000, 1 1 1\n33.08, 0.48, 480, 920, 2 0 0\n47.48, 0.58, 590, 880, 2 2 0\n56.33, 0.67, 680, 820, 3 1 1\n59.08, 0.71, 720, 780, 2 2 2\n69.41, 0.82, 830, 720, 4 0 0", 
    wavelength: 1.5406, 
    k: 1.0, 
    density: 7.22,
    youngsModulusGPa: 200,
    desc: 'Catalytic fluorite ceria nanopowder exhibiting isotropic microstrain.',
    icon: '🔶'
  },
  { 
    name: 'Zinc Oxide (ZnO Nanorods)', 
    data: "31.77, 0.29, 310, 1000, 1 0 0\n34.42, 0.35, 360, 950, 0 0 2\n36.25, 0.30, 320, 980, 1 0 1\n47.54, 0.44, 450, 860, 1 0 2\n56.60, 0.52, 530, 820, 1 1 0\n62.86, 0.59, 600, 780, 1 0 3", 
    wavelength: 1.5406, 
    k: 1.1, 
    density: 5.61,
    youngsModulusGPa: 110,
    desc: 'Wurtzite structure with anisotropic growth along the c-axis.',
    icon: '⚡'
  },
  { 
    name: 'Anatase Titania (TiO2)', 
    data: "25.28, 0.38, 380, 1000, 1 0 1\n37.80, 0.46, 460, 900, 0 0 4\n48.05, 0.54, 550, 850, 2 0 0\n53.89, 0.61, 620, 810, 1 0 5\n55.06, 0.63, 640, 790, 2 1 1\n62.69, 0.70, 710, 740, 2 0 4", 
    wavelength: 1.5406, 
    k: 1.0, 
    density: 3.89,
    youngsModulusGPa: 180,
    desc: 'Tetragonal photocatalytic nanoparticles with shape anisotropy.',
    icon: '☀️'
  },
  { 
    name: 'Cold-Worked Austenitic SS 316L', 
    data: "43.60, 0.45, 460, 1000, 1 1 1\n50.80, 0.54, 550, 910, 2 0 0\n74.70, 0.78, 800, 780, 2 2 0\n90.70, 0.98, 1020, 650, 3 1 1\n96.00, 1.05, 1100, 600, 2 2 2", 
    wavelength: 1.5406, 
    k: 0.94, 
    density: 7.98,
    youngsModulusGPa: 193,
    desc: 'FCC stainless steel with high dislocation density and stacking faults.',
    icon: '⚙️'
  }
];

const CAGLIOTI_PRESETS = [
  { name: '0 (Raw / No Correction)', u: 0, v: 0, w: 0, desc: 'Zero instrumental broadening (raw sample profile)' },
  { name: 'Standard Lab XRD', u: 0.005, v: -0.002, w: 0.015, desc: 'Bragg-Brentano focus, standard divergent slit' },
  { name: 'High-Res Synchrotron', u: 0.0002, v: -0.0001, w: 0.001, desc: 'Extremely parallel mono-chromated beam' },
  { name: 'Neutron Diffractometer', u: 0.05, v: -0.03, w: 0.02, desc: 'Thermal powder diffractometer line' }
];

export const IntegralBreadthModule: React.FC = () => {
  const { precision } = useSettings();
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(1.0);
  const [selectedKType, setSelectedKType] = useState<string>('Integral Breadth (K=1.0)');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  const kMenuRef = React.useRef<HTMLDivElement>(null);

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  // Instrumental resolution parameters
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [instBetaIB, setInstBetaIB] = useState<number>(0.05);
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [decouplingMethod, setDecouplingMethod] = useState<'linear' | 'squared' | 'hw_voigt' | 'de_keijser'>('de_keijser');
  
  // Material density & Elasticity
  const [materialDensity, setMaterialDensity] = useState<number>(2.33);
  const [youngsModulusGPa, setYoungsModulusGPa] = useState<number>(130);
  const [materialName, setMaterialName] = useState<string>('Silicon (NIST 640 Si)');

  // Multi-reflection separation model for regression tab
  const [multiModelMethod, setMultiModelMethod] = useState<'udm' | 'hw' | 'ssp' | 'udedm'>('hw');

  // Active diagnostic visualizer tab
  const [activeTab, setActiveTab] = useState<'deconvolution' | 'regression' | 'liveProfile' | 'defects' | 'instrumental' | 'math' | 'aiAdvisor'>('deconvolution');

  // Live profile selected peak index
  const [selectedPeakIndex, setSelectedPeakIndex] = useState<number>(0);

  // AI Advisor state
  const [aiReport, setAiReport] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSmartLoading, setIsSmartLoading] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Default input data
  const [inputData, setInputData] = useState<string>(MATERIAL_PRESETS[0].data);
  const [results, setResults] = useState<IntegralBreadthResult[]>([]);
  const [advancedResult, setAdvancedResult] = useState<IBAdvancedResult | null>(null);
  const [avgSize, setAvgSize] = useState<number>(0);
  const [avgRmsStrain, setAvgRmsStrain] = useState<number>(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute results
  const computeAll = (dataStr: string) => {
    const peaks = parseIntegralBreadthInput(dataStr);
    if (peaks.length === 0) {
      setResults([]);
      setAdvancedResult(null);
      setAvgSize(0);
      setAvgRmsStrain(0);
      return;
    }

    const singleResults = peaks
      .map(p => calculateIntegralBreadth(
        wavelength, 
        constantK, 
        p,
        instrumentalMode,
        instBetaIB,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        decouplingMethod,
        materialDensity
      ))
      .filter((r): r is IntegralBreadthResult => r !== null);

    setResults(singleResults);

    if (singleResults.length > 0) {
      const sumSize = singleResults.reduce((acc, curr) => acc + curr.calcSizeNm, 0);
      setAvgSize(sumSize / singleResults.length);
      
      const sumStrain = singleResults.reduce((acc, curr) => acc + (curr.apparentRmsStrain || curr.gaussianStrainRms || 0), 0);
      setAvgRmsStrain(sumStrain / singleResults.length);
    }

    if (peaks.length >= 2) {
      const adv = calculateIBAdvanced(
        wavelength,
        constantK,
        instBetaIB,
        peaks,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        decouplingMethod === 'de_keijser' ? 'hw_voigt' : decouplingMethod,
        youngsModulusGPa,
        multiModelMethod,
        materialDensity
      );
      setAdvancedResult(adv);
    }
  };

  // Initial calculation
  useEffect(() => {
    computeAll(inputData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute live on parameter change
  useEffect(() => {
    if (!isSimulationRunning) {
      computeAll(inputData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instrumentalMode, instBetaIB, cagliotiU, cagliotiV, cagliotiW, decouplingMethod, materialDensity, youngsModulusGPa, multiModelMethod]);

  const handleRunFullAnalysis = () => {
    if (isSimulationRunning) return;
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 300);
    setTimeout(() => setSimulationStep(3), 700);
    setTimeout(() => setSimulationStep(4), 1100);
    setTimeout(() => setSimulationStep(5), 1500);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      computeAll(inputData);
    }, 1800);
  };

  const handleSelectPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
    setMaterialName(preset.name);
    setInputData(preset.data);
    setWavelength(preset.wavelength);
    setConstantK(preset.k);
    setMaterialDensity(preset.density);
    setYoungsModulusGPa(preset.youngsModulusGPa);
    setSelectedKType(preset.k === 1.0 ? 'Integral Breadth (K=1.0)' : 'Custom');
    setSelectedPeakIndex(0);
    computeAll(preset.data);
  };

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsSmartLoading(true);
    try {
      const res = await fetch('/api/gemini/generate-ib-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, wavelength })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const formatted = data.data.map((p: any) => {
          const hklStr = p.hkl && Array.isArray(p.hkl) ? `, ${p.hkl.join(' ')}` : '';
          return `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.iMax.toFixed(0)}${hklStr}`;
        }).join('\n');
        setInputData(formatted);
        setMaterialName(`AI: ${searchQuery}`);
        setSelectedPeakIndex(0);
        computeAll(formatted);
      }
    } catch (err) {
      console.error("AI Smart Load failed:", err);
    } finally {
      setIsSmartLoading(false);
    }
  };

  const handleGenerateAiReport = async () => {
    if (results.length === 0) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/integral-breadth-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results,
          advancedResult,
          materialName,
          wavelength,
          decouplingMethod,
          separationMethod: multiModelMethod
        })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setAiReport(data.text);
      }
    } catch (err) {
      console.error("Failed to generate AI report:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Live peak synthesis profile data
  const currentPeakInput = useMemo(() => {
    const peaks = parseIntegralBreadthInput(inputData);
    if (peaks.length === 0) return null;
    const safeIdx = Math.min(selectedPeakIndex, peaks.length - 1);
    return peaks[safeIdx];
  }, [inputData, selectedPeakIndex]);

  const synthesizedProfile = useMemo(() => {
    if (!currentPeakInput) return null;
    return synthesizeIBPeakProfile(
      currentPeakInput.twoTheta,
      currentPeakInput.fwhm,
      currentPeakInput.area,
      currentPeakInput.iMax,
      180
    );
  }, [currentPeakInput]);

  const currentPeakResult = useMemo(() => {
    if (results.length === 0) return null;
    const safeIdx = Math.min(selectedPeakIndex, results.length - 1);
    return results[safeIdx];
  }, [results, selectedPeakIndex]);

  // Decoupled comparison data for chart
  const decoupledChartData = useMemo(() => {
    return results.map(r => ({
      twoTheta: `${r.twoTheta.toFixed(1)}°`,
      twoThetaNum: r.twoTheta,
      betaObs: r.betaObsDeg || r.integralBreadthDeg,
      betaInst: r.betaInstDeg || 0,
      betaSample: r.betaSampleDeg || 0,
      betaCauchy: r.cauchyBetaL_deg || 0,
      betaGauss: r.gaussianBetaG_deg || 0,
      sizeNm: r.calcSizeNm,
      hkl: r.hklString || ''
    })).sort((a, b) => a.twoThetaNum - b.twoThetaNum);
  }, [results]);

  // Defect dynamics data
  const defectDynamicsData = useMemo(() => {
    return results.map(r => ({
      twoTheta: `${r.twoTheta.toFixed(1)}°`,
      sizeNm: r.calcSizeNm,
      dislocation10_14: r.dislocationDensity10_14 || 0,
      ssa: r.specificSurfaceAreaM2g || 0,
      volumeNm3: r.coherenceVolumeNm3 || 0,
      planesN: r.coherencePlanesN || 0
    }));
  }, [results]);

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const header = "2Theta_deg,d_spacing_A,FWHM_deg,beta_Obs_deg,beta_Inst_deg,beta_Sample_deg,Shape_Factor_phi,PV_eta,beta_L_deg,beta_G_deg,Size_Dv_nm,Size_Da_nm,RMS_Microstrain,Dislocation_Density_10_14_m2,SSA_m2_g\n";
    const rows = results.map(r => 
      `${r.twoTheta.toFixed(4)},${r.dSpacing?.toFixed(4) || ''},${r.fwhmObs?.toFixed(4) || ''},${(r.betaObsDeg || r.integralBreadthDeg).toFixed(4)},${r.betaInstDeg?.toFixed(4) || 0},${r.betaSampleDeg?.toFixed(4) || 0},${r.shapeFactorPhi.toFixed(4)},${r.pseudoVoigtEta?.toFixed(4) || ''},${r.cauchyBetaL_deg?.toFixed(4) || ''},${r.gaussianBetaG_deg?.toFixed(4) || ''},${(r.volumeWeightedSizeDvNm || r.calcSizeNm).toFixed(3)},${(r.areaWeightedSizeDaNm || r.calcSizeNm/2).toFixed(3)},${(r.apparentRmsStrain || 0).toExponential(4)},${r.dislocationDensity10_14?.toFixed(4) || ''},${r.specificSurfaceAreaM2g?.toFixed(2) || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integral_breadth_engine_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPython = () => {
    if (results.length === 0) return;
    const pyScript = `# ==========================================================
# XRD Integral Breadth & de Keijser Voigt Line Profile Engine
# Generated by XRD-Calc Pro
# ==========================================================
import numpy as np
import matplotlib.pyplot as plt

wavelength = ${wavelength}  # Angstrom
K = ${constantK}

# Experimental Data: [2Theta (deg), FWHM (deg), Area (counts*deg), Imax (counts)]
raw_data = np.array([
${results.map(r => `    [${r.twoTheta.toFixed(3)}, ${r.fwhmObs?.toFixed(4) || 0.2}, ${(r.betaObsDeg || 0.2) * 1000}, 1000]`).join(',\n')}
])

two_theta = raw_data[:, 0]
fwhm = raw_data[:, 1]
area = raw_data[:, 2]
imax = raw_data[:, 3]

beta_obs = area / imax  # Integral Breadth in degrees
theta_rad = np.radians(two_theta / 2.0)
cos_theta = np.cos(theta_rad)
tan_theta = np.tan(theta_rad)

# Apparent Shape Factor phi = FWHM / beta
phi = fwhm / beta_obs
# Pseudo-Voigt eta estimation
eta = np.clip((0.9394 - phi) / (0.9394 - 0.6366), 0.0, 1.0)

# de Keijser single-line Voigt deconvolution
beta_rad = np.radians(beta_obs)
beta_L_obs = beta_rad * (0.0146 + 0.99395 * eta - 0.0083 * eta**2)
beta_G_obs = beta_rad * (1.0016 - 0.52115 * eta - 0.47885 * eta**2)

# Instrumental correction
beta_inst_rad = np.radians(${instBetaIB})
beta_L_sample = np.maximum(1e-6, beta_L_obs - beta_inst_rad * 0.5)
beta_G_sample = np.sqrt(np.maximum(1e-6, beta_G_obs**2 - (beta_inst_rad * 0.8)**2))

# Volume-weighted size and RMS microstrain
D_v_nm = (K * wavelength) / (beta_L_sample * cos_theta) / 10.0
e_rms = beta_G_sample / (2.0 * np.sqrt(2.0 * np.pi) * tan_theta)

print("--- Integral Breadth Analysis Results ---")
for i in range(len(two_theta)):
    print(f"2Theta = {two_theta[i]:.2f}° | Shape phi = {phi[i]:.3f} | Dv = {D_v_nm[i]:.2f} nm | e_rms = {e_rms[i]:.2e}")

plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
plt.plot(two_theta, D_v_nm, 'o-', color='#ec4899', lw=2)
plt.title("Volume-Weighted Domain Size Dv (nm)")
plt.xlabel("2Theta (degrees)")
plt.ylabel("Dv (nm)")
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(two_theta, e_rms * 100, 's-', color='#8b5cf6', lw=2)
plt.title("Root-Mean-Square Microstrain (%)")
plt.xlabel("2Theta (degrees)")
plt.ylabel("e_rms (%)")
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
`;
    const blob = new Blob([pyScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ib_analysis_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    if (results.length === 0) return;
    const exportPayload = {
      engine: "Integral Breadth Engine v2.0",
      materialName,
      wavelength_A: wavelength,
      shapeFactor_K: constantK,
      decouplingMethod,
      multiModelMethod,
      averageVolumeSize_Dv_nm: avgSize,
      averageRmsMicrostrain: avgRmsStrain,
      singlePeakResults: results,
      advancedRegression: advancedResult
    };
    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration Column (4 Cols) */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050A14] p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          {/* Ambient Background Glow */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
            <img src={integralBg} alt="Integral Breadth" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/85 to-[#050A14]/40" />
          </div>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl group-hover:bg-purple-500/25 transition-all duration-700 pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6 relative z-10 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl border border-purple-500/30 flex items-center justify-center relative shadow-inner">
                <Settings className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">IB Engine</h2>
                <p className="text-[10px] font-mono text-purple-400/80 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  Voigt Line Profile Deconvolution
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            {/* AI Smart Load */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all">
              <label className="block text-[10px] font-black text-purple-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                AI Smart Load Material
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Zinc Oxide, Anatase, Ceria"
                  className="flex-1 px-3 py-2 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-xl focus:ring-1 focus:ring-purple-500/20 outline-none text-xs font-mono placeholder:text-slate-700"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isSmartLoading || !searchQuery.trim()}
                  className="px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-40 text-purple-300 font-bold rounded-xl transition-all flex items-center gap-1.5 border border-purple-500/40 text-xs font-mono"
                >
                  {isSmartLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Load
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-white/5">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-purple-400" /> Standard Calibration Presets
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {MATERIAL_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                      materialName === p.name
                        ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                        : 'bg-[#0A101C] border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/10'
                    }`}
                  >
                    <span className="font-bold truncate text-[11px]">{p.icon} {p.name.split('(')[0]}</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">{p.density} g/cm³</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Data Box */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" /> Reflections Data
                </label>
                <span className="text-[9px] font-mono text-slate-500">2θ, FWHM, Area, Imax, [h k l]</span>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-xl focus:ring-1 focus:ring-purple-500/20 outline-none font-mono text-xs leading-relaxed"
                placeholder="28.44, 0.22, 230, 1000, 1 1 1"
              />
            </div>

            {/* Physical Parameters */}
            <div className="bg-[#070D18] p-4 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" /> Diffraction Parameters
              </h3>

              {/* Wavelength */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
                  X-Ray Wavelength (Å)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value) || 1.5406)}
                  className="w-full px-3 py-2 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-xl outline-none font-mono text-xs"
                />
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {Object.entries(XRAY_WAVELENGTHS).slice(0, 4).map(([name, val]) => (
                    <button
                      key={name}
                      onClick={() => setWavelength(val)}
                      className={`py-1 px-1 rounded-lg border text-[8px] font-black font-mono transition-all ${
                        wavelength === val
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape Factor K */}
              <div ref={kMenuRef} className="relative">
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
                  Shape Factor (K)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                    className="flex-1 px-3 py-2 bg-[#0A101C] text-purple-300 border border-white/10 hover:border-purple-500/40 rounded-xl flex items-center justify-between text-xs font-mono shadow-inner"
                  >
                    <span className="truncate">{selectedKType}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={constantK}
                    onChange={(e) => {
                      setConstantK(parseFloat(e.target.value) || 1.0);
                      setSelectedKType('Custom');
                    }}
                    className="w-16 px-2 py-2 bg-[#0A101C] text-purple-400 border border-white/10 focus:border-purple-500/50 rounded-xl text-center font-mono text-xs font-bold"
                  />
                </div>

                <AnimatePresence>
                  {isKTypeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-[105%] left-0 right-0 bg-[#070D18] border border-purple-500/30 rounded-2xl shadow-2xl z-50 py-1.5 max-h-56 overflow-y-auto"
                    >
                      {K_FACTORS.map((k) => (
                        <button
                          key={k.label}
                          onClick={() => {
                            setConstantK(k.value || 1.0);
                            setSelectedKType(k.label);
                            setIsKTypeMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-purple-500/10 text-xs ${
                            selectedKType === k.label ? 'bg-purple-500/10 text-purple-300' : 'text-slate-400'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center border border-white/5 text-xs">{k.icon}</span>
                          <div>
                            <p className="font-bold text-[11px] text-white">{k.label}</p>
                            <p className="text-[9px] text-slate-500 truncate max-w-[200px]">{k.desc}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decoupling Method */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">
                  Broadening Decoupling Model
                </label>
                <select
                  value={decouplingMethod}
                  onChange={(e) => setDecouplingMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-xl outline-none font-mono text-xs"
                >
                  <option value="de_keijser">de Keijser Single-Line Voigt (Recommended)</option>
                  <option value="hw_voigt">Halder-Wagner Parabolic Voigt</option>
                  <option value="squared">Gaussian (Squared Subtraction)</option>
                  <option value="linear">Cauchy / Lorentzian (Linear Subtraction)</option>
                </select>
              </div>

              {/* Instrumental Resolution */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Instrumental Resolution
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setInstrumentalMode('constant')}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all ${
                        instrumentalMode === 'constant' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'
                      }`}
                    >
                      Constant
                    </button>
                    <button
                      onClick={() => setInstrumentalMode('caglioti')}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-all ${
                        instrumentalMode === 'caglioti' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'
                      }`}
                    >
                      Caglioti
                    </button>
                  </div>
                </div>

                {instrumentalMode === 'constant' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.005"
                        value={instBetaIB}
                        onChange={(e) => setInstBetaIB(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-[#0A101C] text-amber-300 border border-white/10 focus:border-amber-500/50 rounded-xl outline-none font-mono text-xs"
                        placeholder="β_inst (deg)"
                      />
                    </div>
                    <div className="flex gap-1">
                      {[0, 0.03, 0.05, 0.08, 0.12].map(v => (
                        <button
                          key={v}
                          onClick={() => setInstBetaIB(v)}
                          className={`flex-1 py-1 rounded-lg border text-[8px] font-mono font-bold ${
                            instBetaIB === v ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-black/20 border-white/5 text-slate-500'
                          }`}
                        >
                          {v === 0 ? '0° (Raw)' : `${v}°`}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block">U</span>
                      <input
                        type="number"
                        step="0.001"
                        value={cagliotiU}
                        onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-[#0A101C] text-amber-300 border border-white/10 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block">V</span>
                      <input
                        type="number"
                        step="0.001"
                        value={cagliotiV}
                        onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-[#0A101C] text-amber-300 border border-white/10 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 font-mono block">W</span>
                      <input
                        type="number"
                        step="0.001"
                        value={cagliotiW}
                        onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-[#0A101C] text-amber-300 border border-white/10 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Run Analysis Action Button */}
            <button
              onClick={handleRunFullAnalysis}
              disabled={isSimulationRunning}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl shadow-xl hover:shadow-purple-500/25 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              {isSimulationRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deconvolving (Step {simulationStep}/5)...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Execute Full IB Deconvolution
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Results & Diagnostic Dashboards (8 Cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Top Summary Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#050A14] p-5 rounded-3xl border border-purple-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Volume Size (D_v)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">{avgSize > 0 ? avgSize.toFixed(2) : '--'}</span>
              <span className="text-xs text-purple-400 font-bold">nm</span>
            </div>
            <span className="text-[9px] text-purple-400/80 font-mono mt-1 block">Volume-weighted domain</span>
          </div>

          <div className="bg-[#050A14] p-5 rounded-3xl border border-pink-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full blur-2xl" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Area Size (D_a)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-pink-400 font-mono">{avgSize > 0 ? (avgSize / 2).toFixed(2) : '--'}</span>
              <span className="text-xs text-pink-400 font-bold">nm</span>
            </div>
            <span className="text-[9px] text-pink-400/80 font-mono mt-1 block">Area-weighted (D_v / 2)</span>
          </div>

          <div className="bg-[#050A14] p-5 rounded-3xl border border-cyan-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">RMS Microstrain</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-cyan-300 font-mono">{avgRmsStrain > 0 ? (avgRmsStrain * 100).toFixed(3) : '--'}</span>
              <span className="text-xs text-cyan-300 font-bold">%</span>
            </div>
            <span className="text-[9px] text-cyan-400/80 font-mono mt-1 block">⟨ε²⟩½ Gaussian strain</span>
          </div>

          <div className="bg-[#050A14] p-5 rounded-3xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Dislocation (δ)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {avgSize > 0 ? (1 / Math.pow(avgSize * 1e-9, 2) / 1e14).toFixed(2) : '--'}
              </span>
              <span className="text-xs text-emerald-400 font-bold">×10¹⁴</span>
            </div>
            <span className="text-[9px] text-emerald-400/80 font-mono mt-1 block">lines / m² (δ = 1/D²)</span>
          </div>
        </div>

        {/* Tab Selector Ribbon */}
        <div className="bg-[#050A14] p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-1.5 shadow-xl">
          {[
            { id: 'deconvolution', label: '1. Voigt Deconvolution', icon: Sliders },
            { id: 'regression', label: '2. Multi-Reflection Models', icon: TrendingUp },
            { id: 'liveProfile', label: '3. Peak Profile & Box', icon: Eye },
            { id: 'defects', label: '4. Defect Dynamics', icon: Boxes },
            { id: 'instrumental', label: '5. Broadening Spectrum', icon: Activity },
            { id: 'math', label: '6. Mathematical Proofs', icon: BookOpen },
            { id: 'aiAdvisor', label: '7. AI Advisor Report', icon: Sparkles }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Voigt & de Keijser Single-Line Deconvolution */}
        {activeTab === 'deconvolution' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Table of Reflections */}
            <div className="bg-[#050A14] p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Single-Line Voigt Peak Deconvolution Matrix</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">de Keijser analytical separation of Cauchy size (Dv, Da) and Gaussian strain (e_rms)</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 rounded-xl border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3" /> CSV
                  </button>
                  <button
                    onClick={handleExportPython}
                    className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 rounded-xl border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <FileCode2 className="w-3 h-3" /> Python
                  </button>
                  <button
                    onClick={handleCopyJSON}
                    className="px-3 py-1.5 bg-white/5 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 rounded-xl border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    {copiedNotification ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} JSON
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">2θ (deg)</th>
                      <th className="py-2.5 px-3">HKL</th>
                      <th className="py-2.5 px-3">FWHM (°)</th>
                      <th className="py-2.5 px-3">β_Obs (°)</th>
                      <th className="py-2.5 px-3">Shape φ</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">D_v (nm)</th>
                      <th className="py-2.5 px-3">D_a (nm)</th>
                      <th className="py-2.5 px-3">RMS Strain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.map((r, idx) => {
                      const isSelected = selectedPeakIndex === idx;
                      const profileColor = r.profileType === 'Lorentzian' ? 'text-blue-400 bg-blue-500/10' : r.profileType === 'Gaussian' ? 'text-emerald-400 bg-emerald-500/10' : 'text-purple-400 bg-purple-500/10';
                      return (
                        <tr
                          key={idx}
                          onClick={() => { setSelectedPeakIndex(idx); }}
                          className={`hover:bg-purple-500/10 cursor-pointer transition-colors ${isSelected ? 'bg-purple-500/15' : ''}`}
                        >
                          <td className="py-3 px-3 font-bold text-white">{r.twoTheta.toFixed(2)}°</td>
                          <td className="py-3 px-3 text-purple-300">{r.hklString || `Peak ${idx+1}`}</td>
                          <td className="py-3 px-3 text-slate-300">{r.fwhmObs?.toFixed(3)}°</td>
                          <td className="py-3 px-3 text-slate-300">{(r.betaObsDeg || r.integralBreadthDeg).toFixed(3)}°</td>
                          <td className="py-3 px-3 text-amber-300 font-bold">{r.shapeFactorPhi.toFixed(3)}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${profileColor}`}>
                              {r.profileType || 'Pseudo-Voigt'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-pink-400">{(r.volumeWeightedSizeDvNm || r.calcSizeNm).toFixed(2)}</td>
                          <td className="py-3 px-3 text-pink-300/80">{(r.areaWeightedSizeDaNm || r.calcSizeNm/2).toFixed(2)}</td>
                          <td className="py-3 px-3 text-cyan-300">{(r.apparentRmsStrain || 0).toExponential(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shape Factor & Voigt Diagnostics Bar Chart */}
            <div className="bg-[#050A14] p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Crystallite Size & RMS Strain per Reflection</h3>
              <p className="text-[10px] text-slate-500 font-mono mb-4">Volume size Dv (bars) compared with apparent microstrain e_rms (line)</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={decoupledChartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="twoTheta" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis yAxisId="left" stroke="#ec4899" tick={{ fontSize: 10, fill: '#ec4899' }} label={{ value: 'Dv (nm)', angle: -90, position: 'insideLeft', fill: '#ec4899', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 10, fill: '#8b5cf6' }} label={{ value: 'β_Sample (°)', angle: 90, position: 'insideRight', fill: '#8b5cf6', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#050A14', borderColor: '#ec489950', borderRadius: '1rem', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <Bar yAxisId="left" dataKey="sizeNm" fill="#ec4899" radius={[8, 8, 0, 0]} name="Volume Size Dv (nm)" />
                    <Line yAxisId="right" type="monotone" dataKey="betaSample" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 4 }} name="β_Sample Broadening (°)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Multi-Reflection Size-Strain Regression Models */}
        {activeTab === 'regression' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Multi-Model Switcher & Comparison */}
            <div className="bg-[#050A14] p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Multi-Reflection Size-Strain Models</h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Select linearization model or inspect comparative goodness of fit</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'hw', label: 'Halder-Wagner (Voigt)' },
                    { id: 'ssp', label: 'Size-Strain Plot (SSP)' },
                    { id: 'udm', label: 'Uniform Deformation (UDM)' },
                    { id: 'udedm', label: 'Energy Density (UDEDM)' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMultiModelMethod(m.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        multiModelMethod === m.id
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                          : 'bg-[#0A101C] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Comparison Suite Grid */}
              {advancedResult && advancedResult.modelComparisons && advancedResult.modelComparisons.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {advancedResult.modelComparisons.map((c) => (
                    <div
                      key={c.modelName}
                      onClick={() => {
                        if (c.modelName === 'Halder-Wagner') setMultiModelMethod('hw');
                        else if (c.modelName === 'SSP') setMultiModelMethod('ssp');
                        else if (c.modelName === 'UDEDM') setMultiModelMethod('udedm');
                        else setMultiModelMethod('udm');
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        c.isBestFit
                          ? 'bg-purple-500/15 border-purple-500/60 shadow-lg shadow-purple-500/10'
                          : 'bg-[#070D18] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-xs text-white">{c.label}</span>
                        {c.isBestFit && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1 font-mono">
                            <Award className="w-2.5 h-2.5" /> Best Fit
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-3">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">Size (D)</span>
                          <span className="font-bold text-pink-400">{c.sizeNm > 0 ? `${c.sizeNm.toFixed(1)} nm` : '>200 nm'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">Strain (ε)</span>
                          <span className="font-bold text-cyan-300">{c.strainPercent.toFixed(3)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">R² Score</span>
                          <span className="font-bold text-emerald-400">{c.rSquared.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase block">RMSE</span>
                          <span className="font-bold text-amber-300">{c.rmse.toExponential(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Regression Chart */}
              {advancedResult && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={advancedResult.points.map(p => {
                        const yFit = advancedResult.regression.slope * p.x + advancedResult.regression.intercept;
                        return {
                          x: p.x,
                          y: p.y,
                          yFit,
                          twoTheta: p.twoTheta,
                          residual: p.residual || 0
                        };
                      }).sort((a, b) => a.x - b.x)}
                      margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="x" type="number" domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis dataKey="y" type="number" domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#050A14', borderColor: '#ec489950', borderRadius: '1rem', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Line dataKey="yFit" stroke="#ec4899" strokeWidth={2.5} dot={false} name="Linear Fit" />
                      <Scatter dataKey="y" fill="#a855f7" name="Experimental Reflections" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Peak Profile & Geometric Integral Breadth Box Visualizer */}
        {activeTab === 'liveProfile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#050A14] p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    Peak Profile & Geometric Integral Breadth Box
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Geometric box has Height = I_max, Width = β. The Area of the box is identically equal to the Peak Area!
                  </p>
                </div>

                {/* Reflection selector tabs */}
                <div className="flex gap-1 overflow-x-auto max-w-full pb-1">
                  {results.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPeakIndex(idx)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                        selectedPeakIndex === idx
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-[#0A101C] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {r.twoTheta.toFixed(1)}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Chart */}
              {synthesizedProfile && (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={synthesizedProfile.dataPoints} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="twoTheta" type="number" domain={['dataMin', 'dataMax']} stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°" />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#050A14', borderColor: '#ec489950', borderRadius: '1rem', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      {/* Integral Breadth Bounding Box Area */}
                      <Area type="step" dataKey="ibBoxIntensity" fill="#ec4899" fillOpacity={0.15} stroke="#ec4899" strokeWidth={1.5} name="IB Bounding Box (Area = Peak Area)" />
                      {/* Synthesized Pseudo-Voigt Intensity */}
                      <Line type="monotone" dataKey="intensity" stroke="#a855f7" strokeWidth={2.5} dot={false} name="Pseudo-Voigt Peak I(2θ)" />
                      {/* Cauchy / Lorentzian Component */}
                      <Line type="monotone" dataKey="cauchyIntensity" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Cauchy / Lorentzian" />
                      {/* Gaussian Component */}
                      <Line type="monotone" dataKey="gaussIntensity" stroke="#34d399" strokeWidth={1.5} strokeDasharray="2 2" dot={false} name="Gaussian" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Detailed Metrics Card for this Peak */}
              {currentPeakResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 font-mono text-xs">
                  <div className="p-3 bg-[#070D18] rounded-2xl border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block">Integral Breadth (β)</span>
                    <span className="font-bold text-pink-400 text-sm">{(currentPeakResult.betaObsDeg || currentPeakResult.integralBreadthDeg).toFixed(4)}°</span>
                  </div>
                  <div className="p-3 bg-[#070D18] rounded-2xl border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block">Shape Factor (φ)</span>
                    <span className="font-bold text-amber-300 text-sm">{currentPeakResult.shapeFactorPhi.toFixed(4)}</span>
                  </div>
                  <div className="p-3 bg-[#070D18] rounded-2xl border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block">Voigt Fraction (η)</span>
                    <span className="font-bold text-purple-300 text-sm">{(currentPeakResult.pseudoVoigtEta || 0.5).toFixed(3)}</span>
                  </div>
                  <div className="p-3 bg-[#070D18] rounded-2xl border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block">Volume Domain (Dv)</span>
                    <span className="font-bold text-emerald-400 text-sm">{(currentPeakResult.volumeWeightedSizeDvNm || currentPeakResult.calcSizeNm).toFixed(2)} nm</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Defect Dynamics & 3D Morphology */}
        {activeTab === 'defects' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 3D Morphology Visualizer */}
              <div className="bg-[#050A14] p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Crystallite 3D Morphology</h3>
                  <p className="text-[10px] text-slate-500 font-mono mb-4">Morphology corresponding to shape factor K = {constantK}</p>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <MorphologyVisualizer kType={selectedKType} sizeNm={avgSize || 25} />
                </div>
                <div className="text-center font-mono text-xs text-purple-300 pt-3 border-t border-white/5">
                  Mean Size: <span className="font-bold">{avgSize.toFixed(2)} nm</span> | Coherence Vol: <span className="font-bold">{((Math.PI/6)*Math.pow(avgSize,3)).toFixed(1)} nm³</span>
                </div>
              </div>

              {/* Specific Surface Area vs Particle Size */}
              <div className="bg-[#050A14] p-6 rounded-3xl border border-slate-800 shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Specific Surface Area (SSA)</h3>
                  <p className="text-[10px] text-slate-500 font-mono mb-4">SSA (m²/g) and Dislocation Density (δ) distribution</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={defectDynamicsData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="twoTheta" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'SSA (m²/g)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#050A14', borderColor: '#ec489950', borderRadius: '1rem', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Bar dataKey="ssa" fill="#38bdf8" radius={[8, 8, 0, 0]} name="SSA (m²/g)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center font-mono text-xs text-cyan-300 pt-3 border-t border-white/5">
                  Theoretical Bulk Density: <span className="font-bold">{materialDensity} g/cm³</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Instrumental Broadening Spectrum */}
        {activeTab === 'instrumental' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#050A14] p-6 rounded-3xl border border-slate-800 shadow-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Observed vs Instrumental vs Sample Broadening</h3>
              <p className="text-[10px] text-slate-500 font-mono mb-4">Decoupling contribution of diffractometer optics across the 2θ diffraction range</p>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={decoupledChartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="twoTheta" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} label={{ value: 'Breadth (°)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#050A14', borderColor: '#ec489950', borderRadius: '1rem', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="betaObs" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} name="β_Observed (°)" />
                    <Area type="monotone" dataKey="betaInst" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} name="β_Instrumental (°)" />
                    <Area type="monotone" dataKey="betaSample" stackId="3" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} name="β_Sample Specimen (°)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Mathematical Foundations & LaTeX Step-by-Step Derivations */}
        {activeTab === 'math' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#050A14] p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
              <h3 className="text-base font-black text-white uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Crystallographic Mathematical Foundations of Integral Breadth
              </h3>

              <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
                {/* 1. Definition */}
                <div className="p-5 bg-[#070D18] rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-2 text-sm text-purple-300">1. Definition of Integral Breadth (β)</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    The Integral Breadth ($\beta$) is defined as the area under the diffraction peak divided by the maximum peak intensity:
                  </p>
                  <div 
                    className="p-3 bg-black/40 rounded-xl overflow-x-auto text-center"
                    dangerouslySetInnerHTML={{ 
                      __html: katex.renderToString("\\beta = \\frac{\\int_{-\\infty}^{+\\infty} I(2\\theta) \\, d(2\\theta)}{I_{\\max}}", { throwOnError: false }) 
                    }}
                  />
                  <p className="text-[11px] text-slate-500 mt-2">
                    Unlike FWHM (which only measures width at 50% height), Integral Breadth accounts for the entire profile shape and peak tails.
                  </p>
                </div>

                {/* 2. Shape Factor */}
                <div className="p-5 bg-[#070D18] rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-2 text-sm text-purple-300">2. Profile Shape Factor (φ) & Pseudo-Voigt Fraction (η)</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    The dimensionless shape factor φ = FWHM / β dictates the analytical distribution:
                  </p>
                  <div 
                    className="p-3 bg-black/40 rounded-xl overflow-x-auto text-center"
                    dangerouslySetInnerHTML={{ 
                      __html: katex.renderToString("\\phi_{\\text{Cauchy}} = \\frac{2}{\\pi} \\approx 0.6366 \\quad \\le \\quad \\phi \\quad \\le \\quad \\phi_{\\text{Gauss}} = 2\\sqrt{\\frac{\\ln 2}{\\pi}} \\approx 0.9394", { throwOnError: false }) 
                    }}
                  />
                  <p className="text-[11px] text-slate-500 mt-2">
                    The Lorentzian fraction η in the Pseudo-Voigt model is computed as: η = (0.9394 - φ) / (0.9394 - 0.6366).
                  </p>
                </div>

                {/* 3. de Keijser Voigt Method */}
                <div className="p-5 bg-[#070D18] rounded-2xl border border-white/5">
                  <h4 className="font-bold text-white mb-2 text-sm text-purple-300">3. de Keijser Single-Line Voigt Equations</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Using de Keijser polynomial approximations, the Cauchy ($\beta_L$) and Gaussian ($\beta_G$) breadths are separated without multi-reflection Fourier transform:
                  </p>
                  <div 
                    className="p-3 bg-black/40 rounded-xl overflow-x-auto text-center space-y-2"
                    dangerouslySetInnerHTML={{ 
                      __html: katex.renderToString("\\begin{aligned} \\beta_L &= \\beta \\cdot (0.0146 + 0.99395\\eta - 0.0083\\eta^2) \\\\ \\beta_G &= \\beta \\cdot (1.0016 - 0.52115\\eta - 0.47885\\eta^2) \\\\ D_V &= \\frac{K\\lambda}{\\beta_{L,\\text{sample}} \\cos\\theta}, \\quad \\langle\\varepsilon^2\\rangle^{1/2} = \\frac{\\beta_{G,\\text{sample}}}{2\\sqrt{2\\pi}\\tan\\theta} \\end{aligned}", { throwOnError: false }) 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AI Advisor Report */}
        {activeTab === 'aiAdvisor' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#050A14] p-8 rounded-3xl border border-purple-500/30 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Gemini Crystallography Line Profile Advisor
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Generate an academic evaluation of domain sizing, Voigt deconvolution, and microstrain
                  </p>
                </div>
                <button
                  onClick={handleGenerateAiReport}
                  disabled={isAiLoading || results.length === 0}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate AI Analysis
                </button>
              </div>

              {aiReport ? (
                <div className="p-6 bg-[#070D18] rounded-2xl border border-white/5 prose prose-invert max-w-none text-sm leading-relaxed text-slate-200">
                  <div dangerouslySetInnerHTML={{ __html: aiReport.replace(/\n/g, '<br/>') }} />
                </div>
              ) : (
                <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-[#070D18]/50">
                  <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3 opacity-60 animate-pulse" />
                  <p className="text-sm font-bold text-slate-300 mb-1">No AI Report Generated Yet</p>
                  <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                    Click "Generate AI Analysis" to produce a full crystallographic breakdown of your Integral Breadth data.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
