import React, { useRef, useEffect, useState } from 'react';
import { LatticeParameters } from '../../types';
import { MagneticAtom, MagneticMetrics } from '../../utils/magneticDiffractionPhysics';
import { Layers, RotateCw, Eye, Sparkles, ZoomIn, ZoomOut, Play, Pause, Compass, Sliders } from 'lucide-react';

interface Magnetic3DStructureVisualizerProps {
  lattice: LatticeParameters;
  atoms: MagneticAtom[];
  metrics: MagneticMetrics;
  kVector: { x: number; y: number; z: number };
  temperature: number;
  criticalTemp: number;
}

export const Magnetic3DStructureVisualizer: React.FC<Magnetic3DStructureVisualizerProps> = ({
  lattice,
  atoms,
  metrics,
  kVector,
  temperature,
  criticalTemp
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 25, y: -45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);
  const [supercell, setSupercell] = useState<'1x1x1' | '2x2x2' | '1x1x2' | '2x1x1'>('1x1x1');
  const [animatePrecession, setAnimatePrecession] = useState<boolean>(true);
  const [showMoments, setShowMoments] = useState<boolean>(true);
  const [showUnitCell, setShowUnitCell] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  // Mouse handlers for Orbit
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - dy * 0.5)),
      y: prev.y + dx * 0.5
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.0015)));
  };

  // Supercell dimension multipliers
  const getSupercellDims = () => {
    switch (supercell) {
      case '2x2x2': return { nx: 2, ny: 2, nz: 2 };
      case '1x1x2': return { nx: 1, ny: 1, nz: 2 };
      case '2x1x1': return { nx: 2, ny: 1, nz: 1 };
      default: return { nx: 1, ny: 1, nz: 1 };
    }
  };

  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      // Dark futuristic background
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const dims = getSupercellDims();
      const maxDimSpan = Math.max(dims.nx, dims.ny, dims.nz);
      const baseScale = (Math.min(width, height) * 0.32 * zoom) / maxDimSpan;

      const rx = (rotation.x * Math.PI) / 180;
      const ry = (rotation.y * Math.PI) / 180;

      // 3D Isometric / Perspective projection helper
      const project = (fx: number, fy: number, fz: number) => {
        // Shift center to supercell center
        const dx = fx - dims.nx * 0.5;
        const dy = fy - dims.ny * 0.5;
        const dz = fz - dims.nz * 0.5;

        // Yaw rotation (Y axis)
        const x1 = dx * Math.cos(ry) - dz * Math.sin(ry);
        const z1 = dx * Math.sin(ry) + dz * Math.cos(ry);

        // Pitch rotation (X axis)
        const y2 = dy * Math.cos(rx) - z1 * Math.sin(rx);
        const z2 = dy * Math.sin(rx) + z1 * Math.cos(rx);

        return {
          x: cx + x1 * baseScale,
          y: cy + y2 * baseScale,
          z: z2
        };
      };

      const elements: any[] = [];

      // Unit Cell edges for each tiled cell
      if (showUnitCell) {
        for (let ix = 0; ix < dims.nx; ix++) {
          for (let iy = 0; iy < dims.ny; iy++) {
            for (let iz = 0; iz < dims.nz; iz++) {
              const v = [
                [ix, iy, iz], [ix+1, iy, iz], [ix, iy+1, iz], [ix, iy, iz+1],
                [ix+1, iy+1, iz], [ix+1, iy, iz+1], [ix, iy+1, iz+1], [ix+1, iy+1, iz+1]
              ];
              const edges = [
                [0,1], [0,2], [0,3], [1,4], [1,5], [2,4], [2,6], [3,5], [3,6], [7,4], [7,5], [7,6]
              ];

              edges.forEach(([v1, v2]) => {
                const p1 = v[v1];
                const p2 = v[v2];
                const proj1 = project(p1[0], p1[1], p1[2]);
                const proj2 = project(p2[0], p2[1], p2[2]);
                elements.push({
                  type: 'edge',
                  p1: proj1,
                  p2: proj2,
                  color: (ix === 0 && iy === 0 && iz === 0) ? 'rgba(99, 102, 241, 0.45)' : 'rgba(71, 85, 105, 0.25)',
                  width: (ix === 0 && iy === 0 && iz === 0) ? 1.5 : 0.8,
                  z: (proj1.z + proj2.z) / 2
                });
              });
            }
          }
        }
      }

      // Coordinate metric axes at origin
      const origin = project(0, 0, 0);
      const ax_a = project(0.5, 0, 0);
      const ax_b = project(0, 0.5, 0);
      const ax_c = project(0, 0, 0.5);

      elements.push({ type: 'axis', p1: origin, p2: ax_a, label: 'a', color: '#f43f5e', z: origin.z + 10 });
      elements.push({ type: 'axis', p1: origin, p2: ax_b, label: 'b', color: '#10b981', z: origin.z + 10 });
      elements.push({ type: 'axis', p1: origin, p2: ax_c, label: 'c', color: '#38bdf8', z: origin.z + 10 });

      // Generate Atoms and Magnetic Vectors
      const tFactor = metrics.orderParameter;
      const timePhase = animatePrecession ? phaseRef.current : 0;

      for (let ix = 0; ix < dims.nx; ix++) {
        for (let iy = 0; iy < dims.ny; iy++) {
          for (let iz = 0; iz < dims.nz; iz++) {
            atoms.forEach(atom => {
              const rx_pos = atom.x + ix;
              const ry_pos = atom.y + iy;
              const rz_pos = atom.z + iz;
              const proj = project(rx_pos, ry_pos, rz_pos);

              // Modulation wave phase: 2pi * (k . R)
              const modPhase = 2 * Math.PI * (kVector.x * rx_pos + kVector.y * ry_pos + kVector.z * rz_pos) + timePhase;
              const modFactor = (Math.abs(kVector.x) > 1e-4 || Math.abs(kVector.y) > 1e-4 || Math.abs(kVector.z) > 1e-4)
                ? Math.cos(modPhase)
                : 1.0;

              let color = '#818cf8';
              if (atom.element === 'Fe') color = '#ef4444';
              else if (atom.element === 'Mn') color = '#f97316';
              else if (atom.element === 'Co') color = '#a855f7';
              else if (atom.element === 'Ni') color = '#06b6d4';
              else if (atom.element === 'Cu') color = '#10b981';
              else if (atom.element === 'Cr') color = '#eab308';
              else if (atom.element === 'Dy' || atom.element === 'Tb') color = '#ec4899';
              else if (atom.element === 'O') color = '#64748b';

              const baseRadius = atom.element === 'O' ? 7 : 13;
              const r = Math.max(5, baseRadius * (0.8 + 0.3 * (proj.z / (dims.nx * baseScale || 100))));

              elements.push({
                type: 'atom',
                p: proj,
                rawAtom: atom,
                radius: r,
                color,
                label: atom.label,
                mx: (atom.mx || 0) * tFactor * modFactor,
                my: (atom.my || 0) * tFactor * modFactor,
                mz: (atom.mz || 0) * tFactor * modFactor,
                rx_pos,
                ry_pos,
                rz_pos,
                z: proj.z
              });
            });
          }
        }
      }

      // Sort by Z for correct painter's depth
      elements.sort((a, b) => b.z - a.z);

      // Render elements
      elements.forEach(el => {
        if (el.type === 'edge') {
          ctx.beginPath();
          ctx.moveTo(el.p1.x, el.p1.y);
          ctx.lineTo(el.p2.x, el.p2.y);
          ctx.strokeStyle = el.color;
          ctx.lineWidth = el.width;
          ctx.stroke();
        } else if (el.type === 'axis') {
          ctx.beginPath();
          ctx.moveTo(el.p1.x, el.p1.y);
          ctx.lineTo(el.p2.x, el.p2.y);
          ctx.strokeStyle = el.color;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = el.color;
          ctx.font = 'bold 10px monospace';
          ctx.fillText(el.label, el.p2.x + 5, el.p2.y + 5);
        } else if (el.type === 'atom') {
          // Draw Atom Sphere with 3D Radial specular highlight
          const grad = ctx.createRadialGradient(
            el.p.x - el.radius * 0.35, el.p.y - el.radius * 0.35, el.radius * 0.1,
            el.p.x, el.p.y, el.radius
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, el.color);
          grad.addColorStop(1, '#0b0f19');

          ctx.beginPath();
          ctx.arc(el.p.x, el.p.y, el.radius, 0, 2 * Math.PI);
          ctx.fillStyle = grad;
          ctx.shadowColor = el.color;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (showLabels && el.rawAtom.element !== 'O') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(el.label, el.p.x, el.p.y - el.radius - 4);
          }

          // Draw Magnetic Vector Arrow
          const magMoment = Math.sqrt(el.mx * el.mx + el.my * el.my + el.mz * el.mz);
          if (showMoments && magMoment > 0.04) {
            const arrowScale = 0.22;
            const destProj = project(
              el.rx_pos + el.mx * arrowScale,
              el.ry_pos + el.my * arrowScale,
              el.rz_pos + el.mz * arrowScale
            );

            // Vector Shaft
            ctx.beginPath();
            ctx.moveTo(el.p.x, el.p.y);
            ctx.lineTo(destProj.x, destProj.y);
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Vector Arrow Head
            const angle = Math.atan2(destProj.y - el.p.y, destProj.x - el.p.x);
            const headLength = 9;
            ctx.beginPath();
            ctx.moveTo(destProj.x, destProj.y);
            ctx.lineTo(destProj.x - headLength * Math.cos(angle - Math.PI / 6), destProj.y - headLength * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(destProj.x - headLength * Math.cos(angle + Math.PI / 6), destProj.y - headLength * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fillStyle = '#f43f5e';
            ctx.fill();
          }
        }
      });

      // HUD Info overlay
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ORBIT: ${Math.round(rotation.x)}° / ${Math.round(rotation.y)}°  ZOOM: ${(zoom * 100).toFixed(0)}%`, 14, 20);
      ctx.fillText(`M(T)/M(0) = ${(metrics.orderParameter * 100).toFixed(1)}% | T = ${temperature} K`, 14, 34);

      ctx.restore();

      if (animatePrecession) {
        phaseRef.current += 0.04;
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [lattice, atoms, metrics, kVector, temperature, criticalTemp, rotation, zoom, supercell, animatePrecession, showMoments, showUnitCell, showLabels]);

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-indigo-500/20 p-5 shadow-2xl relative overflow-hidden text-left backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-rose-500/20 to-indigo-500/20 rounded-xl border border-rose-500/30">
            <Layers className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              3D Magnetic Spin &amp; Supercell Studio
            </h3>
            <p className="text-[10px] text-slate-400">
              Interactive vector moment array with modulation wave &amp; supercell tiling
            </p>
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setAnimatePrecession(!animatePrecession)}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              animatePrecession ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle Spin Dynamics Animation"
          >
            {animatePrecession ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowMoments(!showMoments)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              showMoments ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            M-VECTORS
          </button>
          <button
            onClick={() => setRotation({ x: 25, y: -45 })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Reset Rotation View"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative bg-[#060a14] rounded-2xl border border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-[320px] block"
        />

        {/* Supercell selector overlay */}
        <div className="absolute top-3 left-3 flex gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
          {(['1x1x1', '2x2x2', '1x1x2', '2x1x1'] as const).map(sc => (
            <button
              key={sc}
              onClick={() => setSupercell(sc)}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold transition-all ${
                supercell === sc ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sc}
            </button>
          ))}
        </div>

        {/* Zoom Buttons overlay */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
            className="p-1 text-slate-300 hover:text-white"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
            className="p-1 text-slate-300 hover:text-white"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Drag cue */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[8px] font-mono text-slate-400 pointer-events-none">
          DRAG TO ROTATE • SCROLL TO ZOOM
        </div>
      </div>

      {/* Footer metrics strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-left">
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[8px] font-mono uppercase text-slate-500 block">Magnetic Order</span>
          <span className="text-xs font-black text-amber-400 truncate block mt-0.5">{metrics.orderType.split('(')[0]}</span>
        </div>
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[8px] font-mono uppercase text-slate-500 block">Net |M| (T)</span>
          <span className="text-xs font-mono font-black text-rose-400 block mt-0.5">
            {metrics.netMomentT.mag.toFixed(2)} <span className="text-[9px] text-slate-500">μB</span>
          </span>
        </div>
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[8px] font-mono uppercase text-slate-500 block">Sublattice Σ|M|</span>
          <span className="text-xs font-mono font-black text-indigo-400 block mt-0.5">
            {metrics.totalSublatticeMomentT.toFixed(2)} <span className="text-[9px] text-slate-500">μB</span>
          </span>
        </div>
        <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
          <span className="text-[8px] font-mono uppercase text-slate-500 block">Modulation λ</span>
          <span className="text-xs font-mono font-black text-cyan-400 block mt-0.5">
            {metrics.spiralPitchAngstrom ? `${metrics.spiralPitchAngstrom.toFixed(1)} Å` : 'Commensurate'}
          </span>
        </div>
      </div>
    </div>
  );
};
