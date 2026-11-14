export type CrystalSystem =
  | 'Cubic'
  | 'Tetragonal'
  | 'Hexagonal'
  | 'Trigonal'
  | 'Orthorhombic'
  | 'Monoclinic'
  | 'Triclinic';

export type DecompositionMethod = 'lebail' | 'pawley' | 'comparator';

export type ProfileShapeType = 'pseudo_voigt' | 'tch_voigt' | 'pearson_vii';

export type InitialGuessMode = 'uniform' | 'wilson' | 'perturbed';

export interface LatticeParameters {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface CagliotiProfile {
  u: number;
  v: number;
  w: number;
  eta: number;       // Pseudo-Voigt mixing (0 = Gaussian, 1 = Lorentzian)
  pearsonM: number;  // Pearson VII shape exponent m (>= 1)
  asym: number;      // Axial divergence / peak asymmetry coefficient (-0.5..0.5)
  zeroShift: number; // Zero point 2Theta offset (deg)
}

export interface BackgroundCoeffs {
  bg0: number;
  bg1: number;
  bg2: number;
  bg3: number;
}

export interface PeakReflection {
  id: string;
  h: number;
  k: number;
  l: number;
  twoTheta: number;
  dSpacing: number;
  multiplicity: number;
  intensity: number;       // True reference intensity (for synthetic benchmark)
  prevIntensity: number;
  calcIntensity: number;
  sigmaIntensity?: number; // Estimated standard deviation from Pawley covariance matrix
  fwhm: number;
  overlapGroup?: number;
  isExtinct?: boolean;
}

export interface PatternPoint {
  twoTheta: number;
  yObs: number;
  yCalc: number;           // Active method calculated profile
  yCalcLeBail?: number;    // Secondary trace for comparator mode
  yCalcPawley?: number;    // Secondary trace for comparator mode
  yBg: number;
  diff: number;
  diffPawley?: number;
  sigmaObs: number;
  peaks: { key: string; intensity: number }[];
}

export interface RefinementMetrics {
  iteration: number;
  rP: number;             // Profile R-factor (%)
  rWP: number;            // Weighted profile R-factor (%)
  rExp: number;           // Expected R-factor (%)
  rBragg: number;         // Bragg R-factor (%) vs ground-truth benchmark (if synthetic)
  chi2: number;           // Reduced chi-squared (S^2)
  goF: number;            // Goodness of fit S = R_wp / R_exp
  durbinWatson: number;   // Durbin-Watson serial correlation statistic d (ideal ~ 2.0)
  maxDeltaI: number;      // Max relative intensity step (%)
  conditionNumber?: number; // Condition number kappa(M) of Pawley normal matrix
  negativePeakCount?: number; // Count of unconstrained I_k < 0 in Pawley
  converged: boolean;
}

export interface ConvergenceStep {
  cycle: number;
  rP: number;
  rWP: number;
  chi2: number;
  rBragg: number;
  rWPLeBail?: number;
  rWPPawley?: number;
  chi2LeBail?: number;
  chi2Pawley?: number;
  conditionNumber?: number;
}

export interface OverlappingPair {
  ref1: PeakReflection;
  ref2: PeakReflection;
  deltaTwoTheta: number;
  overlapDegree: number;      // 0 to 1 analytical overlap integral
  correlationPawley: number;  // True off-diagonal correlation R_jk from inverted Pawley normal matrix
  iLeBail1?: number;
  iLeBail2?: number;
  iPawley1?: number;
  iPawley2?: number;
  sigmaPawley1?: number;
  sigmaPawley2?: number;
}

export interface CovarianceCluster {
  clusterIndex: number;
  reflectionIds: string[];
  labels: string[];
  twoThetas: number[];
  correlationMatrix: number[][]; // Normalized R_jk in [-1, 1]
  conditionNumber: number;
}

export interface UploadedXRDData {
  fileName: string;
  points: { twoTheta: number; yObs: number; sigmaObs: number }[];
  min2T: number;
  max2T: number;
  stepSize: number;
}

export interface PawleyPreset {
  id: string;
  name: string;
  formula: string;
  system: CrystalSystem;
  spaceGroup: string;
  spaceGroupNumber: number;
  lattice: {
    a: number;
    b: number;
    c: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
  wavelength: number;
  profile: {
    u: number;
    v: number;
    w: number;
    eta: number;
    zeroShift: number;
  };
  background: {
    bg0: number;
    bg1: number;
    bg2?: number;
    bg3?: number;
  };
  description: string;
}
