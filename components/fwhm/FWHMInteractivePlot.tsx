import React, { useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  Download,
  Image as ImageIcon,
  Layers,
  Plus,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  ZoomIn,
} from 'lucide-react';
import {
  EvaluatedCurvePoint,
  EvaluatedPeakMetrics,
  FitStatistics,
  ProfileModelType,
  ResidualSpikeCandidate,
  computeDSpacingA,
} from '../../utils/fwhmProfileEngine';

export type PlotInteractionMode = 'zoom' | 'add_peak' | 'caliper';
export type YScaleMode = 'linear' | 'sqrt' | 'log';
export type SubPlotMode = 'residuals' | 'derivative' | 'none';

export interface FWHMPlotOverlays {
  showComponents: boolean;
  showBackground: boolean;
  showFwhmCaliper: boolean;
  showFwtmCaliper: boolean;
  showIntegralBox: boolean;
  showKa2Trace: boolean;
  showRachinger: boolean;
  netIntensity: boolean;
  yScale: YScaleMode;
  subPlot: SubPlotMode;
}

interface FWHMInteractivePlotProps {
  points: EvaluatedCurvePoint[];
  peakMetrics: EvaluatedPeakMetrics[];
  stats: FitStatistics;
  model: ProfileModelType;
  wavelengthA: number;
  selectedPeakId: string | null;
  onSelectPeak: (id: string) => void;
  onAddPeakAt: (twoTheta: number, netIntensity: number) => void;
  overlays: FWHMPlotOverlays;
  onUpdateOverlays: (patch: Partial<FWHMPlotOverlays>) => void;
  datasetName: string;
  residualSpike?: ResidualSpikeCandidate | null;
  activeFitWindow?: [number, number] | null;
  onSetFitWindow?: (win: [number, number] | null) => void;
}

const VIEW_W = 940;
const MAIN_H = 386;
const BRAGG_RAIL_H = 22;
const SUB_H = 132;
const PAD = { top: 24, right: 24, bottom: 26, left: 66 };

function transformY(val: number, mode: YScaleMode): number {
  const safe = Math.max(0, val);
  if (mode === 'sqrt') return Math.sqrt(safe);
  if (mode === 'log') return Math.log10(safe + 1);
  return safe;
}

function niceTicks(minVal: number, maxVal: number, count = 5): number[] {
  const span = maxVal - minVal;
  if (!Number.isFinite(span) || span <= 0) return [minVal];
  const rawStep = span / Math.max(2, count);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = norm <= 1 ? mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
  const start = Math.ceil(minVal / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= maxVal + step * 1e-6; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

function findNearestIndex(points: EvaluatedCurvePoint[], xTarget: number): number {
  const n = points.length;
  if (n === 0) return -1;
  if (xTarget <= points[0].x) return 0;
  if (xTarget >= points[n - 1].x) return n - 1;
  let lo = 0;
  let hi = n - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].x <= xTarget) lo = mid;
    else hi = mid;
  }
  return Math.abs(points[lo].x - xTarget) <= Math.abs(points[hi].x - xTarget) ? lo : hi;
}

export const FWHMInteractivePlot: React.FC<FWHMInteractivePlotProps> = ({
  points,
  peakMetrics,
  stats,
  model,
  wavelengthA,
  selectedPeakId,
  onSelectPeak,
  onAddPeakAt,
  overlays,
  onUpdateOverlays,
  datasetName,
  residualSpike = null,
  activeFitWindow = null,
  onSetFitWindow,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [interactionMode, setInteractionMode] = useState<PlotInteractionMode>('zoom');
  const [zoomWindow, setZoomWindow] = useState<[number, number] | null>(null);
  const [brushStart, setBrushStart] = useState<number | null>(null);
  const [brushCurrent, setBrushCurrent] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverPlotCoords, setHoverPlotCoords] = useState<{ xDeg: number; yVal: number } | null>(null);
  const [caliperA, setCaliperA] = useState<number | null>(null);
  const [caliperB, setCaliperB] = useState<number | null>(null);

  const visiblePoints = useMemo(() => {
    if (points.length === 0) return [];
    if (!zoomWindow) return points;
    const [zMin, zMax] = zoomWindow;
    const filtered = points.filter((p) => p.x >= zMin && p.x <= zMax);
    return filtered.length >= 3 ? filtered : points;
  }, [points, zoomWindow]);

  const xMin = visiblePoints.length > 0 ? visiblePoints[0].x : 20;
  const xMax = visiblePoints.length > 0 ? visiblePoints[visiblePoints.length - 1].x : 40;
  const plotW = VIEW_W - PAD.left - PAD.right;
  const mainPlotH = MAIN_H - PAD.top - PAD.bottom;
  const mainBottom = MAIN_H - PAD.bottom;
  const braggRailTop = mainBottom + 4;
  const braggRailMid = braggRailTop + BRAGG_RAIL_H / 2;

  const { yMaxTrans, yMinTrans, yMaxRaw } = useMemo(() => {
    if (visiblePoints.length === 0) return { yMaxTrans: 100, yMinTrans: 0, yMaxRaw: 100 };
    let maxRaw = 1;
    for (const pt of visiblePoints) {
      const obs = overlays.netIntensity ? Math.max(0, pt.yNetObs) : pt.yObs;
      const calc = overlays.netIntensity ? Math.max(0, pt.yNetCalc) : pt.yCalc;
      if (obs > maxRaw) maxRaw = obs;
      if (calc > maxRaw) maxRaw = calc;
    }
    const paddedRaw = maxRaw * 1.12;
    return {
      yMaxRaw: paddedRaw,
      yMinTrans: 0,
      yMaxTrans: Math.max(1e-3, transformY(paddedRaw, overlays.yScale)),
    };
  }, [visiblePoints, overlays.netIntensity, overlays.yScale]);

  const xToSvg = (x: number) => PAD.left + ((x - xMin) / Math.max(1e-6, xMax - xMin)) * plotW;
  const svgToX = (sx: number) => xMin + ((sx - PAD.left) / Math.max(1, plotW)) * (xMax - xMin);

  const yToSvg = (rawY: number) => {
    const ty = transformY(rawY, overlays.yScale);
    const frac = (ty - yMinTrans) / Math.max(1e-6, yMaxTrans - yMinTrans);
    return PAD.top + mainPlotH * (1 - Math.max(0, Math.min(1.05, frac)));
  };

  const svgToRawY = (sy: number) => {
    const frac = Math.max(0, Math.min(1, 1 - (sy - PAD.top) / Math.max(1, mainPlotH)));
    const ty = yMinTrans + frac * (yMaxTrans - yMinTrans);
    if (overlays.yScale === 'sqrt') return ty * ty;
    if (overlays.yScale === 'log') return Math.max(0, Math.pow(10, ty) - 1);
    return ty;
  };

  const xTicks = useMemo(() => niceTicks(xMin, xMax, 7), [xMin, xMax]);
  const yTicks = useMemo(() => {
    if (overlays.yScale === 'linear' || overlays.yScale === 'sqrt') {
      return niceTicks(0, yMaxRaw, 5).map((v) => ({
        raw: v,
        label: v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`,
      }));
    }
    const maxPow = Math.max(1, Math.ceil(Math.log10(yMaxRaw + 1)));
    const ticks: { raw: number; label: string }[] = [];
    for (let p = 0; p <= maxPow; p++) {
      const raw = Math.pow(10, p);
      if (raw <= yMaxRaw * 1.15) ticks.push({ raw, label: `10^${p}` });
    }
    return ticks;
  }, [yMaxRaw, overlays.yScale]);

  // SVG Paths for main plot
  const obsPath = useMemo(() => {
    if (visiblePoints.length === 0) return '';
    return visiblePoints
      .map((pt, i) => {
        const y = overlays.netIntensity ? pt.yNetObs : pt.yObs;
        return `${i === 0 ? 'M' : 'L'}${xToSvg(pt.x).toFixed(2)},${yToSvg(y).toFixed(2)}`;
      })
      .join(' ');
  }, [visiblePoints, overlays.netIntensity, overlays.yScale, xMin, xMax, yMaxTrans]);

  const calcPath = useMemo(() => {
    if (visiblePoints.length === 0) return '';
    return visiblePoints
      .map((pt, i) => {
        const y = overlays.netIntensity ? pt.yNetCalc : pt.yCalc;
        return `${i === 0 ? 'M' : 'L'}${xToSvg(pt.x).toFixed(2)},${yToSvg(y).toFixed(2)}`;
      })
      .join(' ');
  }, [visiblePoints, overlays.netIntensity, overlays.yScale, xMin, xMax, yMaxTrans]);

  const bgPath = useMemo(() => {
    if (visiblePoints.length === 0 || overlays.netIntensity) return '';
    return visiblePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'}${xToSvg(pt.x).toFixed(2)},${yToSvg(pt.yBg).toFixed(2)}`)
      .join(' ');
  }, [visiblePoints, overlays.netIntensity, overlays.yScale, xMin, xMax, yMaxTrans]);

  const rachingerPath = useMemo(() => {
    if (!overlays.showRachinger || visiblePoints.length === 0) return '';
    return visiblePoints
      .map((pt, i) => {
        const y = overlays.netIntensity ? Math.max(0, pt.yRachinger - pt.yBg) : pt.yRachinger;
        return `${i === 0 ? 'M' : 'L'}${xToSvg(pt.x).toFixed(2)},${yToSvg(y).toFixed(2)}`;
      })
      .join(' ');
  }, [visiblePoints, overlays.showRachinger, overlays.netIntensity, overlays.yScale, xMin, xMax, yMaxTrans]);

  const ka2Path = useMemo(() => {
    if (!overlays.showKa2Trace || visiblePoints.length === 0) return '';
    return visiblePoints
      .map((pt, i) => {
        const y = overlays.netIntensity ? pt.yKa2Total : pt.yBg + pt.yKa2Total;
        return `${i === 0 ? 'M' : 'L'}${xToSvg(pt.x).toFixed(2)},${yToSvg(y).toFixed(2)}`;
      })
      .join(' ');
  }, [visiblePoints, overlays.showKa2Trace, overlays.netIntensity, overlays.yScale, xMin, xMax, yMaxTrans]);

  const componentPaths = useMemo(() => {
    if (!overlays.showComponents || visiblePoints.length === 0) return [];
    return peakMetrics
      .filter((m) => m.peak.enabled)
      .map((m) => {
        const topPts = visiblePoints.map((pt) => {
          const base = overlays.netIntensity ? 0 : pt.yBg;
          const val = base + (pt.peakValues[m.peak.id] || 0);
          return `${xToSvg(pt.x).toFixed(2)},${yToSvg(val).toFixed(2)}`;
        });
        const basePts = [...visiblePoints]
          .reverse()
          .map((pt) => {
            const base = overlays.netIntensity ? 0 : pt.yBg;
            return `${xToSvg(pt.x).toFixed(2)},${yToSvg(base).toFixed(2)}`;
          });
        return {
          id: m.peak.id,
          color: m.peak.color,
          label: m.peak.label,
          strokePath: `M${topPts.join(' L')}`,
          fillPath: `M${topPts.join(' L')} L${basePts.join(' L')} Z`,
        };
      });
  }, [peakMetrics, visiblePoints, overlays.showComponents, overlays.netIntensity, overlays.yScale, xMin, xMax, yMaxTrans]);

  // Active peak for geometric calipers (FWHM, FWTM, Integral Breadth box)
  const activeCaliperMetric = useMemo(() => {
    const enabled = peakMetrics.filter((m) => m.peak.enabled);
    if (enabled.length === 0) return null;
    if (selectedPeakId) {
      const found = enabled.find((m) => m.peak.id === selectedPeakId);
      if (found) return found;
    }
    return enabled.reduce((best, cur) => (cur.peak.amplitude > best.peak.amplitude ? cur : best), enabled[0]);
  }, [peakMetrics, selectedPeakId]);

  const caliperGeometry = useMemo(() => {
    if (!activeCaliperMetric || visiblePoints.length === 0) return null;
    const pk = activeCaliperMetric.peak;
    if (pk.center < xMin || pk.center > xMax) return null;
    const nearestIdx = findNearestIndex(visiblePoints, pk.center);
    const bgAtCenter = overlays.netIntensity ? 0 : visiblePoints[nearestIdx]?.yBg ?? 0;
    const yApex = bgAtCenter + pk.amplitude;
    const yHalf = bgAtCenter + pk.amplitude * 0.5;
    const yTenth = bgAtCenter + pk.amplitude * 0.1;

    return {
      xCenter: xToSvg(pk.center),
      yBase: yToSvg(bgAtCenter),
      yApex: yToSvg(yApex),
      yHalf: yToSvg(yHalf),
      xHalfLeft: xToSvg(pk.center - activeCaliperMetric.hwhmLeft),
      xHalfRight: xToSvg(pk.center + activeCaliperMetric.hwhmRight),
      yTenth: yToSvg(yTenth),
      xTenthLeft: xToSvg(pk.center - activeCaliperMetric.fwtmLeft),
      xTenthRight: xToSvg(pk.center + activeCaliperMetric.fwtmRight),
      xIbLeft: xToSvg(pk.center - activeCaliperMetric.integralBreadthDeg * 0.5),
      xIbRight: xToSvg(pk.center + activeCaliperMetric.integralBreadthDeg * 0.5),
      metric: activeCaliperMetric,
    };
  }, [activeCaliperMetric, visiblePoints, overlays.netIntensity, overlays.yScale, xMin, xMax, yMaxTrans]);

  // Synchronized Subplot (Residuals or Negative 2nd Derivative)
  const subPlotData = useMemo(() => {
    if (overlays.subPlot === 'none' || visiblePoints.length < 3) return null;
    const subTop = braggRailTop + BRAGG_RAIL_H + 16;
    const subPlotH = SUB_H - 42;

    if (overlays.subPlot === 'residuals') {
      let maxAbs = 1;
      for (const pt of visiblePoints) {
        const a = Math.max(Math.abs(pt.residual), 2 * pt.sigma);
        if (a > maxAbs) maxAbs = a;
      }
      maxAbs *= 1.15;
      const ySub = (v: number) => subTop + subPlotH * (0.5 - v / (2 * maxAbs));
      const resPath = visiblePoints
        .map((pt, i) => `${i === 0 ? 'M' : 'L'}${xToSvg(pt.x).toFixed(2)},${ySub(pt.residual).toFixed(2)}`)
        .join(' ');
      const bandTop = visiblePoints.map((pt) => `${xToSvg(pt.x).toFixed(2)},${ySub(2 * pt.sigma).toFixed(2)}`);
      const bandBot = [...visiblePoints]
        .reverse()
        .map((pt) => `${xToSvg(pt.x).toFixed(2)},${ySub(-2 * pt.sigma).toFixed(2)}`);
      const bandPath = `M${bandTop.join(' L')} L${bandBot.join(' L')} Z`;
      return {
        subTop,
        subPlotH,
        yZero: ySub(0),
        maxAbs,
        primaryPath: resPath,
        bandPath,
        label: 'Difference Curve (I_obs − I_calc)  ·  shaded ±2σ counting statistics band',
      };
    }

    let maxAbs = 1;
    for (const pt of visiblePoints) {
      const a = Math.abs(-pt.d2);
      if (a > maxAbs) maxAbs = a;
    }
    maxAbs *= 1.15;
    const ySub = (v: number) => subTop + subPlotH * (0.5 - v / (2 * maxAbs));
    const derivPath = visiblePoints
      .map((pt, i) => `${i === 0 ? 'M' : 'L'}${xToSvg(pt.x).toFixed(2)},${ySub(-pt.d2).toFixed(2)}`)
      .join(' ');
    return {
      subTop,
      subPlotH,
      yZero: ySub(0),
      maxAbs,
      primaryPath: derivPath,
      bandPath: '',
      label: 'Shoulder Finder (−d²I/d2θ²)  ·  positive maxima reveal unresolved overlapping peaks',
    };
  }, [overlays.subPlot, visiblePoints, xMin, xMax, braggRailTop]);

  const totalSvgH =
    overlays.subPlot === 'none'
      ? braggRailTop + BRAGG_RAIL_H + 34
      : braggRailTop + BRAGG_RAIL_H + SUB_H + 14;

  // Pointer interaction handlers
  const getSvgCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const sy = ((e.clientY - rect.top) / rect.height) * totalSvgH;
    return { sx, sy };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSvgCoords(e);
    if (!coords) return;
    const { sx, sy } = coords;
    if (sx < PAD.left || sx > VIEW_W - PAD.right || sy < PAD.top || sy > totalSvgH - 18) {
      setHoverIdx(null);
      setHoverPlotCoords(null);
      return;
    }
    const xDeg = svgToX(sx);
    const idx = findNearestIndex(visiblePoints, xDeg);
    setHoverIdx(idx >= 0 ? idx : null);
    if (sy <= mainBottom) {
      setHoverPlotCoords({ xDeg, yVal: svgToRawY(sy) });
    }
    if (brushStart !== null && interactionMode === 'zoom') {
      setBrushCurrent(Math.max(xMin, Math.min(xMax, xDeg)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSvgCoords(e);
    if (!coords) return;
    const { sx, sy } = coords;
    if (sx < PAD.left || sx > VIEW_W - PAD.right || sy < PAD.top || sy > mainBottom) return;

    const xDeg = svgToX(sx);
    if (interactionMode === 'add_peak') {
      const clickedY = svgToRawY(sy);
      const nearest = visiblePoints[findNearestIndex(visiblePoints, xDeg)];
      const bg = overlays.netIntensity ? 0 : nearest?.yBg ?? 0;
      const netHeight = Math.max(25, clickedY - bg);
      onAddPeakAt(Number(xDeg.toFixed(4)), Math.round(netHeight));
      setInteractionMode('zoom');
      return;
    }

    if (interactionMode === 'caliper') {
      if (caliperA === null || (caliperA !== null && caliperB !== null)) {
        setCaliperA(xDeg);
        setCaliperB(null);
      } else {
        setCaliperB(xDeg);
      }
      return;
    }

    setBrushStart(xDeg);
    setBrushCurrent(xDeg);
  };

  const handleMouseUp = () => {
    if (brushStart !== null && brushCurrent !== null && interactionMode === 'zoom') {
      const a = Math.min(brushStart, brushCurrent);
      const b = Math.max(brushStart, brushCurrent);
      if (b - a > Math.max(0.04, (xMax - xMin) * 0.02)) {
        setZoomWindow([a, b]);
      }
    }
    setBrushStart(null);
    setBrushCurrent(null);
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_fwhm_fit.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2.5;
      const canvas = document.createElement('canvas');
      canvas.width = VIEW_W * scale;
      canvas.height = totalSvgH * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#090d16' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${datasetName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_fwhm_fit.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const hoveredPoint = hoverIdx !== null ? visiblePoints[hoverIdx] : null;
  const showObsMarkers = visiblePoints.length <= 420;

  const caliperDelta =
    caliperA !== null && caliperB !== null
      ? {
          delta2T: Math.abs(caliperB - caliperA),
          dA: computeDSpacingA(caliperA, wavelengthA),
          dB: computeDSpacingA(caliperB, wavelengthA),
        }
      : null;

  // Compute safe callout x-position for FWHM badge so it never clips outside plot frame
  const fwhmCalloutPos = useMemo(() => {
    if (!caliperGeometry) return null;
    const labelW = 122;
    const preferRight = caliperGeometry.xHalfRight + 8;
    const preferLeft = caliperGeometry.xHalfLeft - labelW - 8;
    let bx = preferRight;
    if (bx + labelW > VIEW_W - PAD.right - 4) {
      bx = Math.max(PAD.left + 6, preferLeft);
    }
    const by = Math.max(PAD.top + 6, Math.min(mainBottom - 22, caliperGeometry.yHalf - 10));
    return { x: bx, y: by, w: labelW };
  }, [caliperGeometry, mainBottom]);

  // Quick-toggle overlay definitions placed directly below canvas
  const quickLayers: { key: keyof FWHMPlotOverlays; label: string }[] = [
    { key: 'showComponents', label: 'Peaks' },
    { key: 'showBackground', label: 'Background' },
    { key: 'showFwhmCaliper', label: 'FWHM' },
    { key: 'showFwtmCaliper', label: 'FWTM' },
    { key: 'showIntegralBox', label: 'β_I Box' },
    { key: 'showKa2Trace', label: 'Kα₂' },
    { key: 'showRachinger', label: 'Rachinger' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Top Instrument Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
        {/* Interaction Tool Selector */}
        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setInteractionMode('zoom');
              setCaliperA(null);
              setCaliperB(null);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              interactionMode === 'zoom'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            Zoom
          </button>
          <button
            type="button"
            onClick={() => setInteractionMode('add_peak')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              interactionMode === 'add_peak'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Place Peak
          </button>
          <button
            type="button"
            onClick={() => {
              setInteractionMode('caliper');
              setCaliperA(null);
              setCaliperB(null);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              interactionMode === 'caliper'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Caliper
          </button>
        </div>

        {/* Scale, Window, Subplot & Figure Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {zoomWindow && (
            <div className="flex items-center gap-1.5">
              {onSetFitWindow && (
                <button
                  type="button"
                  onClick={() => {
                    onSetFitWindow([Number(zoomWindow[0].toFixed(3)), Number(zoomWindow[1].toFixed(3))]);
                    setZoomWindow(null);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0"
                >
                  Fit Region
                </button>
              )}
              <button
                type="button"
                onClick={() => setZoomWindow(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Zoom
              </button>
            </div>
          )}
          {!zoomWindow && activeFitWindow && onSetFitWindow && (
            <button
              type="button"
              onClick={() => onSetFitWindow(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              Full Scan
            </button>
          )}

          <div className="flex items-center gap-0.5 bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            {(['linear', 'sqrt', 'log'] as YScaleMode[]).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => onUpdateOverlays({ yScale: sc })}
                className={`px-2 py-1 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  overlays.yScale === sc
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {sc === 'linear' ? 'Lin' : sc === 'sqrt' ? '√I' : 'Log'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onUpdateOverlays({ netIntensity: !overlays.netIntensity })}
            title="Subtract fitted polynomial background from display"
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              overlays.netIntensity
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            Net I
          </button>

          <div className="flex items-center gap-0.5 bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            {(
              [
                { id: 'residuals', label: 'Residuals' },
                { id: 'derivative', label: '−d²I' },
                { id: 'none', label: 'Off' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateOverlays({ subPlot: opt.id })}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  overlays.subPlot === opt.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              type="button"
              onClick={handleDownloadSVG}
              title="Download publication-ready vector SVG"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              SVG
            </button>
            <button
              type="button"
              onClick={handleDownloadPNG}
              title="Download high-DPI PNG image"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              PNG
            </button>
          </div>
        </div>
      </div>

      {/* Live Crosshair & Caliper Coordinate Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 min-h-[34px]">
        {interactionMode === 'add_peak' ? (
          <span className="text-blue-700 dark:text-sky-400 font-sans font-medium">
            Click anywhere inside the diffractogram to place a new {model} peak at that (2θ, Intensity) coordinate.
          </span>
        ) : caliperDelta ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-amber-700 dark:text-amber-300">
            <span>
              Δ2θ = <strong>{caliperDelta.delta2T.toFixed(4)}°</strong>
            </span>
            <span>
              d₁ = {caliperDelta.dA.toFixed(4)} Å · d₂ = {caliperDelta.dB.toFixed(4)} Å
            </span>
            <span>
              |Δd| = <strong>{Math.abs(caliperDelta.dA - caliperDelta.dB).toFixed(4)} Å</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setCaliperA(null);
                setCaliperB(null);
              }}
              className="underline text-xs font-sans text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Clear
            </button>
          </div>
        ) : hoveredPoint ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              2θ <strong className="text-slate-900 dark:text-white">{hoveredPoint.x.toFixed(3)}°</strong>
            </span>
            <span>
              d <strong className="text-slate-800 dark:text-slate-200">{hoveredPoint.dSpacing.toFixed(4)} Å</strong>
            </span>
            <span>
              Q <strong className="text-slate-800 dark:text-slate-200">{hoveredPoint.qValue.toFixed(3)} Å⁻¹</strong>
            </span>
            <span>
              I_obs <strong className="text-slate-800 dark:text-slate-200">{hoveredPoint.yObs.toFixed(1)}</strong>
            </span>
            <span className="text-blue-700 dark:text-sky-400">
              I_calc <strong>{hoveredPoint.yCalc.toFixed(1)}</strong>
            </span>
            <span
              className={
                Math.abs(hoveredPoint.residual) > 2.5 * hoveredPoint.sigma
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : 'text-emerald-700 dark:text-emerald-400'
              }
            >
              Δ {hoveredPoint.residual >= 0 ? '+' : ''}
              {hoveredPoint.residual.toFixed(1)} (
              {(hoveredPoint.residual / Math.max(1e-6, hoveredPoint.sigma)).toFixed(1)}σ)
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 font-sans">
            <span className="inline-flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              Hover to inspect · Drag horizontally to zoom · Click Bragg ticks to select peak
            </span>
          </div>
        )}

        {/* Crisp Publication Legend */}
        <div className="flex items-center gap-3.5 text-[11px] font-sans text-slate-500 dark:text-slate-400 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-slate-700 dark:border-slate-300 inline-block" />
            Observed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-blue-600 dark:bg-sky-400 inline-block" />
            Total Fit
          </span>
          {overlays.showBackground && !overlays.netIntensity && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0 border-t border-dashed border-slate-500 inline-block" />
              Background
            </span>
          )}
        </div>
      </div>

      {/* Main SVG Diffractogram Stage */}
      <div className="relative w-full select-none bg-white dark:bg-[#090d16]">
        {/* Floating Mini Corner Fit Readout when hovering */}
        {hoveredPoint && interactionMode !== 'add_peak' && (
          <div className="pointer-events-none hidden sm:flex flex-col gap-0.5 absolute top-3 right-8 z-10 px-2.5 py-1.5 rounded-md bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-xs text-[10.5px] font-mono tabular-nums text-slate-700 dark:text-slate-200">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">2θ / d</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {hoveredPoint.x.toFixed(3)}° · {hoveredPoint.dSpacing.toFixed(4)} Å
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Obs / Calc</span>
              <span>
                {hoveredPoint.yObs.toFixed(0)} /{' '}
                <strong className="text-blue-600 dark:text-sky-400">{hoveredPoint.yCalc.toFixed(0)}</strong>
              </span>
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${totalSvgH}`}
          className="w-full h-auto block cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoverIdx(null);
            setHoverPlotCoords(null);
            setBrushStart(null);
            setBrushCurrent(null);
          }}
        >
          <defs>
            <clipPath id="fwhm-main-clip">
              <rect x={PAD.left} y={PAD.top} width={plotW} height={mainPlotH} />
            </clipPath>
            {subPlotData && (
              <clipPath id="fwhm-sub-clip">
                <rect x={PAD.left} y={subPlotData.subTop} width={plotW} height={subPlotData.subPlotH} />
              </clipPath>
            )}
            {componentPaths.map((comp) => (
              <linearGradient
                key={`grad-${comp.id}`}
                id={`fwhm-peak-grad-${comp.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={comp.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={comp.color} stopOpacity={0.03} />
              </linearGradient>
            ))}
          </defs>

          {/* Subtle Precision Gridlines & Publication Inward Ticks */}
          {xTicks.map((t) => {
            const sx = xToSvg(t);
            return (
              <g key={`xg-${t}`}>
                <line
                  x1={sx}
                  y1={PAD.top}
                  x2={sx}
                  y2={mainBottom}
                  className="stroke-slate-200/75 dark:stroke-slate-800/75"
                  strokeWidth={0.9}
                />
                {/* Publication inward top & bottom ticks */}
                <line
                  x1={sx}
                  y1={PAD.top}
                  x2={sx}
                  y2={PAD.top + 5}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth={1}
                />
                <line
                  x1={sx}
                  y1={mainBottom}
                  x2={sx}
                  y2={mainBottom - 5}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth={1}
                />
                {subPlotData && (
                  <line
                    x1={sx}
                    y1={subPlotData.subTop}
                    x2={sx}
                    y2={subPlotData.subTop + subPlotData.subPlotH}
                    className="stroke-slate-200/55 dark:stroke-slate-800/60"
                    strokeWidth={0.9}
                  />
                )}
              </g>
            );
          })}
          {yTicks.map((t, i) => {
            const sy = yToSvg(t.raw);
            return (
              <g key={`yg-${i}`}>
                <line
                  x1={PAD.left}
                  y1={sy}
                  x2={VIEW_W - PAD.right}
                  y2={sy}
                  className="stroke-slate-200/75 dark:stroke-slate-800/75"
                  strokeWidth={0.9}
                />
                <line
                  x1={PAD.left}
                  y1={sy}
                  x2={PAD.left + 5}
                  y2={sy}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth={1}
                />
                <line
                  x1={VIEW_W - PAD.right}
                  y1={sy}
                  x2={VIEW_W - PAD.right - 5}
                  y2={sy}
                  className="stroke-slate-400 dark:stroke-slate-600"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={sy + 3.5}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* Clipped Main Data Layers */}
          <g clipPath="url(#fwhm-main-clip)">
            {/* Integral Breadth Equivalent-Area Box */}
            {overlays.showIntegralBox && caliperGeometry && (
              <rect
                x={caliperGeometry.xIbLeft}
                y={caliperGeometry.yApex}
                width={Math.max(1, caliperGeometry.xIbRight - caliperGeometry.xIbLeft)}
                height={Math.max(0, caliperGeometry.yBase - caliperGeometry.yApex)}
                fill={caliperGeometry.metric.peak.color}
                fillOpacity={0.09}
                stroke={caliperGeometry.metric.peak.color}
                strokeOpacity={0.55}
                strokeDasharray="3 3"
                strokeWidth={1.1}
              />
            )}

            {/* Deconvolved Component Peak Envelopes */}
            {componentPaths.map((comp) => {
              const isSelected = activeCaliperMetric?.peak.id === comp.id;
              return (
                <g key={comp.id}>
                  <path
                    d={comp.fillPath}
                    fill={`url(#fwhm-peak-grad-${comp.id})`}
                    fillOpacity={isSelected ? 1 : 0.65}
                  />
                  <path
                    d={comp.strokePath}
                    fill="none"
                    stroke={comp.color}
                    strokeWidth={isSelected ? 1.85 : 1.25}
                    strokeOpacity={isSelected ? 0.95 : 0.7}
                  />
                </g>
              );
            })}

            {/* Polynomial Background Line */}
            {overlays.showBackground && !overlays.netIntensity && bgPath && (
              <path
                d={bgPath}
                fill="none"
                className="stroke-slate-500 dark:stroke-slate-400"
                strokeWidth={1.25}
                strokeDasharray="5 4"
              />
            )}

            {/* Kα2 Doublet Sub-trace */}
            {overlays.showKa2Trace && ka2Path && (
              <path
                d={ka2Path}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.25}
                strokeDasharray="3 2"
              />
            )}

            {/* Rachinger Stripped Trace */}
            {overlays.showRachinger && rachingerPath && (
              <path
                d={rachingerPath}
                fill="none"
                stroke="#10b981"
                strokeWidth={1.35}
                strokeOpacity={0.88}
              />
            )}

            {/* Observed Experimental Data */}
            {showObsMarkers ? (
              <g>
                <path
                  d={obsPath}
                  fill="none"
                  className="stroke-slate-400/45 dark:stroke-slate-500/35"
                  strokeWidth={0.95}
                />
                {visiblePoints.map((pt, i) => {
                  const y = overlays.netIntensity ? pt.yNetObs : pt.yObs;
                  return (
                    <circle
                      key={i}
                      cx={xToSvg(pt.x)}
                      cy={yToSvg(y)}
                      r={2.1}
                      fill="none"
                      className="stroke-slate-700/85 dark:stroke-slate-300/85"
                      strokeWidth={1.05}
                    />
                  );
                })}
              </g>
            ) : (
              <path
                d={obsPath}
                fill="none"
                className="stroke-slate-700/85 dark:stroke-slate-300/85"
                strokeWidth={1.2}
              />
            )}

            {/* Total Calculated Fit Envelope */}
            {calcPath && (
              <path
                d={calcPath}
                fill="none"
                className="stroke-blue-600 dark:stroke-sky-400"
                strokeWidth={2.25}
              />
            )}

            {/* Geometric FWHM & FWTM Calipers for Active Peak */}
            {caliperGeometry && (
              <g>
                {/* Centroid vertical guide */}
                <line
                  x1={caliperGeometry.xCenter}
                  y1={caliperGeometry.yApex}
                  x2={caliperGeometry.xCenter}
                  y2={caliperGeometry.yBase}
                  stroke={caliperGeometry.metric.peak.color}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  strokeOpacity={0.65}
                />

                {overlays.showFwhmCaliper && fwhmCalloutPos && (
                  <g>
                    <line
                      x1={caliperGeometry.xHalfLeft}
                      y1={caliperGeometry.yHalf}
                      x2={caliperGeometry.xHalfRight}
                      y2={caliperGeometry.yHalf}
                      stroke="#dc2626"
                      strokeWidth={1.85}
                    />
                    {/* Precision T-bar caliper end caps */}
                    <line
                      x1={caliperGeometry.xHalfLeft}
                      y1={caliperGeometry.yHalf - 5}
                      x2={caliperGeometry.xHalfLeft}
                      y2={caliperGeometry.yHalf + 5}
                      stroke="#dc2626"
                      strokeWidth={1.85}
                    />
                    <line
                      x1={caliperGeometry.xHalfRight}
                      y1={caliperGeometry.yHalf - 5}
                      x2={caliperGeometry.xHalfRight}
                      y2={caliperGeometry.yHalf + 5}
                      stroke="#dc2626"
                      strokeWidth={1.85}
                    />
                    <rect
                      x={fwhmCalloutPos.x}
                      y={fwhmCalloutPos.y}
                      width={fwhmCalloutPos.w}
                      height={19}
                      rx={3}
                      className="fill-white/95 dark:fill-slate-900/95 stroke-rose-400/75"
                      strokeWidth={0.9}
                    />
                    <text
                      x={fwhmCalloutPos.x + fwhmCalloutPos.w / 2}
                      y={fwhmCalloutPos.y + 13}
                      textAnchor="middle"
                      className="fill-rose-700 dark:fill-rose-300 text-[10px] font-mono font-semibold"
                    >
                      FWHM {caliperGeometry.metric.fwhmObs.toFixed(3)}°
                    </text>
                  </g>
                )}

                {overlays.showFwtmCaliper && (
                  <g>
                    <line
                      x1={caliperGeometry.xTenthLeft}
                      y1={caliperGeometry.yTenth}
                      x2={caliperGeometry.xTenthRight}
                      y2={caliperGeometry.yTenth}
                      stroke="#d97706"
                      strokeWidth={1.45}
                      strokeDasharray="4 2"
                    />
                    <line
                      x1={caliperGeometry.xTenthLeft}
                      y1={caliperGeometry.yTenth - 4}
                      x2={caliperGeometry.xTenthLeft}
                      y2={caliperGeometry.yTenth + 4}
                      stroke="#d97706"
                      strokeWidth={1.5}
                    />
                    <line
                      x1={caliperGeometry.xTenthRight}
                      y1={caliperGeometry.yTenth - 4}
                      x2={caliperGeometry.xTenthRight}
                      y2={caliperGeometry.yTenth + 4}
                      stroke="#d97706"
                      strokeWidth={1.5}
                    />
                  </g>
                )}
              </g>
            )}

            {/* Clickable Peak Apex Markers & Labels */}
            {peakMetrics
              .filter((m) => m.peak.enabled && m.peak.center >= xMin && m.peak.center <= xMax)
              .map((m) => {
                const idx = findNearestIndex(visiblePoints, m.peak.center);
                const bg = overlays.netIntensity ? 0 : visiblePoints[idx]?.yBg ?? 0;
                const sx = xToSvg(m.peak.center);
                const apexY = yToSvg(bg + m.peak.amplitude);
                const labelY = Math.max(PAD.top + 13, apexY - 9);
                const isSel = activeCaliperMetric?.peak.id === m.peak.id;
                return (
                  <g
                    key={`lbl-${m.peak.id}`}
                    className="cursor-pointer"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectPeak(m.peak.id);
                    }}
                  >
                    {isSel && (
                      <circle
                        cx={sx}
                        cy={apexY}
                        r={6.5}
                        fill={m.peak.color}
                        fillOpacity={0.18}
                        stroke={m.peak.color}
                        strokeWidth={1}
                      />
                    )}
                    <circle cx={sx} cy={apexY} r={isSel ? 3.4 : 2.6} fill={m.peak.color} />
                    <text
                      x={sx}
                      y={labelY}
                      textAnchor="middle"
                      fill={m.peak.color}
                      className="text-[10.5px] font-mono font-semibold"
                    >
                      {m.peak.label}
                    </text>
                  </g>
                );
              })}

            {/* Drag-Zoom Selection Brush */}
            {brushStart !== null && brushCurrent !== null && (
              <rect
                x={xToSvg(Math.min(brushStart, brushCurrent))}
                y={PAD.top}
                width={Math.abs(xToSvg(brushCurrent) - xToSvg(brushStart))}
                height={mainPlotH}
                fill="#2563eb"
                fillOpacity={0.12}
                stroke="#2563eb"
                strokeWidth={1.1}
                strokeDasharray="3 2"
              />
            )}

            {/* 2-Point Caliper Markers */}
            {caliperA !== null && (
              <line
                x1={xToSvg(caliperA)}
                y1={PAD.top}
                x2={xToSvg(caliperA)}
                y2={mainBottom}
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            )}
            {caliperB !== null && (
              <line
                x1={xToSvg(caliperB)}
                y1={PAD.top}
                x2={xToSvg(caliperB)}
                y2={mainBottom}
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            )}

            {/* Add-Peak Preview Crosshair */}
            {interactionMode === 'add_peak' && hoverPlotCoords && (
              <g>
                <line
                  x1={xToSvg(hoverPlotCoords.xDeg)}
                  y1={PAD.top}
                  x2={xToSvg(hoverPlotCoords.xDeg)}
                  y2={mainBottom}
                  stroke="#2563eb"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <line
                  x1={PAD.left}
                  y1={yToSvg(hoverPlotCoords.yVal)}
                  x2={VIEW_W - PAD.right}
                  y2={yToSvg(hoverPlotCoords.yVal)}
                  stroke="#2563eb"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xToSvg(hoverPlotCoords.xDeg)}
                  cy={yToSvg(hoverPlotCoords.yVal)}
                  r={4.5}
                  fill="#2563eb"
                  fillOpacity={0.25}
                  stroke="#2563eb"
                  strokeWidth={1.5}
                />
              </g>
            )}

            {/* Live Hover Crosshair */}
            {hoveredPoint && interactionMode !== 'add_peak' && (
              <g>
                <line
                  x1={xToSvg(hoveredPoint.x)}
                  y1={PAD.top}
                  x2={xToSvg(hoveredPoint.x)}
                  y2={mainBottom}
                  className="stroke-slate-400 dark:stroke-slate-500"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <circle
                  cx={xToSvg(hoveredPoint.x)}
                  cy={yToSvg(overlays.netIntensity ? hoveredPoint.yNetCalc : hoveredPoint.yCalc)}
                  r={3.6}
                  className="fill-blue-600 dark:fill-sky-400 stroke-white dark:stroke-slate-950"
                  strokeWidth={1.5}
                />
              </g>
            )}
          </g>

          {/* Main Frame */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={mainPlotH}
            fill="none"
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth={1.15}
          />

          {/* Y Axis Label */}
          <text
            transform={`translate(17, ${PAD.top + mainPlotH / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-slate-600 dark:fill-slate-300 text-[11px] font-medium"
          >
            {overlays.netIntensity ? 'Net Intensity' : 'Intensity'} (
            {overlays.yScale === 'linear' ? 'cps' : overlays.yScale === 'sqrt' ? '√cps' : 'log₁₀ cps'})
          </text>

          {/* Rietveld / TOPAS Bragg Position Tick Rail */}
          <g>
            <rect
              x={PAD.left}
              y={braggRailTop}
              width={plotW}
              height={BRAGG_RAIL_H}
              className="fill-slate-50/90 dark:fill-slate-900/70 stroke-slate-200 dark:stroke-slate-800"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={braggRailMid + 3.5}
              textAnchor="end"
              className="fill-slate-500 dark:fill-slate-400 text-[9.5px] font-mono"
            >
              Bragg |
            </text>
            {peakMetrics
              .filter((m) => m.peak.enabled && m.peak.center >= xMin && m.peak.center <= xMax)
              .map((m) => {
                const sx = xToSvg(m.peak.center);
                const isSel = activeCaliperMetric?.peak.id === m.peak.id;
                const ka2Sx =
                  overlays.showKa2Trace && m.ka2CenterDeg !== null && m.ka2CenterDeg >= xMin && m.ka2CenterDeg <= xMax
                    ? xToSvg(m.ka2CenterDeg)
                    : null;
                return (
                  <g
                    key={`bragg-${m.peak.id}`}
                    className="cursor-pointer"
                    onClick={() => onSelectPeak(m.peak.id)}
                  >
                    <rect
                      x={sx - 6}
                      y={braggRailTop}
                      width={12}
                      height={BRAGG_RAIL_H}
                      fill="transparent"
                    />
                    <line
                      x1={sx}
                      y1={braggRailTop + 3}
                      x2={sx}
                      y2={braggRailTop + BRAGG_RAIL_H - 3}
                      stroke={m.peak.color}
                      strokeWidth={isSel ? 2.6 : 1.7}
                      strokeLinecap="round"
                    />
                    {ka2Sx !== null && (
                      <line
                        x1={ka2Sx}
                        y1={braggRailTop + 6}
                        x2={ka2Sx}
                        y2={braggRailTop + BRAGG_RAIL_H - 4}
                        stroke="#f59e0b"
                        strokeWidth={1.2}
                        strokeDasharray="2 1"
                      />
                    )}
                  </g>
                );
              })}
            {hoveredPoint && (
              <line
                x1={xToSvg(hoveredPoint.x)}
                y1={braggRailTop}
                x2={xToSvg(hoveredPoint.x)}
                y2={braggRailTop + BRAGG_RAIL_H}
                className="stroke-slate-400 dark:stroke-slate-500"
                strokeWidth={0.9}
                strokeDasharray="2 2"
              />
            )}
          </g>

          {/* X-Axis Ticks when Subplot is Hidden */}
          {overlays.subPlot === 'none' && (
            <g>
              {xTicks.map((t) => (
                <text
                  key={`xtm-${t}`}
                  x={xToSvg(t)}
                  y={braggRailTop + BRAGG_RAIL_H + 14}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                >
                  {t.toFixed(xMax - xMin < 3 ? 2 : 1)}°
                </text>
              ))}
              <text
                x={PAD.left + plotW / 2}
                y={totalSvgH - 4}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[11px] font-medium"
              >
                Diffraction Angle 2θ (deg) · λ = {wavelengthA.toFixed(4)} Å
              </text>
            </g>
          )}

          {/* Synchronized Bottom Subplot (Residuals / −d²I) */}
          {subPlotData && (
            <g>
              <text
                x={PAD.left + 4}
                y={subPlotData.subTop - 5}
                className="fill-slate-500 dark:fill-slate-400 text-[9.5px] font-mono"
              >
                {subPlotData.label}
              </text>

              <g clipPath="url(#fwhm-sub-clip)">
                {subPlotData.bandPath && (
                  <path
                    d={subPlotData.bandPath}
                    className="fill-emerald-500/12 dark:fill-emerald-400/12"
                  />
                )}
                <line
                  x1={PAD.left}
                  y1={subPlotData.yZero}
                  x2={VIEW_W - PAD.right}
                  y2={subPlotData.yZero}
                  className="stroke-slate-300 dark:stroke-slate-700"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <path
                  d={subPlotData.primaryPath}
                  fill="none"
                  stroke={overlays.subPlot === 'residuals' ? '#0891b2' : '#7c3aed'}
                  strokeWidth={1.35}
                />
                {/* Unmodeled positive residual spike callout */}
                {overlays.subPlot === 'residuals' &&
                  residualSpike &&
                  residualSpike.zScore >= 3.8 &&
                  residualSpike.twoTheta >= xMin &&
                  residualSpike.twoTheta <= xMax && (
                    <g>
                      <line
                        x1={xToSvg(residualSpike.twoTheta)}
                        y1={subPlotData.subTop}
                        x2={xToSvg(residualSpike.twoTheta)}
                        y2={subPlotData.subTop + subPlotData.subPlotH}
                        stroke="#e11d48"
                        strokeWidth={1.3}
                        strokeDasharray="3 2"
                      />
                      <circle
                        cx={xToSvg(residualSpike.twoTheta)}
                        cy={subPlotData.subTop + 8}
                        r={3.2}
                        fill="#e11d48"
                      />
                    </g>
                  )}
                {hoveredPoint && (
                  <line
                    x1={xToSvg(hoveredPoint.x)}
                    y1={subPlotData.subTop}
                    x2={xToSvg(hoveredPoint.x)}
                    y2={subPlotData.subTop + subPlotData.subPlotH}
                    className="stroke-slate-400 dark:stroke-slate-500"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />
                )}
              </g>

              <rect
                x={PAD.left}
                y={subPlotData.subTop}
                width={plotW}
                height={subPlotData.subPlotH}
                fill="none"
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth={1.1}
              />

              {/* Subplot Y Bounds */}
              <text
                x={PAD.left - 8}
                y={subPlotData.subTop + 10}
                textAnchor="end"
                className="fill-slate-500 dark:fill-slate-400 text-[9.5px] font-mono"
              >
                +{subPlotData.maxAbs >= 1000 ? `${(subPlotData.maxAbs / 1000).toFixed(1)}k` : Math.round(subPlotData.maxAbs)}
              </text>
              <text
                x={PAD.left - 8}
                y={subPlotData.yZero + 3}
                textAnchor="end"
                className="fill-slate-500 dark:fill-slate-400 text-[9.5px] font-mono"
              >
                0
              </text>
              <text
                x={PAD.left - 8}
                y={subPlotData.subTop + subPlotData.subPlotH - 3}
                textAnchor="end"
                className="fill-slate-500 dark:fill-slate-400 text-[9.5px] font-mono"
              >
                −{subPlotData.maxAbs >= 1000 ? `${(subPlotData.maxAbs / 1000).toFixed(1)}k` : Math.round(subPlotData.maxAbs)}
              </text>

              {/* Bottom Shared X-Axis Ticks */}
              {xTicks.map((t) => (
                <text
                  key={`xts-${t}`}
                  x={xToSvg(t)}
                  y={subPlotData.subTop + subPlotData.subPlotH + 15}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                >
                  {t.toFixed(xMax - xMin < 3 ? 2 : 1)}°
                </text>
              ))}
              <text
                x={PAD.left + plotW / 2}
                y={totalSvgH - 4}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[11px] font-medium"
              >
                Diffraction Angle 2θ (deg) · λ = {wavelengthA.toFixed(4)} Å · R_wp = {stats.rwp.toFixed(2)}%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Quick Overlay Layer Bar (Instant 1-Click Toggles Right Below Plot) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
            <Layers className="w-3.5 h-3.5" />
            Layers
          </span>
          {quickLayers.map((layer) => {
            const active = Boolean(overlays[layer.key]);
            return (
              <button
                key={layer.key}
                type="button"
                onClick={() => onUpdateOverlays({ [layer.key]: !active })}
                className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 dark:bg-sky-500/20 text-white dark:text-sky-200 border-slate-900 dark:border-sky-500/60'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {layer.label}
              </button>
            );
          })}
        </div>

        {activeCaliperMetric && (
          <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300">
            <SlidersHorizontal className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-sans font-medium text-slate-800 dark:text-slate-200">
              {activeCaliperMetric.peak.label}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span>β {activeCaliperMetric.fwhmObs.toFixed(3)}°</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span>φ {activeCaliperMetric.shapeFactorPhi.toFixed(3)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
