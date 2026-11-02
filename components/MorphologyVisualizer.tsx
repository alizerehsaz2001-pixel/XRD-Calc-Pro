import React, { useState, useEffect, useRef } from 'react';
import { Atom, Rotate3d, Layers, Compass, RotateCcw, Play, Pause } from 'lucide-react';

export const MorphologyVisualizer = ({
  kType,
  sizeNm,
  constantK,
  dSpacing = 3.135
}: {
  kType: string;
  sizeNm: number;
  constantK?: number;
  dSpacing?: number;
}) => {
  // Keep track of 3D rotation angles
  const [angleX, setAngleX] = useState(-24);
  const [angleY, setAngleY] = useState(38);
  const [isDragging, setIsDragging] = useState(false);

  // Interactive visual overlays
  const [autoRotate, setAutoRotate] = useState(true);
  const [showLatticePlanes, setShowLatticePlanes] = useState(true);
  const [showNormals, setShowNormals] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0, ax: 0, ay: 0 });

  // Physics-based size growth: compute a clean visual scale bound to average size
  const safeSize = sizeNm && sizeNm > 0 ? sizeNm : 18.0;
  const visualScale = 0.48 + Math.min(0.52, safeSize / 95);
  const estimatedPlanesN = Math.max(4, Math.round((safeSize * 10) / Math.max(1.2, dSpacing)));

  useEffect(() => {
    let lastTime = performance.now();

    const tick = (time: number) => {
      if (autoRotate && !isDragging) {
        const delta = (time - lastTime) / 1000;
        setAngleY(prev => (prev + delta * 14) % 360);
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [autoRotate, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setAutoRotate(false);
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ax: angleX,
      ay: angleY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const nextAngleX = Math.max(-85, Math.min(85, dragStart.current.ax + dy * 0.5));
    const nextAngleY = (dragStart.current.ay - dx * 0.5 + 360) % 360;

    setAngleX(nextAngleX);
    setAngleY(nextAngleY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setAutoRotate(false);
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ax: angleX,
        ay: angleY
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;

    const nextAngleX = Math.max(-85, Math.min(85, dragStart.current.ax + dy * 0.5));
    const nextAngleY = (dragStart.current.ay - dx * 0.5 + 360) % 360;

    setAngleX(nextAngleX);
    setAngleY(nextAngleY);
  };

  // Model construction maps for crystallography
  const getModelData = () => {
    const typeLower = (kType || '').toLowerCase();

    const isSpherical = typeLower.includes('spherical') || typeLower.includes('average') || typeLower.includes('integral');
    const isCubic100 = typeLower.includes('cubic {100}') || (typeLower.includes('cubic') && !typeLower.includes('111'));
    const isCubic111 = typeLower.includes('cubic {111}');
    const isOctahedral = typeLower.includes('octahedral') || typeLower.includes('spinel');
    const isTetrahedral = typeLower.includes('tetrahedral') || typeLower.includes('triangular');
    const isPlate = typeLower.includes('plate') || typeLower.includes('disk');
    const isRod = typeLower.includes('rod') || typeLower.includes('nanowire');

    let vertices: number[][] = [];
    let faces: number[][] = [];
    let name = 'Standard Crystallite';
    let theme = 'amber';
    let defaultK = 0.90;

    if (isSpherical) {
      name = 'Spherical Nanoparticle';
      theme = 'amber';
      defaultK = 0.94;
      const latCount = 6;
      const lonCount = 12;
      for (let lat = 0; lat <= latCount; lat++) {
        const theta = -Math.PI / 2 + (Math.PI * lat) / latCount;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon < lonCount; lon++) {
          const phi = (2 * Math.PI * lon) / lonCount;
          vertices.push([cosTheta * Math.cos(phi), sinTheta, cosTheta * Math.sin(phi)]);
        }
      }
      for (let lat = 0; lat < latCount; lat++) {
        for (let lon = 0; lon < lonCount; lon++) {
          const i0 = lat * lonCount + lon;
          const i1 = lat * lonCount + ((lon + 1) % lonCount);
          const i2 = (lat + 1) * lonCount + ((lon + 1) % lonCount);
          const i3 = (lat + 1) * lonCount + lon;
          faces.push([i0, i1, i2, i3]);
        }
      }
    } else if (isCubic100) {
      name = 'Cubic Grains {100}';
      theme = 'violet';
      defaultK = 0.943;
      vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
      ];
      faces = [
        [4, 5, 6, 7],
        [1, 0, 3, 2],
        [0, 1, 5, 4],
        [7, 6, 2, 3],
        [0, 4, 7, 3],
        [5, 1, 2, 6]
      ];
    } else if (isCubic111) {
      name = 'Planar Cube {111}';
      theme = 'cyan';
      defaultK = 0.84;
      vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
      ];
      faces = [
        [4, 5, 6, 7],
        [1, 0, 3, 2],
        [0, 1, 5, 4],
        [7, 6, 2, 3],
        [0, 4, 7, 3],
        [5, 1, 2, 6]
      ];
    } else if (isOctahedral) {
      name = 'Spinel Octahedron';
      theme = 'emerald';
      defaultK = 0.94;
      const s = 1.15;
      vertices = [
        [0, -1.35, 0],
        [0, 1.35, 0],
        [s, 0, -s], [s, 0, s], [-s, 0, s], [-s, 0, -s]
      ];
      faces = [
        [0, 3, 2], [0, 4, 3], [0, 5, 4], [0, 2, 5],
        [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2]
      ];
    } else if (isTetrahedral) {
      name = 'Tetrahedral Pyramid';
      theme = 'rose';
      defaultK = 0.73;
      vertices = [
        [0, -1.15, 0],
        [1, 0.65, -0.6],
        [-1, 0.65, -0.6],
        [0, 0.65, 1.15]
      ];
      faces = [
        [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
      ];
    } else if (isPlate) {
      name = 'Textured Platelets/Disks';
      theme = 'cyan';
      defaultK = 0.89;
      const segments = 10;
      const r = 1.3;
      const h = 0.3;
      for (let i = 0; i < segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        vertices.push([r * Math.cos(theta), -h, r * Math.sin(theta)]);
      }
      for (let i = 0; i < segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        vertices.push([r * Math.cos(theta), h, r * Math.sin(theta)]);
      }
      faces.push(Array.from({ length: segments }, (_, i) => i));
      faces.push(Array.from({ length: segments }, (_, i) => segments * 2 - 1 - i));
      for (let i = 0; i < segments; i++) {
        faces.push([i, (i + 1) % segments, ((i + 1) % segments) + segments, i + segments]);
      }
    } else if (isRod) {
      name = 'Anisotropic Nanowire';
      theme = 'violet';
      defaultK = 1.10;
      const segments = 8;
      const r = 0.42;
      const h = 1.35;
      for (let i = 0; i < segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        vertices.push([r * Math.cos(theta), -h, r * Math.sin(theta)]);
      }
      for (let i = 0; i < segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        vertices.push([r * Math.cos(theta), h, r * Math.sin(theta)]);
      }
      faces.push(Array.from({ length: segments }, (_, i) => i));
      faces.push(Array.from({ length: segments }, (_, i) => segments * 2 - 1 - i));
      for (let i = 0; i < segments; i++) {
        faces.push([i, (i + 1) % segments, ((i + 1) % segments) + segments, i + segments]);
      }
    } else {
      name = 'Polymorphic Icosahedron';
      theme = 'amber';
      defaultK = 0.90;
      const p = 1.618;
      const s = 0.62;
      vertices = [
        [0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p],
        [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0],
        [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]
      ].map(([x, y, z]) => [x * s, y * s, (z || 0) * s]);

      vertices = vertices.map(([x, y, z]) => {
        const len = Math.sqrt(x * x + y * y + z * z);
        const refR = 1.15;
        return [(x / len) * refR, (y / len) * refR, (z / len) * refR];
      });

      faces = [
        [0, 8, 4], [0, 4, 5], [0, 5, 9], [0, 9, 1], [0, 1, 8],
        [1, 6, 8], [1, 7, 6], [1, 9, 7], [8, 6, 10], [8, 10, 4],
        [4, 10, 2], [4, 2, 5], [5, 2, 11], [5, 11, 9], [9, 11, 7],
        [7, 11, 3], [7, 3, 6], [6, 3, 10], [10, 3, 2], [2, 3, 11]
      ];
    }

    return { vertices, faces, name, theme, isCubic111, defaultK };
  };

  const { vertices, faces, name: displayName, theme, isCubic111, defaultK } = getModelData();
  const activeK = constantK || defaultK;

  // Rotate a 3D coordinate around both X and Y axes
  const rotate3D = (x: number, y: number, z: number, angX: number, angY: number) => {
    const rY = (angY * Math.PI) / 180;
    const cosY = Math.cos(rY);
    const sinY = Math.sin(rY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    const rX = (angX * Math.PI) / 180;
    const cosX = Math.cos(rX);
    const sinX = Math.sin(rX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    return [x1, y2, z2];
  };

  const rotatedVerts = vertices.map(([x, y, z]) => rotate3D(x, y, z, angleX, angleY));

  const scalePixels = 52 * visualScale;
  const project2D = (x: number, y: number, z: number) => {
    const depthFactor = 130 / (130 + z * 0.4);
    return [
      125 + x * scalePixels * depthFactor,
      100 + y * scalePixels * depthFactor
    ];
  };

  const lightSource = [0.45, -0.75, -0.48];
  const lightLen = Math.sqrt(lightSource[0] ** 2 + lightSource[1] ** 2 + lightSource[2] ** 2);
  const L_norm = [lightSource[0] / lightLen, lightSource[1] / lightLen, lightSource[2] / lightLen];

  const faceProjectedData = faces.map((indices, faceIdx) => {
    const facePoints = indices.map(idx => rotatedVerts[idx]);
    const avgZ = facePoints.reduce((acc, pt) => acc + pt[2], 0) / indices.length;

    const p0 = facePoints[0];
    const p1 = facePoints[1];
    const p2 = facePoints[2];

    const ax = p1[0] - p0[0];
    const ay = p1[1] - p0[1];
    const az = p1[2] - p0[2];

    const bx = p2[0] - p0[0];
    const by = p2[1] - p0[1];
    const bz = p2[2] - p0[2];

    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;

    const normLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (normLen > 0) {
      nx /= normLen;
      ny /= normLen;
      nz /= normLen;
    }

    const dp = nx * L_norm[0] + ny * L_norm[1] + nz * L_norm[2];
    const shadeIntensity = Math.max(0.14, Math.min(1.0, (dp + 1) / 2));

    const pointsString = indices
      .map(idx => {
        const proj = project2D(rotatedVerts[idx][0], rotatedVerts[idx][1], rotatedVerts[idx][2]);
        return `${proj[0].toFixed(1)},${proj[1].toFixed(1)}`;
      })
      .join(' ');

    return {
      pointsString,
      avgZ,
      shadeIntensity,
      faceIdx,
      nz
    };
  });

  const sortedFaces = [...faceProjectedData].sort((a, b) => b.avgZ - a.avgZ);

  const themeColors: Record<string, { fill: string; stroke: string; glow: string; atom: string }> = {
    amber: { fill: '245, 158, 11', stroke: 'rgba(251, 191, 36, 0.9)', glow: 'rgba(245, 158, 11, 0.16)', atom: '#fcd34d' },
    violet: { fill: '139, 92, 246', stroke: 'rgba(167, 139, 250, 0.9)', glow: 'rgba(139, 92, 246, 0.16)', atom: '#c4b5fd' },
    cyan: { fill: '6, 182, 212', stroke: 'rgba(34, 211, 238, 0.9)', glow: 'rgba(6, 182, 212, 0.16)', atom: '#67e8f9' },
    emerald: { fill: '16, 185, 129', stroke: 'rgba(52, 211, 153, 0.9)', glow: 'rgba(16, 185, 129, 0.16)', atom: '#6ee7b7' },
    rose: { fill: '244, 63, 94', stroke: 'rgba(251, 113, 133, 0.9)', glow: 'rgba(244, 63, 94, 0.16)', atom: '#fca5a5' }
  };

  const colSet = themeColors[theme] || themeColors.amber;

  let planarProjTriangle: string | null = null;
  if (isCubic111) {
    const pt1 = project2D(rotatedVerts[1][0], rotatedVerts[1][1], rotatedVerts[1][2]);
    const pt2 = project2D(rotatedVerts[3][0], rotatedVerts[3][1], rotatedVerts[3][2]);
    const pt3 = project2D(rotatedVerts[4][0], rotatedVerts[4][1], rotatedVerts[4][2]);
    planarProjTriangle = `${pt1[0].toFixed(1)},${pt1[1].toFixed(1)} ${pt2[0].toFixed(1)},${pt2[1].toFixed(1)} ${pt3[0].toFixed(1)},${pt3[1].toFixed(1)}`;
  }

  // Compute 3D crystallographic axes triad (a, b, c) in bottom-left corner
  const axisTriad = [
    { label: 'a', vec: rotate3D(1, 0, 0, angleX, angleY), color: '#f43f5e' },
    { label: 'b', vec: rotate3D(0, -1, 0, angleX, angleY), color: '#10b981' },
    { label: 'c', vec: rotate3D(0, 0, 1, angleX, angleY), color: '#38bdf8' }
  ];

  // Coherent internal (hkl) lattice plane slices inside the crystal domain
  const sliceCount = Math.min(7, Math.max(3, Math.floor(estimatedPlanesN / 15)));
  const internalSlices = Array.from({ length: sliceCount }, (_, i) => {
    const yLevel = -0.65 + (i * 1.3) / Math.max(1, sliceCount - 1);
    const rSlice = 0.72 * Math.sqrt(Math.max(0.15, 1 - yLevel * yLevel * 0.65));
    const pA = project2D(...(rotate3D(-rSlice, yLevel, -rSlice * 0.4, angleX, angleY) as [number, number, number]));
    const pB = project2D(...(rotate3D(rSlice, yLevel, rSlice * 0.4, angleX, angleY) as [number, number, number]));
    return { x1: pA[0], y1: pA[1], x2: pB[0], y2: pB[1] };
  });

  // Crystallographic facet normal vectors [100], [010], [111]
  const facetNormals = [
    { tag: '[100]', dir: [1.45, 0, 0], color: '#fbbf24' },
    { tag: '[001]', dir: [0, -1.45, 0], color: '#38bdf8' },
    { tag: '[111]', dir: [0.95, -0.95, 0.95], color: '#34d399' }
  ].map(n => {
    const rot = rotate3D(n.dir[0], n.dir[1], n.dir[2], angleX, angleY);
    const end = project2D(rot[0], rot[1], rot[2]);
    return { ...n, x2: end[0], y2: end[1] };
  });

  return (
    <div
      className="w-full h-full min-h-[260px] bg-[#020610] rounded-2xl relative overflow-hidden flex flex-col justify-between items-center select-none cursor-grab active:cursor-grabbing border border-slate-800/80 shadow-[inset_0_2px_18px_rgba(0,0,0,0.85)]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Subtle Coordinate Crosshairs */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-800/70 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-slate-800/70 to-transparent pointer-events-none" />

      {/* Top HUD Bar: Title + Interactive Layer Controls */}
      <div className="w-full px-3.5 pt-3 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 pointer-events-none">
          <Atom className="w-3.5 h-3.5 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[8.5px] font-mono tracking-widest text-slate-500 font-bold uppercase">
              3D Coherent Domain
            </span>
            <span className="text-[11px] font-black tracking-wide text-white uppercase leading-tight">
              {displayName}
            </span>
          </div>
        </div>

        {/* Interactive Viewport Buttons */}
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setShowLatticePlanes(!showLatticePlanes)}
            className={`px-2 py-1 rounded-lg text-[8.5px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
              showLatticePlanes
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle internal coherent (hkl) lattice planes"
          >
            <Layers className="w-2.5 h-2.5" />
            Planes
          </button>
          <button
            type="button"
            onClick={() => setShowNormals(!showNormals)}
            className={`px-2 py-1 rounded-lg text-[8.5px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
              showNormals
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle crystallographic [hkl] facet normal vectors"
          >
            <Compass className="w-2.5 h-2.5" />
            [hkl]
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1 rounded-lg border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={autoRotate ? 'Pause 3D orbit' : 'Resume 3D orbit'}
          >
            {autoRotate ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setAngleX(-24);
              setAngleY(38);
            }}
            className="p-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reset 3D orientation"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Real 3D Vector SVG Stage */}
      <div className="w-full flex-1 flex items-center justify-center relative min-h-[165px] pointer-events-none">
        <svg className="w-full h-full max-w-[260px]" viewBox="0 0 250 195">
          {/* Concentric Diffraction Debye-Scherrer Rings */}
          <circle
            cx="125"
            cy="100"
            r={62 * visualScale}
            fill="none"
            stroke="rgba(56, 189, 248, 0.14)"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />
          <circle
            cx="125"
            cy="100"
            r={76 * visualScale}
            fill="none"
            stroke="rgba(245, 158, 11, 0.1)"
            strokeWidth="0.7"
            strokeDasharray="2 4"
          />

          {/* Outer Glow Aura */}
          <circle
            cx="125"
            cy="100"
            r={52 * visualScale}
            fill={colSet.glow}
            filter="blur(14px)"
          />

          {/* 3D Faces rendered in order of average Z-depth */}
          {sortedFaces.map((f) => {
            const opacity = isCubic111 || showLatticePlanes ? 0.38 : 0.88;
            const rVal = Math.floor(parseInt(colSet.fill.split(',')[0]) * f.shadeIntensity);
            const gVal = Math.floor(parseInt(colSet.fill.split(',')[1]) * f.shadeIntensity);
            const bVal = Math.floor(parseInt(colSet.fill.split(',')[2]) * f.shadeIntensity);

            return (
              <polygon
                key={f.faceIdx}
                points={f.pointsString}
                fill={`rgba(${rVal}, ${gVal}, ${bVal}, ${opacity})`}
                stroke={colSet.stroke}
                strokeWidth={isCubic111 ? '0.8' : '1.2'}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Coherent Internal Lattice Planes (D = N * d_hkl) */}
          {showLatticePlanes &&
            internalSlices.map((sl, sIdx) => (
              <line
                key={sIdx}
                x1={sl.x1}
                y1={sl.y1}
                x2={sl.x2}
                y2={sl.y2}
                stroke="#38bdf8"
                strokeWidth="1.1"
                strokeDasharray="3 2"
                opacity="0.85"
              />
            ))}

          {/* Special crystalline {111} Miller plane spotlight */}
          {isCubic111 && planarProjTriangle && (
            <g>
              <polygon
                points={planarProjTriangle}
                fill="rgba(34, 211, 238, 0.45)"
                stroke="#22d3ee"
                strokeWidth="1.8"
                strokeDasharray="4 2"
              />
              <text
                x="172"
                y="48"
                fill="#22d3ee"
                fontSize="7.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="start"
              >
                (111) Plane
              </text>
              <line x1="170" y1="46" x2="140" y2="75" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 2" />
            </g>
          )}

          {/* Crystallographic Facet Normal Vectors [100], [001], [111] */}
          {showNormals &&
            facetNormals.map((fn, idx) => (
              <g key={idx}>
                <line
                  x1="125"
                  y1="100"
                  x2={fn.x2}
                  y2={fn.y2}
                  stroke={fn.color}
                  strokeWidth="1.3"
                  strokeDasharray="2 1.5"
                />
                <circle cx={fn.x2} cy={fn.y2} r="2.2" fill={fn.color} />
                <text
                  x={fn.x2 + (fn.x2 >= 125 ? 4 : -4)}
                  y={fn.y2 - 3}
                  fill={fn.color}
                  fontSize="7"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor={fn.x2 >= 125 ? 'start' : 'end'}
                >
                  {fn.tag}
                </text>
              </g>
            ))}

          {/* Atomic coordinate lattice spheres overlaid on vertices */}
          {rotatedVerts.map((pt, idx) => {
            const proj = project2D(pt[0], pt[1], pt[2]);
            const isFront = pt[2] < 0.2;
            return (
              <circle
                key={idx}
                cx={proj[0]}
                cy={proj[1]}
                r={isFront ? '3.1' : '1.8'}
                fill={isFront ? colSet.atom : 'rgba(255,255,255,0.4)'}
                stroke={isFront ? 'rgba(0,0,0,0.6)' : 'none'}
                strokeWidth="0.5"
                opacity={isFront ? 1.0 : 0.45}
              />
            );
          })}

          {/* 3D Crystallographic Axes Gizmo (a, b, c) in bottom-left */}
          <g transform="translate(28, 158)">
            <circle cx="0" cy="0" r="18" fill="rgba(9, 16, 31, 0.85)" stroke="#1e293b" strokeWidth="0.8" />
            {axisTriad.map((ax) => {
              const xEnd = ax.vec[0] * 13;
              const yEnd = ax.vec[1] * 13;
              return (
                <g key={ax.label}>
                  <line x1="0" y1="0" x2={xEnd} y2={yEnd} stroke={ax.color} strokeWidth="1.3" />
                  <text
                    x={xEnd * 1.28}
                    y={yEnd * 1.28 + 2}
                    fill={ax.color}
                    fontSize="6.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {ax.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Drag hint badge */}
        <div className="absolute bottom-1 right-3 flex items-center gap-1 opacity-60 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80 pointer-events-none">
          <Rotate3d className="w-2.5 h-2.5 text-slate-400" />
          <span className="text-[7.5px] font-mono uppercase tracking-wider text-slate-400">
            Drag 3D
          </span>
        </div>
      </div>

      {/* Bottom Telemetry Strip with Tabular Numerals */}
      <div className="w-full px-3.5 pb-3 pointer-events-none z-10">
        <div className="grid grid-cols-3 gap-2 bg-[#050B16] border border-slate-800/90 rounded-xl p-2 font-mono tabular-nums">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 uppercase font-bold">Domain Size D</span>
            <span className="text-[11px] font-black text-amber-400">
              {safeSize.toFixed(1)} <span className="text-[8.5px] text-slate-400 font-normal">nm</span>
            </span>
          </div>
          <div className="flex flex-col border-x border-slate-800/80 px-2">
            <span className="text-[8px] text-slate-500 uppercase font-bold">Planes N = D/d</span>
            <span className="text-[11px] font-black text-cyan-300">
              ~{estimatedPlanesN} <span className="text-[8.5px] text-slate-400 font-normal">layers</span>
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-slate-500 uppercase font-bold">Shape Factor</span>
            <span className="text-[11px] font-black text-emerald-300">
              K = {activeK.toFixed(3)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
