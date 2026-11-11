import React, { useState, useMemo, useId } from 'react';
import { Atom, Calculator, Plus, Check } from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export type MetallicStructureType = 'bcc' | 'fcc' | 'hcp';

export interface MetalPreset {
  symbol: string;
  name: string;
  structure: MetallicStructureType;
  radiusA: number;       // Atomic radius R in Å
  molarMass: number;     // g/mol
  shearModulusGPa: number; // Shear modulus G in GPa
  caRatio?: number;      // c/a ratio for HCP
  isCustom?: boolean;
}

export const INITIAL_METAL_PRESETS: MetalPreset[] = [
  // BCC Metals
  { symbol: 'α-Fe', name: 'Ferrite Iron', structure: 'bcc', radiusA: 1.241, molarMass: 55.845, shearModulusGPa: 82.0 },
  { symbol: 'W', name: 'Tungsten', structure: 'bcc', radiusA: 1.371, molarMass: 183.84, shearModulusGPa: 161.0 },
  { symbol: 'Cr', name: 'Chromium', structure: 'bcc', radiusA: 1.249, molarMass: 51.996, shearModulusGPa: 115.0 },
  { symbol: 'Mo', name: 'Molybdenum', structure: 'bcc', radiusA: 1.363, molarMass: 95.95, shearModulusGPa: 126.0 },
  { symbol: 'Nb', name: 'Niobium', structure: 'bcc', radiusA: 1.429, molarMass: 92.906, shearModulusGPa: 38.0 },
  // FCC Metals
  { symbol: 'Cu', name: 'Copper', structure: 'fcc', radiusA: 1.278, molarMass: 63.546, shearModulusGPa: 48.0 },
  { symbol: 'Al', name: 'Aluminum', structure: 'fcc', radiusA: 1.432, molarMass: 26.982, shearModulusGPa: 26.0 },
  { symbol: 'Ni', name: 'Nickel', structure: 'fcc', radiusA: 1.246, molarMass: 58.693, shearModulusGPa: 76.0 },
  { symbol: 'Au', name: 'Gold', structure: 'fcc', radiusA: 1.442, molarMass: 196.967, shearModulusGPa: 27.0 },
  { symbol: 'γ-Fe', name: 'Austenite Iron', structure: 'fcc', radiusA: 1.292, molarMass: 55.845, shearModulusGPa: 77.0 },
  // HCP Metals
  { symbol: 'α-Ti', name: 'Alpha Titanium', structure: 'hcp', radiusA: 1.448, molarMass: 47.867, shearModulusGPa: 44.0, caRatio: 1.587 },
  { symbol: 'Mg', name: 'Magnesium', structure: 'hcp', radiusA: 1.599, molarMass: 24.305, shearModulusGPa: 17.0, caRatio: 1.624 },
  { symbol: 'Zn', name: 'Zinc', structure: 'hcp', radiusA: 1.332, molarMass: 65.38, shearModulusGPa: 43.0, caRatio: 1.856 },
  { symbol: 'Be', name: 'Beryllium', structure: 'hcp', radiusA: 1.128, molarMass: 9.012, shearModulusGPa: 132.0, caRatio: 1.568 },
  { symbol: 'α-Zr', name: 'Alpha Zirconium', structure: 'hcp', radiusA: 1.597, molarMass: 91.224, shearModulusGPa: 33.0, caRatio: 1.593 },
];

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
    fullName: 'Body-Centred Cubic (BCC / cI2)',
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
    ductilityProfile: 'High Peierls-Nabarro lattice friction; exhibits thermally activated screw dislocation glide and a sharp Ductile-to-Brittle Transition Temperature (DBTT).',
    examples: ['α-Fe (Ferrite)', 'Cr', 'W', 'Mo', 'V', 'Nb', 'Ta'],
    description: 'Hard spheres make contact exclusively along the ⟨111⟩ body diagonals. Each body-centered atom sits in an 8-fold cubic coordination environment.'
  },
  {
    id: 'fcc',
    name: 'Face-Centred Cubic',
    shortName: 'FCC',
    fullName: 'Face-Centred Cubic (FCC / cF4)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m (#225)',
    netAtomsPerCell: '4 net atoms (8 × ⅛ corner + 6 × ½ faces)',
    coordinationNumber: 12,
    apf: '74.05% (π√2 / 6)',
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
    ductilityProfile: 'Low Peierls stress across 12 isotropic {111}⟨110⟩ slip systems; retains high toughness and ductility down to cryogenic temperatures.',
    examples: ['Cu', 'Al', 'Au', 'Ag', 'Ni', 'Pt', 'Pb', 'γ-Fe (Austenite)'],
    description: 'Hard spheres contact along ⟨110⟩ face diagonals, achieving the Kepler-conjecture maximum 3D Euclidean sphere packing density (74.05%).'
  },
  {
    id: 'hcp',
    name: 'Hexagonal Close-Packed',
    shortName: 'HCP',
    fullName: 'Hexagonal Close-Packed (HCP / hP2)',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6₃/mmc (#194)',
    netAtomsPerCell: '6 net atoms per full hexagonal prism (12×⅙ + 2×½ + 3 interior)',
    coordinationNumber: 12,
    apf: '74.05% (ideal c/a = 1.633)',
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
    slipSystems: '3 basal {0001}⟨112̄0⟩ systems; prismatic {101̄0} & pyramidal {101̄1} depending on c/a',
    stackingSequence: 'ABABAB... along [0001] c-axis',
    ductilityProfile: 'Strong plastic anisotropy; requires prismatic/pyramidal ⟨c+a⟩ slip or {101̄2} deformation twinning to satisfy the von Mises 5-independent-slip-system criterion.',
    examples: ['Mg', 'α-Ti', 'Zn', 'α-Co', 'Be', 'α-Zr', 'Cd'],
    description: 'Hexagonal prism comprising two close-packed basal A-layers at z = 0, 1 sandwiching a 3-atom B-layer triad at z = ½ in tetrahedral hollows.'
  }
];

export const MetallicStructuresVisualizer: React.FC = () => {
  const [selectedStructure, setSelectedStructure] = useState<MetallicStructureType>('bcc');
  const [yaw, setYaw] = useState<number>(30);
  const [pitch, setPitch] = useState<number>(20);
  const [showBondingLines, setShowBondingLines] = useState<boolean>(true);
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showAtomLabels, setShowAtomLabels] = useState<boolean>(true);
  const uid = useId().replace(/:/g, '');

  // Interactive Custom Metal & Dislocation/Interstitial Metrology State
  const [metalPresets, setMetalPresets] = useState<MetalPreset[]>(INITIAL_METAL_PRESETS);
  const [activeMetalSymbol, setActiveMetalSymbol] = useState<string>('α-Fe');
  const [radiusA, setRadiusA] = useState<number>(1.241);
  const [molarMass, setMolarMass] = useState<number>(55.845);
  const [shearModulusGPa, setShearModulusGPa] = useState<number>(82.0);
  const [hcpCaRatio, setHcpCaRatio] = useState<number>(1.587);
  const [soluteChoice, setSoluteChoice] = useState<'C' | 'N' | 'H' | 'B'>('C');

  // Custom Metal Creator Form
  const [showCustomMetalForm, setShowCustomMetalForm] = useState<boolean>(false);
  const [customSymbol, setCustomSymbol] = useState<string>('Ti-6Al-4V');
  const [customName, setCustomName] = useState<string>('Custom Alloy');
  const [customR, setCustomR] = useState<string>('1.435');
  const [customM, setCustomM] = useState<string>('46.50');
  const [customG, setCustomG] = useState<string>('44.0');
  const [customCa, setCustomCa] = useState<string>('1.590');

  const activeData = useMemo(() => {
    return METALLIC_STRUCTURES.find(s => s.id === selectedStructure) || METALLIC_STRUCTURES[0];
  }, [selectedStructure]);

  const structureMetals = useMemo(() => {
    return metalPresets.filter(m => m.structure === selectedStructure);
  }, [metalPresets, selectedStructure]);

  const handleSelectStructure = (structId: MetallicStructureType) => {
    playSynthTone('tick');
    setSelectedStructure(structId);
    const firstMetal = metalPresets.find(m => m.structure === structId);
    if (firstMetal) {
      setActiveMetalSymbol(firstMetal.symbol);
      setRadiusA(firstMetal.radiusA);
      setMolarMass(firstMetal.molarMass);
      setShearModulusGPa(firstMetal.shearModulusGPa);
      if (firstMetal.caRatio) setHcpCaRatio(firstMetal.caRatio);
    }
  };

  const handleSelectMetalPreset = (metal: MetalPreset) => {
    playSynthTone('tick');
    setActiveMetalSymbol(metal.symbol);
    setRadiusA(metal.radiusA);
    setMolarMass(metal.molarMass);
    setShearModulusGPa(metal.shearModulusGPa);
    if (metal.caRatio) setHcpCaRatio(metal.caRatio);
  };

  const handleAddCustomMetal = (e: React.FormEvent) => {
    e.preventDefault();
    const rVal = Math.min(3.0, Math.max(0.7, parseFloat(customR) || 1.35));
    const mVal = Math.min(300, Math.max(4.0, parseFloat(customM) || 55.85));
    const gVal = Math.min(400, Math.max(5.0, parseFloat(customG) || 75.0));
    const caVal = Math.min(2.1, Math.max(1.4, parseFloat(customCa) || 1.633));
    const sym = customSymbol.trim() || 'Alloy';
    const newPreset: MetalPreset = {
      symbol: sym,
      name: customName.trim() || 'Custom Metal',
      structure: selectedStructure,
      radiusA: rVal,
      molarMass: mVal,
      shearModulusGPa: gVal,
      caRatio: selectedStructure === 'hcp' ? caVal : undefined,
      isCustom: true,
    };
    setMetalPresets(prev => [...prev, newPreset]);
    handleSelectMetalPreset(newPreset);
    setShowCustomMetalForm(false);
    playSynthTone('chime');
  };

  // Rigorous Solid-State Dislocation, Packing & Interstitial Solute Metrology
  const metalMetrology = useMemo(() => {
    const NA = 6.02214076e23;
    const soluteMap = {
      C: { symbol: 'C (Carbon)', rA: 0.77 },
      N: { symbol: 'N (Nitrogen)', rA: 0.71 },
      H: { symbol: 'H (Hydrogen)', rA: 0.37 },
      B: { symbol: 'B (Boron)', rA: 0.85 },
    };
    const solute = soluteMap[soluteChoice];

    let a = 0;
    let c = 0;
    let vCellA3 = 0;
    let zAtoms = 2;
    let apfActual = 0;
    let burgersA = 0;
    let burgersExpr = '';
    let burgersCA = 0;
    let rOctA = 0;
    let rTetA = 0;
    let slipPlaneLabel = '';
    let pdSlipNm2 = 0;

    if (selectedStructure === 'bcc') {
      a = (4 * radiusA) / Math.sqrt(3);
      c = a;
      vCellA3 = Math.pow(a, 3);
      zAtoms = 2;
      apfActual = (Math.PI * Math.sqrt(3)) / 8;
      // Primary Burgers vector b = 1/2 a <111> -> |b| = a * sqrt(3) / 2 = 2R
      burgersA = (a * Math.sqrt(3)) / 2;
      burgersExpr = '½a⟨111⟩ = 2R';
      // Interstitial voids in BCC: r_tet = (sqrt(5/3) - 1)R ≈ 0.2910 R; r_oct = (sqrt(2/3) - 1)R along [100] ≈ 0.1547 R
      rOctA = (Math.sqrt(4 / 3) - 1) * radiusA; // 0.15470 R
      rTetA = (Math.sqrt(5 / 3) - 1) * radiusA; // 0.29099 R
      slipPlaneLabel = '{110}';
      // PD_{110} = 2 atoms / (a^2 * sqrt(2)) in Å^-2 -> * 100 for nm^-2
      pdSlipNm2 = (2 / (a * a * Math.sqrt(2))) * 100;
    } else if (selectedStructure === 'fcc') {
      a = 2 * radiusA * Math.sqrt(2);
      c = a;
      vCellA3 = Math.pow(a, 3);
      zAtoms = 4;
      apfActual = (Math.PI * Math.sqrt(2)) / 6;
      // Primary Burgers vector b = 1/2 a <110> -> |b| = a / sqrt(2) = 2R
      burgersA = a / Math.sqrt(2);
      burgersExpr = '½a⟨110⟩ = 2R';
      // Shockley partial b_p = 1/6 a <112> -> |b_p| = a / sqrt(6)
      burgersCA = a / Math.sqrt(6);
      rOctA = (Math.sqrt(2) - 1) * radiusA; // 0.41421 R
      rTetA = (Math.sqrt(3 / 2) - 1) * radiusA; // 0.22474 R
      slipPlaneLabel = '{111}';
      // PD_{111} = 2 atoms / ((sqrt(3)/2) * a^2) = 4 / (sqrt(3) * a^2)
      pdSlipNm2 = (4 / (Math.sqrt(3) * a * a)) * 100;
    } else {
      // HCP with non-ideal c/a ratio
      const idealCa = Math.sqrt(8 / 3);
      if (hcpCaRatio >= idealCa) {
        a = 2 * radiusA;
      } else {
        a = (2 * radiusA) / Math.sqrt(1 / 3 + (hcpCaRatio * hcpCaRatio) / 4);
      }
      c = hcpCaRatio * a;
      // Full hexagonal prism has Z = 6 atoms, V_prism = (3*sqrt(3)/2) * a^2 * c
      zAtoms = 6;
      vCellA3 = ((3 * Math.sqrt(3)) / 2) * a * a * c;
      const vAtomsA3 = 6 * ((4 / 3) * Math.PI * Math.pow(radiusA, 3));
      apfActual = vAtomsA3 / vCellA3;
      burgersA = a; // Basal <a> slip 1/3 <11-20>
      burgersExpr = '⅓a⟨112̄0⟩ = a';
      burgersCA = Math.sqrt(a * a + c * c); // Pyramidal <c+a> slip 1/3 <11-23>
      rOctA = (Math.sqrt(2) - 1) * radiusA;
      rTetA = (Math.sqrt(3 / 2) - 1) * radiusA;
      slipPlaneLabel = '(0001)';
      // PD_{(0001)} = 3 atoms / ((3*sqrt(3)/2) * a^2) = 2 / (sqrt(3) * a^2)
      pdSlipNm2 = (2 / (Math.sqrt(3) * a * a)) * 100;
    }

    const densityGcm3 = (zAtoms * molarMass) / (NA * vCellA3 * 1e-24);
    // Dislocation elastic line energy E_line ≈ 0.5 * G * b^2
    // G in GPa = 10^9 N/m^2, b in Å = 10^-10 m -> G * b^2 in N = J/m
    // 1 GPa * (1 Å)^2 = 10^9 * 10^-20 J/m = 10^-11 J/m = 0.01 nJ/m
    // In eV/Å: 1 J/m = (1 / 1.602176634e-19 eV) / (10^10 Å) = 6.241509e8 eV/Å
    const lineEnergyJm = 0.5 * (shearModulusGPa * 1e9) * Math.pow(burgersA * 1e-10, 2);
    const lineEnergyEvPerA = lineEnergyJm * 6.241509074e8;
    const lineEnergyNjPerM = lineEnergyJm * 1e9;

    // Interstitial misfit strain for selected solute in Octahedral & Tetrahedral sites
    const octMisfitPct = ((solute.rA - rOctA) / radiusA) * 100;
    const tetMisfitPct = ((solute.rA - rTetA) / radiusA) * 100;

    return {
      a,
      c,
      vCellA3,
      zAtoms,
      apfActual,
      densityGcm3,
      burgersA,
      burgersExpr,
      burgersCA,
      rOctA,
      rTetA,
      slipPlaneLabel,
      pdSlipNm2,
      lineEnergyEvPerA,
      lineEnergyNjPerM,
      solute,
      octMisfitPct,
      tetMisfitPct,
    };
  }, [selectedStructure, radiusA, molarMass, shearModulusGPa, hcpCaRatio, soluteChoice]);

  // 3D Isometric Projection Engine with Depth Sorting
  const projection = useMemo(() => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;

    const project = (x: number, y: number, z: number) => {
      const x1 = x * Math.cos(yawRad) - y * Math.sin(yawRad);
      const y1 = x * Math.sin(yawRad) + y * Math.cos(yawRad);
      const z1 = z;

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
      p1: { px: number; py: number; depth: number };
      p2: { px: number; py: number; depth: number };
      color: string;
      width: number;
      dashed?: boolean;
    }

    const atoms: AtomNode[] = [];
    const frameEdges: LineEdge[] = [];
    const bondStruts: LineEdge[] = [];

    if (selectedStructure === 'bcc') {
      const s = 116;
      const corners = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
      ];
      const pCorners = corners.map(c => project(c[0], c[1], c[2]));
      pCorners.forEach((p) => atoms.push({ ...p, type: 'corner', label: '1/8' }));

      const pCenter = project(0, 0, 0);
      atoms.push({ ...pCenter, type: 'body', label: '1 (½,½,½)' });

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];
      edges.forEach(([i, j]) => {
        const avgDepth = (pCorners[i].depth + pCorners[j].depth) / 2;
        frameEdges.push({
          p1: pCorners[i],
          p2: pCorners[j],
          color: avgDepth > 0 ? '#475569' : '#38bdf8',
          width: avgDepth > 0 ? 1.1 : 1.5,
          dashed: avgDepth > 25
        });
      });

      pCorners.forEach(corner => {
        bondStruts.push({
          p1: corner,
          p2: pCenter,
          color: '#f59e0b',
          width: 1.8
        });
      });

    } else if (selectedStructure === 'fcc') {
      const s = 116;
      const corners = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
      ];
      const pCorners = corners.map(c => project(c[0], c[1], c[2]));
      pCorners.forEach((p) => atoms.push({ ...p, type: 'corner', label: '1/8' }));

      const faces = [
        [0, 0, -s],
        [0, 0, s],
        [0, -s, 0],
        [0, s, 0],
        [-s, 0, 0],
        [s, 0, 0]
      ];
      const pFaces = faces.map(f => project(f[0], f[1], f[2]));
      pFaces.forEach(f => atoms.push({ ...f, type: 'face', label: '1/2' }));

      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];
      edges.forEach(([i, j]) => {
        const avgDepth = (pCorners[i].depth + pCorners[j].depth) / 2;
        frameEdges.push({
          p1: pCorners[i],
          p2: pCorners[j],
          color: avgDepth > 0 ? '#475569' : '#38bdf8',
          width: avgDepth > 0 ? 1.1 : 1.5,
          dashed: avgDepth > 25
        });
      });

      // Face-diagonal close-packed ⟨110⟩ contact struts
      [0, 1, 2, 3].forEach(cIdx => bondStruts.push({ p1: pCorners[cIdx], p2: pFaces[0], color: '#06b6d4', width: 1.4 }));
      [4, 5, 6, 7].forEach(cIdx => bondStruts.push({ p1: pCorners[cIdx], p2: pFaces[1], color: '#06b6d4', width: 1.4 }));
      [0, 1, 4, 5].forEach(cIdx => bondStruts.push({ p1: pCorners[cIdx], p2: pFaces[2], color: '#06b6d4', width: 1.4 }));
      [1, 2, 5, 6].forEach(cIdx => bondStruts.push({ p1: pCorners[cIdx], p2: pFaces[5], color: '#06b6d4', width: 1.4 }));

    } else if (selectedStructure === 'hcp') {
      const R = 95;
      const H = 138;

      const bottomRing = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 * Math.PI) / 180;
        bottomRing.push(project(R * Math.cos(ang), R * Math.sin(ang), -H / 2));
      }
      const bottomCenter = project(0, 0, -H / 2);

      const topRing = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60 * Math.PI) / 180;
        topRing.push(project(R * Math.cos(ang), R * Math.sin(ang), H / 2));
      }
      const topCenter = project(0, 0, H / 2);

      const midTriad = [];
      const midR = R * 0.577;
      for (let i = 0; i < 3; i++) {
        const ang = ((i * 120 + 30) * Math.PI) / 180;
        midTriad.push(project(midR * Math.cos(ang), midR * Math.sin(ang), 0));
      }

      bottomRing.forEach(p => atoms.push({ ...p, type: 'hcp_ring', label: '1/6' }));
      atoms.push({ ...bottomCenter, type: 'face', label: '1/2' });
      topRing.forEach(p => atoms.push({ ...p, type: 'hcp_ring', label: '1/6' }));
      atoms.push({ ...topCenter, type: 'face', label: '1/2' });
      midTriad.forEach((p, idx) => atoms.push({ ...p, type: 'hcp_mid', label: `B${idx + 1}` }));

      for (let i = 0; i < 6; i++) {
        frameEdges.push({ p1: bottomRing[i], p2: bottomRing[(i + 1) % 6], color: '#475569', width: 1.3 });
        frameEdges.push({ p1: topRing[i], p2: topRing[(i + 1) % 6], color: '#38bdf8', width: 1.5 });
        frameEdges.push({ p1: bottomRing[i], p2: topRing[i], color: '#475569', width: 1.2 });
      }
      frameEdges.push({ p1: bottomCenter, p2: topCenter, color: '#64748b', width: 1, dashed: true });

      for (let i = 0; i < 6; i++) {
        bondStruts.push({ p1: bottomCenter, p2: bottomRing[i], color: '#334155', width: 1.1 });
        bondStruts.push({ p1: topCenter, p2: topRing[i], color: '#334155', width: 1.1 });
      }

      bondStruts.push({ p1: midTriad[0], p2: midTriad[1], color: '#f59e0b', width: 1.9 });
      bondStruts.push({ p1: midTriad[1], p2: midTriad[2], color: '#f59e0b', width: 1.9 });
      bondStruts.push({ p1: midTriad[2], p2: midTriad[0], color: '#f59e0b', width: 1.9 });

      midTriad.forEach(tp => {
        bondStruts.push({ p1: tp, p2: topCenter, color: '#d97706', width: 1.3, dashed: true });
        bondStruts.push({ p1: tp, p2: bottomCenter, color: '#d97706', width: 1.3, dashed: true });
      });
    }

    atoms.sort((a, b) => b.depth - a.depth);

    return {
      atoms,
      frameEdges,
      bondStruts
    };
  }, [selectedStructure, yaw, pitch]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 font-semibold">
            <span>Solid-State Physical Metallurgy</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Close-Packed Lattice Topology &amp; Dislocation Mechanics</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            Metallic Crystal Structures (BCC · FCC · HCP)
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Interactive 3D ray-shaded coordination polyhedra, close-packed slip-plane crystallography, Burgers vector dissociations, and interstitial void radii.
          </p>
        </div>

        {/* Segmented Structure Selector */}
        <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded-lg border border-slate-800">
          {METALLIC_STRUCTURES.map(s => (
            <button
              key={s.id}
              onClick={() => handleSelectStructure(s.id)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                selectedStructure === s.id
                  ? 'bg-cyan-600 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D CAD Viewport & Metallurgy Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: 3D Atomistic CAD Viewport */}
        <div className="lg:col-span-7 bg-[#070A12] border border-slate-800 rounded-xl p-6 flex flex-col justify-between min-h-[540px]">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Atomistic Coordination Viewport
              </span>
              <div className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                <span className="text-cyan-400">{activeData.shortName}</span>
                <span className="text-slate-400 text-xs font-mono font-normal">· {activeData.fullName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
              <div>
                <span className="text-slate-500">APF: </span>
                <strong className="text-amber-400">{activeData.apf.split(' ')[0]}</strong>
              </div>
              <div>
                <span className="text-slate-500">CN: </span>
                <strong className="text-cyan-400">{activeData.coordinationNumber}</strong>
              </div>
            </div>
          </div>

          {/* 3D SVG Canvas with Ray-Traced Phong Gradients */}
          <div className="relative flex-1 flex items-center justify-center my-4 select-none bg-[#05080E] rounded-lg border border-slate-800/80 overflow-hidden">
            <svg
              viewBox="0 0 480 400"
              className="w-full h-84 max-w-md mx-auto overflow-visible"
            >
              <defs>
                <pattern id={`metGrid-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0f172a" strokeWidth="0.7" />
                </pattern>
                {/* 3D Titanium/Platinum Sphere for Corner/Ring Sites */}
                <radialGradient id={`titaniumSphere-${uid}`} cx="32%" cy="28%" r="68%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#cbd5e1" />
                  <stop offset="72%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
                {/* 3D Anodized Cyan Sphere for Face-Centered Sites */}
                <radialGradient id={`cyanAtomSphere-${uid}`} cx="32%" cy="28%" r="68%">
                  <stop offset="0%" stopColor="#ecfeff" />
                  <stop offset="32%" stopColor="#38bdf8" />
                  <stop offset="75%" stopColor="#0369a1" />
                  <stop offset="100%" stopColor="#082f49" />
                </radialGradient>
                {/* 3D Gold/Amber Sphere for Body-Centered & B-Layer Sites */}
                <radialGradient id={`goldAtomSphere-${uid}`} cx="32%" cy="28%" r="68%">
                  <stop offset="0%" stopColor="#fef3c7" />
                  <stop offset="32%" stopColor="#fbbf24" />
                  <stop offset="75%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#451a03" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="480" height="400" fill={`url(#metGrid-${uid})`} opacity="0.6" />

              {/* Unit Cell Wireframe Cage */}
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

              {/* Close-Packed Coordination Struts */}
              {showBondingLines && projection.bondStruts.map((s, idx) => (
                <line
                  key={`strut-${idx}`}
                  x1={s.p1.px}
                  y1={s.p1.py}
                  x2={s.p2.px}
                  y2={s.p2.py}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeDasharray={s.dashed ? '3 2' : undefined}
                  strokeLinecap="round"
                  opacity="0.85"
                />
              ))}

              {/* Depth-Sorted 3D Volumetric Atoms */}
              {projection.atoms.map((a, idx) => {
                const isInterior = a.type === 'hcp_mid' || a.type === 'body';
                const isFace = a.type === 'face';
                const fill = isInterior
                  ? `url(#goldAtomSphere-${uid})`
                  : isFace
                  ? `url(#cyanAtomSphere-${uid})`
                  : `url(#titaniumSphere-${uid})`;
                const radius = isInterior ? 13 : isFace ? 11 : 9.5;

                return (
                  <g key={`atom-${idx}`}>
                    <circle
                      cx={a.px}
                      cy={a.py}
                      r={radius}
                      fill={fill}
                      stroke="#020617"
                      strokeWidth="0.9"
                    />
                    {showAtomLabels && (
                      <text
                        x={a.px + radius + 4}
                        y={a.py + 3}
                        fill="#cbd5e1"
                        fontSize="8.5"
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

            {/* Legend Overlay */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 pointer-events-none">
              <span>Vertex (1/8 · 1/6)</span>
              <span>Face (1/2)</span>
              <span className="text-amber-400">Interior / Body (1)</span>
            </div>
          </div>

          {/* Viewport Orientation & Layer Controls */}
          <div className="bg-[#0B0F19] rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                  <span>Azimuth (Yaw)</span>
                  <span className="text-cyan-400 font-semibold">{yaw}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={yaw}
                  onChange={(e) => setYaw(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 accent-cyan-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                  <span>Elevation (Pitch)</span>
                  <span className="text-cyan-400 font-semibold">{pitch}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="60"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 accent-cyan-500 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-0">
                <input
                  type="checkbox"
                  id="chkBonds"
                  checked={showBondingLines}
                  onChange={(e) => setShowBondingLines(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="chkBonds" className="text-[11px] font-medium text-slate-300 cursor-pointer">
                  Contact Vectors
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 sm:pt-0">
                <input
                  type="checkbox"
                  id="chkLabels"
                  checked={showAtomLabels}
                  onChange={(e) => setShowAtomLabels(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="chkLabels" className="text-[11px] font-medium text-slate-300 cursor-pointer">
                  Site Fractions
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Crystallographic Specification & Slip Mechanics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Specification Card */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Crystallographic Specification
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">{activeData.fullName}</h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-slate-900 text-cyan-300 border border-slate-700">
                {activeData.spaceGroup}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeData.description}
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
              <div className="bg-[#070A12] p-3 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase">Net Atoms / Cell</span>
                <span className="text-slate-200 font-semibold text-[11px] mt-0.5 block">{activeData.netAtomsPerCell}</span>
              </div>

              <div className="bg-[#070A12] p-3 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase">Close-Packed Metric</span>
                <span className="text-cyan-300 font-semibold text-[11px] mt-0.5 block">{activeData.atomicRadiusRelation}</span>
              </div>

              <div className="bg-[#070A12] p-3 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase">Layer Stacking</span>
                <span className="text-amber-400 font-semibold text-[11px] mt-0.5 block">{activeData.stackingSequence}</span>
              </div>

              <div className="bg-[#070A12] p-3 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-500 block uppercase">Active Slip Systems</span>
                <span className="text-slate-200 font-semibold text-[11px] mt-0.5 block">{activeData.slipSystems.split(' ')[0]} Systems</span>
              </div>
            </div>

            <div className="bg-[#070A12] p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Dislocation Plasticity &amp; DBTT</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeData.ductilityProfile}
              </p>
            </div>
          </div>

          {/* Exact APF Proof Card */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-semibold text-slate-200 font-mono flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>Analytical APF Derivation</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {activeData.apf}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#070A12] border border-slate-800 space-y-1.5 font-mono tabular-nums text-[11px]">
              {activeData.apfProofSteps.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-800/50 last:border-0 pb-1 last:pb-0">
                  <span className="text-slate-400">{s.step}</span>
                  <span className="text-slate-200 font-semibold">{s.expr}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reference Metals:</span>
              </span>
              <span className="text-slate-200 font-semibold">{activeData.examples.join(' · ')}</span>
            </div>
          </div>

          {/* CAD Slip-Plane Crystallography, Burgers Vector & Interstitial Void Schematic */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800 pb-1.5">
              <span className="font-semibold text-cyan-400 uppercase tracking-wider">
                FIG · SLIP-PLANE BURGERS VECTOR &amp; INTERSTITIAL CAVITIES ({activeData.shortName})
              </span>
              <span className="text-amber-400 font-semibold">
                {selectedStructure === 'bcc'
                  ? 'b = ½a⟨111⟩'
                  : selectedStructure === 'fcc'
                  ? 'b = ½a⟨110⟩'
                  : 'b = ⅓a⟨112̄0⟩'}
              </span>
            </div>

            <div className="bg-[#070A12] border border-slate-800/90 rounded-lg p-2.5">
              <svg viewBox="0 0 350 136" className="w-full h-auto select-none">
                <defs>
                  <radialGradient id={`slipAtom-${uid}`} cx="32%" cy="28%" r="68%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="35%" stopColor="#94a3b8" />
                    <stop offset="80%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </radialGradient>
                  <radialGradient id={`slipCenter-${uid}`} cx="32%" cy="28%" r="68%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="35%" stopColor="#fbbf24" />
                    <stop offset="80%" stopColor="#b45309" />
                    <stop offset="100%" stopColor="#451a03" />
                  </radialGradient>
                  <marker id={`burgArr-${uid}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
                  </marker>
                  <marker id={`partArr-${uid}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
                  </marker>
                </defs>

                {selectedStructure === 'bcc' && (
                  <g>
                    {/* Left: {110} Slip Plane & <111> Burgers Vectors */}
                    <rect x="14" y="14" width="142" height="92" fill="rgba(14, 165, 233, 0.08)" stroke="#38bdf8" strokeWidth="1.1" />
                    <line x1="14" y1="106" x2="156" y2="14" stroke="#475569" strokeWidth="0.9" strokeDasharray="3 2" />
                    {[[14, 14], [156, 14], [14, 106], [156, 106]].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="9" fill={`url(#slipAtom-${uid})`} />
                    ))}
                    <circle cx="85" cy="60" r="10.5" fill={`url(#slipCenter-${uid})`} />
                    <line x1="14" y1="106" x2="77" y2="65" stroke="#38bdf8" strokeWidth="2" markerEnd={`url(#burgArr-${uid})`} />
                    <text x="85" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                      &#123;110&#125; Plane · b = ½a⟨111⟩ (a√3/2)
                    </text>

                    {/* Right: BCC Interstitial Cavities */}
                    <rect x="176" y="10" width="166" height="116" rx="6" fill="#05080E" stroke="#1e293b" />
                    <text x="259" y="25" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      BCC INTERSTITIAL RADII
                    </text>
                    <circle cx="218" cy="62" r="14.5" fill="rgba(56, 189, 248, 0.14)" stroke="#38bdf8" strokeWidth="1.2" />
                    <text x="218" y="65" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                      Tet
                    </text>
                    <text x="218" y="92" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
                      r/R = 0.291
                    </text>
                    <text x="218" y="104" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                      (½, ¼, 0) · 12/cell
                    </text>

                    <circle cx="298" cy="62" r="8.5" fill="rgba(245, 158, 11, 0.16)" stroke="#f59e0b" strokeWidth="1.2" />
                    <text x="298" y="65" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      Oct
                    </text>
                    <text x="298" y="92" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
                      r/R = 0.155
                    </text>
                    <text x="298" y="104" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                      (0, ½, ½) · 6/cell
                    </text>
                  </g>
                )}

                {selectedStructure === 'fcc' && (
                  <g>
                    {/* Left: Close-Packed {111} Triangular Plane & Shockley Partial Splitting */}
                    <polygon points="85,12 148,104 22,104" fill="rgba(14, 165, 233, 0.08)" stroke="#38bdf8" strokeWidth="1.1" />
                    {[[85, 12], [148, 104], [22, 104], [53.5, 58], [116.5, 58], [85, 104]].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="9" fill={`url(#slipAtom-${uid})`} />
                    ))}
                    {/* Full Burgers vector vs Shockley Partials */}
                    <line x1="22" y1="104" x2="76" y2="104" stroke="#38bdf8" strokeWidth="2" markerEnd={`url(#burgArr-${uid})`} />
                    <line x1="22" y1="104" x2="51" y2="85" stroke="#f59e0b" strokeWidth="1.4" strokeDasharray="2 1.5" markerEnd={`url(#partArr-${uid})`} />
                    <line x1="53.5" y1="84" x2="78" y2="100" stroke="#f59e0b" strokeWidth="1.4" strokeDasharray="2 1.5" markerEnd={`url(#partArr-${uid})`} />
                    <text x="85" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                      &#123;111&#125; Plane · ½⟨110⟩ → ⅙⟨112⟩ + ⅙⟨211̄⟩
                    </text>

                    {/* Right: FCC Interstitial Cavities */}
                    <rect x="176" y="10" width="166" height="116" rx="6" fill="#05080E" stroke="#1e293b" />
                    <text x="259" y="25" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      FCC INTERSTITIAL RADII
                    </text>
                    <circle cx="218" cy="62" r="16" fill="rgba(245, 158, 11, 0.16)" stroke="#f59e0b" strokeWidth="1.2" />
                    <text x="218" y="65" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                      Oct
                    </text>
                    <text x="218" y="92" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
                      r/R = 0.414
                    </text>
                    <text x="218" y="104" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                      (½, ½, ½) · 4/cell
                    </text>

                    <circle cx="298" cy="62" r="10.5" fill="rgba(56, 189, 248, 0.14)" stroke="#38bdf8" strokeWidth="1.2" />
                    <text x="298" y="65" textAnchor="middle" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                      Tet
                    </text>
                    <text x="298" y="92" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
                      r/R = 0.225
                    </text>
                    <text x="298" y="104" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
                      (¼, ¼, ¼) · 8/cell
                    </text>
                  </g>
                )}

                {selectedStructure === 'hcp' && (
                  <g>
                    {/* Left: {0001} Basal Hexagonal Slip Plane */}
                    <polygon points="85,16 128,38 128,82 85,104 42,82 42,38" fill="rgba(14, 165, 233, 0.08)" stroke="#38bdf8" strokeWidth="1.1" />
                    {[[85, 16], [128, 38], [128, 82], [85, 104], [42, 82], [42, 38]].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="8" fill={`url(#slipAtom-${uid})`} />
                    ))}
                    <circle cx="85" cy="60" r="8.5" fill={`url(#slipCenter-${uid})`} />
                    <line x1="85" y1="60" x2="120" y2="42" stroke="#38bdf8" strokeWidth="1.8" markerEnd={`url(#burgArr-${uid})`} />
                    <line x1="85" y1="60" x2="120" y2="78" stroke="#38bdf8" strokeWidth="1.8" markerEnd={`url(#burgArr-${uid})`} />
                    <line x1="85" y1="60" x2="85" y2="25" stroke="#38bdf8" strokeWidth="1.8" markerEnd={`url(#burgArr-${uid})`} />
                    <text x="85" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                      (0001) Basal · 3 ⟨112̄0⟩ a-Slip Vectors
                    </text>

                    {/* Right: c/a Axial Anisotropy & Slip Competition */}
                    <rect x="176" y="10" width="166" height="116" rx="6" fill="#05080E" stroke="#1e293b" />
                    <text x="259" y="25" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      c/a SLIP REGIME SELECTION
                    </text>
                    <text x="186" y="46" fill="#e2e8f0" fontSize="7.5" fontFamily="monospace">
                      Ideal Packing: c/a = 1.633
                    </text>
                    <text x="186" y="64" fill="#7dd3fc" fontSize="7.5" fontFamily="monospace">
                      c/a &gt; 1.63 (Zn, Cd): Basal (0001)
                    </text>
                    <text x="186" y="82" fill="#fbbf24" fontSize="7.5" fontFamily="monospace">
                      c/a &lt; 1.60 (Ti, Zr): Prism &#123;101̄0&#125;
                    </text>
                    <text x="186" y="100" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                      c-Axis Strain: &#123;101̄2&#125;⟨101̄1⟩ Twin
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Custom Metal / Alloy & Dislocation/Interstitial Metrology Workstation */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Solid-State Metallurgy &amp; Dislocation Metrology Solver ({activeData.shortName})</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
              Custom Metal / Alloy Parameters, Burgers Vector Line Energy &amp; Interstitial Misfit
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {structureMetals.map((metal) => (
              <button
                key={metal.symbol}
                onClick={() => handleSelectMetalPreset(metal)}
                className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  activeMetalSymbol === metal.symbol
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-[#070A12] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span>{metal.symbol}</span>
                <span className="text-[10px] text-slate-500">{metal.radiusA.toFixed(3)}Å</span>
              </button>
            ))}
            <button
              onClick={() => {
                playSynthTone('tick');
                setShowCustomMetalForm(prev => !prev);
              }}
              className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all flex items-center gap-1 ${
                showCustomMetalForm
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-[#070A12] text-amber-400 border-amber-500/30 hover:border-amber-500/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Alloy</span>
            </button>
          </div>
        </div>

        {/* Custom Metal / Alloy Creation Drawer */}
        {showCustomMetalForm && (
          <form
            onSubmit={handleAddCustomMetal}
            className="bg-[#070A12] border border-amber-500/40 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider">
              <span>Synthesize Custom {activeData.shortName} Metal / Solid-Solution Alloy</span>
              <span className="text-slate-500">Saved to {activeData.shortName} Presets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Symbol / Grade</label>
                <input
                  type="text"
                  value={customSymbol}
                  onChange={e => setCustomSymbol(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  placeholder="e.g. Nb-Ti"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Alloy Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  placeholder="Custom Alloy"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Atomic Radius R (Å)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.7"
                  max="3.0"
                  value={customR}
                  onChange={e => setCustomR(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-cyan-300 focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Molar Mass M (g/mol)</label>
                <input
                  type="number"
                  step="0.01"
                  min="4"
                  max="300"
                  value={customM}
                  onChange={e => setCustomM(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-amber-300 focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Shear Modulus G (GPa)</label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="400"
                  value={customG}
                  onChange={e => setCustomG(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none tabular-nums"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply &amp; Save</span>
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 Cols: Parameter Sliders & Interstitial Solute Selector */}
          <div className="lg:col-span-5 bg-[#070A12] border border-slate-800 rounded-xl p-4 space-y-3.5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="text-slate-300 font-bold">Active Host: {activeMetalSymbol}</span>
              <span className="text-cyan-400">{activeData.fullName}</span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Metallic Radius R</span>
                <span className="text-cyan-300 font-bold tabular-nums">{radiusA.toFixed(3)} Å ({(radiusA * 100).toFixed(1)} pm)</span>
              </div>
              <input
                type="range"
                min={1.00}
                max={2.00}
                step={0.002}
                value={radiusA}
                onChange={e => {
                  setActiveMetalSymbol('Custom');
                  setRadiusA(parseFloat(e.target.value));
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Atomic / Alloy Molar Mass M</span>
                <span className="text-amber-300 font-bold tabular-nums">{molarMass.toFixed(2)} g/mol</span>
              </div>
              <input
                type="range"
                min={9.0}
                max={210.0}
                step={0.1}
                value={molarMass}
                onChange={e => {
                  setActiveMetalSymbol('Custom');
                  setMolarMass(parseFloat(e.target.value));
                }}
                className="w-full accent-amber-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Isotropic Shear Modulus G</span>
                <span className="text-cyan-300 font-bold tabular-nums">{shearModulusGPa.toFixed(1)} GPa</span>
              </div>
              <input
                type="range"
                min={10.0}
                max={180.0}
                step={1.0}
                value={shearModulusGPa}
                onChange={e => {
                  setActiveMetalSymbol('Custom');
                  setShearModulusGPa(parseFloat(e.target.value));
                }}
                className="w-full accent-cyan-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {selectedStructure === 'hcp' && (
              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-300">HCP Axial Ratio (c/a)</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {hcpCaRatio.toFixed(3)} {Math.abs(hcpCaRatio - 1.633) < 0.005 ? '(Ideal)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min={1.500}
                  max={1.900}
                  step={0.002}
                  value={hcpCaRatio}
                  onChange={e => setHcpCaRatio(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                />
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Interstitial Solute Probe</span>
                <span className="text-cyan-400">r_solute = {metalMetrology.solute.rA.toFixed(2)} Å</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                {(['C', 'N', 'H', 'B'] as const).map(sol => (
                  <button
                    key={sol}
                    onClick={() => {
                      playSynthTone('tick');
                      setSoluteChoice(sol);
                    }}
                    className={`py-1 rounded border font-bold transition-all ${
                      soluteChoice === sol
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {sol === 'C' ? 'C (0.77Å)' : sol === 'N' ? 'N (0.71Å)' : sol === 'H' ? 'H (0.37Å)' : 'B (0.85Å)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Live Computed Metrology Readout Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono tabular-nums">
            {/* Card 1: Lattice Constant & Cell Volume */}
            <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                <span>Lattice Parameter &amp; Volume</span>
                <span className="text-cyan-400">Z = {metalMetrology.zAtoms} atoms</span>
              </div>
              <div className="text-base font-bold text-slate-100">
                a = {metalMetrology.a.toFixed(4)} Å
                {selectedStructure === 'hcp' && (
                  <span className="text-amber-300 ml-2">c = {metalMetrology.c.toFixed(4)} Å</span>
                )}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/70">
                <span>V_cell = {metalMetrology.vCellA3.toFixed(2)} Å³</span>
                <span className="text-cyan-300">APF = {(metalMetrology.apfActual * 100).toFixed(2)}%</span>
              </div>
            </div>

            {/* Card 2: Theoretical X-Ray Density & Slip Plane Density */}
            <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                <span>Theoretical X-Ray Density ρ</span>
                <span className="text-amber-400">ρ = Z·M / (N_A·V)</span>
              </div>
              <div className="text-base font-bold text-amber-300">
                {metalMetrology.densityGcm3.toFixed(3)} g/cm³
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/70">
                <span>Slip Plane {metalMetrology.slipPlaneLabel} PD:</span>
                <span className="text-slate-200 font-semibold">{metalMetrology.pdSlipNm2.toFixed(2)} atoms/nm²</span>
              </div>
            </div>

            {/* Card 3: Burgers Vector & Dislocation Line Energy */}
            <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                <span>Burgers Vector &amp; Line Energy</span>
                <span className="text-cyan-400">{metalMetrology.burgersExpr}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-cyan-300">
                  |b| = {metalMetrology.burgersA.toFixed(4)} Å
                </span>
                <span className="text-xs font-bold text-amber-300">
                  E_line ≈ {metalMetrology.lineEnergyEvPerA.toFixed(2)} eV/Å
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/70">
                <span>½Gb² = {metalMetrology.lineEnergyNjPerM.toFixed(2)} nJ/m</span>
                {selectedStructure === 'fcc' && (
                  <span className="text-amber-300/90">Shockley |b_p| = {metalMetrology.burgersCA.toFixed(3)} Å</span>
                )}
                {selectedStructure === 'hcp' && (
                  <span className="text-amber-300/90">|b_c+a| = {metalMetrology.burgersCA.toFixed(3)} Å</span>
                )}
                {selectedStructure === 'bcc' && (
                  <span className="text-slate-400">Peierls Screw Core</span>
                )}
              </div>
            </div>

            {/* Card 4: Octahedral & Tetrahedral Interstitial Cavities & Solute Misfit */}
            <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
                <span>Interstitial Cavities &amp; {soluteChoice} Misfit</span>
                <span className="text-cyan-400">r_{soluteChoice} = {metalMetrology.solute.rA.toFixed(2)} Å</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                <div className="p-1.5 rounded bg-[#0B0F19] border border-slate-800/90">
                  <div className="text-[10px] text-slate-400">Octahedral r_oct</div>
                  <div className="font-bold text-amber-300">{metalMetrology.rOctA.toFixed(3)} Å</div>
                  <div className={`text-[10px] ${metalMetrology.octMisfitPct <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Misfit: {metalMetrology.octMisfitPct > 0 ? '+' : ''}{metalMetrology.octMisfitPct.toFixed(1)}%
                  </div>
                </div>
                <div className="p-1.5 rounded bg-[#0B0F19] border border-slate-800/90">
                  <div className="text-[10px] text-slate-400">Tetrahedral r_tet</div>
                  <div className="font-bold text-cyan-300">{metalMetrology.rTetA.toFixed(3)} Å</div>
                  <div className={`text-[10px] ${metalMetrology.tetMisfitPct <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Misfit: {metalMetrology.tetMisfitPct > 0 ? '+' : ''}{metalMetrology.tetMisfitPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
