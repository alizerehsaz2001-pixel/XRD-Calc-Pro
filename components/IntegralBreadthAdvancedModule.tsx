import React, { useState, useEffect } from 'react';
import { parseIBAdvancedInput, calculateIBAdvanced } from '../utils/physics';
import { IBAdvancedResult } from '../types';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend
} from 'recharts';
import { RefreshCw, Trash2, Settings2, Info, FileText, ArrowUpRight, TrendingUp } from 'lucide-react';

export const IntegralBreadthAdvancedModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instBetaIB, setInstBetaIB] = useState<number>(0.1);
  // Default Data: 2Theta, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800");
  const [result, setResult] = useState<IBAdvancedResult | null>(null);

  const handleReset = () => {
    setWavelength(1.5406);
    setConstantK(0.9);
    setInstBetaIB(0.1);
    setInputData("28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800");
  };

  const handleClear = () => {
    setInputData("");
  };

  const handleCalculate = () => {
    const peaks = parseIBAdvancedInput(inputData);
    const computed = calculateIBAdvanced(wavelength, constantK, instBetaIB, peaks);
    setResult(computed);
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prepare chart data
  const chartData = result ? result.points.map(p => {
    const fitY = result.regression.slope * p.x + result.regression.intercept;
    return {
      x: p.x,
      y: p.y,
      fit: fitY,
      deviation: p.y - fitY,
      twoTheta: p.twoTheta,
      betaSample: p.betaSample
    };
  }) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs border border-slate-700">
          <p className="font-bold mb-2 border-b border-slate-600 pb-1">Peak at {d.twoTheta?.toFixed(2)}°</p>
          <div className="space-y-1">
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">β_IB Sample:</span>
              <span className="text-pink-300 font-mono">{d.betaSample?.toFixed(4)}°</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">X (4sinθ):</span>
              <span className="text-cyan-300 font-mono">{d.x?.toFixed(4)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-slate-400">Y (βcosθ):</span>
              <span className="text-cyan-300 font-mono">{d.y?.toFixed(4)}</span>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1">
              <span className="text-slate-400">Fit Deviation:</span>
              <span className={`font-mono ${d.deviation > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {d.deviation > 0 ? '+' : ''}{d.deviation?.toExponential(2)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-pink-600 rounded-full opacity-10 blur-2xl"></div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-500/20 rounded-xl border border-pink-500/30">
                <Settings2 className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">IB Advanced Config</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Size-strain separation using Integral Breadth.
                </p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-pink-400 bg-slate-800 hover:bg-pink-500/10 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-pink-500/30 transition-all flex items-center gap-1.5 mt-1"
              title="Reset to defaults"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Wavelength (Å)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-black/40 text-pink-400 border border-slate-600 focus:border-pink-500 rounded-lg focus:ring-2 focus:ring-pink-500/20 outline-none font-mono text-sm transition-all placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Constant K
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={constantK}
                    onChange={(e) => setConstantK(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-black/40 text-pink-400 border border-slate-600 focus:border-pink-500 rounded-lg focus:ring-2 focus:ring-pink-500/20 outline-none font-mono text-sm transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex justify-between items-center">
                  <span>Instrument β_IB</span>
                  <span className="text-[10px] text-slate-500 font-mono">(deg)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={instBetaIB}
                  onChange={(e) => setInstBetaIB(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-black/40 text-pink-400 border border-slate-600 focus:border-pink-500 rounded-lg focus:ring-2 focus:ring-pink-500/20 outline-none font-mono text-sm transition-all placeholder:text-slate-600"
                />
                <div className="mt-2 flex items-start gap-2 text-[11px] font-bold text-slate-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                  <Info className="w-4 h-4 text-pink-500 shrink-0" />
                  <span><span className="text-pink-400">Linear subtraction</span> (Lorentzian assumption)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Peak Data Input
                </label>
                <button 
                  onClick={handleClear}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-400 uppercase tracking-wider flex items-center gap-1 transition-colors bg-slate-800/50 hover:bg-red-500/10 px-2 py-1 rounded border border-slate-700 hover:border-red-500/30"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="28.44, 230, 1000&#10;47.30, 280, 950"
                  className="w-full h-40 px-4 py-3 bg-black/40 text-pink-400 border border-slate-600 focus:border-pink-500 rounded-lg focus:ring-2 focus:ring-pink-500/20 outline-none transition-all font-mono text-sm leading-relaxed placeholder:text-slate-700"
                />
                <div className="absolute top-3 right-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                  Format: 2θ, Area, Imax
                </div>
              </div>
              <div className="flex justify-between items-center mt-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  β = <span className="text-pink-400">Area / Imax</span> (auto-calculated)
                </p>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${parseIBAdvancedInput(inputData).length >= 2 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                  {parseIBAdvancedInput(inputData).length} valid peaks
                </span>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={parseIBAdvancedInput(inputData).length < 2}
              className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                parseIBAdvancedInput(inputData).length >= 2
                  ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-900/20 border border-pink-500 hover:border-pink-400' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              Analyze Size & Strain
            </button>
            
            <div className="bg-black/40 rounded-xl p-4 border border-slate-700/50 overflow-hidden relative group">
               <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Output JSON</span>
                 <button onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result,null,2))} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-pink-400 transition-colors bg-slate-800 hover:bg-pink-500/10 px-2 py-1 rounded border border-slate-700 hover:border-pink-500/30">Copy JSON</button>
               </div>
               <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto max-h-32 custom-scrollbar">
                 {result ? JSON.stringify({
                   module: "Integral-Breadth-Advanced",
                   method: "Williamson-Hall (Integral Breadth)",
                   correction: "Linear (Lorentzian)",
                   results: {
                     strain_percent: result.strainPercent,
                     size_intercept_nm: result.sizeInterceptNm,
                     r_squared: result.regression.rSquared
                   }
                 }, null, 2) : "// No data calculated"}
               </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-bl-full transition-all group-hover:scale-110" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Microstrain (ε)</p>
             <p className="text-3xl font-black text-pink-400 relative z-10">
               {result ? result.strainPercent.toExponential(3) : '-'} <span className="text-lg text-pink-500/50">%</span>
             </p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 relative z-10">From W-H Slope</p>
           </div>
           
           <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-bl-full transition-all group-hover:scale-110" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Crystallite Size</p>
             <p className="text-3xl font-black text-pink-400 relative z-10">
               {result ? (result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞') : '-'} <span className="text-lg text-pink-500/50">nm</span>
             </p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 relative z-10">From Intercept</p>
           </div>

           <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-bl-full transition-all group-hover:scale-110" />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Fit Quality (R²)</p>
             <p className="text-3xl font-black text-pink-400 relative z-10">
               {result ? result.regression.rSquared.toFixed(4) : '-'}
             </p>
             <div className="mt-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 relative z-10">
               {result && result.regression.rSquared > 0.95 ? (
                  <span className="text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Excellent Fit</span>
               ) : result && result.regression.rSquared > 0.8 ? (
                  <span className="text-amber-400">Acceptable Fit</span>
               ) : result ? (
                  <span className="text-red-400">Poor Fit</span>
               ) : (
                  <span className="text-slate-600">AWAITING DATA</span>
               )}
             </div>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 h-[500px] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Integral Breadth W-H Plot</h3>
            {result && (
              <div className="text-[10px] font-mono font-bold bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-lg text-pink-400">
                y = <span className="text-white">{result.regression.slope.toFixed(5)}</span>x + <span className="text-white">{result.regression.intercept.toFixed(5)}</span>
              </div>
            )}
          </div>
          
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 relative z-10">
               <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
               <p className="font-bold text-slate-400">Insufficient data for plot</p>
               <p className="text-xs mt-1">Need at least 2 valid peaks to generate the regression.</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                    label={{ value: '4 sin(θ)', position: 'bottom', offset: 20, fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    tickLine={{ stroke: '#334155' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    label={{ value: 'β_IB cos(θ) [rad]', angle: -90, position: 'insideLeft', offset: -10, fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    tickLine={{ stroke: '#334155' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Scatter 
                    name="Observed Data" 
                    dataKey="y" 
                    fill="#f472b6" 
                    shape="circle"
                    r={6}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#fb7185" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Linear Regression"
                    activeDot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};