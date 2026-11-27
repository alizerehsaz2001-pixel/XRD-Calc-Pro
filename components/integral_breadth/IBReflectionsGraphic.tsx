import React, { useState, useId, useMemo } from 'react';
import {
  Activity,
  BarChart2,
  Layers,
  Target,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import {
  COLOR_VISION_MODES,
  getThemeSpec,
  isDarkTheme,
} from '../../utils/themeSystem';
import { computeDeKeijserVoigtFractions } from '../../utils/physics';

export type IBGraphicMode = 'spectrum' | 'broadening' | 'shape' | 'geometry';
type IntensityScaleMode = 'linear' | 'sqrt';

export interface IBGraphicPeak {
  idx: number;
  twoTheta: number;
  fwhm: number;
  area: number;
  iMax: number;
  betaObs: number;
  shapePhi: number;
  dSpacing: number;
  hklLabel: string;
  relIntensity: number;
  isExcluded?: boolean;
  betaInstDeg?: number;
  betaSampleDeg?: number;
  apparentSizeNm?: number;
}

interface IBReflectionsGraphicProps {
  peaks: IBGraphicPeak[];
  selectedPeakIdx: number;
  onSelectPeakIdx: (idx: number) => void;
  hoveredPeakIdx: number | null;
  onHoverPeakIdx: (idx: number | null) => void;
  wavelength: number;
  constantK: number;
  hasDeconvolution?: boolean;
  instrumentalMode?: 'constant' | 'caglioti';
  instBetaIB?: number;
  cagliotiParams?: { U: number; V: number; W: number };
  decouplingLabel?: string;
  onToggleExcludePeak?: (idx: number) => void;
  controlledMode?: IBGraphicMode;
  onModeChange?: (mode: IBGraphicMode) => void;
}

export const IBReflectionsGraphic: React.FC<IBReflectionsGraphicProps> = ({
  peaks,
  selectedPeakIdx,
  onSelectPeakIdx,
  hoveredPeakIdx,
  onHoverPeakIdx,
  wavelength,
  constantK,
  hasDeconvolution = false,
  instrumentalMode = 'constant',
  instBetaIB = 0,
  cagliotiParams,
  decouplingLabel,
  onToggleExcludePeak,
  controlledMode,
  onModeChange,
}) => {
  const uid = useId().replace(/:/g, '');
  const { theme, colorVisionMode } = useSettings();
  const dark = isDarkTheme(theme);
  const themeSpec = getThemeSpec(theme);
  const cvdEntry = useMemo(
    () =>
      COLOR_VISION_MODES.find((m) => m.id === colorVisionMode) ||
      COLOR_VISION_MODES[0],
    [colorVisionMode]
  );

  const [internalMode, setInternalMode] = useState<IBGraphicMode>('spectrum');
  const [intensityScale, setIntensityScale] = useState<IntensityScaleMode>('linear');

  const activeMode = controlledMode ?? internalMode;
  const setActiveMode = (mode: IBGraphicMode) => {
    setInternalMode(mode);
    onModeChange?.(mode);
  };

  const safeSelectedIdx =
    peaks.length > 0 ? Math.min(selectedPeakIdx, peaks.length - 1) : 0;
  const inspectedIdx =
    hoveredPeakIdx !== null && hoveredPeakIdx < peaks.length
      ? hoveredPeakIdx
      : safeSelectedIdx;
  const activePeak = peaks[inspectedIdx] || peaks[0];

  const palette = useMemo(() => {
    const isCvd = colorVisionMode !== 'normal';
    const [cvdPrimary, cvdHighlight, cvdSecondary] = cvdEntry.swatches;
    const t = themeSpec.tokens;
    if (dark) {
      return {
        shellBg: t.surface,
        canvasBg: t.canvas,
        insetBg: t.surfaceAlt,
        border: t.border,
        grid: '#1e293b',
        axis: '#475569',
        textPrimary: t.textPrimary,
        textSecondary: t.textSecondary,
        textMuted: t.textMuted,
        primaryTrace: isCvd ? cvdPrimary : '#38bdf8',
        boxTrace: isCvd ? cvdSecondary : '#34d399',
        instTrace: isCvd ? cvdHighlight : '#fbbf24',
        highlightTrace: isCvd ? cvdHighlight : '#f59e0b',
        voigtTrace: isCvd ? cvdPrimary : '#a78bfa',
        errorTrace: isCvd ? cvdHighlight : '#fb7185',
        excludedTrace: '#64748b',
      };
    }
    return {
      shellBg: t.surface,
      canvasBg: t.canvas,
      insetBg: t.surfaceAlt,
      border: t.border,
      grid: '#e2e8f0',
      axis: '#64748b',
      textPrimary: t.textPrimary,
      textSecondary: t.textSecondary,
      textMuted: t.textMuted,
      primaryTrace: isCvd ? cvdPrimary : '#0284c7',
      boxTrace: isCvd ? cvdSecondary : '#059669',
      instTrace: isCvd ? cvdHighlight : '#b45309',
      highlightTrace: isCvd ? cvdHighlight : '#d97706',
      voigtTrace: isCvd ? cvdPrimary : '#6d28d9',
      errorTrace: isCvd ? cvdHighlight : '#be123c',
      excludedTrace: '#94a3b8',
    };
  }, [dark, themeSpec, colorVisionMode, cvdEntry]);

  const evalInstIBAt = (twoThetaDeg: number): number => {
    if (!hasDeconvolution) return 0;
    if (instrumentalMode === 'caglioti' && cagliotiParams) {
      const tanT = Math.tan(((twoThetaDeg / 2) * Math.PI) / 180);
      const fwhmSq =
        cagliotiParams.U * tanT * tanT +
        cagliotiParams.V * tanT +
        cagliotiParams.W;
      return Math.sqrt(Math.max(1e-6, fwhmSq)) * 1.064467;
    }
    return Math.max(0, instBetaIB);
  };

  // Derive mixing parameter eta in [0=Gaussian, 1=Lorentzian] from Langford shape phi
  const phiToEta = (phi: number): number => {
    const clamped = Math.min(0.9394, Math.max(0.6366, phi));
    return 1 - (clamped - 0.6366) / (0.9394 - 0.6366);
  };

  const handleStepPeak = (delta: number) => {
    if (peaks.length === 0) return;
    const next = (safeSelectedIdx + delta + peaks.length) % peaks.length;
    onSelectPeakIdx(next);
  };

  const tabs: Array<{ id: IBGraphicMode; label: string; icon: React.ComponentType<{ className?: string }> }> =
    useMemo(() => {
      const base: Array<{
        id: IBGraphicMode;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
      }> = [{ id: 'spectrum', label: '2θ & β Boxes', icon: Activity }];
      if (hasDeconvolution) {
        base.push({ id: 'broadening', label: 'β Deconv', icon: Layers });
      }
      base.push({ id: 'shape', label: 'Shape φ Map', icon: BarChart2 });
      base.push({ id: 'geometry', label: 'Box Law', icon: Target });
      return base;
    }, [hasDeconvolution]);

  if (peaks.length === 0 || !activePeak) return null;

  const activeFractions = computeDeKeijserVoigtFractions(activePeak.shapePhi);
  const activeShapeRegime =
    activePeak.shapePhi <= 0.68
      ? 'Cauchy (Size-Dom)'
      : activePeak.shapePhi >= 0.88
        ? 'Gauss (Strain-Dom)'
        : 'Voigt (Mixed)';
  const sampleSharePct =
    hasDeconvolution && activePeak.betaObs > 0 && activePeak.betaSampleDeg !== undefined
      ? Math.min(100, Math.max(0, (activePeak.betaSampleDeg / activePeak.betaObs) * 100))
      : 100;

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        dark
          ? 'bg-[#070A12] border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Instrument Control Header */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b ${
          dark ? 'bg-[#0B101B] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Integral Breadth Reflections Graphic
          </span>
          <span
            className="text-[10px] font-mono tabular-nums text-slate-500 hidden sm:inline"
            aria-hidden="true"
          >
            ·
          </span>
          <span className="text-[10px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
            λ {wavelength.toFixed(4)} Å · K {constantK.toFixed(2)}
            {decouplingLabel ? ` · ${decouplingLabel}` : ' · β = Area / I_max'}
          </span>
        </div>

        {/* Peak Stepper + Mode Segmented Control */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`inline-flex items-center border rounded-md font-mono text-[10px] tabular-nums ${
              dark
                ? 'bg-[#070A12] border-slate-800 text-slate-200'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => handleStepPeak(-1)}
              className={`px-1.5 py-1 transition-colors cursor-pointer ${
                dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
              title="Previous reflection"
              aria-label="Previous reflection"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span
              className={`px-2 py-0.5 border-x font-semibold whitespace-nowrap ${
                dark ? 'border-slate-800 text-cyan-300' : 'border-slate-200 text-sky-700'
              }`}
            >
              {activePeak.hklLabel} · {inspectedIdx + 1}/{peaks.length}
            </span>
            <button
              type="button"
              onClick={() => handleStepPeak(1)}
              className={`px-1.5 py-1 transition-colors cursor-pointer ${
                dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
              title="Next reflection"
              aria-label="Next reflection"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div
            className={`inline-flex p-0.5 rounded-md border text-[10px] font-mono font-semibold ${
              dark
                ? 'bg-[#070A12] border-slate-800'
                : 'bg-slate-100 border-slate-200'
            }`}
            role="tablist"
            aria-label="Integral breadth graphic mode"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveMode(tab.id)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                    isActive
                      ? dark
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40'
                        : 'bg-white text-slate-900 border border-slate-300 shadow-xs'
                      : dark
                        ? 'text-slate-400 hover:text-slate-200 border border-transparent'
                        : 'text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mode-Specific Legend & Controls Strip */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b text-[10px] font-mono ${
          dark
            ? 'bg-[#080C16] border-slate-800/80 text-slate-400'
            : 'bg-white border-slate-200/80 text-slate-600'
        }`}
      >
        {activeMode === 'spectrum' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 inline-block"
                  style={{ backgroundColor: palette.primaryTrace }}
                />
                Voigt Envelope
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 border border-dashed inline-block"
                  style={{ borderColor: palette.boxTrace }}
                />
                Equiv. β Box (Area/I<sub>max</sub>)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 inline-block"
                  style={{ backgroundColor: palette.highlightTrace }}
                />
                FWHM Bracket
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Scale:</span>
              <div
                className={`inline-flex rounded border overflow-hidden ${
                  dark ? 'border-slate-700' : 'border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIntensityScale('linear')}
                  className={`px-2 py-0.5 cursor-pointer transition-colors ${
                    intensityScale === 'linear'
                      ? dark
                        ? 'bg-sky-500/20 text-sky-200 font-bold'
                        : 'bg-slate-900 text-white font-bold'
                      : 'hover:opacity-80'
                  }`}
                >
                  Linear
                </button>
                <button
                  type="button"
                  onClick={() => setIntensityScale('sqrt')}
                  className={`px-2 py-0.5 cursor-pointer transition-colors ${
                    intensityScale === 'sqrt'
                      ? dark
                        ? 'bg-sky-500/20 text-sky-200 font-bold'
                        : 'bg-slate-900 text-white font-bold'
                      : 'hover:opacity-80'
                  }`}
                >
                  √I
                </button>
              </div>
            </div>
          </>
        )}

        {activeMode === 'broadening' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block"
                  style={{ backgroundColor: palette.instTrace, opacity: 0.78 }}
                />
                β<sub>inst</sub> ({instrumentalMode === 'caglioti' ? 'Caglioti' : 'Const'})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block"
                  style={{ backgroundColor: palette.primaryTrace, opacity: 0.8 }}
                />
                β<sub>sample</sub> (Structural)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3.5 h-0.5 inline-block"
                  style={{ backgroundColor: palette.boxTrace }}
                />
                D<sub>app</sub> (nm)
              </span>
            </div>
            <span className="tabular-nums text-slate-500">
              {instrumentalMode === 'caglioti' && cagliotiParams
                ? `U=${cagliotiParams.U.toFixed(4)} V=${cagliotiParams.V.toFixed(4)} W=${cagliotiParams.W.toFixed(4)}`
                : `β_inst = ${instBetaIB.toFixed(4)}°`}
            </span>
          </>
        )}

        {activeMode === 'shape' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 border-t border-dashed inline-block"
                  style={{ borderColor: palette.primaryTrace }}
                />
                Cauchy Limit φ = 0.637 (2/π)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 border-t border-dashed inline-block"
                  style={{ borderColor: palette.boxTrace }}
                />
                Gauss Limit φ = 0.939 (2√(ln2/π))
              </span>
            </div>
            <span className="tabular-nums text-slate-500">
              Mean φ ={' '}
              <strong style={{ color: palette.textPrimary }}>
                {(
                  peaks.reduce((acc, p) => acc + p.shapePhi, 0) /
                  Math.max(1, peaks.length)
                ).toFixed(3)}
              </strong>
            </span>
          </>
        )}

        {activeMode === 'geometry' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 inline-block"
                  style={{ backgroundColor: palette.primaryTrace }}
                />
                Observed Profile (Area = ∫I d2θ)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 border border-dashed inline-block"
                  style={{ borderColor: palette.boxTrace }}
                />
                Equiv. Box (β<sub>obs</sub> × I<sub>max</sub>)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 inline-block"
                  style={{ backgroundColor: palette.highlightTrace }}
                />
                Half-Max FWHM
              </span>
            </div>
            <span className="tabular-nums text-slate-500">
              Regime: <strong style={{ color: palette.textPrimary }}>{activeShapeRegime}</strong>
            </span>
          </>
        )}
      </div>

      {/* Main High-Resolution Interactive SVG Canvas */}
      <div
        className="px-2.5 py-2"
        style={{ backgroundColor: palette.canvasBg }}
        onMouseLeave={() => onHoverPeakIdx(null)}
      >
        {/* ==================== MODE 1: 2θ DIFFRACTOGRAM + EQUIVALENT BOXES + INSET ==================== */}
        {activeMode === 'spectrum' &&
          (() => {
            const W = 640;
            const H = 238;
            const padL = 46;
            const padT = 20;
            const padB = 38;
            const insetGap = 14;
            const insetW = 212;
            const plotW = W - padL - insetGap - insetW - 10;
            const plotH = H - padT - padB;
            const baseY = padT + plotH;

            const allTT = peaks.map((p) => p.twoTheta);
            const rawMin = Math.min(...allTT);
            const rawMax = Math.max(...allTT);
            const pad = Math.max(6, (rawMax - rawMin) * 0.14);
            const xMin = Math.max(5, Math.floor(rawMin - pad));
            const xMax = Math.min(165, Math.ceil(rawMax + pad));
            const xSpan = Math.max(12, xMax - xMin);

            const xOf = (tt: number) => padL + ((tt - xMin) / xSpan) * plotW;
            const scaleVal = (norm01: number) =>
              intensityScale === 'sqrt' ? Math.sqrt(Math.max(0, norm01)) : norm01;
            const yOf = (norm01: number) =>
              baseY - Math.min(1, Math.max(0, scaleVal(norm01))) * (plotH - 12);

            const N_PTS = 240;
            const rawSamples: number[] = [];
            let maxSample = 0.01;
            for (let i = 0; i <= N_PTS; i++) {
              const tt = xMin + (i / N_PTS) * xSpan;
              let sum = 0;
              peaks.forEach((p) => {
                if (p.isExcluded) return;
                const amp = p.relIntensity / 100;
                const visHalf = Math.max(p.betaObs * 0.85, xSpan * 0.0085);
                const dx = (tt - p.twoTheta) / visHalf;
                if (Math.abs(dx) < 7) {
                  const eta = phiToEta(p.shapePhi);
                  const g = Math.exp(-Math.LN2 * dx * dx);
                  const l = 1 / (1 + dx * dx);
                  sum += amp * ((1 - eta) * g + eta * l);
                }
              });
              rawSamples.push(sum);
              if (sum > maxSample) maxSample = sum;
            }

            const curvePts: string[] = [];
            const areaPts: string[] = [`${padL},${baseY}`];
            for (let i = 0; i <= N_PTS; i++) {
              const tt = xMin + (i / N_PTS) * xSpan;
              const px = xOf(tt);
              const py = yOf(rawSamples[i] / maxSample);
              curvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              areaPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
            }
            areaPts.push(`${(padL + plotW).toFixed(1)},${baseY}`);

            // Collision stagger for (hkl) labels
            const ordered = peaks
              .map((p, idx) => ({ idx, x: xOf(p.twoTheta) }))
              .sort((a, b) => a.x - b.x);
            const staggerMap = new Map<number, number>();
            let prevX = -999;
            let level = 0;
            ordered.forEach((item) => {
              if (item.x - prevX < 34) {
                level = (level + 1) % 3;
              } else {
                level = 0;
              }
              staggerMap.set(item.idx, level);
              prevX = item.x;
            });

            // Right Stokes-Wilson Mini Box-Law Caliper Inset
            const insetX = padL + plotW + insetGap;
            const insetY = padT;
            const insetH = plotH + 18;
            const insetCx = insetX + insetW / 2;
            const insetBaseY = insetY + insetH - 36;
            const insetPeakH = insetH - 72;
            const eqBoxW = insetW * 0.42;
            const fwhmBoxW =
              eqBoxW * Math.min(1.05, Math.max(0.55, activePeak.shapePhi));
            const activeEta = phiToEta(activePeak.shapePhi);

            const insetCurvePts: string[] = [];
            const insetFillPts: string[] = [
              `${(insetX + 10).toFixed(1)},${insetBaseY}`,
            ];
            for (let k = 0; k <= 64; k++) {
              const frac = k / 64;
              const px = insetX + 10 + frac * (insetW - 20);
              const u = ((frac - 0.5) * (insetW - 20)) / (eqBoxW / 2);
              const g = Math.exp(-0.785 * u * u);
              const l = 1 / (1 + 0.65 * u * u);
              const yv = (1 - activeEta) * g + activeEta * l;
              const py = insetBaseY - yv * insetPeakH;
              insetCurvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              insetFillPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
            }
            insetFillPts.push(`${(insetX + insetW - 10).toFixed(1)},${insetBaseY}`);

            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[244px] select-none overflow-visible"
                role="img"
                aria-label="Integral breadth 2-theta diffractogram and equivalent box inset"
              >
                <defs>
                  <linearGradient id={`ibSpecArea-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={palette.primaryTrace}
                      stopOpacity={dark ? '0.26' : '0.18'}
                    />
                    <stop offset="100%" stopColor={palette.primaryTrace} stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Main Plot Frame */}
                <rect
                  x={padL}
                  y={padT}
                  width={plotW}
                  height={plotH}
                  rx="4"
                  fill={palette.insetBg}
                  stroke={palette.border}
                  strokeWidth="1"
                />

                {/* Y-Axis Grid & Ticks */}
                {[0.25, 0.5, 0.75, 1].map((g, i) => {
                  const gy = baseY - g * (plotH - 12);
                  const val =
                    intensityScale === 'sqrt'
                      ? Math.round(g * g * 100)
                      : Math.round(g * 100);
                  return (
                    <g key={i}>
                      <line
                        x1={padL}
                        y1={gy}
                        x2={padL + plotW}
                        y2={gy}
                        stroke={palette.grid}
                        strokeWidth="0.8"
                        strokeDasharray="2.5 2.5"
                      />
                      <text
                        x={padL - 7}
                        y={gy + 3}
                        textAnchor="end"
                        fill={palette.textMuted}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                  const tx = padL + t * plotW;
                  const deg = xMin + t * xSpan;
                  return (
                    <g key={i}>
                      <line
                        x1={tx}
                        y1={baseY}
                        x2={tx}
                        y2={baseY + 4}
                        stroke={palette.axis}
                        strokeWidth="1"
                      />
                      <text
                        x={tx}
                        y={baseY + 16}
                        textAnchor="middle"
                        fill={palette.textMuted}
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {deg.toFixed(0)}°
                      </text>
                    </g>
                  );
                })}

                <text
                  x={13}
                  y={padT + plotH / 2}
                  transform={`rotate(-90 13 ${padT + plotH / 2})`}
                  textAnchor="middle"
                  fill={palette.textSecondary}
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {intensityScale === 'sqrt' ? '√I (rel)' : 'I (rel %)'}
                </text>
                <text
                  x={padL + plotW / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fill={palette.textSecondary}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Diffraction Angle 2θ (°) · Click or hover reflection
                </text>

                {/* Continuous Diffractogram */}
                <polygon points={areaPts.join(' ')} fill={`url(#ibSpecArea-${uid})`} />
                <polyline
                  fill="none"
                  stroke={palette.primaryTrace}
                  strokeWidth="1.6"
                  points={curvePts.join(' ')}
                />

                {/* Reflection Sticks + Equivalent β Rectangles */}
                {peaks.map((p) => {
                  const px = xOf(p.twoTheta);
                  const topY = yOf(p.relIntensity / 100);
                  const isActive = p.idx === inspectedIdx;
                  const tier = staggerMap.get(p.idx) ?? 0;
                  const labelY = Math.max(padT + 10, topY - 8 - tier * 11);
                  const rectHalfW = Math.max(
                    3.5,
                    Math.min(18, (p.betaObs / xSpan) * plotW * 4.5)
                  );
                  const color = p.isExcluded
                    ? palette.errorTrace
                    : isActive
                      ? palette.highlightTrace
                      : palette.boxTrace;

                  return (
                    <g
                      key={p.idx}
                      onClick={() => onSelectPeakIdx(p.idx)}
                      onMouseEnter={() => onHoverPeakIdx(p.idx)}
                      className="cursor-pointer"
                      opacity={p.isExcluded ? 0.38 : 1}
                    >
                      <rect
                        x={px - 10}
                        y={padT}
                        width={20}
                        height={plotH}
                        fill="transparent"
                      />

                      {!p.isExcluded && (
                        <rect
                          x={px - rectHalfW}
                          y={topY}
                          width={rectHalfW * 2}
                          height={Math.max(1, baseY - topY)}
                          fill={isActive ? palette.boxTrace : palette.primaryTrace}
                          fillOpacity={isActive ? '0.18' : '0.07'}
                          stroke={isActive ? palette.boxTrace : palette.primaryTrace}
                          strokeOpacity={isActive ? '0.9' : '0.35'}
                          strokeWidth={isActive ? '1.2' : '0.7'}
                          strokeDasharray={isActive ? undefined : '2 1.5'}
                          rx="1"
                        />
                      )}

                      <line
                        x1={px}
                        y1={baseY}
                        x2={px}
                        y2={topY}
                        stroke={color}
                        strokeWidth={isActive ? '2.1' : '1.2'}
                        strokeDasharray={p.isExcluded ? '2 2' : undefined}
                      />
                      <circle
                        cx={px}
                        cy={topY}
                        r={isActive ? '4.2' : '2.8'}
                        fill={color}
                        stroke={palette.insetBg}
                        strokeWidth="1.2"
                      />
                      <text
                        x={px}
                        y={labelY}
                        textAnchor="middle"
                        fill={
                          p.isExcluded
                            ? palette.errorTrace
                            : isActive
                              ? palette.highlightTrace
                              : palette.textPrimary
                        }
                        fontSize={isActive ? '9.8' : '8.8'}
                        fontFamily="monospace"
                        fontWeight={isActive ? '700' : '600'}
                      >
                        {p.hklLabel}
                      </text>
                    </g>
                  );
                })}

                {/* RIGHT PANEL: Active Reflection Equivalent Box Inset */}
                <g>
                  <rect
                    x={insetX}
                    y={insetY}
                    width={insetW}
                    height={insetH}
                    rx="5"
                    fill={palette.insetBg}
                    stroke={palette.border}
                    strokeWidth="1"
                  />
                  <text
                    x={insetCx}
                    y={insetY + 16}
                    textAnchor="middle"
                    fill={palette.highlightTrace}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {activePeak.hklLabel} BOX CALIPER
                  </text>
                  <text
                    x={insetCx}
                    y={insetY + 29}
                    textAnchor="middle"
                    fill={palette.textMuted}
                    fontSize="8.6"
                    fontFamily="monospace"
                  >
                    2θ = {activePeak.twoTheta.toFixed(2)}° · φ = {activePeak.shapePhi.toFixed(3)}
                  </text>

                  <line
                    x1={insetX + 10}
                    y1={insetBaseY}
                    x2={insetX + insetW - 10}
                    y2={insetBaseY}
                    stroke={palette.axis}
                    strokeWidth="1"
                  />

                  <polygon
                    points={insetFillPts.join(' ')}
                    fill={palette.primaryTrace}
                    fillOpacity={dark ? '0.16' : '0.12'}
                  />
                  <polyline
                    fill="none"
                    stroke={palette.primaryTrace}
                    strokeWidth="1.8"
                    points={insetCurvePts.join(' ')}
                  />

                  {/* Equivalent β Rectangle */}
                  <rect
                    x={insetCx - eqBoxW / 2}
                    y={insetBaseY - insetPeakH}
                    width={eqBoxW}
                    height={insetPeakH}
                    fill={palette.boxTrace}
                    fillOpacity={dark ? '0.12' : '0.09'}
                    stroke={palette.boxTrace}
                    strokeWidth="1.3"
                    strokeDasharray="4 2"
                    rx="1.5"
                  />

                  {/* FWHM Bracket */}
                  <line
                    x1={insetCx - fwhmBoxW / 2}
                    y1={insetBaseY - insetPeakH * 0.5}
                    x2={insetCx + fwhmBoxW / 2}
                    y2={insetBaseY - insetPeakH * 0.5}
                    stroke={palette.highlightTrace}
                    strokeWidth="1.4"
                  />
                  <line
                    x1={insetCx - fwhmBoxW / 2}
                    y1={insetBaseY - insetPeakH * 0.5 - 3.5}
                    x2={insetCx - fwhmBoxW / 2}
                    y2={insetBaseY - insetPeakH * 0.5 + 3.5}
                    stroke={palette.highlightTrace}
                    strokeWidth="1.4"
                  />
                  <line
                    x1={insetCx + fwhmBoxW / 2}
                    y1={insetBaseY - insetPeakH * 0.5 - 3.5}
                    x2={insetCx + fwhmBoxW / 2}
                    y2={insetBaseY - insetPeakH * 0.5 + 3.5}
                    stroke={palette.highlightTrace}
                    strokeWidth="1.4"
                  />

                  {/* Inset Footer Readout */}
                  <text
                    x={insetX + 12}
                    y={insetY + insetH - 18}
                    fill={palette.boxTrace}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    β {activePeak.betaObs.toFixed(3)}°
                  </text>
                  <text
                    x={insetX + insetW - 12}
                    y={insetY + insetH - 18}
                    textAnchor="end"
                    fill={palette.highlightTrace}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    FWHM {activePeak.fwhm.toFixed(3)}°
                  </text>
                  <text
                    x={insetCx}
                    y={insetY + insetH - 5}
                    textAnchor="middle"
                    fill={palette.textMuted}
                    fontSize="8.4"
                    fontFamily="monospace"
                  >
                    A={activePeak.area.toFixed(0)} · I_max={activePeak.iMax.toFixed(0)}
                  </text>
                </g>
              </svg>
            );
          })()}

        {/* ==================== MODE 2: β DECONVOLUTION & CAGLIOTI FLOOR ==================== */}
        {activeMode === 'broadening' &&
          hasDeconvolution &&
          (() => {
            const W = 640;
            const H = 238;
            const padL = 52;
            const padR = 54;
            const padT = 22;
            const padB = 42;
            const plotW = W - padL - padR;
            const plotH = H - padT - padB;
            const baseY = padT + plotH;

            const maxBeta =
              Math.max(
                0.2,
                ...peaks.map((p) => Math.max(p.betaObs, p.betaInstDeg || 0))
              ) * 1.18;
            const validD = peaks
              .filter((p) => !p.isExcluded && (p.apparentSizeNm || 0) > 0)
              .map((p) => p.apparentSizeNm || 0);
            const maxD = validD.length > 0 ? Math.max(25, ...validD) * 1.2 : 100;

            const slotW = plotW / Math.max(1, peaks.length);
            const barW = Math.min(36, Math.max(12, slotW * 0.48));

            // Smooth sampled Caglioti / Constant instrumental resolution curve
            const instCurvePts: string[] = [];
            if (peaks.length > 0) {
              const firstTT = peaks[0].twoTheta;
              const lastTT = peaks[peaks.length - 1].twoTheta;
              const steps = 48;
              for (let i = 0; i <= steps; i++) {
                const frac = i / steps;
                const px =
                  padL +
                  0.5 * slotW +
                  frac * Math.max(0, (peaks.length - 1) * slotW);
                const tt = firstTT + frac * (lastTT - firstTT);
                const instB = evalInstIBAt(tt);
                const py = baseY - Math.min(1, instB / maxBeta) * plotH;
                instCurvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }
            }

            const dLocusPts: string[] = [];
            peaks.forEach((p, idx) => {
              if (!p.isExcluded && p.apparentSizeNm && p.apparentSizeNm > 0) {
                const cx = padL + (idx + 0.5) * slotW;
                const dy =
                  baseY - Math.min(1, p.apparentSizeNm / maxD) * plotH;
                dLocusPts.push(`${cx.toFixed(1)},${dy.toFixed(1)}`);
              }
            });

            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[244px] select-none overflow-visible"
                role="img"
                aria-label="Integral breadth deconvolution stacked bars and Caglioti floor"
              >
                <rect
                  x={padL}
                  y={padT}
                  width={plotW}
                  height={plotH}
                  rx="4"
                  fill={palette.insetBg}
                  stroke={palette.border}
                  strokeWidth="1"
                />

                {[0, 0.25, 0.5, 0.75, 1].map((g, i) => {
                  const gy = baseY - g * plotH;
                  return (
                    <g key={i}>
                      {g > 0 && g < 1 && (
                        <line
                          x1={padL}
                          y1={gy}
                          x2={padL + plotW}
                          y2={gy}
                          stroke={palette.grid}
                          strokeWidth="0.8"
                          strokeDasharray="2.5 2.5"
                        />
                      )}
                      <text
                        x={padL - 7}
                        y={gy + 3.2}
                        textAnchor="end"
                        fill={palette.primaryTrace}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {(maxBeta * g).toFixed(2)}°
                      </text>
                      <text
                        x={padL + plotW + 7}
                        y={gy + 3.2}
                        textAnchor="start"
                        fill={palette.boxTrace}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {Math.round(maxD * g)}
                      </text>
                    </g>
                  );
                })}

                <text
                  x={13}
                  y={padT + plotH / 2}
                  transform={`rotate(-90 13 ${padT + plotH / 2})`}
                  textAnchor="middle"
                  fill={palette.primaryTrace}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Integral Breadth β (°)
                </text>
                <text
                  x={W - 12}
                  y={padT + plotH / 2}
                  transform={`rotate(90 ${W - 12} ${padT + plotH / 2})`}
                  textAnchor="middle"
                  fill={palette.boxTrace}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Apparent D (nm)
                </text>

                {peaks.map((p, idx) => {
                  const cx = padL + (idx + 0.5) * slotW;
                  const isActive = p.idx === inspectedIdx;
                  const totalH = Math.min(plotH, (p.betaObs / maxBeta) * plotH);
                  const instH = Math.min(
                    totalH,
                    ((p.betaInstDeg || 0) / maxBeta) * plotH
                  );
                  const physH = Math.max(0, totalH - instH);

                  return (
                    <g
                      key={p.idx}
                      onClick={() => onSelectPeakIdx(p.idx)}
                      onMouseEnter={() => onHoverPeakIdx(p.idx)}
                      className="cursor-pointer"
                      opacity={p.isExcluded ? 0.35 : 1}
                    >
                      <rect
                        x={cx - slotW / 2}
                        y={padT}
                        width={slotW}
                        height={plotH}
                        fill={
                          isActive
                            ? dark
                              ? 'rgba(56,189,248,0.06)'
                              : 'rgba(2,132,199,0.06)'
                            : 'transparent'
                        }
                      />

                      {instH > 0.5 && (
                        <rect
                          x={cx - barW / 2}
                          y={baseY - instH}
                          width={barW}
                          height={instH}
                          rx="1.5"
                          fill={palette.instTrace}
                          fillOpacity={isActive ? '0.72' : '0.48'}
                          stroke={palette.instTrace}
                          strokeWidth={isActive ? '1.2' : '0.7'}
                        />
                      )}

                      {physH > 0.5 && (
                        <rect
                          x={cx - barW / 2}
                          y={baseY - instH - physH}
                          width={barW}
                          height={physH}
                          rx="1.5"
                          fill={palette.primaryTrace}
                          fillOpacity={isActive ? '0.8' : '0.46'}
                          stroke={isActive ? palette.textPrimary : palette.primaryTrace}
                          strokeWidth={isActive ? '1.3' : '0.8'}
                        />
                      )}

                      <text
                        x={cx}
                        y={baseY + 15}
                        textAnchor="middle"
                        fill={isActive ? palette.highlightTrace : palette.textPrimary}
                        fontSize="9.2"
                        fontFamily="monospace"
                        fontWeight={isActive ? '700' : '600'}
                      >
                        {p.hklLabel}
                      </text>
                      <text
                        x={cx}
                        y={baseY + 27}
                        textAnchor="middle"
                        fill={palette.textMuted}
                        fontSize="8.2"
                        fontFamily="monospace"
                      >
                        {p.twoTheta.toFixed(1)}°
                      </text>
                    </g>
                  );
                })}

                {instCurvePts.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={palette.instTrace}
                    strokeWidth="1.6"
                    strokeDasharray="4 2.5"
                    points={instCurvePts.join(' ')}
                  />
                )}

                {dLocusPts.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={palette.boxTrace}
                    strokeWidth="2"
                    points={dLocusPts.join(' ')}
                  />
                )}

                {peaks.map((p, idx) => {
                  if (p.isExcluded || !p.apparentSizeNm || p.apparentSizeNm <= 0)
                    return null;
                  const cx = padL + (idx + 0.5) * slotW;
                  const dy =
                    baseY - Math.min(1, p.apparentSizeNm / maxD) * plotH;
                  const isActive = p.idx === inspectedIdx;
                  return (
                    <g
                      key={`d-${p.idx}`}
                      onClick={() => onSelectPeakIdx(p.idx)}
                      onMouseEnter={() => onHoverPeakIdx(p.idx)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={cx}
                        cy={dy}
                        r={isActive ? '4.5' : '3.2'}
                        fill={isActive ? palette.highlightTrace : palette.boxTrace}
                        stroke={palette.insetBg}
                        strokeWidth="1.2"
                      />
                      <text
                        x={cx}
                        y={Math.max(padT + 11, dy - 8)}
                        textAnchor="middle"
                        fill={isActive ? palette.highlightTrace : palette.boxTrace}
                        fontSize="8.8"
                        fontFamily="monospace"
                        fontWeight="700"
                      >
                        {p.apparentSizeNm.toFixed(0)}nm
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}

        {/* ==================== MODE 3: LANGFORD VOIGT SHAPE FACTOR φ MAP ==================== */}
        {activeMode === 'shape' &&
          (() => {
            const W = 640;
            const H = 238;
            const padL = 66;
            const padR = 92;
            const padT = 22;
            const padB = 42;
            const plotW = W - padL - padR;
            const plotH = H - padT - padB;
            const baseY = padT + plotH;

            const minPhi = 0.56;
            const maxPhi = 1.02;
            const yOfPhi = (phi: number) => {
              const clamped = Math.min(maxPhi, Math.max(minPhi, phi));
              return baseY - ((clamped - minPhi) / (maxPhi - minPhi)) * plotH;
            };

            const yCauchy = yOfPhi(0.6366);
            const yGauss = yOfPhi(0.9394);
            const meanPhi =
              peaks.reduce((acc, p) => acc + p.shapePhi, 0) /
              Math.max(1, peaks.length);
            const yMean = yOfPhi(meanPhi);

            const slotW = plotW / Math.max(1, peaks.length);

            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[244px] select-none overflow-visible"
                role="img"
                aria-label="Langford Voigt shape factor phi diagnostic map"
              >
                {/* Plot Frame */}
                <rect
                  x={padL}
                  y={padT}
                  width={plotW}
                  height={plotH}
                  rx="4"
                  fill={palette.insetBg}
                  stroke={palette.border}
                  strokeWidth="1"
                />

                {/* Shaded Physical Voigt Regime Band (0.6366 .. 0.9394) */}
                <rect
                  x={padL}
                  y={yGauss}
                  width={plotW}
                  height={Math.max(2, yCauchy - yGauss)}
                  fill={palette.voigtTrace}
                  fillOpacity={dark ? '0.09' : '0.07'}
                />

                {/* Horizontal Y-Axis Ticks */}
                {[0.6, 0.7, 0.8, 0.9, 1.0].map((v, i) => {
                  const gy = yOfPhi(v);
                  return (
                    <g key={i}>
                      <line
                        x1={padL}
                        y1={gy}
                        x2={padL + plotW}
                        y2={gy}
                        stroke={palette.grid}
                        strokeWidth="0.7"
                        strokeDasharray="2 3"
                      />
                      <text
                        x={padL - 8}
                        y={gy + 3.2}
                        textAnchor="end"
                        fill={palette.textMuted}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {v.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Gaussian Limit Line (0.9394) */}
                <line
                  x1={padL}
                  y1={yGauss}
                  x2={padL + plotW}
                  y2={yGauss}
                  stroke={palette.boxTrace}
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
                <text
                  x={padL + plotW + 6}
                  y={yGauss + 3}
                  fill={palette.boxTrace}
                  fontSize="8.8"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  0.939 Gauss
                </text>

                {/* Cauchy Limit Line (0.6366) */}
                <line
                  x1={padL}
                  y1={yCauchy}
                  x2={padL + plotW}
                  y2={yCauchy}
                  stroke={palette.primaryTrace}
                  strokeWidth="1.3"
                  strokeDasharray="4 3"
                />
                <text
                  x={padL + plotW + 6}
                  y={yCauchy + 3}
                  fill={palette.primaryTrace}
                  fontSize="8.8"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  0.637 Cauchy
                </text>

                {/* Mean φ Reference Line */}
                <line
                  x1={padL}
                  y1={yMean}
                  x2={padL + plotW}
                  y2={yMean}
                  stroke={palette.highlightTrace}
                  strokeWidth="1.1"
                  strokeDasharray="2 2"
                  opacity="0.75"
                />
                <text
                  x={padL + plotW + 6}
                  y={yMean + 3}
                  fill={palette.highlightTrace}
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  Mean {meanPhi.toFixed(2)}
                </text>

                {/* Axis Titles */}
                <text
                  x={15}
                  y={padT + plotH / 2}
                  transform={`rotate(-90 15 ${padT + plotH / 2})`}
                  textAnchor="middle"
                  fill={palette.textSecondary}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Shape Factor φ = FWHM / β
                </text>

                {/* Reflection Stems & Dots */}
                {peaks.map((p, idx) => {
                  const cx = padL + (idx + 0.5) * slotW;
                  const cy = yOfPhi(p.shapePhi);
                  const isActive = p.idx === inspectedIdx;
                  const dotColor = p.isExcluded
                    ? palette.excludedTrace
                    : p.shapePhi <= 0.68
                      ? palette.primaryTrace
                      : p.shapePhi >= 0.88
                        ? palette.boxTrace
                        : palette.voigtTrace;

                  return (
                    <g
                      key={p.idx}
                      onClick={() => onSelectPeakIdx(p.idx)}
                      onMouseEnter={() => onHoverPeakIdx(p.idx)}
                      className="cursor-pointer"
                      opacity={p.isExcluded ? 0.38 : 1}
                    >
                      <rect
                        x={cx - slotW / 2}
                        y={padT}
                        width={slotW}
                        height={plotH}
                        fill="transparent"
                      />
                      <line
                        x1={cx}
                        y1={baseY}
                        x2={cx}
                        y2={cy}
                        stroke={isActive ? palette.highlightTrace : dotColor}
                        strokeWidth={isActive ? '2.2' : '1.4'}
                        strokeOpacity={isActive ? '0.95' : '0.65'}
                      />
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="8"
                          fill={palette.highlightTrace}
                          fillOpacity="0.2"
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? '4.8' : '3.8'}
                        fill={isActive ? palette.highlightTrace : dotColor}
                        stroke={palette.insetBg}
                        strokeWidth="1.2"
                      />
                      <text
                        x={cx}
                        y={Math.max(padT + 11, cy - 9)}
                        textAnchor="middle"
                        fill={isActive ? palette.highlightTrace : palette.textPrimary}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="700"
                      >
                        {p.shapePhi.toFixed(2)}
                      </text>
                      <text
                        x={cx}
                        y={baseY + 15}
                        textAnchor="middle"
                        fill={isActive ? palette.highlightTrace : palette.textPrimary}
                        fontSize="9.2"
                        fontFamily="monospace"
                        fontWeight={isActive ? '700' : '600'}
                      >
                        {p.hklLabel}
                      </text>
                      <text
                        x={cx}
                        y={baseY + 27}
                        textAnchor="middle"
                        fill={palette.textMuted}
                        fontSize="8.2"
                        fontFamily="monospace"
                      >
                        {p.twoTheta.toFixed(1)}°
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}

        {/* ==================== MODE 4: STOKES-WILSON BOX LAW GEOMETRY ==================== */}
        {activeMode === 'geometry' &&
          (() => {
            const W = 640;
            const H = 238;
            const padL = 22;
            const padT = 18;
            const padB = 34;
            const cardW = 248;
            const gap = 14;
            const plotW = W - padL - gap - cardW - 14;
            const plotH = H - padT - padB;
            const cx = padL + plotW / 2;
            const baseY = padT + plotH;
            const peakTopY = padT + 26;
            const peakH = baseY - peakTopY;

            const eqRectW = plotW * 0.44;
            const fwhmW =
              eqRectW * Math.min(1.05, Math.max(0.55, activePeak.shapePhi));
            const activeEta = phiToEta(activePeak.shapePhi);

            const curvePts: string[] = [];
            const fillPts: string[] = [`${padL + 10},${baseY}`];
            const steps = 100;
            for (let i = 0; i <= steps; i++) {
              const frac = i / steps;
              const px = padL + 10 + frac * (plotW - 20);
              const u = ((frac - 0.5) * (plotW - 20)) / (eqRectW / 2);
              const g = Math.exp(-0.785 * u * u);
              const l = 1 / (1 + 0.65 * u * u);
              const yVal = (1 - activeEta) * g + activeEta * l;
              const py = baseY - yVal * peakH;
              curvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              fillPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
            }
            fillPts.push(`${padL + plotW - 10},${baseY}`);

            const cardX = padL + plotW + gap;

            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[244px] select-none overflow-visible"
                role="img"
                aria-label="Stokes-Wilson integral breadth equivalent rectangle geometry"
              >
                {/* Left Profile Stage Frame */}
                <rect
                  x={padL}
                  y={padT}
                  width={plotW}
                  height={plotH + 22}
                  rx="5"
                  fill={palette.insetBg}
                  stroke={palette.border}
                  strokeWidth="1"
                />

                {/* Baseline */}
                <line
                  x1={padL + 10}
                  y1={baseY}
                  x2={padL + plotW - 10}
                  y2={baseY}
                  stroke={palette.axis}
                  strokeWidth="1.1"
                />

                {/* Bell Curve Integrated Area */}
                <polygon
                  points={fillPts.join(' ')}
                  fill={palette.primaryTrace}
                  fillOpacity={dark ? '0.18' : '0.14'}
                />
                <polyline
                  fill="none"
                  stroke={palette.primaryTrace}
                  strokeWidth="2.1"
                  points={curvePts.join(' ')}
                />

                {/* Equivalent Integral Breadth Rectangle */}
                <rect
                  x={cx - eqRectW / 2}
                  y={peakTopY}
                  width={eqRectW}
                  height={peakH}
                  fill={palette.boxTrace}
                  fillOpacity={dark ? '0.12' : '0.09'}
                  stroke={palette.boxTrace}
                  strokeWidth="1.5"
                  strokeDasharray="4.5 2.5"
                  rx="2"
                />

                {/* Centerline & Apex Marker */}
                <line
                  x1={cx}
                  y1={baseY}
                  x2={cx}
                  y2={peakTopY}
                  stroke={palette.axis}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={cx}
                  cy={peakTopY}
                  r="3.8"
                  fill={palette.primaryTrace}
                  stroke={palette.insetBg}
                  strokeWidth="1.2"
                />
                <text
                  x={cx}
                  y={peakTopY - 9}
                  textAnchor="middle"
                  fill={palette.primaryTrace}
                  fontSize="9.8"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  I_max = {activePeak.iMax.toFixed(0)} cts
                </text>

                {/* β_obs Caliper */}
                <line
                  x1={cx - eqRectW / 2}
                  y1={peakTopY + peakH * 0.28}
                  x2={cx + eqRectW / 2}
                  y2={peakTopY + peakH * 0.28}
                  stroke={palette.boxTrace}
                  strokeWidth="1.6"
                />
                <line
                  x1={cx - eqRectW / 2}
                  y1={peakTopY + peakH * 0.28 - 4}
                  x2={cx - eqRectW / 2}
                  y2={peakTopY + peakH * 0.28 + 4}
                  stroke={palette.boxTrace}
                  strokeWidth="1.6"
                />
                <line
                  x1={cx + eqRectW / 2}
                  y1={peakTopY + peakH * 0.28 - 4}
                  x2={cx + eqRectW / 2}
                  y2={peakTopY + peakH * 0.28 + 4}
                  stroke={palette.boxTrace}
                  strokeWidth="1.6"
                />
                <text
                  x={cx}
                  y={peakTopY + peakH * 0.28 - 6}
                  textAnchor="middle"
                  fill={palette.boxTrace}
                  fontSize="9.8"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  β_obs = {activePeak.betaObs.toFixed(4)}°
                </text>

                {/* FWHM Caliper at Half-Max */}
                <line
                  x1={cx - fwhmW / 2}
                  y1={peakTopY + peakH * 0.52}
                  x2={cx + fwhmW / 2}
                  y2={peakTopY + peakH * 0.52}
                  stroke={palette.highlightTrace}
                  strokeWidth="1.5"
                />
                <line
                  x1={cx - fwhmW / 2}
                  y1={peakTopY + peakH * 0.52 - 4}
                  x2={cx - fwhmW / 2}
                  y2={peakTopY + peakH * 0.52 + 4}
                  stroke={palette.highlightTrace}
                  strokeWidth="1.5"
                />
                <line
                  x1={cx + fwhmW / 2}
                  y1={peakTopY + peakH * 0.52 - 4}
                  x2={cx + fwhmW / 2}
                  y2={peakTopY + peakH * 0.52 + 4}
                  stroke={palette.highlightTrace}
                  strokeWidth="1.5"
                />
                <text
                  x={cx}
                  y={peakTopY + peakH * 0.52 + 13}
                  textAnchor="middle"
                  fill={palette.highlightTrace}
                  fontSize="9.2"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  FWHM = {activePeak.fwhm.toFixed(3)}° (φ = {activePeak.shapePhi.toFixed(3)})
                </text>

                <text
                  x={cx}
                  y={baseY + 15}
                  textAnchor="middle"
                  fill={palette.textSecondary}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  2θ = {activePeak.twoTheta.toFixed(3)}° · Reflection {activePeak.hklLabel}
                </text>

                {/* Right Panel: Stokes–Wilson & Voigt Component Derivation Card */}
                <g transform={`translate(${cardX}, ${padT})`}>
                  <rect
                    x="0"
                    y="0"
                    width={cardW}
                    height={plotH + 22}
                    rx="5"
                    fill={palette.insetBg}
                    stroke={palette.border}
                    strokeWidth="1"
                  />
                  <text
                    x="14"
                    y="20"
                    fill={palette.primaryTrace}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    STOKES–WILSON DERIVATION
                  </text>
                  <line
                    x1="14"
                    y1="27"
                    x2={cardW - 14}
                    y2="27"
                    stroke={palette.grid}
                    strokeWidth="1"
                  />

                  <text
                    x="14"
                    y="45"
                    fill={palette.textMuted}
                    fontSize="9.2"
                    fontFamily="monospace"
                  >
                    Area (∫I d2θ)
                  </text>
                  <text
                    x={cardW - 14}
                    y="45"
                    textAnchor="end"
                    fill={palette.textPrimary}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {activePeak.area.toFixed(1)} cts·°
                  </text>

                  <text
                    x="14"
                    y="64"
                    fill={palette.textMuted}
                    fontSize="9.2"
                    fontFamily="monospace"
                  >
                    Peak Height I_max
                  </text>
                  <text
                    x={cardW - 14}
                    y="64"
                    textAnchor="end"
                    fill={palette.textPrimary}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {activePeak.iMax.toFixed(0)} cts
                  </text>

                  <text
                    x="14"
                    y="84"
                    fill={palette.boxTrace}
                    fontSize="9.4"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    β_obs = Area / I_max
                  </text>
                  <text
                    x={cardW - 14}
                    y="84"
                    textAnchor="end"
                    fill={palette.boxTrace}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {activePeak.betaObs.toFixed(4)}°
                  </text>

                  {hasDeconvolution && activePeak.betaSampleDeg !== undefined && (
                    <>
                      <text
                        x="14"
                        y="103"
                        fill={palette.primaryTrace}
                        fontSize="9.2"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        Deconv β_sample
                      </text>
                      <text
                        x={cardW - 14}
                        y="103"
                        textAnchor="end"
                        fill={palette.primaryTrace}
                        fontSize="9.8"
                        fontFamily="monospace"
                        fontWeight="700"
                      >
                        {activePeak.betaSampleDeg.toFixed(4)}°
                      </text>
                    </>
                  )}

                  <line
                    x1="14"
                    y1={hasDeconvolution ? 115 : 98}
                    x2={cardW - 14}
                    y2={hasDeconvolution ? 115 : 98}
                    stroke={palette.grid}
                    strokeWidth="1"
                  />

                  {/* de Keijser Voigt Partition Bar (Cauchy Size vs Gauss Strain) */}
                  <text
                    x="14"
                    y={hasDeconvolution ? 131 : 116}
                    fill={palette.textSecondary}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    Voigt Partition (de Keijser)
                  </text>
                  <rect
                    x="14"
                    y={hasDeconvolution ? 138 : 123}
                    width={cardW - 28}
                    height="9"
                    rx="2"
                    fill={palette.grid}
                  />
                  <rect
                    x="14"
                    y={hasDeconvolution ? 138 : 123}
                    width={(cardW - 28) * Math.max(0, Math.min(1, activeFractions.fCauchy))}
                    height="9"
                    rx="2"
                    fill={palette.primaryTrace}
                  />
                  <rect
                    x={
                      14 +
                      (cardW - 28) *
                        Math.max(0, Math.min(1, activeFractions.fCauchy))
                    }
                    y={hasDeconvolution ? 138 : 123}
                    width={
                      (cardW - 28) *
                      Math.max(0, 1 - Math.min(1, activeFractions.fCauchy))
                    }
                    height="9"
                    rx="2"
                    fill={palette.boxTrace}
                  />
                  <text
                    x="14"
                    y={hasDeconvolution ? 160 : 146}
                    fill={palette.primaryTrace}
                    fontSize="8.8"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    f_C {(activeFractions.fCauchy * 100).toFixed(0)}% (Size)
                  </text>
                  <text
                    x={cardW - 14}
                    y={hasDeconvolution ? 160 : 146}
                    textAnchor="end"
                    fill={palette.boxTrace}
                    fontSize="8.8"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    f_G {(activeFractions.fGauss * 100).toFixed(0)}% (Strain)
                  </text>

                  <text
                    x="14"
                    y={plotH + 10}
                    fill={palette.textMuted}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    d_hkl = {activePeak.dSpacing.toFixed(4)} Å
                  </text>
                  {activePeak.apparentSizeNm !== undefined &&
                    activePeak.apparentSizeNm > 0 && (
                      <text
                        x={cardW - 14}
                        y={plotH + 10}
                        textAnchor="end"
                        fill={palette.highlightTrace}
                        fontSize="9.2"
                        fontFamily="monospace"
                        fontWeight="700"
                      >
                        D ≈ {activePeak.apparentSizeNm.toFixed(1)} nm
                      </text>
                    )}
                </g>
              </svg>
            );
          })()}
      </div>

      {/* Unified 5-Column Reflection Metrology Readout Strip */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x border-t font-mono tabular-nums ${
          dark
            ? 'bg-[#0B101B] border-slate-800 divide-slate-800'
            : 'bg-slate-50 border-slate-200 divide-slate-200'
        }`}
      >
        <div className="px-3 py-2 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              {hoveredPeakIdx !== null ? 'Hovered' : 'Selected'}
            </div>
            <div
              className={`text-[11px] font-bold truncate mt-0.5 ${
                dark ? 'text-cyan-300' : 'text-sky-800'
              }`}
            >
              {activePeak.hklLabel} · {activePeak.twoTheta.toFixed(2)}°
            </div>
          </div>
          {onToggleExcludePeak && (
            <button
              type="button"
              onClick={() => onToggleExcludePeak(activePeak.idx)}
              className={`p-1 rounded border transition-colors cursor-pointer shrink-0 ${
                activePeak.isExcluded
                  ? dark
                    ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                    : 'border-rose-300 bg-rose-50 text-rose-700'
                  : dark
                    ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-500/50'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-sky-500'
              }`}
              title={
                activePeak.isExcluded
                  ? 'Include reflection in regression'
                  : 'Exclude reflection from regression'
              }
            >
              {activePeak.isExcluded ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        <div className="px-3 py-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">
            Lattice d<sub>hkl</sub>
          </div>
          <div className="text-[11px] font-semibold mt-0.5">
            {activePeak.dSpacing.toFixed(4)} Å
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">
            β<sub>obs</sub> (Area/I<sub>max</sub>)
          </div>
          <div
            className={`text-[11px] font-bold mt-0.5 ${
              dark ? 'text-amber-300' : 'text-amber-800'
            }`}
          >
            {activePeak.betaObs.toFixed(4)}°
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">
            Shape φ (FWHM/β)
          </div>
          <div
            className={`text-[11px] font-semibold mt-0.5 ${
              dark ? 'text-violet-300' : 'text-violet-800'
            }`}
          >
            {activePeak.shapePhi.toFixed(3)}{' '}
            <span className="text-[9.5px] font-normal text-slate-500">
              ({activeShapeRegime.split(' ')[0]})
            </span>
          </div>
        </div>

        <div className="px-3 py-2 col-span-2 sm:col-span-1">
          <div className="text-[9px] uppercase tracking-wider text-slate-500">
            {hasDeconvolution ? 'β_sample / D_app' : 'Area / I_max'}
          </div>
          <div
            className={`text-[11px] font-bold mt-0.5 ${
              dark ? 'text-emerald-300' : 'text-emerald-700'
            }`}
          >
            {hasDeconvolution && activePeak.betaSampleDeg !== undefined ? (
              <>
                {activePeak.betaSampleDeg.toFixed(3)}°{' '}
                <span className="text-[9.5px] font-normal text-slate-500">
                  ({sampleSharePct.toFixed(0)}%)
                </span>
              </>
            ) : (
              <>
                {activePeak.area.toFixed(0)} / {activePeak.iMax.toFixed(0)}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
