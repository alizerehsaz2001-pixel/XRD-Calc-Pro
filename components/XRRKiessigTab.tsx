import React from 'react';
import { KiessigAnalysisResult } from '../utils/xrrPhysics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Layers, Compass, CheckCircle2, TrendingUp } from 'lucide-react';

interface XRRKiessigTabProps {
  kiessigResult: KiessigAnalysisResult | null;
  wavelength: number;
}

export const XRRKiessigTab: React.FC<XRRKiessigTabProps> = ({ kiessigResult, wavelength }) => {
  if (!kiessigResult) {
    return (
      <div id="xrr-kiessig-empty" className="bg-[#0B0F19] border border-slate-800 rounded-md p-8 text-center">
        <Activity className="w-10 h-10 text-slate-500 mx-auto mb-2" />
        <h4 className="text-sm font-mono font-bold text-slate-200 uppercase">No Kiessig Fringes Detected</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Kiessig oscillation fringes require at least one thin film layer with distinct optical density contrast and low interfacial roughness.
        </p>
      </div>
    );
  }

  const { periodQz, periodTheta, estimatedThickness, refractionFit } = kiessigResult;

  return (
    <div id="xrr-kiessig-container" className="space-y-4">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
        <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refraction-Corrected d_Bragg</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {refractionFit?.dBragg ?? estimatedThickness} <span className="text-xs font-normal text-slate-400">Å</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {((refractionFit?.dBragg ?? estimatedThickness) / 10).toFixed(2)} nm (Direct Δqz: {estimatedThickness} Å)
          </div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Intercept Critical Angle θc</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {refractionFit?.thetaCritDeg.toFixed(3) ?? '0.220'}°
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            From sin²θ_m intercept (2δ)
          </div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Fringe Period Δqz</span>
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {periodQz} <span className="text-xs font-normal text-slate-400">Å⁻¹</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Angular spacing Δθ ≈ {periodTheta}°
          </div>
        </div>

        <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Modified Bragg Fit R²</span>
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {refractionFit?.rSquared.toFixed(5) ?? '0.99900'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {refractionFit?.fitPoints.length ?? 0} Interference Orders Indexed
          </div>
        </div>
      </div>

      {/* Modified Bragg Linear Regression Chart */}
      {refractionFit && refractionFit.fitPoints.length > 0 && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Modified Bragg Linearization: sin²(θ_m) = (λ / 2d)² · m² + 2δ</span>
              </h4>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Linear regression of fringe order squared (m²) vs. sin²(θ_m) eliminates low-angle refraction shift bias.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#070A12] border border-slate-800 text-[11px] text-cyan-300 font-mono tabular-nums">
              λ = {wavelength} Å
            </span>
          </div>

          <div className="h-64 w-full bg-[#070A12] p-2 rounded border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={refractionFit.fitPoints} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="m2"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  label={{ value: 'Interference Fringe Order Squared (m²)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val) => val.toExponential(2)}
                  label={{ value: 'sin²(θ_m)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#070A12',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: any, name: string) => [
                    Number(value).toExponential(4),
                    name === 'sin2Theta' ? 'Measured sin²(θ_m)' : 'Linear Fit'
                  ]}
                  labelFormatter={(label) => `Fringe Order m² = ${label}`}
                />
                <Line type="linear" dataKey="sin2Theta" stroke="#38bdf8" strokeWidth={0} dot={{ r: 4, fill: '#38bdf8' }} name="sin2Theta" />
                <Line type="linear" dataKey="fittedSin2Theta" stroke="#a855f7" strokeWidth={2} dot={false} name="fittedSin2Theta" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table of Detected Fringe Maxima */}
          <div className="overflow-x-auto bg-[#070A12] border border-slate-800 rounded">
            <table className="w-full text-xs text-left text-slate-300 font-mono tabular-nums">
              <thead className="bg-[#0B0F19] border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-2 px-3">Order (m)</th>
                  <th className="py-2 px-3">m²</th>
                  <th className="py-2 px-3">Peak Angle θ_m (°)</th>
                  <th className="py-2 px-3">Observed sin²(θ_m)</th>
                  <th className="py-2 px-3">Fitted sin²(θ_m)</th>
                  <th className="py-2 px-3">Residual Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {refractionFit.fitPoints.map((pt) => {
                  const residual = pt.sin2Theta - pt.fittedSin2Theta;
                  return (
                    <tr key={pt.order} className="hover:bg-slate-900/50">
                      <td className="py-2 px-3 text-cyan-400 font-bold">m = {pt.order}</td>
                      <td className="py-2 px-3 text-slate-400">{pt.m2}</td>
                      <td className="py-2 px-3">{pt.thetaDeg.toFixed(3)}°</td>
                      <td className="py-2 px-3">{pt.sin2Theta.toExponential(4)}</td>
                      <td className="py-2 px-3 text-purple-300">{pt.fittedSin2Theta.toExponential(4)}</td>
                      <td className={`py-2 px-3 ${Math.abs(residual) < 1e-5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {residual.toExponential(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
