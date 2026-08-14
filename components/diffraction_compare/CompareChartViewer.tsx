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
  Grid
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
  peaksA: PeakItem[];
  peaksB: PeakItem[];
  hasPhaseC?: boolean;
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
  hasPhaseC
}) => {
  const { t } = useTranslation();
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);

  // Color theme palette generator
  const getThemePalette = () => {
    switch (diffTheme) {
      case 'emerald':
        return { colorA: '#10b981', colorB: '#06b6d4', colorC: '#a855f7', colorDiff: '#f59e0b' };
      case 'amber':
        return { colorA: '#f59e0b', colorB: '#ec4899', colorC: '#8b5cf6', colorDiff: '#06b6d4' };
      case 'cyan':
        return { colorA: '#06b6d4', colorB: '#f43f5e', colorC: '#eab308', colorDiff: '#10b981' };
      case 'monochrome':
        return { colorA: '#e2e8f0', colorB: '#94a3b8', colorC: '#64748b', colorDiff: '#f43f5e' };
      case 'neon':
      default:
        return { colorA: '#6366f1', colorB: '#06b6d4', colorC: '#d946ef', colorDiff: '#f43f5e' };
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
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const theta = Number(label);
      const thetaRad = (theta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? (1.5406 / (2 * Math.sin(thetaRad))).toFixed(4) : '-';

      const valA = payload.find((p: any) => p.dataKey === 'intensityA')?.value ?? '-';
      const valB = payload.find((p: any) => p.dataKey === 'intensityB' || p.dataKey === 'intensityTotalModel')?.value ?? '-';
      const valDiff = payload.find((p: any) => p.dataKey === 'difference')?.value ?? '-';

      return (
        <div className="bg-[#080d1a]/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 z-50">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1 gap-4">
            <span className="font-bold text-white">2θ: {theta.toFixed(2)}°</span>
            <span className="text-slate-400 text-[10px]">d: {dSpacing} Å</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-emerald-400">
              <span>{materialAName || 'Sample A'}:</span>
              <span className="font-bold">{typeof valA === 'number' ? valA.toFixed(1) : valA}%</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-cyan-400">
              <span>{materialBName || 'Reference B'}:</span>
              <span className="font-bold">{typeof valB === 'number' ? valB.toFixed(1) : valB}%</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-rose-400 pt-1 border-t border-slate-800">
              <span>Δ (A - Ref):</span>
              <span className="font-bold">{typeof valDiff === 'number' ? valDiff.toFixed(1) : valDiff}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#080d1a] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
      {/* Top Header & Chart Mode Selector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                viewMode === 'stacked'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('3-Pane Stacked')}
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                viewMode === 'unified'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('Unified Overlay')}
            </button>
            <button
              onClick={() => setViewMode('mirrored')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                viewMode === 'mirrored'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('Butterfly Mirror')}
            </button>
            <button
              onClick={() => setViewMode('derivative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                viewMode === 'derivative'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('1st Derivative')}
            </button>
          </div>
        </div>

        {/* Chart View Settings Ribbon */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Zoom buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono text-slate-400">
            <button
              onClick={() => onZoomChange(10, 90)}
              className={`px-2 py-1 rounded hover:text-white ${left === 10 && right === 90 ? 'bg-slate-800 text-white font-bold' : ''}`}
            >
              10-90°
            </button>
            <button
              onClick={() => onZoomChange(20, 50)}
              className={`px-2 py-1 rounded hover:text-white ${left === 20 && right === 50 ? 'bg-slate-800 text-white font-bold' : ''}`}
            >
              20-50°
            </button>
            <button
              onClick={() => onZoomChange(50, 90)}
              className={`px-2 py-1 rounded hover:text-white ${left === 50 && right === 90 ? 'bg-slate-800 text-white font-bold' : ''}`}
            >
              50-90°
            </button>
          </div>

          <button
            onClick={onResetZoom}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            title={t('Reset Zoom')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowPeakMarkers(!showPeakMarkers)}
            className={`p-1.5 border rounded-lg transition-colors ${
              showPeakMarkers
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={t('Toggle Peak Markers')}
          >
            <Tag className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 border rounded-lg transition-colors ${
              showGrid
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={t('Toggle Grid')}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Theme Selector */}
          <select
            value={diffTheme}
            onChange={(e) => setDiffTheme(e.target.value as DiffTheme)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono px-2 py-1.5 rounded-lg outline-none cursor-pointer"
          >
            <option value="neon">Neon Spectra</option>
            <option value="emerald">Emerald Sea</option>
            <option value="amber">Amber Solar</option>
            <option value="cyan">Cyan Electric</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </div>
      </div>

      {/* Alignment and Calibration Controls */}
      <div className="bg-[#030712] p-3 rounded-xl border border-slate-800/90 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Shift 2Theta */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 whitespace-nowrap">{t('Shift Δ2θ')}:</span>
            <button
              onClick={() => setShiftTwoTheta(Number((shiftTwoTheta - 0.05).toFixed(2)))}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              -0.05°
            </button>
            <input
              type="range"
              min="-1.5"
              max="1.5"
              step="0.01"
              value={shiftTwoTheta}
              onChange={(e) => setShiftTwoTheta(parseFloat(e.target.value))}
              className="w-24 md:w-32 accent-amber-500 cursor-pointer"
            />
            <button
              onClick={() => setShiftTwoTheta(Number((shiftTwoTheta + 0.05).toFixed(2)))}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              +0.05°
            </button>
            <span className="text-amber-400 font-bold w-12 text-right">
              {shiftTwoTheta > 0 ? `+${shiftTwoTheta.toFixed(2)}°` : `${shiftTwoTheta.toFixed(2)}°`}
            </span>
          </div>

          {/* Scale Sample B */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400 whitespace-nowrap">{t('Scale Ref B')}:</span>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={scaleSampleB}
              onChange={(e) => setScaleSampleB(parseFloat(e.target.value))}
              className="w-20 md:w-24 accent-cyan-500 cursor-pointer"
            />
            <span className="text-cyan-400 font-bold w-10 text-right">{scaleSampleB.toFixed(2)}x</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onAutoAlign}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition-all active:scale-95 shadow-sm"
            title={t('Auto-align primary peaks by cross-correlation')}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('Auto Align (Δ2θ)')}</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Recharts View */}
      <div className="w-full select-none">
        {viewMode === 'unified' && (
          <div className="w-full flex flex-col gap-4">
            {/* Unified Overlay Main Chart */}
            <div className="w-full h-[450px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col shadow-inner">
              <div className="flex items-center justify-between mb-2 z-10 px-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                    {materialAName} (Exp)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                    {materialBName} (Ref)
                  </span>
                  {hasPhaseC && (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorC }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorC }} />
                      {materialCName} (Phase C)
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                  Drag on chart to zoom
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  syncId="compareSync"
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
                      <stop offset="95%" stopColor={pal.colorA} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorB_grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={pal.colorB} stopOpacity={0.0} />
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
                    label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                  />
                  <YAxis 
                    domain={[0, 115]} 
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {showDiffArea && (
                    <>
                      <Area type="monotone" dataKey="intensityA" fill="url(#colorA_grad)" stroke="none" />
                      <Area type="monotone" dataKey="intensityB" fill="url(#colorB_grad)" stroke="none" />
                    </>
                  )}

                  <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={2} strokeDasharray="3 2" dot={false} isAnimationActive={false} />
                  
                  {hasPhaseC && (
                    <Line type="monotone" dataKey="intensityC" stroke={pal.colorC} strokeWidth={1.8} strokeDasharray="2 2" dot={false} isAnimationActive={false} />
                  )}

                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Residual Lower Pane */}
            <div className="w-full h-[180px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-1 z-10 px-2">
                <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {t('Δ Residual Profile (I_SampleA - I_ReferenceModel)')}
                </span>
                <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {t('Residual Spectrum')}
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  syncId="compareSync"
                  data={points}
                  margin={{ top: 10, right: 15, bottom: 20, left: 10 }}
                  onMouseDown={handleChartMouseDown}
                  onMouseMove={handleChartMouseMove}
                  onMouseUp={handleZoom}
                  onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                >
                  <defs>
                    <linearGradient id="colorDiff_unified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={pal.colorDiff} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={pal.colorDiff} stopOpacity={0.02} />
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
                  />
                  <YAxis 
                    domain={[-100, 100]} 
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3"/>

                  {showDiffArea && (
                    <Area type="monotone" dataKey="difference" fill="url(#colorDiff_unified)" stroke="none" />
                  )}
                  <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={2} dot={false} isAnimationActive={false} />
                  
                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === 'mirrored' && (
          <div className="w-full flex flex-col gap-4">
            <div className="w-full h-[450px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col shadow-inner">
              <div className="flex items-center justify-between mb-2 z-10 px-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                    {materialAName} (Top)
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                    {materialBName} (Mirrored Bottom)
                  </span>
                </div>
                <span className="text-[9px] font-mono text-cyan-400/80 font-bold uppercase tracking-widest">
                  Butterfly Mirrored
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  syncId="compareSync"
                  data={points}
                  margin={{ top: 15, right: 15, bottom: 25, left: 10 }}
                  onMouseDown={handleChartMouseDown}
                  onMouseMove={handleChartMouseMove}
                  onMouseUp={handleZoom}
                  onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                >
                  <defs>
                    <linearGradient id="colorA_mir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={pal.colorA} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={pal.colorA} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorB_mir" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="5%" stopColor={pal.colorB} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={pal.colorB} stopOpacity={0} />
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
                    label={{ value: t('Position [°2Theta]'), position: 'bottom', offset: 5, fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                  />
                  <YAxis domain={[-110, 110]} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />

                  {showDiffArea && (
                    <>
                      <Area type="monotone" dataKey="intensityA" fill="url(#colorA_mir)" stroke="none" />
                      <Area type="monotone" dataKey="mirroredB" fill="url(#colorB_mir)" stroke="none" />
                    </>
                  )}

                  <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="mirroredB" stroke={pal.colorB} strokeWidth={2.5} dot={false} isAnimationActive={false} />

                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === 'derivative' && (
          <div className="w-full flex flex-col gap-4">
            <div className="w-full h-[450px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col shadow-inner">
              <div className="flex items-center justify-between mb-2 z-10 px-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorA }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                    dI/d2θ ({materialAName})
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold" style={{ color: pal.colorB }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                    dI/d2θ ({materialBName})
                  </span>
                </div>
                <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-widest bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  1st Derivative Mode
                </span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  syncId="compareSync"
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
          </div>
        )}

        {viewMode === 'stacked' && (
          <div className="w-full flex flex-col gap-3">
            {/* Pane 1: Sample A */}
            <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
              <div className="flex items-center justify-between mb-1 z-10 px-2">
                <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorA }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorA }} />
                  {t('Sample A (Target)')}: {materialAName}
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 1</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  syncId="compareSync"
                  data={points}
                  margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                  onMouseDown={handleChartMouseDown}
                  onMouseMove={handleChartMouseMove}
                  onMouseUp={handleZoom}
                  onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                >
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                  <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="intensityA" stroke={pal.colorA} strokeWidth={2} dot={false} isAnimationActive={false} />
                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Pane 2: Sample B */}
            <div className="w-full h-[220px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
              <div className="flex items-center justify-between mb-1 z-10 px-2">
                <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorB }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.colorB }} />
                  {t('Reference Standard (Sample B)')}: {materialBName}
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 2</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  syncId="compareSync"
                  data={points}
                  margin={{ top: 10, right: 15, bottom: 15, left: 10 }}
                  onMouseDown={handleChartMouseDown}
                  onMouseMove={handleChartMouseMove}
                  onMouseUp={handleZoom}
                  onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                >
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                  <YAxis domain={[0, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="intensityB" stroke={pal.colorB} strokeWidth={2} dot={false} isAnimationActive={false} />
                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Pane 3: Residual Profile */}
            <div className="w-full h-[180px] bg-[#080d1a] rounded-xl border border-slate-800 p-3 relative flex flex-col">
              <div className="flex items-center justify-between mb-1 z-10 px-2">
                <span className="text-[11px] font-mono font-bold flex items-center gap-1.5" style={{ color: pal.colorDiff }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('Δ Residual Profile (I_SampleA - I_ReferenceModel)')}
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Pane 3</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  syncId="compareSync"
                  data={points}
                  margin={{ top: 10, right: 15, bottom: 25, left: 10 }}
                  onMouseDown={handleChartMouseDown}
                  onMouseMove={handleChartMouseMove}
                  onMouseUp={handleZoom}
                  onMouseLeave={() => { setRefAreaLeft(null); setRefAreaRight(null); }}
                >
                  {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />}
                  <XAxis dataKey="twoTheta" type="number" domain={[left, right]} allowDataOverflow={true} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                  <YAxis domain={[-100, 100]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#475569" strokeWidth={1} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="difference" stroke={pal.colorDiff} strokeWidth={2} dot={false} isAnimationActive={false} />
                  {refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.5} fill="#6366f1" fillOpacity={0.25} />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
