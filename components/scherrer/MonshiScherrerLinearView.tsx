import React, { useMemo } from 'react';
import { ResponsiveContainer, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, BookOpen, Table } from 'lucide-react';
import { motion } from 'motion/react';
import { ScherrerResult } from '../../types';

interface MonshiScherrerLinearViewProps {
  results: ScherrerResult[];
  wavelength: number;
  kFactor: number;
}

export const MonshiScherrerLinearView: React.FC<MonshiScherrerLinearViewProps> = ({
  results,
  wavelength,
  kFactor
}) => {
  const validResults = useMemo(
    () => results.filter(r => !r.excluded && !r.error && r.sizeNm > 0 && r.betaCorrected > 0),
    [results]
  );

  const fitAnalysis = useMemo(() => {
    if (validResults.length < 2) return null;

    // Build data points: X = ln(cos(theta)), Y = ln(1 / beta_sample_rad)
    const rawPoints = validResults.map(r => {
      const thetaRad = (r.twoTheta / 2) * (Math.PI / 180);
      const cosTheta = Math.cos(thetaRad);
      const betaRad = r.betaCorrected * (Math.PI / 180);

      const x = Math.log(Math.max(1e-6, cosTheta));
      const y = Math.log(Math.max(1e-6, 1 / betaRad));

      return {
        twoTheta: r.twoTheta,
        hkl: r.hkl ? `(${r.hkl.join('')})` : `${r.twoTheta.toFixed(1)}°`,
        x,
        y,
        sizeNm: r.sizeNm,
        betaDeg: r.betaCorrected
      };
    }).sort((a, b) => a.x - b.x);

    // Linear regression: Y = m * X + C
    const n = rawPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const p of rawPoints) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-12) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Fixed-slope fit (m = 1.0): C_fixed = mean(Y - X)
    const interceptFixed = rawPoints.reduce((acc, p) => acc + (p.y - p.x), 0) / n;

    // R^2 and RMSE determination
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    const points = rawPoints.map(p => {
      const yFitFree = slope * p.x + intercept;
      const yFitFixed = 1.0 * p.x + interceptFixed;
      const residual = p.y - yFitFree;
      ssTot += Math.pow(p.y - meanY, 2);
      ssRes += Math.pow(residual, 2);
      return {
        ...p,
        yFitFree,
        yFitFixed,
        residual
      };
    });

    const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
    const rmse = Math.sqrt(ssRes / n);

    // Derived crystallite size: C = ln(D / (K * lambda)) => D = K * lambda * exp(C) in Angstroms -> / 10 for nm
    const dMonshiAngstrom = kFactor * wavelength * Math.exp(intercept);
    const dMonshiNm = dMonshiAngstrom / 10;
    const dMonshiFixedNm = (kFactor * wavelength * Math.exp(interceptFixed)) / 10;

    // Deviation check
    const slopeDeviation = Math.abs(slope - 1.0);
    const isPureSize = slopeDeviation <= 0.20 && r2 >= 0.85;

    return {
      points,
      slope,
      intercept,
      interceptFixed,
      r2,
      rmse,
      dMonshiNm,
      dMonshiFixedNm,
      slopeDeviation,
      isPureSize
    };
  }, [validResults, wavelength, kFactor]);

  if (!fitAnalysis || validResults.length < 2) {
    return (
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
        Monshi-Scherrer linearization requires at least 2 valid peak reflections. Please provide multiple reflections across a range of 2θ angles.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Monshi-Scherrer Logarithmic Linearization</h4>
            <p className="text-[10px] text-slate-400">Plot of ln(1/β_sample) vs ln(cos θ). Theory dictates an exact unit slope (m = 1.000) for pure size broadening.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fitAnalysis.isPureSize ? (
            <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pure Domain Broadening Confirmed (m ≈ 1.0)
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Lattice Microstrain / Anisotropy Detected (Slope {fitAnalysis.slope.toFixed(2)})
            </div>
          )}
        </div>
      </div>

      {/* Regression Results Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.05 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Regression Slope (m)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-base font-mono font-bold tabular-nums ${fitAnalysis.slopeDeviation <= 0.2 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {fitAnalysis.slope.toFixed(3)}
            </span>
            <span className="text-[9px] text-slate-500">ideal: 1.000</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.10 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Goodness of Fit (R²)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-base font-mono font-bold tabular-nums ${fitAnalysis.r2 >= 0.9 ? 'text-emerald-400' : 'text-indigo-300'}`}>
              {fitAnalysis.r2.toFixed(4)}
            </span>
            <span className="text-[9px] text-slate-500">RMSE: {fitAnalysis.rmse.toFixed(3)}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.15 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Intercept ln(D/Kλ)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-mono font-bold tabular-nums text-sky-400">
              {fitAnalysis.intercept.toFixed(3)}
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.20 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monshi Size (Free Slope)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-mono font-bold tabular-nums text-emerald-300">
              {fitAnalysis.dMonshiNm.toFixed(2)} nm
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.25 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monshi Size (Slope = 1.0)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-mono font-bold tabular-nums text-indigo-300">
              {fitAnalysis.dMonshiFixedNm.toFixed(2)} nm
            </span>
          </div>
        </motion.div>
      </div>

      {/* Interactive Chart with Both Free-Slope and Unit-Slope Fit Lines */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="h-[270px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={fitAnalysis.points} margin={{ top: 15, right: 25, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="ln(cos θ)" 
                stroke="#64748b" 
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(v) => Number(v).toFixed(3)}
                domain={['auto', 'auto']}
                label={{ value: 'X = ln(cos θ)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
              />
              <YAxis 
                type="number" 
                stroke="#64748b" 
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(v) => Number(v).toFixed(2)}
                domain={['auto', 'auto']}
                label={{ value: 'Y = ln(1 / β_sample [rad])', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#090d16] border border-slate-700 p-3 rounded-xl shadow-xl text-xs font-mono space-y-1">
                        <p className="text-white font-bold">{d.hkl} @ {d.twoTheta.toFixed(2)}° 2θ</p>
                        <p className="text-slate-400">X = ln(cos θ): <strong className="text-sky-300">{d.x.toFixed(4)}</strong></p>
                        <p className="text-slate-400">Y = ln(1/β_rad): <strong className="text-emerald-300">{d.y.toFixed(4)}</strong></p>
                        <p className="text-slate-400">Free-Slope Fit Ŷ: <strong className="text-amber-300">{d.yFitFree.toFixed(4)}</strong></p>
                        <p className="text-slate-400">Single-Peak D_hkl: <strong className="text-indigo-300">{d.sizeNm.toFixed(2)} nm</strong></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
              <Line
                type="monotone"
                dataKey="yFitFree"
                name={`Least-Squares Fit (m = ${fitAnalysis.slope.toFixed(2)})`}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="yFitFixed"
                name="Ideal Scherrer Slope (m = 1.00)"
                stroke="#6366f1"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
              <Scatter 
                name="Resolved Reflections" 
                dataKey="y" 
                fill="#10b981" 
                stroke="#34d399" 
                strokeWidth={1.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Reflection Verification Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/40">
          <div className="px-3 py-2 border-b border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-slate-300 uppercase">
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              Logarithmic Regression Verification Table
            </span>
            <span>Equation: ln(1/β) = {fitAnalysis.slope.toFixed(4)}·ln(cos θ) + {fitAnalysis.intercept.toFixed(4)}</span>
          </div>
          <table className="w-full text-left text-[10px] font-mono tabular-nums">
            <thead className="bg-slate-950/80 text-slate-500 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Reflection</th>
                <th className="py-2 px-2">2θ (°)</th>
                <th className="py-2 px-2">ln(cos θ)</th>
                <th className="py-2 px-2">ln(1/β_rad)</th>
                <th className="py-2 px-2">Fitted Ŷ</th>
                <th className="py-2 px-2">Residual</th>
                <th className="py-2 px-3 text-right">D_hkl (nm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {fitAnalysis.points.map((pt, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="py-1.5 px-3 font-bold text-indigo-300">{pt.hkl}</td>
                  <td className="py-1.5 px-2">{pt.twoTheta.toFixed(2)}°</td>
                  <td className="py-1.5 px-2 text-sky-300">{pt.x.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-emerald-300">{pt.y.toFixed(4)}</td>
                  <td className="py-1.5 px-2 text-amber-300">{pt.yFitFree.toFixed(4)}</td>
                  <td className={`py-1.5 px-2 ${Math.abs(pt.residual) < 0.05 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {pt.residual >= 0 ? '+' : ''}{pt.residual.toFixed(4)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-bold text-white">{pt.sizeNm.toFixed(2)} nm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-400 leading-relaxed">
            <strong>Monshi Method (World J. Nano Sci. Eng., 2012):</strong> Taking the logarithm of Scherrer's equation linearizes the trigonometric dependency (<code className="text-emerald-300">ln(1/β) = ln(D/Kλ) + ln(cos θ)</code>). Least-squares regression across all peaks minimizes random FWHM measurement error. If the experimental slope deviates strongly from 1.000, lattice microstrain or anisotropic domain shape is present.
          </p>
        </div>
      </div>
    </div>
  );
};

