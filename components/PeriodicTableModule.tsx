import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, Sparkles, Activity, Layers, Compass, Play, Search, 
  HelpCircle, Orbit, RotateCw, Settings, ShieldAlert, Zap, Cpu
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Legend, Tooltip as RechartsTooltip
} from 'recharts';
import { playSynthTone } from '../utils/sound';
import { getFactualProperties, getElectronConfig, ScientificProperties } from './ChemicalPhysicalPropertiesDb';

export interface FamousCompound {
  formula: string;
  name: string;
  crystalSystem: string;
  spaceGroup: string;
  latticeParams: { a: number; b?: number; c?: number; alpha?: number; beta?: number; gamma?: number };
  typicalPeaks: { twoTheta: number; intensity: number }[];
  relevance: string;
  shortDesc: string;
}

export interface CrystalElement extends ScientificProperties {
  number: number;
  symbol: string;
  name: string;
  weight: number;
  category: 'alkali' | 'alkaline_earth' | 'transition_metal' | 'post_transition' | 'metalloid' | 'nonmetal' | 'noble_gas' | 'lanthanoid' | 'actinoid';
  gridX: number;
  gridY: number;
  crystalStructure: 'BCC' | 'FCC' | 'HCP' | 'Diamond' | 'Cubic' | 'Hexagonal' | 'Orthorhombic' | 'Rhombohedral' | 'Tetragonal' | 'Monoclinic' | 'Amorphous';
  spaceGroup: string;
  a: number; // Å
  b?: number;
  c?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  density: number; // g/cm³
  meltingPoint: number; // °C
  electronConfig: string;
  famousCompounds: FamousCompound[];
}

interface PeriodicTableModuleProps {
  onLoadPeaks?: (peaksStr: string, hklStr: string, matName: string) => void;
}

export const isCrystalMaterial = (number: number): boolean => {
  // Gases: H (1), He (2), N (7), O (8), F (9), Ne (10), Cl (17), Ar (18), Kr (36), Xe (54)
  // Liquids: Br (35), Hg (80)
  const nonCrystalNumbers = [1, 2, 7, 8, 9, 10, 17, 18, 35, 36, 54, 80];
  return !nonCrystalNumbers.includes(number);
};

export const getPhysicalStateLabel = (number: number): string => {
  if (number === 35 || number === 80) return 'LIQ';
  if ([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86].includes(number)) return 'GAS';
  return 'SOLID';
};

export const getPhysicalStateAtTemp = (number: number, meltingPoint: number, boilingPoint: number | undefined, currentTemperatureCelcius: number): 'solid' | 'liquid' | 'gas' | 'unknown' => {
  if (meltingPoint === undefined || isNaN(meltingPoint)) return 'unknown';
  
  if (currentTemperatureCelcius < meltingPoint) return 'solid';
  
  // If we don't have boiling point but we know it's above melting point
  if (boilingPoint === undefined || isNaN(boilingPoint)) {
    if (number === 35 && currentTemperatureCelcius >= 58.8) return 'gas'; // Br
    if (number === 80 && currentTemperatureCelcius >= 356.7) return 'gas'; // Hg
    // Helium special case (mp is at high pressure, normally it doesn't freeze at 1atm)
    if (number === 2 && currentTemperatureCelcius >= -268.9) return 'gas';
    return 'liquid'; 
  }
  
  if (currentTemperatureCelcius >= boilingPoint) return 'gas';
  return 'liquid';
};

// 3D Point presentation format helper
interface Point3D {
  x: number;
  y: number;
  z: number;
  id?: string;
}

// Projected 2D Point style helper
interface Point2D {
  x: number;
  y: number;
  zDepth: number;
  id?: string;
}

/* =========================================================================
   CrystallineLattice3D: Interactive Unit Cell projection engine
   ========================================================================= */
const CrystallineLattice3D: React.FC<{ 
  structure: CrystalElement['crystalStructure'];
  a: number;
  b?: number;
  c?: number;
  colorClass: string;
}> = ({ structure, a, b, c, colorClass }) => {
  const [yaw, setYaw] = useState<number>(35);
  const [pitch, setPitch] = useState<number>(-20);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [selectedAtom, setSelectedAtom] = useState<string | null>(null);
  const requestRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);

  // Proportional dimensional scale bounding factors
  const la = 75;
  const lb = b ? (b / a) * 75 : 75;
  const lc = c ? (c / a) * 75 : 75;

  // Scale bounds to fits inside SVG viewport nicely
  const maxSide = Math.max(la, lb, lc);
  const scaleNorm = 70 / maxSide;
  const sa = la * scaleNorm;
  const sb = lb * scaleNorm;
  const sc = lc * scaleNorm;

  // Generate wireframe box vectors mapped relative to cell metrics center
  const boxVertices = useMemo<Point3D[]>(() => {
    const ox = -sa / 2;
    const oy = -sb / 2;
    const oz = -sc / 2;
    return [
      { x: ox, y: oy, z: oz },          // 0
      { x: ox + sa, y: oy, z: oz },     // 1
      { x: ox + sa, y: oy + sb, z: oz },// 2
      { x: ox, y: oy + sb, z: oz },     // 3
      { x: ox, y: oy, z: oz + sc },     // 4
      { x: ox + sa, y: oy, z: oz + sc },// 5
      { x: ox + sa, y: oy + sb, z: oz + sc }, // 6
      { x: ox, y: oy + sb, z: oz + sc }  // 7
    ];
  }, [sa, sb, sc]);

  // Generate atomic nodes basis on atomic Bravais lattice classification
  const atoms = useMemo<Point3D[]>(() => {
    const ox = -sa / 2;
    const oy = -sb / 2;
    const oz = -sc / 2;
    const list: Point3D[] = [];

    // All Bravais cell states start with corners populated
    boxVertices.forEach((v, index) => {
      list.push({ ...v, id: `Corner-${index + 1}` });
    });

    if (structure === 'BCC') {
      // Body Center atoms
      list.push({ x: 0, y: 0, z: 0, id: 'Body-Center' });
    } else if (structure === 'FCC') {
      // 6 Face center coordinates
      list.push({ x: 0, y: 0, z: oz, id: 'Face-Bottom' });
      list.push({ x: 0, y: 0, z: -oz, id: 'Face-Top' });
      list.push({ x: ox, y: 0, z: 0, id: 'Face-Left' });
      list.push({ x: -ox, y: 0, z: 0, id: 'Face-Right' });
      list.push({ x: 0, y: oy, z: 0, id: 'Face-Front' });
      list.push({ x: 0, y: -oy, z: 0, id: 'Face-Back' });
    } else if (structure === 'Diamond') {
      // 4 Internal coordinates
      list.push({ x: ox + sa / 4, y: oy + sb / 4, z: oz + sc / 4, id: 'Diamond-Int-1' });
      list.push({ x: ox + (3 * sa) / 4, y: oy + (3 * sb) / 4, z: oz + sc / 4, id: 'Diamond-Int-2' });
      list.push({ x: ox + sa / 4, y: oy + (3 * sb) / 4, z: oz + (3 * sc) / 4, id: 'Diamond-Int-3' });
      list.push({ x: ox + (3 * sa) / 4, y: oy + sb / 4, z: oz + (3 * sc) / 4, id: 'Diamond-Int-4' });
    } else if (structure === 'HCP') {
      // Hexagonal bases projection (HCP specialized points)
      list.length = 0; // Overwrite default corners for beautiful explicit prism rendering
      const r = sa * 0.7;
      // Bottom Base Hex
      for (let i = 0; i < 6; i++) {
        const theta = (i * 60 * Math.PI) / 180;
        list.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: oz, id: `Hex-Bottom-${i + 1}` });
      }
      list.push({ x: 0, y: 0, z: oz, id: 'Hex-Bottom-Center' });

      // Top Base Hex
      for (let i = 0; i < 6; i++) {
        const theta = (i * 60 * Math.PI) / 180;
        list.push({ x: r * Math.cos(theta), y: r * Math.sin(theta), z: -oz, id: `Hex-Top-${i + 1}` });
      }
      list.push({ x: 0, y: 0, z: -oz, id: 'Hex-Top-Center' });

      // Middle Interstitial Trio
      for (let i = 0; i < 3; i++) {
        const theta = ((i * 120 + 30) * Math.PI) / 180;
        list.push({ x: (r * 0.55) * Math.cos(theta), y: (r * 0.55) * Math.sin(theta), z: 0, id: `HCP-Mid-${i + 1}` });
      }
    } else if (structure === 'Amorphous') {
      // Randomized spatial coordination with structural distortion
      list.length = 0;
      for (let i = 0; i < 15; i++) {
        list.push({
          x: (Math.random() - 0.5) * sa,
          y: (Math.random() - 0.5) * sb,
          z: (Math.random() - 0.5) * sc,
          id: `Amorphous-Node-${i + 1}`
        });
      }
    }

    return list;
  }, [sa, sb, sc, structure, boxVertices]);

  // Continuous physics orbital rotation animation loop
  useEffect(() => {
    const tick = (time: number) => {
      if (prevTimeRef.current !== null && isRotating) {
        const delta = time - prevTimeRef.current;
        setYaw(y => (y + delta * 0.035) % 360);
      }
      prevTimeRef.current = time;
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRotating]);

  // Wireframe structural edges connection indexes mapping
  const edges = useMemo<[number, number][]>(() => {
    if (structure === 'HCP') {
      return [
        // Bottom ring
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
        // Top ring
        [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 7],
        // Center spine anchors
        [6, 0], [6, 2], [6, 4],
        [13, 7], [13, 9], [13, 11],
        // Vertical pillars
        [0, 7], [1, 8], [2, 9], [3, 10], [4, 11], [5, 12]
      ];
    }

    // Default Orthorhombic / Cubic bounding edges index arrays
    return [
      [0, 1], [1, 2], [2, 3], [3, 0], // Bottom square cell
      [4, 5], [5, 6], [6, 7], [7, 4], // Top square cell
      [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting vertical columns
    ];
  }, [structure]);

  // 3D coordinate point rotation map projection
  const project = (point: Point3D): Point2D => {
    // 1. Yaw rotation (Z-axis rotation around origin)
    const ryRad = (yaw * Math.PI) / 180;
    const cosY = Math.cos(ryRad);
    const sinY = Math.sin(ryRad);
    const x1 = point.x * cosY - point.y * sinY;
    const y1 = point.x * sinY + point.y * cosY;
    const z1 = point.z;

    // 2. Pitch rotation (X-axis tilt)
    const rxRad = (pitch * Math.PI) / 180;
    const cosP = Math.cos(rxRad);
    const sinP = Math.sin(rxRad);
    const x2 = x1;
    const y2 = y1 * cosP - z1 * sinP;
    const z2 = y1 * sinP + z1 * cosP;

    // Standard perspective depth multiplication factor
    const dist = 160;
    const factor = dist / (dist - z2);
    const scale = 1.35;

    return {
      x: 100 + x2 * factor * scale,
      y: 95 + y2 * factor * scale,
      zDepth: z2,
      id: point.id
    };
  };

  // Compute live Projected Coordinates
  const projectedBox = boxVertices.map(v => project(v));
  const projectedAtoms = atoms.map(v => project(v));

  // Determine element specific color highlights
  const atomColor = useMemo(() => {
    if (colorClass.includes('red')) return '#f87171';
    if (colorClass.includes('yellow')) return '#facc15';
    if (colorClass.includes('blue')) return '#60a5fa';
    if (colorClass.includes('emerald')) return '#34d399';
    if (colorClass.includes('cyan')) return '#22d3ee';
    if (colorClass.includes('fuchsia')) return '#e879f9';
    if (colorClass.includes('amber')) return '#fbbf24';
    if (colorClass.includes('rose')) return '#fb7185';
    return '#818cf8'; // default indigo
  }, [colorClass]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-200 dark:border-slate-800/80 p-5 relative overflow-hidden group shadow-sm dark:shadow-inner transition-all hover:shadow-md dark:hover:shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute right-4 top-4 flex items-center gap-2 z-20">
        <button
          onClick={() => {
            setIsRotating(!isRotating);
            playSynthTone('tick');
          }}
          className={`px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all duration-300 flex items-center gap-1.5 shadow-sm ${
            isRotating 
              ? 'bg-slate-100 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700' 
              : 'bg-white dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Pause or spin crystal rotational alignment"
        >
          <Orbit className={`w-3 h-3 ${isRotating ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} style={{ animationDuration: '4s' }} />
          {isRotating ? 'Orbiting' : 'Paused'}
        </button>
      </div>

      <div className="absolute left-5 top-5 z-20 pointer-events-none">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2 drop-shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: atomColor }} />
          {structure} Unit Cell
        </span>
      </div>

      {/* Main interactive Projection viewport */}
      <div className="w-full flex justify-center items-center h-48 relative cursor-move"
           onMouseMove={(e) => {
             if (e.buttons === 1) {
                setYaw(y => y + e.movementX * 0.5);
                setPitch(p => Math.max(-90, Math.min(90, p + e.movementY * 0.5)));
                setIsRotating(false);
             }
           }}
      >
        <svg viewBox="0 0 200 190" className="w-full h-full max-w-[220px] drop-shadow-md">
          <defs>
            <radialGradient id={`atom-grad`} cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor={atomColor} stopOpacity="1" />
              <stop offset="100%" stopColor={atomColor} stopOpacity="0.8" />
            </radialGradient>
            <radialGradient id={`atom-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={atomColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={atomColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Edge links rendering */}
          {edges.map(([p1, p2], idx) => {
            const start = structure === 'HCP' ? projectedAtoms[p1] : projectedBox[p1];
            const end = structure === 'HCP' ? projectedAtoms[p2] : projectedBox[p2];
            if (!start || !end) return null;
            
            // Fade lines based on depth to create atmospheric perspective
            const avgZ = (start.zDepth + end.zDepth) / 2;
            const opacity = Math.max(0.1, Math.min(0.8, (avgZ + 100) / 200));

            return (
              <line
                key={`edge-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={isRotating ? `rgba(99,102,241,${opacity * 0.5})` : `rgba(99,102,241,${opacity})`}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={structure === 'Amorphous' ? '2 4' : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Atomic coordinate spheres */}
          {projectedAtoms
            .sort((a, b) => a.zDepth - b.zDepth) // Depth sorting (painters algorithm)
            .map((atom, idx) => {
              const isSelected = selectedAtom === atom.id;
              const isCenter = atom.id === 'Body-Center' || atom.id?.includes('Int');
              const nodeRadius = isSelected ? 5.5 : (isCenter ? 4.5 : 3.5);

              return (
                <g 
                  key={`atom-${idx}`} 
                  onMouseEnter={() => {
                    setSelectedAtom(atom.id || null);
                    playSynthTone('tick');
                  }}
                  onMouseLeave={() => setSelectedAtom(null)}
                  className="cursor-pointer group/atom"
                >
                  {/* Outer subtle glow */}
                  <circle
                    cx={atom.x}
                    cy={atom.y}
                    r={nodeRadius * 4}
                    fill={`url(#atom-glow)`}
                    opacity={isSelected ? 1 : 0.2}
                    className="transition-all duration-300"
                  />
                  {/* Central solid node */}
                  <circle
                    cx={atom.x}
                    cy={atom.y}
                    r={nodeRadius}
                    fill={isCenter ? '#ffffff' : `url(#atom-grad)`}
                    stroke={isCenter ? atomColor : "rgba(0,0,0,0.4)"}
                    strokeWidth={isSelected ? 1.5 : 0.8}
                    className="transition-all duration-300 group-hover/atom:scale-125 drop-shadow-sm"
                  />
                </g>
              );
            })}
        </svg>

        {/* Selected atom metadata overlay */}
        <AnimatePresence>
          {selectedAtom && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 rounded-lg text-[10px] font-mono text-indigo-700 dark:text-indigo-300 text-center shadow-lg whitespace-nowrap z-20 backdrop-blur-md"
            >
              <span className="text-slate-800 dark:text-white font-bold mr-1">Node:</span> {selectedAtom}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual interactive pitch/yaw calibration slides */}
      <div className="grid grid-cols-2 gap-4 mt-3 pt-4 border-t border-slate-200 dark:border-slate-800/80 z-20 relative">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase tracking-wider">
            <span>Yaw (Azimuth)</span>
            <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{Math.round(yaw)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={yaw}
            onChange={(e) => {
              setYaw(parseFloat(e.target.value));
              setIsRotating(false);
            }}
            className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-lg cursor-pointer appearance-none transition-all hover:h-2"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-mono font-bold uppercase tracking-wider">
            <span>Pitch (Elevation)</span>
            <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{Math.round(pitch)}°</span>
          </div>
          <input
            type="range"
            min="-90"
            max="90"
            value={pitch}
            onChange={(e) => {
              setPitch(parseFloat(e.target.value));
              setIsRotating(false);
            }}
            className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-900 rounded-lg cursor-pointer appearance-none transition-all hover:h-2"
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   ElectronCloud3D: Interactive electron configuration visualization
   ========================================================================= */
const ElectronCloud3D: React.FC<{ 
  electronConfig: string;
  atomicNumber: number;
  colorClass: string;
}> = ({ electronConfig, atomicNumber, colorClass }) => {
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let animationFrame: number;
    let start = performance.now();

    const animate = (time: number) => {
      if (!isHovering) {
        setRotationX((time - start) * 0.005);
        setRotationY((time - start) * 0.003);
      } else {
        start = time - rotationX * 200; // Keep continuous offset
      }
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isHovering]);

  // Extract base atom color from the class string for inline styles
  const atomColor = useMemo(() => {
    if (colorClass.includes('fuchsia')) return '#d946ef';
    if (colorClass.includes('indigo')) return '#6366f1';
    if (colorClass.includes('amber')) return '#f59e0b';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('emerald')) return '#10b981';
    if (colorClass.includes('rose')) return '#f43f5e';
    if (colorClass.includes('cyan')) return '#06b6d4';
    if (colorClass.includes('violet')) return '#8b5cf6';
    if (colorClass.includes('orange')) return '#f97316';
    if (colorClass.includes('teal')) return '#14b8a6';
    return '#6366f1'; // fallback
  }, [colorClass]);

  // Parse total electrons per shell from configuration (simplified logic based on atomic number)
  // For a truly precise orbital model we'd parse the string, but a simple shell model (Bohr-like but in 3D) works beautifully
  const shells = useMemo(() => {
    const capacities = [2, 8, 18, 32, 32, 18, 8];
    let remaining = atomicNumber;
    const computedShells: number[] = [];
    for (let cap of capacities) {
      if (remaining <= 0) break;
      computedShells.push(Math.min(remaining, cap));
      remaining -= cap;
    }
    return computedShells;
  }, [atomicNumber]);

  return (
    <div 
      className="bg-slate-50 dark:bg-[#0B0F19]/80 rounded-[1.5rem] border border-slate-200 dark:border-white/5 p-4 relative overflow-hidden group shadow-sm dark:shadow-inner transition-all h-64 flex flex-col justify-between cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex items-center justify-between z-10 relative">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2 drop-shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: atomColor }} />
          Electron Cloud
        </span>
        <span className="text-[9px] font-mono text-slate-500 bg-white dark:bg-black/40 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5">
          {shells.length} Shell{shells.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="w-full flex-1 flex justify-center items-center relative perspective-[800px]">
        <div 
          className="relative w-full h-full flex justify-center items-center preserve-3d"
          style={{ transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)` }}
        >
          {/* Nucleus */}
          <div 
             className="absolute w-4 h-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] z-10"
             style={{ 
               background: `radial-gradient(circle at 30% 30%, #fff, ${atomColor})`,
               transform: `rotateY(${-rotationY}deg) rotateX(${-rotationX}deg)` // Billboard nucleus
             }}
          />

          {/* Electron Shells */}
          {shells.map((electrons, shellIdx) => {
             const radius = 25 + (shellIdx * 20); // Scale shells outward
             const orbitAngleX = (shellIdx * 45) % 180;
             const orbitAngleY = (shellIdx * 60) % 180;
             
             return (
                <div 
                  key={`shell-${shellIdx}`} 
                  className="absolute rounded-full border border-slate-400/30 dark:border-white/20 preserve-3d"
                  style={{
                    width: `${radius * 2}px`,
                    height: `${radius * 2}px`,
                    transform: `rotateX(${orbitAngleX}deg) rotateY(${orbitAngleY}deg)`
                  }}
                >
                   {/* Electrons in this shell */}
                   {Array.from({ length: electrons }).map((_, eIdx) => {
                      const angle = (eIdx / electrons) * 360;
                      // Determine position on the ring
                      return (
                         <div
                           key={`e-${shellIdx}-${eIdx}`}
                           className="absolute w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                           style={{
                              color: atomColor,
                              backgroundColor: '#fff',
                              left: '50%',
                              top: '50%',
                              transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${radius}px)`,
                              transformOrigin: '0 0'
                           }}
                         />
                      )
                   })}
                </div>
             );
          })}
        </div>
      </div>

      <div className="z-10 relative mt-2 text-center">
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
           {electronConfig}
        </span>
      </div>
    </div>
  );
};

export const PeriodicTableModule: React.FC<PeriodicTableModuleProps> = ({ onLoadPeaks }) => {
  const { t } = useTranslation();
  const [selectedElement, setSelectedElement] = useState<number | null>(14); // Default to Silicon (Si)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadedBanner, setLoadedBanner] = useState<string | null>(null);

  // Comparison Module states
  const [activeTab, setActiveTab] = useState<'grid' | 'compare'>('grid');
  const [compareSubjectAId, setCompareSubjectAId] = useState<string>('element-14');
  const [compareSubjectBId, setCompareSubjectBId] = useState<string>('compound-SiO2 (Quartz)');
  const [detailSubTab, setDetailSubTab] = useState<'lattice' | 'chemical' | 'physical'>('lattice');
  const [temperature, setTemperature] = useState<number>(25); // °C

  // Deep scientific properties of crystallographic elements
  const elementsDb = useMemo<Record<number, Partial<CrystalElement>>>(() => ({
    1: { // Hydrogen
      weight: 1.008,
      category: 'nonmetal',
      crystalStructure: 'Hexagonal',
      spaceGroup: 'P6_3/mmc',
      a: 4.70, c: 7.79,
      density: 0.08,
      meltingPoint: -259.16,
      electronConfig: '1s¹',
      famousCompounds: [
        {
          formula: 'H2O (Ice Ih)',
          name: 'Hexagonal Ice Crystal',
          crystalSystem: 'Hexagonal',
          spaceGroup: 'P6_3/mmc',
          latticeParams: { a: 4.51, c: 7.36 },
          typicalPeaks: [
            { twoTheta: 22.8, intensity: 100 },
            { twoTheta: 24.3, intensity: 80 },
            { twoTheta: 25.8, intensity: 70 },
            { twoTheta: 33.5, intensity: 35 }
          ],
          relevance: 'Environmental physics and glaciology calibrations.',
          shortDesc: 'The primary hexagonal crystal phase of water solidifying at atmospheric pressure.'
        }
      ]
    },
    6: { // Carbon
      weight: 12.011,
      category: 'nonmetal',
      crystalStructure: 'Diamond',
      spaceGroup: 'Fd-3m',
      a: 3.567,
      density: 3.51,
      meltingPoint: 3550,
      electronConfig: '[He] 2s² 2p²',
      famousCompounds: [
        {
          formula: 'C (Graphite)',
          name: 'Hexagonal Carbon',
          crystalSystem: 'Hexagonal',
          spaceGroup: 'P6_3/mmc',
          latticeParams: { a: 2.46, c: 6.70 },
          typicalPeaks: [
            { twoTheta: 26.54, intensity: 100 },
            { twoTheta: 42.41, intensity: 6 },
            { twoTheta: 44.57, intensity: 9 },
            { twoTheta: 54.69, intensity: 21 }
          ],
          relevance: 'Anodes in Lithium-ion batteries; high-temp lubricants.',
          shortDesc: 'The most stable natural allotrope of Carbon arranged in nested graphene sheets.'
        },
        {
          formula: 'WC',
          name: 'Tungsten Carbide',
          crystalSystem: 'Hexagonal',
          spaceGroup: 'P-6m2',
          latticeParams: { a: 2.91, c: 2.84 },
          typicalPeaks: [
            { twoTheta: 31.51, intensity: 65 },
            { twoTheta: 35.64, intensity: 100 },
            { twoTheta: 48.30, intensity: 85 },
            { twoTheta: 64.09, intensity: 20 }
          ],
          relevance: 'Ultra-hard cutting tools and shielding materials.',
          shortDesc: 'Extremely dense composite phase featuring interpenetrating carbide lattices.'
        }
      ]
    },
    11: { // Sodium
      weight: 22.990,
      category: 'alkali',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m',
      a: 4.29,
      density: 0.97,
      meltingPoint: 97.79,
      electronConfig: '[Ne] 3s¹',
      famousCompounds: [
        {
          formula: 'NaCl',
          name: 'Halite (Rock Salt)',
          crystalSystem: 'Cubic',
          spaceGroup: 'Fm-3m',
          latticeParams: { a: 5.64 },
          typicalPeaks: [
            { twoTheta: 27.35, intensity: 12 },
            { twoTheta: 31.72, intensity: 100 },
            { twoTheta: 45.45, intensity: 55 },
            { twoTheta: 56.48, intensity: 15 },
            { twoTheta: 66.23, intensity: 22 }
          ],
          relevance: 'The supreme international pattern calibration standard.',
          shortDesc: 'Classic face-centered interpenetrating arrangement of sodium/chlorine ion complexes.'
        }
      ]
    },
    12: { // Magnesium
      weight: 24.305,
      category: 'alkaline_earth',
      crystalStructure: 'HCP',
      spaceGroup: 'P6_3/mmc',
      a: 3.21, c: 5.21,
      density: 1.74,
      meltingPoint: 650,
      electronConfig: '[Ne] 3s²',
      famousCompounds: [
        {
          formula: 'MgO',
          name: 'Periclase (Magnesia)',
          crystalSystem: 'Cubic',
          spaceGroup: 'Fm-3m',
          latticeParams: { a: 4.212 },
          typicalPeaks: [
            { twoTheta: 36.93, intensity: 10 },
            { twoTheta: 42.91, intensity: 100 },
            { twoTheta: 62.31, intensity: 52 },
            { twoTheta: 74.69, intensity: 12 },
            { twoTheta: 78.63, intensity: 15 }
          ],
          relevance: 'High-temperature crucibles and thermal barriers.',
          shortDesc: 'Refractory magnesium oxide material crystallizing in rock-salt ionic geometry.'
        }
      ]
    },
    13: { // Aluminum
      weight: 26.982,
      category: 'post_transition',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m',
      a: 4.049,
      density: 2.70,
      meltingPoint: 660.32,
      electronConfig: '[Ne] 3s² 3p¹',
      famousCompounds: [
        {
          formula: 'Al2O3 (Corundum)',
          name: 'Alpha Alumina / Sapphire',
          crystalSystem: 'Rhombohedral',
          spaceGroup: 'R-3c',
          latticeParams: { a: 4.758, c: 12.991 },
          typicalPeaks: [
            { twoTheta: 25.58, intensity: 75 },
            { twoTheta: 35.15, intensity: 90 },
            { twoTheta: 43.35, intensity: 100 },
            { twoTheta: 52.55, intensity: 45 },
            { twoTheta: 57.50, intensity: 85 },
            { twoTheta: 68.21, intensity: 95 }
          ],
          relevance: 'Laser gain bases (Ruby/Sapphire), premium abrasive materials.',
          shortDesc: 'A dense, trigonal close-packed oxide layout which is chemically and mechanically passive.'
        }
      ]
    },
    14: { // Silicon
      weight: 28.085,
      category: 'metalloid',
      crystalStructure: 'Diamond',
      spaceGroup: 'Fd-3m',
      a: 5.431,
      density: 2.329,
      meltingPoint: 1414,
      electronConfig: '[Ne] 3s² 3p²',
      famousCompounds: [
        {
          formula: 'SiO2 (Quartz)',
          name: 'Alpha-Quartz',
          crystalSystem: 'Hexagonal',
          spaceGroup: 'P3_121',
          latticeParams: { a: 4.913, c: 5.405 },
          typicalPeaks: [
            { twoTheta: 20.85, intensity: 35 },
            { twoTheta: 26.64, intensity: 100 },
            { twoTheta: 36.54, intensity: 12 },
            { twoTheta: 50.14, intensity: 17 },
            { twoTheta: 59.96, intensity: 10 },
            { twoTheta: 68.15, intensity: 9 }
          ],
          relevance: 'Piezoelectric resonators, glass manufacturing, standard silicates.',
          shortDesc: 'Highly ordered helical silica chains forming a rigid chiral hexagonal framework.'
        },
        {
          formula: 'SiC',
          name: 'Moissanite / Silicon Carbide',
          crystalSystem: 'Hexagonal',
          spaceGroup: 'P6_3mc',
          latticeParams: { a: 3.081, c: 15.12 },
          typicalPeaks: [
            { twoTheta: 33.60, intensity: 40 },
            { twoTheta: 35.60, intensity: 100 },
            { twoTheta: 38.20, intensity: 30 },
            { twoTheta: 60.00, intensity: 80 },
            { twoTheta: 71.80, intensity: 60 }
          ],
          relevance: 'High-power semiconductors, extreme-friction clutches.',
          shortDesc: 'Highly stable material exhibiting polytypism (3C, 4H, 6H) under different synthesis controls.'
        }
      ]
    },
    16: { // Sulfur
      weight: 32.06,
      category: 'nonmetal',
      crystalStructure: 'Orthorhombic',
      spaceGroup: 'Fddd',
      a: 10.43, b: 12.84, c: 24.36,
      density: 2.07,
      meltingPoint: 115.21,
      electronConfig: '[Ne] 3s² 3p⁴',
      famousCompounds: [
        {
          formula: 'FeS2 (Pyrite)',
          name: 'Fool’s Gold',
          crystalSystem: 'Cubic',
          spaceGroup: 'Pa-3',
          latticeParams: { a: 5.418 },
          typicalPeaks: [
            { twoTheta: 28.53, intensity: 35 },
            { twoTheta: 33.04, intensity: 100 },
            { twoTheta: 37.11, intensity: 50 },
            { twoTheta: 40.78, intensity: 40 },
            { twoTheta: 56.35, intensity: 65 }
          ],
          relevance: 'Earth abundant energy systems, precursor to sulfuric acid.',
          shortDesc: 'Distinctive isometric pyrite crystal phase featuring discrete disulfide anions.'
        }
      ]
    },
    20: { // Calcium
      weight: 40.078,
      category: 'alkaline_earth',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m',
      a: 5.58,
      density: 1.54,
      meltingPoint: 842,
      electronConfig: '[Ar] 4s²',
      famousCompounds: [
        {
          formula: 'CaCO3 (Calcite)',
          name: 'Calcite (Calcium Carbonate)',
          crystalSystem: 'Trigonal',
          spaceGroup: 'R-3c',
          latticeParams: { a: 4.989, c: 17.062 },
          typicalPeaks: [
            { twoTheta: 23.01, intensity: 15 },
            { twoTheta: 29.40, intensity: 100 },
            { twoTheta: 35.97, intensity: 18 },
            { twoTheta: 39.41, intensity: 20 },
            { twoTheta: 43.16, intensity: 22 },
            { twoTheta: 47.50, intensity: 25 }
          ],
          relevance: 'Geological carbon sinking, concrete material matrices, seashell biomineralization.',
          shortDesc: 'Primary calcium carbonate polymorph with triangular carbonate units sandwiching calcium sheets.'
        },
        {
          formula: 'CaF2 (Fluorite)',
          name: 'Fluorite',
          crystalSystem: 'Cubic',
          spaceGroup: 'Fm-3m',
          latticeParams: { a: 5.463 },
          typicalPeaks: [
            { twoTheta: 28.27, intensity: 100 },
            { twoTheta: 47.01, intensity: 85 },
            { twoTheta: 55.79, intensity: 45 },
            { twoTheta: 68.80, intensity: 15 },
            { twoTheta: 75.83, intensity: 20 }
          ],
          relevance: 'High-purity UV visual lenses, metallurgical flux additives.',
          shortDesc: 'Fluorite lattice type with Calcium forming FCC nodes and Fluoride occupying all tetrahedral holes.'
        }
      ]
    },
    22: { // Titanium
      weight: 47.867,
      category: 'transition_metal',
      crystalStructure: 'HCP',
      spaceGroup: 'P6_3/mmc',
      a: 2.95, c: 4.68,
      density: 4.506,
      meltingPoint: 1668,
      electronConfig: '[Ar] 3d² 4s²',
      famousCompounds: [
        {
          formula: 'TiO2 (Rutile)',
          name: 'Rutile',
          crystalSystem: 'Tetragonal',
          spaceGroup: 'P4_2/mnm',
          latticeParams: { a: 4.593, c: 2.959 },
          typicalPeaks: [
            { twoTheta: 27.44, intensity: 100 },
            { twoTheta: 36.08, intensity: 50 },
            { twoTheta: 41.22, intensity: 25 },
            { twoTheta: 54.32, intensity: 60 },
            { twoTheta: 56.64, intensity: 20 },
            { twoTheta: 69.01, intensity: 20 }
          ],
          relevance: 'Superb UV scattering pigment, photocatalyst foundations.',
          shortDesc: 'The thermodynamically stable polymorph of TiO2 featuring distorted Ti-O octahedra.'
        },
        {
          formula: 'BaTiO3',
          name: 'Barium Titanate',
          crystalSystem: 'Tetragonal',
          spaceGroup: 'P4mm',
          latticeParams: { a: 3.992, c: 4.036 },
          typicalPeaks: [
            { twoTheta: 22.20, intensity: 35 },
            { twoTheta: 31.50, intensity: 100 },
            { twoTheta: 38.90, intensity: 28 },
            { twoTheta: 45.20, intensity: 70 },
            { twoTheta: 56.10, intensity: 55 }
          ],
          relevance: 'High energy dielectric capacitors and sonar transducer elements.',
          shortDesc: 'Quintessential perovskite material exhibiting spontaneous electric polarization below 120°C.'
        }
      ]
    },
    26: { // Iron
      weight: 55.845,
      category: 'transition_metal',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m',
      a: 2.866,
      density: 7.874,
      meltingPoint: 1538,
      electronConfig: '[Ar] 3d⁶ 4s²',
      famousCompounds: [
        {
          formula: 'Fe2O3 (Hematite)',
          name: 'Hematite (Alpha ferric oxide)',
          crystalSystem: 'Rhombohedral',
          spaceGroup: 'R-3c',
          latticeParams: { a: 5.035, c: 13.74 },
          typicalPeaks: [
            { twoTheta: 24.15, intensity: 40 },
            { twoTheta: 33.15, intensity: 100 },
            { twoTheta: 35.61, intensity: 70 },
            { twoTheta: 40.85, intensity: 22 },
            { twoTheta: 49.48, intensity: 45 },
            { twoTheta: 54.08, intensity: 50 }
          ],
          relevance: 'Rust analysis, heavy industry pigments, catalytic substrates.',
          shortDesc: 'Corundum-type closely-packed oxygen framework embedded with octahedrally arranged Fe3+.'
        },
        {
          formula: 'Fe3O4 (Magnetite)',
          name: 'Magnetite (Magnetic Spinel)',
          crystalSystem: 'Cubic',
          spaceGroup: 'Fd-3m',
          latticeParams: { a: 8.397 },
          typicalPeaks: [
            { twoTheta: 30.12, intensity: 30 },
            { twoTheta: 35.45, intensity: 100 },
            { twoTheta: 43.08, intensity: 20 },
            { twoTheta: 53.48, intensity: 10 },
            { twoTheta: 57.02, intensity: 30 },
            { twoTheta: 62.56, intensity: 40 }
          ],
          relevance: 'Bio-magnetic targeting, ferrofluid solutions, planetary science marker.',
          shortDesc: 'Classic inverse spinel structure packing Fe2+ and Fe3+ ions across distinct tetrahedral/octahedral nodes.'
        }
      ]
    },
    29: { // Copper
      weight: 63.546,
      category: 'transition_metal',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m',
      a: 3.615,
      density: 8.96,
      meltingPoint: 1084.62,
      electronConfig: '[Ar] 3d¹⁰ 4s¹',
      famousCompounds: [
        {
          formula: 'Cu2O (Cuprite)',
          name: 'Cuprite (Cuprous oxide)',
          crystalSystem: 'Cubic',
          spaceGroup: 'Pn-3m',
          latticeParams: { a: 4.27 },
          typicalPeaks: [
            { twoTheta: 29.55, intensity: 35 },
            { twoTheta: 36.42, intensity: 100 },
            { twoTheta: 42.30, intensity: 45 },
            { twoTheta: 61.34, intensity: 25 },
            { twoTheta: 73.53, intensity: 20 }
          ],
          relevance: 'Solar-cell oxides, p-type micro-electronic transistors.',
          shortDesc: 'Remarkable shared framework of two interpenetrating and fully unlinked crystal networks.'
        },
        {
          formula: 'CuFeS2',
          name: 'Chalcopyrite',
          crystalSystem: 'Tetragonal',
          spaceGroup: 'I-42d',
          latticeParams: { a: 5.289, c: 10.423 },
          typicalPeaks: [
            { twoTheta: 29.35, intensity: 100 },
            { twoTheta: 49.12, intensity: 40 },
            { twoTheta: 57.85, intensity: 30 }
          ],
          relevance: 'Principal mineral ore of Copper element worldwide.',
          shortDesc: 'Sulfide minerals packing where both Copper and Iron swap coordinate centers symmetrically.'
        }
      ]
    },
    79: { // Gold
      weight: 196.967,
      category: 'transition_metal',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m',
      a: 4.078,
      density: 19.3,
      meltingPoint: 1064.18,
      electronConfig: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹',
      famousCompounds: [
        {
          formula: 'Au (Gold Film)',
          name: 'Direct Metallic FCC Gold',
          crystalSystem: 'Cubic',
          spaceGroup: 'Fm-3m',
          latticeParams: { a: 4.078 },
          typicalPeaks: [
            { twoTheta: 38.18, intensity: 100 },
            { twoTheta: 44.39, intensity: 52 },
            { twoTheta: 64.58, intensity: 32 },
            { twoTheta: 77.55, intensity: 36 },
            { twoTheta: 81.72, intensity: 12 }
          ],
          relevance: 'Sputtered conductive coatings, optical plasmonics.',
          shortDesc: 'Super-stable face-centered metallic lattices ideal for X-ray sample alignment and microanalysis.'
        }
      ]
    },
    92: { // Uranium
      weight: 238.029,
      category: 'actinoid',
      crystalStructure: 'Orthorhombic',
      spaceGroup: 'Cmca',
      a: 2.854, b: 5.87, c: 4.955,
      density: 19.1,
      meltingPoint: 1132.2,
      electronConfig: '[Rn] 5f³ 6d¹ 7s²',
      famousCompounds: [
        {
          formula: 'UO2 (Uraninite)',
          name: 'Nuclear Fluorite Phase',
          crystalSystem: 'Cubic',
          spaceGroup: 'Fm-3m',
          latticeParams: { a: 5.468 },
          typicalPeaks: [
            { twoTheta: 28.23, intensity: 100 },
            { twoTheta: 32.75, intensity: 45 },
            { twoTheta: 46.95, intensity: 80 },
            { twoTheta: 55.72, intensity: 65 },
            { twoTheta: 58.55, intensity: 15 }
          ],
          relevance: 'Primary combustible mass of commercial nuclear fuel cycles.',
          shortDesc: 'Extremely dense isotropic fuel block possessing extreme melting security.'
        }
      ]
    }
  }), []);

  // Overrides for editing element/material properties
  const [customOverrides, setCustomOverrides] = useState<Record<number, Partial<CrystalElement>>>(() => {
    try {
      const saved = localStorage.getItem('xrd_periodic_custom_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  const updateCustomOverride = (num: number, updatedFields: Partial<CrystalElement>) => {
    setCustomOverrides(prev => {
      const next = {
        ...prev,
        [num]: {
          ...prev[num],
          ...updatedFields
        }
      };
      try {
        localStorage.setItem('xrd_periodic_custom_overrides', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const [isEditingElement, setIsEditingElement] = useState<boolean>(false);

  // Form states for active element editing
  const [formName, setFormName] = useState<string>('');
  const [formSymbol, setFormSymbol] = useState<string>('');
  const [formWeight, setFormWeight] = useState<number>(0);
  const [formStructure, setFormStructure] = useState<CrystalElement['crystalStructure']>('Cubic');
  const [formSpaceGroup, setFormSpaceGroup] = useState<string>('');
  const [formDensity, setFormDensity] = useState<number>(0);
  const [formMeltingPoint, setFormMeltingPoint] = useState<number>(0);
  const [formA, setFormA] = useState<number>(0);
  const [formB, setFormB] = useState<number | undefined>(undefined);
  const [formC, setFormC] = useState<number | undefined>(undefined);
  const [formElectronConfig, setFormElectronConfig] = useState<string>('');

  useEffect(() => {
    setIsEditingElement(false);
  }, [selectedElement]);

  // Standard elements coordinates for standard 18-col Periodic Table
  const fullElementsGrid = useMemo(() => {
    const baseList: { num: number; sym: string; name: string; x: number; y: number; s: string }[] = [
      // Row 1
      { num: 1, sym: 'H', name: 'Hydrogen', x: 1, y: 1, s: 'Hexagonal' },
      { num: 2, sym: 'He', name: 'Helium', x: 18, y: 1, s: 'HCP' },
      // Row 2
      { num: 3, sym: 'Li', name: 'Lithium', x: 1, y: 2, s: 'BCC' },
      { num: 4, sym: 'Be', name: 'Beryllium', x: 2, y: 2, s: 'HCP' },
      { num: 5, sym: 'B', name: 'Boron', x: 13, y: 2, s: 'Rhombohedral' },
      { num: 6, sym: 'C', name: 'Carbon', x: 14, y: 2, s: 'Diamond' },
      { num: 7, sym: 'N', name: 'Nitrogen', x: 15, y: 2, s: 'Hexagonal' },
      { num: 8, sym: 'O', name: 'Oxygen', x: 16, y: 2, s: 'Monoclinic' },
      { num: 9, sym: 'F', name: 'Fluorine', x: 17, y: 2, s: 'Monoclinic' },
      { num: 10, sym: 'Ne', name: 'Neon', x: 18, y: 2, s: 'FCC' },
      // Row 3
      { num: 11, sym: 'Na', name: 'Sodium', x: 1, y: 3, s: 'BCC' },
      { num: 12, sym: 'Mg', name: 'Magnesium', x: 2, y: 3, s: 'HCP' },
      { num: 13, sym: 'Al', name: 'Aluminum', x: 13, y: 3, s: 'FCC' },
      { num: 14, sym: 'Si', name: 'Silicon', x: 14, y: 3, s: 'Diamond' },
      { num: 15, sym: 'P', name: 'Phosphorus', x: 15, y: 3, s: 'Orthorhombic' },
      { num: 16, sym: 'S', name: 'Sulfur', x: 16, y: 3, s: 'Orthorhombic' },
      { num: 17, sym: 'Cl', name: 'Chlorine', x: 17, y: 3, s: 'Orthorhombic' },
      { num: 18, sym: 'Ar', name: 'Argon', x: 18, y: 3, s: 'FCC' },
      // Row 4
      { num: 19, sym: 'K', name: 'Potassium', x: 1, y: 4, s: 'BCC' },
      { num: 20, sym: 'Ca', name: 'Calcium', x: 2, y: 4, s: 'FCC' },
      { num: 21, sym: 'Sc', name: 'Scandium', x: 3, y: 4, s: 'HCP' },
      { num: 22, sym: 'Ti', name: 'Titanium', x: 4, y: 4, s: 'HCP' },
      { num: 23, sym: 'V', name: 'Vanadium', x: 5, y: 4, s: 'BCC' },
      { num: 24, sym: 'Cr', name: 'Chromium', x: 6, y: 4, s: 'BCC' },
      { num: 25, sym: 'Mn', name: 'Manganese', x: 7, y: 4, s: 'Cubic' },
      { num: 26, sym: 'Fe', name: 'Iron', x: 8, y: 4, s: 'BCC' },
      { num: 27, sym: 'Co', name: 'Cobalt', x: 9, y: 4, s: 'HCP' },
      { num: 28, sym: 'Ni', name: 'Nickel', x: 10, y: 4, s: 'FCC' },
      { num: 29, sym: 'Cu', name: 'Copper', x: 11, y: 4, s: 'FCC' },
      { num: 30, sym: 'Zn', name: 'Zinc', x: 12, y: 4, s: 'HCP' },
      { num: 31, sym: 'Ga', name: 'Gallium', x: 13, y: 4, s: 'Orthorhombic' },
      { num: 32, sym: 'Ge', name: 'Germanium', x: 14, y: 4, s: 'Diamond' },
      { num: 33, sym: 'As', name: 'Arsenic', x: 15, y: 4, s: 'Rhombohedral' },
      { num: 34, sym: 'Se', name: 'Selenium', x: 16, y: 4, s: 'Hexagonal' },
      { num: 35, sym: 'Br', name: 'Bromine', x: 17, y: 4, s: 'Orthorhombic' },
      { num: 36, sym: 'Kr', name: 'Krypton', x: 18, y: 4, s: 'FCC' },
      // Row 5
      { num: 37, sym: 'Rb', name: 'Rubidium', x: 1, y: 5, s: 'BCC' },
      { num: 38, sym: 'Sr', name: 'Strontium', x: 2, y: 5, s: 'FCC' },
      { num: 39, sym: 'Y', name: 'Yttrium', x: 3, y: 5, s: 'HCP' },
      { num: 40, sym: 'Zr', name: 'Zirconium', x: 4, y: 5, s: 'HCP' },
      { num: 41, sym: 'Nb', name: 'Niobium', x: 5, y: 5, s: 'BCC' },
      { num: 42, sym: 'Mo', name: 'Molybdenum', x: 6, y: 5, s: 'BCC' },
      { num: 43, sym: 'Tc', name: 'Technetium', x: 7, y: 5, s: 'HCP' },
      { num: 44, sym: 'Ru', name: 'Ruthenium', x: 8, y: 5, s: 'HCP' },
      { num: 45, sym: 'Rh', name: 'Rhodium', x: 9, y: 5, s: 'FCC' },
      { num: 46, sym: 'Pd', name: 'Palladium', x: 10, y: 5, s: 'FCC' },
      { num: 47, sym: 'Ag', name: 'Silver', x: 11, y: 5, s: 'FCC' },
      { num: 48, sym: 'Cd', name: 'Cadmium', x: 12, y: 5, s: 'HCP' },
      { num: 49, sym: 'In', name: 'Indium', x: 13, y: 5, s: 'Tetragonal' },
      { num: 50, sym: 'Sn', name: 'Tin', x: 14, y: 5, s: 'Tetragonal' },
      { num: 51, sym: 'Sb', name: 'Antimony', x: 15, y: 5, s: 'Rhombohedral' },
      { num: 52, sym: 'Te', name: 'Tellurium', x: 16, y: 5, s: 'Hexagonal' },
      { num: 53, sym: 'I', name: 'Iodine', x: 17, y: 5, s: 'Orthorhombic' },
      { num: 54, sym: 'Xe', name: 'Xenon', x: 18, y: 5, s: 'FCC' },
      // Row 6
      { num: 55, sym: 'Cs', name: 'Cesium', x: 1, y: 6, s: 'BCC' },
      { num: 56, sym: 'Ba', name: 'Barium', x: 2, y: 6, s: 'BCC' },
      { num: 57, sym: 'La', name: 'Lanthanum', x: 3, y: 6, s: 'HCP' },
      { num: 72, sym: 'Hf', name: 'Hafnium', x: 4, y: 6, s: 'HCP' },
      { num: 73, sym: 'Ta', name: 'Tantalum', x: 5, y: 6, s: 'BCC' },
      { num: 74, sym: 'W', name: 'Tungsten', x: 6, y: 6, s: 'BCC' },
      { num: 75, sym: 'Re', name: 'Rhenium', x: 7, y: 6, s: 'HCP' },
      { num: 76, sym: 'Os', name: 'Osmium', x: 8, y: 6, s: 'HCP' },
      { num: 77, sym: 'Ir', name: 'Iridium', x: 9, y: 6, s: 'FCC' },
      { num: 78, sym: 'Pt', name: 'Platinum', x: 10, y: 6, s: 'FCC' },
      { num: 79, sym: 'Au', name: 'Gold', x: 11, y: 6, s: 'FCC' },
      { num: 80, sym: 'Hg', name: 'Mercury', x: 12, y: 6, s: 'Rhombohedral' },
      { num: 81, sym: 'Tl', name: 'Thallium', x: 13, y: 6, s: 'HCP' },
      { num: 82, sym: 'Pb', name: 'Lead', x: 14, y: 6, s: 'FCC' },
      { num: 83, sym: 'Bi', name: 'Bismuth', x: 15, y: 6, s: 'Rhombohedral' },
      // Heavy elements
      { num: 90, sym: 'Th', name: 'Thorium', x: 5, y: 7, s: 'FCC' },
      { num: 92, sym: 'U', name: 'Uranium', x: 7, y: 7, s: 'Orthorhombic' },
      { num: 94, sym: 'Pu', name: 'Plutonium', x: 9, y: 7, s: 'Monoclinic' }
    ];

    return baseList.map(item => {
      const dbInfo = elementsDb[item.num] || {};
      const overrideInfo = customOverrides[item.num] || {};
      const detailed = { ...dbInfo, ...overrideInfo };
      
      let category: CrystalElement['category'] = detailed.category || 'transition_metal';
      if (item.num === 1 || item.num === 6 || item.num === 7 || item.num === 8 || item.num === 15 || item.num === 16 || item.num === 34) category = 'nonmetal';
      else if (item.num === 3 || item.num === 11 || item.num === 19 || item.num === 37 || item.num === 55) category = 'alkali';
      else if (item.num === 4 || item.num === 12 || item.num === 20 || item.num === 38 || item.num === 56) category = 'alkaline_earth';
      else if (item.num === 5 || item.num === 14 || item.num === 32 || item.num === 33 || item.num === 51 || item.num === 52) category = 'metalloid';
      else if (item.num === 2 || item.num === 10 || item.num === 18 || item.num === 36 || item.num === 54) category = 'noble_gas';
      else if (item.num === 57) category = 'lanthanoid';
      else if (item.num >= 89) category = 'actinoid';
      else if (item.num === 13 || item.num === 31 || item.num === 49 || item.num === 50 || item.num === 81 || item.num === 82 || item.num === 83) category = 'post_transition';

      const factualProps = getFactualProperties(item.num);
      const weight = detailed.weight !== undefined ? detailed.weight : (item.num * 2.05 + 1.8);
      const density = detailed.density !== undefined ? detailed.density : (item.num * 0.17 + 0.95);
      const meltingPoint = detailed.meltingPoint !== undefined ? detailed.meltingPoint : (item.num * 22);
      const electronConfig = detailed.electronConfig || factualProps.electronConfig || `[Inert] Config ${item.num}`;

      return {
        number: item.num,
        symbol: detailed.symbol || item.sym,
        name: detailed.name || item.name,
        weight,
        category,
        gridX: item.x,
        gridY: item.y,
        crystalStructure: (detailed.crystalStructure || item.s) as any,
        spaceGroup: detailed.spaceGroup || 'Unknown',
        a: detailed.a || 3.42,
        b: detailed.b,
        c: detailed.c,
        alpha: detailed.alpha || 90,
        beta: detailed.beta || 90,
        gamma: detailed.gamma || 90,
        density,
        meltingPoint,
        electronConfig,
        famousCompounds: detailed.famousCompounds || [],

        // Scientific properties mapping
        valenceElectrons: detailed.valenceElectrons !== undefined ? detailed.valenceElectrons : factualProps.valenceElectrons,
        electronegativity: detailed.electronegativity !== undefined ? detailed.electronegativity : factualProps.electronegativity,
        ionizationEnergy: detailed.ionizationEnergy !== undefined ? detailed.ionizationEnergy : factualProps.ionizationEnergy,
        electronAffinity: detailed.electronAffinity !== undefined ? detailed.electronAffinity : factualProps.electronAffinity,
        metallicCharacter: detailed.metallicCharacter !== undefined ? detailed.metallicCharacter : factualProps.metallicCharacter,
        nonMetallicCharacter: detailed.nonMetallicCharacter !== undefined ? detailed.nonMetallicCharacter : factualProps.nonMetallicCharacter,
        atomicRadius: detailed.atomicRadius !== undefined ? detailed.atomicRadius : factualProps.atomicRadius,
        ionicRadius: detailed.ionicRadius !== undefined ? detailed.ionicRadius : factualProps.ionicRadius,
        boilingPoint: detailed.boilingPoint !== undefined ? detailed.boilingPoint : factualProps.boilingPoint,
        electricalConductivity: detailed.electricalConductivity !== undefined ? detailed.electricalConductivity : factualProps.electricalConductivity,
        thermalConductivity: detailed.thermalConductivity !== undefined ? detailed.thermalConductivity : factualProps.thermalConductivity
      } as CrystalElement;
    });
  }, [elementsDb, customOverrides]);

  // Handle single compounds simulation loading
  const handleLoadPeaks = (compound: FamousCompound) => {
    if (!onLoadPeaks) return;
    
    const peaksStr = compound.typicalPeaks.map(p => `${p.twoTheta}:${p.intensity}`).join(', ');
    const hklStr = Array(compound.typicalPeaks.length).fill('').map((_, i) => `${i + 1}00`).join(', ');
    
    onLoadPeaks(peaksStr, hklStr, compound.formula);
    playSynthTone('success');
    
    setLoadedBanner(compound.formula);
    setTimeout(() => setLoadedBanner(null), 3500);
  };

  const filteredElements = useMemo(() => {
    return fullElementsGrid.filter(el => {
      const matchQuery = el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          el.crystalStructure.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (categoryFilter === 'all') return matchQuery;
      return el.category === categoryFilter && matchQuery;
    });
  }, [fullElementsGrid, searchQuery, categoryFilter]);

  const activeElementInfo = useMemo(() => {
    return fullElementsGrid.find(el => el.number === selectedElement) || null;
  }, [fullElementsGrid, selectedElement]);

  useEffect(() => {
    if (activeElementInfo) {
      setFormName(activeElementInfo.name);
      setFormSymbol(activeElementInfo.symbol);
      setFormWeight(activeElementInfo.weight);
      setFormStructure(activeElementInfo.crystalStructure);
      setFormSpaceGroup(activeElementInfo.spaceGroup);
      setFormDensity(activeElementInfo.density);
      setFormMeltingPoint(activeElementInfo.meltingPoint);
      setFormA(activeElementInfo.a);
      setFormB(activeElementInfo.b);
      setFormC(activeElementInfo.c);
      setFormElectronConfig(activeElementInfo.electronConfig);
    }
  }, [activeElementInfo, isEditingElement]);

  const handleSaveProperties = () => {
    if (!activeElementInfo) return;
    updateCustomOverride(activeElementInfo.number, {
      name: formName,
      symbol: formSymbol,
      weight: Number(formWeight),
      crystalStructure: formStructure,
      spaceGroup: formSpaceGroup,
      density: Number(formDensity),
      meltingPoint: Number(formMeltingPoint),
      a: Number(formA),
      b: formB ? Number(formB) : undefined,
      c: formC ? Number(formC) : undefined,
      electronConfig: formElectronConfig
    });
    setIsEditingElement(false);
    playSynthTone('success');
  };

  const handleResetToStandard = () => {
    if (!activeElementInfo) return;
    setCustomOverrides(prev => {
      const next = { ...prev };
      delete next[activeElementInfo.number];
      try {
        localStorage.setItem('xrd_periodic_custom_overrides', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    setIsEditingElement(false);
    playSynthTone('tick');
  };

  const compareItems = useMemo(() => {
    const items: {
      id: string;
      symbolOrFormula: string;
      name: string;
      type: 'element' | 'compound';
      density: number;
      meltingPoint: number;
      primaryPeak: number;
      latticeA: number;
      weight: number;
      info: string;
    }[] = [];

    fullElementsGrid.forEach(el => {
      if (isCrystalMaterial(el.number)) {
        let peakTemp = 30;
        if (el.number === 14) peakTemp = 28.44;
        else if (el.number === 22) peakTemp = 35.09;
        else if (el.number === 26) peakTemp = 44.67;
        else if (el.number === 29) peakTemp = 43.3;
        else if (el.number === 79) peakTemp = 38.18;
        else if (el.number === 12) peakTemp = 32.19;
        else if (el.number === 13) peakTemp = 38.47;
        else if (el.number === 20) peakTemp = 29.41;
        else if (el.number === 11) peakTemp = 31.72;
        else if (el.number === 6) peakTemp = 43.9;
        else if (el.number === 92) peakTemp = 35.15;

        items.push({
          id: `element-${el.number}`,
          symbolOrFormula: el.symbol,
          name: `${el.name} (Element)`,
          type: 'element',
          density: el.density,
          meltingPoint: el.meltingPoint,
          primaryPeak: peakTemp,
          latticeA: el.a,
          weight: el.weight,
          info: `${el.crystalStructure} crystal structure, space group ${el.spaceGroup}.`
        });

        el.famousCompounds.forEach(comp => {
          let cDensity = 3.0;
          let cMelting = 1500;
          let cWeight = 100;
          
          if (comp.formula.includes('NaCl')) { cDensity = 2.16; cMelting = 801; cWeight = 58.44; }
          else if (comp.formula.includes('SiO2') || comp.name.includes('Quartz')) { cDensity = 2.65; cMelting = 1713; cWeight = 60.08; }
          else if (comp.formula.includes('SiC') || comp.name.includes('Moissanite')) { cDensity = 3.21; cMelting = 2730; cWeight = 40.11; }
          else if (comp.formula.includes('Al2O3') || comp.name.includes('Corundum')) { cDensity = 3.98; cMelting = 2072; cWeight = 101.96; }
          else if (comp.formula.includes('MgO')) { cDensity = 3.58; cMelting = 2852; cWeight = 40.30; }
          else if (comp.formula.includes('TiO2') || comp.name.includes('Rutile')) { cDensity = 4.23; cMelting = 1843; cWeight = 79.87; }
          else if (comp.formula.includes('BaTiO3')) { cDensity = 6.02; cMelting = 1625; cWeight = 233.19; }
          else if (comp.formula.includes('Fe2O3') || comp.name.includes('Hematite')) { cDensity = 5.24; cMelting = 1565; cWeight = 159.69; }
          else if (comp.formula.includes('Fe3O4') || comp.name.includes('Magnetite')) { cDensity = 5.17; cMelting = 1590; cWeight = 231.53; }
          else if (comp.formula.includes('Cu2O') || comp.name.includes('Cuprite')) { cDensity = 6.0; cMelting = 1235; cWeight = 143.09; }
          else if (comp.formula.includes('CuFeS2') || comp.name.includes('Chalcopyrite')) { cDensity = 4.19; cMelting = 950; cWeight = 183.53; }
          else if (comp.formula.includes('WC')) { cDensity = 15.6; cMelting = 2870; cWeight = 195.85; }
          else if (comp.formula.includes('FeS2') || comp.name.includes('Pyrite')) { cDensity = 5.01; cMelting = 1100; cWeight = 119.98; }
          else if (comp.formula.includes('CaCO3') || comp.name.includes('Calcite')) { cDensity = 2.71; cMelting = 1339; cWeight = 100.09; }
          else if (comp.formula.includes('CaF2') || comp.name.includes('Fluorite')) { cDensity = 3.18; cMelting = 1418; cWeight = 78.07; }
          else if (comp.formula.includes('UO2') || comp.name.includes('Uraninite')) { cDensity = 10.97; cMelting = 2865; cWeight = 270.03; }
          else if (comp.formula.includes('H2O') || comp.name.includes('Ice')) { cDensity = 0.92; cMelting = 0; cWeight = 18.015; }

          items.push({
            id: `compound-${comp.formula}`,
            symbolOrFormula: comp.formula,
            name: `${comp.name} (Compound)`,
            type: 'compound',
            density: cDensity,
            meltingPoint: cMelting,
            primaryPeak: comp.typicalPeaks[0]?.twoTheta || 30.0,
            latticeA: comp.latticeParams.a,
            weight: cWeight,
            info: `Dynamic crystallographic phase of ${comp.name} with ${comp.crystalSystem} symmetry (${comp.spaceGroup}).`
          });
        });
      }
    });

    const uniqueItems: typeof items = [];
    const idSet = new Set<string>();
    items.forEach(it => {
      if (!idSet.has(it.id)) {
        idSet.add(it.id);
        uniqueItems.push(it);
      }
    });

    return uniqueItems;
  }, [fullElementsGrid]);

  const minMaxRanges = useMemo(() => {
    const densities = compareItems.map(i => i.density);
    const meltingPoints = compareItems.map(i => i.meltingPoint);
    const peaks = compareItems.map(i => i.primaryPeak);
    const lattices = compareItems.map(i => i.latticeA);
    const weights = compareItems.map(i => i.weight);

    return {
      density: { min: Math.min(...densities), max: Math.max(...densities) },
      meltingPoint: { min: Math.min(...meltingPoints), max: Math.max(...meltingPoints) },
      peak: { min: Math.min(...peaks), max: Math.max(...peaks) },
      lattice: { min: Math.min(...lattices), max: Math.max(...lattices) },
      weight: { min: Math.min(...weights), max: Math.max(...weights) },
    };
  }, [compareItems]);

  const subjectA = useMemo(() => {
    return compareItems.find(it => it.id === compareSubjectAId) || compareItems[0];
  }, [compareItems, compareSubjectAId]);

  const subjectB = useMemo(() => {
    return compareItems.find(it => it.id === compareSubjectBId) || compareItems[1];
  }, [compareItems, compareSubjectBId]);

  const currentCompareData = useMemo(() => {
    if (!subjectA || !subjectB) return [];

    const norm = (val: number, min: number, max: number) => {
      if (max === min) return 50;
      return 15 + ((val - min) / (max - min)) * 85;
    };

    return [
      {
        property: 'Density',
        label: 'Density',
        subjectAName: subjectA.symbolOrFormula,
        subjectBName: subjectB.symbolOrFormula,
        aRawValue: `${subjectA.density.toFixed(2)} g/cm³`,
        bRawValue: `${subjectB.density.toFixed(2)} g/cm³`,
        [subjectA.symbolOrFormula]: norm(subjectA.density, minMaxRanges.density.min, minMaxRanges.density.max),
        [subjectB.symbolOrFormula]: norm(subjectB.density, minMaxRanges.density.min, minMaxRanges.density.max),
      },
      {
        property: 'Melting Point',
        label: 'Melting Pt',
        subjectAName: subjectA.symbolOrFormula,
        subjectBName: subjectB.symbolOrFormula,
        aRawValue: `${subjectA.meltingPoint.toFixed(0)} °C`,
        bRawValue: `${subjectB.meltingPoint.toFixed(0)} °C`,
        [subjectA.symbolOrFormula]: norm(subjectA.meltingPoint, minMaxRanges.meltingPoint.min, minMaxRanges.meltingPoint.max),
        [subjectB.symbolOrFormula]: norm(subjectB.meltingPoint, minMaxRanges.meltingPoint.min, minMaxRanges.meltingPoint.max),
      },
      {
        property: 'Primary Peak',
        label: 'Primary Peak 2θ',
        subjectAName: subjectA.symbolOrFormula,
        subjectBName: subjectB.symbolOrFormula,
        aRawValue: `${subjectA.primaryPeak.toFixed(2)}°`,
        bRawValue: `${subjectB.primaryPeak.toFixed(2)}°`,
        [subjectA.symbolOrFormula]: norm(subjectA.primaryPeak, minMaxRanges.peak.min, minMaxRanges.peak.max),
        [subjectB.symbolOrFormula]: norm(subjectB.primaryPeak, minMaxRanges.peak.min, minMaxRanges.peak.max),
      },
      {
        property: 'Lattice Constant a',
        label: 'Lattice Size (a)',
        subjectAName: subjectA.symbolOrFormula,
        subjectBName: subjectB.symbolOrFormula,
        aRawValue: `${subjectA.latticeA.toFixed(3)} Å`,
        bRawValue: `${subjectB.latticeA.toFixed(3)} Å`,
        [subjectA.symbolOrFormula]: norm(subjectA.latticeA, minMaxRanges.lattice.min, minMaxRanges.lattice.max),
        [subjectB.symbolOrFormula]: norm(subjectB.latticeA, minMaxRanges.lattice.min, minMaxRanges.lattice.max),
      },
      {
        property: 'Formula Weight',
        label: 'Mass Weight',
        subjectAName: subjectA.symbolOrFormula,
        subjectBName: subjectB.symbolOrFormula,
        aRawValue: `${subjectA.weight.toFixed(2)} u`,
        bRawValue: `${subjectB.weight.toFixed(2)} u`,
        [subjectA.symbolOrFormula]: norm(subjectA.weight, minMaxRanges.weight.min, minMaxRanges.weight.max),
        [subjectB.symbolOrFormula]: norm(subjectB.weight, minMaxRanges.weight.min, minMaxRanges.weight.max),
      }
    ];
  }, [subjectA, subjectB, minMaxRanges]);

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'alkali': return 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20';
      case 'alkaline_earth': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20';
      case 'transition_metal': return 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20';
      case 'post_transition': return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
      case 'metalloid': return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20';
      case 'nonmetal': return 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20';
      case 'noble_gas': return 'bg-slate-500/10 border-slate-500/30 text-slate-400 hover:bg-slate-500/20';
      case 'lanthanoid': return 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20';
      case 'actinoid': return 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20';
      default: return 'bg-slate-700/10 border-slate-700/30 text-slate-400';
    }
  };

  const getElementColorClasses = (cat: string, status: 'active' | 'match' | 'normal' | 'disabled') => {
    // Generate color-specific gorgeous styles
    const colors: Record<string, { active: string, match: string, disabled: string }> = {
      'alkali': { active: 'ring-red-400 bg-red-900/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] text-white', match: 'border-red-500/40 bg-red-950/40 hover:border-red-400 hover:bg-red-900/60 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] text-red-200', disabled: 'border-red-500/10 bg-red-950/10 text-red-400/40 opacity-30' },
      'alkaline_earth': { active: 'ring-yellow-400 bg-yellow-900/80 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)] text-white', match: 'border-yellow-500/40 bg-yellow-950/40 hover:border-yellow-400 hover:bg-yellow-900/60 hover:shadow-[0_0_10px_rgba(234,179,8,0.2)] text-yellow-200', disabled: 'border-yellow-500/10 bg-yellow-950/10 text-yellow-400/40 opacity-30' },
      'transition_metal': { active: 'ring-blue-400 bg-blue-900/80 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] text-white', match: 'border-blue-500/40 bg-blue-950/40 hover:border-blue-400 hover:bg-blue-900/60 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] text-blue-200', disabled: 'border-blue-500/10 bg-blue-950/10 text-blue-400/40 opacity-30' },
      'post_transition': { active: 'ring-emerald-400 bg-emerald-900/80 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] text-white', match: 'border-emerald-500/40 bg-emerald-950/40 hover:border-emerald-400 hover:bg-emerald-900/60 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] text-emerald-200', disabled: 'border-emerald-500/10 bg-emerald-950/10 text-emerald-400/40 opacity-30' },
      'metalloid': { active: 'ring-cyan-400 bg-cyan-900/80 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] text-white', match: 'border-cyan-500/40 bg-cyan-950/40 hover:border-cyan-400 hover:bg-cyan-900/60 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-cyan-200', disabled: 'border-cyan-500/10 bg-cyan-950/10 text-cyan-400/40 opacity-30' },
      'nonmetal': { active: 'ring-fuchsia-400 bg-fuchsia-900/80 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.6)] text-white', match: 'border-fuchsia-500/40 bg-fuchsia-950/40 hover:border-fuchsia-400 hover:bg-fuchsia-900/60 hover:shadow-[0_0_10px_rgba(217,70,239,0.2)] text-fuchsia-200', disabled: 'border-fuchsia-500/10 bg-fuchsia-950/10 text-fuchsia-400/40 opacity-30' },
      'noble_gas': { active: 'ring-slate-400 bg-slate-700 border-slate-300 shadow-[0_0_15px_rgba(148,163,184,0.6)] text-white', match: 'border-slate-500/40 bg-slate-800/50 hover:border-slate-400 hover:bg-slate-700/60 hover:shadow-[0_0_10px_rgba(148,163,184,0.2)] text-slate-200', disabled: 'border-slate-600/20 bg-slate-900/50 text-slate-400/40 opacity-30' },
      'lanthanoid': { active: 'ring-amber-400 bg-amber-900/80 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] text-white', match: 'border-amber-500/40 bg-amber-950/40 hover:border-amber-400 hover:bg-amber-900/60 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-200', disabled: 'border-amber-500/10 bg-amber-950/10 text-amber-400/40 opacity-30' },
      'actinoid': { active: 'ring-rose-400 bg-rose-900/80 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] text-white', match: 'border-rose-500/40 bg-rose-950/40 hover:border-rose-400 hover:bg-rose-900/60 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] text-rose-200', disabled: 'border-rose-500/10 bg-rose-950/10 text-rose-400/40 opacity-30' },
    };
    
    const mapped = colors[cat] || { active: 'ring-slate-400 bg-slate-800 border-slate-400 text-white', match: 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 hover:shadow-lg', disabled: 'border-slate-800 bg-slate-900/50 text-slate-600/50 opacity-30' };

    switch (status) {
      case 'active':
        return `ring-1 z-30 scale-[1.08] font-bold cursor-pointer transition-all duration-300 ${mapped.active}`;
      case 'match':
        return `z-10 cursor-pointer transition-all duration-500 hover:scale-[1.03] hover:z-20 border-[0.5px] ${mapped.match}`;
      case 'normal':
        return `border-[0.5px] pointer-events-none scale-98 transition-all duration-700 ${mapped.disabled}`;
      case 'disabled':
        return `border-[0.5px] border-slate-800 bg-slate-950/20 text-slate-600/20 scale-95 cursor-not-allowed select-none opacity-20 transition-all duration-700 grayscale`;
    }
  };

  const activeBadgeColor = (cat: string) => {
    switch (cat) {
      case 'alkali': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'alkaline_earth': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'transition_metal': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'post_transition': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'metalloid': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'nonmetal': return 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20';
      case 'noble_gas': return 'bg-slate-500/10 text-slate-300 border border-slate-500/20';
      case 'lanthanoid': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'actinoid': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-800 text-slate-300';
    }
  };

  const getStructLabelColor = (struct: string) => {
    switch (struct) {
      case 'FCC': return 'text-sky-300 bg-sky-900/40 border border-sky-800/60';
      case 'BCC': return 'text-purple-300 bg-purple-900/40 border border-purple-800/60';
      case 'HCP': return 'text-emerald-300 bg-emerald-900/40 border border-emerald-800/60';
      case 'Diamond': return 'text-amber-300 bg-amber-900/40 border border-amber-800/60';
      default: return 'text-slate-300 bg-slate-800 border border-slate-700';
    }
  };

  return (
    <div id="crystallography-periodic-table-suite" className="space-y-6">
      <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-[#0B0F19] p-6 md:p-8 shadow-2xl isolate">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0B0F19] to-[#0B0F19] pointer-events-none" />
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/20 to-transparent blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col gap-4 md:flex-row md:items-start justify-between relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-indigo-300">
                Lattice Explorer
              </span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
              Periodic Table & Crystallography
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl font-medium">
              Explore structural lattices, Bravais symmetries, space groups, and atomic geometries. Select elements to view unit cell projections, edit properties, and load compound data into the spectrometer.
            </p>
          </div>
        </div>
      </div>

      {loadedBanner && (
        <div className="bg-gradient-to-r from-indigo-900/90 to-violet-900/90 border border-indigo-500/50 text-indigo-200 text-xs font-black p-4 rounded-xl shadow-[0_0_25px_rgba(99,102,241,0.25)] flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <p>
              Successfully compiled peaks for <span className="text-white font-mono font-bold font-black underline">{loadedBanner}</span>! Switching your workspace to the diffraction spectrometer...
            </p>
          </div>
          <Play className="w-4 h-4 text-white fill-current animate-pulse" />
        </div>
      )}

      {/* Module Mode Control Tabs */}
      <div className="flex border-b border-slate-800/60 mb-6 gap-6 text-[11px] font-black pb-3 uppercase tracking-wider">
        <button
          onClick={() => {
            setActiveTab('grid');
            playSynthTone('tick');
          }}
          className={`pb-2 transition-all duration-200 relative ${
            activeTab === 'grid' 
              ? 'text-indigo-400 border-b-2 border-indigo-500 font-extrabold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            Lattice Explorer Grid
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('compare');
            playSynthTone('tick');
          }}
          className={`pb-2 transition-all duration-200 relative ${
            activeTab === 'compare' 
              ? 'text-rose-400 border-b-2 border-rose-500 font-extrabold' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-rose-400" />
            Lattice Radar Comparator
          </div>
        </button>
      </div>

      {activeTab === 'grid' ? (
        <>
          {/* Grid Controller, Filters and Inputs bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl shadow-xl backdrop-blur-md mb-2">
            <div className="relative col-span-1 md:col-span-2 group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search elements by symbol, name, or crystal system structure (FCC, HCP)..."
                className="w-full bg-slate-950 text-slate-100 border border-slate-800/80 hover:border-slate-700/80 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/10"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 group-hover:text-slate-400 focus-within:text-indigo-400 transition-colors" />
            </div>

            <div className="col-span-1 md:col-span-2 relative group">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800/80 hover:border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none"
              >
                <option value="all">Filter: All Crystallographic Series</option>
                <option value="alkali">Alkali Metals (BCC structures)</option>
                <option value="alkaline_earth">Alkaline Earth (HCP/FCC types)</option>
                <option value="transition_metal">Transition Metals (Refractory lattices)</option>
                <option value="post_transition">Post-Transition Metals</option>
                <option value="metalloid">Metalloids / Chalcogen Phase</option>
                <option value="nonmetal">Reactive Nonmetals</option>
                <option value="noble_gas">Noble Gases (Cryo FCC lattices)</option>
                <option value="lanthanoid">Lanthanoids Series</option>
                <option value="actinoid">Actinoids Series</option>
              </select>
              <Layers className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500 group-hover:text-slate-400 transition-colors pointer-events-none" />
              <div className="absolute right-4 top-4 pointer-events-none border-l border-slate-800 pl-2">
                <svg className="w-3 h-3 text-slate-500 group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            
            {/* Added: State of Matter Temperature Slider */}
            <div className="col-span-1 md:col-span-4 bg-slate-950/50 rounded-xl px-4 py-3 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-shrink-0 min-w-[200px]">
                <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  <span>Temperature / State</span>
                  <span className="text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                    {Math.round(temperature)} °C <span className="text-slate-500 ml-1">({Math.round(temperature + 273.15)} K)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="-273.15"
                  max="6000"
                  step="1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-900 rounded-lg cursor-pointer appearance-none"
                />
              </div>
              
              <div className="flex-1 flex justify-evenly sm:justify-start gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-500 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-400"></div>
                  <span>Solid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <span className="text-blue-400">Liquid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                  <span className="text-rose-400">Gas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div>
                  <span className="text-purple-400">Unknown / Presumed</span>
                </div>
              </div>
            </div>
          </div>

      {/* Principal Splitted Workspace Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Span 8): Interactive Periodic Table Layout with Glowing Frames */}
        <div className="col-span-1 lg:col-span-8 space-y-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div 
            className="grid gap-1.5 p-6 bg-[#0B0F19] border border-white/5 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-[24px] relative min-w-[780px] select-none"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          >
            {/* Ambient Background Glow for the Table Container */}
            <div className="absolute inset-x-0 -top-40 h-80 bg-indigo-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 grid gap-1.5 w-full" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}>
              {/* Grid Coordinates Generator Loops */}
            {Array.from({ length: 7 }, (_, rowIndex) => rowIndex + 1).map(row => (
              <React.Fragment key={`row-${row}`}>
                {Array.from({ length: 18 }, (_, colIndex) => colIndex + 1).map(col => {
                  const el = fullElementsGrid.find(e => e.gridX === col && e.gridY === row);
                  const isMatch = el ? filteredElements.some(f => f.number === el.number) : false;

                  if (!el) {
                    // Empty visual cells
                    return <div key={`empty-${row}-${col}`} className="aspect-square opacity-0 pointer-events-none" />;
                  }

                  const isActive = selectedElement === el.number;
                  const isXtal = isCrystalMaterial(el.number);
                  const stateAtTemp = getPhysicalStateAtTemp(el.number, el.meltingPoint, (el as any).boilingPoint, temperature);
                  
                  let stateStatus: 'active' | 'match' | 'normal' | 'disabled' = 'normal';
                  if (isActive) stateStatus = 'active';
                  else if (isMatch && isXtal) stateStatus = 'match';
                  else if (isMatch && !isXtal) stateStatus = 'disabled';
                  else stateStatus = 'normal';

                  const borderClasses = getElementColorClasses(el.category, stateStatus);

                  // Temperature state styling
                  let stateDotClasses = 'bg-slate-500';
                  if (stateAtTemp === 'solid') stateDotClasses = 'bg-slate-400';
                  if (stateAtTemp === 'liquid') stateDotClasses = 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]';
                  if (stateAtTemp === 'gas') stateDotClasses = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]';
                  if (stateAtTemp === 'unknown') stateDotClasses = 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]';

                  return (
                    <button
                      key={`el-${el.number}`}
                      onClick={isXtal ? () => {
                        setSelectedElement(el.number);
                        playSynthTone('switch');
                      } : undefined}
                      disabled={!isXtal}
                      className={`aspect-square p-1 rounded-lg border flex flex-col justify-between transition-all duration-200 relative group/el ${borderClasses}`}
                      title={isXtal ? `${el.name} (${el.crystalStructure} lattice) - ${stateAtTemp}` : `${el.name} (Non-crystalline ${getPhysicalStateLabel(el.number).toLowerCase()}) - ${stateAtTemp}`}
                    >
                      <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${stateDotClasses} transition-colors duration-500 z-20`} />
                      
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[7.5px] font-mono text-slate-500 font-black">{el.number}</span>
                        {isXtal && el.famousCompounds && el.famousCompounds.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 opacity-80" title="Has famous XRD library components" />
                        )}
                      </div>
                      
                      <span className="text-sm font-black tracking-tight leading-none text-center block my-0.5">{el.symbol}</span>
                      
                      <div className="flex justify-between items-center w-full mt-auto">
                        <span className="text-[6.5px] truncate max-w-[70%] text-slate-400 leading-none">{el.name}</span>
                        <span className={`text-[5.5px] font-mono font-black scale-90 tracking-tighter px-0.5 rounded bg-slate-950/60 ${isXtal ? 'text-indigo-300' : 'text-slate-500'}`}>
                          {isXtal ? el.crystalStructure.substring(0, 3) : stateAtTemp === 'solid' ? 'SOL' : stateAtTemp === 'liquid' ? 'LIQ' : stateAtTemp === 'gas' ? 'GAS' : getPhysicalStateLabel(el.number)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}

            {/* In-Between Periodic Table Series Gap separator */}
            <div className="col-span-18 h-3 border-b border-dashed border-slate-800/60 my-1" />

            {/* Lanthanide series projection array */}
            <div className="col-span-2 aspect-square flex items-center justify-center text-[8px] uppercase font-black tracking-widest text-slate-500 font-mono">
              Lanthanide
            </div>
            <div className="col-span-1 aspect-square opacity-0 pointer-events-none" />
            {fullElementsGrid.filter(e => e.category === 'lanthanoid').map(el => {
              const isMatch = filteredElements.some(f => f.number === el.number);
              const isActive = selectedElement === el.number;
              const isXtal = isCrystalMaterial(el.number);
              const stateAtTemp = getPhysicalStateAtTemp(el.number, el.meltingPoint, (el as any).boilingPoint, temperature);
              
              let stateStatus: 'active' | 'match' | 'normal' | 'disabled' = 'normal';
              if (isActive) stateStatus = 'active';
              else if (isMatch && isXtal) stateStatus = 'match';
              else if (isMatch && !isXtal) stateStatus = 'disabled';
              else stateStatus = 'normal';

              const borderClasses = getElementColorClasses(el.category, stateStatus);

              let stateDotClasses = 'bg-slate-500';
              if (stateAtTemp === 'solid') stateDotClasses = 'bg-slate-400';
              if (stateAtTemp === 'liquid') stateDotClasses = 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]';
              if (stateAtTemp === 'gas') stateDotClasses = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]';
              if (stateAtTemp === 'unknown') stateDotClasses = 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]';

              return (
                <button
                  key={`el-${el.number}`}
                  onClick={isXtal ? () => {
                    setSelectedElement(el.number);
                    playSynthTone('switch');
                  } : undefined}
                  disabled={!isXtal}
                  className={`aspect-square p-1 rounded-lg border flex flex-col justify-between transition-all duration-200 relative group/el ${borderClasses}`}
                  title={isXtal ? `${el.name} - ${el.crystalStructure} - ${stateAtTemp}` : `${el.name} (Non-crystalline ${getPhysicalStateLabel(el.number).toLowerCase()}) - ${stateAtTemp}`}
                >
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${stateDotClasses} transition-colors duration-500 z-20`} />
                  
                  <span className="text-[7px] font-mono text-slate-500 font-bold text-left">{el.number}</span>
                  <span className="text-sm font-black tracking-tight text-center block my-0.5">{el.symbol}</span>
                  
                  <div className="flex justify-between items-center w-full mt-auto">
                    <span className="text-[6px] truncate max-w-[70%] text-slate-400 leading-none">{el.name}</span>
                    <span className={`text-[5.5px] font-mono font-black scale-90 tracking-tighter px-0.5 rounded bg-slate-950/60 ${isXtal ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {isXtal ? el.crystalStructure.substring(0, 3) : stateAtTemp === 'solid' ? 'SOL' : stateAtTemp === 'liquid' ? 'LIQ' : stateAtTemp === 'gas' ? 'GAS' : getPhysicalStateLabel(el.number)}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Actinide series projection array */}
            <div className="col-span-2 aspect-square flex items-center justify-center text-[8px] uppercase font-black tracking-widest text-slate-500 font-mono">
              Actinide
            </div>
            <div className="col-span-1 aspect-square opacity-0 pointer-events-none" />
            {fullElementsGrid.filter(e => e.category === 'actinoid').map(el => {
              const isMatch = filteredElements.some(f => f.number === el.number);
              const isActive = selectedElement === el.number;
              const isXtal = isCrystalMaterial(el.number);
              const stateAtTemp = getPhysicalStateAtTemp(el.number, el.meltingPoint, (el as any).boilingPoint, temperature);
              
              let stateStatus: 'active' | 'match' | 'normal' | 'disabled' = 'normal';
              if (isActive) stateStatus = 'active';
              else if (isMatch && isXtal) stateStatus = 'match';
              else if (isMatch && !isXtal) stateStatus = 'disabled';
              else stateStatus = 'normal';

              const borderClasses = getElementColorClasses(el.category, stateStatus);

              let stateDotClasses = 'bg-slate-500';
              if (stateAtTemp === 'solid') stateDotClasses = 'bg-slate-400';
              if (stateAtTemp === 'liquid') stateDotClasses = 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]';
              if (stateAtTemp === 'gas') stateDotClasses = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]';
              if (stateAtTemp === 'unknown') stateDotClasses = 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]';

              return (
                <button
                  key={`el-${el.number}`}
                  onClick={isXtal ? () => {
                    setSelectedElement(el.number);
                    playSynthTone('switch');
                  } : undefined}
                  disabled={!isXtal}
                  className={`aspect-square p-1 rounded-lg border flex flex-col justify-between transition-all duration-200 relative group/el ${borderClasses}`}
                  title={isXtal ? `${el.name} - ${el.crystalStructure} - ${stateAtTemp}` : `${el.name} (Non-crystalline ${getPhysicalStateLabel(el.number).toLowerCase()}) - ${stateAtTemp}`}
                >
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${stateDotClasses} transition-colors duration-500 z-20`} />
                  
                  <span className="text-[7px] font-mono text-slate-500 font-bold text-left">{el.number}</span>
                  <span className="text-sm font-black tracking-tight text-center block my-0.5">{el.symbol}</span>
                  
                  <div className="flex justify-between items-center w-full mt-auto">
                    <span className="text-[6px] truncate max-w-[75%] text-slate-400 leading-none">{el.name}</span>
                    <span className={`text-[5.5px] font-mono font-black scale-90 tracking-tighter px-0.5 rounded bg-slate-950/60 ${isXtal ? 'text-rose-300' : 'text-slate-500'}`}>
                      {isXtal ? el.crystalStructure.substring(0, 3) : stateAtTemp === 'solid' ? 'SOL' : stateAtTemp === 'liquid' ? 'LIQ' : stateAtTemp === 'gas' ? 'GAS' : getPhysicalStateLabel(el.number)}
                    </span>
                  </div>
                </button>
              );
            })}
            </div>
          </div>

          {/* Color Key block legends mapping */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl">
            {[
              { label: 'Nonmetals', cat: 'nonmetal' },
              { label: 'Alkali Metals', cat: 'alkali' },
              { label: 'Alkaline Earth', cat: 'alkaline_earth' },
              { label: 'Trans-Metals', cat: 'transition_metal' },
              { label: 'Post-Trans', cat: 'post_transition' },
              { label: 'Metalloids', cat: 'metalloid' },
              { label: 'Lanthanides', cat: 'lanthanoid' },
              { label: 'Actinides', cat: 'actinoid' },
              { label: 'Noble Gases', cat: 'noble_gas' }
            ].map(k => (
              <span 
                key={k.cat} 
                className={`text-[8px] text-center px-1.5 py-1 rounded-md border font-black uppercase tracking-wider ${categoryColor(k.cat)}`}
              >
                {k.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right Column (Span 4): Crystallographic Deep-Dive Profiler with interactive Lattice Rotation */}
        <div className="col-span-1 lg:col-span-4">
          <AnimatePresence mode="wait">
            {activeElementInfo ? (
              <motion.div
                key={`element-card-${activeElementInfo.number}`}
                initial={{ opacity: 0, scale: 0.97, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.18 }}
                className="bg-[#0B0F19]/80 backdrop-blur-2xl border border-white/5 rounded-[24px] p-6 space-y-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden ring-1 ring-white/5"
              >
                {/* Element Profiler Ribbon Header */}
                <div className="flex items-start justify-between border-b border-white/5 pb-5 relative">
                  <div className="absolute inset-x-0 -top-10 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />
                  
                  <div className="space-y-1.5 max-w-[65%] relative z-10">
                    <span className={`inline-block text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black leading-none ${activeBadgeColor(activeElementInfo.category)}`}>
                      {activeElementInfo.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 tracking-tight">{activeElementInfo.name}</h3>
                    <p className="text-[9.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                      At. Weight: {activeElementInfo.weight.toFixed(4)} u
                    </p>
                  </div>

                  {/* Large Element Logo Plate */}
                  <div className="relative w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-xl flex flex-col items-center justify-center p-1.5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.05)] z-10">
                    <span className="text-[8px] font-black font-mono text-slate-400 self-start leading-none absolute top-1.5 left-1.5">
                      {activeElementInfo.number}
                    </span>
                    <span className="text-2xl font-black text-white leading-none tracking-tight mt-1">
                      {activeElementInfo.symbol}
                    </span>
                    <span className={`text-[6.5px] px-1 py-0.1 select-none font-bold scale-90 uppercase tracking-widest rounded mt-1 text-center ${getStructLabelColor(activeElementInfo.crystalStructure)}`}>
                      {activeElementInfo.crystalStructure}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-semibold text-slate-300">Material Properties</span>
                  <button
                    onClick={() => {
                      setIsEditingElement(!isEditingElement);
                      playSynthTone('tick');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:text-white text-slate-300 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {isEditingElement ? "View Details" : "Edit Properties"}
                  </button>
                </div>

                {isEditingElement ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-sm font-medium text-slate-200">Property Editor</span>
                      <button
                        onClick={handleResetToStandard}
                        className="px-2.5 py-1 text-[10px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 rounded-md transition-colors cursor-pointer"
                        title="Revert all changes for this element to initial scientific constants"
                      >
                        Reset to Default
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {/* Name & Symbol */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">Element Name</label>
                          <input
                            type="text"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">Chemical Symbol</label>
                          <input
                            type="text"
                            value={formSymbol}
                            onChange={(e) => setFormSymbol(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors font-bold"
                          />
                        </div>
                      </div>

                      {/* Weight & Density */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">At. Weight (u)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={formWeight || ''}
                            onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">Density (g/cm³)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formDensity || ''}
                            onChange={(e) => setFormDensity(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>

                      {/* Crystal Structure Select */}
                      <div className="space-y-1 border-t border-slate-900/60 pt-2.5">
                        <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">Crystal Layout</label>
                        <select
                          value={formStructure}
                          onChange={(e) => setFormStructure(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors cursor-pointer font-bold"
                        >
                          {['BCC', 'FCC', 'HCP', 'Diamond', 'Cubic', 'Hexagonal', 'Orthorhombic', 'Rhombohedral', 'Tetragonal', 'Monoclinic', 'Amorphous'].map(str => (
                            <option key={str} value={str}>{str}</option>
                          ))}
                        </select>
                      </div>

                      {/* Space Group */}
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">Space Group</label>
                        <input
                          type="text"
                          value={formSpaceGroup}
                          onChange={(e) => setFormSpaceGroup(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors font-mono"
                        />
                      </div>

                      {/* Lattice Length constants */}
                      <div className="space-y-1 border-t border-slate-900/60 pt-2.5 font-sans">
                        <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400 flex justify-between">
                          <span>Lattice Length Metrics (Å)</span>
                          <span className="text-slate-500">Normal range 2.0 - 15.0</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-mono text-slate-500">a</span>
                            <input
                              type="number"
                              step="0.001"
                              value={formA || ''}
                              onChange={(e) => setFormA(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg p-2 text-xs outline-none transition-colors font-mono"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-mono text-slate-500">b (optional)</span>
                            <input
                              type="number"
                              step="0.001"
                              value={formB || ''}
                              onChange={(e) => setFormB(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg p-2 text-xs outline-none transition-colors font-mono"
                              placeholder="N/A"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-mono text-slate-500">c (optional)</span>
                            <input
                              type="number"
                              step="0.001"
                              value={formC || ''}
                              onChange={(e) => setFormC(e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg p-2 text-xs outline-none transition-colors font-mono"
                              placeholder="N/A"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Melting point & Electron config */}
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-900/60 pt-2.5">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">Melting Pt (°C)</label>
                          <input
                            type="number"
                            value={formMeltingPoint || ''}
                            onChange={(e) => setFormMeltingPoint(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-mono font-black tracking-wider text-slate-400">Elec. Config</label>
                          <input
                            type="text"
                            value={formElectronConfig}
                            onChange={(e) => setFormElectronConfig(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3">
                      <button
                        onClick={() => {
                          setIsEditingElement(false);
                          playSynthTone('tick');
                        }}
                        className="w-full py-2 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProperties}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-mono font-black uppercase tracking-wider rounded-lg shadow-md hover:shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Sub-tab navigation bar for detail views */}
                    <div className="flex bg-[#0B0F19] p-1.5 rounded-xl border border-white/5 gap-1 mt-1 justify-between shadow-inner relative isolate overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-fuchsia-500/5 to-emerald-500/0 pointer-events-none" />
                      {([
                        { id: 'lattice', label: 'Lattice', icon: Orbit, color: 'text-rose-400', activeBg: 'bg-rose-500/10 border-rose-500/20' },
                        { id: 'chemical', label: 'Chemical', icon: Sparkles, color: 'text-indigo-400', activeBg: 'bg-indigo-500/10 border-indigo-500/20' },
                        { id: 'physical', label: 'Physical', icon: Activity, color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/20' }
                      ] as const).map((tab) => {
                        const Icon = tab.icon;
                        const active = detailSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setDetailSubTab(tab.id);
                              playSynthTone('tick');
                            }}
                            className={`flex-[1] flex items-center justify-center gap-1.5 px-2 py-2 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg border-[0.5px] transition-all duration-300 cursor-pointer z-10 ${
                              active
                                ? `${tab.color} ${tab.activeBg} shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]`
                                : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.02]'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${active ? '' : 'opacity-70'}`} />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {detailSubTab === 'lattice' && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Animated 3D projection widget */}
                        <CrystallineLattice3D 
                          structure={activeElementInfo.crystalStructure}
                          a={activeElementInfo.a}
                          b={activeElementInfo.b}
                          c={activeElementInfo.c}
                          colorClass={categoryColor(activeElementInfo.category)}
                        />

                        {/* Deep Crystallographic Parameters */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Info className="w-3 text-slate-400" /> Lattice Constants
                          </span>

                          <div className="grid grid-cols-2 gap-3 bg-[#0B0F19] p-4 rounded-2xl border border-white/5 text-xs shadow-inner isolate relative">
                            <div className="absolute inset-x-0 -top-12 h-20 bg-indigo-500/5 blur-[30px] pointer-events-none" />
                            
                            <div className="space-y-0.5">
                              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Space Group:</div>
                              <div className="text-slate-300 font-medium text-[11px]">
                                {activeElementInfo.spaceGroup === 'Unknown' ? 'P-1 (No. 1)' : activeElementInfo.spaceGroup}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">X-Ray Density:</div>
                              <div className="text-emerald-400 font-medium text-[11px]">
                                {activeElementInfo.density.toFixed(3)} <span className="text-[9px] text-slate-500">g/cm³</span>
                              </div>
                            </div>

                            <div className="space-y-0.5 col-span-2 border-t border-white/5 pt-2 label-section">
                              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Crystal System & Angles:</div>
                              <div className="text-slate-300 font-medium text-[11px] tracking-tight flex justify-between">
                                <span className="text-indigo-300">{activeElementInfo.crystalStructure === 'BCC' ? 'Body-Centered Cubic (BCC)' : activeElementInfo.crystalStructure === 'FCC' ? 'Face-Centered Cubic (FCC)' : activeElementInfo.crystalStructure === 'HCP' ? 'Hexagonal Close-Packed (HCP)' : activeElementInfo.crystalStructure}</span>
                                <span>
                                  α={activeElementInfo.alpha || 90}°, β={activeElementInfo.beta || 90}°, γ={activeElementInfo.gamma || (activeElementInfo.crystalStructure === 'HCP' || activeElementInfo.crystalStructure === 'Hexagonal' ? 120 : 90)}°
                                </span>
                              </div>
                            </div>

                            <div className="space-y-0.5 col-span-2 border-t border-white/5 pt-2 label-section">
                              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Lattice Length (a, b, c):</div>
                              <div className="text-slate-300 font-medium text-[11px] tracking-tight">
                                a = {activeElementInfo.a.toFixed(3)} Å 
                                {activeElementInfo.b ? `, b = ${activeElementInfo.b.toFixed(3)} Å` : ''} 
                                {activeElementInfo.c ? `, c = ${activeElementInfo.c.toFixed(3)} Å` : ''}
                                <span className="ml-2 text-slate-500 text-[9px]">V ≈ {((activeElementInfo.a * (activeElementInfo.b || activeElementInfo.a) * (activeElementInfo.c || activeElementInfo.a)) * (activeElementInfo.crystalStructure === 'HCP' ? 0.866 : 1)).toFixed(2)} Å³</span>
                              </div>
                            </div>

                            <div className="space-y-0.5 col-span-2 border-t border-white/5 pt-2 label-section">
                              <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Melting Point / Configuration:</div>
                              <div className="text-[11px] space-x-1.5 flex items-center">
                                <span className="text-amber-400 font-medium">{activeElementInfo.meltingPoint.toFixed(1)} °C</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-300 font-medium">{getElectronConfig(activeElementInfo.number)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailSubTab === 'chemical' && (
                      <div className="space-y-3 animate-fadeIn">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Sparkles className="w-3 text-indigo-400" /> Chemical Properties (Scientific Facts)
                        </span>

                        <div className="space-y-4 bg-[#0B0F19]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-inner relative isolate overflow-hidden text-xs">
                          {/* Ambient glow for the chemical section */}
                          <div className="absolute inset-y-0 right-0 w-40 bg-indigo-500/5 blur-[40px] pointer-events-none" />
                          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[40px] pointer-events-none" />
                          
                          {/* Valence & Oxidation */}
                          <div className="grid grid-cols-2 gap-4 pb-1">
                            <div className="col-span-2 mb-2">
                              <ElectronCloud3D
                                electronConfig={getElectronConfig(activeElementInfo.number)}
                                atomicNumber={activeElementInfo.number}
                                colorClass={categoryColor(activeElementInfo.category)}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider">Valence e⁻</span>
                                <span className="text-white font-mono font-black">{activeElementInfo.valenceElectrons}</span>
                              </div>
                              <div className="h-2.5 bg-slate-900/80 rounded-full overflow-hidden flex gap-0.5 shadow-inner">
                                {Array.from({ length: 8 }).map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`h-full flex-1 rounded-sm transition-all duration-500 ${
                                      i < activeElementInfo.valenceElectrons 
                                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]' 
                                        : 'bg-white/5'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2 border-l border-white/5 pl-4">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider">Common Oxidation</span>
                              </div>
                              <div className="inline-flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md text-indigo-300 font-mono font-bold text-sm tracking-widest shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]">
                                {activeElementInfo.category === 'alkali' ? '+1' : 
                                 activeElementInfo.category === 'alkaline_earth' ? '+2' : 
                                 activeElementInfo.category === 'noble_gas' ? '0' : 
                                 activeElementInfo.category === 'nonmetal' || activeElementInfo.category === 'metalloid' ? `-${8 - activeElementInfo.valenceElectrons}, +${activeElementInfo.valenceElectrons}` : 
                                 `+2, +3, +${activeElementInfo.valenceElectrons}`}
                              </div>
                            </div>
                          </div>

                          {/* Block & Category Info */}
                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 pb-1">
                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Group & Period</span>
                              <div className="text-white font-bold font-mono text-[11px] uppercase tracking-widest flex items-center gap-1.5">
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">G{activeElementInfo.gridX}</span>
                                <span className="text-slate-600">•</span>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">P{activeElementInfo.gridY}</span>
                                <span className="text-slate-400 font-normal ml-1 border-l border-white/10 pl-2">
                                  {activeElementInfo.electronConfig.includes('f') ? 'f' : activeElementInfo.electronConfig.includes('d') ? 'd' : activeElementInfo.electronConfig.includes('p') ? 'p' : 's'}-block
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Chemical Series</span>
                              <div className="text-[#a8b8d8] font-bold font-mono text-[11px] truncate capitalize">
                                {activeElementInfo.category.replace('_', ' ')}
                              </div>
                            </div>
                          </div>

                          {/* Electronegativity (Pauling) */}
                          <div className="space-y-2 border-t border-white/5 pt-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-mono text-[9px] uppercase font-bold tracking-wider">Electronegativity (Pauling)</span>
                              <span className="text-amber-400 font-mono font-black text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                                {activeElementInfo.electronegativity > 0 ? activeElementInfo.electronegativity.toFixed(2) : 'N/A (Inert)'}
                              </span>
                            </div>
                            {activeElementInfo.electronegativity > 0 ? (
                              <div className="relative h-2.5 bg-slate-950 rounded-lg shadow-inner border border-white/5">
                                <div 
                                  className="absolute h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-lg shadow-[0_0_10px_rgba(249,115,22,0.8)]"
                                  style={{ width: `${Math.min(100, (activeElementInfo.electronegativity / 4.0) * 100)}%` }}
                                />
                                <span className="absolute -bottom-4 left-0 text-[8px] text-slate-500 font-bold">0.7 (Cs)</span>
                                <span className="absolute -bottom-4 right-0 text-[8px] text-slate-500 font-bold">4.0 (F)</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-500 italic bg-white/5 rounded-md p-1.5 border border-white/5">No electronegativity as valence shell is complete.</div>
                            )}
                          </div>

                          {/* Ionization Energy & Electron Affinity Row */}
                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-5 pb-1">
                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">1st Ionization Energy</span>
                              <div className="text-white font-bold font-mono text-sm flex items-baseline gap-1">
                                {activeElementInfo.ionizationEnergy.toFixed(3)}
                                <span className="text-[9px] text-indigo-400 font-bold">eV</span>
                              </div>
                            </div>
                            <div className="space-y-1.5 flex flex-col items-end text-right">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Electron Affinity</span>
                              <div className="text-white font-bold font-mono text-sm flex items-baseline gap-1">
                                {activeElementInfo.electronAffinity.toFixed(3)}
                                <span className="text-[9px] text-indigo-400 font-bold">eV</span>
                              </div>
                            </div>
                          </div>

                          {/* Metallic vs Non-metallic character */}
                          <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
                            <div className="bg-[#0B0F19] p-3 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center shadow-inner relative overflow-hidden">
                              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5 z-10">Metallic Ch.</span>
                              <span className={`text-xs font-black uppercase tracking-widest z-10 ${
                                activeElementInfo.metallicCharacter === 'Very High' || activeElementInfo.metallicCharacter === 'High'
                                  ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                                  : activeElementInfo.metallicCharacter === 'Moderate'
                                  ? 'text-teal-400'
                                  : 'text-slate-500'
                              }`}>
                                {activeElementInfo.metallicCharacter}
                              </span>
                              {(activeElementInfo.metallicCharacter === 'Very High' || activeElementInfo.metallicCharacter === 'High') && (
                                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-emerald-500/10 blur-[15px]" />
                              )}
                            </div>
                            <div className="bg-[#0B0F19] p-3 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center shadow-inner relative overflow-hidden">
                              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5 z-10">Non-Metallic Ch.</span>
                              <span className={`text-xs font-black uppercase tracking-widest z-10 ${
                                activeElementInfo.nonMetallicCharacter === 'Extreme' || activeElementInfo.nonMetallicCharacter === 'Very High' || activeElementInfo.nonMetallicCharacter === 'High'
                                  ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]'
                                  : activeElementInfo.nonMetallicCharacter === 'Moderate'
                                  ? 'text-pink-400'
                                  : 'text-slate-500'
                              }`}>
                                {activeElementInfo.nonMetallicCharacter}
                              </span>
                              {(activeElementInfo.nonMetallicCharacter === 'Extreme' || activeElementInfo.nonMetallicCharacter === 'Very High' || activeElementInfo.nonMetallicCharacter === 'High') && (
                                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-rose-500/10 blur-[15px]" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailSubTab === 'physical' && (
                      <div className="space-y-3 animate-fadeIn">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Activity className="w-3 text-emerald-400" /> Physical Properties (Scientific Facts)
                        </span>

                        <div className="space-y-4 bg-[#0B0F19]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-inner relative isolate overflow-hidden text-xs text-slate-200">
                          {/* Ambient glow for the physical section */}
                          <div className="absolute inset-y-0 right-0 w-40 bg-emerald-500/5 blur-[40px] pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 h-40 bg-teal-500/5 blur-[40px] pointer-events-none" />
                          
                          {/* Standard State & Molar Mass */}
                          <div className="grid grid-cols-2 gap-4 pb-1">
                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Standard State (STP)</span>
                              <div className="text-white font-bold font-mono text-[13px] flex items-baseline gap-1">
                                {(() => {
                                  if (activeElementInfo.number === 35 || activeElementInfo.number === 80) return <span className="text-blue-400">Liquid</span>;
                                  if ([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86].includes(activeElementInfo.number)) return <span className="text-sky-300">Gas</span>;
                                  return <span className="text-slate-300">Solid</span>;
                                })()}
                              </div>
                            </div>
                            <div className="space-y-1.5 flex flex-col items-end text-right">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Molar Mass</span>
                              <div className="text-rose-300 font-bold font-mono text-sm leading-tight flex items-baseline gap-1">
                                {activeElementInfo.weight.toFixed(3)}
                                <span className="text-[9px] text-slate-500 font-normal">g/mol</span>
                              </div>
                            </div>
                          </div>

                          {/* Atomic & Ionic Radius */}
                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 pb-1">
                            <div className="space-y-1.5">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Atomic Radius</span>
                              <div className="text-white font-bold font-mono text-sm flex items-baseline gap-1">
                                {activeElementInfo.atomicRadius}
                                <span className="text-[9px] text-emerald-400/70 font-bold">pm</span>
                              </div>
                            </div>
                            <div className="space-y-1.5 flex flex-col items-end text-right">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Ionic Radius</span>
                              <div className="text-sky-300 font-bold font-mono text-sm leading-tight">
                                {activeElementInfo.ionicRadius}
                              </div>
                            </div>
                          </div>

                          {/* Melting & Boiling Points */}
                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 pb-1">
                            <div className="space-y-1.5 border-l-2 border-amber-500/30 pl-3">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Melting Point</span>
                              <div className="text-amber-400 font-bold font-mono text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                                {activeElementInfo.meltingPoint > -273.15 ? `${activeElementInfo.meltingPoint.toFixed(1)} °C` : 'N/A'}
                              </div>
                            </div>
                            <div className="space-y-1.5 border-l-2 border-rose-500/30 pl-3">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Boiling Point</span>
                              <div className="text-rose-450 font-bold font-mono text-sm drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                                {activeElementInfo.boilingPoint > -273.15 ? `${activeElementInfo.boilingPoint.toFixed(1)} °C` : 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Density & Electron Config */}
                          <div className="grid grid-cols-2 gap-3 border-t border-slate-900/60 pt-3">
                            <div className="space-y-1">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Scientific Density</span>
                              <div className="text-emerald-400 font-semibold font-mono text-sm flex items-baseline gap-1">
                                {activeElementInfo.density.toFixed(3)}
                                <span className="text-[8px] text-slate-500 font-normal">g/cm³</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Configuration</span>
                              <div className="text-slate-300 font-bold font-mono text-[10px] truncate" title={getElectronConfig(activeElementInfo.number)}>
                                {getElectronConfig(activeElementInfo.number)}
                              </div>
                            </div>
                          </div>

                          {/* Conductivities */}
                          <div className="grid grid-cols-2 gap-3 border-t border-slate-900/60 pt-3">
                            <div className="space-y-1">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Elect. Conductivity</span>
                              <div className="text-sky-400 font-bold font-mono text-sm flex items-baseline gap-1">
                                {activeElementInfo.electricalConductivity > 0 
                                  ? activeElementInfo.electricalConductivity >= 1
                                    ? activeElementInfo.electricalConductivity.toFixed(2)
                                    : activeElementInfo.electricalConductivity.toExponential(2)
                                  : '0'}
                                <span className="text-[8px] text-slate-500 font-normal">MS/m</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wider">Thermal Conductivity</span>
                              <div className="text-teal-400 font-bold font-mono text-sm flex items-baseline gap-1">
                                {activeElementInfo.thermalConductivity.toFixed(1)}
                                <span className="text-[8px] text-slate-500 font-normal">W/m·K</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Celebrated Crystal Alloys / Compounds section */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3 text-slate-400" /> Famous Isomorphous Compounds
                  </span>

                  {activeElementInfo.famousCompounds && activeElementInfo.famousCompounds.length > 0 ? (
                    <div className="space-y-3">
                      {activeElementInfo.famousCompounds.map((comp, cIdx) => (
                        <div 
                          key={cIdx} 
                          className="bg-slate-950/50 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl space-y-2.5 transition-all duration-200 shadow-sm relative group/comp"
                        >
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <div>
                              <div className="text-sm font-bold text-rose-400 tracking-wide">{comp.formula}</div>
                              <div className="text-[10px] font-medium text-slate-400">{comp.name}</div>
                            </div>
                            
                            <button
                              onClick={() => handleLoadPeaks(comp)}
                              className="text-[10px] bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-200 hover:text-white font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                              title="Simulate this compound's diffraction spectrum in XRD spectrometer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              Graph Peaks
                            </button>
                          </div>
                          
                          <p className="text-[11px] text-slate-400 leading-normal">{comp.shortDesc}</p>
                          
                          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                            <table className="w-full font-mono text-[9px]">
                              <tbody>
                                <tr>
                                  <td className="py-0.5 text-slate-500">Symmetry System:</td>
                                  <td className="py-0.5 text-right text-slate-300 font-medium">{comp.crystalSystem} ({comp.spaceGroup})</td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 text-slate-500">Lattice Constants:</td>
                                  <td className="py-0.5 text-right text-slate-300">
                                    a={comp.latticeParams.a.toFixed(2)}
                                    {comp.latticeParams.b ? `, b=${comp.latticeParams.b.toFixed(2)}` : ''}
                                    {comp.latticeParams.c ? `, c=${comp.latticeParams.c.toFixed(2)}` : ''}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 text-slate-500">Primary Peak 2θ:</td>
                                  <td className="py-0.5 text-right text-emerald-400 font-medium">
                                    {comp.typicalPeaks[0]?.twoTheta.toFixed(2)}° (Int: 100%)
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-800/80 pt-2">
                            <span className="font-medium uppercase tracking-wider text-[9px] text-slate-500 block mb-0.5">XRD Relevance</span>
                            {comp.relevance}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-800 p-6 rounded-xl text-center bg-slate-950/40">
                      <HelpCircle className="w-8 h-8 text-slate-700 animate-pulse mx-auto mb-2" />
                      <p className="text-[11px] font-bold text-slate-400">No Complex Compounds Defined</p>
                      <p className="text-[9px] text-slate-500 max-w-[200px] mx-auto mt-1 leading-normal">
                        This element acts primarily as an alloy interstitial or alloying additive. Choose Diamond Carbon, Silicon, Iron, or Copper to view modeled structures.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-900 border border-slate-850 aspect-auto rounded-2xl p-6 text-center text-slate-500 flex flex-col justify-center h-full min-h-[350px]">
                <Activity className="w-10 h-10 text-slate-700 animate-pulse mx-auto mb-3" />
                <span className="font-bold uppercase tracking-wider text-slate-400 text-xs">No Element Selected</span>
                <span className="text-[10px] text-slate-500 max-w-[180px] mx-auto mt-1 leading-normal">
                  Select an element box in the grid representation to view deep crystal constants and XRD properties.
                </span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  ) : (
    <div className="space-y-6">
      {/* Top Panel: Comparables Selector Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        {/* Subject A selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block">Compare Material A</label>
          <select
            value={compareSubjectAId}
            onChange={(e) => {
              setCompareSubjectAId(e.target.value);
              playSynthTone('switch');
            }}
            className="w-full bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl py-3 px-4 text-xs font-medium outline-none transition-colors cursor-pointer"
          >
            {compareItems.map(it => (
              <option key={`a-${it.id}`} value={it.id}>
                [{it.symbolOrFormula}] {it.name}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-medium">
            {subjectA?.info}
          </div>
        </div>

        {/* Subject B selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 block">Compare Material B</label>
          <select
            value={compareSubjectBId}
            onChange={(e) => {
              setCompareSubjectBId(e.target.value);
              playSynthTone('switch');
            }}
            className="w-full bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl py-3 px-4 text-xs font-medium outline-none transition-colors cursor-pointer"
          >
            {compareItems.map(it => (
              <option key={`b-${it.id}`} value={it.id}>
                [{it.symbolOrFormula}] {it.name}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-medium">
            {subjectB?.info}
          </div>
        </div>
      </div>

      {/* Central Grid: Radar Chart and Detailed Matrix side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Radar Chart (Col span 7) */}
        <div className="col-span-1 lg:col-span-12 xl:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl min-h-[440px]">
          <div className="border-b border-slate-800/80 pb-3 mb-2 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-widest uppercase">Crystallographic Fingerprint</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-1">Projection comparing physical properties</p>
            </div>
            <div className="flex gap-2.5">
              <span className="text-[10px] px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 font-medium border border-indigo-500/25">
                {subjectA?.symbolOrFormula}
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 font-medium border border-rose-500/25">
                {subjectB?.symbolOrFormula}
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center py-4 bg-slate-950/20 rounded-xl border border-slate-850/30 my-2">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={currentCompareData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis 
                  dataKey="label" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={false} 
                  stroke="#0f172a" 
                />
                <Radar
                  name={`[${subjectA?.symbolOrFormula}] ${subjectA?.name.replace(' (Element)', '').replace(' (Compound)', '')}`}
                  dataKey={subjectA?.symbolOrFormula || 'SubjectA'}
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="#6366f1"
                  fillOpacity={0.25}
                />
                <Radar
                  name={`[${subjectB?.symbolOrFormula}] ${subjectB?.name.replace(' (Element)', '').replace(' (Compound)', '')}`}
                  dataKey={subjectB?.symbolOrFormula || 'SubjectB'}
                  stroke="#ec4899"
                  strokeWidth={2}
                  fill="#ec4899"
                  fillOpacity={0.25}
                />
                <Legend wrapperStyle={{ color: '#f8fafc', fontSize: '10px', marginTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Parameter comparison Matrix (Col span 5) */}
        <div className="col-span-1 lg:col-span-12 xl:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-xs font-black text-white tracking-widest uppercase border-b border-slate-800/80 pb-3 mb-4">
              Comparison Matrix
            </h3>

            <div className="space-y-4">
              {currentCompareData.map((row, idx) => {
                const valA = parseFloat(row.aRawValue);
                const valB = parseFloat(row.bRawValue);
                const isHigherA = row.property === 'Primary Peak' 
                  ? false 
                  : valA > valB;
                const isHigherB = row.property === 'Primary Peak' 
                  ? false 
                  : valB > valA;

                return (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest font-black">
                      <span>{row.property}</span>
                      <span className="text-[8px] text-indigo-500/85">Relative Scaling</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Subject A column */}
                      <div className={`p-2 rounded-lg border ${
                        isHigherA ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-slate-900/40 border-slate-900'
                      }`}>
                        <div className="text-[9px] text-slate-500 uppercase">A: {subjectA?.symbolOrFormula}</div>
                        <div className={`text-sm font-black mt-1 ${isHigherA ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {row.aRawValue}
                        </div>
                      </div>

                      {/* Subject B column */}
                      <div className={`p-2 rounded-lg border ${
                        isHigherB ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900/40 border-slate-900'
                      }`}>
                        <div className="text-[9px] text-slate-500 uppercase">B: {subjectB?.symbolOrFormula}</div>
                        <div className={`text-sm font-black mt-1 ${isHigherB ? 'text-rose-400' : 'text-slate-300'}`}>
                          {row.bRawValue}
                        </div>
                      </div>
                    </div>

                    {/* Differential comparison sentence helper */}
                    <div className="text-[9.5px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between items-center font-bold">
                      {row.property === 'Primary Peak' ? (
                        <span>Angle Offset: {Math.abs((subjectA?.primaryPeak || 0) - (subjectB?.primaryPeak || 0)).toFixed(2)}° 2θ</span>
                      ) : isHigherA ? (
                        <span className="text-indigo-400/85">{subjectA?.symbolOrFormula} is {(valA / (valB || 1)).toFixed(2)}x denser/larger</span>
                      ) : isHigherB ? (
                        <span className="text-rose-400/85">{subjectB?.symbolOrFormula} is {(valB / (valA || 1)).toFixed(2)}x denser/larger</span>
                      ) : (
                        <span className="text-slate-500">Values are structurally equal</span>
                      )}
                      <span className="text-[8px] px-1 bg-slate-900 rounded font-bold text-slate-400 uppercase tracking-tight">
                        Diff
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-805/60">
            <span className="text-[9.5px] text-slate-500 leading-normal font-semibold">
              * Dynamic crystallographic properties extracted directly from chemical database records.
            </span>
          </div>
        </div>
      </div>
    </div>
  )}
    </div>
  );
};
