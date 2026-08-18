/**
 * Comprehensive Crystallographic Bragg Basis & Structure Factor Engine
 * Direct Basis Vectors, Reciprocal Basis Vectors, Metric Tensors,
 * Atomic Basis Fractional Coordinates, Cromer-Mann Form Factors,
 * Debye-Waller Attenuation, Phasor Decomposition, and Structure Factors F(hkl).
 */

import { getCromerMannParameters, calculateAtomicFormFactor } from '../components/XRayScatteringDb';

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
  dwFactor: number; // exp(-B * s^2)
  fEff: number; // occupancy * f0 * dwFactor
  realComponent: number; // fEff * cos(phaseRad)
  imagComponent: number; // fEff * sin(phaseRad)
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
  
  // Kinematic Powder Multiplicity & Intensity
  multiplicity: number;
  lorentzPolarization: number;
  theoreticalRelativeIntensity: number; // |F|^2 * LP * M
  isExtinct: boolean; // True if |F| == 0 due to basis symmetry cancellation
  extinctionReason?: string;
  phasors: BasisAtomPhasor[];
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
  const clean = symbol.trim();
  const titleCase = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  return ELEMENT_Z_MAP[titleCase] || 14; // default silicon if unrecognized
}

// -----------------------------------------------------------------------------
// Structure Factor F(hkl) Calculation
// -----------------------------------------------------------------------------

export function calculateStructureFactor(
  h: number,
  k: number,
  l: number,
  params: UnitCellParams,
  basisAtoms: BasisAtomDefinition[],
  wavelength: number
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

  let currentRealX = 0;
  let currentImagY = 0;
  const phasors: BasisAtomPhasor[] = [];

  let totalReal = 0;
  let totalImag = 0;

  for (const atom of basisAtoms) {
    const zNum = getElementAtomicNumber(atom.element);
    const cmCoeffs = getCromerMannParameters(zNum);
    const f0 = calculateAtomicFormFactor(cmCoeffs, sVal);
    
    // Debye-Waller attenuation: exp(-B * s^2)
    const dwFactor = Math.exp(-atom.bFactor * Math.pow(sVal, 2));
    const fEff = atom.occupancy * f0 * dwFactor;

    // Phase: phi = 2*pi*(h*x + k*y + l*z)
    const dotProd = h * atom.coords[0] + k * atom.coords[1] + l * atom.coords[2];
    const phaseRad = 2 * Math.PI * dotProd;
    const phaseDeg = ((dotProd % 1) * 360 + 360) % 360;

    const realComp = fEff * Math.cos(phaseRad);
    const imagComp = fEff * Math.sin(phaseRad);

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
      dwFactor,
      fEff,
      realComponent: realComp,
      imagComponent: imagComp,
      startX,
      startY,
      endX: currentRealX,
      endY: currentImagY
    });

    totalReal += realComp;
    totalImag += imagComp;
  }

  // Clean floating point noise near zero
  if (Math.abs(totalReal) < 1e-6) totalReal = 0;
  if (Math.abs(totalImag) < 1e-6) totalImag = 0;

  const fMag = Math.sqrt(totalReal * totalReal + totalImag * totalImag);
  const fPhaseDeg = (Math.atan2(totalImag, totalReal) * 180) / Math.PI;
  const fSquared = fMag * fMag;

  // Approximate multiplicity M_hkl for powder diffraction (estimated by symmetry permutations)
  const absH = Math.abs(h);
  const absK = Math.abs(k);
  const absL = Math.abs(l);
  let multiplicity = 6;
  if (absH === absK && absK === absL) {
    multiplicity = absH === 0 ? 1 : 8; // {hhh}
  } else if (absH === absK || absK === absL || absH === absL) {
    multiplicity = 12; // {hhk}
  } else {
    multiplicity = 24; // {hkl}
  }

  const theoreticalRelativeIntensity = fSquared * lorentzPolarization * multiplicity;

  // Extinction audit: If |F| is negligible compared to sum of atomic form factors
  const sumFEff = phasors.reduce((acc, p) => acc + p.fEff, 0);
  const isExtinct = fMag < 1e-3 * Math.max(1, sumFEff);
  let extinctionReason: string | undefined = undefined;

  if (isExtinct) {
    extinctionReason = `Destructive cancellation across basis atoms: F(${h}${k}${l}) = 0.`;
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
    multiplicity,
    lorentzPolarization,
    theoreticalRelativeIntensity,
    isExtinct,
    extinctionReason,
    phasors
  };
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
  }
];
