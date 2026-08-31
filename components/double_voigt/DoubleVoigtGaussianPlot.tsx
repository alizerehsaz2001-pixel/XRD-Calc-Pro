import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Layers, CheckCircle, Info, Sparkles } from 'lucide-react';
import { DoubleVoigtResult } from '../../types';
import { useSettings, convertLength } from '../SettingsContext';

interface DoubleVoigtGaussianPlotProps {
  result: DoubleVoigtResult;
}

export const DoubleVoigtGaussianPlot: React.FC<DoubleVoigtGaussianPlotProps> = ({ result }) => {
  const { lengthUnit = 'Å' } = useSettings();

  const gaussianChartData = React.useMemo(() => {
    if (!result || !result.points || result.points.length < 2) return null;
    const activePoints = result.points.filter(p => !p.isExcluded);
    const xVals = activePoints.length > 0 ? activePoints.map(p => p.s2) : result.points.map(p => p.s2);
    const maxX = Math.max(...xVals, 0.5);
    const pad = maxX * 0.15 || 0.05;
    const startX = 0;
    const endX = maxX + pad;

    const points = result.points.map(p => ({
      x: p.s2,
      y: p.betaGStarSq,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      dSpacingA: p.dSpacingA,
      betaGStar: p.betaGStar,
      residualG: p.residualG,
      isExcluded: p.isExcluded
    }));

    const slope = result?.gaussianFit?.slope ?? 0;
    const intercept = result?.gaussianFit?.intercept ?? 0;
    const stdErrSlope = result?.gaussianFit?.stdErrSlope || 0;
    const stdErrIntercept = result?.gaussianFit?.stdErrIntercept || 0;

    // Generate regression line and confidence bands
    const numLineSteps = 40;
    const lineData = [];
    for (let i = 0; i <= numLineSteps; i++) {
      const curX = startX + (i / numLineSteps) * (endX - startX);
      const fitY = slope * curX + intercept;
      const ciHalf = 1.96 * Math.sqrt(Math.pow(stdErrIntercept, 2) + Math.pow(curX * stdErrSlope, 2));
      lineData.push({
        x: parseFloat(curX.toFixed(4)),
        fitY: parseFloat(fitY.toFixed(6)),
        ciUpper: parseFloat((fitY + ciHalf).toFixed(6)),
        ciLower: parseFloat(Math.max(0, fitY - ciHalf).toFixed(6))
      });
    }

    return { points, lineData, startX, endX };
  }, [result]);

  if (!gaussianChartData) {
    return (
      <div className="p-8 text-center text-slate-400 bg-[#050C17]/60 rounded-2xl border border-white/5">
        Insufficient peak data for Gaussian plot.
      </div>
    );
  }

  const { slope = 0, intercept = 0, rSquared = 0, stdErrSlope = 0, stdErrIntercept = 0 } = result?.gaussianFit || {};

  return (
    <div className="space-y-4 bg-[#030710]/70 p-4 sm:p-6 rounded-2xl border border-purple-500/20 relative shadow-inner">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Gaussian Multi-Reflection Plot ((β_G*)² vs. s²)
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Regression:</span>
          <span className="text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
            R² = {(rSquared * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Mathematical Formulation Banner */}
      <div className="bg-black/50 p-3 rounded-xl border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="text-purple-200">
          <span className="text-slate-400 mr-2">Governing Equation:</span>
          <span className="text-white font-bold">(β_G*(s))² = (β_G,size*)² + 2π e_G² · s²</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div>Intercept <span className="text-purple-300 font-bold">C_G = (β_G,size*)²</span> = {intercept.toFixed(6)} nm⁻²</div>
          <div>Slope <span className="text-purple-300 font-bold">m_G = 2π e_G²</span> = {slope.toFixed(6)}</div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 sm:h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 15, right: 30, bottom: 25, left: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[0, 'auto']}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              label={{
                value: 's² = (2sinθ / λ)² [nm⁻²]',
                position: 'insideBottom',
                offset: -15,
                fill: '#c084fc',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[0, 'auto']}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              label={{
                value: '(β_G*)² [nm⁻²]',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                fill: '#c084fc',
                fontSize: 11,
                fontFamily: 'monospace'
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload.find(p => p.dataKey === 'y')?.payload || payload[0].payload;
                  return (
                    <div className="bg-[#050C17]/95 border border-purple-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1.5 min-w-[200px]">
                      <div className="text-purple-400 font-bold border-b border-white/10 pb-1 flex items-center justify-between">
                        <span>Reflection {pt.hkl}</span>
                        <span>2θ = {pt.twoTheta?.toFixed(2)}°</span>
                      </div>
                      {pt.dSpacingA && (
                        <div className="flex justify-between text-slate-300">
                          <span>d-spacing:</span>
                          <span className="text-white font-bold">{pt.dSpacingA.toFixed(4)} Å</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-purple-300">s²:</span>
                        <span className="text-white font-bold">{pt.x?.toFixed(5)} nm⁻²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Observed (β_G*)²:</span>
                        <span className="text-white font-bold">{pt.y?.toFixed(6)} nm⁻²</span>
                      </div>
                      <div className="flex justify-between text-cyan-300">
                        <span>β_G* (sqrt):</span>
                        <span className="text-cyan-200 font-bold">{pt.betaGStar?.toFixed(5)} nm⁻¹</span>
                      </div>
                      {pt.residualG !== undefined && (
                        <div className="flex justify-between text-slate-400">
                          <span>Fit Residual:</span>
                          <span className={pt.residualG >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {pt.residualG > 0 ? `+${pt.residualG.toFixed(6)}` : pt.residualG.toFixed(6)} nm⁻²
                          </span>
                        </div>
                      )}
                      {pt.isExcluded && (
                        <div className="text-rose-400 font-bold text-[10px] uppercase">
                          [Excluded from regression]
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

            {/* s^2 = 0 Intercept Marker */}
            <ReferenceLine
              x={0}
              stroke="#c084fc"
              strokeDasharray="4 4"
              label={{ value: 's² = 0 ((β_G,size*)²)', fill: '#c084fc', fontSize: 10, position: 'top' }}
            />

            {/* Regression Line */}
            <Line
              data={gaussianChartData.lineData}
              type="linear"
              dataKey="fitY"
              name={`Linear Fit: (β_G*)² = ${slope.toFixed(5)}s² + ${intercept.toFixed(6)}`}
              stroke="#c084fc"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
            />

            {/* 95% Confidence Interval Bands */}
            <Line
              data={gaussianChartData.lineData}
              type="linear"
              dataKey="ciUpper"
              name="95% Confidence Bound"
              stroke="#c084fc"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
            />
            <Line
              data={gaussianChartData.lineData}
              type="linear"
              dataKey="ciLower"
              name=""
              legendType="none"
              stroke="#c084fc"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
            />

            {/* Active Data Points */}
            <Scatter
              data={gaussianChartData.points.filter(p => !p.isExcluded)}
              dataKey="y"
              name="Measured Gaussian Reflections"
              fill="#d8b4fe"
              stroke="#ffffff"
              strokeWidth={1.5}
            />

            {/* Excluded Points */}
            {gaussianChartData.points.some(p => p.isExcluded) && (
              <Scatter
                data={gaussianChartData.points.filter(p => p.isExcluded)}
                dataKey="y"
                name="Excluded Outliers"
                fill="#f43f5e"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Uncertainty & Statistical Quality Footprint */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
        <div className="bg-black/50 p-2.5 rounded-xl border border-purple-500/20">
          <div className="text-[10px] text-slate-400 uppercase">Gaussian Strain e_G</div>
          <div className="text-sm font-bold text-purple-300 mt-0.5">
            {((result.gaussianStrainEg ?? 0) * 100).toFixed(4)}%
          </div>
          <div className="text-[10px] text-slate-400">√(m_G / 8π)</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-indigo-500/20">
          <div className="text-[10px] text-slate-400 uppercase">Gaussian Size D_G</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {convertLength((result.gaussianSizeDgNm ?? 0) * 10, lengthUnit).toFixed(2)} {lengthUnit}
          </div>
          <div className="text-[10px] text-indigo-300">({(result.gaussianSizeDgNm ?? 0).toFixed(2)} nm)</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-cyan-500/20">
          <div className="text-[10px] text-slate-400 uppercase">Fit Uncertainty (Std Err)</div>
          <div className="text-xs text-slate-200 mt-0.5">
            σ(m) = {stdErrSlope?.toFixed(6) || '0.000000'}
          </div>
          <div className="text-xs text-slate-200">
            σ(c) = {stdErrIntercept?.toFixed(6) || '0.000000'} nm⁻²
          </div>
        </div>
      </div>
    </div>
  );
};
