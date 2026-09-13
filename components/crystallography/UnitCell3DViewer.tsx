import React, { useState } from 'react';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff, Layers, Box } from 'lucide-react';
import { LatticeParameters } from '../../src/utils/crystallographyMath';

interface Props {
  lattice: LatticeParameters;
  h: number;
  k: number;
  l: number;
  crystalSystem: string;
  centeringCode: string;
  className?: string;
}

export const UnitCell3DViewer: React.FC<Props> = ({
  lattice,
  h,
  k,
  l,
  crystalSystem,
  centeringCode,
  className = '',
}) => {
  const [yawDeg, setYawDeg] = useState(35);   // Rotation around vertical axis (-180 to 180)
  const [pitchDeg, setPitchDeg] = useState(25); // Tilt angle (-85 to 85)
  const [zoom, setZoom] = useState(115);       // Scale factor (60 to 180)
  const [showAtoms, setShowAtoms] = useState(true);
  const [showPlane, setShowPlane] = useState(true);
  const [showReciprocal, setShowReciprocal] = useState(false);

  // 3D rotation projection matrix
  const yawRad = (yawDeg * Math.PI) / 180;
  const pitchRad = (pitchDeg * Math.PI) / 180;

  const cosYaw = Math.cos(yawRad);
  const sinYaw = Math.sin(yawRad);
  const cosPitch = Math.cos(pitchRad);
  const sinPitch = Math.sin(pitchRad);

  // Normalize crystal axis vectors to fit nicely in 3D scene
  const maxDim = Math.max(lattice.a, lattice.b, lattice.c);
  const normA = lattice.a / maxDim;
  const normB = lattice.b / maxDim;
  const normC = lattice.c / maxDim;

  // Real-space Cartesian basis vectors based on lattice angles
  const alphaRad = (lattice.alpha * Math.PI) / 180;
  const betaRad = (lattice.beta * Math.PI) / 180;
  const gammaRad = (lattice.gamma * Math.PI) / 180;

  const cosA = Math.cos(alphaRad);
  const cosB = Math.cos(betaRad);
  const cosG = Math.cos(gammaRad);
  const sinG = Math.sin(gammaRad);

  // Cartesian components of a, b, c
  const ax = normA;
  const ay = 0;
  const az = 0;

  const bx = normB * cosG;
  const by = normB * sinG;
  const bz = 0;

  const cx = normC * cosB;
  const cy = normC * ((cosA - cosB * cosG) / (sinG || 1e-5));
  const cz = normC * Math.sqrt(Math.max(0.001, 1 - cosB * cosB - Math.pow((cosA - cosB * cosG) / (sinG || 1e-5), 2)));

  // 3D to 2D projection function centered at (175, 175)
  const project3D = (u: number, v: number, w: number) => {
    // 3D point in unit cell Cartesian space
    const px = u * ax + v * bx + w * cx - 0.5 * (ax + bx + cx);
    const py = u * ay + v * by + w * cy - 0.5 * (ay + by + cy);
    const pz = u * az + v * bz + w * cz - 0.5 * (az + bz + cz);

    // Rotate around Y axis (Yaw)
    const x1 = px * cosYaw - pz * sinYaw;
    const y1 = py;
    const z1 = px * sinYaw + pz * cosYaw;

    // Rotate around X axis (Pitch)
    const x2 = x1;
    const y2 = y1 * cosPitch - z1 * sinPitch;
    const z2 = y1 * sinPitch + z1 * cosPitch;

    // Perspective / Orthographic projection
    const screenX = 175 + x2 * zoom;
    const screenY = 175 - y2 * zoom;

    return { x: screenX, y: screenY, depth: z2 };
  };

  // 8 Corner Vertices
  const v000 = project3D(0, 0, 0);
  const v100 = project3D(1, 0, 0);
  const v010 = project3D(0, 1, 0);
  const v110 = project3D(1, 1, 0);
  const v001 = project3D(0, 0, 1);
  const v101 = project3D(1, 0, 1);
  const v011 = project3D(0, 1, 1);
  const v111 = project3D(1, 1, 1);

  // Bravais Centering additional atoms
  const atoms: Array<{ x: number; y: number; r: number; color: string; label: string; stroke: string }> = [
    // 8 Corner atoms
    { ...v000, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(0,0,0)' },
    { ...v100, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(1,0,0)' },
    { ...v010, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(0,1,0)' },
    { ...v110, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(1,1,0)' },
    { ...v001, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(0,0,1)' },
    { ...v101, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(1,0,1)' },
    { ...v011, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(0,1,1)' },
    { ...v111, r: 4.5, color: '#38bdf8', stroke: '#0284c7', label: '(1,1,1)' },
  ];

  if (centeringCode === 'I') {
    // Body-Centered atom at (0.5, 0.5, 0.5)
    atoms.push({ ...project3D(0.5, 0.5, 0.5), r: 5.5, color: '#fbbf24', stroke: '#d97706', label: 'Body (½,½,½)' });
  } else if (centeringCode === 'F') {
    // 6 Face-Centered atoms
    atoms.push({ ...project3D(0.5, 0.5, 0), r: 4, color: '#34d399', stroke: '#059669', label: 'Face XY' });
    atoms.push({ ...project3D(0.5, 0.5, 1), r: 4, color: '#34d399', stroke: '#059669', label: 'Face XY' });
    atoms.push({ ...project3D(0.5, 0, 0.5), r: 4, color: '#34d399', stroke: '#059669', label: 'Face XZ' });
    atoms.push({ ...project3D(0.5, 1, 0.5), r: 4, color: '#34d399', stroke: '#059669', label: 'Face XZ' });
    atoms.push({ ...project3D(0, 0.5, 0.5), r: 4, color: '#34d399', stroke: '#059669', label: 'Face YZ' });
    atoms.push({ ...project3D(1, 0.5, 0.5), r: 4, color: '#34d399', stroke: '#059669', label: 'Face YZ' });
  } else if (centeringCode === 'C') {
    // 2 Base-Centered atoms on (001) faces
    atoms.push({ ...project3D(0.5, 0.5, 0), r: 4.5, color: '#c084fc', stroke: '#9333ea', label: 'Base C' });
    atoms.push({ ...project3D(0.5, 0.5, 1), r: 4.5, color: '#c084fc', stroke: '#9333ea', label: 'Base C' });
  }

  // Intercept calculation for (hkl) plane
  const absH = Math.abs(h);
  const absK = Math.abs(k);
  const absL = Math.abs(l);

  const intA = absH !== 0 ? Math.min(1, 1 / absH) : 1;
  const intB = absK !== 0 ? Math.min(1, 1 / absK) : 1;
  const intC = absL !== 0 ? Math.min(1, 1 / absL) : 1;

  let planePoly = '';
  if (h !== 0 && k !== 0 && l !== 0) {
    const p1 = project3D(intA, 0, 0);
    const p2 = project3D(0, intB, 0);
    const p3 = project3D(0, 0, intC);
    planePoly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
  } else if (h === 0 && k !== 0 && l !== 0) {
    const p1 = project3D(0, intB, 0);
    const p2 = project3D(1, intB, 0);
    const p3 = project3D(1, 0, intC);
    const p4 = project3D(0, 0, intC);
    planePoly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  } else if (k === 0 && h !== 0 && l !== 0) {
    const p1 = project3D(intA, 0, 0);
    const p2 = project3D(intA, 1, 0);
    const p3 = project3D(0, 1, intC);
    const p4 = project3D(0, 0, intC);
    planePoly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  } else if (l === 0 && h !== 0 && k !== 0) {
    const p1 = project3D(intA, 0, 0);
    const p2 = project3D(0, intB, 0);
    const p3 = project3D(0, intB, 1);
    const p4 = project3D(intA, 0, 1);
    planePoly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  } else if (h !== 0 && k === 0 && l === 0) {
    const p1 = project3D(intA, 0, 0);
    const p2 = project3D(intA, 1, 0);
    const p3 = project3D(intA, 1, 1);
    const p4 = project3D(intA, 0, 1);
    planePoly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  } else if (k !== 0 && h === 0 && l === 0) {
    const p1 = project3D(0, intB, 0);
    const p2 = project3D(1, intB, 0);
    const p3 = project3D(1, intB, 1);
    const p4 = project3D(0, intB, 1);
    planePoly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  } else if (l !== 0 && h === 0 && k === 0) {
    const p1 = project3D(0, 0, intC);
    const p2 = project3D(1, 0, intC);
    const p3 = project3D(1, 1, intC);
    const p4 = project3D(0, 1, intC);
    planePoly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
  }

  // Axis vector end points
  const origin = project3D(0, 0, 0);
  const axisA = project3D(1.25, 0, 0);
  const axisB = project3D(0, 1.25, 0);
  const axisC = project3D(0, 0, 1.25);

  return (
    <div className={`p-5 bg-gradient-to-br from-[#09101F] to-[#040810] rounded-2xl border border-slate-800 flex flex-col gap-4 shadow-xl ${className}`}>
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-black text-indigo-300 uppercase tracking-wider">
            3D Unit Cell & ({h} {k} {l}) Plane Projection
          </span>
        </div>

        {/* Orientation Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => { setYawDeg(35); setPitchDeg(25); }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700"
          >
            Isometric
          </button>
          <button
            onClick={() => { setYawDeg(0); setPitchDeg(0); }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700"
          >
            [010] Face
          </button>
          <button
            onClick={() => { setYawDeg(90); setPitchDeg(0); }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700"
          >
            [100] Face
          </button>
          <button
            onClick={() => { setYawDeg(0); setPitchDeg(90); }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700"
          >
            [001] Top
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div className="relative bg-[#02050D] rounded-xl border border-slate-800/90 overflow-hidden flex items-center justify-center min-h-[320px]">
        <svg viewBox="0 0 350 350" className="w-full max-w-[350px] h-[320px] select-none">
          <defs>
            <linearGradient id="planeFacetGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#e11d48" stopOpacity={0.25} />
            </linearGradient>
            <marker id="arrowA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
            </marker>
            <marker id="arrowB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
            </marker>
            <marker id="arrowC" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
            </marker>
          </defs>

          {/* Shaded Plane Polygon */}
          {showPlane && planePoly && (
            <polygon
              points={planePoly}
              fill="url(#planeFacetGrad)"
              stroke="#fb7185"
              strokeWidth="1.75"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
          )}

          {/* 12 Wireframe Unit Cell Edges */}
          <line x1={v000.x} y1={v000.y} x2={v100.x} y2={v100.y} stroke="#475569" strokeWidth="1.5" />
          <line x1={v000.x} y1={v000.y} x2={v010.x} y2={v010.y} stroke="#475569" strokeWidth="1.5" />
          <line x1={v000.x} y1={v000.y} x2={v001.x} y2={v001.y} stroke="#475569" strokeWidth="1.5" />

          <line x1={v100.x} y1={v100.y} x2={v110.x} y2={v110.y} stroke="#64748b" strokeWidth="1.5" />
          <line x1={v010.x} y1={v010.y} x2={v110.x} y2={v110.y} stroke="#64748b" strokeWidth="1.5" />

          <line x1={v001.x} y1={v001.y} x2={v101.x} y2={v101.y} stroke="#64748b" strokeWidth="1.5" />
          <line x1={v001.x} y1={v001.y} x2={v011.x} y2={v011.y} stroke="#64748b" strokeWidth="1.5" />

          <line x1={v101.x} y1={v101.y} x2={v111.x} y2={v111.y} stroke="#94a3b8" strokeWidth="1.5" />
          <line x1={v011.x} y1={v011.y} x2={v111.x} y2={v111.y} stroke="#94a3b8" strokeWidth="1.5" />

          <line x1={v100.x} y1={v100.y} x2={v101.x} y2={v101.y} stroke="#64748b" strokeWidth="1.5" />
          <line x1={v010.x} y1={v010.y} x2={v011.x} y2={v011.y} stroke="#64748b" strokeWidth="1.5" />
          <line x1={v110.x} y1={v110.y} x2={v111.x} y2={v111.y} stroke="#94a3b8" strokeWidth="1.5" />

          {/* Real-Space Basis Axis Vectors */}
          <line x1={origin.x} y1={origin.y} x2={axisA.x} y2={axisA.y} stroke="#f43f5e" strokeWidth="2.5" markerEnd="url(#arrowA)" />
          <line x1={origin.x} y1={origin.y} x2={axisB.x} y2={axisB.y} stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrowB)" />
          <line x1={origin.x} y1={origin.y} x2={axisC.x} y2={axisC.y} stroke="#34d399" strokeWidth="2.5" markerEnd="url(#arrowC)" />

          <text x={axisA.x + 8} y={axisA.y + 4} fill="#f43f5e" fontSize="11" fontFamily="monospace" fontWeight="bold">a ({lattice.a.toFixed(2)}Å)</text>
          <text x={axisB.x + 8} y={axisB.y + 4} fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">b ({lattice.b.toFixed(2)}Å)</text>
          <text x={axisC.x} y={axisC.y - 8} fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">c ({lattice.c.toFixed(2)}Å)</text>

          {/* Bravais Lattice Site Atoms */}
          {showAtoms &&
            atoms.map((atm, i) => (
              <g key={`atm-${i}`}>
                <circle cx={atm.x} cy={atm.y} r={atm.r} fill={atm.color} stroke={atm.stroke} strokeWidth={1.5} />
              </g>
            ))}
        </svg>

        {/* Floating Quick Badges */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[10px] font-mono space-y-0.5">
          <div className="text-slate-400 font-bold">System: <span className="text-white">{crystalSystem}</span></div>
          <div className="text-slate-400">Centering: <span className="text-cyan-300 font-bold">{centeringCode}</span></div>
          <div className="text-slate-400">Volume: <span className="text-indigo-300 font-bold">{lattice.vol.toFixed(2)} Å³</span></div>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
          <span>Yaw: {yawDeg}°</span> | <span>Pitch: {pitchDeg}°</span>
        </div>
      </div>

      {/* Rotation & Zoom Slider Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-3 rounded-xl border border-slate-800 text-xs font-mono">
        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Yaw (Azimuth):</span>
            <span className="text-indigo-300 font-bold">{yawDeg}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            value={yawDeg}
            onChange={(e) => setYawDeg(parseInt(e.target.value))}
            className="w-full accent-indigo-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Pitch (Elevation):</span>
            <span className="text-cyan-300 font-bold">{pitchDeg}°</span>
          </div>
          <input
            type="range"
            min="-85"
            max="85"
            value={pitchDeg}
            onChange={(e) => setPitchDeg(parseInt(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Perspective Zoom:</span>
            <span className="text-emerald-300 font-bold">{zoom}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="180"
            value={zoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>
      </div>

      {/* View Layer Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPlane(!showPlane)}
            className={`px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
              showPlane ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showPlane ? `Plane (${h}${k}${l}) Visible` : `Plane Hidden`}
          </button>
          <button
            onClick={() => setShowAtoms(!showAtoms)}
            className={`px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
              showAtoms ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            {showAtoms ? `Bravais Sites (${centeringCode})` : `Sites Hidden`}
          </button>
        </div>

        <button
          onClick={() => { setYawDeg(35); setPitchDeg(25); setZoom(115); }}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset Angles
        </button>
      </div>
    </div>
  );
};
