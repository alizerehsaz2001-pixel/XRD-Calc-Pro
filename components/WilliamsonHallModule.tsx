import React, { useState, useEffect, useRef } from 'react';
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
import { Info, BookOpen, AlertTriangle, TrendingUp, Ruler, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const K_FACTORS = [
  { label: 'Spherical (0.94)', value: 0.94, desc: 'Common for spherical crystallites' },
  { label: 'Cubic (0.9)', value: 0.9, desc: 'Common for cubic crystallites' },
  { label: 'Typical (0.89)', value: 0.89, desc: 'Standard generic value' }
];

export const WilliamsonHallModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1);
  const [inputData, setInputData] = useState<string>("28.44, 0.25\n47.30, 0.28\n56.12, 0.32\n69.13, 0.38\n76.38, 0.42");
  const [result, setResult] = useState<WHResult | null>(null);
  const [selectedKType, setSelectedKType] = useState<string>('Cubic (0.9)');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);

  // Ref for clicking outside
  const kMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-600 rounded-full opacity-10 blur-2xl"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">W-H Parameters</h2>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Wavelength (Å)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={(e) => setWavelength(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-black/40 text-cyan-400 border border-slate-600 focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono text-sm transition-all placeholder:text-slate-600"
                />
                <button 
                  onClick={() => setWavelength(1.5406)}
                  className="absolute right-2 top-2 bottom-2 px-3 text-[10px] font-bold text-slate-400 bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded transition-colors flex items-center justify-center uppercase tracking-wider"
                >
                  Cu Kα ≈ 1.5406
                </button>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Shape Factor (K)
              </label>
              <div className="space-y-3 relative" ref={kMenuRef}>
                <button
                  onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                  className="w-full px-4 py-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl outline-none transition-all flex items-center justify-between group shadow-inner"
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-sm font-bold text-white leading-none">
                      {selectedKType}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isKTypeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 py-1"
                    >
                      {K_FACTORS.map((k) => (
                        <button
                          key={k.label}
                          onClick={() => {
                            setSelectedKType(k.label);
                            if (k.value !== 0) setConstantK(k.value);
                            setIsKTypeMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors group/item
                            ${selectedKType === k.label ? 'bg-cyan-500/10' : ''}
                          `}
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className={`text-sm font-bold transition-colors ${selectedKType === k.label ? 'text-cyan-400' : 'text-slate-200'}`}>
                              {k.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                              {k.desc}
                            </span>
                          </div>
                          {selectedKType === k.label && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      value={constantK}
                      onChange={(e) => {
                        setConstantK(parseFloat(e.target.value));
                        setSelectedKType('Custom');
                      }}
                      className="w-full px-4 py-2.5 bg-black/40 text-cyan-400 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-sm transition-all"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50 h-full">
                    <Info className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="truncate leading-tight">{K_FACTORS.find(k => k.label === selectedKType)?.desc || 'Custom size factor.'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider flex justify-between">
                <span>Instrumental Broadening</span>
                <span className="text-[10px] text-slate-500 font-mono">(deg)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={instFwhm}
                onChange={(e) => setInstFwhm(parseFloat(e.target.value))}
                className="w-full px-4 py-3 bg-black/40 text-cyan-400 border border-slate-600 focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono text-sm transition-all"
              />
              <div className="mt-3 flex items-start gap-2 text-[11px] font-bold text-slate-400 bg-slate-800/80 p-3 rounded-lg border border-slate-700/50">
                <AlertTriangle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span><span className="text-cyan-400">Instrumental contribution</span> (e.g. standard reference peak width).</span>
              </div>
            </div>

            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Peak Data Input
                </label>
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded border border-slate-700">
                  <span>Format: 2θ, FWHM</span>
                </div>
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 0.2&#10;47.30, 0.28"
                className="w-full h-32 px-4 py-3 bg-black/40 text-cyan-400 border border-slate-600 focus:border-cyan-500 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono text-sm leading-relaxed resize-none transition-all placeholder:text-slate-700"
                spellCheck={false}
              />
              <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                <Info className="w-4 h-4 text-cyan-500 shrink-0" />
                <span>Enter at least 3 peaks for reliable regression.</span>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
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
           <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-12 h-12 text-cyan-500" />
             </div>
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Microstrain (ε)</p>
             <p className="text-3xl font-black text-white mt-2 flex items-baseline gap-1">
               {result ? result.strainPercent.toExponential(2) : '-'} <span className="text-sm font-bold text-cyan-500">%</span>
             </p>
             <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-400 font-medium">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
               Derived from Slope
             </div>
           </div>
           
           <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Ruler className="w-12 h-12 text-cyan-500" />
             </div>
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Crystallite Size</p>
             <p className="text-3xl font-black text-white mt-2 flex items-baseline gap-1">
               {result ? (result.sizeInterceptNm > 0 ? result.sizeInterceptNm.toFixed(2) : '∞') : '-'} <span className="text-sm font-bold text-cyan-500">nm</span>
             </p>
             <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-400 font-medium">
               <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
               Derived from Intercept
             </div>
           </div>

           <div className="bg-slate-900 p-5 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
             <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Fit Quality (R²)</p>
             <div className="flex items-end gap-2 mt-2">
               <p className={`text-3xl font-black ${result && result.regression.rSquared > 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                 {result ? result.regression.rSquared.toFixed(4) : '-'}
               </p>
             </div>
             <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-400 font-medium">
               <span className={`w-1.5 h-1.5 rounded-full ${result && result.regression.rSquared > 0.9 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
               Linear Regression Fit
             </div>
           </div>
        </div>

        {/* Warnings */}
        {result && result.sizeInterceptNm === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-400">Negative or Zero Intercept Detected</h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                The y-intercept is non-positive, which implies an infinite or unphysical crystallite size. This often happens when:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-slate-400 font-medium">
                <li>Instrumental broadening is overestimated.</li>
                <li>The sample has very large grains ({'>'}200nm).</li>
                <li>Strain is the dominant factor and data is noisy.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-xl border border-slate-800 h-[500px] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Williamson-Hall Plot</h3>
            {result && (
              <div className="text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg text-cyan-400">
                y = {result.regression.slope.toFixed(5)}x {result.regression.intercept >= 0 ? '+' : '-'} {Math.abs(result.regression.intercept).toFixed(5)}
              </div>
            )}
          </div>
          
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 relative z-10">
              <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold text-slate-400">Insufficient data for plot</p>
              <p className="text-xs mt-1">Enter at least 2 valid peaks to generate the regression.</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['auto', 'auto']}
                    label={{ value: '4 sin(θ)', position: 'bottom', offset: 20, fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    tickLine={{ stroke: '#334155' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    label={{ value: 'β cos(θ) [rad]', angle: -90, position: 'insideLeft', offset: -10, fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    tickLine={{ stroke: '#334155' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                  <Scatter name="Observed Data" dataKey="y" fill="#22d3ee" shape="circle" r={6} />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#f43f5e" 
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
