export type CrystalSystem = 
  | 'Cubic' 
  | 'Tetragonal' 
  | 'Hexagonal' 
  | 'Trigonal' 
  | 'Orthorhombic' 
  | 'Monoclinic' 
  | 'Triclinic';

export type DecompositionMethod = 'lebail' | 'pawley' | 'comparator';

export type ProfileShapeType = 'pseudo_voigt' | 'pearson_vii';

export interface PeakReflection {
  id: string;
  h: number;
  k: number;
  l: number;
  twoTheta: number;
  dSpacing: number;
  multiplicity: number;
  intensity: number;
  prevIntensity: number;
  calcIntensity: number;
  fwhm: number;
  overlapGroup?: number;
  isExtinct?: boolean;
}

export interface PatternPoint {
  twoTheta: number;
  yObs: number;
  yCalc: number;
  yBg: number;
  diff: number;
  sigmaObs: number;
  peaks: { key: string; intensity: number }[];
}

export interface RefinementMetrics {
  iteration: number;
  rP: number;        // Profile R-factor (%)
  rWP: number;       // Weighted profile R-factor (%)
  rExp: number;      // Expected R-factor (%)
  rBragg: number;    // Bragg R-factor (%)
  chi2: number;      // Reduced chi-squared (GoF)
  durbinWatson: number; // Durbin-Watson statistic d
  maxDeltaI: number; // Max intensity change (%)
  converged: boolean;
}

export interface ConvergenceStep {
  cycle: number;
  rP: number;
  rWP: number;
  chi2: number;
  rBragg: number;
}

export interface OverlappingPair {
  ref1: PeakReflection;
  ref2: PeakReflection;
  deltaTwoTheta: number;
  overlapDegree: number; // 0 to 1 (1 = complete overlap)
  correlationPawley: number; // estimated correlation coefficient in Pawley matrix
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
  };
  description: string;
}
