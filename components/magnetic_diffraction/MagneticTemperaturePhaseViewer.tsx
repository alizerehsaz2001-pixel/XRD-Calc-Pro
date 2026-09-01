import React, { useState } from 'react';
import { CriticalExponentModel, MagneticMetrics, calculateTemperatureOrderParameter } from '../../utils/magneticDiffractionPhysics';
import { Thermometer, Activity, TrendingUp, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from 'recharts';

interface MagneticTemperaturePhaseViewerProps {
  temperature: number;
  criticalTemp: number;
  exponentModel: CriticalExponentModel;
  metrics: MagneticMetrics;
  onTemperatureChange: (temp: number) => void;
  onExponentModelChange: (model: CriticalExponentModel) => void;
  onCriticalTempChange: (tc: number) => void;
}

export const MagneticTemperaturePhaseViewer: React.FC<MagneticTemperaturePhaseViewerProps> = ({
  temperature,
  criticalTemp,
  exponentModel,
  metrics,
  onTemperatureChange,
  onExponentModelChange,
  onCriticalTempChange
}) => {
  const [viewMode, setViewMode] = useState<'order_parameter' | 'susceptibility' | 'inverse_susceptibility'>('order_parameter');

  // Generate T dataset from 0 to 1.5 * Tc
  const maxT = Math.max(50, Math.ceil(criticalTemp * 1.5));
  const stepT = Math.max(1, Math.floor(maxT / 60));

  const tPoints = [];
  for (let t = 0; t <= maxT; t += stepT) {
    const orderParam = calculateTemperatureOrderParameter(t, criticalTemp, exponentModel);
    const subMoment = metrics.totalSublatticeMoment0K * orderParam;

    // Curie-Weiss Susceptibility chi = C / (T - Theta_CW)
    const curieC = metrics.curieConstant || 1.5;
    const thetaCW = metrics.weissConstant || (0.8 * criticalTemp);
    const denom = t - thetaCW;
    const chi = denom > 1 ? curieC / denom : (t < criticalTemp ? 0.02 : 5.0);
    const invChi = denom > 1 ? denom / curieC : null;

    tPoints.push({
      T: t,
      orderParameter: Number((orderParam * 100).toFixed(1)),
      sublatticeMoment: Number(subMoment.toFixed(2)),
      chi: Number(chi.toFixed(3)),
      invChi: invChi !== null ? Number(invChi.toFixed(2)) : null
    });
  }

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl relative overflow-hidden text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-rose-500/20 rounded-xl border border-amber-500/30">
            <Thermometer className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Temperature Evolution &amp; Phase Boundary Studio
            </h3>
            <p className="text-[10px] text-slate-400">
              Mean-field vs Universality critical scaling, Curie-Weiss susceptibility &amp; order parameter
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('order_parameter')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              viewMode === 'order_parameter'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Order Param M(T)
          </button>
          <button
            onClick={() => setViewMode('susceptibility')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              viewMode === 'susceptibility'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Susceptibility χ(T)
          </button>
          <button
            onClick={() => setViewMode('inverse_susceptibility')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              viewMode === 'inverse_susceptibility'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1 / χ(T) Curie-Weiss
          </button>
        </div>
      </div>

      {/* Interactive Controls & Critical Exponents */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs">
        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>Operating Temperature (T)</span>
            <span className="text-amber-400 font-bold">{temperature} K</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(300, Math.ceil(criticalTemp * 1.5))}
            step={1}
            value={temperature}
            onChange={e => onTemperatureChange(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
            <span>Critical Temp (Tc / TN)</span>
            <span className="text-rose-400 font-bold">{criticalTemp} K</span>
          </div>
          <input
            type="range"
            min={1}
            max={1200}
            step={1}
            value={criticalTemp}
            onChange={e => onCriticalTempChange(Number(e.target.value))}
            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="text-[10px] font-mono text-slate-400 mb-1">
            Critical Exponent Class (β)
          </div>
          <select
            value={exponentModel}
            onChange={e => onExponentModelChange(e.target.value as CriticalExponentModel)}
            className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 font-mono focus:outline-none focus:border-amber-500"
          >
            <option value="3D-Heisenberg">3D Heisenberg (β = 0.365)</option>
            <option value="3D-Ising">3D Ising (β = 0.326)</option>
            <option value="3D-XY">3D XY / Helical (β = 0.345)</option>
            <option value="Mean-Field">Mean Field (β = 0.500)</option>
            <option value="2D-Ising">2D Layered Ising (β = 0.125)</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#060a14] rounded-2xl border border-slate-800 p-3 h-[270px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tPoints} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
            <XAxis
              dataKey="T"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={val => `${val} K`}
              label={{ value: 'Temperature T (Kelvin)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
            />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
              labelFormatter={label => `T = ${label} K`}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />

            {/* Current operating temperature vertical marker */}
            <ReferenceLine x={temperature} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `T_op (${temperature} K)`, fill: '#f59e0b', fontSize: 9 }} />
            {/* Critical temperature vertical marker */}
            <ReferenceLine x={criticalTemp} stroke="#ef4444" strokeDasharray="2 2" label={{ value: `Tc (${criticalTemp} K)`, fill: '#ef4444', fontSize: 9 }} />

            {viewMode === 'order_parameter' && (
              <>
                <Line type="monotone" dataKey="orderParameter" name="Order Parameter M(T)/M(0) (%)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="sublatticeMoment" name="Sublattice Moment (μB)" stroke="#818cf8" strokeWidth={2} dot={false} />
              </>
            )}

            {viewMode === 'susceptibility' && (
              <Line type="monotone" dataKey="chi" name="Magnetic Susceptibility χ(T) (emu/mol)" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
            )}

            {viewMode === 'inverse_susceptibility' && (
              <Line type="monotone" dataKey="invChi" name="Inverse Susceptibility 1/χ(T) (mol/emu)" stroke="#a855f7" strokeWidth={2.5} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
