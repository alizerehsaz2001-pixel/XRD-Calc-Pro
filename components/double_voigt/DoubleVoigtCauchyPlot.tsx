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
import { Ruler, Activity, CheckCircle, Info, Sparkles, TrendingUp } from 'lucide-react';
import { DoubleVoigtResult } from '../../types';
import { useSettings, convertLength } from '../SettingsContext';

interface DoubleVoigtCauchyPlotProps {
  result: DoubleVoigtResult;
}

export const DoubleVoigtCauchyPlot: React.FC<DoubleVoigtCauchyPlotProps> = ({ result }) => {
  const { lengthUnit = 'Å' } = useSettings();

  const cauchyChartData = React.useMemo(() => {
    if (!result || !result.points || result.points.length < 2) return null;
    const activePoints = result.points.filter(p => !p.isExcluded);
    const xVals = activePoints.length > 0 ? activePoints.map(p => p.s) : result.points.map(p => p.s);
    const maxX = Math.max(...xVals, 1);
    const pad = maxX * 0.15 || 0.1;
    const startX = 0;
    const endX = maxX + pad;

    const points = result.points.map(p => ({
      x: p.s,
      y: p.betaCStar,
      twoTheta: p.twoTheta,
      hkl: p.hkl ? `(${p.hkl.join('')})` : `${p.twoTheta.toFixed(2)}°`,
      dSpacingA: p.dSpacingA,
      singleDvNm: p.singleDvNm,
      residualC: p.residualC,
      isExcluded: p.isExcluded
    }));

    const slope = result?.cauchyFit?.slope ?? 0;
    const intercept = result?.cauchyFit?.intercept ?? 0;
    const stdErrSlope = result?.cauchyFit?.stdErrSlope || 0;
    const stdErrIntercept = result?.cauchyFit?.stdErrIntercept || 0;

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

  if (!cauchyChartData) {
    return (
      <div className="p-8 text-center text-slate-400 bg-[#050C17]/60 rounded-2xl border border-white/5">
        Insufficient peak data for Cauchy plot.
      </div>
    );
  }

  const { slope = 0, intercept = 0, rSquared = 0, stdErrSlope = 0, stdErrIntercept = 0 } = result?.cauchyFit || {};

  return (
    <div className="space-y-4 bg-[#030710]/70 p-4 sm:p-6 rounded-2xl border border-indigo-500/20 relative shadow-inner">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 font-mono">
        <div className="flex items-center gap-2">
          <Ruler className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Cauchy Multi-Reflection Plot (β_C* vs. s)
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Regression:</span>
          <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            R² = {(rSquared * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Mathematical Formulation Banner */}
      <div className="bg-black/50 p-3 rounded-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="text-indigo-200">
          <span className="text-slate-400 mr-2">Governing Equation:</span>
          <span className="text-white font-bold">β_C*(s) = (1 / ⟨D_V⟩) + 2 e_C · s</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div>Intercept <span className="text-indigo-300 font-bold">C_C = 1/⟨D_V⟩</span> = {intercept.toFixed(5)} nm⁻¹</div>
          <div>Slope <span className="text-indigo-300 font-bold">m_C = 2e_C</span> = {slope.toFixed(5)}</div>
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
                value: 'Scattering Vector s = 2sinθ / λ [nm⁻¹]',
                position: 'insideBottom',
                offset: -15,
                fill: '#818cf8',
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
                value: 'Reciprocal Cauchy Breadth β_C* [nm⁻¹]',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                fill: '#818cf8',
                fontSize: 11,
                fontFamily: 'monospace'
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload.find(p => p.dataKey === 'y')?.payload || payload[0].payload;
                  return (
                    <div className="bg-[#050C17]/95 border border-indigo-500/40 p-3 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1.5 min-w-[200px]">
                      <div className="text-indigo-400 font-bold border-b border-white/10 pb-1 flex items-center justify-between">
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
                        <span className="text-indigo-300">s:</span>
                        <span className="text-white font-bold">{pt.x?.toFixed(5)} nm⁻¹</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-300">Observed β_C*:</span>
                        <span className="text-white font-bold">{pt.y?.toFixed(5)} nm⁻¹</span>
                      </div>
                      {pt.singleDvNm && (
                        <div className="flex justify-between text-emerald-300">
                          <span>Single-Line D_V:</span>
                          <span className="text-emerald-200 font-bold">
                            {convertLength(pt.singleDvNm * 10, lengthUnit).toFixed(1)} {lengthUnit} ({pt.singleDvNm.toFixed(1)} nm)
                          </span>
                        </div>
                      )}
                      {pt.residualC !== undefined && (
                        <div className="flex justify-between text-slate-400">
                          <span>Fit Residual:</span>
                          <span className={pt.residualC >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {pt.residualC > 0 ? `+${pt.residualC.toFixed(5)}` : pt.residualC.toFixed(5)} nm⁻¹
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

            {/* s = 0 Intercept Marker */}
            <ReferenceLine
              x={0}
              stroke="#818cf8"
              strokeDasharray="4 4"
              label={{ value: 's = 0 (1/⟨D_V⟩)', fill: '#818cf8', fontSize: 10, position: 'top' }}
            />

            {/* Regression Line */}
            <Line
              data={cauchyChartData.lineData}
              type="linear"
              dataKey="fitY"
              name={`Linear Fit: β_C* = ${slope.toFixed(4)}s + ${intercept.toFixed(4)}`}
              stroke="#818cf8"
              strokeWidth={2.5}
              dot={false}
              activeDot={false}
            />

            {/* 95% Confidence Interval Bands */}
            <Line
              data={cauchyChartData.lineData}
              type="linear"
              dataKey="ciUpper"
              name="95% Confidence Bound"
              stroke="#818cf8"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
            />
            <Line
              data={cauchyChartData.lineData}
              type="linear"
              dataKey="ciLower"
              name=""
              legendType="none"
              stroke="#818cf8"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
            />

            {/* Active Data Points */}
            <Scatter
              data={cauchyChartData.points.filter(p => !p.isExcluded)}
              dataKey="y"
              name="Measured Active Reflections"
              fill="#a5b4fc"
              stroke="#ffffff"
              strokeWidth={1.5}
            />

            {/* Excluded Points */}
            {cauchyChartData.points.some(p => p.isExcluded) && (
              <Scatter
                data={cauchyChartData.points.filter(p => p.isExcluded)}
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
        <div className="bg-black/50 p-2.5 rounded-xl border border-indigo-500/20">
          <div className="text-[10px] text-slate-400 uppercase">Volume-Weighted Size ⟨D_V⟩</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {convertLength((result.volumeSizeDvNm ?? 0) * 10, lengthUnit).toFixed(2)} ± {convertLength((result.uncertainties?.volumeSizeStdErrNm ?? 0) * 10, lengthUnit).toFixed(2)} {lengthUnit}
          </div>
          <div className="text-[10px] text-indigo-300">({(result.volumeSizeDvNm ?? 0).toFixed(2)} ± {(result.uncertainties?.volumeSizeStdErrNm ?? 0).toFixed(2)} nm)</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-purple-500/20">
          <div className="text-[10px] text-slate-400 uppercase">Cauchy Microstrain e_C</div>
          <div className="text-sm font-bold text-purple-300 mt-0.5">
            {((result.cauchyStrainEc ?? 0) * 100).toFixed(4)}%
          </div>
          <div className="text-[10px] text-slate-400">Slope m_C / 2</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-cyan-500/20">
          <div className="text-[10px] text-slate-400 uppercase">Fit Uncertainty (Std Err)</div>
          <div className="text-xs text-slate-200 mt-0.5">
            σ(m) = {stdErrSlope?.toFixed(5) || '0.00000'}
          </div>
          <div className="text-xs text-slate-200">
            σ(c) = {stdErrIntercept?.toFixed(5) || '0.00000'} nm⁻¹
          </div>
        </div>
      </div>
    </div>
  );
};
