import { CrystalSystem } from '../../types';

export interface GeneralLatticeParams {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export const DEFAULT_LATTICE_BY_SYSTEM: Record<CrystalSystem, GeneralLatticeParams> = {
  SC: { a: 3.35, b: 3.35, c: 3.35, alpha: 90, beta: 90, gamma: 90 },
  Cubic: { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 },
  BCC: { a: 2.8665, b: 2.8665, c: 2.8665, alpha: 90, beta: 90, gamma: 90 },
  FCC: { a: 4.0495, b: 4.0495, c: 4.0495, alpha: 90, beta: 90, gamma: 90 },
  Diamond: { a: 5.4309, b: 5.4309, c: 5.4309, alpha: 90, beta: 90, gamma: 90 },
  Hexagonal: { a: 3.209, b: 3.209, c: 5.211, alpha: 90, beta: 90, gamma: 120 },
  Rhombohedral: { a: 4.759, b: 4.759, c: 12.991, alpha: 90, beta: 90, gamma: 120 },
  Tetragonal: { a: 4.594, b: 4.594, c: 2.959, alpha: 90, beta: 90, gamma: 90 },
  Tetragonal_I: { a: 3.785, b: 3.785, c: 9.514, alpha: 90, beta: 90, gamma: 90 },
  Orthorhombic: { a: 4.756, b: 10.207, c: 5.980, alpha: 90, beta: 90, gamma: 90 },
  Orthorhombic_I: { a: 5.60, b: 5.53, c: 9.55, alpha: 90, beta: 90, gamma: 90 },
  Orthorhombic_F: { a: 5.83, b: 8.15, c: 11.42, alpha: 90, beta: 90, gamma: 90 },
  Orthorhombic_C: { a: 2.854, b: 5.869, c: 4.955, alpha: 90, beta: 90, gamma: 90 },
  Monoclinic: { a: 5.150, b: 5.212, c: 5.317, alpha: 90, beta: 99.23, gamma: 90 },
  Monoclinic_C: { a: 5.680, b: 15.180, c: 6.520, alpha: 90, beta: 118.4, gamma: 90 },
  Triclinic: { a: 6.658, b: 7.853, c: 5.574, alpha: 90.0, beta: 101.1, gamma: 106.0 },
};

/**
 * Exact 6-parameter reciprocal metric tensor d_hkl calculator (Å).
 * Accurate for all 7 crystal systems including Monoclinic (β ≠ 90°), Triclinic (α,β,γ ≠ 90°),
 * and Hexagonal/Rhombohedral (γ = 120°).
 */
export function computeExactDSpacing(
  h: number,
  k: number,
  l: number,
  lattice: GeneralLatticeParams
): number {
  if (h === 0 && k === 0 && l === 0) return 0;
  const { a, b, c, alpha, beta, gamma } = lattice;
  if (a <= 0 || b <= 0 || c <= 0) return 0;

  const deg2rad = Math.PI / 180;
  const al = alpha * deg2rad;
  const be = beta * deg2rad;
  const ga = gamma * deg2rad;

  const cosA = Math.cos(al);
  const cosB = Math.cos(be);
  const cosG = Math.cos(ga);
  const sinA = Math.sin(al);
  const sinB = Math.sin(be);
  const sinG = Math.sin(ga);

  const volFactor = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG;
  if (volFactor <= 1e-8) return 0;

  const V2 = a * a * b * b * c * c * volFactor;
  const S11 = b * b * c * c * sinA * sinA;
  const S22 = a * a * c * c * sinB * sinB;
  const S33 = a * a * b * b * sinG * sinG;
  const S12 = a * b * c * c * (cosA * cosB - cosG);
  const S23 = a * a * b * c * (cosB * cosG - cosA);
  const S13 = a * b * b * c * (cosG * cosA - cosB);

  const invD2 =
    (S11 * h * h + S22 * k * k + S33 * l * l + 2 * S12 * h * k + 2 * S23 * k * l + 2 * S13 * h * l) / V2;
  return invD2 > 1e-10 ? 1 / Math.sqrt(invD2) : 0;
}

const modPos = (n: number, m: number) => ((n % m) + m) % m;

export type ExtinctionTier = 'Integral (Centering)' | 'Zonal (Glide Plane)' | 'Serial (Screw Axis)' | 'Special Wyckoff / Basis';

export interface SpaceGroupExtinctionRule {
  id: string;
  tier: ExtinctionTier;
  operatorLabel: string; // e.g., "c-glide ⊥ b"
  zoneLabel: string;     // e.g., "h 0 l"
  conditionText: string; // e.g., "l = 2n"
  appliesTo: (h: number, k: number, l: number) => boolean;
  isAllowed: (h: number, k: number, l: number) => boolean;
}

export interface SpaceGroupExtinctionProfile {
  id: string;
  number: number;
  hmSymbol: string;
  extinctionSymbol: string;
  crystalSystem: string;
  mappedSystem: CrystalSystem;
  bravaisPearson: string;
  laueClass: string;
  centrosymmetric: boolean;
  prototypeMaterials: string;
  diagnosticHkls: [number, number, number][];
  rules: SpaceGroupExtinctionRule[];
  defaultLattice: GeneralLatticeParams;
}

const isEven = (n: number) => modPos(n, 2) === 0;
const isUnmixed = (h: number, k: number, l: number) => {
  const ph = modPos(h, 2);
  const pk = modPos(k, 2);
  const pl = modPos(l, 2);
  return ph === pk && pk === pl;
};

const ruleI: SpaceGroupExtinctionRule = {
  id: 'centering-I',
  tier: 'Integral (Centering)',
  operatorLabel: 'I-centering (+½, +½, +½)',
  zoneLabel: 'h k l',
  conditionText: 'h + k + l = 2n',
  appliesTo: () => true,
  isAllowed: (h, k, l) => isEven(h + k + l),
};

const ruleF: SpaceGroupExtinctionRule = {
  id: 'centering-F',
  tier: 'Integral (Centering)',
  operatorLabel: 'F-centering (face translations)',
  zoneLabel: 'h k l',
  conditionText: 'h, k, l all even or all odd',
  appliesTo: () => true,
  isAllowed: (h, k, l) => isUnmixed(h, k, l),
};

const ruleC: SpaceGroupExtinctionRule = {
  id: 'centering-C',
  tier: 'Integral (Centering)',
  operatorLabel: 'C-centering (+½, +½, 0)',
  zoneLabel: 'h k l',
  conditionText: 'h + k = 2n',
  appliesTo: () => true,
  isAllowed: (h, k) => isEven(h + k),
};

const ruleRObverse: SpaceGroupExtinctionRule = {
  id: 'centering-R',
  tier: 'Integral (Centering)',
  operatorLabel: 'R-centering Obverse (⅔,⅓,⅓), (⅓,⅔,⅔)',
  zoneLabel: 'h k l',
  conditionText: '−h + k + l = 3n',
  appliesTo: () => true,
  isAllowed: (h, k, l) => modPos(-h + k + l, 3) === 0,
};

/**
 * 20 canonical International Tables Vol. A space groups covering Integral (Centering),
 * Zonal (Glide Planes: a, b, c, n, d), and Serial (Screw Axes: 2₁, 4₁, 4₂, 6₃) absences.
 */
export const SPACE_GROUP_EXTINCTION_CATALOG: SpaceGroupExtinctionProfile[] = [
  {
    id: 'sg-221',
    number: 221,
    hmSymbol: 'Pm-3m',
    extinctionSymbol: 'P - - -',
    crystalSystem: 'Cubic',
    mappedSystem: 'SC',
    bravaisPearson: 'cP',
    laueClass: 'm-3m',
    centrosymmetric: true,
    prototypeMaterials: 'α-Po, CsCl (B2), SrTiO₃ Perovskite',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0], [2, 1, 0], [2, 1, 1]],
    rules: [],
    defaultLattice: { a: 3.905, b: 3.905, c: 3.905, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-229',
    number: 229,
    hmSymbol: 'Im-3m',
    extinctionSymbol: 'I - - -',
    crystalSystem: 'Cubic',
    mappedSystem: 'BCC',
    bravaisPearson: 'cI',
    laueClass: 'm-3m',
    centrosymmetric: true,
    prototypeMaterials: 'α-Fe, W, Cr, Mo, β-Ti',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0], [2, 1, 0], [2, 1, 1]],
    rules: [ruleI],
    defaultLattice: { a: 2.8665, b: 2.8665, c: 2.8665, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-225',
    number: 225,
    hmSymbol: 'Fm-3m',
    extinctionSymbol: 'F - - -',
    crystalSystem: 'Cubic',
    mappedSystem: 'FCC',
    bravaisPearson: 'cF',
    laueClass: 'm-3m',
    centrosymmetric: true,
    prototypeMaterials: 'Cu, Al, Au, Ni, NaCl, CaF₂, UO₂',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0], [2, 1, 0], [2, 2, 0], [3, 1, 1]],
    rules: [ruleF],
    defaultLattice: { a: 4.0495, b: 4.0495, c: 4.0495, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-227',
    number: 227,
    hmSymbol: 'Fd-3m',
    extinctionSymbol: 'F d - -',
    crystalSystem: 'Cubic',
    mappedSystem: 'Diamond',
    bravaisPearson: 'cF',
    laueClass: 'm-3m',
    centrosymmetric: true,
    prototypeMaterials: 'Si, Ge, Diamond, Fe₃O₄ Magnetite, MgAl₂O₄ Spinel',
    diagnosticHkls: [[1, 1, 1], [2, 0, 0], [2, 2, 0], [3, 1, 1], [2, 2, 2], [4, 0, 0], [0, 2, 4]],
    rules: [
      ruleF,
      {
        id: 'sg227-d-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'd-glide ⊥ ⟨100⟩',
        zoneLabel: '0 k l (cyclic)',
        conditionText: 'k + l = 4n (k,l = 2n)',
        appliesTo: (h, k, l) => h === 0 || k === 0 || l === 0,
        isAllowed: (h, k, l) => {
          if (h === 0) return isEven(k) && isEven(l) && modPos(k + l, 4) === 0;
          if (k === 0) return isEven(h) && isEven(l) && modPos(h + l, 4) === 0;
          if (l === 0) return isEven(h) && isEven(k) && modPos(h + k, 4) === 0;
          return true;
        },
      },
      {
        id: 'sg227-41-screw',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '4₁ screw || ⟨100⟩',
        zoneLabel: 'h 0 0 (cyclic)',
        conditionText: 'h = 4n',
        appliesTo: (h, k, l) =>
          (k === 0 && l === 0) || (h === 0 && l === 0) || (h === 0 && k === 0),
        isAllowed: (h, k, l) => modPos(h + k + l, 4) === 0,
      },
    ],
    defaultLattice: { a: 5.4309, b: 5.4309, c: 5.4309, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-205',
    number: 205,
    hmSymbol: 'Pa-3',
    extinctionSymbol: 'P a - -',
    crystalSystem: 'Cubic',
    mappedSystem: 'SC',
    bravaisPearson: 'cP',
    laueClass: 'm-3',
    centrosymmetric: true,
    prototypeMaterials: 'Pyrite FeS₂, Solid CO₂ (Dry Ice)',
    diagnosticHkls: [[1, 0, 0], [2, 0, 0], [0, 1, 2], [0, 2, 1], [1, 1, 1], [2, 1, 0], [3, 1, 1]],
    rules: [
      {
        id: 'sg205-a-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'Cyclic a/b/c-glide (0kl: k=2n, h0l: l=2n, hk0: h=2n)',
        zoneLabel: '0kl / h0l / hk0',
        conditionText: 'k=2n / l=2n / h=2n',
        appliesTo: (h, k, l) => h === 0 || k === 0 || l === 0,
        isAllowed: (h, k, l) => {
          if (h === 0 && !isEven(k)) return false;
          if (k === 0 && !isEven(l)) return false;
          if (l === 0 && !isEven(h)) return false;
          return true;
        },
      },
      {
        id: 'sg205-21-screw',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '2₁ screw || ⟨100⟩',
        zoneLabel: 'h 0 0 (cyclic)',
        conditionText: 'h = 2n',
        appliesTo: (h, k, l) =>
          (k === 0 && l === 0) || (h === 0 && l === 0) || (h === 0 && k === 0),
        isAllowed: (h, k, l) => isEven(h + k + l),
      },
    ],
    defaultLattice: { a: 5.417, b: 5.417, c: 5.417, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-230',
    number: 230,
    hmSymbol: 'Ia-3d',
    extinctionSymbol: 'I a - d',
    crystalSystem: 'Cubic',
    mappedSystem: 'BCC',
    bravaisPearson: 'cI',
    laueClass: 'm-3m',
    centrosymmetric: true,
    prototypeMaterials: 'YAG (Y₃Al₅O₁₂), Grossular & Pyrope Garnets',
    diagnosticHkls: [[1, 1, 0], [2, 1, 1], [2, 2, 0], [3, 2, 1], [4, 0, 0], [4, 2, 0], [3, 3, 2]],
    rules: [
      ruleI,
      {
        id: 'sg230-a-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'a/b/c-glide ⊥ ⟨100⟩',
        zoneLabel: '0 k l (cyclic)',
        conditionText: 'k, l = 2n',
        appliesTo: (h, k, l) => h === 0 || k === 0 || l === 0,
        isAllowed: (h, k, l) => {
          if (h === 0) return isEven(k) && isEven(l);
          if (k === 0) return isEven(h) && isEven(l);
          if (l === 0) return isEven(h) && isEven(k);
          return true;
        },
      },
      {
        id: 'sg230-d-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'd-glide ⊥ ⟨110⟩',
        zoneLabel: 'h h l (cyclic)',
        conditionText: '2h + l = 4n',
        appliesTo: (h, k, l) => Math.abs(h) === Math.abs(k) || Math.abs(k) === Math.abs(l) || Math.abs(h) === Math.abs(l),
        isAllowed: (h, k, l) => {
          if (Math.abs(h) === Math.abs(k) && modPos(2 * Math.abs(h) + Math.abs(l), 4) !== 0) return false;
          if (Math.abs(k) === Math.abs(l) && modPos(2 * Math.abs(k) + Math.abs(h), 4) !== 0) return false;
          if (Math.abs(h) === Math.abs(l) && modPos(2 * Math.abs(h) + Math.abs(k), 4) !== 0) return false;
          return true;
        },
      },
    ],
    defaultLattice: { a: 12.008, b: 12.008, c: 12.008, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-194',
    number: 194,
    hmSymbol: 'P6₃/mmc',
    extinctionSymbol: 'P 6₃ - c',
    crystalSystem: 'Hexagonal',
    mappedSystem: 'Hexagonal',
    bravaisPearson: 'hP',
    laueClass: '6/mmm',
    centrosymmetric: true,
    prototypeMaterials: 'α-Ti, Mg, Zn, Zr, Graphite (2H), Co (HCP)',
    diagnosticHkls: [[1, 0, 0], [0, 0, 1], [0, 0, 2], [1, 0, 1], [1, 1, 0], [1, 1, 1], [1, 1, 2], [0, 0, 3]],
    rules: [
      {
        id: 'sg194-c-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'c-glide ⊥ [11̄0]',
        zoneLabel: 'h h l',
        conditionText: 'l = 2n',
        appliesTo: (h, k) => h === k,
        isAllowed: (_h, _k, l) => isEven(l),
      },
      {
        id: 'sg194-63-screw',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '6₃ screw || c',
        zoneLabel: '0 0 l',
        conditionText: 'l = 2n',
        appliesTo: (h, k) => h === 0 && k === 0,
        isAllowed: (_h, _k, l) => isEven(l),
      },
    ],
    defaultLattice: { a: 2.951, b: 2.951, c: 4.684, alpha: 90, beta: 90, gamma: 120 },
  },
  {
    id: 'sg-176',
    number: 176,
    hmSymbol: 'P6₃/m',
    extinctionSymbol: 'P 6₃ - -',
    crystalSystem: 'Hexagonal',
    mappedSystem: 'Hexagonal',
    bravaisPearson: 'hP',
    laueClass: '6/m',
    centrosymmetric: true,
    prototypeMaterials: 'Hydroxyapatite Ca₁₀(PO₄)₆(OH)₂, Fluorapatite',
    diagnosticHkls: [[1, 0, 0], [0, 0, 1], [0, 0, 2], [2, 1, 1], [1, 1, 1], [1, 1, 2], [3, 0, 0], [0, 0, 3]],
    rules: [
      {
        id: 'sg176-63-screw',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '6₃ screw || c',
        zoneLabel: '0 0 l',
        conditionText: 'l = 2n',
        appliesTo: (h, k) => h === 0 && k === 0,
        isAllowed: (_h, _k, l) => isEven(l),
      },
    ],
    defaultLattice: { a: 9.418, b: 9.418, c: 6.884, alpha: 90, beta: 90, gamma: 120 },
  },
  {
    id: 'sg-167',
    number: 167,
    hmSymbol: 'R-3c',
    extinctionSymbol: 'R - c',
    crystalSystem: 'Trigonal',
    mappedSystem: 'Rhombohedral',
    bravaisPearson: 'hR',
    laueClass: '-3m',
    centrosymmetric: true,
    prototypeMaterials: 'Corundum α-Al₂O₃, Hematite α-Fe₂O₃, Calcite CaCO₃, β-TCP',
    diagnosticHkls: [[0, 1, 2], [1, 0, 4], [1, 1, 0], [1, 1, 3], [0, 2, 4], [1, 1, 6], [0, 0, 3], [0, 0, 6]],
    rules: [
      ruleRObverse,
      {
        id: 'sg167-c-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'c-glide ⊥ ⟨210⟩',
        zoneLabel: 'h 0 l / 0 k l / h h̄ l',
        conditionText: 'l = 2n',
        appliesTo: (h, k) => h === 0 || k === 0 || h === -k,
        isAllowed: (_h, _k, l) => isEven(l),
      },
      {
        id: 'sg167-00l',
        tier: 'Serial (Screw Axis)',
        operatorLabel: 'R + c-glide combined on [001]',
        zoneLabel: '0 0 l',
        conditionText: 'l = 6n',
        appliesTo: (h, k) => h === 0 && k === 0,
        isAllowed: (_h, _k, l) => modPos(l, 6) === 0,
      },
    ],
    defaultLattice: { a: 4.759, b: 4.759, c: 12.991, alpha: 90, beta: 90, gamma: 120 },
  },
  {
    id: 'sg-136',
    number: 136,
    hmSymbol: 'P4₂/mnm',
    extinctionSymbol: 'P 4₂/n - -',
    crystalSystem: 'Tetragonal',
    mappedSystem: 'Tetragonal',
    bravaisPearson: 'tP',
    laueClass: '4/mmm',
    centrosymmetric: true,
    prototypeMaterials: 'Rutile TiO₂, Cassiterite SnO₂, Stishovite SiO₂',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [1, 0, 1], [2, 0, 0], [1, 1, 1], [2, 1, 1], [0, 0, 1], [0, 0, 2]],
    rules: [
      {
        id: 'sg136-n-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'n-glide ⊥ [100] & [010]',
        zoneLabel: '0 k l & h 0 l',
        conditionText: 'k + l = 2n / h + l = 2n',
        appliesTo: (h, k) => h === 0 || k === 0,
        isAllowed: (h, k, l) => (h === 0 ? isEven(k + l) : true) && (k === 0 ? isEven(h + l) : true),
      },
      {
        id: 'sg136-42-screw',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '4₂ screw || c & 2₁ || a,b',
        zoneLabel: '00l / h00 / 0k0',
        conditionText: 'l=2n / h=2n / k=2n',
        appliesTo: (h, k, l) =>
          (h === 0 && k === 0) || (k === 0 && l === 0) || (h === 0 && l === 0),
        isAllowed: (h, k, l) => isEven(h + k + l),
      },
    ],
    defaultLattice: { a: 4.594, b: 4.594, c: 2.959, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-139',
    number: 139,
    hmSymbol: 'I4/mmm',
    extinctionSymbol: 'I - - -',
    crystalSystem: 'Tetragonal',
    mappedSystem: 'Tetragonal_I',
    bravaisPearson: 'tI',
    laueClass: '4/mmm',
    centrosymmetric: true,
    prototypeMaterials: 't-ZrO₂ (pseudo), La₂CuO₄, Indium, BaFe₂As₂',
    diagnosticHkls: [[1, 0, 0], [1, 0, 1], [1, 1, 0], [0, 0, 2], [1, 1, 2], [2, 0, 0]],
    rules: [ruleI],
    defaultLattice: { a: 3.605, b: 3.605, c: 5.180, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-141',
    number: 141,
    hmSymbol: 'I4₁/amd',
    extinctionSymbol: 'I 4₁ - d',
    crystalSystem: 'Tetragonal',
    mappedSystem: 'Tetragonal_I',
    bravaisPearson: 'tI',
    laueClass: '4/mmm',
    centrosymmetric: true,
    prototypeMaterials: 'Anatase TiO₂, Zircon ZrSiO₄, β-Sn (White Tin)',
    diagnosticHkls: [[1, 0, 1], [1, 0, 3], [0, 0, 2], [0, 0, 4], [1, 1, 2], [2, 0, 0], [2, 1, 1], [1, 1, 0]],
    rules: [
      ruleI,
      {
        id: 'sg141-a-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'a/b-glide ⊥ c',
        zoneLabel: 'h k 0',
        conditionText: 'h = 2n, k = 2n',
        appliesTo: (_h, _k, l) => l === 0,
        isAllowed: (h, k) => isEven(h) && isEven(k),
      },
      {
        id: 'sg141-d-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'd-glide ⊥ [110]',
        zoneLabel: 'h h l',
        conditionText: '2h + l = 4n',
        appliesTo: (h, k) => Math.abs(h) === Math.abs(k),
        isAllowed: (h, _k, l) => modPos(2 * Math.abs(h) + Math.abs(l), 4) === 0,
      },
      {
        id: 'sg141-41-screw',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '4₁ screw || c',
        zoneLabel: '0 0 l',
        conditionText: 'l = 4n',
        appliesTo: (h, k) => h === 0 && k === 0,
        isAllowed: (_h, _k, l) => modPos(l, 4) === 0,
      },
    ],
    defaultLattice: { a: 3.785, b: 3.785, c: 9.514, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-62',
    number: 62,
    hmSymbol: 'Pnma',
    extinctionSymbol: 'P n - a',
    crystalSystem: 'Orthorhombic',
    mappedSystem: 'Orthorhombic',
    bravaisPearson: 'oP',
    laueClass: 'mmm',
    centrosymmetric: true,
    prototypeMaterials: 'Olivine (Mg,Fe)₂SiO₄, Cementite Fe₃C, Aragonite CaCO₃, LiFePO₄, GdFeO₃',
    diagnosticHkls: [[1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 1], [0, 2, 1], [1, 1, 0], [2, 1, 0], [1, 1, 1], [2, 0, 0]],
    rules: [
      {
        id: 'sg62-n-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'n-glide ⊥ a',
        zoneLabel: '0 k l',
        conditionText: 'k + l = 2n',
        appliesTo: (h) => h === 0,
        isAllowed: (_h, k, l) => isEven(k + l),
      },
      {
        id: 'sg62-a-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'a-glide ⊥ c',
        zoneLabel: 'h k 0',
        conditionText: 'h = 2n',
        appliesTo: (_h, _k, l) => l === 0,
        isAllowed: (h) => isEven(h),
      },
      {
        id: 'sg62-21-screws',
        tier: 'Serial (Screw Axis)',
        operatorLabel: 'Three 2₁ screws || a, b, c',
        zoneLabel: 'h00 / 0k0 / 00l',
        conditionText: 'h=2n / k=2n / l=2n',
        appliesTo: (h, k, l) =>
          (k === 0 && l === 0) || (h === 0 && l === 0) || (h === 0 && k === 0),
        isAllowed: (h, k, l) => isEven(h + k + l),
      },
    ],
    defaultLattice: { a: 10.332, b: 6.010, c: 4.692, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-63',
    number: 63,
    hmSymbol: 'Cmcm',
    extinctionSymbol: 'C - c -',
    crystalSystem: 'Orthorhombic',
    mappedSystem: 'Orthorhombic_C',
    bravaisPearson: 'oC',
    laueClass: 'mmm',
    centrosymmetric: true,
    prototypeMaterials: 'α-Uranium (α-U), Boehmite γ-AlO(OH), Post-Perovskite MgSiO₃',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [0, 2, 0], [0, 2, 1], [1, 1, 1], [0, 0, 1], [0, 0, 2], [2, 0, 1]],
    rules: [
      ruleC,
      {
        id: 'sg63-c-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'c-glide ⊥ b',
        zoneLabel: 'h 0 l',
        conditionText: 'l = 2n',
        appliesTo: (_h, k) => k === 0,
        isAllowed: (_h, _k, l) => isEven(l),
      },
      {
        id: 'sg63-21-c',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '2₁ screw || c',
        zoneLabel: '0 0 l',
        conditionText: 'l = 2n',
        appliesTo: (h, k) => h === 0 && k === 0,
        isAllowed: (_h, _k, l) => isEven(l),
      },
    ],
    defaultLattice: { a: 2.854, b: 5.869, c: 4.955, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-71',
    number: 71,
    hmSymbol: 'Immm',
    extinctionSymbol: 'I - - -',
    crystalSystem: 'Orthorhombic',
    mappedSystem: 'Orthorhombic_I',
    bravaisPearson: 'oI',
    laueClass: 'mmm',
    centrosymmetric: true,
    prototypeMaterials: 'γ-Sn, High-T La₂NiO₄, YBa₂Cu₃O₇-related',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [1, 0, 1], [0, 1, 1], [1, 1, 1], [2, 0, 0]],
    rules: [ruleI],
    defaultLattice: { a: 5.60, b: 5.53, c: 9.55, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-69',
    number: 69,
    hmSymbol: 'Fmmm',
    extinctionSymbol: 'F - - -',
    crystalSystem: 'Orthorhombic',
    mappedSystem: 'Orthorhombic_F',
    bravaisPearson: 'oF',
    laueClass: 'mmm',
    centrosymmetric: true,
    prototypeMaterials: 'α-Plutonium (δ-related), TiSi₂ (Fddd parent)',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0], [2, 2, 0], [3, 1, 1]],
    rules: [ruleF],
    defaultLattice: { a: 5.83, b: 8.15, c: 11.42, alpha: 90, beta: 90, gamma: 90 },
  },
  {
    id: 'sg-14',
    number: 14,
    hmSymbol: 'P2₁/c',
    extinctionSymbol: 'P 1 2₁/c 1',
    crystalSystem: 'Monoclinic',
    mappedSystem: 'Monoclinic',
    bravaisPearson: 'mP',
    laueClass: '2/m',
    centrosymmetric: true,
    prototypeMaterials: 'Baddeleyite m-ZrO₂, Monazite CePO₄, α-Pu (P2₁/m), Most Organic Crystals',
    diagnosticHkls: [[1, 0, 0], [0, 1, 0], [0, 2, 0], [1, 0, 1], [1, 0, 2], [-1, 1, 1], [1, 1, 1], [0, 0, 1], [0, 0, 2]],
    rules: [
      {
        id: 'sg14-c-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'c-glide ⊥ b',
        zoneLabel: 'h 0 l',
        conditionText: 'l = 2n',
        appliesTo: (_h, k) => k === 0,
        isAllowed: (_h, _k, l) => isEven(l),
      },
      {
        id: 'sg14-21-screw',
        tier: 'Serial (Screw Axis)',
        operatorLabel: '2₁ screw || b',
        zoneLabel: '0 k 0',
        conditionText: 'k = 2n',
        appliesTo: (h, _k, l) => h === 0 && l === 0,
        isAllowed: (_h, k) => isEven(k),
      },
    ],
    defaultLattice: { a: 5.150, b: 5.212, c: 5.317, alpha: 90, beta: 99.23, gamma: 90 },
  },
  {
    id: 'sg-15',
    number: 15,
    hmSymbol: 'C2/c',
    extinctionSymbol: 'C 1 c 1',
    crystalSystem: 'Monoclinic',
    mappedSystem: 'Monoclinic_C',
    bravaisPearson: 'mC',
    laueClass: '2/m',
    centrosymmetric: true,
    prototypeMaterials: 'Gypsum CaSO₄·2H₂O, Diopside CaMgSi₂O₆, Spodumene, Tenorite CuO',
    diagnosticHkls: [[1, 0, 0], [1, 1, 0], [0, 2, 0], [2, 0, 1], [2, 0, 2], [-1, 1, 1], [1, 1, 1], [0, 0, 2]],
    rules: [
      ruleC,
      {
        id: 'sg15-c-glide',
        tier: 'Zonal (Glide Plane)',
        operatorLabel: 'c-glide ⊥ b',
        zoneLabel: 'h 0 l',
        conditionText: 'h = 2n, l = 2n',
        appliesTo: (_h, k) => k === 0,
        isAllowed: (h, _k, l) => isEven(h) && isEven(l),
      },
    ],
    defaultLattice: { a: 5.680, b: 15.180, c: 6.520, alpha: 90, beta: 118.4, gamma: 90 },
  },
  {
    id: 'sg-2',
    number: 2,
    hmSymbol: 'P-1',
    extinctionSymbol: 'P -',
    crystalSystem: 'Triclinic',
    mappedSystem: 'Triclinic',
    bravaisPearson: 'aP',
    laueClass: '-1',
    centrosymmetric: true,
    prototypeMaterials: 'Wollastonite, Kyanite Al₂SiO₅, CuSO₄·5H₂O, Albite',
    diagnosticHkls: [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, -1, 0], [1, 1, 1], [-1, 1, 1]],
    rules: [],
    defaultLattice: { a: 6.658, b: 7.853, c: 5.574, alpha: 90.0, beta: 101.1, gamma: 106.0 },
  },
];

export interface SpaceGroupEvaluationResult {
  hkl: [number, number, number];
  allowed: boolean;
  violatedRules: SpaceGroupExtinctionRule[];
  checkedRules: { rule: SpaceGroupExtinctionRule; passed: boolean }[];
  primaryReason: string;
}

export function evaluateSpaceGroupReflection(
  sg: SpaceGroupExtinctionProfile,
  h: number,
  k: number,
  l: number
): SpaceGroupEvaluationResult {
  if (h === 0 && k === 0 && l === 0) {
    return {
      hkl: [h, k, l],
      allowed: false,
      violatedRules: [],
      checkedRules: [],
      primaryReason: 'Forward direct beam (0 0 0) — not a Bragg reflection',
    };
  }

  const checkedRules: { rule: SpaceGroupExtinctionRule; passed: boolean }[] = [];
  const violatedRules: SpaceGroupExtinctionRule[] = [];

  for (const rule of sg.rules) {
    if (rule.appliesTo(h, k, l)) {
      const passed = rule.isAllowed(h, k, l);
      checkedRules.push({ rule, passed });
      if (!passed) violatedRules.push(rule);
    }
  }

  const allowed = violatedRules.length === 0;
  const primaryReason = allowed
    ? checkedRules.length === 0
      ? `No systematic extinction rule restricts (${h} ${k} ${l}) in ${sg.hmSymbol}`
      : `Satisfies all applicable conditions in ${sg.hmSymbol}: ${checkedRules.map((c) => `${c.rule.zoneLabel}: ${c.rule.conditionText}`).join(' · ')}`
    : `Extinguished by ${violatedRules[0].tier} — ${violatedRules[0].operatorLabel} (requires ${violatedRules[0].zoneLabel}: ${violatedRules[0].conditionText})`;

  return { hkl: [h, k, l], allowed, violatedRules, checkedRules, primaryReason };
}

export interface DeducedSpaceGroupCandidate {
  profile: SpaceGroupExtinctionProfile;
  compatible: boolean;
  violations: number;
  specificityScore: number; // higher = explains more observed absences / tighter symmetry
  matchedEvidence: string[];
  contradictions: string[];
}

/**
 * Reverse Extinction → Space Group Identifier:
 * Given a set of OBSERVED reflections (h, k, l), deduces which Bravais centering,
 * glide planes, and screw axes are consistent without contradicting any observed peak.
 */
export function deduceSpaceGroupsFromObservedHKLs(
  observedHkls: [number, number, number][]
): {
  deducedCentering: string;
  observedCount: number;
  candidates: DeducedSpaceGroupCandidate[];
  zoneDiagnostics: { label: string; observed: string[]; conclusion: string }[];
} {
  const valid = observedHkls.filter(([h, k, l]) => !(h === 0 && k === 0 && l === 0));

  const allEvenSum = valid.length > 0 && valid.every(([h, k, l]) => isEven(h + k + l));
  const allUnmixed = valid.length > 0 && valid.every(([h, k, l]) => isUnmixed(h, k, l));
  const allC = valid.length > 0 && valid.every(([h, k]) => isEven(h + k));
  const allR = valid.length > 0 && valid.every(([h, k, l]) => modPos(-h + k + l, 3) === 0);

  let deducedCentering = 'P (Primitive — no general centering absence)';
  if (allUnmixed) deducedCentering = 'F (Face-Centered — all observed h,k,l unmixed)';
  else if (allEvenSum) deducedCentering = 'I (Body-Centered — all observed h+k+l = 2n)';
  else if (allR) deducedCentering = 'R (Rhombohedral Obverse — all observed −h+k+l = 3n)';
  else if (allC) deducedCentering = 'C (Base-Centered — all observed h+k = 2n)';

  const h0l = valid.filter(([, k]) => k === 0);
  const _0kl = valid.filter(([h]) => h === 0);
  const hk0 = valid.filter(([, , l]) => l === 0);
  const _0k0 = valid.filter(([h, , l]) => h === 0 && l === 0);
  const _00l = valid.filter(([h, k]) => h === 0 && k === 0);

  const zoneDiagnostics = [
    {
      label: 'h 0 l zone (⊥ b)',
      observed: h0l.slice(0, 6).map((p) => `(${p.join(' ')})`),
      conclusion:
        h0l.length === 0
          ? 'No h0l reflections provided'
          : h0l.every(([, , l]) => isEven(l))
          ? 'All l even → c-glide ⊥ b possible'
          : h0l.every(([h, , l]) => isEven(h + l))
          ? 'All h+l even → n-glide ⊥ b possible'
          : 'Mixed parities → no c/n-glide ⊥ b',
    },
    {
      label: '0 k l zone (⊥ a)',
      observed: _0kl.slice(0, 6).map((p) => `(${p.join(' ')})`),
      conclusion:
        _0kl.length === 0
          ? 'No 0kl reflections provided'
          : _0kl.every(([, k, l]) => isEven(k) && isEven(l) && modPos(k + l, 4) === 0)
          ? 'k+l = 4n → d-glide ⊥ a possible'
          : _0kl.every(([, k, l]) => isEven(k + l))
          ? 'All k+l even → n-glide ⊥ a possible'
          : 'Mixed parities → no n/d-glide ⊥ a',
    },
    {
      label: 'h k 0 zone (⊥ c)',
      observed: hk0.slice(0, 6).map((p) => `(${p.join(' ')})`),
      conclusion:
        hk0.length === 0
          ? 'No hk0 reflections provided'
          : hk0.every(([h]) => isEven(h))
          ? 'All h even → a-glide ⊥ c possible'
          : hk0.every(([h, k]) => isEven(h + k))
          ? 'All h+k even → n-glide ⊥ c possible'
          : 'Mixed parities → no a/n-glide ⊥ c',
    },
    {
      label: '0 k 0 / 0 0 l axes',
      observed: [..._0k0, ..._00l].slice(0, 6).map((p) => `(${p.join(' ')})`),
      conclusion:
        _0k0.length === 0 && _00l.length === 0
          ? 'No axial 0k0 / 00l reflections provided'
          : `${_0k0.length > 0 ? (_0k0.every(([, k]) => isEven(k)) ? '0k0: k=2n (2₁ || b)' : '0k0 unrestricted') : ''}${_0k0.length > 0 && _00l.length > 0 ? ' · ' : ''}${_00l.length > 0 ? (_00l.every(([, , l]) => modPos(l, 4) === 0) ? '00l: l=4n (4₁ || c)' : _00l.every(([, , l]) => isEven(l)) ? '00l: l=2n (2₁/4₂/6₃ || c)' : '00l unrestricted') : ''}`,
    },
  ];

  const candidates: DeducedSpaceGroupCandidate[] = SPACE_GROUP_EXTINCTION_CATALOG.map((profile) => {
    let violations = 0;
    const contradictions: string[] = [];
    const matchedEvidence: string[] = [];
    let rulesTriggered = 0;

    for (const [h, k, l] of valid) {
      const ev = evaluateSpaceGroupReflection(profile, h, k, l);
      if (!ev.allowed) {
        violations++;
        if (contradictions.length < 3) {
          contradictions.push(`(${h} ${k} ${l}) violates ${ev.violatedRules[0]?.operatorLabel}`);
        }
      } else if (ev.checkedRules.length > 0) {
        rulesTriggered++;
      }
    }

    for (const r of profile.rules) {
      const applicable = valid.filter(([h, k, l]) => r.appliesTo(h, k, l));
      if (applicable.length > 0 && applicable.every(([h, k, l]) => r.isAllowed(h, k, l))) {
        matchedEvidence.push(`${r.zoneLabel}: ${r.conditionText}`);
      }
    }

    // Specificity favors compatible space groups that actively explain observed extinction conditions
    const specificityScore =
      violations === 0
        ? 100 + profile.rules.length * 14 + matchedEvidence.length * 10 + Math.min(20, rulesTriggered)
        : Math.max(0, 50 - violations * 15);

    return {
      profile,
      compatible: violations === 0,
      violations,
      specificityScore,
      matchedEvidence,
      contradictions,
    };
  }).sort((a, b) => {
    if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
    return b.specificityScore - a.specificityScore;
  });

  return {
    deducedCentering,
    observedCount: valid.length,
    candidates,
    zoneDiagnostics,
  };
}

export interface CompoundBasisAtom {
  site: string;
  species: 'A' | 'B' | 'C';
  coords: [number, number, number];
}

export interface CompoundBasisPreset {
  id: string;
  name: string;
  formula: string;
  spaceGroup: string;
  latticeA: number;
  speciesALabel: string;
  speciesBLabel: string;
  speciesCLabel?: string;
  defaultRatioBA: number; // f_B / f_A
  defaultRatioCA?: number; // f_C / f_A
  physicalHeadline: string;
  keyEffectNote: string;
  atoms: CompoundBasisAtom[];
  probeReflections: [number, number, number][];
}

/**
 * Multi-atom ordered basis presets demonstrating superlattice reflections & accidental/contrast extinctions.
 */
export const COMPOUND_BASIS_PRESETS: CompoundBasisPreset[] = [
  {
    id: 'rocksalt',
    name: 'Rocksalt (B1): NaCl ↔ KCl',
    formula: 'NaCl / KCl / MgO / TiC',
    spaceGroup: 'Fm-3m (#225)',
    latticeA: 5.640,
    speciesALabel: 'Cation (Na⁺ / K⁺)',
    speciesBLabel: 'Anion (Cl⁻)',
    defaultRatioBA: 1.55,
    physicalHeadline: 'All-odd reflections scale as 4|f_A − f_B|; all-even scale as 4(f_A + f_B)',
    keyEffectNote:
      'Set f_B / f_A = 1.00 (isoelectronic K⁺ = 18e⁻, Cl⁻ = 18e⁻ in KCl) to watch (111) and (311) vanish completely — turning FCC into an apparent Simple Cubic cell of side a/2!',
    atoms: [
      { site: 'A1', species: 'A', coords: [0, 0, 0] },
      { site: 'A2', species: 'A', coords: [0.5, 0.5, 0] },
      { site: 'A3', species: 'A', coords: [0.5, 0, 0.5] },
      { site: 'A4', species: 'A', coords: [0, 0.5, 0.5] },
      { site: 'B1', species: 'B', coords: [0.5, 0.5, 0.5] },
      { site: 'B2', species: 'B', coords: [0.5, 0, 0] },
      { site: 'B3', species: 'B', coords: [0, 0.5, 0] },
      { site: 'B4', species: 'B', coords: [0, 0, 0.5] },
    ],
    probeReflections: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0], [2, 2, 0], [3, 1, 1], [2, 2, 2], [4, 0, 0]],
  },
  {
    id: 'zincblende',
    name: 'Zincblende (B3) ↔ Diamond (A4)',
    formula: 'ZnS / GaAs / SiC ↔ Si',
    spaceGroup: 'F-43m (#216) ↔ Fd-3m (#227)',
    latticeA: 5.409,
    speciesALabel: 'FCC Sublattice (Zn / Ga)',
    speciesBLabel: 'Tetrahedral Sublattice (S / As)',
    defaultRatioBA: 0.53,
    physicalHeadline: 'Forbidden Diamond (200) & (222) emerge as 4|f_A − f_B| when f_A ≠ f_B',
    keyEffectNote:
      'In pure Si/Diamond (f_B / f_A = 1.00), (200) and (222) are strictly extinct. In GaAs (f_As/f_Ga ≈ 1.06) the (200) peak is famously ultra-weak, whereas in InSb or ZnS it is clearly measurable.',
    atoms: [
      { site: 'A1', species: 'A', coords: [0, 0, 0] },
      { site: 'A2', species: 'A', coords: [0.5, 0.5, 0] },
      { site: 'A3', species: 'A', coords: [0.5, 0, 0.5] },
      { site: 'A4', species: 'A', coords: [0, 0.5, 0.5] },
      { site: 'B1', species: 'B', coords: [0.25, 0.25, 0.25] },
      { site: 'B2', species: 'B', coords: [0.75, 0.75, 0.25] },
      { site: 'B3', species: 'B', coords: [0.75, 0.25, 0.75] },
      { site: 'B4', species: 'B', coords: [0.25, 0.75, 0.75] },
    ],
    probeReflections: [[1, 1, 1], [2, 0, 0], [2, 2, 0], [3, 1, 1], [2, 2, 2], [4, 0, 0], [3, 3, 1], [4, 2, 0]],
  },
  {
    id: 'cscl',
    name: 'Ordered B2 (CsCl / NiTi) ↔ Disordered BCC',
    formula: 'CsCl / β-CuZn / NiTi',
    spaceGroup: 'Pm-3m (#221) ↔ Im-3m (#229)',
    latticeA: 3.015,
    speciesALabel: 'Corner Site (0,0,0)',
    speciesBLabel: 'Body Center (½,½,½)',
    defaultRatioBA: 0.31,
    physicalHeadline: 'Superlattice reflections (h+k+l odd) scale as |f_A − f_B|',
    keyEffectNote:
      'Disordered β-brass has equal average scattering on corner and center (f_B / f_A = 1.00 → BCC extinct for 100, 111, 210). Long-range chemical ordering breaks I-centering and activates superlattice peaks.',
    atoms: [
      { site: 'A1', species: 'A', coords: [0, 0, 0] },
      { site: 'B1', species: 'B', coords: [0.5, 0.5, 0.5] },
    ],
    probeReflections: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0], [2, 1, 0], [2, 1, 1], [2, 2, 0], [3, 0, 0]],
  },
  {
    id: 'fluorite',
    name: 'Fluorite (C1): CaF₂ / UO₂ / c-ZrO₂',
    formula: 'CaF₂ / UO₂ / CeO₂ / c-ZrO₂',
    spaceGroup: 'Fm-3m (#225)',
    latticeA: 5.463,
    speciesALabel: 'Cation (Ca / U / Zr)',
    speciesBLabel: '8 Tetrahedral Anions (F / O)',
    defaultRatioBA: 0.45,
    physicalHeadline: 'All-odd peaks come purely from cations (4f_A); h+k+l = 4n+2 gives 4|f_A − 2f_B|',
    keyEffectNote:
      'Notice (200) vanishes when f_B / f_A = 0.50 (4f_A − 8f_B = 0)! In CaF₂ (f_F / f_Ca ≈ 0.45) the (200) reflection is notoriously almost invisible, while in UO₂ (f_O / f_U ≈ 0.087) it is prominent.',
    atoms: [
      { site: 'A1', species: 'A', coords: [0, 0, 0] },
      { site: 'A2', species: 'A', coords: [0.5, 0.5, 0] },
      { site: 'A3', species: 'A', coords: [0.5, 0, 0.5] },
      { site: 'A4', species: 'A', coords: [0, 0.5, 0.5] },
      { site: 'B1', species: 'B', coords: [0.25, 0.25, 0.25] },
      { site: 'B2', species: 'B', coords: [0.75, 0.75, 0.25] },
      { site: 'B3', species: 'B', coords: [0.75, 0.25, 0.75] },
      { site: 'B4', species: 'B', coords: [0.25, 0.75, 0.75] },
      { site: 'B5', species: 'B', coords: [0.75, 0.75, 0.75] },
      { site: 'B6', species: 'B', coords: [0.25, 0.25, 0.75] },
      { site: 'B7', species: 'B', coords: [0.25, 0.75, 0.25] },
      { site: 'B8', species: 'B', coords: [0.75, 0.25, 0.25] },
    ],
    probeReflections: [[1, 1, 1], [2, 0, 0], [2, 2, 0], [3, 1, 1], [2, 2, 2], [4, 0, 0], [3, 3, 1], [4, 2, 0]],
  },
  {
    id: 'perovskite',
    name: 'Cubic Perovskite (E2₁): SrTiO₃ / BaTiO₃',
    formula: 'ABO₃ (SrTiO₃ / BaTiO₃)',
    spaceGroup: 'Pm-3m (#221)',
    latticeA: 3.905,
    speciesALabel: 'A-site Corner (Sr/Ba)',
    speciesBLabel: 'B-site Center (Ti)',
    speciesCLabel: 'O²⁻ Face Centers (3×)',
    defaultRatioBA: 0.58,
    defaultRatioCA: 0.21,
    physicalHeadline: 'Primitive cubic (all hkl allowed), but destructive O/Ti phasing modulates (100) vs (110)',
    keyEffectNote:
      'For (110), F = f_A + f_B − f_O (strongest reflection!). For (100), F = f_A − f_B + f_O, which can drop near zero if f_A + f_O ≈ f_B (e.g., Pb/Ti vs Ca/Ti substitution).',
    atoms: [
      { site: 'A', species: 'A', coords: [0, 0, 0] },
      { site: 'B', species: 'B', coords: [0.5, 0.5, 0.5] },
      { site: 'O1', species: 'C', coords: [0.5, 0.5, 0] },
      { site: 'O2', species: 'C', coords: [0.5, 0, 0.5] },
      { site: 'O3', species: 'C', coords: [0, 0.5, 0.5] },
    ],
    probeReflections: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0], [2, 1, 0], [2, 1, 1], [2, 2, 0], [3, 0, 0]],
  },
];

export function evaluateCompoundBasisReflection(
  preset: CompoundBasisPreset,
  h: number,
  k: number,
  l: number,
  ratioBA: number,
  ratioCA: number,
  wavelength: number
): {
  hkl: [number, number, number];
  re: number;
  im: number;
  mag: number;
  magSq: number;
  dSpacing: number;
  twoTheta: number | null;
  status: 'Strong' | 'Weak / Superlattice' | 'Extinct';
} {
  let re = 0;
  let im = 0;
  for (const atom of preset.atoms) {
    const f = atom.species === 'A' ? 1.0 : atom.species === 'B' ? ratioBA : ratioCA;
    const phi = 2 * Math.PI * (h * atom.coords[0] + k * atom.coords[1] + l * atom.coords[2]);
    re += f * Math.cos(phi);
    im += f * Math.sin(phi);
  }
  const cleanRe = Math.abs(re) < 1e-6 ? 0 : re;
  const cleanIm = Math.abs(im) < 1e-6 ? 0 : im;
  const magSq = cleanRe * cleanRe + cleanIm * cleanIm;
  const mag = Math.sqrt(magSq);
  const dSpacing = preset.latticeA / Math.sqrt(h * h + k * k + l * l);
  const sinTh = dSpacing > 0 ? wavelength / (2 * dSpacing) : 2;
  const twoTheta = sinTh <= 1 ? (2 * Math.asin(sinTh) * 180) / Math.PI : null;

  const maxPossible = preset.atoms.reduce(
    (acc, atom) => acc + (atom.species === 'A' ? 1 : atom.species === 'B' ? ratioBA : ratioCA),
    0
  );
  const ratioToMax = maxPossible > 0 ? mag / maxPossible : 0;
  const status =
    mag < 1e-3 ? 'Extinct' : ratioToMax < 0.22 ? 'Weak / Superlattice' : 'Strong';

  return { hkl: [h, k, l], re: cleanRe, im: cleanIm, mag, magSq, dSpacing, twoTheta, status };
}
