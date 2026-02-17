import React, { useState, useEffect } from 'react';
import { simulatePeak } from '../utils/physics';
import { FWHMResult } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export const FWHMModule: React.FC = () => {
  const [type, setType] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt'>('Pseudo-Voigt');
  const [center, setCenter] = useState<number>(30);
  const [fwhm, setFwhm] = useState<number>(0.5);
  const [eta, setEta] = useState<number>(0.5);
  const [amplitude, setAmplitude] = useState<number>(100);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<FWHMResult | null>(null);

  useEffect(() => {
    const range: [number, number] = [center - fwhm * 4, center + fwhm * 4];
    const { points, stats } = simulatePeak(type, center, fwhm, eta, amplitude, range);
    setChartData(points);
    setStats(stats);
  }, [type, center, fwhm, eta, amplitude]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Line Profile Simulator
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Profile Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${
                      type === t 
                        ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                    }`}
                  >
                    {t === 'Pseudo-Voigt' ? 'P-Voigt' : t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">Peak Center (2θ)</label>
                <span className="text-xs font-mono text-orange-600 font-bold">{center.toFixed(2)}°</span>
              </div>
              <input
                type="range" min="10" max="150" step="0.1"
                value={center} onChange={(e) => setCenter(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-700">FWHM (Δ2θ)</label>
                <span className="text-xs font-mono text-orange-600 font-bold">{fwhm.toFixed(3)}°</span>
              </div>
              <input
                type="range" min="0.01" max="5" step="0.01"
                value={fwhm} onChange={(e) => setFwhm(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
            </div>

            {type === 'Pseudo-Voigt' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700">Mixing Factor (η)</label>
                  <span className="text-xs font-mono text-orange-600 font-bold">{(eta * 100).toFixed(0)}% L</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={eta} onChange={(e) => setEta(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold">
                  <span>Gaussian</span>
                  <span>Lorentzian</span>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Strict JSON Results</h3>
               <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                 <pre className="text-[10px] font-mono text-orange-400">
                   {JSON.stringify({
                     module: "FWHM-Basics",
                     profile_type: type,
                     results: stats
                   }, null, 2)}
                 </pre>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualizer and Stats */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 mb-6">Peak Profile Visualizer</h3>
           <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                 <defs>
                   <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis 
                   dataKey="x" 
                   type="number" 
                   domain={['auto', 'auto']} 
                   tick={{fontSize: 10}}
                   label={{ value: '2θ (degrees)', position: 'bottom', offset: 15, fontSize: 12, fontWeight: 'bold' }}
                 />
                 <YAxis hide domain={[0, amplitude * 1.1]} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                   labelFormatter={(val) => `2θ: ${val.toFixed(3)}°`}
                   formatter={(val: number) => [val.toFixed(2), 'Intensity']}
                 />
                 <ReferenceLine y={amplitude / 2} stroke="#cbd5e1" strokeDasharray="3 3" label={{ position: 'right', value: 'Half Max', fontSize: 10, fill: '#64748b' }} />
                 <Area 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#ea580c" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorY)" 
                    isAnimationActive={false}
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block mb-2">Integral Breadth (β)</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{stats?.integralBreadth.toFixed(4)}°</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Line width of a rectangle with same area and height as the peak.</p>
           </div>
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Shape Factor (φ)</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{stats?.shapeFactor.toFixed(3)}</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">FWHM / β ratio. Pure Gaussian ≈ 0.94, Pure Lorentzian ≈ 0.64.</p>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Total Integrated Area</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">{stats?.area.toFixed(1)}</span>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Sum of intensity. Used for structure factor calculations.</p>
           </div>
        </div>

        {/* Contrast Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="p-4 border-b border-slate-300 bg-slate-100">
            <h3 className="font-bold text-slate-800">Characteristic Comparison</h3>
          </div>
          <table className="w-full text-sm text-left text-slate-800">
            <thead className="text-xs text-slate-900 uppercase bg-slate-200">
              <tr>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Property</th>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Gaussian</th>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Lorentzian</th>
                <th className="px-6 py-3 font-bold border-b border-slate-300">Current Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="px-6 py-3 font-bold text-slate-700">Tail Decay</td>
                <td className="px-6 py-3 text-slate-600">Exponential (Fast)</td>
                <td className="px-6 py-3 text-slate-600">Polynomial (Slow)</td>
                <td className="px-6 py-3 text-orange-700 font-bold">{type}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-bold text-slate-700">Shape Factor (φ)</td>
                <td className="px-6 py-3 font-mono">0.939</td>
                <td className="px-6 py-3 font-mono">0.637</td>
                <td className="px-6 py-3 font-mono font-bold">{stats?.shapeFactor.toFixed(3)}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-bold text-slate-700">Physical Origin</td>
                <td className="px-6 py-3 text-slate-500 italic">Instrument/Strain</td>
                <td className="px-6 py-3 text-slate-500 italic">Crystallite Size</td>
                <td className="px-6 py-3 text-slate-700">Hybrid</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};