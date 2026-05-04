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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                 <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Crystallite Morphology Lab</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Physical Domain Modeling</p>
              </div>
              <div className="hidden md:flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
                <Settings className="w-3 h-3 text-slate-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Physics Mode: Scherrer Ideal</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: 3D Visualization */}
              <div className="bg-black/40 p-6 rounded-2xl border border-slate-800/50 shadow-inner flex flex-col items-center">
                <div className="w-full aspect-square max-w-[240px] flex items-center justify-center bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden perspective-1000">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent animate-pulse" />
                  
                  {/* Dynamic 3D Shape Representation */}
                  <motion.div 
                    key={selectedKType}
                    initial={{ scale: 0.5, rotateY: 0, opacity: 0 }}
                    animate={{ scale: 1, rotateY: 360, opacity: 1 }}
                    transition={{ duration: 1.5, rotateY: { repeat: Infinity, duration: 15, ease: "linear" } }}
                    className="relative"
                  >
                    {selectedKType === 'Spherical' && (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 shadow-[0_0_50px_rgba(79,70,229,0.4)] relative">
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 blur-[1px]" />
                        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/30 blur-md" />
                      </div>
                    )}
                    {selectedKType === 'Cubic' && (
                      <div className="relative w-24 h-24 transform-style-3d">
                        <div className="absolute inset-0 bg-indigo-600 border border-white/20 transform translate-z-12" />
                        <div className="absolute inset-0 bg-indigo-800 border border-white/20 transform rotate-y-90 translate-x-12" />
                        <div className="absolute inset-0 bg-indigo-700 border border-white/20 transform rotate-x-90 -translate-y-12" />
                      </div>
                    )}
                    {selectedKType === 'Platelets' && (
                      <div className="relative w-32 h-8 transform-style-3d">
                        <div className="absolute inset-0 bg-indigo-600/80 border border-white/20 transform translate-z-16" />
                        <div className="absolute inset-0 bg-indigo-800/80 border border-white/20 transform rotate-y-90 translate-x-16" />
                        <div className="absolute inset-0 bg-indigo-700/80 border border-white/20 transform rotate-x-90 -translate-y-4" />
                      </div>
                    )}
                    {selectedKType === 'Octahedral' && (
                      <div className="relative w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-b-[80px] border-b-indigo-500 drop-shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                        <div className="absolute top-[80px] left-[-50px] w-0 h-0 border-l-[50px] border-l-transparent border-r-[50px] border-r-transparent border-t-[80px] border-t-indigo-600 opacity-80" />
                      </div>
                    )}
                    {selectedKType === 'Nanowires' && (
                      <div className="w-12 h-40 bg-gradient-to-r from-indigo-700 via-indigo-500 to-indigo-700 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.3)] border border-white/10" />
                    )}
                    {selectedKType === 'Custom' && (
                      <div className="text-8xl filter drop-shadow-[0_0_20px_rgba(165,180,252,0.5)]">✎</div>
                    )}
                  </motion.div>

                  <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{selectedKType} Domain</span>
                      <span className="text-[11px] font-mono font-black text-white">{avgSize.toFixed(1)}nm</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (avgSize / 200) * 100)}%` }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 w-full grid grid-cols-2 gap-3">
                   <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Aspect Ratio</p>
                      <p className="text-xs font-mono font-black text-slate-300">
                        {selectedKType === 'Platelets' ? '5.2:1' : selectedKType === 'Nanowires' ? '0.1:10' : '1:1'}
                      </p>
                   </div>
                   <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Surface/Vol</p>
                      <p className="text-xs font-mono font-black text-slate-300">
                        {(6 / (avgSize || 1)).toFixed(3)} Å⁻¹
                      </p>
                   </div>
                </div>
              </div>

              {/* Right Side: Peak Profile Simulator */}
              <div className="bg-black/40 p-6 rounded-2xl border border-slate-800/50 shadow-inner flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Spectral Response</h4>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                       <span className="text-[9px] font-black text-amber-500/80 uppercase">Simulated Convolution</span>
                    </div>
                 </div>

                 <div className="flex-1 bg-slate-950/50 rounded-2xl border border-slate-800 relative flex flex-col justify-end p-4 h-[180px] overflow-hidden group/graph">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
                    
                    {/* Simulated Peak Grid */}
                    <div className="absolute inset-x-4 top-4 bottom-12 grid grid-cols-5 gap-0 border-l border-b border-white/5">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className="border-r border-white/5 h-full relative">
                            <span className="absolute bottom-[-16px] left-[-4px] text-[7px] font-mono text-slate-600">2θ₀{i ? `+${i*0.5}` : ''}</span>
                         </div>
                       ))}
                    </div>

                    {/* Instrumental Peak (Reference) - Static narrow */}
                    <svg className="absolute inset-0 w-full h-full p-4 pointer-events-none opacity-40 overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none">
                       <path 
                         d="M 20 90 Q 100 -20, 180 90" 
                         fill="none" 
                         stroke="#475569" 
                         strokeWidth="1.5" 
                         strokeDasharray="4 2"
                         className="translate-x-[40%] scale-x-[0.1]"
                       />
                    </svg>

                    {/* Sample Peak (Dynamic Broadening) */}
                    <div className="relative h-full w-full flex items-end justify-center">
                       <motion.div 
                         animate={{ 
                           width: `${Math.max(10, (100 / (avgSize || 10)) * 5)}%`,
                           height: `${Math.min(95, 20 + (avgSize || 0) * 0.5)}%`
                         }}
                         transition={{ type: "spring", stiffness: 100, damping: 15 }}
                         className="bg-gradient-to-t from-indigo-600/20 to-indigo-400 rounded-t-full border-t border-x border-indigo-400/50 relative group-hover/graph:from-indigo-500/30 transition-colors"
                       >
                         <div className="absolute -top-1 w-full flex justify-center">
                            <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                         </div>
                         
                         {/* FWHM Indicator Line */}
                         <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-indigo-300/40 border-t border-dashed border-indigo-400/20">
                            <span className="absolute -right-12 top-[-8px] text-[8px] font-mono font-black text-indigo-400">β</span>
                         </div>
                       </motion.div>
                    </div>

                    <div className="mt-4 flex flex-col gap-1 z-10">
                       <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                          <span>Inst. Width (Binst)</span>
                          <span className="font-mono text-slate-300">{instFwhm}°</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-black text-indigo-400 uppercase">
                          <span>Physical Broadening (β)</span>
                          <span className="font-mono">{results.length > 0 && !results[0].error ? results[0].betaCorrected.toFixed(3) : '0.000'}°</span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-4 flex gap-4 text-[9px] font-bold text-slate-500 leading-relaxed italic border-t border-slate-800/40 pt-4">
                    <Info className="w-3 h-3 text-indigo-500 shrink-0" />
                    <p>The visual simulator depicts Lorentzian convolution of crystallite size vs. instrumental profile. Narrower peaks indicate larger coherent scattering domains.</p>
                 </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group/summary">
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover/summary:bg-amber-500/10 transition-colors duration-1000" />
             <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Zap className="w-4 h-4 text-amber-400" />
                 </div>
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Global Size Extrapolation</h3>
               </div>
               <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1 ml-11">Mean aggregated over {results.filter(r => !r.error).length} target reflections</p>
             </div>
             <div className="text-left md:text-right relative z-10 flex items-baseline gap-2 bg-black/40 px-6 py-4 rounded-2xl border border-slate-800/50 shadow-inner">
               <span className="text-6xl font-black text-white font-mono tracking-tighter" style={{ textShadow: '0 0 40px rgba(245,158,11,0.3)' }}>{avgSize.toFixed(2)}</span>
               <span className="text-xl text-amber-500 font-black uppercase tracking-widest opacity-80">nm</span>
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
