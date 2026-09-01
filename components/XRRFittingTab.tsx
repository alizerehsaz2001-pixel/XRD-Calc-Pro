import React, { useState } from 'react';
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
                    <td className="py-2 px-3 text-slate-300">{layer.formula || layer.material || layer.name}</td>

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
