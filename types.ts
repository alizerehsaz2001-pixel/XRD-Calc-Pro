export interface BraggResult {
  twoTheta: number;
  dSpacing: number;
  qVector: number;
  sinThetaOverLambda: number;
}

export interface BraggState {
  wavelength: number;
  peaks: number[];
  results: BraggResult[];
}

export interface AIResponse {
  material: string;
  peaks: number[];
  wavelength?: number;
  description?: string;
}

export type CrystalSystem = 'SC' | 'BCC' | 'FCC' | 'Diamond' | 'Cubic' | 'Tetragonal' | 'Orthorhombic' | 'Hexagonal' | 'Monoclinic' | 'Triclinic';

export interface SelectionRuleResult {
  hkl: [number, number, number];
  status: 'Allowed' | 'Forbidden';
  reason: string;
}

export interface ScherrerInput {
  twoTheta: number;
  fwhmObs: number;
}

export interface ScherrerResult {
  twoTheta: number;
  fwhmObs: number;
  betaCorrected: number; // degrees
  sizeNm: number;
  error?: string;
}

export interface FWHMResult {
  fwhm: number;
  integralBreadth: number;
  shapeFactor: number; // FWHM / IB
  area: number;
  maxIntensity: number;
}

export interface WHPoint {
  x: number; // 4 * sin(theta)
  y: number; // beta * cos(theta)
  twoTheta: number;
}

export interface WHResult {
  strainPercent: number;
  sizeInterceptNm: number;
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  points: WHPoint[];
}

export interface IntegralBreadthInput {
  twoTheta: number;
  fwhm: number;
  area: number;
  iMax: number;
}

export interface IntegralBreadthResult {
  twoTheta: number;
  integralBreadthDeg: number;
  shapeFactorPhi: number;
  calcSizeNm: number;
}

export interface IBAdvancedInput {
  twoTheta: number;
  area: number;
  iMax: number;
}

export interface IBAdvancedResult {
  strainPercent: number;
  sizeInterceptNm: number;
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  points: { x: number; y: number; twoTheta: number; betaSample: number }[];
}

export interface WAInputPoint {
  L_nm: number;
  A1: number;
  A2: number;
}

export interface WAResult {
  sizeDistribution: { L_nm: number; A_size: number }[];
  strainDistribution: { L_nm: number; rms_strain: number }[];
}

export interface RietveldPhaseInput {
  name: string;
  crystalSystem: CrystalSystem;
  a: number;
  b?: number;
  c?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
}

export interface RietveldSetupInput {
  phases: RietveldPhaseInput[];
  maxObsIntensity: number;
  backgroundModel: 'Chebyshev_6_term' | 'Linear_Interpolation' | 'Polynomial_4_term';
  profileShape: 'Thompson-Cox-Hastings' | 'Pseudo-Voigt' | 'Pearson-VII';
}

export interface RietveldSetupResult {
  module: string;
  initial_parameters: {
    phases: {
      name: string;
      scale_guess: number;
      lattice: {
        a: number;
        b: number;
        c: number;
        alpha: number;
        beta: number;
        gamma: number;
      };
    }[];
    background_model: string;
    profile_shape: string;
  };
  refinement_strategy: string[];
}

export interface NeutronAtom {
  id: string;
  element: string;
  label: string;
  b: number; // Scattering length in fm (10^-15 m)
  x: number;
  y: number;
  z: number;
  B_iso: number; // Debye-Waller factor (A^2)
}

export interface NeutronResult {
  hkl: [number, number, number];
  dSpacing: number;
  twoTheta: number;
  F_squared: number;
  intensity: number;
}

export interface MagneticAtom extends NeutronAtom {
  mx: number; // Magnetic moment x-component (Bohr magnetons)
  my: number;
  mz: number;
}

export interface MagneticResult {
  hkl: [number, number, number];
  twoTheta: number;
  dSpacing: number;
  nuclearIntensity: number;
  magneticIntensity: number;
  totalIntensity: number;
}

export interface DLPhaseCandidate {
  phase_name: string;
  confidence_score: number; // 0-100
  card_id: string;
  formula: string;
}

export interface DLPhaseResult {
  module: string;
  candidates: DLPhaseCandidate[];
}

// CrystalMind Control Interfaces - Refined for Mission Logic
export interface CrystalMindSearchResult {
  phase_name: string;
  formula: string;
  database_id: string;
  space_group: string;
  lattice_params: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
  };
  figure_of_merit: number;
  cif_url: string;
}

export interface CrystalMindResponse {
  module: "CrystalMind-Control";
  action: "Database_Search";
  status: "success" | "error";
  query_parameters: {
    elements_included: string[];
    elements_excluded: string[];
    strict_match: boolean;
    database_target: "COD" | "MaterialsProject" | "AMCSD" | "All";
  };
  search_results: CrystalMindSearchResult[];
  control_message: string;
}