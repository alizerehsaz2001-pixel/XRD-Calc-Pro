/**
 * Advanced Crystallographic Physics & Microstructure Engine
 * 
 * Implements:
 * 1. Automated Peak Detection & Centroid / FWHM Extraction
 * 2. Olivero-Longbothum Voigt Line-Broadening Deconvolution (Cauchy Size vs. Gaussian Strain)
 * 3. Scherrer Volume-Weighted (D_V) & Area-Weighted (D_A) Nanocrystalline Domain Size Analysis
 * 4. Stokes-Wilson & RMS Lattice Microstrain + Williamson-Smallman Dislocation Density
 * 5. Analytical Pearson VII Integration via Lanczos Gamma Approximation
 * 6. Williamson-Hall & Halder-Wagner Size-Strain Plot (SSP) Deconvolution with Parameter Covariance
 * 7. Non-Negative Least Squares (NNLS) Multi-Phase Quantitative Weight Solver
 */

import { deconvolveVoigtProfile, calculatePearsonVIIArea } from "../../utils/physics";

export interface DetectedPeak {
  id: string;
  twoTheta: number; // centroid in degrees
  intensity: number; // net peak height
  rawIntensity: number; // observed peak height with background
  background: number;
  dSpacing: number; // Angstroms
  qVector: number; // Angstroms^-1
  fwhmObs: number; // beta_obs in degrees 2theta
  fwhmSample: number; // beta_sample corrected via Olivero-Longbothum Voigt deconvolution
  fwhmRad: number; // beta_sample in radians
  betaLorentzSample: number; // Deconvolved Lorentzian/Cauchy specimen breadth (deg)
  betaGaussSample: number; // Deconvolved Gaussian specimen breadth (deg)
  pearsonM: number; // Estimated Pearson VII shape exponent m
  crystalliteSizeNm: number; // Scherrer size tau in nanometers
  volumeWeightedSizeNm: number; // Voigt Cauchy volume-weighted size D_V in nm
  areaWeightedSizeNm: number; // Voigt Cauchy area-weighted size D_A in nm
  microstrainPct: number; // Stokes-Wilson strain epsilon in %
  rmsMicrostrainPct: number; // Voigt Gaussian RMS microstrain <e^2>^1/2 in %
  microstrainValue: number; // epsilon * 10^-3
  dislocationDensity: number; // Williamson-Smallman dislocation density rho (10^14 m^-2)
  matchedHkl?: string;
  nominalRefT?: number;
  deltaTwoTheta?: number;
  integratedArea: number;
  confidence: number;
}

export interface WilliamsonHallPoint {
  x: number; // 4 * sin(theta)
  y: number; // beta_sample * cos(theta) (in 10^-3 radians)
  twoTheta: number;
  hkl?: string;
  dSpacing: number;
  crystalliteSizeNm: number;
  fwhmObs: number;
}

export interface WilliamsonHallResult {
  points: WilliamsonHallPoint[];
  slope: number; // Microstrain epsilon
  slopeError: number; // Standard error sigma_epsilon
  intercept: number; // K * lambda / tau
  interceptError: number; // Standard error sigma_intercept
  crystalliteSizeNm: number; // tau_WH in nm
  crystalliteSizeErrorNm: number; // Uncertainty in tau_WH (nm)
  microstrainPct: number; // epsilon_WH in %
  microstrainErrorPct: number; // Uncertainty in epsilon_WH (%)
  sspSizeNm: number; // Halder-Wagner Size-Strain Plot (SSP) crystallite size (nm)
  sspStrainPct: number; // Halder-Wagner SSP root-mean-square strain (%)
  dislocationDensityWH: number; // Williamson-Smallman dislocation density (10^14 m^-2)
  deformationEnergyKJm3: number; // UDEDM Lattice Strain Energy Density u (kJ/m^3)
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
 * Robust Peak Detection, Half-Maximum Interpolation, Olivero-Longbothum Voigt Deconvolution & Pearson VII Area
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

  // Smooth intensities slightly with 3-point Savitzky-Golay / binomial kernel to suppress high-frequency detector noise
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
        // Calculate Half-Maximum (50%) and Quarter-Maximum (25%) levels to estimate tail shape (Pearson VII m)
        const halfMaxLevel = localBkg + peakHeight / 2;
        const quarterMaxLevel = localBkg + peakHeight / 4;

        // Interpolate left crossing point (50%)
        let leftT = validPoints[i].twoTheta;
        for (let l = i; l > 0; l--) {
          if (smoothed[l] <= halfMaxLevel) {
            const t1 = validPoints[l].twoTheta;
            const t2 = validPoints[l + 1].twoTheta;
            const y1 = smoothed[l];
            const y2 = smoothed[l + 1];
            leftT = y2 !== y1 ? t1 + ((halfMaxLevel - y1) / (y2 - y1)) * (t2 - t1) : t1;
            break;
          }
        }

        // Interpolate right crossing point (50%)
        let rightT = validPoints[i].twoTheta;
        for (let r = i; r < validPoints.length - 1; r++) {
          if (smoothed[r] <= halfMaxLevel) {
            const t1 = validPoints[r - 1].twoTheta;
            const t2 = validPoints[r].twoTheta;
            const y1 = smoothed[r - 1];
            const y2 = smoothed[r];
            rightT = y2 !== y1 ? t1 + ((halfMaxLevel - y1) / (y2 - y1)) * (t2 - t1) : t2;
            break;
          }
        }

        // Interpolate quarter-max width W_0.25 to determine Voigt / Pearson VII tail heaviness
        let leftQ = leftT;
        for (let l = i; l > 0; l--) {
          if (smoothed[l] <= quarterMaxLevel) {
            const t1 = validPoints[l].twoTheta;
            const t2 = validPoints[l + 1].twoTheta;
            const y1 = smoothed[l];
            const y2 = smoothed[l + 1];
            leftQ = y2 !== y1 ? t1 + ((quarterMaxLevel - y1) / (y2 - y1)) * (t2 - t1) : t1;
            break;
          }
        }
        let rightQ = rightT;
        for (let r = i; r < validPoints.length - 1; r++) {
          if (smoothed[r] <= quarterMaxLevel) {
            const t1 = validPoints[r - 1].twoTheta;
            const t2 = validPoints[r].twoTheta;
            const y1 = smoothed[r - 1];
            const y2 = smoothed[r];
            rightQ = y2 !== y1 ? t1 + ((quarterMaxLevel - y1) / (y2 - y1)) * (t2 - t1) : t2;
            break;
          }
        }

        const fwhmObs = Math.max(0.04, Math.abs(rightT - leftT));
        const fwqmObs = Math.max(fwhmObs * 1.414, Math.abs(rightQ - leftQ));
        // Ratio W_0.25 / W_0.50: Gaussian = sqrt(2) ≈ 1.4142, Lorentzian = sqrt(3) ≈ 1.7321
        const tailRatio = Math.min(1.732, Math.max(1.4142, fwqmObs / fwhmObs));
        const estimatedEta = Math.min(0.95, Math.max(0.05, (tailRatio - 1.4142) / (1.7321 - 1.4142)));
        // Corresponding Pearson VII shape exponent m: m -> 1 for Lorentzian (eta=1), m -> 8 for Gaussian
        const pearsonM = Number((1.0 / Math.max(0.12, estimatedEta * 0.88 + 0.12)).toFixed(2));

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

        // Exact Olivero-Longbothum Voigt Line Deconvolution
        const voigtDeconv = deconvolveVoigtProfile(
          fwhmObs,
          estimatedEta,
          instrumentalFwhm,
          refinedTwoTheta,
          lambda * 0.1, // convert Angstroms to nanometers
          shapeFactorK,
          0.15 // Standard SRM 660 LaB6 instrumental Lorentzian fraction
        );

        const fwhmSampleDeg = Math.max(0.015, voigtDeconv.betaV_specimenDeg);
        const fwhmRad = (fwhmSampleDeg * Math.PI) / 180;

        // Crystallographic quantities
        const thetaRad = ((refinedTwoTheta / 2) * Math.PI) / 180;
        const sinTheta = Math.sin(thetaRad);
        const cosTheta = Math.cos(thetaRad);
        const tanTheta = Math.tan(thetaRad);

        const dSpacing = sinTheta > 0 ? lambda / (2 * sinTheta) : 0;
        const qVector = dSpacing > 0 ? (2 * Math.PI) / dSpacing : 0;

        // Scherrer formula: tau = (K * lambda) / (beta_sample_rad * cos(theta))
        const crystalliteSizeNm = cosTheta > 0 && fwhmRad > 0 ? ((shapeFactorK * lambda) / (fwhmRad * cosTheta)) * 0.1 : 0;
        const volumeWeightedSizeNm = Math.min(999, Math.max(1.0, voigtDeconv.volumeWeightedSizeDvNm));
        const areaWeightedSizeNm = Math.min(999, Math.max(0.8, voigtDeconv.areaWeightedSizeDaNm));

        // Stokes-Wilson lattice microstrain: epsilon = beta_rad / (4 * tan(theta))
        const microstrainVal = tanTheta > 0 && fwhmRad > 0 ? fwhmRad / (4 * tanTheta) : 0;
        const microstrainPct = microstrainVal * 100;
        const rmsMicrostrainPct = Math.max(0, voigtDeconv.rmsMicrostrain * 100);

        // Williamson-Smallman Dislocation Density: rho = (2 * sqrt(3) * <eps^2>^1/2) / (D_V * b)
        // Taking Burgers vector b ≈ dSpacing (in meters = dSpacing * 1e-10) and D_V in meters (D_V * 1e-9)
        // Expressed in units of 10^14 m^-2
        const burgersM = Math.max(1.5e-10, dSpacing * 1e-10);
        const domainM = Math.max(2e-9, crystalliteSizeNm * 1e-9);
        const dislocationDensity = ((2 * Math.sqrt(3) * microstrainVal) / (domainM * burgersM)) * 1e-14;

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

        // Exact analytical Pearson VII integrated area via Lanczos Gamma function
        const { area: integratedArea } = calculatePearsonVIIArea(peakHeight, fwhmObs, pearsonM);

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
          betaLorentzSample: Number(voigtDeconv.betaL_specimenDeg.toFixed(3)),
          betaGaussSample: Number(voigtDeconv.betaG_specimenDeg.toFixed(3)),
          pearsonM,
          crystalliteSizeNm: Number(crystalliteSizeNm.toFixed(1)),
          volumeWeightedSizeNm: Number(volumeWeightedSizeNm.toFixed(1)),
          areaWeightedSizeNm: Number(areaWeightedSizeNm.toFixed(1)),
          microstrainPct: Number(microstrainPct.toFixed(3)),
          rmsMicrostrainPct: Number(rmsMicrostrainPct.toFixed(3)),
          microstrainValue: Number((microstrainVal * 1000).toFixed(2)),
          dislocationDensity: Number(Math.max(0.01, dislocationDensity).toFixed(2)),
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
 * Williamson-Hall & Halder-Wagner Size-Strain Plot (SSP) Analysis:
 * 1. Uniform Deformation Model (UDM):
 *    beta_sample * cos(theta) = (K * lambda / tau) + 4 * epsilon * sin(theta)
 *    Includes exact OLS covariance matrix for parameter standard errors sigma_slope and sigma_intercept.
 * 2. Halder-Wagner Size-Strain Plot (SSP):
 *    (d_hkl * beta_rad * cos(theta) / lambda)^2 = (1 / D_SSP) * (d_hkl^2 * beta_rad * cos(theta) / lambda) + (epsilon_SSP / 2)^2
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
    const yi = points[i].y / 1000; // back to radians
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

  // Parameter Standard Errors (OLS Covariance Matrix)
  const meanX = sumX / n;
  const sxx = Math.max(1e-9, sumX2 - n * meanX * meanX);
  let rss = 0;
  for (let i = 0; i < n; i++) {
    const xi = points[i].x;
    const yi = points[i].y / 1000;
    const yPred = slope * xi + intercept;
    rss += Math.pow(yi - yPred, 2);
  }
  const dof = Math.max(1, n - 2);
  const residualVar = n > 2 ? rss / dof : Math.pow(0.05 * Math.abs(intercept), 2);
  const slopeError = Math.sqrt(residualVar / sxx);
  const interceptError = Math.sqrt(residualVar * (1 / n + (meanX * meanX) / sxx));

  // Extract crystallite size tau in nm: intercept = (K * lambda * 0.1) / tau
  const crystalliteSizeNm = intercept > 1e-5 ? (shapeFactorK * lambda * 0.1) / intercept : 999;
  const crystalliteSizeErrorNm =
    intercept > 1e-5 ? Math.min(250, crystalliteSizeNm * (interceptError / Math.max(1e-5, Math.abs(intercept)))) : 0;
  const microstrainPct = Math.max(0, slope * 100);
  const microstrainErrorPct = slopeError * 100;

  // Halder-Wagner Size-Strain Plot (SSP) Regression:
  // Y_ssp = (d * beta * cos(theta) / lambda)^2 vs X_ssp = d^2 * beta * cos(theta) / lambda (in Angstroms)
  let sspSumX = 0, sspSumY = 0, sspSumXY = 0, sspSumX2 = 0;
  for (let i = 0; i < validPeaks.length; i++) {
    const p = validPeaks[i];
    const thetaRad = ((p.twoTheta / 2) * Math.PI) / 180;
    const betaCos = p.fwhmRad * Math.cos(thetaRad);
    const term = (p.dSpacing * betaCos) / lambda;
    const xSsp = p.dSpacing * term; // Angstroms
    const ySsp = term * term; // dimensionless
    sspSumX += xSsp;
    sspSumY += ySsp;
    sspSumXY += xSsp * ySsp;
    sspSumX2 += xSsp * xSsp;
  }
  const sspDenom = n * sspSumX2 - sspSumX * sspSumX;
  const sspSlope = Math.abs(sspDenom) > 1e-12 ? (n * sspSumXY - sspSumX * sspSumY) / sspDenom : 0;
  const sspIntercept = (sspSumY - sspSlope * sspSumX) / n;
  const sspSizeNm = sspSlope > 1e-5 ? Math.min(999, Math.max(1, (shapeFactorK / sspSlope) * 0.1)) : crystalliteSizeNm;
  const sspStrainPct = sspIntercept > 0 ? Math.sqrt(sspIntercept) * 50 : microstrainPct;

  // Williamson-Smallman Dislocation Density & UDEDM Deformation Energy Density (Young's modulus E ~ 120 GPa)
  const avgD = validPeaks.reduce((acc, p) => acc + p.dSpacing, 0) / n;
  const burgersM = Math.max(1.5e-10, avgD * 1e-10);
  const domainM = Math.max(2e-9, crystalliteSizeNm * 1e-9);
  const dislocationDensityWH = ((2 * Math.sqrt(3) * Math.max(1e-5, Math.abs(slope))) / (domainM * burgersM)) * 1e-14;
  // u = (E * epsilon^2) / 2 in kJ/m^3 (with E = 120 GPa = 1.2e8 kPa)
  const deformationEnergyKJm3 = 0.5 * 1.2e8 * Math.pow(Math.max(0, slope), 2);

  const equation = `β* = (${(slope * 1000).toFixed(3)}±${(slopeError * 1000).toFixed(3)})×10⁻³ s + (${(intercept * 1000).toFixed(3)}±${(interceptError * 1000).toFixed(3)})×10⁻³`;

  return {
    points,
    slope: Number(slope.toFixed(6)),
    slopeError: Number(slopeError.toFixed(6)),
    intercept: Number(intercept.toFixed(6)),
    interceptError: Number(interceptError.toFixed(6)),
    crystalliteSizeNm: Number(Math.min(999, Math.max(1, crystalliteSizeNm)).toFixed(1)),
    crystalliteSizeErrorNm: Number(crystalliteSizeErrorNm.toFixed(1)),
    microstrainPct: Number(microstrainPct.toFixed(3)),
    microstrainErrorPct: Number(microstrainErrorPct.toFixed(3)),
    sspSizeNm: Number(sspSizeNm.toFixed(1)),
    sspStrainPct: Number(sspStrainPct.toFixed(3)),
    dislocationDensityWH: Number(Math.max(0.01, dislocationDensityWH).toFixed(2)),
    deformationEnergyKJm3: Number(deformationEnergyKJm3.toFixed(1)),
    rSquared: Number(rSquared.toFixed(3)),
    equation,
  };
}

/**
 * Non-Negative Least Squares (NNLS) Multi-Phase Quantitative Weight Solver
 * Solves: min_{w_i >= 0} sum_j (Y_obs[j] - sum_i w_i * P_i[j])^2 + lambda_L2 * ||w||_2^2
 * using projected coordinate-descent with inverse-curvature uncertainty estimation.
 */
export function optimizePhaseWeightsNNLS(
  observedPoints: number[],
  phaseProfiles: number[][], // array of arrays, each of length = observedPoints.length
  phaseNames: string[],
  maxIterations: number = 45
): {
  weights: Record<string, number>;
  percentages: Record<string, number>;
  uncertainties: Record<string, number>;
  rwp: number;
  iterations: number;
} {
  const m = phaseProfiles.length; // number of phases
  const n = observedPoints.length; // number of 2theta grid points

  if (m === 0 || n === 0) {
    return { weights: {}, percentages: {}, uncertainties: {}, rwp: 0, iterations: 0 };
  }

  // Initial equal weights
  const weights = new Array(m).fill(1.0 / m);

  // Precompute inner products with L2 Tikhonov regularization for overlapping reflections
  const P_dot_P: number[] = [];
  for (let i = 0; i < m; i++) {
    let dot = 0;
    for (let j = 0; j < n; j++) {
      dot += phaseProfiles[i][j] * phaseProfiles[i][j];
    }
    const l2Reg = Math.max(1e-6, dot * 1e-4);
    P_dot_P.push(Math.max(1e-6, dot + l2Reg));
  }

  let iter = 0;
  let prevLoss = Infinity;

  for (iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < m; i++) {
      let numerator = 0;
      for (let j = 0; j < n; j++) {
        let otherPhases = 0;
        for (let k = 0; k < m; k++) {
          if (k !== i) otherPhases += weights[k] * phaseProfiles[k][j];
        }
        numerator += phaseProfiles[i][j] * (observedPoints[j] - otherPhases);
      }
      weights[i] = Math.max(0, numerator / P_dot_P[i]);
    }

    let currentLoss = 0;
    for (let j = 0; j < n; j++) {
      let calc = 0;
      for (let i = 0; i < m; i++) {
        calc += weights[i] * phaseProfiles[i][j];
      }
      const diff = observedPoints[j] - calc;
      currentLoss += diff * diff;
    }

    if (Math.abs(prevLoss - currentLoss) < 1e-6) {
      break;
    }
    prevLoss = currentLoss;
  }

  // Calculate R_wp & Residual Variance for Inverse-Curvature Uncertainty
  let sumDiffSq = 0;
  let sumObsSq = 0;
  let unweightedRss = 0;
  for (let j = 0; j < n; j++) {
    let calc = 0;
    for (let i = 0; i < m; i++) {
      calc += weights[i] * phaseProfiles[i][j];
    }
    const diff = observedPoints[j] - calc;
    unweightedRss += diff * diff;
    const w = 1 / Math.max(1, observedPoints[j]);
    sumDiffSq += w * diff * diff;
    sumObsSq += w * observedPoints[j] * observedPoints[j];
  }
  const rwp = sumObsSq > 0 ? Math.sqrt(sumDiffSq / sumObsSq) * 100 : 0;
  const dof = Math.max(1, n - m);
  const sigmaSq = unweightedRss / dof;

  const sumWeights = weights.reduce((acc, w) => acc + w, 0);
  const weightsMap: Record<string, number> = {};
  const percentagesMap: Record<string, number> = {};
  const uncertaintiesMap: Record<string, number> = {};

  phaseNames.forEach((name, idx) => {
    weightsMap[name] = Number(weights[idx].toFixed(4));
    const pct = sumWeights > 0 ? (weights[idx] / sumWeights) * 100 : 0;
    percentagesMap[name] = Number(pct.toFixed(1));
    const weightStd = Math.sqrt(sigmaSq / P_dot_P[idx]);
    const pctStd = sumWeights > 0 ? Math.min(8.5, Math.max(0.15, (weightStd / sumWeights) * 100)) : 0.5;
    uncertaintiesMap[name] = Number(pctStd.toFixed(2));
  });

  return {
    weights: weightsMap,
    percentages: percentagesMap,
    uncertainties: uncertaintiesMap,
    rwp: Number(rwp.toFixed(2)),
    iterations: iter + 1,
  };
}

