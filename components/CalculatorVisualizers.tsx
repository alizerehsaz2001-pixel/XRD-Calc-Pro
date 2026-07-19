import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, ArrowRight, Layers, HelpCircle, Play, Pause, RotateCw, Sparkles, Scale, Eye, Flame, Droplets, LineChart } from 'lucide-react';

// ==========================================
// 1. ENERGY / WAVELENGTH SINE WAVE VISUALIZER
// ==========================================
interface EnergyWaveVisualizerProps {
  energyKev: number;
  wavelength: number;
}

export const EnergyWaveVisualizer: React.FC<EnergyWaveVisualizerProps> = ({ energyKev, wavelength }) => {
  const eVal = energyKev || 8.048;
  const wVal = wavelength || 1.5406;

  // Calculate frequency visual factor (higher energy = higher frequency = more waves)
  const freqFactor = useMemo(() => {
    // Standard Cu K-alpha is 8.048 keV -> 1.5406 Å. Let's normalize around it.
    const norm = 8.048 / eVal; // higher energy -> smaller wavelength -> higher freq
    return Math.max(2, Math.min(30, 8 / norm));
  }, [eVal]);

  // Determine wave color temperature based on energy
  // High energy = extreme UV/X-ray (deep violet/blue)
  // Low energy = infrared/visible/soft X-ray (cyan/green/amber)
  const waveColors = useMemo(() => {
    if (eVal > 15) return { from: '#8b5cf6', to: '#c084fc', shadow: 'shadow-violet-500/40', bg: 'bg-violet-500/10' };
    if (eVal > 8) return { from: '#3b82f6', to: '#8b5cf6', shadow: 'shadow-blue-500/40', bg: 'bg-blue-500/10' };
    if (eVal > 4) return { from: '#0ea5e9', to: '#3b82f6', shadow: 'shadow-sky-500/40', bg: 'bg-sky-500/10' };
    return { from: '#f59e0b', to: '#f43f5e', shadow: 'shadow-rose-500/40', bg: 'bg-rose-500/10' };
  }, [eVal]);

  // Generate sine wave points
  const points = useMemo(() => {
    const pts = [];
    const width = 400;
    const height = 120;
    const amplitude = 35;
    for (let x = 0; x <= width; x++) {
      const angle = (x / width) * freqFactor * Math.PI * 2;
      const y = height / 2 + Math.sin(angle) * amplitude;
      pts.push(`${x},${y}`);
    }
    return pts.join(' L ');
  }, [freqFactor]);

  return (
    <div className="relative p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center shadow-sm overflow-hidden group">
      {/* Background abstract gradient blobs */}
      <div className={`absolute top-0 left-1/4 w-32 h-32 blur-3xl rounded-full opacity-20 transition-colors duration-1000 ${waveColors.bg}`}></div>
      <div className={`absolute bottom-0 right-1/4 w-32 h-32 blur-3xl rounded-full opacity-20 transition-colors duration-1000 ${waveColors.bg}`}></div>

      <div className="relative w-full flex justify-between items-center mb-6 z-10">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Electromagnetic Spectrum
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Energy ↔ Wavelength Relationship
          </span>
        </div>
        <div className={`px-3 py-1 rounded-xl text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md`}>
          E = hc/λ
        </div>
      </div>

      <div className="relative w-full h-36 bg-slate-50 dark:bg-black/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
        {/* Animated Grid lines behind */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-4 opacity-[0.03] dark:opacity-[0.06] pointer-events-none">
          {Array.from({ length: 32 }).map((_, i) => (
            <div key={i} className="border-r border-b border-slate-900 dark:border-white"></div>
          ))}
        </div>
        
        {/* Central Axis Line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-300 dark:bg-slate-700 border-dashed opacity-50"></div>

        {/* The Wave Path */}
        <svg width="100%" height="100%" viewBox="0 0 400 120" className="overflow-visible absolute inset-0 z-10" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGradAdvanced" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={waveColors.from} />
              <stop offset="100%" stopColor={waveColors.to} />
            </linearGradient>
            <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background thick glow path */}
          <motion.path
            d={`M 0,60 L ${points}`}
            fill="none"
            stroke="url(#waveGradAdvanced)"
            strokeWidth="8"
            opacity="0.15"
            strokeLinecap="round"
            filter="url(#waveGlow)"
            animate={{ strokeDashoffset: [0, -400] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 8 }}
          />

          {/* Primary sharp wave path */}
          <motion.path
            d={`M 0,60 L ${points}`}
            fill="none"
            stroke="url(#waveGradAdvanced)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ strokeDashoffset: [0, -400] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 8 }}
          />
        </svg>

        {/* Overlay Measurements */}
        <div className="absolute left-4 top-3 flex flex-col z-20">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Wavelength (λ)</span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
            {wVal.toFixed(4)} Å
          </div>
        </div>

        <div className="absolute right-4 bottom-3 flex flex-col items-end z-20">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Photon Energy (E)</span>
          <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
            {eVal.toFixed(3)} keV
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mt-4 z-10">
        <div className="flex flex-col p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider font-bold mb-1">Radiation Regime</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">
            {eVal > 50 ? 'Hard X-Rays' : eVal > 2 ? 'Standard X-Rays' : 'Extreme UV (EUV)'}
          </span>
        </div>
        <div className="flex flex-col p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl transition-colors hover:border-slate-300 dark:hover:border-slate-700">
          <span className="text-slate-400 text-[9px] uppercase tracking-wider font-bold mb-1">Typical Source</span>
          <span className="text-slate-700 dark:text-slate-200 font-medium text-sm truncate" title={Math.abs(eVal - 8.048) < 0.2 ? 'Copper (Cu K-α)' : Math.abs(eVal - 17.479) < 0.4 ? 'Molybdenum (Mo K-α)' : Math.abs(eVal - 5.414) < 0.2 ? 'Chromium (Cr K-α)' : 'Synchrotron / Custom Tube'}>
            {Math.abs(eVal - 8.048) < 0.2 ? 'Cu Tube (K-α)' : Math.abs(eVal - 17.479) < 0.4 ? 'Mo Tube (K-α)' : Math.abs(eVal - 5.414) < 0.2 ? 'Cr Tube (K-α)' : 'Synchrotron Beam'}
          </span>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 2. MILLER PLANE 3D ISOMETRIC VISUALIZER
// ==========================================
interface MillerPlaneVisualizerProps {
  system: string;
  a: number;
  b: number;
  c: number;
  h: number;
  k: number;
  l: number;
}

export const MillerPlaneVisualizer: React.FC<MillerPlaneVisualizerProps> = ({ system, a, b, c, h, k, l }) => {
  const hVal = Math.max(-4, Math.min(4, Math.round(h || 0)));
  const kVal = Math.max(-4, Math.min(4, Math.round(k || 0)));
  const lVal = Math.max(-4, Math.min(4, Math.round(l || 0)));

  const [rotation, setRotation] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [tilt, setTilt] = useState<number>(20); // vertical tilt

  useEffect(() => {
    if (!autoRotate) return;
    let animId: number;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      setRotation((r) => (r + delta * 0.02) % 360);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  // Isometric/3D projection parameters with dynamic rotation and tilt
  const project = (x: number, y: number, z: number) => {
    const originX = 110;
    const originY = 95;
    const sizeScale = 52;
    
    // Normalizing relative dimensions
    const maxParam = Math.max(a || 4.0, b || 4.0, c || 4.0) || 1;
    const normA = (a || 4.0) / maxParam;
    const normB = (b || 4.0) / maxParam;
    const normC = (c || 4.0) / maxParam;

    // Convert coordinates to centered relative 3D space
    // Center of the cube is at (0.5, 0.5, 0.5)
    const cx = (x - 0.5) * normA * sizeScale;
    const cy = (y - 0.5) * normB * sizeScale;
    const cz = (z - 0.5) * normC * sizeScale;

    // 3D Rotations
    // Rotate around Z axis (yaw / rotation)
    const yawRad = (rotation * Math.PI) / 180;
    const r1x = cx * Math.cos(yawRad) - cy * Math.sin(yawRad);
    const r1y = cx * Math.sin(yawRad) + cy * Math.cos(yawRad);
    const r1z = cz;

    // Rotate around X axis (pitch / tilt)
    const pitchRad = (tilt * Math.PI) / 180;
    const r2x = r1x;
    const r2y = r1y * Math.cos(pitchRad) - r1z * Math.sin(pitchRad);
    const r2z = r1y * Math.sin(pitchRad) + r1z * Math.cos(pitchRad);

    // Simple orthographic projection with coordinate shift
    const px = originX + r2x;
    const py = originY - r2y; // invert Y for screen coords

    return { x: px, y: py, depth: r2z };
  };

  // Wireframe vertices recalculated on rotation
  const v = useMemo(() => {
    return {
      v000: project(0, 0, 0),
      v100: project(1, 0, 0),
      v010: project(0, 1, 0),
      v110: project(1, 1, 0),
      v001: project(0, 0, 1),
      v101: project(1, 0, 1),
      v011: project(0, 1, 1),
      v111: project(1, 1, 1),
    };
  }, [a, b, c, rotation, tilt]);

  // Determine Plane Polygon Vertices
  const planePoints = useMemo(() => {
    const iX = hVal === 0 ? null : 1 / hVal;
    const iY = kVal === 0 ? null : 1 / kVal;
    const iZ = lVal === 0 ? null : 1 / lVal;

    // Handle standard single indices
    if (hVal === 1 && kVal === 0 && lVal === 0) {
      const p1 = project(1, 0, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(1, 1, 1);
      const p4 = project(1, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (hVal === 0 && kVal === 1 && lVal === 0) {
      const p1 = project(0, 1, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(1, 1, 1);
      const p4 = project(0, 1, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (hVal === 0 && kVal === 0 && lVal === 1) {
      const p1 = project(0, 0, 1);
      const p2 = project(1, 0, 1);
      const p3 = project(1, 1, 1);
      const p4 = project(0, 1, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (hVal === 1 && kVal === 1 && lVal === 0) {
      const p1 = project(1, 0, 0);
      const p2 = project(0, 1, 0);
      const p3 = project(0, 1, 1);
      const p4 = project(1, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (hVal === 1 && kVal === 0 && lVal === 1) {
      const p1 = project(1, 0, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(0, 1, 1);
      const p4 = project(0, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (hVal === 0 && kVal === 1 && lVal === 1) {
      const p1 = project(0, 1, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(1, 0, 1);
      const p4 = project(0, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }

    const px = iX !== null ? Math.max(0, Math.min(1, iX)) : 1;
    const py = iY !== null ? Math.max(0, Math.min(1, iY)) : 1;
    const pz = iZ !== null ? Math.max(0, Math.min(1, iZ)) : 1;

    const ptA = project(px, 0, 0);
    const ptB = project(0, py, 0);
    const ptC = project(0, 0, pz);

    if (hVal === 0) {
      const p1 = project(0, py, 0);
      const p2 = project(1, py, 0);
      const p3 = project(1, 0, pz);
      const p4 = project(0, 0, pz);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (kVal === 0) {
      const p1 = project(px, 0, 0);
      const p2 = project(px, 1, 0);
      const p3 = project(0, 1, pz);
      const p4 = project(0, 0, pz);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (lVal === 0) {
      const p1 = project(px, 0, 0);
      const p2 = project(px, 0, 1);
      const p3 = project(0, py, 1);
      const p4 = project(0, py, 0);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }

    return `${ptA.x},${ptA.y} ${ptB.x},${ptB.y} ${ptC.x},${ptC.y}`;
  }, [hVal, kVal, lVal, rotation, tilt, a, b, c]);

  // Sorting atom spheres by depth for proper painter's rendering algorithm
  const sortedVertices = useMemo(() => {
    const list = [
      { name: '000', pt: v.v000, color: 'fill-slate-400' },
      { name: '100', pt: v.v100, color: 'fill-rose-500' },
      { name: '010', pt: v.v010, color: 'fill-emerald-500' },
      { name: '110', pt: v.v110, color: 'fill-indigo-500' },
      { name: '001', pt: v.v001, color: 'fill-blue-500' },
      { name: '101', pt: v.v101, color: 'fill-teal-500' },
      { name: '011', pt: v.v011, color: 'fill-purple-500' },
      { name: '111', pt: v.v111, color: 'fill-violet-500' },
    ];
    return list.sort((aItem, bItem) => aItem.pt.depth - bItem.pt.depth);
  }, [v]);

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Crystallographic Planar Shader</span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">3D Interactive Unit Cell ({system})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setRotation((r) => (r + 45) % 360)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Tilt Yaw"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="relative w-full max-w-[240px] h-52 flex items-center justify-center bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-2 shadow-inner">
        {/* Dynamic Rotation indicators */}
        <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[8px] font-bold text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          YAW: {Math.round(rotation)}°
        </div>

        <svg viewBox="0 0 220 180" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id="atomGlow" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor="currentColor" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
            </radialGradient>
            <filter id="planeGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Unit Cell Axes (Relative to center projection) */}
          <g className="text-[9px] font-black font-mono">
            {/* Origin indicator */}
            <circle cx={v.v000.x} cy={v.v000.y} r="4" className="fill-slate-400 stroke-white dark:stroke-slate-900 stroke-1.5 shadow" />
            
            {/* a-axis (down-left) */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v100.x} y2={v.v100.y} className="stroke-rose-400/80 stroke-2 stroke-dasharray-[2,2]" />
            <text x={v.v100.x - 12} y={v.v100.y + 10} className="fill-rose-500 font-bold">a [x]</text>

            {/* b-axis (down-right) */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v010.x} y2={v.v010.y} className="stroke-emerald-400/80 stroke-2 stroke-dasharray-[2,2]" />
            <text x={v.v010.x + 4} y={v.v010.y + 10} className="fill-emerald-500 font-bold">b [y]</text>

            {/* c-axis (up) */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v001.x} y2={v.v001.y} className="stroke-blue-400/80 stroke-2 stroke-dasharray-[2,2]" />
            <text x={v.v001.x - 4} y={v.v001.y - 8} className="fill-blue-500 font-bold">c [z]</text>
          </g>

          {/* Wireframe Box Edges (Drawn uniformly for smooth rotation) */}
          <g className="stroke-slate-300 dark:stroke-slate-800 stroke-[1.2] fill-none" strokeLinecap="round">
            {/* Bottom Face */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v100.x} y2={v.v100.y} />
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v010.x} y2={v.v010.y} />
            <line x1={v.v100.x} y1={v.v100.y} x2={v.v110.x} y2={v.v110.y} />
            <line x1={v.v010.x} y1={v.v010.y} x2={v.v110.x} y2={v.v110.y} />
            
            {/* Top Face */}
            <line x1={v.v001.x} y1={v.v001.y} x2={v.v101.x} y2={v.v101.y} />
            <line x1={v.v001.x} y1={v.v001.y} x2={v.v011.x} y2={v.v011.y} />
            <line x1={v.v101.x} y1={v.v101.y} x2={v.v111.x} y2={v.v111.y} />
            <line x1={v.v011.x} y1={v.v011.y} x2={v.v111.x} y2={v.v111.y} />
            
            {/* Verticals */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v001.x} y2={v.v001.y} />
            <line x1={v.v100.x} y1={v.v100.y} x2={v.v101.x} y2={v.v101.y} />
            <line x1={v.v010.x} y1={v.v010.y} x2={v.v011.x} y2={v.v011.y} />
            <line x1={v.v110.x} y1={v.v110.y} x2={v.v111.x} y2={v.v111.y} />
          </g>

          {/* THE INTERSECTING MILLER PLANE (Semi-Transparent Shaded) */}
          {planePoints && (
            <polygon
              points={planePoints}
              className="fill-indigo-500/35 dark:fill-indigo-500/45 stroke-indigo-600 dark:stroke-indigo-400 stroke-[2.5]"
              style={{ filter: 'url(#planeGlowFilter)' }}
            />
          )}

          {/* Corner atom spheres sorted by depth for clean orthographic overlapping rendering */}
          {sortedVertices.map((node) => (
            <circle
              key={node.name}
              cx={node.pt.x}
              cy={node.pt.y}
              r={node.name === '000' ? '6' : '4.5'}
              className={`${node.color} stroke-white dark:stroke-slate-900 stroke-[1.5] transition-all`}
              fill="url(#atomGlow)"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))' }}
            />
          ))}

          {/* Miller Plane Index Tag inside SVG */}
          <g transform="translate(10, 10)">
            <rect width="52" height="20" rx="6" className="fill-slate-100/90 dark:fill-slate-800/90 stroke-slate-200 dark:stroke-slate-700/60 stroke" />
            <text x="26" y="14" className="text-[10px] font-mono font-black text-center fill-slate-700 dark:fill-slate-200" textAnchor="middle">
              ({hVal} {kVal} {lVal})
            </text>
          </g>
        </svg>
      </div>

      {/* Manual Tilt Controls */}
      <div className="w-full flex items-center justify-between gap-4 mt-3 px-1 text-[9px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>TILT: {tilt}°</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="80" 
          value={String(tilt) === 'NaN' ? '' : tilt} 
          onChange={(e) => {
            setTilt(parseInt(e.target.value));
            setAutoRotate(false);
          }}
          className="w-24 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center max-w-[220px] mt-2 leading-relaxed">
        Calculated crystal plane intercept intersecting a <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">({hVal}{kVal}{lVal})</span> slice of unit lattice spacing parameters.
      </div>
    </div>
  );
};


// ==========================================
// 3. MICROSTRUCTURE EDGE DISLOCATION VISUALIZER
// ==========================================
interface DislocationVisualizerProps {
  system: string;
  a: number;
  dSize: number;
  density: number;
  burgers: number;
}

export const DislocationVisualizer: React.FC<DislocationVisualizerProps> = ({ system, a, dSize, density, burgers }) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center shadow-sm overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Dislocation Defect & Burgers Loop
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {system} Crystal Structure Defect Model
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
          Elastic Core
        </span>
      </div>

      <div className="relative w-full h-48 bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
        <svg viewBox="0 0 280 180" className="w-full h-full p-2 overflow-visible">
          <defs>
            <radialGradient id="stressGradHot" cx="50%" cy="30%" r="55%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="40%" stopColor="#f43f5e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="stressGradCold" cx="50%" cy="75%" r="55%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="atom3DGlow" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0a0a0c" stopOpacity="0.5" />
            </radialGradient>
            <marker id="dislocationArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" className="fill-indigo-600 dark:fill-indigo-400" />
            </marker>
          </defs>

          {/* Stress contour zones */}
          <circle cx="140" cy="55" r="55" fill="url(#stressGradHot)" />
          <circle cx="140" cy="115" r="50" fill="url(#stressGradCold)" />

          {/* Compression & Tension labels with glow accents */}
          <text x="140" y="24" className="text-[8px] font-black tracking-wider fill-rose-600 dark:fill-rose-400 text-center opacity-90" textAnchor="middle">COMPRESSION FIELD (STRESS CLOUD)</text>
          <text x="140" y="158" className="text-[8px] font-black tracking-wider fill-blue-600 dark:fill-blue-400 text-center opacity-90" textAnchor="middle">TENSION FIELD (DILATATION CLOUD)</text>

          {/* Slip Plane horizontal guideline */}
          <line x1="10" y1="85" x2="270" y2="85" className="stroke-indigo-500/30 dark:stroke-indigo-500/20 stroke-[1.5] stroke-dasharray-[4,3]" />
          <text x="228" y="80" className="text-[8px] font-mono font-black uppercase tracking-wider fill-indigo-400 dark:fill-indigo-500">Slip Plane</text>

          {/* Lattice of Atoms with edge dislocation */}
          {/* Top Half of Grid: 8 columns squished near the core */}
          {[-3, -2, -1, 0, 1, 2, 3].map((col) => {
            return [15, 36, 57].map((rowY, idx) => {
              // Elastic deformation formula: displacement away from the central half-plane
              let dx = col * 22;
              if (col < 0) dx -= Math.max(0, 11 - idx * 3.5);
              if (col > 0) dx += Math.max(0, 11 - idx * 3.5);
              const xPos = 140 + dx;
              
              // Color-code based on proximity to compression stress zone
              const colorClass = idx === 2 ? 'text-rose-400 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400';
              
              return (
                <circle
                  key={`top-${col}-${rowY}`}
                  cx={xPos}
                  cy={rowY}
                  r="4.5"
                  className={`${colorClass} stroke-white dark:stroke-slate-900 stroke-[1.2]`}
                  fill="url(#atom3DGlow)"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
                />
              );
            });
          })}

          {/* EXTRA HALF-PLANE OF ATOMS (The crystal defect itself) */}
          {[15, 36, 57].map((rowY) => (
            <circle
              key={`extra-${rowY}`}
              cx="140"
              cy={rowY}
              r="5"
              className="text-rose-600 dark:text-rose-400 stroke-white dark:stroke-slate-900 stroke-[1.5]"
              fill="url(#atom3DGlow)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(244,63,94,0.6))' }}
            />
          ))}

          {/* Dislocation core T-symbol (⊥) */}
          <line x1="140" y1="64" x2="140" y2="85" className="stroke-rose-500 dark:stroke-rose-400 stroke-[2.5]" strokeLinecap="round" />
          <line x1="131" y1="85" x2="149" y2="85" className="stroke-rose-500 dark:stroke-rose-400 stroke-[2.5]" strokeLinecap="round" />

          {/* Bottom Half of Grid: 6 columns (stretched / expanded horizontally) */}
          {[-3, -2, -1, 1, 2, 3].map((col) => {
            return [96, 117, 138].map((rowY) => {
              // Deform atoms slightly outwards to accommodate tension
              const dx = col * 25.5;
              const xPos = 140 + dx;
              const colorClass = 'text-slate-500 dark:text-slate-400';
              return (
                <circle
                  key={`bot-${col}-${rowY}`}
                  cx={xPos}
                  cy={rowY}
                  r="4.5"
                  className={`${colorClass} stroke-white dark:stroke-slate-900 stroke-[1.2]`}
                  fill="url(#atom3DGlow)"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
                />
              );
            });
          })}

          {/* Atoms on the bottom center directly below defect (highly strained zone) */}
          {[96, 117, 138].map((rowY, idx) => (
            <circle
              key={`bot-center-${rowY}`}
              cx="140"
              cy={rowY}
              r="4.5"
              className="text-indigo-500 dark:text-indigo-400 stroke-white dark:stroke-slate-900 stroke-[1.2]"
              fill="url(#atom3DGlow)"
              style={{ filter: 'drop-shadow(0 0 5px rgba(99,102,241,0.5))' }}
            />
          ))}

          {/* Burgers Vector arrow highlight */}
          <g>
            <path d="M 124,148 L 156,148" className="stroke-indigo-600 dark:stroke-indigo-400 stroke-2 fill-none" markerEnd="url(#dislocationArrow)" />
            <text x="140" y="137" className="text-[9px] font-mono font-black fill-indigo-600 dark:fill-indigo-400 text-center" textAnchor="middle">
              Burgers Vector (b): {burgers.toFixed(4)} Å
            </text>
          </g>
        </svg>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mt-4 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 text-center">
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <div className="text-slate-400 text-[8px] uppercase tracking-wider mb-1">Dislocation Density</div>
          <span className="text-slate-700 dark:text-slate-200 font-extrabold text-xs">{density} m⁻²</span>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-2xl">
          <div className="text-slate-400 text-[8px] uppercase tracking-wider mb-1">Domain Size</div>
          <span className="text-slate-700 dark:text-slate-200 font-extrabold text-xs">{dSize} nm</span>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 4. LATTICE STRAIN COMPARATOR VISUALIZER
// ==========================================
interface LatticeStrainVisualizerProps {
  d0: number;
  d: number;
  strainPercent: number;
}

export const LatticeStrainVisualizer: React.FC<LatticeStrainVisualizerProps> = ({ d0, d, strainPercent }) => {
  const d0Val = d0 || 2.0;
  const dVal = d || 2.02;
  const percent = strainPercent || 0;

  const isTensile = percent > 0;
  const isZero = percent === 0;

  // Render a gorgeous 3x3 atom grid with elastic bonds that stretch/compress in real time
  const atomRadius = 5;
  const gridSpacing = 28;
  const centerShift = 45;

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center shadow-sm overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Lattice Strain Cell Distortion
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Atomic Bond Elongation & Peak Shifts
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-xl text-[9px] font-mono font-bold border ${
          isZero ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500' :
          isTensile ? 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-500' :
          'bg-cyan-50 border-cyan-100 dark:bg-cyan-950/20 dark:border-cyan-900/30 text-cyan-500'
        }`}>
          {isZero ? 'Relaxed state' : isTensile ? 'Tensile Lattice ε > 0' : 'Compressive Lattice ε < 0'}
        </span>
      </div>

      <div className="relative w-full h-44 bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl overflow-hidden flex items-center justify-around p-4 shadow-inner">
        
        {/* Left Side: Real-time 3x3 atomic grid simulation */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Atomic Grid Deformation</span>
          <svg width="100" height="100" className="overflow-visible">
            <defs>
              <radialGradient id="strainAtom" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="100%" stopColor="#1e293b" />
              </radialGradient>
            </defs>

            {/* Render atomic bond lines (spring/chemical bonds) */}
            {Array.from({ length: 3 }).map((_, rIdx) => {
              return Array.from({ length: 3 }).map((_, cIdx) => {
                const stretchFactor = 1 + percent / 100;
                const x = centerShift + (cIdx - 1) * gridSpacing * stretchFactor;
                const y = centerShift + (rIdx - 1) * gridSpacing * stretchFactor;

                const bonds = [];
                // Horizontal bond to next column
                if (cIdx < 2) {
                  const xNext = centerShift + (cIdx) * gridSpacing * stretchFactor;
                  bonds.push(
                    <line
                      key={`h-bond-${rIdx}-${cIdx}`}
                      x1={x}
                      y1={y}
                      x2={xNext}
                      y2={y}
                      className={`stroke-2 transition-colors ${
                        isZero ? 'stroke-slate-200 dark:stroke-slate-800' :
                        isTensile ? 'stroke-rose-400 dark:stroke-rose-500/80' : 'stroke-cyan-400 dark:stroke-cyan-500/80'
                      }`}
                    />
                  );
                }
                // Vertical bond to next row
                if (rIdx < 2) {
                  const yNext = centerShift + (rIdx) * gridSpacing * stretchFactor;
                  bonds.push(
                    <line
                      key={`v-bond-${rIdx}-${cIdx}`}
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={yNext}
                      className={`stroke-2 transition-colors ${
                        isZero ? 'stroke-slate-200 dark:stroke-slate-800' :
                        isTensile ? 'stroke-rose-400 dark:stroke-rose-500/80' : 'stroke-cyan-400 dark:stroke-cyan-500/80'
                      }`}
                    />
                  );
                }
                return bonds;
              });
            })}

            {/* Render 3x3 atom spheres */}
            {Array.from({ length: 3 }).map((_, rIdx) => {
              return Array.from({ length: 3 }).map((_, cIdx) => {
                const stretchFactor = 1 + percent / 100;
                const x = centerShift + (cIdx - 1) * gridSpacing * stretchFactor;
                const y = centerShift + (rIdx - 1) * gridSpacing * stretchFactor;
                
                const atomColor = isZero ? 'text-slate-400' : isTensile ? 'text-rose-500' : 'text-cyan-400';
                
                return (
                  <circle
                    key={`atom-${rIdx}-${cIdx}`}
                    cx={x}
                    cy={y}
                    r={atomRadius}
                    className={`${atomColor} stroke-white dark:stroke-slate-950 stroke-[1.2]`}
                    fill="url(#strainAtom)"
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}
                  />
                );
              });
            })}
          </svg>
        </div>

        {/* Action arrow spacer */}
        <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
          <ArrowRight className="w-5 h-5 animate-pulse" />
          <span className="text-[9px] font-extrabold font-mono text-slate-500 mt-1">
            {percent >= 0 ? '+' : ''}{percent.toFixed(3)}%
          </span>
        </div>

        {/* Right Side: Live peak Bragg 2-Theta shift graph */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Bragg Reflex Peak Shift</span>
          <svg width="100" height="70" className="overflow-visible bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg p-1.5">
            {/* Base line */}
            <line x1="10" y1="55" x2="90" y2="55" className="stroke-slate-200 dark:stroke-slate-800 stroke-[1.2]" />
            
            {/* Normal reference peak peak (grey dashed) */}
            <path d="M 15,55 L 42,55 Q 50,15 50,15 Q 50,15 58,55 L 85,55" className="stroke-slate-350 dark:stroke-slate-800 stroke-[1.2] fill-none stroke-dasharray-[2,2]" />
            
            {/* Live shifted peak curve */}
            {(() => {
              // Tensile shifts peak to lower angles (left), compression to higher angles (right)
              const shiftAmount = -percent * 2.5;
              const peakX = Math.max(25, Math.min(75, 50 + shiftAmount));
              const pathStr = `M 15,55 L ${peakX - 8},55 Q ${peakX},20 ${peakX},20 Q ${peakX},20 ${peakX + 8},55 L 85,55`;
              const peakColor = isZero ? 'stroke-slate-400' : isTensile ? 'stroke-rose-500' : 'stroke-cyan-500';
              const peakGlowColor = isZero ? 'rgba(148,163,184,0.1)' : isTensile ? 'rgba(244,63,94,0.15)' : 'rgba(6,182,212,0.15)';
              return (
                <g>
                  <path d={pathStr} className="stroke-[2.2] fill-none" stroke={isZero ? '#94a3b8' : isTensile ? '#f43f5e' : '#06b6d4'} strokeLinecap="round" />
                  <circle cx={peakX} cy="20" r="3" className={isZero ? 'fill-slate-500' : isTensile ? 'fill-rose-500 animate-pulse' : 'fill-cyan-500 animate-pulse'} />
                </g>
              );
            })()}

            <text x="50" y="65" className="text-[7px] font-bold font-mono fill-slate-400 text-center" textAnchor="middle">Reflection Angle (2θ)</text>
          </svg>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-3 text-center max-w-[280px] leading-normal">
        Tensile load shifts the lattice d-spacing from <span className="font-mono text-slate-700 dark:text-slate-300 font-black">{d0Val.toFixed(3)}Å</span> to <span className="font-mono text-slate-700 dark:text-slate-300 font-black">{dVal.toFixed(3)}Å</span>.
      </p>
    </div>
  );
};


// ==========================================
// 5. POROSITY COMPOSITE PHASE GRID VISUALIZER
// ==========================================
interface PorosityVisualizerProps {
  bulkDensity: number;
  trueDensity: number;
  porosityPercent: number;
}

export const PorosityVisualizer: React.FC<PorosityVisualizerProps> = ({ bulkDensity, trueDensity, porosityPercent }) => {
  const pVal = porosityPercent || 0;

  // Generate 8x8 block layout grid to visualize phase fraction
  const totalBlocks = 64;
  const poreBlocksCount = Math.round((pVal / 100) * totalBlocks);

  const blockArray = useMemo(() => {
    const arr = Array(totalBlocks).fill(false);
    let count = 0;
    for (let i = 0; i < totalBlocks; i++) {
      const idx = (i * 17) % totalBlocks;
      if (count < poreBlocksCount && !arr[idx]) {
        arr[idx] = true;
        count++;
      }
    }
    for (let i = 0; i < totalBlocks; i++) {
      if (count < poreBlocksCount && !arr[i]) {
        arr[i] = true;
        count++;
      }
    }
    return arr;
  }, [poreBlocksCount]);

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center shadow-sm overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Composite Phase Matrix representation
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Grain Microstructure vs Pore Defect Fractions
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
          Void Volume: {pVal.toFixed(1)}%
        </span>
      </div>

      <div className="relative w-full h-40 bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl flex items-center justify-around p-4 shadow-inner">
        <svg width="0" height="0" className="absolute">
          <defs>
            <radialGradient id="emerald3D" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </radialGradient>
            <radialGradient id="poreVoid3D" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
            </radialGradient>
          </defs>
        </svg>

        {/* Left Side: Microstructural Phase Grid */}
        <div className="grid grid-cols-8 gap-1 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-xl shadow-inner relative overflow-hidden">
          {blockArray.map((isPore, idx) => {
            if (isPore) {
              return (
                <div key={idx} className="w-3.5 h-3.5 relative flex items-center justify-center">
                  <svg 
                    viewBox="0 0 14 14"
                    className="w-full h-full rounded-full border border-orange-500/40"
                  >
                    <circle cx="7" cy="7" r="7" fill="url(#poreVoid3D)" />
                  </svg>
                  <span className="absolute w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping opacity-60"></span>
                </div>
              );
            }
            return (
              <svg 
                key={idx}
                viewBox="0 0 14 14"
                className="w-3.5 h-3.5 rounded-full shadow-md"
              >
                <circle cx="7" cy="7" r="7" fill="url(#emerald3D)" />
              </svg>
            );
          })}

          {/* Flow Line animation through pores */}
          {pVal > 15 && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full">
              <path 
                d="M 5,20 C 30,10 40,40 60,30 C 80,20 70,50 95,65" 
                className="stroke-amber-400 stroke-1.5 fill-none stroke-dasharray-[6,4]"
                style={{ animation: 'dash 1.5s linear infinite' }}
              />
              <style>{`
                @keyframes dash {
                  to {
                    stroke-dashoffset: -10;
                  }
                }
              `}</style>
            </svg>
          )}
        </div>

        {/* Right Side: Volumetric Densities gauges */}
        <div className="space-y-3.5 max-w-[130px]">
          <div>
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded bg-emerald-500"></span>Bulk Density (ρ_b)
            </div>
            <div className="text-sm font-mono font-black text-slate-800 dark:text-slate-200">
              {bulkDensity.toFixed(3)} <span className="text-[9px] font-sans text-slate-400 font-medium">g/cm³</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded border border-dashed border-orange-400"></span>Solid Matrix (ρ_t)
            </div>
            <div className="text-sm font-mono font-black text-slate-800 dark:text-slate-200">
              {trueDensity.toFixed(3)} <span className="text-[9px] font-sans text-slate-400 font-medium">g/cm³</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-between items-center mt-3 text-[9px] font-mono font-black text-slate-400 uppercase tracking-wide">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 rounded-full">
            <circle cx="5" cy="5" r="5" fill="url(#emerald3D)" />
          </svg>
          Solid Matrix Phase
        </div>
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 rounded-full border border-orange-500/60">
            <circle cx="5" cy="5" r="5" fill="url(#poreVoid3D)" />
          </svg>
          Void Pore Networks
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 6. MECHANICAL LOAD & SPECIMEN VISUALIZER
// ==========================================
interface MechanicalVisualizerProps {
  mode: string;
  force: number;
  area: number;
  stress: number;
  strain: number;
  poisson: number;
  crackLength?: number;
  fractureToughness?: number;
}

export const MechanicalVisualizer: React.FC<MechanicalVisualizerProps> = ({ 
  mode, force, area, stress, strain, poisson, crackLength, fractureToughness 
}) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center shadow-sm overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Mechanical stress & strain state
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {mode === 'solve_crack' || crackLength !== undefined ? 'Fracture Mechanics & Stress Concentration' : 'Uniaxial Tension & Elastic Deformation'}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-[9px] font-mono font-bold text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30">
          σ = {stress.toFixed(1)} MPa
        </span>
      </div>

      <div className="relative w-full h-44 bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl overflow-hidden flex items-center justify-center p-3 shadow-inner">
        
        {mode === 'solve_crack' || crackLength !== undefined ? (
          // FRACTURE PLATE: Realistic rainbow FEA (Finite Element Analysis) stress concentration
          <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
            <defs>
              {/* Concentric stress zones around crack tip */}
              <radialGradient id="stressCrimson" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="stressOrange" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="stressYellow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#eab308" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#eab308" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Base Specimen Plate */}
            <rect x="25" y="20" width="190" height="80" rx="6" className="fill-slate-100 dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-800/80 stroke" />

            {/* Tension load arrows */}
            <g className="stroke-rose-500 stroke-[1.5] fill-none" strokeLinecap="round">
              <path d="M 60,11 L 60,3" markerEnd="url(#dislocationArrow)" />
              <path d="M 120,11 L 120,3" markerEnd="url(#dislocationArrow)" className="stroke-2" />
              <path d="M 180,11 L 180,3" markerEnd="url(#dislocationArrow)" />

              <path d="M 60,109 L 60,117" markerEnd="url(#dislocationArrow)" />
              <path d="M 120,109 L 120,117" markerEnd="url(#dislocationArrow)" className="stroke-2" />
              <path d="M 180,109 L 180,117" markerEnd="url(#dislocationArrow)" />
            </g>
            <text x="120" y="11" className="text-[7px] font-black tracking-wider fill-rose-500 text-center" textAnchor="middle">FAR-FIELD TENSION LOAD (σ_0)</text>

            {/* FEA Stress Concentration bands radiating from both crack tips */}
            {/* Left tip: x=90, y=60 */}
            <circle cx="90" cy="60" r="28" fill="url(#stressYellow)" />
            <circle cx="90" cy="60" r="16" fill="url(#stressOrange)" />
            <circle cx="90" cy="60" r="7" fill="url(#stressCrimson)" />
            <circle cx="90" cy="60" r="2" className="fill-white animate-ping" />

            {/* Right tip: x=150, y=60 */}
            <circle cx="150" cy="60" r="28" fill="url(#stressYellow)" />
            <circle cx="150" cy="60" r="16" fill="url(#stressOrange)" />
            <circle cx="150" cy="60" r="7" fill="url(#stressCrimson)" />
            <circle cx="150" cy="60" r="2" className="fill-white animate-ping" />

            {/* Central Crack Split Line */}
            <line x1="90" y1="60" x2="150" y2="60" className="stroke-slate-900 dark:stroke-slate-100 stroke-[3.5]" strokeLinecap="round" />
            
            {/* Dimensions mapping lines */}
            <g className="stroke-slate-400 dark:stroke-slate-600 stroke-[1]">
              <line x1="90" y1="75" x2="150" y2="75" />
              <line x1="90" y1="72" x2="90" y2="78" />
              <line x1="150" y1="72" x2="150" y2="78" />
            </g>
            <text x="120" y="86" className="text-[8px] font-mono font-black fill-slate-500 dark:fill-slate-400 text-center" textAnchor="middle">
              Crack Length (2a) = {crackLength ? crackLength.toFixed(1) : '2.0'} mm
            </text>

            {/* Critical toughness overlay */}
            <rect x="75" y="42" width="90" height="15" rx="4" className="fill-slate-950/90 dark:fill-black/90 backdrop-blur-md stroke-slate-800" />
            <text x="120" y="52" className="text-[8.5px] font-mono font-black fill-amber-400 text-center" textAnchor="middle">
              K_1c = {fractureToughness ? fractureToughness.toFixed(3) : '35.40'} MPa·√m
            </text>
          </svg>
        ) : (
          // UNIAXIAL DOGBONE SPECIMEN: Stretches and shrinks based on real strain and necking (Poisson ratio)
          <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="neckingStress" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={Math.min(0.9, stress / 1200)} />
                <stop offset="70%" stopColor="#f97316" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Load Pull Arrows (Left & Right) */}
            <g className="stroke-indigo-500 stroke-2 fill-none" strokeLinecap="round">
              <path d="M 22,60 L 6,60" markerEnd="url(#dislocationArrow)" />
              <path d="M 218,60 L 234,60" markerEnd="url(#dislocationArrow)" />
            </g>
            <text x="12" y="52" className="text-[7.5px] font-black fill-indigo-500 uppercase tracking-wider">PULL (F)</text>
            <text x="228" y="52" className="text-[7.5px] font-black fill-indigo-500 uppercase tracking-wider text-right" textAnchor="end">PULL (F)</text>

            {/* Dogbone Specimen Path with necking math */}
            {(() => {
              const strVal = strain || 0;
              const poiVal = poisson || 0.3;
              
              // Elongation parameter
              const lenShift = Math.min(22, strVal * 100);
              
              // Transverse necking compression
              const neckYShift = Math.min(6, strVal * poiVal * 120);

              const leftX = 40 - lenShift;
              const rightX = 200 + lenShift;
              
              const upperYCenter = 38 + neckYShift;
              const lowerYCenter = 82 - neckYShift;

              return (
                <g>
                  {/* FEA Stress overlay at the necking region */}
                  <ellipse cx="120" cy="60" rx={24 + lenShift} ry={22 - neckYShift} fill="url(#neckingStress)" />

                  <path
                    d={`M ${leftX},30 L ${70 - lenShift / 2},30 
                        C ${90 - lenShift / 4},30 ${100 - lenShift / 6},${upperYCenter} 110,${upperYCenter} 
                        L 130,${upperYCenter} 
                        C ${140 + lenShift / 6},${upperYCenter} ${150 + lenShift / 4},30 ${170 + lenShift / 2},30 
                        L ${rightX},30 L ${rightX},90 L ${170 + lenShift / 2},90
                        C ${150 + lenShift / 4},90 ${140 + lenShift / 6},${lowerYCenter} 130,${lowerYCenter}
                        L 110,${lowerYCenter}
                        C ${100 - lenShift / 6},${lowerYCenter} ${90 - lenShift / 4},90 ${70 - lenShift / 2},90
                        L ${leftX},90 Z`}
                    className="fill-slate-100/10 dark:fill-slate-900/10 stroke-slate-400 dark:stroke-slate-600 stroke-[2] transition-all"
                  />
                </g>
              );
            })()}

            {/* Interactive labels inside SVG */}
            <g className="text-[8.5px] font-mono font-black text-center" transform="translate(120, 52)">
              <text textAnchor="middle" className="fill-slate-700 dark:fill-slate-200">Strain (ε) = {strain.toExponential(4)}</text>
              <text y="16" textAnchor="middle" className="fill-violet-500 dark:fill-violet-400 font-extrabold">Poisson Ratio (ν) = {poisson.toFixed(3)}</text>
            </g>
          </svg>
        )}

      </div>
    </div>
  );
};


// ==========================================
// 7. THERMO LEVER RULE & AVRAMI VISUALIZER
// ==========================================
interface ThermoVisualizerProps {
  mode: string; // 'lever' or 'avrami'
  cAlpha?: number;
  c0?: number;
  cBeta?: number;
  wAlpha?: number;
  wBeta?: number;
  avramiY?: number;
  avramiTime?: number;
}

export const ThermoVisualizer: React.FC<ThermoVisualizerProps> = ({
  mode, cAlpha, c0, cBeta, wAlpha, wBeta, avramiY, avramiTime
}) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center shadow-sm overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {mode === 'lever' ? 'Phase Diagram Lever Balance' : 'Phase Transformation Kinetics'}
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {mode === 'lever' ? 'Two-Phase Lever Rule Equilibrium' : 'Avrami Phase Solid-State Kinetics'}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
          {mode === 'lever' ? 'Lever Balance' : 'Avrami Growth'}
        </span>
      </div>

      <div className="relative w-full h-44 bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl overflow-hidden flex items-center justify-center p-3 shadow-inner">
        
        {mode === 'lever' ? (
          // Dynamic Lever Beam Balancer scale
          <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
            {(() => {
              const ca = cAlpha ?? 20;
              const cb = cBeta ?? 80;
              const c0Val = c0 ?? 45;
              const wa = wAlpha ?? 58.3;
              const wb = wBeta ?? 41.7;

              // Grid scale: map 0-100% composition to X: 30 to 210 on SVG
              const mapX = (comp: number) => {
                const bounded = Math.max(0, Math.min(100, comp));
                return 30 + (bounded / 100) * 180;
              };

              const xAlpha = mapX(ca);
              const xBeta = mapX(cb);
              const x0 = mapX(c0Val);

              // Weights size scaling
              const sizeWa = Math.max(10, Math.min(28, (wa / 100) * 24));
              const sizeWb = Math.max(10, Math.min(28, (wb / 100) * 24));

              return (
                <g>
                  {/* Lever beam background line */}
                  <line x1="25" y1="80" x2="215" y2="80" className="stroke-slate-200 dark:stroke-slate-800/80 stroke-[6]" strokeLinecap="round" />
                  {/* Composition Horizontal Line / Lever beam */}
                  <line x1="30" y1="80" x2="210" y2="80" className="stroke-slate-400 dark:stroke-slate-600 stroke-[2]" strokeLinecap="round" />
                  
                  {/* Scale labels */}
                  <text x="30" y="112" className="text-[7.5px] font-black font-mono fill-slate-400">0% Composition</text>
                  <text x="210" y="112" className="text-[7.5px] font-black font-mono fill-slate-400 text-right" textAnchor="end">100% Comp</text>

                  {/* Fulcrum Triangle at C0 */}
                  <polygon points={`${x0},80 ${x0 - 9},95 ${x0 + 9},95`} className="fill-slate-800 dark:fill-slate-100 stroke-slate-350 dark:stroke-slate-700 stroke-[1.5]" />
                  <circle cx={x0} cy="80" r="3.5" className="fill-amber-500 stroke-white dark:stroke-slate-900 stroke-1.5 animate-pulse" />
                  <text x={x0} y="106" className="text-[8.5px] font-black font-mono fill-amber-500 text-center" textAnchor="middle">C₀ = {c0Val}%</text>

                  {/* Phase Alpha Hanging Weight */}
                  <g>
                    {/* Hanging String */}
                    <line x1={xAlpha} y1="80" x2={xAlpha} y2="52" className="stroke-slate-400 dark:stroke-slate-600 stroke-[1.5]" />
                    <rect 
                      x={xAlpha - sizeWa / 2} 
                      y={52 - sizeWa} 
                      width={sizeWa} 
                      height={sizeWa} 
                      rx="3"
                      className="fill-indigo-500 dark:fill-indigo-400 stroke-white dark:stroke-slate-900 stroke-[1.5]" 
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(99,102,241,0.3))' }}
                    />
                    <text x={xAlpha} y="22" className="text-[8.5px] font-black fill-indigo-600 dark:fill-indigo-400 text-center" textAnchor="middle">
                      W_α = {wa.toFixed(1)}%
                    </text>
                    <text x={xAlpha} y="92" className="text-[7.5px] font-mono font-bold fill-slate-500 text-center" textAnchor="middle">
                      C_α={ca}%
                    </text>
                  </g>

                  {/* Phase Beta Hanging Weight */}
                  <g>
                    {/* Hanging String */}
                    <line x1={xBeta} y1="80" x2={xBeta} y2="52" className="stroke-slate-400 dark:stroke-slate-600 stroke-[1.5]" />
                    <rect 
                      x={xBeta - sizeWb / 2} 
                      y={52 - sizeWb} 
                      width={sizeWb} 
                      height={sizeWb} 
                      rx="3"
                      className="fill-fuchsia-500 dark:fill-fuchsia-400 stroke-white dark:stroke-slate-900 stroke-[1.5]" 
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(240,82,82,0.3))' }}
                    />
                    <text x={xBeta} y="22" className="text-[8.5px] font-black fill-fuchsia-600 dark:fill-fuchsia-400 text-center" textAnchor="middle">
                      W_β = {wb.toFixed(1)}%
                    </text>
                    <text x={xBeta} y="92" className="text-[7.5px] font-mono font-bold fill-slate-500 text-center" textAnchor="middle">
                      C_β={cb}%
                    </text>
                  </g>

                  {/* Lever brackets indicator showing the opposite arm mapping */}
                  <path d={`M ${xAlpha},70 L ${xAlpha},66 L ${x0},66 L ${x0},70`} className="stroke-indigo-400 dark:stroke-indigo-500/60 stroke-[1.2] fill-none" />
                  <text x={(xAlpha + x0)/2} y="62" className="text-[6.5px] font-black font-mono fill-indigo-600 dark:fill-indigo-400" textAnchor="middle">Beta Weight Proportion</text>

                  <path d={`M ${x0},70 L ${x0},66 L ${xBeta},66 L ${xBeta},70`} className="stroke-fuchsia-400 dark:stroke-fuchsia-500/60 stroke-[1.2] fill-none" />
                  <text x={(x0 + xBeta)/2} y="62" className="text-[6.5px] font-black font-mono fill-fuchsia-600 dark:fill-fuchsia-400" textAnchor="middle">Alpha Weight Proportion</text>
                </g>
              );
            })()}
          </svg>
        ) : (
          // Avrami transformed phase fraction growth visualizer
          <div className="w-full grid grid-cols-2 gap-4">
            {/* Left side transformation simulation cell */}
            <div className="relative w-full h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {/* Grain Boundaries background pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                <path d="M 0,40 L 40,20 L 80,50 L 120,30 L 160,70 L 160,120 L 110,120 L 70,80 L 0,80 Z" className="stroke-white stroke-1 fill-none" />
                <path d="M 40,20 L 60,0 M 80,50 L 90,0 M 120,30 L 140,0 M 70,80 L 40,120 M 0,80 L 0,120" className="stroke-white stroke-1 fill-none" />
              </svg>

              {/* Dynamic transformed phase circles growing inside the cell */}
              {(() => {
                const frac = (avramiY ?? 45) / 100; // 0 to 1
                const circleRadius = frac * 32; // maximum radius
                const opac = frac > 0.95 ? 0.9 : 0.45 + frac * 0.4;
                return (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                    <svg className="w-full h-full">
                      {/* Spawning nucleating centers */}
                      {[
                        { x: 25, y: 35 }, { x: 75, y: 25 }, { x: 125, y: 40 },
                        { x: 45, y: 85 }, { x: 105, y: 90 }, { x: 145, y: 75 }
                      ].map((center, idx) => (
                        <circle
                          key={idx}
                          cx={center.x}
                          cy={center.y}
                          r={Math.max(2, circleRadius)}
                          className={`${frac > 0.9 ? 'fill-emerald-500' : 'fill-emerald-400/40'} stroke-emerald-500 stroke-1.5 transition-all duration-500`}
                          style={{ fillOpacity: opac }}
                        />
                      ))}
                    </svg>
                  </div>
                );
              })()}

              {/* Dynamic text badge overlay */}
              <div className="absolute right-2 bottom-2 bg-slate-900/85 backdrop-blur px-2 py-0.5 rounded text-[8px] font-mono font-black text-emerald-400 border border-emerald-950/40">
                TRANSFORMED: {(avramiY ?? 0).toFixed(1)}%
              </div>
            </div>

            {/* Right side information */}
            <div className="flex flex-col justify-center space-y-2 text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Solid State Kinetics</span>
              <div className="text-[9px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                Avrami equation models <strong className="text-slate-800 dark:text-white">nucleation & impingement growth</strong> of recrystallization, phase changes, and solidification.
              </div>
              <div className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 w-fit">
                Y(t) = 1 - e^(-kt^n)
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};


// ==========================================
// 8. STEADY & NON-STEADY DIFFUSION VISUALIZER
// ==========================================
interface DiffusionVisualizerProps {
  mode: string; // 'fick1' or 'fick2'
  x1?: number;
  x2?: number;
  c1?: number;
  c2?: number;
  flux?: number;
  coef?: number;
  grad?: number;
  fick2Mode?: string;
  fick2Cs?: number;
  fick2C0?: number;
  fick2Cx?: number;
  fick2X?: number;
  fick2D?: number;
  fick2T?: number;
}

export const DiffusionVisualizer: React.FC<DiffusionVisualizerProps> = ({
  mode, x1, x2, c1, c2, flux, coef, grad,
  fick2Mode, fick2Cs, fick2C0, fick2Cx, fick2X, fick2D, fick2T
}) => {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center shadow-sm overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {mode === 'fick1' ? 'Steady-State Mass Flux Gradient (Fick I)' : 'Atomic Penetration Depth Curve (Fick II)'}
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {mode === 'fick1' ? 'Linear Concentration Profile & Flux' : 'Non-Steady State Complementary Error Function Profile'}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
          {mode === 'fick1' ? 'J = -D · dC/dx' : 'Non-Steady State'}
        </span>
      </div>

      <div className="relative w-full h-44 bg-slate-50/50 dark:bg-black/20 border border-slate-100 dark:border-slate-800/40 rounded-2xl overflow-hidden flex items-center justify-center p-3 shadow-inner">
        
        {mode === 'fick1' ? (
          // Fick's First Law (Linear profile across membrane)
          <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
            {(() => {
              const c1Val = c1 ?? 1.2;
              const c2Val = c2 ?? 0.2;
              const x1Val = x1 ?? 0;
              const x2Val = x2 ?? 2.0;
              
              const yC1 = 25; 
              const yC2 = 95; 

              // Draw linear concentration gradient slope
              return (
                <g>
                  {/* Membrane boundary solid layers */}
                  <rect x="44" y="20" width="12" height="85" rx="2" className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-200 dark:stroke-slate-700" />
                  <rect x="184" y="20" width="12" height="85" rx="2" className="fill-slate-100/80 dark:fill-slate-800/80 stroke-slate-200 dark:stroke-slate-700" />
                  
                  {/* Concentration Profile diagonal gradient line */}
                  <line x1="56" y1={yC1} x2="184" y2={yC2} className="stroke-indigo-500 stroke-3" strokeLinecap="round" />
                  
                  {/* Floating diffusing solute atoms */}
                  {[
                    { x: 70, y: 38 }, { x: 90, y: 50 }, { x: 110, y: 62 },
                    { x: 130, y: 72 }, { x: 150, y: 80 }, { x: 170, y: 88 }
                  ].map((atom, idx) => (
                    <motion.circle
                      key={idx}
                      cx={atom.x}
                      cy={atom.y}
                      r="4"
                      className="fill-indigo-500 stroke-white dark:stroke-slate-900 stroke-[1.2]"
                      style={{ filter: 'drop-shadow(0 1px 3px rgba(99,102,241,0.5))' }}
                      animate={{ x: [atom.x - 8, atom.x + 8] }}
                      transition={{ repeat: Infinity, duration: 1.8 + idx * 0.1, ease: 'easeInOut', repeatType: 'reverse' }}
                    />
                  ))}

                  {/* High concentration boundary */}
                  <circle cx="56" cy={yC1} r="5.5" className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-[1.5]" />
                  <text x="36" y="29" className="text-[8.5px] font-black fill-indigo-600 dark:fill-indigo-400 text-right animate-pulse" textAnchor="end">C₁ = {c1Val} kg/m³</text>
                  <text x="50" y="115" className="text-[7.5px] font-mono font-bold fill-slate-500 dark:fill-slate-400" textAnchor="middle">x₁ = {x1Val} mm</text>

                  {/* Low concentration boundary */}
                  <circle cx="184" cy={yC2} r="5.5" className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-[1.5]" />
                  <text x="204" y="99" className="text-[8.5px] font-black fill-indigo-600 dark:fill-indigo-400 text-left" textAnchor="start">C₂ = {c2Val} kg/m³</text>
                  <text x="190" y="115" className="text-[7.5px] font-mono font-bold fill-slate-500 dark:fill-slate-400" textAnchor="middle">x₂ = {x2Val} mm</text>

                  {/* Flux arrow indicator */}
                  <g>
                    <path d="M 100,12 L 140,12" className="stroke-emerald-500 stroke-2 fill-none" markerEnd="url(#dislocationArrow)" />
                    <text x="120" y="4" className="text-[8.5px] font-black fill-emerald-500 text-center uppercase tracking-wider" textAnchor="middle">Flux Direction (J) ➔</text>
                  </g>
                </g>
              );
            })()}
          </svg>
        ) : (
          // Fick's Second Law Carburization/Decarburization erfc curve
          <svg viewBox="0 0 240 125" className="w-full h-full overflow-visible">
            {(() => {
              const cs = fick2Cs ?? 1.2;
              const c0Val = fick2C0 ?? 0.2;
              const cx = fick2Cx ?? 0.6;
              const targetX = fick2X ?? 1.5;

              // Generate complementary error function plot
              const yCs = 25;
              const yC0 = 100;
              const curvePts = [];
              const startX = 40;
              const endX = 200;

              for (let x = startX; x <= endX; x++) {
                const normX = (x - startX) / (endX - startX); 
                const valY = yCs + (yC0 - yCs) * (1 - Math.exp(-normX * 2.8));
                curvePts.push(`${x},${valY}`);
              }
              const pathData = `M ${curvePts.join(' L ')}`;

              const visualPercent = Math.max(0.1, Math.min(0.9, (targetX / 3.0))); 
              const pointerX = startX + visualPercent * (endX - startX);
              const pointerY = yCs + (yC0 - yCs) * (1 - Math.exp(-visualPercent * 2.8));

              return (
                <g>
                  {/* Axis lines */}
                  <line x1="40" y1="20" x2="40" y2="105" className="stroke-slate-350 dark:stroke-slate-700 stroke-[1.2]" />
                  <line x1="40" y1="105" x2="210" y2="105" className="stroke-slate-350 dark:stroke-slate-700 stroke-[1.2]" />
                  
                  <text x="35" y="108" className="text-[7.5px] font-mono font-bold fill-slate-400" textAnchor="end">0</text>
                  <text x="210" y="115" className="text-[7.5px] font-mono font-bold fill-slate-400 text-right" textAnchor="end">Depth (x, mm)</text>

                  {/* Surface Conc line Cs */}
                  <line x1="36" y1={yCs} x2="200" y2={yCs} className="stroke-slate-300 dark:stroke-slate-800 stroke-dasharray-[3,2]" />
                  <text x="34" y="28" className="text-[8.5px] font-black fill-slate-500 text-end" textAnchor="end">C_s = {cs}%</text>

                  {/* Bulk Conc line C0 */}
                  <line x1="36" y1={yC0} x2="200" y2={yC0} className="stroke-slate-300 dark:stroke-slate-800 stroke-dasharray-[3,2]" />
                  <text x="34" y="103" className="text-[8.5px] font-bold fill-slate-500 text-end" textAnchor="end">C₀ = {c0Val}%</text>

                  {/* ERFC Concentration Profile Curve */}
                  <path d={pathData} className="stroke-orange-500 stroke-[2.5] fill-none" strokeLinecap="round" />

                  {/* Glowing intersection dot for user's selected depth */}
                  <circle cx={pointerX} cy={pointerY} r="5.5" className="fill-orange-500 stroke-white dark:stroke-slate-950 stroke-2" style={{ filter: 'drop-shadow(0 0 6px #f97316)' }} />
                  
                  {/* Pointer annotation lines */}
                  <line x1={pointerX} y1={pointerY} x2={pointerX} y2="105" className="stroke-orange-500/40 stroke-dasharray-[2,2] stroke-[1.2]" />
                  <line x1="40" y1={pointerY} x2={pointerX} y2={pointerY} className="stroke-orange-500/40 stroke-dasharray-[2,2] stroke-[1.2]" />

                  {/* Pointer values badges */}
                  <text x={pointerX} y="115" className="text-[8px] font-mono font-black fill-orange-500 text-center animate-pulse" textAnchor="middle">x = {targetX.toFixed(2)} mm</text>
                  <text x={pointerX + 8} y={pointerY - 6} className="text-[9px] font-black font-mono fill-orange-600 dark:fill-orange-400">C_x = {cx.toFixed(3)}%</text>
                </g>
              );
            })()}
          </svg>
        )}

      </div>
    </div>
  );
};
