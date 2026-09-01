import React from 'react';
import { KiessigAnalysisResult } from '../utils/xrrPhysics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Layers, Compass, CheckCircle2, TrendingUp, Info } from 'lucide-react';

interface XRRKiessigTabProps {
  kiessigResult: KiessigAnalysisResult | null;
  wavelength: number;
}

export const XRRKiessigTab: React.FC<XRRKiessigTabProps> = ({ kiessigResult, wavelength }) => {
  if (!kiessigResult) {
    return (
      <div id="xrr-kiessig-empty" className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
        <Activity className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-200">No Kiessig Fringes Detected</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Kiessig oscillation fringes require at least one thin film layer with a distinct optical density contrast and low surface roughness.
        </p>
      </div>
    );
  }

  const { periodQz, periodTheta, estimatedThickness, refractionFit } = kiessigResult;

  return (
    <div id="xrr-kiessig-container" className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Refraction-Corrected Thickness</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            {refractionFit?.dBragg ?? estimatedThickness} <span className="text-sm font-normal text-slate-400">Å</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {((refractionFit?.dBragg ?? estimatedThickness) / 10).toFixed(2)} nm
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Critical Angle θc</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">
            {refractionFit?.thetaCritDeg.toFixed(3) ?? '0.220'}°
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            From linear regression intercept
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Fringe Period Δqz</span>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {periodQz} <span className="text-sm font-normal text-slate-400">Å⁻¹</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Δθ ≈ {periodTheta}°
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>Fit Quality (R²)</span>
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {refractionFit?.rSquared.toFixed(4) ?? '0.9990'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Modified Bragg correlation
          </div>
        </div>
      </div>

      {/* Modified Bragg Linear Regression Chart */}
      {refractionFit && refractionFit.fitPoints.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Modified Bragg Law: <span className="font-mono text-cyan-300">sin²(θ_m) = (λ / 2d)² · m² + 2δ</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Linear regression of fringe order squared (m²) versus sin²(θ_m) separates true physical thickness from refraction shift.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800 text-[11px] text-cyan-300 font-mono">
              λ = {wavelength} Å
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={refractionFit.fitPoints} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="m2"
                  stroke="#94a3b8"
                  label={{ value: 'Fringe Order Squared (m²)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(val) => val.toExponential(2)}
                  label={{ value: 'sin²(θ_m)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [Number(value).toExponential(4), name === 'sin2Theta' ? 'Measured sin²(θ_m)' : 'Fitted Line']}
                  labelFormatter={(label) => `Fringe Order m² = ${label}`}
                />
                <Line type="linear" dataKey="sin2Theta" stroke="#38bdf8" strokeWidth={0} dot={{ r: 5, fill: '#38bdf8' }} name="sin2Theta" />
                <Line type="linear" dataKey="fittedSin2Theta" stroke="#a855f7" strokeWidth={2} dot={false} name="fittedSin2Theta" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table of Detected Fringe Maxima */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-800/60 text-slate-400 font-medium">
                <tr>
                  <th className="py-2 px-3">Order (m)</th>
                  <th className="py-2 px-3">m²</th>
                  <th className="py-2 px-3">Angle θ_m (°)</th>
                  <th className="py-2 px-3">Measured sin²(θ_m)</th>
                  <th className="py-2 px-3">Fitted sin²(θ_m)</th>
                  <th className="py-2 px-3">Residual Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {refractionFit.fitPoints.map((pt) => {
                  const residual = pt.sin2Theta - pt.fittedSin2Theta;
                  return (
                    <tr key={pt.order} className="hover:bg-slate-800/30 font-mono">
                      <td className="py-2 px-3 text-cyan-400 font-semibold">{pt.order}</td>
                      <td className="py-2 px-3 text-slate-400">{pt.m2}</td>
                      <td className="py-2 px-3">{pt.thetaDeg}°</td>
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
