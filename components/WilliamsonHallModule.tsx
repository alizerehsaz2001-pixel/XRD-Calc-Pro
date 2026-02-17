import React, { useState, useEffect } from 'react';
import { parseScherrerInput, calculateWilliamsonHall } from '../utils/physics';
import { WHResult } from '../types';
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

export const WilliamsonHallModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1);
  const [inputData, setInputData] = useState<string>("28.44, 0.25\n47.30, 0.28\n56.12, 0.32\n69.13, 0.38\n76.38, 0.42");
  const [result, setResult] = useState<WHResult | null>(null);

  const handleCalculate = () => {
    const peaks = parseScherrerInput(inputData);
    const computed = calculateWilliamsonHall(wavelength, constantK, instFwhm, peaks);
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
    twoTheta: p.twoTheta
  })) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-lg text-xs">
          <p className="font-bold mb-1">2θ: {d.twoTheta?.toFixed(2)}°</p>
          <p>X (4sinθ): <span className="text-cyan-300">{d.x.toFixed(4)}</span></p>
          <p>Y (βcosθ): <span className="text-cyan-300">{d.y.toFixed(4)}</span></p>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            W-H Plot Parameters
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
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm font-bold font-mono"
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
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm font-bold font-mono"
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
                className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Peak Data (2θ, FWHM)
              </label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2&#10;47.30, 0.28"
                className="w-full h-32 px-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter at least 3 peaks for reliable regression.
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Generate W-H Plot
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-xs text-slate-500 uppercase font-semibold">Microstrain (ε)</p>
             <p className="text-2xl font-bold text-cyan-700">
               {result ? result.strainPercent.toExponential(3) : '-'} %
             </p>
             <p className="text-xs text-slate-400 mt-1">From Slope</p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-xs text-slate-500 uppercase font-semibold">Crystallite Size</p>
             <p className="text-2xl font-bold text-cyan-700">
               {result ? (result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞') : '-'} <span className="text-sm">nm</span>
             </p>
             <p className="text-xs text-slate-400 mt-1">From Intercept</p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <p className="text-xs text-slate-500 uppercase font-semibold">Fit Quality (R²)</p>
             <p className="text-2xl font-bold text-cyan-700">
               {result ? result.regression.rSquared.toFixed(4) : '-'}
             </p>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 ml-2">Williamson-Hall Plot</h3>
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Insufficient data for plot
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0">
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
                    label={{ value: 'β cos(θ) [rad]', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Legend verticalAlign="top" height={36}/>
                  <Scatter name="Observed Data" dataKey="y" fill="#0891b2" />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    dot={false} 
                    name="Linear Fit"
                    activeDot={false}
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