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
import { Info, BookOpen, Activity, TrendingDown } from 'lucide-react';

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
  }, [d1, d2, inputData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-600" />
            Warren-Averbach Config
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  d₁ (Peak 1) [Å]
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={d1}
                  onChange={(e) => setD1(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  d₂ (Peak 2) [Å]
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={d2}
                  onChange={(e) => setD2(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Fourier Coefficients Input
              </label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-500 mb-2 font-mono flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Format: L (nm), A(L)₁, A(L)₂
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="1, 0.95, 0.90"
                className="w-full h-64 px-4 py-3 bg-slate-900 text-rose-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter Fourier coefficients A(L) for two orders of reflection (e.g., 111 and 222) at various lengths L.
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Run Fourier Analysis
            </button>
          </div>
        </div>

        {/* Theory Card */}
        <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold">Theory: Warren-Averbach</h3>
          </div>
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-800 p-3 rounded-lg font-mono text-center text-rose-400 text-sm mb-2">
              ln A(L) = ln A_S(L) - 2π²L²ε² / d²
            </div>
            <p>
              The Warren-Averbach method uses Fourier coefficients of line profiles from multiple orders of reflection (e.g., 111 and 222) to separate size and strain broadening.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>A_S(L):</strong> Size Fourier coefficients (intercept of ln A vs 1/d² plot).</li>
              <li><strong>ε (RMS Strain):</strong> Root-mean-square strain (from slope).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Chart 1: Size Coefficients */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              Size Coefficients (A_size vs L)
            </h3>
          </div>
          {!result ? (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">No data</div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.sizeDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'L (nm)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle"/>
                  <Line type="monotone" dataKey="A_size" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48', strokeWidth: 2, stroke: '#fff' }} name="A_size (Size Only)" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: RMS Strain */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              RMS Strain Distribution (√⟨ε²⟩ vs L)
            </h3>
          </div>
          {!result ? (
             <div className="flex-1 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">No data</div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.strainDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'L (nm)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#94a3b8', strokeDasharray: '3 3' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle"/>
                  <Line type="monotone" dataKey="rms_strain" stroke="#0891b2" strokeWidth={3} dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }} name="RMS Strain" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="p-4 border-b border-slate-300 bg-slate-100 flex justify-between items-center">
             <h3 className="font-bold text-slate-800">Calculated Distribution Data</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-800">
                <thead className="text-xs text-slate-900 uppercase bg-slate-200">
                   <tr>
                      <th className="px-6 py-4 font-bold border-b border-slate-300">L (nm)</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-300">A_size</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-300">RMS Strain</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                   {result && result.sizeDistribution.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50 transition-colors group">
                         <td className="px-6 py-4 font-bold text-slate-900">{row.L_nm}</td>
                         <td className="px-6 py-4 font-mono font-bold text-rose-700">{row.A_size.toFixed(4)}</td>
                         <td className="px-6 py-4 font-mono font-bold text-cyan-700">
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
