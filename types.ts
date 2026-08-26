
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
  hkl?: [number, number, number];
  dSpacing?: number; // Angstroms
  qVector?: number; // Angstrom^-1
  dislocationDensityM2?: number; // lines/m^2 (delta = 1/D^2)
  dislocationDensity10_14?: number; // 10^14 m^-2
  specificSurfaceAreaM2g?: number; // m^2 / g
  coherencePlanesN?: number; // N = D / d_hkl
  coherenceVolumeNm3?: number; // nm^3
  microstrainDeKeijser?: number; // microstrain extracted via Voigt method
  lorentzianSizeNm?: number;
  gaussianStrainRms?: number;
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
  thirdMomentRad3?: number;  // 3rd central moment mu_3(sigma) in rad^3
  fourthMomentRad4?: number; // 4th moment mu_4(sigma) in rad^4
  skewness?: number;      // Skewness gamma_1 = mu_3 / W^(3/2)
  kurtosis?: number;      // Kurtosis K = mu_4 / W^2
  excessKurtosis?: number;// Excess kurtosis gamma_2 = K - 3
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
  meanSkewness?: number;      // Average skewness
  rSquared: number;           // Regression R^2 for W(sigma) = W0 + K1*sigma + K2*sigma^2
  areaWeightedSizeNm?: number;// Area-weighted column length <L>_A (~ D_V / 2 for Cauchy)
  dislocationDensity?: number;// Dislocation density rho = (2*sqrt(3)*rmsStrain) / (D_V * b) in m^-2
  burgersVectorNm?: number;   // Burgers vector (default 0.25 nm)
  qualityScore?: number;      // 0-100 composite regression quality index
  points: MomentDataPoint[];  // Range-variance data points
  fittedPoints: {
    sigmaDeg: number;
    sigmaRad: number;
    fittedWDeg2: number;
    fittedWRad2: number;
    linearComponentDeg2: number;
    quadraticComponentDeg2: number;
    residualDeg2?: number;
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
  x: number; // 4 * sin(theta) or model-dependent X
  y: number; // beta * cos(theta) or model-dependent Y
  twoTheta: number;
  hkl?: [number, number, number];
  isExcluded?: boolean;
  residual?: number;
  apparentSizeNm?: number;
  contrastFactorC?: number;
}

export interface WHModelComparisonItem {
  modelName: 'UDM' | 'USDM' | 'UDEDM' | 'SSP' | 'Halder-Wagner' | 'mWH' | 'Stephens';
  label: string;
  sizeNm: number;
  strainPercent: number;
  stressMPa?: number;
  energyDensityKjM3?: number;
  rSquared: number;
  slope: number;
  intercept: number;
  description: string;
}

export interface WHResult {
  strainPercent: number;
  sizeInterceptNm: number;
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
    adjustedRSquared?: number;
    pearsonR?: number;
    stdErrorSlope?: number;
    stdErrorIntercept?: number;
    rmse?: number;
    durbinWatson?: number;
    fStatistic?: number;
  };
  stephensParams?: {
    S400: number;
    S220: number;
  };
  dislocationDensityM2?: number;
  dislocationDensity10_14?: number;
  specificSurfaceAreaM2g?: number;
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
    dSpacing?: number;
    qVector?: number;
    residual?: number;
    hkl?: [number, number, number];
    isExcluded?: boolean;
    contrastFactorC?: number;
    dislocationDensity10_14?: number;
  }[];
  modelComparisons?: WHModelComparisonItem[];
  separationMethodUsed?: string;
  broadeningModelUsed?: string;
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
  fwhmObs?: number;
  pseudoVoigtEta?: number;
  lorentzianSizeNm?: number;
  gaussianStrainRms?: number;
  dislocationDensityM2?: number;
  dislocationDensity10_14?: number;
  specificSurfaceAreaM2g?: number;
  coherencePlanesN?: number;
  coherenceVolumeNm3?: number;
  dSpacing?: number;
  qVector?: number;
}

export interface IBAdvancedInput {
  twoTheta: number;
  area: number;
  iMax: number;
  fwhm?: number;
  hkl?: [number, number, number];
}

export interface IBAdvancedResult {
  strainPercent: number;
  sizeInterceptNm: number;
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
    adjustedRSquared?: number;
    pearsonR?: number;
    stdErrorSlope?: number;
    stdErrorIntercept?: number;
  };
  points: { x: number; y: number; twoTheta: number; betaSample: number; residual?: number }[];
  stressMPa?: number;
  energyDensityKjM3?: number;
  separationMethodUsed?: string;
  decouplingMethodUsed?: string;
  pointsExtended?: {
    twoTheta: number;
    betaObsDeg: number;
    betaInstDeg: number;
    betaSampleDeg: number;
    x: number;
    y: number;
    singlePeakSizeNm: number;
    dSpacing?: number;
    residual?: number;
    hkl?: [number, number, number];
    dislocationDensity10_14?: number;
    specificSurfaceAreaM2g?: number;
  }[];
}

export interface WAInputPoint {
  L_nm: number;
  A1: number;
  A2: number;
  A3?: number;
  A4?: number;
}

export interface WAColumnDistributionPoint {
  L_nm: number;
  A_size: number;
  Pv_L: number; // P_V(L) = L * d²A_S/dL² (Volume-weighted column length distribution)
  dAs_dL?: number; // First derivative
  A_size_raw?: number; // Pre-hook correction value
}

export interface WAOrderPlotLine {
  L_nm: number;
  points: { s2: number; lnA: number; orderIndex: number; label: string }[];
  slope: number;
  intercept: number;
  r2: number;
  rms_strain: number;
  A_size: number;
}

export interface WAMetrics {
  areaWeightedColumnLengthNm: number; // <D>_A = -1 / (dA_S/dL)|_{L->0}
  volumeWeightedColumnLengthNm: number; // <D>_V = 2 ∫ A_S(L) dL
  crystalliteSizeDistributionModeNm: number; // Peak of P_V(L)
  crystalliteSizeDistributionFWHMNm: number;
  initialSlope: number; // dA_S/dL at L=0
  dislocationDensityM2: number; // ρ (m^-2)
  dislocationDensity10_14: number; // ρ (10^14 m^-2)
  wilkensCutoffRadiusNm: number; // Re (nm)
  wilkensArrangementParameterM: number; // M = Re * sqrt(rho)
  wilkensDislocationCharacter?: 'edge' | 'screw' | 'mixed';
  apparentStrainEnergyKJm3: number; // W_H
  specificSurfaceAreaM2g?: number; // S_V
  hookEffectDetected: boolean;
  hookEffectExtrapolatedIntercept: number;
  r2_average: number;
}

export interface WAResult {
  sizeDistribution: WAColumnDistributionPoint[];
  strainDistribution: { 
    L_nm: number; 
    rms_strain: number; 
    ms_strain?: number; // <ε²>
    wilkensLnTerm?: number;
  }[];
  orderPlots?: WAOrderPlotLine[];
  metrics?: WAMetrics;
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

export interface CustomPeak {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  center: number;
  fwhm: number;
  amplitude: number;
  shape: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt' | 'Pearson VII' | 'Split-Pseudo-Voigt';
  eta: number; // For Pseudo-Voigt (0-1) or Pearson VII exponent m
  asymmetry: number;
  phase?: string;
  hkl?: [number, number, number];
  lockedCenter?: boolean;
  lockedFwhm?: boolean;
  lockedAmplitude?: boolean;
  lockedEta?: boolean;
  isDoubletChild?: boolean;
  doubletParentId?: string;
}

export interface CustomPeakMetrics {
  peak: CustomPeak;
  dSpacing: number; // Å
  area: number; // cps·deg
  areaPercent: number; // % of total sum
  integralBreadth: number; // deg
  crystalliteSizeNm: number; // nm (Scherrer)
  microstrainPercent: number; // %
  theta1: number; // deg (half-max left)
  theta2: number; // deg (half-max right)
  maxIntensity: number; // cps
  relIntensityPercent: number; // % of dominant peak
  hwhmLeft?: number;
  hwhmRight?: number;
  phase?: string;
  gaussianSigma?: number;
  lorentzianGamma?: number;
  voigtPhi?: number;
}
