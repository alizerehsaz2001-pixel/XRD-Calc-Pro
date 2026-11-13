import React, { useState, useMemo } from 'react';
import { XRRDataPoint, FitQualityResult, CriticalAngleResult, KiessigAnalysisResult } from '../utils/xrrPhysics';
import {
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  Legend
} from 'recharts';
import { Activity, Sliders, CheckCircle2, Layers, Crosshair } from 'lucide-react';

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
  const [xAxisUnit, setXAxisUnit] = useState<'theta' | 'qz'>('theta');
  const [showFresnelRef, setShowFresnelRef] = useState<boolean>(true);
  const [showConfidence, setShowConfidence] = useState<boolean>(false);
  const [showKiessigMarkers, setShowKiessigMarkers] = useState<boolean>(true);

  // Prepare chart data with log transform, Fresnel reference, and log residuals
  const chartData = useMemo(() => {
    return dataPoints.map((pt) => {
      let rCalcVal: number | null = pt.rCalc;
      let rExpVal: number | null = pt.rExp ?? null;
      let fresnelVal: number | null = pt.fresnelR ?? null;

      if (scaleMode === 'log') {
        rCalcVal = pt.rCalc > 0 ? Math.log10(pt.rCalc) : -10;
        rExpVal = pt.rExp && pt.rExp > 0 ? Math.log10(pt.rExp) : null;
        fresnelVal = pt.fresnelR && pt.fresnelR > 0 ? Math.log10(pt.fresnelR) : null;
      } else if (scaleMode === 'fresnel_compensated') {
        const qz4 = Math.pow(Math.max(0.01, pt.qz), 4);
        rCalcVal = pt.rCalc * qz4;
        rExpVal = pt.rExp ? pt.rExp * qz4 : null;
        fresnelVal = pt.fresnelR ? pt.fresnelR * qz4 : null;
      }

      const logResidual =
        pt.rExp && pt.rExp > 0 && pt.rCalc > 0
          ? Math.log10(pt.rExp) - Math.log10(pt.rCalc)
          : null;

      return {
        theta: Number(pt.theta.toFixed(3)),
        qz: Number(pt.qz.toFixed(4)),
        rCalc: rCalcVal,
        rExp: rExpVal,
        fresnelR: fresnelVal,
        logResidual,
        rCalcMin: pt.rCalcMin && scaleMode === 'log' ? Math.log10(Math.max(1e-12, pt.rCalcMin)) : undefined,
        rCalcMax: pt.rCalcMax && scaleMode === 'log' ? Math.log10(Math.min(1.0, pt.rCalcMax)) : undefined
      };
    });
  }, [dataPoints, scaleMode]);

  const yLabel =
    scaleMode === 'log'
      ? 'Log₁₀ Reflectivity R'
      : scaleMode === 'fresnel_compensated'
      ? 'Fresnel Compensated (R · qz⁴)'
      : 'Specular Reflectivity R';

  const xLabel =
    xAxisUnit === 'theta'
      ? 'Grazing Incident Angle θ (deg)'
      : 'Momentum Transfer Vector qz = (4π/λ)sinθ (Å⁻¹)';

  return (
    <div id="xrr-reflectivity-container" className="space-y-4">
      {/* Top Display & Metrology Toolbar */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Y-Scale Switcher */}
          <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setScaleMode('log')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                scaleMode === 'log'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log₁₀(R)
            </button>
            <button
              type="button"
              onClick={() => setScaleMode('fresnel_compensated')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                scaleMode === 'fresnel_compensated'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              R · qz⁴ (Porod)
            </button>
            <button
              type="button"
              onClick={() => setScaleMode('linear')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                scaleMode === 'linear'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linear R
            </button>
          </div>

          {/* X-Axis Unit Switcher */}
          <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setXAxisUnit('theta')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                xAxisUnit === 'theta'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Angle θ (°)
            </button>
            <button
              type="button"
              onClick={() => setXAxisUnit('qz')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                xAxisUnit === 'qz'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vector qz (Å⁻¹)
            </button>
          </div>

          {/* Overlay Toggles */}
          <div className="flex flex-wrap items-center gap-3 pl-2 text-xs font-mono text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showFresnelRef}
                onChange={(e) => setShowFresnelRef(e.target.checked)}
                className="rounded bg-[#070A12] border-slate-700 text-cyan-500"
              />
              <span>Fresnel Substrate R_F</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showKiessigMarkers}
                onChange={(e) => setShowKiessigMarkers(e.target.checked)}
                className="rounded bg-[#070A12] border-slate-700 text-cyan-500"
              />
              <span>Kiessig Maxima ({kiessigResult?.peaks.length ?? 0})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                className="rounded bg-[#070A12] border-slate-700 text-cyan-500"
              />
              <span>95% Confidence Band</span>
            </label>
          </div>
        </div>

        {/* Fit Quality Readout Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
          {hasExpData ? (
            <>
              <span className="px-2.5 py-1 rounded bg-[#070A12] border border-slate-800 text-slate-300">
                Log-RMSE: <strong className="text-cyan-400">{fitQuality.logRmse.toFixed(4)}</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-[#070A12] border border-slate-800 text-slate-300">
                R_wp: <strong className="text-emerald-400">{fitQuality.rwp.toFixed(2)}%</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-[#070A12] border border-slate-800 text-slate-300">
                χ²: <strong className="text-purple-400">{fitQuality.chiSquare.toFixed(3)}</strong>
              </span>
            </>
          ) : (
            <span className="px-2.5 py-1 rounded bg-[#070A12] border border-slate-800 text-slate-400">
              Mode: <strong className="text-cyan-300">Parratt Forward Simulation</strong> ({dataPoints.length} pts)
            </span>
          )}
        </div>
      </div>

      {/* Main Specular Reflectivity Curve */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-md p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Specular X-Ray Reflectivity Profile R({xAxisUnit === 'theta' ? 'θ' : 'qz'})
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-400 inline-block" /> Parratt R_calc
            </span>
            {showFresnelRef && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-500 border-b border-dashed inline-block" /> Fresnel R_F
              </span>
            )}
            {hasExpData && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Experimental R_exp
              </span>
            )}
            {critAngleResult && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                θc = {critAngleResult.thetaCritDeg.toFixed(3)}° (qc = {critAngleResult.qzCrit.toFixed(3)} Å⁻¹)
              </span>
            )}
          </div>
        </div>

        <div className="h-80 w-full bg-[#070A12] p-2 rounded border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey={xAxisUnit}
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke="#94a3b8"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11, fontFamily: 'monospace' }}
                label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                domain={scaleMode === 'log' ? [-9, 0.2] : ['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070A12',
                  borderColor: '#334155',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
                formatter={(val: any, name: string) => [
                  typeof val === 'number' ? val.toFixed(4) : val,
                  name === 'rCalc'
                    ? 'Parratt R_calc'
                    : name === 'rExp'
                    ? 'Measured R_exp'
                    : name === 'fresnelR'
                    ? 'Fresnel Substrate R_F'
                    : name
                ]}
                labelFormatter={(lbl) =>
                  xAxisUnit === 'theta' ? `Grazing Angle θ = ${lbl}°` : `Scattering Vector qz = ${lbl} Å⁻¹`
                }
              />

              {/* Critical Angle Reference Line */}
              {critAngleResult && (
                <ReferenceLine
                  x={xAxisUnit === 'theta' ? critAngleResult.thetaCritDeg : critAngleResult.qzCrit}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: xAxisUnit === 'theta' ? `θc = ${critAngleResult.thetaCritDeg}°` : `qc = ${critAngleResult.qzCrit} Å⁻¹`,
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideTopRight'
                  }}
                />
              )}

              {/* Kiessig Fringe Maxima Reference Ticks */}
              {showKiessigMarkers &&
                kiessigResult?.peaks.slice(0, 12).map((pk, idx) => (
                  <ReferenceLine
                    key={`fringe-${idx}`}
                    x={xAxisUnit === 'theta' ? pk.theta : pk.qz}
                    stroke="rgba(168, 85, 247, 0.35)"
                    strokeDasharray="2 2"
                  />
                ))}

              {/* Optional 95% Confidence Band */}
              {showConfidence && scaleMode === 'log' && (
                <>
                  <Line type="monotone" dataKey="rCalcMax" stroke="#0ea5e9" strokeOpacity={0.35} strokeDasharray="2 2" dot={false} />
                  <Line type="monotone" dataKey="rCalcMin" stroke="#0ea5e9" strokeOpacity={0.35} strokeDasharray="2 2" dot={false} />
                </>
              )}

              {/* Ideal Fresnel Substrate Decay Curve */}
              {showFresnelRef && (
                <Line
                  type="monotone"
                  dataKey="fresnelR"
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={1.3}
                  dot={false}
                  name="fresnelR"
                />
              )}

              {/* Parratt Calculated Curve */}
              <Line type="monotone" dataKey="rCalc" stroke="#38bdf8" strokeWidth={2.2} dot={false} name="rCalc" />

              {/* Experimental Data Points */}
              {hasExpData && (
                <Line
                  type="linear"
                  dataKey="rExp"
                  stroke="#f43f5e"
                  strokeWidth={0}
                  dot={{ r: 2.5, fill: '#f43f5e' }}
                  name="rExp"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Synchronized Log-Residual Subplot when Experimental / Noisy Data is Present */}
        {hasExpData && (
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Difference Residual Curve: Δlog₁₀(R) = log₁₀(R_exp) − log₁₀(R_calc)</span>
              <span className="text-emerald-400">R² = {fitQuality.rSquared.toFixed(4)}</span>
            </div>
            <div className="h-28 w-full bg-[#070A12] p-2 rounded border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey={xAxisUnit} type="number" domain={['dataMin', 'dataMax']} stroke="#64748b" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 9, fontFamily: 'monospace' }} domain={[-0.6, 0.6]} />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="logResidual" stroke="#fbbf24" strokeWidth={1.5} dot={false} name="Δlog₁₀(R)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
