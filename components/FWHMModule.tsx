import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Activity, Zap, Box, Layers, Scan, CheckCircle } from 'lucide-react';
import { simulatePeak } from '../utils/physics';
import { FWHMResult } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Label
} from 'recharts';

export const FWHMModule: React.FC = () => {
  const [type, setType] = useState<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Pearson VII'>('Pseudo-Voigt');
  const [center, setCenter] = useState<number>(30);
  const [fwhmManual, setFwhmManual] = useState<number>(0.5);
  const [eta, setEta] = useState<number>(0.5);
  const [amplitude, setAmplitude] = useState<number>(100);
  const [background, setBackground] = useState<number>(10);
  const [noiseLevel, setNoiseLevel] = useState<number>(2);
  
  const [useCaglioti, setUseCaglioti] = useState<boolean>(false);
  const [cagliotiPreset, setCagliotiPreset] = useState<string>('Lab (Cu Kα)');
  const [cagliotiParams, setCagliotiParams] = useState<{u: number, v: number, w: number}>({ u: 0.04, v: -0.02, w: 0.04 });

  const CAGLIOTI_PRESETS: Record<string, { u: number, v: number, w: number }> = {
    'Lab (Cu Kα)': { u: 0.04, v: -0.02, w: 0.04 },
    'Synchrotron': { u: 0.002, v: -0.001, w: 0.002 },
    'Neutron': { u: 0.1, v: -0.05, w: 0.1 }
  };

  const fwhm = React.useMemo(() => {
    if (useCaglioti) {
      const thetaRad = (center / 2) * (Math.PI / 180);
      const tanTheta = Math.tan(thetaRad);
      const val = cagliotiParams.u * tanTheta * tanTheta + cagliotiParams.v * tanTheta + cagliotiParams.w;
      return val > 0 ? Math.sqrt(val) : 0.01;
    }
    return fwhmManual;
  }, [useCaglioti, cagliotiParams, center, fwhmManual]);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState<FWHMResult | null>(null);
  
  const resetToDefaults = () => {
    setType('Pseudo-Voigt');
    setCenter(30);
    setFwhmManual(0.5);
    setEta(0.5);
    setAmplitude(100);
    setBackground(10);
    setNoiseLevel(2);
    setUseCaglioti(false);
    setCagliotiPreset('Lab (Cu Kα)');
    setCagliotiParams({ u: 0.04, v: -0.02, w: 0.04 });
  };
  
  const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const range: [number, number] = [center - fwhm * 4, center + fwhm * 4];
    const { points, stats } = simulatePeak(type, center, fwhm, eta, amplitude, range, 200, background, noiseLevel);
    setChartData(points);
    setStats(stats);
  }, [type, center, fwhm, eta, amplitude, background, noiseLevel]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const analyzeProfile = () => {
    if (!stats) return null;
    const messages: { type: 'info' | 'warning' | 'error' | 'success', text: string }[] = [];
    let status: 'ok' | 'warning' | 'error' = 'ok';

    // Shape Factor Analysis
    if (type === 'Gaussian' && Math.abs(stats.shapeFactor - 0.939) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Gaussian (0.939).` });
       status = 'warning';
    } else if (type === 'Gaussian') {
       messages.push({ type: 'success', text: `Gaussian profile shape factor correlates exactly to theoretical ideal (0.939).` });
    }

    if (type === 'Lorentzian' && Math.abs(stats.shapeFactor - 0.637) > 0.01) {
       messages.push({ type: 'warning', text: `Shape factor ${stats.shapeFactor.toFixed(3)} deviates from ideal Lorentzian (0.637).` });
       status = 'warning';
    } else if (type === 'Lorentzian') {
       messages.push({ type: 'success', text: `Lorentzian profile shape factor correlates exactly to theoretical ideal (0.637).` });
    }

    // FWHM Analysis
    if (fwhm < 0.02) {
      messages.push({ type: 'warning', text: "Critical: FWHM < 0.02° is typically below instrumental resolution for standard lab diffractometers." });
      status = 'warning';
    } else if (fwhm > 3) {
      messages.push({ type: 'info', text: "Extremely broad peak (>3°). Strongly suggests amorphous phase contribution or crystallites < 2 nm." });
    }

    // Mixing Factor Analysis
    if (type === 'Pseudo-Voigt') {
        if (eta < 0.2) messages.push({ type: 'info', text: "Dominantly Gaussian character (Strain/Instrument dominated)." });
        else if (eta > 0.8) messages.push({ type: 'info', text: "Dominantly Lorentzian character (Size dominated)." });
        else messages.push({ type: 'success', text: `Hybrid shape factor: ${stats.shapeFactor.toFixed(3)} (η = ${eta.toFixed(2)})` });
    }
    
    if (type === 'Pearson VII') {
        const m = Math.max(1, eta * 10);
        if (m < 1.5) messages.push({ type: 'info', text: `m ≈ ${m.toFixed(1)}: Dominantly Lorentzian (Size dominated).` });
        else if (m > 5) messages.push({ type: 'info', text: `m ≈ ${m.toFixed(1)}: Approaching Gaussian (Strain/Inst. dominated).` });
        else messages.push({ type: 'success', text: `m ≈ ${m.toFixed(1)}: Intermediate Voigt-like characteristics.` });
    }

    // Mathematical approximations (Scherrer & Stokes-Wilson)
    const thetaRad = (center / 2) * (Math.PI / 180);
    const betaRad = stats.integralBreadth * (Math.PI / 180);
    
    let sizeBroadening = betaRad;
    let strainBroadening = betaRad;

    if (type === 'Pseudo-Voigt') {
        sizeBroadening = betaRad * eta; // Lorentzian part -> size
        strainBroadening = betaRad * (1 - eta); // Gaussian part -> strain
    } else if (type === 'Gaussian') {
        sizeBroadening = 0; // Pure strain
    } else if (type === 'Lorentzian') {
        strainBroadening = 0; // Pure size
    }

    if (sizeBroadening > 0.0001) {
       const L = (0.89 * 0.15406) / (sizeBroadening * Math.cos(thetaRad));
       if (L > 200) {
           messages.push({ type: 'info', text: `Scherrer Coherence Length: ~${L.toFixed(0)} nm (Warning: limits).` });
       } else if (L < 2) {
           messages.push({ type: 'info', text: `Scherrer Coherence Length: ~${L.toFixed(1)} nm (Highly localized).` });
       } else {
           messages.push({ type: 'success', text: `Scherrer Coherence Length (Volume-Weighted): ~${L.toFixed(1)} nm.` });
       }
    }

    if (strainBroadening > 0.0001) {
       const e = strainBroadening / (4 * Math.tan(thetaRad));
       messages.push({ type: 'success', text: `Approximate Microstrain (ε): ${(e * 100).toFixed(3)}% root-mean-square.` });
    }

    return { status, messages };
  };

  const analysis = analyzeProfile();

  useEffect(() => {
    localStorage.setItem('xrd_fwhm_current', JSON.stringify({
      type,
      center,
      fwhm,
      eta,
      amplitude,
      stats,
      analysis
    }));
  }, [type, center, fwhm, eta, amplitude, stats, analysis]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Line Profile Simulator
            </h2>
            <button 
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 group"
              title="Reset all parameters to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 group-hover:rotate-[-45deg] transition-transform" />
              Reset
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center justify-between">
                <span>Profile Kernel</span>
                <span className="text-[9px] bg-indigo-50 leading-[0] text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  {type === 'Pseudo-Voigt' || type === 'Pearson VII' ? 'Hybrid Mode' : 'Single Kernel'}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['Gaussian', 'Lorentzian', 'Pseudo-Voigt', 'Pearson VII'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      if (t === 'Gaussian') setEta(0);
                      else if (t === 'Lorentzian') setEta(1);
                      else if (t === 'Pearson VII') setEta(0.2); // Default m=2 (scaled via eta)
                      else setEta(0.5);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
                      type === t 
                        ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/50 shadow-md ring-1 ring-indigo-400/20' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50/10 dark:hover:bg-indigo-500/5 hover:shadow-sm'
                    }`}
                  >
                    {type === t && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />}
                    <span className={`text-[11px] font-black uppercase tracking-wider mb-1 transition-colors text-center ${type === t ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>
                      {t === 'Pseudo-Voigt' ? 'P-Voigt' : t === 'Pearson VII' ? 'Pearson VII' : t}
                    </span>
                    <span className={`text-[9px] font-mono tracking-tight text-center ${type === t ? 'text-indigo-500/80 dark:text-indigo-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                      {t === 'Gaussian' ? 'η = 0' : t === 'Lorentzian' ? 'η = 1' : t === 'Pearson VII' ? 'm > 1' : '0 < η < 1'}
                    </span>
                    
                    {/* Tiny visual representation */}
                    <div className="mt-2 h-4 w-12 flex items-end justify-center gap-[2px] opacity-60">
                       {t === 'Gaussian' && [2, 4, 8, 12, 16, 12, 8, 4, 2].map((h, i) => <div key={i} className={`w-[3px] bg-${type === t ? 'indigo' : 'slate'}-400 rounded-t-sm group-hover:bg-${type === t ? 'indigo' : 'slate'}-500 transition-colors`} style={{ height: `${h}px` }} />)}
                       {t === 'Lorentzian' && [3, 4, 5, 8, 16, 8, 5, 4, 3].map((h, i) => <div key={i} className={`w-[3px] bg-${type === t ? 'indigo' : 'slate'}-400 rounded-t-sm group-hover:bg-${type === t ? 'indigo' : 'slate'}-500 transition-colors`} style={{ height: `${h}px` }} />)}
                       {t === 'Pseudo-Voigt' && [2.5, 4, 6.5, 10, 16, 10, 6.5, 4, 2.5].map((h, i) => <div key={i} className={`w-[3px] bg-${type === t ? 'indigo' : 'slate'}-400 rounded-t-sm group-hover:bg-${type === t ? 'indigo' : 'slate'}-500 transition-colors`} style={{ height: `${h}px` }} />)}
                       {t === 'Pearson VII' && [2.2, 4, 7, 11, 16, 11, 7, 4, 2.2].map((h, i) => <div key={i} className={`w-[3px] bg-${type === t ? 'indigo' : 'slate'}-400 rounded-t-sm group-hover:bg-${type === t ? 'indigo' : 'slate'}-500 transition-colors`} style={{ height: `${h}px` }} />)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border-slate-200 dark:bg-slate-950/40 p-5 rounded-2xl border dark:border-slate-800/60 space-y-6 shadow-inner ring-1 ring-white/50 dark:ring-transparent">
              <div className="group">
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">Peak Center (2θ)</label>
                  <div className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold relative z-10">{center.toFixed(2)}°</span>
                    <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10" />
                  </div>
                </div>
                <input
                  type="range" min="10" max="150" step="0.1"
                  value={center} onChange={(e) => setCenter(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                    FWHM {useCaglioti ? '(Caglioti Calculated)' : '(Δ2θ)'}
                  </label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setUseCaglioti(!useCaglioti)}
                      className={`text-[9px] px-2 py-1 rounded border font-bold uppercase tracking-wider transition-colors ${useCaglioti ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      Instrumental
                    </button>
                    <div className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden flex items-center">
                      <span className={`text-xs font-mono font-bold relative z-10 ${useCaglioti ? 'text-slate-500 dark:text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{fwhm.toFixed(3)}°</span>
                      <div className={`absolute inset-0 ${useCaglioti ? 'bg-slate-100 dark:bg-slate-800' : 'bg-indigo-500/5 dark:bg-indigo-500/10'}`} />
                    </div>
                  </div>
                </div>

                {!useCaglioti ? (
                  <input
                    type="range" min="0.01" max="5" step="0.01"
                    value={fwhmManual} onChange={(e) => setFwhmManual(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                ) : (
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-500/20 mt-2 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Diffractometer</span>
                       <select 
                         value={cagliotiPreset}
                         onChange={(e) => {
                           const val = e.target.value;
                           setCagliotiPreset(val);
                           if (CAGLIOTI_PRESETS[val]) {
                             setCagliotiParams(CAGLIOTI_PRESETS[val]);
                           }
                         }}
                         className="text-[10px] bg-white border border-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-400 text-slate-700"
                       >
                         {Object.keys(CAGLIOTI_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                         <option value="Custom">Custom</option>
                       </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                       {['u', 'v', 'w'].map(param => (
                         <div key={param} className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-400 uppercase">{param}</span>
                           <input 
                             type="number"
                             step="0.001"
                             value={cagliotiParams[param as keyof typeof cagliotiParams] === 0 ? "0" : cagliotiParams[param as keyof typeof cagliotiParams]}
                             onChange={(e) => {
                               setCagliotiPreset('Custom');
                               setCagliotiParams({...cagliotiParams, [param]: parseFloat(e.target.value) || 0});
                             }}
                             className="w-full bg-white border border-slate-200 rounded text-[10px] p-1 font-mono text-slate-700 focus:outline-none focus:border-indigo-400"
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={`group transition-all duration-300 ${type === 'Gaussian' || type === 'Lorentzian' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100 grayscale-0'}`}>
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">
                    {type === 'Pearson VII' ? 'Shape Parameter (m)' : 'Mixing Factor (η)'}
                  </label>
                  <div className="bg-white px-2 py-1 xl:px-2.5 rounded-md shadow-sm border border-slate-200 flex items-center gap-1.5 xl:gap-2 relative overflow-hidden">
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold relative z-10">
                      {type === 'Pearson VII' ? Math.max(1, eta * 10).toFixed(1) : `${(eta * 100).toFixed(0)}%`}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase relative z-10">
                      {type === 'Pearson VII' ? '' : 'Lorentzian'}
                    </span>
                    <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10" />
                  </div>
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={eta} 
                  onChange={(e) => setEta(parseFloat(e.target.value))}
                  disabled={type === 'Gaussian' || type === 'Lorentzian'}
                  className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all focus:outline-none ${
                    type === 'Gaussian' || type === 'Lorentzian' ? 'bg-slate-200 dark:bg-slate-800 accent-slate-400 cursor-not-allowed' : 'bg-slate-200 dark:bg-slate-800 accent-indigo-500 hover:accent-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-3 font-black uppercase tracking-widest">
                  {type === 'Pearson VII' ? (
                    <>
                      <span className={`transition-colors ${eta < 0.5 ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>m=1 (Lorentzian)</span>
                      <span className={`transition-colors ${eta > 0.5 ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>m=10 (Gaussian)</span>
                    </>
                  ) : (
                    <>
                      <span className={`transition-colors ${type === 'Pseudo-Voigt' && eta < 0.5 ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>Gaussian (0)</span>
                      <span className={`transition-colors ${type === 'Pseudo-Voigt' &&  eta > 0.5 ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>Lorentzian (1)</span>
                    </>
                  )}
                </div>
              </div>
              <div className="group pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">
                    Background Level
                  </label>
                  <div className="bg-white px-2 py-1 xl:px-2.5 rounded-md shadow-sm border border-slate-200 flex items-center relative overflow-hidden">
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold relative z-10">
                      {background.toFixed(1)}
                    </span>
                  </div>
                </div>
                <input
                  type="range" min="0" max="100" step="1"
                  value={background} 
                  onChange={(e) => setBackground(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-end mb-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-800 transition-colors">
                    Poisson Noise
                  </label>
                  <div className="bg-white px-2 py-1 xl:px-2.5 rounded-md shadow-sm border border-slate-200 flex items-center relative overflow-hidden">
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold relative z-10">
                      {(noiseLevel * 10).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <input
                  type="range" min="0" max="10" step="0.5"
                  value={noiseLevel} 
                  onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 mt-4">
               <div className="flex justify-between items-center mb-3">
                 <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Diagnostic Telemetry</h3>
                 <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   DATA STREAM ACTIVE
                 </span>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl shadow-inner border border-slate-800/80 overflow-x-auto relative group max-h-[220px] overflow-y-auto custom-scrollbar">
                 <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                   <Activity className="w-3.5 h-3.5 text-slate-600" />
                 </div>
                 <pre className="text-[10px] font-mono leading-relaxed text-slate-300" 
                      dangerouslySetInnerHTML={{ __html: JSON.stringify({
                        module: "FWHM-Basics",
                        profile_type: type,
                        caglioti_active: useCaglioti,
                        ...(useCaglioti ? { caglioti_params: cagliotiParams, diffractometer: cagliotiPreset } : {}),
                        results: stats
                      }, null, 2).replace(/"([^"]+)":/g, '<span class="text-indigo-400">"$1"</span>:') 
                 }} />
               </div>
            </div>

            {/* Profile Analysis Section */}
            {analysis && (
              <div className={`p-4 rounded-lg border ${
                analysis.status === 'ok' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50' : 
                analysis.status === 'warning' ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50' : 
                'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {analysis.status === 'ok' ? (
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className={`w-5 h-5 ${analysis.status === 'warning' ? 'text-amber-600 dark:text-amber-500' : 'text-red-600 dark:text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <h3 className={`text-sm font-bold ${
                    analysis.status === 'ok' ? 'text-emerald-800 dark:text-emerald-300' : 
                    analysis.status === 'warning' ? 'text-amber-800 dark:text-amber-300' : 
                    'text-red-800 dark:text-red-300'
                  }`}>
                    Profile Analysis
                  </h3>
                </div>
                
                {analysis.messages.length > 0 ? (
                  <ul className="space-y-1.5 mt-2">
                    {analysis.messages.map((msg, idx) => (
                      <li key={`${msg.text}-${idx}`} className={`text-[11px] leading-tight flex items-start gap-1.5 ${
                        msg.type === 'warning' ? 'text-amber-700 dark:text-amber-400 font-medium' : 
                        msg.type === 'success' ? 'text-emerald-700 dark:text-emerald-400 font-bold' :
                        'text-slate-600 dark:text-slate-400'
                      }`}>
                        <span className="mt-0.5">
                           {msg.type === 'success' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : 
                            msg.type === 'warning' ? <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> : 
                            <span className="text-slate-400 dark:text-slate-500">•</span>}
                        </span>
                        <span>{msg.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">Parameters appear physically consistent for standard XRD analysis.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualizer and Stats */}
      <div className="lg:col-span-8 space-y-6">
        <div 
          className="bg-white dark:bg-slate-950 p-1 lg:p-1.5 rounded-[2rem] border border-slate-200 dark:border-slate-800/80 min-h-[600px] lg:min-h-[800px] h-[70vh] lg:h-[85vh] flex flex-col relative overflow-hidden cursor-none group/visualizer shadow-[0_0_40px_rgba(99,102,241,0.1)]"
          ref={chartContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePos(null)}
        >
           {/* Inner container with glossy background */}
           <div className="bg-slate-50 dark:bg-slate-900/50 w-full h-full rounded-[1.75rem] border border-white/50 dark:border-white/5 relative overflow-hidden flex flex-col p-5 lg:p-6 group/inner">
             
             {/* Background Grid Pattern */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
             <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
             
             {/* Dynamic lighting effects */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-indigo-500/15 dark:bg-indigo-500/20 blur-[100px] pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none z-0" />

             {/* Animated Scanline overlay */}
             <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] pointer-events-none z-20">
               <div className="w-full h-40 bg-gradient-to-b from-transparent via-indigo-500/10 dark:via-indigo-400/10 to-transparent -translate-y-full group-hover/inner:translate-y-[800px] transition-transform duration-[3000ms] ease-linear" />
             </div>

             {/* Header Layer */}
             <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
               <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                   <Activity className="w-4 h-4 text-indigo-500" />
                 </div>
                 High-Resolution Peak Visualizer
               </h3>

               {/* Floating Stats Pill */}
               <div className="flex items-center gap-4 px-4 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(99,102,241,0.1)] border border-slate-200/50 dark:border-slate-700/50">
                 <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                   <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">Live Scan</span>
                 </div>
                 <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Res:</span>
                   <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{chartData.length}</span>
                 </div>
               </div>
             </div>

             <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
               <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart 
                   data={chartData} 
                   margin={{ top: 20, right: 60, left: 20, bottom: 45 }}
                 >
                   <defs>
                     <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                       <stop offset="50%" stopColor="#6366f1" stopOpacity={0.2}/>
                       <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorYHover" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#d946ef" stopOpacity={0.7}/>
                       <stop offset="50%" stopColor="#a855f7" stopOpacity={0.3}/>
                       <stop offset="100%" stopColor="#a855f7" stopOpacity={0}/>
                     </linearGradient>
                     <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                       <rect width="2" height="6" transform="translate(0,0)" fill="#64748b" opacity="0.15"></rect>
                     </pattern>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                   
                   <XAxis 
                     dataKey="x" 
                     type="number" 
                     domain={['auto', 'auto']} 
                     tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}}
                     label={{ value: 'Diffraction Angle 2θ (°)', position: 'bottom', offset: 25, fill: '#475569', fontSize: 11, fontWeight: 800, textAnchor: 'middle', letterSpacing: '0.05em' }}
                     tickFormatter={(val) => val.toFixed(1)}
                     axisLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                     tickLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                   />
                   <YAxis hide domain={[0, amplitude * 1.35]} />
                   
                   <Tooltip 
                     content={({ active, payload, label }) => {
                       if (active && payload && payload.length) {
                         const dataPoint = payload[0].payload;
                         const thetaRad = (dataPoint.x / 2) * Math.PI / 180;
                         const localSize = 0.15406 * 0.9 / ((fwhm * Math.PI / 180) * Math.cos(thetaRad));
                         
                         return (
                           <div className="bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl shadow-indigo-500/40 text-xs border border-indigo-500/20 min-w-[220px] transform scale-105 transition-transform duration-75 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500" />
                             <div className="absolute -top-10 -right-10 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-xl pointer-events-none" />
                             <div className="flex items-center gap-2 font-black mb-3 border-b border-slate-700/50 pb-2 uppercase tracking-widest text-[10px] relative z-10">
                               <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
                               <span>2θ Scan: {dataPoint.x.toFixed(4)}°</span>
                             </div>
                             <div className="space-y-3 relative z-10">
                               <div className="flex justify-between gap-4 items-center">
                                 <span className="text-slate-400 font-medium tracking-wide flex items-center gap-1.5"><Activity className="w-3 h-3"/> Measured I(2θ)</span>
                                 <span className="font-mono font-bold text-white drop-shadow-[0_0_8px_rgba(232,121,249,0.8)] px-1">{dataPoint.y.toFixed(1)}</span>
                               </div>
                               <div className="flex justify-between gap-4 items-center">
                                 <span className="text-slate-400 font-medium tracking-wide flex items-center gap-1.5"><Activity className="w-3 h-3 text-slate-500"/> True I(2θ)</span>
                                 <span className="font-mono font-bold text-slate-300 px-1">{dataPoint._cleanY?.toFixed(1) || '-'}</span>
                               </div>
                               <div className="flex justify-between gap-4 items-center">
                                 <span className="text-slate-400 font-medium tracking-wide flex items-center gap-1.5"><Scan className="w-3 h-3"/> Scale FWHM</span>
                                 <span className="font-mono text-cyan-300 font-bold drop-shadow-[0_0_5px_rgba(103,232,249,0.5)] px-1">{fwhm.toFixed(4)}°</span>
                               </div>
                               <div className="flex justify-between gap-4 items-center">
                                 <span className="text-slate-400 font-medium tracking-wide flex items-center gap-1.5"><Layers className="w-3 h-3"/> Shape Factor</span>
                                 <span className="font-mono text-violet-300 font-bold px-1">{stats?.shapeFactor.toFixed(3) || '-'}</span>
                               </div>
                               {type === 'Pseudo-Voigt' && (
                                 <div className="flex justify-between gap-4 items-center">
                                   <span className="text-slate-400 font-medium tracking-wide text-[9px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-300">Lorentzian η</span>
                                   <span className="font-mono text-orange-300 font-bold text-[10px] px-1">{(eta * 100).toFixed(1)}%</span>
                                 </div>
                               )}
                               {type === 'Pearson VII' && (
                                 <div className="flex justify-between gap-4 items-center">
                                   <span className="text-slate-400 font-medium tracking-wide text-[9px] bg-fuchsia-500/10 px-1.5 py-0.5 rounded text-fuchsia-300">Pearson m</span>
                                   <span className="font-mono text-fuchsia-300 font-bold text-[10px] px-1">{(Math.max(1, eta * 10)).toFixed(2)}</span>
                                 </div>
                               )}
                               <div className="flex justify-between gap-4 items-center border-t border-slate-700/50 pt-2.5 mt-1 relative">
                                 {/* Glowing indicator line */}
                                 <div className="absolute top-0 left-0 w-8 h-px bg-emerald-500/50" />
                                 <span className="text-slate-400 font-medium tracking-wide text-[10px]">Domain Size (τ)</span>
                                 <span className="font-mono text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] px-1">{localSize.toFixed(1)} nm</span>
                               </div>
                             </div>
                           </div>
                         );
                       }
                       return null;
                     }}
                     cursor={false}
                   />
                   
                   {/* Background Area */}
                   {chartData.length > 0 && (
                     <ReferenceArea 
                       x1={chartData[0].x} 
                       x2={chartData[chartData.length - 1].x} 
                       y1={0} 
                       y2={amplitude * 0.05} 
                       fill="url(#hatch)" 
                       stroke="none"
                     >
                        <Label value="Background Noise Level" position="insideBottomRight" offset={15} fill="#64748b" fontSize={9} fontWeight="900" letterSpacing="0.1em" />
                     </ReferenceArea>
                   )}

                   {/* Integral Breadth Rectangle */}
                   {stats && (
                     <ReferenceArea 
                       x1={center - stats.integralBreadth / 2} 
                       x2={center + stats.integralBreadth / 2} 
                       y1={0} 
                       y2={amplitude} 
                       fill="rgba(56, 189, 248, 0.05)"
                       stroke="#0ea5e9"
                       strokeDasharray="4 4"
                       strokeWidth={1.5}
                     >
                       <Label value="Integral Breadth (β)" position="insideBottom" offset={20} fill="#0ea5e9" fontSize={10} fontWeight="900" letterSpacing="0.05em" />
                     </ReferenceArea>
                   )}

                   {/* Peak Position Line */}
                   <ReferenceLine x={center} stroke="#8b5cf6" strokeDasharray="3 3" opacity={0.8} strokeWidth={2}>
                      <Label value="Centroid" position="top" fill="#8b5cf6" fontSize={11} fontWeight="black" offset={15} letterSpacing="0.05em" className="drop-shadow-sm" />
                   </ReferenceLine>
                   <ReferenceDot x={center} y={amplitude} r={5} fill="#8b5cf6" stroke="#fff" strokeWidth={2} className="drop-shadow-md" />

                   {/* Imax Line */}
                   <ReferenceLine y={amplitude} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="2 4">
                      <Label value="I(max)" position="insideLeft" fill="#64748b" fontSize={10} fontWeight="black" offset={15} />
                   </ReferenceLine>

                   {/* Half Max Line */}
                   <ReferenceLine y={amplitude / 2} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2 4">
                      <Label value="I(max)/2" position="insideLeft" fill="#64748b" fontSize={10} fontWeight="black" offset={15} />
                   </ReferenceLine>

                   {/* FWHM Arrow Segment */}
                   <ReferenceLine 
                     segment={[
                       { x: center - fwhm / 2, y: amplitude / 2 }, 
                       { x: center + fwhm / 2, y: amplitude / 2 }
                     ]} 
                     stroke="#0ea5e9" 
                     strokeWidth={3}
                     className="drop-shadow-sm"
                   >
                     <Label value={`FWHM: ${fwhm.toFixed(4)}°`} position="top" fill="#0ea5e9" fontSize={12} fontWeight="900" offset={8} />
                   </ReferenceLine>
                   <ReferenceDot x={center - fwhm / 2} y={amplitude / 2} r={6} fill="#0ea5e9" stroke="white" strokeWidth={2.5} className="drop-shadow-sm" />
                   <ReferenceDot x={center + fwhm / 2} y={amplitude / 2} r={6} fill="#0ea5e9" stroke="white" strokeWidth={2.5} className="drop-shadow-sm" />

                   {/* Main Peak Area */}
                   <Area 
                      type="monotone" 
                      dataKey="y" 
                      stroke="#818cf8" 
                      strokeWidth={2}
                      strokeOpacity={0.6}
                      fillOpacity={0} 
                      fill="none" 
                      isAnimationActive={false}
                      activeDot={false}
                   />
                   <Area 
                      type="monotone" 
                      dataKey="_cleanY" 
                      stroke={mousePos ? "#d946ef" : "#8b5cf6"} 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill={mousePos ? "url(#colorYHover)" : "url(#colorY)"} 
                      isAnimationActive={false}
                      activeDot={{r: 6, fill: '#f0abfc', stroke: '#c026d3', strokeWidth: 2}}
                      className="transition-all duration-300"
                   />
                 </ComposedChart>
               </ResponsiveContainer>
               
               {/* Custom Annotations Overlay */}
               <div className="absolute top-24 lg:top-28 right-8 lg:right-12 flex flex-col items-end gap-3 pointer-events-none transition-opacity z-20 hidden md:flex">
                  <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-indigo-500/5 text-slate-800 dark:text-white font-mono tracking-tight max-w-[260px] lg:max-w-[320px]">
                    <div className="text-[12px] lg:text-[14px] flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-center leading-relaxed">
                      {type === 'Gaussian' && <span>I(2θ) = Iₘₐₓ · exp[-ln(2)·((2θ-2θ₀)/w)²]</span>}
                      {type === 'Lorentzian' && <span>I(2θ) = Iₘₐₓ / [1 + ((2θ-2θ₀)/w)²]</span>}
                      {type === 'Pseudo-Voigt' && <span>I(2θ) = Iₘₐₓ · <br/>[η·L(2θ) + (1-η)·G(2θ)]</span>}
                      {type === 'Pearson VII' && <span>I(2θ) = Iₘₐₓ / <br/>[1 + (2^(1/m)-1)·((2θ-2θ₀)/w)²]^m</span>}
                    </div>
                    <div className="text-[8px] lg:text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2 text-center font-sans font-black flex items-center justify-center gap-1.5 opacity-80 border-t border-slate-300/50 dark:border-slate-600/50 pt-2">
                      <Zap className="w-3 h-3 text-fuchsia-500" /> Current Convolution Kernel
                    </div>
                  </div>

                  <div className="text-[9px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-2 pointer-events-none tracking-[0.2em] uppercase bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                    <span>Integrated Area ∫I(θ)dθ</span>
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
               </div>

             </div>
           </div>
           
           {/* Advanced Crosshair Cursor Overlay */}
           {mousePos && (
             <svg 
               className="absolute inset-0 pointer-events-none z-50 mix-blend-difference opacity-90 transition-opacity duration-150" 
               width="100%" 
               height="100%"
             >
               {/* Horizontal Line */}
               <line 
                 x1="0" 
                 y1={mousePos.y} 
                 x2="100%" 
                 y2={mousePos.y} 
                 stroke="#f472b6" 
                 strokeWidth="1" 
                 strokeDasharray="4 4"
               />
               {/* Vertical Line */}
               <line 
                 x1={mousePos.x} 
                 y1="0" 
                 x2={mousePos.x} 
                 y2="100%" 
                 stroke="#f472b6" 
                 strokeWidth="1" 
                 strokeDasharray="4 4"
               />
               {/* Target Ring */}
               <circle 
                 cx={mousePos.x} 
                 cy={mousePos.y} 
                 r="10" 
                 fill="none" 
                 stroke="#f472b6"
                 strokeWidth="1.5"
                 opacity="0.8"
               />
               <circle 
                 cx={mousePos.x} 
                 cy={mousePos.y} 
                 r="2.5" 
                 fill="#f472b6" 
               />
               {/* Precision Reticle Marks */}
               <line x1={mousePos.x - 18} y1={mousePos.y} x2={mousePos.x - 6} y2={mousePos.y} stroke="#f472b6" strokeWidth="1.5" />
               <line x1={mousePos.x + 6} y1={mousePos.y} x2={mousePos.x + 18} y2={mousePos.y} stroke="#f472b6" strokeWidth="1.5" />
               <line x1={mousePos.x} y1={mousePos.y - 18} x2={mousePos.x} y2={mousePos.y - 6} stroke="#f472b6" strokeWidth="1.5" />
               <line x1={mousePos.x} y1={mousePos.y + 6} x2={mousePos.x} y2={mousePos.y + 18} stroke="#f472b6" strokeWidth="1.5" />
             </svg>
           )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative z-10">
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500" /> Peak Area</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">{stats?.area.toFixed(2)}</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">Calculated total area under the peak.</p>
              </div>
           </div>
           <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
              <div className="relative z-10">
                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Box className="w-3 h-3" /> Integral Breadth (β)</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">{stats?.integralBreadth.toFixed(4)}°</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">Line width of a rectangle with equivalent integrated area & maximum height.</p>
              </div>
           </div>
           <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-500/10 rounded-full blur-xl group-hover:bg-slate-500/20 transition-colors" />
              <div className="relative z-10">
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Layers className="w-3 h-3" /> Shape Factor (φ)</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">{stats?.shapeFactor.toFixed(3)}</span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">FWHM / β ratio. Pure Gaussian ≈ 0.94, Pure Lorentzian ≈ 0.64.</p>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-fuchsia-500/10 rounded-full blur-xl group-hover:bg-fuchsia-500/20 transition-colors" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3 text-fuchsia-500" /> Lorentzian %</span>
                  <div className="flex items-end gap-3 mb-2">
                     <span className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
                       {type === 'Pseudo-Voigt' ? (eta * 100).toFixed(0) : type === 'Lorentzian' ? '100' : '0'}%
                     </span>
                  </div>
                </div>
                <div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-200 dark:border-slate-700">
                     <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${type === 'Pseudo-Voigt' ? eta * 100 : type === 'Lorentzian' ? 100 : 0}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Finite size & defects limit.</p>
                </div>
              </div>
           </div>
           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5"><Scan className="w-3 h-3 text-cyan-500" /> Gaussian %</span>
                  <div className="flex items-end gap-3 mb-2">
                     <span className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tighter">
                       {type === 'Pseudo-Voigt' ? ((1 - eta) * 100).toFixed(0) : type === 'Gaussian' ? '100' : '0'}%
                     </span>
                  </div>
                </div>
                <div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2 border border-slate-200 dark:border-slate-700">
                     <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${type === 'Pseudo-Voigt' ? (1 - eta) * 100 : type === 'Gaussian' ? 100 : 0}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Instrumental & strain.</p>
                </div>
              </div>
           </div>
        </div>

        <div className="mb-6">
          <ScientificMathControl
            title="Pseudo-Voigt Peak Shape Math Verification"
            formula="I(\theta) = \eta \cdot L(\theta) + (1-\eta) \cdot G(\theta)"
            description="Peak Profile convolution check. Validates the analytical area integral calculated by varying Lorentzian and Gaussian domains."
            variables={[
              { symbol: 'η', name: 'Lorentzian Fraction', value: eta, unit: '' },
              { symbol: 'FWHM', name: 'Full Width', value: fwhm, unit: 'deg' }
            ]}
            result={stats?.shapeFactor || 0}
            resultUnit=""
            resultName="Calculated Shape Factor (φ)"
          />
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

        {/* Mathematical Models & Applications */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
          <div className="p-4 border-b border-slate-300 bg-slate-100">
            <h3 className="font-bold text-slate-800">Mathematical Models & Applications</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Gaussian */}
            <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">Gaussian</span>
                <h4 className="font-bold text-slate-800">Normal Distribution</h4>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                I(2θ) = Imax · exp(-ln(2) · ((2θ - 2θ₀) / HWHM)²)
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Why use it?</strong> Best for modeling <span className="italic">instrumental broadening</span> and <span className="italic">microstrain</span> effects. The tails decay very rapidly (exponentially), making it suitable for sharp, well-resolved peaks with minimal background interaction.
              </p>
            </div>

            {/* Lorentzian */}
            <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded uppercase">Lorentzian</span>
                <h4 className="font-bold text-slate-800">Cauchy Distribution</h4>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                I(2θ) = Imax · (1 / (1 + ((2θ - 2θ₀) / HWHM)²))
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Why use it?</strong> Describes <span className="italic">crystallite size broadening</span> (Scherrer equation) and <span className="italic">spectral line shapes</span>. It has much heavier tails (polynomial decay) than Gaussian, meaning significant intensity persists far from the peak center.
              </p>
            </div>

            {/* Pseudo-Voigt */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded uppercase">Pseudo-Voigt</span>
                <h4 className="font-bold text-slate-800">Linear Combination</h4>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-xs text-slate-600 mb-3 overflow-x-auto">
                I(2θ) = η · L(2θ) + (1 - η) · G(2θ)
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-slate-800">Why use it?</strong> The standard for <span className="italic">Rietveld refinement</span> and general XRD analysis. Real diffraction peaks are a convolution of instrumental (Gaussian) and sample (Lorentzian) effects. The mixing factor <strong>η</strong> allows you to model this hybrid behavior precisely.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
