import React, { useState, useEffect } from 'react';
import { parseWAInput, calculateWarrenAverbach } from '../utils/physics';
import { WAResult } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const WarrenAverbachModule: React.FC = () => {
  const [d1, setD1] = useState<number>(2.35); // Approx (111) for Gold
  const [d2, setD2] = useState<number>(1.175); // Approx (222) for Gold
  
  // Default Data: Simulated coefficients for a nanomaterial
  const defaultData = `1, 0.95, 0.90
2, 0.90, 0.81
3, 0.85, 0.73
4, 0.80, 0.66
5, 0.76, 0.59
6, 0.72, 0.53
8, 0.65, 0.43
10, 0.58, 0.35
15, 0.42, 0.20
20, 0.30, 0.11`;

  const [inputData, setInputData] = useState<string>(defaultData);
  const [result, setResult] = useState<WAResult | null>(null);

  const handleCalculate = () => {
    const points = parseWAInput(inputData);
    const computed = calculateWarrenAverbach(d1, d2, points);
    setResult(computed);
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Warren-Averbach Config
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  d₁ (Peak 1) [Å]
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={d1}
                  onChange={(e) => setD1(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  d₂ (Peak 2) [Å]
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={d2}
                  onChange={(e) => setD2(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fourier Data (L, A₁, A₂)
              </label>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs text-slate-500 mb-2 font-mono">
                L (nm), Coeff 1, Coeff 2
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="1, 0.95, 0.90"
                className="w-full h-64 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-1">
                Provide coefficients for multiple harmonic lengths L.
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Run Fourier Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Chart 1: Size Coefficients */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 ml-2">Size Coefficients (A_size vs L)</h3>
          {!result ? (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.sizeDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="L_nm" label={{ value: 'L (nm)', position: 'bottom', offset: 0 }} />
                  <YAxis domain={[0, 1]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="A_size" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} name="A_size (Size Only)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: RMS Strain */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 ml-2">{"RMS Strain Distribution (√⟨ε²⟩ vs L)"}</h3>
          {!result ? (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.strainDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="L_nm" label={{ value: 'L (nm)', position: 'bottom', offset: 0 }} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Line type="monotone" dataKey="rms_strain" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} name="RMS Strain" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="p-4 border-b border-slate-300 bg-slate-100">
             <h3 className="font-bold text-slate-800">Calculated Distribution Data</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200">
                   <tr>
                      <th className="px-6 py-3 font-bold border-b border-slate-300">L (nm)</th>
                      <th className="px-6 py-3 font-bold border-b border-slate-300">A_size</th>
                      <th className="px-6 py-3 font-bold border-b border-slate-300">RMS Strain</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                   {result && result.sizeDistribution.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-3 font-bold text-slate-900">{row.L_nm}</td>
                         <td className="px-6 py-3 font-mono font-bold text-rose-700">{row.A_size.toFixed(4)}</td>
                         <td className="px-6 py-3 font-mono font-bold text-cyan-700">
                            {result.strainDistribution[i]?.rms_strain.toExponential(3)}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

      </div>
    </div>
  );
};