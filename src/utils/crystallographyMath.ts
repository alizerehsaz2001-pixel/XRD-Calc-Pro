// Crystallographic Intelligence & Metrology Mathematical Engine

export interface LatticeParameters {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  vol: number;
  aStar: number;
  bStar: number;
  cStar: number;
  alphaStar: number;
  betaStar: number;
  gammaStar: number;
  volStar: number;
  G: number[][];       // Direct metric tensor (3x3)
  GStar: number[][];   // Reciprocal metric tensor (3x3)
  detG: number;
  detGStar: number;
  aspectRatioCA: number;
  aspectRatioBA: number;
}

export interface RadiationSource {
  id: string;
  name: string;
  lambda: number;      // in Angstroms
  energyKeV: number;   // in keV
  color: string;
  border: string;
  bg: string;
  category: 'Laboratory Anode' | 'Synchrotron' | 'Neutron';
}

export const XRAY_ANODES: RadiationSource[] = [
  { id: 'cu_ka1', name: 'Cu-Kα₁', lambda: 1.540598, energyKeV: 8.048, color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10', category: 'Laboratory Anode' },
  { id: 'cu_ka2', name: 'Cu-Kα₂', lambda: 1.544426, energyKeV: 8.028, color: 'text-teal-400', border: 'border-teal-500/40', bg: 'bg-teal-500/10', category: 'Laboratory Anode' },
  { id: 'mo_ka1', name: 'Mo-Kα₁', lambda: 0.709300, energyKeV: 17.479, color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', category: 'Laboratory Anode' },
  { id: 'co_ka1', name: 'Co-Kα₁', lambda: 1.788965, energyKeV: 6.930, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10', category: 'Laboratory Anode' },
  { id: 'cr_ka1', name: 'Cr-Kα₁', lambda: 2.289700, energyKeV: 5.415, color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10', category: 'Laboratory Anode' },
  { id: 'fe_ka1', name: 'Fe-Kα₁', lambda: 1.936042, energyKeV: 6.404, color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10', category: 'Laboratory Anode' },
  { id: 'ag_ka1', name: 'Ag-Kα₁', lambda: 0.559408, energyKeV: 22.163, color: 'text-sky-300', border: 'border-sky-500/40', bg: 'bg-sky-500/10', category: 'Laboratory Anode' },
  { id: 'synchrotron_10keV', name: 'Synchrotron (10 keV)', lambda: 1.239842, energyKeV: 10.0, color: 'text-fuchsia-400', border: 'border-fuchsia-500/40', bg: 'bg-fuchsia-500/10', category: 'Synchrotron' },
  { id: 'synchrotron_20keV', name: 'Synchrotron (20 keV)', lambda: 0.619921, energyKeV: 20.0, color: 'text-indigo-400', border: 'border-indigo-500/40', bg: 'bg-indigo-500/10', category: 'Synchrotron' },
];

/**
 * Computes exact 3D direct and reciprocal metric tensors for general triclinic / arbitrary lattice
 */
export function computeLatticeTensors(
  baseA: number,
  baseB: number,
  baseC: number,
  baseAlpha: number,
  baseBeta: number,
  baseGamma: number,
  appliedStrainPct = 0,
  tempDeltaK = 0,
  linearExpansionCoeff = 1.2e-5
): LatticeParameters {
  const strainFactor = 1 + appliedStrainPct / 100 + tempDeltaK * linearExpansionCoeff;
  const a = Math.max(0.1, baseA * strainFactor);
  const b = Math.max(0.1, baseB * strainFactor);
  const c = Math.max(0.1, baseC * strainFactor);
  const alpha = baseAlpha;
  const beta = baseBeta;
  const gamma = baseGamma;

  const aRad = (alpha * Math.PI) / 180;
  const bRad = (beta * Math.PI) / 180;
  const gRad = (gamma * Math.PI) / 180;

  const cosA = Math.cos(aRad);
  const cosB = Math.cos(bRad);
  const cosG = Math.cos(gRad);
  const sinA = Math.sin(aRad);
  const sinB = Math.sin(bRad);
  const sinG = Math.sin(gRad);

  // Exact general triclinic cell volume
  const term = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG;
  const vol = a * b * c * Math.sqrt(Math.max(0.00001, term));

  // Direct Metric Tensor G = [a_i . a_j]
  const G = [
    [a * a, a * b * cosG, a * c * cosB],
    [a * b * cosG, b * b, b * c * cosA],
    [a * c * cosB, b * c * cosA, c * c],
  ];
  const detG = vol * vol;

  // Reciprocal Lattice Parameters
  const aStar = (b * c * sinA) / vol;
  const bStar = (a * c * sinB) / vol;
  const cStar = (a * b * sinG) / vol;

  const cosAStar = (cosB * cosG - cosA) / (sinB * sinG || 1e-6);
  const cosBStar = (cosA * cosG - cosB) / (sinA * sinG || 1e-6);
  const cosGStar = (cosA * cosB - cosG) / (sinA * sinB || 1e-6);

  const alphaStar = (Math.acos(Math.max(-1, Math.min(1, cosAStar))) * 180) / Math.PI;
  const betaStar = (Math.acos(Math.max(-1, Math.min(1, cosBStar))) * 180) / Math.PI;
  const gammaStar = (Math.acos(Math.max(-1, Math.min(1, cosGStar))) * 180) / Math.PI;

  const volStar = 1 / vol;

  // Reciprocal Metric Tensor G* = [a*_i . a*_j]
  const GStar = [
    [aStar * aStar, aStar * bStar * cosGStar, aStar * cStar * cosBStar],
    [aStar * bStar * cosGStar, bStar * bStar, bStar * cStar * cosAStar],
    [aStar * cStar * cosBStar, bStar * cStar * cosAStar, cStar * cStar],
  ];
  const detGStar = volStar * volStar;

  return {
    a, b, c,
    alpha, beta, gamma,
    vol,
    aStar, bStar, cStar,
    alphaStar, betaStar, gammaStar,
    volStar,
    G, GStar,
    detG, detGStar,
    aspectRatioCA: c / a,
    aspectRatioBA: b / a,
  };
}

/**
 * Calculates interplanar spacing d_hkl, Bragg angle, 2Theta, momentum transfer q, and LP factor
 */
export function calculatePlaneMetrology(
  h: number,
  k: number,
  l: number,
  lattice: LatticeParameters,
  wavelength: number,
  centeringCode = 'P'
) {
  if (h === 0 && k === 0 && l === 0) {
    return {
      d: 0,
      twoTheta: 0,
      theta: 0,
      q: 0,
      s: 0,
      lpFactor: 0,
      allowed: false,
      outOfRange: false,
      millerBravais: '(0000)',
    };
  }

  // 1/d^2 = h^T G* h
  const invD2 =
    h * h * lattice.GStar[0][0] +
    k * k * lattice.GStar[1][1] +
    l * l * lattice.GStar[2][2] +
    2 * h * k * lattice.GStar[0][1] +
    2 * k * l * lattice.GStar[1][2] +
    2 * h * l * lattice.GStar[0][2];

  if (invD2 <= 0) {
    return {
      d: 0,
      twoTheta: 0,
      theta: 0,
      q: 0,
      s: 0,
      lpFactor: 0,
      allowed: false,
      outOfRange: false,
      millerBravais: `(${h} ${k} ${-(h + k)} ${l})`,
    };
  }

  const d = 1 / Math.sqrt(invD2);
  const sinTheta = wavelength / (2 * d);
  const s = 1 / d; // 2 sin(theta) / lambda
  const q = (4 * Math.PI * Math.min(1, sinTheta)) / wavelength;

  // Extinction rules
  let allowed = true;
  if (centeringCode === 'F') {
    const hMod = Math.abs(h) % 2;
    const kMod = Math.abs(k) % 2;
    const lMod = Math.abs(l) % 2;
    allowed = hMod === kMod && kMod === lMod;
  } else if (centeringCode === 'I') {
    allowed = Math.abs(h + k + l) % 2 === 0;
  } else if (centeringCode === 'C') {
    allowed = Math.abs(h + k) % 2 === 0;
  } else if (centeringCode === 'R') {
    allowed = Math.abs(-h + k + l) % 3 === 0;
  }

  if (sinTheta > 1) {
    return {
      d,
      twoTheta: 0,
      theta: 0,
      q,
      s,
      lpFactor: 0,
      allowed: false,
      outOfRange: true,
      millerBravais: `(${h} ${k} ${-(h + k)} ${l})`,
    };
  }

  const thetaRad = Math.asin(sinTheta);
  const thetaDeg = (thetaRad * 180) / Math.PI;
  const twoTheta = 2 * thetaDeg;

  // Lorentz-Polarization Factor (LP) for unpolarized laboratory beam
  const cos2T = Math.cos(2 * thetaRad);
  const lpFactor =
    (1 + cos2T * cos2T) / (Math.sin(thetaRad) * Math.sin(thetaRad) * Math.cos(thetaRad) || 1e-6);

  // Miller-Bravais four-index notation for hexagonal/trigonal: i = -(h+k)
  const iIdx = -(h + k);
  const millerBravais = `(${h} ${k} ${iIdx} ${l})`;

  return {
    d,
    twoTheta,
    theta: thetaDeg,
    q,
    s,
    lpFactor,
    allowed,
    outOfRange: false,
    millerBravais,
  };
}

/**
 * Calculates interplanar angle phi between two planes (h1, k1, l1) and (h2, k2, l2)
 * cos(phi) = (h1^T G* h2) / ( sqrt(h1^T G* h1) * sqrt(h2^T G* h2) )
 */
export function calculateInterplanarAngle(
  h1: number,
  k1: number,
  l1: number,
  h2: number,
  k2: number,
  l2: number,
  lattice: LatticeParameters
) {
  const norm1Sq =
    h1 * h1 * lattice.GStar[0][0] +
    k1 * k1 * lattice.GStar[1][1] +
    l1 * l1 * lattice.GStar[2][2] +
    2 * h1 * k1 * lattice.GStar[0][1] +
    2 * k1 * l1 * lattice.GStar[1][2] +
    2 * h1 * l1 * lattice.GStar[0][2];

  const norm2Sq =
    h2 * h2 * lattice.GStar[0][0] +
    k2 * k2 * lattice.GStar[1][1] +
    l2 * l2 * lattice.GStar[2][2] +
    2 * h2 * k2 * lattice.GStar[0][1] +
    2 * k2 * l2 * lattice.GStar[1][2] +
    2 * h2 * l2 * lattice.GStar[0][2];

  if (norm1Sq <= 0 || norm2Sq <= 0) return { phiDeg: 0, phiRad: 0, dotProduct: 0 };

  const dot =
    h1 * h2 * lattice.GStar[0][0] +
    k1 * k2 * lattice.GStar[1][1] +
    l1 * l2 * lattice.GStar[2][2] +
    (h1 * k2 + h2 * k1) * lattice.GStar[0][1] +
    (k1 * l2 + k2 * l1) * lattice.GStar[1][2] +
    (h1 * l2 + h2 * l1) * lattice.GStar[0][2];

  const cosPhi = Math.max(-1, Math.min(1, dot / (Math.sqrt(norm1Sq) * Math.sqrt(norm2Sq))));
  const phiRad = Math.acos(cosPhi);
  const phiDeg = (phiRad * 180) / Math.PI;

  return {
    phiDeg,
    phiRad,
    cosPhi,
    dotProduct: dot,
  };
}

/**
 * Computes Zone Axis [uvw] from cross-product of two non-parallel planes (h1,k1,l1) x (h2,k2,l2)
 * u = k1*l2 - l1*k2, v = l1*h2 - h1*l2, w = h1*k2 - k1*h2
 */
export function calculateZoneAxis(
  h1: number,
  k1: number,
  l1: number,
  h2: number,
  k2: number,
  l2: number,
  lattice: LatticeParameters
) {
  let u = k1 * l2 - l1 * k2;
  let v = l1 * h2 - h1 * l2;
  let w = h1 * k2 - k1 * h2;

  // Reduce by greatest common divisor
  const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));
  const common = gcd(u, gcd(v, w));
  if (common > 1) {
    u /= common;
    v /= common;
    w /= common;
  }

  // Zone repeat vector length: |r_uvw| = sqrt( u^T G u )
  const rSq =
    u * u * lattice.G[0][0] +
    v * v * lattice.G[1][1] +
    w * w * lattice.G[2][2] +
    2 * u * v * lattice.G[0][1] +
    2 * v * w * lattice.G[1][2] +
    2 * u * w * lattice.G[0][2];

  const repeatDist = Math.sqrt(Math.max(0, rSq));
  const layerSpacing = repeatDist > 0 ? 1 / repeatDist : 0;

  return {
    u,
    v,
    w,
    zoneSymbol: `[${u} ${v} ${w}]`,
    repeatDist,
    layerSpacing,
  };
}

/**
 * Checks Weiss Zone Law: hu + kv + lw = 0
 */
export function checkWeissZoneLaw(h: number, k: number, l: number, u: number, v: number, w: number): boolean {
  return h * u + k * v + l * w === 0;
}

/**
 * Birch-Murnaghan 3rd-order Equation of State (EOS) for high-pressure cell compression
 * P(V) = 3/2 * B0 * [ (V0/V)^(7/3) - (V0/V)^(5/3) ] * { 1 + 3/4*(B0' - 4)*[ (V0/V)^(2/3) - 1 ] }
 */
export function calculateBirchMurnaghanP(
  V: number,
  V0: number,
  B0_GPa = 160,
  B0_prime = 4.0
): number {
  if (V <= 0 || V0 <= 0) return 0;
  const eta = V0 / V;
  const eta73 = Math.pow(eta, 7 / 3);
  const eta53 = Math.pow(eta, 5 / 3);
  const eta23 = Math.pow(eta, 2 / 3);
  const P = 1.5 * B0_GPa * (eta73 - eta53) * (1 + 0.75 * (B0_prime - 4) * (eta23 - 1));
  return Math.max(0, P);
}

/**
 * Inverts Birch-Murnaghan EOS to find compressed volume V under applied pressure P (GPa)
 */
export function estimateVolumeUnderPressure(
  P_GPa: number,
  V0: number,
  B0_GPa = 160,
  B0_prime = 4.0
): number {
  if (P_GPa <= 0) return V0;
  // Bisection search for V
  let lowV = 0.5 * V0;
  let highV = V0;
  for (let i = 0; i < 25; i++) {
    const midV = (lowV + highV) / 2;
    const calcP = calculateBirchMurnaghanP(midV, V0, B0_GPa, B0_prime);
    if (calcP < P_GPa) {
      highV = midV;
    } else {
      lowV = midV;
    }
  }
  return (lowV + highV) / 2;
}

/**
 * Computes directional Young's modulus E(hkl) for cubic crystal system
 * 1/E = S11 - 2*(S11 - S12 - 1/2*S44) * (alpha^2*beta^2 + beta^2*gamma^2 + gamma^2*alpha^2)
 */
export function calculateCubicAnisotropicE(
  h: number,
  k: number,
  l: number,
  nominalE_GPa = 200,
  poisson = 0.28,
  zenerAnisotropy = 1.6
) {
  const normSq = h * h + k * k + l * l;
  if (normSq === 0) {
    return {
      modulusGPa: nominalE_GPa,
      orientationGamma: 0,
      direction: '[0 0 0]',
    };
  }

  const a = h / Math.sqrt(normSq);
  const b = k / Math.sqrt(normSq);
  const c = l / Math.sqrt(normSq);

  // Orientation factor Gamma = a^2*b^2 + b^2*c^2 + c^2*a^2
  // For (100): Gamma = 0 (E is minimum if A > 1)
  // For (111): Gamma = 1/3 (E is maximum if A > 1)
  const orientationGamma = a * a * b * b + b * b * c * c + c * c * a * a;

  // Approximate compliance constants from nominal E and Zener A
  const deltaE = (zenerAnisotropy - 1.0) * 0.45;
  const modE = nominalE_GPa * (1.0 + deltaE * (orientationGamma - 0.2));

  return {
    modulusGPa: Math.max(10, modE),
    orientationGamma,
    direction: `[${h} ${k} ${l}]`,
  };
}

/**
 * Scherrer crystallite size calculation with instrumental broadening deconvolution
 */
export function calculateScherrerSize(
  fwhmObsDeg: number,
  fwhmInstDeg: number,
  twoThetaDeg: number,
  wavelength: number,
  shapeFactorK = 0.94
) {
  const fwhmObsRad = (fwhmObsDeg * Math.PI) / 180;
  const fwhmInstRad = (fwhmInstDeg * Math.PI) / 180;

  // Physical broadening deconvolution (Gaussian/Voigt approximation)
  const betaSampleRad = Math.sqrt(Math.max(1e-6, fwhmObsRad * fwhmObsRad - fwhmInstRad * fwhmInstRad));
  const thetaRad = ((twoThetaDeg / 2) * Math.PI) / 180;

  // D = K * lambda / (beta * cos(theta))  in Angstroms -> / 10 for nm
  const crystalliteSizeAngstrom = (shapeFactorK * wavelength) / (betaSampleRad * Math.cos(thetaRad));
  const crystalliteSizeNm = crystalliteSizeAngstrom / 10;

  // Dislocation density delta = 1 / D^2 (lines/m^2)
  const D_meters = crystalliteSizeNm * 1e-9;
  const dislocationDensity = D_meters > 0 ? 1 / (D_meters * D_meters) : 0;

  return {
    crystalliteSizeNm: Math.max(0.1, crystalliteSizeNm),
    crystalliteSizeAngstrom: Math.max(1, crystalliteSizeAngstrom),
    betaSampleDeg: (betaSampleRad * 180) / Math.PI,
    dislocationDensity,
  };
}

/**
 * Generates Crystallographic Information File (.cif) format representation
 */
export function generateCIFString(
  phaseName: string,
  formula: string,
  spaceGroup: string,
  lattice: LatticeParameters,
  Z: number,
  density: number
): string {
  const timestamp = new Date().toISOString();
  return `#======================================================================
# CRYSTALLOGRAPHIC INFORMATION FILE (CIF)
# Generated by XRD Calc Pro Metrology Engine
# Date: ${timestamp}
#======================================================================
data_${(phaseName || 'Phase').replace(/[^a-zA-Z0-9_]/g, '_')}

_chemical_name_common            '${phaseName || 'Unknown Phase'}'
_chemical_formula_sum            '${formula || 'X'}'
_symmetry_space_group_name_H-M   '${spaceGroup || 'P 1'}'
_cell_length_a                   ${lattice.a.toFixed(5)}
_cell_length_b                   ${lattice.b.toFixed(5)}
_cell_length_c                   ${lattice.c.toFixed(5)}
_cell_angle_alpha                ${lattice.alpha.toFixed(3)}
_cell_angle_beta                 ${lattice.beta.toFixed(3)}
_cell_angle_gamma                ${lattice.gamma.toFixed(3)}
_cell_volume                     ${lattice.vol.toFixed(4)}
_cell_formula_units_Z            ${Z}
_exptl_crystal_density_diffrn    ${density.toFixed(4)}

# Direct Metric Tensor [G] (Angstroms^2)
# G11=${lattice.G[0][0].toFixed(4)} G12=${lattice.G[0][1].toFixed(4)} G13=${lattice.G[0][2].toFixed(4)}
# G21=${lattice.G[1][0].toFixed(4)} G22=${lattice.G[1][1].toFixed(4)} G23=${lattice.G[1][2].toFixed(4)}
# G31=${lattice.G[2][0].toFixed(4)} G32=${lattice.G[2][1].toFixed(4)} G33=${lattice.G[2][2].toFixed(4)}

# Reciprocal Metric Tensor [G*] (Angstroms^-2)
# G*11=${lattice.GStar[0][0].toFixed(6)} G*12=${lattice.GStar[0][1].toFixed(6)} G*13=${lattice.GStar[0][2].toFixed(6)}
# G*21=${lattice.GStar[1][0].toFixed(6)} G*22=${lattice.GStar[1][1].toFixed(6)} G*23=${lattice.GStar[1][2].toFixed(6)}
# G*31=${lattice.GStar[2][0].toFixed(6)} G*32=${lattice.GStar[2][1].toFixed(6)} G*33=${lattice.GStar[2][2].toFixed(6)}

loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
_atom_site_occupancy
  M1  ${formula ? formula.slice(0, 2) : 'Si'}  0.00000  0.00000  0.00000  1.0000
#======================================================================
`;
}
