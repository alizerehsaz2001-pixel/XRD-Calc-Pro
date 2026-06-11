import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Atom, Rotate3d, Maximize2 } from 'lucide-react';

export const MorphologyVisualizer = ({ kType, sizeNm }: { kType: string, sizeNm: number }) => {
  // Keep track of 3D rotation angles
  const [angleX, setAngleX] = useState(-24);
  const [angleY, setAngleY] = useState(38);
  const [isDragging, setIsDragging] = useState(false);
  
  // Track continuous rotation
  const [autoRotate, setAutoRotate] = useState(true);
  const animFrameRef = useRef<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0, ax: 0, ay: 0 });

  // Physics-based size growth: compute a clean visual scale bound to average size
  const visualScale = 0.45 + Math.min(0.55, (sizeNm || 10) / 95);

  useEffect(() => {
    let lastTime = performance.now();
    
    const tick = (time: number) => {
      if (autoRotate && !isDragging) {
        const delta = (time - lastTime) / 1000; // seconds
        setAngleY(prev => (prev + delta * 12) % 360); // spin 12 degrees per second
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [autoRotate, isDragging]);

  // Touch and Mouse handlers for free 3D rotation
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
    
    // Clamp X rotation to avoid perfect gimbal lock flipping
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
    let name = "Standard Crystallite";
    let theme = "amber"; // amber, cyan, violet, emerald, rose

    if (isSpherical) {
      name = "Spherical Nanoparticle";
      theme = "amber";
      const latCount = 6;
      const lonCount = 12;
      // Vertices
      for (let lat = 0; lat <= latCount; lat++) {
        const theta = -Math.PI / 2 + (Math.PI * lat) / latCount;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon < lonCount; lon++) {
          const phi = (2 * Math.PI * lon) / lonCount;
          vertices.push([cosTheta * Math.cos(phi), sinTheta, cosTheta * Math.sin(phi)]);
        }
      }
      // Faces
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
      name = "Cubic Grains {100}";
      theme = "violet";
      vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
      ];
      faces = [
        [4, 5, 6, 7], // front
        [1, 0, 3, 2], // back
        [0, 1, 5, 4], // top
        [7, 6, 2, 3], // bottom
        [0, 4, 7, 3], // left
        [5, 1, 2, 6]  // right
      ];
    } else if (isCubic111) {
      name = "Planar Cube {111}";
      theme = "cyan";
      vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
      ];
      faces = [
        [4, 5, 6, 7], // front
        [1, 0, 3, 2], // back
        [0, 1, 5, 4], // top
        [7, 6, 2, 3], // bottom
        [0, 4, 7, 3], // left
        [5, 1, 2, 6]  // right
      ];
    } else if (isOctahedral) {
      name = "Spinel Octahedron";
      theme = "emerald";
      vertices = [
        [0, -1.35, 0], // top
        [0, 1.35, 0],  // bottom
        [1, 0, -1], [1, 0, 1], [-1, 0, 1], [-1, 0, -1] // equator
      ];
      const s = 1.15;
      vertices[2] = [s, 0, -s];
      vertices[3] = [s, 0, s];
      vertices[4] = [-s, 0, s];
      vertices[5] = [-s, 0, -s];

      faces = [
        [0, 3, 2], [0, 4, 3], [0, 5, 4], [0, 2, 5], // top
        [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2]  // bottom
      ];
    } else if (isTetrahedral) {
      name = "Tetrahedral Pyramid";
      theme = "rose";
      vertices = [
        [0, -1.15, 0], // top pyramid node
        [1, 0.65, -0.6],
        [-1, 0.65, -0.6],
        [0, 0.65, 1.15]
      ];
      faces = [
        [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2]
      ];
    } else if (isPlate) {
      name = "Textured Platelets/Disks";
      theme = "cyan";
      const segments = 10;
      const r = 1.3;
      const h = 0.3;
      // Top cap vertices
      for (let i = 0; i < segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        vertices.push([r * Math.cos(theta), -h, r * Math.sin(theta)]);
      }
      // Bottom cap vertices
      for (let i = 0; i < segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        vertices.push([r * Math.cos(theta), h, r * Math.sin(theta)]);
      }
      // Top face
      faces.push(Array.from({ length: segments }, (_, i) => i));
      // Bottom face (reversed order)
      faces.push(Array.from({ length: segments }, (_, i) => segments * 2 - 1 - i));
      // side panels
      for (let i = 0; i < segments; i++) {
        faces.push([i, (i + 1) % segments, ((i + 1) % segments) + segments, i + segments]);
      }
    } else if (isRod) {
      name = "Highly Anisotropic Nanowire";
      theme = "violet";
      const segments = 8;
      const r = 0.42;
      const h = 1.35;
      // Top cap
      for (let i = 0; i < segments; i++) {
        const theta = (2 * Math.PI * i) / segments;
        vertices.push([r * Math.cos(theta), -h, r * Math.sin(theta)]);
      }
      // Bottom cap
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
      // Dodecahedral Polymorphic Grains
      name = "Polymorphic Icosahedron";
      theme = "amber";
      const p = 1.618;
      const s = 0.62;
      vertices = [
        [0, 1, p], [0, -1, p], [0, 1, -p], [0, -1, -p],
        [1, p, 0], [-1, p, 0], [1, -p, 0], [-1, -p, 0],
        [p, 0, 1], [-p, 0, 1], [p, 0, -1], [-p, 0, -1]
      ].map(([x, y, z]) => [x * s, y * s, (z || 0) * s]);

      // Normalize vertices to perfect shell radius for beautiful display
      vertices = vertices.map(([x, y, z]) => {
        const len = Math.sqrt(x*x + y*y + z*z);
        const refR = 1.15;
        return [(x/len)*refR, (y/len)*refR, (z/len)*refR];
      });

      faces = [
        [0, 8, 4], [0, 4, 5], [0, 5, 9], [0, 9, 1], [0, 1, 8],
        [1, 6, 8], [1, 7, 6], [1, 9, 7], [8, 6, 10], [8, 10, 4],
        [4, 10, 2], [4, 2, 5], [5, 2, 11], [5, 11, 9], [9, 11, 7],
        [7, 11, 3], [7, 3, 6], [6, 3, 10], [10, 3, 2], [2, 3, 11]
      ];
    }

    return { vertices, faces, name, theme, isCubic111 };
  };

  const { vertices, faces, name: displayName, theme, isCubic111 } = getModelData();

  // Rotate a 3D coordinate around both X and Y axes
  const rotate3D = (x: number, y: number, z: number, angX: number, angY: number) => {
    // Y rotation
    const rY = angY * Math.PI / 180;
    const cosY = Math.cos(rY);
    const sinY = Math.sin(rY);
    let x1 = x * cosY + z * sinY;
    let z1 = -x * sinY + z * cosY;

    // X rotation
    const rX = angX * Math.PI / 180;
    const cosX = Math.cos(rX);
    const sinX = Math.sin(rX);
    let y2 = y * cosX - z1 * sinX;
    let z2 = y * sinX + z1 * cosX;

    return [x1, y2, z2];
  };

  // Rotate all vertices and save depth
  const rotatedVerts = vertices.map(([x, y, z]) => rotate3D(x, y, z, angleX, angleY));

  // Weak projection scaling
  const scalePixels = 48 * visualScale;
  const project2D = (x: number, y: number, z: number) => {
    const depthFactor = 120 / (120 + z * 0.4);
    return [
      100 + x * scalePixels * depthFactor,
      95 + y * scalePixels * depthFactor
    ];
  };

  // Shading / Solar reflection calculator: directional light source vector
  const lightSource = [0.45, -0.75, -0.48]; // top-left-front
  const lightLen = Math.sqrt(lightSource[0]**2 + lightSource[1]**2 + lightSource[2]**2);
  const L_norm = [lightSource[0]/lightLen, lightSource[1]/lightLen, lightSource[2]/lightLen];

  // Process faces with their depth sorting (Painters Algorithm)
  const faceProjectedData = faces.map((indices, faceIdx) => {
    const facePoints = indices.map(idx => rotatedVerts[idx]);
    
    // Average depth (Z)
    const avgZ = facePoints.reduce((acc, pt) => acc + pt[2], 0) / indices.length;

    // Compute outward normal vector of face using first 3 vertices
    const p0 = facePoints[0];
    const p1 = facePoints[1];
    const p2 = facePoints[2];

    const ax = p1[0] - p0[0];
    const ay = p1[1] - p0[1];
    const az = p1[2] - p0[2];

    const bx = p2[0] - p0[0];
    const by = p2[1] - p0[1];
    const bz = p2[2] - p0[2];

    // Cross product A x B
    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;

    const normLen = Math.sqrt(nx*nx + ny*ny + nz*nz);
    if (normLen > 0) {
      nx /= normLen;
      ny /= normLen;
      nz /= normLen;
    }

    // Dot product with directional light
    const dp = nx * L_norm[0] + ny * L_norm[1] + nz * L_norm[2];
    const shadeIntensity = Math.max(0.12, Math.min(1.0, (dp + 1) / 2));

    // Project points to 2D screen positions
    const pointsString = indices.map(idx => {
      const proj = project2D(rotatedVerts[idx][0], rotatedVerts[idx][1], rotatedVerts[idx][2]);
      return `${proj[0].toFixed(1)},${proj[1].toFixed(1)}`;
    }).join(' ');

    return {
      pointsString,
      avgZ,
      shadeIntensity,
      faceIdx,
      nz // back-face culling support if nz > 0.05
    };
  });

  // Sort faces from back to front
  const sortedFaces = [...faceProjectedData].sort((a, b) => b.avgZ - a.avgZ);

  // Generate color palette variables
  const themeColors: Record<string, { fill: string, stroke: string, glow: string, atom: string }> = {
    amber: { fill: '245, 158, 11', stroke: 'rgba(251, 191, 36, 0.9)', glow: 'rgba(245, 158, 11, 0.15)', atom: '#fcd34d' },
    violet: { fill: '139, 92, 246', stroke: 'rgba(167, 139, 250, 0.9)', glow: 'rgba(139, 92, 246, 0.15)', atom: '#c4b5fd' },
    cyan: { fill: '6, 182, 212', stroke: 'rgba(34, 211, 238, 0.9)', glow: 'rgba(6, 182, 212, 0.15)', atom: '#67e8f9' },
    emerald: { fill: '16, 185, 129', stroke: 'rgba(52, 211, 153, 0.9)', glow: 'rgba(16, 185, 129, 0.15)', atom: '#6ee7b7' },
    rose: { fill: '244, 63, 94', stroke: 'rgba(251, 113, 133, 0.9)', glow: 'rgba(244, 63, 94, 0.15)', atom: '#fca5a5' }
  };

  const colSet = themeColors[theme] || themeColors.amber;

  // Custom addition of indices: {111} planar crystal projection inside translucent shell
  let planarProjTriangle: string | null = null;
  if (isCubic111) {
    // Indexes: 1 (1,-1,-1), 3 (-1,1,-1), 4 (-1,-1,1)
    const pt1 = project2D(rotatedVerts[1][0], rotatedVerts[1][1], rotatedVerts[1][2]);
    const pt2 = project2D(rotatedVerts[3][0], rotatedVerts[3][1], rotatedVerts[3][2]);
    const pt3 = project2D(rotatedVerts[4][0], rotatedVerts[4][1], rotatedVerts[4][2]);
    planarProjTriangle = `${pt1[0].toFixed(1)},${pt1[1].toFixed(1)} ${pt2[0].toFixed(1)},${pt2[1].toFixed(1)} ${pt3[0].toFixed(1)},${pt3[1].toFixed(1)}`;
  }

  // Draw wireframe overlay of connecting edges for high-tech aesthetic
  return (
    <div 
      className="w-full h-full min-h-[240px] bg-[#020610] rounded-2xl relative overflow-hidden flex flex-col justify-between items-center select-none cursor-grab active:cursor-grabbing border-b border-r border-slate-900 shadow-[inset_0_2px_18px_rgba(0,0,0,0.8)]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-grid-slate-800/10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-35 pointer-events-none" />
      
      {/* Visual scanning grid accents */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-slate-800/80 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-slate-800/80 to-transparent pointer-events-none" />

      {/* Interactive Title Tag */}
      <div className="absolute top-3.5 left-4 flex items-center gap-2 z-10 pointer-events-none">
        <Atom className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
        <div className="flex flex-col">
          <span className="text-[9px] font-mono tracking-widest text-slate-500 font-bold uppercase">Morphology Matrix</span>
          <span className="text-[11px] font-black tracking-wide text-white uppercase">{displayName}</span>
        </div>
      </div>

      <div className="absolute top-3.5 right-4 flex items-center gap-1.5 z-10 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        <span className="text-[8px] font-mono text-slate-400 font-black tracking-widest uppercase">
          {autoRotate ? 'Orbit ACTIVE' : 'Manual Rotation'}
        </span>
      </div>

      {/* Real 3D Vector SVG Stage */}
      <div className="w-full flex-1 flex items-center justify-center relative min-h-[160px] max-h-[180px] pointer-events-none mt-8">
        <svg 
          className="w-full h-full max-w-[220px]" 
          viewBox="0 0 200 190"
        >
          {/* Subtle Outer Glow Aura */}
          <circle 
            cx="100" 
            cy="95" 
            r={50 * visualScale} 
            fill={colSet.glow} 
            filter="blur(16px)"
            className="animate-pulse"
          />

          {/* 3D Faces rendered in order of average Z-depth */}
          {sortedFaces.map((f) => {
            // Outward face check to apply beautiful highlights
            const opacity = isCubic111 ? 0.22 : 0.90;
            const rVal = Math.floor(parseInt(colSet.fill.split(',')[0]) * f.shadeIntensity);
            const gVal = Math.floor(parseInt(colSet.fill.split(',')[1]) * f.shadeIntensity);
            const bVal = Math.floor(parseInt(colSet.fill.split(',')[2]) * f.shadeIntensity);
            
            return (
              <polygon
                key={f.faceIdx}
                points={f.pointsString}
                fill={`rgba(${rVal}, ${gVal}, ${bVal}, ${opacity})`}
                stroke={colSet.stroke}
                strokeWidth={isCubic111 ? "0.6" : "1.2"}
                strokeLinejoin="round"
              />
            );
          })}

          {/* Special crystalline Miller plane spotlight */}
          {isCubic111 && planarProjTriangle && (
            <g>
              <polygon
                points={planarProjTriangle}
                fill="rgba(34, 211, 238, 0.45)"
                stroke="#22d3ee"
                strokeWidth="1.8"
                strokeDasharray="4 2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))' }}
              />
              {/* Highlight crystal projection notes */}
              <text 
                x="145" 
                y="55" 
                fill="#22d3ee" 
                fontSize="7" 
                fontWeight="black" 
                fontFamily="monospace"
                textAnchor="start"
              >
                (111) Facet Plain
              </text>
              <line x1="142" y1="52" x2="114" y2="78" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 2" />
              <circle cx="114" cy="78" r="1.5" fill="#22d3ee" />
            </g>
          )}

          {/* Atomic coordinate lattice spheres overlaid on top of vertices for high scientific fidelity */}
          {rotatedVerts.map((pt, idx) => {
            const proj = project2D(pt[0], pt[1], pt[2]);
            const isFront = pt[2] < 0.2; // Draw foreground atoms with solid opacity
            return (
              <circle
                key={idx}
                cx={proj[0]}
                cy={proj[1]}
                r={isFront ? "3.2" : "1.8"}
                fill={isFront ? colSet.atom : "rgba(255,255,255,0.4)"}
                stroke={isFront ? "rgba(0,0,0,0.6)" : "none"}
                strokeWidth="0.5"
                opacity={isFront ? 1.0 : 0.45}
              />
            );
          })}
        </svg>

        {/* Small quick drag hints */}
        <div className="absolute bottom-1 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity bg-black/50 px-2 py-0.5 rounded border border-slate-900 pointer-events-none select-none">
          <Rotate3d className="w-3 h-3 text-slate-400" />
          <span className="text-[7.5px] font-mono uppercase tracking-[0.2em] text-slate-300 font-bold">Slide to rotate 3D</span>
        </div>
      </div>

      {/* Dynamic Scale indicator line */}
      <div className="w-full px-5 pb-3 pointer-events-none z-10 flex flex-col gap-1.5">
        <div className="flex justify-between text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider">
          <span>{sizeNm > 40 ? 'High Crystallinity' : 'Grain Limitation'}</span>
          <span>Aspect ratio 1:1</span>
        </div>
        <div className="flex items-center gap-3 w-full bg-[#040813] border border-slate-900 rounded-xl p-2.5">
          <div className="flex flex-col flex-1">
            <span className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Crystallite Size</span>
            <span className="text-[12px] font-mono font-black text-amber-400 tracking-tight leading-none">
              ~{sizeNm ? sizeNm.toFixed(1) : '10.0'} nm
            </span>
          </div>

          {/* Graphic scale axis bar */}
          <div className="w-24 flex flex-col justify-center items-end shrink-0 relative">
            <div className="w-full h-1 relative flex items-center">
              <div className="absolute left-0 right-0 h-[1.5px] bg-slate-800" />
              {/* Scale Tick bounds */}
              <div className="absolute left-0 h-2 w-[1px] bg-slate-500" />
              <div className="absolute right-0 h-2 w-[1px] bg-slate-500" />
              {/* Dynamic slider line indicating length on metric */}
              <div 
                className="absolute left-0 h-1 bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(15, (sizeNm || 10)))}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
