import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  Eye,
  EyeOff,
  Crosshair,
  Image as ImageIcon,
  FileCode2,
  PlusCircle,
} from 'lucide-react';
import {
  CurveSynthesisResult,
  DiffractogramPoint,
  FractionBasis,
  MaterialCrystallinityType,
} from '../../utils/xrdCurveBuilderEngine';

export interface DiffractogramLayerToggles {
  showTotal: boolean;
  showCrystallineArea: boolean;
  showAmorphousArea: boolean;
  showBackground: boolean;
  showPeakLabels: boolean;
  showIntegrationBounds: boolean;
}

interface DiffractogramViewportProps {
  sampleName: string;
  materialType: MaterialCrystallinityType;
  wavelengthA: number;
  fractionBasis: FractionBasis;
  result: CurveSynthesisResult;
  layers: DiffractogramLayerToggles;
  onToggleLayer: (key: keyof DiffractogramLayerToggles) => void;
  placePeakMode: boolean;
  onTogglePlacePeakMode: () => void;
  onPlacePeakAt: (twoTheta: number, intensity: number) => void;
}

const SVG_W = 920;
const SVG_H = 470;
const PAD = { top: 38, right: 28, bottom: 58, left: 74 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

function niceTicks(min: number, max: number, count: number): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const rawStep = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = norm <= 1 ? 1 * mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-6; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

/** Binary search for nearest point index on non-uniform peak-anchored 2θ grid */
function findNearestPointIndex(points: DiffractogramPoint[], target2T: number): number {
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].twoTheta < target2T) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(points[lo - 1].twoTheta - target2T) < Math.abs(points[lo].twoTheta - target2T)) {
    return lo - 1;
  }
  return lo;
}

/** Peak-preserving min/max envelope decimation so narrow sharp Bragg peaks never clip */
function decimatePreservingPeaks(
  points: DiffractogramPoint[],
  maxPoints: number
): DiffractogramPoint[] {
  if (points.length <= maxPoints) return points;
  const bucketCount = Math.max(100, Math.floor(maxPoints / 2));
  const bucketSize = points.length / bucketCount;
  const out: DiffractogramPoint[] = [points[0]];

  for (let b = 0; b < bucketCount; b++) {
    const start = Math.floor(b * bucketSize);
    const end = Math.min(points.length, Math.floor((b + 1) * bucketSize));
    if (start >= end) continue;
    let minIdx = start;
    let maxIdx = start;
    for (let i = start + 1; i < end; i++) {
      if (points[i].total < points[minIdx].total) minIdx = i;
      if (points[i].total > points[maxIdx].total) maxIdx = i;
    }
    if (minIdx === maxIdx) {
      if (out[out.length - 1] !== points[minIdx]) out.push(points[minIdx]);
    } else if (minIdx < maxIdx) {
      if (out[out.length - 1] !== points[minIdx]) out.push(points[minIdx]);
      out.push(points[maxIdx]);
    } else {
      if (out[out.length - 1] !== points[maxIdx]) out.push(points[maxIdx]);
      out.push(points[minIdx]);
    }
  }
  if (out[out.length - 1] !== points[points.length - 1]) {
    out.push(points[points.length - 1]);
  }
  return out;
}

export const DiffractogramViewport: React.FC<DiffractogramViewportProps> = ({
  sampleName,
  materialType,
  wavelengthA,
  fractionBasis,
  result,
  layers,
  onToggleLayer,
  placePeakMode,
  onTogglePlacePeakMode,
  onPlacePeakAt,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [cursorIntensity, setCursorIntensity] = useState<number | null>(null);
  const [exportTheme, setExportTheme] = useState<'paper' | 'dark'>('paper');
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const { points, metrics } = result;

  const {
    xMin,
    xMax,
    yMax,
    xTicks,
    yTicks,
    totalPath,
    bgPath,
    amorphOutlinePath,
    amorphAreaPath,
    crystAreaPath,
    intXStart,
    intXEnd,
  } = useMemo(() => {
    if (points.length === 0) {
      return {
        xMin: 5,
        xMax: 70,
        yMax: 1000,
        xTicks: [10, 20, 30, 40, 50, 60, 70],
        yTicks: [0, 250, 500, 750, 1000],
        totalPath: '',
        bgPath: '',
        amorphOutlinePath: '',
        amorphAreaPath: '',
        crystAreaPath: '',
        intXStart: PAD.left,
        intXEnd: PAD.left + PLOT_W,
      };
    }

    const minX = points[0].twoTheta;
    const maxX = points[points.length - 1].twoTheta;
    const rawMaxY = Math.max(100, metrics.maxIntensity * 1.14);
    const yt = niceTicks(0, rawMaxY, 5);
    const maxY = Math.max(rawMaxY, yt[yt.length - 1] || rawMaxY);
    const xt = niceTicks(minX, maxX, 8);

    const sx = (val: number) => PAD.left + ((val - minX) / Math.max(1e-6, maxX - minX)) * PLOT_W;
    const sy = (val: number) => PAD.top + PLOT_H - (Math.max(0, val) / Math.max(1e-6, maxY)) * PLOT_H;

    const sampled = decimatePreservingPeaks(points, 1100);

    const buildLine = (accessor: (p: DiffractogramPoint) => number) =>
      sampled
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${sx(p.twoTheta).toFixed(1)},${sy(accessor(p)).toFixed(1)}`)
        .join(' ');

    const buildBandInWindow = (
      lower: (p: DiffractogramPoint) => number,
      upper: (p: DiffractogramPoint) => number
    ) => {
      const inWin = sampled.filter(
        (p) => p.twoTheta >= metrics.integrationMin - 1e-4 && p.twoTheta <= metrics.integrationMax + 1e-4
      );
      if (inWin.length < 2) return '';
      const topStr = inWin
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${sx(p.twoTheta).toFixed(1)},${sy(upper(p)).toFixed(1)}`)
        .join(' ');
      const botStr = [...inWin]
        .reverse()
        .map((p) => `L${sx(p.twoTheta).toFixed(1)},${sy(lower(p)).toFixed(1)}`)
        .join(' ');
      return `${topStr} ${botStr} Z`;
    };

    return {
      xMin: minX,
      xMax: maxX,
      yMax: maxY,
      xTicks: xt,
      yTicks: yt,
      totalPath: buildLine((p) => p.total),
      bgPath: buildLine((p) => p.background),
      amorphOutlinePath: buildLine((p) => p.amorphousEnvelope),
      amorphAreaPath: buildBandInWindow(
        (p) => p.background,
        (p) => p.amorphousEnvelope
      ),
      crystAreaPath: buildBandInWindow(
        (p) => p.amorphousEnvelope,
        (p) => p.crystallineEnvelope
      ),
      intXStart: sx(metrics.integrationMin),
      intXEnd: sx(metrics.integrationMax),
    };
  }, [points, metrics]);

  const mapX = (val: number) => PAD.left + ((val - xMin) / Math.max(1e-6, xMax - xMin)) * PLOT_W;
  const mapY = (val: number) => PAD.top + PLOT_H - (Math.max(0, val) / Math.max(1e-6, yMax)) * PLOT_H;

  const hoveredPoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const relY = ((e.clientY - rect.top) / rect.height) * SVG_H;
    if (relX < PAD.left || relX > PAD.left + PLOT_W || relY < PAD.top || relY > PAD.top + PLOT_H) {
      setHoverIdx(null);
      setCursorIntensity(null);
      return;
    }
    const targetTwoTheta = xMin + ((relX - PAD.left) / PLOT_W) * (xMax - xMin);
    const idx = findNearestPointIndex(points, targetTwoTheta);
    setHoverIdx(idx);
    const yVal = Math.max(0, ((PAD.top + PLOT_H - relY) / PLOT_H) * yMax);
    setCursorIntensity(yVal);
  };

  const handlePlotClick = () => {
    if (!placePeakMode || !hoveredPoint || cursorIntensity === null) return;
    const netHeight = Math.max(150, Math.round(cursorIntensity - hoveredPoint.amorphousEnvelope));
    onPlacePeakAt(Number(hoveredPoint.twoTheta.toFixed(2)), netHeight);
  };

  const buildStandaloneSvgMarkup = (mode: 'paper' | 'dark'): string => {
    const isPaper = mode === 'paper';
    const bg = isPaper ? '#ffffff' : '#090d16';
    const fg = isPaper ? '#0f172a' : '#f1f5f9';
    const muted = isPaper ? '#475569' : '#94a3b8';
    const grid = isPaper ? '#e2e8f0' : '#1e293b';
    const axis = isPaper ? '#334155' : '#475569';
    const totalStroke = isPaper ? '#1e3a8a' : '#38bdf8';
    const crystFill = isPaper ? 'rgba(37, 99, 235, 0.24)' : 'rgba(99, 102, 241, 0.32)';
    const amorphFill = isPaper ? 'rgba(217, 119, 6, 0.24)' : 'rgba(245, 158, 11, 0.28)';
    const amorphLine = isPaper ? '#b45309' : '#f59e0b';
    const bgLine = '#64748b';
    const basisLabel =
      fractionBasis === 'volume' ? 'Volume' : fractionBasis === 'mole' ? 'Mole' : 'Weight';

    const gridLines = [
      ...xTicks.map(
        (t) =>
          `<line x1="${mapX(t).toFixed(1)}" y1="${PAD.top}" x2="${mapX(t).toFixed(1)}" y2="${PAD.top + PLOT_H}" stroke="${grid}" stroke-width="1" />`
      ),
      ...yTicks.map(
        (t) =>
          `<line x1="${PAD.left}" y1="${mapY(t).toFixed(1)}" x2="${PAD.left + PLOT_W}" y2="${mapY(t).toFixed(1)}" stroke="${grid}" stroke-width="1" />`
      ),
    ].join('');

    const xLabels = xTicks
      .map(
        (t) =>
          `<text x="${mapX(t).toFixed(1)}" y="${PAD.top + PLOT_H + 20}" fill="${muted}" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="middle">${t.toFixed(0)}°</text>`
      )
      .join('');

    const yLabels = yTicks
      .map(
        (t) =>
          `<text x="${PAD.left - 10}" y="${(mapY(t) + 4).toFixed(1)}" fill="${muted}" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="end">${t >= 1000 ? (t / 1000).toFixed(1) + 'k' : t.toFixed(0)}</text>`
      )
      .join('');

    const peakAnnotations = layers.showPeakLabels
      ? metrics.peakSummaries
          .filter((p) => p.enabled && p.twoTheta >= xMin && p.twoTheta <= xMax)
          .map((p) => {
            const closest = points[findNearestPointIndex(points, p.twoTheta)];
            const px = mapX(p.twoTheta);
            const py = Math.max(PAD.top + 16, mapY(closest.crystallineEnvelope) - 10);
            const label = p.hkl && p.hkl !== '—' ? `${p.hkl}` : `${p.twoTheta.toFixed(1)}°`;
            return `<g><line x1="${px.toFixed(1)}" y1="${(py + 4).toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py + 12).toFixed(1)}" stroke="${totalStroke}" stroke-width="1" opacity="0.65" /><text x="${px.toFixed(1)}" y="${py.toFixed(1)}" fill="${fg}" font-size="10" font-family="'Times New Roman', serif" font-weight="700" text-anchor="middle">${label}</text></g>`;
          })
          .join('')
      : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H}" viewBox="0 0 ${SVG_W} ${SVG_H}">
  <rect width="${SVG_W}" height="${SVG_H}" fill="${bg}" />
  <text x="${PAD.left}" y="22" fill="${fg}" font-size="15" font-family="'Times New Roman', Georgia, serif" font-weight="700">${sampleName.replace(/&/g, '&amp;').replace(/</g, '&lt;')} — Synthesized XRD Diffractogram (${materialType})</text>
  <text x="${PAD.left + PLOT_W}" y="22" fill="${muted}" font-size="11.5" font-family="'JetBrains Mono', monospace" text-anchor="end">λ = ${wavelengthA.toFixed(4)} Å | Xc (${basisLabel}) = ${metrics.activeBasisPct.toFixed(2)}%</text>
  ${gridLines}
  ${layers.showAmorphousArea && amorphAreaPath ? `<path d="${amorphAreaPath}" fill="${amorphFill}" />` : ''}
  ${layers.showCrystallineArea && crystAreaPath ? `<path d="${crystAreaPath}" fill="${crystFill}" />` : ''}
  ${layers.showBackground && bgPath ? `<path d="${bgPath}" fill="none" stroke="${bgLine}" stroke-width="1.3" stroke-dasharray="5 4" />` : ''}
  ${layers.showAmorphousArea && amorphOutlinePath && metrics.areaAmorphous > 0.1 ? `<path d="${amorphOutlinePath}" fill="none" stroke="${amorphLine}" stroke-width="1.4" stroke-dasharray="3 3" />` : ''}
  ${layers.showTotal && totalPath ? `<path d="${totalPath}" fill="none" stroke="${totalStroke}" stroke-width="1.8" stroke-linejoin="round" />` : ''}
  ${layers.showIntegrationBounds ? `<line x1="${intXStart.toFixed(1)}" y1="${PAD.top}" x2="${intXStart.toFixed(1)}" y2="${PAD.top + PLOT_H}" stroke="${muted}" stroke-width="1" stroke-dasharray="4 4" /><line x1="${intXEnd.toFixed(1)}" y1="${PAD.top}" x2="${intXEnd.toFixed(1)}" y2="${PAD.top + PLOT_H}" stroke="${muted}" stroke-width="1" stroke-dasharray="4 4" />` : ''}
  ${peakAnnotations}
  <rect x="${PAD.left}" y="${PAD.top}" width="${PLOT_W}" height="${PLOT_H}" fill="none" stroke="${axis}" stroke-width="1.2" />
  ${xLabels}
  ${yLabels}
  <text x="${PAD.left + PLOT_W / 2}" y="${SVG_H - 14}" fill="${fg}" font-size="13" font-family="'Times New Roman', Georgia, serif" font-weight="700" text-anchor="middle">Diffraction Angle 2θ (degrees)</text>
  <text x="20" y="${PAD.top + PLOT_H / 2}" fill="${fg}" font-size="13" font-family="'Times New Roman', Georgia, serif" font-weight="700" text-anchor="middle" transform="rotate(-90 20 ${PAD.top + PLOT_H / 2})">Intensity (counts / s)</text>
</svg>`;
  };

  const triggerDownload = (blob: Blob, filename: string, label: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportStatus(label);
    setTimeout(() => setExportStatus(null), 2200);
  };

  const handleDownloadSVG = () => {
    const markup = buildStandaloneSvgMarkup(exportTheme);
    const safeName = sampleName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    triggerDownload(
      new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }),
      `${safeName}_xrd_curve.svg`,
      'Saved SVG figure'
    );
  };

  const handleDownloadPNG = () => {
    const markup = buildStandaloneSvgMarkup(exportTheme);
    const safeName = sampleName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2.5;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(SVG_W * scale);
      canvas.height = Math.round(SVG_H * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            triggerDownload(pngBlob, `${safeName}_xrd_curve.png`, 'Saved high-DPI PNG');
          }
          URL.revokeObjectURL(url);
        }, 'image/png');
      } else {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const layerItems: { key: keyof DiffractogramLayerToggles; label: string; swatchClass: string }[] = [
    { key: 'showTotal', label: 'Total Curve', swatchClass: 'bg-blue-600 dark:bg-sky-400' },
    { key: 'showCrystallineArea', label: 'Crystalline Area', swatchClass: 'bg-indigo-500/60' },
    { key: 'showAmorphousArea', label: 'Amorphous Halo', swatchClass: 'bg-amber-500/60' },
    { key: 'showBackground', label: 'Background', swatchClass: 'bg-slate-400' },
    { key: 'showPeakLabels', label: 'Peak Labels', swatchClass: 'bg-slate-700 dark:bg-slate-300' },
    { key: 'showIntegrationBounds', label: 'Bounds', swatchClass: 'bg-emerald-500' },
  ];

  const basisLabel =
    fractionBasis === 'volume' ? 'Volume %' : fractionBasis === 'mole' ? 'Mole %' : 'Weight %';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
      {/* Top Toolbar: Layer Controls, Click-to-Add-Peak & Direct Figure Export */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Live Diffractogram &amp; Area Decomposition
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>{sampleName}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{metrics.observedClass}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">λ = {wavelengthA.toFixed(4)} Å</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Window {metrics.integrationMin.toFixed(1)}°–{metrics.integrationMax.toFixed(1)}°
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlacePeakMode}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              placePeakMode
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-500 text-slate-700 dark:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{placePeakMode ? 'Click Plot to Place Peak' : 'Place Peak on Plot'}</span>
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setExportTheme('paper')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                exportTheme === 'paper'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setExportTheme('dark')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                exportTheme === 'dark'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dark
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadSVG}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>SVG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPNG}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>PNG</span>
          </button>
        </div>
      </div>

      {/* Layer Toggle Bar */}
      <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {layerItems.map((item) => {
            const active = layers[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggleLayer(item.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  active
                    ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    : 'bg-transparent border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-xs ${item.swatchClass} ${active ? 'opacity-100' : 'opacity-30'}`} />
                <span>{item.label}</span>
                {active ? <Eye className="w-3 h-3 opacity-60" /> : <EyeOff className="w-3 h-3 opacity-50" />}
              </button>
            );
          })}
        </div>

        {exportStatus && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            {exportStatus}
          </span>
        )}
      </div>

      {/* Interactive Precision SVG Diffractogram Stage */}
      <div className="relative bg-white dark:bg-[#080c15] px-2 pt-2 pb-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-auto select-none cursor-crosshair block"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoverIdx(null);
            setCursorIntensity(null);
          }}
          onClick={handlePlotClick}
          role="img"
          aria-label={`Synthesized XRD curve for ${sampleName} showing crystalline and amorphous scattering regions`}
        >
          {/* Integration Window Soft Band */}
          {layers.showIntegrationBounds && (
            <rect
              x={intXStart}
              y={PAD.top}
              width={Math.max(0, intXEnd - intXStart)}
              height={PLOT_H}
              className="fill-slate-100/55 dark:fill-slate-800/20"
            />
          )}

          {/* Hairline Coordinate Grid */}
          {xTicks.map((t) => (
            <line
              key={`gx-${t}`}
              x1={mapX(t)}
              y1={PAD.top}
              x2={mapX(t)}
              y2={PAD.top + PLOT_H}
              className="stroke-slate-200/80 dark:stroke-slate-800/80"
              strokeWidth={1}
            />
          ))}
          {yTicks.map((t) => (
            <line
              key={`gy-${t}`}
              x1={PAD.left}
              y1={mapY(t)}
              x2={PAD.left + PLOT_W}
              y2={mapY(t)}
              className="stroke-slate-200/80 dark:stroke-slate-800/80"
              strokeWidth={1}
            />
          ))}

          {/* Shaded Amorphous Halo Area (Aa) */}
          {layers.showAmorphousArea && amorphAreaPath && (
            <path
              d={amorphAreaPath}
              className="fill-amber-500/25 dark:fill-amber-400/25 transition-opacity duration-150"
            />
          )}

          {/* Shaded Crystalline Peak Area (Ac) */}
          {layers.showCrystallineArea && crystAreaPath && (
            <path
              d={crystAreaPath}
              className="fill-indigo-600/25 dark:fill-indigo-400/30 transition-opacity duration-150"
            />
          )}

          {/* Background Baseline Curve */}
          {layers.showBackground && bgPath && (
            <path
              d={bgPath}
              fill="none"
              className="stroke-slate-500 dark:stroke-slate-400"
              strokeWidth={1.3}
              strokeDasharray="5 4"
            />
          )}

          {/* Amorphous Envelope Top Boundary */}
          {layers.showAmorphousArea && amorphOutlinePath && metrics.areaAmorphous > 0.1 && (
            <path
              d={amorphOutlinePath}
              fill="none"
              className="stroke-amber-600 dark:stroke-amber-400"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          )}

          {/* Total Synthesized Intensity Curve */}
          {layers.showTotal && totalPath && (
            <path
              d={totalPath}
              fill="none"
              className="stroke-blue-700 dark:stroke-sky-400"
              strokeWidth={1.9}
              strokeLinejoin="round"
            />
          )}

          {/* Integration Boundary Guides */}
          {layers.showIntegrationBounds && (
            <g>
              <line
                x1={intXStart}
                y1={PAD.top}
                x2={intXStart}
                y2={PAD.top + PLOT_H}
                className="stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth={1.2}
                strokeDasharray="4 4"
              />
              <line
                x1={intXEnd}
                y1={PAD.top}
                x2={intXEnd}
                y2={PAD.top + PLOT_H}
                className="stroke-emerald-600 dark:stroke-emerald-400"
                strokeWidth={1.2}
                strokeDasharray="4 4"
              />
              <text
                x={intXStart + 5}
                y={PAD.top + 13}
                className="fill-emerald-700 dark:fill-emerald-400"
                fontSize={10}
                fontFamily="'JetBrains Mono', monospace"
              >
                {metrics.integrationMin.toFixed(1)}°
              </text>
              <text
                x={intXEnd - 5}
                y={PAD.top + 13}
                className="fill-emerald-700 dark:fill-emerald-400"
                fontSize={10}
                fontFamily="'JetBrains Mono', monospace"
                textAnchor="end"
              >
                {metrics.integrationMax.toFixed(1)}°
              </text>
            </g>
          )}

          {/* Peak (hkl) / 2θ Callouts */}
          {layers.showPeakLabels &&
            metrics.peakSummaries
              .filter((p) => p.enabled && p.twoTheta >= xMin && p.twoTheta <= xMax)
              .map((p) => {
                const closest = points[findNearestPointIndex(points, p.twoTheta)];
                const px = mapX(p.twoTheta);
                const py = Math.max(PAD.top + 18, mapY(closest.crystallineEnvelope) - 10);
                const label = p.hkl && p.hkl !== '—' ? p.hkl : `${p.twoTheta.toFixed(1)}°`;
                return (
                  <g key={p.id}>
                    <line
                      x1={px}
                      y1={py + 4}
                      x2={px}
                      y2={Math.min(PAD.top + PLOT_H, py + 13)}
                      className="stroke-indigo-600/60 dark:stroke-sky-400/60"
                      strokeWidth={1}
                    />
                    <text
                      x={px}
                      y={py}
                      className="fill-slate-900 dark:fill-slate-100"
                      fontSize={10.5}
                      fontWeight={700}
                      fontFamily="'Times New Roman', 'Tinos', Georgia, serif"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

          {/* Interactive Crosshair Probe & Place-Peak Target */}
          {hoveredPoint && (
            <g className="pointer-events-none">
              <line
                x1={mapX(hoveredPoint.twoTheta)}
                y1={PAD.top}
                x2={mapX(hoveredPoint.twoTheta)}
                y2={PAD.top + PLOT_H}
                className={placePeakMode ? 'stroke-indigo-500' : 'stroke-slate-500 dark:stroke-slate-300'}
                strokeWidth={placePeakMode ? 1.3 : 1}
                strokeDasharray="3 3"
              />
              {placePeakMode && cursorIntensity !== null && (
                <>
                  <line
                    x1={PAD.left}
                    y1={mapY(cursorIntensity)}
                    x2={PAD.left + PLOT_W}
                    y2={mapY(cursorIntensity)}
                    className="stroke-indigo-500/60"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={mapX(hoveredPoint.twoTheta)}
                    cy={mapY(cursorIntensity)}
                    r={5}
                    className="fill-indigo-600/30 stroke-indigo-600 dark:stroke-indigo-400"
                    strokeWidth={1.6}
                  />
                </>
              )}
              <circle
                cx={mapX(hoveredPoint.twoTheta)}
                cy={mapY(hoveredPoint.total)}
                r={4.2}
                className="fill-blue-600 dark:fill-sky-400 stroke-white dark:stroke-slate-950"
                strokeWidth={1.6}
              />
              {hoveredPoint.amorphous > 1 && (
                <circle
                  cx={mapX(hoveredPoint.twoTheta)}
                  cy={mapY(hoveredPoint.amorphousEnvelope)}
                  r={3.2}
                  className="fill-amber-500 stroke-white dark:stroke-slate-950"
                  strokeWidth={1.3}
                />
              )}
            </g>
          )}

          {/* Plot Border Frame */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_W}
            height={PLOT_H}
            fill="none"
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth={1.2}
          />

          {/* Axis Ticks & Labels */}
          {xTicks.map((t) => (
            <g key={`tx-${t}`}>
              <line
                x1={mapX(t)}
                y1={PAD.top + PLOT_H}
                x2={mapX(t)}
                y2={PAD.top + PLOT_H + 5}
                className="stroke-slate-500 dark:stroke-slate-400"
                strokeWidth={1}
              />
              <text
                x={mapX(t)}
                y={PAD.top + PLOT_H + 20}
                className="fill-slate-600 dark:fill-slate-400"
                fontSize={11}
                fontFamily="'JetBrains Mono', monospace"
                textAnchor="middle"
              >
                {t.toFixed(0)}°
              </text>
            </g>
          ))}

          {yTicks.map((t) => (
            <g key={`ty-${t}`}>
              <line
                x1={PAD.left - 5}
                y1={mapY(t)}
                x2={PAD.left}
                y2={mapY(t)}
                className="stroke-slate-500 dark:stroke-slate-400"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 10}
                y={mapY(t) + 4}
                className="fill-slate-600 dark:fill-slate-400"
                fontSize={11}
                fontFamily="'JetBrains Mono', monospace"
                textAnchor="end"
              >
                {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Axis Titles */}
          <text
            x={PAD.left + PLOT_W / 2}
            y={SVG_H - 14}
            className="fill-slate-800 dark:fill-slate-200"
            fontSize={13}
            fontWeight={700}
            fontFamily="'Times New Roman', 'Tinos', Georgia, serif"
            textAnchor="middle"
          >
            Diffraction Angle 2θ (degrees)
          </text>
          <text
            x={20}
            y={PAD.top + PLOT_H / 2}
            className="fill-slate-800 dark:fill-slate-200"
            fontSize={13}
            fontWeight={700}
            fontFamily="'Times New Roman', 'Tinos', Georgia, serif"
            textAnchor="middle"
            transform={`rotate(-90 20 ${PAD.top + PLOT_H / 2})`}
          >
            Intensity (counts / s)
          </text>
        </svg>

        {/* Live Crosshair Coordinate Strip */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {hoveredPoint ? (
              <span className="font-mono tabular-nums flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <strong className="text-slate-900 dark:text-slate-100">
                  2θ = {hoveredPoint.twoTheta.toFixed(2)}°
                </strong>
                <span>d = {hoveredPoint.dSpacing.toFixed(4)} Å</span>
                <span>Q = {hoveredPoint.qValue.toFixed(3)} Å⁻¹</span>
                <span>I_total = {hoveredPoint.total.toFixed(1)}</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  I_cryst = {hoveredPoint.crystalline.toFixed(1)}
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  I_amorph = {hoveredPoint.amorphous.toFixed(1)}
                </span>
                {placePeakMode && cursorIntensity !== null && (
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    Click to add peak (I ≈ {Math.max(150, Math.round(cursorIntensity - hoveredPoint.amorphousEnvelope))})
                  </strong>
                )}
              </span>
            ) : (
              <span>
                {placePeakMode
                  ? 'Click anywhere inside the plot frame to place a Bragg reflection at that 2θ and intensity.'
                  : 'Move cursor across the diffractogram to inspect 2θ, d-spacing, Q, and component intensities.'}
              </span>
            )}
          </div>
          <span className="font-mono tabular-nums text-[11px] text-slate-500">
            {points.length} adaptive pts
          </span>
        </div>
      </div>

      {/* Bottom Precision Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="px-4 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Crystallinity Xc ({basisLabel})
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400 mt-0.5">
            {metrics.activeBasisPct.toFixed(2)}%
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Amorphous Fraction</div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-0.5">
            {metrics.activeAmorphousPct.toFixed(2)}%
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Integrated Area Ac
          </div>
          <div className="text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {metrics.areaCrystalline.toFixed(1)}{' '}
            <span className="text-[11px] font-normal text-slate-500">cps·deg</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Integrated Area Aa
          </div>
          <div className="text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
            {metrics.areaAmorphous.toFixed(1)}{' '}
            <span className="text-[11px] font-normal text-slate-500">cps·deg</span>
          </div>
        </div>
      </div>
    </div>
  );
};
