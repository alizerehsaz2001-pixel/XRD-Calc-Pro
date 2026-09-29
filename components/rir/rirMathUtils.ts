import { RIRMatrixPhase } from './RIRMatrixInspector';

export interface CovarianceResult {
  covarW: number[][];
  corrW: number[][];
  vectorW: number[];
  vectorV: number[];
  stdDevW: number[]; // in fractional units (0 to 1)
  conditionNumber: number;
  maxSensitivity: number;
}

export interface MonteCarloHistogramBin {
  binStart: number; // in wt%
  binEnd: number;   // in wt%
  count: number;
}

export interface MonteCarloPhaseResult {
  phaseId: string;
  name: string;
  color: string;
  meanWtPct: number;
  medianWtPct: number;
  stdDevWtPct: number;
  p05WtPct: number; // 5th percentile (90% CI lower)
  p95WtPct: number; // 95th percentile (90% CI upper)
  minWtPct: number;
  maxWtPct: number;
  skewness: number;
  histogram: MonteCarloHistogramBin[];
}

export interface MonteCarloResult {
  iterations: number;
  phaseStats: MonteCarloPhaseResult[];
  computationTimeMs: number;
}

export interface DetectionLimitResult {
  phaseId: string;
  name: string;
  lodWtPct: number; // Limit of Detection (3 sigma)
  loqWtPct: number; // Limit of Quantification (10 sigma)
  pbr: number;      // Peak to Background ratio
  penetrationDepthUm: number; // 99% X-ray absorption depth
}

/**
 * Calculates exact analytical covariance propagation for Chung RIR adiabatic normalization:
 * w_i = (I_i / K_i) / \sum_k (I_k / K_k)
 * 
 * J_{I, ij} = \partial w_i / \partial I_j = (delta_{ij} - w_i) / (S * K_j)
 * J_{K, ij} = \partial w_i / \partial K_j = -(w_i / K_j) * (delta_{ij} - w_j)
 * \Sigma_w = J_I \Sigma_I J_I^T + J_K \Sigma_K J_K^T
 */
export function computeRIRCovariance(
  phases: RIRMatrixPhase[],
  intensityUncertaintyPct: number,
  rirUncertaintyPct: number
): CovarianceResult {
  const n = phases.length;
  if (n === 0) {
    return {
      covarW: [],
      corrW: [],
      vectorW: [],
      vectorV: [],
      stdDevW: [],
      conditionNumber: 1,
      maxSensitivity: 0
    };
  }

  const vectorI = phases.map(p => Math.max(0, p.intensity || 0));
  const vectorK = phases.map(p => (p.rir > 0 ? p.rir : 1.0));
  const vectorDensities = phases.map(p => (p.density && p.density > 0 ? p.density : 3.0));

  // Reduced intensities: \tilde{I}_i = I_i / K_i
  const vectorReducedI = vectorI.map((I_i, idx) => I_i / vectorK[idx]);
  const totalReducedIntensity = vectorReducedI.reduce((sum, val) => sum + val, 0);

  // Crystalline weight fractions w_i = \tilde{I}_i / \sum \tilde{I}_j
  const vectorW = totalReducedIntensity > 0
    ? vectorReducedI.map(rI => rI / totalReducedIntensity)
    : phases.map(() => 1 / n);

  // Volume fractions v_i = (w_i / \rho_i) / \sum (w_j / \rho_j)
  const volumeFactors = vectorW.map((w_i, idx) => w_i / vectorDensities[idx]);
  const totalVolFactor = volumeFactors.reduce((sum, val) => sum + val, 0);
  const vectorV = totalVolFactor > 0
    ? volumeFactors.map(vf => vf / totalVolFactor)
    : phases.map(() => 1 / n);

  // Jacobian Matrix with respect to Intensities: J_{I, ij} = \partial w_i / \partial I_j
  const jacobianI: number[][] = [];
  for (let i = 0; i < n; i++) {
    jacobianI[i] = [];
    for (let j = 0; j < n; j++) {
      if (totalReducedIntensity <= 0) {
        jacobianI[i][j] = 0;
      } else {
        const delta = i === j ? 1 : 0;
        jacobianI[i][j] = (delta - vectorW[i]) / (totalReducedIntensity * vectorK[j]);
      }
    }
  }

  // Jacobian Matrix with respect to RIR Constants: J_{K, ij} = \partial w_i / \partial K_j
  const jacobianK: number[][] = [];
  for (let i = 0; i < n; i++) {
    jacobianK[i] = [];
    for (let j = 0; j < n; j++) {
      const delta = i === j ? 1 : 0;
      jacobianK[i][j] = -(vectorW[i] / vectorK[j]) * (delta - vectorW[j]);
    }
  }

  // Covariance matrix of Intensity inputs \Sigma_I (assumed independent diagonal)
  const relErrI = (intensityUncertaintyPct || 0) / 100;
  const covarI: number[][] = [];
  for (let i = 0; i < n; i++) {
    covarI[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        const sigma_i = vectorI[i] * relErrI;
        covarI[i][j] = sigma_i * sigma_i;
      } else {
        covarI[i][j] = 0;
      }
    }
  }

  // Covariance matrix of RIR inputs \Sigma_K (assumed independent diagonal)
  const relErrK = (rirUncertaintyPct || 0) / 100;
  const covarK: number[][] = [];
  for (let i = 0; i < n; i++) {
    covarK[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        const sigma_k = vectorK[i] * relErrK;
        covarK[i][j] = sigma_k * sigma_k;
      } else {
        covarK[i][j] = 0;
      }
    }
  }

  // Full Covariance Matrix of Output Weight Fractions:
  // \Sigma_w = J_I \Sigma_I J_I^T + J_K \Sigma_K J_K^T
  const covarW: number[][] = [];
  for (let i = 0; i < n; i++) {
    covarW[i] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        const varI_k = covarI[k][k];
        const varK_k = covarK[k][k];
        sum += jacobianI[i][k] * jacobianI[j][k] * varI_k;
        sum += jacobianK[i][k] * jacobianK[j][k] * varK_k;
      }
      covarW[i][j] = sum;
    }
  }

  // Correlation Matrix: R_{ij} = \Sigma_{w, ij} / \sqrt{\Sigma_{w, ii} \Sigma_{w, jj}}
  const corrW: number[][] = [];
  for (let i = 0; i < n; i++) {
    corrW[i] = [];
    for (let j = 0; j < n; j++) {
      const var_i = covarW[i][i];
      const var_j = covarW[j][j];
      if (var_i > 0 && var_j > 0) {
        corrW[i][j] = covarW[i][j] / Math.sqrt(var_i * var_j);
      } else {
        corrW[i][j] = i === j ? 1 : 0;
      }
    }
  }

  // Calculate standard deviations (stdDevW) in fractional units (0..1)
  const stdDevW = covarW.map((row, idx) => {
    const diag = row[idx] || 0;
    return Math.sqrt(Math.max(0, diag));
  });

  // Condition number estimation (ratio of max to min reduced intensity)
  const validReduced = vectorReducedI.filter(v => v > 0);
  const maxReduced = validReduced.length > 0 ? Math.max(...validReduced) : 1;
  const minReduced = validReduced.length > 0 ? Math.min(...validReduced) : 1;
  const conditionNumber = minReduced > 0 ? maxReduced / minReduced : 1;

  // Max sensitivity
  let maxSensitivity = 0;
  jacobianI.forEach(row => {
    row.forEach(val => {
      if (Math.abs(val) > maxSensitivity) maxSensitivity = Math.abs(val);
    });
  });

  return {
    covarW,
    corrW,
    vectorW,
    vectorV,
    stdDevW,
    conditionNumber,
    maxSensitivity
  };
}

/**
 * Monte Carlo Stochastic Error Propagation Simulator
 * Runs N iterations (default 5,000) sampling intensities & RIRs from normal distributions
 */
export function runRIRMonteCarloSimulation(
  phases: RIRMatrixPhase[],
  intensityUncertaintyPct: number,
  rirUncertaintyPct: number,
  iterations: number = 4000
): MonteCarloResult {
  const t0 = performance.now();
  const n = phases.length;
  if (n === 0) {
    return { iterations: 0, phaseStats: [], computationTimeMs: 0 };
  }

  const relErrI = (intensityUncertaintyPct || 3.0) / 100;
  const relErrK = (rirUncertaintyPct || 5.0) / 100;

  // Box-Muller Gaussian random generator
  function randomGaussian(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.max(0.0001, mean + z * stdDev);
  }

  const sampleMatrix: number[][] = []; // [iteration][phaseIdx] in wt%
  for (let p = 0; p < n; p++) {
    sampleMatrix[p] = new Array(iterations);
  }

  for (let iter = 0; iter < iterations; iter++) {
    let totalReduced = 0;
    const currentReduced: number[] = new Array(n);

    for (let p = 0; p < n; p++) {
      const meanI = Math.max(1, phases[p].intensity || 100);
      const meanK = phases[p].rir > 0 ? phases[p].rir : 1.0;

      const sampledI = randomGaussian(meanI, meanI * relErrI);
      const sampledK = randomGaussian(meanK, meanK * relErrK);
      const rI = sampledI / sampledK;
      currentReduced[p] = rI;
      totalReduced += rI;
    }

    for (let p = 0; p < n; p++) {
      sampleMatrix[p][iter] = totalReduced > 0 ? (currentReduced[p] / totalReduced) * 100 : 0;
    }
  }

  // Calculate statistics for each phase
  const numBins = 15;
  const phaseStats: MonteCarloPhaseResult[] = phases.map((phase, pIdx) => {
    const arr = sampleMatrix[pIdx];
    arr.sort((a, b) => a - b);

    const sum = arr.reduce((acc, v) => acc + v, 0);
    const mean = sum / iterations;
    const median = arr[Math.floor(iterations * 0.5)];
    const p05 = arr[Math.floor(iterations * 0.05)];
    const p95 = arr[Math.floor(iterations * 0.95)];
    const minVal = arr[0];
    const maxVal = arr[iterations - 1];

    const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (iterations - 1);
    const stdDev = Math.sqrt(variance);

    // Skewness
    const skewSum = arr.reduce((acc, v) => acc + Math.pow((v - mean) / (stdDev || 1), 3), 0);
    const skewness = skewSum / iterations;

    // Build 15-bin histogram
    const binWidth = Math.max(0.01, (maxVal - minVal) / numBins);
    const histogram: MonteCarloHistogramBin[] = [];

    for (let b = 0; b < numBins; b++) {
      const bStart = minVal + b * binWidth;
      const bEnd = minVal + (b + 1) * binWidth;
      histogram.push({
        binStart: Number(bStart.toFixed(2)),
        binEnd: Number(bEnd.toFixed(2)),
        count: 0
      });
    }

    arr.forEach(val => {
      let bIdx = Math.floor((val - minVal) / binWidth);
      if (bIdx >= numBins) bIdx = numBins - 1;
      if (bIdx < 0) bIdx = 0;
      histogram[bIdx].count++;
    });

    return {
      phaseId: phase.id,
      name: phase.name,
      color: phase.color || '#6366f1',
      meanWtPct: Number(mean.toFixed(2)),
      medianWtPct: Number(median.toFixed(2)),
      stdDevWtPct: Number(stdDev.toFixed(2)),
      p05WtPct: Number(p05.toFixed(2)),
      p95WtPct: Number(p95.toFixed(2)),
      minWtPct: Number(minVal.toFixed(2)),
      maxWtPct: Number(maxVal.toFixed(2)),
      skewness: Number(skewness.toFixed(3)),
      histogram
    };
  });

  const t1 = performance.now();
  return {
    iterations,
    phaseStats,
    computationTimeMs: Math.round(t1 - t0)
  };
}

/**
 * Computes Detection Limits (LOD / LOQ) & X-ray Penetration Depths
 */
export function computeDetectionLimits(
  phases: RIRMatrixPhase[],
  backgroundLevel: number = 80,
  sampleMac: number = 65.0
): DetectionLimitResult[] {
  const bgSigma = Math.sqrt(Math.max(10, backgroundLevel));

  return phases.map(p => {
    const int = Math.max(10, p.intensity || 100);
    const pbr = Number((int / Math.max(1, backgroundLevel)).toFixed(1));
    const rir = p.rir > 0 ? p.rir : 1.0;

    // Limit of detection (3 * sigma_bg / Sensitivity)
    const sensitivity = int / 100; // cps per wt%
    const lod = Number((Math.min(25, (3 * bgSigma) / (sensitivity * (rir / 1.0)))).toFixed(2));
    const loq = Number((lod * 3.33).toFixed(2));

    // Penetration depth tau_99 = -ln(0.01) * sin(theta) / (2 * mu_linear)
    const rho = p.density && p.density > 0 ? p.density : 3.0;
    const muLin = (p.mac && p.mac > 0 ? p.mac : sampleMac) * rho;
    const thetaRad = ((p.twoTheta || 30) / 2) * (Math.PI / 180);
    const penDepthCm = muLin > 0 ? (-Math.log(0.01) * Math.sin(thetaRad)) / (2 * muLin) : 0.01;
    const penetrationDepthUm = Number((penDepthCm * 10000).toFixed(1));

    return {
      phaseId: p.id,
      name: p.name,
      lodWtPct: lod,
      loqWtPct: loq,
      pbr,
      penetrationDepthUm
    };
  });
}
