// Exact Quantum Atomic Orbital Engine:
// - Full IUPAC ground-state Aufbau + all 20 anomalous electron configurations (Z = 1..118)
// - Physically accurate cation/anion ionization (removes highest-n s electrons before (n-1)d / (n-2)f)
// - Textbook Slater's Rules (1930) per-(n,l) screening constants & Z_eff
// - Exact hydrogenic/Slater-screened Associated Laguerre radial wavefunctions R_{n,l}(r) for all 1s..7p
// - Exact normalized Radial Probability Density P_{n,l}(r) = r^2 |R_{n,l}(r)|^2 (unit integral = 1.0)
// - Exact numerical radial nodes, <r>, r_mp, and real cubic/tesseral spherical harmonics Y_{l,m}
// - Ground-state Russell-Saunders term symbol ^{2S+1}L_J, Lande g_J, spin-only & effective moments

export const BOHR_RADIUS_A = 0.5291772109;
export const RYDBERG_EV = 13.605693122994;

export type SubshellType = 's' | 'p' | 'd' | 'f';

export interface SubshellDefinition {
  n: number;
  l: number;
  type: SubshellType;
  label: string;
  capacity: number;
  boxes: number;
  color: string;
}

export interface OrbitalVariantSpec {
  l: number;
  index: number; // 0 .. 2l
  ml: number; // magnetic quantum number label
  shortLabel: string; // e.g. "z²", "x²−y²", "xy"
  fullLabel: (n: number) => string; // e.g. "3d_z²"
  cartesianFormula: string;
  angularNodes: string;
  evalRealHarmonic: (ux: number, uy: number, uz: number) => number;
}

export interface OccupiedSubshell {
  n: number;
  l: number;
  type: SubshellType;
  label: string;
  capacity: number;
  electrons: number;
  unpaired: number;
  color: string;
  boxes: Array<{ ml: number; up: boolean; down: boolean; orbitalShortLabel: string }>;
  zEff: number;
  sigma: number;
  energyEv: number;
}

export interface TermSymbolInfo {
  S: number;
  L: number;
  J: number;
  multiplicity: number;
  LChar: string;
  formatted: string; // e.g. "⁵D₄"
  landeG: number;
  muSpinOnly: number; // sqrt(4S(S+1)) in Bohr magnetons
  muEffJ: number; // g_J * sqrt(J(J+1)) in Bohr magnetons
}

export interface ElectronConfigurationResult {
  Z: number;
  charge: number;
  totalElectrons: number;
  subshells: OccupiedSubshell[];
  shellPopulations: number[]; // K, L, M, N, O, P, Q exact sums
  totalUnpaired: number;
  isParamagnetic: boolean;
  isAnomalous: boolean;
  anomalyNote?: string;
  configString: string;
  valenceSubshell: OccupiedSubshell;
  lastElectronQuantumNumbers: { n: number; l: number; ml: number; ms: 0.5 | -0.5 };
  termSymbol: TermSymbolInfo;
}

export interface SlaterScreeningBreakdown {
  zEff: number;
  sigma: number;
  sameGroupShield: number;
  nMinus1Shield: number;
  deepCoreShield: number;
  nStar: number;
  energyEv: number;
  groupLabel: string;
}

export interface SampledOrbitalPoint {
  x: number; // Angstroms
  y: number;
  z: number;
  r: number;
  psiSign: 1 | -1;
  densityWeight: number; // 0..1 normalized
}

export const MADELUNG_SEQUENCE: SubshellDefinition[] = [
  { n: 1, l: 0, type: 's', label: '1s', capacity: 2, boxes: 1, color: '#38bdf8' },
  { n: 2, l: 0, type: 's', label: '2s', capacity: 2, boxes: 1, color: '#38bdf8' },
  { n: 2, l: 1, type: 'p', label: '2p', capacity: 6, boxes: 3, color: '#a78bfa' },
  { n: 3, l: 0, type: 's', label: '3s', capacity: 2, boxes: 1, color: '#38bdf8' },
  { n: 3, l: 1, type: 'p', label: '3p', capacity: 6, boxes: 3, color: '#a78bfa' },
  { n: 4, l: 0, type: 's', label: '4s', capacity: 2, boxes: 1, color: '#38bdf8' },
  { n: 3, l: 2, type: 'd', label: '3d', capacity: 10, boxes: 5, color: '#f59e0b' },
  { n: 4, l: 1, type: 'p', label: '4p', capacity: 6, boxes: 3, color: '#a78bfa' },
  { n: 5, l: 0, type: 's', label: '5s', capacity: 2, boxes: 1, color: '#38bdf8' },
  { n: 4, l: 2, type: 'd', label: '4d', capacity: 10, boxes: 5, color: '#f59e0b' },
  { n: 5, l: 1, type: 'p', label: '5p', capacity: 6, boxes: 3, color: '#a78bfa' },
  { n: 6, l: 0, type: 's', label: '6s', capacity: 2, boxes: 1, color: '#38bdf8' },
  { n: 4, l: 3, type: 'f', label: '4f', capacity: 14, boxes: 7, color: '#fb7185' },
  { n: 5, l: 2, type: 'd', label: '5d', capacity: 10, boxes: 5, color: '#f59e0b' },
  { n: 6, l: 1, type: 'p', label: '6p', capacity: 6, boxes: 3, color: '#a78bfa' },
  { n: 7, l: 0, type: 's', label: '7s', capacity: 2, boxes: 1, color: '#38bdf8' },
  { n: 5, l: 3, type: 'f', label: '5f', capacity: 14, boxes: 7, color: '#fb7185' },
  { n: 6, l: 2, type: 'd', label: '6d', capacity: 10, boxes: 5, color: '#f59e0b' },
  { n: 7, l: 1, type: 'p', label: '7p', capacity: 6, boxes: 3, color: '#a78bfa' },
];

// All 20 experimental IUPAC neutral ground-state configuration anomalies (overrides over pure Madelung)
const IUPAC_GROUND_ANOMALIES: Record<number, { overrides: Record<string, number>; note: string }> = {
  24: { overrides: { '4s': 1, '3d': 5 }, note: 'Half-filled 3d⁵ exchange stabilization' },
  29: { overrides: { '4s': 1, '3d': 10 }, note: 'Closed 3d¹⁰ subshell stabilization' },
  41: { overrides: { '5s': 1, '4d': 4 }, note: '4d–5s exchange & radial correlation' },
  42: { overrides: { '5s': 1, '4d': 5 }, note: 'Half-filled 4d⁵ exchange stabilization' },
  44: { overrides: { '5s': 1, '4d': 7 }, note: '4d–5s electron-electron repulsion reduction' },
  45: { overrides: { '5s': 1, '4d': 8 }, note: '4d–5s exchange stabilization' },
  46: { overrides: { '5s': 0, '4d': 10 }, note: 'Closed-shell 4d¹⁰ 5s⁰ ground state' },
  47: { overrides: { '5s': 1, '4d': 10 }, note: 'Closed 4d¹⁰ subshell stabilization' },
  57: { overrides: { '4f': 0, '5d': 1 }, note: '5d¹ lies below 4f¹ at Z = 57' },
  58: { overrides: { '4f': 1, '5d': 1 }, note: 'Near-degenerate 4f¹ 5d¹ ground state' },
  64: { overrides: { '4f': 7, '5d': 1 }, note: 'Half-filled 4f⁷ exchange stabilization' },
  78: { overrides: { '6s': 1, '5d': 9 }, note: 'Relativistic 6s contraction & 5d⁹ coupling' },
  79: { overrides: { '6s': 1, '5d': 10 }, note: 'Relativistic 6s¹ + closed 5d¹⁰' },
  89: { overrides: { '5f': 0, '6d': 1 }, note: '6d¹ lies below 5f¹ at Z = 89' },
  90: { overrides: { '5f': 0, '6d': 2 }, note: '6d² 7s² relativistic actinide threshold' },
  91: { overrides: { '5f': 2, '6d': 1 }, note: 'Competing 5f² 6d¹ actinide orbitals' },
  92: { overrides: { '5f': 3, '6d': 1 }, note: '5f³ 6d¹ 7s² actinide ground state' },
  93: { overrides: { '5f': 4, '6d': 1 }, note: '5f⁴ 6d¹ 7s² actinide ground state' },
  96: { overrides: { '5f': 7, '6d': 1 }, note: 'Half-filled 5f⁷ exchange stabilization' },
  103: { overrides: { '6d': 0, '7p': 1 }, note: 'Relativistic 7p₁/₂ stabilization over 6d' },
};

// Exact Real Spherical Harmonics Y_{l,m}^{real}(ux, uy, uz) normalized on unit sphere
export const REAL_ORBITAL_VARIANTS: Record<number, OrbitalVariantSpec[]> = {
  0: [
    {
      l: 0,
      index: 0,
      ml: 0,
      shortLabel: 's',
      fullLabel: (n) => `${n}s`,
      cartesianFormula: 'Y₀,₀ = 1 / √(4π)',
      angularNodes: 'None (spherically symmetric)',
      evalRealHarmonic: () => 0.2820947918,
    },
  ],
  1: [
    {
      l: 1,
      index: 0,
      ml: -1,
      shortLabel: 'p_y',
      fullLabel: (n) => `${n}p_y`,
      cartesianFormula: 'Y₁,y = √(3/4π) · (y/r)',
      angularNodes: '1 nodal plane (xz plane)',
      evalRealHarmonic: (_x, y) => 0.4886025119 * y,
    },
    {
      l: 1,
      index: 1,
      ml: 0,
      shortLabel: 'p_z',
      fullLabel: (n) => `${n}p_z`,
      cartesianFormula: 'Y₁,z = √(3/4π) · (z/r)',
      angularNodes: '1 nodal plane (xy plane)',
      evalRealHarmonic: (_x, _y, z) => 0.4886025119 * z,
    },
    {
      l: 1,
      index: 2,
      ml: 1,
      shortLabel: 'p_x',
      fullLabel: (n) => `${n}p_x`,
      cartesianFormula: 'Y₁,x = √(3/4π) · (x/r)',
      angularNodes: '1 nodal plane (yz plane)',
      evalRealHarmonic: (x) => 0.4886025119 * x,
    },
  ],
  2: [
    {
      l: 2,
      index: 0,
      ml: -2,
      shortLabel: 'd_xy',
      fullLabel: (n) => `${n}d_xy`,
      cartesianFormula: 'Y₂,xy = √(15/4π) · (xy/r²)',
      angularNodes: '2 nodal planes (xz, yz)',
      evalRealHarmonic: (x, y) => 1.0925484306 * x * y,
    },
    {
      l: 2,
      index: 1,
      ml: -1,
      shortLabel: 'd_yz',
      fullLabel: (n) => `${n}d_yz`,
      cartesianFormula: 'Y₂,yz = √(15/4π) · (yz/r²)',
      angularNodes: '2 nodal planes (xy, xz)',
      evalRealHarmonic: (_x, y, z) => 1.0925484306 * y * z,
    },
    {
      l: 2,
      index: 2,
      ml: 0,
      shortLabel: 'd_z²',
      fullLabel: (n) => `${n}d_z²`,
      cartesianFormula: 'Y₂,z² = √(5/16π) · (3z² − r²)/r²',
      angularNodes: '2 nodal cones (θ = 54.7°, 125.3°)',
      evalRealHarmonic: (_x, _y, z) => 0.3153915653 * (3 * z * z - 1),
    },
    {
      l: 2,
      index: 3,
      ml: 1,
      shortLabel: 'd_xz',
      fullLabel: (n) => `${n}d_xz`,
      cartesianFormula: 'Y₂,xz = √(15/4π) · (xz/r²)',
      angularNodes: '2 nodal planes (xy, yz)',
      evalRealHarmonic: (x, _y, z) => 1.0925484306 * x * z,
    },
    {
      l: 2,
      index: 4,
      ml: 2,
      shortLabel: 'd_x²−y²',
      fullLabel: (n) => `${n}d_x²−y²`,
      cartesianFormula: 'Y₂,x²−y² = √(15/16π) · (x² − y²)/r²',
      angularNodes: '2 diagonal planes (x = ±y)',
      evalRealHarmonic: (x, y) => 0.5462742153 * (x * x - y * y),
    },
  ],
  3: [
    {
      l: 3,
      index: 0,
      ml: -3,
      shortLabel: 'f_y(3x²−y²)',
      fullLabel: (n) => `${n}f_y(3x²−y²)`,
      cartesianFormula: 'Y₃,−3 ∝ y(3x² − y²)/r³',
      angularNodes: '3 vertical planes (φ = 0°, ±60°)',
      evalRealHarmonic: (x, y) => 0.5900435899 * y * (3 * x * x - y * y),
    },
    {
      l: 3,
      index: 1,
      ml: -2,
      shortLabel: 'f_xyz',
      fullLabel: (n) => `${n}f_xyz`,
      cartesianFormula: 'Y₃,−2 ∝ xyz / r³',
      angularNodes: '3 orthogonal planes (xy, xz, yz)',
      evalRealHarmonic: (x, y, z) => 2.8906114426 * x * y * z,
    },
    {
      l: 3,
      index: 2,
      ml: -1,
      shortLabel: 'f_yz²',
      fullLabel: (n) => `${n}f_yz²`,
      cartesianFormula: 'Y₃,−1 ∝ y(5z² − r²)/r³',
      angularNodes: '1 plane (xz) + 2 cones',
      evalRealHarmonic: (_x, y, z) => 0.4570457995 * y * (5 * z * z - 1),
    },
    {
      l: 3,
      index: 3,
      ml: 0,
      shortLabel: 'f_z³',
      fullLabel: (n) => `${n}f_z³`,
      cartesianFormula: 'Y₃,0 ∝ z(5z² − 3r²)/r³',
      angularNodes: '1 plane (xy) + 2 cones (39.2°, 140.8°)',
      evalRealHarmonic: (_x, _y, z) => 0.3731763326 * z * (5 * z * z - 3),
    },
    {
      l: 3,
      index: 4,
      ml: 1,
      shortLabel: 'f_xz²',
      fullLabel: (n) => `${n}f_xz²`,
      cartesianFormula: 'Y₃,+1 ∝ x(5z² − r²)/r³',
      angularNodes: '1 plane (yz) + 2 cones',
      evalRealHarmonic: (x, _y, z) => 0.4570457995 * x * (5 * z * z - 1),
    },
    {
      l: 3,
      index: 5,
      ml: 2,
      shortLabel: 'f_z(x²−y²)',
      fullLabel: (n) => `${n}f_z(x²−y²)`,
      cartesianFormula: 'Y₃,+2 ∝ z(x² − y²)/r³',
      angularNodes: '3 planes (xy, x = ±y)',
      evalRealHarmonic: (x, y, z) => 1.4453057213 * z * (x * x - y * y),
    },
    {
      l: 3,
      index: 6,
      ml: 3,
      shortLabel: 'f_x(x²−3y²)',
      fullLabel: (n) => `${n}f_x(x²−3y²)`,
      cartesianFormula: 'Y₃,+3 ∝ x(x² − 3y²)/r³',
      angularNodes: '3 vertical planes (φ = 90°, ±30°)',
      evalRealHarmonic: (x, y) => 0.5900435899 * x * (x * x - 3 * y * y),
    },
  ],
};

// Slater effective principal quantum number n*
const SLATER_N_STAR: Record<number, number> = {
  1: 1.0,
  2: 2.0,
  3: 3.0,
  4: 3.7,
  5: 4.0,
  6: 4.2,
  7: 4.3,
};

function slaterGroupKey(n: number, l: number): { order: number; label: string } {
  // Canonical Slater (1930) grouping: (1s)(2s,2p)(3s,3p)(3d)(4s,4p)(4d)(4f)(5s,5p)(5d)(5f)(6s,6p)(6d)(7s,7p)
  if (n === 1) return { order: 0, label: '(1s)' };
  if (n === 2) return { order: 1, label: '(2s,2p)' };
  if (n === 3 && l <= 1) return { order: 2, label: '(3s,3p)' };
  if (n === 3 && l === 2) return { order: 3, label: '(3d)' };
  if (n === 4 && l <= 1) return { order: 4, label: '(4s,4p)' };
  if (n === 4 && l === 2) return { order: 5, label: '(4d)' };
  if (n === 4 && l === 3) return { order: 6, label: '(4f)' };
  if (n === 5 && l <= 1) return { order: 7, label: '(5s,5p)' };
  if (n === 5 && l === 2) return { order: 8, label: '(5d)' };
  if (n === 5 && l === 3) return { order: 9, label: '(5f)' };
  if (n === 6 && l <= 1) return { order: 10, label: '(6s,6p)' };
  if (n === 6 && l === 2) return { order: 11, label: '(6d)' };
  return { order: 12, label: '(7s,7p)' };
}

// Compute exact raw subshell electron counts for element Z and net charge q
export function computeRawSubshellCounts(Z: number, charge = 0): {
  counts: Record<string, number>;
  isAnomalous: boolean;
  anomalyNote?: string;
} {
  const clampedZ = Math.max(1, Math.min(118, Math.round(Z)));
  const counts: Record<string, number> = {};
  let rem = clampedZ;

  for (const def of MADELUNG_SEQUENCE) {
    if (rem <= 0) break;
    const take = Math.min(def.capacity, rem);
    counts[def.label] = take;
    rem -= take;
  }

  let isAnomalous = false;
  let anomalyNote: string | undefined;
  const anomaly = IUPAC_GROUND_ANOMALIES[clampedZ];
  if (anomaly) {
    isAnomalous = true;
    anomalyNote = anomaly.note;
    for (const [lbl, val] of Object.entries(anomaly.overrides)) {
      if (val === 0) delete counts[lbl];
      else counts[lbl] = val;
    }
  }

  // Apply ionization charge q (positive = remove electrons from highest n first, then highest l; negative = add in Madelung order)
  const netCharge = Math.max(-2, Math.min(Math.min(6, clampedZ - 1), Math.round(charge)));
  if (netCharge > 0) {
    let toRemove = netCharge;
    // Standard quantum ionization order: highest principal quantum number n first; within same n, highest l first (p -> d -> s)
    const removalOrder = [...MADELUNG_SEQUENCE].sort((a, b) => {
      if (b.n !== a.n) return b.n - a.n;
      return b.l - a.l;
    });
    for (const def of removalOrder) {
      if (toRemove <= 0) break;
      const cur = counts[def.label] || 0;
      if (cur > 0) {
        const take = Math.min(cur, toRemove);
        const next = cur - take;
        if (next === 0) delete counts[def.label];
        else counts[def.label] = next;
        toRemove -= take;
      }
    }
  } else if (netCharge < 0) {
    let toAdd = -netCharge;
    for (const def of MADELUNG_SEQUENCE) {
      if (toAdd <= 0) break;
      const cur = counts[def.label] || 0;
      if (cur < def.capacity) {
        const add = Math.min(def.capacity - cur, toAdd);
        counts[def.label] = cur + add;
        toAdd -= add;
      }
    }
  }

  return { counts, isAnomalous: isAnomalous && netCharge === 0, anomalyNote: netCharge === 0 ? anomalyNote : undefined };
}

// Textbook Slater's Rules (1930) for any target (n, l) inside element Z (with optional charge)
export function computeSlaterScreening(
  Z: number,
  targetN: number,
  targetL: number,
  countsOverride?: Record<string, number>,
  charge = 0
): SlaterScreeningBreakdown {
  const counts = countsOverride || computeRawSubshellCounts(Z, charge).counts;
  const targetGroup = slaterGroupKey(targetN, targetL);
  const isSP = targetL <= 1;

  let sameGroupElectrons = 0;
  let nMinus1Electrons = 0;
  let deepCoreElectrons = 0;

  for (const def of MADELUNG_SEQUENCE) {
    const eCount = counts[def.label] || 0;
    if (eCount <= 0) continue;
    const g = slaterGroupKey(def.n, def.l);
    if (g.order > targetGroup.order) continue; // Outer groups contribute 0.00

    if (g.order === targetGroup.order) {
      sameGroupElectrons += eCount;
    } else if (isSP) {
      if (def.n === targetN - 1) nMinus1Electrons += eCount;
      else if (def.n <= targetN - 2) deepCoreElectrons += eCount;
    } else {
      // For d or f test electrons, EVERY electron in any lower group shields by 1.00
      deepCoreElectrons += eCount;
    }
  }

  // Subtract the test electron itself (if the group is occupied)
  const otherSame = Math.max(0, sameGroupElectrons - 1);
  const sameCoeff = targetN === 1 ? 0.30 : 0.35;
  const sameGroupShield = otherSame * sameCoeff;
  const nMinus1Shield = isSP ? nMinus1Electrons * 0.85 : 0;
  const deepCoreShield = deepCoreElectrons * 1.0;

  const sigma = sameGroupShield + nMinus1Shield + deepCoreShield;
  const zEff = Math.max(1.0, Z - sigma);
  const nStar = SLATER_N_STAR[targetN] || targetN;
  const energyEv = -RYDBERG_EV * Math.pow(zEff / nStar, 2);

  return {
    zEff,
    sigma,
    sameGroupShield,
    nMinus1Shield,
    deepCoreShield,
    nStar,
    energyEv,
    groupLabel: targetGroup.label,
  };
}

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

const SUBSCRIPTS: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '/': '⁄',
};

function toSuperscript(n: number | string): string {
  return String(n)
    .split('')
    .map((c) => SUPERSCRIPTS[c] || c)
    .join('');
}

function toSubscript(s: string): string {
  return s
    .split('')
    .map((c) => SUBSCRIPTS[c] || c)
    .join('');
}

const L_LETTERS = ['S', 'P', 'D', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O'];

function formatJFraction(J: number): string {
  const twoJ = Math.round(J * 2);
  if (twoJ % 2 === 0) return String(twoJ / 2);
  return `${twoJ}/2`;
}

// Compute Ground-State Russell-Saunders Term Symbol ^{2S+1}L_J via Hund's 3 Rules
function computeGroundTermSymbol(subshells: OccupiedSubshell[]): TermSymbolInfo {
  const openShells = subshells.filter((s) => s.electrons > 0 && s.electrons < s.capacity);
  if (openShells.length === 0) {
    return {
      S: 0,
      L: 0,
      J: 0,
      multiplicity: 1,
      LChar: 'S',
      formatted: '¹S₀',
      landeG: 1,
      muSpinOnly: 0,
      muEffJ: 0,
    };
  }

  let totalS = 0;
  let totalL = 0;
  // Determine dominant open subshell (highest l, e.g. f > d > p > s) for Hund's 3rd rule J sign
  let dominant = openShells[0];
  for (const s of openShells) {
    const nBoxes = s.capacity / 2;
    const unpaired = s.electrons <= nBoxes ? s.electrons : s.capacity - s.electrons;
    totalS += unpaired * 0.5;
    // Maximum M_L by filling m_l = +l, +l-1, ... first
    let shellML = 0;
    const countInHalf = s.electrons <= nBoxes ? s.electrons : s.electrons - nBoxes;
    for (let k = 0; k < countInHalf; k++) {
      shellML += s.l - k;
    }
    totalL += shellML;
    if (s.l > dominant.l || (s.l === dominant.l && s.n > dominant.n)) {
      dominant = s;
    }
  }

  const isMoreThanHalf = dominant.electrons > dominant.capacity / 2;
  const J = isMoreThanHalf ? totalL + totalS : Math.abs(totalL - totalS);
  const multiplicity = Math.round(2 * totalS + 1);
  const LChar = L_LETTERS[Math.min(L_LETTERS.length - 1, Math.round(totalL))] || 'S';
  const formatted = `${toSuperscript(multiplicity)}${LChar}${toSubscript(formatJFraction(J))}`;

  let landeG = 1;
  if (J > 0) {
    landeG = 1 + (J * (J + 1) + totalS * (totalS + 1) - totalL * (totalL + 1)) / (2 * J * (J + 1));
  }
  const muSpinOnly = Math.sqrt(4 * totalS * (totalS + 1));
  const muEffJ = J > 0 ? landeG * Math.sqrt(J * (J + 1)) : 0;

  return {
    S: totalS,
    L: totalL,
    J,
    multiplicity,
    LChar,
    formatted,
    landeG,
    muSpinOnly,
    muEffJ,
  };
}

// Noble-gas core shorthand formatter
const NOBLE_CORES: Array<{ e: number; symbol: string; subshells: string[] }> = [
  { e: 86, symbol: '[Rn]', subshells: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p'] },
  { e: 54, symbol: '[Xe]', subshells: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p'] },
  { e: 36, symbol: '[Kr]', subshells: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'] },
  { e: 18, symbol: '[Ar]', subshells: ['1s', '2s', '2p', '3s', '3p'] },
  { e: 10, symbol: '[Ne]', subshells: ['1s', '2s', '2p'] },
  { e: 2, symbol: '[He]', subshells: ['1s'] },
];

function formatCompactConfig(counts: Record<string, number>, totalE: number): string {
  if (totalE <= 0) return 'Bare nucleus (0 e⁻)';
  let prefix = '';
  const skipSet = new Set<string>();

  for (const core of NOBLE_CORES) {
    if (totalE > core.e) {
      const fullCorePresent = core.subshells.every((lbl) => {
        const def = MADELUNG_SEQUENCE.find((d) => d.label === lbl);
        return def && (counts[lbl] || 0) === def.capacity;
      });
      if (fullCorePresent) {
        prefix = core.symbol;
        core.subshells.forEach((lbl) => skipSet.add(lbl));
        break;
      }
    }
  }

  // Sort remaining subshells in spectroscopic (n, then l) order
  const parts = MADELUNG_SEQUENCE
    .filter((d) => !skipSet.has(d.label) && (counts[d.label] || 0) > 0)
    .sort((a, b) => (a.n !== b.n ? a.n - b.n : a.l - b.l))
    .map((d) => `${d.label}${toSuperscript(counts[d.label])}`);

  return prefix ? `${prefix} ${parts.join(' ')}` : parts.join(' ');
}

export function computeElectronConfiguration(Z: number, charge = 0): ElectronConfigurationResult {
  const { counts, isAnomalous, anomalyNote } = computeRawSubshellCounts(Z, charge);
  const subshells: OccupiedSubshell[] = [];
  const shellMap = new Map<number, number>();
  let totalUnpaired = 0;
  let totalElectrons = 0;

  for (const def of MADELUNG_SEQUENCE) {
    const eCount = counts[def.label] || 0;
    if (eCount <= 0) continue;

    totalElectrons += eCount;
    shellMap.set(def.n, (shellMap.get(def.n) || 0) + eCount);

    const variants = REAL_ORBITAL_VARIANTS[def.l];
    const boxes = variants.map((v) => ({
      ml: v.ml,
      up: false,
      down: false,
      orbitalShortLabel: v.shortLabel,
    }));

    // Fill boxes by Hund's rule: parallel spin-up first across all m_l, then spin-down
    for (let e = 0; e < eCount; e++) {
      if (e < def.boxes) boxes[e].up = true;
      else boxes[e - def.boxes].down = true;
    }

    const unpaired = boxes.filter((b) => b.up && !b.down).length;
    totalUnpaired += unpaired;

    const slater = computeSlaterScreening(Z, def.n, def.l, counts, charge);

    subshells.push({
      n: def.n,
      l: def.l,
      type: def.type,
      label: def.label,
      capacity: def.capacity,
      electrons: eCount,
      unpaired,
      color: def.color,
      boxes,
      zEff: slater.zEff,
      sigma: slater.sigma,
      energyEv: slater.energyEv,
    });
  }

  const maxShellN = Math.max(1, ...Array.from(shellMap.keys()));
  const shellPopulations: number[] = [];
  for (let n = 1; n <= maxShellN; n++) {
    shellPopulations.push(shellMap.get(n) || 0);
  }

  // Valence subshell (prefer highest-energy open subshell; otherwise last filled subshell in Madelung order)
  const openSubshells = subshells.filter((s) => s.electrons < s.capacity);
  const valenceSubshell =
    openSubshells.length > 0
      ? openSubshells[openSubshells.length - 1]
      : subshells[subshells.length - 1] || subshells[0];

  // Last added electron quantum numbers in the valence subshell
  const vBoxCount = valenceSubshell.boxes.length;
  const isSecondHalf = valenceSubshell.electrons > vBoxCount;
  const lastBoxIdx = isSecondHalf
    ? valenceSubshell.electrons - vBoxCount - 1
    : Math.max(0, valenceSubshell.electrons - 1);
  const lastElectronQuantumNumbers = {
    n: valenceSubshell.n,
    l: valenceSubshell.l,
    ml: valenceSubshell.boxes[lastBoxIdx]?.ml ?? 0,
    ms: (isSecondHalf ? -0.5 : 0.5) as 0.5 | -0.5,
  };

  const termSymbol = computeGroundTermSymbol(subshells);

  return {
    Z,
    charge,
    totalElectrons,
    subshells,
    shellPopulations,
    totalUnpaired,
    isParamagnetic: totalUnpaired > 0,
    isAnomalous,
    anomalyNote,
    configString: formatCompactConfig(counts, totalElectrons),
    valenceSubshell,
    lastElectronQuantumNumbers,
    termSymbol,
  };
}

// =========================================================================
// Exact Associated Laguerre Radial Wavefunction R_{n,l}(r) & P_{n,l}(r)
// =========================================================================

function factorial(k: number): number {
  let res = 1;
  for (let i = 2; i <= k; i++) res *= i;
  return res;
}

// Generalized Associated Laguerre Polynomial L_k^alpha(x) using stable 3-term recurrence
export function associatedLaguerre(k: number, alpha: number, x: number): number {
  if (k <= 0) return 1;
  if (k === 1) return 1 + alpha - x;
  let L0 = 1;
  let L1 = 1 + alpha - x;
  for (let j = 2; j <= k; j++) {
    const L2 = ((2 * j - 1 + alpha - x) * L1 - (j - 1 + alpha) * L0) / j;
    L0 = L1;
    L1 = L2;
  }
  return L1;
}

// Exact normalized hydrogenic/Slater radial wavefunction R_{n,l}(r) in Angstrom^{-3/2}
export function evaluateRadialWavefunction(
  n: number,
  l: number,
  zEff: number,
  rAngstrom: number
): number {
  if (n < 1 || l < 0 || l >= n || rAngstrom < 0) return 0;
  const k = n - l - 1;
  const alpha = 2 * l + 1;
  const scale = (2 * zEff) / (n * BOHR_RADIUS_A);
  const rho = scale * rAngstrom;

  // Normalization factor N_{n,l} = sqrt( scale^3 * (n-l-1)! / (2*n * (n+l)!) )
  const norm = Math.sqrt((scale * scale * scale * factorial(k)) / (2 * n * factorial(n + l)));
  const lag = associatedLaguerre(k, alpha, rho);
  const val = norm * Math.exp(-rho / 2) * Math.pow(rho, l) * lag;
  return Number.isFinite(val) ? val : 0;
}

// Exact normalized Radial Probability Density P_{n,l}(r) = r^2 |R_{n,l}(r)|^2 in Angstrom^{-1}
// Satisfies integral_0^infty P_{n,l}(r) dr = 1.000000 exactly!
export function evaluateRadialPdf(
  n: number,
  l: number,
  zEff: number,
  rAngstrom: number
): number {
  if (rAngstrom <= 0) return 0;
  const R = evaluateRadialWavefunction(n, l, zEff, rAngstrom);
  return rAngstrom * rAngstrom * R * R;
}

// Convenience wrapper taking atomic number Z (computes Slater Z_eff for (n, l) automatically)
export function calculateExactRadialPdfForElement(
  n: number,
  l: number,
  Z: number,
  rAngstrom: number,
  charge = 0
): number {
  const { zEff } = computeSlaterScreening(Z, n, l, undefined, charge);
  return evaluateRadialPdf(n, l, zEff, rAngstrom);
}

// Exact numerical roots of L_{n-l-1}^{2l+1}(rho) = 0 converted to Angstroms
export function computeExactRadialNodes(
  n: number,
  l: number,
  zEff: number
): Array<{ r: number; rho: number; label: string }> {
  const k = n - l - 1;
  if (k <= 0) return [];
  const alpha = 2 * l + 1;
  const rhoToR = (n * BOHR_RADIUS_A) / (2 * zEff);

  // Upper bound for roots of Laguerre polynomial L_k^alpha(x): x_max < (sqrt(k) + sqrt(k + alpha + 1))^2
  const rhoMax = Math.pow(Math.sqrt(k) + Math.sqrt(k + alpha + 1), 2) + 2;
  const scanSteps = 600;
  const dRho = rhoMax / scanSteps;

  const rootsRho: number[] = [];
  let prevX = 1e-6;
  let prevY = associatedLaguerre(k, alpha, prevX);

  for (let i = 1; i <= scanSteps && rootsRho.length < k; i++) {
    const x = i * dRho;
    const y = associatedLaguerre(k, alpha, x);
    if (prevY * y <= 0) {
      // Bisection to 1e-9 accuracy
      let lo = prevX;
      let hi = x;
      let yLo = prevY;
      for (let iter = 0; iter < 42; iter++) {
        const mid = 0.5 * (lo + hi);
        const yMid = associatedLaguerre(k, alpha, mid);
        if (Math.abs(yMid) < 1e-12) {
          lo = mid;
          hi = mid;
          break;
        }
        if (yLo * yMid <= 0) {
          hi = mid;
        } else {
          lo = mid;
          yLo = yMid;
        }
      }
      rootsRho.push(0.5 * (lo + hi));
    }
    prevX = x;
    prevY = y;
  }

  const lChar = ['s', 'p', 'd', 'f'][l] || 'g';
  return rootsRho.map((rho, idx) => ({
    r: rho * rhoToR,
    rho,
    label: k === 1 ? `${n}${lChar} node` : `${n}${lChar} N${idx + 1}`,
  }));
}

export function getExactRadialNodesForElement(
  n: number,
  l: number,
  Z: number,
  charge = 0
): Array<{ r: number; label: string }> {
  const { zEff } = computeSlaterScreening(Z, n, l, undefined, charge);
  return computeExactRadialNodes(n, l, zEff).map(({ r, label }) => ({ r, label }));
}

// Exact analytical expectation radius <r> and numerical most probable radius r_mp + display bound rMax
export function computeRadialMetrics(n: number, l: number, zEff: number): {
  rExpectationA: number;
  rMostProbableA: number;
  rDisplayMaxA: number;
  radialNodeCount: number;
  angularNodeCount: number;
  totalNodeCount: number;
} {
  // Exact hydrogenic formula: <r> = (a0 / (2 * Zeff)) * [3n^2 - l(l+1)]
  const rExpectationA = (BOHR_RADIUS_A / (2 * zEff)) * (3 * n * n - l * (l + 1));
  const rDisplayMaxA = Math.max(0.6, rExpectationA * 2.65);

  // Locate global maximum r_mp of P_{n,l}(r)
  let bestR = rExpectationA;
  let bestP = -1;
  const steps = 260;
  for (let i = 1; i <= steps; i++) {
    const r = (i / steps) * rDisplayMaxA;
    const p = evaluateRadialPdf(n, l, zEff, r);
    if (p > bestP) {
      bestP = p;
      bestR = r;
    }
  }

  return {
    rExpectationA,
    rMostProbableA: bestR,
    rDisplayMaxA,
    radialNodeCount: Math.max(0, n - l - 1),
    angularNodeCount: l,
    totalNodeCount: Math.max(0, n - 1),
  };
}

// =========================================================================
// Deterministic Quantum Monte Carlo 3D Cloud & 2D Planar Wavefunction Slice
// =========================================================================

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleOrbitalCloud3D(
  n: number,
  l: number,
  orbitalIndex: number,
  zEff: number,
  pointCount = 1200
): { points: SampledOrbitalPoint[]; rMaxA: number; rExpectationA: number } {
  const variants = REAL_ORBITAL_VARIANTS[l] || REAL_ORBITAL_VARIANTS[0];
  const variant = variants[Math.max(0, Math.min(variants.length - 1, orbitalIndex))];
  const metrics = computeRadialMetrics(n, l, zEff);
  const rMaxA = metrics.rDisplayMaxA;

  // 1. Build exact inverse-CDF table for radial PDF P_{n,l}(r) = r^2 |R_{n,l}(r)|^2
  const cdfSteps = 320;
  const cdf = new Float64Array(cdfSteps + 1);
  const rGrid = new Float64Array(cdfSteps + 1);
  const dr = rMaxA / cdfSteps;
  let accum = 0;
  let prevP = 0;

  for (let i = 1; i <= cdfSteps; i++) {
    const r = i * dr;
    rGrid[i] = r;
    const p = evaluateRadialPdf(n, l, zEff, r);
    accum += 0.5 * (prevP + p) * dr;
    cdf[i] = accum;
    prevP = p;
  }
  const totalProb = accum > 1e-12 ? accum : 1;
  for (let i = 1; i <= cdfSteps; i++) cdf[i] /= totalProb;

  const sampleR = (u: number): number => {
    let lo = 0;
    let hi = cdfSteps;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < u) lo = mid;
      else hi = mid;
    }
    const span = cdf[hi] - cdf[lo];
    const frac = span > 1e-12 ? (u - cdf[lo]) / span : 0;
    return rGrid[lo] + frac * (rGrid[hi] - rGrid[lo]);
  };

  // 2. Estimate maximum |Y|^2 on unit sphere for rejection sampling
  const ySqMaxByL = [0.09, 0.25, 0.42, 0.56];
  const ySqMax = ySqMaxByL[l] || 0.6;

  // Deterministic PRNG seeded by quantum state
  const seed = n * 7919 + l * 104729 + orbitalIndex * 31337 + Math.round(zEff * 100);
  const rng = mulberry32(seed);

  const points: SampledOrbitalPoint[] = [];
  let attempts = 0;
  const maxAttempts = pointCount * 40;

  while (points.length < pointCount && attempts < maxAttempts) {
    attempts++;
    // Uniform direction on unit sphere
    const cosTheta = 2 * rng() - 1;
    const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));
    const phi = 2 * Math.PI * rng();
    const ux = sinTheta * Math.cos(phi);
    const uy = sinTheta * Math.sin(phi);
    const uz = cosTheta;

    const yVal = variant.evalRealHarmonic(ux, uy, uz);
    const ySq = yVal * yVal;
    if (l > 0 && rng() * ySqMax > ySq) continue;

    // Sample exact radial distance from P_{n,l}(r)
    const r = sampleR(rng());
    const rVal = evaluateRadialWavefunction(n, l, zEff, r);
    const psi = rVal * yVal;
    const psiSign: 1 | -1 = psi >= 0 ? 1 : -1;

    points.push({
      x: r * ux,
      y: r * uy,
      z: r * uz,
      r,
      psiSign,
      densityWeight: Math.min(1, Math.sqrt(ySq / ySqMax) * 0.75 + 0.25),
    });
  }

  return { points, rMaxA, rExpectationA: metrics.rExpectationA };
}

export type SlicePlane = 'xz' | 'xy' | 'yz';

export interface OrbitalSlice2DData {
  gridSize: number;
  halfExtentA: number;
  psiGrid: Float32Array; // signed psi(x, y, z)
  maxAbsPsi: number;
  maxProbDensity: number;
}

export function evaluateOrbitalSlice2D(
  n: number,
  l: number,
  orbitalIndex: number,
  zEff: number,
  plane: SlicePlane,
  gridSize = 96
): OrbitalSlice2DData {
  const variants = REAL_ORBITAL_VARIANTS[l] || REAL_ORBITAL_VARIANTS[0];
  const variant = variants[Math.max(0, Math.min(variants.length - 1, orbitalIndex))];
  const metrics = computeRadialMetrics(n, l, zEff);
  const halfExtentA = metrics.rDisplayMaxA * 0.92;

  const psiGrid = new Float32Array(gridSize * gridSize);
  let maxAbsPsi = 1e-9;

  for (let row = 0; row < gridSize; row++) {
    // v goes from +halfExtent (top) to -halfExtent (bottom)
    const v = halfExtentA * (1 - (2 * row) / (gridSize - 1));
    for (let col = 0; col < gridSize; col++) {
      // u goes from -halfExtent (left) to +halfExtent (right)
      const u = halfExtentA * ((2 * col) / (gridSize - 1) - 1);

      let x = 0;
      let y = 0;
      let z = 0;
      if (plane === 'xz') {
        x = u;
        z = v;
      } else if (plane === 'xy') {
        x = u;
        y = v;
      } else {
        y = u;
        z = v;
      }

      const r = Math.hypot(x, y, z);
      let psi = 0;
      if (r > 1e-9) {
        const R = evaluateRadialWavefunction(n, l, zEff, r);
        const Y = variant.evalRealHarmonic(x / r, y / r, z / r);
        psi = R * Y;
      } else if (l === 0) {
        psi = evaluateRadialWavefunction(n, 0, zEff, 0) * variant.evalRealHarmonic(0, 0, 1);
      }

      psiGrid[row * gridSize + col] = psi;
      const absPsi = Math.abs(psi);
      if (absPsi > maxAbsPsi) maxAbsPsi = absPsi;
    }
  }

  return {
    gridSize,
    halfExtentA,
    psiGrid,
    maxAbsPsi,
    maxProbDensity: maxAbsPsi * maxAbsPsi,
  };
}
