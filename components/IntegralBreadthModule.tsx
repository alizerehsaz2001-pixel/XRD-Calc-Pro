import React, { useState, useEffect } from 'react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../types';
import { parseIntegralBreadthInput, calculateIntegralBreadth } from '../utils/physics';
import { Info, BookOpen, Activity, Calculator, Sparkles, Loader2, Atom, Binary, ShieldQuestion, ChevronDown, Check } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
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
  { label: 'Integral Breadth', value: 1.0, desc: 'Theoretical value when using Integral Breadth instead of FWHM (Recommended for IB method)', icon: '∫' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

const IB_PRESETS = [
  { 
    name: 'Silicon (NIST)', 
    data: "28.44, 0.22, 230, 1000\n47.30, 0.26, 280, 950\n56.12, 0.31, 350, 900", 
    wavelength: 1.5406, 
    k: 1.0, 
    desc: 'High-resolution standard peaks.',
    icon: '💎'
  },
  { 
    name: 'PET (Semi-cryst)', 
    data: "16.2, 0.55, 600, 850\n17.5, 0.48, 520, 820\n26.1, 0.42, 450, 900", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Polymer peaks with profile asymmetry.',
    icon: '🧵'
  },
  { 
    name: 'PTFE (Crystalline)', 
    data: "18.1, 0.38, 420, 1000\n31.5, 0.45, 500, 950\n36.6, 0.52, 580, 900", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Highly crystalline polymer reference.',
    icon: '🍳'
  }
];

export const IntegralBreadthModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [selectedKType, setSelectedKType] = useState<string>('Standard Average');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  const kMenuRef = React.useRef<HTMLDivElement>(null);

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
  const [inputData, setInputData] = useState<string>("28.44, 0.22, 230, 1000\n47.30, 0.26, 280, 950\n56.12, 0.31, 350, 900");
  const [results, setResults] = useState<IntegralBreadthResult[]>([]);
  const [avgSize, setAvgSize] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate realistic X-ray diffraction peak data for ${searchQuery} using Cu K-alpha radiation (1.5406 Å).
        Provide 3 to 5 major peaks. For each peak, provide:
        - 2Theta (degrees)
        - FWHM (degrees)
        - Area (counts * degrees)
        - Imax (counts)
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
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      const isQuota = errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED');
      const isPermission = errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED') || errorStr.includes('permission');
      
      if (isQuota) {
        alert("Neural link quota exhausted. Please wait for buffer reset.");
      } else if (isPermission) {
        alert("Neural link access restricted (403). Permission denied for AI data generation.");
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleCalculate = () => {
    const peaks = parseIntegralBreadthInput(inputData);
    const computed = peaks
      .map(p => calculateIntegralBreadth(wavelength, constantK, p))
      .filter((r): r is IntegralBreadthResult => r !== null);
    
    setResults(computed);

    if (computed.length > 0) {
      const sum = computed.reduce((acc, curr) => acc + curr.calcSizeNm, 0);
      setAvgSize(sum / computed.length);
    } else {
      setAvgSize(0);
    }
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, inputData]);

  const getProfileType = (phi: number) => {
    if (phi < 0.7) return { type: 'Lorentzian', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (phi > 0.9) return { type: 'Gaussian', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    return { type: 'Pseudo-Voigt', color: 'text-purple-600', bg: 'bg-purple-50' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(168,85,247,0.05)] border border-purple-500/20 relative overflow-hidden group transition-all hover:border-purple-500/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-purple-500/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-3xl translate-y-16 -translate-x-16 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-md opacity-20" />
                <div className="p-2.5 bg-[#070D18] rounded-xl border border-purple-500/30 relative">
                  <Calculator className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">Configuration</h2>
            </div>
            <div className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono text-purple-400 font-black uppercase tracking-widest">
              SYS_CFG
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Smart Load Section */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group/load relative overflow-hidden">
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-purple-500/50 to-transparent opacity-0 group-hover/load:opacity-100 transition-opacity" />
              <label className="block text-[10px] font-black text-purple-400/80 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                Smart Data Load
              </label>
              <div className="flex gap-2 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className="text-slate-600 font-mono text-xs">&gt;_</span>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Zinc Oxide"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors relative overflow-hidden group/wave">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                  Wavelength (Å)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0A101C] text-purple-300 border border-white/10 focus:border-purple-500/50 rounded-lg focus:ring-1 focus:ring-purple-500/20 outline-none font-mono text-sm transition-all"
                  />
                  <button 
                    onClick={() => setWavelength(1.5406)}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-2 text-[8px] font-black text-slate-500 bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 border border-white/5 hover:border-purple-500/40 rounded transition-colors flex items-center justify-center uppercase tracking-widest"
                  >
                    Cu-Kα
                  </button>
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
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono font-black text-cyan-400 truncate max-w-[100px]">
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
                      value={constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value));
                        setSelectedKType('Custom');
                      }}
                      className="w-full px-4 py-2.5 bg-[#0A101C] text-cyan-400 border border-white/10 rounded-lg focus:border-cyan-500/50 outline-none font-mono text-xs font-black transition-all text-center focus:ring-1 focus:ring-cyan-500/20"
                    />
                  </div>
                  <div className="flex-1 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5 h-full min-h-[36px]">
                    <span className="leading-tight uppercase tracking-widest font-mono text-cyan-500/80">
                       <span className="text-cyan-500 mr-1">&gt;</span> {K_FACTORS.find(k => k.label.includes(selectedKType) || k.label === selectedKType)?.desc || 'Dimensionless factor.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 relative overflow-hidden group/data hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Binary className="w-3.5 h-3.5" />
                  Peak Data Input
                </label>
                <div className="flex justify-between text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  <span>2θ, FWHM, Area, Imax</span>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 gap-2 mb-4">
                {IB_PRESETS.map(p => (
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
                  placeholder="28.44, 0.22, 230, 1000&#10;47.30, 0.26, 280, 950"
                  spellCheck="false"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Execute Config
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
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Integral Breadth Theory</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breadth Definition</span>
              </div>
              <div className="bg-[#0A101C] p-4 rounded-xl font-mono text-sm text-cyan-400 overflow-x-auto border border-white/5 text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse" />
                  <span className="truncate">β = Area / Imax</span>
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shape Factor (φ = FWHM/β)</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <span className="font-bold text-blue-400">Lorentzian</span>
                  <span className="font-mono text-blue-500">φ ≈ 0.636</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <span className="font-bold text-emerald-400">Gaussian</span>
                  <span className="font-mono text-emerald-500">φ ≈ 0.939</span>
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Why use β?</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-rose-500/30 pl-3">
                Integral breadth considers the entire peak profile rather than just its width at half intensity, making it more robust for highly distorted profiles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        {/* Summary Card */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(34,211,238,0.05)] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all">
           <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full transition-all group-hover:scale-110 blur-2xl" />
           <div className="absolute left-0 bottom-0 w-[200px] h-[1px] bg-gradient-to-r from-cyan-500 to-transparent" />
           <div className="absolute left-0 top-0 w-[1px] h-[100px] bg-gradient-to-b from-cyan-500 to-transparent" />
           <div className="relative z-10 mb-4 sm:mb-0">
             <h3 className="text-xl font-black text-white uppercase tracking-widest">Average Size</h3>
             <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Calculated from {results.length} peaks using Integral Breadth</p>
           </div>
           <div className="text-right flex items-end justify-start sm:justify-end gap-2 relative z-10 bg-[#070D18] px-6 py-4 rounded-2xl border border-cyan-500/20 shadow-inner">
             <span className="text-5xl font-black text-cyan-400 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]">{avgSize.toFixed(2)}</span>
             <span className="text-xl text-cyan-500/60 font-black mb-1">NM</span>
           </div>
        </div>

        <div className="bg-[#0A101C]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-5 border-b border-white/5 bg-[#070D18] flex justify-between items-center relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <h3 className="font-black text-white uppercase tracking-[0.2em] text-xs flex items-center gap-3">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
               Detailed Analysis
            </h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 shadow-inner">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                Profile DB
              </span>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center m-6 rounded-2xl bg-[#070D18] border border-white/5 border-dashed relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
                <Calculator className="w-10 h-10 mb-4 opacity-20 text-cyan-500" />
                <p className="font-black uppercase tracking-widest text-slate-400 mb-2">No data calculated</p>
                <p className="text-xs font-mono text-slate-600">Awaiting parameter input for integral breadth analysis.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-[#070D18] sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th scope="col" className="px-6 py-4 border-b border-white/5">2θ (DEG)</th>
                    <th scope="col" className="px-6 py-4 border-b border-white/5 text-cyan-400">β_IB (DEG)</th>
                    <th scope="col" className="px-6 py-4 border-b border-white/5 text-purple-400">Shape Factor (φ)</th>
                    <th scope="col" className="px-6 py-4 border-b border-white/5">Profile Type</th>
                    <th scope="col" className="px-6 py-4 border-b border-white/5 text-right text-emerald-400">Size (NM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {results.map((res, index) => {
                    const profile = getProfileType(res.shapeFactorPhi);
                    return (
                      <tr key={`${res.twoTheta}-${index}`} className="hover:bg-cyan-500/5 transition-colors group/row">
                        <td className="px-6 py-4 font-mono font-bold text-slate-300 group-hover/row:text-white transition-colors">
                          {res.twoTheta.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-mono text-cyan-400/80 font-bold group-hover/row:text-cyan-300 transition-colors">
                          {res.integralBreadthDeg.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 font-mono text-purple-400/80 group-hover/row:text-purple-300 transition-colors">
                          {res.shapeFactorPhi.toFixed(3)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded border text-[8px] font-black uppercase tracking-[0.2em] ${
                            profile.type === 'Gaussian' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            profile.type === 'Lorentzian' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {profile.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-right font-black text-emerald-400 text-lg drop-shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                          {res.calcSizeNm.toFixed(2)}
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
