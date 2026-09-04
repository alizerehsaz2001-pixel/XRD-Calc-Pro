import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box, 
  Layers, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  Compass, 
  Grid, 
  Maximize2, 
  Rotate3d, 
  BookOpen, 
  Atom, 
  Sliders, 
  ChevronRight, 
  HelpCircle, 
  Calculator, 
  Check, 
  Copy, 
  ArrowRight,
  ExternalLink,
  Target,
  Terminal,
  Camera,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import { MillerPlanesVisualizer } from './MillerPlanesVisualizer';
import { MetallicStructuresVisualizer } from './MetallicStructuresVisualizer';
import { CrystalSystemsGallery } from './CrystalSystemsGallery';
import { PythonCrystallographyStudio } from './PythonCrystallographyStudio';
import { APFMathematicsSection } from './APFMathematicsSection';
import { Interactive3DGeometryVisualizer } from './Interactive3DGeometryVisualizer';

export type CrystalSystemId = 
  | 'cubic' 
  | 'hexagonal' 
  | 'trigonal' 
  | 'tetragonal' 
  | 'orthorhombic' 
  | 'monoclinic' 
  | 'triclinic';

export type CenteringType = 'P' | 'I' | 'F' | 'C' | 'R';

export type UnitCellsViewMode = 
  | '3d' 
  | 'miller' 
  | 'metallic' 
  | 'apf'
  | 'gallery' 
  | 'python' 
  | 'theory' 
  | 'materials' 
  | 'quiz';

export interface CrystalSystemData {
  id: CrystalSystemId;
  name: string;
  orderRank: number; // 1 = highest symmetry
  symmetryOrder: string;
  axialRelation: string;
  angleRelation: string;
  axialConditionFormula: string;
  angleConditionFormula: string;
  bravaisLattices: {
    type: CenteringType;
    name: string;
    symbol: string;
    pointsPerCell: number;
    description: string;
  }[];
  essentialSymmetry: string;
  fullSymmetryDescription: string;
  pointGroups: string[];
  spaceGroupsCount: number;
  spaceGroupRange: string;
  volumeFormula: string;
  dSpacingFormula: string;
  defaultParams: { a: number; b: number; c: number; alpha: number; beta: number; gamma: number };
  materials: {
    name: string;
    formula: string;
    latticeType: string;
    spaceGroup: string;
    category: 'Metal' | 'Ceramic' | 'Mineral' | 'Semiconductor' | 'Geological';
    description: string;
  }[];
  keyInsights: string[];
}

export const CRYSTAL_SYSTEMS_CATALOG: CrystalSystemData[] = [
  {
    id: 'cubic',
    name: 'Cubic (Isometric)',
    orderRank: 1,
    symmetryOrder: 'Highest Symmetry (Symmetry Order 48 in m-3m)',
    axialRelation: 'a = b = c',
    angleRelation: 'α = β = γ = 90°',
    axialConditionFormula: 'a = b = c',
    angleConditionFormula: '\\alpha = \\beta = \\gamma = 90^\\circ',
    bravaisLattices: [
      { type: 'P', name: 'Primitive Cubic (cP)', symbol: 'P', pointsPerCell: 1, description: 'Lattice points only at the 8 vertices. Coordination number = 6.' },
      { type: 'I', name: 'Body-Centered Cubic (cI)', symbol: 'I', pointsPerCell: 2, description: 'Points at 8 vertices + 1 central body point (½, ½, ½). Coordination number = 8.' },
      { type: 'F', name: 'Face-Centered Cubic (cF)', symbol: 'F', pointsPerCell: 4, description: 'Points at 8 vertices + 6 face centers (½, ½, 0). Coordination number = 12 (Close-packed ABCABC).' }
    ],
    essentialSymmetry: 'Four 3-fold rotation (or inversion) axes along the body diagonals ⟨111⟩',
    fullSymmetryDescription: 'The hallmark of the cubic system is NOT the 4-fold axes, but the indispensable presence of four 3-fold triad axes running along the body diagonals ⟨111⟩.',
    pointGroups: ['23 (T)', 'm-3 (Th)', '432 (O)', '-43m (Td)', 'm-3m (Oh)'],
    spaceGroupsCount: 36,
    spaceGroupRange: 'Space Groups #195 (P23) to #230 (Ia-3d)',
    volumeFormula: 'V = a^3',
    dSpacingFormula: '1/d^2 = (h^2 + k^2 + l^2) / a^2',
    defaultParams: { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 },
    materials: [
      { name: 'Copper & Aluminum', formula: 'Cu, Al, Au, Ag, Ni', latticeType: 'Face-Centered Cubic (cF)', spaceGroup: 'Fm-3m (#225)', category: 'Metal', description: 'Classic FCC close-packed metals with high electrical ductility and thermal conduction.' },
      { name: 'Alpha-Iron (Ferrite)', formula: 'α-Fe, W, Cr, Mo', latticeType: 'Body-Centered Cubic (cI)', spaceGroup: 'Im-3m (#229)', category: 'Metal', description: 'Room temperature steel phase and refractory metals with high melting points.' },
      { name: 'Halite (Rock Salt)', formula: 'NaCl', latticeType: 'Face-Centered Cubic (cF)', spaceGroup: 'Fm-3m (#225)', category: 'Ceramic', description: 'Interpenetrating FCC lattices of Na⁺ and Cl⁻ with octahedral coordination.' },
      { name: 'Diamond / Silicon', formula: 'C (diamond), Si, Ge', latticeType: 'Face-Centered Cubic (cF)', spaceGroup: 'Fd-3m (#227)', category: 'Semiconductor', description: 'Two interpenetrating FCC sublattices displaced by (¼, ¼, ¼); covalent sp³ bonding.' },
      { name: 'Strontium Titanate', formula: 'SrTiO₃', latticeType: 'Primitive Cubic (cP)', spaceGroup: 'Pm-3m (#221)', category: 'Ceramic', description: 'Archetypal cubic perovskite structure serving as standard substrate in oxide electronics.' }
    ],
    keyInsights: [
      'A cube cannot possess face-centering and body-centering simultaneously without becoming a smaller simple lattice.',
      'Cubic diffraction patterns show characteristic peak spacing ratios proportional to √(h² + k² + l²) like 1, 2, 3, 4, 5, 6, 8, etc.',
      'Selection rules for cF require unmixed h,k,l (all odd or all even); for cI require h+k+l = 2n.'
    ]
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal',
    orderRank: 2,
    symmetryOrder: 'High Symmetry (Symmetry Order 24 in 6/mmm)',
    axialRelation: 'a = b ≠ c',
    angleRelation: 'α = β = 90°, γ = 120°',
    axialConditionFormula: 'a = b \\neq c',
    angleConditionFormula: '\\alpha = \\beta = 90^\\circ, \\gamma = 120^\\circ',
    bravaisLattices: [
      { type: 'P', name: 'Primitive Hexagonal (hP)', symbol: 'P', pointsPerCell: 1, description: 'Rhomboidal prism basis with 120° angle between a and b; 1 lattice point per unit cell (3 cells per hexagonal prism).' }
    ],
    essentialSymmetry: 'Exactly one 6-fold rotation or inversion axis (6 or -6) parallel to the principal c-axis [0001]',
    fullSymmetryDescription: 'Characterized by a unique principal hexad axis (6 or 6̄) along [001]. A complete hexagonal prism is assembled from three primitive rhombic unit cells.',
    pointGroups: ['6', '-6', '6/m', '622', '6mm', '-6m2', '6/mmm'],
    spaceGroupsCount: 27,
    spaceGroupRange: 'Space Groups #168 (P6) to #194 (P6₃/mmc)',
    volumeFormula: 'V = a^2 · c · sin(60°) = (√3 / 2) · a^2 · c ≈ 0.866 · a^2 · c',
    dSpacingFormula: '1/d^2 = (4/3)·((h^2 + hk + k^2) / a^2) + (l^2 / c^2)',
    defaultParams: { a: 3.21, b: 3.21, c: 5.21, alpha: 90, beta: 90, gamma: 120 },
    materials: [
      { name: 'Graphite (2H)', formula: 'C (graphite)', latticeType: 'Primitive Hexagonal (hP)', spaceGroup: 'P6₃/mmc (#194)', category: 'Ceramic', description: 'Hexagonal graphene sheets stacked in ABAB sequence with van der Waals interlaminar gaps.' },
      { name: 'Magnesium & Zinc', formula: 'Mg, Zn, α-Ti, Zr', latticeType: 'Primitive Hexagonal (HCP)', spaceGroup: 'P6₃/mmc (#194)', category: 'Metal', description: 'Hexagonal close-packed (HCP) metals with c/a ratio close to ideal √(8/3) ≈ 1.633.' },
      { name: 'Zinc Oxide (Wurtzite)', formula: 'ZnO', latticeType: 'Primitive Hexagonal (hP)', spaceGroup: 'P6₃mc (#186)', category: 'Semiconductor', description: 'Polar piezoelectric semiconductor with non-centrosymmetric tetrahedral coordination.' },
      { name: 'Beryl (Emerald)', formula: 'Be₃Al₂Si₆O₁₈', latticeType: 'Primitive Hexagonal (hP)', spaceGroup: 'P6/mcc (#192)', category: 'Mineral', description: 'Cyclosilicate with 6-membered [Si₆O₁₈]¹²⁻ rings parallel to the basal plane.' }
    ],
    keyInsights: [
      'Hexagonal Miller indices are often written as 4-index Miller-Bravais notation (hkil) where i = -(h + k).',
      'The basal plane (0001) is perpendicular to the c-axis and exhibits isotropic 6-fold in-plane symmetry.',
      'Only the Primitive (P) Bravais lattice exists for Hexagonal because any centering collapses to a smaller hexagonal or orthorhombic cell.'
    ]
  },
  {
    id: 'trigonal',
    name: 'Trigonal / Rhombohedral',
    orderRank: 3,
    symmetryOrder: 'Intermediate-High Symmetry (Symmetry Order 12 in -3m)',
    axialRelation: 'Rhombohedral: a = b = c | Hexagonal setting: a = b ≠ c',
    angleRelation: 'Rhombohedral: α = β = γ ≠ 90° (< 120°) | Hexagonal setting: α = β = 90°, γ = 120°',
    axialConditionFormula: 'a = b = c \\quad (\\text{Rhombohedral})',
    angleConditionFormula: '\\alpha = \\beta = \\gamma \\neq 90^\\circ < 120^\\circ',
    bravaisLattices: [
      { type: 'R', name: 'Rhombohedral (hR)', symbol: 'R', pointsPerCell: 1, description: 'Primitive rhombohedron (1 lattice point). In the standard obverse hexagonal triple cell, N = 3 points.' }
    ],
    essentialSymmetry: 'Exactly one 3-fold rotation or inversion axis (3 or -3) parallel to the principal axis',
    fullSymmetryDescription: 'A single 3-fold axis (3 or 3̄). Can be indexed in primitive rhombohedral axes or using a triple hexagonal cell (obverse setting: 0,0,0; ⅔,⅓,⅓; ⅓,⅔,⅔).',
    pointGroups: ['3', '-3', '32', '3m', '-3m'],
    spaceGroupsCount: 25,
    spaceGroupRange: 'Space Groups #143 (P3) to #167 (R-3c)',
    volumeFormula: 'V = a^3 √(1 - 3cos^2α + 2cos^3α)',
    dSpacingFormula: '1/d^2 = [(h^2+k^2+l^2)sin^2α + 2(hk+kl+lh)(cos^2α - cosα)] / [a^2(1 - 3cos^2α + 2cos^3α)]',
    defaultParams: { a: 4.91, b: 4.91, c: 5.40, alpha: 90, beta: 90, gamma: 120 },
    materials: [
      { name: 'Calcite', formula: 'CaCO₃', latticeType: 'Rhombohedral (hR)', spaceGroup: 'R-3c (#167)', category: 'Mineral', description: 'Celebrated for phenomenal optical birefringence; rhombohedral cleavage along {10-14}.' },
      { name: 'Alpha-Quartz', formula: 'SiO₂', latticeType: 'Trigonal (hP)', spaceGroup: 'P3₁21 (#152) / P3₂21', category: 'Mineral', description: 'Enantiomorphic piezoelectric quartz with helical silicon-oxygen tetrahedral chains.' },
      { name: 'Corundum (Ruby / Sapphire)', formula: 'α-Al₂O₃', latticeType: 'Rhombohedral (hR)', spaceGroup: 'R-3c (#167)', category: 'Ceramic', description: 'Standard RIR reference material (I/Icorundum = 1.00) with hexagonal close-packed oxygen sublattices.' },
      { name: 'Hematite', formula: 'α-Fe₂O₃', latticeType: 'Rhombohedral (hR)', spaceGroup: 'R-3c (#167)', category: 'Mineral', description: 'Primary iron ore mineral with corundum-type structural arrangement.' }
    ],
    keyInsights: [
      'Trigonal is often grouped with Hexagonal because 18 of its 25 space groups use hexagonal Bravais lattices (P), while 7 use rhombohedral (R).',
      'In hexagonal obverse setting, allowed reflections follow -h + k + l = 3n.',
      'Corundum is the universal gold standard for Reference Intensity Ratio (RIR) quantitative phase analysis.'
    ]
  },
  {
    id: 'tetragonal',
    name: 'Tetragonal',
    orderRank: 4,
    symmetryOrder: 'Moderate-High Symmetry (Symmetry Order 16 in 4/mmm)',
    axialRelation: 'a = b ≠ c',
    angleRelation: 'α = β = γ = 90°',
    axialConditionFormula: 'a = b \\neq c',
    angleConditionFormula: '\\alpha = \\beta = \\gamma = 90^\\circ',
    bravaisLattices: [
      { type: 'P', name: 'Primitive Tetragonal (tP)', symbol: 'P', pointsPerCell: 1, description: 'Square base (a = b, 90°) elongated or compressed along the c-axis. 1 lattice point.' },
      { type: 'I', name: 'Body-Centered Tetragonal (tI)', symbol: 'I', pointsPerCell: 2, description: 'Square base with points at vertices and one body-centered point at (½, ½, ½). 2 lattice points.' }
    ],
    essentialSymmetry: 'Exactly one 4-fold rotation or inversion axis (4 or -4) parallel to the unique c-axis [001]',
    fullSymmetryDescription: 'A rectangular prism with a square base (a = b). The unique 4-fold axis along [001] enforces equality of the in-plane axes a and b and orthogonality of all angles.',
    pointGroups: ['4', '-4', '4/m', '422', '4mm', '-42m', '4/mmm'],
    spaceGroupsCount: 68,
    spaceGroupRange: 'Space Groups #75 (P4) to #142 (I4₁/acd)',
    volumeFormula: 'V = a^2 · c',
    dSpacingFormula: '1/d^2 = (h^2 + k^2) / a^2 + (l^2 / c^2)',
    defaultParams: { a: 4.59, b: 4.59, c: 2.96, alpha: 90, beta: 90, gamma: 90 },
    materials: [
      { name: 'Rutile', formula: 'TiO₂', latticeType: 'Primitive Tetragonal (tP)', spaceGroup: 'P4₂/mnm (#136)', category: 'Ceramic', description: 'Highest refractive index mineral; TiO₆ octahedra sharing edges along the c-axis.' },
      { name: 'White Tin (Beta-Sn)', formula: 'β-Sn', latticeType: 'Body-Centered Tetragonal (tI)', spaceGroup: 'I4₁/amd (#141)', category: 'Metal', description: 'Metallic room-temperature allotrope of tin; transforms to cubic grey tin (α-Sn) below 13.2°C.' },
      { name: 'Zircon', formula: 'ZrSiO₄', latticeType: 'Body-Centered Tetragonal (tI)', spaceGroup: 'I4₁/amd (#141)', category: 'Mineral', description: 'Geochronological gem mineral containing isolated [SiO₄]⁴⁻ orthosilicate units.' },
      { name: 'Cassiterite', formula: 'SnO₂', latticeType: 'Primitive Tetragonal (tP)', spaceGroup: 'P4₂/mnm (#136)', category: 'Mineral', description: 'Primary tin ore mineral isomorphic with rutile structure.' },
      { name: 'Tetragonal Zirconia (t-ZrO₂)', formula: 'ZrO₂', latticeType: 'Primitive Tetragonal (tP)', spaceGroup: 'P4₂/nmc (#137)', category: 'Ceramic', description: 'Yttria-stabilized transformation-toughened ceramic used in dental and aerospace applications.' }
    ],
    keyInsights: [
      'Face-centered tetragonal (F) and base-centered tetragonal (C) do not appear in the 14 Bravais lattices because face-centered tetragonal is mathematically equivalent to body-centered tetragonal (I) rotated by 45° with a\' = a/√2.',
      'In XRD, cubic peaks split into doublets when transitioning into tetragonal: e.g., cubic (200) splits into tetragonal (200) and (002).'
    ]
  },
  {
    id: 'orthorhombic',
    name: 'Orthorhombic',
    orderRank: 5,
    symmetryOrder: 'Moderate Symmetry (Symmetry Order 8 in mmm)',
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α = β = γ = 90°',
    axialConditionFormula: 'a \\neq b \\neq c',
    angleConditionFormula: '\\alpha = \\beta = \\gamma = 90^\\circ',
    bravaisLattices: [
      { type: 'P', name: 'Primitive Orthorhombic (oP)', symbol: 'P', pointsPerCell: 1, description: 'Lattice points only at the 8 vertices. 1 lattice point.' },
      { type: 'I', name: 'Body-Centered Orthorhombic (oI)', symbol: 'I', pointsPerCell: 2, description: 'Vertices + 1 body-centered point at (½, ½, ½). 2 lattice points.' },
      { type: 'F', name: 'Face-Centered Orthorhombic (oF)', symbol: 'F', pointsPerCell: 4, description: 'Vertices + all 6 face centers. 4 lattice points.' },
      { type: 'C', name: 'Base-Centered Orthorhombic (oC)', symbol: 'C (or A/B)', pointsPerCell: 2, description: 'Vertices + 2 face centers on one opposite pair of pinacoidal faces. 2 lattice points.' }
    ],
    essentialSymmetry: 'Three mutually perpendicular 2-fold rotation (or inversion) axes or mirror planes',
    fullSymmetryDescription: 'A rectangular brick with three unequal sides (a ≠ b ≠ c) and all right angles. The presence of three perpendicular 2-fold axes or mirror planes is mandatory.',
    pointGroups: ['222', 'mm2', 'mmm'],
    spaceGroupsCount: 59,
    spaceGroupRange: 'Space Groups #16 (P222) to #74 (Imma)',
    volumeFormula: 'V = a · b · c',
    dSpacingFormula: '1/d^2 = (h^2 / a^2) + (k^2 / b^2) + (l^2 / c^2)',
    defaultParams: { a: 4.75, b: 10.20, c: 5.98, alpha: 90, beta: 90, gamma: 90 },
    materials: [
      { name: 'Forsterite (Olivine)', formula: 'Mg₂SiO₄', latticeType: 'Primitive Orthorhombic (oP)', spaceGroup: 'Pbnm / Pnma (#62)', category: 'Geological', description: 'Dominant mineral phase of the Earth\'s upper mantle with isolated [SiO₄] silicate tetrahedra.' },
      { name: 'Aragonite', formula: 'CaCO₃', latticeType: 'Primitive Orthorhombic (oP)', spaceGroup: 'Pnma (#62)', category: 'Mineral', description: 'High-pressure polymorph of calcium carbonate forming the pearly nacre of seashells.' },
      { name: 'Barite', formula: 'BaSO₄', latticeType: 'Primitive Orthorhombic (oP)', spaceGroup: 'Pnma (#62)', category: 'Mineral', description: 'Extremely dense non-metallic sulfate mineral used as drilling fluid weighting agent.' },
      { name: 'Alpha-Sulfur', formula: 'S₈', latticeType: 'Face-Centered Orthorhombic (oF)', spaceGroup: 'Fddd (#70)', category: 'Mineral', description: 'Puckered crown-shaped S₈ rings packed in face-centered orthorhombic lattice.' },
      { name: 'Cementite', formula: 'Fe₃C', latticeType: 'Primitive Orthorhombic (oP)', spaceGroup: 'Pnma (#62)', category: 'Ceramic', description: 'Hard, brittle iron carbide intermetallic precipitate crucial to carbon steel microstructures.' }
    ],
    keyInsights: [
      'Orthorhombic is the ONLY crystal system that displays all four possible Bravais centering types: P, I, F, and C (total 4 lattices).',
      'The three axes a, b, c can be chosen in 6 different permutations, leading to different standard settings (e.g. Pnma vs. Pbnm).',
      'Peak splitting: As symmetry lowers from cubic to orthorhombic, cubic {200} splits into three distinct reflections: (200), (020), and (002).'
    ]
  },
  {
    id: 'monoclinic',
    name: 'Monoclinic',
    orderRank: 6,
    symmetryOrder: 'Low Symmetry (Symmetry Order 4 in 2/m)',
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α = γ = 90°, β ≠ 90° (> 90° by convention)',
    axialConditionFormula: 'a \\neq b \\neq c',
    angleConditionFormula: '\\alpha = \\gamma = 90^\\circ, \\beta \\neq 90^\\circ',
    bravaisLattices: [
      { type: 'P', name: 'Primitive Monoclinic (mP)', symbol: 'P', pointsPerCell: 1, description: 'Lattice points only at the 8 vertices. 1 lattice point.' },
      { type: 'C', name: 'Base-Centered Monoclinic (mC)', symbol: 'C', pointsPerCell: 2, description: 'Vertices + 2 face centers on the (001) or (100) faces. 2 lattice points.' }
    ],
    essentialSymmetry: 'Exactly one 2-fold rotation axis or one mirror plane perpendicular to the 2-fold axis',
    fullSymmetryDescription: 'A prism with a parallelogram base. Standard crystallographic convention assigns the unique 2-fold axis or mirror plane normal to the b-axis (unique axis b setting).',
    pointGroups: ['2', 'm', '2/m'],
    spaceGroupsCount: 13,
    spaceGroupRange: 'Space Groups #3 (P2) to #15 (C2/c)',
    volumeFormula: 'V = a · b · c · sin(β)',
    dSpacingFormula: '1/d^2 = (1 / sin^2β) · [ (h^2 / a^2) + (k^2·sin^2β / b^2) + (l^2 / c^2) - (2hl·cosβ / (a·c)) ]',
    defaultParams: { a: 5.68, b: 15.18, c: 6.29, alpha: 90, beta: 113.8, gamma: 90 },
    materials: [
      { name: 'Gypsum', formula: 'CaSO₄ · 2H₂O', latticeType: 'Base-Centered Monoclinic (mC)', spaceGroup: 'C2/c (#15)', category: 'Mineral', description: 'Sheet calcium sulfate dihydrate with interlayer water molecules bound by hydrogen bonds.' },
      { name: 'Orthoclase (K-Feldspar)', formula: 'KAlSi₃O₈', latticeType: 'Base-Centered Monoclinic (mC)', spaceGroup: 'C2/m (#12)', category: 'Mineral', description: 'Essential rock-forming tectosilicate of granitic continental crust.' },
      { name: 'Malachite', formula: 'Cu₂CO₃(OH)₂', latticeType: 'Primitive Monoclinic (mP)', spaceGroup: 'P2₁/a (#14)', category: 'Mineral', description: 'Vibrant green basic copper carbonate ore mineral.' },
      { name: 'Monoclinic Zirconia (Baddeleyite)', formula: 'm-ZrO₂', latticeType: 'Primitive Monoclinic (mP)', spaceGroup: 'P2₁/c (#14)', category: 'Ceramic', description: 'Room temperature thermodynamic ground state of pure zirconium dioxide.' },
      { name: 'Clinopyroxene (Diopside)', formula: 'CaMgSi₂O₆', latticeType: 'Base-Centered Monoclinic (mC)', spaceGroup: 'C2/c (#15)', category: 'Mineral', description: 'Single-chain inosilicate forming extensive solid solutions in metamorphic rocks.' }
    ],
    keyInsights: [
      'The non-orthogonal angle β produces a cross-term (-2hl cosβ / ac) in the d-spacing formula, causing reflections (hkl) and (h̄kl) to have different d-spacings.',
      'Monoclinic contains space group P2₁/c (#14), statistically the most common space group in organic small-molecule crystallography (>30% of all molecular crystals).',
      'Body-centered monoclinic (I) can always be transformed into a base-centered monoclinic (C) cell by choosing alternative lattice vectors.'
    ]
  },
  {
    id: 'triclinic',
    name: 'Triclinic (Anorthic)',
    orderRank: 7,
    symmetryOrder: 'Lowest Symmetry (Symmetry Order 2 in -1)',
    axialRelation: 'a ≠ b ≠ c',
    angleRelation: 'α ≠ β ≠ γ ≠ 90°',
    axialConditionFormula: 'a \\neq b \\neq c',
    angleConditionFormula: '\\alpha \\neq \\beta \\neq \\gamma \\neq 90^\\circ',
    bravaisLattices: [
      { type: 'P', name: 'Primitive Triclinic (aP)', symbol: 'P', pointsPerCell: 1, description: 'Lattice points only at the 8 vertices. 1 lattice point. Lowest possible spatial symmetry.' }
    ],
    essentialSymmetry: 'None other than Identity (1) or Inversion Center (-1)',
    fullSymmetryDescription: 'A completely skewed parallelepiped. Possesses no rotational axes or mirror planes whatsoever. The only possible symmetry operation is the center of inversion (1̄).',
    pointGroups: ['1 (C1)', '-1 (Ci)'],
    spaceGroupsCount: 2,
    spaceGroupRange: 'Space Groups #1 (P1) and #2 (P-1)',
    volumeFormula: 'V = abc √(1 - cos^2α - cos^2β - cos^2γ + 2cosα·cosβ·cosγ)',
    dSpacingFormula: '1/d^2 = h^T · G* · h (Full 3x3 Reciprocal Metric Tensor Inverse)',
    defaultParams: { a: 8.14, b: 12.78, c: 7.16, alpha: 94.3, beta: 116.6, gamma: 87.7 },
    materials: [
      { name: 'Albite (Plagioclase Feldspar)', formula: 'NaAlSi₃O₈', latticeType: 'Primitive Triclinic (aP)', spaceGroup: 'P-1 (#2) or C-1', category: 'Mineral', description: 'Endmember of the plagioclase series forming polysynthetic albite twinning.' },
      { name: 'Turquoise', formula: 'CuAl₆(PO₄)₄(OH)₈ · 4H₂O', latticeType: 'Primitive Triclinic (aP)', spaceGroup: 'P-1 (#2)', category: 'Mineral', description: 'Hydrated copper aluminum phosphate gemstone formed in arid weathered zones.' },
      { name: 'Kaolinite', formula: 'Al₂Si₂O₅(OH)₄', latticeType: 'Primitive Triclinic (aP)', spaceGroup: 'P1 (#1)', category: 'Mineral', description: '1:1 dioctahedral layered clay mineral utilized widely in fine ceramics and paper coatings.' },
      { name: 'Kyanite', formula: 'Al₂SiO₅', latticeType: 'Primitive Triclinic (aP)', spaceGroup: 'P-1 (#2)', category: 'Mineral', description: 'High-pressure metamorphic indicator mineral with anisotropic Mohs hardness.' },
      { name: 'Chalcanthite', formula: 'CuSO₄ · 5H₂O', latticeType: 'Primitive Triclinic (aP)', spaceGroup: 'P-1 (#2)', category: 'Mineral', description: 'Water-soluble copper sulfate pentahydrate with distorted octahedral coordination.' }
    ],
    keyInsights: [
      'Triclinic requires calculating the full 3x3 reciprocal metric tensor G* because all 6 metric tensor elements are unconstrained non-zero parameters.',
      'No centering exists for Triclinic: any centered cell (I, F, C) can be reduced to a smaller primitive cell with the same lack of symmetry.',
      'Space group P1 (#1) is the only space group with no symmetry operations whatsoever besides identity (E).'
    ]
  }
];

export const UnitCellsSection: React.FC = () => {
  const [selectedSystemId, setSelectedSystemId] = useState<CrystalSystemId>('cubic');
  const [activeCentering, setActiveCentering] = useState<CenteringType>('P');
  const [viewMode, setViewMode] = useState<UnitCellsViewMode>('3d');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const activeSystem = useMemo(() => {
    return CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === selectedSystemId) || CRYSTAL_SYSTEMS_CATALOG[0];
  }, [selectedSystemId]);

  // Adjust default centering when system changes
  const handleSelectSystem = (id: CrystalSystemId) => {
    playSynthTone('tick');
    setSelectedSystemId(id);
    const sys = CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === id);
    if (sys && !sys.bravaisLattices.some(b => b.type === activeCentering)) {
      setActiveCentering(sys.bravaisLattices[0].type);
    }
  };

  // Quiz questions
  const quizQuestions = [
    {
      question: "Which of the following defines the indispensable symmetry requirement of the Cubic crystal system?",
      options: [
        "Three mutually perpendicular 4-fold rotation axes",
        "Four 3-fold rotation or inversion axes along ⟨111⟩ body diagonals",
        "A single 6-fold rotation axis along the c-axis",
        "Equality of axial lengths a = b = c with arbitrary interaxial angles"
      ],
      correct: 1,
      explanation: "The hallmark of the cubic system is the presence of four 3-fold triad axes running along the body diagonals ⟨111⟩. Many people mistakenly think it is the 4-fold axes, but lowest-symmetry cubic crystals (like space group P23) lack 4-fold axes entirely!"
    },
    {
      question: "Why does the Tetragonal system only have 2 Bravais lattices (P and I) instead of 4 like Orthorhombic?",
      options: [
        "Face-centered tetragonal is physically impossible due to atomic overlap",
        "Face-centered tetragonal (F) is mathematically equivalent to a smaller Body-centered tetragonal (I) cell rotated by 45°",
        "Centering would violate the orthogonality of α = β = γ = 90°",
        "Tetragonal crystals cannot accommodate atoms on basal faces"
      ],
      correct: 1,
      explanation: "Auguste Bravais demonstrated in 1848 that a face-centered tetragonal (tF) unit cell can always be re-described as a smaller body-centered tetragonal (tI) unit cell rotated by 45° around the c-axis with a' = a/√2. Thus, tF is redundant."
    },
    {
      question: "Which single crystal system features all four possible Bravais centering modes (Primitive P, Body-Centered I, Face-Centered F, and Base-Centered C)?",
      options: [
        "Cubic",
        "Hexagonal",
        "Orthorhombic",
        "Monoclinic"
      ],
      correct: 2,
      explanation: "Orthorhombic is the only crystal system that exhibits all 4 Bravais centering types: oP, oI, oF, and oC (or oA/oB). Combined with the other systems, this makes up the 14 Bravais lattices."
    },
    {
      question: "How many net lattice points belong exclusively to a single Face-Centered Cubic (FCC / cF) unit cell?",
      options: [
        "1 point",
        "2 points",
        "4 points",
        "14 points"
      ],
      correct: 2,
      explanation: "A face-centered cell has 8 corner atoms (each shared by 8 adjacent cells: 8 × ⅛ = 1) plus 6 face-centered atoms (each shared by 2 adjacent cells: 6 × ½ = 3), totaling 1 + 3 = 4 net lattice points per unit cell."
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Textbook Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-4 opacity-5 pointer-events-none">
          <Box className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Fundamentals of Crystallography • Chapter 1
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Textbook Standard Reference
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              14 Bravais Lattices & 7 Systems
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Unit Cells & Crystal Systems
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            The fundamental architecture of solid-state matter. Discover how infinite three-dimensional crystal periodicity is completely described by translational basis vectors, axial parameters, centering symmetry operators, and the 7 canonical crystal systems.
          </p>

          <div className="flex items-center gap-2 pt-2 flex-wrap text-xs">
            <button
              onClick={() => { playSynthTone('tick'); setViewMode('3d'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === '3d'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <Rotate3d className="w-4 h-4 text-cyan-400" />
              <span>Interactive 3D Geometry</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('miller'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'miller'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Miller Planes (hkl)</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('metallic'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'metallic'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <Atom className="w-4 h-4 text-rose-400" />
              <span>Metallic (BCC/FCC/HCP)</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('apf'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'apf'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800/80 text-emerald-300 hover:bg-slate-700/80 border border-emerald-500/30'
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>APF Exact Math Formulas</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('gallery'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <Grid className="w-4 h-4 text-amber-400" />
              <span>7 Systems & Minerals</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('python'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'python'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800/80 text-purple-300 hover:bg-slate-700/80 border border-purple-500/30'
              }`}
            >
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Python (Matplotlib/OpenCV)</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('theory'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'theory'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Theory Breakdown</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('materials'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'materials'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Material Catalog</span>
            </button>

            <button
              onClick={() => { playSynthTone('tick'); setViewMode('quiz'); }}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'quiz'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <span>Knowledge Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Crystal System Selector Navigation Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-indigo-400" />
            The 7 Crystal Systems (Arranged by Symmetry Level)
          </span>
          <span className="text-[11px] font-mono text-indigo-400 font-semibold">
            Rank #{activeSystem.orderRank}: {activeSystem.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {CRYSTAL_SYSTEMS_CATALOG.map((sys) => {
            const isSelected = sys.id === selectedSystemId;
            return (
              <button
                key={sys.id}
                onClick={() => handleSelectSystem(sys.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                      #{sys.orderRank}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300">
                      {sys.bravaisLattices.length} BL
                    </span>
                  </div>
                  <div className="text-xs font-extrabold truncate text-slate-200">
                    {sys.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                    {sys.axialRelation}
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="crystalSystemUnderline"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: INTERACTIVE 3D & 2D PROJECTION VIEWER */}
      {viewMode === '3d' && (
        <Interactive3DGeometryVisualizer
          selectedSystemId={selectedSystemId}
          onSelectSystem={handleSelectSystem}
          activeCentering={activeCentering}
          setActiveCentering={setActiveCentering}
        />
      )}

      {/* TAB: MILLER PLANES VISUALIZER (IMAGE 1) */}
      {viewMode === 'miller' && <MillerPlanesVisualizer />}

      {/* TAB: METALLIC STRUCTURES BCC, FCC, HCP (IMAGE 3) */}
      {viewMode === 'metallic' && <MetallicStructuresVisualizer />}

      {/* TAB: APF WITH EXACT MATHEMATICS FORMULA */}
      {viewMode === 'apf' && <APFMathematicsSection />}

      {/* TAB: 7 CRYSTAL SYSTEMS GALLERY & MINERAL SPECIMENS (IMAGE 2) */}
      {viewMode === 'gallery' && <CrystalSystemsGallery />}

      {/* TAB: PYTHON MATPLOTLIB & OPENCV CRYSTALLOGRAPHY STUDIO */}
      {viewMode === 'python' && <PythonCrystallographyStudio />}

      {/* TAB: COMPREHENSIVE TEXTBOOK THEORY & BREAKDOWN */}
      {viewMode === 'theory' && (
        <div className="space-y-8">
          
          {/* Section 1: Introduction to Unit Cells */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
                Section 1.1 • Theoretical Foundation
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                The Unit Cell Concept & Spatial Periodicity
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm text-slate-300 leading-relaxed font-normal">
              <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                  <Box className="w-4 h-4 text-indigo-400" />
                  <span>1. Formal Definition</span>
                </h4>
                <p>
                  A <strong className="text-indigo-300">unit cell</strong> is the smallest repeating volume of a crystal lattice that, when tessellated in three dimensions by translational displacement vectors:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-xs text-indigo-300 border border-slate-800">
                  T = u·a + v·b + w·c (u,v,w ∈ ℤ)
                </div>
                <p className="text-xs text-slate-400">
                  ...completely fills all of 3D space without gaps, voids, or overlaps while exhibiting the full macroscopic symmetry of the material.
                </p>
              </div>

              <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>2. Lattice Parameters</span>
                </h4>
                <p>
                  A unit cell is fully characterized by <strong className="text-cyan-300">6 independent scalar lattice parameters</strong>:
                </p>
                <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-200">Axial lengths:</strong> <code className="text-rose-300">a, b, c</code> (Ångströms or pm).</li>
                  <li><strong className="text-slate-200">Interaxial angles:</strong></li>
                  <li className="pl-4"><code className="text-amber-300">α</code>: angle between b and c</li>
                  <li className="pl-4"><code className="text-amber-300">β</code>: angle between a and c</li>
                  <li className="pl-4"><code className="text-amber-300">γ</code>: angle between a and b</li>
                </ul>
              </div>

              <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>3. Lattice + Basis = Structure</span>
                </h4>
                <p>
                  It is vital to distinguish between a mathematical lattice and a physical crystal structure:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-xs text-emerald-300 border border-slate-800">
                  Crystal = Space Lattice ⊕ Basis (Motif)
                </div>
                <p className="text-xs text-slate-400">
                  The <em>lattice</em> is purely an array of points in space; the <em>basis</em> is the group of atoms (1, 2, or thousands) attached identically to each lattice point.
                </p>
              </div>
            </div>

            {/* Primitive vs Non-Primitive Sub-card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-400" />
                <span>Primitive (P) versus Non-Primitive / Centered (I, F, C, R) Unit Cells</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-indigo-400 text-sm">Primitive (P)</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">N = 1 pt</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Lattice points reside <strong className="text-slate-200">only at the 8 vertices</strong>. Each corner is shared by 8 adjacent cells:
                  </p>
                  <div className="font-mono text-indigo-300 bg-slate-950 p-1.5 rounded text-center">
                    8 × (⅛) = 1 net point
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-400 text-sm">Body-Centered (I)</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">N = 2 pts</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Points at 8 vertices + <strong className="text-slate-200">1 central point</strong> at (½, ½, ½) entirely contained in the cell:
                  </p>
                  <div className="font-mono text-rose-300 bg-slate-950 p-1.5 rounded text-center">
                    [8 × (⅛)] + 1 = 2 net points
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-400 text-sm">Face-Centered (F)</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">N = 4 pts</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Points at 8 vertices + <strong className="text-slate-200">6 face centers</strong>. Each face atom is shared by 2 adjoining cells:
                  </p>
                  <div className="font-mono text-cyan-300 bg-slate-950 p-1.5 rounded text-center">
                    [8 × (⅛)] + [6 × (½)] = 4 net points
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400 text-sm">Base-Centered (C)</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">N = 2 pts</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Points at 8 vertices + <strong className="text-slate-200">2 face centers</strong> on one pair of parallel pinacoidal faces:
                  </p>
                  <div className="font-mono text-emerald-300 bg-slate-950 p-1.5 rounded text-center">
                    [8 × (⅛)] + [2 × (½)] = 2 net points
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Why Conventional over Primitive?</strong> In crystallography, we intentionally choose centered non-primitive cells (e.g., FCC instead of the smaller rhombohedral primitive cell) because the conventional cubic cell directly mirrors the full orthogonal 48-fold rotational/mirror symmetry of the macro crystal.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Comprehensive 7 Crystal Systems Master Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
                  Section 1.2 • Master Comparison
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                  The 7 Crystal Systems & 14 Bravais Lattices
                </h2>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
                Total 14 Bravais Lattices
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-normal">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">System (Order)</th>
                    <th className="p-3.5">Axial Conditions</th>
                    <th className="p-3.5">Angle Conditions</th>
                    <th className="p-3.5">Bravais Lattices</th>
                    <th className="p-3.5">Key Characteristic Symmetry</th>
                    <th className="p-3.5">Example Material</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {CRYSTAL_SYSTEMS_CATALOG.map((sys) => {
                    const isSelected = sys.id === selectedSystemId;
                    return (
                      <tr 
                        key={sys.id}
                        onClick={() => handleSelectSystem(sys.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-950/40 text-white font-bold' : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="p-3.5 font-sans font-bold flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                          <span>{sys.name}</span>
                        </td>
                        <td className="p-3.5 text-indigo-300">{sys.axialRelation}</td>
                        <td className="p-3.5 text-cyan-300">{sys.angleRelation}</td>
                        <td className="p-3.5 font-bold text-amber-300">
                          {sys.bravaisLattices.map(b => b.type).join(', ')} ({sys.bravaisLattices.length})
                        </td>
                        <td className="p-3.5 text-slate-300 font-sans text-xs max-w-xs">
                          {sys.essentialSymmetry}
                        </td>
                        <td className="p-3.5 text-emerald-400 font-sans">
                          {sys.materials[0].formula} ({sys.materials[0].name.split(' ')[0]})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center flex-wrap gap-4 text-xs text-slate-400">
              <div>
                <strong className="text-white">Why exactly 14 Bravais Lattices?</strong> In 1848, French physicist Auguste Bravais mathematically proved that all possible translational symmetries in 3D Euclidean space reduce to exactly 14 unique lattices. Any additional centering mode is redundant because it can be transformed into one of these 14.
              </div>
              <div className="flex gap-3 text-slate-300 font-mono text-[11px]">
                <span>Cubic: 3</span>
                <span>Tetragonal: 2</span>
                <span>Orthorhombic: 4</span>
                <span>Hexagonal: 1</span>
                <span>Trigonal: 1</span>
                <span>Monoclinic: 2</span>
                <span>Triclinic: 1</span>
              </div>
            </div>
          </div>

          {/* Section 1.4: Atomic Packing Factor Theory & Mathematical Limit */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                  Section 1.4 • Quantitative Packing Metrics
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                  Atomic Packing Factor (APF) Mathematical Theory
                </h2>
              </div>
              <button
                onClick={() => { playSynthTone('tick'); setViewMode('apf'); }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Calculator className="w-4 h-4" />
                <span>Open Interactive APF Solver</span>
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              The <strong>Atomic Packing Factor (APF)</strong> is defined as the ratio between the total volume occupied by rigid spherical constituent atoms and the total geometric volume of the enclosing unit cell:
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center font-mono text-emerald-400 font-bold text-sm sm:text-base">
              APF = (V_atoms) / (V_cell) = [N_net · (4/3)πR³] / V_cell
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-indigo-400 font-bold block text-sm">BCC Structure</span>
                <div className="text-slate-300">Touch line: 4R = a√3</div>
                <div className="text-amber-400 font-bold">APF = (π√3) / 8 ≈ 68.02%</div>
                <div className="text-slate-400 text-[11px]">Void fraction: 31.98%</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-emerald-400 font-bold block text-sm">FCC Structure</span>
                <div className="text-slate-300">Touch line: 4R = a√2</div>
                <div className="text-amber-400 font-bold">APF = (π√2) / 6 ≈ 74.05%</div>
                <div className="text-slate-400 text-[11px]">Kepler Upper Bound (Max 3D Packing)</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-rose-400 font-bold block text-sm">HCP Structure</span>
                <div className="text-slate-300">Ideal c/a = √(8/3) ≈ 1.633</div>
                <div className="text-amber-400 font-bold">APF = (π√2) / 6 ≈ 74.05%</div>
                <div className="text-slate-400 text-[11px]">Identical packing to FCC (ABAB stacking)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REAL-WORLD MATERIALS & MINERALOGICAL EXAMPLES */}
      {viewMode === 'materials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                Materials Science in the Laboratory
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                Real-World Materials for {activeSystem.name}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Showing {activeSystem.materials.length} reference mineral & alloy structures
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeSystem.materials.map((mat, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {mat.category}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">
                      {mat.spaceGroup}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{mat.name}</h3>
                    <div className="text-sm font-mono font-bold text-emerald-400">{mat.formula}</div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {mat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Lattice: {mat.latticeType}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Key Insights Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Key Crystallographic Insights for {activeSystem.name}</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {activeSystem.keyInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: KNOWLEDGE CHECK QUIZ */}
      {viewMode === 'quiz' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl max-w-4xl mx-auto">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">
                Interactive Pedagogical Assessment
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                Unit Cells & Crystal Systems Quiz
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">4 Concept Questions</span>
          </div>

          <div className="space-y-6">
            {quizQuestions.map((q, qIdx) => {
              const selectedOpt = quizAnswers[qIdx];
              const isCorrect = selectedOpt === q.correct;

              return (
                <div key={qIdx} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-mono shrink-0">
                      {qIdx + 1}
                    </span>
                    <span>{q.question}</span>
                  </h3>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60';

                      if (quizSubmitted) {
                        if (optIdx === q.correct) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isOptionSelected) {
                          btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                        }
                      } else if (isOptionSelected) {
                        btnStyle = 'bg-indigo-600/30 border-indigo-500 text-white font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => {
                            playSynthTone('tick');
                            setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && optIdx === q.correct && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                      isCorrect ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                    }`}>
                      <p><strong>{isCorrect ? 'Correct! ' : 'Incorrect. '}</strong>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            {!quizSubmitted ? (
              <button
                disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                onClick={() => {
                  playSynthTone('chime');
                  setQuizSubmitted(true);
                }}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  Object.keys(quizAnswers).length === quizQuestions.length
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Submit & Check Explanations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-300">
                  Score: {Object.entries(quizAnswers).filter(([k, v]) => v === quizQuestions[parseInt(k)].correct).length} / {quizQuestions.length} Correct
                </span>
                <button
                  onClick={() => {
                    playSynthTone('tick');
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                >
                  Reset Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
