
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface StandardWavelength {
  label: string;
  value: number;
  type: 'X-Ray' | 'Neutron';
}

export interface BraggResult {
  twoTheta: number;
  dSpacing: number;
  qVector: number;
  sinThetaOverLambda: number;
  hkl?: string;
  intensity?: number;
}

export interface BraggState {
  wavelength: number;
  peaks: number[];
  results: BraggResult[];
}

export interface BraggHistoryItem {
  id: string;
  timestamp: string;
  sampleId?: string;
  wavelength: number;
  rawPeaks: string;
  rawHKL: string;
  results: BraggResult[];
}

export interface AIResponse {
  material: string;
  peaks: number[];
  hkls?: string[];
  wavelength?: number;
  description?: string;
  latticeParams?: {
    a: number;
    b?: number;
    c?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
  spaceGroup?: string;
  density?: number;
  sources?: GroundingSource[];
}

export type CrystalSystem = 'SC' | 'BCC' | 'FCC' | 'Diamond' | 'Cubic' | 'Tetragonal' | 'Tetragonal_I' | 'Orthorhombic' | 'Orthorhombic_F' | 'Orthorhombic_C' | 'Hexagonal' | 'Monoclinic' | 'Triclinic';

export interface SelectionRuleResult {
  hkl: [number, number, number];
  status: 'Allowed' | 'Forbidden';
  reason: string;
}

export interface ScherrerInput {
  twoTheta: number;
  fwhmObs: number;
  intensity?: number;
  hkl?: [number, number, number];
}

export interface ScherrerResult {
  twoTheta: number;
  fwhmObs: number;
  betaCorrected: number; // degrees
  sizeNm: number;
  intensity?: number;
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
  hkl?: [number, number, number];
}

export interface WHResult {
  strainPercent: number;
  sizeInterceptNm: number;
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  stephensParams?: {
    S400: number;
    S220: number;
  };
  points: WHPoint[];
  stressMPa?: number;
  energyDensityKjM3?: number;
  pointsExtended?: {
    twoTheta: number;
    fwhmObs: number;
    fwhmInst: number;
    betaCorrectedDeg: number;
    betaCorrectedRad: number;
    x: number;
    y: number;
    singlePeakSizeNm: number;
  }[];
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
  betaObsDeg?: number;
  betaInstDeg?: number;
  betaSampleDeg?: number;
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
  stressMPa?: number;
  energyDensityKjM3?: number;
  pointsExtended?: {
    twoTheta: number;
    betaObsDeg: number;
    betaInstDeg: number;
    betaSampleDeg: number;
    x: number;
    y: number;
    singlePeakSizeNm: number;
  }[];
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

export interface RietveldAtom {
  element: string;
  x: number;
  y: number;
  z: number;
  occupancy: number; 
  bIso: number; 
}

export interface RietveldPhaseInput {
  name: string;
  crystalSystem: CrystalSystem;
  spaceGroup?: string;
  a: number;
  b?: number;
  c?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  zValue?: number;
  molarMass?: number;
  scale?: number;
  // Peak parameters
  u?: number;
  v?: number;
  w?: number;
  eta?: number; // Mixing factor for Pseudo-Voigt
  shape?: number; // Shape parameter for Pearson VII
  // Lorentzian broadening (Size/Strain)
  lx?: number; // X parameter (Size - Lorentzian)
  ly?: number; // Y parameter (Strain - Lorentzian)
  // Preferred orientation
  marchDollase?: number;
  prefOrientHKL?: [number, number, number];
  asymmetry?: number; // Finger-Cox-Jephcoat asymmetry
  extinction?: number; // Primary/Secondary extinction
  // Refinement flags
  refineLattice?: boolean;
  refineAtomicPos?: boolean;
  refineOcc?: boolean;
  refineBiso?: boolean;
  refineProfile?: boolean;
  refineAsymmetry?: boolean;
  refinePrefOrient?: boolean;
  refineMicrostrain?: boolean;
  refineCrystalliteSize?: boolean;
  refineExtinction?: boolean;
  refineScale?: boolean;
  refineAnisotropicStrain?: boolean;
  refineSphericalHarmonics?: boolean;
  // Atoms
  atoms?: RietveldAtom[];
}

export interface RietveldSetupInput {
  phases: RietveldPhaseInput[];
  maxObsIntensity: number;
  backgroundModel: 'Chebyshev' | 'Linear_Interpolation' | 'Polynomial' | 'Shifted_Chebyshev';
  bgTerms?: number;
  profileShape: 'Thompson-Cox-Hastings' | 'Pseudo-Voigt' | 'Pearson-VII';
  wavelength?: number;
  zeroShift?: number;
  sampleDisplacement?: number; // Sample displacement (SyCos)
  polarization?: number; // Polarization factor (Lp)
  refineZeroShift?: boolean;
  refineBkg?: boolean;
  refineSampleDisplacement?: boolean;
  twoThetaMin?: number;
  twoThetaMax?: number;
  stepSize?: number;
  geometry?: 'Bragg-Brentano' | 'Debye-Scherrer';
  divergenceSlit?: 'Fixed' | 'Variable';
  refineSurfaceRoughness?: boolean;
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
        volume: number;
        density?: number;
        spaceGroup?: string;
      };
      peak_parameters?: {
        u: number;
        v: number;
        w: number;
        lx?: number;
        ly?: number;
        mixing_eta?: number;
        shape_factor?: number;
        asymmetry?: number;
      };
      atomic_structure?: RietveldAtom[];
      preferred_orientation?: {
        march_dollase_r: number;
        direction?: [number, number, number];
      };
    }[];
    background_model: string;
    profile_shape: string;
    wavelength: number;
    instrumental_parameters?: {
      zero_shift: number;
      sample_displacement?: number;
      polarization?: number;
      irf_file?: string;
      geometry?: string;
      divergence_slit?: string;
      surface_roughness?: boolean;
    };
  };
  quality_metrics?: {
    r_wp: number;
    r_exp: number;
    gof: number;
    chi_squared: number;
    durbin_watson?: number;
  };
  stats?: {
    totalReflections: number;
    totalParameters: number;
    dataPoints: number;
    degreesOfFreedom: number;
    observationRatio: number; // dataPoints / totalParameters
  };
  refinement_strategy: string[];
}

export interface LatticeParameters {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
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
  xrayIntensity?: number;
}

export interface MagneticAtom extends NeutronAtom {
  mx: number; // Magnetic moment x-component (Bohr magnetons)
  my: number;
  mz: number;
  ion?: string; // e.g., 'Mn2+', 'Fe3+'
}

export interface MagneticResult extends NeutronResult {
  nuclearIntensity: number;
  magneticIntensity: number;
  totalIntensity: number;
}

export interface DLPhaseCandidate {
  phase_name: string;
  confidence_score: number; // 0-100
  raw_score?: number;
  match_quality?: string;
  card_id: string;
  formula: string;
  matched_peaks?: { refT: number; obsT: number; refI: number; h?: number; k?: number; l?: number }[];
  // Material Intelligence Metadata
  description?: string;
  crystalSystem?: string;
  spaceGroup?: string;
  density?: number; // g/cm3
  applications?: string[];
  materialType?: string;
  molecularWeight?: number; // g/mol
  hazards?: string[];
  magneticProperties?: string;
  bandGap?: number; // eV
  elasticModulus?: number; // GPa
  opticalProperties?: string;
  // Advanced Physical property details
  thermalConductivity?: number; // W/m·K
  meltingPoint?: number; // °C
  vickersHardness?: number; // GPa
  poissonsRatio?: number;
  electricalResistivity?: number; // microOhm·cm
  dielectricConstant?: number;
  thermalExpansion?: number; // 10^-6/K
}

export interface DLPhaseResult {
  module: string;
  candidates: DLPhaseCandidate[];
}
