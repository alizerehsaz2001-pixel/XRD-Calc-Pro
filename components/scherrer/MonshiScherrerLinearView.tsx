import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
  Legend,
  Area,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Table,
  Copy,
  Check,
  Download,
  Filter,
  Sliders,
  Activity,
  BarChart2
} from 'lucide-react';
import { motion } from 'motion/react';
import { ScherrerInput, ScherrerResult } from '../../types';
import { calculateMonshiScherrer } from '../../utils/physics';

interface MonshiScherrerLinearViewProps {
  results: ScherrerResult[];
  wavelength: number;
  kFactor: number;
  instFwhm?: number;
  broadeningModel?: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'de Keijser' | 'Halder-Wagner';
  useCaglioti?: boolean;
  caglioti?: { u: number; v: number; w: number };
  pseudoVoigtEta?: number;
  zeroShiftDeg?: number;
  kAlpha2Correction?: boolean;
  onTogglePeakExclusion?: (index: number) => void;
  onAutoPruneOutliers?: () => void;
}

export const MonshiScherrerLinearView: React.FC<MonshiScherrerLinearViewProps> = ({
  results,
  wavelength,
  kFactor,
  instFwhm = 0.08,
  broadeningModel = 'Gaussian',
  useCaglioti = false,
  caglioti = { u: 0.004, v: -0.002, w: 0.01 },
  pseudoVoigtEta = 0.5,
  zeroShiftDeg = 0,
  kAlpha2Correction = false,
  onTogglePeakExclusion,
  onAutoPruneOutliers
}) => {
  const [regressionWeighting, setRegressionWeighting] = useState<'OLS' | 'WLS-CosTheta' | 'Huber-Robust'>('OLS');
  const [subView, setSubView] = useState<'logPlot' | 'residuals' | 'comparison'>('logPlot');
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [showConstrainedLine, setShowConstrainedLine] = useState<boolean>(true);
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);

  const peaksInput = useMemo<ScherrerInput[]>(() => {
    return results.map((r) => ({
      twoTheta: r.twoTheta,
      fwhmObs: r.fwhmObs,
      intensity: r.intensity,
      hkl: r.hkl,
      excluded: r.excluded
    }));
  }, [results]);

  const excludedIndices = useMemo(() => {
    const idxs: number[] = [];
    results.forEach((r, idx) => {
      if (r.excluded) idxs.push(idx);
    });
    return idxs;
  }, [results]);

  const mappedBroadeningModel = useMemo<'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Voigt'>(() => {
    if (broadeningModel === 'Lorentzian') return 'Lorentzian';
    if (broadeningModel === 'Pseudo-Voigt') return 'Pseudo-Voigt';
    if (broadeningModel === 'de Keijser' || broadeningModel === 'Halder-Wagner') return 'Voigt';
    return 'Gaussian';
  }, [broadeningModel]);

  const msResult = useMemo(() => {
    if (peaksInput.length < 2) return null;
    return calculateMonshiScherrer(
      wavelength,
      kFactor,
      instFwhm,
      peaksInput,
      mappedBroadeningModel,
      useCaglioti ? 'caglioti' : 'constant',
      { U: caglioti.u, V: caglioti.v, W: caglioti.w },
      {
        zeroShiftDeg,
        pvEta: pseudoVoigtEta,
        kAlpha2Correction,
        regressionWeighting,
        excludedIndices
      }
    );
  }, [
    wavelength,
    kFactor,
    instFwhm,
    peaksInput,
    mappedBroadeningModel,
    useCaglioti,
    caglioti,
    zeroShiftDeg,
    pseudoVoigtEta,
    kAlpha2Correction,
    regressionWeighting,
    excludedIndices
  ]);

  const chartData = useMemo(() => {
    if (!msResult || msResult.pointsExtended.length < 2) return null;

    const activePts = msResult.pointsExtended.filter((p) => !p.excluded);
    if (activePts.length < 2) return null;

    const allX = msResult.pointsExtended.map((p) => p.x);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const span = Math.max(0.008, maxX - minX);
    const pad = span * 0.12;
    const startX = Math.max(0, minX - pad);
    const endX = maxX + pad;

    const n = activePts.length;
    const meanX = activePts.reduce((s, p) => s + p.x, 0) / n;
    const ssX = activePts.reduce((s, p) => s + Math.pow(p.x - meanX, 2), 0);
    const rmse = msResult.rmse || 0.01;
    const tCrit = n <= 3 ? 4.303 : n === 4 ? 3.182 : n === 5 ? 2.776 : n <= 7 ? 2.447 : 2.15;

    const pointsWithBand = msResult.pointsExtended
      .map((p) => {
        const fitY = msResult.slope * p.x + msResult.intercept;
        const constrainedY = 1.0 * p.x + (msResult.constrainedIntercept ?? msResult.intercept);
        const seFit = ssX > 0 ? rmse * Math.sqrt(1 / n + Math.pow(p.x - meanX, 2) / ssX) : rmse;
        const halfBand = tCrit * seFit;
        return {
          ...p,
          hklLabel: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(1)}°`,
          yActive: p.excluded ? null : p.y,
          yExcluded: p.excluded ? p.y : null,
          fitY,
          constrainedY,
          ciRange: [fitY - halfBand, fitY + halfBand]
        };
      })
      .sort((a, b) => a.x - b.x);

    return {
      points: pointsWithBand,
      startX,
      endX
    };
  }, [msResult]);

  const handleCopyLatex = () => {
    if (!msResult) return;
    const latex = `\\begin{align*}
\\text{Monshi-Scherrer Linearization: } \\ln(\\beta_{\\text{sample}}) &= m \\cdot \\ln\\left(\\frac{1}{\\cos\\theta}\\right) + \\ln\\left(\\frac{K\\lambda}{D}\\right) \\\\
\\text{Estimator: } \\text{${regressionWeighting}} &\\quad m = ${msResult.slope.toFixed(4)} \\pm ${(msResult.slopeStdErr || 0).toFixed(4)}, \\quad C = ${msResult.intercept.toFixed(4)} \\pm ${(msResult.interceptStdErr || 0).toFixed(4)} \\\\
\\text{Goodness of Fit: } R^2 &= ${(msResult.rSquared * 100).toFixed(2)}\\%, \\quad \\text{RMSE} = ${(msResult.rmse || 0).toFixed(5)} \\\\
\\text{Free-Slope Size: } D_{\\text{MS}} &= ${msResult.sizeNm.toFixed(2)} \\pm ${(msResult.sizeUncertaintyNm || 0).toFixed(2)} \\text{ nm}, \\quad D_{m=1} = ${(msResult.constrainedSizeNm || msResult.sizeNm).toFixed(2)} \\text{ nm}
\\end{align*}`;
    navigator.clipboard.writeText(latex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2400);
  };

  const handleDownloadCsv = () => {
    if (!msResult || !msResult.pointsExtended) return;
    let csv =
      'Index,Status,2Theta_deg,hkl,d_hkl_A,FWHM_obs_deg,FWHM_inst_deg,beta_sample_rad,X_ln_inv_cos_theta,Y_ln_beta_rad,Fitted_Y,Constrained_Y_m1,Residual_dY,Std_Residual_z,Single_Peak_D_nm\n';
    msResult.pointsExtended.forEach((p, i) => {
      const hklStr = p.hkl ? `"(${p.hkl.join('')})"` : '""';
      const status = p.excluded ? 'Excluded' : p.isOutlier ? 'Outlier' : 'Active';
      csv += `${i + 1},${status},${p.twoTheta.toFixed(4)},${hklStr},${(p.dSpacingAngstrom || 0).toFixed(4)},${p.fwhmObs.toFixed(4)},${p.fwhmInst.toFixed(4)},${p.betaCorrectedRad.toFixed(6)},${p.x.toFixed(6)},${p.y.toFixed(6)},${(p.yFitted || 0).toFixed(6)},${(p.yConstrained || 0).toFixed(6)},${(p.residual || 0).toFixed(6)},${(p.standardizedResidual || 0).toFixed(4)},${p.singlePeakSizeNm.toFixed(3)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monshi_scherrer_${regressionWeighting.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!msResult || !chartData) {
    return (
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
        Monshi-Scherrer logarithmic regression requires at least 2 valid reflections across a range of 2θ angles.
      </div>
    );
  }

  const slopeDeviation = Math.abs(msResult.slope - 1.0);
  const isPureSize = slopeDeviation <= 0.22 && msResult.rSquared >= 0.85;

  return (
    <div className="space-y-4">
      {/* Top Control & Regression Estimator Header */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Monshi-Scherrer Logarithmic Least-Squares Engine
              </h4>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-300">
                ln(β) = m·ln(1/cosθ) + ln(Kλ/D)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Minimizes random peak-width variance across all reflections via logarithmic transformation. Theoretical pure-size slope is m = 1.000.
            </p>
          </div>
        </div>

        {/* Estimator Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {([
              { id: 'OLS', label: 'OLS Standard', desc: 'Ordinary Least Squares' },
              { id: 'WLS-CosTheta', label: 'WLS (cos²θ)', desc: 'Cos²θ Precision Weighted' },
              { id: 'Huber-Robust', label: 'Huber Robust', desc: 'Outlier-Resistant IRLS M-Estimator' }
            ] as const).map((est) => (
              <button
                key={est.id}
                type="button"
                onClick={() => setRegressionWeighting(est.id)}
                title={est.desc}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  regressionWeighting === est.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {est.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyLatex}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Copy LaTeX regression equations"
          >
            {copiedLatex ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
            <span>{copiedLatex ? 'Copied LaTeX' : 'LaTeX'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9px] font-mono font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
            title="Download full Monshi-Scherrer CSV table"
          >
            <Download className="w-3 h-3 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 6-Card Quantitative Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-slate-950/90 p-3 rounded-xl border border-emerald-500/30">
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
            Monshi Size (Free m)
          </span>
          <div className="flex items-baseline gap-1 mt-1 font-mono tabular-nums">
            <span className="text-base font-black text-white">{msResult.sizeNm.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-400 font-bold">nm</span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-500 block mt-0.5 tabular-nums">
            ±{(msResult.sizeUncertaintyNm || 0).toFixed(2)} nm (1σ)
          </span>
        </div>

        <div className="bg-slate-950/90 p-3 rounded-xl border border-indigo-500/30">
          <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider block">
            Constrained (m = 1.0)
          </span>
          <div className="flex items-baseline gap-1 mt-1 font-mono tabular-nums">
            <span className="text-base font-black text-indigo-300">
              {(msResult.constrainedSizeNm || msResult.sizeNm).toFixed(2)}
            </span>
            <span className="text-[10px] text-indigo-400 font-bold">nm</span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-500 block mt-0.5 tabular-nums">
            Classical Mean: {(msResult.meanSinglePeakSizeNm || 0).toFixed(2)} nm
          </span>
        </div>

        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Regression Slope (m)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono tabular-nums">
            <span className={`text-base font-black ${slopeDeviation <= 0.22 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {msResult.slope.toFixed(3)}
            </span>
            <span className="text-[9px] text-slate-500">±{(msResult.slopeStdErr || 0).toFixed(3)}</span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-500 block mt-0.5">
            {isPureSize ? 'Ideal m ≈ 1.000' : msResult.slope > 1.2 ? 'Strain m > 1' : 'Anisotropy m ≠ 1'}
          </span>
        </div>

        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Intercept ln(Kλ/D)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono tabular-nums">
            <span className="text-base font-black text-sky-400">{msResult.intercept.toFixed(4)}</span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-500 block mt-0.5 tabular-nums">
            SE: ±{(msResult.interceptStdErr || 0).toFixed(4)}
          </span>
        </div>

        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Goodness of Fit (R²)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono tabular-nums">
            <span className={`text-base font-black ${msResult.rSquared >= 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {msResult.rSquared.toFixed(4)}
            </span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-500 block mt-0.5 tabular-nums">
            RMSE: {(msResult.rmse || 0).toFixed(4)}
          </span>
        </div>

        <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
            Implied Microstrain
          </span>
          <div className="flex items-baseline gap-1 mt-1 font-mono tabular-nums">
            <span className="text-base font-black text-amber-300">
              {((msResult.estimatedStrain || 0) * 100).toFixed(3)}%
            </span>
          </div>
          <span className="text-[8.5px] font-mono text-slate-500 block mt-0.5 tabular-nums">
            δ ≈ {((msResult.dislocationDensityM2 || 0) * 1e-14).toFixed(2)}×10¹⁴ m⁻²
          </span>
        </div>
      </div>

      {/* Sub-View Switcher Bar & Plot Controls */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'logPlot' as const, label: 'Logarithmic Fit Plot', icon: TrendingUp },
              { id: 'residuals' as const, label: 'Standardized Residuals (z)', icon: Activity },
              { id: 'comparison' as const, label: 'Scherrer vs Monshi Bar', icon: BarChart2 }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSubView(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                    subView === t.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {subView === 'logPlot' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowConfidenceBand(!showConfidenceBand)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border cursor-pointer transition-colors ${
                    showConfidenceBand
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  95% CI Band
                </button>
                <button
                  type="button"
                  onClick={() => setShowConstrainedLine(!showConstrainedLine)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border cursor-pointer transition-colors ${
                    showConstrainedLine
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  Ideal Slope (m=1)
                </button>
              </>
            )}
            {onAutoPruneOutliers && (
              <button
                type="button"
                onClick={onAutoPruneOutliers}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[9px] font-mono font-bold text-amber-300 uppercase flex items-center gap-1 cursor-pointer transition-colors"
                title="Automatically exclude statistical outlier reflections"
              >
                <Filter className="w-3 h-3" />
                <span>Prune Outliers</span>
              </button>
            )}
          </div>
        </div>

        {/* SUB-VIEW 1: Logarithmic Regression Plot */}
        {subView === 'logPlot' && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.points} margin={{ top: 15, right: 25, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="ln(1/cos θ)"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(v) => Number(v).toFixed(3)}
                  domain={['auto', 'auto']}
                  label={{
                    value: 'X = ln(1 / cos θ)',
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#94a3b8',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
                <YAxis
                  type="number"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  tickFormatter={(v) => Number(v).toFixed(2)}
                  domain={['auto', 'auto']}
                  label={{
                    value: 'Y = ln(β_sample [rad])',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 15,
                    fill: '#94a3b8',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#090d16] border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
                            <span className="text-white font-bold">
                              {d.hklLabel} @ {d.twoTheta.toFixed(2)}° 2θ
                            </span>
                            {d.excluded && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                                EXCLUDED
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400">
                            X = ln(1/cos θ): <strong className="text-sky-300">{d.x.toFixed(5)}</strong>
                          </p>
                          <p className="text-slate-400">
                            Y = ln(β_rad): <strong className="text-emerald-300">{d.y.toFixed(5)}</strong>
                          </p>
                          <p className="text-slate-400">
                            Fitted Ŷ ({regressionWeighting}): <strong className="text-amber-300">{d.fitY.toFixed(5)}</strong>
                          </p>
                          <p className="text-slate-400">
                            Std Residual z:{' '}
                            <strong className={Math.abs(d.standardizedResidual || 0) > 2 ? 'text-rose-400' : 'text-emerald-400'}>
                              {(d.standardizedResidual || 0).toFixed(2)}σ
                            </strong>
                          </p>
                          <p className="text-slate-400">
                            Single-Peak D_hkl: <strong className="text-indigo-300">{d.singlePeakSizeNm.toFixed(2)} nm</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                {showConfidenceBand && (
                  <Area
                    type="monotone"
                    dataKey="ciRange"
                    name="95% Student-t CI Band"
                    fill="#10b981"
                    fillOpacity={0.12}
                    stroke="none"
                    isAnimationActive={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="fitY"
                  name={`${regressionWeighting} Fit (m = ${msResult.slope.toFixed(2)})`}
                  stroke="#f59e0b"
                  strokeWidth={2.2}
                  dot={false}
                  isAnimationActive={false}
                />
                {showConstrainedLine && (
                  <Line
                    type="monotone"
                    dataKey="constrainedY"
                    name="Ideal Scherrer Slope (m = 1.00)"
                    stroke="#6366f1"
                    strokeWidth={1.8}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                <Scatter
                  name="Active Reflections"
                  dataKey="yActive"
                  fill="#10b981"
                  stroke="#34d399"
                  strokeWidth={1.5}
                />
                <Scatter
                  name="Excluded Reflections"
                  dataKey="yExcluded"
                  fill="#f43f5e"
                  stroke="#fda4af"
                  strokeWidth={1.5}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SUB-VIEW 2: Standardized Residuals z-Score Plot */}
        {subView === 'residuals' && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.points} margin={{ top: 15, right: 25, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="hklLabel"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  domain={[-3.2, 3.2]}
                  label={{
                    value: 'Standardized Residual z [σ]',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 15,
                    fill: '#94a3b8',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" />
                <ReferenceLine y={2} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '+2σ Outlier', fill: '#f43f5e', fontSize: 9 }} />
                <ReferenceLine y={-2} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: '-2σ Outlier', fill: '#f43f5e', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val: any) => [`${Number(val).toFixed(3)} σ`, 'Std. Residual z']}
                />
                <Bar dataKey="standardizedResidual" name="Standardized Residual (z)" radius={[4, 4, 0, 0]}>
                  {chartData.points.map((entry, index) => (
                    <Cell
                      key={`cell-z-${index}`}
                      fill={
                        entry.excluded
                          ? '#475569'
                          : Math.abs(entry.standardizedResidual || 0) > 2.0
                          ? '#f43f5e'
                          : '#10b981'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SUB-VIEW 3: Classical Single-Peak D vs Monshi-Scherrer Unified D */}
        {subView === 'comparison' && (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData.points} margin={{ top: 15, right: 25, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hklLabel" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fontFamily: 'monospace' }}
                  label={{
                    value: 'Crystallite Size D [nm]',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 15,
                    fill: '#94a3b8',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <ReferenceLine
                  y={msResult.sizeNm}
                  stroke="#10b981"
                  strokeWidth={2}
                  label={{ value: `Monshi D = ${msResult.sizeNm.toFixed(1)} nm`, fill: '#10b981', fontSize: 10 }}
                />
                <ReferenceLine
                  y={msResult.constrainedSizeNm || msResult.sizeNm}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  label={{ value: `m=1 D = ${(msResult.constrainedSizeNm || msResult.sizeNm).toFixed(1)} nm`, fill: '#818cf8', fontSize: 10 }}
                />
                <Bar dataKey="singlePeakSizeNm" name="Single-Peak Classical Scherrer D_hkl (nm)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-Reflection Verification Table with Interactive Outlier Toggle */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/40">
          <div className="px-3 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300 uppercase">
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              Logarithmic Regression Verification Table ({regressionWeighting})
            </span>
            <span>
              ln(β) = {msResult.slope.toFixed(4)}·ln(1/cos θ) + ({msResult.intercept.toFixed(4)})
            </span>
          </div>
          <table className="w-full text-left text-[10px] font-mono tabular-nums">
            <thead className="bg-slate-950/80 text-slate-500 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Reflection</th>
                <th className="py-2 px-2">2θ (°)</th>
                <th className="py-2 px-2">X = ln(1/cos θ)</th>
                <th className="py-2 px-2">Y = ln(β_rad)</th>
                <th className="py-2 px-2">Fitted Ŷ</th>
                <th className="py-2 px-2">Std. z</th>
                <th className="py-2 px-3 text-right">Single D_hkl</th>
                {onTogglePeakExclusion && <th className="py-2 px-3 text-center">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {msResult.pointsExtended.map((pt, i) => (
                <tr key={i} className={`hover:bg-slate-800/30 ${pt.excluded ? 'opacity-45 line-through' : ''}`}>
                  <td className="py-1.5 px-3 font-bold text-indigo-300">
                    {pt.hkl ? `(${pt.hkl.join('')})` : `#${i + 1}`}
                  </td>
                  <td className="py-1.5 px-2">{pt.twoTheta.toFixed(2)}°</td>
                  <td className="py-1.5 px-2 text-sky-300">{pt.x.toFixed(5)}</td>
                  <td className="py-1.5 px-2 text-emerald-300">{pt.y.toFixed(5)}</td>
                  <td className="py-1.5 px-2 text-amber-300">{(pt.yFitted || 0).toFixed(5)}</td>
                  <td
                    className={`py-1.5 px-2 font-bold ${
                      Math.abs(pt.standardizedResidual || 0) > 2.0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {(pt.standardizedResidual || 0) >= 0 ? '+' : ''}
                    {(pt.standardizedResidual || 0).toFixed(2)}σ
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-white">{pt.singlePeakSizeNm.toFixed(2)} nm</td>
                  {onTogglePeakExclusion && (
                    <td className="py-1.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onTogglePeakExclusion(pt.index ?? i)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer border ${
                          pt.excluded
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {pt.excluded ? 'Excluded' : 'Active'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/*Diagnostic Interpretation Footer */}
        <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/70 flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-300 leading-relaxed">
            <strong>Diagnostic Verdict:</strong> {msResult.slopeInterpretation}
          </p>
        </div>
      </div>
    </div>
  );
};
