import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Download,
  Info,
  PieChart as PieChartIcon,
  Scale,
  SlidersHorizontal
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts';
import { RIRDiagnosticItem, computeBraggReciprocal } from './rirMathUtils';
import { playSynthTone } from '../../utils/sound';

export interface RIRVisualPhaseRow {
  id: string;
  name: string;
  hkl: string;
  twoTheta: number;
  intensity: number;
  rir: number;
  tau: number;
  density: number;
  mac: number;
  reducedIntensity: number;
  crystallineFraction: number;
  totalSampleFraction: number;
  crystallineVolFraction: number;
  totalSampleVolFraction: number;
  errMarginCrystalline: number;
  errMarginTotal: number;
  errMarginVol: number;
  errMarginBulkVol: number;
  lodWtPct: number;
  penetrationDepthUm: number;
  textureCvPct: number;
  isInternalStandard: boolean;
  color: string;
}

interface RIRVisualWorkbenchProps {
  phaseResults: RIRVisualPhaseRow[];
  effectiveAmorphousWtPct: number;
  amorphousVolPct: number;
  amorphousErrWtPct: number;
  amorphousDensity: number;
  isInternalStandardActive: boolean;
  rawOriginalSampleCrystSum: number;
  totalSampleMAC: number;
  bulkDensity: number;
  wavelengthA: number;
  anodeLabel: string;
  useBrindley: boolean;
  diagnostics: RIRDiagnosticItem[];
  copiedReport: boolean;
  onCopyReport: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onJumpToTab: (tab: 'matrix' | 'microabsorption' | 'pawley_bridge' | 'spectrum') => void;
}

type VisualViewMode = 'wt_vs_vol' | 'scattering_axis' | 'donut';

export const RIRVisualWorkbench: React.FC<RIRVisualWorkbenchProps> = ({
  phaseResults,
  effectiveAmorphousWtPct,
  amorphousVolPct,
  amorphousErrWtPct,
  amorphousDensity,
  isInternalStandardActive,
  rawOriginalSampleCrystSum,
  totalSampleMAC,
  bulkDensity,
  wavelengthA,
  anodeLabel,
  useBrindley,
  diagnostics,
  copiedReport,
  onCopyReport,
  onExportCSV,
  onExportJSON,
  onJumpToTab
}) => {
  const [viewMode, setViewMode] = useState<VisualViewMode>('wt_vs_vol');
  const [donutUnit, setDonutUnit] = useState<'wt' | 'vol'>('wt');
  const [hoveredPhaseId, setHoveredPhaseId] = useState<string | null>(null);

  // Exclude spiked internal standard from unspiked sample basis
  const samplePhases = useMemo(
    () => phaseResults.filter((p) => !(isInternalStandardActive && p.isInternalStandard)),
    [phaseResults, isInternalStandardActive]
  );

  const pieData = useMemo(() => {
    const rows = samplePhases.map((p) => ({
      id: p.id,
      name: p.name,
      value: Number((donutUnit === 'wt' ? p.totalSampleFraction : p.totalSampleVolFraction).toFixed(2)),
      err: Number((donutUnit === 'wt' ? p.errMarginTotal : p.errMarginBulkVol).toFixed(2)),
      color: p.color
    }));
    if (effectiveAmorphousWtPct > 0) {
      rows.push({
        id: 'amorphous-matrix',
        name: 'Amorphous Matrix',
        value: Number((donutUnit === 'wt' ? effectiveAmorphousWtPct : amorphousVolPct).toFixed(2)),
        err: Number((donutUnit === 'wt' ? amorphousErrWtPct : 0).toFixed(2)),
        color: '#64748b'
      });
    }
    return rows;
  }, [samplePhases, donutUnit, effectiveAmorphousWtPct, amorphousVolPct, amorphousErrWtPct]);

  // SVG Scattering Power Axis geometry (Observed I vs RIR-corrected Reduced I/K)
  const scatteringPlot = useMemo(() => {
    const active = phaseResults.filter((p) => p.intensity > 0);
    if (active.length === 0) return null;

    const minTT = Math.max(5, Math.floor((Math.min(...active.map((p) => p.twoTheta)) - 5) / 5) * 5);
    const maxTT = Math.min(90, Math.ceil((Math.max(...active.map((p) => p.twoTheta)) + 6) / 5) * 5);
    const spanTT = Math.max(10, maxTT - minTT);

    const maxObs = Math.max(...active.map((p) => p.intensity), 1);
    const maxRed = Math.max(...active.map((p) => p.reducedIntensity), 1);

    const padL = 36;
    const padR = 16;
    const padT = 18;
    const padB = 38;
    const width = 460;
    const height = 215;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const toX = (tt: number) => padL + ((tt - minTT) / spanTT) * plotW;

    const ticks: number[] = [];
    const step = spanTT <= 20 ? 5 : spanTT <= 45 ? 10 : 15;
    for (let t = Math.ceil(minTT / step) * step; t <= maxTT; t += step) {
      ticks.push(t);
    }

    const items = active.map((p) => {
      const x = toX(p.twoTheta);
      const hObs = (p.intensity / maxObs) * (plotH - 12);
      const hRed = (p.reducedIntensity / maxRed) * (plotH - 12);
      const { dSpacingA } = computeBraggReciprocal(p.twoTheta, wavelengthA);
      return {
        ...p,
        x,
        hObs,
        hRed,
        dSpacingA
      };
    });

    return { width, height, padL, padR, padT, padB, plotW, plotH, minTT, maxTT, ticks, toX, items };
  }, [phaseResults, wavelengthA]);

  const dominantSamplePhase = useMemo(() => {
    if (samplePhases.length === 0) return null;
    return [...samplePhases].sort((a, b) => b.totalSampleFraction - a.totalSampleFraction)[0];
  }, [samplePhases]);

  return (
    <div className="bg-[#0B0F17] border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
      {/* Top Header & Segmented View Switcher */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
            Quantitative Composition Stage
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums">
            <span>ρ<sub>bulk</sub> = {bulkDensity.toFixed(2)} g/cm³</span>
            <span aria-hidden="true">·</span>
            <span>μ* = {totalSampleMAC.toFixed(1)} cm²/g</span>
            <span aria-hidden="true">·</span>
            <span>{anodeLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#070B12] border border-slate-800 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { playSynthTone('tick'); setViewMode('wt_vs_vol'); }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'wt_vs_vol'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>wt% vs vol%</span>
          </button>
          <button
            type="button"
            onClick={() => { playSynthTone('tick'); setViewMode('scattering_axis'); }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'scattering_axis'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>I vs I/RIR</span>
          </button>
          <button
            type="button"
            onClick={() => { playSynthTone('tick'); setViewMode('donut'); }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === 'donut'
                ? 'bg-slate-800 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Radial</span>
          </button>
        </div>
      </div>

      {/* Stacked 100% Bulk Composition Ribbon */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
          <span className="text-slate-400">
            Bulk Mass Composition ({isInternalStandardActive ? 'Unspiked Sample Basis' : 'Chung Normalized'})
          </span>
          <span className="text-slate-300">
            Cryst {(100 - effectiveAmorphousWtPct).toFixed(1)}%
            {effectiveAmorphousWtPct > 0 && ` · Amorph ${effectiveAmorphousWtPct.toFixed(1)}%`}
          </span>
        </div>
        <div className="h-3 w-full rounded bg-[#070B12] border border-slate-800 overflow-hidden flex">
          {samplePhases.map((p) => {
            const widthPct = Math.max(0, p.totalSampleFraction);
            const isHovered = hoveredPhaseId === p.id;
            return (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredPhaseId(p.id)}
                onMouseLeave={() => setHoveredPhaseId(null)}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: p.color,
                  opacity: hoveredPhaseId && !isHovered ? 0.45 : 1
                }}
                className="h-full transition-opacity duration-150 border-r border-[#070B12] last:border-r-0 cursor-pointer"
                title={`${p.name}: ${p.totalSampleFraction.toFixed(2)} ± ${p.errMarginTotal.toFixed(2)} wt% (${p.totalSampleVolFraction.toFixed(2)} vol%)`}
              />
            );
          })}
          {effectiveAmorphousWtPct > 0 && (
            <div
              onMouseEnter={() => setHoveredPhaseId('amorphous')}
              onMouseLeave={() => setHoveredPhaseId(null)}
              style={{
                width: `${Math.min(100, effectiveAmorphousWtPct)}%`,
                backgroundImage:
                  'repeating-linear-gradient(135deg, #475569 0px, #475569 4px, #334155 4px, #334155 8px)'
              }}
              className="h-full"
              title={`Amorphous Matrix: ${effectiveAmorphousWtPct.toFixed(2)} wt% (${amorphousVolPct.toFixed(2)} vol%)`}
            />
          )}
        </div>
      </div>

      {/* Main Visualization Viewport */}
      <div className="p-5 flex-1">
        {viewMode === 'wt_vs_vol' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Dual-Basis Mass (wt%) vs. Density-Adjusted Volume (vol%)</span>
              <span className="text-slate-500">Whiskers = ±1σ Jacobian</span>
            </div>

            <div className="space-y-3.5">
              {samplePhases.map((p) => {
                const wt = Math.max(0, Math.min(100, p.totalSampleFraction));
                const wtErr = Math.min(wt, p.errMarginTotal);
                const vol = Math.max(0, Math.min(100, p.totalSampleVolFraction));
                const volErr = Math.min(vol, p.errMarginBulkVol);
                const densityDelta = vol - wt;

                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredPhaseId(p.id)}
                    onMouseLeave={() => setHoveredPhaseId(null)}
                    className={`p-3 rounded-xl border transition-colors ${
                      hoveredPhaseId === p.id
                        ? 'bg-slate-900/90 border-slate-700'
                        : 'bg-[#070B12] border-slate-800/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-xs font-semibold text-slate-100 truncate">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {p.hkl} · ρ={p.density.toFixed(2)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                        Δ(vol−wt): {densityDelta >= 0 ? '+' : ''}{densityDelta.toFixed(1)}%
                      </span>
                    </div>

                    {/* Track 1: Mass wt% */}
                    <div className="grid grid-cols-12 items-center gap-2 mb-1.5">
                      <span className="col-span-2 text-[10px] font-mono text-slate-400">Mass</span>
                      <div className="col-span-7 relative h-2 bg-slate-900 rounded overflow-visible">
                        <div
                          className="h-full rounded transition-all duration-200"
                          style={{ width: `${wt}%`, backgroundColor: p.color }}
                        />
                        {wtErr > 0.1 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 border-l border-r border-slate-100/80 pointer-events-none"
                            style={{
                              left: `${Math.max(0, wt - wtErr)}%`,
                              width: `${Math.min(100 - Math.max(0, wt - wtErr), wtErr * 2)}%`
                            }}
                          >
                            <div className="w-full h-[1px] bg-slate-100/80 mt-[5.5px]" />
                          </div>
                        )}
                      </div>
                      <span className="col-span-3 text-right text-[11px] font-mono tabular-nums text-slate-100 font-semibold">
                        {wt.toFixed(1)}<span className="text-slate-500 font-normal"> ±{p.errMarginTotal.toFixed(1)}%</span>
                      </span>
                    </div>

                    {/* Track 2: Volume vol% */}
                    <div className="grid grid-cols-12 items-center gap-2">
                      <span className="col-span-2 text-[10px] font-mono text-slate-400">Vol</span>
                      <div className="col-span-7 relative h-2 bg-slate-900 rounded overflow-visible">
                        <div
                          className="h-full rounded transition-all duration-200 opacity-70"
                          style={{
                            width: `${vol}%`,
                            backgroundColor: p.color
                          }}
                        />
                        {volErr > 0.1 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-2.5 border-l border-r border-amber-300/80 pointer-events-none"
                            style={{
                              left: `${Math.max(0, vol - volErr)}%`,
                              width: `${Math.min(100 - Math.max(0, vol - volErr), volErr * 2)}%`
                            }}
                          />
                        )}
                      </div>
                      <span className="col-span-3 text-right text-[11px] font-mono tabular-nums text-amber-300">
                        {vol.toFixed(1)}<span className="text-slate-500 font-normal"> ±{p.errMarginBulkVol.toFixed(1)}%</span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {effectiveAmorphousWtPct > 0 && (
                <div className="p-3 rounded-xl bg-[#070B12] border border-slate-800/90 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      Amorphous / Diffuse Matrix
                      <span className="text-[10px] font-mono text-slate-500 ml-2">ρ={amorphousDensity.toFixed(2)} g/cm³</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-rose-300 font-semibold">
                      {effectiveAmorphousWtPct.toFixed(1)}
                      {isInternalStandardActive && amorphousErrWtPct > 0 ? ` ±${amorphousErrWtPct.toFixed(1)}` : ''} wt% · {amorphousVolPct.toFixed(1)} vol%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded"
                      style={{ width: `${Math.min(100, effectiveAmorphousWtPct)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'scattering_axis' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-slate-300">Raw Intensity (I) vs. RIR-Corrected Scattering (I / RIR)</span>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 border border-slate-400 border-dashed inline-block" /> Observed I
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-cyan-400 inline-block" /> Reduced I/K{useBrindley ? '·τ⁻¹' : ''}
                </span>
              </div>
            </div>

            {scatteringPlot ? (
              <div className="bg-[#070B12] border border-slate-800 rounded-xl p-2">
                <svg
                  viewBox={`0 0 ${scatteringPlot.width} ${scatteringPlot.height}`}
                  className="w-full h-auto cursor-crosshair select-none"
                >
                  {/* Horizontal gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const y = scatteringPlot.padT + scatteringPlot.plotH * (1 - frac);
                    return (
                      <g key={frac}>
                        <line
                          x1={scatteringPlot.padL}
                          y1={y}
                          x2={scatteringPlot.width - scatteringPlot.padR}
                          y2={y}
                          stroke="#1e293b"
                          strokeDasharray={frac === 0 ? undefined : '2 3'}
                          strokeWidth="1"
                        />
                        <text
                          x={scatteringPlot.padL - 5}
                          y={y + 3}
                          textAnchor="end"
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {Math.round(frac * 100)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis ticks (2Theta) */}
                  {scatteringPlot.ticks.map((t) => {
                    const x = scatteringPlot.toX(t);
                    return (
                      <g key={t}>
                        <line
                          x1={x}
                          y1={scatteringPlot.padT + scatteringPlot.plotH}
                          x2={x}
                          y2={scatteringPlot.padT + scatteringPlot.plotH + 4}
                          stroke="#475569"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={scatteringPlot.padT + scatteringPlot.plotH + 15}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="8.5"
                          fontFamily="monospace"
                        >
                          {t}°
                        </text>
                      </g>
                    );
                  })}

                  {/* Phase paired bars: Left dashed = Observed I, Right solid = Reduced I/RIR */}
                  {scatteringPlot.items.map((item) => {
                    const baseY = scatteringPlot.padT + scatteringPlot.plotH;
                    const barW = 7;
                    const isActive = hoveredPhaseId === item.id;
                    return (
                      <g
                        key={item.id}
                        onMouseEnter={() => setHoveredPhaseId(item.id)}
                        onMouseLeave={() => setHoveredPhaseId(null)}
                        className="cursor-pointer"
                      >
                        {/* Observed I (dashed hollow bar) */}
                        <rect
                          x={item.x - barW - 1}
                          y={baseY - item.hObs}
                          width={barW}
                          height={Math.max(2, item.hObs)}
                          fill={item.color}
                          fillOpacity={isActive ? 0.28 : 0.14}
                          stroke={item.color}
                          strokeWidth="1"
                          strokeDasharray="2 1.5"
                          rx="1"
                        />
                        {/* Reduced I/RIR (solid bar) */}
                        <rect
                          x={item.x + 1}
                          y={baseY - item.hRed}
                          width={barW}
                          height={Math.max(2, item.hRed)}
                          fill={item.color}
                          fillOpacity={isActive ? 1 : 0.88}
                          rx="1"
                        />
                        {/* Peak hkl & d-spacing top label */}
                        <text
                          x={item.x}
                          y={Math.max(10, baseY - Math.max(item.hObs, item.hRed) - 4)}
                          textAnchor="middle"
                          fill={isActive ? '#f8fafc' : '#cbd5e1'}
                          fontSize="7.5"
                          fontFamily="monospace"
                          fontWeight={isActive ? '700' : '500'}
                        >
                          {item.hkl}
                        </text>
                      </g>
                    );
                  })}

                  <text
                    x={scatteringPlot.padL + scatteringPlot.plotW / 2}
                    y={scatteringPlot.height - 4}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8.5"
                    fontFamily="monospace"
                  >
                    Diffraction Angle 2θ (deg, {anodeLabel}) · Normalized Peak vs. RIR-Scaled Height
                  </text>
                </svg>

                {/* Live Hover Readout Strip */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-mono tabular-nums">
                  {(() => {
                    const active = phaseResults.find((p) => p.id === hoveredPhaseId) || dominantSamplePhase;
                    if (!active) return null;
                    const { dSpacingA, invD } = computeBraggReciprocal(active.twoTheta, wavelengthA);
                    return (
                      <>
                        <span className="text-slate-200 font-semibold truncate max-w-[190px]">
                          {active.name.split(' (')[0]} {active.hkl}
                        </span>
                        <span className="text-slate-400">
                          d = <strong className="text-slate-200">{dSpacingA.toFixed(3)} Å</strong> (1/d = {invD.toFixed(3)})
                        </span>
                        <span className="text-cyan-300">
                          I={active.intensity.toLocaleString()} → I/K={active.reducedIntensity.toFixed(0)}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#070B12] border border-slate-800 rounded-xl">
                Assign positive peak intensities to visualize scattering power rescaling.
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Phases with low Corundum RIR (e.g. Feldspar 1.1 or Corundum 1.0) diffract weakly per gram compared to high-RIR phases (e.g. Magnetite 4.8 or Quartz 3.6); dividing by <span className="font-mono text-slate-200">RIR · τ</span> restores true mass proportionality.
            </p>
          </div>
        )}

        {viewMode === 'donut' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">Bulk Sample Share</span>
              <div className="flex items-center gap-1 p-0.5 bg-[#070B12] border border-slate-800 rounded-md">
                <button
                  type="button"
                  onClick={() => { playSynthTone('tick'); setDonutUnit('wt'); }}
                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors ${
                    donutUnit === 'wt' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  wt%
                </button>
                <button
                  type="button"
                  onClick={() => { playSynthTone('tick'); setDonutUnit('vol'); }}
                  className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-colors ${
                    donutUnit === 'vol' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  vol%
                </button>
              </div>
            </div>

            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#0B0F17"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#070B12] border border-slate-700 px-3 py-2 rounded-lg text-xs font-mono tabular-nums text-slate-100">
                            <div className="font-semibold" style={{ color: d.color }}>{d.name}</div>
                            <div className="mt-0.5">
                              {d.value.toFixed(2)} {d.err > 0 ? `± ${d.err.toFixed(2)}` : ''} {donutUnit}%
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {dominantSamplePhase && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-12">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[100px]">
                    {dominantSamplePhase.name.split(' (')[0]}
                  </span>
                  <span className="text-xl font-mono tabular-nums font-bold text-slate-100">
                    {(donutUnit === 'wt' ? dominantSamplePhase.totalSampleFraction : dominantSamplePhase.totalSampleVolFraction).toFixed(1)}%
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{donutUnit}%</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-mono tabular-nums">
              {pieData.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-300 truncate">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
                    <span className="truncate">{row.name.split(' (')[0]}</span>
                  </span>
                  <span className="text-slate-100 font-semibold shrink-0">{row.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crystallographic Quality Diagnostics Strip */}
      <div className="px-5 py-3.5 border-t border-slate-800 bg-[#070B12]/70 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Quantitative Quality Diagnostics</span>
          </span>
          {isInternalStandardActive && (
            <span className={`text-[10px] font-mono tabular-nums ${rawOriginalSampleCrystSum > 100.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
              Σw<sub>cryst</sub> = {rawOriginalSampleCrystSum.toFixed(1)}%
            </span>
          )}
        </div>

        {diagnostics.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Nominal — no overlap, fluorescence, microabsorption, or mass-balance anomalies detected.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {diagnostics.slice(0, 4).map((diag) => (
              <div
                key={diag.id}
                className={`flex items-start gap-2 text-[11px] leading-snug px-2.5 py-2 rounded-lg border ${
                  diag.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : diag.severity === 'warning'
                    ? 'bg-amber-950/25 border-amber-500/35 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                {diag.severity === 'info' ? (
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      diag.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  />
                )}
                <div className="flex-1">
                  <span className="font-mono font-semibold mr-1.5">{diag.category}:</span>
                  <span>{diag.message}</span>
                  {diag.id === 'brindley-needed' && (
                    <button
                      type="button"
                      onClick={() => onJumpToTab('microabsorption')}
                      className="ml-2 font-mono text-cyan-400 hover:underline whitespace-nowrap"
                    >
                      Inspect Brindley →
                    </button>
                  )}
                  {diag.id.startsWith('overlap-') && (
                    <button
                      type="button"
                      onClick={() => onJumpToTab('pawley_bridge')}
                      className="ml-2 font-mono text-indigo-400 hover:underline whitespace-nowrap"
                    >
                      Open Pawley Bridge →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Export & Deep-Dive Actions */}
      <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopyReport}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedReport ? 'Copied' : 'Report'}</span>
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportJSON}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>JSON</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onJumpToTab('matrix')}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors whitespace-nowrap"
        >
          Jacobian Covariance →
        </button>
      </div>
    </div>
  );
};
