export type CrystalSystem = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Rhombohedral' | 'Orthorhombic' | 'Monoclinic' | 'Triclinic';

export interface LatticeParams {
  a: number;
  b: number;
  c: number;
  alpha: number; // in degrees
  beta: number;  // in degrees
  gamma: number; // in degrees
}

export interface MaterialPreset {
  id: string;
  name: string;
  formula: string;
  category: 'Metals & Elements' | 'Semiconductors & Solar' | 'Oxides & Ceramics' | 'Minerals & Clays' | 'Superconductors & 2D';
  system: CrystalSystem;
  params: LatticeParams;
  spaceGroup: string;
  description: string;
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  // Metals & Elements
  {
    id: 'si',
    name: 'Silicon (Diamond Cubic)',
    formula: 'Si',
    category: 'Metals & Elements',
    system: 'Cubic',
    params: { a: 5.431, b: 5.431, c: 5.431, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Fd-3m (227)',
    description: 'Standard semiconductor benchmark crystal.'
  },
  {
    id: 'diamond',
    name: 'Diamond (Carbon)',
    formula: 'C',
    category: 'Metals & Elements',
    system: 'Cubic',
    params: { a: 3.567, b: 3.567, c: 3.567, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Fd-3m (227)',
    description: 'High symmetry covalent face-centered diamond cubic lattice.'
  },
  {
    id: 'au',
    name: 'Gold (FCC Metal)',
    formula: 'Au',
    category: 'Metals & Elements',
    system: 'Cubic',
    params: { a: 4.078, b: 4.078, c: 4.078, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Fm-3m (225)',
    description: 'Face-centered cubic ductile noble metal.'
  },
  {
    id: 'fe_alpha',
    name: 'alpha-Iron (Ferrite BCC)',
    formula: 'α-Fe',
    category: 'Metals & Elements',
    system: 'Cubic',
    params: { a: 2.866, b: 2.866, c: 2.866, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Im-3m (229)',
    description: 'Body-centered cubic ferromagnetic iron.'
  },
  {
    id: 'mg',
    name: 'Magnesium (HCP)',
    formula: 'Mg',
    category: 'Metals & Elements',
    system: 'Hexagonal',
    params: { a: 3.209, b: 3.209, c: 5.211, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'P63/mmc (194)',
    description: 'Hexagonal close-packed lightweight structural metal.'
  },

  // Semiconductors & Solar
  {
    id: 'gan',
    name: 'Gallium Nitride (Wurtzite)',
    formula: 'GaN',
    category: 'Semiconductors & Solar',
    system: 'Hexagonal',
    params: { a: 3.189, b: 3.189, c: 5.185, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'P63mc (186)',
    description: 'Wide-bandgap semiconductor for optoelectronics and high-power electronics.'
  },
  {
    id: 'gaas',
    name: 'Gallium Arsenide (Zincblende)',
    formula: 'GaAs',
    category: 'Semiconductors & Solar',
    system: 'Cubic',
    params: { a: 5.653, b: 5.653, c: 5.653, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'F-43m (216)',
    description: 'Direct bandgap semiconductor for high-speed electronics.'
  },
  {
    id: 'mapi',
    name: 'Methylammonium Lead Iodide (Perovskite)',
    formula: 'CH₃NH₃PbI₃',
    category: 'Semiconductors & Solar',
    system: 'Tetragonal',
    params: { a: 8.849, b: 8.849, c: 12.642, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'I4/mcm (140)',
    description: 'High-efficiency hybrid halide solar cell absorber.'
  },
  {
    id: 'sic',
    name: 'Silicon Carbide (4H-SiC)',
    formula: '4H-SiC',
    category: 'Semiconductors & Solar',
    system: 'Hexagonal',
    params: { a: 3.073, b: 3.073, c: 10.053, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'P63mc (186)',
    description: 'High thermal conductivity wide-gap semiconductor.'
  },

  // Oxides & Ceramics
  {
    id: 'tio2',
    name: 'Rutile Titanium Dioxide',
    formula: 'TiO₂',
    category: 'Oxides & Ceramics',
    system: 'Tetragonal',
    params: { a: 4.594, b: 4.594, c: 2.958, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'P42/mnm (136)',
    description: 'High refractive index tetragonal transition metal oxide.'
  },
  {
    id: 'al2o3',
    name: 'Sapphire / Alumina (Corundum)',
    formula: 'α-Al₂O₃',
    category: 'Oxides & Ceramics',
    system: 'Hexagonal',
    params: { a: 4.758, b: 4.758, c: 12.991, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'R-3c (167)',
    description: 'Ultra-hard optical substrate and structural ceramic.'
  },
  {
    id: 'sio2',
    name: 'alpha-Quartz',
    formula: 'α-SiO₂',
    category: 'Oxides & Ceramics',
    system: 'Hexagonal',
    params: { a: 4.913, b: 4.913, c: 5.405, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'P3221 (154)',
    description: 'Piezoelectric crystal with chiral space group symmetry.'
  },
  {
    id: 'zro2',
    name: 'Monoclinic Zirconia (Baddeleyite)',
    formula: 'ZrO₂',
    category: 'Oxides & Ceramics',
    system: 'Monoclinic',
    params: { a: 5.151, b: 5.212, c: 5.317, alpha: 90, beta: 99.23, gamma: 90 },
    spaceGroup: 'P21/c (14)',
    description: 'Monoclinic phase ceramic prone to martensitic transformation.'
  },

  // Superconductors & 2D
  {
    id: 'ybco',
    name: 'YBCO High-Tc Superconductor',
    formula: 'YBa₂Cu₃O₇',
    category: 'Superconductors & 2D',
    system: 'Orthorhombic',
    params: { a: 3.823, b: 3.886, c: 11.681, alpha: 90, beta: 90, gamma: 90 },
    spaceGroup: 'Pmmm (47)',
    description: 'High-Tc cuprate superconductor with CuO2 plane anisotropy.'
  },
  {
    id: 'mgb2',
    name: 'Magnesium Diboride',
    formula: 'MgB₂',
    category: 'Superconductors & 2D',
    system: 'Hexagonal',
    params: { a: 3.086, b: 3.086, c: 3.524, alpha: 90, beta: 90, gamma: 120 },
    spaceGroup: 'P6/mmm (191)',
    description: 'Two-gap conventional BCS superconductor (Tc = 39 K).'
  },

  // Minerals & Clays
  {
    id: 'kaolinite',
    name: 'Triclinic Kaolinite Clay',
    formula: 'Al₂Si₂O₅(OH)₄',
    category: 'Minerals & Clays',
    system: 'Triclinic',
    params: { a: 5.150, b: 8.950, c: 7.390, alpha: 91.8, beta: 104.7, gamma: 90.0 },
    spaceGroup: 'P1 (1)',
    description: 'Low-symmetry layered aluminosilicate clay mineral.'
  },
  {
    id: 'calcite',
    name: 'Calcite (Rhombohedral)',
    formula: 'CaCO₃',
    category: 'Minerals & Clays',
    system: 'Rhombohedral',
    params: { a: 6.375, b: 6.375, c: 6.375, alpha: 46.08, beta: 46.08, gamma: 46.08 },
    spaceGroup: 'R-3c (167)',
    description: 'Strongly birefringent carbonate mineral in rhombohedral setting.'
  }
];

export const PRESET_SYSTEMS: Record<CrystalSystem, { name: string; params: LatticeParams; symmetryDesc: string }> = {
  Cubic: {
    name: 'Cubic',
    params: { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 },
    symmetryDesc: 'a = b = c, α = β = γ = 90° (Isotropic metric G = a² · I)'
  },
  Tetragonal: {
    name: 'Tetragonal',
    params: { a: 4.50, b: 4.50, c: 7.20, alpha: 90, beta: 90, gamma: 90 },
    symmetryDesc: 'a = b ≠ c, α = β = γ = 90° (Diagonal metric G)'
  },
  Hexagonal: {
    name: 'Hexagonal',
    params: { a: 3.21, b: 3.21, c: 5.21, alpha: 90, beta: 90, gamma: 120 },
    symmetryDesc: 'a = b ≠ c, α = β = 90°, γ = 120° (g₁₂ = -a²/2)'
  },
  Rhombohedral: {
    name: 'Rhombohedral',
    params: { a: 5.12, b: 5.12, c: 5.12, alpha: 85, beta: 85, gamma: 85 },
    symmetryDesc: 'a = b = c, α = β = γ ≠ 90° (Uniform off-diagonal elements)'
  },
  Orthorhombic: {
    name: 'Orthorhombic',
    params: { a: 4.20, b: 5.80, c: 7.10, alpha: 90, beta: 90, gamma: 90 },
    symmetryDesc: 'a ≠ b ≠ c, α = β = γ = 90° (Diagonal metric G = diag(a², b², c²))'
  },
  Monoclinic: {
    name: 'Monoclinic',
    params: { a: 5.40, b: 6.20, c: 7.80, alpha: 90, beta: 99.5, gamma: 90 },
    symmetryDesc: 'a ≠ b ≠ c, α = γ = 90°, β ≠ 90° (Single off-diagonal g₁₃ = ac cosβ)'
  },
  Triclinic: {
    name: 'Triclinic',
    params: { a: 5.10, b: 6.40, c: 7.30, alpha: 82, beta: 98, gamma: 105 },
    symmetryDesc: 'a ≠ b ≠ c, α ≠ β ≠ γ ≠ 90° (Fully populated 6-parameter tensor)'
  }
};

export const fmt = (num: number, digits: number = 4) => {
  if (isNaN(num) || !isFinite(num)) return '-';
  return num.toFixed(digits);
};

export function solveSymmetricEigenvalues3x3(M: number[][]): [number, number, number] {
  const m11 = M[0][0], m12 = M[0][1], m13 = M[0][2];
  const m22 = M[1][1], m23 = M[1][2];
  const m33 = M[2][2];

  const p1 = m12 * m12 + m13 * m13 + m23 * m23;
  if (p1 === 0) {
    const vals = [m11, m22, m33].sort((x, y) => y - x);
    return [vals[0], vals[1], vals[2]];
  }

  const q = (m11 + m22 + m33) / 3;
  const p2 = (m11 - q) * (m11 - q) + (m22 - q) * (m22 - q) + (m33 - q) * (m33 - q) + 2 * p1;
  const p = Math.sqrt(p2 / 6);

  const b11 = (m11 - q) / p, b22 = (m22 - q) / p, b33 = (m33 - q) / p;
  const b12 = m12 / p, b13 = m13 / p, b23 = m23 / p;

  const detB = (
    b11 * (b22 * b33 - b23 * b23) -
    b12 * (b12 * b33 - b23 * b13) +
    b13 * (b12 * b23 - b22 * b13)
  );

  const r = Math.max(-1, Math.min(1, detB / 2));
  const phi = Math.acos(r) / 3;

  const eig1 = q + 2 * p * Math.cos(phi);
  const eig3 = q + 2 * p * Math.cos(phi + (2 * Math.PI / 3));
  const eig2 = 3 * q - eig1 - eig3;

  const res = [eig1, eig2, eig3].sort((x, y) => y - x);
  return [res[0], res[1], res[2]];
}
