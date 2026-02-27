import React, { useState, useEffect } from 'react';
import { ScherrerInput, ScherrerResult } from '../types';
import { parseScherrerInput, calculateScherrer } from '../utils/physics';
import { Info, BookOpen, AlertTriangle } from 'lucide-react';

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
  
  const [results, setResults] = useState<ScherrerResult[]>([]);
  const [avgSize, setAvgSize] = useState<number>(0);

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
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Wavelength (Å)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 bg-black/40 text-amber-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono text-sm transition-all"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">Cu Kα ≈ 1.5406</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Shape Factor (K)
              </label>
              <div className="space-y-3">
                <select 
                  value={selectedKType}
                  onChange={(e) => {
                    setSelectedKType(e.target.value);
                    const factor = K_FACTORS.find(k => k.label === e.target.value);
                    if (factor && factor.value !== 0) setConstantK(factor.value);
                  }}
                  className="w-full px-4 py-2.5 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-slate-800/80 text-white text-sm appearance-none"
                >
                  {K_FACTORS.map(k => (
                    <option key={k.label} value={k.label} className="bg-slate-800">{k.label}</option>
                  ))}
                </select>
                
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={constantK}
                    onChange={(e) => {
                      setConstantK(parseFloat(e.target.value));
                      setSelectedKType('Custom');
                    }}
                    className="flex-1 px-4 py-2.5 bg-black/40 text-amber-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm transition-all"
                  />
                  <div className="flex-1 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                    <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{K_FACTORS.find(k => k.label === selectedKType)?.desc || 'Custom value'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Instrumental Broadening (deg)
              </label>
              <input
                type="number"
                step="0.01"
                value={instFwhm}
                onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-black/40 text-amber-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm transition-all"
              />
              <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Subtracts instrumental width: β² = B²obs - B²inst</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Peak Data Input
              </label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2&#10;47.30, 0.25"
                className="w-full h-28 px-4 py-3 bg-black/40 text-amber-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none font-mono text-sm leading-relaxed resize-none transition-all"
                spellCheck={false}
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
                <span>Format: 2θ, FWHM</span>
                <span>(Comma/Space)</span>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Calculate Size
            </button>
          </div>
        </div>

        {/* Theory Card */}
        <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold">Theory & Limitations</h3>
          </div>
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-800 p-3 rounded-lg font-mono text-center text-amber-400 text-sm">
              D = (K · λ) / (β · cosθ)
            </div>
            <p>
              <strong className="text-white">Applicability:</strong> The Scherrer equation is only valid for crystallites smaller than ~100-200 nm. Above this, peaks are too sharp to distinguish from instrumental broadening.
            </p>
            <p>
              <strong className="text-white">Assumptions:</strong> It assumes all broadening is due to size. Strain, defects, and instrument factors also broaden peaks. Use Williamson-Hall for size-strain separation.
            </p>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col gap-6 h-full">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Average Crystallite Size</h3>
               <p className="text-sm text-slate-600">Averaged over {results.filter(r => !r.error).length} valid peaks</p>
             </div>
             <div className="text-right">
               <span className="text-4xl font-black text-amber-600">{avgSize.toFixed(2)}</span>
               <span className="text-lg text-slate-700 font-bold ml-1">nm</span>
             </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col flex-1 min-h-[400px]">
            <div className="p-4 border-b border-slate-300 bg-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Peak Analysis Details</h3>
              {results.some(r => r.error) && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Some peaks have errors</span>
                </div>
              )}
            </div>
            <div className="overflow-x-auto overflow-y-auto flex-1">
               {results.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center">
                   Enter peak data (2θ and observed FWHM) to calculate sizes.
                 </div>
               ) : (
                <table className="w-full text-sm text-left text-slate-800">
                  <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">2θ (deg)</th>
                      <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">FWHM Obs (deg)</th>
                      <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">β Corrected (deg)</th>
                      <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300 text-right">Size (nm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.map((row, index) => (
                      <tr key={index} className="bg-white border-b hover:bg-amber-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-900">{row.twoTheta.toFixed(3)}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">{row.fwhmObs.toFixed(4)}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                            {row.error ? <span className="text-slate-300">-</span> : row.betaCorrected.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-right">
                            {row.error ? (
                              <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100 inline-block whitespace-nowrap">
                                {row.error.toLowerCase().includes("zero") ? "No Broadening" : "Invalid Input"}
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-amber-700 text-lg">
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
