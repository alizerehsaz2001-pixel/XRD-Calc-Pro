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
import { RefreshCw, Trash2, Settings2, Info, FileText } from 'lucide-react';

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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-pink-600" />
                IB Advanced Config
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Size-strain separation using Integral Breadth (Area/Imax).
              </p>
            </div>
            <button 
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-pink-600 transition-colors flex items-center gap-1"
              title="Reset to defaults"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wavelength (Å)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm font-bold font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Constant K
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={constantK}
                    onChange={(e) => setConstantK(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm font-bold font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrument β_IB (deg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={instBetaIB}
                  onChange={(e) => setInstBetaIB(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm font-bold font-mono transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Linear subtraction (Lorentzian assumption)
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Peak Data
                </label>
                <button 
                  onClick={handleClear}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="28.44, 230, 1000&#10;47.30, 280, 950"
                  className="w-full h-40 px-4 py-3 bg-slate-900 text-pink-300 border border-slate-700 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all font-mono text-sm leading-relaxed shadow-inner"
                />
                <div className="absolute top-2 right-2 text-[10px] text-slate-500 font-mono bg-slate-800/50 px-2 py-1 rounded">
                  Format: 2θ, Area, Imax
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-500">
                  Integral Breadth β = Area / Imax is calculated automatically.
                </p>
                <span className={`text-[10px] font-bold ${parseIBAdvancedInput(inputData).length >= 2 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {parseIBAdvancedInput(inputData).length} valid peaks
                </span>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={parseIBAdvancedInput(inputData).length < 2}
              className={`w-full py-3 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                parseIBAdvancedInput(inputData).length >= 2
                  ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-200 hover:shadow-pink-300' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Analyze Size & Strain
            </button>
            
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 overflow-hidden">
               <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-2">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output JSON</span>
                 <button onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result,null,2))} className="text-[10px] font-bold text-pink-600 hover:text-pink-700 transition-colors">Copy</button>
               </div>
               <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto max-h-32">
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
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-xs text-slate-500 uppercase font-semibold">Microstrain (ε)</p>
             <p className="text-2xl font-bold text-pink-700">
               {result ? result.strainPercent.toExponential(3) : '-'} %
             </p>
             <p className="text-xs text-slate-400 mt-1">From W-H Slope</p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-xs text-slate-500 uppercase font-semibold">Crystallite Size</p>
             <p className="text-2xl font-bold text-pink-700">
               {result ? (result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞') : '-'} <span className="text-sm">nm</span>
             </p>
             <p className="text-xs text-slate-400 mt-1">From Intercept</p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-xs text-slate-500 uppercase font-semibold">Fit Quality (R²)</p>
             <p className="text-2xl font-bold text-pink-700">
               {result ? result.regression.rSquared.toFixed(4) : '-'}
             </p>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col relative">
          <div className="flex justify-between items-center mb-4 ml-2">
            <h3 className="text-sm font-semibold text-slate-600">Integral Breadth W-H Plot</h3>
            {result && (
              <div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                y = <span className="text-pink-600 font-bold">{result.regression.slope.toFixed(5)}</span>x + <span className="text-pink-600 font-bold">{result.regression.intercept.toFixed(5)}</span>
              </div>
            )}
          </div>
          
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Insufficient data for plot (need 2+ peaks)
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin - 0.2', 'dataMax + 0.2']}
                    label={{ value: '4 sin(θ)', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 12 }}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis 
                    label={{ value: 'β_IB cos(θ) [rad]', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Scatter 
                    name="Observed Data" 
                    dataKey="y" 
                    fill="#db2777" 
                    shape="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#475569" 
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