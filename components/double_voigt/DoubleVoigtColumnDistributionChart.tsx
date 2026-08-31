import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Layers, Activity, Ruler, Sliders, Info, Sparkles, TrendingUp } from 'lucide-react';
import { DoubleVoigtResult } from '../../types';
import { useSettings, convertLength } from '../SettingsContext';

interface DoubleVoigtColumnDistributionChartProps {
  result: DoubleVoigtResult;
}

export const DoubleVoigtColumnDistributionChart: React.FC<DoubleVoigtColumnDistributionChartProps> = ({ result }) => {
  const { lengthUnit = 'Å' } = useSettings();
  const [activeDistributionMode, setActiveDistributionMode] = useState<'both' | 'volume' | 'area' | 'strain' | 'fourier'>('both');
  const [selectedColumnL, setSelectedColumnL] = useState<number | null>(null);

  if (!result || !result.columnDistribution || result.columnDistribution.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-[#050C17]/60 rounded-2xl border border-white/5">
        No column-length distribution available. Ensure at least two valid diffraction reflections are analyzed.
      </div>
    );
  }

  const volumeSizeDvNm = result?.volumeSizeDvNm ?? 0;
  const areaSizeDaNm = result?.areaSizeDaNm ?? 0;
  const gaussianSizeDgNm = result?.gaussianSizeDgNm ?? 0;
  const polydispersityIndex = result?.polydispersityIndex ?? (areaSizeDaNm > 0 ? volumeSizeDvNm / areaSizeDaNm : 1.0);
  const modeSizeNm = result?.modeSizeNm ?? (volumeSizeDvNm * 0.7);
  const medianSizeNm = result?.medianSizeNm ?? volumeSizeDvNm;
  const columnDistribution = result?.columnDistribution ?? [];

  const currentHoveredPoint = selectedColumnL !== null
    ? columnDistribution.find(p => Math.abs(p.L_nm - selectedColumnL) < 0.5) || columnDistribution[0]
    : null;

  return (
    <div className="space-y-5 bg-[#030710]/70 p-4 sm:p-6 rounded-2xl border border-indigo-500/20 relative shadow-inner">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Balzar–Langford Real-Space Column-Length Distribution
            </h4>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Fourier Formalism
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-space crystallite column length functions <span className="font-mono text-indigo-300">P_V(L)</span> (volume-weighted) and <span className="font-mono text-purple-300">P_A(L)</span> (area-weighted) derived from Voigt profile convolution.
          </p>
        </div>

        {/* Display Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveDistributionMode('both')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeDistributionMode === 'both'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            P_V & P_A Curves
          </button>
          <button
            onClick={() => setActiveDistributionMode('volume')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeDistributionMode === 'volume'
                ? 'bg-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volume P_V(L)
          </button>
          <button
            onClick={() => setActiveDistributionMode('area')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeDistributionMode === 'area'
                ? 'bg-purple-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Area P_A(L)
          </button>
          <button
            onClick={() => setActiveDistributionMode('strain')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeDistributionMode === 'strain'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Strain(L) Decay
          </button>
          <button
            onClick={() => setActiveDistributionMode('fourier')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeDistributionMode === 'fourier'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fourier A^S(L)
          </button>
        </div>
      </div>

      {/* Primary Key Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
        <div className="bg-black/50 p-2.5 rounded-xl border border-indigo-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">⟨D_V⟩ Volume Size</div>
          <div className="text-base font-bold text-indigo-300">
            {convertLength(volumeSizeDvNm * 10, lengthUnit).toFixed(1)} <span className="text-[10px] text-slate-400">{lengthUnit}</span>
          </div>
          <div className="text-[9px] text-slate-500">1 / β_C,size*</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-purple-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">⟨D_A⟩ Area Size</div>
          <div className="text-base font-bold text-purple-300">
            {convertLength(areaSizeDaNm * 10, lengthUnit).toFixed(1)} <span className="text-[10px] text-slate-400">{lengthUnit}</span>
          </div>
          <div className="text-[9px] text-slate-500">Langford formula</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Mode Size (Peak)</div>
          <div className="text-base font-bold text-emerald-300">
            {convertLength(modeSizeNm * 10, lengthUnit).toFixed(1)} <span className="text-[10px] text-slate-400">{lengthUnit}</span>
          </div>
          <div className="text-[9px] text-slate-500">Max P_V(L)</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-amber-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Median Size</div>
          <div className="text-base font-bold text-amber-300">
            {convertLength(medianSizeNm * 10, lengthUnit).toFixed(1)} <span className="text-[10px] text-slate-400">{lengthUnit}</span>
          </div>
          <div className="text-[9px] text-slate-500">F(L) = 50%</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-cyan-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Polydispersity</div>
          <div className="text-base font-bold text-cyan-300">
            {polydispersityIndex.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500">⟨D_V⟩ / ⟨D_A⟩</div>
        </div>

        <div className="bg-black/50 p-2.5 rounded-xl border border-rose-500/20 space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Gaussian Size D_G</div>
          <div className="text-base font-bold text-rose-300">
            {convertLength(gaussianSizeDgNm * 10, lengthUnit).toFixed(1)} <span className="text-[10px] text-slate-400">{lengthUnit}</span>
          </div>
          <div className="text-[9px] text-slate-500">1 / (π · β_G*)</div>
        </div>
      </div>

      {/* Live Distribution Graph */}
      <div className="h-72 sm:h-96 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={columnDistribution}
            margin={{ top: 15, right: 30, bottom: 25, left: 15 }}
            onMouseMove={(e) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const pt = e.activePayload[0].payload;
                setSelectedColumnL(pt.L_nm);
              }
            }}
            onMouseLeave={() => setSelectedColumnL(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis
              dataKey="L_nm"
              type="number"
              domain={['auto', 'auto']}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              label={{
                value: 'Column Length L [nm]',
                position: 'insideBottom',
                offset: -15,
                fill: '#818cf8',
                fontSize: 12,
                fontFamily: 'monospace'
              }}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
              label={{
                value: activeDistributionMode === 'strain' ? 'RMS Strain ⟨e²(L)⟩¹/² [%]' : activeDistributionMode === 'fourier' ? 'Fourier A^S(L)' : 'Probability Density [nm⁻¹]',
                angle: -90,
                position: 'insideLeft',
                offset: -5,
                fill: '#818cf8',
                fontSize: 11,
                fontFamily: 'monospace'
              }}
            />
            {(activeDistributionMode === 'both' || activeDistributionMode === 'volume') && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                domain={[0, 1.0]}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                label={{
                  value: 'Cumulative F(L)',
                  angle: 90,
                  position: 'insideRight',
                  offset: 0,
                  fill: '#38bdf8',
                  fontSize: 11,
                  fontFamily: 'monospace'
                }}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#050C17]/95 border border-indigo-500/40 p-3.5 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1.5 min-w-[200px]">
                      <div className="text-indigo-400 font-bold border-b border-white/10 pb-1 flex items-center justify-between">
                        <span>Column Length L:</span>
                        <span className="text-white">{d.L_nm} nm ({convertLength(d.L_nm * 10, lengthUnit).toFixed(1)} {lengthUnit})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-300">Volume P_V(L):</span>
                        <span className="text-white font-bold">{d.pV} nm⁻¹</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-300">Area P_A(L):</span>
                        <span className="text-white font-bold">{d.pA} nm⁻¹</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sky-300">Cumulative F(L):</span>
                        <span className="text-white font-bold">{(d.cumulativeP * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-300">RMS Microstrain:</span>
                        <span className="text-white font-bold">{d.rmsStrainL}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-300">Fourier A^S(L):</span>
                        <span className="text-white font-bold">{d.aSizeFourier}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />

            {/* Reference Markers for Volume and Area Sizes */}
            <ReferenceLine
              yAxisId="left"
              x={volumeSizeDvNm}
              stroke="#818cf8"
              strokeDasharray="4 4"
              label={{
                value: `⟨D_V⟩ = ${volumeSizeDvNm.toFixed(1)} nm`,
                fill: '#818cf8',
                fontSize: 10,
                position: 'insideTopLeft'
              }}
            />
            <ReferenceLine
              yAxisId="left"
              x={areaSizeDaNm}
              stroke="#c084fc"
              strokeDasharray="4 4"
              label={{
                value: `⟨D_A⟩ = ${areaSizeDaNm.toFixed(1)} nm`,
                fill: '#c084fc',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />

            {(activeDistributionMode === 'both' || activeDistributionMode === 'volume') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="pV"
                name="Volume-Weighted P_V(L)"
                fill="url(#colorDvPv)"
                stroke="#818cf8"
                strokeWidth={2.5}
                dot={false}
              />
            )}

            {(activeDistributionMode === 'both' || activeDistributionMode === 'area') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pA"
                name="Area-Weighted P_A(L)"
                stroke="#c084fc"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
            )}

            {(activeDistributionMode === 'both' || activeDistributionMode === 'volume') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativeP"
                name="Cumulative Fraction F(L)"
                stroke="#38bdf8"
                strokeWidth={1.8}
                dot={false}
              />
            )}

            {activeDistributionMode === 'strain' && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="rmsStrainL"
                name="RMS Strain ⟨e²(L)⟩¹/² [%]"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
              />
            )}

            {activeDistributionMode === 'fourier' && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="aSizeFourier"
                name="Fourier Size Coefficient A^S(L)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
            )}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="colorDvPv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scientific Insights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-sans">
        <div className="bg-indigo-950/20 p-3.5 rounded-xl border border-indigo-500/20 space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Balzar-Langford Crystallite Distribution Theory</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            In the Double-Voigt method, the size Fourier transform is <span className="font-mono text-indigo-300">A^S(L) = exp(-2Lβ_C* - πL²β_G*²)</span>. The second derivative yields the exact area-weighted column-length distribution <span className="font-mono text-purple-300">P_A(L) = ⟨D_A⟩ d²A^S/dL²</span>, directly eliminating the need for Warren-Averbach order-dependent harmonic deconvolution.
          </p>
        </div>

        <div className="bg-purple-950/20 p-3.5 rounded-xl border border-purple-500/20 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-300 font-bold">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Polydispersity & Crystal Habit Diagnostic</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            {polydispersityIndex > 1.35
              ? `A high ⟨D_V⟩/⟨D_A⟩ ratio of ${polydispersityIndex.toFixed(2)} indicates wide size polydispersity (e.g. log-normal distribution with broad tail) or pronounced anisotropic crystal habit (rods/platelets).`
              : `A low ⟨D_V⟩/⟨D_A⟩ ratio of ${polydispersityIndex.toFixed(2)} indicates highly monodisperse, uniform spherical or equiaxed nanocrystals.`}
          </p>
        </div>
      </div>
    </div>
  );
};
