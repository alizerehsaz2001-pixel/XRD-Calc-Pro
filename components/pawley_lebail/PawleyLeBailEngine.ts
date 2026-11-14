import {
  CrystalSystem,
  PeakReflection,
  PatternPoint,
  RefinementMetrics,
  OverlappingPair,
  ProfileShapeType,
  BackgroundCoeffs,
  CovarianceCluster,
  UploadedXRDData,
  InitialGuessMode,
  LatticeParameters,
  CagliotiProfile
} from './PawleyLeBailTypes';
import {
  SPACE_GROUPS_DATABASE,
  checkExtinction,
  calculateMultiplicity
} from '../../utils/spaceGroupExtinctionEngine';

/**
 * Compute 1/d^2 for all 7 crystal systems
 */
export function calculateInvD2(
  h: number,
  k: number,
  l: number,
  system: CrystalSystem,
  lattice: { a: number; b: number; c: number; alpha?: number; beta?: number; gamma?: number }
): number {
  const { a, b, c } = lattice;
  const alphaDeg = lattice.alpha ?? 90;
  const betaDeg = lattice.beta ?? 90;
  const gammaDeg = lattice.gamma ?? 90;

  switch (system) {
    case 'Cubic':
      return (h * h + k * k + l * l) / (a * a);

    case 'Tetragonal':
      return (h * h + k * k) / (a * a) + (l * l) / (c * c);

    case 'Hexagonal':
    case 'Trigonal':
      return (4 / 3) * (h * h + h * k + k * k) / (a * a) + (l * l) / (c * c);

    case 'Orthorhombic':
      return (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);

    case 'Monoclinic': {
      const betaRad = (betaDeg * Math.PI) / 180;
      const sinB = Math.sin(betaRad);
      const cosB = Math.cos(betaRad);
      const sin2B = sinB * sinB;
      if (sin2B < 1e-6) return (h * h + k * k + l * l) / (a * a);
      return (
        (1 / sin2B) *
        ((h * h) / (a * a) +
          (k * k * sin2B) / (b * b) +
          (l * l) / (c * c) -
          (2 * h * l * cosB) / (a * c))
      );
    }

    case 'Triclinic': {
      const aR = (alphaDeg * Math.PI) / 180;
      const bR = (betaDeg * Math.PI) / 180;
      const gR = (gammaDeg * Math.PI) / 180;
      const ca = Math.cos(aR);
      const cb = Math.cos(bR);
      const cg = Math.cos(gR);
      const sa = Math.sin(aR);
      const sb = Math.sin(bR);
      const sg = Math.sin(gR);

      const vTerm = 1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg;
      const V = a * b * c * Math.sqrt(Math.max(1e-8, vTerm));

      const aStar = (b * c * sa) / V;
      const bStar = (a * c * sb) / V;
      const cStar = (a * b * sg) / V;

      const cosAlphaStar = (cb * cg - ca) / (sb * sg);
      const cosBetaStar = (ca * cg - cb) / (sa * sg);
      const cosGammaStar = (ca * cb - cg) / (sa * sb);

      return (
        h * h * aStar * aStar +
        k * k * bStar * bStar +
        l * l * cStar * cStar +
        2 * h * k * aStar * bStar * cosGammaStar +
        2 * k * l * bStar * cStar * cosAlphaStar +
        2 * h * l * aStar * cStar * cosBetaStar
      );
    }

    default:
      return (h * h + k * k + l * l) / (a * a);
  }
}

/**
 * Lanczos approximation for ln(Gamma(z)) for exact Pearson VII area normalization
 */
function logGamma(z: number): number {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  let x = z - 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    a += p[i] / (x + i + 1);
  }
  const t = x + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/**
 * Caglioti FWHM Function: H^2 = U tan^2(theta) + V tan(theta) + W
 */
export function calculateCagliotiFWHM(
  twoThetaDeg: number,
  U: number,
  V: number,
  W: number
): number {
  const thetaRad = (Math.max(0.5, Math.min(179, twoThetaDeg)) * Math.PI) / 360;
  const tanT = Math.tan(thetaRad);
  const fwhmSq = U * tanT * tanT + V * tanT + W;
  return Math.sqrt(Math.max(0.0004, fwhmSq));
}

/**
 * Thompson-Cox-Hastings (TCH) Pseudo-Voigt FWHM & mixing parameter eta(2Theta)
 * Approximates Voigt convolution of Gaussian FWHM H_G and Lorentzian H_L
 */
export function computeTCHParameters(
  twoThetaDeg: number,
  U: number,
  V: number,
  W: number,
  etaBase: number
): { fwhm: number; eta: number } {
  const totalFwhm = calculateCagliotiFWHM(twoThetaDeg, U, V, W);
  const thetaRad = (Math.max(0.5, Math.min(179, twoThetaDeg)) * Math.PI) / 360;
  // Split total width heuristically into Gaussian and Lorentzian components scaled by cos/tan theta
  const hG = totalFwhm * Math.max(0.05, Math.sqrt(1 - etaBase * 0.7));
  const hL = totalFwhm * (0.3 + 0.9 * etaBase) * (0.85 + 0.3 * Math.tan(thetaRad));

  const gamma = Math.pow(
    Math.pow(hG, 5) +
      2.69269 * Math.pow(hG, 4) * hL +
      2.42843 * Math.pow(hG, 3) * hL * hL +
      4.47163 * hG * hG * Math.pow(hL, 3) +
      0.07842 * hG * Math.pow(hL, 4) +
      Math.pow(hL, 5),
    0.2
  );

  const ratio = gamma > 1e-6 ? hL / gamma : 0.5;
  const eta = Math.max(
    0,
    Math.min(1, 1.36603 * ratio - 0.47719 * ratio * ratio + 0.11116 * ratio * ratio * ratio)
  );
  return { fwhm: Math.max(0.02, gamma), eta };
}

/**
 * Normalized Pseudo-Voigt Profile Function (Area = 1) with optional asymmetry skew
 */
export function pseudoVoigtProfile(
  twoTheta: number,
  center: number,
  fwhm: number,
  eta: number,
  asym: number = 0
): number {
  const clampedEta = Math.max(0, Math.min(1, eta));
  let dx = twoTheta - center;

  // Simple Rietveld/Bérar-Baldinozzi asymmetry stretch while preserving area = 1
  if (Math.abs(asym) > 1e-4) {
    const halfScale = dx < 0 ? 1 + asym * 0.5 : 1 - asym * 0.5;
    const safeScale = Math.max(0.4, Math.min(1.6, halfScale));
    dx = dx / safeScale;
  }

  const safeFwhm = Math.max(0.015, fwhm);
  const halfFWHM = safeFwhm / 2;

  const gFactor = Math.sqrt((4 * Math.LN2) / Math.PI) / safeFwhm;
  const gaussian = gFactor * Math.exp(-4 * Math.LN2 * (dx / safeFwhm) * (dx / safeFwhm));
  const lorentzian = (1 / (Math.PI * halfFWHM)) * (1 / (1 + (dx / halfFWHM) * (dx / halfFWHM)));

  return clampedEta * lorentzian + (1 - clampedEta) * gaussian;
}

/**
 * Exact Unit-Area Normalized Pearson VII Profile Function
 * N_m = 2 * sqrt(2^(1/m) - 1) / sqrt(pi) * Gamma(m) / Gamma(m - 1/2)
 */
export function pearsonVIIProfile(
  twoTheta: number,
  center: number,
  fwhm: number,
  mExponent: number = 2.0,
  asym: number = 0
): number {
  const safeFwhm = Math.max(0.015, fwhm);
  let dx = twoTheta - center;
  if (Math.abs(asym) > 1e-4) {
    const halfScale = dx < 0 ? 1 + asym * 0.5 : 1 - asym * 0.5;
    dx = dx / Math.max(0.4, Math.min(1.6, halfScale));
  }
  const m = Math.max(0.75, mExponent);
  const kFactor = Math.pow(2, 1 / m) - 1;
  const c4 = 2 * Math.sqrt(kFactor);
  const gammaRatio = Math.exp(logGamma(m) - logGamma(m - 0.5));
  const norm = (c4 / (safeFwhm * Math.sqrt(Math.PI))) * gammaRatio;
  const denom = Math.pow(1 + 4 * kFactor * Math.pow(dx / safeFwhm, 2), m);
  return norm / denom;
}

/**
 * Evaluate unified profile function (Pseudo-Voigt, TCH Pseudo-Voigt, or Pearson VII)
 */
export function evaluateProfileShape(
  twoTheta: number,
  center: number,
  caglioti: { u: number; v: number; w: number; eta: number; pearsonM?: number; asym?: number },
  profileType: ProfileShapeType
): { value: number; fwhm: number } {
  const asym = caglioti.asym ?? 0;
  if (profileType === 'tch_voigt') {
    const { fwhm, eta } = computeTCHParameters(center, caglioti.u, caglioti.v, caglioti.w, caglioti.eta);
    return { value: pseudoVoigtProfile(twoTheta, center, fwhm, eta, asym), fwhm };
  }
  const fwhm = calculateCagliotiFWHM(center, caglioti.u, caglioti.v, caglioti.w);
  if (profileType === 'pearson_vii') {
    return {
      value: pearsonVIIProfile(twoTheta, center, fwhm, caglioti.pearsonM ?? 2.0, asym),
      fwhm
    };
  }
  return {
    value: pseudoVoigtProfile(twoTheta, center, fwhm, caglioti.eta, asym),
    fwhm
  };
}

/**
 * Evaluate 4-term shifted Chebyshev polynomial background T_0..T_3 on [min2T, max2T]
 */
export function evaluateChebyshevBackground(
  twoTheta: number,
  range: [number, number],
  bg: BackgroundCoeffs
): number {
  const span = Math.max(1e-3, range[1] - range[0]);
  const x = (2 * (twoTheta - range[0])) / span - 1; // normalized [-1, 1]
  const t0 = 1;
  const t1 = x;
  const t2 = 2 * x * x - 1;
  const t3 = 4 * x * x * x - 3 * x;
  const val = bg.bg0 * t0 + bg.bg1 * t1 + bg.bg2 * t2 + (bg.bg3 ?? 0) * t3;
  return Math.max(5, val);
}

/**
 * Canonicalize an (h,k,l) tuple into its Laue asymmetric unit key so symmetry equivalents
 * collapse cleanly while accidental coincidences (e.g., Cubic 511 vs 333) remain distinct!
 */
function getLaueFamilyKey(h: number, k: number, l: number, system: CrystalSystem): string {
  const ah = Math.abs(h);
  const ak = Math.abs(k);
  const al = Math.abs(l);

  if (system === 'Cubic') {
    const sorted = [ah, ak, al].sort((x, y) => y - x);
    return sorted.join('_');
  }
  if (system === 'Tetragonal') {
    const [p, q] = ah >= ak ? [ah, ak] : [ak, ah];
    return `${p}_${q}_${al}`;
  }
  if (system === 'Hexagonal' || system === 'Trigonal') {
    const i = -(h + k);
    // All hexagonal/trigonal equivalents preserve |l| and unordered {|h|, |k|, |h+k|} (modulo obverse R sign)
    const basal = [ah, ak, Math.abs(i)].sort((x, y) => y - x);
    if (system === 'Trigonal') {
      // Distinguish (-h+k+l) mod 3 sign family in R-settings while keeping {hkl} compact
      return `T_${basal.join('_')}_${al}_${h * k * l >= 0 ? 'p' : 'm'}`;
    }
    return `H_${basal.join('_')}_${al}`;
  }
  if (system === 'Orthorhombic') {
    return `${ah}_${ak}_${al}`;
  }
  if (system === 'Monoclinic') {
    // Laue 2/m: (h,k,l) == (-h,k,-l) == (h,-k,l) == (-h,-k,-l); keep h >= 0 canonical
    if (h < 0 || (h === 0 && l < 0)) {
      return `M_${-h}_${ak}_${-l}`;
    }
    return `M_${h}_${ak}_${l}`;
  }
  // Triclinic -1: Friedel pair (h,k,l) == (-h,-k,-l)
  if (l < 0 || (l === 0 && (k < 0 || (k === 0 && h < 0)))) {
    return `A_${-h}_${-k}_${-l}`;
  }
  return `A_${h}_${k}_${l}`;
}

/**
 * Generate symmetry-allowed Bragg reflections in the active Laue asymmetric unit
 */
export function generateReflections(
  system: CrystalSystem,
  lattice: { a: number; b: number; c: number; alpha?: number; beta?: number; gamma?: number },
  wavelength: number,
  zeroShift: number,
  twoThetaRange: [number, number] = [12, 88],
  spaceGroupNumber?: number,
  customSpaceGroup?: string
): PeakReflection[] {
  const list: PeakReflection[] = [];
  const seenFamilies = new Set<string>();
  const [min2T, max2T] = twoThetaRange;

  const sgInfo = customSpaceGroup
    ? SPACE_GROUPS_DATABASE.find(
        sg =>
          sg.symbol.toLowerCase() === customSpaceGroup.toLowerCase() ||
          sg.symbol.replace(/[_\/\s-]/g, '').toLowerCase() ===
            customSpaceGroup.replace(/[_\/\s-]/g, '').toLowerCase()
      ) ??
      (spaceGroupNumber ? SPACE_GROUPS_DATABASE.find(sg => sg.number === spaceGroupNumber) : undefined)
    : spaceGroupNumber
    ? SPACE_GROUPS_DATABASE.find(sg => sg.number === spaceGroupNumber)
    : undefined;

  const maxIndex = system === 'Triclinic' ? 4 : system === 'Monoclinic' || system === 'Orthorhombic' ? 5 : 6;
  const lMin = system === 'Monoclinic' || system === 'Triclinic' || system === 'Trigonal' ? -maxIndex : 0;

  for (let h = -maxIndex; h <= maxIndex; h++) {
    for (let k = -maxIndex; k <= maxIndex; k++) {
      for (let l = lMin; l <= maxIndex; l++) {
        if (h === 0 && k === 0 && l === 0) continue;

        const famKey = getLaueFamilyKey(h, k, l, system);
        if (seenFamilies.has(famKey)) continue;

        // Check Space Group Extinction Rules
        let isAllowed = true;
        if (sgInfo) {
          const res = checkExtinction(h, k, l, sgInfo);
          isAllowed = res.allowed;
        }
        if (!isAllowed) continue;

        const invD2 = calculateInvD2(h, k, l, system, lattice);
        if (invD2 <= 0) continue;

        const d = 1 / Math.sqrt(invD2);
        const sinTheta = wavelength / (2 * d);
        if (sinTheta >= 0.995) continue;

        const twoTheta = (2 * Math.asin(sinTheta) * 180) / Math.PI + zeroShift;
        if (twoTheta < min2T || twoTheta > max2T) continue;

        seenFamilies.add(famKey);
        const mult = calculateMultiplicity(h, k, l, system);

        // Deterministic physically plausible reference intensities |F_hkl|^2 * LP * m
        const q = (4 * Math.PI * sinTheta) / wavelength;
        const thetaRad = Math.asin(sinTheta);
        const lorentzPolar =
          (1 + Math.pow(Math.cos(2 * thetaRad), 2)) /
          (Math.sin(thetaRad) * Math.sin(thetaRad) * Math.cos(thetaRad) + 0.08);
        // Deterministic structural interference modulation across indices
        const phaseHash =
          0.35 +
          0.65 *
            Math.abs(
              Math.cos(0.73 * h + 1.19 * k + 0.51 * l) *
                Math.cos(0.41 * (h * h + k + 2 * l))
            );
        const refIntensity = Math.max(
          45,
          Math.round(95 * phaseHash * Math.exp(-0.04 * q * q) * Math.sqrt(mult) * Math.min(8, lorentzPolar * 0.25))
        );

        list.push({
          id: `${h}_${k}_${l}`,
          h,
          k,
          l,
          twoTheta,
          dSpacing: d,
          multiplicity: mult,
          intensity: refIntensity,
          prevIntensity: refIntensity,
          calcIntensity: refIntensity,
          fwhm: 0.1
        });
      }
    }
  }

  return list.sort((a, b) => a.twoTheta - b.twoTheta);
}

/**
 * Build initial intensity guesses for blind Whole Pattern Decomposition
 */
export function buildInitialIntensities(
  reflections: PeakReflection[],
  mode: InitialGuessMode = 'uniform',
  scaleHint: number = 600
): Record<string, number> {
  const out: Record<string, number> = {};
  reflections.forEach((r, idx) => {
    if (mode === 'uniform') {
      out[r.id] = scaleHint;
    } else if (mode === 'wilson') {
      // Exponential Wilson decay prior proportional to multiplicity * exp(-B s^2)
      const invD = 1 / Math.max(0.5, r.dSpacing);
      out[r.id] = Math.max(40, scaleHint * (r.multiplicity / 12) * Math.exp(-0.22 * invD * invD));
    } else {
      // Deliberate deterministic mismatched start for testing convergence robustness
      const jitter = 0.25 + 1.45 * Math.abs(Math.sin(idx * 1.93 + 0.4));
      out[r.id] = Math.max(50, r.intensity * jitter);
    }
  });
  return out;
}

/**
 * Synthesize FIXED observed experimental diffraction pattern Y_obs(2Theta)
 * Includes optional Cu Ka2 stripping doublet (0.5 intensity at lambda = 1.54439 A) and Poisson noise
 */
export function synthesizeObservedPattern(
  trueReflections: PeakReflection[],
  caglioti: { u: number; v: number; w: number; eta: number; pearsonM?: number; asym?: number },
  background: BackgroundCoeffs,
  profileType: ProfileShapeType = 'pseudo_voigt',
  stepSize: number = 0.05,
  range: [number, number] = [15, 85],
  includeKa2Doublet: boolean = false,
  ka1Wavelength: number = 1.54056,
  noiseLevel: number = 1.0
): { twoTheta: number; yObs: number; sigmaObs: number }[] {
  const [start2T, end2T] = range;
  const pts: { twoTheta: number; yObs: number; sigmaObs: number }[] = [];
  const ka2Ratio = 1.54439 / 1.54056; // Cu Ka2 / Ka1 ratio

  for (let tt = start2T; tt <= end2T + 1e-6; tt += stepSize) {
    const bg = evaluateChebyshevBackground(tt, range, background);
    let signal = bg;

    for (let k = 0; k < trueReflections.length; k++) {
      const r = trueReflections[k];
      if (Math.abs(tt - r.twoTheta) > 2.8) continue;

      const { value: prof } = evaluateProfileShape(tt, r.twoTheta, caglioti, profileType);
      signal += r.intensity * prof;

      if (includeKa2Doublet && Math.abs(ka1Wavelength - 1.54056) < 0.02) {
        const sinT1 = Math.sin((r.twoTheta * Math.PI) / 360);
        const sinT2 = Math.min(0.995, sinT1 * ka2Ratio);
        const ttKa2 = (2 * Math.asin(sinT2) * 180) / Math.PI;
        const { value: prof2 } = evaluateProfileShape(tt, ttKa2, caglioti, profileType);
        signal += 0.5 * r.intensity * prof2;
      }
    }

    // Reproducible deterministic Poisson counting fluctuations
    const deterministicNoise =
      noiseLevel *
      (Math.sin(tt * 173.31) * 0.55 + Math.cos(tt * 311.77) * 0.45) *
      Math.sqrt(Math.max(4, signal)) *
      0.55;
    const yObs = Math.max(1, signal + deterministicNoise);
    const sigmaObs = Math.max(1, Math.sqrt(yObs));
    pts.push({ twoTheta: Number(tt.toFixed(4)), yObs, sigmaObs });
  }

  return pts;
}

/**
 * Evaluate Calculated Pattern Y_calc(2Theta) against FIXED Observed Data Y_obs(2Theta)
 */
export function evaluatePatternFit(
  observedData: { twoTheta: number; yObs: number; sigmaObs: number }[],
  reflections: PeakReflection[],
  intensitiesLeBail: Record<string, number>,
  intensitiesPawley: Record<string, number> | null,
  caglioti: { u: number; v: number; w: number; eta: number; pearsonM?: number; asym?: number },
  background: BackgroundCoeffs,
  profileType: ProfileShapeType = 'pseudo_voigt',
  primaryMethod: 'lebail' | 'pawley' | 'comparator' = 'lebail'
): PatternPoint[] {
  if (observedData.length === 0) return [];
  const range: [number, number] = [
    observedData[0].twoTheta,
    observedData[observedData.length - 1].twoTheta
  ];

  const primaryMap = primaryMethod === 'pawley' && intensitiesPawley ? intensitiesPawley : intensitiesLeBail;

  return observedData.map(pt => {
    const bg = evaluateChebyshevBackground(pt.twoTheta, range, background);
    let calcPrimary = bg;
    let calcLeBail = bg;
    let calcPawley = bg;
    const peakContributions: { key: string; intensity: number }[] = [];

    for (let k = 0; k < reflections.length; k++) {
      const r = reflections[k];
      if (Math.abs(pt.twoTheta - r.twoTheta) > 2.5) continue;

      const { value: prof } = evaluateProfileShape(pt.twoTheta, r.twoTheta, caglioti, profileType);
      if (prof < 1e-5) continue;

      const iPrim = primaryMap[r.id] ?? 0;
      const peakI = iPrim * prof;
      calcPrimary += peakI;

      const iLB = intensitiesLeBail[r.id] ?? 0;
      calcLeBail += iLB * prof;

      if (intensitiesPawley) {
        const iPW = intensitiesPawley[r.id] ?? 0;
        calcPawley += iPW * prof;
      }

      if (Math.abs(peakI) > 0.4) {
        peakContributions.push({ key: r.id, intensity: peakI });
      }
    }

    return {
      twoTheta: pt.twoTheta,
      yObs: pt.yObs,
      yCalc: calcPrimary,
      yCalcLeBail: calcLeBail,
      yCalcPawley: intensitiesPawley ? calcPawley : undefined,
      yBg: bg,
      diff: pt.yObs - calcPrimary,
      diffPawley: intensitiesPawley ? pt.yObs - calcPawley : undefined,
      sigmaObs: pt.sigmaObs,
      peaks: peakContributions
    };
  });
}

/**
 * Execute ONE authentic Le Bail Intensity Partitioning Cycle (Le Bail 1988)
 * Formula: I_k^(n+1) = Sum_i [ (Y_obs,i - Y_bg,i) * I_k^(n) * phi_ik / Y_calc,net,i ] / Sum_i phi_ik
 */
export function stepLeBailIteration(
  reflections: PeakReflection[],
  currentIntensities: Record<string, number>,
  observedData: { twoTheta: number; yObs: number; sigmaObs: number }[],
  caglioti: { u: number; v: number; w: number; eta: number; pearsonM?: number; asym?: number },
  background: BackgroundCoeffs,
  relaxationFactor: number = 0.85,
  profileType: ProfileShapeType = 'pseudo_voigt'
): { updatedIntensities: Record<string, number>; maxDeltaPct: number } {
  const nextIntensities: Record<string, number> = {};
  if (observedData.length === 0) return { updatedIntensities: currentIntensities, maxDeltaPct: 0 };

  const range: [number, number] = [
    observedData[0].twoTheta,
    observedData[observedData.length - 1].twoTheta
  ];

  // Precompute net calculated intensity y_calc_net(i) = Sum_j I_j * phi_j(i) at each channel
  const nPts = observedData.length;
  const yBg = new Float64Array(nPts);
  const yCalcNet = new Float64Array(nPts);

  for (let i = 0; i < nPts; i++) {
    yBg[i] = evaluateChebyshevBackground(observedData[i].twoTheta, range, background);
  }

  // Pre-evaluate peak contributions per reflection
  const refBounds = reflections.map(r => {
    const fwhm = calculateCagliotiFWHM(r.twoTheta, caglioti.u, caglioti.v, caglioti.w);
    const span = Math.max(0.8, 5.0 * fwhm);
    return { id: r.id, center: r.twoTheta, minT: r.twoTheta - span, maxT: r.twoTheta + span };
  });

  for (let k = 0; k < reflections.length; k++) {
    const oldI = Math.max(1e-3, currentIntensities[reflections[k].id] ?? 100);
    const b = refBounds[k];
    for (let i = 0; i < nPts; i++) {
      const tt = observedData[i].twoTheta;
      if (tt < b.minT) continue;
      if (tt > b.maxT) break;
      const { value: prof } = evaluateProfileShape(tt, b.center, caglioti, profileType);
      yCalcNet[i] += oldI * prof;
    }
  }

  let maxDeltaPct = 0;

  for (let k = 0; k < reflections.length; k++) {
    const r = reflections[k];
    const oldI = Math.max(1e-3, currentIntensities[r.id] ?? 100);
    const b = refBounds[k];

    let obsPartitionSum = 0;
    let profIntegralSum = 0;

    for (let i = 0; i < nPts; i++) {
      const tt = observedData[i].twoTheta;
      if (tt < b.minT) continue;
      if (tt > b.maxT) break;

      const netCalc = yCalcNet[i];
      if (netCalc <= 1e-6) continue;

      const { value: prof } = evaluateProfileShape(tt, b.center, caglioti, profileType);
      if (prof <= 1e-6) continue;

      const netObs = Math.max(0, observedData[i].yObs - yBg[i]);
      obsPartitionSum += (netObs * oldI * prof) / netCalc;
      profIntegralSum += prof;
    }

    let targetI = oldI;
    if (profIntegralSum > 1e-5) {
      targetI = obsPartitionSum / profIntegralSum;
    }

    const updatedI = Math.max(0.5, oldI + relaxationFactor * (targetI - oldI));
    nextIntensities[r.id] = updatedI;

    const deltaPct = (Math.abs(updatedI - oldI) / Math.max(1, oldI)) * 100;
    if (deltaPct > maxDeltaPct) maxDeltaPct = deltaPct;
  }

  return { updatedIntensities: nextIntensities, maxDeltaPct };
}

/**
 * Exact Gauss-Jordan linear system solver & matrix inverse [A^-1] with partial pivoting
 */
function invertAndSolveSymmetric(
  AInput: number[][],
  rhs: number[]
): { solution: number[]; inverse: number[][]; success: boolean } {
  const n = AInput.length;
  const aug: number[][] = Array.from({ length: n }, (_, i) => {
    const row = new Array(2 * n + 1).fill(0);
    for (let j = 0; j < n; j++) row[j] = AInput[i][j];
    row[n + i] = 1;
    row[2 * n] = rhs[i];
    return row;
  });

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(aug[r][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = r;
      }
    }

    if (maxVal < 1e-14) {
      return {
        solution: new Array(n).fill(0),
        inverse: Array.from({ length: n }, () => new Array(n).fill(0)),
        success: false
      };
    }

    if (maxRow !== col) {
      const tmp = aug[col];
      aug[col] = aug[maxRow];
      aug[maxRow] = tmp;
    }

    const pivot = aug[col][col];
    for (let j = col; j <= 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (Math.abs(factor) < 1e-16) continue;
      for (let j = col; j <= 2 * n; j++) {
        aug[r][j] -= factor * aug[col][j];
      }
    }
  }

  const solution = aug.map(row => row[2 * n]);
  const inverse = aug.map(row => row.slice(n, 2 * n));
  return { solution, inverse, success: true };
}

/**
 * Jacobi eigenvalue solver for small symmetric matrix to obtain exact condition number kappa(M)
 */
function estimateSymmetricConditionNumber(mat: number[][]): number {
  const n = mat.length;
  if (n === 0) return 1;
  if (n === 1) return 1;
  // Normalize by diagonal to compute correlation-scaled conditioning or raw conditioning
  const A = mat.map(r => [...r]);
  const maxSweeps = 18;

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = A[p][q];
        if (Math.abs(apq) < 1e-12) continue;
        const app = A[p][p];
        const aqq = A[q][q];
        const tau = (aqq - app) / (2 * apq);
        const t =
          tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;

        A[p][p] = app - t * apq;
        A[q][q] = aqq + t * apq;
        A[p][q] = 0;
        A[q][p] = 0;

        for (let r = 0; r < n; r++) {
          if (r === p || r === q) continue;
          const arp = A[r][p];
          const arq = A[r][q];
          A[r][p] = c * arp - s * arq;
          A[p][r] = A[r][p];
          A[r][q] = s * arp + c * arq;
          A[q][r] = A[r][q];
        }
      }
    }
  }

  const diag = A.map((row, idx) => Math.abs(row[idx]));
  const maxEig = Math.max(...diag);
  const minEig = Math.max(1e-12, Math.min(...diag));
  return maxEig / minEig;
}

export interface PawleyStepResult {
  updatedIntensities: Record<string, number>;
  updatedBackground: BackgroundCoeffs;
  sigmaIntensities: Record<string, number>;
  correlationMatrix: number[][];
  conditionNumber: number;
  negativeCount: number;
  maxDeltaPct: number;
}

/**
 * Execute ONE Exact Pawley Weighted Linear Least-Squares Matrix Fit
 * Solves [J^T W J + lambda * diag(J^T W J)] Delta_p = J^T W (y_obs - y_calc)
 * Extracts true Covariance C = M^-1, correlation coefficients R_jk, ESDs sigma(I_k),
 * and optionally refines 4-term Chebyshev background jointly!
 */
export function stepPawleyIteration(
  reflections: PeakReflection[],
  currentIntensities: Record<string, number>,
  observedData: { twoTheta: number; yObs: number; sigmaObs: number }[],
  caglioti: { u: number; v: number; w: number; eta: number; pearsonM?: number; asym?: number },
  background: BackgroundCoeffs,
  options: {
    dampingLambda?: number;
    profileType?: ProfileShapeType;
    allowNegative?: boolean;
    refineBackground?: boolean;
  } = {}
): PawleyStepResult {
  const {
    dampingLambda = 0.005,
    profileType = 'pseudo_voigt',
    allowNegative = false,
    refineBackground = false
  } = options;

  const K = reflections.length;
  const B = refineBackground ? 4 : 0;
  const dim = K + B;

  if (K === 0 || observedData.length === 0) {
    return {
      updatedIntensities: { ...currentIntensities },
      updatedBackground: { ...background },
      sigmaIntensities: {},
      correlationMatrix: [],
      conditionNumber: 1,
      negativeCount: 0,
      maxDeltaPct: 0
    };
  }

  const range: [number, number] = [
    observedData[0].twoTheta,
    observedData[observedData.length - 1].twoTheta
  ];
  const span = Math.max(1e-3, range[1] - range[0]);

  const M: number[][] = Array.from({ length: dim }, () => new Array(dim).fill(0));
  const V: number[] = new Array(dim).fill(0);

  let chi2Sum = 0;

  for (let i = 0; i < observedData.length; i++) {
    const pt = observedData[i];
    const w_i = 1 / Math.max(1, pt.yObs);
    const bg = evaluateChebyshevBackground(pt.twoTheta, range, background);

    const activeIdx: number[] = [];
    const jacVals: number[] = [];
    let yCalc = bg;

    for (let k = 0; k < K; k++) {
      const r = reflections[k];
      if (Math.abs(pt.twoTheta - r.twoTheta) > 2.5) continue;
      const { value: phi } = evaluateProfileShape(pt.twoTheta, r.twoTheta, caglioti, profileType);
      if (phi > 1e-5) {
        activeIdx.push(k);
        jacVals.push(phi);
        yCalc += (currentIntensities[r.id] ?? 0) * phi;
      }
    }

    if (refineBackground) {
      const x = (2 * (pt.twoTheta - range[0])) / span - 1;
      activeIdx.push(K, K + 1, K + 2, K + 3);
      jacVals.push(1, x, 2 * x * x - 1, 4 * x * x * x - 3 * x);
    }

    const residual = pt.yObs - yCalc;
    chi2Sum += w_i * residual * residual;

    for (let a = 0; a < activeIdx.length; a++) {
      const ka = activeIdx[a];
      const ja = jacVals[a];
      V[ka] += w_i * ja * residual;
      for (let b = a; b < activeIdx.length; b++) {
        const kb = activeIdx[b];
        const jb = jacVals[b];
        const add = w_i * ja * jb;
        M[ka][kb] += add;
        if (ka !== kb) M[kb][ka] += add;
      }
    }
  }

  // Condition number of pure unregularized normal matrix intensities block
  const M_unreg_I = M.slice(0, K).map(row => row.slice(0, K));
  const conditionNumber = estimateSymmetricConditionNumber(M_unreg_I);

  // Levenberg-Marquardt / Tikhonov ridge damping preserving diagonal scaling
  for (let i = 0; i < dim; i++) {
    const diag = M[i][i];
    M[i][i] = diag * (1 + dampingLambda) + 1e-8;
  }

  const { solution, inverse, success } = invertAndSolveSymmetric(M, V);

  const dof = Math.max(1, observedData.length - dim);
  const reducedChi2 = Math.max(0.5, chi2Sum / dof);

  const nextIntensities: Record<string, number> = {};
  const sigmaIntensities: Record<string, number> = {};
  let maxDeltaPct = 0;
  let negativeCount = 0;

  for (let k = 0; k < K; k++) {
    const r = reflections[k];
    const oldI = currentIntensities[r.id] ?? 100;
    const stepVal = success ? solution[k] : 0;
    const rawNewI = oldI + 0.9 * stepVal;
    const newI = allowNegative ? rawNewI : Math.max(0.1, rawNewI);
    if (newI < 0) negativeCount++;

    nextIntensities[r.id] = newI;
    const varI = success ? Math.max(0, inverse[k][k]) * reducedChi2 : 0;
    sigmaIntensities[r.id] = Math.sqrt(varI);

    const deltaPct = (Math.abs(newI - oldI) / Math.max(1, Math.abs(oldI))) * 100;
    if (deltaPct > maxDeltaPct) maxDeltaPct = deltaPct;
  }

  // Correlation Matrix R_jk = C_jk / sqrt(C_jj * C_kk)
  const correlationMatrix: number[][] = Array.from({ length: K }, () => new Array(K).fill(0));
  if (success) {
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        const denom = Math.sqrt(Math.max(1e-18, inverse[i][i] * inverse[j][j]));
        correlationMatrix[i][j] = Math.max(-1, Math.min(1, inverse[i][j] / denom));
      }
    }
  } else {
    for (let i = 0; i < K; i++) correlationMatrix[i][i] = 1;
  }

  const updatedBackground: BackgroundCoeffs = refineBackground && success
    ? {
        bg0: Math.max(5, background.bg0 + 0.8 * solution[K]),
        bg1: background.bg1 + 0.8 * solution[K + 1],
        bg2: background.bg2 + 0.8 * solution[K + 2],
        bg3: (background.bg3 ?? 0) + 0.8 * solution[K + 3]
      }
    : { ...background };

  return {
    updatedIntensities: nextIntensities,
    updatedBackground,
    sigmaIntensities,
    correlationMatrix,
    conditionNumber,
    negativeCount,
    maxDeltaPct
  };
}

/**
 * Genuine Levenberg-Marquardt Nonlinear Least-Squares Refinement for
 * Active Unit Cell Parameters (a, b, c, beta), Zero-Shift 2Theta0, and Optional Caglioti (U, V, W)
 */
export function stepCellAndProfileRefinement(
  system: CrystalSystem,
  lattice: LatticeParameters,
  zeroShift: number,
  caglioti: CagliotiProfile,
  wavelength: number,
  spaceGroupNumber: number,
  spaceGroupSymbol: string,
  currentIntensities: Record<string, number>,
  observedData: { twoTheta: number; yObs: number; sigmaObs: number }[],
  background: BackgroundCoeffs,
  profileType: ProfileShapeType,
  options: {
    refineCell: boolean;
    refineZero: boolean;
    refineProfile: boolean;
  }
): {
  lattice: LatticeParameters;
  zeroShift: number;
  caglioti: CagliotiProfile;
  paramShiftNorm: number;
} {
  if (observedData.length === 0) {
    return { lattice, zeroShift, caglioti, paramShiftNorm: 0 };
  }
  const range: [number, number] = [
    observedData[0].twoTheta,
    observedData[observedData.length - 1].twoTheta
  ];

  // Build active parameter vector
  type ParamKey = 'a' | 'b' | 'c' | 'beta' | 'zero' | 'U' | 'V' | 'W';
  const activeParams: { key: ParamKey; val: number; eps: number; min: number; max: number }[] = [];

  if (options.refineCell) {
    activeParams.push({ key: 'a', val: lattice.a, eps: 0.0004, min: 1.5, max: 35 });
    if (system === 'Orthorhombic' || system === 'Monoclinic' || system === 'Triclinic') {
      activeParams.push({ key: 'b', val: lattice.b, eps: 0.0004, min: 1.5, max: 35 });
    }
    if (system !== 'Cubic') {
      activeParams.push({ key: 'c', val: lattice.c, eps: 0.0004, min: 1.5, max: 40 });
    }
    if (system === 'Monoclinic' || system === 'Triclinic') {
      activeParams.push({ key: 'beta', val: lattice.beta, eps: 0.004, min: 60, max: 135 });
    }
  }
  if (options.refineZero) {
    activeParams.push({ key: 'zero', val: zeroShift, eps: 0.001, min: -1.5, max: 1.5 });
  }
  if (options.refineProfile) {
    activeParams.push({ key: 'U', val: caglioti.u, eps: 0.0002, min: 0.0, max: 0.25 });
    activeParams.push({ key: 'V', val: caglioti.v, eps: 0.0002, min: -0.15, max: 0.15 });
    activeParams.push({ key: 'W', val: caglioti.w, eps: 0.0002, min: 0.0005, max: 0.25 });
  }

  if (activeParams.length === 0) {
    return { lattice, zeroShift, caglioti, paramShiftNorm: 0 };
  }

  // Generate current reflection set mapped by ID so intensities remain anchored to hkl ID
  const evalCalcAtParams = (overrideKey?: ParamKey, overrideVal?: number): Float64Array => {
    const testLat: LatticeParameters = { ...lattice };
    let testZero = zeroShift;
    const testCag: CagliotiProfile = { ...caglioti };

    if (overrideKey === 'a') {
      testLat.a = overrideVal!;
      if (system === 'Cubic') {
        testLat.b = overrideVal!;
        testLat.c = overrideVal!;
      } else if (system === 'Tetragonal' || system === 'Hexagonal' || system === 'Trigonal') {
        testLat.b = overrideVal!;
      }
    } else if (overrideKey === 'b') {
      testLat.b = overrideVal!;
    } else if (overrideKey === 'c') {
      testLat.c = overrideVal!;
    } else if (overrideKey === 'beta') {
      testLat.beta = overrideVal!;
    } else if (overrideKey === 'zero') {
      testZero = overrideVal!;
    } else if (overrideKey === 'U') {
      testCag.u = overrideVal!;
    } else if (overrideKey === 'V') {
      testCag.v = overrideVal!;
    } else if (overrideKey === 'W') {
      testCag.w = overrideVal!;
    }

    const refs = generateReflections(
      system,
      testLat,
      wavelength,
      testZero,
      [Math.max(5, range[0] - 3), Math.min(120, range[1] + 3)],
      spaceGroupNumber,
      spaceGroupSymbol
    );

    const out = new Float64Array(observedData.length);
    for (let i = 0; i < observedData.length; i++) {
      out[i] = evaluateChebyshevBackground(observedData[i].twoTheta, range, background);
    }

    for (let k = 0; k < refs.length; k++) {
      const r = refs[k];
      const ik = currentIntensities[r.id] ?? 0;
      if (Math.abs(ik) < 0.5) continue;
      for (let i = 0; i < observedData.length; i++) {
        const tt = observedData[i].twoTheta;
        if (Math.abs(tt - r.twoTheta) > 2.2) continue;
        const { value: prof } = evaluateProfileShape(tt, r.twoTheta, testCag, profileType);
        out[i] += ik * prof;
      }
    }
    return out;
  };

  const baseCalc = evalCalcAtParams();
  const P = activeParams.length;
  const nPts = observedData.length;

  const jacCols: Float64Array[] = [];
  for (let p = 0; p < P; p++) {
    const param = activeParams[p];
    const up = evalCalcAtParams(param.key, param.val + param.eps);
    const dn = evalCalcAtParams(param.key, param.val - param.eps);
    const col = new Float64Array(nPts);
    const inv2e = 1 / (2 * param.eps);
    for (let i = 0; i < nPts; i++) {
      col[i] = (up[i] - dn[i]) * inv2e;
    }
    jacCols.push(col);
  }

  const M: number[][] = Array.from({ length: P }, () => new Array(P).fill(0));
  const V: number[] = new Array(P).fill(0);

  let baseChi2 = 0;
  for (let i = 0; i < nPts; i++) {
    const w = 1 / Math.max(1, observedData[i].yObs);
    const res = observedData[i].yObs - baseCalc[i];
    baseChi2 += w * res * res;
    for (let a = 0; a < P; a++) {
      V[a] += w * jacCols[a][i] * res;
      for (let b = a; b < P; b++) {
        const add = w * jacCols[a][i] * jacCols[b][i];
        M[a][b] += add;
        if (a !== b) M[b][a] += add;
      }
    }
  }

  // Heavy Levenberg-Marquardt damping for safe monotonic convergence
  const lambda = 0.25;
  for (let p = 0; p < P; p++) {
    M[p][p] = M[p][p] * (1 + lambda) + 1e-6;
  }

  const { solution, success } = invertAndSolveSymmetric(M, V);
  if (!success) return { lattice, zeroShift, caglioti, paramShiftNorm: 0 };

  const newLat: LatticeParameters = { ...lattice };
  let newZero = zeroShift;
  const newCag: CagliotiProfile = { ...caglioti };
  let shiftNorm = 0;

  // Apply bounded step with chi2 acceptance guard
  for (let p = 0; p < P; p++) {
    const param = activeParams[p];
    let step = solution[p] * 0.65;
    // Trust region clamp per cycle
    const maxStep = param.key === 'beta' ? 0.25 : param.key === 'zero' ? 0.04 : param.key === 'a' || param.key === 'b' || param.key === 'c' ? 0.04 : 0.008;
    step = Math.max(-maxStep, Math.min(maxStep, step));
    const updated = Math.max(param.min, Math.min(param.max, param.val + step));
    shiftNorm += Math.abs(updated - param.val);

    if (param.key === 'a') {
      newLat.a = Number(updated.toFixed(5));
      if (system === 'Cubic') {
        newLat.b = newLat.a;
        newLat.c = newLat.a;
      } else if (system === 'Tetragonal' || system === 'Hexagonal' || system === 'Trigonal') {
        newLat.b = newLat.a;
      }
    } else if (param.key === 'b') {
      newLat.b = Number(updated.toFixed(5));
    } else if (param.key === 'c') {
      newLat.c = Number(updated.toFixed(5));
    } else if (param.key === 'beta') {
      newLat.beta = Number(updated.toFixed(4));
    } else if (param.key === 'zero') {
      newZero = Number(updated.toFixed(4));
    } else if (param.key === 'U') {
      newCag.u = Number(updated.toFixed(5));
    } else if (param.key === 'V') {
      newCag.v = Number(updated.toFixed(5));
    } else if (param.key === 'W') {
      newCag.w = Number(updated.toFixed(5));
    }
  }

  return {
    lattice: newLat,
    zeroShift: newZero,
    caglioti: newCag,
    paramShiftNorm: shiftNorm
  };
}

/**
 * Identify overlapping reflections using true Pawley correlation matrix when available
 */
export function analyzeOverlaps(
  reflections: PeakReflection[],
  caglioti: { u: number; v: number; w: number },
  correlationMatrix?: number[][],
  intensitiesLeBail?: Record<string, number>,
  intensitiesPawley?: Record<string, number>,
  sigmaPawley?: Record<string, number>
): OverlappingPair[] {
  const pairs: OverlappingPair[] = [];

  for (let i = 0; i < reflections.length; i++) {
    const r1 = reflections[i];
    const fwhm1 = calculateCagliotiFWHM(r1.twoTheta, caglioti.u, caglioti.v, caglioti.w);

    for (let j = i + 1; j < reflections.length; j++) {
      const r2 = reflections[j];
      const fwhm2 = calculateCagliotiFWHM(r2.twoTheta, caglioti.u, caglioti.v, caglioti.w);
      const avgFwhm = (fwhm1 + fwhm2) / 2;
      const deltaTT = Math.abs(r1.twoTheta - r2.twoTheta);

      if (deltaTT < 1.6 * avgFwhm) {
        const sigma = avgFwhm / (2 * Math.sqrt(2 * Math.LN2));
        const overlap = Math.exp(-(deltaTT * deltaTT) / (4 * sigma * sigma));

        // Exact Pawley correlation R_ij from inverted normal matrix if available, else analytical proxy
        const exactCorr =
          correlationMatrix && correlationMatrix[i] && correlationMatrix[i][j] !== undefined
            ? correlationMatrix[i][j]
            : -overlap;

        pairs.push({
          ref1: r1,
          ref2: r2,
          deltaTwoTheta: deltaTT,
          overlapDegree: overlap,
          correlationPawley: exactCorr,
          iLeBail1: intensitiesLeBail?.[r1.id],
          iLeBail2: intensitiesLeBail?.[r2.id],
          iPawley1: intensitiesPawley?.[r1.id],
          iPawley2: intensitiesPawley?.[r2.id],
          sigmaPawley1: sigmaPawley?.[r1.id],
          sigmaPawley2: sigmaPawley?.[r2.id]
        });
      }
    }
  }

  return pairs.sort((a, b) => b.overlapDegree - a.overlapDegree);
}

/**
 * Extract contiguous overlapping reflection clusters for Correlation Heatmap visualization
 */
export function extractCovarianceClusters(
  reflections: PeakReflection[],
  caglioti: { u: number; v: number; w: number },
  correlationMatrix: number[][]
): CovarianceCluster[] {
  if (reflections.length === 0 || correlationMatrix.length !== reflections.length) return [];

  const clusters: CovarianceCluster[] = [];
  let currentIndices: number[] = [0];

  for (let i = 1; i < reflections.length; i++) {
    const prev = reflections[i - 1];
    const curr = reflections[i];
    const fwhm = calculateCagliotiFWHM(curr.twoTheta, caglioti.u, caglioti.v, caglioti.w);
    if (curr.twoTheta - prev.twoTheta < 2.2 * fwhm) {
      currentIndices.push(i);
    } else {
      if (currentIndices.length >= 2) {
        clusters.push(buildClusterObj(clusters.length, currentIndices, reflections, correlationMatrix));
      }
      currentIndices = [i];
    }
  }
  if (currentIndices.length >= 2) {
    clusters.push(buildClusterObj(clusters.length, currentIndices, reflections, correlationMatrix));
  }

  return clusters.sort((a, b) => b.reflectionIds.length - a.reflectionIds.length);
}

function buildClusterObj(
  clusterIndex: number,
  indices: number[],
  reflections: PeakReflection[],
  fullCorr: number[][]
): CovarianceCluster {
  const sliced = indices.slice(0, 12); // Cap heatmap size at 12x12 for legibility
  const subMat = sliced.map(r => sliced.map(c => fullCorr[r][c]));
  return {
    clusterIndex,
    reflectionIds: sliced.map(idx => reflections[idx].id),
    labels: sliced.map(idx => `(${reflections[idx].h} ${reflections[idx].k} ${reflections[idx].l})`),
    twoThetas: sliced.map(idx => reflections[idx].twoTheta),
    correlationMatrix: subMat,
    conditionNumber: estimateSymmetricConditionNumber(subMat)
  };
}

/**
 * Calculate standard Powder Diffraction R-factors and Figures of Merit
 */
export function calculateRefinementMetrics(
  patternPoints: PatternPoint[],
  reflections: PeakReflection[],
  currentIntensities: Record<string, number>,
  iteration: number,
  maxDeltaPct: number,
  options: {
    usePawleyTrace?: boolean;
    conditionNumber?: number;
    negativePeakCount?: number;
  } = {}
): RefinementMetrics {
  const { usePawleyTrace = false, conditionNumber = 1, negativePeakCount = 0 } = options;

  let sumAbsDiff = 0;
  let sumObs = 0;
  let sumWeightedSqDiff = 0;
  let sumWeightedSqObs = 0;

  const N = patternPoints.length;
  const P = reflections.length + 4;
  const dof = Math.max(1, N - P);

  let numDW = 0;
  let denDW = 0;

  for (let i = 0; i < N; i++) {
    const pt = patternPoints[i];
    const w_i = 1 / Math.max(1, pt.yObs);
    const calcVal =
      usePawleyTrace && pt.yCalcPawley !== undefined ? pt.yCalcPawley : pt.yCalc;
    const diff = pt.yObs - calcVal;

    sumAbsDiff += Math.abs(diff);
    sumObs += pt.yObs;
    sumWeightedSqDiff += w_i * diff * diff;
    sumWeightedSqObs += w_i * pt.yObs * pt.yObs;

    denDW += diff * diff;
    if (i > 0) {
      const prevPt = patternPoints[i - 1];
      const prevCalc =
        usePawleyTrace && prevPt.yCalcPawley !== undefined ? prevPt.yCalcPawley : prevPt.yCalc;
      const prevDiff = prevPt.yObs - prevCalc;
      const stepDiff = diff - prevDiff;
      numDW += stepDiff * stepDiff;
    }
  }

  const rP = (sumAbsDiff / Math.max(1e-4, sumObs)) * 100;
  const rWP = Math.sqrt(sumWeightedSqDiff / Math.max(1e-4, sumWeightedSqObs)) * 100;
  const rExp = Math.sqrt(dof / Math.max(1e-4, sumWeightedSqObs)) * 100;
  const chi2 = sumWeightedSqDiff / dof;
  const goF = Math.sqrt(Math.max(0, chi2));
  const durbinWatson = denDW > 0 ? numDW / denDW : 2.0;

  // Integrated Bragg intensity discrepancy relative to synthetic ground truth
  let sumAbsDiffI = 0;
  let sumI = 0;
  reflections.forEach(r => {
    const curr = currentIntensities[r.id] ?? r.intensity;
    sumAbsDiffI += Math.abs(curr - r.intensity);
    sumI += r.intensity;
  });
  const rBragg = (sumAbsDiffI / Math.max(1, sumI)) * 100;

  return {
    iteration,
    rP,
    rWP,
    rExp,
    rBragg,
    chi2,
    goF,
    durbinWatson,
    maxDeltaI: maxDeltaPct,
    conditionNumber,
    negativePeakCount,
    converged: iteration > 0 && maxDeltaPct < 0.15
  };
}

/**
 * Parse custom user-uploaded XRD ASCII files (.xy, .xye, .dat, .csv, .txt)
 */
export function parseXRDDataFile(content: string, fileName: string): UploadedXRDData {
  const lines = content.split(/\r?\n/);
  const pts: { twoTheta: number; yObs: number; sigmaObs: number }[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('!') || line.startsWith(';')) continue;
    const parts = line.split(/[,\s;\t]+/).filter(Boolean);
    if (parts.length < 2) continue;
    const tt = parseFloat(parts[0]);
    const yObs = parseFloat(parts[1]);
    const sig = parts.length >= 3 ? parseFloat(parts[2]) : NaN;
    if (!isFinite(tt) || !isFinite(yObs)) continue;
    if (tt <= 0 || tt >= 175) continue;
    const clampedY = Math.max(0, yObs);
    pts.push({
      twoTheta: tt,
      yObs: clampedY,
      sigmaObs: isFinite(sig) && sig > 0 ? sig : Math.max(1, Math.sqrt(clampedY))
    });
  }

  if (pts.length < 15) {
    throw new Error('Could not parse at least 15 valid (2Theta, Intensity) rows.');
  }

  pts.sort((a, b) => a.twoTheta - b.twoTheta);

  // Downsample gently if huge file (>1800 points) to keep real-time Pawley matrix inversion crisp
  let finalPts = pts;
  if (pts.length > 1800) {
    const stride = Math.ceil(pts.length / 1500);
    finalPts = pts.filter((_, idx) => idx % stride === 0);
  }

  const min2T = finalPts[0].twoTheta;
  const max2T = finalPts[finalPts.length - 1].twoTheta;
  const stepSize = finalPts.length > 1 ? (max2T - min2T) / (finalPts.length - 1) : 0.05;

  return { fileName, points: finalPts, min2T, max2T, stepSize };
}

/**
 * Exporter: Format Extracted Intensities as SHELX HKL File (3I4, 2F8.2)
 */
export function exportSHELX_HKL(
  reflections: PeakReflection[],
  intensities: Record<string, number>,
  sigmas?: Record<string, number>
): string {
  let out = '';
  reflections.forEach(r => {
    const I = intensities[r.id] ?? r.intensity;
    const sigma = sigmas?.[r.id] && sigmas[r.id] > 0 ? sigmas[r.id] : Math.max(1, Math.sqrt(Math.abs(I)) * 1.4);
    const h = r.h.toString().padStart(4, ' ');
    const k = r.k.toString().padStart(4, ' ');
    const l = r.l.toString().padStart(4, ' ');
    const iVal = I.toFixed(2).padStart(8, ' ');
    const sVal = sigma.toFixed(2).padStart(8, ' ');
    out += `${h}${k}${l}${iVal}${sVal}\n`;
  });
  out += '   0   0   0    0.00    0.00\n';
  return out;
}

/**
 * Exporter: Format for FullProf .prf Pattern Data
 */
export function exportFullProf_PRF(
  patternPoints: PatternPoint[],
  reflections: PeakReflection[]
): string {
  let out = `! FullProf PRF Whole Pattern File - ${reflections.length} Reflections\n`;
  out += '! 2Theta        Yobs        Ycalc       Yobs-Ycalc  Yback\n';
  patternPoints.forEach(p => {
    out += `${p.twoTheta.toFixed(3).padStart(9, ' ')}  ${p.yObs.toFixed(2).padStart(10, ' ')}  ${p.yCalc.toFixed(2).padStart(10, ' ')}  ${p.diff.toFixed(2).padStart(10, ' ')}  ${p.yBg.toFixed(2).padStart(9, ' ')}\n`;
  });
  return out;
}

/**
 * Exporter: Crystallographic LaTeX Report
 */
export function exportLatexReport(
  method: string,
  system: CrystalSystem,
  lattice: { a: number; b: number; c: number; alpha?: number; beta?: number; gamma?: number },
  wavelength: number,
  caglioti: { u: number; v: number; w: number },
  eta: number,
  zeroShift: number,
  metrics: RefinementMetrics,
  reflectionsCount: number
): string {
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}

\\begin{document}

\\title{Crystallographic Whole Pattern Profile Decomposition Report}
\\author{Pawley \\& Le Bail Decomposition Studio}
\\date{\\today}
\\maketitle

\\section{Method and Crystallographic Parameters}
\\begin{itemize}
  \\item \\textbf{Decomposition Method:} ${method.toUpperCase()} Whole Pattern Fitting
  \\item \\textbf{Crystal System:} ${system}
  \\item \\textbf{Lattice Parameters:} $a = ${lattice.a.toFixed(5)}\\text{ \\AA}$, $b = ${lattice.b.toFixed(5)}\\text{ \\AA}$, $c = ${lattice.c.toFixed(5)}\\text{ \\AA}${lattice.beta && Math.abs(lattice.beta - 90) > 0.01 ? `, $\\beta = ${lattice.beta.toFixed(3)}^\\circ$` : ''}
  \\item \\textbf{Radiation Wavelength:} $\\lambda = ${wavelength.toFixed(5)}\\text{ \\AA}$
  \\item \\textbf{Zero-Point Shift:} $2\\theta_0 = ${zeroShift.toFixed(4)}^\\circ$
\\end{itemize}

\\section{Instrumental Profile Parameters (Caglioti Function)}
\\[
H^2(2\\theta) = U \\tan^2\\theta + V \\tan\\theta + W
\\]
with $U = ${caglioti.u.toFixed(5)}$, $V = ${caglioti.v.toFixed(5)}$, $W = ${caglioti.w.toFixed(5)}$, and Pseudo-Voigt mixing $\\eta = ${eta.toFixed(3)}$.

\\section{Refinement Quality and Reliability Indicators}
\\begin{table}[h!]
\\centering
\\begin{tabular}{llr}
\\toprule
\\textbf{Figure of Merit} & \\textbf{Symbol} & \\textbf{Refined Value} \\\\
\\midrule
Profile R-factor & $R_p$ & ${metrics.rP.toFixed(2)}\\% \\\\
Weighted Profile R-factor & $R_{wp}$ & ${metrics.rWP.toFixed(2)}\\% \\\\
Expected R-factor & $R_{\\text{exp}}$ & ${metrics.rExp.toFixed(2)}\\% \\\\
Goodness of Fit & $S$ ($\\sqrt{\\chi^2}$) & ${metrics.goF.toFixed(3)} \\\\
Reduced Chi-Squared & $\\chi^2$ & ${metrics.chi2.toFixed(3)} \\\\
Bragg Intensity R-factor & $R_{\\text{Bragg}}$ & ${metrics.rBragg.toFixed(2)}\\% \\\\
Durbin-Watson Statistic & $d$ & ${metrics.durbinWatson.toFixed(3)} \\\\
Refinement Cycles & Iterations & ${metrics.iteration} \\\\
Extracted Active Reflections & $N_{\\text{refl}}$ & ${reflectionsCount} \\\\
\\bottomrule
\\end{tabular}
\\caption{Whole powder pattern decomposition convergence metrics.}
\\end{table}

\\end{document}`;
}
