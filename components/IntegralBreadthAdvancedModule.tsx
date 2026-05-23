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
  Legend
} from 'recharts';
import { RefreshCw, Trash2, Settings2, Info, FileText, ArrowUpRight, TrendingUp, ChevronDown, Zap, Download, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MATERIAL_PRESETS = [
  { 
    label: 'Silicon (Si) Standard', 
    data: "28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800",
    desc: 'NIST 640 Silicon peaks'
  },
  { 
    label: 'Cerium Oxide (CeO2)', 
    data: "28.55, 310, 1200\n33.08, 410, 1100\n47.48, 550, 1000\n56.33, 620, 950\n59.08, 680, 900",
    desc: 'Nanocrystalline Ceria (High Strain)'
  },
  { 
    label: 'Aluminum (Al)', 
    data: "38.47, 450, 1100\n44.72, 480, 1050\n65.10, 520, 1000\n78.23, 560, 950",
    desc: 'Annealed Aluminum powder'
  },
  { 
    label: 'Iron (Fe) Nanoparticles', 
    data: "44.67, 850, 900\n65.02, 920, 850\n82.33, 1100, 800",
    desc: 'High-anisotropy Fe grains'
  },
  { 
    label: 'Stainless Steel 316L', 
    data: "43.6, 320, 1000\n50.8, 380, 950\n74.7, 450, 850\n90.7, 520, 800\n95.9, 580, 750",
    desc: 'Austenitic SS (Cold Worked)'
  },
  { 
    label: 'Ti-6Al-4V (Grade 5)', 
    data: "35.1, 410, 1100\n38.4, 460, 1050\n40.2, 490, 1000\n53.0, 580, 900\n63.3, 650, 850",
    desc: 'Alpha-phase Titanium Alloy'
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
  // Default Data: 2Theta, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800");
  const [result, setResult] = useState<IBAdvancedResult | null>(null);
  
  const [isWavelengthMenuOpen, setIsWavelengthMenuOpen] = useState(false);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIAL_PRESETS[0].label);
  const [selectedKType, setSelectedKType] = useState<string>('Standard Average');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);

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
  };

  const handleClear = () => {
    setInputData("");
  };

  const handleCalculate = () => {
    const peaks = parseIBAdvancedInput(inputData);
    const computed = calculateIBAdvanced(wavelength, constantK, instBetaIB, peaks);
    setResult(computed);
  };

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

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instBetaIB, inputData]);

  // Prepare chart data
  const chartData = result ? result.points.map(p => {
    const fitY = result.regression.slope * p.x + result.regression.intercept;
    return {
      x: p.x,
      y: p.y,
      fit: fitY,
      deviation: p.y - fitY,
      twoTheta: p.twoTheta,
      betaSample: p.betaSample
    };
  }) : [];

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

                  <div>
                     <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] flex justify-between items-center">
                       <span>Resolution β_IB</span>
                       <span className="text-[8px] text-slate-600 font-mono">DEG</span>
                     </label>
                     <input
                       type="number"
                       step="0.01"
                       value={instBetaIB}
                       onChange={(e) => setInstBetaIB(parseFloat(e.target.value))}
                       className="w-full px-4 py-2.5 bg-[#0A101C] text-amber-300 border border-white/10 focus:border-amber-500/50 rounded-lg focus:ring-1 focus:ring-amber-500/20 outline-none font-mono text-sm transition-all"
                     />
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <span className="leading-tight uppercase tracking-widest font-mono text-pink-500/80">
                     <span className="text-pink-500 mr-1">&gt;</span> <span className="text-pink-400">Linear subtraction</span> (Lorentzian assumption).
                  </span>
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

            {result && (
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 flex flex-col gap-3 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated Size</span>
                  <span className="text-sm font-black font-mono text-emerald-400">{result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞'} <span className="text-[10px] opacity-50 font-sans tracking-widest uppercase">NM</span></span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
             <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full transition-all group-hover:scale-110" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Microstrain (ε)</p>
             <div className="flex flex-col mt-2 relative z-10">
               <p className="text-3xl font-black text-white hover:text-cyan-50 transition-colors drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                 {result ? (result.strainPercent / 100 * 10000).toFixed(2) : '-'} <span className="text-lg text-cyan-500/80 font-mono tracking-widest uppercase">× 10⁻⁴</span>
               </p>
               {result && <p className="text-[10px] text-slate-400 font-mono mt-1">({result.strainPercent.toFixed(4)}%)</p>}
             </div>
             <p className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded inline-block mt-3 border border-cyan-500/20 uppercase tracking-widest relative z-10">From W-H Slope</p>
           </div>
           
           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden group hover:border-emerald-500/40 transition-all">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full transition-all group-hover:scale-110" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Crystallite Size</p>
             <p className="text-3xl font-black text-white relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
               {result ? (result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞') : '-'} <span className="text-lg text-emerald-500/80 font-mono tracking-widest uppercase">NM</span>
             </p>
             <p className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded inline-block mt-3 border border-emerald-500/20 uppercase tracking-widest relative z-10">From Intercept</p>
           </div>

           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden group hover:border-purple-500/40 transition-all">
             <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full transition-all group-hover:scale-110" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Fit Quality (R²)</p>
             <p className="text-3xl font-black text-white relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
               {result ? result.regression.rSquared.toFixed(4) : '-'}
             </p>
             <div className="mt-4 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 relative z-10">
               {result && result.regression.rSquared > 0.95 ? (
                  <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"><ArrowUpRight className="w-3 h-3" /> Excellent Fit</span>
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

        {/* Chart */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 h-[500px] flex flex-col relative overflow-hidden group hover:border-pink-500/30 transition-all">
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
      </div>
    </div>
  );
};