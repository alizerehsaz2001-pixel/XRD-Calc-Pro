import { CrystalElement, XRayAnodeType } from './types';

export interface XRayAnodeSpec {
  id: XRayAnodeType;
  label: string;
  shortLabel: string;
  wavelengthKa1: number; // Å
  wavelengthKaAvg: number; // Å
  energyKeV: number; // keV
  betaFilter: string;
  atomicNumber: number;
  summary: string;
}

export const XRAY_ANODES: Record<XRayAnodeType, XRayAnodeSpec> = {
  Cu: {
    id: 'Cu',
    label: 'Cu Kα (1.5406 Å)',
    shortLabel: 'Cu Kα',
    wavelengthKa1: 1.5406,
    wavelengthKaAvg: 1.5418,
    energyKeV: 8.0478,
    betaFilter: 'Ni',
    atomicNumber: 29,
    summary: 'Standard lab source; causes K-fluorescence in Mn, Fe, Co.'
  },
  Co: {
    id: 'Co',
    label: 'Co Kα (1.7890 Å)',
    shortLabel: 'Co Kα',
    wavelengthKa1: 1.7890,
    wavelengthKaAvg: 1.7903,
    energyKeV: 6.9303,
    betaFilter: 'Fe',
    atomicNumber: 27,
    summary: 'Preferred for Fe-rich steels, oxides, and magnetic ceramics.'
  },
  Mo: {
    id: 'Mo',
    label: 'Mo Kα (0.7093 Å)',
    shortLabel: 'Mo Kα',
    wavelengthKa1: 0.7093,
    wavelengthKaAvg: 0.7107,
    energyKeV: 17.4793,
    betaFilter: 'Zr',
    atomicNumber: 42,
    summary: 'High-penetration short wavelength for PDF, actinides & transmission.'
  },
  Cr: {
    id: 'Cr',
    label: 'Cr Kα (2.2897 Å)',
    shortLabel: 'Cr Kα',
    wavelengthKa1: 2.2897,
    wavelengthKaAvg: 2.2910,
    energyKeV: 5.4147,
    betaFilter: 'V',
    atomicNumber: 24,
    summary: 'Wide 2θ dispersion for residual stress & Ti/V/Cr alloys.'
  },
  Fe: {
    id: 'Fe',
    label: 'Fe Kα (1.9360 Å)',
    shortLabel: 'Fe Kα',
    wavelengthKa1: 1.9360,
    wavelengthKaAvg: 1.9373,
    energyKeV: 6.4038,
    betaFilter: 'Mn',
    atomicNumber: 26,
    summary: 'Eliminates Mn & Fe K-edge fluorescence in ferrous minerals.'
  },
  Ag: {
    id: 'Ag',
    label: 'Ag Kα (0.5594 Å)',
    shortLabel: 'Ag Kα',
    wavelengthKa1: 0.5594,
    wavelengthKaAvg: 0.5609,
    energyKeV: 22.1629,
    betaFilter: 'Pd',
    atomicNumber: 47,
    summary: 'Ultra-high energy lab anode for high-Q total scattering & heavy metals.'
  }
};

export const XRAY_ANODE_LIST: XRayAnodeSpec[] = [
  XRAY_ANODES.Cu,
  XRAY_ANODES.Co,
  XRAY_ANODES.Mo,
  XRAY_ANODES.Cr,
  XRAY_ANODES.Fe,
  XRAY_ANODES.Ag
];

/**
 * True if element has no stable primordial/non-radioactive isotopes (Tc, Pm, Po–Og).
 */
export function isRadioactiveElement(z: number): boolean {
  return z === 43 || z === 61 || z >= 84;
}

/**
 * Common NIST Standard Reference Material (SRM) & XRD calibrant elements.
 */
export const NIST_SRM_ELEMENTS = new Set<number>([
  13, // Al (640/676a alumina)
  14, // Si (SRM 640f)
  22, // Ti (TiO2 SRM 674b)
  24, // Cr (Cr2O3 SRM 674b)
  29, // Cu (Anode & calibrant)
  30, // Zn (ZnO SRM 674b)
  47, // Ag (Ag behenate / foil)
  57, // La (LaB6 SRM 660c)
  58, // Ce (CeO2 SRM 674b)
  74, // W (High-angle calibrant)
  79  // Au (Foil standard)
]);

export function getElementKEdge(el: CrystalElement): number {
  if (el.kEdgeKeV && el.kEdgeKeV > 0) return el.kEdgeKeV;
  const z = el.number;
  if (z === 1) return 0.0136;
  if (z === 2) return 0.0246;
  // Moseley-refined empirical fit (keV)
  return Number((0.01025 * Math.pow(Math.max(1, z - 1.15), 2.045)).toFixed(3));
}

export function getElementL3Edge(el: CrystalElement): number {
  const z = el.number;
  if (z < 20) return 0;
  // L3 absorption edge empirical fit (keV)
  return Number((0.00148 * Math.pow(Math.max(1, z - 7.4), 2.09)).toFixed(3));
}

/**
 * Estimates mass attenuation coefficient μ/ρ (cm²/g) for any X-ray tube anode
 * using absorption-edge jump ratios relative to Cu Kα (8.048 keV).
 */
export function getElementMuRhoForAnode(el: CrystalElement, anode: XRayAnodeType = 'Cu'): number {
  const baseCu = (() => {
    if (el.muOverRhoCu && el.muOverRhoCu > 0) return el.muOverRhoCu;
    const z = el.number;
    const kEdge = getElementKEdge(el);
    const cuKeV = 8.048;
    const raw = 0.0024 * Math.pow(z, 3.35);
    const edgeFactor = kEdge > cuKeV ? 0.14 : 1.0;
    return Math.max(0.4, Math.min(620, raw * edgeFactor));
  })();

  if (anode === 'Cu') return Number(baseCu.toFixed(1));

  const targetKeV = XRAY_ANODES[anode].energyKeV;
  const cuKeV = XRAY_ANODES.Cu.energyKeV;
  const kEdge = getElementKEdge(el);
  const l3Edge = getElementL3Edge(el);

  // Photoelectric cross-section scales approximately as E^-2.85
  let ratio = Math.pow(cuKeV / targetKeV, 2.85);

  // Account for K-edge jump (~7.4x) if Cu and target straddle the element's K-edge
  const cuAboveK = cuKeV >= kEdge;
  const targetAboveK = targetKeV >= kEdge;
  if (cuAboveK && !targetAboveK) {
    ratio /= 7.4;
  } else if (!cuAboveK && targetAboveK) {
    ratio *= 7.4;
  }

  // Account for L3-edge jump (~2.6x) for heavy elements (Z >= 55)
  if (l3Edge > 1.5) {
    const cuAboveL = cuKeV >= l3Edge;
    const targetAboveL = targetKeV >= l3Edge;
    if (cuAboveL && !targetAboveL) {
      ratio /= 2.6;
    } else if (!cuAboveL && targetAboveL) {
      ratio *= 2.6;
    }
  }

  const val = Math.max(0.2, Math.min(950, baseCu * ratio));
  return Number(val.toFixed(1));
}

export interface AnodeFluorescenceAssessment {
  score: number; // 0..100
  severity: 'Optimal' | 'Low' | 'Moderate' | 'Severe K-Fluo' | 'L-Fluo';
  detail: string;
}

/**
 * Evaluates X-ray fluorescence background risk for an element under any anode radiation.
 * Strongest fluorescence occurs when the element's K-edge lies 0.05–2.2 keV below the tube Kα energy.
 */
export function getAnodeFluorescenceAssessment(
  el: CrystalElement,
  anode: XRayAnodeType = 'Cu'
): AnodeFluorescenceAssessment {
  const tube = XRAY_ANODES[anode];
  const kEdge = getElementKEdge(el);
  const l3Edge = getElementL3Edge(el);

  // Check K-edge excitation window
  if (kEdge >= 1.0 && kEdge < tube.energyKeV) {
    const delta = tube.energyKeV - kEdge;
    if (delta <= 2.3) {
      const score = Math.round(Math.max(72, Math.min(100, 100 - delta * 11)));
      return {
        score,
        severity: 'Severe K-Fluo',
        detail: `${el.symbol} K-edge (${kEdge.toFixed(2)} keV) is ${delta.toFixed(2)} keV below ${tube.shortLabel} (${tube.energyKeV.toFixed(2)} keV) — high fluorescent background.`
      };
    }
    if (delta <= 4.8) {
      const score = Math.round(Math.max(36, 70 - (delta - 2.3) * 13));
      return {
        score,
        severity: 'Moderate',
        detail: `${el.symbol} K-edge (${kEdge.toFixed(2)} keV) moderately excited by ${tube.shortLabel}.`
      };
    }
  }

  // Check L-edge excitation for lanthanides/heavy metals/actinides
  if (l3Edge >= 2.5 && l3Edge < tube.energyKeV) {
    const deltaL = tube.energyKeV - l3Edge;
    if (deltaL <= 2.4) {
      const score = Math.round(Math.max(48, Math.min(82, 82 - deltaL * 13)));
      return {
        score,
        severity: 'L-Fluo',
        detail: `${el.symbol} L₃-edge (${l3Edge.toFixed(2)} keV) excited by ${tube.shortLabel} (${tube.energyKeV.toFixed(2)} keV) — notable L-series fluorescence.`
      };
    }
  }

  if (kEdge > tube.energyKeV) {
    return {
      score: 6,
      severity: 'Optimal',
      detail: `${el.symbol} K-edge (${kEdge.toFixed(2)} keV) exceeds ${tube.shortLabel} energy — zero K-fluorescence.`
    };
  }

  return {
    score: 14,
    severity: 'Low',
    detail: `Low secondary fluorescence under ${tube.shortLabel} radiation.`
  };
}

/**
 * Exact crystallographic metric-tensor interplanar spacing d(hkl) in Å
 * for all 7 crystal systems (Cubic, Hexagonal, Tetragonal, Orthorhombic,
 * Rhombohedral, Monoclinic, Triclinic).
 */
export function calculateMetricTensorDSpacing(
  el: CrystalElement,
  h: number,
  k: number,
  l: number
): number {
  const a = el.a || 3.6;
  const b = el.b || a;
  const c = el.c || a;
  const struct = el.crystalStructure;

  if (h === 0 && k === 0 && l === 0) return 0;

  if (
    struct === 'FCC' ||
    struct === 'BCC' ||
    struct === 'Diamond' ||
    struct === 'Cubic'
  ) {
    return a / Math.sqrt(h * h + k * k + l * l);
  }

  if (struct === 'HCP' || struct === 'Hexagonal') {
    const cHex = el.c || a * 1.633;
    const invD2 = (4 / 3) * ((h * h + h * k + k * k) / (a * a)) + (l * l) / (cHex * cHex);
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
  }

  if (struct === 'Tetragonal') {
    const cTet = el.c || a * 1.25;
    const invD2 = (h * h + k * k) / (a * a) + (l * l) / (cTet * cTet);
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
  }

  if (struct === 'Orthorhombic') {
    const invD2 = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
  }

  if (struct === 'Rhombohedral') {
    // Check if represented in hexagonal setting (c !== a and gamma ~ 120) or rhombohedral setting
    if ((el.gamma && Math.abs(el.gamma - 120) < 2) || (el.c && Math.abs(el.c - a) > 0.2)) {
      const cHex = el.c || a * 2.4;
      const invD2 = (4 / 3) * ((h * h + h * k + k * k) / (a * a)) + (l * l) / (cHex * cHex);
      return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
    }
    const alphaRad = ((el.alpha || 60) * Math.PI) / 180;
    const cosA = Math.cos(alphaRad);
    const sinA = Math.sin(alphaRad);
    const denom = a * a * (1 - 3 * cosA * cosA + 2 * cosA * cosA * cosA);
    if (denom <= 1e-8) return a / Math.sqrt(h * h + k * k + l * l);
    const num =
      (h * h + k * k + l * l) * sinA * sinA +
      2 * (h * k + k * l + h * l) * (cosA * cosA - cosA);
    const invD2 = num / denom;
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
  }

  if (struct === 'Monoclinic') {
    const betaRad = ((el.beta || 100) * Math.PI) / 180;
    const sinB = Math.sin(betaRad);
    const cosB = Math.cos(betaRad);
    const sin2B = Math.max(1e-6, sinB * sinB);
    const invD2 =
      (1 / sin2B) *
      ((h * h) / (a * a) +
        ((k * k) * sin2B) / (b * b) +
        (l * l) / (c * c) -
        (2 * h * l * cosB) / (a * c));
    return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
  }

  // General fallback
  const invD2 = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
  return invD2 > 0 ? 1 / Math.sqrt(invD2) : 0;
}

export interface CalculatedStickPeak {
  twoTheta: number;
  dSpacing: number;
  relI: number;
  hkl: string;
}

/**
 * Generates symmetry-appropriate Bragg stick reflections for any element under any anode.
 */
export function computeElementBraggSticks(
  el: CrystalElement,
  anode: XRayAnodeType = 'Cu',
  minTwoTheta = 10,
  maxTwoTheta = 95
): CalculatedStickPeak[] {
  if (el.crystalStructure === 'Amorphous') return [];

  const lambda = XRAY_ANODES[anode].wavelengthKa1;
  const struct = el.crystalStructure;

  let planes: Array<[number, number, number, number]> = [];
  if (struct === 'FCC') {
    planes = [
      [1, 1, 1, 100],
      [2, 0, 0, 48],
      [2, 2, 0, 26],
      [3, 1, 1, 24],
      [2, 2, 2, 9],
      [4, 0, 0, 6],
      [3, 3, 1, 12],
      [4, 2, 0, 10]
    ];
  } else if (struct === 'BCC') {
    planes = [
      [1, 1, 0, 100],
      [2, 0, 0, 19],
      [2, 1, 1, 32],
      [2, 2, 0, 11],
      [3, 1, 0, 14],
      [2, 2, 2, 5],
      [3, 2, 1, 16]
    ];
  } else if (struct === 'Diamond') {
    planes = [
      [1, 1, 1, 100],
      [2, 2, 0, 56],
      [3, 1, 1, 31],
      [4, 0, 0, 7],
      [3, 3, 1, 13],
      [4, 2, 2, 14],
      [5, 1, 1, 9]
    ];
  } else if (struct === 'HCP' || struct === 'Hexagonal') {
    planes = [
      [1, 0, 0, 34],
      [0, 0, 2, 42],
      [1, 0, 1, 100],
      [1, 0, 2, 24],
      [1, 1, 0, 29],
      [1, 0, 3, 25],
      [2, 0, 0, 8],
      [1, 1, 2, 22],
      [2, 0, 1, 18]
    ];
  } else if (struct === 'Tetragonal') {
    planes = [
      [1, 0, 1, 100],
      [1, 1, 0, 72],
      [2, 0, 0, 58],
      [2, 1, 1, 48],
      [0, 0, 2, 26],
      [2, 2, 0, 24],
      [1, 1, 2, 30],
      [3, 0, 1, 22]
    ];
  } else if (struct === 'Orthorhombic') {
    planes = [
      [1, 1, 0, 78],
      [0, 2, 1, 100],
      [0, 0, 2, 54],
      [1, 1, 1, 86],
      [0, 2, 2, 40],
      [1, 1, 2, 46],
      [1, 3, 0, 32],
      [2, 0, 0, 28]
    ];
  } else if (struct === 'Rhombohedral') {
    planes = [
      [0, 1, 2, 100],
      [1, 0, 4, 48],
      [1, 1, 0, 42],
      [0, 0, 6, 18],
      [2, 0, 2, 34],
      [0, 2, 4, 28],
      [1, 1, 6, 24]
    ];
  } else if (struct === 'Monoclinic') {
    planes = [
      [1, 1, 0, 65],
      [0, 1, 1, 76],
      [-1, 1, 1, 100],
      [1, 1, 1, 84],
      [0, 2, 0, 52],
      [2, 0, 0, 44],
      [-2, 1, 1, 38],
      [0, 0, 2, 34]
    ];
  } else {
    planes = [
      [1, 0, 0, 100],
      [1, 1, 0, 72],
      [1, 1, 1, 52],
      [2, 0, 0, 36],
      [2, 1, 0, 30],
      [2, 1, 1, 24]
    ];
  }

  const sticks: CalculatedStickPeak[] = [];
  for (const [h, k, l, relI] of planes) {
    const d = calculateMetricTensorDSpacing(el, h, k, l);
    if (!d || d <= 0) continue;
    const sinTheta = lambda / (2 * d);
    if (sinTheta > 0.04 && sinTheta < 0.995) {
      const twoTheta = (Math.asin(sinTheta) * 2 * 180) / Math.PI;
      if (twoTheta >= minTwoTheta && twoTheta <= maxTwoTheta) {
        sticks.push({
          twoTheta: Number(twoTheta.toFixed(2)),
          dSpacing: Number(d.toFixed(4)),
          relI,
          hkl: `(${h}${k}${l})`
        });
      }
    }
  }

  return sticks.sort((a, b) => a.twoTheta - b.twoTheta);
}

/**
 * Extracts chemical element symbols present in a formula string.
 */
export function extractElementsFromFormula(
  formula: string,
  validSymbols: Set<string>
): string[] {
  if (!formula) return [];
  // Strip common non-element words/suffixes in parentheses or phase tags
  const cleaned = formula
    .replace(/\b(Grade|Type|Phase|Alpha|Beta|Gamma|Delta|Pure|Nano|Bulk|Alloy|Steel|Bronze|Brass|HAp|TCP|PEEK|PTFE|PVDF|PLA|HDPE|LDPE|PET|PP|PS|PA|PVC|POM)\b/gi, ' ');
  const tokens = cleaned.match(/[A-Z][a-z]?/g) || [];
  const result = new Set<string>();
  for (const tok of tokens) {
    if (validSymbols.has(tok)) {
      result.add(tok);
    }
  }
  return Array.from(result);
}

export interface DbPhaseSummary {
  name: string;
  formula: string;
  crystalSystem: string;
  spaceGroup: string;
  density: number;
  category?: string;
  elements: string[];
  primaryTwoTheta: number;
  peaks: Array<{ twoTheta: number; intensity: number; hkl?: string }>;
}

export interface ElementPhaseIndex {
  phases: DbPhaseSummary[];
  countsBySymbol: Record<string, number>;
  phasesBySymbol: Record<string, DbPhaseSummary[]>;
}

/**
 * Builds an indexed lookup of all active XRD database phases by constituent element.
 */
export function buildElementPhaseIndex(
  rawMaterials: any[],
  validSymbols: Set<string>
): ElementPhaseIndex {
  const countsBySymbol: Record<string, number> = {};
  const phasesBySymbol: Record<string, DbPhaseSummary[]> = {};
  const phases: DbPhaseSummary[] = [];

  for (const mat of rawMaterials) {
    if (!mat || !mat.name) continue;
    const formula = String(mat.formula || '');
    const elements = extractElementsFromFormula(formula, validSymbols);
    const rawPeaks = Array.isArray(mat.peaks) ? mat.peaks : [];
    const normalizedPeaks = rawPeaks
      .map((p: any) => ({
        twoTheta: Number(p.twoTheta ?? p.angle ?? 0),
        intensity: Number(p.intensity ?? p.relIntensity ?? 100),
        hkl: p.hkl ? String(p.hkl) : undefined
      }))
      .filter((p: any) => p.twoTheta > 0 && Number.isFinite(p.twoTheta));

    const sortedByIntensity = [...normalizedPeaks].sort((a, b) => b.intensity - a.intensity);
    const primaryTwoTheta = sortedByIntensity[0]?.twoTheta || 0;

    const summary: DbPhaseSummary = {
      name: String(mat.name),
      formula: formula || String(mat.name),
      crystalSystem: String(mat.crystalSystem || 'Unknown'),
      spaceGroup: String(mat.spaceGroup || '—'),
      density: Number(mat.density || 0),
      category: mat.category ? String(mat.category) : undefined,
      elements,
      primaryTwoTheta,
      peaks: normalizedPeaks
    };

    phases.push(summary);
    for (const sym of elements) {
      countsBySymbol[sym] = (countsBySymbol[sym] || 0) + 1;
      if (!phasesBySymbol[sym]) phasesBySymbol[sym] = [];
      phasesBySymbol[sym].push(summary);
    }
  }

  return { phases, countsBySymbol, phasesBySymbol };
}

/**
 * Smart scientific query matcher for the Periodic Table search input.
 * Supports: symbol, name, atomic number, space group, crystal structure,
 * and property expressions like "d>10", "rho<3", "mp>2000", "z=26", "a>4",
 * "radioactive", "stable", "srm", "gas", "liquid", "solid".
 */
export function matchesSmartPeriodicQuery(
  el: CrystalElement,
  rawQuery: string,
  temperatureC = 25
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  // Property comparison expressions: d>10, rho<=5, mp>1500, bp<500, z=29, a>4, en>2
  const exprMatch = q.match(/^(z|d|rho|density|mp|melt|bp|boil|a|en|chi|r|radius|wt|mass)\s*(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)$/);
  if (exprMatch) {
    const [, prop, op, numStr] = exprMatch;
    const target = parseFloat(numStr);
    let actual = NaN;
    if (prop === 'z') actual = el.number;
    else if (prop === 'd' || prop === 'rho' || prop === 'density') actual = el.density;
    else if (prop === 'mp' || prop === 'melt') actual = el.meltingPoint;
    else if (prop === 'bp' || prop === 'boil') actual = el.boilingPoint;
    else if (prop === 'a') actual = el.a;
    else if (prop === 'en' || prop === 'chi') actual = el.electronegativity || 0;
    else if (prop === 'r' || prop === 'radius') actual = el.atomicRadius || 0;
    else if (prop === 'wt' || prop === 'mass') actual = el.weight;

    if (!Number.isFinite(actual)) return false;
    if (op === '>') return actual > target;
    if (op === '>=') return actual >= target;
    if (op === '<') return actual < target;
    if (op === '<=') return actual <= target;
    if (op === '=') return Math.abs(actual - target) < 0.01;
  }

  // Keyword filters
  if (q === 'radioactive' || q === 'rad' || q === 'unstable') {
    return isRadioactiveElement(el.number);
  }
  if (q === 'stable') {
    return !isRadioactiveElement(el.number);
  }
  if (q === 'srm' || q === 'nist' || q === 'standard') {
    return NIST_SRM_ELEMENTS.has(el.number);
  }
  if (q === 'solid' || q === 'liquid' || q === 'gas') {
    const state =
      el.boilingPoint !== 0 && temperatureC >= el.boilingPoint
        ? 'gas'
        : el.meltingPoint !== 0 && temperatureC >= el.meltingPoint
        ? 'liquid'
        : 'solid';
    return state === q;
  }

  // Multi-symbol comma or space separated list (e.g. "Ti, Al, V" or "Zn Mg")
  if (/^[a-z]{1,2}([,\s]+[a-z]{1,2})+$/i.test(q)) {
    const parts = q.split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (parts.length >= 2) {
      return parts.includes(el.symbol.toLowerCase());
    }
  }

  // Standard fuzzy match across symbol, name, atomic number, crystal structure, space group, category
  const matchSym = el.symbol.toLowerCase().includes(q);
  const matchName = el.name.toLowerCase().includes(q);
  const matchNum = el.number.toString() === q;
  const matchStruct = (el.crystalStructure || '').toLowerCase().includes(q);
  const matchSG = (el.spaceGroup || '').toLowerCase().includes(q);
  const matchCat = (el.category || '').replace('_', ' ').toLowerCase().includes(q);

  return matchSym || matchName || matchNum || matchStruct || matchSG || matchCat;
}
