import React, { useState, useEffect } from 'react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../types';
import { parseIntegralBreadthInput, calculateIntegralBreadth } from '../utils/physics';

export const IntegralBreadthModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  // Default Example: 2Theta, FWHM, Area, Imax
  // Roughly: FWHM ~ 0.2, Area ~ 200, Imax ~ 1000 => IB ~ 0.2
  const [inputData, setInputData] = useState<string>("28.44, 0.22, 230, 1000\n47.30, 0.26, 280, 950\n56.12, 0.31, 350, 900");
  const [results, setResults] = useState<IntegralBreadthResult[]>([]);

  const handleCalculate = () => {
    const peaks = parseIntegralBreadthInput(inputData);
    const computed = peaks
      .map(p => calculateIntegralBreadth(wavelength, constantK, p))
      .filter((r): r is IntegralBreadthResult => r !== null);
    
    setResults(computed);
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Input Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Integral Breadth Config
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
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-bold font-mono"
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
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Peak Data (Comma separated)
              </label>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs text-slate-500 mb-2 font-mono">
                Format: 2θ, FWHM, Area, Imax
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.22, 230, 1000"
                className="w-full h-40 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-1">
                β_IB = Area / Imax is used for calculations.
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Calculate Integral Breadth
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col h-full min-h-[500px]">
          <div className="p-4 border-b border-slate-300 bg-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Calculation Results</h3>
            <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {results.length} Valid Peaks
            </span>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            {results.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 p-8">
                Enter peak data (2θ, FWHM, Area, Imax) to view results.
              </div>
            ) : (
              <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">2θ (deg)</th>
                    <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">β_IB (deg)</th>
                    <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300">Shape Factor (φ)</th>
                    <th scope="col" className="px-6 py-3 font-bold border-b border-slate-300 text-right">Size (nm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((res, index) => (
                    <tr key={index} className="bg-white border-b hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-900">
                        {res.twoTheta.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 font-mono text-purple-700 font-bold">
                        {res.integralBreadthDeg.toFixed(4)}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-700">
                        {res.shapeFactorPhi.toFixed(3)}
                      </td>
                      <td className="px-6 py-3 font-mono text-right font-bold text-slate-900">
                        {res.calcSizeNm.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            <p className="mb-1"><strong>Note on Shape Factor (φ):</strong></p>
            <p>φ ≈ 0.64 (Lorentzian), φ ≈ 0.94 (Gaussian). Intermediate values imply Pseudo-Voigt profile.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
