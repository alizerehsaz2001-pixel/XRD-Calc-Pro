import { RIRMatrixPhase } from './RIRMatrixInspector';

export interface CovarianceResult {
  covarW: number[][];
  corrW: number[][];
  vectorW: number[];
  vectorV: number[];
  stdDevW: number[]; // in fractional units (0 to 1)
  stdDevV: number[]; // exact propagated volume-fraction std dev (0 to 1)
  conditionNumber: number;
  maxSensitivity: number;
  jacobianI: number[][];
  jacobianK: number[][];
}

export interface RadiationAnode {
  id: 'Cu' | 'Co' | 'Mo' | 'Cr';
  label: string;
  wavelengthA: number;
  energyKeV: number;
  fluorescenceNote: string;
}

export const RADIATION_ANODES: RadiationAnode[] = [
  { id: 'Cu', label: 'Cu Kα₁', wavelengthA: 1.5406, energyKeV: 8.048, fluorescenceNote: 'Excites Fe, Co, Mn K-edge fluorescence' },
  { id: 'Co', label: 'Co Kα₁', wavelengthA: 1.7890, energyKeV: 6.930, fluorescenceNote: 'Eliminates Fe fluorescence; excites Mn/Cr' },
  { id: 'Mo', label: 'Mo Kα₁', wavelengthA: 0.7107, energyKeV: 17.479, fluorescenceNote: 'Deep penetration; compresses 2θ range' },
  { id: 'Cr', label: 'Cr Kα₁', wavelengthA: 2.2897, energyKeV: 5.415, fluorescenceNote: 'High angular dispersion; shallow penetration' }
];

export interface HubbardSnyderResult {
  equivI100: number;
  textureCvPct: number;
  peakCount: number;
  perPeakI100: { hkl: string; impliedI100: number; deviationPct: number }[];
}

export interface RIRDiagnosticItem {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
}

export interface MonteCarloHistogramBin {
  binStart: number; // in wt%
  binEnd: number; // in wt%
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
  pbr: number; // Peak to Background ratio
  penetrationDepthUm: number; // 99% X-ray absorption depth
}

export interface BrindleyPhaseState {
  phaseId: string;
  muLinear: number; // cm^-1
  sigmaContrast: number; // mu_i - muBar (cm^-1)
  tau: number; // Brindley transmission factor
  correctedI100: number;
  correctedReducedI: number;
  uncorrectedWtPct: number;
  correctedWtPct: number;
  critDiameterUm: number;
}

export interface BrindleySolution {
  muBar: number;
  iterations: number;
  converged: boolean;
  maxDeltaWtPct: number;
  phaseStates: BrindleyPhaseState[];
}

/**
 * Spherical-grain Brindley microabsorption transmission factor:
 * tau_i(x) = (3 / (2 x^3)) * [x^2 - 2 + 2*(1 + x)*exp(-x)], x = (mu_i - muBar) * D
 */
export function computeBrindleyTau(sigmaContrast: number, diameterCm: number): number {
  const x = sigmaContrast * diameterCm;
  if (Math.abs(x) < 1e-4) {
    return 1.0 - (9.0 / 16.0) * x + (1.0 / 6.0) * (x * x);
  }
  if (x > 50) return 0.01;
  if (x < -20) return 5.0;

  const tau = (3.0 / (2.0 * Math.pow(x, 3))) * (x * x - 2.0 + 2.0 * (1.0 + x) * Math.exp(-x));
  return Math.max(0.01, Math.min(10.0, tau));
}

/**
 * Self-consistent iterative Brindley solver:
 * Converges sample average linear absorption coefficient muBar = sum(w_i * mu_i)
 * and transmission factors tau_i simultaneously via fixed-point iteration.
 */
export function solveSelfConsistentBrindley(
  phases: RIRMatrixPhase[],
  particleDiameterUm: number,
  maxIter: number = 14
): BrindleySolution {
  if (!phases || phases.length === 0) {
    return { muBar: 0, iterations: 0, converged: true, maxDeltaWtPct: 0, phaseStates: [] };
  }

  const D_cm = Math.max(0.05, particleDiameterUm || 5.0) * 1e-4;

  const props = phases.map(p => {
    const rho = p.density && p.density > 0 ? p.density : 3.0;
    const mac = p.mac && p.mac > 0 ? p.mac : 50.0;
    const relScale = (p.relIntensity && p.relIntensity > 0 ? p.relIntensity : 100) / 100;
    const normI100 = Math.max(0, p.intensity || 0) / relScale;
    const rir = p.rir > 0 ? p.rir : 1.0;
    return {
      id: p.id,
      rho,
      mac,
      muLinear: rho * mac,
      normI100,
      rir,
      uncorrectedReducedI: normI100 / rir
    };
  });

  const sumUncorrReduced = props.reduce((s, p) => s + p.uncorrectedReducedI, 0);
  const uncorrWt = props.map(p => (sumUncorrReduced > 0 ? (p.uncorrectedReducedI / sumUncorrReduced) * 100 : 100 / props.length));

  const computeVolumeWeightedMuBar = (wtFractions: number[]): number => {
    let sumVol = 0;
    let sumVolMu = 0;
    for (let i = 0; i < props.length; i++) {
      const vRaw = wtFractions[i] / props[i].rho;
      sumVol += vRaw;
      sumVolMu += vRaw * props[i].muLinear;
    }
    return sumVol > 0 ? sumVolMu / sumVol : props.reduce((s, p) => s + p.muLinear, 0) / Math.max(1, props.length);
  };

  let weights = uncorrWt.map(w => w / 100);
  // Exact Brindley (1945) volume-fraction weighted matrix linear absorption coefficient: muBar = sum(v_i * mu_i)
  let muBar = computeVolumeWeightedMuBar(weights);
  let taus = props.map(() => 1.0);
  let converged = false;
  let iterations = 0;

  for (let iter = 1; iter <= maxIter; iter++) {
    iterations = iter;
    const nextTaus = props.map(p => computeBrindleyTau(p.muLinear - muBar, D_cm));
    const corrReduced = props.map((p, i) => (p.normI100 / nextTaus[i]) / p.rir);
    const sumCorr = corrReduced.reduce((s, val) => s + val, 0);
    const nextWeights = sumCorr > 0 ? corrReduced.map(r => r / sumCorr) : weights;
    const nextMuBar = computeVolumeWeightedMuBar(nextWeights);

    const maxStepDiff = nextWeights.reduce((m, w, i) => Math.max(m, Math.abs(w - weights[i])), 0);
    weights = nextWeights;
    muBar = nextMuBar;
    taus = nextTaus;

    if (maxStepDiff < 1e-6) {
      converged = true;
      break;
    }
  }

  let maxDeltaWtPct = 0;
  const phaseStates: BrindleyPhaseState[] = props.map((p, i) => {
    const sigmaContrast = p.muLinear - muBar;
    const tau = taus[i];
    const correctedI100 = p.normI100 / tau;
    const correctedReducedI = correctedI100 / p.rir;
    const correctedWtPct = weights[i] * 100;
    const uncorrectedWtPct = uncorrWt[i];
    const critDiameterUm = Math.abs(sigmaContrast) > 0.1 ? (0.1 / Math.abs(sigmaContrast)) * 1e4 : 999;

    const delta = Math.abs(correctedWtPct - uncorrectedWtPct);
    if (delta > maxDeltaWtPct) maxDeltaWtPct = delta;

    return {
      phaseId: p.id,
      muLinear: p.muLinear,
      sigmaContrast,
      tau,
      correctedI100,
      correctedReducedI,
      uncorrectedWtPct,
      correctedWtPct,
      critDiameterUm
    };
  });

  return {
    muBar,
    iterations,
    converged,
    maxDeltaWtPct,
    phaseStates
  };
}

/**
 * Calculates exact analytical covariance propagation for Chung RIR adiabatic normalization:
 * w_i = (I_i / K_i) / sum_k (I_k / K_k)
 *
 * J_{I, ij} = dw_i / dI_j = (delta_{ij} - w_i) / (S * K_j)
 * J_{K, ij} = dw_i / dK_j = -(w_i / K_j) * (delta_{ij} - w_j)
 * Sigma_w = J_I Sigma_I J_I^T + J_K Sigma_K J_K^T
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
      stdDevV: [],
      conditionNumber: 1,
      maxSensitivity: 0,
      jacobianI: [],
      jacobianK: []
    };
  }

  const vectorI = phases.map(p => {
    const relScale = (p.relIntensity && p.relIntensity > 0 ? p.relIntensity : 100) / 100;
    return Math.max(0, p.intensity || 0) / relScale;
  });
  const vectorK = phases.map(p => (p.rir > 0 ? p.rir : 1.0));
  const vectorDensities = phases.map(p => (p.density && p.density > 0 ? p.density : 3.0));

  const vectorReducedI = vectorI.map((I_i, idx) => I_i / vectorK[idx]);
  const totalReducedIntensity = vectorReducedI.reduce((sum, val) => sum + val, 0);

  const vectorW = totalReducedIntensity > 0
    ? vectorReducedI.map(rI => rI / totalReducedIntensity)
    : phases.map(() => 1 / n);

  const volumeFactors = vectorW.map((w_i, idx) => w_i / vectorDensities[idx]);
  const totalVolFactor = volumeFactors.reduce((sum, val) => sum + val, 0);
  const vectorV = totalVolFactor > 0
    ? volumeFactors.map(vf => vf / totalVolFactor)
    : phases.map(() => 1 / n);

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

  const jacobianK: number[][] = [];
  for (let i = 0; i < n; i++) {
    jacobianK[i] = [];
    for (let j = 0; j < n; j++) {
      const delta = i === j ? 1 : 0;
      jacobianK[i][j] = -(vectorW[i] / vectorK[j]) * (delta - vectorW[j]);
    }
  }

  const relErrI = (intensityUncertaintyPct || 0) / 100;
  const relErrK = (rirUncertaintyPct || 0) / 100;

  const covarW: number[][] = [];
  for (let i = 0; i < n; i++) {
    covarW[i] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        const varI_k = Math.pow(vectorI[k] * relErrI, 2);
        const varK_k = Math.pow(vectorK[k] * relErrK, 2);
        sum += jacobianI[i][k] * jacobianI[j][k] * varI_k;
        sum += jacobianK[i][k] * jacobianK[j][k] * varK_k;
      }
      covarW[i][j] = sum;
    }
  }

  const corrW: number[][] = [];
  for (let i = 0; i < n; i++) {
    corrW[i] = [];
    for (let j = 0; j < n; j++) {
      const var_i = covarW[i][i];
      const var_j = covarW[j][j];
      if (var_i > 0 && var_j > 0) {
        corrW[i][j] = Math.max(-1, Math.min(1, covarW[i][j] / Math.sqrt(var_i * var_j)));
      } else {
        corrW[i][j] = i === j ? 1 : 0;
      }
    }
  }

  const stdDevW = covarW.map((row, idx) => Math.sqrt(Math.max(0, row[idx] || 0)));

  // Exact analytical volume-fraction covariance via density Jacobian:
  // v_i = (w_i / rho_i) / S_v  =>  dv_i / dw_j = (delta_ij - v_i) / (S_v * rho_j)
  const stdDevV: number[] = [];
  for (let i = 0; i < n; i++) {
    let varVi = 0;
    if (totalVolFactor > 0) {
      for (let a = 0; a < n; a++) {
        const jia = ((i === a ? 1 : 0) - vectorV[i]) / (totalVolFactor * vectorDensities[a]);
        for (let b = 0; b < n; b++) {
          const jib = ((i === b ? 1 : 0) - vectorV[i]) / (totalVolFactor * vectorDensities[b]);
          varVi += jia * covarW[a][b] * jib;
        }
      }
    }
    stdDevV.push(Math.sqrt(Math.max(0, varVi)));
  }

  // Condition proxy: dynamic range across normalized reduced intensities & sensitivity spread
  const validReduced = vectorReducedI.filter(v => v > 0);
  const maxReduced = validReduced.length > 0 ? Math.max(...validReduced) : 1;
  const minReduced = validReduced.length > 0 ? Math.min(...validReduced) : 1;
  const conditionNumber = minReduced > 0 ? maxReduced / minReduced : 1;

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
    stdDevV,
    conditionNumber,
    maxSensitivity,
    jacobianI,
    jacobianK
  };
}

/**
 * Exact analytical uncertainty propagation for Internal Standard Spiking Mode:
 * w_orig_i = (W_s / (1 - W_s)) * (I_i / K_i) / (I_s / K_s)
 */
export function computeSpikingUncertainty(
  intensityI: number,
  intensityS: number,
  rirI: number,
  rirS: number,
  wOrigPct: number,
  standardAddedWtPct: number,
  relErrIPct: number,
  relErrKPct: number,
  weighingErrAbsPct: number = 0.2
): number {
  if (wOrigPct <= 0 || intensityI <= 0 || intensityS <= 0 || rirI <= 0 || rirS <= 0) return 0;
  const ws = Math.min(0.95, Math.max(0.01, standardAddedWtPct / 100));
  const relI = relErrIPct / 100;
  const relK = relErrKPct / 100;
  const relWsTerm = (weighingErrAbsPct / 100) / (ws * (1 - ws));
  const relVar = 2 * (relI * relI) + 2 * (relK * relK) + relWsTerm * relWsTerm;
  return wOrigPct * Math.sqrt(relVar);
}

/**
 * Monte Carlo Stochastic Error Propagation Simulator
 */
export function runRIRMonteCarloSimulation(
  phases: RIRMatrixPhase[],
  intensityUncertaintyPct: number,
  rirUncertaintyPct: number,
  iterations: number = 5000
): MonteCarloResult {
  const t0 = performance.now();
  const n = phases.length;
  if (n === 0) {
    return { iterations: 0, phaseStats: [], computationTimeMs: 0 };
  }

  const relErrI = (intensityUncertaintyPct || 3.0) / 100;
  const relErrK = (rirUncertaintyPct || 5.0) / 100;

  function randomGaussian(mean: number, stdDev: number): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.max(0.0001, mean + z * stdDev);
  }

  const sampleMatrix: number[][] = Array.from({ length: n }, () => new Array(iterations));
  const baseNormI = phases.map(p => {
    const relScale = (p.relIntensity && p.relIntensity > 0 ? p.relIntensity : 100) / 100;
    return Math.max(1, (p.intensity || 100) / relScale);
  });
  const baseK = phases.map(p => (p.rir > 0 ? p.rir : 1.0));

  for (let iter = 0; iter < iterations; iter++) {
    let totalReduced = 0;
    const currentReduced: number[] = new Array(n);

    for (let p = 0; p < n; p++) {
      const sampledI = randomGaussian(baseNormI[p], baseNormI[p] * relErrI);
      const sampledK = randomGaussian(baseK[p], baseK[p] * relErrK);
      const rI = sampledI / sampledK;
      currentReduced[p] = rI;
      totalReduced += rI;
    }

    for (let p = 0; p < n; p++) {
      sampleMatrix[p][iter] = totalReduced > 0 ? (currentReduced[p] / totalReduced) * 100 : 0;
    }
  }

  const numBins = 16;
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

    const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / Math.max(1, iterations - 1);
    const stdDev = Math.sqrt(variance);
    const skewSum = arr.reduce((acc, v) => acc + Math.pow((v - mean) / (stdDev || 1), 3), 0);
    const skewness = skewSum / iterations;

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
    computationTimeMs: Math.max(1, Math.round(t1 - t0))
  };
}

/**
 * Computes Detection Limits (LOD / LOQ) & Bulk-Mixture X-ray Penetration Depths (tau_99).
 * Uses phase-calibrated sensitivity S_i = I_i / w_i (cps per wt%) so trace phases don't
 * get inflated LOD estimates, and uses mixture linear attenuation for penetration depth.
 */
export function computeDetectionLimits(
  phases: RIRMatrixPhase[],
  backgroundLevel: number = 80,
  sampleMac: number = 65.0,
  phaseWeightPcts?: number[],
  sampleDensity: number = 3.0
): DetectionLimitResult[] {
  const bgSigma = Math.sqrt(Math.max(10, backgroundLevel));
  const reducedList = phases.map(p => {
    const relScale = (p.relIntensity && p.relIntensity > 0 ? p.relIntensity : 100) / 100;
    const normI = Math.max(0, p.intensity || 0) / relScale;
    return normI / (p.rir > 0 ? p.rir : 1.0);
  });
  const totalReduced = reducedList.reduce((s, v) => s + v, 0);

  return phases.map((p, idx) => {
    const intRaw = Math.max(0, p.intensity || 0);
    const pbr = Number((intRaw / Math.max(1, backgroundLevel)).toFixed(1));
    const estWtPct = phaseWeightPcts && phaseWeightPcts[idx] !== undefined
      ? Math.max(0.2, phaseWeightPcts[idx])
      : totalReduced > 0
      ? Math.max(0.2, (reducedList[idx] / totalReduced) * 100)
      : 100 / Math.max(1, phases.length);

    // Sensitivity in cps per wt% at current matrix absorption
    const sensitivityCpsPerWtPct = Math.max(1, intRaw) / estWtPct;
    const lod = Number(Math.min(25, Math.max(0.02, (3 * bgSigma) / sensitivityCpsPerWtPct)).toFixed(2));
    const loq = Number((lod * 3.33).toFixed(2));

    // Bulk mixture 99% penetration depth tau_99 = -ln(0.01) * sin(theta) / (2 * mu_sample_linear)
    const effectiveSampleRho = sampleDensity > 0 ? sampleDensity : (p.density && p.density > 0 ? p.density : 3.0);
    const muSampleLin = (sampleMac > 0 ? sampleMac : (p.mac || 65.0)) * effectiveSampleRho;
    const thetaRad = ((p.twoTheta || 30) / 2) * (Math.PI / 180);
    const penDepthCm = muSampleLin > 0 ? (-Math.log(0.01) * Math.sin(thetaRad)) / (2 * muSampleLin) : 0.01;
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

/**
 * Hubbard & Snyder (1988) multi-reflection RIR estimator:
 * Uses intensity-summed scaling I_100 = sum(I_j) / sum(I_rel_j / 100) so weak reflections
 * do not amplify Poisson counting noise, and computes a preferred-orientation / texture CV%.
 */
export function computeHubbardSnyderI100(
  peaks: { hkl: string; intensity: number; relIntensity: number }[]
): HubbardSnyderResult {
  const active = peaks.filter(pk => (pk.intensity || 0) > 0 && (pk.relIntensity || 0) > 0);
  if (active.length === 0) {
    return { equivI100: 0, textureCvPct: 0, peakCount: 0, perPeakI100: [] };
  }

  let sumInt = 0;
  let sumRelFrac = 0;
  const impliedList = active.map(pk => {
    const relFrac = Math.min(1.0, Math.max(0.01, pk.relIntensity / 100));
    sumInt += pk.intensity;
    sumRelFrac += relFrac;
    return {
      hkl: pk.hkl,
      relFrac,
      impliedI100: pk.intensity / relFrac
    };
  });

  const equivI100 = sumRelFrac > 0 ? sumInt / sumRelFrac : 0;

  let weightedVar = 0;
  if (active.length > 1 && equivI100 > 0) {
    impliedList.forEach(item => {
      const diff = item.impliedI100 - equivI100;
      weightedVar += (item.relFrac / sumRelFrac) * diff * diff;
    });
  }
  const textureCvPct = equivI100 > 0 ? (Math.sqrt(weightedVar) / equivI100) * 100 : 0;

  return {
    equivI100: Math.round(equivI100),
    textureCvPct: Number(textureCvPct.toFixed(1)),
    peakCount: active.length,
    perPeakI100: impliedList.map(item => ({
      hkl: item.hkl,
      impliedI100: Math.round(item.impliedI100),
      deviationPct: equivI100 > 0 ? Number((((item.impliedI100 - equivI100) / equivI100) * 100).toFixed(1)) : 0
    }))
  };
}

/**
 * Computes analytical standard uncertainty of the amorphous fraction in Internal Standard Spiking mode,
 * accounting for shared standard peak/RIR/weighing correlation across all analyte phases.
 */
export function computeSpikingAmorphousUncertainty(
  analyteWeightsPct: number[],
  standardAddedWtPct: number,
  relErrIPct: number,
  relErrKPct: number,
  weighingErrAbsPct: number = 0.2
): number {
  const sumW = analyteWeightsPct.reduce((s, w) => s + Math.max(0, w), 0);
  if (sumW <= 0) return 0;

  const ws = Math.min(0.95, Math.max(0.01, standardAddedWtPct / 100));
  const relI = (relErrIPct || 0) / 100;
  const relK = (relErrKPct || 0) / 100;
  const relWs = (weighingErrAbsPct / 100) / (ws * (1 - ws));

  // Shared standard terms (I_s, K_s, W_s) scale sumW coherently; individual analyte terms add in quadrature
  const sharedVar = sumW * sumW * (relI * relI + relK * relK + relWs * relWs);
  const indepVar = analyteWeightsPct.reduce((acc, w) => acc + w * w * (relI * relI + relK * relK), 0);
  return Math.sqrt(Math.max(0, sharedVar + indepVar));
}

/**
 * Bragg d-spacing (Angstroms) and reciprocal vector s = 1/d (A^-1) from 2Theta and wavelength.
 */
export function computeBraggReciprocal(twoThetaDeg: number, wavelengthA: number): { dSpacingA: number; invD: number } {
  const thetaRad = (Math.max(0.5, Math.min(179, twoThetaDeg)) / 2) * (Math.PI / 180);
  const sinT = Math.sin(thetaRad);
  if (sinT <= 1e-6 || wavelengthA <= 0) return { dSpacingA: 0, invD: 0 };
  const dSpacingA = wavelengthA / (2 * sinT);
  return {
    dSpacingA,
    invD: dSpacingA > 0 ? 1 / dSpacingA : 0
  };
}

/**
 * Automated scientific diagnostics for RIR quantitative phase analysis:
 * checks Fe/Co fluorescence, Brindley microabsorption contrast, peak overlap proximity,
 * preferred orientation texture CV%, below-LOD trace phases, and spiking mass-balance excess.
 */
export function computeRIRDiagnostics(params: {
  phases: (RIRMatrixPhase & {
    totalSampleFraction: number;
    lodWtPct: number;
    textureCvPct?: number;
    isInternalStandard?: boolean;
  })[];
  anodeId: 'Cu' | 'Co' | 'Mo' | 'Cr';
  useBrindley: boolean;
  particleDiameterUm: number;
  isInternalStandardActive: boolean;
  rawOriginalSampleCrystSum: number;
}): RIRDiagnosticItem[] {
  const diagnostics: RIRDiagnosticItem[] = [];
  const { phases, anodeId, useBrindley, particleDiameterUm, isInternalStandardActive, rawOriginalSampleCrystSum } = params;

  // 1. Spiking mass-balance closure excess
  if (isInternalStandardActive && rawOriginalSampleCrystSum > 100.5) {
    diagnostics.push({
      id: 'spiking-excess',
      severity: 'critical',
      category: 'Mass Balance',
      message: `Unclipped crystalline sum is ${rawOriginalSampleCrystSum.toFixed(1)} wt% (>100%). Check standard weighing, preferred orientation, or enable Brindley microabsorption.`
    });
  }

  // 2. X-ray fluorescence check (Fe/Co/Mn under Cu K-alpha)
  if (anodeId === 'Cu') {
    const fePhases = phases.filter(p => /hematite|magnetite|fe2o3|fe3o4|ferrite|goethite|pyrite|siderite|iron|fe\b|c4af/i.test(p.name));
    if (fePhases.length > 0) {
      diagnostics.push({
        id: 'cu-fluorescence',
        severity: 'warning',
        category: 'Fluorescence',
        message: `Cu Kα excites Fe K-edge fluorescence in ${fePhases.map(p => p.name.split(' (')[0]).join(', ')}, elevating background & MAC. Consider Co Kα₁ (1.789 Å) or a secondary monochromator.`
      });
    }
  }

  // 3. Brindley microabsorption severity check (|mu_i - muBar| * D > 0.1)
  if (phases.length >= 2) {
    const sol = solveSelfConsistentBrindley(phases, particleDiameterUm);
    const D_cm = Math.max(0.05, particleDiameterUm) * 1e-4;
    const maxContrastProduct = sol.phaseStates.reduce((m, st) => Math.max(m, Math.abs(st.sigmaContrast) * D_cm), 0);
    if (maxContrastProduct > 0.12 && !useBrindley) {
      diagnostics.push({
        id: 'brindley-needed',
        severity: 'warning',
        category: 'Microabsorption',
        message: `High linear absorption contrast (max |Δμ|·D = ${maxContrastProduct.toFixed(2)} > 0.10 at D = ${particleDiameterUm} µm). Enable Brindley correction or micronize powder below ${Math.max(0.5, (0.1 / (maxContrastProduct / D_cm)) * 1e4).toFixed(1)} µm.`
      });
    }
  }

  // 4. Peak overlap proximity check (delta 2Theta < 0.35 deg)
  for (let i = 0; i < phases.length; i++) {
    for (let j = i + 1; j < phases.length; j++) {
      const diff = Math.abs((phases[i].twoTheta || 0) - (phases[j].twoTheta || 0));
      if (diff > 0 && diff < 0.35 && phases[i].intensity > 0 && phases[j].intensity > 0) {
        diagnostics.push({
          id: `overlap-${phases[i].id}-${phases[j].id}`,
          severity: 'warning',
          category: 'Peak Overlap',
          message: `${phases[i].name.split(' (')[0]} (${phases[i].twoTheta.toFixed(2)}°) and ${phases[j].name.split(' (')[0]} (${phases[j].twoTheta.toFixed(2)}°) are separated by Δ2θ = ${diff.toFixed(2)}°. Use Pawley Bridge or select non-overlapping secondary reflections.`
        });
      }
    }
  }

  // 5. Multi-peak preferred orientation dispersion check
  phases.forEach(p => {
    if ((p.textureCvPct || 0) > 15) {
      diagnostics.push({
        id: `texture-${p.id}`,
        severity: 'warning',
        category: 'Texture Bias',
        message: `${p.name.split(' (')[0]} multi-reflection I₁₀₀ spread is ${p.textureCvPct?.toFixed(1)}% CV (>15%), indicating preferred orientation or hidden peak overlap.`
      });
    }
  });

  // 6. Trace phase below LOD
  const tracePhases = phases.filter(
    p => !p.isInternalStandard && p.intensity > 0 && p.totalSampleFraction < p.lodWtPct
  );
  if (tracePhases.length > 0) {
    diagnostics.push({
      id: 'below-lod',
      severity: 'info',
      category: 'Detection Limit',
      message: `${tracePhases.map(p => p.name.split(' (')[0]).join(', ')} falls below the 3σ LOD threshold; increase counting time for quantitative reliability.`
    });
  }

  return diagnostics;
}

