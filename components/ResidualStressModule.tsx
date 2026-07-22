import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Calculator,
  Info,
  LineChart,
  Plus,
  Trash2,
  Zap,
  TrendingDown,
  TrendingUp,
  Settings,
  Scale,
  Sparkles,
  Sliders,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Gauge,
  Box,
  ChevronRight
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ComposedChart,
  Area
} from 'recharts';

interface DataPoint {
  id: string;
  psi: number; // Tilt angle in degrees
  twoTheta: number; // Measured 2Theta
}

interface MaterialPreset {
  name: string;
  plane: string;
  E: number; // GPa
  nu: number;
  twoTheta0: number; // deg
  wavelength: number;
  description: string;
  defaultData: { psi: number; twoTheta: number }[];
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    name: 'Ferritic Steel (Fe-α)',
    plane: '(211)',
    E: 211,
    nu: 0.28,
    twoTheta0: 156.40,
    wavelength: 1.54056, // Cu K-alpha
    description: 'High 2-theta reflection ideal for stress measurement in structural steel',
    defaultData: [
      { psi: 0, twoTheta: 156.40 },
      { psi: 15, twoTheta: 156.52 },
      { psi: 30, twoTheta: 156.78 },
      { psi: 45, twoTheta: 157.15 },
      { psi: 60, twoTheta: 157.60 },
    ]
  },
  {
    name: 'Aluminum Alloy (Al 7075-T6)',
    plane: '(311)',
    E: 71,
    nu: 0.33,
    twoTheta0: 139.30,
    wavelength: 1.54056,
    description: 'Aerospace grade aluminum subjected to compressive shot peening',
    defaultData: [
      { psi: 0, twoTheta: 139.30 },
      { psi: 15, twoTheta: 139.18 },
      { psi: 30, twoTheta: 138.92 },
      { psi: 45, twoTheta: 138.50 },
      { psi: 60, twoTheta: 138.00 },
    ]
  },
  {
    name: 'Titanium Alloy (Ti-6Al-4V)',
    plane: '(213)',
    E: 114,
    nu: 0.34,
    twoTheta0: 142.10,
    wavelength: 1.54056,
    description: 'Biomedical and turbine blade material under tensile thermal stress',
    defaultData: [
      { psi: 0, twoTheta: 142.10 },
      { psi: 15, twoTheta: 142.25 },
      { psi: 30, twoTheta: 142.55 },
      { psi: 45, twoTheta: 142.98 },
      { psi: 60, twoTheta: 143.50 },
    ]
  },
  {
    name: 'Inconel 718 Superalloy',
    plane: '(311)',
    E: 205,
    nu: 0.29,
    twoTheta0: 141.20,
    wavelength: 1.54056,
    description: 'Nickel-base superalloy after laser powder bed fusion (LPBF)',
    defaultData: [
      { psi: 0, twoTheta: 141.20 },
      { psi: 18, twoTheta: 141.38 },
      { psi: 30, twoTheta: 141.65 },
      { psi: 45, twoTheta: 142.10 },
      { psi: 60, twoTheta: 142.68 },
    ]
  }
];

// Reusable animated number component
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 1, className = '' }: { value: number, prefix?: string, suffix?: string, decimals?: number, className?: string }) => {
  return (
    <motion.span 
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
      className={className}
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </motion.span>
  );
};

export const ResidualStressModule: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => 
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  
  // Material Elastic Properties
  const [youngsModulus, setYoungsModulus] = useState<number>(211); // E in GPa
  const [poissonsRatio, setPoissonsRatio] = useState<number>(0.28); // nu
  const [wavelength, setWavelength] = useState<number>(1.54056); // Cu K-alpha
  const [viewMode, setViewMode] = useState<'dSpacing' | 'microstrain'>('dSpacing');
  const [showUnstressedLine, setShowUnstressedLine] = useState<boolean>(true);
  
  // Unstressed parameters
  const [unstressedTwoTheta, setUnstressedTwoTheta] = useState<number>(156.40);
  
  // Data points (Psi and 2Theta)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { id: 'p1', psi: 0, twoTheta: 156.40 },
    { id: 'p2', psi: 15, twoTheta: 156.52 },
    { id: 'p3', psi: 30, twoTheta: 156.78 },
    { id: 'p4', psi: 45, twoTheta: 157.15 },
    { id: 'p5', psi: 60, twoTheta: 157.60 },
  ]);

  const loadPreset = (preset: MaterialPreset) => {
    setYoungsModulus(preset.E);
    setPoissonsRatio(preset.nu);
    setWavelength(preset.wavelength);
    setUnstressedTwoTheta(preset.twoTheta0);
    setDataPoints(preset.defaultData.map((d, idx) => ({
      id: 'p' + idx + '_' + Date.now(),
      psi: d.psi,
      twoTheta: d.twoTheta
    })));
  };

  // Derived state
  const analysisResult = useMemo(() => {
    if (dataPoints.length < 2) return null;
    
    // Convert 2Theta to d-spacing
    const dSpacings = dataPoints.map(p => {
      const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
      const d = wavelength / (2 * Math.sin(thetaRad));
      const psiRad = p.psi * (Math.PI / 180);
      const sin2psi = Math.sin(psiRad) ** 2;
      return { ...p, d, sin2psi };
    });
    
    // Sort by sin2psi
    const sortedDSpacings = [...dSpacings].sort((a, b) => a.sin2psi - b.sin2psi);
    
    // Unstressed d-spacing
    const theta0Rad = (unstressedTwoTheta / 2) * (Math.PI / 180);
    const d0 = wavelength / (2 * Math.sin(theta0Rad));
    
    // Calculate strains: epsilon = (d - d0) / d0
    const pointsWithStrain = sortedDSpacings.map(p => {
      const strain = (p.d - d0) / d0;
      return { ...p, strain };
    });
    
    // Linear regression for d vs sin^2(psi)
    const n = pointsWithStrain.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    pointsWithStrain.forEach(p => {
      sumX += p.sin2psi;
      sumY += p.d;
      sumXY += p.sin2psi * p.d;
      sumXX += p.sin2psi * p.sin2psi;
    });
    
    // Protect against zero division if all x are the same
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    
    // R-squared calculation
    const meanY = sumY / n;
    let ssTot = 0, ssRes = 0;
    pointsWithStrain.forEach(p => {
      ssTot += (p.d - meanY) ** 2;
      const predictedY = slope * p.sin2psi + intercept;
      ssRes += (p.d - predictedY) ** 2;
    });
    const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));
    
    // Stress calculation
    // slope (m) = d0 * ( (1 + nu) / E ) * sigma
    // sigma = m * E / ( d0 * (1 + nu) )
    const E_MPa = youngsModulus * 1000;
    const stress_MPa = (slope * E_MPa) / (d0 * (1 + poissonsRatio));
    
    // Prepare chart data
    const chartData = pointsWithStrain.map(p => {
      const fittedD = slope * p.sin2psi + intercept;
      const fittedMicrostrain = ((fittedD - d0) / d0) * 1e6;
      const measuredMicrostrain = ((p.d - d0) / d0) * 1e6;
      return {
        name: `${p.psi}°`,
        psi: p.psi,
        sin2psi: p.sin2psi,
        dSpacing: p.d,
        fittedD: fittedD,
        microstrain: measuredMicrostrain,
        fittedMicrostrain: fittedMicrostrain
      };
    });

    return {
      d0,
      slope,
      intercept,
      rSquared,
      stress_MPa,
      stressType: stress_MPa > 0 ? 'Tensile' : 'Compressive',
      chartData
    };
  }, [dataPoints, youngsModulus, poissonsRatio, wavelength, unstressedTwoTheta]);

  const addPoint = () => {
    const last = dataPoints[dataPoints.length - 1];
    const newPsi = last ? Math.min(90, last.psi + 10) : 0;
    setDataPoints([...dataPoints, { 
      id: 'p' + Date.now(), 
      psi: newPsi, 
      twoTheta: last ? last.twoTheta : unstressedTwoTheta 
    }]);
  };

  const removePoint = (id: string) => {
    setDataPoints(dataPoints.filter(p => p.id !== id));
  };

  const updatePoint = (id: string, field: keyof DataPoint, value: number) => {
    setDataPoints(dataPoints.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // Render Lattice Diagram based on stress
  const renderLatticeBox = () => {
    if (!analysisResult) return null;
    const isTensile = analysisResult.stress_MPa > 0;
    const maxStress = 1500; // Arbitrary max for scaling
    const intensity = Math.min(Math.abs(analysisResult.stress_MPa) / maxStress, 1);
    
    const scaleX = isTensile ? 1 + (0.3 * intensity) : 1 - (0.3 * intensity);
    const scaleY = isTensile ? 1 - (0.1 * intensity) : 1 + (0.1 * intensity); // Poisson effect
    
    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        <motion.div 
          animate={{ scaleX, scaleY }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className={`w-16 h-16 border-[3px] flex items-center justify-center rounded-sm ${
            isTensile ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-current opacity-50" />
        </motion.div>
        
        {/* Arrows */}
        <motion.div 
          animate={{ x: isTensile ? 30 * intensity : -15 * intensity, opacity: intensity > 0.05 ? 1 : 0 }}
          className={`absolute left-[50%] ml-10 text-2xl font-black ${isTensile ? 'text-rose-500' : 'text-blue-500'}`}
        >
          {isTensile ? '→' : '←'}
        </motion.div>
        <motion.div 
          animate={{ x: isTensile ? -30 * intensity : 15 * intensity, opacity: intensity > 0.05 ? 1 : 0 }}
          className={`absolute right-[50%] mr-10 text-2xl font-black ${isTensile ? 'text-rose-500' : 'text-blue-500'}`}
        >
          {isTensile ? '←' : '→'}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none mix-blend-screen">
          <Activity className="w-64 h-64 text-indigo-400" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              Advanced Materials Analysis
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Residual Stress
            </h2>
            <p className="text-indigo-200/80 text-sm md:text-base font-medium leading-relaxed">
              Determine macroscopic residual stresses (tensile or compressive) in industrial components, thin films, and welded joints by measuring lattice strain via the precise <span className="text-white font-bold">sin²ψ method</span>.
            </p>
          </div>
          
          {/* Quick Presets Menu */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 w-full md:w-auto">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Material Presets
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {MATERIAL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(preset)}
                  className="px-3 py-2 bg-white/5 hover:bg-indigo-500/30 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-white/5 transition-all text-left flex flex-col gap-0.5 active:scale-95 group"
                >
                  <span className="truncate w-full">{preset.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-indigo-400/70 group-hover:text-indigo-300 font-mono">{preset.plane} plane</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Settings & Data (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Elastic Constants Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2 relative z-10">
              <Scale className="w-5 h-5 text-indigo-500" />
              Elastic & Instrument Parameters
            </h3>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between items-center">
                  <span>Young's Modulus (E)</span>
                  <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg font-mono">{youngsModulus} GPa</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="1"
                  value={youngsModulus}
                  onChange={e => setYoungsModulus(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between items-center">
                  <span>Poisson's Ratio (ν)</span>
                  <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg font-mono">{poissonsRatio.toFixed(3)}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.01"
                  value={poissonsRatio}
                  onChange={e => setPoissonsRatio(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Wavelength λ (Å)
                  </label>
                  <input 
                    type="number"
                    step="0.0001"
                    value={wavelength}
                    onChange={e => setWavelength(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Stress-Free 2θ₀ (°)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    value={unstressedTwoTheta}
                    onChange={e => setUnstressedTwoTheta(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Entry Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Diffraction Data
              </h3>
              <button 
                onClick={addPoint}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-blue-200 dark:border-blue-800/50 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Tilt
              </button>
            </div>
            
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
                  <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[11px] w-1/3">ψ Tilt (deg)</th>
                    <th className="py-3 px-2 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[11px] w-1/2">Peak 2θ (deg)</th>
                    <th className="py-3 px-2 text-center text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[11px] w-1/6">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <AnimatePresence>
                    {dataPoints.map((point) => (
                      <motion.tr 
                        key={point.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            value={point.psi}
                            onChange={(e) => updatePoint(point.id, 'psi', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300 transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="number"
                            step="0.001"
                            value={point.twoTheta}
                            onChange={(e) => updatePoint(point.id, 'twoTheta', Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300 transition-colors"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => removePoint(point.id)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {dataPoints.length === 0 && (
                <div className="py-8 text-center text-sm font-medium text-slate-500 flex flex-col items-center gap-2">
                  <Activity className="w-8 h-8 opacity-20" />
                  No measurement data points.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Results (7 cols) */}
        <div className="xl:col-span-7 space-y-6 flex flex-col">
          
          {/* Top Result Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Stress Card */}
            <div className={`sm:col-span-2 p-6 rounded-3xl border relative overflow-hidden flex flex-col justify-center transition-colors duration-500 ${
              analysisResult 
                ? (analysisResult.stress_MPa > 0 
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                  : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50')
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              {/* Animated Lattice Diagram in Background */}
              <div className="absolute right-8 top-0 bottom-0 w-32 opacity-20 pointer-events-none mix-blend-multiply dark:mix-blend-screen">
                {renderLatticeBox()}
              </div>

              <div className="relative z-10">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  Principal Residual Stress (σ)
                </div>
                <div className="flex items-baseline gap-3">
                  <div className={`text-6xl font-black tracking-tighter ${
                    analysisResult 
                      ? (analysisResult.stress_MPa > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400')
                      : 'text-slate-400'
                  }`}>
                    {analysisResult ? <AnimatedNumber value={Math.abs(analysisResult.stress_MPa)} decimals={1} /> : '---'}
                  </div>
                  <div className={`text-xl font-bold ${
                    analysisResult 
                      ? (analysisResult.stress_MPa > 0 ? 'text-rose-500 dark:text-rose-500' : 'text-blue-500 dark:text-blue-500')
                      : 'text-slate-400'
                  }`}>
                    MPa
                  </div>
                </div>
                
                {analysisResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold border shadow-sm ${
                    analysisResult.stress_MPa > 0
                      ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
                  }`}>
                    {analysisResult.stress_MPa > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {analysisResult.stressType} Strain Detected
                  </motion.div>
                )}
              </div>
            </div>

            {/* Regression Metrics Stack */}
            <div className="flex flex-col gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 relative z-10">
                  Fit Quality (R²)
                </div>
                <div className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tighter relative z-10">
                  {analysisResult ? <AnimatedNumber value={analysisResult.rSquared} decimals={4} /> : '---'}
                </div>
                {analysisResult && analysisResult.rSquared < 0.9 && (
                   <div className="text-[10px] text-amber-500 font-bold mt-1 relative z-10">Suboptimal linear fit</div>
                )}
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 relative z-10">
                  Slope (m)
                </div>
                <div className="text-xl font-black text-slate-700 dark:text-slate-300 font-mono tracking-tighter relative z-10 flex items-baseline">
                  {analysisResult ? <AnimatedNumber value={analysisResult.slope * 1000} decimals={3} /> : '---'}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">×10⁻³ Å</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chart Plot */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative flex flex-col flex-1 min-h-[400px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-indigo-500" />
                Fundamental {viewMode === 'dSpacing' ? 'd-Spacing' : 'Microstrain'} vs sin²ψ Plot
              </h3>

              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setViewMode('dSpacing')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'dSpacing'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  d-Spacing (Å)
                </button>
                <button
                  onClick={() => setViewMode('microstrain')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === 'microstrain'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Microstrain (με)
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              {analysisResult && analysisResult.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={analysisResult.chartData}
                    margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                    <XAxis 
                      dataKey="sin2psi" 
                      type="number"
                      domain={[0, 'auto']}
                      tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#e2e8f0', strokeWidth: 2 }}
                      label={{ value: 'sin²ψ', position: 'bottom', offset: 0, fill: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                      type="number"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                      tickLine={false}
                      tickFormatter={(val) => viewMode === 'dSpacing' ? val.toFixed(4) : Math.round(val).toString()}
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#e2e8f0', strokeWidth: 2 }}
                      label={{ 
                        value: viewMode === 'dSpacing' ? 'Interplanar Spacing d (Å)' : 'Lattice Strain (με)', 
                        angle: -90, 
                        position: 'insideLeft', 
                        offset: -10, 
                        fill: isDarkMode ? '#cbd5e1' : '#475569', 
                        fontSize: 13, 
                        fontWeight: 'bold' 
                      }}
                    />
                    <RechartsTooltip
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(value: number, name: string) => {
                        if (viewMode === 'dSpacing') {
                          if (name === 'dSpacing') return [`${value.toFixed(5)} Å`, 'Measured d'];
                          if (name === 'fittedD') return [`${value.toFixed(5)} Å`, 'Linear Fit'];
                        } else {
                          if (name === 'microstrain') return [`${value.toFixed(1)} με`, 'Measured Strain'];
                          if (name === 'fittedMicrostrain') return [`${value.toFixed(1)} με`, 'Linear Fit Strain'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `sin²ψ = ${Number(label).toFixed(3)}`}
                    />

                    {/* Unstressed reference line d0 */}
                    {showUnstressedLine && (
                      <ReferenceLine 
                        yAxisId="left" 
                        y={viewMode === 'dSpacing' ? analysisResult.d0 : 0} 
                        stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{ 
                          value: viewMode === 'dSpacing' ? `d₀ = ${analysisResult.d0.toFixed(4)} Å` : 'd₀ Reference (0 με)', 
                          fill: isDarkMode ? '#94a3b8' : '#64748b', 
                          fontSize: 12, 
                          position: 'insideTopLeft',
                          fontWeight: 'bold' 
                        }} 
                      />
                    )}

                    {/* Filled area for the strain magnitude visualization */}
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey={viewMode === 'dSpacing' ? 'fittedD' : 'fittedMicrostrain'}
                      baseLine={viewMode === 'dSpacing' ? analysisResult.d0 : 0}
                      fill={analysisResult.stress_MPa > 0 ? 'url(#colorTensile)' : 'url(#colorCompressive)'}
                      fillOpacity={0.2}
                      stroke="none"
                      isAnimationActive={true}
                    />
                    
                    <defs>
                      <linearGradient id="colorTensile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? '#fb7185' : '#e11d48'} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={isDarkMode ? '#fb7185' : '#e11d48'} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompressive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? '#60a5fa' : '#2563eb'} stopOpacity={0}/>
                        <stop offset="95%" stopColor={isDarkMode ? '#60a5fa' : '#2563eb'} stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>

                    <Line
                      yAxisId="left"
                      dataKey={viewMode === 'dSpacing' ? 'fittedD' : 'fittedMicrostrain'}
                      stroke={analysisResult.stress_MPa > 0 ? (isDarkMode ? '#fb7185' : '#e11d48') : (isDarkMode ? '#60a5fa' : '#2563eb')}
                      strokeWidth={3}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={true}
                    />
                    <Scatter
                      yAxisId="left"
                      dataKey={viewMode === 'dSpacing' ? 'dSpacing' : 'microstrain'}
                      fill={isDarkMode ? '#e2e8f0' : '#0f172a'}
                      line={false}
                      shape="circle"
                      r={5}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="text-center space-y-3">
                    <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Add at least 2 data points to generate the plot
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Legend / Info footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-slate-200" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Measured Points</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 border-t-4 rounded-full ${analysisResult?.stress_MPa > 0 ? 'border-rose-500' : 'border-blue-500'}`} />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Linear Fit
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 border-t-2 border-dashed border-slate-400" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  d₀ Baseline
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interactive Sensitivity Guide: What Moves the Graph? */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden border border-indigo-500/20">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <h3 className="text-xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-indigo-200 relative z-10">
          <Layers className="w-6 h-6 text-indigo-400" />
          Graph Interpretation Guide
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Factor 1: Stress Magnitude & Sign */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 text-rose-400 text-sm font-black uppercase tracking-wider mb-4">
              <div className="p-2 bg-rose-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              Plot Slope (m) ➔ Stress (σ)
            </div>
            <div className="text-sm text-indigo-100/70 leading-relaxed space-y-2">
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-rose-400/50" /> <span className="block"><strong className="text-white">Tensile (σ &gt; 0):</strong> Positive slope (line tilts upwards). Lattice expands parallel to surface.</span></span>
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-rose-400/50" /> <span className="block"><strong className="text-white">Compressive (σ &lt; 0):</strong> Negative slope (line tilts downwards). Lattice compresses.</span></span>
            </div>
          </div>

          {/* Factor 2: Elastic Constants E and nu */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 text-indigo-400 text-sm font-black uppercase tracking-wider mb-4">
              <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <Sliders className="w-5 h-5" />
              </div>
              Slope Sensitivity ➔ E & ν
            </div>
            <div className="text-sm text-indigo-100/70 leading-relaxed space-y-2">
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400/50" /> <span className="block"><strong className="text-white">Young's Modulus (E):</strong> Stiffer materials (higher E) exhibit a flatter slope for a given stress level.</span></span>
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400/50" /> <span className="block"><strong className="text-white">Poisson's Ratio (ν):</strong> Higher ν values slightly increase the angular dependency and the slope.</span></span>
            </div>
          </div>

          {/* Factor 3: Unstressed d0 & 2Theta0 */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 text-amber-400 text-sm font-black uppercase tracking-wider mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                <RefreshCw className="w-5 h-5" />
              </div>
              Vertical Shift ➔ d₀
            </div>
            <div className="text-sm text-indigo-100/70 leading-relaxed space-y-2">
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400/50" /> <span className="block"><strong className="text-white">Unstressed Angle (2θ₀):</strong> Shifting 2θ₀ shifts the entire line vertically (modifying y-intercept).</span></span>
              <span className="block flex items-start gap-2"><ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400/50" /> <span className="block"><strong className="text-white">Strain Baseline:</strong> Essential for accurate absolute strain calculations.</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
