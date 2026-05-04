import React, { useState, useEffect } from 'react';
import { ScherrerInput, ScherrerResult } from '../types';
import { parseScherrerInput, calculateScherrer } from '../utils/physics';
import { Info, BookOpen, AlertTriangle, ChevronDown, Check, Atom, Binary, ShieldQuestion, Settings, Ruler, FlaskConical, Database, Network, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const K_FACTORS = [
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical morphologies', icon: '⚪' },
  { label: 'Cubic', value: 0.9, desc: 'Standard approximation for general cubic symmetry', icon: '⬜' },
  { label: 'Platelets', value: 0.89, desc: 'High aspect ratio plate-like grains', icon: '▤' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Nanowires', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

const WAVELENGTH_PRESETS = [
  { target: 'Cu Kα', value: 1.5406, color: 'emerald' },
  { target: 'Mo Kα', value: 0.7107, color: 'blue' },
  { target: 'Co Kα', value: 1.7890, color: 'rose' },
  { target: 'Cr Kα', value: 2.2897, color: 'violet' },
  { target: 'Ag Kα', value: 0.5594, color: 'sky' }
];

const CAGLIOTI_PRESETS = [
  { label: 'Lab Diffractometer', u: 0.004, v: -0.002, w: 0.01 },
  { label: 'Synchrotron (High Res)', u: 0.0001, v: -0.00005, w: 0.0002 },
  { label: 'Neutron Diffractometer', u: 0.02, v: -0.01, w: 0.05 },
];

export const ScherrerModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1); // Instrumental broadening
  const [useCaglioti, setUseCaglioti] = useState(false);
  const [caglioti, setCaglioti] = useState({ u: 0.004, v: -0.002, w: 0.01 });
  const [inputData, setInputData] = useState<string>("28.44, 0.25\n47.30, 0.28\n56.12, 0.32");
  const [selectedKType, setSelectedKType] = useState<string>('Cubic (0.9)');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);
  
  const [results, setResults] = useState<ScherrerResult[]>([]);
  const [avgSize, setAvgSize] = useState<number>(0);
  
  // Ref for clicking outside
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

  const handleCalculate = () => {
    const peaks = parseScherrerInput(inputData);
    const computed = peaks
      .map(p => {
        const thetaRad = (p.twoTheta / 2) * Math.PI / 180;
        const currentInstFwhm = useCaglioti 
          ? Math.sqrt(Math.max(0.000001, caglioti.u * Math.pow(Math.tan(thetaRad), 2) + caglioti.v * Math.tan(thetaRad) + caglioti.w))
          : instFwhm;
        return calculateScherrer(wavelength, constantK, currentInstFwhm, p);
      })
      .filter((r): r is ScherrerResult => r !== null); 
    
    setResults(computed);
    
    // Only calculate average for valid, non-error peaks
    const validResults = computed.filter(r => !r.error && r.sizeNm > 0);
    if (validResults.length > 0) {
      const sum = validResults.reduce((acc, curr) => acc + curr.sizeNm, 0);
      setAvgSize(sum / validResults.length);
    } else {
      setAvgSize(0);
    }
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instFwhm, inputData, useCaglioti, caglioti]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Settings className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">System Config</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Scherrer Engine</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Source Wavelength [Å]
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Emitter</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none z-10">
                    <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Energy</span>
                    <span className="text-xs font-black text-emerald-400 font-mono tracking-tighter">
                      {(12.398 / (wavelength || 1.5406)).toFixed(2)} keV
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    value={wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full pl-24 pr-4 py-4 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-2xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-base font-black transition-all placeholder:text-slate-700 shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <div className="h-4 w-[1px] bg-slate-800 mr-2" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">Lambda</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {WAVELENGTH_PRESETS.map((p) => (
                    <button
                      key={p.target}
                      onClick={() => setWavelength(p.value)}
                      className={`py-2 px-1 rounded-xl border text-[9px] font-black uppercase tracking-tight transition-all active:scale-90 flex flex-col items-center justify-center gap-1
                        ${wavelength === p.value 
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                          : 'bg-black/20 border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                        }
                      `}
                    >
                      <span>{p.target.split(' ')[0]}</span>
                      <span className="opacity-50 text-[7px]">{p.value.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Atom className="w-3.5 h-3.5 text-amber-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Shape Factor [K]
                </label>
              </div>
              <div className="space-y-3 relative" ref={kMenuRef}>
                <button
                  onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                  className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl outline-none transition-all flex items-center justify-between group shadow-inner"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                      {K_FACTORS.find(k => k.label === selectedKType)?.icon || '✎'}
                    </span>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-bold text-white leading-none">
                        {selectedKType}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isKTypeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 py-1"
                    >
                      {K_FACTORS.map((k) => (
                        <button
                          key={k.label}
                          onClick={() => {
                            setSelectedKType(k.label);
                            if (k.value !== 0) setConstantK(k.value);
                            setIsKTypeMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors group/item
                            ${selectedKType === k.label ? 'bg-amber-500/10' : ''}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl bg-slate-900/50 w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 group-hover/item:border-amber-500/30 transition-colors">
                              {k.icon}
                            </span>
                            <div className="flex flex-col items-start text-left">
                              <span className={`text-sm font-bold transition-colors ${selectedKType === k.label ? 'text-amber-400' : 'text-slate-200'}`}>
                                {k.label} {k.value !== 0 && `(${k.value})`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {k.desc}
                              </span>
                            </div>
                          </div>
                          {selectedKType === k.label && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3">
                  <div className="relative w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value));
                        setSelectedKType('Custom');
                      }}
                      className="w-full px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none font-mono text-xs font-black transition-all text-center"
                    />
                  </div>
                  <div className="flex-1 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 h-full min-h-[48px]">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="leading-tight uppercase tracking-widest">
                       {K_FACTORS.find(k => k.label.includes(selectedKType) || k.label === selectedKType)?.desc || 'Dimensionless factor relating crystal shape to diffraction peak width.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-4 justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Resolution Profile
                  </label>
                </div>
                <div className="flex p-0.5 bg-black/40 rounded-lg border border-slate-700/50">
                   <button 
                     onClick={() => setUseCaglioti(false)}
                     className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${!useCaglioti ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Fixed
                   </button>
                   <button 
                     onClick={() => setUseCaglioti(true)}
                     className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${useCaglioti ? 'bg-amber-500 text-black' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Caglioti
                   </button>
                </div>
              </div>

              {!useCaglioti ? (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={instFwhm}
                      onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                      className="w-full px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm font-black transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">deg (Binst)</span>
                  </div>
                  <div className="flex gap-2">
                     {[0.05, 0.08, 0.12].map(val => (
                       <button 
                         key={val}
                         onClick={() => setInstFwhm(val)}
                         className={`flex-1 py-1.5 rounded-lg border text-[9px] font-black transition-all ${instFwhm === val ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-black/20 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                       >
                         {val}°
                       </button>
                     ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {CAGLIOTI_PRESETS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => setCaglioti({ u: p.u, v: p.v, w: p.w })}
                        className={`px-2 py-2 rounded-xl border text-[8px] font-black uppercase tracking-tight text-center leading-tight transition-all
                          ${caglioti.u === p.u ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/20 border-slate-800 text-slate-600 hover:text-slate-400'}
                        `}
                      >
                        {p.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">U (tan²θ)</label>
                      <input 
                        type="number" step="0.001" value={caglioti.u} 
                        onChange={(e) => setCaglioti({...caglioti, u: parseFloat(e.target.value)})}
                        className="w-full px-2 py-2 bg-black/40 text-amber-400/80 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">V (tanθ)</label>
                      <input 
                        type="number" step="0.001" value={caglioti.v} 
                        onChange={(e) => setCaglioti({...caglioti, v: parseFloat(e.target.value)})}
                        className="w-full px-2 py-2 bg-black/40 text-amber-400/80 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">W (const)</label>
                      <input 
                        type="number" step="0.001" value={caglioti.w} 
                        onChange={(e) => setCaglioti({...caglioti, w: parseFloat(e.target.value)})}
                        className="w-full px-2 py-2 bg-black/40 text-amber-400/80 border border-slate-800 rounded-lg outline-none font-mono text-[10px] font-black focus:border-amber-500/30" 
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-700/30 overflow-hidden">
                <div className="flex justify-between items-end mb-2">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Resolution Limit</span>
                   <span className="text-[10px] font-black text-amber-500/80 font-mono">
                     ~{((wavelength * constantK) / (Math.max(0.0001, (useCaglioti ? Math.sqrt(caglioti.w) : instFwhm)) * (Math.PI / 180) * 0.95)).toFixed(0)} nm
                   </span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-slate-800">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, (1 / Math.max(0.0001, (useCaglioti ? Math.sqrt(caglioti.w) : instFwhm))) * 5)}%` }}
                     className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                   />
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                  Size detection threshold based on current instrument resolution.
                </p>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                   <Database className="w-4 h-4 text-amber-400" />
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Peak Data Input
                   </label>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-slate-700/50">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Format: 2θ, FWHM</span>
                </div>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2&#10;47.30, 0.25"
                className="w-full h-32 px-5 py-4 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/40 rounded-2xl focus:ring-2 focus:ring-amber-500/10 outline-none font-mono text-xs leading-loose resize-none transition-all shadow-inner custom-scrollbar"
                spellCheck={false}
              />
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-[0_15px_30px_rgba(245,158,11,0.2)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/20 to-amber-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="uppercase tracking-[0.2em] text-sm">Execute Analysis</span>
            </button>
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Theory Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Scherrer Foundation</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/card overflow-hidden relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Network className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Formula</span>
              </div>
              <div className="bg-[#0a0f16] p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-emerald-900/50 shadow-inner relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="truncate font-black tracking-widest text-emerald-300">D = (K · λ) / (β · cosθ)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Binary className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicability Domain</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium relative z-10">
                Valid for crystallite dimensions ranging from <span className="text-blue-400 font-bold">~1 nm to ~200 nm</span>. Above this limit, peak broadening falls below the instrumental resolution threshold and cannot be decoupled.
              </p>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all relative overflow-hidden group/card">
              <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <ShieldQuestion className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Assumptions</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold relative z-10">
                Postulates that <span className="text-rose-400 font-bold">100% of broadening</span> derives from finite size effects. Lattice strain, stacking faults, and instrumental profile convolution are ignored. Use <span className="text-white bg-slate-800 px-1 py-0.5 rounded">Williamson-Hall</span> for rigorous decoupling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col gap-6 h-full">
          {/* Average Size Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <Zap className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">Mean Crystallite Size</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Aggregate</span>
                       <span className="w-1 h-1 bg-slate-700 rounded-full" />
                       <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">{results.filter(r => !r.error).length} Peaks Resolved</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border transition-colors ${
                    avgSize < 10 ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                    avgSize < 50 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    avgSize < 100 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-slate-500/10 border-slate-500/30 text-slate-400'
                  }`}>
                    {avgSize < 10 ? 'Quantum Domain' : 
                     avgSize < 50 ? 'Small Nanoparticle' : 
                     avgSize < 100 ? 'Large Nanoparticle' : 
                     avgSize < 200 ? 'Sub-Micron' : 'Bulk Limit'}
                  </div>
                  {results.filter(r => !r.error).length > 1 && (
                    <div className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-slate-950/50 border-slate-800 text-slate-500 inline-flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-slate-500" />
                      Var: ±{(Math.sqrt(results.filter(r => !r.error).reduce((acc, r) => acc + Math.pow(r.sizeNm - avgSize, 2), 0) / results.filter(r => !r.error).length)).toFixed(2)} nm
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 bg-black/40 p-4 rounded-2xl border border-slate-800/50">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Size Scale (1-200nm)</span>
                  <span className="text-[10px] font-mono font-bold text-slate-300">{avgSize.toFixed(1)} nm</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-[1px] border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (avgSize / 200) * 100)}%` }}
                    className={`h-full rounded-full ${
                      avgSize < 50 ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' :
                      avgSize < 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      'bg-gradient-to-r from-amber-500 to-amber-400'
                    } shadow-[0_0_10px_rgba(99,102,241,0.2)]`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[8px] font-mono text-slate-600 font-bold uppercase tracking-tighter">
                  <span>1nm</span>
                  <span>50nm</span>
                  <span>100nm</span>
                  <span>200nm</span>
                </div>
              </div>

              <div className="lg:col-span-3 flex justify-end">
                <div className="flex items-baseline gap-2 bg-black/40 px-8 py-5 rounded-2xl border border-slate-800 shadow-inner group-hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-6xl font-black text-white font-mono tracking-tighter relative z-10" style={{ textShadow: '0 0 30px rgba(245,158,11,0.2)' }}>
                    {avgSize.toFixed(2)}
                  </span>
                  <span className="text-xl text-amber-500 font-black uppercase tracking-widest opacity-80 relative z-10">nm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-[400px]">
             <div className="p-6 border-b border-slate-800 bg-black/20 flex justify-between items-center backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1 text-shadow-sm">Analytical Databank</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Peak-by-peak Resolution Metrics</p>
                  </div>
                </div>
              {results.some(r => r.error) && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 relative z-10">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Validation Errors Present</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
               {results.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center bg-slate-900/50 border border-slate-800/40 rounded-2xl m-6 border-dashed">
                   <Ruler className="w-8 h-8 text-slate-700 mb-3" />
                   <p className="text-[11px] font-bold uppercase tracking-widest">Input telemetry data for calculation</p>
                 </div>
               ) : (
                <table className="w-full text-left text-slate-300 border-collapse">
                  <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-950/80 sticky top-0 backdrop-blur-xl z-20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    <tr>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800"><div className="flex items-center gap-2"><span className="w-1 h-3 bg-indigo-500 rounded-full" /> 2θ [deg]</div></th>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800"><div className="flex items-center gap-2"><span className="w-1 h-3 bg-slate-500 rounded-full" /> FWHM Obs [deg]</div></th>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800"><div className="flex items-center gap-2"><span className="w-1 h-3 bg-emerald-500 rounded-full" /> β Corrected [deg]</div></th>
                      <th scope="col" className="px-8 py-5 font-black border-b border-slate-800 text-right"><span className="text-amber-500">Domain Size [nm]</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {results.map((row, index) => (
                      <tr key={`${row.twoTheta}-${index}`} className="bg-slate-900/10 hover:bg-slate-800/30 transition-all group/row hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <td className="px-8 py-5 font-mono text-sm font-bold text-white group-hover/row:text-indigo-400 transition-colors">{row.twoTheta.toFixed(3)}°</td>
                        <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400">{row.fwhmObs.toFixed(4)}°</td>
                        <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400">
                          {row.error ? <span className="text-slate-600">-</span> : `${row.betaCorrected.toFixed(4)}°`}
                        </td>
                        <td className="px-8 py-5 text-right">
                          {row.error ? (
                            <span className="text-rose-400 text-[10px] font-black bg-rose-500/10 px-3 py-1.5 rounded-md uppercase tracking-widest inline-block whitespace-nowrap border border-rose-500/20 shadow-inner">
                              {row.error.toLowerCase().includes("zero") ? "Domain Overflow" : "Parse Fault"}
                            </span>
                          ) : (
                            <span className="bg-[#0f1520] text-amber-400 font-mono font-black text-lg px-4 py-2 rounded-xl border border-amber-900/30 inline-block shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] min-w-[100px] text-center">
                              {row.sizeNm.toFixed(2)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
