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
  driftVal: number; // Basis value g_D(theta) in sin^2(theta) normal equations
  extrapAbscissa: number; // Corresponding x(theta) = g_D(theta) / (2 * sin^2 theta) for linear a_app plot
  driftVal2?: number;
  residualSin2: number;
  weight: number;
  irlsFactor: number;
  leverageHii: number;
  studentizedResidual: number;
  cooksDistance: number;
  looDeltaA: number; // Leave-one-out shift in lattice parameter a_0 (Angstrom)
  intensity?: number;
  enabled?: boolean;
  wavelength?: number;
  isOutlier?: boolean;
}

export interface IrlsIterationStep {
  iteration: number;
  rmsTwoThetaDeg: number;
  weightedRss: number;
  huberScale: number;
  downweightedCount: number;
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
  reciprocalLattice: {
    aStar: number;
    bStar: number;
    cStar: number;
    alphaStarDeg: number;
    betaStarDeg: number;
    gammaStarDeg: number;
    vStar: number;
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
    sigmaAStar: number;
    sigmaBStar: number;
    sigmaCStar: number;
    sigmaAlphaStar: number;
    sigmaBetaStar: number;
    sigmaGammaStar: number;
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
  sumWeightedResidualSquare: number;
  dof: number;
  gof: number; // Goodness-of-Fit = sqrt(weightedVariance)
  rBraggPct: number;
  rwpPct: number;
  smithSnyderFN: number; // F_N figure of merit
  deWolffM20: number; // M_20 figure of merit
  nPossible: number; // Enumerated unique Bragg reflections up to Q_max
  aic: number; // Akaike Information Criterion
  aicc: number; // Small-sample corrected AIC
  bic: number; // Bayesian Information Criterion
  driftFStat?: number; // Partial F-test vs zero-drift null model (D = 0)
  driftPValue?: number; // p-value for drift parameter significance
  driftSignificant?: boolean;
  maxCooksDistance: number;
  conditionNumber: number; // 1-norm condition number kappa_1(M)
  condNumber?: number; // Alias for conditionNumber
  spectralConditionNumber: number; // 2-norm spectral condition number lambda_max / lambda_min
  eigenvalues: number[]; // Sorted eigenvalues of [M]
  vifs: number[]; // Variance Inflation Factors for each parameter
  solverResidualNorm: number; // ||M*X - Y||_2 numerical verification residual
  matrixM: number[][];
  matrixMInv: number[][];
  covarianceMatrix: number[][];
  correlationMatrix: number[][];
  vectorY: number[];
  vectorX: number[];
  parameterNames: string[];
  matrixLabels?: string[];
  peakDetails: CohenPeakDetail[];
  aberrations: CohenPhysicalAberrations;
  irlsHistory?: IrlsIterationStep[];
  numParams: number;
  validPeaks: PeakInput[];
  basisMatrix: number[][];
  weightingScheme: WeightingScheme;
  driftType: DriftFunctionType;
  crystalSystem: CrystalSystem;
}

export type CohenRefinementResult = CohenRefinementOutput | { error: string };

// ============================================================================
// NUMERICAL LINEAR ALGEBRA KERNEL: HOUSEHOLDER QR + JACOBI EIGENDECOMPOSITION
// ============================================================================

/**
 * Column-equilibrated Weighted Householder QR Solver for min ||W^(1/2)(G*x - y)||_2.
 * Solves R*x = Q^T * (W^(1/2)*y) without squaring the condition number, then
 * recovers exact symmetric M = G^T W G and M^-1 = R^-1 R^-T via upper-triangular
 * back-substitution.
 */
export function solveWeightedQR(
  G: number[][],
  y: number[],
  w: number[]
): {
  X: number[];
  M: number[][];
  Y: number[];
  M_inv: number[][];
  conditionNumber: number;
  solverResidualNorm: number;
} | null {
  const N = G.length;
  const P = G[0]?.length || 0;
  if (N === 0 || P === 0 || N < P) return null;

  // Build weighted matrix A = W^(1/2) * G and rhs b = W^(1/2) * y
  const A: number[][] = Array.from({ length: N }, (_, i) => {
    const sw = Math.sqrt(Math.max(1e-18, w[i]));
    return G[i].map(v => v * sw);
  });
  const b: number[] = y.map((yi, i) => yi * Math.sqrt(Math.max(1e-18, w[i])));

  // Build exact Normal Matrix M = G^T W G and RHS Y = G^T W y for reporting
  const M: number[][] = Array.from({ length: P }, () => Array(P).fill(0));
  const Y: number[] = Array(P).fill(0);
  for (let j = 0; j < P; j++) {
    for (let k = j; k < P; k++) {
      let s = 0;
      for (let i = 0; i < N; i++) s += A[i][j] * A[i][k];
      M[j][k] = s;
      M[k][j] = s;
    }
    let ys = 0;
    for (let i = 0; i < N; i++) ys += A[i][j] * b[i];
    Y[j] = ys;
  }

  // Column equilibration scaling factors s_j = ||A[:, j]||_2
  const colScale: number[] = Array(P).fill(1);
  for (let j = 0; j < P; j++) {
    let normSq = 0;
    for (let i = 0; i < N; i++) normSq += A[i][j] * A[i][j];
    const s = Math.sqrt(normSq);
    if (s < 1e-15) return null;
    colScale[j] = s;
    for (let i = 0; i < N; i++) A[i][j] /= s;
  }

  // In-place Householder QR decomposition on scaled matrix A_hat = A * D^-1
  const qtB = [...b];
  for (let k = 0; k < P; k++) {
    let normXSq = 0;
    for (let i = k; i < N; i++) normXSq += A[i][k] * A[i][k];
    const normX = Math.sqrt(normXSq);
    if (normX < 1e-14) return null;

    const alpha = A[k][k] >= 0 ? -normX : normX;
    const v0 = A[k][k] - alpha;
    const v: number[] = Array(N - k).fill(0);
    v[0] = 1;
    let vNormSq = 1;
    for (let i = k + 1; i < N; i++) {
      v[i - k] = A[i][k] / v0;
      vNormSq += v[i - k] * v[i - k];
    }
    const beta = 2 / vNormSq;

    // Update column k directly
    A[k][k] = alpha;
    for (let i = k + 1; i < N; i++) A[i][k] = 0;

    // Apply Householder reflection I - beta*v*v^T to columns k+1 .. P-1
    for (let j = k + 1; j < P; j++) {
      let dot = 0;
      for (let i = k; i < N; i++) dot += v[i - k] * A[i][j];
      const scale = beta * dot;
      for (let i = k; i < N; i++) A[i][j] -= scale * v[i - k];
    }

    // Apply Householder reflection to qtB
    let dotB = 0;
    for (let i = k; i < N; i++) dotB += v[i - k] * qtB[i];
    const scaleB = beta * dotB;
    for (let i = k; i < N; i++) qtB[i] -= scaleB * v[i - k];
  }

  // Extract upper triangular R = R_hat * D and check numerical rank
  const R: number[][] = Array.from({ length: P }, (_, r) =>
    Array.from({ length: P }, (_, c) => (c >= r ? A[r][c] * colScale[c] : 0))
  );

  let maxDiagHat = 0;
  let minDiagHat = Infinity;
  for (let j = 0; j < P; j++) {
    const d = Math.abs(A[j][j]);
    if (d > maxDiagHat) maxDiagHat = d;
    if (d < minDiagHat) minDiagHat = d;
  }
  if (minDiagHat < 1e-11 * Math.max(1e-15, maxDiagHat)) {
    return null; // Rank-deficient design matrix
  }

  // Solve R_hat * x_hat = qtB[0..P-1], then X[j] = x_hat[j] / colScale[j]
  const xHat: number[] = Array(P).fill(0);
  for (let i = P - 1; i >= 0; i--) {
    let sum = qtB[i];
    for (let j = i + 1; j < P; j++) sum -= A[i][j] * xHat[j];
    xHat[i] = sum / A[i][i];
  }
  const X = xHat.map((v, j) => v / colScale[j]);

  // Invert upper triangular R via back-substitution to get R_inv
  const R_inv: number[][] = Array.from({ length: P }, () => Array(P).fill(0));
  for (let col = 0; col < P; col++) {
    for (let row = col; row >= 0; row--) {
      let sum = row === col ? 1 : 0;
      for (let k = row + 1; k <= col; k++) {
        sum -= R[row][k] * R_inv[k][col];
      }
      R_inv[row][col] = sum / R[row][row];
    }
  }

  // Exact symmetric M_inv = R_inv * R_inv^T
  const M_inv: number[][] = Array.from({ length: P }, () => Array(P).fill(0));
  for (let i = 0; i < P; i++) {
    for (let j = i; j < P; j++) {
      let s = 0;
      for (let k = Math.max(i, j); k < P; k++) {
        s += R_inv[i][k] * R_inv[j][k];
      }
      M_inv[i][j] = s;
      M_inv[j][i] = s;
    }
  }

  // Compute true 1-norm condition number kappa_1(M) = ||M||_1 * ||M^-1||_1
  const norm1 = (mat: number[][]) => {
    let maxCol = 0;
    for (let j = 0; j < P; j++) {
      let s = 0;
      for (let i = 0; i < P; i++) s += Math.abs(mat[i][j]);
      if (s > maxCol) maxCol = s;
    }
    return maxCol;
  };
  const cond1 = norm1(M) * norm1(M_inv);
  const conditionNumber = Number.isFinite(cond1) && cond1 > 0 ? cond1 : 1e12;

  // Verify normal-equation residual ||M*X - Y||_2
  let resSq = 0;
  for (let i = 0; i < P; i++) {
    let mx = 0;
    for (let j = 0; j < P; j++) mx += M[i][j] * X[j];
    const diff = mx - Y[i];
    resSq += diff * diff;
  }

  return {
    X,
    M,
    Y,
    M_inv,
    conditionNumber,
    solverResidualNorm: Math.sqrt(resSq)
  };
}

// Legacy Gaussian elimination solver exported for backwards compatibility
export function solveLinearSystem(M: number[][], Y: number[]): { X: number[]; M_inv: number[][]; conditionNumber: number } | null {
  const n = M.length;
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
    if (pivotVal < 1e-15) return null;
    maxPivot = Math.max(maxPivot, pivotVal);
    minPivot = Math.min(minPivot, pivotVal);

    if (maxRow !== col) [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n + 1; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n + 1; j++) aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  const X = aug.map(row => row[2 * n]);
  const M_inv = aug.map(row => row.slice(n, 2 * n));
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

/**
 * Symmetric Jacobi eigendecomposition for small P x P matrices (P <= 10).
 * Returns eigenvalues sorted descending.
 */
export function jacobiEigenvalues(symMat: number[][]): number[] {
  const n = symMat.length;
  if (n === 0) return [];
  const A = symMat.map(row => [...row]);
  const maxIter = 80 * n * n;

  for (let iter = 0; iter < maxIter; iter++) {
    let p = 0, q = 1;
    let maxOff = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const v = Math.abs(A[i][j]);
        if (v > maxOff) {
          maxOff = v;
          p = i;
          q = j;
        }
      }
    }
    if (maxOff < 1e-14 || n < 2) break;

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];
    const tau = (aqq - app) / (2 * apq);
    const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;

    A[p][p] = app - t * apq;
    A[q][q] = aqq + t * apq;
    A[p][q] = 0;
    A[q][p] = 0;

    for (let r = 0; r < n; r++) {
      if (r !== p && r !== q) {
        const arp = A[r][p];
        const arq = A[r][q];
        A[r][p] = c * arp - s * arq;
        A[p][r] = A[r][p];
        A[r][q] = s * arp + c * arq;
        A[q][r] = A[r][q];
      }
    }
  }

  return A.map((row, idx) => row[idx]).sort((a, b) => b - a);
}

/**
 * Compute Variance Inflation Factors VIF_j = [R_corr^-1]_jj
 * where R_corr is the normalized parameter correlation matrix.
 */
function computeVIFs(corrMatrix: number[][]): number[] {
  const n = corrMatrix.length;
  if (n <= 1) return Array(n).fill(1);
  const res = solveLinearSystem(corrMatrix, Array(n).fill(0));
  if (!res) return Array(n).fill(999);
  return res.M_inv.map((row, idx) => Math.max(1, Math.min(9999, row[idx])));
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

// Regularized incomplete beta & F-test survival probability p = P(F_{d1, d2} >= fStat)
function logGamma(z: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  let x = z;
  let y = z;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betaCf(a: number, b: number, x: number): number {
  const MAXIT = 120;
  const EPS = 3e-7;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function regularizedBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaCf(a, b, x)) / a;
  }
  return 1 - (bt * betaCf(b, a, 1 - x)) / b;
}

function fTestPValue(fStat: number, df1: number, df2: number): number {
  if (!Number.isFinite(fStat) || fStat <= 0 || df1 <= 0 || df2 <= 0) return 1;
  const x = df2 / (df2 + df1 * fStat);
  return Math.max(0, Math.min(1, regularizedBeta(df2 / 2, df1 / 2, x)));
}

// ============================================================================
// DRIFT KERNELS IN SIN^2(THETA) SPACE & CORRESPONDING EXTRAPOLATION ABSCISSAE
// ============================================================================

/**
 * Evaluates the bounded systematic drift basis function g_D(theta) entering
 * sin^2(theta_obs) = Q(hkl)*lambda^2/4 + D * g_D(theta).
 * Note: For delta d / d = K * f(theta), delta(sin^2 theta) = -2 * sin^2(theta) * (delta d / d),
 * ensuring g_D(theta) remains finite as theta -> 0 and vanishes at theta -> 90 deg.
 */
export function calculateDrift(twoThetaDeg: number, type: DriftFunctionType): number {
  if (type === 'none') return 0;
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;

  const cosTh = Math.cos(thetaRad);
  const sinTh = Math.sin(thetaRad);
  const sin2Th = sinTh * sinTh;
  const cos2Th = cosTh * cosTh;

  switch (type) {
    case 'nelson_riley': {
      // Delta(d)/d ~ 0.5*(cos^2/sin + cos^2/theta) => g_D = 2*sin^2(theta)*f_NR = sin*cos^2 + (sin^2*cos^2)/theta
      return sinTh * cos2Th + (sin2Th * cos2Th) / thetaRad;
    }
    case 'taylor_sinclair': {
      // Taylor-Sinclair finite-aperture/absorption: Delta(d)/d ~ cos^2/theta => g_D = 2*sin^2*cos^2/theta
      return (2 * sin2Th * cos2Th) / thetaRad;
    }
    case 'bradley_jay':
      // Classic Cohen-Bradley-Jay flat-specimen/high-angle kernel in sin^2(theta)
      return cos2Th;
    case 'sample_displacement':
      // Exact Bragg-Brentano specimen z-offset: Delta(2theta) = -(2s/R)*cos(theta) => Delta(sin^2) = -(2s/R)*cos^2(theta)*sin(theta)
      return cos2Th * sinTh;
    case 'hess_hagg':
      // Specimen transparency / Hess-Hagg: Delta(2theta) ~ -sin(2theta)/(2*mu*R) => Delta(sin^2) ~ sin^2(2theta)
      return Math.pow(Math.sin(2 * thetaRad), 2);
    case 'zero_shift':
      // Mechanical 2theta encoder zero offset: Delta(sin^2) = (Delta_2theta0_rad / 2) * sin(2theta)
      return Math.sin(2 * thetaRad);
    case 'flat_specimen':
      // Coupled axial divergence (Eastabrook/Wilson cos(2theta)) or cot(theta)*sin(2theta) -> cos^2*cos(theta)
      // Use bounded specimen-surface axial/flat-specimen kernel: cos^2(theta) * (1 - sin(theta))
      return cos2Th * (1 - 0.5 * sinTh);
    case 'dual_drift':
      // Primary component in dual drift: Nelson-Riley kernel
      return sinTh * cos2Th + (sin2Th * cos2Th) / thetaRad;
    default:
      return sinTh * cos2Th + (sin2Th * cos2Th) / thetaRad;
  }
}

/**
 * Returns the exact linear extrapolation abscissa x(theta) such that:
 * a_app(theta) = a_0 * sqrt(sin^2_0 / (sin^2_0 + D*g_D)) approx a_0 - (a_0 * D) * x(theta),
 * where x(theta) = g_D(theta) / (2 * sin^2(theta)).
 * For Nelson-Riley, this yields the exact textbook f_NR(theta) = 0.5*(cos^2/sin + cos^2/theta)!
 */
export function calculateExtrapolationAbscissa(twoThetaDeg: number, type: DriftFunctionType): number {
  if (type === 'none') {
    // Default abscissa for inspecting uncalibrated trends against Nelson-Riley
    const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
    if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;
    const c2 = Math.cos(thetaRad) ** 2;
    return 0.5 * (c2 / Math.sin(thetaRad) + c2 / thetaRad);
  }
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;
  const sin2Th = Math.sin(thetaRad) ** 2;
  const gD = calculateDrift(twoThetaDeg, type);
  return gD / Math.max(1e-8, 2 * sin2Th);
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

// Helper to map parameter vector X to direct & reciprocal lattice parameters & volume
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
  aStar: number;
  bStar: number;
  cStar: number;
  alphaStarDeg: number;
  betaStarDeg: number;
  gammaStarDeg: number;
  vStar: number;
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
    if (Math.abs(cosBeta) >= 0.9999) return null;
    const betaRad = Math.acos(cosBeta);
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

    const cosAlpha = G23 / (b * c);
    const cosBeta = G13 / (a * c);
    const cosGamma = G12 / (a * b);
    if (Math.abs(cosAlpha) >= 0.9999 || Math.abs(cosBeta) >= 0.9999 || Math.abs(cosGamma) >= 0.9999) {
      return null;
    }

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
  if (term <= 1e-10) return null;
  const volume = a * b * c * Math.sqrt(term);

  // Compute exact reciprocal metric tensor G* = G^-1
  const sinA = Math.sin(aR);
  const sinB = Math.sin(bR);
  const sinG = Math.sin(gR);
  const aStar = (b * c * sinA) / volume;
  const bStar = (a * c * sinB) / volume;
  const cStar = (a * b * sinG) / volume;
  const vStar = 1 / volume;
  const cosAlphaStar = Math.max(-1, Math.min(1, (cosB * cosG - cosA) / Math.max(1e-9, sinB * sinG)));
  const cosBetaStar = Math.max(-1, Math.min(1, (cosA * cosG - cosB) / Math.max(1e-9, sinA * sinG)));
  const cosGammaStar = Math.max(-1, Math.min(1, (cosA * cosB - cosG) / Math.max(1e-9, sinA * sinB)));

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
    aStar,
    bStar,
    cStar,
    alphaStarDeg: Math.acos(cosAlphaStar) * (180 / Math.PI),
    betaStarDeg: Math.acos(cosBetaStar) * (180 / Math.PI),
    gammaStarDeg: Math.acos(cosGammaStar) * (180 / Math.PI),
    vStar,
    D,
    D2
  };
}

/**
 * Enumerates unique non-equivalent theoretical Bragg reflections (by Q = 1/d^2)
 * up to sin^2(theta_max) for authentic Smith-Snyder F_N and de Wolff M_20 figures of merit.
 */
function countPossibleReflections(
  lattice: { a: number; b: number; c: number; alphaDeg: number; betaDeg: number; gammaDeg: number },
  crystalSystem: CrystalSystem,
  wavelength: number,
  sin2Max: number,
  sin2At20: number
): { nPossible: number; nPoss20: number } {
  const { a, b, c, alphaDeg, betaDeg, gammaDeg } = lattice;
  const qMax = (4 * Math.min(0.999, Math.max(0.01, sin2Max))) / (wavelength * wavelength);
  const q20 = (4 * Math.min(0.999, Math.max(0.01, sin2At20))) / (wavelength * wavelength);

  const aR = (alphaDeg * Math.PI) / 180;
  const bR = (betaDeg * Math.PI) / 180;
  const gR = (gammaDeg * Math.PI) / 180;
  const cosA = Math.cos(aR), cosB = Math.cos(bR), cosG = Math.cos(gR);
  const G = [
    [a * a, a * b * cosG, a * c * cosB],
    [b * a * cosG, b * b, b * c * cosA],
    [c * a * cosB, c * b * cosA, c * c]
  ];
  const GStar = invert3x3(G);
  if (!GStar) return { nPossible: 1, nPoss20: 1 };

  const hMax = Math.min(18, Math.ceil(a * Math.sqrt(qMax) * 1.15));
  const kMax = Math.min(18, Math.ceil(b * Math.sqrt(qMax) * 1.15));
  const lMax = Math.min(18, Math.ceil(c * Math.sqrt(qMax) * 1.15));

  const qAll: number[] = [];
  const q20List: number[] = [];

  const minH = crystalSystem === 'Monoclinic' || crystalSystem === 'Triclinic' ? -hMax : 0;
  const minK = crystalSystem === 'Triclinic' ? -kMax : 0;
  const minL = 0;

  for (let h = minH; h <= hMax; h++) {
    for (let k = minK; k <= kMax; k++) {
      // Symmetry reduction to avoid duplicate counting
      if (crystalSystem === 'Cubic' && (h < k)) continue;
      if (crystalSystem === 'Tetragonal' && h < k) continue;
      for (let l = minL; l <= lMax; l++) {
        if (h === 0 && k === 0 && l === 0) continue;
        if (crystalSystem === 'Cubic' && k < l) continue;
        // Friedel pair rule when l == 0
        if (l === 0 && h < 0) continue;
        if (l === 0 && h === 0 && k < 0) continue;

        const q =
          h * (GStar[0][0] * h + GStar[0][1] * k + GStar[0][2] * l) +
          k * (GStar[1][0] * h + GStar[1][1] * k + GStar[1][2] * l) +
          l * (GStar[2][0] * h + GStar[2][1] * k + GStar[2][2] * l);

        if (q > 1e-8 && q <= qMax + 1e-6) {
          qAll.push(q);
          if (q <= q20 + 1e-6) q20List.push(q);
        }
      }
    }
  }

  const countUniqueQ = (vals: number[]) => {
    if (vals.length === 0) return 0;
    vals.sort((x, y) => x - y);
    let count = 1;
    let prev = vals[0];
    for (let i = 1; i < vals.length; i++) {
      if (vals[i] - prev > 1e-5) {
        count++;
        prev = vals[i];
      }
    }
    return count;
  };

  return {
    nPossible: Math.max(1, countUniqueQ(qAll)),
    nPoss20: Math.max(1, countUniqueQ(q20List))
  };
}

// Core Cohen Analytical Least-Squares Solver
export function runCohenRefinement(
  peaks: PeakInput[],
  crystalSystem: CrystalSystem,
  driftType: DriftFunctionType = 'nelson_riley',
  wavelength: number = 1.54056,
  weightingScheme: WeightingScheme = 'hess_hagg',
  goniometerRadiusMm: number = 240,
  skipNullComparison: boolean = false
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
    parameterNames = ['S11', 'S22', 'S33', 'S12', 'S23', 'S13'];
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
  const extrapAbscissae: number[] = [];
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
    extrapAbscissae.push(calculateExtrapolationAbscissa(p.twoTheta, driftType));

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

  // Helper to normalize weights so mean(normW) = 1.0 and solve via Weighted Householder QR
  const buildAndSolve = (rawW: number[]) => {
    const sumW = rawW.reduce((acc, v) => acc + v, 0);
    const normFactor = validPeaks.length / Math.max(1e-12, sumW);
    const normW = rawW.map(w => w * normFactor);
    const solved = solveWeightedQR(basisMatrix, sin2Obs, normW);
    return solved ? { ...solved, normW } : null;
  };

  let irlsFactors = validPeaks.map(() => 1.0);
  const irlsHistory: IrlsIterationStep[] = [];

  let solvedState = buildAndSolve(baseWeights);
  if (!solvedState) {
    return { error: 'Design matrix [G] is rank-deficient or ill-conditioned. Reflections may be linearly dependent, collinear, or insufficient.' };
  }

  // If Huber IRLS Robust weighting is active, perform 6 IRLS iterations with convergence telemetry
  if (weightingScheme === 'huber_robust' && validPeaks.length > numParams) {
    for (let iter = 0; iter < 6; iter++) {
      const { X } = solvedState;
      const absRes: number[] = [];
      const resList: number[] = [];
      let sum2ThSq = 0;
      let sumWRss = 0;

      for (let i = 0; i < validPeaks.length; i++) {
        let s2c = 0;
        for (let j = 0; j < numParams; j++) s2c += X[j] * basisMatrix[i][j];
        const r = sin2Obs[i] - s2c;
        resList.push(r);
        absRes.push(Math.abs(r));
        const s2cClamped = Math.max(1e-7, Math.min(0.999999, s2c));
        const ttCalc = 2 * Math.asin(Math.sqrt(s2cClamped)) * (180 / Math.PI);
        const dtt = validPeaks[i].twoTheta - ttCalc;
        sum2ThSq += dtt * dtt;
        sumWRss += solvedState.normW[i] * r * r;
      }

      const sortedAbs = [...absRes].sort((a, b) => a - b);
      const mad = sortedAbs[Math.floor(sortedAbs.length / 2)] || 1e-6;
      const scale = Math.max(1e-7, 1.4826 * mad);
      const huberK = 1.345 * scale;

      let downweightedCount = 0;
      const nextFactors = resList.map(r => {
        const ar = Math.abs(r);
        if (ar <= huberK) return 1.0;
        downweightedCount++;
        return huberK / ar;
      });

      irlsHistory.push({
        iteration: iter + 1,
        rmsTwoThetaDeg: Math.sqrt(sum2ThSq / validPeaks.length),
        weightedRss: sumWRss,
        huberScale: scale,
        downweightedCount
      });

      const nextWeights = baseWeights.map((bw, i) => bw * nextFactors[i]);
      const nextSolved = buildAndSolve(nextWeights);
      if (nextSolved) {
        solvedState = nextSolved;
        irlsFactors = nextFactors;
      }
    }
  }

  const { X, M_inv, conditionNumber, M, Y, normW: normalizedWeights, solverResidualNorm } = solvedState;

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
    aStar,
    bStar,
    cStar,
    alphaStarDeg,
    betaStarDeg,
    gammaStarDeg,
    vStar,
    D,
    D2
  } = baseMapped;

  // Compute eigenvalues & spectral condition number of [M]
  const eigenvalues = jacobiEigenvalues(M);
  const eigMax = eigenvalues[0] || 1;
  const eigMin = Math.max(1e-18, eigenvalues[eigenvalues.length - 1] || 1);
  const spectralConditionNumber = eigMax / eigMin;

  // Calculate residuals, leverage h_ii, studentized residuals, Cook's distance & LOO sensitivity
  let sumResidualSquare = 0;
  let sumWeightedResidualSquare = 0;
  let sumTwoThetaShiftSquare = 0;
  let sumAbsDeltaTwoTheta = 0;
  let maxDeltaTwoTheta = 0;
  let sumAbsDeltaD = 0;
  let sumDObs = 0;
  let sumDeltaDPpmSquare = 0;
  let sumSin2ObsWeighted = 0;

  // Jacobian row for parameter `a` wrt X (needed for leave-one-out sensitivity d(a)/d(X))
  const gradA: number[] = Array(numParams).fill(0);
  for (let j = 0; j < numParams; j++) {
    const step = Math.max(1e-8, Math.abs(X[j]) * 1e-5);
    const xp = [...X]; xp[j] += step;
    const xm = [...X]; xm[j] -= step;
    const mp = mapVectorXToLattice(xp, crystalSystem, lambdaRef, numDriftParams, driftType);
    const mm = mapVectorXToLattice(xm, crystalSystem, lambdaRef, numDriftParams, driftType);
    gradA[j] = mp && mm ? (mp.a - mm.a) / (2 * step) : 0;
  }

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
    const mInvG: number[] = Array(numParams).fill(0);
    for (let r = 0; r < numParams; r++) {
      let rowDot = 0;
      for (let col = 0; col < numParams; col++) {
        rowDot += M_inv[r][col] * basisMatrix[idx][col];
      }
      mInvG[r] = rowDot;
      quadForm += basisMatrix[idx][r] * rowDot;
    }
    const leverageHii = Math.max(0, Math.min(0.999, w * quadForm));

    // Exact Sherman-Morrison Leave-One-Out shift in vector X:
    // deltaX_(-i) = -(w_i * e_i / (1 - h_ii)) * M^-1 * g_i
    const looScale = -(w * residualSin2) / Math.max(1e-4, 1 - leverageHii);
    let looDeltaA = 0;
    for (let r = 0; r < numParams; r++) {
      looDeltaA += gradA[r] * (looScale * mInvG[r]);
    }

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
      extrapAbscissa: extrapAbscissae[idx],
      driftVal2: driftType === 'dual_drift' ? driftVals2[idx] : undefined,
      residualSin2,
      weight: w,
      irlsFactor: irlsFactors[idx],
      leverageHii,
      looDeltaA,
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

  // Authentic Smith-Snyder F_N and de Wolff M_20 via unit cell reflection enumeration
  const N = validPeaks.length;
  const sortedSin2 = [...sin2Obs].sort((x, y) => x - y);
  const maxSin2 = sortedSin2[sortedSin2.length - 1] || 0.05;
  const sin2At20 = sortedSin2[Math.min(19, sortedSin2.length - 1)] || maxSin2;
  const { nPossible, nPoss20 } = countPossibleReflections(
    { a, b, c, alphaDeg, betaDeg, gammaDeg },
    crystalSystem,
    lambdaRef,
    maxSin2,
    sin2At20
  );
  const nPossEff = Math.max(N, nPossible);
  const smithSnyderFN = meanAbsDeltaTwoTheta > 1e-6
    ? (1 / meanAbsDeltaTwoTheta) * (N / nPossEff)
    : 999;

  const first20Count = Math.min(20, N);
  const meanAbsDeltaSin2_20 = Math.max(
    1e-8,
    peakRefiningDetails
      .slice()
      .sort((p1, p2) => p1.sin2Obs - p2.sin2Obs)
      .slice(0, first20Count)
      .reduce((s, p) => s + Math.abs(p.residualSin2), 0) / first20Count
  );
  const deWolffM20 = sin2At20 / (2 * meanAbsDeltaSin2_20 * Math.max(first20Count, nPoss20));

  // AIC, small-sample corrected AICc & BIC for drift model comparison
  const rssSafe = Math.max(1e-16, sumWeightedResidualSquare);
  const aic = N * Math.log(rssSafe / N) + 2 * numParams;
  const aicc = N > numParams + 1
    ? aic + (2 * numParams * (numParams + 1)) / (N - numParams - 1)
    : aic + 2 * numParams * (numParams + 1);
  const bic = N * Math.log(rssSafe / N) + numParams * Math.log(N);

  // Partial F-test comparing drift model vs Zero-Drift Null Model (D = 0)
  let driftFStat: number | undefined;
  let driftPValue: number | undefined;
  let driftSignificant: boolean | undefined;
  if (!skipNullComparison && driftType !== 'none' && N > numParams) {
    const nullRes = runCohenRefinement(peaks, crystalSystem, 'none', wavelength, weightingScheme, goniometerRadiusMm, true);
    if (!('error' in nullRes)) {
      const rss0 = nullRes.sumWeightedResidualSquare;
      const rss1 = sumWeightedResidualSquare;
      const q = Math.max(1, numDriftParams);
      if (rss0 > rss1 && rss1 > 1e-18) {
        driftFStat = ((rss0 - rss1) / q) / (rss1 / dof);
        driftPValue = fTestPValue(driftFStat, q, dof);
        driftSignificant = driftPValue < 0.05;
      } else {
        driftFStat = 0;
        driftPValue = 1;
        driftSignificant = false;
      }
    }
  }

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

  const vifs = computeVIFs(correlationMatrix);

  // Full Jacobian Covariance Error Propagation: Sigma_p = J * C_X * J^T
  // Target vector: [a, b, c, alphaDeg, betaDeg, gammaDeg, volume, rhombohedralA, rhombohedralAlpha,
  //                 aStar, bStar, cStar, alphaStarDeg, betaStarDeg, gammaStarDeg]
  const extractTargetVec = (vecX: number[]) => {
    const m = mapVectorXToLattice(vecX, crystalSystem, lambdaRef, numDriftParams, driftType);
    if (!m) {
      return [
        a, b, c, alphaDeg, betaDeg, gammaDeg, volume, rhombohedralA || 0, rhombohedralAlpha || 90,
        aStar, bStar, cStar, alphaStarDeg, betaStarDeg, gammaStarDeg
      ];
    }
    return [
      m.a, m.b, m.c, m.alphaDeg, m.betaDeg, m.gammaDeg, m.volume, m.rhombohedralA, m.rhombohedralAlpha,
      m.aStar, m.bStar, m.cStar, m.alphaStarDeg, m.betaStarDeg, m.gammaStarDeg
    ];
  };

  const numOutputs = 15;
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
  const sigmaAStar = Math.sqrt(outputVariances[9]);
  const sigmaBStar = Math.sqrt(outputVariances[10]);
  const sigmaCStar = Math.sqrt(outputVariances[11]);
  const sigmaAlphaStar = Math.sqrt(outputVariances[12]);
  const sigmaBetaStar = Math.sqrt(outputVariances[13]);
  const sigmaGammaStar = Math.sqrt(outputVariances[14]);

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
    sampleDisplacementUm = (-D * R_um) / 2;
    zeroShiftMdeg = D * (180 / Math.PI) * 1000;
    primaryMechanism = 'Specimen surface z-height displacement from goniometer focusing circle';
  } else if (driftType === 'zero_shift') {
    zeroShiftMdeg = D * 2 * (180 / Math.PI) * 1000;
    sampleDisplacementUm = (-D * R_um) / 2;
    primaryMechanism = 'Mechanical detector 2θ zero-point encoder offset';
  } else if (driftType === 'dual_drift') {
    sampleDisplacementUm = (-D * R_um) / 4;
    zeroShiftMdeg = (D2 || 0) * 2 * (180 / Math.PI) * 1000;
    primaryMechanism = 'Coupled Nelson-Riley absorption/displacement + detector 2θ zero-shift';
  } else if (driftType === 'hess_hagg') {
    // Delta(2theta) = -(1/(2*mu*R))*sin(2theta) => D_hh = -(1/(2*mu*R)) -> depth = |D| * R_um
    transparencyDepthUm = Math.abs(D) * R_um;
    sampleDisplacementUm = (-D * R_um) / 2;
    primaryMechanism = 'Specimen X-ray penetration transparency (1/μ) & Hess-Hägg asymmetry';
  } else if (driftType === 'flat_specimen') {
    transparencyDepthUm = Math.abs(D) * R_um * 0.5;
    sampleDisplacementUm = (-D * R_um) / 2;
    primaryMechanism = 'Flat specimen horizontal divergence & surface penetration aberration';
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
    reciprocalLattice: {
      aStar,
      bStar,
      cStar,
      alphaStarDeg,
      betaStarDeg,
      gammaStarDeg,
      vStar
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
      sigmaRhombohedralAlpha: crystalSystem === 'Trigonal' ? sigmaRhombohedralAlpha : undefined,
      sigmaAStar,
      sigmaBStar,
      sigmaCStar,
      sigmaAlphaStar,
      sigmaBetaStar,
      sigmaGammaStar
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
    sumWeightedResidualSquare,
    dof,
    gof,
    rBraggPct,
    rwpPct,
    smithSnyderFN,
    deWolffM20,
    nPossible: nPossEff,
    aic,
    aicc,
    bic,
    driftFStat,
    driftPValue,
    driftSignificant,
    maxCooksDistance,
    conditionNumber,
    condNumber: conditionNumber,
    spectralConditionNumber,
    eigenvalues,
    vifs,
    solverResidualNorm,
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
    irlsHistory: weightingScheme === 'huber_robust' ? irlsHistory : undefined,
    numParams,
    validPeaks,
    basisMatrix,
    weightingScheme,
    driftType,
    crystalSystem
  };
}

// Auto-suggest closest Miller indices (h, k, l) for a given 2Theta angle and unit cell (all 7 crystal systems)
export function suggestBestHklForPeak(
  twoThetaDeg: number,
  wavelength: number,
  crystalSystem: CrystalSystem,
  lattice: { a: number; b: number; c: number; alphaDeg?: number; betaDeg?: number; gammaDeg?: number }
): { h: number; k: number; l: number; twoThetaCalc: number; deltaDeg: number } {
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  const sin2Target = Math.pow(Math.sin(thetaRad), 2);
  const { a, b, c, alphaDeg = 90, betaDeg = 90, gammaDeg = 90 } = lattice;
  const l2 = wavelength * wavelength;

  // Build exact reciprocal metric tensor G*
  const aR = (alphaDeg * Math.PI) / 180;
  const bR = (betaDeg * Math.PI) / 180;
  const gR = (gammaDeg * Math.PI) / 180;
  const cosA = Math.cos(aR), cosB = Math.cos(bR), cosG = Math.cos(gR);
  const G = [
    [a * a, a * b * cosG, a * c * cosB],
    [b * a * cosG, b * b, b * c * cosA],
    [c * a * cosB, c * b * cosA, c * c]
  ];
  const GStar = invert3x3(G);

  let best = { h: 1, k: 1, l: 1, twoThetaCalc: twoThetaDeg, deltaDeg: 999 };
  const maxIdx = crystalSystem === 'Triclinic' || crystalSystem === 'Monoclinic' ? 5 : 7;
  const minH = crystalSystem === 'Monoclinic' || crystalSystem === 'Triclinic' ? -5 : 0;
  const minK = crystalSystem === 'Triclinic' ? -5 : 0;

  for (let h = minH; h <= maxIdx; h++) {
    for (let k = minK; k <= maxIdx; k++) {
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
        } else if (GStar) {
          const q =
            h * (GStar[0][0] * h + GStar[0][1] * k + GStar[0][2] * l) +
            k * (GStar[1][0] * h + GStar[1][1] * k + GStar[1][2] * l) +
            l * (GStar[2][0] * h + GStar[2][1] * k + GStar[2][2] * l);
          sin2 = (l2 / 4) * q;
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
