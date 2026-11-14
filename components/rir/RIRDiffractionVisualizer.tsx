import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Sliders,
  Eye,
  EyeOff,
  Download,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import { RIRMatrixPhase } from './RIRMatrixInspector';

export interface DiffractogramPeakItem {
  id: string;
  hkl: string;
  twoTheta: number;
  intensity: number;
  relIntensity: number;
}

export type VisualizerPhaseInput = RIRMatrixPhase & {
  peaks?: DiffractogramPeakItem[];
};

interface RIRDiffractionVisualizerProps {
  phases: VisualizerPhaseInput[];
  amorphousWtPct: number;
  internalStandardPhaseId?: string;
  onUpdatePhaseIntensity?: (phaseId: string, intensity: number) => void;
}

const WAVELENGTHS = [
  { label: 'Cu Kα₁ (1.5406 Å)', val: 1.54056, doubletRatio: 1.00248, color: '#6366f1' },
  { label: 'Co Kα₁ (1.7890 Å)', val: 1.78897, doubletRatio: 1.00217, color: '#10b981' },
  { label: 'Mo Kα₁ (0.7107 Å)', val: 0.71073, doubletRatio: 1.00605, color: '#06b6d4' },
  { label: 'Cr Kα₁ (2.2897 Å)', val: 2.2897, doubletRatio: 1.00171, color: '#f59e0b' }
];

const SCAN_RANGES = [
  { id: 'auto', label: 'Auto Fit', min: null as number | null, max: null as number | null },
  { id: 'low', label: 'Low (10–40°)', min: 10, max: 40 },
  { id: 'mid', label: 'Mid (25–55°)', min: 25, max: 55 },
  { id: 'full', label: 'Full (8–80°)', min: 8, max: 80 }
];

export const RIRDiffractionVisualizer: React.FC<RIRDiffractionVisualizerProps> = ({
  phases,
  amorphousWtPct,
  internalStandardPhaseId,
  onUpdatePhaseIntensity
}) => {
  const [spectrumMode, setSpectrumMode] = useState<'continuous' | 'decomposed' | 'stick'>('continuous');
  const [profileFWHM, setProfileFWHM] = useState<number>(0.26);
  const [etaMixing, setEtaMixing] = useState<number>(0.5); // 0=Gaussian, 1=Lorentzian
  const [includeKa2Doublet, setIncludeKa2Doublet] = useState<boolean>(true);
  const [selectedWavelengthIdx, setSelectedWavelengthIdx] = useState(0);
  const [scanRangeId, setScanRangeId] = useState<string>('auto');
  const [showAmorphousHump, setShowAmorphousHump] = useState<boolean>(true);
  const [amorphousCenterAngle] = useState<number>(23.5);
  const [visiblePhases, setVisiblePhases] = useState<Record<string, boolean>>({});

  const activeAnode = WAVELENGTHS[selectedWavelengthIdx];
  const wavelength = activeAnode.val;
  const wavelengthFactor = wavelength / 1.54056;

  const togglePhaseVisibility = (phaseId: string) => {
    playSynthTone('tick');
    setVisiblePhases(prev => ({
      ...prev,
      [phaseId]: prev[phaseId] === false ? true : false
    }));
  };

  // Shift 2-theta from Cu Kα to selected anode
  const shiftTwoTheta = (cuTwoTheta: number, factor: number): number => {
    const thetaRadCu = (cuTwoTheta / 2) * (Math.PI / 180);
    const sinThetaNew = Math.min(0.999, Math.sin(thetaRadCu) * factor);
    const thetaNewDeg = (Math.asin(sinThetaNew) * 180) / Math.PI;
    return Number((thetaNewDeg * 2).toFixed(2));
  };

  // Expanded peak reflections across all phases (supporting multi-peak drawers)
  const simulatedPeakSticks = useMemo(() => {
    const items: {
      id: string;
      phaseId: string;
      name: string;
      hkl: string;
      twoTheta: number;
      intensity: number;
      rir: number;
      color: string;
      isStandard: boolean;
    }[] = [];

    phases.forEach(p => {
      if (p.peaks && p.peaks.length > 0) {
        p.peaks.forEach((pk, idx) => {
          items.push({
            id: `${p.id}-${pk.id || idx}`,
            phaseId: p.id,
            name: p.name,
            hkl: pk.hkl || p.hkl,
            twoTheta: shiftTwoTheta(pk.twoTheta, wavelengthFactor),
            intensity: pk.intensity || 0,
            rir: p.rir,
            color: p.color || '#6366f1',
            isStandard: p.id === internalStandardPhaseId
          });
        });
      } else {
        items.push({
          id: p.id,
          phaseId: p.id,
          name: p.name,
          hkl: p.hkl,
          twoTheta: shiftTwoTheta(p.twoTheta, wavelengthFactor),
          intensity: p.intensity || 0,
          rir: p.rir,
          color: p.color || '#6366f1',
          isStandard: p.id === internalStandardPhaseId
        });
      }
    });

    return items.sort((a, b) => a.twoTheta - b.twoTheta);
  }, [phases, wavelengthFactor, internalStandardPhaseId]);

  // Peak Overlap Detection across distinct phases
  const peakOverlapWarnings = useMemo(() => {
    const activeSticks = simulatedPeakSticks.filter(s => visiblePhases[s.phaseId] !== false);
    const warnings: { phaseA: string; phaseB: string; angleA: number; angleB: number; delta2Theta: number; severity: 'high' | 'medium' }[] = [];

    for (let i = 0; i < activeSticks.length; i++) {
      for (let j = i + 1; j < activeSticks.length; j++) {
        const p1 = activeSticks[i];
        const p2 = activeSticks[j];
        if (p1.phaseId === p2.phaseId) continue;
        const delta = Math.abs(p1.twoTheta - p2.twoTheta);
        if (delta < profileFWHM * 1.6) {
          warnings.push({
            phaseA: `${p1.name} ${p1.hkl}`,
            phaseB: `${p2.name} ${p2.hkl}`,
            angleA: p1.twoTheta,
            angleB: p2.twoTheta,
            delta2Theta: delta,
            severity: delta < profileFWHM * 0.8 ? 'high' : 'medium'
          });
        }
      }
    }
    return warnings;
  }, [simulatedPeakSticks, visiblePhases, profileFWHM]);

  // Continuous Pseudo-Voigt + K-alpha2 Doublet Diffraction Profile
  const continuousPatternData = useMemo(() => {
    if (phases.length === 0) return [];

    const activeSticks = simulatedPeakSticks.filter(s => visiblePhases[s.phaseId] !== false);
    const rangePreset = SCAN_RANGES.find(r => r.id === scanRangeId) || SCAN_RANGES[0];

    const angles = activeSticks.map(s => s.twoTheta);
    const minAngle = rangePreset.min ?? Math.max(6, Math.floor((angles.length > 0 ? Math.min(...angles) : 20) - 5));
    const maxAngle = rangePreset.max ?? Math.min(85, Math.ceil((angles.length > 0 ? Math.max(...angles) : 50) + 5));
    const step = (maxAngle - minAngle) <= 35 ? 0.1 : 0.16;
    const numSteps = Math.ceil((maxAngle - minAngle) / step);

    const fwhm = profileFWHM > 0 ? profileFWHM : 0.26;
    const eta = Math.min(1, Math.max(0, etaMixing));
    const data: Record<string, number>[] = [];

    for (let i = 0; i <= numSteps; i++) {
      const tt = Number((minAngle + i * step).toFixed(2));
      const point: Record<string, number> = { twoTheta: tt, Total: 0, Background: 0 };

      let totalInt = 0;

      // Baseline cosmic + amorphous diffuse halo
      if (showAmorphousHump && amorphousWtPct > 0) {
        const humpCenter = amorphousCenterAngle * wavelengthFactor;
        const humpFWHM = 9.5;
        const humpAmp = (amorphousWtPct / 100) * 1800;
        const humpVal = 40 + humpAmp * Math.exp(-4 * Math.LN2 * Math.pow((tt - humpCenter) / humpFWHM, 2));
        point.Background = Number(humpVal.toFixed(1));
        totalInt += humpVal;
      } else {
        point.Background = 40;
        totalInt += 40;
      }

      // Accumulate contributions grouped by phase
      activeSticks.forEach(pk => {
        const diff1 = tt - pk.twoTheta;
        const g1 = Math.exp(-4 * Math.LN2 * Math.pow(diff1 / fwhm, 2));
        const l1 = 1 / (1 + 4 * Math.pow(diff1 / fwhm, 2));
        let val = pk.intensity * ((1 - eta) * g1 + eta * l1);

        if (includeKa2Doublet) {
          const ka2Pos = shiftTwoTheta(pk.twoTheta / wavelengthFactor, wavelengthFactor * activeAnode.doubletRatio);
          const diff2 = tt - ka2Pos;
          const g2 = Math.exp(-4 * Math.LN2 * Math.pow(diff2 / fwhm, 2));
          const l2 = 1 / (1 + 4 * Math.pow(diff2 / fwhm, 2));
          val += 0.5 * pk.intensity * ((1 - eta) * g2 + eta * l2);
        }

        const prevPhaseVal = point[pk.name] || 0;
        point[pk.name] = Number((prevPhaseVal + val).toFixed(1));
        totalInt += val;
      });

      point.Total = Number(totalInt.toFixed(1));
      data.push(point);
    }

    return data;
  }, [
    phases,
    simulatedPeakSticks,
    visiblePhases,
    profileFWHM,
    etaMixing,
    includeKa2Doublet,
    showAmorphousHump,
    amorphousWtPct,
    amorphousCenterAngle,
    wavelengthFactor,
    activeAnode.doubletRatio,
    scanRangeId
  ]);

  const exportPatternCSV = () => {
    playSynthTone('success');
    if (continuousPatternData.length === 0) return;
    const header = ['twoTheta', 'Total', 'Background', ...phases.map(p => `"${p.name}"`)].join(',');
    const rows = continuousPatternData.map(pt => {
      const pCols = phases.map(p => pt[p.name] || 0);
      return [pt.twoTheta, pt.Total, pt.Background || 0, ...pCols].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([header, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `RIR_Diffractogram_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-7 shadow-2xl flex flex-col gap-5 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 tracking-tight">
              Simulated XRD Diffraction Pattern &amp; Peak Assigner
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Synthesizing pseudo-Voigt Kα₁/Kα₂ profiles across all assigned phase reflections with amorphous halo background.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportPatternCSV}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export XY CSV</span>
          </button>

          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex gap-1">
            {[
              { id: 'continuous', label: 'Total Profile' },
              { id: 'decomposed', label: 'Phase Overlay' },
              { id: 'stick', label: 'Stick (hkl)' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  playSynthTone('tick');
                  setSpectrumMode(m.id as 'continuous' | 'decomposed' | 'stick');
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  spectrumMode === m.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Overlap Detection */}
      {peakOverlapWarnings.length > 0 && (
        <div className="bg-amber-950/25 border border-amber-500/40 rounded-xl p-3.5 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Cross-Phase Peak Proximity Alert ({peakOverlapWarnings.length} reflection pair{peakOverlapWarnings.length > 1 ? 's' : ''} within 1.6× FWHM)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-amber-200/90 font-mono tabular-nums">
            {peakOverlapWarnings.map((w, idx) => (
              <div key={idx} className="bg-slate-950/70 p-2 rounded-lg border border-amber-500/20 flex justify-between items-center gap-2">
                <span className="truncate">{w.phaseA} ({w.angleA}°) ↔ {w.phaseB} ({w.angleB}°)</span>
                <span className="font-bold text-amber-400 shrink-0">Δ2θ = {w.delta2Theta.toFixed(2)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">X-Ray Anode</span>
          <select
            value={selectedWavelengthIdx}
            onChange={e => setSelectedWavelengthIdx(parseInt(e.target.value, 10))}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-cyan-500/60"
          >
            {WAVELENGTHS.map((w, idx) => (
              <option key={idx} value={idx}>{w.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2θ Scan Window</span>
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 gap-0.5">
            {SCAN_RANGES.map(r => (
              <button
                key={r.id}
                onClick={() => setScanRangeId(r.id)}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-colors ${
                  scanRangeId === r.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Profile FWHM / Mixing η</span>
            <span className="font-mono tabular-nums text-cyan-400">{profileFWHM.toFixed(2)}° · η={etaMixing.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="range"
              min="0.08"
              max="0.80"
              step="0.02"
              value={profileFWHM}
              onChange={e => setProfileFWHM(parseFloat(e.target.value) || 0.26)}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              title="Profile FWHM (° 2θ)"
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={etaMixing}
              onChange={e => setEtaMixing(parseFloat(e.target.value) || 0.5)}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              title="Pseudo-Voigt Mixing Factor η (0=Gauss, 1=Lorentz)"
            />
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-300">
          <label className="flex items-center justify-between cursor-pointer">
            <span>Amorphous Halo ({amorphousWtPct.toFixed(0)}%)</span>
            <input
              type="checkbox"
              checked={showAmorphousHump}
              onChange={e => setShowAmorphousHump(e.target.checked)}
              className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Simulate Kα₂ Doublets</span>
            <input
              type="checkbox"
              checked={includeKa2Doublet}
              onChange={e => setIncludeKa2Doublet(e.target.checked)}
              className="w-3.5 h-3.5 accent-indigo-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {spectrumMode === 'stick' ? (
              <BarChart data={simulatedPeakSticks} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="twoTheta"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={v => `${v}°`}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 font-mono tabular-nums">
                          <span className="font-sans font-bold text-slate-100 block text-sm">{data.name}</span>
                          <span className="text-slate-400 block text-[11px]">Reflection: {data.hkl}</span>
                          <span className="text-cyan-400 font-bold block">
                            2θ: {data.twoTheta}° | Int: {data.intensity.toLocaleString()} cps
                          </span>
                          <span className="text-slate-400 text-[10px] block">
                            RIR: {data.rir.toFixed(2)} {data.isStandard && '[Internal Std]'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="intensity" radius={[3, 3, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                  {simulatedPeakSticks.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={continuousPatternData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="twoTheta"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={v => `${v}°`}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[170px] font-mono tabular-nums">
                          <span className="font-bold text-cyan-300 block text-sm">2θ: {data.twoTheta}°</span>
                          <span className="font-bold text-slate-100 block">Total Int: {data.Total} cps</span>
                          <div className="border-t border-slate-800 pt-1.5 space-y-1 text-[11px]">
                            {phases.map(p => (
                              <div key={p.id} className="flex justify-between items-center gap-3">
                                <span className="font-sans truncate max-w-[115px]" style={{ color: p.color }}>{p.name}:</span>
                                <span className="font-bold text-slate-200">{data[p.name] || 0}</span>
                              </div>
                            ))}
                            {data.Background > 0 && (
                              <div className="flex justify-between items-center text-rose-300">
                                <span className="font-sans">Background:</span>
                                <span className="font-bold">{data.Background}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <defs>
                  <linearGradient id="colorTotalRIR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {showAmorphousHump && (
                  <Area
                    type="monotone"
                    dataKey="Background"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="#f43f5e"
                    fillOpacity={0.08}
                    isAnimationActive={false}
                  />
                )}
                {spectrumMode === 'decomposed' &&
                  phases.map(p => {
                    if (visiblePhases[p.id] === false) return null;
                    const phaseColor = p.color || '#6366f1';
                    return (
                      <Area
                        key={`phase-area-${p.id}`}
                        type="monotone"
                        dataKey={p.name}
                        stroke={phaseColor}
                        strokeWidth={1.8}
                        fill={phaseColor}
                        fillOpacity={0.22}
                        isAnimationActive={false}
                      />
                    );
                  })}

                <Area
                  type="monotone"
                  dataKey="Total"
                  stroke="#06b6d4"
                  strokeWidth={spectrumMode === 'decomposed' ? 1.8 : 2.3}
                  strokeDasharray={spectrumMode === 'decomposed' ? '3 3' : undefined}
                  fill={spectrumMode === 'decomposed' ? 'none' : 'url(#colorTotalRIR)'}
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Visibility Toggles */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          {phases.map(p => {
            const isVisible = visiblePhases[p.id] !== false;
            return (
              <button
                key={p.id}
                onClick={() => togglePhaseVisibility(p.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
                  isVisible
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-500 opacity-50 line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                <span>
                  {p.name} ({p.peaks && p.peaks.length > 1 ? `${p.peaks.length} peaks` : `${p.hkl} @ ${p.twoTheta}°`})
                </span>
                {isVisible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Peak Intensity Assignment Table */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Bragg Peak Intensity Assignment &amp; Live Reduced Summary
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Live Coupled
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-xs font-mono tabular-nums">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5 text-left font-sans">Phase &amp; Reflection</th>
                <th className="px-3 py-2.5 text-right">2θ (°)</th>
                <th className="px-3 py-2.5 text-right">Peak Int. (cps)</th>
                <th className="px-3 py-2.5 text-right">RIR (I/I<sub>c</sub>)</th>
                <th className="px-3 py-2.5 text-right text-cyan-300">Reduced (I/RIR)</th>
                <th className="px-4 py-2.5 text-right text-indigo-300 font-bold">Crystalline wt%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(() => {
                const totalRed = phases.reduce((acc, ph) => {
                  const relScale = (ph.relIntensity && ph.relIntensity > 0 ? ph.relIntensity : 100) / 100;
                  const normI = (ph.intensity || 0) / relScale;
                  return acc + normI / (ph.rir > 0 ? ph.rir : 1.0);
                }, 0);
                return phases.map(p => {
                  const relScale = (p.relIntensity && p.relIntensity > 0 ? p.relIntensity : 100) / 100;
                  const normI = (p.intensity || 0) / relScale;
                  const redI = normI / (p.rir > 0 ? p.rir : 1.0);
                  const wtPct = totalRed > 0 ? (redI / totalRed) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-2.5 font-sans font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                        <span>{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {p.hkl}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-300">{p.twoTheta.toFixed(2)}°</td>
                      <td className="px-3 py-2.5 text-right">
                        {onUpdatePhaseIntensity ? (
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={p.intensity}
                            onChange={e => onUpdatePhaseIntensity(p.id, Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-28 bg-slate-900 border border-slate-700 focus:border-cyan-500 text-right text-cyan-300 font-bold rounded-md px-2 py-1 text-xs outline-none"
                          />
                        ) : (
                          <span className="text-cyan-300 font-bold">{p.intensity}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-amber-300">{p.rir.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right text-cyan-300">{redI.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-indigo-300">{wtPct.toFixed(2)} wt%</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
