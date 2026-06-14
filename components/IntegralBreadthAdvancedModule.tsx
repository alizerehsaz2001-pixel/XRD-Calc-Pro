import React, { useState, useEffect, useRef } from 'react';
import { parseIBAdvancedInput, calculateIBAdvanced, XRAY_WAVELENGTHS } from '../utils/physics';
import { IBAdvancedResult } from '../types';
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
  Area
} from 'recharts';
import { RefreshCw, Trash2, Settings2, Info, FileText, ArrowUpRight, TrendingUp, ChevronDown, Zap, Download, Database, Activity, Layers, CheckCircle, FlaskConical, Loader2, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MATERIAL_PRESETS = [
  { 
    label: 'Silicon (Si) Standard', 
    data: "28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800",
    desc: 'NIST 640 Silicon peaks',
    youngsModulus: 130
  },
  { 
    label: 'Cerium Oxide (CeO2)', 
    data: "28.55, 310, 1200\n33.08, 410, 1100\n47.48, 550, 1000\n56.33, 620, 950\n59.08, 680, 900",
    desc: 'Nanocrystalline Ceria (High Strain)',
    youngsModulus: 220
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
  },
  { 
    label: 'Ti-6Al-4V (Grade 5)', 
    data: "35.1, 410, 1100\n38.4, 460, 1050\n40.2, 490, 1000\n53.0, 580, 900\n63.3, 650, 850",
    desc: 'Alpha-phase Titanium Alloy',
    youngsModulus: 113
  }
];

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies', icon: '⚡' },
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical particles (FWHM-based)', icon: '⚪' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Tetrahedral', value: 0.73, desc: 'Calculated for triangular/tetrahedral geometries', icon: '▲' },
  { label: 'Platelets/Disks', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Integral Breadth', value: 1.0, desc: 'Theoretical value when using Integral Breadth instead of FWHM', icon: '∫' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

export const IntegralBreadthAdvancedModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instBetaIB, setInstBetaIB] = useState<number>(0.1);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [decouplingMethod, setDecouplingMethod] = useState<'linear' | 'squared'>('linear');
  const [youngsModulusGPa, setYoungsModulusGPa] = useState<number>(130);

  // Default Data: 2Theta, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800");
  const [result, setResult] = useState<IBAdvancedResult | null>(null);
  
  const [isWavelengthMenuOpen, setIsWavelengthMenuOpen] = useState(false);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIAL_PRESETS[0].label);
  const [selectedKType, setSelectedKType] = useState<string>('Standard Average');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  const [showInfiniteExpl, setShowInfiniteExpl] = useState(false);
  const [showStrainExpl, setShowStrainExpl] = useState(false);

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
    setConstantK(0.9);
    setInstBetaIB(0.1);
    setInputData(MATERIAL_PRESETS[0].data);
    setSelectedMaterial(MATERIAL_PRESETS[0].label);
    setInstrumentalMode('constant');
    setCagliotiU(0.005);
    setCagliotiV(-0.002);
    setCagliotiW(0.015);
    setDecouplingMethod('linear');
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
    
    setTimeout(() => setSimulationStep(2), 600);
    setTimeout(() => setSimulationStep(3), 1400);
    setTimeout(() => setSimulationStep(4), 2200);
    setTimeout(() => setSimulationStep(5), 3000);
    
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
        youngsModulusGPa > 0 ? youngsModulusGPa : undefined
      );
      setResult(computed);
    }, 3800);
  };

  useEffect(() => {
    setResult(null); // Clear result when inputs change to enforce re-analyzing
  }, [wavelength, constantK, instBetaIB, inputData, instrumentalMode, cagliotiU, cagliotiV, cagliotiW, decouplingMethod, youngsModulusGPa]);

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "2Theta,4sin(theta),beta_IB*cos(theta),Fit\n";
    const rows = chartData.map(d => `${d.twoTheta?.toFixed(4) || 0},${d.x.toFixed(6)},${d.y.toFixed(6)},${d.fit.toFixed(6)}`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ib_advanced_plot_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare chart data
  const chartData = result ? result.points.map(p => {
    const fitY = result.regression.slope * p.x + result.regression.intercept;
    const stdDev = Math.sqrt(
      result.points.reduce((sum, pt) => {
        const yPred = result.regression.slope * pt.x + result.regression.intercept;
        return sum + Math.pow(pt.y - yPred, 2);
      }, 0) / Math.max(1, result.points.length - 2)
    );
    const confidenceBound = stdDev * 2.1; // 95% CI roughly
    return {
      x: p.x,
      y: p.y,
      fit: fitY,
      fitRange: [Math.max(0, fitY - confidenceBound), fitY + confidenceBound],
      deviation: p.y - fitY,
      twoTheta: p.twoTheta,
      betaSample: p.betaSample
    };
  }).sort((a,b) => a.x - b.x) : [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#0A101C] text-white p-4 rounded-xl shadow-[0_0_30px_rgba(244,114,182,0.15)] border border-pink-500/30 text-xs font-mono">
          <p className="font-black mb-3 text-pink-400 border-b border-white/5 pb-2 uppercase tracking-widest">Peak at {d.twoTheta?.toFixed(2)}°</p>
          <div className="space-y-2 text-[10px]">
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">β_IB Sample</span> <span className="text-pink-300 font-bold">{d.betaSample?.toFixed(4)}°</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">X (4sinθ)</span> <span className="text-cyan-300 font-bold">{d.x?.toFixed(5)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Y (βcosθ)</span> <span className="text-cyan-300 font-bold">{d.y?.toFixed(5)}</span></p>
            <p className="flex justify-between gap-6 border-t border-white/5 pt-2 mt-2">
              <span className="text-slate-500 uppercase">Deviation</span>
              <span className={`font-bold ${d.deviation > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {d.deviation > 0 ? '+' : ''}{d.deviation?.toExponential(2)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(244,114,182,0.05)] border border-pink-500/20 relative group transition-all hover:border-pink-500/40">
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-pink-500/20 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl translate-y-16 -translate-x-16 group-hover:bg-purple-500/20 transition-all duration-700"></div>
          </div>

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
                  Size-strain separation
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
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-pink-500/30 transition-colors shadow-inner relative overflow-hidden group/params">
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-pink-500 to-purple-500 rounded-bl-full pointer-events-none group-hover/params:opacity-10 transition-opacity"></div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                Parameters
              </h3>

              <div className="space-y-4">
                <div className="relative z-20" ref={menuRef}>
                  <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                    Source Wavelength (Å)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      value={wavelength}
                      onChange={(e) => setWavelength(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#0A101C] text-pink-300 border border-white/10 focus:border-pink-500/50 rounded-lg focus:ring-1 focus:ring-pink-500/20 outline-none font-mono text-sm transition-all shadow-inner"
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
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-mono font-black text-pink-400 truncate max-w-[100px]">
                            {selectedKType}
                           </span>
                         </div>
                         <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                       </button>
                       <input
                          type="number"
                          step="0.01"
                          value={constantK}
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
                      <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Instrumental Broadening</span>
                    </h4>

                    <div>
                      <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest flex justify-between items-center">
                        <span>Calibration Mapping Curve</span>
                      </label>
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
                          Caglioti Polynomial
                        </button>
                      </div>

                      {instrumentalMode === 'constant' ? (
                        <div>
                          <label className="block text-[9px] font-black text-slate-600 mb-1.5 uppercase tracking-[0.15em] flex justify-between items-center">
                            <span>Resolution β_IB (DEG)</span>
                            <span className="text-[8px] text-amber-600/60 font-mono">Constant</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={instBetaIB}
                            onChange={(e) => setInstBetaIB(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 bg-[#0A101C] text-amber-300 border border-white/10 focus:border-amber-500/50 rounded-lg focus:ring-1 focus:ring-amber-500/20 outline-none font-mono text-sm transition-all"
                            placeholder="e.g. 0.05"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2.5 bg-[#0A101C] p-3 rounded-xl border border-amber-500/10 shadow-inner">
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/80 block mb-1">
                            Polynomial: β_inst² = U·tan²θ + V·tanθ + W
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">U-param</span>
                              <input
                                type="number"
                                step="0.001"
                                value={cagliotiU}
                                onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 focus:border-amber-500/50 rounded uppercase text-center focus:ring-1 focus:ring-amber-500/20 outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">V-param</span>
                              <input
                                type="number"
                                step="0.001"
                                value={cagliotiV}
                                onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 focus:border-amber-500/50 rounded uppercase text-center focus:ring-1 focus:ring-amber-500/20 outline-none"
                              />
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">W-param</span>
                              <input
                                type="number"
                                step="0.001"
                                value={cagliotiW}
                                onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-[#070D18] text-amber-300 font-mono text-xs border border-white/5 focus:border-amber-500/50 rounded uppercase text-center focus:ring-1 focus:ring-amber-500/20 outline-none"
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
                      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Size-Strain Separation</span>
                    </h4>
                    
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                        Profile Broadening Deconvolution
                        <span title="Governs how the instrumental error is subtracted mathematically from observed breadth">
                          <Info className="w-3 h-3 text-slate-600 cursor-help" />
                        </span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDecouplingMethod('linear')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                            decouplingMethod === 'linear'
                              ? 'bg-pink-500/10 border-pink-500/50 text-pink-400'
                              : 'bg-[#0A101C] border-white/5 text-slate-400 hover:text-slate-300'
                          }`}
                          title="Linear subtraction appropriate for Lorentzian/Cauchy peak profiles (β_sample = β_obs - β_inst)"
                        >
                          Linear (Lorentz)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecouplingMethod('squared')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                            decouplingMethod === 'squared'
                              ? 'bg-pink-500/10 border-pink-500/50 text-pink-400'
                              : 'bg-[#0A101C] border-white/5 text-slate-400 hover:text-slate-300'
                          }`}
                          title="Quadratic separation appropriate for pure Gaussian peak profiles (β_sample² = β_obs² - β_inst²)"
                        >
                          Squared (Gauss)
                        </button>
                      </div>
                      <div className="mt-2 flex flex-col gap-1 text-[8.5px] font-bold text-slate-400 bg-[#0A101C]/80 p-2.5 rounded-lg border border-pink-500/10 font-mono">
                        <div className="flex items-center gap-1.5 text-pink-400 uppercase tracking-wider">
                          <span className="text-pink-500">&gt;</span> Method: {decouplingMethod === 'linear' ? 'Linear Subtraction' : 'Quadratic Subtraction'}
                        </div>
                        <div className="text-slate-500 leading-normal uppercase">
                          {decouplingMethod === 'linear'
                            ? 'Mathematical Best-Fit for Lorentzian/Cauchy profiles.'
                            : 'Mathematical Best-Fit for Gaussian / Dislocation profiles.'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-[0.2em] flex justify-between items-center">
                        <span>Uniform Stress Deformation (USDM)</span>
                      </label>
                      <div className="bg-[#0A101C] rounded-lg border border-white/5 p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Young's Modulus (E)</span>
                          <span className="text-[8px] text-pink-600/50 font-mono uppercase font-black tracking-widest">GPa</span>
                        </div>
                        <input
                          type="number"
                          step="1"
                          value={youngsModulusGPa ?? 0}
                          onChange={(e) => setYoungsModulusGPa(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-[#070D18] text-pink-300 border border-white/10 focus:border-pink-500/50 rounded-lg outline-none font-mono text-xs transition-all focus:ring-1 focus:ring-pink-500/20"
                          placeholder="e.g. 130 for Silicon"
                        />
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-wider pt-1 border-t border-white/5">
                          * Determines Uniform Stress and Strain Energy Density limits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors shadow-inner relative group/params">
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-pink-500 to-purple-500 rounded-bl-full pointer-events-none group-hover/params:opacity-10 transition-opacity overflow-hidden"></div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                Material Presets
              </h3>
              
              <div className={`relative mb-6 ${isMaterialMenuOpen ? 'z-50' : 'z-10'}`} ref={matMenuRef}>
                <button
                  onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                  className="w-full px-4 py-2.5 bg-[#0A101C] border border-white/10 hover:border-emerald-500/40 rounded-lg outline-none transition-all flex items-center justify-between shadow-inner"
                >
                  <span className="text-sm font-black text-emerald-300">
                    {selectedMaterial}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isMaterialMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMaterialMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-1.5 backdrop-blur-3xl ring-1 ring-white/10"
                    >
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {MATERIAL_PRESETS.map((m) => (
                          <button
                            key={m.label}
                            onClick={() => {
                              setSelectedMaterial(m.label);
                              setInputData(m.data);
                              if (m.youngsModulus) {
                                setYoungsModulusGPa(m.youngsModulus);
                              }
                              setIsMaterialMenuOpen(false);
                            }}
                            className={`w-full px-4 py-3 flex flex-col items-start hover:bg-white/5 transition-colors rounded-xl ${selectedMaterial === m.label ? 'bg-emerald-500/10' : ''}`}
                          >
                            <span className={`text-sm font-black ${selectedMaterial === m.label ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {m.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                              {m.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMaterial('Custom Data');
                          setIsMaterialMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl ${selectedMaterial === 'Custom Data' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300'}`}
                      >
                        <span className="text-sm font-black">Custom Data</span>
                        <Settings2 className="w-3.5 h-3.5 opacity-50" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-end mb-4">
                <label className="block text-[10px] font-black text-emerald-400/80 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Peak Data Input
                </label>
                <button 
                  onClick={handleClear}
                  className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/30"
                >
                  <Trash2 className="w-2.5 h-2.5" /> Clear
                </button>
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
                <div className="absolute top-2 right-2 text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black px-2 py-1 rounded border border-white/10 shadow-md">
                  FMT: 2θ, Area, Imax
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                   <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                   β = <span className="text-emerald-400">A / I0</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[8px] text-slate-500 font-mono font-black uppercase">Vecs:</span>
                   <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm border ${parseIBAdvancedInput(inputData).length >= 2 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-400 bg-amber-500/10 border-amber-500/30'}`}>
                     {parseIBAdvancedInput(inputData).length}
                   </span>
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
                {parseIBAdvancedInput(inputData).length >= 2 && <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
                <TrendingUp className={`w-5 h-5 ${parseIBAdvancedInput(inputData).length >= 2 ? 'group-hover:scale-110 transition-transform' : ''}`} />
                Analyze Data
              </button>
            ) : (
              <div className="bg-[#070D18] p-5 rounded-2xl border border-pink-500/30 overflow-hidden relative shadow-[inset_0_0_20px_rgba(244,114,182,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-2xl rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-pink-400 animate-spin" /> Advanced Analysis Running
                </h4>
                <div className="space-y-3 relative z-10 w-full flex flex-col">
                  {[
                    { step: 1, label: 'Parsing Reflectivity Integrals', icon: Database },
                    { step: 2, label: instrumentalMode === 'constant' ? 'Applying Constant β_inst' : 'Computing Caglioti IRF', icon: FlaskConical },
                    { step: 3, label: decouplingMethod === 'linear' ? 'Lorentzian Deconvolution' : 'Gaussian Deconvolution', icon: Activity },
                    { step: 4, label: 'Computing W-H Regression Matrix', icon: Layers },
                    { step: 5, label: 'Extracting Elastic Tensors', icon: CheckCircle }
                  ].map((s) => {
                     const Icon = s.icon;
                     const isActive = simulationStep === s.step;
                     const isDone = simulationStep > s.step;
                     return (
                       <div key={s.step} className={`flex items-center gap-3 w-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                         <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isActive ? 'bg-pink-500/20 border-pink-500/50 text-pink-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                           <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                         </div>
                         <div className="flex-1 flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-pink-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                             {s.label}
                           </span>
                           {isActive && <div className="h-0.5 bg-gradient-to-r from-pink-500 to-transparent w-full mt-1.5 animate-pulse rounded-full" />}
                         </div>
                       </div>
                     );
                  })}
                </div>
              </div>
            )}

            {result && (
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 flex flex-col gap-3 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated Size</span>
                  <span className="text-sm font-black font-mono text-emerald-400">{result.sizeInterceptNm > 0 && result.sizeInterceptNm < 1000 ? result.sizeInterceptNm.toFixed(2) : '> 250 nm (∞)'} <span className="text-[10px] opacity-50 font-sans tracking-widest uppercase">NM</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Microstrain</span>
                  <span className="text-sm font-black font-mono text-cyan-400">{(result.strainPercent / 100 * 10000).toFixed(2)} <span className="text-[10px] opacity-50 font-sans tracking-widest uppercase">× 10⁻⁴</span></span>
                </div>
              </div>
            )}
            
            <div className="bg-[#0A101C] rounded-xl p-4 border border-white/5 overflow-hidden relative group/json shadow-inner">
               <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Output JSON</span>
                 <button onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result,null,2))} className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-pink-400 transition-colors bg-white/5 hover:bg-pink-500/10 px-2 py-1 rounded border border-white/10 hover:border-pink-500/30">Copy</button>
               </div>
               <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto max-h-32 custom-scrollbar opacity-70 group-hover/json:opacity-100 transition-opacity">
                 {result ? JSON.stringify({
                   module: "IB-Advanced",
                   method: "W-H Plot",
                   correction: "Linear",
                   results: {
                     strain_percent: result.strainPercent,
                     size_intercept_nm: result.sizeInterceptNm,
                     r_squared: result.regression.rSquared
                   }
                 }, null, 2) : "// No data calculated"}
               </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        {/* Results Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Card 1: Microstrain */}
           <div className="bg-[#050B14]/90 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/10 hover:border-cyan-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(34,211,238,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] transition-all duration-700 pointer-events-none group-hover:bg-cyan-500/20 translate-x-10 -translate-y-10" />
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] transition-all duration-700 pointer-events-none group-hover:bg-blue-500/20 -translate-x-10 translate-y-10" />
             
             <div>
               <div className="flex items-center gap-3 mb-4 relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[inset_0_2px_10px_rgba(34,211,238,0.2)]">
                   <Activity className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                 </div>
                 <p className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.3em]">Microstrain (ε)</p>
               </div>
               
               <div className="flex flex-col mt-2 relative z-10">
                 <div className="flex items-baseline gap-2">
                   <p className="text-3xl sm:text-4xl font-black text-white group-hover:text-cyan-50 transition-colors drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] font-mono tracking-tight tracking-tighter">
                     {result ? (result.strainPercent / 100).toExponential(2).split('e')[0] : '-'}
                   </p>
                   {result && (
                     <span className="text-sm font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                       × 10<sup className="text-[10px]">{result.strainPercent === 0 ? '0' : (result.strainPercent / 100).toExponential(2).split('e')[1].replace('+', '')}</sup>
                     </span>
                   )}
                 </div>
                 
                 {result && (
                   <div className="flex items-center gap-2 mt-3">
                     <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                     <p className="text-xs text-slate-400 font-mono font-medium">
                       <span className="text-slate-500 mr-1">Percentage:</span>
                       <span className="text-cyan-200/70">{result.strainPercent.toFixed(4)}%</span>
                     </p>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-6 relative z-10 w-full pt-4 border-t border-white/5">
                <span className="text-[9px] font-black text-cyan-500 bg-cyan-500/5 px-2 py-1.5 rounded-lg border border-cyan-500/10 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  W-H Slope Derived
                </span>
                <button
                  onClick={() => {
                    setShowStrainExpl(!showStrainExpl);
                    setShowInfiniteExpl(false);
                  }}
                  className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1.5 rounded-lg border border-cyan-500/20 uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>{showStrainExpl ? 'Close Help' : 'What is Strain?'}</span>
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                </button>
             </div>
           </div>
           
           {/* Card 2: Crystallite Size */}
           <div className="bg-[#0A101C]/90 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700 translate-x-10 -translate-y-10" />
             
             <div>
               <div className="flex items-center gap-3 mb-4 relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[inset_0_2px_10px_rgba(16,185,129,0.2)]">
                   <Box className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                 </div>
                 <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.3em]">Crystallite Size</p>
               </div>
               
               <div className="relative z-10 mt-2">
                 {result ? (
                   result.sizeInterceptNm > 0 && result.sizeInterceptNm < 1000 ? (
                     <div className="flex flex-col">
                       <div className="flex items-baseline gap-2">
                         <p className="text-3xl sm:text-4xl font-black text-white group-hover:text-emerald-50 transition-colors drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] font-mono tracking-tighter">
                           {result.sizeInterceptNm.toFixed(1)}
                         </p>
                         <span className="text-sm font-black text-emerald-500/80 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">nm</span>
                       </div>
                       <div className="flex items-center gap-2 mt-3">
                         <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                           Global W-H Intercept
                         </p>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col justify-center h-[70px] bg-amber-500/5 rounded-2xl border border-amber-500/10 px-4 py-2">
                       <div className="flex items-baseline gap-2">
                         <p className="text-2xl font-black text-amber-400 tracking-tight font-mono">
                           &gt; 250 <span className="text-sm text-amber-500/80 uppercase">nm</span>
                         </p>
                         <span className="text-[10px] font-bold text-amber-500/70 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                           ({result.regression.intercept <= 0 ? 'Negative / ∞' : '∞'})
                         </span>
                       </div>
                       <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mt-1">
                         Beyond typical XRD resolution limit
                       </p>
                     </div>
                   )
                 ) : (
                   <p className="text-3xl font-black text-white font-mono opacity-50">- <span className="text-sm uppercase tracking-widest text-slate-600">nm</span></p>
                 )}
               </div>
             </div>
             
             {result && result.pointsExtended && result.pointsExtended.length > 0 && (
               <div className="mt-4 pt-3 border-t border-white/5 relative z-10 flex-1 flex flex-col">
                 <p className="text-[8px] font-black text-emerald-400/60 uppercase tracking-widest flex items-center justify-between mb-2">
                    <span>Individual Peak Estimates</span>
                    <span className="text-slate-500">Apparent Size</span>
                 </p>
                 <div className="space-y-1.5 max-h-[85px] overflow-y-auto custom-scrollbar pr-1 flex-1">
                   {result.pointsExtended.map((p, i) => (
                     <div key={i} className="flex justify-between items-center text-[10px] font-mono bg-emerald-500/5 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 transition-colors">
                       <span className="text-slate-400 font-medium">{p.twoTheta.toFixed(2)}° <span className="text-[8px] text-slate-600 font-sans ml-0.5">2θ</span></span>
                       {p.singlePeakSizeNm > 0 && p.singlePeakSizeNm < 1000 ? (
                         <span className="text-emerald-300 font-bold">{p.singlePeakSizeNm.toFixed(1)} <span className="text-[8px] font-sans text-emerald-500/50 ml-0.5">nm</span></span>
                       ) : (
                         <span className="text-amber-400/80 font-bold text-[9px] flex items-center gap-1">
                           &gt; 200 nm <span className="text-[8px] text-amber-600 font-sans tracking-none">(∞)</span>
                         </span>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <div className="flex items-center justify-between mt-4 relative z-10 w-full pt-4 border-t border-white/5">
               <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-1.5 rounded-lg border border-emerald-500/10 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Y-Intercept Derived
               </span>
               {result && (result.sizeInterceptNm <= 0 || result.pointsExtended?.some(p => p.singlePeakSizeNm <= 0 || p.singlePeakSizeNm >= 1000)) && (
                 <button
                   onClick={() => setShowInfiniteExpl(!showInfiniteExpl)}
                   className="text-[9px] font-black text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/20 uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                 >
                   <span>{showInfiniteExpl ? 'Close Help' : 'Why Infinite?'}</span>
                   <Info className="w-3 h-3" />
                 </button>
               )}
             </div>
           </div>

           {/* Card 3: Isotropic Elastic Stress */}
           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden group hover:border-cyan-400/40 transition-all flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-bl-full transition-all group-hover:scale-110" />
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Elastic Properties</p>
               {result && result.stressMPa !== undefined ? (
                 <div className="mt-2 relative z-10 space-y-1">
                   <div>
                     <span className="text-[8px] font-bold text-slate-500 uppercase block">Stress (σ)</span>
                     <p className="text-xl font-black text-white hover:text-cyan-50 transition-colors">
                       {result.stressMPa.toFixed(1)} <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">MPa</span>
                     </p>
                   </div>
                   <div>
                     <span className="text-[8px] font-bold text-slate-500 uppercase block">Energy Den. (u)</span>
                     <p className="text-xs font-black text-cyan-300 font-mono">
                       {result.energyDensityKjM3?.toFixed(2)} <span className="text-[9px] text-slate-500 uppercase">kJ/m³</span>
                     </p>
                   </div>
                 </div>
               ) : (
                 <div className="mt-2 relative z-10 text-slate-600 text-xs py-1.5 uppercase font-black tracking-widest">
                   No Modulus Set
                 </div>
               )}
             </div>
             <p className="text-[8px] font-black text-cyan-400 bg-cyan-400/15 px-2 py-1 rounded inline-block mt-3 border border-cyan-400/20 uppercase tracking-widest relative z-10 w-fit">
               {youngsModulusGPa && youngsModulusGPa > 0 ? `E = ${youngsModulusGPa} GPa` : 'Isotropic Model'}
             </p>
           </div>

           {/* Card 4: Fit Quality */}
           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden group hover:border-purple-500/40 transition-all flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full transition-all group-hover:scale-110" />
             <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Fit Quality (R²)</p>
               <p className="text-2xl font-black text-white relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] mt-2">
                 {result ? result.regression.rSquared.toFixed(4) : '-'}
               </p>
             </div>
             <div className="mt-4 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 relative z-10">
               {result && result.regression.rSquared > 0.95 ? (
                  <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><ArrowUpRight className="w-3.5 h-3.5" /> Excellent Fit</span>
               ) : result && result.regression.rSquared > 0.8 ? (
                  <span className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">Acceptable Fit</span>
               ) : result ? (
                  <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">Poor Fit</span>
               ) : (
                  <span className="text-slate-600 bg-white/5 opacity-50 px-2 py-1 rounded border border-white/10">AWAITING DATA</span>
               )}
             </div>
           </div>
        </div>

        {/* Collapsible Scientific Explanation sheet for Infinities */}
        <AnimatePresence>
          {showInfiniteExpl && result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-[#0D1527] border border-amber-500/25 rounded-[2rem] p-6 text-slate-300 space-y-4 shadow-[0_0_40px_rgba(245,158,11,0.05)] relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-bl-full pointer-events-none" />
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/15 rounded-xl border border-amber-500/30 text-amber-400 mt-0.5 animate-pulse-slow">
                    <Info className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1">
                      Scientific Advisory: Resolving "Infinite" Crystallite Sizes
                    </h4>
                    <p className="text-[10px] text-amber-400 uppercase font-black tracking-widest font-mono">
                      Physics &amp; Numerical Regression Analysis Guidelines
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5 text-[11px] leading-relaxed font-sans">
                  <div className="space-y-2">
                    <p className="font-bold text-slate-200">
                      1. Why does the calculation return <span className="text-emerald-400 font-mono italic">Infinite (&infin;)</span>?
                    </p>
                    <p className="text-slate-400 text-[10.5px]">
                      The Williamson-Hall equation calculates crystallite size from the y-intercept of the regression line, where:
                      <br />
                      <span className="block my-2 py-1.5 bg-black/40 text-center rounded font-mono text-xs text-white border border-white/5">
                        D = ( K &middot; &lambda; ) / ( &beta;_intercept &middot; cos &theta; &middot; 10 )
                      </span>
                      If the trendline's y-intercept (&beta;_intercept) is <span className="font-semibold text-amber-400">equal to or less than zero</span>, solving for crystallite size (D) yields infinitely large or physically impossible negative values. In materials science, this confirms that size-broadening is entirely negligible compared to strain.
                    </p>
                    
                    <p className="font-bold text-slate-200 pt-2">
                      2. Physical Resolution Limits (&gt; 200 nm):
                    </p>
                    <p className="text-slate-400 text-[10.5px]">
                      In standard diffractometers, peak broadening has an instrumental threshold. When crystallite sizes exceed **100&ndash;300 nm**, their size-broadening contribution becomes so microscopically small that the observed peak width (&beta;_obs) matches the instrumental width (&beta;_inst). Net sample broadening becomes &beta;_sample &approx; 0. Physically, the material has transitioned from nano-crystalline to macro-crystalline.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 font-mono">Likely Diagnoses</span>
                      <ul className="list-disc pl-4 mt-2 space-y-1.5 text-slate-400 text-[10.5px]">
                        <li>
                          <strong className="text-slate-200">Microstrain Dominance:</strong> High lattice deformation creates a steep slope on the W-H plot, pulling the y-axis intersection below zero.
                        </li>
                        <li>
                          <strong className="text-slate-200">Overstated Resolution (&beta;_inst):</strong> If configured instrumental width was set too close to or exceeds observed peaks, the sample broadening calculates to &le; 0.
                        </li>
                        <li>
                          <strong className="text-slate-200">Anisotropic Broadening:</strong> Different peak families (hkl directions) widen unevenly, skewing the global linear trendline fit.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1.5">
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block font-mono">Suggested Fixes:</span>
                      <ul className="list-decimal pl-4 space-y-0.5 text-slate-400 text-[10px]">
                        <li>Slightly reduce <span className="text-amber-400 font-mono">&beta;_inst</span> in the "Instrumental Broadening" panel.</li>
                        <li>Review and trim noisy high-angle peaks causing trendline skew.</li>
                        <li>Try toggling the <span className="text-pink-400 font-semibold font-mono">Profile Deconvolution</span> from Linear to Squared.</li>
                        <li>Consider transitioning to the <strong className="text-emerald-400">Warren-Averbach</strong> Fourier module for strain/size allocation.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsible Scientific Explanation sheet for Microstrain */}
        <AnimatePresence>
          {showStrainExpl && result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-[#0B1221] border border-cyan-500/20 rounded-[2rem] p-6 text-slate-300 space-y-4 shadow-[0_0_40px_rgba(6,182,212,0.05)] relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.02] rounded-bl-full pointer-events-none" />
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-500/15 rounded-xl border border-cyan-500/30 text-cyan-400 mt-0.5 animate-pulse-slow font-sans text-sm">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1">
                      Crystallographic Microstrain (ε) Physical Foundations
                    </h4>
                    <p className="text-[10px] text-cyan-400 uppercase font-black tracking-widest font-mono">
                      Mathematical separation of size-strain broadening effects
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-white/5 text-[11px] leading-relaxed font-sans">
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-200">
                        1. Theoretical Separation Model
                      </p>
                      <p className="text-slate-400 text-[10.5px] mt-1 text-justify">
                        Peak broadening in X-ray diffraction patterns arises from two non-instrumental, sample-dependent phenomena: finite grain sizes (<span className="text-emerald-400 italic font-medium">Size Broadening</span>) and structural irregularities within the grains (<span className="text-cyan-400 italic font-medium">Strain Broadening</span>).
                      </p>
                    </div>

                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">Governing Equations:</span>
                      <div className="text-slate-400 text-[10.5px] space-y-2">
                        <div>
                          The Scherrer model for size effect:
                          <code className="block my-1 px-2 py-1 bg-black/50 text-emerald-400 rounded text-[10px] font-mono text-center">
                            β_size = (K · λ) / (D · cos θ)
                          </code>
                        </div>
                        <div>
                          The Wilson equation for inhomogeneous microstrain:
                          <code className="block my-1 px-2 py-1 bg-black/50 text-cyan-400 rounded text-[10px] font-mono text-center">
                            β_strain = 4 · ε · tan θ
                          </code>
                        </div>
                        <div>
                          By assuming Lorentzian peak shapes, we combine them linearly:
                          <code className="block mt-1 px-2 py-1 bg-black/50 text-pink-400 rounded text-[10px] font-mono text-center">
                            β_total · cos θ = (K · λ / D) + 4 · ε · sin θ
                          </code>
                        </div>
                        <p className="text-[9.5px] font-sans mt-2">
                          The slope of the linear fit is <span className="text-cyan-400 font-bold">ε</span> (Crystallographic Microstrain) and the y-intercept yields <span className="text-emerald-400 font-bold">D</span> (Unified average crystallite size).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-justify">
                      <span className="text-[9px] font-black uppercase text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/10 font-mono">Physical Origins of Microstrain</span>
                      <p className="text-slate-400 text-[10.5px] mt-2">
                        Unlike macroscopic tensile stress which uniformally shifts peak centers, <strong className="text-slate-200">microstrain (ε)</strong> represents random deviations in interplanar <span className="italic font-medium">d-spacing</span> (Δd/d) within individual crystal planes, generating peak broadening:
                      </p>
                      <ul className="list-disc pl-4 mt-2 space-y-1.5 text-slate-400 text-[10.5px]">
                        <li>
                          <strong className="text-slate-200">Dislocation Core Strain:</strong> Distortions of atom alignments adjacent to defects, generating deep localized mechanical strain fields.
                        </li>
                        <li>
                          <strong className="text-slate-200">Grain Boundary Friction:</strong> Misorientations and atom constraints at nanocrystalline boundaries.
                        </li>
                        <li>
                          <strong className="text-slate-200">Residual Stress:</strong> Structural tension conserved after processing, plastic deformation, or intense mechanical cold working.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-cyan-500/[0.02] p-3 rounded-xl border border-cyan-500/10 space-y-1.5">
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest block font-mono">Thermodynamics & Strain-Energy:</span>
                      <p className="text-slate-400 text-[10px] text-justify leading-normal">
                        Using isotropic linear elastic models, the crystalline stress (σ) is determined as <code className="text-white font-mono font-bold bg-[#040810]/80 px-1 py-0.5 rounded border border-white/5">σ = ε · E</code>, and stored strain-energy density (u) as <code className="text-white font-mono font-bold bg-[#040810]/80 px-1 py-0.5 rounded border border-white/5">u = ½ · ε² · E</code>, where E is the isotropic Young's Modulus.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 h-[700px] flex flex-col relative overflow-hidden group hover:border-pink-500/30 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/10 transition-all duration-700" />
          
          <div className="flex justify-between items-center mb-6 relative z-10 px-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Integral Breadth W-H Plot</h3>
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <div className="text-[10px] font-mono font-black border border-white/5 bg-[#070D18] px-3 py-1.5 rounded-lg text-pink-400 shadow-inner">
                  y = <span className="text-white">{result.regression.slope.toFixed(5)}</span>x + <span className="text-white">{result.regression.intercept.toFixed(5)}</span>
                </div>
              )}
              {result && result.points.length >= 2 && (
                <button
                  onClick={handleDownloadCSV}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-pink-400 bg-[#070D18] hover:bg-pink-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-pink-500/30 transition-all flex items-center gap-2"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              )}
            </div>
          </div>
          
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 m-2 rounded-2xl bg-[#070D18] relative z-10 overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
               <TrendingUp className="w-12 h-12 mb-4 opacity-20 text-pink-500" />
               <p className="font-black uppercase tracking-widest text-slate-400 mb-2">Insufficient data</p>
               <p className="text-xs font-mono text-slate-600">Need at least 2 valid peaks.</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 bg-[#070D18] border border-white/5 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                  <defs>
                    <filter id="neonGlowIB" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                    label={{ value: '4 sin(θ)', position: 'bottom', offset: 20, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    label={{ value: 'β_IB cos(θ) [rad]', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Area
                    type="monotone"
                    dataKey="fitRange"
                    stroke="none"
                    fill="#fb7185"
                    fillOpacity={0.1}
                    name="95% Confidence Band"
                  />
                  <Scatter 
                    name="Observed Data" 
                    dataKey="y" 
                    fill="#f472b6" 
                    shape="circle"
                    r={5}
                    style={{ filter: 'url(#neonGlowIB)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#fb7185" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Linear Regression"
                    activeDot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Peak Deconstruction Table */}
        {result && result.pointsExtended && result.pointsExtended.length > 0 && (
          <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />
            <div className="flex items-center gap-3 mb-6 relative z-10 px-2">
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Peak Deconstruction & Calculated Sizes</h3>
                <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">Individual reflection analysis under {decouplingMethod === 'linear' ? 'Lorentzian' : 'Gaussian'} model</p>
              </div>
            </div>

            <div className="relative z-10 overflow-x-auto rounded-xl border border-white/5 bg-[#070D18]/60 shadow-inner">
              <table className="w-full text-left border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-[9px] text-slate-500 font-sans uppercase tracking-widest font-black">
                    <th className="px-4 py-3 text-emerald-400">Reflection (2θ)</th>
                    <th className="px-4 py-3">β_Obs (deg)</th>
                    <th className="px-4 py-3">β_Inst (deg)</th>
                    <th className="px-4 py-3">β_Sample (deg)</th>
                    <th className="px-4 py-3 font-sans font-black text-pink-400">Calculated Size (nm)</th>
                    <th className="px-4 py-3 text-right">W-H Coord (X, Y)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {result.pointsExtended.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group/row">
                      <td className="px-4 py-3.5 font-bold text-emerald-400 group-hover/row:text-emerald-300 transition-colors">
                        {p.twoTheta.toFixed(3)}°
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {p.betaObsDeg.toFixed(4)}°
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {p.betaInstDeg.toFixed(4)}°
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {p.betaSampleDeg > 0 ? `${p.betaSampleDeg.toFixed(4)}°` : '0.0000° (Below Limit)'}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-pink-400">
                        {p.betaSampleDeg > 0 && p.singlePeakSizeNm > 0 && p.singlePeakSizeNm < 1000 ? (
                          <span>
                            {p.singlePeakSizeNm.toFixed(2)}{' '}
                            <span className="text-[10px] text-slate-500 font-sans tracking-wide">nm</span>
                          </span>
                        ) : p.betaSampleDeg > 0 ? (
                          <span className="text-amber-400 text-[10px] uppercase font-black tracking-wider">
                            &gt; 200 nm <span className="opacity-60 text-[8px] font-mono">(∞)</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Too small / Infinite</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[10px] text-slate-500">
                        ({p.x.toFixed(4)}, {p.y.toExponential(3)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 text-[10px] text-slate-500 leading-relaxed font-sans">
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px] mb-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-pink-400" /> Physical Context Notes
              </p>
              In the size-strain separation plot (W-H), the net sample integrated breadth is plotted as Y (β cos θ) vs X (4 sin θ). 
              The slope determines the overall <span className="text-cyan-400 font-black">Microstrain (ε)</span>, while the y-intercept determines the unified average crystallite size. 
              The <span className="text-pink-400 font-black">Individual Calculated Sizes</span> above represent local grain estimations at specific hkl reflections (assuming zero strain for that single peak's estimation), showing the anisotropic crystallite dimensions variation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};