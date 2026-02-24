import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Area, Scatter 
} from 'recharts';
import { 
  Activity, Settings, RefreshCw, BarChart2, Download, PlayCircle, RotateCcw, 
  Beaker, Calculator, ChevronRight, BookOpen, Layers
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-500" />
                  Parameters
                </h2>
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
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Reset Parameters"
                   >
                     <RotateCcw className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={() => setIsAutoRefining(!isAutoRefining)}
                    className={`p-2 rounded-lg transition-colors ${isAutoRefining ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20'}`}
                    title="Auto Refine"
                   >
                     <PlayCircle className="w-4 h-4" />
                   </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Phase Model</label>
                  <select 
                    value={simPhase}
                    onChange={(e) => setSimPhase(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Simple Cubic">Simple Cubic</option>
                    <option value="BCC">Body Centered Cubic (BCC)</option>
                    <option value="FCC">Face Centered Cubic (FCC)</option>
                    <option value="Quartz">Quartz (SiO2)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Lattice Parameter (a)</label>
                      <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">{userParams.a.toFixed(3)} Å</span>
                    </div>
                    <input 
                      type="range" 
                      min={simPhase === 'Quartz' ? 4.5 : 2.5} 
                      max={simPhase === 'Quartz' ? 5.5 : 6.0} 
                      step="0.001"
                      value={userParams.a}
                      onChange={(e) => setUserParams({...userParams, a: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Scale Factor</label>
                      <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">{userParams.scale.toFixed(0)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="2000" 
                      step="10"
                      value={userParams.scale}
                      onChange={(e) => setUserParams({...userParams, scale: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Peak Width (FWHM)</label>
                      <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">{userParams.fwhm.toFixed(3)}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="2.0" 
                      step="0.01"
                      value={userParams.fwhm}
                      onChange={(e) => setUserParams({...userParams, fwhm: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Background</label>
                      <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">{userParams.background.toFixed(0)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      step="1"
                      value={userParams.background}
                      onChange={(e) => setUserParams({...userParams, background: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Goodness of Fit (R-factor)</span>
                    <span className={`text-lg font-bold font-mono ${rFactor < 15 ? 'text-green-500' : rFactor < 30 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {rFactor.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Goal: Minimize the R-factor by matching the calculated pattern (red) to the observed data (dots).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Diffraction Pattern</h3>
                 <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span className="text-slate-500">Observed</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-slate-500">Calculated</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                      <span className="text-slate-500">Difference</span>
                    </div>
                 </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={generatePatternData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" opacity={0.5} />
                    <XAxis 
                      dataKey="twoTheta" 
                      type="number" 
                      domain={[SIMULATION_RANGE.start, SIMULATION_RANGE.end]} 
                      label={{ value: '2θ (degrees)', position: 'bottom', offset: 0, fill: 'var(--color-text-secondary, #94a3b8)' }}
                      tick={{ fill: 'var(--color-text-secondary, #94a3b8)', fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-bg-card, #fff)', borderColor: 'var(--color-border, #e2e8f0)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-text-primary, #0f172a)' }}
                      labelStyle={{ color: 'var(--color-text-secondary, #64748b)' }}
                      formatter={(value: number) => value.toFixed(0)}
                    />
                    {/* Difference Curve (Area) */}
                    <Area 
                      type="monotone" 
                      dataKey="diff" 
                      fill="#94a3b8" 
                      stroke="none" 
                      fillOpacity={0.2} 
                    />
                    {/* Observed Data (Scatter) */}
                    <Scatter 
                      dataKey="obs" 
                      fill="#64748b" 
                      opacity={0.6} 
                      shape="circle" 
                    />
                    {/* Calculated Data (Line) */}
                    <Line 
                      type="monotone" 
                      dataKey="calc" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      dot={false} 
                      activeDot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- Setup Generator Tab Content ---
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Refinement Setup
              </h2>
    
              <div className="space-y-6">
                {/* Global Settings */}
                <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">Global Parameters</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Max Observed Intensity</label>
                    <input
                      type="number"
                      value={maxObsIntensity}
                      onChange={(e) => setMaxObsIntensity(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Background Model</label>
                       <select 
                          value={bgModel}
                          onChange={(e) => setBgModel(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-medium"
                       >
                         <option value="Chebyshev_6_term">Chebyshev (6-term)</option>
                         <option value="Linear_Interpolation">Linear Interp</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Profile Function</label>
                       <select 
                          value={profileShape}
                          onChange={(e) => setProfileShape(e.target.value as any)}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-medium"
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
                     <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wide">Phases</h3>
                     <button onClick={addPhase} className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1">
                       + Add Phase
                     </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {phases.map((phase, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 relative group">
                        {phases.length > 1 && (
                          <button 
                            onClick={() => removePhase(idx)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        
                        <div className="grid gap-3">
                          <div>
                            <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Phase Name</label>
                            <input
                              type="text"
                              value={phase.name}
                              onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-bold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">System</label>
                              <select
                                value={phase.crystalSystem}
                                onChange={(e) => updatePhase(idx, 'crystalSystem', e.target.value)}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-xs"
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
                       <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800">
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

