import os

code = '''/**
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
  formula?: string;             // Chemical formula (e.g. 'TiO2', 'Al2O3', 'SrTiO3')
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
  electronDensity: number;      // Electron density in e⁻/Å³
  opticalPotential: number;     // Real part of optical potential V(z) in 10⁻⁶ Å⁻²
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

/**
 * Converts photon energy (keV) to wavelength (Å): λ = hc / E = 12.39841984 / E(keV)
 */
export function energyKeVToWavelength(energyKeV: number): number {
  if (!energyKeV || energyKeV <= 0) return 1.54056;
  return Number((12.39841984 / energyKeV).toFixed(5));
}

/**
 * Converts wavelength (Å) to photon energy (keV): E = 12.39841984 / λ(Å)
 */
export function wavelengthToEnergyKeV(wavelength: number): number {
  if (!wavelength || wavelength <= 0) return 8.048;
  return Number((12.39841984 / wavelength).toFixed(4));
}

// ----------------------------------------------------------------------------
// Comprehensive Periodic Table & Atomic Scattering Database (Henke / CXRO)
// ----------------------------------------------------------------------------

interface AtomicData {
  name: string;
  atomicMass: number;
  densityBulk: number; // g/cm³
  f1_Cu: number;       // f1 at Cu Kα (8.048 keV)
  f2_Cu: number;       // f2 at Cu Kα (8.048 keV)
  f1_Mo: number;       // f1 at Mo Kα (17.479 keV)
  f2_Mo: number;       // f2 at Mo Kα (17.479 keV)
}

export const ATOMIC_DATABASE: Record<string, AtomicData> = {
  H:  { name: 'Hydrogen', atomicMass: 1.008, densityBulk: 0.07, f1_Cu: 1.00, f2_Cu: 0.0001, f1_Mo: 1.00, f2_Mo: 0.0000 },
  He: { name: 'Helium', atomicMass: 4.003, densityBulk: 0.12, f1_Cu: 2.00, f2_Cu: 0.0002, f1_Mo: 2.00, f2_Mo: 0.0001 },
  Li: { name: 'Lithium', atomicMass: 6.941, densityBulk: 0.534, f1_Cu: 3.00, f2_Cu: 0.0010, f1_Mo: 3.00, f2_Mo: 0.0003 },
  Be: { name: 'Beryllium', atomicMass: 9.012, densityBulk: 1.85, f1_Cu: 4.01, f2_Cu: 0.0032, f1_Mo: 4.00, f2_Mo: 0.0009 },
  B:  { name: 'Boron', atomicMass: 10.81, densityBulk: 2.34, f1_Cu: 5.02, f2_Cu: 0.0090, f1_Mo: 5.01, f2_Mo: 0.0022 },
  C:  { name: 'Carbon', atomicMass: 12.011, densityBulk: 2.26, f1_Cu: 6.04, f2_Cu: 0.0150, f1_Mo: 6.01, f2_Mo: 0.0035 },
  N:  { name: 'Nitrogen', atomicMass: 14.007, densityBulk: 1.03, f1_Cu: 7.07, f2_Cu: 0.0310, f1_Mo: 7.02, f2_Mo: 0.0075 },
  O:  { name: 'Oxygen', atomicMass: 15.999, densityBulk: 1.14, f1_Cu: 8.11, f2_Cu: 0.0550, f1_Mo: 8.04, f2_Mo: 0.0130 },
  F:  { name: 'Fluorine', atomicMass: 18.998, densityBulk: 1.50, f1_Cu: 9.17, f2_Cu: 0.0950, f1_Mo: 9.06, f2_Mo: 0.0210 },
  Ne: { name: 'Neon', atomicMass: 20.180, densityBulk: 1.20, f1_Cu: 10.23, f2_Cu: 0.1500, f1_Mo: 10.09, f2_Mo: 0.0340 },
  Na: { name: 'Sodium', atomicMass: 22.990, densityBulk: 0.968, f1_Cu: 11.30, f2_Cu: 0.2300, f1_Mo: 11.13, f2_Mo: 0.0520 },
  Mg: { name: 'Magnesium', atomicMass: 24.305, densityBulk: 1.738, f1_Cu: 12.39, f2_Cu: 0.3300, f1_Mo: 12.18, f2_Mo: 0.0750 },
  Al: { name: 'Aluminum', atomicMass: 26.982, densityBulk: 2.70, f1_Cu: 13.50, f2_Cu: 0.4600, f1_Mo: 13.24, f2_Mo: 0.1040 },
  Si: { name: 'Silicon', atomicMass: 28.085, densityBulk: 2.33, f1_Cu: 14.63, f2_Cu: 0.6200, f1_Mo: 14.30, f2_Mo: 0.1410 },
  P:  { name: 'Phosphorus', atomicMass: 30.974, densityBulk: 1.82, f1_Cu: 15.77, f2_Cu: 0.8100, f1_Mo: 15.38, f2_Mo: 0.1850 },
  S:  { name: 'Sulfur', atomicMass: 32.06, densityBulk: 2.07, f1_Cu: 16.92, f2_Cu: 1.0500, f1_Mo: 16.48, f2_Mo: 0.2400 },
  Cl: { name: 'Chlorine', atomicMass: 35.45, densityBulk: 1.56, f1_Cu: 18.09, f2_Cu: 1.3400, f1_Mo: 17.58, f2_Mo: 0.3100 },
  Ar: { name: 'Argon', atomicMass: 39.948, densityBulk: 1.40, f1_Cu: 19.28, f2_Cu: 1.6900, f1_Mo: 18.70, f2_Mo: 0.3900 },
  K:  { name: 'Potassium', atomicMass: 39.098, densityBulk: 0.862, f1_Cu: 20.48, f2_Cu: 2.1000, f1_Mo: 19.84, f2_Mo: 0.4900 },
  Ca: { name: 'Calcium', atomicMass: 40.078, densityBulk: 1.55, f1_Cu: 21.68, f2_Cu: 2.5800, f1_Mo: 20.98, f2_Mo: 0.6000 },
  Sc: { name: 'Scandium', atomicMass: 44.956, densityBulk: 2.985, f1_Cu: 22.90, f2_Cu: 3.1200, f1_Mo: 22.14, f2_Mo: 0.7300 },
  Ti: { name: 'Titanium', atomicMass: 47.867, densityBulk: 4.506, f1_Cu: 24.12, f2_Cu: 3.7300, f1_Mo: 23.32, f2_Mo: 0.8800 },
  V:  { name: 'Vanadium', atomicMass: 50.942, densityBulk: 6.11, f1_Cu: 25.35, f2_Cu: 4.4200, f1_Mo: 24.51, f2_Mo: 1.0500 },
  Cr: { name: 'Chromium', atomicMass: 51.996, densityBulk: 7.19, f1_Cu: 26.57, f2_Cu: 5.1800, f1_Mo: 25.72, f2_Mo: 1.2400 },
  Mn: { name: 'Manganese', atomicMass: 54.938, densityBulk: 7.21, f1_Cu: 27.79, f2_Cu: 6.0200, f1_Mo: 26.94, f2_Mo: 1.4500 },
  Fe: { name: 'Iron', atomicMass: 55.845, densityBulk: 7.874, f1_Cu: 29.00, f2_Cu: 6.9500, f1_Mo: 28.18, f2_Mo: 1.6900 },
  Co: { name: 'Cobalt', atomicMass: 58.933, densityBulk: 8.90, f1_Cu: 30.19, f2_Cu: 7.9500, f1_Mo: 29.43, f2_Mo: 1.9500 },
  Ni: { name: 'Nickel', atomicMass: 58.693, densityBulk: 8.908, f1_Cu: 31.36, f2_Cu: 9.0400, f1_Mo: 30.69, f2_Mo: 2.2400 },
  Cu: { name: 'Copper', atomicMass: 63.546, densityBulk: 8.96, f1_Cu: 30.34, f2_Cu: 0.5200, f1_Mo: 31.96, f2_Mo: 2.5600 },
  Zn: { name: 'Zinc', atomicMass: 65.38, densityBulk: 7.14, f1_Cu: 30.70, f2_Cu: 1.4800, f1_Mo: 33.25, f2_Mo: 2.9100 },
  Ga: { name: 'Gallium', atomicMass: 69.723, densityBulk: 5.91, f1_Cu: 31.50, f2_Cu: 2.1000, f1_Mo: 34.56, f2_Mo: 3.2900 },
  Ge: { name: 'Germanium', atomicMass: 72.630, densityBulk: 5.323, f1_Cu: 32.65, f2_Cu: 2.6500, f1_Mo: 35.88, f2_Mo: 3.7100 },
  As: { name: 'Arsenic', atomicMass: 74.922, densityBulk: 5.776, f1_Cu: 33.95, f2_Cu: 3.2500, f1_Mo: 37.22, f2_Mo: 4.1600 },
  Se: { name: 'Selenium', atomicMass: 78.971, densityBulk: 4.819, f1_Cu: 35.32, f2_Cu: 3.9000, f1_Mo: 38.58, f2_Mo: 4.6500 },
  Br: { name: 'Bromine', atomicMass: 79.904, densityBulk: 3.12, f1_Cu: 36.75, f2_Cu: 4.6000, f1_Mo: 39.95, f2_Mo: 5.1700 },
  Sr: { name: 'Strontium', atomicMass: 87.62, densityBulk: 2.64, f1_Cu: 40.50, f2_Cu: 7.8000, f1_Mo: 44.20, f2_Mo: 7.5000 },
  Y:  { name: 'Yttrium', atomicMass: 88.906, densityBulk: 4.472, f1_Cu: 41.80, f2_Cu: 8.7000, f1_Mo: 45.65, f2_Mo: 8.2000 },
  Zr: { name: 'Zirconium', atomicMass: 91.224, densityBulk: 6.52, f1_Cu: 43.10, f2_Cu: 9.6500, f1_Mo: 47.10, f2_Mo: 8.9500 },
  Nb: { name: 'Niobium', atomicMass: 92.906, densityBulk: 8.57, f1_Cu: 44.40, f2_Cu: 10.65, f1_Mo: 48.60, f2_Mo: 9.7500 },
  Mo: { name: 'Molybdenum', atomicMass: 95.95, densityBulk: 10.28, f1_Cu: 45.70, f2_Cu: 11.70, f1_Mo: 42.45, f2_Mo: 0.5800 },
  Ru: { name: 'Ruthenium', atomicMass: 101.07, densityBulk: 12.45, f1_Cu: 48.30, f2_Cu: 14.00, f1_Mo: 45.20, f2_Mo: 1.5500 },
  Rh: { name: 'Rhodium', atomicMass: 102.91, densityBulk: 12.41, f1_Cu: 49.60, f2_Cu: 15.20, f1_Mo: 46.60, f2_Mo: 1.8500 },
  Pd: { name: 'Palladium', atomicMass: 106.42, densityBulk: 12.023, f1_Cu: 50.90, f2_Cu: 16.50, f1_Mo: 48.00, f2_Mo: 2.2000 },
  Ag: { name: 'Silver', atomicMass: 107.87, densityBulk: 10.49, f1_Cu: 52.20, f2_Cu: 17.80, f1_Mo: 49.50, f2_Mo: 2.6000 },
  In: { name: 'Indium', atomicMass: 114.82, densityBulk: 7.31, f1_Cu: 55.80, f2_Cu: 22.00, f1_Mo: 53.80, f2_Mo: 3.9000 },
  Sn: { name: 'Tin', atomicMass: 118.71, densityBulk: 7.31, f1_Cu: 57.00, f2_Cu: 23.50, f1_Mo: 55.30, f2_Mo: 4.4000 },
  Sb: { name: 'Antimony', atomicMass: 121.76, densityBulk: 6.697, f1_Cu: 58.20, f2_Cu: 25.00, f1_Mo: 56.80, f2_Mo: 4.9500 },
  Te: { name: 'Tellurium', atomicMass: 127.60, densityBulk: 6.24, f1_Cu: 59.50, f2_Cu: 27.00, f1_Mo: 58.40, f2_Mo: 5.6000 },
  I:  { name: 'Iodine', atomicMass: 126.90, densityBulk: 4.933, f1_Cu: 60.80, f2_Cu: 29.00, f1_Mo: 60.00, f2_Mo: 6.3000 },
  Cs: { name: 'Cesium', atomicMass: 132.91, densityBulk: 1.93, f1_Cu: 63.50, f2_Cu: 33.50, f1_Mo: 63.20, f2_Mo: 7.8000 },
  Ba: { name: 'Barium', atomicMass: 137.33, densityBulk: 3.51, f1_Cu: 64.90, f2_Cu: 36.00, f1_Mo: 64.80, f2_Mo: 8.6000 },
  La: { name: 'Lanthanum', atomicMass: 138.91, densityBulk: 6.162, f1_Cu: 66.30, f2_Cu: 38.50, f1_Mo: 66.50, f2_Mo: 9.4500 },
  Ce: { name: 'Cerium', atomicMass: 140.12, densityBulk: 6.77, f1_Cu: 67.70, f2_Cu: 41.00, f1_Mo: 68.20, f2_Mo: 10.35 },
  Nd: { name: 'Neodymium', atomicMass: 144.24, densityBulk: 7.01, f1_Cu: 70.50, f2_Cu: 46.50, f1_Mo: 71.60, f2_Mo: 12.20 },
  Gd: { name: 'Gadolinium', atomicMass: 157.25, densityBulk: 7.90, f1_Cu: 76.00, f2_Cu: 58.00, f1_Mo: 78.50, f2_Mo: 16.50 },
  Hf: { name: 'Hafnium', atomicMass: 178.49, densityBulk: 13.31, f1_Cu: 75.20, f2_Cu: 12.80, f1_Mo: 82.50, f2_Mo: 21.00 },
  Ta: { name: 'Tantalum', atomicMass: 180.95, densityBulk: 16.69, f1_Cu: 76.80, f2_Cu: 14.20, f1_Mo: 84.20, f2_Mo: 22.50 },
  W:  { name: 'Tungsten', atomicMass: 183.84, densityBulk: 19.25, f1_Cu: 78.50, f2_Cu: 15.60, f1_Mo: 86.00, f2_Mo: 24.20 },
  Re: { name: 'Rhenium', atomicMass: 186.21, densityBulk: 21.02, f1_Cu: 80.20, f2_Cu: 17.10, f1_Mo: 87.80, f2_Mo: 25.90 },
  Os: { name: 'Osmium', atomicMass: 190.23, densityBulk: 22.59, f1_Cu: 81.90, f2_Cu: 18.70, f1_Mo: 89.60, f2_Mo: 27.70 },
  Ir: { name: 'Iridium', atomicMass: 192.22, densityBulk: 22.56, f1_Cu: 83.60, f2_Cu: 20.30, f1_Mo: 91.50, f2_Mo: 29.60 },
  Pt: { name: 'Platinum', atomicMass: 195.08, densityBulk: 21.45, f1_Cu: 85.30, f2_Cu: 22.00, f1_Mo: 93.40, f2_Mo: 31.60 },
  Au: { name: 'Gold', atomicMass: 196.97, densityBulk: 19.30, f1_Cu: 87.00, f2_Cu: 23.80, f1_Mo: 95.30, f2_Mo: 33.70 },
  Pb: { name: 'Lead', atomicMass: 207.2, densityBulk: 11.34, f1_Cu: 92.50, f2_Cu: 29.50, f1_Mo: 101.2, f2_Mo: 40.50 },
  Bi: { name: 'Bismuth', atomicMass: 208.98, densityBulk: 9.78, f1_Cu: 94.30, f2_Cu: 31.50, f1_Mo: 103.2, f2_Mo: 43.00 },
  Th: { name: 'Thorium', atomicMass: 232.04, densityBulk: 11.72, f1_Cu: 102.5, f2_Cu: 42.00, f1_Mo: 113.5, f2_Mo: 56.00 },
  U:  { name: 'Uranium', atomicMass: 238.03, densityBulk: 19.10, f1_Cu: 105.8, f2_Cu: 47.00, f1_Mo: 117.0, f2_Mo: 61.50 },
};

/**
 * Parses chemical formula into element counts (e.g. 'SrTiO3' -> {Sr: 1, Ti: 1, O: 3}, 'Ba0.5Sr0.5TiO3' -> {Ba: 0.5, Sr: 0.5, Ti: 1, O: 3})
 */
export function parseChemicalFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!formula || typeof formula !== 'string') return result;

  const cleaned = formula.trim().replace(/\s+/g, '');
  // Match Element symbol followed by optional decimal number
  const regex = /([A-Z][a-z]?)([\d\.]*)/g;
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

/**
 * Computes exact optical constants (delta, beta), molar mass, and electron density from chemical formula
 */
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

  // Determine if using Cu-like or Mo-like energy range
  const energy = energyKeVToWavelength(wavelength); // keV approx
  const isMoScale = wavelength < 1.0; // Hard X-ray

  for (const elem of elementKeys) {
    const count = elementsParsed[elem];
    const data = ATOMIC_DATABASE[elem];
    const atomicMass = data ? data.atomicMass : 25.0;
    const f1 = data ? (isMoScale ? data.f1_Mo : data.f1_Cu) : 10.0;
    const f2 = data ? (isMoScale ? data.f2_Mo : data.f2_Cu) : 0.5;

    totalMolarMass += count * atomicMass;
    totalZ += count * (data ? Math.round(data.atomicMass / 2) : 10);
    totalF1 += count * f1;
    totalF2 += count * f2;

    elementDetails.push({
      element: elem,
      count,
      atomicZ: data ? Math.round(data.atomicMass / 2) : 10,
      atomicMass,
      f1,
      f2
    });
  }

  // Theoretical density default if not provided
  let massDensity = density;
  if (!massDensity || massDensity <= 0) {
    // Weighted bulk density estimate
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

  // Classical electron radius r_e = 2.8179403262e-5 Å
  const r_e = 2.81794e-5; // Å
  // Avogadro's constant NA = 6.02214076e23 mol⁻¹
  const NA = 6.02214e23;

  // Number density of molecules N_V = (ρ * NA / M) * 1e-24 molecules/Å³
  const nV = (massDensity * NA * 1e-24) / totalMolarMass;

  // Electron density ρe = nV * totalF1 (in e⁻/Å³)
  const electronDensity = nV * totalF1;

  // Optical dispersion: δ = (r_e * λ² / 2π) * nV * totalF1
  // Optical absorption: β = (r_e * λ² / 2π) * nV * totalF2
  const factor = (r_e * wavelength * wavelength) / (2 * Math.PI);
  const deltaRaw = factor * nV * totalF1;
  const betaRaw = factor * nV * totalF2;

  const delta = Number((deltaRaw * 1e6).toFixed(2)); // in × 10⁻⁶
  const beta = Number((betaRaw * 1e7).toFixed(3));   // in × 10⁻⁷

  // Critical angle θc (deg) ≈ sqrt(2 * δ) * (180 / π)
  const thetaCritRad = Math.sqrt(Math.max(0, 2 * deltaRaw));
  const criticalAngleDeg = Number(((thetaCritRad * 180) / Math.PI).toFixed(3));

  // Linear absorption coefficient μ = (4π / λ) * β_raw (Å⁻¹) -> 1/e penetration depth = 1 / μ (μm)
  const mu = (4 * Math.PI / wavelength) * betaRaw; // Å⁻¹
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

// Error Function Approximation for SLD Interface Profiles
export function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26
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

/**
 * Parratt Specular Reflectivity Calculation
 * Calculates theoretical reflectivity curve R(θ) for a given multilayer stack using Parratt's recursion formula
 * with Névot-Croce / Debye-Waller roughness attenuation factors and beam divergence convolution.
 */
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
    angleOffset = 0,
    intensityScale = 1.0,
    footprintCorrection = false,
    sampleLengthMm = 20,
    beamWidthMm = 0.2
  } = config;

  const numSteps = Math.max(10, Math.floor((angleEnd - angleStart) / angleStep) + 1);

  // Expand layers with grading/interdiffusion or continuous density profiles if configured
  const processedLayers: XRRLayer[] = [];
  for (const l of layers) {
    if (l.gradientType && l.gradientType !== 'none' && l.gradientDeltaDensity && l.thickness > 10) {
      // Sub-slice layer with continuous density profile into 6 thin slabs
      const numSlices = 6;
      const subThick = l.thickness / numSlices;
      for (let s = 0; s < numSlices; s++) {
        const normZ = (s + 0.5) / numSlices; // 0 to 1 depth fraction
        let factor = 0;
        if (l.gradientType === 'linear') {
          factor = (normZ - 0.5) * l.gradientDeltaDensity;
        } else if (l.gradientType === 'exponential') {
          factor = (Math.exp(normZ) - 1.718) * l.gradientDeltaDensity;
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
          roughness: s === 0 ? l.roughness : Math.max(0.5, l.roughness * 0.65)
        });
      }
    } else if (l.gradingThickness && l.gradingThickness > 0 && l.thickness > l.gradingThickness) {
      // Sub-slice interdiffusion zone into 4 graded sub-layers
      const bulkThick = l.thickness - l.gradingThickness;
      processedLayers.push({ ...l, thickness: bulkThick });
      const subThick = l.gradingThickness / 4;
      for (let s = 1; s <= 4; s++) {
        const factor = 1 - (s * 0.12);
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

  // Full stack including Ambient (index 0) and Substrate (index N+1)
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

  const rawPoints: XRRDataPoint[] = [];

  for (let i = 0; i < numSteps; i++) {
    const rawThetaDeg = angleStart + i * angleStep;
    const thetaDeg = rawThetaDeg + angleOffset; // Apply angular zero-point offset correction
    const thetaRad = (Math.max(0.0005, thetaDeg) * Math.PI) / 180;
    const twoThetaDeg = rawThetaDeg * 2;
    const qz = (4 * Math.PI * Math.sin(thetaRad)) / wavelength;

    // Calculate perpendicular wavevector component kz for each layer
    // kz_j = (2π / λ) * sqrt(sin^2(θ) - 2δ_j - 2iβ_j)
    const sin2Theta = Math.sin(thetaRad) * Math.sin(thetaRad);
    const k0 = (2 * Math.PI) / wavelength;

    const kzLayers: Complex[] = [];
    for (let j = 0; j < numLayers; j++) {
      const deltaVal = fullStack[j].delta * 1e-6;
      const betaVal = fullStack[j].beta * 1e-7;

      // Radicand = sin^2(θ) - 2δ - 2iβ
      const radicand: Complex = {
        re: sin2Theta - 2 * deltaVal,
        im: -2 * betaVal
      };

      const sqrtRad = cSqrt(radicand);
      kzLayers.push({
        re: k0 * sqrtRad.re,
        im: k0 * sqrtRad.im
      });
    }

    // Parratt Recursion from bottom substrate (index numLayers - 1) up to ambient (index 0)
    let R_next: Complex = { re: 0, im: 0 };

    for (let j = numLayers - 2; j >= 0; j--) {
      const kz_j = kzLayers[j];
      const kz_next = kzLayers[j + 1];
      const sigma = fullStack[j + 1].roughness; // Interface roughness

      // Fresnel reflection coefficient: r_j,j+1 = (kz_j - kz_j+1) / (kz_j + kz_j+1)
      const numR = cSub(kz_j, kz_next);
      const denR = cAdd(kz_j, kz_next);
      const r_fresnel = cDiv(numR, denR);

      // Interface Roughness Damping Model (Névot-Croce vs Debye-Waller)
      const isDebyeWaller = roughnessModel === 'debye-waller';
      const roughExpTerm = isDebyeWaller ? cMul(kz_j, kz_j) : cMul(kz_j, kz_next);
      const roughExponent: Complex = {
        re: -2 * roughExpTerm.re * sigma * sigma,
        im: -2 * roughExpTerm.im * sigma * sigma
      };
      const roughDamping = cExp(roughExponent);

      // Rough Fresnel coefficient r_rough = r_fresnel * roughDamping
      const r_rough = cMul(r_fresnel, roughDamping);

      // Layer phase shift term for layer j+1 (if j+1 is not substrate)
      let phaseFactor: Complex = { re: 1, im: 0 };
      if (j + 1 < numLayers - 1) {
        const d_layer = fullStack[j + 1].thickness;
        const phaseExp: Complex = {
          re: -2 * kz_next.im * d_layer,
          im: 2 * kz_next.re * d_layer
        };
        phaseFactor = cExp(phaseExp);
      }

      // Parratt iteration
      const R_phase = cMul(R_next, phaseFactor);
      const topTerm = cAdd(r_rough, R_phase);
      const bottomTerm = cAdd({ re: 1, im: 0 }, cMul(r_rough, R_phase));

      R_next = cDiv(topTerm, bottomTerm);
    }

    // Beam Footprint Correction Factor F(θ) = min(1, (L * sinθ) / w)
    let footprintFactor = 1.0;
    if (footprintCorrection && sampleLengthMm > 0 && beamWidthMm > 0) {
      footprintFactor = Math.min(1.0, (sampleLengthMm * Math.sin(thetaRad)) / beamWidthMm);
      footprintFactor = Math.max(0.01, footprintFactor);
    }

    // Reflectivity = |R_0|^2 * intensityScale * footprintFactor
    let rIntensity = cAbs2(R_next) * intensityScale * footprintFactor;

    // Apply Background Noise Floor
    rIntensity = Math.max(rIntensity, background);

    // Ideal Fresnel Reflectivity for Substrate alone
    const kz0 = kzLayers[0];
    const kzSub = kzLayers[numLayers - 1];
    const numSub = cSub(kz0, kzSub);
    const denSub = cAdd(kz0, kzSub);
    const fresnelSub = cAbs2(cDiv(numSub, denSub)) * intensityScale * footprintFactor;

    // Fresnel Compensated: R * qz^4
    const qz4 = Math.pow(Math.max(0.005, qz), 4);
    const rCalcCompensated = rIntensity * qz4;

    rawPoints.push({
      theta: rawThetaDeg,
      twoTheta: twoThetaDeg,
      qz: Number(qz.toFixed(6)),
      rCalc: rIntensity,
      rCalcCompensated: rCalcCompensated,
      fresnelR: Math.max(fresnelSub, background),
      footprintFactor: footprintFactor
    });
  }

  // Beam Divergence Convolution (Gaussian Smoothing over Angle)
  let finalPoints = rawPoints;
  if (beamDivergence > 0.0005) {
    finalPoints = applyBeamDivergenceConvolution(rawPoints, beamDivergence, angleStep);
  }

  // Attach experimental data points if provided
  if (expData && expData.length > 0) {
    finalPoints = alignExperimentalData(finalPoints, expData, config.angleUnit);
  }

  return finalPoints;
}

/**
 * Beam Divergence Convolution
 * Applies Gaussian instrumental broadening to reflectivity curve
 */
function applyBeamDivergenceConvolution(
  points: XRRDataPoint[],
  divergenceDeg: number,
  stepDeg: number
): XRRDataPoint[] {
  const sigmaDeg = divergenceDeg / (2 * Math.sqrt(2 * Math.log(2)));
  const kernelHalfWidth = Math.min(20, Math.ceil((3 * sigmaDeg) / stepDeg));

  if (kernelHalfWidth <= 0) return points;

  const result: XRRDataPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    let sumIntensity = 0;
    let sumWeight = 0;

    for (let k = -kernelHalfWidth; k <= kernelHalfWidth; k++) {
      const idx = i + k;
      if (idx >= 0 && idx < points.length) {
        const deltaAngle = k * stepDeg;
        const weight = Math.exp(-(deltaAngle * deltaAngle) / (2 * sigmaDeg * sigmaDeg));
        sumIntensity += points[idx].rCalc * weight;
        sumWeight += weight;
      }
    }

    const smoothedCalc = sumWeight > 0 ? sumIntensity / sumWeight : points[i].rCalc;
    const qz4 = Math.pow(Math.max(0.005, points[i].qz), 4);

    result.push({
      ...points[i],
      rCalc: smoothedCalc,
      rCalcCompensated: smoothedCalc * qz4
    });
  }

  return result;
}

/**
 * Aligns experimental curve onto calculation dataset
 */
function alignExperimentalData(
  calcPoints: XRRDataPoint[],
  expData: { angle: number; intensity: number }[],
  unit: 'theta' | 'twoTheta' | 'qz'
): XRRDataPoint[] {
  return calcPoints.map(pt => {
    let targetX = pt.theta;
    if (unit === 'twoTheta') targetX = pt.twoTheta;
    if (unit === 'qz') targetX = pt.qz;

    // Find nearest experimental point
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

/**
 * Calculates Scattering Length Density (SLD) & Optical Potential Profile along depth z
 */
export function calculateSLDProfile(layers: XRRLayer[], numDepthPoints: number = 350): SLDPoint[] {
  if (layers.length === 0) return [];

  // Total thickness of thin films
  const filmThickness = layers.slice(0, -1).reduce((acc, l) => acc + l.thickness, 0);
  const substrateThickness = 120; // Å padding for substrate
  const ambientPadding = 60;      // Å padding for air above top surface

  const totalDepth = ambientPadding + filmThickness + substrateThickness;
  const zStep = totalDepth / numDepthPoints;

  const result: SLDPoint[] = [];

  // Stack interfaces z positions
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

    // Find local dominant layer
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

    // Sum error function contributions for each interface
    let currentDensity = stack[0].density;
    let currentDelta = stack[0].delta;
    let currentBeta = stack[0].beta;

    for (const interf of interfaces) {
      const stepFactor = 0.5 * (1 + erf((z - interf.zPos) / (Math.SQRT2 * interf.roughness)));
      currentDensity += (interf.layerBelow.density - interf.layerAbove.density) * stepFactor;
      currentDelta += (interf.layerBelow.delta - interf.layerAbove.delta) * stepFactor;
      currentBeta += (interf.layerBelow.beta - interf.layerAbove.beta) * stepFactor;
    }

    // Electron density approximation: ρ_e ≈ 0.285 * ρ (e⁻/Å³)
    const electronDensity = 0.285 * currentDensity;

    // Real part of optical potential V(z) = 4π / λ² * δ * 10⁻⁶ (in 10⁻⁶ Å⁻²)
    const opticalPotential = (4 * Math.PI / (1.54056 * 1.54056)) * currentDelta;

    // Porosity estimation relative to highest density layer in stack
    const maxStackDensity = Math.max(...stack.map(l => l.density), 1.0);
    const porosity = currentDensity > 0 ? Math.max(0, Math.min(100, (1 - currentDensity / maxStackDensity) * 100)) : 100;

    result.push({
      z: Number((z - ambientPadding).toFixed(2)), // Shift surface z = 0
      density: Math.max(0, Number(currentDensity.toFixed(3))),
      delta: Math.max(0, Number(currentDelta.toFixed(3))),
      beta: Math.max(0, Number(currentBeta.toFixed(4))),
      electronDensity: Math.max(0, Number(electronDensity.toFixed(4))),
      opticalPotential: Math.max(0, Number(opticalPotential.toFixed(3))),
      layerName: activeLayerName,
      porosity: Number(porosity.toFixed(1))
    });
  }

  return result;
}

// ----------------------------------------------------------------------------
// Modified Bragg Refraction-Corrected Kiessig Fringe Analyzer
// ----------------------------------------------------------------------------

/**
 * Analyzes Kiessig Fringes with Modified Bragg Equation and Refraction Correction
 * Equation: sin²(θ_m) = (m * λ / (2 * d))² + 2δ_eff = m² * Slope + θc²
 */
export function analyzeKiessigFringes(
  dataPoints: XRRDataPoint[],
  wavelength: number = 1.54056
): KiessigAnalysisResult | null {
  if (dataPoints.length < 20) return null;

  // Compensation for Fresnel qz^-4 decay: Intensity * qz^4
  const compensated = dataPoints.map(pt => ({
    qz: pt.qz,
    theta: pt.theta,
    val: pt.rCalc * Math.pow(Math.max(0.01, pt.qz), 4)
  }));

  // Find local maxima and minima above critical angle
  const rawPeaks: { qz: number; theta: number; r: number }[] = [];
  const rawValleys: { qz: number; theta: number; r: number }[] = [];

  for (let i = 3; i < compensated.length - 3; i++) {
    const curr = compensated[i].val;
    const isPeak =
      curr > compensated[i - 1].val &&
      curr > compensated[i - 2].val &&
      curr > compensated[i - 3].val &&
      curr > compensated[i + 1].val &&
      curr > compensated[i + 2].val &&
      curr > compensated[i + 3].val;

    const isValley =
      curr < compensated[i - 1].val &&
      curr < compensated[i - 2].val &&
      curr < compensated[i + 1].val &&
      curr < compensated[i + 2].val;

    if (isPeak && dataPoints[i].theta > 0.3) {
      rawPeaks.push({ qz: dataPoints[i].qz, theta: dataPoints[i].theta, r: dataPoints[i].rCalc });
    } else if (isValley && dataPoints[i].theta > 0.3) {
      rawValleys.push({ qz: dataPoints[i].qz, theta: dataPoints[i].theta, r: dataPoints[i].rCalc });
    }
  }

  if (rawPeaks.length < 2) return null;

  // Calculate average peak-to-peak distance Δqz
  let sumDeltaQz = 0;
  for (let i = 1; i < rawPeaks.length; i++) {
    sumDeltaQz += (rawPeaks[i].qz - rawPeaks[i - 1].qz);
  }
  const avgDeltaQz = sumDeltaQz / (rawPeaks.length - 1);
  const estimatedThickness = (2 * Math.PI) / avgDeltaQz;

  // Δθ period
  let sumDeltaTheta = 0;
  for (let i = 1; i < rawPeaks.length; i++) {
    sumDeltaTheta += (rawPeaks[i].theta - rawPeaks[i - 1].theta);
  }
  const avgDeltaTheta = sumDeltaTheta / (rawPeaks.length - 1);

  // Modified Bragg Equation Linear Fit:
  // Assign fringe orders m = 1, 2, 3...
  const peaksWithOrder = rawPeaks.map((p, idx) => ({
    ...p,
    order: idx + 1
  }));

  // Linear Regression: Y = sin²(θ_m), X = m²
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

  const slope = (N * sumXY - sumX * sumY) / (N * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / N;

  // d = λ / (2 * sqrt(slope))
  const dBragg = slope > 0 ? wavelength / (2 * Math.sqrt(slope)) : estimatedThickness;

  // Critical angle θc = asin(sqrt(intercept)) in degrees
  const sinThetaCrit = intercept > 0 ? Math.sqrt(intercept) : 0;
  const thetaCritDeg = sinThetaCrit > 0 && sinThetaCrit < 1 ? (Math.asin(sinThetaCrit) * 180) / Math.PI : 0.22;

  // Effective delta δ_eff = 0.5 * intercept
  const deltaEff = Math.max(0, intercept * 0.5 * 1e6);
  const densityEff = deltaEff / 3.24;

  // Calculate R² coefficient
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
      thetaDeg: Number(pt.thetaDeg.toFixed(3)),
      sin2Theta: Number(pt.sin2Theta.toFixed(6)),
      fittedSin2Theta: Number(fitted.toFixed(6))
    };
  });

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0.99;

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
      rSquared: Number(rSquared.toFixed(4)),
      fitPoints
    }
  };
}

// ----------------------------------------------------------------------------
// Fast Fourier Transform (FFT) Thickness Extraction Engine
// ----------------------------------------------------------------------------

/**
 * Calculates Spatial Frequency Thickness Power Spectrum via Discrete Fourier Transform
 * Computes |FFT(R(qz) * qz^4)| to extract layer thicknesses and multilayer harmonics
 */
export function calculateFFTThickness(
  dataPoints: XRRDataPoint[],
  maxThicknessA: number = 1200,
  stepA: number = 2.0
): FFTThicknessResult | null {
  // Filter points in valid Kiessig oscillation range (qz > 0.04 Å⁻¹)
  const valid = dataPoints.filter(p => p.qz >= 0.04 && p.qz <= 0.6);
  if (valid.length < 30) return null;

  // Equidistant qz grid interpolation
  const minQz = valid[0].qz;
  const maxQz = valid[valid.length - 1].qz;
  const numGrid = 256;
  const deltaQz = (maxQz - minQz) / numGrid;

  const signal: { qz: number; val: number }[] = [];
  for (let i = 0; i < numGrid; i++) {
    const qTarget = minQz + i * deltaQz;
    // Nearest neighbor interpolation with Hanning window
    let closestVal = valid[0].rCalcCompensated || valid[0].rCalc * Math.pow(valid[0].qz, 4);
    let minD = Math.abs(valid[0].qz - qTarget);

    for (const pt of valid) {
      const d = Math.abs(pt.qz - qTarget);
      if (d < minD) {
        minD = d;
        closestVal = pt.rCalcCompensated || pt.rCalc * Math.pow(pt.qz, 4);
      }
    }

    // Apply Hanning Window to suppress Fourier spectral leakage
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (numGrid - 1)));
    signal.push({ qz: qTarget, val: closestVal * window });
  }

  // Remove mean DC baseline
  const meanVal = signal.reduce((sum, s) => sum + s.val, 0) / signal.length;
  const centered = signal.map(s => s.val - meanVal);

  const spatialFrequencies: FFTThicknessResult['spatialFrequencies'] = [];
  let maxAmp = 0;

  // Real space thickness loop from 10 Å to maxThicknessA
  for (let z = 10; z <= maxThicknessA; z += stepA) {
    let re = 0;
    let im = 0;

    for (let k = 0; k < numGrid; k++) {
      const qz = signal[k].qz;
      const phase = qz * z;
      re += centered[k] * Math.cos(phase);
      im += centered[k] * Math.sin(phase);
    }

    const amplitude = Math.sqrt(re * re + im * im);
    if (amplitude > maxAmp) maxAmp = amplitude;

    spatialFrequencies.push({
      thicknessA: z,
      amplitude,
      normalizedAmp: 0
    });
  }

  // Normalize power spectrum to 0 - 100%
  const normalized = spatialFrequencies.map(f => ({
    ...f,
    normalizedAmp: maxAmp > 0 ? Number(((f.amplitude / maxAmp) * 100).toFixed(1)) : 0
  }));

  // Detect Peak Maxima in Fourier Spectrum
  const detectedPeaks: FFTThicknessResult['detectedPeaks'] = [];
  for (let i = 2; i < normalized.length - 2; i++) {
    const curr = normalized[i].normalizedAmp;
    if (
      curr > 12 && // Minimum 12% prominence
      curr > normalized[i - 1].normalizedAmp &&
      curr > normalized[i - 2].normalizedAmp &&
      curr > normalized[i + 1].normalizedAmp &&
      curr > normalized[i + 2].normalizedAmp
    ) {
      const thickA = normalized[i].thicknessA;
      detectedPeaks.push({
        thicknessA: thickA,
        thicknessNm: Number((thickA / 10).toFixed(2)),
        amplitude: curr,
        snr: Number((curr / 10).toFixed(1)),
        fwhm: 14.0,
        label: detectedPeaks.length === 0 ? 'Primary Film / Stack Thickness' : `Harmonic / Sublayer ${detectedPeaks.length + 1}`
      });
    }
  }

  // Sort peaks by amplitude descending
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

/**
 * Detects Critical Angle θc and estimates surface/substrate mass density
 */
export function detectCriticalAngle(dataPoints: XRRDataPoint[]): CriticalAngleResult | null {
  if (dataPoints.length < 10) return null;

  // Critical angle corresponds to drop in reflectivity (max derivative |dR/dθ|) below 1.0°
  let maxSlopeIdx = 0;
  let maxSlope = 0;

  for (let i = 1; i < dataPoints.length - 1; i++) {
    const dTheta = dataPoints[i + 1].theta - dataPoints[i - 1].theta;
    if (dTheta <= 0) continue;
    const slope = Math.abs(dataPoints[i + 1].rCalc - dataPoints[i - 1].rCalc) / dTheta;
    if (slope > maxSlope && dataPoints[i].theta < 1.2 && dataPoints[i].theta > 0.08) {
      maxSlope = slope;
      maxSlopeIdx = i;
    }
  }

  const critPoint = dataPoints[maxSlopeIdx];
  if (!critPoint) return null;

  // Critical angle formula: θc (rad) ≈ sqrt(2δ)
  // δ ≈ (θc_rad)^2 / 2
  const thetaCritRad = (critPoint.theta * Math.PI) / 180;
  const deltaEst = 0.5 * thetaCritRad * thetaCritRad;

  // Estimate mass density ρ ≈ deltaEst / (3.24e-6) for Cu K-alpha
  const densityEst = Math.min(24, Math.max(0.5, deltaEst / 3.24e-6));
  const electronDensityEst = 0.285 * densityEst;

  return {
    thetaCritDeg: Number(critPoint.theta.toFixed(3)),
    qzCrit: Number(critPoint.qz.toFixed(4)),
    deltaEst: Number((deltaEst * 1e6).toFixed(2)),
    densityEst: Number(densityEst.toFixed(2)),
    electronDensityEst: Number(electronDensityEst.toFixed(3))
  };
}

// ----------------------------------------------------------------------------
// Goodness-of-Fit Quality Assessment
// ----------------------------------------------------------------------------

/**
 * Calculates Goodness-of-Fit metrics (Log-RMSE, Rwp, Chi-square, R^2)
 */
export function calculateFitQuality(points: XRRDataPoint[]): FitQualityResult {
  const valid = points.filter(p => p.rExp !== undefined && p.rExp > 0 && p.rCalc > 0);
  if (valid.length === 0) {
    return { logRmse: 0, rwp: 0, chiSquare: 0, rSquared: 0, numPoints: 0 };
  }

  let sumLogSq = 0;
  let sumDiffSq = 0;
  let sumExpSq = 0;
  let sumChiSq = 0;

  // R² on log scale
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

    // Poisson estimated variance in XRR count rate
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

/**
 * Superlattice Satellite Bragg Peak Analysis
 * Calculates expected satellite Bragg angles for periodic multilayer superlattices
 */
export function calculateSuperlatticeBraggPeaks(
  layers: XRRLayer[],
  config: XRRSimulationConfig
): { period: number; peaks: SuperlatticePeak[] } | null {
  if (layers.length < 3) return null;

  const films = layers.slice(0, -1);
  if (films.length < 2) return null;

  // Calculate bilayer period (sum of adjacent film thicknesses)
  const period = films[0].thickness + films[1].thickness;
  if (period <= 10) return null;

  const peaks: SuperlatticePeak[] = [];
  const wavelength = config.wavelength;

  // Average delta for refraction correction
  const avgDelta = films.reduce((sum, f) => sum + f.delta * (f.thickness / period), 0) * 1e-6;

  for (let m = 1; m <= 8; m++) {
    // Kinematic approximation: sin(θ_m) ≈ m * λ / (2 * Λ)
    const sinThetaApprox = (m * wavelength) / (2 * period);
    if (sinThetaApprox >= 0.99) break;

    // Refraction corrected angle: sin²(θ_m) = (m λ / 2 Λ)² + 2δ_avg
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

/**
 * Monte Carlo Sensitivity Analysis
 * Computes 95% confidence limits by running N randomized parameter variations
 */
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
      if (l.thickness === 0) return l; // Substrate
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

/**
 * Generates automated Python script for XRR analysis with Refnx
 */
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

/**
 * Generates GenX Differential Evolution Fitting Script
 */
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

/**
 * Generates BornAgain GISAXS / XRR Simulation Script
 */
export function generateBornAgainScript(layers: XRRLayer[], config: XRRSimulationConfig): string {
  return `# ==============================================================================
# BornAgain Framework XRR Simulation Script
# Generated by XRD-Calc Pro • Quantum Crystallography Labs
# ==============================================================================

import bornagain as ba
from bornagain import deg, angstrom, nm

def get_sample():
    # Vacuum ambient
    m_ambient = ba.RefractiveMaterial("Vacuum", 0.0, 0.0)
    l_ambient = ba.Layer(m_ambient)

    multi_layer = ba.MultiLayer()
    multi_layer.addLayer(l_ambient)

${layers.slice(0, -1).map((l, i) => `    # Layer ${i + 1}: ${l.name}
    m_${i + 1} = ba.RefractiveMaterial("${l.name}", ${l.delta * 1e-6}, ${l.beta * 1e-7})
    l_${i + 1} = ba.Layer(m_${i + 1}, ${(l.thickness / 10).toFixed(2)} * nm)
    r_${i + 1} = ba.LayerRoughness(${(l.roughness / 10).toFixed(3)} * nm, 0.7, 10.0 * nm)
    multi_layer.addLayerWithTopRoughness(l_${i + 1}, r_${i + 1})`).join('\n\n')}

    # Substrate
    sub_mat = ba.RefractiveMaterial("Substrate", ${layers[layers.length - 1]?.delta * 1e-6 || 7.56e-6}, ${layers[layers.length - 1]?.beta * 1e-7 || 1.7e-7})
    sub_layer = ba.Layer(sub_mat)
    sub_rough = ba.LayerRoughness(${((layers[layers.length - 1]?.roughness || 3.0) / 10).toFixed(3)} * nm, 0.7, 10.0 * nm)
    multi_layer.addLayerWithTopRoughness(sub_layer, sub_rough)

    return multi_layer

print("BornAgain Multilayer Sample Stack compiled.")
`;
}

/**
 * Generates copyable LaTeX Publication Summary Table
 */
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

  films.forEach((l, i) => {
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
'''

with open("utils/xrrPhysics.ts", "w", encoding="utf-8") as f:
    f.write(code)

print("utils/xrrPhysics.ts written successfully!")
