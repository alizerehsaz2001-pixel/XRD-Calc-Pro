import React, { useMemo } from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Line, ComposedChart } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Info, BookOpen } from 'lucide-react';
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
  const validResults = useMemo(() => results.filter(r => !r.error && r.sizeNm > 0 && r.betaCorrected > 0), [results]);

  const fitAnalysis = useMemo(() => {
    if (validResults.length < 2) return null;

    // Build data points: X = ln(cos(theta)), Y = ln(1 / beta_sample_rad)
    const points = validResults.map(r => {
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
        sizeNm: r.sizeNm
      };
    });

    // Linear regression: Y = m * X + C
    const n = points.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
      sumYY += p.y * p.y;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (Math.abs(denominator) < 1e-12) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // R^2 determination
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;
    for (const p of points) {
      const yPred = slope * p.x + intercept;
      ssTot += Math.pow(p.y - meanY, 2);
      ssRes += Math.pow(p.y - yPred, 2);
    }
    const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

    // Derived crystallite size: C = ln(D / (K * lambda)) => D = K * lambda * exp(C) in Angstroms -> / 10 for nm
    const dMonshiAngstrom = kFactor * wavelength * Math.exp(intercept);
    const dMonshiNm = dMonshiAngstrom / 10;

    // Fixed-slope fit (m = 1.0)
    // C_fixed = mean(Y - X)
    const interceptFixed = points.reduce((acc, p) => acc + (p.y - p.x), 0) / n;
    const dMonshiFixedNm = (kFactor * wavelength * Math.exp(interceptFixed)) / 10;

    // Regression line endpoints for visualization
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const padding = (maxX - minX) * 0.1 || 0.05;
    const lineStart = { x: minX - padding, y: slope * (minX - padding) + intercept };
    const lineEnd = { x: maxX + padding, y: slope * (maxX + padding) + intercept };

    // Deviation check
    const slopeDeviation = Math.abs(slope - 1.0);
    const isPureSize = slopeDeviation <= 0.20 && r2 >= 0.85;

    return {
      points,
      slope,
      intercept,
      r2,
      dMonshiNm,
      dMonshiFixedNm,
      slopeDeviation,
      isPureSize,
      linePoints: [lineStart, lineEnd]
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
            <span className={`text-base font-mono font-bold ${fitAnalysis.slopeDeviation <= 0.2 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {fitAnalysis.slope.toFixed(3)}
            </span>
            <span className="text-[9px] text-slate-500">ideal: 1.000</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.10 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Goodness of Fit (R²)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-base font-mono font-bold ${fitAnalysis.r2 >= 0.9 ? 'text-emerald-400' : 'text-indigo-300'}`}>
              {fitAnalysis.r2.toFixed(4)}
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.15 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Intercept ln(D/Kλ)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-mono font-bold text-sky-400">
              {fitAnalysis.intercept.toFixed(3)}
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.20 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monshi Size (Free Slope)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-mono font-bold text-emerald-300">
              {fitAnalysis.dMonshiNm.toFixed(2)} nm
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2, delay: 0.25 }} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Monshi Size (Slope = 1.0)</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-mono font-bold text-indigo-300">
              {fitAnalysis.dMonshiFixedNm.toFixed(2)} nm
            </span>
          </div>
        </motion.div>
      </div>

      {/* Interactive Chart */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2">
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 20, bottom: 15, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="ln(cos θ)" 
                stroke="#64748b" 
                tick={{ fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{ value: 'ln(cos θ)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="ln(1/β)" 
                stroke="#64748b" 
                tick={{ fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{ value: 'ln(1 / β_sample)', angle: -90, position: 'insideLeft', offset: 15, fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                formatter={(val: any, name: string) => [
                  parseFloat(val).toFixed(4), 
                  name === 'y' ? 'ln(1/β)' : 'ln(cos θ)'
                ]}
                labelFormatter={() => 'Monshi Reflection'}
              />
              <Scatter 
                name="Reflections" 
                data={fitAnalysis.points} 
                fill="#10b981" 
                stroke="#34d399" 
                strokeWidth={1.5}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/60 flex items-start gap-2">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-slate-400 leading-relaxed">
            <strong>Monshi Method (2012):</strong> Taking the logarithm of Scherrer's equation linearizes the trigonometric dependency. If the experimental slope significantly deviates from 1.000, uncorrected microstrain, faulting, or severe preferred orientation is present, proving that a simple single-peak Scherrer calculation is insufficient.
          </p>
        </div>
      </div>
    </div>
  );
};
