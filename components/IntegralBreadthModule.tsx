import React, { useState, useEffect, useMemo } from 'react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../types';
import { parseIntegralBreadthInput, calculateIntegralBreadth, XRAY_WAVELENGTHS } from '../utils/physics';
import { 
  Info, 
  BookOpen, 
  Activity, 
  Calculator, 
  Sparkles, 
  Loader2, 
  Atom, 
  Binary, 
  ShieldQuestion, 
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
  Boxes
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from './SettingsContext';
import { ScientificMathControl } from './ScientificMathControl';
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
  Area
} from 'recharts';
import { MorphologyVisualizer } from './MorphologyVisualizer';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import integralBg from '../src/assets/images/integral_breadth_ui_bg_1786057501341.jpg';

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies', icon: '⚡' },
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical particles (FWHM-based)', icon: '⚪' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Tetrahedral', value: 0.73, desc: 'Calculated for triangular/tetrahedral geometries', icon: '▲' },
  { label: 'Platelets/Disks', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Integral Breadth', value: 1.0, desc: 'Theoretical value when using Integral Breadth instead of FWHM (Recommended for IB method)', icon: '∫' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

const MATERIAL_DENSITY_PRESETS = [
  { name: 'Silicon (Si)', density: 2.33 },
  { name: 'Cerium Oxide (CeO2)', density: 7.22 },
  { name: 'Titanium Dioxide (Anatase)', density: 3.89 },
  { name: 'Titanium Dioxide (Rutile)', density: 4.23 },
  { name: 'Zinc Oxide (ZnO)', density: 5.61 },
  { name: 'Aluminum (Al)', density: 2.70 },
  { name: 'Iron (Fe)', density: 7.87 },
  { name: 'Copper (Cu)', density: 8.96 },
  { name: 'Gold (Au)', density: 19.32 }
];

const IB_PRESETS = [
  { 
    name: 'Silicon (NIST 640)', 
    data: "28.44, 0.22, 230, 1000\n47.30, 0.26, 280, 950\n56.12, 0.31, 350, 900\n69.13, 0.36, 420, 850\n76.38, 0.41, 480, 800", 
    wavelength: 1.5406, 
    k: 1.0, 
    density: 2.33,
    desc: 'High-resolution NIST silicon standard.',
    icon: '💎'
  },
  { 
    name: 'Nanocrystalline CeO2', 
    data: "28.55, 0.38, 380, 1000\n33.08, 0.44, 450, 920\n47.48, 0.52, 540, 880\n56.33, 0.59, 610, 820", 
    wavelength: 1.5406, 
    k: 1.0, 
    density: 7.22,
    desc: 'Catalytic ceria nanopowder.',
    icon: '🔶'
  },
  { 
    name: 'Zinc Oxide (ZnO Nanorods)', 
    data: "31.77, 0.28, 300, 1000\n34.42, 0.33, 340, 950\n36.25, 0.29, 310, 980\n47.54, 0.42, 430, 860\n56.60, 0.49, 500, 820", 
    wavelength: 1.5406, 
    k: 1.0, 
    density: 5.61,
    desc: 'Wurtzite structure with anisotropic growth.',
    icon: '⚡'
  },
  { 
    name: 'PET Polymer (Semi-cryst)', 
    data: "16.20, 0.55, 600, 850\n17.50, 0.48, 520, 820\n26.10, 0.42, 450, 900", 
    wavelength: 1.5406, 
    k: 0.9, 
    density: 1.38,
    desc: 'Polymer reflections with asymmetry.',
    icon: '🧵'
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
  const [selectedKType, setSelectedKType] = useState<string>('Integral Breadth');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  const kMenuRef = React.useRef<HTMLDivElement>(null);

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [isDecouplingEnabled, setIsDecouplingEnabled] = useState<boolean>(true);
  const [instBetaIB, setInstBetaIB] = useState<number>(0.05);
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [decouplingMethod, setDecouplingMethod] = useState<'linear' | 'squared' | 'hw_voigt' | 'de_keijser'>('linear');
  
  // Optional Material Density
  const [isDensityEnabled, setIsDensityEnabled] = useState<boolean>(true);
  const [materialDensity, setMaterialDensity] = useState<number>(2.33);
  const [showDensityExplanation, setShowDensityExplanation] = useState<boolean>(false);
  const [showDecouplingExplanation, setShowDecouplingExplanation] = useState<boolean>(false);

  // Active diagnostic visualizer view
  const [activeVisualTab, setActiveVisualTab] = useState<'distribution' | 'shapeMap' | 'microstructure' | 'deconvolution'>('distribution');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Default Example: 2Theta, FWHM, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 0.22, 230, 1000\n47.30, 0.26, 280, 950\n56.12, 0.31, 350, 900\n69.13, 0.36, 420, 850\n76.38, 0.41, 480, 800");
  const [results, setResults] = useState<IntegralBreadthResult[]>([]);
  const [avgSize, setAvgSize] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate realistic X-ray diffraction peak data for ${searchQuery} using Cu K-alpha radiation (1.5406 Å).
        Provide 4 to 6 major peaks. For each peak, provide:
        - twoTheta (degrees between 10 and 100)
        - fwhm (degrees between 0.15 and 0.9)
        - area (counts * degrees between 150 and 800)
        - imax (counts between 500 and 1500)
        Make sure Area and Imax are physically realistic (e.g., Area ≈ FWHM * Imax * shape_factor).
        Return ONLY a JSON array of objects.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                twoTheta: { type: Type.NUMBER },
                fwhm: { type: Type.NUMBER },
                area: { type: Type.NUMBER },
                imax: { type: Type.NUMBER }
              },
              required: ["twoTheta", "fwhm", "area", "imax"]
            }
          }
        }
      });

      if (response.text) {
        let rawText = response.text;
        rawText = rawText.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
        const data = JSON.parse(rawText);
        const formattedData = data.map((p: any) => `${p.twoTheta.toFixed(2)}, ${p.fwhm.toFixed(3)}, ${p.area.toFixed(1)}, ${p.imax.toFixed(0)}`).join('\n');
        setInputData(formattedData);
      }
    } catch (error: any) {
      console.error("Error generating data:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleCalculate = () => {
    if (isSimulationRunning) return;
    
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 400);
    setTimeout(() => setSimulationStep(3), 900);
    setTimeout(() => setSimulationStep(4), 1400);
    setTimeout(() => setSimulationStep(5), 1900);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      const peaks = parseIntegralBreadthInput(inputData);
      const computed = peaks
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
      
      setResults(computed);

      if (computed.length > 0) {
        const sum = computed.reduce((acc, curr) => acc + curr.calcSizeNm, 0);
        setAvgSize(sum / computed.length);
      } else {
        setAvgSize(0);
      }
    }, 2400);
  };

  useEffect(() => {
    // Re-calculate live if data changes and we already have results
    if (results.length > 0 && !isSimulationRunning) {
      const peaks = parseIntegralBreadthInput(inputData);
      const computed = peaks
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
      setResults(computed);
      if (computed.length > 0) {
        setAvgSize(computed.reduce((acc, curr) => acc + curr.calcSizeNm, 0) / computed.length);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instrumentalMode, instBetaIB, cagliotiU, cagliotiV, cagliotiW, decouplingMethod, materialDensity]);

  const getProfileType = (phi: number) => {
    if (phi <= 0.68) return { type: 'Lorentzian', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    if (phi >= 0.88) return { type: 'Gaussian', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    return { type: 'Pseudo-Voigt', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };
  };

  const histogramData = useMemo(() => {
    const validResults = results.filter(r => r.calcSizeNm > 0);
    if (validResults.length === 0) return [];
    
    const sizes = validResults.map(r => r.calcSizeNm);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    
    const numBins = Math.max(4, Math.min(10, Math.ceil(Math.sqrt(validResults.length))));
    let binWidth = (max - min) / numBins;
    if (binWidth === 0) binWidth = 1; 

    const rangeStart = Math.max(0, min - binWidth * 0.1);

    const bins = Array.from({ length: numBins }, (_, i) => ({
      rangeStart: rangeStart + i * binWidth,
      rangeEnd: rangeStart + (i + 1) * binWidth,
      center: rangeStart + (i + 0.5) * binWidth,
      count: 0
    }));

    sizes.forEach(size => {
      for (const bin of bins) {
        if (size >= bin.rangeStart && size < bin.rangeEnd) {
          bin.count++;
          break;
        }
      }
      if (size === bins[bins.length - 1].rangeEnd) {
        bins[bins.length - 1].count++;
      }
    });

    return bins;
  }, [results]);

  // Shape map chart data
  const shapeMapData = useMemo(() => {
    return results.map(r => ({
      twoTheta: r.twoTheta,
      phi: r.shapeFactorPhi,
      eta: r.pseudoVoigtEta || 0.5,
      calcSize: r.calcSizeNm,
      betaObs: r.betaObsDeg || r.integralBreadthDeg
    })).sort((a, b) => a.twoTheta - b.twoTheta);
  }, [results]);

  // Microstructure data
  const microstructureData = useMemo(() => {
    return results.map(r => ({
      twoTheta: `${r.twoTheta.toFixed(1)}°`,
      size: r.calcSizeNm,
      dislocation: r.dislocationDensity10_14 || 0,
      ssa: r.specificSurfaceAreaM2g || 0,
      dSpacing: r.dSpacing || 0
    }));
  }, [results]);

  // Average microstructural metrics
  const avgMetrics = useMemo(() => {
    if (results.length === 0) return null;
    const avgDisloc = results.reduce((acc, curr) => acc + (curr.dislocationDensity10_14 || 0), 0) / results.length;
    const avgSSA = results.reduce((acc, curr) => acc + (curr.specificSurfaceAreaM2g || 0), 0) / results.length;
    const avgPhi = results.reduce((acc, curr) => acc + curr.shapeFactorPhi, 0) / results.length;
    const avgEta = results.reduce((acc, curr) => acc + (curr.pseudoVoigtEta || 0.5), 0) / results.length;
    return { avgDisloc, avgSSA, avgPhi, avgEta };
  }, [results]);

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const header = "2Theta (deg),d-spacing (A),FWHM (deg),beta_Obs (deg),beta_Inst (deg),beta_Sample (deg),Shape_Factor_Phi,PV_Eta,Size (nm),Dislocation_Density (10^14 m^-2),SSA (m^2/g)\n";
    const rows = results.map(r => 
      `${r.twoTheta.toFixed(4)},${r.dSpacing?.toFixed(4) || ''},${r.fwhmObs?.toFixed(4) || ''},${(r.betaObsDeg || r.integralBreadthDeg).toFixed(4)},${r.betaInstDeg?.toFixed(4) || 0},${r.betaSampleDeg?.toFixed(4) || 0},${r.shapeFactorPhi.toFixed(4)},${r.pseudoVoigtEta?.toFixed(4) || ''},${r.calcSizeNm.toFixed(4)},${r.dislocationDensity10_14?.toFixed(4) || ''},${r.specificSurfaceAreaM2g?.toFixed(2) || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integral_breadth_analysis_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    if (results.length === 0) return;
    const data = {
      module: "Integral Breadth Analysis",
      wavelength_angstrom: wavelength,
      shape_factor_K: constantK,
      instrumental_mode: instrumentalMode,
      decoupling_method: decouplingMethod,
      material_density_g_cm3: materialDensity,
      average_size_nm: avgSize,
      peaks: results
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050A14] p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
            <img src={integralBg} alt="Integral Breadth" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />
          </div>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-4 mb-8 relative z-10 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-4">
              <div className="relative group/title-icon cursor-default">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full group-hover/title-icon:bg-purple-400/30 transition-all duration-700 pointer-events-none" />
                <div className="w-14 h-14 bg-[#0a0500] rounded-2xl border border-purple-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/title-icon:border-purple-400 transition-colors duration-500 overflow-hidden">
                  <Settings className="w-6 h-6 text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)] group-hover/title-icon:rotate-90 transition-transform duration-700" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
                  System Config
                </h2>
                <p className="flex items-center gap-2 text-[10px] font-mono text-purple-500/60 uppercase tracking-[0.3em]">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[pulse_2s_ease-in-out_infinite]" />
                  Integral Breadth Engine
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Smart Load Section */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group/load relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-purple-500/50 to-transparent opacity-0 group-hover/load:opacity-100 transition-opacity" />
              <label className="block text-[10px] font-black text-purple-400/80 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
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
                  placeholder="e.g. Zinc Oxide, Ceria, Anatase"
                  className="flex-1 pl-8 pr-4 py-3 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-lg focus:ring-1 focus:ring-purple-500/20 outline-none text-sm transition-all placeholder:text-slate-700 font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 disabled:bg-slate-800/10 disabled:text-slate-700 text-purple-400 hover:text-purple-300 font-bold rounded-lg transition-all flex items-center justify-center min-w-[90px] gap-2 border border-purple-500/30 hover:border-purple-500/60 disabled:border-slate-800 disabled:opacity-50 overflow-hidden relative"
                >
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="hidden sm:inline font-mono text-xs uppercase tracking-widest font-black">Load</span>
                </button>
              </div>
            </div>

            {/* Wavelength & Shape Factor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors relative overflow-hidden group/wave">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                  Wavelength (Å)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={String(wavelength) === 'NaN' ? '' : wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-lg focus:ring-1 focus:ring-purple-500/20 outline-none font-mono text-sm transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black text-slate-700">Å</div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {Object.entries(XRAY_WAVELENGTHS).slice(0, 4).map(([name, val]) => (
                    <button
                      key={name}
                      onClick={() => setWavelength(val)}
                      className={`py-1.5 px-0.5 rounded border text-[8px] font-black uppercase tracking-tight transition-all
                        ${wavelength === val 
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                          : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'
                        }
                      `}
                    >
                      {name.replace(' Kα', '').replace(' (avg)', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors relative">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                  Shape Factor (K)
                </label>
                <div className="relative" ref={kMenuRef}>
                  <button
                    onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                    className="w-full px-4 py-2.5 bg-[#0A101C] border border-white/10 hover:border-cyan-500/40 rounded-lg outline-none transition-all flex items-center justify-between group shadow-inner"
                  >
                    <span className="text-[10px] font-mono font-black text-cyan-400 truncate max-w-[100px]">
                      {selectedKType}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isKTypeMenuOpen && (
                      <motion.div
                        key="k-type-menu-dropdown"
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[110%] left-0 right-0 bg-[#070D18] rounded-xl border border-cyan-500/30 shadow-[0_5px_30px_rgba(0,0,0,0.5)] overflow-hidden z-[100] py-1 max-h-[250px] overflow-y-auto custom-scrollbar"
                      >
                        {K_FACTORS.map((k) => (
                          <button
                            key={k.label}
                            onClick={() => {
                              setSelectedKType(k.label);
                              if (k.value !== 0) setConstantK(k.value);
                              setIsKTypeMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 flex items-center justify-between hover:bg-cyan-500/10 transition-colors group/item relative
                              ${selectedKType === k.label ? 'bg-cyan-500/5' : ''}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm bg-black/50 w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 group-hover/item:border-cyan-500/30 transition-colors">
                                {k.icon}
                              </span>
                              <div className="flex flex-col items-start text-left">
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedKType === k.label ? 'text-cyan-400' : 'text-slate-300'}`}>
                                  {k.label} {k.value !== 0 && `(${k.value})`}
                                </span>
                                <span className="text-[8px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                                  {k.desc}
                                </span>
                              </div>
                            </div>
                            {selectedKType === k.label && <Check className="w-3 h-3 text-cyan-400 shrink-0 ml-2" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <div className="relative w-24">
                      <input
                        type="number"
                        step="0.01"
                        value={String(constantK) === 'NaN' ? '' : constantK}
                        onChange={(e) => {
                          setConstantK(parseFloat(e.target.value));
                          setSelectedKType('Custom');
                        }}
                        className="w-full px-4 py-2.5 bg-[#0A101C] text-cyan-400 border border-white/10 rounded-lg focus:border-cyan-500/50 outline-none font-mono text-xs font-black transition-all text-center focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>
                    <div className="flex-1 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5 h-full min-h-[36px]">
                      <span className="leading-tight uppercase tracking-widest font-mono text-cyan-500/80">
                        {K_FACTORS.find(k => k.label.includes(selectedKType) || k.label === selectedKType)?.desc || 'Dimensionless factor.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instrumental Broadening Card */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors shadow-inner relative group/instrument">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Instrument Broadening</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDecouplingExplanation(!showDecouplingExplanation)}
                    className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 cursor-pointer"
                  >
                    <Info className="w-3 h-3" />
                    <span>Why Decouple?</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDecouplingEnabled(!isDecouplingEnabled)}
                    className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border transition-all cursor-pointer ${
                      isDecouplingEnabled 
                        ? 'bg-purple-500 text-black border-purple-400 font-extrabold shadow-[0_0_8px_rgba(168,85,247,0.4)]' 
                        : 'bg-black/40 border-white/5 text-slate-500'
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
                    key="ib-decoupling-explanation"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3.5 bg-cyan-950/40 rounded-xl border border-cyan-500/30 text-xs space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-cyan-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        Why Decouple Instrumental Broadening?
                      </span>
                      <button 
                        onClick={() => setShowDecouplingExplanation(false)}
                        className="text-slate-400 hover:text-white text-[10px] font-mono cursor-pointer"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Observed XRD peak profile <code className="text-cyan-300 font-mono">h(2θ)</code> is the mathematical convolution of specimen broadening <code className="text-emerald-300 font-mono">f(2θ)</code> (size + strain) with instrumental optics <code className="text-purple-300 font-mono">g(2θ)</code>:
                    </p>
                    <div className="bg-black/60 p-2 rounded-lg font-mono text-[10px] text-center text-cyan-200 border border-white/5">
                      h(2θ) = (f_sample ∗ g_instrument)(2θ)
                    </div>
                    <ul className="text-[10px] text-slate-300 space-y-1 list-disc pl-4">
                      <li><strong>Without decoupling (Off / Raw):</strong> Instrument divergence artificially widens peaks, leading to <em>severe underestimation of crystallite size</em> (e.g. reporting 15 nm when real crystallites are 80 nm or bulk).</li>
                      <li><strong>Why make it optional?</strong> If you have an uncalibrated instrument with no standard (e.g. NIST 640 Si or LaB₆), turning it off gives the conservative <em>minimum apparent domain size</em>.</li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              {isDecouplingEnabled ? (
                <>
                  {/* Toggle Mode */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {(['constant', 'caglioti'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setInstrumentalMode(mode)}
                        className={`py-1.5 px-2 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer
                          ${instrumentalMode === mode 
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-black' 
                            : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'
                          }
                        `}
                      >
                        {mode === 'constant' ? 'Constant β_inst' : 'Caglioti Curve'}
                      </button>
                    ))}
                  </div>

                  {instrumentalMode === 'constant' ? (
                    <div className="space-y-2">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Constant β_IB (deg)
                      </label>
                      <input
                        type="number"
                        step="0.005"
                        min="0"
                        value={String(instBetaIB) === 'NaN' ? '' : instBetaIB}
                        onChange={(e) => setInstBetaIB(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-4 py-2.5 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-lg focus:ring-1 focus:ring-purple-500/20 outline-none font-mono text-sm transition-all"
                      />
                      <div className="flex gap-2 mt-2">
                        {[0, 0.05, 0.08, 0.12].map(val => (
                          <button 
                            key={val}
                            type="button"
                            onClick={() => setInstBetaIB(val)}
                            className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black transition-all cursor-pointer ${instBetaIB === val ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'}`}
                          >
                            {val === 0 ? '0 (Raw)' : `${val}°`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                          Diffractometer Presets
                        </label>
                        <select
                          onChange={(e) => {
                            const pr = CAGLIOTI_PRESETS[parseInt(e.target.value)];
                            if (pr) {
                              setCagliotiU(pr.u);
                              setCagliotiV(pr.v);
                              setCagliotiW(pr.w);
                            }
                          }}
                          className="w-full px-3 py-2 bg-[#0A101C] text-purple-400 border border-white/10 rounded-lg text-xs outline-none focus:border-purple-500/50 transition-all font-mono"
                          defaultValue=""
                        >
                          <option value="" disabled>-- Select Instrument Preset --</option>
                          {CAGLIOTI_PRESETS.map((preset, index) => (
                            <option key={preset.name} value={index}>
                              {preset.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 text-center mb-1 font-mono">U (tan²θ)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={String(cagliotiU) === 'NaN' ? '' : cagliotiU}
                            onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-2 bg-[#0A101C] text-purple-300 border border-white/5 rounded-lg text-center font-mono text-xs focus:border-purple-500/50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 text-center mb-1 font-mono">V (tanθ)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={String(cagliotiV) === 'NaN' ? '' : cagliotiV}
                            onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-2 bg-[#0A101C] text-purple-300 border border-white/5 rounded-lg text-center font-mono text-xs focus:border-purple-500/50 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 text-center mb-1 font-mono">W (const)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={String(cagliotiW) === 'NaN' ? '' : cagliotiW}
                            onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-2 bg-[#0A101C] text-purple-300 border border-white/5 rounded-lg text-center font-mono text-xs focus:border-purple-500/50 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-black/40 rounded-xl border border-dashed border-white/10 text-center">
                  <p className="text-[10px] font-mono text-slate-400 mb-1">
                    Instrument Deconvolution is currently <strong>DISABLED</strong>.
                  </p>
                  <p className="text-[9px] text-slate-500">
                    β_sample = β_obs (assumes ideal 0° instrument broadening).
                  </p>
                </div>
              )}
            </div>

            {/* Profile Decoupling & Material Density */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors shadow-inner relative group/decouple">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Profile Decoupling Method
                </label>
                <span className="text-[8px] text-cyan-400 font-mono font-bold uppercase tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {decouplingMethod}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { id: 'linear', label: 'Linear (Cauchy)', formula: 'β_s = β_o - β_i', desc: 'Lorentzian / Size dominant' },
                  { id: 'squared', label: 'Squared (Gauss)', formula: 'β_s² = β_o² - β_i²', desc: 'Gaussian / Strain dominant' },
                  { id: 'hw_voigt', label: 'Voigt Parabolic', formula: 'β_s² = β_o²(1-(β_i/β_o)²)', desc: 'Halder-Wagner approximation' },
                  { id: 'de_keijser', label: 'de Keijser Voigt', formula: 'D_L & ε_G separated', desc: 'Single-peak Voigt deconvolution' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setDecouplingMethod(m.id as any)}
                    className={`py-2 px-2.5 rounded-lg border text-left transition-all cursor-pointer
                      ${decouplingMethod === m.id 
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                        : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'
                      }
                    `}
                  >
                    <div className="text-[9px] font-black uppercase tracking-wider mb-0.5">{m.label}</div>
                    <div className="text-[8px] font-mono text-cyan-400/80">{m.formula}</div>
                    <div className="text-[7px] text-slate-400 truncate">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Material Density for Specific Surface Area */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Material Density ρ (g/cm³)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDensityExplanation(!showDensityExplanation)}
                      className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      title="Why use Material Density?"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsDensityEnabled(!isDensityEnabled)}
                      className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border transition-all cursor-pointer ${
                        isDensityEnabled 
                          ? 'bg-cyan-500 text-black border-cyan-400 font-extrabold' 
                          : 'bg-black/40 border-white/5 text-slate-500'
                      }`}
                    >
                      {isDensityEnabled ? 'SSA Enabled' : 'Optional (Off)'}
                    </button>
                  </div>
                </div>

                {/* Density Explanation Box */}
                <AnimatePresence>
                  {showDensityExplanation && (
                    <motion.div
                      key="ib-density-explanation"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/30 text-xs space-y-2 overflow-hidden font-mono"
                    >
                      <div className="flex items-center justify-between text-cyan-300 font-bold">
                        <span>Why use Material Density ρ (g/cm³)?</span>
                        <button onClick={() => setShowDensityExplanation(false)} className="text-slate-400 hover:text-white">✕</button>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-normal font-sans">
                        XRD measures crystallite size <code className="text-cyan-300">D</code> in nanometers. To estimate <strong>Specific Surface Area (SSA in m²/g)</strong> for powders, catalysts, or battery electrodes, mass density <code className="text-cyan-300">ρ</code> is required:
                      </p>
                      <div className="bg-black/60 p-2 rounded text-center text-cyan-300 text-[10px] border border-white/5">
                        SSA = (6 × 10³) / (ρ × D_crystallite)  [m²/g]
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans">
                        <strong>Why is it optional?</strong> If you only need domain size (nm), strain (ε), or d-spacing (Å), material density has no effect on those fundamental XRD values.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isDensityEnabled ? (
                  <>
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {MATERIAL_DENSITY_PRESETS.slice(0, 6).map(mat => (
                        <button
                          key={mat.name}
                          onClick={() => setMaterialDensity(mat.density)}
                          className={`py-1 px-1 rounded text-[8px] font-mono truncate border transition-all cursor-pointer ${
                            materialDensity === mat.density 
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold' 
                              : 'bg-black/30 border-white/5 text-slate-500 hover:text-slate-300'
                          }`}
                          title={`${mat.name}: ${mat.density} g/cm³`}
                        >
                          {mat.name.split(' ')[0]} ({mat.density})
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={String(materialDensity) === 'NaN' ? '' : materialDensity}
                        onChange={(e) => setMaterialDensity(parseFloat(e.target.value) || 2.33)}
                        className="w-full px-3 py-1.5 bg-[#0A101C] text-cyan-300 border border-white/10 rounded-lg text-xs font-mono outline-none focus:border-cyan-500/50"
                        placeholder="Custom density..."
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-mono">g/cm³</span>
                    </div>
                  </>
                ) : (
                  <div className="p-2.5 bg-black/40 rounded-lg border border-dashed border-white/5 text-center text-[9px] text-slate-500 font-mono">
                    Density calculations disabled. SSA will be omitted.
                  </div>
                )}
              </div>
            </div>

            {/* Peak Data Input */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 relative overflow-hidden group/data hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Binary className="w-3.5 h-3.5" />
                  Peak Data Input
                </label>
                <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <span>2θ, FWHM, Area, Imax</span>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {IB_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setInputData(p.data);
                      setWavelength(p.wavelength);
                      setConstantK(p.k);
                      setMaterialDensity(p.density);
                      const kMatch = K_FACTORS.find(kf => kf.value === p.k);
                      if (kMatch) setSelectedKType(kMatch.label);
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-[#0A101C] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group/btn"
                  >
                    <span className="text-sm bg-black/50 w-7 h-7 flex items-center justify-center rounded-lg border border-white/5 group-hover/btn:border-emerald-500/30 shrink-0">
                      {p.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-300 group-hover/btn:text-emerald-400 transition-colors truncate">{p.name}</span>
                      <span className="text-[8px] font-mono text-slate-500 truncate">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative font-mono text-xs">
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/50 rounded-lg focus:ring-1 focus:ring-emerald-500/20 outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700"
                  placeholder="28.44, 0.22, 230, 1000&#10;47.30, 0.26, 280, 950"
                  spellCheck="false"
                />
              </div>
            </div>

            {!isSimulationRunning ? (
              <button
                onClick={handleCalculate}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Execute Analysis
              </button>
            ) : (
              <div className="bg-[#070D18] p-5 rounded-2xl border border-purple-500/30 overflow-hidden relative shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" /> Computing Profile Breadth
                </h4>
                <div className="space-y-3 relative z-10 w-full flex flex-col">
                  {[
                    { step: 1, label: 'Evaluating Peak Profile Integrals', icon: Database },
                    { step: 2, label: 'Calibrating Instrumental Broadening', icon: Zap },
                    { step: 3, label: 'Evaluating Shape Factor (φ) & η Parameter', icon: Atom },
                    { step: 4, label: 'Decoupling Sample Broadening Profile', icon: Activity },
                    { step: 5, label: 'Formulating Microstructural Domain Metrics', icon: Check }
                  ].map((s) => {
                     const Icon = s.icon;
                     const isActive = simulationStep === s.step;
                     const isDone = simulationStep > s.step;
                     return (
                       <div key={s.step} className={`flex items-center gap-3 w-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                         <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isActive ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                           <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                         </div>
                         <div className="flex-1 flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-purple-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                             {s.label}
                           </span>
                           {isActive && <div className="h-0.5 bg-gradient-to-r from-purple-500 to-transparent w-full mt-1.5 animate-pulse rounded-full" />}
                         </div>
                       </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-[#050A14] p-8 rounded-3xl text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-1000 mix-blend-screen">
            <img src={integralBg} alt="Integral Breadth Context" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />
          </div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-[#070D18] rounded-xl border border-cyan-500/30">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Theoretical Foundations</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Integral Breadth & Shape Factor</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integral Breadth (β)</span>
              </div>
              <div 
                className="bg-[#0A101C] p-3 rounded-xl font-mono text-xs text-cyan-400 overflow-x-auto border border-white/5 text-center"
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(
                    "\\beta = \\frac{\\int I(2\\theta) d(2\\theta)}{I_{\\max}} = \\frac{\\text{Area}}{I_{\\max}}",
                    { throwOnError: false }
                  )
                }}
              />
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shape Factor (φ = 2w / β)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <span className="font-bold text-blue-400">Lorentzian (Cauchy)</span>
                  <span className="font-mono text-blue-300 font-bold">φ ≈ 2/π = 0.6366</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <span className="font-bold text-emerald-400">Gaussian</span>
                  <span className="font-mono text-emerald-300 font-bold">φ ≈ 2√(ln2/π) = 0.9394</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                  <span className="font-bold text-purple-400">Pseudo-Voigt</span>
                  <span className="font-mono text-purple-300 font-bold">0.6366 &lt; φ &lt; 0.9394</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Column */}
      <div className="lg:col-span-8 space-y-6">
        {results && results.length > 0 && results[0] && (
          <ScientificMathControl
            title="Integral Breadth Mathematical Verification"
            formula="\beta = \frac{\text{Area}}{I_{max}}, \quad D = \frac{K \cdot \lambda}{\beta_{\text{sample}} \cdot \cos\theta}"
            description="Integral breadth (β) incorporates the full profile integral for size evaluation. Unlike single-point FWHM, β is insensitive to asymmetric peak tails."
            variables={[
              { symbol: 'β_obs', name: 'Observed Integral Breadth', value: results[0].betaObsDeg || results[0].integralBreadthDeg, unit: 'deg' },
              { symbol: 'β_inst', name: 'Instrumental Resolution', value: results[0].betaInstDeg || 0, unit: 'deg' },
              { symbol: 'β_sample', name: 'Net Sample Broadening', value: results[0].betaSampleDeg || 0, unit: 'deg' },
              { symbol: 'φ', name: 'Shape Factor (FWHM/β)', value: results[0].shapeFactorPhi, unit: '' },
              { symbol: 'η', name: 'Pseudo-Voigt Lorentzian Fraction', value: results[0].pseudoVoigtEta || 0.5, unit: '' }
            ]}
            result={results[0].calcSizeNm}
            resultUnit="nm"
            resultName="Crystallite Grain Size (D)"
          />
        )}

        {/* Multi-Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Average Crystallite Size */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Atom className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Average Size (D)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">{avgSize.toFixed(precision)}</span>
                <span className="text-sm font-black text-cyan-400 uppercase">nm</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              From {results.length} reflections
            </div>
          </div>

          {/* Average Shape Factor */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Binary className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Mean Shape (φ)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {avgMetrics ? avgMetrics.avgPhi.toFixed(3) : '-'}
                </span>
                <span className="text-xs font-bold text-purple-400">
                  {avgMetrics ? (avgMetrics.avgPhi > 0.88 ? 'Gauss' : avgMetrics.avgPhi < 0.68 ? 'Lorentz' : 'P-Voigt') : ''}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              η ≈ {avgMetrics ? avgMetrics.avgEta.toFixed(2) : '-'} (Lorentz fraction)
            </div>
          </div>

          {/* Dislocation Density */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-amber-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Dislocation (δ)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {avgMetrics ? avgMetrics.avgDisloc.toFixed(2) : '-'}
                </span>
                <span className="text-xs font-bold text-amber-400">× 10¹⁴ m⁻²</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              δ = 1 / D² lattice strain metric
            </div>
          </div>

          {/* Specific Surface Area */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Specific Area (SSA)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {avgMetrics ? avgMetrics.avgSSA.toFixed(1) : '-'}
                </span>
                <span className="text-xs font-bold text-emerald-400">m²/g</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              ρ = {materialDensity} g/cm³
            </div>
          </div>
        </div>

        {/* Visualizer Tabs Container */}
        {results.length > 0 && (
          <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-2">
                {[
                  { id: 'distribution', label: 'Size Distribution', icon: BarChart2 },
                  { id: 'shapeMap', label: 'Shape Factor φ Map', icon: Binary },
                  { id: 'microstructure', label: 'Microstructure (δ & SSA)', icon: Cpu },
                  { id: 'deconvolution', label: 'Decoupled Breadths', icon: Layers }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeVisualTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveVisualTab(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-inner'
                          : 'bg-[#070D18] text-slate-500 hover:text-slate-300 border border-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-[#070D18] hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" /> CSV Export
                </button>
                <button
                  onClick={handleCopyJSON}
                  className="px-3 py-1.5 bg-[#070D18] hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3 h-3" /> {copiedNotification ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>

            {/* Tab View 1: Size Distribution & 3D Morphology */}
            {activeVisualTab === 'distribution' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[320px]">
                <div className="xl:col-span-8 flex flex-col">
                  <div className="flex-1 w-full min-h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="center" 
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#334155' }}
                          axisLine={{ stroke: '#334155' }}
                          label={{ value: 'Crystallite Size [nm]', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <YAxis 
                          allowDecimals={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#334155' }}
                          axisLine={{ stroke: '#334155' }}
                          label={{ value: 'Frequency Count', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#0A101C] border border-cyan-500/30 p-3 rounded-xl shadow-xl font-mono text-xs">
                                  <p className="text-cyan-400 font-bold mb-1 border-b border-white/10 pb-1 uppercase tracking-widest">
                                    {data.rangeStart.toFixed(1)} - {data.rangeEnd.toFixed(1)} nm
                                  </p>
                                  <div className="flex justify-between items-center gap-4 mt-2">
                                    <span className="text-slate-400 uppercase tracking-wider text-[10px]">Count</span>
                                    <span className="text-white font-black text-sm">{data.count}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {histogramData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="rgba(6, 182, 212, 0.8)" stroke="rgba(6, 182, 212, 1)" strokeWidth={1} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="xl:col-span-4 flex flex-col bg-[#070D18] rounded-2xl border border-white/5 p-4">
                  <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Atom className="w-3.5 h-3.5" /> Morphological Projection
                  </h4>
                  <div className="flex-1 w-full rounded-xl overflow-hidden min-h-[200px]">
                    <MorphologyVisualizer kType={selectedKType} sizeNm={avgSize} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab View 2: Shape Factor φ Map */}
            {activeVisualTab === 'shapeMap' && (
              <div className="flex flex-col min-h-[320px]">
                <div className="mb-3 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Profile Shape Factor (φ = FWHM/β) vs Reflection Angle (2θ)</span>
                  <div className="flex items-center gap-3 text-[9px]">
                    <span className="text-blue-400">■ Lorentzian (&lt;0.68)</span>
                    <span className="text-purple-400">■ Pseudo-Voigt (0.68-0.88)</span>
                    <span className="text-emerald-400">■ Gaussian (&gt;0.88)</span>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={shapeMapData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="twoTheta" 
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Diffraction Angle 2θ (°)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <YAxis 
                        domain={[0.5, 1.1]}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tickLine={{ stroke: '#334155' }}
                        axisLine={{ stroke: '#334155' }}
                        label={{ value: 'Shape Factor (φ = 2w/β)', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#0A101C] border border-purple-500/30 p-3 rounded-xl shadow-xl font-mono text-xs text-white">
                                <p className="text-purple-400 font-bold mb-1 border-b border-white/10 pb-1">Reflection: {d.twoTheta.toFixed(2)}° 2θ</p>
                                <p className="text-slate-300 mt-1">Shape Factor φ: <span className="font-bold text-cyan-300">{d.phi.toFixed(4)}</span></p>
                                <p className="text-slate-300">Pseudo-Voigt η: <span className="font-bold text-purple-300">{d.eta.toFixed(3)}</span></p>
                                <p className="text-slate-300">Apparent Size: <span className="font-bold text-emerald-300">{d.calcSize.toFixed(2)} nm</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="phi" stroke="#a855f7" strokeWidth={2} dot={{ r: 6, fill: '#c084fc', stroke: '#581c87', strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tab View 3: Microstructure (Dislocation & SSA) */}
            {activeVisualTab === 'microstructure' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[320px]">
                <div className="bg-[#070D18] p-4 rounded-2xl border border-white/5 flex flex-col">
                  <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Dislocation Density δ (× 10¹⁴ m⁻²)
                  </h4>
                  <div className="flex-1 w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={microstructureData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="twoTheta" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="dislocation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#070D18] p-4 rounded-2xl border border-white/5 flex flex-col">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" /> Specific Surface Area SSA (m²/g)
                  </h4>
                  <div className="flex-1 w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={microstructureData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="twoTheta" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="ssa" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Tab View 4: Decoupled Profile Comparison */}
            {activeVisualTab === 'deconvolution' && (
              <div className="flex flex-col min-h-[320px]">
                <div className="mb-3 text-[10px] font-mono text-slate-400">
                  Observed (β_obs), Instrumental (β_inst), and Net Sample (β_sample) Integral Breadths across Reflections
                </div>
                <div className="flex-1 w-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={results.map(r => ({
                      twoTheta: `${r.twoTheta.toFixed(1)}°`,
                      betaObs: r.betaObsDeg || r.integralBreadthDeg,
                      betaInst: r.betaInstDeg || 0,
                      betaSample: r.betaSampleDeg || 0
                    }))} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="twoTheta" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} unit="°" />
                      <Tooltip />
                      <Bar dataKey="betaObs" name="β_Observed" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="betaInst" name="β_Instrument" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="betaSample" name="β_Sample" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Results Table */}
        <div className="bg-[#050A14] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col relative group">
          <div className="p-5 border-b border-white/5 bg-[#070D18] flex justify-between items-center relative">
            <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs flex items-center gap-3">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </div>
              Reflection Deconstruction & Microstructure Table
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 shadow-inner">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                {results.length} Peaks
              </span>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-500 p-12 text-center m-6 rounded-2xl bg-[#070D18] border border-white/5 border-dashed relative">
                <Calculator className="w-10 h-10 mb-4 opacity-20 text-cyan-500" />
                <p className="font-black uppercase tracking-widest text-slate-400 mb-2">No data calculated</p>
                <p className="text-xs font-mono text-slate-600">Awaiting parameter input for integral breadth analysis.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-[#070D18] sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th scope="col" className="px-4 py-3 border-b border-white/5">2θ (DEG)</th>
                    <th scope="col" className="px-4 py-3 border-b border-white/5 text-purple-400">Shape (φ)</th>
                    <th scope="col" className="px-4 py-3 border-b border-white/5">Profile Type</th>
                    <th scope="col" className="px-4 py-3 border-b border-white/5 text-cyan-400">β_obs (°)</th>
                    <th scope="col" className="px-4 py-3 border-b border-white/5 text-purple-400">β_sample (°)</th>
                    <th scope="col" className="px-4 py-3 border-b border-white/5 text-amber-400">δ (10¹⁴ m⁻²)</th>
                    <th scope="col" className="px-4 py-3 border-b border-white/5 text-right text-emerald-400">Size (NM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent font-mono text-xs">
                  {results.map((res, index) => {
                    const profile = getProfileType(res.shapeFactorPhi);
                    return (
                      <tr key={`${res.twoTheta}-${index}`} className="hover:bg-cyan-500/5 transition-colors group/row">
                        <td className="px-4 py-3 font-bold text-slate-200">
                          {res.twoTheta.toFixed(precision)}°
                        </td>
                        <td className="px-4 py-3 text-purple-400">
                          {res.shapeFactorPhi.toFixed(3)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${profile.bg} ${profile.color}`}>
                            {profile.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-cyan-400 font-bold">
                          {(res.betaObsDeg || res.integralBreadthDeg).toFixed(4)}°
                        </td>
                        <td className="px-4 py-3 text-purple-300">
                          {res.betaSampleDeg !== undefined ? res.betaSampleDeg.toFixed(4) : (res.integralBreadthDeg).toFixed(4)}°
                        </td>
                        <td className="px-4 py-3 text-amber-400">
                          {res.dislocationDensity10_14 ? res.dislocationDensity10_14.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-400 text-sm">
                          {res.calcSizeNm.toFixed(precision)} nm
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
