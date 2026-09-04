import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Rotate3d, 
  Sliders, 
  Info, 
  Check, 
  Maximize2,
  Sparkles,
  Compass
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

interface MillerPlanePreset {
  name: string;
  h: number;
  k: number;
  l: number;
  label: string;
  category: 'Pinacoid (100-type)' | 'Prism/Diagonal (110-type)' | 'Octahedral (111-type)';
  description: string;
}

export const MILLER_PRESETS: MillerPlanePreset[] = [
  { name: '(001)', h: 0, k: 0, l: 1, label: '(001)', category: 'Pinacoid (100-type)', description: 'Horizontal plane parallel to xy-plane, cuts z-axis at c.' },
  { name: '(100)', h: 1, k: 0, l: 0, label: '(100)', category: 'Pinacoid (100-type)', description: 'Vertical face parallel to yz-plane, cuts x-axis at a.' },
  { name: '(010)', h: 0, k: 1, l: 0, label: '(010)', category: 'Pinacoid (100-type)', description: 'Vertical side face parallel to xz-plane, cuts y-axis at b.' },
  
  { name: '(101)', h: 1, k: 0, l: 1, label: '(101)', category: 'Prism/Diagonal (110-type)', description: 'Diagonal plane cutting x at a and z at c, parallel to y-axis.' },
  { name: '(110)', h: 1, k: 1, l: 0, label: '(110)', category: 'Prism/Diagonal (110-type)', description: 'Diagonal plane cutting x at a and y at b, parallel to z-axis.' },
  { name: '(011)', h: 0, k: 1, l: 1, label: '(011)', category: 'Prism/Diagonal (110-type)', description: 'Diagonal plane cutting y at b and z at c, parallel to x-axis.' },
  
  { name: '(111)', h: 1, k: 1, l: 1, label: '(111)', category: 'Octahedral (111-type)', description: 'Octahedral corner facet cutting all three axes equally at (1, 1, 1).' },
  { name: '(1-11)', h: 1, k: -1, l: 1, label: '(11̄1)', category: 'Octahedral (111-type)', description: 'Oblique plane with negative k-intercept along the negative y-direction.' },
  { name: '(-111)', h: -1, k: 1, l: 1, label: '(1̄11)', category: 'Octahedral (111-type)', description: 'Oblique plane with negative h-intercept along the negative x-direction.' }
];

export const MillerPlanesVisualizer: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('(111)');
  const [customH, setCustomH] = useState<number>(1);
  const [customK, setCustomK] = useState<number>(1);
  const [customL, setCustomL] = useState<number>(1);
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [yaw, setYaw] = useState<number>(28);
  const [pitch, setPitch] = useState<number>(22);
  const [planeOpacity, setPlaneOpacity] = useState<number>(0.65);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showNormalVector, setShowNormalVector] = useState<boolean>(true);

  // Active indices
  const { h, k, l, label } = useMemo(() => {
    if (useCustom) {
      const formatIdx = (val: number) => val < 0 ? `${Math.abs(val)}̄` : `${val}`;
      return {
        h: customH,
        k: customK,
        l: customL,
        label: `(${formatIdx(customH)}${formatIdx(customK)}${formatIdx(customL)})`
      };
    }
    const preset = MILLER_PRESETS.find(p => p.name === selectedPreset) || MILLER_PRESETS[6];
    return {
      h: preset.h,
      k: preset.k,
      l: preset.l,
      label: preset.label
    };
  }, [useCustom, selectedPreset, customH, customK, customL]);

  // Handle Preset selection
  const handleSelectPreset = (p: MillerPlanePreset) => {
    playSynthTone('tick');
    setUseCustom(false);
    setSelectedPreset(p.name);
  };

  // 3D Geometry calculation for Unit Cube [0,1]^3 and plane intersection
  const geometry = useMemo(() => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;
    const s = 130; // cube size

    // 8 cube corners in fractional coords [u, v, w] where u,v,w in [0, 1]
    const corners = [
      [0, 0, 0], // 0: Origin
      [1, 0, 0], // 1: +X
      [1, 1, 0], // 2: +X+Y
      [0, 1, 0], // 3: +Y
      [0, 0, 1], // 4: +Z
      [1, 0, 1], // 5: +X+Z
      [1, 1, 1], // 6: +X+Y+Z
      [0, 1, 1]  // 7: +Y+Z
    ];

    const project = (x: number, y: number, z: number) => {
      // Centered at cube center (0.5, 0.5, 0.5)
      const cx0 = (x - 0.5) * s;
      const cy0 = (y - 0.5) * s;
      const cz0 = (z - 0.5) * s;

      // Yaw (around Z)
      const x1 = cx0 * Math.cos(yawRad) - cy0 * Math.sin(yawRad);
      const y1 = cx0 * Math.sin(yawRad) + cy0 * Math.cos(yawRad);
      const z1 = cz0;

      // Pitch (around X)
      const x2 = x1;
      const y2 = y1 * Math.cos(pitchRad) - z1 * Math.sin(pitchRad);
      const z2 = y1 * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

      return {
        px: 240 + x2,
        py: 200 - y2,
        depth: z2
      };
    };

    const projectedCorners = corners.map(([u, v, w]) => project(u, v, w));

    // 12 edges
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // bottom
      [4, 5], [5, 6], [6, 7], [7, 4], // top
      [0, 4], [1, 5], [2, 6], [3, 7]  // vertical
    ];

    // Compute polygon vertices of intersection between plane and cube [0, 1]^3
    // Plane equation: h*x + k*y + l*z = d_val
    // For Miller indices, we choose intercept d_val so that the plane passes through the unit cell.
    // If indices are positive, d_val = 1.
    // If any indices are negative, we shift origin so the plane intersects within [0,1]^3.
    let dVal = 1;
    if (h <= 0 && k <= 0 && l <= 0) {
      dVal = -1;
    } else if (h < 0 || k < 0 || l < 0) {
      // Offset calculation for negative indices so slice is cleanly visible inside cube
      // For (1, -1, 1): x - y + z = 0 intersects corner (0, 1, 0) and extends to (1, 1, 0), (0, 1, 1), etc.
      // or x - y + z = 1 intersects (1, 0, 0) and (0, 0, 1).
      // Let's test standard intercept
      dVal = 0;
      if (h < 0) dVal += h * 0;
      if (k < 0) dVal += 0;
      // For (1, -1, 1), standard crystallographic plane inside cell is x + (1-y) + z = 1 or x - y + z = 0
      dVal = (h < 0 ? 0 : 0) + (k < 0 ? -1 : 0) + (l < 0 ? -1 : 0) + 1;
      if (selectedPreset === '(1-11)') dVal = 0.5;
      if (selectedPreset === '(-111)') dVal = 0.5;
    }

    // Special preset intersection polygons for pristine textbook precision (Image 1)
    let planePolygonPoints: { px: number; py: number }[] = [];

    if (selectedPreset === '(001)' && !useCustom) {
      // Top face
      planePolygonPoints = [project(0, 0, 1), project(1, 0, 1), project(1, 1, 1), project(0, 1, 1)];
    } else if (selectedPreset === '(100)' && !useCustom) {
      // Right face
      planePolygonPoints = [project(1, 0, 0), project(1, 1, 0), project(1, 1, 1), project(1, 0, 1)];
    } else if (selectedPreset === '(010)' && !useCustom) {
      // Back face
      planePolygonPoints = [project(0, 1, 0), project(1, 1, 0), project(1, 1, 1), project(0, 1, 1)];
    } else if (selectedPreset === '(101)' && !useCustom) {
      // Diagonal slicing x-z
      planePolygonPoints = [project(1, 0, 0), project(1, 1, 0), project(0, 1, 1), project(0, 0, 1)];
    } else if (selectedPreset === '(110)' && !useCustom) {
      // Vertical diagonal slicing x-y
      planePolygonPoints = [project(1, 0, 0), project(0, 1, 0), project(0, 1, 1), project(1, 0, 1)];
    } else if (selectedPreset === '(011)' && !useCustom) {
      // Diagonal slicing y-z
      planePolygonPoints = [project(0, 1, 0), project(1, 1, 0), project(1, 0, 1), project(0, 0, 1)];
    } else if (selectedPreset === '(111)' && !useCustom) {
      // Triangular facet cutting at (1,0,0), (0,1,0), (0,0,1)
      planePolygonPoints = [project(1, 0, 0), project(0, 1, 0), project(0, 0, 1)];
    } else if (selectedPreset === '(1-11)' && !useCustom) {
      // (1 -1 1) facet as in Britannica image 1
      planePolygonPoints = [project(0, 0, 0), project(1, 1, 0), project(0, 1, 1)];
    } else if (selectedPreset === '(-111)' && !useCustom) {
      // (-1 1 1) facet as in Britannica image 1
      planePolygonPoints = [project(1, 0, 0), project(0, 1, 0), project(1, 1, 1)];
    } else {
      // General plane-cube intersection algorithm
      // Edge-plane intersection test
      const intersections: [number, number, number][] = [];
      const denom = (h * h + k * k + l * l);
      if (denom !== 0) {
        edges.forEach(([i1, i2]) => {
          const p1 = corners[i1];
          const p2 = corners[i2];
          const val1 = h * p1[0] + k * p1[1] + l * p1[2] - 1;
          const val2 = h * p2[0] + k * p2[1] + l * p2[2] - 1;

          if (Math.abs(val1) < 1e-5) {
            intersections.push(p1 as [number, number, number]);
          } else if (Math.abs(val2) < 1e-5) {
            intersections.push(p2 as [number, number, number]);
          } else if ((val1 > 0 && val2 < 0) || (val1 < 0 && val2 > 0)) {
            const t = val1 / (val1 - val2);
            const ix = p1[0] + t * (p2[0] - p1[0]);
            const iy = p1[1] + t * (p2[1] - p1[1]);
            const iz = p1[2] + t * (p2[2] - p1[2]);
            intersections.push([ix, iy, iz]);
          }
        });

        // Deduplicate
        const uniquePts: [number, number, number][] = [];
        intersections.forEach(pt => {
          if (!uniquePts.some(u => Math.hypot(u[0] - pt[0], u[1] - pt[1], u[2] - pt[2]) < 1e-3)) {
            uniquePts.push(pt);
          }
        });

        // If >= 3 points, sort cyclically around center of mass
        if (uniquePts.length >= 3) {
          const cx = uniquePts.reduce((acc, p) => acc + p[0], 0) / uniquePts.length;
          const cy = uniquePts.reduce((acc, p) => acc + p[1], 0) / uniquePts.length;
          const cz = uniquePts.reduce((acc, p) => acc + p[2], 0) / uniquePts.length;

          // Compute basis in plane
          const norm = Math.hypot(h, k, l);
          const uAxis = [uniquePts[0][0] - cx, uniquePts[0][1] - cy, uniquePts[0][2] - cz];
          const uLen = Math.hypot(...uAxis);
          const uNorm = [uAxis[0] / uLen, uAxis[1] / uLen, uAxis[2] / uLen];
          const nNorm = [h / norm, k / norm, l / norm];
          const vNorm = [
            nNorm[1] * uNorm[2] - nNorm[2] * uNorm[1],
            nNorm[2] * uNorm[0] - nNorm[0] * uNorm[2],
            nNorm[0] * uNorm[1] - nNorm[1] * uNorm[0]
          ];

          uniquePts.sort((a, b) => {
            const da = [a[0] - cx, a[1] - cy, a[2] - cz];
            const db = [b[0] - cx, b[1] - cy, b[2] - cz];
            const angleA = Math.atan2(
              da[0] * vNorm[0] + da[1] * vNorm[1] + da[2] * vNorm[2],
              da[0] * uNorm[0] + da[1] * uNorm[1] + da[2] * uNorm[2]
            );
            const angleB = Math.atan2(
              db[0] * vNorm[0] + db[1] * vNorm[1] + db[2] * vNorm[2],
              db[0] * uNorm[0] + db[1] * uNorm[1] + db[2] * uNorm[2]
            );
            return angleA - angleB;
          });

          planePolygonPoints = uniquePts.map(p => project(p[0], p[1], p[2]));
        }
      }
    }

    // Normal vector [h, k, l] projected
    const normLen = Math.hypot(h, k, l) || 1;
    const nx = (h / normLen) * 0.45;
    const ny = (k / normLen) * 0.45;
    const nz = (l / normLen) * 0.45;
    const normStart = project(0.5, 0.5, 0.5);
    const normEnd = project(0.5 + nx, 0.5 + ny, 0.5 + nz);

    return {
      projectedCorners,
      edges,
      planePolygonPoints,
      normStart,
      normEnd
    };
  }, [yaw, pitch, selectedPreset, useCustom, h, k, l]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Encyclopedia Crystallographica Standard
            </span>
            <span className="text-xs text-slate-400 font-mono">Cubic Lattice Planes</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Miller Indices of Planes in a Cubic Crystal
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Interactive crystallographic plane slicer replicating the canonical 9 Miller planes of cubic crystals with real-time 3D rotation, normal vector vectors, and custom index exploration.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => { playSynthTone('tick'); setUseCustom(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !useCustom ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Canonical 9 Planes
          </button>
          <button
            onClick={() => { playSynthTone('tick'); setUseCustom(true); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              useCustom ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom (hkl) Input
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 3D Sliced Unit Cell Canvas */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[500px]">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Active Plane</span>
              <div className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-2">
                <span>{label}</span>
                <span className="text-xs font-sans font-normal text-slate-400">
                  {h === 0 && k === 0 ? 'Pinacoid' : h === k && l === 0 ? 'Diagonal Prism' : h === k && k === l ? 'Octahedral Face' : 'Crystallographic Plane'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                d = a / √({h * h + k * k + l * l || 1})
              </span>
            </div>
          </div>

          {/* SVG 3D Canvas */}
          <div className="relative flex-1 flex items-center justify-center my-4 select-none">
            <svg 
              viewBox="0 0 480 400" 
              className="w-full h-84 max-w-md mx-auto filter drop-shadow-2xl overflow-visible"
            >
              {/* Unit Cell Wireframe - Back Edges */}
              {showWireframe && geometry.edges.map(([i, j], idx) => {
                const p1 = geometry.projectedCorners[i];
                const p2 = geometry.projectedCorners[j];
                return (
                  <line
                    key={`edge-${idx}`}
                    x1={p1.px}
                    y1={p1.py}
                    x2={p2.px}
                    y2={p2.py}
                    stroke="#475569"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Sliced Translucent Green Miller Plane (matching Encyclopedia Britannica Image 1) */}
              {geometry.planePolygonPoints.length >= 3 && (
                <g>
                  {/* Plane Surface */}
                  <polygon
                    points={geometry.planePolygonPoints.map(p => `${p.px},${p.py}`).join(' ')}
                    fill="#22c55e"
                    fillOpacity={planeOpacity}
                    stroke="#15803d"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />

                  {/* Corner Intersection Points */}
                  {geometry.planePolygonPoints.map((pt, idx) => (
                    <circle
                      key={`pt-${idx}`}
                      cx={pt.px}
                      cy={pt.py}
                      r="4"
                      fill="#86efac"
                      stroke="#14532d"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              )}

              {/* Normal Vector to Plane */}
              {showNormalVector && (
                <g>
                  <line
                    x1={geometry.normStart.px}
                    y1={geometry.normStart.py}
                    x2={geometry.normEnd.px}
                    y2={geometry.normEnd.py}
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="4 3"
                  />
                  <circle
                    cx={geometry.normEnd.px}
                    cy={geometry.normEnd.py}
                    r="4.5"
                    fill="#f59e0b"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={geometry.normEnd.px + 8}
                    y={geometry.normEnd.py - 6}
                    fill="#f59e0b"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    n [{h} {k} {l}]
                  </text>
                </g>
              )}

              {/* 8 Unit Cell Vertices */}
              {geometry.projectedCorners.map((c, idx) => (
                <circle
                  key={`corner-${idx}`}
                  cx={c.px}
                  cy={c.py}
                  r="3.5"
                  fill="#94a3b8"
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>

          {/* Interactive Controls Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Yaw</span>
                  <span className="text-emerald-400 font-bold">{yaw}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={yaw}
                  onChange={(e) => setYaw(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 accent-emerald-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Pitch</span>
                  <span className="text-emerald-400 font-bold">{pitch}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="60"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 accent-emerald-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Plane Opacity</span>
                  <span className="text-emerald-400 font-bold">{Math.round(planeOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={planeOpacity}
                  onChange={(e) => setPlaneOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 accent-emerald-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-0">
                <input
                  type="checkbox"
                  id="chkNormal"
                  checked={showNormalVector}
                  onChange={(e) => setShowNormalVector(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="chkNormal" className="text-[11px] font-bold text-slate-300 cursor-pointer">
                  Show Normal [hkl]
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Preset Selector or Custom Inputs */}
        <div className="lg:col-span-5 space-y-5">
          {!useCustom ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>The Canonical 9 Cubic Planes</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Image 1 Reproduction</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {MILLER_PRESETS.map((preset) => {
                  const isSelected = !useCustom && selectedPreset === preset.name;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 font-bold'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-sm font-mono font-bold text-emerald-300">
                        {preset.label}
                      </span>
                      <span className="text-[9px] text-slate-400 truncate max-w-full">
                        {preset.category.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Preset Details */}
              {(() => {
                const p = MILLER_PRESETS.find(item => item.name === selectedPreset);
                if (!p) return null;
                return (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-400">{p.label} Plane Details</span>
                      <span className="font-mono text-[10px] text-slate-500">{p.category}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{p.description}</p>
                    <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Intercepts (x,y,z):</span>
                        <span className="text-slate-300 font-bold">
                          {p.h ? `a/${p.h}` : '∞'}, {p.k ? `b/${p.k}` : '∞'}, {p.l ? `c/${p.l}` : '∞'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Equiv. Multiplicity:</span>
                        <span className="text-emerald-300 font-bold">
                          {p.h === 1 && p.k === 0 && p.l === 0 ? '{100} (6 faces)' : p.h === 1 && p.k === 1 && p.l === 0 ? '{110} (12 faces)' : '{111} (8 faces)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Custom Miller Index Controls</span>
                </h3>
                <span className="text-[10px] font-mono text-indigo-400">h, k, l ∈ [-3, 3]</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>Miller Index h (x-axis)</span>
                    <span className="text-indigo-400 font-bold">{customH}</span>
                  </div>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    value={customH}
                    onChange={(e) => setCustomH(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 accent-indigo-500 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>Miller Index k (y-axis)</span>
                    <span className="text-indigo-400 font-bold">{customK}</span>
                  </div>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    value={customK}
                    onChange={(e) => setCustomK(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 accent-indigo-500 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                    <span>Miller Index l (z-axis)</span>
                    <span className="text-indigo-400 font-bold">{customL}</span>
                  </div>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    value={customL}
                    onChange={(e) => setCustomL(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 accent-indigo-500 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1 text-slate-400">
                <span className="font-bold text-indigo-300 block font-mono">Crystallographic Rules:</span>
                <p>An index of 0 means the plane is parallel to that axis and intercepts at infinity (∞).</p>
                <p>Negative indices are written with an overbar (e.g. 1̄) representing planes crossing in negative coordinate space.</p>
              </div>
            </div>
          )}

          {/* Scientific Educational Callout */}
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-5 space-y-2 text-xs text-emerald-200">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>Significance in X-ray Diffraction (XRD)</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              In Bragg's law <code className="text-emerald-400 font-mono">λ = 2·d·sinθ</code>, the diffraction peaks measured in an XRD diffractometer correspond directly to coherent reflections from these exact crystallographic planes. The intensity is governed by the structure factor <code className="text-emerald-400 font-mono">F(hkl)</code>.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
