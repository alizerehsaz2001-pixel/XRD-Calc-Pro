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
import { Info, BookOpen, Activity, TrendingDown, Sparkles, Loader2, Atom, Binary, ShieldQuestion, Ruler, Zap, Database, Settings, FlaskConical, Network, Component } from 'lucide-react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate realistic Fourier coefficients for Warren-Averbach analysis of ${searchQuery}.
        Provide 8 to 12 data points. For each point, provide:
        - L (column length in nm, starting from 1 or 2, increasing)
        - A1 (Fourier coefficient for the first reflection, e.g., 111, starting near 1.0 and decaying)
        - A2 (Fourier coefficient for the second order reflection, e.g., 222, starting near 1.0 but decaying faster than A1)
        Make sure the decay is physically realistic (A2 decays faster due to strain).
        Return ONLY a JSON array of objects.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                L: { type: Type.NUMBER },
                A1: { type: Type.NUMBER },
                A2: { type: Type.NUMBER }
              },
              required: ["L", "A1", "A2"]
            }
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        const formattedData = data.map((p: any) => `${p.L.toFixed(1)}, ${p.A1.toFixed(3)}, ${p.A2.toFixed(3)}`).join('\n');
        setInputData(formattedData);
      }
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setIsThinking(false);
    }
  };

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
        <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <Settings className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">System Config</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Warren-Averbach Engine</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Smart Load Section */}
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all group/smart">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-3.5 h-3.5 text-rose-400" />
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Synthesis Engine
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Nanocrystalline Gold"
                  className="flex-1 px-4 py-3 bg-black/60 text-rose-400 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none text-sm transition-all placeholder:text-slate-700 font-bold"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-4 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-xl transition-all flex items-center gap-2 border border-rose-500/50 disabled:border-slate-700 active:scale-95 shadow-lg shadow-rose-900/20"
                >
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    d₁ (Peak 1)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={d1}
                    onChange={(e) => setD1(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-black/60 text-rose-400 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none font-mono text-sm font-black transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase">Å</span>
                </div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    d₂ (Peak 2)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={d2}
                    onChange={(e) => setD2(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-black/60 text-rose-400 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none font-mono text-sm font-black transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase">Å</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-rose-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Fourier Array
                  </label>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-slate-700/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Stream Active</span>
                </div>
              </div>
              
              <div className="relative group/textarea">
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="1, 0.95, 0.90"
                  className="w-full h-52 px-5 py-4 bg-black/60 text-rose-400 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/40 outline-none font-mono text-xs leading-loose resize-none transition-all shadow-inner custom-scrollbar"
                  spellCheck={false}
                />
                <div className="absolute top-2 right-3 flex gap-1">
                   <div className="w-2 h-2 rounded-full bg-rose-500/20" />
                   <div className="w-2 h-2 rounded-full bg-rose-500/40" />
                   <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 flex gap-3 items-start">
                <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Input vector requires <span className="text-rose-300 font-bold">L (column length)</span>, followed by <span className="text-rose-300 font-bold">A(L)</span> coefficients for two distinct orders (e.g., 111 & 222).
                </p>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-[0_15px_30px_rgba(225,29,72,0.2)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-400/0 via-white/20 to-rose-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="uppercase tracking-[0.2em] text-sm">Execute Fourier Analysis</span>
            </button>
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-rose-500/20 rounded-xl border border-rose-500/30">
              <BookOpen className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Scientific Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Fourier Microstructure</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Fourier Model</span>
              </div>
              <div className="bg-black/60 p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-slate-700 shadow-inner text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="truncate">ln A(L) = ln A_S(L) - 2π²L²ε² / d²</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Separation Principle</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Uses Fourier coefficients from multiple reflection orders. The size contribution is independent of order (1/d²), while strain increases with it.
              </p>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ShieldQuestion className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribution Insights</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                A_S(L) directly relates to the column-length distribution of crystallites, providing more detail than a single average value.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Chart 1: Size Coefficients */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[450px] flex flex-col relative overflow-hidden group/size">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl group-hover/size:bg-rose-500/10 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/30">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                Size Coefficients
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-1">Fourier Distribution A_size(L)</p>
            </div>
            {result && (
               <div className="px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  Validated Matrix
               </div>
            )}
          </div>

          {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-3xl bg-black/20 gap-3">
                <Loader2 className="w-8 h-8 animate-pulse text-slate-700" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Initialize Sequence Output</span>
             </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.sizeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="sizeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'Fourier Length [L nm]', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#fb7185', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#334155', strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="A_size" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#0f172a' }} 
                    name="A_size" 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 3 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: RMS Strain */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[450px] flex flex-col relative overflow-hidden group/strain">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl group-hover/strain:bg-cyan-500/10 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                Microstrain Distribution
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-1">RMS Displacement √⟨ε²⟩ vs L</p>
            </div>
            {result && (
               <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                  Dynamic Strain Analysis
               </div>
            )}
          </div>

          {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-3xl bg-black/20 gap-3">
                <Loader2 className="w-8 h-8 animate-pulse text-slate-700" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Awaiting Harmonic Computation</span>
             </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.strainDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'Fourier Length [L nm]', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => val.toExponential(1)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#22d3ee', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#334155', strokeWidth: 1 }}
                    formatter={(val: number) => val.toExponential(4)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rms_strain" 
                    stroke="#0891b2" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#0f172a' }} 
                    name="RMS Strain" 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#0891b2', strokeWidth: 3 }}
                    animationDuration={1500}
                    animationBegin={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative group/table">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover/table:bg-emerald-500/10 transition-all duration-1000"></div>
          
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center relative z-10">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                  <Network className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">Spectral Indices</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Microstructural Tabulation</p>
                </div>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-full border border-slate-800/50">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Data Sync</span>
             </div>
          </div>
          <div className="overflow-x-auto relative z-10">
             <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-500 uppercase tracking-[0.2em] bg-black/40 border-b border-slate-800">
                   <tr>
                      <th className="px-8 py-5 font-black">L Parameter [nm]</th>
                      <th className="px-8 py-5 font-black">A_size (Fourier)</th>
                      <th className="px-8 py-5 font-black">RMS Strain Level</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono text-xs">
                   {result && result.sizeDistribution.map((row, i) => (
                      <tr key={i} className="group hover:bg-slate-800/20 transition-all duration-300">
                         <td className="px-8 py-4 font-black text-slate-300 border-l border-transparent group-hover:border-emerald-500/50 group-hover:pl-10 transition-all">
                            {row.L_nm.toFixed(1)}
                         </td>
                         <td className="px-8 py-4 font-black text-rose-400">
                            {row.A_size.toFixed(5)}
                         </td>
                         <td className="px-8 py-4 font-black text-cyan-400">
                            {result.strainDistribution[i]?.rms_strain.toExponential(4)}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {!result && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
                   <Binary className="w-12 h-12 text-slate-800 animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Spectral Input</p>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};
