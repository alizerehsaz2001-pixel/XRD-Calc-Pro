import React from 'react';
import { StressTensor2D } from '../../utils/residualStressPhysics';
import { Compass, RotateCw } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from 'recharts';

interface StressTensorVisualizerProps {
  tensor: StressTensor2D;
  isDarkMode: boolean;
}

export const StressTensorVisualizer: React.FC<StressTensorVisualizerProps> = ({
  tensor,
  isDarkMode
}) => {
  const {
    sigma11,
    sigma22,
    tau12,
    tau13,
    sigma1,
    sigma2,
    principalAngleDeg,
    tauMax,
    vonMises,
    hydrostaticStress
  } = tensor;

  // Generate circle data points for Mohr's circle
  const center = (sigma11 + sigma22) / 2;
  const radius = tauMax;
  const circlePoints = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    circlePoints.push({
      sigma: center + radius * Math.cos(angle),
      tau: radius * Math.sin(angle)
    });
  }

  // Key state points
  const statePointX = [{ sigma: sigma11, tau: tau12, label: 'State X (σ₁₁, τ₁₂)' }];
  const statePointY = [{ sigma: sigma22, tau: -tau12, label: 'State Y (σ₂₂, -τ₁₂)' }];
  const principalP1 = [{ sigma: sigma1, tau: 0, label: 'Major Principal σ₁' }];
  const principalP2 = [{ sigma: sigma2, tau: 0, label: 'Minor Principal σ₂' }];

  return (
    <div className="space-y-6">
      {/* 2D / 3D Stress Matrix & Principal Values */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Stress Tensor Matrix */}
        <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Residual Stress Tensor [σᵢⱼ] (MPa)
            </h4>
            <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
              Symmetric 3×3
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-inner font-mono text-center">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">σ₁₁ (φ=0°)</span>
                <span className={`font-black ${sigma11 > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {sigma11.toFixed(1)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">τ₁₂ (in-plane)</span>
                <span className={`font-black ${Math.abs(tau12) > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                  {tau12.toFixed(1)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">τ₁₃ (ψ-split)</span>
                <span className={`font-black ${Math.abs(tau13) > 5 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>
                  {tau13.toFixed(1)}
                </span>
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">τ₂₁</span>
                <span className={`font-black ${Math.abs(tau12) > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                  {tau12.toFixed(1)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">σ₂₂ (φ=90°)</span>
                <span className={`font-black ${sigma22 > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {sigma22.toFixed(1)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">τ₂₃</span>
                <span className="font-bold text-slate-400">0.0</span>
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">τ₃₁</span>
                <span className={`font-black ${Math.abs(tau13) > 5 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>
                  {tau13.toFixed(1)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">τ₃₂</span>
                <span className="font-bold text-slate-400">0.0</span>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">σ₃₃ (out-of-plane)</span>
                <span className="font-bold text-slate-400">0.0</span>
              </div>
            </div>
          </div>

          {/* Principal Invariants Footer */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">von Mises Equiv.</span>
              <span className="font-black text-indigo-600 dark:text-indigo-400">{vonMises.toFixed(1)} MPa</span>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block font-sans">Hydrostatic Stress</span>
              <span className="font-black text-slate-700 dark:text-slate-300">{hydrostaticStress.toFixed(1)} MPa</span>
            </div>
          </div>
        </div>

        {/* Mohr's Circle Graphic Container */}
        <div className="md:col-span-7 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-emerald-500" />
              Mohr's Circle of Stress & Principal Axis Transformation
            </h4>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              φ₀ = {principalAngleDeg.toFixed(1)}°
            </span>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 20, bottom: 20, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis
                  type="number"
                  dataKey="sigma"
                  name="Normal Stress σ"
                  unit=" MPa"
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  label={{ value: 'Normal Stress σ (MPa)', position: 'bottom', offset: 0, fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                />
                <YAxis
                  type="number"
                  dataKey="tau"
                  name="Shear Stress τ"
                  unit=" MPa"
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  label={{ value: 'Shear Stress τ (MPa)', angle: -90, position: 'insideLeft', fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#090d16' : '#ffffff',
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                />
                <ReferenceLine y={0} stroke={isDarkMode ? '#64748b' : '#94a3b8'} strokeWidth={1.5} />
                <ReferenceLine x={0} stroke={isDarkMode ? '#64748b' : '#94a3b8'} strokeWidth={1.5} />

                {/* Circle contour */}
                <Scatter name="Mohr Circle" data={circlePoints} fill={isDarkMode ? '#818cf8' : '#6366f1'} line={{ stroke: isDarkMode ? '#818cf8' : '#6366f1', strokeWidth: 2 }} shape={() => <></>} />

                {/* State Points */}
                <Scatter name="X (σ₁₁, τ₁₂)" data={statePointX} fill="#f43f5e" shape="circle" r={5} />
                <Scatter name="Y (σ₂₂, -τ₁₂)" data={statePointY} fill="#3b82f6" shape="circle" r={5} />
                <Scatter name="σ₁ Principal" data={principalP1} fill="#10b981" shape="diamond" r={6} />
                <Scatter name="σ₂ Principal" data={principalP2} fill="#06b6d4" shape="diamond" r={6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
            <div>
              <span className="text-[9px] text-slate-400 block font-sans">Principal σ₁</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{sigma1.toFixed(1)} MPa</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-sans">Principal σ₂</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{sigma2.toFixed(1)} MPa</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-sans">Max Shear τ_max</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{tauMax.toFixed(1)} MPa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
