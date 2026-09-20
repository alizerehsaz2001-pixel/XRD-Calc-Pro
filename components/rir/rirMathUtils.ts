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
  const stdDevW = covarW.map(row => {
    const diag = row[covarW.indexOf(row)] || 0;
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
