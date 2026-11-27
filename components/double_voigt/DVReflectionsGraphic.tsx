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
import { DoubleVoigtPoint } from '../../types';
import { useSettings, convertLength } from '../SettingsContext';
import {
  COLOR_VISION_MODES,
  getThemeSpec,
  isDarkTheme,
} from '../../utils/themeSystem';

export type DVGraphicMode = 'spectrum' | 'partition' | 'shape' | 'residuals';
type IntensityScaleMode = 'linear' | 'sqrt';

interface DVReflectionsGraphicProps {
  points: DoubleVoigtPoint[];
  selectedPeakIdx: number;
  onSelectPeakIdx: (idx: number) => void;
  hoveredPeakIdx: number | null;
  onHoverPeakIdx: (idx: number | null) => void;
  wavelength: number;
  shapeK: number;
  deconvKernel: string;
  instEta: number;
  onToggleExcludePeak?: (idx: number) => void;
  controlledMode?: DVGraphicMode;
  onModeChange?: (mode: DVGraphicMode) => void;
}

const PHI_CAUCHY = 2 / Math.PI; // 0.63662
const PHI_GAUSS = 2 * Math.sqrt(Math.LN2 / Math.PI); // 0.93944

export const DVReflectionsGraphic: React.FC<DVReflectionsGraphicProps> = ({
  points,
  selectedPeakIdx,
  onSelectPeakIdx,
  hoveredPeakIdx,
  onHoverPeakIdx,
  wavelength,
  shapeK,
  deconvKernel,
  instEta,
  onToggleExcludePeak,
  controlledMode,
  onModeChange,
}) => {
  const uid = useId().replace(/:/g, '');
  const { theme, colorVisionMode, lengthUnit = 'Å' } = useSettings();
  const dark = isDarkTheme(theme);
  const themeSpec = getThemeSpec(theme);
  const cvdEntry = useMemo(
    () =>
      COLOR_VISION_MODES.find((m) => m.id === colorVisionMode) ||
      COLOR_VISION_MODES[0],
    [colorVisionMode]
  );

  const [internalMode, setInternalMode] = useState<DVGraphicMode>('spectrum');
  const [intensityScale, setIntensityScale] = useState<IntensityScaleMode>('linear');

  const activeMode = controlledMode ?? internalMode;
  const setActiveMode = (mode: DVGraphicMode) => {
    setInternalMode(mode);
    onModeChange?.(mode);
  };

  const safeSelectedIdx =
    points.length > 0 ? Math.min(selectedPeakIdx, points.length - 1) : 0;
  const inspectedIdx =
    hoveredPeakIdx !== null && hoveredPeakIdx < points.length
      ? hoveredPeakIdx
      : safeSelectedIdx;
  const activePoint = points[inspectedIdx] || points[0];

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
        voigtTrace: isCvd ? cvdPrimary : '#38bdf8',
        cauchyTrace: isCvd ? cvdPrimary : '#6366f1',
        gaussTrace: isCvd ? cvdSecondary : '#a855f7',
        instTrace: isCvd ? cvdHighlight : '#f59e0b',
        sizeTrace: isCvd ? cvdSecondary : '#10b981',
        outlierTrace: isCvd ? cvdHighlight : '#f43f5e',
        bandFill: isCvd ? `${cvdPrimary}1c` : 'rgba(99, 102, 241, 0.12)',
        excluded: '#64748b',
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
      voigtTrace: isCvd ? cvdPrimary : '#0284c7',
      cauchyTrace: isCvd ? cvdPrimary : '#4f46e5',
      gaussTrace: isCvd ? cvdSecondary : '#7c3aed',
      instTrace: isCvd ? cvdHighlight : '#d97706',
      sizeTrace: isCvd ? cvdSecondary : '#059669',
      outlierTrace: isCvd ? cvdHighlight : '#e11d48',
      bandFill: isCvd ? `${cvdPrimary}1a` : 'rgba(79, 70, 229, 0.08)',
      excluded: '#94a3b8',
    };
  }, [dark, colorVisionMode, cvdEntry, themeSpec]);

  const formatHkl = (pt?: DoubleVoigtPoint, idx = 0) =>
    pt?.hkl ? `(${pt.hkl.join('')})` : `#${idx + 1}`;

  // Spectrum Mode Geometry (Synthetic Voigt diffractogram + Voigt profile caliper inset)
  const spectrumData = useMemo(() => {
    if (points.length === 0) return null;
    const angles = points.map((p) => p.twoTheta);
    const minT = Math.max(5, Math.floor((Math.min(...angles) - 6) / 5) * 5);
    const maxT = Math.min(165, Math.ceil((Math.max(...angles) + 6) / 5) * 5);
    const spanT = Math.max(10, maxT - minT);

    // Main plot x: [42, 434], y: [24, 194]; Right inset x: [452, 624]
    const x0 = 42;
    const x1 = 434;
    const yTop = 24;
    const yBase = 194;
    const w = x1 - x0;
    const h = yBase - yTop;

    const toX = (tt: number) => x0 + ((tt - minT) / spanT) * w;

    // Synthesize relative peak amplitudes smoothly from Bragg order for visual clarity
    const peakHeights = points.map((p, i) => {
      const decay = 1 / (1 + i * 0.14);
      const sharp = Math.min(1.25, Math.max(0.45, 0.45 / Math.max(0.15, p.fwhmObs || 0.4)));
      return Math.min(1.0, Math.max(0.28, decay * 0.72 + sharp * 0.28));
    });
    const maxH = Math.max(...peakHeights, 0.01);
    const normHeights = peakHeights.map((v) => v / maxH);

    const sampleCount = 240;
    const curvePts: string[] = [];
    for (let i = 0; i <= sampleCount; i++) {
      const tt = minT + (i / sampleCount) * spanT;
      let val = 0;
      for (let j = 0; j < points.length; j++) {
        const pk = points[j];
        const amp = pk.excluded ? normHeights[j] * 0.25 : normHeights[j];
        const halfW = Math.max(0.22, (pk.fwhmObs || 0.4) * 1.15);
        const u = (tt - pk.twoTheta) / halfW;
        const eta = pk.etaObs ?? 0.5;
        const lorentz = 1 / (1 + u * u);
        const gauss = Math.exp(-Math.LN2 * u * u);
        val += amp * (eta * lorentz + (1 - eta) * gauss);
      }
      const scaled = intensityScale === 'sqrt' ? Math.sqrt(Math.min(1.2, val)) : Math.min(1.15, val);
      const y = yBase - Math.min(1, scaled) * (h - 10);
      curvePts.push(`${toX(tt).toFixed(1)},${y.toFixed(1)}`);
    }

    // Staggered (hkl) label positions to prevent overlap
    const markers = points.map((pk, idx) => {
      const x = toX(pk.twoTheta);
      const amp = pk.excluded ? normHeights[idx] * 0.25 : normHeights[idx];
      const scaled = intensityScale === 'sqrt' ? Math.sqrt(amp) : amp;
      const yPeak = yBase - scaled * (h - 10);
      return { idx, pk, x, yPeak, label: formatHkl(pk, idx) };
    });

    const sortedMarkers = [...markers].sort((a, b) => a.x - b.x);
    const labelYMap = new Map<number, number>();
    let lastX = -999;
    let tier = 0;
    for (const m of sortedMarkers) {
      if (m.x - lastX < 32) {
        tier = (tier + 1) % 3;
      } else {
        tier = 0;
      }
      lastX = m.x;
      labelYMap.set(m.idx, Math.max(yTop + 8, m.yPeak - 10 - tier * 11));
    }

    // Right-hand Voigt Profile Caliper Inset for activePoint
    const inset = (() => {
      if (!activePoint) return null;
      const ix0 = 462;
      const iw = 152;
      const icx = ix0 + iw / 2;
      const iyBase = 176;
      const iPeakH = 104;
      const fwhm = Math.max(0.05, activePoint.fwhmObs || 0.4);
      const instW = Math.max(0.01, activePoint.fwhmInst || 0.05);
      const eta = activePoint.etaObs ?? 0.5;
      const halfSpan = fwhm * 2.4;

      const vPts: string[] = [];
      const cPts: string[] = [];
      const gPts: string[] = [];
      const instPts: string[] = [];
      for (let i = 0; i <= 72; i++) {
        const frac = i / 72;
        const dx = (frac - 0.5) * 2 * halfSpan;
        const u = dx / (fwhm / 2);
        const uI = dx / (instW / 2);
        const l = 1 / (1 + u * u);
        const g = Math.exp(-Math.LN2 * u * u);
        const pv = eta * l + (1 - eta) * g;
        const iv = (instEta * (1 / (1 + uI * uI)) + (1 - instEta) * Math.exp(-Math.LN2 * uI * uI)) * 0.55;
        const px = ix0 + frac * iw;
        vPts.push(`${px.toFixed(1)},${(iyBase - pv * iPeakH).toFixed(1)}`);
        cPts.push(`${px.toFixed(1)},${(iyBase - eta * l * iPeakH).toFixed(1)}`);
        gPts.push(`${px.toFixed(1)},${(iyBase - (1 - eta) * g * iPeakH).toFixed(1)}`);
        instPts.push(`${px.toFixed(1)},${(iyBase - iv * iPeakH).toFixed(1)}`);
      }
      const fwhmHalfPx = (fwhm / 2 / halfSpan) * (iw / 2);
      return {
        ix0,
        iw,
        icx,
        iyBase,
        iyHalf: iyBase - iPeakH * 0.5,
        fwhmHalfPx,
        vPts: vPts.join(' '),
        vPoly: `${ix0},${iyBase} ${vPts.join(' ')} ${ix0 + iw},${iyBase}`,
        cPts: cPts.join(' '),
        gPts: gPts.join(' '),
        instPts: instPts.join(' '),
      };
    })();

    const ticks: number[] = [];
    const step = spanT > 70 ? 20 : spanT > 35 ? 10 : 5;
    for (let t = Math.ceil(minT / step) * step; t <= maxT; t += step) {
      ticks.push(t);
    }

    return {
      minT,
      maxT,
      x0,
      x1,
      yTop,
      yBase,
      toX,
      curvePolyline: curvePts.join(' '),
      curvePolygon: `${x0},${yBase} ${curvePts.join(' ')} ${x1},${yBase}`,
      markers,
      labelYMap,
      ticks,
      inset,
    };
  }, [points, intensityScale, activePoint, instEta]);

  // Mode 2: Reciprocal Cauchy vs Gaussian Breadth Partition
  const partitionData = useMemo(() => {
    if (points.length === 0) return null;
    const x0 = 54;
    const x1 = 588;
    const yTop = 26;
    const yBase = 192;
    const w = x1 - x0;
    const h = yBase - yTop;

    const maxBeta = Math.max(
      0.01,
      ...points.map((p) => Math.max(p.betaStar, p.betaCStar + p.betaGStar))
    ) * 1.15;
    const maxDv = Math.max(5, ...points.map((p) => p.singleDvNm || 0)) * 1.15;

    const slotW = w / Math.max(1, points.length);
    const barW = Math.min(24, Math.max(8, slotW * 0.28));

    const items = points.map((pk, idx) => {
      const cx = x0 + (idx + 0.5) * slotW;
      const cH = (pk.betaCStar / maxBeta) * h;
      const gH = (pk.betaGStar / maxBeta) * h;
      const totY = yBase - (pk.betaStar / maxBeta) * h;
      const dvY = yBase - ((pk.singleDvNm || 0) / maxDv) * h;
      return { idx, pk, cx, cH, gH, totY, dvY, label: formatHkl(pk, idx) };
    });

    const dvLine = items
      .filter((it) => !it.pk.excluded)
      .map((it) => `${it.cx.toFixed(1)},${it.dvY.toFixed(1)}`)
      .join(' ');

    return { x0, x1, yTop, yBase, w, h, barW, maxBeta, maxDv, items, dvLine };
  }, [points]);

  // Mode 3: Langford Shape Factor phi & Lorentzian Mixing eta Map
  const shapeData = useMemo(() => {
    if (points.length === 0) return null;
    const x0 = 54;
    const x1 = 602;
    const yTop = 26;
    const yBase = 192;
    const w = x1 - x0;
    const h = yBase - yTop;

    const phiMinAxis = 0.58;
    const phiMaxAxis = 1.00;
    const toPhiY = (phi: number) =>
      yBase - ((Math.min(phiMaxAxis, Math.max(phiMinAxis, phi)) - phiMinAxis) / (phiMaxAxis - phiMinAxis)) * h;

    const yCauchy = toPhiY(PHI_CAUCHY);
    const yGauss = toPhiY(PHI_GAUSS);

    const activePhis = points
      .filter((p) => !p.excluded)
      .map((p) => p.shapeFactorPhi ?? PHI_CAUCHY);
    const meanPhi =
      activePhis.length > 0
        ? activePhis.reduce((a, b) => a + b, 0) / activePhis.length
        : 0.78;
    const yMean = toPhiY(meanPhi);

    const slotW = w / Math.max(1, points.length);
    const items = points.map((pk, idx) => {
      const cx = x0 + (idx + 0.5) * slotW;
      const phi = pk.shapeFactorPhi ?? 0.75;
      const py = toPhiY(phi);
      return { idx, pk, cx, py, phi, label: formatHkl(pk, idx) };
    });

    return { x0, x1, yTop, yBase, w, h, yCauchy, yGauss, yMean, meanPhi, items, toPhiY };
  }, [points]);

  // Mode 4: Dual Standardized Residuals z_C & z_G
  const residualData = useMemo(() => {
    if (points.length === 0) return null;
    const x0 = 54;
    const x1 = 602;
    const yTop = 24;
    const yBase = 194;
    const w = x1 - x0;
    const h = yBase - yTop;
    const yZero = yTop + h / 2;

    const maxAbsZ = Math.max(
      2.6,
      ...points.map((p) =>
        Math.max(Math.abs(p.cauchyStdResidual || 0), Math.abs(p.gaussianStdResidual || 0))
      )
    ) * 1.1;

    const toZY = (z: number) => yZero - (z / maxAbsZ) * (h / 2);
    const yPlus2 = toZY(2.0);
    const yMinus2 = toZY(-2.0);

    const slotW = w / Math.max(1, points.length);
    const items = points.map((pk, idx) => {
      const cx = x0 + (idx + 0.5) * slotW;
      const zC = pk.cauchyStdResidual || 0;
      const zG = pk.gaussianStdResidual || 0;
      return {
        idx,
        pk,
        cx,
        zC,
        zG,
        yC: toZY(zC),
        yG: toZY(zG),
        label: formatHkl(pk, idx),
      };
    });

    return { x0, x1, yTop, yBase, w, h, yZero, yPlus2, yMinus2, maxAbsZ, items };
  }, [points]);

  if (points.length === 0) {
    return null;
  }

  const handleStep = (delta: number) => {
    if (points.length === 0) return;
    const next = (safeSelectedIdx + delta + points.length) % points.length;
    onSelectPeakIdx(next);
  };

  const modeTabs: { id: DVGraphicMode; label: string; icon: React.ReactNode }[] = [
    { id: 'spectrum', label: '2θ & Voigt', icon: <Activity className="w-3 h-3" /> },
    { id: 'partition', label: 'β_C* / β_G*', icon: <BarChart2 className="w-3 h-3" /> },
    { id: 'shape', label: 'η & φ Map', icon: <Layers className="w-3 h-3" /> },
    { id: 'residuals', label: 'z_C / z_G', icon: <Target className="w-3 h-3" /> },
  ];

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: palette.shellBg,
        borderColor: palette.border,
      }}
    >
      {/* Top Instrument Header */}
      <div
        className="px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2"
        style={{
          backgroundColor: palette.insetBg,
          borderColor: palette.border,
        }}
      >
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono tabular-nums">
          <span className="font-semibold" style={{ color: palette.textPrimary }}>
            Voigt Reflections Metrology
          </span>
          <span aria-hidden="true" style={{ color: palette.textMuted }}>·</span>
          <span style={{ color: palette.textMuted }}>
            λ = {convertLength(wavelength, lengthUnit).toFixed(4)} {lengthUnit}
          </span>
          <span aria-hidden="true" style={{ color: palette.textMuted }}>·</span>
          <span style={{ color: palette.textMuted }}>
            K = {shapeK.toFixed(2)}
          </span>
          <span aria-hidden="true" style={{ color: palette.textMuted }}>·</span>
          <span style={{ color: palette.cauchyTrace }}>{deconvKernel}</span>
        </div>

        {/* Peak Stepper */}
        <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            aria-label="Previous reflection"
            className="p-1 rounded border transition-colors cursor-pointer"
            style={{
              backgroundColor: palette.shellBg,
              borderColor: palette.border,
              color: palette.textSecondary,
            }}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span
            className="px-2 py-0.5 rounded border whitespace-nowrap"
            style={{
              backgroundColor: palette.shellBg,
              borderColor: palette.border,
              color: palette.textPrimary,
            }}
          >
            {formatHkl(activePoint, inspectedIdx)} {inspectedIdx + 1}/{points.length}
          </span>
          <button
            type="button"
            onClick={() => handleStep(1)}
            aria-label="Next reflection"
            className="p-1 rounded border transition-colors cursor-pointer"
            style={{
              backgroundColor: palette.shellBg,
              borderColor: palette.border,
              color: palette.textSecondary,
            }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Switcher + Mode-Specific Legend Strip */}
      <div
        className="px-3.5 py-2 border-b flex flex-wrap items-center justify-between gap-2"
        style={{
          backgroundColor: palette.shellBg,
          borderColor: palette.border,
        }}
      >
        <div
          className="flex items-center gap-1 p-0.5 rounded-lg border"
          style={{
            backgroundColor: palette.insetBg,
            borderColor: palette.border,
          }}
        >
          {modeTabs.map((tab) => {
            const active = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className="px-2 py-1 rounded-md text-[11px] font-mono font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                style={{
                  backgroundColor: active ? palette.shellBg : 'transparent',
                  color: active ? palette.textPrimary : palette.textMuted,
                  border: active ? `1px solid ${palette.border}` : '1px solid transparent',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode-specific inline controls / readouts */}
        <div className="flex items-center gap-2 text-[10.5px] font-mono tabular-nums">
          {activeMode === 'spectrum' && (
            <div
              className="flex items-center p-0.5 rounded border"
              style={{ backgroundColor: palette.insetBg, borderColor: palette.border }}
            >
              {(['linear', 'sqrt'] as IntensityScaleMode[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setIntensityScale(sc)}
                  className="px-2 py-0.5 rounded text-[10px] cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: intensityScale === sc ? palette.shellBg : 'transparent',
                    color: intensityScale === sc ? palette.textPrimary : palette.textMuted,
                  }}
                >
                  {sc === 'linear' ? 'Linear' : '√I'}
                </button>
              ))}
            </div>
          )}
          {activeMode === 'partition' && (
            <span style={{ color: palette.textMuted }}>
              <span style={{ color: palette.cauchyTrace }}>■ β_C*</span>
              {' · '}
              <span style={{ color: palette.gaussTrace }}>■ β_G*</span>
              {' · '}
              <span style={{ color: palette.sizeTrace }}>● D_V,hkl</span>
            </span>
          )}
          {activeMode === 'shape' && shapeData && (
            <span style={{ color: palette.textMuted }}>
              Mean φ = <strong style={{ color: palette.textPrimary }}>{shapeData.meanPhi.toFixed(4)}</strong>
              {' · '}Cauchy 0.637 / Gauss 0.939
            </span>
          )}
          {activeMode === 'residuals' && (
            <span style={{ color: palette.textMuted }}>
              <span style={{ color: palette.cauchyTrace }}>● z_C</span>
              {' · '}
              <span style={{ color: palette.gaussTrace }}>■ z_G</span>
              {' · '}±2σ outlier gate
            </span>
          )}
        </div>
      </div>

      {/* Main High-Resolution SVG Stage */}
      <div
        className="w-full px-2 py-2"
        style={{ backgroundColor: palette.canvasBg }}
        onMouseLeave={() => onHoverPeakIdx(null)}
      >
        <svg
          viewBox="0 0 640 238"
          className="w-full h-[216px] sm:h-[238px] block select-none font-mono"
          role="img"
          aria-label="Double-Voigt Reflections Metrology Graphic"
        >
          <defs>
            <linearGradient id={`dvSpecFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.voigtTrace} stopOpacity={dark ? 0.24 : 0.16} />
              <stop offset="100%" stopColor={palette.voigtTrace} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* MODE 1: 2θ & Voigt Spectrum + Right Caliper Inset */}
          {activeMode === 'spectrum' && spectrumData && (
            <>
              {/* Horizontal Grid */}
              {[0.25, 0.5, 0.75, 1].map((f) => {
                const y = spectrumData.yBase - f * (spectrumData.yBase - spectrumData.yTop - 10);
                return (
                  <line
                    key={f}
                    x1={spectrumData.x0}
                    y1={y}
                    x2={spectrumData.x1}
                    y2={y}
                    stroke={palette.grid}
                    strokeWidth="0.8"
                    strokeDasharray="2 3"
                  />
                );
              })}

              {/* Axes */}
              <line x1={spectrumData.x0} y1={spectrumData.yBase} x2={spectrumData.x1} y2={spectrumData.yBase} stroke={palette.axis} strokeWidth="1" />
              <line x1={spectrumData.x0} y1={spectrumData.yTop} x2={spectrumData.x0} y2={spectrumData.yBase} stroke={palette.axis} strokeWidth="1" />

              {/* Ticks */}
              {spectrumData.ticks.map((t) => {
                const x = spectrumData.toX(t);
                return (
                  <g key={t}>
                    <line x1={x} y1={spectrumData.yBase} x2={x} y2={spectrumData.yBase + 4} stroke={palette.axis} strokeWidth="1" />
                    <text x={x} y={spectrumData.yBase + 15} textAnchor="middle" fill={palette.textMuted} fontSize="9">
                      {t}°
                    </text>
                  </g>
                );
              })}
              <text x={(spectrumData.x0 + spectrumData.x1) / 2} y="226" textAnchor="middle" fill={palette.textSecondary} fontSize="9.5">
                Diffraction Angle 2θ [°] ({intensityScale === 'sqrt' ? '√I Scale' : 'Linear I'})
              </text>
              <text
                x="14"
                y={(spectrumData.yTop + spectrumData.yBase) / 2}
                textAnchor="middle"
                fill={palette.textMuted}
                fontSize="9"
                transform={`rotate(-90 14 ${(spectrumData.yTop + spectrumData.yBase) / 2})`}
              >
                Rel. Intensity
              </text>

              {/* Continuous Voigt Diffractogram */}
              <polygon points={spectrumData.curvePolygon} fill={`url(#dvSpecFill-${uid})`} />
              <polyline fill="none" stroke={palette.voigtTrace} strokeWidth="1.8" points={spectrumData.curvePolyline} />

              {/* Interactive Peak Markers */}
              {spectrumData.markers.map((m) => {
                const isInspected = m.idx === inspectedIdx;
                const isExcl = Boolean(m.pk.excluded);
                const strokeCol = isExcl
                  ? palette.excluded
                  : m.pk.isOutlier
                  ? palette.outlierTrace
                  : isInspected
                  ? palette.cauchyTrace
                  : palette.voigtTrace;
                const labelY = spectrumData.labelYMap.get(m.idx) ?? m.yPeak - 10;

                return (
                  <g
                    key={m.idx}
                    className="cursor-pointer"
                    onMouseEnter={() => onHoverPeakIdx(m.idx)}
                    onClick={() => onSelectPeakIdx(m.idx)}
                  >
                    <rect x={m.x - 12} y={spectrumData.yTop} width="24" height={spectrumData.yBase - spectrumData.yTop} fill="transparent" />
                    <line
                      x1={m.x}
                      y1={m.yPeak}
                      x2={m.x}
                      y2={spectrumData.yBase}
                      stroke={strokeCol}
                      strokeWidth={isInspected ? 1.5 : 0.9}
                      strokeDasharray={isExcl ? '2 2' : isInspected ? 'none' : '2 2'}
                      opacity={isExcl ? 0.5 : 0.9}
                    />
                    <circle
                      cx={m.x}
                      cy={m.yPeak}
                      r={isInspected ? 4.2 : 3}
                      fill={isInspected ? strokeCol : palette.canvasBg}
                      stroke={strokeCol}
                      strokeWidth="1.6"
                    />
                    <text
                      x={m.x}
                      y={labelY}
                      textAnchor="middle"
                      fill={isInspected ? palette.textPrimary : palette.textMuted}
                      fontSize={isInspected ? '9' : '8'}
                      fontWeight={isInspected ? 'bold' : 'normal'}
                    >
                      {m.label}
                    </text>
                  </g>
                );
              })}

              {/* Right-Hand Voigt Profile Caliper Inset */}
              {spectrumData.inset && activePoint && (
                <g>
                  <rect
                    x="448"
                    y="12"
                    width="180"
                    height="214"
                    rx="6"
                    fill={palette.insetBg}
                    stroke={palette.border}
                    strokeWidth="1"
                  />
                  <text x="458" y="28" fill={palette.textPrimary} fontSize="9.5" fontWeight="bold">
                    VOIGT CALIPER {formatHkl(activePoint, inspectedIdx)}
                  </text>
                  <text x="458" y="40" fill={palette.textMuted} fontSize="8">
                    2θ = {activePoint.twoTheta.toFixed(2)}° · η = {(activePoint.etaObs ?? 0.5).toFixed(2)}
                  </text>

                  {/* Baseline */}
                  <line
                    x1={spectrumData.inset.ix0}
                    y1={spectrumData.inset.iyBase}
                    x2={spectrumData.inset.ix0 + spectrumData.inset.iw}
                    y2={spectrumData.inset.iyBase}
                    stroke={palette.axis}
                    strokeWidth="1"
                  />
                  {/* Voigt fill & decomposed components */}
                  <polygon points={spectrumData.inset.vPoly} fill={palette.bandFill} />
                  <polyline fill="none" stroke={palette.instTrace} strokeWidth="1.2" strokeDasharray="2 2" points={spectrumData.inset.instPts} />
                  <polyline fill="none" stroke={palette.cauchyTrace} strokeWidth="1.3" strokeDasharray="4 2" points={spectrumData.inset.cPts} />
                  <polyline fill="none" stroke={palette.gaussTrace} strokeWidth="1.3" strokeDasharray="2 2" points={spectrumData.inset.gPts} />
                  <polyline fill="none" stroke={palette.voigtTrace} strokeWidth="1.9" points={spectrumData.inset.vPts} />

                  {/* FWHM Caliper Bracket */}
                  <line
                    x1={spectrumData.inset.icx - spectrumData.inset.fwhmHalfPx}
                    y1={spectrumData.inset.iyHalf}
                    x2={spectrumData.inset.icx + spectrumData.inset.fwhmHalfPx}
                    y2={spectrumData.inset.iyHalf}
                    stroke={palette.textPrimary}
                    strokeWidth="1.1"
                  />
                  <line
                    x1={spectrumData.inset.icx - spectrumData.inset.fwhmHalfPx}
                    y1={spectrumData.inset.iyHalf - 3}
                    x2={spectrumData.inset.icx - spectrumData.inset.fwhmHalfPx}
                    y2={spectrumData.inset.iyHalf + 3}
                    stroke={palette.textPrimary}
                    strokeWidth="1.1"
                  />
                  <line
                    x1={spectrumData.inset.icx + spectrumData.inset.fwhmHalfPx}
                    y1={spectrumData.inset.iyHalf - 3}
                    x2={spectrumData.inset.icx + spectrumData.inset.fwhmHalfPx}
                    y2={spectrumData.inset.iyHalf + 3}
                    stroke={palette.textPrimary}
                    strokeWidth="1.1"
                  />
                  <text x={spectrumData.inset.icx} y={spectrumData.inset.iyHalf - 6} textAnchor="middle" fill={palette.textPrimary} fontSize="8">
                    FWHM {(activePoint.fwhmObs ?? 0).toFixed(3)}°
                  </text>

                  {/* Inset Legend */}
                  <text x="458" y="196" fill={palette.cauchyTrace} fontSize="8">
                    β_C* = {activePoint.betaCStar.toFixed(4)} nm⁻¹
                  </text>
                  <text x="458" y="208" fill={palette.gaussTrace} fontSize="8">
                    β_G* = {activePoint.betaGStar.toFixed(4)} nm⁻¹
                  </text>
                  <text x="458" y="220" fill={palette.instTrace} fontSize="8">
                    g_inst = {(activePoint.fwhmInst ?? 0).toFixed(3)}°
                  </text>
                </g>
              )}
            </>
          )}

          {/* MODE 2: Reciprocal Cauchy vs Gaussian Partition & Single-Line D_V */}
          {activeMode === 'partition' && partitionData && (
            <>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                const y = partitionData.yBase - f * partitionData.h;
                const bVal = f * partitionData.maxBeta;
                const dVal = f * partitionData.maxDv;
                return (
                  <g key={f}>
                    <line x1={partitionData.x0} y1={y} x2={partitionData.x1} y2={y} stroke={palette.grid} strokeWidth="0.8" strokeDasharray="2 3" />
                    <text x={partitionData.x0 - 6} y={y + 3} textAnchor="end" fill={palette.textMuted} fontSize="8.5">
                      {bVal.toFixed(3)}
                    </text>
                    <text x={partitionData.x1 + 6} y={y + 3} textAnchor="start" fill={palette.sizeTrace} fontSize="8.5">
                      {dVal.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              <line x1={partitionData.x0} y1={partitionData.yBase} x2={partitionData.x1} y2={partitionData.yBase} stroke={palette.axis} strokeWidth="1" />
              <line x1={partitionData.x0} y1={partitionData.yTop} x2={partitionData.x0} y2={partitionData.yBase} stroke={palette.axis} strokeWidth="1" />
              <line x1={partitionData.x1} y1={partitionData.yTop} x2={partitionData.x1} y2={partitionData.yBase} stroke={palette.sizeTrace} strokeWidth="1" strokeOpacity="0.6" />

              <text x="14" y={(partitionData.yTop + partitionData.yBase) / 2} textAnchor="middle" fill={palette.textSecondary} fontSize="9" transform={`rotate(-90 14 ${(partitionData.yTop + partitionData.yBase) / 2})`}>
                Reciprocal Breadth β* [nm⁻¹]
              </text>
              <text x="628" y={(partitionData.yTop + partitionData.yBase) / 2} textAnchor="middle" fill={palette.sizeTrace} fontSize="9" transform={`rotate(90 628 ${(partitionData.yTop + partitionData.yBase) / 2})`}>
                Single-Line D_V [nm]
              </text>

              {partitionData.dvLine && (
                <polyline fill="none" stroke={palette.sizeTrace} strokeWidth="1.5" strokeDasharray="4 3" points={partitionData.dvLine} />
              )}

              {partitionData.items.map((it) => {
                const isInspected = it.idx === inspectedIdx;
                const isExcl = Boolean(it.pk.excluded);
                const bw = partitionData.barW;
                return (
                  <g
                    key={it.idx}
                    className="cursor-pointer"
                    opacity={isExcl ? 0.35 : 1}
                    onMouseEnter={() => onHoverPeakIdx(it.idx)}
                    onClick={() => onSelectPeakIdx(it.idx)}
                  >
                    {isInspected && (
                      <rect
                        x={it.cx - bw * 1.45}
                        y={partitionData.yTop}
                        width={bw * 2.9}
                        height={partitionData.h}
                        fill={palette.bandFill}
                        rx="3"
                      />
                    )}
                    {/* Paired Cauchy & Gaussian Bars */}
                    <rect
                      x={it.cx - bw - 1.5}
                      y={partitionData.yBase - it.cH}
                      width={bw}
                      height={Math.max(1, it.cH)}
                      fill={palette.cauchyTrace}
                      fillOpacity={isInspected ? 0.95 : 0.72}
                      rx="2"
                    />
                    <rect
                      x={it.cx + 1.5}
                      y={partitionData.yBase - it.gH}
                      width={bw}
                      height={Math.max(1, it.gH)}
                      fill={palette.gaussTrace}
                      fillOpacity={isInspected ? 0.95 : 0.72}
                      rx="2"
                    />
                    {/* Apparent D_V dot */}
                    <circle
                      cx={it.cx}
                      cy={it.dvY}
                      r={isInspected ? 4.2 : 3}
                      fill={palette.canvasBg}
                      stroke={palette.sizeTrace}
                      strokeWidth="1.8"
                    />
                    <text
                      x={it.cx}
                      y={partitionData.yBase + 13}
                      textAnchor="middle"
                      fill={isInspected ? palette.textPrimary : palette.textMuted}
                      fontSize="8.5"
                      fontWeight={isInspected ? 'bold' : 'normal'}
                    >
                      {it.label}
                    </text>
                    <text x={it.cx} y={partitionData.yBase + 24} textAnchor="middle" fill={palette.textMuted} fontSize="7.5">
                      s={it.pk.s.toFixed(1)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* MODE 3: Langford Voigt Shape Factor phi Map */}
          {activeMode === 'shape' && shapeData && (
            <>
              {/* Shaded Physical Voigt Domain [0.6366, 0.9394] */}
              <rect
                x={shapeData.x0}
                y={shapeData.yGauss}
                width={shapeData.w}
                height={Math.max(2, shapeData.yCauchy - shapeData.yGauss)}
                fill={palette.bandFill}
              />

              {/* Limit Reference Lines */}
              <line x1={shapeData.x0} y1={shapeData.yGauss} x2={shapeData.x1} y2={shapeData.yGauss} stroke={palette.gaussTrace} strokeWidth="1.2" strokeDasharray="4 3" />
              <text x={shapeData.x1 - 4} y={shapeData.yGauss - 5} textAnchor="end" fill={palette.gaussTrace} fontSize="8.5" fontWeight="bold">
                Pure Gaussian Limit (φ = 0.9394, η = 0)
              </text>

              <line x1={shapeData.x0} y1={shapeData.yCauchy} x2={shapeData.x1} y2={shapeData.yCauchy} stroke={palette.cauchyTrace} strokeWidth="1.2" strokeDasharray="4 3" />
              <text x={shapeData.x1 - 4} y={shapeData.yCauchy + 11} textAnchor="end" fill={palette.cauchyTrace} fontSize="8.5" fontWeight="bold">
                Pure Cauchy Limit (φ = 0.6366, η = 1)
              </text>

              {/* Mean phi line */}
              <line x1={shapeData.x0} y1={shapeData.yMean} x2={shapeData.x1} y2={shapeData.yMean} stroke={palette.sizeTrace} strokeWidth="1.2" strokeDasharray="2 3" />

              {/* Y-Axis Ticks */}
              {[0.6, 0.7, 0.8, 0.9, 1.0].map((v) => {
                const y = shapeData.toPhiY(v);
                return (
                  <g key={v}>
                    <line x1={shapeData.x0 - 4} y1={y} x2={shapeData.x0} y2={y} stroke={palette.axis} strokeWidth="1" />
                    <text x={shapeData.x0 - 7} y={y + 3} textAnchor="end" fill={palette.textMuted} fontSize="8.5">
                      {v.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              <line x1={shapeData.x0} y1={shapeData.yBase} x2={shapeData.x1} y2={shapeData.yBase} stroke={palette.axis} strokeWidth="1" />
              <line x1={shapeData.x0} y1={shapeData.yTop} x2={shapeData.x0} y2={shapeData.yBase} stroke={palette.axis} strokeWidth="1" />
              <text x="14" y={(shapeData.yTop + shapeData.yBase) / 2} textAnchor="middle" fill={palette.textSecondary} fontSize="9" transform={`rotate(-90 14 ${(shapeData.yTop + shapeData.yBase) / 2})`}>
                Voigt Shape Factor φ = FWHM / β
              </text>

              {shapeData.items.map((it) => {
                const isInspected = it.idx === inspectedIdx;
                const isExcl = Boolean(it.pk.excluded);
                const col = isExcl ? palette.excluded : it.phi < 0.78 ? palette.cauchyTrace : palette.gaussTrace;
                return (
                  <g
                    key={it.idx}
                    className="cursor-pointer"
                    opacity={isExcl ? 0.4 : 1}
                    onMouseEnter={() => onHoverPeakIdx(it.idx)}
                    onClick={() => onSelectPeakIdx(it.idx)}
                  >
                    <line x1={it.cx} y1={shapeData.yBase} x2={it.cx} y2={it.py} stroke={col} strokeWidth={isInspected ? 2 : 1.2} strokeDasharray="2 2" />
                    <circle cx={it.cx} cy={it.py} r={isInspected ? 5 : 3.6} fill={isInspected ? col : palette.canvasBg} stroke={col} strokeWidth="1.8" />
                    <text x={it.cx} y={it.py - 8} textAnchor="middle" fill={isInspected ? palette.textPrimary : palette.textMuted} fontSize="8">
                      η={(it.pk.etaObs ?? 0.5).toFixed(2)}
                    </text>
                    <text x={it.cx} y={shapeData.yBase + 13} textAnchor="middle" fill={isInspected ? palette.textPrimary : palette.textMuted} fontSize="8.5" fontWeight={isInspected ? 'bold' : 'normal'}>
                      {it.label}
                    </text>
                    <text x={it.cx} y={shapeData.yBase + 24} textAnchor="middle" fill={palette.textMuted} fontSize="7.5">
                      φ={it.phi.toFixed(3)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* MODE 4: Dual Standardized Residuals z_C & z_G */}
          {activeMode === 'residuals' && residualData && (
            <>
              {/* Nominal +-2 sigma Band */}
              <rect
                x={residualData.x0}
                y={residualData.yPlus2}
                width={residualData.w}
                height={Math.max(2, residualData.yMinus2 - residualData.yPlus2)}
                fill={palette.bandFill}
              />
              <line x1={residualData.x0} y1={residualData.yPlus2} x2={residualData.x1} y2={residualData.yPlus2} stroke={palette.outlierTrace} strokeWidth="1" strokeDasharray="4 3" />
              <line x1={residualData.x0} y1={residualData.yMinus2} x2={residualData.x1} y2={residualData.yMinus2} stroke={palette.outlierTrace} strokeWidth="1" strokeDasharray="4 3" />
              <line x1={residualData.x0} y1={residualData.yZero} x2={residualData.x1} y2={residualData.yZero} stroke={palette.axis} strokeWidth="1" />

              <text x={residualData.x0 - 6} y={residualData.yPlus2 + 3} textAnchor="end" fill={palette.outlierTrace} fontSize="8.5">+2σ</text>
              <text x={residualData.x0 - 6} y={residualData.yZero + 3} textAnchor="end" fill={palette.textMuted} fontSize="8.5">0</text>
              <text x={residualData.x0 - 6} y={residualData.yMinus2 + 3} textAnchor="end" fill={palette.outlierTrace} fontSize="8.5">−2σ</text>

              <line x1={residualData.x0} y1={residualData.yTop} x2={residualData.x0} y2={residualData.yBase} stroke={palette.axis} strokeWidth="1" />
              <text x="14" y={(residualData.yTop + residualData.yBase) / 2} textAnchor="middle" fill={palette.textSecondary} fontSize="9" transform={`rotate(-90 14 ${(residualData.yTop + residualData.yBase) / 2})`}>
                Studentized Residual z
              </text>

              {residualData.items.map((it) => {
                const isInspected = it.idx === inspectedIdx;
                const isExcl = Boolean(it.pk.excluded);
                const cOut = Math.abs(it.zC) > 2;
                const gOut = Math.abs(it.zG) > 2;
                return (
                  <g
                    key={it.idx}
                    className="cursor-pointer"
                    opacity={isExcl ? 0.35 : 1}
                    onMouseEnter={() => onHoverPeakIdx(it.idx)}
                    onClick={() => onSelectPeakIdx(it.idx)}
                  >
                    {/* Cauchy z_C stem (left) */}
                    <line x1={it.cx - 6} y1={residualData.yZero} x2={it.cx - 6} y2={it.yC} stroke={cOut ? palette.outlierTrace : palette.cauchyTrace} strokeWidth={isInspected ? 2 : 1.4} />
                    <circle cx={it.cx - 6} cy={it.yC} r={isInspected ? 4.2 : 3.2} fill={cOut ? palette.outlierTrace : palette.cauchyTrace} />

                    {/* Gaussian z_G stem (right) */}
                    <line x1={it.cx + 6} y1={residualData.yZero} x2={it.cx + 6} y2={it.yG} stroke={gOut ? palette.outlierTrace : palette.gaussTrace} strokeWidth={isInspected ? 2 : 1.4} />
                    <rect x={it.cx + 3} y={it.yG - 3} width="6" height="6" fill={gOut ? palette.outlierTrace : palette.gaussTrace} />

                    <text x={it.cx} y={residualData.yBase + 13} textAnchor="middle" fill={isInspected ? palette.textPrimary : palette.textMuted} fontSize="8.5" fontWeight={isInspected ? 'bold' : 'normal'}>
                      {it.label}
                    </text>
                    <text x={it.cx} y={residualData.yBase + 24} textAnchor="middle" fill={palette.textMuted} fontSize="7.5">
                      {it.pk.twoTheta.toFixed(1)}°
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* Unified 5-Column Hairline-Divided Bottom Reflection Metrology Strip */}
      {activePoint && (
        <div
          className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x border-t font-mono text-xs tabular-nums"
          style={{
            backgroundColor: palette.insetBg,
            borderColor: palette.border,
          }}
        >
          <div className="px-3 py-2" style={{ borderColor: palette.border }}>
            <div className="text-[10px]" style={{ color: palette.textMuted }}>
              Position &amp; d_hkl
            </div>
            <div className="font-semibold" style={{ color: palette.textPrimary }}>
              {activePoint.twoTheta.toFixed(2)}°
            </div>
            <div className="text-[10px]" style={{ color: palette.textSecondary }}>
              d = {convertLength(activePoint.dSpacingAngstrom || 0, lengthUnit).toFixed(3)} {lengthUnit}
            </div>
          </div>

          <div className="px-3 py-2" style={{ borderColor: palette.border }}>
            <div className="text-[10px]" style={{ color: palette.textMuted }}>
              Voigt Mixing η / φ
            </div>
            <div className="font-semibold" style={{ color: palette.voigtTrace }}>
              η = {(activePoint.etaObs ?? 0.5).toFixed(2)}
            </div>
            <div className="text-[10px]" style={{ color: palette.textSecondary }}>
              φ = {(activePoint.shapeFactorPhi ?? 0.75).toFixed(4)}
            </div>
          </div>

          <div className="px-3 py-2" style={{ borderColor: palette.border }}>
            <div className="text-[10px]" style={{ color: palette.textMuted }}>
              Cauchy β_C*
            </div>
            <div className="font-semibold" style={{ color: palette.cauchyTrace }}>
              {activePoint.betaCStar.toFixed(4)} nm⁻¹
            </div>
            <div className="text-[10px]" style={{ color: palette.textSecondary }}>
              z_C = {(activePoint.cauchyStdResidual ?? 0).toFixed(2)}
            </div>
          </div>

          <div className="px-3 py-2" style={{ borderColor: palette.border }}>
            <div className="text-[10px]" style={{ color: palette.textMuted }}>
              Gaussian β_G*
            </div>
            <div className="font-semibold" style={{ color: palette.gaussTrace }}>
              {activePoint.betaGStar.toFixed(4)} nm⁻¹
            </div>
            <div className="text-[10px]" style={{ color: palette.textSecondary }}>
              z_G = {(activePoint.gaussianStdResidual ?? 0).toFixed(2)}
            </div>
          </div>

          <div className="px-3 py-2 flex items-center justify-between gap-2 col-span-2 sm:col-span-1" style={{ borderColor: palette.border }}>
            <div>
              <div className="text-[10px]" style={{ color: palette.textMuted }}>
                Single D_V
              </div>
              <div className="font-semibold" style={{ color: palette.sizeTrace }}>
                {convertLength((activePoint.singleDvNm || 0) * 10, lengthUnit).toFixed(1)} {lengthUnit}
              </div>
              <div className="text-[10px]" style={{ color: activePoint.excluded ? palette.excluded : activePoint.isOutlier ? palette.outlierTrace : palette.sizeTrace }}>
                {activePoint.excluded ? 'Excluded' : activePoint.isOutlier ? 'Outlier' : 'Active'}
              </div>
            </div>

            {onToggleExcludePeak && (
              <button
                type="button"
                onClick={() => onToggleExcludePeak(activePoint.index ?? inspectedIdx)}
                title={activePoint.excluded ? 'Include reflection in regression' : 'Exclude reflection from regression'}
                className="p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0"
                style={{
                  backgroundColor: palette.shellBg,
                  borderColor: palette.border,
                  color: activePoint.excluded ? palette.textMuted : palette.textPrimary,
                }}
              >
                {activePoint.excluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
