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
  Sliders,
  Box,
  Hexagon,
  Grid3x3,
  Combine
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
  const [customRadius, setCustomRadius] = useState<number>(1.278); // Angstroms (Cu default)
  const [customMolarMass, setCustomMolarMass] = useState<number>(63.546); // g/mol (Cu default)
  const [customHcpCA, setCustomHcpCA] = useState<number>(Math.sqrt(8 / 3)); // Ideal 1.63299
  const [customIonicRatio, setCustomIonicRatio] = useState<number>(0.564); // R+/R- (NaCl default)
  const [interactiveTab, setInteractiveTab] = useState<'proof' | 'calculator' | 'comparison'>('proof');

  // Custom user-defined materials per lattice structure
  const [customMaterials, setCustomMaterials] = useState<Record<APFStructureKey, { name: string; symbol: string; atomicWeight: number; aParam: number; computedDensity: number; rAtom?: number }[]>>({
    sc: [],
    bcc: [],
    fcc: [],
    hcp: [],
    diamond: [],
    nacl: []
  });
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('Custom Alloy / Phase');
  const [formSymbol, setFormSymbol] = useState<string>('Cu₀.₈Ni₀.₂');
  const [formMass, setFormMass] = useState<string>('62.58');
  const [formRadius, setFormRadius] = useState<string>('1.272');

  const active = useMemo(() => APF_DERIVATIONS[selectedKey], [selectedKey]);

  const allMaterialsForActive = useMemo(() => {
    return [...active.realWorldMaterials, ...(customMaterials[selectedKey] || [])];
  }, [active, customMaterials, selectedKey]);

  // Rigorous Solid-State Crystallographic Metrology Engine
  const calcDetails = useMemo(() => {
    const R = Math.max(0.2, customRadius);
    const R3 = Math.pow(R, 3);
    const vSphere = (4 / 3) * Math.PI * R3;
    const NA = 6.02214076e23;

    let a = 0;
    let c = 0;
    let vCell = 0;
    let vAtomsTotal = 0;
    let nAtoms = active.netAtomsValue;
    let formulaUnitsZ = nAtoms;
    let contactRegimeNote = active.contactDirection;
    let rOct = 0;
    let rTet = 0;
    let ld100 = 0;
    let ld110 = 0;
    let ld111 = 0;
    let pd100 = 0;
    let pd110 = 0;
    let pd111 = 0;
    let ppfClosePacked = 0;

    if (selectedKey === 'sc') {
      a = 2 * R;
      c = a;
      vCell = Math.pow(a, 3);
      vAtomsTotal = nAtoms * vSphere;
      rOct = (Math.sqrt(3) - 1) * R; // Cubic center void
      rTet = (Math.sqrt(2) - 1) * R; // Face center void
      ld100 = (1 / a) * 10; // atoms/nm
      ld110 = (1 / (a * Math.SQRT2)) * 10;
      ld111 = (1 / (a * Math.sqrt(3))) * 10;
      pd100 = (1 / (a * a)) * 100; // atoms/nm^2
      pd110 = (1 / (a * a * Math.SQRT2)) * 100;
      pd111 = (0.5 / ((Math.sqrt(3) / 2) * a * a)) * 100;
      ppfClosePacked = (Math.PI / 4) * 100; // 78.54% on (100)
    } else if (selectedKey === 'bcc') {
      a = (4 * R) / Math.sqrt(3);
      c = a;
      vCell = Math.pow(a, 3);
      vAtomsTotal = nAtoms * vSphere;
      rTet = (Math.sqrt(5 / 3) - 1) * R; // 0.291 R
      rOct = (2 / Math.sqrt(3) - 1) * R; // 0.155 R
      ld100 = (1 / a) * 10;
      ld110 = (1 / (a * Math.SQRT2)) * 10;
      ld111 = (2 / (a * Math.sqrt(3))) * 10; // Close-packed line: 1/(2R)
      pd100 = (1 / (a * a)) * 100;
      pd110 = (2 / (a * a * Math.SQRT2)) * 100; // Most densely packed plane {110}
      pd111 = (0.5 / ((Math.sqrt(3) / 2) * a * a)) * 100;
      ppfClosePacked = ((3 * Math.PI) / (8 * Math.SQRT2)) * 100; // 83.33% on (110)
    } else if (selectedKey === 'fcc') {
      a = 2 * Math.SQRT2 * R;
      c = a;
      vCell = Math.pow(a, 3);
      vAtomsTotal = nAtoms * vSphere;
      rOct = (Math.SQRT2 - 1) * R; // 0.414 R
      rTet = (Math.sqrt(1.5) - 1) * R; // 0.225 R
      ld100 = (1 / a) * 10;
      ld110 = (2 / (a * Math.SQRT2)) * 10; // Close-packed line: 1/(2R)
      ld111 = (1 / (a * Math.sqrt(3))) * 10;
      pd100 = (2 / (a * a)) * 100;
      pd110 = (2 / (a * a * Math.SQRT2)) * 100;
      pd111 = (2 / ((Math.sqrt(3) / 2) * a * a)) * 100; // Close-packed {111}
      ppfClosePacked = (Math.PI / (2 * Math.sqrt(3))) * 100; // 90.69% on (111)
    } else if (selectedKey === 'hcp') {
      const caIdeal = Math.sqrt(8 / 3);
      const ca = customHcpCA;
      if (ca >= caIdeal - 1e-6) {
        // Basal hard-sphere contact (a = 2R)
        a = 2 * R;
        contactRegimeNote = ca > caIdeal + 1e-3 ? 'Basal [112̄0] Contact (c-Elongated)' : 'Ideal Isotropic Basal + AB Contact';
      } else {
        // Compressed along c: out-of-plane AB tetrahedral contact occurs first!
        // d_AB^2 = a^2/3 + c^2/4 = (2R)^2 => a = 2R / sqrt(1/3 + (c/a)^2 / 4)
        a = (2 * R) / Math.sqrt(1 / 3 + (ca * ca) / 4);
        contactRegimeNote = 'Out-of-Plane AB Contact (c-Compressed)';
      }
      c = a * ca;
      const baseArea = ((3 * Math.sqrt(3)) / 2) * Math.pow(a, 2);
      vCell = baseArea * c;
      vAtomsTotal = nAtoms * vSphere;
      rOct = (Math.SQRT2 - 1) * R;
      rTet = (Math.sqrt(1.5) - 1) * R;
      ld100 = (1 / a) * 10; // [11-20] close-packed row
      ld110 = (1 / (a * Math.sqrt(3))) * 10;
      ld111 = (1 / c) * 10; // [0001] c-axis
      pd100 = (3 / baseArea) * 100; // Basal (0001) plane has 3 net atoms per hex base
      pd110 = (1 / (a * c)) * 100; // Prismatic (10-10)
      pd111 = pd100;
      ppfClosePacked = (Math.PI / (2 * Math.sqrt(3))) * Math.pow((2 * R) / a, 2) * 100;
    } else if (selectedKey === 'diamond') {
      a = (8 * R) / Math.sqrt(3);
      c = a;
      vCell = Math.pow(a, 3);
      vAtomsTotal = nAtoms * vSphere;
      rTet = R; // Unoccupied tetrahedral subcell cavity accepts a sphere of radius R
      rOct = 0.72 * R;
      ld100 = (1 / a) * 10;
      ld110 = (2 / (a * Math.SQRT2)) * 10;
      ld111 = (2 / (a * Math.sqrt(3))) * 10;
      pd100 = (2 / (a * a)) * 100;
      pd110 = (4 / (a * a * Math.SQRT2)) * 100;
      pd111 = (2 / ((Math.sqrt(3) / 2) * a * a)) * 100;
      ppfClosePacked = ((3 * Math.sqrt(3) * Math.PI) / 64) * 100; // 25.51%
    } else if (selectedKey === 'nacl') {
      // Rigorous Two-Species Ionic Packing with Pauling Critical Limit (sqrt(2) - 1 = 0.41421)
      const gamma = customIonicRatio; // R+ / R-
      const rAnion = R;
      const rCation = R * gamma;
      const crit = Math.SQRT2 - 1;
      if (gamma >= crit) {
        // Cation-Anion contact along [100] cube edge
        a = 2 * (rCation + rAnion);
        contactRegimeNote = 'Cation–Anion [100] Edge Contact (γ ≥ 0.414)';
      } else {
        // Anion-Anion contact along [110] face diagonal!
        a = 2 * Math.SQRT2 * rAnion;
        contactRegimeNote = 'Anion–Anion [110] Face-Diagonal Contact (γ < 0.414)';
      }
      c = a;
      vCell = Math.pow(a, 3);
      const vAnions = 4 * ((4 / 3) * Math.PI * Math.pow(rAnion, 3));
      const vCations = 4 * ((4 / 3) * Math.PI * Math.pow(rCation, 3));
      vAtomsTotal = vAnions + vCations;
      formulaUnitsZ = 4; // 4 NaCl formula units per unit cell
      rOct = (Math.SQRT2 - 1) * rAnion;
      rTet = (Math.sqrt(1.5) - 1) * rAnion;
      ld100 = (2 / a) * 10; // 1 cation + 1 anion along edge a
      ld110 = (2 / (a * Math.SQRT2)) * 10;
      ld111 = (1 / (a * Math.sqrt(3))) * 10;
      pd100 = (4 / (a * a)) * 100; // 2 Na+ + 2 Cl- on (100)
      pd110 = (4 / (a * a * Math.SQRT2)) * 100;
      pd111 = (2 / ((Math.sqrt(3) / 2) * a * a)) * 100;
      ppfClosePacked = ((2 * Math.PI * (rAnion * rAnion + rCation * rCation)) / (a * a)) * 100;
    }

    const computedAPF = vAtomsTotal / vCell;
    const voidFrac = Math.max(0, 1 - computedAPF);
    const theoreticalDensity = (formulaUnitsZ * customMolarMass) / (vCell * 1e-24 * NA);

    return {
      R,
      a,
      c,
      vSphere,
      vAtomsTotal,
      vCell,
      computedAPF,
      voidFrac,
      theoreticalDensity,
      contactRegimeNote,
      rOct,
      rTet,
      ld100,
      ld110,
      ld111,
      pd100,
      pd110,
      pd111,
      ppfClosePacked
    };
  }, [customRadius, customMolarMass, customHcpCA, customIonicRatio, selectedKey, active]);

  const handleAddCustomMaterial = () => {
    const mass = parseFloat(formMass);
    const rVal = parseFloat(formRadius);
    if (!formName.trim() || !formSymbol.trim() || isNaN(mass) || mass <= 0 || isNaN(rVal) || rVal <= 0) return;

    playSynthTone('chime');
    const NA = 6.02214076e23;
    let aCalc = 2 * rVal;
    let vCellCalc = Math.pow(aCalc, 3);
    let zUnits = active.netAtomsValue;

    if (selectedKey === 'sc') {
      aCalc = 2 * rVal;
      vCellCalc = Math.pow(aCalc, 3);
    } else if (selectedKey === 'bcc') {
      aCalc = (4 * rVal) / Math.sqrt(3);
      vCellCalc = Math.pow(aCalc, 3);
    } else if (selectedKey === 'fcc') {
      aCalc = 2 * Math.SQRT2 * rVal;
      vCellCalc = Math.pow(aCalc, 3);
    } else if (selectedKey === 'hcp') {
      aCalc = 2 * rVal;
      const cCalc = aCalc * customHcpCA;
      vCellCalc = ((3 * Math.sqrt(3)) / 2) * aCalc * aCalc * cCalc;
    } else if (selectedKey === 'diamond') {
      aCalc = (8 * rVal) / Math.sqrt(3);
      vCellCalc = Math.pow(aCalc, 3);
    } else if (selectedKey === 'nacl') {
      aCalc = 2 * rVal * (1 + customIonicRatio);
      vCellCalc = Math.pow(aCalc, 3);
      zUnits = 4;
    }

    const rhoCalc = (zUnits * mass) / (vCellCalc * 1e-24 * NA);

    setCustomMaterials(prev => ({
      ...prev,
      [selectedKey]: [
        ...(prev[selectedKey] || []),
        {
          name: formName.trim(),
          symbol: formSymbol.trim(),
          atomicWeight: mass,
          aParam: aCalc,
          computedDensity: rhoCalc,
          rAtom: rVal
        }
      ]
    }));

    setCustomRadius(rVal);
    setCustomMolarMass(mass);
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-8 text-slate-100">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#0B0F19] border border-slate-800 p-6 shadow-2xl">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
            <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-mono uppercase tracking-widest font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Crystallographic Packing Metrology • Closed-Form Analytical Proofs</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500 uppercase text-[10px]">Invariant Ratio:</span>
              <span className="px-3 py-1 rounded-lg bg-[#070A12] border border-slate-800 text-cyan-300 font-bold overflow-hidden flex items-center min-h-[30px]">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {`$$\\text{APF} = \\frac{V_{\\text{atoms}}}{V_{\\text{unit\\_cell}}}$$`}
                </ReactMarkdown>
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Atomic Packing Factor (APF) Exact Mathematical Derivations
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-4xl mt-1.5 leading-relaxed font-normal">
              The <strong className="text-slate-200">Atomic Packing Factor (APF)</strong> defines the volume fraction of a crystallographic unit cell occupied by rigid hard-sphere atoms. Select a lattice architecture below to inspect its 3D cross-sectional contact vector, closed-form Pythagorean derivation, and interstitial void fraction.
            </p>
          </div>

          {/* Quick Universal Formula Callout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="bg-[#070A12] p-3.5 rounded-lg border border-slate-800/90">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold mb-1">01 // Occupied Fraction</span>
              <div className="text-sm font-mono text-slate-100 font-bold py-0.5 overflow-x-auto min-h-[36px] flex items-center">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {`$$\\text{APF} = \\frac{N_{\\text{net}} \\cdot V_{\\text{atom}}}{V_{\\text{cell}}}$$`}
                </ReactMarkdown>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Ratio of net hard-sphere volume inside the unit cell boundary to total cell volume.
              </p>
            </div>

            <div className="bg-[#070A12] p-3.5 rounded-lg border border-slate-800/90">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block font-bold mb-1">02 // Hard-Sphere Volume</span>
              <div className="text-sm font-mono text-slate-100 font-bold py-0.5 overflow-x-auto min-h-[36px] flex items-center">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {`$$V_{\\text{atom}} = \\frac{4}{3}\\pi R^3$$`}
                </ReactMarkdown>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Spherical volume of a single constituent atom of metallic or covalent radius R.
              </p>
            </div>

            <div className="bg-[#070A12] p-3.5 rounded-lg border border-slate-800/90">
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider block font-bold mb-1">03 // Interstitial Porosity</span>
              <div className="text-sm font-mono text-slate-100 font-bold py-0.5 overflow-x-auto min-h-[36px] flex items-center">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {`$$\\Phi_{\\text{void}} = 1 - \\text{APF}$$`}
                </ReactMarkdown>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Unoccupied interstitial cavity fraction available for octahedral/tetrahedral solutes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Structure Selector Cards */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Atom className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Lattice Topology for Exact Closed-Form Proof</span>
          </span>
          <div className="inline-flex rounded-lg bg-[#070A12] p-1 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => { playSynthTone('tick'); setInteractiveTab('proof'); }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                interactiveTab === 'proof' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step-by-Step Proof
            </button>
            <button
              onClick={() => { playSynthTone('tick'); setInteractiveTab('calculator'); }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                interactiveTab === 'calculator' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Numerical Sandbox
            </button>
            <button
              onClick={() => { playSynthTone('tick'); setInteractiveTab('comparison'); }}
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                interactiveTab === 'comparison' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Master Comparison Table
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
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
                className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-[#0B1324] border-cyan-500/60 text-white shadow-lg'
                    : 'bg-[#0B0F19] border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-0.5 transition-opacity ${isSelected ? 'bg-cyan-400 opacity-100' : 'opacity-0'}`} />
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>{item.shortName}</span>
                  <span className={`text-[11px] font-mono tabular-nums font-bold ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                    {item.percentValue}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-300 mt-1 truncate">{item.name.split(' (')[0]}</div>
                <div className="text-[10px] font-mono text-cyan-400/90 mt-2 font-semibold overflow-x-auto whitespace-nowrap hide-scrollbar flex items-center min-h-[28px] prose prose-invert prose-p:my-0 prose-math:text-cyan-300">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`$$${item.exactFormulaLatex}$$`}
                  </ReactMarkdown>
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
          <div className="lg:col-span-7 space-y-4">
            
            {/* Active Header Card */}
            <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                    Exact Mathematical Derivation
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mt-0.5">{active.name}</h3>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono tabular-nums font-bold text-xs inline-block">
                    APF = {active.percentValue}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <span>Closed-Form:</span>
                    <span className="prose prose-invert prose-p:my-0 prose-math:text-amber-300">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {`$$${active.exactFormulaLatex}$$`}
                      </ReactMarkdown>
                    </span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {active.tagline}
              </p>

              {/* Quick Spec Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                <div className="bg-[#070A12] p-2.5 rounded-lg border border-slate-800/90">
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Touch Vector</span>
                  <span className="text-cyan-300 font-bold">{active.contactDirection}</span>
                </div>
                <div className="bg-[#070A12] p-2.5 rounded-lg border border-slate-800/90">
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">a(R) Relation</span>
                  <span className="text-amber-400 font-bold">{active.latticeParamFormula}</span>
                </div>
                <div className="bg-[#070A12] p-2.5 rounded-lg border border-slate-800/90">
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Coordination</span>
                  <span className="text-slate-100 font-bold">CN = {active.coordinationNumber}</span>
                </div>
                <div className="bg-[#070A12] p-2.5 rounded-lg border border-slate-800/90">
                  <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Void Porosity</span>
                  <span className="text-slate-300 font-bold tabular-nums">{active.voidFractionPercent}</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Derivation Cards */}
            <div className="space-y-3">
              {active.steps.map((step, idx) => (
                <div 
                  key={idx}
                  className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4 space-y-2.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-[#070A12] border border-cyan-500/40 text-cyan-400 font-mono text-[11px] font-bold">
                      0{idx + 1}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide">{step.title}</h4>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal pl-9">
                    {step.description}
                  </p>

                  {/* Math Formula Callout Box */}
                  <div className="ml-9 p-3.5 rounded-lg bg-[#070A12] border border-slate-800/90 font-mono text-[13px] text-cyan-300 font-bold overflow-x-auto prose prose-invert prose-p:my-0 prose-math:text-cyan-300">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {`$$${step.math}$$`}
                    </ReactMarkdown>
                  </div>

                  {step.notes && (
                    <div className="ml-9 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <Info className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{step.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final Algebraic Summary Card */}
            <div className="bg-[#0B0F19] border border-cyan-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Exact Closed-Form Identity</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#070A12] border border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Analytical Invariant:</span>
                  <div className="text-xl font-mono font-bold text-amber-400 overflow-x-auto min-w-[200px]">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {`$$${active.exactFormulaLatex}$$`}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="sm:text-right space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">8-Digit Metrology Value:</span>
                  <div className="text-lg font-mono tabular-nums font-bold text-cyan-300">
                    {active.decimalValue.toFixed(8)} ({active.percentValue})
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar: CAD Cross-Section & Real Materials */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* 3D Volumetric Cross-Section CAD Blueprint */}
            <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-semibold">
                    Crystallographic Section Blueprint
                  </span>
                  <span className="text-xs font-bold text-slate-100">
                    Hard-Sphere Contact &amp; Interstitial Void Plane
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#070A12] text-amber-400 border border-slate-800 font-bold">
                  {active.shortName}
                </span>
              </div>

              <div className="bg-[#05080F] rounded-lg p-2 border border-slate-800/90 flex flex-col items-center justify-center space-y-2">
                <svg viewBox="0 0 300 220" className="w-full h-auto select-none">
                  <defs>
                    <pattern id="apfCadSub" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#0f172a" strokeWidth="0.6" />
                    </pattern>
                    <pattern id="apfCadMaj" width="50" height="50" patternUnits="userSpaceOnUse">
                      <rect width="50" height="50" fill="url(#apfCadSub)" />
                      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1e293b" strokeWidth="0.9" />
                    </pattern>
                    <pattern id="apfVoidHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.28" />
                    </pattern>

                    {/* 3D Phong Shaded Spheres */}
                    <radialGradient id="apfSphereTi" cx="32%" cy="28%" r="68%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="22%" stopColor="#e2e8f0" />
                      <stop offset="58%" stopColor="#64748b" />
                      <stop offset="88%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#090d16" />
                    </radialGradient>
                    <radialGradient id="apfSphereCyan" cx="32%" cy="28%" r="68%">
                      <stop offset="0%" stopColor="#ecfeff" />
                      <stop offset="20%" stopColor="#67e8f9" />
                      <stop offset="55%" stopColor="#0891b2" />
                      <stop offset="88%" stopColor="#164e63" />
                      <stop offset="100%" stopColor="#04131d" />
                    </radialGradient>
                    <radialGradient id="apfSphereAmber" cx="32%" cy="28%" r="68%">
                      <stop offset="0%" stopColor="#fef3c7" />
                      <stop offset="22%" stopColor="#fbbf24" />
                      <stop offset="58%" stopColor="#d97706" />
                      <stop offset="88%" stopColor="#78350f" />
                      <stop offset="100%" stopColor="#1c0a00" />
                    </radialGradient>

                    <marker id="apfArrAmber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
                    </marker>
                    <marker id="apfArrCyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#38bdf8" />
                    </marker>

                    {/* Unit Cell Section ClipPaths */}
                    <clipPath id="clipSC">
                      <rect x="94" y="44" width="112" height="112" />
                    </clipPath>
                    <clipPath id="clipBCC">
                      <rect x="72" y="46" width="156" height="110" />
                    </clipPath>
                    <clipPath id="clipFCC">
                      <rect x="92" y="42" width="116" height="116" />
                    </clipPath>
                    <clipPath id="clipNaCl">
                      <rect x="92" y="42" width="116" height="116" />
                    </clipPath>
                  </defs>

                  {/* CAD Grid Backdrop */}
                  <rect width="300" height="220" fill="url(#apfCadMaj)" />

                  {/* 1. SIMPLE CUBIC (SC) — (100) CUBE FACE */}
                  {active.id === 'sc' && (
                    <g>
                      <text x="12" y="18" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.06em">
                        PLANE (100) SECTION • EDGE CONTACT [100]
                      </text>
                      {/* Central Interstitial Void Hatching */}
                      <rect x="94" y="44" width="112" height="112" fill="url(#apfVoidHatch)" />

                      {/* Full Outer Sphere Construction Silhouettes (dashed) */}
                      {[[94, 44], [206, 44], [94, 156], [206, 156]].map(([cx, cy], idx) => (
                        <circle key={`sil-${idx}`} cx={cx} cy={cy} r="56" fill="#0e1726" fillOpacity="0.35" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />
                      ))}

                      {/* Clipped 3D Volumetric Spheres inside the Unit Cell Square */}
                      <g clipPath="url(#clipSC)">
                        {[[94, 44], [206, 44], [94, 156], [206, 156]].map(([cx, cy], idx) => (
                          <circle key={`sph-${idx}`} cx={cx} cy={cy} r="56" fill="url(#apfSphereTi)" stroke="#94a3b8" strokeWidth="0.9" />
                        ))}
                      </g>

                      {/* Unit Cell Boundary Frame */}
                      <rect x="94" y="44" width="112" height="112" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="5 2.5" />

                      {/* Corner Lattice Sites */}
                      {[[94, 44], [206, 44], [94, 156], [206, 156]].map(([cx, cy], idx) => (
                        <circle key={`pt-${idx}`} cx={cx} cy={cy} r="2.5" fill="#f8fafc" />
                      ))}

                      {/* Touching Vector along [100] edge */}
                      <line x1="96" y1="156" x2="204" y2="156" stroke="#f59e0b" strokeWidth="2" markerStart="url(#apfArrAmber)" markerEnd="url(#apfArrAmber)" />
                      <circle cx="150" cy="156" r="3.5" fill="#f59e0b" stroke="#05080F" strokeWidth="1" />

                      {/* Central Cubic Void Label */}
                      <rect x="116" y="91" width="68" height="18" rx="3" fill="#05080F" fillOpacity="0.88" stroke="#f59e0b" strokeWidth="0.8" />
                      <text x="150" y="103" textAnchor="middle" fill="#fbbf24" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                        VOID r = 0.732R
                      </text>

                      {/* Bottom Metrology Readout */}
                      <text x="150" y="182" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Touch Along Edge [100]: a = R + R = 2R
                      </text>
                      <text x="150" y="198" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">
                        N_net = 8×(1/8) = 1.00 • APF = π/6 ≈ 52.36%
                      </text>
                    </g>
                  )}

                  {/* 2. BODY-CENTERED CUBIC (BCC) — (110) DIAGONAL PLANE */}
                  {active.id === 'bcc' && (
                    <g>
                      <text x="12" y="18" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.06em">
                        PLANE (110) DIAGONAL SECTION • [111] TOUCH
                      </text>
                      {/* (110) Rectangle width = a*sqrt(2) = 156, height = a = 110 */}
                      <rect x="72" y="46" width="156" height="110" fill="url(#apfVoidHatch)" />

                      {/* Outer Corner Silhouettes (R = 47.7 px so 4R = sqrt(156^2 + 110^2) = 190.8 px) */}
                      {[[72, 46], [228, 46], [72, 156], [228, 156]].map(([cx, cy], idx) => (
                        <circle key={`sil-${idx}`} cx={cx} cy={cy} r="47.7" fill="#0e1726" fillOpacity="0.35" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />
                      ))}

                      {/* Clipped 3D Spheres inside (110) Section Plane */}
                      <g clipPath="url(#clipBCC)">
                        {[[72, 46], [228, 46], [72, 156], [228, 156]].map(([cx, cy], idx) => (
                          <circle key={`cor-${idx}`} cx={cx} cy={cy} r="47.7" fill="url(#apfSphereTi)" stroke="#94a3b8" strokeWidth="0.9" />
                        ))}
                        {/* Central Body-Centered Sphere at (150, 101) */}
                        <circle cx="150" cy="101" r="47.7" fill="url(#apfSphereAmber)" stroke="#fbbf24" strokeWidth="1.1" />
                      </g>

                      {/* (110) Section Boundary Frame */}
                      <rect x="72" y="46" width="156" height="110" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="5 2.5" />

                      {/* Body Diagonal [111] Vector */}
                      <line x1="74" y1="154" x2="226" y2="48" stroke="#38bdf8" strokeWidth="2.2" markerStart="url(#apfArrCyan)" markerEnd="url(#apfArrCyan)" />

                      {/* Dimension Callouts */}
                      <text x="236" y="104" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">a</text>
                      <text x="150" y="40" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
                        Face Diagonal [110] = a√2
                      </text>
                      <text x="150" y="182" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Body Diagonal [111]: a√3 = R + 2R + R = 4R
                      </text>
                      <text x="150" y="198" textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontFamily="monospace">
                        N_net = 1 + 8×(1/8) = 2.00 • APF = π√3/8 ≈ 68.02%
                      </text>
                    </g>
                  )}

                  {/* 3. FACE-CENTERED CUBIC (FCC) — (100) CUBE FACE */}
                  {active.id === 'fcc' && (
                    <g>
                      <text x="12" y="18" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.06em">
                        PLANE (100) FACE SECTION • [110] DIAGONAL TOUCH
                      </text>
                      <rect x="92" y="42" width="116" height="116" fill="url(#apfVoidHatch)" />

                      {/* Outer Corner Silhouettes (R = 41.0 px so 4R = 116*sqrt(2) = 164.0 px) */}
                      {[[92, 42], [208, 42], [92, 158], [208, 158]].map(([cx, cy], idx) => (
                        <circle key={`sil-${idx}`} cx={cx} cy={cy} r="41" fill="#0e1726" fillOpacity="0.35" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />
                      ))}

                      {/* Clipped 3D Spheres inside (100) Face */}
                      <g clipPath="url(#clipFCC)">
                        {[[92, 42], [208, 42], [92, 158], [208, 158]].map(([cx, cy], idx) => (
                          <circle key={`cor-${idx}`} cx={cx} cy={cy} r="41" fill="url(#apfSphereTi)" stroke="#94a3b8" strokeWidth="0.9" />
                        ))}
                        {/* Central Face-Centered Sphere at (150, 100) */}
                        <circle cx="150" cy="100" r="41" fill="url(#apfSphereCyan)" stroke="#38bdf8" strokeWidth="1.1" />
                      </g>

                      {/* Unit Cell Boundary Frame */}
                      <rect x="92" y="42" width="116" height="116" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="5 2.5" />

                      {/* Face Diagonal [110] Vector */}
                      <line x1="94" y1="156" x2="206" y2="44" stroke="#f59e0b" strokeWidth="2.2" markerStart="url(#apfArrAmber)" markerEnd="url(#apfArrAmber)" />

                      <text x="216" y="103" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">a</text>
                      <text x="150" y="182" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Face Diagonal [110]: a√2 = R + 2R + R = 4R
                      </text>
                      <text x="150" y="198" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">
                        N_net = 6×(1/2) + 8×(1/8) = 4.00 • APF = π√2/6 ≈ 74.05%
                      </text>
                    </g>
                  )}

                  {/* 4. HEXAGONAL CLOSE-PACKED (HCP) — ABAB TETRAHEDRON */}
                  {active.id === 'hcp' && (
                    <g>
                      <text x="12" y="18" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.06em">
                        ABAB TETRAHEDRAL STACKING • c/a = √(8/3) = 1.633
                      </text>
                      {/* Basal Hexagonal Plane Shadow */}
                      <polygon points="75,144 225,144 150,92" fill="#0c192c" fillOpacity="0.7" stroke="#38bdf8" strokeWidth="1.4" />
                      {/* Back Basal Atom A3 */}
                      <circle cx="150" cy="92" r="24" fill="url(#apfSphereTi)" opacity="0.88" />
                      {/* Tetrahedral Struts to B-Layer Atom */}
                      <line x1="75" y1="144" x2="150" y2="50" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="3 2" />
                      <line x1="225" y1="144" x2="150" y2="50" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="3 2" />
                      <line x1="150" y1="92" x2="150" y2="50" stroke="#94a3b8" strokeWidth="1.3" strokeDasharray="3 2" />
                      {/* Vertical Altitude z = c/2 from Centroid (150, 126) */}
                      <line x1="150" y1="126" x2="150" y2="50" stroke="#f59e0b" strokeWidth="2.2" markerStart="url(#apfArrAmber)" markerEnd="url(#apfArrAmber)" />
                      <circle cx="150" cy="126" r="3" fill="#f59e0b" />
                      {/* Front Basal Atoms A1, A2 */}
                      <circle cx="75" cy="144" r="28" fill="url(#apfSphereCyan)" stroke="#38bdf8" strokeWidth="0.9" />
                      <circle cx="225" cy="144" r="28" fill="url(#apfSphereCyan)" stroke="#38bdf8" strokeWidth="0.9" />
                      {/* Upper B-Layer Midplane Atom at z = c/2 */}
                      <circle cx="150" cy="50" r="28" fill="url(#apfSphereAmber)" stroke="#fbbf24" strokeWidth="1.1" />

                      <rect x="158" y="76" width="110" height="18" rx="3" fill="#05080F" fillOpacity="0.9" stroke="#f59e0b" strokeWidth="0.8" />
                      <text x="213" y="88" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold">
                        c/2 = a√(2/3)
                      </text>
                      <text x="150" y="182" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Basal Touch a = 2R • V_cell = (3√3/2)a²c = 24√2 R³
                      </text>
                      <text x="150" y="198" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">
                        N_net = 6.00 Atoms/Hex Prism • APF = π/(3√2) ≈ 74.05%
                      </text>
                    </g>
                  )}

                  {/* 5. DIAMOND CUBIC — TETRAHEDRAL OCTANT SUBCELL */}
                  {active.id === 'diamond' && (
                    <g>
                      <text x="12" y="18" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.06em">
                        sp³ TETRAHEDRAL OCTANT (a/2)³ • ¼[111] BOND
                      </text>
                      {/* Isometric Octant Cube Wireframe */}
                      <polygon points="90,56 178,56 210,36 122,36" fill="#0b1322" fillOpacity="0.5" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />
                      <rect x="90" y="56" width="88" height="88" fill="#0b1322" fillOpacity="0.45" stroke="#475569" strokeWidth="1.3" />
                      <polygon points="178,56 210,36 210,124 178,144" fill="#090f1c" fillOpacity="0.6" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />

                      {/* 4 sp³ Covalent Bonds radiating from (1/4, 1/4, 1/4) site at (150, 90) */}
                      <line x1="150" y1="90" x2="90" y2="144" stroke="#f59e0b" strokeWidth="3.2" />
                      <line x1="150" y1="90" x2="178" y2="56" stroke="#38bdf8" strokeWidth="2.4" />
                      <line x1="150" y1="90" x2="122" y2="36" stroke="#94a3b8" strokeWidth="2" />
                      <line x1="150" y1="90" x2="210" y2="124" stroke="#94a3b8" strokeWidth="2" />

                      {/* 4 Coordinating Vertex Spheres */}
                      <circle cx="122" cy="36" r="13" fill="url(#apfSphereTi)" />
                      <circle cx="210" cy="124" r="14" fill="url(#apfSphereTi)" />
                      <circle cx="178" cy="56" r="16" fill="url(#apfSphereCyan)" />
                      <circle cx="90" cy="144" r="21" fill="url(#apfSphereTi)" stroke="#38bdf8" strokeWidth="1" />

                      {/* Central (1/4, 1/4, 1/4) Tetrahedral Basis Sphere */}
                      <circle cx="150" cy="90" r="21" fill="url(#apfSphereAmber)" stroke="#fbbf24" strokeWidth="1.2" />

                      <text x="150" y="182" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Quarter-Diagonal Bond: d = a√3/4 = 2R ⇒ a = 8R/√3
                      </text>
                      <text x="150" y="198" textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontFamily="monospace">
                        N_net = 4(FCC) + 4(Tetrahedral) = 8.00 • APF = π√3/16 ≈ 34.01%
                      </text>
                    </g>
                  )}

                  {/* 6. ROCK SALT (NaCl) — (100) IONIC FACE */}
                  {active.id === 'nacl' && (
                    <g>
                      <text x="12" y="18" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="0.06em">
                        ROCK SALT (100) FACE • CATION–ANION TOUCH a = 2(R₊+R₋)
                      </text>
                      <rect x="92" y="42" width="116" height="116" fill="url(#apfVoidHatch)" />

                      {/* Clipped 3D Spheres inside (100) Face */}
                      <g clipPath="url(#clipNaCl)">
                        {/* 4 Corner + 1 Face-Center Cl- Anions (R_- = 34) */}
                        {[[92, 42], [208, 42], [92, 158], [208, 158], [150, 100]].map(([cx, cy], idx) => (
                          <circle key={`cl-${idx}`} cx={cx} cy={cy} r="34" fill="url(#apfSphereCyan)" stroke="#38bdf8" strokeWidth="0.9" />
                        ))}
                        {/* 4 Edge-Center Na+ Cations (R_+ = 24, so R_+ + R_- = 58 = a/2) */}
                        {[[150, 42], [150, 158], [92, 100], [208, 100]].map(([cx, cy], idx) => (
                          <circle key={`na-${idx}`} cx={cx} cy={cy} r="24" fill="url(#apfSphereAmber)" stroke="#fbbf24" strokeWidth="1" />
                        ))}
                      </g>

                      <rect x="92" y="42" width="116" height="116" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="5 2.5" />
                      <line x1="94" y1="158" x2="206" y2="158" stroke="#f59e0b" strokeWidth="2.2" markerStart="url(#apfArrAmber)" markerEnd="url(#apfArrAmber)" />

                      <text x="150" y="182" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                        Edge Touch [100]: a = 2R₋ + 2R₊ • Critical r₊/r₋ = √2 − 1 ≈ 0.414
                      </text>
                      <text x="150" y="198" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontFamily="monospace">
                        4 Na⁺ + 4 Cl⁻ Ions / Cell • Max Octahedral Limit APF ≈ 79.31%
                      </text>
                    </g>
                  )}
                </svg>

                <div className="w-full flex items-center justify-between px-2 pt-1.5 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-500 uppercase text-[10px]">Hard-Sphere Constraint:</span>
                  <span className="text-amber-400 font-bold">{active.contactEquation}</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-normal space-y-1 pt-1">
                <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-500">Net Sphere Equivalents (Z):</span>
                  <span className="text-slate-100 font-bold tabular-nums">{active.netAtomsValue}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-500">Unit Cell Volume V_cell:</span>
                  <span className="text-cyan-300 font-bold">{active.cellVolumeExpanded}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-500">Occupied Sphere Volume V_atoms:</span>
                  <span className="text-amber-300 font-bold">{active.atomVolumeExpanded}</span>
                </div>
                <div className="flex justify-between py-1.5 text-[11px] font-mono">
                  <span className="text-slate-500">Interstitial Void Fraction:</span>
                  <span className="text-slate-200 font-bold tabular-nums">{active.voidFractionPercent}</span>
                </div>
              </div>
            </div>

            {/* Elemental & Custom Materials Realizations */}
            <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reference &amp; Custom Crystals ({active.shortName})</span>
                </span>
                <button
                  onClick={() => {
                    playSynthTone('tick');
                    setShowCustomForm(prev => !prev);
                  }}
                  className="px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold transition-all"
                >
                  {showCustomForm ? 'Cancel' : '+ Custom Material'}
                </button>
              </div>

              {showCustomForm && (
                <div className="p-3.5 rounded-lg bg-[#070A12] border border-cyan-500/40 space-y-2.5 text-xs font-mono">
                  <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
                    Synthesize Custom {active.shortName} Material
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Material Name</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-[#0B0F19] border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Formula / Symbol</label>
                      <input
                        type="text"
                        value={formSymbol}
                        onChange={(e) => setFormSymbol(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-[#0B0F19] border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase block mb-0.5">Molar Mass M (g/mol)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formMass}
                        onChange={(e) => setFormMass(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-[#0B0F19] border border-slate-800 text-amber-300 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase block mb-0.5">
                        {selectedKey === 'nacl' ? 'Anion Radius R₋ (Å)' : 'Atomic Radius R (Å)'}
                      </label>
                      <input
                        type="number"
                        step="0.005"
                        value={formRadius}
                        onChange={(e) => setFormRadius(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-[#0B0F19] border border-slate-800 text-cyan-300 text-xs focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddCustomMaterial}
                    className="w-full py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold text-[11px] transition-all"
                  >
                    Compute Theoretical Density &amp; Add to Catalog
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {allMaterialsForActive.map((mat, i) => {
                  // Infer radius from lattice parameter a for one-click loading into sandbox
                  const inferredR =
                    (mat as { rAtom?: number }).rAtom ??
                    (selectedKey === 'sc'
                      ? mat.aParam / 2
                      : selectedKey === 'bcc'
                      ? (mat.aParam * Math.sqrt(3)) / 4
                      : selectedKey === 'fcc'
                      ? mat.aParam / (2 * Math.SQRT2)
                      : selectedKey === 'hcp'
                      ? mat.aParam / 2
                      : selectedKey === 'diamond'
                      ? (mat.aParam * Math.sqrt(3)) / 8
                      : mat.aParam / (2 * (1 + customIonicRatio)));

                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        playSynthTone('tick');
                        setCustomRadius(Number(inferredR.toFixed(4)));
                        setCustomMolarMass(mat.atomicWeight);
                        setInteractiveTab('calculator');
                      }}
                      title="Click to load into Live Numerical Sandbox"
                      className="p-3 rounded-lg bg-[#070A12] border border-slate-800/90 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between transition-all group"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{mat.name}</span>
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            {mat.symbol}
                          </span>
                          {i >= active.realWorldMaterials.length && (
                            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/50 border border-amber-500/30 px-1 py-0.2 rounded">
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5 group-hover:text-slate-400">
                          a = {mat.aParam.toFixed(3)} Å • R ≈ {inferredR.toFixed(3)} Å • M = {mat.atomicWeight.toFixed(2)} g/mol
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono tabular-nums font-bold text-amber-400">
                          {mat.computedDensity.toFixed(2)}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">g/cm³</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] font-mono text-slate-500 text-center pt-0.5">
                Click any material card to load its R and M into the Live Numerical Sandbox
              </div>
            </div>

            {/* Density Connection Insight Box */}
            <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                Theoretical X-Ray Density Law (ρ_calc)
              </span>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Unit cell metrology directly predicts macroscopic bulk mass density from diffraction lattice parameters:
              </p>
              <div className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800 font-mono text-[11px] text-cyan-300 font-bold text-center">
                ρ = (Z_eff · M) / (V_cell · N_A)
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                N_A = 6.02214076 × 10²³ mol⁻¹ • 1 Å³ = 10⁻²⁴ cm³
              </p>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: LIVE NUMERICAL APF & PARAMETER SANDBOX */}
      {interactiveTab === 'calculator' && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                Parametric Crystallographic Metrology &amp; Custom Material Solver
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-1">
                Live APF, Theoretical Density, Interstitial Void &amp; Planar/Linear Packing ({active.name})
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Adjust atomic radius <code className="text-cyan-300 font-mono">R</code>, molar mass <code className="text-amber-300 font-mono">M</code>, or load any preset/custom crystal to compute real-time unit cell volume, theoretical X-ray density <code className="text-cyan-300 font-mono">ρ_calc</code>, octahedral/tetrahedral cavity radii, and directional packing densities.
              </p>
            </div>

            {/* Quick Material Preset Loader */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span className="text-slate-500 text-[10px] uppercase mr-1">Load Preset:</span>
              {allMaterialsForActive.map((mat, i) => {
                const rPreset =
                  (mat as { rAtom?: number }).rAtom ??
                  (selectedKey === 'sc'
                    ? mat.aParam / 2
                    : selectedKey === 'bcc'
                    ? (mat.aParam * Math.sqrt(3)) / 4
                    : selectedKey === 'fcc'
                    ? mat.aParam / (2 * Math.SQRT2)
                    : selectedKey === 'hcp'
                    ? mat.aParam / 2
                    : selectedKey === 'diamond'
                    ? (mat.aParam * Math.sqrt(3)) / 8
                    : mat.aParam / (2 * (1 + customIonicRatio)));
                return (
                  <button
                    key={i}
                    onClick={() => {
                      playSynthTone('tick');
                      setCustomRadius(Number(rPreset.toFixed(4)));
                      setCustomMolarMass(mat.atomicWeight);
                    }}
                    className="px-2.5 py-1 rounded bg-[#070A12] hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 font-bold transition-all"
                  >
                    {mat.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Radius & Molar Mass Sliders */}
            <div className="lg:col-span-7 bg-[#070A12] rounded-xl p-5 border border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedKey === 'nacl' ? 'Anion Radius (R₋)' : 'Atomic Radius (R)'}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#0B0F19] text-cyan-300 font-bold tabular-nums border border-cyan-500/30">
                      {customRadius.toFixed(3)} Å
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.005"
                    value={customRadius}
                    onChange={(e) => setCustomRadius(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-cyan-400 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>0.50 Å (C)</span>
                    <span>1.28 Å (Cu/Fe)</span>
                    <span>2.50 Å (Cs)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-bold">Molar Mass (M)</span>
                    <span className="px-2 py-0.5 rounded bg-[#0B0F19] text-amber-400 font-bold tabular-nums border border-amber-500/30">
                      {customMolarMass.toFixed(2)} g/mol
                    </span>
                  </div>
                  <input
                    type="range"
                    min="9"
                    max="240"
                    step="0.1"
                    value={customMolarMass}
                    onChange={(e) => setCustomMolarMass(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-amber-400 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>9.0 (Be)</span>
                    <span>63.5 (Cu)</span>
                    <span>239.3 (PbS)</span>
                  </div>
                </div>
              </div>

              {/* Structure-Specific Anisotropy / Radius-Ratio Controls */}
              {selectedKey === 'hcp' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-mono">
                    <span className="text-cyan-300 font-bold">
                      HCP Axial Ratio (c/a) — Ideal √(8/3) ≈ 1.6330
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#0B0F19] text-amber-400 font-bold tabular-nums border border-amber-500/30">
                      c/a = {customHcpCA.toFixed(4)} ({calcDetails.contactRegimeNote})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.45"
                    max="1.95"
                    step="0.001"
                    value={customHcpCA}
                    onChange={(e) => setCustomHcpCA(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-cyan-400 rounded-lg cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    {[
                      { label: 'Be (1.568)', val: 1.568, r: 1.12, m: 9.012 },
                      { label: 'α-Ti (1.587)', val: 1.587, r: 1.47, m: 47.867 },
                      { label: 'Mg (1.624)', val: 1.624, r: 1.60, m: 24.305 },
                      { label: 'Ideal (1.633)', val: Math.sqrt(8 / 3), r: 1.37, m: 58.933 },
                      { label: 'Zn (1.856)', val: 1.856, r: 1.33, m: 65.38 },
                      { label: 'Cd (1.886)', val: 1.886, r: 1.49, m: 112.41 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          playSynthTone('tick');
                          setCustomHcpCA(p.val);
                          setCustomRadius(p.r);
                          setCustomMolarMass(p.m);
                        }}
                        className="px-2 py-0.5 rounded bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedKey === 'nacl' && (
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-mono">
                    <span className="text-cyan-300 font-bold">
                      Pauling Cation/Anion Ratio (γ = R₊/R₋) — Octahedral Limit √2−1 ≈ 0.4142
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#0B0F19] text-amber-400 font-bold tabular-nums border border-amber-500/30">
                      γ = {customIonicRatio.toFixed(3)} (R₊ = {(customRadius * customIonicRatio).toFixed(3)} Å)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.28"
                    max="1.00"
                    step="0.002"
                    value={customIonicRatio}
                    onChange={(e) => setCustomIonicRatio(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 accent-amber-400 rounded-lg cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                    {[
                      { label: 'LiI (0.345 · Anion Touch)', val: 0.345, r: 2.20, m: 133.85 },
                      { label: 'Critical Limit (0.4142 · 79.31%)', val: Math.SQRT2 - 1, r: 1.81, m: 58.44 },
                      { label: 'MgO (0.514)', val: 0.514, r: 1.40, m: 40.304 },
                      { label: 'NaCl (0.564 · 66.51%)', val: 0.564, r: 1.81, m: 58.44 },
                      { label: 'KCl (0.762)', val: 0.762, r: 1.81, m: 74.55 }
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          playSynthTone('tick');
                          setCustomIonicRatio(p.val);
                          setCustomRadius(p.r);
                          setCustomMolarMass(p.m);
                        }}
                        className="px-2 py-0.5 rounded bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theoretical X-Ray Density & Contact Regime Readout */}
            <div className="lg:col-span-5 bg-[#070A12] rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                  Theoretical X-Ray Mass Density (ρ_calc)
                </span>
                <div className="flex items-baseline justify-between gap-2 pt-1">
                  <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                    {calcDetails.theoreticalDensity.toFixed(3)} <span className="text-xs text-slate-400">g/cm³</span>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <span className="text-xs text-slate-400">APF: </span>
                    <span className="text-base font-bold text-cyan-300">{(calcDetails.computedAPF * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 text-[11px] font-mono tabular-nums">
                <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block">Octahedral Void r_oct</span>
                  <span className="text-cyan-300 font-bold">{calcDetails.rOct.toFixed(3)} Å</span>
                  <span className="text-[9px] text-slate-500 block">r/R = {(calcDetails.rOct / calcDetails.R).toFixed(3)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block">Tetrahedral Void r_tet</span>
                  <span className="text-amber-300 font-bold">{calcDetails.rTet.toFixed(3)} Å</span>
                  <span className="text-[9px] text-slate-500 block">r/R = {(calcDetails.rTet / calcDetails.R).toFixed(3)}</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
                <span>Active Contact Law:</span>
                <span className="text-slate-200 font-bold">{calcDetails.contactRegimeNote}</span>
              </div>
            </div>
          </div>

          {/* Live Calculated Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#070A12] p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Lattice Parameter (a)</span>
              <div className="text-lg font-mono tabular-nums font-bold text-amber-400">
                a = {calcDetails.a.toFixed(4)} Å
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                {selectedKey === 'hcp' ? `c = ${calcDetails.c.toFixed(4)} Å` : `Touch law: ${active.latticeParamFormula}`}
              </span>
            </div>

            <div className="bg-[#070A12] p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Unit Cell Volume (V_cell)</span>
              <div className="text-lg font-mono tabular-nums font-bold text-slate-100">
                {calcDetails.vCell.toFixed(3)} Å³
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500 block">
                {(calcDetails.vCell * 1e-24).toExponential(3)} cm³
              </span>
            </div>

            <div className="bg-[#070A12] p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Occupied Sphere Vol (V_atoms)</span>
              <div className="text-lg font-mono tabular-nums font-bold text-cyan-300">
                {calcDetails.vAtomsTotal.toFixed(3)} Å³
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500 block">
                {selectedKey === 'nacl'
                  ? `4 Na⁺ + 4 Cl⁻ Ions`
                  : `${active.netAtomsValue} × ${(calcDetails.vSphere).toFixed(3)} Å³`}
              </span>
            </div>

            <div className="bg-[#070A12] p-4 rounded-xl border border-cyan-500/40 space-y-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase block font-bold">Computed APF</span>
              <div className="text-lg font-mono tabular-nums font-bold text-cyan-300">
                {(calcDetails.computedAPF * 100).toFixed(2)}%
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
                <span>Close-Packed Plane PPF:</span>
                <span className="text-amber-300 font-bold tabular-nums">{calcDetails.ppfClosePacked.toFixed(1)}%</span>
              </span>
            </div>
          </div>

          {/* Directional Linear & Planar Atomic Density Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono tabular-nums">
            <div className="bg-[#070A12] p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold block">
                Linear Atomic Density LD_[uvw] (atoms / nm)
              </span>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">{selectedKey === 'hcp' ? '[112̄0] Basal' : '[100] Edge'}</span>
                  <span className="text-slate-100 font-bold">{calcDetails.ld100.toFixed(2)} nm⁻¹</span>
                </div>
                <div className="p-2 rounded bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">{selectedKey === 'hcp' ? '[101̄0] Prism' : '[110] Face Diag'}</span>
                  <span className="text-cyan-300 font-bold">{calcDetails.ld110.toFixed(2)} nm⁻¹</span>
                </div>
                <div className="p-2 rounded bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">{selectedKey === 'hcp' ? '[0001] c-Axis' : '[111] Body Diag'}</span>
                  <span className="text-amber-300 font-bold">{calcDetails.ld111.toFixed(2)} nm⁻¹</span>
                </div>
              </div>
            </div>

            <div className="bg-[#070A12] p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-amber-400 uppercase tracking-widest font-bold block">
                Planar Atomic Density PD_(hkl) (atoms / nm²)
              </span>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2 rounded bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">{selectedKey === 'hcp' ? '(0001) Basal' : '(100) Cube Face'}</span>
                  <span className="text-slate-100 font-bold">{calcDetails.pd100.toFixed(2)} nm⁻²</span>
                </div>
                <div className="p-2 rounded bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">{selectedKey === 'hcp' ? '(101̄0) Prism' : '(110) Diagonal'}</span>
                  <span className="text-cyan-300 font-bold">{calcDetails.pd110.toFixed(2)} nm⁻²</span>
                </div>
                <div className="p-2 rounded bg-[#0B0F19] border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">{selectedKey === 'hcp' ? 'PPF (0001)' : '(111) Octahedral'}</span>
                  <span className="text-amber-300 font-bold">
                    {selectedKey === 'hcp' ? `${calcDetails.ppfClosePacked.toFixed(1)}%` : `${calcDetails.pd111.toFixed(2)} nm⁻²`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Percentage Bar */}
          <div className="bg-[#070A12] rounded-xl p-4 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono tabular-nums">
              <span className="text-cyan-300 font-bold">
                Occupied Hard-Sphere Volume: {(calcDetails.computedAPF * 100).toFixed(2)}%
              </span>
              <span className="text-amber-400 font-bold">
                Interstitial Void Volume: {(calcDetails.voidFrac * 100).toFixed(2)}%
              </span>
            </div>

            <div className="h-6 w-full bg-[#0B0F19] rounded-lg overflow-hidden flex border border-slate-800">
              <div 
                className="h-full bg-cyan-600/80 flex items-center justify-center text-[10px] font-mono tabular-nums font-bold text-white transition-all duration-300"
                style={{ width: `${Math.min(100, calcDetails.computedAPF * 100)}%` }}
              >
                Solid ({(calcDetails.computedAPF * 100).toFixed(1)}%)
              </div>
              <div 
                className="h-full bg-slate-900 flex items-center justify-center text-[10px] font-mono tabular-nums font-bold text-amber-300 transition-all duration-300"
                style={{ width: `${Math.max(0, calcDetails.voidFrac * 100)}%` }}
              >
                Void ({(calcDetails.voidFrac * 100).toFixed(1)}%)
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: MASTER COMPARISON MATRIX ACROSS ALL STRUCTURES */}
      {interactiveTab === 'comparison' && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
              Master Crystallographic Reference Matrix
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              Comparative Packing Efficiency Across Canonical Lattice Topologies
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Click any row to load its full 3D section blueprint and closed-form derivation.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#070A12] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Structure</th>
                  <th className="p-3.5">Coordination (CN)</th>
                  <th className="p-3.5">Touch Vector</th>
                  <th className="p-3.5">a(R) Relation</th>
                  <th className="p-3.5">Net Atoms (Z)</th>
                  <th className="p-3.5">Exact Analytical APF</th>
                  <th className="p-3.5">Packing (%)</th>
                  <th className="p-3.5">Void (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 bg-[#0B0F19]">
                {(Object.keys(APF_DERIVATIONS) as APFStructureKey[]).map((key) => {
                  const s = APF_DERIVATIONS[key];
                  const isCurrent = s.id === selectedKey;
                  return (
                    <tr 
                      key={key} 
                      onClick={() => { setSelectedKey(key); setInteractiveTab('proof'); }}
                      className={`hover:bg-slate-900/90 cursor-pointer transition-colors ${isCurrent ? 'bg-cyan-950/25 font-bold' : ''}`}
                    >
                      <td className="p-3.5 text-slate-100">
                        <div className="font-bold flex items-center gap-2">
                          <span className={`w-1.5 h-4 rounded-sm ${isCurrent ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-200 font-bold tabular-nums">{s.coordinationNumber}</td>
                      <td className="p-3.5 text-cyan-300">{s.contactDirection}</td>
                      <td className="p-3.5 text-amber-300">{s.latticeParamFormula}</td>
                      <td className="p-3.5 text-slate-200 tabular-nums">{s.netAtomsValue}</td>
                      <td className="p-3.5 text-cyan-300 font-bold overflow-x-auto min-w-[80px]">
                        <div className="prose prose-invert prose-p:my-0 prose-math:text-cyan-300 flex items-center min-h-[30px]">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`$$${s.exactFormulaLatex}$$`}
                          </ReactMarkdown>
                        </div>
                      </td>
                      <td className="p-3.5 text-amber-400 font-bold tabular-nums">{s.percentValue}</td>
                      <td className="p-3.5 text-slate-400 tabular-nums">{s.voidFractionPercent}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Kepler Conjecture Theorem Callout */}
          <div className="bg-[#070A12] rounded-xl p-5 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Kepler–Hales Sphere Packing Theorem (E³ Upper Bound)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In three-dimensional Euclidean space, no arrangement of congruent hard spheres exceeds the packing density of the face-centered cubic (FCC) and hexagonal close-packed (HCP) lattices:
            </p>
            <div className="p-3 rounded-lg bg-[#0B0F19] border border-slate-800 font-mono text-[13px] text-amber-300 font-bold text-center flex items-center justify-center min-h-[48px] overflow-x-auto">
              <span className="prose prose-invert prose-p:my-0 prose-math:text-amber-300">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {`$$\\text{APF}_{\\max} = \\frac{\\pi}{3\\sqrt{2}} = \\frac{\\pi\\sqrt{2}}{6} \\approx 0.74048049 \\quad (74.05\\%)$$`}
                </ReactMarkdown>
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
