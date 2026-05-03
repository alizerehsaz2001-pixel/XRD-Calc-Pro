import React, { useState, useEffect } from 'react';
import { ScherrerInput, ScherrerResult } from '../types';
import { parseScherrerInput, calculateScherrer } from '../utils/physics';
import { Info, BookOpen, AlertTriangle, ChevronDown, Check, Atom, Binary, ShieldQuestion } from 'lucide-react';
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
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-600 rounded-full opacity-10 blur-2xl"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Scherrer Parameters</h2>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Wavelength (Å)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-black/40 text-amber-400 border border-slate-600 focus:border-amber-500 rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm transition-all placeholder:text-slate-600"
                />
                <button 
                  onClick={() => setWavelength(1.5406)}
                  className="absolute right-2 top-2 bottom-2 px-3 text-[10px] font-bold text-slate-400 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 border border-slate-700 hover:border-amber-500/50 rounded transition-colors flex items-center justify-center uppercase tracking-wider"
                >
                  Cu Kα ≈ 1.5406
                </button>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Shape Factor (K)
              </label>
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
                      className="w-full px-4 py-2.5 bg-black/40 text-amber-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm transition-all"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 h-full">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate leading-tight">{K_FACTORS.find(k => k.label === selectedKType)?.desc || 'Custom manually entered size factor.'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex justify-between">
                <span>Instrumental Broadening</span>
                <span className="text-[10px] text-slate-500 font-mono">(deg)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={instFwhm}
                onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                className="w-full px-4 py-3 bg-black/40 text-amber-400 border border-slate-600 focus:border-amber-500 rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm transition-all"
              />
              <div className="mt-3 flex items-start gap-2 text-[11px] font-bold text-slate-400 bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span><span className="text-amber-400">Subtracts instrumental width:</span> β² = B²obs - B²inst</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Peak Data Input
                </label>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                  <span>Format: 2θ, FWHM</span>
                </div>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2&#10;47.30, 0.25"
                className="w-full h-32 px-4 py-3 bg-black/40 text-amber-400 border border-slate-600 focus:border-amber-500 rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none font-mono text-sm leading-relaxed resize-none transition-all placeholder:text-slate-700"
                spellCheck={false}
              />
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Calculate Size
            </button>
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Scientific Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Scherrer Foundation</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Formula</span>
              </div>
              <div className="bg-black/60 p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-slate-700 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="truncate">D = (K · λ) / (β · cosθ)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicability Range</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Valid for crystallites smaller than ~100-200 nm. Above this limit, peaks become too sharp to distinguish from the instrumental response.
              </p>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Assumptions</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                Assumes all broadening stems from size. Strain, defects, and instrument factors also contribute. Use Williamson-Hall for decoupling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col gap-6 h-full">
          {/* Summary Card */}
          <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
             <div className="relative z-10">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Average Crystallite Size</h3>
               <p className="text-xs text-slate-500 font-medium">Averaged over {results.filter(r => !r.error).length} valid peaks</p>
             </div>
             <div className="text-left md:text-right relative z-10 flex items-baseline gap-1.5">
               <span className="text-5xl font-black text-white">{avgSize.toFixed(2)}</span>
               <span className="text-xl text-amber-500 font-bold uppercase tracking-widest">nm</span>
             </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-slate-900 rounded-xl shadow-xl border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-[400px]">
             <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Peak Analysis Details</h3>
              {results.some(r => r.error) && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Some peaks have errors</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
               {results.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-slate-500 p-8 text-center text-sm">
                   Enter peak data (2θ and observed FWHM) to calculate sizes.
                 </div>
               ) : (
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-800/50 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-black border-b border-slate-700/50">2θ (deg)</th>
                      <th scope="col" className="px-6 py-4 font-black border-b border-slate-700/50">FWHM Obs (deg)</th>
                      <th scope="col" className="px-6 py-4 font-black border-b border-slate-700/50">β Corrected (deg)</th>
                      <th scope="col" className="px-6 py-4 font-black border-b border-slate-700/50 text-right text-amber-500">Size (nm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {results.map((row, index) => (
                      <tr key={index} className="bg-slate-900/20 hover:bg-slate-800/40 transition-colors group">
                        <td className="px-6 py-4 font-mono font-bold text-white">{row.twoTheta.toFixed(3)}°</td>
                        <td className="px-6 py-4 font-mono text-slate-400">{row.fwhmObs.toFixed(4)}°</td>
                        <td className="px-6 py-4 font-mono text-slate-400">
                          {row.error ? <span className="text-slate-600">-</span> : `${row.betaCorrected.toFixed(4)}°`}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {row.error ? (
                            <span className="text-rose-400 text-[10px] font-bold bg-rose-500/10 px-2 py-1.5 rounded uppercase tracking-wider inline-block whitespace-nowrap">
                              {row.error.toLowerCase().includes("zero") ? "No Broadening" : "Invalid Input"}
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 font-mono font-bold text-lg px-3 py-1.5 rounded-lg border border-amber-500/20 inline-block">
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
