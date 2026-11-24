export type ProfileModelType =
  | 'Gaussian'
  | 'Lorentzian'
  | 'Pseudo-Voigt'
  | 'Split Pseudo-Voigt'
  | 'Pearson VII';

export type DeconvolutionLaw = 'Voigt' | 'Halder-Wagner' | 'Gaussian' | 'Lorentzian';

export type WeightingScheme = 'poisson' | 'uniform';

export type AnodeKey = 'CuKa1' | 'CuKa' | 'CoKa1' | 'MoKa1' | 'CrKa1' | 'FeKa1' | 'Custom';

export interface XRayAnodeOption {
  id: AnodeKey;
  label: string;
  symbol: string;
  lambda1A: number; // Å
  lambda2A: number | null; // Å
  ka2Ratio: number;
}

export const FWHM_XRAY_ANODES: Record<AnodeKey, XRayAnodeOption> = {
  CuKa1: { id: 'CuKa1', label: 'Copper Kα₁ (Monochromated)', symbol: 'Cu Kα₁', lambda1A: 1.540598, lambda2A: 1.544426, ka2Ratio: 0.5 },
  CuKa: { id: 'CuKa', label: 'Copper Kα (Weighted Avg)', symbol: 'Cu Kα', lambda1A: 1.54184, lambda2A: 1.544426, ka2Ratio: 0.5 },
  CoKa1: { id: 'CoKa1', label: 'Cobalt Kα₁ (Fe-rich samples)', symbol: 'Co Kα₁', lambda1A: 1.78897, lambda2A: 1.79285, ka2Ratio: 0.5 },
  MoKa1: { id: 'MoKa1', label: 'Molybdenum Kα₁ (High-Q)', symbol: 'Mo Kα₁', lambda1A: 0.70930, lambda2A: 0.71359, ka2Ratio: 0.5 },
  CrKa1: { id: 'CrKa1', label: 'Chromium Kα₁ (High dispersion)', symbol: 'Cr Kα₁', lambda1A: 2.28970, lambda2A: 2.29361, ka2Ratio: 0.5 },
  FeKa1: { id: 'FeKa1', label: 'Iron Kα₁', symbol: 'Fe Kα₁', lambda1A: 1.93604, lambda2A: 1.93998, ka2Ratio: 0.5 },
  Custom: { id: 'Custom', label: 'Custom λ (Å)', symbol: 'Custom λ', lambda1A: 1.5406, lambda2A: null, ka2Ratio: 0.5 },
};

export interface CagliotiPreset {
  id: string;
  label: string;
  u: number;
  v: number;
  w: number;
  instEta: number;
}

export const CAGLIOTI_INSTRUMENT_PRESETS: CagliotiPreset[] = [
  { id: 'lab_cu', label: 'Lab Cu Kα (LaB₆ SRM 660c)', u: 0.0085, v: -0.0042, w: 0.0048, instEta: 0.25 },
  { id: 'high_res_lab', label: 'High-Res Monochromator', u: 0.0035, v: -0.0018, w: 0.0020, instEta: 0.18 },
  { id: 'synchrotron', label: 'Synchrotron Capillary', u: 0.0006, v: -0.0002, w: 0.0004, instEta: 0.15 },
  { id: 'neutron', label: 'Constant-Wavelength Neutron', u: 0.085, v: -0.065, w: 0.045, instEta: 0.08 },
  { id: 'ideal_zero', label: 'Ideal Zero Broadening', u: 0, v: 0, w: 0, instEta: 0 },
];

export const PEAK_PALETTE = [
  '#2563eb', // Cobalt
  '#0891b2', // Calibrated Cyan
  '#d97706', // Telemetry Amber
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#e11d48', // Crimson
];

export interface FitPeakParam {
  id: string;
  label: string;
  color: string;
  enabled: boolean;
  center: number; // 2θ (deg)
  amplitude: number; // net peak height (cps)
  fwhm: number; // observed total FWHM (deg)
  eta: number; // Pseudo-Voigt Lorentzian fraction [0..1]
  pearsonM: number; // Pearson VII exponent [0.85..25]
  asymmetry: number; // H_R / H_L ratio [0.35..2.8], 1.0 = symmetric
  lockCenter: boolean;
  lockFwhm: boolean;
  lockShape: boolean;
  lockAsymmetry: boolean;
}

export interface BackgroundConfig {
  order: 0 | 1 | 2; // 0 = constant, 1 = linear, 2 = quadratic
  b0: number;
  b1: number;
  b2: number;
}

export interface InstrumentOpticsConfig {
  anodeId: AnodeKey;
  customWavelengthA: number;
  includeKa2: boolean;
  ka2Ratio: number;
  enableInstCorrection: boolean;
  useCaglioti: boolean;
  fixedInstFwhm: number; // deg
  cagliotiU: number;
  cagliotiV: number;
  cagliotiW: number;
  instEta: number; // instrumental Lorentzian fraction
  deconvolutionLaw: DeconvolutionLaw;
  scherrerK: number;
  weighting: WeightingScheme;
  shareShapeAcrossPeaks: boolean; // Global coupled η or m constraint for overlapping doublets
}

export interface RawXYPoint {
  x: number; // 2θ (deg)
  y: number; // observed counts
}

export interface PeakUncertainty {
  centerErr: number | null;
  dSpacingErr: number | null;
  amplitudeErr: number | null;
  fwhmErr: number | null;
  sampleFwhmErr: number | null;
  shapeErr: number | null;
  asymmetryErr: number | null;
  areaErr: number | null;
  scherrerSizeErrNm: number | null;
  microstrainErrPct: number | null;
}

export interface EvaluatedPeakMetrics {
  peak: FitPeakParam;
  dSpacingA: number;
  qInvA: number;
  centroidDeg: number; // First-moment centroid (differs from apex when asymmetric)
  fwhmObs: number;
  hwhmLeft: number;
  hwhmRight: number;
  fwtmLeft: number;
  fwtmRight: number;
  fwtmObs: number;
  fwtmToFwhm: number;
  integralBreadthDeg: number;
  shapeFactorPhi: number; // FWHM / beta_I (0.6366 Lorentzian .. 0.9394 Gaussian)
  integratedArea: number;
  areaFractionPct: number;
  instFwhmDeg: number;
  sampleFwhmDeg: number;
  sampleGaussianDeg: number;
  sampleLorentzianDeg: number;
  scherrerSizeNm: number | null;
  microstrainPct: number | null;
  dislocationDensityM2: number | null; // m^-2
  resolutionLimited: boolean;
  ka2CenterDeg: number | null;
  uncertainty: PeakUncertainty;
}

export interface ResidualSpikeCandidate {
  twoTheta: number;
  netHeight: number;
  zScore: number; // residual / sigma
  estimatedFwhm: number;
}

export interface PeakResolutionPair {
  peakA: string;
  peakB: string;
  separationDeg: number;
  resolutionRs: number; // |x2 - x1| / (0.5*(H1 + H2)); < 1.0 = strongly overlapping
}

export interface FitDiagnosticAlert {
  id: string;
  severity: 'info' | 'warning';
  title: string;
  detail: string;
  actionKind?: 'add_residual_peak' | 'switch_split_pv' | 'enable_shared_shape' | 'run_benchmark';
  actionLabel?: string;
}

export interface WilliamsonHallSummary {
  valid: boolean;
  peakCount: number;
  sizeNm: number | null;
  microstrainPct: number | null;
  rSquared: number | null;
  weightedMeanScherrerNm: number | null;
  weightedStdScherrerNm: number | null;
}

export interface FitStatistics {
  nPoints: number;
  nParams: number;
  dof: number;
  rwp: number; // %
  rp: number; // %
  rexp: number; // %
  rSquared: number;
  chi2Reduced: number;
  gof: number; // sqrt(chi2Reduced)
  rss: number;
  rmse: number;
  durbinWatson: number;
  aic: number;
  bic: number;
  maxParamCorrelation: number; // max |r_ij| from covariance matrix (0..1)
  converged: boolean;
  iterations: number;
}

export interface EvaluatedCurvePoint {
  x: number;
  dSpacing: number;
  qValue: number;
  yObs: number;
  yCalc: number;
  yBg: number;
  yNetObs: number;
  yNetCalc: number;
  yKa2Total: number;
  yRachinger: number;
  residual: number;
  sigma: number;
  d1: number;
  d2: number;
  peakValues: Record<string, number>;
}

export interface ModelBenchmarkRow {
  model: ProfileModelType;
  stats: FitStatistics;
  peaks: FitPeakParam[];
  background: BackgroundConfig;
  uncertainties: Record<string, PeakUncertainty>;
  deltaAic: number;
  akaikeWeightPct: number;
  isBest: boolean;
}

export interface FWHMScenarioPreset {
  id: string;
  name: string;
  subtitle: string;
  materialTag: string;
  recommendedModel: ProfileModelType;
  optics: Partial<InstrumentOpticsConfig>;
  background: BackgroundConfig;
  truePeaks: Omit<FitPeakParam, 'id' | 'color' | 'lockCenter' | 'lockFwhm' | 'lockShape' | 'lockAsymmetry'>[];
  initialPeaks: Omit<FitPeakParam, 'id' | 'color' | 'lockCenter' | 'lockFwhm' | 'lockShape' | 'lockAsymmetry'>[];
  xMin: number;
  xMax: number;
  stepDeg: number;
  noiseScale: number;
  seed: number;
}

// ============================================================================
// MATHEMATICAL CONSTANTS & SPECIAL FUNCTIONS
// ============================================================================

const LN2 = Math.LN2;
const FOUR_LN2 = 4 * LN2;
const K_GAUSS = Math.sqrt(Math.PI / FOUR_LN2); // 1.06446701943
const K_LORENTZ = Math.PI / 2; // 1.57079632679
const PHI_GAUSS = 1 / K_GAUSS; // 0.9394372787
const PHI_LORENTZ = 1 / K_LORENTZ; // 0.6366197724

/** Lanczos approximation for ln(Gamma(z)), accurate to ~1e-12 for z > 0.5 */
function lnGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  }
  const zm = z - 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) {
    x += p[i] / (zm + i);
  }
  const t = zm + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zm + 0.5) * Math.log(t) - t + Math.log(x);
}

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

export function getActiveWavelengthA(optics: InstrumentOpticsConfig): {
  lambda1A: number;
  lambda2A: number | null;
} {
  const anode = FWHM_XRAY_ANODES[optics.anodeId] || FWHM_XRAY_ANODES.CuKa1;
  const lambda1A =
    optics.anodeId === 'Custom'
      ? Math.max(0.1, optics.customWavelengthA)
      : anode.lambda1A;
  const lambda2A = optics.includeKa2 && anode.lambda2A ? anode.lambda2A : null;
  return { lambda1A, lambda2A };
}

export function computeKa2Angle(centerTwoTheta: number, lambda1A: number, lambda2A: number | null): number | null {
  if (!lambda2A || lambda2A <= lambda1A) return null;
  const sin1 = Math.sin((centerTwoTheta * Math.PI) / 360);
  const sin2 = (lambda2A / lambda1A) * sin1;
  if (sin2 >= 0.999) return null;
  return (Math.asin(sin2) * 360) / Math.PI;
}

export function computeDSpacingA(twoThetaDeg: number, wavelengthA: number): number {
  const sinT = Math.sin((Math.max(0.1, Math.min(179.8, twoThetaDeg)) * Math.PI) / 360);
  return sinT > 1e-6 ? wavelengthA / (2 * sinT) : 0;
}

/** Slice raw dataset to an optional active fitting window [min2T, max2T] */
export function sliceDataToWindow(
  data: RawXYPoint[],
  fitWindow: [number, number] | null
): RawXYPoint[] {
  if (!fitWindow || data.length === 0) return data;
  const [lo, hi] = fitWindow;
  const sliced = data.filter((pt) => pt.x >= lo - 1e-6 && pt.x <= hi + 1e-6);
  return sliced.length >= 6 ? sliced : data;
}

// ============================================================================
// LINE-PROFILE KERNELS, SHAPE CONVERSIONS & ANALYTICAL INTEGRALS
// ============================================================================

/** Evaluate normalized profile kernel (peak height = 1 at dx = 0) */
export function evaluateProfileKernel(
  dx: number,
  model: ProfileModelType,
  fwhm: number,
  eta: number,
  pearsonM: number,
  asymmetry: number
): number {
  const H = Math.max(0.01, fwhm);

  if (model === 'Gaussian') {
    const r = dx / H;
    return Math.exp(-FOUR_LN2 * r * r);
  }

  if (model === 'Lorentzian') {
    const r = dx / H;
    return 1 / (1 + 4 * r * r);
  }

  if (model === 'Pseudo-Voigt') {
    const e = Math.max(0, Math.min(1, eta));
    const r = dx / H;
    const r2 = r * r;
    return (1 - e) * Math.exp(-FOUR_LN2 * r2) + e / (1 + 4 * r2);
  }

  if (model === 'Split Pseudo-Voigt') {
    const e = Math.max(0, Math.min(1, eta));
    const asym = Math.max(0.35, Math.min(2.8, asymmetry));
    const hLeft = (2 * H) / (1 + asym);
    const hRight = (2 * H * asym) / (1 + asym);
    const hSide = dx < 0 ? hLeft : hRight;
    const r = dx / Math.max(0.01, hSide);
    const r2 = r * r;
    return (1 - e) * Math.exp(-FOUR_LN2 * r2) + e / (1 + 4 * r2);
  }

  // Pearson VII
  const m = Math.max(0.65, Math.min(30, pearsonM));
  const c = Math.pow(2, 1 / m) - 1;
  const r = dx / H;
  return Math.pow(1 + 4 * c * r * r, -m);
}

/** Analytical area factor k such that Area = I_max * FWHM * k */
export function computeProfileAreaFactor(
  model: ProfileModelType,
  eta: number,
  pearsonM: number
): number {
  if (model === 'Gaussian') return K_GAUSS;
  if (model === 'Lorentzian') return K_LORENTZ;
  if (model === 'Pseudo-Voigt' || model === 'Split Pseudo-Voigt') {
    const e = Math.max(0, Math.min(1, eta));
    return (1 - e) * K_GAUSS + e * K_LORENTZ;
  }
  const m = Math.max(0.65, Math.min(30, pearsonM));
  if (m >= 28) return K_GAUSS;
  const c = Math.max(1e-9, Math.pow(2, 1 / m) - 1);
  const gammaRatio = Math.exp(lnGamma(m - 0.5) - lnGamma(m));
  return (Math.sqrt(Math.PI) * gammaRatio) / (2 * Math.sqrt(c));
}

/** Exact mapping from any profile's shape factor phi = FWHM / beta_I to equivalent Voigt Lorentzian fraction eta */
export function shapeFactorToEquivalentEta(phi: number): number {
  const clamped = Math.max(PHI_LORENTZ, Math.min(PHI_GAUSS, phi));
  // Since k(eta) = 1/phi = (1-eta)*K_GAUSS + eta*K_LORENTZ
  const k = 1 / clamped;
  return Math.max(0, Math.min(1, (k - K_GAUSS) / (K_LORENTZ - K_GAUSS)));
}

/** Map Pseudo-Voigt eta in [0, 1] to shape-factor-matched Pearson VII exponent m in [1, 25] */
export function etaToMatchedPearsonM(eta: number): number {
  const targetK = computeProfileAreaFactor('Pseudo-Voigt', eta, 2);
  if (targetK >= K_LORENTZ - 1e-4) return 1.0;
  if (targetK <= K_GAUSS + 1e-4) return 22.0;
  let lo = 1.0;
  let hi = 25.0;
  for (let i = 0; i < 24; i++) {
    const mid = 0.5 * (lo + hi);
    const kMid = computeProfileAreaFactor('Pearson VII', 0.5, mid);
    if (kMid > targetK) lo = mid;
    else hi = mid;
  }
  return Number((0.5 * (lo + hi)).toFixed(3));
}

/** Exact numerical/analytical FWTM / FWHM ratio for the given profile model */
export function computeFwtmRatio(
  model: ProfileModelType,
  eta: number,
  pearsonM: number
): number {
  if (model === 'Gaussian') return Math.sqrt(Math.log(10) / LN2); // 1.822616
  if (model === 'Lorentzian') return 3.0;
  if (model === 'Pearson VII') {
    const m = Math.max(0.65, Math.min(30, pearsonM));
    return Math.sqrt((Math.pow(10, 1 / m) - 1) / (Math.pow(2, 1 / m) - 1));
  }
  const e = Math.max(0, Math.min(1, eta));
  let lo = 0.5;
  let hi = 2.0;
  for (let i = 0; i < 30; i++) {
    const mid = 0.5 * (lo + hi);
    const r2 = mid * mid;
    const val = (1 - e) * Math.exp(-FOUR_LN2 * r2) + e / (1 + 4 * r2);
    if (val > 0.1) lo = mid;
    else hi = mid;
  }
  return lo + hi;
}

export function evaluateBackground(
  x: number,
  xMin: number,
  xMax: number,
  bg: BackgroundConfig
): number {
  const span = Math.max(1e-6, xMax - xMin);
  const u = (2 * (x - xMin)) / span - 1; // normalized [-1, +1] for orthogonal conditioning
  if (bg.order === 0) return bg.b0;
  if (bg.order === 1) return bg.b0 + bg.b1 * u;
  return bg.b0 + bg.b1 * u + bg.b2 * u * u;
}

export function evaluateSinglePeakAt(
  x: number,
  pk: FitPeakParam,
  model: ProfileModelType,
  lambda1A: number,
  lambda2A: number | null,
  ka2Ratio: number
): { primary: number; ka2: number } {
  if (!pk.enabled || pk.amplitude <= 0) return { primary: 0, ka2: 0 };
  const primary =
    pk.amplitude *
    evaluateProfileKernel(x - pk.center, model, pk.fwhm, pk.eta, pk.pearsonM, pk.asymmetry);

  let ka2 = 0;
  if (lambda2A && ka2Ratio > 0) {
    const c2 = computeKa2Angle(pk.center, lambda1A, lambda2A);
    if (c2 !== null) {
      ka2 =
        pk.amplitude *
        ka2Ratio *
        evaluateProfileKernel(x - c2, model, pk.fwhm, pk.eta, pk.pearsonM, pk.asymmetry);
    }
  }
  return { primary, ka2 };
}

export function evaluateModelAt(
  x: number,
  xMin: number,
  xMax: number,
  peaks: FitPeakParam[],
  background: BackgroundConfig,
  model: ProfileModelType,
  optics: InstrumentOpticsConfig
): number {
  const { lambda1A, lambda2A } = getActiveWavelengthA(optics);
  let y = evaluateBackground(x, xMin, xMax, background);
  for (let i = 0; i < peaks.length; i++) {
    const pk = peaks[i];
    if (!pk.enabled) continue;
    const { primary, ka2 } = evaluateSinglePeakAt(x, pk, model, lambda1A, lambda2A, optics.ka2Ratio);
    y += primary + ka2;
  }
  return y;
}

// ============================================================================
// INSTRUMENTAL BROADENING & VOIGT DECONVOLUTION
// ============================================================================

export function computeInstrumentalFwhmDeg(
  twoThetaDeg: number,
  optics: InstrumentOpticsConfig
): number {
  if (!optics.enableInstCorrection) return 0;
  if (!optics.useCaglioti) return Math.max(0, optics.fixedInstFwhm);
  const thetaRad = (Math.max(1, Math.min(176, twoThetaDeg)) * Math.PI) / 360;
  const tanT = Math.tan(thetaRad);
  const h2 = optics.cagliotiU * tanT * tanT + optics.cagliotiV * tanT + optics.cagliotiW;
  return h2 > 1e-8 ? Math.sqrt(h2) : 0;
}

/** Accurate inverse Thompson-Cox-Hastings decomposition (Ida et al. 2000) */
function decomposeVoigtGL(fwhm: number, eta: number): { hG: number; hL: number } {
  const H = Math.max(0, fwhm);
  const e = Math.max(0, Math.min(1, eta));
  const hL = H * (0.72928 * e + 0.19289 * e * e + 0.07783 * e * e * e);
  const hG = H * Math.sqrt(Math.max(0, 1 - 0.74417 * e - 0.24781 * e * e - 0.00810 * e * e * e));
  return { hG, hL };
}

/** Forward Thompson-Cox-Hastings 5th-order Voigt convolution */
function forwardTCH(hG: number, hL: number): number {
  if (hG <= 0 && hL <= 0) return 0;
  const h5 =
    Math.pow(hG, 5) +
    2.69269 * Math.pow(hG, 4) * hL +
    2.42843 * Math.pow(hG, 3) * Math.pow(hL, 2) +
    4.47163 * Math.pow(hG, 2) * Math.pow(hL, 3) +
    0.07842 * hG * Math.pow(hL, 4) +
    Math.pow(hL, 5);
  return Math.pow(Math.max(0, h5), 0.2);
}

export function deconvolveInstrumentalBroadening(params: {
  fwhmObs: number;
  etaObs: number;
  instFwhm: number;
  instEta: number;
  law: DeconvolutionLaw;
}): {
  sampleFwhmDeg: number;
  sampleGaussianDeg: number;
  sampleLorentzianDeg: number;
  resolutionLimited: boolean;
} {
  const { fwhmObs, etaObs, instFwhm, instEta, law } = params;
  if (instFwhm <= 1e-6) {
    const { hG, hL } = decomposeVoigtGL(fwhmObs, etaObs);
    return {
      sampleFwhmDeg: fwhmObs,
      sampleGaussianDeg: hG,
      sampleLorentzianDeg: hL,
      resolutionLimited: false,
    };
  }

  if (fwhmObs <= instFwhm * 1.01) {
    return {
      sampleFwhmDeg: 0,
      sampleGaussianDeg: 0,
      sampleLorentzianDeg: 0,
      resolutionLimited: true,
    };
  }

  if (law === 'Gaussian') {
    const s = Math.sqrt(Math.max(0, fwhmObs * fwhmObs - instFwhm * instFwhm));
    return { sampleFwhmDeg: s, sampleGaussianDeg: s, sampleLorentzianDeg: 0, resolutionLimited: s < 0.005 };
  }

  if (law === 'Lorentzian') {
    const s = Math.max(0, fwhmObs - instFwhm);
    return { sampleFwhmDeg: s, sampleGaussianDeg: 0, sampleLorentzianDeg: s, resolutionLimited: s < 0.005 };
  }

  if (law === 'Halder-Wagner') {
    const s = Math.max(0, fwhmObs - (instFwhm * instFwhm) / Math.max(1e-6, fwhmObs));
    const { hG, hL } = decomposeVoigtGL(s, etaObs);
    return { sampleFwhmDeg: s, sampleGaussianDeg: hG, sampleLorentzianDeg: hL, resolutionLimited: s < 0.005 };
  }

  const obs = decomposeVoigtGL(fwhmObs, etaObs);
  const inst = decomposeVoigtGL(instFwhm, instEta);
  const hGs = Math.sqrt(Math.max(0, obs.hG * obs.hG - inst.hG * inst.hG));
  const hLs = Math.max(0, obs.hL - inst.hL);
  const s = forwardTCH(hGs, hLs);
  return {
    sampleFwhmDeg: s,
    sampleGaussianDeg: hGs,
    sampleLorentzianDeg: hLs,
    resolutionLimited: s < 0.005,
  };
}

// ============================================================================
// LINEAR ALGEBRA, VARIABLE PROJECTION & LEVENBERG-MARQUARDT SOLVER
// ============================================================================

function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  if (n === 0) return [];
  const aug: number[][] = matrix.map((row, i) => {
    const id = new Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    let maxAbs = Math.abs(aug[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(aug[r][col]);
      if (v > maxAbs) {
        maxAbs = v;
        pivotRow = r;
      }
    }
    if (maxAbs < 1e-14) return null;
    if (pivotRow !== col) {
      const tmp = aug[col];
      aug[col] = aug[pivotRow];
      aug[pivotRow] = tmp;
    }
    const diag = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= diag;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j++) {
        aug[r][j] -= factor * aug[col][j];
      }
    }
  }

  return aug.map((row) => row.slice(n));
}

/**
 * Stage-1 Variable Projection Pre-Conditioner:
 * Holding peak positions & widths fixed, solves the exact weighted linear least squares
 * for polynomial background (b0, b1, b2) and peak amplitudes (A1..Ak).
 * Eliminates bad initial height/baseline divergence before nonlinear LM begins.
 */
function preConditionLinearAmplitudes(params: {
  data: RawXYPoint[];
  peaks: FitPeakParam[];
  background: BackgroundConfig;
  model: ProfileModelType;
  optics: InstrumentOpticsConfig;
  weights: number[];
}): { peaks: FitPeakParam[]; background: BackgroundConfig } {
  const { data, peaks, background, model, optics, weights } = params;
  const n = data.length;
  const enabledIndices: number[] = [];
  peaks.forEach((p, i) => {
    if (p.enabled) enabledIndices.push(i);
  });

  const bgTerms = background.order + 1;
  const m = bgTerms + enabledIndices.length;
  if (m === 0 || m >= n) return { peaks, background };

  const xMin = data[0].x;
  const xMax = data[n - 1].x;
  const span = Math.max(1e-6, xMax - xMin);
  const { lambda1A, lambda2A } = getActiveWavelengthA(optics);

  // Build basis columns X[j][i]
  const X: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    const x = data[i].x;
    const u = (2 * (x - xMin)) / span - 1;
    X[0][i] = 1;
    if (bgTerms >= 2) X[1][i] = u;
    if (bgTerms >= 3) X[2][i] = u * u;
    for (let k = 0; k < enabledIndices.length; k++) {
      const pk = peaks[enabledIndices[k]];
      const unitPk: FitPeakParam = { ...pk, amplitude: 1 };
      const { primary, ka2 } = evaluateSinglePeakAt(x, unitPk, model, lambda1A, lambda2A, optics.ka2Ratio);
      X[bgTerms + k][i] = primary + ka2;
    }
  }

  // Normal equations (X^T W X) c = X^T W y
  const A: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  const b: number[] = new Array<number>(m).fill(0);
  for (let j = 0; j < m; j++) {
    let bj = 0;
    for (let i = 0; i < n; i++) bj += weights[i] * X[j][i] * data[i].y;
    b[j] = bj;
    for (let k = j; k < m; k++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += weights[i] * X[j][i] * X[k][i];
      A[j][k] = s;
      A[k][j] = s;
    }
    A[j][j] += 1e-8;
  }

  const inv = invertMatrix(A);
  if (!inv) return { peaks, background };

  const c = new Array<number>(m).fill(0);
  for (let j = 0; j < m; j++) {
    let s = 0;
    for (let k = 0; k < m; k++) s += inv[j][k] * b[k];
    c[j] = s;
  }

  // Only accept linear precondition if it strictly improves weighted residual cost
  const nextBg: BackgroundConfig = {
    order: background.order,
    b0: Number.isFinite(c[0]) ? c[0] : background.b0,
    b1: bgTerms >= 2 && Number.isFinite(c[1]) ? c[1] : background.b1,
    b2: bgTerms >= 3 && Number.isFinite(c[2]) ? c[2] : background.b2,
  };
  const maxY = Math.max(1, ...data.map((d) => d.y));
  const nextPeaks = peaks.map((pk) => ({ ...pk }));
  enabledIndices.forEach((pIdx, k) => {
    const solvedAmp = c[bgTerms + k];
    if (Number.isFinite(solvedAmp)) {
      nextPeaks[pIdx].amplitude = Math.max(Math.max(5, maxY * 0.01), Math.min(maxY * 3, solvedAmp));
    }
  });

  let oldCost = 0;
  let newCost = 0;
  for (let i = 0; i < n; i++) {
    const rOld = data[i].y - evaluateModelAt(data[i].x, xMin, xMax, peaks, background, model, optics);
    const rNew = data[i].y - evaluateModelAt(data[i].x, xMin, xMax, nextPeaks, nextBg, model, optics);
    oldCost += weights[i] * rOld * rOld;
    newCost += weights[i] * rNew * rNew;
  }

  return newCost < oldCost ? { peaks: nextPeaks, background: nextBg } : { peaks, background };
}

interface ParamDescriptor {
  kind:
    | 'bg0'
    | 'bg1'
    | 'bg2'
    | 'center'
    | 'amplitude'
    | 'fwhm'
    | 'eta'
    | 'pearsonM'
    | 'asymmetry'
    | 'sharedEta'
    | 'sharedPearsonM';
  peakIdx: number; // -1 for bg or shared
  sharedPeakIndices?: number[];
  min: number;
  max: number;
  step: number;
  maxStepJump: number; // trust-region per-iteration clamp to prevent peak swapping
}

/** Exact free-parameter count respecting per-peak locks and shared-shape constraints */
export function countFreeParameters(
  peaks: FitPeakParam[],
  background: BackgroundConfig,
  model: ProfileModelType,
  shareShapeAcrossPeaks: boolean
): number {
  let count = background.order + 1;
  const enabled = peaks.filter((p) => p.enabled);
  let hasUnlockedShape = false;

  for (const pk of enabled) {
    if (!pk.lockCenter) count++;
    count++; // amplitude
    if (!pk.lockFwhm) count++;
    if ((model === 'Pseudo-Voigt' || model === 'Split Pseudo-Voigt' || model === 'Pearson VII') && !pk.lockShape) {
      if (shareShapeAcrossPeaks) hasUnlockedShape = true;
      else count++;
    }
    if (model === 'Split Pseudo-Voigt' && !pk.lockAsymmetry) count++;
  }

  if (shareShapeAcrossPeaks && hasUnlockedShape) count++;
  return count;
}

export interface LMFitResult {
  peaks: FitPeakParam[];
  background: BackgroundConfig;
  stats: FitStatistics;
  uncertainties: Record<string, PeakUncertainty>;
}

export function fitMultiPeakLM(params: {
  data: RawXYPoint[];
  peaks: FitPeakParam[];
  background: BackgroundConfig;
  model: ProfileModelType;
  optics: InstrumentOpticsConfig;
  maxIterations?: number;
}): LMFitResult {
  const { data, model, optics, maxIterations = 50 } = params;
  const n = data.length;
  const emptyUnc: Record<string, PeakUncertainty> = {};
  params.peaks.forEach((p) => {
    emptyUnc[p.id] = {
      centerErr: null,
      dSpacingErr: null,
      amplitudeErr: null,
      fwhmErr: null,
      sampleFwhmErr: null,
      shapeErr: null,
      asymmetryErr: null,
      areaErr: null,
      scherrerSizeErrNm: null,
      microstrainErrPct: null,
    };
  });

  if (n < 5) {
    return {
      peaks: params.peaks,
      background: params.background,
      stats: computeFitStatistics(data, params.peaks, params.background, model, optics, 0, false, 0, 0),
      uncertainties: emptyUnc,
    };
  }

  const xMin = data[0].x;
  const xMax = data[n - 1].x;
  const xSpan = Math.max(0.2, xMax - xMin);
  const maxY = Math.max(1, ...data.map((d) => d.y));
  const weights = data.map((d) =>
    optics.weighting === 'poisson' ? 1 / Math.max(1, d.y) : 1
  );

  // Stage 1: Exact Weighted Linear Pre-Conditioning of Background & Peak Amplitudes
  const precond = preConditionLinearAmplitudes({
    data,
    peaks: params.peaks,
    background: params.background,
    model,
    optics,
    weights,
  });

  const startPeaks = precond.peaks;
  const startBg = precond.background;

  // Build free parameter descriptors
  const descriptors: ParamDescriptor[] = [];
  const pVec: number[] = [];

  descriptors.push({
    kind: 'bg0',
    peakIdx: -1,
    min: -maxY * 0.5,
    max: maxY * 1.5,
    step: Math.max(0.05, maxY * 1e-4),
    maxStepJump: maxY * 0.5,
  });
  pVec.push(startBg.b0);

  if (startBg.order >= 1) {
    descriptors.push({
      kind: 'bg1',
      peakIdx: -1,
      min: -maxY,
      max: maxY,
      step: Math.max(0.05, maxY * 1e-4),
      maxStepJump: maxY * 0.5,
    });
    pVec.push(startBg.b1);
  }
  if (startBg.order >= 2) {
    descriptors.push({
      kind: 'bg2',
      peakIdx: -1,
      min: -maxY,
      max: maxY,
      step: Math.max(0.05, maxY * 1e-4),
      maxStepJump: maxY * 0.5,
    });
    pVec.push(startBg.b2);
  }

  const sharedShapeIndices: number[] = [];

  startPeaks.forEach((pk, idx) => {
    if (!pk.enabled) return;
    if (!pk.lockCenter) {
      descriptors.push({
        kind: 'center',
        peakIdx: idx,
        min: xMin + xSpan * 0.005,
        max: xMax - xSpan * 0.005,
        step: 1e-4,
        maxStepJump: Math.max(0.15, Math.min(1.5, pk.fwhm * 0.75)),
      });
      pVec.push(Math.max(xMin + xSpan * 0.005, Math.min(xMax - xSpan * 0.005, pk.center)));
    }
    descriptors.push({
      kind: 'amplitude',
      peakIdx: idx,
      min: 1e-3,
      max: maxY * 5,
      step: Math.max(0.05, pk.amplitude * 1e-4),
      maxStepJump: maxY * 1.5,
    });
    pVec.push(Math.max(1e-2, pk.amplitude));

    if (!pk.lockFwhm) {
      descriptors.push({
        kind: 'fwhm',
        peakIdx: idx,
        min: 0.015,
        max: Math.min(25, xSpan * 0.85),
        step: 1e-4,
        maxStepJump: Math.max(0.15, pk.fwhm * 0.8),
      });
      pVec.push(Math.max(0.015, Math.min(25, pk.fwhm)));
    }

    if ((model === 'Pseudo-Voigt' || model === 'Split Pseudo-Voigt') && !pk.lockShape) {
      if (optics.shareShapeAcrossPeaks) {
        sharedShapeIndices.push(idx);
      } else {
        descriptors.push({ kind: 'eta', peakIdx: idx, min: 0, max: 1, step: 1e-4, maxStepJump: 0.35 });
        pVec.push(Math.max(0, Math.min(1, pk.eta)));
      }
    } else if (model === 'Pearson VII' && !pk.lockShape) {
      if (optics.shareShapeAcrossPeaks) {
        sharedShapeIndices.push(idx);
      } else {
        descriptors.push({ kind: 'pearsonM', peakIdx: idx, min: 0.85, max: 25, step: 5e-4, maxStepJump: 3.5 });
        pVec.push(Math.max(0.85, Math.min(25, pk.pearsonM)));
      }
    }

    if (model === 'Split Pseudo-Voigt' && !pk.lockAsymmetry) {
      descriptors.push({ kind: 'asymmetry', peakIdx: idx, min: 0.35, max: 2.8, step: 2e-4, maxStepJump: 0.45 });
      pVec.push(Math.max(0.35, Math.min(2.8, pk.asymmetry)));
    }
  });

  if (optics.shareShapeAcrossPeaks && sharedShapeIndices.length > 0) {
    if (model === 'Pseudo-Voigt' || model === 'Split Pseudo-Voigt') {
      const avgEta =
        sharedShapeIndices.reduce((s, idx) => s + startPeaks[idx].eta, 0) / sharedShapeIndices.length;
      descriptors.push({
        kind: 'sharedEta',
        peakIdx: -1,
        sharedPeakIndices: sharedShapeIndices,
        min: 0,
        max: 1,
        step: 1e-4,
        maxStepJump: 0.35,
      });
      pVec.push(Math.max(0, Math.min(1, avgEta)));
    } else if (model === 'Pearson VII') {
      const avgM =
        sharedShapeIndices.reduce((s, idx) => s + startPeaks[idx].pearsonM, 0) / sharedShapeIndices.length;
      descriptors.push({
        kind: 'sharedPearsonM',
        peakIdx: -1,
        sharedPeakIndices: sharedShapeIndices,
        min: 0.85,
        max: 25,
        step: 5e-4,
        maxStepJump: 3.5,
      });
      pVec.push(Math.max(0.85, Math.min(25, avgM)));
    }
  }

  const m = descriptors.length;
  if (m === 0 || m >= n) {
    return {
      peaks: startPeaks,
      background: startBg,
      stats: computeFitStatistics(data, startPeaks, startBg, model, optics, m, false, 0, 0),
      uncertainties: emptyUnc,
    };
  }

  const unpack = (vec: number[]): { peaks: FitPeakParam[]; bg: BackgroundConfig } => {
    const nextBg: BackgroundConfig = { ...startBg };
    const nextPeaks: FitPeakParam[] = startPeaks.map((pk) => ({ ...pk }));
    for (let j = 0; j < m; j++) {
      const d = descriptors[j];
      const v = Math.max(d.min, Math.min(d.max, vec[j]));
      if (d.kind === 'bg0') nextBg.b0 = v;
      else if (d.kind === 'bg1') nextBg.b1 = v;
      else if (d.kind === 'bg2') nextBg.b2 = v;
      else if (d.kind === 'center') nextPeaks[d.peakIdx].center = v;
      else if (d.kind === 'amplitude') nextPeaks[d.peakIdx].amplitude = v;
      else if (d.kind === 'fwhm') nextPeaks[d.peakIdx].fwhm = v;
      else if (d.kind === 'eta') nextPeaks[d.peakIdx].eta = v;
      else if (d.kind === 'pearsonM') nextPeaks[d.peakIdx].pearsonM = v;
      else if (d.kind === 'asymmetry') nextPeaks[d.peakIdx].asymmetry = v;
      else if (d.kind === 'sharedEta' && d.sharedPeakIndices) {
        for (const pIdx of d.sharedPeakIndices) nextPeaks[pIdx].eta = v;
      } else if (d.kind === 'sharedPearsonM' && d.sharedPeakIndices) {
        for (const pIdx of d.sharedPeakIndices) nextPeaks[pIdx].pearsonM = v;
      }
    }
    return { peaks: nextPeaks, bg: nextBg };
  };

  const evalResiduals = (vec: number[]): { r: number[]; cost: number } => {
    const { peaks: pks, bg } = unpack(vec);
    const r = new Array<number>(n);
    let cost = 0;
    for (let i = 0; i < n; i++) {
      const yHat = evaluateModelAt(data[i].x, xMin, xMax, pks, bg, model, optics);
      const res = data[i].y - yHat;
      r[i] = res;
      cost += weights[i] * res * res;
    }
    return { r, cost };
  };

  let currVec = [...pVec];
  let { r: currR, cost: currCost } = evalResiduals(currVec);
  let lambda = 1e-2;
  let converged = false;
  let iter = 0;

  const J: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(0));

  for (iter = 1; iter <= maxIterations; iter++) {
    for (let j = 0; j < m; j++) {
      const d = descriptors[j];
      const orig = currVec[j];
      const h = d.step;
      const up = Math.min(d.max, orig + h);
      const dn = Math.max(d.min, orig - h);
      const spanH = up - dn;
      if (spanH <= 1e-12) {
        J[j].fill(0);
        continue;
      }

      currVec[j] = up;
      const { peaks: pUp, bg: bgUp } = unpack(currVec);
      currVec[j] = dn;
      const { peaks: pDn, bg: bgDn } = unpack(currVec);
      currVec[j] = orig;

      for (let i = 0; i < n; i++) {
        const yUp = evaluateModelAt(data[i].x, xMin, xMax, pUp, bgUp, model, optics);
        const yDn = evaluateModelAt(data[i].x, xMin, xMax, pDn, bgDn, model, optics);
        J[j][i] = (yUp - yDn) / spanH;
      }
    }

    const A: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
    const g: number[] = new Array<number>(m).fill(0);
    for (let j = 0; j < m; j++) {
      const Jj = J[j];
      let gj = 0;
      for (let i = 0; i < n; i++) gj += weights[i] * Jj[i] * currR[i];
      g[j] = gj;
      for (let k = j; k < m; k++) {
        const Jk = J[k];
        let sum = 0;
        for (let i = 0; i < n; i++) sum += weights[i] * Jj[i] * Jk[i];
        A[j][k] = sum;
        A[k][j] = sum;
      }
    }

    let accepted = false;
    for (let attempt = 0; attempt < 9; attempt++) {
      const damped: number[][] = A.map((row, j) => {
        const copy = [...row];
        const diagScale = Math.max(1e-8, Math.abs(copy[j]));
        copy[j] += lambda * diagScale;
        return copy;
      });
      const inv = invertMatrix(damped);
      if (!inv) {
        lambda *= 10;
        continue;
      }
      const delta = new Array<number>(m).fill(0);
      for (let j = 0; j < m; j++) {
        let s = 0;
        for (let k = 0; k < m; k++) s += inv[j][k] * g[k];
        // Trust-region step-size clamp to prevent overlapping peak swapping
        const maxJump = descriptors[j].maxStepJump;
        delta[j] = Math.max(-maxJump, Math.min(maxJump, s));
      }

      const candVec = currVec.map((v, j) =>
        Math.max(descriptors[j].min, Math.min(descriptors[j].max, v + delta[j]))
      );
      const { r: candR, cost: candCost } = evalResiduals(candVec);
      if (candCost < currCost) {
        const relImprove = (currCost - candCost) / Math.max(1e-12, currCost);
        currVec = candVec;
        currR = candR;
        currCost = candCost;
        lambda = Math.max(1e-7, lambda * 0.35);
        accepted = true;
        if (relImprove < 1e-7) converged = true;
        break;
      } else {
        lambda = Math.min(1e7, lambda * 4.0);
      }
    }

    if (converged || !accepted) {
      if (!accepted && iter > 2) converged = true;
      break;
    }
  }

  const { peaks: finalPeaks, bg: finalBg } = unpack(currVec);

  // Compute exact Jacobian & Covariance Matrix C = s^2 * (J^T W J)^-1 at final solution
  for (let j = 0; j < m; j++) {
    const d = descriptors[j];
    const orig = currVec[j];
    const up = Math.min(d.max, orig + d.step);
    const dn = Math.max(d.min, orig - d.step);
    const spanH = up - dn;
    if (spanH <= 1e-12) {
      J[j].fill(0);
      continue;
    }
    currVec[j] = up;
    const { peaks: pUp, bg: bgUp } = unpack(currVec);
    currVec[j] = dn;
    const { peaks: pDn, bg: bgDn } = unpack(currVec);
    currVec[j] = orig;
    for (let i = 0; i < n; i++) {
      J[j][i] =
        (evaluateModelAt(data[i].x, xMin, xMax, pUp, bgUp, model, optics) -
          evaluateModelAt(data[i].x, xMin, xMax, pDn, bgDn, model, optics)) /
        spanH;
    }
  }

  const infoMat: number[][] = Array.from({ length: m }, () => new Array<number>(m).fill(0));
  for (let j = 0; j < m; j++) {
    for (let k = j; k < m; k++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += weights[i] * J[j][i] * J[k][i];
      infoMat[j][k] = sum;
      infoMat[k][j] = sum;
    }
    infoMat[j][j] += 1e-10;
  }

  const cov = invertMatrix(infoMat);
  let maxParamCorrelation = 0;
  if (cov) {
    for (let j = 0; j < m; j++) {
      for (let k = j + 1; k < m; k++) {
        // Ignore background-to-background polynomial correlations
        if (descriptors[j].peakIdx < 0 && descriptors[k].peakIdx < 0) continue;
        const denom = Math.sqrt(Math.max(1e-18, cov[j][j] * cov[k][k]));
        const corr = Math.abs(cov[j][k] / denom);
        if (Number.isFinite(corr) && corr > maxParamCorrelation) {
          maxParamCorrelation = Math.min(1, corr);
        }
      }
    }
  }

  const stats = computeFitStatistics(
    data,
    finalPeaks,
    finalBg,
    model,
    optics,
    m,
    converged,
    iter,
    maxParamCorrelation
  );

  const scaleVar = Math.max(1e-12, stats.chi2Reduced);
  const uncertainties: Record<string, PeakUncertainty> = { ...emptyUnc };

  if (cov) {
    for (let j = 0; j < m; j++) {
      const d = descriptors[j];
      const variance = cov[j][j] * scaleVar;
      const se = variance > 0 && Number.isFinite(variance) ? Math.sqrt(variance) : null;
      if (d.kind === 'sharedEta' || d.kind === 'sharedPearsonM') {
        if (d.sharedPeakIndices) {
          for (const pIdx of d.sharedPeakIndices) {
            const pid = finalPeaks[pIdx].id;
            if (uncertainties[pid]) uncertainties[pid].shapeErr = se;
          }
        }
        continue;
      }
      if (d.peakIdx < 0) continue;
      const pid = finalPeaks[d.peakIdx].id;
      if (!uncertainties[pid]) continue;
      if (d.kind === 'center') uncertainties[pid].centerErr = se;
      else if (d.kind === 'amplitude') uncertainties[pid].amplitudeErr = se;
      else if (d.kind === 'fwhm') uncertainties[pid].fwhmErr = se;
      else if (d.kind === 'eta' || d.kind === 'pearsonM') uncertainties[pid].shapeErr = se;
      else if (d.kind === 'asymmetry') uncertainties[pid].asymmetryErr = se;
    }
  }

  // Propagate derived physical uncertainties: d-spacing, Area, beta_sample, Scherrer D, Microstrain
  const { lambda1A } = getActiveWavelengthA(optics);
  for (const pk of finalPeaks) {
    const u = uncertainties[pk.id];
    if (!u) continue;
    const thetaRad = (pk.center * Math.PI) / 360;
    const dVal = computeDSpacingA(pk.center, lambda1A);

    if (u.centerErr !== null && Math.tan(thetaRad) > 1e-4) {
      // Bragg error propagation: sigma_d = d * cot(theta) * (sigma_2theta_rad / 2)
      const sig2TRad = (u.centerErr * Math.PI) / 180;
      u.dSpacingErr = (dVal / Math.tan(thetaRad)) * (0.5 * sig2TRad);
    }

    const kFactor = computeProfileAreaFactor(model, pk.eta, pk.pearsonM);
    const area = pk.amplitude * pk.fwhm * kFactor;
    if (u.amplitudeErr !== null || u.fwhmErr !== null) {
      const relA = u.amplitudeErr ? u.amplitudeErr / Math.max(1e-6, pk.amplitude) : 0;
      const relH = u.fwhmErr ? u.fwhmErr / Math.max(1e-6, pk.fwhm) : 0;
      u.areaErr = area * Math.sqrt(relA * relA + relH * relH);
    }

    if (u.fwhmErr !== null) {
      const instH = computeInstrumentalFwhmDeg(pk.center, optics);
      const phi = 1 / Math.max(1e-6, kFactor);
      const etaEq = shapeFactorToEquivalentEta(phi);
      const deconv = deconvolveInstrumentalBroadening({
        fwhmObs: pk.fwhm,
        etaObs: etaEq,
        instFwhm: instH,
        instEta: optics.instEta,
        law: optics.deconvolutionLaw,
      });
      if (!deconv.resolutionLimited && deconv.sampleFwhmDeg > 0.005) {
        const sens =
          optics.deconvolutionLaw === 'Lorentzian'
            ? 1
            : pk.fwhm / Math.max(0.01, deconv.sampleFwhmDeg);
        const sigBetaS = sens * u.fwhmErr;
        u.sampleFwhmErr = sigBetaS;

        const betaRad = (deconv.sampleFwhmDeg * Math.PI) / 180;
        const cosT = Math.cos(thetaRad);
        const tanT = Math.tan(thetaRad);
        if (cosT > 0.02) {
          const sizeNm = ((optics.scherrerK * lambda1A) / (betaRad * cosT)) * 0.1;
          u.scherrerSizeErrNm = sizeNm * (sigBetaS / deconv.sampleFwhmDeg);
        }
        if (tanT > 0.02) {
          const strainPct = (betaRad / (4 * tanT)) * 100;
          u.microstrainErrPct = strainPct * (sigBetaS / deconv.sampleFwhmDeg);
        }
      }
    }
  }

  return {
    peaks: finalPeaks,
    background: finalBg,
    stats,
    uncertainties,
  };
}

// ============================================================================
// STATISTICS, CURVE EVALUATION, DIAGNOSTICS & WILLIAMSON-HALL SYNTHESIS
// ============================================================================

export function computeFitStatistics(
  data: RawXYPoint[],
  peaks: FitPeakParam[],
  background: BackgroundConfig,
  model: ProfileModelType,
  optics: InstrumentOpticsConfig,
  nParams: number,
  converged: boolean,
  iterations: number,
  maxParamCorrelation = 0
): FitStatistics {
  const n = data.length;
  if (n === 0) {
    return {
      nPoints: 0,
      nParams: 0,
      dof: 0,
      rwp: 0,
      rp: 0,
      rexp: 0,
      rSquared: 0,
      chi2Reduced: 0,
      gof: 0,
      rss: 0,
      rmse: 0,
      durbinWatson: 2,
      aic: 0,
      bic: 0,
      maxParamCorrelation: 0,
      converged,
      iterations,
    };
  }

  const xMin = data[0].x;
  const xMax = data[n - 1].x;
  let sumAbsRes = 0;
  let sumAbsY = 0;
  let sumWRes2 = 0;
  let sumWY2 = 0;
  let rss = 0;
  let sumY = 0;
  const residuals = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const y = data[i].y;
    const yHat = evaluateModelAt(data[i].x, xMin, xMax, peaks, background, model, optics);
    const res = y - yHat;
    residuals[i] = res;
    const w = optics.weighting === 'poisson' ? 1 / Math.max(1, y) : 1;
    sumAbsRes += Math.abs(res);
    sumAbsY += Math.abs(y);
    sumWRes2 += w * res * res;
    sumWY2 += w * y * y;
    rss += res * res;
    sumY += y;
  }

  const meanY = sumY / n;
  let sst = 0;
  for (let i = 0; i < n; i++) {
    const d = data[i].y - meanY;
    sst += d * d;
  }

  let dwNum = 0;
  for (let i = 1; i < n; i++) {
    const diff = residuals[i] - residuals[i - 1];
    dwNum += diff * diff;
  }

  const dof = Math.max(1, n - nParams);
  const rwp = sumWY2 > 1e-12 ? Math.sqrt(sumWRes2 / sumWY2) * 100 : 0;
  const rp = sumAbsY > 1e-12 ? (sumAbsRes / sumAbsY) * 100 : 0;
  const rexp = sumWY2 > 1e-12 ? Math.sqrt(dof / sumWY2) * 100 : 0;
  const chi2Reduced = sumWRes2 / dof;
  const gof = Math.sqrt(Math.max(0, chi2Reduced));
  const rSquared = sst > 1e-12 ? Math.max(0, 1 - rss / sst) : 1;
  const rmse = Math.sqrt(rss / n);
  const durbinWatson = rss > 1e-12 ? dwNum / rss : 2;
  const k = nParams + 1;
  const safeRssPerN = Math.max(1e-12, rss / n);
  const aic = n * Math.log(safeRssPerN) + 2 * k;
  const bic = n * Math.log(safeRssPerN) + k * Math.log(n);

  return {
    nPoints: n,
    nParams,
    dof,
    rwp,
    rp,
    rexp,
    rSquared,
    chi2Reduced,
    gof,
    rss,
    rmse,
    durbinWatson,
    aic,
    bic,
    maxParamCorrelation,
    converged,
    iterations,
  };
}

function computeRachingerStripped(
  data: RawXYPoint[],
  bgValues: number[],
  lambda1A: number,
  lambda2A: number | null,
  ka2Ratio: number
): number[] {
  const n = data.length;
  const out = new Array<number>(n);
  if (!lambda2A || ka2Ratio <= 0 || n < 3) {
    for (let i = 0; i < n; i++) out[i] = data[i].y;
    return out;
  }

  const netStripped = new Array<number>(n).fill(0);
  const xArr = data.map((d) => d.x);

  const interpNet = (xTarget: number): number => {
    if (xTarget <= xArr[0]) return netStripped[0];
    if (xTarget >= xArr[n - 1]) return netStripped[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (xArr[mid] <= xTarget) lo = mid;
      else hi = mid;
    }
    const t = (xTarget - xArr[lo]) / Math.max(1e-9, xArr[hi] - xArr[lo]);
    return netStripped[lo] + t * (netStripped[hi] - netStripped[lo]);
  };

  for (let i = 0; i < n; i++) {
    const x = xArr[i];
    const netObs = Math.max(0, data[i].y - bgValues[i]);
    const sinT2 = Math.sin((x * Math.PI) / 360);
    const sinT1 = (lambda1A / lambda2A) * sinT2;
    const x1 = (Math.asin(Math.min(0.9999, sinT1)) * 360) / Math.PI;
    const ka2Contrib = x1 < x && x1 >= xArr[0] ? ka2Ratio * interpNet(x1) : 0;
    netStripped[i] = Math.max(0, netObs - ka2Contrib);
    out[i] = bgValues[i] + netStripped[i];
  }
  return out;
}

/** Detect the strongest unmodeled positive residual peak (> 3 sigma) */
function findMaxResidualSpike(points: EvaluatedCurvePoint[]): ResidualSpikeCandidate | null {
  const n = points.length;
  if (n < 9) return null;

  // Smooth residual slightly with 3-point binomial filter to ignore single-channel shot noise
  const smoothRes = points.map((_, i) => {
    const a = points[Math.max(0, i - 1)].residual;
    const b = points[i].residual;
    const c = points[Math.min(n - 1, i + 1)].residual;
    return 0.25 * a + 0.5 * b + 0.25 * c;
  });

  let bestIdx = -1;
  let bestZ = 0;
  for (let i = 2; i < n - 2; i++) {
    const z = smoothRes[i] / Math.max(1, points[i].sigma);
    if (z > bestZ && smoothRes[i] >= smoothRes[i - 1] && smoothRes[i] >= smoothRes[i + 1]) {
      bestZ = z;
      bestIdx = i;
    }
  }

  if (bestIdx < 0 || bestZ < 3.0) return null;

  const half = smoothRes[bestIdx] * 0.5;
  let li = bestIdx;
  while (li > 0 && smoothRes[li] > half) li--;
  let ri = bestIdx;
  while (ri < n - 1 && smoothRes[ri] > half) ri++;
  const estFwhm = Math.max(0.08, Math.min(2.0, points[ri].x - points[li].x));

  return {
    twoTheta: Number(points[bestIdx].x.toFixed(4)),
    netHeight: Math.max(25, Math.round(points[bestIdx].residual)),
    zScore: bestZ,
    estimatedFwhm: Number(estFwhm.toFixed(3)),
  };
}

/** Compute live Williamson-Hall size-strain separation & intensity-weighted mean Scherrer size across active peaks */
function computeWilliamsonHallSummary(
  peakMetrics: EvaluatedPeakMetrics[],
  optics: InstrumentOpticsConfig,
  lambda1A: number
): WilliamsonHallSummary {
  const valid = peakMetrics.filter(
    (m) => m.peak.enabled && !m.resolutionLimited && m.sampleFwhmDeg > 0.005 && m.scherrerSizeNm !== null
  );

  if (valid.length === 0) {
    return {
      valid: false,
      peakCount: 0,
      sizeNm: null,
      microstrainPct: null,
      rSquared: null,
      weightedMeanScherrerNm: null,
      weightedStdScherrerNm: null,
    };
  }

  // Area-weighted mean Scherrer size
  const wSum = valid.reduce((s, m) => s + Math.max(1, m.integratedArea), 0);
  const meanD = valid.reduce((s, m) => s + (m.scherrerSizeNm || 0) * Math.max(1, m.integratedArea), 0) / wSum;
  const varD =
    valid.reduce(
      (s, m) => s + Math.max(1, m.integratedArea) * Math.pow((m.scherrerSizeNm || 0) - meanD, 2),
      0
    ) / wSum;

  if (valid.length < 2) {
    return {
      valid: false,
      peakCount: valid.length,
      sizeNm: null,
      microstrainPct: null,
      rSquared: null,
      weightedMeanScherrerNm: meanD,
      weightedStdScherrerNm: null,
    };
  }

  // Linear regression of y = beta_s * cos(theta) vs x = 4 * sin(theta)
  const pts = valid.map((m) => {
    const thetaRad = (m.peak.center * Math.PI) / 360;
    const betaRad = (m.sampleFwhmDeg * Math.PI) / 180;
    return {
      x: 4 * Math.sin(thetaRad),
      y: betaRad * Math.cos(thetaRad),
    };
  });

  const xSpan = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
  if (xSpan < 0.04) {
    // Peaks are too close in 2theta for reliable WH slope separation
    return {
      valid: false,
      peakCount: valid.length,
      sizeNm: null,
      microstrainPct: null,
      rSquared: null,
      weightedMeanScherrerNm: meanD,
      weightedStdScherrerNm: Math.sqrt(Math.max(0, varD)),
    };
  }

  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    sxx += (p.x - mx) * (p.x - mx);
    sxy += (p.x - mx) * (p.y - my);
    syy += (p.y - my) * (p.y - my);
  }

  const slope = sxx > 1e-12 ? sxy / sxx : 0; // strain epsilon (dimensionless)
  const intercept = my - slope * mx; // K * lambda / D_A
  const r2 = sxx > 1e-12 && syy > 1e-12 ? (sxy * sxy) / (sxx * syy) : null;
  const sizeNm = intercept > 1e-5 ? ((optics.scherrerK * lambda1A) / intercept) * 0.1 : null;

  return {
    valid: true,
    peakCount: valid.length,
    sizeNm,
    microstrainPct: slope * 100,
    rSquared: r2,
    weightedMeanScherrerNm: meanD,
    weightedStdScherrerNm: Math.sqrt(Math.max(0, varD)),
  };
}

export function evaluateFullProfile(params: {
  data: RawXYPoint[];
  peaks: FitPeakParam[];
  background: BackgroundConfig;
  model: ProfileModelType;
  optics: InstrumentOpticsConfig;
  uncertainties?: Record<string, PeakUncertainty>;
  converged?: boolean;
  iterations?: number;
  maxParamCorrelation?: number;
}): {
  points: EvaluatedCurvePoint[];
  peakMetrics: EvaluatedPeakMetrics[];
  stats: FitStatistics;
  residualSpike: ResidualSpikeCandidate | null;
  resolutionPairs: PeakResolutionPair[];
  diagnostics: FitDiagnosticAlert[];
  williamsonHall: WilliamsonHallSummary;
} {
  const {
    data,
    peaks,
    background,
    model,
    optics,
    uncertainties = {},
    converged = false,
    iterations = 0,
    maxParamCorrelation = 0,
  } = params;
  const n = data.length;
  if (n === 0) {
    return {
      points: [],
      peakMetrics: [],
      stats: computeFitStatistics([], peaks, background, model, optics, 0, false, 0, 0),
      residualSpike: null,
      resolutionPairs: [],
      diagnostics: [],
      williamsonHall: {
        valid: false,
        peakCount: 0,
        sizeNm: null,
        microstrainPct: null,
        rSquared: null,
        weightedMeanScherrerNm: null,
        weightedStdScherrerNm: null,
      },
    };
  }

  const xMin = data[0].x;
  const xMax = data[n - 1].x;
  const { lambda1A, lambda2A } = getActiveWavelengthA(optics);

  const bgValues = data.map((d) => evaluateBackground(d.x, xMin, xMax, background));
  const rachingerValues = computeRachingerStripped(data, bgValues, lambda1A, lambda2A, optics.ka2Ratio);

  const points: EvaluatedCurvePoint[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = data[i].x;
    const yObs = data[i].y;
    const yBg = bgValues[i];
    let sumCryst = 0;
    let yKa2Total = 0;
    const peakValues: Record<string, number> = {};

    for (let k = 0; k < peaks.length; k++) {
      const pk = peaks[k];
      const { primary, ka2 } = evaluateSinglePeakAt(x, pk, model, lambda1A, lambda2A, optics.ka2Ratio);
      peakValues[pk.id] = primary + ka2;
      sumCryst += primary + ka2;
      yKa2Total += ka2;
    }

    const yCalc = yBg + sumCryst;
    const dSpacing = computeDSpacingA(x, lambda1A);
    const qValue = dSpacing > 0 ? (2 * Math.PI) / dSpacing : 0;

    points[i] = {
      x,
      dSpacing,
      qValue,
      yObs,
      yCalc,
      yBg,
      yNetObs: yObs - yBg,
      yNetCalc: sumCryst,
      yKa2Total,
      yRachinger: rachingerValues[i],
      residual: yObs - yCalc,
      sigma: Math.sqrt(Math.max(1, yObs)),
      d1: 0,
      d2: 0,
      peakValues,
    };
  }

  for (let i = 2; i < n - 2; i++) {
    const dx = Math.max(1e-5, (points[i + 2].x - points[i - 2].x) / 4);
    const d1 = (-2 * points[i - 2].yObs - points[i - 1].yObs + points[i + 1].yObs + 2 * points[i + 2].yObs) / (10 * dx);
    const d2 = (2 * points[i - 2].yObs - points[i - 1].yObs - 2 * points[i].yObs - points[i + 1].yObs + 2 * points[i + 2].yObs) / (7 * dx * dx);
    points[i].d1 = d1;
    points[i].d2 = d2;
  }

  const ka2AreaMult = lambda2A && optics.ka2Ratio > 0 ? 1 + optics.ka2Ratio : 1;
  const rawPeakMetrics = peaks.map((pk) => {
    const dSpacingA = computeDSpacingA(pk.center, lambda1A);
    const qInvA = dSpacingA > 0 ? (2 * Math.PI) / dSpacingA : 0;
    const asym = model === 'Split Pseudo-Voigt' ? Math.max(0.35, Math.min(2.8, pk.asymmetry)) : 1.0;
    const hwhmLeft = pk.fwhm / (1 + asym);
    const hwhmRight = (pk.fwhm * asym) / (1 + asym);
    const areaFactor = computeProfileAreaFactor(model, pk.eta, pk.pearsonM);
    const integratedArea = pk.enabled ? pk.amplitude * pk.fwhm * areaFactor * ka2AreaMult : 0;
    const integralBreadthDeg = pk.fwhm * areaFactor;
    const shapeFactorPhi = integralBreadthDeg > 1e-9 ? pk.fwhm / integralBreadthDeg : 0;
    const fwtmRatio = computeFwtmRatio(model, pk.eta, pk.pearsonM);
    const fwtmLeft = hwhmLeft * fwtmRatio;
    const fwtmRight = hwhmRight * fwtmRatio;
    const fwtmObs = fwtmLeft + fwtmRight;

    // Empirical first-moment centroid inside the scan window for this component
    let sumXW = 0;
    let sumW = 0;
    for (let i = 0; i < n; i++) {
      const w = points[i].peakValues[pk.id] || 0;
      if (w > 0) {
        sumXW += points[i].x * w;
        sumW += w;
      }
    }
    const centroidDeg = sumW > 1e-6 ? sumXW / sumW : pk.center;

    const instFwhmDeg = computeInstrumentalFwhmDeg(pk.center, optics);
    // Exact shape-factor Voigt equivalent eta for consistent instrumental subtraction across all 5 models
    const effEtaObs =
      model === 'Gaussian'
        ? 0
        : model === 'Lorentzian'
        ? 1
        : shapeFactorToEquivalentEta(shapeFactorPhi);

    const deconv = deconvolveInstrumentalBroadening({
      fwhmObs: pk.fwhm,
      etaObs: effEtaObs,
      instFwhm: instFwhmDeg,
      instEta: optics.instEta,
      law: optics.deconvolutionLaw,
    });

    const thetaRad = (pk.center * Math.PI) / 360;
    const cosT = Math.cos(thetaRad);
    const tanT = Math.tan(thetaRad);
    const betaRad = (deconv.sampleFwhmDeg * Math.PI) / 180;

    let scherrerSizeNm: number | null = null;
    let microstrainPct: number | null = null;
    let dislocationDensityM2: number | null = null;

    if (!deconv.resolutionLimited && betaRad > 1e-6 && cosT > 0.02) {
      scherrerSizeNm = ((optics.scherrerK * lambda1A) / (betaRad * cosT)) * 0.1;
      if (tanT > 0.02) {
        microstrainPct = (betaRad / (4 * tanT)) * 100;
      }
      if (scherrerSizeNm > 0) {
        const dMeters = scherrerSizeNm * 1e-9;
        dislocationDensityM2 = 1 / (dMeters * dMeters);
      }
    }

    const defaultUnc: PeakUncertainty = {
      centerErr: null,
      dSpacingErr: null,
      amplitudeErr: null,
      fwhmErr: null,
      sampleFwhmErr: null,
      shapeErr: null,
      asymmetryErr: null,
      areaErr: null,
      scherrerSizeErrNm: null,
      microstrainErrPct: null,
    };

    return {
      peak: pk,
      dSpacingA,
      qInvA,
      centroidDeg,
      fwhmObs: pk.fwhm,
      hwhmLeft,
      hwhmRight,
      fwtmLeft,
      fwtmRight,
      fwtmObs,
      fwtmToFwhm: fwtmRatio,
      integralBreadthDeg,
      shapeFactorPhi,
      integratedArea,
      areaFractionPct: 0,
      instFwhmDeg,
      sampleFwhmDeg: deconv.sampleFwhmDeg,
      sampleGaussianDeg: deconv.sampleGaussianDeg,
      sampleLorentzianDeg: deconv.sampleLorentzianDeg,
      scherrerSizeNm,
      microstrainPct,
      dislocationDensityM2,
      resolutionLimited: deconv.resolutionLimited,
      ka2CenterDeg: computeKa2Angle(pk.center, lambda1A, lambda2A),
      uncertainty: uncertainties[pk.id] || defaultUnc,
    };
  });

  const totalArea = rawPeakMetrics.reduce((s, m) => s + (m.peak.enabled ? m.integratedArea : 0), 0);
  const peakMetrics = rawPeakMetrics.map((m) => ({
    ...m,
    areaFractionPct: totalArea > 1e-9 && m.peak.enabled ? (m.integratedArea / totalArea) * 100 : 0,
  }));

  const nParams = countFreeParameters(peaks, background, model, optics.shareShapeAcrossPeaks);
  const stats = computeFitStatistics(
    data,
    peaks,
    background,
    model,
    optics,
    nParams,
    converged,
    iterations,
    maxParamCorrelation
  );

  // Resolution overlap check for adjacent enabled peaks
  const enabledSorted = peakMetrics
    .filter((m) => m.peak.enabled)
    .sort((a, b) => a.peak.center - b.peak.center);
  const resolutionPairs: PeakResolutionPair[] = [];
  for (let i = 0; i < enabledSorted.length - 1; i++) {
    const a = enabledSorted[i];
    const b = enabledSorted[i + 1];
    const sep = b.peak.center - a.peak.center;
    const avgH = 0.5 * (a.fwhmObs + b.fwhmObs);
    const rs = avgH > 1e-6 ? sep / avgH : 99;
    resolutionPairs.push({
      peakA: a.peak.label,
      peakB: b.peak.label,
      separationDeg: sep,
      resolutionRs: rs,
    });
  }

  const residualSpike = findMaxResidualSpike(points);
  const williamsonHall = computeWilliamsonHallSummary(peakMetrics, optics, lambda1A);

  // Build actionable scientific diagnostics
  const diagnostics: FitDiagnosticAlert[] = [];

  if (residualSpike && residualSpike.zScore >= 3.8) {
    diagnostics.push({
      id: 'missing_peak',
      severity: 'warning',
      title: `Unmodeled residual spike at 2θ = ${residualSpike.twoTheta.toFixed(2)}° (+${residualSpike.zScore.toFixed(1)}σ)`,
      detail: 'A coherent positive residual exceeds counting noise. This typically indicates a hidden overlapping reflection, shoulder, or uncoupled Kα₂ doublet.',
      actionKind: 'add_residual_peak',
      actionLabel: `Add Peak at ${residualSpike.twoTheta.toFixed(2)}° & Refit`,
    });
  }

  if (stats.durbinWatson < 1.35 && stats.rSquared < 0.996) {
    const isLowAngle = enabledSorted.some((m) => m.peak.center < 22);
    if (isLowAngle && model !== 'Split Pseudo-Voigt') {
      diagnostics.push({
        id: 'low_angle_asym',
        severity: 'warning',
        title: `Structured low-angle residuals (DW = ${stats.durbinWatson.toFixed(2)})`,
        detail: 'Low-angle diffraction peaks suffer axial divergence tailing. Switching to Split Pseudo-Voigt allows independent left/right half-widths.',
        actionKind: 'switch_split_pv',
        actionLabel: 'Switch to Split Pseudo-Voigt',
      });
    } else {
      diagnostics.push({
        id: 'structured_dw',
        severity: 'info',
        title: `Correlated residuals detected (Durbin-Watson d = ${stats.durbinWatson.toFixed(2)})`,
        detail: 'Ideal white-noise residuals sit near d ≈ 2.0. Benchmark all 5 profile kernels to test whether Lorentzian tails or asymmetry improve AIC.',
        actionKind: 'run_benchmark',
        actionLabel: 'Run 5-Model Benchmark',
      });
    }
  }

  const severeOverlap = resolutionPairs.find((pair) => pair.resolutionRs < 1.35);
  if (
    severeOverlap &&
    !optics.shareShapeAcrossPeaks &&
    enabledSorted.length >= 2 &&
    (model === 'Pseudo-Voigt' || model === 'Split Pseudo-Voigt' || model === 'Pearson VII') &&
    stats.maxParamCorrelation > 0.92
  ) {
    diagnostics.push({
      id: 'correlated_overlap',
      severity: 'warning',
      title: `High parameter correlation (|r| = ${stats.maxParamCorrelation.toFixed(2)}) on overlapping pair`,
      detail: `${severeOverlap.peakA} & ${severeOverlap.peakB} have resolution Rs = ${severeOverlap.resolutionRs.toFixed(2)}. Sharing the profile shape parameter across peaks stabilizes deconvolution and tightens uncertainties.`,
      actionKind: 'enable_shared_shape',
      actionLabel: 'Share Shape Across Peaks & Refit',
    });
  }

  const resLimited = enabledSorted.filter((m) => m.resolutionLimited);
  if (resLimited.length > 0 && optics.enableInstCorrection) {
    diagnostics.push({
      id: 'res_limit',
      severity: 'info',
      title: `${resLimited.map((m) => m.peak.label).join(', ')} at instrumental resolution limit`,
      detail: 'Observed FWHM is within 1% of β_inst, so crystallite size exceeds the diffractometer upper sizing limit (>120–150 nm).',
    });
  }

  return { points, peakMetrics, stats, residualSpike, resolutionPairs, diagnostics, williamsonHall };
}

// ============================================================================
// ONE-CLICK 5-MODEL BENCHMARK (AIC / BIC / AKAIKE WEIGHTS)
// ============================================================================

export function benchmarkAllProfileModels(params: {
  data: RawXYPoint[];
  peaks: FitPeakParam[];
  background: BackgroundConfig;
  optics: InstrumentOpticsConfig;
}): ModelBenchmarkRow[] {
  const models: ProfileModelType[] = [
    'Gaussian',
    'Lorentzian',
    'Pseudo-Voigt',
    'Split Pseudo-Voigt',
    'Pearson VII',
  ];

  const runs = models.map((model) => {
    // Shape-matched warm start when switching to Pearson VII
    const seededPeaks = params.peaks.map((p) => ({
      ...p,
      pearsonM: model === 'Pearson VII' ? etaToMatchedPearsonM(p.eta) : p.pearsonM,
    }));
    const res = fitMultiPeakLM({
      data: params.data,
      peaks: seededPeaks,
      background: { ...params.background },
      model,
      optics: params.optics,
      maxIterations: 45,
    });
    return {
      model,
      stats: res.stats,
      peaks: res.peaks,
      background: res.background,
      uncertainties: res.uncertainties,
    };
  });

  const minAic = Math.min(...runs.map((r) => r.stats.aic));
  const rawWeights = runs.map((r) => Math.exp(-0.5 * Math.min(500, r.stats.aic - minAic)));
  const sumWeights = rawWeights.reduce((a, b) => a + b, 0) || 1;

  return runs
    .map((r, idx) => ({
      ...r,
      deltaAic: r.stats.aic - minAic,
      akaikeWeightPct: (rawWeights[idx] / sumWeights) * 100,
      isBest: r.stats.aic === minAic,
    }))
    .sort((a, b) => a.stats.aic - b.stats.aic);
}

// ============================================================================
// EXPERIMENTAL DATA PARSER & SNIP + 2ND-DERIVATIVE PEAK DETECTOR
// ============================================================================

export function parseExperimentalXY(rawText: string): {
  points: RawXYPoint[];
  skippedLines: number;
} {
  const lines = rawText.split(/\r?\n/);
  const pts: RawXYPoint[] = [];
  let skippedLines = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith(';')) continue;
    const parts = line.split(/[,\t;]+|\s+/).filter(Boolean);
    if (parts.length < 2) {
      skippedLines++;
      continue;
    }
    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0.5 || x > 179.5) {
      skippedLines++;
      continue;
    }
    pts.push({ x, y: Math.max(0, y) });
  }

  pts.sort((a, b) => a.x - b.x);
  const deduped: RawXYPoint[] = [];
  for (const pt of pts) {
    const last = deduped[deduped.length - 1];
    if (last && Math.abs(last.x - pt.x) < 1e-6) {
      last.y = 0.5 * (last.y + pt.y);
    } else {
      deduped.push(pt);
    }
  }

  return { points: deduped, skippedLines };
}

/** Fast SNIP (Statistics-sensitive Non-linear Iterative Peak-clipping) background baseline estimator */
function estimateSnipBaseline(yVals: number[], iterations = 18): number[] {
  const n = yVals.length;
  // LLS transform: v = log(log(sqrt(y + 1) + 1) + 1) compresses sharp peaks cleanly
  const v = yVals.map((y) => Math.log(Math.log(Math.sqrt(Math.max(0, y) + 1) + 1) + 1));
  const work = [...v];
  const maxStep = Math.max(2, Math.min(iterations, Math.floor(n / 6)));

  for (let p = maxStep; p >= 1; p--) {
    const next = [...work];
    for (let i = p; i < n - p; i++) {
      const avg = 0.5 * (work[i - p] + work[i + p]);
      if (avg < work[i]) next[i] = avg;
    }
    for (let i = 0; i < n; i++) work[i] = next[i];
  }

  return work.map((val) => {
    const inner = Math.exp(Math.exp(val) - 1) - 1;
    return Math.max(0, inner * inner - 1);
  });
}

/**
 * Auto-detect Bragg peaks (including overlapping shoulders via negative 2nd derivative)
 * on flat or curved backgrounds using SNIP baseline estimation.
 */
export function autoDetectPeaks(
  data: RawXYPoint[],
  maxPeaks = 5,
  prominencePct = 8
): { peaks: FitPeakParam[]; estimatedBg: BackgroundConfig } {
  const n = data.length;
  if (n < 7) {
    return {
      peaks: [],
      estimatedBg: { order: 1, b0: 0, b1: 0, b2: 0 },
    };
  }

  const xMin = data[0].x;
  const xMax = data[n - 1].x;
  const span = Math.max(1e-6, xMax - xMin);
  const snipBg = estimateSnipBaseline(data.map((d) => d.y));

  // Fit quadratic polynomial to SNIP baseline for clean BackgroundConfig initialization
  let s0 = 0, s1 = 0, s2 = 0, s3 = 0, s4 = 0, sy0 = 0, sy1 = 0, sy2 = 0;
  for (let i = 0; i < n; i++) {
    const u = (2 * (data[i].x - xMin)) / span - 1;
    const u2 = u * u;
    s0 += 1; s1 += u; s2 += u2; s3 += u2 * u; s4 += u2 * u2;
    sy0 += snipBg[i]; sy1 += snipBg[i] * u; sy2 += snipBg[i] * u2;
  }
  const bgMat = [
    [s0, s1, s2],
    [s1, s2, s3],
    [s2, s3, s4],
  ];
  const bgInv = invertMatrix(bgMat);
  let b0 = snipBg[Math.floor(n / 2)];
  let b1 = 0;
  let b2 = 0;
  if (bgInv) {
    b0 = bgInv[0][0] * sy0 + bgInv[0][1] * sy1 + bgInv[0][2] * sy2;
    b1 = bgInv[1][0] * sy0 + bgInv[1][1] * sy1 + bgInv[1][2] * sy2;
    b2 = bgInv[2][0] * sy0 + bgInv[2][1] * sy1 + bgInv[2][2] * sy2;
  }
  const order: 0 | 1 | 2 = Math.abs(b2) > Math.max(8, Math.abs(b0) * 0.08) ? 2 : Math.abs(b1) > 4 ? 1 : 0;
  const estimatedBg: BackgroundConfig = {
    order,
    b0: Number(b0.toFixed(2)),
    b1: order >= 1 ? Number(b1.toFixed(2)) : 0,
    b2: order >= 2 ? Number(b2.toFixed(2)) : 0,
  };

  const net = data.map((d, i) => Math.max(0, d.y - snipBg[i]));

  // 5-point binomial smoothing for robust noise-immune peak detection
  const smooth = net.map((_, i) => {
    const get = (idx: number) => net[Math.max(0, Math.min(n - 1, idx))];
    return (get(i - 2) + 4 * get(i - 1) + 6 * get(i) + 4 * get(i + 1) + get(i + 2)) / 16;
  });

  // Negative 2nd derivative of smoothed signal catches overlapping shoulders!
  const negD2 = new Array<number>(n).fill(0);
  for (let i = 2; i < n - 2; i++) {
    const d2 = (2 * smooth[i - 2] - smooth[i - 1] - 2 * smooth[i] - smooth[i + 1] + 2 * smooth[i + 2]) / 7;
    negD2[i] = -d2;
  }

  const maxNet = Math.max(1e-6, ...smooth);
  const maxNegD2 = Math.max(1e-6, ...negD2);
  const minHeight = maxNet * (Math.max(2, prominencePct) / 100);
  const candidates: { idx: number; score: number; height: number }[] = [];

  for (let i = 2; i < n - 2; i++) {
    const isPrimaryMax =
      smooth[i] >= minHeight &&
      smooth[i] >= smooth[i - 1] &&
      smooth[i] > smooth[i + 1] &&
      smooth[i] >= smooth[i - 2] &&
      smooth[i] >= smooth[i + 2];

    const isShoulderMax =
      smooth[i] >= minHeight * 1.4 &&
      negD2[i] >= maxNegD2 * 0.14 &&
      negD2[i] >= negD2[i - 1] &&
      negD2[i] > negD2[i + 1] &&
      negD2[i] >= negD2[i - 2] &&
      negD2[i] >= negD2[i + 2];

    if (isPrimaryMax || isShoulderMax) {
      candidates.push({
        idx: i,
        score: isPrimaryMax ? smooth[i] : smooth[i] * 0.65,
        height: net[i],
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const minSep = Math.max(0.08, span * 0.035);
  const selected: { idx: number; height: number }[] = [];
  for (const c of candidates) {
    if (selected.length >= maxPeaks) break;
    if (selected.every((s) => Math.abs(data[s.idx].x - data[c.idx].x) >= minSep)) {
      selected.push(c);
    }
  }

  selected.sort((a, b) => a.idx - b.idx);
  const peaks: FitPeakParam[] = selected.map((sel, k) => {
    const i = sel.idx;
    const halfH = 0.5 * smooth[i];
    let li = i;
    while (li > 0 && smooth[li] > halfH) li--;
    let ri = i;
    while (ri < n - 1 && smooth[ri] > halfH) ri++;
    const estFwhm = Math.max(0.06, Math.min(5.0, data[ri].x - data[li].x));

    return {
      id: `pk_det_${k + 1}_${Math.round(data[i].x * 100)}`,
      label: `Peak ${k + 1}`,
      color: PEAK_PALETTE[k % PEAK_PALETTE.length],
      enabled: true,
      center: Number(data[i].x.toFixed(4)),
      amplitude: Math.max(5, Math.round(net[i])),
      fwhm: Number(estFwhm.toFixed(4)),
      eta: 0.45,
      pearsonM: 2.2,
      asymmetry: 1.0,
      lockCenter: false,
      lockFwhm: false,
      lockShape: false,
      lockAsymmetry: false,
    };
  });

  return { peaks, estimatedBg };
}

// ============================================================================
// BUILT-IN REALISTIC SCENARIO PRESETS & SYNTHETIC BENCHMARK GENERATOR
// ============================================================================

export const DEFAULT_OPTICS_CONFIG: InstrumentOpticsConfig = {
  anodeId: 'CuKa1',
  customWavelengthA: 1.540598,
  includeKa2: false,
  ka2Ratio: 0.5,
  enableInstCorrection: true,
  useCaglioti: true,
  fixedInstFwhm: 0.075,
  cagliotiU: 0.0085,
  cagliotiV: -0.0042,
  cagliotiW: 0.0048,
  instEta: 0.25,
  deconvolutionLaw: 'Voigt',
  scherrerK: 0.9,
  weighting: 'poisson',
  shareShapeAcrossPeaks: false,
};

export const FWHM_SCENARIO_PRESETS: FWHMScenarioPreset[] = [
  {
    id: 'overlapping_tio2',
    name: 'TiO₂ Anatase + Rutile Doublet',
    subtitle: 'Overlapping (101)/(110) reflections requiring multi-peak deconvolution',
    materialTag: 'Two-Phase Ceramic',
    recommendedModel: 'Pseudo-Voigt',
    optics: { anodeId: 'CuKa1', includeKa2: false, enableInstCorrection: true, useCaglioti: true },
    background: { order: 1, b0: 145, b1: -18, b2: 0 },
    truePeaks: [
      { label: 'Anatase (101)', enabled: true, center: 25.31, amplitude: 2450, fwhm: 0.34, eta: 0.58, pearsonM: 2.0, asymmetry: 1.0 },
      { label: 'Rutile (110)', enabled: true, center: 26.02, amplitude: 1380, fwhm: 0.46, eta: 0.42, pearsonM: 2.4, asymmetry: 1.0 },
    ],
    initialPeaks: [
      { label: 'Anatase (101)', enabled: true, center: 25.22, amplitude: 2100, fwhm: 0.48, eta: 0.35, pearsonM: 2.0, asymmetry: 1.0 },
      { label: 'Rutile (110)', enabled: true, center: 26.15, amplitude: 1100, fwhm: 0.60, eta: 0.35, pearsonM: 2.0, asymmetry: 1.0 },
    ],
    xMin: 23.2,
    xMax: 28.2,
    stepDeg: 0.02,
    noiseScale: 0.85,
    seed: 101,
  },
  {
    id: 'zno_triplet',
    name: 'Nanocrystalline ZnO Triplet',
    subtitle: 'Wurtzite (100), (002), (101) reflections with Scherrer & Williamson-Hall sizing',
    materialTag: 'Nanopowder (~22 nm)',
    recommendedModel: 'Pseudo-Voigt',
    optics: { anodeId: 'CuKa1', includeKa2: false, enableInstCorrection: true, useCaglioti: true },
    background: { order: 1, b0: 180, b1: -22, b2: 0 },
    truePeaks: [
      { label: 'ZnO (100)', enabled: true, center: 31.77, amplitude: 1850, fwhm: 0.41, eta: 0.68, pearsonM: 1.6, asymmetry: 1.0 },
      { label: 'ZnO (002)', enabled: true, center: 34.42, amplitude: 1520, fwhm: 0.33, eta: 0.55, pearsonM: 2.0, asymmetry: 1.0 },
      { label: 'ZnO (101)', enabled: true, center: 36.25, amplitude: 3180, fwhm: 0.44, eta: 0.72, pearsonM: 1.5, asymmetry: 1.0 },
    ],
    initialPeaks: [
      { label: 'ZnO (100)', enabled: true, center: 31.68, amplitude: 1600, fwhm: 0.55, eta: 0.45, pearsonM: 2.0, asymmetry: 1.0 },
      { label: 'ZnO (002)', enabled: true, center: 34.50, amplitude: 1300, fwhm: 0.50, eta: 0.45, pearsonM: 2.0, asymmetry: 1.0 },
      { label: 'ZnO (101)', enabled: true, center: 36.15, amplitude: 2800, fwhm: 0.60, eta: 0.45, pearsonM: 2.0, asymmetry: 1.0 },
    ],
    xMin: 29.5,
    xMax: 38.8,
    stepDeg: 0.03,
    noiseScale: 0.9,
    seed: 202,
  },
  {
    id: 'silicon_ka2_split',
    name: 'Silicon (400) Kα₁ / Kα₂ Doublet',
    subtitle: 'Resolved high-angle Cu Kα doublet at 69.13° with Rachinger stripping',
    materialTag: 'NIST SRM 640f',
    recommendedModel: 'Pseudo-Voigt',
    optics: { anodeId: 'CuKa1', includeKa2: true, ka2Ratio: 0.5, enableInstCorrection: true, useCaglioti: true },
    background: { order: 0, b0: 85, b1: 0, b2: 0 },
    truePeaks: [
      { label: 'Si (400)', enabled: true, center: 69.131, amplitude: 4200, fwhm: 0.118, eta: 0.42, pearsonM: 2.5, asymmetry: 1.0 },
    ],
    initialPeaks: [
      { label: 'Si (400)', enabled: true, center: 69.08, amplitude: 3600, fwhm: 0.18, eta: 0.5, pearsonM: 2.0, asymmetry: 1.0 },
    ],
    xMin: 68.3,
    xMax: 70.2,
    stepDeg: 0.008,
    noiseScale: 0.75,
    seed: 303,
  },
  {
    id: 'asymmetric_low_angle',
    name: 'Asymmetric Low-Angle Peak',
    subtitle: 'Axial divergence low-angle tailing solved by Split Pseudo-Voigt',
    materialTag: 'Axial Asymmetry',
    recommendedModel: 'Split Pseudo-Voigt',
    optics: { anodeId: 'CuKa1', includeKa2: false, enableInstCorrection: true, useCaglioti: true },
    background: { order: 2, b0: 210, b1: -45, b2: 24 },
    truePeaks: [
      { label: 'Zeolite (111)', enabled: true, center: 11.84, amplitude: 3200, fwhm: 0.36, eta: 0.52, pearsonM: 2.2, asymmetry: 0.56 },
    ],
    initialPeaks: [
      { label: 'Zeolite (111)', enabled: true, center: 11.75, amplitude: 2700, fwhm: 0.52, eta: 0.45, pearsonM: 2.0, asymmetry: 1.0 },
    ],
    xMin: 10.0,
    xMax: 13.8,
    stepDeg: 0.015,
    noiseScale: 0.85,
    seed: 404,
  },
  {
    id: 'strained_copper_p7',
    name: 'Cold-Worked Cu (111) Heavy Tails',
    subtitle: 'Dislocation-broadened super-Lorentzian reflection ideal for Pearson VII',
    materialTag: 'Strained Metal',
    recommendedModel: 'Pearson VII',
    optics: { anodeId: 'CuKa1', includeKa2: false, enableInstCorrection: true, useCaglioti: true },
    background: { order: 1, b0: 130, b1: -10, b2: 0 },
    truePeaks: [
      { label: 'Cu (111)', enabled: true, center: 43.297, amplitude: 3850, fwhm: 0.54, eta: 0.82, pearsonM: 1.28, asymmetry: 1.0 },
    ],
    initialPeaks: [
      { label: 'Cu (111)', enabled: true, center: 43.20, amplitude: 3200, fwhm: 0.72, eta: 0.5, pearsonM: 2.5, asymmetry: 1.0 },
    ],
    xMin: 40.5,
    xMax: 46.2,
    stepDeg: 0.02,
    noiseScale: 0.9,
    seed: 505,
  },
  {
    id: 'nist_lab6_calib',
    name: 'NIST LaB₆ (110) Calibration Line',
    subtitle: 'Sharp symmetric reference standard near the instrumental resolution limit',
    materialTag: 'SRM 660c',
    recommendedModel: 'Pseudo-Voigt',
    optics: { anodeId: 'CuKa1', includeKa2: false, enableInstCorrection: true, useCaglioti: true },
    background: { order: 0, b0: 68, b1: 0, b2: 0 },
    truePeaks: [
      { label: 'LaB₆ (110)', enabled: true, center: 30.386, amplitude: 5600, fwhm: 0.088, eta: 0.34, pearsonM: 3.2, asymmetry: 1.0 },
    ],
    initialPeaks: [
      { label: 'LaB₆ (110)', enabled: true, center: 30.35, amplitude: 4800, fwhm: 0.14, eta: 0.5, pearsonM: 2.0, asymmetry: 1.0 },
    ],
    xMin: 29.7,
    xMax: 31.1,
    stepDeg: 0.006,
    noiseScale: 0.7,
    seed: 606,
  },
];

export function generateScenarioDataset(preset: FWHMScenarioPreset): {
  data: RawXYPoint[];
  initialPeaks: FitPeakParam[];
  optics: InstrumentOpticsConfig;
  background: BackgroundConfig;
  model: ProfileModelType;
} {
  const optics: InstrumentOpticsConfig = {
    ...DEFAULT_OPTICS_CONFIG,
    ...preset.optics,
  };
  const truePeaks: FitPeakParam[] = preset.truePeaks.map((pk, idx) => ({
    ...pk,
    id: `pk_${idx + 1}`,
    color: PEAK_PALETTE[idx % PEAK_PALETTE.length],
    lockCenter: false,
    lockFwhm: false,
    lockShape: false,
    lockAsymmetry: false,
  }));
  const initialPeaks: FitPeakParam[] = preset.initialPeaks.map((pk, idx) => ({
    ...pk,
    id: `pk_${idx + 1}`,
    color: PEAK_PALETTE[idx % PEAK_PALETTE.length],
    lockCenter: false,
    lockFwhm: false,
    lockShape: false,
    lockAsymmetry: false,
  }));

  const rand = mulberry32(preset.seed);
  const count = Math.floor((preset.xMax - preset.xMin) / preset.stepDeg) + 1;
  const data: RawXYPoint[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const x = Number((preset.xMin + i * preset.stepDeg).toFixed(4));
    const clean = evaluateModelAt(
      x,
      preset.xMin,
      preset.xMax,
      truePeaks,
      preset.background,
      preset.recommendedModel,
      optics
    );
    const u1 = Math.max(1e-7, rand());
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const noisy = Math.max(0, clean + z * Math.sqrt(Math.max(1, clean)) * preset.noiseScale);
    data[i] = { x, y: Number(noisy.toFixed(2)) };
  }

  return {
    data,
    initialPeaks,
    optics,
    background: { ...preset.background },
    model: preset.recommendedModel,
  };
}

// ============================================================================
// EXPORTS (CSV & SCIENTIFIC REPORT)
// ============================================================================

export function exportFitToCSV(params: {
  datasetName: string;
  model: ProfileModelType;
  optics: InstrumentOpticsConfig;
  points: EvaluatedCurvePoint[];
  peakMetrics: EvaluatedPeakMetrics[];
  stats: FitStatistics;
}): string {
  const { datasetName, model, optics, points, peakMetrics, stats } = params;
  const { lambda1A } = getActiveWavelengthA(optics);
  const activePeaks = peakMetrics.filter((m) => m.peak.enabled);

  const header = [
    `# XRD-Calc Pro — FWHM Profile Fitting Export`,
    `# Dataset: ${datasetName} | Model: ${model} | Radiation: ${FWHM_XRAY_ANODES[optics.anodeId].symbol} (${lambda1A.toFixed(6)} A)`,
    `# Rwp: ${stats.rwp.toFixed(3)}% | Rp: ${stats.rp.toFixed(3)}% | R2: ${stats.rSquared.toFixed(5)} | Chi2: ${stats.chi2Reduced.toFixed(3)} | DW: ${stats.durbinWatson.toFixed(3)}`,
    `2Theta_deg,d_spacing_A,Q_invA,I_obs_cps,I_calc_cps,Background_cps,Residual_cps,${activePeaks.map((m) => `"${m.peak.label}_cps"`).join(',')}`,
  ];

  const rows = points.map((pt) => {
    const pkCols = activePeaks.map((m) => (pt.peakValues[m.peak.id] || 0).toFixed(3)).join(',');
    return `${pt.x.toFixed(4)},${pt.dSpacing.toFixed(5)},${pt.qValue.toFixed(5)},${pt.yObs.toFixed(3)},${pt.yCalc.toFixed(3)},${pt.yBg.toFixed(3)},${pt.residual.toFixed(3)}${pkCols ? ',' + pkCols : ''}`;
  });

  return [...header, ...rows].join('\n');
}

export function buildProfileFitReport(params: {
  datasetName: string;
  model: ProfileModelType;
  optics: InstrumentOpticsConfig;
  background: BackgroundConfig;
  peakMetrics: EvaluatedPeakMetrics[];
  stats: FitStatistics;
  williamsonHall?: WilliamsonHallSummary;
}): string {
  const { datasetName, model, optics, background, peakMetrics, stats, williamsonHall } = params;
  const { lambda1A } = getActiveWavelengthA(optics);
  const anode = FWHM_XRAY_ANODES[optics.anodeId];

  const fmtErr = (val: number, err: number | null, dec: number) =>
    err !== null && Number.isFinite(err) ? `${val.toFixed(dec)} ± ${err.toFixed(dec)}` : val.toFixed(dec);

  const lines = peakMetrics
    .filter((m) => m.peak.enabled)
    .map((m, idx) => {
      const shapeStr =
        model === 'Gaussian'
          ? 'η = 0.000'
          : model === 'Lorentzian'
          ? 'η = 1.000'
          : model === 'Pearson VII'
          ? `m = ${fmtErr(m.peak.pearsonM, m.uncertainty.shapeErr, 2)}`
          : model === 'Split Pseudo-Voigt'
          ? `η = ${fmtErr(m.peak.eta, m.uncertainty.shapeErr, 3)}, H_R/H_L = ${fmtErr(m.peak.asymmetry, m.uncertainty.asymmetryErr, 2)}`
          : `η = ${fmtErr(m.peak.eta, m.uncertainty.shapeErr, 3)}`;
      const sizeStr = m.resolutionLimited
        ? 'Resolution limited'
        : m.scherrerSizeNm !== null
        ? `${fmtErr(m.scherrerSizeNm, m.uncertainty.scherrerSizeErrNm, 1)} nm`
        : '—';
      const strainStr =
        m.microstrainPct !== null
          ? `${fmtErr(m.microstrainPct, m.uncertainty.microstrainErrPct, 3)}%`
          : '—';
      return [
        `  ${idx + 1}. ${m.peak.label}`,
        `     2θ₀ (apex) = ${fmtErr(m.peak.center, m.uncertainty.centerErr, 4)}°  |  2θ_centroid = ${m.centroidDeg.toFixed(4)}°  |  d = ${fmtErr(m.dSpacingA, m.uncertainty.dSpacingErr, 4)} Å  |  Q = ${m.qInvA.toFixed(4)} Å⁻¹`,
        `     FWHM_obs = ${fmtErr(m.fwhmObs, m.uncertainty.fwhmErr, 4)}°  |  β_inst = ${m.instFwhmDeg.toFixed(4)}°  |  β_sample = ${fmtErr(m.sampleFwhmDeg, m.uncertainty.sampleFwhmErr, 4)}°`,
        `     Integral Breadth β_I = ${m.integralBreadthDeg.toFixed(4)}°  |  Shape φ = ${m.shapeFactorPhi.toFixed(4)}  |  ${shapeStr}`,
        `     Area = ${fmtErr(m.integratedArea, m.uncertainty.areaErr, 1)} cps·deg (${m.areaFractionPct.toFixed(1)}%)  |  Scherrer D = ${sizeStr}  |  ε_max = ${strainStr}`,
      ].join('\n');
    })
    .join('\n\n');

  const whSection =
    williamsonHall && williamsonHall.weightedMeanScherrerNm !== null
      ? [
          ``,
          `MULTI-REFLECTION MICROSTRUCTURE SUMMARY`,
          `  Area-Weighted Mean Scherrer ⟨D⟩ = ${williamsonHall.weightedMeanScherrerNm.toFixed(1)}${
            williamsonHall.weightedStdScherrerNm !== null ? ` ± ${williamsonHall.weightedStdScherrerNm.toFixed(1)}` : ''
          } nm (${williamsonHall.peakCount} peaks)`,
          williamsonHall.valid
            ? `  Williamson-Hall Separation: D_WH = ${
                williamsonHall.sizeNm !== null ? williamsonHall.sizeNm.toFixed(1) + ' nm' : '—'
              }  |  ε_WH = ${
                williamsonHall.microstrainPct !== null ? williamsonHall.microstrainPct.toFixed(3) + '%' : '—'
              }  |  R²_WH = ${williamsonHall.rSquared !== null ? williamsonHall.rSquared.toFixed(3) : '—'}`
            : `  Williamson-Hall Separation: Requires ≥2 peaks spanning wider 2θ range`,
        ]
      : [];

  return [
    `XRD LINE-PROFILE DECONVOLUTION & FWHM FITTING REPORT`,
    `====================================================`,
    `Dataset:            ${datasetName}`,
    `Profile Function:   ${model}${optics.shareShapeAcrossPeaks ? ' (Shared shape constraint active)' : ''}`,
    `Radiation:          ${anode.symbol} (λ₁ = ${lambda1A.toFixed(6)} Å${optics.includeKa2 ? `, Kα₂ included at I₂/I₁ = ${optics.ka2Ratio.toFixed(2)}` : ''})`,
    `Instrumental Corr.: ${optics.enableInstCorrection ? `${optics.deconvolutionLaw} (${optics.useCaglioti ? `Caglioti U=${optics.cagliotiU}, V=${optics.cagliotiV}, W=${optics.cagliotiW}` : `Fixed β_inst=${optics.fixedInstFwhm.toFixed(4)}°`})` : 'Disabled'}`,
    `Background Model:   Order ${background.order} (b₀=${background.b0.toFixed(1)}, b₁=${background.b1.toFixed(1)}, b₂=${background.b2.toFixed(1)})`,
    ``,
    `GOODNESS-OF-FIT STATISTICS (${stats.nPoints} pts, ${stats.nParams} free params, DoF=${stats.dof})`,
    `  R_wp = ${stats.rwp.toFixed(3)}%  |  R_p = ${stats.rp.toFixed(3)}%  |  R_exp = ${stats.rexp.toFixed(3)}%  |  R² = ${stats.rSquared.toFixed(5)}`,
    `  Reduced χ² = ${stats.chi2Reduced.toFixed(3)}  |  GoF (S) = ${stats.gof.toFixed(3)}  |  Durbin-Watson d = ${stats.durbinWatson.toFixed(3)}  |  Max |r_ij| = ${stats.maxParamCorrelation.toFixed(3)}`,
    `  AIC = ${stats.aic.toFixed(1)}  |  BIC = ${stats.bic.toFixed(1)}  |  LM Iterations = ${stats.iterations}`,
    ``,
    `REFINED DIFFRACTION PEAKS`,
    lines || '  No active peaks.',
    ...whSection,
  ].join('\n');
}
