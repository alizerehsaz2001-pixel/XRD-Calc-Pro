import React, { useState, useEffect, useRef } from 'react';
import { parseScherrerInput, calculateWilliamsonHall, XRAY_WAVELENGTHS } from '../utils/physics';
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
  Area
} from 'recharts';
import { Info, BookOpen, AlertTriangle, TrendingUp, Ruler, ChevronDown, Check, Atom, Binary, ShieldQuestion, Download, RefreshCw, Trash2, Loader2, Database, FlaskConical, Activity, Layers, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScientificMathControl } from './ScientificMathControl';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const K_FACTORS = [
  { label: 'Standard Average', value: 0.9, desc: 'General approximation for unknown or polydisperse morphologies', icon: '⚡' },
  { label: 'Spherical', value: 0.94, desc: 'Optimized for isotropic spherical particles (FWHM-based)', icon: '⚪' },
  { label: 'Cubic {100}', value: 0.943, desc: 'Exact factor for cubic crystallites with {100} facets', icon: '⬜' },
  { label: 'Cubic {111}', value: 0.84, desc: 'Calculated for cubic shapes with {111} orientation', icon: '🧊' },
  { label: 'Octahedral', value: 0.94, desc: 'Common for spinel/diamond structured materials', icon: '◇' },
  { label: 'Tetrahedral', value: 0.73, desc: 'Calculated for triangular/tetrahedral geometries', icon: '▲' },
  { label: 'Platelets/Disks', value: 0.89, desc: 'Low aspect ratio plate-like grains', icon: '▤' },
  { label: 'Nanowires/Rods', value: 1.1, desc: 'Calculated for high-anisotropy 1D structures', icon: '┃' },
  { label: 'Integral Breadth', value: 1.0, desc: 'Theoretical value when using Integral Breadth instead of FWHM', icon: '∫' },
  { label: 'Custom', value: 0, desc: 'User-defined dimensionless shape factor', icon: '✎' }
];

const WH_PRESETS = [
  { 
    name: 'Silicon (Standard)', 
    data: "28.44, 0.12, 1, 1, 1\n47.30, 0.15, 2, 2, 0\n56.12, 0.18, 3, 1, 1\n69.13, 0.22, 4, 0, 0\n76.38, 0.25, 3, 3, 1", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Nearly zero strain reference.',
    icon: '💎'
  },
  { 
    name: 'Polycarbonate', 
    data: "14.1, 0.35, 1, 0, 0\n16.9, 0.42, 1, 1, 0\n18.6, 0.48, 1, 1, 1\n21.2, 0.55, 2, 0, 0\n21.8, 0.58, 2, 1, 0", 
    wavelength: 1.5406, 
    k: 0.94, 
    desc: 'Semi-crystalline polymer with significant strain.',
    icon: '🌀'
  },
  { 
    name: 'Strained Cu Film', 
    data: "43.30, 0.45, 1, 1, 1\n50.43, 0.52, 2, 0, 0\n74.13, 0.72, 2, 2, 0\n89.93, 0.95, 3, 1, 1", 
    wavelength: 1.5406, 
    k: 0.9, 
    desc: 'Metals with processing-induced stress.',
    icon: '🎞️'
  }
];

const CAGLIOTI_PRESETS = [
  { name: 'Standard Lab XRD', u: 0.005, v: -0.002, w: 0.015, desc: 'Bragg-Brentano focus, standard divergent slit' },
  { name: 'High-Res Synchrotron', u: 0.0002, v: -0.0001, w: 0.001, desc: 'Extremely parallel mono-chromated beam' },
  { name: 'Neutron Diffractometer', u: 0.05, v: -0.03, w: 0.02, desc: 'Thermal neutron powder instrument line' }
];

const MODULUS_PRESETS = [
  { name: 'Silicon (Si)', value: 130, desc: 'Cubic semiconductor crystal, [100] direction dynamic average' },
  { name: 'Alumina (Al2O3)', value: 380, desc: 'Corundum sintered refractory ceramic' },
  { name: 'Copper (Cu)', value: 120, desc: 'High-ductility fcc coin metal' },
  { name: 'Iron / Ferritic Steel (Fe)', value: 200, desc: 'Mechanical baseline structural alloy' },
  { name: 'Quartz (SiO2)', value: 70, desc: 'Trigonal silica polymorph crystal' },
  { name: 'PMMA Polymeric Glass', value: 3.2, desc: 'Amorphous thermo-plastic polymer network' }
];

const EMISSION_LINES: Record<string, { name: string; avg: number; a1: number; a2: number; beta: number; energy: number; description: string }> = {
  Cu: { name: 'Copper (Cu)', avg: 1.54184, a1: 1.54056, a2: 1.54439, beta: 1.39225, energy: 8.048, description: 'Standard laboratory anode for general structural XRD' },
  Mo: { name: 'Molybdenum (Mo)', avg: 0.71073, a1: 0.70930, a2: 0.71359, beta: 0.63229, energy: 17.479, description: 'Ideal for deeply penetrating metallic alloys & high-pressure cells' },
  Co: { name: 'Cobalt (Co)', avg: 1.79026, a1: 1.78897, a2: 1.79285, beta: 1.62079, energy: 6.930, description: 'Prevents Fe-fluorescence; perfect for iron-rich materials & mineralogy' },
  Cr: { name: 'Chromium (Cr)', avg: 2.29100, a1: 2.28970, a2: 2.29361, beta: 2.08487, energy: 5.415, description: 'Long wavelength; high resolution for macromolecular & thin-film strain' },
  Fe: { name: 'Iron (Fe)', avg: 1.93735, a1: 1.93604, a2: 1.93998, beta: 1.75661, energy: 6.404, description: 'Used for specialized soft magnetic and biological oxide patterns' },
  Ag: { name: 'Silver (Ag)', avg: 0.56088, a1: 0.55941, a2: 0.56381, beta: 0.49707, energy: 22.163, description: 'High energy; reduces absorption and probes deeper crystalline bulk' },
  W:  { name: 'Tungsten (W)', avg: 0.21062, a1: 0.20901, a2: 0.21385, beta: 0.18437, energy: 59.318, description: 'Continuous spectrum source or extreme energetic K-edge profiling' }
};

export const WilliamsonHallModule: React.FC = () => {
  const [wavelength, setWavelength] = useState<number>(1.5406);
  const [constantK, setConstantK] = useState<number>(0.9);
  const [instFwhm, setInstFwhm] = useState<number>(0.1);
  const [instrumentalMode, setInstrumentalMode] = useState<'constant' | 'caglioti'>('constant');
  const [cagliotiU, setCagliotiU] = useState<number>(0.005);
  const [cagliotiV, setCagliotiV] = useState<number>(-0.002);
  const [cagliotiW, setCagliotiW] = useState<number>(0.015);
  const [youngsModulusGPa, setYoungsModulusGPa] = useState<number>(130);
  const [isModulusEnabled, setIsModulusEnabled] = useState<boolean>(false);
  const [inputData, setInputData] = useState<string>("28.44, 0.25, 4, 0, 0\n47.30, 0.28, 2, 2, 0\n56.12, 0.32, 2, 2, 2\n69.13, 0.38, 4, 4, 0\n76.38, 0.42, 6, 2, 0");
  const [broadeningModel, setBroadeningModel] = useState<'Gaussian' | 'Lorentzian'>('Gaussian');
  const [strainModel, setStrainModel] = useState<'UDM' | 'USDM' | 'UDEDM' | 'Stephens'>('UDM');
  const [result, setResult] = useState<WHResult | null>(() => {
    try {
      const saved = localStorage.getItem('xrd_wh_current');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const isFirstRender = useRef(true);
  const [selectedKType, setSelectedKType] = useState<string>('Standard Average');
  const [isKTypeMenuOpen, setIsKTypeMenuOpen] = useState(false);

  // Advanced Wavelength Estimator States
  const [isWaveEstimatorOpen, setIsWaveEstimatorOpen] = useState(false);
  const [waveSourceType, setWaveSourceType] = useState<'lab' | 'synchrotron'>('lab');
  const [selectedAnode, setSelectedAnode] = useState<string>('Cu');
  const [selectedLine, setSelectedLine] = useState<'avg' | 'a1' | 'a2' | 'beta'>('a1');
  const [synchrotronEnergy, setSynchrotronEnergy] = useState<number>(15.0);

  // Dynamic estimated wavelength calculation
  const calculatedWavelength = React.useMemo(() => {
    if (waveSourceType === 'lab') {
      const info = EMISSION_LINES[selectedAnode];
      if (info) {
        if (selectedLine === 'avg') return info.avg;
        if (selectedLine === 'a1') return info.a1;
        if (selectedLine === 'a2') return info.a2;
        if (selectedLine === 'beta') return info.beta;
      }
      return 1.54056;
    } else {
      // synch energy formula: lambda = 12.39842 / E
      const E = Math.max(0.1, synchrotronEnergy);
      return parseFloat((12.39842 / E).toFixed(6));
    }
  }, [waveSourceType, selectedAnode, selectedLine, synchrotronEnergy]);

  // Advanced Shape Factor (K) Estimator States
  const [isKEstimatorOpen, setIsKEstimatorOpen] = useState(false);
  const [estHabit, setEstHabit] = useState<'cubic' | 'cylindrical' | 'spheroid'>('cubic');
  const [cubicHKL, setCubicHKL] = useState<'100' | '110' | '111' | 'octahedral' | 'tetrahedral'>('100');
  const [cylinderAspect, setCylinderAspect] = useState<number>(2.0);
  const [cylinderOrientation, setCylinderOrientation] = useState<'axial' | 'radial'>('axial');
  const [spheroidEccentricity, setSpheroidEccentricity] = useState<number>(0.5);
  const [breadthDef, setBreadthDef] = useState<'fwhm' | 'ib'>('fwhm');

  // Dynamically calculate K based on morphology parameters
  const calculatedK = React.useMemo(() => {
    if (estHabit === 'cubic') {
      if (breadthDef === 'fwhm') {
        switch (cubicHKL) {
          case '100': return 0.943;
          case '110': return 0.812;
          case '111': return 0.844;
          case 'octahedral': return 0.940;
          case 'tetrahedral': return 0.730;
          default: return 0.900;
        }
      } else { // Integral Breadth
        switch (cubicHKL) {
          case '100': return 1.000;
          case '110': return 1.061;
          case '111': return 1.155;
          case 'octahedral': return 1.060;
          case 'tetrahedral': return 1.390;
          default: return 1.000;
        }
      }
    } else if (estHabit === 'cylindrical') {
      const R = Math.max(0.01, cylinderAspect);
      if (cylinderOrientation === 'axial') {
        const val = 0.9 + 0.1 * Math.log(R);
        return parseFloat(Math.min(1.3, Math.max(0.85, val)).toFixed(3));
      } else {
        const val = 0.9 / (1 + 0.05 * Math.log(R));
        return parseFloat(Math.min(1.1, Math.max(0.75, val)).toFixed(3));
      }
    } else if (estHabit === 'spheroid') {
      const e = Math.min(0.99, Math.max(0.01, spheroidEccentricity));
      const sphereBase = breadthDef === 'fwhm' ? 0.94 : 1.077;
      const val = sphereBase + 0.15 * e;
      return parseFloat(Math.min(1.25, Math.max(0.75, val)).toFixed(3));
    }
    return 0.900;
  }, [estHabit, cubicHKL, cylinderAspect, cylinderOrientation, spheroidEccentricity, breadthDef]);

  // Ref for clicking outside
  const kMenuRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setWavelength(1.5406);
    setConstantK(0.9);
    setInstFwhm(0.1);
    setInstrumentalMode('constant');
    setCagliotiU(0.005);
    setCagliotiV(-0.002);
    setCagliotiW(0.015);
    setYoungsModulusGPa(130);
    setIsModulusEnabled(false);
    setInputData("28.44, 0.25, 4, 0, 0\n47.30, 0.28, 2, 2, 0\n56.12, 0.32, 2, 2, 2\n69.13, 0.38, 4, 4, 0\n76.38, 0.42, 6, 2, 0");
    setSelectedKType('Standard Average');
    setStrainModel('UDM');
  };

  const handleClear = () => {
    setInputData("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kMenuRef.current && !kMenuRef.current.contains(event.target as Node)) {
        setIsKTypeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const handleCalculate = () => {
    if (isSimulationRunning) return;
    
    setIsSimulationRunning(true);
    setSimulationStep(1);
    
    setTimeout(() => setSimulationStep(2), 600);
    setTimeout(() => setSimulationStep(3), 1400);
    setTimeout(() => setSimulationStep(4), 2200);
    setTimeout(() => setSimulationStep(5), 3000);
    
    setTimeout(() => {
      setIsSimulationRunning(false);
      const peaks = parseScherrerInput(inputData);
      const currentPreset = MODULUS_PRESETS.find(p => p.value === youngsModulusGPa);
      const computed = calculateWilliamsonHall(
        wavelength, 
        constantK, 
        instFwhm, 
        peaks, 
        broadeningModel,
        instrumentalMode,
        { U: cagliotiU, V: cagliotiV, W: cagliotiW },
        isModulusEnabled ? youngsModulusGPa : undefined,
        strainModel,
        currentPreset?.name
      );
      setResult(computed);
      localStorage.setItem('xrd_wh_current', JSON.stringify(computed));
    }, 3800);
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "2Theta,4sin(theta),beta*cos(theta),Fit\n";
    const rows = chartData.map(d => `${d.twoTheta?.toFixed(4) || 0},${d.x.toFixed(6)},${d.y.toFixed(6)},${d.fit.toFixed(6)}`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wh_plot_data_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setResult(null); // Clear result when inputs change to enforce re-analyzing
    localStorage.removeItem('xrd_wh_current');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wavelength, constantK, instFwhm, inputData, broadeningModel, instrumentalMode, cagliotiU, cagliotiV, cagliotiW, youngsModulusGPa, isModulusEnabled, strainModel]);

  // Prepare chart data
  const chartData = result ? result.points.map(p => {
    const fitY = result.regression.slope * p.x + result.regression.intercept;
    const stdDev = Math.sqrt(
      result.points.reduce((sum, pt) => {
        const yPred = result.regression.slope * pt.x + result.regression.intercept;
        return sum + Math.pow(pt.y - yPred, 2);
      }, 0) / Math.max(1, result.points.length - 2)
    );
    const confidenceBound = stdDev * 2.1; // 95% CI roughly
    return {
      x: p.x,
      y: p.y,
      fit: fitY,
      fitRange: [Math.max(0, fitY - confidenceBound), fitY + confidenceBound],
      deviation: p.y - fitY,
      twoTheta: p.twoTheta
    };
  }).sort((a,b) => a.x - b.x) : [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#0A101C] text-white p-4 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.15)] border border-cyan-500/30 text-xs font-mono">
          <p className="font-black mb-3 text-cyan-400 border-b border-white/5 pb-2 uppercase tracking-widest">Peak at {d.twoTheta?.toFixed(2)}°</p>
          <div className="space-y-2 text-[10px]">
            <p className="flex justify-between gap-6">
              <span className="text-slate-500 uppercase">
                {strainModel === 'USDM' 
                  ? 'X (4sinθ / E_hkl)' 
                  : strainModel === 'UDEDM' 
                  ? 'X (4sinθ / √E_hkl)' 
                  : 'X (4sinθ)'
                }
              </span> 
              <span className="text-cyan-300 font-bold">{d.x.toFixed(5)}</span>
            </p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Y (βcosθ)</span> <span className="text-cyan-300 font-bold">{d.y.toFixed(5)}</span></p>
            <p className="flex justify-between gap-6"><span className="text-slate-500 uppercase">Linear Fit</span> <span className="text-rose-400">{d.fit.toFixed(5)}</span></p>
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
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(34,211,238,0.05)] border border-cyan-500/20 relative overflow-hidden group transition-all hover:border-cyan-500/40">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl translate-y-16 -translate-x-16 group-hover:bg-rose-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20" />
                <div className="p-2.5 bg-[#070D18] rounded-xl border border-cyan-500/30 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">W-H Parameters</h2>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 bg-white/5 hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-1.5 mt-1 relative overflow-hidden group/btn"
              title="Reset config to defaults"
            >
              <RefreshCw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" /> Reset
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors relative overflow-hidden group/wave">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Wavelength (Å)
                  </label>
                  {wavelength > 0 && (
                    <span className="text-[9px] font-mono text-cyan-400 font-bold">
                      ~{(12.39842 / wavelength).toFixed(2)} keV
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={wavelength}
                    onChange={(e) => setWavelength(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-[#0A101C] text-cyan-300 border border-white/10 focus:border-cyan-500/50 rounded-lg focus:ring-1 focus:ring-cyan-500/20 outline-none font-mono text-sm transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black text-slate-700">Å</div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {Object.entries(XRAY_WAVELENGTHS).slice(0, 4).map(([name, val]) => (
                    <button
                      key={name}
                      onClick={() => setWavelength(val)}
                      className={`py-1.5 px-0.5 rounded border text-[8px] font-black uppercase tracking-tight transition-all
                        ${wavelength === val 
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                          : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'
                        }
                      `}
                    >
                      {name.replace(' Kα', '').replace(' (avg)', '')}
                    </button>
                  ))}
                </div>

                {/* Advanced Source & Energy Estimator */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsWaveEstimatorOpen(!isWaveEstimatorOpen)}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Binary className="w-3.5 h-3.5" />
                    {isWaveEstimatorOpen ? 'Hide Estimator' : '🔬 Source & Energy (keV) Estimator'}
                  </button>
                </div>

                {isWaveEstimatorOpen && (
                  <div className="overflow-hidden mt-3 space-y-3 pt-3 border-t border-white/5 text-[10px]">
                    {/* Source Type Toggle */}
                    <div className="space-y-1">
                      <span className="text-slate-500 uppercase font-black text-[9px] tracking-wider block">Source Tech</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWaveSourceType('lab')}
                          className={`py-1 px-2 rounded font-black uppercase tracking-wider border text-[8px] transition-all ${waveSourceType === 'lab' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-black/20 border-white/5 text-slate-500'}`}
                        >
                          Lab X-Ray Tube
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaveSourceType('synchrotron')}
                          className={`py-1 px-2 rounded font-black uppercase tracking-wider border text-[8px] transition-all ${waveSourceType === 'synchrotron' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-black/20 border-white/5 text-slate-500'}`}
                        >
                          Synchrotron / Tunable
                        </button>
                      </div>
                    </div>

                    {/* Lab Options */}
                    {waveSourceType === 'lab' ? (
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-3">
                        {/* Target Anode selection */}
                        <div>
                          <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider block mb-1">Anode Material</span>
                          <div className="grid grid-cols-4 gap-1">
                            {Object.keys(EMISSION_LINES).map(anode => (
                              <button
                                key={anode}
                                type="button"
                                onClick={() => setSelectedAnode(anode)}
                                className={`py-1 rounded border font-mono text-[8px] transition-all ${selectedAnode === anode ? 'bg-cyan-500/30 border-cyan-500/40 text-cyan-400 font-bold' : 'bg-[#0A101C] border-none text-slate-500'}`}
                              >
                                {anode}
                              </button>
                            ))}
                          </div>
                          {EMISSION_LINES[selectedAnode] && (
                            <p className="text-[8px] text-slate-500 font-sans mt-1.5 block leading-normal">
                              <strong>{EMISSION_LINES[selectedAnode].name}</strong>: {EMISSION_LINES[selectedAnode].description}
                            </p>
                          )}
                        </div>

                        {/* Spectral lines selection */}
                        <div>
                          <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider block mb-1">Spectral Line / Doublet Selection</span>
                          <div className="grid grid-cols-2 gap-1 mb-1">
                            {(['a1', 'avg'] as const).map(line => (
                              <button
                                key={line}
                                type="button"
                                onClick={() => setSelectedLine(line)}
                                className={`py-1 rounded border text-[8px] font-black uppercase transition-all ${selectedLine === line ? 'bg-cyan-500/30 border-cyan-500/40 text-cyan-400 font-bold' : 'bg-[#0A101C] border-none text-slate-500'}`}
                              >
                                {line === 'a1' ? 'Kα1 Line' : 'Weighted Kα Avg'}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {(['a2', 'beta'] as const).map(line => (
                              <button
                                key={line}
                                type="button"
                                onClick={() => setSelectedLine(line)}
                                className={`py-1 rounded border text-[8px] font-black uppercase transition-all ${selectedLine === line ? 'bg-cyan-500/30 border-cyan-500/40 text-cyan-400 font-bold' : 'bg-[#0A101C] border-none text-slate-500'}`}
                              >
                                {line === 'a2' ? 'Kα2 Line' : 'Kβ1 Line'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Synchrotron / Tunable Options */
                      <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-3">
                        <div>
                          <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 mb-1">
                            <span className="uppercase font-semibold">Incident Photon Energy (keV)</span>
                            <span className="font-mono text-cyan-400">{synchrotronEnergy.toFixed(2)} keV</span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="100.0"
                            step="0.1"
                            value={synchrotronEnergy}
                            onChange={(e) => setSynchrotronEnergy(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-500"
                          />
                          <div className="mt-2 text-[8px] text-slate-500 font-sans flex justify-between font-mono">
                            <span>1.0 keV</span>
                            <span>50.0 keV</span>
                            <span>100.0 keV</span>
                          </div>
                        </div>
                        <p className="text-[8px] text-slate-500 italic mt-1 font-mono leading-normal">
                          Computed wavelength uses the relativistic wave equation: λ(Å) = hc / E ≈ 12.39842 / E_keV.
                        </p>
                      </div>
                    )}

                    {/* Result and Apply */}
                    <div className="bg-cyan-500/10 p-2 text-cyan-300 rounded-lg border border-cyan-500/20 flex items-center justify-between gap-2 font-mono">
                      <div>
                        <span className="block text-[7px] text-slate-500 uppercase font-black">Computed λ</span>
                        <span className="text-xs font-black text-cyan-400 tracking-wider">λ = {calculatedWavelength.toFixed(5)} Å</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWavelength(calculatedWavelength);
                          setIsWaveEstimatorOpen(false);
                        }}
                        className="py-1 px-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-black uppercase text-[8px] rounded transition-transform active:scale-95 cursor-pointer"
                      >
                        Apply λ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-colors relative">
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.2em]">
                  Shape Factor (K)
                </label>
                <div className="relative" ref={kMenuRef}>
                  <button
                    onClick={() => setIsKTypeMenuOpen(!isKTypeMenuOpen)}
                    className="w-full px-4 py-2.5 bg-[#0A101C] border border-white/10 hover:border-rose-500/40 rounded-lg outline-none transition-all flex items-center justify-between group shadow-inner"
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-mono font-black text-rose-400 truncate max-w-[100px]">
                        {selectedKType}
                       </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isKTypeMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isKTypeMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[110%] left-0 right-0 bg-[#070D18] rounded-xl border border-rose-500/30 shadow-[0_5px_30px_rgba(0,0,0,0.5)] overflow-hidden z-[100] py-1 max-h-[250px] overflow-y-auto custom-scrollbar"
                      >
                        {K_FACTORS.map((k) => (
                          <button
                            key={k.label}
                            onClick={() => {
                              setSelectedKType(k.label);
                              if (k.value !== 0) setConstantK(k.value);
                              setIsKTypeMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 flex items-center justify-between hover:bg-rose-500/10 transition-colors group/item relative
                              ${selectedKType === k.label ? 'bg-rose-500/5' : ''}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm bg-black/50 w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 group-hover/item:border-rose-500/30 transition-colors">
                                {k.icon}
                              </span>
                              <div className="flex flex-col items-start text-left">
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${selectedKType === k.label ? 'text-rose-400' : 'text-slate-300'}`}>
                                  {k.label} {k.value !== 0 && `(${k.value})`}
                                </span>
                                <span className="text-[8px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                                  {k.desc}
                                </span>
                              </div>
                            </div>
                            {selectedKType === k.label && <Check className="w-3 h-3 text-rose-400 shrink-0 ml-2" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <div className="relative w-full">
                      <input
                        type="number"
                        step="0.01"
                        value={constantK}
                        onChange={(e) => {
                          setConstantK(parseFloat(e.target.value));
                          setSelectedKType('Custom');
                        }}
                        className="w-full px-4 py-2.5 bg-[#0A101C] text-rose-400 border border-white/10 rounded-lg focus:border-rose-500/50 outline-none font-mono text-xs font-black transition-all text-center focus:ring-1 focus:ring-rose-500/20"
                      />
                    </div>
                  </div>

                  {/* Dynamic Crystal Shape and hkl Estimator */}
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setIsKEstimatorOpen(!isKEstimatorOpen)}
                      className="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Atom className="w-3.5 h-3.5" />
                      {isKEstimatorOpen ? 'Hide Estimator' : '🔬 Crystal Shape & hkl Estimator'}
                    </button>
                  </div>

                  {isKEstimatorOpen && (
                    <div className="overflow-hidden mt-3 space-y-3 pt-3 border-t border-white/5 text-[10px]">
                      {/* Width Definition */}
                      <div className="space-y-1">
                        <span className="text-slate-500 uppercase font-black text-[9px] tracking-wider block">Width Definition</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBreadthDef('fwhm')}
                            className={`py-1 px-2 rounded font-black uppercase tracking-wider border text-[8px] transition-all ${breadthDef === 'fwhm' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-black/20 border-white/5 text-slate-500'}`}
                          >
                            FWHM-based
                          </button>
                          <button
                            type="button"
                            onClick={() => setBreadthDef('ib')}
                            className={`py-1 px-2 rounded font-black uppercase tracking-wider border text-[8px] transition-all ${breadthDef === 'ib' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-black/20 border-white/5 text-slate-500'}`}
                          >
                            Integral Breadth
                          </button>
                        </div>
                      </div>

                      {/* Presets by Habit */}
                      <div className="space-y-1">
                        <span className="text-slate-500 uppercase font-black text-[9px] tracking-wider block">Crystallite Shape Habit</span>
                        <div className="grid grid-cols-3 gap-1">
                          {(['cubic', 'cylindrical', 'spheroid'] as const).map(hab => (
                            <button
                              key={hab}
                              type="button"
                              onClick={() => setEstHabit(hab)}
                              className={`py-1 px-1 rounded border text-[8px] font-black uppercase tracking-tight transition-all truncate ${estHabit === hab ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-black/20 border-white/10 text-slate-500'}`}
                            >
                              {hab}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cubic detail options */}
                      {estHabit === 'cubic' && (
                        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-2">
                          <div>
                            <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider block mb-1">Cubic Plane Index (hkl)</span>
                            <div className="grid grid-cols-3 gap-1 mb-2">
                              {(['100', '110', '111'] as const).map(hkl => (
                                <button
                                  key={hkl}
                                  type="button"
                                  onClick={() => setCubicHKL(hkl)}
                                  className={`py-1 rounded border font-mono text-[8px] transition-all ${cubicHKL === hkl ? 'bg-rose-500/30 border-rose-500/40 text-rose-400' : 'bg-[#0A101C] border-none text-slate-500'}`}
                                >
                                  [{hkl}]
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {(['octahedral', 'tetrahedral'] as const).map(shape => (
                                <button
                                  key={shape}
                                  type="button"
                                  onClick={() => setCubicHKL(shape)}
                                  className={`py-1 rounded border font-mono text-[8px] capitalize transition-all ${cubicHKL === shape ? 'bg-rose-500/30 border-rose-500/40 text-rose-400' : 'bg-[#0A101C] border-none text-slate-500'}`}
                                >
                                  {shape}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[8px] text-slate-500 italic mt-1 font-mono">
                            Factors computed via projection integrals over standard polyhedral geometry relative to the diffracting planes.
                          </p>
                        </div>
                      )}

                      {/* Cylindrical Habit options */}
                      {estHabit === 'cylindrical' && (
                        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-2">
                          <div>
                            <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider block mb-1">Plane Orientation</span>
                            <div className="grid grid-cols-2 gap-1.5 mb-2">
                              <button
                                type="button"
                                onClick={() => setCylinderOrientation('axial')}
                                className={`py-1 rounded border text-[8px] font-black uppercase transition-all ${cylinderOrientation === 'axial' ? 'bg-rose-500/30 border-rose-500/40 text-rose-400' : 'bg-[#0A101C] border-none text-slate-500'}`}
                              >
                                Longitudinal (Axial L)
                              </button>
                              <button
                                type="button"
                                onClick={() => setCylinderOrientation('radial')}
                                className={`py-1 rounded border text-[8px] font-black uppercase transition-all ${cylinderOrientation === 'radial' ? 'bg-rose-500/30 border-rose-500/40 text-rose-400' : 'bg-[#0A101C] border-none text-slate-500'}`}
                              >
                                Transverse (Radial D)
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 mb-1">
                              <span className="uppercase font-semibold">Aspect Ratio (Length / Diam)</span>
                              <span className="font-mono text-rose-400">{cylinderAspect.toFixed(1)}</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="15"
                              step="0.1"
                              value={cylinderAspect}
                              onChange={(e) => setCylinderAspect(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-500"
                            />
                          </div>
                          <p className="text-[8px] text-slate-500 italic font-mono">
                            Useful for anisotropic structures such as flat disks/platelets or long nanowires.
                          </p>
                        </div>
                      )}

                      {/* Spheroid option */}
                      {estHabit === 'spheroid' && (
                        <div className="bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-2">
                          <div>
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 mb-1">
                              <span className="uppercase font-semibold">Eccentricity (e-deviation)</span>
                              <span className="font-mono text-rose-400">{spheroidEccentricity.toFixed(2)}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="0.99"
                              step="0.01"
                              value={spheroidEccentricity}
                              onChange={(e) => setSpheroidEccentricity(parseFloat(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-500"
                            />
                          </div>
                          <p className="text-[8px] text-slate-500 italic font-mono">
                            Prolate/oblate ellipsoid elongation scales effective peak width parameters. At e = 0, symmetric sphere value is utilized.
                          </p>
                        </div>
                      )}

                      {/* Display computations and Apply button */}
                      <div className="bg-rose-500/10 p-2 text-rose-300 rounded-lg border border-rose-500/20 flex items-center justify-between gap-2 font-mono">
                        <div>
                          <span className="block text-[7px] text-slate-500 uppercase font-black">Calculated Shape Factor</span>
                          <span className="text-xs font-black text-rose-400 tracking-wider">K = {calculatedK.toFixed(3)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConstantK(calculatedK);
                            setSelectedKType(`Estimated (${calculatedK.toFixed(3)})`);
                            setIsKEstimatorOpen(false);
                          }}
                          className="py-1 px-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black uppercase text-[8px] rounded transition-transform active:scale-95 cursor-pointer"
                        >
                          Apply K
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
              <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em] flex justify-between items-center">
                <span>Instrumental Broadening</span>
                <span className="text-[8px] text-amber-500 font-mono">MODEL DECOUPLING</span>
              </label>

              {/* Toggle Mode */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(['constant', 'caglioti'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setInstrumentalMode(mode)}
                    className={`py-1.5 px-2 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all
                      ${instrumentalMode === mode 
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' 
                        : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'
                      }
                    `}
                  >
                    {mode === 'constant' ? 'Constant FWHM' : 'Caglioti Curve'}
                  </button>
                ))}
              </div>

              {instrumentalMode === 'constant' ? (
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Constant FWHM (deg)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    min="0"
                    value={instFwhm}
                    onChange={(e) => setInstFwhm(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 bg-[#0A101C] text-amber-300 border border-white/10 focus:border-amber-500/50 rounded-lg focus:ring-1 focus:ring-amber-500/20 outline-none font-mono text-sm transition-all"
                  />
                  <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider leading-relaxed mt-1">
                    Flat instrumental contribution across all 2θ angles.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Presets */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Instrument Presets
                    </label>
                    <select
                      onChange={(e) => {
                        const pr = CAGLIOTI_PRESETS[parseInt(e.target.value)];
                        if (pr) {
                          setCagliotiU(pr.u);
                          setCagliotiV(pr.v);
                          setCagliotiW(pr.w);
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#0A101C] text-amber-400 border border-white/10 rounded-lg text-xs outline-none focus:border-amber-500/50 transition-all font-mono"
                      defaultValue=""
                    >
                      <option value="" disabled>-- Select Instrument Preset --</option>
                      {CAGLIOTI_PRESETS.map((preset, index) => (
                        <option key={preset.name} value={index}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* U, V, W inputs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 text-center mb-1 font-mono">U</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={cagliotiU}
                        onChange={(e) => setCagliotiU(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 bg-[#0A101C] text-amber-300 border border-white/5 rounded-lg text-center font-mono text-xs focus:border-amber-500/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 text-center mb-1 font-mono">V</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={cagliotiV}
                        onChange={(e) => setCagliotiV(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 bg-[#0A101C] text-amber-300 border border-white/5 rounded-lg text-center font-mono text-xs focus:border-amber-500/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-500 text-center mb-1 font-mono">W</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={cagliotiW}
                        onChange={(e) => setCagliotiW(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-2 bg-[#0A101C] text-amber-300 border border-white/5 rounded-lg text-center font-mono text-xs focus:border-amber-500/50 outline-none"
                      />
                    </div>
                  </div>
                  <div className="bg-[#0A101C] p-2.5 rounded-lg border border-white/5 text-[8px] font-mono text-slate-400 space-y-1">
                    <p className="font-bold text-amber-500 uppercase mb-1">Caglioti Equation Mode:</p>
                    <p className="italic">FWHM² = U·tan²θ + V·tanθ + W</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">
                  Broadening Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                   {(['Gaussian', 'Lorentzian'] as const).map(model => (
                     <button
                       key={model}
                       onClick={() => setBroadeningModel(model)}
                       className={`py-2 px-1 rounded-lg border text-[9px] font-black uppercase tracking-tight transition-all
                         ${broadeningModel === model ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-black' : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'}
                       `}
                     >
                       {model}
                     </button>
                   ))}
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-2 mb-4 leading-relaxed">
                   {broadeningModel === 'Gaussian' ? 'Quadratic (β²): Used when instrument/strain profiles are Gaussian.' : 'Linear (β): Used when broadening is dominantly Cauchy/Lorentzian.'}
                </p>

                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em]">
                  Strain Regression Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                   {(['UDM', 'USDM', 'UDEDM', 'Stephens'] as const).map(model => (
                     <button
                       key={model}
                       onClick={() => setStrainModel(model)}
                       className={`py-2 px-1 rounded-lg border text-[9px] font-black uppercase tracking-tight transition-all
                         ${strainModel === model ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-black' : 'bg-black/20 border-white/5 text-slate-600 hover:text-slate-400'}
                       `}
                     >
                       {model === 'UDM' && 'Uniform UDM'}
                       {model === 'USDM' && 'Stress USDM'}
                       {model === 'UDEDM' && 'Energy UDEDM'}
                       {model === 'Stephens' && 'Stephens'}
                     </button>
                   ))}
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                   {strainModel === 'UDM' && 'Isotropic Uniform Deformation Model. Assumes equal microstrain in all directions.'}
                   {strainModel === 'USDM' && 'Anisotropic Uniform Stress Deformation Model. Assumes uniform stress (σ = ε_hkl * E_hkl).'}
                   {strainModel === 'UDEDM' && 'Anisotropic Uniform Deformation Energy Density Model (u = 0.5 * ε_hkl² * E_hkl).'}
                   {strainModel === 'Stephens' && 'Anisotropic phenomenological S_hkl strain model (requires hkl inputs).'}
                </p>
              </div>
            </div>

            {/* Young's Modulus & Stress Card */}
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-purple-400" />
                  <span>Elastic Stress Coupling</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsModulusEnabled(!isModulusEnabled)}
                  className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded border transition-colors
                    ${isModulusEnabled 
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                      : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-400'
                    }
                  `}
                >
                  {isModulusEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {isModulusEnabled ? (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Material System Presets
                    </label>
                    <select
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setYoungsModulusGPa(val);
                      }}
                      className="w-full px-3 py-2 bg-[#0A101C] text-purple-400 border border-white/10 rounded-lg text-xs outline-none focus:border-purple-500/50 transition-all font-mono"
                      defaultValue={youngsModulusGPa.toString()}
                    >
                      {MODULUS_PRESETS.map((p) => (
                        <option key={p.name} value={p.value}>
                          {p.name} ({p.value} GPa)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        Young's Modulus (E)
                      </label>
                      <span className="text-xs font-mono font-black text-purple-300">{youngsModulusGPa} GPa</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="600"
                      step="1"
                      value={youngsModulusGPa}
                      onChange={(e) => setYoungsModulusGPa(parseInt(e.target.value) || 130)}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <p className="text-[8px] text-slate-500 uppercase font-black tracking-wider mt-1">
                      Translates mechanical microstrain into physical internal lattice stresses (MPa) & stress energy density (kJ/m³).
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[9px] font-mono text-slate-600 leading-relaxed">
                  Enable dynamic Young's modulus coupling to resolve structural lattice stresses and volumetric deformation energy.
                </p>
              )}
            </div>

            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 relative overflow-hidden group/data hover:border-emerald-500/30 transition-colors">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Binary className="w-3.5 h-3.5" />
                  Peak Data Input
                </label>
                <div className="flex gap-2">
                  <div className="flex justify-between text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <span>2θ, FWHM</span>
                  </div>
                  <button 
                    onClick={handleClear}
                    className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/30"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 gap-2 mb-4">
                {WH_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setInputData(p.data);
                      setWavelength(p.wavelength);
                      setConstantK(p.k);
                      const kMatch = K_FACTORS.find(kf => kf.value === p.k);
                      if (kMatch) setSelectedKType(kMatch.label);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0A101C] border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group/btn"
                  >
                    <span className="text-lg bg-black/50 w-8 h-8 flex items-center justify-center rounded-lg border border-white/5 group-hover/btn:border-emerald-500/30 shrink-0">
                      {p.icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover/btn:text-emerald-400 transition-colors truncate">{p.name}</span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase truncate">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative font-mono text-xs">
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-[#0A101C] text-emerald-300 border border-white/10 focus:border-emerald-500/50 rounded-lg focus:ring-1 focus:ring-emerald-500/20 outline-none custom-scrollbar transition-all leading-relaxed placeholder:text-slate-700"
                  placeholder="2θ(°), FWHM(°), h, k, l&#10;28.44, 0.25, 4, 0, 0&#10;47.30, 0.28, 2, 2, 0"
                  spellCheck="false"
                />
              </div>
              <div className="mt-3 flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5 flex-col">
                <span className="leading-tight uppercase tracking-widest font-mono text-emerald-500/80">
                   <span className="text-emerald-500 mr-1">&gt;</span> Format: 2Theta, FWHM, [H, K, L]
                </span>
                <span className="leading-tight uppercase tracking-widest font-mono text-emerald-500/80">
                   <span className="text-emerald-500 mr-1">&gt;</span> Enter at least 3 peaks for reliable regression. Stephens model requires H, K, L inputs.
                </span>
              </div>
            </div>

            {!isSimulationRunning ? (
              <button
                onClick={handleCalculate}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-rose-500 hover:from-cyan-400 hover:to-rose-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center justify-center gap-3 group relative overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Generate W-H Plot
              </button>
            ) : (
              <div className="bg-[#070D18] p-5 rounded-2xl border border-cyan-500/30 overflow-hidden relative shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /> Williamson-Hall Analysis Running
                </h4>
                <div className="space-y-3 relative z-10 w-full flex flex-col">
                  {[
                    { step: 1, label: 'Parsing Profile Angles', icon: Database },
                    { step: 2, label: instrumentalMode === 'constant' ? 'Applying Constant β_inst' : 'Computing Caglioti IRF', icon: FlaskConical },
                    { step: 3, label: !isModulusEnabled ? 'Isotropic UDM Deconvolution' : 'Anisotropic USDM Computation', icon: Activity },
                    { step: 4, label: 'Computing W-H Regression', icon: Layers },
                    { step: 5, label: 'Extracting Size/Strain', icon: CheckCircle }
                  ].map((s) => {
                     const Icon = s.icon;
                     const isActive = simulationStep === s.step;
                     const isDone = simulationStep > s.step;
                     return (
                       <div key={s.step} className={`flex items-center gap-3 w-full transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : isDone ? 'opacity-50' : 'opacity-20'}`}>
                         <div className={`p-1.5 rounded-lg border flex-shrink-0 ${isActive ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : isDone ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                           <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse' : ''}`} />
                         </div>
                         <div className="flex-1 flex flex-col">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-cyan-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'}`}>
                             {s.label}
                           </span>
                           {isActive && <div className="h-0.5 bg-gradient-to-r from-cyan-500 to-transparent w-full mt-1.5 animate-pulse rounded-full" />}
                         </div>
                       </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-[#070D18] rounded-xl border border-cyan-500/30">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Scientific Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">UDM Model Analysis</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Equation</span>
              </div>
              <div className="bg-[#0A101C] p-4 rounded-xl text-cyan-400 overflow-x-auto border border-white/5 text-center">
                <div className="inline-flex items-center gap-3 w-full justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse flex-shrink-0" />
                  <div 
                    className="max-w-full overflow-x-auto text-center font-sans py-1"
                    dangerouslySetInnerHTML={{ __html: katex.renderToString('\\beta \\cdot \\cos(\\theta) = 4 \\cdot \\varepsilon \\cdot \\sin(\\theta) + \\frac{K \\cdot \\lambda}{D}', { throwOnError: false, displayMode: true }) }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slope (ε) Significance</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono border-l-2 border-purple-500/30 pl-3">
                The gradient represents the lattice microstrain. Steeper slopes indicate higher internal stress within the crystallites.
              </p>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intercept (Kλ/D) Analysis</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-mono border-l-2 border-rose-500/30 pl-3">
                The Y-intercept provides the size contribution. By decoupling strain (slope), this provides a more accurate grain size than single-peak Scherrer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-8 space-y-6">
        {result && (
          <ScientificMathControl
            title="Williamson-Hall Standard UDM Mathematical Verification"
            formula="\beta \cos(\theta) = \frac{K \lambda}{D} + 4 \varepsilon \sin(\theta)"
            description="Uniform Deformation Model (UDM) regression verification. Checking the intercept (Size) and slope (Microstrain) calculation."
            variables={[
              { symbol: 'Slope (4ε)', name: 'Regression Slope', value: result.regression.slope, unit: '' },
              { symbol: 'Intercept', name: 'Y-Intercept', value: result.regression.intercept, unit: 'Å⁻¹' },
              { symbol: 'K', name: 'Shape Factor', value: calculatedK, unit: '' },
              { symbol: 'λ', name: 'Wavelength', value: calculatedWavelength, unit: 'Å' }
            ]}
            result={result.sizeInterceptNm}
            resultUnit="nm"
            resultName="Extrapolated Crystallite Size (D)"
          />
        )}
        {/* Results Summary */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${isModulusEnabled ? 'lg:grid-cols-5' : 'lg:grid-cols-3'} gap-4`}>
           <div className="bg-[#050B14]/90 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/10 hover:border-cyan-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(34,211,238,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] transition-all duration-700 pointer-events-none group-hover:bg-cyan-500/20 translate-x-10 -translate-y-10" />
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[30px] transition-all duration-700 pointer-events-none group-hover:bg-blue-500/20 -translate-x-10 translate-y-10" />
             
             <div>
               <div className="flex items-center gap-3 mb-4 relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[inset_0_2px_10px_rgba(34,211,238,0.2)]">
                   <TrendingUp className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                 </div>
                 <p className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.3em]">Microstrain (ε)</p>
               </div>
               
               <div className="flex flex-col mt-2 relative z-10">
                 <div className="flex items-baseline gap-2">
                   <p className="text-3xl sm:text-4xl font-black text-white group-hover:text-cyan-50 transition-colors drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] font-mono tracking-tight tracking-tighter">
                     {result ? (result.strainPercent / 100).toExponential(2).split('e')[0] : '-'}
                   </p>
                   {result && (
                     <span className="text-sm font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                       × 10<sup className="text-[10px]">{result.strainPercent === 0 ? '0' : (result.strainPercent / 100).toExponential(2).split('e')[1].replace('+', '')}</sup>
                     </span>
                   )}
                 </div>
                 {result && (
                   <div className="inline-flex items-center gap-2 mt-3 bg-[#0A1526]/60 border border-cyan-500/30 px-3 py-1.5 rounded-xl shadow-inner backdrop-blur-md">
                     <div className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span></div>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/80">Real Value:</span>
                     <span className="text-[10px] font-mono font-bold text-cyan-300">{(result.strainPercent / 100).toExponential(8)}</span>
                   </div>
                 )}
                 
                 {result && (
                   <div className="flex items-center gap-2 mt-3">
                     <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                     <p className="text-xs text-slate-400 font-mono font-medium">
                       <span className="text-slate-500 mr-1">Percentage:</span>
                       <span className="text-cyan-200/70">{result.strainPercent.toFixed(4)}%</span>
                     </p>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-6 relative z-10 w-full pt-4 border-t border-white/5">
                <span className="text-[9px] font-black text-cyan-500 bg-cyan-500/5 px-2 py-1.5 rounded-lg border border-cyan-500/10 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Strain Gradient
                </span>
             </div>
           </div>
           
           <div className="bg-[#0A101C]/90 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700 translate-x-10 -translate-y-10" />
             
             <div>
               <div className="flex items-center gap-3 mb-4 relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[inset_0_2px_10px_rgba(16,185,129,0.2)]">
                   <Ruler className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                 </div>
                 <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.3em]">Crystallite Size</p>
               </div>
               
               <div className="relative z-10 mt-2">
                 {result ? (
                   result.sizeInterceptNm > 0 && result.sizeInterceptNm < 1000 ? (
                     <div className="flex flex-col">
                       <div className="flex items-baseline gap-2">
                         <p className="text-3xl sm:text-4xl font-black text-white group-hover:text-emerald-50 transition-colors drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] font-mono tracking-tighter">
                           {result.sizeInterceptNm.toFixed(1)}
                         </p>
                         <span className="text-sm font-black text-emerald-500/80 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">nm</span>
                       </div>
                       <div className="inline-flex items-center gap-2 mt-3 bg-[#0A1526]/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-inner backdrop-blur-md">
                         <div className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></div>
                         <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/80">Real Value:</span>
                         <span className="text-[10px] font-mono font-bold text-emerald-300">{result.sizeInterceptNm.toFixed(6)} nm</span>
                       </div>
                       <div className="flex items-center gap-2 mt-3">
                         <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                         <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                           Decoupled Size
                         </p>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col justify-center h-[70px] bg-amber-500/5 rounded-2xl border border-amber-500/10 px-4 py-2">
                       <div className="flex items-baseline gap-2">
                         <p className="text-2xl font-black text-amber-400 tracking-tight font-mono">
                           &gt; 250 <span className="text-sm text-amber-500/80 uppercase">nm</span>
                         </p>
                         <span className="text-[10px] font-bold text-amber-500/70 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                           (∞)
                         </span>
                       </div>
                       <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mt-1">
                         Beyond typical XRD resolution limit
                       </p>
                     </div>
                   )
                 ) : (
                   <p className="text-3xl font-black text-white font-mono opacity-50">- <span className="text-sm uppercase tracking-widest text-slate-600">nm</span></p>
                 )}
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-6 relative z-10 w-full pt-4 border-t border-white/5">
               <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-1.5 rounded-lg border border-emerald-500/10 uppercase tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Y-Intercept Derived
               </span>
             </div>
           </div>

           <div className="bg-[#050B14]/90 backdrop-blur-xl p-6 rounded-3xl border border-purple-500/10 hover:border-purple-500/30 shadow-inner hover:shadow-[0_10px_40px_rgba(168,85,247,0.1)] relative overflow-hidden group flex flex-col justify-between transition-all duration-500">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700 translate-x-10 -translate-y-10" />
             
             <div>
               <div className="flex items-center gap-3 mb-4 relative z-10">
                 <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[inset_0_2px_10px_rgba(168,85,247,0.2)]">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                 </div>
                 <p className="text-[10px] font-black text-purple-400/80 uppercase tracking-[0.3em]">Fit Quality (R²)</p>
               </div>
               
               <div className="flex flex-col mt-2 relative z-10">
                 <div className="flex items-baseline gap-2">
                   <p className="text-3xl sm:text-4xl font-black text-white group-hover:text-purple-50 transition-colors drop-shadow-[0_0_20px_rgba(168,85,247,0.3)] font-mono tracking-tight tracking-tighter">
                     {result ? result.regression.rSquared.toFixed(4) : '-'}
                   </p>
                 </div>
                 
                 {result && (
                   <div className="flex items-center gap-2 mt-3">
                     <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
                     <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                       {result.regression.rSquared > 0.9 ? 'Strong correlation' : 'Weak correlation'}
                     </p>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="flex items-center justify-between mt-6 relative z-10 w-full pt-4 border-t border-white/5">
                <span className={`text-[9px] font-black ${result && result.regression.rSquared > 0.9 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'} px-2 py-1.5 rounded-lg border uppercase tracking-widest flex items-center gap-1.5 transition-colors`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${result && result.regression.rSquared > 0.9 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  Regression Analysis
                </span>
             </div>
           </div>

           {result?.stephensParams && (
             <div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between col-span-2">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Layers className="w-16 h-16 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Stephens Anisotropic Tensor (Cubic)</p>
                  <div className="flex items-baseline gap-6 mt-2 relative z-10">
                    <p className="text-xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      S₄₀₀: {result.stephensParams.S400.toExponential(2)}
                    </p>
                    <p className="text-xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                      S₂₂₀: {result.stephensParams.S220.toExponential(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 relative z-10 self-start">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  Phenomenological Parameters
                </div>
             </div>
           )}

           {isModulusEnabled && (
             <>
               <div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group hover:border-rose-500/40 transition-all flex flex-col justify-between animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Atom className="w-16 h-16 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Lattice Stress</p>
                    <p className="text-2xl font-black text-white mt-2 flex items-baseline gap-1 font-mono drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] relative z-10">
                      {result?.stressMPa !== undefined ? result.stressMPa.toFixed(1) : '-'} <span className="text-xs font-black text-rose-400 tracking-widest uppercase">MPA</span>
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] text-rose-400 font-black uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 relative z-10 self-start">
                    <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                    Internal Stress (σ)
                  </div>
               </div>

               <div className="bg-[#0A101C]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)] relative overflow-hidden group hover:border-blue-500/40 transition-all flex flex-col justify-between animate-in fade-in slide-in-from-right-8 duration-300">
                  <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Binary className="w-16 h-16 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Strain Energy</p>
                    <p className="text-2xl font-black text-white mt-2 flex items-baseline gap-1 font-mono drop-shadow-[0_0_15px_rgba(59,130,246,0.4)] relative z-10">
                      {result?.energyDensityKjM3 !== undefined ? result.energyDensityKjM3.toFixed(2) : '-'} <span className="text-xs font-black text-blue-400 tracking-widest uppercase">KJ/M³</span>
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] text-blue-400 font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 relative z-10 self-start">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    Volumetric Energy (u)
                  </div>
               </div>
             </>
           )}
        </div>

        {/* Warnings */}
        {result && result.sizeInterceptNm === 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest">Negative or Zero Intercept Detected</h4>
              <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                The y-intercept is non-positive, which implies an infinite or unphysical crystallite size. This often happens when:
              </p>
              <ul className="list-none pl-0 mt-3 space-y-2 text-xs text-slate-300 font-bold uppercase tracking-widest">
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&gt;</span> Instrumental broadening is overestimated.</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&gt;</span> The sample has very large grains ({'>'}200nm).</li>
                <li className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">&gt;</span> Strain is the dominant factor and data is noisy.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_40px_rgba(34,211,238,0.05)] border border-white/10 min-h-[600px] xl:min-h-[700px] h-[70vh] xl:h-[80vh] flex flex-col relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
          <div className="flex justify-between items-center mb-6 relative z-10 px-2">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Williamson-Hall Plot</h3>
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <div className="text-[10px] font-mono font-black border px-3 py-1.5 rounded-lg text-cyan-400 bg-[#070D18] border-white/5 shadow-inner">
                  y = {result.regression.slope.toFixed(5)}x {result.regression.intercept >= 0 ? '+' : '-'} {Math.abs(result.regression.intercept).toFixed(5)}
                </div>
              )}
              {result && result.points.length >= 2 && (
                <button
                  onClick={handleDownloadCSV}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-cyan-400 bg-[#070D18] hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-all flex items-center gap-2"
                >
                  <Download className="w-3 h-3" /> Export CSV
                </button>
              )}
            </div>
          </div>
          
          {!result || result.points.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 m-2 rounded-2xl bg-[#070D18] relative z-10 overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
              <TrendingUp className="w-12 h-12 mb-4 opacity-20 text-cyan-500" />
              <p className="font-black uppercase tracking-widest text-slate-400 mb-2">Insufficient data</p>
              <p className="text-xs font-mono text-slate-600">Enter at least 2 valid peaks to generate the regression.</p>
            </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 bg-[#070D18] border border-white/5 rounded-2xl p-4 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 30, right: 40, left: 50, bottom: 55 }}>
                  <defs>
                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="x" 
                    type="number" 
                    domain={['auto', 'auto']}
                    label={{ 
                      value: strainModel === 'USDM' 
                        ? '4 sin(θ) / E_hkl (GPa⁻¹)' 
                        : strainModel === 'UDEDM' 
                        ? '4 sin(θ) / √E_hkl (GPa⁻⁰·⁵)' 
                        : '4 sin(θ)', 
                      position: 'bottom', 
                      offset: 35, 
                      fill: '#94a3b8', 
                      fontSize: 10, 
                      fontWeight: 900, 
                      fontFamily: 'monospace' 
                    }}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <YAxis 
                    label={{ value: 'β cos(θ) [rad]', angle: -90, position: 'insideLeft', offset: -30, fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  <Area
                    type="monotone"
                    dataKey="fitRange"
                    stroke="none"
                    fill="#22d3ee"
                    fillOpacity={0.1}
                    name="95% Confidence Band"
                  />
                  <Scatter name="Observed Data" dataKey="y" fill="#22d3ee" shape="circle" r={5} style={{ filter: 'url(#neonGlow)' }} />
                  <Line 
                    type="monotone" 
                    dataKey="fit" 
                    stroke="#f43f5e" 
                    strokeWidth={2} 
                    dot={false} 
                    name={
                      strainModel === 'USDM' 
                        ? 'USDM Stress Fit' 
                        : strainModel === 'UDEDM' 
                        ? 'UDEDM Energy Fit' 
                        : strainModel === 'Stephens' 
                        ? 'Stephens Fit' 
                        : 'UDM Linear Fit'
                    }
                    activeDot={false}
                    strokeDasharray="5 5"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Peak-by-Peak Analysis Table */}
        {result && result.pointsExtended && result.pointsExtended.length > 0 && (
          <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:border-[#22d3ee]/30 transition-all font-mono">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-800 rounded-lg text-[#22d3ee]">
                <Binary className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Extended Peak-by-Peak Analysis</h3>
                <p className="text-[9px] text-slate-500 uppercase mt-0.5 font-bold">deconstructed physical parameters per Bragg contribution</p>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-white/5 scrollbar-thin">
              <table className="w-full text-[10px] text-left border-collapse bg-black/20">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[8px] uppercase tracking-wider bg-black/40 font-black">
                    <th className="py-2.5 px-3">2θ (°)</th>
                    <th className="py-2.5 px-2">FWHM_obs (°)</th>
                    <th className="py-2.5 px-2">FWHM_inst (°)</th>
                    <th className="py-2.5 px-2">β_sample (°)</th>
                    <th className="py-2.5 px-2">X (4sinθ)</th>
                    <th className="py-2.5 px-2">Y (βcosθ rad)</th>
                    <th className="py-2.5 px-3 text-right">Size Estimate (nm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.pointsExtended.map((p, idx) => (
                    <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                      <td className="py-2 px-3 text-cyan-400 font-bold">{p.twoTheta.toFixed(3)}°</td>
                      <td className="py-2 px-2 text-slate-400">{p.fwhmObs.toFixed(3)}°</td>
                      <td className="py-2 px-2 text-amber-500 font-bold">{p.fwhmInst.toFixed(3)}°</td>
                      <td className="py-2 px-2 text-emerald-400">{p.betaCorrectedDeg.toFixed(3)}°</td>
                      <td className="py-2 px-2 text-slate-400">{p.x.toFixed(4)}</td>
                      <td className="py-2 px-2 text-slate-400">{p.y.toFixed(5)}</td>
                      <td className="py-2 px-3 text-right font-black text-emerald-400">{p.singlePeakSizeNm > 0 ? `${p.singlePeakSizeNm.toFixed(2)} nm` : '∞'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[8px] text-slate-500 mt-2.5 leading-relaxed italic uppercase font-bold tracking-widest text-center">
              * The Size Estimate column shows the uncoupled grain size per peak (assuming zero strain). W-H decouples strain from size to find a true average size.
            </p>
          </div>
        )}

        {/* JSON Output Section */}
        {result && (
          <div className="bg-[#0A101C] rounded-xl p-4 border border-white/5 overflow-hidden relative group/json shadow-inner">
             <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Output JSON</span>
               <button onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))} className="text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors bg-white/5 hover:bg-cyan-500/10 px-2 py-1 rounded border border-white/10 hover:border-cyan-500/30">Copy</button>
             </div>
             <pre className="text-[9px] font-mono text-slate-400 overflow-x-auto max-h-32 custom-scrollbar opacity-70 group-hover/json:opacity-100 transition-opacity">
               {JSON.stringify({
                 module: "Williamson-Hall-UDM",
                 method: "Uniform Deformation Model (Linear Regression)",
                 parameters: {
                    wavelength_angstrom: wavelength,
                    shape_factor_K: constantK,
                    instrumental_broadening_mode: instrumentalMode,
                    instrumental_broadening: instrumentalMode === 'constant' ? instFwhm : { U: cagliotiU, V: cagliotiV, W: cagliotiW },
                    youngs_modulus_gpa: isModulusEnabled ? youngsModulusGPa : undefined
                 },
                 results: {
                   strain_percent: result.strainPercent,
                   size_nm: result.sizeInterceptNm,
                   fit_r_squared: result.regression.rSquared,
                   stress_mpa: result.stressMPa,
                   energy_density_kj_m3: result.energyDensityKjM3
                 }
               }, null, 2)}
             </pre>
          </div>
        )}
      </div>
    </div>
  );
};
