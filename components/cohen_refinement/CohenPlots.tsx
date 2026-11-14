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
  Cell
} from 'recharts';
import { Activity, BarChart2, TrendingUp, Layers, Crosshair } from 'lucide-react';
import { CrystalSystem, DriftFunctionType } from './CohenPresetsDb';
import { CohenPeakDetail, IrlsIterationStep } from './CohenSolver';

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
  irlsHistory?: IrlsIterationStep[];
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
  irlsHistory,
  onTogglePeak
}) => {
  const [activePlotTab, setActivePlotTab] = useState<'extrapolation' | 'residuals' | 'influence' | 'stick'>('extrapolation');
  const [residualYMode, setResidualYMode] = useState<'deltaTwoTheta' | 'deltaDPpm'>('deltaTwoTheta');
  const [influenceMetric, setInfluenceMetric] = useState<'deltaTwoTheta' | 'deltaDPpm' | 'studentized' | 'cooks' | 'looDeltaA'>('deltaTwoTheta');

  const driftLabelMap: Record<DriftFunctionType, string> = {
    none: 'Zero Drift (Ref: Nelson-Riley f_NR(θ))',
    nelson_riley: 'Nelson-Riley f_NR(θ) = ½(cos²θ/sinθ + cos²θ/θ)',
    taylor_sinclair: 'Taylor-Sinclair cos²θ / θ',
    bradley_jay: 'Bradley-Jay cos²θ / (2sin²θ)',
    sample_displacement: 'Sample Displacement ½ cos²θ / sinθ',
    hess_hagg: 'Hess-Hägg Transparency 2 cos²θ',
    zero_shift: 'Encoder Zero-Shift cot(θ)',
    flat_specimen: 'Flat Specimen ½ cos²θ(1 - ½sinθ)/sin²θ',
    dual_drift: 'Dual-Drift Primary f_NR(θ)'
  };

  // Prepare data for Residuals, Extrapolation & Influence Plots
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
      looDeltaAMilli: parseFloat(((p.looDeltaA ?? 0) * 1000).toFixed(4)), // milli-Angstrom shift
      driftVal: parseFloat(p.driftVal.toFixed(5)),
      extrapX: parseFloat((p.extrapAbscissa ?? p.driftVal).toFixed(4)),
      weight: parseFloat(p.weight.toFixed(3)),
      irlsFactor: parseFloat((p.irlsFactor ?? 1).toFixed(3)),
      apparentA: parseFloat((p.apparentA ?? refinedLattice.a).toFixed(5)),
      correctedA: parseFloat((p.correctedA ?? refinedLattice.a).toFixed(5)),
      intensity: p.intensity || 100,
      isOutlier: Boolean(p.isOutlier)
    }));
  }, [peakDetails, refinedLattice.a]);

  // Weighted OLS Regression of apparentA vs exact Extrapolation Abscissa x(theta) = g_D / (2*sin^2 theta)
  const extrapolationCurveData = useMemo(() => {
    if (!residualData.length) {
      return {
        points: [],
        slopeA: 0,
        interceptA: refinedLattice.a,
        r2: 1,
        maxF: 1,
        yMin: refinedLattice.a - 0.01,
        yMax: refinedLattice.a + 0.01
      };
    }

    let sumW = 0, sumWX = 0, sumWY = 0, sumWXX = 0, sumWXY = 0, sumWYY = 0;
    for (const d of residualData) {
      const w = Math.max(1e-4, d.weight * d.irlsFactor);
      sumW += w;
      sumWX += w * d.extrapX;
      sumWY += w * d.apparentA;
      sumWXX += w * d.extrapX * d.extrapX;
      sumWXY += w * d.extrapX * d.apparentA;
      sumWYY += w * d.apparentA * d.apparentA;
    }

    const denom = sumW * sumWXX - sumWX * sumWX;
    const slopeA = Math.abs(denom) > 1e-10
      ? (sumW * sumWXY - sumWX * sumWY) / denom
      : -refinedLattice.a * driftD;
    const interceptA = Math.abs(denom) > 1e-10
      ? (sumWXX * sumWY - sumWX * sumWXY) / denom
      : refinedLattice.a;

    const meanY = sumWY / Math.max(1e-12, sumW);
    const ssTot = Math.max(1e-14, sumWYY - sumW * meanY * meanY);
    let ssRes = 0;
    for (const d of residualData) {
      const w = Math.max(1e-4, d.weight * d.irlsFactor);
      const err = d.apparentA - (interceptA + slopeA * d.extrapX);
      ssRes += w * err * err;
    }
    const r2 = Math.max(0, Math.min(1, 1 - ssRes / ssTot));

    const maxF = Math.max(...residualData.map(d => d.extrapX), 0.2) * 1.08;
    const steps = 25;
    const curvePoints = [];
    for (let i = 0; i <= steps; i++) {
      const fVal = (maxF * i) / steps;
      const fitA = interceptA + slopeA * fVal;
      curvePoints.push({
        extrapX: parseFloat(fVal.toFixed(4)),
        fitLine: parseFloat(fitA.toFixed(5)),
        zeroDriftLine: parseFloat(refinedLattice.a.toFixed(5))
      });
    }

    const allA = [
      ...residualData.map(d => d.apparentA),
      ...residualData.map(d => d.correctedA),
      refinedLattice.a,
      interceptA,
      ...(refLatticeA ? [refLatticeA] : [])
    ];
    const minVal = Math.min(...allA);
    const maxVal = Math.max(...allA);
    const pad = Math.max(0.0006, (maxVal - minVal) * 0.25);

    return {
      points: curvePoints,
      slopeA,
      interceptA,
      r2,
      maxF,
      yMin: parseFloat((minVal - pad).toFixed(5)),
      yMax: parseFloat((maxVal + pad).toFixed(5))
    };
  }, [residualData, refinedLattice.a, driftD, refLatticeA]);

  // Auto-scaled symmetric residual domain
  const residualDomain = useMemo(() => {
    if (!residualData.length) return [-0.05, 0.05];
    if (residualYMode === 'deltaTwoTheta') {
      const maxAbs = Math.max(0.03, ...residualData.map(d => Math.abs(d.deltaTwoTheta)));
      const bound = parseFloat((maxAbs * 1.25).toFixed(3));
      return [-bound, bound];
    }
    const maxPpm = Math.max(150, ...residualData.map(d => Math.abs(d.deltaDPpm)));
    const bound = Math.ceil((maxPpm * 1.25) / 50) * 50;
    return [-bound, bound];
  }, [residualData, residualYMode]);

  // Stick overlay combining observed bars and calculated peak positions
  const stickDomain = useMemo(() => {
    if (!residualData.length) return [10, 90];
    const minT = Math.max(5, Math.floor(Math.min(...residualData.map(d => d.twoTheta)) - 5));
    const maxT = Math.min(175, Math.ceil(Math.max(...residualData.map(d => d.twoTheta)) + 5));
    return [minT, maxT];
  }, [residualData]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Refinement Convergence &amp; Residual Diagnostics
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Zero-drift extrapolation f(θ) → 0, angular/d-spacing residuals, Cook&apos;s leverage &amp; LOO sensitivity (click points to toggle peak inclusion)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          {(
            [
              { id: 'extrapolation', label: 'Extrapolation f(θ)→0', Icon: TrendingUp },
              { id: 'residuals', label: 'Residuals', Icon: Crosshair },
              { id: 'influence', label: "Influence & LOO Δa", Icon: BarChart2 },
              { id: 'stick', label: 'Bragg Stick & IRLS', Icon: Layers }
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActivePlotTab(id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activePlotTab === id
                  ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DRIFT EXTRAPOLATION PLOT */}
      {activePlotTab === 'extrapolation' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="truncate">
              Abscissa: <strong className="text-cyan-700 dark:text-cyan-400 font-mono">{driftLabelMap[driftType]}</strong>
            </span>
            <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                <span>Apparent a<sub>app</sub></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 inline-block" />
                <span>Corrected a<sub>corr</sub></span>
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                R² = <strong>{extrapolationCurveData.r2.toFixed(4)}</strong>
              </span>
              <span>
                a₀ = <strong className="text-indigo-700 dark:text-indigo-300">{refinedLattice.a.toFixed(precision + 1)} ± {sigmaLattice.sigmaA.toFixed(precision + 2)} Å</strong>
              </span>
            </div>
          </div>

          <div className="h-72 sm:h-80 w-full cursor-crosshair">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart margin={{ top: 15, right: 25, bottom: 25, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis
                  type="number"
                  dataKey="extrapX"
                  name="x(θ)"
                  domain={[0, extrapolationCurveData.maxF || 'auto']}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: `Extrapolation Coordinate x(θ) = g_D(θ) / 2sin²θ  [${driftType.replace('_', ' ')}]`,
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
                    value: 'Lattice Parameter a (Å)',
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
                    value: `a₀ = ${refinedLattice.a.toFixed(5)} Å`,
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
                      value: `Ref = ${refLatticeA.toFixed(5)} Å`,
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
                        <div className="bg-slate-950 text-white p-2.5 rounded-lg text-xs font-mono tabular-nums border border-slate-800">
                          <div>x(θ) = {d.extrapX}</div>
                          <div className="text-cyan-400">WLS Drift Fit: {d.fitLine} Å</div>
                        </div>
                      );
                    }
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-lg text-xs font-mono tabular-nums border border-slate-800 space-y-1">
                        <div className="text-cyan-400 font-bold font-sans flex items-center justify-between gap-4">
                          <span>Reflection {d.hkl} (#{d.index})</span>
                          <span>2θ = {d.twoTheta.toFixed(3)}°</span>
                        </div>
                        <div>x(θ): <strong>{d.extrapX}</strong> | g_D: <strong>{d.driftVal}</strong></div>
                        <div className="text-indigo-300">Apparent a<sub>app</sub>: <strong>{d.apparentA.toFixed(5)} Å</strong></div>
                        <div className="text-emerald-400">Corrected a<sub>corr</sub>: <strong>{d.correctedA.toFixed(5)} Å</strong></div>
                        <div className="text-slate-400 text-[10px]">
                          LOO Δa: {d.looDeltaAMilli > 0 ? `+${d.looDeltaAMilli}` : d.looDeltaAMilli} mÅ | h_ii = {d.leverageHii}
                        </div>
                      </div>
                    );
                  }}
                />
                <Line
                  data={extrapolationCurveData.points}
                  type="monotone"
                  dataKey="fitLine"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  name="Weighted Extrapolation Fit"
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
                        r={payload.isOutlier ? 6.5 : 5}
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
                        x={cx - 3.5}
                        y={cy - 3.5}
                        width={7}
                        height={7}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={1.1}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: ANGULAR & D-SPACING RESIDUALS */}
      {activePlotTab === 'residuals' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span>Residual Metric:</span>
              <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setResidualYMode('deltaTwoTheta')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    residualYMode === 'deltaTwoTheta' ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300' : 'text-slate-500'
                  }`}
                >
                  Δ2θ (°)
                </button>
                <button
                  type="button"
                  onClick={() => setResidualYMode('deltaDPpm')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    residualYMode === 'deltaDPpm' ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-300' : 'text-slate-500'
                  }`}
                >
                  Δd/d (ppm)
                </button>
              </div>
            </div>
            <span className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
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
                <span>Outlier (&gt;0.04° or |r*|&gt;2.5)</span>
              </span>
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full cursor-crosshair">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
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
                  dataKey={residualYMode}
                  name={residualYMode === 'deltaTwoTheta' ? 'Δ2θ' : 'Δd/d'}
                  unit={residualYMode === 'deltaTwoTheta' ? '°' : ' ppm'}
                  domain={residualDomain}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: residualYMode === 'deltaTwoTheta' ? 'Residual Δ2θ (°)' : 'Relative d-Spacing Error Δd/d (ppm)',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 0,
                    fontSize: 11,
                    fill: '#64748b'
                  }}
                />
                {residualYMode === 'deltaTwoTheta' && (
                  <>
                    <ReferenceArea y1={-rmsTwoTheta} y2={rmsTwoTheta} fill="#06b6d4" fillOpacity={0.08} />
                    <ReferenceLine y={0.02} stroke="#10b981" strokeDasharray="3 3" />
                    <ReferenceLine y={-0.02} stroke="#10b981" strokeDasharray="3 3" />
                    <ReferenceLine y={0.04} stroke="#f59e0b" strokeDasharray="4 4" />
                    <ReferenceLine y={-0.04} stroke="#f59e0b" strokeDasharray="4 4" />
                  </>
                )}
                <ReferenceLine y={0} stroke="#06b6d4" strokeWidth={1.5} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-lg text-xs font-mono tabular-nums border border-slate-800 space-y-1">
                        <div className="text-cyan-400 font-bold font-sans flex items-center justify-between gap-4">
                          <span>Peak #{data.index} {data.hkl}</span>
                          <span className={data.absDelta < 0.02 ? 'text-emerald-400' : data.absDelta < 0.04 ? 'text-amber-400' : 'text-rose-400'}>
                            |Δ2θ|: {data.absDelta.toFixed(4)}°
                          </span>
                        </div>
                        <div className="text-slate-300">2θ Obs / Calc: <strong>{data.twoTheta.toFixed(3)}°</strong> / <strong>{data.twoThetaCalc.toFixed(3)}°</strong></div>
                        <div className="text-slate-300">Δd/d: <strong>{data.deltaDPpm} ppm</strong> | IRLS w: <strong>{data.irlsFactor}</strong></div>
                        <div className="text-slate-300">Studentized r*: <strong>{data.studentizedResidual}</strong> | Cook&apos;s D: <strong>{data.cooksDistance}</strong></div>
                        <div className="text-slate-400 text-[10px]">LOO Δa: {data.looDeltaAMilli} mÅ | Leverage h_ii: {data.leverageHii}</div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={residualData}
                  fill="#06b6d4"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (cx === undefined || cy === undefined) return <g />;
                    const abs = Math.abs(payload.deltaTwoTheta);
                    const color = payload.isOutlier || abs >= 0.04 ? '#f43f5e' : abs < 0.02 ? '#10b981' : '#f59e0b';
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        onClick={() => onTogglePeak && onTogglePeak(payload.id)}
                        className="cursor-pointer"
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 3: INFLUENCE, COOK'S DISTANCE & LEAVE-ONE-OUT LATTICE SENSITIVITY */}
      {activePlotTab === 'influence' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold uppercase text-[10px] tracking-wider">Metric:</span>
              {(
                [
                  { id: 'deltaTwoTheta', label: 'Δ2θ (°)' },
                  { id: 'deltaDPpm', label: 'Δd/d (ppm)' },
                  { id: 'studentized', label: 'Studentized r*' },
                  { id: 'cooks', label: "Cook's D_i" },
                  { id: 'looDeltaA', label: 'LOO Δa (mÅ)' }
                ] as const
              ).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInfluenceMetric(m.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors border ${
                    influenceMetric === m.id
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span className="font-mono tabular-nums text-cyan-700 dark:text-cyan-400 font-bold">
              RMS Δ2θ: ±{rmsTwoTheta.toFixed(4)}°
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={residualData} margin={{ top: 15, right: 20, bottom: 25, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis
                  dataKey="hkl"
                  tick={{ fontSize: 10 }}
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
                        : influenceMetric === 'looDeltaA'
                        ? 'Leave-One-Out Shift Δa₀ (mÅ)'
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
                    <ReferenceLine y={2.5} stroke="#f43f5e" strokeDasharray="3 3" />
                    <ReferenceLine y={-2.5} stroke="#f43f5e" strokeDasharray="3 3" />
                  </>
                )}
                {influenceMetric === 'cooks' && (
                  <ReferenceLine
                    y={4 / Math.max(4, residualData.length)}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    label={{ value: 'Threshold (4/N)', position: 'insideTopRight', fill: '#f43f5e', fontSize: 10 }}
                  />
                )}
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3 rounded-lg text-xs font-mono tabular-nums border border-slate-800 space-y-1">
                        <div className="text-cyan-400 font-bold font-sans">
                          Reflection {d.hkl} (#{d.index}) — 2θ = {d.twoTheta.toFixed(3)}°
                        </div>
                        <div>Δ2θ: <strong>{d.deltaTwoTheta > 0 ? `+${d.deltaTwoTheta.toFixed(4)}` : d.deltaTwoTheta.toFixed(4)}°</strong></div>
                        <div>Δd/d: <strong>{d.deltaDPpm} ppm</strong> | LOO Δa₀: <strong>{d.looDeltaAMilli} mÅ</strong></div>
                        <div>Studentized r*: <strong>{d.studentizedResidual}</strong> | Cook&apos;s D: <strong>{d.cooksDistance}</strong></div>
                        <div className="text-slate-400 text-[10px]">Leverage h_ii = {d.leverageHii} | Weight = {d.weight}</div>
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
                      : influenceMetric === 'looDeltaA'
                      ? 'looDeltaAMilli'
                      : 'cooksDistance'
                  }
                  radius={[3, 3, 3, 3]}
                >
                  {residualData.map((entry, index) => {
                    const isWarn =
                      influenceMetric === 'cooks'
                        ? entry.cooksDistance > 4 / Math.max(4, residualData.length)
                        : entry.isOutlier;
                    const fill = isWarn ? '#f43f5e' : Math.abs(entry.deltaTwoTheta) < 0.02 ? '#10b981' : '#06b6d4';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: DIFFRACTION STICK PATTERN & HUBER IRLS CONVERGENCE */}
      {activePlotTab === 'stick' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Indexed Bragg Stick Profile (I<sub>rel</sub> vs 2θ) — <span className="text-indigo-500 font-semibold">Observed</span> vs <span className="text-emerald-500 font-semibold">Zero-Drift Ideal</span>
            </span>
            <span className="font-mono tabular-nums text-xs text-slate-500">
              λ = {wavelength} Å | {crystalSystem} Symmetry
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={residualData} margin={{ top: 15, right: 25, bottom: 25, left: 15 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                <XAxis
                  type="number"
                  dataKey="twoTheta"
                  domain={stickDomain}
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
                      <div className="bg-slate-950 text-white p-3 rounded-lg text-xs font-mono tabular-nums border border-slate-800 space-y-1">
                        <div className="text-cyan-400 font-bold font-sans">
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
                <Bar dataKey="intensity" barSize={5} fill="#6366f1" radius={[2, 2, 0, 0]} name="Observed Intensity (%)" />
                <Scatter
                  dataKey="intensity"
                  data={residualData.map(d => ({ ...d, twoTheta: d.twoThetaZeroDrift }))}
                  fill="#10b981"
                  name="Zero-Drift 2θ"
                  shape={(props: any) => {
                    const { cx, cy } = props;
                    if (cx === undefined || cy === undefined) return <g />;
                    return <polygon points={`${cx},${cy - 5} ${cx - 4},${cy + 2} ${cx + 4},${cy + 2}`} fill="#10b981" />;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {irlsHistory && irlsHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Huber IRLS Robust Weighting Convergence Trace ({irlsHistory.length} Iterations)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono tabular-nums text-left border border-slate-200 dark:border-slate-800 rounded-lg">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Iter</th>
                      <th className="p-2">RMS Δ2θ (°)</th>
                      <th className="p-2">Weighted RSS</th>
                      <th className="p-2">MAD Scale σ_MAD</th>
                      <th className="p-2">Down-weighted Peaks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {irlsHistory.map(step => (
                      <tr key={step.iteration}>
                        <td className="p-2 font-bold text-cyan-700 dark:text-cyan-400">#{step.iteration}</td>
                        <td className="p-2">±{step.rmsTwoThetaDeg.toFixed(5)}°</td>
                        <td className="p-2">{step.weightedRss.toExponential(3)}</td>
                        <td className="p-2">{step.huberScale.toExponential(3)}</td>
                        <td className="p-2">{step.downweightedCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
