import React, { useState, useEffect } from 'react';
import { IntegralBreadthInput, IntegralBreadthResult } from '../types';
import { parseIntegralBreadthInput, calculateIntegralBreadth } from '../utils/physics';
import { Info, BookOpen, Activity, Calculator } from 'lucide-react';

export const IntegralBreadthModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  // Default Example: 2Theta, FWHM, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 0.22, 230, 1000\n47.30, 0.26, 280, 950\n56.12, 0.31, 350, 900");
  const [results, setResults] = useState<IntegralBreadthResult[]>([]);
  const [avgSize, setAvgSize] = useState<number>(0);

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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-purple-600" />
            Integral Breadth Config
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Wavelength (Å)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Constant K
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={constantK}
                  onChange={(e) => setConstantK(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Peak Data Input
              </label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500 mb-2 font-mono flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Format: 2θ, FWHM, Area, Imax
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.22, 230, 1000"
                className="w-full h-40 px-4 py-3 bg-slate-900 text-purple-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-2">
                Integral Breadth β = Area / Imax. Ensure Area and Imax units are consistent (e.g., counts*deg and counts).
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Calculate Results
            </button>
          </div>
        </div>

        {/* Theory Card */}
        <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold">Theory: Integral Breadth</h3>
          </div>
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-800 p-3 rounded-lg font-mono text-center text-purple-300 text-sm mb-2">
              β = Area / Imax
            </div>
            <p>
              Integral Breadth uses the total area under the peak divided by the maximum intensity. It is often more robust than FWHM for irregular peak shapes.
            </p>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Shape Factor (φ = FWHM / β)</span>
              <ul className="space-y-1 pl-2 border-l-2 border-slate-700">
                <li><span className="text-blue-400 font-bold">Lorentzian:</span> φ ≈ 0.636</li>
                <li><span className="text-emerald-400 font-bold">Gaussian:</span> φ ≈ 0.939</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        {/* Summary Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
           <div>
             <h3 className="text-lg font-bold text-slate-800">Average Crystallite Size</h3>
             <p className="text-sm text-slate-600">Calculated from {results.length} peaks using Integral Breadth</p>
           </div>
           <div className="text-right">
             <span className="text-4xl font-black text-purple-700">{avgSize.toFixed(2)}</span>
             <span className="text-lg text-slate-700 font-bold ml-1">nm</span>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-slate-300 bg-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Detailed Analysis</h3>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Profile Analysis
              </span>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">No data calculated</p>
                <p className="text-xs mt-1">Enter peak parameters to see integral breadth analysis.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">2θ (deg)</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">β_IB (deg)</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">Shape Factor (φ)</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300">Profile Type</th>
                    <th scope="col" className="px-6 py-4 font-bold border-b border-slate-300 text-right">Size (nm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((res, index) => {
                    const profile = getProfileType(res.shapeFactorPhi);
                    return (
                      <tr key={index} className="bg-white border-b hover:bg-purple-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {res.twoTheta.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 font-mono text-purple-700 font-bold">
                          {res.integralBreadthDeg.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-700">
                          {res.shapeFactorPhi.toFixed(3)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${profile.bg} ${profile.color}`}>
                            {profile.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-right font-bold text-slate-900 text-lg">
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
