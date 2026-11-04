import React, { useMemo, useState } from 'react';
import {
  Box,
  Layers,
  Sparkles,
  Thermometer,
  Compass,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Activity,
  Orbit,
  Filter
} from 'lucide-react';
import { CrystalElement, CrystalStructureType } from './types';
import { MicroLatticeGlyph } from './PeriodicGraphics';

export interface ElementAllotrope {
  id: string;
  phaseName: string; // e.g. "α-Fe (Ferrite)"
  crystalStructure: CrystalStructureType;
  spaceGroup: string;
  pearsonSymbol: string;
  strukturbericht: string;
  a: number;
  b?: number;
  c?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  tempRange: string;
  tempMinC: number;
  tempMaxC: number;
  pressureNote?: string;
  density: number;
  coordNumber: number;
  apfPercent: number;
  physicalNote: string;
}

export interface CrystalFamilyMetadata {
  id: CrystalStructureType;
  name: string;
  shortLabel: string;
  crystalSystem: string;
  bravaisSymbol: string;
  pearsonDefault: string;
  strukturbericht: string;
  spaceGroupPrototype: string;
  prototypeElement: string;
  atomsPerCellZ: number;
  coordNumber: number;
  apfPercent: number;
  stackingSequence: string;
  octahedralVoidRatio: string;
  tetrahedralVoidRatio: string;
  metricConstraints: string;
  dSpacingFormulaLatex: string;
  selectionRule: string;
  accentHex: string;
  badgeClasses: string;
  description: string;
}

export const CRYSTAL_FAMILIES_METADATA: Record<CrystalStructureType, CrystalFamilyMetadata> = {
  FCC: {
    id: 'FCC',
    name: 'Face-Centered Cubic (Cubic Close-Packed)',
    shortLabel: 'FCC (cF4)',
    crystalSystem: 'Cubic (Isometric)',
    bravaisSymbol: 'cF',
    pearsonDefault: 'cF4',
    strukturbericht: 'A1',
    spaceGroupPrototype: 'Fm-3m (No. 225)',
    prototypeElement: 'Cu',
    atomsPerCellZ: 4,
    coordNumber: 12,
    apfPercent: 74.05,
    stackingSequence: 'ABCABC… along ⟨111⟩',
    octahedralVoidRatio: 'r_oct = 0.414 R (4 sites/cell)',
    tetrahedralVoidRatio: 'r_tet = 0.225 R (8 sites/cell)',
    metricConstraints: 'a = b = c, α = β = γ = 90°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{h^2 + k^2 + l^2}{a^2}',
    selectionRule: 'h, k, l all even or all odd (unmixed parity)',
    accentHex: '#10b981',
    badgeClasses: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    description: 'Kepler-optimal sphere packing with 4 isotropic {111} slip planes (12 slip systems), imparting exceptional ductility to noble and coinage metals (Cu, Ag, Au, Pt, Al, Ni, Pb).'
  },
  BCC: {
    id: 'BCC',
    name: 'Body-Centered Cubic',
    shortLabel: 'BCC (cI2)',
    crystalSystem: 'Cubic (Isometric)',
    bravaisSymbol: 'cI',
    pearsonDefault: 'cI2',
    strukturbericht: 'A2',
    spaceGroupPrototype: 'Im-3m (No. 229)',
    prototypeElement: 'W',
    atomsPerCellZ: 2,
    coordNumber: 8,
    apfPercent: 68.02,
    stackingSequence: 'ABAB… along ⟨110⟩ (open ⟨111⟩ close-packed chains)',
    octahedralVoidRatio: 'r_oct = 0.155 R (distorted along ⟨100⟩)',
    tetrahedralVoidRatio: 'r_tet = 0.291 R (12 sites/cell on faces)',
    metricConstraints: 'a = b = c, α = β = γ = 90°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{h^2 + k^2 + l^2}{a^2}',
    selectionRule: 'h + k + l = 2n (even sum required)',
    accentHex: '#38bdf8',
    badgeClasses: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    description: 'High vibrational entropy and directional d-orbital bonding stabilize BCC in alkali metals (Li, Na, K, Rb, Cs) and ultra-high-melting refractory transition metals (Cr, Mo, W, V, Nb, Ta, α-Fe).'
  },
  HCP: {
    id: 'HCP',
    name: 'Hexagonal Close-Packed',
    shortLabel: 'HCP (hP2)',
    crystalSystem: 'Hexagonal',
    bravaisSymbol: 'hP',
    pearsonDefault: 'hP2',
    strukturbericht: 'A3',
    spaceGroupPrototype: 'P6_3/mmc (No. 194)',
    prototypeElement: 'Mg',
    atomsPerCellZ: 2, // 2 in primitive hP2 cell, 6 in full hexagonal prism
    coordNumber: 12,
    apfPercent: 74.05,
    stackingSequence: 'ABABAB… along [0001] (ideal c/a = √(8/3) ≈ 1.633)',
    octahedralVoidRatio: 'r_oct = 0.414 R',
    tetrahedralVoidRatio: 'r_tet = 0.225 R',
    metricConstraints: 'a = b ≠ c, α = β = 90°, γ = 120°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{4}{3}\\left(\\frac{h^2 + hk + k^2}{a^2}\\right) + \\frac{l^2}{c^2}',
    selectionRule: 'Forbidden if h + 2k = 3n and l is odd',
    accentHex: '#f59e0b',
    badgeClasses: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    description: 'The most populous elemental crystal structure across early/late transition metals and lanthanoids (Mg, Ti, Zr, Hf, Co, Zn, Cd, Ru, Os, Re, Sc, Y). Basal (0001) slip dominates when c/a > 1.633.'
  },
  Diamond: {
    id: 'Diamond',
    name: 'Diamond Cubic (Tetrahedral Covalent)',
    shortLabel: 'Diamond (cF8)',
    crystalSystem: 'Cubic (Isometric)',
    bravaisSymbol: 'cF',
    pearsonDefault: 'cF8',
    strukturbericht: 'A4',
    spaceGroupPrototype: 'Fd-3m (No. 227)',
    prototypeElement: 'C / Si',
    atomsPerCellZ: 8,
    coordNumber: 4,
    apfPercent: 34.01,
    stackingSequence: 'AABBCC… interpenetrating FCC sublattices shifted by (¼,¼,¼)',
    octahedralVoidRatio: 'r_void = 1.00 R (4 large open cages at ½,½,½)',
    tetrahedralVoidRatio: 'Half of 8 tetrahedral sites occupied by basis',
    metricConstraints: 'a = b = c, α = β = γ = 90°, θ_bond = 109.47°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{h^2 + k^2 + l^2}{a^2}',
    selectionRule: 'FCC rule + if h, k, l all even, h + k + l = 4n',
    accentHex: '#22d3ee',
    badgeClasses: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    description: 'Directional sp³ hybridized tetrahedral network (bond angle arccos(-1/3) = 109.47°) forming the backbone of Group 14 semiconductors (C-Diamond, Si, Ge, α-Sn).'
  },
  Rhombohedral: {
    id: 'Rhombohedral',
    name: 'Rhombohedral (Trigonal)',
    shortLabel: 'Rhombohedral (hR)',
    crystalSystem: 'Trigonal / Rhombohedral',
    bravaisSymbol: 'hR',
    pearsonDefault: 'hR2 / hR12',
    strukturbericht: 'A7 / A10',
    spaceGroupPrototype: 'R-3m (No. 166)',
    prototypeElement: 'Bi / As / Hg',
    atomsPerCellZ: 2,
    coordNumber: 6,
    apfPercent: 45.2,
    stackingSequence: 'Peierls-distorted ABC puckered bilayers (3+3 coordination)',
    octahedralVoidRatio: 'Distorted trigonal antiprismatic interstices',
    tetrahedralVoidRatio: 'Anisotropic interlayer van der Waals gap',
    metricConstraints: 'a = b = c, α = β = γ ≠ 90° (or hexagonal setting a = b ≠ c, γ = 120°)',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{(h^2+k^2+l^2)\\sin^2\\alpha + 2(hk+kl+hl)(\\cos^2\\alpha - \\cos\\alpha)}{a^2(1 - 3\\cos^2\\alpha + 2\\cos^3\\alpha)}',
    selectionRule: '-h + k + l = 3n (obverse hexagonal setting)',
    accentHex: '#a855f7',
    badgeClasses: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
    description: 'Adopted by pnictogens (As, Sb, Bi with A7 Peierls distortion), icosahedral Boron (B₁₂ clusters), Sm, and frozen Mercury (α-Hg).'
  },
  Orthorhombic: {
    id: 'Orthorhombic',
    name: 'Orthorhombic',
    shortLabel: 'Orthorhombic (oP/oC/oF)',
    crystalSystem: 'Orthorhombic',
    bravaisSymbol: 'oP / oC / oF / oI',
    pearsonDefault: 'oC8 / oF128',
    strukturbericht: 'A11 / A16 / A20',
    spaceGroupPrototype: 'Cmce (No. 64)',
    prototypeElement: 'Ga / α-U / S₈',
    atomsPerCellZ: 8,
    coordNumber: 7,
    apfPercent: 39.1,
    stackingSequence: 'Biaxial orthogonal layers with molecular dimers or rings',
    octahedralVoidRatio: 'Anisotropic along a ≠ b ≠ c axes',
    tetrahedralVoidRatio: 'Covalent dimer/ring inter-cluster channels',
    metricConstraints: 'a ≠ b ≠ c, α = β = γ = 90°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{h^2}{a^2} + \\frac{k^2}{b^2} + \\frac{l^2}{c^2}',
    selectionRule: 'Depends on centering: C-centered requires h + k = 2n',
    accentHex: '#ec4899',
    badgeClasses: 'bg-pink-500/15 text-pink-300 border-pink-500/35',
    description: 'Exhibits three mutually perpendicular unequal axes (a ≠ b ≠ c). Found in Gallium (Ga₂ covalent dimers, melting at 29.8 °C), α-Uranium (5f band Peierls distortion), Black Phosphorus, S₈, and diatomic halogens (Cl₂, Br₂, I₂).'
  },
  Tetragonal: {
    id: 'Tetragonal',
    name: 'Tetragonal (BCT / Primitive)',
    shortLabel: 'Tetragonal (tI/tP)',
    crystalSystem: 'Tetragonal',
    bravaisSymbol: 'tI / tP',
    pearsonDefault: 'tI2 / tI4',
    strukturbericht: 'A5 (β-Sn) / A6 (In)',
    spaceGroupPrototype: 'I4/mmm (No. 139) / I4_1/amd (No. 141)',
    prototypeElement: 'In / β-Sn / Pa',
    atomsPerCellZ: 4,
    coordNumber: 6,
    apfPercent: 53.5,
    stackingSequence: 'Jahn-Teller or s-p distorted cubic cell along [001]',
    octahedralVoidRatio: 'Tetragonally elongated/compressed along c-axis',
    tetrahedralVoidRatio: 'Flattened tetrahedra in β-Sn (A5)',
    metricConstraints: 'a = b ≠ c, α = β = γ = 90°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{h^2 + k^2}{a^2} + \\frac{l^2}{c^2}',
    selectionRule: 'Body-centered (tI): h + k + l = 2n',
    accentHex: '#f43f5e',
    badgeClasses: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    description: 'Arises from tetragonal distortion of FCC (Indium, A6, c/a = 1.52) or flattened Diamond cubic networks (White Tin β-Sn, A5, and Protactinium Pa).'
  },
  Hexagonal: {
    id: 'Hexagonal',
    name: 'Hexagonal (Layered / Helical Chains)',
    shortLabel: 'Hexagonal (hP)',
    crystalSystem: 'Hexagonal / Trigonal',
    bravaisSymbol: 'hP',
    pearsonDefault: 'hP4 / hP3',
    strukturbericht: 'A8 (Se/Te) / A9 (Graphite)',
    spaceGroupPrototype: 'P6_3/mmc (No. 194) / P3_121 (No. 152)',
    prototypeElement: 'C (Graphite) / Se / Te',
    atomsPerCellZ: 4,
    coordNumber: 3,
    apfPercent: 28.8,
    stackingSequence: 'sp² honeycomb sheets (AB) or 3₁ helical chains (Se/Te)',
    octahedralVoidRatio: 'Van der Waals interlayer gallery (c/2 = 3.354 Å in Graphite)',
    tetrahedralVoidRatio: 'In-plane covalent sigma network',
    metricConstraints: 'a = b ≠ c, α = β = 90°, γ = 120°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{4}{3}\\left(\\frac{h^2 + hk + k^2}{a^2}\\right) + \\frac{l^2}{c^2}',
    selectionRule: '00l requires l = 2n for P6_3 screw axis',
    accentHex: '#eab308',
    badgeClasses: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/35',
    description: 'Includes sp² layered Graphite (hP4, extreme in-plane conductivity vs c-axis van der Waals cleavage), helical chiral chains of Selenium and Tellurium (A8), and double-HCP (dHCP, ABAC stacking) light lanthanoids/actinoids.'
  },
  Monoclinic: {
    id: 'Monoclinic',
    name: 'Monoclinic',
    shortLabel: 'Monoclinic (mP/mC)',
    crystalSystem: 'Monoclinic',
    bravaisSymbol: 'mP / mC',
    pearsonDefault: 'mP16',
    strukturbericht: 'α-Pu / β-O₂',
    spaceGroupPrototype: 'P2_1/m (No. 11)',
    prototypeElement: 'α-Pu',
    atomsPerCellZ: 16,
    coordNumber: 14,
    apfPercent: 58.2,
    stackingSequence: 'Low-symmetry oblique layers with β ≠ 90° shear',
    octahedralVoidRatio: '8 distinct crystallographic Wyckoff sites in α-Pu',
    tetrahedralVoidRatio: 'Strong 5f electron localization & bond length bimodal split',
    metricConstraints: 'a ≠ b ≠ c, α = γ = 90°, β ≠ 90°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{1}{\\sin^2\\beta}\\left(\\frac{h^2}{a^2} + \\frac{l^2}{c^2} - \\frac{2hl\\cos\\beta}{ac}\\right) + \\frac{k^2}{b^2}',
    selectionRule: '0k0 requires k = 2n for 2_1 screw axis',
    accentHex: '#6366f1',
    badgeClasses: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
    description: 'Low-symmetry oblique lattice adopted by α-Plutonium (mP16, P2₁/m, driven by narrow 5f band Jahn-Teller-like instability), β-Se, and low-temperature solid Oxygen.'
  },
  Cubic: {
    id: 'Cubic',
    name: 'Simple & Complex Cubic (cP1 / cI58)',
    shortLabel: 'Simple/Complex Cubic',
    crystalSystem: 'Cubic (Isometric)',
    bravaisSymbol: 'cP / cI',
    pearsonDefault: 'cP1 (Po) / cI58 (α-Mn)',
    strukturbericht: 'A_h (α-Po) / A12 (α-Mn)',
    spaceGroupPrototype: 'Pm-3m (No. 221) / I-43m (No. 217)',
    prototypeElement: 'α-Po / α-Mn',
    atomsPerCellZ: 1,
    coordNumber: 6,
    apfPercent: 52.36,
    stackingSequence: 'AAA… direct orthogonal cube corners (α-Po)',
    octahedralVoidRatio: 'Cubic body-center void r_cubic = 0.732 R',
    tetrahedralVoidRatio: 'Direct 90° p-orbital overlap along ⟨100⟩',
    metricConstraints: 'a = b = c, α = β = γ = 90°',
    dSpacingFormulaLatex: '\\frac{1}{d_{hkl}^2} = \\frac{h^2 + k^2 + l^2}{a^2}',
    selectionRule: 'Primitive (Pm-3m): All (hkl) reflections allowed',
    accentHex: '#94a3b8',
    badgeClasses: 'bg-slate-500/15 text-slate-300 border-slate-500/35',
    description: 'Polonium (α-Po, Pm-3m) is the sole element crystallizing in the primitive Simple Cubic (A_h) lattice at STP due to relativistic 6s² inert-pair stabilization of orthogonal 6p bonds, while α-Mn forms a giant 58-atom cI58 supercell.'
  },
  Amorphous: {
    id: 'Amorphous',
    name: 'Disordered / Synthetic Superheavy',
    shortLabel: 'Disordered / Short-Lived',
    crystalSystem: 'Non-crystalline / Predicted',
    bravaisSymbol: '—',
    pearsonDefault: '—',
    strukturbericht: '—',
    spaceGroupPrototype: 'Short-Range Order',
    prototypeElement: 'Og',
    atomsPerCellZ: 1,
    coordNumber: 12,
    apfPercent: 64.0,
    stackingSequence: 'Random close packing (RCP) or transient single-atom states',
    octahedralVoidRatio: 'Continuous Voronoï polyhedral distribution',
    tetrahedralVoidRatio: 'Broad diffuse halo in S(Q)',
    metricConstraints: 'Isotropic radial distribution function g(r)',
    dSpacingFormulaLatex: 'Q_{\\text{max}} \\approx \\frac{2\\pi}{d_{\\text{avg}}}',
    selectionRule: 'Broad Ehrenfest diffuse scattering peak',
    accentHex: '#64748b',
    badgeClasses: 'bg-slate-700/30 text-slate-400 border-slate-600/40',
    description: 'Non-periodic atomic arrangement lacking long-range translational symmetry.'
  }
};

/**
 * Documented Allotropic Phase Transitions across Key Polymorphic Elements
 */
export const ELEMENT_ALLOTROPES: Record<number, ElementAllotrope[]> = {
  // Carbon (Z = 6)
  6: [
    {
      id: 'C-graphite',
      phaseName: 'α-Graphite (2H)',
      crystalStructure: 'Hexagonal',
      spaceGroup: 'P6_3/mmc (No. 194)',
      pearsonSymbol: 'hP4',
      strukturbericht: 'A9',
      a: 2.461,
      c: 6.708,
      gamma: 120,
      tempRange: 'STP Stable (< 3600 °C, 1 atm)',
      tempMinC: -273,
      tempMaxC: 3600,
      pressureNote: 'Thermodynamically stable at ambient pressure',
      density: 2.267,
      coordNumber: 3,
      apfPercent: 28.8,
      physicalNote: 'sp² planar honeycomb sheets with delocalized π-electrons and 3.354 Å van der Waals interlayer spacing.'
    },
    {
      id: 'C-diamond',
      phaseName: 'Cubic Diamond',
      crystalStructure: 'Diamond',
      spaceGroup: 'Fd-3m (No. 227)',
      pearsonSymbol: 'cF8',
      strukturbericht: 'A4',
      a: 3.567,
      tempRange: 'High-P (> 5 GPa) / Metastable at STP',
      tempMinC: -273,
      tempMaxC: 1500,
      pressureNote: 'Berman-Simon equilibrium boundary > 1.7–5 GPa',
      density: 3.515,
      coordNumber: 4,
      apfPercent: 34.01,
      physicalNote: '3D covalent sp³ network (bond length 1.545 Å), highest bulk modulus (443 GPa) and thermal conductivity (>2000 W/m·K).'
    },
    {
      id: 'C-lonsdaleite',
      phaseName: 'Lonsdaleite (2H Hex. Diamond)',
      crystalStructure: 'HCP',
      spaceGroup: 'P6_3/mmc (No. 194)',
      pearsonSymbol: 'hP4',
      strukturbericht: 'B4-like',
      a: 2.52,
      c: 4.12,
      gamma: 120,
      tempRange: 'Shock-Compressed (> 18 GPa, > 1000 °C)',
      tempMinC: 900,
      tempMaxC: 2500,
      pressureNote: 'Meteoritic shock conversion of graphite',
      density: 3.52,
      coordNumber: 4,
      apfPercent: 34.01,
      physicalNote: 'Eclipsed boat-conformation sp³ layers along [0001] with ABAB stacking.'
    }
  ],
  // Silicon (Z = 14)
  14: [
    {
      id: 'Si-I',
      phaseName: 'Si-I (Diamond Cubic)',
      crystalStructure: 'Diamond',
      spaceGroup: 'Fd-3m (No. 227)',
      pearsonSymbol: 'cF8',
      strukturbericht: 'A4',
      a: 5.43102,
      tempRange: '-273 °C to 1414 °C (0–11.7 GPa)',
      tempMinC: -273,
      tempMaxC: 1414,
      pressureNote: 'Primary NIST SRM 640f XRD line-position standard',
      density: 2.329,
      coordNumber: 4,
      apfPercent: 34.01,
      physicalNote: 'Indirect bandgap (1.12 eV) tetrahedral semiconductor; densifies by ~10% upon melting.'
    },
    {
      id: 'Si-II',
      phaseName: 'Si-II (Metallic β-Sn Phase)',
      crystalStructure: 'Tetragonal',
      spaceGroup: 'I4_1/amd (No. 141)',
      pearsonSymbol: 'tI4',
      strukturbericht: 'A5',
      a: 4.686,
      c: 2.585,
      tempRange: 'High-Pressure (> 11.7 GPa)',
      tempMinC: -273,
      tempMaxC: 800,
      pressureNote: '22% volume collapse semiconductor-to-metal transition',
      density: 3.22,
      coordNumber: 6,
      apfPercent: 53.5,
      physicalNote: 'Flattened tetrahedra yield 4+2 octahedral-like coordination and superconductivity below 6.7 K.'
    }
  ],
  // Calcium (Z = 20)
  20: [
    {
      id: 'Ca-alpha',
      phaseName: 'α-Ca (Low-T FCC)',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m (No. 225)',
      pearsonSymbol: 'cF4',
      strukturbericht: 'A1',
      a: 5.588,
      tempRange: '-273 °C to 443 °C',
      tempMinC: -273,
      tempMaxC: 443,
      density: 1.55,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Ambient cubic close-packed alkaline earth metal.'
    },
    {
      id: 'Ca-beta',
      phaseName: 'β-Ca (High-T BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 4.480,
      tempRange: '443 °C to 842 °C',
      tempMinC: 443,
      tempMaxC: 842,
      density: 1.52,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: 'Phonon-entropy-driven FCC → BCC transformation at 443 °C prior to melting.'
    }
  ],
  // Titanium (Z = 22)
  22: [
    {
      id: 'Ti-alpha',
      phaseName: 'α-Ti (Low-T HCP)',
      crystalStructure: 'HCP',
      spaceGroup: 'P6_3/mmc (No. 194)',
      pearsonSymbol: 'hP2',
      strukturbericht: 'A3',
      a: 2.951,
      c: 4.684,
      gamma: 120,
      tempRange: '-273 °C to 882 °C',
      tempMinC: -273,
      tempMaxC: 882,
      density: 4.506,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Sub-ideal c/a = 1.587 (< 1.633) activates prismatic {10-10}⟨11-20⟩ slip alongside basal slip.'
    },
    {
      id: 'Ti-beta',
      phaseName: 'β-Ti (High-T BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 3.306,
      tempRange: '882 °C to 1668 °C (β-Transus)',
      tempMinC: 882,
      tempMaxC: 1668,
      density: 4.35,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: 'Transforms via Burgers orientation relationship {0001}_α ∥ {110}_β and ⟨11-20⟩_α ∥ ⟨111⟩_β.'
    }
  ],
  // Manganese (Z = 25)
  25: [
    {
      id: 'Mn-alpha',
      phaseName: 'α-Mn (Complex 58-Atom BCC)',
      crystalStructure: 'Cubic',
      spaceGroup: 'I-43m (No. 217)',
      pearsonSymbol: 'cI58',
      strukturbericht: 'A12',
      a: 8.912,
      tempRange: '-273 °C to 727 °C',
      tempMinC: -273,
      tempMaxC: 727,
      density: 7.47,
      coordNumber: 12,
      apfPercent: 68.5,
      physicalNote: '4 inequivalent Wyckoff sites (CN = 12, 13, 16) with frustrated magnetic moments create a giant 58-atom unit cell.'
    },
    {
      id: 'Mn-beta',
      phaseName: 'β-Mn (Chiral Cubic)',
      crystalStructure: 'Cubic',
      spaceGroup: 'P4_132 (No. 213)',
      pearsonSymbol: 'cP20',
      strukturbericht: 'A13',
      a: 6.315,
      tempRange: '727 °C to 1095 °C',
      tempMinC: 727,
      tempMaxC: 1095,
      density: 7.29,
      coordNumber: 12,
      apfPercent: 66.0,
      physicalNote: 'Non-centrosymmetric 20-atom primitive cubic cell.'
    },
    {
      id: 'Mn-gamma',
      phaseName: 'γ-Mn (High-T FCC)',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m (No. 225)',
      pearsonSymbol: 'cF4',
      strukturbericht: 'A1',
      a: 3.862,
      tempRange: '1095 °C to 1133 °C',
      tempMinC: 1095,
      tempMaxC: 1133,
      density: 7.21,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Ductile face-centered cubic phase prior to δ-BCC.'
    },
    {
      id: 'Mn-delta',
      phaseName: 'δ-Mn (Pre-Melt BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 3.081,
      tempRange: '1133 °C to 1246 °C',
      tempMinC: 1133,
      tempMaxC: 1246,
      density: 7.10,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: 'High-temperature body-centered cubic phase up to melting point.'
    }
  ],
  // Iron (Z = 26)
  26: [
    {
      id: 'Fe-alpha',
      phaseName: 'α-Fe (Ferrite, BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 2.8665,
      tempRange: '-273 °C to 912 °C (T_C = 770 °C)',
      tempMinC: -273,
      tempMaxC: 912,
      density: 7.874,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: '3d exchange splitting (2.22 μ_B/atom) stabilizes BCC over HCP at STP; max Carbon solubility 0.022 wt% in octahedral voids.'
    },
    {
      id: 'Fe-gamma',
      phaseName: 'γ-Fe (Austenite, FCC)',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m (No. 225)',
      pearsonSymbol: 'cF4',
      strukturbericht: 'A1',
      a: 3.6468,
      tempRange: '912 °C to 1394 °C (A₃–A₄)',
      tempMinC: 912,
      tempMaxC: 1394,
      density: 7.98,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Paramagnetic close-packed FCC with large octahedral voids (r_oct = 0.414 R = 0.52 Å) dissolving up to 2.14 wt% Carbon.'
    },
    {
      id: 'Fe-delta',
      phaseName: 'δ-Fe (High-T Ferrite, BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 2.9315,
      tempRange: '1394 °C to 1538 °C',
      tempMinC: 1394,
      tempMaxC: 1538,
      density: 7.40,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: 'Re-entrant BCC phase stabilized above 1394 °C by high vibrational phonon entropy.'
    },
    {
      id: 'Fe-epsilon',
      phaseName: 'ε-Fe (Hexagonal Earth-Core Phase)',
      crystalStructure: 'HCP',
      spaceGroup: 'P6_3/mmc (No. 194)',
      pearsonSymbol: 'hP2',
      strukturbericht: 'A3',
      a: 2.468,
      c: 3.960,
      gamma: 120,
      tempRange: 'High-Pressure (> 13 GPa)',
      tempMinC: -273,
      tempMaxC: 6000,
      pressureNote: 'Stable phase in Earth’s inner core (~330–360 GPa)',
      density: 8.45,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Pressure collapses 3d magnetic moment, returning Iron to the Group 8 HCP trend shared by Ru and Os.'
    }
  ],
  // Cobalt (Z = 27)
  27: [
    {
      id: 'Co-epsilon',
      phaseName: 'ε-Co (Low-T HCP)',
      crystalStructure: 'HCP',
      spaceGroup: 'P6_3/mmc (No. 194)',
      pearsonSymbol: 'hP2',
      strukturbericht: 'A3',
      a: 2.507,
      c: 4.069,
      gamma: 120,
      tempRange: '-273 °C to 422 °C',
      tempMinC: -273,
      tempMaxC: 422,
      density: 8.86,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Ferromagnetic HCP with strong uniaxial magnetocrystalline anisotropy along [0001].'
    },
    {
      id: 'Co-alpha',
      phaseName: 'α-Co (High-T FCC)',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m (No. 225)',
      pearsonSymbol: 'cF4',
      strukturbericht: 'A1',
      a: 3.545,
      tempRange: '422 °C to 1495 °C',
      tempMinC: 422,
      tempMaxC: 1495,
      density: 8.80,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Martensitic ABAB → ABCABC stacking fault transition at 422 °C with ΔV/V ≈ 0.3%.'
    }
  ],
  // Zirconium (Z = 40)
  40: [
    {
      id: 'Zr-alpha',
      phaseName: 'α-Zr (Low-T HCP)',
      crystalStructure: 'HCP',
      spaceGroup: 'P6_3/mmc (No. 194)',
      pearsonSymbol: 'hP2',
      strukturbericht: 'A3',
      a: 3.232,
      c: 5.147,
      gamma: 120,
      tempRange: '-273 °C to 863 °C',
      tempMinC: -273,
      tempMaxC: 863,
      density: 6.506,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Ultra-low thermal neutron absorption cross section (0.184 barn) used in nuclear fuel cladding.'
    },
    {
      id: 'Zr-beta',
      phaseName: 'β-Zr (High-T BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 3.609,
      tempRange: '863 °C to 1855 °C',
      tempMinC: 863,
      tempMaxC: 1855,
      density: 6.40,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: 'High-temperature BCC phase above 863 °C.'
    }
  ],
  // Tin (Z = 50)
  50: [
    {
      id: 'Sn-alpha',
      phaseName: 'α-Sn (Gray Tin, Diamond Cubic)',
      crystalStructure: 'Diamond',
      spaceGroup: 'Fd-3m (No. 227)',
      pearsonSymbol: 'cF8',
      strukturbericht: 'A4',
      a: 6.489,
      tempRange: '-273 °C to 13.2 °C',
      tempMinC: -273,
      tempMaxC: 13.2,
      density: 5.769,
      coordNumber: 4,
      apfPercent: 34.01,
      physicalNote: 'Zero-gap sp³ covalent semiconductor; +27% molar volume expansion below 13.2 °C causes brittle crumbling ("Tin Pest").'
    },
    {
      id: 'Sn-beta',
      phaseName: 'β-Sn (White Tin, Metallic BCT)',
      crystalStructure: 'Tetragonal',
      spaceGroup: 'I4_1/amd (No. 141)',
      pearsonSymbol: 'tI4',
      strukturbericht: 'A5',
      a: 5.8318,
      c: 3.1818,
      tempRange: '13.2 °C to 231.9 °C',
      tempMinC: 13.2,
      tempMaxC: 231.9,
      density: 7.287,
      coordNumber: 6,
      apfPercent: 53.5,
      physicalNote: 'Ductile metallic body-centered tetragonal phase (c/a = 0.5456) with 4 nearest neighbors at 3.02 Å and 2 at 3.18 Å.'
    }
  ],
  // Uranium (Z = 92)
  92: [
    {
      id: 'U-alpha',
      phaseName: 'α-U (Orthorhombic Corrugated)',
      crystalStructure: 'Orthorhombic',
      spaceGroup: 'Cmcm (No. 63)',
      pearsonSymbol: 'oC4',
      strukturbericht: 'A20',
      a: 2.854,
      b: 5.870,
      c: 4.955,
      tempRange: '-273 °C to 668 °C',
      tempMinC: -273,
      tempMaxC: 668,
      density: 19.05,
      coordNumber: 4,
      apfPercent: 58.0,
      physicalNote: 'Itinerant 5f electron Peierls distortion creates corrugated sheets with strongly anisotropic thermal expansion.'
    },
    {
      id: 'U-beta',
      phaseName: 'β-U (Complex Tetragonal)',
      crystalStructure: 'Tetragonal',
      spaceGroup: 'P4_2/mnm (No. 136)',
      pearsonSymbol: 'tP30',
      strukturbericht: 'A_b',
      a: 10.759,
      c: 5.656,
      tempRange: '668 °C to 776 °C',
      tempMinC: 668,
      tempMaxC: 776,
      density: 18.11,
      coordNumber: 12,
      apfPercent: 64.0,
      physicalNote: '30-atom Frank-Kasper sigma-phase-like tetragonal unit cell.'
    },
    {
      id: 'U-gamma',
      phaseName: 'γ-U (High-T BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 3.524,
      tempRange: '776 °C to 1132 °C',
      tempMinC: 776,
      tempMaxC: 1132,
      density: 18.06,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: 'Isotropic body-centered cubic phase preferred for metallic nuclear fuel alloying (e.g. U-10Mo).'
    }
  ],
  // Plutonium (Z = 94)
  94: [
    {
      id: 'Pu-alpha',
      phaseName: 'α-Pu (Simple Monoclinic)',
      crystalStructure: 'Monoclinic',
      spaceGroup: 'P2_1/m (No. 11)',
      pearsonSymbol: 'mP16',
      strukturbericht: 'α-Pu',
      a: 6.183,
      b: 4.822,
      c: 10.963,
      beta: 101.79,
      tempRange: '-273 °C to 125 °C',
      tempMinC: -273,
      tempMaxC: 125,
      density: 19.86,
      coordNumber: 14,
      apfPercent: 58.2,
      physicalNote: '16 atoms across 8 inequivalent Wyckoff sites; brittle with short (2.57 Å) and long (3.71 Å) 5f covalent bonds.'
    },
    {
      id: 'Pu-delta',
      phaseName: 'δ-Pu (Low-Density FCC)',
      crystalStructure: 'FCC',
      spaceGroup: 'Fm-3m (No. 225)',
      pearsonSymbol: 'cF4',
      strukturbericht: 'A1',
      a: 4.637,
      tempRange: '315 °C to 457 °C (Ga-stabilized at STP)',
      tempMinC: 315,
      tempMaxC: 457,
      density: 15.92,
      coordNumber: 12,
      apfPercent: 74.05,
      physicalNote: 'Remarkable 25% lower density than α-Pu despite close-packed FCC symmetry, exhibiting negative thermal expansion.'
    },
    {
      id: 'Pu-epsilon',
      phaseName: 'ε-Pu (High-T BCC)',
      crystalStructure: 'BCC',
      spaceGroup: 'Im-3m (No. 229)',
      pearsonSymbol: 'cI2',
      strukturbericht: 'A2',
      a: 3.636,
      tempRange: '480 °C to 640 °C',
      tempMinC: 480,
      tempMaxC: 640,
      density: 16.51,
      coordNumber: 8,
      apfPercent: 68.02,
      physicalNote: '6th solid allotrope of Plutonium; contracts upon melting at 640 °C.'
    }
  ]
};

/**
 * Exact Crystallographic Metric Tensor & Selection Rule Calculator for any Element
 */
export function calculateExactElementMetrics(
  el: CrystalElement,
  h: number,
  k: number,
  l: number,
  wavelength = 1.54056
) {
  const s = el.crystalStructure;
  const meta = CRYSTAL_FAMILIES_METADATA[s] || CRYSTAL_FAMILIES_METADATA.FCC;
  const a = el.a || 3.6;
  const b = el.b || a;
  const c = el.c || (s === 'HCP' || s === 'Hexagonal' ? a * 1.633 : a);

  const alphaDeg = el.alpha || (s === 'Rhombohedral' ? 57.2 : 90);
  const betaDeg = el.beta || (s === 'Monoclinic' ? 101.8 : 90);
  const gammaDeg =
    el.gamma || (s === 'HCP' || s === 'Hexagonal' ? 120 : s === 'Rhombohedral' ? alphaDeg : 90);

  const rad = Math.PI / 180;
  const ca = Math.cos(alphaDeg * rad);
  const cb = Math.cos(betaDeg * rad);
  const cg = Math.cos(gammaDeg * rad);
  const sa = Math.sin(alphaDeg * rad);
  const sb = Math.sin(betaDeg * rad);
  const sg = Math.sin(gammaDeg * rad);

  // Exact Triclinic Metric Determinant for Unit Cell Volume V_cell
  const volFactor = Math.max(0.0001, 1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg);
  const unitCellVolume = a * b * c * Math.sqrt(volFactor);

  // Exact Interplanar Spacing d_hkl (Å) by Crystal System
  let invD2 = 0;
  if (h === 0 && k === 0 && l === 0) {
    invD2 = 0;
  } else if (s === 'FCC' || s === 'BCC' || s === 'Diamond' || s === 'Cubic' || s === 'Amorphous') {
    invD2 = (h * h + k * k + l * l) / (a * a);
  } else if (s === 'HCP' || s === 'Hexagonal') {
    invD2 = (4 / 3) * ((h * h + h * k + k * k) / (a * a)) + (l * l) / (c * c);
  } else if (s === 'Tetragonal') {
    invD2 = (h * h + k * k) / (a * a) + (l * l) / (c * c);
  } else if (s === 'Orthorhombic') {
    invD2 = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
  } else {
    // General Triclinic / Monoclinic / Rhombohedral Reciprocal Metric Tensor
    const S11 = b * b * c * c * sa * sa;
    const S22 = a * a * c * c * sb * sb;
    const S33 = a * a * b * b * sg * sg;
    const S12 = a * b * c * c * (ca * cb - cg);
    const S23 = a * a * b * c * (cb * cg - ca);
    const S13 = a * b * b * c * (cg * ca - cb);

    invD2 =
      (S11 * h * h +
        S22 * k * k +
        S33 * l * l +
        2 * S12 * h * k +
        2 * S23 * k * l +
        2 * S13 * h * l) /
      (unitCellVolume * unitCellVolume);
  }

  const dSpacing = invD2 > 1e-9 ? 1 / Math.sqrt(invD2) : 0;
  const qVector = dSpacing > 0 ? (2 * Math.PI) / dSpacing : 0;
  const sinTheta = dSpacing > 0 ? wavelength / (2 * dSpacing) : 0;
  const twoTheta =
    sinTheta > 0 && sinTheta <= 1 ? (2 * Math.asin(sinTheta) * 180) / Math.PI : null;

  // Systematic Absence / Structure Factor Rule Check
  let allowed = true;
  let ruleExplanation = 'Allowed reflection (F_hkl ≠ 0)';
  if (h === 0 && k === 0 && l === 0) {
    allowed = false;
    ruleExplanation = 'Forward beam (000) — zero Bragg angle';
  } else if (s === 'BCC') {
    const sum = h + k + l;
    allowed = sum % 2 === 0;
    ruleExplanation = allowed
      ? `Allowed BCC reflection: h+k+l = ${sum} (even) → |F| = 2f`
      : `Forbidden by I-centering: h+k+l = ${sum} (odd) → F_hkl = 0`;
  } else if (s === 'FCC') {
    const pH = h % 2;
    const pK = k % 2;
    const pL = l % 2;
    allowed = pH === pK && pK === pL;
    ruleExplanation = allowed
      ? `Allowed FCC reflection: (${h}${k}${l}) unmixed parity → |F| = 4f`
      : `Forbidden by F-centering: (${h}${k}${l}) mixed odd/even parity → F_hkl = 0`;
  } else if (s === 'Diamond') {
    const pH = h % 2;
    const pK = k % 2;
    const pL = l % 2;
    const unmixed = pH === pK && pK === pL;
    if (!unmixed) {
      allowed = false;
      ruleExplanation = `Forbidden by F-centering: (${h}${k}${l}) mixed parity`;
    } else if (pH === 0 && (h + k + l) % 4 !== 0) {
      allowed = false;
      ruleExplanation = `Forbidden by d-glide (¼,¼,¼ basis): all even but h+k+l = ${h + k + l} ≠ 4n`;
    } else {
      allowed = true;
      ruleExplanation =
        pH === 1
          ? `Allowed Diamond reflection (odd parity): |F| = 4√2 f`
          : `Allowed Diamond reflection (h+k+l = 4n): |F| = 8f`;
    }
  } else if (s === 'HCP') {
    const is3n = (h + 2 * k) % 3 === 0;
    const isOddL = l % 2 !== 0;
    if (is3n && isOddL) {
      allowed = false;
      ruleExplanation = `Forbidden by 6_3 screw axis: h+2k = ${h + 2 * k} (3n) and l = ${l} (odd)`;
    } else {
      allowed = true;
      ruleExplanation = is3n
        ? `Strong HCP reflection: h+2k = 3n, l even → |F| = 2f`
        : `Allowed HCP reflection: |F| = ${l % 2 === 0 ? 'f' : '√3 f'}`;
    }
  } else if (s === 'Tetragonal' && el.spaceGroup.includes('I')) {
    const sum = h + k + l;
    allowed = sum % 2 === 0;
    ruleExplanation = allowed
      ? `Allowed BCT reflection: h+k+l = ${sum} (even)`
      : `Forbidden by Body-Centered Tetragonal (I) translation: h+k+l = ${sum} (odd)`;
  }

  return {
    a,
    b,
    c,
    alphaDeg,
    betaDeg,
    gammaDeg,
    unitCellVolume,
    dSpacing,
    qVector,
    twoTheta,
    allowed,
    ruleExplanation,
    meta
  };
}

/**
 * Custom High-Precision Isometric SVG Schematic for Each Crystal Family
 */
export const CrystalFamilySchematicSVG: React.FC<{
  structure: CrystalStructureType;
  accentHex: string;
  size?: number;
}> = ({ structure, accentHex, size = 84 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className="shrink-0 select-none drop-shadow-md"
    >
      <defs>
        <radialGradient id={`cf-glow-${structure}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentHex} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accentHex} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`cf-atom-${structure}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="50%" stopColor={accentHex} stopOpacity="1" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="44" fill={`url(#cf-glow-${structure})`} />

      {structure === 'HCP' || structure === 'Hexagonal' ? (
        <g>
          {/* Back Hexagonal Prism Edges */}
          <polyline
            points="22,28 50,16 78,28 78,66 50,54 22,66"
            stroke={accentHex}
            strokeOpacity="0.35"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />
          <line x1="50" y1="16" x2="50" y2="54" stroke={accentHex} strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="2 2" />
          {/* Top & Front Hexagonal Prism */}
          <polygon
            points="50,16 78,28 70,40 30,40 22,28"
            fill={accentHex}
            fillOpacity="0.12"
            stroke={accentHex}
            strokeWidth="1.6"
          />
          <polygon
            points="50,54 78,66 70,78 30,78 22,66"
            fill={accentHex}
            fillOpacity="0.08"
            stroke={accentHex}
            strokeWidth="1.5"
          />
          <line x1="22" y1="28" x2="22" y2="66" stroke={accentHex} strokeWidth="1.6" />
          <line x1="78" y1="28" x2="78" y2="66" stroke={accentHex} strokeWidth="1.6" />
          <line x1="30" y1="40" x2="30" y2="78" stroke={accentHex} strokeWidth="1.6" />
          <line x1="70" y1="40" x2="70" y2="78" stroke={accentHex} strokeWidth="1.6" />

          {/* Corner & Basal Nodes */}
          {[
            [50, 16], [78, 28], [70, 40], [30, 40], [22, 28], [50, 29],
            [50, 54], [78, 66], [70, 78], [30, 78], [22, 66], [50, 67]
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="3.4" fill={`url(#cf-atom-${structure})`} />
          ))}

          {/* B-layer triad for HCP */}
          {structure === 'HCP' && (
            <g>
              <polygon
                points="40,46 60,46 50,54"
                fill="#38bdf8"
                fillOpacity="0.22"
                stroke="#38bdf8"
                strokeWidth="1.2"
              />
              <circle cx="40" cy="46" r="4.2" fill="#38bdf8" stroke="#fff" strokeWidth="0.7" />
              <circle cx="60" cy="46" r="4.2" fill="#38bdf8" stroke="#fff" strokeWidth="0.7" />
              <circle cx="50" cy="54" r="4.2" fill="#38bdf8" stroke="#fff" strokeWidth="0.7" />
            </g>
          )}
        </g>
      ) : structure === 'Rhombohedral' || structure === 'Monoclinic' ? (
        <g>
          {/* Sheared Rhombohedral / Monoclinic Parallelepiped */}
          <polygon
            points="34,18 82,18 68,42 20,42"
            fill={accentHex}
            fillOpacity="0.14"
            stroke={accentHex}
            strokeWidth="1.6"
          />
          <polygon
            points="26,56 74,56 60,80 12,80"
            fill={accentHex}
            fillOpacity="0.08"
            stroke={accentHex}
            strokeWidth="1.5"
          />
          <line x1="34" y1="18" x2="26" y2="56" stroke={accentHex} strokeWidth="1.4" strokeDasharray="2 2" />
          <line x1="82" y1="18" x2="74" y2="56" stroke={accentHex} strokeWidth="1.6" />
          <line x1="68" y1="42" x2="60" y2="80" stroke={accentHex} strokeWidth="1.6" />
          <line x1="20" y1="42" x2="12" y2="80" stroke={accentHex} strokeWidth="1.6" />
          {/* Shear angle arc */}
          <path d="M 22 72 A 12 12 0 0 1 28 80" stroke="#f59e0b" strokeWidth="1.4" fill="none" />
          <text x="31" y="75" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {structure === 'Rhombohedral' ? 'α≠90°' : 'β≠90°'}
          </text>
          {[
            [34, 18], [82, 18], [68, 42], [20, 42],
            [26, 56], [74, 56], [60, 80], [12, 80]
          ].map(([cx, cy], idx) => (
            <circle key={idx} cx={cx} cy={cy} r="3.8" fill={`url(#cf-atom-${structure})`} />
          ))}
        </g>
      ) : (
        <g>
          {/* Isometric Cube / Tetragonal / Orthorhombic Box */}
          {(() => {
            const topY = structure === 'Tetragonal' ? 12 : 18;
            const botY = structure === 'Tetragonal' ? 88 : 82;
            const midH = (botY - topY) * 0.28;
            const w = structure === 'Orthorhombic' ? 34 : 28;
            return (
              <>
                {/* Back edges */}
                <line x1={50} y1={topY} x2={50} y2={botY - midH * 2} stroke={accentHex} strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="2 2" />
                <line x1={50 - w} y1={botY - midH} x2={50} y2={botY - midH * 2} stroke={accentHex} strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="2 2" />
                <line x1={50 + w} y1={botY - midH} x2={50} y2={botY - midH * 2} stroke={accentHex} strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="2 2" />

                {/* Outer Hexagon Silhouette */}
                <polygon
                  points={`50,${topY} ${50 + w},${topY + midH} ${50 + w},${botY - midH} 50,${botY} ${50 - w},${botY - midH} ${50 - w},${topY + midH}`}
                  fill={accentHex}
                  fillOpacity="0.10"
                  stroke={accentHex}
                  strokeWidth="1.7"
                />
                {/* Front internal Y edges */}
                <polyline
                  points={`${50 - w},${topY + midH} 50,${topY + midH * 2} ${50 + w},${topY + midH}`}
                  stroke={accentHex}
                  strokeWidth="1.5"
                />
                <line x1="50" y1={topY + midH * 2} x2="50" y2={botY} stroke={accentHex} strokeWidth="1.5" />

                {/* Internal Coordination Features */}
                {structure === 'BCC' && (
                  <g>
                    <line x1={50 - w} y1={topY + midH} x2={50 + w} y2={botY - midH} stroke="#38bdf8" strokeWidth="1.1" strokeDasharray="2 2" />
                    <line x1={50 + w} y1={topY + midH} x2={50 - w} y2={botY - midH} stroke="#38bdf8" strokeWidth="1.1" strokeDasharray="2 2" />
                    <line x1="50" y1={topY} x2="50" y2={botY} stroke="#38bdf8" strokeWidth="1.1" strokeDasharray="2 2" />
                    <circle cx="50" cy="50" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                  </g>
                )}

                {structure === 'FCC' && (
                  <g>
                    {/* Octahedral face-center polyhedron */}
                    <polygon
                      points={`50,${topY + midH} ${50 - w / 2},54 50,${botY - midH} ${50 + w / 2},54`}
                      fill="#34d399"
                      fillOpacity="0.22"
                      stroke="#34d399"
                      strokeWidth="1.1"
                    />
                    <circle cx="50" cy={topY + midH} r="4.2" fill="#34d399" stroke="#fff" strokeWidth="0.7" />
                    <circle cx={50 - w / 2} cy={54} r="4.2" fill="#34d399" stroke="#fff" strokeWidth="0.7" />
                    <circle cx={50 + w / 2} cy={54} r="4.2" fill="#34d399" stroke="#fff" strokeWidth="0.7" />
                  </g>
                )}

                {structure === 'Diamond' && (
                  <g>
                    {/* Tetrahedral sp3 bonds */}
                    <line x1="50" y1="50" x2="50" y2="30" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="50" y1="50" x2="34" y2="60" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="50" y1="50" x2="66" y2="60" stroke="#22d3ee" strokeWidth="2" />
                    <line x1="50" y1="50" x2="56" y2="42" stroke="#22d3ee" strokeWidth="1.6" />
                    <circle cx="50" cy="50" r="5" fill="#22d3ee" stroke="#fff" strokeWidth="1" />
                    <circle cx="50" cy="30" r="3.6" fill="#38bdf8" />
                    <circle cx="34" cy="60" r="3.6" fill="#38bdf8" />
                    <circle cx="66" cy="60" r="3.6" fill="#38bdf8" />
                  </g>
                )}

                {/* Corner Atoms */}
                {[
                  [50, topY],
                  [50 + w, topY + midH],
                  [50 + w, botY - midH],
                  [50, botY],
                  [50 - w, botY - midH],
                  [50 - w, topY + midH],
                  [50, topY + midH * 2]
                ].map(([cx, cy], idx) => (
                  <circle key={idx} cx={cx} cy={cy} r="3.8" fill={`url(#cf-atom-${structure})`} />
                ))}
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
};

/**
 * 1. Compact Interactive Crystal Systems Distribution Ribbon above Periodic Table
 */
export const PeriodicCrystalStructureStrip: React.FC<{
  elements: CrystalElement[];
  activeStructureFilter: string;
  onSelectStructureFilter: (struct: string) => void;
  onOpenFullAtlas?: () => void;
}> = ({ elements, activeStructureFilter, onSelectStructureFilter, onOpenFullAtlas }) => {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const el of elements) {
      counts[el.crystalStructure] = (counts[el.crystalStructure] || 0) + 1;
    }
    const orderedKeys: CrystalStructureType[] = [
      'HCP',
      'FCC',
      'BCC',
      'Orthorhombic',
      'Rhombohedral',
      'Hexagonal',
      'Diamond',
      'Tetragonal',
      'Monoclinic',
      'Cubic'
    ];
    return orderedKeys
      .filter(k => (counts[k] || 0) > 0)
      .map(k => ({
        key: k,
        count: counts[k] || 0,
        pct: (((counts[k] || 0) / elements.length) * 100).toFixed(1),
        meta: CRYSTAL_FAMILIES_METADATA[k]
      }));
  }, [elements]);

  return (
    <div className="bg-[#0B0F19] border border-slate-800/90 rounded-2xl p-3.5 shadow-xl space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-400">
            <Box className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>118-Element Crystal Systems & Bravais Distribution</span>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                STP Ground-State Lattices
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeStructureFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectStructureFilter('all')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
            >
              Clear Filter ({activeStructureFilter})
            </button>
          )}
          {onOpenFullAtlas && (
            <button
              type="button"
              onClick={onOpenFullAtlas}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 hover:bg-indigo-500/25 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Open Full Bravais & Allotropes Atlas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Proportional Bar */}
      <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800/80">
        {distribution.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() =>
              onSelectStructureFilter(activeStructureFilter === item.key ? 'all' : item.key)
            }
            style={{
              width: `${(item.count / elements.length) * 100}%`,
              backgroundColor: item.meta.accentHex
            }}
            className={`h-full transition-opacity cursor-pointer ${
              activeStructureFilter === 'all' || activeStructureFilter === item.key
                ? 'opacity-90 hover:opacity-100'
                : 'opacity-25'
            }`}
            title={`${item.meta.shortLabel}: ${item.count} elements (${item.pct}%)`}
          />
        ))}
      </div>

      {/* Interactive Crystal Family Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
        {distribution.map(item => {
          const isSelected = activeStructureFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                onSelectStructureFilter(isSelected ? 'all' : item.key)
              }
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `${item.meta.badgeClasses} ring-1 ring-white/30 shadow-md scale-[1.01]`
                  : 'bg-[#070b14] border-slate-800/90 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className="text-[10px] font-mono font-extrabold truncate"
                  style={{ color: isSelected ? undefined : item.meta.accentHex }}
                >
                  {item.key}
                </span>
                <MicroLatticeGlyph structure={item.key} size={13} className="opacity-90" />
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-xs font-black text-white">{item.count}</span>
                <span className="text-[8.5px] text-slate-400">
                  {item.meta.pearsonDefault.split(' ')[0]} · {item.meta.apfPercent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 2. Element Crystallography, Exact Metric Tensor & Allotropes Card (for 3D Lattice Inspector)
 */
export const ElementCrystallographyAndAllotropesPanel: React.FC<{
  element: CrystalElement;
  hkl: [number, number, number];
  onHklChange: (h: number, k: number, l: number) => void;
  onApplyAllotropeOverride?: (allotrope: ElementAllotrope) => void;
  onOpenFullAtlas?: () => void;
}> = ({ element, hkl, onHklChange, onApplyAllotropeOverride, onOpenFullAtlas }) => {
  const [h, k, l] = hkl;
  const metrics = useMemo(
    () => calculateExactElementMetrics(element, h, k, l),
    [element, h, k, l]
  );

  const allotropes = useMemo<ElementAllotrope[]>(() => {
    if (ELEMENT_ALLOTROPES[element.number]) {
      return ELEMENT_ALLOTROPES[element.number];
    }
    // Generate scientifically accurate STP solid + liquid + vapor phase profile for any element
    const meta =
      CRYSTAL_FAMILIES_METADATA[element.crystalStructure] || CRYSTAL_FAMILIES_METADATA.FCC;
    return [
      {
        id: `${element.symbol}-alpha`,
        phaseName: `α-${element.symbol} (Ground-State Crystal)`,
        crystalStructure: element.crystalStructure,
        spaceGroup: element.spaceGroup,
        pearsonSymbol: meta.pearsonDefault,
        strukturbericht: meta.strukturbericht,
        a: element.a,
        b: element.b,
        c: element.c,
        alpha: element.alpha,
        beta: element.beta,
        gamma: element.gamma,
        tempRange: `< ${element.meltingPoint.toFixed(1)} °C`,
        tempMinC: -273,
        tempMaxC: element.meltingPoint,
        density: element.density,
        coordNumber: meta.coordNumber,
        apfPercent: meta.apfPercent,
        physicalNote: `Crystallizes in ${meta.name} (${element.spaceGroup}) with coordination CN = ${meta.coordNumber} and packing efficiency ${meta.apfPercent}%.`
      }
    ];
  }, [element]);

  const [activeAllotropeId, setActiveAllotropeId] = useState<string>(allotropes[0]?.id || '');

  return (
    <div className="space-y-4">
      {/* Symmetry & Packing Descriptor Matrix */}
      <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-4 space-y-3 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
              Crystallographic Descriptor & Void Topology
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border ${metrics.meta.badgeClasses}`}
          >
            {metrics.meta.pearsonDefault} · {metrics.meta.strukturbericht}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2">
            <div className="text-[8px] text-slate-500 uppercase">Bravais Type</div>
            <div className="text-xs font-black text-white mt-0.5">{metrics.meta.bravaisSymbol}</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2">
            <div className="text-[8px] text-slate-500 uppercase">Strukturbericht</div>
            <div className="text-xs font-black text-amber-300 mt-0.5">
              {metrics.meta.strukturbericht}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2">
            <div className="text-[8px] text-slate-500 uppercase">Packing (APF)</div>
            <div className="text-xs font-black text-emerald-400 mt-0.5">
              {metrics.meta.apfPercent}%
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-2">
            <div className="text-[8px] text-slate-500 uppercase">Cell Volume V</div>
            <div className="text-xs font-black text-sky-300 mt-0.5">
              {metrics.unitCellVolume.toFixed(2)} Å³
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-[10px] font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Close-Packed Stacking:</span>
            <span className="text-slate-200 font-semibold text-right">{metrics.meta.stackingSequence}</span>
          </div>
          <div className="flex justify-between gap-2 border-t border-slate-900 pt-1">
            <span className="text-slate-500">Octahedral Interstice:</span>
            <span className="text-indigo-300 text-right">{metrics.meta.octahedralVoidRatio}</span>
          </div>
          <div className="flex justify-between gap-2 border-t border-slate-900 pt-1">
            <span className="text-slate-500">Tetrahedral Interstice:</span>
            <span className="text-cyan-300 text-right">{metrics.meta.tetrahedralVoidRatio}</span>
          </div>
        </div>
      </div>

      {/* Exact Symmetry-Aware (hkl) Metric Tensor & Systematic Absence Inspector */}
      <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Orbit className="w-3.5 h-3.5 text-amber-400" />
            Symmetry-Exact (hkl) Metric & Extinction Rule
          </span>
          <span className="text-[9.5px] font-mono text-slate-400">
            λ = 1.5406 Å (Cu Kα₁)
          </span>
        </div>

        {/* Miller Indices Inputs + Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            {(['h', 'k', 'l'] as const).map((label, idx) => {
              const val = hkl[idx];
              return (
                <div key={label} className="flex items-center gap-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {label}:
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={String(val) === 'NaN' ? '' : val}
                    onChange={(e) => {
                      const next = Math.max(0, Math.min(9, parseInt(e.target.value) || 0));
                      const updated: [number, number, number] = [...hkl] as [number, number, number];
                      updated[idx] = next;
                      onHklChange(updated[0], updated[1], updated[2]);
                    }}
                    className="w-9 text-center text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-white rounded-lg py-1 focus:border-cyan-500 outline-none"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1">
            {(
              [
                [1, 0, 0],
                [1, 1, 0],
                [1, 1, 1],
                [2, 0, 0],
                [2, 1, 1],
                [0, 0, 2]
              ] as [number, number, number][]
            ).map(([ph, pk, pl]) => {
              const isCurr = h === ph && k === pk && l === pl;
              return (
                <button
                  key={`${ph}${pk}${pl}`}
                  type="button"
                  onClick={() => onHklChange(ph, pk, pl)}
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-colors cursor-pointer border ${
                    isCurr
                      ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  ({ph}{pk}{pl})
                </button>
              );
            })}
          </div>
        </div>

        {/* Calculated d_hkl, Q, 2Theta, and Structure Factor Status */}
        <div className="grid grid-cols-3 gap-2 font-mono text-center">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-[8px] text-slate-500 uppercase">d_({h}{k}{l}) Spacing</div>
            <div className="text-xs font-black text-cyan-300 mt-0.5">
              {metrics.dSpacing > 0 ? `${metrics.dSpacing.toFixed(4)} Å` : '—'}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-[8px] text-slate-500 uppercase">Reciprocal Q</div>
            <div className="text-xs font-black text-indigo-300 mt-0.5">
              {metrics.qVector > 0 ? `${metrics.qVector.toFixed(3)} Å⁻¹` : '—'}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
            <div className="text-[8px] text-slate-500 uppercase">Bragg 2θ (Cu Kα)</div>
            <div className="text-xs font-black text-amber-300 mt-0.5">
              {metrics.twoTheta !== null ? `${metrics.twoTheta.toFixed(2)}°` : 'Out of Ewald'}
            </div>
          </div>
        </div>

        {/* Systematic Absence / Allowed Status Banner */}
        <div
          className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-[10px] font-mono ${
            metrics.allowed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {metrics.allowed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span>{metrics.ruleExplanation}</span>
          </div>
        </div>
      </div>

      {/* Allotropic Phase Transitions & Polymorphism Explorer */}
      <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-violet-400" />
            {ELEMENT_ALLOTROPES[element.number]
              ? `${element.symbol} Allotropic Polymorphs (${allotropes.length} Solid Phases)`
              : `${element.symbol} Crystalline Phase Stability`}
          </span>
          {onOpenFullAtlas && (
            <button
              type="button"
              onClick={onOpenFullAtlas}
              className="text-[9.5px] font-mono text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              Compare All 118 Elements →
            </button>
          )}
        </div>

        <div className="space-y-2">
          {allotropes.map((al) => {
            const isSelected = activeAllotropeId === al.id || element.crystalStructure === al.crystalStructure;
            const famMeta =
              CRYSTAL_FAMILIES_METADATA[al.crystalStructure] || CRYSTAL_FAMILIES_METADATA.FCC;
            return (
              <div
                key={al.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-950/35 border-indigo-500/45 shadow-md'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{al.phaseName}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${famMeta.badgeClasses}`}
                      >
                        {al.crystalStructure} ({al.pearsonSymbol} · {al.strukturbericht})
                      </span>
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                      {al.spaceGroup} · a = {al.a.toFixed(3)} Å
                      {al.b ? `, b = ${al.b.toFixed(3)} Å` : ''}
                      {al.c ? `, c = ${al.c.toFixed(3)} Å` : ''} · ρ = {al.density.toFixed(2)} g/cm³
                    </div>
                  </div>

                  {onApplyAllotropeOverride && allotropes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAllotropeId(al.id);
                        onApplyAllotropeOverride(al);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-bold bg-indigo-600/25 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 transition-colors cursor-pointer"
                    >
                      Load in 3D Cell
                    </button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800">
                    Stability: {al.tempRange}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800">
                    CN = {al.coordNumber} · APF = {al.apfPercent}%
                  </span>
                  {al.pressureNote && (
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                      {al.pressureNote}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[10px] text-slate-300 leading-relaxed">
                  {al.physicalNote}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Full-Screen Crystal Systems, Bravais Lattices & Allotropes Atlas Tab
 */
export const PeriodicCrystalSystemsAtlas: React.FC<{
  elements: CrystalElement[];
  selectedElementZ: number;
  onSelectElement: (z: number) => void;
  onFilterGridByStructure: (struct: CrystalStructureType) => void;
  onApplyAllotropeOverride?: (z: number, allotrope: ElementAllotrope) => void;
}> = ({
  elements,
  selectedElementZ,
  onSelectElement,
  onFilterGridByStructure,
  onApplyAllotropeOverride
}) => {
  const [selectedFamily, setSelectedFamily] = useState<CrystalStructureType>('FCC');
  const [selectedPolymorphZ, setSelectedPolymorphZ] = useState<number>(26); // Iron default

  const groupedByStructure = useMemo(() => {
    const map: Record<string, CrystalElement[]> = {};
    for (const el of elements) {
      if (!map[el.crystalStructure]) map[el.crystalStructure] = [];
      map[el.crystalStructure].push(el);
    }
    return map;
  }, [elements]);

  const orderedFamilies: CrystalStructureType[] = [
    'HCP',
    'FCC',
    'BCC',
    'Orthorhombic',
    'Rhombohedral',
    'Hexagonal',
    'Diamond',
    'Tetragonal',
    'Monoclinic',
    'Cubic'
  ];

  const activeFamilyMeta = CRYSTAL_FAMILIES_METADATA[selectedFamily];
  const activeFamilyElements = groupedByStructure[selectedFamily] || [];
  const polymorphicElements = useMemo(
    () =>
      Object.keys(ELEMENT_ALLOTROPES)
        .map(Number)
        .map(z => elements.find(e => e.number === z))
        .filter((e): e is CrystalElement => Boolean(e)),
    [elements]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Hero Overview Banner */}
      <div className="bg-gradient-to-br from-[#0B0F19] via-[#0F1629] to-[#0B0F19] border border-slate-800/90 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Crystallographic Taxonomy of the 118 Elements</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              7 Crystal Systems, Bravais Lattices & Elemental Allotrope Atlas
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore how electronic band structure, s-p hybridization, d-band filling, and magnetic exchange partition the periodic table across close-packed metallic lattices (<strong className="text-amber-300">HCP hP2</strong>, <strong className="text-emerald-300">FCC cF4</strong>), open high-entropy body-centered cubic metals (<strong className="text-sky-300">BCC cI2</strong>), directional covalent networks (<strong className="text-cyan-300">Diamond cF8</strong>), and Peierls-distorted low-symmetry structures.
            </p>
          </div>

          {/* Summary KPI Badges */}
          <div className="grid grid-cols-3 gap-3 shrink-0 font-mono text-center">
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3">
              <div className="text-[9px] text-slate-500 uppercase">Close-Packed (HCP+FCC)</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                {(groupedByStructure['HCP']?.length || 0) + (groupedByStructure['FCC']?.length || 0)}
              </div>
              <div className="text-[9px] text-slate-400">APF = 74.05%</div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3">
              <div className="text-[9px] text-slate-500 uppercase">Body-Centered (BCC)</div>
              <div className="text-lg font-black text-sky-400 mt-0.5">
                {groupedByStructure['BCC']?.length || 0}
              </div>
              <div className="text-[9px] text-slate-400">APF = 68.02%</div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3">
              <div className="text-[9px] text-slate-500 uppercase">Covalent / Distorted</div>
              <div className="text-lg font-black text-purple-400 mt-0.5">
                {118 -
                  ((groupedByStructure['HCP']?.length || 0) +
                    (groupedByStructure['FCC']?.length || 0) +
                    (groupedByStructure['BCC']?.length || 0))}
              </div>
              <div className="text-[9px] text-slate-400">APF = 28–58%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 10 Elemental Crystal Family Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {orderedFamilies.map(famKey => {
          const meta = CRYSTAL_FAMILIES_METADATA[famKey];
          const members = groupedByStructure[famKey] || [];
          const isSelected = selectedFamily === famKey;
          return (
            <button
              key={famKey}
              type="button"
              onClick={() => setSelectedFamily(famKey)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-[#0F172A] border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/30'
                  : 'bg-[#0B0F19] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${meta.badgeClasses}`}
                  >
                    {meta.pearsonDefault} · {meta.strukturbericht}
                  </span>
                  <h4 className="text-sm font-black text-white mt-1.5">{famKey}</h4>
                  <p className="text-[9.5px] text-slate-400 font-mono">{meta.crystalSystem}</p>
                </div>
                <CrystalFamilySchematicSVG
                  structure={famKey}
                  accentHex={meta.accentHex}
                  size={54}
                />
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[10px]">
                <span className="text-slate-400">
                  <strong className="text-white">{members.length}</strong> elements
                </span>
                <span style={{ color: meta.accentHex }} className="font-bold">
                  APF {meta.apfPercent}%
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Workbench for Selected Crystal Family */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Geometric, Metric & Interstitial Specifications */}
        <div className="lg:col-span-5 bg-[#0B0F19] border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold border ${activeFamilyMeta.badgeClasses}`}
              >
                {activeFamilyMeta.crystalSystem} · Prototype: {activeFamilyMeta.prototypeElement}
              </span>
              <h4 className="text-lg font-black text-white">{activeFamilyMeta.name}</h4>
              <p className="text-xs font-mono text-cyan-300">
                Space Group: {activeFamilyMeta.spaceGroupPrototype}
              </p>
            </div>
            <CrystalFamilySchematicSVG
              structure={selectedFamily}
              accentHex={activeFamilyMeta.accentHex}
              size={88}
            />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeFamilyMeta.description}
          </p>

          {/* Quantitative Crystallographic Table */}
          <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5">
              <div className="text-[9px] text-slate-500 uppercase">Pearson / Strukturbericht</div>
              <div className="font-bold text-white mt-0.5">
                {activeFamilyMeta.pearsonDefault} / {activeFamilyMeta.strukturbericht}
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5">
              <div className="text-[9px] text-slate-500 uppercase">Coord. Number & Z</div>
              <div className="font-bold text-emerald-300 mt-0.5">
                CN = {activeFamilyMeta.coordNumber} · Z = {activeFamilyMeta.atomsPerCellZ}
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5 col-span-2">
              <div className="text-[9px] text-slate-500 uppercase">Unit Cell Metric Constraints</div>
              <div className="font-bold text-sky-300 mt-0.5">
                {activeFamilyMeta.metricConstraints}
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5 col-span-2">
              <div className="text-[9px] text-slate-500 uppercase">Structure Factor Extinction Rule</div>
              <div className="font-bold text-amber-300 mt-0.5">
                {activeFamilyMeta.selectionRule}
              </div>
            </div>
            <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-2.5 col-span-2">
              <div className="text-[9px] text-slate-500 uppercase">Stacking & Interstitial Voids</div>
              <div className="text-[10.5px] text-slate-200 mt-0.5">
                {activeFamilyMeta.stackingSequence}
              </div>
              <div className="text-[10px] text-indigo-300 mt-1">
                Octahedral: {activeFamilyMeta.octahedralVoidRatio} | Tetrahedral: {activeFamilyMeta.tetrahedralVoidRatio}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onFilterGridByStructure(selectedFamily)}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Highlight All {activeFamilyElements.length} {selectedFamily} Elements on Periodic Grid</span>
          </button>
        </div>

        {/* Right 7 Cols: Member Elements Matrix & Packing Factor Comparator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Member Elements Interactive Matrix */}
          <div className="bg-[#0B0F19] border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>
                    {selectedFamily} Member Elements ({activeFamilyElements.length} Elements)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Click any element below to inspect its 3D unit cell, lattice constants (a, b, c), and X-ray reflections.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {activeFamilyElements.map(el => {
                const isCurr = el.number === selectedElementZ;
                return (
                  <button
                    key={el.number}
                    type="button"
                    onClick={() => onSelectElement(el.number)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isCurr
                        ? 'bg-indigo-600/25 border-indigo-400 ring-1 ring-indigo-400/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>Z={el.number}</span>
                      <span className="text-cyan-300">{el.spaceGroup.split(' ')[0]}</span>
                    </div>
                    <div className="my-0.5 flex items-baseline justify-between">
                      <span className="text-base font-black text-white">{el.symbol}</span>
                      <span className="text-[9px] font-mono text-emerald-300">
                        {el.a.toFixed(2)}Å
                      </span>
                    </div>
                    <div className="text-[8.5px] text-slate-400 truncate">{el.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Atomic Packing Factor (APF) & Coordination Efficiency Benchmark */}
          <div className="bg-[#0B0F19] border border-slate-800/90 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atomic Packing Efficiency (APF) & Coordination Hierarchy</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Kepler Bound: π / (3√2) ≈ 74.048%
              </span>
            </div>

            <div className="space-y-2">
              {(
                [
                  { key: 'FCC', label: 'FCC (cF4, A1) & HCP (hP2, A3)', apf: 74.05, cn: 12, color: '#10b981', formula: 'π / (3√2)' },
                  { key: 'BCC', label: 'BCC (cI2, A2)', apf: 68.02, cn: 8, color: '#38bdf8', formula: 'π√3 / 8' },
                  { key: 'Monoclinic', label: 'Monoclinic α-Pu (mP16)', apf: 58.2, cn: 14, color: '#6366f1', formula: 'Low-sym 5f' },
                  { key: 'Tetragonal', label: 'Tetragonal β-Sn (tI4, A5)', apf: 53.5, cn: 6, color: '#f43f5e', formula: 'Flattened A4' },
                  { key: 'Cubic', label: 'Simple Cubic α-Po (cP1, A_h)', apf: 52.36, cn: 6, color: '#94a3b8', formula: 'π / 6' },
                  { key: 'Rhombohedral', label: 'Rhombohedral Bi/As (hR2, A7)', apf: 45.2, cn: 6, color: '#a855f7', formula: 'Peierls 3+3' },
                  { key: 'Diamond', label: 'Diamond Cubic Si/C (cF8, A4)', apf: 34.01, cn: 4, color: '#22d3ee', formula: 'π√3 / 16' }
                ] as const
              ).map(row => (
                <div key={row.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-200 font-semibold">{row.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">CN = {row.cn}</span>
                      <span className="text-slate-500">{row.formula}</span>
                      <span className="font-black text-white w-12 text-right">{row.apf}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(row.apf / 80) * 100}%`,
                        backgroundColor: row.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Allotropic Phase Transitions & P-T Polymorphism Deck */}
      <div className="bg-[#0B0F19] border border-slate-800/90 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-base font-black text-white flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-rose-400" />
              <span>Temperature & Pressure Allotropic Phase Transitions</span>
            </h4>
            <p className="text-xs text-slate-400">
              Select a polymorphic element to inspect its crystallographic phase sequence, space group changes, and molar volume jumps (ΔV/V).
            </p>
          </div>

          {/* Polymorphic Element Selector Pills */}
          <div className="flex flex-wrap gap-1.5">
            {polymorphicElements.map(el => {
              const isAct = selectedPolymorphZ === el.number;
              const count = ELEMENT_ALLOTROPES[el.number]?.length || 1;
              return (
                <button
                  key={el.number}
                  type="button"
                  onClick={() => setSelectedPolymorphZ(el.number)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isAct
                      ? 'bg-rose-500/20 border-rose-400 text-white font-black shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{el.symbol}</span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-950 text-rose-300">
                    {count} phases
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase Transition Cards for Selected Polymorphic Element */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(ELEMENT_ALLOTROPES[selectedPolymorphZ] || []).map((phase, idx) => {
            const famMeta =
              CRYSTAL_FAMILIES_METADATA[phase.crystalStructure] || CRYSTAL_FAMILIES_METADATA.FCC;
            return (
              <div
                key={phase.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                      Polymorph #{idx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${famMeta.badgeClasses}`}
                    >
                      {phase.crystalStructure} · {phase.pearsonSymbol}
                    </span>
                  </div>

                  <h5 className="text-sm font-black text-white">{phase.phaseName}</h5>
                  <div className="text-[10px] font-mono text-cyan-300">{phase.spaceGroup}</div>

                  <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-2 text-[10px] font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stability:</span>
                      <span className="text-amber-300 font-bold">{phase.tempRange}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lattice:</span>
                      <span className="text-slate-200">
                        a={phase.a.toFixed(3)}Å{phase.c ? `, c=${phase.c.toFixed(3)}Å` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Density / APF:</span>
                      <span className="text-emerald-300">
                        {phase.density.toFixed(2)} g/cm³ · {phase.apfPercent}%
                      </span>
                    </div>
                  </div>

                  <p className="text-[10.5px] text-slate-300 leading-relaxed">
                    {phase.physicalNote}
                  </p>
                </div>

                {onApplyAllotropeOverride && (
                  <button
                    type="button"
                    onClick={() => onApplyAllotropeOverride(selectedPolymorphZ, phase)}
                    className="w-full py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/35 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Inspect {phase.phaseName.split(' ')[0]} in 3D Lattice
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
