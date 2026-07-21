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
  Scale
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
  ComposedChart
} from 'recharts';

interface DataPoint {
  id: string;
  psi: number; // Tilt angle in degrees
  twoTheta: number; // Measured 2Theta
}

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
  const [youngsModulus, setYoungsModulus] = useState<number>(200); // E in GPa
  const [poissonsRatio, setPoissonsRatio] = useState<number>(0.3); // nu
  const [wavelength, setWavelength] = useState<number>(1.54056); // Cu K-alpha
  
  // Unstressed parameters (optional, can be inferred from psi=0 or explicitly set)
  const [unstressedTwoTheta, setUnstressedTwoTheta] = useState<number>(156.0);
  
  // Data points (Psi and 2Theta)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([
    { id: 'p1', psi: 0, twoTheta: 156.0 },
    { id: 'p2', psi: 15, twoTheta: 156.12 },
    { id: 'p3', psi: 30, twoTheta: 156.35 },
    { id: 'p4', psi: 45, twoTheta: 156.70 },
    { id: 'p5', psi: 60, twoTheta: 157.10 },
  ]);

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
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // R-squared calculation
    const meanY = sumY / n;
    let ssTot = 0, ssRes = 0;
    pointsWithStrain.forEach(p => {
      ssTot += (p.d - meanY) ** 2;
      const predictedY = slope * p.sin2psi + intercept;
      ssRes += (p.d - predictedY) ** 2;
    });
    const rSquared = 1 - (ssRes / ssTot);
    
    // Stress calculation
    // slope (m) = d0 * ( (1 + nu) / E ) * sigma
    // sigma = m * E / ( d0 * (1 + nu) )
    // Ensure E is converted from GPa to MPa for standard stress units (MPa)
    const E_MPa = youngsModulus * 1000;
    const stress_MPa = (slope * E_MPa) / (d0 * (1 + poissonsRatio));
    
    // Prepare chart data
    const chartData = pointsWithStrain.map(p => ({
      name: `${p.psi}°`,
      sin2psi: p.sin2psi,
      dSpacing: p.d,
      strain: p.strain * 1e6, // microstrain
      fittedD: slope * p.sin2psi + intercept
    }));

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
              <Activity className="w-6 h-6" />
            </div>
            Residual Stress Analysis
            <span className="text-sm font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2.5 py-1 rounded-lg ml-2 uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
              sin²ψ Method
            </span>
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
            Determine mechanical residual stresses (tensile or compressive) in industrial components, thin films, and welded joints by measuring lattice strain at varying tilt angles (ψ).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Inputs */}
        <div className="xl:col-span-1 space-y-6">
          {/* Material Constants Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" />
              Elastic Constants
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Young's Modulus (E)</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{youngsModulus} GPa</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="1"
                    value={youngsModulus}
                    onChange={e => setYoungsModulus(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <input 
                    type="number"
                    value={youngsModulus}
                    onChange={e => setYoungsModulus(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Poisson's Ratio (ν)</span>
                  <span className="text-purple-600 dark:text-purple-400 font-mono">{poissonsRatio.toFixed(3)}</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.01"
                    value={poissonsRatio}
                    onChange={e => setPoissonsRatio(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <input 
                    type="number"
                    step="0.01"
                    value={poissonsRatio}
                    onChange={e => setPoissonsRatio(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Instrumental Parameters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-500" />
              Diffraction Parameters
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Wavelength λ (Å)
                </label>
                <input 
                  type="number"
                  step="0.0001"
                  value={wavelength}
                  onChange={e => setWavelength(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Stress-Free 2θ₀ (°)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={unstressedTwoTheta}
                  onChange={e => setUnstressedTwoTheta(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Data Points Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-500" />
                Measurement Data
              </h3>
              <button 
                onClick={addPoint}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800/50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Point
              </button>
            </div>
            
            <div className="flex-1 overflow-auto -mx-2 px-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                  <tr>
                    <th className="py-2 px-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">ψ (deg)</th>
                    <th className="py-2 px-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">2θ (deg)</th>
                    <th className="py-2 px-2 text-center text-slate-500 font-bold uppercase tracking-wider text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dataPoints.map((point) => (
                    <tr key={point.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={point.psi}
                          onChange={(e) => updatePoint(point.id, 'psi', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.001"
                          value={point.twoTheta}
                          onChange={(e) => updatePoint(point.id, 'twoTheta', Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded focus:border-blue-500 outline-none text-slate-700 dark:text-slate-300"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removePoint(point.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dataPoints.length === 0 && (
                <div className="py-6 text-center text-sm font-medium text-slate-500">
                  No data points. Add some to begin analysis.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visualization & Results */}
        <div className="xl:col-span-2 space-y-6">
          {/* Results Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stress Result */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between relative overflow-hidden ${
              analysisResult 
                ? (analysisResult.stress_MPa > 0 
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50' 
                  : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50')
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="relative z-10 space-y-1">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Principal Residual Stress (σ)
                </div>
                <div className="flex items-end gap-2">
                  <div className={`text-4xl font-black tracking-tighter ${
                    analysisResult 
                      ? (analysisResult.stress_MPa > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400')
                      : 'text-slate-400'
                  }`}>
                    {analysisResult ? Math.abs(analysisResult.stress_MPa).toFixed(1) : '---'}
                  </div>
                  <div className={`text-sm font-bold pb-1 ${
                    analysisResult 
                      ? (analysisResult.stress_MPa > 0 ? 'text-rose-500 dark:text-rose-500' : 'text-blue-500 dark:text-blue-500')
                      : 'text-slate-400'
                  }`}>
                    MPa
                  </div>
                </div>
              </div>
              {analysisResult && (
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                  analysisResult.stress_MPa > 0
                    ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800'
                    : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800'
                }`}>
                  {analysisResult.stress_MPa > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {analysisResult.stressType}
                </div>
              )}
            </div>

            {/* Regression Metrics */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Linear Fit Confidence (R²)
                </div>
                <div className="text-3xl font-black text-slate-700 dark:text-slate-200 font-mono tracking-tighter">
                  {analysisResult ? analysisResult.rSquared.toFixed(4) : '---'}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <LineChart className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Chart Plot */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative h-[420px] flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              d-Spacing vs sin²ψ Plot
            </h3>
            
            <div className="flex-1 min-h-0 relative w-full">
              {analysisResult && analysisResult.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={analysisResult.chartData}
                    margin={{ top: 10, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                    <XAxis 
                      dataKey="sin2psi" 
                      type="number"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#e2e8f0' }}
                      label={{ value: 'sin²ψ', position: 'bottom', offset: 0, fill: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      dataKey="dSpacing"
                      type="number"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      tickLine={false}
                      tickFormatter={(val) => val.toFixed(4)}
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#e2e8f0' }}
                      label={{ value: 'd-spacing (Å)', angle: -90, position: 'insideLeft', offset: -10, fill: isDarkMode ? '#cbd5e1' : '#475569', fontSize: 13, fontWeight: 'bold' }}
                    />
                    <RechartsTooltip
                      contentStyle={{ 
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: isDarkMode ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'dSpacing') return [`${value.toFixed(5)} Å`, 'Measured d'];
                        if (name === 'fittedD') return [`${value.toFixed(5)} Å`, 'Linear Fit'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `sin²ψ: ${Number(label).toFixed(3)}`}
                    />
                    <Line
                      yAxisId="left"
                      dataKey="fittedD"
                      stroke={analysisResult.stress_MPa > 0 ? (isDarkMode ? '#fb7185' : '#e11d48') : (isDarkMode ? '#60a5fa' : '#2563eb')}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                    <Scatter
                      yAxisId="left"
                      dataKey="dSpacing"
                      fill={isDarkMode ? '#a78bfa' : '#7c3aed'}
                      line={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Add at least 2 data points to generate the plot
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Legend / Info footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-600 dark:bg-violet-400" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Measured Data (d vs sin²ψ)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 border-t-2 border-dashed ${analysisResult?.stress_MPa > 0 ? 'border-rose-500' : 'border-blue-500'}`} />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Linear Fit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mathematical Theory Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          Theoretical Foundation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="space-y-3">
            <p>
              The <strong>sin²ψ method</strong> is based on measuring the lattice spacing <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-mono">d</code> of a specific crystallographic plane (hkl) at various sample tilt angles <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-mono">ψ</code>.
            </p>
            <p>
              According to the fundamental equation of X-ray stress analysis for an isotropic homogeneous material under plane stress conditions:
            </p>
            <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center font-mono text-indigo-700 dark:text-indigo-300 font-bold overflow-x-auto">
              (d_ψ - d₀)/d₀ = ((1+ν)/E) · σ · sin²ψ
            </div>
          </div>
          <div className="space-y-3">
            <p>
              By plotting the measured <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-mono">d_ψ</code> against <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-mono">sin²ψ</code>, a linear relationship is typically observed. The slope of this line (<code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-mono">m</code>) is directly proportional to the macroscopic residual stress <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-700 dark:text-indigo-300 font-mono">σ</code>.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 marker:text-indigo-400">
              <li><strong>Positive Slope (m &gt; 0):</strong> Tensile Stress (+)</li>
              <li><strong>Negative Slope (m &lt; 0):</strong> Compressive Stress (-)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
