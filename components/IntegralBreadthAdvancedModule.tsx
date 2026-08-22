import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSettings, convertLength, convertToAngstrom } from './SettingsContext';
import { parseIBAdvancedInput, calculateIBAdvanced, XRAY_WAVELENGTHS } from '../utils/physics';
import { IBAdvancedResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import katex from 'katex';
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
  Info, 
  FileText, 
  ArrowUpRight, 
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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';

const MATERIAL_PRESETS = [
  { 
    label: 'Silicon (Si) NIST 640', 
    data: "28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800",
    desc: 'Standard Reference Material',
    youngsModulus: 130
  },
  { 
    label: 'Cerium Oxide (CeO2)', 
    data: "28.55, 310, 1200\n33.08, 410, 1100\n47.48, 550, 1000\n56.33, 620, 950\n59.08, 680, 900",
    desc: 'Nanocrystalline Ceria (High Strain)',
    youngsModulus: 220
  },
  { 
    label: 'Titanium Dioxide (Anatase)', 
    data: "25.28, 380, 1150\n37.80, 440, 1020\n48.05, 520, 980\n53.89, 580, 920\n55.06, 610, 890\n62.69, 700, 840",
    desc: 'Tetragonal Anatase Nanopowder',
    youngsModulus: 178
  },
  { 
    label: 'Zinc Oxide (ZnO)', 
    data: "31.77, 300, 1200\n34.42, 340, 1150\n36.25, 310, 1250\n47.54, 430, 1050\n56.60, 500, 980\n62.86, 560, 930",
    desc: 'Wurtzite Nanorods (Anisotropic)',
    youngsModulus: 140
  },
  { 
    label: 'Aluminum (Al)', 
    data: "38.47, 450, 1100\n44.72, 480, 1050\n65.10, 520, 1000\n78.23, 560, 950",
    desc: 'Annealed Aluminum powder',
    youngsModulus: 70
  },
  { 
    label: 'Iron (Fe) Nanoparticles', 
    data: "44.67, 850, 900\n65.02, 920, 850\n82.33, 1100, 800",
    desc: 'High-anisotropy Fe grains',
    youngsModulus: 211
  },
  { 
    label: 'Stainless Steel 316L', 
    data: "43.6, 320, 1000\n50.8, 380, 950\n74.7, 450, 850\n90.7, 520, 800\n95.9, 580, 750",
    desc: 'Austenitic SS (Cold Worked)',
    youngsModulus: 193
  }
];

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown morphologies', icon: '⚡' },
  { label: 'Integral Breadth', value: 1.0, desc: 'Exact factor when using Integral Breadth (Recommended)', icon: '∫' },
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
  const [decouplingMethod, setDecouplingMethod] = useState<'linear' | 'squared'>('linear');
  const [separationMethod, setSeparationMethod] = useState<'udm' | 'hw' | 'ssp' | 'udedm'>('udm');
  const [youngsModulusGPa, setYoungsModulusGPa] = useState<number>(130);

  // Active diagnostic visualizer tab
  const [activeChartTab, setActiveChartTab] = useState<'fit' | 'residuals' | 'apparentSizes' | 'elasticState'>('fit');

  // Input Data: 2Theta, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800");
  const [result, setResult] = useState<IBAdvancedResult | null>(null);
  
  const [isWavelengthMenuOpen, setIsWavelengthMenuOpen] = useState(false);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIAL_PRESETS[0].label);
  const [selectedKType, setSelectedKType] = useState<string>('Integral Breadth');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  const [showInfiniteExpl, setShowInfiniteExpl] = useState(false);
  const [showStrainExpl, setShowStrainExpl] = useState(false);

  // AI smart load
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const matMenuRef = useRef<HTMLDivElement>(null);
  const kMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsWavelengthMenuOpen(false);
      }
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
  };

  const handleClear = () => {
    setInputData("");
  };

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

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
      const peaks = parseIBAdvancedInput(inputData);
      const computed = calculateIBAdvanced(
        wavelength,
        constantK,
        instBetaIB,
        peaks,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        decouplingMethod,
        youngsModulusGPa > 0 ? youngsModulusGPa : undefined,
        separationMethod
      );
      setResult(computed);
    }, 2400);
  };

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate realistic multi-reflection XRD integral breadth data for ${searchQuery} using Cu K-alpha (1.5406 Å).
        Provide 5 to 7 high-quality peaks. For each peak, provide:
        - twoTheta (between 20 and 90 degrees)
        - area (integrated intensity area in counts*deg, e.g. 200 to 750)
        - imax (maximum peak intensity counts, e.g. 700 to 1400)
        Ensure realistic progression where beta = Area/Imax increases with 2theta.
        Return ONLY a JSON array of objects.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                twoTheta: { type: Type.NUMBER },
                area: { type: Type.NUMBER },
                imax: { type: Type.NUMBER }
              },
              required: ["twoTheta", "area", "imax"]
            }
          }
        }
      });

      if (response.text) {
        let rawText = response.text;
        rawText = rawText.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
        const data = JSON.parse(rawText);
        const formattedData = data.map((p: any) => `${p.twoTheta.toFixed(2)}, ${p.area.toFixed(1)}, ${p.imax.toFixed(0)}`).join('\n');
        setInputData(formattedData);
        setSelectedMaterial(`AI: ${searchQuery}`);
      }
    } catch (error: any) {
      console.error("Error generating advanced IB data:", error);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    // Recompute automatically if result is active
    if (result && !isSimulationRunning) {
      const peaks = parseIBAdvancedInput(inputData);
      if (peaks.length >= 2) {
        const computed = calculateIBAdvanced(
          wavelength,
          constantK,
          instBetaIB,
          peaks,
          instrumentalMode,
          { U: cagliotiU, V: cagliotiV, W: cagliotiW },
          decouplingMethod,
          youngsModulusGPa > 0 ? youngsModulusGPa : undefined,
          separationMethod
        );
        setResult(computed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instBetaIB, instrumentalMode, cagliotiU, cagliotiV, cagliotiW, decouplingMethod, youngsModulusGPa, separationMethod]);

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "2Theta,d_spacing_A,beta_Sample_deg,X_Coord,Y_Coord,Y_Fit,Residual,Single_Peak_Size_nm\n";
    const rows = (result.pointsExtended || []).map((p, idx) => {
      const pt = result.points[idx] || { x: 0, y: 0 };
      const fitY = result.regression.slope * pt.x + result.regression.intercept;
      return `${p.twoTheta.toFixed(4)},${p.dSpacing?.toFixed(4) || ''},${p.betaSampleDeg.toFixed(4)},${pt.x.toFixed(6)},${pt.y.toFixed(6)},${fitY.toFixed(6)},${(pt.y - fitY).toFixed(6)},${p.singlePeakSizeNm.toFixed(2)}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ib_advanced_${separationMethod}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!result) return [];
    const stdDev = Math.sqrt(
      result.points.reduce((sum, pt) => {
        const yPred = result.regression.slope * pt.x + result.regression.intercept;
        return sum + Math.pow(pt.y - yPred, 2);
      }, 0) / Math.max(1, result.points.length - 2)
    );
    const confidenceBound = stdDev * 2.0;

    return result.points.map((p, i) => {
      const fitY = result.regression.slope * p.x + result.regression.intercept;
      const ext = result.pointsExtended ? result.pointsExtended[i] : null;
      return {
        x: p.x,
        y: p.y,
        fit: fitY,
        fitRange: [Math.max(0, fitY - confidenceBound), fitY + confidenceBound],
        residual: p.y - fitY,
        twoTheta: p.twoTheta || ext?.twoTheta,
        betaSample: p.betaSample || ext?.betaSampleDeg,
        singleSize: ext?.singlePeakSizeNm || 0
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
        xLabel = 'X (4sinθ/√(E/2))';
        yLabel = 'Y (βcosθ)';
      }

      return (
        <div className="bg-[#0A101C] text-white p-4 rounded-xl shadow-[0_0_30px_rgba(244,114,182,0.15)] border border-pink-500/30 text-xs font-mono">
          <p className="font-black mb-3 text-pink-400 border-b border-white/5 pb-2 uppercase tracking-widest">
            Reflection at {d.twoTheta?.toFixed(2)}° 2θ
          </p>
          <div className="space-y-2 text-[10px]">
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">β_sample</span> <span className="text-pink-300 font-bold">{d.betaSample?.toFixed(4)}°</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">{xLabel}</span> <span className="text-cyan-300 font-bold">{d.x?.toExponential(3)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">{yLabel}</span> <span className="text-cyan-300 font-bold">{d.y?.toExponential(3)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Apparent Size</span> <span className="text-emerald-300 font-bold">{d.singleSize > 0 ? `${d.singleSize.toFixed(1)} nm` : '> 200 nm'}</span></p>
            <p className="flex justify-between gap-6 border-t border-white/5 pt-2 mt-2">
              <span className="text-slate-500 uppercase">Residual (ΔY)</span>
              <span className={`font-bold ${d.residual > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {d.residual > 0 ? '+' : ''}{d.residual?.toExponential(2)}
              </span>
            </p>
          </div>
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
      case 'udm':
      default:
        return "\\beta \\cos\\theta = \\frac{K\\lambda}{D} + 4 \\varepsilon \\sin\\theta";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050A14] p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          {/* Custom Background Graphic */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000 mix-blend-screen">
            <img src={voigtBg} alt="Voigt Configuration" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A14] via-[#050A14]/80 to-[#050A14]/30" />
          </div>
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-700 pointer-events-none" />

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-pink-500 blur-md opacity-20" />
                <div className="p-2.5 bg-[#070D18] rounded-xl border border-pink-500/30 relative">
                  <Settings2 className="w-5 h-5 text-pink-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-widest uppercase">IB Adv Config</h2>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">
                  Size-strain deconvolution
                </p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-pink-400 bg-white/5 hover:bg-pink-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-pink-500/30 transition-all flex items-center gap-1.5 mt-1 relative overflow-hidden group/btn"
              title="Reset to defaults"
            >
              <RefreshCw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" /> Reset
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            {/* AI Smart Load Input */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all group/load relative overflow-hidden">
              <label className="block text-[10px] font-black text-pink-400/80 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
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
                  placeholder="e.g. Ceria, Anatase, Zinc Oxide"
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

            {/* Parameters Box */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-pink-500/30 transition-colors shadow-inner relative overflow-hidden group/params">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                Diffraction Parameters
              </h3>

              <div className="space-y-4">
                <div className="relative z-20" ref={menuRef}>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                    Source Wavelength ({lengthUnit})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={String(wavelength) === 'NaN' ? '' : convertLength(wavelength, lengthUnit)}
                      onChange={(e) => setWavelength(convertToAngstrom(Number(e.target.value), lengthUnit))}
                      className="w-full px-4 py-2.5 bg-[#0A101C] text-pink-300 border border-white/10 focus:border-pink-500/50 rounded-lg focus:ring-1 focus:ring-pink-500/20 outline-none font-mono text-sm transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black text-slate-700">{lengthUnit}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {Object.entries(XRAY_WAVELENGTHS).slice(0, 4).map(([name, val]) => (
                      <button
                        key={name}
                        onClick={() => setWavelength(val)}
                        className={`py-1.5 px-0.5 rounded border text-[8px] font-black uppercase tracking-tight transition-all
                          ${wavelength === val 
                            ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' 
                            : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'
                          }
                        `}
                      >
                        {name.replace(' Kα', '').replace(' (avg)', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div ref={kMenuRef} className="relative z-10">
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                      Shape Factor (K)
                    </label>
                    <div className="flex gap-2">
                       <button
                        onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                        className="flex-1 px-4 py-2.5 bg-[#0A101C] text-pink-300 border border-white/10 hover:border-pink-500/40 rounded-lg outline-none transition-all flex items-center justify-between group shadow-inner"
                       >
                         <span className="text-[10px] font-mono font-black text-pink-400 truncate max-w-[120px]">
                           {selectedKType}
                         </span>
                         <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                       </button>
                       <input
                          type="number"
                          step="0.01"
                          value={String(constantK) === 'NaN' ? '' : constantK}
                          onChange={(e) => {
                            setConstantK(parseFloat(e.target.value));
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
                                setConstantK(k.value);
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

                  {/* Instrumental Broadening Mode Picker */}
                  <div className="pt-3 mt-3 border-t border-white/5 space-y-4">
                    <h4 className="flex justify-between items-center text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Instrumental Resolution</span>
                    </h4>

                    <div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setInstrumentalMode('constant')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                            instrumentalMode === 'constant'
                              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                              : 'bg-[#0A101C] border-white/5 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          Constant β_inst
                        </button>
                        <button
                          type="button"
                          onClick={() => setInstrumentalMode('caglioti')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                            instrumentalMode === 'caglioti'
                              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                              : 'bg-[#0A101C] border-white/5 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          Caglioti Curve
                        </button>
                      </div>

                      {instrumentalMode === 'constant' ? (
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.005"
                            value={String(instBetaIB) === 'NaN' ? '' : instBetaIB}
                            onChange={(e) => setInstBetaIB(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2 bg-[#0A101C] text-amber-300 border border-white/10 focus:border-amber-500/50 rounded-lg focus:ring-1 focus:ring-amber-500/20 outline-none font-mono text-xs transition-all"
                            placeholder="e.g. 0.05"
                          />
                          <div className="flex gap-2">
                            {[0, 0.05, 0.08, 0.12].map(val => (
                              <button 
                                key={val}
                                type="button"
                                onClick={() => setInstBetaIB(val)}
                                className={`flex-1 py-1 rounded-lg border text-[9px] font-black transition-all ${instBetaIB === val ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'}`}
                              >
                                {val === 0 ? '0 (Raw)' : `${val}°`}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 bg-[#0A101C] p-3 rounded-xl border border-amber-500/10 shadow-inner">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">U</span>
                              <input
                                type="number"
                                step="0.001"
                                value={String(cagliotiU) === 'NaN' ? '' : cagliotiU}
                                onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 rounded text-center outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">V</span>
                              <input
                                type="number"
                                step="0.001"
                                value={String(cagliotiV) === 'NaN' ? '' : cagliotiV}
                                onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 rounded text-center outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">W</span>
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

                  {/* Size-Strain Separation Model section */}
                  <div className="pt-3 mt-3 border-t border-white/5 space-y-4">
                    <h4 className="flex justify-between items-center text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">
                      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Separation Method</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'udm', label: 'UDM (W-H)', desc: 'Uniform Deformation' },
                        { id: 'hw', label: 'Halder-Wagner', desc: 'Parabolic Voigt' },
                        { id: 'ssp', label: 'SSP Plot', desc: 'Size-Strain Plot' },
                        { id: 'udedm', label: 'UDEDM', desc: 'Strain Energy Model' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSeparationMethod(m.id as any)}
                          className={`py-2 px-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border text-center ${
                            separationMethod === m.id
                              ? 'bg-pink-500/20 border-pink-500/60 text-pink-300 shadow-inner'
                              : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                          }`}
                          title={m.desc}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDecouplingMethod('linear')}
                        className={`py-2 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                          decouplingMethod === 'linear'
                            ? 'bg-pink-500/15 border-pink-500/50 text-pink-300'
                            : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Linear (Lorentz)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecouplingMethod('squared')}
                        className={`py-2 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                          decouplingMethod === 'squared'
                            ? 'bg-pink-500/15 border-pink-500/50 text-pink-300'
                            : 'bg-[#0A101C] border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Squared (Gauss)
                      </button>
                    </div>

                    <div>
                      <div className="bg-[#0A101C] rounded-lg border border-white/5 p-3 space-y-2 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Young's Modulus (E)</span>
                          <span className="text-xs font-mono font-black text-pink-400">{youngsModulusGPa} GPa</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="600"
                          step="1"
                          value={String(youngsModulusGPa) === 'NaN' ? '' : youngsModulusGPa}
                          onChange={(e) => setYoungsModulusGPa(parseInt(e.target.value) || 130)}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Presets & Peak Data */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors shadow-inner relative group/params">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-pink-400" />
                  Presets & Data
                </h3>
                <button 
                  onClick={handleClear}
                  className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Clear
                </button>
              </div>
              
              <div className={`relative mb-4 ${isMaterialMenuOpen ? 'z-50' : 'z-10'}`} ref={matMenuRef}>
                <button
                  onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                  className="w-full px-3 py-2 bg-[#0A101C] border border-white/10 hover:border-emerald-500/40 rounded-lg outline-none transition-all flex items-center justify-between shadow-inner"
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
                  placeholder="28.44, 230, 1000&#10;47.30, 280, 950"
                  className="w-full h-32 px-4 py-3 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/50 rounded-lg focus:ring-1 focus:ring-emerald-500/20 outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700 shadow-inner"
                  spellCheck="false"
                />
                <div className="absolute top-2 right-2 text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black px-2 py-0.5 rounded border border-white/10">
                  2θ, Area, Imax
                </div>
              </div>
            </div>

            {!isSimulationRunning ? (
              <button
                onClick={handleCalculate}
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
                    { step: 1, label: 'Parsing Profile Breadths', icon: Database },
                    { step: 2, label: 'Calibrating Instrumental Broadening', icon: FlaskConical },
                    { step: 3, label: 'Decoupling Sample Broadening', icon: Activity },
                    { step: 4, label: `Executing ${separationMethod.toUpperCase()} Regression`, icon: Layers },
                    { step: 5, label: 'Deriving Elastic Stress & Energy Tensors', icon: CheckCircle }
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
            description={`${separationMethod === 'udm' ? 'Uniform Deformation Model (UDM)' : separationMethod === 'hw' ? 'Halder-Wagner (HW) Voigt parabolic deconvolution' : separationMethod === 'ssp' ? 'Size-Strain Plot (SSP) method' : 'Uniform Deformation Energy Density Model (UDEDM)'} separating strain and crystallite size contributions.`}
            variables={[
              { symbol: 'Slope', name: 'Regression Slope', value: result.regression.slope, unit: '' },
              { symbol: 'Intercept', name: 'Regression Intercept', value: result.regression.intercept, unit: '' },
              { symbol: 'R²', name: 'Coefficient of Determination', value: result.regression.rSquared, unit: '' },
              { symbol: 'Adj R²', name: 'Adjusted R-Squared', value: result.regression.adjustedRSquared || result.regression.rSquared, unit: '' },
              { symbol: 'E', name: 'Young\'s Modulus', value: youngsModulusGPa, unit: 'GPa' }
            ]}
            result={result.sizeInterceptNm}
            resultUnit="nm"
            resultName="Unified Crystallite Size (D)"
          />
        )}

        {/* Multi-Card Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Crystallite Size */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Box className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Unified Size (D)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {result && result.sizeInterceptNm > 0 && result.sizeInterceptNm < 1000 ? result.sizeInterceptNm.toFixed(1) : '> 250'}
                </span>
                <span className="text-sm font-black text-emerald-400 uppercase">nm</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              Intercept Derived
            </div>
          </div>

          {/* Microstrain */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-cyan-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Microstrain (ε)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {result ? (result.strainPercent / 100 * 1000).toFixed(2) : '-'}
                </span>
                <span className="text-xs font-bold text-cyan-400">× 10⁻³</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              {result ? `${result.strainPercent.toFixed(3)}% strain` : '-'}
            </div>
          </div>

          {/* Stress & Energy */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-pink-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Internal Stress (σ)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {result && result.stressMPa !== undefined ? result.stressMPa.toFixed(1) : '-'}
                </span>
                <span className="text-xs font-bold text-pink-400">MPa</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono">
              u = {result?.energyDensityKjM3?.toFixed(2) || '-'} kJ/m³
            </div>
          </div>

          {/* Fit Quality R² */}
          <div className="bg-gradient-to-br from-[#050A14] via-[#081020] to-[#050A14] p-5 rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Fit Quality (R²)</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {result ? result.regression.rSquared.toFixed(4) : '-'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Adj R²: {result?.regression.adjustedRSquared ? result.regression.adjustedRSquared.toFixed(3) : '-'}</span>
              <span>r = {result?.regression.pearsonR ? result.regression.pearsonR.toFixed(3) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Visualizer Tabs Header */}
        <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative flex flex-col overflow-hidden">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-white/5 relative z-10">
            <div className="flex items-center gap-2">
              {[
                { id: 'fit', label: `${separationMethod.toUpperCase()} Regression Plot`, icon: TrendingUp },
                { id: 'residuals', label: 'Residuals Diagnostic', icon: Activity },
                { id: 'apparentSizes', label: 'Reflection Apparent Sizes', icon: BarChart2 },
                { id: 'elasticState', label: 'Microstructural Tensors', icon: Cpu }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeChartTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChartTab(tab.id as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-inner'
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
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 bg-[#070D18] hover:bg-pink-500/10 text-slate-400 hover:text-pink-300 border border-white/5 hover:border-pink-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Download className="w-3 h-3" /> Export CSV
              </button>
              <button
                onClick={handleCopyJSON}
                className="px-3 py-1.5 bg-[#070D18] hover:bg-purple-500/10 text-slate-400 hover:text-purple-300 border border-white/5 hover:border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3 h-3" /> {copiedNotification ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
          </div>

          {/* Tab 1: Regression Chart */}
          {activeChartTab === 'fit' && (
            <div className="flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-2 px-2 text-[10px] font-mono text-slate-400">
                <span>Model: <span className="text-pink-400 font-bold">{separationMethod.toUpperCase()}</span></span>
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
                      label={{ value: separationMethod === 'hw' ? 'X = β/(tanθ·sinθ)' : separationMethod === 'ssp' ? 'X = d²·βcosθ' : separationMethod === 'udedm' ? 'X = 4sinθ/√(E/2)' : 'X = 4 sin(θ)', position: 'bottom', offset: 20, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                      tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                      tickFormatter={(val) => val.toExponential(1)}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      label={{ value: separationMethod === 'hw' ? 'Y = (β/tanθ)²' : separationMethod === 'ssp' ? 'Y = (d·βcosθ)²' : 'Y = β_sample cos(θ)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
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
                      name="Reflections" 
                      dataKey="y" 
                      fill="#f472b6" 
                      shape="circle"
                      r={5}
                    />
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
                Fit Residuals (Observed Y - Fitted Y) across reflection angles 2θ (Checks for systematic strain anisotropy)
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
                      label={{ value: 'Residual (Y - Fit)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
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
                Local Apparent Crystallite Size Dhkl for each reflection compared to Global W-H Size
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
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 4: Elastic State */}
          {activeChartTab === 'elasticState' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px] overflow-y-auto custom-scrollbar">
              <div className="bg-[#070D18] p-5 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-xs font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> Continuum Elastic Properties
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
                    <span className="text-slate-400">Internal Lattice Stress (σ = ε·E):</span>
                    <span className="text-pink-300 font-bold">{result?.stressMPa?.toFixed(2) || '-'} MPa</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Strain Energy Density (u = ½·ε²·E):</span>
                    <span className="text-amber-300 font-bold">{result?.energyDensityKjM3?.toFixed(3) || '-'} kJ/m³</span>
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
                    <span className="text-slate-400">Slope Standard Error:</span>
                    <span className="text-cyan-300 font-bold">{result?.regression.stdErrorSlope?.toExponential(3) || '-'}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-400">Intercept Standard Error:</span>
                    <span className="text-cyan-300 font-bold">{result?.regression.stdErrorIntercept?.toExponential(3) || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Peak Deconstruction Table */}
        {result && result.pointsExtended && result.pointsExtended.length > 0 && (
          <div className="bg-[#050A14] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-6 relative z-10 px-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Peak Deconstruction & Calculated Sizes</h3>
                <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">
                  Individual reflection analysis under {decouplingMethod === 'linear' ? 'Lorentzian' : 'Gaussian'} deconvolution
                </p>
              </div>
            </div>

            <div className="relative z-10 overflow-x-auto rounded-xl border border-white/5 bg-[#070D18]/60 shadow-inner">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[9px] text-slate-500 font-sans uppercase tracking-widest font-black">
                    <th className="px-4 py-3 text-emerald-400">Reflection (2θ)</th>
                    <th className="px-4 py-3">β_Obs (°)</th>
                    <th className="px-4 py-3">β_Inst (°)</th>
                    <th className="px-4 py-3">β_Sample (°)</th>
                    <th className="px-4 py-3 font-sans font-black text-pink-400">Apparent Size (nm)</th>
                    <th className="px-4 py-3 text-right">Regression (X, Y)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {result.pointsExtended.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group/row">
                      <td className="px-4 py-3 font-bold text-emerald-400">
                        {p.twoTheta.toFixed(3)}°
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {p.betaObsDeg.toFixed(4)}°
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.betaInstDeg.toFixed(4)}°
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {p.betaSampleDeg > 0 ? `${p.betaSampleDeg.toFixed(4)}°` : '0.0000°'}
                      </td>
                      <td className="px-4 py-3 font-bold text-pink-400">
                        {p.singlePeakSizeNm > 0 && p.singlePeakSizeNm < 1000 ? (
                          `${p.singlePeakSizeNm.toFixed(2)} nm`
                        ) : (
                          <span className="text-amber-400 text-[10px] uppercase font-black">&gt; 200 nm (∞)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[10px] text-slate-500">
                        ({p.x.toFixed(4)}, {p.y.toExponential(3)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
