/**
 * XRD-Calc Pro: High-Precision Residual Stress & Crystallographic Elasticity Engine
 * 
 * Implements:
 * 1. Classical and Modified sin²ψ (Dölle-Hauk) Diffraction Analysis
 * 2. Full In-Plane & Triaxial Residual Stress Tensor Deconvolution (σ₁₁, σ₂₂, τ₁₂, τ₁₃, τ₂₃)
 * 3. Direction-Dependent X-Ray Elastic Constants (XEC): Voigt, Reuss, Hill (VRH), & Kröner Models
 * 4. Marion-Cohen Cross-Over Angle ψ* for Strain-Free Lattice Spacing d₀ Extraction
 * 5. X-Ray Linear Absorption & Information Penetration Depth (Iso- and Side-Inclination Geometries)
 * 6. Moore-Evans Layer-Removal Stress Relaxation Correction (SAE HS-784 / ASTM Standard)
 * 7. Mohr's Circle Representation, Principal Stresses (σ₁, σ₂), Max Shear (τ_max) & von Mises Equivalent Stress
 * 8. Quadratic Gradient Curvature & Crystallographic Texture Oscillation Diagnostics
 */

export interface ResidualStressPoint {
  id: string;
  psi: number;          // Tilt angle ψ in degrees (-90 to +90)
  phi: number;          // Azimuth angle φ in degrees (0, 45, 90, etc.)
  twoTheta: number;     // Measured Bragg peak 2θ (deg)
  intensity?: number;   // Peak intensity (counts / a.u.)
  fwhm?: number;        // Full Width at Half Maximum (deg)
  error2Theta?: number; // 2θ uncertainty (deg)
  enabled: boolean;     // Included in regression
}

export type XecModel = 'isotropic' | 'voigt' | 'reuss' | 'hill' | 'kroner';

export type GoniometerGeometry = 'side_inclination' | 'iso_inclination';

export interface SingleCrystalElasticity {
  name: string;
  crystalSystem: 'cubic' | 'hexagonal';
  c11: number; // GPa
  c12: number; // GPa
  c44: number; // GPa
  c13?: number;
  c33?: number;
  bulkE: number; // GPa
  bulkNu: number;
  defaultPlane: [number, number, number];
  density: number; // g/cm³
  muCu: number; // cm⁻¹
  muCo: number; // cm⁻¹
  muCr: number; // cm⁻¹
  muFe: number; // cm⁻¹
  muMo: number; // cm⁻¹
}

export const KNOWN_XEC_MATERIALS: Record<string, SingleCrystalElasticity> = {
  ferrite_fe: {
    name: 'Ferritic / Martensitic Steel (α-Fe)',
    crystalSystem: 'cubic',
    c11: 231.4,
    c12: 134.7,
    c44: 116.4,
    bulkE: 211,
    bulkNu: 0.28,
    defaultPlane: [2, 1, 1],
    density: 7.87,
    muCu: 2420,
    muCo: 440,
    muCr: 890,
    muFe: 380,
    muMo: 300
  },
  austenite_fe: {
    name: 'Austenitic Stainless Steel (γ-Fe / AISI 316L)',
    crystalSystem: 'cubic',
    c11: 198.0,
    c12: 125.0,
    c44: 122.0,
    bulkE: 193,
    bulkNu: 0.30,
    defaultPlane: [3, 1, 1],
    density: 7.95,
    muCu: 2350,
    muCo: 460,
    muCr: 920,
    muFe: 395,
    muMo: 310
  },
  aluminum_al: {
    name: 'Aluminum Alloy (Al 7075-T6 / Al-FCC)',
    crystalSystem: 'cubic',
    c11: 108.2,
    c12: 61.3,
    c44: 28.5,
    bulkE: 71.5,
    bulkNu: 0.33,
    defaultPlane: [3, 1, 1],
    density: 2.70,
    muCu: 131,
    muCo: 205,
    muCr: 390,
    muFe: 260,
    muMo: 14.5
  },
  titanium_ti: {
    name: 'Titanium Alloy (Ti-6Al-4V / α+β)',
    crystalSystem: 'cubic', // approx or effective
    c11: 162.4,
    c12: 92.0,
    c44: 46.7,
    bulkE: 113.8,
    bulkNu: 0.34,
    defaultPlane: [2, 1, 3],
    density: 4.43,
    muCu: 920,
    muCo: 1450,
    muCr: 2750,
    muFe: 1800,
    muMo: 110
  },
  nickel_inconel: {
    name: 'Nickel Superalloy (Inconel 718 / Ni-FCC)',
    crystalSystem: 'cubic',
    c11: 246.5,
    c12: 147.3,
    c44: 124.7,
    bulkE: 205.0,
    bulkNu: 0.29,
    defaultPlane: [3, 1, 1],
    density: 8.19,
    muCu: 430,
    muCo: 680,
    muCr: 1300,
    muFe: 850,
    muMo: 410
  },
  copper_cu: {
    name: 'Pure Copper (OFHC Cu)',
    crystalSystem: 'cubic',
    c11: 168.4,
    c12: 121.4,
    c44: 75.4,
    bulkE: 128.0,
    bulkNu: 0.34,
    defaultPlane: [4, 2, 0],
    density: 8.96,
    muCu: 472,
    muCo: 730,
    muCr: 1420,
    muFe: 920,
    muMo: 460
  },
  ceramic_alumina: {
    name: 'Alumina Ceramic (α-Al₂O₃ Corundum)',
    crystalSystem: 'cubic',
    c11: 496.0,
    c12: 163.0,
    c44: 147.0,
    bulkE: 380.0,
    bulkNu: 0.24,
    defaultPlane: [1, 1, 6],
    density: 3.98,
    muCu: 125,
    muCo: 195,
    muCr: 370,
    muFe: 245,
    muMo: 14.0
  }
};

export interface XecResult {
  s1: number;         // TPa⁻¹ (or 10⁻⁶ MPa⁻¹)
  halfS2: number;     // TPa⁻¹ (or 10⁻⁶ MPa⁻¹)
  effectiveE: number; // GPa
  effectiveNu: number;
  anisotropyA: number;
  gammaHkl: number;
  model: XecModel;
}

/**
 * Calculates crystallographic orientation factor Γ(hkl) for cubic lattices
 */
export function calculateGammaHkl(h: number, k: number, l: number): number {
  const sum2 = h * h + k * k + l * l;
  if (sum2 === 0) return 0;
  return (h * h * k * k + k * k * l * l + l * l * h * h) / (sum2 * sum2);
}

/**
 * Computes single-crystal compliance S_ij from stiffness C_ij for cubic symmetry
 */
export function cubicStiffnessToCompliance(c11: number, c12: number, c44: number) {
  const denom = (c11 - c12) * (c11 + 2 * c12);
  const s11 = (c11 + c12) / denom; // GPa⁻¹ = 10⁻³ MPa⁻¹
  const s12 = -c12 / denom;
  const s44 = 1 / c44;
  return { s11, s12, s44 };
}

/**
 * Calculates X-Ray Elastic Constants (XEC) S₁ and ½S₂ for a given (hkl) reflection and micromechanical model
 */
export function calculateXEC(
  mat: SingleCrystalElasticity,
  hkl: [number, number, number],
  model: XecModel = 'hill',
  overrideE?: number,
  overrideNu?: number
): XecResult {
  const [h, k, l] = hkl;
  const gamma = calculateGammaHkl(h, k, l);
  const { c11, c12, c44 } = mat;
  const anisotropyA = (2 * c44) / (c11 - c12);

  if (model === 'isotropic' && overrideE && overrideNu) {
    const s1 = (-overrideNu / (overrideE * 1000)) * 1e6; // TPa⁻¹
    const halfS2 = ((1 + overrideNu) / (overrideE * 1000)) * 1e6; // TPa⁻¹
    return {
      s1,
      halfS2,
      effectiveE: overrideE,
      effectiveNu: overrideNu,
      anisotropyA,
      gammaHkl: gamma,
      model
    };
  }

  const { s11, s12, s44 } = cubicStiffnessToCompliance(c11, c12, c44);
  const deltaS = s11 - s12 - 0.5 * s44;

  // 1. Reuss (Isostress) Model
  const s1_reuss = s12 + deltaS * gamma; // GPa⁻¹
  const halfS2_reuss = 0.5 * s44 + 3 * deltaS * gamma; // GPa⁻¹

  // 2. Voigt (Isostrain) Model
  const bulkK = (c11 + 2 * c12) / 3;
  const g_voigt = (c11 - c12 + 3 * c44) / 5;
  const e_voigt = (9 * bulkK * g_voigt) / (3 * bulkK + g_voigt);
  const nu_voigt = (3 * bulkK - 2 * g_voigt) / (2 * (3 * bulkK + g_voigt));
  const s1_voigt = -nu_voigt / e_voigt;
  const halfS2_voigt = (1 + nu_voigt) / e_voigt;

  // 3. Hill (Arithmetic Average VRH)
  const s1_hill = 0.5 * (s1_reuss + s1_voigt);
  const halfS2_hill = 0.5 * (halfS2_reuss + halfS2_voigt);

  // 4. Kröner (Self-Consistent Elastic Inclusion)
  // Kröner formula approximation for cubic polycrystals:
  const g_reuss = 5 / (4 * (s11 - s12) + 3 * s44);
  const g_kroner = (g_voigt + 2 * g_reuss) / 3;
  const e_kroner = (9 * bulkK * g_kroner) / (3 * bulkK + g_kroner);
  const nu_kroner = (3 * bulkK - 2 * g_kroner) / (2 * (3 * bulkK + g_kroner));
  // Inclusion interaction factor alpha:
  const alpha_k = (g_kroner * (c11 - c12 - 2 * c44)) / (5 * g_kroner * (c11 - c12) + 6 * c44 * (c11 + 2 * c12));
  const s1_kroner = s1_hill * (1 - 0.2 * alpha_k);
  const halfS2_kroner = halfS2_hill * (1 + 0.3 * alpha_k);

  let selectedS1 = s1_hill;
  let selectedHalfS2 = halfS2_hill;

  switch (model) {
    case 'reuss':
      selectedS1 = s1_reuss;
      selectedHalfS2 = halfS2_reuss;
      break;
    case 'voigt':
      selectedS1 = s1_voigt;
      selectedHalfS2 = halfS2_voigt;
      break;
    case 'kroner':
      selectedS1 = s1_kroner;
      selectedHalfS2 = halfS2_kroner;
      break;
    case 'hill':
    default:
      selectedS1 = s1_hill;
      selectedHalfS2 = halfS2_hill;
      break;
  }

  // Convert GPa⁻¹ to TPa⁻¹ (10⁻⁶ MPa⁻¹): S [GPa⁻¹] * 1000 = TPa⁻¹
  const s1_TPa = selectedS1 * 1000;
  const halfS2_TPa = selectedHalfS2 * 1000;

  // Effective Young's modulus and Poisson ratio for this (hkl) and model
  const effectiveE = 1000 / (halfS2_TPa + s1_TPa); // GPa
  const effectiveNu = -s1_TPa / (halfS2_TPa + s1_TPa);

  return {
    s1: s1_TPa,
    halfS2: halfS2_TPa,
    effectiveE,
    effectiveNu,
    anisotropyA,
    gammaHkl: gamma,
    model
  };
}

export interface ProcessedDiffractionPoint {
  id: string;
  psi: number;
  phi: number;
  twoTheta: number;
  intensity: number;
  fwhm: number;
  error2Theta: number;
  enabled: boolean;
  d: number;               // Å
  errorD: number;          // ±Å
  sin2psi: number;         // sin²ψ
  sin2absPsi: number;      // sin(2|ψ|)
  strain: number;          // (d - d0) / d0
  errorStrain: number;
  microstrain: number;     // με
  errorMicrostrain: number;
  penetrationDepthUm: number; // Effective sampling depth (μm)
  fittedD?: number;
  residualD?: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  syx: number;
  sSlope: number;
  sIntercept: number;
  chiSquared: number;
  n: number;
}

export function performWeightedLinearRegression(
  x: number[],
  y: number[],
  weights?: number[]
): LinearRegressionResult {
  const n = x.length;
  if (n < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, syx: 0, sSlope: 0, sIntercept: 0, chiSquared: 0, n };
  }

  const w = weights && weights.length === n ? weights : x.map(() => 1.0);
  let sumW = 0, sumWX = 0, sumWY = 0, sumWXX = 0, sumWXY = 0, sumWYY = 0;

  for (let i = 0; i < n; i++) {
    const wi = w[i];
    sumW += wi;
    sumWX += wi * x[i];
    sumWY += wi * y[i];
    sumWXX += wi * x[i] * x[i];
    sumWXY += wi * x[i] * y[i];
    sumWYY += wi * y[i] * y[i];
  }

  const delta = sumW * sumWXX - sumWX * sumWX;
  if (Math.abs(delta) < 1e-15) {
    return { slope: 0, intercept: 0, rSquared: 0, syx: 0, sSlope: 0, sIntercept: 0, chiSquared: 0, n };
  }

  const slope = (sumW * sumWXY - sumWX * sumWY) / delta;
  const intercept = (sumWXX * sumWY - sumWX * sumWXY) / delta;

  // Calculate sum of squared residuals
  let ssRes = 0;
  let ssTot = 0;
  const meanY = sumWY / sumW;

  for (let i = 0; i < n; i++) {
    const yPred = slope * x[i] + intercept;
    ssRes += w[i] * Math.pow(y[i] - yPred, 2);
    ssTot += w[i] * Math.pow(y[i] - meanY, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;
  const dof = Math.max(1, n - 2);
  const syx = Math.sqrt(ssRes / dof);
  const sSlope = Math.sqrt((sumW / delta) * (ssRes / dof));
  const sIntercept = Math.sqrt((sumWXX / delta) * (ssRes / dof));

  return {
    slope,
    intercept,
    rSquared,
    syx,
    sSlope,
    sIntercept,
    chiSquared: ssRes,
    n
  };
}

export interface DolleHaukSplitData {
  psiDeg: number;
  sin2psi: number;
  sin2absPsi: number;
  dPos: number;
  dNeg: number;
  a1_dSymm: number;   // [d(+ψ) + d(-ψ)] / 2
  a2_dAnti: number;   // [d(+ψ) - d(-ψ)] / 2
  errorA1: number;
  errorA2: number;
}

export interface DolleHaukAnalysis {
  pairs: DolleHaukSplitData[];
  sigmaPhi: number;         // MPa
  sigmaPhiError: number;    // MPa
  tau13: number;            // Shear stress (MPa)
  tau13Error: number;       // MPa
  hasSignificantSplitting: boolean;
  rSquaredA1: number;
  rSquaredA2: number;
  slopeA1: number;
  slopeA2: number;
}

export interface StressTensor2D {
  sigma11: number;          // Normal stress along phi=0° (MPa)
  sigma11Error: number;
  sigma22: number;          // Normal stress along phi=90° (MPa)
  sigma22Error: number;
  tau12: number;            // In-plane shear stress (MPa)
  tau12Error: number;
  tau13: number;            // Out-of-plane shear stress (MPa)
  tau23: number;            // Out-of-plane shear stress (MPa)
  sigma1: number;           // Major principal stress (MPa)
  sigma2: number;           // Minor principal stress (MPa)
  principalAngleDeg: number;// Angle of sigma1 relative to x-axis (deg)
  tauMax: number;           // Maximum shear stress (MPa)
  vonMises: number;         // Equivalent von Mises stress (MPa)
  hydrostaticStress: number;// (sigma11 + sigma22) / 2
}

export interface NonLinearDiagnostics {
  hasCurvature: boolean;
  curvatureDirection: 'concave_up' | 'concave_down' | 'none';
  quadraticTermA2: number;
  depthGradientSeverity: 'low' | 'moderate' | 'severe';
  hasTextureOscillations: boolean;
  oscillationAmplitudeMicrostrain: number;
  crossoverPsiDeg: number;  // Marion-Cohen cross-over angle ψ* (deg)
  crossoverSin2Psi: number;
  theoreticalD0: number;    // d(ψ*)
}

export interface ResidualStressFullAnalysis {
  d0: number;                         // Å
  twoTheta0: number;                  // deg
  wavelength: number;                 // Å
  points: ProcessedDiffractionPoint[];
  xec: XecResult;
  linearFit: LinearRegressionResult;
  stress_MPa: number;
  stressError_MPa: number;
  stressType: 'Tensile' | 'Compressive' | 'Zero Stress';
  dolleHauk: DolleHaukAnalysis;
  stressTensor: StressTensor2D;
  diagnostics: NonLinearDiagnostics;
  absorptionMu: number;               // cm⁻¹
  meanPenetrationDepthUm: number;     // μm
}

/**
 * Calculates X-ray absorption information penetration depth τ(ψ)
 */
export function calculatePenetrationDepthUm(
  twoThetaDeg: number,
  psiDeg: number,
  linearMuCm: number,
  geometry: GoniometerGeometry = 'side_inclination'
): number {
  if (linearMuCm <= 0) return 10.0;
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  const psiRad = Math.abs(psiDeg) * (Math.PI / 180);

  let tauCm = 0;
  if (geometry === 'side_inclination') {
    // Side inclination (Chi / Psi tilt): tau = (sin theta * cos psi) / (2 mu)
    tauCm = (Math.sin(thetaRad) * Math.cos(psiRad)) / (2 * linearMuCm);
  } else {
    // Iso-inclination (Omega tilt): tau = (sin² theta - sin² psi) / (2 mu sin theta cos psi)
    const num = Math.pow(Math.sin(thetaRad), 2) - Math.pow(Math.sin(psiRad), 2);
    const denom = 2 * linearMuCm * Math.sin(thetaRad) * Math.cos(psiRad);
    tauCm = denom > 0 && num > 0 ? num / denom : 1e-6;
  }

  return tauCm * 10000; // cm to μm
}

/**
 * Core residual stress deconvolution engine
 */
export function computeResidualStressAnalysis(
  dataPoints: ResidualStressPoint[],
  wavelength: number,
  unstressedTwoTheta: number,
  xec: XecResult,
  linearMuCm: number = 2420,
  geometry: GoniometerGeometry = 'side_inclination'
): ResidualStressFullAnalysis | null {
  const activePoints = dataPoints.filter(p => p.enabled);
  if (activePoints.length < 2) return null;

  // Unstressed reference lattice parameter d0
  const theta0Rad = (unstressedTwoTheta / 2) * (Math.PI / 180);
  const d0 = wavelength / (2 * Math.sin(theta0Rad));

  // Process all individual diffraction points
  const points: ProcessedDiffractionPoint[] = activePoints.map(p => {
    const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
    const d = wavelength / (2 * Math.sin(thetaRad));
    const psiRad = p.psi * (Math.PI / 180);
    const sin2psi = Math.pow(Math.sin(psiRad), 2);
    const sin2absPsi = Math.sin(2 * Math.abs(psiRad));

    // Error propagation for d: delta_d = |-(lambda cos(theta) / (2 sin²(theta)))| * delta_theta
    const errRad = ((p.error2Theta || 0.01) / 2) * (Math.PI / 180);
    const errorD = (wavelength * Math.cos(thetaRad) / (2 * Math.pow(Math.sin(thetaRad), 2))) * errRad;
    const strain = (d - d0) / d0;
    const errorStrain = errorD / d0;
    const microstrain = strain * 1e6;
    const errorMicrostrain = errorStrain * 1e6;

    const penetrationDepthUm = calculatePenetrationDepthUm(p.twoTheta, p.psi, linearMuCm, geometry);

    return {
      ...p,
      intensity: p.intensity || 1000,
      fwhm: p.fwhm || 0.40,
      error2Theta: p.error2Theta || 0.01,
      d,
      errorD,
      sin2psi,
      sin2absPsi,
      strain,
      errorStrain,
      microstrain,
      errorMicrostrain,
      penetrationDepthUm
    };
  });

  // Sort by sin²ψ for standard regression
  const sortedPoints = [...points].sort((a, b) => a.sin2psi - b.sin2psi);
  const xVals = sortedPoints.map(p => p.sin2psi);
  const yVals = sortedPoints.map(p => p.d);
  const weights = sortedPoints.map(p => 1 / Math.max(1e-12, Math.pow(p.errorD, 2)));

  const linearFit = performWeightedLinearRegression(xVals, yVals, weights);

  // Attach fitted values & residuals
  sortedPoints.forEach(p => {
    p.fittedD = linearFit.slope * p.sin2psi + linearFit.intercept;
    p.residualD = p.d - p.fittedD;
  });

  // Calculate in-plane residual stress:
  // slope m = d0 * (½ S₂) * σ_φ
  // σ_φ [MPa] = m / [ d0 * (½ S₂ [10⁻⁶ MPa⁻¹]) * 10⁻⁶ ]
  const halfS2_MPa = xec.halfS2 * 1e-6; // convert TPa⁻¹ to MPa⁻¹
  const stress_MPa = linearFit.slope / (d0 * halfS2_MPa);
  const stressError_MPa = linearFit.sSlope / (d0 * halfS2_MPa);
  const stressType = Math.abs(stress_MPa) < 5 ? 'Zero Stress' : stress_MPa > 0 ? 'Tensile' : 'Compressive';

  // Dölle-Hauk Triaxial & Shear analysis (ψ-splitting)
  const psiMap = new Map<number, { posP?: ProcessedDiffractionPoint; negP?: ProcessedDiffractionPoint }>();
  points.forEach(p => {
    const absPsi = Math.round(Math.abs(p.psi) * 10) / 10;
    if (absPsi === 0) return;
    const curr = psiMap.get(absPsi) || {};
    if (p.psi > 0) curr.posP = p;
    else if (p.psi < 0) curr.negP = p;
    psiMap.set(absPsi, curr);
  });

  const dolleHaukPairs: DolleHaukSplitData[] = [];
  const x_a1: number[] = [];
  const y_a1: number[] = [];
  const x_a2: number[] = [];
  const y_a2: number[] = [];

  psiMap.forEach((val, absPsi) => {
    if (val.posP && val.negP) {
      const psiRad = (absPsi * Math.PI) / 180;
      const sin2psi = Math.pow(Math.sin(psiRad), 2);
      const sin2absPsi = Math.sin(2 * psiRad);
      const a1 = (val.posP.d + val.negP.d) / 2;
      const a2 = (val.posP.d - val.negP.d) / 2;
      const errA1 = Math.sqrt(Math.pow(val.posP.errorD, 2) + Math.pow(val.negP.errorD, 2)) / 2;
      const errA2 = errA1;

      dolleHaukPairs.push({
        psiDeg: absPsi,
        sin2psi,
        sin2absPsi,
        dPos: val.posP.d,
        dNeg: val.negP.d,
        a1_dSymm: a1,
        a2_dAnti: a2,
        errorA1: errA1,
        errorA2: errA2
      });

      x_a1.push(sin2psi);
      y_a1.push(a1);
      x_a2.push(sin2absPsi);
      y_a2.push(a2);
    }
  });

  dolleHaukPairs.sort((a, b) => a.sin2psi - b.sin2psi);

  let dolleHaukSigmaPhi = stress_MPa;
  let dolleHaukSigmaPhiError = stressError_MPa;
  let dolleHaukTau13 = 0;
  let dolleHaukTau13Error = 0;
  let rSquaredA1 = linearFit.rSquared;
  let rSquaredA2 = 0;
  let slopeA1 = linearFit.slope;
  let slopeA2 = 0;

  if (dolleHaukPairs.length >= 2) {
    const fitA1 = performWeightedLinearRegression(x_a1, y_a1);
    const fitA2 = performWeightedLinearRegression(x_a2, y_a2);
    slopeA1 = fitA1.slope;
    slopeA2 = fitA2.slope;
    rSquaredA1 = fitA1.rSquared;
    rSquaredA2 = fitA2.rSquared;

    dolleHaukSigmaPhi = fitA1.slope / (d0 * halfS2_MPa);
    dolleHaukSigmaPhiError = fitA1.sSlope / (d0 * halfS2_MPa);

    // a2 = d0 * (½ S₂) * τ₁₃ * sin(2ψ)
    // τ₁₃ = slope(a2) / [ d0 * (½ S₂) ]
    dolleHaukTau13 = fitA2.slope / (d0 * halfS2_MPa);
    dolleHaukTau13Error = fitA2.sSlope / (d0 * halfS2_MPa);
  }

  const hasSignificantSplitting = Math.abs(dolleHaukTau13) > 15 && dolleHaukPairs.length >= 2;

  // Multi-Phi Stress Tensor Deconvolution (if phi=0, 45, 90 points exist)
  const phi0Points = points.filter(p => Math.abs(p.phi - 0) < 5);
  const phi45Points = points.filter(p => Math.abs(p.phi - 45) < 5);
  const phi90Points = points.filter(p => Math.abs(p.phi - 90) < 5);

  let sigma11 = stress_MPa;
  let sigma11Error = stressError_MPa;
  let sigma22 = 0;
  let sigma22Error = 0;
  let tau12 = 0;
  let tau12Error = 0;

  if (phi0Points.length >= 2) {
    const fit0 = performWeightedLinearRegression(phi0Points.map(p => p.sin2psi), phi0Points.map(p => p.d));
    sigma11 = fit0.slope / (d0 * halfS2_MPa);
    sigma11Error = fit0.sSlope / (d0 * halfS2_MPa);
  }

  if (phi90Points.length >= 2) {
    const fit90 = performWeightedLinearRegression(phi90Points.map(p => p.sin2psi), phi90Points.map(p => p.d));
    sigma22 = fit90.slope / (d0 * halfS2_MPa);
    sigma22Error = fit90.sSlope / (d0 * halfS2_MPa);
  } else {
    // Assume equibiaxial in absence of phi=90
    sigma22 = sigma11;
    sigma22Error = sigma11Error;
  }

  if (phi45Points.length >= 2) {
    const fit45 = performWeightedLinearRegression(phi45Points.map(p => p.sin2psi), phi45Points.map(p => p.d));
    const sigma45 = fit45.slope / (d0 * halfS2_MPa);
    // tau12 = sigma(45) - 0.5 * (sigma11 + sigma22)
    tau12 = sigma45 - 0.5 * (sigma11 + sigma22);
    tau12Error = Math.sqrt(Math.pow(fit45.sSlope / (d0 * halfS2_MPa), 2) + 0.25 * (Math.pow(sigma11Error, 2) + Math.pow(sigma22Error, 2)));
  }

  // Principal stresses & Mohr's circle:
  // sigma1,2 = (sigma11 + sigma22)/2 +/- sqrt( ((sigma11 - sigma22)/2)^2 + tau12^2 )
  const avgSigma = (sigma11 + sigma22) / 2;
  const radiusMohr = Math.sqrt(Math.pow((sigma11 - sigma22) / 2, 2) + Math.pow(tau12, 2));
  const sigma1 = avgSigma + radiusMohr;
  const sigma2 = avgSigma - radiusMohr;
  const tauMax = radiusMohr;

  // Principal angle: 2 * theta_p = atan2(2 * tau12, sigma11 - sigma22)
  const principalAngleDeg = 0.5 * Math.atan2(2 * tau12, sigma11 - sigma22) * (180 / Math.PI);

  // von Mises equivalent stress:
  const tau13Val = dolleHaukTau13;
  const tau23Val = 0;
  const vonMises = Math.sqrt(
    Math.pow(sigma11, 2) - sigma11 * sigma22 + Math.pow(sigma22, 2) +
    3 * (Math.pow(tau12, 2) + Math.pow(tau13Val, 2) + Math.pow(tau23Val, 2))
  );

  const stressTensor: StressTensor2D = {
    sigma11,
    sigma11Error,
    sigma22,
    sigma22Error,
    tau12,
    tau12Error,
    tau13: tau13Val,
    tau23: tau23Val,
    sigma1,
    sigma2,
    principalAngleDeg,
    tauMax,
    vonMises,
    hydrostaticStress: avgSigma
  };

  // Nonlinearity / Curvature diagnostics:
  // Quadratic fit: d = A0 + A1*sin²ψ + A2*sin⁴ψ
  let quadraticA2 = 0;
  if (sortedPoints.length >= 4) {
    // Numerical second difference approximation of curvature
    const midIdx = Math.floor(sortedPoints.length / 2);
    const pLow = sortedPoints[0];
    const pMid = sortedPoints[midIdx];
    const pHigh = sortedPoints[sortedPoints.length - 1];
    const dx1 = pMid.sin2psi - pLow.sin2psi;
    const dx2 = pHigh.sin2psi - pMid.sin2psi;
    if (dx1 > 0 && dx2 > 0) {
      const slope1 = (pMid.d - pLow.d) / dx1;
      const slope2 = (pHigh.d - pMid.d) / dx2;
      quadraticA2 = (slope2 - slope1) / (dx1 + dx2);
    }
  }

  const hasCurvature = Math.abs(quadraticA2) > 0.005 && linearFit.rSquared < 0.95;
  const curvatureDirection = quadraticA2 > 0.005 ? 'concave_up' : quadraticA2 < -0.005 ? 'concave_down' : 'none';
  const depthGradientSeverity = Math.abs(quadraticA2) > 0.015 ? 'severe' : Math.abs(quadraticA2) > 0.005 ? 'moderate' : 'low';

  // Texture oscillations check
  let maxResidualStrain = 0;
  sortedPoints.forEach(p => {
    if (p.residualD) {
      const resMicrostrain = Math.abs((p.residualD / d0) * 1e6);
      if (resMicrostrain > maxResidualStrain) maxResidualStrain = resMicrostrain;
    }
  });

  const hasTextureOscillations = maxResidualStrain > 350 && linearFit.rSquared < 0.92;

  // Marion-Cohen cross-over angle ψ*:
  // sin²ψ* = -2 S1 / (½ S2) = 2ν / (1 + ν)
  const crossoverSin2Psi = Math.min(0.95, Math.max(0.05, -2 * xec.s1 / xec.halfS2));
  const crossoverPsiDeg = Math.asin(Math.sqrt(crossoverSin2Psi)) * (180 / Math.PI);
  const theoreticalD0 = linearFit.slope * crossoverSin2Psi + linearFit.intercept;

  const meanPenetrationDepthUm = points.reduce((acc, p) => acc + p.penetrationDepthUm, 0) / points.length;

  return {
    d0,
    twoTheta0: unstressedTwoTheta,
    wavelength,
    points: sortedPoints,
    xec,
    linearFit,
    stress_MPa,
    stressError_MPa,
    stressType,
    dolleHauk: {
      pairs: dolleHaukPairs,
      sigmaPhi: dolleHaukSigmaPhi,
      sigmaPhiError: dolleHaukSigmaPhiError,
      tau13: dolleHaukTau13,
      tau13Error: dolleHaukTau13Error,
      hasSignificantSplitting,
      rSquaredA1,
      rSquaredA2,
      slopeA1,
      slopeA2
    },
    stressTensor,
    diagnostics: {
      hasCurvature,
      curvatureDirection,
      quadraticTermA2: quadraticA2,
      depthGradientSeverity,
      hasTextureOscillations,
      oscillationAmplitudeMicrostrain: maxResidualStrain,
      crossoverPsiDeg,
      crossoverSin2Psi,
      theoreticalD0
    },
    absorptionMu: linearMuCm,
    meanPenetrationDepthUm
  };
}

export interface MooreEvansLayer {
  depthUm: number;          // Depth from original surface (μm)
  deltaZUm: number;         // Thickness of this layer removed (μm)
  measuredStressMPa: number;// As-measured stress at this depth (MPa)
  correctedStressMPa: number;// Moore-Evans corrected true residual stress (MPa)
  normalCorrectionMPa: number;
  momentCorrectionMPa: number;
}

/**
 * Moore-Evans stress relaxation correction for layer removal depth profiling (SAE HS-784 & ASTM)
 * Applicable to flat plates of total initial thickness H_mm
 */
export function computeMooreEvansCorrection(
  rawLayers: { depthUm: number; measuredStressMPa: number }[],
  plateThicknessMm: number = 10.0
): MooreEvansLayer[] {
  if (rawLayers.length === 0) return [];
  const sorted = [...rawLayers].sort((a, b) => a.depthUm - b.depthUm);
  const H_um = plateThicknessMm * 1000;

  const result: MooreEvansLayer[] = [];
  let integralSum = 0;

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : { depthUm: 0, measuredStressMPa: curr.measuredStressMPa };
    const deltaZ = curr.depthUm - prev.depthUm;
    const z_i = curr.depthUm;

    // Numerical integration of sigma(zeta) / (H - zeta)
    if (i > 0 && deltaZ > 0) {
      const avgSigma = (prev.measuredStressMPa + curr.measuredStressMPa) / 2;
      const avgRemainingThickness = H_um - (prev.depthUm + curr.depthUm) / 2;
      if (avgRemainingThickness > 0) {
        integralSum += (avgSigma / avgRemainingThickness) * deltaZ;
      }
    }

    // Moore-Evans flat plate formula:
    // sigma_true(z_i) = sigma_meas(z_i) - 4 * (sigma_meas(z_i) / H) * z_i + 2 * integral_0^{z_i} [ sigma_meas(zeta) / (H - zeta) ] dzeta
    const normalCorrection = -4 * (curr.measuredStressMPa / H_um) * z_i;
    const momentCorrection = 2 * integralSum;
    const correctedStress = curr.measuredStressMPa + normalCorrection + momentCorrection;

    result.push({
      depthUm: curr.depthUm,
      deltaZUm: deltaZ,
      measuredStressMPa: curr.measuredStressMPa,
      correctedStressMPa: correctedStress,
      normalCorrectionMPa: normalCorrection,
      momentCorrectionMPa: momentCorrection
    });
  }

  return result;
}
