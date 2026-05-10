import React, { useState, useEffect, useRef } from 'react';
import { parseScherrerInput, calculateWilliamsonHall } from '../utils/physics';
import { WHResult } from '../types';
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
import { Info, BookOpen, AlertTriangle, TrendingUp, Ruler, ChevronDown, Check, Atom, Binary, ShieldQuestion, Download, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

const WH_PRESETS = [
  { 
    name: 'Silicon (Standard)', 
    data: "28.44, 0.12\n47.30, 0.15\n56.12, 0.18\n69.13, 0.22\n76.38, 0.25", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Nearly zero strain reference.',
    icon: '💎'
  },
  { 
    name: 'Polypropylene (iPP)', 
    data: "14.1, 0.35\n16.9, 0.42\n18.6, 0.48\n21.2, 0.55\n21.8, 0.58", 
    wavelength: 1.5406, 
    k: 0.94, 
    desc: 'Semi-crystalline polymer with significant strain.',
    icon: '🌀'
  },
  { 
    name: 'Strained Cu Film', 
    data: "43.30, 0.45\n50.43, 0.52\n74.13, 0.72\n89.93, 0.95", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Metals with processing-induced stress.',
    icon: '🎞️'
  }
];

export const WilliamsonHallModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1);
  const [inputData, setInputData] = useState<string>("28.44, 0.25\n47.30, 0.28\n56.12, 0.32\n69.13, 0.38\n76.38, 0.42");
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian'>('Gaussian');
  const [result, setResult] = useState<WHResult | null>(null);
  const [selectedKType, setSelectedKType] = useState<string>('Standard Average');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);

  // Ref for clicking outside
  const kMenuRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setWavelength(1.5406);
    setConstantK(0.9);
    setInstFwhm(0.1);
    setInputData("28.44, 0.25\n47.30, 0.28\n56.12, 0.32\n69.13, 0.38\n76.38, 0.42");
    setSelectedKType('Standard Average');
  };

  const handleClear = () => {
    setInputData("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCalculate = () => {
    const peaks = parseScherrerInput(inputData);
    const computed = calculateWilliamsonHall(wavelength, constantK, instFwhm, peaks, broadeningModel);
    setResult(computed);
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "2Theta,4sin(theta),beta*cos(theta),Fit\n";
    const rows = chartData.map(d => `${d.twoTheta?.toFixed(4) || 0},${d.x.toFixed(6)},${d.y.toFixed(6)},${d.fit.toFixed(6)}`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wh_plot_data_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instFwhm, inputData, broadeningModel]);

  // Prepare chart data
  const chartData = result ? result.points.map(p => ({
    x: p.x,
    y: p.y,
    fit: result.regression.slope * p.x + result.regression.intercept,
    twoTheta: p.twoTheta
  })) : [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#0A101C] text-white p-4 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.15)] border border-cyan-500/30 text-xs font-mono">
          <p className="font-black mb-3 text-cyan-400 border-b border-white/5 pb-2 uppercase tracking-widest">Peak at {d.twoTheta?.toFixed(2)}°</p>
          <div className="space-y-2 text-[10px]">
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">X (4sinθ)</span> <span className="text-cyan-300 font-bold">{d.x.toFixed(5)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Y (βcosθ)</span> <span className="text-cyan-300 font-bold">{d.y.toFixed(5)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Linear Fit</span> <span className="text-rose-400">{d.fit.toFixed(5)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(34,211,238,0.05)] border border-cyan-500/20 relative overflow-hidden group transition-all hover:border-cyan-500/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl translate-y-16 -translate-x-16 group-hover:bg-rose-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20" />
                <div className="p-2.5 bg-[#070D18] rounded-xl border border-cyan-500/30 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">W-H Parameters</h2>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 bg-white/5 hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-1.5 mt-1 relative overflow-hidden group/btn"
              title="Reset config to defaults"
            >
              <RefreshCw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" /> Reset
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors relative overflow-hidden group/wave">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                  Wavelength (Å)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0A101C] text-cyan-300 border border-white/10 focus:border-cyan-500/50 rounded-lg focus:ring-1 focus:ring-cyan-500/20 outline-none font-mono text-sm transition-all"
                  />
                  <button 
                    onClick={() => setWavelength(1.5406)}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-2 text-[8px] font-black text-slate-500 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 border border-white/5 hover:border-cyan-500/40 rounded transition-colors flex items-center justify-center uppercase tracking-widest"
                  >
                    Cu-Kα
                  </button>
                </div>
              </div>

              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-colors relative">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                  Shape Factor (K)
                </label>
                <div className="relative" ref={kMenuRef}>
                  <button
                    onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                    className="w-full px-4 py-2.5 bg-[#0A101C] border border-white/10 hover:border-rose-500/40 rounded-lg outline-none transition-all flex items-center justify-between group shadow-inner"
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono font-black text-rose-400 truncate max-w-[100px]">
                        {selectedKType}
                       </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isKTypeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[110%] left-0 right-0 bg-[#070D18] rounded-xl border border-rose-500/30 shadow-[0_5px_30px_rgba(0,0,0,0.5)] overflow-hidden z-[100] py-1 max-h-[250px] overflow-y-auto custom-scrollbar"
                      >
                        {K_FACTORS.map((k) => (
                          <button
                            key={k.label}
                            onClick={() => {
                              setSelectedKType(k.label);
                              if (k.value !== 0) setConstantK(k.value);
                              setIsKTypeMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 flex items-center justify-between hover:bg-rose-500/10 transition-colors group/item relative
                              ${selectedKType === k.label ? 'bg-rose-500/5' : ''}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm bg-black/50 w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 group-hover/item:border-rose-500/30 transition-colors">
                                {k.icon}
                              </span>
                              <div className="flex flex-col items-start text-left">
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedKType === k.label ? 'text-rose-400' : 'text-slate-300'}`}>
                                  {k.label} {k.value !== 0 && `(${k.value})`}
                                </span>
                                <span className="text-[8px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                                  {k.desc}
                                </span>
                              </div>
                            </div>
                            {selectedKType === k.label && <Check className="w-3 h-3 text-rose-400 shrink-0 ml-2" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <div className="relative w-full">
                      <input
                        type="number"
                        step="0.01"
                        value={constantK}
                        onChange={(e) => {
                          setConstantK(parseFloat(e.target.value));
                          setSelectedKType('Custom');
                        }}
                        className="w-full px-4 py-2.5 bg-[#0A101C] text-rose-400 border border-white/10 rounded-lg focus:border-rose-500/50 outline-none font-mono text-xs font-black transition-all text-center focus:ring-1 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
              <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em] flex justify-between items-center">
                <span>Instrumental Broadening</span>
                <span className="text-[8px] text-slate-600 font-mono">DEG</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={instFwhm}
                onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-[#0A101C] text-amber-300 border border-white/10 focus:border-amber-500/50 rounded-lg focus:ring-1 focus:ring-amber-500/20 outline-none font-mono text-sm transition-all"
              />
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">
                  Broadening Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                   {(['Gaussian', 'Lorentzian'] as const).map(model => (
                     <button
                       key={model}
                       onClick={() => setBroadeningModel(model)}
                       className={`py-2 px-1 rounded-lg border text-[9px] font-black uppercase tracking-tight transition-all
                         ${broadeningModel === model ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-black' : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'}
                       `}
                     >
                       {model}
                     </button>
                   ))}
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-3 leading-relaxed">
                   {broadeningModel === 'Gaussian' ? 'Quadratic (β²): Used when instrument/strain profiles are Gaussian.' : 'Linear (β): Used when broadening is dominantly Cauchy/Lorentzian.'}
                </p>
              </div>
            </div>

            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 relative overflow-hidden group/data hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Binary className="w-3.5 h-3.5" />
                  Peak Data Input
                </label>
                <div className="flex gap-2">
                  <div className="flex justify-between text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <span>2θ, FWHM</span>
                  </div>
                  <button 
                    onClick={handleClear}
                    className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/30"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 gap-2 mb-4">
                {WH_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setInputData(p.data);
                      setWavelength(p.wavelength);
                      setConstantK(p.k);
                      const kMatch = K_FACTORS.find(kf => kf.value === p.k);
                      if (kMatch) setSelectedKType(kMatch.label);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0A101C] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group/btn"
                  >
                    <span className="text-lg bg-black/50 w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 group-hover/btn:border-emerald-500/30 shrink-0">
                      {p.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover/btn:text-emerald-400 transition-colors truncate">{p.name}</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase truncate">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative font-mono text-xs">
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/50 rounded-lg focus:ring-1 focus:ring-emerald-500/20 outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700"
                  placeholder="28.44, 0.2&#10;47.30, 0.28"
                  spellCheck="false"
                />
              </div>
              <div className="mt-3 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                <span className="leading-tight uppercase tracking-widest font-mono text-emerald-500/80">
                   <span className="text-emerald-500 mr-1">&gt;</span> Enter at least 3 peaks for reliable regression.
                </span>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-rose-500 hover:from-cyan-400 hover:to-rose-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Generate W-H Plot
            </button>
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-[#070D18] rounded-xl border border-cyan-500/30">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Scientific Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">UDM Model Analysis</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Equation</span>
              </div>
              <div className="bg-[#0A101C] p-4 rounded-xl font-mono text-sm text-cyan-400 overflow-x-auto border border-white/5 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse" />
                  <span className="truncate">βcosθ = ε(4sinθ) + Kλ/D</span>
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slope (ε) Significance</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono border-l-2 border-purple-500/30 pl-3">
                The gradient represents the lattice microstrain. Steeper slopes indicate higher internal stress within the crystallites.
              </p>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intercept (Kλ/D) Analysis</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono border-l-2 border-rose-500/30 pl-3">
                The Y-intercept provides the size contribution. By decoupling strain (slope), this provides a more accurate grain size than single-peak Scherrer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-16 h-16 text-cyan-500" />
             </div>
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Microstrain (ε)</p>
             <div className="flex flex-col mt-2">
               <p className="text-3xl font-black text-white flex items-baseline gap-2 font-mono drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] relative z-10">
                 {result ? (result.strainPercent / 100 * 10000).toFixed(2) : '-'} <span className="text-sm font-black text-cyan-500 tracking-widest uppercase">× 10⁻⁴</span>
               </p>
               {result && <p className="text-[10px] text-slate-400 font-mono mt-1">({result.strainPercent.toFixed(4)}%)</p>}
             </div>
             <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded text-[9px] text-cyan-400 font-black uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 relative z-10">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
               Derived from Slope
             </div>
           </div>
           
           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden group hover:border-emerald-500/40 transition-all">
             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Ruler className="w-16 h-16 text-emerald-500" />
             </div>
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Crystallite Size</p>
             <p className="text-3xl font-black text-white mt-2 flex items-baseline gap-2 font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.4)] relative z-10">
               {result ? (result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞') : '-'} <span className="text-sm font-black text-emerald-500 tracking-widest uppercase">NM</span>
             </p>
             <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded text-[9px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 relative z-10">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               Derived from Intercept
             </div>
           </div>

           <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)] relative overflow-hidden group hover:border-purple-500/40 transition-all">
             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
             </div>
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Fit Quality (R²)</p>
             <div className="flex items-end gap-2 mt-2 font-mono relative z-10">
               <p className={`text-3xl font-black drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] ${result && result.regression.rSquared > 0.9 ? 'text-white' : 'text-white'}`}>
                 {result ? result.regression.rSquared.toFixed(4) : '-'}
               </p>
             </div>
             <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded text-[9px] text-purple-400 font-black uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 relative z-10">
               <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${result && result.regression.rSquared > 0.9 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
               Linear Regression Fit
             </div>
           </div>
        </div>

        {/* Warnings */}
        {result && result.sizeInterceptNm === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest">Negative or Zero Intercept Detected</h4>
              <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                The y-intercept is non-positive, which implies an infinite or unphysical crystallite size. This often happens when:
              </p>
              <ul className="list-none pl-0 mt-3 space-y-2 text-xs text-slate-300 font-bold uppercase tracking-widest">
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&gt;</span> Instrumental broadening is overestimated.</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&gt;</span> The sample has very large grains ({'>'}200nm).</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&gt;</span> Strain is the dominant factor and data is noisy.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 h-[500px] flex flex-col relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
          <div className="flex justify-between items-center mb-6 relative z-10 px-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Williamson-Hall Plot</h3>
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <div className="text-[10px] font-mono font-black border px-3 py-1.5 rounded-lg text-cyan-400 bg-[#070D18] border-white/5 shadow-inner">
                  y = {result.regression.slope.toFixed(5)}x {result.regression.intercept >= 0 ? '+' : '-'} {Math.abs(result.regression.intercept).toFixed(5)}
                </div>
              )}
              {result && result.points.length >= 2 && (
                <button
                  onClick={handleDownloadCSV}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-400 bg-[#070D18] hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              )}
            </div>
          </div>
          
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 m-2 rounded-2xl bg-[#070D18] relative z-10 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
              <TrendingUp className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
              <p className="font-black uppercase tracking-widest text-slate-400 mb-2">Insufficient data</p>
              <p className="text-xs font-mono text-slate-600">Enter at least 2 valid peaks to generate the regression.</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 bg-[#070D18] border border-white/5 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                  <defs>
                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
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
                    domain={['auto', 'auto']}
                    label={{ value: '4 sin(θ)', position: 'bottom', offset: 20, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    label={{ value: 'β cos(θ) [rad]', angle: -90, position: 'insideLeft', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Scatter name="Observed Data" dataKey="y" fill="#22d3ee" shape="circle" r={5} style={{ filter: 'url(#neonGlow)' }} />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    dot={false} 
                    name="UDM Linear Fit"
                    activeDot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* JSON Output Section */}
        {result && (
          <div className="bg-[#0A101C] rounded-xl p-4 border border-white/5 overflow-hidden relative group/json shadow-inner">
             <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Output JSON</span>
               <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))} className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors bg-white/5 hover:bg-cyan-500/10 px-2 py-1 rounded border border-white/10 hover:border-cyan-500/30">Copy</button>
             </div>
             <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto max-h-32 custom-scrollbar opacity-70 group-hover/json:opacity-100 transition-opacity">
               {JSON.stringify({
                 module: "Williamson-Hall-UDM",
                 method: "Uniform Deformation Model (Linear Regression)",
                 parameters: {
                    wavelength_angstrom: wavelength,
                    shape_factor_K: constantK,
                    instrumental_broadening: instFwhm
                 },
                 results: {
                   strain_percent: result.strainPercent,
                   size_nm: result.sizeInterceptNm,
                   fit_r_squared: result.regression.rSquared
                 }
               }, null, 2)}
             </pre>
          </div>
        )}
      </div>
    </div>
  );
};
