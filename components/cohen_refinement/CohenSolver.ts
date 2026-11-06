import { CrystalSystem, DriftFunctionType, WeightingScheme, PeakInput } from './CohenPresetsDb';

export interface CohenPhysicalAberrations {
  goniometerRadiusMm: number;
  sampleDisplacementUm: number; // Equivalent specimen z-offset in micrometers
  zeroShiftMdeg: number; // Equivalent 2theta encoder zero-offset in millidegrees
  transparencyDepthUm: number; // Effective penetration depth in micrometers
  primaryMechanism: string;
}

export interface CohenPeakDetail {
  id: string;
  twoTheta: number;
  twoThetaCalc: number;
  twoThetaZeroDrift: number;
  deltaTwoTheta: number;
  dObs: number;
  dCalc: number;
  deltaD: number;
  deltaDPpm: number;
  apparentA: number;
  correctedA: number;
  h: number;
  k: number;
  l: number;
  sin2Obs: number;
  sin2Calc: number;
  sin2ZeroDrift: number;
  driftVal: number;
  driftVal2?: number;
  residualSin2: number;
  weight: number;
  leverageHii: number;
  studentizedResidual: number;
  cooksDistance: number;
  intensity?: number;
  enabled?: boolean;
  wavelength?: number;
  isOutlier?: boolean;
}

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
    sigmaRhombohedralA?: number;
    sigmaRhombohedralAlpha?: number;
  };
  D: number;
  D2?: number;
  volume: number;
  variance: number;
  weightedVariance: number;
  rmsTwoThetaShift: number;
  meanAbsDeltaTwoTheta: number;
  maxDeltaTwoTheta: number;
  rmsDeltaDPpm: number;
  sumResidualSquare: number;
  dof: number;
  gof: number; // Goodness-of-Fit = sqrt(weightedVariance)
  rBraggPct: number;
  rwpPct: number;
  smithSnyderFN: number; // F_N figure of merit
  deWolffM20: number; // M_20 figure of merit
  aic: number; // Akaike Information Criterion
  bic: number; // Bayesian Information Criterion
  maxCooksDistance: number;
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
  peakDetails: CohenPeakDetail[];
  aberrations: CohenPhysicalAberrations;
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

  let maxPivot = 0;
  let minPivot = Infinity;

  for (let col = 0; col < n; col++) {
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

    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n + 1; j++) {
      aug[col][j] /= pivot;
    }

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

  // Compute true 1-norm condition number kappa_1(M) = ||M||_1 * ||M^-1||_1
  const norm1 = (mat: number[][]) => {
    let maxCol = 0;
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += Math.abs(mat[i][j]);
      if (s > maxCol) maxCol = s;
    }
    return maxCol;
  };
  const cond1 = norm1(M) * norm1(M_inv);
  const conditionNumber = Number.isFinite(cond1) && cond1 > 0 ? cond1 : (minPivot > 0 ? maxPivot / minPivot : 1e12);

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
    case 'taylor_sinclair': {
      // Taylor-Sinclair: sin(2*theta) * 0.5 * (1/sin(theta) + 1/theta) = cos(theta) * (1 + sin(theta)/theta) * cos(theta)
      return 0.5 * cosTh * cosTh * (1 / sinTh + 1 / thetaRad) * sinTh;
    }
    case 'bradley_jay':
      return cosTh * cosTh;
    case 'sample_displacement':
      return cosTh * cosTh * sinTh;
    case 'hess_hagg':
      return Math.sin(2 * thetaRad) * Math.sin(2 * thetaRad);
    case 'zero_shift':
      return Math.sin(2 * thetaRad);
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
    case 'huber_robust':
      // w_i = 1 / sin^2(2theta) maps sin^2(theta) least squares into uniform angular 2theta variance
      return 1 / Math.max(1e-5, sin2_2Th);
    case 'statistical': {
      const tanTh = Math.tan(thetaRad);
      return Math.max(0.01, (tanTh * tanTh) / Math.max(1e-4, dObs * dObs));
    }
    case 'intensity': {
      return Math.sqrt(I) / Math.max(1e-5, sin2_2Th);
    }
    case 'unit':
    default:
      return 1.0;
  }
}

// Helper to map parameter vector X to direct lattice parameters & volume
function mapVectorXToLattice(
  X: number[],
  crystalSystem: CrystalSystem,
  lambdaRef: number,
  numDriftParams: number,
  driftType: DriftFunctionType
): {
  a: number;
  b: number;
  c: number;
  alphaDeg: number;
  betaDeg: number;
  gammaDeg: number;
  volume: number;
  rhombohedralA: number;
  rhombohedralAlpha: number;
  D: number;
  D2: number;
} | null {
  let a = 0, b = 0, c = 0;
  let alphaDeg = 90, betaDeg = 90, gammaDeg = 90;
  let rhombohedralA = 0, rhombohedralAlpha = 90;
  let D = 0, D2 = 0;

  if (crystalSystem === 'Cubic') {
    const A = X[0];
    if (A <= 0) return null;
    if (numDriftParams >= 1) D = X[1];
    a = lambdaRef / (2 * Math.sqrt(A));
    b = a;
    c = a;
  } else if (crystalSystem === 'Tetragonal') {
    const A = X[0];
    const C = X[1];
    if (A <= 0 || C <= 0) return null;
    if (numDriftParams >= 1) D = X[2];
    a = lambdaRef / (2 * Math.sqrt(A));
    c = lambdaRef / (2 * Math.sqrt(C));
    b = a;
  } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
    const A = X[0];
    const C = X[1];
    if (A <= 0 || C <= 0) return null;
    if (numDriftParams >= 1) D = X[2];
    a = lambdaRef / Math.sqrt(3 * A);
    c = lambdaRef / (2 * Math.sqrt(C));
    b = a;
    gammaDeg = 120;
    if (crystalSystem === 'Trigonal') {
      const denom = Math.sqrt(3 * a * a + c * c);
      rhombohedralA = (1 / 3) * denom;
      const sinHalfAlpha = (3 * a) / (2 * denom);
      rhombohedralAlpha = 2 * Math.asin(Math.max(-1, Math.min(1, sinHalfAlpha))) * (180 / Math.PI);
    }
  } else if (crystalSystem === 'Orthorhombic') {
    const A = X[0];
    const B = X[1];
    const C = X[2];
    if (A <= 0 || B <= 0 || C <= 0) return null;
    if (numDriftParams >= 1) D = X[3];
    a = lambdaRef / (2 * Math.sqrt(A));
    b = lambdaRef / (2 * Math.sqrt(B));
    c = lambdaRef / (2 * Math.sqrt(C));
  } else if (crystalSystem === 'Monoclinic') {
    const A = X[0];
    const B = X[1];
    const C = X[2];
    const E = X[3];
    if (A <= 0 || B <= 0 || C <= 0) return null;
    if (numDriftParams >= 1) D = X[4];
    b = lambdaRef / (2 * Math.sqrt(B));
    const cosBeta = -E / (2 * Math.sqrt(A * C));
    const clampedCos = Math.max(-0.9999, Math.min(0.9999, cosBeta));
    const betaRad = Math.acos(clampedCos);
    betaDeg = betaRad * (180 / Math.PI);
    const sinBeta = Math.sin(betaRad);
    a = lambdaRef / (2 * Math.sqrt(A) * sinBeta);
    c = lambdaRef / (2 * Math.sqrt(C) * sinBeta);
  } else if (crystalSystem === 'Triclinic') {
    const S11 = X[0];
    const S22 = X[1];
    const S33 = X[2];
    const S12 = X[3];
    const S23 = X[4];
    const S13 = X[5];
    if (S11 <= 0 || S22 <= 0 || S33 <= 0) return null;
    if (numDriftParams >= 1) D = X[6];

    const S_mat = [
      [S11, S12, S13],
      [S12, S22, S23],
      [S13, S23, S33]
    ];
    const G_mat = invert3x3(S_mat);
    if (!G_mat) return null;

    const factor = (lambdaRef * lambdaRef) / 4;
    const G11 = G_mat[0][0] * factor;
    const G22 = G_mat[1][1] * factor;
    const G33 = G_mat[2][2] * factor;
    const G12 = G_mat[0][1] * factor;
    const G23 = G_mat[1][2] * factor;
    const G13 = G_mat[0][2] * factor;
    if (G11 <= 0 || G22 <= 0 || G33 <= 0) return null;

    a = Math.sqrt(G11);
    b = Math.sqrt(G22);
    c = Math.sqrt(G33);

    const cosAlpha = Math.max(-0.9999, Math.min(0.9999, G23 / (b * c)));
    const cosBeta = Math.max(-0.9999, Math.min(0.9999, G13 / (a * c)));
    const cosGamma = Math.max(-0.9999, Math.min(0.9999, G12 / (a * b)));

    alphaDeg = Math.acos(cosAlpha) * (180 / Math.PI);
    betaDeg = Math.acos(cosBeta) * (180 / Math.PI);
    gammaDeg = Math.acos(cosGamma) * (180 / Math.PI);
  }

  if (driftType === 'dual_drift') {
    D2 = X[X.length - 1];
  }

  const aR = (alphaDeg * Math.PI) / 180;
  const bR = (betaDeg * Math.PI) / 180;
  const gR = (gammaDeg * Math.PI) / 180;
  const cosA = Math.cos(aR);
  const cosB = Math.cos(bR);
  const cosG = Math.cos(gR);
  const term = 1 - cosA * cosA - cosB * cosB - cosG * cosG + 2 * cosA * cosB * cosG;
  const volume = a * b * c * Math.sqrt(Math.max(1e-12, term));

  return {
    a,
    b,
    c,
    alphaDeg,
    betaDeg,
    gammaDeg,
    volume,
    rhombohedralA,
    rhombohedralAlpha,
    D,
    D2
  };
}

// Core Cohen Analytical Least-Squares Solver
export function runCohenRefinement(
  peaks: PeakInput[],
  crystalSystem: CrystalSystem,
  driftType: DriftFunctionType = 'nelson_riley',
  wavelength: number = 1.54056,
  weightingScheme: WeightingScheme = 'hess_hagg',
  goniometerRadiusMm: number = 240
): CohenRefinementResult {
  const enabledPeaks = peaks.filter(p => p.enabled !== false);
  if (enabledPeaks.length < 2) {
    return { error: 'At least 2 enabled reflection peaks are required for least-squares matrix refinement.' };
  }

  const lambdaRef = wavelength;

  const validPeaks = enabledPeaks.filter(p => p.twoTheta > 0 && p.twoTheta < 180);
  if (validPeaks.length < 2) {
    return { error: 'Invalid 2θ angles detected. Peaks must be strictly between 0° and 180°.' };
  }

  let numLatticeParams = 1; // Cubic
  let parameterNames: string[] = ['A (λ²/4a²)'];

  if (crystalSystem === 'Tetragonal') {
    numLatticeParams = 2;
    parameterNames = ['A (λ²/4a²)', 'C (λ²/4c²)'];
  } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
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
  const baseWeights: number[] = [];
  const basisMatrix: number[][] = [];
  const dObsList: number[] = [];

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
    baseWeights.push(w);

    const fTh = calculateDrift(p.twoTheta, driftType);
    driftVals.push(fTh);

    const fTh2 = driftType === 'dual_drift' ? Math.sin(2 * thetaRad) : 0;
    driftVals2.push(fTh2);

    const lambdaScale = Math.pow(peakLambda / lambdaRef, 2);

    let row: number[] = [];
    const h2 = p.h * p.h;
    const k2 = p.k * p.k;
    const l2 = p.l * p.l;

    if (crystalSystem === 'Cubic') {
      row = [(h2 + k2 + l2) * lambdaScale];
    } else if (crystalSystem === 'Tetragonal') {
      row = [(h2 + k2) * lambdaScale, l2 * lambdaScale];
    } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
      row = [(h2 + p.h * p.k + k2) * lambdaScale, l2 * lambdaScale];
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

    if (driftType === 'dual_drift') {
      row.push(fTh, fTh2);
    } else if (driftType !== 'none') {
      row.push(fTh);
    }

    basisMatrix.push(row);
  }

  // Helper to build and solve weighted normal equations
  const buildAndSolve = (rawW: number[]) => {
    const sumW = rawW.reduce((acc, v) => acc + v, 0);
    const normFactor = validPeaks.length / Math.max(1e-12, sumW);
    const normW = rawW.map(w => w * normFactor);

    const M: number[][] = Array.from({ length: numParams }, () => Array(numParams).fill(0));
    const Y: number[] = Array(numParams).fill(0);

    for (let j = 0; j < numParams; j++) {
      for (let k = 0; k < numParams; k++) {
        let sum = 0;
        for (let i = 0; i < validPeaks.length; i++) {
          sum += normW[i] * basisMatrix[i][j] * basisMatrix[i][k];
        }
        M[j][k] = sum;
      }

      let ySum = 0;
      for (let i = 0; i < validPeaks.length; i++) {
        ySum += normW[i] * basisMatrix[i][j] * sin2Obs[i];
      }
      Y[j] = ySum;
    }

    const solved = solveLinearSystem(M, Y);
    return solved ? { ...solved, M, Y, normW } : null;
  };

  let activeWeights = [...baseWeights];
  let solvedState = buildAndSolve(activeWeights);
  if (!solvedState) {
    return { error: 'Normal matrix [M] is singular or ill-conditioned. Reflections may be linearly dependent, collinear, or insufficient.' };
  }

  // If Huber IRLS Robust weighting is active, perform 5 IRLS iterations
  if (weightingScheme === 'huber_robust' && validPeaks.length > numParams) {
    for (let iter = 0; iter < 5; iter++) {
      const { X } = solvedState;
      const absRes: number[] = [];
      const resList: number[] = [];
      for (let i = 0; i < validPeaks.length; i++) {
        let s2c = 0;
        for (let j = 0; j < numParams; j++) s2c += X[j] * basisMatrix[i][j];
        const r = sin2Obs[i] - s2c;
        resList.push(r);
        absRes.push(Math.abs(r));
      }
      const sortedAbs = [...absRes].sort((a, b) => a - b);
      const mad = sortedAbs[Math.floor(sortedAbs.length / 2)] || 1e-6;
      const scale = Math.max(1e-7, 1.4826 * mad);
      const huberK = 1.345 * scale;

      const nextWeights = baseWeights.map((bw, i) => {
        const ar = Math.abs(resList[i]);
        const huberFactor = ar <= huberK ? 1.0 : huberK / ar;
        return bw * huberFactor;
      });
      const nextSolved = buildAndSolve(nextWeights);
      if (nextSolved) {
        solvedState = nextSolved;
      }
    }
  }

  const { X, M_inv, conditionNumber, M, Y, normW: normalizedWeights } = solvedState;

  const baseMapped = mapVectorXToLattice(X, crystalSystem, lambdaRef, numDriftParams, driftType);
  if (!baseMapped) {
    return { error: 'Refined lattice parameters are non-positive or unphysical. Verify Miller indices (hkl) and crystal symmetry.' };
  }

  const {
    a,
    b,
    c,
    alphaDeg,
    betaDeg,
    gammaDeg,
    volume,
    rhombohedralA,
    rhombohedralAlpha,
    D,
    D2
  } = baseMapped;

  // Calculate residuals, leverage h_ii, studentized residuals, and Cook's distance
  let sumResidualSquare = 0;
  let sumWeightedResidualSquare = 0;
  let sumTwoThetaShiftSquare = 0;
  let sumAbsDeltaTwoTheta = 0;
  let maxDeltaTwoTheta = 0;
  let sumAbsDeltaD = 0;
  let sumDObs = 0;
  let sumDeltaDPpmSquare = 0;
  let sumSin2ObsWeighted = 0;

  const rawDetails = validPeaks.map((p, idx) => {
    const peakLambda = p.wavelength && p.wavelength > 0 ? p.wavelength : lambdaRef;
    let sin2Calc = 0;
    let sin2ZeroDrift = 0;
    for (let j = 0; j < numParams; j++) {
      sin2Calc += X[j] * basisMatrix[idx][j];
      if (j < numLatticeParams) {
        sin2ZeroDrift += X[j] * basisMatrix[idx][j];
      }
    }
    sin2Calc = Math.max(1e-7, Math.min(0.999999, sin2Calc));
    sin2ZeroDrift = Math.max(1e-7, Math.min(0.999999, sin2ZeroDrift));

    const sinThCalc = Math.sqrt(sin2Calc);
    const twoThetaCalc = 2 * Math.asin(sinThCalc) * (180 / Math.PI);
    const twoThetaZeroDrift = 2 * Math.asin(Math.sqrt(sin2ZeroDrift)) * (180 / Math.PI);
    const deltaTwoTheta = p.twoTheta - twoThetaCalc;

    const dCalc = peakLambda / (2 * sinThCalc);
    const deltaD = dObsList[idx] - dCalc;
    const deltaDPpm = (deltaD / Math.max(1e-6, dCalc)) * 1e6;

    // Apparent lattice parameter a_app and zero-drift corrected a_corr
    const apparentA = a * Math.sqrt(sin2ZeroDrift / Math.max(1e-8, sin2Obs[idx]));
    const correctedSin2 = Math.max(1e-8, sin2Obs[idx] - (sin2Calc - sin2ZeroDrift));
    const correctedA = a * Math.sqrt(sin2ZeroDrift / correctedSin2);

    const residualSin2 = sin2Obs[idx] - sin2Calc;
    const w = normalizedWeights[idx];

    // Hat matrix diagonal leverage h_ii = w_i * g_i^T * M^-1 * g_i
    let quadForm = 0;
    for (let r = 0; r < numParams; r++) {
      for (let col = 0; col < numParams; col++) {
        quadForm += basisMatrix[idx][r] * M_inv[r][col] * basisMatrix[idx][col];
      }
    }
    const leverageHii = Math.max(0, Math.min(0.999, w * quadForm));

    sumResidualSquare += residualSin2 * residualSin2;
    sumWeightedResidualSquare += w * residualSin2 * residualSin2;
    sumTwoThetaShiftSquare += deltaTwoTheta * deltaTwoTheta;
    sumAbsDeltaTwoTheta += Math.abs(deltaTwoTheta);
    maxDeltaTwoTheta = Math.max(maxDeltaTwoTheta, Math.abs(deltaTwoTheta));
    sumAbsDeltaD += Math.abs(deltaD);
    sumDObs += dObsList[idx];
    sumDeltaDPpmSquare += deltaDPpm * deltaDPpm;
    sumSin2ObsWeighted += w * sin2Obs[idx] * sin2Obs[idx];

    return {
      ...p,
      sin2Obs: sin2Obs[idx],
      sin2Calc,
      sin2ZeroDrift,
      twoThetaCalc,
      twoThetaZeroDrift,
      deltaTwoTheta,
      dObs: dObsList[idx],
      dCalc,
      deltaD,
      deltaDPpm,
      apparentA,
      correctedA,
      driftVal: driftVals[idx],
      driftVal2: driftType === 'dual_drift' ? driftVals2[idx] : undefined,
      residualSin2,
      weight: w,
      leverageHii,
      wavelength: peakLambda
    };
  });

  const dof = Math.max(1, validPeaks.length - numParams);
  const variance = sumResidualSquare / dof;
  const weightedVariance = sumWeightedResidualSquare / dof;
  const gof = Math.sqrt(Math.max(0, weightedVariance));
  const rmsTwoThetaShift = Math.sqrt(sumTwoThetaShiftSquare / validPeaks.length);
  const meanAbsDeltaTwoTheta = sumAbsDeltaTwoTheta / validPeaks.length;
  const rmsDeltaDPpm = Math.sqrt(sumDeltaDPpmSquare / validPeaks.length);

  let maxCooksDistance = 0;
  const sigmaScale = Math.sqrt(Math.max(1e-18, weightedVariance));

  const peakRefiningDetails: CohenPeakDetail[] = rawDetails.map(d => {
    const denom = sigmaScale * Math.sqrt(Math.max(1e-6, (1 - d.leverageHii) / Math.max(1e-6, d.weight)));
    const studentizedResidual = d.residualSin2 / denom;
    const cooksDistance =
      ((studentizedResidual * studentizedResidual) / numParams) *
      (d.leverageHii / Math.max(1e-4, 1 - d.leverageHii));
    if (cooksDistance > maxCooksDistance) maxCooksDistance = cooksDistance;
    const isOutlier = Math.abs(d.deltaTwoTheta) > 0.04 || Math.abs(studentizedResidual) > 2.5;
    return {
      ...d,
      studentizedResidual,
      cooksDistance,
      isOutlier
    };
  });

  const rBraggPct = sumDObs > 0 ? (sumAbsDeltaD / sumDObs) * 100 : 0;
  const rwpPct = sumSin2ObsWeighted > 0 
    ? Math.sqrt(sumWeightedResidualSquare / sumSin2ObsWeighted) * 100 
    : 0;

  // Smith-Snyder F_N and de Wolff M_20 figures of merit
  const N = validPeaks.length;
  const maxSin2 = Math.max(...sin2Obs, 0.05);
  // Estimate N_poss using crystal symmetry multiplicity factor
  const symFactor =
    crystalSystem === 'Cubic' ? 1.4 :
    crystalSystem === 'Tetragonal' || crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal' ? 2.1 :
    crystalSystem === 'Orthorhombic' ? 3.2 :
    crystalSystem === 'Monoclinic' ? 4.5 : 6.0;
  const nPoss = Math.max(N, Math.round(N * symFactor));
  const smithSnyderFN = meanAbsDeltaTwoTheta > 1e-6
    ? (1 / meanAbsDeltaTwoTheta) * (N / nPoss)
    : 999;

  const meanAbsDeltaSin2 = Math.max(1e-8, peakRefiningDetails.reduce((s, p) => s + Math.abs(p.residualSin2), 0) / N);
  const deWolffM20 = maxSin2 / (2 * meanAbsDeltaSin2 * nPoss);

  // AIC & BIC for drift model comparison
  const rssSafe = Math.max(1e-16, sumWeightedResidualSquare);
  const aic = N * Math.log(rssSafe / N) + 2 * numParams;
  const bic = N * Math.log(rssSafe / N) + numParams * Math.log(N);

  // Covariance Matrix [C] = weightedVariance * [M]^-1
  const covarianceMatrix: number[][] = Array.from({ length: numParams }, (_, r) =>
    Array.from({ length: numParams }, (_, col) => weightedVariance * M_inv[r][col])
  );

  // Correlation Matrix [R]_jk = C_jk / sqrt(C_jj * C_kk)
  const correlationMatrix: number[][] = Array.from({ length: numParams }, (_, r) =>
    Array.from({ length: numParams }, (_, col) => {
      const denom = Math.sqrt(Math.max(1e-24, covarianceMatrix[r][r] * covarianceMatrix[col][col]));
      return Math.max(-1, Math.min(1, covarianceMatrix[r][col] / denom));
    })
  );

  // Full Jacobian Covariance Error Propagation: Sigma_p = J * C_X * J^T
  // Target vector: [a, b, c, alphaDeg, betaDeg, gammaDeg, volume, rhombohedralA, rhombohedralAlpha]
  const extractTargetVec = (vecX: number[]) => {
    const m = mapVectorXToLattice(vecX, crystalSystem, lambdaRef, numDriftParams, driftType);
    if (!m) return [a, b, c, alphaDeg, betaDeg, gammaDeg, volume, rhombohedralA || 0, rhombohedralAlpha || 90];
    return [m.a, m.b, m.c, m.alphaDeg, m.betaDeg, m.gammaDeg, m.volume, m.rhombohedralA, m.rhombohedralAlpha];
  };

  const numOutputs = 9;
  const J: number[][] = Array.from({ length: numOutputs }, () => Array(numParams).fill(0));
  for (let j = 0; j < numParams; j++) {
    const step = Math.max(1e-8, Math.abs(X[j]) * 1e-5);
    const xPlus = [...X];
    const xMinus = [...X];
    xPlus[j] += step;
    xMinus[j] -= step;
    const fPlus = extractTargetVec(xPlus);
    const fMinus = extractTargetVec(xMinus);
    for (let outIdx = 0; outIdx < numOutputs; outIdx++) {
      J[outIdx][j] = (fPlus[outIdx] - fMinus[outIdx]) / (2 * step);
    }
  }

  const outputVariances: number[] = Array(numOutputs).fill(0);
  for (let outIdx = 0; outIdx < numOutputs; outIdx++) {
    let v = 0;
    for (let r = 0; r < numParams; r++) {
      for (let col = 0; col < numParams; col++) {
        v += J[outIdx][r] * covarianceMatrix[r][col] * J[outIdx][col];
      }
    }
    outputVariances[outIdx] = Math.max(0, v);
  }

  const sigmaA = Math.sqrt(outputVariances[0]);
  const sigmaB = Math.sqrt(outputVariances[1]);
  const sigmaC = Math.sqrt(outputVariances[2]);
  const sigmaAlpha = Math.sqrt(outputVariances[3]);
  const sigmaBeta = Math.sqrt(outputVariances[4]);
  const sigmaGamma = Math.sqrt(outputVariances[5]);
  const sigmaVolume = Math.sqrt(outputVariances[6]);
  const sigmaRhombohedralA = Math.sqrt(outputVariances[7]);
  const sigmaRhombohedralAlpha = Math.sqrt(outputVariances[8]);

  const sigmaD = numDriftParams >= 1
    ? Math.sqrt(Math.max(0, covarianceMatrix[numLatticeParams][numLatticeParams]))
    : 0;
  const sigmaD2 = driftType === 'dual_drift'
    ? Math.sqrt(Math.max(0, covarianceMatrix[numParams - 1][numParams - 1]))
    : undefined;

  // Physical Instrument Aberration Interpretation
  const R_um = goniometerRadiusMm * 1000; // mm -> um
  let sampleDisplacementUm = 0;
  let zeroShiftMdeg = 0;
  let transparencyDepthUm = 0;
  let primaryMechanism = 'Pre-calibrated zero-drift reference';

  if (driftType === 'sample_displacement') {
    // Delta(sin^2 theta) = -(2 * Delta_z / R) * cos^2(theta) * sin(theta) => Delta_z = -D * R / 2
    sampleDisplacementUm = (-D * R_um) / 2;
    zeroShiftMdeg = D * (180 / Math.PI) * 1000;
    primaryMechanism = 'Specimen surface z-height displacement from goniometer focusing circle';
  } else if (driftType === 'zero_shift') {
    // Delta(sin^2 theta) = sin(2*theta) * Delta(theta)_rad = sin(2*theta) * (Delta(2theta)_rad / 2)
    zeroShiftMdeg = D * 2 * (180 / Math.PI) * 1000;
    sampleDisplacementUm = (-D * R_um) / 2;
    primaryMechanism = 'Mechanical detector 2θ zero-point encoder offset';
  } else if (driftType === 'dual_drift') {
    sampleDisplacementUm = (-D * R_um) / 4;
    zeroShiftMdeg = (D2 || 0) * 2 * (180 / Math.PI) * 1000;
    primaryMechanism = 'Coupled Nelson-Riley absorption/displacement + detector 2θ zero-shift';
  } else if (driftType === 'flat_specimen') {
    transparencyDepthUm = Math.abs(D) * R_um * 0.5;
    sampleDisplacementUm = (-D * R_um) / 2;
    primaryMechanism = 'Flat specimen divergence & low-absorption X-ray penetration transparency';
  } else if (driftType !== 'none') {
    sampleDisplacementUm = (-D * R_um) / 3;
    zeroShiftMdeg = D * (180 / Math.PI) * 1000;
    transparencyDepthUm = Math.abs(D) * R_um * 0.25;
    primaryMechanism = 'Combined axial divergence, specimen absorption, and parafocusing displacement';
  }

  return {
    lattice: {
      a,
      b,
      c,
      alphaDeg,
      betaDeg,
      gammaDeg,
      rhombohedralA: crystalSystem === 'Trigonal' ? rhombohedralA : undefined,
      rhombohedralAlpha: crystalSystem === 'Trigonal' ? rhombohedralAlpha : undefined
    },
    sigma: {
      sigmaA,
      sigmaB,
      sigmaC,
      sigmaAlpha,
      sigmaBeta,
      sigmaGamma,
      sigmaD,
      sigmaD2,
      sigmaVolume,
      sigmaRhombohedralA: crystalSystem === 'Trigonal' ? sigmaRhombohedralA : undefined,
      sigmaRhombohedralAlpha: crystalSystem === 'Trigonal' ? sigmaRhombohedralAlpha : undefined
    },
    D,
    D2: driftType === 'dual_drift' ? D2 : undefined,
    volume,
    variance,
    weightedVariance,
    rmsTwoThetaShift,
    meanAbsDeltaTwoTheta,
    maxDeltaTwoTheta,
    rmsDeltaDPpm,
    sumResidualSquare,
    dof,
    gof,
    rBraggPct,
    rwpPct,
    smithSnyderFN,
    deWolffM20,
    aic,
    bic,
    maxCooksDistance,
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
    aberrations: {
      goniometerRadiusMm,
      sampleDisplacementUm,
      zeroShiftMdeg,
      transparencyDepthUm,
      primaryMechanism
    },
    numParams,
    validPeaks,
    basisMatrix,
    weightingScheme,
    driftType,
    crystalSystem
  };
}

// Auto-suggest closest Miller indices (h, k, l) for a given 2Theta angle and unit cell
export function suggestBestHklForPeak(
  twoThetaDeg: number,
  wavelength: number,
  crystalSystem: CrystalSystem,
  lattice: { a: number; b: number; c: number; alphaDeg?: number; betaDeg?: number; gammaDeg?: number }
): { h: number; k: number; l: number; twoThetaCalc: number; deltaDeg: number } {
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  const sin2Target = Math.pow(Math.sin(thetaRad), 2);
  const { a, b, c, betaDeg = 90 } = lattice;
  const l2 = wavelength * wavelength;

  let best = { h: 1, k: 1, l: 1, twoThetaCalc: twoThetaDeg, deltaDeg: 999 };
  const maxIdx = crystalSystem === 'Triclinic' || crystalSystem === 'Monoclinic' ? 5 : 6;
  const minH = crystalSystem === 'Monoclinic' || crystalSystem === 'Triclinic' ? -4 : 0;

  for (let h = minH; h <= maxIdx; h++) {
    for (let k = 0; k <= maxIdx; k++) {
      for (let l = 0; l <= maxIdx; l++) {
        if (h === 0 && k === 0 && l === 0) continue;
        let sin2 = 0;
        if (crystalSystem === 'Cubic') {
          sin2 = (l2 / (4 * a * a)) * (h * h + k * k + l * l);
        } else if (crystalSystem === 'Tetragonal') {
          sin2 = (l2 / 4) * ((h * h + k * k) / (a * a) + (l * l) / (c * c));
        } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
          sin2 = (l2 / 3) * ((h * h + h * k + k * k) / (a * a)) + (l2 / 4) * ((l * l) / (c * c));
        } else if (crystalSystem === 'Orthorhombic') {
          sin2 = (l2 / 4) * ((h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c));
        } else {
          const betaRad = (betaDeg * Math.PI) / 180;
          const sinB2 = Math.pow(Math.sin(betaRad), 2);
          sin2 =
            (l2 / (4 * sinB2)) *
            ((h * h) / (a * a) +
              (k * k * sinB2) / (b * b) +
              (l * l) / (c * c) -
              (2 * h * l * Math.cos(betaRad)) / (a * c));
        }

        if (sin2 > 0 && sin2 < 0.999) {
          const ttCalc = 2 * Math.asin(Math.sqrt(sin2)) * (180 / Math.PI);
          const diff = Math.abs(twoThetaDeg - ttCalc);
          if (diff < best.deltaDeg && Math.abs(sin2 - sin2Target) < 0.15) {
            best = { h, k, l, twoThetaCalc: ttCalc, deltaDeg: diff };
          }
        }
      }
    }
  }
  return best;
}
