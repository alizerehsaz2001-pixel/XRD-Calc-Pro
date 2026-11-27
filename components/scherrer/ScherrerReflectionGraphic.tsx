import React, { useState, useId, useMemo } from 'react';
import {
  BarChart2,
  Layers,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { ScherrerInput } from '../../types';
import { useSettings } from '../SettingsContext';
import {
  COLOR_VISION_MODES,
  getThemeSpec,
  isDarkTheme,
} from '../../utils/themeSystem';

export interface ReflectionMetricRow {
  dSpacing: number;
  qVector: number;
  curInstFwhm: number;
  sizeNm: number | null;
  betaCorrected: number | null;
  effectiveK: number;
  kAlpha2BroadeningDeg: number;
  planesN: number;
  error?: string;
  aEst: number | null;
}

export interface ReflectionMetricsSummary {
  rows: ReflectionMetricRow[];
  total: number;
  activeCount: number;
  excludedCount: number;
  resolvedCount: number;
  unresolvedCount: number;
  min2T: number;
  max2T: number;
  maxIntensity: number;
  maxObsFwhm: number;
  meanA: number | null;
  stdA: number;
  meanSizeNm: number | null;
}

interface ScherrerReflectionGraphicProps {
  peaks: ScherrerInput[];
  reflectionMetrics: ReflectionMetricsSummary;
  selectedPeakIdx: number;
  onSelectPeakIdx: (idx: number) => void;
  wavelength: number;
  constantK: number;
  instFwhm: number;
  useCaglioti: boolean;
  caglioti: { u: number; v: number; w: number };
  broadeningModel: string;
  pseudoVoigtEta: number;
  breadthType: 'fwhm' | 'integral_breadth';
  kAlpha2Correction: boolean;
  zeroShiftDeg: number;
}

type GraphicMode = 'spectrum' | 'deconv' | 'domain';
type IntensityScaleMode = 'linear' | 'sqrt';

export const ScherrerReflectionGraphic: React.FC<ScherrerReflectionGraphicProps> = ({
  peaks,
  reflectionMetrics,
  selectedPeakIdx,
  onSelectPeakIdx,
  wavelength,
  constantK,
  instFwhm,
  useCaglioti,
  caglioti,
  broadeningModel,
  pseudoVoigtEta,
  breadthType,
  kAlpha2Correction,
  zeroShiftDeg,
}) => {
  const uid = useId().replace(/:/g, '');
  const { theme = 'dark', colorVisionMode = 'normal' } = useSettings();
  const dark = isDarkTheme(theme);
  const themeSpec = getThemeSpec(theme);

  const [graphicMode, setGraphicMode] = useState<GraphicMode>('spectrum');
  const [intensityScale, setIntensityScale] = useState<IntensityScaleMode>('linear');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Calibrated palette that respects Light/Dark polarity AND Okabe-Ito CVD modes
  const palette = useMemo(() => {
    const cvd = COLOR_VISION_MODES.find((m) => m.id === colorVisionMode);
    const useCvd = colorVisionMode !== 'normal' && cvd;

    const primaryTrace = useCvd
      ? cvd.swatches[0]
      : dark
      ? '#38bdf8'
      : '#0284c7';
    const physicalTrace = useCvd
      ? cvd.swatches[1]
      : dark
      ? '#10b981'
      : '#059669';
    const instTrace = useCvd
      ? cvd.swatches[2]
      : dark
      ? '#f59e0b'
      : '#d97706';
    const errorTrace = dark ? '#fb7185' : '#e11d48';
    const highlightTrace = dark ? '#fbbf24' : '#b45309';

    return {
      canvasBg: dark ? '#060912' : '#ffffff',
      panelBg: dark ? '#0b101b' : '#f8fafc',
      insetBg: dark ? '#050811' : '#ffffff',
      border: dark ? '#1e293b' : '#cbd5e1',
      grid: dark ? '#1e293b' : '#e2e8f0',
      axis: dark ? '#475569' : '#64748b',
      textPrimary: dark ? '#f1f5f9' : '#0f172a',
      textSecondary: dark ? '#cbd5e1' : '#334155',
      textMuted: dark ? '#94a3b8' : '#475569',
      primaryTrace,
      physicalTrace,
      instTrace,
      errorTrace,
      highlightTrace,
      accentStroke: themeSpec.tokens.accent,
    };
  }, [dark, colorVisionMode, themeSpec]);

  if (peaks.length === 0) return null;

  const safeSelectedIdx = Math.min(selectedPeakIdx, peaks.length - 1);
  const inspectedIdx = hoveredIdx !== null && hoveredIdx < peaks.length ? hoveredIdx : safeSelectedIdx;
  const activePeak = peaks[inspectedIdx] || peaks[0];
  const activeMetric = reflectionMetrics.rows[inspectedIdx] || reflectionMetrics.rows[0];

  const stepPeak = (dir: -1 | 1) => {
    const next = (safeSelectedIdx + dir + peaks.length) % peaks.length;
    onSelectPeakIdx(next);
  };

  const scaleIntensity = (rawPct: number) => {
    const clamped = Math.max(0, Math.min(100, rawPct));
    if (intensityScale === 'sqrt') {
      return Math.sqrt(clamped / 100) * 100;
    }
    return clamped;
  };

  const activeHklLabel = activePeak?.hkl
    ? `(${activePeak.hkl.join('')})`
    : `Peak #${inspectedIdx + 1}`;

  const physSharePct =
    activePeak && activePeak.fwhmObs > 0 && activeMetric?.betaCorrected
      ? Math.min(100, Math.max(0, (activeMetric.betaCorrected / activePeak.fwhmObs) * 100))
      : 0;

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-colors ${
        dark
          ? 'bg-[#070A12] border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Instrument Header Bar */}
      <div
        className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2.5 ${
          dark
            ? 'bg-[#0B101B] border-slate-800'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Compass
              className={`w-3.5 h-3.5 shrink-0 ${
                dark ? 'text-cyan-400' : 'text-sky-700'
              }`}
            />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              Scherrer Reflection Graphic
            </span>
          </div>
          <span className={dark ? 'text-slate-700' : 'text-slate-300'}>·</span>
          <span className="text-[10.5px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
            λ = {wavelength.toFixed(4)} Å · K = {constantK.toFixed(3)} · {broadeningModel}
          </span>
        </div>

        {/* Mode Switcher + Peak Stepper */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Peak Stepper */}
          <div
            className={`inline-flex items-center rounded-md border text-[10px] font-mono tabular-nums overflow-hidden ${
              dark
                ? 'bg-[#060912] border-slate-700 text-slate-200'
                : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <button
              type="button"
              onClick={() => stepPeak(-1)}
              disabled={peaks.length < 2}
              className={`p-1 transition-colors cursor-pointer disabled:opacity-40 ${
                dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
              title="Previous reflection"
              aria-label="Previous reflection"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span
              className={`px-2 py-0.5 border-x font-semibold ${
                dark ? 'border-slate-800 text-amber-300' : 'border-slate-200 text-amber-800'
              }`}
            >
              {peaks[safeSelectedIdx]?.hkl
                ? `(${peaks[safeSelectedIdx].hkl!.join('')})`
                : `#${safeSelectedIdx + 1}`}{' '}
              <span className="text-slate-500 font-normal">
                {safeSelectedIdx + 1}/{peaks.length}
              </span>
            </span>
            <button
              type="button"
              onClick={() => stepPeak(1)}
              disabled={peaks.length < 2}
              className={`p-1 transition-colors cursor-pointer disabled:opacity-40 ${
                dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
              title="Next reflection"
              aria-label="Next reflection"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3-Mode Segmented Control */}
          <div
            className={`inline-flex p-0.5 rounded-md border text-[10px] font-mono font-semibold ${
              dark
                ? 'bg-[#060912] border-slate-700'
                : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => setGraphicMode('spectrum')}
              className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                graphicMode === 'spectrum'
                  ? dark
                    ? 'bg-cyan-500/20 text-cyan-200'
                    : 'bg-white text-sky-800 shadow-xs'
                  : dark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Pattern &amp; Caliper</span>
            </button>
            <button
              type="button"
              onClick={() => setGraphicMode('deconv')}
              className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                graphicMode === 'deconv'
                  ? dark
                    ? 'bg-amber-500/20 text-amber-200'
                    : 'bg-white text-amber-800 shadow-xs'
                  : dark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>β Deconv &amp; Caglioti</span>
            </button>
            <button
              type="button"
              onClick={() => setGraphicMode('domain')}
              className={`px-2.5 py-1 rounded-sm transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                graphicMode === 'domain'
                  ? dark
                    ? 'bg-emerald-500/20 text-emerald-200'
                    : 'bg-white text-emerald-800 shadow-xs'
                  : dark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minimize2 className="w-3 h-3" />
              <span>Domain N·d &amp; D(β)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Header Controls / Legend Ribbon */}
      <div
        className={`px-3.5 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono ${
          dark
            ? 'bg-[#060912] border-slate-800/80 text-slate-400'
            : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        {graphicMode === 'spectrum' && (
          <>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: palette.primaryTrace }} />
                <span>Observed (β<sub>obs</sub>)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ borderColor: palette.physicalTrace }} />
                <span>Physical (β<sub>phys</sub>)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block border-t border-dotted" style={{ borderColor: palette.instTrace }} />
                <span>Instrumental (β<sub>inst</sub>)</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] uppercase tracking-wider text-slate-500">Y-Scale:</span>
              <div
                className={`inline-flex rounded-sm border p-0.5 ${
                  dark ? 'border-slate-800 bg-[#0B101B]' : 'border-slate-300 bg-slate-100'
                }`}
              >
                {(['linear', 'sqrt'] as IntensityScaleMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setIntensityScale(mode)}
                    className={`px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-semibold cursor-pointer transition-colors ${
                      intensityScale === mode
                        ? dark
                          ? 'bg-cyan-500/20 text-cyan-200'
                          : 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {mode === 'linear' ? 'Linear' : '√I'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {graphicMode === 'deconv' && (
          <>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] inline-block" style={{ backgroundColor: palette.primaryTrace }} />
                <span>Physical β<sub>phys</sub></span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[2px] inline-block" style={{ backgroundColor: palette.instTrace }} />
                <span>Instrumental β<sub>inst</sub></span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 inline-block" style={{ backgroundColor: palette.physicalTrace }} />
                <span>D<sub>hkl</sub> Locus (nm)</span>
              </span>
            </div>
            <span className="tabular-nums">
              {useCaglioti
                ? `Caglioti U=${caglioti.u.toFixed(3)} · V=${caglioti.v.toFixed(3)} · W=${caglioti.w.toFixed(3)}`
                : `Constant β_inst = ${instFwhm.toFixed(4)}°`}
            </span>
          </>
        )}

        {graphicMode === 'domain' && (
          <>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: palette.instTrace }} />
                <span>Incident k₀</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: palette.physicalTrace }} />
                <span>Diffracted k</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: palette.primaryTrace }} />
                <span>Scherrer Hyperbola D(β<sub>phys</sub>)</span>
              </span>
            </div>
            <span className="tabular-nums">
              Click any peak dot to inspect coherent column thickness
            </span>
          </>
        )}
      </div>

      {/* Main High-Precision SVG Viewport */}
      <div className="p-3" onMouseLeave={() => setHoveredIdx(null)}>
        {/* MODE 1: Calibrated Multi-Peak Pseudo-Voigt Pattern + Active Peak FWHM Caliper Inset */}
        {graphicMode === 'spectrum' && (() => {
          const svgW = 720;
          const svgH = 250;
          const padL = 44;
          const padR = 242; // Right 228px dedicated to Active Peak Deconvolution Caliper
          const padT = 24;
          const padB = 36;
          const plotW = svgW - padL - padR;
          const plotH = svgH - padT - padB;
          const baseY = padT + plotH;

          const minAngle = Math.max(5, Math.floor((reflectionMetrics.min2T || 20) - 6));
          const maxAngle = Math.min(165, Math.ceil((reflectionMetrics.max2T || 80) + 6));
          const spanAngle = Math.max(10, maxAngle - minAngle);

          const xOf = (tt: number) => padL + ((tt - minAngle) / spanAngle) * plotW;
          const yOf = (scaledI: number) => baseY - (Math.min(100, Math.max(0, scaledI)) / 100) * plotH;

          // Sample continuous Pseudo-Voigt diffractogram
          const numPts = 220;
          const curvePts: string[] = [];
          const areaPts: string[] = [`${padL},${baseY}`];
          for (let i = 0; i <= numPts; i++) {
            const tt = minAngle + (i / numPts) * spanAngle;
            let yRaw = 0;
            peaks.forEach((p) => {
              if (p.excluded) return;
              const relI = ((p.intensity ?? 100) / reflectionMetrics.maxIntensity) * 100;
              const visHwhm = Math.max(0.32, p.fwhmObs * 1.25);
              const dx = (tt - p.twoTheta) / visHwhm;
              if (Math.abs(dx) < 6) {
                const g = Math.exp(-Math.LN2 * dx * dx);
                const l = 1 / (1 + dx * dx);
                yRaw += relI * ((1 - pseudoVoigtEta) * g + pseudoVoigtEta * l);
              }
            });
            const px = padL + (i / numPts) * plotW;
            const py = yOf(scaleIntensity(Math.min(100, yRaw)));
            curvePts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
            areaPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
          }
          areaPts.push(`${padL + plotW},${baseY}`);

          // Collision-aware label stagger
          const sortedIndices = peaks
            .map((p, idx) => ({ idx, x: xOf(p.twoTheta) }))
            .sort((a, b) => a.x - b.x);
          const staggerTier = new Map<number, number>();
          let lastLabelX = -999;
          let tier = 0;
          sortedIndices.forEach(({ idx, x }) => {
            if (x - lastLabelX < 34) {
              tier = (tier + 1) % 2;
            } else {
              tier = 0;
            }
            staggerTier.set(idx, tier);
            lastLabelX = x;
          });

          // Right Inset Profile Deconvolution Caliper
          const insetX = padL + plotW + 16;
          const insetY = 12;
          const insetW = 216;
          const insetH = svgH - 24;
          const insetCx = insetX + insetW / 2;
          const insetBaseY = insetY + insetH - 54;
          const insetPeakH = insetH - 96;

          const bObs = Math.max(0.04, activePeak?.fwhmObs || 0.25);
          const bPhys = Math.max(0.01, activeMetric?.betaCorrected || bObs * 0.55);
          const bInst = Math.max(0.01, activeMetric?.curInstFwhm || instFwhm || 0.1);
          const halfSpanDeg = bObs * 1.6;

          const obsPts: string[] = [];
          const physPts: string[] = [];
          const instPts: string[] = [];

          const evalPV = (xDeg: number, w: number, amp: number) => {
            const d = xDeg / (w / 2);
            return amp * ((1 - pseudoVoigtEta) * Math.exp(-Math.LN2 * d * d) + pseudoVoigtEta / (1 + d * d));
          };

          for (let i = 0; i <= 72; i++) {
            const frac = i / 72;
            const px = insetX + 12 + frac * (insetW - 24);
            const xDeg = (frac - 0.5) * 2 * halfSpanDeg;
            obsPts.push(`${px.toFixed(1)},${(insetBaseY - evalPV(xDeg, bObs, 1.0) * insetPeakH).toFixed(1)}`);
            physPts.push(`${px.toFixed(1)},${(insetBaseY - evalPV(xDeg, bPhys, 0.88) * insetPeakH).toFixed(1)}`);
            instPts.push(`${px.toFixed(1)},${(insetBaseY - evalPV(xDeg, bInst, 0.65) * insetPeakH).toFixed(1)}`);
          }

          const degToInsetPx = (deg: number) => (deg / (2 * halfSpanDeg)) * (insetW - 24);
          const obsHalfPx = Math.min((insetW - 28) / 2, degToInsetPx(bObs / 2));
          const physHalfPx = Math.min((insetW - 28) / 2, degToInsetPx(bPhys / 2));
          const obsHalfY = insetBaseY - insetPeakH * 0.5;
          const physHalfY = insetBaseY - insetPeakH * 0.44;

          return (
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-[250px] sm:h-[268px] rounded-md border select-none"
              style={{
                backgroundColor: palette.canvasBg,
                borderColor: palette.border,
              }}
            >
              <defs>
                <linearGradient id={`schSpecFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.primaryTrace} stopOpacity={dark ? '0.26' : '0.16'} />
                  <stop offset="100%" stopColor={palette.primaryTrace} stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Plot Frame */}
              <rect
                x={padL}
                y={padT}
                width={plotW}
                height={plotH}
                fill="none"
                stroke={palette.border}
                strokeWidth="1"
              />

              {/* Horizontal Grid & Y-Axis Ticks */}
              {[0.25, 0.5, 0.75, 1].map((g, i) => {
                const gy = padT + plotH * (1 - g);
                return (
                  <g key={i}>
                    <line
                      x1={padL}
                      y1={gy}
                      x2={padL + plotW}
                      y2={gy}
                      stroke={palette.grid}
                      strokeWidth="0.9"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 6}
                      y={gy + 3.5}
                      textAnchor="end"
                      fill={palette.textMuted}
                      fontSize="9.5"
                      fontFamily="monospace"
                    >
                      {Math.round(g * 100)}
                    </text>
                  </g>
                );
              })}

              {/* Y-Axis Label */}
              <text
                x={13}
                y={padT + plotH / 2}
                transform={`rotate(-90 13 ${padT + plotH / 2})`}
                textAnchor="middle"
                fill={palette.textMuted}
                fontSize="9.5"
                fontFamily="monospace"
              >
                {intensityScale === 'sqrt' ? '√I_rel (%)' : 'I_rel (%)'}
              </text>

              {/* X-Axis Ticks & Title */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i) => {
                const tx = padL + t * plotW;
                const deg = minAngle + t * spanAngle;
                return (
                  <g key={i}>
                    <line x1={tx} y1={baseY} x2={tx} y2={baseY + 5} stroke={palette.axis} strokeWidth="1" />
                    <text
                      x={tx}
                      y={baseY + 16}
                      fill={palette.textMuted}
                      fontSize="9.5"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {deg.toFixed(0)}°
                    </text>
                  </g>
                );
              })}
              <text
                x={padL + plotW / 2}
                y={svgH - 5}
                fill={palette.textSecondary}
                fontSize="10"
                fontFamily="monospace"
                fontWeight="600"
                textAnchor="middle"
              >
                Diffraction Angle 2θ (°)
              </text>

              {/* Continuous Pseudo-Voigt Diffractogram */}
              <polygon points={areaPts.join(' ')} fill={`url(#schSpecFill-${uid})`} />
              <polyline
                fill="none"
                stroke={palette.primaryTrace}
                strokeWidth="1.75"
                points={curvePts.join(' ')}
              />

              {/* Individual Reflection Sticks & Interactive Hit Targets */}
              {peaks.map((p, idx) => {
                const m = reflectionMetrics.rows[idx];
                const isSel = idx === safeSelectedIdx;
                const isHov = idx === hoveredIdx;
                const isActive = isSel || isHov;
                const isExcl = !!p.excluded;
                const xPos = xOf(p.twoTheta);
                const rawI = ((p.intensity ?? 100) / reflectionMetrics.maxIntensity) * 100;
                const topY = yOf(Math.max(8, scaleIntensity(rawI)));
                const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;
                const labelYOffset = (staggerTier.get(idx) || 0) * 11;
                const strokeColor = m?.error
                  ? palette.errorTrace
                  : isSel
                  ? palette.highlightTrace
                  : isHov
                  ? palette.physicalTrace
                  : palette.primaryTrace;

                return (
                  <g
                    key={idx}
                    onClick={() => onSelectPeakIdx(idx)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    className="cursor-pointer"
                    opacity={isExcl ? 0.3 : 1}
                  >
                    {/* Generous invisible hit area */}
                    <rect x={xPos - 10} y={padT} width={20} height={plotH} fill="transparent" />
                    {isActive && (
                      <line
                        x1={xPos}
                        y1={padT}
                        x2={xPos}
                        y2={baseY}
                        stroke={strokeColor}
                        strokeWidth="1"
                        strokeDasharray="3 2"
                        opacity="0.7"
                      />
                    )}
                    <line
                      x1={xPos}
                      y1={baseY}
                      x2={xPos}
                      y2={topY}
                      stroke={strokeColor}
                      strokeWidth={isActive ? '2.4' : '1.4'}
                    />
                    <circle
                      cx={xPos}
                      cy={topY}
                      r={isActive ? '4' : '2.8'}
                      fill={strokeColor}
                      stroke={palette.canvasBg}
                      strokeWidth="1.2"
                    />
                    <text
                      x={xPos}
                      y={Math.max(padT + 10, topY - 7 - labelYOffset)}
                      fill={isActive ? strokeColor : palette.textSecondary}
                      fontSize={isActive ? '10' : '9'}
                      fontFamily="monospace"
                      fontWeight={isActive ? '700' : '600'}
                      textAnchor="middle"
                    >
                      {hklText}
                    </text>
                  </g>
                );
              })}

              {/* Right Inset: Active Reflection Deconvolution & Half-Max Caliper */}
              <g>
                <rect
                  x={insetX}
                  y={insetY}
                  width={insetW}
                  height={insetH}
                  rx="6"
                  fill={palette.insetBg}
                  stroke={palette.border}
                  strokeWidth="1"
                />
                <text
                  x={insetCx}
                  y={insetY + 17}
                  textAnchor="middle"
                  fill={palette.primaryTrace}
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
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  2θ = {activePeak.twoTheta.toFixed(3)}° · η = {pseudoVoigtEta.toFixed(2)}
                </text>

                {/* Baseline & Center Axis */}
                <line
                  x1={insetX + 12}
                  y1={insetBaseY}
                  x2={insetX + insetW - 12}
                  y2={insetBaseY}
                  stroke={palette.axis}
                  strokeWidth="1"
                />
                <line
                  x1={insetCx}
                  y1={insetY + 38}
                  x2={insetCx}
                  y2={insetBaseY}
                  stroke={palette.grid}
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                />

                {/* Curves */}
                <polyline
                  fill="none"
                  stroke={palette.instTrace}
                  strokeWidth="1.4"
                  strokeDasharray="2 2"
                  points={instPts.join(' ')}
                />
                <polyline
                  fill="none"
                  stroke={palette.physicalTrace}
                  strokeWidth="1.6"
                  strokeDasharray="4 2"
                  points={physPts.join(' ')}
                />
                <polyline
                  fill="none"
                  stroke={palette.primaryTrace}
                  strokeWidth="2.1"
                  points={obsPts.join(' ')}
                />

                {/* Observed FWHM Half-Max Caliper */}
                <line
                  x1={insetCx - obsHalfPx}
                  y1={obsHalfY}
                  x2={insetCx + obsHalfPx}
                  y2={obsHalfY}
                  stroke={palette.primaryTrace}
                  strokeWidth="1.5"
                />
                <line
                  x1={insetCx - obsHalfPx}
                  y1={obsHalfY - 4}
                  x2={insetCx - obsHalfPx}
                  y2={obsHalfY + 4}
                  stroke={palette.primaryTrace}
                  strokeWidth="1.4"
                />
                <line
                  x1={insetCx + obsHalfPx}
                  y1={obsHalfY - 4}
                  x2={insetCx + obsHalfPx}
                  y2={obsHalfY + 4}
                  stroke={palette.primaryTrace}
                  strokeWidth="1.4"
                />

                {/* Physical Broadening Caliper Bracket */}
                <line
                  x1={insetCx - physHalfPx}
                  y1={physHalfY + 12}
                  x2={insetCx + physHalfPx}
                  y2={physHalfY + 12}
                  stroke={palette.physicalTrace}
                  strokeWidth="1.4"
                />
                <circle cx={insetCx - physHalfPx} cy={physHalfY + 12} r="2" fill={palette.physicalTrace} />
                <circle cx={insetCx + physHalfPx} cy={physHalfY + 12} r="2" fill={palette.physicalTrace} />

                {/* Inset Footer Numeric Readout */}
                <line
                  x1={insetX + 10}
                  y1={insetBaseY + 11}
                  x2={insetX + insetW - 10}
                  y2={insetBaseY + 11}
                  stroke={palette.grid}
                  strokeWidth="0.9"
                />
                <text
                  x={insetX + 14}
                  y={insetBaseY + 25}
                  fill={palette.primaryTrace}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  β_obs: {bObs.toFixed(3)}°
                </text>
                <text
                  x={insetX + insetW - 14}
                  y={insetBaseY + 25}
                  textAnchor="end"
                  fill={palette.instTrace}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  β_inst: {bInst.toFixed(3)}°
                </text>
                <text
                  x={insetX + 14}
                  y={insetBaseY + 40}
                  fill={palette.physicalTrace}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  β_phys: {activeMetric?.betaCorrected ? `${activeMetric.betaCorrected.toFixed(3)}°` : 'Limit'}
                </text>
                <text
                  x={insetX + insetW - 14}
                  y={insetBaseY + 40}
                  textAnchor="end"
                  fill={palette.highlightTrace}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  D = {activeMetric?.sizeNm ? `${activeMetric.sizeNm.toFixed(1)} nm` : 'Lim'}
                </text>
              </g>
            </svg>
          );
        })()}

        {/* MODE 2: Stacked Broadening Deconvolution + Smooth Caglioti Curve & D_hkl Trajectory */}
        {graphicMode === 'deconv' && (() => {
          const svgW = 720;
          const svgH = 250;
          const padL = 52;
          const padR = 56;
          const padT = 26;
          const padB = 42;
          const plotW = svgW - padL - padR;
          const plotH = svgH - padT - padB;
          const baseY = padT + plotH;

          const maxB = Math.max(0.2, reflectionMetrics.maxObsFwhm * 1.18);
          const maxD = Math.max(30, ...reflectionMetrics.rows.map((r) => r.sizeNm || 0)) * 1.18;
          const count = Math.max(1, peaks.length);
          const slotW = plotW / count;
          const barW = Math.min(40, Math.max(16, slotW * 0.48));

          const dLocusPts: Array<{ x: number; y: number; idx: number }> = [];
          peaks.forEach((p, idx) => {
            const m = reflectionMetrics.rows[idx];
            const cx = padL + (idx + 0.5) * slotW;
            if (!p.excluded && m?.sizeNm && m.sizeNm > 0) {
              const dY = baseY - (m.sizeNm / maxD) * plotH;
              dLocusPts.push({ x: cx, y: dY, idx });
            }
          });

          // Smooth Caglioti instrumental resolution curve interpolated across the peak angular range
          const min2T = reflectionMetrics.min2T || 20;
          const max2T = Math.max(min2T + 5, reflectionMetrics.max2T || 80);
          const cagliotiPts: string[] = [];
          const samples = 64;
          for (let i = 0; i <= samples; i++) {
            const frac = i / samples;
            const px = padL + frac * plotW;
            const tt = min2T + frac * (max2T - min2T);
            const thetaRad = ((tt - zeroShiftDeg) / 2) * (Math.PI / 180);
            const bInstVal = useCaglioti
              ? Math.sqrt(
                  Math.max(
                    0.000001,
                    caglioti.u * Math.pow(Math.tan(thetaRad), 2) +
                      caglioti.v * Math.tan(thetaRad) +
                      caglioti.w
                  )
                )
              : instFwhm;
            const py = baseY - Math.min(1, bInstVal / maxB) * plotH;
            cagliotiPts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
          }

          const meanDY =
            reflectionMetrics.meanSizeNm && reflectionMetrics.meanSizeNm > 0
              ? baseY - Math.min(1, reflectionMetrics.meanSizeNm / maxD) * plotH
              : null;

          return (
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-[250px] sm:h-[268px] rounded-md border select-none"
              style={{
                backgroundColor: palette.canvasBg,
                borderColor: palette.border,
              }}
            >
              {/* Plot Frame */}
              <rect
                x={padL}
                y={padT}
                width={plotW}
                height={plotH}
                fill="none"
                stroke={palette.border}
                strokeWidth="1"
              />

              {/* Horizontal Grid + Dual Y-Axes */}
              {[0.25, 0.5, 0.75, 1].map((g, i) => {
                const gy = padT + plotH * (1 - g);
                return (
                  <g key={i}>
                    <line
                      x1={padL}
                      y1={gy}
                      x2={padL + plotW}
                      y2={gy}
                      stroke={palette.grid}
                      strokeWidth="0.9"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 7}
                      y={gy + 3.5}
                      textAnchor="end"
                      fill={palette.primaryTrace}
                      fontSize="9.5"
                      fontFamily="monospace"
                    >
                      {(maxB * g).toFixed(2)}°
                    </text>
                    <text
                      x={padL + plotW + 7}
                      y={gy + 3.5}
                      textAnchor="start"
                      fill={palette.physicalTrace}
                      fontSize="9.5"
                      fontFamily="monospace"
                    >
                      {(maxD * g).toFixed(0)} nm
                    </text>
                  </g>
                );
              })}

              {/* Left & Right Axis Labels */}
              <text
                x={14}
                y={padT + plotH / 2}
                transform={`rotate(-90 14 ${padT + plotH / 2})`}
                textAnchor="middle"
                fill={palette.primaryTrace}
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="600"
              >
                Broadening β (° 2θ)
              </text>
              <text
                x={svgW - 12}
                y={padT + plotH / 2}
                transform={`rotate(90 ${svgW - 12} ${padT + plotH / 2})`}
                textAnchor="middle"
                fill={palette.physicalTrace}
                fontSize="9.5"
                fontFamily="monospace"
                fontWeight="600"
              >
                Crystallite Size D (nm)
              </text>

              {/* Mean D_avg Horizontal Reference Line */}
              {meanDY !== null && (
                <g>
                  <line
                    x1={padL}
                    y1={meanDY}
                    x2={padL + plotW}
                    y2={meanDY}
                    stroke={palette.physicalTrace}
                    strokeWidth="1.1"
                    strokeDasharray="5 3"
                    opacity="0.7"
                  />
                  <text
                    x={padL + plotW - 6}
                    y={Math.max(padT + 11, meanDY - 5)}
                    textAnchor="end"
                    fill={palette.physicalTrace}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    Mean D = {reflectionMetrics.meanSizeNm!.toFixed(1)} nm
                  </text>
                </g>
              )}

              {/* Stacked Bars per Reflection */}
              {peaks.map((p, idx) => {
                const m = reflectionMetrics.rows[idx];
                const isSel = idx === safeSelectedIdx;
                const isHov = idx === hoveredIdx;
                const isActive = isSel || isHov;
                const cx = padL + (idx + 0.5) * slotW;
                const totalH = Math.min(plotH, (p.fwhmObs / maxB) * plotH);
                const instH = Math.min(totalH, ((m?.curInstFwhm || 0) / maxB) * plotH);
                const physH = Math.max(0, totalH - instH);
                const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;

                return (
                  <g
                    key={idx}
                    onClick={() => onSelectPeakIdx(idx)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    className="cursor-pointer"
                    opacity={p.excluded ? 0.32 : 1}
                  >
                    {/* Hover column backdrop */}
                    {isActive && (
                      <rect
                        x={cx - slotW * 0.44}
                        y={padT + 1}
                        width={slotW * 0.88}
                        height={plotH - 2}
                        fill={palette.primaryTrace}
                        fillOpacity={dark ? '0.06' : '0.07'}
                      />
                    )}
                    {/* Full column hit box */}
                    <rect
                      x={cx - slotW / 2}
                      y={padT}
                      width={slotW}
                      height={plotH + padB}
                      fill="transparent"
                    />

                    {/* Instrumental Base Segment */}
                    <rect
                      x={cx - barW / 2}
                      y={baseY - instH}
                      width={barW}
                      height={Math.max(2, instH)}
                      rx="2"
                      fill={palette.instTrace}
                      fillOpacity={isActive ? '0.82' : '0.62'}
                      stroke={palette.instTrace}
                      strokeWidth={isActive ? '1.3' : '0.7'}
                    />
                    {/* Physical Size Broadening Segment */}
                    {physH > 0 && (
                      <rect
                        x={cx - barW / 2}
                        y={baseY - instH - physH}
                        width={barW}
                        height={physH}
                        rx="2"
                        fill={palette.primaryTrace}
                        fillOpacity={isActive ? '0.88' : '0.62'}
                        stroke={isActive ? palette.textPrimary : palette.primaryTrace}
                        strokeWidth={isActive ? '1.4' : '0.8'}
                      />
                    )}

                    {/* Top D_hkl value */}
                    <text
                      x={cx}
                      y={Math.max(padT + 10, baseY - totalH - 6)}
                      fill={m?.sizeNm ? palette.physicalTrace : palette.errorTrace}
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {m?.sizeNm ? `${m.sizeNm.toFixed(1)} nm` : 'Limit'}
                    </text>

                    {/* X-axis (hkl) + 2theta */}
                    <text
                      x={cx}
                      y={baseY + 16}
                      fill={isActive ? palette.highlightTrace : palette.textPrimary}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {hklText}
                    </text>
                    <text
                      x={cx}
                      y={baseY + 29}
                      fill={palette.textMuted}
                      fontSize="8.8"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {p.twoTheta.toFixed(1)}°
                    </text>
                  </g>
                );
              })}

              {/* Smooth Caglioti / Instrumental Curve */}
              <polyline
                fill="none"
                stroke={palette.instTrace}
                strokeWidth="1.8"
                strokeDasharray="4 3"
                points={cagliotiPts.join(' ')}
              />

              {/* D_hkl Trajectory Polyline + Markers */}
              {dLocusPts.length > 1 && (
                <polyline
                  fill="none"
                  stroke={palette.physicalTrace}
                  strokeWidth="2"
                  points={dLocusPts.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ')}
                />
              )}
              {dLocusPts.map((pt) => {
                const isActive = pt.idx === inspectedIdx;
                return (
                  <circle
                    key={`dpt-${pt.idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? '4.5' : '3.2'}
                    fill={isActive ? palette.highlightTrace : palette.physicalTrace}
                    stroke={palette.canvasBg}
                    strokeWidth="1.2"
                    className="pointer-events-none"
                  />
                );
              })}
            </svg>
          );
        })()}

        {/* MODE 3: Coherent Domain Stack D_hkl = N · d_hkl & Mathematical Scherrer Hyperbola D(β_phys) */}
        {graphicMode === 'domain' && (() => {
          const dVal = activeMetric?.dSpacing || 3.135;
          const sizeNm = activeMetric?.sizeNm || 25.0;
          const planesN = activeMetric?.planesN || Math.max(2, Math.round((sizeNm * 10) / dVal));
          const thetaDeg = ((activePeak?.twoTheta || 28.4) - zeroShiftDeg) / 2;
          const thetaRad = (thetaDeg * Math.PI) / 180;
          const cosTheta = Math.max(0.2, Math.cos(thetaRad));
          const effK = activeMetric?.effectiveK ?? constantK;
          const visiblePlanes = Math.min(9, Math.max(4, Math.round(planesN / 12)));

          const maxBetaPlot = Math.max(
            0.5,
            ...reflectionMetrics.rows.map((r) => (r.betaCorrected || 0.2) * 1.35)
          );
          const minBetaPlot = 0.03;
          const maxDPlot = Math.max(
            140,
            Math.ceil(Math.max(...reflectionMetrics.rows.map((r) => r.sizeNm || 0), 80) * 1.25)
          );

          // Right hyperbola plot geometry (inside local translate(368, 12))
          const hypL = 44;
          const hypR = 324;
          const hypT = 36;
          const hypB = 186;
          const hypW = hypR - hypL;
          const hypH = hypB - hypT;

          const mapBetaX = (bDeg: number) =>
            hypL +
            ((Math.min(maxBetaPlot, Math.max(minBetaPlot, bDeg)) - minBetaPlot) /
              (maxBetaPlot - minBetaPlot)) *
              hypW;
          const mapDY = (dNm: number) =>
            hypB - (Math.min(maxDPlot, Math.max(0, dNm)) / maxDPlot) * hypH;

          const curvePts: string[] = [];
          for (let i = 0; i <= 80; i++) {
            const bDeg = minBetaPlot + (i / 80) * (maxBetaPlot - minBetaPlot);
            const bRad = (bDeg * Math.PI) / 180;
            const dNm = (effK * wavelength) / (bRad * cosTheta * 10);
            if (dNm <= maxDPlot * 1.05) {
              curvePts.push(`${mapBetaX(bDeg).toFixed(1)},${mapDY(dNm).toFixed(1)}`);
            }
          }

          const limitBoundaryX = mapBetaX(Math.min(maxBetaPlot, Math.max(minBetaPlot, 0.06)));

          return (
            <svg
              viewBox="0 0 720 250"
              className="w-full h-[250px] sm:h-[268px] rounded-md border select-none"
              style={{
                backgroundColor: palette.canvasBg,
                borderColor: palette.border,
              }}
            >
              {/* LEFT PANEL: Isometric Coherent Crystallite Column D_hkl = N · d_hkl */}
              <g transform="translate(12, 12)">
                <rect
                  x="0"
                  y="0"
                  width="342"
                  height="226"
                  rx="6"
                  fill={palette.insetBg}
                  stroke={palette.border}
                  strokeWidth="1"
                />
                <text
                  x="171"
                  y="19"
                  fill={palette.primaryTrace}
                  fontSize="10.5"
                  fontFamily="monospace"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  COHERENT DOMAIN COLUMN · D_hkl = N · d_hkl
                </text>
                <text
                  x="171"
                  y="32"
                  fill={palette.textMuted}
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {activeHklLabel} · Bragg θ_B = {thetaDeg.toFixed(2)}° · K_eff = {effK.toFixed(3)}
                </text>

                {/* Isometric Lattice Plane Stack */}
                {Array.from({ length: visiblePlanes }).map((_, pIdx) => {
                  const y = 58 + (pIdx * 124) / Math.max(1, visiblePlanes - 1);
                  const isTop = pIdx === 0;
                  return (
                    <g key={pIdx}>
                      <polygon
                        points={`42,${y + 7} 82,${y - 8} 226,${y - 8} 186,${y + 7}`}
                        fill={palette.primaryTrace}
                        fillOpacity={isTop ? (dark ? '0.16' : '0.12') : dark ? '0.07' : '0.05'}
                        stroke={palette.primaryTrace}
                        strokeWidth={isTop ? '1.3' : '0.9'}
                        strokeOpacity={isTop ? '0.95' : '0.65'}
                      />
                      {[70, 108, 146, 184].map((ax, aIdx) => (
                        <circle
                          key={aIdx}
                          cx={ax}
                          cy={y}
                          r="2.6"
                          fill={dark ? '#e0f2fe' : '#0369a1'}
                          stroke={palette.primaryTrace}
                          strokeWidth="0.8"
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Interplanar d_hkl spacing callout between plane 0 and plane 1 */}
                {(() => {
                  const y0 = 58;
                  const y1 = 58 + 124 / Math.max(1, visiblePlanes - 1);
                  const yMid = (y0 + y1) / 2;
                  return (
                    <g>
                      <line x1="28" y1={y0} x2="28" y2={y1} stroke={palette.physicalTrace} strokeWidth="1.4" />
                      <line x1="23" y1={y0} x2="33" y2={y0} stroke={palette.physicalTrace} strokeWidth="1.2" />
                      <line x1="23" y1={y1} x2="33" y2={y1} stroke={palette.physicalTrace} strokeWidth="1.2" />
                      <text
                        x="20"
                        y={yMid + 3}
                        fill={palette.physicalTrace}
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="700"
                        textAnchor="end"
                      >
                        d
                      </text>
                    </g>
                  );
                })()}

                {/* Incident k0 & Diffracted k X-Ray Wavevectors */}
                <line x1="24" y1="38" x2="128" y2="74" stroke={palette.instTrace} strokeWidth="2.1" />
                <line x1="128" y1="74" x2="232" y2="38" stroke={palette.physicalTrace} strokeWidth="2.1" />
                <circle cx="128" cy="74" r="3.4" fill={palette.highlightTrace} />
                {/* Bragg Angle Arc */}
                <path
                  d="M 88 74 A 40 40 0 0 1 92 61"
                  fill="none"
                  stroke={palette.highlightTrace}
                  strokeWidth="1.3"
                />
                <text
                  x="62"
                  y="66"
                  fill={palette.highlightTrace}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  θ_B
                </text>

                {/* Full Column Vertical Caliper D = N · d */}
                <line x1="252" y1="54" x2="252" y2="184" stroke={palette.highlightTrace} strokeWidth="1.6" />
                <line x1="245" y1="54" x2="259" y2="54" stroke={palette.highlightTrace} strokeWidth="1.5" />
                <line x1="245" y1="184" x2="259" y2="184" stroke={palette.highlightTrace} strokeWidth="1.5" />
                <text
                  x="298"
                  y="108"
                  fill={palette.highlightTrace}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  D = {activeMetric?.sizeNm ? `${activeMetric.sizeNm.toFixed(1)}` : '—'}
                </text>
                <text
                  x="298"
                  y="121"
                  fill={palette.textMuted}
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  nm
                </text>
                <text
                  x="298"
                  y="139"
                  fill={palette.primaryTrace}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  N ≈ {planesN}
                </text>
                <text
                  x="298"
                  y="151"
                  fill={palette.textMuted}
                  fontSize="8.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  planes
                </text>

                {/* Footer Formula Strip */}
                <text
                  x="171"
                  y="212"
                  fill={palette.textSecondary}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  d_hkl = {dVal.toFixed(4)} Å · Q = {activeMetric?.qVector.toFixed(3)} Å⁻¹
                </text>
              </g>

              {/* RIGHT PANEL: Mathematical Scherrer Hyperbola D(β_phys) */}
              <g transform="translate(366, 12)">
                <rect
                  x="0"
                  y="0"
                  width="342"
                  height="226"
                  rx="6"
                  fill={palette.insetBg}
                  stroke={palette.border}
                  strokeWidth="1"
                />
                <text
                  x="171"
                  y="19"
                  fill={palette.highlightTrace}
                  fontSize="10.5"
                  fontFamily="monospace"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  SCHERRER HYPERBOLA · D = Kλ / (β_phys · cos θ)
                </text>

                {/* Instrumental Resolution Limit Zone */}
                <rect
                  x={hypL}
                  y={hypT}
                  width={Math.max(4, limitBoundaryX - hypL)}
                  height={hypH}
                  fill={palette.errorTrace}
                  fillOpacity={dark ? '0.09' : '0.07'}
                />
                <text
                  x={hypL + 5}
                  y={hypT + 12}
                  fill={palette.errorTrace}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  Inst. Limit
                </text>

                {/* Grid & Y-axis ticks (D in nm) */}
                {[0.25, 0.5, 0.75, 1].map((g, i) => {
                  const gy = hypB - g * hypH;
                  return (
                    <g key={i}>
                      <line
                        x1={hypL}
                        y1={gy}
                        x2={hypR}
                        y2={gy}
                        stroke={palette.grid}
                        strokeWidth="0.8"
                        strokeDasharray="2 2"
                      />
                      <text
                        x={hypL - 6}
                        y={gy + 3}
                        textAnchor="end"
                        fill={palette.textMuted}
                        fontSize="8.8"
                        fontFamily="monospace"
                      >
                        {Math.round(maxDPlot * g)}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis ticks (β_phys in degrees) */}
                {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                  const tx = hypL + t * hypW;
                  const bVal = minBetaPlot + t * (maxBetaPlot - minBetaPlot);
                  return (
                    <g key={i}>
                      <line x1={tx} y1={hypB} x2={tx} y2={hypB + 4} stroke={palette.axis} strokeWidth="1" />
                      <text
                        x={tx}
                        y={hypB + 14}
                        textAnchor="middle"
                        fill={palette.textMuted}
                        fontSize="8.5"
                        fontFamily="monospace"
                      >
                        {bVal.toFixed(2)}°
                      </text>
                    </g>
                  );
                })}

                {/* Axes Frame */}
                <line x1={hypL} y1={hypT} x2={hypL} y2={hypB} stroke={palette.axis} strokeWidth="1.1" />
                <line x1={hypL} y1={hypB} x2={hypR} y2={hypB} stroke={palette.axis} strokeWidth="1.1" />

                {/* Axis Titles */}
                <text
                  x={13}
                  y={hypT + hypH / 2}
                  transform={`rotate(-90 13 ${hypT + hypH / 2})`}
                  textAnchor="middle"
                  fill={palette.textMuted}
                  fontSize="8.8"
                  fontFamily="monospace"
                >
                  D (nm)
                </text>
                <text
                  x={hypL + hypW / 2}
                  y={214}
                  fill={palette.textSecondary}
                  fontSize="9.2"
                  fontFamily="monospace"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  Physical Broadening β_phys (° 2θ)
                </text>

                {/* Hyperbola Curve */}
                <polyline
                  fill="none"
                  stroke={palette.primaryTrace}
                  strokeWidth="2"
                  points={curvePts.join(' ')}
                />

                {/* Plot All Active Reflections */}
                {peaks.map((p, idx) => {
                  const m = reflectionMetrics.rows[idx];
                  if (!m?.betaCorrected || !m?.sizeNm || p.excluded) return null;
                  const px = mapBetaX(m.betaCorrected);
                  const py = mapDY(m.sizeNm);
                  const isActive = idx === inspectedIdx;
                  const hklText = p.hkl ? `(${p.hkl.join('')})` : `#${idx + 1}`;
                  return (
                    <g
                      key={idx}
                      onClick={() => onSelectPeakIdx(idx)}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      className="cursor-pointer"
                    >
                      <circle cx={px} cy={py} r="10" fill="transparent" />
                      {isActive && (
                        <>
                          <line
                            x1={px}
                            y1={py}
                            x2={px}
                            y2={hypB}
                            stroke={palette.highlightTrace}
                            strokeWidth="1.1"
                            strokeDasharray="3 2"
                          />
                          <line
                            x1={hypL}
                            y1={py}
                            x2={px}
                            y2={py}
                            stroke={palette.highlightTrace}
                            strokeWidth="1.1"
                            strokeDasharray="3 2"
                          />
                          <circle
                            cx={px}
                            cy={py}
                            r="7.5"
                            fill={palette.highlightTrace}
                            fillOpacity="0.2"
                          />
                        </>
                      )}
                      <circle
                        cx={px}
                        cy={py}
                        r={isActive ? '4.5' : '3.2'}
                        fill={isActive ? palette.highlightTrace : palette.physicalTrace}
                        stroke={palette.insetBg}
                        strokeWidth="1.2"
                      />
                      {isActive && (
                        <text
                          x={Math.min(hypR - 24, Math.max(hypL + 24, px + 8))}
                          y={Math.max(hypT + 12, py - 8)}
                          fill={palette.highlightTrace}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="700"
                        >
                          {hklText}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          );
        })()}
      </div>

      {/* Unified 5-Column Reflection Metrology Ribbon */}
      {activePeak && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x border-t font-mono tabular-nums ${
            dark
              ? 'bg-[#0B101B] border-slate-800 divide-slate-800'
              : 'bg-slate-50 border-slate-200 divide-slate-200'
          }`}
        >
          <div className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              {hoveredIdx !== null ? 'Hovered Peak' : 'Selected Peak'}
            </div>
            <div className={`text-xs font-bold mt-0.5 ${dark ? 'text-cyan-300' : 'text-sky-800'}`}>
              {activeHklLabel} · {activePeak.twoTheta.toFixed(3)}°
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              Lattice d / Q
            </div>
            <div className="text-xs font-semibold mt-0.5">
              {activeMetric?.dSpacing.toFixed(4)} Å{' '}
              <span className="text-[10px] text-slate-500">
                ({activeMetric?.qVector.toFixed(2)} Å⁻¹)
              </span>
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              Deconv (β<sub>obs</sub> / β<sub>inst</sub>)
            </div>
            <div className="text-xs font-semibold mt-0.5">
              <span>{activePeak.fwhmObs.toFixed(3)}°</span>
              <span className="text-slate-500"> / </span>
              <span className={dark ? 'text-amber-300' : 'text-amber-700'}>
                {activeMetric?.curInstFwhm.toFixed(3)}°
              </span>
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              Sample β<sub>phys</sub>
            </div>
            <div className={`text-xs font-bold mt-0.5 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {activeMetric?.betaCorrected
                ? `${activeMetric.betaCorrected.toFixed(3)}° (${physSharePct.toFixed(0)}%)`
                : 'Inst. Limit'}
            </div>
          </div>

          <div className="px-3 py-2 col-span-2 sm:col-span-1">
            <div className="text-[9px] uppercase tracking-wider text-slate-500">
              Domain D<sub>hkl</sub>
            </div>
            <div className={`text-xs font-bold mt-0.5 ${dark ? 'text-amber-300' : 'text-amber-800'}`}>
              {activeMetric?.sizeNm
                ? `${activeMetric.sizeNm.toFixed(2)} nm`
                : 'Unresolved'}
              {activeMetric?.planesN > 0 && (
                <span className="text-[10px] font-normal text-slate-500 ml-1">
                  · N≈{activeMetric.planesN}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiet Optics Status Line when Kα2 or Zero-Shift or Integral Breadth is active */}
      {(kAlpha2Correction || Math.abs(zeroShiftDeg) > 0.0001 || breadthType === 'integral_breadth') && (
        <div
          className={`px-3.5 py-1.5 border-t text-[9.5px] font-mono tabular-nums flex flex-wrap items-center gap-x-3 gap-y-0.5 ${
            dark
              ? 'bg-[#060912] border-slate-800 text-slate-400'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          {breadthType === 'integral_breadth' && <span>Breadth: Integral Breadth (β_int)</span>}
          {kAlpha2Correction && <span>Rachinger Kα₂ Stripping Active</span>}
          {Math.abs(zeroShiftDeg) > 0.0001 && (
            <span>
              Zero-Shift Correction: {zeroShiftDeg > 0 ? '+' : ''}
              {zeroShiftDeg.toFixed(4)}°
            </span>
          )}
        </div>
      )}
    </div>
  );
};
