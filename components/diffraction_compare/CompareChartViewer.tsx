import React, { useState, useRef, useMemo } from 'react';
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
  Bookmark
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
  CurveVisibilityFilter
} from './types';
import { 
  getActivePalette, 
  THEME_PALETTES, 
  PRESET_COLOR_SWATCHES,
  exportCompareDataAsCSV 
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
  hasPhaseD
}) => {
  const { t } = useTranslation();
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isColorStudioOpen, setIsColorStudioOpen] = useState(false);
  const [selectedColorTarget, setSelectedColorTarget] = useState<keyof CurveColorPalette>('colorA');
  const [curveInterpolation, setCurveInterpolation] = useState<'monotone' | 'linear'>('monotone');
  
  // Curve Visibility Engine State (Single Curve / Reference / Material / Compare)
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

  // Curve filter selection handler
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
      // Safety guard: ensure at least one main curve remains visible
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
    if (e && e.activeLabel !== undefined && e.activeLabel !== null) {
      const val = typeof e.activeLabel === 'number' ? e.activeLabel : parseFloat(String(e.activeLabel));
      if (!isNaN(val)) setRefAreaLeft(val);
    }
  };

  const handleChartMouseMove = (e: any) => {
    if (refAreaLeft !== null && e && e.activeLabel !== undefined && e.activeLabel !== null) {
      const val = typeof e.activeLabel === 'number' ? e.activeLabel : parseFloat(String(e.activeLabel));
      if (!isNaN(val)) setRefAreaRight(val);
    }
    if (e && e.activePayload && e.activePayload.length) {
      const theta = Number(e.activeLabel);
      const thetaRad = (theta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? (1.5406 / (2 * Math.sin(thetaRad))).toFixed(4) : '-';
      const qVector = thetaRad > 0 ? ((4 * Math.PI * Math.sin(thetaRad)) / 1.5406).toFixed(4) : '-';

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

  const handleExportCSV = () => {
    exportCompareDataAsCSV(points, materialAName, materialBName, hasPhaseC ? materialCName : undefined, hasPhaseD ? materialDName : undefined);
  };

  // Custom High-Precision Scientific Tooltip (Filtering for visible curves)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const theta = Number(label);
      const thetaRad = (theta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? (1.5406 / (2 * Math.sin(thetaRad))).toFixed(4) : '-';
      const qVector = thetaRad > 0 ? ((4 * Math.PI * Math.sin(thetaRad)) / 1.5406).toFixed(4) : '-';

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
                  <span>Δ Residual (A - Calc):</span>
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

  // Curve stroke properties based on settings
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
        {/* Left: View Mode Tabs */}
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

        {/* Right: Color Studio, Contrast Controls, Residual, Grid, Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Custom Color & Contrast Studio Button */}
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
            <span>Color & Curve Studio</span>
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
            title="Toggle Difference Area Fill (Sample A vs Reference Model)"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Δ Residual Fill</span>
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

          {/* Preset: Both (Compare) */}
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

          {/* Preset: Only Material A */}
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

          {/* Preset: Only Reference B */}
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

          {/* Preset: All (Multi-Phase) */}
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

        {/* Right: Fine-Grained Individual Curve Toggle Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Toggles:</span>

          {/* Toggle Sample A */}
          <button
            id="toggle-curve-a"
            onClick={() => toggleCurve('showA')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
              visibleCurves.showA
                ? 'bg-slate-800 border-cyan-500/60 text-cyan-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
            }`}
            title="Toggle Sample A visibility"
          >
            {visibleCurves.showA ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
            <span>A</span>
          </button>

          {/* Toggle Reference B */}
          <button
            id="toggle-curve-b"
            onClick={() => toggleCurve('showB')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
              visibleCurves.showB
                ? 'bg-slate-800 border-indigo-500/60 text-indigo-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
            }`}
            title="Toggle Reference B visibility"
          >
            {visibleCurves.showB ? <Eye className="w-3 h-3 text-indigo-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
            <span>B</span>
          </button>

          {/* Toggle Phase C */}
          {hasPhaseC && (
            <button
              id="toggle-curve-c"
              onClick={() => toggleCurve('showC')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                visibleCurves.showC
                  ? 'bg-slate-800 border-emerald-500/60 text-emerald-300 shadow-sm'
                  : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
              }`}
              title="Toggle Phase C visibility"
            >
              {visibleCurves.showC ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorC }} />
              <span>C</span>
            </button>
          )}

          {/* Toggle Phase D */}
          {hasPhaseD && (
            <button
              id="toggle-curve-d"
              onClick={() => toggleCurve('showD')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                visibleCurves.showD
                  ? 'bg-slate-800 border-amber-500/60 text-amber-300 shadow-sm'
                  : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
              }`}
              title="Toggle Phase D visibility"
            >
              {visibleCurves.showD ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorD }} />
              <span>D</span>
            </button>
          )}

          {/* Toggle Difference Residual */}
          <button
            id="toggle-curve-diff"
            onClick={() => toggleCurve('showDiff')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
              visibleCurves.showDiff
                ? 'bg-slate-800 border-pink-500/60 text-pink-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-850 text-slate-600 line-through'
            }`}
            title="Toggle Δ Residual curve visibility"
          >
            {visibleCurves.showDiff ? <Eye className="w-3 h-3 text-pink-400" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pal.colorDiff }} />
            <span>Δ Diff</span>
          </button>
        </div>
      </div>

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

            {/* Column 2: Individual Curve Color Overrides & Swatches */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Curve Color Picker
              </span>

              {/* Target selector buttons */}
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

              {/* Quick Swatches + Native Hex Picker */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400">Color for <strong className="text-cyan-400">{selectedColorTarget}</strong>:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">Custom Hex:</span>
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
                      title="Choose Custom Color"
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

            {/* Column 3: Contrast, Stroke Thickness, Glow, Background Theme */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Curve Physics & Canvas Backdrop
              </span>

              {/* Stroke Width / Thickness */}
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

              {/* Curve Interpolation */}
              <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-300">Spline Curve:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurveInterpolation('monotone')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      curveInterpolation === 'monotone'
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Smooth (Cubic)
                  </button>
                  <button
                    onClick={() => setCurveInterpolation('linear')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      curveInterpolation === 'linear'
                        ? 'bg-cyan-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Linear (Raw)
                  </button>
                </div>
              </div>

              {/* Glow Filter Toggle */}
              <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Laser Glow Filter:
                </span>
                <button
                  onClick={() => setEngineSettings(prev => ({ ...prev, enableGlow: !prev.enableGlow }))}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    engineSettings.enableGlow
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {engineSettings.enableGlow ? 'ACTIVE' : 'OFF'}
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
                title="Reset Shift to 0°"
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
        {/* SVG Filters & Gradients for High-Contrast Luminescent Graphics */}
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

        {/* Real-time Scientific Cursor HUD Overlay */}
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

        {/* VIEW 1: UNIFIED OVERLAY WITH INTERACTIVE CLICKABLE LEGEND */}
        {(viewMode === 'unified' || viewMode === 'multiphase') && (
          <div className={`w-full h-[480px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner transition-colors`}>
            {/* Interactive Clickable Legend Header */}
            <div className="flex items-center justify-between mb-1 z-10 px-2 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Sample A Legend item (clickable toggle) */}
                <button 
                  onClick={() => toggleCurve('showA')}
                  className={`flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer rounded px-1.5 py-0.5 ${
                    visibleCurves.showA ? 'opacity-100 hover:opacity-80' : 'opacity-40 line-through hover:opacity-60 bg-slate-900/50'
                  }`}
                  style={{ color: pal.colorA }}
                  title="Click to toggle Sample A curve"
                >
                  {visibleCurves.showA ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                  <span className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: pal.colorA }} />
                  <span>{materialAName} (A)</span>
                </button>

                {/* Reference B Legend item (clickable toggle) */}
                <button 
                  onClick={() => toggleCurve('showB')}
                  className={`flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer rounded px-1.5 py-0.5 ${
                    visibleCurves.showB ? 'opacity-100 hover:opacity-80' : 'opacity-40 line-through hover:opacity-60 bg-slate-900/50'
                  }`}
                  style={{ color: pal.colorB }}
                  title="Click to toggle Reference B curve"
                >
                  {visibleCurves.showB ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                  <span className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: pal.colorB }} />
                  <span>{materialBName} (B)</span>
                </button>

                {/* Phase C Legend item */}
                {hasPhaseC && (
                  <button 
                    onClick={() => toggleCurve('showC')}
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer rounded px-1.5 py-0.5 ${
                      visibleCurves.showC ? 'opacity-100 hover:opacity-80' : 'opacity-40 line-through hover:opacity-60 bg-slate-900/50'
                    }`}
                    style={{ color: pal.colorC }}
                    title="Click to toggle Phase C curve"
                  >
                    {visibleCurves.showC ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                    <span className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: pal.colorC }} />
                    <span>{materialCName || 'Phase C'}</span>
                  </button>
                )}

                {/* Phase D Legend item */}
                {hasPhaseD && (
                  <button 
                    onClick={() => toggleCurve('showD')}
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer rounded px-1.5 py-0.5 ${
                      visibleCurves.showD ? 'opacity-100 hover:opacity-80' : 'opacity-40 line-through hover:opacity-60 bg-slate-900/50'
                    }`}
                    style={{ color: pal.colorD }}
                    title="Click to toggle Phase D curve"
                  >
                    {visibleCurves.showD ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                    <span className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: pal.colorD }} />
                    <span>{materialDName || 'Phase D'}</span>
                  </button>
                )}

                {(hasPhaseC || hasPhaseD) && visibleCurves.showTotalModel && (
                  <button 
                    onClick={() => toggleCurve('showTotalModel')}
                    className={`flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 transition-all cursor-pointer rounded px-1.5 py-0.5 ${
                      visibleCurves.showTotalModel ? 'opacity-100' : 'opacity-40 line-through'
                    }`}
                  >
                    <span className="w-2.5 h-1 border-t-2 border-dashed border-white" />
                    <span>Composite Model</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] font-mono text-slate-400 font-bold">
                Drag to zoom | Click legend items to toggle curve
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={points}
                margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                onMouseDown={handleChartMouseDown}
                onMouseMove={handleChartMouseMove}
                onMouseUp={handleZoom}
                onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); setLiveCursorData(null); }}
              >
                <defs>
                  <linearGradient id="colorA_grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.45} />
                    <stop offset="60%" stopColor={pal.colorA} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={pal.colorA} stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorB_grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={pal.colorB} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDiffPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pal.posDiff} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={pal.posDiff} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorDiffNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pal.negDiff} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={pal.negDiff} stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.75} />}
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[left, right]} 
                  allowDataOverflow={true} 
                  tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: bgStyle.axisLine }} 
                  tickLine={{ stroke: bgStyle.axisLine }} 
                  label={{ value: 'Diffraction Angle [°2θ (Cu-Kα)]', position: 'bottom', offset: 5, fill: bgStyle.axisText, fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <YAxis 
                  domain={[0, 115]} 
                  tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: bgStyle.axisLine }} 
                  tickLine={{ stroke: bgStyle.axisLine }} 
                  label={{ value: 'Normalized Intensity [a.u.]', angle: -90, position: 'left', offset: 0, fill: bgStyle.axisText, fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Optional Residual Shaded Area (shown if enabled & diff active) */}
                {showDiffArea && visibleCurves.showDiff && visibleCurves.showA && visibleCurves.showB && (
                  <Area type={curveInterpolation} dataKey="posDiff" fill="url(#colorDiffPos)" stroke="none" isAnimationActive={false} />
                )}

                {/* Sample A Primary Trace */}
                {visibleCurves.showA && (
                  <Area 
                    type={curveInterpolation} 
                    dataKey="intensityA" 
                    fill="url(#colorA_grad)" 
                    stroke={pal.colorA} 
                    strokeWidth={strokeW} 
                    dot={false} 
                    isAnimationActive={false}
                    filter={engineSettings.enableGlow ? 'url(#neonGlowA)' : undefined}
                  />
                )}

                {/* Reference Model B Trace */}
                {visibleCurves.showB && (
                  <Line 
                    type={curveInterpolation} 
                    dataKey="intensityB" 
                    stroke={pal.colorB} 
                    strokeWidth={strokeW} 
                    strokeDasharray={dashB || (hasPhaseC ? '5 4' : undefined)} 
                    dot={false} 
                    isAnimationActive={false}
                    filter={engineSettings.enableGlow ? 'url(#neonGlowB)' : undefined}
                  />
                )}

                {/* Optional Phase C trace */}
                {hasPhaseC && visibleCurves.showC && (
                  <Line type={curveInterpolation} dataKey="intensityC" stroke={pal.colorC} strokeWidth={Math.max(1.8, strokeW - 0.6)} dot={false} isAnimationActive={false} />
                )}

                {/* Optional Phase D trace */}
                {hasPhaseD && visibleCurves.showD && (
                  <Line type={curveInterpolation} dataKey="intensityD" stroke={pal.colorD} strokeWidth={Math.max(1.8, strokeW - 0.6)} dot={false} isAnimationActive={false} />
                )}

                {/* Total Model (if multiphase) */}
                {(hasPhaseC || hasPhaseD) && visibleCurves.showTotalModel && (
                  <Line type={curveInterpolation} dataKey="intensityTotalModel" stroke={pal.colorTotalModel || '#ffffff'} strokeWidth={1.8} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                )}

                {/* Peak Reflection Markers / Sticks for Sample A */}
                {showPeakMarkers && visibleCurves.showA && peaksA.filter(p => p.twoTheta >= left && p.twoTheta <= right).map((p, idx) => (
                  <ReferenceLine
                    key={`pA_${idx}`}
                    x={p.twoTheta}
                    stroke={pal.colorA}
                    strokeDasharray="2 2"
                    strokeWidth={1.2}
                    label={p.hkl ? { value: p.hkl, position: 'top', fill: pal.colorA, fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' } : undefined}
                  />
                ))}

                {/* Peak Reflection Markers / Sticks for Reference B */}
                {showPeakMarkers && visibleCurves.showB && peaksB.filter(p => p.twoTheta >= left && p.twoTheta <= right).map((p, idx) => (
                  <ReferenceLine
                    key={`pB_${idx}`}
                    x={p.twoTheta}
                    stroke={pal.colorB}
                    strokeDasharray="1 3"
                    strokeWidth={1.2}
                  />
                ))}

                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.6} fill="#6366f1" fillOpacity={0.25} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VIEW 2: DUAL SYNCHRONIZED SPLIT SCREEN */}
        {viewMode === 'split' && (
          <div className={`w-full grid gap-3 ${
            visibleCurves.showA && visibleCurves.showB ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* Split Left: Sample A */}
            {visibleCurves.showA && (
              <div className={`w-full h-[470px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner`}>
                <div className="flex items-center justify-between mb-1 z-10 px-2">
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorA }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                    Sample A: {materialAName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Experimental Trace</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={points}
                    margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                    onMouseDown={handleChartMouseDown}
                    onMouseMove={handleChartMouseMove}
                    onMouseUp={handleZoom}
                    onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                  >
                    <defs>
                      <linearGradient id="split_colorA_grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.45} />
                        <stop offset="95%" stopColor={pal.colorA} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.7} />}
                    <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} axisLine={{ stroke: bgStyle.axisLine }} />
                    <YAxis domain={[0, 115]} tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} axisLine={{ stroke: bgStyle.axisLine }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type={curveInterpolation} dataKey="intensityA" fill="url(#split_colorA_grad)" stroke={pal.colorA} strokeWidth={strokeW} dot={false} isAnimationActive={false} filter={engineSettings.enableGlow ? 'url(#neonGlowA)' : undefined} />
                    {showPeakMarkers && peaksA.filter(p => p.twoTheta >= left && p.twoTheta <= right).map((p, idx) => (
                      <ReferenceLine key={`pA_split_${idx}`} x={p.twoTheta} stroke={pal.colorA} strokeDasharray="2 2" strokeWidth={1.2} label={p.hkl ? { value: p.hkl, position: 'top', fill: pal.colorA, fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' } : undefined} />
                    ))}
                    {refAreaLeft && refAreaRight ? <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.6} fill="#6366f1" fillOpacity={0.25} /> : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Split Right: Reference B */}
            {visibleCurves.showB && (
              <div className={`w-full h-[470px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner`}>
                <div className="flex items-center justify-between mb-1 z-10 px-2">
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorB }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                    Reference B: {materialBName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Reference Model</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={points}
                    margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                    onMouseDown={handleChartMouseDown}
                    onMouseMove={handleChartMouseMove}
                    onMouseUp={handleZoom}
                    onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                  >
                    <defs>
                      <linearGradient id="split_colorB_grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.45} />
                        <stop offset="95%" stopColor={pal.colorB} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.7} />}
                    <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} axisLine={{ stroke: bgStyle.axisLine }} />
                    <YAxis domain={[0, 115]} tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} axisLine={{ stroke: bgStyle.axisLine }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type={curveInterpolation} dataKey="intensityB" fill="url(#split_colorB_grad)" stroke={pal.colorB} strokeWidth={strokeW} dot={false} isAnimationActive={false} filter={engineSettings.enableGlow ? 'url(#neonGlowB)' : undefined} />
                    {showPeakMarkers && peaksB.filter(p => p.twoTheta >= left && p.twoTheta <= right).map((p, idx) => (
                      <ReferenceLine key={`pB_split_${idx}`} x={p.twoTheta} stroke={pal.colorB} strokeDasharray="2 2" strokeWidth={1.2} label={p.hkl ? { value: p.hkl, position: 'top', fill: pal.colorB, fontSize: 9, fontFamily: 'monospace', fontWeight: 'bold' } : undefined} />
                    ))}
                    {refAreaLeft && refAreaRight ? <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.6} fill="#6366f1" fillOpacity={0.25} /> : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: BUTTERFLY MIRRORED VIEW */}
        {viewMode === 'mirrored' && (
          <div className={`w-full h-[480px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner transition-colors`}>
            <div className="flex items-center justify-between mb-1 z-10 px-2">
              <div className="flex items-center gap-3">
                {visibleCurves.showA && (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorA }}>
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: pal.colorA }} />
                    {materialAName} (Top Hemisphere +)
                  </span>
                )}
                {visibleCurves.showB && (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorB }}>
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: pal.colorB }} />
                    {materialBName} (Mirrored Bottom -)
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Butterfly Dual-Hemisphere Reflection
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={points}
                margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                onMouseDown={handleChartMouseDown}
                onMouseMove={handleChartMouseMove}
                onMouseUp={handleZoom}
                onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.7} />}
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[left, right]} 
                  allowDataOverflow={true} 
                  tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} 
                  axisLine={{ stroke: bgStyle.axisLine }} 
                  tickLine={{ stroke: bgStyle.axisLine }} 
                  label={{ value: 'Diffraction Angle [°2θ (Cu-Kα)]', position: 'bottom', offset: 5, fill: bgStyle.axisText, fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <YAxis domain={[-110, 110]} tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} axisLine={{ stroke: bgStyle.axisLine }} tickLine={{ stroke: bgStyle.axisLine }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />

                {visibleCurves.showA && (
                  <Line type={curveInterpolation} dataKey="intensityA" stroke={pal.colorA} strokeWidth={strokeW} dot={false} isAnimationActive={false} filter={engineSettings.enableGlow ? 'url(#neonGlowA)' : undefined} />
                )}
                {visibleCurves.showB && (
                  <Line type={curveInterpolation} dataKey="mirroredB" stroke={pal.colorB} strokeWidth={strokeW} dot={false} isAnimationActive={false} filter={engineSettings.enableGlow ? 'url(#neonGlowB)' : undefined} />
                )}

                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.6} fill="#6366f1" fillOpacity={0.25} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VIEW 4: 1ST DERIVATIVE */}
        {viewMode === 'derivative' && (
          <div className={`w-full h-[480px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner transition-colors`}>
            <div className="flex items-center justify-between mb-1 z-10 px-2">
              <div className="flex items-center gap-3">
                {visibleCurves.showA && (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorA }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                    dI/d2θ ({materialAName})
                  </span>
                )}
                {visibleCurves.showB && (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorB }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                    dI/d2θ ({materialBName})
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                Inflection & Asymmetry Analysis (1st Derivative)
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={points}
                margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                onMouseDown={handleChartMouseDown}
                onMouseMove={handleChartMouseMove}
                onMouseUp={handleZoom}
                onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
              >
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.7} />}
                <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} axisLine={{ stroke: bgStyle.axisLine }} tickLine={{ stroke: bgStyle.axisLine }} />
                <YAxis tick={{ fontSize: 10, fill: bgStyle.axisText, fontFamily: 'monospace' }} axisLine={{ stroke: bgStyle.axisLine }} tickLine={{ stroke: bgStyle.axisLine }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} strokeDasharray="2 2" />

                {visibleCurves.showA && (
                  <Line type={curveInterpolation} dataKey="derivA" stroke={pal.colorA} strokeWidth={strokeW - 0.4} dot={false} isAnimationActive={false} />
                )}
                {visibleCurves.showB && (
                  <Line type={curveInterpolation} dataKey="derivB" stroke={pal.colorB} strokeWidth={strokeW - 0.4} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                )}

                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.6} fill="#a855f7" fillOpacity={0.25} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VIEW 5: 3-PANE STACKED VIEW */}
        {viewMode === 'stacked' && (
          <div className="w-full flex flex-col gap-3">
            {/* Pane 1: Sample A */}
            {visibleCurves.showA && (
              <div className={`w-full h-[180px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner`}>
                <div className="flex items-center justify-between mb-1 z-10 px-2">
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorA }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorA }} />
                    Sample A: {materialAName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Pane 1 (Experimental)</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 15, left: 10 }}>
                    <defs>
                      <linearGradient id="stack_colorA_grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={pal.colorA} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.7} />}
                    <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: bgStyle.axisText, fontFamily: 'monospace' }} />
                    <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: bgStyle.axisText, fontFamily: 'monospace' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type={curveInterpolation} dataKey="intensityA" fill="url(#stack_colorA_grad)" stroke={pal.colorA} strokeWidth={strokeW} dot={false} isAnimationActive={false} filter={engineSettings.enableGlow ? 'url(#neonGlowA)' : undefined} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pane 2: Sample B */}
            {visibleCurves.showB && (
              <div className={`w-full h-[180px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner`}>
                <div className="flex items-center justify-between mb-1 z-10 px-2">
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorB }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                    Sample B: {materialBName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Pane 2 (Reference Standard)</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 15, left: 10 }}>
                    <defs>
                      <linearGradient id="stack_colorB_grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={pal.colorB} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.7} />}
                    <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: bgStyle.axisText, fontFamily: 'monospace' }} />
                    <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: bgStyle.axisText, fontFamily: 'monospace' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type={curveInterpolation} dataKey="intensityB" fill="url(#stack_colorB_grad)" stroke={pal.colorB} strokeWidth={strokeW} dot={false} isAnimationActive={false} filter={engineSettings.enableGlow ? 'url(#neonGlowB)' : undefined} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Pane 3: Residual Profile */}
            {visibleCurves.showDiff && visibleCurves.showA && visibleCurves.showB && (
              <div className={`w-full h-[140px] ${bgStyle.bg} rounded-xl border ${bgStyle.border} p-2 relative flex flex-col shadow-inner`}>
                <div className="flex items-center justify-between mb-1 z-10 px-2">
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                    <Sparkles className="w-3.5 h-3.5" />
                    Δ Residual Profile (I_Obs - I_Calc)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Pane 3 (Residual Differential)</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 20, left: 10 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={bgStyle.grid} opacity={0.7} />}
                    <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: bgStyle.axisText, fontFamily: 'monospace' }} />
                    <YAxis domain={[-80, 80]} tick={{ fontSize: 9, fill: bgStyle.axisText, fontFamily: 'monospace' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                    <Line type={curveInterpolation} dataKey="difference" stroke={pal.colorDiff} strokeWidth={strokeW} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
