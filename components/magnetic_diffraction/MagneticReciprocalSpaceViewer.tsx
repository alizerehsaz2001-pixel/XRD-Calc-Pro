import React, { useState, useRef, useEffect } from 'react';
import { LatticeParameters } from '../../types';
import { MagneticReflection } from '../../utils/magneticDiffractionPhysics';
import { Compass, ZoomIn, ZoomOut, Layers, Info } from 'lucide-react';

interface MagneticReciprocalSpaceViewerProps {
  lattice: LatticeParameters;
  reflections: MagneticReflection[];
  kVector: { x: number; y: number; z: number };
  wavelength: number;
}

export const MagneticReciprocalSpaceViewer: React.FC<MagneticReciprocalSpaceViewerProps> = ({
  lattice,
  reflections,
  kVector,
  wavelength
}) => {
  const [slicePlane, setSlicePlane] = useState<'HK0' | 'H0L' | '0KL' | 'HHL'>('HK0');
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredPeak, setHoveredPeak] = useState<MagneticReflection | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Background
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = (Math.min(width, height) * 0.11) * zoom;

    // Draw Grid Lines in reciprocal space (h, k in r.l.u.)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 0.5;

    const gridExtent = 4;
    for (let i = -gridExtent; i <= gridExtent; i++) {
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(cx - gridExtent * scale, cy + i * scale);
      ctx.lineTo(cx + gridExtent * scale, cy + i * scale);
      ctx.stroke();

      // Vertical
      ctx.beginPath();
      ctx.moveTo(cx + i * scale, cy - gridExtent * scale);
      ctx.lineTo(cx + i * scale, cy + gridExtent * scale);
      ctx.stroke();
    }

    // Origin Axes
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - gridExtent * scale, cy);
    ctx.lineTo(cx + gridExtent * scale, cy);
    ctx.moveTo(cx, cy - gridExtent * scale);
    ctx.lineTo(cx, cy + gridExtent * scale);
    ctx.stroke();

    // Axis Labels based on slice
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 11px monospace';
    let horizLabel = 'H';
    let vertLabel = 'K';
    if (slicePlane === 'H0L') { horizLabel = 'H'; vertLabel = 'L'; }
    else if (slicePlane === '0KL') { horizLabel = 'K'; vertLabel = 'L'; }
    else if (slicePlane === 'HHL') { horizLabel = 'H=K'; vertLabel = 'L'; }

    ctx.fillText(`${horizLabel} (r.l.u.) →`, cx + gridExtent * scale - 75, cy + 18);
    ctx.fillText(`↑ ${vertLabel} (r.l.u.)`, cx + 8, cy - gridExtent * scale + 15);

    // Maximum Ewald Sphere Circle at wavelength: Q_max = 4pi / lambda
    const qMaxRlu = (4 * Math.PI / wavelength) / (2 * Math.PI / lattice.a);
    if (isFinite(qMaxRlu) && qMaxRlu > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, qMaxRlu * scale * 0.5, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.5)';
      ctx.font = '9px monospace';
      ctx.fillText(`Ewald Boundary (2θ = 180°)`, cx + 8, cy - qMaxRlu * scale * 0.5 - 4);
    }

    // Filter reflections lying on the chosen plane
    const onPlaneReflections = reflections.filter(ref => {
      const [qh, qk, ql] = ref.qVector;
      if (slicePlane === 'HK0') return Math.abs(ql) < 0.08;
      if (slicePlane === 'H0L') return Math.abs(qk) < 0.08;
      if (slicePlane === '0KL') return Math.abs(qh) < 0.08;
      if (slicePlane === 'HHL') return Math.abs(qh - qk) < 0.08;
      return true;
    });

    // Draw modulation propagation vector k if non-zero
    const isKNonZero = Math.abs(kVector.x) > 1e-4 || Math.abs(kVector.y) > 1e-4 || Math.abs(kVector.z) > 1e-4;
    if (isKNonZero) {
      let kh = kVector.x, kv = kVector.y;
      if (slicePlane === 'H0L') { kh = kVector.x; kv = kVector.z; }
      else if (slicePlane === '0KL') { kh = kVector.y; kv = kVector.z; }
      else if (slicePlane === 'HHL') { kh = Math.sqrt(kVector.x ** 2 + kVector.y ** 2); kv = kVector.z; }

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + kh * scale, cy - kv * scale);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`k-vector`, cx + kh * scale + 6, cy - kv * scale);
    }

    // Render Reflections
    onPlaneReflections.forEach(ref => {
      const [qh, qk, ql] = ref.qVector;
      let px = 0, py = 0;
      if (slicePlane === 'HK0') { px = qh; py = qk; }
      else if (slicePlane === 'H0L') { px = qh; py = ql; }
      else if (slicePlane === '0KL') { px = qk; py = ql; }
      else if (slicePlane === 'HHL') { px = (qh + qk) / Math.SQRT2; py = ql; }

      const x = cx + px * scale;
      const y = cy - py * scale;

      const isMagnetic = ref.magneticIntensity > 0.1 * ref.nuclearIntensity || ref.isSatellite;
      const maxInt = Math.max(...reflections.map(r => r.totalIntensity)) || 1;
      const radius = Math.max(3, Math.min(12, Math.sqrt(ref.totalIntensity / maxInt) * 14));

      if (ref.isSatellite) {
        // Draw satellite as a rotated diamond / star
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.fillRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4);
        ctx.restore();
      } else if (isMagnetic && ref.nuclearIntensity < 0.1) {
        // Pure Magnetic superlattice reflection
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ec4899';
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 8;
        ctx.fill();
      } else if (isMagnetic) {
        // Mixed Nuclear + Magnetic reflection (dual ring)
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      } else {
        // Pure Nuclear reflection
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 4;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Small index tag
      if (radius > 5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '8px monospace';
        ctx.fillText(ref.label.replace(/[()]/g, ''), x + radius + 2, y + 3);
      }
    });

    ctx.restore();
  }, [lattice, reflections, kVector, wavelength, slicePlane, zoom]);

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl relative overflow-hidden text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-xl border border-indigo-500/30">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              2D Reciprocal Space &amp; Satellite Map
            </h3>
            <p className="text-[10px] text-slate-400">
              Interactive reciprocal lattice plane cuts with magnetic propagation modulation
            </p>
          </div>
        </div>

        {/* Plane cut selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['HK0', 'H0L', '0KL', 'HHL'] as const).map(plane => (
            <button
              key={plane}
              onClick={() => setSlicePlane(plane)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                slicePlane === plane
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ({plane})
            </button>
          ))}
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
            className="p-1 text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
            className="p-1 text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-[#060a14] rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        <canvas ref={canvasRef} className="w-full h-[280px] block" />

        {/* Legend Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-white/10 text-[9px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50" />
            <span className="text-slate-300">Nuclear Bragg</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block shadow-sm shadow-pink-500/50" />
            <span className="text-slate-300">Magnetic Superlattice</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rotate-45 bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
            <span className="text-slate-300">Satellite (Q ± k)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
