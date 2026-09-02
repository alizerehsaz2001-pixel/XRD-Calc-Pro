/**
 * Comprehensive Crystallographic Bragg Basis & Structure Factor Engine
 * Direct Basis Vectors, Reciprocal Basis Vectors, Metric Tensors,
 * Atomic Basis Fractional Coordinates, Cromer-Mann Form Factors,
 * Debye-Waller Attenuation, Phasor Decomposition, and Structure Factors F(hkl).
 */

import { getCromerMannParameters, calculateAtomicFormFactor, xRayPropertiesDb } from '../components/XRayScatteringDb';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface UnitCellParams {
  a: number; // Angstroms
  b: number; // Angstroms
  c: number; // Angstroms
  alpha: number; // degrees
  beta: number; // degrees
  gamma: number; // degrees
}

export interface BasisAtomDefinition {
  id: string;
  label: string;
  element: string;
  coords: [number, number, number]; // fractional [x, y, z]
  occupancy: number; // 0.0 to 1.0
  bFactor: number; // Debye-Waller B in Angstrom^2 (8*pi^2*<u^2>)
  color: string;
  wyckoff?: string;
}

export interface BasisAtomPhasor {
  atom: BasisAtomDefinition;
  dotProduct: number; // hx + ky + lz
  phaseRad: number; // 2 * pi * dotProduct
  phaseDeg: number;
  sVal: number; // sin(theta)/lambda = 1/(2*d)
  f0: number; // bare atomic form factor from Cromer-Mann
  fPrime?: number; // Anomalous dispersion real correction f'
  fDoublePrime?: number; // Anomalous dispersion imaginary correction f''
  dwFactor: number; // exp(-B * s^2)
  fEff: number; // occupancy * f0 * dwFactor (or |fEff_complex|)
  realComponent: number; // fEff * cos(phaseRad) or complex real part
  imagComponent: number; // fEff * sin(phaseRad) or complex imag part
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface DirectAndReciprocalBasis {
  // Direct Space
  aVec: Vector3D;
  bVec: Vector3D;
  cVec: Vector3D;
  directVolume: number; // Angstrom^3
  directMetricTensor: [[number, number, number], [number, number, number], [number, number, number]];

  // Reciprocal Space (Crystallographer's convention: a . a* = 1)
  aStarVec: Vector3D;
  bStarVec: Vector3D;
  cStarVec: Vector3D;
  reciprocalVolume: number; // Angstrom^-3
  reciprocalMetricTensor: [[number, number, number], [number, number, number], [number, number, number]];
  reciprocalParams: {
    aStar: number;
    bStar: number;
    cStar: number;
    alphaStar: number;
    betaStar: number;
    gammaStar: number;
  };
}

export interface StructureFactorOptions {
  includeAnomalous?: boolean;
  radiationType?: 'CuKa' | 'MoKa' | 'Custom';
  crystalSystem?: string;
  spaceGroup?: string;
  spaceGroupNumber?: number;
}

export interface StructureFactorResult {
  h: number;
  k: number;
  l: number;
  hklStr: string;
  dSpacing: number;
  twoTheta: number; // degrees (for given wavelength)
  theta: number; // degrees
  isBraggAllowedByWavelength: boolean;
  qMagnitude: number; // Angstrom^-1 (|Q| = 4*pi*sin(theta)/lambda)
  gHklVec: Vector3D; // Reciprocal lattice vector G_hkl
  
  // Structure Factor F(hkl)
  fReal: number;
  fImag: number;
  fMag: number; // |F(hkl)|
  fPhaseDeg: number; // arg(F) in degrees [-180, 180]
  fSquared: number; // |F(hkl)|^2
  
  // Friedel Pair & Anomalous Dispersion (Bijvoet violation)
  anomalousIncluded?: boolean;
  fFriedelReal?: number;
  fFriedelImag?: number;
  fFriedelMag?: number;
  fFriedelPhaseDeg?: number;
  fFriedelSquared?: number;
  fFriedelDiff?: number; // |F(hkl)|^2 - |F(-h-k-l)|^2
  bijvoetRatio?: number; // 2 * (|F| - |F_bar|) / (|F| + |F_bar|)

  // Kinematic Powder Multiplicity & Intensity
  multiplicity: number;
  lorentzPolarization: number;
  theoreticalRelativeIntensity: number; // |F|^2 * LP * M
  isExtinct: boolean; // True if |F| == 0 due to basis symmetry cancellation
  extinctionReason?: string;
  extinctionClass?: 'centering' | 'screw' | 'glide' | 'basis_cancellation' | 'none';
  isSpaceGroupAllowed?: boolean;
  phasors: BasisAtomPhasor[];
}

export interface EwaldKinematicsResult {
  wavelength: number;
  twoThetaDeg: number;
  thetaDeg: number;
  dSpacing: number;
  reflectionOrder: number;
  k0Mag: number; // 1 / lambda (in Angstrom^-1)
  k0Vec: Vector3D; // Incident wavevector
  khVec: Vector3D; // Diffracted wavevector
  qVec: Vector3D;  // Scattering vector Q = kh - k0
  qMag: number;    // |Q| = 2*sin(theta)/lambda
  gVectorMag: number; // n / d
  excitationError: number; // s_g = |Q| - n/d (Angstrom^-1)
  isBraggCondition: boolean; // |s_g| < 0.002
  crystalliteThicknessA: number;
  rockingCurveIntensity: number; // (sin(pi * t * s_g) / (pi * t * s_g))^2
  rockingCurveFwhmDeg: number; // ~ 0.89 * lambda / (t * cos(theta_B)) * (180 / pi)
  ewaldRadius: number; // 1 / lambda
}

export interface KinematicPeakSummary {
  h: number;
  k: number;
  l: number;
  hklStr: string;
  dSpacing: number;
  twoTheta: number;
  theta: number;
  qMagnitude: number;
  fReal: number;
  fImag: number;
  fMag: number;
  fSquared: number;
  multiplicity: number;
  lorentzPolarization: number;
  rawIntensity: number; // |F|^2 * LP * M
  relativeIntensity: number; // % of max
  isExtinct: boolean;
  extinctionReason?: string;
}

export interface InterplanarAngleResult {
  h1: [number, number, number];
  h2: [number, number, number];
  angleDeg: number;
  angleRad: number;
  cosAngle: number;
  d1: number;
  d2: number;
  zoneAxis: [number, number, number];
  weissCondition1: number;
  weissCondition2: number;
}

export interface CrystalBasisPreset {
  id: string;
  name: string;
  formula: string;
  crystalSystem: string;
  spaceGroup: string;
  spaceGroupNumber: number;
  description: string;
  defaultLattice: UnitCellParams;
  basisAtoms: BasisAtomDefinition[];
}

// -----------------------------------------------------------------------------
// Vector Mathematics Utilities
// -----------------------------------------------------------------------------

export function crossProduct(v1: Vector3D, v2: Vector3D): Vector3D {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
}

export function dotProduct(v1: Vector3D, v2: Vector3D): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

export function vectorLength(v: Vector3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function scaleVector(v: Vector3D, s: number): Vector3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function addVectors(v1: Vector3D, v2: Vector3D): Vector3D {
  return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z };
}

// -----------------------------------------------------------------------------
// Direct & Reciprocal Basis Calculation
// -----------------------------------------------------------------------------

export function computeDirectAndReciprocalBasis(params: UnitCellParams): DirectAndReciprocalBasis {
  const { a, b, c, alpha, beta, gamma } = params;
  const radAlpha = (alpha * Math.PI) / 180;
  const radBeta = (beta * Math.PI) / 180;
  const radGamma = (gamma * Math.PI) / 180;

  const cosA = Math.cos(radAlpha);
  const cosB = Math.cos(radBeta);
  const cosG = Math.cos(radGamma);
  const sinG = Math.sin(radGamma);

  // Standard Cartesian orientation:
  // a along X axis
  // b in XY plane
  // c chosen so that a, b, c form a right-handed basis
  const aVec: Vector3D = { x: a, y: 0, z: 0 };
  const bVec: Vector3D = { x: b * cosG, y: b * sinG, z: 0 };

  const cx = c * cosB;
  const cy = c * (cosA - cosB * cosG) / Math.max(1e-7, sinG);
  const czSq = Math.max(0, c * c - cx * cx - cy * cy);
  const cz = Math.sqrt(czSq);
  const cVec: Vector3D = { x: cx, y: cy, z: cz };

  // Volume of unit cell = a . (b x c)
  const bCrossC = crossProduct(bVec, cVec);
  const directVolume = Math.abs(dotProduct(aVec, bCrossC));

  // Direct Metric Tensor G_ij = v_i . v_j
  const g11 = dotProduct(aVec, aVec);
  const g12 = dotProduct(aVec, bVec);
  const g13 = dotProduct(aVec, cVec);
  const g22 = dotProduct(bVec, bVec);
  const g23 = dotProduct(bVec, cVec);
  const g33 = dotProduct(cVec, cVec);

  const directMetricTensor: [[number, number, number], [number, number, number], [number, number, number]] = [
    [g11, g12, g13],
    [g12, g22, g23],
    [g13, g23, g33]
  ];

  // Reciprocal Basis Vectors (Crystallographer's convention a_i . a*_j = delta_ij)
  const safeVol = Math.max(1e-7, directVolume);
  const aStarVec = scaleVector(crossProduct(bVec, cVec), 1 / safeVol);
  const bStarVec = scaleVector(crossProduct(cVec, aVec), 1 / safeVol);
  const cStarVec = scaleVector(crossProduct(aVec, bVec), 1 / safeVol);

  const aStarLen = vectorLength(aStarVec);
  const bStarLen = vectorLength(bStarVec);
  const cStarLen = vectorLength(cStarVec);

  const dotBStarCStar = dotProduct(bStarVec, cStarVec);
  const dotCStarAStar = dotProduct(cStarVec, aStarVec);
  const dotAStarBStar = dotProduct(aStarVec, bStarVec);

  const alphaStar = (Math.acos(Math.max(-1, Math.min(1, dotBStarCStar / (bStarLen * cStarLen)))) * 180) / Math.PI;
  const betaStar = (Math.acos(Math.max(-1, Math.min(1, dotCStarAStar / (cStarLen * aStarLen)))) * 180) / Math.PI;
  const gammaStar = (Math.acos(Math.max(-1, Math.min(1, dotAStarBStar / (aStarLen * bStarLen)))) * 180) / Math.PI;

  const reciprocalMetricTensor: [[number, number, number], [number, number, number], [number, number, number]] = [
    [dotProduct(aStarVec, aStarVec), dotProduct(aStarVec, bStarVec), dotProduct(aStarVec, cStarVec)],
    [dotProduct(bStarVec, aStarVec), dotProduct(bStarVec, bStarVec), dotProduct(bStarVec, cStarVec)],
    [dotProduct(cStarVec, aStarVec), dotProduct(cStarVec, bStarVec), dotProduct(cStarVec, cStarVec)]
  ];

  const reciprocalVolume = 1 / safeVol;

  return {
    aVec,
    bVec,
    cVec,
    directVolume,
    directMetricTensor,
    aStarVec,
    bStarVec,
    cStarVec,
    reciprocalVolume,
    reciprocalMetricTensor,
    reciprocalParams: {
      aStar: aStarLen,
      bStar: bStarLen,
      cStar: cStarLen,
      alphaStar,
      betaStar,
      gammaStar
    }
  };
}

// -----------------------------------------------------------------------------
// Element Z Number Helper
// -----------------------------------------------------------------------------

const ELEMENT_Z_MAP: Record<string, number> = {
  H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10,
  Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18,
  K: 19, Ca: 20, Sc: 21, Ti: 22, V: 23, Cr: 24, Mn: 25, Fe: 26, Co: 27, Ni: 28, Cu: 29, Zn: 30,
  Ga: 31, Ge: 32, As: 33, Se: 34, Br: 35, Kr: 36, Rb: 37, Sr: 38, Y: 39, Zr: 40,
  Nb: 41, Mo: 42, Tc: 43, Ru: 44, Rh: 45, Pd: 46, Ag: 47, Cd: 48, In: 49, Sn: 50,
  Sb: 51, Te: 52, I: 53, Xe: 54, Cs: 55, Ba: 56, La: 57, Ce: 58, Pr: 59, Nd: 60,
  Sm: 62, Eu: 63, Gd: 64, Tb: 65, Dy: 66, Ho: 67, Er: 68, Tm: 69, Yb: 70, Lu: 71,
  Hf: 72, Ta: 73, W: 74, Re: 75, Os: 76, Ir: 77, Pt: 78, Au: 79, Hg: 80, Tl: 81, Pb: 82, Bi: 83,
  Th: 90, U: 92
};

export function getElementAtomicNumber(symbol: string): number {
  const clean = (symbol || '').trim();
  if (!clean) return 14;
  const titleCase = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  return ELEMENT_Z_MAP[titleCase] || 14; // default silicon if unrecognized
}

// -----------------------------------------------------------------------------
// Crystallographic Multiplicity M(hkl) Engine
// -----------------------------------------------------------------------------

export function calculateCrystallographicMultiplicity(
  h: number,
  k: number,
  l: number,
  crystalSystem: string = 'Cubic'
): number {
  const absH = Math.abs(h);
  const absK = Math.abs(k);
  const absL = Math.abs(l);
  const sys = (crystalSystem || 'Cubic').toLowerCase();

  // Non-zero counts and equality
  const nonZeros = [absH, absK, absL].filter(v => v > 0).length;
  const isAllEqual = absH === absK && absK === absL;
  const isTwoEqual = absH === absK || absK === absL || absH === absL;

  if (sys.includes('cubic')) {
    if (nonZeros === 1) return 6; // {h00}
    if (nonZeros === 2) {
      if (isTwoEqual) return 12; // {hh0}
      return 24; // {hk0}
    }
    // nonZeros === 3
    if (isAllEqual) return 8; // {hhh}
    if (isTwoEqual) return 24; // {hhl}
    return 48; // {hkl}
  }

  if (sys.includes('tetragonal')) {
    if (absH === 0 && absK === 0) return 2; // {00l}
    if (absL === 0) {
      if (absH === 0 || absK === 0) return 4; // {h00} or {0k0}
      if (absH === absK) return 4; // {hh0}
      return 8; // {hk0}
    }
    // l != 0
    if (absH === 0 || absK === 0) return 8; // {h0l}
    if (absH === absK) return 8; // {hhl}
    return 16; // {hkl}
  }

  if (sys.includes('hexagonal') || sys.includes('trigonal') || sys.includes('rhombohedral')) {
    if (absH === 0 && absK === 0) return 2; // {00l}
    if (absL === 0) {
      if (absH === 0 || absK === 0 || absH === absK) return 6; // {h00}, {0k0}, {hh0}
      return 12; // {hk0}
    }
    if (absH === 0 || absK === 0 || absH === absK) return 12; // {h0l}
    return 24; // {hkl}
  }

  if (sys.includes('orthorhombic')) {
    if (nonZeros === 1) return 2; // {h00}, {0k0}, {00l}
    if (nonZeros === 2) return 4; // {hk0}, {h0l}, {0kl}
    return 8; // {hkl}
  }

  if (sys.includes('monoclinic')) {
    if (absH === 0 && absL === 0) return 2; // {0k0} unique b-axis
    if (absK === 0) return 2; // {h0l}
    return 4; // {hkl}
  }

  // Triclinic (inversion center only)
  return 2; // (hkl) and (-h-k-l)
}

// -----------------------------------------------------------------------------
// Systematic Space Group Extinction Rules Engine
// -----------------------------------------------------------------------------

export function checkSpaceGroupExtinction(
  h: number,
  k: number,
  l: number,
  spaceGroup: string = '',
  spaceGroupNumber: number = 0
): { isExtinct: boolean; reason?: string; type?: 'centering' | 'screw' | 'glide' | 'none' } {
  const sg = (spaceGroup || '').trim();
  const sgNum = spaceGroupNumber;

  // 1. Centering Translations
  const firstLetter = sg.charAt(0).toUpperCase();

  if (firstLetter === 'I' || (sgNum >= 71 && sgNum <= 74) || (sgNum >= 107 && sgNum <= 110) || (sgNum >= 139 && sgNum <= 142) || (sgNum >= 229 && sgNum <= 230)) {
    // Body-centered (I): h + k + l must be even
    if (((h + k + l) % 2 + 2) % 2 !== 0) {
      return {
        isExtinct: true,
        type: 'centering',
        reason: `Body-Centered (I) extinction rule violated: h + k + l = ${h + k + l} (must be even 2n). Destructive interference across (½, ½, ½) translation.`
      };
    }
  } else if (firstLetter === 'F' || (sgNum >= 225 && sgNum <= 228)) {
    // Face-centered (F): h, k, l must be unmixed (all even or all odd)
    const hParity = (h % 2 + 2) % 2;
    const kParity = (k % 2 + 2) % 2;
    const lParity = (l % 2 + 2) % 2;
    if (hParity !== kParity || kParity !== lParity) {
      return {
        isExtinct: true,
        type: 'centering',
        reason: `Face-Centered (F) extinction rule violated: indices (${h}, ${k}, ${l}) are mixed parity (must be all even or all odd). Destructive interference across face centers (0,½,½), (½,0,½), (½,½,0).`
      };
    }
  } else if (firstLetter === 'C') {
    // C-centered: h + k must be even
    if (((h + k) % 2 + 2) % 2 !== 0) {
      return {
        isExtinct: true,
        type: 'centering',
        reason: `Base-Centered (C) extinction rule violated: h + k = ${h + k} (must be even 2n). Destructive interference across (½, ½, 0) translation.`
      };
    }
  } else if (firstLetter === 'R') {
    // Rhombohedral (obverse setting): -h + k + l = 3n
    if (((-h + k + l) % 3 + 3) % 3 !== 0) {
      return {
        isExtinct: true,
        type: 'centering',
        reason: `Rhombohedral (R-hex) extinction rule violated: -h + k + l = ${-h + k + l} (must be a multiple of 3n).`
      };
    }
  }

  // 2. Diamond glide (d-glide) e.g., Fd-3m (Space Group 227 - Silicon / Diamond / Spinel)
  if (sg.includes('d') || sgNum === 227) {
    // For Fd-3m: In addition to F-centering, for (hkl) all even, h + k + l must be 4n for non-zero reflections
    const hEven = h % 2 === 0;
    const kEven = k % 2 === 0;
    const lEven = l % 2 === 0;
    if (hEven && kEven && lEven) {
      if (((h + k + l) % 4 + 4) % 4 !== 0) {
        return {
          isExtinct: true,
          type: 'glide',
          reason: `Diamond glide (d) extinction in Fd-3m: For even indices, h + k + l = ${h + k + l} must be a multiple of 4n (destructive cancellation between FCC and (¼,¼,¼) sublattices).`
        };
      }
    }
  }

  // 3. Screw Axes (e.g. 6_3 in P6_3/mmc or P6_3mc, 4_1 in I4_1/amd)
  if (sg.includes('6_3') || sgNum === 194 || sgNum === 186) {
    // 00l reflections require l = 2n
    if (h === 0 && k === 0 && l !== 0) {
      if (((l % 2) + 2) % 2 !== 0) {
        return {
          isExtinct: true,
          type: 'screw',
          reason: `6₃ screw axis extinction: (0 0 ${l}) reflection requires l = 2n (odd l canceled by half-translation along c-axis).`
        };
      }
    }
  }

  if (sg.includes('4_1') || sgNum === 141) {
    // 00l reflections require l = 4n
    if (h === 0 && k === 0 && l !== 0) {
      if (((l % 4) + 4) % 4 !== 0) {
        return {
          isExtinct: true,
          type: 'screw',
          reason: `4₁ screw axis extinction in ${sg}: (0 0 ${l}) requires l = 4n.`
        };
      }
    }
  }

  return { isExtinct: false, type: 'none' };
}

// -----------------------------------------------------------------------------
// Structure Factor F(hkl) Calculation with Anomalous Dispersion & Bijvoet Pairs
// -----------------------------------------------------------------------------

export function calculateStructureFactor(
  h: number,
  k: number,
  l: number,
  params: UnitCellParams,
  basisAtoms: BasisAtomDefinition[],
  wavelength: number,
  options?: StructureFactorOptions
): StructureFactorResult {
  const basis = computeDirectAndReciprocalBasis(params);
  
  // Reciprocal vector G_hkl = h a* + k b* + l c*
  const gHklVec: Vector3D = {
    x: h * basis.aStarVec.x + k * basis.bStarVec.x + l * basis.cStarVec.x,
    y: h * basis.aStarVec.y + k * basis.bStarVec.y + l * basis.cStarVec.y,
    z: h * basis.aStarVec.z + k * basis.bStarVec.z + l * basis.cStarVec.z
  };

  const gMag = vectorLength(gHklVec);
  const dSpacing = gMag > 1e-7 ? 1 / gMag : 0;

  // Bragg condition: sin(theta) = lambda / (2 * d)
  let twoTheta = 0;
  let theta = 0;
  let isBraggAllowedByWavelength = false;
  let qMagnitude = 0;
  let lorentzPolarization = 1.0;

  if (dSpacing > 0) {
    const sinTheta = wavelength / (2 * dSpacing);
    if (sinTheta <= 1.0) {
      theta = (Math.asin(sinTheta) * 180) / Math.PI;
      twoTheta = 2 * theta;
      isBraggAllowedByWavelength = true;
      qMagnitude = (4 * Math.PI * sinTheta) / wavelength;

      // Lorentz-Polarization factor for unpolarized powder XRD: (1 + cos^2(2theta)) / (sin^2(theta) * cos(theta))
      const radTheta = (theta * Math.PI) / 180;
      const rad2Theta = (twoTheta * Math.PI) / 180;
      const sinT = Math.sin(radTheta);
      const cosT = Math.cos(radTheta);
      if (sinT > 0.001 && cosT > 0.001) {
        lorentzPolarization = (1 + Math.pow(Math.cos(rad2Theta), 2)) / (Math.pow(sinT, 2) * cosT);
      }
    }
  }

  // s = sin(theta)/lambda = 1 / (2*d)
  const sVal = dSpacing > 0 ? 1 / (2 * dSpacing) : 0;

  const includeAnomalous = options?.includeAnomalous ?? false;
  const isMoRad = (options?.radiationType === 'MoKa') || (wavelength < 1.0);

  let currentRealX = 0;
  let currentImagY = 0;
  const phasors: BasisAtomPhasor[] = [];

  let totalReal = 0;
  let totalImag = 0;

  // Opposite Friedel reflection (-h, -k, -l) accumulators for Bijvoet violation test
  let totalFriedelReal = 0;
  let totalFriedelImag = 0;

  for (const atom of basisAtoms) {
    const zNum = getElementAtomicNumber(atom.element);
    const cmCoeffs = getCromerMannParameters(zNum);
    const f0 = calculateAtomicFormFactor(cmCoeffs, sVal);

    // Look up anomalous dispersion f' and f''
    let fPrime = 0;
    let fDoublePrime = 0;
    if (includeAnomalous) {
      const prop = xRayPropertiesDb[zNum];
      if (prop) {
        fPrime = isMoRad ? (prop.fPrimeMo ?? 0) : (prop.fPrimeCu ?? 0);
        fDoublePrime = isMoRad ? (prop.fDoublePrimeMo ?? 0) : (prop.fDoublePrimeCu ?? 0);
      }
    }
    
    // Debye-Waller attenuation: exp(-B * s^2)
    const dwFactor = Math.exp(-atom.bFactor * Math.pow(sVal, 2));
    const fEffBase = atom.occupancy * dwFactor;

    // Phase: phi = 2*pi*(h*x + k*y + l*z)
    const dotProd = h * atom.coords[0] + k * atom.coords[1] + l * atom.coords[2];
    const phaseRad = 2 * Math.PI * dotProd;
    const phaseDeg = ((dotProd % 1) * 360 + 360) % 360;

    const cosPhi = Math.cos(phaseRad);
    const sinPhi = Math.sin(phaseRad);

    // Form factor with anomalous dispersion: (f0 + f') + i*f''
    // ( (f0 + f') + i*f'' ) * ( cos(phi) + i*sin(phi) )
    // Real = (f0 + f')*cos(phi) - f''*sin(phi)
    // Imag = (f0 + f')*sin(phi) + f''*cos(phi)
    const realComp = fEffBase * ((f0 + fPrime) * cosPhi - fDoublePrime * sinPhi);
    const imagComp = fEffBase * ((f0 + fPrime) * sinPhi + fDoublePrime * cosPhi);

    // Friedel opposite reflection: phase is -phi -> cos(-phi) = cos(phi), sin(-phi) = -sin(phi)
    const friedelRealComp = fEffBase * ((f0 + fPrime) * cosPhi + fDoublePrime * sinPhi);
    const friedelImagComp = fEffBase * (-(f0 + fPrime) * sinPhi + fDoublePrime * cosPhi);

    const startX = currentRealX;
    const startY = currentImagY;
    currentRealX += realComp;
    currentImagY += imagComp;

    phasors.push({
      atom,
      dotProduct: dotProd,
      phaseRad,
      phaseDeg,
      sVal,
      f0,
      fPrime: includeAnomalous ? fPrime : undefined,
      fDoublePrime: includeAnomalous ? fDoublePrime : undefined,
      dwFactor,
      fEff: fEffBase * Math.sqrt(Math.pow(f0 + fPrime, 2) + Math.pow(fDoublePrime, 2)),
      realComponent: realComp,
      imagComponent: imagComp,
      startX,
      startY,
      endX: currentRealX,
      endY: currentImagY
    });

    totalReal += realComp;
    totalImag += imagComp;
    totalFriedelReal += friedelRealComp;
    totalFriedelImag += friedelImagComp;
  }

  // Clean floating point noise near zero
  if (Math.abs(totalReal) < 1e-6) totalReal = 0;
  if (Math.abs(totalImag) < 1e-6) totalImag = 0;
  if (Math.abs(totalFriedelReal) < 1e-6) totalFriedelReal = 0;
  if (Math.abs(totalFriedelImag) < 1e-6) totalFriedelImag = 0;

  const fMag = Math.sqrt(totalReal * totalReal + totalImag * totalImag);
  const fPhaseDeg = (Math.atan2(totalImag, totalReal) * 180) / Math.PI;
  const fSquared = fMag * fMag;

  // Friedel pair metrics
  const fFriedelMag = Math.sqrt(totalFriedelReal * totalFriedelReal + totalFriedelImag * totalFriedelImag);
  const fFriedelPhaseDeg = (Math.atan2(totalFriedelImag, totalFriedelReal) * 180) / Math.PI;
  const fFriedelSquared = fFriedelMag * fFriedelMag;
  const fFriedelDiff = fSquared - fFriedelSquared;
  const bijvoetRatio = (fMag + fFriedelMag) > 1e-6 ? (2 * (fMag - fFriedelMag)) / (fMag + fFriedelMag) : 0;

  // Accurate crystallographic multiplicity M_hkl
  const multiplicity = calculateCrystallographicMultiplicity(h, k, l, options?.crystalSystem || 'Cubic');

  const theoreticalRelativeIntensity = fSquared * lorentzPolarization * multiplicity;

  // Extinction audit: check space group conditions first, then basis summation cancellation
  let isExtinct = false;
  let extinctionReason: string | undefined = undefined;
  let extinctionClass: 'centering' | 'screw' | 'glide' | 'basis_cancellation' | 'none' = 'none';

  if (options?.spaceGroup || options?.spaceGroupNumber) {
    const sgAudit = checkSpaceGroupExtinction(h, k, l, options.spaceGroup || '', options.spaceGroupNumber || 0);
    if (sgAudit.isExtinct) {
      isExtinct = true;
      extinctionReason = sgAudit.reason;
      extinctionClass = sgAudit.type || 'centering';
    }
  }

  const sumFEff = phasors.reduce((acc, p) => acc + p.fEff, 0);
  if (!isExtinct && fMag < 1e-3 * Math.max(1, sumFEff)) {
    isExtinct = true;
    extinctionClass = 'basis_cancellation';
    extinctionReason = `Destructive cancellation across basis atoms: F(${h}${k}${l}) = 0. Real part = ${totalReal.toFixed(3)}, Imag part = ${totalImag.toFixed(3)}.`;
  }

  return {
    h,
    k,
    l,
    hklStr: `(${h} ${k} ${l})`,
    dSpacing,
    twoTheta,
    theta,
    isBraggAllowedByWavelength,
    qMagnitude,
    gHklVec,
    fReal: totalReal,
    fImag: totalImag,
    fMag,
    fPhaseDeg,
    fSquared,
    anomalousIncluded: includeAnomalous,
    fFriedelReal: totalFriedelReal,
    fFriedelImag: totalFriedelImag,
    fFriedelMag,
    fFriedelPhaseDeg,
    fFriedelSquared,
    fFriedelDiff,
    bijvoetRatio,
    multiplicity,
    lorentzPolarization,
    theoreticalRelativeIntensity,
    isExtinct,
    extinctionReason,
    extinctionClass,
    isSpaceGroupAllowed: !isExtinct,
    phasors
  };
}

// -----------------------------------------------------------------------------
// Interplanar Angle & Zone Axis Geometry Engine
// -----------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function calculateInterplanarAngle(
  h1: number,
  k1: number,
  l1: number,
  h2: number,
  k2: number,
  l2: number,
  params: UnitCellParams
): InterplanarAngleResult {
  const basis = computeDirectAndReciprocalBasis(params);
  const GStar = basis.reciprocalMetricTensor;

  // Metric tensor quadratic products: G_1 . G_2 = h1^T G* h2
  const g1g1 = 
    h1 * (GStar[0][0] * h1 + GStar[0][1] * k1 + GStar[0][2] * l1) +
    k1 * (GStar[1][0] * h1 + GStar[1][1] * k1 + GStar[1][2] * l1) +
    l1 * (GStar[2][0] * h1 + GStar[2][1] * k1 + GStar[2][2] * l1);

  const g2g2 = 
    h2 * (GStar[0][0] * h2 + GStar[0][1] * k2 + GStar[0][2] * l2) +
    k2 * (GStar[1][0] * h2 + GStar[1][1] * k2 + GStar[1][2] * l2) +
    l2 * (GStar[2][0] * h2 + GStar[2][1] * k2 + GStar[2][2] * l2);

  const g1g2 = 
    h1 * (GStar[0][0] * h2 + GStar[0][1] * k2 + GStar[0][2] * l2) +
    k1 * (GStar[1][0] * h2 + GStar[1][1] * k2 + GStar[1][2] * l2) +
    l1 * (GStar[2][0] * h2 + GStar[2][1] * k2 + GStar[2][2] * l2);

  const d1 = g1g1 > 1e-8 ? 1 / Math.sqrt(g1g1) : 0;
  const d2 = g2g2 > 1e-8 ? 1 / Math.sqrt(g2g2) : 0;

  const denom = Math.sqrt(Math.max(1e-9, g1g1 * g2g2));
  const cosAngle = Math.max(-1, Math.min(1, g1g2 / denom));
  const angleRad = Math.acos(cosAngle);
  const angleDeg = (angleRad * 180) / Math.PI;

  // Zone axis [u v w] = (h1 k1 l1) x (h2 k2 l2)
  let u = k1 * l2 - l1 * k2;
  let v = l1 * h2 - h1 * l2;
  let w = h1 * k2 - k1 * h2;

  // Simplify zone axis to smallest mutually prime integers
  const commonDiv = gcd(Math.abs(u), gcd(Math.abs(v), Math.abs(w))) || 1;
  u /= commonDiv;
  v /= commonDiv;
  w /= commonDiv;

  // Ensure leading non-zero coordinate is positive
  if (u < 0 || (u === 0 && v < 0) || (u === 0 && v === 0 && w < 0)) {
    u = -u;
    v = -v;
    w = -w;
  }

  // Weiss Zone Law verification: hu + kv + lw = 0
  const weissCondition1 = h1 * u + k1 * v + l1 * w;
  const weissCondition2 = h2 * u + k2 * v + l2 * w;

  return {
    h1: [h1, k1, l1],
    h2: [h2, k2, l2],
    angleDeg,
    angleRad,
    cosAngle,
    d1,
    d2,
    zoneAxis: [u, v, w],
    weissCondition1,
    weissCondition2
  };
}

// -----------------------------------------------------------------------------
// Ewald Sphere & Reciprocal Lattice Kinematics Engine
// -----------------------------------------------------------------------------

export function calculateEwaldSphereKinematics(
  wavelength: number,
  twoThetaDeg: number,
  dSpacing: number,
  reflectionOrder: number = 1,
  crystalliteThicknessA: number = 250
): EwaldKinematicsResult {
  const thetaDeg = (twoThetaDeg || 0) / 2;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const safeWavelength = Math.max(0.0001, wavelength);

  // Ewald Radius in reciprocal space R = 1 / lambda (in Angstrom^-1)
  const ewaldRadius = 1 / safeWavelength;
  const k0Mag = ewaldRadius;

  // Incident wavevector k0 in 2D plane: length 1/lambda at angle theta to planes
  const k0Vec: Vector3D = {
    x: (Math.cos(thetaRad)) / safeWavelength,
    y: (-Math.sin(thetaRad)) / safeWavelength,
    z: 0
  };

  // Diffracted wavevector kh in 2D plane: length 1/lambda at angle +theta
  const khVec: Vector3D = {
    x: (Math.cos(thetaRad)) / safeWavelength,
    y: (Math.sin(thetaRad)) / safeWavelength,
    z: 0
  };

  // Scattering vector Q = kh - k0 (oriented purely along plane normal y)
  const qVec: Vector3D = {
    x: khVec.x - k0Vec.x, // 0
    y: khVec.y - k0Vec.y, // 2 * sin(theta) / lambda
    z: 0
  };
  const qMag = vectorLength(qVec);

  // Reciprocal lattice vector length for reflection order n: G_n = n / d
  const gVectorMag = dSpacing > 0 ? reflectionOrder / dSpacing : 0;

  // Excitation error (deviation parameter): s_g = |Q| - |G_n|
  const excitationError = qMag - gVectorMag;
  const isBraggCondition = Math.abs(excitationError) < 0.003;

  // Kinematical diffraction rocking curve: I(s_g) = (sin(pi * t * s_g) / (pi * t * s_g))^2
  const t = Math.max(10, crystalliteThicknessA);
  const arg = Math.PI * t * excitationError;
  let rockingCurveIntensity = 1.0;
  if (Math.abs(arg) > 1e-5) {
    rockingCurveIntensity = Math.pow(Math.sin(arg) / arg, 2);
  }

  // Exact Scherrer rocking curve angular FWHM: Delta(2theta) ~ 0.89 * lambda / (t * cos(theta))
  const cosT = Math.max(0.05, Math.cos(thetaRad));
  const rockingCurveFwhmDeg = (0.89 * safeWavelength / (t * cosT)) * (180 / Math.PI);

  return {
    wavelength: safeWavelength,
    twoThetaDeg,
    thetaDeg,
    dSpacing,
    reflectionOrder,
    k0Mag,
    k0Vec,
    khVec,
    qVec,
    qMag,
    gVectorMag,
    excitationError,
    isBraggCondition,
    crystalliteThicknessA: t,
    rockingCurveIntensity,
    rockingCurveFwhmDeg,
    ewaldRadius
  };
}

// -----------------------------------------------------------------------------
// Busing-Levy Cartesian Reciprocal Orientation Matrix [B]
// -----------------------------------------------------------------------------

export function calculateBusingLevyMatrix(
  basis: DirectAndReciprocalBasis
): [[number, number, number], [number, number, number], [number, number, number]] {
  const { aStar, bStar, cStar, alphaStar, betaStar, gammaStar } = basis.reciprocalParams;
  
  const radAStar = (alphaStar * Math.PI) / 180;
  const radBStar = (betaStar * Math.PI) / 180;
  const radGStar = (gammaStar * Math.PI) / 180;

  // Standard Busing-Levy (1967) convention:
  // b1 = [a*, b* cos(gamma*), c* cos(beta*)]
  // b2 = [0,  b* sin(gamma*), -c* sin(beta*) cos(alpha)]
  // b3 = [0,  0,              1 / c]
  const b11 = aStar;
  const b12 = bStar * Math.cos(radGStar);
  const b13 = cStar * Math.cos(radBStar);

  const b21 = 0;
  const b22 = bStar * Math.sin(radGStar);
  const cosAlphaDirect = (Math.cos(radBStar) * Math.cos(radGStar) - Math.cos(radAStar)) / (Math.sin(radBStar) * Math.sin(radGStar) || 1e-6);
  const b23 = -cStar * Math.sin(radBStar) * cosAlphaDirect;

  const b31 = 0;
  const b32 = 0;
  const b33 = basis.reciprocalVolume * (basis.directMetricTensor[0][0] * basis.directMetricTensor[1][1] - Math.pow(basis.directMetricTensor[0][1], 2));

  return [
    [b11, b12, b13],
    [b21, b22, b23],
    [b31, b32, b33]
  ];
}

// -----------------------------------------------------------------------------
// Kinematic Powder Diffraction Full Spectrum Generator
// -----------------------------------------------------------------------------

export function generateKinematicPowderSpectrum(
  params: UnitCellParams,
  basisAtoms: BasisAtomDefinition[],
  wavelength: number,
  maxTwoTheta: number = 90,
  options?: StructureFactorOptions & { debyeWallerB?: number }
): KinematicPeakSummary[] {
  const sinThetaMax = Math.sin((maxTwoTheta * Math.PI) / 360);
  const qMax = (4 * Math.PI * sinThetaMax) / wavelength;
  const dMin = wavelength / (2 * sinThetaMax);

  // Determine search bounds for h, k, l from reciprocal lengths
  const basis = computeDirectAndReciprocalBasis(params);
  const hMax = Math.min(10, Math.max(1, Math.ceil(1 / (dMin * basis.reciprocalParams.aStar))));
  const kMax = Math.min(10, Math.max(1, Math.ceil(1 / (dMin * basis.reciprocalParams.bStar))));
  const lMax = Math.min(10, Math.max(1, Math.ceil(1 / (dMin * basis.reciprocalParams.cStar))));

  const peaks: KinematicPeakSummary[] = [];

  for (let h = 0; h <= hMax; h++) {
    for (let k = 0; k <= kMax; k++) {
      for (let l = 0; l <= lMax; l++) {
        if (h === 0 && k === 0 && l === 0) continue;

        const sf = calculateStructureFactor(h, k, l, params, basisAtoms, wavelength, options);
        if (!sf.isBraggAllowedByWavelength || sf.twoTheta > maxTwoTheta) continue;

        peaks.push({
          h,
          k,
          l,
          hklStr: `(${h} ${k} ${l})`,
          dSpacing: sf.dSpacing,
          twoTheta: sf.twoTheta,
          theta: sf.theta,
          qMagnitude: sf.qMagnitude,
          fReal: sf.fReal,
          fImag: sf.fImag,
          fMag: sf.fMag,
          fSquared: sf.fSquared,
          multiplicity: sf.multiplicity,
          lorentzPolarization: sf.lorentzPolarization,
          rawIntensity: sf.theoreticalRelativeIntensity,
          relativeIntensity: 0, // normalized below
          isExtinct: sf.isExtinct,
          extinctionReason: sf.extinctionReason
        });
      }
    }
  }

  // Sort strictly by 2theta
  peaks.sort((a, b) => a.twoTheta - b.twoTheta);

  // Group duplicate equivalent 2theta reflections (within 0.001 deg)
  const uniquePeaks: KinematicPeakSummary[] = [];
  for (const p of peaks) {
    const existing = uniquePeaks.find(u => Math.abs(u.twoTheta - p.twoTheta) < 0.005);
    if (!existing) {
      uniquePeaks.push({ ...p });
    }
  }

  // Find max intensity of non-extinct peaks to normalize to 100%
  const nonExtinctPeaks = uniquePeaks.filter(p => !p.isExtinct);
  const maxIntensity = nonExtinctPeaks.reduce((max, p) => Math.max(max, p.rawIntensity), 0) || 1;

  for (const p of uniquePeaks) {
    p.relativeIntensity = Number(((p.rawIntensity / maxIntensity) * 100).toFixed(1));
  }

  return uniquePeaks;
}

// -----------------------------------------------------------------------------
// Standard Crystallographic Basis Presets Database
// -----------------------------------------------------------------------------

export const STANDARD_BASIS_PRESETS: CrystalBasisPreset[] = [
  {
    id: 'sc',
    name: 'Simple Cubic (Primitive)',
    formula: 'Po (α-Polonium)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m',
    spaceGroupNumber: 221,
    description: 'Primitive cubic single-atom basis at origin. No systematic extinctions (all h,k,l allowed).',
    defaultLattice: { a: 3.35, b: 3.35, c: 3.35, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'sc-1', label: 'Po (0,0,0)', element: 'Po', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.8, color: '#38bdf8', wyckoff: '1a' }
    ]
  },
  {
    id: 'bcc',
    name: 'Body-Centered Cubic (BCC)',
    formula: 'Fe (α-Iron)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Im-3m',
    spaceGroupNumber: 229,
    description: '2-atom basis: origin + body-center. Extinction rule: h+k+l = 2n (odd sums completely cancel out).',
    defaultLattice: { a: 2.866, b: 2.866, c: 2.866, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'bcc-1', label: 'Fe Corner (0,0,0)', element: 'Fe', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.35, color: '#38bdf8', wyckoff: '2a' },
      { id: 'bcc-2', label: 'Fe Center (½,½,½)', element: 'Fe', coords: [0.5, 0.5, 0.5], occupancy: 1.0, bFactor: 0.35, color: '#818cf8', wyckoff: '2a' }
    ]
  },
  {
    id: 'fcc',
    name: 'Face-Centered Cubic (FCC)',
    formula: 'Cu (Copper)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    spaceGroupNumber: 225,
    description: '4-atom basis: origin + 3 face centers. Extinction rule: h,k,l must be unmixed (all even or all odd).',
    defaultLattice: { a: 3.615, b: 3.615, c: 3.615, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'fcc-1', label: 'Cu Corner (0,0,0)', element: 'Cu', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.52, color: '#f59e0b', wyckoff: '4a' },
      { id: 'fcc-2', label: 'Cu Face xy (½,½,0)', element: 'Cu', coords: [0.5, 0.5, 0], occupancy: 1.0, bFactor: 0.52, color: '#fbbf24', wyckoff: '4a' },
      { id: 'fcc-3', label: 'Cu Face xz (½,0,½)', element: 'Cu', coords: [0.5, 0, 0.5], occupancy: 1.0, bFactor: 0.52, color: '#fcd34d', wyckoff: '4a' },
      { id: 'fcc-4', label: 'Cu Face yz (0,½,½)', element: 'Cu', coords: [0, 0.5, 0.5], occupancy: 1.0, bFactor: 0.52, color: '#fef08a', wyckoff: '4a' }
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond / Silicon Lattice',
    formula: 'Si (Silicon)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m',
    spaceGroupNumber: 227,
    description: '8-atom basis: FCC lattice + shifted by (¼,¼,¼). Extinction rule: unmixed h,k,l AND if even, h+k+l = 4n.',
    defaultLattice: { a: 5.431, b: 5.431, c: 5.431, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      // FCC sublattice
      { id: 'dia-1', label: 'Si (0,0,0)', element: 'Si', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.45, color: '#38bdf8', wyckoff: '8a' },
      { id: 'dia-2', label: 'Si (½,½,0)', element: 'Si', coords: [0.5, 0.5, 0], occupancy: 1.0, bFactor: 0.45, color: '#38bdf8', wyckoff: '8a' },
      { id: 'dia-3', label: 'Si (½,0,½)', element: 'Si', coords: [0.5, 0, 0.5], occupancy: 1.0, bFactor: 0.45, color: '#38bdf8', wyckoff: '8a' },
      { id: 'dia-4', label: 'Si (0,½,½)', element: 'Si', coords: [0, 0.5, 0.5], occupancy: 1.0, bFactor: 0.45, color: '#38bdf8', wyckoff: '8a' },
      // Shifted (¼,¼,¼) sublattice
      { id: 'dia-5', label: 'Si (¼,¼,¼)', element: 'Si', coords: [0.25, 0.25, 0.25], occupancy: 1.0, bFactor: 0.45, color: '#34d399', wyckoff: '8a' },
      { id: 'dia-6', label: 'Si (¾,¾,¼)', element: 'Si', coords: [0.75, 0.75, 0.25], occupancy: 1.0, bFactor: 0.45, color: '#34d399', wyckoff: '8a' },
      { id: 'dia-7', label: 'Si (¾,¼,¾)', element: 'Si', coords: [0.75, 0.25, 0.75], occupancy: 1.0, bFactor: 0.45, color: '#34d399', wyckoff: '8a' },
      { id: 'dia-8', label: 'Si (¼,¾,¾)', element: 'Si', coords: [0.25, 0.75, 0.75], occupancy: 1.0, bFactor: 0.45, color: '#34d399', wyckoff: '8a' }
    ]
  },
  {
    id: 'nacl',
    name: 'Rock Salt (NaCl)',
    formula: 'NaCl (Halite)',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    spaceGroupNumber: 225,
    description: 'Interpenetrating FCC Na and Cl sublattices. If h,k,l all even -> F = 4(f_Na + f_Cl); all odd -> F = 4(f_Na - f_Cl).',
    defaultLattice: { a: 5.640, b: 5.640, c: 5.640, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      // Na on 4a
      { id: 'nacl-na1', label: 'Na (0,0,0)', element: 'Na', coords: [0, 0, 0], occupancy: 1.0, bFactor: 1.2, color: '#a855f7', wyckoff: '4a' },
      { id: 'nacl-na2', label: 'Na (½,½,0)', element: 'Na', coords: [0.5, 0.5, 0], occupancy: 1.0, bFactor: 1.2, color: '#a855f7', wyckoff: '4a' },
      { id: 'nacl-na3', label: 'Na (½,0,½)', element: 'Na', coords: [0.5, 0, 0.5], occupancy: 1.0, bFactor: 1.2, color: '#a855f7', wyckoff: '4a' },
      { id: 'nacl-na4', label: 'Na (0,½,½)', element: 'Na', coords: [0, 0.5, 0.5], occupancy: 1.0, bFactor: 1.2, color: '#a855f7', wyckoff: '4a' },
      // Cl on 4b (shifted by ½,0,0)
      { id: 'nacl-cl1', label: 'Cl (½,0,0)', element: 'Cl', coords: [0.5, 0, 0], occupancy: 1.0, bFactor: 1.0, color: '#10b981', wyckoff: '4b' },
      { id: 'nacl-cl2', label: 'Cl (0,½,0)', element: 'Cl', coords: [0, 0.5, 0], occupancy: 1.0, bFactor: 1.0, color: '#10b981', wyckoff: '4b' },
      { id: 'nacl-cl3', label: 'Cl (0,0,½)', element: 'Cl', coords: [0, 0, 0.5], occupancy: 1.0, bFactor: 1.0, color: '#10b981', wyckoff: '4b' },
      { id: 'nacl-cl4', label: 'Cl (½,½,½)', element: 'Cl', coords: [0.5, 0.5, 0.5], occupancy: 1.0, bFactor: 1.0, color: '#10b981', wyckoff: '4b' }
    ]
  },
  {
    id: 'zns',
    name: 'Zincblende / Sphalerite',
    formula: 'ZnS / GaAs',
    crystalSystem: 'Cubic',
    spaceGroup: 'F-43m',
    spaceGroupNumber: 216,
    description: 'FCC Zn cations with S anions occupying ½ of the tetrahedral interstitial sites.',
    defaultLattice: { a: 5.410, b: 5.410, c: 5.410, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'zns-zn1', label: 'Zn (0,0,0)', element: 'Zn', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.6, color: '#38bdf8', wyckoff: '4a' },
      { id: 'zns-zn2', label: 'Zn (½,½,0)', element: 'Zn', coords: [0.5, 0.5, 0], occupancy: 1.0, bFactor: 0.6, color: '#38bdf8', wyckoff: '4a' },
      { id: 'zns-zn3', label: 'Zn (½,0,½)', element: 'Zn', coords: [0.5, 0, 0.5], occupancy: 1.0, bFactor: 0.6, color: '#38bdf8', wyckoff: '4a' },
      { id: 'zns-zn4', label: 'Zn (0,½,½)', element: 'Zn', coords: [0, 0.5, 0.5], occupancy: 1.0, bFactor: 0.6, color: '#38bdf8', wyckoff: '4a' },
      { id: 'zns-s1', label: 'S (¼,¼,¼)', element: 'S', coords: [0.25, 0.25, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#facc15', wyckoff: '4c' },
      { id: 'zns-s2', label: 'S (¾,¾,¼)', element: 'S', coords: [0.75, 0.75, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#facc15', wyckoff: '4c' },
      { id: 'zns-s3', label: 'S (¾,¼,¾)', element: 'S', coords: [0.75, 0.25, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#facc15', wyckoff: '4c' },
      { id: 'zns-s4', label: 'S (¼,¾,¾)', element: 'S', coords: [0.25, 0.75, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#facc15', wyckoff: '4c' }
    ]
  },
  {
    id: 'cscl',
    name: 'Cesium Chloride (CsCl)',
    formula: 'CsCl',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m',
    spaceGroupNumber: 221,
    description: 'Primitive cubic unit cell with Cs at (0,0,0) and Cl at (½,½,½). Extinctions: odd sum reflections give F = f_Cs - f_Cl.',
    defaultLattice: { a: 4.123, b: 4.123, c: 4.123, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'cscl-1', label: 'Cs Corner (0,0,0)', element: 'Cs', coords: [0, 0, 0], occupancy: 1.0, bFactor: 1.4, color: '#ec4899', wyckoff: '1a' },
      { id: 'cscl-2', label: 'Cl Center (½,½,½)', element: 'Cl', coords: [0.5, 0.5, 0.5], occupancy: 1.0, bFactor: 1.1, color: '#10b981', wyckoff: '1b' }
    ]
  },
  {
    id: 'hcp',
    name: 'Hexagonal Close-Packed (HCP)',
    formula: 'Mg (Magnesium)',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6_3/mmc',
    spaceGroupNumber: 194,
    description: '2-atom basis: (0,0,0) and (⅔,⅓,½). Extinction rule for 00l: l = 2n (due to 6_3 screw axis).',
    defaultLattice: { a: 3.210, b: 3.210, c: 5.210, alpha: 90, beta: 90, gamma: 120 },
    basisAtoms: [
      { id: 'hcp-1', label: 'Mg Layer A (0,0,0)', element: 'Mg', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.6, color: '#38bdf8', wyckoff: '2c' },
      { id: 'hcp-2', label: 'Mg Layer B (⅔,⅓,½)', element: 'Mg', coords: [2/3, 1/3, 0.5], occupancy: 1.0, bFactor: 0.6, color: '#818cf8', wyckoff: '2c' }
    ]
  },
  {
    id: 'perovskite',
    name: 'Cubic Perovskite (ABX3)',
    formula: 'SrTiO3',
    crystalSystem: 'Cubic',
    spaceGroup: 'Pm-3m',
    spaceGroupNumber: 221,
    description: '5-atom basis: A at corner, B at body center, 3 X anions at face centers. F(100) = f_Sr - f_Ti - f_O.',
    defaultLattice: { a: 3.905, b: 3.905, c: 3.905, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'perov-sr', label: 'Sr Corner (0,0,0)', element: 'Sr', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.45, color: '#22d3ee', wyckoff: '1a' },
      { id: 'perov-ti', label: 'Ti Center (½,½,½)', element: 'Ti', coords: [0.5, 0.5, 0.5], occupancy: 1.0, bFactor: 0.35, color: '#f43f5e', wyckoff: '1b' },
      { id: 'perov-o1', label: 'O Face xy (½,½,0)', element: 'O', coords: [0.5, 0.5, 0], occupancy: 1.0, bFactor: 0.65, color: '#e2e8f0', wyckoff: '3c' },
      { id: 'perov-o2', label: 'O Face xz (½,0,½)', element: 'O', coords: [0.5, 0, 0.5], occupancy: 1.0, bFactor: 0.65, color: '#e2e8f0', wyckoff: '3c' },
      { id: 'perov-o3', label: 'O Face yz (0,½,½)', element: 'O', coords: [0, 0.5, 0.5], occupancy: 1.0, bFactor: 0.65, color: '#e2e8f0', wyckoff: '3c' }
    ]
  },
  {
    id: 'fluorite',
    name: 'Fluorite Structure (AX2)',
    formula: 'CaF2 / CeO2',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    spaceGroupNumber: 225,
    description: 'FCC cation lattice with 8 anions filling all tetrahedral interstitial sites.',
    defaultLattice: { a: 5.463, b: 5.463, c: 5.463, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      // Ca FCC
      { id: 'fl-ca1', label: 'Ca (0,0,0)', element: 'Ca', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.5, color: '#38bdf8', wyckoff: '4a' },
      { id: 'fl-ca2', label: 'Ca (½,½,0)', element: 'Ca', coords: [0.5, 0.5, 0], occupancy: 1.0, bFactor: 0.5, color: '#38bdf8', wyckoff: '4a' },
      { id: 'fl-ca3', label: 'Ca (½,0,½)', element: 'Ca', coords: [0.5, 0, 0.5], occupancy: 1.0, bFactor: 0.5, color: '#38bdf8', wyckoff: '4a' },
      { id: 'fl-ca4', label: 'Ca (0,½,½)', element: 'Ca', coords: [0, 0.5, 0.5], occupancy: 1.0, bFactor: 0.5, color: '#38bdf8', wyckoff: '4a' },
      // F 8c
      { id: 'fl-f1', label: 'F (¼,¼,¼)', element: 'F', coords: [0.25, 0.25, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' },
      { id: 'fl-f2', label: 'F (¾,¾,¼)', element: 'F', coords: [0.75, 0.75, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' },
      { id: 'fl-f3', label: 'F (¾,¼,¾)', element: 'F', coords: [0.75, 0.25, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' },
      { id: 'fl-f4', label: 'F (¼,¾,¾)', element: 'F', coords: [0.25, 0.75, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' },
      { id: 'fl-f5', label: 'F (¾,¼,¼)', element: 'F', coords: [0.75, 0.25, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' },
      { id: 'fl-f6', label: 'F (¼,¾,¼)', element: 'F', coords: [0.25, 0.75, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' },
      { id: 'fl-f7', label: 'F (¼,¼,¾)', element: 'F', coords: [0.25, 0.25, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' },
      { id: 'fl-f8', label: 'F (¾,¾,¾)', element: 'F', coords: [0.75, 0.75, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#a3e635', wyckoff: '8c' }
    ]
  },
  {
    id: 'wurtzite',
    name: 'Wurtzite Structure (Hexagonal)',
    formula: 'ZnO / GaN',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6_3mc',
    spaceGroupNumber: 186,
    description: 'Hexagonal non-centrosymmetric compound with Zn and O in tetrahedral coordination.',
    defaultLattice: { a: 3.250, b: 3.250, c: 5.207, alpha: 90, beta: 90, gamma: 120 },
    basisAtoms: [
      { id: 'wz-zn1', label: 'Zn (0,0,0)', element: 'Zn', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.4, color: '#38bdf8', wyckoff: '2b' },
      { id: 'wz-zn2', label: 'Zn (⅔,⅓,½)', element: 'Zn', coords: [2/3, 1/3, 0.5], occupancy: 1.0, bFactor: 0.4, color: '#38bdf8', wyckoff: '2b' },
      { id: 'wz-o1', label: 'O (0,0,0.382)', element: 'O', coords: [0, 0, 0.382], occupancy: 1.0, bFactor: 0.5, color: '#f43f5e', wyckoff: '2b' },
      { id: 'wz-o2', label: 'O (⅔,⅓,0.882)', element: 'O', coords: [2/3, 1/3, 0.882], occupancy: 1.0, bFactor: 0.5, color: '#f43f5e', wyckoff: '2b' }
    ]
  },
  {
    id: 'rutile',
    name: 'Rutile (Tetragonal TiO2)',
    formula: 'TiO2 (Rutile)',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P4_2/mnm',
    spaceGroupNumber: 136,
    description: 'Primitive tetragonal oxide. Edge-sharing TiO6 octahedra along c-axis with corner connections.',
    defaultLattice: { a: 4.593, b: 4.593, c: 2.959, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'rut-ti1', label: 'Ti (0,0,0)', element: 'Ti', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.4, color: '#38bdf8', wyckoff: '2a' },
      { id: 'rut-ti2', label: 'Ti (½,½,½)', element: 'Ti', coords: [0.5, 0.5, 0.5], occupancy: 1.0, bFactor: 0.4, color: '#38bdf8', wyckoff: '2a' },
      { id: 'rut-o1', label: 'O (0.305, 0.305, 0)', element: 'O', coords: [0.305, 0.305, 0], occupancy: 1.0, bFactor: 0.5, color: '#f43f5e', wyckoff: '4f' },
      { id: 'rut-o2', label: 'O (0.695, 0.695, 0)', element: 'O', coords: [0.695, 0.695, 0], occupancy: 1.0, bFactor: 0.5, color: '#f43f5e', wyckoff: '4f' },
      { id: 'rut-o3', label: 'O (0.805, 0.195, ½)', element: 'O', coords: [0.805, 0.195, 0.5], occupancy: 1.0, bFactor: 0.5, color: '#f43f5e', wyckoff: '4f' },
      { id: 'rut-o4', label: 'O (0.195, 0.805, ½)', element: 'O', coords: [0.195, 0.805, 0.5], occupancy: 1.0, bFactor: 0.5, color: '#f43f5e', wyckoff: '4f' }
    ]
  },
  {
    id: 'anatase',
    name: 'Anatase (Tetragonal TiO2)',
    formula: 'TiO2 (Anatase)',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'I4_1/amd',
    spaceGroupNumber: 141,
    description: 'Body-centered tetragonal TiO2. Exhibits 4_1 screw and d-glide systematic absences.',
    defaultLattice: { a: 3.784, b: 3.784, c: 9.514, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'ana-ti1', label: 'Ti (0,0,0)', element: 'Ti', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.45, color: '#38bdf8', wyckoff: '4a' },
      { id: 'ana-ti2', label: 'Ti (0, ½, ¼)', element: 'Ti', coords: [0, 0.5, 0.25], occupancy: 1.0, bFactor: 0.45, color: '#38bdf8', wyckoff: '4a' },
      { id: 'ana-o1', label: 'O (0, 0, 0.208)', element: 'O', coords: [0, 0, 0.208], occupancy: 1.0, bFactor: 0.55, color: '#f43f5e', wyckoff: '8e' },
      { id: 'ana-o2', label: 'O (0, 0, 0.792)', element: 'O', coords: [0, 0, 0.792], occupancy: 1.0, bFactor: 0.55, color: '#f43f5e', wyckoff: '8e' },
      { id: 'ana-o3', label: 'O (0, ½, 0.458)', element: 'O', coords: [0, 0.5, 0.458], occupancy: 1.0, bFactor: 0.55, color: '#f43f5e', wyckoff: '8e' },
      { id: 'ana-o4', label: 'O (0, ½, 0.958)', element: 'O', coords: [0, 0.5, 0.958], occupancy: 1.0, bFactor: 0.55, color: '#f43f5e', wyckoff: '8e' }
    ]
  },
  {
    id: 'graphite',
    name: 'Graphite 2H (Hexagonal)',
    formula: 'C (Carbon)',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P6_3/mmc',
    spaceGroupNumber: 194,
    description: 'ABA stacked sp2 honeycomb carbon sheets with van der Waals interlayer gap (c = 6.708 Å).',
    defaultLattice: { a: 2.464, b: 2.464, c: 6.708, alpha: 90, beta: 90, gamma: 120 },
    basisAtoms: [
      { id: 'c-1', label: 'C A1 (0,0,¼)', element: 'C', coords: [0, 0, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#94a3b8', wyckoff: '2b' },
      { id: 'c-2', label: 'C A2 (⅓,⅔,¼)', element: 'C', coords: [1/3, 2/3, 0.25], occupancy: 1.0, bFactor: 0.7, color: '#94a3b8', wyckoff: '2c' },
      { id: 'c-3', label: 'C B1 (0,0,¾)', element: 'C', coords: [0, 0, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#cbd5e1', wyckoff: '2b' },
      { id: 'c-4', label: 'C B2 (⅔,⅓,¾)', element: 'C', coords: [2/3, 1/3, 0.75], occupancy: 1.0, bFactor: 0.7, color: '#cbd5e1', wyckoff: '2c' }
    ]
  },
  {
    id: 'ybco',
    name: 'YBCO High-Tc Superconductor',
    formula: 'YBa2Cu3O7',
    crystalSystem: 'Orthorhombic',
    spaceGroup: 'Pmmm',
    spaceGroupNumber: 47,
    description: 'Layered perovskite-derivative superconductor featuring conductive CuO2 planes and 1D CuO chains.',
    defaultLattice: { a: 3.823, b: 3.886, c: 11.681, alpha: 90, beta: 90, gamma: 90 },
    basisAtoms: [
      { id: 'ybco-y', label: 'Y (½,½,½)', element: 'Y', coords: [0.5, 0.5, 0.5], occupancy: 1.0, bFactor: 0.35, color: '#a855f7', wyckoff: '1h' },
      { id: 'ybco-ba1', label: 'Ba1 (½,½,0.184)', element: 'Ba', coords: [0.5, 0.5, 0.184], occupancy: 1.0, bFactor: 0.5, color: '#38bdf8', wyckoff: '2t' },
      { id: 'ybco-ba2', label: 'Ba2 (½,½,0.816)', element: 'Ba', coords: [0.5, 0.5, 0.816], occupancy: 1.0, bFactor: 0.5, color: '#38bdf8', wyckoff: '2t' },
      { id: 'ybco-cu1', label: 'Cu1 Chain (0,0,0)', element: 'Cu', coords: [0, 0, 0], occupancy: 1.0, bFactor: 0.45, color: '#f59e0b', wyckoff: '1a' },
      { id: 'ybco-cu2a', label: 'Cu2 Plane (0,0,0.356)', element: 'Cu', coords: [0, 0, 0.356], occupancy: 1.0, bFactor: 0.45, color: '#f59e0b', wyckoff: '2q' },
      { id: 'ybco-cu2b', label: 'Cu2 Plane (0,0,0.644)', element: 'Cu', coords: [0, 0, 0.644], occupancy: 1.0, bFactor: 0.45, color: '#f59e0b', wyckoff: '2q' },
      { id: 'ybco-o1', label: 'O1 Chain (0,½,0)', element: 'O', coords: [0, 0.5, 0], occupancy: 1.0, bFactor: 0.7, color: '#ef4444', wyckoff: '1e' },
      { id: 'ybco-o2', label: 'O2 Plane (½,0,0.378)', element: 'O', coords: [0.5, 0, 0.378], occupancy: 1.0, bFactor: 0.6, color: '#ef4444', wyckoff: '2r' },
      { id: 'ybco-o3', label: 'O3 Plane (0,½,0.378)', element: 'O', coords: [0, 0.5, 0.378], occupancy: 1.0, bFactor: 0.6, color: '#ef4444', wyckoff: '2s' },
      { id: 'ybco-o4', label: 'O4 Apical (0,0,0.158)', element: 'O', coords: [0, 0, 0.158], occupancy: 1.0, bFactor: 0.8, color: '#ef4444', wyckoff: '2q' }
    ]
  }
];
