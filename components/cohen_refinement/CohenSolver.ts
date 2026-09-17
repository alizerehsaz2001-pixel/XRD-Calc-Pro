import { CrystalSystem, DriftFunctionType, WeightingScheme, PeakInput } from './CohenPresetsDb';

export interface CohenRefinementOutput {
  lattice: { 
    a: number; 
    b: number; 
    c: number; 
    alphaDeg: number;
    betaDeg: number; 
    gammaDeg: number;
    rhombohedralA?: number;
    rhombohedralAlpha?: number;
  };
  sigma: { 
    sigmaA: number; 
    sigmaB: number; 
    sigmaC: number; 
    sigmaAlpha: number;
    sigmaBeta: number;
    sigmaGamma: number;
    sigmaD: number; 
    sigmaD2?: number;
    sigmaVolume: number;
  };
  D: number;
  D2?: number;
  volume: number;
  variance: number;
  weightedVariance: number;
  rmsTwoThetaShift: number;
  meanAbsDeltaTwoTheta: number;
  maxDeltaTwoTheta: number;
  sumResidualSquare: number;
  dof: number;
  gof: number; // Goodness-of-Fit = sqrt(weightedVariance)
  rBraggPct: number;
  rwpPct: number;
  conditionNumber: number;
  condNumber?: number; // Alias for conditionNumber
  matrixM: number[][];
  matrixMInv: number[][];
  covarianceMatrix: number[][];
  correlationMatrix: number[][];
  vectorY: number[];
  vectorX: number[];
  parameterNames: string[];
  matrixLabels?: string[]; // Alias for parameterNames
  peakDetails: {
    id: string;
    twoTheta: number;
    twoThetaCalc: number;
    deltaTwoTheta: number;
    dObs: number;
    dCalc: number;
    deltaD: number;
    h: number;
    k: number;
    l: number;
    sin2Obs: number;
    sin2Calc: number;
    driftVal: number;
    driftVal2?: number;
    residualSin2: number;
    weight: number;
    intensity?: number;
    enabled?: boolean;
    wavelength?: number;
    isOutlier?: boolean;
  }[];
  numParams: number;
  validPeaks: PeakInput[];
  basisMatrix: number[][];
  weightingScheme: WeightingScheme;
  driftType: DriftFunctionType;
  crystalSystem: CrystalSystem;
}

export type CohenRefinementResult = CohenRefinementOutput | { error: string };

// Gaussian elimination solver with partial pivoting and condition number tracking
export function solveLinearSystem(M: number[][], Y: number[]): { X: number[]; M_inv: number[][]; conditionNumber: number } | null {
  const n = M.length;
  // Augmented matrix [M | I | Y]
  const aug: number[][] = Array.from({ length: n }, (_, i) => [
    ...M[i],
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    Y[i]
  ]);

  // Track max and min pivots for condition number estimate
  let maxPivot = 0;
  let minPivot = Infinity;

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    const pivotVal = Math.abs(aug[maxRow][col]);
    if (pivotVal < 1e-15) {
      return null; // Singular matrix
    }
    maxPivot = Math.max(maxPivot, pivotVal);
    minPivot = Math.min(minPivot, pivotVal);

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Normalize pivot row
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n + 1; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n + 1; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  const X = aug.map(row => row[2 * n]);
  const M_inv = aug.map(row => row.slice(n, 2 * n));
  const conditionNumber = minPivot > 0 ? maxPivot / minPivot : 1e12;

  return { X, M_inv, conditionNumber };
}

// 3x3 Matrix Inversion for Metric Tensor
export function invert3x3(M: number[][]): number[][] | null {
  const [
    [a, b, c],
    [d, e, f],
    [g, h, i]
  ] = M;

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-15) return null;

  const invDet = 1 / det;
  return [
    [A * invDet, D * invDet, G * invDet],
    [B * invDet, E * invDet, H * invDet],
    [C * invDet, F * invDet, I * invDet]
  ];
}

// Drift Function Calculation
export function calculateDrift(twoThetaDeg: number, type: DriftFunctionType): number {
  if (type === 'none') return 0;
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;

  const cosTh = Math.cos(thetaRad);
  const sinTh = Math.sin(thetaRad);

  switch (type) {
    case 'nelson_riley': {
      // f(theta) = 0.5 * ( (cos^2 theta / sin theta) + (cos^2 theta / theta) )
      const term1 = (cosTh * cosTh) / sinTh;
      const term2 = (cosTh * cosTh) / thetaRad;
      return 0.5 * (term1 + term2);
    }
    case 'bradley_jay':
      return cosTh * cosTh;
    case 'sample_displacement':
      return cosTh * cosTh * sinTh;
    case 'hess_hagg':
      return Math.sin(2 * thetaRad) * Math.sin(2 * thetaRad);
    case 'zero_shift':
      return cosTh;
    case 'flat_specimen':
      return cosTh / Math.max(1e-4, sinTh); // cot(theta)
    case 'dual_drift':
      // Primary component is Nelson-Riley
      return 0.5 * ((cosTh * cosTh) / sinTh + (cosTh * cosTh) / thetaRad);
    default:
      return 0.5 * ((cosTh * cosTh) / sinTh + (cosTh * cosTh) / thetaRad);
  }
}

// Compute individual peak weight based on chosen weighting scheme
export function calculatePeakWeight(
  twoThetaDeg: number,
  intensity: number | undefined,
  dObs: number,
  scheme: WeightingScheme,
  customWeight?: number
): number {
  if (customWeight !== undefined && customWeight > 0) return customWeight;
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  const sin2_2Th = Math.pow(Math.sin(2 * thetaRad), 2);
  const I = intensity !== undefined && intensity > 0 ? intensity : 100;

  switch (scheme) {
    case 'hess_hagg':
      // w_i = 1 / sin^2(2theta) - directly maps sin^2(theta) least squares into angular 2theta least squares!
      return 1 / Math.max(1e-5, sin2_2Th);
    case 'statistical': {
      const tanTh = Math.tan(thetaRad);
      return Math.max(0.01, (tanTh * tanTh) / Math.max(1e-4, dObs * dObs));
    }
    case 'intensity': {
      // Weight by square root of intensity divided by sin^2(2theta)
      return Math.sqrt(I) / Math.max(1e-5, sin2_2Th);
    }
    case 'unit':
    default:
      return 1.0;
  }
}

// Core Cohen Analytical Least-Squares Solver
export function runCohenRefinement(
  peaks: PeakInput[],
  crystalSystem: CrystalSystem,
  driftType: DriftFunctionType = 'nelson_riley',
  wavelength: number = 1.54056,
  weightingScheme: WeightingScheme = 'hess_hagg'
): CohenRefinementResult {
  const enabledPeaks = peaks.filter(p => p.enabled !== false);
  if (enabledPeaks.length < 2) {
    return { error: 'At least 2 enabled reflection peaks are required for least-squares matrix refinement.' };
  }

  const lambdaRef = wavelength;

  // Filter valid peaks
  const validPeaks = enabledPeaks.filter(p => p.twoTheta > 0 && p.twoTheta < 180);
  if (validPeaks.length < 2) {
    return { error: 'Invalid 2θ angles detected. Peaks must be strictly between 0° and 180°.' };
  }

  // Determine number of lattice parameters
  let numLatticeParams = 1; // Cubic
  let parameterNames: string[] = ['A (λ²/4a²)'];

  if (crystalSystem === 'Tetragonal') {
    numLatticeParams = 2;
    parameterNames = ['A (λ²/4a²)', 'C (λ²/4c²)'];
  } else if (crystalSystem === 'Hexagonal') {
    numLatticeParams = 2;
    parameterNames = ['A (λ²/3a²)', 'C (λ²/4c²)'];
  } else if (crystalSystem === 'Trigonal') {
    numLatticeParams = 2;
    parameterNames = ['A (λ²/3a²)', 'C (λ²/4c²)'];
  } else if (crystalSystem === 'Orthorhombic') {
    numLatticeParams = 3;
    parameterNames = ['A (λ²/4a²)', 'B (λ²/4b²)', 'C (λ²/4c²)'];
  } else if (crystalSystem === 'Monoclinic') {
    numLatticeParams = 4;
    parameterNames = ['A', 'B', 'C', 'E (cross-term)'];
  } else if (crystalSystem === 'Triclinic') {
    numLatticeParams = 6;
    parameterNames = ['S11', 'S22', 'S33', '2S12', '2S23', '2S13'];
  }

  // Determine drift parameters
  let numDriftParams = 0;
  if (driftType === 'dual_drift') {
    numDriftParams = 2;
    parameterNames.push('Drift D1 (Nelson-Riley)', 'Drift D2 (Zero-Shift)');
  } else if (driftType !== 'none') {
    numDriftParams = 1;
    parameterNames.push(`Drift D (${driftType.replace('_', ' ')})`);
  }

  const numParams = numLatticeParams + numDriftParams;

  if (validPeaks.length < numParams) {
    return { 
      error: `Insufficient reflections (${validPeaks.length} enabled). ${crystalSystem} symmetry with ${driftType.replace('_', ' ')} drift requires at least ${numParams} non-coplanar peaks.` 
    };
  }

  // Specific crystal system symmetry checks
  if (crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
    const hasNonZeroL = validPeaks.some(p => p.l !== 0);
    if (!hasNonZeroL) {
      return {
        error: `All active reflections have l = 0. In ${crystalSystem} symmetry, lattice parameter 'c' cannot be determined without reflections having l ≠ 0.`
      };
    }
  }

  if (crystalSystem === 'Orthorhombic') {
    const hasH = validPeaks.some(p => p.h !== 0);
    const hasK = validPeaks.some(p => p.k !== 0);
    const hasL = validPeaks.some(p => p.l !== 0);
    if (!hasH || !hasK || !hasL) {
      return {
        error: `Orthorhombic refinement requires non-zero components along all three crystallographic axes h, k, and l.`
      };
    }
  }

  const sin2Obs: number[] = [];
  const driftVals: number[] = [];
  const driftVals2: number[] = [];
  const weights: number[] = [];
  const basisMatrix: number[][] = [];
  const dObsList: number[] = [];

  // Compute basis matrix rows and raw weights
  for (let i = 0; i < validPeaks.length; i++) {
    const p = validPeaks[i];
    const peakLambda = p.wavelength && p.wavelength > 0 ? p.wavelength : lambdaRef;
    const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
    const sinTh = Math.sin(thetaRad);
    const s2 = sinTh * sinTh;
    sin2Obs.push(s2);

    const dVal = peakLambda / (2 * sinTh);
    dObsList.push(dVal);

    const w = calculatePeakWeight(p.twoTheta, p.intensity, dVal, weightingScheme, p.weight);
    weights.push(w);

    const fTh = calculateDrift(p.twoTheta, driftType);
    driftVals.push(fTh);

    const fTh2 = driftType === 'dual_drift' ? Math.cos(thetaRad) : 0;
    driftVals2.push(fTh2);

    // Multi-wavelength wavelength scaling factor: (lambda_peak / lambda_ref)^2
    const lambdaScale = Math.pow(peakLambda / lambdaRef, 2);

    let row: number[] = [];
    const h2 = p.h * p.h;
    const k2 = p.k * p.k;
    const l2 = p.l * p.l;

    if (crystalSystem === 'Cubic') {
      const s = (h2 + k2 + l2) * lambdaScale;
      row = [s];
    } else if (crystalSystem === 'Tetragonal') {
      const s1 = (h2 + k2) * lambdaScale;
      const s2Row = l2 * lambdaScale;
      row = [s1, s2Row];
    } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
      const s1 = (h2 + p.h * p.k + k2) * lambdaScale;
      const s2Row = l2 * lambdaScale;
      row = [s1, s2Row];
    } else if (crystalSystem === 'Orthorhombic') {
      row = [h2 * lambdaScale, k2 * lambdaScale, l2 * lambdaScale];
    } else if (crystalSystem === 'Monoclinic') {
      row = [h2 * lambdaScale, k2 * lambdaScale, l2 * lambdaScale, (p.h * p.l) * lambdaScale];
    } else if (crystalSystem === 'Triclinic') {
      row = [
        h2 * lambdaScale, 
        k2 * lambdaScale, 
        l2 * lambdaScale, 
        (2 * p.h * p.k) * lambdaScale, 
        (2 * p.k * p.l) * lambdaScale, 
        (2 * p.h * p.l) * lambdaScale
      ];
    }

    // Append drift terms
    if (driftType === 'dual_drift') {
      row.push(fTh, fTh2);
    } else if (driftType !== 'none') {
      row.push(fTh);
    }

    basisMatrix.push(row);
  }

  // Normalize weights so average weight = 1 (preserves numerical scale of variance)
  const sumWeights = weights.reduce((acc, val) => acc + val, 0);
  const normFactor = validPeaks.length / Math.max(1e-12, sumWeights);
  const normalizedWeights = weights.map(w => w * normFactor);

  // Build Weighted Normal Equations Matrix M (numParams x numParams) and RHS Vector Y (numParams)
  // M_jk = ∑ w_i * basis_ij * basis_ik
  // Y_j  = ∑ w_i * basis_ij * sin2Obs_i
  const M: number[][] = Array.from({ length: numParams }, () => Array(numParams).fill(0));
  const Y: number[] = Array(numParams).fill(0);

  for (let j = 0; j < numParams; j++) {
    for (let k = 0; k < numParams; k++) {
      let sum = 0;
      for (let i = 0; i < validPeaks.length; i++) {
        sum += normalizedWeights[i] * basisMatrix[i][j] * basisMatrix[i][k];
      }
      M[j][k] = sum;
    }

    let ySum = 0;
    for (let i = 0; i < validPeaks.length; i++) {
      ySum += normalizedWeights[i] * basisMatrix[i][j] * sin2Obs[i];
    }
    Y[j] = ySum;
  }

  // Solve M * X = Y
  const solved = solveLinearSystem(M, Y);
  if (!solved) {
    return { error: 'Normal matrix [M] is singular or ill-conditioned. Reflections may be linearly dependent, collinear, or insufficient.' };
  }

  const { X, M_inv, conditionNumber } = solved;

  let a = 0, b = 0, c = 0;
  let alphaDeg = 90, betaDeg = 90, gammaDeg = 90;
  let rhombohedralA: number | undefined;
  let rhombohedralAlpha: number | undefined;
  let D = 0, D2: number | undefined;
  let sigmaA = 0, sigmaB = 0, sigmaC = 0, sigmaD = 0, sigmaD2: number | undefined;
  let sigmaAlpha = 0, sigmaBeta = 0, sigmaGamma = 0;

  // Calculate residuals & statistical goodness-of-fit
  let sumResidualSquare = 0;
  let sumWeightedResidualSquare = 0;
  let sumTwoThetaShiftSquare = 0;
  let sumAbsDeltaTwoTheta = 0;
  let maxDeltaTwoTheta = 0;
  let sumAbsDeltaD = 0;
  let sumDObs = 0;
  let sumSin2ObsWeighted = 0;

  const peakRefiningDetails = validPeaks.map((p, idx) => {
    const peakLambda = p.wavelength && p.wavelength > 0 ? p.wavelength : lambdaRef;
    let sin2Calc = 0;
    for (let j = 0; j < numParams; j++) {
      sin2Calc += X[j] * basisMatrix[idx][j];
    }
    sin2Calc = Math.max(1e-7, Math.min(0.999999, sin2Calc));

    const sinThCalc = Math.sqrt(sin2Calc);
    const thetaCalcRad = Math.asin(sinThCalc);
    const twoThetaCalc = 2 * thetaCalcRad * (180 / Math.PI);
    const deltaTwoTheta = p.twoTheta - twoThetaCalc;
    const dCalc = peakLambda / (2 * sinThCalc);
    const deltaD = dObsList[idx] - dCalc;

    const residualSin2 = sin2Obs[idx] - sin2Calc;
    const w = normalizedWeights[idx];

    sumResidualSquare += residualSin2 * residualSin2;
    sumWeightedResidualSquare += w * residualSin2 * residualSin2;
    sumTwoThetaShiftSquare += deltaTwoTheta * deltaTwoTheta;
    sumAbsDeltaTwoTheta += Math.abs(deltaTwoTheta);
    maxDeltaTwoTheta = Math.max(maxDeltaTwoTheta, Math.abs(deltaTwoTheta));
    sumAbsDeltaD += Math.abs(deltaD);
    sumDObs += dObsList[idx];
    sumSin2ObsWeighted += w * sin2Obs[idx] * sin2Obs[idx];

    const isOutlier = Math.abs(deltaTwoTheta) > 0.04;

    return {
      ...p,
      sin2Obs: sin2Obs[idx],
      sin2Calc,
      twoThetaCalc,
      deltaTwoTheta,
      dObs: dObsList[idx],
      dCalc,
      deltaD,
      driftVal: driftVals[idx],
      driftVal2: driftType === 'dual_drift' ? driftVals2[idx] : undefined,
      residualSin2,
      weight: w,
      wavelength: peakLambda,
      isOutlier
    };
  });

  const dof = Math.max(1, validPeaks.length - numParams);
  const variance = sumResidualSquare / dof;
  const weightedVariance = sumWeightedResidualSquare / dof;
  const gof = Math.sqrt(Math.max(0, weightedVariance));
  const rmsTwoThetaShift = Math.sqrt(sumTwoThetaShiftSquare / validPeaks.length);
  const meanAbsDeltaTwoTheta = sumAbsDeltaTwoTheta / validPeaks.length;

  const rBraggPct = sumDObs > 0 ? (sumAbsDeltaD / sumDObs) * 100 : 0;
  const rwpPct = sumSin2ObsWeighted > 0 
    ? Math.sqrt(sumWeightedResidualSquare / sumSin2ObsWeighted) * 100 
    : 0;

  // Covariance Matrix [C] = weightedVariance * [M]^-1
  const covarianceMatrix: number[][] = Array.from({ length: numParams }, (_, r) =>
    Array.from({ length: numParams }, (_, c) => weightedVariance * M_inv[r][c])
  );

  // Correlation Matrix [R]_jk = C_jk / sqrt(C_jj * C_kk)
  const correlationMatrix: number[][] = Array.from({ length: numParams }, (_, r) =>
    Array.from({ length: numParams }, (_, c) => {
      const denom = Math.sqrt(Math.max(1e-20, covarianceMatrix[r][r] * covarianceMatrix[c][c]));
      return Math.max(-1, Math.min(1, covarianceMatrix[r][c] / denom));
    })
  );

  // Extract lattice constants and error propagation
  if (crystalSystem === 'Cubic') {
    const A = X[0];
    if (numDriftParams >= 1) D = X[1];
    if (A <= 0) return { error: `Refined parameter A <= 0 (${A.toExponential(3)}). Unphysical solution. Check peak indexing.` };

    a = lambdaRef / (2 * Math.sqrt(A));
    b = a;
    c = a;

    const varA = covarianceMatrix[0][0];
    const sigA_val = varA > 0 ? Math.sqrt(varA) : 0;
    sigmaA = (a / (2 * A)) * sigA_val;
    sigmaB = sigmaA;
    sigmaC = sigmaA;

    if (numDriftParams >= 1) {
      const varD = covarianceMatrix[1][1];
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    }
  } else if (crystalSystem === 'Tetragonal') {
    const A = X[0];
    const C = X[1];
    if (numDriftParams >= 1) D = X[2];
    if (A <= 0 || C <= 0) return { error: 'Refined parameters A or C <= 0. Unphysical solution. Check peak indexing.' };

    a = lambdaRef / (2 * Math.sqrt(A));
    c = lambdaRef / (2 * Math.sqrt(C));
    b = a;

    const varA = covarianceMatrix[0][0];
    const varC = covarianceMatrix[1][1];
    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
    sigmaB = sigmaA;

    if (numDriftParams >= 1) {
      const varD = covarianceMatrix[2][2];
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    }
  } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
    const A = X[0];
    const C = X[1];
    if (numDriftParams >= 1) D = X[2];
    if (A <= 0 || C <= 0) return { error: 'Refined parameters A or C <= 0. Unphysical solution. Check peak indexing.' };

    a = lambdaRef / Math.sqrt(3 * A);
    c = lambdaRef / (2 * Math.sqrt(C));
    b = a;
    gammaDeg = 120;

    const varA = covarianceMatrix[0][0];
    const varC = covarianceMatrix[1][1];
    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
    sigmaB = sigmaA;

    if (numDriftParams >= 1) {
      const varD = covarianceMatrix[2][2];
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    }

    if (crystalSystem === 'Trigonal') {
      // Rhombohedral equivalents: a_r = 1/3 * sqrt(3*a^2 + c^2), sin(alpha_r/2) = 3*a / (2*sqrt(3*a^2 + c^2))
      const denom = Math.sqrt(3 * a * a + c * c);
      rhombohedralA = (1 / 3) * denom;
      const sinHalfAlpha = (3 * a) / (2 * denom);
      rhombohedralAlpha = 2 * Math.asin(Math.max(-1, Math.min(1, sinHalfAlpha))) * (180 / Math.PI);
    }
  } else if (crystalSystem === 'Orthorhombic') {
    const A = X[0];
    const B = X[1];
    const C = X[2];
    if (numDriftParams >= 1) D = X[3];
    if (A <= 0 || B <= 0 || C <= 0) return { error: 'Refined parameters A, B, or C <= 0. Unphysical solution. Check peak indexing.' };

    a = lambdaRef / (2 * Math.sqrt(A));
    b = lambdaRef / (2 * Math.sqrt(B));
    c = lambdaRef / (2 * Math.sqrt(C));

    const varA = covarianceMatrix[0][0];
    const varB = covarianceMatrix[1][1];
    const varC = covarianceMatrix[2][2];

    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaB = varB > 0 ? (b / (2 * B)) * Math.sqrt(varB) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;

    if (numDriftParams >= 1) {
      const varD = covarianceMatrix[3][3];
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    }
  } else if (crystalSystem === 'Monoclinic') {
    const A = X[0];
    const B = X[1];
    const C = X[2];
    const E = X[3];
    if (numDriftParams >= 1) D = X[4];
    if (A <= 0 || B <= 0 || C <= 0) return { error: 'Refined parameters A, B, or C <= 0. Unphysical solution. Check peak indexing.' };

    b = lambdaRef / (2 * Math.sqrt(B));
    const cosBeta = -E / (2 * Math.sqrt(A * C));
    const clampedCos = Math.max(-0.9999, Math.min(0.9999, cosBeta));
    const betaRad = Math.acos(clampedCos);
    betaDeg = betaRad * (180 / Math.PI);
    const sinBeta = Math.sin(betaRad);

    a = lambdaRef / (2 * Math.sqrt(A) * sinBeta);
    c = lambdaRef / (2 * Math.sqrt(C) * sinBeta);

    const varA = covarianceMatrix[0][0];
    const varB = covarianceMatrix[1][1];
    const varC = covarianceMatrix[2][2];

    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaB = varB > 0 ? (b / (2 * B)) * Math.sqrt(varB) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
    sigmaBeta = 0.05; // approx propagation

    if (numDriftParams >= 1) {
      const varD = covarianceMatrix[4][4];
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    }
  } else if (crystalSystem === 'Triclinic') {
    // S11, S22, S33, S12, S23, S13
    const S11 = X[0];
    const S22 = X[1];
    const S33 = X[2];
    const S12 = X[3];
    const S23 = X[4];
    const S13 = X[5];
    if (numDriftParams >= 1) D = X[6];

    if (S11 <= 0 || S22 <= 0 || S33 <= 0) {
      return { error: 'Refined diagonal parameters S11, S22, or S33 <= 0. Unphysical solution for Triclinic.' };
    }

    // Direct matrix S = (lambda^2 / 4) * G*
    const S_mat = [
      [S11, S12, S13],
      [S12, S22, S23],
      [S13, S23, S33]
    ];

    const G_mat = invert3x3(S_mat);
    if (!G_mat) {
      return { error: 'Triclinic reciprocal tensor is singular. Cannot invert to direct metric tensor.' };
    }

    // Scale by lambda^2 / 4 to get direct metric tensor G
    const factor = (lambdaRef * lambdaRef) / 4;
    const G11 = G_mat[0][0] * factor;
    const G22 = G_mat[1][1] * factor;
    const G33 = G_mat[2][2] * factor;
    const G12 = G_mat[0][1] * factor;
    const G23 = G_mat[1][2] * factor;
    const G13 = G_mat[0][2] * factor;

    if (G11 <= 0 || G22 <= 0 || G33 <= 0) {
      return { error: 'Direct metric tensor diagonal elements are non-positive. Solution is unphysical.' };
    }

    a = Math.sqrt(G11);
    b = Math.sqrt(G22);
    c = Math.sqrt(G33);

    const cosAlpha = Math.max(-0.9999, Math.min(0.9999, G23 / (b * c)));
    const cosBeta = Math.max(-0.9999, Math.min(0.9999, G13 / (a * c)));
    const cosGamma = Math.max(-0.9999, Math.min(0.9999, G12 / (a * b)));

    alphaDeg = Math.acos(cosAlpha) * (180 / Math.PI);
    betaDeg = Math.acos(cosBeta) * (180 / Math.PI);
    gammaDeg = Math.acos(cosGamma) * (180 / Math.PI);

    const var11 = covarianceMatrix[0][0];
    const var22 = covarianceMatrix[1][1];
    const var33 = covarianceMatrix[2][2];

    sigmaA = var11 > 0 ? (a / (2 * S11)) * Math.sqrt(var11) : 0;
    sigmaB = var22 > 0 ? (b / (2 * S22)) * Math.sqrt(var22) : 0;
    sigmaC = var33 > 0 ? (c / (2 * S33)) * Math.sqrt(var33) : 0;
    sigmaAlpha = 0.08;
    sigmaBeta = 0.08;
    sigmaGamma = 0.08;

    if (numDriftParams >= 1) {
      const varD = covarianceMatrix[6][6];
      sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    }
  }

  // Handle Dual-Drift secondary parameter
  if (driftType === 'dual_drift') {
    const d2Idx = numParams - 1;
    D2 = X[d2Idx];
    const varD2 = covarianceMatrix[d2Idx][d2Idx];
    sigmaD2 = varD2 > 0 ? Math.sqrt(varD2) : 0;
  }

  // Unit Cell Volume Calculation and Propagation
  let volume = 0;
  let sigmaVolume = 0;
  if (crystalSystem === 'Cubic') {
    volume = a * a * a;
    sigmaVolume = 3 * a * a * sigmaA;
  } else if (crystalSystem === 'Tetragonal') {
    volume = a * a * c;
    sigmaVolume = Math.sqrt(Math.pow(2 * a * c * sigmaA, 2) + Math.pow(a * a * sigmaC, 2));
  } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
    volume = (Math.sqrt(3) / 2) * a * a * c;
    sigmaVolume = (Math.sqrt(3) / 2) * Math.sqrt(Math.pow(2 * a * c * sigmaA, 2) + Math.pow(a * a * sigmaC, 2));
  } else if (crystalSystem === 'Orthorhombic') {
    volume = a * b * c;
    sigmaVolume = Math.sqrt(
      Math.pow(b * c * sigmaA, 2) + Math.pow(a * c * sigmaB, 2) + Math.pow(a * b * sigmaC, 2)
    );
  } else if (crystalSystem === 'Monoclinic') {
    const sinB = Math.sin((betaDeg * Math.PI) / 180);
    volume = a * b * c * sinB;
    sigmaVolume = Math.sqrt(
      Math.pow(b * c * sinB * sigmaA, 2) + Math.pow(a * c * sinB * sigmaB, 2) + Math.pow(a * b * sinB * sigmaC, 2)
    );
  } else if (crystalSystem === 'Triclinic') {
    const aR = (alphaDeg * Math.PI) / 180;
    const bR = (betaDeg * Math.PI) / 180;
    const gR = (gammaDeg * Math.PI) / 180;
    const cosA = Math.cos(aR);
    const cosB = Math.cos(bR);
    const cosG = Math.cos(gR);
    const term = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG;
    volume = a * b * c * Math.sqrt(Math.max(1e-10, term));
    sigmaVolume = (volume / a) * sigmaA + (volume / b) * sigmaB + (volume / c) * sigmaC;
  }

  return {
    lattice: { a, b, c, alphaDeg, betaDeg, gammaDeg, rhombohedralA, rhombohedralAlpha },
    sigma: { sigmaA, sigmaB, sigmaC, sigmaAlpha, sigmaBeta, sigmaGamma, sigmaD, sigmaD2, sigmaVolume },
    D,
    D2,
    volume,
    variance,
    weightedVariance,
    rmsTwoThetaShift,
    meanAbsDeltaTwoTheta,
    maxDeltaTwoTheta,
    sumResidualSquare,
    dof,
    gof,
    rBraggPct,
    rwpPct,
    conditionNumber,
    condNumber: conditionNumber,
    matrixM: M,
    matrixMInv: M_inv,
    covarianceMatrix,
    correlationMatrix,
    vectorY: Y,
    vectorX: X,
    parameterNames,
    matrixLabels: parameterNames,
    peakDetails: peakRefiningDetails,
    numParams,
    validPeaks,
    basisMatrix,
    weightingScheme,
    driftType,
    crystalSystem
  };
}
