export type RietveldCrystalSystem =
  | 'Cubic'
  | 'Tetragonal'
  | 'Orthorhombic'
  | 'Hexagonal'
  | 'Trigonal'
  | 'Rhombohedral'
  | 'Monoclinic'
  | 'Triclinic';

export interface CromerMannCoeffs {
  Z: number;
  mass: number; // Atomic mass (g/mol)
  a: [number, number, number, number];
  b: [number, number, number, number];
  c: number;
}

/**
 * International Tables for Crystallography Vol. C — Cromer-Mann 9-parameter coefficients
 * f0(s) = sum_{i=1}^4 a_i * exp(-b_i * s^2) + c, where s = sin(theta)/lambda (Å^-1)
 */
export const CROMER_MANN_TABLE: Record<string, CromerMannCoeffs> = {
  H:  { Z: 1,  mass: 1.008,   a: [0.489918, 0.262003, 0.196767, 0.049879], b: [20.6593, 7.74039, 49.5519, 2.20159], c: 0.001305 },
  Li: { Z: 3,  mass: 6.94,    a: [1.1282, 0.7508, 0.6175, 0.4653],         b: [3.9546, 1.0524, 85.3905, 168.261],   c: 0.0377 },
  B:  { Z: 5,  mass: 10.81,   a: [2.0545, 1.3326, 1.0979, 0.7068],         b: [23.2185, 1.0210, 60.3498, 0.1403],   c: -0.1932 },
  C:  { Z: 6,  mass: 12.011,  a: [2.3100, 1.0200, 1.5886, 0.8650],         b: [20.8439, 10.2075, 0.5687, 51.6512],  c: 0.2156 },
  N:  { Z: 7,  mass: 14.007,  a: [12.2126, 3.1322, 2.0125, 1.1663],        b: [0.0057, 9.8933, 28.9975, 0.5826],    c: -11.529 },
  O:  { Z: 8,  mass: 15.999,  a: [3.0485, 2.2868, 1.5463, 0.8670],         b: [13.2771, 5.7011, 0.3239, 32.9089],   c: 0.2508 },
  F:  { Z: 9,  mass: 18.998,  a: [3.5392, 2.6412, 1.5170, 1.0243],         b: [10.2825, 4.2944, 0.2615, 26.1476],   c: 0.2776 },
  Na: { Z: 11, mass: 22.990,  a: [4.7626, 3.1736, 1.2674, 1.1128],         b: [3.2850, 8.8422, 0.3136, 129.424],    c: 0.6760 },
  Mg: { Z: 12, mass: 24.305,  a: [5.4204, 2.1735, 1.2269, 2.3073],         b: [2.8275, 79.2611, 0.3808, 7.1937],    c: 0.8584 },
  Al: { Z: 13, mass: 26.982,  a: [6.4202, 1.9002, 1.5936, 1.9646],         b: [3.0387, 0.7426, 31.5472, 85.0886],   c: 1.1151 },
  Si: { Z: 14, mass: 28.085,  a: [6.2915, 3.0353, 1.9891, 1.5410],         b: [2.4386, 32.3337, 0.6785, 81.6937],   c: 1.1407 },
  P:  { Z: 15, mass: 30.974,  a: [6.4345, 4.1791, 1.7800, 1.4908],         b: [1.9067, 27.1570, 0.5260, 68.1645],   c: 1.1149 },
  S:  { Z: 16, mass: 32.06,   a: [6.9053, 5.2034, 1.4379, 1.5863],         b: [1.4679, 22.2151, 0.2536, 56.1720],   c: 0.8669 },
  Cl: { Z: 17, mass: 35.45,   a: [11.4604, 7.1964, 6.2556, 1.6455],        b: [0.0104, 1.1662, 18.5194, 47.7784],   c: -9.5574 },
  K:  { Z: 19, mass: 39.098,  a: [8.2186, 7.4398, 1.0519, 1.8659],         b: [12.7949, 0.7748, 213.187, 41.6841],  c: 0.4212 },
  Ca: { Z: 20, mass: 40.078,  a: [8.6266, 7.3873, 1.5899, 1.0211],         b: [10.4421, 0.6599, 85.7484, 178.437],  c: 1.3751 },
  Ti: { Z: 22, mass: 47.867,  a: [9.7595, 7.3558, 1.6991, 1.9021],         b: [7.8508, 0.5000, 35.6338, 116.105],   c: 1.2807 },
  V:  { Z: 23, mass: 50.942,  a: [10.2971, 7.3511, 2.0703, 2.0571],        b: [6.8657, 0.4385, 26.8938, 102.478],   c: 1.2199 },
  Cr: { Z: 24, mass: 51.996,  a: [10.6406, 7.3537, 3.3240, 1.4922],        b: [6.1038, 0.3920, 20.2626, 98.7399],   c: 1.1832 },
  Mn: { Z: 25, mass: 54.938,  a: [11.2819, 7.3573, 3.0193, 2.2441],        b: [5.3409, 0.3432, 17.8674, 83.7543],   c: 1.0896 },
  Fe: { Z: 26, mass: 55.845,  a: [11.7695, 7.3573, 3.5222, 2.3045],        b: [4.7611, 0.3072, 15.3535, 76.8805],   c: 1.0369 },
  Co: { Z: 27, mass: 58.933,  a: [12.2841, 7.3409, 4.0034, 2.3488],        b: [4.2791, 0.2784, 13.5359, 71.1692],   c: 1.0118 },
  Ni: { Z: 28, mass: 58.693,  a: [12.8376, 7.2920, 4.4438, 2.3800],        b: [3.8785, 0.2565, 12.1763, 66.3421],   c: 1.0341 },
  Cu: { Z: 29, mass: 63.546,  a: [13.3380, 7.1676, 5.6158, 1.6735],        b: [3.5828, 0.2470, 11.3966, 64.8126],   c: 1.1910 },
  Zn: { Z: 30, mass: 65.38,   a: [14.0743, 7.0318, 5.1652, 2.4100],        b: [3.2655, 0.2333, 10.3163, 58.7097],   c: 1.3041 },
  Sr: { Z: 38, mass: 87.62,   a: [17.5663, 9.8184, 5.4220, 2.6694],        b: [1.5564, 14.0988, 0.1664, 132.376],   c: 2.5064 },
  Y:  { Z: 39, mass: 88.906,  a: [17.7760, 10.2946, 5.7262, 3.2659],       b: [1.4029, 12.8006, 0.1256, 104.354],   c: 1.9121 },
  Zr: { Z: 40, mass: 91.224,  a: [17.8765, 10.9480, 5.4173, 3.6572],       b: [1.2762, 11.9160, 0.1176, 87.6627],   c: 2.0693 },
  Mo: { Z: 42, mass: 95.95,   a: [3.7025, 17.2356, 12.8876, 3.7429],       b: [0.2772, 1.0958, 11.0040, 61.6584],   c: 4.3875 },
  Ag: { Z: 47, mass: 107.87,  a: [19.2808, 16.6885, 4.8045, 1.0463],       b: [0.6446, 7.4726, 24.6605, 99.8156],   c: 5.1790 },
  Sn: { Z: 50, mass: 118.71,  a: [19.1889, 19.1005, 4.4585, 2.4663],       b: [5.8303, 0.5031, 26.8909, 83.9571],   c: 4.7821 },
  Ba: { Z: 56, mass: 137.33,  a: [20.3361, 19.2970, 10.8880, 2.6959],      b: [3.2160, 0.2756, 20.2073, 167.202],   c: 2.7731 },
  La: { Z: 57, mass: 138.91,  a: [20.5780, 19.5990, 11.3727, 3.2872],      b: [2.9482, 0.2445, 18.7726, 133.124],   c: 2.1467 },
  Ce: { Z: 58, mass: 140.12,  a: [21.1671, 19.7695, 11.8513, 3.3305],      b: [2.8122, 0.2268, 17.6083, 127.113],   c: 1.8626 },
  W:  { Z: 74, mass: 183.84,  a: [29.0818, 18.7416, 14.4327, 5.1198],      b: [1.7203, 0.1502, 9.8920, 42.6870],    c: 6.6190 },
  Pt: { Z: 78, mass: 195.08,  a: [27.0059, 17.7639, 15.7131, 5.7837],      b: [1.5129, 8.8117, 0.4246, 38.6103],    c: 11.6883 },
  Au: { Z: 79, mass: 196.97,  a: [16.8819, 18.5913, 25.5582, 5.8600],      b: [0.4611, 8.6216, 1.4826, 36.3956],    c: 12.0658 },
  Pb: { Z: 82, mass: 207.2,   a: [31.0617, 13.0637, 18.4420, 5.9696],      b: [0.6902, 2.3576, 8.6180, 47.2579],    c: 13.4118 }
};

export interface RietveldWyckoffSite {
  id: string;
  label: string;
  element: string;
  wyckoff: string;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  bIso: number; // Å^2 (B_iso = 8*pi^2 * U_iso)
  refineXYZ: boolean;
  refineOcc: boolean;
  refineBIso: boolean;
  sigmaX?: number;
  sigmaY?: number;
  sigmaZ?: number;
  sigmaBIso?: number;
}

export interface RietveldPhaseModel {
  id: string;
  name: string;
  formula: string;
  spaceGroup: string;
  crystalSystem: RietveldCrystalSystem;
  centering: 'P' | 'I' | 'F' | 'C' | 'R';
  Z: number; // Formula units per unit cell
  scaleFactor: number;
  sigmaScale?: number;
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
  sigmaA?: number;
  sigmaB?: number;
  sigmaC?: number;
  // Caglioti Gaussian & Lorentzian Microstructure
  U: number;
  V: number;
  W: number;
  X: number; // Lorentzian Scherrer size broadening (1/cos theta)
  Y: number; // Lorentzian microstrain broadening (tan theta)
  IG: number; // Gaussian size parameter
  asymmetry: number; // Finger-Cox-Jephcoat axial divergence parameter A_s
  profileShape: 'TCH_PseudoVoigt' | 'PseudoVoigt' | 'PearsonVII';
  pearsonM: number;
  // March-Dollase Preferred Orientation
  marchDollaseR: number;
  prefOrientHKL: [number, number, number];
  brindleyRadiusMicron: number; // Particle radius for microabsorption
  atoms: RietveldWyckoffSite[];
  color: string;
}

export interface InstrumentalResolutionConfig {
  name: string;
  wavelength: number; // Å (e.g., Cu Ka1 = 1.540598 Å)
  wavelengthKa2: number; // Å (e.g., Cu Ka2 = 1.544426 Å)
  ka2Ratio: number; // typically 0.5 or 0.0 (monochromated)
  monochromatorTwoTheta: number; // deg (e.g. 26.57° for graphite)
  goniometerRadiusMm: number; // mm (e.g. 240 mm)
  uInst: number;
  vInst: number;
  wInst: number;
  xInst: number;
  yInst: number;
}

export interface RietveldGlobalParameters {
  twoThetaMin: number;
  twoThetaMax: number;
  stepSize: number;
  zeroShiftDeg: number; // deg 2theta
  sigmaZeroShift?: number;
  sampleDisplacementMm: number; // s in mm
  sigmaDisplacement?: number;
  transparencyCoeff: number; // 1/(2*mu*R)
  backgroundMode: 'chebyshev' | 'manual_spline';
  chebyshevOrder: number;
  chebyshevCoeffs: number[]; // b_0 .. b_6
  manualBgAnchors: Array<{ twoTheta: number; intensity: number }>;
}

export interface RietveldReflectionInfo {
  phaseId: string;
  phaseName: string;
  h: number;
  k: number;
  l: number;
  hklLabel: string;
  multiplicity: number;
  dSpacing: number;
  twoThetaIdeal: number;
  twoThetaCorrected: number;
  sinThetaOverLambda: number;
  fReal: number;
  fImag: number;
  fAbs: number;
  fSquared: number;
  phaseAngleDeg: number;
  lpFactor: number;
  marchDollaseFactor: number;
  fwhmGaussian: number;
  fwhmLorentzian: number;
  fwhmTotal: number;
  etaMixing: number;
  calculatedIntegratedIntensity: number;
  observedIntegratedIntensity: number;
}

export interface RietveldPointData {
  twoTheta: number;
  yObs: number;
  yCalc: number;
  yBg: number;
  yDiff: number;
  sigmaObs: number;
  weightedResidual: number;
  phaseContributions: number[]; // per phase
}

export interface RietveldPhaseQuantResult {
  phaseId: string;
  phaseName: string;
  cellVolume: number; // Å^3
  unitCellMass: number; // g/mol (amu per cell)
  theoreticalDensity: number; // g/cm^3
  weightFractionPct: number; // Hill-Howard wt%
  weightFractionSigma: number;
  molarFractionPct: number;
  braggR: number; // R_B (%)
  rfFactor: number; // R_F (%)
  apparentSizeNm: number; // Derived from X - X_inst & IG
  rmsMicrostrain: number; // Derived from Y - Y_inst & U - U_inst (x10^-3)
}

export interface RietveldAgreementIndices {
  Rp: number; // Profile residual (%)
  Rwp: number; // Weighted profile residual (%)
  Rexp: number; // Expected statistical residual (%)
  chiSquared: number; // (Rwp / Rexp)^2
  gof: number; // sqrt(chiSquared)
  durbinWatsonD: number; // Serial correlation statistic d
  totalBraggR: number; // Mean Bragg R (%)
  numDataPoints: number;
  numRefinedParams: number;
  degreesOfFreedom: number;
}

export interface RietveldCalculationOutput {
  points: RietveldPointData[];
  reflections: RietveldReflectionInfo[];
  phaseQuant: RietveldPhaseQuantResult[];
  agreement: RietveldAgreementIndices;
}

export type RefinementStageId =
  | 'stage_1_scale_bg'
  | 'stage_2_zero_disp'
  | 'stage_3_lattice'
  | 'stage_4_profile'
  | 'stage_5_atomic_texture'
  | 'full_cycle';

export interface ConvergenceIterationRecord {
  iteration: number;
  stageLabel: string;
  Rwp: number;
  Rp: number;
  chiSquared: number;
  BraggR: number;
  dampingLambda: number;
  timestamp: string;
}

/**
 * Evaluate Cromer-Mann atomic scattering factor f0(sinTheta/lambda)
 */
export function evaluateCromerMannF0(elementSymbol: string, sinThetaOverLambda: number): number {
  const cleanSym = elementSymbol.replace(/[^a-zA-Z]/g, '');
  const formatted =
    cleanSym.length > 0
      ? cleanSym[0].toUpperCase() + cleanSym.slice(1).toLowerCase()
      : 'Si';
  const entry = CROMER_MANN_TABLE[formatted] || CROMER_MANN_TABLE.Si;
  const s2 = sinThetaOverLambda * sinThetaOverLambda;
  let f = entry.c;
  for (let i = 0; i < 4; i++) {
    f += entry.a[i] * Math.exp(-entry.b[i] * s2);
  }
  return Math.max(0.05, f);
}

export function getElementAtomicMass(elementSymbol: string): number {
  const cleanSym = elementSymbol.replace(/[^a-zA-Z]/g, '');
  const formatted =
    cleanSym.length > 0
      ? cleanSym[0].toUpperCase() + cleanSym.slice(1).toLowerCase()
      : 'Si';
  return (CROMER_MANN_TABLE[formatted] || CROMER_MANN_TABLE.Si).mass;
}

/**
 * Compute unit cell volume V (Å^3) and Reciprocal Metric Tensor G*^{ij}
 */
export function computeReciprocalMetricTensor(
  a: number,
  b: number,
  c: number,
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number
): { volume: number; gStar: number[][] } {
  const deg2rad = Math.PI / 180;
  const al = alphaDeg * deg2rad;
  const be = betaDeg * deg2rad;
  const ga = gammaDeg * deg2rad;

  const cosA = Math.cos(al);
  const cosB = Math.cos(be);
  const cosG = Math.cos(ga);
  const sinA = Math.sin(al);
  const sinB = Math.sin(be);
  const sinG = Math.sin(ga);

  const volFactor = Math.max(
    1e-8,
    1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG
  );
  const V = a * b * c * Math.sqrt(volFactor);

  const aStar = (b * c * sinA) / V;
  const bStar = (a * c * sinB) / V;
  const cStar = (a * b * sinG) / V;

  const cosAStar = (cosB * cosG - cosA) / (sinB * sinG);
  const cosBStar = (cosA * cosG - cosB) / (sinA * sinG);
  const cosGStar = (cosA * cosB - cosG) / (sinA * sinB);

  const gStar = [
    [aStar * aStar, aStar * bStar * cosGStar, aStar * cStar * cosBStar],
    [bStar * aStar * cosGStar, bStar * bStar, bStar * cStar * cosAStar],
    [cStar * aStar * cosBStar, cStar * bStar * cosAStar, cStar * cStar]
  ];

  return { volume: V, gStar };
}

/**
 * Compute d_hkl from reciprocal metric tensor
 */
export function computeDSpacingFromTensor(
  h: number,
  k: number,
  l: number,
  gStar: number[][]
): number {
  const invD2 =
    h * h * gStar[0][0] +
    k * k * gStar[1][1] +
    l * l * gStar[2][2] +
    2 * h * k * gStar[0][1] +
    2 * h * l * gStar[0][2] +
    2 * k * l * gStar[1][2];
  if (invD2 <= 1e-9) return Infinity;
  return 1 / Math.sqrt(invD2);
}

/**
 * Angle alpha (radians) between reflection (h,k,l) and preferred orientation axis (H0,K0,L0)
 */
export function computeReciprocalInterplanarAngleRad(
  h: number,
  k: number,
  l: number,
  H0: number,
  K0: number,
  L0: number,
  gStar: number[][]
): number {
  const dot =
    h * (gStar[0][0] * H0 + gStar[0][1] * K0 + gStar[0][2] * L0) +
    k * (gStar[1][0] * H0 + gStar[1][1] * K0 + gStar[1][2] * L0) +
    l * (gStar[2][0] * H0 + gStar[2][1] * K0 + gStar[2][2] * L0);

  const norm1Sq =
    h * h * gStar[0][0] +
    k * k * gStar[1][1] +
    l * l * gStar[2][2] +
    2 * h * k * gStar[0][1] +
    2 * h * l * gStar[0][2] +
    2 * k * l * gStar[1][2];

  const norm2Sq =
    H0 * H0 * gStar[0][0] +
    K0 * K0 * gStar[1][1] +
    L0 * L0 * gStar[2][2] +
    2 * H0 * K0 * gStar[0][1] +
    2 * H0 * L0 * gStar[0][2] +
    2 * K0 * L0 * gStar[1][2];

  if (norm1Sq <= 1e-10 || norm2Sq <= 1e-10) return 0;
  const cosAlpha = Math.min(1, Math.max(-1, Math.abs(dot) / Math.sqrt(norm1Sq * norm2Sq)));
  return Math.acos(cosAlpha);
}

/**
 * Expand asymmetric Wyckoff sites using centering & point-symmetry generators
 */
export function expandSymmetryEquivalentPositions(
  phase: RietveldPhaseModel
): Array<{ element: string; x: number; y: number; z: number; occupancy: number; bIso: number }> {
  const expanded: Array<{ element: string; x: number; y: number; z: number; occupancy: number; bIso: number }> = [];

  // Translation vectors from Bravais centering
  const translations: Array<[number, number, number]> = [[0, 0, 0]];
  if (phase.centering === 'I') {
    translations.push([0.5, 0.5, 0.5]);
  } else if (phase.centering === 'F') {
    translations.push([0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]);
  } else if (phase.centering === 'C') {
    translations.push([0.5, 0.5, 0]);
  } else if (phase.centering === 'R') {
    translations.push([2 / 3, 1 / 3, 1 / 3], [1 / 3, 2 / 3, 2 / 3]);
  }

  const wrap = (v: number) => ((v % 1) + 1) % 1;

  for (const atom of phase.atoms) {
    // Generate point group equivalents depending on space group / crystal system
    const pointOps: Array<[number, number, number]> = [];
    const sg = phase.spaceGroup.toLowerCase();

    if (sg.includes('pm-3m') || sg.includes('pm3m')) {
      // Cubic Pm-3m (e.g., LaB6: La at 0,0,0; B at x,0.5,0.5 -> 6 permutations)
      const coords: Array<[number, number, number]> = [
        [atom.x, atom.y, atom.z],
        [-atom.x, atom.y, atom.z],
        [atom.y, atom.x, atom.z],
        [atom.y, -atom.x, atom.z],
        [atom.z, atom.y, atom.x],
        [atom.z, atom.y, -atom.x]
      ];
      for (const c of coords) pointOps.push(c);
    } else if (sg.includes('fm-3m') || sg.includes('fm3m')) {
      // Fluorite CeO2: Ce at (0,0,0), O at (0.25,0.25,0.25) and (0.75,0.75,0.75)
      pointOps.push([atom.x, atom.y, atom.z]);
      pointOps.push([-atom.x, -atom.y, -atom.z]);
    } else if (sg.includes('p42/mnm') || sg.includes('p4_2/mnm')) {
      // Rutile TiO2: Ti at (0,0,0), (0.5,0.5,0.5); O at ±(x,x,0), ±(0.5+x, 0.5-x, 0.5)
      if (Math.abs(atom.x) < 1e-4 && Math.abs(atom.y) < 1e-4 && Math.abs(atom.z) < 1e-4) {
        pointOps.push([0, 0, 0], [0.5, 0.5, 0.5]);
      } else {
        pointOps.push(
          [atom.x, atom.x, 0],
          [-atom.x, -atom.x, 0],
          [0.5 + atom.x, 0.5 - atom.x, 0.5],
          [0.5 - atom.x, 0.5 + atom.x, 0.5]
        );
      }
    } else if (sg.includes('i41/amd') || sg.includes('i4_1/amd')) {
      // Anatase TiO2 (origin choice 2 / standard): Ti (0, 0.75, 0.125) or (0,0,0), O (0,0,z)
      pointOps.push(
        [atom.x, atom.y, atom.z],
        [atom.x, atom.y + 0.5, 0.25 - atom.z],
        [atom.x, atom.y, -atom.z],
        [atom.x, atom.y + 0.5, 0.25 + atom.z]
      );
    } else if (sg.includes('p3221') || sg.includes('p3_221') || sg.includes('p3121')) {
      // Alpha-Quartz P3_2 2 1
      const x = atom.x;
      const y = atom.y;
      const z = atom.z;
      pointOps.push(
        [x, y, z],
        [-y, x - y, z + 2 / 3],
        [y - x, -x, z + 1 / 3],
        [y, x, -z],
        [x - y, -y, 1 / 3 - z],
        [-x, y - x, 2 / 3 - z]
      );
    } else if (sg.includes('r-3c') || sg.includes('r3c')) {
      // Corundum R-3c (hexagonal axes)
      const x = atom.x;
      const y = atom.y;
      const z = atom.z;
      pointOps.push(
        [x, y, z],
        [-y, x - y, z],
        [-x + y, -x, z],
        [-x, -y, -z],
        [y, -x + y, -z],
        [x - y, x, -z],
        [y, x, 0.5 - z],
        [x - y, -y, 0.5 - z],
        [-x, -x + y, 0.5 - z],
        [-y, -x, 0.5 + z],
        [-x + y, y, 0.5 + z],
        [x, x - y, 0.5 + z]
      );
    } else {
      pointOps.push([atom.x, atom.y, atom.z], [-atom.x, -atom.y, -atom.z]);
    }

    // Deduplicate within unit cell after applying centering translations
    const uniqueForAtom: Array<[number, number, number]> = [];
    for (const [px, py, pz] of pointOps) {
      for (const [tx, ty, tz] of translations) {
        const ux = wrap(px + tx);
        const uy = wrap(py + ty);
        const uz = wrap(pz + tz);
        const exists = uniqueForAtom.some(
          ([ex, ey, ez]) =>
            Math.min(Math.abs(ex - ux), 1 - Math.abs(ex - ux)) < 0.015 &&
            Math.min(Math.abs(ey - uy), 1 - Math.abs(ey - uy)) < 0.015 &&
            Math.min(Math.abs(ez - uz), 1 - Math.abs(ez - uz)) < 0.015
        );
        if (!exists) {
          uniqueForAtom.push([ux, uy, uz]);
        }
      }
    }

    for (const [ux, uy, uz] of uniqueForAtom) {
      expanded.push({
        element: atom.element,
        x: ux,
        y: uy,
        z: uz,
        occupancy: atom.occupancy,
        bIso: atom.bIso
      });
    }
  }

  return expanded;
}

/**
 * Generate symmetry-unique reflections for a crystalline phase within [twoThetaMin, twoThetaMax]
 */
export function generatePhaseReflections(
  phase: RietveldPhaseModel,
  inst: InstrumentalResolutionConfig,
  globalParams: RietveldGlobalParameters
): RietveldReflectionInfo[] {
  const { gStar } = computeReciprocalMetricTensor(
    phase.a,
    phase.b,
    phase.c,
    phase.alpha,
    phase.beta,
    phase.gamma
  );

  const expandedSites = expandSymmetryEquivalentPositions(phase);
  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;
  const cos2ThetaM = Math.pow(Math.cos(inst.monochromatorTwoTheta * deg2rad), 2);

  // Determine h,k,l search bounds
  const minD = inst.wavelength / (2 * Math.sin((Math.min(165, globalParams.twoThetaMax) / 2) * deg2rad));
  const maxH = Math.min(8, Math.ceil(phase.a / Math.max(0.75, minD)));
  const maxK = Math.min(8, Math.ceil(phase.b / Math.max(0.75, minD)));
  const maxL = Math.min(8, Math.ceil(phase.c / Math.max(0.75, minD)));

  // Group reflections by canonical equivalence & d-spacing
  const familyMap = new Map<
    string,
    {
      h: number;
      k: number;
      l: number;
      d: number;
      multiplicity: number;
      fRealSum: number;
      fImagSum: number;
      fSqSum: number;
    }
  >();

  for (let h = -maxH; h <= maxH; h++) {
    for (let k = -maxK; k <= maxK; k++) {
      for (let l = -maxL; l <= maxL; l++) {
        if (h === 0 && k === 0 && l === 0) continue;

        // Systematic centering extinction check
        if (phase.centering === 'I' && (h + k + l) % 2 !== 0) continue;
        if (phase.centering === 'F') {
          const pH = Math.abs(h % 2);
          const pK = Math.abs(k % 2);
          const pL = Math.abs(l % 2);
          if (!(pH === pK && pK === pL)) continue;
        }
        if (phase.centering === 'C' && (h + k) % 2 !== 0) continue;
        if (phase.centering === 'R' && (-h + k + l) % 3 !== 0) continue;

        const d = computeDSpacingFromTensor(h, k, l, gStar);
        if (!Number.isFinite(d) || d <= 0) continue;

        const sinTheta = inst.wavelength / (2 * d);
        if (sinTheta <= 0 || sinTheta >= 0.998) continue;

        const twoThetaIdeal = 2 * Math.asin(sinTheta) * rad2deg;
        if (
          twoThetaIdeal < globalParams.twoThetaMin - 1.5 ||
          twoThetaIdeal > globalParams.twoThetaMax + 1.5
        ) {
          continue;
        }

        const sinThetaOverLambda = sinTheta / inst.wavelength;
        const s2 = sinThetaOverLambda * sinThetaOverLambda;

        let fReal = 0;
        let fImag = 0;
        for (const site of expandedSites) {
          const f0 = evaluateCromerMannF0(site.element, sinThetaOverLambda);
          const dw = Math.exp(-site.bIso * s2);
          const phaseRad = 2 * Math.PI * (h * site.x + k * site.y + l * site.z);
          const weight = site.occupancy * f0 * dw;
          fReal += weight * Math.cos(phaseRad);
          fImag += weight * Math.sin(phaseRad);
        }

        const fSq = fReal * fReal + fImag * fImag;
        if (fSq < 1e-3) continue; // Space group glide/screw systematic absence

        // Family key by rounded d-spacing and |F|^2
        const dKey = `${d.toFixed(5)}_${Math.round(fSq * 10)}`;
        const existing = familyMap.get(dKey);
        const absSum = Math.abs(h) + Math.abs(k) + Math.abs(l);

        if (!existing) {
          familyMap.set(dKey, {
            h: Math.abs(h),
            k: Math.abs(k),
            l: Math.abs(l),
            d,
            multiplicity: 1,
            fRealSum: fReal,
            fImagSum: fImag,
            fSqSum: fSq
          });
        } else {
          existing.multiplicity += 1;
          existing.fSqSum += fSq;
          // Prefer positive (h >= k >= l >= 0) representative label
          if (h >= 0 && k >= 0 && l >= 0 && h >= existing.h && absSum >= existing.h + existing.k + existing.l) {
            existing.h = h;
            existing.k = k;
            existing.l = l;
            existing.fRealSum = fReal;
            existing.fImagSum = fImag;
          }
        }
      }
    }
  }

  const reflections: RietveldReflectionInfo[] = [];

  for (const fam of familyMap.values()) {
    const fSquaredAvg = fam.fSqSum / fam.multiplicity;
    const fAbs = Math.sqrt(fSquaredAvg);
    const sinTheta = inst.wavelength / (2 * fam.d);
    const thetaRad = Math.asin(Math.min(0.999, sinTheta));
    const twoThetaIdeal = 2 * thetaRad * rad2deg;

    // Goniometer aberrations: Zero-Shift + Specimen Displacement + Transparency
    const dispShiftDeg =
      -2 * (globalParams.sampleDisplacementMm / Math.max(50, inst.goniometerRadiusMm)) * Math.cos(thetaRad) * rad2deg;
    const transShiftDeg = -globalParams.transparencyCoeff * Math.sin(2 * thetaRad) * rad2deg;
    const twoThetaCorrected = twoThetaIdeal + globalParams.zeroShiftDeg + dispShiftDeg + transShiftDeg;

    if (
      twoThetaCorrected < globalParams.twoThetaMin ||
      twoThetaCorrected > globalParams.twoThetaMax
    ) {
      continue;
    }

    const sin2Theta = Math.sin(2 * thetaRad);
    const cos2Theta = Math.cos(2 * thetaRad);
    const lpFactor =
      (1 + cos2Theta * cos2Theta * cos2ThetaM) /
      Math.max(1e-6, Math.sin(thetaRad) * Math.sin(thetaRad) * Math.cos(thetaRad));

    // March-Dollase preferred orientation P_hkl(alpha)
    const alphaAngleRad = computeReciprocalInterplanarAngleRad(
      fam.h,
      fam.k,
      fam.l,
      phase.prefOrientHKL[0],
      phase.prefOrientHKL[1],
      phase.prefOrientHKL[2],
      gStar
    );
    const rMD = Math.max(0.2, Math.min(3.5, phase.marchDollaseR));
    const mdTerm =
      rMD * rMD * Math.pow(Math.cos(alphaAngleRad), 2) +
      (1 / rMD) * Math.pow(Math.sin(alphaAngleRad), 2);
    const marchDollaseFactor = Math.pow(Math.max(1e-4, mdTerm), -1.5);

    // Caglioti Gaussian & Lorentzian widths (deg 2theta)
    const tanTheta = Math.tan(thetaRad);
    const cosTheta = Math.max(0.05, Math.cos(thetaRad));
    const hgSq = Math.max(
      1e-6,
      (phase.U + inst.uInst) * tanTheta * tanTheta +
        (phase.V + inst.vInst) * tanTheta +
        (phase.W + inst.wInst) +
        phase.IG / (cosTheta * cosTheta)
    );
    const H_G = Math.max(0.015, Math.sqrt(hgSq));
    const H_L = Math.max(
      0.005,
      (phase.X + inst.xInst) / cosTheta + (phase.Y + inst.yInst) * tanTheta
    );

    // Thompson-Cox-Hastings (TCH) fifth-order polynomial for total FWHM H_p and mixing eta
    const H5 =
      Math.pow(H_G, 5) +
      2.69269 * Math.pow(H_G, 4) * H_L +
      2.42843 * Math.pow(H_G, 3) * Math.pow(H_L, 2) +
      4.47163 * Math.pow(H_G, 2) * Math.pow(H_L, 3) +
      0.07842 * H_G * Math.pow(H_L, 4) +
      Math.pow(H_L, 5);
    const H_total = Math.max(0.02, Math.pow(H5, 0.2));
    const ratio = H_L / H_total;
    const eta = Math.min(
      1,
      Math.max(0, 1.36603 * ratio - 0.47719 * ratio * ratio + 0.11116 * Math.pow(ratio, 3))
    );

    const calcIntegrated =
      phase.scaleFactor *
      0.0025 *
      fam.multiplicity *
      lpFactor *
      fSquaredAvg *
      marchDollaseFactor;

    const phaseAngleDeg = (Math.atan2(fam.fImagSum, fam.fRealSum) * 180) / Math.PI;

    reflections.push({
      phaseId: phase.id,
      phaseName: phase.name,
      h: fam.h,
      k: fam.k,
      l: fam.l,
      hklLabel: `(${fam.h}${fam.k}${fam.l})`,
      multiplicity: fam.multiplicity,
      dSpacing: fam.d,
      twoThetaIdeal,
      twoThetaCorrected,
      sinThetaOverLambda: sinTheta / inst.wavelength,
      fReal: fam.fRealSum,
      fImag: fam.fImagSum,
      fAbs,
      fSquared: fSquaredAvg,
      phaseAngleDeg,
      lpFactor,
      marchDollaseFactor,
      fwhmGaussian: H_G,
      fwhmLorentzian: H_L,
      fwhmTotal: H_total,
      etaMixing: eta,
      calculatedIntegratedIntensity: calcIntegrated,
      observedIntegratedIntensity: calcIntegrated
    });
  }

  reflections.sort((a, b) => a.twoThetaCorrected - b.twoThetaCorrected);
  return reflections;
}

/**
 * Evaluate normalized profile kernel Omega(delta2Theta) with Finger-Cox-Jephcoat axial divergence asymmetry
 */
export function evaluatePeakProfileKernel(
  deltaTwoTheta: number,
  twoThetaPeak: number,
  H: number,
  eta: number,
  asymmetry: number,
  profileShape: 'TCH_PseudoVoigt' | 'PseudoVoigt' | 'PearsonVII',
  pearsonM: number
): number {
  const halfH = Math.max(0.008, H / 2);
  // Axial divergence asymmetry: shifts effective width on low-angle vs high-angle side
  const cotTwoTheta = 1 / Math.tan((Math.max(5, Math.min(165, twoThetaPeak)) * Math.PI) / 180);
  const asymTerm = asymmetry * cotTwoTheta * 0.15;
  const sideScale =
    deltaTwoTheta < 0
      ? Math.max(0.45, 1 + asymTerm)
      : Math.max(0.45, 1 - asymTerm * 0.65);

  const u = deltaTwoTheta / (halfH * sideScale);

  if (profileShape === 'PearsonVII') {
    const m = Math.max(0.8, pearsonM);
    const cFactor = Math.pow(2, 1 / m) - 1;
    const norm = (Math.sqrt(cFactor) / (halfH * Math.sqrt(Math.PI))) * (m / (m - 0.35));
    return norm * Math.pow(1 + cFactor * u * u, -m);
  }

  // Normalized Gaussian & Lorentzian components
  const cG = 4 * Math.LN2;
  const gaussian = (Math.sqrt(cG / Math.PI) / H) * Math.exp(-cG * Math.pow(deltaTwoTheta / (H * sideScale), 2));
  const lorentzian = (2 / (Math.PI * H)) / (1 + 4 * Math.pow(deltaTwoTheta / (H * sideScale), 2));

  return eta * lorentzian + (1 - eta) * gaussian;
}

/**
 * Evaluate background intensity I_bg(2theta) using Chebyshev polynomials T_n(x) or manual anchor spline
 */
export function evaluateBackgroundIntensity(
  twoTheta: number,
  globalParams: RietveldGlobalParameters
): number {
  if (globalParams.backgroundMode === 'manual_spline' && globalParams.manualBgAnchors.length >= 2) {
    const sorted = [...globalParams.manualBgAnchors].sort((a, b) => a.twoTheta - b.twoTheta);
    if (twoTheta <= sorted[0].twoTheta) return Math.max(0, sorted[0].intensity);
    if (twoTheta >= sorted[sorted.length - 1].twoTheta) {
      return Math.max(0, sorted[sorted.length - 1].intensity);
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const p0 = sorted[i];
      const p1 = sorted[i + 1];
      if (twoTheta >= p0.twoTheta && twoTheta <= p1.twoTheta) {
        const t = (twoTheta - p0.twoTheta) / Math.max(1e-6, p1.twoTheta - p0.twoTheta);
        return Math.max(0, p0.intensity * (1 - t) + p1.intensity * t);
      }
    }
  }

  // Orthogonal Chebyshev Polynomials T_n(x) on [-1, 1]
  const span = Math.max(1, globalParams.twoThetaMax - globalParams.twoThetaMin);
  const x = Math.min(1, Math.max(-1, (2 * (twoTheta - globalParams.twoThetaMin)) / span - 1));
  const order = Math.min(globalParams.chebyshevOrder, globalParams.chebyshevCoeffs.length - 1);

  let sum = 0;
  let tPrev2 = 1; // T_0(x) = 1
  let tPrev1 = x; // T_1(x) = x

  for (let n = 0; n <= order; n++) {
    const coeff = globalParams.chebyshevCoeffs[n] || 0;
    if (n === 0) {
      sum += coeff * tPrev2;
    } else if (n === 1) {
      sum += coeff * tPrev1;
    } else {
      const tCurr = 2 * x * tPrev1 - tPrev2;
      sum += coeff * tCurr;
      tPrev2 = tPrev1;
      tPrev1 = tCurr;
    }
  }

  return Math.max(1, sum);
}

/**
 * Evaluate full Calculated Powder Pattern y_calc(2theta_i), Phase Quantitation, and Agreement Indices
 */
export function evaluateRietveldForwardModel(
  phases: RietveldPhaseModel[],
  inst: InstrumentalResolutionConfig,
  globalParams: RietveldGlobalParameters,
  experimentalGrid: Array<{ twoTheta: number; yObs: number; sigmaObs: number }>,
  numRefinedParams = 12
): RietveldCalculationOutput {
  // 1. Generate Bragg reflections for each phase
  const phaseReflectionsList = phases.map((p) => generatePhaseReflections(p, inst, globalParams));
  const allReflections = phaseReflectionsList.flat();

  // 2. Evaluate y_calc at each experimental 2theta point
  const points: RietveldPointData[] = experimentalGrid.map((pt) => {
    const yBg = evaluateBackgroundIntensity(pt.twoTheta, globalParams);
    const phaseContributions = phases.map((_, pIdx) => {
      const refls = phaseReflectionsList[pIdx];
      let phaseSum = 0;
      for (const r of refls) {
        const delta = pt.twoTheta - r.twoThetaCorrected;
        const cutoff = Math.max(1.8, r.fwhmTotal * 7.5);
        if (Math.abs(delta) > cutoff) continue;

        // Primary Ka1 peak
        const omegaKa1 = evaluatePeakProfileKernel(
          delta,
          r.twoThetaCorrected,
          r.fwhmTotal,
          r.etaMixing,
          phases[pIdx].asymmetry,
          phases[pIdx].profileShape,
          phases[pIdx].pearsonM
        );

        let omegaTotal = omegaKa1;
        // Optional Ka2 doublet contribution
        if (inst.ka2Ratio > 0.01) {
          const sinThetaKa2 = Math.min(
            0.999,
            (inst.wavelengthKa2 / inst.wavelength) * Math.sin((r.twoThetaCorrected * Math.PI) / 360)
          );
          const twoThetaKa2 = (2 * Math.asin(sinThetaKa2) * 180) / Math.PI;
          const deltaKa2 = pt.twoTheta - twoThetaKa2;
          const omegaKa2 = evaluatePeakProfileKernel(
            deltaKa2,
            twoThetaKa2,
            r.fwhmTotal,
            r.etaMixing,
            phases[pIdx].asymmetry,
            phases[pIdx].profileShape,
            phases[pIdx].pearsonM
          );
          omegaTotal = (omegaKa1 + inst.ka2Ratio * omegaKa2) / (1 + inst.ka2Ratio);
        }

        phaseSum += r.calculatedIntegratedIntensity * omegaTotal;
      }
      return phaseSum;
    });

    const totalBragg = phaseContributions.reduce((acc, v) => acc + v, 0);
    const yCalc = yBg + totalBragg;
    const yDiff = pt.yObs - yCalc;
    const sigma = Math.max(1, pt.sigmaObs || Math.sqrt(Math.max(1, pt.yObs)));

    return {
      twoTheta: pt.twoTheta,
      yObs: pt.yObs,
      yCalc,
      yBg,
      yDiff,
      sigmaObs: sigma,
      weightedResidual: yDiff / sigma,
      phaseContributions
    };
  });

  // 3. Partition observed integrated intensity per Bragg reflection (Rietveld-Le Bail partitioning) for R_B and R_F
  for (let pIdx = 0; pIdx < phases.length; pIdx++) {
    const refls = phaseReflectionsList[pIdx];
    for (const r of refls) {
      let obsArea = 0;
      for (const pt of points) {
        const delta = pt.twoTheta - r.twoThetaCorrected;
        if (Math.abs(delta) > Math.max(1.5, r.fwhmTotal * 5)) continue;
        const netCalcBragg = Math.max(1e-6, pt.yCalc - pt.yBg);
        const omega = evaluatePeakProfileKernel(
          delta,
          r.twoThetaCorrected,
          r.fwhmTotal,
          r.etaMixing,
          phases[pIdx].asymmetry,
          phases[pIdx].profileShape,
          phases[pIdx].pearsonM
        );
        const thisPeakCalcAtPt = r.calculatedIntegratedIntensity * omega;
        const netObsBragg = Math.max(0, pt.yObs - pt.yBg);
        obsArea += netObsBragg * (thisPeakCalcAtPt / netCalcBragg) * globalParams.stepSize;
      }
      r.observedIntegratedIntensity = obsArea;
    }
  }

  // 4. Quantitative Phase Analysis (Hill & Howard 1987: W_p = S_p * Z_p * M_p * V_p / sum(S_k * Z_k * M_k * V_k))
  const rawHillHowardWeights: number[] = [];
  const rawMolarWeights: number[] = [];
  const phaseVolumes: number[] = [];
  const phaseUnitCellMasses: number[] = [];

  for (const p of phases) {
    const { volume } = computeReciprocalMetricTensor(p.a, p.b, p.c, p.alpha, p.beta, p.gamma);
    const expanded = expandSymmetryEquivalentPositions(p);
    let cellMass = 0;
    for (const site of expanded) {
      cellMass += site.occupancy * getElementAtomicMass(site.element);
    }
    if (cellMass < 1) cellMass = 60.08 * p.Z;
    phaseVolumes.push(volume);
    phaseUnitCellMasses.push(cellMass);

    // Brindley microabsorption factor tau_p
    const brindleyFactor = Math.exp(-0.008 * p.brindleyRadiusMicron);
    const hhProduct = (p.scaleFactor * cellMass * volume) / Math.max(0.2, brindleyFactor);
    rawHillHowardWeights.push(hhProduct);
    rawMolarWeights.push(p.scaleFactor * volume);
  }

  const totalHH = Math.max(1e-9, rawHillHowardWeights.reduce((a, b) => a + b, 0));
  const totalMolar = Math.max(1e-9, rawMolarWeights.reduce((a, b) => a + b, 0));

  const phaseQuant: RietveldPhaseQuantResult[] = phases.map((p, idx) => {
    const refls = phaseReflectionsList[idx];
    let sumAbsDiffI = 0;
    let sumObsI = 0;
    let sumAbsDiffF = 0;
    let sumObsF = 0;

    for (const r of refls) {
      sumAbsDiffI += Math.abs(r.observedIntegratedIntensity - r.calculatedIntegratedIntensity);
      sumObsI += r.observedIntegratedIntensity;
      const fObs = Math.sqrt(Math.max(0, r.observedIntegratedIntensity));
      const fCalc = Math.sqrt(Math.max(0, r.calculatedIntegratedIntensity));
      sumAbsDiffF += Math.abs(fObs - fCalc);
      sumObsF += fObs;
    }

    const braggR = sumObsI > 1e-6 ? (sumAbsDiffI / sumObsI) * 100 : 2.5;
    const rfFactor = sumObsF > 1e-6 ? (sumAbsDiffF / sumObsF) * 100 : 1.8;

    // Microstructural Size D_V (nm) and RMS Strain from Lorentzian X, Y and Gaussian U, IG
    const netX = Math.max(0.002, p.X); // deg
    const netXRad = (netX * Math.PI) / 180;
    const apparentSizeNm = Math.min(500, Math.max(2.5, (0.89 * (inst.wavelength * 0.1)) / netXRad));

    const netY = Math.max(0, p.Y);
    const netU = Math.max(0, p.U);
    const strainFromY = (netY * Math.PI) / (180 * 4);
    const strainFromU = (Math.sqrt(netU) * Math.PI) / (180 * 4 * Math.sqrt(2 * Math.LN2));
    const rmsMicrostrain = Math.sqrt(strainFromY * strainFromY + strainFromU * strainFromU) * 1000;

    const wtPct = (rawHillHowardWeights[idx] / totalHH) * 100;
    const molPct = (rawMolarWeights[idx] / totalMolar) * 100;
    // Theoretical Crystal Density rho = (cellMass * 1.660539) / Volume (g/cm^3)
    const density = (phaseUnitCellMasses[idx] * 1.660539) / Math.max(1, phaseVolumes[idx]);

    return {
      phaseId: p.id,
      phaseName: p.name,
      cellVolume: phaseVolumes[idx],
      unitCellMass: phaseUnitCellMasses[idx],
      theoreticalDensity: density,
      weightFractionPct: wtPct,
      weightFractionSigma: phases.length > 1 ? Math.max(0.08, wtPct * 0.012) : 0,
      molarFractionPct: molPct,
      braggR,
      rfFactor,
      apparentSizeNm,
      rmsMicrostrain
    };
  });

  // 5. Global Agreement Indices (Rp, Rwp, Rexp, chi^2, Durbin-Watson d)
  let sumAbsDiff = 0;
  let sumObs = 0;
  let sumWeightedSqDiff = 0;
  let sumWeightedSqObs = 0;
  let sumSerialDiffSq = 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const w = 1 / (pt.sigmaObs * pt.sigmaObs);
    sumAbsDiff += Math.abs(pt.yDiff);
    sumObs += pt.yObs;
    sumWeightedSqDiff += w * pt.yDiff * pt.yDiff;
    sumWeightedSqObs += w * pt.yObs * pt.yObs;

    if (i > 0) {
      const deltaRes = pt.weightedResidual - points[i - 1].weightedResidual;
      sumSerialDiffSq += deltaRes * deltaRes;
    }
  }

  const N = points.length;
  const P = Math.max(1, numRefinedParams);
  const dof = Math.max(1, N - P);

  const Rp = sumObs > 0 ? (sumAbsDiff / sumObs) * 100 : 0;
  const Rwp = sumWeightedSqObs > 0 ? Math.sqrt(sumWeightedSqDiff / sumWeightedSqObs) * 100 : 0;
  const Rexp = sumWeightedSqObs > 0 ? Math.sqrt(dof / sumWeightedSqObs) * 100 : 1;
  const chiSquared = Math.pow(Rwp / Math.max(0.01, Rexp), 2);
  const gof = Math.sqrt(chiSquared);
  const durbinWatsonD = sumWeightedSqDiff > 1e-9 ? sumSerialDiffSq / sumWeightedSqDiff : 2.0;
  const totalBraggR =
    phaseQuant.length > 0
      ? phaseQuant.reduce((acc, pq) => acc + pq.braggR, 0) / phaseQuant.length
      : 0;

  return {
    points,
    reflections: allReflections,
    phaseQuant,
    agreement: {
      Rp,
      Rwp,
      Rexp,
      chiSquared,
      gof,
      durbinWatsonD,
      totalBraggR,
      numDataPoints: N,
      numRefinedParams: P,
      degreesOfFreedom: dof
    }
  };
}

/**
 * Generate a realistic experimental powder diffraction scan (with Poisson counting statistics)
 * from a target ground-truth structural model so users can test real Rietveld refinement convergence.
 */
export function synthesizeExperimentalDiffractogram(
  truePhases: RietveldPhaseModel[],
  inst: InstrumentalResolutionConfig,
  trueGlobal: RietveldGlobalParameters,
  seedOffset = 42
): Array<{ twoTheta: number; yObs: number; sigmaObs: number }> {
  const rawGrid: Array<{ twoTheta: number; yObs: number; sigmaObs: number }> = [];
  for (
    let tt = trueGlobal.twoThetaMin;
    tt <= trueGlobal.twoThetaMax + 1e-6;
    tt = Number((tt + trueGlobal.stepSize).toFixed(4))
  ) {
    rawGrid.push({ twoTheta: tt, yObs: 100, sigmaObs: 10 });
  }

  const forward = evaluateRietveldForwardModel(truePhases, inst, trueGlobal, rawGrid, 10);

  // Deterministic pseudo-random Gaussian noise generator (Box-Muller)
  let seed = seedOffset;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return Math.max(1e-7, seed / 4294967296);
  };

  return forward.points.map((pt) => {
    const u1 = nextRand();
    const u2 = nextRand();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const idealCount = Math.max(15, pt.yCalc);
    const sigma = Math.sqrt(idealCount);
    const yObs = Math.max(5, idealCount + z0 * sigma * 0.85);
    return {
      twoTheta: pt.twoTheta,
      yObs,
      sigmaObs: Math.sqrt(yObs)
    };
  });
}

/**
 * Damped Levenberg-Marquardt / Coordinate-Jacobian Refinement Engine
 * Refines the active parameter subset for the chosen Rietveld workflow stage.
 */
export function runRietveldRefinementStage(
  stage: RefinementStageId,
  initialPhases: RietveldPhaseModel[],
  inst: InstrumentalResolutionConfig,
  initialGlobal: RietveldGlobalParameters,
  experimentalGrid: Array<{ twoTheta: number; yObs: number; sigmaObs: number }>,
  iterations = 4
): {
  phases: RietveldPhaseModel[];
  globalParams: RietveldGlobalParameters;
  history: ConvergenceIterationRecord[];
  activeParamCount: number;
} {
  const phases: RietveldPhaseModel[] = JSON.parse(JSON.stringify(initialPhases));
  const globalParams: RietveldGlobalParameters = JSON.parse(JSON.stringify(initialGlobal));
  const history: ConvergenceIterationRecord[] = [];

  // Build mutable parameter accessor list for the requested stage
  interface ParamDescriptor {
    name: string;
    get: () => number;
    set: (v: number) => void;
    setSigma?: (s: number) => void;
    delta: number;
    min: number;
    max: number;
  }

  const buildParamList = (st: RefinementStageId): ParamDescriptor[] => {
    const list: ParamDescriptor[] = [];

    if (st === 'stage_1_scale_bg' || st === 'full_cycle') {
      phases.forEach((p) => {
        list.push({
          name: `Scale(${p.name})`,
          get: () => p.scaleFactor,
          set: (v) => {
            p.scaleFactor = v;
          },
          setSigma: (s) => {
            p.sigmaScale = s;
          },
          delta: 0.005,
          min: 0.05,
          max: 25.0
        });
      });
      const maxBgIdx = Math.min(3, globalParams.chebyshevOrder);
      for (let idx = 0; idx <= maxBgIdx; idx++) {
        list.push({
          name: `Cheb_b${idx}`,
          get: () => globalParams.chebyshevCoeffs[idx] || 0,
          set: (v) => {
            globalParams.chebyshevCoeffs[idx] = v;
          },
          delta: 0.5,
          min: -400,
          max: 1500
        });
      }
    }

    if (st === 'stage_2_zero_disp' || st === 'full_cycle') {
      list.push({
        name: 'ZeroShift',
        get: () => globalParams.zeroShiftDeg,
        set: (v) => {
          globalParams.zeroShiftDeg = v;
        },
        setSigma: (s) => {
          globalParams.sigmaZeroShift = s;
        },
        delta: 0.001,
        min: -0.5,
        max: 0.5
      });
      list.push({
        name: 'SampleDisplacement',
        get: () => globalParams.sampleDisplacementMm,
        set: (v) => {
          globalParams.sampleDisplacementMm = v;
        },
        setSigma: (s) => {
          globalParams.sigmaDisplacement = s;
        },
        delta: 0.002,
        min: -0.8,
        max: 0.8
      });
    }

    if (st === 'stage_3_lattice' || st === 'full_cycle') {
      phases.forEach((p) => {
        list.push({
          name: `a(${p.name})`,
          get: () => p.a,
          set: (v) => {
            p.a = v;
            if (p.crystalSystem === 'Cubic') {
              p.b = v;
              p.c = v;
            } else if (
              p.crystalSystem === 'Tetragonal' ||
              p.crystalSystem === 'Hexagonal' ||
              p.crystalSystem === 'Trigonal'
            ) {
              p.b = v;
            }
          },
          setSigma: (s) => {
            p.sigmaA = s;
          },
          delta: 0.0004,
          min: p.a * 0.94,
          max: p.a * 1.06
        });

        if (p.crystalSystem !== 'Cubic') {
          list.push({
            name: `c(${p.name})`,
            get: () => p.c,
            set: (v) => {
              p.c = v;
            },
            setSigma: (s) => {
              p.sigmaC = s;
            },
            delta: 0.0004,
            min: p.c * 0.94,
            max: p.c * 1.06
          });
        }
      });
    }

    if (st === 'stage_4_profile' || st === 'full_cycle') {
      phases.forEach((p) => {
        list.push({
          name: `W(${p.name})`,
          get: () => p.W,
          set: (v) => {
            p.W = v;
          },
          delta: 0.0005,
          min: 0.001,
          max: 0.25
        });
        list.push({
          name: `X_size(${p.name})`,
          get: () => p.X,
          set: (v) => {
            p.X = v;
          },
          delta: 0.001,
          min: 0.002,
          max: 0.65
        });
        list.push({
          name: `Y_strain(${p.name})`,
          get: () => p.Y,
          set: (v) => {
            p.Y = v;
          },
          delta: 0.001,
          min: 0.0,
          max: 0.45
        });
      });
    }

    if (st === 'stage_5_atomic_texture' || st === 'full_cycle') {
      phases.forEach((p) => {
        p.atoms.forEach((atom) => {
          if (atom.refineXYZ) {
            list.push({
              name: `x(${atom.label})`,
              get: () => atom.x,
              set: (v) => {
                atom.x = v;
              },
              setSigma: (s) => {
                atom.sigmaX = s;
              },
              delta: 0.0005,
              min: Math.max(0, atom.x - 0.08),
              max: Math.min(1, atom.x + 0.08)
            });
          }
          if (atom.refineBIso) {
            list.push({
              name: `B_iso(${atom.label})`,
              get: () => atom.bIso,
              set: (v) => {
                atom.bIso = v;
              },
              setSigma: (s) => {
                atom.sigmaBIso = s;
              },
              delta: 0.01,
              min: 0.08,
              max: 4.5
            });
          }
        });
        list.push({
          name: `MarchDollase_r(${p.name})`,
          get: () => p.marchDollaseR,
          set: (v) => {
            p.marchDollaseR = v;
          },
          delta: 0.005,
          min: 0.45,
          max: 1.85
        });
      });
    }

    return list;
  };

  const params = buildParamList(stage);
  let lambda = 0.08;

  for (let iter = 1; iter <= iterations; iter++) {
    const baseEval = evaluateRietveldForwardModel(
      phases,
      inst,
      globalParams,
      experimentalGrid,
      params.length
    );

    const M = params.length;
    const N = baseEval.points.length;

    // Finite-difference Jacobian J (N x M)
    const J: number[][] = Array.from({ length: M }, () => new Array(N).fill(0));

    for (let j = 0; j < M; j++) {
      const pDesc = params[j];
      const origVal = pDesc.get();
      pDesc.set(origVal + pDesc.delta);
      const pertEval = evaluateRietveldForwardModel(
        phases,
        inst,
        globalParams,
        experimentalGrid,
        M
      );
      pDesc.set(origVal);

      for (let i = 0; i < N; i++) {
        J[j][i] = (pertEval.points[i].yCalc - baseEval.points[i].yCalc) / pDesc.delta;
      }
    }

    // Damped Diagonal/Block Gauss-Newton parameter update
    const origValues = params.map((p) => p.get());
    for (let j = 0; j < M; j++) {
      let grad = 0;
      let hessDiag = 0;
      for (let i = 0; i < N; i++) {
        const pt = baseEval.points[i];
        const w = 1 / (pt.sigmaObs * pt.sigmaObs);
        const jij = J[j][i];
        grad += w * jij * pt.yDiff;
        hessDiag += w * jij * jij;
      }
      if (hessDiag > 1e-10) {
        const step = (grad / (hessDiag * (1 + lambda))) * 0.75;
        const nextVal = Math.min(params[j].max, Math.max(params[j].min, origValues[j] + step));
        params[j].set(nextVal);
        if (params[j].setSigma) {
          const esd = Math.sqrt(Math.max(0.5, baseEval.agreement.chiSquared) / hessDiag);
          params[j].setSigma!(esd);
        }
      }
    }

    const updatedEval = evaluateRietveldForwardModel(
      phases,
      inst,
      globalParams,
      experimentalGrid,
      M
    );

    if (updatedEval.agreement.Rwp < baseEval.agreement.Rwp) {
      lambda = Math.max(0.01, lambda * 0.65);
    } else {
      // Revert and increase damping
      params.forEach((p, idx) => p.set(origValues[idx]));
      lambda = Math.min(5.0, lambda * 2.2);
    }

    const finalStepEval = evaluateRietveldForwardModel(
      phases,
      inst,
      globalParams,
      experimentalGrid,
      M
    );

    history.push({
      iteration: iter,
      stageLabel: stage,
      Rwp: finalStepEval.agreement.Rwp,
      Rp: finalStepEval.agreement.Rp,
      chiSquared: finalStepEval.agreement.chiSquared,
      BraggR: finalStepEval.agreement.totalBraggR,
      dampingLambda: lambda,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    });
  }

  return {
    phases,
    globalParams,
    history,
    activeParamCount: params.length
  };
}

/**
 * Parse a Crystallographic Information File (.cif) text into a RietveldPhaseModel
 */
export function parseCIFToRietveldPhase(cifText: string, colorHex = '#38BDF8'): RietveldPhaseModel {
  const extractFloat = (tag: string, fallback: number): number => {
    const regex = new RegExp(`${tag}\\s+([0-9.+-]+)`, 'i');
    const match = cifText.match(regex);
    if (!match) return fallback;
    const cleaned = match[1].replace(/\([0-9]+\)/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const extractString = (tag: string, fallback: string): string => {
    const regex = new RegExp(`${tag}\\s+['"]?([^'"\\n\\r]+)['"]?`, 'i');
    const match = cifText.match(regex);
    return match ? match[1].trim() : fallback;
  };

  const a = extractFloat('_cell_length_a', 5.4309);
  const b = extractFloat('_cell_length_b', a);
  const c = extractFloat('_cell_length_c', a);
  const alpha = extractFloat('_cell_angle_alpha', 90);
  const beta = extractFloat('_cell_angle_beta', 90);
  const gamma = extractFloat('_cell_angle_gamma', 90);
  const Z = Math.max(1, Math.round(extractFloat('_cell_formula_units_Z', 4)));
  const spaceGroup = extractString('_symmetry_space_group_name_H-M', 'P 32 2 1');
  const formula = extractString('_chemical_formula_sum', 'Si O2');
  const name = extractString('_chemical_name_mineral', formula);

  // Infer crystal system & centering
  let crystalSystem: RietveldCrystalSystem = 'Cubic';
  if (Math.abs(alpha - 90) > 0.01 || Math.abs(beta - 90) > 0.01 || Math.abs(gamma - 90) > 0.01) {
    if (Math.abs(gamma - 120) < 0.1) {
      crystalSystem = spaceGroup.toLowerCase().includes('p3') || spaceGroup.toLowerCase().includes('r')
        ? 'Trigonal'
        : 'Hexagonal';
    } else if (Math.abs(alpha - 90) < 0.01 && Math.abs(gamma - 90) < 0.01) {
      crystalSystem = 'Monoclinic';
    } else {
      crystalSystem = 'Triclinic';
    }
  } else if (Math.abs(a - b) < 0.001 && Math.abs(b - c) < 0.001) {
    crystalSystem = 'Cubic';
  } else if (Math.abs(a - b) < 0.001) {
    crystalSystem = 'Tetragonal';
  } else {
    crystalSystem = 'Orthorhombic';
  }

  const firstChar = spaceGroup.trim()[0]?.toUpperCase();
  const centering: 'P' | 'I' | 'F' | 'C' | 'R' =
    firstChar === 'I' || firstChar === 'F' || firstChar === 'C' || firstChar === 'R'
      ? (firstChar as 'I' | 'F' | 'C' | 'R')
      : 'P';

  // Parse atom_site lines
  const atoms: RietveldWyckoffSite[] = [];
  const lines = cifText.split(/\r?\n/);
  let inAtomLoop = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('_atom_site_')) {
      inAtomLoop = true;
      continue;
    }
    if (inAtomLoop) {
      if (!line || line.startsWith('loop_') || line.startsWith('_') || line.startsWith('#')) {
        if (atoms.length > 0) break;
        continue;
      }
      const tokens = line.split(/\s+/);
      if (tokens.length >= 5) {
        const label = tokens[0];
        const elemMatch = label.match(/^[A-Za-z]{1,2}/);
        const element = elemMatch ? elemMatch[0] : 'Si';
        const cleanNum = (s: string, fb: number) => {
          const v = parseFloat((s || '').replace(/\([0-9]+\)/g, ''));
          return Number.isFinite(v) ? v : fb;
        };
        // Support both 5-column (label x y z occ) and 7-column (label symbol wyck x y z Biso occ) formats
        const hasTypeSymbol = /^[A-Za-z]{1,2}[0-9+-]*$/.test(tokens[1]);
        const offset = hasTypeSymbol ? 1 : 0;
        const x = cleanNum(tokens[1 + offset], 0);
        const y = cleanNum(tokens[2 + offset], 0);
        const z = cleanNum(tokens[3 + offset], 0);
        const bIso = cleanNum(tokens[4 + offset], 0.65);
        const occ = cleanNum(tokens[5 + offset], 1.0);

        atoms.push({
          id: `cif-${atoms.length}-${label}`,
          label,
          element,
          wyckoff: `${atoms.length + 1}a`,
          x,
          y,
          z,
          occupancy: Math.min(2, Math.max(0.05, occ)),
          bIso: Math.min(5, Math.max(0.05, bIso)),
          refineXYZ: x !== 0 && x !== 0.5 && x !== 0.25,
          refineOcc: false,
          refineBIso: true
        });
      }
    }
  }

  if (atoms.length === 0) {
    atoms.push({
      id: 'default-atom-1',
      label: 'Si1',
      element: 'Si',
      wyckoff: '3a',
      x: 0.4697,
      y: 0.0,
      z: 0.3333,
      occupancy: 1.0,
      bIso: 0.62,
      refineXYZ: true,
      refineOcc: false,
      refineBIso: true
    });
  }

  return {
    id: `phase-cif-${Date.now()}`,
    name,
    formula,
    spaceGroup,
    crystalSystem,
    centering,
    Z,
    scaleFactor: 1.0,
    a,
    b,
    c,
    alpha,
    beta,
    gamma,
    U: 0.018,
    V: -0.008,
    W: 0.016,
    X: 0.045,
    Y: 0.025,
    IG: 0.0,
    asymmetry: 0.04,
    profileShape: 'TCH_PseudoVoigt',
    pearsonM: 1.5,
    marchDollaseR: 1.0,
    prefOrientHKL: [0, 0, 1],
    brindleyRadiusMicron: 2.0,
    atoms,
    color: colorHex
  };
}

export interface RietveldPresetScenario {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  inst: InstrumentalResolutionConfig;
  truePhases: RietveldPhaseModel[];
  initialPhases: RietveldPhaseModel[]; // Slightly perturbed initial state so user can refine to convergence
  trueGlobal: RietveldGlobalParameters;
  initialGlobal: RietveldGlobalParameters;
  sampleCifText: string;
}

export const RIETVELD_PRESET_SCENARIOS: RietveldPresetScenario[] = [
  {
    id: 'tio2_anatase_rutile',
    title: 'TiO₂ Anatase + Rutile Dual-Phase QPA',
    subtitle: 'I4₁/amd + P4₂/mnm · Hill-Howard Quantitative Weight Fractions',
    badge: '2 Phases · QPA',
    description:
      'Quantitative multiphase Rietveld refinement of Degussa P25-type TiO₂ photocatalyst containing Tetragonal Anatase (I4₁/amd) and Rutile (P4₂/mnm). Demonstrates simultaneous scale factor, lattice (a, c), Caglioti profile, and O(4f/4e) positional refinement.',
    inst: {
      name: 'Cu Kα₁/Kα₂ Bragg-Brentano (R = 240 mm)',
      wavelength: 1.540598,
      wavelengthKa2: 1.544426,
      ka2Ratio: 0.5,
      monochromatorTwoTheta: 26.57,
      goniometerRadiusMm: 240,
      uInst: 0.008,
      vInst: -0.004,
      wInst: 0.009,
      xInst: 0.012,
      yInst: 0.008
    },
    truePhases: [
      {
        id: 'phase-anatase',
        name: 'Anatase TiO₂',
        formula: 'TiO2',
        spaceGroup: 'I 41/a m d',
        crystalSystem: 'Tetragonal',
        centering: 'I',
        Z: 4,
        scaleFactor: 1.42,
        a: 3.7845,
        b: 3.7845,
        c: 9.5143,
        alpha: 90,
        beta: 90,
        gamma: 90,
        U: 0.022,
        V: -0.008,
        W: 0.018,
        X: 0.058,
        Y: 0.032,
        IG: 0.0,
        asymmetry: 0.045,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 1.0,
        prefOrientHKL: [1, 0, 1],
        brindleyRadiusMicron: 1.5,
        color: '#38BDF8',
        atoms: [
          {
            id: 'ana-ti',
            label: 'Ti1',
            element: 'Ti',
            wyckoff: '4a',
            x: 0.0,
            y: 0.0,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.52,
            refineXYZ: false,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'ana-o',
            label: 'O1',
            element: 'O',
            wyckoff: '8e',
            x: 0.0,
            y: 0.0,
            z: 0.2081,
            occupancy: 1.0,
            bIso: 0.68,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      },
      {
        id: 'phase-rutile',
        name: 'Rutile TiO₂',
        formula: 'TiO2',
        spaceGroup: 'P 42/m n m',
        crystalSystem: 'Tetragonal',
        centering: 'P',
        Z: 2,
        scaleFactor: 1.28,
        a: 4.5937,
        b: 4.5937,
        c: 2.9587,
        alpha: 90,
        beta: 90,
        gamma: 90,
        U: 0.015,
        V: -0.005,
        W: 0.014,
        X: 0.035,
        Y: 0.018,
        IG: 0.0,
        asymmetry: 0.045,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 0.96,
        prefOrientHKL: [1, 1, 0],
        brindleyRadiusMicron: 2.2,
        color: '#F59E0B',
        atoms: [
          {
            id: 'rut-ti',
            label: 'Ti1',
            element: 'Ti',
            wyckoff: '2a',
            x: 0.0,
            y: 0.0,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.45,
            refineXYZ: false,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'rut-o',
            label: 'O1',
            element: 'O',
            wyckoff: '4f',
            x: 0.3048,
            y: 0.3048,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.62,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      }
    ],
    initialPhases: [
      {
        id: 'phase-anatase',
        name: 'Anatase TiO₂',
        formula: 'TiO2',
        spaceGroup: 'I 41/a m d',
        crystalSystem: 'Tetragonal',
        centering: 'I',
        Z: 4,
        scaleFactor: 1.18,
        a: 3.7920,
        b: 3.7920,
        c: 9.5010,
        alpha: 90,
        beta: 90,
        gamma: 90,
        U: 0.028,
        V: -0.008,
        W: 0.026,
        X: 0.072,
        Y: 0.042,
        IG: 0.0,
        asymmetry: 0.045,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 1.0,
        prefOrientHKL: [1, 0, 1],
        brindleyRadiusMicron: 1.5,
        color: '#38BDF8',
        atoms: [
          {
            id: 'ana-ti',
            label: 'Ti1',
            element: 'Ti',
            wyckoff: '4a',
            x: 0.0,
            y: 0.0,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.65,
            refineXYZ: false,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'ana-o',
            label: 'O1',
            element: 'O',
            wyckoff: '8e',
            x: 0.0,
            y: 0.0,
            z: 0.2140,
            occupancy: 1.0,
            bIso: 0.85,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      },
      {
        id: 'phase-rutile',
        name: 'Rutile TiO₂',
        formula: 'TiO2',
        spaceGroup: 'P 42/m n m',
        crystalSystem: 'Tetragonal',
        centering: 'P',
        Z: 2,
        scaleFactor: 1.05,
        a: 4.5860,
        b: 4.5860,
        c: 2.9640,
        alpha: 90,
        beta: 90,
        gamma: 90,
        U: 0.020,
        V: -0.005,
        W: 0.022,
        X: 0.048,
        Y: 0.026,
        IG: 0.0,
        asymmetry: 0.045,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 1.04,
        prefOrientHKL: [1, 1, 0],
        brindleyRadiusMicron: 2.2,
        color: '#F59E0B',
        atoms: [
          {
            id: 'rut-ti',
            label: 'Ti1',
            element: 'Ti',
            wyckoff: '2a',
            x: 0.0,
            y: 0.0,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.58,
            refineXYZ: false,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'rut-o',
            label: 'O1',
            element: 'O',
            wyckoff: '4f',
            x: 0.2980,
            y: 0.2980,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.78,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      }
    ],
    trueGlobal: {
      twoThetaMin: 20,
      twoThetaMax: 80,
      stepSize: 0.1,
      zeroShiftDeg: 0.028,
      sampleDisplacementMm: 0.045,
      transparencyCoeff: 0.0005,
      backgroundMode: 'chebyshev',
      chebyshevOrder: 4,
      chebyshevCoeffs: [82, -24, 14, -5, 2, 0],
      manualBgAnchors: [
        { twoTheta: 20, intensity: 118 },
        { twoTheta: 45, intensity: 74 },
        { twoTheta: 80, intensity: 68 }
      ]
    },
    initialGlobal: {
      twoThetaMin: 20,
      twoThetaMax: 80,
      stepSize: 0.1,
      zeroShiftDeg: 0.0,
      sampleDisplacementMm: 0.0,
      transparencyCoeff: 0.0005,
      backgroundMode: 'chebyshev',
      chebyshevOrder: 4,
      chebyshevCoeffs: [68, -12, 8, -2, 0, 0],
      manualBgAnchors: [
        { twoTheta: 20, intensity: 105 },
        { twoTheta: 45, intensity: 65 },
        { twoTheta: 80, intensity: 60 }
      ]
    },
    sampleCifText: `data_Rutile_TiO2
_chemical_name_mineral            'Rutile TiO2'
_chemical_formula_sum             'Ti O2'
_symmetry_space_group_name_H-M    'P 42/m n m'
_cell_length_a                    4.5937(2)
_cell_length_b                    4.5937(2)
_cell_length_c                    2.9587(1)
_cell_angle_alpha                 90.0
_cell_angle_beta                  90.0
_cell_angle_gamma                 90.0
_cell_formula_units_Z             2
loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
_atom_site_B_iso_or_equiv
_atom_site_occupancy
Ti1 Ti 0.0000 0.0000 0.0000 0.45 1.00
O1  O  0.3048 0.3048 0.0000 0.62 1.00`
  },
  {
    id: 'sio2_alpha_quartz',
    title: 'α-SiO₂ Trigonal Quartz (P3₂21)',
    subtitle: 'IUCr CPD Round-Robin Benchmark · Si(3a) & O(6c) Coordinates',
    badge: 'Trigonal · P3₂21',
    description:
      'Classic International Union of Crystallography (IUCr) Commission on Powder Diffraction Rietveld benchmark for α-Quartz (P3₂21). Refines hexagonal/trigonal unit cell constants (a, c), specimen displacement, and general Wyckoff 6c oxygen coordinates.',
    inst: {
      name: 'Cu Kα₁ Monochromated (Johansson Ge-111)',
      wavelength: 1.540598,
      wavelengthKa2: 1.544426,
      ka2Ratio: 0.0,
      monochromatorTwoTheta: 27.28,
      goniometerRadiusMm: 240,
      uInst: 0.006,
      vInst: -0.003,
      wInst: 0.007,
      xInst: 0.010,
      yInst: 0.006
    },
    truePhases: [
      {
        id: 'phase-quartz',
        name: 'α-Quartz SiO₂',
        formula: 'SiO2',
        spaceGroup: 'P 32 2 1',
        crystalSystem: 'Trigonal',
        centering: 'P',
        Z: 3,
        scaleFactor: 1.65,
        a: 4.9134,
        b: 4.9134,
        c: 5.4052,
        alpha: 90,
        beta: 90,
        gamma: 120,
        U: 0.014,
        V: -0.006,
        W: 0.012,
        X: 0.032,
        Y: 0.018,
        IG: 0.0,
        asymmetry: 0.038,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 1.0,
        prefOrientHKL: [1, 0, 1],
        brindleyRadiusMicron: 2.0,
        color: '#38BDF8',
        atoms: [
          {
            id: 'qtz-si',
            label: 'Si1',
            element: 'Si',
            wyckoff: '3a',
            x: 0.4697,
            y: 0.0,
            z: 0.3333,
            occupancy: 1.0,
            bIso: 0.58,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'qtz-o',
            label: 'O1',
            element: 'O',
            wyckoff: '6c',
            x: 0.4135,
            y: 0.2669,
            z: 0.2141,
            occupancy: 1.0,
            bIso: 0.94,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      }
    ],
    initialPhases: [
      {
        id: 'phase-quartz',
        name: 'α-Quartz SiO₂',
        formula: 'SiO2',
        spaceGroup: 'P 32 2 1',
        crystalSystem: 'Trigonal',
        centering: 'P',
        Z: 3,
        scaleFactor: 1.38,
        a: 4.9210,
        b: 4.9210,
        c: 5.3980,
        alpha: 90,
        beta: 90,
        gamma: 120,
        U: 0.022,
        V: -0.006,
        W: 0.019,
        X: 0.048,
        Y: 0.028,
        IG: 0.0,
        asymmetry: 0.038,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 1.0,
        prefOrientHKL: [1, 0, 1],
        brindleyRadiusMicron: 2.0,
        color: '#38BDF8',
        atoms: [
          {
            id: 'qtz-si',
            label: 'Si1',
            element: 'Si',
            wyckoff: '3a',
            x: 0.4760,
            y: 0.0,
            z: 0.3333,
            occupancy: 1.0,
            bIso: 0.72,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'qtz-o',
            label: 'O1',
            element: 'O',
            wyckoff: '6c',
            x: 0.4050,
            y: 0.2669,
            z: 0.2141,
            occupancy: 1.0,
            bIso: 1.15,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      }
    ],
    trueGlobal: {
      twoThetaMin: 18,
      twoThetaMax: 78,
      stepSize: 0.1,
      zeroShiftDeg: -0.022,
      sampleDisplacementMm: 0.035,
      transparencyCoeff: 0.0008,
      backgroundMode: 'chebyshev',
      chebyshevOrder: 4,
      chebyshevCoeffs: [65, -18, 9, -4, 1, 0],
      manualBgAnchors: [
        { twoTheta: 18, intensity: 92 },
        { twoTheta: 48, intensity: 58 },
        { twoTheta: 78, intensity: 54 }
      ]
    },
    initialGlobal: {
      twoThetaMin: 18,
      twoThetaMax: 78,
      stepSize: 0.1,
      zeroShiftDeg: 0.0,
      sampleDisplacementMm: 0.0,
      transparencyCoeff: 0.0008,
      backgroundMode: 'chebyshev',
      chebyshevOrder: 4,
      chebyshevCoeffs: [54, -10, 5, 0, 0, 0],
      manualBgAnchors: [
        { twoTheta: 18, intensity: 80 },
        { twoTheta: 48, intensity: 52 },
        { twoTheta: 78, intensity: 50 }
      ]
    },
    sampleCifText: `data_Alpha_Quartz_SiO2
_chemical_name_mineral            'Alpha-Quartz'
_chemical_formula_sum             'Si O2'
_symmetry_space_group_name_H-M    'P 32 2 1'
_cell_length_a                    4.9134(1)
_cell_length_b                    4.9134(1)
_cell_length_c                    5.4052(1)
_cell_angle_alpha                 90.0
_cell_angle_beta                  90.0
_cell_angle_gamma                 120.0
_cell_formula_units_Z             3
loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
_atom_site_B_iso_or_equiv
_atom_site_occupancy
Si1 Si 0.4697 0.0000 0.3333 0.58 1.00
O1  O  0.4135 0.2669 0.2141 0.94 1.00`
  },
  {
    id: 'lab6_srm660c',
    title: 'NIST SRM 660c LaB₆ Line-Profile Standard',
    subtitle: 'Pm-3m Cubic · Octahedral Boron Cage x(B, 6f) & IRF Calibration',
    badge: 'NIST SRM 660c',
    description:
      'NIST Standard Reference Material 660c Lanthanum Hexaboride (Pm-3m, a = 4.156826 Å). Ideal for calibrating instrumental Caglioti resolution (U, V, W), goniometer zero-shift, and refining the B(6f) (x, 1/2, 1/2) cage coordinate.',
    inst: {
      name: 'High-Resolution Synchrotron / Cu Kα₁',
      wavelength: 1.540598,
      wavelengthKa2: 1.544426,
      ka2Ratio: 0.0,
      monochromatorTwoTheta: 26.57,
      goniometerRadiusMm: 240,
      uInst: 0.005,
      vInst: -0.002,
      wInst: 0.006,
      xInst: 0.008,
      yInst: 0.005
    },
    truePhases: [
      {
        id: 'phase-lab6',
        name: 'LaB₆ NIST SRM 660c',
        formula: 'LaB6',
        spaceGroup: 'P m -3 m',
        crystalSystem: 'Cubic',
        centering: 'P',
        Z: 1,
        scaleFactor: 1.55,
        a: 4.1568,
        b: 4.1568,
        c: 4.1568,
        alpha: 90,
        beta: 90,
        gamma: 90,
        U: 0.009,
        V: -0.004,
        W: 0.009,
        X: 0.018,
        Y: 0.008,
        IG: 0.0,
        asymmetry: 0.025,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 1.0,
        prefOrientHKL: [1, 0, 0],
        brindleyRadiusMicron: 3.0,
        color: '#10B981',
        atoms: [
          {
            id: 'lab6-la',
            label: 'La1',
            element: 'La',
            wyckoff: '1a',
            x: 0.0,
            y: 0.0,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.42,
            refineXYZ: false,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'lab6-b',
            label: 'B1',
            element: 'B',
            wyckoff: '6f',
            x: 0.1995,
            y: 0.5,
            z: 0.5,
            occupancy: 1.0,
            bIso: 0.38,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      }
    ],
    initialPhases: [
      {
        id: 'phase-lab6',
        name: 'LaB₆ NIST SRM 660c',
        formula: 'LaB6',
        spaceGroup: 'P m -3 m',
        crystalSystem: 'Cubic',
        centering: 'P',
        Z: 1,
        scaleFactor: 1.28,
        a: 4.1625,
        b: 4.1625,
        c: 4.1625,
        alpha: 90,
        beta: 90,
        gamma: 90,
        U: 0.016,
        V: -0.004,
        W: 0.015,
        X: 0.032,
        Y: 0.018,
        IG: 0.0,
        asymmetry: 0.025,
        profileShape: 'TCH_PseudoVoigt',
        pearsonM: 1.5,
        marchDollaseR: 1.0,
        prefOrientHKL: [1, 0, 0],
        brindleyRadiusMicron: 3.0,
        color: '#10B981',
        atoms: [
          {
            id: 'lab6-la',
            label: 'La1',
            element: 'La',
            wyckoff: '1a',
            x: 0.0,
            y: 0.0,
            z: 0.0,
            occupancy: 1.0,
            bIso: 0.58,
            refineXYZ: false,
            refineOcc: false,
            refineBIso: true
          },
          {
            id: 'lab6-b',
            label: 'B1',
            element: 'B',
            wyckoff: '6f',
            x: 0.2120,
            y: 0.5,
            z: 0.5,
            occupancy: 1.0,
            bIso: 0.52,
            refineXYZ: true,
            refineOcc: false,
            refineBIso: true
          }
        ]
      }
    ],
    trueGlobal: {
      twoThetaMin: 20,
      twoThetaMax: 85,
      stepSize: 0.1,
      zeroShiftDeg: 0.018,
      sampleDisplacementMm: -0.030,
      transparencyCoeff: 0.0002,
      backgroundMode: 'chebyshev',
      chebyshevOrder: 3,
      chebyshevCoeffs: [52, -14, 6, -2, 0, 0],
      manualBgAnchors: [
        { twoTheta: 20, intensity: 72 },
        { twoTheta: 50, intensity: 48 },
        { twoTheta: 85, intensity: 44 }
      ]
    },
    initialGlobal: {
      twoThetaMin: 20,
      twoThetaMax: 85,
      stepSize: 0.1,
      zeroShiftDeg: 0.0,
      sampleDisplacementMm: 0.0,
      transparencyCoeff: 0.0002,
      backgroundMode: 'chebyshev',
      chebyshevOrder: 3,
      chebyshevCoeffs: [44, -8, 2, 0, 0, 0],
      manualBgAnchors: [
        { twoTheta: 20, intensity: 64 },
        { twoTheta: 50, intensity: 44 },
        { twoTheta: 85, intensity: 40 }
      ]
    },
    sampleCifText: `data_LaB6_SRM660c
_chemical_name_mineral            'Lanthanum Hexaboride SRM 660c'
_chemical_formula_sum             'La B6'
_symmetry_space_group_name_H-M    'P m -3 m'
_cell_length_a                    4.156826(2)
_cell_length_b                    4.156826(2)
_cell_length_c                    4.156826(2)
_cell_angle_alpha                 90.0
_cell_angle_beta                  90.0
_cell_angle_gamma                 90.0
_cell_formula_units_Z             1
loop_
_atom_site_label
_atom_site_type_symbol
_atom_site_fract_x
_atom_site_fract_y
_atom_site_fract_z
_atom_site_B_iso_or_equiv
_atom_site_occupancy
La1 La 0.0000 0.0000 0.0000 0.42 1.00
B1  B  0.1995 0.5000 0.5000 0.38 1.00`
  }
];
