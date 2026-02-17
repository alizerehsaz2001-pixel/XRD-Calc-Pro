import React, { useState, useEffect } from 'react';
import { ScherrerInput, ScherrerResult } from '../types';
import { parseScherrerInput, calculateScherrer } from '../utils/physics';

export const ScherrerModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1); // Instrumental broadening
  const [inputData, setInputData] = useState<string>("28.44, 0.25\n47.30, 0.28\n56.12, 0.32");
  
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
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Scherrer Parameters
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Wavelength (Å)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Constant K
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={constantK}
                  onChange={(e) => setConstantK(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Instrument FWHM (deg)
              </label>
              <input
                type="number"
                step="0.01"
                value={instFwhm}
                onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm font-bold font-mono"
              />
              <p className="text-xs text-slate-500 mt-1">
                Instrumental contribution (e.g. standard reference peak width).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Peak Data (2θ, FWHM)
              </label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2&#10;47.30, 0.25"
                className="w-full h-32 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-1">
                Format: Peak Position (2θ), Measured FWHM (deg).
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Calculate Crystallite Size
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8">
        <div className="flex flex-col gap-6 h-full">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Average Crystallite Size</h3>
               <p className="text-sm text-slate-600">Averaged over {results.filter(r => !r.error).length} valid peaks</p>
             </div>
             <div className="text-right">
               <span className="text-3xl font-bold text-amber-700">{avgSize.toFixed(2)}</span>
               <span className="text-sm text-slate-700 font-bold ml-1">nm</span>
             </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col flex-1 min-h-[400px]">
            <div className="p-4 border-b border-slate-300 bg-slate-100">
              <h3 className="font-bold text-slate-800">Peak Analysis Details</h3>
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
                      <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">2θ (deg)</th>
                      <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">FWHM Obs (deg)</th>
                      <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">β Corrected (deg)</th>
                      <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 text-right">Size (nm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.map((row, index) => (
                      <tr key={index} className="bg-white border-b hover:bg-amber-50 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-900">{row.twoTheta.toFixed(3)}</td>
                        <td className="px-6 py-3 font-mono text-slate-700">{row.fwhmObs.toFixed(4)}</td>
                        <td className="px-6 py-3 font-mono text-slate-700">
                            {row.error ? <span className="text-slate-400">-</span> : row.betaCorrected.toFixed(4)}
                        </td>
                        <td className="px-6 py-3 text-right">
                            {row.error ? (
                              <span className="text-red-600 text-xs font-medium leading-tight inline-block max-w-[200px]">
                                {row.error}
                              </span>
                            ) : (
                              <span className="font-mono font-bold text-amber-700">
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