import os

# -----------------------------------------------------------------------------
# 7. XRRFittingTab.tsx
# -----------------------------------------------------------------------------
fitting_code = r"""import React, { useState } from 'react';
import { XRRLayer, XRRSimulationConfig, FitQualityResult } from '../utils/xrrPhysics';
import { OptimizationAlgorithm, LossFunctionType, OptimizationResult, runAdvancedOptimization } from '../utils/xrrOptimization';
import { Sliders, Play, RotateCcw, Check, Sparkles, AlertCircle, Shield, Lock, Unlock, TrendingDown, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface XRRFittingTabProps {
  layers: XRRLayer[];
  config: XRRSimulationConfig;
  expData: { theta: number; qz: number; intensity: number }[];
  fitQuality: FitQualityResult;
  onUpdateLayers: (newLayers: XRRLayer[]) => void;
}

export const XRRFittingTab: React.FC<XRRFittingTabProps> = ({
  layers,
  config,
  expData,
  fitQuality,
  onUpdateLayers
}) => {
  const [algorithm, setAlgorithm] = useState<OptimizationAlgorithm>('hybrid');
  const [lossFunction, setLossFunction] = useState<LossFunctionType>('log-rmse');
  const [maxIterations, setMaxIterations] = useState<number>(100);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optResult, setOptResult] = useState<OptimizationResult | null>(null);
  const [activeLayers, setActiveLayers] = useState<XRRLayer[]>(layers);
  const [progressLog, setProgressLog] = useState<{ iter: number; cost: number }[]>([]);

  const handleToggleLock = (layerId: string, param: 'thickness' | 'roughness' | 'density') => {
    setActiveLayers(prev =>
      prev.map(l => {
        if (l.id !== layerId) return l;
        if (param === 'thickness') return { ...l, lockedThickness: !l.lockedThickness };
        if (param === 'roughness') return { ...l, lockedRoughness: !l.lockedRoughness };
        if (param === 'density') return { ...l, lockedDensity: !l.lockedDensity };
        return l;
      })
    );
  };

  const handleStartFit = async () => {
    if (expData.length === 0) return;
    setIsOptimizing(true);
    setProgressLog([]);

    try {
      const result = await runAdvancedOptimization(activeLayers, config, expData, {
        algorithm,
        lossFunction,
        maxIterations,
        tolerance: 0.001,
        onProgress: (iter, cost, currentL) => {
          setProgressLog(prev => [...prev.slice(-30), { iter, cost }]);
        }
      });

      setOptResult(result);
      setActiveLayers(result.optimizedLayers);
      onUpdateLayers(result.optimizedLayers);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyToStack = () => {
    if (optResult) {
      onUpdateLayers(optResult.optimizedLayers);
    }
  };

  return (
    <div id="xrr-fitting-studio" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Non-Linear Multi-Algorithm Optimization Studio
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Refines thickness, interfacial roughness, and density using global Simulated Annealing and Levenberg-Marquardt gradient descent.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="run-opt-fit-btn"
              onClick={handleStartFit}
              disabled={isOptimizing || expData.length === 0}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-md shadow-cyan-950 transition-all cursor-pointer"
            >
              {isOptimizing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isOptimizing ? 'Optimizing Parameters...' : 'Start Global Fit'}
            </button>
          </div>
        </div>

        {/* Algorithm Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Optimization Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as OptimizationAlgorithm)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="hybrid">Hybrid (Annealing + Levenberg-Marquardt)</option>
              <option value="annealing">Simulated Annealing (Global)</option>
              <option value="nelder-mead">Nelder-Mead Downhill Simplex</option>
              <option value="levenberg-marquardt">Levenberg-Marquardt (Local)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Loss / Figure of Merit</label>
            <select
              value={lossFunction}
              onChange={(e) => setLossFunction(e.target.value as LossFunctionType)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="log-rmse">Log₁₀-RMSE (Recommended for XRR)</option>
              <option value="compensated-rmse">Fresnel Compensated (qz⁴ · ΔR)</option>
              <option value="rwp">Weighted Rwp (%)</option>
              <option value="chi-square">Reduced Chi-Square (χ²)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Iterations</label>
            <input
              type="number"
              min="20"
              max="500"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Layer Parameters & Locks Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h5 className="text-xs font-semibold text-slate-200 flex items-center justify-between">
          <span>Layer Parameter Constraints & Locks</span>
          <span className="text-[11px] font-normal text-slate-400">Click lock icon to hold parameter fixed during fit</span>
        </h5>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 font-medium">
              <tr>
                <th className="py-2 px-3">Layer</th>
                <th className="py-2 px-3">Material</th>
                <th className="py-2 px-3">Thickness (Å)</th>
                <th className="py-2 px-3">Roughness (Å)</th>
                <th className="py-2 px-3">Density (g/cm³)</th>
                <th className="py-2 px-3">Uncertainty (±1σ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {activeLayers.map((layer) => {
                const unc = optResult?.uncertainties[layer.id];
                return (
                  <tr key={layer.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-cyan-400 font-bold">{layer.name}</td>
                    <td className="py-2 px-3 text-slate-300">{layer.material}</td>

                    {/* Thickness */}
                    <td className="py-2 px-3">
                      {layer.thickness === 0 ? (
                        <span className="text-slate-500">Substrate (∞)</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{layer.thickness}</span>
                          <button
                            onClick={() => handleToggleLock(layer.id, 'thickness')}
                            className={`p-1 rounded transition-colors ${layer.lockedThickness ? 'text-amber-400 bg-amber-950/40' : 'text-slate-500 hover:text-slate-300'}`}
                            title={layer.lockedThickness ? 'Locked' : 'Unlocked'}
                          >
                            {layer.lockedThickness ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Roughness */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span>{layer.roughness}</span>
                        <button
                          onClick={() => handleToggleLock(layer.id, 'roughness')}
                          className={`p-1 rounded transition-colors ${layer.lockedRoughness ? 'text-amber-400 bg-amber-950/40' : 'text-slate-500 hover:text-slate-300'}`}
                          title={layer.lockedRoughness ? 'Locked' : 'Unlocked'}
                        >
                          {layer.lockedRoughness ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Density */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span>{layer.density}</span>
                        <button
                          onClick={() => handleToggleLock(layer.id, 'density')}
                          className={`p-1 rounded transition-colors ${layer.lockedDensity ? 'text-amber-400 bg-amber-950/40' : 'text-slate-500 hover:text-slate-300'}`}
                          title={layer.lockedDensity ? 'Locked' : 'Unlocked'}
                        >
                          {layer.lockedDensity ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Uncertainties */}
                    <td className="py-2 px-3 text-[11px] text-slate-400">
                      {unc ? (
                        <span>
                          d: ±{unc.thicknessError} | σ: ±{unc.roughnessError} | ρ: ±{unc.densityError}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convergence Curve */}
      {optResult && optResult.convergenceHistory.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              Optimization Convergence History (Loss vs Iteration)
            </h5>
            <div className="text-xs font-mono text-slate-400">
              Initial: <span className="text-amber-400">{optResult.initialCost}</span> → Final: <span className="text-emerald-400">{optResult.finalCost}</span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={optResult.convergenceHistory} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="iteration"
                  stroke="#94a3b8"
                  label={{ value: 'Iteration', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  label={{ value: 'Loss (Log-RMSE)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [val, 'Figure of Merit']}
                  labelFormatter={(lbl) => `Iteration ${lbl}`}
                />
                <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
"""

with open("components/XRRFittingTab.tsx", "w", encoding="utf-8") as f:
    f.write(fitting_code)

print("XRRFittingTab.tsx written!")

# -----------------------------------------------------------------------------
# 8. XRRSLDTab.tsx
# -----------------------------------------------------------------------------
sld_code = r"""import React, { useState } from 'react';
import { SLDProfilePoint, XRRLayer } from '../utils/xrrPhysics';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers, Activity, Eye, Info, ShieldCheck, Gauge } from 'lucide-react';

interface XRRSLDTabProps {
  sldProfile: SLDProfilePoint[];
  layers: XRRLayer[];
}

export const XRRSLDTab: React.FC<XRRSLDTabProps> = ({ sldProfile, layers }) => {
  const [profileMode, setProfileMode] = useState<'sld' | 'electron_density' | 'optical_potential'>('sld');

  if (sldProfile.length === 0) {
    return (
      <div id="xrr-sld-empty" className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-200">No SLD Depth Profile Generated</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Add at least one layer to visualize the real-space scattering length density and electron density profile.
        </p>
      </div>
    );
  }

  const yDataKey = profileMode === 'sld' ? 'sldReal' : profileMode === 'electron_density' ? 'electronDensity' : 'opticalPotential';
  const yLabel = profileMode === 'sld' ? 'SLD Re(ρ) (10⁻⁶ Å⁻²)' : profileMode === 'electron_density' ? 'Electron Density (e⁻ / Å³)' : 'Potential V(z) (eV)';

  return (
    <div id="xrr-sld-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Real-Space Depth Profile & Optical Interface Transitions
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Displays scattering length density along sample depth z with error-function (erf) interfacial roughness interdiffusion.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setProfileMode('sld')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              profileMode === 'sld' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SLD ρ(z)
          </button>
          <button
            onClick={() => setProfileMode('electron_density')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              profileMode === 'electron_density' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Electron Density
          </button>
          <button
            onClick={() => setProfileMode('optical_potential')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              profileMode === 'optical_potential' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Potential V(z)
          </button>
        </div>
      </div>

      {/* Profile Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sldProfile} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="sldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="z"
                stroke="#94a3b8"
                label={{ value: 'Sample Depth z (Å)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#94a3b8"
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [val, yLabel]}
                labelFormatter={(label) => `Depth z = ${label} Å (${(Number(label) / 10).toFixed(2)} nm)`}
              />
              <Area type="monotone" dataKey={yDataKey} stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#sldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Layer Stack Porosity & Density Table */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {layers.map((layer, idx) => {
          // Estimate theoretical density if known
          const isSub = layer.thickness === 0;
          return (
            <div key={layer.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300">{layer.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {isSub ? 'Substrate' : `${layer.thickness} Å`}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <span>{layer.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Density:</span>
                  <span className="text-emerald-400">{layer.density} g/cm³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Roughness σ:</span>
                  <span>{layer.roughness} Å</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dispersion δ:</span>
                  <span>{layer.delta} × 10⁻⁶</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
"""

with open("components/XRRSLDTab.tsx", "w", encoding="utf-8") as f:
    f.write(sld_code)

print("XRRSLDTab.tsx written!")

# -----------------------------------------------------------------------------
# 9. XRRReflectivityTab.tsx
# -----------------------------------------------------------------------------
refl_code = r"""import React, { useState } from 'react';
import { XRRDataPoint, FitQualityResult, CriticalAngleResult, KiessigAnalysisResult } from '../utils/xrrPhysics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { Activity, Eye, Sliders, CheckCircle2, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface XRRReflectivityTabProps {
  dataPoints: XRRDataPoint[];
  fitQuality: FitQualityResult;
  critAngleResult: CriticalAngleResult | null;
  kiessigResult: KiessigAnalysisResult | null;
  hasExpData: boolean;
}

export const XRRReflectivityTab: React.FC<XRRReflectivityTabProps> = ({
  dataPoints,
  fitQuality,
  critAngleResult,
  kiessigResult,
  hasExpData
}) => {
  const [scaleMode, setScaleMode] = useState<'log' | 'linear' | 'fresnel_compensated'>('log');
  const [showConfidence, setShowConfidence] = useState<boolean>(true);
  const [showKiessigMarkers, setShowKiessigMarkers] = useState<boolean>(true);

  // Prepare chart data with log transform or compensated view
  const chartData = dataPoints.map((pt) => {
    let rCalcVal: number | null = pt.rCalc;
    let rExpVal: number | null = pt.rExp ?? null;

    if (scaleMode === 'log') {
      rCalcVal = pt.rCalc > 0 ? Math.log10(pt.rCalc) : -10;
      rExpVal = pt.rExp && pt.rExp > 0 ? Math.log10(pt.rExp) : null;
    } else if (scaleMode === 'fresnel_compensated') {
      const qz4 = Math.pow(Math.max(0.01, pt.qz), 4);
      rCalcVal = pt.rCalc * qz4;
      rExpVal = pt.rExp ? pt.rExp * qz4 : null;
    }

    return {
      theta: pt.theta,
      qz: pt.qz,
      rCalc: rCalcVal,
      rExp: rExpVal,
      rConfidenceLow: pt.rConfidenceLow && scaleMode === 'log' ? Math.log10(Math.max(1e-12, pt.rConfidenceLow)) : undefined,
      rConfidenceHigh: pt.rConfidenceHigh && scaleMode === 'log' ? Math.log10(Math.min(1.0, pt.rConfidenceHigh)) : undefined
    };
  });

  const yLabel = scaleMode === 'log' ? 'Log₁₀ Reflectivity (R)' : scaleMode === 'fresnel_compensated' ? 'Fresnel Compensated (R · qz⁴)' : 'Reflectivity R';

  return (
    <div id="xrr-reflectivity-container" className="space-y-6">
      {/* Top Banner & Display Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setScaleMode('log')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                scaleMode === 'log' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log₁₀ R
            </button>
            <button
              onClick={() => setScaleMode('fresnel_compensated')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                scaleMode === 'fresnel_compensated' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              R · qz⁴ Compensated
            </button>
            <button
              onClick={() => setScaleMode('linear')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                scaleMode === 'linear' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear R
            </button>
          </div>

          <label className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 ml-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showConfidence}
              onChange={(e) => setShowConfidence(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>95% Confidence Envelope</span>
          </label>
        </div>

        {/* Fit Quality Chips */}
        {hasExpData && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Log-RMSE: <strong className="text-cyan-400">{fitQuality.logRmse.toFixed(4)}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Rwp: <strong className="text-emerald-400">{fitQuality.rwp.toFixed(2)}%</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
              χ²: <strong className="text-purple-400">{fitQuality.chiSquare.toFixed(2)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Main Reflectivity Curve Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="theta"
                stroke="#94a3b8"
                label={{ value: 'Incident Angle θ (deg) / Scattering Vector qz', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                stroke="#94a3b8"
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                domain={scaleMode === 'log' ? [-9, 0.2] : ['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: string) => [
                  typeof val === 'number' ? val.toFixed(4) : val,
                  name === 'rCalc' ? 'Calculated R' : name === 'rExp' ? 'Experimental R' : name
                ]}
                labelFormatter={(lbl) => `Angle θ = ${lbl}°`}
              />

              {critAngleResult && (
                <ReferenceLine
                  x={critAngleResult.thetaCritDeg}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: `θc = ${critAngleResult.thetaCritDeg}°`, fill: '#10b981', fontSize: 11, position: 'top' }}
                />
              )}

              {/* Simulation Curve */}
              <Line type="monotone" dataKey="rCalc" stroke="#38bdf8" strokeWidth={2} dot={false} name="rCalc" />

              {/* Experimental Curve */}
              {hasExpData && (
                <Line type="linear" dataKey="rExp" stroke="#f43f5e" strokeWidth={0} dot={{ r: 3, fill: '#f43f5e' }} name="rExp" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
"""

with open("components/XRRReflectivityTab.tsx", "w", encoding="utf-8") as f:
    f.write(refl_code)

print("XRRReflectivityTab.tsx written!")
