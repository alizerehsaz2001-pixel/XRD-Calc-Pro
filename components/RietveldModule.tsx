import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Area, Scatter 
} from 'recharts';
import { 
  Activity, Settings, RefreshCw, BarChart2, Download, PlayCircle, RotateCcw, 
  Beaker, Calculator, ChevronRight, BookOpen, Layers, Info, Ruler, Maximize, 
  Binary, Zap, Gauge, LineChart as ChartIcon
} from 'lucide-react';
import { RietveldPhaseInput, RietveldSetupResult, CrystalSystem } from '../types';
import { generateRietveldSetup, calculateBragg, simulatePeak } from '../utils/physics';

// --- Simulation Constants & Types ---

const SIMULATION_RANGE = { start: 10, end: 90, step: 0.1 };

interface SimulationParams {
  a: number;
  scale: number;
  fwhm: number;
  background: number;
  noise: number;
}

const TARGET_PARAMS: Record<string, SimulationParams> = {
  'Simple Cubic': { a: 4.0, scale: 1000, fwhm: 0.5, background: 50, noise: 20 },
  'BCC': { a: 3.5, scale: 1200, fwhm: 0.4, background: 40, noise: 15 },
  'FCC': { a: 4.5, scale: 1500, fwhm: 0.6, background: 60, noise: 25 },
  'Quartz': { a: 4.913, scale: 800, fwhm: 0.3, background: 80, noise: 30 }, // 'a' here is just a placeholder or scaling factor
};

const QUARTZ_PEAKS = [
  { t: 20.86, i: 22 }, { t: 26.64, i: 100 }, { t: 36.54, i: 6 }, 
  { t: 39.46, i: 4 }, { t: 40.29, i: 3 }, { t: 42.45, i: 6 }, 
  { t: 45.79, i: 3 }, { t: 50.14, i: 14 }, { t: 54.87, i: 3 }, 
  { t: 59.96, i: 5 }, { t: 67.74, i: 4 }, { t: 68.14, i: 3 }
];

export const RietveldModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'setup'>('simulation');

  // --- Simulation State ---
  const [simPhase, setSimPhase] = useState<string>('Simple Cubic');
  const [userParams, setUserParams] = useState<SimulationParams>(TARGET_PARAMS['Simple Cubic']);
  const [targetParams, setTargetParams] = useState<SimulationParams>(TARGET_PARAMS['Simple Cubic']);
  const [isAutoRefining, setIsAutoRefining] = useState(false);
  const [rFactor, setRFactor] = useState<number>(0);

  // --- Setup Generator State ---
  const [phases, setPhases] = useState<RietveldPhaseInput[]>([
    { name: 'Phase 1', crystalSystem: 'Cubic', a: 5.43 }
  ]);
  const [maxObsIntensity, setMaxObsIntensity] = useState<number>(5000);
  const [bgModel, setBgModel] = useState<'Chebyshev_6_term' | 'Linear_Interpolation'>('Chebyshev_6_term');
  const [profileShape, setProfileShape] = useState<'Thompson-Cox-Hastings' | 'Pseudo-Voigt'>('Thompson-Cox-Hastings');
  const [result, setResult] = useState<RietveldSetupResult | null>(null);

  // --- Simulation Logic ---

  useEffect(() => {
    // Reset user params when phase changes
    setTargetParams(TARGET_PARAMS[simPhase]);
    // Start user params slightly off
    setUserParams({
      ...TARGET_PARAMS[simPhase],
      a: TARGET_PARAMS[simPhase].a * 1.05,
      scale: TARGET_PARAMS[simPhase].scale * 0.8,
      fwhm: TARGET_PARAMS[simPhase].fwhm * 1.5,
      background: TARGET_PARAMS[simPhase].background * 1.2
    });
  }, [simPhase]);

  const generatePatternData = useMemo(() => {
    const data: any[] = [];
    const steps = Math.floor((SIMULATION_RANGE.end - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
    
    // Initialize data array
    for (let i = 0; i <= steps; i++) {
      data.push({
        twoTheta: SIMULATION_RANGE.start + i * SIMULATION_RANGE.step,
        obs: 0,
        calc: 0,
        diff: 0,
        bkg: 0
      });
    }

    const calculateIntensity = (params: SimulationParams, isObserved: boolean) => {
      const intensities = new Array(data.length).fill(0);
      
      // Background
      for (let i = 0; i < data.length; i++) {
        intensities[i] += params.background + (isObserved ? (Math.random() - 0.5) * params.noise : 0);
      }

      // Peaks
      if (simPhase === 'Quartz') {
        // Use fixed peaks for Quartz
        QUARTZ_PEAKS.forEach(peak => {
          // Simple shift simulation for 'a' parameter (not physically accurate but educational)
          // Delta 2theta approx -2 * tan(theta) * delta_a / a
          // Let's just say 'a' slider shifts the pattern
          const shift = (params.a - TARGET_PARAMS['Quartz'].a) * 2; 
          const pos = peak.t - shift;
          
          const profile = simulatePeak(
            'Pseudo-Voigt', pos, params.fwhm, 0.5, 
            peak.i * (params.scale / 100), 
            [pos - 5, pos + 5], 100
          );
          
          profile.points.forEach(p => {
            const idx = Math.round((p.x - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
            if (idx >= 0 && idx < data.length) {
              intensities[idx] += p.y;
            }
          });
        });
      } else {
        // Cubic Systems
        const wavelength = 1.5406;
        const maxHKL = 5;
        
        for (let h = 0; h <= maxHKL; h++) {
          for (let k = 0; k <= maxHKL; k++) {
            for (let l = 0; l <= maxHKL; l++) {
              if (h === 0 && k === 0 && l === 0) continue;
              
              // Selection Rules
              let allowed = false;
              if (simPhase === 'Simple Cubic') allowed = true;
              else if (simPhase === 'BCC') allowed = (h + k + l) % 2 === 0;
              else if (simPhase === 'FCC') {
                const isEven = (h % 2 === 0) && (k % 2 === 0) && (l % 2 === 0);
                const isOdd = (h % 2 !== 0) && (k % 2 !== 0) && (l % 2 !== 0);
                allowed = isEven || isOdd;
              }

              if (!allowed) continue;

              const d = params.a / Math.sqrt(h*h + k*k + l*l);
              const sinTheta = wavelength / (2 * d);
              if (sinTheta >= 1) continue;
              
              const theta = Math.asin(sinTheta);
              const twoTheta = 2 * theta * (180 / Math.PI);

              if (twoTheta >= SIMULATION_RANGE.start && twoTheta <= SIMULATION_RANGE.end) {
                // Approximate intensity (multiplicity * LP factor * structure factor)
                // Simplified for education
                let intensity = 1000; // Base
                
                // LP Factor approx
                const lp = (1 + Math.cos(2*theta)**2) / (Math.sin(theta)**2 * Math.cos(theta));
                intensity *= lp;

                // Multiplicity (simplified)
                let mult = 0;
                if (h===k && k===l) mult = 8;
                else if (h===k || k===l || h===l) mult = 24;
                else mult = 48;
                // Adjust for 0 indices
                if (h===0 || k===0 || l===0) mult /= 2; // Very rough approx
                
                intensity *= (mult / 10); 

                const profile = simulatePeak(
                  'Pseudo-Voigt', twoTheta, params.fwhm, 0.5, 
                  intensity * (params.scale / 1000), 
                  [twoTheta - 5, twoTheta + 5], 100
                );

                profile.points.forEach(p => {
                  const idx = Math.round((p.x - SIMULATION_RANGE.start) / SIMULATION_RANGE.step);
                  if (idx >= 0 && idx < data.length) {
                    intensities[idx] += p.y;
                  }
                });
              }
            }
          }
        }
      }
      return intensities;
    };

    const obsIntensities = calculateIntensity(targetParams, true);
    const calcIntensities = calculateIntensity(userParams, false);

    let sumResSq = 0;
    let sumObsSq = 0;

    for (let i = 0; i < data.length; i++) {
      data[i].obs = obsIntensities[i];
      data[i].calc = calcIntensities[i];
      data[i].diff = obsIntensities[i] - calcIntensities[i];
      data[i].bkg = userParams.background;

      sumResSq += Math.pow(data[i].diff, 2);
      sumObsSq += Math.pow(data[i].obs, 2);
    }

    // Calculate R-factor (R-wp like)
    const R = Math.sqrt(sumResSq / sumObsSq) * 100;
    setRFactor(R);

    return data;
  }, [userParams, targetParams, simPhase]);

  // Auto-Refine Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoRefining) {
      interval = setInterval(() => {
        setUserParams(prev => {
          const step = 0.05;
          const diffA = targetParams.a - prev.a;
          const diffScale = targetParams.scale - prev.scale;
          const diffFwhm = targetParams.fwhm - prev.fwhm;
          const diffBkg = targetParams.background - prev.background;

          // Check convergence
          if (Math.abs(diffA) < 0.001 && Math.abs(diffScale) < 1 && Math.abs(diffFwhm) < 0.001) {
            setIsAutoRefining(false);
            return prev;
          }

          return {
            ...prev,
            a: prev.a + diffA * step,
            scale: prev.scale + diffScale * step,
            fwhm: prev.fwhm + diffFwhm * step,
            background: prev.background + diffBkg * step
          };
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoRefining, targetParams]);


  // --- Setup Generator Logic ---
  const updatePhase = (index: number, field: keyof RietveldPhaseInput, value: any) => {
    const newPhases = [...phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPhases(newPhases);
  };

  const addPhase = () => {
    setPhases([...phases, { name: `Phase ${phases.length + 1}`, crystalSystem: 'Cubic', a: 5.0 }]);
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = () => {
    const output = generateRietveldSetup({
      phases,
      maxObsIntensity,
      backgroundModel: bgModel,
      profileShape
    });
    setResult(output);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'simulation' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Simulation / Education
          {activeTab === 'simulation' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
            activeTab === 'setup' 
              ? 'text-teal-600 dark:text-teal-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          Setup Generator
          {activeTab === 'setup' && (
            <div className="absolute bottom-[-5px] left-0 w-full h-0.5 bg-teal-600 dark:bg-teal-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'simulation' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-500/20 rounded-xl border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <Settings className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Refinement Core</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Parameter Matrix</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => {
                       setUserParams({
                        ...TARGET_PARAMS[simPhase],
                        a: TARGET_PARAMS[simPhase].a * 1.05,
                        scale: TARGET_PARAMS[simPhase].scale * 0.8,
                        fwhm: TARGET_PARAMS[simPhase].fwhm * 1.5,
                        background: TARGET_PARAMS[simPhase].background * 1.2
                      });
                      setIsAutoRefining(false);
                    }}
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 hover:border-slate-700 active:scale-95"
                    title="Cold Reset"
                   >
                     <RotateCcw className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => setIsAutoRefining(!isAutoRefining)}
                    className={`p-2.5 rounded-xl transition-all border active:scale-95 flex items-center gap-2 ${isAutoRefining ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 'text-teal-400 bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20'}`}
                    title="Live Engine"
                   >
                     <PlayCircle className={`w-4 h-4 ${isAutoRefining ? 'animate-pulse' : ''}`} />
                   </button>
                </div>
              </div>

              <div className="space-y-5 relative z-10">
                <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 group/model hover:border-teal-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Beaker className="w-3.5 h-3.5 text-teal-500" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Structural Model</label>
                  </div>
                  <select 
                    value={simPhase}
                    onChange={(e) => setSimPhase(e.target.value)}
                    className="w-full px-3 py-3 bg-black/60 border border-slate-700 rounded-xl text-xs font-bold text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Simple Cubic">Simple Cubic (P m-3m)</option>
                    <option value="BCC">Body Centered (I m-3m)</option>
                    <option value="FCC">Face Centered (F m-3m)</option>
                    <option value="Quartz">Quartz (P 32 21)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Ruler className="w-3.5 h-3.5 text-teal-400" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lattice (a)</label>
                      </div>
                      <span className="text-xs font-mono font-black text-teal-400 bg-black/60 px-2 py-1 rounded-lg border border-slate-700/50 shadow-inner">{userParams.a.toFixed(4)} Å</span>
                    </div>
                    <input 
                      type="range" 
                      min={simPhase === 'Quartz' ? 4.5 : 2.5} 
                      max={simPhase === 'Quartz' ? 5.5 : 6.0} 
                      step="0.001"
                      value={userParams.a}
                      onChange={(e) => setUserParams({...userParams, a: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                    />
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Maximize className="w-3.5 h-3.5 text-teal-400" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity Scale</label>
                      </div>
                      <span className="text-xs font-mono font-black text-teal-400 bg-black/60 px-2 py-1 rounded-lg border border-slate-700/50 shadow-inner">{userParams.scale.toFixed(0)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="2000" 
                      step="10"
                      value={userParams.scale}
                      onChange={(e) => setUserParams({...userParams, scale: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                    />
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <Binary className="w-3.5 h-3.5 text-teal-400" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Width</label>
                      </div>
                      <span className="text-xs font-mono font-black text-teal-400 bg-black/60 px-2 py-1 rounded-lg border border-slate-700/50 shadow-inner">{userParams.fwhm.toFixed(3)}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="2.0" 
                      step="0.01"
                      value={userParams.fwhm}
                      onChange={(e) => setUserParams({...userParams, fwhm: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                    />
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <ChartIcon className="w-3.5 h-3.5 text-teal-400" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Noise Floor</label>
                      </div>
                      <span className="text-xs font-mono font-black text-teal-400 bg-black/60 px-2 py-1 rounded-lg border border-slate-700/50 shadow-inner">{userParams.background.toFixed(0)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      step="1"
                      value={userParams.background}
                      onChange={(e) => setUserParams({...userParams, background: parseFloat(e.target.value)})}
                      className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-800/50 mt-2">
                  <div className="bg-black/60 p-5 rounded-2xl border border-slate-700/50 shadow-inner relative overflow-hidden group/fit">
                    <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover/fit:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">Goodness of Fit</span>
                        <span className="text-[9px] font-mono text-teal-500/60 font-bold">Rwp_index_matrix</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-3xl font-black font-mono transition-colors tracking-tighter ${rFactor < 15 ? 'text-emerald-400' : rFactor < 30 ? 'text-amber-400 text-shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'text-rose-500 text-shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}>
                          {rFactor.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-3 bg-teal-500/5 p-4 rounded-xl border border-teal-500/10 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)] shrink-0" />
                    <p className="text-[10px] text-teal-400/80 leading-relaxed font-bold uppercase tracking-wider">
                      Optimization Strategy: Target Residual Reduction below 15%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[650px] flex flex-col relative overflow-hidden group/pattern">
              <div className="absolute top-0 left-0 -mt-8 -ml-8 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl group-hover/pattern:bg-teal-500/10 transition-all duration-1000"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
                 <div>
                   <h3 className="text-xl font-black text-white flex items-center gap-3">
                     <div className="p-2 bg-teal-500/20 rounded-lg border border-teal-500/30">
                        <BarChart2 className="w-5 h-5 text-teal-400" />
                     </div>
                     Diffraction Pattern Analysis
                   </h3>
                   <div className="flex items-center gap-2 mt-1.5 px-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Real-time Spectral Synthesis</span>
                   </div>
                 </div>

                 <div className="flex gap-4 p-2.5 bg-black/40 rounded-2xl border border-slate-800/50 shadow-inner">
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-slate-400/40 border border-slate-500/50 shadow-[0_0_8px_rgba(148,163,184,0.3)]"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Obs</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calc</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 border-r border-slate-800 last:border-0 font-mono">
                      <div className="w-4 h-[2px] bg-slate-600 rounded-full"></div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diff</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 w-full min-h-0 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={generatePatternData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="diffGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#475569" stopOpacity={0}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="twoTheta" 
                      type="number" 
                      domain={[SIMULATION_RANGE.start, SIMULATION_RANGE.end]} 
                      label={{ value: 'Angular Position [2θ°]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontWeight: 900, textAnchor: 'middle', letterSpacing: '0.1em' }}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#334155', strokeWidth: 1 }}
                      tickLine={{ stroke: '#334155' }}
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold', fontFamily: 'monospace' }}
                      cursor={{ stroke: '#334155', strokeWidth: 1 }}
                      formatter={(value: number) => value.toFixed(1)}
                    />
                    
                    <Area 
                      type="monotone" 
                      dataKey="diff" 
                      fill="url(#diffGradient)" 
                      stroke="#475569" 
                      strokeWidth={1}
                      fillOpacity={1}
                      isAnimationActive={false}
                    />
                    
                    <Scatter 
                      dataKey="obs" 
                      fill="#94a3b8" 
                      shape={(props) => {
                        const { cx, cy } = props;
                        return <circle cx={cx} cy={cy} r={1.2} fill="#94a3b8" fillOpacity={0.6} />;
                      }}
                      isAnimationActive={false}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="calc" 
                      stroke="#f43f5e" 
                      strokeWidth={2} 
                      dot={false} 
                      activeDot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                      filter="url(#glow)"
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Status Overlay */}
              <div className="absolute bottom-6 left-8 flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Data Feed</span>
                </div>
                <div className="h-3 w-[1px] bg-slate-700" />
                <span className="text-[9px] font-mono text-slate-500 uppercase">Resolution: {SIMULATION_RANGE.step}°/step</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- Setup Generator Tab Content ---
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-teal-600 rounded-full opacity-10 blur-2xl"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2.5 bg-teal-500/20 rounded-xl border border-teal-500/30">
                  <Settings className="w-5 h-5 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Refinement Setup</h2>
              </div>
    
              <div className="space-y-6 relative z-10">
                {/* Global Settings */}
                <div className="space-y-4 pb-6 border-b border-slate-800">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-slate-700"></span> Global Parameters
                  </h3>
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Max Observed Intensity</label>
                    <input
                      type="number"
                      value={maxObsIntensity}
                      onChange={(e) => setMaxObsIntensity(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 bg-black/40 text-teal-400 border border-slate-700 rounded-lg text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Background Model</label>
                       <select 
                          value={bgModel}
                          onChange={(e) => setBgModel(e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-black/40 text-teal-400 border border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                       >
                         <option value="Chebyshev_6_term">Chebyshev (6-term)</option>
                         <option value="Linear_Interpolation">Linear Interp</option>
                       </select>
                    </div>
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Profile Function</label>
                       <select 
                          value={profileShape}
                          onChange={(e) => setProfileShape(e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-black/40 text-teal-400 border border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                       >
                         <option value="Thompson-Cox-Hastings">Thompson-Cox-Hastings</option>
                         <option value="Pseudo-Voigt">Pseudo-Voigt</option>
                       </select>
                    </div>
                  </div>
                </div>
    
                {/* Phases */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-4 h-[1px] bg-slate-700"></span> Phases
                     </h3>
                     <button onClick={addPhase} className="text-[10px] uppercase tracking-widest text-teal-400 font-bold hover:text-teal-300 flex items-center gap-1 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20 transition-all">
                       + Add Phase
                     </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {phases.map((phase, idx) => (
                      <div key={`phase-${phase.name}-${idx}`} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 relative group">
                        {phases.length > 1 && (
                          <button 
                            onClick={() => removePhase(idx)}
                            className="absolute top-3 right-3 text-slate-500 hover:text-red-400 bg-black/40 p-1.5 rounded-lg border border-slate-700 hover:border-red-500/50 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        
                        <div className="grid gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Phase Name</label>
                            <input
                              type="text"
                              value={phase.name}
                              onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                              className="w-full px-3 py-2 bg-black/40 text-white border border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">System</label>
                              <select
                                value={phase.crystalSystem}
                                onChange={(e) => updatePhase(idx, 'crystalSystem', e.target.value)}
                                className="w-full px-3 py-2 bg-black/40 text-white border border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                              >
                                <option value="Cubic">Cubic</option>
                                <option value="Tetragonal">Tetragonal</option>
                                <option value="Orthorhombic">Orthorhombic</option>
                                <option value="Hexagonal">Hexagonal</option>
                                <option value="Monoclinic">Monoclinic</option>
                                <option value="Triclinic">Triclinic</option>
                              </select>
                            </div>
                            <div>
                               <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">a (Å)</label>
                               <input
                                type="number"
                                step="0.01"
                                value={phase.a}
                                onChange={(e) => updatePhase(idx, 'a', parseFloat(e.target.value))}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold font-mono"
                              />
                            </div>
                          </div>
                          
                          {/* Conditional inputs for non-cubic */}
                          {['Tetragonal', 'Orthorhombic', 'Hexagonal', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                            <div className="grid grid-cols-3 gap-2">
                                 {['Orthorhombic', 'Monoclinic', 'Triclinic', 'Hexagonal', 'Tetragonal'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">c (Å)</label>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={phase.c || phase.a}
                                          onChange={(e) => updatePhase(idx, 'c', parseFloat(e.target.value))}
                                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold font-mono"
                                        />
                                    </div>
                                 )}
                                 {['Orthorhombic', 'Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">b (Å)</label>
                                       <input
                                          type="number"
                                          step="0.01"
                                          value={phase.b || phase.a}
                                          onChange={(e) => updatePhase(idx, 'b', parseFloat(e.target.value))}
                                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold font-mono"
                                        />
                                    </div>
                                 )}
                                 {['Monoclinic', 'Triclinic'].includes(phase.crystalSystem) && (
                                    <div>
                                       <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">β (°)</label>
                                       <input
                                          type="number"
                                          step="0.1"
                                          value={phase.beta || 90}
                                          onChange={(e) => updatePhase(idx, 'beta', parseFloat(e.target.value))}
                                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold font-mono"
                                        />
                                    </div>
                                 )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
    
                <button
                  onClick={handleGenerate}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  Generate Control Parameters
                </button>
              </div>
            </div>
          </div>
    
          {/* Results Output */}
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-6 h-full">
               
               {/* Strategy Card */}
               {result && (
                 <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                   <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 uppercase tracking-wide">Refinement Strategy</h3>
                   <div className="space-y-2">
                     {result.refinement_strategy.map((step, i) => (
                       <div key={`step-${i}`} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
                         <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 flex items-center justify-center text-xs font-bold">
                           {i+1}
                         </div>
                         {step.replace(/^\d+\.\s*/, '')}
                       </div>
                     ))}
                   </div>
                 </div>
               )}
    
               {/* JSON Output */}
               <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col flex-1 min-h-[400px]">
                 <div className="p-3 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                   <h3 className="font-mono text-sm text-teal-400">control_file.json</h3>
                   <button 
                      onClick={() => result && navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                      className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                   >
                     <Download className="w-3 h-3" />
                     Copy JSON
                   </button>
                 </div>
                 <div className="p-4 overflow-auto flex-1 custom-scrollbar">
                    {result ? (
                      <pre className="font-mono text-xs md:text-sm text-slate-300 leading-relaxed">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-600 text-sm font-mono">
                        // Configure parameters and click generate
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

