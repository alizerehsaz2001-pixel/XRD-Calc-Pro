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
  ShieldCheck,
  Plus
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';
import { MillerPlanesVisualizer } from './MillerPlanesVisualizer';
import { MetallicStructuresVisualizer } from './MetallicStructuresVisualizer';
import { CrystalSystemsGallery } from './CrystalSystemsGallery';
import { PythonCrystallographyStudio } from './PythonCrystallographyStudio';
import { APFMathematicsSection } from './APFMathematicsSection';
import { Interactive3DGeometryVisualizer } from './Interactive3DGeometryVisualizer';
import { StereographicWulffExplorer } from './StereographicWulffExplorer';
import {
  CrystalSystemMiniSchematic,
  BravaisCenteringSchematic,
  UnitCellHeroSchematic
} from './UnitCellGraphics';

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
  | 'stereo'
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

export const BRAVAIS_14_CATALOG: {
  pearson: string;
  systemId: CrystalSystemId;
  centering: CenteringType;
  label: string;
  Z: number;
  extinctionRule: string;
}[] = [
  { pearson: 'cP', systemId: 'cubic', centering: 'P', label: 'Simple Cubic', Z: 1, extinctionRule: 'All h,k,l' },
  { pearson: 'cI', systemId: 'cubic', centering: 'I', label: 'Body-Centered Cubic', Z: 2, extinctionRule: 'h+k+l = 2n' },
  { pearson: 'cF', systemId: 'cubic', centering: 'F', label: 'Face-Centered Cubic', Z: 4, extinctionRule: 'h,k,l unmixed' },
  { pearson: 'hP', systemId: 'hexagonal', centering: 'P', label: 'Hexagonal Primitive', Z: 1, extinctionRule: 'All h,k,l' },
  { pearson: 'hR', systemId: 'trigonal', centering: 'R', label: 'Rhombohedral', Z: 3, extinctionRule: '-h+k+l = 3n (Obv)' },
  { pearson: 'tP', systemId: 'tetragonal', centering: 'P', label: 'Tetragonal Primitive', Z: 1, extinctionRule: 'All h,k,l' },
  { pearson: 'tI', systemId: 'tetragonal', centering: 'I', label: 'Tetragonal Body-Centered', Z: 2, extinctionRule: 'h+k+l = 2n' },
  { pearson: 'oP', systemId: 'orthorhombic', centering: 'P', label: 'Orthorhombic Primitive', Z: 1, extinctionRule: 'All h,k,l' },
  { pearson: 'oI', systemId: 'orthorhombic', centering: 'I', label: 'Orthorhombic Body-Centered', Z: 2, extinctionRule: 'h+k+l = 2n' },
  { pearson: 'oF', systemId: 'orthorhombic', centering: 'F', label: 'Orthorhombic Face-Centered', Z: 4, extinctionRule: 'h,k,l unmixed' },
  { pearson: 'oC', systemId: 'orthorhombic', centering: 'C', label: 'Orthorhombic Base-Centered', Z: 2, extinctionRule: 'h+k = 2n' },
  { pearson: 'mP', systemId: 'monoclinic', centering: 'P', label: 'Monoclinic Primitive', Z: 1, extinctionRule: 'All h,k,l' },
  { pearson: 'mC', systemId: 'monoclinic', centering: 'C', label: 'Monoclinic Base-Centered', Z: 2, extinctionRule: 'h+k = 2n' },
  { pearson: 'aP', systemId: 'triclinic', centering: 'P', label: 'Triclinic Primitive', Z: 1, extinctionRule: 'All h,k,l' },
];

export const UnitCellsSection: React.FC = () => {
  const [selectedSystemId, setSelectedSystemId] = useState<CrystalSystemId>('cubic');
  const [activeCentering, setActiveCentering] = useState<CenteringType>('P');
  const [viewMode, setViewMode] = useState<UnitCellsViewMode>('3d');
  const [showAll14Matrix, setShowAll14Matrix] = useState<boolean>(false);

  // Materials filter state
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<'All' | 'Metal' | 'Ceramic' | 'Mineral' | 'Semiconductor' | 'Geological'>('All');
  const [showAllSystemsMaterials, setShowAllSystemsMaterials] = useState<boolean>(false);

  // Symmetry-lowering family selector in Theory tab
  const [selectedSplittingFamily, setSelectedSplittingFamily] = useState<'200' | '110' | '111'>('200');

  // Interactive Metric Tensor (G_ij & G^ij) Calculator State
  const [mtA, setMtA] = useState<number>(4.913);
  const [mtB, setMtB] = useState<number>(4.913);
  const [mtC, setMtC] = useState<number>(5.405);
  const [mtAlpha, setMtAlpha] = useState<number>(90);
  const [mtBeta, setMtBeta] = useState<number>(90);
  const [mtGamma, setMtGamma] = useState<number>(120);
  const [mtHkl1, setMtHkl1] = useState<[number, number, number]>([1, 0, 1]);
  const [mtHkl2, setMtHkl2] = useState<[number, number, number]>([1, 1, 0]);
  const [mtUvw, setMtUvw] = useState<[number, number, number]>([1, 1, 1]);

  // Custom Crystal Material Synthesizer State
  interface CustomMaterialEntry {
    name: string;
    formula: string;
    systemId: CrystalSystemId;
    systemName: string;
    centering: CenteringType;
    latticeType: string;
    spaceGroup: string;
    category: 'Metal' | 'Ceramic' | 'Mineral' | 'Semiconductor' | 'Geological';
    description: string;
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
    molarMass: number;
    zUnits: number;
    volumeA3: number;
    densityGcm3: number;
    computedPeaks: { x: number; h: number; label: string; twoTheta: number; dA: number; color: string }[];
    isCustom: true;
  }

  const [customMaterials, setCustomMaterials] = useState<CustomMaterialEntry[]>([]);
  const [showCustomMatModal, setShowCustomMatModal] = useState<boolean>(false);
  const [cmName, setCmName] = useState<string>('Barium Titanate (Tetragonal)');
  const [cmFormula, setCmFormula] = useState<string>('BaTiO₃');
  const [cmCategory, setCmCategory] = useState<'Metal' | 'Ceramic' | 'Mineral' | 'Semiconductor' | 'Geological'>('Ceramic');
  const [cmSystemId, setCmSystemId] = useState<CrystalSystemId>('tetragonal');
  const [cmCentering, setCmCentering] = useState<CenteringType>('P');
  const [cmSpaceGroup, setCmSpaceGroup] = useState<string>('P4mm (#99)');
  const [cmA, setCmA] = useState<number>(3.994);
  const [cmB, setCmB] = useState<number>(3.994);
  const [cmC, setCmC] = useState<number>(4.038);
  const [cmAlpha, setCmAlpha] = useState<number>(90);
  const [cmBeta, setCmBeta] = useState<number>(90);
  const [cmGamma, setCmGamma] = useState<number>(90);
  const [cmMolarMass, setCmMolarMass] = useState<number>(233.19);
  const [cmZ, setCmZ] = useState<number>(1);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const activeSystem = useMemo(() => {
    return CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === selectedSystemId) || CRYSTAL_SYSTEMS_CATALOG[0];
  }, [selectedSystemId]);

  const activePearsonSymbol = useMemo(() => {
    const match = BRAVAIS_14_CATALOG.find(
      b => b.systemId === selectedSystemId && b.centering === activeCentering
    );
    return match?.pearson || 'cP';
  }, [selectedSystemId, activeCentering]);

  // Analytical 3x3 Metric Tensor Engine (Direct G_ij & Reciprocal G^ij)
  const computeMetricTensorData = (
    a: number,
    b: number,
    c: number,
    alphaDeg: number,
    betaDeg: number,
    gammaDeg: number
  ) => {
    const deg2rad = Math.PI / 180;
    const al = alphaDeg * deg2rad;
    const be = betaDeg * deg2rad;
    const ga = gammaDeg * deg2rad;

    const cosA = Math.cos(al);
    const cosB = Math.cos(be);
    const cosG = Math.cos(ga);

    const g11 = a * a;
    const g22 = b * b;
    const g33 = c * c;
    const g12 = a * b * cosG;
    const g13 = a * c * cosB;
    const g23 = b * c * cosA;

    const G: number[][] = [
      [g11, g12, g13],
      [g12, g22, g23],
      [g13, g23, g33],
    ];

    // Volume squared V^2 = det(G)
    const vSq = Math.max(
      1e-6,
      a * a * b * b * c * c * (1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG)
    );
    const V = Math.sqrt(vSq);

    // Cofactor inverse G^ij = G_ij^-1
    const c11 = (g22 * g33 - g23 * g23) / vSq;
    const c22 = (g11 * g33 - g13 * g13) / vSq;
    const c33 = (g11 * g22 - g12 * g12) / vSq;
    const c12 = (g13 * g23 - g12 * g33) / vSq;
    const c13 = (g12 * g23 - g13 * g22) / vSq;
    const c23 = (g13 * g12 - g11 * g23) / vSq;

    const Ginv: number[][] = [
      [c11, c12, c13],
      [c12, c22, c23],
      [c13, c23, c33],
    ];

    const aStar = Math.sqrt(Math.max(1e-9, c11));
    const bStar = Math.sqrt(Math.max(1e-9, c22));
    const cStar = Math.sqrt(Math.max(1e-9, c33));

    const alphaStar = (Math.acos(Math.max(-1, Math.min(1, c23 / (bStar * cStar)))) * 180) / Math.PI;
    const betaStar = (Math.acos(Math.max(-1, Math.min(1, c13 / (aStar * cStar)))) * 180) / Math.PI;
    const gammaStar = (Math.acos(Math.max(-1, Math.min(1, c12 / (aStar * bStar)))) * 180) / Math.PI;

    return { G, Ginv, V, vSq, aStar, bStar, cStar, alphaStar, betaStar, gammaStar };
  };

  // Live Metric Tensor Results for Theory Tab
  const liveMetricCalc = useMemo(() => {
    const tensor = computeMetricTensorData(mtA, mtB, mtC, mtAlpha, mtBeta, mtGamma);
    const { G, Ginv } = tensor;

    const invDSq = (hkl: [number, number, number]) => {
      const [h, k, l] = hkl;
      return (
        h * h * Ginv[0][0] +
        k * k * Ginv[1][1] +
        l * l * Ginv[2][2] +
        2 * h * k * Ginv[0][1] +
        2 * h * l * Ginv[0][2] +
        2 * k * l * Ginv[1][2]
      );
    };

    const g1Sq = Math.max(1e-9, invDSq(mtHkl1));
    const g2Sq = Math.max(1e-9, invDSq(mtHkl2));
    const d1 = 1 / Math.sqrt(g1Sq);
    const d2 = 1 / Math.sqrt(g2Sq);
    const q1 = (2 * Math.PI) / d1;

    // Cu Ka1 wavelength = 1.540598 Å
    const sinTheta1 = 1.540598 / (2 * d1);
    const twoTheta1 = sinTheta1 <= 1 ? (2 * Math.asin(sinTheta1) * 180) / Math.PI : null;

    // Interplanar angle between (h1 k1 l1) and (h2 k2 l2): cos(phi) = (h1_i G^ij h2_j) / (|g1| |g2|)
    const g1DotG2 =
      mtHkl1[0] * (Ginv[0][0] * mtHkl2[0] + Ginv[0][1] * mtHkl2[1] + Ginv[0][2] * mtHkl2[2]) +
      mtHkl1[1] * (Ginv[1][0] * mtHkl2[0] + Ginv[1][1] * mtHkl2[1] + Ginv[1][2] * mtHkl2[2]) +
      mtHkl1[2] * (Ginv[2][0] * mtHkl2[0] + Ginv[2][1] * mtHkl2[1] + Ginv[2][2] * mtHkl2[2]);
    const cosPhi = Math.max(-1, Math.min(1, g1DotG2 / Math.sqrt(g1Sq * g2Sq)));
    const interplanarAngleDeg = (Math.acos(cosPhi) * 180) / Math.PI;

    // Direct vector length |r_uvw| = sqrt(u_i G_ij u_j)
    const [u, v, w] = mtUvw;
    const rSq =
      u * u * G[0][0] +
      v * v * G[1][1] +
      w * w * G[2][2] +
      2 * u * v * G[0][1] +
      2 * u * w * G[0][2] +
      2 * v * w * G[1][2];
    const directLengthA = Math.sqrt(Math.max(0, rSq));

    // Weiss Zone Law h*u + k*v + l*w
    const weissDot = mtHkl1[0] * u + mtHkl1[1] * v + mtHkl1[2] * w;

    return {
      ...tensor,
      d1,
      d2,
      q1,
      twoTheta1,
      interplanarAngleDeg,
      directLengthA,
      weissDot,
    };
  }, [mtA, mtB, mtC, mtAlpha, mtBeta, mtGamma, mtHkl1, mtHkl2, mtUvw]);

  const loadMetricSystemPreset = (sysId: CrystalSystemId) => {
    playSynthTone('tick');
    if (sysId === 'cubic') {
      setMtA(4.078); setMtB(4.078); setMtC(4.078); setMtAlpha(90); setMtBeta(90); setMtGamma(90);
    } else if (sysId === 'tetragonal') {
      setMtA(4.594); setMtB(4.594); setMtC(2.959); setMtAlpha(90); setMtBeta(90); setMtGamma(90);
    } else if (sysId === 'orthorhombic') {
      setMtA(4.756); setMtB(10.207); setMtC(5.980); setMtAlpha(90); setMtBeta(90); setMtGamma(90);
    } else if (sysId === 'hexagonal') {
      setMtA(4.913); setMtB(4.913); setMtC(5.405); setMtAlpha(90); setMtBeta(90); setMtGamma(120);
    } else if (sysId === 'trigonal') {
      setMtA(4.759); setMtB(4.759); setMtC(12.991); setMtAlpha(90); setMtBeta(90); setMtGamma(120);
    } else if (sysId === 'monoclinic') {
      setMtA(5.148); setMtB(5.212); setMtC(5.315); setMtAlpha(90); setMtBeta(99.23); setMtGamma(90);
    } else {
      setMtA(6.141); setMtB(10.715); setMtC(5.955); setMtAlpha(97.63); setMtBeta(107.26); setMtGamma(77.47);
    }
  };

  // Compute real allowed Bragg reflections & theoretical density for Custom Crystal Builder
  const customMaterialPreview = useMemo(() => {
    const { Ginv, V } = computeMetricTensorData(cmA, cmB, cmC, cmAlpha, cmBeta, cmGamma);
    const NA = 6.02214076e23;
    const densityGcm3 = (cmZ * cmMolarMass) / (NA * V * 1e-24);

    // Check Bravais centering extinction law
    const isAllowed = (h: number, k: number, l: number, cent: CenteringType) => {
      if (cent === 'P') return true;
      if (cent === 'I') return Math.abs(h + k + l) % 2 === 0;
      if (cent === 'F') {
        const pH = Math.abs(h) % 2;
        const pK = Math.abs(k) % 2;
        const pL = Math.abs(l) % 2;
        return pH === pK && pK === pL;
      }
      if (cent === 'C') return Math.abs(h + k) % 2 === 0;
      if (cent === 'R') return Math.abs(-h + k + l) % 3 === 0;
      return true;
    };

    const reflections: { label: string; dA: number; twoTheta: number; mult: number }[] = [];
    const seenD = new Map<string, { label: string; dA: number; twoTheta: number; mult: number }>();

    for (let h = 0; h <= 3; h++) {
      for (let k = 0; k <= 3; k++) {
        for (let l = 0; l <= 3; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          if (!isAllowed(h, k, l, cmCentering)) continue;
          const invD2 =
            h * h * Ginv[0][0] +
            k * k * Ginv[1][1] +
            l * l * Ginv[2][2] +
            2 * h * k * Ginv[0][1] +
            2 * h * l * Ginv[0][2] +
            2 * k * l * Ginv[1][2];
          if (invD2 <= 1e-6) continue;
          const dA = 1 / Math.sqrt(invD2);
          const sinTh = 1.540598 / (2 * dA);
          if (sinTh >= 0.995 || sinTh <= 0.08) continue;
          const twoTheta = (2 * Math.asin(sinTh) * 180) / Math.PI;
          if (twoTheta < 12 || twoTheta > 88) continue;

          const key = twoTheta.toFixed(1);
          const existing = seenD.get(key);
          if (existing) {
            existing.mult += 1;
          } else {
            seenD.set(key, { label: `${h}${k}${l}`, dA, twoTheta, mult: 1 });
          }
        }
      }
    }

    Array.from(seenD.values())
      .sort((a, b) => a.twoTheta - b.twoTheta)
      .slice(0, 6)
      .forEach(r => reflections.push(r));

    const computedPeaks = reflections.map((r, i) => {
      // Map twoTheta [15..85] to SVG x [16..156]
      const x = Math.max(16, Math.min(156, 18 + ((r.twoTheta - 20) / 60) * 126));
      const h = Math.max(12, Math.min(30, 16 + (r.mult % 4) * 4 - i * 1.2));
      return {
        x,
        h,
        label: r.label,
        twoTheta: r.twoTheta,
        dA: r.dA,
        color: cmCentering === 'I' || cmCentering === 'R' ? '#f59e0b' : '#38bdf8',
      };
    });

    return { V, densityGcm3, computedPeaks };
  }, [cmA, cmB, cmC, cmAlpha, cmBeta, cmGamma, cmCentering, cmMolarMass, cmZ]);

  const handleAddCustomCrystalMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const sysObj = CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === cmSystemId) || CRYSTAL_SYSTEMS_CATALOG[0];
    const pearsonMatch = BRAVAIS_14_CATALOG.find(b => b.systemId === cmSystemId && b.centering === cmCentering);
    const pSym = pearsonMatch ? pearsonMatch.pearson : `${cmSystemId[0]}${cmCentering}`;

    const newEntry: CustomMaterialEntry = {
      name: cmName.trim() || 'Custom Crystal',
      formula: cmFormula.trim() || 'AₓBᵧ',
      systemId: cmSystemId,
      systemName: sysObj.name,
      centering: cmCentering,
      latticeType: `${sysObj.name.split(' ')[0]} (${pSym}) · a=${cmA.toFixed(2)}Å`,
      spaceGroup: cmSpaceGroup.trim() || 'Custom SG',
      category: cmCategory,
      description: `Synthesized custom crystal: V = ${customMaterialPreview.V.toFixed(2)} Å³, Z = ${cmZ}, ρ_calc = ${customMaterialPreview.densityGcm3.toFixed(3)} g/cm³ (${cmA.toFixed(3)}, ${cmB.toFixed(3)}, ${cmC.toFixed(3)} Å; ${cmAlpha}°, ${cmBeta}°, ${cmGamma}°).`,
      a: cmA,
      b: cmB,
      c: cmC,
      alpha: cmAlpha,
      beta: cmBeta,
      gamma: cmGamma,
      molarMass: cmMolarMass,
      zUnits: cmZ,
      volumeA3: customMaterialPreview.V,
      densityGcm3: customMaterialPreview.densityGcm3,
      computedPeaks: customMaterialPreview.computedPeaks,
      isCustom: true,
    };

    setCustomMaterials(prev => [newEntry, ...prev]);
    setShowCustomMatModal(false);
    playSynthTone('chime');
  };

  // Adjust default centering when system changes
  const handleSelectSystem = (id: CrystalSystemId) => {
    playSynthTone('tick');
    setSelectedSystemId(id);
    const sys = CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === id);
    if (sys && !sys.bravaisLattices.some(b => b.type === activeCentering)) {
      setActiveCentering(sys.bravaisLattices[0].type);
    }
  };

  const handleSelectBravais14 = (systemId: CrystalSystemId, centering: CenteringType) => {
    playSynthTone('tick');
    setSelectedSystemId(systemId);
    setActiveCentering(centering);
  };

  // Filtered materials for Materials tab (including Custom Synthesized Crystals)
  const displayedMaterials = useMemo(() => {
    const customFiltered = showAllSystemsMaterials
      ? customMaterials
      : customMaterials.filter(m => m.systemId === activeSystem.id);

    const catalogPool = showAllSystemsMaterials
      ? CRYSTAL_SYSTEMS_CATALOG.flatMap(sys =>
          sys.materials.map(m => ({ ...m, systemId: sys.id, systemName: sys.name }))
        )
      : activeSystem.materials.map(m => ({
          ...m,
          systemId: activeSystem.id,
          systemName: activeSystem.name
        }));

    const combined = [...customFiltered, ...catalogPool];
    if (materialCategoryFilter === 'All') return combined;
    return combined.filter(m => m.category === materialCategoryFilter);
  }, [activeSystem, showAllSystemsMaterials, materialCategoryFilter, customMaterials]);

  // Helper to infer centering from material latticeType string
  const inferCenteringFromLatticeType = (latticeType: string, systemId: CrystalSystemId): CenteringType => {
    if (latticeType.includes('(cF)') || latticeType.includes('(oF)') || latticeType.includes('Face-Centered')) return 'F';
    if (latticeType.includes('(cI)') || latticeType.includes('(tI)') || latticeType.includes('(oI)') || latticeType.includes('Body-Centered')) return 'I';
    if (latticeType.includes('(mC)') || latticeType.includes('(oC)') || latticeType.includes('Base-Centered')) return 'C';
    if (latticeType.includes('(hR)') || latticeType.includes('Rhombohedral')) return 'R';
    const sys = CRYSTAL_SYSTEMS_CATALOG.find(s => s.id === systemId);
    return sys?.bravaisLattices[0]?.type || 'P';
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
      explanation: "The hallmark of the cubic system is the presence of four 3-fold triad axes running along the body diagonals ⟨111⟩. Lowest-symmetry cubic point groups (such as 23 and m-3, e.g., space group P23) lack 4-fold axes entirely!"
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
      explanation: "Auguste Bravais proved in 1848 that a face-centered tetragonal (tF) unit cell can always be re-indexed as a smaller body-centered tetragonal (tI) unit cell rotated by 45° around the c-axis with a' = a/√2, and base-centered tetragonal (tC) reduces to primitive tetragonal (tP)."
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
      explanation: "Orthorhombic is the only crystal system that exhibits all 4 Bravais centering types: oP, oI, oF, and oC (or oA/oB), because its three unequal orthogonal axes (a ≠ b ≠ c) prevent rotational reduction between C-centered and P-centered or F-centered and I-centered cells."
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
    },
    {
      question: "When a Trigonal R-centered crystal (hR, such as α-Al₂O₃ Corundum or Calcite) is indexed in the standard Hexagonal Obverse triple cell, what is its net multiplicity Z and systematic reflection condition?",
      options: [
        "Z = 1 and h + k + l = 2n",
        "Z = 3 and −h + k + l = 3n",
        "Z = 4 and h, k, l unmixed",
        "Z = 2 and h + k = 2n"
      ],
      correct: 1,
      explanation: "The Hexagonal Obverse cell contains 3 lattice points at (0,0,0), (⅔,⅓,⅓), and (⅓,⅔,⅔). Summing the structure factor exp[2πi(hu+kv+lw)] over these three basis translations yields constructive interference exclusively when −h + k + l = 3n."
    },
    {
      question: "In powder X-ray diffraction, why do the (hkl) and (h̄kl) reflections split into two distinct 2θ peaks in a Monoclinic crystal (unique axis b, β ≠ 90°)?",
      options: [
        "Because the metric tensor contains a non-zero off-diagonal cross-term g₁₃ = a·c·cos(β)",
        "Because monoclinic crystals violate Friedel's Law",
        "Because the b-axis is longer than the a-axis",
        "Because monoclinic crystals are always base-centered (mC)"
      ],
      correct: 0,
      explanation: "In the monoclinic d-spacing formula, 1/d² includes the cross-term −2hl·cos(β)/(a·c·sin²β). Changing h to −h flips the sign of the product h·l, resulting in different interplanar spacings d(hkl) ≠ d(h̄kl) whenever both h ≠ 0 and l ≠ 0."
    },
    {
      question: "When a Cubic crystal undergoes a ferroelastic phase transition into a Tetragonal phase (c ≠ a) and subsequently into an Orthorhombic phase (a ≠ b ≠ c), how does the single Cubic {200} diffraction peak evolve?",
      options: [
        "It remains a single peak but shifts to lower 2θ",
        "It splits into a doublet (200)+(002) in Tetragonal, and a triplet (200)+(020)+(002) in Orthorhombic",
        "It becomes systematically extinct due to symmetry lowering",
        "It splits into 6 peaks in Tetragonal and 12 peaks in Orthorhombic"
      ],
      correct: 1,
      explanation: "In Cubic (a=b=c), (200), (020), and (002) have identical d-spacings (multiplicity 6). In Tetragonal (a=b≠c), (200) and (020) remain degenerate while (002) separates, forming a 2:1 intensity doublet. In Orthorhombic (a≠b≠c), all three axes differ, splitting the peak into a 1:1:1 triplet."
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* High-Precision Laboratory Header Console */}
      <div className="relative overflow-hidden rounded-xl bg-[#0B0F19] border border-slate-800 p-6 shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          <div className="xl:col-span-7 space-y-3">
            {/* Zero-Pill Typographic Metadata Line */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Crystallographic Metrology</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-300">7 Holohedral Systems</span>
              <span className="text-slate-700">·</span>
              <span className="text-amber-400">14 Bravais Lattices</span>
              <span className="text-slate-700">·</span>
              <span className="text-cyan-300">230 Space Groups</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight leading-tight">
              Unit Cells, Metric Tensors &amp; Crystal Systems
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              Analyze three-dimensional crystal periodicity via translational basis vectors{' '}
              <span className="font-mono text-cyan-300">T = ua + vb + wc</span>, direct and reciprocal metric tensors{' '}
              <span className="font-mono text-amber-300">G_ij</span>, Bravais centering multiplicities, and systematic structure-factor extinction rules.
            </p>
          </div>

          {/* Right Live Hero Schematic Card */}
          <div className="xl:col-span-5">
            <UnitCellHeroSchematic
              systemId={activeSystem.id}
              centering={activeCentering}
              systemName={activeSystem.name}
              axialRelation={activeSystem.axialRelation}
              angleRelation={activeSystem.angleRelation}
              spaceGroupsCount={activeSystem.spaceGroupsCount}
              pointsPerCell={
                activeSystem.bravaisLattices.find(b => b.type === activeCentering)?.pointsPerCell || 1
              }
            />
          </div>
        </div>

        {/* Categorized Scientific Workstation Switcher Ribbon */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-800/80 text-xs font-mono">
          {/* Group 1: Spatial & Reciprocal Geometry */}
          <div className="bg-[#070A12] border border-slate-800/90 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                01 // Direct &amp; Reciprocal Space
              </span>
              <span className="text-[9px] font-mono text-slate-500">G_ij · (hkl) · Wulff</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { playSynthTone('tick'); setViewMode('3d'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === '3d'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Cell &amp; Symmetry</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setViewMode('miller'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'miller'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Miller Planes (hkl)</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setViewMode('stereo'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'stereo'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Wulff Net &amp; Extinctions</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setViewMode('theory'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'theory'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Metric Tensor G_ij</span>
              </button>
            </div>
          </div>

          {/* Group 2: Atomic Packing, Metallurgy & Crystal Classes */}
          <div className="bg-[#070A12] border border-slate-800/90 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                02 // Packing, Slip &amp; 7 Systems
              </span>
              <span className="text-[9px] font-mono text-slate-500">APF · Burgers · Indicatrix</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { playSynthTone('tick'); setViewMode('metallic'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'metallic'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Atom className="w-3.5 h-3.5 text-cyan-400" />
                <span>Metallic (BCC/FCC/HCP)</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setViewMode('apf'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'apf'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>APF Exact Proofs</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setViewMode('gallery'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'gallery'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-cyan-400" />
                <span>7 Systems &amp; Indicatrices</span>
              </button>
            </div>
          </div>

          {/* Group 3: Reference Catalog, Code & Assessment */}
          <div className="bg-[#070A12] border border-slate-800/90 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-bold">
                03 // Catalog, Code &amp; Mastery
              </span>
              <span className="text-[9px] font-mono text-slate-500">XRD Stick · Py · Quiz</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => { playSynthTone('tick'); setViewMode('materials'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'materials'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Material Catalog</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setViewMode('python'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'python'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Python Studio</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setViewMode('quiz'); }}
                className={`px-2.5 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all border ${
                  viewMode === 'quiz'
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Knowledge Quiz</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crystal System Selector Navigation Bar with 3D CAD Polyhedra */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>The 7 Crystal Systems · Ranked by Holohedral Symmetry</span>
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400">
              Active: <strong className="text-slate-100">#{activeSystem.orderRank} {activeSystem.name}</strong> ·{' '}
              <span className="text-cyan-400 font-bold">Pearson {activePearsonSymbol}</span> ·{' '}
              <span className="text-amber-400">{activeSystem.pointGroups[activeSystem.pointGroups.length - 1]}</span> ·{' '}
              <span className="text-slate-300">{activeSystem.spaceGroupRange}</span>
            </span>
            <button
              onClick={() => { playSynthTone('tick'); setShowAll14Matrix(prev => !prev); }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border transition-all flex items-center gap-1.5 ${
                showAll14Matrix
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-[#0B0F19] text-cyan-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>{showAll14Matrix ? 'Hide 14 Bravais Matrix' : 'All 14 Bravais Lattices (cP–aP)'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible 14 Bravais Lattices Quick-Jump Matrix */}
        <AnimatePresence>
          {showAll14Matrix && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                    Complete 14 Bravais Lattices Direct Selector (Pearson Symbols cP → aP)
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Click any Bravais lattice to synchronize Crystal System &amp; Centering Mode
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {BRAVAIS_14_CATALOG.map((item) => {
                    const isCurrent = item.systemId === selectedSystemId && item.centering === activeCentering;
                    return (
                      <button
                        key={item.pearson}
                        onClick={() => handleSelectBravais14(item.systemId, item.centering)}
                        className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-[#0B1324] border-cyan-500/60 text-white'
                            : 'bg-[#070A12] border-slate-800/90 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`font-mono text-xs font-extrabold ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {item.pearson}
                          </span>
                          <span className="font-mono text-[9px] text-amber-400 tabular-nums">
                            Z={item.Z}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-200 truncate">
                          {item.label}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                          {item.extinctionRule}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {CRYSTAL_SYSTEMS_CATALOG.map((sys) => {
            const isSelected = sys.id === selectedSystemId;
            const displayCentering =
              isSelected && sys.bravaisLattices.some(b => b.type === activeCentering)
                ? activeCentering
                : sys.bravaisLattices[0].type;

            return (
              <button
                key={sys.id}
                onClick={() => handleSelectSystem(sys.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#0B1324] border-cyan-500/60 text-white shadow-lg'
                    : 'bg-[#0B0F19] border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className={isSelected ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                    #{sys.orderRank} · {sys.spaceGroupsCount} SG
                  </span>
                  <span className="text-[10px] font-mono text-amber-400/90 font-bold">
                    {sys.bravaisLattices.map(b => b.type).join('·')}
                  </span>
                </div>

                {/* Isometric Crystal System Vector Schematic */}
                <div className="my-1.5 py-1 flex items-center justify-center bg-[#070A12] rounded-lg border border-slate-800/80 group-hover:border-slate-700 transition-colors">
                  <CrystalSystemMiniSchematic
                    systemId={sys.id}
                    centering={displayCentering}
                    isSelected={isSelected}
                    size="md"
                  />
                </div>

                <div>
                  <div className="text-xs font-bold truncate text-slate-100">
                    {sys.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300/90 truncate mt-0.5">
                    {sys.axialRelation}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 truncate">
                    {sys.angleRelation.split('(')[0].trim()}
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    layoutId="crystalSystemUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Interactive Bravais Lattice Centering & Multiplicity Strip */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Allowed Bravais Lattices for {activeSystem.name} ({activeSystem.bravaisLattices.length} of 14 · Pearson {activePearsonSymbol})
            </div>
            <p className="text-xs text-slate-400">
              Select a Bravais centering mode to update 3D lattice nodes, coordination bonds, and systematic extinction conditions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto">
            {activeSystem.bravaisLattices.map((bl) => {
              const isBravaisActive = activeCentering === bl.type;
              return (
                <button
                  key={bl.type}
                  onClick={() => {
                    playSynthTone('tick');
                    setActiveCentering(bl.type);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all ${
                    isBravaisActive
                      ? 'bg-[#0B1324] border-cyan-500/60 text-white'
                      : 'bg-[#070A12] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <BravaisCenteringSchematic type={bl.type} isSelected={isBravaisActive} />
                  <div className="font-mono">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{bl.type}-Centered</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-400">Z = {bl.pointsPerCell}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 max-w-[180px] truncate">
                      {bl.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
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

      {/* TAB: STEREOGRAPHIC WULFF NET & RECIPROCAL SPACE EXTINCTIONS */}
      {viewMode === 'stereo' && (
        <StereographicWulffExplorer
          selectedSystemId={selectedSystemId}
          activeCentering={activeCentering}
          onSelectSystem={handleSelectSystem}
          setActiveCentering={setActiveCentering}
        />
      )}

      {/* TAB: MILLER PLANES VISUALIZER (IMAGE 1) */}
      {viewMode === 'miller' && (
        <MillerPlanesVisualizer
          selectedSystemId={selectedSystemId}
          activeCentering={activeCentering}
          onSelectSystem={handleSelectSystem}
          setActiveCentering={setActiveCentering}
        />
      )}

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
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-indigo-400 text-sm block">Primitive (P)</span>
                      <span className="font-mono text-[10px] text-indigo-300">Multiplicity Z = 1 pt</span>
                    </div>
                    <BravaisCenteringSchematic type="P" isSelected={true} />
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Lattice points reside <strong className="text-slate-200">only at the 8 vertices</strong>. Each corner is shared by 8 adjacent cells:
                  </p>
                  <div className="font-mono text-indigo-300 bg-slate-950 p-1.5 rounded text-center border border-slate-800/80">
                    8 × (⅛) = 1 net point
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-rose-400 text-sm block">Body-Centered (I)</span>
                      <span className="font-mono text-[10px] text-rose-300">Multiplicity Z = 2 pts</span>
                    </div>
                    <BravaisCenteringSchematic type="I" isSelected={true} />
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Points at 8 vertices + <strong className="text-slate-200">1 central point</strong> at (½, ½, ½) entirely contained in the cell:
                  </p>
                  <div className="font-mono text-rose-300 bg-slate-950 p-1.5 rounded text-center border border-slate-800/80">
                    [8 × (⅛)] + 1 = 2 net points
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-cyan-400 text-sm block">Face-Centered (F)</span>
                      <span className="font-mono text-[10px] text-cyan-300">Multiplicity Z = 4 pts</span>
                    </div>
                    <BravaisCenteringSchematic type="F" isSelected={true} />
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Points at 8 vertices + <strong className="text-slate-200">6 face centers</strong>. Each face atom is shared by 2 adjoining cells:
                  </p>
                  <div className="font-mono text-cyan-300 bg-slate-950 p-1.5 rounded text-center border border-slate-800/80">
                    [8 × (⅛)] + [6 × (½)] = 4 net points
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-emerald-400 text-sm block">Base-Centered (C)</span>
                      <span className="font-mono text-[10px] text-emerald-300">Multiplicity Z = 2 pts</span>
                    </div>
                    <BravaisCenteringSchematic type="C" isSelected={true} />
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Points at 8 vertices + <strong className="text-slate-200">2 face centers</strong> on one pair of parallel pinacoidal faces:
                  </p>
                  <div className="font-mono text-emerald-300 bg-slate-950 p-1.5 rounded text-center border border-slate-800/80">
                    [8 × (⅛)] + [2 × (½)] = 2 net points
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Why Conventional over Primitive?</strong> In crystallography, we intentionally choose centered non-primitive cells (e.g., FCC instead of the smaller 60° rhombohedral primitive cell) because the conventional cubic cell directly mirrors the full orthogonal 48-fold rotational/mirror symmetry of the macro crystal.
                </p>
              </div>
            </div>

            {/* Direct vs. Reciprocal Space & Covariant Metric Tensor G_ij Graphic */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  Dual-Space Crystallographic Duality
                </div>
                <h3 className="text-base font-bold text-white">
                  Direct Basis (a, b, c) ↔ Reciprocal Basis (a*, b*, c*) & Metric Tensor G<sub>ij</sub>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every family of direct-space planes <span className="font-mono text-indigo-300">(hkl)</span> with interplanar spacing <span className="font-mono text-amber-300">d<sub>hkl</sub></span> maps to a single point <span className="font-mono text-cyan-300">g<sub>hkl</sub> = h·a* + k·b* + l·c*</span> in reciprocal space normal to the planes with magnitude <span className="font-mono text-emerald-300">|g<sub>hkl</sub>| = 1 / d<sub>hkl</sub></span>.
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 space-y-1.5">
                  <div className="text-indigo-300 font-bold">a<sub>i</sub> · a<sub>j</sub>* = δ<sub>ij</sub> &nbsp;(Kronecker Orthogonality)</div>
                  <div className="text-cyan-300">1 / d<sub>hkl</sub>² = [h k l] · G⁻¹ · [h k l]ᵀ = h²a*² + k²b*² + l²c*² + ...</div>
                  <div className="text-emerald-300">V* = a* · (b* × c*) = 1 / V<sub>cell</sub></div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <svg viewBox="0 0 560 215" className="w-full h-auto select-none">
                  <defs>
                    <marker id="dirArrA" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                    </marker>
                    <marker id="dirArrB" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                    </marker>
                    <marker id="recArr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                  </defs>

                  {/* Left Panel: Direct Lattice & (hkl) Plane Family */}
                  <rect x="10" y="10" width="258" height="195" rx="10" fill="#020617" stroke="#1e293b" />
                  <text x="22" y="28" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    DIRECT SPACE R = u·a + v·b + w·c
                  </text>

                  {/* (hkl) parallel planes */}
                  <line x1="35" y1="145" x2="145" y2="55" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="75" y1="168" x2="185" y2="78" stroke="#6366f1" strokeWidth="1.8" />
                  <line x1="115" y1="191" x2="225" y2="101" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" />

                  {/* Direct lattice points */}
                  {[0, 1, 2].map(ix =>
                    [0, 1, 2].map(iy => {
                      const px = 55 + ix * 62 + iy * 18;
                      const py = 165 - iy * 48;
                      return <circle key={`${ix}-${iy}`} cx={px} cy={py} r="3.5" fill="#94a3b8" />;
                    })
                  )}

                  {/* Direct Basis Vectors a and b */}
                  <line x1="55" y1="165" x2="117" y2="165" stroke="#f43f5e" strokeWidth="2.4" markerEnd="url(#dirArrA)" />
                  <text x="84" y="180" fill="#fb7185" fontSize="10" fontFamily="monospace" fontWeight="bold">a</text>
                  <line x1="55" y1="165" x2="73" y2="117" stroke="#10b981" strokeWidth="2.4" markerEnd="url(#dirArrB)" />
                  <text x="42" y="138" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">b</text>

                  {/* Normal vector g_hkl showing d_hkl */}
                  <line x1="112" y1="138" x2="144" y2="166" stroke="#f59e0b" strokeWidth="2" />
                  <text x="148" y="156" fill="#fbbf24" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    d_hkl
                  </text>
                  <text x="165" y="72" fill="#818cf8" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    (hkl) Planes
                  </text>

                  {/* Right Panel: Reciprocal Space & Metric Tensor */}
                  <rect x="282" y="10" width="268" height="195" rx="10" fill="#020617" stroke="#1e293b" />
                  <text x="294" y="28" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                    RECIPROCAL SPACE g_hkl &amp; METRIC TENSOR G_ij
                  </text>

                  {/* Reciprocal vectors a* and b* */}
                  <line x1="320" y1="150" x2="395" y2="122" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#recArr)" />
                  <text x="398" y="126" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">a*</text>
                  <line x1="320" y1="150" x2="320" y2="75" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#recArr)" />
                  <text x="304" y="74" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">b*</text>

                  {/* g_hkl vector */}
                  <line x1="320" y1="150" x2="405" y2="78" stroke="#fbbf24" strokeWidth="2.4" strokeDasharray="3 2" markerEnd="url(#recArr)" />
                  <circle cx="408" cy="75" r="4.5" fill="#fbbf24" />
                  <text x="352" y="64" fill="#fbbf24" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    g_hkl (|g| = 1/d_hkl)
                  </text>

                  {/* Metric Tensor Box */}
                  <rect x="424" y="88" width="116" height="98" rx="8" fill="#0f172a" stroke="#334155" />
                  <text x="482" y="104" textAnchor="middle" fill="#a5b4fc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    Metric Tensor G_ij
                  </text>
                  <text x="482" y="124" textAnchor="middle" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">
                    ┌ a·a  a·b  a·c ┐
                  </text>
                  <text x="482" y="140" textAnchor="middle" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">
                    │ b·a  b·b  b·c │
                  </text>
                  <text x="482" y="156" textAnchor="middle" fill="#e2e8f0" fontSize="8.5" fontFamily="monospace">
                    └ c·a  c·b  c·c ┘
                  </text>
                  <text x="482" y="176" textAnchor="middle" fill="#34d399" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                    V = √det(G_ij)
                  </text>
                </svg>
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
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
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
                          <span className={`w-2 h-2 rounded-xs ${isSelected ? 'bg-indigo-400' : 'bg-slate-700'}`} />
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
              <div className="flex gap-3 text-slate-300 font-mono text-[11px] tabular-nums">
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

          {/* Section 1.3: Symmetry-Lowering XRD Peak Splitting & Degeneracy Explorer */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
            <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
                  Section 1.3 • Group-Subgroup Symmetry Lowering
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                  XRD Peak Splitting Across Crystal Systems
                </h2>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                {(['200', '110', '111'] as const).map(fam => (
                  <button
                    key={fam}
                    onClick={() => { playSynthTone('tick'); setSelectedSplittingFamily(fam); }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      selectedSplittingFamily === fam
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Family &#123;{fam}&#125;
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              In high-symmetry Cubic crystals, symmetry-equivalent planes within a family <span className="font-mono text-cyan-300">&#123;hkl&#125;</span> share the exact same interplanar spacing <span className="font-mono text-amber-300">d_hkl</span>, superimposing into a single intense Bragg peak. When a crystal undergoes a distortion (e.g., ferroelectric BaTiO₃ cooling from Cubic → Tetragonal → Orthorhombic → Rhombohedral), metric degeneracy is lifted and the peak splits into diagnostic multiplets:
            </p>

            {/* Live Simulated Multiplet Diffractogram SVG */}
            {(() => {
              const panels =
                selectedSplittingFamily === '200'
                  ? [
                      {
                        title: '1. Cubic (m-3m)',
                        subtitle: 'Singlet • m = 6',
                        color: '#818cf8',
                        peaks: [{ pos: 0, amp: 1.0, label: '(200)' }]
                      },
                      {
                        title: '2. Tetragonal (4/mmm)',
                        subtitle: '2:1 Doublet • m = 4 + 2',
                        color: '#22d3ee',
                        peaks: [
                          { pos: -0.36, amp: 0.48, label: '(002)' },
                          { pos: 0.28, amp: 0.96, label: '(200)/(020)' }
                        ]
                      },
                      {
                        title: '3. Orthorhombic (mmm)',
                        subtitle: '1:1:1 Triplet • m = 2+2+2',
                        color: '#34d399',
                        peaks: [
                          { pos: -0.45, amp: 0.58, label: '(002)' },
                          { pos: 0.0, amp: 0.58, label: '(020)' },
                          { pos: 0.45, amp: 0.58, label: '(200)' }
                        ]
                      },
                      {
                        title: '4. Rhombohedral (-3m)',
                        subtitle: 'Unchanged Singlet • m = 6',
                        color: '#c084fc',
                        peaks: [{ pos: 0, amp: 1.0, label: '{200}' }]
                      }
                    ]
                  : selectedSplittingFamily === '110'
                  ? [
                      {
                        title: '1. Cubic (m-3m)',
                        subtitle: 'Singlet • m = 12',
                        color: '#818cf8',
                        peaks: [{ pos: 0, amp: 1.0, label: '{110}' }]
                      },
                      {
                        title: '2. Tetragonal (4/mmm)',
                        subtitle: '1:2 Doublet • m = 4 + 8',
                        color: '#22d3ee',
                        peaks: [
                          { pos: -0.32, amp: 0.48, label: '(110)' },
                          { pos: 0.28, amp: 0.96, label: '(101)/(011)' }
                        ]
                      },
                      {
                        title: '3. Orthorhombic (mmm)',
                        subtitle: '1:1:1 Triplet • m = 4+4+4',
                        color: '#34d399',
                        peaks: [
                          { pos: -0.45, amp: 0.58, label: '(011)' },
                          { pos: 0.0, amp: 0.58, label: '(101)' },
                          { pos: 0.45, amp: 0.58, label: '(110)' }
                        ]
                      },
                      {
                        title: '4. Rhombohedral (-3m)',
                        subtitle: '1:1 Doublet • m = 6 + 6',
                        color: '#c084fc',
                        peaks: [
                          { pos: -0.3, amp: 0.72, label: '(110)' },
                          { pos: 0.3, amp: 0.72, label: '(1-10)' }
                        ]
                      }
                    ]
                  : [
                      {
                        title: '1. Cubic (m-3m)',
                        subtitle: 'Singlet • m = 8',
                        color: '#818cf8',
                        peaks: [{ pos: 0, amp: 1.0, label: '{111}' }]
                      },
                      {
                        title: '2. Tetragonal (4/mmm)',
                        subtitle: 'Degenerate Singlet! • m = 8',
                        color: '#22d3ee',
                        peaks: [{ pos: 0, amp: 1.0, label: '{111}' }]
                      },
                      {
                        title: '3. Rhombohedral (-3m)',
                        subtitle: '1:3 Doublet • m = 2 + 6',
                        color: '#c084fc',
                        peaks: [
                          { pos: -0.36, amp: 0.34, label: '(111)' },
                          { pos: 0.26, amp: 0.98, label: '(11-1)' }
                        ]
                      },
                      {
                        title: '4. Monoclinic (2/m)',
                        subtitle: '1:1 Doublet • ±h Cross-Term',
                        color: '#fb7185',
                        peaks: [
                          { pos: -0.32, amp: 0.72, label: '(111)' },
                          { pos: 0.32, amp: 0.72, label: '(-111)' }
                        ]
                      }
                    ];

              return (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3 px-1">
                    <span>
                      SIMULATED MULTIPLET PROFILE I(Δ2θ) — FAMILY &#123;{selectedSplittingFamily}&#125; DEGENERACY LIFTING
                    </span>
                    <span className="text-cyan-400">Pseudo-Voigt Profile Convolution</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {panels.map((panel, pIdx) => {
                      const pts: string[] = [];
                      for (let i = 0; i <= 80; i++) {
                        const xNorm = -1 + (2 * i) / 80; // -1 to 1
                        let yVal = 0;
                        for (const pk of panel.peaks) {
                          const dx = (xNorm - pk.pos) / 0.14;
                          yVal += pk.amp * (0.6 * Math.exp(-dx * dx) + 0.4 / (1 + dx * dx));
                        }
                        const px = 12 + (i / 80) * 196;
                        const py = 104 - Math.min(1.08, yVal) * 68;
                        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
                      }
                      const areaPts = `12,104 ${pts.join(' ')} 208,104`;
                      return (
                        <div key={pIdx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                          <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                            <span className="font-bold text-white">{panel.title}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mb-2">{panel.subtitle}</div>
                          <svg viewBox="0 0 220 122" className="w-full h-auto select-none">
                            <line x1="12" y1="104" x2="208" y2="104" stroke="#334155" strokeWidth="1" />
                            <line x1="110" y1="18" x2="110" y2="104" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
                            <polygon points={areaPts} fill={panel.color} fillOpacity="0.16" />
                            <polyline fill="none" stroke={panel.color} strokeWidth="2" points={pts.join(' ')} />
                            {panel.peaks.map((pk, kIdx) => {
                              const lx = 12 + ((pk.pos + 1) / 2) * 196;
                              const ly = 104 - pk.amp * 68 - 6;
                              return (
                                <g key={kIdx}>
                                  <line
                                    x1={lx}
                                    y1={104}
                                    x2={lx}
                                    y2={108}
                                    stroke={panel.color}
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x={lx}
                                    y={Math.max(14, ly)}
                                    textAnchor="middle"
                                    fill="#e2e8f0"
                                    fontSize="8.5"
                                    fontFamily="monospace"
                                    fontWeight="bold"
                                  >
                                    {pk.label}
                                  </text>
                                </g>
                              );
                            })}
                            <text x="110" y="118" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">
                              Δ2θ around Bragg Centroid
                            </text>
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {selectedSplittingFamily === '200' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2">
                  <div className="text-indigo-400 font-bold">1. Cubic (m-3m)</div>
                  <div className="text-[11px] text-slate-400">a = b = c, α=β=γ=90°</div>
                  <div className="text-emerald-400 font-bold text-sm">Single Peak (Singlet)</div>
                  <div className="text-slate-300">(200), (020), (002)</div>
                  <div className="text-[10px] text-slate-500">Multiplicity m = 6</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                  <div className="text-cyan-400 font-bold">2. Tetragonal (4/mmm)</div>
                  <div className="text-[11px] text-slate-400">a = b ≠ c, α=β=γ=90°</div>
                  <div className="text-amber-400 font-bold text-sm">2 Peaks (2:1 Doublet)</div>
                  <div className="text-slate-300">(200)/(020) + (002)</div>
                  <div className="text-[10px] text-slate-500">Multiplicities m = 4 + 2</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <div className="text-emerald-400 font-bold">3. Orthorhombic (mmm)</div>
                  <div className="text-[11px] text-slate-400">a ≠ b ≠ c, α=β=γ=90°</div>
                  <div className="text-rose-400 font-bold text-sm">3 Peaks (1:1:1 Triplet)</div>
                  <div className="text-slate-300">(200) + (020) + (002)</div>
                  <div className="text-[10px] text-slate-500">Multiplicities m = 2 + 2 + 2</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2">
                  <div className="text-purple-400 font-bold">4. Rhombohedral (-3m)</div>
                  <div className="text-[11px] text-slate-400">a = b = c, α=β=γ≠90°</div>
                  <div className="text-emerald-400 font-bold text-sm">Single Peak (Singlet)</div>
                  <div className="text-slate-300">(200), (020), (002)</div>
                  <div className="text-[10px] text-slate-500">h·k + k·l + l·h = 0 (Unchanged!)</div>
                </div>
              </div>
            )}

            {selectedSplittingFamily === '110' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2">
                  <div className="text-indigo-400 font-bold">1. Cubic (m-3m)</div>
                  <div className="text-[11px] text-slate-400">a = b = c, α=β=γ=90°</div>
                  <div className="text-emerald-400 font-bold text-sm">Single Peak (Singlet)</div>
                  <div className="text-slate-300">&#123;110&#125; all equivalent</div>
                  <div className="text-[10px] text-slate-500">Multiplicity m = 12</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                  <div className="text-cyan-400 font-bold">2. Tetragonal (4/mmm)</div>
                  <div className="text-[11px] text-slate-400">a = b ≠ c, α=β=γ=90°</div>
                  <div className="text-amber-400 font-bold text-sm">2 Peaks (1:2 Doublet)</div>
                  <div className="text-slate-300">(110) + (101)/(011)</div>
                  <div className="text-[10px] text-slate-500">Multiplicities m = 4 + 8</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                  <div className="text-emerald-400 font-bold">3. Orthorhombic (mmm)</div>
                  <div className="text-[11px] text-slate-400">a ≠ b ≠ c, α=β=γ=90°</div>
                  <div className="text-rose-400 font-bold text-sm">3 Peaks (1:1:1 Triplet)</div>
                  <div className="text-slate-300">(110) + (101) + (011)</div>
                  <div className="text-[10px] text-slate-500">Multiplicities m = 4 + 4 + 4</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2">
                  <div className="text-purple-400 font-bold">4. Rhombohedral (-3m)</div>
                  <div className="text-[11px] text-slate-400">a = b = c, α=β=γ≠90°</div>
                  <div className="text-amber-400 font-bold text-sm">2 Peaks (1:1 Doublet)</div>
                  <div className="text-slate-300">(110) + (1-10)</div>
                  <div className="text-[10px] text-slate-500">Multiplicities m = 6 + 6</div>
                </div>
              </div>
            )}

            {selectedSplittingFamily === '111' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2">
                  <div className="text-indigo-400 font-bold">1. Cubic (m-3m)</div>
                  <div className="text-[11px] text-slate-400">a = b = c, α=β=γ=90°</div>
                  <div className="text-emerald-400 font-bold text-sm">Single Peak (Singlet)</div>
                  <div className="text-slate-300">&#123;111&#125; body diagonals</div>
                  <div className="text-[10px] text-slate-500">Multiplicity m = 8</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                  <div className="text-cyan-400 font-bold">2. Tetragonal (4/mmm)</div>
                  <div className="text-[11px] text-slate-400">a = b ≠ c, α=β=γ=90°</div>
                  <div className="text-emerald-400 font-bold text-sm">Single Peak (Singlet!)</div>
                  <div className="text-slate-300">(111), (1-11), (-111)...</div>
                  <div className="text-[10px] text-slate-500">All 8 planes keep equal d!</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-2">
                  <div className="text-purple-400 font-bold">3. Rhombohedral (-3m)</div>
                  <div className="text-[11px] text-slate-400">a = b = c, α=β=γ≠90°</div>
                  <div className="text-amber-400 font-bold text-sm">2 Peaks (1:3 Doublet)</div>
                  <div className="text-slate-300">(111) + (11-1)/(1-11)/(-111)</div>
                  <div className="text-[10px] text-slate-500">Multiplicities m = 2 + 6</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-2">
                  <div className="text-rose-400 font-bold">4. Monoclinic (2/m)</div>
                  <div className="text-[11px] text-slate-400">a ≠ b ≠ c, β ≠ 90°</div>
                  <div className="text-rose-400 font-bold text-sm">2 Peaks (1:1 Doublet)</div>
                  <div className="text-slate-300">(111) + (-111)</div>
                  <div className="text-[10px] text-slate-500">Cross-term hl·cos(β) splits ±h</div>
                </div>
              </div>
            )}
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

                <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-2">
                  <div className="text-rose-400 font-bold">4. Rhombohedral (-3m)</div>
                  <div className="text-slate-300">Ideal c/a = √(8/3) ≈ 1.633</div>
                  <div className="text-amber-400 font-bold">APF = (π√2) / 6 ≈ 74.05%</div>
                  <div className="text-slate-400 text-[11px]">Identical packing to FCC (ABAB stacking)</div>
                </div>
              </div>
            </div>

          {/* Section 1.5: Interactive Live 3x3 Metric Tensor (G_ij & G^ij) & Dual-Space Metrology Calculator */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
                  Section 1.5 • Analytical Tensor Algebra Workstation
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
                  Interactive Covariant (G_ij) &amp; Contravariant (G^ij) Metric Tensor Solver
                </h2>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                {CRYSTAL_SYSTEMS_CATALOG.map(sys => (
                  <button
                    key={sys.id}
                    onClick={() => loadMetricSystemPreset(sys.id)}
                    className="px-2.5 py-1 rounded-lg bg-[#070A12] hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 font-bold transition-all"
                  >
                    {sys.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono">
              {/* Left 5 Cols: Custom Cell Parameters & Miller/Zone Inputs */}
              <div className="lg:col-span-5 bg-[#070A12] border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  1. Direct Basis Lengths (Å) &amp; Angles (°)
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">a (Å)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.5"
                      max="30"
                      value={mtA}
                      onChange={e => setMtA(Math.max(1.5, parseFloat(e.target.value) || 4.0))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-cyan-300 font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">b (Å)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.5"
                      max="30"
                      value={mtB}
                      onChange={e => setMtB(Math.max(1.5, parseFloat(e.target.value) || 4.0))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-cyan-300 font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">c (Å)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.5"
                      max="30"
                      value={mtC}
                      onChange={e => setMtC(Math.max(1.5, parseFloat(e.target.value) || 4.0))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-cyan-300 font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">α (°)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="40"
                      max="140"
                      value={mtAlpha}
                      onChange={e => setMtAlpha(Math.min(140, Math.max(40, parseFloat(e.target.value) || 90)))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-amber-300 font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">β (°)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="40"
                      max="140"
                      value={mtBeta}
                      onChange={e => setMtBeta(Math.min(140, Math.max(40, parseFloat(e.target.value) || 90)))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-amber-300 font-bold tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">γ (°)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="40"
                      max="140"
                      value={mtGamma}
                      onChange={e => setMtGamma(Math.min(140, Math.max(40, parseFloat(e.target.value) || 90)))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0B0F19] border border-slate-800 text-amber-300 font-bold tabular-nums"
                    />
                  </div>
                </div>

                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 pt-2">
                  2. Reciprocal Planes (hkl) &amp; Direct Vector [uvw]
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Plane 1 (h₁k₁l₁):</span>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <input
                          key={i}
                          type="number"
                          min="-6"
                          max="6"
                          value={mtHkl1[i]}
                          onChange={e => {
                            const next: [number, number, number] = [...mtHkl1] as [number, number, number];
                            next[i] = parseInt(e.target.value) || 0;
                            setMtHkl1(next);
                          }}
                          className="w-12 px-1.5 py-1 rounded bg-[#0B0F19] border border-slate-800 text-center text-cyan-300 font-bold"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Plane 2 (h₂k₂l₂):</span>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <input
                          key={i}
                          type="number"
                          min="-6"
                          max="6"
                          value={mtHkl2[i]}
                          onChange={e => {
                            const next: [number, number, number] = [...mtHkl2] as [number, number, number];
                            next[i] = parseInt(e.target.value) || 0;
                            setMtHkl2(next);
                          }}
                          className="w-12 px-1.5 py-1 rounded bg-[#0B0F19] border border-slate-800 text-center text-cyan-300 font-bold"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">Direction [uvw]:</span>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <input
                          key={i}
                          type="number"
                          min="-6"
                          max="6"
                          value={mtUvw[i]}
                          onChange={e => {
                            const next: [number, number, number] = [...mtUvw] as [number, number, number];
                            next[i] = parseInt(e.target.value) || 0;
                            setMtUvw(next);
                          }}
                          className="w-12 px-1.5 py-1 rounded bg-[#0B0F19] border border-slate-800 text-center text-amber-300 font-bold"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: 3x3 Matrices & Dual-Space Outputs */}
              <div className="lg:col-span-7 space-y-4 tabular-nums">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Direct Metric Tensor Matrix G_ij */}
                  <div className="bg-[#070A12] border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-cyan-400 font-bold">Covariant G_ij (Å²)</span>
                      <span className="text-slate-500">a_i · a_j</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs bg-[#0B0F19] p-2.5 rounded-xl border border-slate-800">
                      {liveMetricCalc.G.flatMap((row, rIdx) =>
                        row.map((val, cIdx) => (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`py-1.5 rounded ${
                              rIdx === cIdx ? 'bg-cyan-500/10 text-cyan-300 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {val.toFixed(2)}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>det(G_ij) = {liveMetricCalc.vSq.toFixed(2)} Å⁶</span>
                      <span className="text-emerald-400 font-bold">V = {liveMetricCalc.V.toFixed(3)} Å³</span>
                    </div>
                  </div>

                  {/* Reciprocal Metric Tensor Matrix G^ij */}
                  <div className="bg-[#070A12] border border-slate-800 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-amber-400 font-bold">Contravariant G^ij (Å⁻²)</span>
                      <span className="text-slate-500">(G_ij)⁻¹</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs bg-[#0B0F19] p-2.5 rounded-xl border border-slate-800">
                      {liveMetricCalc.Ginv.flatMap((row, rIdx) =>
                        row.map((val, cIdx) => (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            className={`py-1.5 rounded ${
                              rIdx === cIdx ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {val.toFixed(4)}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>a*={liveMetricCalc.aStar.toFixed(3)} b*={liveMetricCalc.bStar.toFixed(3)} c*={liveMetricCalc.cStar.toFixed(3)} Å⁻¹</span>
                      <span className="text-amber-300">γ*={liveMetricCalc.gammaStar.toFixed(1)}°</span>
                    </div>
                  </div>
                </div>

                {/* Computed Dual-Space Observables */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] text-slate-400">d({mtHkl1.join('')}) Spacing</div>
                    <div className="text-sm font-bold text-cyan-300">{liveMetricCalc.d1.toFixed(4)} Å</div>
                    <div className="text-[10px] text-slate-500">Q = {liveMetricCalc.q1.toFixed(3)} Å⁻¹</div>
                  </div>
                  <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] text-slate-400">Bragg 2θ (Cu Kα₁)</div>
                    <div className="text-sm font-bold text-amber-300">
                      {liveMetricCalc.twoTheta1 !== null ? `${liveMetricCalc.twoTheta1.toFixed(2)}°` : 'Evanescent'}
                    </div>
                    <div className="text-[10px] text-slate-500">λ = 1.5406 Å</div>
                  </div>
                  <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] text-slate-400">Angle ∠({mtHkl1.join('')},{mtHkl2.join('')})</div>
                    <div className="text-sm font-bold text-emerald-400">{liveMetricCalc.interplanarAngleDeg.toFixed(2)}°</div>
                    <div className="text-[10px] text-slate-500">d₂ = {liveMetricCalc.d2.toFixed(3)} Å</div>
                  </div>
                  <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-1">
                    <div className="text-[10px] text-slate-400">Vector |r_[{mtUvw.join('')}]|</div>
                    <div className="text-sm font-bold text-slate-100">{liveMetricCalc.directLengthA.toFixed(4)} Å</div>
                    <div className={`text-[10px] ${liveMetricCalc.weissDot === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      hu+kv+lw = {liveMetricCalc.weissDot} {liveMetricCalc.weissDot === 0 ? '(In Zone)' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REAL-WORLD MATERIALS & MINERALOGICAL EXAMPLES */}
      {viewMode === 'materials' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Crystallographic Reference Database
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-0.5">
                {showAllSystemsMaterials ? 'Complete 7-System Materials Catalog' : `Reference Crystals for ${activeSystem.name}`}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  playSynthTone('tick');
                  setCmSystemId(selectedSystemId);
                  setCmCentering(activeCentering);
                  setShowCustomMatModal(prev => !prev);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
                  showCustomMatModal
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-[#070A12] text-amber-400 border-amber-500/40 hover:border-amber-500/70'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Synthesize Custom Crystal</span>
              </button>

              <button
                onClick={() => { playSynthTone('tick'); setShowAllSystemsMaterials(prev => !prev); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                  showAllSystemsMaterials
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#0B0F19] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {showAllSystemsMaterials ? 'Showing All 7 Systems' : `Showing ${activeSystem.name.split(' ')[0]} Only`}
              </button>

              <div className="flex items-center gap-1 bg-[#070A12] p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                {(['All', 'Metal', 'Ceramic', 'Mineral', 'Semiconductor', 'Geological'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => { playSynthTone('tick'); setMaterialCategoryFilter(cat); }}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      materialCategoryFilter === cat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Custom Crystal Material Synthesizer Drawer */}
          {showCustomMatModal && (
            <form
              onSubmit={handleAddCustomCrystalMaterial}
              className="bg-[#0B0F19] border border-amber-500/40 rounded-xl p-5 space-y-4 font-mono"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                    Custom Crystallographic Phase Builder &amp; Structure-Factor Powder XRD Synthesizer
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-100">
                    Define Unit Cell Parameters, Bravais Centering &amp; Formula Units
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums bg-[#070A12] px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">
                    V_cell = <strong className="text-cyan-300">{customMaterialPreview.V.toFixed(2)} Å³</strong>
                  </span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-400">
                    ρ_calc = <strong className="text-amber-300">{customMaterialPreview.densityGcm3.toFixed(3)} g/cm³</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Material Name</label>
                  <input
                    type="text"
                    value={cmName}
                    onChange={e => setCmName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#070A12] border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Chemical Formula</label>
                  <input
                    type="text"
                    value={cmFormula}
                    onChange={e => setCmFormula(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#070A12] border border-slate-800 text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Category</label>
                  <select
                    value={cmCategory}
                    onChange={e => setCmCategory(e.target.value as 'Metal' | 'Ceramic' | 'Mineral' | 'Semiconductor' | 'Geological')}
                    className="w-full px-2.5 py-1.5 rounded bg-[#070A12] border border-slate-800 text-slate-200"
                  >
                    <option value="Ceramic">Ceramic</option>
                    <option value="Metal">Metal</option>
                    <option value="Semiconductor">Semiconductor</option>
                    <option value="Mineral">Mineral</option>
                    <option value="Geological">Geological</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Crystal System</label>
                  <select
                    value={cmSystemId}
                    onChange={e => {
                      const nextSys = e.target.value as CrystalSystemId;
                      setCmSystemId(nextSys);
                      if (nextSys === 'hexagonal' || nextSys === 'trigonal') {
                        setCmGamma(120);
                      } else {
                        setCmGamma(90);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-[#070A12] border border-slate-800 text-cyan-300"
                  >
                    {CRYSTAL_SYSTEMS_CATALOG.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Bravais Centering</label>
                  <select
                    value={cmCentering}
                    onChange={e => setCmCentering(e.target.value as CenteringType)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#070A12] border border-slate-800 text-amber-300 font-bold"
                  >
                    <option value="P">P (Primitive)</option>
                    <option value="I">I (Body-Centered)</option>
                    <option value="F">F (Face-Centered)</option>
                    <option value="C">C (Base-Centered)</option>
                    <option value="R">R (Rhombohedral)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Space Group</label>
                  <input
                    type="text"
                    value={cmSpaceGroup}
                    onChange={e => setCmSpaceGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-[#070A12] border border-slate-800 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5 text-xs tabular-nums">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">a (Å)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="2.0"
                    max="25.0"
                    value={cmA}
                    onChange={e => setCmA(Math.max(2.0, parseFloat(e.target.value) || 4.0))}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">b (Å)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="2.0"
                    max="25.0"
                    value={cmB}
                    onChange={e => setCmB(Math.max(2.0, parseFloat(e.target.value) || 4.0))}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">c (Å)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="2.0"
                    max="25.0"
                    value={cmC}
                    onChange={e => setCmC(Math.max(2.0, parseFloat(e.target.value) || 4.0))}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">α (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cmAlpha}
                    onChange={e => setCmAlpha(parseFloat(e.target.value) || 90)}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">β (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cmBeta}
                    onChange={e => setCmBeta(parseFloat(e.target.value) || 90)}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">γ (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cmGamma}
                    onChange={e => setCmGamma(parseFloat(e.target.value) || 90)}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">M (g/mol)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="4"
                    value={cmMolarMass}
                    onChange={e => setCmMolarMass(Math.max(4, parseFloat(e.target.value) || 100))}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-amber-300"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Formula Z</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="16"
                    value={cmZ}
                    onChange={e => setCmZ(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2 py-1.5 rounded bg-[#070A12] border border-slate-800 text-amber-300"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Add Crystal</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMaterials.map((mat, idx) => {
              const customMat = 'isCustom' in mat && mat.isCustom ? (mat as CustomMaterialEntry) : null;
              const targetCentering = customMat
                ? customMat.centering
                : inferCenteringFromLatticeType(mat.latticeType, mat.systemId);
              const stickPeaks = customMat && customMat.computedPeaks.length > 0
                ? customMat.computedPeaks
                : targetCentering === 'F'
                  ? [
                      { x: 34, h: 30, label: '111', color: '#38bdf8' },
                      { x: 48, h: 18, label: '200', color: '#38bdf8' },
                      { x: 78, h: 24, label: '220', color: '#38bdf8' },
                      { x: 104, h: 20, label: '311', color: '#38bdf8' },
                      { x: 116, h: 11, label: '222', color: '#38bdf8' },
                      { x: 146, h: 14, label: '400', color: '#38bdf8' },
                    ]
                  : targetCentering === 'I'
                  ? [
                      { x: 38, h: 30, label: '110', color: '#f59e0b' },
                      { x: 64, h: 16, label: '200', color: '#f59e0b' },
                      { x: 88, h: 25, label: '211', color: '#f59e0b' },
                      { x: 114, h: 14, label: '220', color: '#f59e0b' },
                      { x: 140, h: 18, label: '310', color: '#f59e0b' },
                    ]
                  : targetCentering === 'R'
                  ? [
                      { x: 28, h: 22, label: '012', color: '#f59e0b' },
                      { x: 48, h: 30, label: '104', color: '#f59e0b' },
                      { x: 64, h: 23, label: '110', color: '#f59e0b' },
                      { x: 88, h: 27, label: '116', color: '#f59e0b' },
                      { x: 118, h: 16, label: '024', color: '#f59e0b' },
                      { x: 144, h: 19, label: '300', color: '#f59e0b' },
                    ]
                  : targetCentering === 'C'
                  ? [
                      { x: 26, h: 25, label: '110', color: '#38bdf8' },
                      { x: 44, h: 30, label: '020', color: '#38bdf8' },
                      { x: 60, h: 20, label: '111', color: '#38bdf8' },
                      { x: 84, h: 23, label: '200', color: '#38bdf8' },
                      { x: 114, h: 18, label: '131', color: '#38bdf8' },
                      { x: 142, h: 15, label: '221', color: '#38bdf8' },
                    ]
                  : mat.systemId === 'hexagonal'
                  ? [
                      { x: 30, h: 21, label: '100', color: '#38bdf8' },
                      { x: 40, h: 19, label: '002', color: '#f59e0b' },
                      { x: 52, h: 30, label: '101', color: '#38bdf8' },
                      { x: 80, h: 18, label: '102', color: '#38bdf8' },
                      { x: 108, h: 22, label: '110', color: '#38bdf8' },
                      { x: 138, h: 19, label: '103', color: '#38bdf8' },
                    ]
                  : [
                      { x: 24, h: 26, label: '100', color: '#38bdf8' },
                      { x: 44, h: 30, label: '101', color: '#38bdf8' },
                      { x: 66, h: 21, label: '110', color: '#38bdf8' },
                      { x: 90, h: 24, label: '200', color: '#38bdf8' },
                      { x: 116, h: 18, label: '211', color: '#38bdf8' },
                      { x: 144, h: 16, label: '220', color: '#38bdf8' },
                    ];

              return (
                <div
                  key={`${mat.name}-${idx}`}
                  className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider">
                      <span className="text-slate-400 font-bold">
                        {mat.category} <span className="text-slate-700">·</span>{' '}
                        <span className="text-cyan-400">{mat.spaceGroup}</span>
                      </span>
                      <CrystalSystemMiniSchematic
                        systemId={mat.systemId}
                        centering={targetCentering}
                        isSelected={true}
                        size="sm"
                      />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-100">{mat.name}</h3>
                      <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">{mat.formula}</div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {mat.description}
                    </p>

                    {/* Calibrated Powder XRD Diffractogram & Stick Fingerprint */}
                    <div className="bg-[#070A12] border border-slate-800/90 rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span className="uppercase tracking-wider font-bold text-slate-300">
                          Powder XRD Fingerprint ({targetCentering}-Lattice)
                        </span>
                        <span className="text-cyan-400/80">Cu Kα₁ · 1.5406 Å</span>
                      </div>
                      <svg viewBox="0 0 170 52" className="w-full h-12 overflow-visible select-none">
                        <line x1="8" y1="14" x2="164" y2="14" stroke="#0f172a" strokeWidth="0.7" />
                        <line x1="8" y1="26" x2="164" y2="26" stroke="#0f172a" strokeWidth="0.7" />
                        <line x1="8" y1="38" x2="164" y2="38" stroke="#334155" strokeWidth="1" />
                        {[20, 40, 60, 80].map((deg, tIdx) => {
                          const tx = 18 + tIdx * 42;
                          return (
                            <g key={deg}>
                              <line x1={tx} y1="38" x2={tx} y2="41" stroke="#475569" strokeWidth="0.8" />
                              <text x={tx} y="48" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">
                                {deg}°
                              </text>
                            </g>
                          );
                        })}
                        {stickPeaks.map((pk, pIdx) => (
                          <g key={pIdx}>
                            <path
                              d={`M ${pk.x - 6} 38 Q ${pk.x} ${38 - pk.h * 1.15} ${pk.x + 6} 38`}
                              fill={pk.color}
                              fillOpacity="0.14"
                              stroke={pk.color}
                              strokeWidth="0.7"
                              strokeOpacity="0.45"
                            />
                            <line
                              x1={pk.x}
                              y1={38}
                              x2={pk.x}
                              y2={38 - pk.h}
                              stroke={pk.color}
                              strokeWidth="1.8"
                            />
                            <circle cx={pk.x} cy={38 - pk.h} r="1.6" fill="#f8fafc" stroke={pk.color} strokeWidth="0.9" />
                            <text
                              x={pk.x}
                              y={38 - pk.h - 3.5}
                              textAnchor="middle"
                              fill="#e2e8f0"
                              fontSize="6.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              {pk.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="truncate">{mat.latticeType}</span>
                    <button
                      onClick={() => {
                        playSynthTone('tick');
                        setSelectedSystemId(mat.systemId);
                        setActiveCentering(targetCentering);
                        setViewMode('3d');
                      }}
                      className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 font-bold text-[10px] shrink-0 flex items-center gap-1 transition-all"
                    >
                      <Rotate3d className="w-3 h-3" />
                      <span>Inspect 3D</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Insights Panel */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Crystallographic Selection &amp; Symmetry Notes — {activeSystem.name}</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {activeSystem.keyInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-sm bg-cyan-400 shrink-0 mt-1.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: KNOWLEDGE CHECK QUIZ */}
      {viewMode === 'quiz' && (
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-6 space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 flex-wrap gap-2">
            <div>
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Crystallographic Metrology Assessment
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mt-0.5">
                Unit Cells &amp; Crystal Systems Verification
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400 bg-[#070A12] px-3 py-1.5 rounded-lg border border-slate-800">
              {Object.keys(quizAnswers).length} / {quizQuestions.length} Answered
            </span>
          </div>

          <div className="space-y-4">
            {quizQuestions.map((q, qIdx) => {
              const selectedOpt = quizAnswers[qIdx];
              const isCorrect = selectedOpt === q.correct;

              return (
                <div key={qIdx} className="bg-[#070A12] p-5 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-sm font-bold text-slate-100 flex items-start gap-2.5 flex-1">
                      <span className="px-2 py-0.5 rounded bg-[#0B0F19] border border-cyan-500/40 text-cyan-400 font-mono text-xs shrink-0">
                        0{qIdx + 1}
                      </span>
                      <span>{q.question}</span>
                    </h3>

                    {/* 3D CAD Scientific Diagram for Each Question */}
                    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg px-3 py-2 shrink-0 flex items-center gap-3">
                      <svg viewBox="0 0 136 56" className="w-34 h-14 overflow-visible select-none">
                        <defs>
                          <radialGradient id={`qzTi-${qIdx}`} cx="32%" cy="28%" r="68%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="30%" stopColor="#cbd5e1" />
                            <stop offset="75%" stopColor="#475569" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </radialGradient>
                          <radialGradient id={`qzCy-${qIdx}`} cx="32%" cy="28%" r="68%">
                            <stop offset="0%" stopColor="#ecfeff" />
                            <stop offset="30%" stopColor="#38bdf8" />
                            <stop offset="75%" stopColor="#0369a1" />
                            <stop offset="100%" stopColor="#082f49" />
                          </radialGradient>
                          <radialGradient id={`qzAm-${qIdx}`} cx="32%" cy="28%" r="68%">
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="30%" stopColor="#fbbf24" />
                            <stop offset="75%" stopColor="#b45309" />
                            <stop offset="100%" stopColor="#451a03" />
                          </radialGradient>
                        </defs>
                        {qIdx === 0 && (
                          <g>
                            <rect x="12" y="8" width="40" height="40" fill="#0f172a" fillOpacity="0.6" stroke="#475569" strokeWidth="1.1" strokeDasharray="2.5 2" />
                            <polygon points="32,8 52,28 32,48 12,28" fill="#0891b2" fillOpacity="0.22" stroke="#38bdf8" strokeWidth="1.5" />
                            {[[32, 8], [52, 28], [32, 48], [12, 28]].map(([cx, cy], i) => (
                              <circle key={i} cx={cx} cy={cy} r="2.8" fill={`url(#qzCy-${qIdx})`} />
                            ))}
                            <circle cx="32" cy="28" r="3.8" fill={`url(#qzAm-${qIdx})`} />
                            <text x="94" y="24" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                              a&apos; = a / √2
                            </text>
                            <text x="94" y="38" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">
                              45° [110] Bain
                            </text>
                          </g>
                        )}
                        {qIdx === 1 && (
                          <g>
                            <polygon points="10,16 34,16 42,10 18,10" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                            <rect x="10" y="16" width="24" height="32" fill="#0c192c" stroke="#38bdf8" strokeWidth="1.3" />
                            <polygon points="34,16 42,10 42,42 34,48" fill="#091322" stroke="#475569" strokeWidth="1" />
                            <circle cx="10" cy="16" r="2.6" fill={`url(#qzTi-${qIdx})`} />
                            <circle cx="34" cy="16" r="2.6" fill={`url(#qzTi-${qIdx})`} />
                            <circle cx="10" cy="48" r="2.6" fill={`url(#qzTi-${qIdx})`} />
                            <circle cx="34" cy="48" r="2.6" fill={`url(#qzTi-${qIdx})`} />
                            <circle cx="25" cy="29" r="3.6" fill={`url(#qzAm-${qIdx})`} />
                            <text x="90" y="24" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                              a ≠ b ≠ c
                            </text>
                            <text x="90" y="38" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                              oP · oI · oF · oC
                            </text>
                          </g>
                        )}
                        {qIdx === 2 && (
                          <g>
                            <rect x="12" y="10" width="36" height="36" fill="#0c192c" stroke="#38bdf8" strokeWidth="1.4" />
                            {[[12, 10], [48, 10], [12, 46], [48, 46]].map(([cx, cy], i) => (
                              <circle key={i} cx={cx} cy={cy} r="3.2" fill={`url(#qzTi-${qIdx})`} />
                            ))}
                            <circle cx="30" cy="28" r="4.8" fill={`url(#qzCy-${qIdx})`} />
                            <text x="92" y="23" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                              8(⅛) + 6(½)
                            </text>
                            <text x="92" y="37" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontFamily="monospace">
                              Z_net = 4.00
                            </text>
                          </g>
                        )}
                        {qIdx === 3 && (
                          <g>
                            <polygon points="28,6 48,17 48,39 28,50 8,39 8,17" fill="#0c192c" stroke="#38bdf8" strokeWidth="1.3" />
                            <circle cx="28" cy="28" r="3.2" fill={`url(#qzTi-${qIdx})`} />
                            <circle cx="28" cy="16" r="3.2" fill={`url(#qzCy-${qIdx})`} />
                            <circle cx="38" cy="34" r="3.2" fill={`url(#qzAm-${qIdx})`} />
                            <text x="92" y="24" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">
                              Obverse hR
                            </text>
                            <text x="92" y="38" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontFamily="monospace">
                              −h + k + l = 3n
                            </text>
                          </g>
                        )}
                        {qIdx === 4 && (
                          <g>
                            <polygon points="18,12 52,12 42,44 8,44" fill="#0c192c" stroke="#38bdf8" strokeWidth="1.4" />
                            <line x1="18" y1="12" x2="42" y2="44" stroke="#f59e0b" strokeWidth="1.6" />
                            <line x1="52" y1="12" x2="8" y2="44" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2.5 2" />
                            <text x="94" y="24" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
                              β ≠ 90° Shear
                            </text>
                            <text x="94" y="38" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontFamily="monospace">
                              d(hkl) ≠ d(h̄kl)
                            </text>
                          </g>
                        )}
                        {qIdx === 5 && (
                          <g>
                            <line x1="8" y1="44" x2="126" y2="44" stroke="#334155" strokeWidth="1" />
                            <line x1="22" y1="44" x2="22" y2="12" stroke="#38bdf8" strokeWidth="2.4" />
                            <line x1="58" y1="44" x2="58" y2="18" stroke="#e2e8f0" strokeWidth="2" />
                            <line x1="68" y1="44" x2="68" y2="28" stroke="#e2e8f0" strokeWidth="2" />
                            <line x1="98" y1="44" x2="98" y2="22" stroke="#f59e0b" strokeWidth="1.8" />
                            <line x1="107" y1="44" x2="107" y2="24" stroke="#f59e0b" strokeWidth="1.8" />
                            <line x1="116" y1="44" x2="116" y2="26" stroke="#f59e0b" strokeWidth="1.8" />
                            <text x="22" y="53" textAnchor="middle" fill="#38bdf8" fontSize="6.5" fontFamily="monospace">m3̄m</text>
                            <text x="63" y="53" textAnchor="middle" fill="#e2e8f0" fontSize="6.5" fontFamily="monospace">4/mmm</text>
                            <text x="107" y="53" textAnchor="middle" fill="#f59e0b" fontSize="6.5" fontFamily="monospace">mmm</text>
                          </g>
                        )}
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      let btnStyle = 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-700';

                      if (quizSubmitted) {
                        if (optIdx === q.correct) {
                          btnStyle = 'bg-cyan-950/40 border-cyan-500 text-cyan-200 font-bold';
                        } else if (isOptionSelected) {
                          btnStyle = 'bg-amber-950/40 border-amber-500 text-amber-200';
                        }
                      } else if (isOptionSelected) {
                        btnStyle = 'bg-cyan-500/15 border-cyan-500/60 text-white font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => {
                            playSynthTone('tick');
                            setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                          }}
                          className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && optIdx === q.correct && (
                            <Check className="w-4 h-4 text-cyan-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className={`p-3.5 rounded-lg text-xs leading-relaxed border ${
                      isCorrect ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200' : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    }`}>
                      <p><strong>{isCorrect ? 'Verified. ' : 'Correction: '}</strong>{q.explanation}</p>
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
                className={`px-5 py-2.5 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition-all border ${
                  Object.keys(quizAnswers).length === quizQuestions.length
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#070A12] text-slate-600 border-slate-800 cursor-not-allowed'
                }`}
              >
                <span>Evaluate Responses</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center justify-between w-full font-mono">
                <span className="text-xs font-bold text-cyan-300 tabular-nums">
                  Score: {Object.entries(quizAnswers).filter(([k, v]) => v === quizQuestions[parseInt(k)].correct).length} / {quizQuestions.length} Verified
                </span>
                <button
                  onClick={() => {
                    playSynthTone('tick');
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#070A12] hover:bg-slate-900 text-slate-200 border border-slate-800 text-xs font-bold transition-all"
                >
                  Reset Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

