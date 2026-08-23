import React from 'react';
import { DolleHaukAnalysis } from '../../utils/residualStressPhysics';
import { Split, Info, ArrowUpRight, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ErrorBar
} from 'recharts';

interface DolleHaukSplitViewProps {
  dolleHauk: DolleHaukAnalysis;
  d0: number;
  lengthUnit: string;
  isDarkMode: boolean;
}

export const DolleHaukSplitView: React.FC<DolleHaukSplitViewProps> = ({
  dolleHauk,
  d0,
  lengthUnit,
  isDarkMode
}) => {
  const {
    pairs,
    sigmaPhi,
    sigmaPhiError,
    tau13,
    tau13Error,
    hasSignificantSplitting,
    rSquaredA1,
    rSquaredA2,
    slopeA1,
    slopeA2
  } = dolleHauk;

  // Chart data for a1 (Symmetric average d vs sin²ψ)
  const chartDataA1 = pairs.map(p => {
    const fittedA1 = slopeA1 * p.sin2psi + (pairs[0]?.a1_dSymm - slopeA1 * pairs[0]?.sin2psi || d0);
    return {
      psi: `${p.psiDeg}°`,
      sin2psi: p.sin2psi,
      a1: p.a1_dSymm,
      fittedA1,
      errorA1: p.errorA1,
      dPos: p.dPos,
      dNeg: p.dNeg
    };
  });

  // Chart data for a2 (Antisymmetric difference vs sin(2ψ))
  const chartDataA2 = pairs.map(p => {
    const fittedA2 = slopeA2 * p.sin2absPsi;
    return {
      psi: `${p.psiDeg}°`,
      sin2absPsi: p.sin2absPsi,
      a2: p.a2_dAnti,
      fittedA2,
      errorA2: p.errorA2
    };
  });

  if (pairs.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
        <Split className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
          No Symmetric ±ψ Tilt Angle Pairs Found
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          To activate Dölle-Hauk shear stress analysis, include matching positive and negative tilt angles (e.g. ±15°, ±30°, ±45°, ±60°).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        hasSignificantSplitting
          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
          : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            hasSignificantSplitting
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Split className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {hasSignificantSplitting
                ? 'ψ-Splitting Detected: Significant Surface Shear Stress τ₁₃'
                : 'Linear Symmetric Branch: Minimal Shear Stress'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {hasSignificantSplitting
                ? `Directional machining or grinding shear induces out-of-plane shear stress τ₁₃ = ${tau13.toFixed(1)} ± ${tau13Error.toFixed(1)} MPa.`
                : 'Measured d(+ψ) and d(-ψ) coincide closely, indicating a purely normal biaxial residual stress field.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-center">
            <span className="text-[9px] text-slate-400 block font-sans">Shear τ₁₃</span>
            <span className={`text-sm font-black ${Math.abs(tau13) > 15 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {tau13.toFixed(1)} MPa
            </span>
          </div>
          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-center">
            <span className="text-[9px] text-slate-400 block font-sans">Normal σ_φ</span>
            <span className={`text-sm font-black ${sigmaPhi > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {sigmaPhi.toFixed(1)} MPa
            </span>
          </div>
        </div>
      </div>

      {/* Dual Plots: a1 (Symmetric) and a2 (Antisymmetric) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plot 1: a1 = [d(+ψ) + d(-ψ)]/2 vs sin²ψ */}
        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Symmetric Average a₁(ψ) vs sin²ψ
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                a₁ = ½[d(+ψ) + d(-ψ)] → Yields Normal Stress σ_φ
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
              R² = {rSquaredA1.toFixed(4)}
            </span>
          </div>

          <div className="h-[230px] w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataA1} margin={{ top: 10, right: 15, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis
                  dataKey="sin2psi"
                  type="number"
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  label={{ value: 'sin²ψ', position: 'bottom', offset: 0, fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                />
                <YAxis
                  dataKey="a1"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  tickFormatter={v => Number(v).toFixed(4)}
                  label={{ value: `a₁ (${lengthUnit})`, angle: -90, position: 'insideLeft', fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#090d16' : '#ffffff',
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(5)} ${lengthUnit}`, 'a₁ Average']}
                />
                <Line type="monotone" dataKey="fittedA1" stroke={isDarkMode ? '#818cf8' : '#6366f1'} strokeWidth={2.5} dot={false} />
                <Scatter dataKey="a1" fill={isDarkMode ? '#f8fafc' : '#0f172a'} shape="circle" r={4.5}>
                  <ErrorBar dataKey="errorA1" width={3} strokeWidth={1.5} stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex justify-between">
            <span className="text-slate-500">Slope: {(slopeA1 * 1000).toFixed(4)} × 10⁻³ {lengthUnit}</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">σ_φ = {sigmaPhi.toFixed(1)} ± {sigmaPhiError.toFixed(1)} MPa</span>
          </div>
        </div>

        {/* Plot 2: a2 = [d(+ψ) - d(-ψ)]/2 vs sin(2|ψ|) */}
        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-500" />
                Antisymmetric Difference a₂(ψ) vs sin(2ψ)
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                a₂ = ½[d(+ψ) - d(-ψ)] → Yields Shear Stress τ₁₃
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
              R² = {rSquaredA2.toFixed(4)}
            </span>
          </div>

          <div className="h-[230px] w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartDataA2} margin={{ top: 10, right: 15, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis
                  dataKey="sin2absPsi"
                  type="number"
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  label={{ value: 'sin(2|ψ|)', position: 'bottom', offset: 0, fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                />
                <YAxis
                  dataKey="a2"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                  tickFormatter={v => Number(v).toFixed(5)}
                  label={{ value: `a₂ (${lengthUnit})`, angle: -90, position: 'insideLeft', fontSize: 11, fill: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: 'bold' }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#090d16' : '#ffffff',
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(5)} ${lengthUnit}`, 'a₂ Difference']}
                />
                <Line type="monotone" dataKey="fittedA2" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                <Scatter dataKey="a2" fill="#f59e0b" shape="circle" r={4.5}>
                  <ErrorBar dataKey="errorA2" width={3} strokeWidth={1.5} stroke={isDarkMode ? '#94a3b8' : '#64748b'} />
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex justify-between">
            <span className="text-slate-500">Shear Slope: {(slopeA2 * 1000).toFixed(4)} × 10⁻³ {lengthUnit}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">τ₁₃ = {tau13.toFixed(1)} ± {tau13Error.toFixed(1)} MPa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
