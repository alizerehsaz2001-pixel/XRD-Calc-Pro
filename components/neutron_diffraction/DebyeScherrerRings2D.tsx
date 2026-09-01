import React, { useRef, useEffect, useState, useMemo } from 'react';
import { DetailedDiffractionSpectrum, NuclearMetrics } from '../../utils/neutronDiffractionPhysics';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Disc, Zap, Sliders, Eye, RefreshCw } from 'lucide-react';

interface DebyeScherrerRings2DProps {
  neutronReflections: DetailedDiffractionSpectrum[];
  radiationMode: 'neutron' | 'xray' | 'dual';
  onRadiationModeChange: (m: 'neutron' | 'xray' | 'dual') => void;
  metrics: NuclearMetrics;
  lengthUnit: string;
}

export const DebyeScherrerRings2D: React.FC<DebyeScherrerRings2DProps> = ({
  neutronReflections,
  radiationMode,
  onRadiationModeChange,
  metrics,
  lengthUnit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showIncoherentHaze, setShowIncoherentHaze] = useState<boolean>(true);
  const [exposureTime, setExposureTime] = useState<number>(1.0);
  const [beamCenterOffset, setBeamCenterOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showBeamstop, setShowBeamstop] = useState<boolean>(true);
  const [showRadialIntegration, setShowRadialIntegration] = useState<boolean>(true);

  // Render 2D detector plate
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2 + beamCenterOffset.x;
    const cy = size / 2 + beamCenterOffset.y;

    // Background dark plate
    ctx.fillStyle = '#050914';
    ctx.fillRect(0, 0, size, size);

    // Incoherent Background Haze (Diffuse isotropic neutron halo from Hydrogen/Incoherent scattering)
    if (showIncoherentHaze && metrics.totalIncoherentSigma > 0.1) {
      const hazeStrength = Math.min(0.6, (metrics.incoherentHazeRatio * 0.25 + 0.05) * exposureTime);
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, size * 0.7);
      grad.addColorStop(0, `rgba(245, 158, 11, ${hazeStrength * 0.5})`);
      grad.addColorStop(0.3, `rgba(245, 158, 11, ${hazeStrength * 0.25})`);
      grad.addColorStop(0.7, `rgba(245, 158, 11, ${hazeStrength * 0.08})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    // Add quantum speckle noise
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const noiseLevel = 8 * exposureTime;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * noiseLevel;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Render Debye-Scherrer concentric powder rings
    neutronReflections.forEach(ref => {
      const twoTheta = ref.twoTheta;
      if (twoTheta <= 0 || twoTheta >= 120) return;

      // Detector distance geometry: radius r = D * tan(2θ)
      // Scaled so 60° fits around 120px
      const ringRadius = (twoTheta / 80) * (size * 0.42);

      let intensity = radiationMode === 'xray' ? ref.intensity_xray : ref.intensity_nuc;
      if (intensity < 0.5) return;

      const normInt = Math.min(1.0, (intensity / 100) * exposureTime);
      const alpha = Math.min(0.95, normInt * 0.85 + 0.15);

      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, 2 * Math.PI);

      if (radiationMode === 'neutron') {
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`; // Cyan / Blue for neutrons
      } else if (radiationMode === 'xray') {
        ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`; // Purple for X-rays
      } else {
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`; // Emerald for dual
      }

      ctx.lineWidth = Math.max(1.2, Math.min(4, 1.0 + normInt * 2.5));
      ctx.stroke();

      // Soft glow aura around intense rings
      if (normInt > 0.4) {
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = radiationMode === 'xray' ? `rgba(168, 85, 247, 0.25)` : `rgba(56, 189, 248, 0.25)`;
        ctx.lineWidth = ctx.lineWidth * 2.5;
        ctx.stroke();
      }
    });

    // Beamstop & direct beam shadow
    if (showBeamstop) {
      // Beamstop arm
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(size, cy + 8);
      ctx.lineTo(size, cy - 8);
      ctx.fillStyle = '#020617';
      ctx.fill();

      // Central beamstop cup
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
      ctx.fillStyle = '#020617';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Beam center crosshair dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  }, [neutronReflections, radiationMode, showIncoherentHaze, exposureTime, beamCenterOffset, showBeamstop, metrics]);

  // Generate 1D integration curve data
  const integrationData = useMemo(() => {
    return neutronReflections.map(r => ({
      twoTheta: parseFloat(r.twoTheta.toFixed(2)),
      intensity: radiationMode === 'xray' ? r.intensity_xray : r.intensity_nuc,
      hkl: r.hklStr
    }));
  }, [neutronReflections, radiationMode]);

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Header & Sub-Bar */}
      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              2D Debye-Scherrer Detector & Azimuthal Integration
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Radiation: <strong className="text-white capitalize">{radiationMode}</strong>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates flat-plate pixel detector intersecting 3D Debye-Scherrer cones, with incoherent isotropic background haze and direct beamstop shadow.
          </p>
        </div>

        {/* Radiation Toggle */}
        <div className="flex items-center gap-1.5 bg-[#070D18] p-1.5 rounded-xl border border-white/10 shrink-0">
          {(['neutron', 'xray', 'dual'] as const).map(m => (
            <button
              key={m}
              onClick={() => onRadiationModeChange(m)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                radiationMode === m
                  ? m === 'xray' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    m === 'neutron' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Detector Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 2D Detector Canvas (5 Cols) */}
        <div className="lg:col-span-5 bg-[#070D18] p-5 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-4 shadow-2xl">
          <div className="relative w-[300px] h-[300px] rounded-2xl overflow-hidden border border-white/10 shadow-inner">
            <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-slate-400 border border-white/10">
              Detector: 320×320 Area
            </div>
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-cyan-400 border border-white/10">
              2θ_max ≈ 90°
            </div>
          </div>

          {/* Detector Controls */}
          <div className="w-full grid grid-cols-2 gap-3 text-[10px]">
            <button
              onClick={() => setShowIncoherentHaze(!showIncoherentHaze)}
              className={`p-2 rounded-xl border font-bold transition-all ${
                showIncoherentHaze ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-black/30 border-white/5 text-slate-500'
              }`}
            >
              Inc. Haze: {showIncoherentHaze ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowBeamstop(!showBeamstop)}
              className={`p-2 rounded-xl border font-bold transition-all ${
                showBeamstop ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-black/30 border-white/5 text-slate-500'
              }`}
            >
              Beamstop: {showBeamstop ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 1D Azimuthal Radial Integration Profile (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0B1528] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              Azimuthal Radial Profile I(2θ)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              {neutronReflections.length} Bragg Reflections Indexed
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={integrationData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="twoTheta"
                  label={{ value: '2θ (degrees)', position: 'bottom', offset: 5, fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                />
                <YAxis
                  label={{ value: 'Intensity (%)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-3 rounded-xl border border-slate-800 text-[10px] space-y-1">
                          <p className="font-bold text-cyan-400">Plane {d.hkl} at {d.twoTheta}°</p>
                          <p className="text-slate-300">Relative Intensity: <strong>{d.intensity.toFixed(1)}%</strong></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke={radiationMode === 'xray' ? '#a855f7' : '#38bdf8'}
                  strokeWidth={2}
                  dot={{ r: 3, fill: radiationMode === 'xray' ? '#a855f7' : '#38bdf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Exposure Time Slider */}
          <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>Simulated Beam Exposure:</span>
              <span className="font-mono text-cyan-400">{exposureTime.toFixed(1)}× flux</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={exposureTime}
              onChange={(e) => setExposureTime(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
