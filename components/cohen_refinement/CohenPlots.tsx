import React, { useState, useMemo } from 'react';
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
  ReferenceArea,
  Cell,
  Legend
} from 'recharts';
import { Activity, BarChart2, TrendingUp, Layers, Crosshair } from 'lucide-react';
import { CrystalSystem, DriftFunctionType } from './CohenPresetsDb';
import { CohenPeakDetail } from './CohenSolver';

interface CohenPlotsProps {
  peakDetails: CohenPeakDetail[];
  crystalSystem: CrystalSystem;
  driftType: DriftFunctionType;
  refinedLattice: { a: number; b: number; c: number; betaDeg?: number };
  sigmaLattice: { sigmaA: number; sigmaB: number; sigmaC: number; sigmaD: number };
  refLatticeA?: number;
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
  refLatticeA,
  wavelength,
  driftD,
  rmsTwoTheta,
  precision = 4,
  onTogglePeak
}) => {
  const [activePlotTab, setActivePlotTab] = useState<'extrapolation' | 'residuals' | 'influence' | 'stick'>('extrapolation');
  const [influenceMetric, setInfluenceMetric] = useState<'deltaTwoTheta' | 'deltaDPpm' | 'studentized' | 'cooks'>('deltaTwoTheta');

  const driftLabelMap: Record<DriftFunctionType, string> = {
    none: 'Zero Drift (Fixed D = 0)',
    nelson_riley: 'Nelson-Riley f(θ) = ½(cos²θ/sinθ + cos²θ/θ)',
    taylor_sinclair: 'Taylor-Sinclair ½cos²θ sinθ(1/sinθ + 1/θ)',
    bradley_jay: 'Bradley-Jay cos²θ',
    sample_displacement: 'Sample Displacement cos²θ sinθ',
    hess_hagg: 'Hess-Hägg sin²(2θ)',
    zero_shift: 'Zero-Shift sin(2θ)',
    flat_specimen: 'Flat Specimen cot(θ)',
    dual_drift: 'Dual-Drift (NR + Zero-Shift)'
  };

  // Prepare data for Residuals & Influence Plots
  const residualData = useMemo(() => {
    return peakDetails.map((p, idx) => ({
      id: p.id,
      index: idx + 1,
      hkl: `(${p.h} ${p.k} ${p.l})`,
      twoTheta: p.twoTheta,
      twoThetaCalc: p.twoThetaCalc,
      twoThetaZeroDrift: p.twoThetaZeroDrift ?? p.twoThetaCalc,
      deltaTwoTheta: parseFloat(p.deltaTwoTheta.toFixed(5)),
      absDelta: Math.abs(p.deltaTwoTheta),
      deltaDPpm: parseFloat((p.deltaDPpm ?? 0).toFixed(1)),
      studentizedResidual: parseFloat((p.studentizedResidual ?? 0).toFixed(3)),
      cooksDistance: parseFloat((p.cooksDistance ?? 0).toFixed(4)),
      leverageHii: parseFloat((p.leverageHii ?? 0).toFixed(3)),
      driftVal: parseFloat(p.driftVal.toFixed(4)),
      apparentA: parseFloat((p.apparentA ?? refinedLattice.a).toFixed(5)),
      correctedA: parseFloat((p.correctedA ?? refinedLattice.a).toFixed(5)),
      intensity: p.intensity || 100,
      isOutlier: Boolean(p.isOutlier)
    }));
  }, [peakDetails, refinedLattice.a]);

  // Linear regression of apparentA vs driftVal for the Extrapolation Curve
  const extrapolationCurveData = useMemo(() => {
    if (!residualData.length) return { points: [], slopeA: 0, yMin: refinedLattice.a - 0.01, yMax: refinedLattice.a + 0.01 };
    const n = residualData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (const d of residualData) {
      sumX += d.driftVal;
      sumY += d.apparentA;
      sumXY += d.driftVal * d.apparentA;
      sumX2 += d.driftVal * d.driftVal;
    }
    const denom = n * sumX2 - sumX * sumX;
    const slopeA = Math.abs(denom) > 1e-10
      ? (n * sumXY - sumX * sumY) / denom
      : -refinedLattice.a * driftD * 0.5;

    const maxF = Math.max(...residualData.map(d => d.driftVal), 0.5) * 1.08;
    const steps = 25;
    const curvePoints = [];
    for (let i = 0; i <= steps; i++) {
      const fVal = (maxF * i) / steps;
      const fitA = refinedLattice.a + slopeA * fVal;
      curvePoints.push({
        driftVal: parseFloat(fVal.toFixed(4)),
        fitLine: parseFloat(fitA.toFixed(5)),
        zeroDriftLine: parseFloat(refinedLattice.a.toFixed(5))
      });
    }

    const allA = [
      ...residualData.map(d => d.apparentA),
      ...residualData.map(d => d.correctedA),
      refinedLattice.a,
      ...(refLatticeA ? [refLatticeA] : [])
    ];
    const minVal = Math.min(...allA);
    const maxVal = Math.max(...allA);
    const pad = Math.max(0.0008, (maxVal - minVal) * 0.25);

    return {
      points: curvePoints,
      slopeA,
      maxF,
      yMin: parseFloat((minVal - pad).toFixed(5)),
      yMax: parseFloat((maxVal + pad).toFixed(5))
    };
  }, [residualData, refinedLattice.a, driftD, refLatticeA]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Refinement Convergence &amp; Residual Diagnostics
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Zero-drift extrapolation $f(\theta) \to 0$, angular residuals, Cook&apos;s leverage influence, and Bragg stick positions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActivePlotTab('extrapolation')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activePlotTab === 'extrapolation'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Drift Extrapolation f(θ)→0
          </button>

          <button
            type="button"
            onClick={() => setActivePlotTab('residuals')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activePlotTab === 'residuals'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            Residuals (Δ2θ vs 2θ)
          </button>

          <button
            type="button"
            onClick={() => setActivePlotTab('influence')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activePlotTab === 'influence'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Shifts &amp; Cook&apos;s Leverage
          </button>

          <button
            type="button"
            onClick={() => setActivePlotTab('stick')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activePlotTab === 'stick'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Diffraction Stick Pattern
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DRIFT EXTRAPOLATION PLOT (a_app & a_corr vs f(theta))              */}
      {/* ========================================================================= */}
      {activePlotTab === 'extrapolation' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Extrapolation Axis: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{driftLabelMap[driftType]}</strong>
            </span>
            <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                <span>Raw Apparent a<sub>app</sub></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Drift-Corrected a<sub>corr</sub></span>
              </span>
              <span>
                Intercept a₀(f=0): <strong className="text-indigo-700 dark:text-indigo-300">{refinedLattice.a.toFixed(precision + 1)} ± {sigmaLattice.sigmaA.toFixed(precision + 2)} Å</strong>
              </span>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="driftVal"
                  name="f(θ)"
                  domain={[0, extrapolationCurveData.maxF || 'auto']}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: `Systematic Error Drift Function: ${driftLabelMap[driftType]}`,
                    position: 'insideBottom',
                    offset: -12,
                    fontSize: 11,
                    fill: '#64748b'
                  }}
                />
                <YAxis
                  type="number"
                  domain={[extrapolationCurveData.yMin, extrapolationCurveData.yMax]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => Number(v).toFixed(4)}
                  label={{
                    value: 'Apparent / Corrected Lattice a (Å)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -5,
                    fontSize: 11,
                    fill: '#64748b'
                  }}
                />
                {sigmaLattice.sigmaA > 0 && (
                  <ReferenceArea
                    y1={refinedLattice.a - 2 * sigmaLattice.sigmaA}
                    y2={refinedLattice.a + 2 * sigmaLattice.sigmaA}
                    fill="#10b981"
                    fillOpacity={0.08}
                  />
                )}
                <ReferenceLine
                  y={refinedLattice.a}
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={{
                    value: `Refined a₀ = ${refinedLattice.a.toFixed(5)} Å`,
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 10
                  }}
                />
                {refLatticeA && (
                  <ReferenceLine
                    y={refLatticeA}
                    stroke="#f59e0b"
                    strokeWidth={1.2}
                    strokeDasharray="2 2"
                    label={{
                      value: `Lit Ref = ${refLatticeA.toFixed(5)} Å`,
                      position: 'insideBottomRight',
                      fill: '#f59e0b',
                      fontSize: 10
                    }}
                  />
                )}
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload.find(p => p.payload?.hkl)?.payload || payload[0].payload;
                    if (!d.hkl) {
                      return (
                        <div className="bg-slate-950 text-white p-2.5 rounded-xl shadow-xl text-xs font-mono border border-slate-800">
                          <div>f(θ) = {d.driftVal}</div>
                          <div className="text-indigo-400">Extrapolation Line: {d.fitLine} Å</div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-800 space-y-1">
                        <div className="text-indigo-400 font-bold font-sans flex items-center justify-between gap-4">
                          <span>Reflection {d.hkl} (#{d.index})</span>
                          <span>2θ = {d.twoTheta.toFixed(3)}°</span>
                        </div>
                        <div>Drift f(θ): <strong>{d.driftVal}</strong></div>
                        <div className="text-indigo-300">Raw Apparent a<sub>app</sub>: <strong>{d.apparentA.toFixed(5)} Å</strong></div>
                        <div className="text-emerald-400">Drift-Corrected a<sub>corr</sub>: <strong>{d.correctedA.toFixed(5)} Å</strong></div>
                        <div className="text-slate-400 text-[10px]">Leverage h_ii = {d.leverageHii} | Δ2θ = {d.deltaTwoTheta.toFixed(4)}°</div>
                      </div>
                    );
                  }}
                />
                <Line
                  data={extrapolationCurveData.points}
                  type="monotone"
                  dataKey="fitLine"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Least-Squares Drift Line"
                  isAnimationActive={false}
                />
                <Scatter
                  name="Raw Apparent a_app"
                  data={residualData}
                  dataKey="apparentA"
                  fill="#6366f1"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined) return <g />;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5.5}
                        fill={payload.isOutlier ? '#f43f5e' : '#6366f1'}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        onClick={() => onTogglePeak && onTogglePeak(payload.id)}
                        className="cursor-pointer"
                      />
                    );
                  }}
                />
                <Scatter
                  name="Drift-Corrected a_corr"
                  data={residualData}
                  dataKey="correctedA"
                  fill="#10b981"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (cx === undefined || cy === undefined) return <g />;
                    return (
                      <rect
                        x={cx - 4}
                        y={cy - 4}
                        width={8}
                        height={8}
                        rx={2}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={1.2}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANGULAR RESIDUALS SCATTER (Delta 2Theta vs 2Theta)                 */}
      {/* ========================================================================= */}
      {activePlotTab === 'residuals' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Angular Residual: <strong className="text-slate-700 dark:text-slate-200 font-mono">Δ2θ = 2θ<sub>obs</sub> − 2θ<sub>calc</sub></strong> (Click point to toggle reflection)
            </span>
            <span className="flex items-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>|Δ2θ| &lt; 0.02°</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>0.02°–0.04°</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Outlier (&gt;0.04°)</span>
              </span>
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="twoTheta"
                  name="2Theta"
                  unit="°"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Diffraction Angle 2θ (°)', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="number"
                  dataKey="deltaTwoTheta"
                  name="Δ2θ"
                  unit="°"
                  domain={[-0.08, 0.08]}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Residual Δ2θ (°)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#64748b' }}
                />
                <ReferenceArea y1={-rmsTwoTheta} y2={rmsTwoTheta} fill="#6366f1" fillOpacity={0.07} />
                <ReferenceLine y={0} stroke="#6366f1" strokeWidth={1.5} />
                <ReferenceLine y={0.02} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={-0.02} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={0.04} stroke="#f59e0b" strokeDasharray="4 4" />
                <ReferenceLine y={-0.04} stroke="#f59e0b" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-800 space-y-1">
                        <div className="text-indigo-400 font-bold font-sans flex items-center justify-between gap-4">
                          <span>Peak #{data.index} {data.hkl}</span>
                          <span className={data.absDelta < 0.02 ? 'text-emerald-400' : data.absDelta < 0.04 ? 'text-amber-400' : 'text-rose-400'}>
                            |Δ2θ|: {data.absDelta.toFixed(4)}°
                          </span>
                        </div>
                        <div className="text-slate-300">2θ Obs: <strong>{data.twoTheta.toFixed(3)}°</strong></div>
                        <div className="text-slate-300">2θ Calc: <strong>{data.twoThetaCalc.toFixed(3)}°</strong></div>
                        <div className="text-slate-300">Δd/d: <strong>{data.deltaDPpm} ppm</strong></div>
                        <div className="text-slate-300">Studentized r*: <strong>{data.studentizedResidual}</strong> | Cook&apos;s D: <strong>{data.cooksDistance}</strong></div>
                        <div className="text-slate-400 text-[10px]">Drift f(θ): {data.driftVal} | Leverage h_ii: {data.leverageHii}</div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={residualData}
                  fill="#6366f1"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined) return <g />;
                    const abs = Math.abs(payload.deltaTwoTheta);
                    const color = abs < 0.02 ? '#10b981' : abs < 0.04 ? '#f59e0b' : '#f43f5e';
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6.5}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        onClick={() => onTogglePeak && onTogglePeak(payload.id)}
                        className="cursor-pointer transition-transform hover:scale-125"
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REFLECTION SHIFTS & COOK'S LEVERAGE BAR CHART                      */}
      {/* ========================================================================= */}
      {activePlotTab === 'influence' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold uppercase text-[10px] tracking-wider">Diagnostic Metric:</span>
              {(
                [
                  { id: 'deltaTwoTheta', label: 'Δ2θ Shift (°)' },
                  { id: 'deltaDPpm', label: 'Δd/d Error (ppm)' },
                  { id: 'studentized', label: 'Studentized r*' },
                  { id: 'cooks', label: "Cook's Distance D_i" }
                ] as const
              ).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInfluenceMetric(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    influenceMetric === m.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
              RMS Δ2θ: ±{rmsTwoTheta.toFixed(4)}°
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={residualData} margin={{ top: 15, right: 20, bottom: 25, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="hkl"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Miller Indices (h k l)', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{
                    value:
                      influenceMetric === 'deltaTwoTheta'
                        ? 'Δ2θ Shift (°)'
                        : influenceMetric === 'deltaDPpm'
                        ? 'Δd/d Error (ppm)'
                        : influenceMetric === 'studentized'
                        ? 'Studentized Residual r*'
                        : "Cook's Distance D_i",
                    angle: -90,
                    position: 'insideLeft',
                    offset: 0,
                    fontSize: 11,
                    fill: '#64748b'
                  }}
                />
                <ReferenceLine y={0} stroke="#64748b" />
                {influenceMetric === 'studentized' && (
                  <>
                    <ReferenceLine y={2.0} stroke="#f59e0b" strokeDasharray="3 3" />
                    <ReferenceLine y={-2.0} stroke="#f59e0b" strokeDasharray="3 3" />
                  </>
                )}
                {influenceMetric === 'cooks' && (
                  <ReferenceLine
                    y={4 / Math.max(4, residualData.length)}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'High Influence Threshold (4/N)', position: 'insideTopRight', fill: '#f43f5e', fontSize: 10 }}
                  />
                )}
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-800 space-y-1">
                        <div className="text-indigo-400 font-bold font-sans">
                          Reflection {d.hkl} (#{d.index}) — 2θ = {d.twoTheta.toFixed(3)}°
                        </div>
                        <div>Δ2θ: <strong>{d.deltaTwoTheta > 0 ? `+${d.deltaTwoTheta.toFixed(4)}` : d.deltaTwoTheta.toFixed(4)}°</strong></div>
                        <div>Δd/d: <strong>{d.deltaDPpm} ppm</strong></div>
                        <div>Studentized r*: <strong>{d.studentizedResidual}</strong></div>
                        <div>Cook&apos;s Distance D_i: <strong>{d.cooksDistance}</strong> (Leverage h_ii = {d.leverageHii})</div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey={
                    influenceMetric === 'deltaTwoTheta'
                      ? 'deltaTwoTheta'
                      : influenceMetric === 'deltaDPpm'
                      ? 'deltaDPpm'
                      : influenceMetric === 'studentized'
                      ? 'studentizedResidual'
                      : 'cooksDistance'
                  }
                  radius={[4, 4, 4, 4]}
                >
                  {residualData.map((entry, index) => {
                    const isWarn =
                      influenceMetric === 'cooks'
                        ? entry.cooksDistance > 4 / Math.max(4, residualData.length)
                        : entry.isOutlier;
                    const fill = isWarn ? '#f43f5e' : Math.abs(entry.deltaTwoTheta) < 0.02 ? '#10b981' : '#6366f1';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DIFFRACTION STICK PATTERN OVERLAY                                  */}
      {/* ========================================================================= */}
      {activePlotTab === 'stick' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Indexed Bragg Stick Pattern (I<sub>rel</sub> vs. 2θ<sub>obs</sub>) with Zero-Drift Position Comparison
            </span>
            <span className="font-mono text-xs text-slate-500">
              λ = {wavelength} Å | {crystalSystem} Symmetry
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={residualData} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  dataKey="twoTheta"
                  domain={['auto', 'auto']}
                  unit="°"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Bragg Angle 2θ (°)', position: 'insideBottom', offset: -12, fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  domain={[0, 110]}
                  unit="%"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Relative Intensity (%)', angle: -90, position: 'insideLeft', offset: 0, fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs font-mono border border-slate-800 space-y-1">
                        <div className="text-indigo-400 font-bold font-sans">
                          Reflection {d.hkl} (I = {d.intensity}%)
                        </div>
                        <div>2θ Observed: <strong>{d.twoTheta.toFixed(3)}°</strong></div>
                        <div>2θ Refined (w/ Drift): <strong>{d.twoThetaCalc.toFixed(3)}°</strong></div>
                        <div className="text-emerald-400">2θ Zero-Drift Ideal: <strong>{d.twoThetaZeroDrift.toFixed(3)}°</strong></div>
                        <div>Residual Δ2θ: <strong>{d.deltaTwoTheta.toFixed(4)}°</strong></div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="intensity" barSize={6} fill="#6366f1" radius={[3, 3, 0, 0]} name="Relative Intensity (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
