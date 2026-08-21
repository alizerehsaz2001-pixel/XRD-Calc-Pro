import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  RotateCcw, 
  Sparkles, 
  Tag, 
  Grid,
  Maximize2,
  Minimize2,
  Palette,
  Eye,
  EyeOff,
  Layers,
  Plus,
  Minus,
  Sparkle,
  Download,
  Check,
  Zap,
  X,
  Compass,
  CheckCircle2,
  CircleDot,
  SplitSquareVertical,
  FlaskConical,
  Ruler,
  Camera,
  ArrowLeftRight,
  SlidersHorizontal,
  Wand2,
  Scissors
} from 'lucide-react';
import { 
  ProfilePoint, 
  CompareViewMode, 
  DiffTheme, 
  PeakItem,
  CurveColorPalette,
  CompareEngineSettings,
  ChartBackgroundTheme,
  CurveVisibilityState,
  CurveVisibilityFilter,
  CaliperPoint,
  DifferenceMode,
  SmoothingFilter
} from './types';
import { 
  getActivePalette, 
  THEME_PALETTES, 
  PRESET_COLOR_SWATCHES,
  exportCompareDataAsCSV,
  calculateCaliperMetrics,
  CU_KA_WAVELENGTH
} from './compareUtils';

interface CompareChartViewerProps {
  points: ProfilePoint[];
  viewMode: CompareViewMode;
  setViewMode: (mode: CompareViewMode) => void;
  diffTheme: DiffTheme;
  setDiffTheme: (theme: DiffTheme) => void;
  customPalette?: Partial<CurveColorPalette>;
  onUpdateCustomColor?: (key: keyof CurveColorPalette, color: string) => void;
  engineSettings: CompareEngineSettings;
  setEngineSettings: React.Dispatch<React.SetStateAction<CompareEngineSettings>>;
  showDiffArea: boolean;
  setShowDiffArea: (show: boolean) => void;
  showPeakMarkers: boolean;
  setShowPeakMarkers: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  
  // Alignment & Scaling
  shiftTwoTheta: number;
  setShiftTwoTheta: (shift: number) => void;
  scaleSampleB: number;
  setScaleSampleB: (scale: number) => void;
  onAutoAlign: () => void;

  // Zoom
  left: number;
  right: number;
  onZoomChange: (left: number, right: number) => void;
  onResetZoom: () => void;

  materialAName: string;
  materialBName: string;
  materialCName?: string;
  materialDName?: string;
  peaksA: PeakItem[];
  peaksB: PeakItem[];
  peaksC?: PeakItem[];
  peaksD?: PeakItem[];
  hasPhaseC?: boolean;
  hasPhaseD?: boolean;
  onSwapSamples?: () => void;
}

export const CompareChartViewer: React.FC<CompareChartViewerProps> = ({
  points,
  viewMode,
  setViewMode,
  diffTheme,
  setDiffTheme,
  customPalette,
  onUpdateCustomColor,
  engineSettings,
  setEngineSettings,
  showDiffArea,
  setShowDiffArea,
  showPeakMarkers,
  setShowPeakMarkers,
  showGrid,
  setShowGrid,
  shiftTwoTheta,
  setShiftTwoTheta,
  scaleSampleB,
  setScaleSampleB,
  onAutoAlign,
  left,
  right,
  onZoomChange,
  onResetZoom,
  materialAName,
  materialBName,
  materialCName,
  materialDName,
  peaksA,
  peaksB,
  peaksC,
  peaksD,
  hasPhaseC,
  hasPhaseD,
  onSwapSamples
}) => {
  const { t } = useTranslation();
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isColorStudioOpen, setIsColorStudioOpen] = useState(false);
  const [selectedColorTarget, setSelectedColorTarget] = useState<keyof CurveColorPalette>('colorA');
  const [curveInterpolation, setCurveInterpolation] = useState<'monotone' | 'linear'>('monotone');
  
  // Interactive Peak Caliper / Delta Measurement State
  const [isCaliperActive, setIsCaliperActive] = useState(false);
  const [caliperP1, setCaliperP1] = useState<CaliperPoint | null>(null);
  const [caliperP2, setCaliperP2] = useState<CaliperPoint | null>(null);
  const [isFigureExportOpen, setIsFigureExportOpen] = useState(false);
  const [exportBgTheme, setExportBgTheme] = useState<'light' | 'dark'>('light');
  const [exportDpi, setExportDpi] = useState<number>(2);

  // Curve Visibility State
  const [visibleCurves, setVisibleCurves] = useState<CurveVisibilityState>({
    showA: true,
    showB: true,
    showC: true,
    showD: true,
    showDiff: true,
    showTotalModel: true
  });

  const [liveCursorData, setLiveCursorData] = useState<{
    twoTheta: number;
    dSpacing: string;
    qVector: string;
    intensityA: number | null;
    intensityB: number | null;
    difference: number | null;
  } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<HTMLDivElement>(null);
  const [isDraggingMiniMap, setIsDraggingMiniMap] = useState(false);

  // Compute active colors with full fallback & custom color override support
  const pal = getActivePalette(diffTheme, customPalette);

  // Determine current active filter preset
  const currentFilterPreset = useMemo<CurveVisibilityFilter>(() => {
    if (visibleCurves.showA && visibleCurves.showB && (!hasPhaseC || visibleCurves.showC) && (!hasPhaseD || visibleCurves.showD)) {
      return 'both';
    }
    if (visibleCurves.showA && !visibleCurves.showB && !visibleCurves.showC && !visibleCurves.showD) {
      return 'only_a';
    }
    if (!visibleCurves.showA && visibleCurves.showB && !visibleCurves.showC && !visibleCurves.showD) {
      return 'only_b';
    }
    if (visibleCurves.showA && visibleCurves.showB && visibleCurves.showC && visibleCurves.showD) {
      return 'all';
    }
    return 'custom';
  }, [visibleCurves, hasPhaseC, hasPhaseD]);

  // Handle preset curve filter
  const handleSelectCurveFilter = (filter: CurveVisibilityFilter) => {
    switch (filter) {
      case 'only_a':
        setVisibleCurves({
          showA: true,
          showB: false,
          showC: false,
          showD: false,
          showDiff: false,
          showTotalModel: false
        });
        break;
      case 'only_b':
        setVisibleCurves({
          showA: false,
          showB: true,
          showC: false,
          showD: false,
          showDiff: false,
          showTotalModel: false
        });
        break;
      case 'both':
        setVisibleCurves({
          showA: true,
          showB: true,
          showC: !!hasPhaseC,
          showD: !!hasPhaseD,
          showDiff: true,
          showTotalModel: true
        });
        break;
      case 'all':
        setVisibleCurves({
          showA: true,
          showB: true,
          showC: true,
          showD: true,
          showDiff: true,
          showTotalModel: true
        });
        break;
    }
  };

  // Toggle individual curve visibility
  const toggleCurve = (key: keyof CurveVisibilityState) => {
    setVisibleCurves(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.showA && !next.showB && !next.showC && !next.showD) {
        return prev;
      }
      return next;
    });
  };

  // Background style helper
  const getChartBgStyle = () => {
    switch (engineSettings.bgTheme) {
      case 'deep-black':
        return { 
          bg: 'bg-[#000000]', 
          border: 'border-slate-800', 
          grid: '#18202f', 
          axisText: '#94a3b8', 
          axisLine: '#334155', 
          isLight: false 
        };
      case 'midnight-navy':
        return { 
          bg: 'bg-[#03091e]', 
          border: 'border-indigo-950/80', 
          grid: '#15213d', 
          axisText: '#a5b4fc', 
          axisLine: '#312e81', 
          isLight: false 
        };
      case 'high-contrast-light':
        return { 
          bg: 'bg-[#ffffff]', 
          border: 'border-slate-300 shadow-md', 
          grid: '#e2e8f0', 
          axisText: '#334155', 
          axisLine: '#94a3b8', 
          isLight: true 
        };
      case 'dark-obsidian':
      default:
        return { 
          bg: 'bg-[#030712]', 
          border: 'border-slate-800/90', 
          grid: '#1e293b', 
          axisText: '#94a3b8', 
          axisLine: '#334155', 
          isLight: false 
        };
    }
  };

  const bgStyle = getChartBgStyle();

  // Zoom handling
  const handleZoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }
    let [x1, x2] = [refAreaLeft, refAreaRight];
    if (x1 > x2) [x1, x2] = [x2, x1];
    onZoomChange(Math.max(10, Math.floor(x1)), Math.min(90, Math.ceil(x2)));
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleChartMouseDown = (e: any) => {
    if (!e || e.activeLabel === undefined || e.activeLabel === null) return;
    const val = typeof e.activeLabel === 'number' ? e.activeLabel : parseFloat(String(e.activeLabel));
    if (isNaN(val)) return;

    if (isCaliperActive) {
      // Find intensity at this theta
      const pt = points.find(p => Math.abs(p.twoTheta - val) < 0.15) || points[0];
      const thetaRad = (val / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4) : '-';
      const qVector = thetaRad > 0 ? ((4 * Math.PI * Math.sin(thetaRad)) / CU_KA_WAVELENGTH).toFixed(4) : '-';

      const calPoint: CaliperPoint = {
        twoTheta: val,
        intensity: pt ? (pt.intensityA || pt.intensityB || 50) : 50,
        dSpacing,
        qVector
      };

      if (!caliperP1 || (caliperP1 && caliperP2)) {
        setCaliperP1(calPoint);
        setCaliperP2(null);
      } else {
        setCaliperP2(calPoint);
      }
      return;
    }

    setRefAreaLeft(val);
  };

  const handleChartMouseMove = (e: any) => {
    if (!isCaliperActive && refAreaLeft !== null && e && e.activeLabel !== undefined && e.activeLabel !== null) {
      const val = typeof e.activeLabel === 'number' ? e.activeLabel : parseFloat(String(e.activeLabel));
      if (!isNaN(val)) setRefAreaRight(val);
    }
    if (e && e.activePayload && e.activePayload.length) {
      const theta = Number(e.activeLabel);
      const thetaRad = (theta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4) : '-';
      const qVector = thetaRad > 0 ? ((4 * Math.PI * Math.sin(thetaRad)) / CU_KA_WAVELENGTH).toFixed(4) : '-';

      const valA = visibleCurves.showA ? (e.activePayload.find((p: any) => p.dataKey === 'intensityA')?.value ?? null) : null;
      const valB = visibleCurves.showB ? (e.activePayload.find((p: any) => p.dataKey === 'intensityB')?.value ?? null) : null;
      const valDiff = visibleCurves.showDiff ? (e.activePayload.find((p: any) => p.dataKey === 'difference')?.value ?? null) : null;

      setLiveCursorData({
        twoTheta: theta,
        dSpacing,
        qVector,
        intensityA: typeof valA === 'number' ? valA : null,
        intensityB: typeof valB === 'number' ? valB : null,
        difference: typeof valDiff === 'number' ? valDiff : null
      });
    }
  };

  // Compute live caliper metrics when both markers are placed
  const caliperMetrics = useMemo(() => {
    if (!caliperP1 || !caliperP2) return null;
    return calculateCaliperMetrics(caliperP1, caliperP2);
  }, [caliperP1, caliperP2]);

  // Snap Caliper to nearest detected peaks
  const handleSnapCaliperToPeaks = () => {
    if (!peaksA.length && !peaksB.length) return;
    const allPeaks = [...peaksA, ...peaksB].sort((a, b) => a.twoTheta - b.twoTheta);
    if (allPeaks.length >= 2) {
      const p1 = allPeaks[0];
      const p2 = allPeaks[1];
      const theta1Rad = (p1.twoTheta / 2) * (Math.PI / 180);
      const theta2Rad = (p2.twoTheta / 2) * (Math.PI / 180);

      setCaliperP1({
        twoTheta: p1.twoTheta,
        intensity: p1.intensity,
        dSpacing: (CU_KA_WAVELENGTH / (2 * Math.sin(theta1Rad))).toFixed(4),
        qVector: ((4 * Math.PI * Math.sin(theta1Rad)) / CU_KA_WAVELENGTH).toFixed(4),
        sourceCurve: 'A'
      });
      setCaliperP2({
        twoTheta: p2.twoTheta,
        intensity: p2.intensity,
        dSpacing: (CU_KA_WAVELENGTH / (2 * Math.sin(theta2Rad))).toFixed(4),
        qVector: ((4 * Math.PI * Math.sin(theta2Rad)) / CU_KA_WAVELENGTH).toFixed(4),
        sourceCurve: 'B'
      });
    }
  };

  const handleExportCSV = () => {
    exportCompareDataAsCSV(points, materialAName, materialBName, hasPhaseC ? materialCName : undefined, hasPhaseD ? materialDName : undefined);
  };

  // Mini-map click/drag handler
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!miniMapRef.current) return;
    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTheta = 10 + ratio * (90 - 10);
    const span = right - left;
    const halfSpan = span / 2;
    const newLeft = Math.max(10, Math.round(targetTheta - halfSpan));
    const newRight = Math.min(90, Math.round(targetTheta + halfSpan));
    onZoomChange(newLeft, newRight);
  };

  // Custom Scientific Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const theta = Number(label);
      const thetaRad = (theta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4) : '-';
      const qVector = thetaRad > 0 ? ((4 * Math.PI * Math.sin(thetaRad)) / CU_KA_WAVELENGTH).toFixed(4) : '-';

      const valA = payload.find((p: any) => p.dataKey === 'intensityA')?.value ?? '-';
      const valB = payload.find((p: any) => p.dataKey === 'intensityB')?.value ?? '-';
      const valC = payload.find((p: any) => p.dataKey === 'intensityC')?.value;
      const valD = payload.find((p: any) => p.dataKey === 'intensityD')?.value;
      const valDiff = payload.find((p: any) => p.dataKey === 'difference')?.value ?? '-';

      return (
        <div className="bg-[#030712]/98 border-2 border-indigo-500/50 p-3.5 rounded-xl shadow-2xl backdrop-blur-xl text-xs font-mono min-w-[260px] pointer-events-none z-50 ring-1 ring-white/15">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
            <span className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              2θ = {theta.toFixed(2)}°
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-cyan-300 font-bold px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-700/50 rounded">
                d = {dSpacing} Å
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {visibleCurves.showA && (
              <div className="flex justify-between items-center py-0.5 px-1 rounded bg-slate-900/60" style={{ borderLeft: `3px solid ${pal.colorA}` }}>
                <span className="flex items-center gap-1.5 ml-1 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: pal.colorA }} />
                  <span className="font-semibold truncate max-w-[130px]">{materialAName} (A):</span>
                </span>
                <span className="font-bold text-white pr-1">{typeof valA === 'number' ? valA.toFixed(1) : valA}%</span>
              </div>
            )}

            {visibleCurves.showB && (
              <div className="flex justify-between items-center py-0.5 px-1 rounded bg-slate-900/60" style={{ borderLeft: `3px solid ${pal.colorB}` }}>
                <span className="flex items-center gap-1.5 ml-1 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: pal.colorB }} />
                  <span className="font-semibold truncate max-w-[130px]">{materialBName} (B):</span>
                </span>
                <span className="font-bold text-white pr-1">{typeof valB === 'number' ? valB.toFixed(1) : valB}%</span>
              </div>
            )}

            {hasPhaseC && visibleCurves.showC && valC !== undefined && (
              <div className="flex justify-between items-center py-0.5 px-1 rounded bg-slate-900/60" style={{ borderLeft: `3px solid ${pal.colorC}` }}>
                <span className="flex items-center gap-1.5 ml-1 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: pal.colorC }} />
                  <span className="font-semibold truncate max-w-[130px]">{materialCName || 'Phase C'}:</span>
                </span>
                <span className="font-bold text-white pr-1">{typeof valC === 'number' ? valC.toFixed(1) : valC}%</span>
              </div>
            )}

            {hasPhaseD && visibleCurves.showD && valD !== undefined && (
              <div className="flex justify-between items-center py-0.5 px-1 rounded bg-slate-900/60" style={{ borderLeft: `3px solid ${pal.colorD}` }}>
                <span className="flex items-center gap-1.5 ml-1 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: pal.colorD }} />
                  <span className="font-semibold truncate max-w-[130px]">{materialDName || 'Phase D'}:</span>
                </span>
                <span className="font-bold text-white pr-1">{typeof valD === 'number' ? valD.toFixed(1) : valD}%</span>
              </div>
            )}

            {visibleCurves.showDiff && visibleCurves.showA && visibleCurves.showB && (
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-800" style={{ color: pal.colorDiff }}>
                <span className="font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Δ Difference:</span>
                </span>
                <span className="font-bold">
                  {typeof valDiff === 'number' ? (valDiff > 0 ? `+${valDiff.toFixed(1)}%` : `${valDiff.toFixed(1)}%`) : valDiff}
                </span>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-1 text-right font-mono flex items-center justify-between border-t border-slate-850">
              <span className="text-slate-500">Scattering Vector Q:</span>
              <span className="text-indigo-300 font-semibold">{qVector} nm⁻¹</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const strokeW = engineSettings.strokeWidth || 2.8;
  const dashB = engineSettings.styleB === 'dashed' ? '5 4' : engineSettings.styleB === 'dotted' ? '2 3' : undefined;

  return (
    <div 
      ref={chartContainerRef}
      className={`bg-[#080d1a] border-2 border-slate-800/90 rounded-2xl shadow-2xl flex flex-col transition-all relative ${
        isFullscreen ? 'fixed inset-3 z-50 p-6 bg-[#080d1a]/98 backdrop-blur-2xl' : 'p-5'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Left: View Mode Tabs & Caliper Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mode:</span>
          </span>

          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl shadow-inner">
            {[
              { id: 'unified', label: 'Overlay' },
              { id: 'split', label: 'Dual-Split' },
              { id: 'stacked', label: '3-Pane Stack' },
              { id: 'mirrored', label: 'Butterfly' },
              { id: 'derivative', label: '1st Derivative' },
              { id: 'multiphase', label: 'Multi-Phase' }
            ].map(({ id, label }) => (
              <button
                key={id}
                id={`btn-viewmode-${id}`}
                onClick={() => setViewMode(id as CompareViewMode)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold capitalize transition-all cursor-pointer ${
                  viewMode === id
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Caliper / Delta Measurement Mode Toggle */}
          <button
            id="btn-toggle-caliper"
            onClick={() => {
              setIsCaliperActive(!isCaliperActive);
              if (isCaliperActive) {
                setCaliperP1(null);
                setCaliperP2(null);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              isCaliperActive 
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40 animate-pulse' 
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title="Click two peaks or points on chart to measure peak shift, lattice strain, intensity ratio, and d-spacing delta"
          >
            <Ruler className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isCaliperActive ? 'Caliper Active' : 'Caliper Tool'}</span>
          </button>

          {/* Quick Swap A/B Button */}
          {onSwapSamples && (
            <button
              id="btn-swap-samples-toolbar"
              onClick={onSwapSamples}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-all cursor-pointer shadow-sm active:scale-95"
              title="Swap Sample A and Reference B roles"
            >
              <ArrowLeftRight className="w-3 h-3 text-cyan-400" />
              <span>Swap A/B</span>
            </button>
          )}

          <button
            id="btn-reset-zoom"
            onClick={onResetZoom}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-all cursor-pointer shadow-sm active:scale-95"
            title="Reset 2Theta Zoom Domain (10° - 90°)"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Zoom</span>
          </button>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Difference Mode Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-xs font-mono">
            <span className="text-[10px] text-slate-400 mr-1.5 font-bold">Δ Mode:</span>
            <select
              value={engineSettings.differenceMode || 'residual'}
              onChange={(e) => setEngineSettings(prev => ({ ...prev, differenceMode: e.target.value as DifferenceMode }))}
              className="bg-slate-800 text-cyan-300 text-[11px] font-mono rounded px-1.5 py-0.5 border border-slate-700 outline-none cursor-pointer"
            >
              <option value="residual">Residual (IA - Icalc)</option>
              <option value="relative">Relative Discrepancy %</option>
              <option value="chi">Chi Standardized χ</option>
              <option value="squared">Square Error (Δ²)</option>
            </select>
          </div>

          {/* Color Studio Button */}
          <button
            id="btn-open-color-studio"
            onClick={() => setIsColorStudioOpen(!isColorStudioOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer shadow-sm ${
              isColorStudioOpen 
                ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-md ring-1 ring-cyan-400/40' 
                : 'bg-gradient-to-r from-indigo-900/70 to-purple-900/70 text-indigo-200 border-indigo-500/40 hover:border-indigo-400'
            }`}
            title="Customize Curve Colors, Contrast, Glow, Line Width, and Background Theme"
          >
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span>Color Studio</span>
            <div className="flex items-center -space-x-1 ml-0.5">
              <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: pal.colorA }} />
              <span className="w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: pal.colorB }} />
            </div>
          </button>

          {/* Residual Area Fill Toggle */}
          <button
            id="btn-toggle-diff-fill"
            onClick={() => setShowDiffArea(!showDiffArea)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              showDiffArea 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Difference Area Fill"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Δ Fill</span>
          </button>

          {/* Peak Markers Stick-pattern toggle */}
          <button
            id="btn-toggle-peak-markers"
            onClick={() => setShowPeakMarkers(!showPeakMarkers)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              showPeakMarkers 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Bragg Peak Reflections (hkl) Sticks"
          >
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>(hkl) Sticks</span>
          </button>

          {/* Grid Toggle */}
          <button
            id="btn-toggle-grid"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              showGrid 
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/40 shadow-sm' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Cartesian Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Export CSV Button */}
          <button
            id="btn-export-csv-data"
            onClick={handleExportCSV}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
            title="Export Profile Dataset as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="btn-toggle-fullscreen"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* CURVE ISOLATION & SELECTION CONTROL BAR */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 py-2.5 px-3.5 bg-[#040817] rounded-xl border border-slate-800 my-2 text-xs font-mono shadow-inner">
        {/* Left: Quick Selection Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 mr-1">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>Show Curve:</span>
          </span>

          <button
            id="btn-curve-both"
            onClick={() => handleSelectCurveFilter('both')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              currentFilterPreset === 'both'
                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400 shadow-md ring-1 ring-indigo-400/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center -space-x-1">
              <span className="w-2 h-2 rounded-full border border-black" style={{ backgroundColor: pal.colorA }} />
              <span className="w-2 h-2 rounded-full border border-black" style={{ backgroundColor: pal.colorB }} />
            </div>
            <span>Both (Compare)</span>
          </button>

          <button
            id="btn-curve-only-a"
            onClick={() => handleSelectCurveFilter('only_a')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              currentFilterPreset === 'only_a'
                ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
            <span>Only Sample A (Exp)</span>
          </button>

          <button
            id="btn-curve-only-b"
            onClick={() => handleSelectCurveFilter('only_b')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
              currentFilterPreset === 'only_b'
                ? 'bg-indigo-500/25 text-indigo-200 border-indigo-400 shadow-md ring-1 ring-indigo-400/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
            <span>Only Reference B (Std)</span>
          </button>

          {(hasPhaseC || hasPhaseD) && (
            <button
              id="btn-curve-all"
              onClick={() => handleSelectCurveFilter('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                currentFilterPreset === 'all'
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400 shadow-md ring-1 ring-purple-400/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <CircleDot className="w-3 h-3 text-purple-400" />
              <span>All Phases</span>
            </button>
          )}
        </div>

        {/* Right: Individual Curve Toggle Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Toggles:</span>

          <button
            id="toggle-curve-a"
            onClick={() => toggleCurve('showA')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
              visibleCurves.showA
                ? 'bg-slate-800 border-cyan-500/60 text-cyan-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
            }`}
          >
            {visibleCurves.showA ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
            <span>A</span>
          </button>

          <button
            id="toggle-curve-b"
            onClick={() => toggleCurve('showB')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
              visibleCurves.showB
                ? 'bg-slate-800 border-indigo-500/60 text-indigo-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
            }`}
          >
            {visibleCurves.showB ? <Eye className="w-3 h-3 text-indigo-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
            <span>B</span>
          </button>

          {hasPhaseC && (
            <button
              id="toggle-curve-c"
              onClick={() => toggleCurve('showC')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                visibleCurves.showC
                  ? 'bg-slate-800 border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
              }`}
            >
              {visibleCurves.showC ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorC }} />
              <span>C</span>
            </button>
          )}

          {hasPhaseD && (
            <button
              id="toggle-curve-d"
              onClick={() => toggleCurve('showD')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                visibleCurves.showD
                  ? 'bg-slate-800 border-amber-500/60 text-amber-300 shadow-sm'
                  : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
              }`}
            >
              {visibleCurves.showD ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorD }} />
              <span>D</span>
            </button>
          )}

          <button
            id="toggle-curve-diff"
            onClick={() => toggleCurve('showDiff')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
              visibleCurves.showDiff
                ? 'bg-slate-800 border-pink-500/60 text-pink-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
            }`}
          >
            {visibleCurves.showDiff ? <Eye className="w-3 h-3 text-pink-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorDiff }} />
            <span>Δ Diff</span>
          </button>
        </div>
      </div>

      {/* CALIPER LIVE MEASUREMENT FLOATING HUD */}
      {isCaliperActive && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-cyan-950/90 border-2 border-emerald-500/60 rounded-xl p-3 my-2 shadow-2xl backdrop-blur-xl text-xs font-mono ring-1 ring-emerald-500/30 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                <Ruler className="w-4 h-4" />
              </span>
              <span className="font-bold text-white uppercase tracking-wider">
                Precision Peak Caliper & Strain Analyzer
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                {!caliperP1 ? 'Click chart to set Point 1' : !caliperP2 ? 'Click chart to set Point 2' : '2 Points Anchored'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSnapCaliperToPeaks}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 cursor-pointer shadow-sm active:scale-95"
              >
                <Wand2 className="w-3 h-3 text-cyan-400" />
                <span>Snap to Peaks</span>
              </button>
              <button
                onClick={() => { setCaliperP1(null); setCaliperP2(null); }}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Clear Markers</span>
              </button>
              <button
                onClick={() => setIsCaliperActive(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-cyan-500/40">
              <span className="text-[10px] text-cyan-400 font-bold block">Marker 1 (C1)</span>
              <span className="font-bold text-white text-xs">{caliperP1 ? `${caliperP1.twoTheta.toFixed(2)}°` : '—'}</span>
              <span className="text-[10px] text-slate-400 block">d: {caliperP1 ? `${caliperP1.dSpacing} Å` : '—'}</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-pink-500/40">
              <span className="text-[10px] text-pink-400 font-bold block">Marker 2 (C2)</span>
              <span className="font-bold text-white text-xs">{caliperP2 ? `${caliperP2.twoTheta.toFixed(2)}°` : '—'}</span>
              <span className="text-[10px] text-slate-400 block">d: {caliperP2 ? `${caliperP2.dSpacing} Å` : '—'}</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-amber-500/40">
              <span className="text-[10px] text-amber-400 font-bold block">Δ2θ Shift</span>
              <span className="font-bold text-white text-xs">
                {caliperMetrics ? `${caliperMetrics.deltaTwoTheta > 0 ? `+${caliperMetrics.deltaTwoTheta}` : caliperMetrics.deltaTwoTheta}°` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {caliperMetrics ? `${caliperMetrics.deltaTwoThetaArcmin} arcmin` : '—'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 font-bold block">Δd Interplanar</span>
              <span className="font-bold text-white text-xs">
                {caliperMetrics ? `${caliperMetrics.deltaD > 0 ? `+${caliperMetrics.deltaD}` : caliperMetrics.deltaD} Å` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">d2 - d1</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-purple-500/40">
              <span className="text-[10px] text-purple-400 font-bold block">Lattice Strain ε</span>
              <span className="font-bold text-white text-xs">
                {caliperMetrics ? `${caliperMetrics.strainPercent > 0 ? `+${caliperMetrics.strainPercent}` : caliperMetrics.strainPercent}%` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {caliperMetrics ? (caliperMetrics.strainPercent > 0 ? 'Tensile (+)' : 'Compressive (-)') : '—'}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-indigo-500/40">
              <span className="text-[10px] text-indigo-400 font-bold block">Intensity Ratio (I2/I1)</span>
              <span className="font-bold text-white text-xs">
                {caliperMetrics ? `${caliperMetrics.intensityRatio.toFixed(2)}x` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ΔQ: {caliperMetrics ? `${caliperMetrics.deltaQ} nm⁻¹` : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* COLOR & CONTRAST STUDIO POPOVER PANEL */}
      {isColorStudioOpen && (
        <div className="bg-[#030712] border-2 border-indigo-500/40 rounded-xl p-4 my-2 shadow-2xl space-y-4 animate-in fade-in duration-200 z-30 ring-1 ring-indigo-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Interactive Curve Graphics & High-Contrast Customizer
              </span>
            </div>
            <button
              onClick={() => setIsColorStudioOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Column 1: Palette Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Scientific Themes
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-[170px] overflow-y-auto pr-1">
                {(Object.keys(THEME_PALETTES) as DiffTheme[]).map((thm) => {
                  const p = THEME_PALETTES[thm];
                  const isSelected = diffTheme === thm;
                  return (
                    <button
                      key={thm}
                      onClick={() => setDiffTheme(thm)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-indigo-950/90 border-cyan-400 text-white font-bold shadow-sm' 
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="capitalize text-[11px] truncate">{thm}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: p.colorA }} />
                        <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: p.colorB }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Curve Overrides */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Curve Color Picker
              </span>

              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'colorA', label: 'Sample A', color: pal.colorA },
                  { key: 'colorB', label: 'Reference B', color: pal.colorB },
                  ...(hasPhaseC ? [{ key: 'colorC', label: 'Phase C', color: pal.colorC }] : []),
                  ...(hasPhaseD ? [{ key: 'colorD', label: 'Phase D', color: pal.colorD }] : []),
                  { key: 'colorDiff', label: 'Δ Residual', color: pal.colorDiff }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedColorTarget(item.key as keyof CurveColorPalette)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] cursor-pointer transition-all ${
                      selectedColorTarget === item.key
                        ? 'bg-slate-800 border-cyan-400 text-white font-bold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400">Color for <strong className="text-cyan-400">{selectedColorTarget}</strong>:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">Hex:</span>
                    <input
                      type="color"
                      value={pal[selectedColorTarget] || '#6366f1'}
                      onChange={(e) => {
                        if (onUpdateCustomColor) {
                          onUpdateCustomColor(selectedColorTarget, e.target.value);
                          setDiffTheme('custom');
                        }
                      }}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-700 bg-transparent p-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {PRESET_COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.name}
                      onClick={() => {
                        if (onUpdateCustomColor) {
                          onUpdateCustomColor(selectedColorTarget, swatch.hex);
                          setDiffTheme('custom');
                        }
                      }}
                      className="w-full h-6 rounded-md border border-slate-700/80 hover:scale-110 hover:border-white transition-all cursor-pointer relative flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    >
                      {pal[selectedColorTarget]?.toLowerCase() === swatch.hex.toLowerCase() && (
                        <Check className="w-3 h-3 text-black drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Canvas Physics */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Curve Physics & Backdrop
              </span>

              {/* Stroke Width */}
              <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-300">Stroke Width:</span>
                <div className="flex items-center gap-1">
                  {[
                    { label: 'Fine', val: 1.8 },
                    { label: 'Bold', val: 2.8 },
                    { label: 'Ultra', val: 3.8 }
                  ].map(thick => (
                    <button
                      key={thick.label}
                      onClick={() => setEngineSettings(prev => ({ ...prev, strokeWidth: thick.val }))}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        engineSettings.strokeWidth === thick.val
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {thick.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curve Smoothing Filter */}
              <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-300">Smoothing:</span>
                <select
                  value={engineSettings.smoothingFilter || 'none'}
                  onChange={(e) => setEngineSettings(prev => ({ ...prev, smoothingFilter: e.target.value as SmoothingFilter }))}
                  className="bg-slate-800 text-slate-200 text-[10px] font-mono rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer"
                >
                  <option value="none">Raw (No Filter)</option>
                  <option value="savitzky-golay">Savitzky-Golay (5-pt)</option>
                  <option value="moving-avg">Moving Average (3-pt)</option>
                </select>
              </div>

              {/* Baseline Stripping */}
              <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-cyan-400" />
                  Strip Baseline:
                </span>
                <button
                  onClick={() => setEngineSettings(prev => ({ ...prev, stripBackground: !prev.stripBackground }))}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    engineSettings.stripBackground
                      ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {engineSettings.stripBackground ? 'STRIPPED' : 'RAW'}
                </button>
              </div>

              {/* Background Theme */}
              <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-300">Backdrop:</span>
                <select
                  value={engineSettings.bgTheme}
                  onChange={(e) => setEngineSettings(prev => ({ ...prev, bgTheme: e.target.value as ChartBackgroundTheme }))}
                  className="bg-slate-800 text-slate-200 text-[10px] font-mono rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer"
                >
                  <option value="dark-obsidian">Obsidian Dark</option>
                  <option value="deep-black">Pure OLED Black</option>
                  <option value="midnight-navy">Midnight Navy</option>
                  <option value="high-contrast-light">Crisp Light (Publication)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alignment & Scale Fine-Tuning Bar & Quick Zoom Presets */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-3 py-2 px-3.5 bg-[#030712] rounded-xl border border-slate-800/80 my-1.5 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap w-full xl:w-auto">
          {/* Shift 2Theta Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">Δ2θ Shift:</span>
            <button
              onClick={() => setShiftTwoTheta(Number((shiftTwoTheta - 0.05).toFixed(2)))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer shadow-sm"
              title="Shift -0.05° 2Theta"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-14 text-center font-bold text-cyan-400">
              {shiftTwoTheta > 0 ? `+${shiftTwoTheta.toFixed(2)}` : shiftTwoTheta.toFixed(2)}°
            </span>
            <button
              onClick={() => setShiftTwoTheta(Number((shiftTwoTheta + 0.05).toFixed(2)))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer shadow-sm"
              title="Shift +0.05° 2Theta"
            >
              <Plus className="w-3 h-3" />
            </button>
            {shiftTwoTheta !== 0 && (
              <button
                onClick={() => setShiftTwoTheta(0)}
                className="text-[10px] text-slate-500 hover:text-slate-300 ml-1 underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Scale Sample B Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">Scale B:</span>
            <button
              onClick={() => setScaleSampleB(Math.max(0.1, Number((scaleSampleB - 0.05).toFixed(2))))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer shadow-sm"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-12 text-center font-bold text-indigo-400">
              {(scaleSampleB * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setScaleSampleB(Math.min(3.0, Number((scaleSampleB + 0.05).toFixed(2))))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer shadow-sm"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Zoom Presets */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-bold text-[11px]">Zoom:</span>
            {[
              { label: 'Full (10-90°)', l: 10, r: 90 },
              { label: 'Low (10-35°)', l: 10, r: 35 },
              { label: 'Main (20-55°)', l: 20, r: 55 },
              { label: 'High (50-90°)', l: 50, r: 90 }
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => onZoomChange(preset.l, preset.r)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                  left === preset.l && right === preset.r
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-auto-align"
          onClick={onAutoAlign}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/40 hover:to-indigo-600/40 text-cyan-300 border border-cyan-500/50 rounded-lg font-bold transition-all cursor-pointer active:scale-95 shadow-sm hover:border-cyan-400 shrink-0"
        >
          <Sparkle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto Cross-Correlation Align</span>
        </button>
      </div>

      {/* Main Interactive Chart Display Area */}
      <div className="flex-1 min-h-[470px] mt-1 relative">
        <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true" focusable="false">
          <defs>
            <filter id="neonGlowA" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={pal.colorA} floodOpacity="0.85" />
            </filter>
            <filter id="neonGlowB" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={pal.colorB} floodOpacity="0.85" />
            </filter>
            <filter id="neonGlowDiff" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={pal.colorDiff} floodOpacity="0.6" />
            </filter>
          </defs>
        </svg>

        {/* Real-time Scientific Cursor HUD */}
        {liveCursorData && (
          <div className="absolute top-2 right-4 z-20 hidden md:flex items-center gap-2.5 px-3 py-1 rounded-lg bg-[#030712]/90 border border-slate-700/80 backdrop-blur-md text-[11px] font-mono shadow-xl pointer-events-none">
            <span className="flex items-center gap-1 font-bold text-slate-200">
              <Compass className="w-3 h-3 text-cyan-400" />
              2θ: <strong className="text-cyan-300">{liveCursorData.twoTheta.toFixed(2)}°</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              d: <strong className="text-emerald-300">{liveCursorData.dSpacing} Å</strong>
            </span>
            <span className="text-slate-600">|</span>
            {visibleCurves.showA && liveCursorData.intensityA !== null && (
              <span className="flex items-center gap-1 font-bold" style={{ color: pal.colorA }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorA }} />
                A: {liveCursorData.intensityA.toFixed(1)}%
              </span>
            )}
            {visibleCurves.showB && liveCursorData.intensityB !== null && (
              <span className="flex items-center gap-1 font-bold" style={{ color: pal.colorB }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                B: {liveCursorData.intensityB.toFixed(1)}%
              </span>
            )}
          </div>
        )}

        {/* VIEW 1: UNIFIED OVERLAY */}
        {(viewMode === 'unified' || viewMode === 'multiphase') && (
          <div className={`w-full h-[480px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner transition-colors`}>
            {/* Interactive Clickable Legend Header */}
            <div className="flex items-center justify-between mb-1 z-10 px-2 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <button 
                  onClick={() => toggleCurve('showA')}
                  className={`flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer transition-all ${
                    visibleCurves.showA ? 'opacity-100' : 'opacity-40 line-through'
                  }`}
                  style={{ color: pal.colorA }}
                >
                  <span className="w-3 h-1 rounded" style={{ backgroundColor: pal.colorA }} />
                  <span>Sample A: {materialAName}</span>
                </button>

                <button 
                  onClick={() => toggleCurve('showB')}
                  className={`flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer transition-all ${
                    visibleCurves.showB ? 'opacity-100' : 'opacity-40 line-through'
                  }`}
                  style={{ color: pal.colorB }}
                >
                  <span className="w-3 h-1 rounded border-b border-dashed" style={{ backgroundColor: pal.colorB }} />
                  <span>Ref B: {materialBName}</span>
                </button>

                {hasPhaseC && (
                  <button 
                    onClick={() => toggleCurve('showC')}
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer transition-all ${
                      visibleCurves.showC ? 'opacity-100' : 'opacity-40 line-through'
                    }`}
                    style={{ color: pal.colorC }}
                  >
                    <span className="w-3 h-1 rounded" style={{ backgroundColor: pal.colorC }} />
                    <span>Phase C: {materialCName || 'Secondary'}</span>
                  </button>
                )}

                {hasPhaseD && (
                  <button 
                    onClick={() => toggleCurve('showD')}
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer transition-all ${
                      visibleCurves.showD ? 'opacity-100' : 'opacity-40 line-through'
                    }`}
                    style={{ color: pal.colorD }}
                  >
                    <span className="w-3 h-1 rounded" style={{ backgroundColor: pal.colorD }} />
                    <span>Phase D: {materialDName || 'Tertiary'}</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
                Drag on chart to Zoom • Click in Caliper mode to measure
              </div>
            </div>

            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={points}
                  onMouseDown={handleChartMouseDown}
                  onMouseMove={handleChartMouseMove}
                  onMouseUp={handleZoom}
                  margin={{ top: 15, right: 20, bottom: 20, left: 10 }}
                >
                  {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.6} />}
                  <XAxis
                    dataKey="twoTheta"
                    type="number"
                    domain={[left, right]}
                    allowDataOverflow
                    stroke={bgStyle.axisLine}
                    tick={{ fill: bgStyle.axisText, fontSize: 11, fontFamily: 'monospace' }}
                    unit="°"
                  />
                  <YAxis
                    stroke={bgStyle.axisLine}
                    tick={{ fill: bgStyle.axisText, fontSize: 11, fontFamily: 'monospace' }}
                    unit="%"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Residual Area Fill */}
                  {showDiffArea && visibleCurves.showDiff && visibleCurves.showA && visibleCurves.showB && (
                    <Area
                      type={curveInterpolation}
                      dataKey="difference"
                      fill={pal.colorDiff}
                      fillOpacity={engineSettings.areaOpacity || 0.25}
                      stroke="none"
                      isAnimationActive={false}
                    />
                  )}

                  {/* Curve A */}
                  {visibleCurves.showA && (
                    <Line
                      type={curveInterpolation}
                      dataKey="intensityA"
                      stroke={pal.colorA}
                      strokeWidth={strokeW}
                      dot={false}
                      isAnimationActive={false}
                      filter={engineSettings.enableGlow ? 'url(#neonGlowA)' : undefined}
                    />
                  )}

                  {/* Curve B */}
                  {visibleCurves.showB && (
                    <Line
                      type={curveInterpolation}
                      dataKey="intensityB"
                      stroke={pal.colorB}
                      strokeWidth={strokeW}
                      strokeDasharray={dashB}
                      dot={false}
                      isAnimationActive={false}
                      filter={engineSettings.enableGlow ? 'url(#neonGlowB)' : undefined}
                    />
                  )}

                  {/* Phase C */}
                  {hasPhaseC && visibleCurves.showC && (
                    <Line
                      type={curveInterpolation}
                      dataKey="intensityC"
                      stroke={pal.colorC}
                      strokeWidth={Math.max(1.5, strokeW - 0.6)}
                      strokeDasharray="4 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* Phase D */}
                  {hasPhaseD && visibleCurves.showD && (
                    <Line
                      type={curveInterpolation}
                      dataKey="intensityD"
                      stroke={pal.colorD}
                      strokeWidth={Math.max(1.5, strokeW - 0.6)}
                      strokeDasharray="2 2"
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* Difference Line */}
                  {visibleCurves.showDiff && visibleCurves.showA && visibleCurves.showB && (
                    <Line
                      type={curveInterpolation}
                      dataKey="difference"
                      stroke={pal.colorDiff}
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}

                  {/* Bragg Reflection Stick Markers */}
                  {showPeakMarkers && peaksA.map((pk, idx) => (
                    pk.twoTheta >= left && pk.twoTheta <= right && (
                      <ReferenceLine
                        key={`pkA-${idx}`}
                        x={pk.twoTheta}
                        stroke={pal.colorA}
                        strokeDasharray="2 2"
                        strokeWidth={1.2}
                        label={{
                          value: pk.hkl ? `(${pk.hkl})` : `${pk.twoTheta.toFixed(1)}°`,
                          position: 'top',
                          fill: pal.colorA,
                          fontSize: 9,
                          fontFamily: 'monospace'
                        }}
                      />
                    )
                  ))}

                  {showPeakMarkers && peaksB.map((pk, idx) => {
                    const shiftedPos = pk.twoTheta + shiftTwoTheta;
                    return shiftedPos >= left && shiftedPos <= right && (
                      <ReferenceLine
                        key={`pkB-${idx}`}
                        x={shiftedPos}
                        stroke={pal.colorB}
                        strokeDasharray="2 2"
                        strokeWidth={1.2}
                        label={{
                          value: pk.hkl ? `[${pk.hkl}]` : `${shiftedPos.toFixed(1)}°`,
                          position: 'bottom',
                          fill: pal.colorB,
                          fontSize: 9,
                          fontFamily: 'monospace'
                        }}
                      />
                    );
                  })}

                  {/* Caliper Reference Markers & Highlight Area */}
                  {caliperP1 && (
                    <ReferenceLine
                      x={caliperP1.twoTheta}
                      stroke="#22d3ee"
                      strokeWidth={2.2}
                      strokeDasharray="4 3"
                      label={{
                        value: `C1: ${caliperP1.twoTheta.toFixed(2)}°`,
                        position: 'insideTopLeft',
                        fill: '#22d3ee',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                      }}
                    />
                  )}

                  {caliperP2 && (
                    <ReferenceLine
                      x={caliperP2.twoTheta}
                      stroke="#f43f5e"
                      strokeWidth={2.2}
                      strokeDasharray="4 3"
                      label={{
                        value: `C2: ${caliperP2.twoTheta.toFixed(2)}°`,
                        position: 'insideTopRight',
                        fill: '#f43f5e',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                      }}
                    />
                  )}

                  {caliperP1 && caliperP2 && (
                    <ReferenceArea
                      x1={Math.min(caliperP1.twoTheta, caliperP2.twoTheta)}
                      x2={Math.max(caliperP1.twoTheta, caliperP2.twoTheta)}
                      fill="#10b981"
                      fillOpacity={0.12}
                    />
                  )}

                  {/* Zoom Dragging Selection Box */}
                  {refAreaLeft && refAreaRight && (
                    <ReferenceArea
                      x1={refAreaLeft}
                      x2={refAreaRight}
                      strokeOpacity={0.4}
                      fill="#38bdf8"
                      fillOpacity={0.25}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 2: DUAL-SPLIT SIDE-BY-SIDE */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[480px]">
            {/* Split Left: Sample A */}
            <div className={`h-full ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-3 flex flex-col shadow-inner`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono font-bold" style={{ color: pal.colorA }}>
                  Experimental Sample A: {materialAName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">100% Normalized</span>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.6} />}
                    <XAxis dataKey="twoTheta" type="number" domain={[left, right]} stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 10 }} unit="°" />
                    <YAxis stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 10 }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type={curveInterpolation} dataKey="intensityA" stroke={pal.colorA} strokeWidth={strokeW} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split Right: Reference B */}
            <div className={`h-full ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-3 flex flex-col shadow-inner`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono font-bold" style={{ color: pal.colorB }}>
                  Reference B: {materialBName} {shiftTwoTheta !== 0 ? `(Shifted ${shiftTwoTheta > 0 ? `+${shiftTwoTheta}` : shiftTwoTheta}°)` : ''}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{(scaleSampleB * 100).toFixed(0)}% Scale</span>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.6} />}
                    <XAxis dataKey="twoTheta" type="number" domain={[left, right]} stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 10 }} unit="°" />
                    <YAxis stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 10 }} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type={curveInterpolation} dataKey="intensityB" stroke={pal.colorB} strokeWidth={strokeW} strokeDasharray={dashB} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: STACKED 3-PANE */}
        {viewMode === 'stacked' && (
          <div className="grid grid-rows-3 gap-2 h-[520px]">
            {/* Row 1: Sample A */}
            <div className={`${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 flex flex-col shadow-inner`}>
              <span className="text-[11px] font-mono font-bold px-2" style={{ color: pal.colorA }}>
                (1) Sample A: {materialAName}
              </span>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 5, left: 5 }}>
                    {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.5} />}
                    <XAxis dataKey="twoTheta" domain={[left, right]} hide />
                    <YAxis stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 9 }} unit="%" />
                    <Line type={curveInterpolation} dataKey="intensityA" stroke={pal.colorA} strokeWidth={2.4} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2: Reference B */}
            <div className={`${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 flex flex-col shadow-inner`}>
              <span className="text-[11px] font-mono font-bold px-2" style={{ color: pal.colorB }}>
                (2) Reference B: {materialBName}
              </span>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 5, left: 5 }}>
                    {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.5} />}
                    <XAxis dataKey="twoTheta" domain={[left, right]} hide />
                    <YAxis stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 9 }} unit="%" />
                    <Line type={curveInterpolation} dataKey="intensityB" stroke={pal.colorB} strokeWidth={2.4} strokeDasharray={dashB} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 3: Difference Residual */}
            <div className={`${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 flex flex-col shadow-inner`}>
              <span className="text-[11px] font-mono font-bold px-2" style={{ color: pal.colorDiff }}>
                (3) Difference Residual (A - B)
              </span>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 20, left: 5 }}>
                    {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.5} />}
                    <XAxis dataKey="twoTheta" domain={[left, right]} stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 10 }} unit="°" />
                    <YAxis stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 9 }} unit="%" />
                    <Line type={curveInterpolation} dataKey="difference" stroke={pal.colorDiff} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: BUTTERFLY MIRRORED */}
        {viewMode === 'mirrored' && (
          <div className={`w-full h-[480px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner`}>
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="text-xs font-mono font-bold flex items-center gap-2">
                <span style={{ color: pal.colorA }}>▲ +{materialAName} (Upper)</span>
                <span className="text-slate-600">vs</span>
                <span style={{ color: pal.colorB }}>▼ -{materialBName} (Mirrored Lower)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">Peak-to-Peak Butterfly Symmetry</span>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                  {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 11 }} unit="°" />
                  <YAxis stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 11 }} domain={[-100, 100]} unit="%" />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type={curveInterpolation} dataKey="intensityA" fill={pal.colorA} fillOpacity={0.3} stroke={pal.colorA} strokeWidth={2.2} dot={false} />
                  <Area type={curveInterpolation} dataKey="mirroredB" fill={pal.colorB} fillOpacity={0.3} stroke={pal.colorB} strokeWidth={2.2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 5: FIRST DERIVATIVE */}
        {viewMode === 'derivative' && (
          <div className={`w-full h-[480px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner`}>
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="text-xs font-mono font-bold flex items-center gap-2">
                <span style={{ color: pal.colorA }}>d(IA)/d(2θ)</span>
                <span className="text-slate-600">vs</span>
                <span style={{ color: pal.colorB }}>d(IB)/d(2θ)</span>
              </span>
              <span className="text-[11px] font-mono text-amber-400">Zero-Crossing Inflection Point & FWHM Analysis</span>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 15, right: 20, bottom: 20, left: 10 }}>
                  {showGrid && <CartesianGrid stroke={bgStyle.grid} strokeDasharray="3 3" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 11 }} unit="°" />
                  <YAxis stroke={bgStyle.axisLine} tick={{ fill: bgStyle.axisText, fontSize: 11 }} unit="ΔI/Δθ" />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type={curveInterpolation} dataKey="derivA" stroke={pal.colorA} strokeWidth={2.2} dot={false} isAnimationActive={false} />
                  <Line type={curveInterpolation} dataKey="derivB" stroke={pal.colorB} strokeWidth={2.2} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* MINI-MAP SPECTRUM NAVIGATION STRIP (BRUSH OVERVIEW) */}
      <div className="mt-3 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span className="font-bold flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            Full Spectrum Domain Overview (10° - 90° 2θ)
          </span>
          <span className="text-cyan-300">
            Active Viewport: <strong className="text-white">{left}° - {right}°</strong> (Span: {right - left}°)
          </span>
        </div>

        <div 
          ref={miniMapRef}
          onClick={handleMiniMapClick}
          className="w-full h-10 bg-[#030712] rounded-lg border border-slate-800 relative cursor-crosshair overflow-hidden shadow-inner flex items-center"
          title="Click anywhere on the spectrum overview to center zoom domain"
        >
          {/* Miniature Spectrum Trace */}
          <div className="w-full h-full opacity-60 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
                <Line type="linear" dataKey="intensityA" stroke={pal.colorA} strokeWidth={1} dot={false} isAnimationActive={false} />
                <Line type="linear" dataKey="intensityB" stroke={pal.colorB} strokeWidth={1} strokeDasharray="2 2" dot={false} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Active Viewport Shaded Window Indicator */}
          <div 
            className="absolute top-0 bottom-0 bg-cyan-500/20 border-x-2 border-cyan-400 pointer-events-none shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-between px-1"
            style={{
              left: `${((left - 10) / (90 - 10)) * 100}%`,
              width: `${((right - left) / (90 - 10)) * 100}%`
            }}
          >
            <span className="w-1 h-4 bg-cyan-400 rounded-full" />
            <span className="w-1 h-4 bg-cyan-400 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
