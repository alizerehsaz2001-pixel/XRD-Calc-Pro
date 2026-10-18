import React, { useState } from 'react';
import {
  Activity,
  SlidersHorizontal,
  Download,
  Copy,
  Check,
  Info,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  TrendingDown,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { ResidualStatisticsResult } from '../../utils/physics';

export interface InteractiveResidualSubplotProps {
  data: any[];
  stats: ResidualStatisticsResult & {
    center: number;
    fwhm: number;
  };
  hoveredX?: number | null;
  onHoverPoint?: (pt: any | null) => void;
  plotTheme?: 'default' | 'lab_dark' | 'journal' | 'monochrome';
}

export const InteractiveResidualSubplot: React.FC<InteractiveResidualSubplotProps> = ({
  data,
  stats,
  hoveredX,
  onHoverPoint,
  plotTheme = 'default'
}) => {
  const [residualMode, setResidualMode] = useState<'raw' | 'standardized'>('raw');
  const [plotStyle, setPlotStyle] = useState<'line' | 'bar'>('line');
  const [showConfidenceBands, setShowConfidenceBands] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showDetailStats, setShowDetailStats] = useState<boolean>(false);

  if (!data || data.length === 0) return null;

  const handleCopyResiduals = () => {
    const headers = '2Theta_deg,Y_obs,Y_calc,Residual_Raw,Sigma,Std_Residual\n';
    const rows = data
      .map(
        (p) =>
          `${p.x.toFixed(4)},${p.y.toFixed(2)},${(p._cleanY ?? p.y).toFixed(2)},${(p.residual ?? 0).toFixed(3)},${(p.sigmaPos1 ?? 1).toFixed(3)},${(p.normResidual ?? 0).toFixed(3)}`
      )
      .join('\n');
    navigator.clipboard.writeText(headers + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = '2Theta_deg,Y_obs,Y_calc,Residual_Raw,Sigma,Std_Residual\n';
    const rows = data
      .map(
        (p) =>
          `${p.x.toFixed(4)},${p.y.toFixed(2)},${(p._cleanY ?? p.y).toFixed(2)},${(p.residual ?? 0).toFixed(3)},${(p.sigmaPos1 ?? 1).toFixed(3)},${(p.normResidual ?? 0).toFixed(3)}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `xrd_residuals_fit_${stats.center.toFixed(2)}deg.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isDark = plotTheme === 'lab_dark' || plotTheme === 'default';

  return (
    <div className="mt-4 bg-slate-900 text-slate-100 rounded-2xl border-2 border-rose-500/40 shadow-xl overflow-hidden animate-in fade-in duration-300">
      {/* Residual Header & Metric Toolbar */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                Interactive Difference & Residual Analytics
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                {residualMode === 'raw' ? 'ΔI = Y_obs - Y_calc (counts)' : 'Standardized ΔI / σ'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Synchronized line profile goodness-of-fit error distribution with Poisson variance envelope
            </p>
          </div>
        </div>

        {/* View mode & Action Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Mode Selector */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setResidualMode('raw')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                residualMode === 'raw'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Display raw residual intensity difference: Y_obs - Y_calc"
            >
              Raw ΔI
            </button>
            <button
              type="button"
              onClick={() => setResidualMode('standardized')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                residualMode === 'standardized'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Display standardized normalized residuals: (Y_obs - Y_calc) / sqrt(Y_calc)"
            >
              Std (ΔI/σ)
            </button>
          </div>

          {/* Plot Style Toggle */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setPlotStyle('line')}
              className={`px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                plotStyle === 'line' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Continuous residual curve"
            >
              Curve
            </button>
            <button
              type="button"
              onClick={() => setPlotStyle('bar')}
              className={`px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                plotStyle === 'bar' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Individual residual stems"
            >
              Stems
            </button>
          </div>

          {/* Confidence Bands Toggle */}
          <button
            type="button"
            onClick={() => setShowConfidenceBands(!showConfidenceBands)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border cursor-pointer ${
              showConfidenceBands
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70 font-semibold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle ±1σ and ±3σ Poisson noise confidence bands"
          >
            <span>±3σ Bands</span>
          </button>

          {/* Copy and Export */}
          <button
            type="button"
            onClick={handleCopyResiduals}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Copy residual table to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Export residual spectrum CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* More stats toggle */}
          <button
            type="button"
            onClick={() => setShowDetailStats(!showDetailStats)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              showDetailStats
                ? 'bg-purple-900/80 text-purple-200 border-purple-600'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {showDetailStats ? 'Hide Metrics' : 'Metrics'}
          </button>
        </div>
      </div>

      {/* Primary Goodness-of-Fit Quick Badges Bar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">R_p:</span>
            <span className="font-bold text-indigo-400">{stats.rP.toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">R_wp:</span>
            <span className="font-bold text-purple-400">{stats.rWP.toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">χ² (GoF):</span>
            <span
              className={`font-bold ${
                stats.goodnessOfFit < 1.5
                  ? 'text-emerald-400'
                  : stats.goodnessOfFit < 3.0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {stats.goodnessOfFit.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">R_exp:</span>
            <span className="font-bold text-cyan-400">{stats.rExp.toFixed(2)}%</span>
          </div>
        </div>

        {/* Durbin-Watson Autocorrelation Badge */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Durbin-Watson (d):</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
              stats.durbinWatsonStatus === 'ideal'
                ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                : stats.durbinWatsonStatus === 'positive_autocorrelation'
                ? 'bg-amber-950/90 text-amber-300 border border-amber-700/60'
                : 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/60'
            }`}
            title={
              stats.durbinWatsonStatus === 'ideal'
                ? 'd ≈ 2.0: Ideal uncorrelated random noise. Profile model fits symmetrically.'
                : stats.durbinWatsonStatus === 'positive_autocorrelation'
                ? 'd < 1.6: Positive serial correlation. Suggests peak asymmetry, unmodeled shoulder, or tail misfit.'
                : 'd > 2.4: Negative serial correlation. Suggests alternating high-frequency noise or over-fitting.'
            }
          >
            {stats.durbinWatsonStatus === 'ideal' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            )}
            <span>{stats.durbinWatson.toFixed(3)}</span>
            <span className="text-[9px] uppercase tracking-wider opacity-80">
              ({stats.durbinWatsonStatus === 'ideal' ? 'Uncorrelated' : stats.durbinWatsonStatus === 'positive_autocorrelation' ? 'Serial Bias' : 'Oscillating'})
            </span>
          </span>
        </div>
      </div>

      {/* Expanded Metrics Details Tray */}
      {showDetailStats && (
        <div className="p-3 bg-slate-950 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-[11px] font-mono animate-in fade-in duration-200">
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">RMS Residual</span>
            <strong className="text-indigo-300 text-xs">{stats.rmsResidual.toFixed(3)} cps</strong>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Max |ΔI|</span>
            <strong className="text-rose-400 text-xs">{stats.maxAbsResidual.toFixed(2)} cps</strong>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Outliers (&gt;3σ)</span>
            <strong className={stats.outlierCount === 0 ? 'text-emerald-400 text-xs' : 'text-amber-400 text-xs'}>
              {stats.outlierCount} pts ({((stats.outlierCount / data.length) * 100).toFixed(1)}%)
            </strong>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Akaike (AIC)</span>
            <strong className="text-purple-300 text-xs">{stats.aic.toFixed(1)}</strong>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Bayesian (BIC)</span>
            <strong className="text-purple-300 text-xs">{stats.bic.toFixed(1)}</strong>
          </div>
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[9px] uppercase">Data Points</span>
            <strong className="text-cyan-300 text-xs">{data.length}</strong>
          </div>
        </div>
      )}

      {/* Main Interactive Residual Chart Container */}
      <div className="h-[145px] w-full p-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 35, left: 15, bottom: 5 }}
            onMouseMove={(state: any) => {
              if (state && state.activePayload && state.activePayload.length && onHoverPoint) {
                onHoverPoint(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => onHoverPoint && onHoverPoint(null)}
          >
            <CartesianGrid strokeDasharray="2 2" stroke="#334155" strokeOpacity={0.6} />

            <XAxis
              dataKey="x"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(v) => `${Number(v).toFixed(2)}°`}
              domain={['dataMin', 'dataMax']}
            />

            <YAxis
              stroke="#64748b"
              fontSize={10}
              domain={
                residualMode === 'raw'
                  ? ['dataMin - 2', 'dataMax + 2']
                  : [-4, 4]
              }
              tickFormatter={(v) => (residualMode === 'raw' ? `${Number(v).toFixed(1)}` : `${Number(v)}σ`)}
            />

            {/* Zero Baseline */}
            <ReferenceLine y={0} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />

            {/* Confidence Envelope Limits */}
            {showConfidenceBands && residualMode === 'raw' && (
              <>
                <Line
                  type="monotone"
                  dataKey="sigmaPos3"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                  name="+3σ Bound"
                />
                <Line
                  type="monotone"
                  dataKey="sigmaNeg3"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                  name="-3σ Bound"
                />
                <Line
                  type="monotone"
                  dataKey="sigmaPos1"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                  name="+1σ Bound"
                />
                <Line
                  type="monotone"
                  dataKey="sigmaNeg1"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                  name="-1σ Bound"
                />
              </>
            )}

            {showConfidenceBands && residualMode === 'standardized' && (
              <>
                <ReferenceLine y={3} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: '+3σ Outlier', fill: '#ef4444', fontSize: 9 }} />
                <ReferenceLine y={-3} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" label={{ value: '-3σ Outlier', fill: '#ef4444', fontSize: 9 }} />
                <ReferenceLine y={1} stroke="#06b6d4" strokeWidth={1} strokeDasharray="2 2" />
                <ReferenceLine y={-1} stroke="#06b6d4" strokeWidth={1} strokeDasharray="2 2" />
              </>
            )}

            {/* Hovered 2Theta Marker Sync */}
            {hoveredX !== undefined && hoveredX !== null && (
              <ReferenceLine x={hoveredX} stroke="#ec4899" strokeWidth={1.8} strokeDasharray="2 2" />
            )}

            {/* Peak Center Marker */}
            <ReferenceLine x={stats.center} stroke="#818cf8" strokeWidth={1.2} strokeDasharray="3 3" />

            {/* Residual Curve or Stems */}
            {plotStyle === 'line' ? (
              <Line
                type="monotone"
                dataKey={residualMode === 'raw' ? 'residual' : 'normResidual'}
                stroke="#ff2a5f"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name={residualMode === 'raw' ? 'Residual ΔI' : 'Std Residual (ΔI/σ)'}
              />
            ) : (
              <Bar
                dataKey={residualMode === 'raw' ? 'residual' : 'normResidual'}
                fill="#ff2a5f"
                isAnimationActive={false}
                name={residualMode === 'raw' ? 'Residual ΔI' : 'Std Residual (ΔI/σ)'}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
