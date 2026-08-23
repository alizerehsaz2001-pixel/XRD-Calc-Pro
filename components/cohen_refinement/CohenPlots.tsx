import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import { Activity, BarChart2, TrendingUp, Info } from 'lucide-react';
import { CrystalSystem, DriftFunctionType } from './CohenPresetsDb';

interface PeakDetail {
  id: string;
  twoTheta: number;
  twoThetaCalc: number;
  deltaTwoTheta: number;
  h: number;
  k: number;
  l: number;
  sin2Obs: number;
  sin2Calc: number;
  driftVal: number;
  residualSin2: number;
  intensity?: number;
  enabled?: boolean;
}

interface CohenPlotsProps {
  peakDetails: PeakDetail[];
  crystalSystem: CrystalSystem;
  driftType: DriftFunctionType;
  refinedLattice: { a: number; b: number; c: number; betaDeg?: number };
  sigmaLattice: { sigmaA: number; sigmaB: number; sigmaC: number; sigmaD: number };
  wavelength: number;
  driftD: number;
  rmsTwoTheta: number;
  precision?: number;
  onTogglePeak?: (id: string) => void;
}

export const CohenPlots: React.FC<CohenPlotsProps> = ({
  peakDetails,
  crystalSystem,
  driftType,
  refinedLattice,
  sigmaLattice,
  wavelength,
  driftD,
  rmsTwoTheta,
  precision = 4,
  onTogglePeak
}) => {
  const [activePlotTab, setActivePlotTab] = useState<'residuals' | 'extrapolation' | 'deltaBar'>('residuals');

  const driftLabelMap: Record<DriftFunctionType, string> = {
    nelson_riley: 'Nelson-Riley f(θ)',
    bradley_jay: 'Bradley-Jay cos²θ',
    sample_displacement: 'Sample Displacement cos²θ sinθ',
    hess_hagg: 'Hess-Hägg sin²(2θ)',
    zero_shift: 'Zero Shift cosθ'
  };

  // Prepare data for Residuals Plot: Delta 2Theta vs 2Theta
  const residualData = peakDetails.map((p, idx) => ({
    id: p.id,
    index: idx + 1,
    hkl: `(${p.h}, ${p.k}, ${p.l})`,
    twoTheta: p.twoTheta,
    twoThetaCalc: p.twoThetaCalc,
    deltaTwoTheta: parseFloat(p.deltaTwoTheta.toFixed(5)),
    absDelta: Math.abs(p.deltaTwoTheta),
    driftVal: parseFloat(p.driftVal.toFixed(4)),
    intensity: p.intensity || 100,
    isOutlier: Math.abs(p.deltaTwoTheta) > 0.05
  }));

  // Prepare data for Extrapolation Plot (Apparent parameter vs f(θ))
  // For cubic crystals, apparent a_i = (lambda / 2) * sqrt( (h^2+k^2+l^2) / sin^2(theta_i) )
  const extrapolationData = peakDetails.map((p, idx) => {
    let apparentA = refinedLattice.a;
    const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
    const sinTh = Math.sin(thetaRad);
    
    if (crystalSystem === 'Cubic') {
      const s = p.h * p.h + p.k * p.k + p.l * p.l;
      apparentA = (wavelength / (2 * sinTh)) * Math.sqrt(s);
    } else if (crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal') {
      // Effective apparent spacing normalization
      apparentA = (wavelength / (2 * sinTh)) * Math.sqrt(p.h * p.h + p.k * p.k + (p.l ? 1 : 0));
    }

    return {
      id: p.id,
      index: idx + 1,
      hkl: `(${p.h}, ${p.k}, ${p.l})`,
      driftVal: parseFloat(p.driftVal.toFixed(4)),
      apparentA: parseFloat(apparentA.toFixed(5)),
      twoTheta: p.twoTheta,
      deltaTwoTheta: p.deltaTwoTheta
    };
  });

  // Calculate regression line for extrapolation plot if cubic
  const minDrift = Math.min(...extrapolationData.map(d => d.driftVal), 0);
  const maxDrift = Math.max(...extrapolationData.map(d => d.driftVal), 1.5);
  
  // Linear line from Y-intercept (a0) with slope D
  const linePoints = [
    { driftVal: 0, fitA: parseFloat(refinedLattice.a.toFixed(5)) },
    { 
      driftVal: parseFloat(maxDrift.toFixed(3)), 
      fitA: parseFloat((refinedLattice.a * (1 + (driftD * maxDrift * 0.1))).toFixed(5)) 
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Interactive Refinement Visualizer
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluate peak angular residuals and extrapolation convergence across drift functions
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActivePlotTab('residuals')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activePlotTab === 'residuals'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Residuals (Δ2θ vs 2θ)
          </button>

          <button
            type="button"
            onClick={() => setActivePlotTab('deltaBar')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activePlotTab === 'deltaBar'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Reflection Shifts
          </button>

          <button
            type="button"
            onClick={() => setActivePlotTab('extrapolation')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activePlotTab === 'extrapolation'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Drift Extrapolation
          </button>
        </div>
      </div>

      {/* Chart 1: Angular Residuals Scatter vs 2Theta */}
      {activePlotTab === 'residuals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Angular Difference: <strong className="text-slate-700 dark:text-slate-200 font-mono">Δ2θ = 2θ_obs - 2θ_calc</strong>
            </span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Good (&lt;0.02°)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Fair (&lt;0.05°)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Outlier (&gt;0.05°)</span>
              </span>
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="twoTheta"
                  name="2Theta"
                  unit="°"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Diffraction Angle 2θ (°)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="deltaTwoTheta"
                  name="Δ2θ"
                  unit="°"
                  domain={[-0.1, 0.1]}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Residual Δ2θ (°)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#64748b' }}
                />
                <ReferenceLine y={0} stroke="#6366f1" strokeWidth={1.5} />
                <ReferenceLine y={0.02} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={-0.02} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={0.05} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={-0.05} stroke="#f59e0b" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-800 space-y-1">
                        <div className="text-indigo-400 font-bold font-sans flex items-center justify-between gap-4">
                          <span>Peak #{data.index} {data.hkl}</span>
                          <span className={data.absDelta < 0.02 ? 'text-emerald-400' : data.absDelta < 0.05 ? 'text-amber-400' : 'text-rose-400'}>
                            |Δ2θ|: {data.absDelta.toFixed(4)}°
                          </span>
                        </div>
                        <div className="text-slate-300">2θ Obs: <strong>{data.twoTheta.toFixed(3)}°</strong></div>
                        <div className="text-slate-300">2θ Calc: <strong>{data.twoThetaCalc.toFixed(3)}°</strong></div>
                        <div className="text-slate-300">Δ2θ: <strong className={data.deltaTwoTheta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {data.deltaTwoTheta > 0 ? `+${data.deltaTwoTheta.toFixed(4)}` : data.deltaTwoTheta.toFixed(4)}°
                        </strong></div>
                        <div className="text-slate-400 text-[10px]">Drift f(θ): {data.driftVal}</div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={residualData}
                  fill="#6366f1"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    const abs = Math.abs(payload.deltaTwoTheta);
                    const color = abs < 0.02 ? '#10b981' : abs < 0.05 ? '#f59e0b' : '#f43f5e';
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        className="cursor-pointer transition-all hover:scale-125"
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 2: Reflection Shifts Bar Chart */}
      {activePlotTab === 'deltaBar' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>Per-Reflection Deviation Profile</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              RMS: ±{rmsTwoTheta.toFixed(4)}°
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={residualData} margin={{ top: 15, right: 15, bottom: 25, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="hkl"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Miller Indices (h k l)', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  unit="°"
                  domain={[-0.08, 0.08]}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Δ2θ Shift (°)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#64748b' }}
                />
                <ReferenceLine y={0} stroke="#64748b" />
                <ReferenceLine y={0.02} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={-0.02} stroke="#10b981" strokeDasharray="3 3" />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-800 space-y-1">
                        <div className="text-indigo-400 font-bold font-sans">
                          Reflection {d.hkl} (#{d.index})
                        </div>
                        <div>Observed: <strong>{d.twoTheta.toFixed(3)}°</strong></div>
                        <div>Calculated: <strong>{d.twoThetaCalc.toFixed(3)}°</strong></div>
                        <div>Δ2θ: <strong className={d.deltaTwoTheta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {d.deltaTwoTheta > 0 ? `+${d.deltaTwoTheta.toFixed(4)}` : d.deltaTwoTheta.toFixed(4)}°
                        </strong></div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="deltaTwoTheta" radius={[4, 4, 4, 4]}>
                  {residualData.map((entry, index) => {
                    const abs = Math.abs(entry.deltaTwoTheta);
                    const fill = abs < 0.02 ? '#10b981' : abs < 0.05 ? '#f59e0b' : '#f43f5e';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 3: Extrapolation Plot: a_app vs f(theta) */}
      {activePlotTab === 'extrapolation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Lattice Parameter vs. <strong className="text-indigo-600 dark:text-indigo-400">{driftLabelMap[driftType]}</strong>
            </span>
            <span className="font-mono text-xs">
              Extrapolated a₀ (f(θ)=0): <strong className="text-indigo-700 dark:text-indigo-300">{refinedLattice.a.toFixed(precision + 1)} ± {sigmaLattice.sigmaA.toFixed(precision + 2)} Å</strong>
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="driftVal"
                  name="f(θ)"
                  domain={[0, 'auto']}
                  tick={{ fontSize: 11 }}
                  label={{ value: `Systematic Error Function: ${driftLabelMap[driftType]}`, position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="apparentA"
                  name="Lattice Parameter a"
                  unit=" Å"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Apparent a (Å)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-800 space-y-1">
                        <div className="text-indigo-400 font-bold font-sans">
                          Reflection {d.hkl} (#{d.index})
                        </div>
                        <div>2θ: {d.twoTheta.toFixed(3)}°</div>
                        <div>f(θ): {d.driftVal}</div>
                        <div>Apparent a: <strong>{d.apparentA} Å</strong></div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={refinedLattice.a}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{ value: `a₀ = ${refinedLattice.a.toFixed(4)} Å`, position: 'insideTopLeft', fill: '#10b981', fontSize: 10 }}
                />
                <Scatter data={extrapolationData} fill="#6366f1">
                  {extrapolationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366f1" stroke="#ffffff" strokeWidth={1.5} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
