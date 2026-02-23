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
  Legend,
  ReferenceLine
} from 'recharts';
import { Info, BookOpen, AlertTriangle, TrendingUp, Ruler } from 'lucide-react';

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
  }, [wavelength, constantK, instFwhm, inputData]);

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
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <p className="font-bold mb-2 text-cyan-400 border-b border-slate-700 pb-1">Peak at {d.twoTheta?.toFixed(2)}°</p>
          <div className="space-y-1 font-mono">
            <p className="flex justify-between gap-4"><span>X (4sinθ):</span> <span>{d.x.toFixed(4)}</span></p>
            <p className="flex justify-between gap-4"><span>Y (βcosθ):</span> <span>{d.y.toFixed(4)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            W-H Parameters
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
                  className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-mono font-bold"
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
                  className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Instrument FWHM (deg)
              </label>
              <input
                type="number"
                step="0.01"
                value={instFwhm}
                onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-mono font-bold"
              />
              <p className="text-xs text-slate-500 mt-1">
                Instrumental contribution (e.g. standard reference peak width).
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Peak Data (2θ, FWHM)
              </label>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2&#10;47.30, 0.28"
                className="w-full h-40 px-4 py-3 bg-slate-900 text-cyan-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Enter at least 3 peaks for reliable regression.
              </p>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Generate W-H Plot
            </button>
          </div>
        </div>

        {/* Theory Card */}
        <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-bold">Theory: UDM Model</h3>
          </div>
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-800 p-3 rounded-lg font-mono text-center text-cyan-400 text-sm mb-2">
              βcosθ = ε(4sinθ) + Kλ/D
            </div>
            <p>
              The Williamson-Hall analysis separates size and strain broadening by plotting <strong>βcosθ</strong> (y-axis) vs <strong>4sinθ</strong> (x-axis).
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Slope (ε):</strong> Represents the microstrain in the lattice.</li>
              <li><strong>Y-Intercept (Kλ/D):</strong> Related to the crystallite size (D).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        {/* Results Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-12 h-12 text-cyan-600" />
             </div>
             <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Microstrain (ε)</p>
             <p className="text-3xl font-black text-cyan-700 mt-2">
               {result ? result.strainPercent.toExponential(2) : '-'} <span className="text-sm font-bold text-slate-400">%</span>
             </p>
             <p className="text-xs text-slate-400 mt-1 font-medium">Derived from Slope</p>
           </div>
           
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Ruler className="w-12 h-12 text-cyan-600" />
             </div>
             <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Crystallite Size</p>
             <p className="text-3xl font-black text-cyan-700 mt-2">
               {result ? (result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞') : '-'} <span className="text-sm font-bold text-slate-400">nm</span>
             </p>
             <p className="text-xs text-slate-400 mt-1 font-medium">Derived from Intercept</p>
           </div>

           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
             <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Fit Quality (R²)</p>
             <div className="flex items-end gap-2 mt-2">
               <p className={`text-3xl font-black ${result && result.regression.rSquared > 0.9 ? 'text-emerald-600' : 'text-amber-600'}`}>
                 {result ? result.regression.rSquared.toFixed(4) : '-'}
               </p>
             </div>
             <p className="text-xs text-slate-400 mt-1 font-medium">Linear Regression Fit</p>
           </div>
        </div>

        {/* Warnings */}
        {result && result.sizeInterceptNm === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-800">Negative or Zero Intercept Detected</h4>
              <p className="text-xs text-amber-700 mt-1">
                The y-intercept is non-positive, which implies an infinite or unphysical crystallite size. This often happens when:
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>Instrumental broadening is overestimated.</li>
                  <li>The sample has very large grains ({'>'}200nm).</li>
                  <li>Strain is the dominant factor and data is noisy.</li>
                </ul>
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-700">Williamson-Hall Plot</h3>
            {result && (
              <div className="text-xs font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">
                y = {result.regression.slope.toFixed(5)}x {result.regression.intercept >= 0 ? '+' : '-'} {Math.abs(result.regression.intercept).toFixed(5)}
              </div>
            )}
          </div>
          
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Insufficient data for plot</p>
              <p className="text-xs mt-1">Enter at least 2 valid peaks to generate the regression.</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['auto', 'auto']}
                    label={{ value: '4 sin(θ)', position: 'bottom', offset: 20, fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    label={{ value: 'β cos(θ) [rad]', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Scatter name="Observed Data" dataKey="y" fill="#0891b2" shape="circle" r={5} />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#ef4444" 
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
