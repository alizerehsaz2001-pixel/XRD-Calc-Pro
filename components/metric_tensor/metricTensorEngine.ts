import { CrystalSystem, LatticeParams } from './metricTensorTypes';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export interface EigenDecomposition3x3 {
  values: [number, number, number];
  vectors: [number, number, number][]; // columns: vectors[row][eigIdx]
}

export interface DirectMetricResult {
  G: number[][];
  detG: number;
  volumeV: number;
  invariants: { I1: number; I2: number; I3: number };
  eigen: EigenDecomposition3x3;
  conditionNumber: number;
}

export interface ReciprocalMetricResult {
  GStar: number[][];
  VStar: number;
  aStar: number;
  bStar: number;
  cStar: number;
  alphaStar: number;
  betaStar: number;
  gammaStar: number;
}

export interface DualFramesResult {
  matrixA: number[][]; // Direct fractional -> Cartesian (A^T A = G), units Å
  matrixB: number[][]; // Reciprocal hkl -> Cartesian (B^T B = G*), units Å^-1
  matrixATA: number[][];
  matrixBTB: number[][];
  matrixATB: number[][];
  residualATA: number;
  residualBTB: number;
  residualATB: number;
}

export interface NiggliReductionResult {
  originalVector: { A: number; B: number; C: number; D: number; E: number; F: number };
  reducedVector: { A: number; B: number; C: number; D: number; E: number; F: number };
  reducedG: number[][];
  reducedParams: LatticeParams;
  transformP: number[][];
  detP: number;
  type: 'Type I (Acute)' | 'Type II (Obtuse)';
  isAlreadyNiggli: boolean;
  iterations: number;
  reconstructionError: number;
}

export interface BasisTransformResult {
  detP: number;
  isValid: boolean;
  GPrime: number[][];
  GStarPrime: number[][];
  paramsPrime: LatticeParams;
  volumePrime: number;
}

export interface StrainTensorResult {
  deformedG: number[][];
  deformedParams: LatticeParams;
  deformedVolume: number;
  volumetricStrainPct: number;
  principalStrains: [number, number, number];
  principalDirections: [number, number, number][];
  vonMisesStrain: number;
  octahedralShearStrain: number;
  dOriginal: number;
  dDeformed: number;
  relativeDStrainPct: number;
  twoThetaOrig: number | null;
  twoThetaDef: number | null;
  deltaTwoThetaDeg: number | null;
}

export function matMul3(A: number[][], B: number[][]): number[][] {
  const out = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) {
        s += A[i][k] * B[k][j];
      }
      out[i][j] = s;
    }
  }
  return out;
}

export function transpose3(A: number[][]): number[][] {
  return [
    [A[0][0], A[1][0], A[2][0]],
    [A[0][1], A[1][1], A[2][1]],
    [A[0][2], A[1][2], A[2][2]]
  ];
}

export function matVec3(A: number[][], v: [number, number, number]): [number, number, number] {
  return [
    A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2],
    A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2],
    A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]
  ];
}

export function det3(M: number[][]): number {
  return (
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  );
}

export function invert3(M: number[][]): number[][] | null {
  const d = det3(M);
  if (Math.abs(d) < 1e-14) return null;
  const invD = 1 / d;
  return [
    [
      (M[1][1] * M[2][2] - M[1][2] * M[2][1]) * invD,
      (M[0][2] * M[2][1] - M[0][1] * M[2][2]) * invD,
      (M[0][1] * M[1][2] - M[0][2] * M[1][1]) * invD
    ],
    [
      (M[1][2] * M[2][0] - M[1][0] * M[2][2]) * invD,
      (M[0][0] * M[2][2] - M[0][2] * M[2][0]) * invD,
      (M[0][2] * M[1][0] - M[0][0] * M[1][2]) * invD
    ],
    [
      (M[1][0] * M[2][1] - M[1][1] * M[2][0]) * invD,
      (M[0][1] * M[2][0] - M[0][0] * M[2][1]) * invD,
      (M[0][0] * M[1][1] - M[0][1] * M[1][0]) * invD
    ]
  ];
}

export function frobeniusDiff(A: number[][], B: number[][]): number {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const diff = A[i][j] - B[i][j];
      sum += diff * diff;
    }
  }
  return Math.sqrt(sum);
}

export function quadraticForm(M: number[][], v: [number, number, number]): number {
  let s = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      s += v[i] * M[i][j] * v[j];
    }
  }
  return s;
}

export function bilinearForm(M: number[][], u: [number, number, number], v: [number, number, number]): number {
  let s = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      s += u[i] * M[i][j] * v[j];
    }
  }
  return s;
}

/**
 * Exact 3x3 Symmetric Jacobi Eigensolver returning descending eigenvalues and orthonormal eigenvectors.
 */
export function jacobiEigen3x3(M: number[][]): EigenDecomposition3x3 {
  const A = [
    [M[0][0], M[0][1], M[0][2]],
    [M[1][0], M[1][1], M[1][2]],
    [M[2][0], M[2][1], M[2][2]]
  ];
  const V = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  for (let sweep = 0; sweep < 40; sweep++) {
    let p = 0;
    let q = 1;
    let maxOff = Math.abs(A[0][1]);
    if (Math.abs(A[0][2]) > maxOff) {
      maxOff = Math.abs(A[0][2]);
      p = 0;
      q = 2;
    }
    if (Math.abs(A[1][2]) > maxOff) {
      maxOff = Math.abs(A[1][2]);
      p = 1;
      q = 2;
    }
    if (maxOff < 1e-13) break;

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

    for (let r = 0; r < 3; r++) {
      if (r !== p && r !== q) {
        const arp = A[r][p];
        const arq = A[r][q];
        A[r][p] = c * arp - s * arq;
        A[p][r] = A[r][p];
        A[r][q] = s * arp + c * arq;
        A[q][r] = A[r][q];
      }
      const vrp = V[r][p];
      const vrq = V[r][q];
      V[r][p] = c * vrp - s * vrq;
      V[r][q] = s * vrp + c * vrq;
    }
  }

  const pairs = [0, 1, 2]
    .map((idx) => ({
      val: A[idx][idx],
      vec: [V[0][idx], V[1][idx], V[2][idx]] as [number, number, number]
    }))
    .sort((x, y) => y.val - x.val);

  return {
    values: [pairs[0].val, pairs[1].val, pairs[2].val],
    vectors: [pairs[0].vec, pairs[1].vec, pairs[2].vec]
  };
}

export function extractParamsFromMetric(G: number[][]): LatticeParams {
  const a = Math.sqrt(Math.max(0, G[0][0]));
  const b = Math.sqrt(Math.max(0, G[1][1]));
  const c = Math.sqrt(Math.max(0, G[2][2]));
  const alpha = b > 0 && c > 0 ? Math.acos(Math.max(-1, Math.min(1, G[1][2] / (b * c)))) * RAD2DEG : 90;
  const beta = a > 0 && c > 0 ? Math.acos(Math.max(-1, Math.min(1, G[0][2] / (a * c)))) * RAD2DEG : 90;
  const gamma = a > 0 && b > 0 ? Math.acos(Math.max(-1, Math.min(1, G[0][1] / (a * b)))) * RAD2DEG : 90;
  return { a, b, c, alpha, beta, gamma };
}

export function computeDirectMetric(params: LatticeParams): DirectMetricResult {
  const { a, b, c, alpha, beta, gamma } = params;
  const ca = Math.cos(alpha * DEG2RAD);
  const cb = Math.cos(beta * DEG2RAD);
  const cg = Math.cos(gamma * DEG2RAD);

  const g11 = a * a;
  const g22 = b * b;
  const g33 = c * c;
  const g12 = a * b * cg;
  const g13 = a * c * cb;
  const g23 = b * c * ca;

  const G = [
    [g11, g12, g13],
    [g12, g22, g23],
    [g13, g23, g33]
  ];

  const determinant = det3(G);
  const volumeV = determinant > 0 ? Math.sqrt(determinant) : 0;
  const I1 = g11 + g22 + g33;
  const I2 = (g11 * g22 - g12 * g12) + (g22 * g33 - g23 * g23) + (g11 * g33 - g13 * g13);
  const eigen = jacobiEigen3x3(G);
  const minEig = Math.max(1e-12, eigen.values[2]);
  const conditionNumber = eigen.values[0] / minEig;

  return {
    G,
    detG: determinant,
    volumeV,
    invariants: { I1, I2, I3: determinant },
    eigen,
    conditionNumber
  };
}

export function computeReciprocalMetric(G: number[][], detG: number, volumeV: number): ReciprocalMetricResult {
  if (detG <= 1e-14) {
    const zeros = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    return {
      GStar: zeros,
      VStar: 0,
      aStar: 0,
      bStar: 0,
      cStar: 0,
      alphaStar: 90,
      betaStar: 90,
      gammaStar: 90
    };
  }

  const GStar = invert3(G) || [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  const aS = Math.sqrt(Math.max(0, GStar[0][0]));
  const bS = Math.sqrt(Math.max(0, GStar[1][1]));
  const cS = Math.sqrt(Math.max(0, GStar[2][2]));

  const alphaStar = bS > 0 && cS > 0 ? Math.acos(Math.max(-1, Math.min(1, GStar[1][2] / (bS * cS)))) * RAD2DEG : 90;
  const betaStar = aS > 0 && cS > 0 ? Math.acos(Math.max(-1, Math.min(1, GStar[0][2] / (aS * cS)))) * RAD2DEG : 90;
  const gammaStar = aS > 0 && bS > 0 ? Math.acos(Math.max(-1, Math.min(1, GStar[0][1] / (aS * bS)))) * RAD2DEG : 90;

  return {
    GStar,
    VStar: volumeV > 0 ? 1 / volumeV : 0,
    aStar: aS,
    bStar: bS,
    cStar: cS,
    alphaStar,
    betaStar,
    gammaStar
  };
}

/**
 * Dual Busing-Levy (1967) Cartesian Orthogonalization Frames:
 * - B (upper triangular): maps reciprocal Miller indices (hkl) to Cartesian scattering vector q = B*h (B^T B = G*)
 * - A = (B^-1)^T (lower triangular): maps direct fractional coords (xyz) to Cartesian Å vector r = A*x (A^T A = G)
 * - Dual biorthogonality identity: A^T B = I_3
 */
export function computeDualFrames(
  params: LatticeParams,
  G: number[][],
  recip: ReciprocalMetricResult
): DualFramesResult {
  const { aStar, bStar, cStar, alphaStar, betaStar, gammaStar } = recip;
  const alS = alphaStar * DEG2RAD;
  const beS = betaStar * DEG2RAD;
  const gaS = gammaStar * DEG2RAD;
  const al = params.alpha * DEG2RAD;

  const sinGaS = Math.sin(gaS);
  const sinBeS = Math.sin(beS);

  const b11 = aStar;
  const b12 = bStar * Math.cos(gaS);
  const b13 = cStar * Math.cos(beS);
  const b22 = bStar * sinGaS;
  const b23 = -cStar * sinBeS * Math.cos(al);
  const b33 = params.c > 0 ? 1 / params.c : 0;

  const B = [
    [b11, b12, b13],
    [0, b22, b23],
    [0, 0, b33]
  ];

  const invB = invert3(B);
  const A = invB
    ? transpose3(invB)
    : [
        [params.a, 0, 0],
        [0, params.b, 0],
        [0, 0, params.c]
      ];

  const matrixATA = matMul3(transpose3(A), A);
  const matrixBTB = matMul3(transpose3(B), B);
  const matrixATB = matMul3(transpose3(A), B);
  const eye = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  return {
    matrixA: A,
    matrixB: B,
    matrixATA,
    matrixBTB,
    matrixATB,
    residualATA: frobeniusDiff(matrixATA, G),
    residualBTB: frobeniusDiff(matrixBTB, recip.GStar),
    residualATB: frobeniusDiff(matrixATB, eye)
  };
}

/**
 * Full Křivý & Gruber (1976) Niggli Cell Reduction Algorithm (Acta Cryst. A32, 297-299)
 * Finds the unique shortest right-handed reduced primitive cell (A, B, C, xi, eta, zeta)
 * and tracks the exact unimodular integer matrix P in SL(3, Z) such that G_reduced = P^T G P.
 */
export function computeNiggliReduction(G: number[][]): NiggliReductionResult {
  const A0 = G[0][0];
  const B0 = G[1][1];
  const C0 = G[2][2];
  const xi0 = 2 * G[1][2];
  const eta0 = 2 * G[0][2];
  const zeta0 = 2 * G[0][1];

  let A = A0;
  let B = B0;
  let C = C0;
  let xi = xi0;
  let eta = eta0;
  let zeta = zeta0;

  // Track P such that reduced basis [a' b' c'] = [a b c] P
  let P = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  const eps = 1e-7 * Math.cbrt(Math.max(1e-12, det3(G)));
  const applyP = (M: number[][]) => {
    P = matMul3(P, M);
    const Gr = matMul3(transpose3(P), matMul3(G, P));
    A = Gr[0][0];
    B = Gr[1][1];
    C = Gr[2][2];
    xi = 2 * Gr[1][2];
    eta = 2 * Gr[0][2];
    zeta = 2 * Gr[0][1];
  };

  let iterations = 0;
  const maxIter = 250;

  while (iterations < maxIter) {
    iterations++;

    // Step 1: If A > B or (A == B and |xi| > |eta|), swap a <-> b and negate c to keep det=+1
    if (A > B + eps || (Math.abs(A - B) <= eps && Math.abs(xi) > Math.abs(eta) + eps)) {
      applyP([
        [0, 1, 0],
        [1, 0, 0],
        [0, 0, -1]
      ]);
      continue;
    }

    // Step 2: If B > C or (B == C and |eta| > |zeta|), swap b <-> c and negate a to keep det=+1
    if (B > C + eps || (Math.abs(B - C) <= eps && Math.abs(eta) > Math.abs(zeta) + eps)) {
      applyP([
        [-1, 0, 0],
        [0, 0, 1],
        [0, 1, 0]
      ]);
      continue;
    }

    // Step 3 & 4: Sign normalization so xi, eta, zeta are either all > 0 (Type I) or all <= 0 (Type II)
    const i1 = xi > eps ? 1 : xi < -eps ? -1 : 0;
    const i2 = eta > eps ? 1 : eta < -eps ? -1 : 0;
    const i3 = zeta > eps ? 1 : zeta < -eps ? -1 : 0;

    if (i1 * i2 * i3 > 0) {
      // Type I target (+ + +)
      if (i1 < 0 || i2 < 0 || i3 < 0) {
        const s1 = i1 < 0 ? -1 : 1;
        const s2 = i2 < 0 ? -1 : 1;
        const s3 = i3 < 0 ? -1 : 1;
        applyP([
          [s1, 0, 0],
          [0, s2, 0],
          [0, 0, s3]
        ]);
        continue;
      }
    } else {
      // Type II target (- - -, or 0)
      if (i1 > 0 || i2 > 0 || i3 > 0) {
        let j1 = i1 > 0 ? -1 : 1;
        let j2 = i2 > 0 ? -1 : 1;
        let j3 = i3 > 0 ? -1 : 1;
        if (j1 * j2 * j3 < 0) {
          if (i1 === 0) j1 = -j1;
          else if (i2 === 0) j2 = -j2;
          else if (i3 === 0) j3 = -j3;
        }
        applyP([
          [j1, 0, 0],
          [0, j2, 0],
          [0, 0, j3]
        ]);
        continue;
      }
    }

    // Step 5: Reduce |xi| <= B
    if (Math.abs(xi) > B + eps || (Math.abs(xi - B) <= eps && 2 * eta < zeta - eps) || (Math.abs(xi + B) <= eps && zeta < -eps)) {
      const sign = xi >= 0 ? -1 : 1;
      applyP([
        [1, 0, 0],
        [0, 1, sign],
        [0, 0, 1]
      ]);
      continue;
    }

    // Step 6: Reduce |eta| <= A
    if (Math.abs(eta) > A + eps || (Math.abs(eta - A) <= eps && 2 * xi < zeta - eps) || (Math.abs(eta + A) <= eps && zeta < -eps)) {
      const sign = eta >= 0 ? -1 : 1;
      applyP([
        [1, 0, sign],
        [0, 1, 0],
        [0, 0, 1]
      ]);
      continue;
    }

    // Step 7: Reduce |zeta| <= A
    if (Math.abs(zeta) > A + eps || (Math.abs(zeta - A) <= eps && 2 * xi < eta - eps) || (Math.abs(zeta + A) <= eps && eta < -eps)) {
      const sign = zeta >= 0 ? -1 : 1;
      applyP([
        [1, sign, 0],
        [0, 1, 0],
        [0, 0, 1]
      ]);
      continue;
    }

    // Step 8: Special triangle inequality check xi + eta + zeta + A + B < 0
    if (xi + eta + zeta + A + B < -eps || (Math.abs(xi + eta + zeta + A + B) <= eps && 2 * (A + eta) + zeta > eps)) {
      applyP([
        [1, 0, 1],
        [0, 1, 1],
        [0, 0, 1]
      ]);
      continue;
    }

    break;
  }

  // Ensure positive determinant +1
  if (det3(P) < 0) {
    applyP([
      [-1, 0, 0],
      [0, -1, 0],
      [0, 0, -1]
    ]);
  }

  const reducedG = matMul3(transpose3(P), matMul3(G, P));
  const reducedParams = extractParamsFromMetric(reducedG);
  const type = xi > eps && eta > eps && zeta > eps ? 'Type I (Acute)' : 'Type II (Obtuse)';

  const isAlreadyNiggli =
    Math.abs(A - A0) < 1e-4 &&
    Math.abs(B - B0) < 1e-4 &&
    Math.abs(C - C0) < 1e-4 &&
    Math.abs(xi - xi0) < 1e-4 &&
    Math.abs(eta - eta0) < 1e-4 &&
    Math.abs(zeta - zeta0) < 1e-4;

  const GCheck = matMul3(transpose3(P), matMul3(G, P));
  const reconstructionError = frobeniusDiff(GCheck, reducedG);

  return {
    originalVector: { A: A0, B: B0, C: C0, D: xi0, E: eta0, F: zeta0 },
    reducedVector: { A, B, C, D: xi, E: eta, F: zeta },
    reducedG,
    reducedParams,
    transformP: P,
    detP: Math.round(det3(P)),
    type,
    isAlreadyNiggli,
    iterations: Math.max(0, iterations - 1),
    reconstructionError
  };
}

export function applyBasisTransform(G: number[][], GStar: number[][], P: number[][]): BasisTransformResult {
  const detP = det3(P);
  const invP = invert3(P);
  if (!invP || Math.abs(detP) < 1e-9) {
    return {
      detP,
      isValid: false,
      GPrime: G,
      GStarPrime: GStar,
      paramsPrime: extractParamsFromMetric(G),
      volumePrime: Math.sqrt(Math.max(0, det3(G)))
    };
  }
  const GPrime = matMul3(transpose3(P), matMul3(G, P));
  const GStarPrime = matMul3(invP, matMul3(GStar, transpose3(invP)));
  const paramsPrime = extractParamsFromMetric(GPrime);
  const volumePrime = Math.sqrt(Math.max(0, det3(GPrime)));
  return {
    detP,
    isValid: true,
    GPrime,
    GStarPrime,
    paramsPrime,
    volumePrime
  };
}

export function computeBondGeometry(
  G: number[][],
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
) {
  const v21: [number, number, number] = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
  const v23: [number, number, number] = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]];
  const v13: [number, number, number] = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];

  const d12 = Math.sqrt(Math.max(0, quadraticForm(G, v21)));
  const d23 = Math.sqrt(Math.max(0, quadraticForm(G, v23)));
  const d13 = Math.sqrt(Math.max(0, quadraticForm(G, v13)));

  const dot = bilinearForm(G, v21, v23);
  const denom = d12 * d23;
  const bondAngleDeg = denom > 1e-12 ? Math.acos(Math.max(-1, Math.min(1, dot / denom))) * RAD2DEG : 0;

  return { d12, d23, d13, bondAngleDeg };
}

export function computeMixedSpaceAngle(
  G: number[][],
  GStar: number[][],
  hkl: [number, number, number],
  uvw: [number, number, number]
): number {
  const uLen = Math.sqrt(Math.max(0, quadraticForm(G, uvw)));
  const hLen = Math.sqrt(Math.max(0, quadraticForm(GStar, hkl)));
  if (uLen <= 1e-12 || hLen <= 1e-12) return 90;
  const dot = hkl[0] * uvw[0] + hkl[1] * uvw[1] + hkl[2] * uvw[2];
  return Math.acos(Math.max(-1, Math.min(1, dot / (uLen * hLen)))) * RAD2DEG;
}

export function computeDirectionAngle(
  G: number[][],
  u1: [number, number, number],
  u2: [number, number, number]
): number {
  const len1 = Math.sqrt(Math.max(0, quadraticForm(G, u1)));
  const len2 = Math.sqrt(Math.max(0, quadraticForm(G, u2)));
  if (len1 <= 1e-12 || len2 <= 1e-12) return 0;
  const dot = bilinearForm(G, u1, u2);
  return Math.acos(Math.max(-1, Math.min(1, dot / (len1 * len2)))) * RAD2DEG;
}

/**
 * Exact finite deformation metric calculation:
 * F = I + eps_cart -> A' = F * A -> G' = A'^T A' = A^T F^T F A
 * Accurately captures shear & coupling in non-orthogonal monoclinic/triclinic unit cells!
 */
export function computeFiniteStrainTensor(
  matrixA: number[][],
  G: number[][],
  GStar: number[][],
  volumeV: number,
  epsCart: number[][],
  hkl: [number, number, number],
  wavelength: number = 1.5406
): StrainTensorResult {
  const F = [
    [1 + epsCart[0][0], epsCart[0][1], epsCart[0][2]],
    [epsCart[1][0], 1 + epsCart[1][1], epsCart[1][2]],
    [epsCart[2][0], epsCart[2][1], 1 + epsCart[2][2]]
  ];

  const APrime = matMul3(F, matrixA);
  const deformedG = matMul3(transpose3(APrime), APrime);
  const deformedParams = extractParamsFromMetric(deformedG);
  const detDefG = det3(deformedG);
  const deformedVolume = detDefG > 0 ? Math.sqrt(detDefG) : volumeV;
  const volumetricStrainPct = volumeV > 0 ? ((deformedVolume - volumeV) / volumeV) * 100 : 0;

  const eigen = jacobiEigen3x3(epsCart);
  const [e1, e2, e3] = eigen.values;
  const vonMisesStrain = Math.sqrt(0.5 * ((e1 - e2) ** 2 + (e2 - e3) ** 2 + (e3 - e1) ** 2));
  const octahedralShearStrain = (2 / 3) * Math.sqrt((e1 - e2) ** 2 + (e2 - e3) ** 2 + (e3 - e1) ** 2);

  // Peak d-spacing & 2theta shift
  const invD2Orig = quadraticForm(GStar, hkl);
  const dOriginal = invD2Orig > 1e-12 ? 1 / Math.sqrt(invD2Orig) : 0;

  const deformedGStar = invert3(deformedG) || GStar;
  const invD2Def = quadraticForm(deformedGStar, hkl);
  const dDeformed = invD2Def > 1e-12 ? 1 / Math.sqrt(invD2Def) : 0;

  const relativeDStrainPct = dOriginal > 0 ? ((dDeformed - dOriginal) / dOriginal) * 100 : 0;

  const sinOrig = dOriginal > 0 ? wavelength / (2 * dOriginal) : 2;
  const sinDef = dDeformed > 0 ? wavelength / (2 * dDeformed) : 2;
  const twoThetaOrig = sinOrig > 0 && sinOrig <= 1 ? 2 * Math.asin(sinOrig) * RAD2DEG : null;
  const twoThetaDef = sinDef > 0 && sinDef <= 1 ? 2 * Math.asin(sinDef) * RAD2DEG : null;
  const deltaTwoThetaDeg = twoThetaOrig !== null && twoThetaDef !== null ? twoThetaDef - twoThetaOrig : null;

  return {
    deformedG,
    deformedParams,
    deformedVolume,
    volumetricStrainPct,
    principalStrains: eigen.values,
    principalDirections: eigen.vectors,
    vonMisesStrain,
    octahedralShearStrain,
    dOriginal,
    dDeformed,
    relativeDStrainPct,
    twoThetaOrig,
    twoThetaDef,
    deltaTwoThetaDeg
  };
}

export function getSymmetryAppliedAlpha(
  system: CrystalSystem,
  a11: number,
  a22: number,
  a33: number,
  a13: number
): number[][] {
  if (system === 'Cubic') {
    return [
      [a11, 0, 0],
      [0, a11, 0],
      [0, 0, a11]
    ];
  }
  if (system === 'Tetragonal' || system === 'Hexagonal') {
    return [
      [a11, 0, 0],
      [0, a11, 0],
      [0, 0, a33]
    ];
  }
  if (system === 'Rhombohedral') {
    return [
      [a11, 0, 0],
      [0, a11, 0],
      [0, 0, a33]
    ];
  }
  if (system === 'Orthorhombic') {
    return [
      [a11, 0, 0],
      [0, a22, 0],
      [0, 0, a33]
    ];
  }
  if (system === 'Monoclinic') {
    return [
      [a11, 0, a13],
      [0, a22, 0],
      [a13, 0, a33]
    ];
  }
  return [
    [a11, 0, a13],
    [0, a22, 0],
    [a13, 0, a33]
  ];
}
