import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, ArrowRight, Layers, HelpCircle } from 'lucide-react';

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
    return Math.max(2, Math.min(24, 8 / norm));
  }, [eVal]);

  // Determine wave color temperature based on energy
  // High energy = extreme UV/X-ray (deep violet/blue)
  // Low energy = infrared/visible/soft X-ray (cyan/green/amber)
  const waveColor = useMemo(() => {
    if (eVal > 15) return 'from-indigo-600 to-fuchsia-600 shadow-indigo-500/30';
    if (eVal > 8) return 'from-violet-500 to-indigo-500 shadow-violet-500/20';
    if (eVal > 4) return 'from-cyan-500 to-blue-500 shadow-cyan-500/20';
    return 'from-amber-500 to-rose-500 shadow-amber-500/20';
  }, [eVal]);

  // Generate sine wave points
  const points = useMemo(() => {
    const pts = [];
    const width = 320;
    const height = 80;
    const amplitude = 22;
    for (let x = 0; x <= width; x++) {
      const angle = (x / width) * freqFactor * Math.PI * 2;
      const y = height / 2 + Math.sin(angle) * amplitude;
      pts.push(`${x},${y}`);
    }
    return pts.join(' L ');
  }, [freqFactor]);

  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Dynamic Wave Spectrum Visualizer
        </span>
        <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400">
          f ∝ E
        </div>
      </div>

      <div className="relative w-full h-24 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
        {/* Animated Grid lines behind */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-[0.05] pointer-events-none">
          <div className="border-r border-b border-slate-800"></div>
          <div className="border-r border-b border-slate-800"></div>
          <div className="border-r border-b border-slate-800"></div>
          <div className="border-r border-b border-slate-800"></div>
          <div className="border-r border-b border-slate-800"></div>
          <div className="border-r border-b border-slate-800"></div>
        </div>

        {/* The Wave Path */}
        <svg width="100%" height="80" viewBox="0 0 320 80" className="overflow-visible">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className="stop-color-violet" stopColor={eVal > 10 ? '#8b5cf6' : '#06b6d4'} />
              <stop offset="50%" className="stop-color-fuchsia" stopColor={eVal > 12 ? '#d946ef' : '#3b82f6'} />
              <stop offset="100%" className="stop-color-pink" stopColor={eVal > 6 ? '#f43f5e' : '#10b981'} />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background thick glow path */}
          <motion.path
            d={`M 0,40 L ${points}`}
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="4"
            opacity="0.18"
            strokeLinecap="round"
            filter="url(#glow)"
            animate={{ strokeDashoffset: [0, -40] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 3 }}
          />

          {/* Primary sharp wave path */}
          <motion.path
            d={`M 0,40 L ${points}`}
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            animate={{ strokeDashoffset: [0, -40] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 3 }}
          />
        </svg>

        {/* Wavelength Indicator overlay */}
        <div className="absolute left-6 bottom-2 flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
          Wavelength λ = {wVal.toFixed(4)} Å
        </div>

        <div className="absolute right-6 top-2 flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
          Energy E = {eVal.toFixed(3)} keV
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mt-3 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 text-center">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Frequency Classification</div>
          <span className="text-slate-700 dark:text-slate-300">
            {eVal > 50 ? 'Hard X-Rays' : eVal > 2 ? 'Soft/Standard X-Rays' : 'Extreme UV / Soft'}
          </span>
        </div>
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Excitation Source</div>
          <span className="text-slate-700 dark:text-slate-300">
            {Math.abs(eVal - 8.048) < 0.2 ? 'Copper (Cu K-α)' : Math.abs(eVal - 17.479) < 0.4 ? 'Molybdenum (Mo K-α)' : Math.abs(eVal - 5.414) < 0.2 ? 'Chromium (Cr K-α)' : 'Synchrotron / Custom Tube'}
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

  // Isometric 3D projection parameters
  const project = (x: number, y: number, z: number) => {
    const originX = 110;
    const originY = 125;
    // Scale vectors based on unit cell parameters
    const sizeScale = 65;
    
    // Normalizing relative dimensions
    const maxParam = Math.max(a || 4.0, b || 4.0, c || 4.0) || 1;
    const normA = (a || 4.0) / maxParam;
    const normB = (b || 4.0) / maxParam;
    const normC = (c || 4.0) / maxParam;

    // x axis goes down-left (-120 deg)
    // y axis goes down-right (-30 deg)
    // z axis goes up (90 deg)
    const angleX = 210 * Math.PI / 180;
    const angleY = 330 * Math.PI / 180;

    const px = originX + 
               x * normA * sizeScale * Math.cos(angleX) + 
               y * normB * sizeScale * Math.cos(angleY);
    
    const py = originY - 
               z * normC * sizeScale - 
               x * normA * sizeScale * Math.sin(angleX) - 
               y * normB * sizeScale * Math.sin(angleY);

    return { x: px, y: py };
  };

  // Wireframe vertices
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
  }, [a, b, c]);

  // Determine Plane Polygon Vertices
  const planePoints = useMemo(() => {
    // Intercepts are 1/h, 1/k, 1/l
    const iX = hVal === 0 ? null : 1 / hVal;
    const iY = kVal === 0 ? null : 1 / kVal;
    const iZ = lVal === 0 ? null : 1 / lVal;

    // We can handle standard Miller cases elegantly:
    // (100) plane at x=1
    if (hVal === 1 && kVal === 0 && lVal === 0) {
      const p1 = project(1, 0, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(1, 1, 1);
      const p4 = project(1, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    // (010) plane at y=1
    if (hVal === 0 && kVal === 1 && lVal === 0) {
      const p1 = project(0, 1, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(1, 1, 1);
      const p4 = project(0, 1, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    // (001) plane at z=1
    if (hVal === 0 && kVal === 0 && lVal === 1) {
      const p1 = project(0, 0, 1);
      const p2 = project(1, 0, 1);
      const p3 = project(1, 1, 1);
      const p4 = project(0, 1, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    // (110) diagonal plane
    if (hVal === 1 && kVal === 1 && lVal === 0) {
      const p1 = project(1, 0, 0);
      const p2 = project(0, 1, 0);
      const p3 = project(0, 1, 1);
      const p4 = project(1, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    // (101) diagonal plane
    if (hVal === 1 && kVal === 0 && lVal === 1) {
      const p1 = project(1, 0, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(0, 1, 1);
      const p4 = project(0, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    // (011) diagonal plane
    if (hVal === 0 && kVal === 1 && lVal === 1) {
      const p1 = project(0, 1, 0);
      const p2 = project(1, 1, 0);
      const p3 = project(1, 0, 1);
      const p4 = project(0, 0, 1);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }

    // Default general case (all three intersect inside boundary, or handled symmetrically)
    const px = iX !== null ? Math.max(0, Math.min(1, iX)) : 1;
    const py = iY !== null ? Math.max(0, Math.min(1, iY)) : 1;
    const pz = iZ !== null ? Math.max(0, Math.min(1, iZ)) : 1;

    const ptA = project(px, 0, 0);
    const ptB = project(0, py, 0);
    const ptC = project(0, 0, pz);

    // If one intercept is null, draw parallel extension
    if (hVal === 0) { // parallel to x axis
      const p1 = project(0, py, 0);
      const p2 = project(1, py, 0);
      const p3 = project(1, 0, pz);
      const p4 = project(0, 0, pz);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (kVal === 0) { // parallel to y axis
      const p1 = project(px, 0, 0);
      const p2 = project(px, 1, 0);
      const p3 = project(0, 1, pz);
      const p4 = project(0, 0, pz);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }
    if (lVal === 0) { // parallel to z axis
      const p1 = project(px, 0, 0);
      const p2 = project(px, 0, 1);
      const p3 = project(0, py, 1);
      const p4 = project(0, py, 0);
      return `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;
    }

    return `${ptA.x},${ptA.y} ${ptB.x},${ptB.y} ${ptC.x},${ptC.y}`;
  }, [hVal, kVal, lVal, v]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Crystallographic Planar Shader</span>
      
      <div className="relative w-full max-w-[210px] h-48 flex items-center justify-center">
        <svg viewBox="0 0 220 180" className="w-full h-full overflow-visible">
          {/* Unit Cell Axes Labels */}
          <g className="text-[10px] font-black font-mono">
            {/* Origin */}
            <circle cx={v.v000.x} cy={v.v000.y} r="3" className="fill-slate-400 stroke-white dark:stroke-slate-900" />
            
            {/* a-axis line (down-left) */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v100.x + 15 * (v.v100.x - v.v000.x) / 50} y2={v.v100.y + 15 * (v.v100.y - v.v000.y) / 50} className="stroke-rose-400 stroke-1.5 stroke-dasharray-[2,2]" />
            <text x={v.v100.x - 14} y={v.v100.y + 14} className="fill-rose-500">x [a]</text>

            {/* b-axis line (down-right) */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v010.x + 15 * (v.v010.x - v.v000.x) / 50} y2={v.v010.y + 15 * (v.v010.y - v.v000.y) / 50} className="stroke-emerald-400 stroke-1.5 stroke-dasharray-[2,2]" />
            <text x={v.v010.x + 6} y={v.v010.y + 14} className="fill-emerald-500">y [b]</text>

            {/* c-axis line (up) */}
            <line x1={v.v000.x} y1={v.v000.y} x2={v.v001.x} y2={v.v001.y - 15} className="stroke-blue-400 stroke-1.5 stroke-dasharray-[2,2]" />
            <text x={v.v001.x - 4} y={v.v001.y - 10} className="fill-blue-500">z [c]</text>
          </g>

          {/* Wireframe Back Edges */}
          <path
            d={`M ${v.v010.x},${v.v010.y} L ${v.v110.x},${v.v110.y} L ${v.v100.x},${v.v100.y}
                M ${v.v011.x},${v.v011.y} L ${v.v111.x},${v.v111.y} L ${v.v101.x},${v.v101.y}
                M ${v.v110.x},${v.v110.y} L ${v.v111.x},${v.v111.y}`}
            className="stroke-slate-200 dark:stroke-slate-800 stroke-1"
            fill="none"
          />

          {/* Wireframe Front Edges */}
          <path
            d={`M ${v.v000.x},${v.v000.y} L ${v.v100.x},${v.v100.y} L ${v.v101.x},${v.v101.y} L ${v.v001.x},${v.v001.y} Z
                M ${v.v000.x},${v.v000.y} L ${v.v010.x},${v.v010.y} L ${v.v011.x},${v.v011.y} L ${v.v001.x},${v.v001.y} Z`}
            className="stroke-slate-350 dark:stroke-slate-750 stroke-1.5 fill-none"
          />

          {/* THE INTERSECTING MILLER PLANE (Shaded) */}
          {planePoints && (
            <polygon
              points={planePoints}
              className="fill-indigo-500/35 dark:fill-indigo-500/45 stroke-indigo-600 dark:stroke-indigo-400 stroke-2"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(99,102,241,0.15))' }}
            />
          )}

          {/* Plane Label inside SVG */}
          <rect x="5" y="5" width="48" height="18" rx="4" className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700 stroke" />
          <text x="10" y="17" className="text-[10px] font-mono font-bold fill-slate-700 dark:fill-slate-300">
            ({hVal} {kVal} {lVal})
          </text>
        </svg>
      </div>

      <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center max-w-[220px]">
        Glow highlight shows the custom plane intercept mapping in a {system} lattice cell space.
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
    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Dislocation Defect & Burgers Loop
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-150 dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">
          {system} Crystal
        </span>
      </div>

      <div className="relative w-full h-44 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 260 160" className="w-full h-full p-2 overflow-visible">
          <defs>
            <radialGradient id="stressGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#ef4444" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="tensionGrad" cx="50%" cy="65%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#2563eb" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Stress contour zones */}
          <circle cx="130" cy="55" r="45" fill="url(#stressGrad)" />
          <circle cx="130" cy="100" r="40" fill="url(#tensionGrad)" />

          {/* Compression & Tension indicators */}
          <text x="130" y="32" className="text-[8px] font-black font-sans fill-rose-600 dark:fill-rose-400 text-center opacity-85" textAnchor="middle">COMPRESSION</text>
          <text x="130" y="132" className="text-[8px] font-black font-sans fill-blue-600 dark:fill-blue-400 text-center opacity-85" textAnchor="middle">TENSION</text>

          {/* Slip Plane horizontal guideline */}
          <line x1="10" y1="80" x2="250" y2="80" className="stroke-slate-200 dark:stroke-slate-800 stroke-1 stroke-dasharray-[4,3]" />
          <text x="210" y="76" className="text-[8px] font-mono font-bold fill-slate-400">Slip Plane</text>

          {/* Lattice of Atoms with edge dislocation */}
          {/* Top Half of Grid: 8 columns squished */}
          {[-3, -2, -1, 0, 1, 2, 3].map((col) => {
            return [15, 35, 55].map((rowY, idx) => {
              // Deform atoms outward from the extra half plane
              let dx = col * 20;
              if (col < 0) dx -= Math.max(0, 10 - idx * 3);
              if (col > 0) dx += Math.max(0, 10 - idx * 3);
              const xPos = 130 + dx;
              return (
                <circle
                  key={`top-${col}-${rowY}`}
                  cx={xPos}
                  cy={rowY}
                  r="4"
                  className="fill-slate-600 dark:fill-slate-400 stroke-white dark:stroke-slate-900 stroke"
                />
              );
            });
          })}

          {/* EXTRA HALF-PLANE OF ATOMS (Dislocation core) */}
          {[15, 35, 55].map((rowY) => (
            <circle
              key={`extra-${rowY}`}
              cx="130"
              cy={rowY}
              r="4.5"
              className="fill-rose-500 stroke-white dark:stroke-slate-900 stroke-2 animate-pulse"
            />
          ))}
          {/* Dislocation core symbol ⊥ */}
          <line x1="130" y1="60" x2="130" y2="80" className="stroke-rose-500 stroke-2" />
          <line x1="122" y1="80" x2="138" y2="80" className="stroke-rose-500 stroke-2" />

          {/* Bottom Half of Grid: 7 columns (normal/spaced out) */}
          {[-3, -2, -1, 1, 2, 3].map((col) => {
            return [90, 110, 130].map((rowY) => {
              // Deform atoms inward
              const dx = col * 23;
              const xPos = 130 + dx;
              return (
                <circle
                  key={`bot-${col}-${rowY}`}
                  cx={xPos}
                  cy={rowY}
                  r="4"
                  className="fill-slate-600 dark:fill-slate-400 stroke-white dark:stroke-slate-900 stroke"
                />
              );
            });
          })}

          {/* Atoms on row bottom center directly below defect */}
          {[90, 110, 130].map((rowY) => (
            <circle
              key={`bot-center-${rowY}`}
              cx="130"
              cy={rowY}
              r="4"
              className="fill-indigo-400 dark:fill-indigo-500 stroke-white dark:stroke-slate-900 stroke"
            />
          ))}

          {/* Burgers Vector arrow highlight */}
          <g>
            {/* Arrow connecting the offset spacing gap */}
            <path d="M 120,143 L 140,143" className="stroke-violet-500 stroke-2 fill-none" markerEnd="url(#arrowhead)" />
            <text x="130" y="153" className="text-[9px] font-mono font-bold fill-violet-600 dark:fill-violet-400 text-center" textAnchor="middle">b = {burgers.toFixed(3)} Å</text>
          </g>
        </svg>
      </div>

      <div className="w-full grid grid-cols-2 gap-4 mt-3 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 text-center">
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Dislocation Density</div>
          <span className="text-slate-700 dark:text-slate-300 font-bold">{density} m⁻²</span>
        </div>
        <div className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
          <div className="text-slate-400 text-[8px] uppercase tracking-wider mb-0.5">Domain Size</div>
          <span className="text-slate-700 dark:text-slate-300 font-bold">{dSize} nm</span>
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

  // Visual size sizing
  const referenceSize = 70;
  // Scale the strained box
  const strainedSize = referenceSize * (1 + percent / 100);

  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Lattice Strain Cell Distortion
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
          isZero ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500' :
          isTensile ? 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-500' :
          'bg-cyan-50 border-cyan-100 dark:bg-cyan-950/20 dark:border-cyan-900/30 text-cyan-500'
        }`}>
          {isZero ? 'Pristine' : isTensile ? 'Tensile ε > 0' : 'Compressive ε < 0'}
        </span>
      </div>

      <div className="relative w-full h-36 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-around p-4">
        
        {/* Left Box: Reference Cell */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Pristine Reference (d₀)</span>
          <div className="relative flex items-center justify-center w-20 h-20">
            <div 
              style={{ width: `${referenceSize}px`, height: `${referenceSize}px` }}
              className="border-2 border-dashed border-slate-350 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400"
            >
              {d0Val.toFixed(3)}Å
            </div>
            {/* Center Atom */}
            <div className="absolute w-2 h-2 rounded-full bg-slate-400"></div>
          </div>
        </div>

        {/* Action arrow */}
        <div className="flex flex-col items-center text-slate-300 dark:text-slate-700">
          <ArrowRight className="w-5 h-5" />
          <span className="text-[8px] font-bold font-mono text-slate-400 mt-1">{percent >= 0 ? '+' : ''}{percent.toFixed(2)}%</span>
        </div>

        {/* Right Box: Strained Cell */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Strained Lattice (d)</span>
          <div className="relative flex items-center justify-center w-20 h-20">
            <motion.div 
              animate={{ 
                width: `${strainedSize}px`, 
                height: `${strainedSize}px`,
                borderColor: isZero ? '#64748b' : isTensile ? '#f43f5e' : '#06b6d4',
                backgroundColor: isZero ? 'rgba(100,116,139,0.03)' : isTensile ? 'rgba(244,63,94,0.06)' : 'rgba(6,182,212,0.06)'
              }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="border-2 rounded flex items-center justify-center text-[11px] font-mono font-black"
              style={{
                color: isZero ? '#475569' : isTensile ? '#ef4444' : '#0891b2'
              }}
            >
              {dVal.toFixed(3)}Å
            </motion.div>
            {/* Dynamic expanding/compressing arrows */}
            {!isZero && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {isTensile ? (
                  <div className="absolute w-[94%] h-[94%] border border-rose-500/30 rounded animate-ping"></div>
                ) : (
                  <div className="absolute w-[60%] h-[60%] border border-cyan-500/30 rounded animate-pulse"></div>
                )}
              </div>
            )}
            {/* Center Atom */}
            <div className={`absolute w-2.5 h-2.5 rounded-full ${isZero ? 'bg-slate-500' : isTensile ? 'bg-rose-500' : 'bg-cyan-500'}`}></div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2 text-center">
        Tensile strain shifts the Bragg peak 2θ to lower angles, while compression shifts it higher.
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
  // Number of pore blocks to show out of 64 total:
  const totalBlocks = 64;
  const poreBlocksCount = Math.round((pVal / 100) * totalBlocks);

  const blockArray = useMemo(() => {
    // Fill array randomly but deterministically
    const arr = Array(totalBlocks).fill(false);
    let count = 0;
    // Simple pseudo-random distribution
    for (let i = 0; i < totalBlocks; i++) {
      const idx = (i * 17) % totalBlocks;
      if (count < poreBlocksCount && !arr[idx]) {
        arr[idx] = true;
        count++;
      }
    }
    // Backup filler
    for (let i = 0; i < totalBlocks; i++) {
      if (count < poreBlocksCount && !arr[i]) {
        arr[i] = true;
        count++;
      }
    }
    return arr;
  }, [poreBlocksCount]);

  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Composite Phase Matrix Representation
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
          Pore Vol: {pVal.toFixed(1)}%
        </span>
      </div>

      <div className="relative w-full h-36 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl flex items-center justify-around p-4">
        
        {/* Left Side: Solid vs Pore fraction grid */}
        <div className="grid grid-cols-8 gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
          {blockArray.map((isPore, idx) => (
            <div 
              key={idx}
              className={`w-2.5 h-2.5 rounded-sm transition-all duration-500 ${
                isPore 
                  ? 'bg-transparent border border-dashed border-rose-400/80 dark:border-rose-500/60 shadow-[0_0_4px_rgba(239,68,68,0.1)]' 
                  : 'bg-emerald-600 dark:bg-emerald-500 shadow-sm'
              }`}
            />
          ))}
        </div>

        {/* Right Side: Densities indicator info */}
        <div className="space-y-2 max-w-[120px]">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">Bulk Density</div>
          <div className="text-sm font-mono font-black text-slate-700 dark:text-slate-300">
            {bulkDensity.toFixed(2)} <span className="text-[9px] font-sans text-slate-400 font-normal">g/cm³</span>
          </div>

          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 pt-1">Solid Skeleton</div>
          <div className="text-sm font-mono font-black text-slate-700 dark:text-slate-300">
            {trueDensity.toFixed(2)} <span className="text-[9px] font-sans text-slate-400 font-normal">g/cm³</span>
          </div>
        </div>

      </div>

      <div className="w-full flex justify-between items-center mt-3 text-[9px] font-mono font-bold text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-600 dark:bg-emerald-500"></span>
          Solid Crystalline Phase
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-dashed border-rose-400"></span>
          Open/Closed Pore Voids
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
    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Mechanical Stress & Strain State
        </span>
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
          σ = {stress.toFixed(1)} MPa
        </span>
      </div>

      <div className="relative w-full h-40 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-3">
        
        {mode === 'solve_crack' || crackLength !== undefined ? (
          // Fracture plate with center crack tip stress concentration
          <svg viewBox="0 0 240 120" className="w-full h-full">
            <defs>
              <radialGradient id="stressCrackTip" cx="50%" cy="50%" r="40%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Gray Metal Plate block */}
            <rect x="30" y="20" width="180" height="80" rx="4" className="fill-slate-100 dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-850" />

            {/* Tension Arrows pointing outward on top and bottom */}
            <path d="M 60,10 L 60,3" className="stroke-rose-500 stroke-1.5 fill-none" markerEnd="url(#arrowhead)" />
            <path d="M 120,10 L 120,3" className="stroke-rose-500 stroke-2 fill-none" markerEnd="url(#arrowhead)" />
            <path d="M 180,10 L 180,3" className="stroke-rose-500 stroke-1.5 fill-none" markerEnd="url(#arrowhead)" />

            <path d="M 60,110 L 60,117" className="stroke-rose-500 stroke-1.5 fill-none" markerEnd="url(#arrowhead)" />
            <path d="M 120,110 L 120,117" className="stroke-rose-500 stroke-2 fill-none" markerEnd="url(#arrowhead)" />
            <path d="M 180,110 L 180,117" className="stroke-rose-500 stroke-1.5 fill-none" markerEnd="url(#arrowhead)" />
            <text x="120" y="11" className="text-[7px] font-black font-sans fill-rose-500 text-center" textAnchor="middle">APPLIED LOAD σ</text>

            {/* Crack Geometry */}
            {/* Center notch crack of length a */}
            <line x1="90" y1="60" x2="150" y2="60" className="stroke-red-600 stroke-3" strokeLinecap="round" />
            <circle cx="90" cy="60" r="1.5" className="fill-red-600" />
            <circle cx="150" cy="60" r="1.5" className="fill-red-600" />

            {/* Stress hot zones at the crack tips */}
            <circle cx="90" cy="60" r="18" fill="url(#stressCrackTip)" />
            <circle cx="150" cy="60" r="18" fill="url(#stressCrackTip)" />

            {/* Dimensions notation line */}
            <line x1="90" y1="75" x2="150" y2="75" className="stroke-slate-400 stroke" />
            <line x1="90" y1="72" x2="90" y2="78" className="stroke-slate-400 stroke" />
            <line x1="150" y1="72" x2="150" y2="78" className="stroke-slate-400 stroke" />
            <text x="120" y="86" className="text-[8px] font-mono font-bold fill-slate-500 text-center" textAnchor="middle">Crack size: 2a = {crackLength ? crackLength.toFixed(1) : '2'} mm</text>

            {/* Fracture toughness text */}
            <text x="120" y="50" className="text-[8px] font-black fill-slate-700 dark:fill-slate-300 text-center" textAnchor="middle">
              K₁c = {fractureToughness ? fractureToughness.toFixed(2) : '35.4'} MPa·√m
            </text>
          </svg>
        ) : (
          // Tensile dogbone specimen stretching animation
          <svg viewBox="0 0 240 120" className="w-full h-full">
            <defs>
              <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="2" refY="2" orient="auto">
                <polygon points="0,0 5,2.5 0,5" className="fill-indigo-500" />
              </marker>
            </defs>

            {/* Load Pull direction arrows (Left & Right) */}
            <line x1="15" y1="60" x2="35" y2="60" className="stroke-indigo-500 stroke-2" />
            <path d="M 15,60 L 5,60" className="stroke-indigo-500 stroke-2 fill-none" markerEnd="url(#arrowhead)" />
            <text x="10" y="52" className="text-[8px] font-black fill-indigo-500">LOAD (F)</text>

            <line x1="225" y1="60" x2="205" y2="60" className="stroke-indigo-500 stroke-2" />
            <path d="M 225,60 L 235,60" className="stroke-indigo-500 stroke-2 fill-none" markerEnd="url(#arrowhead)" />

            {/* Dogbone specimen structure */}
            {/* Adapts width necking based on poisson and stress */}
            <path
              d={`M 40,30 L 70,30 
                  C 90,30 100,38 110,38 
                  L 130,38 
                  C 140,38 150,30 170,30 
                  L 200,30 L 200,90 L 170,90
                  C 150,90 140,82 130,82
                  L 110,82
                  C 100,82 90,90 70,90
                  L 40,90 Z`}
              className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700 stroke-2"
            />

            {/* Elongation / necking indicators */}
            <g className="text-[8px] font-mono font-bold fill-indigo-500 text-center">
              <text x="120" y="52" textAnchor="middle">Strain (ε) = {strain.toFixed(4)}</text>
              <text x="120" y="72" className="fill-violet-400" textAnchor="middle">Poisson's ν = {poisson.toFixed(3)}</text>
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
    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {mode === 'lever' ? 'Phase Diagram Lever Balance' : 'Phase Transformation Kinetics'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-[9px] font-mono font-bold text-violet-600 dark:text-violet-400">
          {mode === 'lever' ? 'Lever Rule' : 'Avrami Growth'}
        </span>
      </div>

      <div className="relative w-full h-40 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-3">
        
        {mode === 'lever' ? (
          // Dynamic Lever Beam Balancer scale
          <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
            {/* Fulcrum (C0 location) in coordinate space */}
            {/* Normalize inputs between 0 and 100 */}
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
              const sizeWa = Math.max(8, Math.min(30, (wa / 100) * 26));
              const sizeWb = Math.max(8, Math.min(30, (wb / 100) * 26));

              // Slopes: lever rule states that the side opposite is the weight
              // If C0 is close to Alpha, Alpha fraction is large.
              return (
                <g>
                  {/* Composition Horizontal Line / Lever beam */}
                  <line x1="30" y1="80" x2="210" y2="80" className="stroke-slate-300 dark:stroke-slate-700 stroke-4" strokeLinecap="round" />
                  
                  {/* Scale labels */}
                  <text x="30" y="93" className="text-[7px] font-black font-sans fill-slate-400">0%</text>
                  <text x="210" y="93" className="text-[7px] font-black font-sans fill-slate-400 text-right" textAnchor="end">100%</text>

                  {/* Fulcrum Triangle at C0 */}
                  <polygon points={`${x0},80 ${x0 - 8},94 ${x0 + 8},94`} className="fill-slate-850 dark:fill-white stroke-none" />
                  <circle cx={x0} cy="80" r="3" className="fill-violet-500" />
                  <text x={x0} y="105" className="text-[8px] font-black font-mono fill-violet-600 dark:fill-violet-400 text-center" textAnchor="middle">C₀ = {c0Val}%</text>

                  {/* Phase Alpha Hanging Weight */}
                  <g>
                    <line x1={xAlpha} y1="80" x2={xAlpha} y2="50" className="stroke-slate-400 stroke-1.5" />
                    <rect 
                      x={xAlpha - sizeWa / 2} 
                      y={50 - sizeWa} 
                      width={sizeWa} 
                      height={sizeWa} 
                      rx="2"
                      className="fill-indigo-500/80 stroke-indigo-600 stroke" 
                    />
                    <text x={xAlpha} y="30" className="text-[8px] font-black fill-indigo-600 dark:fill-indigo-400 text-center" textAnchor="middle">
                      W_α = {wa.toFixed(0)}%
                    </text>
                    <text x={xAlpha} y="93" className="text-[7px] font-mono fill-slate-400 text-center" textAnchor="middle">
                      C_α={ca}%
                    </text>
                  </g>

                  {/* Phase Beta Hanging Weight */}
                  <g>
                    <line x1={xBeta} y1="80" x2={xBeta} y2="50" className="stroke-slate-400 stroke-1.5" />
                    <rect 
                      x={xBeta - sizeWb / 2} 
                      y={50 - sizeWb} 
                      width={sizeWb} 
                      height={sizeWb} 
                      rx="2"
                      className="fill-fuchsia-500/80 stroke-fuchsia-600 stroke" 
                    />
                    <text x={xBeta} y="30" className="text-[8px] font-black fill-fuchsia-600 dark:fill-fuchsia-400 text-center" textAnchor="middle">
                      W_β = {wb.toFixed(0)}%
                    </text>
                    <text x={xBeta} y="93" className="text-[7px] font-mono fill-slate-400 text-center" textAnchor="middle">
                      C_β={cb}%
                    </text>
                  </g>

                  {/* Lever brackets indicator */}
                  <path d={`M ${xAlpha},72 L ${xAlpha},68 L ${x0},68 L ${x0},72`} className="stroke-indigo-400 stroke-1 fill-none" />
                  <text x={(xAlpha + x0)/2} y="64" className="text-[6px] font-black font-mono fill-indigo-500" textAnchor="middle">Beta Arm</text>

                  <path d={`M ${x0},72 L ${x0},68 L ${xBeta},68 L ${xBeta},72`} className="stroke-fuchsia-400 stroke-1 fill-none" />
                  <text x={(x0 + xBeta)/2} y="64" className="text-[6px] font-black font-mono fill-fuchsia-500" textAnchor="middle">Alpha Arm</text>
                </g>
              );
            })()}
          </svg>
        ) : (
          // Avrami transformed phase fraction growth visualizer
          <div className="w-full grid grid-cols-2 gap-4">
            {/* Left side transformation simulation cell */}
            <div className="relative w-full h-32 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
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
              <div className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 w-fit">
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
    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-3xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {mode === 'fick1' ? 'Steady-State Mass Flux Gradient (Fick I)' : 'Atomic Penetration Depth Curve (Fick II)'}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
          {mode === 'fick1' ? 'J = -D · dC/dx' : 'Non-Steady State'}
        </span>
      </div>

      <div className="relative w-full h-44 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-3">
        
        {mode === 'fick1' ? (
          // Fick's First Law (Linear profile across membrane)
          <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
            {(() => {
              const c1Val = c1 ?? 1.2;
              const c2Val = c2 ?? 0.2;
              const x1Val = x1 ?? 0;
              const x2Val = x2 ?? 2.0;
              
              // Map concentration: C1 (high) on left, C2 (low) on right
              // Left X: 50, Right X: 190. Height Y: 20 (high) to 100 (low)
              const yC1 = 25; // high conc visual top
              const yC2 = 95; // low conc visual bottom

              // Draw linear concentration gradient slope
              return (
                <g>
                  {/* Membranes boundary blocks */}
                  <rect x="44" y="20" width="12" height="85" className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700" />
                  <rect x="184" y="20" width="12" height="85" className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700" />
                  
                  {/* Concentration Profile diagonal line */}
                  <line x1="56" y1={yC1} x2="184" y2={yC2} className="stroke-indigo-500 stroke-3" />
                  
                  {/* Floating diffusion atoms inside slope */}
                  {[
                    { x: 70, y: 38 }, { x: 90, y: 50 }, { x: 110, y: 62 },
                    { x: 130, y: 72 }, { x: 150, y: 80 }, { x: 170, y: 88 }
                  ].map((atom, idx) => (
                    <motion.circle
                      key={idx}
                      cx={atom.x}
                      cy={atom.y}
                      r="3.5"
                      className="fill-indigo-400 stroke-white dark:stroke-slate-900 stroke"
                      animate={{ x: [atom.x - 10, atom.x + 10] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    />
                  ))}

                  {/* Left High Conc Circle */}
                  <circle cx="56" cy={yC1} r="5" className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-1.5" />
                  <text x="36" y="29" className="text-[8px] font-black fill-indigo-600 dark:fill-indigo-400 text-right" textAnchor="end">C₁ = {c1Val} kg/m³</text>
                  <text x="50" y="115" className="text-[7px] font-mono fill-slate-400" textAnchor="middle">x₁ = {x1Val} mm</text>

                  {/* Right Low Conc Circle */}
                  <circle cx="184" cy={yC2} r="5" className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-1.5" />
                  <text x="204" y="99" className="text-[8px] font-black fill-indigo-600 dark:fill-indigo-400 text-left" textAnchor="start">C₂ = {c2Val} kg/m³</text>
                  <text x="190" y="115" className="text-[7px] font-mono fill-slate-400" textAnchor="middle">x₂ = {x2Val} mm</text>

                  {/* Flux arrow overlay */}
                  <g>
                    <path d="M 100,10 L 140,10" className="stroke-emerald-500 stroke-2 fill-none" markerEnd="url(#arrowhead)" />
                    <text x="120" y="2" className="text-[8px] font-black fill-emerald-500 text-center" textAnchor="middle">Mass Flux (J) ➔</text>
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
              // erfc(z) profile curve falling from Cs on left to C0 asymptotically on right
              // We'll plot X: 40 to 200, Y: 20 (Cs) to 100 (C0)
              const yCs = 25;
              const yC0 = 100;
              const curvePts = [];
              const startX = 40;
              const endX = 200;

              // erfc approximation curve
              for (let x = startX; x <= endX; x++) {
                const normX = (x - startX) / (endX - startX); // 0 to 1
                // Profile curve representing erfc shape
                const valY = yCs + (yC0 - yCs) * (1 - Math.exp(-normX * 2.8));
                curvePts.push(`${x},${valY}`);
              }
              const pathData = `M ${curvePts.join(' L ')}`;

              // Map current depth dot on the curve
              // Clamp visual pointer nicely inside bounds
              const visualPercent = Math.max(0.1, Math.min(0.9, (targetX / 3.0))); // Assume 3.0mm is max scale
              const pointerX = startX + visualPercent * (endX - startX);
              const pointerY = yCs + (yC0 - yCs) * (1 - Math.exp(-visualPercent * 2.8));

              return (
                <g>
                  {/* Axis lines */}
                  <line x1="40" y1="20" x2="40" y2="105" className="stroke-slate-300 dark:stroke-slate-700 stroke" />
                  <line x1="40" y1="105" x2="210" y2="105" className="stroke-slate-300 dark:stroke-slate-700 stroke" />
                  
                  <text x="35" y="108" className="text-[7px] font-mono fill-slate-400" textAnchor="end">0</text>
                  <text x="210" y="115" className="text-[7px] font-mono fill-slate-400 text-right" textAnchor="end">Depth (x, mm)</text>

                  {/* Surface Conc line Cs */}
                  <line x1="36" y1={yCs} x2="200" y2={yCs} className="stroke-slate-200 dark:stroke-slate-800 stroke-dasharray-[3,2]" />
                  <text x="34" y="28" className="text-[8px] font-black fill-slate-500 text-end" textAnchor="end">C_s = {cs}%</text>

                  {/* Bulk Conc line C0 */}
                  <line x1="36" y1={yC0} x2="200" y2={yC0} className="stroke-slate-200 dark:stroke-slate-800 stroke-dasharray-[3,2]" />
                  <text x="34" y="103" className="text-[8px] font-bold fill-slate-500 text-end" textAnchor="end">C₀ = {c0Val}%</text>

                  {/* ERFC Concentration Profile Curve */}
                  <path d={pathData} className="stroke-orange-500 stroke-2.5 fill-none" />

                  {/* Glowing intersection dot for user's selected depth */}
                  <circle cx={pointerX} cy={pointerY} r="5" className="fill-orange-500 stroke-white dark:stroke-slate-900 stroke-2 animate-pulse" />
                  
                  {/* Pointer annotation lines */}
                  <line x1={pointerX} y1={pointerY} x2={pointerX} y2="105" className="stroke-orange-500/40 stroke-dasharray-[2,2]" />
                  <line x1="40" y1={pointerY} x2={pointerX} y2={pointerY} className="stroke-orange-500/40 stroke-dasharray-[2,2]" />

                  {/* Pointer values badges */}
                  <text x={pointerX} y="115" className="text-[7.5px] font-mono font-black fill-orange-500 text-center" textAnchor="middle">x = {targetX.toFixed(2)} mm</text>
                  <text x={pointerX + 6} y={pointerY - 6} className="text-[8.5px] font-black font-mono fill-orange-600 dark:fill-orange-400">C_x = {cx.toFixed(3)}%</text>
                </g>
              );
            })()}
          </svg>
        )}

      </div>
    </div>
  );
};
