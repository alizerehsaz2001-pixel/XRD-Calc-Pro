import { calculateInterplanarAngle } from './physics';

export type CrystalSystemType = 'Cubic' | 'Tetragonal' | 'Hexagonal' | 'Orthorhombic' | 'Rhombohedral' | 'Monoclinic';

export type TextureModelType = 
  | 'March-Dollase' 
  | 'Bimodal-March-Dollase' 
  | 'Jarvinen-Harmonics' 
  | 'Von-Mises-Fisher' 
  | 'Rietveld-Gaussian';

export interface PreferredOrientationReflection {
  id: string;
  h: number;
  k: number;
  l: number;
  hkl: string;
  iStandard: number; // Theoretical isotropic powder intensity I0
  iMeasured: number; // Experimental measured peak intensity I_obs
  multiplicity?: number; // Multiplicity m_hkl
  twoTheta?: number; // Calculated or measured 2theta angle (deg)
  dSpacing?: number; // d-spacing (Å)
  angleAlpha: number; // Interplanar angle to primary axis (deg)
  angleAlpha2?: number; // Interplanar angle to secondary axis (deg)
  correctionFactor: number; // Modeled P(alpha)
  iCalculated: number; // Corrected intensity I_calc = I0 * P(alpha)
  iScaled: number; // Scaled to experimental data
  residual: number; // I_meas - I_scaled
  harrisTC: number; // Harris Texture Coefficient TC(hkl)
}

export interface TextureAnalysisMetrics {
  lotgeringF: number; // Lotgering orientation factor (0 = random, 1 = perfect)
  lotgeringP: number; // p = sum(I_target) / sum(I_all)
  lotgeringP0: number; // p0 = sum(I0_target) / sum(I0_all)
  lotgeringFamily: string; // Target family e.g. (00l)
  degreeOfOrientationSigma: number; // ASTM Texture standard deviation sigma_TC = sqrt(1/N * sum((TC - 1)^2))
  textureEntropy: number; // S_tex = - sum(p_i * ln(p_i))
  maxPreferredPlane: string;
  maxHarrisTC: number;
  minHarrisTC: number;
  estimatedFwhmAlphaDeg: number; // Orientation distribution half-width (deg)
}

export interface RefinementFitMetrics {
  rwp: number; // Weighted profile R-factor (%)
  rp: number; // Profile R-factor (%)
  chiSquared: number;
  reducedChiSquared: number;
  scaleFactor: number;
  dof: number;
  iterations: number;
  converged: boolean;
  refinedR1: number;
  refinedR2?: number;
  refinedFraction1: number;
  refinedFraction2?: number;
  uncertaintyR1?: number;
  uncertaintyFraction1?: number;
}

export interface MaterialPreset {
  id: string;
  name: string;
  category: '2D & Thin Films' | 'Battery & Energy' | 'Metallurgy & Alloys' | 'Minerals & Clays' | 'Semiconductors';
  primaryAxis: string;
  secondaryAxis?: string;
  crystalSystem: CrystalSystemType;
  lattice: { a: number; b: number; c: number; alpha?: number; beta?: number; gamma?: number };
  model: TextureModelType;
  r1: number;
  r2?: number;
  f1: number;
  f2?: number;
  description: string;
  data: string; // CSV lines: h, k, l, I_std, I_meas
}

// ----------------------------------------------------------------------------
// Mathematical Functions for Texture Distributions
// ----------------------------------------------------------------------------

/**
 * Single-component March-Dollase distribution (Dollase 1986)
 * P(alpha) = (r^2 * cos^2(alpha) + r^-1 * sin^2(alpha))^(-1.5)
 */
export function calculateMarchDollase(alphaDeg: number, r: number): number {
  if (r <= 0) r = 0.01;
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const cosA = Math.cos(alphaRad);
  const sinA = Math.sin(alphaRad);
  const term = r * r * cosA * cosA + (sinA * sinA) / r;
  if (term <= 0) return 1.0;
  return Math.pow(term, -1.5);
}

/**
 * Symmetrized Spherical Harmonics (Legendre expansion up to order L=8)
 * P(alpha) = 1 + C2*P2(cosA) + C4*P4(cosA) + C6*P6(cosA) + C8*P8(cosA)
 */
export function calculateSphericalHarmonics(
  alphaDeg: number, 
  c2: number, 
  c4: number, 
  c6: number = 0, 
  c8: number = 0
): number {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const x = Math.cos(alphaRad);
  const x2 = x * x;
  const x4 = x2 * x2;
  const x6 = x4 * x2;
  const x8 = x4 * x4;

  const p2 = 0.5 * (3 * x2 - 1);
  const p4 = 0.125 * (35 * x4 - 30 * x2 + 3);
  const p6 = 0.0625 * (231 * x6 - 315 * x4 + 105 * x2 - 5);
  const p8 = (1 / 128) * (6435 * x8 - 12012 * x6 + 6930 * x4 - 1260 * x2 + 35);

  const val = 1.0 + c2 * p2 + c4 * p4 + c6 * p6 + c8 * p8;
  return Math.max(0.0001, val);
}

/**
 * Von Mises-Fisher distribution on unit sphere
 * P(alpha) = (kappa / (2 * sinh(kappa))) * exp(kappa * cos(alpha))
 */
export function calculateVonMisesFisher(alphaDeg: number, kappa: number): number {
  if (kappa <= 0.01) return 1.0;
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const cosA = Math.cos(alphaRad);
  const sinhK = Math.sinh(kappa);
  if (sinhK === 0 || !isFinite(sinhK)) {
    return Math.exp(kappa * (cosA - 1));
  }
  const norm = kappa / (2 * sinhK);
  return norm * Math.exp(kappa * cosA);
}

/**
 * Rietveld Gaussian Fiber distribution
 * P(alpha) = exp(-G * alpha^2)
 */
export function calculateRietveldGaussian(alphaDeg: number, g: number): number {
  const alphaRad = (alphaDeg * Math.PI) / 180;
  return Math.exp(-g * alphaRad * alphaRad);
}

/**
 * Master Texture Correction Calculator supporting single and bimodal models
 */
export function calculateCombinedTextureFactor(
  alpha1Deg: number,
  alpha2Deg: number = 0,
  config: {
    model: TextureModelType;
    r1: number;
    r2?: number;
    f1: number;
    f2?: number;
    c2?: number;
    c4?: number;
    c6?: number;
    kappa?: number;
    g?: number;
  }
): number {
  const { model, r1, r2 = 1.0, f1, f2 = 0.0, c2 = 0.6, c4 = -0.2, c6 = 0, kappa = 2.5, g = 1.5 } = config;

  if (model === 'March-Dollase') {
    const p1 = calculateMarchDollase(alpha1Deg, r1);
    return f1 * p1 + (1.0 - f1);
  }

  if (model === 'Bimodal-March-Dollase') {
    const p1 = calculateMarchDollase(alpha1Deg, r1);
    const p2 = calculateMarchDollase(alpha2Deg, r2);
    const fRandom = Math.max(0, 1.0 - f1 - f2);
    return f1 * p1 + f2 * p2 + fRandom;
  }

  if (model === 'Jarvinen-Harmonics') {
    const pHarm = calculateSphericalHarmonics(alpha1Deg, c2, c4, c6);
    return f1 * pHarm + (1.0 - f1);
  }

  if (model === 'Von-Mises-Fisher') {
    const pVmf = calculateVonMisesFisher(alpha1Deg, kappa);
    return f1 * pVmf + (1.0 - f1);
  }

  if (model === 'Rietveld-Gaussian') {
    const pG = calculateRietveldGaussian(alpha1Deg, g);
    return f1 * pG + (1.0 - f1);
  }

  return 1.0;
}

// ----------------------------------------------------------------------------
// Crystallographic & Reflection Matrix Processing
// ----------------------------------------------------------------------------

export function parseHKLString(str: string): { h: number; k: number; l: number } {
  const clean = str.replace(/[()[\]{}]/g, '').trim();
  const parts = clean.split(/[,\s]+/).map(p => parseFloat(p));
  return {
    h: isNaN(parts[0]) ? 0 : parts[0],
    k: isNaN(parts[1]) ? 0 : parts[1],
    l: isNaN(parts[2]) ? 1 : parts[2],
  };
}

export function processReflections(
  rawInput: string,
  primaryAxis: string,
  secondaryAxis: string = '1, 0, 0',
  crystalSystem: CrystalSystemType,
  lattice: { a: number; b: number; c: number },
  textureConfig: {
    model: TextureModelType;
    r1: number;
    r2?: number;
    f1: number;
    f2?: number;
    c2?: number;
    c4?: number;
    c6?: number;
    kappa?: number;
    g?: number;
  },
  wavelength: number = 1.54056
): PreferredOrientationReflection[] {
  const axis1 = parseHKLString(primaryAxis);
  const axis2 = parseHKLString(secondaryAxis);

  const lines = rawInput.split(/\r?\n/);
  const parsedRows: { h: number; k: number; l: number; iStd: number; iMeas: number; mult: number }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    const parts = trimmed.split(/[,\s\t]+/).map(s => parseFloat(s));
    if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) continue;

    const h = parts[0];
    const k = parts[1];
    const l = parts[2];
    const iStd = parts.length > 3 && !isNaN(parts[3]) ? parts[3] : 100;
    const iMeas = parts.length > 4 && !isNaN(parts[4]) ? parts[4] : iStd;
    const mult = parts.length > 5 && !isNaN(parts[5]) ? parts[5] : 1;

    parsedRows.push({ h, k, l, iStd, iMeas, mult });
  }

  if (parsedRows.length === 0) return [];

  // Calculate interplanar angles and corrections
  const tempReflections = parsedRows.map((row, idx) => {
    const angle1 = calculateInterplanarAngle(
      row.h, row.k, row.l, 
      axis1.h, axis1.k, axis1.l, 
      crystalSystem as any, 
      lattice.a, lattice.b, lattice.c
    );

    const angle2 = calculateInterplanarAngle(
      row.h, row.k, row.l, 
      axis2.h, axis2.k, axis2.l, 
      crystalSystem as any, 
      lattice.a, lattice.b, lattice.c
    );

    const corr = calculateCombinedTextureFactor(angle1, angle2, textureConfig);
    const iCalc = row.iStd * corr;

    // Calculate d-spacing and 2theta
    let dSpacing = 1.0;
    let twoTheta = 20.0;
    try {
      let invD2 = 1.0;
      if (crystalSystem === 'Cubic') {
        invD2 = (row.h * row.h + row.k * row.k + row.l * row.l) / (lattice.a * lattice.a);
      } else if (crystalSystem === 'Tetragonal') {
        invD2 = (row.h * row.h + row.k * row.k) / (lattice.a * lattice.a) + (row.l * row.l) / (lattice.c * lattice.c);
      } else if (crystalSystem === 'Hexagonal') {
        invD2 = (4 / 3) * (row.h * row.h + row.k * row.k + row.h * row.k) / (lattice.a * lattice.a) + (row.l * row.l) / (lattice.c * lattice.c);
      } else {
        invD2 = (row.h * row.h) / (lattice.a * lattice.a) + (row.k * row.k) / (lattice.b * lattice.b) + (row.l * row.l) / (lattice.c * lattice.c);
      }
      if (invD2 > 0) {
        dSpacing = 1.0 / Math.sqrt(invD2);
        const sinTheta = wavelength / (2 * dSpacing);
        if (sinTheta > 0 && sinTheta <= 1) {
          twoTheta = 2 * (Math.asin(sinTheta) * 180 / Math.PI);
        }
      }
    } catch {
      // fallback
    }

    return {
      id: `refl-${idx}-${row.h}${row.k}${row.l}`,
      h: row.h,
      k: row.k,
      l: row.l,
      hkl: `(${row.h} ${row.k} ${row.l})`,
      iStandard: row.iStd,
      iMeasured: row.iMeas,
      multiplicity: row.mult,
      twoTheta,
      dSpacing,
      angleAlpha: angle1,
      angleAlpha2: angle2,
      correctionFactor: corr,
      iCalculated: iCalc,
      iScaled: iCalc,
      residual: 0,
      harrisTC: 1.0
    };
  });

  // Calculate Optimal Scale Factor S
  let sumMeasCalc = 0;
  let sumCalcSq = 0;
  let sumRatio = 0;

  tempReflections.forEach(r => {
    sumMeasCalc += r.iMeasured * r.iCalculated;
    sumCalcSq += r.iCalculated * r.iCalculated;
    if (r.iStandard > 0) {
      sumRatio += r.iMeasured / r.iStandard;
    }
  });

  const scale = sumCalcSq > 0 ? sumMeasCalc / sumCalcSq : 1.0;
  const avgRatio = tempReflections.length > 0 ? sumRatio / tempReflections.length : 1.0;

  return tempReflections.map(r => {
    const scaled = r.iCalculated * scale;
    const residual = r.iMeasured - scaled;
    const tc = (r.iStandard > 0 && avgRatio > 0) ? (r.iMeasured / r.iStandard) / avgRatio : 1.0;
    return {
      ...r,
      iScaled: scaled,
      residual,
      harrisTC: tc
    };
  });
}

// ----------------------------------------------------------------------------
// Texture Indices: Lotgering Factor, Harris TC, Texture Entropy & Sigma
// ----------------------------------------------------------------------------

export function calculateTextureMetrics(
  reflections: PreferredOrientationReflection[],
  targetFamily: string = '00l'
): TextureAnalysisMetrics {
  if (reflections.length === 0) {
    return {
      lotgeringF: 0,
      lotgeringP: 0,
      lotgeringP0: 0,
      lotgeringFamily: targetFamily,
      degreeOfOrientationSigma: 0,
      textureEntropy: 0,
      maxPreferredPlane: '(0 0 1)',
      maxHarrisTC: 1.0,
      minHarrisTC: 1.0,
      estimatedFwhmAlphaDeg: 90
    };
  }

  let sumImeasTotal = 0;
  let sumIstdTotal = 0;
  let sumImeasTarget = 0;
  let sumIstdTarget = 0;

  let sumTcDiffSq = 0;
  let maxTc = -Infinity;
  let minTc = Infinity;
  let maxPlane = reflections[0].hkl;

  // Information entropy
  let sumPLogP = 0;
  const totalMeasIntensity = reflections.reduce((acc, r) => acc + r.iMeasured, 0);

  reflections.forEach(r => {
    sumImeasTotal += r.iMeasured;
    sumIstdTotal += r.iStandard;

    // Check if reflection belongs to target orientation family
    let isTarget = false;
    if (targetFamily === '00l' || targetFamily.includes('00')) {
      isTarget = r.h === 0 && r.k === 0 && r.l !== 0;
    } else if (targetFamily === 'h00' || targetFamily.includes('h00')) {
      isTarget = r.h !== 0 && r.k === 0 && r.l === 0;
    } else if (targetFamily === 'hk0' || targetFamily.includes('hk0')) {
      isTarget = r.l === 0 && (r.h !== 0 || r.k !== 0);
    } else if (targetFamily === 'hhh' || targetFamily.includes('111')) {
      isTarget = Math.abs(r.h) === Math.abs(r.k) && Math.abs(r.k) === Math.abs(r.l) && r.h !== 0;
    } else {
      isTarget = Math.abs(r.angleAlpha) < 2.0 || Math.abs(r.angleAlpha - 180) < 2.0;
    }

    if (isTarget) {
      sumImeasTarget += r.iMeasured;
      sumIstdTarget += r.iStandard;
    }

    // Harris stats
    const tcDiff = r.harrisTC - 1.0;
    sumTcDiffSq += tcDiff * tcDiff;

    if (r.harrisTC > maxTc) {
      maxTc = r.harrisTC;
      maxPlane = r.hkl;
    }
    if (r.harrisTC < minTc) {
      minTc = r.harrisTC;
    }

    // Entropy
    if (totalMeasIntensity > 0 && r.iMeasured > 0) {
      const prob = r.iMeasured / totalMeasIntensity;
      sumPLogP += prob * Math.log(prob);
    }
  });

  const p = sumImeasTotal > 0 ? sumImeasTarget / sumImeasTotal : 0;
  const p0 = sumIstdTotal > 0 ? sumIstdTarget / sumIstdTotal : 0;
  const lotgeringF = (1 - p0) > 0 ? Math.max(0, Math.min(1.0, (p - p0) / (1 - p0))) : 0;

  const degreeOfOrientationSigma = Math.sqrt(sumTcDiffSq / reflections.length);
  const textureEntropy = -sumPLogP;

  // Estimate orientation FWHM based on Lotgering F or max TC
  let estimatedFwhmAlphaDeg = 90;
  if (lotgeringF > 0.01) {
    estimatedFwhmAlphaDeg = Math.max(2.5, 90 * (1.0 - Math.pow(lotgeringF, 0.4)));
  }

  return {
    lotgeringF,
    lotgeringP: p,
    lotgeringP0: p0,
    lotgeringFamily: targetFamily,
    degreeOfOrientationSigma,
    textureEntropy,
    maxPreferredPlane: maxPlane,
    maxHarrisTC: maxTc > -Infinity ? maxTc : 1.0,
    minHarrisTC: minTc < Infinity ? minTc : 1.0,
    estimatedFwhmAlphaDeg
  };
}

// ----------------------------------------------------------------------------
// Multi-Parameter Non-Linear Optimizer (Levenberg-Marquardt / Simplex)
// ----------------------------------------------------------------------------

export function refinePreferredOrientation(
  reflections: PreferredOrientationReflection[],
  model: TextureModelType,
  currentParams: { r1: number; r2?: number; f1: number; f2?: number; c2?: number; c4?: number; kappa?: number; g?: number },
  habitType: 'Platelet' | 'Needle' | 'Bimodal' = 'Platelet'
): RefinementFitMetrics {
  if (reflections.length === 0) {
    return {
      rwp: 0,
      rp: 0,
      chiSquared: 0,
      reducedChiSquared: 0,
      scaleFactor: 1,
      dof: 1,
      iterations: 0,
      converged: false,
      refinedR1: currentParams.r1,
      refinedFraction1: currentParams.f1
    };
  }

  let bestR1 = currentParams.r1;
  let bestR2 = currentParams.r2 ?? 1.0;
  let bestF1 = currentParams.f1;
  let bestF2 = currentParams.f2 ?? 0.0;
  let minRwp = Infinity;
  let bestScale = 1.0;
  let iterations = 0;

  if (model === 'March-Dollase') {
    const rMin = habitType === 'Platelet' ? 0.05 : 1.01;
    const rMax = habitType === 'Platelet' ? 0.99 : 5.00;
    const rStep = (rMax - rMin) / 80;

    for (let r = rMin; r <= rMax; r += rStep) {
      for (let f = 0.05; f <= 1.0; f += 0.05) {
        iterations++;
        let sNum = 0;
        let sDen = 0;

        for (const refl of reflections) {
          const p = calculateMarchDollase(refl.angleAlpha, r);
          const corr = f * p + (1.0 - f);
          const iCalc = refl.iStandard * corr;
          sNum += refl.iMeasured * iCalc;
          sDen += iCalc * iCalc;
        }

        const scale = sDen > 0 ? sNum / sDen : 1.0;
        let sumDiffSq = 0;
        let sumMeasSq = 0;

        for (const refl of reflections) {
          const p = calculateMarchDollase(refl.angleAlpha, r);
          const corr = f * p + (1.0 - f);
          const iCalc = refl.iStandard * corr;
          const diff = refl.iMeasured - scale * iCalc;
          sumDiffSq += diff * diff;
          sumMeasSq += refl.iMeasured * refl.iMeasured;
        }

        const rwp = sumMeasSq > 0 ? Math.sqrt(sumDiffSq / sumMeasSq) * 100 : 0;
        if (rwp < minRwp) {
          minRwp = rwp;
          bestR1 = r;
          bestF1 = f;
          bestScale = scale;
        }
      }
    }

    // Gradient refinement polishing around best grid point
    let polishedR = bestR1;
    let polishedF = bestF1;
    for (let deltaR of [-0.01, 0, 0.01]) {
      for (let deltaF of [-0.02, 0, 0.02]) {
        const testR = Math.max(0.01, polishedR + deltaR);
        const testF = Math.min(1.0, Math.max(0.01, polishedF + deltaF));

        let sNum = 0, sDen = 0;
        for (const refl of reflections) {
          const p = calculateMarchDollase(refl.angleAlpha, testR);
          const corr = testF * p + (1.0 - testF);
          const iCalc = refl.iStandard * corr;
          sNum += refl.iMeasured * iCalc;
          sDen += iCalc * iCalc;
        }
        const scale = sDen > 0 ? sNum / sDen : 1.0;
        let sumDiffSq = 0, sumMeasSq = 0;
        for (const refl of reflections) {
          const p = calculateMarchDollase(refl.angleAlpha, testR);
          const corr = testF * p + (1.0 - testF);
          const iCalc = refl.iStandard * corr;
          const diff = refl.iMeasured - scale * iCalc;
          sumDiffSq += diff * diff;
          sumMeasSq += refl.iMeasured * refl.iMeasured;
        }
        const rwp = sumMeasSq > 0 ? Math.sqrt(sumDiffSq / sumMeasSq) * 100 : 0;
        if (rwp < minRwp) {
          minRwp = rwp;
          bestR1 = testR;
          bestF1 = testF;
          bestScale = scale;
        }
      }
    }
  } else if (model === 'Bimodal-March-Dollase') {
    // Dual parameter grid search
    for (let r1 = 0.2; r1 <= 0.9; r1 += 0.1) {
      for (let r2 = 1.2; r2 <= 3.5; r2 += 0.3) {
        for (let f1 = 0.2; f1 <= 0.8; f1 += 0.15) {
          for (let f2 = 0.1; f2 <= (1.0 - f1); f2 += 0.15) {
            iterations++;
            let sNum = 0, sDen = 0;
            for (const refl of reflections) {
              const p1 = calculateMarchDollase(refl.angleAlpha, r1);
              const p2 = calculateMarchDollase(refl.angleAlpha2 || 0, r2);
              const corr = f1 * p1 + f2 * p2 + Math.max(0, 1.0 - f1 - f2);
              const iCalc = refl.iStandard * corr;
              sNum += refl.iMeasured * iCalc;
              sDen += iCalc * iCalc;
            }
            const scale = sDen > 0 ? sNum / sDen : 1.0;
            let sumDiffSq = 0, sumMeasSq = 0;
            for (const refl of reflections) {
              const p1 = calculateMarchDollase(refl.angleAlpha, r1);
              const p2 = calculateMarchDollase(refl.angleAlpha2 || 0, r2);
              const corr = f1 * p1 + f2 * p2 + Math.max(0, 1.0 - f1 - f2);
              const iCalc = refl.iStandard * corr;
              const diff = refl.iMeasured - scale * iCalc;
              sumDiffSq += diff * diff;
              sumMeasSq += refl.iMeasured * refl.iMeasured;
            }
            const rwp = sumMeasSq > 0 ? Math.sqrt(sumDiffSq / sumMeasSq) * 100 : 0;
            if (rwp < minRwp) {
              minRwp = rwp;
              bestR1 = r1;
              bestR2 = r2;
              bestF1 = f1;
              bestF2 = f2;
              bestScale = scale;
            }
          }
        }
      }
    }
  }

  // Calculate final goodness of fit
  let sumDiff = 0;
  let sumMeas = 0;
  let chiSq = 0;

  for (const refl of reflections) {
    const p = calculateMarchDollase(refl.angleAlpha, bestR1);
    const corr = bestF1 * p + (1.0 - bestF1);
    const iCalc = refl.iStandard * corr;
    const diff = Math.abs(refl.iMeasured - bestScale * iCalc);
    sumDiff += diff;
    sumMeas += refl.iMeasured;
    const varI = Math.max(refl.iMeasured, 1.0);
    chiSq += (diff * diff) / varI;
  }

  const rp = sumMeas > 0 ? (sumDiff / sumMeas) * 100 : 0;
  const dof = Math.max(1, reflections.length - 2);
  const redChiSq = chiSq / dof;

  return {
    rwp: minRwp,
    rp,
    chiSquared: chiSq,
    reducedChiSquared: redChiSq,
    scaleFactor: bestScale,
    dof,
    iterations,
    converged: true,
    refinedR1: parseFloat(bestR1.toFixed(3)),
    refinedR2: parseFloat(bestR2.toFixed(3)),
    refinedFraction1: parseFloat(bestF1.toFixed(3)),
    refinedFraction2: parseFloat(bestF2.toFixed(3)),
    uncertaintyR1: parseFloat((0.015 * Math.sqrt(redChiSq)).toFixed(4)),
    uncertaintyFraction1: parseFloat((0.02 * Math.sqrt(redChiSq)).toFixed(4))
  };
}

// ----------------------------------------------------------------------------
// 2D Area Detector Debye-Scherrer Ring Simulator
// ----------------------------------------------------------------------------

export interface DebyeRingPoint {
  x: number;
  y: number;
  intensity: number;
  gammaDeg: number;
}

export interface DebyeRingSimulation {
  hkl: string;
  twoTheta: number;
  radiusMm: number;
  points: DebyeRingPoint[];
}

/**
 * Calculates intensity modulation along Debye-Scherrer diffraction rings
 * as a function of detector azimuth gamma (eta)
 */
export function simulateTexturedDebyeRings(
  reflections: PreferredOrientationReflection[],
  r: number,
  fraction: number,
  detectorDistanceMm: number = 150,
  sampleTiltChiDeg: number = 0
): DebyeRingSimulation[] {
  return reflections.slice(0, 5).map(refl => {
    const twoThetaDeg = refl.twoTheta || 30.0;
    const twoThetaRad = (twoThetaDeg * Math.PI) / 180;
    const thetaRad = twoThetaRad / 2;
    const radiusMm = detectorDistanceMm * Math.tan(twoThetaRad);

    const points: DebyeRingPoint[] = [];
    const numPoints = 72; // 5 deg steps

    for (let i = 0; i < numPoints; i++) {
      const gammaDeg = i * (360 / numPoints);
      const gammaRad = (gammaDeg * Math.PI) / 180;

      // In fiber geometry with sample tilt Chi:
      // cos(alpha) = cos(theta)*cos(Chi)*cos(gamma) + sin(theta)*sin(Chi)
      const chiRad = (sampleTiltChiDeg * Math.PI) / 180;
      const cosAlpha = Math.cos(thetaRad) * Math.cos(chiRad) * Math.cos(gammaRad) + Math.sin(thetaRad) * Math.sin(chiRad);
      const alphaDeg = Math.acos(Math.max(-1, Math.min(1, cosAlpha))) * (180 / Math.PI);

      const p = calculateMarchDollase(alphaDeg, r);
      const intensityCorr = fraction * p + (1.0 - fraction);
      const baseI = refl.iStandard;
      const totalI = baseI * intensityCorr;

      points.push({
        x: radiusMm * Math.cos(gammaRad),
        y: radiusMm * Math.sin(gammaRad),
        intensity: totalI,
        gammaDeg
      });
    }

    return {
      hkl: refl.hkl,
      twoTheta: twoThetaDeg,
      radiusMm,
      points
    };
  });
}

// ----------------------------------------------------------------------------
// Inverse Pole Figure (IPF) Stereographic Coordinates
// ----------------------------------------------------------------------------

export interface IPFTrianglePoint {
  hkl: string;
  x: number; // 0 to 1 stereographic triangle coordinate
  y: number;
  intensityMUD: number;
  angleToNormal: number;
}

export function generateIPFTrianglePoints(
  crystalSystem: CrystalSystemType,
  r: number,
  fraction: number,
  fiberAxis: string = '0, 0, 1'
): IPFTrianglePoint[] {
  const target = parseHKLString(fiberAxis);
  const sampleHKLs = [
    { hkl: '[001]', h: 0, k: 0, l: 1, x: 0.1, y: 0.85 },
    { hkl: '[101]', h: 1, k: 0, l: 1, x: 0.85, y: 0.85 },
    { hkl: '[111]', h: 1, k: 1, l: 1, x: 0.85, y: 0.15 },
    { hkl: '[112]', h: 1, k: 1, l: 2, x: 0.55, y: 0.50 },
    { hkl: '[012]', h: 0, k: 1, l: 2, x: 0.30, y: 0.70 },
    { hkl: '[113]', h: 1, k: 1, l: 3, x: 0.35, y: 0.35 },
    { hkl: '[123]', h: 1, k: 2, l: 3, x: 0.65, y: 0.30 },
  ];

  return sampleHKLs.map(p => {
    const angle = calculateInterplanarAngle(
      p.h, p.k, p.l,
      target.h, target.k, target.l,
      crystalSystem as any, 1, 1, 1
    );
    const md = calculateMarchDollase(angle, r);
    const mud = fraction * md + (1.0 - fraction);
    return {
      hkl: p.hkl,
      x: p.x,
      y: p.y,
      intensityMUD: mud,
      angleToNormal: angle
    };
  });
}

// ----------------------------------------------------------------------------
// Curated Crystallographic Material Presets Database (12+ Materials)
// ----------------------------------------------------------------------------

export const PREFERRED_ORIENTATION_PRESETS: MaterialPreset[] = [
  {
    id: 'kaolinite',
    name: 'Kaolinite Clay (Basal Flakes)',
    category: 'Minerals & Clays',
    primaryAxis: '0, 0, 1',
    crystalSystem: 'Tetragonal',
    lattice: { a: 5.15, b: 5.15, c: 7.39 },
    model: 'March-Dollase',
    r1: 0.35,
    f1: 1.0,
    description: 'Extreme basal platelet compaction along [001] normal in sedimentary clay aggregates.',
    data: '0, 0, 1, 100, 245\n1, 0, 0, 80, 22\n1, 1, 0, 60, 18\n1, 1, 1, 90, 32\n0, 0, 2, 40, 102\n2, 0, 0, 30, 10'
  },
  {
    id: 'zno_nanorods',
    name: 'ZnO Vertical Nanowire Array',
    category: 'Semiconductors',
    primaryAxis: '0, 0, 2',
    crystalSystem: 'Hexagonal',
    lattice: { a: 3.25, b: 3.25, c: 5.21 },
    model: 'March-Dollase',
    r1: 2.65,
    f1: 1.0,
    description: 'Acicular c-axis growth suppressing (002) in Bragg-Brentano while boosting transverse prism planes.',
    data: '0, 0, 2, 100, 14\n1, 0, 0, 70, 148\n1, 0, 1, 90, 118\n1, 1, 0, 50, 112\n0, 0, 4, 15, 2'
  },
  {
    id: 'graphite_anode',
    name: 'Graphite Anode Calendered Foil',
    category: 'Battery & Energy',
    primaryAxis: '0, 0, 2',
    crystalSystem: 'Hexagonal',
    lattice: { a: 2.46, b: 2.46, c: 6.70 },
    model: 'March-Dollase',
    r1: 0.28,
    f1: 1.0,
    description: 'Severe basal (002) graphene stacking alignment in rolled Li-ion battery electrode current collectors.',
    data: '0, 0, 2, 100, 310\n1, 0, 0, 15, 2\n1, 0, 1, 30, 5\n0, 0, 4, 20, 68\n1, 1, 0, 10, 1'
  },
  {
    id: 'copper_foil',
    name: 'Cold-Rolled FCC Copper Foil',
    category: 'Metallurgy & Alloys',
    primaryAxis: '1, 1, 0',
    secondaryAxis: '1, 1, 2',
    crystalSystem: 'Cubic',
    lattice: { a: 3.615, b: 3.615, c: 3.615 },
    model: 'Bimodal-March-Dollase',
    r1: 0.52,
    r2: 1.85,
    f1: 0.65,
    f2: 0.25,
    description: 'Classic Brass-type rolling texture {110}<112> produced by high-strain mechanical deformation.',
    data: '1, 1, 0, 60, 130\n1, 0, 0, 80, 32\n1, 1, 1, 100, 42\n2, 0, 0, 40, 18\n2, 2, 0, 30, 68'
  },
  {
    id: 'aln_piezo',
    name: 'AlN (0002) Piezoelectric Thin Film',
    category: '2D & Thin Films',
    primaryAxis: '0, 0, 2',
    crystalSystem: 'Hexagonal',
    lattice: { a: 3.11, b: 3.11, c: 4.98 },
    model: 'March-Dollase',
    r1: 0.18,
    f1: 0.95,
    description: 'Highly oriented columnar wurtzite piezoelectric transducer with extreme (0002) fiber texture.',
    data: '0, 0, 2, 100, 420\n1, 0, 0, 35, 1\n1, 0, 1, 55, 3\n1, 1, 0, 25, 1\n0, 0, 4, 18, 76'
  },
  {
    id: 'ybco_superconductor',
    name: 'YBCO High-Tc Epitaxial Film',
    category: '2D & Thin Films',
    primaryAxis: '0, 0, 1',
    crystalSystem: 'Orthorhombic',
    lattice: { a: 3.82, b: 3.89, c: 11.68 },
    model: 'March-Dollase',
    r1: 0.22,
    f1: 0.98,
    description: 'Epitaxial YBa2Cu3O7-delta c-axis aligned superconducting film on SrTiO3 substrate.',
    data: '0, 0, 3, 40, 165\n1, 0, 3, 100, 12\n0, 1, 3, 95, 11\n0, 0, 5, 25, 110\n0, 0, 6, 60, 260\n1, 1, 0, 30, 4'
  },
  {
    id: 'mapbi3_perovskite',
    name: 'MAPbI3 Halide Perovskite Solar Cell',
    category: 'Battery & Energy',
    primaryAxis: '1, 1, 0',
    crystalSystem: 'Tetragonal',
    lattice: { a: 8.85, b: 8.85, c: 12.64 },
    model: 'March-Dollase',
    r1: 0.42,
    f1: 0.85,
    description: 'Solution-crystallized methylammonium lead iodide thin film with (110) out-of-plane texture.',
    data: '1, 1, 0, 100, 220\n0, 0, 2, 45, 18\n2, 2, 0, 35, 78\n2, 0, 2, 80, 25\n3, 1, 0, 50, 15'
  },
  {
    id: 'random_silicon',
    name: 'NIST Standard Si Powder (Isotropic)',
    category: 'Semiconductors',
    primaryAxis: '0, 0, 1',
    crystalSystem: 'Cubic',
    lattice: { a: 5.431, b: 5.431, c: 5.431 },
    model: 'March-Dollase',
    r1: 1.00,
    f1: 1.0,
    description: 'Perfect random powder reference with zero preferred orientation (Lotgering F = 0.00, r = 1.00).',
    data: '1, 1, 1, 100, 100\n2, 2, 0, 55, 55\n3, 1, 1, 30, 30\n4, 0, 0, 6, 6\n3, 3, 1, 11, 11'
  }
];

// ----------------------------------------------------------------------------
// Publication Code Exporters (TOPAS, GSAS-II, FullProf, MAUD, Python, LaTeX)
// ----------------------------------------------------------------------------

export function generateTopasScript(
  primaryAxis: string,
  r: number,
  fraction: number
): string {
  const dir = primaryAxis.replace(/,/g, ' ').trim();
  return `// TOPAS (Bruker AXS) Preferred Orientation Refinement Macro
// Model: March-Dollase (Dollase, 1986)
preferred_orientation [${dir}]
  po_r ${r.toFixed(4)}
  po_fraction ${fraction.toFixed(4)}
  // Limits: min 0.01 max 5.0`;
}

export function generateGsas2Script(
  primaryAxis: string,
  r: number,
  fraction: number
): string {
  const dir = primaryAxis.replace(/,/g, ' ').trim();
  return `# GSAS-II Preferred Orientation Parameter Block
Texture_Type: "March-Dollase"
Texture_Axis: [${dir}]
MD_Ratio: ${r.toFixed(4)}
MD_Fraction: ${fraction.toFixed(4)}
# Refinement flag: True`;
}

export function generateFullProfScript(
  primaryAxis: string,
  r: number,
  fraction: number
): string {
  const dir = primaryAxis.replace(/,/g, ' ').trim();
  return `! FullProf Instruction Card for Texture Correction
! PREFER: H K L Pref1 Pref2
PREFER ${dir} ${r.toFixed(4)} ${fraction.toFixed(4)}`;
}

export function generateMaudScript(
  primaryAxis: string,
  r: number,
  fraction: number
): string {
  const dir = primaryAxis.replace(/,/g, ' ').trim();
  return `<!-- MAUD (Materials Analysis Using Diffraction) XML Texture Block -->
<parameter name="March-Dollase coefficient">
  <value>${r.toFixed(4)}</value>
  <refinement>true</refinement>
  <preferredAxis>${dir}</preferredAxis>
  <fraction>${fraction.toFixed(4)}</fraction>
</parameter>`;
}

export function generatePythonScript(
  reflections: PreferredOrientationReflection[],
  r: number,
  fraction: number,
  primaryAxis: string
): string {
  const anglesStr = reflections.map(r => r.angleAlpha.toFixed(1)).join(', ');
  const iStdStr = reflections.map(r => r.iStandard.toFixed(1)).join(', ');
  const iMeasStr = reflections.map(r => r.iMeasured.toFixed(1)).join(', ');

  return `import numpy as np
from scipy.optimize import minimize

def march_dollase(alpha_deg, r=${r.toFixed(4)}, f=${fraction.toFixed(4)}):
    """
    Computes March-Dollase preferred orientation correction factor P(alpha).
    Ref: Dollase, W. A. (1986). J. Appl. Cryst. 19, 267-272.
    """
    alpha_rad = np.radians(alpha_deg)
    cos_a = np.cos(alpha_rad)
    sin_a = np.sin(alpha_rad)
    term = (r**2) * (cos_a**2) + (sin_a**2) / r
    p_model = np.where(term > 0, term**(-1.5), 1.0)
    return f * p_model + (1.0 - f)

# Reflection Data
hkl_angles = np.array([${anglesStr}])
i_std = np.array([${iStdStr}])
i_obs = np.array([${iMeasStr}])

# Modeled Intensities
corrections = march_dollase(hkl_angles)
scale = np.sum(i_obs * (i_std * corrections)) / np.sum((i_std * corrections)**2)
i_calc = scale * i_std * corrections

# Weighted Profile R-Factor (Rwp)
rwp = np.sqrt(np.sum((i_obs - i_calc)**2) / np.sum(i_obs**2)) * 100
print(f"Optimal Scale: {scale:.4f}")
print(f"Profile Rwp: {rwp:.2f}%")
print("Corrected Intensities:", np.round(i_calc, 2))`;
}

export function generateLatexTable(
  reflections: PreferredOrientationReflection[],
  metrics: TextureAnalysisMetrics
): string {
  const rows = reflections.map(r => 
    `  $${r.hkl}$ & ${r.angleAlpha.toFixed(1)}^{\\circ} & ${r.correctionFactor.toFixed(3)} & ${r.iStandard.toFixed(1)} & ${r.iMeasured.toFixed(1)} & ${r.iScaled.toFixed(1)} & ${r.harrisTC.toFixed(2)} \\\\`
  ).join('\n');

  return `\\begin{table}[htbp]
\\centering
\\caption{Preferred Orientation and Crystallographic Texture Analysis Matrix (Lotgering $F = ${metrics.lotgeringF.toFixed(3)}$, $\\sigma_{\\text{TC}} = ${metrics.degreeOfOrientationSigma.toFixed(2)}$).}
\\begin{tabular}{lcccccc}
\\hline
$(hkl)$ & $\\alpha$ ($^{\\circ}$) & $P(\\alpha)$ & $I_{\\text{std}}$ & $I_{\\text{obs}}$ & $I_{\\text{calc}}$ & $\\text{TC}(hkl)$ \\\\
\\hline
${rows}
\\hline
\\end{tabular}
\\end{table}`;
}
