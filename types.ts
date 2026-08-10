
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
  validationError?: string;
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
  materialName?: string;
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
  betaStrainDeg?: number;
  microstrain?: number;
  effFwhmWithStrain?: number;
  snr?: number;
  peakToBackground?: number;
}

export interface MonshiScherrerPoint {
  x: number; // ln(1 / cos(theta))
  y: number; // ln(beta_sample_rad)
  twoTheta: number;
  hkl?: [number, number, number];
}

export interface MonshiScherrerResult {
  sizeNm: number;
  slope: number;
  intercept: number;
  rSquared: number;
  slopeInterpretation: string;
  points: MonshiScherrerPoint[];
  pointsExtended: {
    twoTheta: number;
    fwhmObs: number;
    fwhmInst: number;
    betaCorrectedDeg: number;
    betaCorrectedRad: number;
    x: number;
    y: number;
    singlePeakSizeNm: number;
    hkl?: [number, number, number];
  }[];
  estimatedStrain?: number;
  zeroShiftApplied?: number;
  broadeningModelUsed?: string;
}

export interface MomentDataPoint {
  sigmaDeg: number;       // Integration range limit sigma = Delta(2theta)/2 in degrees
  sigmaRad: number;       // Integration range limit sigma in radians
  varianceDeg2: number;   // Variance W(sigma) in deg^2
  varianceRad2: number;   // Variance W(sigma) in rad^2
  fourthMomentRad4?: number; // 4th moment mu_4(sigma) in rad^4
  kurtosis?: number;      // Kurtosis K = mu_4 / W^2
}

export interface MethodOfMomentsResult {
  twoTheta0: number;          // Centroid 2-Theta (deg)
  theta0Rad: number;          // Centroid Theta (rad)
  wavelength: number;         // X-ray wavelength (Angstrom)
  slopeK1: number;            // Linear term K1 = dW / d_sigma (rad)
  quadraticK2: number;        // Quadratic term K2 = d^2 W / d_sigma^2
  interceptW0: number;        // Constant variance term W0 (rad^2)
  sizeNm: number;             // Volume-weighted crystallite size D_V = lambda / (pi^2 * K1 * cos(theta0)) in nm
  rmsStrain: number;          // RMS microstrain <e^2>^0.5 = sqrt(K2) / (2 * tan(theta0))
  meanKurtosis: number;       // Average kurtosis ratio mu_4 / W^2
  rSquared: number;           // Regression R^2 for W(sigma) = W0 + K1*sigma + K2*sigma^2
  points: MomentDataPoint[];  // Range-variance data points
  fittedPoints: {
    sigmaDeg: number;
    sigmaRad: number;
    fittedWDeg2: number;
    fittedWRad2: number;
    linearComponentDeg2: number;
    quadraticComponentDeg2: number;
  }[];
  profileInterpretation: string;
  zeroShiftApplied?: number;
  instrumentalModeUsed?: string;
  lpCorrectionApplied?: boolean;
  shapeKApplied?: number;
}

export interface DoubleVoigtPoint {
  twoTheta: number;
  s: number;          // 2 * sin(theta) / lambda [nm^-1]
  s2: number;         // s^2
  betaStar: number;   // beta * cos(theta) / lambda [nm^-1]
  betaCStar: number;  // Cauchy component in reciprocal space [nm^-1]
  betaGStarSq: number;// (Gaussian component in reciprocal space)^2 [nm^-2]
  betaGStar: number;  // Gaussian component in reciprocal space [nm^-1]
  singleDvNm: number; // Single peak apparent volume size
  hkl?: [number, number, number];
}

export interface DoubleVoigtResult {
  volumeSizeDvNm: number;     // D_V = 1 / beta_{C,S}* [nm]
  gaussianSizeDgNm: number;   // D_G = 1 / (pi * beta_{G,S}*) [nm]
  areaSizeDaNm: number;       // D_A area-weighted crystallite size [nm]
  cauchyStrainEc: number;     // e_C = Slope_C / 2
  gaussianStrainEg: number;   // e_G = sqrt(Slope_G / (8*pi))
  rmsStrain: number;          // <e^2>^(1/2) = sqrt(e_C^2 + 2*pi*e_G^2)
  cauchyFit: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  gaussianFit: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
  points: DoubleVoigtPoint[];
  zeroShiftApplied?: number;
  instrumentalModeUsed?: string;
  lpCorrectionApplied?: boolean;
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
  ai_advice?: string;
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
  label?: string;
  q?: [number, number, number];
}

export interface DLPhaseCandidate {
  phase_name: string;
  confidence_score: number; // 0-100
  mlValidationScore?: number;
  raw_score?: number;
  match_quality?: string;
  card_id: string;
  formula: string;
  elements?: string[];
  matched_peaks?: { refT: number; obsT: number; refI: number; h?: number; k?: number; l?: number }[];
  fitted_strain_pct?: number;
  fitted_domain_size_broadening?: number;
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
  // Custom manual metadata fields
  standardState?: string;
  standardEntropy?: number;
  formationEnergy?: number;
  heatCapacity?: number;
  debyeTemperature?: number;
  energyAboveHull?: number;
  stabilityStatus?: string;
  decompositionTemp?: number;
  formationEnthalpy?: number;
  // Cell structure details
  latticeParams?: {
    a: number;
    b?: number;
    c?: number;
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
  cellVolume?: number; // Å³
  zValue?: number;
  rwp?: number; // Weighted pattern residual %
  rp?: number; // Pattern residual %
  gof?: number; // Goodness of fit (chi-squared)
  weightFraction?: number; // Quantitative weight % in mixture
  rmsAngleShift?: number; // RMS 2theta shift in degrees
  // Bioceramics & Pharma Intelligence
  caPRatio?: number; // Calcium to Phosphorus atomic ratio (e.g., 1.67 HAp)
  bioactivityIndex?: string; // SBF Bioactivity classification
  resorbabilityClass?: string; // In-vivo biodegradation rate
  polymorphType?: string; // Drug API polymorphic form designation
  excipientRole?: string; // Tableting or DPI carrier functionality
}

export interface DLPhaseResult {
  module: string;
  candidates: DLPhaseCandidate[];
}
