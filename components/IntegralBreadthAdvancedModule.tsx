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

export const IntegralBreadthAdvancedModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instBetaIB, setInstBetaIB] = useState<number>(0.1);
  // Default Data: 2Theta, Area, Imax
  const [inputData, setInputData] = useState<string>("28.44, 230, 1000\n47.30, 280, 950\n56.12, 350, 900\n69.13, 400, 850\n76.38, 450, 800");
  const [result, setResult] = useState<IBAdvancedResult | null>(null);

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
  const chartData = result ? result.points.map(p => ({
    x: p.x,
    y: p.y,
    fit: result.regression.slope * p.x + result.regression.intercept,
    twoTheta: p.twoTheta,
    betaSample: p.betaSample
  })) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs">
          <p className="font-bold mb-1">2θ: {d.twoTheta?.toFixed(2)}°</p>
          <p>β_IB Sample: <span className="text-pink-300">{d.betaSample?.toFixed(4)}°</span></p>
          <p>X (4sinθ): <span className="text-cyan-300">{d.x?.toFixed(4)}</span></p>
          <p>Y (βcosθ): <span className="text-cyan-300">{d.y?.toFixed(4)}</span></p>
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
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            IB Advanced Config
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Size-strain separation using Integral Breadth (Area/Imax) with modified Williamson-Hall.
          </p>

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
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm font-bold font-mono"
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
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Instrument β_IB (deg)
              </label>
              <input
                type="number"
                step="0.01"
                value={instBetaIB}
                onChange={(e) => setInstBetaIB(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm font-bold font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Linear subtraction used (Lorentzian assumption)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Peak Data (2θ, Area, Imax)
              </label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 230, 1000&#10;47.30, 280, 950"
                className="w-full h-32 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-1">
                Integral Breadth β = Area / Imax is calculated automatically.
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Analyze Size & Strain
            </button>
            
            <div className="bg-slate-900 rounded p-3 mt-4 overflow-x-auto">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Output JSON</span>
                 <button onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result,null,2))} className="text-[10px] text-pink-500">Copy</button>
               </div>
               <pre className="text-[10px] font-mono text-slate-300">
                 {result ? JSON.stringify({
                   module: "Integral-Breadth-Advanced",
                   method: "Williamson-Hall (Integral Breadth)",
                   correction: "Linear (Lorentzian)",
                   results: {
                     strain_percent: result.strainPercent,
                     size_intercept_nm: result.sizeInterceptNm,
                     r_squared: result.regression.rSquared
                   }
                 }, null, 2) : "// No data"}
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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 ml-2">Integral Breadth W-H Plot</h3>
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Insufficient data for plot (need 2+ peaks)
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    label={{ value: '4 sin(θ)', position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    label={{ value: 'β_IB cos(θ) [rad]', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Scatter name="Observed (Area/Imax)" dataKey="y" fill="#db2777" />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#475569" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Linear Fit"
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
