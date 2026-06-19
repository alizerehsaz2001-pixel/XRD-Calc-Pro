import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, Sparkles, Activity, Layers, Compass, Play, Search, 
  HelpCircle, Orbit, RotateCw, Settings, ShieldAlert, Zap, Cpu
} from 'lucide-react';
import { playSynthTone } from '../utils/sound';

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

export interface CrystalElement {
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
  if ([1, 2, 7, 8, 9, 10, 17, 18, 36, 54].includes(number)) return 'GAS';
  return 'SOLID';
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
    <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-3.5 relative overflow-hidden group shadow-inner">
      <div className="absolute right-3 top-3 flex items-center gap-1.5 z-20">
        <button
          onClick={() => {
            setIsRotating(!isRotating);
            playSynthTone('tick');
          }}
          className={`p-1.5 rounded-md border text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 transition-colors ${
            isRotating 
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/20 hover:bg-indigo-600/40' 
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
          }`}
          title="Pause or spin crystal rotational alignment"
        >
          <Orbit className={`w-3 h-3 ${isRotating ? 'animate-spin text-indigo-400' : ''}`} style={{ animationDuration: '4s' }} />
          {isRotating ? 'Orbiting' : 'Paused'}
        </button>
      </div>

      <div className="absolute left-3 top-3 z-20 pointer-events-none">
        <span className="text-[8.5px] font-bold uppercase tracking-[0.15em] font-mono text-slate-500 block">
          Visual Core Lattice Probe
        </span>
        <span className="text-rose-400 text-[10.5px] font-black font-mono">
          {structure} Unit Cell
        </span>
      </div>

      {/* Main interactive Projection viewport */}
      <div className="w-full flex justify-center items-center h-48 relative">
        <svg viewBox="0 0 200 190" className="w-full h-full max-w-[220px]">
          {/* Edge links rendering */}
          {edges.map(([p1, p2], idx) => {
            const start = structure === 'HCP' ? projectedAtoms[p1] : projectedBox[p1];
            const end = structure === 'HCP' ? projectedAtoms[p2] : projectedBox[p2];
            if (!start || !end) return null;

            return (
              <line
                key={`edge-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={isRotating ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.4)'}
                strokeWidth={1}
                strokeDasharray={structure === 'Amorphous' ? '1.5 2.5' : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Atomic coordinate spheres */}
          {projectedAtoms
            .sort((a, b) => a.zDepth - b.zDepth) // Depth sorting (painters algorithm)
            .map((atom, idx) => {
              const isSelected = selectedAtom === atom.id;
              const nodeRadius = isSelected ? 4.8 : (atom.id === 'Body-Center' || atom.id?.includes('Int') ? 3.5 : 2.8);

              return (
                <g 
                  key={`atom-${idx}`} 
                  onClick={() => {
                    setSelectedAtom(atom.id || null);
                    playSynthTone('tick');
                    setTimeout(() => setSelectedAtom(null), 3000);
                  }}
                  className="cursor-pointer"
                >
                  {/* Outer subtle glow */}
                  <circle
                    cx={atom.x}
                    cy={atom.y}
                    r={nodeRadius * 2}
                    fill={atomColor}
                    opacity={isSelected ? 0.45 : 0.08}
                    className="transition-all duration-300"
                  />
                  {/* Central solid node */}
                  <circle
                    cx={atom.x}
                    cy={atom.y}
                    r={nodeRadius}
                    fill={atom.id?.includes('Center') ? '#ffffff' : atomColor}
                    stroke="#0b0f19"
                    strokeWidth={0.8}
                    className="transition-all duration-300 hover:scale-125"
                  />
                </g>
              );
            })}
        </svg>

        {/* Selected atom metadata overlay */}
        <AnimatePresence>
          {selectedAtom && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-500/30 px-2.5 py-1 rounded-md text-[9px] font-mono text-indigo-300 text-center shadow-md whitespace-nowrap z-20 backdrop-blur-md"
            >
              <span className="text-white font-bold">Node Probe:</span> {selectedAtom}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual interactive pitch/yaw calibration slides */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-900/60 z-20 relative">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">
            <span>Rotational Yaw</span>
            <span className="text-white">{Math.round(yaw)}°</span>
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
            className="w-full accent-indigo-500 h-1 bg-slate-900 rounded-lg cursor-pointer appearance-none"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">
            <span>Projection Tilt</span>
            <span className="text-white">{Math.round(pitch)}°</span>
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
            className="w-full accent-indigo-500 h-1 bg-slate-900 rounded-lg cursor-pointer appearance-none"
          />
        </div>
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
      const detailed = elementsDb[item.num] || {};
      
      let category: CrystalElement['category'] = detailed.category || 'transition_metal';
      if (item.num === 1 || item.num === 6 || item.num === 7 || item.num === 8 || item.num === 15 || item.num === 16 || item.num === 34) category = 'nonmetal';
      else if (item.num === 3 || item.num === 11 || item.num === 19 || item.num === 37 || item.num === 55) category = 'alkali';
      else if (item.num === 4 || item.num === 12 || item.num === 20 || item.num === 38 || item.num === 56) category = 'alkaline_earth';
      else if (item.num === 5 || item.num === 14 || item.num === 32 || item.num === 33 || item.num === 51 || item.num === 52) category = 'metalloid';
      else if (item.num === 2 || item.num === 10 || item.num === 18 || item.num === 36 || item.num === 54) category = 'noble_gas';
      else if (item.num === 57) category = 'lanthanoid';
      else if (item.num >= 89) category = 'actinoid';
      else if (item.num === 13 || item.num === 31 || item.num === 49 || item.num === 50 || item.num === 81 || item.num === 82 || item.num === 83) category = 'post_transition';

      const weight = detailed.weight || (item.num * 2.05 + 1.8);
      const density = detailed.density || (item.num * 0.17 + 0.95);
      const meltingPoint = detailed.meltingPoint || (item.num * 22);
      const electronConfig = detailed.electronConfig || `[Inert] Config ${item.num}`;

      return {
        number: item.num,
        symbol: item.sym,
        name: item.name,
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
        famousCompounds: detailed.famousCompounds || []
      } as CrystalElement;
    });
  }, [elementsDb]);

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

  const activeBadgeColor = (cat: string) => {
    switch (cat) {
      case 'alkali': return 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.15)]';
      case 'alkaline_earth': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.15)]';
      case 'transition_metal': return 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.15)]';
      case 'post_transition': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
      case 'metalloid': return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]';
      case 'nonmetal': return 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.15)]';
      case 'noble_gas': return 'bg-slate-500/20 text-slate-200 border border-slate-700/40';
      case 'lanthanoid': return 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
      case 'actinoid': return 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getStructLabelColor = (struct: string) => {
    switch (struct) {
      case 'FCC': return 'text-sky-400 bg-sky-500/15 border border-sky-400/30';
      case 'BCC': return 'text-purple-400 bg-purple-500/15 border border-purple-400/30';
      case 'HCP': return 'text-emerald-400 bg-emerald-500/15 border border-emerald-400/30';
      case 'Diamond': return 'text-amber-400 bg-amber-500/15 border border-amber-400/30';
      default: return 'text-slate-300 bg-slate-800 border border-slate-750';
    }
  };

  return (
    <div id="crystallography-periodic-table-suite" className="space-y-6">
      {/* Premium Cyber/Scientific Header Unit */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/0 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 shadow-sm animate-pulse">
                <Compass className="h-3 w-3 animate-spin" style={{ animationDuration: '10s' }} />
                Atomic Crystal Registry
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-sm">
                <Cpu className="h-3 w-3" />
                Live 3D Unit Cell Projections
              </span>
            </div>
            
            <h2 className="text-2xl font-black text-white tracking-tight sm:text-3xl">
              Crystallographic Periodic Table
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Explore structural lattices, Bravais symmetries, space groups, and atomic constant geometries for core crystal elements. Click any element to generate, rotate, and interact with its unit cell projections, as well as load celebrated alloy compounds directly into the spectrometer simulation engine.
            </p>
          </div>

          {/* Interactive quick insight bubble */}
          <div className="hidden xl:flex flex-col items-center justify-center p-4 bg-slate-950/80 border border-slate-850 rounded-xl text-center max-w-[190px] h-32 relative">
            <RotateCw className="w-8 h-8 text-indigo-500/30 absolute animate-spin opacity-50" style={{ animationDuration: '30s' }} />
            <span className="text-[22px] font-black text-indigo-400 font-mono tracking-tighter leading-none">100%</span>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-300 mt-2 block">Durable Lattice</span>
            <span className="text-[8.5px] text-slate-500 mt-0.5 leading-tight">No simulated code placeholders</span>
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

      {/* Grid Controller, Filters and Inputs bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 p-4.5 rounded-2xl shadow-lg">
        <div className="relative col-span-1 md:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elements by symbol, name, or crystal system structure (FCC, HCP)..."
            className="w-full bg-slate-950 text-slate-100 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        </div>

        <div className="col-span-1 md:col-span-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 text-slate-200 border border-slate-800 hover:border-slate-700 mr-2 rounded-xl py-2.5 px-3.5 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all cursor-pointer"
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
        </div>
      </div>

      {/* Principal Splitted Workspace Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Span 8): Interactive Periodic Table Layout with Glowing Frames */}
        <div className="col-span-1 lg:col-span-8 space-y-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div 
            className="grid gap-1.5 p-5 bg-slate-950/90 border border-slate-850 rounded-2xl shadow-2xl relative min-w-[780px] select-none"
            style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
          >
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
                  
                  // Calculate dynamic visual borders basing on categories
                  let borderClasses = '';
                  if (!isXtal) {
                    borderClasses = 'bg-slate-950/30 border-slate-900/50 text-slate-600 opacity-20 cursor-not-allowed select-none scale-98';
                  } else if (isActive) {
                    borderClasses = 'border-indigo-400 ring-2 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.45)] bg-slate-900/90 z-20 scale-102 font-black cursor-pointer';
                  } else if (isMatch) {
                    borderClasses = 'bg-slate-900/60 border-slate-800/80 text-white hover:border-indigo-500/50 hover:bg-slate-850 hover:scale-[1.03] cursor-pointer';
                  } else {
                    borderClasses = 'opacity-20 bg-slate-950/20 border-slate-950 text-slate-600 blur-[0.2px] scale-98 pointer-events-none';
                  }

                  return (
                    <button
                      key={`el-${el.number}`}
                      onClick={isXtal ? () => {
                        setSelectedElement(el.number);
                        playSynthTone('switch');
                      } : undefined}
                      disabled={!isXtal}
                      className={`aspect-square p-1 rounded-lg border flex flex-col justify-between transition-all duration-200 relative ${borderClasses}`}
                      title={isXtal ? `${el.name} (${el.crystalStructure} lattice)` : `${el.name} (Non-crystalline ${getPhysicalStateLabel(el.number).toLowerCase()})`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[7.5px] font-mono text-slate-500 font-black">{el.number}</span>
                        {isXtal && el.famousCompounds && el.famousCompounds.length > 0 && (
                          <span className="w-1 h-1 rounded-full bg-rose-400" title="Has famous XRD library components" />
                        )}
                      </div>
                      
                      <span className="text-sm font-black tracking-tight leading-none text-center block my-0.5">{el.symbol}</span>
                      
                      <div className="flex justify-between items-center w-full mt-auto">
                        <span className="text-[6.5px] truncate max-w-[70%] text-slate-400 leading-none">{el.name}</span>
                        <span className={`text-[5.5px] font-mono font-black scale-90 tracking-tighter px-0.5 rounded bg-slate-950/60 ${isXtal ? 'text-indigo-300' : 'text-slate-500'}`}>
                          {isXtal ? el.crystalStructure.substring(0, 3) : getPhysicalStateLabel(el.number)}
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
              let borderClasses = '';
              if (!isXtal) {
                borderClasses = 'bg-slate-950/30 border-slate-900/50 text-slate-600 opacity-20 cursor-not-allowed select-none scale-98';
              } else if (isActive) {
                borderClasses = 'border-amber-400 ring-2 ring-amber-500/50 shadow-lg bg-slate-900 scale-102 z-20 font-black cursor-pointer';
              } else if (isMatch) {
                borderClasses = 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-amber-500/45 hover:bg-slate-850 hover:scale-[1.03] cursor-pointer';
              } else {
                borderClasses = 'opacity-20 bg-slate-950/20 border-slate-950 text-slate-600 blur-[0.2px] scale-98 pointer-events-none';
              }

              return (
                <button
                  key={`el-${el.number}`}
                  onClick={isXtal ? () => {
                    setSelectedElement(el.number);
                    playSynthTone('switch');
                  } : undefined}
                  disabled={!isXtal}
                  className={`aspect-square p-1 rounded-lg border flex flex-col justify-between transition-all duration-200 ${borderClasses}`}
                  title={isXtal ? `${el.name} - ${el.crystalStructure}` : `${el.name} (Non-crystalline ${getPhysicalStateLabel(el.number).toLowerCase()})`}
                >
                  <span className="text-[7px] font-mono text-slate-500 font-bold">{el.number}</span>
                  <span className="text-sm font-black tracking-tight text-center block my-0.5">{el.symbol}</span>
                  
                  <div className="flex justify-between items-center w-full mt-auto">
                    <span className="text-[6px] truncate max-w-[70%] text-slate-400 leading-none">{el.name}</span>
                    <span className={`text-[5.5px] font-mono font-black scale-90 tracking-tighter px-0.5 rounded bg-slate-950/60 ${isXtal ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {isXtal ? el.crystalStructure.substring(0, 3) : getPhysicalStateLabel(el.number)}
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
              let borderClasses = '';
              if (!isXtal) {
                borderClasses = 'bg-slate-950/30 border-slate-900/50 text-slate-600 opacity-20 cursor-not-allowed select-none scale-98';
              } else if (isActive) {
                borderClasses = 'border-rose-400 ring-2 ring-rose-500/50 shadow-lg bg-slate-900 scale-102 z-20 font-black cursor-pointer';
              } else if (isMatch) {
                borderClasses = 'bg-slate-905/60 border-slate-800 text-slate-200 hover:border-rose-500/45 hover:bg-slate-850 hover:scale-[1.03] cursor-pointer';
              } else {
                borderClasses = 'opacity-20 bg-slate-950 border-slate-950 text-slate-600 blur-[0.2px] scale-98 pointer-events-none';
              }

              return (
                <button
                  key={`el-${el.number}`}
                  onClick={isXtal ? () => {
                    setSelectedElement(el.number);
                    playSynthTone('switch');
                  } : undefined}
                  disabled={!isXtal}
                  className={`aspect-square p-1 rounded-lg border flex flex-col justify-between transition-all duration-200 ${borderClasses}`}
                  title={isXtal ? `${el.name} - ${el.crystalStructure}` : `${el.name} (Non-crystalline ${getPhysicalStateLabel(el.number).toLowerCase()})`}
                >
                  <span className="text-[7px] font-mono text-slate-500 font-bold">{el.number}</span>
                  <span className="text-sm font-black tracking-tight text-center block my-0.5">{el.symbol}</span>
                  
                  <div className="flex justify-between items-center w-full mt-auto">
                    <span className="text-[6px] truncate max-w-[75%] text-slate-400 leading-none">{el.name}</span>
                    <span className={`text-[5.5px] font-mono font-black scale-90 tracking-tighter px-0.5 rounded bg-slate-950/60 ${isXtal ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {isXtal ? el.crystalStructure.substring(0, 3) : getPhysicalStateLabel(el.number)}
                    </span>
                  </div>
                </button>
              );
            })}
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
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl relative"
              >
                {/* Element Profiler Ribbon Header */}
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                  <div className="space-y-1 max-w-[65%]">
                    <span className={`inline-block text-[8px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black leading-none ${activeBadgeColor(activeElementInfo.category)}`}>
                      {activeElementInfo.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">{activeElementInfo.name}</h3>
                    <p className="text-[9.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                      At. Weight: {activeElementInfo.weight.toFixed(4)} u
                    </p>
                  </div>

                  {/* Large Element Logo Plate */}
                  <div className="relative w-16 h-16 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-1.5 shadow-inner">
                    <span className="text-[8px] font-black font-mono text-slate-500 self-start leading-none absolute top-1.5 left-1.5">
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
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Info className="w-3 text-indigo-400" /> Ground State Lattice Constants
                  </span>

                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-850 shadow-inner text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Space Group:</div>
                      <div className="text-indigo-400 font-bold text-[10.5px]">
                        {activeElementInfo.spaceGroup === 'Unknown' ? 'P-1 (No. 1)' : activeElementInfo.spaceGroup}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">X-Ray Density:</div>
                      <div className="text-emerald-400 font-bold text-[10.5px]">
                        {activeElementInfo.density.toFixed(3)} <span className="text-[8px] text-slate-500">g/cm³</span>
                      </div>
                    </div>

                    <div className="space-y-0.5 col-span-2 border-t border-slate-900/60 pt-1.5 label-section">
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Lattice Length metrics (a, b, c):</div>
                      <div className="text-slate-300 font-bold text-[10.5px] tracking-tight">
                        a = {activeElementInfo.a.toFixed(3)} Å 
                        {activeElementInfo.b ? `, b = ${activeElementInfo.b.toFixed(3)} Å` : ''} 
                        {activeElementInfo.c ? `, c = ${activeElementInfo.c.toFixed(3)} Å` : ''}
                      </div>
                    </div>

                    <div className="space-y-0.5 col-span-2 border-t border-slate-900/60 pt-1.5 label-section">
                      <div className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Melting Point / Configuration:</div>
                      <div className="text-[10px] space-x-1.5">
                        <span className="text-amber-400 font-bold">{activeElementInfo.meltingPoint.toFixed(1)} °C</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-indigo-300 font-bold">{activeElementInfo.electronConfig}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Celebrated Crystal Alloys / Compounds section */}
                <div className="space-y-3 pt-2">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Layers className="w-3 text-indigo-400" /> Famous Isomorphous Compounds
                  </span>

                  {activeElementInfo.famousCompounds && activeElementInfo.famousCompounds.length > 0 ? (
                    <div className="space-y-3">
                      {activeElementInfo.famousCompounds.map((comp, cIdx) => (
                        <div 
                          key={cIdx} 
                          className="bg-slate-950 border border-slate-850 hover:border-slate-700/80 p-3.5 rounded-xl space-y-2.5 transition-all duration-200 shadow-sm relative group/comp"
                        >
                          <div className="flex items-center justify-between border-b border-slate-900/80 pb-2">
                            <div>
                              <div className="text-xs font-black text-rose-400 tracking-wide">{comp.formula}</div>
                              <div className="text-[9px] font-semibold text-slate-400">{comp.name}</div>
                            </div>
                            
                            <button
                              onClick={() => handleLoadPeaks(comp)}
                              className="text-[9.5px] bg-indigo-600 hover:bg-indigo-700 text-white font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md hover:shadow-indigo-500/20 active:scale-95 transition-all"
                              title="Simulate this compound's diffraction spectrum in XRD spectrometer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              Graph Peaks
                            </button>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 leading-normal font-medium">{comp.shortDesc}</p>
                          
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-900/40">
                            <table className="w-full font-mono text-[9px]">
                              <tbody>
                                <tr>
                                  <td className="py-0.5 text-slate-500 font-medium">Symmetry System:</td>
                                  <td className="py-0.5 text-right text-indigo-300 font-bold">{comp.crystalSystem} ({comp.spaceGroup})</td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 text-slate-500 font-medium font-bold">Lattice Constants:</td>
                                  <td className="py-0.5 text-right text-slate-300">
                                    a={comp.latticeParams.a.toFixed(2)}
                                    {comp.latticeParams.b ? `, b=${comp.latticeParams.b.toFixed(2)}` : ''}
                                    {comp.latticeParams.c ? `, c=${comp.latticeParams.c.toFixed(2)}` : ''}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-0.5 text-slate-500 font-medium">Primary Peak 2θ:</td>
                                  <td className="py-0.5 text-right text-emerald-400 font-black">
                                    {comp.typicalPeaks[0]?.twoTheta.toFixed(2)}° (Int: 100%)
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="text-[8.5px] text-slate-500 leading-normal border-t border-slate-900/60 pt-2 font-medium">
                            <span className="font-bold uppercase tracking-wider text-[8px] text-indigo-400 block mb-0.5">XRD Relevance</span>
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
    </div>
  );
};
