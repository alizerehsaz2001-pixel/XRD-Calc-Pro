import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseIBAdvancedInput, calculateIBAdvanced, calculateIntegralBreadth, synthesizeIBPeakProfile, XRAY_WAVELENGTHS } from '../utils/physics';
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
import { IBAdvancedPeakDataManager } from './integral_breadth/IBAdvancedPeakDataManager';

const MATERIAL_PRESETS = [
  { 
    label: 'Silicon (Si) NIST 640', 
    data: "28.44, 147.4, 1200, 1 1 1\n47.30, 146.3, 1100, 2 2 0\n56.12, 139.0, 1000, 3 1 1\n69.13, 134.4, 900, 4 0 0\n76.38, 132.8, 850, 3 3 1",
    desc: 'SRM 640f Reference (Dv ≈ 142 nm, ε ≈ 0.015%)',
    youngsModulus: 130,
    density: 2.33,
    burgersVectorNm: 0.384
  },
  { 
    label: 'Cerium Oxide (CeO2)', 
    data: "28.55, 442.2, 1200, 1 1 1\n33.08, 423.2, 1100, 2 0 0\n47.48, 442.4, 1000, 2 2 0\n56.33, 459.3, 950, 3 1 1\n59.08, 447.7, 900, 2 2 2",
    desc: 'Nanocrystalline Ceria (Dv ≈ 38.5 nm, ε ≈ 0.140%)',
    youngsModulus: 220,
    density: 7.22,
    burgersVectorNm: 0.383
  },
  { 
    label: 'Titanium Dioxide (Anatase)', 
    data: "25.28, 597.0, 1150, 1 0 1\n37.80, 592.6, 1020, 0 0 4\n48.05, 626.8, 980, 2 0 0\n53.89, 622.7, 920, 1 0 5\n55.06, 609.5, 890, 2 1 1\n62.69, 621.8, 840, 2 0 4",
    desc: 'Tetragonal Anatase (Dv ≈ 24.2 nm, ε ≈ 0.185%)',
    youngsModulus: 178,
    density: 3.89,
    burgersVectorNm: 0.378
  },
  { 
    label: 'Zinc Oxide (ZnO)', 
    data: "31.77, 387.1, 1200, 1 0 0\n34.42, 380.3, 1150, 0 0 2\n36.25, 420.5, 1250, 1 0 1\n47.54, 392.9, 1050, 1 0 2\n56.60, 400.7, 980, 1 1 0\n62.86, 405.2, 930, 1 0 3",
    desc: 'Wurtzite Nanorods (Dv ≈ 46.5 nm, ε ≈ 0.115%)',
    youngsModulus: 140,
    density: 5.61,
    burgersVectorNm: 0.325
  },
  { 
    label: 'Aluminum (Al)', 
    data: "38.47, 244.2, 1100, 1 1 1\n44.72, 245.8, 1050, 2 0 0\n65.10, 279.6, 1000, 2 2 0\n78.23, 301.2, 950, 3 1 1",
    desc: 'Annealed FCC Powder (Dv ≈ 78.0 nm, ε ≈ 0.065%)',
    youngsModulus: 70,
    density: 2.70,
    burgersVectorNm: 0.286
  },
  { 
    label: 'Iron (Fe) Nanopowder', 
    data: "44.67, 829.1, 900, 1 1 0\n65.02, 970.9, 850, 2 0 0\n82.33, 1113.9, 800, 2 1 1",
    desc: 'Ball-Milled BCC Fe (Dv ≈ 16.8 nm, ε ≈ 0.320%)',
    youngsModulus: 211,
    density: 7.87,
    burgersVectorNm: 0.248
  },
  { 
    label: 'Stainless Steel 316L', 
    data: "43.60, 451.9, 1000, 1 1 1\n50.80, 474.2, 950, 2 0 0\n74.70, 588.2, 850, 2 2 0\n90.70, 690.0, 800, 3 1 1\n95.90, 698.8, 750, 2 2 2",
    desc: 'Cold-Rolled Austenitic SS (Dv ≈ 54.0 nm, ε ≈ 0.245%)',
    youngsModulus: 193,
    density: 7.98,
    burgersVectorNm: 0.254
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

export interface IntegralBreadthAdvancedModuleProps {
  initialViewMode?: 'fit' | 'voigtProfile' | 'modelMatrix';
}

export const IntegralBreadthAdvancedModule: React.FC<IntegralBreadthAdvancedModuleProps> = ({
  initialViewMode = 'fit'
}) => {
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

  // Visualizer tab (includes merged Single-Line Voigt & Shape Factor φ Inspector from IntegralBreadthModule)
  const [activeChartTab, setActiveChartTab] = useState<
    'fit' | 'voigtProfile' | 'residuals' | 'apparentSizes' | 'elasticState' | 'modelMatrix' | 'advisor'
  >(initialViewMode);

  // Single-Line Voigt & Shape Factor φ Inspector state
  const [selectedVoigtPeakIdx, setSelectedVoigtPeakIdx] = useState<number>(0);
  const [voigtShapePhi, setVoigtShapePhi] = useState<number>(0.76);

  // IB Adv Config section filter & calibration parameters
  const [configSection, setConfigSection] = useState<'all' | 'source' | 'optics' | 'models' | 'continuum'>('all');
  const [burgersVectorNm, setBurgersVectorNm] = useState<number>(0.384);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  useEffect(() => {
    setActiveChartTab(initialViewMode);
  }, [initialViewMode]);

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
    setBurgersVectorNm(0.384);
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

  // Auto-prune reflections with high studentized residual |t_i| > 1.8
  const handleAutoPruneOutliers = () => {
    if (!result?.pointsExtended || result.pointsExtended.length < 3) return;
    const nextExcluded: number[] = [];
    result.pointsExtended.forEach((pt, idx) => {
      if (pt.isExcluded || Math.abs(pt.studentizedResidual || 0) > 1.8) {
        nextExcluded.push(idx);
      }
    });
    if (result.pointsExtended.length - nextExcluded.length >= 2) {
      setExcludedIndices(nextExcluded);
      setTransferNotice(`Auto-pruned ${nextExcluded.length} outlier reflection(s) (|t_i| > 1.8)`);
      setTimeout(() => setTransferNotice(null), 3500);
    }
  };

  // Import active reflections from Scherrer Studio or Williamson-Hall session
  const handleImportFromScherrerOrWH = () => {
    try {
      const raw = localStorage.getItem('xrd_wh_transfer_payload') || localStorage.getItem('xrd_scherrer_current');
      if (!raw) {
        setTransferNotice('No active Scherrer or W-H dataset found in session.');
        setTimeout(() => setTransferNotice(null), 3500);
        return;
      }
      const parsed = JSON.parse(raw);
      const phiConvert = Math.max(0.64, Math.min(0.94, voigtShapePhi));
      let convertedLines: string[] = [];

      if (Array.isArray(parsed.results) && parsed.results.length > 0) {
        convertedLines = parsed.results
          .filter((r: any) => !r.excluded && r.twoTheta > 0 && r.fwhmObs > 0)
          .map((r: any) => {
            const iMax = r.intensity && r.intensity > 0 ? Math.round(r.intensity * 10) : 1000;
            const betaDeg = Number(r.fwhmObs) / phiConvert;
            const area = betaDeg * iMax;
            const hklStr = Array.isArray(r.hkl) && r.hkl.length === 3 ? `, ${r.hkl.join(' ')}` : '';
            return `${Number(r.twoTheta).toFixed(2)}, ${area.toFixed(1)}, ${iMax}${hklStr}`;
          });
      } else if (typeof parsed.inputData === 'string' && parsed.inputData.trim()) {
        const lines = parsed.inputData.split('\n').map((l: string) => l.trim()).filter(Boolean);
        convertedLines = lines
          .filter((l: string) => !l.startsWith('!') && !l.startsWith('#'))
          .map((l: string) => {
            const nums = l.split(/[\s,]+/).map(Number).filter((n: number) => !isNaN(n));
            if (nums.length < 2) return '';
            const tt = nums[0];
            const fwhm = nums[1];
            const iMax = nums.length >= 6 ? Math.round((nums[2] || 100) * 10) : 1000;
            const betaDeg = fwhm / phiConvert;
            const area = betaDeg * iMax;
            const hklPart =
              nums.length >= 6
                ? `, ${nums[3]} ${nums[4]} ${nums[5]}`
                : nums.length === 5
                ? `, ${nums[2]} ${nums[3]} ${nums[4]}`
                : '';
            return `${tt.toFixed(2)}, ${area.toFixed(1)}, ${iMax}${hklPart}`;
          })
          .filter(Boolean);
      }

      if (convertedLines.length >= 2) {
        setInputData(convertedLines.join('\n'));
        if (parsed.wavelength) setWavelength(Number(parsed.wavelength));
        if (parsed.materialDensity) setMaterialDensityGcm3(Number(parsed.materialDensity));
        if (parsed.burgersVectorNm) setBurgersVectorNm(Number(parsed.burgersVectorNm));
        setSelectedMaterial(parsed.selectedMaterial ? `${parsed.selectedMaterial} (Synced)` : 'Synced Dataset');
        setExcludedIndices([]);
        setTransferNotice(`Synced ${convertedLines.length} peaks via Voigt φ = ${phiConvert.toFixed(2)}`);
        setTimeout(() => setTransferNotice(null), 4000);
      } else {
        setTransferNotice('Requires at least 2 valid reflections to import.');
        setTimeout(() => setTransferNotice(null), 3500);
      }
    } catch {
      setTransferNotice('Unable to parse session dataset.');
      setTimeout(() => setTransferNotice(null), 3500);
    }
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
      currentExclusions,
      burgersVectorNm > 0 ? burgersVectorNm : 0.286
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
    burgersVectorNm,
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
        // Ensure synthesized reflections obey a physically consistent positive size intercept & microstrain slope
        const sortedPeaks = [...data.data].sort((a: any, b: any) => Number(a.twoTheta) - Number(b.twoTheta));
        const firstP = sortedPeaks[0];
        const firstBetaDeg = firstP.area && firstP.iMax ? Number(firstP.area) / Number(firstP.iMax) : 0.35;
        const targetDvNm = Math.max(12, Math.min(180, (constantK * (wavelength / 10)) / (Math.max(0.08, firstBetaDeg - instBetaIB) * (Math.PI / 180) * Math.cos((Number(firstP.twoTheta) / 2) * (Math.PI / 180)))));
        const targetStrain = 0.0012; // 0.12% baseline microstrain

        const formattedData = sortedPeaks.map((p: any, idx: number) => {
          const tt = Number(p.twoTheta);
          const thetaRad = (tt / 2) * (Math.PI / 180);
          const iMax = p.iMax && Number(p.iMax) > 0 ? Math.round(Number(p.iMax)) : Math.max(600, 1200 - idx * 80);
          const betaSampleRad = (constantK * (wavelength / 10)) / (targetDvNm * Math.max(0.1, Math.cos(thetaRad))) + 4 * targetStrain * Math.tan(thetaRad);
          const betaObsDeg = betaSampleRad * (180 / Math.PI) + instBetaIB;
          const areaCalibrated = betaObsDeg * iMax;
          const hklStr = p.hkl && Array.isArray(p.hkl) ? `, ${p.hkl.join(' ')}` : '';
          return `${tt.toFixed(2)}, ${areaCalibrated.toFixed(1)}, ${iMax}${hklStr}`;
        }).join('\n');
        setInputData(formattedData);
        setSelectedMaterial(`Synthesized: ${searchQuery}`);
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
    const sizeErrStr = result.sizeErrorNm ? ` ± ${result.sizeErrorNm.toFixed(2)}` : '';
    const strainErrStr = result.strainErrorPercent ? ` ± ${result.strainErrorPercent.toFixed(4)}` : '';
    const stressErrStr = result.stressErrorMPa ? ` ± ${result.stressErrorMPa.toFixed(2)}` : '';
    const energyErrStr = result.energyErrorKjM3 ? ` ± ${result.energyErrorKjM3.toFixed(3)}` : '';
    const summary = `Crystallite Size and Lattice Microstrain Analysis (Integral Breadth Method)
================================================================================
Material / Sample: ${selectedMaterial}
Radiation Wavelength: ${wavelength} Å (Shape Factor K = ${constantK})
Instrumental Mode: ${instrumentalMode === 'constant' ? `Constant β_inst = ${instBetaIB}°` : `Caglioti Curve (U=${cagliotiU}, V=${cagliotiV}, W=${cagliotiW})`}
Decoupling Mode: ${decouplingMethod.toUpperCase()}
Separation Model: ${separationMethod.toUpperCase()}
--------------------------------------------------------------------------------
Volume-Weighted Size (D_v): ${result.sizeInterceptNm > 0 ? `${result.sizeInterceptNm.toFixed(2)}${sizeErrStr} nm` : 'Bulk Limit (>1000 nm)'}
Area-Weighted Size (D_a): ${result.areaWeightedSizeNm ? `${result.areaWeightedSizeNm.toFixed(2)} nm` : 'N/A'} (Dv/Da = ${result.polydispersityRatioDvDa?.toFixed(3) || '1.56'})
Spherical Equivalent Diameter ⟨D_sph⟩: ${result.meanSphericalDiameterNm ? `${result.meanSphericalDiameterNm.toFixed(2)} nm` : 'N/A'} (Log-Normal σ_g = ${result.logNormalSigmaG?.toFixed(3) || '1.35'})
Apparent Microstrain (ε): ${(result.strainPercent / 100 * 1000).toFixed(3)} × 10⁻³ (${result.strainPercent.toFixed(4)}${strainErrStr} %)
Stokes-Wilson RMS Strain ⟨ε²⟩½: ${result.rmsStrainPercent !== undefined ? `${result.rmsStrainPercent.toFixed(4)} %` : 'N/A'}
Young's Modulus (E_0): ${youngsModulusGPa} GPa (Anisotropic E_hkl applied in USDM/UDEDM)
Lattice Stress (σ): ${result.stressMPa !== undefined ? `${result.stressMPa.toFixed(2)}${stressErrStr} MPa` : 'N/A'}
Strain Energy Density (u): ${result.energyDensityKjM3 !== undefined ? `${result.energyDensityKjM3.toFixed(3)}${energyErrStr} kJ/m³` : 'N/A'}
Dislocation Density (Williamson-Smallman ρ_WS): ${result.dislocationDensity10_14 !== undefined ? `${result.dislocationDensity10_14.toFixed(3)} × 10¹⁴ m⁻²` : 'N/A'} (b = ${burgersVectorNm} nm)
Specific Surface Area (SSA): ${result.specificSurfaceAreaM2g !== undefined ? `${result.specificSurfaceAreaM2g.toFixed(2)} m²/g` : 'N/A'} (Density = ${materialDensityGcm3} g/cm³)
--------------------------------------------------------------------------------
Goodness of Fit & Regression Statistics:
  R² = ${result.regression.rSquared.toFixed(5)}
  Adjusted R² = ${result.regression.adjustedRSquared?.toFixed(5) || 'N/A'}
  F-Statistic = ${result.regression.fStatistic?.toFixed(2) || 'N/A'} (t_0.975 = ${result.regression.tCritical95?.toFixed(3) || 'N/A'})
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

  // Prepare chart data with exact Student-t 95% confidence band and inclusion/exclusion status
  const chartData = useMemo(() => {
    if (!result) return [];
    const fallbackBound = (result.regression.rmse || 0) * (result.regression.tCritical95 || 2.0);

    return (result.pointsExtended || []).map((pe, idx) => {
      const fitY = result.regression.slope * pe.x + result.regression.intercept;
      const ciHalf = pe.ci95HalfWidth !== undefined && pe.ci95HalfWidth > 0 ? pe.ci95HalfWidth : fallbackBound;
      return {
        originalIndex: idx,
        x: pe.x,
        y: pe.y,
        fit: fitY,
        fitRange: [Math.max(0, fitY - ciHalf), fitY + ciHalf],
        residual: pe.residual !== undefined ? pe.residual : pe.y - fitY,
        studentizedResidual: pe.studentizedResidual || 0,
        eHklGPa: pe.eHklGPa,
        contrastFactorC: pe.contrastFactorC,
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
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Apparent Size</span> <span className="text-emerald-300 font-bold">{d.singleSize > 0 ? `${d.singleSize.toFixed(1)} nm` : 'Bulk'}</span></p>
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
        return "\\left(d_{hkl} \\beta \\cos\\theta\\right)^2 = \\frac{K\\lambda}{D} \\left(d_{hkl}^2 \\beta \\cos\\theta\\right) + (2\\varepsilon\\lambda)^2";
      case 'udedm':
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + 4 \\sin\\theta \\sqrt{\\frac{2u}{E_{hkl}}}";
      case 'usdm':
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + \\frac{4\\sigma}{E_{hkl}} \\sin\\theta";
      case 'mwh':
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + 4\\varepsilon \\sin\\theta \\sqrt{\\frac{\\bar{C}_{hkl}}{\\bar{C}_0}}";
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
        return "\\beta_{\\text{sample}} = \\sqrt{\\beta_{\\text{obs}}^2 - \\beta_{\\text{inst}}^2} \\quad \\text{(Gaussian)}";
      case 'hw_voigt':
        return "\\beta_{\\text{sample}} = \\beta_{\\text{obs}} \\left[1 - \\left(\\frac{\\beta_{\\text{inst}}}{\\beta_{\\text{obs}}}\\right)^2\\right] \\quad \\text{(Halder-Wagner Parabolic Voigt)}";
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

# Active reflections: [2theta (deg), beta_obs (deg), E_hkl (GPa), C_hkl]
raw_data = np.array([
${(result?.pointsExtended || []).filter(p => !p.isExcluded).map(p => `    [${p.twoTheta.toFixed(4)}, ${p.betaObsDeg.toFixed(6)}, ${(p.eHklGPa || youngsModulusGPa).toFixed(3)}, ${(p.contrastFactorC || 0.16).toFixed(4)}]`).join(',\n')}
])

two_theta = raw_data[:, 0]
beta_obs_deg = raw_data[:, 1]
e_hkl_GPa = raw_data[:, 2]
c_hkl = raw_data[:, 3]

# Instrumental deconvolution
beta_obs_rad = np.radians(beta_obs_deg)
beta_inst_rad = np.radians(inst_beta)

${decouplingMethod === 'squared' 
  ? 'beta_sample_rad = np.sqrt(np.maximum(0.0, beta_obs_rad**2 - beta_inst_rad**2))'
  : decouplingMethod === 'hw_voigt'
  ? '# True Halder-Wagner (1966) parabolic Voigt subtraction: beta_s = beta_obs * (1 - (beta_inst/beta_obs)^2)\nbeta_sample_rad = beta_obs_rad * np.maximum(1e-6, 1.0 - (beta_inst_rad / beta_obs_rad)**2)'
  : decouplingMethod === 'none'
  ? 'beta_sample_rad = beta_obs_rad'
  : 'beta_sample_rad = np.maximum(0.0, beta_obs_rad - beta_inst_rad)'}

theta_rad = np.radians(two_theta / 2.0)
cos_t = np.cos(theta_rad)
sin_t = np.sin(theta_rad)
tan_t = np.tan(theta_rad)

# Coordinate transformation for ${separationMethod.toUpperCase()}
${separationMethod === 'hw'
  ? 'x = beta_sample_rad / (tan_t * sin_t)\ny = (beta_sample_rad / tan_t)**2'
  : separationMethod === 'ssp'
  ? 'd_spacing = wavelength / (2.0 * sin_t)\nx = (d_spacing**2) * beta_sample_rad * cos_t\ny = (d_spacing * beta_sample_rad * cos_t)**2'
  : separationMethod === 'udedm'
  ? 'E_hkl_Pa = e_hkl_GPa * 1e9\nx = 4.0 * sin_t * np.sqrt(2.0 / E_hkl_Pa)\ny = beta_sample_rad * cos_t'
  : separationMethod === 'usdm'
  ? 'E_hkl_Pa = e_hkl_GPa * 1e9\nx = 4.0 * sin_t / E_hkl_Pa\ny = beta_sample_rad * cos_t'
  : separationMethod === 'mwh'
  ? 'x = 4.0 * sin_t * np.sqrt(c_hkl / 0.16)\ny = beta_sample_rad * cos_t'
  : 'x = 4.0 * sin_t\ny = beta_sample_rad * cos_t'}

# Linear Regression & Student-t 95% Confidence Intervals
res = stats.linregress(x, y)
slope, intercept, r_val, p_val, se_slope = res.slope, res.intercept, res.rvalue, res.pvalue, res.stderr
se_intercept = res.intercept_stderr
r_squared = r_val**2

# Derive Physical Parameters & Propagated Uncertainties
${separationMethod === 'hw'
  ? 'D_nm = (K * wavelength) / slope / 10.0 if slope > 0 else 0\nD_err_nm = D_nm * (se_slope / slope) if slope > 0 else 0\nstrain = np.sqrt(max(0.0, intercept)) / 4.0'
  : separationMethod === 'ssp'
  ? '# Exact SSP relation: 2*d*sin(theta) = lambda => Intercept = (2*epsilon*lambda)^2\nD_nm = (K * wavelength) / slope / 10.0 if slope > 0 else 0\nD_err_nm = D_nm * (se_slope / slope) if slope > 0 else 0\nstrain = np.sqrt(max(0.0, intercept)) / (2.0 * wavelength)'
  : separationMethod === 'udedm'
  ? 'D_nm = (K * wavelength) / intercept / 10.0 if intercept > 0 else 0\nD_err_nm = D_nm * (se_intercept / intercept) if intercept > 0 else 0\nu_density_J_m3 = max(0.0, slope)**2\nstrain = np.sqrt((2.0 * u_density_J_m3) / (youngs_modulus_GPa * 1e9))'
  : separationMethod === 'usdm'
  ? 'D_nm = (K * wavelength) / intercept / 10.0 if intercept > 0 else 0\nD_err_nm = D_nm * (se_intercept / intercept) if intercept > 0 else 0\nstress_MPa = max(0.0, slope) / 1e6\nstrain = max(0.0, slope) / (youngs_modulus_GPa * 1e9)'
  : 'D_nm = (K * wavelength) / intercept / 10.0 if intercept > 0 else 0\nD_err_nm = D_nm * (se_intercept / intercept) if intercept > 0 else 0\nstrain = max(0.0, slope)'}

print("==================================================")
print(f"Integral Breadth ${separationMethod.toUpperCase()} Regression")
print(f"R-squared: {r_squared:.5f}")
print(f"Volume-Weighted Crystallite Size (D_v): {D_nm:.2f} +/- {D_err_nm:.2f} nm")
print(f"Lattice Microstrain (epsilon): {strain * 1000:.3f} x 10^-3 ({strain * 100:.4f} %)")
print("==================================================")

# Plot with 95% Student-t Confidence Band
plt.figure(figsize=(7, 5), dpi=120)
plt.scatter(x, y, color='crimson', label='Reflections (IB)', zorder=3)
x_fit = np.linspace(np.min(x), np.max(x), 100)
y_fit = slope * x_fit + intercept
plt.plot(x_fit, y_fit, 'b--', label=f'Fit (R^2={r_squared:.4f})')
plt.title('Integral Breadth Advanced Analysis (${separationMethod.toUpperCase()})')
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend()
plt.tight_layout()
plt.show()
`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Unified Integral Breadth Mode Switcher Bar (Merged Single-Line Voigt + Multi-Reflection Regression Suite) */}
      <div className="lg:col-span-12 bg-[#050A14] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Unified Integral Breadth (β = A/I_max) & Voigt Deconvolution Suite
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-pink-500/15 border border-pink-500/30 text-[9px] font-mono font-bold text-pink-300 uppercase">
                Merged Single + Multi-Line Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Compare 6 Multi-Reflection Regression Models (UDM, USDM, UDEDM, SSP, Halder-Wagner, mWH) alongside Single-Line de Keijser Voigt & Langford Shape Factor φ analysis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full xl:w-auto">
          {[
            {
              id: 'fit',
              title: 'Multi-Reflection IB Regression',
              sub: 'UDM · USDM · UDEDM · SSP · H-W · mWH',
              badge: `${separationMethod.toUpperCase()}`,
              activeTabs: ['fit', 'residuals', 'apparentSizes', 'elasticState', 'advisor']
            },
            {
              id: 'voigtProfile',
              title: 'Single-Line Voigt & Shape φ',
              sub: 'β_IB Box · Langford φ · de Keijser (D_L, ε_G)',
              badge: `φ = ${voigtShapePhi.toFixed(2)}`,
              activeTabs: ['voigtProfile']
            },
            {
              id: 'modelMatrix',
              title: '6-Model Comparative Matrix',
              sub: 'Side-by-Side D_v, ε, σ, R², RMSE',
              badge: 'All 6 Models',
              activeTabs: ['modelMatrix']
            }
          ].map(mode => {
            const isSelected = mode.activeTabs.includes(activeChartTab);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveChartTab(mode.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-pink-500/15 border-pink-500/50 text-white shadow-lg'
                    : 'bg-slate-950/70 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider truncate">
                    {mode.title}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold shrink-0 ${
                    isSelected ? 'bg-black/40 text-pink-300 border border-white/10' : 'bg-slate-900 text-slate-500'
                  }`}>
                    {mode.badge}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 truncate">
                  {mode.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Column — Upgraded IB Adv Config Scientific Instrumentation Console */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-[#050A14] p-5 sm:p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
          {/* Measured Scrim & Background */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-15 mix-blend-screen">
            <img src={voigtBg} alt="Voigt Configuration" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/85 to-[#050A14]/40" />
          </div>

          {/* Console Header */}
          <div className="flex justify-between items-start gap-3 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#070D18] rounded-xl border border-pink-500/30 text-pink-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-wider uppercase">
                  IB Adv Config
                </h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Integral Breadth Calibration &amp; 6-Model Solver
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleImportFromScherrerOrWH}
                className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1.5 rounded-lg border border-cyan-500/30 transition-colors cursor-pointer"
                title="Import active peak list from Scherrer Studio or Williamson-Hall using β_IB = FWHM / φ"
              >
                Sync Peaks
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-pink-300 bg-white/5 hover:bg-pink-500/10 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-pink-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset all settings to default"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Transfer / Auto-Prune Status Banner */}
          {transferNotice && (
            <div className="mb-4 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 flex items-center justify-between relative z-10">
              <span>● {transferNotice}</span>
              <button
                type="button"
                onClick={() => setTransferNotice(null)}
                className="text-slate-400 hover:text-white ml-2"
              >
                ×
              </button>
            </div>
          )}

          {/* Live Calibration Diagnostics Telemetry Strip (Following 8_science_space_biotech.md) */}
          {(() => {
            const pts = result?.pointsExtended || [];
            const activePts = pts.filter(p => !p.isExcluded);
            const meanRatio =
              activePts.length > 0
                ? activePts.reduce((acc, p) => acc + p.betaObsDeg / Math.max(1e-4, p.betaInstDeg), 0) / activePts.length
                : 0;
            const bestModel = (result?.modelComparisons || []).find(m => m.isBestFit);
            const highResOutliers = activePts.filter(p => Math.abs(p.studentizedResidual || 0) > 1.8).length;

            return (
              <div className="mb-4 p-3 rounded-2xl bg-[#070D18] border border-slate-800/90 grid grid-cols-3 gap-2 font-mono tabular-nums relative z-10">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block">Active Peaks</span>
                  <span className="text-xs font-bold text-white">
                    {activePts.length} / {pts.length}
                  </span>
                  <span className="text-[8px] text-slate-400 block truncate">
                    {excludedIndices.length > 0 ? `${excludedIndices.length} excluded` : '● All included'}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block">β_obs / β_inst</span>
                  <span className={`text-xs font-bold ${meanRatio >= 2.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {meanRatio > 0 ? `${meanRatio.toFixed(1)}×` : '—'}
                  </span>
                  <span className={`text-[8px] block truncate ${meanRatio >= 2.0 ? 'text-emerald-400/90' : 'text-amber-400/90'}`}>
                    {meanRatio >= 2.0 ? '● Nominal Signal' : '▲ Near Inst Floor'}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 uppercase block">Best Model Fit</span>
                  <span className="text-xs font-bold text-pink-300">
                    {bestModel ? bestModel.modelName : separationMethod.toUpperCase()}
                  </span>
                  <span className="text-[8px] text-slate-400 block truncate">
                    {bestModel ? `R² = ${bestModel.rSquared.toFixed(4)}` : highResOutliers > 0 ? `${highResOutliers} outlier(s)` : 'Ready'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 4-Stage Configuration Section Filter Bar */}
          <div className="mb-5 grid grid-cols-5 gap-1 p-1 bg-[#070D18] rounded-xl border border-slate-800/90 relative z-10">
            {[
              { id: 'all', label: 'All' },
              { id: 'source', label: '1. Source' },
              { id: 'optics', label: '2. Optics' },
              { id: 'models', label: '3. Solver' },
              { id: 'continuum', label: '4. Elastic' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setConfigSection(tab.id as any)}
                className={`py-1.5 px-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-tight transition-colors cursor-pointer whitespace-nowrap truncate ${
                  configSection === tab.id
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-5 relative z-10">
            {/* STAGE 1: Reference Standard Preset & X-Ray Source */}
            {(configSection === 'all' || configSection === 'source') && (
              <div className="bg-[#070D18] p-4 rounded-2xl border border-slate-800/90 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-pink-400" />
                    01. Reference Standard &amp; X-Ray Source
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                    {(12.3984 / Math.max(0.1, wavelength)).toFixed(2)} keV
                  </span>
                </div>

                {/* Calibrated Reference Material Selector */}
                <div ref={matMenuRef} className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-300">
                      Calibrated Reference Material
                    </label>
                    <span className="text-[9px] font-mono text-emerald-400 tabular-nums">
                      E={youngsModulusGPa} GPa · ρ={materialDensityGcm3} g/cm³
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                    className="w-full px-3.5 py-2.5 bg-[#0A101C] hover:bg-[#0D1525] border border-slate-700/80 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{selectedMaterial}</div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">
                        {MATERIAL_PRESETS.find(m => m.label === selectedMaterial)?.desc || 'Custom reflection dataset'}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isMaterialMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isMaterialMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full mt-1.5 left-0 right-0 bg-[#070D18] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1 max-h-64 overflow-y-auto custom-scrollbar"
                      >
                        {MATERIAL_PRESETS.map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setSelectedMaterial(preset.label);
                              setInputData(preset.data);
                              if (preset.youngsModulus) setYoungsModulusGPa(preset.youngsModulus);
                              if (preset.density) setMaterialDensityGcm3(preset.density);
                              if ((preset as any).burgersVectorNm) setBurgersVectorNm((preset as any).burgersVectorNm);
                              setExcludedIndices([]);
                              setAdvisorReport(null);
                              setIsMaterialMenuOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 hover:bg-pink-500/10 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                              selectedMaterial === preset.label ? 'bg-pink-500/15' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{preset.label}</div>
                              <div className="text-[9px] font-mono text-slate-400 truncate">{preset.desc}</div>
                            </div>
                            <span className="text-[9px] font-mono text-pink-300 shrink-0 tabular-nums">
                              {preset.youngsModulus} GPa
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* AI Smart Synthesis Input (Clean, Zero Pseudo-Terminal Prefix) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1.5">
                    Synthesize Phase Profile by Formula or Mineral Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. CeO2 Fluorite, BaTiO3, Fe3O4 Spinel"
                      className="flex-1 px-3 py-2 bg-[#0A101C] text-white border border-slate-700/80 focus:border-pink-500/60 rounded-xl outline-none text-xs font-mono placeholder:text-slate-600"
                      onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                    />
                    <button
                      type="button"
                      onClick={handleSmartLoad}
                      disabled={isThinking || !searchQuery.trim()}
                      className="px-3.5 py-2 bg-pink-500/15 hover:bg-pink-500/25 disabled:opacity-40 text-pink-300 font-mono text-xs font-bold rounded-xl border border-pink-500/30 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Generate</span>
                    </button>
                  </div>
                </div>

                {/* Source Wavelength & Anode Selector */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-300">
                      Source Wavelength ({lengthUnit})
                    </label>
                    <span className="text-[10px] font-mono text-pink-400 font-bold tabular-nums">
                      λ = {wavelength.toFixed(4)} Å
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.0001"
                        value={String(wavelength) === 'NaN' ? '' : convertLength(wavelength, lengthUnit)}
                        onChange={(e) => setWavelength(convertToAngstrom(Number(e.target.value), lengthUnit))}
                        className="w-full px-3.5 py-2 bg-[#0A101C] text-pink-300 border border-slate-700/80 focus:border-pink-500/60 rounded-xl outline-none font-mono tabular-nums text-xs font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                        {lengthUnit}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-1.5">
                    {Object.entries(XRAY_WAVELENGTHS).slice(0, 5).map(([name, val]) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setWavelength(val)}
                        className={`py-1.5 px-1 rounded-lg border text-[9px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap truncate ${
                          Math.abs(wavelength - val) < 1e-4
                            ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                            : 'bg-[#0A101C] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {name.replace(' Kα', '').replace(' (avg)', '')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stokes-Wilson Shape Constant K */}
                <div ref={kMenuRef} className="relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-300">
                      Stokes-Wilson Shape Constant (K_β)
                    </label>
                    <span className="text-[10px] font-mono text-pink-400 font-bold tabular-nums">
                      K = {constantK.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                      className="flex-1 px-3.5 py-2 bg-[#0A101C] text-pink-300 border border-slate-700/80 hover:border-pink-500/40 rounded-xl flex items-center justify-between text-xs font-mono cursor-pointer"
                    >
                      <span className="truncate">{selectedKType}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      value={String(constantK) === 'NaN' ? '' : constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value) || 1.0);
                        setSelectedKType('Custom');
                      }}
                      className="w-20 px-2.5 py-2 bg-[#0A101C] text-pink-300 border border-slate-700/80 rounded-xl font-mono tabular-nums text-xs font-bold text-center outline-none"
                    />
                  </div>
                  <AnimatePresence>
                    {isKTypeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full mt-1.5 left-0 right-0 bg-[#070D18] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1 max-h-56 overflow-y-auto custom-scrollbar"
                      >
                        {K_FACTORS.map((k) => (
                          <button
                            key={k.label}
                            type="button"
                            onClick={() => {
                              if (k.value > 0) setConstantK(k.value);
                              setSelectedKType(k.label);
                              setIsKTypeMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-pink-500/10 transition-colors cursor-pointer ${
                              selectedKType === k.label ? 'bg-pink-500/15' : ''
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-white truncate">
                                {k.label} {k.value !== 0 && `(${k.value})`}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400 truncate">{k.desc}</div>
                            </div>
                            <span className="text-xs font-mono text-pink-300 shrink-0">{k.icon}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* STAGE 2: Instrumental Resolution Function & Live Caglioti Curve */}
            {(configSection === 'all' || configSection === 'optics') && (
              <div className="bg-[#070D18] p-4 rounded-2xl border border-slate-800/90 space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    02. Instrumental Resolution β_inst(2θ)
                  </span>
                  <span className="text-[9px] font-mono text-amber-300 tabular-nums">
                    {instrumentalMode === 'constant' ? `β_inst = ${instBetaIB.toFixed(3)}°` : 'Caglioti(U,V,W)'}
                  </span>
                </div>

                {/* Mode Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0A101C] rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setInstrumentalMode('constant')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      instrumentalMode === 'constant'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Constant β_inst
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstrumentalMode('caglioti')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      instrumentalMode === 'caglioti'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Caglioti Polynomial
                  </button>
                </div>

                {instrumentalMode === 'constant' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Constant Instrumental Breadth</span>
                      <span className="text-amber-300 font-bold tabular-nums">{instBetaIB.toFixed(3)}° 2θ</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.25"
                      step="0.005"
                      value={instBetaIB}
                      onChange={(e) => setInstBetaIB(parseFloat(e.target.value) || 0)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { label: '0° Raw', val: 0 },
                        { label: '0.02° Synch', val: 0.02 },
                        { label: '0.05° LaB6', val: 0.05 },
                        { label: '0.08° Lab', val: 0.08 },
                        { label: '0.12° Slit', val: 0.12 }
                      ].map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setInstBetaIB(p.val)}
                          className={`py-1 px-1 rounded-lg border text-[8.5px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap truncate ${
                            Math.abs(instBetaIB - p.val) < 1e-4
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-[#0A101C] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 bg-[#0A101C] p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>β_inst²(θ) = U·tan²θ + V·tanθ + W</span>
                    </div>
                    {/* 4 Calibrated Diffractometer Optics Presets */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { name: 'NIST Si 640f', u: 0.0048, v: -0.0018, w: 0.0125 },
                        { name: 'LaB₆ SRM 660c', u: 0.0022, v: -0.0009, w: 0.0064 },
                        { name: 'Synchrotron HR', u: 0.0002, v: -0.0001, w: 0.0004 },
                        { name: 'Micro-XRD Optics', u: 0.0140, v: -0.0050, w: 0.0320 }
                      ].map(opt => {
                        const isMatch =
                          Math.abs(cagliotiU - opt.u) < 1e-4 &&
                          Math.abs(cagliotiV - opt.v) < 1e-4 &&
                          Math.abs(cagliotiW - opt.w) < 1e-4;
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => {
                              setCagliotiU(opt.u);
                              setCagliotiV(opt.v);
                              setCagliotiW(opt.w);
                            }}
                            className={`py-1 px-2 rounded-lg border text-[9px] font-mono font-bold text-left transition-colors cursor-pointer truncate ${
                              isMatch
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                : 'bg-[#070D18] border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {opt.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono tabular-nums">
                      <div>
                        <span className="text-[8.5px] text-slate-400 block mb-1">U (tan²θ)</span>
                        <input
                          type="number"
                          step="0.0005"
                          value={String(cagliotiU) === 'NaN' ? '' : cagliotiU}
                          onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 text-xs border border-slate-700/80 rounded-lg text-center outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[8.5px] text-slate-400 block mb-1">V (tanθ)</span>
                        <input
                          type="number"
                          step="0.0005"
                          value={String(cagliotiV) === 'NaN' ? '' : cagliotiV}
                          onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 text-xs border border-slate-700/80 rounded-lg text-center outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[8.5px] text-slate-400 block mb-1">W (const)</span>
                        <input
                          type="number"
                          step="0.0005"
                          value={String(cagliotiW) === 'NaN' ? '' : cagliotiW}
                          onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 text-xs border border-slate-700/80 rounded-lg text-center outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Live SVG Instrumental Resolution vs Sample Breadth Sparkline */}
                {(() => {
                  const pts = result?.pointsExtended || [];
                  const maxBeta = Math.max(
                    0.35,
                    ...pts.map(p => p.betaObsDeg),
                    instrumentalMode === 'constant' ? instBetaIB * 1.6 : 0.25
                  );
                  const w = 320;
                  const h = 76;
                  const padL = 28;
                  const padR = 10;
                  const padT = 10;
                  const padB = 16;
                  const pw = w - padL - padR;
                  const ph = h - padT - padB;
                  const xOf = (tt: number) => padL + ((tt - 15) / 95) * pw;
                  const yOf = (b: number) => padT + ph - (Math.min(maxBeta, Math.max(0, b)) / maxBeta) * ph;

                  const instCurvePts: string[] = [];
                  for (let tt = 15; tt <= 110; tt += 5) {
                    const rad = (tt / 2) * (Math.PI / 180);
                    const t = Math.tan(rad);
                    const bInst =
                      instrumentalMode === 'constant'
                        ? instBetaIB
                        : Math.sqrt(Math.max(0, cagliotiU * t * t + cagliotiV * t + cagliotiW));
                    instCurvePts.push(`${xOf(tt).toFixed(1)},${yOf(bInst).toFixed(1)}`);
                  }

                  return (
                    <div className="bg-[#0A101C] rounded-xl border border-slate-800/90 p-2">
                      <div className="flex items-center justify-between text-[8.5px] font-mono text-slate-400 mb-1 px-1">
                        <span>Resolution Curve vs Reflections (15°–110° 2θ)</span>
                        <span className="text-amber-300">-- β_inst(2θ)</span>
                      </div>
                      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-18 overflow-visible">
                        <line x1={padL} y1={padT + ph} x2={padL + pw} y2={padT + ph} stroke="rgba(255,255,255,0.12)" />
                        <line x1={padL} y1={padT} x2={padL} y2={padT + ph} stroke="rgba(255,255,255,0.12)" />
                        <text x={padL - 4} y={padT + 6} textAnchor="end" className="fill-slate-500 font-mono text-[7px]">
                          {maxBeta.toFixed(2)}°
                        </text>
                        <text x={padL - 4} y={padT + ph} textAnchor="end" className="fill-slate-500 font-mono text-[7px]">
                          0°
                        </text>
                        {/* Instrumental resolution curve */}
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.5"
                          strokeDasharray="3 2"
                          points={instCurvePts.join(' ')}
                        />
                        {/* Observed & Sample points */}
                        {pts.map((p, idx) => {
                          if (p.twoTheta < 15 || p.twoTheta > 110) return null;
                          const cx = xOf(p.twoTheta);
                          const cyObs = yOf(p.betaObsDeg);
                          const cySamp = yOf(p.betaSampleDeg);
                          return (
                            <g key={idx} opacity={p.isExcluded ? 0.3 : 1}>
                              <line x1={cx} y1={cyObs} x2={cx} y2={cySamp} stroke="rgba(34,211,238,0.4)" strokeWidth="1" />
                              <circle cx={cx} cy={cyObs} r="2.6" fill="#f472b6" />
                              <rect x={cx - 2} y={cySamp - 2} width="4" height="4" fill="#22d3ee" />
                            </g>
                          );
                        })}
                        <text x={padL} y={h - 2} className="fill-slate-500 font-mono text-[7px]">15°</text>
                        <text x={padL + pw / 2} y={h - 2} textAnchor="middle" className="fill-slate-500 font-mono text-[7px]">60° 2θ</text>
                        <text x={padL + pw} y={h - 2} textAnchor="end" className="fill-slate-500 font-mono text-[7px]">110°</text>
                      </svg>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* STAGE 3: Deconvolution Law & 6-Model Separation Solver with Live Telemetry */}
            {(configSection === 'all' || configSection === 'models') && (
              <div className="bg-[#070D18] p-4 rounded-2xl border border-slate-800/90 space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-pink-400" />
                    03. Deconvolution &amp; 6-Model Solver
                  </span>
                  <div className="flex items-center gap-1.5">
                    {result?.pointsExtended && result.pointsExtended.some(p => Math.abs(p.studentizedResidual || 0) > 1.8 && !p.isExcluded) && (
                      <button
                        type="button"
                        onClick={handleAutoPruneOutliers}
                        className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[8.5px] font-mono font-bold text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                      >
                        Prune Outliers
                      </button>
                    )}
                    <span className="text-[8.5px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                      {decouplingMethod.toUpperCase()} · {separationMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* =====================================================================
                    1. INSTRUMENTAL BROADENING SUBTRACTION LAW
                   ===================================================================== */}
                {(() => {
                  const activePts = (result?.pointsExtended || []).filter(p => !p.isExcluded && p.betaObsDeg > 0);
                  const computeLawPreview = (lawId: 'linear' | 'squared' | 'hw_voigt' | 'none') => {
                    if (activePts.length === 0) return { meanSampleDeg: 0, retentionPct: 100 };
                    let sumSample = 0;
                    let sumPct = 0;
                    for (const p of activePts) {
                      const bObs = p.betaObsDeg;
                      const bInst = Math.min(bObs * 0.98, p.betaInstDeg);
                      let bS = bObs;
                      if (lawId === 'linear') {
                        bS = Math.max(1e-5, bObs - bInst);
                      } else if (lawId === 'squared') {
                        bS = Math.sqrt(Math.max(1e-10, bObs * bObs - bInst * bInst));
                      } else if (lawId === 'hw_voigt') {
                        const r = bInst / bObs;
                        bS = bObs * Math.max(1e-5, 1 - r * r);
                      }
                      sumSample += bS;
                      sumPct += (bS / bObs) * 100;
                    }
                    return {
                      meanSampleDeg: sumSample / activePts.length,
                      retentionPct: Math.min(100, Math.max(0, sumPct / activePts.length))
                    };
                  };

                  const recommendedLaw: 'linear' | 'squared' | 'hw_voigt' =
                    voigtShapePhi < 0.70 ? 'linear' : voigtShapePhi > 0.88 ? 'squared' : 'hw_voigt';

                  const subtractionLaws: Array<{
                    id: 'linear' | 'squared' | 'hw_voigt' | 'none';
                    code: string;
                    label: string;
                    profileTag: string;
                    eq: string;
                    regimeDesc: string;
                  }> = [
                    {
                      id: 'linear',
                      code: 'CAUCHY',
                      label: 'Linear (Lorentzian)',
                      profileTag: 'φ → 0.637',
                      eq: 'β_s = β_obs − β_inst',
                      regimeDesc: 'Exact deconvolution when both instrumental and sample profiles are Lorentzian (size-dominated).'
                    },
                    {
                      id: 'squared',
                      code: 'GAUSS',
                      label: 'Quadratic (Gaussian)',
                      profileTag: 'φ → 0.939',
                      eq: 'β_s = √(β_obs² − β_inst²)',
                      regimeDesc: 'Exact deconvolution when broadening follows Gaussian statistics (microstrain & slit optics).'
                    },
                    {
                      id: 'hw_voigt',
                      code: 'VOIGT-HW',
                      label: 'Halder-Wagner Voigt',
                      profileTag: '0.70 ≤ φ ≤ 0.88',
                      eq: 'β_s = β_obs · [1 − (β_inst / β_obs)²]',
                      regimeDesc: 'Parabolic Voigt approximation coupling Cauchy size and Gaussian strain without Fourier transform.'
                    },
                    {
                      id: 'none',
                      code: 'RAW',
                      label: 'Uncorrected Bypass',
                      profileTag: 'β_inst = 0°',
                      eq: 'β_s = β_obs',
                      regimeDesc: 'Bypasses instrumental subtraction for ultra-broad nanocrystalline peaks (β_obs ≫ 10·β_inst).'
                    }
                  ];

                  const activeLawObj = subtractionLaws.find(l => l.id === decouplingMethod) || subtractionLaws[0];

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <label className="block text-[10px] font-black text-slate-200 uppercase tracking-wider">
                            1. Instrumental Broadening Subtraction Law
                          </label>
                          <span className="text-[9px] font-mono text-slate-400">
                            Deconvolves diffractometer optics β_inst(2θ) from observed Area/I_max
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDecouplingMethod(recommendedLaw)}
                          className={`px-2 py-1 rounded-lg border text-[8.5px] font-mono font-bold transition-colors cursor-pointer shrink-0 ${
                            decouplingMethod === recommendedLaw
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                          }`}
                          title={`Select optimal subtraction law for current Voigt shape factor φ = ${voigtShapePhi.toFixed(2)}`}
                        >
                          {decouplingMethod === recommendedLaw ? `● Matched φ=${voigtShapePhi.toFixed(2)}` : `Auto-Match φ=${voigtShapePhi.toFixed(2)}`}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subtractionLaws.map(law => {
                          const isSelected = decouplingMethod === law.id;
                          const isRec = recommendedLaw === law.id;
                          const preview = computeLawPreview(law.id);
                          const instPct = Math.max(0, 100 - preview.retentionPct);

                          return (
                            <button
                              key={law.id}
                              type="button"
                              onClick={() => setDecouplingMethod(law.id)}
                              className={`p-3 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between font-mono tabular-nums ${
                                isSelected
                                  ? 'bg-pink-500/15 border-pink-500/60 text-white shadow-[0_0_20px_rgba(244,114,182,0.12)]'
                                  : 'bg-[#0A101C] border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                {/* Card Top Row: Badge + Profile Tag */}
                                <div className="flex items-center justify-between gap-1.5 mb-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                    isSelected
                                      ? 'bg-pink-500/25 border-pink-400/50 text-pink-200'
                                      : 'bg-black/40 border-white/5 text-slate-400'
                                  }`}>
                                    {law.code}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {isRec && (
                                      <span className="text-[7.5px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                                        OPT φ
                                      </span>
                                    )}
                                    <span className="text-[8px] text-slate-400">{law.profileTag}</span>
                                  </div>
                                </div>

                                {/* Title + Explicit Formula */}
                                <div className="text-[10.5px] font-sans font-bold text-white leading-tight mt-1">
                                  {law.label}
                                </div>
                                <div className={`text-[9px] font-mono mt-1 px-2 py-1 rounded bg-black/40 border ${
                                  isSelected ? 'border-pink-500/30 text-pink-300' : 'border-white/5 text-slate-300'
                                }`}>
                                  {law.eq}
                                </div>
                              </div>

                              {/* Live Sample vs Instrumental Broadening Split Bar */}
                              <div className="mt-2.5 pt-2 border-t border-white/5">
                                <div className="flex items-center justify-between text-[8px] mb-1">
                                  <span className="text-cyan-300 font-bold">
                                    ⟨β_s⟩ = {preview.meanSampleDeg > 0 ? `${preview.meanSampleDeg.toFixed(3)}°` : '—'}
                                  </span>
                                  <span className="text-slate-400">
                                    {preview.retentionPct.toFixed(0)}% sample / {instPct.toFixed(0)}% inst
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
                                  <div
                                    className="h-full bg-cyan-400 transition-all duration-300"
                                    style={{ width: `${preview.retentionPct}%` }}
                                    title={`Sample broadening fraction: ${preview.retentionPct.toFixed(1)}%`}
                                  />
                                  <div
                                    className="h-full bg-amber-400/80 transition-all duration-300"
                                    style={{ width: `${instPct}%` }}
                                    title={`Subtracted instrumental fraction: ${instPct.toFixed(1)}%`}
                                  />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Subtraction Law Diagnostic Note */}
                      <div className="px-3 py-2 rounded-xl bg-[#0A101C] border border-slate-800/80 flex items-center justify-between gap-2 text-[9px] font-mono text-slate-400">
                        <span className="leading-relaxed">
                          <strong className="text-pink-300">{activeLawObj.code}:</strong> {activeLawObj.regimeDesc}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* =====================================================================
                    2. MULTI-REFLECTION SEPARATION FORMALISM (6-MODEL SOLVER)
                   ===================================================================== */}
                {(() => {
                  const bestFitItem = (result?.modelComparisons || []).find(m => m.isBestFit);
                  const bestMethodKey = bestFitItem
                    ? bestFitItem.modelName === 'Halder-Wagner'
                      ? 'hw'
                      : (bestFitItem.modelName.toLowerCase() as 'udm' | 'usdm' | 'udedm' | 'ssp' | 'mwh')
                    : null;

                  const formalisms: Array<{
                    id: 'udm' | 'usdm' | 'udedm' | 'ssp' | 'hw' | 'mwh';
                    matchKey: string;
                    code: string;
                    title: string;
                    domainTag: string;
                    yAxis: string;
                    xAxis: string;
                    slopeMeaning: string;
                    interceptMeaning: string;
                    sizeFrom: 'INTERCEPT' | 'SLOPE';
                  }> = [
                    {
                      id: 'udm',
                      matchKey: 'UDM',
                      code: 'UDM',
                      title: 'Uniform Deformation',
                      domainTag: 'Isotropic Strain',
                      yAxis: 'β_s · cosθ',
                      xAxis: '4 · sinθ',
                      slopeMeaning: 'Slope m = ε (Microstrain)',
                      interceptMeaning: 'Intercept c = Kλ / D_v',
                      sizeFrom: 'INTERCEPT'
                    },
                    {
                      id: 'usdm',
                      matchKey: 'USDM',
                      code: 'USDM',
                      title: 'Uniform Stress (Hooke)',
                      domainTag: 'Anisotropic E_hkl',
                      yAxis: 'β_s · cosθ',
                      xAxis: '4 · sinθ / E_hkl',
                      slopeMeaning: 'Slope m = σ (Uniform Stress)',
                      interceptMeaning: 'Intercept c = Kλ / D_v',
                      sizeFrom: 'INTERCEPT'
                    },
                    {
                      id: 'udedm',
                      matchKey: 'UDEDM',
                      code: 'UDEDM',
                      title: 'Energy Density (u)',
                      domainTag: 'Elastic Energy u',
                      yAxis: 'β_s · cosθ',
                      xAxis: '4 · sinθ · √(2/E_hkl)',
                      slopeMeaning: 'Slope m = √u (Energy Density)',
                      interceptMeaning: 'Intercept c = Kλ / D_v',
                      sizeFrom: 'INTERCEPT'
                    },
                    {
                      id: 'ssp',
                      matchKey: 'SSP',
                      code: 'SSP',
                      title: 'Size-Strain Plot',
                      domainTag: 'd-Weighted Voigt',
                      yAxis: '(d_hkl · β_s · cosθ)²',
                      xAxis: 'd_hkl² · β_s · cosθ',
                      slopeMeaning: 'Slope m = Kλ / D_v (Size)',
                      interceptMeaning: 'Intercept c = (2·ε·λ)²',
                      sizeFrom: 'SLOPE'
                    },
                    {
                      id: 'hw',
                      matchKey: 'Halder-Wagner',
                      code: 'H-W',
                      title: 'Halder-Wagner Voigt',
                      domainTag: 'Parabolic Voigt',
                      yAxis: '(β_s / tanθ)²',
                      xAxis: 'β_s / (tanθ · sinθ)',
                      slopeMeaning: 'Slope m = Kλ / D_v (Size)',
                      interceptMeaning: 'Intercept c = 16 · ε²',
                      sizeFrom: 'SLOPE'
                    },
                    {
                      id: 'mwh',
                      matchKey: 'mWH',
                      code: 'mWH',
                      title: 'Modified W-H (Ungár)',
                      domainTag: 'Dislocation C_hkl',
                      yAxis: 'β_s · cosθ',
                      xAxis: '4 · sinθ · √(C_hkl/C₀)',
                      slopeMeaning: 'Slope m = ε_disloc (Anisotropic)',
                      interceptMeaning: 'Intercept c = Kλ / D_v',
                      sizeFrom: 'INTERCEPT'
                    }
                  ];

                  const activeFormalism = formalisms.find(f => f.id === separationMethod) || formalisms[0];

                  return (
                    <div className="space-y-2.5 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <label className="block text-[10px] font-black text-slate-200 uppercase tracking-wider">
                            2. Multi-Reflection Separation Formalism
                          </label>
                          <span className="text-[9px] font-mono text-slate-400">
                            Simultaneous 6-model regression with live D_v, ε, and R² ranking
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {bestMethodKey && (
                            <button
                              type="button"
                              onClick={() => setSeparationMethod(bestMethodKey)}
                              className={`px-2 py-1 rounded-lg border text-[8.5px] font-mono font-bold transition-colors cursor-pointer ${
                                separationMethod === bestMethodKey
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              }`}
                              title="Select formalism with highest statistical goodness-of-fit R²"
                            >
                              ★ Best ({bestFitItem?.modelName})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setActiveChartTab('modelMatrix')}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-pink-500/15 border border-white/10 hover:border-pink-500/30 text-[8.5px] font-mono font-bold text-pink-300 transition-colors cursor-pointer"
                          >
                            Matrix →
                          </button>
                        </div>
                      </div>

                      {/* 6 Formalism Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {formalisms.map(f => {
                          const comp = (result?.modelComparisons || []).find(
                            c => c.modelName.toUpperCase() === f.matchKey.toUpperCase()
                          );
                          const isSelected = separationMethod === f.id;
                          const r2Val = comp ? comp.rSquared : 0;
                          const r2Pct = Math.min(100, Math.max(0, r2Val * 100));

                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setSeparationMethod(f.id)}
                              className={`p-3 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between font-mono tabular-nums ${
                                isSelected
                                  ? 'bg-pink-500/15 border-pink-500/60 text-white shadow-[0_0_20px_rgba(244,114,182,0.12)]'
                                  : 'bg-[#0A101C] border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <div>
                                {/* Header Row: Code + Best Fit / R² Badge */}
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                      isSelected
                                        ? 'bg-pink-500/25 border-pink-400/50 text-pink-200'
                                        : 'bg-black/40 border-white/5 text-slate-300'
                                    }`}>
                                      {f.code}
                                    </span>
                                    <span className="text-[8px] text-slate-400 truncate">
                                      {f.domainTag}
                                    </span>
                                  </div>
                                  {comp && (
                                    <span
                                      className={`text-[8.5px] font-bold shrink-0 px-1.5 py-0.5 rounded ${
                                        comp.isBestFit
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {comp.isBestFit ? '★ ' : ''}R²={comp.rSquared.toFixed(3)}
                                    </span>
                                  )}
                                </div>

                                {/* Model Title & Linear Coordinates */}
                                <div className="text-[10.5px] font-sans font-bold text-white leading-tight mt-0.5">
                                  {f.title}
                                </div>
                                <div className="text-[8px] text-slate-400 mt-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/5 truncate">
                                  Y: {f.yAxis} · X: {f.xAxis}
                                </div>
                              </div>

                              {/* Live Extracted D_v & Strain Telemetry + R² Bar */}
                              <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5">
                                <div className="flex items-center justify-between text-[8.5px]">
                                  <span className="text-emerald-300 font-bold">
                                    Dv = {comp && comp.sizeNm > 0 ? `${comp.sizeNm < 100 ? comp.sizeNm.toFixed(1) : comp.sizeNm.toFixed(0)} nm` : '—'}
                                  </span>
                                  <span className="text-cyan-300 font-bold">
                                    ε = {comp ? `${(comp.strainPercent / 100 * 1000).toFixed(2)}×10⁻³` : '—'}
                                  </span>
                                </div>
                                <div className="w-full h-1 rounded-full bg-slate-900 overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      comp?.isBestFit ? 'bg-emerald-400' : isSelected ? 'bg-pink-400' : 'bg-slate-600'
                                    }`}
                                    style={{ width: `${r2Pct}%` }}
                                  />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Formalism Linear Operator Mapping Inspector */}
                      <div className="p-3 rounded-xl bg-[#0A101C] border border-slate-800/90 space-y-2 font-mono tabular-nums">
                        <div className="flex items-center justify-between text-[9px] border-b border-white/5 pb-1.5">
                          <span className="text-white font-bold uppercase">
                            Active Solver Mapping: <span className="text-pink-300">{activeFormalism.title}</span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            activeFormalism.sizeFrom === 'SLOPE'
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                          }`}>
                            D_v from {activeFormalism.sizeFrom}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-slate-500 block uppercase text-[7.5px]">Regression Slope (m)</span>
                            <span className="text-cyan-300 font-bold block truncate mt-0.5">
                              {activeFormalism.slopeMeaning}
                            </span>
                            <span className="text-slate-400 block mt-0.5">
                              m = {result ? result.regression.slope.toExponential(3) : '—'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                            <span className="text-slate-500 block uppercase text-[7.5px]">Y-Axis Intercept (c)</span>
                            <span className="text-emerald-300 font-bold block truncate mt-0.5">
                              {activeFormalism.interceptMeaning}
                            </span>
                            <span className="text-slate-400 block mt-0.5">
                              c = {result ? result.regression.intercept.toExponential(3) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* STAGE 4: Continuum Elasticity, Density & Dislocation Physics */}
            {(configSection === 'all' || configSection === 'continuum') && (
              <div className="bg-[#070D18] p-4 rounded-2xl border border-slate-800/90 space-y-3.5 font-mono tabular-nums">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 font-sans">
                  <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    04. Continuum &amp; Dislocation Constants
                  </span>
                  <span className="text-[9px] font-mono text-cyan-300">
                    Anisotropic E_hkl
                  </span>
                </div>

                {/* Young's Modulus E_0 */}
                <div className="bg-[#0A101C] rounded-xl border border-slate-800 p-3 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-300 font-sans font-bold">Young&apos;s Modulus (E₀)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={String(youngsModulusGPa) === 'NaN' ? '' : youngsModulusGPa}
                        onChange={(e) => setYoungsModulusGPa(parseFloat(e.target.value) || 130)}
                        className="w-16 px-2 py-0.5 bg-[#070D18] text-pink-300 border border-slate-700 rounded text-right text-xs font-bold outline-none"
                      />
                      <span className="text-slate-400 text-[9px]">GPa</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="1"
                    value={String(youngsModulusGPa) === 'NaN' ? 130 : youngsModulusGPa}
                    onChange={(e) => setYoungsModulusGPa(parseInt(e.target.value, 10) || 130)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { name: 'Al', val: 70 },
                      { name: 'Si', val: 130 },
                      { name: 'ZnO', val: 140 },
                      { name: 'Fe', val: 211 },
                      { name: 'CeO₂', val: 220 }
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setYoungsModulusGPa(preset.val)}
                        className={`py-1 rounded border text-[8.5px] font-bold transition-colors cursor-pointer ${
                          youngsModulusGPa === preset.val
                            ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                            : 'bg-[#070D18] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {preset.name} ({preset.val})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material Density & Burgers Vector b */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#0A101C] rounded-xl border border-slate-800 p-3 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-300 font-sans font-bold">Density (ρ)</span>
                      <span className="text-emerald-400 font-bold">{materialDensityGcm3.toFixed(2)} g/cm³</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="19.5"
                      step="0.05"
                      value={String(materialDensityGcm3) === 'NaN' ? 2.33 : materialDensityGcm3}
                      onChange={(e) => setMaterialDensityGcm3(parseFloat(e.target.value) || 2.33)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="text-[8px] text-slate-500 truncate">
                      SSA = {result?.specificSurfaceAreaM2g ? `${result.specificSurfaceAreaM2g.toFixed(1)} m²/g` : '6000/(ρ·D)'}
                    </div>
                  </div>

                  <div className="bg-[#0A101C] rounded-xl border border-slate-800 p-3 space-y-1.5">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-300 font-sans font-bold">Burgers (b)</span>
                      <span className="text-amber-300 font-bold">{burgersVectorNm.toFixed(3)} nm</span>
                    </div>
                    <input
                      type="range"
                      min="0.18"
                      max="0.55"
                      step="0.002"
                      value={burgersVectorNm}
                      onChange={(e) => setBurgersVectorNm(parseFloat(e.target.value) || 0.25)}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <div className="flex gap-1">
                      {[
                        { label: 'Fe', b: 0.248 },
                        { label: 'Cu', b: 0.256 },
                        { label: 'Si', b: 0.384 }
                      ].map(item => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setBurgersVectorNm(item.b)}
                          className={`flex-1 py-0.5 rounded border text-[8px] cursor-pointer ${
                            Math.abs(burgersVectorNm - item.b) < 0.003
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-[#070D18] border-slate-800 text-slate-500'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Refined Reflections Data Manager for IB Advanced */}
            <IBAdvancedPeakDataManager
              inputData={inputData}
              onInputChange={(newData) => {
                setInputData(newData);
                setSelectedMaterial('Custom Data');
              }}
              wavelength={wavelength}
              constantK={constantK}
              instBetaIB={instBetaIB}
              instrumentalMode={instrumentalMode}
              cagliotiParams={{ U: cagliotiU, V: cagliotiV, W: cagliotiW }}
              decouplingMethod={decouplingMethod}
              materialDensityGcm3={materialDensityGcm3}
              youngsModulusGPa={youngsModulusGPa}
              excludedIndices={excludedIndices}
              onToggleExcludePeak={toggleExcludePeak}
              onResetExclusions={resetExclusions}
              selectedMaterial={selectedMaterial}
              materialPresets={MATERIAL_PRESETS}
              onSelectPreset={(preset) => {
                setSelectedMaterial(preset.label);
                setInputData(preset.data);
                if (preset.youngsModulus) setYoungsModulusGPa(preset.youngsModulus);
                if (preset.density) setMaterialDensityGcm3(preset.density);
                setExcludedIndices([]);
                setAdvisorReport(null);
              }}
              result={result}
            />

            {/* Primary Execution Button (Clean, Zero Shimmer Slop) */}
            {!isSimulationRunning ? (
              <button
                type="button"
                onClick={handleCalculateWithSimulation}
                disabled={parseIBAdvancedInput(inputData).length < 2}
                className={`w-full py-3.5 px-4 font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2.5 text-xs ${
                  parseIBAdvancedInput(inputData).length >= 2
                    ? 'bg-pink-600 hover:bg-pink-500 text-white cursor-pointer shadow-lg'
                    : 'bg-[#070D18] text-slate-600 cursor-not-allowed border border-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Run {separationMethod.toUpperCase()} Regression &amp; Voigt Solver</span>
              </button>
            ) : (
              <div className="bg-[#070D18] p-4 rounded-2xl border border-pink-500/30">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-pink-400 animate-spin" /> Running Regression Pipeline
                </h4>
                <div className="space-y-2 w-full flex flex-col">
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
                      <div key={s.step} className={`flex items-center gap-2.5 w-full transition-opacity ${isActive ? 'opacity-100' : isDone ? 'opacity-60' : 'opacity-25'}`}>
                        <div className={`p-1.5 rounded-lg border shrink-0 ${isActive ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className={`text-[9px] font-mono font-bold uppercase ${isActive ? 'text-pink-300' : isDone ? 'text-emerald-300' : 'text-slate-500'}`}>
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
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-4 rounded-2xl border border-emerald-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between font-mono tabular-nums">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Box className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-sans">Volume Size (Dv)</span>
                </div>
                {result?.fitRegime && result.fitRegime !== 'standard_ols' && (
                  <span
                    className="text-[7px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase font-bold"
                    title={result.fitRegime === 'voigt_regularized' ? 'Unconstrained OLS intercept ≤ 0 regularized via Halder-Wagner Parabolic Voigt coupling' : 'Non-Negative Least Squares zero-strain boundary'}
                  >
                    {result.fitRegime === 'voigt_regularized' ? 'Voigt-Reg' : 'NNLS ε=0'}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {result && result.sizeInterceptNm > 0
                    ? result.sizeInterceptNm < 100
                      ? result.sizeInterceptNm.toFixed(2)
                      : result.sizeInterceptNm.toFixed(1)
                    : '—'}
                </span>
                <span className="text-xs font-black text-emerald-400 uppercase">nm</span>
                {result?.sizeErrorNm && result.sizeErrorNm > 0 ? (
                  <span className="text-[10px] text-slate-400 font-mono">±{result.sizeErrorNm.toFixed(1)}</span>
                ) : null}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[8px] text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between gap-1">
              <span title="Langford-Voigt Area-Weighted Column Length Da">
                Da = {result?.areaWeightedSizeNm ? result.areaWeightedSizeNm.toFixed(1) : '-'} nm
              </span>
              <span className="text-emerald-400/90" title="Stokes-Wilson Spherical Grain Diameter D_sph = (4/3) Dv and Log-Normal Polydispersity σ_g">
                D_sph={result?.meanSphericalDiameterNm ? result.meanSphericalDiameterNm.toFixed(1) : '-'} · σg={result?.logNormalSigmaG ? result.logNormalSigmaG.toFixed(2) : '-'}
              </span>
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
              {result ? `${result.strainPercent.toFixed(3)}${result.strainErrorPercent ? ` ±${result.strainErrorPercent.toFixed(3)}` : ''}% • RMS=${result.rmsStrainPercent?.toFixed(3) || '-'}%` : '-'}
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
              {result?.stressErrorMPa ? `±${result.stressErrorMPa.toFixed(1)} MPa • ` : ''}u = {result?.energyDensityKjM3?.toFixed(2) || '-'} kJ/m³
            </div>
          </div>

          {/* Dislocation Density & Specific Surface Area */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-4 rounded-2xl border border-amber-500/20 shadow-xl relative overflow-hidden flex flex-col justify-between font-mono tabular-nums">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Atom className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest font-sans">Dislocation (ρ_WS)</span>
                </div>
                <span className="text-[8px] text-slate-500">b={burgersVectorNm}nm</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono">
                  {result?.dislocationDensity10_14 !== undefined && result.dislocationDensity10_14 > 0
                    ? result.dislocationDensity10_14.toFixed(2)
                    : result?.williamsonDollarDislocation10_14 !== undefined
                    ? result.williamsonDollarDislocation10_14.toFixed(2)
                    : '-'}
                </span>
                <span className="text-[9px] font-bold text-amber-400">×10¹⁴ m⁻²</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/5 text-[8px] text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between gap-1">
              <span>1/D²={result?.williamsonDollarDislocation10_14?.toFixed(2) || '-'}</span>
              <span>SSA={result?.specificSurfaceAreaM2g !== undefined ? `${result.specificSurfaceAreaM2g.toFixed(1)} m²/g` : '-'}</span>
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
              <span>F={result?.regression.fStatistic ? result.regression.fStatistic.toFixed(1) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Visualizer Tabs Header */}
        <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col overflow-hidden">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-4 border-b border-white/5 relative z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'fit', label: `${separationMethod.toUpperCase()} Regression`, icon: TrendingUp },
                { id: 'voigtProfile', label: 'Voigt & Shape φ', icon: Layers },
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

          {/* Tab 1B: Single-Line Voigt & Equivalent Integral Breadth Rectangle Visualizer (Merged from IntegralBreadthModule) */}
          {activeChartTab === 'voigtProfile' && (() => {
            const pts = result?.pointsExtended || [];
            const safeIdx = Math.min(Math.max(0, selectedVoigtPeakIdx), Math.max(0, pts.length - 1));
            const activePt = pts[safeIdx];
            const center2T = activePt ? activePt.twoTheta : 28.44;
            const betaObsDeg = activePt ? activePt.betaObsDeg : 0.25;
            const iMaxVal = 1000;
            const areaVal = betaObsDeg * iMaxVal;
            const fwhmSynthesized = betaObsDeg * voigtShapePhi;

            const singleLineRes = calculateIntegralBreadth(
              wavelength,
              constantK,
              {
                twoTheta: center2T,
                fwhm: fwhmSynthesized,
                area: areaVal,
                iMax: iMaxVal,
                hkl: activePt?.hkl
              },
              instrumentalMode,
              instBetaIB,
              { U: cagliotiU, V: cagliotiV, W: cagliotiW },
              'de_keijser',
              materialDensityGcm3
            );

            const profileSim = synthesizeIBPeakProfile(
              center2T,
              fwhmSynthesized,
              areaVal,
              iMaxVal,
              180
            );

            return (
              <div className="space-y-4">
                {/* Top Controls: Reflection Selector + Langford Shape Factor φ Slider */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#070D18] p-3.5 rounded-2xl border border-white/5 font-mono tabular-nums">
                  <div className="md:col-span-5 flex flex-col justify-between">
                    <span className="text-[9px] text-slate-400 uppercase font-bold mb-1.5">
                      Inspect Bragg Reflection (β_obs = Area / I_max)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pts.map((pt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedVoigtPeakIdx(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            safeIdx === idx
                              ? 'bg-pink-500/20 border-pink-500/50 text-pink-300'
                              : 'bg-black/40 border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {pt.hkl ? `(${pt.hkl.join('')})` : `#${idx + 1}`} @ {pt.twoTheta.toFixed(1)}°
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-7 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 uppercase font-bold">
                        Langford Voigt Shape Factor φ = FWHM / β_IB
                      </span>
                      <span className="text-pink-300 font-bold">
                        φ = {voigtShapePhi.toFixed(3)} ({singleLineRes?.profileType || 'Pseudo-Voigt'} · η = {(singleLineRes?.pseudoVoigtEta ?? 0.5).toFixed(2)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.637}
                      max={0.939}
                      step={0.005}
                      value={voigtShapePhi}
                      onChange={e => setVoigtShapePhi(parseFloat(e.target.value))}
                      className="w-full accent-pink-400 cursor-pointer my-1"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>Cauchy Limit φ_C = 0.6366 (Pure Size)</span>
                      <span>Voigt Midpoint φ ≈ 0.78</span>
                      <span>Gauss Limit φ_G = 0.9394 (Pure Strain)</span>
                    </div>
                  </div>
                </div>

                {/* Single-Line de Keijser KPI Strip */}
                {singleLineRes && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                    <div className="bg-[#070D18] p-3 rounded-xl border border-pink-500/25">
                      <span className="text-[8px] text-slate-400 uppercase block">Integral Breadth β_IB</span>
                      <span className="text-sm font-black text-pink-300">{(singleLineRes.betaObsDeg ?? singleLineRes.integralBreadthDeg).toFixed(4)}°</span>
                      <span className="text-[9px] text-slate-500 block">FWHM = {fwhmSynthesized.toFixed(4)}°</span>
                    </div>
                    <div className="bg-[#070D18] p-3 rounded-xl border border-emerald-500/25">
                      <span className="text-[8px] text-slate-400 uppercase block">de Keijser Cauchy Size D_L</span>
                      <span className="text-sm font-black text-emerald-300">{(singleLineRes.lorentzianSizeNm ?? singleLineRes.volumeWeightedSizeDvNm ?? singleLineRes.calcSizeNm).toFixed(2)} nm</span>
                      <span className="text-[9px] text-slate-500 block">β_L/β = {((singleLineRes.cauchyFractionBcOverB ?? 0.5) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-[#070D18] p-3 rounded-xl border border-cyan-500/25">
                      <span className="text-[8px] text-slate-400 uppercase block">de Keijser Gauss Strain ε_G</span>
                      <span className="text-sm font-black text-cyan-300">{((singleLineRes.upperBoundStrain ?? singleLineRes.apparentRmsStrain ?? 0) * 100).toFixed(4)}%</span>
                      <span className="text-[9px] text-slate-500 block">β_G/β = {((singleLineRes.gaussFractionBgOverB ?? 0.5) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-[#070D18] p-3 rounded-xl border border-amber-500/25">
                      <span className="text-[8px] text-slate-400 uppercase block">Apparent Size D_v (Total IB)</span>
                      <span className="text-sm font-black text-amber-300">{singleLineRes.calcSizeNm.toFixed(2)} nm</span>
                      <span className="text-[9px] text-slate-500 block">{singleLineRes.coherencePlanesN ?? 0} Coherent Planes</span>
                    </div>
                  </div>
                )}

                {/* Synthesized Voigt Peak Profile + Equivalent Integral Breadth Rectangle Box */}
                <div className="h-[290px] w-full bg-[#070D18] rounded-2xl p-4 border border-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={profileSim.dataPoints} margin={{ top: 10, right: 25, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="twoTheta"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={v => `${Number(v).toFixed(2)}°`}
                        tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                        label={{ value: 'Diffraction Angle 2θ (°)', position: 'bottom', offset: 10, fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                        label={{ value: 'Intensity (counts)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#050A14', borderColor: 'rgba(244,114,182,0.4)', borderRadius: '12px', fontSize: '10px', fontFamily: 'monospace' }}
                        labelFormatter={v => `2θ = ${Number(v).toFixed(3)}°`}
                      />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase' }} />
                      <Area
                        type="stepAfter"
                        dataKey="ibBoxIntensity"
                        name="Equivalent Integral Breadth Box (Area = I_max · β_IB)"
                        stroke="#38bdf8"
                        strokeDasharray="4 3"
                        fill="rgba(56, 189, 248, 0.12)"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="intensity"
                        name="Synthesized Pseudo-Voigt Line Profile I(2θ)"
                        stroke="#f472b6"
                        strokeWidth={2.2}
                        fill="rgba(244, 114, 182, 0.20)"
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="cauchyIntensity"
                        name="Lorentzian (Size) Component"
                        stroke="#10b981"
                        strokeWidth={1.3}
                        strokeDasharray="3 3"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

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
                    <span className="text-slate-400">Reference Young's Modulus (E₀):</span>
                    <span className="text-white font-bold">{youngsModulusGPa} GPa (Anisotropic E_hkl)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Apparent Microstrain (ε ± Δε):</span>
                    <span className="text-cyan-300 font-bold">
                      {result ? `${(result.strainPercent / 100).toExponential(3)}${result.strainErrorPercent ? ` ± ${(result.strainErrorPercent / 100).toExponential(2)}` : ''}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Stokes-Wilson RMS Strain ⟨ε²⟩½:</span>
                    <span className="text-cyan-400 font-bold">{result?.rmsStrainPercent ? `${(result.rmsStrainPercent / 100).toExponential(3)} (${result.rmsStrainPercent.toFixed(3)}%)` : '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Lattice Stress (σ ± Δσ):</span>
                    <span className="text-pink-300 font-bold">
                      {result?.stressMPa !== undefined ? `${result.stressMPa.toFixed(2)}${result.stressErrorMPa ? ` ± ${result.stressErrorMPa.toFixed(2)}` : ''} MPa` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Strain Energy Density (u ± Δu):</span>
                    <span className="text-amber-300 font-bold">
                      {result?.energyDensityKjM3 !== undefined ? `${result.energyDensityKjM3.toFixed(3)}${result.energyErrorKjM3 ? ` ± ${result.energyErrorKjM3.toFixed(3)}` : ''} kJ/m³` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Williamson-Smallman Dislocation (ρ_WS):</span>
                    <span className="text-amber-300 font-bold">{(result?.williamsonDollarDislocation10_14 ?? result?.dislocationDensity10_14)?.toFixed(3) || '-'} × 10¹⁴ m⁻²</span>
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
                    <span className="text-slate-400">Fisher F-Statistic (t_0.975):</span>
                    <span className="text-emerald-300 font-bold">
                      {result?.regression.fStatistic ? `${result.regression.fStatistic.toFixed(2)} (t=${result.regression.tCritical95?.toFixed(3)})` : '-'}
                    </span>
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
                    <span className="text-slate-400">Slope ± Std Error:</span>
                    <span className="text-slate-300 font-bold">{result ? `${result.regression.slope.toExponential(3)} ± ${result.regression.stdErrorSlope?.toExponential(2) || 0}` : '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Intercept ± Std Error:</span>
                    <span className="text-slate-300 font-bold">{result ? `${result.regression.intercept.toExponential(3)} ± ${result.regression.stdErrorIntercept?.toExponential(2) || 0}` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Model Matrix */}
          {activeChartTab === 'modelMatrix' && (
            <div className="flex flex-col h-[400px] overflow-y-auto custom-scrollbar">
              <div className="mb-3 text-[10px] font-mono text-slate-400 flex justify-between items-center">
                <span>Multi-Model Comparative Matrix across all 6 Size-Strain separation formalisms (with propagated 1σ errors)</span>
                <span className="text-emerald-400 font-bold text-[9px]">★ HIGHEST R² IDENTIFIES BEST-FIT PHYSICAL MODEL</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#070D18]">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-[9px] text-slate-400 font-sans uppercase tracking-widest font-black">
                      <th className="px-3 py-3">Model</th>
                      <th className="px-3 py-3 text-emerald-400">Size D ± ΔD (nm)</th>
                      <th className="px-3 py-3 text-cyan-400">Strain ± Δε (×10⁻³)</th>
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
                            {m.sizeNm > 0 ? `${m.sizeNm.toFixed(1)}${m.sizeErrorNm ? ` ± ${m.sizeErrorNm.toFixed(1)}` : ''} nm` : 'Bulk (>1000 nm)'}
                            {m.fitRegime && m.fitRegime !== 'standard_ols' && (
                              <span className="ml-1.5 text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                                {m.fitRegime === 'voigt_regularized' ? 'Voigt-Reg' : 'NNLS'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 font-bold text-cyan-300">
                            {(m.strainPercent / 100 * 1000).toFixed(2)}{m.strainErrorPercent ? ` ± ${(m.strainErrorPercent / 100 * 1000).toFixed(2)}` : ''}
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
                          {p.singlePeakSizeNm > 0 ? (
                            `${p.singlePeakSizeNm.toFixed(2)} nm`
                          ) : (
                            <span className="text-amber-400 text-[10px] uppercase font-black">Bulk (&gt;1000 nm)</span>
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
