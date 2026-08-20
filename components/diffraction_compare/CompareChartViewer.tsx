import React, { useState } from 'react';
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
  Sliders,
  Palette,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  Plus,
  Minus,
  Sparkle
} from 'lucide-react';
import { ProfilePoint, CompareViewMode, DiffTheme, PeakItem } from './types';

interface CompareChartViewerProps {
  points: ProfilePoint[];
  viewMode: CompareViewMode;
  setViewMode: (mode: CompareViewMode) => void;
  diffTheme: DiffTheme;
  setDiffTheme: (theme: DiffTheme) => void;
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
  const [hoverData, setHoverData] = useState<any | null>(null);

  // Color theme palette generator
  const getThemePalette = () => {
    switch (diffTheme) {
      case 'emerald':
        return { colorA: '#10b981', colorB: '#06b6d4', colorC: '#a855f7', colorD: '#f43f5e', colorDiff: '#f59e0b', posDiff: '#10b981', negDiff: '#ef4444' };
      case 'amber':
        return { colorA: '#f59e0b', colorB: '#ec4899', colorC: '#8b5cf6', colorD: '#06b6d4', colorDiff: '#06b6d4', posDiff: '#f59e0b', negDiff: '#ec4899' };
      case 'cyan':
        return { colorA: '#06b6d4', colorB: '#f43f5e', colorC: '#eab308', colorD: '#a855f7', colorDiff: '#10b981', posDiff: '#06b6d4', negDiff: '#f43f5e' };
      case 'monochrome':
        return { colorA: '#e2e8f0', colorB: '#94a3b8', colorC: '#64748b', colorD: '#475569', colorDiff: '#f43f5e', posDiff: '#cbd5e1', negDiff: '#64748b' };
      case 'cyberpunk':
        return { colorA: '#00ffcc', colorB: '#ff007f', colorC: '#ffe600', colorD: '#9d00ff', colorDiff: '#00f0ff', posDiff: '#00ffcc', negDiff: '#ff007f' };
      case 'neon':
      default:
        return { colorA: '#6366f1', colorB: '#06b6d4', colorC: '#d946ef', colorD: '#f59e0b', colorDiff: '#f43f5e', posDiff: '#10b981', negDiff: '#f43f5e' };
    }
  };

  const pal = getThemePalette();

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
      setHoverData({
        twoTheta: Number(e.activeLabel),
        payload: e.activePayload
      });
    }
  };

  // Custom Scientific HUD Tooltip
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
        <div className="bg-[#030712]/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono min-w-[220px] pointer-events-none z-50">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-slate-200">2θ = {theta.toFixed(2)}°</span>
            <span className="text-[10px] text-cyan-400 font-bold">d = {dSpacing} Å</span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center" style={{ color: pal.colorA }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorA }} />
                <span>{materialAName} (A):</span>
              </span>
              <span className="font-bold">{typeof valA === 'number' ? valA.toFixed(1) : valA}%</span>
            </div>

            <div className="flex justify-between items-center" style={{ color: pal.colorB }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                <span>{materialBName} (B):</span>
              </span>
              <span className="font-bold">{typeof valB === 'number' ? valB.toFixed(1) : valB}%</span>
            </div>

            {hasPhaseC && valC !== undefined && (
              <div className="flex justify-between items-center" style={{ color: pal.colorC }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorC }} />
                  <span>{materialCName || 'Phase C'}:</span>
                </span>
                <span className="font-bold">{typeof valC === 'number' ? valC.toFixed(1) : valC}%</span>
              </div>
            )}

            {hasPhaseD && valD !== undefined && (
              <div className="flex justify-between items-center" style={{ color: pal.colorD }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorD }} />
                  <span>{materialDName || 'Phase D'}:</span>
                </span>
                <span className="font-bold">{typeof valD === 'number' ? valD.toFixed(1) : valD}%</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-slate-800" style={{ color: pal.colorDiff }}>
              <span>Δ Residual (A - Model):</span>
              <span className="font-bold">{typeof valDiff === 'number' ? (valDiff > 0 ? `+${valDiff.toFixed(1)}` : valDiff.toFixed(1)) : valDiff}%</span>
            </div>

            <div className="text-[9px] text-slate-500 pt-0.5 text-right">
              Scattering Vector Q = {qVector} nm⁻¹
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-[#080d1a] border-2 border-slate-800/90 rounded-2xl shadow-xl flex flex-col transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 p-6 bg-[#080d1a]/95 backdrop-blur-xl' : 'p-5'
    }`}>
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mode:</span>
          </span>

          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            {(['unified', 'stacked', 'mirrored', 'derivative', 'multiphase'] as CompareViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'unified' ? 'Overlay' : mode === 'mirrored' ? 'Butterfly' : mode}
              </button>
            ))}
          </div>

          <button
            onClick={onResetZoom}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono transition-all cursor-pointer"
            title="Reset 2Theta Zoom Domain (10° - 90°)"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Zoom</span>
          </button>
        </div>

        {/* Right: Controls (Residual Area, Peak Markers, Grid, Theme, Fullscreen) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDiffArea(!showDiffArea)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              showDiffArea 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Δ Residual Fill</span>
          </button>

          <button
            onClick={() => setShowPeakMarkers(!showPeakMarkers)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
              showPeakMarkers 
                ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>Peaks (hkl)</span>
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              showGrid 
                ? 'bg-slate-800 text-slate-200 border-slate-700' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg text-xs">
            <Palette className="w-3 h-3 text-slate-400" />
            <select
              value={diffTheme}
              onChange={(e) => setDiffTheme(e.target.value as DiffTheme)}
              className="bg-transparent text-slate-300 font-mono text-[11px] outline-none cursor-pointer"
            >
              <option value="neon">Neon Blue</option>
              <option value="emerald">Emerald Green</option>
              <option value="amber">Amber Gold</option>
              <option value="cyan">Cyan Aqua</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="monochrome">Monochrome</option>
            </select>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Alignment & Scale Fine-Tuning Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-3 bg-[#030712] rounded-xl border border-slate-800/80 my-2 text-xs font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Shift 2Theta Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">Δ2θ Shift:</span>
            <button
              onClick={() => setShiftTwoTheta(Number((shiftTwoTheta - 0.05).toFixed(2)))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-14 text-center font-bold text-cyan-400">
              {shiftTwoTheta > 0 ? `+${shiftTwoTheta.toFixed(2)}` : shiftTwoTheta.toFixed(2)}°
            </span>
            <button
              onClick={() => setShiftTwoTheta(Number((shiftTwoTheta + 0.05).toFixed(2)))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Scale Sample B Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold">Scale B:</span>
            <button
              onClick={() => setScaleSampleB(Math.max(0.1, Number((scaleSampleB - 0.05).toFixed(2))))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-12 text-center font-bold text-indigo-400">
              {(scaleSampleB * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setScaleSampleB(Math.min(3.0, Number((scaleSampleB + 0.05).toFixed(2))))}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <button
          onClick={onAutoAlign}
          className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 text-cyan-300 border border-cyan-500/30 rounded-lg font-bold transition-all cursor-pointer active:scale-95"
        >
          <Sparkle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto-Align 2θ & Scale</span>
        </button>
      </div>

      {/* Main Interactive Chart Display Area */}
      <div className="flex-1 min-h-[440px] mt-2 relative">
        {/* VIEW 1: UNIFIED OVERLAY WITH OPTIONAL DIFFERENCE AREA */}
        {(viewMode === 'unified' || viewMode === 'multiphase') && (
          <div className="w-full h-[460px] bg-[#030712] rounded-xl border border-slate-800 p-2 relative flex flex-col shadow-inner">
            {/* Header / Active Legend */}
            <div className="flex items-center justify-between mb-1 z-10 px-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorA }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                  {materialAName} (A)
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorB }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                  {materialBName} (B)
                </span>
                {hasPhaseC && (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorC }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorC }} />
                    {materialCName || 'Phase C'}
                  </span>
                )}
                {hasPhaseD && (
                  <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorD }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorD }} />
                    {materialDName || 'Phase D'}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                Drag to Zoom | Double-click or click Reset Zoom to restore
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
                <defs>
                  <linearGradient id="colorA_grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={pal.colorA} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDiffPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={pal.posDiff} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={pal.posDiff} stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[left, right]} 
                  allowDataOverflow={true}
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={{ stroke: '#334155' }}
                  label={{ value: 'Position [°2θ (Cu-Kα)]', position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <YAxis 
                  domain={[0, 115]} 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#334155' }} 
                  tickLine={{ stroke: '#334155' }} 
                  label={{ value: 'Intensity [a.u.]', angle: -90, position: 'left', offset: 0, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Optional Residual Area */}
                {showDiffArea && (
                  <Area type="monotone" dataKey="posDiff" fill="url(#colorDiffPos)" stroke="none" isAnimationActive={false} />
                )}

                {/* Sample A Primary Trace */}
                <Area type="monotone" dataKey="intensityA" fill="url(#colorA_grad)" stroke={pal.colorA} strokeWidth={2.5} dot={false} isAnimationActive={false} />

                {/* Reference Model B Trace */}
                <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={2.2} strokeDasharray={hasPhaseC ? '3 3' : undefined} dot={false} isAnimationActive={false} />

                {/* Optional Phase C and D traces */}
                {hasPhaseC && (
                  <Line type="monotone" dataKey="intensityC" stroke={pal.colorC} strokeWidth={2} dot={false} isAnimationActive={false} />
                )}
                {hasPhaseD && (
                  <Line type="monotone" dataKey="intensityD" stroke={pal.colorD} strokeWidth={2} dot={false} isAnimationActive={false} />
                )}

                {/* Total Model (if multiphase) */}
                {(hasPhaseC || hasPhaseD) && (
                  <Line type="monotone" dataKey="intensityTotalModel" stroke="#f8fafc" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                )}

                {/* Peak Reflection Markers / Sticks */}
                {showPeakMarkers && peaksA.filter(p => p.twoTheta >= left && p.twoTheta <= right).map((p, idx) => (
                  <ReferenceLine
                    key={`pA_${idx}`}
                    x={p.twoTheta}
                    stroke={pal.colorA}
                    strokeDasharray="2 2"
                    strokeWidth={1}
                    label={p.hkl ? { value: p.hkl, position: 'top', fill: pal.colorA, fontSize: 9, fontFamily: 'monospace' } : undefined}
                  />
                ))}

                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VIEW 2: BUTTERFLY MIRRORED VIEW */}
        {viewMode === 'mirrored' && (
          <div className="w-full h-[460px] bg-[#030712] rounded-xl border border-slate-800 p-2 relative flex flex-col shadow-inner">
            <div className="flex items-center justify-between mb-1 z-10 px-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorA }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                  {materialAName} (Top)
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorB }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                  {materialBName} (Mirrored Bottom)
                </span>
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
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[left, right]} 
                  allowDataOverflow={true} 
                  tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} 
                  axisLine={{ stroke: '#334155' }} 
                  tickLine={{ stroke: '#334155' }} 
                />
                <YAxis domain={[-110, 110]} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />

                <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="mirroredB" stroke={pal.colorB} strokeWidth={2.5} dot={false} isAnimationActive={false} />

                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VIEW 3: 1ST DERIVATIVE */}
        {viewMode === 'derivative' && (
          <div className="w-full h-[460px] bg-[#030712] rounded-xl border border-slate-800 p-2 relative flex flex-col shadow-inner">
            <div className="flex items-center justify-between mb-1 z-10 px-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorA }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                  dI/d2θ ({materialAName})
                </span>
                <span className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{ color: pal.colorB }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                  dI/d2θ ({materialBName})
                </span>
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
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} strokeDasharray="2 2" />

                <Line type="monotone" dataKey="derivA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="derivB" stroke={pal.colorB} strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />

                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#a855f7" fillOpacity={0.25} />
                ) : null}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* VIEW 4: 3-PANE STACKED VIEW */}
        {viewMode === 'stacked' && (
          <div className="w-full flex flex-col gap-3">
            {/* Pane 1: Sample A */}
            <div className="w-full h-[180px] bg-[#030712] rounded-xl border border-slate-800 p-2 relative flex flex-col">
              <div className="flex items-center justify-between mb-1 z-10 px-2">
                <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorA }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorA }} />
                  Sample A: {materialAName}
                </span>
                <span className="text-[10px] font-mono text-slate-500">Pane 1</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 15, left: 10 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                  <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Pane 2: Sample B */}
            <div className="w-full h-[180px] bg-[#030712] rounded-xl border border-slate-800 p-2 relative flex flex-col">
              <div className="flex items-center justify-between mb-1 z-10 px-2">
                <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorB }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pal.colorB }} />
                  Sample B: {materialBName}
                </span>
                <span className="text-[10px] font-mono text-slate-500">Pane 2</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 15, left: 10 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                  <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Pane 3: Residual Profile */}
            <div className="w-full h-[140px] bg-[#030712] rounded-xl border border-slate-800 p-2 relative flex flex-col">
              <div className="flex items-center justify-between mb-1 z-10 px-2">
                <span className="text-xs font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Δ Residual Profile (I_Obs - I_Calc)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Pane 3</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 5, right: 15, bottom: 20, left: 10 }}>
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                  <YAxis domain={[-80, 80]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
