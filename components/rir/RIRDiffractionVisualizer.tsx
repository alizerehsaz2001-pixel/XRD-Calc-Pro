import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  Activity,
  Download,
  Info,
  RotateCcw,
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
  Legend,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { playSynthTone } from '../../utils/sound';
import { RIRMatrixPhase } from './RIRMatrixInspector';

interface RIRDiffractionVisualizerProps {
  phases: RIRMatrixPhase[];
  amorphousWtPct: number;
}

const WAVELENGTHS = [
  { label: 'Cu Kα (1.5406 Å)', val: 1.54056, color: '#6366f1' },
  { label: 'Co Kα (1.7890 Å)', val: 1.78897, color: '#10b981' },
  { label: 'Mo Kα (0.7107 Å)', val: 0.71073, color: '#06b6d4' },
  { label: 'Cr Kα (2.2897 Å)', val: 2.28970, color: '#f59e0b' }
];

export const RIRDiffractionVisualizer: React.FC<RIRDiffractionVisualizerProps> = ({
  phases,
  amorphousWtPct
}) => {
  const [spectrumMode, setSpectrumMode] = useState<'continuous' | 'stick'>('continuous');
  const [profileFWHM, setProfileFWHM] = useState<number>(0.28);
  const [selectedWavelengthIdx, setSelectedWavelengthIdx] = useState(0);
  const [showAmorphousHump, setShowAmorphousHump] = useState<boolean>(true);
  const [amorphousCenterAngle, setAmorphousCenterAngle] = useState<number>(23.5);
  const [visiblePhases, setVisiblePhases] = useState<Record<string, boolean>>({});

  const wavelength = WAVELENGTHS[selectedWavelengthIdx].val;

  // Toggle phase visibility in chart
  const togglePhaseVisibility = (phaseId: string) => {
    playSynthTone('tick');
    setVisiblePhases(prev => ({
      ...prev,
      [phaseId]: prev[phaseId] === false ? true : false
    }));
  };

  // Convert 2-Theta if wavelength changed relative to Cu Kα
  const wavelengthFactor = wavelength / 1.54056;

  // Stick diagram simulated XRD data
  const simulatedPeakSticks = useMemo(() => {
    const sorted = [...phases].sort((a, b) => a.twoTheta - b.twoTheta);
    return sorted.map(p => {
      // Bragg law shift: sin(theta_new) = sin(theta_cu) * (lambda_new / lambda_cu)
      const thetaRadCu = (p.twoTheta / 2) * (Math.PI / 180);
      const sinThetaNew = Math.min(0.999, Math.sin(thetaRadCu) * wavelengthFactor);
      const thetaNewDeg = (Math.asin(sinThetaNew) * 180) / Math.PI;
      const shifted2Theta = Number((thetaNewDeg * 2).toFixed(2));

      return {
        id: p.id,
        name: p.name,
        hkl: p.hkl,
        twoTheta: shifted2Theta,
        intensity: p.intensity || 0,
        rir: p.rir,
        color: p.color || '#6366f1'
      };
    });
  }, [phases, wavelengthFactor]);

  // Continuous Pseudo-Voigt Diffraction Profile
  const continuousPatternData = useMemo(() => {
    if (phases.length === 0) return [];

    const activeSticks = simulatedPeakSticks.filter(s => visiblePhases[s.id] !== false);
    const angles = activeSticks.map(s => s.twoTheta);
    const minAngle = Math.max(8, Math.floor((angles.length > 0 ? Math.min(...angles) : 20) - 6));
    const maxAngle = Math.min(85, Math.ceil((angles.length > 0 ? Math.max(...angles) : 50) + 6));
    const step = 0.2;
    const numSteps = Math.ceil((maxAngle - minAngle) / step);

    const data: any[] = [];
    const fwhm = profileFWHM > 0 ? profileFWHM : 0.28;

    for (let i = 0; i <= numSteps; i++) {
      const tt = Number((minAngle + i * step).toFixed(2));
      const point: Record<string, any> = { twoTheta: tt, Total: 0, Background: 0 };

      let totalInt = 0;

      // Amorphous hump component (broad Gaussian ~8-12 deg FWHM)
      if (showAmorphousHump && amorphousWtPct > 0) {
        const humpCenter = amorphousCenterAngle * (wavelength / 1.54056);
        const humpFWHM = 9.0;
        const humpAmp = (amorphousWtPct / 100) * 1800;
        const humpVal = humpAmp * Math.exp(-4 * Math.LN2 * Math.pow((tt - humpCenter) / humpFWHM, 2));
        point.Background = Number(humpVal.toFixed(1));
        totalInt += humpVal;
      }

      // Add individual phase contributions
      activeSticks.forEach(p => {
        const diff = tt - p.twoTheta;
        const g = Math.exp(-4 * Math.LN2 * Math.pow(diff / fwhm, 2));
        const l = 1 / (1 + 4 * Math.pow(diff / fwhm, 2));
        const profileVal = p.intensity * (0.5 * g + 0.5 * l);
        const phaseVal = Number(profileVal.toFixed(1));

        point[p.name] = phaseVal;
        totalInt += phaseVal;
      });

      point.Total = Number(totalInt.toFixed(1));
      data.push(point);
    }

    return data;
  }, [phases, simulatedPeakSticks, visiblePhases, profileFWHM, showAmorphousHump, amorphousWtPct, amorphousCenterAngle, wavelength]);

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col gap-6 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              Simulated XRD Diffraction Pattern Visualizer
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Synthesizing continuous pseudo-Voigt Bragg profile convolutions with multi-phase overlays and amorphous background modeling.
            </p>
          </div>
        </div>

        {/* Spectrum Mode Switcher */}
        <div className="bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl flex gap-1.5 shadow-inner">
          <button
            onClick={() => { playSynthTone('tick'); setSpectrumMode('continuous'); }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              spectrumMode === 'continuous'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Continuous Pseudo-Voigt
          </button>
          <button
            onClick={() => { playSynthTone('tick'); setSpectrumMode('stick'); }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
              spectrumMode === 'stick'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Stick Diagram (I)
          </button>
        </div>
      </div>

      {/* Control Bar: Wavelength, FWHM, Amorphous Hump */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
        {/* Wavelength Switcher */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">X-Ray Radiation Anode</span>
          <select
            value={selectedWavelengthIdx}
            onChange={(e) => setSelectedWavelengthIdx(parseInt(e.target.value, 10))}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-cyan-500/60"
          >
            {WAVELENGTHS.map((w, idx) => (
              <option key={idx} value={idx}>{w.label}</option>
            ))}
          </select>
        </div>

        {/* FWHM Broadening */}
        {spectrumMode === 'continuous' && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Pseudo-Voigt FWHM</span>
              <span className="font-mono text-cyan-400">{profileFWHM}° 2θ</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.80"
              step="0.02"
              value={profileFWHM}
              onChange={(e) => setProfileFWHM(parseFloat(e.target.value) || 0.28)}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Amorphous Hump Switch */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Amorphous Matrix Hump</span>
            <input
              type="checkbox"
              checked={showAmorphousHump}
              onChange={(e) => setShowAmorphousHump(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            {amorphousWtPct > 0
              ? `Simulating broad diffuse halo from ${amorphousWtPct} wt% non-crystalline matrix.`
              : 'Add amorphous wt% in Phase Engine to enable background halo.'}
          </p>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {spectrumMode === 'stick' ? (
              <BarChart data={simulatedPeakSticks} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="twoTheta"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}°`}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <span className="font-bold text-slate-200 block text-sm">{data.name}</span>
                          <span className="text-slate-400 block text-[11px]">Reflection: {data.hkl}</span>
                          <span className="text-cyan-400 font-mono font-bold block">
                            2θ: {data.twoTheta}° | Intensity: {data.intensity} cps
                          </span>
                          <span className="text-slate-400 font-mono text-[10px] block">
                            RIR: {data.rir}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="intensity" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {simulatedPeakSticks.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={continuousPatternData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="twoTheta"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}°`}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[160px]">
                          <span className="font-bold text-cyan-300 block text-sm">2θ: {data.twoTheta}°</span>
                          <span className="font-mono font-bold text-slate-200 block">Total Int: {data.Total} cps</span>
                          <div className="border-t border-slate-800 pt-1.5 space-y-1 text-[11px]">
                            {phases.map(p => (
                              <div key={p.id} className="flex justify-between items-center">
                                <span className="text-slate-400 truncate max-w-[110px]" style={{ color: p.color }}>{p.name}:</span>
                                <span className="font-mono font-bold text-slate-200">{data[p.name] || 0}</span>
                              </div>
                            ))}
                            {data.Background > 0 && (
                              <div className="flex justify-between items-center text-rose-300">
                                <span>Amorphous Halo:</span>
                                <span className="font-mono font-bold">{data.Background}</span>
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
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {showAmorphousHump && amorphousWtPct > 0 && (
                  <Area
                    type="monotone"
                    dataKey="Background"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="#f43f5e"
                    fillOpacity={0.1}
                    isAnimationActive={false}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="Total"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#colorTotal)"
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Phase Badges & Visibility Toggles */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          {phases.map((p) => {
            const isVisible = visiblePhases[p.id] !== false;
            return (
              <button
                key={p.id}
                onClick={() => togglePhaseVisibility(p.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                  isVisible
                    ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-500 opacity-50 line-through'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                <span>{p.name} ({p.hkl} @ {p.twoTheta}°)</span>
                {isVisible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
