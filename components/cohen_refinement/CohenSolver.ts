import { CrystalSystem, DriftFunctionType, PeakInput } from './CohenPresetsDb';

export interface CohenRefinementOutput {
  lattice: { a: number; b: number; c: number; betaDeg: number };
  sigma: { sigmaA: number; sigmaB: number; sigmaC: number; sigmaD: number; sigmaVolume: number };
  D: number;
  volume: number;
  variance: number;
  rmsTwoThetaShift: number;
  sumResidualSquare: number;
  dof: number;
  matrixM: number[][];
  matrixMInv: number[][];
  vectorY: number[];
  vectorX: number[];
  peakDetails: {
    id: string;
    twoTheta: number;
    twoThetaCalc: number;
    deltaTwoTheta: number;
    h: number;
    k: number;
    l: number;
    sin2Obs: number;
    sin2Calc: number;
    driftVal: number;
    residualSin2: number;
    intensity?: number;
    enabled?: boolean;
  }[];
  numParams: number;
  validPeaks: PeakInput[];
  basisMatrix: number[][];
}

export type CohenRefinementResult = CohenRefinementOutput | { error: string };

// Gaussian elimination solver with partial pivoting
export function solveLinearSystem(M: number[][], Y: number[]): { X: number[]; M_inv: number[][] } | null {
  const n = M.length;
  // Augmented matrix [M | I | Y]
  const aug: number[][] = Array.from({ length: n }, (_, i) => [
    ...M[i],
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    Y[i]
  ]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    if (Math.abs(aug[maxRow][col]) < 1e-12) {
      return null; // Singular matrix
    }
    // Swap rows
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

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

  return { X, M_inv };
}

// Drift Function Calculation
export function calculateDrift(twoThetaDeg: number, type: DriftFunctionType): number {
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
    default:
      return 0.5 * ((cosTh * cosTh) / sinTh + (cosTh * cosTh) / thetaRad);
  }
}

// Core Cohen least-squares matrix solver
export function runCohenRefinement(
  peaks: PeakInput[],
  crystalSystem: CrystalSystem,
  driftType: DriftFunctionType,
  wavelength: number
): CohenRefinementResult {
  const enabledPeaks = peaks.filter(p => p.enabled !== false);
  if (enabledPeaks.length < 2) {
    return { error: 'At least 2 enabled reflection peaks are required for least-squares matrix refinement.' };
  }

  const lambda = wavelength;

  // Filter valid peaks
  const validPeaks = enabledPeaks.filter(p => p.twoTheta > 0 && p.twoTheta < 180);
  if (validPeaks.length < 2) {
    return { error: 'Invalid 2θ angles detected. Peaks must be strictly between 0° and 180°.' };
  }

  let numParams = 2; // Default cubic
  if (crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal') numParams = 3;
  if (crystalSystem === 'Orthorhombic') numParams = 4;
  if (crystalSystem === 'Monoclinic') numParams = 5;

  if (validPeaks.length <= numParams - 1) {
    return { 
      error: `Insufficient reflections (${validPeaks.length} enabled). ${crystalSystem} crystal system with drift refinement requires at least ${numParams} non-co-linear peaks.` 
    };
  }

  // Symmetry checks
  if (crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal') {
    const hasNonZeroL = validPeaks.some(p => p.l !== 0);
    if (!hasNonZeroL) {
      return {
        error: `All active reflections have l = 0. In ${crystalSystem} symmetry, parameter 'c' cannot be determined without reflections having l ≠ 0.`
      };
    }
  }

  const sin2Obs: number[] = [];
  const driftVals: number[] = [];
  const basisMatrix: number[][] = [];

  for (let i = 0; i < validPeaks.length; i++) {
    const p = validPeaks[i];
    const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
    const sinTh = Math.sin(thetaRad);
    const s2 = sinTh * sinTh;
    sin2Obs.push(s2);

    const fTh = calculateDrift(p.twoTheta, driftType);
    driftVals.push(fTh);

    let row: number[] = [];
    const h2 = p.h * p.h;
    const k2 = p.k * p.k;
    const l2 = p.l * p.l;

    if (crystalSystem === 'Cubic') {
      const s = h2 + k2 + l2;
      row = [s, fTh];
    } else if (crystalSystem === 'Tetragonal') {
      const s = h2 + k2;
      row = [s, l2, fTh];
    } else if (crystalSystem === 'Hexagonal') {
      const s = h2 + p.h * p.k + k2;
      row = [s, l2, fTh];
    } else if (crystalSystem === 'Orthorhombic') {
      row = [h2, k2, l2, fTh];
    } else if (crystalSystem === 'Monoclinic') {
      row = [h2, k2, l2, p.h * p.l, fTh];
    }

    basisMatrix.push(row);
  }

  // Build Normal Equations Matrix M (numParams x numParams) and RHS Vector Y (numParams)
  const M: number[][] = Array.from({ length: numParams }, () => Array(numParams).fill(0));
  const Y: number[] = Array(numParams).fill(0);

  for (let j = 0; j < numParams; j++) {
    for (let k = 0; k < numParams; k++) {
      let sum = 0;
      for (let i = 0; i < validPeaks.length; i++) {
        sum += basisMatrix[i][j] * basisMatrix[i][k];
      }
      M[j][k] = sum;
    }

    let ySum = 0;
    for (let i = 0; i < validPeaks.length; i++) {
      ySum += basisMatrix[i][j] * sin2Obs[i];
    }
    Y[j] = ySum;
  }

  // Solve M * X = Y
  const solved = solveLinearSystem(M, Y);
  if (!solved) {
    return { error: 'Normal matrix [M] is singular or ill-conditioned. Reflections may be linearly dependent or insufficient.' };
  }

  const { X, M_inv } = solved;

  let a = 0, b = 0, c = 0, betaDeg = 90, D = 0;
  let sigmaA = 0, sigmaB = 0, sigmaC = 0, sigmaD = 0;

  // Calculate residuals
  let sumResidualSquare = 0;
  let sumTwoThetaShiftSquare = 0;

  const peakRefiningDetails = validPeaks.map((p, idx) => {
    let sin2Calc = 0;
    for (let j = 0; j < numParams; j++) {
      sin2Calc += X[j] * basisMatrix[idx][j];
    }
    sin2Calc = Math.max(1e-7, Math.min(0.999999, sin2Calc));

    const sinThCalc = Math.sqrt(sin2Calc);
    const thetaCalcRad = Math.asin(sinThCalc);
    const twoThetaCalc = 2 * thetaCalcRad * (180 / Math.PI);
    const deltaTwoTheta = p.twoTheta - twoThetaCalc;

    const residualSin2 = sin2Obs[idx] - sin2Calc;
    sumResidualSquare += residualSin2 * residualSin2;
    sumTwoThetaShiftSquare += deltaTwoTheta * deltaTwoTheta;

    return {
      ...p,
      sin2Obs: sin2Obs[idx],
      sin2Calc,
      twoThetaCalc,
      deltaTwoTheta,
      driftVal: driftVals[idx],
      residualSin2
    };
  });

  const dof = Math.max(1, validPeaks.length - numParams);
  const variance = sumResidualSquare / dof;
  const rmsTwoThetaShift = Math.sqrt(sumTwoThetaShiftSquare / validPeaks.length);

  // Extract lattice constants and error propagation
  if (crystalSystem === 'Cubic') {
    const A = X[0];
    D = X[1];
    if (A <= 0) return { error: 'Refined parameter A <= 0. Unphysical solution.' };

    a = lambda / (2 * Math.sqrt(A));
    const varA = variance * M_inv[0][0];
    const varD = variance * M_inv[1][1];
    
    const sigA_val = varA > 0 ? Math.sqrt(varA) : 0;
    sigmaA = (a / (2 * A)) * sigA_val;
    sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
    b = a;
    c = a;
  } else if (crystalSystem === 'Tetragonal') {
    const A = X[0];
    const C = X[1];
    D = X[2];
    if (A <= 0 || C <= 0) return { error: 'Refined parameters A or C <= 0. Unphysical solution.' };

    a = lambda / (2 * Math.sqrt(A));
    c = lambda / (2 * Math.sqrt(C));
    b = a;

    const varA = variance * M_inv[0][0];
    const varC = variance * M_inv[1][1];
    const varD = variance * M_inv[2][2];

    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
    sigmaB = sigmaA;
    sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
  } else if (crystalSystem === 'Hexagonal') {
    const A = X[0];
    const C = X[1];
    D = X[2];
    if (A <= 0 || C <= 0) return { error: 'Refined parameters A or C <= 0. Unphysical solution.' };

    a = lambda / Math.sqrt(3 * A);
    c = lambda / (2 * Math.sqrt(C));
    b = a;

    const varA = variance * M_inv[0][0];
    const varC = variance * M_inv[1][1];
    const varD = variance * M_inv[2][2];

    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
    sigmaB = sigmaA;
    sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
  } else if (crystalSystem === 'Orthorhombic') {
    const A = X[0];
    const B = X[1];
    const C = X[2];
    D = X[3];
    if (A <= 0 || B <= 0 || C <= 0) return { error: 'Refined parameters A, B, or C <= 0. Unphysical solution.' };

    a = lambda / (2 * Math.sqrt(A));
    b = lambda / (2 * Math.sqrt(B));
    c = lambda / (2 * Math.sqrt(C));

    const varA = variance * M_inv[0][0];
    const varB = variance * M_inv[1][1];
    const varC = variance * M_inv[2][2];
    const varD = variance * M_inv[3][3];

    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaB = varB > 0 ? (b / (2 * B)) * Math.sqrt(varB) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
    sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
  } else if (crystalSystem === 'Monoclinic') {
    const A = X[0];
    const B = X[1];
    const C = X[2];
    const E = X[3];
    D = X[4];
    if (A <= 0 || B <= 0 || C <= 0) return { error: 'Refined parameters A, B, or C <= 0. Unphysical solution.' };

    b = lambda / (2 * Math.sqrt(B));
    const cosBeta = -E / (2 * Math.sqrt(A * C));
    const clampedCos = Math.max(-0.9999, Math.min(0.9999, cosBeta));
    const betaRad = Math.acos(clampedCos);
    betaDeg = betaRad * (180 / Math.PI);
    const sinBeta = Math.sin(betaRad);

    a = lambda / (2 * Math.sqrt(A) * sinBeta);
    c = lambda / (2 * Math.sqrt(C) * sinBeta);

    const varA = variance * M_inv[0][0];
    const varB = variance * M_inv[1][1];
    const varC = variance * M_inv[2][2];
    const varD = variance * M_inv[4][4];

    sigmaA = varA > 0 ? (a / (2 * A)) * Math.sqrt(varA) : 0;
    sigmaB = varB > 0 ? (b / (2 * B)) * Math.sqrt(varB) : 0;
    sigmaC = varC > 0 ? (c / (2 * C)) * Math.sqrt(varC) : 0;
    sigmaD = varD > 0 ? Math.sqrt(varD) : 0;
  }

  // Unit Cell Volume Calculation
  let volume = 0;
  let sigmaVolume = 0;
  if (crystalSystem === 'Cubic') {
    volume = a * a * a;
    sigmaVolume = 3 * a * a * sigmaA;
  } else if (crystalSystem === 'Tetragonal') {
    volume = a * a * c;
    sigmaVolume = Math.sqrt(Math.pow(2 * a * c * sigmaA, 2) + Math.pow(a * a * sigmaC, 2));
  } else if (crystalSystem === 'Hexagonal') {
    volume = (Math.sqrt(3) / 2) * a * a * c;
    sigmaVolume = (Math.sqrt(3) / 2) * Math.sqrt(Math.pow(2 * a * c * sigmaA, 2) + Math.pow(a * a * sigmaC, 2));
  } else if (crystalSystem === 'Orthorhombic') {
    volume = a * b * c;
    sigmaVolume = Math.sqrt(
      Math.pow(b * c * sigmaA, 2) + Math.pow(a * c * sigmaB, 2) + Math.pow(a * b * sigmaC, 2)
    );
  } else if (crystalSystem === 'Monoclinic') {
    const sinB = Math.sin(betaDeg * Math.PI / 180);
    volume = a * b * c * sinB;
    sigmaVolume = Math.sqrt(
      Math.pow(b * c * sinB * sigmaA, 2) + Math.pow(a * c * sinB * sigmaB, 2) + Math.pow(a * b * sinB * sigmaC, 2)
    );
  }

  return {
    lattice: { a, b, c, betaDeg },
    sigma: { sigmaA, sigmaB, sigmaC, sigmaD, sigmaVolume },
    D,
    volume,
    variance,
    rmsTwoThetaShift,
    sumResidualSquare,
    dof,
    matrixM: M,
    matrixMInv: M_inv,
    vectorY: Y,
    vectorX: X,
    peakDetails: peakRefiningDetails,
    numParams,
    validPeaks,
    basisMatrix
  };
}
