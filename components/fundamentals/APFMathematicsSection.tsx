import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Atom, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  HelpCircle, 
  ArrowRight, 
  Layers, 
  Maximize2,
  ChevronRight,
  ShieldCheck,
  Rotate3d,
  Sliders
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export type APFStructureKey = 'sc' | 'bcc' | 'fcc' | 'hcp' | 'diamond' | 'nacl';

export interface APFDerivationData {
  id: APFStructureKey;
  name: string;
  shortName: string;
  tagline: string;
  coordinationNumber: number;
  netAtomsFormula: string;
  netAtomsValue: number;
  contactDirection: string;
  contactEquation: string;
  latticeParamFormula: string;
  cellVolumeFormula: string;
  cellVolumeExpanded: string;
  atomVolumeFormula: string;
  atomVolumeExpanded: string;
  exactFormulaLatex: string;
  exactFormulaDisplay: string;
  simplifiedConstant: string;
  decimalValue: number;
  percentValue: string;
  voidFractionPercent: string;
  steps: {
    title: string;
    description: string;
    math: string;
    notes?: string;
  }[];
  realWorldMaterials: {
    name: string;
    symbol: string;
    atomicWeight: number; // g/mol
    aParam: number; // Angstroms
    computedDensity: number; // g/cm^3
  }[];
}

export const APF_DERIVATIONS: Record<APFStructureKey, APFDerivationData> = {
  sc: {
    id: 'sc',
    name: 'Simple Cubic (SC)',
    shortName: 'SC',
    tagline: 'Primitive cubic lattice with sphere contact along the cube edges [100]',
    coordinationNumber: 6,
    netAtomsFormula: '8 corners × ⅛ = 1 atom',
    netAtomsValue: 1,
    contactDirection: 'Cube edges ⟨100⟩',
    contactEquation: 'a = 2R',
    latticeParamFormula: 'a = 2R',
    cellVolumeFormula: 'V_cell = a^3',
    cellVolumeExpanded: '(2R)^3 = 8R^3',
    atomVolumeFormula: 'V_atoms = 1 × (4/3)πR^3',
    atomVolumeExpanded: '(4/3)πR^3',
    exactFormulaLatex: '\\text{APF} = \\frac{\\pi}{6}',
    exactFormulaDisplay: 'π / 6',
    simplifiedConstant: 'π / 6',
    decimalValue: Math.PI / 6,
    percentValue: '52.36%',
    voidFractionPercent: '47.64%',
    steps: [
      {
        title: 'Step 1: Contact Geometry along Cube Edges',
        description: 'Corner spheres touch each other along the edges of length a. Therefore, the edge length equals exactly two atomic radii.',
        math: 'a = 2R  \\iff  R = \\frac{a}{2}',
        notes: 'Direction vector: [100], [010], [001]'
      },
      {
        title: 'Step 2: Effective Net Number of Atoms (N)',
        description: 'The unit cell has 8 corner atoms, each shared equally among 8 contiguous unit cells meeting at that vertex.',
        math: 'N = 8 \\times \\left(\\frac{1}{8}\\right) = 1 \\text{ net atom per unit cell}',
        notes: 'Corner atom contribution fraction = 1/8'
      },
      {
        title: 'Step 3: Total Volume Occupied by Atoms (V_atoms)',
        description: 'Multiply the effective number of atoms by the volume of a single sphere of radius R.',
        math: 'V_{\\text{atoms}} = N \\times \\left(\\frac{4}{3}\\pi R^3\\right) = 1 \\times \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi R^3'
      },
      {
        title: 'Step 4: Total Volume of the Unit Cell (V_cell)',
        description: 'Express the unit cell volume strictly in terms of atomic radius R using a = 2R.',
        math: 'V_{\\text{cell}} = a^3 = (2R)^3 = 8R^3'
      },
      {
        title: 'Step 5: Exact Algebraic Simplification for APF',
        description: 'Divide atom volume by cell volume; the R³ terms cancel out completely leaving a pure geometric constant.',
        math: '\\text{APF} = \\frac{V_{\\text{atoms}}}{V_{\\text{cell}}} = \\frac{\\frac{4}{3}\\pi R^3}{8R^3} = \\frac{4\\pi}{3 \\times 8} = \\frac{\\pi}{6} \\approx 0.5235987756',
        notes: 'Notice that nearly half (47.64%) of the unit cell is empty space.'
      }
    ],
    realWorldMaterials: [
      { name: 'Alpha-Polonium', symbol: 'α-Po', atomicWeight: 209.0, aParam: 3.359, computedDensity: 9.196 }
    ]
  },
  bcc: {
    id: 'bcc',
    name: 'Body-Centred Cubic (BCC)',
    shortName: 'BCC',
    tagline: 'Body-centered cubic with close-packed atomic contact along body diagonals [111]',
    coordinationNumber: 8,
    netAtomsFormula: '(8 corners × ⅛) + (1 center × 1) = 2 atoms',
    netAtomsValue: 2,
    contactDirection: 'Body diagonals ⟨111⟩',
    contactEquation: '4R = a√3',
    latticeParamFormula: 'a = 4R / √3',
    cellVolumeFormula: 'V_cell = a^3',
    cellVolumeExpanded: '(4R / √3)^3 = 64R^3 / (3√3)',
    atomVolumeFormula: 'V_atoms = 2 × (4/3)πR^3',
    atomVolumeExpanded: '(8/3)πR^3',
    exactFormulaLatex: '\\text{APF} = \\frac{\\pi\\sqrt{3}}{8}',
    exactFormulaDisplay: '(π√3) / 8',
    simplifiedConstant: 'π√3 / 8',
    decimalValue: (Math.PI * Math.sqrt(3)) / 8,
    percentValue: '68.02%',
    voidFractionPercent: '31.98%',
    steps: [
      {
        title: 'Step 1: Contact Geometry along the Cube Body Diagonal',
        description: 'Corner atoms do not touch along edges; instead, the central atom touches all 8 corner atoms along the four body diagonals. The body diagonal passes through one corner radius, a full central diameter (2R), and the opposite corner radius.',
        math: '\\text{Body Diagonal} = \\sqrt{a^2 + a^2 + a^2} = a\\sqrt{3} = R + 2R + R = 4R \\implies a = \\frac{4R}{\\sqrt{3}}',
        notes: 'Pythagorean length of body diagonal: √(a² + a² + a²) = a√3'
      },
      {
        title: 'Step 2: Effective Net Number of Atoms (N)',
        description: 'The unit cell possesses 8 corner atoms (each shared by 8 cells) plus 1 fully enclosed body-centered atom (not shared).',
        math: 'N = \\left(8 \\times \\frac{1}{8}\\right) + (1 \\times 1) = 1 + 1 = 2 \\text{ net atoms per unit cell}'
      },
      {
        title: 'Step 3: Total Volume Occupied by Spheres (V_atoms)',
        description: 'Volume of 2 rigid spherical atoms of radius R.',
        math: 'V_{\\text{atoms}} = 2 \\times \\left(\\frac{4}{3}\\pi R^3\\right) = \\frac{8}{3}\\pi R^3'
      },
      {
        title: 'Step 4: Total Volume of Unit Cell (V_cell)',
        description: 'Substitute the contact condition a = 4R / √3 into the cubic volume formula.',
        math: 'V_{\\text{cell}} = a^3 = \\left(\\frac{4R}{\\sqrt{3}}\\right)^3 = \\frac{4^3 R^3}{(\\sqrt{3})^3} = \\frac{64 R^3}{3\\sqrt{3}}'
      },
      {
        title: 'Step 5: Exact Algebraic Simplification for APF',
        description: 'Evaluate the ratio of sphere volume to cell volume, inverting the denominator.',
        math: '\\text{APF} = \\frac{\\frac{8}{3}\\pi R^3}{\\frac{64}{3\\sqrt{3}}R^3} = \\left(\\frac{8\\pi}{3}\\right) \\times \\left(\\frac{3\\sqrt{3}}{64}\\right) = \\frac{24\\pi\\sqrt{3}}{192} = \\frac{\\pi\\sqrt{3}}{8} \\approx 0.68017476',
        notes: 'Exact analytical value: π√3 / 8 = 0.680175 (68.02% packing efficiency)'
      }
    ],
    realWorldMaterials: [
      { name: 'Alpha-Iron (Ferrite)', symbol: 'α-Fe', atomicWeight: 55.845, aParam: 2.866, computedDensity: 7.874 },
      { name: 'Tungsten', symbol: 'W', atomicWeight: 183.84, aParam: 3.165, computedDensity: 19.25 },
      { name: 'Chromium', symbol: 'Cr', atomicWeight: 51.996, aParam: 2.884, computedDensity: 7.19 },
      { name: 'Molybdenum', symbol: 'Mo', atomicWeight: 95.95, aParam: 3.147, computedDensity: 10.28 }
    ]
  },
  fcc: {
    id: 'fcc',
    name: 'Face-Centred Cubic (FCC)',
    shortName: 'FCC',
    tagline: 'Close-packed cubic structure with sphere contact along face diagonals [110]',
    coordinationNumber: 12,
    netAtomsFormula: '(8 corners × ⅛) + (6 faces × ½) = 4 atoms',
    netAtomsValue: 4,
    contactDirection: 'Face diagonals ⟨110⟩',
    contactEquation: '4R = a√2',
    latticeParamFormula: 'a = 2R√2',
    cellVolumeFormula: 'V_cell = a^3',
    cellVolumeExpanded: '(2R√2)^3 = 16R^3√2',
    atomVolumeFormula: 'V_atoms = 4 × (4/3)πR^3',
    atomVolumeExpanded: '(16/3)πR^3',
    exactFormulaLatex: '\\text{APF} = \\frac{\\pi\\sqrt{2}}{6} = \\frac{\\pi}{3\\sqrt{2}}',
    exactFormulaDisplay: '(π√2) / 6',
    simplifiedConstant: 'π√2 / 6',
    decimalValue: (Math.PI * Math.sqrt(2)) / 6,
    percentValue: '74.05%',
    voidFractionPercent: '25.95%',
    steps: [
      {
        title: 'Step 1: Contact Geometry along the Cube Face Diagonal',
        description: 'Corner atoms touch the face-centered atom along each square face diagonal. The face diagonal length across an edge a square is a√2, spanning corner radius R, face diameter 2R, and opposite corner radius R.',
        math: '\\text{Face Diagonal} = \\sqrt{a^2 + a^2} = a\\sqrt{2} = R + 2R + R = 4R \\implies a = \\frac{4R}{\\sqrt{2}} = 2\\sqrt{2}R',
        notes: 'Direction vector: [110], [101], [011]'
      },
      {
        title: 'Step 2: Effective Net Number of Atoms (N)',
        description: 'The unit cell has 8 corner atoms (shared by 8 cells) and 6 face-centered atoms (each shared equally between 2 adjacent cells).',
        math: 'N = \\left(8 \\times \\frac{1}{8}\\right) + \\left(6 \\times \\frac{1}{2}\\right) = 1 + 3 = 4 \\text{ net atoms per unit cell}'
      },
      {
        title: 'Step 3: Total Volume Occupied by Spheres (V_atoms)',
        description: 'Volume of 4 rigid spherical atoms of radius R.',
        math: 'V_{\\text{atoms}} = 4 \\times \\left(\\frac{4}{3}\\pi R^3\\right) = \\frac{16}{3}\\pi R^3'
      },
      {
        title: 'Step 4: Total Volume of Unit Cell (V_cell)',
        description: 'Substitute a = 2√2 R into the cubic volume.',
        math: 'V_{\\text{cell}} = a^3 = (2\\sqrt{2}R)^3 = 2^3 \\times (\\sqrt{2})^3 \\times R^3 = 8 \\times 2\\sqrt{2} R^3 = 16\\sqrt{2} R^3'
      },
      {
        title: 'Step 5: Exact Algebraic Simplification for APF',
        description: 'Divide sphere volume by unit cell volume; factor out 16 and rationalise the denominator.',
        math: '\\text{APF} = \\frac{\\frac{16}{3}\\pi R^3}{16\\sqrt{2}R^3} = \\frac{16\\pi}{3 \\times 16\\sqrt{2}} = \\frac{\\pi}{3\\sqrt{2}} = \\frac{\\pi\\sqrt{2}}{6} \\approx 0.7404804897',
        notes: 'By the Kepler Conjecture (proved by Thomas Hales in 1998), 74.05% is the absolute mathematical maximum packing density of identical spheres in 3D Euclidean space.'
      }
    ],
    realWorldMaterials: [
      { name: 'Copper', symbol: 'Cu', atomicWeight: 63.546, aParam: 3.615, computedDensity: 8.934 },
      { name: 'Aluminium', symbol: 'Al', atomicWeight: 26.982, aParam: 4.049, computedDensity: 2.70 },
      { name: 'Gold', symbol: 'Au', atomicWeight: 196.97, aParam: 4.078, computedDensity: 19.30 },
      { name: 'Silver', symbol: 'Ag', atomicWeight: 107.87, aParam: 4.085, computedDensity: 10.49 },
      { name: 'Nickel', symbol: 'Ni', atomicWeight: 58.693, aParam: 3.524, computedDensity: 8.908 }
    ]
  },
  hcp: {
    id: 'hcp',
    name: 'Hexagonal Close-Packed (HCP)',
    shortName: 'HCP',
    tagline: 'Close-packed hexagonal prism with ideal axial ratio c/a = √(8/3) ≈ 1.633',
    coordinationNumber: 12,
    netAtomsFormula: '(12 corners × ⅙) + (2 centers × ½) + (3 interior × 1) = 6 atoms',
    netAtomsValue: 6,
    contactDirection: 'Basal planes ⟨112̄0⟩ and interlayer tetrahedral bonds',
    contactEquation: 'a = 2R, c = 4R√(2/3) = a√(8/3)',
    latticeParamFormula: 'a = 2R, c = a√(8/3)',
    cellVolumeFormula: 'V_cell = (3√3 / 2) · a^2 · c',
    cellVolumeExpanded: '(3√3 / 2) · (2R)^2 · (4R√(2/3)) = 24R^3√2',
    atomVolumeFormula: 'V_atoms = 6 × (4/3)πR^3',
    atomVolumeExpanded: '8πR^3',
    exactFormulaLatex: '\\text{APF} = \\frac{\\pi\\sqrt{2}}{6}',
    exactFormulaDisplay: '(π√2) / 6',
    simplifiedConstant: 'π√2 / 6',
    decimalValue: (Math.PI * Math.sqrt(2)) / 6,
    percentValue: '74.05%',
    voidFractionPercent: '25.95%',
    steps: [
      {
        title: 'Step 1: Contact Geometry & Exact Derivation of Ideal c/a Ratio',
        description: 'Atoms touch in the basal plane along edge a = 2R. Consider the regular tetrahedron formed by three basal atoms at z = 0 and one atom of layer B at z = c/2. The circumradius of an equilateral triangle of side a is d = a / √3.',
        math: 'a^2 = d^2 + \\left(\\frac{c}{2}\\right)^2 = \\left(\\frac{a}{\\sqrt{3}}\\right)^2 + \\frac{c^2}{4} = \\frac{a^2}{3} + \\frac{c^2}{4} \\implies \\frac{c^2}{4} = \\frac{2}{3}a^2 \\implies \\frac{c}{a} = \\sqrt{\\frac{8}{3}} = 2\\sqrt{\\frac{2}{3}} \\approx 1.632993',
        notes: 'Ideal c/a ratio for equal rigid sphere packing is exactly √(8/3).'
      },
      {
        title: 'Step 2: Effective Net Number of Atoms in Full Hexagonal Prism (N)',
        description: 'Top and bottom hexagonal faces have 12 corners (shared among 6 adjacent prisms, contributing 1/6 each), 2 face-centered atoms (shared between 2 cells, contributing 1/2 each), and 3 mid-layer atoms entirely inside.',
        math: 'N = \\left(12 \\times \\frac{1}{6}\\right) + \\left(2 \\times \\frac{1}{2}\\right) + (3 \\times 1) = 2 + 1 + 3 = 6 \\text{ net atoms per full prism}',
        notes: 'In the primitive rhombic unit cell (1/3 of the prism), N = 2.'
      },
      {
        title: 'Step 3: Total Volume Occupied by Spheres (V_atoms)',
        description: 'Volume of 6 spheres of radius R.',
        math: 'V_{\\text{atoms}} = 6 \\times \\left(\\frac{4}{3}\\pi R^3\\right) = 8\\pi R^3'
      },
      {
        title: 'Step 4: Total Volume of Full Hexagonal Prism (V_cell)',
        description: 'The basal area consists of 6 equilateral triangles of side a = 2R. Multiply by height c = a√(8/3).',
        math: 'A_{\\text{base}} = 6 \\times \\left(\\frac{\\sqrt{3}}{4}a^2\\right) = \\frac{3\\sqrt{3}}{2}a^2, \\quad V_{\\text{cell}} = A_{\\text{base}} \\times c = \\frac{3\\sqrt{3}}{2}a^2 \\left(\\sqrt{\\frac{8}{3}}a\\right) = 3\\sqrt{2}a^3',
        notes: 'Substituting a = 2R: V_cell = 3√2 (2R)³ = 3√2 (8R³) = 24√2 R³'
      },
      {
        title: 'Step 5: Exact Algebraic Simplification for APF',
        description: 'Evaluate the ratio of sphere volume to prism cell volume.',
        math: '\\text{APF} = \\frac{8\\pi R^3}{24\\sqrt{2}R^3} = \\frac{8\\pi}{24\\sqrt{2}} = \\frac{\\pi}{3\\sqrt{2}} = \\frac{\\pi\\sqrt{2}}{6} \\approx 0.7404804897',
        notes: 'Matches FCC packing efficiency identically! Both structures represent dense close-packed sphere arrangements with differing stacking sequences (ABAB for HCP vs ABCABC for FCC).'
      }
    ],
    realWorldMaterials: [
      { name: 'Magnesium', symbol: 'Mg', atomicWeight: 24.305, aParam: 3.209, computedDensity: 1.74 },
      { name: 'Titanium (α-Ti)', symbol: 'α-Ti', atomicWeight: 47.867, aParam: 2.951, computedDensity: 4.51 },
      { name: 'Zinc', symbol: 'Zn', atomicWeight: 65.38, aParam: 2.665, computedDensity: 7.14 },
      { name: 'Zirconium', symbol: 'α-Zr', atomicWeight: 91.224, aParam: 3.232, computedDensity: 6.51 }
    ]
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Cubic Structure',
    shortName: 'Diamond',
    tagline: 'Covalent tetrahedral structure consisting of two interpenetrating FCC lattices',
    coordinationNumber: 4,
    netAtomsFormula: '4 FCC lattice + 4 tetrahedral interstitial = 8 atoms',
    netAtomsValue: 8,
    contactDirection: 'Quarter body diagonals [111]',
    contactEquation: '2R = a√3 / 4  →  8R = a√3',
    latticeParamFormula: 'a = 8R / √3',
    cellVolumeFormula: 'V_cell = a^3',
    cellVolumeExpanded: '(8R / √3)^3 = 512R^3 / (3√3)',
    atomVolumeFormula: 'V_atoms = 8 × (4/3)πR^3',
    atomVolumeExpanded: '(32/3)πR^3',
    exactFormulaLatex: '\\text{APF} = \\frac{\\pi\\sqrt{3}}{16}',
    exactFormulaDisplay: '(π√3) / 16',
    simplifiedConstant: 'π√3 / 16',
    decimalValue: (Math.PI * Math.sqrt(3)) / 16,
    percentValue: '34.01%',
    voidFractionPercent: '65.99%',
    steps: [
      {
        title: 'Step 1: Contact Geometry along Quarter Body Diagonal',
        description: 'Each carbon atom is covalently bonded to four neighbors in tetrahedral coordination. Sphere contact occurs along the vector from (0,0,0) to (1/4, 1/4, 1/4), which is one quarter of the unit cell body diagonal.',
        math: '2R = \\frac{1}{4} \\times (\\text{Body Diagonal}) = \\frac{a\\sqrt{3}}{4} \\implies a = \\frac{8R}{\\sqrt{3}}',
        notes: 'Bond length: d_CC = 2R = a√3 / 4'
      },
      {
        title: 'Step 2: Effective Net Number of Atoms (N)',
        description: 'An FCC host lattice (4 net atoms) plus 4 fully contained internal atoms occupying half the tetrahedral interstitial sites.',
        math: 'N = 4_{\\text{FCC}} + 4_{\\text{tetrahedral}} = 8 \\text{ net atoms per unit cell}'
      },
      {
        title: 'Step 3: Total Volume Occupied by Spheres (V_atoms)',
        description: 'Volume of 8 hard spheres of radius R.',
        math: 'V_{\\text{atoms}} = 8 \\times \\left(\\frac{4}{3}\\pi R^3\\right) = \\frac{32}{3}\\pi R^3'
      },
      {
        title: 'Step 4: Total Volume of Unit Cell (V_cell)',
        description: 'Substitute a = 8R / √3 into cubic volume.',
        math: 'V_{\\text{cell}} = a^3 = \\left(\\frac{8R}{\\sqrt{3}}\\right)^3 = \\frac{512 R^3}{3\\sqrt{3}}'
      },
      {
        title: 'Step 5: Exact Algebraic Simplification for APF',
        description: 'Evaluate the ratio of sphere volume to cell volume.',
        math: '\\text{APF} = \\frac{\\frac{32}{3}\\pi R^3}{\\frac{512}{3\\sqrt{3}}R^3} = \\left(\\frac{32\\pi}{3}\\right) \\times \\left(\\frac{3\\sqrt{3}}{512}\\right) = \\frac{32\\pi\\sqrt{3}}{512} = \\frac{\\pi\\sqrt{3}}{16} \\approx 0.34008738',
        notes: 'Notice that diamond is half as dense in packing as BCC (π√3/16 vs π√3/8)! Over 65.99% is empty void space due to open sp³ tetrahedral hybridization.'
      }
    ],
    realWorldMaterials: [
      { name: 'Diamond (Carbon)', symbol: 'C', atomicWeight: 12.011, aParam: 3.567, computedDensity: 3.515 },
      { name: 'Silicon', symbol: 'Si', atomicWeight: 28.085, aParam: 5.431, computedDensity: 2.329 },
      { name: 'Germanium', symbol: 'Ge', atomicWeight: 72.63, aParam: 5.658, computedDensity: 5.323 }
    ]
  },
  nacl: {
    id: 'nacl',
    name: 'Rock Salt (NaCl / B1 Ionic Structure)',
    shortName: 'NaCl (B1)',
    tagline: 'Binary ionic crystal with two distinct ionic radii (r_cation and r_anion)',
    coordinationNumber: 6,
    netAtomsFormula: '4 Na⁺ cations + 4 Cl⁻ anions per unit cell',
    netAtomsValue: 8,
    contactDirection: 'Cube edges ⟨100⟩ (cation-anion contact)',
    contactEquation: 'a = 2(R_cation + R_anion)',
    latticeParamFormula: 'a = 2(R₊ + R₋)',
    cellVolumeFormula: 'V_cell = [2(R₊ + R₋)]^3',
    cellVolumeExpanded: '8(R₊ + R₋)^3',
    atomVolumeFormula: 'V_ions = 4(4/3)πR₊^3 + 4(4/3)πR₋^3',
    atomVolumeExpanded: '(16/3)π (R₊^3 + R₋^3)',
    exactFormulaLatex: '\\text{APF} = \\frac{2\\pi}{3} \\cdot \\frac{R_+^3 + R_-^3}{(R_+ + R_-)^3}',
    exactFormulaDisplay: '[2π/3] · (R₊³ + R₋³) / (R₊ + R₋)³',
    simplifiedConstant: 'Ionic ratio dependent: f(r₊/r₋)',
    decimalValue: 0.665,
    percentValue: '~66.5% (NaCl standard)',
    voidFractionPercent: '~33.5%',
    steps: [
      {
        title: 'Step 1: Contact Geometry in Binary Ionic Salt',
        description: 'In the rock salt structure, anions and cations touch along the cube edges [100]. An edge consists of one cation diameter 2R₊ and two anion radii 2R₋.',
        math: 'a = 2R_+ + 2R_- = 2(R_+ + R_-)',
        notes: 'Radius ratio for octahedral stability: r+/r- must exceed √2 - 1 ≈ 0.414'
      },
      {
        title: 'Step 2: Effective Net Number of Ions (N)',
        description: 'The unit cell consists of two interpenetrating FCC sublattices: 4 Na⁺ cations and 4 Cl⁻ anions.',
        math: 'N_+ = 4 \\text{ cations, } \\quad N_- = 4 \\text{ anions (Total = 8 ions)}'
      },
      {
        title: 'Step 3: Total Ionic Volume (V_ions)',
        description: 'Sum the sphere volumes of both species.',
        math: 'V_{\\text{ions}} = 4 \\times \\left(\\frac{4}{3}\\pi R_+^3\\right) + 4 \\times \\left(\\frac{4}{3}\\pi R_-^3\\right) = \\frac{16}{3}\\pi \\left(R_+^3 + R_-^3\\right)'
      },
      {
        title: 'Step 4: Total Volume of Unit Cell (V_cell)',
        description: 'Cube the edge parameter a = 2(R₊ + R₋).',
        math: 'V_{\\text{cell}} = a^3 = [2(R_+ + R_-)]^3 = 8(R_+ + R_-)^3'
      },
      {
        title: 'Step 5: Exact Multi-Component APF Formula',
        description: 'Divide total ionic volume by cell volume.',
        math: '\\text{APF}_{\\text{ionic}} = \\frac{\\frac{16}{3}\\pi (R_+^3 + R_-^3)}{8(R_+ + R_-)^3} = \\frac{2\\pi}{3} \\cdot \\frac{R_+^3 + R_-^3}{(R_+ + R_-)^3}',
        notes: 'For NaCl (R_Na+ = 1.02 Å, R_Cl- = 1.81 Å, ratio ~ 0.564): APF ≈ 0.665 (66.5%).'
      }
    ],
    realWorldMaterials: [
      { name: 'Halite (Table Salt)', symbol: 'NaCl', atomicWeight: 58.44, aParam: 5.640, computedDensity: 2.165 },
      { name: 'Magnesium Oxide', symbol: 'MgO', atomicWeight: 40.304, aParam: 4.212, computedDensity: 3.58 },
      { name: 'Lead Sulfide (Galena)', symbol: 'PbS', atomicWeight: 239.26, aParam: 5.936, computedDensity: 7.60 }
    ]
  }
};

export const APFMathematicsSection: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<APFStructureKey>('fcc');
  const [customRadius, setCustomRadius] = useState<number>(1.25); // Angstroms
  const [interactiveTab, setInteractiveTab] = useState<'proof' | 'calculator' | 'comparison'>('proof');

  const active = useMemo(() => APF_DERIVATIONS[selectedKey], [selectedKey]);

  // Derived custom numerical calculations
  const calcDetails = useMemo(() => {
    const R = customRadius;
    const R3 = Math.pow(R, 3);
    const vSphere = (4 / 3) * Math.PI * R3;

    let a = 0;
    let vCell = 0;
    let nAtoms = active.netAtomsValue;

    if (selectedKey === 'sc') {
      a = 2 * R;
      vCell = Math.pow(a, 3);
    } else if (selectedKey === 'bcc') {
      a = (4 * R) / Math.sqrt(3);
      vCell = Math.pow(a, 3);
    } else if (selectedKey === 'fcc') {
      a = 2 * Math.SQRT2 * R;
      vCell = Math.pow(a, 3);
    } else if (selectedKey === 'hcp') {
      a = 2 * R;
      const c = a * Math.sqrt(8 / 3);
      const baseArea = (3 * Math.sqrt(3) / 2) * Math.pow(a, 2);
      vCell = baseArea * c;
    } else if (selectedKey === 'diamond') {
      a = (8 * R) / Math.sqrt(3);
      vCell = Math.pow(a, 3);
    } else if (selectedKey === 'nacl') {
      // assume standard ratio 0.564 for Na/Cl
      const rCation = R * 0.564;
      const rAnion = R;
      a = 2 * (rCation + rAnion);
      vCell = Math.pow(a, 3);
    }

    const vAtomsTotal = nAtoms * vSphere;
    const computedAPF = vAtomsTotal / vCell;
    const voidFrac = 1 - computedAPF;

    return {
      R,
      a,
      vSphere,
      vAtomsTotal,
      vCell,
      computedAPF,
      voidFrac
    };
  }, [customRadius, selectedKey, active]);

  return (
    <div className="space-y-8 text-slate-100">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-bold tracking-wide">
              <Calculator className="w-3.5 h-3.5" />
              <span>Crystallographic Packing Theory</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Universal Definition:</span>
              <span className="px-3 py-1 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-emerald-400 font-bold">
                APF = V_atoms / V_unit_cell
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Atomic Packing Factor (APF) Exact Mathematical Derivations</span>
            </h2>
            <p className="text-sm text-slate-300 max-w-4xl mt-2 leading-relaxed font-normal">
              The <strong>Atomic Packing Factor (APF)</strong> represents the fractional volume in a crystal structure occupied by hard constituent spherical atoms. Below are the <strong>closed-form analytical mathematical formulas</strong> derived from strict touch conditions, Pythagorean geometry, and unit cell volume cancellations.
            </p>
          </div>

          {/* Quick Universal Formula Callout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-mono text-indigo-400 uppercase block font-bold">1. General Formulation</span>
              <div className="mt-2 text-sm font-mono text-white font-bold">
                APF = (N_net · V_atom) / V_cell
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Where N_net is the effective number of sphere equivalents inside the unit cell.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-mono text-emerald-400 uppercase block font-bold">2. Sphere Volume</span>
              <div className="mt-2 text-sm font-mono text-white font-bold">
                V_atom = (4/3) π R³
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Rigid hard-sphere approximation where R is the metallic or covalent radius.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-mono text-rose-400 uppercase block font-bold">3. Void Fraction (Porosity)</span>
              <div className="mt-2 text-sm font-mono text-white font-bold">
                Φ_void = 1 - APF
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Complementary fraction of unit cell volume available as interstitial void space.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Structure Selector Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Atom className="w-4 h-4 text-indigo-400" />
            <span>Select Crystal Architecture for Exact Closed-Form Derivation</span>
          </span>
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => { playSynthTone('tick'); setInteractiveTab('proof'); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                interactiveTab === 'proof' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Step-by-Step Proof
            </button>
            <button
              onClick={() => { playSynthTone('tick'); setInteractiveTab('calculator'); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                interactiveTab === 'calculator' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Numerical Sandbox
            </button>
            <button
              onClick={() => { playSynthTone('tick'); setInteractiveTab('comparison'); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                interactiveTab === 'comparison' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Master Comparison Table
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(APF_DERIVATIONS) as APFStructureKey[]).map((key) => {
            const item = APF_DERIVATIONS[key];
            const isSelected = selectedKey === key;
            return (
              <button
                key={key}
                onClick={() => {
                  playSynthTone('switch');
                  setSelectedKey(key);
                }}
                className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-indigo-500/20 rounded-bl-full pointer-events-none" />
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-400">{item.shortName}</span>
                  <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {item.percentValue}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-1 truncate">{item.name.split(' (')[0]}</div>
                <div className="text-[10px] font-mono text-amber-400 mt-2 font-semibold">
                  {item.exactFormulaDisplay}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: STEP-BY-STEP RIGOROUS MATHEMATICAL PROOF */}
      {interactiveTab === 'proof' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Derivation Narrative */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Active Header Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wide">
                    Exact Mathematical Derivation
                  </div>
                  <h3 className="text-2xl font-black text-white mt-0.5">{active.name}</h3>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm inline-block">
                    APF = {active.percentValue}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">
                    Closed-Form: {active.exactFormulaDisplay}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {active.tagline}
              </p>

              {/* Quick Spec Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Touch Line</span>
                  <span className="text-indigo-400 font-bold">{active.contactDirection}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">a(R) Relation</span>
                  <span className="text-amber-400 font-bold">{active.latticeParamFormula}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Coordination (CN)</span>
                  <span className="text-rose-400 font-bold">CN = {active.coordinationNumber}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Void Porosity</span>
                  <span className="text-sky-400 font-bold">{active.voidFractionPercent}</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Derivation Cards */}
            <div className="space-y-4">
              {active.steps.map((step, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-2.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-wide">{step.title}</h4>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal pl-8">
                    {step.description}
                  </p>

                  {/* Math Formula Callout Box */}
                  <div className="ml-8 p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-emerald-300 font-bold overflow-x-auto shadow-inner">
                    <code>{step.math}</code>
                  </div>

                  {step.notes && (
                    <div className="ml-8 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono italic">
                      <Info className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>{step.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final Algebraic Summary Card */}
            <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs font-bold uppercase">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Exact Analytical Result</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-slate-400">Closed-Form Analytical Formula:</span>
                  <div className="text-xl font-mono font-black text-amber-400">
                    APF = {active.exactFormulaDisplay}
                  </div>
                </div>
                <div className="sm:text-right space-y-1">
                  <span className="text-[11px] font-mono text-slate-400">High-Precision Decimal:</span>
                  <div className="text-xl font-mono font-black text-emerald-400">
                    {active.decimalValue.toFixed(8)}... ({active.percentValue})
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar: Real Materials & Physics Insights */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Contact Diagram Schematic Preview */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Sphere Packing Geometry
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                  {active.shortName}
                </span>
              </div>

              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 flex flex-col items-center justify-center min-h-[190px] relative overflow-hidden">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-black font-mono text-indigo-400 tracking-tight">
                    {active.exactFormulaDisplay}
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold">
                    = {active.percentValue}
                  </div>
                  <div className="pt-2 text-[11px] text-slate-400 font-mono max-w-[200px] leading-snug">
                    Touch condition: <span className="text-amber-400 font-bold">{active.contactEquation}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-normal space-y-1 pt-1">
                <div className="flex justify-between py-1 border-b border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400">Net Atoms / Cell:</span>
                  <span className="text-white font-bold">{active.netAtomsValue}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400">Cell Volume V_c:</span>
                  <span className="text-indigo-300 font-bold">{active.cellVolumeExpanded}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400">Atoms Volume V_a:</span>
                  <span className="text-emerald-300 font-bold">{active.atomVolumeExpanded}</span>
                </div>
                <div className="flex justify-between py-1 text-[11px] font-mono">
                  <span className="text-slate-400">Interstice Void Space:</span>
                  <span className="text-rose-400 font-bold">{active.voidFractionPercent}</span>
                </div>
              </div>
            </div>

            {/* Elemental Materials Realizations */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Real Elements with {active.shortName} Lattice</span>
              </span>

              <div className="space-y-2">
                {active.realWorldMaterials.map((mat, i) => (
                  <div 
                    key={i} 
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{mat.name}</span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {mat.symbol}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        a = {mat.aParam.toFixed(3)} Å | M = {mat.atomicWeight.toFixed(2)} g/mol
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {mat.computedDensity.toFixed(2)}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">g/cm³</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Density Connection Insight Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase block">
                Connection to Macroscopic Density (ρ)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                APF links microscopic lattice dimensions to macroscopic physical density:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 font-bold text-center">
                ρ = (N_net · M) / (V_cell · N_A)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Where <code>M</code> is the molar mass and <code>N_A = 6.02214 × 10²³ mol⁻¹</code> is Avogadro's number.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: LIVE NUMERICAL APF & PARAMETER SANDBOX */}
      {interactiveTab === 'calculator' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wide">
              Parametric Crystallographic Sandbox
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Live APF, Cell Geometry & Density Simulator ({active.name})
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Adjust the atomic radius R to observe the invariant nature of APF. While the absolute volumes scale with R³, their ratio <code>V_atoms / V_cell</code> is mathematically constant!
            </p>
          </div>

          {/* Interactive Radius Slider */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4 max-w-2xl">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Atomic Radius (R)</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-indigo-950 text-indigo-300 font-bold border border-indigo-500/20">
                R = {customRadius.toFixed(3)} Å (0.{Math.round(customRadius * 100)} nm)
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.01"
              value={customRadius}
              onChange={(e) => setCustomRadius(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 accent-indigo-500 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.50 Å (Smallest, e.g. Be/C)</span>
              <span>1.25 Å (Transition metals)</span>
              <span>2.50 Å (Large alkalis, e.g. Cs)</span>
            </div>
          </div>

          {/* Live Calculated Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Computed Lattice Parameter (a)</span>
              <div className="text-xl font-mono font-black text-amber-400">
                a = {calcDetails.a.toFixed(4)} Å
              </div>
              <span className="text-[10px] font-mono text-slate-400 block">
                Via touch rule: {active.latticeParamFormula}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Unit Cell Volume (V_cell)</span>
              <div className="text-xl font-mono font-black text-indigo-300">
                {calcDetails.vCell.toFixed(3)} Å³
              </div>
              <span className="text-[10px] font-mono text-slate-400 block">
                {(calcDetails.vCell * 1e-24).toExponential(3)} cm³
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Total Atom Volume (V_atoms)</span>
              <div className="text-xl font-mono font-black text-sky-400">
                {calcDetails.vAtomsTotal.toFixed(3)} Å³
              </div>
              <span className="text-[10px] font-mono text-slate-400 block">
                {active.netAtomsValue} spheres × {(calcDetails.vSphere).toFixed(3)} Å³
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block font-bold">Exact Computed APF</span>
              <div className="text-xl font-mono font-black text-emerald-400">
                {(calcDetails.computedAPF * 100).toFixed(2)}%
              </div>
              <span className="text-[10px] font-mono text-slate-400 block">
                Closed-form: {active.exactFormulaDisplay}
              </span>
            </div>
          </div>

          {/* Visual Percentage Bar */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-emerald-400 font-bold">
                Solid Hard-Sphere Volume: {(calcDetails.computedAPF * 100).toFixed(2)}%
              </span>
              <span className="text-rose-400 font-bold">
                Interstice Void Volume: {(calcDetails.voidFrac * 100).toFixed(2)}%
              </span>
            </div>

            <div className="h-6 w-full bg-slate-900 rounded-xl overflow-hidden flex border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 flex items-center justify-center text-[10px] font-mono font-bold text-white transition-all duration-300"
                style={{ width: `${calcDetails.computedAPF * 100}%` }}
              >
                Solid ({(calcDetails.computedAPF * 100).toFixed(1)}%)
              </div>
              <div 
                className="h-full bg-slate-800/90 flex items-center justify-center text-[10px] font-mono font-bold text-rose-300 transition-all duration-300"
                style={{ width: `${calcDetails.voidFrac * 100}%` }}
              >
                Void ({(calcDetails.voidFrac * 100).toFixed(1)}%)
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: MASTER COMPARISON MATRIX ACROSS ALL STRUCTURES */}
      {interactiveTab === 'comparison' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wide">
              Master Crystallographic Benchmark
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              Comparative Analysis of Atomic Packing Factors Across Canonical Systems
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Side-by-side analytical matrix contrasting coordination numbers, touch geometry vectors, lattice-radius relationships, exact closed-form algebraic expressions, and interstitial porosity.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Structure</th>
                  <th className="p-3.5">Coordination (CN)</th>
                  <th className="p-3.5">Touch Direction</th>
                  <th className="p-3.5">Lattice Relation a(R)</th>
                  <th className="p-3.5">Net Atoms (N)</th>
                  <th className="p-3.5">Exact Analytical APF</th>
                  <th className="p-3.5">Decimal Value</th>
                  <th className="p-3.5">Void Space (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {(Object.keys(APF_DERIVATIONS) as APFStructureKey[]).map((key) => {
                  const s = APF_DERIVATIONS[key];
                  const isCurrent = s.id === selectedKey;
                  return (
                    <tr 
                      key={key} 
                      onClick={() => { setSelectedKey(key); setInteractiveTab('proof'); }}
                      className={`hover:bg-indigo-950/40 cursor-pointer transition-colors ${isCurrent ? 'bg-indigo-950/30 font-bold' : ''}`}
                    >
                      <td className="p-3.5 text-white">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-rose-400 font-bold">{s.coordinationNumber}</td>
                      <td className="p-3.5 text-slate-300">{s.contactDirection}</td>
                      <td className="p-3.5 text-amber-300">{s.latticeParamFormula}</td>
                      <td className="p-3.5 text-slate-200">{s.netAtomsValue}</td>
                      <td className="p-3.5 text-emerald-400 font-bold">{s.exactFormulaDisplay}</td>
                      <td className="p-3.5 text-emerald-300 font-bold">{s.percentValue}</td>
                      <td className="p-3.5 text-sky-400">{s.voidFractionPercent}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Kepler Conjecture Theorem Callout */}
          <div className="bg-slate-950 rounded-2xl p-5 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>The Kepler Conjecture (Mathematical Maximum Sphere Packing)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In 1611, Johannes Kepler conjectured that no arrangement of equally sized spheres fills 3D space with a density greater than the face-centered cubic (FCC) or hexagonal close-packed (HCP) arrangements:
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 font-bold text-center">
              APF_max = π / (3√2) = (π√2) / 6 ≈ 0.740480489693... (74.05%)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This longstanding mathematical theorem was formally proved with computer verification by Thomas Hales in 1998 (published in 2005). FCC and HCP share this identical packing density, differing only in stacking sequence (ABCABC... vs ABABAB...).
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
