import React, { useRef, useEffect, useState } from 'react';
import { MagneticReflection } from '../../utils/magneticDiffractionPhysics';
import { Disc, ZoomIn, ZoomOut, Sliders, RefreshCw, Eye } from 'lucide-react';

interface Magnetic2DDetectorRingsProps {
  reflections: MagneticReflection[];
  wavelength: number;
}

export const Magnetic2DDetectorRings: React.FC<Magnetic2DDetectorRingsProps> = ({
  reflections,
  wavelength
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scaleMode, setScaleMode] = useState<'log' | 'sqrt' | 'linear'>('sqrt');
  const [colorScheme, setColorScheme] = useState<'coolwarm' | 'inferno' | 'cyan_rose'>('cyan_rose');
  const [detectorTilt, setDetectorTilt] = useState<number>(0); // tilt angle in degrees
  const [zoom, setZoom] = useState<number>(1.0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    // Dark Background
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxR = (Math.min(width, height) * 0.45) * zoom;

    // Outer detector circle & grid
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, 2 * Math.PI);
    ctx.fillStyle = '#090d1a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Concentric 2theta calibration circles (10°, 20°, 30°, 40°, 50°, 60°)
    const maxTwoTheta = 90;
    for (let deg = 15; deg <= maxTwoTheta; deg += 15) {
      const ringRadius = (deg / maxTwoTheta) * maxR;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '8px monospace';
      ctx.fillText(`${deg}°`, cx + ringRadius + 2, cy - 2);
    }

    const maxIntensity = Math.max(...reflections.map(r => r.totalIntensity), 1);

    // Render Debye-Scherrer Rings
    reflections.forEach(ref => {
      if (ref.twoTheta > maxTwoTheta || ref.twoTheta < 2) return;

      const baseR = (ref.twoTheta / maxTwoTheta) * maxR;
      const tiltRad = (detectorTilt * Math.PI) / 180;
      const ry = baseR * Math.cos(tiltRad); // Elliptical distortion if tilted

      let scaledInt = 0;
      if (scaleMode === 'linear') scaledInt = ref.totalIntensity / maxIntensity;
      else if (scaleMode === 'sqrt') scaledInt = Math.sqrt(ref.totalIntensity / maxIntensity);
      else scaledInt = Math.log(1 + ref.totalIntensity) / Math.log(1 + maxIntensity);

      const isMagnetic = ref.magneticIntensity > 0.05 * ref.totalIntensity || ref.isSatellite;
      const alpha = Math.max(0.15, Math.min(0.95, scaledInt));
      const ringThickness = Math.max(1.2, Math.min(5, scaledInt * 6));

      ctx.beginPath();
      ctx.ellipse(cx, cy, baseR, ry, 0, 0, 2 * Math.PI);

      if (ref.isSatellite) {
        ctx.strokeStyle = `rgba(244, 63, 94, ${alpha})`;
        ctx.lineWidth = ringThickness * 1.2;
        ctx.setLineDash([6, 3]);
      } else if (isMagnetic) {
        ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
        ctx.lineWidth = ringThickness;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = ringThickness;
        ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Beamstop cup shadow
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#020408';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Beamstop holder rod
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.restore();
  }, [reflections, wavelength, scaleMode, colorScheme, detectorTilt, zoom]);

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl relative overflow-hidden text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
            <Disc className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              2D Area Detector Debye-Scherrer Simulator
            </h3>
            <p className="text-[10px] text-slate-400">
              Concentric powder rings with magnetic satellite split rings &amp; detector geometry
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['sqrt', 'log', 'linear'] as const).map(m => (
            <button
              key={m}
              onClick={() => setScaleMode(m)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all ${
                scaleMode === m ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <button onClick={() => setZoom(z => Math.min(2.0, z + 0.2))} className="p-1 text-slate-400 hover:text-white">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} className="p-1 text-slate-400 hover:text-white">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tilt angle slider */}
      <div className="flex items-center gap-3 mb-3 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">Detector Pitch (η):</span>
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={detectorTilt}
          onChange={e => setDetectorTilt(Number(e.target.value))}
          className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="text-[10px] font-mono text-purple-400 font-bold min-w-[32px]">{detectorTilt}°</span>
      </div>

      {/* Canvas */}
      <div className="relative bg-[#060a14] rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        <canvas ref={canvasRef} className="w-full h-[280px] block" />

        {/* Legend */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10 text-[9px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-slate-300">Nuclear Rings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-pink-500 inline-block" />
            <span className="text-slate-300">Magnetic Rings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-rose-400 inline-block" />
            <span className="text-slate-300">Satellite Rings (±k)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
