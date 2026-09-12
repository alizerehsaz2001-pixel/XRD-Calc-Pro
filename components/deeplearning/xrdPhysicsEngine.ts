/**
 * Advanced Crystallographic Physics & Microstructure Engine
 * 
 * Implements:
 * 1. Automated Peak Detection & Centroid / FWHM Extraction
 * 2. Scherrer Nanocrystalline Domain Size Analysis
 * 3. Stokes-Wilson Lattice Microstrain Calculation
 * 4. Williamson-Hall Microstructural Deconvolution (Size vs Strain)
 * 5. Non-Negative Least Squares (NNLS) Multi-Phase Quantitative Weight Solver
 */

export interface DetectedPeak {
  id: string;
  twoTheta: number; // centroid in degrees
  intensity: number; // net peak height
  rawIntensity: number; // observed peak height with background
  background: number;
  dSpacing: number; // Angstroms
  qVector: number; // Angstroms^-1
  fwhmObs: number; // beta_obs in degrees 2theta
  fwhmSample: number; // beta_sample corrected for instrumental resolution
  fwhmRad: number; // beta_sample in radians
  crystalliteSizeNm: number; // Scherrer size tau in nanometers
  microstrainPct: number; // Stokes-Wilson strain epsilon in %
  microstrainValue: number; // epsilon * 10^-3
  matchedHkl?: string;
  nominalRefT?: number;
  deltaTwoTheta?: number;
  integratedArea: number;
  confidence: number;
}

export interface WilliamsonHallPoint {
  x: number; // 4 * sin(theta)
  y: number; // beta_sample * cos(theta) (in radians)
  twoTheta: number;
  hkl?: string;
  dSpacing: number;
  crystalliteSizeNm: number;
  fwhmObs: number;
}

export interface WilliamsonHallResult {
  points: WilliamsonHallPoint[];
  slope: number; // Microstrain epsilon
  intercept: number; // K * lambda / tau
  crystalliteSizeNm: number; // tau_WH in nm
  microstrainPct: number; // epsilon_WH in %
  rSquared: number; // Coefficient of determination
  equation: string;
}

export interface PeakDetectionOptions {
  lambda: number;
  instrumentalFwhm: number; // beta_inst in degrees (e.g. 0.06 deg for NIST SRM 660)
  shapeFactorK: number; // K (0.94 for cubic/spherical, 0.89 for general)
  minProminencePct?: number; // 1% to 20%
  minTwoTheta?: number;
  maxTwoTheta?: number;
  referencePeaks?: Array<{ calibratedRefT: number; hkl?: string; refI: number; calibratedD?: number }>;
}

/**
 * Robust Peak Detection, Half-Maximum Interpolation and FWHM Calculation
 */
export function detectDiffractionPeaks(
  dataPoints: Array<{ twoTheta: number; intensity: number | null; rawIntensity?: number; baseline?: number | null }>,
  options: PeakDetectionOptions
): DetectedPeak[] {
  if (!dataPoints || dataPoints.length < 5) return [];

  const {
    lambda = 1.5406,
    instrumentalFwhm = 0.06,
    shapeFactorK = 0.94,
    minProminencePct = 2.5,
    minTwoTheta = 5,
    maxTwoTheta = 120,
    referencePeaks = [],
  } = options;

  // Filter valid range
  const validPoints = dataPoints.filter(
    (p) => p.twoTheta >= minTwoTheta && p.twoTheta <= maxTwoTheta && typeof p.intensity === "number" && !isNaN(p.intensity)
  );
  if (validPoints.length < 5) return [];

  const intensities = validPoints.map((p) => p.intensity as number);
  const maxI = Math.max(...intensities, 1);
  const minProminence = (maxI * minProminencePct) / 100;

  // Smooth intensities slightly with 3-point moving average to suppress high-frequency detector noise
  const smoothed: number[] = [];
  for (let i = 0; i < intensities.length; i++) {
    if (i === 0) smoothed.push((intensities[0] * 2 + intensities[1]) / 3);
    else if (i === intensities.length - 1) smoothed.push((intensities[i - 1] + intensities[i] * 2) / 3);
    else smoothed.push((intensities[i - 1] + intensities[i] * 2 + intensities[i + 1]) / 4);
  }

  const detected: DetectedPeak[] = [];

  // Identify local maxima
  for (let i = 2; i < validPoints.length - 2; i++) {
    const curr = smoothed[i];
    const prev = smoothed[i - 1];
    const next = smoothed[i + 1];

    if (curr > prev && curr >= next && curr > minProminence) {
      // Find local minima to the left and right to compute prominence
      let leftMin = curr;
      for (let l = i - 1; l >= Math.max(0, i - 35); l--) {
        if (smoothed[l] < leftMin) leftMin = smoothed[l];
        else if (smoothed[l] > leftMin * 1.4) break;
      }

      let rightMin = curr;
      for (let r = i + 1; r <= Math.min(validPoints.length - 1, i + 35); r++) {
        if (smoothed[r] < rightMin) rightMin = smoothed[r];
        else if (smoothed[r] > rightMin * 1.4) break;
      }

      const localBkg = Math.max(0, (leftMin + rightMin) / 2);
      const peakHeight = curr - localBkg;

      if (peakHeight >= minProminence) {
        // Calculate Half-Maximum level
        const halfMaxLevel = localBkg + peakHeight / 2;

        // Interpolate left crossing point
        let leftT = validPoints[i].twoTheta;
        for (let l = i; l > 0; l--) {
          if (smoothed[l] <= halfMaxLevel) {
            const t1 = validPoints[l].twoTheta;
            const t2 = validPoints[l + 1].twoTheta;
            const y1 = smoothed[l];
            const y2 = smoothed[l + 1];
            if (y2 !== y1) {
              leftT = t1 + ((halfMaxLevel - y1) / (y2 - y1)) * (t2 - t1);
            } else {
              leftT = t1;
            }
            break;
          }
        }

        // Interpolate right crossing point
        let rightT = validPoints[i].twoTheta;
        for (let r = i; r < validPoints.length - 1; r++) {
          if (smoothed[r] <= halfMaxLevel) {
            const t1 = validPoints[r - 1].twoTheta;
            const t2 = validPoints[r].twoTheta;
            const y1 = smoothed[r - 1];
            const y2 = smoothed[r];
            if (y2 !== y1) {
              rightT = t1 + ((halfMaxLevel - y1) / (y2 - y1)) * (t2 - t1);
            } else {
              rightT = t2;
            }
            break;
          }
        }

        const fwhmObs = Math.max(0.04, Math.abs(rightT - leftT));

        // Sub-step parabolic refinement for exact centroid 2theta
        const y_a = smoothed[i - 1];
        const y_b = smoothed[i];
        const y_c = smoothed[i + 1];
        const denom = 2 * (2 * y_b - y_a - y_c);
        const deltaIndex = denom !== 0 ? (y_a - y_c) / denom : 0;
        const step = validPoints[i + 1].twoTheta - validPoints[i].twoTheta;
        const refinedTwoTheta = validPoints[i].twoTheta + deltaIndex * step;

        // Skip duplicates if another peak was found too close (< 0.25 deg) with lower height
        const existingIdx = detected.findIndex((dp) => Math.abs(dp.twoTheta - refinedTwoTheta) < 0.25);
        if (existingIdx >= 0) {
          if (peakHeight > detected[existingIdx].intensity) {
            detected.splice(existingIdx, 1);
          } else {
            continue;
          }
        }

        // Instrumental resolution correction: beta_sample = sqrt(beta_obs^2 - beta_inst^2)
        const fwhmSampleDeg = Math.sqrt(Math.max(0.0004, Math.pow(fwhmObs, 2) - Math.pow(instrumentalFwhm, 2)));
        const fwhmRad = (fwhmSampleDeg * Math.PI) / 180;

        // Crystallographic quantities
        const thetaRad = ((refinedTwoTheta / 2) * Math.PI) / 180;
        const sinTheta = Math.sin(thetaRad);
        const cosTheta = Math.cos(thetaRad);
        const tanTheta = Math.tan(thetaRad);

        const dSpacing = sinTheta > 0 ? lambda / (2 * sinTheta) : 0;
        const qVector = dSpacing > 0 ? (2 * Math.PI) / dSpacing : 0;

        // Scherrer formula: tau = (K * lambda) / (beta_sample_rad * cos(theta))
        // lambda in Angstroms, multiply by 0.1 to convert Angstroms to nanometers
        const crystalliteSizeNm = cosTheta > 0 && fwhmRad > 0 ? ((shapeFactorK * lambda) / (fwhmRad * cosTheta)) * 0.1 : 0;

        // Stokes-Wilson lattice microstrain: epsilon = beta_rad / (4 * tan(theta))
        const microstrainVal = tanTheta > 0 && fwhmRad > 0 ? fwhmRad / (4 * tanTheta) : 0;
        const microstrainPct = microstrainVal * 100;

        // Match to closest theoretical reference reflection
        let matchedHkl: string | undefined;
        let nominalRefT: number | undefined;
        let deltaTwoTheta: number | undefined;

        if (referencePeaks.length > 0) {
          let closestDiff = Infinity;
          let bestRef: any = null;
          for (const ref of referencePeaks) {
            const diff = Math.abs(refinedTwoTheta - ref.calibratedRefT);
            if (diff < closestDiff) {
              closestDiff = diff;
              bestRef = ref;
            }
          }

          if (closestDiff <= 0.65 && bestRef) {
            matchedHkl = bestRef.hkl;
            nominalRefT = bestRef.calibratedRefT;
            deltaTwoTheta = refinedTwoTheta - bestRef.calibratedRefT;
          }
        }

        // Integrated peak area approx (Gaussian/Pseudo-Voigt area ~ 1.065 * height * fwhm)
        const integratedArea = 1.065 * peakHeight * fwhmObs;

        detected.push({
          id: `peak-${refinedTwoTheta.toFixed(2)}-${detected.length}`,
          twoTheta: Number(refinedTwoTheta.toFixed(3)),
          intensity: Number(peakHeight.toFixed(1)),
          rawIntensity: Number(curr.toFixed(1)),
          background: Number(localBkg.toFixed(1)),
          dSpacing: Number(dSpacing.toFixed(4)),
          qVector: Number(qVector.toFixed(3)),
          fwhmObs: Number(fwhmObs.toFixed(3)),
          fwhmSample: Number(fwhmSampleDeg.toFixed(3)),
          fwhmRad,
          crystalliteSizeNm: Number(crystalliteSizeNm.toFixed(1)),
          microstrainPct: Number(microstrainPct.toFixed(3)),
          microstrainValue: Number((microstrainVal * 1000).toFixed(2)),
          matchedHkl,
          nominalRefT: nominalRefT !== undefined ? Number(nominalRefT.toFixed(2)) : undefined,
          deltaTwoTheta: deltaTwoTheta !== undefined ? Number(deltaTwoTheta.toFixed(3)) : undefined,
          integratedArea: Number(integratedArea.toFixed(1)),
          confidence: Math.min(100, Math.round((peakHeight / maxI) * 100)),
        });
      }
    }
  }

  // Sort by 2theta
  return detected.sort((a, b) => a.twoTheta - b.twoTheta);
}

/**
 * Williamson-Hall Analysis:
 * beta_sample * cos(theta) = (K * lambda / tau) + 4 * epsilon * sin(theta)
 * Linear regression: y = m * x + c
 * where x = 4 * sin(theta), y = beta_rad * cos(theta)
 * slope m = epsilon (Microstrain)
 * intercept c = (K * lambda / tau) * 0.1 -> tau = (K * lambda * 0.1) / c
 */
export function calculateWilliamsonHall(
  peaks: DetectedPeak[],
  lambda: number = 1.5406,
  shapeFactorK: number = 0.94
): WilliamsonHallResult | null {
  if (!peaks || peaks.length < 2) return null;

  const validPeaks = peaks.filter((p) => p.twoTheta >= 15 && p.fwhmRad > 0 && p.crystalliteSizeNm > 0);
  if (validPeaks.length < 2) return null;

  const points: WilliamsonHallPoint[] = validPeaks.map((p) => {
    const thetaRad = ((p.twoTheta / 2) * Math.PI) / 180;
    const sinTheta = Math.sin(thetaRad);
    const cosTheta = Math.cos(thetaRad);
    const x = 4 * sinTheta;
    const y = p.fwhmRad * cosTheta;

    return {
      x: Number(x.toFixed(4)),
      y: Number((y * 1000).toFixed(4)), // store in 10^-3 rad for clean plotting
      twoTheta: p.twoTheta,
      hkl: p.matchedHkl,
      dSpacing: p.dSpacing,
      crystalliteSizeNm: p.crystalliteSizeNm,
      fwhmObs: p.fwhmObs,
    };
  });

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  // Use natural y units (radians) for slope and intercept calculations
  for (let i = 0; i < n; i++) {
    const xi = points[i].x;
    const yi = (points[i].y / 1000); // back to radians
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-9) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Pearson R^2
  const numeratorR = n * sumXY - sumX * sumY;
  const denomR = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const rSquared = denomR > 0 ? Math.pow(numeratorR / denomR, 2) : 0;

  // Extract crystallite size tau in nm: intercept = (K * lambda * 0.1) / tau
  // If intercept <= 0, size is unbounded/large
  const crystalliteSizeNm = intercept > 0 ? (shapeFactorK * lambda * 0.1) / intercept : 999;
  const microstrainPct = Math.max(0, slope * 100);

  const equation = `β* = ${(slope * 1000).toFixed(3)}×10⁻³ s + ${(intercept * 1000).toFixed(3)}×10⁻³`;

  return {
    points,
    slope: Number(slope.toFixed(6)),
    intercept: Number(intercept.toFixed(6)),
    crystalliteSizeNm: Number(Math.min(999, Math.max(1, crystalliteSizeNm)).toFixed(1)),
    microstrainPct: Number(microstrainPct.toFixed(3)),
    rSquared: Number(rSquared.toFixed(3)),
    equation,
  };
}

/**
 * Non-Negative Least Squares (NNLS) Multi-Phase Quantitative Weight Solver
 * Solves: min_{w_i >= 0} sum_j (Y_obs[j] - sum_i w_i * P_i[j])^2
 * using coordinate-descent with rapid convergence.
 */
export function optimizePhaseWeightsNNLS(
  observedPoints: number[],
  phaseProfiles: number[][], // array of arrays, each of length = observedPoints.length
  phaseNames: string[],
  maxIterations: number = 35
): { weights: Record<string, number>; percentages: Record<string, number>; rwp: number; iterations: number } {
  const m = phaseProfiles.length; // number of phases
  const n = observedPoints.length; // number of 2theta grid points

  if (m === 0 || n === 0) {
    return { weights: {}, percentages: {}, rwp: 0, iterations: 0 };
  }

  // Initial equal weights
  let weights = new Array(m).fill(1.0);

  // Precompute inner products
  const P_dot_P: number[] = [];
  for (let i = 0; i < m; i++) {
    let dot = 0;
    for (let j = 0; j < n; j++) {
      dot += phaseProfiles[i][j] * phaseProfiles[i][j];
    }
    P_dot_P.push(Math.max(1e-6, dot));
  }

  let iter = 0;
  let prevLoss = Infinity;

  for (iter = 0; iter < maxIterations; iter++) {
    // Coordinate descent over each phase weight
    for (let i = 0; i < m; i++) {
      let numerator = 0;
      for (let j = 0; j < n; j++) {
        // partial residual without phase i
        let otherPhases = 0;
        for (let k = 0; k < m; k++) {
          if (k !== i) otherPhases += weights[k] * phaseProfiles[k][j];
        }
        numerator += phaseProfiles[i][j] * (observedPoints[j] - otherPhases);
      }
      // Non-negative projection
      weights[i] = Math.max(0.01, numerator / P_dot_P[i]);
    }

    // Evaluate residual loss
    let currentLoss = 0;
    for (let j = 0; j < n; j++) {
      let calc = 0;
      for (let i = 0; i < m; i++) {
        calc += weights[i] * phaseProfiles[i][j];
      }
      const diff = observedPoints[j] - calc;
      currentLoss += diff * diff;
    }

    if (Math.abs(prevLoss - currentLoss) < 1e-4) {
      break;
    }
    prevLoss = currentLoss;
  }

  // Calculate R_wp
  let sumDiffSq = 0;
  let sumObsSq = 0;
  for (let j = 0; j < n; j++) {
    let calc = 0;
    for (let i = 0; i < m; i++) {
      calc += weights[i] * phaseProfiles[i][j];
    }
    const diff = observedPoints[j] - calc;
    const w = 1 / Math.max(1, observedPoints[j]);
    sumDiffSq += w * diff * diff;
    sumObsSq += w * observedPoints[j] * observedPoints[j];
  }
  const rwp = sumObsSq > 0 ? Math.sqrt(sumDiffSq / sumObsSq) * 100 : 0;

  // Normalize percentages
  const sumWeights = weights.reduce((acc, w) => acc + w, 0);
  const weightsMap: Record<string, number> = {};
  const percentagesMap: Record<string, number> = {};

  phaseNames.forEach((name, idx) => {
    weightsMap[name] = Number(weights[idx].toFixed(3));
    percentagesMap[name] = sumWeights > 0 ? Number(((weights[idx] / sumWeights) * 100).toFixed(1)) : 0;
  });

  return {
    weights: weightsMap,
    percentages: percentagesMap,
    rwp: Number(rwp.toFixed(2)),
    iterations: iter + 1,
  };
}
