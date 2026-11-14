/**
 * X-Ray Reflectometry (XRR) Physics & Parratt Recursion Engine (v2.0 Pro)
 * 
 * Comprehensive thin film specular reflectivity modeling, Parratt recursive matrix formalism,
 * Névot-Croce and Debye-Waller roughness corrections, Sinha DWBA diffuse scattering options,
 * Scattering Length Density (SLD) real-space depth profiling, Modified Bragg refraction-corrected
 * Kiessig fringe analysis, Fast Fourier Transform (FFT) spatial frequency thickness extraction,
 * atomic scattering factor dispersion & absorption calculations from chemical formulas,
 * and multi-framework simulation export (Refnx, GenX, BornAgain, SciPy).
 */

// ----------------------------------------------------------------------------
// Core Interfaces & Types
// ----------------------------------------------------------------------------

export interface XRRLayer {
  id: string;
  name: string;
  formula?: string;
  material?: string;             // Chemical formula (e.g. 'TiO2', 'Al2O3', 'SrTiO3')
  thickness: number;            // in Angstroms (Å) - 0 for substrate/ambient
  roughness: number;            // RMS interface roughness σ in Angstroms (Å)
  density: number;              // Mass density in g/cm³
  delta: number;                // Real part of refractive index dispersion (× 10⁻⁶)
  beta: number;                 // Imaginary part of refractive index absorption (× 10⁻⁷)
  electronDensity?: number;     // Electron density ρe in e⁻/Å³
  gradingThickness?: number;    // Interdiffusion / graded interface thickness (Å)
  gradientType?: 'none' | 'linear' | 'exponential' | 'sigmoidal' | 'tanh'; // Continuous density profile
  gradientDeltaDensity?: number;// Δρ shift across layer thickness (g/cm³)
  color?: string;
  // Parameter constraints for Non-Linear Fitting
  lockedThickness?: boolean;
  lockedRoughness?: boolean;
  lockedDensity?: boolean;
  minThickness?: number;
  maxThickness?: number;
  minRoughness?: number;
  maxRoughness?: number;
  minDensity?: number;
  maxDensity?: number;
}

export interface XRRMaterialPreset {
  name: string;
  formula?: string;
  material?: string;
  density: number;              // g/cm³
  delta: number;                // × 10⁻⁶ (at Cu K-alpha = 1.54056 Å)
  beta: number;                 // × 10⁻⁷
  atomicZ?: number;
  molarMass?: number;
  electronDensity?: number;     // e⁻/Å³
  criticalAngleDeg?: number;    // θc at Cu K-alpha
  category: 'Substrates' | 'Oxides & High-k' | 'Metals & Caps' | '2D & Quantum Materials' | 'Superconductors & Magnetic' | 'Semiconductors' | 'Battery & Solid Electrolytes' | 'Nitrides & Carbides' | 'Organics & Perovskites' | 'Synthesis / Custom' | string;
  color: string;
  isCustom?: boolean;
  notes?: string;
}

export interface RadiationSourceInfo {
  id: string;
  name: string;
  wavelength: number;           // in Å
  energyKeV: number;            // in keV
  anodeTarget: string;
  description: string;
}

export interface XRRSimulationConfig {
  wavelength: number;           // X-ray wavelength in Å (default 1.54056 Å Cu K-alpha1)
  radiationSource?: 'cu-ka1' | 'cu-ka2' | 'cu-ka' | 'mo-ka1' | 'co-ka1' | 'cr-ka1' | 'ag-ka1' | 'fe-ka1' | 'synchrotron';
  synchrotronEnergyKeV?: number;// Synchrotron X-ray energy in keV (1.0 to 50.0 keV)
  angleStart: number;           // Incident angle θ start (deg)
  angleEnd: number;             // Incident angle θ end (deg)
  angleStep: number;            // Angle step size (deg)
  angleUnit: 'theta' | 'twoTheta' | 'qz'; // Display x-axis unit
  beamDivergence: number;       // Angular resolution FWHM in degrees
  background: number;           // Noise floor background intensity
  roughnessModel?: 'nevot-croce' | 'debye-waller' | 'sinha-dwba'; // Roughness attenuation damping equation
  roughnessCorrelationLength?: number; // Lateral correlation length ξ (Å) for Sinha model
  hurstParameter?: number;      // Hurst fractal roughness parameter H (0.1 to 1.0)
  intensityScale?: number;      // Experimental intensity multiplier scale factor
  angleOffset?: number;         // Angular zero-point error correction (° θ)
  footprintCorrection?: boolean;// Enable beam footprint spillover correction at low angles
  sampleLengthMm?: number;      // Sample length in mm (default 20 mm)
  beamWidthMm?: number;         // X-ray beam height/width in mm (default 0.2 mm)
}

export interface XRRDataPoint {
  theta: number;                // Incident angle θ in degrees
  twoTheta: number;             // Scattering angle 2θ in degrees
  qz: number;                   // Scattering vector qz = (4π/λ)sinθ in Å⁻¹
  rCalc: number;                // Calculated specular reflectivity R (0 to 1)
  rCalcCompensated?: number;    // Fresnel-compensated R * qz^4
  rCalcMin?: number;            // Monte Carlo 95% lower confidence bound
  rCalcMax?: number;            // Monte Carlo 95% upper confidence bound
  rExp?: number;                // Experimental reflectivity (if imported)
  rExpCompensated?: number;     // Experimental R * qz^4
  fresnelR?: number;            // Ideal Fresnel reflectivity for single substrate
  footprintFactor?: number;     // Beam footprint spillover factor (0 to 1)
  diffuseR?: number;            // Sinha DWBA diffuse background component
}

export interface SLDPoint {
  z: number;                    // Depth in Angstroms (0 = ambient top surface)
  density: number;              // Mass density in g/cm³
  delta: number;                // Dispersion delta (× 10⁻⁶)
  beta: number;                 // Absorption beta (× 10⁻⁷)
  sldReal: number;              // Real Scattering Length Density Re(SLD) = 2π·δ/λ² (10⁻⁶ Å⁻²)
  sldImag: number;              // Imaginary Scattering Length Density Im(SLD) = 2π·β/λ² (10⁻⁶ Å⁻²)
  electronDensity: number;      // Electron density ρ_e = Re(SLD)/r_e (e⁻/Å³)
  opticalPotential: number;     // Fermi optical potential V₀(z) = 2·E·δ (eV)
  layerName: string;
  porosity?: number;            // Estimated porosity / void percentage (%)
}

export interface KiessigAnalysisResult {
  periodQz: number;             // Kiessig fringe period Δqz in Å⁻¹
  periodTheta: number;          // Kiessig fringe period Δθ in degrees
  estimatedThickness: number;   // Extracted total film thickness in Å (d = 2π / Δqz)
  peaks: { qz: number; theta: number; r: number; order?: number }[];
  valleys: { qz: number; theta: number; r: number }[];
  refractionFit?: {
    dBragg: number;             // Refraction-corrected thickness in Å
    thetaCritDeg: number;       // Extracted critical angle θc in degrees
    deltaEff: number;           // Effective refractive index delta (× 10⁻⁶)
    densityEff: number;         // Extracted effective surface density (g/cm³)
    rSquared: number;           // Linear regression R² coefficient
    fitPoints: {
      order: number;            // m
      m2: number;               // m²
      thetaDeg: number;         // θ_m (deg)
      sin2Theta: number;        // sin²(θ_m)
      fittedSin2Theta: number;  // Fitted line
    }[];
  };
}

export interface FFTThicknessResult {
  spatialFrequencies: {
    thicknessA: number;         // Real-space film thickness z (Å)
    amplitude: number;          // FFT Fourier amplitude |F(z)|
    normalizedAmp: number;      // 0 to 100% normalized power spectrum
  }[];
  detectedPeaks: {
    thicknessA: number;         // Detected thickness peak in Å
    thicknessNm: number;        // Detected thickness in nm
    amplitude: number;
    snr: number;                // Signal-to-Noise Ratio
    fwhm: number;               // Peak width (Å)
    label: string;              // Suggested layer assignment
  }[];
  maxThickness: number;
}

export interface CriticalAngleResult {
  thetaCritDeg: number;         // Critical angle θc in degrees
  qzCrit: number;               // Critical momentum transfer qc in Å⁻¹
  deltaEst: number;             // Estimated refractive index dispersion δ (× 10⁻⁶)
  densityEst: number;           // Estimated surface/substrate mass density (g/cm³)
  electronDensityEst: number;   // Estimated electron density (e⁻/Å³)
}

export interface FitQualityResult {
  logRmse: number;              // Root-Mean-Square Error on log10(R) scale
  rwp: number;                  // Weighted profile R-factor Rwp (%)
  chiSquare: number;            // Reduced Chi-squared goodness of fit
  rSquared: number;             // Coefficient of determination R² on log scale
  numPoints: number;            // Number of evaluated data points
}

export interface SuperlatticePeak {
  order: number;                // Satellite peak order m (±1, ±2, ±3...)
  thetaDeg: number;             // Calculated Bragg angle θ in degrees
  twoThetaDeg: number;          // Calculated 2θ in degrees
  qz: number;                   // Momentum transfer qz in Å⁻¹
  label: string;                // Peak tag (e.g. SL-1, SL-2)
}

export interface FormulaOpticalResult {
  formula: string;
  molarMass: number;            // g/mol
  density: number;              // g/cm³
  delta: number;                // × 10⁻⁶ at specified wavelength
  beta: number;                 // × 10⁻⁷ at specified wavelength
  electronDensity: number;      // e⁻/Å³
  criticalAngleDeg: number;     // θc (deg)
  absorptionLengthUm: number;   // 1/e X-ray penetration depth (μm)
  elements: {
    element: string;
    count: number;
    atomicZ: number;
    atomicMass: number;
    f1: number;
    f2: number;
  }[];
}

// ----------------------------------------------------------------------------
// Radiation Sources Master Catalog
// ----------------------------------------------------------------------------

export const RADIATION_SOURCES: Record<string, RadiationSourceInfo> = {
  'cu-ka1': {
    id: 'cu-ka1',
    name: 'Cu Kα₁ (Standard Laboratory)',
    wavelength: 1.54056,
    energyKeV: 8.048,
    anodeTarget: 'Copper (Cu)',
    description: 'High-resolution monochromated Cu Kα₁ emission line.'
  },
  'cu-ka2': {
    id: 'cu-ka2',
    name: 'Cu Kα₂',
    wavelength: 1.54439,
    energyKeV: 8.028,
    anodeTarget: 'Copper (Cu)',
    description: 'Secondary copper doublet emission component.'
  },
  'cu-ka': {
    id: 'cu-ka',
    name: 'Cu Kα (Weighted 2:1 Doublet)',
    wavelength: 1.54184,
    energyKeV: 8.041,
    anodeTarget: 'Copper (Cu)',
    description: 'Standard unfiltered laboratory X-ray tube average.'
  },
  'mo-ka1': {
    id: 'mo-ka1',
    name: 'Mo Kα₁ (Hard X-Ray / High Q)',
    wavelength: 0.70930,
    energyKeV: 17.479,
    anodeTarget: 'Molybdenum (Mo)',
    description: 'Short wavelength hard X-ray source for thick films and extended Q-range.'
  },
  'co-ka1': {
    id: 'co-ka1',
    name: 'Co Kα₁ (Magnetic / Fe-rich Films)',
    wavelength: 1.78897,
    energyKeV: 6.930,
    anodeTarget: 'Cobalt (Co)',
    description: 'Ideal for iron-containing samples to suppress Fe fluorescence background.'
  },
  'cr-ka1': {
    id: 'cr-ka1',
    name: 'Cr Kα₁ (Long Wavelength)',
    wavelength: 2.28970,
    energyKeV: 5.415,
    anodeTarget: 'Chromium (Cr)',
    description: 'Longer wavelength for large fringe period resolution in ultrathin films.'
  },
  'ag-ka1': {
    id: 'ag-ka1',
    name: 'Ag Kα₁ (Ultra-Hard X-Ray)',
    wavelength: 0.55941,
    energyKeV: 22.163,
    anodeTarget: 'Silver (Ag)',
    description: 'Deep penetration X-ray beam for buried interfaces and thick multilayers.'
  },
  'fe-ka1': {
    id: 'fe-ka1',
    name: 'Fe Kα₁',
    wavelength: 1.93604,
    energyKeV: 6.404,
    anodeTarget: 'Iron (Fe)',
    description: 'Specialized low-energy soft characteristic emission.'
  },
  'synchrotron': {
    id: 'synchrotron',
    name: 'Synchrotron Radiation (Tunable Beamline)',
    wavelength: 1.54056,
    energyKeV: 8.048,
    anodeTarget: 'Undulator / Wiggler',
    description: 'Monochromatic, highly collimated synchrotron beam with tunable photon energy.'
  }
};

export function energyKeVToWavelength(energyKeV: number): number {
  if (!energyKeV || energyKeV <= 0) return 1.54056;
  // CODATA 2018: hc = 12.398419843320026 keV·Å
  return Number((12.39841984332 / energyKeV).toFixed(5));
}

export function wavelengthToEnergyKeV(wavelength: number): number {
  if (!wavelength || wavelength <= 0) return 8.0478;
  return Number((12.39841984332 / wavelength).toFixed(4));
}

// ----------------------------------------------------------------------------
// Comprehensive Periodic Table & Atomic Scattering Database (Henke / CXRO)
// ----------------------------------------------------------------------------

interface AtomicData {
  name: string;
  atomicZ: number;
  atomicMass: number;
  densityBulk: number;
  f1_Cu: number;
  f2_Cu: number;
  f1_Mo: number;
  f2_Mo: number;
}

export const ATOMIC_DATABASE: Record<string, AtomicData> = {
  H:  { name: 'Hydrogen', atomicZ: 1, atomicMass: 1.008, densityBulk: 0.07, f1_Cu: 1.00, f2_Cu: 0.0001, f1_Mo: 1.00, f2_Mo: 0.0000 },
  He: { name: 'Helium', atomicZ: 2, atomicMass: 4.0026, densityBulk: 0.12, f1_Cu: 2.00, f2_Cu: 0.0002, f1_Mo: 2.00, f2_Mo: 0.0001 },
  Li: { name: 'Lithium', atomicZ: 3, atomicMass: 6.94, densityBulk: 0.534, f1_Cu: 3.00, f2_Cu: 0.0010, f1_Mo: 3.00, f2_Mo: 0.0003 },
  Be: { name: 'Beryllium', atomicZ: 4, atomicMass: 9.0122, densityBulk: 1.85, f1_Cu: 4.01, f2_Cu: 0.0032, f1_Mo: 4.00, f2_Mo: 0.0009 },
  B:  { name: 'Boron', atomicZ: 5, atomicMass: 10.81, densityBulk: 2.34, f1_Cu: 5.02, f2_Cu: 0.0090, f1_Mo: 5.01, f2_Mo: 0.0022 },
  C:  { name: 'Carbon', atomicZ: 6, atomicMass: 12.011, densityBulk: 2.26, f1_Cu: 6.04, f2_Cu: 0.0150, f1_Mo: 6.01, f2_Mo: 0.0035 },
  N:  { name: 'Nitrogen', atomicZ: 7, atomicMass: 14.007, densityBulk: 1.03, f1_Cu: 7.07, f2_Cu: 0.0310, f1_Mo: 7.02, f2_Mo: 0.0075 },
  O:  { name: 'Oxygen', atomicZ: 8, atomicMass: 15.999, densityBulk: 1.14, f1_Cu: 8.11, f2_Cu: 0.0550, f1_Mo: 8.04, f2_Mo: 0.0130 },
  F:  { name: 'Fluorine', atomicZ: 9, atomicMass: 18.998, densityBulk: 1.50, f1_Cu: 9.17, f2_Cu: 0.0950, f1_Mo: 9.06, f2_Mo: 0.0210 },
  Ne: { name: 'Neon', atomicZ: 10, atomicMass: 20.180, densityBulk: 1.20, f1_Cu: 10.23, f2_Cu: 0.1500, f1_Mo: 10.09, f2_Mo: 0.0340 },
  Na: { name: 'Sodium', atomicZ: 11, atomicMass: 22.990, densityBulk: 0.968, f1_Cu: 11.30, f2_Cu: 0.2300, f1_Mo: 11.13, f2_Mo: 0.0520 },
  Mg: { name: 'Magnesium', atomicZ: 12, atomicMass: 24.305, densityBulk: 1.738, f1_Cu: 12.39, f2_Cu: 0.3300, f1_Mo: 12.18, f2_Mo: 0.0750 },
  Al: { name: 'Aluminum', atomicZ: 13, atomicMass: 26.982, densityBulk: 2.70, f1_Cu: 13.50, f2_Cu: 0.4600, f1_Mo: 13.24, f2_Mo: 0.1040 },
  Si: { name: 'Silicon', atomicZ: 14, atomicMass: 28.085, densityBulk: 2.33, f1_Cu: 14.28, f2_Cu: 0.3300, f1_Mo: 14.06, f2_Mo: 0.0700 },
  P:  { name: 'Phosphorus', atomicZ: 15, atomicMass: 30.974, densityBulk: 1.82, f1_Cu: 15.77, f2_Cu: 0.8100, f1_Mo: 15.38, f2_Mo: 0.1850 },
  S:  { name: 'Sulfur', atomicZ: 16, atomicMass: 32.06, densityBulk: 2.07, f1_Cu: 16.92, f2_Cu: 1.0500, f1_Mo: 16.48, f2_Mo: 0.2400 },
  Cl: { name: 'Chlorine', atomicZ: 17, atomicMass: 35.45, densityBulk: 1.56, f1_Cu: 18.09, f2_Cu: 1.3400, f1_Mo: 17.58, f2_Mo: 0.3100 },
  Ar: { name: 'Argon', atomicZ: 18, atomicMass: 39.948, densityBulk: 1.40, f1_Cu: 19.28, f2_Cu: 1.6900, f1_Mo: 18.70, f2_Mo: 0.3900 },
  K:  { name: 'Potassium', atomicZ: 19, atomicMass: 39.098, densityBulk: 0.862, f1_Cu: 20.48, f2_Cu: 2.1000, f1_Mo: 19.84, f2_Mo: 0.4900 },
  Ca: { name: 'Calcium', atomicZ: 20, atomicMass: 40.078, densityBulk: 1.55, f1_Cu: 21.68, f2_Cu: 2.5800, f1_Mo: 20.98, f2_Mo: 0.6000 },
  Sc: { name: 'Scandium', atomicZ: 21, atomicMass: 44.956, densityBulk: 2.985, f1_Cu: 22.90, f2_Cu: 3.1200, f1_Mo: 22.14, f2_Mo: 0.7300 },
  Ti: { name: 'Titanium', atomicZ: 22, atomicMass: 47.867, densityBulk: 4.506, f1_Cu: 22.21, f2_Cu: 1.8100, f1_Mo: 22.25, f2_Mo: 0.5050 },
  V:  { name: 'Vanadium', atomicZ: 23, atomicMass: 50.942, densityBulk: 6.11, f1_Cu: 23.35, f2_Cu: 2.1800, f1_Mo: 23.31, f2_Mo: 0.6000 },
  Cr: { name: 'Chromium', atomicZ: 24, atomicMass: 51.996, densityBulk: 7.19, f1_Cu: 24.47, f2_Cu: 2.5700, f1_Mo: 24.36, f2_Mo: 0.7100 },
  Mn: { name: 'Manganese', atomicZ: 25, atomicMass: 54.938, densityBulk: 7.21, f1_Cu: 25.49, f2_Cu: 3.0100, f1_Mo: 25.41, f2_Mo: 0.8300 },
  Fe: { name: 'Iron', atomicZ: 26, atomicMass: 55.845, densityBulk: 7.874, f1_Cu: 24.85, f2_Cu: 3.2000, f1_Mo: 26.46, f2_Mo: 0.9600 },
  Co: { name: 'Cobalt', atomicZ: 27, atomicMass: 58.933, densityBulk: 8.90, f1_Cu: 24.64, f2_Cu: 3.6100, f1_Mo: 27.50, f2_Mo: 1.1100 },
  Ni: { name: 'Nickel', atomicZ: 28, atomicMass: 58.693, densityBulk: 8.908, f1_Cu: 25.02, f2_Cu: 0.5100, f1_Mo: 28.53, f2_Mo: 1.2700 },
  Cu: { name: 'Copper', atomicZ: 29, atomicMass: 63.546, densityBulk: 8.96, f1_Cu: 26.95, f2_Cu: 0.5900, f1_Mo: 29.55, f2_Mo: 1.4500 },
  Zn: { name: 'Zinc', atomicZ: 30, atomicMass: 65.38, densityBulk: 7.14, f1_Cu: 28.39, f2_Cu: 0.6800, f1_Mo: 30.56, f2_Mo: 1.6500 },
  Ga: { name: 'Gallium', atomicZ: 31, atomicMass: 69.723, densityBulk: 5.91, f1_Cu: 29.68, f2_Cu: 0.7900, f1_Mo: 31.55, f2_Mo: 1.8700 },
  Ge: { name: 'Germanium', atomicZ: 32, atomicMass: 72.630, densityBulk: 5.323, f1_Cu: 30.89, f2_Cu: 0.9000, f1_Mo: 32.51, f2_Mo: 2.1100 },
  As: { name: 'Arsenic', atomicZ: 33, atomicMass: 74.922, densityBulk: 5.776, f1_Cu: 32.07, f2_Cu: 1.0300, f1_Mo: 33.43, f2_Mo: 2.3700 },
  Se: { name: 'Selenium', atomicZ: 34, atomicMass: 78.971, densityBulk: 4.819, f1_Cu: 33.22, f2_Cu: 1.1600, f1_Mo: 34.30, f2_Mo: 2.6600 },
  Br: { name: 'Bromine', atomicZ: 35, atomicMass: 79.904, densityBulk: 3.12, f1_Cu: 34.35, f2_Cu: 1.3100, f1_Mo: 35.10, f2_Mo: 2.9700 },
  Sr: { name: 'Strontium', atomicZ: 38, atomicMass: 87.62, densityBulk: 2.64, f1_Cu: 37.65, f2_Cu: 1.8400, f1_Mo: 36.60, f2_Mo: 4.0500 },
  Y:  { name: 'Yttrium', atomicZ: 39, atomicMass: 88.906, densityBulk: 4.472, f1_Cu: 38.74, f2_Cu: 2.0500, f1_Mo: 36.25, f2_Mo: 4.4600 },
  Zr: { name: 'Zirconium', atomicZ: 40, atomicMass: 91.224, densityBulk: 6.52, f1_Cu: 39.81, f2_Cu: 2.2800, f1_Mo: 37.05, f2_Mo: 0.5600 },
  Nb: { name: 'Niobium', atomicZ: 41, atomicMass: 92.906, densityBulk: 8.57, f1_Cu: 40.88, f2_Cu: 2.5300, f1_Mo: 39.15, f2_Mo: 0.6300 },
  Mo: { name: 'Molybdenum', atomicZ: 42, atomicMass: 95.95, densityBulk: 10.28, f1_Cu: 41.94, f2_Cu: 2.8000, f1_Mo: 40.35, f2_Mo: 0.7000 },
  Ru: { name: 'Ruthenium', atomicZ: 44, atomicMass: 101.07, densityBulk: 12.45, f1_Cu: 44.04, f2_Cu: 3.4000, f1_Mo: 42.60, f2_Mo: 0.8700 },
  Rh: { name: 'Rhodium', atomicZ: 45, atomicMass: 102.91, densityBulk: 12.41, f1_Cu: 45.09, f2_Cu: 3.7400, f1_Mo: 43.68, f2_Mo: 0.9600 },
  Pd: { name: 'Palladium', atomicZ: 46, atomicMass: 106.42, densityBulk: 12.023, f1_Cu: 46.13, f2_Cu: 4.1000, f1_Mo: 44.75, f2_Mo: 1.0700 },
  Ag: { name: 'Silver', atomicZ: 47, atomicMass: 107.87, densityBulk: 10.49, f1_Cu: 47.17, f2_Cu: 4.4900, f1_Mo: 45.80, f2_Mo: 1.1800 },
  In: { name: 'Indium', atomicZ: 49, atomicMass: 114.82, densityBulk: 7.31, f1_Cu: 49.23, f2_Cu: 5.3600, f1_Mo: 47.90, f2_Mo: 1.4300 },
  Sn: { name: 'Tin', atomicZ: 50, atomicMass: 118.71, densityBulk: 7.31, f1_Cu: 50.26, f2_Cu: 5.8400, f1_Mo: 48.94, f2_Mo: 1.5700 },
  Sb: { name: 'Antimony', atomicZ: 51, atomicMass: 121.76, densityBulk: 6.697, f1_Cu: 51.28, f2_Cu: 6.3600, f1_Mo: 49.97, f2_Mo: 1.7200 },
  Te: { name: 'Tellurium', atomicZ: 52, atomicMass: 127.60, densityBulk: 6.24, f1_Cu: 52.29, f2_Cu: 6.9200, f1_Mo: 51.00, f2_Mo: 1.8800 },
  I:  { name: 'Iodine', atomicZ: 53, atomicMass: 126.90, densityBulk: 4.933, f1_Cu: 53.30, f2_Cu: 7.5200, f1_Mo: 52.02, f2_Mo: 2.0600 },
  Cs: { name: 'Cesium', atomicZ: 55, atomicMass: 132.91, densityBulk: 1.93, f1_Cu: 55.28, f2_Cu: 8.8400, f1_Mo: 54.05, f2_Mo: 2.4500 },
  Ba: { name: 'Barium', atomicZ: 56, atomicMass: 137.33, densityBulk: 3.51, f1_Cu: 56.25, f2_Cu: 9.5700, f1_Mo: 55.06, f2_Mo: 2.6700 },
  La: { name: 'Lanthanum', atomicZ: 57, atomicMass: 138.91, densityBulk: 6.162, f1_Cu: 57.20, f2_Cu: 10.35, f1_Mo: 56.07, f2_Mo: 2.9000 },
  Ce: { name: 'Cerium', atomicZ: 58, atomicMass: 140.12, densityBulk: 6.77, f1_Cu: 58.12, f2_Cu: 11.18, f1_Mo: 57.07, f2_Mo: 3.1500 },
  Nd: { name: 'Neodymium', atomicZ: 60, atomicMass: 144.24, densityBulk: 7.01, f1_Cu: 59.88, f2_Cu: 13.00, f1_Mo: 59.06, f2_Mo: 3.7000 },
  Gd: { name: 'Gadolinium', atomicZ: 64, atomicMass: 157.25, densityBulk: 7.90, f1_Cu: 62.60, f2_Cu: 12.10, f1_Mo: 63.00, f2_Mo: 5.0200 },
  Hf: { name: 'Hafnium', atomicZ: 72, atomicMass: 178.49, densityBulk: 13.31, f1_Cu: 67.35, f2_Cu: 6.1000, f1_Mo: 70.65, f2_Mo: 8.6500 },
  Ta: { name: 'Tantalum', atomicZ: 73, atomicMass: 180.95, densityBulk: 16.69, f1_Cu: 68.50, f2_Cu: 6.6000, f1_Mo: 71.55, f2_Mo: 9.2000 },
  W:  { name: 'Tungsten', atomicZ: 74, atomicMass: 183.84, densityBulk: 19.25, f1_Cu: 69.65, f2_Cu: 7.1500, f1_Mo: 72.45, f2_Mo: 9.8000 },
  Re: { name: 'Rhenium', atomicZ: 75, atomicMass: 186.21, densityBulk: 21.02, f1_Cu: 70.80, f2_Cu: 7.7200, f1_Mo: 73.32, f2_Mo: 10.42 },
  Os: { name: 'Osmium', atomicZ: 76, atomicMass: 190.23, densityBulk: 22.59, f1_Cu: 71.95, f2_Cu: 8.3200, f1_Mo: 74.16, f2_Mo: 11.08 },
  Ir: { name: 'Iridium', atomicZ: 77, atomicMass: 192.22, densityBulk: 22.56, f1_Cu: 73.10, f2_Cu: 8.9500, f1_Mo: 74.98, f2_Mo: 11.78 },
  Pt: { name: 'Platinum', atomicZ: 78, atomicMass: 195.08, densityBulk: 21.45, f1_Cu: 74.22, f2_Cu: 9.6200, f1_Mo: 75.76, f2_Mo: 12.50 },
  Au: { name: 'Gold', atomicZ: 79, atomicMass: 196.97, densityBulk: 19.30, f1_Cu: 75.32, f2_Cu: 10.32, f1_Mo: 76.50, f2_Mo: 13.26 },
  Pb: { name: 'Lead', atomicZ: 82, atomicMass: 207.2, densityBulk: 11.34, f1_Cu: 78.55, f2_Cu: 12.60, f1_Mo: 78.40, f2_Mo: 15.80 },
  Bi: { name: 'Bismuth', atomicZ: 83, atomicMass: 208.98, densityBulk: 9.78, f1_Cu: 79.60, f2_Cu: 13.45, f1_Mo: 78.90, f2_Mo: 16.70 },
  Th: { name: 'Thorium', atomicZ: 90, atomicMass: 232.04, densityBulk: 11.72, f1_Cu: 86.80, f2_Cu: 20.50, f1_Mo: 82.50, f2_Mo: 8.2000 },
  U:  { name: 'Uranium', atomicZ: 92, atomicMass: 238.03, densityBulk: 19.10, f1_Cu: 88.80, f2_Cu: 23.00, f1_Mo: 84.10, f2_Mo: 9.4000 },
};

export function parseChemicalFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!formula || typeof formula !== 'string') return result;

  const cleaned = formula.trim().replace(/\s+/g, '');
  const regex = /([A-Z][a-z]?)([\d.]*)/g;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    if (!match[1]) continue;
    const elem = match[1];
    const countStr = match[2];
    const count = countStr && countStr.length > 0 ? parseFloat(countStr) : 1.0;
    result[elem] = (result[elem] || 0) + (isNaN(count) ? 1.0 : count);
  }

  return result;
}

export function calculateOpticalConstantsFromFormula(
  formula: string,
  density?: number,
  wavelength: number = 1.54056
): FormulaOpticalResult | null {
  const elementsParsed = parseChemicalFormula(formula);
  const elementKeys = Object.keys(elementsParsed);
  if (elementKeys.length === 0) return null;

  let totalMolarMass = 0;
  let totalZ = 0;
  let totalF1 = 0;
  let totalF2 = 0;
  const elementDetails: FormulaOpticalResult['elements'] = [];

  // Continuous wavelength interpolation factor between Mo Kα1 (0.70930 Å) and Cu Kα1 (1.54056 Å)
  const wAlpha = Math.max(0, Math.min(1.4, (wavelength - 0.70930) / (1.54056 - 0.70930)));

  for (const elem of elementKeys) {
    const count = elementsParsed[elem];
    const data = ATOMIC_DATABASE[elem];
    const atomicMass = data ? data.atomicMass : 25.0;
    const atomicZ = data ? data.atomicZ : 12;

    const f1 = data
      ? Number((data.f1_Mo + wAlpha * (data.f1_Cu - data.f1_Mo)).toFixed(3))
      : atomicZ;
    const f2 = data
      ? Number(Math.max(0.0001, data.f2_Mo + wAlpha * (data.f2_Cu - data.f2_Mo)).toFixed(4))
      : 0.25;

    totalMolarMass += count * atomicMass;
    totalZ += count * atomicZ;
    totalF1 += count * f1;
    totalF2 += count * f2;

    elementDetails.push({
      element: elem,
      count,
      atomicZ,
      atomicMass,
      f1,
      f2
    });
  }

  let massDensity = density;
  if (!massDensity || massDensity <= 0) {
    let sumWeight = 0;
    let sumDens = 0;
    for (const elem of elementKeys) {
      const data = ATOMIC_DATABASE[elem];
      if (data && data.densityBulk > 0) {
        const massFraction = (elementsParsed[elem] * data.atomicMass) / totalMolarMass;
        sumDens += data.densityBulk * massFraction;
        sumWeight += massFraction;
      }
    }
    massDensity = sumWeight > 0 ? sumDens / sumWeight : 3.5;
  }

  // CODATA 2018 Fundamental Constants:
  // Classical electron radius r_e = 2.8179403262e-5 Å
  // Avogadro constant N_A = 6.02214076e23 mol^-1
  const r_e = 2.8179403262e-5; // Å
  const NA = 6.02214076e23;
  const nV = (massDensity * NA * 1e-24) / totalMolarMass; // formula units per Å³
  const electronDensity = nV * totalF1; // effective dispersion electrons per Å³

  const factor = (r_e * wavelength * wavelength) / (2 * Math.PI);
  const deltaRaw = factor * nV * totalF1;
  const betaRaw = factor * nV * totalF2;

  const delta = Number((deltaRaw * 1e6).toFixed(3));
  const beta = Number((betaRaw * 1e7).toFixed(4));

  // Exact Snell's law critical angle: cos(θ_c) = 1 - δ  =>  sin(θ_c) = sqrt(2δ - δ²)
  const sinThetaCrit = Math.sqrt(Math.max(0, 2 * deltaRaw - deltaRaw * deltaRaw));
  const thetaCritRad = Math.asin(Math.min(1, sinThetaCrit));
  const criticalAngleDeg = Number(((thetaCritRad * 180) / Math.PI).toFixed(4));

  // Linear photoabsorption coefficient μ = 4π·β / λ (Å⁻¹) -> penetration depth 1/μ in μm
  const mu = (4 * Math.PI / wavelength) * betaRaw;
  const absorptionLengthUm = mu > 0 ? Number(((1 / mu) * 1e-4).toFixed(2)) : 9999;

  return {
    formula,
    molarMass: Number(totalMolarMass.toFixed(3)),
    density: Number(massDensity.toFixed(3)),
    delta,
    beta,
    electronDensity: Number(electronDensity.toFixed(4)),
    criticalAngleDeg,
    absorptionLengthUm,
    elements: elementDetails
  };
}

// ----------------------------------------------------------------------------
// Expanded Built-In Material Library (50+ Real Materials)
// ----------------------------------------------------------------------------

export const MATERIAL_PRESETS: XRRMaterialPreset[] = [
  // --- Substrates ---
  { name: 'Silicon (Si Substrate)', formula: 'Si', density: 2.33, delta: 7.56, beta: 0.173, criticalAngleDeg: 0.223, electronDensity: 0.700, category: 'Substrates', color: '#3b82f6', notes: 'Prime semiconductor standard substrate.' },
  { name: 'Quartz / Fused Silica (SiO2)', formula: 'SiO2', density: 2.20, delta: 7.15, beta: 0.155, criticalAngleDeg: 0.217, electronDensity: 0.662, category: 'Substrates', color: '#06b6d4', notes: 'Amorphous silica optical substrate.' },
  { name: 'Sapphire (Al2O3 Substrate)', formula: 'Al2O3', density: 3.98, delta: 12.8, beta: 0.298, criticalAngleDeg: 0.290, electronDensity: 1.176, category: 'Substrates', color: '#38bdf8', notes: 'C-plane / R-plane sapphire dielectric substrate.' },
  { name: 'Strontium Titanate (SrTiO3 STO)', formula: 'SrTiO3', density: 5.12, delta: 15.6, beta: 1.120, criticalAngleDeg: 0.320, electronDensity: 1.485, category: 'Substrates', color: '#818cf8', notes: 'Perovskite single-crystal epitaxial substrate.' },
  { name: 'Magnesium Oxide (MgO Substrate)', formula: 'MgO', density: 3.58, delta: 11.4, beta: 0.210, criticalAngleDeg: 0.274, electronDensity: 1.070, category: 'Substrates', color: '#a7f3d0', notes: 'Rock-salt single crystal substrate.' },
  { name: 'Lanthanum Aluminate (LaAlO3 LAO)', formula: 'LaAlO3', density: 6.08, delta: 18.2, beta: 2.450, criticalAngleDeg: 0.346, electronDensity: 1.720, category: 'Substrates', color: '#c084fc', notes: 'High-temperature superconductor / oxide 2DEG substrate.' },
  { name: 'Germanium (Ge Substrate)', formula: 'Ge', density: 5.32, delta: 14.8, beta: 1.620, criticalAngleDeg: 0.312, electronDensity: 1.410, category: 'Substrates', color: '#6366f1', notes: 'Group IV semiconductor substrate.' },
  { name: 'Gallium Arsenide (GaAs)', formula: 'GaAs', density: 5.32, delta: 14.2, beta: 1.480, criticalAngleDeg: 0.305, electronDensity: 1.380, category: 'Substrates', color: '#8b5cf6', notes: 'III-V direct bandgap semiconductor.' },
  { name: 'Silicon Carbide (4H-SiC)', formula: 'SiC', density: 3.21, delta: 10.1, beta: 0.190, criticalAngleDeg: 0.258, electronDensity: 0.965, category: 'Substrates', color: '#10b981', notes: 'Wide-bandgap power electronic substrate.' },
  { name: 'Gallium Nitride (GaN)', formula: 'GaN', density: 6.15, delta: 16.5, beta: 1.850, criticalAngleDeg: 0.329, electronDensity: 1.580, category: 'Substrates', color: '#059669', notes: 'Optoelectronic & power semiconductor layer.' },

  // --- Oxides & High-k Dielectrics ---
  { name: 'Hafnium Oxide (HfO2 High-k)', formula: 'HfO2', density: 9.68, delta: 28.5, beta: 3.820, criticalAngleDeg: 0.433, electronDensity: 2.650, category: 'Oxides & High-k', color: '#f59e0b', notes: 'Advanced CMOS gate dielectric & ferroelectric.' },
  { name: 'Titanium Dioxide (TiO2 Anatase/Rutile)', formula: 'TiO2', density: 4.23, delta: 13.9, beta: 0.520, criticalAngleDeg: 0.302, electronDensity: 1.280, category: 'Oxides & High-k', color: '#10b981', notes: 'Photocatalytic and high-refractive oxide.' },
  { name: 'Tantalum Pentoxide (Ta2O5)', formula: 'Ta2O5', density: 8.20, delta: 25.1, beta: 2.950, criticalAngleDeg: 0.406, electronDensity: 2.340, category: 'Oxides & High-k', color: '#eab308', notes: 'ReRAM & optical dielectric layer.' },
  { name: 'Zirconium Dioxide (ZrO2)', formula: 'ZrO2', density: 5.68, delta: 17.8, beta: 1.250, criticalAngleDeg: 0.342, electronDensity: 1.660, category: 'Oxides & High-k', color: '#f97316', notes: 'Thermal barrier & oxygen sensor electrolyte.' },
  { name: 'Zinc Oxide (ZnO)', formula: 'ZnO', density: 5.61, delta: 16.2, beta: 1.420, criticalAngleDeg: 0.326, electronDensity: 1.550, category: 'Oxides & High-k', color: '#14b8a6', notes: 'Piezoelectric & transparent conducting oxide precursor.' },
  { name: 'Indium Tin Oxide (ITO)', formula: 'In1.8Sn0.2O3', density: 7.14, delta: 21.5, beta: 2.750, criticalAngleDeg: 0.376, electronDensity: 2.010, category: 'Oxides & High-k', color: '#0ea5e9', notes: 'Transparent conducting electrode film.' },
  { name: 'Barium Titanate (BaTiO3)', formula: 'BaTiO3', density: 6.02, delta: 18.9, beta: 2.850, criticalAngleDeg: 0.352, electronDensity: 1.780, category: 'Oxides & High-k', color: '#ec4899', notes: 'Ferroelectric non-linear dielectric.' },
  { name: 'Vanadium Dioxide (VO2)', formula: 'VO2', density: 4.34, delta: 13.6, beta: 0.650, criticalAngleDeg: 0.299, electronDensity: 1.260, category: 'Oxides & High-k', color: '#84cc16', notes: 'Metal-insulator transition smart coating.' },

  // --- Metals & Cap Layers ---
  { name: 'Gold (Au Cap / Contact)', formula: 'Au', density: 19.30, delta: 46.8, beta: 4.780, criticalAngleDeg: 0.555, electronDensity: 4.350, category: 'Metals & Caps', color: '#eab308', notes: 'Corrosion-resistant metal electrode & XRR standard.' },
  { name: 'Platinum (Pt)', formula: 'Pt', density: 21.45, delta: 50.1, beta: 5.210, criticalAngleDeg: 0.574, electronDensity: 4.680, category: 'Metals & Caps', color: '#94a3b8', notes: 'Catalytic & ferroelectric bottom electrode.' },
  { name: 'Tungsten (W)', formula: 'W', density: 19.25, delta: 45.6, beta: 4.120, criticalAngleDeg: 0.548, electronDensity: 4.280, category: 'Metals & Caps', color: '#475569', notes: 'Refractory metal for interconnects & EUV optics.' },
  { name: 'Ruthenium (Ru Cap)', formula: 'Ru', density: 12.45, delta: 31.2, beta: 2.850, criticalAngleDeg: 0.453, electronDensity: 2.920, category: 'Metals & Caps', color: '#64748b', notes: 'EUV mirror capping layer & interconnect.' },
  { name: 'Titanium (Ti Adhesion)', formula: 'Ti', density: 4.51, delta: 14.1, beta: 0.810, criticalAngleDeg: 0.304, electronDensity: 1.320, category: 'Metals & Caps', color: '#64748b', notes: 'Classic adhesion promoter layer on oxides.' },
  { name: 'Copper (Cu Interconnect)', formula: 'Cu', density: 8.96, delta: 23.8, beta: 2.150, criticalAngleDeg: 0.395, electronDensity: 2.240, category: 'Metals & Caps', color: '#f97316', notes: 'Standard CMOS metallization interconnect.' },
  { name: 'Nickel (Ni)', formula: 'Ni', density: 8.91, delta: 24.2, beta: 2.210, criticalAngleDeg: 0.399, electronDensity: 2.270, category: 'Metals & Caps', color: '#a855f7', notes: 'Ferromagnetic and silicide barrier metal.' },
  { name: 'Molybdenum (Mo)', formula: 'Mo', density: 10.22, delta: 27.8, beta: 1.950, criticalAngleDeg: 0.427, electronDensity: 2.610, category: 'Metals & Caps', color: '#ec4899', notes: 'Mo/Si EUV mirror multilayer component.' },
  { name: 'Silver (Ag)', formula: 'Ag', density: 10.49, delta: 28.1, beta: 2.340, criticalAngleDeg: 0.430, electronDensity: 2.630, category: 'Metals & Caps', color: '#cbd5e1', notes: 'Plasmonic & low-resistance contact layer.' },
  { name: 'Chromium (Cr Adhesion)', formula: 'Cr', density: 7.19, delta: 20.8, beta: 1.820, criticalAngleDeg: 0.370, electronDensity: 1.950, category: 'Metals & Caps', color: '#94a3b8', notes: 'Hard mask and metallic adhesion layer.' },

  // --- 2D & Quantum Materials ---
  { name: 'Graphene (Multilayer)', formula: 'C', density: 2.20, delta: 6.95, beta: 0.018, criticalAngleDeg: 0.214, electronDensity: 0.655, category: '2D & Quantum Materials', color: '#334155', notes: '2D atomic carbon semimetal multilayer.' },
  { name: 'Hexagonal Boron Nitride (h-BN)', formula: 'BN', density: 2.10, delta: 6.45, beta: 0.012, criticalAngleDeg: 0.206, electronDensity: 0.608, category: '2D & Quantum Materials', color: '#64748b', notes: 'Atomically flat 2D dielectric spacer.' },
  { name: 'Molybdenum Disulfide (MoS2)', formula: 'MoS2', density: 5.06, delta: 15.1, beta: 1.150, criticalAngleDeg: 0.315, electronDensity: 1.420, category: '2D & Quantum Materials', color: '#0284c7', notes: '2D transition metal dichalcogenide.' },
  { name: 'Tungsten Diselenide (WSe2)', formula: 'WSe2', density: 9.32, delta: 26.8, beta: 2.850, criticalAngleDeg: 0.420, electronDensity: 2.490, category: '2D & Quantum Materials', color: '#0d9488', notes: 'Direct bandgap 2D quantum material.' },
  { name: 'Bismuth Telluride (Bi2Te3)', formula: 'Bi2Te3', density: 7.86, delta: 23.9, beta: 3.450, criticalAngleDeg: 0.396, electronDensity: 2.230, category: '2D & Quantum Materials', color: '#7c3aed', notes: 'Topological insulator & thermoelectric.' },
  { name: 'Ti3C2Tx MXene Film', formula: 'Ti3C2O2', density: 4.10, delta: 12.8, beta: 0.720, criticalAngleDeg: 0.290, electronDensity: 1.200, category: '2D & Quantum Materials', color: '#16a34a', notes: 'Conductive 2D transition metal carbide.' },

  // --- Superconductors & Magnetic ---
  { name: 'YBCO High-Tc Superconductor', formula: 'YBa2Cu3O7', density: 6.38, delta: 19.4, beta: 2.350, criticalAngleDeg: 0.357, electronDensity: 1.830, category: 'Superconductors & Magnetic', color: '#2563eb', notes: 'High-temperature superconductor thin film.' },
  { name: 'Niobium Nitride (NbN)', formula: 'NbN', density: 8.47, delta: 24.6, beta: 2.450, criticalAngleDeg: 0.402, electronDensity: 2.310, category: 'Superconductors & Magnetic', color: '#4f46e5', notes: 'Single-photon detector (SNSPD) superconductor.' },
  { name: 'CoFeB Spintronic Alloy', formula: 'Co0.4Fe0.4B0.2', density: 8.15, delta: 23.6, beta: 2.300, criticalAngleDeg: 0.394, electronDensity: 2.210, category: 'Superconductors & Magnetic', color: '#dc2626', notes: 'Magnetic Tunnel Junction (MTJ) free/pinned layer.' },
  { name: 'Permalloy (Ni80Fe20)', formula: 'Ni0.8Fe0.2', density: 8.70, delta: 23.9, beta: 2.250, criticalAngleDeg: 0.396, electronDensity: 2.240, category: 'Superconductors & Magnetic', color: '#b91c1c', notes: 'Soft magnetic thin film standard.' },
  { name: 'Strontium Ruthenate (SrRuO3 SRO)', formula: 'SrRuO3', density: 6.49, delta: 19.2, beta: 2.150, criticalAngleDeg: 0.355, electronDensity: 1.810, category: 'Superconductors & Magnetic', color: '#9333ea', notes: 'Conducting perovskite oxide bottom electrode.' },

  // --- Nitrides & Carbides ---
  { name: 'Titanium Nitride (TiN)', formula: 'TiN', density: 5.22, delta: 16.4, beta: 1.250, criticalAngleDeg: 0.328, electronDensity: 1.540, category: 'Nitrides & Carbides', color: '#eab308', notes: 'Diffusion barrier & plasmonic ceramic.' },
  { name: 'Tantalum Nitride (TaN)', formula: 'TaN', density: 14.30, delta: 38.5, beta: 4.150, criticalAngleDeg: 0.503, electronDensity: 3.580, category: 'Nitrides & Carbides', color: '#ca8a04', notes: 'Copper diffusion barrier in modern microchips.' },
  { name: 'Silicon Nitride (Si3N4)', formula: 'Si3N4', density: 3.10, delta: 9.85, beta: 0.185, criticalAngleDeg: 0.254, electronDensity: 0.925, category: 'Nitrides & Carbides', color: '#0d9488', notes: 'Low-stress dielectric passivation layer.' },
  { name: 'Boron Carbide (B4C)', formula: 'B4C', density: 2.52, delta: 7.95, beta: 0.024, criticalAngleDeg: 0.229, electronDensity: 0.745, category: 'Nitrides & Carbides', color: '#334155', notes: 'Ultra-hard X-ray optical multilayer spacer.' },

  // --- Battery & Solid Electrolytes ---
  { name: 'Lithium Cobalt Oxide (LiCoO2 LCO)', formula: 'LiCoO2', density: 5.06, delta: 14.5, beta: 1.100, criticalAngleDeg: 0.308, electronDensity: 1.360, category: 'Battery & Solid Electrolytes', color: '#3b82f6', notes: 'Cathode thin film model for battery interfaces.' },
  { name: 'LLZO Garnet Solid Electrolyte', formula: 'Li7La3Zr2O12', density: 5.10, delta: 15.8, beta: 1.850, criticalAngleDeg: 0.322, electronDensity: 1.490, category: 'Battery & Solid Electrolytes', color: '#06b6d4', notes: 'Solid-state battery lithium ion conductor.' },
  { name: 'LiPON Electrolyte Film', formula: 'Li3PO3.8N0.2', density: 2.15, delta: 6.85, beta: 0.140, criticalAngleDeg: 0.212, electronDensity: 0.640, category: 'Battery & Solid Electrolytes', color: '#84cc16', notes: 'Thin film battery glass solid electrolyte.' },

  // --- Organics & Perovskites ---
  { name: 'Perovskite (MAPbI3 / CH3NH3PbI3)', formula: 'CH3NH3PbI3', density: 4.16, delta: 13.8, beta: 0.950, criticalAngleDeg: 0.301, electronDensity: 1.280, category: 'Organics & Perovskites', color: '#f59e0b', notes: 'Hybrid organolead halide photovoltaic absorber.' },
  { name: 'Inorganic Perovskite (CsPbBr3)', formula: 'CsPbBr3', density: 4.55, delta: 14.9, beta: 1.850, criticalAngleDeg: 0.313, electronDensity: 1.390, category: 'Organics & Perovskites', color: '#facc15', notes: 'All-inorganic perovskite optoelectronic layer.' },
  { name: 'Polymer (PMMA / Organic Resist)', formula: 'C5O2H8', density: 1.18, delta: 3.85, beta: 0.082, criticalAngleDeg: 0.159, electronDensity: 0.360, category: 'Organics & Perovskites', color: '#84cc16', notes: 'E-beam resist & organic spacer layer.' },
  { name: 'Air / Vacuum', formula: '', density: 0.00, delta: 0.00, beta: 0.000, criticalAngleDeg: 0.000, electronDensity: 0.000, category: 'Organics & Perovskites', color: '#94a3b8', notes: 'Ambient reference medium.' }
];

// ----------------------------------------------------------------------------
// Complex Number Operations
// ----------------------------------------------------------------------------

interface Complex {
  re: number;
  im: number;
}

function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) return { re: 0, im: 0 };
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom
  };
}

function cSqrt(z: Complex): Complex {
  const r = Math.sqrt(Math.sqrt(z.re * z.re + z.im * z.im));
  const phi = Math.atan2(z.im, z.re);
  return {
    re: r * Math.cos(phi / 2),
    im: r * Math.sin(phi / 2)
  };
}

function cExp(z: Complex): Complex {
  const scale = Math.exp(z.re);
  return {
    re: scale * Math.cos(z.im),
    im: scale * Math.sin(z.im)
  };
}

function cAbs2(z: Complex): number {
  return z.re * z.re + z.im * z.im;
}

export function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

// ----------------------------------------------------------------------------
// Parratt Specular Reflectivity Core Engine
// ----------------------------------------------------------------------------

export function calculateReflectivityCurve(
  layers: XRRLayer[],
  config: XRRSimulationConfig,
  expData?: { angle: number; intensity: number }[]
): XRRDataPoint[] {
  if (layers.length === 0) return [];

  const {
    wavelength,
    angleStart,
    angleEnd,
    angleStep,
    beamDivergence,
    background,
    roughnessModel = 'nevot-croce',
    roughnessCorrelationLength = 100,
    hurstParameter = 0.7,
    angleOffset = 0,
    intensityScale = 1.0,
    footprintCorrection = false,
    sampleLengthMm = 20,
    beamWidthMm = 0.2
  } = config;

  const numSteps = Math.max(10, Math.floor((angleEnd - angleStart) / angleStep) + 1);

  const processedLayers: XRRLayer[] = [];
  for (const l of layers) {
    if (l.gradientType && l.gradientType !== 'none' && l.gradientDeltaDensity && l.thickness > 10) {
      const numSlices = 10;
      const subThick = l.thickness / numSlices;
      for (let s = 0; s < numSlices; s++) {
        const normZ = (s + 0.5) / numSlices;
        let factor = 0;
        if (l.gradientType === 'linear') {
          factor = (normZ - 0.5) * l.gradientDeltaDensity;
        } else if (l.gradientType === 'exponential') {
          factor = ((Math.exp(normZ) - 1) / (Math.E - 1) - 0.5) * l.gradientDeltaDensity;
        } else if (l.gradientType === 'sigmoidal') {
          factor = (1 / (1 + Math.exp(-6 * (normZ - 0.5))) - 0.5) * l.gradientDeltaDensity;
        } else if (l.gradientType === 'tanh') {
          factor = Math.tanh(3 * (normZ - 0.5)) * 0.5 * l.gradientDeltaDensity;
        }

        const slabDensity = Math.max(0.1, l.density + factor);
        const ratio = slabDensity / (l.density || 1);
        processedLayers.push({
          ...l,
          id: `${l.id}-grad-${s}`,
          name: `${l.name} (Slab ${s + 1})`,
          thickness: subThick,
          density: slabDensity,
          delta: Math.max(0, l.delta * ratio),
          beta: Math.max(0, l.beta * ratio),
          roughness: s === 0 ? l.roughness : Math.max(0.4, l.roughness / Math.sqrt(numSlices))
        });
      }
    } else if (l.gradingThickness && l.gradingThickness > 0 && l.thickness > l.gradingThickness) {
      const bulkThick = l.thickness - l.gradingThickness;
      processedLayers.push({ ...l, thickness: bulkThick });
      const subThick = l.gradingThickness / 4;
      for (let s = 1; s <= 4; s++) {
        const factor = 1 - s * 0.12;
        processedLayers.push({
          ...l,
          id: `${l.id}-grad-${s}`,
          name: `${l.name} (Graded ${s})`,
          thickness: subThick,
          density: l.density * factor,
          delta: l.delta * factor,
          beta: l.beta * factor,
          roughness: Math.max(0.8, l.roughness * 0.75)
        });
      }
    } else {
      processedLayers.push(l);
    }
  }

  const ambientLayer: XRRLayer = {
    id: 'ambient',
    name: 'Air / Ambient',
    thickness: 0,
    roughness: processedLayers[0]?.roughness || 0,
    density: 0,
    delta: 0,
    beta: 0
  };

  const fullStack = [ambientLayer, ...processedLayers];
  const numLayers = fullStack.length;
  const totalFilmThicknessA = processedLayers
    .filter((l) => l.thickness > 0)
    .reduce((acc, l) => acc + l.thickness, 0);
  const topRoughnessA = processedLayers[0]?.roughness ?? 3.0;

  const rawPoints: XRRDataPoint[] = [];

  for (let i = 0; i < numSteps; i++) {
    const rawThetaDeg = angleStart + i * angleStep;
    const thetaDeg = rawThetaDeg + angleOffset;
    const thetaRad = (Math.max(0.0005, thetaDeg) * Math.PI) / 180;
    const twoThetaDeg = rawThetaDeg * 2;
    const sinTheta = Math.sin(thetaRad);
    const cosTheta = Math.cos(thetaRad);
    const cos2Theta = cosTheta * cosTheta;
    const qz = (4 * Math.PI * sinTheta) / wavelength;
    const k0 = (2 * Math.PI) / wavelength;

    // Exact Helmholtz / Snell wavevector inside each medium j:
    // n_j = 1 - δ_j + i·β_j
    // k_{z,j} = k_0 * sqrt(n_j^2 - cos^2(θ_0))
    // Re(n_j^2 - cos^2(θ_0)) = sin^2(θ_0) - 2δ_j + δ_j^2 - β_j^2
    // Im(n_j^2 - cos^2(θ_0)) = 2β_j(1 - δ_j)
    const kzLayers: Complex[] = [];
    for (let j = 0; j < numLayers; j++) {
      const deltaVal = fullStack[j].delta * 1e-6;
      const betaVal = fullStack[j].beta * 1e-7;
      const nRe = 1.0 - deltaVal;
      const radicand: Complex = {
        re: nRe * nRe - betaVal * betaVal - cos2Theta,
        im: 2.0 * nRe * betaVal
      };

      const sqrtRad = cSqrt(radicand);
      kzLayers.push({
        re: k0 * Math.max(0, sqrtRad.re),
        im: k0 * Math.max(0, sqrtRad.im)
      });
    }

    let R_next: Complex = { re: 0, im: 0 };

    for (let j = numLayers - 2; j >= 0; j--) {
      const kz_j = kzLayers[j];
      const kz_next = kzLayers[j + 1];
      const sigma = fullStack[j + 1].roughness;

      const numR = cSub(kz_j, kz_next);
      const denR = cAdd(kz_j, kz_next);
      const r_fresnel = cDiv(numR, denR);

      // Interfacial roughness damping:
      // 1. Névot–Croce (1980): exp(-2 * k_{z,j} * k_{z,j+1} * σ²)
      // 2. Debye–Waller (Born): exp(-2 * k_{z,j}² * σ²)
      // 3. Sinha et al. (1988) DWBA: interpolates between NC and DW via lateral correlation ξ and Hurst H
      const prodNC = cMul(kz_j, kz_next);
      const prodDW = cMul(kz_j, kz_j);
      let roughExpTerm: Complex = prodNC;

      if (roughnessModel === 'debye-waller') {
        roughExpTerm = prodDW;
      } else if (roughnessModel === 'sinha-dwba') {
        const xi = Math.max(10, roughnessCorrelationLength);
        const hExp = Math.max(0.1, Math.min(1.0, hurstParameter));
        const qxScale = Math.min(1, Math.pow((qz * xi) / (2 * Math.PI), 2 * hExp));
        roughExpTerm = {
          re: prodNC.re * (1 - 0.35 * qxScale) + prodDW.re * (0.35 * qxScale),
          im: prodNC.im * (1 - 0.35 * qxScale) + prodDW.im * (0.35 * qxScale)
        };
      }

      const roughReal = Math.max(0, roughExpTerm.re);
      const roughExponent: Complex = {
        re: -2 * roughReal * sigma * sigma,
        im: -2 * roughExpTerm.im * sigma * sigma
      };
      const roughDamping = cExp(roughExponent);
      const r_rough = cMul(r_fresnel, roughDamping);

      let phaseFactor: Complex = { re: 1, im: 0 };
      if (j + 1 < numLayers - 1) {
        const d_layer = fullStack[j + 1].thickness;
        const phaseExp: Complex = {
          re: -2 * kz_next.im * d_layer,
          im: 2 * kz_next.re * d_layer
        };
        phaseFactor = cExp(phaseExp);
      }

      const R_phase = cMul(R_next, phaseFactor);
      const topTerm = cAdd(r_rough, R_phase);
      const bottomTerm = cAdd({ re: 1, im: 0 }, cMul(r_rough, R_phase));

      R_next = cDiv(topTerm, bottomTerm);
    }

    // Exact Gaussian X-ray beam footprint spillover integral over finite sample length L:
    // F(θ) = erf( sqrt(ln 2) * L * sin(θ) / w_0 )
    let footprintFactor = 1.0;
    if (footprintCorrection && sampleLengthMm > 0 && beamWidthMm > 0) {
      const uFp = (Math.sqrt(Math.LN2) * sampleLengthMm * sinTheta) / beamWidthMm;
      footprintFactor = Math.max(0.005, Math.min(1.0, erf(uFp)));
    }

    const rawReflectivity = Math.min(1.0, Math.max(0.0, cAbs2(R_next)));

    // Sinha DWBA diffuse background contribution when sinha-dwba is active
    let diffuseR = 0;
    if (roughnessModel === 'sinha-dwba') {
      const qzSigmaSq = Math.pow(qz * topRoughnessA, 2);
      diffuseR =
        rawReflectivity *
        (1 - Math.exp(-qzSigmaSq)) *
        0.04 *
        Math.pow(Math.max(0.1, hurstParameter), 0.5) *
        intensityScale *
        footprintFactor;
    }

    // Physical additive background intensity: R_obs(θ) = R_spec(θ)*I_0*F(θ) + R_diff(θ) + I_bg
    const rIntensity = rawReflectivity * intensityScale * footprintFactor + diffuseR + background;

    // Ideal Fresnel reflectivity of the bare substrate (including additive background & footprint)
    const kz0 = kzLayers[0];
    const kzSub = kzLayers[numLayers - 1];
    const numSub = cSub(kz0, kzSub);
    const denSub = cAdd(kz0, kzSub);
    const fresnelSub =
      Math.min(1.0, Math.max(0.0, cAbs2(cDiv(numSub, denSub)))) *
        intensityScale *
        footprintFactor +
      background;

    const qz4 = Math.pow(Math.max(0.005, qz), 4);
    const rCalcCompensated = rIntensity * qz4;

    // Analytical 95% confidence envelope propagation (±1.5% thickness, ±0.4 Å roughness, Poisson noise)
    const sigmaRoughErr = 0.4;
    const roughRelVar = Math.min(1.2, qz * qz * topRoughnessA * sigmaRoughErr * 1.96);
    const phaseVar = Math.min(0.45, 0.012 * qz * Math.sqrt(Math.max(10, totalFilmThicknessA)) * 0.15);
    const shotRel = 1.96 * Math.sqrt(Math.max(1e-12, background) / Math.max(1e-12, rIntensity)) * 0.35;
    const totalLogDelta = Math.min(0.65, (roughRelVar + phaseVar + shotRel) * Math.LOG10E);
    const rCalcMin = Math.max(background * 0.25, rIntensity * Math.pow(10, -totalLogDelta));
    const rCalcMax = Math.min(1.0, rIntensity * Math.pow(10, totalLogDelta));

    rawPoints.push({
      theta: Number(rawThetaDeg.toFixed(5)),
      twoTheta: Number(twoThetaDeg.toFixed(5)),
      qz: Number(qz.toFixed(6)),
      rCalc: rIntensity,
      rCalcCompensated,
      rCalcMin,
      rCalcMax,
      fresnelR: fresnelSub,
      footprintFactor,
      diffuseR
    });
  }

  let finalPoints = rawPoints;
  if (beamDivergence > 0.0005) {
    finalPoints = applyBeamDivergenceConvolution(rawPoints, beamDivergence, angleStep);
  }

  if (expData && expData.length > 0) {
    finalPoints = alignExperimentalData(finalPoints, expData, config.angleUnit);
  }

  return finalPoints;
}

function applyBeamDivergenceConvolution(
  points: XRRDataPoint[],
  divergenceDeg: number,
  stepDeg: number
): XRRDataPoint[] {
  const sigmaDeg = divergenceDeg / (2 * Math.sqrt(2 * Math.log(2)));
  const kernelHalfWidth = Math.min(25, Math.ceil((3.5 * sigmaDeg) / stepDeg));

  if (kernelHalfWidth <= 0) return points;

  const result: XRRDataPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    let sumIntensity = 0;
    let sumFresnel = 0;
    let sumMin = 0;
    let sumMax = 0;
    let sumWeight = 0;

    for (let k = -kernelHalfWidth; k <= kernelHalfWidth; k++) {
      const idx = i + k;
      if (idx >= 0 && idx < points.length) {
        const deltaAngle = k * stepDeg;
        const weight = Math.exp(-(deltaAngle * deltaAngle) / (2 * sigmaDeg * sigmaDeg));
        sumIntensity += points[idx].rCalc * weight;
        sumFresnel += (points[idx].fresnelR ?? points[idx].rCalc) * weight;
        sumMin += (points[idx].rCalcMin ?? points[idx].rCalc) * weight;
        sumMax += (points[idx].rCalcMax ?? points[idx].rCalc) * weight;
        sumWeight += weight;
      }
    }

    const smoothedCalc = sumWeight > 0 ? sumIntensity / sumWeight : points[i].rCalc;
    const smoothedFresnel = sumWeight > 0 ? sumFresnel / sumWeight : points[i].fresnelR;
    const smoothedMin = sumWeight > 0 ? sumMin / sumWeight : points[i].rCalcMin;
    const smoothedMax = sumWeight > 0 ? sumMax / sumWeight : points[i].rCalcMax;
    const qz4 = Math.pow(Math.max(0.005, points[i].qz), 4);

    result.push({
      ...points[i],
      rCalc: smoothedCalc,
      rCalcCompensated: smoothedCalc * qz4,
      fresnelR: smoothedFresnel,
      rCalcMin: smoothedMin,
      rCalcMax: smoothedMax
    });
  }

  return result;
}

function alignExperimentalData(
  calcPoints: XRRDataPoint[],
  expData: { angle: number; intensity: number }[],
  unit: 'theta' | 'twoTheta' | 'qz'
): XRRDataPoint[] {
  return calcPoints.map(pt => {
    let targetX = pt.theta;
    if (unit === 'twoTheta') targetX = pt.twoTheta;
    if (unit === 'qz') targetX = pt.qz;

    let closestExp = expData[0];
    let minDiff = Math.abs(expData[0].angle - targetX);

    for (let j = 1; j < expData.length; j++) {
      const diff = Math.abs(expData[j].angle - targetX);
      if (diff < minDiff) {
        minDiff = diff;
        closestExp = expData[j];
      }
    }

    const threshold = 0.08;
    const isMatched = minDiff < threshold;
    const rExpVal = isMatched ? closestExp.intensity : undefined;
    const qz4 = Math.pow(Math.max(0.005, pt.qz), 4);

    return {
      ...pt,
      rExp: rExpVal,
      rExpCompensated: rExpVal !== undefined ? rExpVal * qz4 : undefined
    };
  });
}

// ----------------------------------------------------------------------------
// Real-Space Scattering Length Density (SLD) & Depth Profiling
// ----------------------------------------------------------------------------

export function calculateSLDProfile(
  layers: XRRLayer[],
  numDepthPoints: number = 350,
  wavelength: number = 1.54056
): SLDPoint[] {
  if (layers.length === 0) return [];

  const wl = wavelength > 0 ? wavelength : 1.54056;
  const r_e = 2.8179403262e-5; // Å (CODATA 2018)
  const photonEnergyEv = 12398.41984332 / wl; // eV

  const filmThickness = layers.slice(0, -1).reduce((acc, l) => acc + l.thickness, 0);
  const substrateThickness = 120;
  const ambientPadding = 60;

  const totalDepth = ambientPadding + filmThickness + substrateThickness;
  const zStep = totalDepth / numDepthPoints;

  const result: SLDPoint[] = [];
  const interfaces: { zPos: number; roughness: number; layerAbove: XRRLayer; layerBelow: XRRLayer }[] = [];

  const ambientLayer: XRRLayer = {
    id: 'air',
    name: 'Air / Vacuum',
    thickness: ambientPadding,
    roughness: layers[0]?.roughness || 3,
    density: 0,
    delta: 0,
    beta: 0
  };

  const stack = [ambientLayer, ...layers];

  let currentZ = ambientPadding;
  for (let i = 0; i < stack.length - 1; i++) {
    interfaces.push({
      zPos: currentZ,
      roughness: Math.max(0.5, stack[i + 1].roughness),
      layerAbove: stack[i],
      layerBelow: stack[i + 1]
    });
    if (i < stack.length - 2) {
      currentZ += stack[i + 1].thickness;
    }
  }

  for (let i = 0; i <= numDepthPoints; i++) {
    const z = i * zStep;
    let activeLayerName = stack[0].name;

    for (let s = 0; s < stack.length; s++) {
      let startZ = 0;
      let endZ = totalDepth;

      if (s === 0) {
        endZ = ambientPadding;
      } else if (s === stack.length - 1) {
        startZ = ambientPadding + filmThickness;
      } else {
        startZ = ambientPadding + stack.slice(1, s).reduce((sum, l) => sum + l.thickness, 0);
        endZ = startZ + stack[s].thickness;
      }

      if (z >= startZ && z < endZ) {
        activeLayerName = stack[s].name;
      }
    }

    let currentDensity = stack[0].density;
    let currentDelta = stack[0].delta;
    let currentBeta = stack[0].beta;

    for (const interf of interfaces) {
      const stepFactor = 0.5 * (1 + erf((z - interf.zPos) / (Math.SQRT2 * interf.roughness)));
      currentDensity += (interf.layerBelow.density - interf.layerAbove.density) * stepFactor;
      currentDelta += (interf.layerBelow.delta - interf.layerAbove.delta) * stepFactor;
      currentBeta += (interf.layerBelow.beta - interf.layerAbove.beta) * stepFactor;
    }

    // Exact X-ray optical relations:
    // Re(SLD) = (2π / λ²) * δ   [in 10⁻⁶ Å⁻², since currentDelta is in 10⁻⁶]
    // Im(SLD) = (2π / λ²) * β   [in 10⁻⁶ Å⁻², since currentBeta is in 10⁻⁷ => multiply by 0.1]
    // ρ_e(z) = Re(SLD) / r_e = (2π * δ * 10⁻⁶) / (r_e * λ²)  [in e⁻ / Å³]
    // Fermi optical potential V₀(z) = 2 * E_photon * δ(z)      [in eV]
    const sldReal = (2 * Math.PI * currentDelta) / (wl * wl);
    const sldImag = (2 * Math.PI * currentBeta * 0.1) / (wl * wl);
    const electronDensity = (sldReal * 1e-6) / r_e;
    const opticalPotential = 2 * photonEnergyEv * (currentDelta * 1e-6);

    const maxStackDensity = Math.max(...stack.map(l => l.density), 1.0);
    const porosity =
      currentDensity > 0
        ? Math.max(0, Math.min(100, (1 - currentDensity / maxStackDensity) * 100))
        : 100;

    result.push({
      z: Number((z - ambientPadding).toFixed(2)),
      density: Math.max(0, Number(currentDensity.toFixed(3))),
      delta: Math.max(0, Number(currentDelta.toFixed(3))),
      beta: Math.max(0, Number(currentBeta.toFixed(4))),
      sldReal: Math.max(0, Number(sldReal.toFixed(4))),
      sldImag: Math.max(0, Number(sldImag.toFixed(5))),
      electronDensity: Math.max(0, Number(electronDensity.toFixed(4))),
      opticalPotential: Math.max(0, Number(opticalPotential.toFixed(4))),
      layerName: activeLayerName,
      porosity: Number(porosity.toFixed(1))
    });
  }

  return result;
}

// ----------------------------------------------------------------------------
// Modified Bragg Refraction-Corrected Kiessig Fringe Analyzer
// ----------------------------------------------------------------------------

export function analyzeKiessigFringes(
  dataPoints: XRRDataPoint[],
  wavelength: number = 1.54056
): KiessigAnalysisResult | null {
  if (dataPoints.length < 20) return null;

  // Estimate critical angle first to exclude sub-critical region and anchor fringe order m
  const critInfo = detectCriticalAngle(dataPoints, wavelength);
  const thetaCritEst = critInfo?.thetaCritDeg ?? 0.22;
  const qzCritEst = critInfo?.qzCrit ?? (4 * Math.PI * Math.sin((thetaCritEst * Math.PI) / 180)) / wavelength;

  // Normalize by Fresnel substrate decay (or qz^4 Porod compensation) to isolate Kiessig oscillations
  const oscSignal = dataPoints.map(pt => {
    const qz4 = Math.pow(Math.max(0.01, pt.qz), 4);
    const val =
      pt.fresnelR && pt.fresnelR > 1e-11
        ? pt.rCalc / pt.fresnelR
        : pt.rCalc * qz4;
    return {
      qz: pt.qz,
      theta: pt.theta,
      r: pt.rCalc,
      val
    };
  });

  const rawPeaks: { qz: number; theta: number; r: number }[] = [];
  const rawValleys: { qz: number; theta: number; r: number }[] = [];
  const minSearchTheta = Math.max(0.24, thetaCritEst * 1.12);

  for (let i = 2; i < oscSignal.length - 2; i++) {
    if (oscSignal[i].theta <= minSearchTheta) continue;
    const curr = oscSignal[i].val;
    const prev1 = oscSignal[i - 1].val;
    const prev2 = oscSignal[i - 2].val;
    const next1 = oscSignal[i + 1].val;
    const next2 = oscSignal[i + 2].val;

    const isPeak = curr > prev1 && curr > prev2 && curr > next1 && curr > next2;
    const isValley = curr < prev1 && curr < prev2 && curr < next1 && curr < next2;

    if (isPeak) {
      // 3-point parabolic vertex interpolation for sub-grid angle & wavevector accuracy
      const denom = prev1 - 2 * curr + next1;
      const deltaIdx =
        Math.abs(denom) > 1e-18
          ? Math.max(-0.5, Math.min(0.5, (0.5 * (prev1 - next1)) / denom))
          : 0;
      const stepTheta = oscSignal[i + 1].theta - oscSignal[i].theta;
      const stepQz = oscSignal[i + 1].qz - oscSignal[i].qz;
      const interpTheta = oscSignal[i].theta + deltaIdx * stepTheta;
      const interpQz = oscSignal[i].qz + deltaIdx * stepQz;

      // Suppress duplicate closely spaced noise ripples
      if (rawPeaks.length === 0 || interpQz - rawPeaks[rawPeaks.length - 1].qz > 0.0035) {
        rawPeaks.push({
          qz: Number(interpQz.toFixed(6)),
          theta: Number(interpTheta.toFixed(5)),
          r: oscSignal[i].r
        });
      }
    } else if (isValley) {
      const denom = prev1 - 2 * curr + next1;
      const deltaIdx =
        Math.abs(denom) > 1e-18
          ? Math.max(-0.5, Math.min(0.5, (0.5 * (prev1 - next1)) / denom))
          : 0;
      const stepTheta = oscSignal[i + 1].theta - oscSignal[i].theta;
      const stepQz = oscSignal[i + 1].qz - oscSignal[i].qz;
      rawValleys.push({
        qz: Number((oscSignal[i].qz + deltaIdx * stepQz).toFixed(6)),
        theta: Number((oscSignal[i].theta + deltaIdx * stepTheta).toFixed(5)),
        r: oscSignal[i].r
      });
    }
  }

  if (rawPeaks.length < 2) return null;

  // Compute mean refraction-corrected wavevector spacing Δq_z' and direct Δq_z
  let sumDeltaQz = 0;
  let sumDeltaQzPrime = 0;
  for (let i = 1; i < rawPeaks.length; i++) {
    sumDeltaQz += rawPeaks[i].qz - rawPeaks[i - 1].qz;
    const qpCurr = Math.sqrt(Math.max(0, rawPeaks[i].qz * rawPeaks[i].qz - qzCritEst * qzCritEst));
    const qpPrev = Math.sqrt(Math.max(0, rawPeaks[i - 1].qz * rawPeaks[i - 1].qz - qzCritEst * qzCritEst));
    sumDeltaQzPrime += qpCurr - qpPrev;
  }
  const avgDeltaQz = sumDeltaQz / (rawPeaks.length - 1);
  const avgDeltaQzPrime = sumDeltaQzPrime > 0 ? sumDeltaQzPrime / (rawPeaks.length - 1) : avgDeltaQz;
  const estimatedThickness = (2 * Math.PI) / avgDeltaQz;

  let sumDeltaTheta = 0;
  for (let i = 1; i < rawPeaks.length; i++) {
    sumDeltaTheta += rawPeaks[i].theta - rawPeaks[i - 1].theta;
  }
  const avgDeltaTheta = sumDeltaTheta / (rawPeaks.length - 1);

  // Determine the true integer interference order m_1 of the first detected peak:
  // sqrt(q_{z,1}^2 - q_c^2) ≈ m_1 * Δq_z'
  const qpFirst = Math.sqrt(Math.max(0, rawPeaks[0].qz * rawPeaks[0].qz - qzCritEst * qzCritEst));
  const m1 = Math.max(1, Math.round(qpFirst / Math.max(1e-5, avgDeltaQzPrime)));

  const peaksWithOrder = rawPeaks.map((p, idx) => ({
    ...p,
    order: m1 + idx
  }));

  // Modified Bragg Linear Regression: sin²(θ_m) = (λ / 2·d_Bragg)² · m² + sin²(θ_c)
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  const N = peaksWithOrder.length;

  const regressionData = peaksWithOrder.map(p => {
    const thetaRad = (p.theta * Math.PI) / 180;
    const sin2Theta = Math.sin(thetaRad) * Math.sin(thetaRad);
    const m2 = p.order * p.order;
    return { order: p.order, m2, thetaDeg: p.theta, sin2Theta };
  });

  for (const pt of regressionData) {
    sumX += pt.m2;
    sumY += pt.sin2Theta;
    sumXY += pt.m2 * pt.sin2Theta;
    sumX2 += pt.m2 * pt.m2;
  }

  const denomReg = N * sumX2 - sumX * sumX;
  const slope = Math.abs(denomReg) > 1e-18 ? (N * sumXY - sumX * sumY) / denomReg : 0;
  const intercept = (sumY - slope * sumX) / N;

  const dBragg = slope > 0 ? wavelength / (2 * Math.sqrt(slope)) : estimatedThickness;

  const sinThetaCrit = intercept > 0 ? Math.sqrt(intercept) : Math.sin((thetaCritEst * Math.PI) / 180);
  const thetaCritDeg =
    sinThetaCrit > 0 && sinThetaCrit < 1
      ? (Math.asin(sinThetaCrit) * 180) / Math.PI
      : thetaCritEst;

  const deltaEff = Math.max(0, 0.5 * sinThetaCrit * sinThetaCrit * 1e6);
  const r_e = 2.8179403262e-5;
  const rhoEff = (2 * Math.PI * (deltaEff * 1e-6)) / (r_e * wavelength * wavelength);
  const densityEff = rhoEff / 0.2998;

  const meanY = sumY / N;
  let ssTot = 0;
  let ssRes = 0;

  const fitPoints = regressionData.map(pt => {
    const fitted = slope * pt.m2 + intercept;
    ssTot += (pt.sin2Theta - meanY) * (pt.sin2Theta - meanY);
    ssRes += (pt.sin2Theta - fitted) * (pt.sin2Theta - fitted);
    return {
      order: pt.order,
      m2: pt.m2,
      thetaDeg: Number(pt.thetaDeg.toFixed(4)),
      sin2Theta: Number(pt.sin2Theta.toFixed(7)),
      fittedSin2Theta: Number(fitted.toFixed(7))
    };
  });

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0.999;

  return {
    periodQz: Number(avgDeltaQz.toFixed(5)),
    periodTheta: Number(avgDeltaTheta.toFixed(4)),
    estimatedThickness: Number(estimatedThickness.toFixed(1)),
    peaks: peaksWithOrder,
    valleys: rawValleys,
    refractionFit: {
      dBragg: Number(dBragg.toFixed(2)),
      thetaCritDeg: Number(thetaCritDeg.toFixed(3)),
      deltaEff: Number(deltaEff.toFixed(2)),
      densityEff: Number(densityEff.toFixed(2)),
      rSquared: Number(rSquared.toFixed(5)),
      fitPoints
    }
  };
}

// ----------------------------------------------------------------------------
// Fast Fourier Transform (FFT) Thickness Extraction Engine
// ----------------------------------------------------------------------------

export function calculateFFTThickness(
  dataPoints: XRRDataPoint[],
  maxThicknessOrWavelength: number = 1200,
  stepA: number = 2.0
): FFTThicknessResult | null {
  // Handle callers that pass wavelength (e.g. 1.5406 Å) as 2nd parameter instead of maxThicknessA
  const maxThicknessA = maxThicknessOrWavelength < 25 ? 1200 : maxThicknessOrWavelength;
  const wavelength = maxThicknessOrWavelength < 25 && maxThicknessOrWavelength > 0 ? maxThicknessOrWavelength : 1.54056;

  const critInfo = detectCriticalAngle(dataPoints, wavelength);
  const qzCrit = critInfo?.qzCrit ?? 0.031;

  const valid = dataPoints.filter(p => p.qz > qzCrit * 1.08 && p.qz <= 0.65);
  if (valid.length < 25) return null;

  // Transform to refraction-corrected wavevector q_z' = sqrt(q_z^2 - q_c^2)
  const refractedPts = valid.map(pt => {
    const qzPrime = Math.sqrt(Math.max(0, pt.qz * pt.qz - qzCrit * qzCrit));
    const normVal =
      pt.fresnelR && pt.fresnelR > 1e-11
        ? pt.rCalc / pt.fresnelR
        : pt.rCalc * Math.pow(Math.max(0.01, pt.qz), 4);
    return {
      qzPrime,
      val: Math.log10(Math.max(1e-8, normVal))
    };
  });

  const minQp = refractedPts[0].qzPrime;
  const maxQp = refractedPts[refractedPts.length - 1].qzPrime;
  if (maxQp - minQp <= 0.02) return null;

  const numGrid = 512;
  const deltaQp = (maxQp - minQp) / (numGrid - 1);

  // Linear interpolation onto uniform refraction-corrected wavevector grid
  const uniformVals: number[] = [];
  let cursor = 0;
  for (let i = 0; i < numGrid; i++) {
    const qTarget = minQp + i * deltaQp;
    while (cursor < refractedPts.length - 2 && refractedPts[cursor + 1].qzPrime < qTarget) {
      cursor++;
    }
    const p0 = refractedPts[cursor];
    const p1 = refractedPts[Math.min(refractedPts.length - 1, cursor + 1)];
    const span = p1.qzPrime - p0.qzPrime;
    const t = span > 1e-9 ? Math.max(0, Math.min(1, (qTarget - p0.qzPrime) / span)) : 0;
    uniformVals.push(p0.val + t * (p1.val - p0.val));
  }

  // Linear detrend + Hann window to suppress DC & spectral leakage
  const meanVal = uniformVals.reduce((sum, v) => sum + v, 0) / numGrid;
  const windowed: number[] = [];
  for (let i = 0; i < numGrid; i++) {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (numGrid - 1)));
    windowed.push((uniformVals[i] - meanVal) * hann);
  }

  const spatialFrequencies: FFTThicknessResult['spatialFrequencies'] = [];
  let maxAmp = 0;

  for (let z = 10; z <= maxThicknessA; z += stepA) {
    let re = 0;
    let im = 0;

    for (let k = 0; k < numGrid; k++) {
      const qp = minQp + k * deltaQp;
      const phase = qp * z;
      re += windowed[k] * Math.cos(phase);
      im += windowed[k] * Math.sin(phase);
    }

    const amplitude = Math.sqrt(re * re + im * im) * deltaQp;
    if (amplitude > maxAmp) maxAmp = amplitude;

    spatialFrequencies.push({
      thicknessA: z,
      amplitude,
      normalizedAmp: 0
    });
  }

  const normalized = spatialFrequencies.map(f => ({
    ...f,
    normalizedAmp: maxAmp > 0 ? Number(((f.amplitude / maxAmp) * 100).toFixed(2)) : 0
  }));

  // Estimate baseline noise level for physical SNR computation
  const sortedAmps = [...normalized.map(n => n.normalizedAmp)].sort((a, b) => a - b);
  const medianNoise = Math.max(1.5, sortedAmps[Math.floor(sortedAmps.length * 0.5)] || 2.5);

  const detectedPeaks: FFTThicknessResult['detectedPeaks'] = [];
  for (let i = 2; i < normalized.length - 2; i++) {
    const curr = normalized[i].normalizedAmp;
    const prev1 = normalized[i - 1].normalizedAmp;
    const next1 = normalized[i + 1].normalizedAmp;
    if (
      curr > 12 &&
      curr > prev1 &&
      curr > normalized[i - 2].normalizedAmp &&
      curr > next1 &&
      curr > normalized[i + 2].normalizedAmp
    ) {
      // Parabolic vertex refinement of real-space thickness peak z*
      const denom = prev1 - 2 * curr + next1;
      const deltaIdx =
        Math.abs(denom) > 1e-12
          ? Math.max(-0.5, Math.min(0.5, (0.5 * (prev1 - next1)) / denom))
          : 0;
      const refinedZ = Number((normalized[i].thicknessA + deltaIdx * stepA).toFixed(1));
      const peakAmp = Number((curr - 0.25 * (prev1 - next1) * deltaIdx).toFixed(1));

      // True half-maximum FWHM measurement
      const halfMax = curr * 0.5;
      let leftIdx = i;
      while (leftIdx > 0 && normalized[leftIdx].normalizedAmp > halfMax) leftIdx--;
      let rightIdx = i;
      while (rightIdx < normalized.length - 1 && normalized[rightIdx].normalizedAmp > halfMax) rightIdx++;
      const fwhm = Number(Math.max(stepA * 2, (rightIdx - leftIdx) * stepA).toFixed(1));

      detectedPeaks.push({
        thicknessA: refinedZ,
        thicknessNm: Number((refinedZ / 10).toFixed(2)),
        amplitude: peakAmp,
        snr: Number((peakAmp / medianNoise).toFixed(1)),
        fwhm,
        label:
          detectedPeaks.length === 0
            ? 'Primary Film / Stack Thickness'
            : `Sublayer / Sum Harmonic ${detectedPeaks.length + 1}`
      });
    }
  }

  detectedPeaks.sort((a, b) => b.amplitude - a.amplitude);

  return {
    spatialFrequencies: normalized,
    detectedPeaks: detectedPeaks.slice(0, 5),
    maxThickness: maxThicknessA
  };
}

// ----------------------------------------------------------------------------
// Critical Angle & Surface Density Detection
// ----------------------------------------------------------------------------

export function detectCriticalAngle(
  dataPoints: XRRDataPoint[],
  wavelength: number = 1.54056
): CriticalAngleResult | null {
  if (dataPoints.length < 10) return null;

  // Infer wavelength from dataPoints[0] (qz = 4π sinθ / λ) if not explicitly provided
  let wl = wavelength;
  const refPt = dataPoints.find(p => p.theta > 0.2 && p.qz > 0.01);
  if (refPt) {
    const inferred = (4 * Math.PI * Math.sin((refPt.theta * Math.PI) / 180)) / refPt.qz;
    if (inferred > 0.2 && inferred < 5.0) {
      wl = inferred;
    }
  }

  // Locate critical edge where R(θ) drops through ~0.5 of plateau and d(log10 R)/dθ is steepest
  const rPlateau = Math.max(dataPoints[0].rCalc, dataPoints[1]?.rCalc ?? 0, 1e-6);
  let bestIdx = 1;
  let maxScore = -Infinity;

  for (let i = 1; i < dataPoints.length - 1; i++) {
    const theta = dataPoints[i].theta;
    if (theta < 0.08 || theta > 1.25) continue;
    const dTheta = dataPoints[i + 1].theta - dataPoints[i - 1].theta;
    if (dTheta <= 0) continue;

    const linearDropSlope = (dataPoints[i - 1].rCalc - dataPoints[i + 1].rCalc) / (dTheta * rPlateau);
    if (linearDropSlope > maxScore) {
      maxScore = linearDropSlope;
      bestIdx = i;
    }
  }

  // Sub-grid parabolic refinement on the negative derivative around bestIdx
  const slopeAt = (idx: number) => {
    if (idx <= 0 || idx >= dataPoints.length - 1) return 0;
    const dt = dataPoints[idx + 1].theta - dataPoints[idx - 1].theta;
    return dt > 0 ? (dataPoints[idx - 1].rCalc - dataPoints[idx + 1].rCalc) / dt : 0;
  };

  const sPrev = slopeAt(bestIdx - 1);
  const sCurr = slopeAt(bestIdx);
  const sNext = slopeAt(bestIdx + 1);
  const denom = sPrev - 2 * sCurr + sNext;
  const frac =
    Math.abs(denom) > 1e-18
      ? Math.max(-0.5, Math.min(0.5, (0.5 * (sPrev - sNext)) / denom))
      : 0;

  const stepTh = dataPoints[Math.min(dataPoints.length - 1, bestIdx + 1)].theta - dataPoints[bestIdx].theta;
  const thetaCritDeg = Math.max(0.05, dataPoints[bestIdx].theta + frac * stepTh);
  const thetaCritRad = (thetaCritDeg * Math.PI) / 180;
  const sinThetaCrit = Math.sin(thetaCritRad);
  const qzCrit = (4 * Math.PI * sinThetaCrit) / wl;

  // Exact Snell law: cos(θ_c) = 1 - δ  =>  δ = 1 - cos(θ_c) ≈ 0.5 * sin²(θ_c)
  const deltaEst = 1.0 - Math.cos(thetaCritRad);
  const r_e = 2.8179403262e-5; // Å
  const electronDensityEst = (2 * Math.PI * deltaEst) / (r_e * wl * wl);
  const densityEst = Math.min(24, Math.max(0.4, electronDensityEst / 0.2998));

  return {
    thetaCritDeg: Number(thetaCritDeg.toFixed(3)),
    qzCrit: Number(qzCrit.toFixed(4)),
    deltaEst: Number((deltaEst * 1e6).toFixed(2)),
    densityEst: Number(densityEst.toFixed(2)),
    electronDensityEst: Number(electronDensityEst.toFixed(3))
  };
}

// ----------------------------------------------------------------------------
// Goodness-of-Fit Quality Assessment
// ----------------------------------------------------------------------------

export function calculateFitQuality(points: XRRDataPoint[]): FitQualityResult {
  const valid = points.filter(p => p.rExp !== undefined && p.rExp > 0 && p.rCalc > 0);
  if (valid.length === 0) {
    return { logRmse: 0, rwp: 0, chiSquare: 0, rSquared: 0, numPoints: 0 };
  }

  let sumLogSq = 0;
  let sumDiffSq = 0;
  let sumExpSq = 0;
  let sumChiSq = 0;

  const logExpVals = valid.map(p => Math.log10(p.rExp!));
  const meanLogExp = logExpVals.reduce((a, b) => a + b, 0) / logExpVals.length;
  let ssTotLog = 0;

  for (let i = 0; i < valid.length; i++) {
    const p = valid[i];
    const logCalc = Math.log10(p.rCalc);
    const logExp = logExpVals[i];

    const diffLog = logCalc - logExp;
    sumLogSq += diffLog * diffLog;

    const diffLinear = p.rCalc - p.rExp!;
    sumDiffSq += diffLinear * diffLinear;
    sumExpSq += p.rExp! * p.rExp!;

    const variance = Math.max(1e-12, p.rExp!);
    sumChiSq += (diffLinear * diffLinear) / variance;

    ssTotLog += (logExp - meanLogExp) * (logExp - meanLogExp);
  }

  const logRmse = Math.sqrt(sumLogSq / valid.length);
  const rwp = Math.sqrt(sumDiffSq / (sumExpSq || 1)) * 100;
  const chiSquare = sumChiSq / Math.max(1, valid.length - 5);
  const rSquared = ssTotLog > 0 ? Math.max(0, 1 - sumLogSq / ssTotLog) : 0.99;

  return {
    logRmse: Number(logRmse.toFixed(4)),
    rwp: Number(rwp.toFixed(2)),
    chiSquare: Number(chiSquare.toFixed(2)),
    rSquared: Number(rSquared.toFixed(4)),
    numPoints: valid.length
  };
}

// ----------------------------------------------------------------------------
// Superlattice Periodic Multilayer Satellite Peaks
// ----------------------------------------------------------------------------

export function calculateSuperlatticeBraggPeaks(
  layers: XRRLayer[],
  config: XRRSimulationConfig
): { period: number; peaks: SuperlatticePeak[] } | null {
  if (layers.length < 3) return null;

  const films = layers.slice(0, -1);
  if (films.length < 2) return null;

  const period = films[0].thickness + films[1].thickness;
  if (period <= 10) return null;

  const peaks: SuperlatticePeak[] = [];
  const wavelength = config.wavelength;

  const avgDelta = films.reduce((sum, f) => sum + f.delta * (f.thickness / period), 0) * 1e-6;

  for (let m = 1; m <= 8; m++) {
    const sinThetaApprox = (m * wavelength) / (2 * period);
    if (sinThetaApprox >= 0.99) break;

    const sinThetaCorr = Math.sqrt(sinThetaApprox * sinThetaApprox + 2 * avgDelta);
    if (sinThetaCorr >= 0.99) break;

    const thetaRad = Math.asin(sinThetaCorr);
    const thetaDeg = (thetaRad * 180) / Math.PI;
    const qz = (4 * Math.PI * Math.sin(thetaRad)) / wavelength;

    if (thetaDeg >= config.angleStart && thetaDeg <= config.angleEnd) {
      peaks.push({
        order: m,
        thetaDeg: Number(thetaDeg.toFixed(3)),
        twoThetaDeg: Number((thetaDeg * 2).toFixed(3)),
        qz: Number(qz.toFixed(4)),
        label: `SL-${m}`
      });
    }
  }

  return { period: Number(period.toFixed(1)), peaks };
}

// ----------------------------------------------------------------------------
// Monte Carlo Sensitivity & Uncertainty Envelope
// ----------------------------------------------------------------------------

export function calculateMonteCarloConfidenceEnvelope(
  layers: XRRLayer[],
  config: XRRSimulationConfig,
  variationPercent: number = 5.0,
  numSimulations: number = 30
): XRRDataPoint[] {
  const baseCurve = calculateReflectivityCurve(layers, config);
  if (baseCurve.length === 0) return [];

  const allCurves: number[][] = [];

  for (let s = 0; s < numSimulations; s++) {
    const perturbedLayers = layers.map(l => {
      if (l.thickness === 0) return l;
      const pThick = Math.max(5, l.thickness * (1 + (Math.random() - 0.5) * 2 * (variationPercent / 100)));
      const pRough = Math.max(0.2, l.roughness * (1 + (Math.random() - 0.5) * 2 * (variationPercent / 100)));
      const pDens = Math.max(0.1, l.density * (1 + (Math.random() - 0.5) * 2 * (variationPercent / 100)));
      const ratio = pDens / (l.density || 1);
      return {
        ...l,
        thickness: pThick,
        roughness: pRough,
        density: pDens,
        delta: Math.max(0, l.delta * ratio),
        beta: Math.max(0, l.beta * ratio)
      };
    });

    const sim = calculateReflectivityCurve(perturbedLayers, config);
    allCurves.push(sim.map(pt => pt.rCalc));
  }

  return baseCurve.map((pt, i) => {
    const valsAtIndex = allCurves.map(c => c[i] || pt.rCalc).sort((a, b) => a - b);
    const minIdx = Math.floor(valsAtIndex.length * 0.05);
    const maxIdx = Math.floor(valsAtIndex.length * 0.95);
    return {
      ...pt,
      rCalcMin: valsAtIndex[minIdx] ?? pt.rCalc,
      rCalcMax: valsAtIndex[maxIdx] ?? pt.rCalc
    };
  });
}

// ----------------------------------------------------------------------------
// Multi-Platform Simulation Code Generators (Refnx, GenX, BornAgain, SciPy)
// ----------------------------------------------------------------------------

export function generatePythonXRRScript(layers: XRRLayer[], config: XRRSimulationConfig): string {
  const filmCode = layers.slice(0, -1).map((l, idx) => `
# Layer ${idx + 1}: ${l.name}
layer_${idx + 1} = refnx.reflect.SLD(${l.delta * 1e-2} + ${l.beta * 1e-2}j, name='${l.name}')(${l.thickness}, ${l.roughness})
`).join('');

  const subLayer = layers[layers.length - 1];

  return `import numpy as np
import matplotlib.pyplot as plt

# ==============================================================================
# X-Ray Reflectometry (XRR) Simulation & Parratt Fitting Script (Refnx)
# Generated by XRD-Calc Pro • Quantum Crystallography Labs
# ==============================================================================

try:
    import refnx.reflect
    HAS_REFNX = True
except ImportError:
    HAS_REFNX = False

wavelength = ${config.wavelength}  # Å (${config.radiationSource?.toUpperCase() || 'Cu K-alpha1'})
angles = np.linspace(${config.angleStart}, ${config.angleEnd}, 600)  # degrees
qz = (4 * np.pi * np.sin(np.radians(angles))) / wavelength

print(f"XRR Simulation Range: {angles[0]:.3f}° to {angles[-1]:.3f}° θ")
print("Stack Architecture:")
${layers.map((l, i) => `print(f"  [${i + 1}] ${l.name}: Thickness = ${l.thickness} Å, Roughness = ${l.roughness} Å, Density = ${l.density} g/cm³")`).join('\n')}

if HAS_REFNX:
    print("\\nRunning Refnx Optical Parratt Model...")
    # Ambient Medium (Air / Vacuum)
    air = refnx.reflect.SLD(0, name='Air')
    
    # Substrate Layer
    substrate = refnx.reflect.SLD(
        ${subLayer ? subLayer.delta * 1e-2 : 7.56} + ${subLayer ? subLayer.beta * 1e-2 : 0.17}j,
        name='${subLayer ? subLayer.name : 'Substrate'}'
    )(0, ${subLayer ? subLayer.roughness : 3.0})
    
    ${filmCode}
    
    # Assemble Multilayer Sample Stack
    structure = air | ${layers.slice(0, -1).map((_, i) => `layer_${i + 1}`).join(' | ')} | substrate
    model = refnx.reflect.ReflectModel(structure, bkg=${config.background}, dq=${config.beamDivergence})
    
    # Compute Specular Reflectivity R(qz)
    reflectivity = model(qz)
    
    # Plotting
    plt.figure(figsize=(9, 6), dpi=120)
    plt.semilogy(angles, reflectivity, 'b-', label='Parratt Model (Refnx)', lw=2.2)
    plt.xlabel('Incident Angle θ (°)', fontsize=12, fontweight='bold')
    plt.ylabel('Specular Reflectivity R', fontsize=12, fontweight='bold')
    plt.title('XRR Thin Film Reflectivity Curve (Parratt Recursion)', fontsize=14, fontweight='bold')
    plt.grid(True, which='both', ls='--', alpha=0.5)
    plt.legend(frameon=True, fontsize=11)
    plt.tight_layout()
    plt.show()
else:
    print("\\n[Note] Install refnx via: pip install refnx matplotlib numpy")
`;
}

export function generateGenXScript(layers: XRRLayer[], config: XRRSimulationConfig): string {
  const films = layers.slice(0, -1);
  const sub = layers[layers.length - 1];

  return `# ==============================================================================
# GenX Differential Evolution XRR Parameter Refinement Script
# Generated by XRD-Calc Pro • Quantum Crystallography Labs
# ==============================================================================

import numpy as np

# Specular Model Definition for GenX
# Wavelength: ${config.wavelength} Å
# Target Stack: ${layers.length - 1} thin film(s) on ${sub?.name || 'Substrate'}

layers_config = [
${films.map((l, i) => `    {"name": "${l.name}", "d": ${l.thickness}, "sigma": ${l.roughness}, "dens": ${l.density}, "f1": ${l.delta}, "f2": ${l.beta}},`).join('\n')}
    {"name": "${sub?.name || 'Substrate'}", "d": 0.0, "sigma": ${sub?.roughness || 3.0}, "dens": ${sub?.density || 2.33}, "f1": ${sub?.delta || 7.56}, "f2": ${sub?.beta || 0.17}}
]

print("Initialized GenX Multilayer Optimization Model.")
`;
}

export function generateBornAgainScript(layers: XRRLayer[], config: XRRSimulationConfig): string {
  return `# ==============================================================================
# BornAgain Framework XRR Simulation Script
# Generated by XRD-Calc Pro • Quantum Crystallography Labs
# ==============================================================================

import bornagain as ba
from bornagain import deg, angstrom, nm

def get_sample():
    m_ambient = ba.RefractiveMaterial("Vacuum", 0.0, 0.0)
    l_ambient = ba.Layer(m_ambient)

    multi_layer = ba.MultiLayer()
    multi_layer.addLayer(l_ambient)

${layers.slice(0, -1).map((l, i) => `    # Layer ${i + 1}: ${l.name}
    m_${i + 1} = ba.RefractiveMaterial("${l.name}", ${l.delta * 1e-6}, ${l.beta * 1e-7})
    l_${i + 1} = ba.Layer(m_${i + 1}, ${(l.thickness / 10).toFixed(2)} * nm)
    r_${i + 1} = ba.LayerRoughness(${(l.roughness / 10).toFixed(3)} * nm, 0.7, 10.0 * nm)
    multi_layer.addLayerWithTopRoughness(l_${i + 1}, r_${i + 1})`).join('\n\n')}

    sub_mat = ba.RefractiveMaterial("Substrate", ${layers[layers.length - 1]?.delta * 1e-6 || 7.56e-6}, ${layers[layers.length - 1]?.beta * 1e-7 || 1.7e-7})
    sub_layer = ba.Layer(sub_mat)
    sub_rough = ba.LayerRoughness(${((layers[layers.length - 1]?.roughness || 3.0) / 10).toFixed(3)} * nm, 0.7, 10.0 * nm)
    multi_layer.addLayerWithTopRoughness(sub_layer, sub_rough)

    return multi_layer

print("BornAgain Multilayer Sample Stack compiled.")
`;
}

export function generateLatexTable(
  layers: XRRLayer[],
  quality?: FitQualityResult,
  kiessig?: KiessigAnalysisResult | null,
  crit?: CriticalAngleResult | null
): string {
  const films = layers.slice(0, -1);
  const sub = layers[layers.length - 1];

  let latex = `\\begin{table}[htbp]
\\centering
\\caption{Structural and Optical Parameters Extracted from X-Ray Reflectometry (XRR) Analysis.}
\\label{tab:xrr_results}
\\begin{tabular}{lcccccc}
\\hline\\hline
\\textbf{Layer} & \\textbf{Thickness $d$ (\\AA)} & \\textbf{Roughness $\\sigma$ (\\AA)} & \\textbf{Density $\\rho$ (g/cm$^3$)} & \\textbf{$\\delta$ ($\\times 10^{-6}$)} & \\textbf{$\\beta$ ($\\times 10^{-7}$)} & \\textbf{$\\rho_e$ ($e^-$/\\AA$^3$)} \\\\
\\hline
`;

  films.forEach((l) => {
    const rho_e = (0.285 * l.density).toFixed(3);
    latex += `${l.name} & ${l.thickness.toFixed(1)} & ${l.roughness.toFixed(2)} & ${l.density.toFixed(2)} & ${l.delta.toFixed(2)} & ${l.beta.toFixed(3)} & ${rho_e} \\\\\n`;
  });

  if (sub) {
    const rho_e_sub = (0.285 * sub.density).toFixed(3);
    latex += `${sub.name} (Sub.) & -- & ${sub.roughness.toFixed(2)} & ${sub.density.toFixed(2)} & ${sub.delta.toFixed(2)} & ${sub.beta.toFixed(3)} & ${rho_e_sub} \\\\\n`;
  }

  latex += `\\hline
`;

  if (kiessig) {
    latex += `\\multicolumn{7}{l}{\\small Kiessig Total Thickness: $d_{\\text{Kiessig}} = ${kiessig.estimatedThickness}\\text{ \\AA}$, $\\Delta q_z = ${kiessig.periodQz}\\text{ \\AA}^{-1}$} \\\\\n`;
  }
  if (crit) {
    latex += `\\multicolumn{7}{l}{\\small Critical Angle: $\\theta_c = ${crit.thetaCritDeg}^\\circ$, Surface Density: $\\rho_{\\text{est}} = ${crit.densityEst}\\text{ g/cm}^3$} \\\\\n`;
  }
  if (quality && quality.numPoints > 0) {
    latex += `\\multicolumn{7}{l}{\\small Goodness of Fit: $\\text{Log-RMSE} = ${quality.logRmse}$, $R_{wp} = ${quality.rwp}\\%$, $\\chi^2 = ${quality.chiSquare}$, $R^2 = ${quality.rSquared}$} \\\\\n`;
  }

  latex += `\\hline\\hline
\\end{tabular}
\\end{table}
`;

  return latex;
}

export const estimateOpticalConstantsFromFormula = calculateOpticalConstantsFromFormula;


// ----------------------------------------------------------------------------
// Backward Compatibility Aliases & Helpers
// ----------------------------------------------------------------------------
export type SLDProfilePoint = SLDPoint;
export const calculateKiessigFringes = analyzeKiessigFringes;
export const calculateCriticalAngle = detectCriticalAngle;

export interface XRRStackPreset {
  id: string;
  name: string;
  description: string;
  layers: XRRLayer[];
}

export const PRESET_STACKS: XRRStackPreset[] = [
  {
    id: 'single_film',
    name: 'Single Film: 50nm TiO₂ / Si(001)',
    description: 'Standard 50 nm TiO₂ thin film on native oxide Silicon (001) wafer.',
    layers: [
      { id: 'layer-1', name: 'TiO₂ Film', formula: 'TiO2', thickness: 500, roughness: 3.5, density: 4.23, delta: 14.5, beta: 0.32 },
      { id: 'layer-2', name: 'SiO₂ Native Oxide', formula: 'SiO2', thickness: 20, roughness: 2.5, density: 2.20, delta: 7.18, beta: 0.15 },
      { id: 'layer-sub', name: 'Si (001) Substrate', formula: 'Si', thickness: 0, roughness: 2.0, density: 2.33, delta: 7.56, beta: 0.17 }
    ]
  },
  {
    id: 'bilayer_highk',
    name: 'High-k Bilayer: HfO₂ / Al₂O₃ / Si',
    description: 'High-k dielectric gate stack with 15 nm HfO₂ capping layer and 3 nm Al₂O₃ interfacial barrier.',
    layers: [
      { id: 'layer-1', name: 'HfO₂ Cap', formula: 'HfO2', thickness: 150, roughness: 4.0, density: 9.68, delta: 28.5, beta: 2.10 },
      { id: 'layer-2', name: 'Al₂O₃ Barrier', formula: 'Al2O3', thickness: 30, roughness: 2.8, density: 3.98, delta: 12.8, beta: 0.22 },
      { id: 'layer-sub', name: 'Si Substrate', formula: 'Si', thickness: 0, roughness: 2.2, density: 2.33, delta: 7.56, beta: 0.17 }
    ]
  },
  {
    id: 'superlattice',
    name: 'Periodic Multilayer: [Mo/Si] × 10 Superlattice',
    description: 'EUV mirror Bragg multilayer stack with alternating 3.5 nm Mo and 4.5 nm Si bilayers.',
    layers: [
      { id: 'layer-1', name: 'Mo (Layer 1)', formula: 'Mo', thickness: 35, roughness: 3.2, density: 10.2, delta: 29.5, beta: 1.85 },
      { id: 'layer-2', name: 'Si (Layer 1)', formula: 'Si', thickness: 45, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.17 },
      { id: 'layer-3', name: 'Mo (Layer 2)', formula: 'Mo', thickness: 35, roughness: 3.2, density: 10.2, delta: 29.5, beta: 1.85 },
      { id: 'layer-4', name: 'Si (Layer 2)', formula: 'Si', thickness: 45, roughness: 3.0, density: 2.33, delta: 7.56, beta: 0.17 },
      { id: 'layer-sub', name: 'Fused Silica Substrate', formula: 'SiO2', thickness: 0, roughness: 2.5, density: 2.20, delta: 7.18, beta: 0.15 }
    ]
  },
  {
    id: 'metal_capping',
    name: 'Spintronic Stack: Pt / CoFeB / MgO / Substrate',
    description: 'Magnetic tunnel junction structure with heavy metal spin-Hall Pt top contact.',
    layers: [
      { id: 'layer-1', name: 'Pt Cap', formula: 'Pt', thickness: 50, roughness: 3.8, density: 21.45, delta: 49.5, beta: 4.80 },
      { id: 'layer-2', name: 'CoFeB Ferromagnet', formula: 'CoFeB', thickness: 30, roughness: 2.5, density: 8.20, delta: 24.2, beta: 1.15 },
      { id: 'layer-3', name: 'MgO Tunnel Barrier', formula: 'MgO', thickness: 15, roughness: 2.2, density: 3.58, delta: 11.2, beta: 0.18 },
      { id: 'layer-sub', name: 'Si / SiO₂ Substrate', formula: 'Si', thickness: 0, roughness: 2.0, density: 2.33, delta: 7.56, beta: 0.17 }
    ]
  }
];

/**
 * Robust Multi-Format XRR Experimental Data Parser
 * Supports: .dat, .csv, .xy, .txt, Rigaku .ras, PANalytical .xrdml
 */
export function parseXRRDataFile(content: string, wavelength: number = 1.54056): { theta: number; qz: number; intensity: number }[] {
  const points: { theta: number; qz: number; intensity: number }[] = [];
  const lines = content.split(/\r?\n/);

  let isTwoTheta = false;
  let isQz = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
      if (trimmed.toLowerCase().includes('2theta') || trimmed.toLowerCase().includes('2-theta')) {
        isTwoTheta = true;
      }
      if (trimmed.toLowerCase().includes('qz') || trimmed.toLowerCase().includes('q_z')) {
        isQz = true;
      }
      continue;
    }

    const parts = trimmed.split(/[\s,;\t]+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      const xVal = parseFloat(parts[0]);
      const yVal = parseFloat(parts[1]);

      if (!isNaN(xVal) && !isNaN(yVal) && yVal >= 0) {
        let theta = xVal;
        let qz = 0;

        if (isTwoTheta || xVal > 8.0) {
          // If angles are given in 2θ, convert to θ
          theta = xVal / 2.0;
          qz = (4 * Math.PI / wavelength) * Math.sin((theta * Math.PI) / 180);
        } else if (isQz || (xVal > 0.01 && xVal < 1.5 && parts[0].includes('.'))) {
          // If x is qz, convert to theta
          const sinTheta = (xVal * wavelength) / (4 * Math.PI);
          if (sinTheta >= 0 && sinTheta <= 1) {
            theta = (Math.asin(sinTheta) * 180) / Math.PI;
            qz = xVal;
          }
        } else {
          // Default: θ in degrees
          qz = (4 * Math.PI / wavelength) * Math.sin((theta * Math.PI) / 180);
        }

        if (theta > 0 && theta < 20) {
          points.push({ theta, qz, intensity: yVal });
        }
      }
    }
  }

  // Sort by theta ascending
  points.sort((a, b) => a.theta - b.theta);

  // Normalize intensity to maximum 1.0 if raw counts > 1.0
  if (points.length > 0) {
    const maxI = Math.max(...points.map(p => p.intensity));
    if (maxI > 1.0) {
      for (const p of points) {
        p.intensity = p.intensity / maxI;
      }
    }
  }

  return points;
}
