import React, { useState, useEffect } from 'react';
import { ScherrerInput, ScherrerResult } from '../types';
import { parseScherrerInput, calculateScherrer } from '../utils/physics';
import { Info, BookOpen, AlertTriangle, ChevronDown, Check, Atom, Binary, ShieldQuestion, Settings, Ruler, FlaskConical, Database, Network, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const K_FACTORS = [
  { label: 'Spherical (0.94)', value: 0.94, desc: 'Common for spherical crystallites' },
  { label: 'Cubic (0.9)', value: 0.9, desc: 'Standard approximation' },
  { label: 'Platelets (0.89)', value: 0.89, desc: 'For plate-like geometry' },
  { label: 'Custom', value: 0, desc: 'Enter manually' }
];

export const ScherrerModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1); // Instrumental broadening
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
      .map(p => calculateScherrer(wavelength, constantK, instFwhm, p))
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
  }, [wavelength, constantK, instFwhm, inputData]);

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
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-3.5 h-3.5 text-amber-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Wavelength [Å]
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm font-black transition-all placeholder:text-slate-700"
                />
                <button 
                  onClick={() => setWavelength(1.5406)}
                  className="absolute right-2 top-2 bottom-2 px-3 text-[10px] font-bold text-slate-400 bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-400 border border-slate-700/50 hover:border-amber-500/50 rounded-lg transition-all flex items-center justify-center uppercase tracking-wider active:scale-95"
                >
                  Cu Kα
                </button>
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
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-bold text-white leading-none">
                      {selectedKType}
                    </span>
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
                          <div className="flex flex-col items-start text-left">
                            <span className={`text-sm font-bold transition-colors ${selectedKType === k.label ? 'text-amber-400' : 'text-slate-200'}`}>
                              {k.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {k.desc}
                            </span>
                          </div>
                          {selectedKType === k.label && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      value={constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value));
                        setSelectedKType('Custom');
                      }}
                      className="w-full px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none font-mono text-sm font-black transition-all"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 h-full">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate leading-tight uppercase tracking-widest">{K_FACTORS.find(k => k.label === selectedKType)?.desc || 'Custom manually entered size factor.'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex items-center gap-2 mb-3 justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Inst. Broadening
                  </label>
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">[deg]</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={instFwhm}
                onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                className="w-full px-4 py-3 bg-black/60 text-amber-400 border border-slate-700/50 focus:border-amber-500/50 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm font-black transition-all"
              />
              <div className="mt-3 flex items-start gap-2 text-[10px] font-bold text-slate-400 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed"><span className="text-amber-400">Subtracts instrumental width:</span> β² = B²obs - B²inst</span>
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
          {/* Summary Card */}
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group/summary">
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
                      <tr key={index} className="bg-slate-900/10 hover:bg-slate-800/30 transition-all group/row hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
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
