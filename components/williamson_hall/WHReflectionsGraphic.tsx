import React, { useState, useId, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ScherrerInput } from '../../types';
import { useSettings } from '../SettingsContext';
import {
  COLOR_VISION_MODES,
  getThemeSpec,
  isDarkTheme,
} from '../../utils/themeSystem';

export interface WHDerivedPeakProps {
  dSpacing: number;
  fourSinTheta: number;
  instFwhmAtPeak: number;
  betaSampleDeg: number;
  betaCosThetaRad: number;
  betaCosThetaMrad: number;
  apparentSizeNm: number;
  sampleSharePct: number;
  isNearInstLimit: boolean;
  residualMrad: number | null;
  isOutlier: boolean;
}

export interface WHEnrichedPeak extends ScherrerInput {
  idx: number;
  isExcluded: boolean;
  derived: WHDerivedPeakProps;
}

export interface WHRegressionSummary {
  slopeMrad: number;
  interceptMrad: number;
  sizeNm: number;
  strainPercent: number;
  rSquared: number;
  rmsResidualMrad: number;
}

interface WHReflectionsGraphicProps {
  enrichedPeaks: WHEnrichedPeak[];
  whRegressionPreview: WHRegressionSummary | null;
  selectedPeakIndex: number;
  onSelectPeakIndex: (idx: number) => void;
  onToggleExcludePeak: (idx: number) => void;
  wavelength: number;
  constantK: number;
  instFwhm: number;
  instrumentalMode: 'constant' | 'caglioti';
  cagliotiU: number;
  cagliotiV: number;
  cagliotiW: number;
  isDecouplingEnabled: boolean;
  broadeningModel: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt';
  strainModel?: string;
}

type GraphicMode = 'whLocus' | 'pattern' | 'broadening';
type IntensityScaleMode = 'linear' | 'sqrt';

export const WHReflectionsGraphic: React.FC<WHReflectionsGraphicProps> = ({
  enrichedPeaks,
  whRegressionPreview,
  selectedPeakIndex,
  onSelectPeakIndex,
  onToggleExcludePeak,
  wavelength,
  constantK,
  instFwhm,
  instrumentalMode,
  cagliotiU,
  cagliotiV,
  cagliotiW,
  isDecouplingEnabled,
  broadeningModel,
  strainModel = 'UDM',
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

  const [graphicMode, setGraphicMode] = useState<GraphicMode>('whLocus');
  const [intensityScale, setIntensityScale] = useState<IntensityScaleMode>('linear');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const safeSelectedIdx =
    enrichedPeaks.length > 0
      ? Math.min(selectedPeakIndex, enrichedPeaks.length - 1)
      : 0;
  const inspectedIdx =
    hoveredIdx !== null && hoveredIdx < enrichedPeaks.length
      ? hoveredIdx
      : safeSelectedIdx;

  const activePeak = enrichedPeaks[inspectedIdx] || enrichedPeaks[0];

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
        physicalTrace: isCvd ? cvdSecondary : '#34d399',
        instTrace: isCvd ? cvdHighlight : '#fbbf24',
        highlightTrace: isCvd ? cvdHighlight : '#f59e0b',
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
      physicalTrace: isCvd ? cvdSecondary : '#059669',
      instTrace: isCvd ? cvdHighlight : '#b45309',
      highlightTrace: isCvd ? cvdHighlight : '#d97706',
      errorTrace: isCvd ? cvdHighlight : '#be123c',
      excludedTrace: '#94a3b8',
    };
  }, [dark, themeSpec, colorVisionMode, cvdEntry]);

  const evalInstAt = (twoThetaDeg: number): number => {
    if (!isDecouplingEnabled) return 0;
    if (instrumentalMode === 'constant') return Math.max(0, instFwhm);
    const tanT = Math.tan(((twoThetaDeg / 2) * Math.PI) / 180);
    return Math.sqrt(Math.max(0, cagliotiU * tanT * tanT + cagliotiV * tanT + cagliotiW));
  };

  const eta =
    broadeningModel === 'Lorentzian'
      ? 1.0
      : broadeningModel === 'Gaussian'
        ? 0.0
        : 0.5;

  const handleStepPeak = (delta: number) => {
    if (enrichedPeaks.length === 0) return;
    const next =
      (safeSelectedIdx + delta + enrichedPeaks.length) % enrichedPeaks.length;
    onSelectPeakIndex(next);
  };

  const activeHklLabel = activePeak?.hkl
    ? `(${activePeak.hkl.join('')})`
    : `#${inspectedIdx + 1}`;

  if (enrichedPeaks.length === 0) return null;

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
        {/* Title & Active Optics Metadata */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
            Williamson–Hall Reflections Graphic
          </span>
          <span
            className="text-[10px] font-mono tabular-nums text-slate-500 hidden sm:inline"
            aria-hidden="true"
          >
            ·
          </span>
          <span className="text-[10px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
            {strainModel} · λ {wavelength.toFixed(4)} Å · K {constantK.toFixed(2)} ·{' '}
            {broadeningModel}
          </span>
        </div>

        {/* Peak Stepper + 3-Mode Segmented Control */}
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
              {activeHklLabel} · {inspectedIdx + 1}/{enrichedPeaks.length}
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
            aria-label="Williamson-Hall graphic mode"
          >
            {[
              { id: 'whLocus' as const, label: 'W-H Locus', icon: TrendingUp },
              { id: 'pattern' as const, label: '2θ & Caliper', icon: Activity },
              { id: 'broadening' as const, label: 'β Deconv', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = graphicMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setGraphicMode(tab.id)}
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

      {/* Mode-Specific Legend & Sub-Controls Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b text-[10px] font-mono ${
          dark
            ? 'bg-[#080C16] border-slate-800/80 text-slate-400'
            : 'bg-white border-slate-200/80 text-slate-600'
        }`}
      >
        {graphicMode === 'whLocus' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3.5 h-0.5 inline-block"
                  style={{ backgroundColor: palette.highlightTrace }}
                />
                OLS Fit (Slope = ε)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3.5 border-t border-dashed inline-block"
                  style={{ borderColor: palette.physicalTrace }}
                />
                Zero-Strain Kλ/D
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: palette.primaryTrace }}
                />
                Active Peak
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: palette.errorTrace }}
                />
                High Residual
              </span>
            </div>
            {whRegressionPreview && (
              <div className="flex items-center gap-2.5 tabular-nums">
                <span>
                  D<sub>WH</sub>{' '}
                  <strong style={{ color: palette.physicalTrace }}>
                    {whRegressionPreview.sizeNm > 0 && whRegressionPreview.sizeNm < 500
                      ? `${whRegressionPreview.sizeNm.toFixed(1)} nm`
                      : '>500 nm'}
                  </strong>
                </span>
                <span>
                  ε{' '}
                  <strong style={{ color: palette.highlightTrace }}>
                    {whRegressionPreview.strainPercent >= 0 ? '+' : ''}
                    {whRegressionPreview.strainPercent.toFixed(3)}%
                  </strong>
                </span>
                <span>
                  R²{' '}
                  <strong style={{ color: palette.primaryTrace }}>
                    {whRegressionPreview.rSquared.toFixed(4)}
                  </strong>
                </span>
              </div>
            )}
          </>
        )}

        {graphicMode === 'pattern' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 h-0.5 inline-block"
                  style={{ backgroundColor: palette.primaryTrace }}
                />
                Observed β<sub>obs</sub>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3 border-t-2 border-dashed inline-block"
                  style={{ borderColor: palette.physicalTrace }}
                />
                Sample β<sub>s</sub>
              </span>
              {isDecouplingEnabled && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-3 border-t-2 border-dotted inline-block"
                    style={{ borderColor: palette.instTrace }}
                  />
                  Inst β<sub>inst</sub>
                </span>
              )}
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

        {graphicMode === 'broadening' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block"
                  style={{
                    backgroundColor: palette.instTrace,
                    opacity: 0.75,
                  }}
                />
                β<sub>inst</sub> ({instrumentalMode === 'caglioti' ? 'Caglioti' : 'Const'})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block"
                  style={{
                    backgroundColor: palette.primaryTrace,
                    opacity: 0.8,
                  }}
                />
                β<sub>sample</sub> (Deconvolved)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-3.5 h-0.5 inline-block"
                  style={{ backgroundColor: palette.physicalTrace }}
                />
                D<sub>app</sub> (nm)
              </span>
            </div>
            <span className="tabular-nums text-slate-500">
              {!isDecouplingEnabled
                ? 'Inst. Decoupling Off'
                : instrumentalMode === 'caglioti'
                  ? `U=${cagliotiU.toFixed(4)} V=${cagliotiV.toFixed(4)} W=${cagliotiW.toFixed(4)}`
                  : `β_inst = ${instFwhm.toFixed(3)}°`}
            </span>
          </>
        )}
      </div>

      {/* Main High-Resolution Interactive SVG Canvas */}
      <div
        className="px-2.5 py-2"
        style={{ backgroundColor: palette.canvasBg }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* ==================== MODE 1: INTERACTIVE WILLIAMSON-HALL REGRESSION LOCUS ==================== */}
        {graphicMode === 'whLocus' &&
          (() => {
            const W = 640;
            const H = 236;
            const padL = 56;
            const padR = 24;
            const padT = 22;
            const padB = 40;
            const plotW = W - padL - padR;
            const plotH = H - padT - padB;
            const baseY = padT + plotH;

            const xs = enrichedPeaks.map((p) => p.derived.fourSinTheta);
            const ys = enrichedPeaks.map((p) => p.derived.betaCosThetaMrad);
            const minX = 0;
            const maxX = Math.max(2.6, ...xs) * 1.1;
            const minY = 0;
            const maxFitEnd = whRegressionPreview
              ? whRegressionPreview.interceptMrad + whRegressionPreview.slopeMrad * maxX
              : 0;
            const maxY =
              Math.max(
                4,
                ...ys,
                whRegressionPreview ? Math.max(whRegressionPreview.interceptMrad * 1.25, maxFitEnd) : 0
              ) * 1.16;

            const xOf = (x: number) =>
              padL + ((x - minX) / Math.max(0.001, maxX - minX)) * plotW;
            const yOf = (y: number) =>
              baseY -
              Math.min(1, Math.max(0, (y - minY) / Math.max(0.001, maxY - minY))) *
                plotH;

            const yIntVal = whRegressionPreview ? Math.max(0, whRegressionPreview.interceptMrad) : 0;
            const yIntPx = yOf(yIntVal);
            const yEndVal = whRegressionPreview
              ? whRegressionPreview.interceptMrad + whRegressionPreview.slopeMrad * maxX
              : 0;
            const yEndPx = yOf(yEndVal);

            // Slope triangle geometry (from 38% to 74% of X span)
            const triX1Val = maxX * 0.36;
            const triX2Val = maxX * 0.72;
            const triY1Val = whRegressionPreview
              ? whRegressionPreview.interceptMrad + whRegressionPreview.slopeMrad * triX1Val
              : 0;
            const triY2Val = whRegressionPreview
              ? whRegressionPreview.interceptMrad + whRegressionPreview.slopeMrad * triX2Val
              : 0;
            const showSlopeTriangle =
              !!whRegressionPreview &&
              Math.abs(yOf(triY2Val) - yOf(triY1Val)) > 8 &&
              triY1Val >= 0 &&
              triY2Val >= 0 &&
              triY2Val <= maxY * 0.96;

            // Collision stagger for (hkl) labels
            const sortedIdx = enrichedPeaks
              .map((p, i) => ({ i, x: xOf(p.derived.fourSinTheta), y: yOf(p.derived.betaCosThetaMrad) }))
              .sort((a, b) => a.x - b.x);
            const labelShiftMap = new Map<number, number>();
            let lastX = -999;
            let lastY = -999;
            let tier = 0;
            sortedIdx.forEach((pt) => {
              if (Math.abs(pt.x - lastX) < 34 && Math.abs(pt.y - lastY) < 22) {
                tier = (tier + 1) % 3;
              } else {
                tier = 0;
              }
              labelShiftMap.set(pt.i, tier);
              lastX = pt.x;
              lastY = pt.y;
            });

            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[242px] select-none overflow-visible"
                role="img"
                aria-label="Williamson-Hall linear regression locus plot"
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

                {/* Horizontal Grid & Y-Axis Ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map((g, i) => {
                  const gy = baseY - g * plotH;
                  const val = maxY * g;
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
                      <line
                        x1={padL - 4}
                        y1={gy}
                        x2={padL}
                        y2={gy}
                        stroke={palette.axis}
                        strokeWidth="1"
                      />
                      <text
                        x={padL - 8}
                        y={gy + 3.5}
                        textAnchor="end"
                        fill={palette.textMuted}
                        fontSize="9.5"
                        fontFamily="monospace"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Grid & X-Axis Ticks */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                  const tx = padL + t * plotW;
                  const val = minX + t * (maxX - minX);
                  return (
                    <g key={i}>
                      {t > 0 && t < 1 && (
                        <line
                          x1={tx}
                          y1={padT}
                          x2={tx}
                          y2={baseY}
                          stroke={palette.grid}
                          strokeWidth="0.8"
                          strokeDasharray="2.5 2.5"
                        />
                      )}
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
                        {val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Titles */}
                <text
                  x={15}
                  y={padT + plotH / 2}
                  transform={`rotate(-90 15 ${padT + plotH / 2})`}
                  textAnchor="middle"
                  fill={palette.textSecondary}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  β_s · cos θ (mrad)
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
                  Strain Lever Arm  4 · sin θ  (dimensionless)
                </text>

                {/* Zero-strain horizontal baseline from Y-intercept */}
                {whRegressionPreview && whRegressionPreview.interceptMrad > 0 && (
                  <g>
                    <line
                      x1={padL}
                      y1={yIntPx}
                      x2={padL + plotW}
                      y2={yIntPx}
                      stroke={palette.physicalTrace}
                      strokeWidth="1.15"
                      strokeDasharray="4 3"
                      opacity="0.7"
                    />
                    <circle
                      cx={padL}
                      cy={yIntPx}
                      r="3.8"
                      fill={palette.physicalTrace}
                      stroke={palette.insetBg}
                      strokeWidth="1.2"
                    />
                    <text
                      x={padL + 8}
                      y={Math.max(padT + 12, yIntPx - 6)}
                      fill={palette.physicalTrace}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      Kλ/D = {whRegressionPreview.interceptMrad.toFixed(2)} mrad
                    </text>
                  </g>
                )}

                {/* Slope Triangle (Visual Strain Slope Δy/Δx = ε) */}
                {showSlopeTriangle && whRegressionPreview && (
                  <g opacity="0.85">
                    <polygon
                      points={`${xOf(triX1Val).toFixed(1)},${yOf(triY1Val).toFixed(1)} ${xOf(triX2Val).toFixed(1)},${yOf(triY1Val).toFixed(1)} ${xOf(triX2Val).toFixed(1)},${yOf(triY2Val).toFixed(1)}`}
                      fill={palette.highlightTrace}
                      fillOpacity={dark ? '0.10' : '0.09'}
                      stroke={palette.highlightTrace}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={xOf(triX2Val) + 6}
                      y={(yOf(triY1Val) + yOf(triY2Val)) / 2 + 3}
                      fill={palette.highlightTrace}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="700"
                    >
                      ε = {whRegressionPreview.strainPercent >= 0 ? '+' : ''}
                      {whRegressionPreview.strainPercent.toFixed(3)}%
                    </text>
                  </g>
                )}

                {/* OLS Linear Regression Line */}
                {whRegressionPreview && (
                  <line
                    x1={padL}
                    y1={yIntPx}
                    x2={padL + plotW}
                    y2={yEndPx}
                    stroke={palette.highlightTrace}
                    strokeWidth="2.1"
                  />
                )}

                {/* Active Peak Crosshair Guide */}
                {activePeak && (
                  <g opacity="0.55">
                    <line
                      x1={xOf(activePeak.derived.fourSinTheta)}
                      y1={padT}
                      x2={xOf(activePeak.derived.fourSinTheta)}
                      y2={baseY}
                      stroke={palette.highlightTrace}
                      strokeWidth="1"
                      strokeDasharray="3 2.5"
                    />
                    <line
                      x1={padL}
                      y1={yOf(activePeak.derived.betaCosThetaMrad)}
                      x2={xOf(activePeak.derived.fourSinTheta)}
                      y2={yOf(activePeak.derived.betaCosThetaMrad)}
                      stroke={palette.highlightTrace}
                      strokeWidth="1"
                      strokeDasharray="3 2.5"
                    />
                  </g>
                )}

                {/* Peak Points & Residual Drop-Lines */}
                {enrichedPeaks.map((p, idx) => {
                  const cx = xOf(p.derived.fourSinTheta);
                  const cy = yOf(p.derived.betaCosThetaMrad);
                  const yFitVal = whRegressionPreview
                    ? whRegressionPreview.interceptMrad +
                      whRegressionPreview.slopeMrad * p.derived.fourSinTheta
                    : p.derived.betaCosThetaMrad;
                  const yFitPx = yOf(yFitVal);
                  const isActive = idx === inspectedIdx;
                  const isExcluded = p.isExcluded;
                  const isOutlier = !isExcluded && p.derived.isOutlier;
                  const tier = labelShiftMap.get(idx) ?? 0;
                  const labelY = Math.max(padT + 11, cy - 10 - tier * 12);
                  const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;
                  const dotFill = isExcluded
                    ? palette.excludedTrace
                    : isOutlier
                      ? palette.errorTrace
                      : isActive
                        ? palette.highlightTrace
                        : palette.primaryTrace;

                  return (
                    <g
                      key={idx}
                      onClick={() => onSelectPeakIndex(idx)}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      className="cursor-pointer"
                      opacity={isExcluded ? 0.42 : 1}
                    >
                      {/* Generous invisible hover/click target */}
                      <circle cx={cx} cy={cy} r="13" fill="transparent" />

                      {/* Residual Stem to Regression Line */}
                      {!isExcluded && whRegressionPreview && (
                        <line
                          x1={cx}
                          y1={cy}
                          x2={cx}
                          y2={yFitPx}
                          stroke={isOutlier ? palette.errorTrace : palette.axis}
                          strokeWidth={isActive || isOutlier ? '1.5' : '1.0'}
                          strokeDasharray={isOutlier ? undefined : '2 2'}
                        />
                      )}

                      {/* Active selection halo */}
                      {isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="8.5"
                          fill={dotFill}
                          fillOpacity="0.18"
                          stroke={dotFill}
                          strokeWidth="1.2"
                        />
                      )}

                      {/* Outlier indicator ring */}
                      {isOutlier && !isActive && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="6.5"
                          fill="none"
                          stroke={palette.errorTrace}
                          strokeWidth="1"
                          strokeDasharray="2 1.5"
                        />
                      )}

                      {/* Data Point */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isActive ? '4.8' : '3.8'}
                        fill={dotFill}
                        stroke={palette.insetBg}
                        strokeWidth="1.3"
                      />

                      {/* Excluded strike-through */}
                      {isExcluded && (
                        <line
                          x1={cx - 5}
                          y1={cy - 5}
                          x2={cx + 5}
                          y2={cy + 5}
                          stroke={palette.errorTrace}
                          strokeWidth="1.3"
                        />
                      )}

                      {/* Reflection (hkl) Label */}
                      <text
                        x={cx}
                        y={labelY}
                        textAnchor="middle"
                        fill={
                          isExcluded
                            ? palette.textMuted
                            : isActive
                              ? palette.highlightTrace
                              : isOutlier
                                ? palette.errorTrace
                                : palette.textPrimary
                        }
                        fontSize={isActive ? '10' : '9'}
                        fontFamily="monospace"
                        fontWeight={isActive || isOutlier ? '700' : '600'}
                      >
                        {hklText}
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}

        {/* ==================== MODE 2: 2θ DIFFRACTOGRAM + PROFILE CALIPER INSET ==================== */}
        {graphicMode === 'pattern' &&
          (() => {
            const W = 640;
            const H = 236;
            const padL = 46;
            const padT = 20;
            const padB = 38;
            const insetGap = 14;
            const insetW = 216;
            const plotW = W - padL - insetGap - insetW - 10;
            const plotH = H - padT - padB;
            const baseY = padT + plotH;

            const allTT = enrichedPeaks.map((p) => p.twoTheta);
            const rawMin = Math.min(...allTT);
            const rawMax = Math.max(...allTT);
            const pad = Math.max(5, (rawMax - rawMin) * 0.14);
            const xMin = Math.max(5, Math.floor(rawMin - pad));
            const xMax = Math.min(165, Math.ceil(rawMax + pad));
            const xSpan = Math.max(12, xMax - xMin);

            const xOf = (tt: number) => padL + ((tt - xMin) / xSpan) * plotW;

            const scaleVal = (norm01: number) =>
              intensityScale === 'sqrt' ? Math.sqrt(Math.max(0, norm01)) : norm01;

            const yOf = (norm01: number) =>
              baseY - Math.min(1, Math.max(0, scaleVal(norm01))) * (plotH - 12);

            // Compute relative peak height proxy from inverse FWHM (sharper = taller) if no explicit intensity
            const peakAmps = enrichedPeaks.map((p) =>
              p.intensity !== undefined
                ? p.intensity
                : Math.min(100, Math.max(32, 26 / Math.max(0.11, p.fwhmObs)))
            );
            const maxAmp = Math.max(...peakAmps, 1);

            // Sample continuous Pseudo-Voigt pattern
            const N_PTS = 240;
            const rawSamples: number[] = [];
            let maxSample = 0.01;
            for (let i = 0; i <= N_PTS; i++) {
              const tt = xMin + (i / N_PTS) * xSpan;
              let sum = 0;
              enrichedPeaks.forEach((p, idx) => {
                if (p.isExcluded) return;
                const amp = peakAmps[idx] / maxAmp;
                const visHalf = Math.max(p.fwhmObs * 0.9, xSpan * 0.0085);
                const dx = (tt - p.twoTheta) / visHalf;
                if (Math.abs(dx) < 7) {
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

            // Stagger (hkl) labels to avoid overlaps
            const ordered = enrichedPeaks
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

            // Right Profile Caliper Inset
            const insetX = padL + plotW + insetGap;
            const insetY = padT;
            const insetH = plotH + 18;
            const insetCx = insetX + insetW / 2;
            const insetBaseY = insetY + insetH - 36;
            const insetPeakH = insetH - 72;

            const bObs = Math.max(0.04, activePeak?.fwhmObs || 0.25);
            const bSamp = Math.max(0.005, activePeak?.derived.betaSampleDeg || bObs * 0.7);
            const bInst = activePeak?.derived.instFwhmAtPeak || 0;
            const halfDom = Math.max(bObs * 1.65, bInst * 1.9, 0.2);
            const plotHalfPx = insetW * 0.42;

            const buildBell = (w: number, amp: number) => {
              if (w <= 0.001) return '';
              const pts: string[] = [];
              const hw = w / 2;
              for (let k = -36; k <= 36; k++) {
                const u = (k / 36) * halfDom;
                const px = insetCx + (u / halfDom) * plotHalfPx;
                const r = u / hw;
                const v =
                  ((1 - eta) * Math.exp(-Math.LN2 * r * r) + eta / (1 + r * r)) *
                  amp;
                const py = insetBaseY - v * insetPeakH;
                pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }
              return pts.join(' ');
            };

            const obsHalfPx = ((bObs / 2) / halfDom) * plotHalfPx;
            const instHalfPx = ((bInst / 2) / halfDom) * plotHalfPx;
            const halfMaxY = insetBaseY - insetPeakH * 0.5;

            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[242px] select-none overflow-visible"
                role="img"
                aria-label="2-theta diffractogram and active reflection profile caliper"
              >
                <defs>
                  <linearGradient id={`whPatArea-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.primaryTrace} stopOpacity={dark ? '0.26' : '0.18'} />
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
                  const displayVal = intensityScale === 'sqrt' ? Math.round(g * g * 100) : Math.round(g * 100);
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
                        {displayVal}
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
                  Diffraction Angle 2θ (°) · Click or hover peak to inspect caliper
                </text>

                {/* Continuous Diffractogram */}
                <polygon points={areaPts.join(' ')} fill={`url(#whPatArea-${uid})`} />
                <polyline
                  fill="none"
                  stroke={palette.primaryTrace}
                  strokeWidth="1.6"
                  points={curvePts.join(' ')}
                />

                {/* Reflection Sticks & Clickable Hit Targets */}
                {enrichedPeaks.map((p, idx) => {
                  const px = xOf(p.twoTheta);
                  const topY = yOf(peakAmps[idx] / maxAmp);
                  const isActive = idx === inspectedIdx;
                  const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;
                  const tier = staggerMap.get(idx) ?? 0;
                  const labelY = Math.max(padT + 10, topY - 8 - tier * 11);
                  const color = p.isExcluded
                    ? palette.excludedTrace
                    : p.derived.isNearInstLimit
                      ? palette.errorTrace
                      : isActive
                        ? palette.highlightTrace
                        : palette.physicalTrace;

                  return (
                    <g
                      key={idx}
                      onClick={() => onSelectPeakIndex(idx)}
                      onMouseEnter={() => setHoveredIdx(idx)}
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
                      {isActive && (
                        <line
                          x1={px}
                          y1={padT}
                          x2={px}
                          y2={baseY}
                          stroke={palette.highlightTrace}
                          strokeWidth="1"
                          strokeDasharray="3 2"
                          opacity="0.65"
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
                        fill={isActive ? palette.highlightTrace : palette.textPrimary}
                        fontSize={isActive ? '9.8' : '8.8'}
                        fontFamily="monospace"
                        fontWeight={isActive ? '700' : '600'}
                      >
                        {hklText}
                      </text>
                    </g>
                  );
                })}

                {/* RIGHT PANEL: Active Peak Profile Deconvolution Caliper */}
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
                    {activeHklLabel} PROFILE CALIPER
                  </text>
                  <text
                    x={insetCx}
                    y={insetY + 29}
                    textAnchor="middle"
                    fill={palette.textMuted}
                    fontSize="8.8"
                    fontFamily="monospace"
                  >
                    2θ = {activePeak.twoTheta.toFixed(3)}° · d = {activePeak.derived.dSpacing.toFixed(3)} Å
                  </text>

                  {/* Baseline & Centerline */}
                  <line
                    x1={insetX + 10}
                    y1={insetBaseY}
                    x2={insetX + insetW - 10}
                    y2={insetBaseY}
                    stroke={palette.axis}
                    strokeWidth="1"
                  />
                  <line
                    x1={insetCx}
                    y1={insetY + 36}
                    x2={insetCx}
                    y2={insetBaseY}
                    stroke={palette.grid}
                    strokeWidth="0.9"
                    strokeDasharray="2 2"
                  />

                  {/* Instrumental Curve */}
                  {bInst > 0 && (
                    <polyline
                      fill="none"
                      stroke={palette.instTrace}
                      strokeWidth="1.4"
                      strokeDasharray="2 2"
                      points={buildBell(bInst, 0.72)}
                    />
                  )}
                  {/* Deconvolved Sample Curve */}
                  <polyline
                    fill="none"
                    stroke={palette.physicalTrace}
                    strokeWidth="1.6"
                    strokeDasharray="4 2"
                    points={buildBell(bSamp, 0.88)}
                  />
                  {/* Observed Peak Curve */}
                  <polyline
                    fill="none"
                    stroke={palette.primaryTrace}
                    strokeWidth="2"
                    points={buildBell(bObs, 1.0)}
                  />

                  {/* FWHM Observed Caliper Bracket */}
                  <line
                    x1={insetCx - obsHalfPx}
                    y1={halfMaxY}
                    x2={insetCx + obsHalfPx}
                    y2={halfMaxY}
                    stroke={palette.primaryTrace}
                    strokeWidth="1.4"
                  />
                  <line
                    x1={insetCx - obsHalfPx}
                    y1={halfMaxY - 4}
                    x2={insetCx - obsHalfPx}
                    y2={halfMaxY + 4}
                    stroke={palette.primaryTrace}
                    strokeWidth="1.4"
                  />
                  <line
                    x1={insetCx + obsHalfPx}
                    y1={halfMaxY - 4}
                    x2={insetCx + obsHalfPx}
                    y2={halfMaxY + 4}
                    stroke={palette.primaryTrace}
                    strokeWidth="1.4"
                  />

                  {/* Instrumental FWHM Bracket */}
                  {bInst > 0 && (
                    <>
                      <line
                        x1={insetCx - instHalfPx}
                        y1={halfMaxY + 11}
                        x2={insetCx + instHalfPx}
                        y2={halfMaxY + 11}
                        stroke={palette.instTrace}
                        strokeWidth="1.2"
                      />
                      <line
                        x1={insetCx - instHalfPx}
                        y1={halfMaxY + 8}
                        x2={insetCx - instHalfPx}
                        y2={halfMaxY + 14}
                        stroke={palette.instTrace}
                        strokeWidth="1.2"
                      />
                      <line
                        x1={insetCx + instHalfPx}
                        y1={halfMaxY + 8}
                        x2={insetCx + instHalfPx}
                        y2={halfMaxY + 14}
                        stroke={palette.instTrace}
                        strokeWidth="1.2"
                      />
                    </>
                  )}

                  {/* Numeric Footer Inside Inset */}
                  <text
                    x={insetX + 12}
                    y={insetY + insetH - 18}
                    fill={palette.primaryTrace}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    β_obs {bObs.toFixed(3)}°
                  </text>
                  <text
                    x={insetX + insetW - 12}
                    y={insetY + insetH - 18}
                    textAnchor="end"
                    fill={palette.physicalTrace}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    β_s {bSamp.toFixed(3)}°
                  </text>
                  <text
                    x={insetCx}
                    y={insetY + insetH - 5}
                    textAnchor="middle"
                    fill={palette.textMuted}
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    β_inst {bInst > 0 ? `${bInst.toFixed(3)}°` : 'Off'} · Sample{' '}
                    {activePeak.derived.sampleSharePct.toFixed(0)}%
                  </text>
                </g>
              </svg>
            );
          })()}

        {/* ==================== MODE 3: STACKED β DECONVOLUTION & CAGLIOTI FLOOR ==================== */}
        {graphicMode === 'broadening' &&
          (() => {
            const W = 640;
            const H = 236;
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
                ...enrichedPeaks.map((p) =>
                  Math.max(p.fwhmObs, p.derived.instFwhmAtPeak)
                )
              ) * 1.18;

            const validSizes = enrichedPeaks
              .filter((p) => !p.isExcluded && p.derived.apparentSizeNm > 0)
              .map((p) => p.derived.apparentSizeNm);
            const maxD =
              validSizes.length > 0 ? Math.max(20, ...validSizes) * 1.2 : 100;

            const slotW = plotW / Math.max(1, enrichedPeaks.length);
            const barW = Math.min(36, Math.max(12, slotW * 0.48));

            // Smooth sampled Caglioti / Constant instrumental resolution curve across slots
            const instCurvePts: string[] = [];
            if (isDecouplingEnabled && enrichedPeaks.length > 0) {
              const firstTT = enrichedPeaks[0].twoTheta;
              const lastTT = enrichedPeaks[enrichedPeaks.length - 1].twoTheta;
              const steps = 48;
              for (let i = 0; i <= steps; i++) {
                const frac = i / steps;
                const px = padL + 0.5 * slotW + frac * Math.max(0, (enrichedPeaks.length - 1) * slotW);
                const tt = firstTT + frac * (lastTT - firstTT);
                const instB = evalInstAt(tt);
                const py = baseY - Math.min(1, instB / maxBeta) * plotH;
                instCurvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
              }
            }

            // Apparent D_app trajectory
            const dLocusPts: string[] = [];
            enrichedPeaks.forEach((p, idx) => {
              if (!p.isExcluded && p.derived.apparentSizeNm > 0) {
                const cx = padL + (idx + 0.5) * slotW;
                const dy = baseY - Math.min(1, p.derived.apparentSizeNm / maxD) * plotH;
                dLocusPts.push(`${cx.toFixed(1)},${dy.toFixed(1)}`);
              }
            });

            return (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-[220px] sm:h-[242px] select-none overflow-visible"
                role="img"
                aria-label="Per-reflection broadening deconvolution and Caglioti floor chart"
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

                {/* Dual Y-Axis Gridlines & Ticks */}
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
                        fill={palette.physicalTrace}
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {Math.round(maxD * g)}
                      </text>
                    </g>
                  );
                })}

                {/* Axis Titles */}
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
                  FWHM β (° 2θ)
                </text>
                <text
                  x={W - 12}
                  y={padT + plotH / 2}
                  transform={`rotate(90 ${W - 12} ${padT + plotH / 2})`}
                  textAnchor="middle"
                  fill={palette.physicalTrace}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Apparent D (nm)
                </text>

                {/* Stacked Bars per Reflection */}
                {enrichedPeaks.map((p, idx) => {
                  const cx = padL + (idx + 0.5) * slotW;
                  const isActive = idx === inspectedIdx;
                  const totalH = Math.min(plotH, (p.fwhmObs / maxBeta) * plotH);
                  const instH = Math.min(
                    totalH,
                    (p.derived.instFwhmAtPeak / maxBeta) * plotH
                  );
                  const physH = Math.max(0, totalH - instH);
                  const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;

                  return (
                    <g
                      key={idx}
                      onClick={() => onSelectPeakIndex(idx)}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      className="cursor-pointer"
                      opacity={p.isExcluded ? 0.35 : 1}
                    >
                      {/* Full-slot hit box */}
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

                      {/* Instrumental Broadening Base */}
                      {instH > 0.5 && (
                        <rect
                          x={cx - barW / 2}
                          y={baseY - instH}
                          width={barW}
                          height={instH}
                          rx="1.5"
                          fill={palette.instTrace}
                          fillOpacity={isActive ? '0.68' : '0.46'}
                          stroke={palette.instTrace}
                          strokeWidth={isActive ? '1.2' : '0.7'}
                        />
                      )}

                      {/* Physical Sample Broadening Segment */}
                      {physH > 0.5 && (
                        <rect
                          x={cx - barW / 2}
                          y={baseY - instH - physH}
                          width={barW}
                          height={physH}
                          rx="1.5"
                          fill={palette.primaryTrace}
                          fillOpacity={isActive ? '0.78' : '0.45'}
                          stroke={isActive ? palette.textPrimary : palette.primaryTrace}
                          strokeWidth={isActive ? '1.3' : '0.8'}
                        />
                      )}

                      {/* Bottom Labels */}
                      <text
                        x={cx}
                        y={baseY + 15}
                        textAnchor="middle"
                        fill={isActive ? palette.highlightTrace : palette.textPrimary}
                        fontSize="9.2"
                        fontFamily="monospace"
                        fontWeight={isActive ? '700' : '600'}
                      >
                        {hklText}
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

                {/* Smooth Instrumental Resolution Curve */}
                {instCurvePts.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={palette.instTrace}
                    strokeWidth="1.6"
                    strokeDasharray="4 2.5"
                    points={instCurvePts.join(' ')}
                  />
                )}

                {/* Apparent Size D_app Trajectory */}
                {dLocusPts.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={palette.physicalTrace}
                    strokeWidth="2"
                    points={dLocusPts.join(' ')}
                  />
                )}
                {enrichedPeaks.map((p, idx) => {
                  if (p.isExcluded || p.derived.apparentSizeNm <= 0) return null;
                  const cx = padL + (idx + 0.5) * slotW;
                  const dy =
                    baseY - Math.min(1, p.derived.apparentSizeNm / maxD) * plotH;
                  const isActive = idx === inspectedIdx;
                  return (
                    <g
                      key={`d-${idx}`}
                      onClick={() => onSelectPeakIndex(idx)}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={cx}
                        cy={dy}
                        r={isActive ? '4.5' : '3.2'}
                        fill={isActive ? palette.highlightTrace : palette.physicalTrace}
                        stroke={palette.insetBg}
                        strokeWidth="1.2"
                      />
                      <text
                        x={cx}
                        y={Math.max(padT + 11, dy - 8)}
                        textAnchor="middle"
                        fill={isActive ? palette.highlightTrace : palette.physicalTrace}
                        fontSize="8.8"
                        fontFamily="monospace"
                        fontWeight="700"
                      >
                        {p.derived.apparentSizeNm.toFixed(0)}nm
                      </text>
                    </g>
                  );
                })}
              </svg>
            );
          })()}
      </div>

      {/* Unified 5-Column Reflection Metrology Readout Strip */}
      {activePeak && (
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
                {hoveredIdx !== null ? 'Hovered' : 'Selected'}
              </div>
              <div
                className={`text-[11px] font-bold truncate mt-0.5 ${
                  dark ? 'text-cyan-300' : 'text-sky-800'
                }`}
              >
                {activeHklLabel} · {activePeak.twoTheta.toFixed(2)}°
              </div>
            </div>
            <button
              type="button"
              onClick={() => onToggleExcludePeak(inspectedIdx)}
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
                  ? 'Include peak in regression'
                  : 'Exclude peak from regression'
              }
            >
              {activePeak.isExcluded ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </button>
          </div>

          <div className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              d / 4·sinθ
            </div>
            <div className="text-[11px] font-semibold mt-0.5">
              {activePeak.derived.dSpacing.toFixed(3)} Å{' '}
              <span className="text-[9.5px] text-slate-500">
                ({activePeak.derived.fourSinTheta.toFixed(3)})
              </span>
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              β<sub>obs</sub> / β<sub>inst</sub>
            </div>
            <div className="text-[11px] font-semibold mt-0.5">
              <span>{activePeak.fwhmObs.toFixed(3)}°</span>
              <span className="text-slate-500"> / </span>
              <span className={dark ? 'text-amber-300' : 'text-amber-700'}>
                {activePeak.derived.instFwhmAtPeak > 0
                  ? `${activePeak.derived.instFwhmAtPeak.toFixed(3)}°`
                  : 'Off'}
              </span>
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              Sample β<sub>s</sub>
            </div>
            <div
              className={`text-[11px] font-bold mt-0.5 ${
                activePeak.derived.isNearInstLimit
                  ? dark
                    ? 'text-rose-300'
                    : 'text-rose-700'
                  : dark
                    ? 'text-emerald-300'
                    : 'text-emerald-700'
              }`}
            >
              {activePeak.derived.betaSampleDeg.toFixed(3)}°{' '}
              <span className="text-[9.5px] font-normal text-slate-500">
                ({activePeak.derived.sampleSharePct.toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="px-3 py-2 col-span-2 sm:col-span-1">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              βcosθ / Δ Fit
            </div>
            <div className="text-[11px] font-bold mt-0.5 flex items-center gap-1.5">
              <span>{activePeak.derived.betaCosThetaMrad.toFixed(2)} mrad</span>
              {activePeak.derived.residualMrad !== null && (
                <span
                  className={`text-[9.5px] ${
                    activePeak.derived.isOutlier
                      ? dark
                        ? 'text-rose-300'
                        : 'text-rose-700'
                      : 'text-slate-500'
                  }`}
                >
                  ({activePeak.derived.residualMrad >= 0 ? '+' : ''}
                  {activePeak.derived.residualMrad.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
