export type MaterialCrystallinityType = 'crystalline' | 'semi-crystalline' | 'amorphous';

export type AnodeId = 'CuKa1' | 'CuKa' | 'CoKa' | 'MoKa' | 'CrKa' | 'Custom';

export type FractionBasis = 'weight' | 'volume' | 'mole';

export interface AnodeSpec {
  id: AnodeId;
  label: string;
  symbol: string;
  lambda1: number; // Å
  lambda2: number | null; // Å
}

export const XRAY_ANODES: Record<AnodeId, AnodeSpec> = {
  CuKa1: { id: 'CuKa1', label: 'Copper Kα₁ (Monochromated)', symbol: 'Cu Kα₁', lambda1: 1.540598, lambda2: 1.544426 },
  CuKa: { id: 'CuKa', label: 'Copper Kα (Weighted Avg)', symbol: 'Cu Kα', lambda1: 1.54184, lambda2: 1.544426 },
  CoKa: { id: 'CoKa', label: 'Cobalt Kα₁ (Fe-rich samples)', symbol: 'Co Kα₁', lambda1: 1.78897, lambda2: 1.79285 },
  MoKa: { id: 'MoKa', label: 'Molybdenum Kα₁ (High-Q)', symbol: 'Mo Kα₁', lambda1: 0.70930, lambda2: 0.71359 },
  CrKa: { id: 'CrKa', label: 'Chromium Kα₁ (High angular dispersion)', symbol: 'Cr Kα₁', lambda1: 2.28970, lambda2: 2.29361 },
  Custom: { id: 'Custom', label: 'Custom Wavelength (λ)', symbol: 'Custom λ', lambda1: 1.5406, lambda2: null },
};

export interface SyntheticPeak {
  id: string;
  twoTheta: number; // degrees
  intensity: number; // counts
  fwhm: number; // sample intrinsic FWHM in degrees
  etaOverride: number | null; // 0 (Gaussian) .. 1 (Lorentzian), null = inherit globalEta
  hkl: string;
  enabled: boolean;
}

export interface AmorphousHaloConfig {
  enabled: boolean;
  centerTwoTheta: number;
  intensity: number;
  fwhm: number;
  skewness: number; // -0.45 .. +0.45
  eta: number; // 0 .. 1
  secondaryEnabled: boolean;
  secondaryCenter: number;
  secondaryIntensity: number;
  secondaryFwhm: number;
}

export interface CurvePhysicsConfig {
  anodeId: AnodeId;
  wavelengthA: number;
  lockDSpacingOnWavelengthChange: boolean;
  includeKa2: boolean;
  twoThetaMin: number;
  twoThetaMax: number;
  stepDeg: number;
  globalEta: number; // 0 = Gaussian, 1 = Lorentzian
  instrumentalFwhm: number; // baseline W^(1/2) instrumental FWHM in degrees
  cagliotiU: number; // deg²
  cagliotiV: number; // deg²
  cagliotiW: number; // deg²
  useCaglioti: boolean;
  applyPhysicalAttenuation: boolean; // Lorentz-Polarization + Debye-Waller thermal attenuation
  debyeWallerB: number; // Å² isotropic thermal factor (0 .. 8)
  bgConstant: number; // counts
  bgSlope: number; // counts across scan window
  bgLowAngleScatter: number; // air scatter exponential amplitude
  noiseEnabled: boolean;
  noiseScale: number; // 0.0 .. 2.0 multiplier on sqrt(I)
  noiseSeed: number;
}

export interface PhasePhysicalConstants {
  rhoCrystalline: number; // g/cm³
  rhoAmorphous: number; // g/cm³
  molarMassCrystalline: number; // g/mol
  molarMassAmorphous: number; // g/mol
}

export interface IntegrationWindow {
  minTwoTheta: number;
  maxTwoTheta: number;
}

export interface DiffractogramPoint {
  twoTheta: number;
  dSpacing: number;
  qValue: number;
  background: number;
  amorphous: number;
  crystalline: number;
  noise: number;
  cleanTotal: number;
  total: number;
  /** Baseline + amorphous envelope (bottom edge of crystalline area fill) */
  amorphousEnvelope: number;
  /** Baseline + amorphous + crystalline envelope (top edge of crystalline area fill) */
  crystallineEnvelope: number;
}

export interface DerivedPeakSummary {
  id: string;
  hkl: string;
  twoTheta: number;
  intensity: number;
  attenuatedIntensity: number;
  sampleFwhm: number;
  instrumentalFwhm: number;
  effectiveFwhm: number;
  eta: number;
  dSpacingA: number;
  qValue: number;
  scherrerSizeNm: number | null;
  integralBreadthDeg: number;
  analyticalArea: number;
  inIntegrationWindow: boolean;
  enabled: boolean;
}

export interface CrystallinityMetrics {
  areaCrystalline: number;
  areaAmorphous: number;
  areaTotal: number;
  analyticalCrystallineArea: number;
  tailTruncationPct: number; // % of analytical crystalline area falling outside [intMin, intMax]
  crystallinityWeightPct: number;
  crystallinityVolumePct: number;
  crystallinityMolePct: number;
  amorphousWeightPct: number;
  amorphousVolumePct: number;
  amorphousMolePct: number;
  activeBasisPct: number;
  activeAmorphousPct: number;
  segalIndexPct: number | null; // Peak-height benchmark (I_max - I_am) / I_max * 100
  observedClass: MaterialCrystallinityType;
  meanScherrerNm: number | null;
  signalToNoiseRatio: number;
  maxIntensity: number;
  activePeakCount: number;
  peaksInsideWindow: number;
  integrationMin: number;
  integrationMax: number;
  peakSummaries: DerivedPeakSummary[];
}

export interface CurveSynthesisResult {
  points: DiffractogramPoint[];
  metrics: CrystallinityMetrics;
}

export interface MaterialCurvePreset {
  id: string;
  name: string;
  formula: string;
  materialType: MaterialCrystallinityType;
  summary: string;
  peaks: Omit<SyntheticPeak, 'id'>[];
  halo: AmorphousHaloConfig;
  physics: Partial<CurvePhysicsConfig>;
  constants: PhasePhysicalConstants;
  integrationWindow: IntegrationWindow;
}

export const MATERIAL_CURVE_PRESETS: MaterialCurvePreset[] = [
  {
    id: 'quartz-crystalline',
    name: 'α-Quartz',
    formula: 'SiO₂ (Trigonal)',
    materialType: 'crystalline',
    summary: 'Sharp long-range Bragg reflections with negligible diffuse background.',
    peaks: [
      { twoTheta: 20.86, intensity: 1650, fwhm: 0.22, etaOverride: null, hkl: '(100)', enabled: true },
      { twoTheta: 26.64, intensity: 8200, fwhm: 0.20, etaOverride: null, hkl: '(101)', enabled: true },
      { twoTheta: 36.54, intensity: 880, fwhm: 0.24, etaOverride: null, hkl: '(110)', enabled: true },
      { twoTheta: 39.47, intensity: 640, fwhm: 0.24, etaOverride: null, hkl: '(102)', enabled: true },
      { twoTheta: 42.45, intensity: 520, fwhm: 0.25, etaOverride: null, hkl: '(200)', enabled: true },
      { twoTheta: 50.14, intensity: 1380, fwhm: 0.26, etaOverride: null, hkl: '(112)', enabled: true },
      { twoTheta: 59.96, intensity: 940, fwhm: 0.28, etaOverride: null, hkl: '(211)', enabled: true },
      { twoTheta: 68.14, intensity: 760, fwhm: 0.30, etaOverride: null, hkl: '(203)', enabled: true },
    ],
    halo: {
      enabled: false,
      centerTwoTheta: 21.5,
      intensity: 0,
      fwhm: 11.0,
      skewness: 0.08,
      eta: 0.2,
      secondaryEnabled: false,
      secondaryCenter: 43.0,
      secondaryIntensity: 0,
      secondaryFwhm: 16.0,
    },
    physics: {
      anodeId: 'CuKa1',
      wavelengthA: 1.540598,
      includeKa2: false,
      twoThetaMin: 10,
      twoThetaMax: 75,
      stepDeg: 0.05,
      globalEta: 0.35,
      instrumentalFwhm: 0.08,
      useCaglioti: true,
      cagliotiU: 0.012,
      cagliotiV: -0.004,
      cagliotiW: 0.0064,
      applyPhysicalAttenuation: false,
      debyeWallerB: 0.8,
      bgConstant: 120,
      bgSlope: -25,
      bgLowAngleScatter: 140,
      noiseEnabled: true,
      noiseScale: 0.55,
    },
    constants: {
      rhoCrystalline: 2.65,
      rhoAmorphous: 2.20,
      molarMassCrystalline: 60.08,
      molarMassAmorphous: 60.08,
    },
    integrationWindow: { minTwoTheta: 12, maxTwoTheta: 73 },
  },
  {
    id: 'silicon-srm640f',
    name: 'Silicon Standard (SRM 640f)',
    formula: 'Si (Diamond Cubic)',
    materialType: 'crystalline',
    summary: 'NIST line-position reference standard with narrow symmetric reflections.',
    peaks: [
      { twoTheta: 28.44, intensity: 9500, fwhm: 0.16, etaOverride: null, hkl: '(111)', enabled: true },
      { twoTheta: 47.30, intensity: 5200, fwhm: 0.18, etaOverride: null, hkl: '(220)', enabled: true },
      { twoTheta: 56.12, intensity: 2850, fwhm: 0.19, etaOverride: null, hkl: '(311)', enabled: true },
      { twoTheta: 69.13, intensity: 860, fwhm: 0.21, etaOverride: null, hkl: '(400)', enabled: true },
      { twoTheta: 76.38, intensity: 1120, fwhm: 0.22, etaOverride: null, hkl: '(331)', enabled: true },
    ],
    halo: {
      enabled: false,
      centerTwoTheta: 24.0,
      intensity: 0,
      fwhm: 12.0,
      skewness: 0,
      eta: 0.2,
      secondaryEnabled: false,
      secondaryCenter: 48.0,
      secondaryIntensity: 0,
      secondaryFwhm: 16.0,
    },
    physics: {
      anodeId: 'CuKa1',
      wavelengthA: 1.540598,
      includeKa2: true,
      twoThetaMin: 15,
      twoThetaMax: 84,
      stepDeg: 0.05,
      globalEta: 0.30,
      instrumentalFwhm: 0.06,
      useCaglioti: true,
      cagliotiU: 0.008,
      cagliotiV: -0.003,
      cagliotiW: 0.0036,
      applyPhysicalAttenuation: false,
      debyeWallerB: 0.5,
      bgConstant: 90,
      bgSlope: -15,
      bgLowAngleScatter: 80,
      noiseEnabled: true,
      noiseScale: 0.45,
    },
    constants: {
      rhoCrystalline: 2.329,
      rhoAmorphous: 2.285,
      molarMassCrystalline: 28.085,
      molarMassAmorphous: 28.085,
    },
    integrationWindow: { minTwoTheta: 18, maxTwoTheta: 82 },
  },
  {
    id: 'pet-semicrystalline',
    name: 'PET Polymer',
    formula: '(C₁₀H₈O₄)ₙ',
    materialType: 'semi-crystalline',
    summary: 'Semi-crystalline polyester (~42% crystalline) combining sharp lamellae peaks over a broad amorphous halo.',
    peaks: [
      { twoTheta: 17.55, intensity: 1950, fwhm: 1.45, etaOverride: null, hkl: '(010)', enabled: true },
      { twoTheta: 22.72, intensity: 2250, fwhm: 1.55, etaOverride: null, hkl: '(1̄10)', enabled: true },
      { twoTheta: 25.85, intensity: 3150, fwhm: 1.38, etaOverride: null, hkl: '(100)', enabled: true },
      { twoTheta: 32.60, intensity: 640, fwhm: 1.80, etaOverride: null, hkl: '(101)', enabled: true },
      { twoTheta: 42.30, intensity: 480, fwhm: 2.10, etaOverride: null, hkl: '(1̄05)', enabled: true },
    ],
    halo: {
      enabled: true,
      centerTwoTheta: 21.2,
      intensity: 1380,
      fwhm: 11.4,
      skewness: 0.14,
      eta: 0.25,
      secondaryEnabled: true,
      secondaryCenter: 42.8,
      secondaryIntensity: 260,
      secondaryFwhm: 15.0,
    },
    physics: {
      anodeId: 'CuKa',
      wavelengthA: 1.54184,
      includeKa2: false,
      twoThetaMin: 5,
      twoThetaMax: 60,
      stepDeg: 0.05,
      globalEta: 0.42,
      instrumentalFwhm: 0.10,
      useCaglioti: true,
      cagliotiU: 0.015,
      cagliotiV: -0.005,
      cagliotiW: 0.010,
      applyPhysicalAttenuation: false,
      debyeWallerB: 1.4,
      bgConstant: 140,
      bgSlope: -30,
      bgLowAngleScatter: 180,
      noiseEnabled: true,
      noiseScale: 0.50,
    },
    constants: {
      rhoCrystalline: 1.455,
      rhoAmorphous: 1.335,
      molarMassCrystalline: 192.17,
      molarMassAmorphous: 192.17,
    },
    integrationWindow: { minTwoTheta: 8, maxTwoTheta: 54 },
  },
  {
    id: 'hdpe-semicrystalline',
    name: 'High-Density Polyethylene (HDPE)',
    formula: '(C₂H₄)ₙ',
    materialType: 'semi-crystalline',
    summary: 'High-crystallinity thermoplastic (~66%) with intense orthorhombic (110) and (200) reflections.',
    peaks: [
      { twoTheta: 21.48, intensity: 7600, fwhm: 0.62, etaOverride: null, hkl: '(110)', enabled: true },
      { twoTheta: 23.86, intensity: 2850, fwhm: 0.68, etaOverride: null, hkl: '(200)', enabled: true },
      { twoTheta: 29.95, intensity: 540, fwhm: 0.85, etaOverride: null, hkl: '(210)', enabled: true },
      { twoTheta: 36.18, intensity: 680, fwhm: 0.90, etaOverride: null, hkl: '(020)', enabled: true },
    ],
    halo: {
      enabled: true,
      centerTwoTheta: 19.6,
      intensity: 660,
      fwhm: 6.8,
      skewness: 0.10,
      eta: 0.22,
      secondaryEnabled: false,
      secondaryCenter: 41.0,
      secondaryIntensity: 120,
      secondaryFwhm: 14.0,
    },
    physics: {
      anodeId: 'CuKa',
      wavelengthA: 1.54184,
      includeKa2: false,
      twoThetaMin: 8,
      twoThetaMax: 50,
      stepDeg: 0.05,
      globalEta: 0.38,
      instrumentalFwhm: 0.09,
      useCaglioti: true,
      cagliotiU: 0.014,
      cagliotiV: -0.004,
      cagliotiW: 0.0081,
      applyPhysicalAttenuation: false,
      debyeWallerB: 1.2,
      bgConstant: 110,
      bgSlope: -20,
      bgLowAngleScatter: 120,
      noiseEnabled: true,
      noiseScale: 0.45,
    },
    constants: {
      rhoCrystalline: 1.000,
      rhoAmorphous: 0.855,
      molarMassCrystalline: 28.05,
      molarMassAmorphous: 28.05,
    },
    integrationWindow: { minTwoTheta: 10, maxTwoTheta: 45 },
  },
  {
    id: 'fused-silica-amorphous',
    name: 'Fused Silica Glass',
    formula: 'a-SiO₂ (Vitreous)',
    materialType: 'amorphous',
    summary: 'Fully disordered tetrahedral SiO₄ network producing a single broad diffuse halo near 21.6° (0% crystalline).',
    peaks: [],
    halo: {
      enabled: true,
      centerTwoTheta: 21.6,
      intensity: 2650,
      fwhm: 10.6,
      skewness: 0.18,
      eta: 0.28,
      secondaryEnabled: true,
      secondaryCenter: 43.5,
      secondaryIntensity: 310,
      secondaryFwhm: 17.5,
    },
    physics: {
      anodeId: 'CuKa1',
      wavelengthA: 1.540598,
      includeKa2: false,
      twoThetaMin: 5,
      twoThetaMax: 75,
      stepDeg: 0.05,
      globalEta: 0.30,
      instrumentalFwhm: 0.08,
      useCaglioti: true,
      cagliotiU: 0.012,
      cagliotiV: -0.004,
      cagliotiW: 0.0064,
      applyPhysicalAttenuation: false,
      debyeWallerB: 1.0,
      bgConstant: 130,
      bgSlope: -25,
      bgLowAngleScatter: 170,
      noiseEnabled: true,
      noiseScale: 0.55,
    },
    constants: {
      rhoCrystalline: 2.65,
      rhoAmorphous: 2.20,
      molarMassCrystalline: 60.08,
      molarMassAmorphous: 60.08,
    },
    integrationWindow: { minTwoTheta: 8, maxTwoTheta: 68 },
  },
  {
    id: 'metallic-glass-amorphous',
    name: 'Zr-Based Bulk Metallic Glass',
    formula: 'Zr₄₁.₂Ti₁₃.₈Cu₁₂.₅Ni₁₀Be₂₂.₅',
    materialType: 'amorphous',
    summary: 'Dense random-packed amorphous alloy with a strong primary halo near 37.8° and broad secondary coordination halo.',
    peaks: [],
    halo: {
      enabled: true,
      centerTwoTheta: 37.8,
      intensity: 3400,
      fwhm: 8.2,
      skewness: 0.08,
      eta: 0.24,
      secondaryEnabled: true,
      secondaryCenter: 64.5,
      secondaryIntensity: 680,
      secondaryFwhm: 14.5,
    },
    physics: {
      anodeId: 'CuKa1',
      wavelengthA: 1.540598,
      includeKa2: false,
      twoThetaMin: 15,
      twoThetaMax: 85,
      stepDeg: 0.05,
      globalEta: 0.30,
      instrumentalFwhm: 0.08,
      useCaglioti: true,
      cagliotiU: 0.012,
      cagliotiV: -0.004,
      cagliotiW: 0.0064,
      applyPhysicalAttenuation: false,
      debyeWallerB: 0.9,
      bgConstant: 160,
      bgSlope: -20,
      bgLowAngleScatter: 90,
      noiseEnabled: true,
      noiseScale: 0.55,
    },
    constants: {
      rhoCrystalline: 6.18,
      rhoAmorphous: 6.10,
      molarMassCrystalline: 60.2,
      molarMassAmorphous: 60.2,
    },
    integrationWindow: { minTwoTheta: 20, maxTwoTheta: 80 },
  },
];

export const DEFAULT_PHYSICS_CONFIG: CurvePhysicsConfig = {
  anodeId: 'CuKa',
  wavelengthA: 1.54184,
  lockDSpacingOnWavelengthChange: true,
  includeKa2: false,
  twoThetaMin: 5,
  twoThetaMax: 60,
  stepDeg: 0.05,
  globalEta: 0.42,
  instrumentalFwhm: 0.10,
  cagliotiU: 0.015,
  cagliotiV: -0.005,
  cagliotiW: 0.010,
  useCaglioti: true,
  applyPhysicalAttenuation: false,
  debyeWallerB: 1.2,
  bgConstant: 140,
  bgSlope: -30,
  bgLowAngleScatter: 180,
  noiseEnabled: true,
  noiseScale: 0.50,
  noiseSeed: 42,
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Caglioti instrumental resolution FWHM(2θ) = sqrt(U tan²θ + V tanθ + W) */
export function computeInstrumentalFwhm(twoThetaDeg: number, physics: CurvePhysicsConfig): number {
  if (!physics.useCaglioti) {
    return Math.max(0, physics.instrumentalFwhm);
  }
  const thetaRad = (Math.max(1, Math.min(176, twoThetaDeg)) * Math.PI) / 360;
  const tanT = Math.tan(thetaRad);
  const h2 = physics.cagliotiU * tanT * tanT + physics.cagliotiV * tanT + physics.cagliotiW;
  const baseline = Math.max(0.0004, physics.instrumentalFwhm * physics.instrumentalFwhm);
  return Math.sqrt(Math.max(0.0004, h2 > 0 ? h2 : baseline));
}

/** Thompson-Cox-Hastings (TCH) Voigt convolution of sample Pseudo-Voigt + Gaussian instrumental FWHM */
export function convolveTCHProfile(
  sampleFwhm: number,
  sampleEta: number,
  instFwhm: number
): { effectiveFwhm: number; effectiveEta: number } {
  const eta = Math.max(0, Math.min(1, sampleEta));
  const hSample = Math.max(0.015, sampleFwhm);
  const hInst = Math.max(0, instFwhm);

  // Decompose sample into Gaussian & Lorentzian components using exact inverse TCH approximation
  const hGs = hSample * Math.pow(Math.max(0, 1 - eta), 0.72);
  const hLs = hSample * eta;

  // Quadrature add instrumental Gaussian broadening
  const hG = Math.sqrt(hGs * hGs + hInst * hInst);
  const hL = hLs;

  // Forward TCH 5th-order polynomial
  const h5 =
    Math.pow(hG, 5) +
    2.69269 * Math.pow(hG, 4) * hL +
    2.42843 * Math.pow(hG, 3) * Math.pow(hL, 2) +
    4.47163 * Math.pow(hG, 2) * Math.pow(hL, 3) +
    0.07842 * hG * Math.pow(hL, 4) +
    Math.pow(hL, 5);
  const effectiveFwhm = Math.max(0.015, Math.pow(Math.max(1e-12, h5), 0.2));

  const r = hL / effectiveFwhm;
  const effectiveEta = Math.max(
    0,
    Math.min(1, 1.36603 * r - 0.47719 * r * r + 0.11116 * r * r * r)
  );
  return { effectiveFwhm, effectiveEta };
}

/** Normalized Lorentz-Polarization × Debye-Waller attenuation factor relative to a reference 2θ */
export function computePhysicalAttenuationFactor(
  twoThetaDeg: number,
  refTwoThetaDeg: number,
  wavelengthA: number,
  debyeWallerB: number
): number {
  const evalRaw = (tt: number) => {
    const tRad = (Math.max(2, Math.min(176, tt)) * Math.PI) / 360;
    const twoTRad = 2 * tRad;
    const sinT = Math.sin(tRad);
    const cosT = Math.cos(tRad);
    const cos2T = Math.cos(twoTRad);
    const lp = (1 + cos2T * cos2T) / Math.max(1e-4, sinT * sinT * cosT);
    const s = sinT / Math.max(0.1, wavelengthA);
    const dw = Math.exp(-2 * Math.max(0, debyeWallerB) * s * s);
    return lp * dw;
  };
  const refVal = evalRaw(refTwoThetaDeg);
  if (refVal <= 1e-12) return 1;
  // Softly bound ratio so extreme low-angle user entries remain visually legible
  return Math.max(0.05, Math.min(4.0, evalRaw(twoThetaDeg) / refVal));
}

/** Normalized Pseudo-Voigt profile with height = 1 at x = 0 */
export function evaluatePseudoVoigt(deltaX: number, fwhm: number, eta: number): number {
  const safeH = Math.max(0.015, fwhm);
  const ratio = deltaX / safeH;
  const r2 = ratio * ratio;
  const clampedEta = Math.max(0, Math.min(1, eta));
  const gaussian = Math.exp(-2.772588722239781 * r2);
  const lorentzian = 1 / (1 + 4 * r2);
  return (1 - clampedEta) * gaussian + clampedEta * lorentzian;
}

/** Asymmetric split-width Pseudo-Voigt amorphous halo kernel (peak height = 1 at center) */
export function evaluateAmorphousHalo(
  twoTheta: number,
  center: number,
  fwhm: number,
  skewness: number,
  eta: number
): number {
  const dx = twoTheta - center;
  const s = Math.max(-0.45, Math.min(0.45, skewness));
  const effectiveH = dx < 0 ? fwhm * (1 - s) : fwhm * (1 + s);
  return evaluatePseudoVoigt(dx, Math.max(1.0, effectiveH), eta);
}

/** Bragg d-spacing in Angstroms: d = lambda / (2 sin theta) */
export function computeBraggDSpacing(twoThetaDeg: number, wavelengthA: number): number {
  const thetaRad = (Math.max(0.1, Math.min(179.8, twoThetaDeg)) * Math.PI) / 360;
  const sinTheta = Math.sin(thetaRad);
  if (sinTheta <= 1e-6) return 0;
  return wavelengthA / (2 * sinTheta);
}

/** Transform peak 2θ angles & amorphous halo centers when switching X-ray wavelength while locking crystal d-spacings */
export function transformCurveForWavelength(params: {
  oldLambda: number;
  newLambda: number;
  peaks: SyntheticPeak[];
  halo: AmorphousHaloConfig;
  physics: CurvePhysicsConfig;
  integrationWindow: IntegrationWindow;
}): {
  peaks: SyntheticPeak[];
  halo: AmorphousHaloConfig;
  twoThetaMin: number;
  twoThetaMax: number;
  integrationWindow: IntegrationWindow;
  clippedCount: number;
} {
  const { oldLambda, newLambda, peaks, halo, physics, integrationWindow } = params;
  if (oldLambda <= 0 || newLambda <= 0 || Math.abs(oldLambda - newLambda) < 1e-6) {
    return {
      peaks,
      halo,
      twoThetaMin: physics.twoThetaMin,
      twoThetaMax: physics.twoThetaMax,
      integrationWindow,
      clippedCount: 0,
    };
  }

  const ratio = newLambda / oldLambda;
  const shiftAngle = (tt: number): number | null => {
    const sinOld = Math.sin((tt * Math.PI) / 360);
    const sinNew = sinOld * ratio;
    if (sinNew >= 0.996 || sinNew <= 0.005) return null;
    return Number(((Math.asin(sinNew) * 360) / Math.PI).toFixed(3));
  };

  let clippedCount = 0;
  const nextPeaks = peaks.map((pk) => {
    const shifted = shiftAngle(pk.twoTheta);
    if (shifted === null) {
      clippedCount++;
      return { ...pk, enabled: false };
    }
    const cosOld = Math.max(0.15, Math.cos((pk.twoTheta * Math.PI) / 360));
    const cosNew = Math.max(0.15, Math.cos((shifted * Math.PI) / 360));
    // Scherrer angular dispersion scaling: beta_new = beta_old * (lambda_new / lambda_old) * (cos theta_old / cos theta_new)
    const scaledFwhm = Math.max(0.03, Math.min(15, pk.fwhm * ratio * (cosOld / cosNew)));
    return {
      ...pk,
      twoTheta: shifted,
      fwhm: Number(scaledFwhm.toFixed(3)),
    };
  });

  const nextHalo = { ...halo };
  const shiftedPrimary = shiftAngle(halo.centerTwoTheta);
  if (shiftedPrimary !== null) {
    nextHalo.centerTwoTheta = Number(shiftedPrimary.toFixed(2));
    nextHalo.fwhm = Number(Math.max(3, Math.min(35, halo.fwhm * ratio)).toFixed(2));
  }
  const shiftedSecondary = shiftAngle(halo.secondaryCenter);
  if (shiftedSecondary !== null) {
    nextHalo.secondaryCenter = Number(shiftedSecondary.toFixed(2));
    nextHalo.secondaryFwhm = Number(Math.max(4, Math.min(40, halo.secondaryFwhm * ratio)).toFixed(2));
  }

  const shiftedMin = shiftAngle(physics.twoThetaMin);
  const shiftedMax = shiftAngle(physics.twoThetaMax);
  const nextMin = Math.max(2, Math.min(120, Math.floor(shiftedMin ?? physics.twoThetaMin * ratio)));
  const nextMax = Math.max(nextMin + 10, Math.min(172, Math.ceil(shiftedMax ?? Math.min(170, physics.twoThetaMax * ratio))));

  const shiftedIntMin = shiftAngle(integrationWindow.minTwoTheta);
  const shiftedIntMax = shiftAngle(integrationWindow.maxTwoTheta);
  const nextIntMin = Math.max(nextMin, Math.min(nextMax - 2, Number((shiftedIntMin ?? nextMin + 2).toFixed(1))));
  const nextIntMax = Math.max(nextIntMin + 2, Math.min(nextMax, Number((shiftedIntMax ?? nextMax - 2).toFixed(1))));

  return {
    peaks: nextPeaks,
    halo: nextHalo,
    twoThetaMin: nextMin,
    twoThetaMax: nextMax,
    integrationWindow: { minTwoTheta: nextIntMin, maxTwoTheta: nextIntMax },
    clippedCount,
  };
}

/** Scherrer crystallite size in nm from intrinsic sample FWHM: D = K * lambda / (beta_rad * cos(theta)) * 0.1 */
export function computeScherrerSizeNm(
  twoThetaDeg: number,
  sampleFwhmDeg: number,
  wavelengthA: number,
  kFactor = 0.9
): number | null {
  if (sampleFwhmDeg <= 0.01) return null;
  const thetaRad = (twoThetaDeg * Math.PI) / 360;
  const cosTheta = Math.cos(thetaRad);
  if (cosTheta <= 0.01) return null;
  const betaRad = (sampleFwhmDeg * Math.PI) / 180;
  const sizeAngstrom = (kFactor * wavelengthA) / (betaRad * cosTheta);
  return sizeAngstrom * 0.1; // Å -> nm
}

/** Integral breadth factor of a Pseudo-Voigt profile: beta_int / FWHM */
export function pseudoVoigtAreaFactor(eta: number): number {
  const clampedEta = Math.max(0, Math.min(1, eta));
  // Gaussian: sqrt(pi / (4 ln 2)) = 1.06446701943, Lorentzian: pi / 2 = 1.57079632679
  return (1 - clampedEta) * 1.06446701943 + clampedEta * 1.57079632679;
}

/** Exact analytical area of a Pseudo-Voigt peak of height I0 and FWHM H */
export function computeAnalyticalPeakArea(intensity: number, fwhm: number, eta: number): number {
  return Math.max(0, intensity) * Math.max(0.015, fwhm) * pseudoVoigtAreaFactor(eta);
}

/** Convert weight fraction w_c in [0, 1] to volume and mole fractions */
export function convertCrystallinityFractions(
  weightFraction: number,
  constants: PhasePhysicalConstants
): { weightPct: number; volumePct: number; molePct: number } {
  const w = Math.max(0, Math.min(1, weightFraction));
  const wa = 1 - w;
  const rhoC = Math.max(0.05, constants.rhoCrystalline);
  const rhoA = Math.max(0.05, constants.rhoAmorphous);
  const mC = Math.max(1, constants.molarMassCrystalline);
  const mA = Math.max(1, constants.molarMassAmorphous);

  const volDenom = w / rhoC + wa / rhoA;
  const volFrac = volDenom > 0 ? (w / rhoC) / volDenom : w;

  const molDenom = w / mC + wa / mA;
  const molFrac = molDenom > 0 ? (w / mC) / molDenom : w;

  return {
    weightPct: w * 100,
    volumePct: volFrac * 100,
    molePct: molFrac * 100,
  };
}

/** Inverse conversion: target crystallinity percentage in any basis (weight, volume, mole) -> required weight fraction w_c */
export function targetBasisPctToWeightFraction(
  targetPct: number,
  basis: FractionBasis,
  constants: PhasePhysicalConstants
): number {
  const f = Math.max(0, Math.min(1, targetPct / 100));
  if (f <= 0) return 0;
  if (f >= 1) return 1;

  if (basis === 'volume') {
    const rhoC = Math.max(0.05, constants.rhoCrystalline);
    const rhoA = Math.max(0.05, constants.rhoAmorphous);
    const denom = f * rhoC + (1 - f) * rhoA;
    return denom > 0 ? (f * rhoC) / denom : f;
  }
  if (basis === 'mole') {
    const mC = Math.max(1, constants.molarMassCrystalline);
    const mA = Math.max(1, constants.molarMassAmorphous);
    const denom = f * mC + (1 - f) * mA;
    return denom > 0 ? (f * mC) / denom : f;
  }
  return f;
}

/** Classify observed material state from computed crystallinity percentage */
export function classifyMaterialFromXc(xcPct: number): MaterialCrystallinityType {
  if (xcPct >= 90) return 'crystalline';
  if (xcPct <= 5) return 'amorphous';
  return 'semi-crystalline';
}

/** Auto-compute optimal 2θ integration window covering all active peaks and amorphous halos cleanly */
export function computeOptimalIntegrationWindow(
  peaks: SyntheticPeak[],
  halo: AmorphousHaloConfig,
  physics: CurvePhysicsConfig
): IntegrationWindow {
  const activePeaks = peaks.filter((p) => p.enabled && p.intensity > 0);
  let low = physics.twoThetaMax;
  let high = physics.twoThetaMin;

  if (activePeaks.length > 0) {
    for (const p of activePeaks) {
      const margin = Math.max(2.0, p.fwhm * 4.5);
      low = Math.min(low, p.twoTheta - margin);
      high = Math.max(high, p.twoTheta + margin);
    }
  }

  if (halo.enabled && halo.intensity > 0) {
    const haloMargin = Math.max(6.0, halo.fwhm * 1.45);
    low = Math.min(low, halo.centerTwoTheta - haloMargin);
    high = Math.max(high, halo.centerTwoTheta + haloMargin);
    if (halo.secondaryEnabled && halo.secondaryIntensity > 0) {
      const secMargin = Math.max(6.0, halo.secondaryFwhm * 1.2);
      low = Math.min(low, halo.secondaryCenter - secMargin);
      high = Math.max(high, halo.secondaryCenter + secMargin);
    }
  }

  if (low >= high) {
    return {
      minTwoTheta: Number((physics.twoThetaMin + 2).toFixed(1)),
      maxTwoTheta: Number((physics.twoThetaMax - 2).toFixed(1)),
    };
  }

  const clampedLow = Math.max(physics.twoThetaMin, Math.min(physics.twoThetaMax - 4, low));
  const clampedHigh = Math.max(clampedLow + 4, Math.min(physics.twoThetaMax, high));
  return {
    minTwoTheta: Number(clampedLow.toFixed(1)),
    maxTwoTheta: Number(clampedHigh.toFixed(1)),
  };
}

/** Inverse physics solver: rebalance crystalline peak intensities & amorphous halo intensity to hit exact target Xc% while conserving total scattering power */
export function rebalanceCurveToTargetXc(params: {
  targetPct: number;
  basis: FractionBasis;
  peaks: SyntheticPeak[];
  halo: AmorphousHaloConfig;
  physics: CurvePhysicsConfig;
  constants: PhasePhysicalConstants;
  integrationWindow: IntegrationWindow;
}): {
  materialType: MaterialCrystallinityType;
  peaks: SyntheticPeak[];
  halo: AmorphousHaloConfig;
} {
  const { targetPct, basis, peaks, halo, physics, constants, integrationWindow } = params;
  const clampedTarget = Math.max(0, Math.min(100, targetPct));
  const targetWeightFrac = targetBasisPctToWeightFraction(clampedTarget, basis, constants);

  // Ensure we have starter peaks if user targets >0% crystallinity
  let workingPeaks = peaks.map((p) => ({ ...p }));
  if (targetWeightFrac > 0.001) {
    const enabledCount = workingPeaks.filter((p) => p.enabled && p.intensity > 0).length;
    if (enabledCount === 0) {
      if (workingPeaks.length > 0) {
        workingPeaks = workingPeaks.map((p) => ({
          ...p,
          enabled: true,
          intensity: p.intensity > 0 ? p.intensity : 1800,
        }));
      } else {
        workingPeaks = [
          { id: `pk_auto_1`, twoTheta: 17.55, intensity: 1950, fwhm: 1.35, etaOverride: null, hkl: '(010)', enabled: true },
          { id: `pk_auto_2`, twoTheta: 22.72, intensity: 2250, fwhm: 1.45, etaOverride: null, hkl: '(1̄10)', enabled: true },
          { id: `pk_auto_3`, twoTheta: 25.85, intensity: 3150, fwhm: 1.25, etaOverride: null, hkl: '(100)', enabled: true },
        ];
      }
    }
  }

  // Ensure amorphous halo is seeded if target < 100%
  const workingHalo: AmorphousHaloConfig = { ...halo };
  if (targetWeightFrac < 0.999) {
    workingHalo.enabled = true;
    if (workingHalo.intensity <= 10) {
      workingHalo.intensity = 1400;
      workingHalo.fwhm = Math.max(8.5, workingHalo.fwhm);
    }
  }

  // Boundary cases: exact 0% or 100%
  if (targetWeightFrac <= 0.0005) {
    return {
      materialType: 'amorphous',
      peaks: workingPeaks.map((p) => ({ ...p, enabled: false })),
      halo: { ...workingHalo, enabled: true, intensity: Math.max(1200, workingHalo.intensity) },
    };
  }
  if (targetWeightFrac >= 0.9995) {
    return {
      materialType: 'crystalline',
      peaks: workingPeaks,
      halo: { ...workingHalo, enabled: false, intensity: 0 },
    };
  }

  // Measure current baseline areas of working peaks and working halo
  const probe = synthesizeXRDCurve({
    materialType: 'semi-crystalline',
    peaks: workingPeaks,
    halo: workingHalo,
    physics: { ...physics, noiseEnabled: false },
    constants,
    integrationWindow,
    fractionBasis: 'weight',
  });

  const currAc = Math.max(1, probe.metrics.areaCrystalline);
  const currAa = Math.max(1, probe.metrics.areaAmorphous);
  const totalBudget = Math.max(12000, currAc + currAa);

  const desiredAc = totalBudget * targetWeightFrac;
  const desiredAa = totalBudget * (1 - targetWeightFrac);

  const scaleC = desiredAc / currAc;
  const scaleA = desiredAa / currAa;

  const scaledPeaks = workingPeaks.map((p) =>
    p.enabled ? { ...p, intensity: Math.max(10, Math.round(p.intensity * scaleC)) } : p
  );
  const scaledHalo: AmorphousHaloConfig = {
    ...workingHalo,
    enabled: true,
    intensity: Math.max(10, Math.round(workingHalo.intensity * scaleA)),
    secondaryIntensity: workingHalo.secondaryEnabled
      ? Math.max(0, Math.round(workingHalo.secondaryIntensity * scaleA))
      : workingHalo.secondaryIntensity,
  };

  return {
    materialType: classifyMaterialFromXc(clampedTarget),
    peaks: scaledPeaks,
    halo: scaledHalo,
  };
}

/** Parse pasted multi-line peak list: "2theta, intensity [, fwhm [, hkl]]" (comma, tab, or whitespace delimited) */
export function parseBulkPeaksText(raw: string): { peaks: Omit<SyntheticPeak, 'id'>[]; skippedLines: number } {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

  const parsed: Omit<SyntheticPeak, 'id'>[] = [];
  let skippedLines = 0;

  for (const line of lines) {
    const parts = line.split(/[,\t;]+|\s+/).filter(Boolean);
    if (parts.length < 2) {
      skippedLines++;
      continue;
    }
    const tt = parseFloat(parts[0]);
    const inten = parseFloat(parts[1]);
    if (!Number.isFinite(tt) || !Number.isFinite(inten) || tt < 2 || tt > 175 || inten <= 0) {
      skippedLines++;
      continue;
    }
    const fwhmRaw = parts[2] !== undefined ? parseFloat(parts[2]) : NaN;
    const hasFwhm = Number.isFinite(fwhmRaw) && fwhmRaw >= 0.03 && fwhmRaw <= 15;
    const hkl = hasFwhm ? (parts[3] || '') : (parts[2] || '');

    parsed.push({
      twoTheta: Number(tt.toFixed(3)),
      intensity: Math.round(inten),
      fwhm: hasFwhm ? Number(fwhmRaw.toFixed(3)) : 0.45,
      etaOverride: null,
      hkl: hkl.trim(),
      enabled: true,
    });
  }

  return { peaks: parsed, skippedLines };
}

/**
 * Full scientific XRD diffractogram synthesis with adaptive peak-apex grid injection
 * so narrow Bragg reflections are never clipped or under-integrated even at coarse Δ2θ.
 */
export function synthesizeXRDCurve(params: {
  materialType: MaterialCrystallinityType;
  peaks: SyntheticPeak[];
  halo: AmorphousHaloConfig;
  physics: CurvePhysicsConfig;
  constants: PhasePhysicalConstants;
  integrationWindow: IntegrationWindow;
  fractionBasis: FractionBasis;
}): CurveSynthesisResult {
  const { peaks, halo, physics, constants, integrationWindow, fractionBasis } = params;

  const min2T = Math.max(2, Math.min(165, physics.twoThetaMin));
  const max2T = Math.max(min2T + 5, Math.min(175, physics.twoThetaMax));
  const rawStep = Math.max(0.02, Math.min(0.5, physics.stepDeg));
  const estimatedCount = Math.ceil((max2T - min2T) / rawStep) + 1;
  const step = estimatedCount > 1800 ? (max2T - min2T) / 1800 : rawStep;

  const anode = XRAY_ANODES[physics.anodeId] || XRAY_ANODES.CuKa1;
  const lambda1 = physics.anodeId === 'Custom' ? Math.max(0.1, physics.wavelengthA) : anode.lambda1;
  const lambda2 = physics.includeKa2 && anode.lambda2 ? anode.lambda2 : null;

  const intMin = Math.max(min2T, Math.min(max2T - 1, integrationWindow.minTwoTheta));
  const intMax = Math.max(intMin + 1, Math.min(max2T, integrationWindow.maxTwoTheta));

  const activePeaks = peaks.filter((p) => p.enabled && p.intensity > 0);
  // Reference strongest peak for normalized Lp + Debye-Waller attenuation
  const strongestPeak = activePeaks.reduce<SyntheticPeak | null>(
    (best, p) => (!best || p.intensity > best.intensity ? p : best),
    null
  );
  const refTwoTheta = strongestPeak ? strongestPeak.twoTheta : 25.0;

  const resolvedPeaks = activePeaks.map((p) => {
    const instH = computeInstrumentalFwhm(p.twoTheta, physics);
    const baseEta = p.etaOverride !== null ? p.etaOverride : physics.globalEta;
    const { effectiveFwhm, effectiveEta } = convolveTCHProfile(p.fwhm, baseEta, instH);

    const atten = physics.applyPhysicalAttenuation
      ? computePhysicalAttenuationFactor(p.twoTheta, refTwoTheta, lambda1, physics.debyeWallerB)
      : 1.0;
    const attenuatedIntensity = p.intensity * atten;

    let ka2TwoTheta: number | null = null;
    if (lambda2 && lambda2 > lambda1) {
      const sinT1 = Math.sin((p.twoTheta * Math.PI) / 360);
      const sinT2 = (lambda2 / lambda1) * sinT1;
      if (sinT2 < 0.999) {
        ka2TwoTheta = (Math.asin(sinT2) * 360) / Math.PI;
      }
    }

    return {
      ...p,
      instH,
      effectiveFwhm,
      effectiveEta,
      attenuatedIntensity,
      ka2TwoTheta,
    };
  });

  // Build uniform base grid + inject exact peak apex & shoulder anchors (0, ±0.35H, ±0.85H) + integration bounds
  const gridSet = new Set<number>();
  const baseCount = Math.floor((max2T - min2T) / step) + 1;
  for (let i = 0; i < baseCount; i++) {
    gridSet.add(Number((min2T + i * step).toFixed(4)));
  }
  gridSet.add(Number(max2T.toFixed(4)));
  gridSet.add(Number(intMin.toFixed(4)));
  gridSet.add(Number(intMax.toFixed(4)));

  const anchorOffsets = [-1.4, -0.7, -0.3, 0, 0.3, 0.7, 1.4];
  for (const pk of resolvedPeaks) {
    for (const m of anchorOffsets) {
      const pos = pk.twoTheta + m * pk.effectiveFwhm;
      if (pos >= min2T && pos <= max2T) {
        gridSet.add(Number(pos.toFixed(4)));
      }
      if (pk.ka2TwoTheta !== null) {
        const pos2 = pk.ka2TwoTheta + m * pk.effectiveFwhm;
        if (pos2 >= min2T && pos2 <= max2T) {
          gridSet.add(Number(pos2.toFixed(4)));
        }
      }
    }
  }

  const sortedAngles = Array.from(gridSet).sort((a, b) => a - b);

  const haloActive = halo.enabled && halo.intensity > 0;
  const secondaryHaloActive = haloActive && halo.secondaryEnabled && halo.secondaryIntensity > 0;

  const rand = mulberry32(Math.floor(physics.noiseSeed * 7919 + 13));
  const points: DiffractogramPoint[] = new Array(sortedAngles.length);

  let maxIntensity = 1;
  let maxCleanPeak = 0;
  let maxAmorphousAtPeak = 0;
  let sumNoiseSq = 0;
  let noiseSamples = 0;
  const span = Math.max(1, max2T - min2T);

  for (let i = 0; i < sortedAngles.length; i++) {
    const twoTheta = sortedAngles[i];
    const u = (twoTheta - min2T) / span;

    // 1. Background baseline
    const airScatter = Math.max(0, physics.bgLowAngleScatter) * Math.exp(-(twoTheta - min2T) / 7.5);
    const background = Math.max(0, physics.bgConstant + physics.bgSlope * u + airScatter);

    // 2. Amorphous diffuse scattering halo(s)
    let amorphous = 0;
    if (haloActive) {
      amorphous +=
        halo.intensity *
        evaluateAmorphousHalo(twoTheta, halo.centerTwoTheta, halo.fwhm, halo.skewness, halo.eta);
      if (secondaryHaloActive) {
        amorphous +=
          halo.secondaryIntensity *
          evaluateAmorphousHalo(
            twoTheta,
            halo.secondaryCenter,
            halo.secondaryFwhm,
            halo.skewness * 0.5,
            halo.eta
          );
      }
    }

    // 3. Crystalline Bragg peaks
    let crystalline = 0;
    for (let k = 0; k < resolvedPeaks.length; k++) {
      const pk = resolvedPeaks[k];
      const dx = twoTheta - pk.twoTheta;
      if (Math.abs(dx) < pk.effectiveFwhm * 18) {
        crystalline += pk.attenuatedIntensity * evaluatePseudoVoigt(dx, pk.effectiveFwhm, pk.effectiveEta);
      }
      if (pk.ka2TwoTheta !== null) {
        const dx2 = twoTheta - pk.ka2TwoTheta;
        if (Math.abs(dx2) < pk.effectiveFwhm * 18) {
          crystalline +=
            0.5 * pk.attenuatedIntensity * evaluatePseudoVoigt(dx2, pk.effectiveFwhm, pk.effectiveEta);
        }
      }
    }

    const cleanTotal = background + amorphous + crystalline;

    // 4. Deterministic Box-Muller Poisson counting noise
    let noise = 0;
    if (physics.noiseEnabled && physics.noiseScale > 0) {
      const u1 = Math.max(1e-7, rand());
      const u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      noise = z * Math.sqrt(Math.max(1, cleanTotal)) * physics.noiseScale;
      sumNoiseSq += noise * noise;
      noiseSamples++;
    }

    const total = Math.max(0, cleanTotal + noise);
    if (total > maxIntensity) maxIntensity = total;
    if (cleanTotal > maxIntensity) maxIntensity = cleanTotal;

    if (twoTheta >= intMin && twoTheta <= intMax) {
      if (crystalline + amorphous > maxCleanPeak) {
        maxCleanPeak = crystalline + amorphous;
        maxAmorphousAtPeak = amorphous;
      }
    }

    const dSpacing = computeBraggDSpacing(twoTheta, lambda1);
    const qValue = dSpacing > 0 ? (2 * Math.PI) / dSpacing : 0;

    points[i] = {
      twoTheta,
      dSpacing,
      qValue,
      background,
      amorphous,
      crystalline,
      noise,
      cleanTotal,
      total,
      amorphousEnvelope: background + amorphous,
      crystallineEnvelope: background + amorphous + crystalline,
    };
  }

  // Exact Trapezoidal Integration on the peak-anchored grid over [intMin, intMax]
  let areaCrystalline = 0;
  let areaAmorphous = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (p1.twoTheta <= intMin + 1e-9 || p0.twoTheta >= intMax - 1e-9) continue;

    const dt = p1.twoTheta - p0.twoTheta;
    if (dt <= 0) continue;

    areaCrystalline += 0.5 * (p0.crystalline + p1.crystalline) * dt;
    areaAmorphous += 0.5 * (p0.amorphous + p1.amorphous) * dt;
  }

  const areaTotal = areaCrystalline + areaAmorphous;
  const rawWeightFraction = areaTotal > 1e-9 ? areaCrystalline / areaTotal : 0;
  const fractions = convertCrystallinityFractions(rawWeightFraction, constants);

  const activeBasisPct =
    fractionBasis === 'volume'
      ? fractions.volumePct
      : fractionBasis === 'mole'
      ? fractions.molePct
      : fractions.weightPct;

  const peakSummaries: DerivedPeakSummary[] = peaks.map((p) => {
    const instH = computeInstrumentalFwhm(p.twoTheta, physics);
    const baseEta = p.etaOverride !== null ? p.etaOverride : physics.globalEta;
    const { effectiveFwhm, effectiveEta } = convolveTCHProfile(p.fwhm, baseEta, instH);
    const atten = physics.applyPhysicalAttenuation
      ? computePhysicalAttenuationFactor(p.twoTheta, refTwoTheta, lambda1, physics.debyeWallerB)
      : 1.0;
    const attenuatedIntensity = p.intensity * atten;
    const ka2Multiplier = lambda2 && lambda2 > lambda1 ? 1.5 : 1.0;
    const dSpacingA = computeBraggDSpacing(p.twoTheta, lambda1);
    const qValue = dSpacingA > 0 ? (2 * Math.PI) / dSpacingA : 0;
    const integralBreadthDeg = effectiveFwhm * pseudoVoigtAreaFactor(effectiveEta);

    return {
      id: p.id,
      hkl: p.hkl || '—',
      twoTheta: p.twoTheta,
      intensity: p.intensity,
      attenuatedIntensity,
      sampleFwhm: p.fwhm,
      instrumentalFwhm: instH,
      effectiveFwhm,
      eta: effectiveEta,
      dSpacingA,
      qValue,
      scherrerSizeNm: computeScherrerSizeNm(p.twoTheta, p.fwhm, lambda1),
      integralBreadthDeg,
      analyticalArea: computeAnalyticalPeakArea(attenuatedIntensity, effectiveFwhm, effectiveEta) * ka2Multiplier,
      inIntegrationWindow: p.twoTheta >= intMin && p.twoTheta <= intMax,
      enabled: p.enabled,
    };
  });

  const enabledSummaries = peakSummaries.filter((p) => p.enabled);
  const peaksInsideWindow = enabledSummaries.filter((p) => p.inIntegrationWindow).length;
  const analyticalCrystallineArea = enabledSummaries.reduce((acc, p) => acc + p.analyticalArea, 0);

  // Percentage of analytical crystalline tail/peak area missed outside [intMin, intMax]
  const tailTruncationPct =
    analyticalCrystallineArea > 1e-6
      ? Math.max(0, Math.min(100, (1 - areaCrystalline / analyticalCrystallineArea) * 100))
      : 0;

  // Intensity-weighted mean Scherrer crystallite size
  let sizeWeightSum = 0;
  let sizeWeightedAccum = 0;
  for (const s of enabledSummaries) {
    if (s.scherrerSizeNm !== null && s.attenuatedIntensity > 0) {
      sizeWeightedAccum += s.scherrerSizeNm * s.attenuatedIntensity;
      sizeWeightSum += s.attenuatedIntensity;
    }
  }
  const meanScherrerNm = sizeWeightSum > 0 ? sizeWeightedAccum / sizeWeightSum : null;

  // Segal peak-height crystallinity index benchmark: (I_max - I_am) / I_max * 100
  const segalIndexPct =
    maxCleanPeak > 1 && haloActive
      ? Math.max(0, Math.min(100, ((maxCleanPeak - maxAmorphousAtPeak) / maxCleanPeak) * 100))
      : enabledSummaries.length > 0
      ? 100
      : 0;

  const rmsNoise = noiseSamples > 0 ? Math.sqrt(sumNoiseSq / noiseSamples) : 0;
  const signalToNoiseRatio = rmsNoise > 1e-3 ? maxCleanPeak / rmsNoise : Infinity;

  return {
    points,
    metrics: {
      areaCrystalline,
      areaAmorphous,
      areaTotal,
      analyticalCrystallineArea,
      tailTruncationPct,
      crystallinityWeightPct: fractions.weightPct,
      crystallinityVolumePct: fractions.volumePct,
      crystallinityMolePct: fractions.molePct,
      amorphousWeightPct: 100 - fractions.weightPct,
      amorphousVolumePct: 100 - fractions.volumePct,
      amorphousMolePct: 100 - fractions.molePct,
      activeBasisPct,
      activeAmorphousPct: 100 - activeBasisPct,
      segalIndexPct,
      observedClass: classifyMaterialFromXc(activeBasisPct),
      meanScherrerNm,
      signalToNoiseRatio,
      maxIntensity,
      activePeakCount: activePeaks.length,
      peaksInsideWindow,
      integrationMin: intMin,
      integrationMax: intMax,
      peakSummaries,
    },
  };
}

export function exportCurveToCSV(
  result: CurveSynthesisResult,
  meta: {
    sampleName: string;
    materialType: MaterialCrystallinityType;
    wavelengthA: number;
  }
): string {
  const header = [
    `# XRD-Calc Pro — Build Your XRD Curves Export`,
    `# Sample: ${meta.sampleName} | Declared Class: ${meta.materialType} | Observed Class: ${result.metrics.observedClass} | Wavelength: ${meta.wavelengthA.toFixed(6)} A`,
    `# Integrated Area Crystalline (Ac): ${result.metrics.areaCrystalline.toFixed(4)} | Amorphous (Aa): ${result.metrics.areaAmorphous.toFixed(4)} | Tail Truncation: ${result.metrics.tailTruncationPct.toFixed(2)}%`,
    `# Degree of Crystallinity (Weight Xw): ${result.metrics.crystallinityWeightPct.toFixed(2)}% | Volume Xv: ${result.metrics.crystallinityVolumePct.toFixed(2)}% | Mole Xn: ${result.metrics.crystallinityMolePct.toFixed(2)}%`,
    `2Theta_deg,d_spacing_A,Q_invA,Total_Intensity_cps,Clean_Total_cps,Crystalline_Component_cps,Amorphous_Halo_cps,Background_cps`,
  ];

  const rows = result.points.map(
    (pt) =>
      `${pt.twoTheta.toFixed(4)},${pt.dSpacing.toFixed(5)},${pt.qValue.toFixed(5)},${pt.total.toFixed(3)},${pt.cleanTotal.toFixed(3)},${pt.crystalline.toFixed(3)},${pt.amorphous.toFixed(3)},${pt.background.toFixed(3)}`
  );

  return [...header, ...rows].join('\n');
}

export function exportCurveToXY(result: CurveSynthesisResult): string {
  return result.points
    .map((pt) => `${pt.twoTheta.toFixed(4)} ${pt.total.toFixed(4)}`)
    .join('\n');
}

export function buildCrystallinityReport(params: {
  sampleName: string;
  materialType: MaterialCrystallinityType;
  physics: CurvePhysicsConfig;
  constants: PhasePhysicalConstants;
  fractionBasis: FractionBasis;
  result: CurveSynthesisResult;
}): string {
  const { sampleName, materialType, physics, constants, fractionBasis, result } = params;
  const { metrics } = result;
  const anode = XRAY_ANODES[physics.anodeId] || XRAY_ANODES.CuKa1;
  const lambda = physics.anodeId === 'Custom' ? physics.wavelengthA : anode.lambda1;

  const peakLines =
    metrics.peakSummaries.filter((p) => p.enabled).length > 0
      ? metrics.peakSummaries
          .filter((p) => p.enabled)
          .map(
            (p, idx) =>
              `  ${idx + 1}. 2θ = ${p.twoTheta.toFixed(2)}° | I = ${p.attenuatedIntensity.toFixed(0)} cps | β_eff = ${p.effectiveFwhm.toFixed(3)}° | β_int = ${p.integralBreadthDeg.toFixed(3)}° | d = ${p.dSpacingA.toFixed(4)} Å | D ≈ ${p.scherrerSizeNm ? p.scherrerSizeNm.toFixed(1) + ' nm' : '—'} | hkl = ${p.hkl}`
          )
          .join('\n')
      : '  None (pure amorphous diffuse scattering)';

  return [
    `XRD CURVE SYNTHESIS & DEGREE OF CRYSTALLINITY REPORT`,
    `====================================================`,
    `Sample Name:        ${sampleName}`,
    `Material Class:     ${materialType.toUpperCase()} (Observed by Xc: ${metrics.observedClass.toUpperCase()})`,
    `Radiation Source:   ${anode.symbol} (λ = ${lambda.toFixed(6)} Å${physics.includeKa2 ? ', Kα₂ doublet included' : ''})`,
    `Broadening Model:   ${physics.useCaglioti ? `TCH-Voigt + Caglioti (U=${physics.cagliotiU}, V=${physics.cagliotiV}, W=${physics.cagliotiW})` : `TCH-Voigt (β_inst=${physics.instrumentalFwhm.toFixed(3)}°)`}`,
    `Attenuation:        ${physics.applyPhysicalAttenuation ? `Lp × Debye-Waller (B_iso = ${physics.debyeWallerB.toFixed(2)} Å²)` : 'Direct peak height scaling'}`,
    `Scan Range:         ${physics.twoThetaMin.toFixed(1)}° – ${physics.twoThetaMax.toFixed(1)}° (Δ2θ = ${physics.stepDeg.toFixed(3)}°)`,
    `Integration Window: ${metrics.integrationMin.toFixed(1)}° – ${metrics.integrationMax.toFixed(1)}° (Tail truncation: ${metrics.tailTruncationPct.toFixed(2)}%)`,
    ``,
    `SCIENTIFIC DEFINITION`,
    `Crystalline percentage (degree of crystallinity, Xc) is the proportion of a solid material`,
    `that has atoms or molecules arranged in a regular, repeating crystal structure rather than`,
    `a disordered amorphous state, expressed on a scale from 0% (fully amorphous) to 100% (fully crystalline).`,
    ``,
    `INTEGRATED AREA FORMULA & SUBSTITUTION`,
    `  Xc (%) = [ A_crystalline / (A_crystalline + A_amorphous) ] × 100`,
    `  A_crystalline = ∫ I_cryst(2θ) d(2θ)  = ${metrics.areaCrystalline.toFixed(2)} cps·deg`,
    `  A_amorphous   = ∫ I_amorph(2θ) d(2θ) = ${metrics.areaAmorphous.toFixed(2)} cps·deg`,
    `  A_total       = A_c + A_a            = ${metrics.areaTotal.toFixed(2)} cps·deg`,
    `  Xc (Weight %) = (${metrics.areaCrystalline.toFixed(2)} / ${metrics.areaTotal.toFixed(2)}) × 100 = ${metrics.crystallinityWeightPct.toFixed(2)}%`,
    `  Segal Peak-Height Index (Benchmark):   ${metrics.segalIndexPct !== null ? metrics.segalIndexPct.toFixed(2) + '%' : '—'}`,
    `  Weighted Mean Crystallite Size ⟨D⟩:    ${metrics.meanScherrerNm !== null ? metrics.meanScherrerNm.toFixed(1) + ' nm' : '—'}`,
    ``,
    `FRACTION BASIS SUMMARY (Active Basis: ${fractionBasis.toUpperCase()})`,
    `  Weight Fraction (Xw): ${metrics.crystallinityWeightPct.toFixed(2)}% crystalline  |  ${metrics.amorphousWeightPct.toFixed(2)}% amorphous`,
    `  Volume Fraction (Xv): ${metrics.crystallinityVolumePct.toFixed(2)}% crystalline  |  ${metrics.amorphousVolumePct.toFixed(2)}% amorphous  (ρ_c = ${constants.rhoCrystalline} g/cm³, ρ_a = ${constants.rhoAmorphous} g/cm³)`,
    `  Mole Fraction   (Xn): ${metrics.crystallinityMolePct.toFixed(2)}% crystalline  |  ${metrics.amorphousMolePct.toFixed(2)}% amorphous  (M_c = ${constants.molarMassCrystalline} g/mol, M_a = ${constants.molarMassAmorphous} g/mol)`,
    ``,
    `DEFINED BRAGG PEAKS (${metrics.activePeakCount} active)`,
    peakLines,
  ].join('\n');
}
