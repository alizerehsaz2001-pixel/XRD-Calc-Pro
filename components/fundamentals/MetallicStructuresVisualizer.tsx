import React, { useState, useMemo } from 'react';
import { 
  Atom, 
  Rotate3d, 
  Layers, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  ShieldCheck,
  Calculator,
  ChevronRight
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export type MetallicStructureType = 'bcc' | 'fcc' | 'hcp';

export interface MetallicStructureData {
  id: MetallicStructureType;
  name: string;
  shortName: string;
  fullName: string;
  crystalSystem: string;
  spaceGroup: string;
  netAtomsPerCell: string;
  coordinationNumber: number;
  apf: string;
  apfValue: number;
  apfExactFormula: string;
  apfProofSteps: { step: string; expr: string }[];
  atomicRadiusRelation: string;
  slipSystems: string;
  stackingSequence: string;
  ductilityProfile: string;
  examples: string[];
  description: string;
}

export const METALLIC_STRUCTURES: MetallicStructureData[] = [
  {
    id: 'bcc',
    name: 'Body-Centred Cubic',
    shortName: 'BCC',
    fullName: 'Body-Centred Cubic (BCC / cI)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m (#229)',
    netAtomsPerCell: '2 net atoms (8 × ⅛ corner + 1 center)',
    coordinationNumber: 8,
    apf: '68.02% (π√3 / 8)',
    apfValue: 0.6802,
    apfExactFormula: 'APF = (π√3) / 8 ≈ 0.680175',
    apfProofSteps: [
      { step: '1. Contact Line', expr: '4R = a√3  ⟹  a = 4R / √3' },
      { step: '2. Net Atoms', expr: 'N = (8 × ⅛) + (1 × 1) = 2' },
      { step: '3. Atoms Volume', expr: 'V_atoms = 2 × (4/3)πR³ = (8/3)πR³' },
      { step: '4. Cell Volume', expr: 'V_cell = a³ = (4R/√3)³ = 64R³ / (3√3)' },
      { step: '5. Exact Ratio', expr: 'APF = [(8/3)πR³] / [64R³/(3√3)] = (π√3) / 8 ≈ 68.02%' }
    ],
    atomicRadiusRelation: '4R = a√3  →  a = 4R / √3',
    slipSystems: '48 potential slip systems {110}⟨111⟩, {112}⟨111⟩, {123}⟨111⟩',
    stackingSequence: 'ABAB... of {110} planes',
    ductilityProfile: 'High strength, pronounced Ductile-to-Brittle Transition Temperature (DBTT) at low temps.',
    examples: ['α-Iron (Ferrite)', 'Chromium (Cr)', 'Tungsten (W)', 'Molybdenum (Mo)', 'Vanadium (V)', 'Niobium (Nb)', 'Tantalum (Ta)'],
    description: 'Atoms touch along the ⟨111⟩ body diagonals. Each central atom is closely enveloped by 8 equidistant nearest neighbors.'
  },
  {
    id: 'fcc',
    name: 'Face-Centred Cubic',
    shortName: 'FCC',
    fullName: 'Face-Centred Cubic (FCC / cF)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (#225)',
    netAtomsPerCell: '4 net atoms (8 × ⅛ corner + 6 × ½ faces)',
    coordinationNumber: 12,
    apf: '74.05% (π√2 / 6 - Maximum Packing)',
    apfValue: 0.7405,
    apfExactFormula: 'APF = (π√2) / 6 = π / (3√2) ≈ 0.740480',
    apfProofSteps: [
      { step: '1. Contact Line', expr: '4R = a√2  ⟹  a = 2R√2' },
      { step: '2. Net Atoms', expr: 'N = (8 × ⅛) + (6 × ½) = 4' },
      { step: '3. Atoms Volume', expr: 'V_atoms = 4 × (4/3)πR³ = (16/3)πR³' },
      { step: '4. Cell Volume', expr: 'V_cell = a³ = (2R√2)³ = 16R³√2' },
      { step: '5. Exact Ratio', expr: 'APF = [(16/3)πR³] / [16R³√2] = (π√2) / 6 ≈ 74.05%' }
    ],
    atomicRadiusRelation: '4R = a√2  →  a = 2R√2',
    slipSystems: '12 close-packed slip systems {111}⟨110⟩',
    stackingSequence: 'ABCABC... of {111} close-packed planes',
    ductilityProfile: 'Extreme ductility, high work hardening, NO ductile-to-brittle transition even at cryogenic temps.',
    examples: ['Copper (Cu)', 'Aluminum (Al)', 'Gold (Au)', 'Silver (Ag)', 'Nickel (Ni)', 'Platinum (Pt)', 'Lead (Pb)', 'Austenite (γ-Fe)'],
    description: 'Atoms touch along the face diagonals ⟨110⟩. Achieves maximum sphere packing density in 3D Euclidean space (Kepler conjecture).'
  },
  {
    id: 'hcp',
    name: 'Hexagonal Close-Packed',
    shortName: 'HCP',
    fullName: 'Hexagonal Close-Packed (HCP / hP)',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6₃/mmc (#194)',
    netAtomsPerCell: '6 net atoms per full hexagonal prism (12×⅙ + 2×½ + 3 inside)',
    coordinationNumber: 12,
    apf: '74.05% (Maximum Packing, ideal c/a = 1.633)',
    apfValue: 0.7405,
    apfExactFormula: 'APF = (π√2) / 6 ≈ 0.740480 (for c/a = √(8/3))',
    apfProofSteps: [
      { step: '1. Contact & c/a', expr: 'a = 2R,  c/a = √(8/3)  ⟹  c = 4R√(2/3)' },
      { step: '2. Net Atoms', expr: 'N = (12 × ⅙) + (2 × ½) + 3 = 6 atoms / prism' },
      { step: '3. Atoms Volume', expr: 'V_atoms = 6 × (4/3)πR³ = 8πR³' },
      { step: '4. Prism Volume', expr: 'V_prism = (3√3/2)a²·c = 3√2 a³ = 24R³√2' },
      { step: '5. Exact Ratio', expr: 'APF = [8πR³] / [24R³√2] = (π√2) / 6 ≈ 74.05%' }
    ],
    atomicRadiusRelation: 'a = 2R, c = 4R√(2/3) ≈ 1.633a',
    slipSystems: '3 primary basal slip systems {0001}⟨112̄0⟩; prismatic & pyramidal at elevated temps',
    stackingSequence: 'ABABAB... along [0001] c-axis',
    ductilityProfile: 'Limited slip systems at room temperature; exhibits directional anisotropy and mechanical twinning.',
    examples: ['Magnesium (Mg)', 'Titanium (α-Ti)', 'Zinc (Zn)', 'Cobalt (α-Co)', 'Beryllium (Be)', 'Zirconium (α-Zr)', 'Cadmium (Cd)'],
    description: 'Full hexagonal prism containing two close-packed hexagonal planes (layer A) sandwiching an internal triangular triad of 3 atoms (layer B) at z = 0.5.'
  }
];

export const MetallicStructuresVisualizer: React.FC = () => {
  const [selectedStructure, setSelectedStructure] = useState<MetallicStructureType>('bcc');
  const [yaw, setYaw] = useState<number>(30);
  const [pitch, setPitch] = useState<number>(20);
  const [showBondingLines, setShowBondingLines] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showAtomLabels, setShowAtomLabels] = useState<boolean>(true);

  const activeData = useMemo(() => {
    return METALLIC_STRUCTURES.find(s => s.id === selectedStructure) || METALLIC_STRUCTURES[0];
  }, [selectedStructure]);

  // 3D Isometric Projection Engine for Metallic Structures (Image 3 reproduction)
  const projection = useMemo(() => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      // Yaw around Z
      const x1 = x * Math.cos(yawRad) - y * Math.sin(yawRad);
      const y1 = x * Math.sin(yawRad) + y * Math.cos(yawRad);
      const z1 = z;

      // Pitch around X
      const x2 = x1;
      const y2 = y1 * Math.cos(pitchRad) - z1 * Math.sin(pitchRad);
      const z2 = y1 * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

      return {
        px: 240 + x2,
        py: 200 - y2,
        depth: z2
      };
    };

    interface AtomNode {
      px: number;
      py: number;
      depth: number;
      type: 'corner' | 'body' | 'face' | 'hcp_ring' | 'hcp_mid';
      label: string;
    }

    interface LineEdge {
      p1: { px: number; py: number };
      p2: { px: number; py: number };
      color: string;
      width: number;
      dashed?: boolean;
    }

    const atoms: AtomNode[] = [];
    const frameEdges: LineEdge[] = [];
    const redStruts: LineEdge[] = [];

    if (selectedStructure === 'bcc') {
      const s = 120;
      // 8 corners
      const corners = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
      ];
      const pCorners = corners.map(c => project(c[0], c[1], c[2]));
      pCorners.forEach((p, idx) => atoms.push({ ...p, type: 'corner', label: '⅛' }));

      // Center atom (0, 0, 0)
      const pCenter = project(0, 0, 0);
      atoms.push({ ...pCenter, type: 'body', label: '1 (Center)' });

      // Blue frame edges (cube)
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];
      edges.forEach(([i, j]) => {
        frameEdges.push({
          p1: pCorners[i],
          p2: pCorners[j],
          color: '#3b82f6', // blue
          width: 2
        });
      });

      // Red struts connecting all 8 corners to central body atom (Image 3)
      pCorners.forEach(corner => {
        redStruts.push({
          p1: corner,
          p2: pCenter,
          color: '#ef4444', // red
          width: 2.5
        });
      });

    } else if (selectedStructure === 'fcc') {
      const s = 120;
      const corners = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
      ];
      const pCorners = corners.map(c => project(c[0], c[1], c[2]));
      pCorners.forEach((p) => atoms.push({ ...p, type: 'corner', label: '⅛' }));

      // 6 face centers
      const faces = [
        [0, 0, -s], // bottom
        [0, 0, s],  // top
        [0, -s, 0], // front
        [0, s, 0],  // back
        [-s, 0, 0], // left
        [s, 0, 0]   // right
      ];
      const pFaces = faces.map(f => project(f[0], f[1], f[2]));
      pFaces.forEach(f => atoms.push({ ...f, type: 'face', label: '½' }));

      // Blue cube frame
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];
      edges.forEach(([i, j]) => {
        frameEdges.push({
          p1: pCorners[i],
          p2: pCorners[j],
          color: '#3b82f6',
          width: 2
        });
      });

      // Red diagonals tracing across face centers (Image 3)
      // Bottom face diagonals (0,1,2,3) connecting through face 0
      redStruts.push({ p1: pCorners[0], p2: pFaces[0], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[1], p2: pFaces[0], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[2], p2: pFaces[0], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[3], p2: pFaces[0], color: '#ef4444', width: 2 });

      // Top face diagonals (4,5,6,7) connecting through face 1
      redStruts.push({ p1: pCorners[4], p2: pFaces[1], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[5], p2: pFaces[1], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[6], p2: pFaces[1], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[7], p2: pFaces[1], color: '#ef4444', width: 2 });

      // Side face struts
      redStruts.push({ p1: pCorners[0], p2: pFaces[2], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[1], p2: pFaces[2], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[4], p2: pFaces[2], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[5], p2: pFaces[2], color: '#ef4444', width: 2 });

      redStruts.push({ p1: pCorners[1], p2: pFaces[5], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[2], p2: pFaces[5], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[5], p2: pFaces[5], color: '#ef4444', width: 2 });
      redStruts.push({ p1: pCorners[6], p2: pFaces[5], color: '#ef4444', width: 2 });

    } else if (selectedStructure === 'hcp') {
      // Full Hexagonal Prism: 6 bottom ring + 1 bottom center, 6 top ring + 1 top center, 3 inside (Image 3)
      const R = 95; // hexagon radius
      const H = 140; // height c

      // Bottom ring (z = -H/2)
      const bottomRing = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 * Math.PI) / 180;
        bottomRing.push(project(R * Math.cos(ang), R * Math.sin(ang), -H / 2));
      }
      const bottomCenter = project(0, 0, -H / 2);

      // Top ring (z = H/2)
      const topRing = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 * Math.PI) / 180;
        topRing.push(project(R * Math.cos(ang), R * Math.sin(ang), H / 2));
      }
      const topCenter = project(0, 0, H / 2);

      // Mid-plane triad (3 atoms at z = 0, layer B)
      const midTriad = [];
      const midR = R * 0.58;
      for (let i = 0; i < 3; i++) {
        const ang = ((i * 120 + 30) * Math.PI) / 180;
        midTriad.push(project(midR * Math.cos(ang), midR * Math.sin(ang), 0));
      }

      // Add atoms
      bottomRing.forEach(p => atoms.push({ ...p, type: 'hcp_ring', label: '⅙' }));
      atoms.push({ ...bottomCenter, type: 'face', label: '½' });
      topRing.forEach(p => atoms.push({ ...p, type: 'hcp_ring', label: '⅙' }));
      atoms.push({ ...topCenter, type: 'face', label: '½' });
      midTriad.forEach((p, idx) => atoms.push({ ...p, type: 'hcp_mid', label: `1 (B${idx + 1})` }));

      // Blue hexagonal prism edges
      // Bottom ring
      for (let i = 0; i < 6; i++) {
        frameEdges.push({ p1: bottomRing[i], p2: bottomRing[(i + 1) % 6], color: '#3b82f6', width: 2 });
      }
      // Top ring
      for (let i = 0; i < 6; i++) {
        frameEdges.push({ p1: topRing[i], p2: topRing[(i + 1) % 6], color: '#3b82f6', width: 2 });
      }
      // 6 vertical pillars
      for (let i = 0; i < 6; i++) {
        frameEdges.push({ p1: bottomRing[i], p2: topRing[i], color: '#3b82f6', width: 2 });
      }
      // Central vertical axis
      frameEdges.push({ p1: bottomCenter, p2: topCenter, color: '#3b82f6', width: 1.5, dashed: true });

      // Red radial spokes from center to ring atoms (top and bottom) as in Image 3
      for (let i = 0; i < 6; i++) {
        redStruts.push({ p1: bottomCenter, p2: bottomRing[i], color: '#ef4444', width: 1.75 });
        redStruts.push({ p1: topCenter, p2: topRing[i], color: '#ef4444', width: 1.75 });
      }

      // Red triangle connecting mid-plane triad atoms
      redStruts.push({ p1: midTriad[0], p2: midTriad[1], color: '#ef4444', width: 2.5 });
      redStruts.push({ p1: midTriad[1], p2: midTriad[2], color: '#ef4444', width: 2.5 });
      redStruts.push({ p1: midTriad[2], p2: midTriad[0], color: '#ef4444', width: 2.5 });

      // Struts connecting triad to top & bottom centers
      midTriad.forEach(tp => {
        redStruts.push({ p1: tp, p2: topCenter, color: '#f87171', width: 1.5 });
        redStruts.push({ p1: tp, p2: bottomCenter, color: '#f87171', width: 1.5 });
      });
    }

    // Sort atoms by depth for proper painter's rendering
    atoms.sort((a, b) => a.depth - b.depth);

    return {
      atoms,
      frameEdges,
      redStruts
    };
  }, [selectedStructure, yaw, pitch]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Encyclopedia Britannica Standard • Image 3
            </span>
            <span className="text-xs text-slate-400 font-mono">Solid State Metallurgy</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Common Metallic Crystal Structures (BCC, FCC, HCP)
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Direct reproduction of the fundamental metallic crystal structures showing blue unit cell skeletons, green metallic ions, and distinctive red coordination bonding struts.
          </p>
        </div>

        {/* Structure Selector Pill */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {METALLIC_STRUCTURES.map(s => (
            <button
              key={s.id}
              onClick={() => { playSynthTone('tick'); setSelectedStructure(s.id); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStructure === s.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{s.shortName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualizer & Comparative Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 3D SVG Canvas */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[520px]">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Selected Metallic Lattice</span>
              <div className="text-xl font-black text-white flex items-center gap-2">
                <span className="text-blue-400">{activeData.shortName}</span>
                <span className="text-slate-400 text-xs font-mono font-normal">({activeData.name})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                APF: {activeData.apf.split(' ')[0]}
              </span>
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                Coordination: {activeData.coordinationNumber}
              </span>
            </div>
          </div>

          {/* SVG Canvas with Metallic Rendering */}
          <div className="relative flex-1 flex items-center justify-center my-4 select-none">
            <svg 
              viewBox="0 0 480 400" 
              className="w-full h-84 max-w-md mx-auto filter drop-shadow-2xl overflow-visible"
            >
              <defs>
                {/* Green metallic atom sphere with specular highlight (Image 3 style) */}
                <radialGradient id="metalSphere" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#a7f3d0" />
                  <stop offset="30%" stopColor="#34d399" />
                  <stop offset="70%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#064e3b" />
                </radialGradient>
                <radialGradient id="midTriadSphere" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#fed7aa" />
                  <stop offset="30%" stopColor="#fb923c" />
                  <stop offset="70%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#7c2d12" />
                </radialGradient>
              </defs>

              {/* Blue Unit Cell Frame */}
              {showWireframe && projection.frameEdges.map((e, idx) => (
                <line
                  key={`frame-${idx}`}
                  x1={e.p1.px}
                  y1={e.p1.py}
                  x2={e.p2.px}
                  y2={e.p2.py}
                  stroke={e.color}
                  strokeWidth={e.width}
                  strokeDasharray={e.dashed ? '4 3' : undefined}
                  strokeLinecap="round"
                />
              ))}

              {/* Red Bonding Struts / Diagonals (Image 3) */}
              {showBondingLines && projection.redStruts.map((s, idx) => (
                <line
                  key={`strut-${idx}`}
                  x1={s.p1.px}
                  y1={s.p1.py}
                  x2={s.p2.px}
                  y2={s.p2.py}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                />
              ))}

              {/* Spherical Metallic Atoms */}
              {projection.atoms.map((a, idx) => {
                const isMidTriad = a.type === 'hcp_mid';
                const fill = isMidTriad ? 'url(#midTriadSphere)' : 'url(#metalSphere)';
                const radius = isMidTriad ? 11 : a.type === 'body' ? 12 : 9.5;

                return (
                  <g key={`atom-${idx}`}>
                    <circle
                      cx={a.px}
                      cy={a.py}
                      r={radius}
                      fill={fill}
                      stroke="#022c22"
                      strokeWidth="1.5"
                    />
                    {showAtomLabels && (
                      <text
                        x={a.px + 12}
                        y={a.py + 4}
                        fill="#cbd5e1"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {a.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Controls Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Yaw</span>
                  <span className="text-blue-400 font-bold">{yaw}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={yaw}
                  onChange={(e) => setYaw(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Pitch</span>
                  <span className="text-blue-400 font-bold">{pitch}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="60"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 accent-blue-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-0">
                <input
                  type="checkbox"
                  id="chkBonds"
                  checked={showBondingLines}
                  onChange={(e) => setShowBondingLines(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-red-500 focus:ring-0"
                />
                <label htmlFor="chkBonds" className="text-[11px] font-bold text-slate-300 cursor-pointer">
                  Red Struts (Bonds)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-0">
                <input
                  type="checkbox"
                  id="chkLabels"
                  checked={showAtomLabels}
                  onChange={(e) => setShowAtomLabels(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                />
                <label htmlFor="chkLabels" className="text-[11px] font-bold text-slate-300 cursor-pointer">
                  Atom Fractions (⅛, ½, 1)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Material Properties & Physics Panel */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Scientific Specification Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">
                  Structure Specification
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{activeData.fullName}</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-blue-950 text-blue-300 border border-blue-500/20">
                {activeData.spaceGroup}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {activeData.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Net Atoms / Cell</span>
                <span className="text-emerald-400 font-bold text-xs">{activeData.netAtomsPerCell}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Radius & Lattice</span>
                <span className="text-indigo-300 font-bold text-xs">{activeData.atomicRadiusRelation}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Stacking Sequence</span>
                <span className="text-amber-400 font-bold text-xs">{activeData.stackingSequence}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Slip Systems</span>
                <span className="text-rose-400 font-bold text-xs">{activeData.slipSystems.split(' ')[0]} Systems</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Mechanical & Ductility Behavior</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeData.ductilityProfile}
              </p>
            </div>
          </div>

          {/* Exact APF Mathematical Formula & Proof Card */}
          <div className="bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-6 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Exact APF Mathematics Formula</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                {activeData.apf}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">Closed-Form Analytical Formula:</span>
                <span className="text-amber-400 font-bold">{activeData.apfExactFormula}</span>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                {activeData.apfProofSteps.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-slate-400">{s.step}:</span>
                    <span className="text-emerald-300 font-bold">{s.expr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real Industrial Metal Examples */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Atom className="w-4 h-4 text-emerald-400" />
              <span>Primary Elemental Examples</span>
            </span>

            <div className="flex flex-wrap gap-2 pt-1">
              {activeData.examples.map((ex, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 font-bold flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {ex}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
