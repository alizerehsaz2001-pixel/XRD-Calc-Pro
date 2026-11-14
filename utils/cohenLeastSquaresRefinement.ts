/**
 * High-Precision Cohen's Least-Squares Unit Cell Parameter Refinement Solver
 * 
 * Supports:
 * - All 7 Crystal Systems: Cubic, Tetragonal, Hexagonal, Trigonal/Rhombohedral,
 *   Orthorhombic, Monoclinic, and Triclinic.
 * - Co-refinement of systematic experimental drift/aberration functions:
 *   1. Nelson-Riley / Taylor-Sinclair: cos²θ/sinθ + cos²θ/θ
 *   2. Bradley-Jay: cos²θ
 *   3. Planar Sample Displacement: cos²θ·sinθ
 *   4. Zero-Shift Offset: Δ(2θ₀)
 *   5. Specimen Flat/Absorption: cotθ
 * - Weighting Schemes: Statistical Counting (1/σ² ∝ tan²θ/d²), Inverse Variance (1/Δ(2θ)²), Unit Weights (1.0).
 * - Full Variance-Covariance Matrix, parameter standard deviations (±σ),
 *   correlation matrix (r_ij), and Goodness-of-Fit (GoF).
 */

export type CrystalSystemType = 
  | 'Cubic' 
  | 'Tetragonal' 
  | 'Hexagonal' 
  | 'Trigonal' 
  | 'Orthorhombic' 
  | 'Monoclinic' 
  | 'Triclinic';

export type SystematicErrorFunction = 
  | 'nelson_riley' 
  | 'bradley_jay' 
  | 'sample_displacement' 
  | 'zero_shift' 
  | 'flat_specimen' 
  | 'none';

export type WeightingModel = 
  | 'statistical' 
  | 'inverse_variance' 
  | 'unit';

export interface RefinementPeak {
  id: string;
  twoThetaObs: number;
  dObs: number;
  h: number;
  k: number;
  l: number;
  weight?: number;
  intensity?: number;
}

export interface RefinementParameterResult {
  value: number;
  stdError: number;
  unit: string;
}

export interface RefinementReflectionOutput {
  id: string;
  hkl: [number, number, number];
  hklString: string;
  twoThetaObs: number;
  twoThetaCalc: number;
  deltaTwoTheta: number;
  dObs: number;
  dCalc: number;
  deltaD: number;
  sin2ThetaObs: number;
  sin2ThetaCalc: number;
  driftValue: number;
  weight: number;
  relativeResidualPct: number;
}

export interface NelsonRileyPoint {
  fTheta: number;
  aExtrap: number;
  cExtrap?: number;
  vExtrap?: number;
  hkl: string;
  h: number;
  k: number;
  l: number;
  twoTheta: number;
  dObs: number;
  weight: number;
  fitLineA?: number;
  fitLineC?: number;
}

export interface NelsonRileyFitMetrics {
  slopeA: number;
  interceptA: number; // extrapolated a at F=0
  r2A: number;
  slopeC?: number;
  interceptC?: number; // extrapolated c at F=0
  r2C?: number;
  systematicModel: SystematicErrorFunction;
}

export interface CohenRefinementResult {
  converged: boolean;
  errorMessage?: string;
  crystalSystem: CrystalSystemType;
  errorFunctionUsed: SystematicErrorFunction;
  weightingUsed: WeightingModel;
  parameters: {
    a: RefinementParameterResult;
    b: RefinementParameterResult;
    c: RefinementParameterResult;
    alpha: RefinementParameterResult;
    beta: RefinementParameterResult;
    gamma: RefinementParameterResult;
    volume: RefinementParameterResult;
    driftParam?: RefinementParameterResult; // Systematic error multiplier K
  };
  metrics: {
    degreesOfFreedom: number;
    sumSquaredResiduals: number;
    reducedChiSquared: number;
    gof: number; // Goodness of Fit = sqrt(chi^2_red)
    rBraggPct: number;
    rwpPct: number;
  };
  varianceCovarianceMatrix: number[][];
  correlationMatrix: number[][];
  parameterNames: string[];
  reflections: RefinementReflectionOutput[];
  nelsonRileyPlotData: NelsonRileyPoint[];
  nelsonRileyFitMetrics?: NelsonRileyFitMetrics;
}

// --------------------------------------------------------------------------
// Matrix Mathematics Utilities (Gaussian Elimination & Inversion)
// --------------------------------------------------------------------------
function invertMatrix(M: number[][]): number[][] | null {
  const n = M.length;
  // Augment with Identity
  const A: number[][] = M.map((row, i) => {
    const r = [...row];
    for (let j = 0; j < n; j++) {
      r.push(i === j ? 1 : 0);
    }
    return r;
  });

  for (let i = 0; i < n; i++) {
    // Pivot selection
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxVal) {
        maxVal = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-15) return null; // Singular matrix

    if (maxRow !== i) {
      const temp = A[i];
      A[i] = A[maxRow];
      A[maxRow] = temp;
    }

    const pivot = A[i][i];
    for (let j = 0; j < 2 * n; j++) {
      A[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = A[k][i];
      for (let j = 0; j < 2 * n; j++) {
        A[k][j] -= factor * A[i][j];
      }
    }
  }

  return A.map(row => row.slice(n, 2 * n));
}

// Multiply Matrix (n x m) by Vector (m) -> Vector (n)
function matVecMul(A: number[][], x: number[]): number[] {
  return A.map(row => row.reduce((sum, val, idx) => sum + val * x[idx], 0));
}

// Calculate Drift Function F(theta)
export function evaluateDriftFunction(twoThetaDeg: number, errorFunc: SystematicErrorFunction): number {
  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;

  const cosT = Math.cos(thetaRad);
  const sinT = Math.sin(thetaRad);
  const cos2 = cosT * cosT;

  switch (errorFunc) {
    case 'nelson_riley':
      // F(theta) = 0.5 * (cos^2(theta)/sin(theta) + cos^2(theta)/theta)
      return 0.5 * ((cos2 / sinT) + (cos2 / thetaRad));
    case 'bradley_jay':
      // F(theta) = cos^2(theta)
      return cos2;
    case 'sample_displacement':
      // F(theta) = cos^2(theta) * sin(theta)
      return cos2 * sinT;
    case 'zero_shift':
      // F(theta) = cos(theta) * cot(theta) = cos^2(theta)/sin(theta)
      return cos2 / sinT;
    case 'flat_specimen':
      // F(theta) = cot(theta) * cos(theta)
      return (cosT * cosT) / sinT;
    case 'none':
    default:
      return 0;
  }
}

// --------------------------------------------------------------------------
// Core Cohen's Analytical Least-Squares Solver
// --------------------------------------------------------------------------
export function runCohenLeastSquaresRefinement(
  peaks: RefinementPeak[],
  wavelength: number,
  crystalSystem: CrystalSystemType,
  systematicError: SystematicErrorFunction = 'nelson_riley',
  weighting: WeightingModel = 'statistical',
  initialMonoclinicBeta: number = 90.0,
  initialRhombohedralAlpha: number = 60.0
): CohenRefinementResult {
  const defaultFail = (msg: string): CohenRefinementResult => ({
    converged: false,
    errorMessage: msg,
    crystalSystem,
    errorFunctionUsed: systematicError,
    weightingUsed: weighting,
    parameters: {
      a: { value: 0, stdError: 0, unit: 'Å' },
      b: { value: 0, stdError: 0, unit: 'Å' },
      c: { value: 0, stdError: 0, unit: 'Å' },
      alpha: { value: 90, stdError: 0, unit: '°' },
      beta: { value: 90, stdError: 0, unit: '°' },
      gamma: { value: 90, stdError: 0, unit: '°' },
      volume: { value: 0, stdError: 0, unit: 'Å³' }
    },
    metrics: {
      degreesOfFreedom: 0,
      sumSquaredResiduals: 0,
      reducedChiSquared: 0,
      gof: 0,
      rBraggPct: 0,
      rwpPct: 0
    },
    varianceCovarianceMatrix: [],
    correlationMatrix: [],
    parameterNames: [],
    reflections: [],
    nelsonRileyPlotData: []
  });

  const validPeaks = peaks.filter(p => {
    return p.twoThetaObs > 0 && p.twoThetaObs < 179 && (p.h !== 0 || p.k !== 0 || p.l !== 0);
  });

  if (validPeaks.length === 0) {
    return defaultFail('No valid reflections with mapped non-zero Miller indices (hkl) provided.');
  }

  const useDrift = systematicError !== 'none';
  const lam2 = wavelength * wavelength;
  const A_coeff_factor = lam2 / 4; // sin^2(theta) = (lambda^2 / 4) * (1/d^2)

  // Determine required number of unknown parameters P
  // Cubic: A0 = (lam^2 / 4a^2), plus optional D
  // Tetragonal: A0 = lam^2/(4a^2), C0 = lam^2/(4c^2), plus D
  // Hexagonal: A0 = lam^2/(3a^2), C0 = lam^2/(4c^2), plus D
  // Trigonal/Rhombohedral: A0, plus D
  // Orthorhombic: A0 = lam^2/(4a^2), B0 = lam^2/(4b^2), C0 = lam^2/(4c^2), plus D
  // Monoclinic: A0, B0, C0, D0 (cross-term 2hl cos(beta*)), plus D
  // Triclinic: S11, S22, S33, 2S12, 2S23, 2S13, plus D

  let numCellParams = 1;
  let paramNames: string[] = [];

  switch (crystalSystem) {
    case 'Cubic':
      numCellParams = 1;
      paramNames = ['A (λ²/4a²)'];
      break;
    case 'Tetragonal':
      numCellParams = 2;
      paramNames = ['A (λ²/4a²)', 'C (λ²/4c²)'];
      break;
    case 'Hexagonal':
      numCellParams = 2;
      paramNames = ['A (λ²/3a²)', 'C (λ²/4c²)'];
      break;
    case 'Trigonal':
      numCellParams = 2;
      paramNames = ['A (λ²/4a²)', 'C (λ²/4c²)'];
      break;
    case 'Orthorhombic':
      numCellParams = 3;
      paramNames = ['A (λ²/4a²)', 'B (λ²/4b²)', 'C (λ²/4c²)'];
      break;
    case 'Monoclinic':
      numCellParams = 4;
      paramNames = ['A (λ²/4a²sin²β)', 'B (λ²/4b²)', 'C (λ²/4c²sin²β)', 'D (-2cosβ/(4ac sin²β))'];
      break;
    case 'Triclinic':
      numCellParams = 6;
      paramNames = ['S11', 'S22', 'S33', '2S12', '2S23', '2S13'];
      break;
  }

  if (useDrift) {
    paramNames.push(`Drift δ (${systematicError})`);
  }

  const P = paramNames.length;
  const N = validPeaks.length;

  if (N < P) {
    return defaultFail(
      `Underdetermined system: ${N} reflections provided, but ${P} parameters (including drift) require at least ${P} independent reflections.`
    );
  }

  // Build Design Matrix X (N x P), Weight Matrix W (N), and Observed Vector Y (N)
  // Equation: Y_i = sin^2(theta_obs, i)
  // X_i = [derivative wrt param_1, ..., drift_function_i * 10 * sin^2(2theta)]
  const X: number[][] = [];
  const Y: number[] = [];
  const W: number[] = [];

  for (let i = 0; i < N; i++) {
    const pk = validPeaks[i];
    const { h, k, l, twoThetaObs } = pk;
    const thetaRad = (twoThetaObs / 2) * (Math.PI / 180);
    const sinTheta = Math.sin(thetaRad);
    const sin2Theta = sinTheta * sinTheta;

    Y.push(sin2Theta);

    // Compute Weight
    let w = 1.0;
    if (weighting === 'statistical') {
      // 1 / variance(sin^2 theta) ∝ tan^2(theta) / sin^2(theta)
      const tanTheta = Math.tan(thetaRad);
      w = Math.max(0.1, Math.pow(tanTheta, 2) / (pk.dObs * pk.dObs));
    } else if (weighting === 'inverse_variance') {
      const sigma2T = 0.02; // standard goniometer precision in degrees
      const dSin2_d2Theta = Math.sin(2 * thetaRad) * (Math.PI / 180) * 0.5;
      const varSin2 = Math.pow(dSin2_d2Theta * sigma2T, 2);
      w = 1.0 / Math.max(1e-10, varSin2);
    }
    W.push(w);

    const row: number[] = [];

    // Cell Parameter derivatives wrt quadratic form
    if (crystalSystem === 'Cubic') {
      row.push(h * h + k * k + l * l);
    } else if (crystalSystem === 'Tetragonal') {
      row.push(h * h + k * k);
      row.push(l * l);
    } else if (crystalSystem === 'Hexagonal') {
      row.push(h * h + h * k + k * k);
      row.push(l * l);
    } else if (crystalSystem === 'Trigonal') {
      row.push(h * h + h * k + k * k);
      row.push(l * l);
    } else if (crystalSystem === 'Orthorhombic') {
      row.push(h * h);
      row.push(k * k);
      row.push(l * l);
    } else if (crystalSystem === 'Monoclinic') {
      row.push(h * h);
      row.push(k * k);
      row.push(l * l);
      row.push(2 * h * l);
    } else if (crystalSystem === 'Triclinic') {
      row.push(h * h);
      row.push(k * k);
      row.push(l * l);
      row.push(2 * h * k);
      row.push(2 * k * l);
      row.push(2 * h * l);
    }

    if (useDrift) {
      const fTheta = evaluateDriftFunction(twoThetaObs, systematicError);
      // Cohen's drift form: drift * 10 * sin^2(2theta) or drift * sin^2(2theta)
      const sin2_2T = Math.pow(Math.sin(2 * thetaRad), 2);
      row.push(fTheta * sin2_2T * 10.0);
    }

    X.push(row);
  }

  // Normal Equations: (X^T W X) β = X^T W Y
  // 1. Build Normal Matrix M = X^T W X (P x P)
  const M: number[][] = Array.from({ length: P }, () => Array(P).fill(0));
  const RHS: number[] = Array(P).fill(0);

  for (let j = 0; j < P; j++) {
    for (let k = 0; k < P; k++) {
      let sum = 0;
      for (let i = 0; i < N; i++) {
        sum += X[i][j] * W[i] * X[i][k];
      }
      M[j][k] = sum;
    }

    let rhsSum = 0;
    for (let i = 0; i < N; i++) {
      rhsSum += X[i][j] * W[i] * Y[i];
    }
    RHS[j] = rhsSum;
  }

  // Invert Normal Matrix
  const invM = invertMatrix(M);
  if (!invM) {
    return defaultFail(
      'Normal matrix is singular or ill-conditioned. Reflections may be collinear or insufficient across axes.'
    );
  }

  // Solution vector β = inv(M) * RHS
  const beta = matVecMul(invM, RHS);

  // Check physical validity of parameters (A, B, C must be > 0)
  for (let pIdx = 0; pIdx < Math.min(3, numCellParams); pIdx++) {
    if (beta[pIdx] <= 0) {
      return defaultFail(
        `Refinement produced unphysical negative parameter (${paramNames[pIdx]} = ${beta[pIdx].toExponential(4)}). Check peak indexing.`
      );
    }
  }

  // Extract cell constants a, b, c, angles, and volume
  let a = 0, b = 0, c = 0;
  let alpha = 90, betaAngle = 90, gamma = 90;
  let vol = 0;

  if (crystalSystem === 'Cubic') {
    const A_param = beta[0];
    a = Math.sqrt(lam2 / (4 * A_param));
    b = a;
    c = a;
    vol = Math.pow(a, 3);
  } else if (crystalSystem === 'Tetragonal') {
    const A_param = beta[0];
    const C_param = beta[1];
    a = Math.sqrt(lam2 / (4 * A_param));
    b = a;
    c = Math.sqrt(lam2 / (4 * C_param));
    vol = a * a * c;
  } else if (crystalSystem === 'Hexagonal') {
    const A_param = beta[0];
    const C_param = beta[1];
    a = Math.sqrt(lam2 / (3 * A_param));
    b = a;
    c = Math.sqrt(lam2 / (4 * C_param));
    gamma = 120;
    vol = (Math.sqrt(3) / 2) * a * a * c;
  } else if (crystalSystem === 'Trigonal') {
    const A_param = beta[0];
    const C_param = beta[1];
    a = Math.sqrt(lam2 / (3 * A_param));
    b = a;
    c = Math.sqrt(lam2 / (4 * C_param));
    gamma = 120;
    vol = (Math.sqrt(3) / 2) * a * a * c;
  } else if (crystalSystem === 'Orthorhombic') {
    const A_param = beta[0];
    const B_param = beta[1];
    const C_param = beta[2];
    a = Math.sqrt(lam2 / (4 * A_param));
    b = Math.sqrt(lam2 / (4 * B_param));
    c = Math.sqrt(lam2 / (4 * C_param));
    vol = a * b * c;
  } else if (crystalSystem === 'Monoclinic') {
    const A_param = beta[0];
    const B_param = beta[1];
    const C_param = beta[2];
    const D_param = beta[3]; // cross term: beta[3] = - (lambda^2 * cos(beta)) / (4 * a * c * sin^2(beta)) = - cos(beta) * sqrt(A * C)

    b = Math.sqrt(lam2 / (4 * B_param));
    // Since X_i includes 2hl, beta[3] = -cos(beta) * sqrt(A * C), so cos(beta) = - D_param / sqrt(A * C)
    const cosBetaDirect = -D_param / Math.sqrt(Math.max(1e-12, A_param * C_param));
    const clampedCosBeta = Math.max(-0.999999, Math.min(0.999999, cosBetaDirect));
    betaAngle = Math.acos(clampedCosBeta) * (180 / Math.PI);
    const betaRad = betaAngle * (Math.PI / 180);
    const sinBeta = Math.sin(betaRad);
    
    a = Math.sqrt(lam2 / (4 * A_param)) / Math.max(1e-6, sinBeta);
    c = Math.sqrt(lam2 / (4 * C_param)) / Math.max(1e-6, sinBeta);
    vol = a * b * c * sinBeta;
  } else if (crystalSystem === 'Triclinic') {
    // In reciprocal metric tensor: S11 = a*^2, S22 = b*^2, S33 = c*^2
    // Since row pushed 2hk, 2kl, 2hl, beta[3]=S12, beta[4]=S23, beta[5]=S13 without extra division
    const S11 = beta[0], S22 = beta[1], S33 = beta[2];
    const S12 = beta[3], S23 = beta[4], S13 = beta[5];

    const aStar = Math.sqrt(Math.max(1e-12, S11)) * (2 / wavelength);
    const bStar = Math.sqrt(Math.max(1e-12, S22)) * (2 / wavelength);
    const cStar = Math.sqrt(Math.max(1e-12, S33)) * (2 / wavelength);

    const cosGammaStar = S12 / Math.sqrt(Math.max(1e-12, S11 * S22));
    const cosAlphaStar = S23 / Math.sqrt(Math.max(1e-12, S22 * S33));
    const cosBetaStar = S13 / Math.sqrt(Math.max(1e-12, S11 * S33));

    const alphaStar = Math.acos(Math.max(-0.999999, Math.min(0.999999, cosAlphaStar)));
    const betaStar = Math.acos(Math.max(-0.999999, Math.min(0.999999, cosBetaStar)));
    const gammaStar = Math.acos(Math.max(-0.999999, Math.min(0.999999, cosGammaStar)));

    // Invert reciprocal tensor to direct metric tensor
    const vStarRad = Math.max(1e-10, 1 - Math.pow(Math.cos(alphaStar), 2) - Math.pow(Math.cos(betaStar), 2) - Math.pow(Math.cos(gammaStar), 2) + 2 * Math.cos(alphaStar) * Math.cos(betaStar) * Math.cos(gammaStar));
    const vStar = aStar * bStar * cStar * Math.sqrt(vStarRad);
    vol = vStar > 0 ? 1 / vStar : 0;
    a = vStar > 0 ? (bStar * cStar * Math.sin(alphaStar)) / vStar : 0;
    b = vStar > 0 ? (aStar * cStar * Math.sin(betaStar)) / vStar : 0;
    c = vStar > 0 ? (aStar * bStar * Math.sin(gammaStar)) / vStar : 0;

    const cosAlphaArg = Math.max(-1.0, Math.min(1.0, (Math.cos(betaStar) * Math.cos(gammaStar) - Math.cos(alphaStar)) / Math.max(1e-9, Math.sin(betaStar) * Math.sin(gammaStar))));
    const cosBetaArg = Math.max(-1.0, Math.min(1.0, (Math.cos(alphaStar) * Math.cos(gammaStar) - Math.cos(betaStar)) / Math.max(1e-9, Math.sin(alphaStar) * Math.sin(gammaStar))));
    const cosGammaArg = Math.max(-1.0, Math.min(1.0, (Math.cos(alphaStar) * Math.cos(betaStar) - Math.cos(gammaStar)) / Math.max(1e-9, Math.sin(alphaStar) * Math.sin(betaStar))));

    alpha = Math.acos(cosAlphaArg) * 180 / Math.PI;
    betaAngle = Math.acos(cosBetaArg) * 180 / Math.PI;
    gamma = Math.acos(cosGammaArg) * 180 / Math.PI;
  }

  // Calculate residuals & statistical goodness of fit
  const DOF = Math.max(1, N - P);
  let sumSqRes = 0;
  let sumWeightRes = 0;
  let sumY = 0;
  let sumAbsDeltaD = 0;
  let sumDObs = 0;

  const reflectionOutputs: RefinementReflectionOutput[] = [];
  const nelsonRileyPlots: CohenRefinementResult['nelsonRileyPlotData'] = [];

  for (let i = 0; i < N; i++) {
    const pk = validPeaks[i];
    const { h, k, l, twoThetaObs, dObs } = pk;
    const sin2Obs = Y[i];
    const sin2Calc = matVecMul([X[i]], beta)[0];

    const residual = sin2Obs - sin2Calc;
    const w = W[i];
    sumSqRes += residual * residual;
    sumWeightRes += w * residual * residual;
    sumY += sin2Obs;

    const sinThetaCalc = Math.sqrt(Math.max(1e-12, Math.min(1.0, sin2Calc)));
    const thetaCalcRad = Math.asin(sinThetaCalc);
    const twoThetaCalc = thetaCalcRad * 2 * (180 / Math.PI);
    const dCalc = wavelength / (2 * sinThetaCalc);

    const deltaTwoTheta = twoThetaObs - twoThetaCalc;
    const deltaD = dObs - dCalc;
    sumAbsDeltaD += Math.abs(deltaD);
    sumDObs += dObs;

    const fTheta = evaluateDriftFunction(twoThetaObs, systematicError);
    
    // Calculate uncorrected apparent lattice parameter a_apparent and c_apparent for each reflection
    // For Cubic: a_app = d_obs * sqrt(h^2 + k^2 + l^2)
    // For Tetragonal: 1/d^2 = (h^2+k^2)/a^2 + l^2/c^2
    // If l=0 (hk0 reflection): a_app = d_obs * sqrt(h^2 + k^2)
    // If h=k=0 (00l reflection): c_app = d_obs * l
    // In general, using current refined aspect ratio c/a:
    let aExtrap = a;
    let cExtrap: number | undefined = undefined;
    let vExtrap: number | undefined = undefined;

    if (crystalSystem === 'Cubic') {
      const sHkl = Math.sqrt(h * h + k * k + l * l);
      aExtrap = dObs * sHkl;
      vExtrap = Math.pow(aExtrap, 3);
    } else if (crystalSystem === 'Tetragonal') {
      const cOverA = c / (a || 1.0);
      const sHkl = Math.sqrt((h * h + k * k) + (l * l) / (cOverA * cOverA));
      aExtrap = dObs * sHkl;
      cExtrap = aExtrap * cOverA;
      vExtrap = aExtrap * aExtrap * cExtrap;
    } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
      const cOverA = c / (a || 1.0);
      const sHkl = Math.sqrt((4 / 3) * (h * h + h * k + k * k) + (l * l) / (cOverA * cOverA));
      aExtrap = dObs * sHkl;
      cExtrap = aExtrap * cOverA;
      vExtrap = (Math.sqrt(3) / 2) * aExtrap * aExtrap * cExtrap;
    } else if (crystalSystem === 'Orthorhombic') {
      const bOverA = b / (a || 1.0);
      const cOverA = c / (a || 1.0);
      const sHkl = Math.sqrt((h * h) + (k * k) / (bOverA * bOverA) + (l * l) / (cOverA * cOverA));
      aExtrap = dObs * sHkl;
      vExtrap = aExtrap * (aExtrap * bOverA) * (aExtrap * cOverA);
    } else {
      // General proportional cell scaling factor
      const scaleFactor = dObs / (dCalc || dObs || 1.0);
      aExtrap = a * scaleFactor;
      vExtrap = vol * Math.pow(scaleFactor, 3);
    }

    reflectionOutputs.push({
      id: pk.id || `refl-${i}`,
      hkl: [h, k, l],
      hklString: `(${h} ${k} ${l})`,
      twoThetaObs,
      twoThetaCalc,
      deltaTwoTheta,
      dObs,
      dCalc,
      deltaD,
      sin2ThetaObs: sin2Obs,
      sin2ThetaCalc: sin2Calc,
      driftValue: fTheta,
      weight: w,
      relativeResidualPct: (Math.abs(deltaD) / dObs) * 100
    });

    nelsonRileyPlots.push({
      fTheta,
      aExtrap,
      cExtrap,
      vExtrap,
      hkl: `(${h} ${k} ${l})`,
      h,
      k,
      l,
      twoTheta: twoThetaObs,
      dObs,
      weight: w
    });
  }

  // Calculate Linear Extrapolation Fit for Nelson-Riley Plot: a_app = a_true + m * F(theta)
  let sumW = 0;
  let sumWF = 0;
  let sumWA = 0;
  let sumWF2 = 0;
  let sumWFA = 0;
  let sumWA2 = 0;

  for (const pt of nelsonRileyPlots) {
    const w = pt.weight > 0 ? pt.weight : 1.0;
    const f = pt.fTheta;
    const aVal = pt.aExtrap;

    sumW += w;
    sumWF += w * f;
    sumWA += w * aVal;
    sumWF2 += w * f * f;
    sumWFA += w * f * aVal;
    sumWA2 += w * aVal * aVal;
  }

  const deltaFit = sumW * sumWF2 - sumWF * sumWF;
  let slopeA = 0;
  let interceptA = a;
  let r2A = 1.0;

  if (Math.abs(deltaFit) > 1e-12 && nelsonRileyPlots.length >= 2) {
    slopeA = (sumW * sumWFA - sumWF * sumWA) / deltaFit;
    interceptA = (sumWF2 * sumWA - sumWF * sumWFA) / deltaFit;

    // R^2 calculation
    const meanA = sumWA / sumW;
    const ssTot = sumWA2 - sumW * meanA * meanA;
    let ssRes = 0;
    for (const pt of nelsonRileyPlots) {
      const pred = interceptA + slopeA * pt.fTheta;
      const res = pt.aExtrap - pred;
      const w = pt.weight > 0 ? pt.weight : 1.0;
      ssRes += w * res * res;
      pt.fitLineA = pred;
    }
    r2A = ssTot > 1e-12 ? Math.max(0, Math.min(1.0, 1 - ssRes / ssTot)) : 1.0;
  } else {
    for (const pt of nelsonRileyPlots) {
      pt.fitLineA = a;
    }
  }

  const nrFitMetrics: NelsonRileyFitMetrics = {
    slopeA,
    interceptA,
    r2A,
    systematicModel: systematicError
  };

  const s2 = sumWeightRes / DOF; // Reduced chi-squared
  const gof = Math.sqrt(s2);
  const rBraggPct = (sumAbsDeltaD / sumDObs) * 100;
  const rwpPct = Math.sqrt(sumWeightRes / Math.max(1e-10, Y.reduce((s, y, i) => s + W[i] * y * y, 0))) * 100;

  // Variance-Covariance Matrix: Cov(β) = s² * inv(M)
  const covBeta: number[][] = Array.from({ length: P }, () => Array(P).fill(0));
  const corrMatrix: number[][] = Array.from({ length: P }, () => Array(P).fill(0));
  const stdBeta: number[] = [];

  for (let j = 0; j < P; j++) {
    for (let k = 0; k < P; k++) {
      covBeta[j][k] = s2 * invM[j][k];
    }
    const varJ = Math.max(0, covBeta[j][j]);
    stdBeta.push(Math.sqrt(varJ));
  }

  for (let j = 0; j < P; j++) {
    for (let k = 0; k < P; k++) {
      const denom = stdBeta[j] * stdBeta[k];
      corrMatrix[j][k] = denom > 0 ? covBeta[j][k] / denom : 0;
    }
  }

  // Error propagation via full Jacobian covariance: Sigma_p = J * Cov(beta) * J^T
  const extractDirectCell = (bVec: number[]): [number, number, number, number, number, number, number] => {
    let ca = a, cb = b, cc = c, calpha = alpha, cbeta = betaAngle, cgamma = gamma, cvol = vol;
    if (crystalSystem === 'Cubic') {
      if (bVec[0] <= 0) return [a, b, c, alpha, betaAngle, gamma, vol];
      ca = Math.sqrt(lam2 / (4 * bVec[0])); cb = ca; cc = ca; cvol = ca ** 3;
    } else if (crystalSystem === 'Tetragonal') {
      if (bVec[0] <= 0 || bVec[1] <= 0) return [a, b, c, alpha, betaAngle, gamma, vol];
      ca = Math.sqrt(lam2 / (4 * bVec[0])); cb = ca; cc = Math.sqrt(lam2 / (4 * bVec[1])); cvol = ca * ca * cc;
    } else if (crystalSystem === 'Hexagonal' || crystalSystem === 'Trigonal') {
      if (bVec[0] <= 0 || bVec[1] <= 0) return [a, b, c, alpha, betaAngle, gamma, vol];
      ca = Math.sqrt(lam2 / (3 * bVec[0])); cb = ca; cc = Math.sqrt(lam2 / (4 * bVec[1])); cgamma = 120;
      cvol = (Math.sqrt(3) / 2) * ca * ca * cc;
    } else if (crystalSystem === 'Orthorhombic') {
      if (bVec[0] <= 0 || bVec[1] <= 0 || bVec[2] <= 0) return [a, b, c, alpha, betaAngle, gamma, vol];
      ca = Math.sqrt(lam2 / (4 * bVec[0])); cb = Math.sqrt(lam2 / (4 * bVec[1])); cc = Math.sqrt(lam2 / (4 * bVec[2])); cvol = ca * cb * cc;
    } else if (crystalSystem === 'Monoclinic') {
      if (bVec[0] <= 0 || bVec[1] <= 0 || bVec[2] <= 0) return [a, b, c, alpha, betaAngle, gamma, vol];
      cb = Math.sqrt(lam2 / (4 * bVec[1]));
      const cosB = Math.max(-0.999999, Math.min(0.999999, -bVec[3] / Math.sqrt(Math.max(1e-12, bVec[0] * bVec[2]))));
      const bRad = Math.acos(cosB);
      cbeta = bRad * (180 / Math.PI);
      const sinB = Math.sin(bRad);
      ca = Math.sqrt(lam2 / (4 * bVec[0])) / Math.max(1e-6, sinB);
      cc = Math.sqrt(lam2 / (4 * bVec[2])) / Math.max(1e-6, sinB);
      cvol = ca * cb * cc * sinB;
    } else if (crystalSystem === 'Triclinic') {
      const [s11, s22, s33, s12, s23, s13] = bVec;
      if (s11 <= 0 || s22 <= 0 || s33 <= 0) return [a, b, c, alpha, betaAngle, gamma, vol];
      const as = Math.sqrt(s11) * (2 / wavelength), bs = Math.sqrt(s22) * (2 / wavelength), cs = Math.sqrt(s33) * (2 / wavelength);
      const gs = Math.acos(Math.max(-0.999999, Math.min(0.999999, s12 / Math.sqrt(s11 * s22))));
      const als = Math.acos(Math.max(-0.999999, Math.min(0.999999, s23 / Math.sqrt(s22 * s33))));
      const bes = Math.acos(Math.max(-0.999999, Math.min(0.999999, s13 / Math.sqrt(s11 * s33))));
      const vsRad = Math.max(1e-10, 1 - Math.cos(als) ** 2 - Math.cos(bes) ** 2 - Math.cos(gs) ** 2 + 2 * Math.cos(als) * Math.cos(bes) * Math.cos(gs));
      const vs = as * bs * cs * Math.sqrt(vsRad);
      cvol = 1 / vs;
      ca = (bs * cs * Math.sin(als)) / vs; cb = (as * cs * Math.sin(bes)) / vs; cc = (as * bs * Math.sin(gs)) / vs;
      calpha = Math.acos(Math.max(-1, Math.min(1, (Math.cos(bes) * Math.cos(gs) - Math.cos(als)) / Math.max(1e-9, Math.sin(bes) * Math.sin(gs))))) * 180 / Math.PI;
      cbeta = Math.acos(Math.max(-1, Math.min(1, (Math.cos(als) * Math.cos(gs) - Math.cos(bes)) / Math.max(1e-9, Math.sin(als) * Math.sin(gs))))) * 180 / Math.PI;
      cgamma = Math.acos(Math.max(-1, Math.min(1, (Math.cos(als) * Math.cos(bes) - Math.cos(gs)) / Math.max(1e-9, Math.sin(als) * Math.sin(bes))))) * 180 / Math.PI;
    }
    return [ca, cb, cc, calpha, cbeta, cgamma, cvol];
  };

  const jacobian: number[][] = Array.from({ length: 7 }, () => Array(P).fill(0));
  for (let j = 0; j < P; j++) {
    const hStep = Math.max(1e-8, Math.abs(beta[j]) * 1e-5);
    const bp = [...beta]; bp[j] += hStep;
    const bm = [...beta]; bm[j] -= hStep;
    const fp = extractDirectCell(bp);
    const fm = extractDirectCell(bm);
    for (let k = 0; k < 7; k++) jacobian[k][j] = (fp[k] - fm[k]) / (2 * hStep);
  }
  const propagatedVar = Array(7).fill(0);
  for (let k = 0; k < 7; k++) {
    let v = 0;
    for (let r = 0; r < P; r++) {
      for (let cIdx = 0; cIdx < P; cIdx++) v += jacobian[k][r] * covBeta[r][cIdx] * jacobian[k][cIdx];
    }
    propagatedVar[k] = Math.max(0, v);
  }

  const sigmaA = Math.sqrt(propagatedVar[0]);
  const sigmaB = Math.sqrt(propagatedVar[1]);
  const sigmaC = Math.sqrt(propagatedVar[2]);
  const sigmaAlpha = Math.sqrt(propagatedVar[3]);
  const sigmaBeta = Math.sqrt(propagatedVar[4]);
  const sigmaGamma = Math.sqrt(propagatedVar[5]);
  const sigmaVol = Math.sqrt(propagatedVar[6]);

  const driftResult: RefinementParameterResult | undefined = useDrift
    ? {
        value: beta[P - 1],
        stdError: stdBeta[P - 1],
        unit: 'arb.'
      }
    : undefined;

  return {
    converged: true,
    crystalSystem,
    errorFunctionUsed: systematicError,
    weightingUsed: weighting,
    parameters: {
      a: { value: a, stdError: sigmaA, unit: 'Å' },
      b: { value: b, stdError: sigmaB, unit: 'Å' },
      c: { value: c, stdError: sigmaC, unit: 'Å' },
      alpha: { value: alpha, stdError: sigmaAlpha, unit: '°' },
      beta: { value: betaAngle, stdError: sigmaBeta, unit: '°' },
      gamma: { value: gamma, stdError: sigmaGamma, unit: '°' },
      volume: { value: vol, stdError: sigmaVol, unit: 'Å³' },
      driftParam: driftResult
    },
    metrics: {
      degreesOfFreedom: DOF,
      sumSquaredResiduals: sumSqRes,
      reducedChiSquared: s2,
      gof,
      rBraggPct,
      rwpPct
    },
    varianceCovarianceMatrix: covBeta,
    correlationMatrix: corrMatrix,
    parameterNames: paramNames,
    reflections: reflectionOutputs,
    nelsonRileyPlotData: nelsonRileyPlots,
    nelsonRileyFitMetrics: nrFitMetrics
  };
}
