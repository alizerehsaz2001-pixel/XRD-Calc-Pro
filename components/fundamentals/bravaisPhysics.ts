import { getActiveMaterials } from '../../utils/materialsHelper';
import type { CrystalSystemId, CenteringType } from './UnitCellsSection';

export interface IndexedDbBravaisMaterial {
  name: string;
  formula: string;
  type: string;
  crystalSystem: string;
  systemId: CrystalSystemId;
  centering: CenteringType;
  pearson: string;
  spaceGroup: string;
  density: number;
  molecularWeight: number;
  description: string;
  parsedLattice: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
    isParsedFromText: boolean;
  };
  peaks: {
    twoTheta: number;
    intensity: number;
    label: string;
  }[];
}

export interface LiveBraggReflection {
  h: number;
  k: number;
  l: number;
  label: string;
  dSpacing: number;
  twoTheta: number;
  qVector: number;
  multiplicity: number;
  relativeIntensity: number;
  allowed: boolean;
}

export interface ForbiddenBravaisProof {
  id: string;
  forbiddenSymbol: string;
  forbiddenName: string;
  systemName: string;
  reducesTo: string;
  reducesToLabel: string;
  verdict: 'redundant' | 'symmetry_broken';
  transformationSummary: string;
  matrix2x2: [[string, string], [string, string]];
  volumeRatio: string;
  proofExplanation: string;
  svgMode: 'tF_to_tI' | 'tC_to_tP' | 'mI_to_mC' | 'mF_to_mC' | 'cC_breaks_cubic' | 'hC_breaks_hex' | 'aCentered_to_aP';
}

export const FORBIDDEN_BRAVAIS_PROOFS: ForbiddenBravaisProof[] = [
  {
    id: 'tF',
    forbiddenSymbol: 'tF',
    forbiddenName: 'Face-Centered Tetragonal',
    systemName: 'Tetragonal',
    reducesTo: 'tI',
    reducesToLabel: 'Body-Centered Tetragonal (BCT)',
    verdict: 'redundant',
    transformationSummary: "a' = ½(a + b), b' = ½(−a + b), c' = c  →  a' = a / √2 (45° Bain Rotation)",
    matrix2x2: [['+½', '+½'], ['−½', '+½']],
    volumeRatio: "V' = V / 2  (Z: 4 → 2)",
    proofExplanation:
      'Rotating the basal axes by 45° around [001] maps the basal face-centered nodes of tF onto the corners of a half-volume square prism. The four lateral face centers at (½,0,½) and (0,½,½) simultaneously become the exact body center (½,½,½) of the new tI cell. This is the famous Bain correspondence linking FCC (c/a = √2 in tI) and BCC (c/a = 1 in tI).',
    svgMode: 'tF_to_tI',
  },
  {
    id: 'tC',
    forbiddenSymbol: 'tC',
    forbiddenName: 'Base-Centered Tetragonal',
    systemName: 'Tetragonal',
    reducesTo: 'tP',
    reducesToLabel: 'Primitive Tetragonal',
    verdict: 'redundant',
    transformationSummary: "a' = ½(a + b), b' = ½(−a + b), c' = c  →  a' = a / √2 (45° Rotation)",
    matrix2x2: [['+½', '+½'], ['−½', '+½']],
    volumeRatio: "V' = V / 2  (Z: 2 → 1)",
    proofExplanation:
      'In a square basal net (a = b, γ = 90°), adding a C-centering node at (½,½,0) creates an identical smaller square grid rotated by 45° with edge a′ = a/√2. Because the new cell still possesses a = b, α = β = γ = 90°, and full 4-fold [001] symmetry with Z = 1, tC is mathematically identical to tP.',
    svgMode: 'tC_to_tP',
  },
  {
    id: 'mI',
    forbiddenSymbol: 'mI',
    forbiddenName: 'Body-Centered Monoclinic',
    systemName: 'Monoclinic',
    reducesTo: 'mC',
    reducesToLabel: 'Base-Centered Monoclinic (C2/m)',
    verdict: 'redundant',
    transformationSummary: "a' = a, b' = b, c' = a + c  (Shear Re-indexing in the (010) Mirror Plane)",
    matrix2x2: [['1', '0'], ['1', '1']],
    volumeRatio: "V' = V  (Z: 2 → 2, β' adjusted)",
    proofExplanation:
      'In Monoclinic (unique axis b), the angle β between a and c is unconstrained. Choosing c′ = a + c (or −a − c) preserves α′ = γ′ = 90° and leaves the unique 2-fold b-axis untouched while moving the body-centered site (½,½,½) directly onto the C-face (½,½,0). Thus I2/a and C2/c represent the exact same mC Bravais lattice (e.g., Moganite I2/a).',
    svgMode: 'mI_to_mC',
  },
  {
    id: 'mF',
    forbiddenSymbol: 'mF',
    forbiddenName: 'Face-Centered Monoclinic',
    systemName: 'Monoclinic',
    reducesTo: 'mC',
    reducesToLabel: 'Base-Centered Monoclinic',
    verdict: 'redundant',
    transformationSummary: "a' = a, b' = b, c' = ½(a + c)  (Halves Cell Volume in ac-Plane)",
    matrix2x2: [['1', '0'], ['+½', '+½']],
    volumeRatio: "V' = V / 2  (Z: 4 → 2)",
    proofExplanation:
      'Because β is unconstrained in the ac-plane, the (010) face center at (½,0,½) acts as a valid new lattice vector c′ = ½(a + c). The remaining face centers (½,½,0) and (0,½,½) collapse onto the C-face of the half-volume mC cell without losing monoclinic 2/m symmetry.',
    svgMode: 'mF_to_mC',
  },
  {
    id: 'cC',
    forbiddenSymbol: 'cC',
    forbiddenName: 'Base-Centered Cubic',
    systemName: 'Cubic',
    reducesTo: 'tP',
    reducesToLabel: 'Primitive Tetragonal (Breaks Cubic Symmetry!)',
    verdict: 'symmetry_broken',
    transformationSummary: "Centering only (001) destroys the four ⟨111⟩ 3-fold triad axes → drops to 4/mmm (tP)",
    matrix2x2: [['+½', '+½'], ['−½', '+½']],
    volumeRatio: "V' = V / 2  (c'/a' = √2, Tetragonal)",
    proofExplanation:
      'A Cubic lattice MUST preserve four 3-fold axes along ⟨111⟩, which permute x → y → z cyclically. Placing a lattice point on the (001) basal faces without also centering (100) and (010) breaks ⟨111⟩ equivalence! The structure immediately loses cubic symmetry and reduces to Primitive Tetragonal (tP) with a′ = a/√2 and c′/a′ = √2.',
    svgMode: 'cC_breaks_cubic',
  },
  {
    id: 'hC',
    forbiddenSymbol: 'hC / hI',
    forbiddenName: 'Base/Body-Centered Hexagonal',
    systemName: 'Hexagonal',
    reducesTo: 'oP / hP',
    reducesToLabel: 'Destroys 6-Fold [0001] Symmetry',
    verdict: 'symmetry_broken',
    transformationSummary: 'Adding (½,½,0) or (½,½,½) to a 120° rhombic cell violates 60° rotational invariance',
    matrix2x2: [['1', '0'], ['0', '1']],
    volumeRatio: 'Breaks 6/mmm → Orthorhombic / Monoclinic',
    proofExplanation:
      'Rotating the centering vector (½,½,0) or (½,½,½) by 60° around the principal hexad axis generates additional interstitial points that do not belong to the original centering set. Consequently, centering a hexagonal cell either destroys 6-fold symmetry (collapsing to Orthorhombic) or generates a denser Primitive Hexagonal (hP) sublattice (e.g., R-centering drops 6-fold to 3-fold hR).',
    svgMode: 'hC_breaks_hex',
  },
  {
    id: 'aCenter',
    forbiddenSymbol: 'aI / aF / aC',
    forbiddenName: 'Centered Triclinic',
    systemName: 'Triclinic',
    reducesTo: 'aP',
    reducesToLabel: 'Primitive Triclinic (Anorthic)',
    verdict: 'redundant',
    transformationSummary: "Any centering vector t_c becomes a valid primitive basis vector (no angle constraints)",
    matrix2x2: [['1', '0'], ['+½', '+½']],
    volumeRatio: "V' = V / Z  (Z → 1 always)",
    proofExplanation:
      'Triclinic imposes zero symmetry constraints on lengths or interaxial angles (a ≠ b ≠ c, α ≠ β ≠ γ). Therefore, replacing one conventional edge with any centering vector (e.g., c′ = ½(a + b + c) for aI or a′ = ½(b + c) for aF) ALWAYS yields a valid smaller Primitive Triclinic (aP) cell with Z = 1.',
    svgMode: 'aCentered_to_aP',
  },
];

const SYSTEM_DEFAULT_PARAMS: Record<
  CrystalSystemId,
  { a: number; b: number; c: number; alpha: number; beta: number; gamma: number }
> = {
  cubic: { a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90 },
  hexagonal: { a: 3.21, b: 3.21, c: 5.21, alpha: 90, beta: 90, gamma: 120 },
  trigonal: { a: 4.91, b: 4.91, c: 5.4, alpha: 90, beta: 90, gamma: 120 },
  tetragonal: { a: 4.59, b: 4.59, c: 2.96, alpha: 90, beta: 90, gamma: 90 },
  orthorhombic: { a: 4.75, b: 10.2, c: 5.98, alpha: 90, beta: 90, gamma: 90 },
  monoclinic: { a: 5.68, b: 15.18, c: 6.29, alpha: 90, beta: 113.8, gamma: 90 },
  triclinic: { a: 8.14, b: 12.78, c: 7.16, alpha: 94.3, beta: 116.6, gamma: 87.7 },
};

/**
 * Classifies a MATERIAL_DB entry into its exact CrystalSystemId, CenteringType, and Pearson symbol (1 of 14 Bravais lattices).
 */
export function classifyMaterialToBravais14(
  crystalSystem?: string,
  spaceGroup?: string
): { systemId: CrystalSystemId; centering: CenteringType; pearson: string } | null {
  const sysL = (crystalSystem || '').toLowerCase().trim();
  if (
    !sysL ||
    sysL.includes('amorphous') ||
    sysL.includes('glass') ||
    sysL.includes('multiple') ||
    sysL.includes('multiphase') ||
    sysL.includes('mixture') ||
    sysL.includes('disordered') ||
    sysL.includes('paracrystalline')
  ) {
    return null;
  }

  const sg = (spaceGroup || '').trim();
  let cChar = sg[0] ? sg[0].toUpperCase() : 'P';
  if (cChar === 'A' || cChar === 'B') cChar = 'C';
  if (!['P', 'I', 'F', 'C', 'R'].includes(cChar)) cChar = 'P';

  if (sysL.includes('ortho')) {
    const cent: CenteringType = (['P', 'I', 'F', 'C'].includes(cChar) ? cChar : 'P') as CenteringType;
    return { systemId: 'orthorhombic', centering: cent, pearson: `o${cent}` };
  }
  if (sysL.includes('cubic') || sysL.includes('fcc') || sysL.includes('bcc')) {
    let cent: CenteringType = (['P', 'I', 'F'].includes(cChar) ? cChar : 'P') as CenteringType;
    if (cent === 'P' && (sysL.includes('fcc') || sysL.includes('face-centered'))) cent = 'F';
    else if (cent === 'P' && (sysL.includes('bcc') || sysL.includes('body-centered'))) cent = 'I';
    return { systemId: 'cubic', centering: cent, pearson: `c${cent}` };
  }
  if (sysL.includes('tetrag')) {
    const cent: CenteringType = cChar === 'I' || sysL.includes('bct') ? 'I' : 'P';
    return { systemId: 'tetragonal', centering: cent, pearson: `t${cent}` };
  }
  if (sysL.includes('mono')) {
    const cent: CenteringType = cChar === 'C' || cChar === 'I' ? 'C' : 'P';
    return { systemId: 'monoclinic', centering: cent, pearson: `m${cent}` };
  }
  if (sysL.includes('triclinic') || sysL.includes('anorthic')) {
    return { systemId: 'triclinic', centering: 'P', pearson: 'aP' };
  }
  if (sysL.includes('trigonal') || sysL.includes('rhombohedral')) {
    if (cChar === 'R' || sysL.includes('rhombohedral')) {
      return { systemId: 'trigonal', centering: 'R', pearson: 'hR' };
    }
    return { systemId: 'hexagonal', centering: 'P', pearson: 'hP' };
  }
  if (sysL.includes('hex') || sysL.includes('hcp')) {
    return { systemId: 'hexagonal', centering: 'P', pearson: 'hP' };
  }
  return null;
}

/**
 * Extracts real lattice constants (a, b, c, alpha, beta, gamma) from material description if present,
 * falling back cleanly to symmetry-valid defaults.
 */
export function parseLatticeFromDescription(
  description: string,
  systemId: CrystalSystemId
): IndexedDbBravaisMaterial['parsedLattice'] {
  const def = { ...SYSTEM_DEFAULT_PARAMS[systemId] };
  const text = description || '';

  const matchNum = (regex: RegExp): number | null => {
    const m = text.match(regex);
    if (!m) return null;
    const val = parseFloat(m[1]);
    return Number.isFinite(val) && val > 0 ? val : null;
  };

  const aVal = matchNum(/\ba\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*(?:Å|A\b)/i);
  const bVal = matchNum(/\bb\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*(?:Å|A\b)/i);
  const cVal = matchNum(/\bc\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*(?:Å|A\b)/i);
  const alphaVal = matchNum(/(?:α|alpha)\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*°?/i);
  const betaVal = matchNum(/(?:β|beta)\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*°?/i);
  const gammaVal = matchNum(/(?:γ|gamma)\s*=\s*([0-9]+(?:\.[0-9]+)?)\s*°?/i);

  let isParsedFromText = false;
  let a = def.a;
  let b = def.b;
  let c = def.c;
  let alpha = def.alpha;
  let beta = def.beta;
  let gamma = def.gamma;

  if (aVal !== null && aVal >= 1.5 && aVal <= 40) {
    a = aVal;
    isParsedFromText = true;
    if (systemId === 'cubic') {
      b = aVal;
      c = aVal;
    } else if (systemId === 'tetragonal' || systemId === 'hexagonal' || systemId === 'trigonal') {
      b = aVal;
    }
  }
  if (bVal !== null && bVal >= 1.5 && bVal <= 45) {
    b = bVal;
    isParsedFromText = true;
  }
  if (cVal !== null && cVal >= 1.5 && cVal <= 60) {
    c = cVal;
    isParsedFromText = true;
  }
  if (alphaVal !== null && alphaVal >= 30 && alphaVal <= 150) {
    alpha = alphaVal;
    isParsedFromText = true;
  }
  if (betaVal !== null && betaVal >= 30 && betaVal <= 150) {
    beta = betaVal;
    isParsedFromText = true;
  }
  if (gammaVal !== null && gammaVal >= 30 && gammaVal <= 150) {
    gamma = gammaVal;
    isParsedFromText = true;
  }

  return { a, b, c, alpha, beta, gamma, isParsedFromText };
}

/**
 * Parses real powder XRD peaks from a MATERIAL_DB entry's `pattern` string.
 */
export function parseMaterialPatternPeaks(pattern?: string): IndexedDbBravaisMaterial['peaks'] {
  if (!pattern) return [];
  const lines = pattern
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const parsed: IndexedDbBravaisMaterial['peaks'] = [];

  for (const line of lines) {
    const parts = line.split(',').map((s) => s.trim());
    if (parts.length < 2) continue;
    const twoTheta = parseFloat(parts[0]);
    const intensity = parseFloat(parts[1]);
    if (!Number.isFinite(twoTheta) || !Number.isFinite(intensity)) continue;
    let label = '';
    if (parts.length >= 5) {
      label = `${parts[2]}${parts[3]}${parts[4]}`;
    } else if (parts.length === 3 && parts[2]) {
      label = parts[2].replace(/[()]/g, '');
    }
    parsed.push({ twoTheta, intensity, label });
  }
  return parsed.sort((a, b) => a.twoTheta - b.twoTheta);
}

/**
 * Builds an indexed view of all crystalline phases in the live MATERIAL_DB grouped by the 14 Bravais lattices & 7 systems.
 */
export function buildBravaisDatabaseIndex(): {
  allPhases: IndexedDbBravaisMaterial[];
  byPearson: Record<string, IndexedDbBravaisMaterial[]>;
  bySystem: Record<CrystalSystemId, IndexedDbBravaisMaterial[]>;
  totalDbCount: number;
} {
  const raw = getActiveMaterials();
  const byPearson: Record<string, IndexedDbBravaisMaterial[]> = {
    cP: [],
    cI: [],
    cF: [],
    hP: [],
    hR: [],
    tP: [],
    tI: [],
    oP: [],
    oI: [],
    oF: [],
    oC: [],
    mP: [],
    mC: [],
    aP: [],
  };
  const bySystem: Record<CrystalSystemId, IndexedDbBravaisMaterial[]> = {
    cubic: [],
    hexagonal: [],
    trigonal: [],
    tetragonal: [],
    orthorhombic: [],
    monoclinic: [],
    triclinic: [],
  };
  const allPhases: IndexedDbBravaisMaterial[] = [];

  for (const m of raw) {
    if (!m || !m.name) continue;
    const cls = classifyMaterialToBravais14(m.crystalSystem, m.spaceGroup);
    if (!cls) continue;

    const entry: IndexedDbBravaisMaterial = {
      name: m.name,
      formula: m.formula || '',
      type: m.type || 'Materials',
      crystalSystem: m.crystalSystem || '',
      systemId: cls.systemId,
      centering: cls.centering,
      pearson: cls.pearson,
      spaceGroup: m.spaceGroup || `${cls.centering}1`,
      density: typeof m.density === 'number' && Number.isFinite(m.density) ? m.density : 3.5,
      molecularWeight:
        typeof m.molecularWeight === 'number' && Number.isFinite(m.molecularWeight)
          ? m.molecularWeight
          : 100,
      description: m.description || '',
      parsedLattice: parseLatticeFromDescription(m.description || '', cls.systemId),
      peaks: parseMaterialPatternPeaks(m.pattern),
    };

    allPhases.push(entry);
    if (byPearson[cls.pearson]) byPearson[cls.pearson].push(entry);
    bySystem[cls.systemId].push(entry);
  }

  return {
    allPhases,
    byPearson,
    bySystem,
    totalDbCount: raw.length,
  };
}

/**
 * Evaluates Bravais centering extinction condition (valid for negative & positive integer h,k,l).
 */
export function isBravaisReflectionAllowed(
  h: number,
  k: number,
  l: number,
  centering: CenteringType,
  isRhombohedralPrimitive = false
): boolean {
  if (h === 0 && k === 0 && l === 0) return false;
  if (centering === 'P') return true;
  if (centering === 'I') return (((h + k + l) % 2) + 2) % 2 === 0;
  if (centering === 'F') {
    const pH = ((h % 2) + 2) % 2;
    const pK = ((k % 2) + 2) % 2;
    const pL = ((l % 2) + 2) % 2;
    return pH === pK && pK === pL;
  }
  if (centering === 'C') return (((h + k) % 2) + 2) % 2 === 0;
  if (centering === 'R') {
    if (isRhombohedralPrimitive) return true;
    return (((-h + k + l) % 3) + 3) % 3 === 0;
  }
  return true;
}

/**
 * Computes exact full-index (including negative indices for oblique/trigonal cells) simulated 1D Powder XRD
 * reflections for any unit cell (a, b, c, α, β, γ), Bravais centering, and X-ray wavelength.
 */
export function computeLiveBravaisPowderPattern(params: {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  centering: CenteringType;
  wavelength: number;
  isRhombohedralPrimitive?: boolean;
  twoThetaMin?: number;
  twoThetaMax?: number;
  maxIndex?: number;
}): {
  allowedPeaks: LiveBraggReflection[];
  extinctPositions: { twoTheta: number; label: string }[];
} {
  const {
    a,
    b,
    c,
    alpha,
    beta,
    gamma,
    centering,
    wavelength,
    isRhombohedralPrimitive = false,
    twoThetaMin = 10,
    twoThetaMax = 90,
    maxIndex = 3,
  } = params;

  const toRad = Math.PI / 180;
  const aR = alpha * toRad;
  const bR = beta * toRad;
  const gR = gamma * toRad;
  const cosA = Math.cos(aR);
  const cosB = Math.cos(bR);
  const cosG = Math.cos(gR);

  const vTerm = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG;
  if (vTerm <= 1e-6 || a <= 0 || b <= 0 || c <= 0) {
    return { allowedPeaks: [], extinctPositions: [] };
  }
  const V2 = a * a * b * b * c * c * vTerm;

  const S11 = b * b * c * c * Math.sin(aR) * Math.sin(aR);
  const S22 = a * a * c * c * Math.sin(bR) * Math.sin(bR);
  const S33 = a * a * b * b * Math.sin(gR) * Math.sin(gR);
  const S12 = a * b * c * c * (cosA * cosB - cosG);
  const S23 = a * a * b * c * (cosB * cosG - cosA);
  const S13 = a * b * b * c * (cosG * cosA - cosB);

  const allowedBuckets = new Map<
    string,
    {
      h: number;
      k: number;
      l: number;
      dSpacing: number;
      twoTheta: number;
      qVector: number;
      mult: number;
    }
  >();
  const extinctBuckets = new Map<string, { twoTheta: number; label: string }>();

  for (let h = -maxIndex; h <= maxIndex; h++) {
    for (let k = -maxIndex; k <= maxIndex; k++) {
      for (let l = -maxIndex; l <= maxIndex; l++) {
        if (h === 0 && k === 0 && l === 0) continue;
        // Canonical hemisphere selection to avoid counting Friedel pairs twice before multiplicity
        if (h < 0 || (h === 0 && k < 0) || (h === 0 && k === 0 && l < 0)) continue;

        const invD2 =
          (S11 * h * h + S22 * k * k + S33 * l * l + 2 * S12 * h * k + 2 * S23 * k * l + 2 * S13 * h * l) /
          V2;
        if (invD2 <= 1e-8) continue;

        const dSpacing = 1 / Math.sqrt(invD2);
        const sinTh = wavelength / (2 * dSpacing);
        if (sinTh <= 0.04 || sinTh >= 0.996) continue;

        const twoTheta = (2 * Math.asin(sinTh) * 180) / Math.PI;
        if (twoTheta < twoThetaMin || twoTheta > twoThetaMax) continue;

        const allowed = isBravaisReflectionAllowed(h, k, l, centering, isRhombohedralPrimitive);
        const key = twoTheta.toFixed(2);
        const score = (h >= 0 ? 0 : 10) + (k >= 0 ? 0 : 10) + (l >= 0 ? 0 : 10) + Math.abs(h) + Math.abs(k) + Math.abs(l);

        if (allowed) {
          const existing = allowedBuckets.get(key);
          if (existing) {
            existing.mult += 2;
            const prevScore =
              (existing.h >= 0 ? 0 : 10) +
              (existing.k >= 0 ? 0 : 10) +
              (existing.l >= 0 ? 0 : 10) +
              Math.abs(existing.h) +
              Math.abs(existing.k) +
              Math.abs(existing.l);
            if (score < prevScore) {
              existing.h = h;
              existing.k = k;
              existing.l = l;
            }
          } else {
            allowedBuckets.set(key, {
              h,
              k,
              l,
              dSpacing,
              twoTheta,
              qVector: (2 * Math.PI) / dSpacing,
              mult: 2,
            });
          }
        } else if (Math.abs(h) <= 2 && Math.abs(k) <= 2 && Math.abs(l) <= 2) {
          if (!extinctBuckets.has(key)) {
            extinctBuckets.set(key, { twoTheta, label: `${h}${k}${l}` });
          }
        }
      }
    }
  }

  // Lorentz-Polarization + form-factor envelope for realistic peak heights
  const rawAllowed = Array.from(allowedBuckets.values())
    .sort((x, y) => x.twoTheta - y.twoTheta)
    .slice(0, 18)
    .map((p) => {
      const thRad = (p.twoTheta * Math.PI) / 360;
      const sinTh = Math.sin(thRad);
      const cosTh = Math.cos(thRad);
      const cos2Th = Math.cos(2 * thRad);
      const lp = (1 + cos2Th * cos2Th) / Math.max(0.05, sinTh * sinTh * cosTh);
      const sOverL = sinTh / wavelength;
      const formFactorSq = Math.exp(-2.8 * sOverL * sOverL);
      const rawI = p.mult * lp * formFactorSq;
      return { ...p, rawI };
    });

  const maxRawI = Math.max(1e-6, ...rawAllowed.map((p) => p.rawI));

  const allowedPeaks: LiveBraggReflection[] = rawAllowed.map((p) => ({
    h: p.h,
    k: p.k,
    l: p.l,
    label: `${p.h}${p.k}${p.l}`,
    dSpacing: p.dSpacing,
    twoTheta: p.twoTheta,
    qVector: p.qVector,
    multiplicity: p.mult,
    relativeIntensity: Math.max(8, Math.round((p.rawI / maxRawI) * 100)),
    allowed: true,
  }));

  const allowedKeys = new Set(allowedPeaks.map((p) => p.twoTheta.toFixed(1)));
  const extinctPositions = Array.from(extinctBuckets.values())
    .filter((e) => !allowedKeys.has(e.twoTheta.toFixed(1)))
    .sort((a, b) => a.twoTheta - b.twoTheta)
    .slice(0, 10);

  return { allowedPeaks, extinctPositions };
}
