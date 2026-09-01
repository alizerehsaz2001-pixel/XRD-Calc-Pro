import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LatticeParameters } from '../../types';
import { NeutronAtomExtended, calculateDetailedNuclearDiffraction } from '../../utils/neutronDiffractionPhysics';
import { Layers, Eye, Sparkles, Compass, Info } from 'lucide-react';

interface UnitCellFourierMapProps {
  lattice: LatticeParameters;
  atoms: NeutronAtomExtended[];
  wavelength: number;
  lengthUnit: string;
}

export const UnitCellFourierMap: React.FC<UnitCellFourierMapProps> = ({
  lattice,
  atoms,
  wavelength,
  lengthUnit
}) => {
  const [projectionPlane, setProjectionPlane] = useState<'ab' | 'bc' | 'ca'>('ab');
  const [viewMode, setViewMode] = useState<'spheres' | 'sld_density' | 'overlay'>('overlay');
  const [hoveredAtom, setHoveredAtom] = useState<NeutronAtomExtended | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute cell volume
  const cellVol = Math.max(1, lattice.a * lattice.b * lattice.c);

  // Coordinates mapping based on projection plane
  const planeInfo = useMemo(() => {
    switch (projectionPlane) {
      case 'ab': return { axis1: 'a (X)', axis2: 'b (Y)', coord1: 'x', coord2: 'y', normal: 'c (Z)' };
      case 'bc': return { axis1: 'b (Y)', axis2: 'c (Z)', coord1: 'y', coord2: 'z', normal: 'a (X)' };
      case 'ca': return { axis1: 'c (Z)', axis2: 'a (X)', coord1: 'z', coord2: 'x', normal: 'b (Y)' };
    }
  }, [projectionPlane]);

  // Generate 2D Nuclear SLD density field on a 64x64 grid using Gaussian nuclear scattering packets
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 300;
    const height = 300;
    canvas.width = width;
    canvas.height = height;

    if (viewMode === 'spheres') {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Unit cell margins inside canvas
    const pad = 30;
    const boxSize = width - 2 * pad;

    // Grid computation
    const gridRes = 75;
    const grid: number[][] = Array.from({ length: gridRes }, () => Array(gridRes).fill(0));

    // Project each atom as a 2D Gaussian density packet
    atoms.forEach(atom => {
      let u = 0; let v = 0;
      if (projectionPlane === 'ab') { u = atom.x; v = atom.y; }
      else if (projectionPlane === 'bc') { u = atom.y; v = atom.z; }
      else { u = atom.z; v = atom.x; }

      // Wrap to [0, 1)
      u = ((u % 1) + 1) % 1;
      v = ((v % 1) + 1) % 1;

      const sigma = 0.08; // Gaussian spread representing thermal vibration B_iso
      const amplitude = atom.b; // fm (can be positive or negative!)

      for (let gi = 0; gi < gridRes; gi++) {
        for (let gj = 0; gj < gridRes; gj++) {
          const gu = gi / (gridRes - 1);
          const gv = gj / (gridRes - 1);

          // Calculate distance with periodic boundary conditions
          let du = Math.abs(gu - u);
          if (du > 0.5) du = 1.0 - du;
          let dv = Math.abs(gv - v);
          if (dv > 0.5) dv = 1.0 - dv;

          const distSq = du * du + dv * dv;
          const val = amplitude * Math.exp(-distSq / (2 * sigma * sigma));
          grid[gi][gj] += val;
        }
      }
    });

    // Render pixel grid to canvas
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const idx = (py * width + px) * 4;

        if (px < pad || px >= width - pad || py < pad || py >= height - pad) {
          // Outside unit cell boundary
          data[idx] = 7;
          data[idx + 1] = 13;
          data[idx + 2] = 25;
          data[idx + 3] = 255;
          continue;
        }

        const gu = Math.floor(((px - pad) / boxSize) * gridRes);
        const gv = Math.floor(((height - pad - py) / boxSize) * gridRes);

        const clampedU = Math.max(0, Math.min(gridRes - 1, gu));
        const clampedV = Math.max(0, Math.min(gridRes - 1, gv));

        const density = grid[clampedU][clampedV];

        if (density >= 0) {
          // Positive Nuclear Density (Emerald / Cyan)
          const norm = Math.min(1.0, density / 12);
          data[idx] = Math.floor(16 * norm);
          data[idx + 1] = Math.floor(185 * norm + 20);
          data[idx + 2] = Math.floor(129 * norm + 30);
          data[idx + 3] = Math.floor(220 * Math.sqrt(norm));
        } else {
          // Negative Nuclear Density (Rose / Magenta - Phase Inversion)
          const norm = Math.min(1.0, Math.abs(density) / 10);
          data[idx] = Math.floor(244 * norm);
          data[idx + 1] = Math.floor(63 * norm);
          data[idx + 2] = Math.floor(94 * norm);
          data[idx + 3] = Math.floor(220 * Math.sqrt(norm));
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [atoms, projectionPlane, viewMode]);

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      {/* Header & Sub-Bar */}
      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Unit Cell Real-Space Fourier & Nuclear SLD Projector
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Looking Down {planeInfo.normal}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-space nuclear scattering length density ρ_N(r) with positive (emerald) and negative (rose) phase potentials.
          </p>
        </div>

        {/* Plane buttons & View mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#070D18] p-1 rounded-xl border border-white/10">
            {(['ab', 'bc', 'ca'] as const).map(p => (
              <button
                key={p}
                onClick={() => setProjectionPlane(p)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  projectionPlane === p
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#070D18] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'overlay' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Overlay
            </button>
            <button
              onClick={() => setViewMode('sld_density')}
              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'sld_density' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              SLD Map
            </button>
            <button
              onClick={() => setViewMode('spheres')}
              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'spheres' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Atoms
            </button>
          </div>
        </div>
      </div>

      {/* Main Projector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Projector Canvas / SVG Container */}
        <div className="lg:col-span-6 bg-[#070D19] p-4 rounded-3xl border border-white/10 relative flex items-center justify-center min-h-[360px] shadow-2xl overflow-hidden">
          {/* Background SLD Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-80"
          />

          {/* SVG Overlay for Unit Cell Edges and Discrete Nuclear Scatterer Spheres */}
          <svg
            viewBox="0 0 300 300"
            className="w-full h-full relative z-10 select-none"
          >
            <defs>
              <radialGradient id="posAtomGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </radialGradient>
              <radialGradient id="negAtomGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="50%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#881337" />
              </radialGradient>
            </defs>

            {/* Unit Cell Box (30, 30 to 270, 270) */}
            <rect
              x="30"
              y="30"
              width="240"
              height="240"
              fill="none"
              stroke="#334155"
              strokeWidth="2"
            />
            <rect
              x="30"
              y="30"
              width="240"
              height="240"
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.4"
            />

            {/* Sub-grid lines (0.25, 0.5, 0.75) */}
            {[0.25, 0.5, 0.75].map(g => (
              <React.Fragment key={g}>
                <line x1={30 + g * 240} y1="30" x2={30 + g * 240} y2="270" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="30" y1={30 + g * 240} x2="270" y2={30 + g * 240} stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
              </React.Fragment>
            ))}

            {/* Axes Labels */}
            <text x="24" y="285" fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="monospace">
              {planeInfo.axis1.split(' ')[0]}
            </text>
            <text x="14" y="40" fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="monospace">
              {planeInfo.axis2.split(' ')[0]}
            </text>

            {/* Discrete Nuclear Scatterers (if viewMode !== 'sld_density') */}
            {viewMode !== 'sld_density' && atoms.map((atom, idx) => {
              let u = 0; let v = 0;
              if (projectionPlane === 'ab') { u = atom.x; v = atom.y; }
              else if (projectionPlane === 'bc') { u = atom.y; v = atom.z; }
              else { u = atom.z; v = atom.x; }

              const wU = ((u % 1) + 1) % 1;
              const wV = ((v % 1) + 1) % 1;

              const cx = 30 + wU * 240;
              const cy = 270 - wV * 240;

              const isNegative = atom.b < 0;
              const radius = Math.max(9, Math.min(22, 10 + Math.abs(atom.b) * 1.3));

              return (
                <g
                  key={`${atom.id}-${idx}`}
                  className="cursor-pointer transition-transform group/atom"
                  onMouseEnter={() => setHoveredAtom(atom)}
                  onMouseLeave={() => setHoveredAtom(null)}
                >
                  {isNegative ? (
                    <>
                      {/* Negative b: Pulsing dashed indicator */}
                      <circle cx={cx} cy={cy} r={radius + 5} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" />
                      <circle cx={cx} cy={cy} r={radius} fill="url(#negAtomGrad)" stroke="#f43f5e" strokeWidth="2" />
                    </>
                  ) : (
                    <>
                      {/* Positive b: Solid emerald glow */}
                      <circle cx={cx} cy={cy} r={radius + 4} fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
                      <circle cx={cx} cy={cy} r={radius} fill="url(#posAtomGrad)" stroke="#10b981" strokeWidth="2" />
                    </>
                  )}

                  {/* Element label */}
                  <text
                    x={cx}
                    y={cy + 3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="900"
                    fontFamily="monospace"
                    className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  >
                    {atom.element}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Info & Physics Legend */}
        <div className="lg:col-span-6 space-y-4 text-left">
          <div className="bg-[#0B1528] p-5 rounded-3xl border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">
              Nuclear Scattering Phase Interpretation
            </h4>

            <div className="space-y-2.5 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-bold text-emerald-400">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  Positive (b_c &gt; 0) (Emerald)
                </span>
                <span className="text-slate-400 font-mono text-[10px]">Normal repulsive phase shift</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                Most atomic nuclei (e.g. C, N, O, Fe, Ni) have positive scattering lengths, producing standard in-phase diffraction peaks.
              </p>

              <div className="w-full h-px bg-white/10 my-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-bold text-rose-400">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                  Negative (b_c &lt; 0) (Rose / Pink)
                </span>
                <span className="text-rose-400 font-mono text-[10px] font-bold">180° Phase Flip</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pl-5">
                Nuclei with low-lying compound nuclear resonances (such as <strong className="text-white font-mono">¹H (-3.74 fm)</strong>, <strong className="text-white font-mono">⁴⁸Ti (-5.84 fm)</strong>, <strong className="text-white font-mono">⁵⁵Mn (-3.73 fm)</strong>, and <strong className="text-white font-mono">⁶²Ni (-8.7 fm)</strong>) scatter neutrons out-of-phase, creating destructive cancellation dips in Fourier maps!
              </p>
            </div>

            {/* Hovered Atom Card */}
            {hoveredAtom && (
              <div className="bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-black text-white">{hoveredAtom.label} ({hoveredAtom.element})</span>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Coordinates: ({hoveredAtom.x.toFixed(3)}, {hoveredAtom.y.toFixed(3)}, {hoveredAtom.z.toFixed(3)})
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono font-black ${hoveredAtom.b < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    b = {hoveredAtom.b.toFixed(2)} fm
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">B_iso: {hoveredAtom.B_iso.toFixed(2)} Å²</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
