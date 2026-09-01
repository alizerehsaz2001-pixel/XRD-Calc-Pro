import React, { useState } from 'react';
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
      rCalcMin: pt.rCalcMin && scaleMode === 'log' ? Math.log10(Math.max(1e-12, pt.rCalcMin)) : undefined,
      rCalcMax: pt.rCalcMax && scaleMode === 'log' ? Math.log10(Math.min(1.0, pt.rCalcMax)) : undefined
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
