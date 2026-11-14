/**
 * XRR Advanced Multi-Algorithm Non-Linear Optimization Engine
 *
 * Implements:
 * 1. Global Simulated Annealing with Metropolis-Hastings acceptance & adaptive cooling
 * 2. Coordinate / Simplex Pattern Search (Nelder-Mead reflection, expansion & contraction)
 * 3. Levenberg-Marquardt Damped Gauss-Newton Gradient Refinement on Log10(R)
 * 4. Hybrid Global-to-Local Refinement (Simulated Annealing -> Levenberg-Marquardt polish)
 * 5. Sub-Grid Linear Interpolation of Simulated R(theta) for Smooth Continuous Gradients
 * 6. Finite-Difference Jacobian Sensitivity & Fisher Covariance Parameter Uncertainties
 */

import {
  XRRLayer,
  XRRSimulationConfig,
  calculateReflectivityCurve,
  calculateFitQuality,
  FitQualityResult
} from './xrrPhysics';

export type OptimizationAlgorithm = 'annealing' | 'nelder-mead' | 'levenberg-marquardt' | 'hybrid';
export type LossFunctionType = 'log-rmse' | 'rwp' | 'compensated-rmse' | 'chi-square';

export interface FittingConstraint {
  layerId: string;
  param: 'thickness' | 'roughness' | 'density';
  min: number;
  max: number;
  locked: boolean;
}

export interface OptimizationOptions {
  algorithm: OptimizationAlgorithm;
  lossFunction: LossFunctionType;
  maxIterations: number;
  tolerance: number;
  learningRate?: number;
  initialTemp?: number;
  coolingRate?: number;
  onProgress?: (iter: number, cost: number, currentLayers: XRRLayer[]) => void;
}

export interface OptimizationResult {
  optimizedLayers: XRRLayer[];
  initialCost: number;
  finalCost: number;
  iterationsRun: number;
  convergenceHistory: { iteration: number; cost: number }[];
  quality: FitQualityResult;
  uncertainties: Record<string, { thicknessError: number; roughnessError: number; densityError: number }>;
}

/**
 * Helper: Linearly interpolates simulated reflectivity R_calc at an arbitrary experimental angle theta
 */
function interpolateRCalc(simCurve: { theta: number; rCalc: number }[], targetTheta: number): number | null {
  const n = simCurve.length;
  if (n === 0) return null;
  if (targetTheta < simCurve[0].theta - 0.05 || targetTheta > simCurve[n - 1].theta + 0.05) {
    return null;
  }
  if (targetTheta <= simCurve[0].theta) return simCurve[0].rCalc;
  if (targetTheta >= simCurve[n - 1].theta) return simCurve[n - 1].rCalc;

  // Binary search for bracketing interval
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (simCurve[mid].theta <= targetTheta) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const p0 = simCurve[lo];
  const p1 = simCurve[hi];
  const span = p1.theta - p0.theta;
  if (span <= 1e-12) return p0.rCalc;
  const t = (targetTheta - p0.theta) / span;

  // Log-linear interpolation preserves exponential reflectivity decay between grid points
  if (p0.rCalc > 0 && p1.rCalc > 0) {
    const log0 = Math.log10(p0.rCalc);
    const log1 = Math.log10(p1.rCalc);
    return Math.pow(10, log0 + t * (log1 - log0));
  }
  return p0.rCalc + t * (p1.rCalc - p0.rCalc);
}

/**
 * Evaluates cost function between calculated reflectivity and experimental data
 * using continuous log-linear sub-grid interpolation.
 */
export function evaluateLoss(
  layers: XRRLayer[],
  config: XRRSimulationConfig,
  expPoints: { theta: number; qz: number; intensity: number }[],
  lossType: LossFunctionType = 'log-rmse'
): number {
  if (expPoints.length === 0) return 9999;

  const simCurve = calculateReflectivityCurve(layers, config);
  if (simCurve.length === 0) return 9999;

  let sumCost = 0;
  let count = 0;
  let sumExpSq = 0;

  for (const exp of expPoints) {
    const rCalc = interpolateRCalc(simCurve, exp.theta);
    if (rCalc !== null && rCalc > 0 && exp.intensity > 0) {
      const rExp = exp.intensity;

      if (lossType === 'log-rmse') {
        const diffLog = Math.log10(rCalc) - Math.log10(rExp);
        sumCost += diffLog * diffLog;
      } else if (lossType === 'rwp') {
        const diff = Math.log10(rCalc) - Math.log10(rExp);
        const weight = 1 / Math.max(0.1, Math.abs(Math.log10(rExp)));
        sumCost += weight * diff * diff;
        sumExpSq += weight * Math.pow(Math.log10(rExp), 2);
      } else if (lossType === 'compensated-rmse') {
        const qz4 = Math.pow(Math.max(0.015, exp.qz), 4);
        const diff = (rCalc - rExp) * qz4 * 1e4;
        sumCost += diff * diff;
      } else if (lossType === 'chi-square') {
        const diffLog = Math.log10(rCalc) - Math.log10(rExp);
        const sigmaLog = 0.04; // ~9% relative photon counting / instrumental uncertainty
        sumCost += (diffLog * diffLog) / (sigmaLog * sigmaLog);
      }

      count++;
    }
  }

  if (count === 0) return 9999;

  if (lossType === 'rwp') {
    return Math.sqrt(sumCost / Math.max(1e-12, sumExpSq)) * 100;
  }

  return Math.sqrt(sumCost / count);
}

interface ActiveParamRef {
  layerIndex: number;
  field: 'thickness' | 'roughness' | 'density';
  min: number;
  max: number;
  stepSize: number;
}

function getActiveParameters(layers: XRRLayer[]): ActiveParamRef[] {
  const params: ActiveParamRef[] = [];
  layers.forEach((layer, idx) => {
    const isSubstrate = layer.thickness === 0;
    if (!isSubstrate && !layer.lockedThickness) {
      params.push({
        layerIndex: idx,
        field: 'thickness',
        min: layer.minThickness ?? 5,
        max: layer.maxThickness ?? 2000,
        stepSize: Math.max(0.25, layer.thickness * 0.008)
      });
    }
    if (!layer.lockedRoughness) {
      params.push({
        layerIndex: idx,
        field: 'roughness',
        min: layer.minRoughness ?? 0.2,
        max: layer.maxRoughness ?? 40,
        stepSize: Math.max(0.08, layer.roughness * 0.02)
      });
    }
    if (!layer.lockedDensity) {
      params.push({
        layerIndex: idx,
        field: 'density',
        min: layer.minDensity ?? 0.1,
        max: layer.maxDensity ?? 24,
        stepSize: Math.max(0.015, layer.density * 0.008)
      });
    }
  });
  return params;
}

function applyParamDelta(layers: XRRLayer[], param: ActiveParamRef, newVal: number): XRRLayer[] {
  const clamped = Math.min(param.max, Math.max(param.min, newVal));
  return layers.map((layer, idx) => {
    if (idx !== param.layerIndex) return { ...layer };
    if (param.field === 'thickness') {
      return { ...layer, thickness: Number(clamped.toFixed(3)) };
    }
    if (param.field === 'roughness') {
      return { ...layer, roughness: Number(clamped.toFixed(3)) };
    }
    const oldDens = layer.density || 1;
    const ratio = clamped / oldDens;
    return {
      ...layer,
      density: Number(clamped.toFixed(4)),
      delta: Math.max(0, Number((layer.delta * ratio).toFixed(4))),
      beta: Math.max(0, Number((layer.beta * ratio).toFixed(5)))
    };
  });
}

/**
 * Performs one Damped Gauss-Newton / Levenberg-Marquardt step across all unlocked parameters
 */
function performLevenbergMarquardtStep(
  currentLayers: XRRLayer[],
  currentCost: number,
  config: XRRSimulationConfig,
  expPoints: { theta: number; qz: number; intensity: number }[],
  lossFunction: LossFunctionType,
  dampingLambda: number
): { layers: XRRLayer[]; cost: number; newLambda: number; accepted: boolean } {
  const activeParams = getActiveParameters(currentLayers);
  if (activeParams.length === 0) {
    return { layers: currentLayers, cost: currentCost, newLambda: dampingLambda, accepted: false };
  }

  // Compute finite-difference gradient and diagonal curvature approximation
  const grad: number[] = [];
  const hessDiag: number[] = [];

  for (const p of activeParams) {
    const baseVal = currentLayers[p.layerIndex][p.field];
    const h = p.stepSize;
    const plusLayers = applyParamDelta(currentLayers, p, baseVal + h);
    const minusLayers = applyParamDelta(currentLayers, p, baseVal - h);

    const costPlus = evaluateLoss(plusLayers, config, expPoints, lossFunction);
    const costMinus = evaluateLoss(minusLayers, config, expPoints, lossFunction);

    const g = (costPlus - costMinus) / (2 * h);
    const secondDeriv = Math.max(1e-6, Math.abs(costPlus - 2 * currentCost + costMinus) / (h * h));

    grad.push(g);
    hessDiag.push(secondDeriv);
  }

  // Propose damped Levenberg-Marquardt update
  let candidate = currentLayers.map(l => ({ ...l }));
  for (let k = 0; k < activeParams.length; k++) {
    const p = activeParams[k];
    const baseVal = candidate[p.layerIndex][p.field];
    const denom = hessDiag[k] + dampingLambda * (hessDiag[k] + 1e-3);
    const rawStep = -grad[k] / Math.max(1e-8, denom);
    const maxAllowedStep = p.stepSize * 8;
    const boundedStep = Math.max(-maxAllowedStep, Math.min(maxAllowedStep, rawStep));
    candidate = applyParamDelta(candidate, p, baseVal + boundedStep);
  }

  const candidateCost = evaluateLoss(candidate, config, expPoints, lossFunction);
  if (candidateCost < currentCost) {
    return {
      layers: candidate,
      cost: candidateCost,
      newLambda: Math.max(1e-4, dampingLambda * 0.45),
      accepted: true
    };
  }

  return {
    layers: currentLayers,
    cost: currentCost,
    newLambda: Math.min(1e3, dampingLambda * 3.0),
    accepted: false
  };
}

/**
 * Runs Advanced Non-Linear Multi-Algorithm Optimization on Multilayer Stack
 */
export async function runAdvancedOptimization(
  initialLayers: XRRLayer[],
  config: XRRSimulationConfig,
  expPoints: { theta: number; qz: number; intensity: number }[],
  options: OptimizationOptions
): Promise<OptimizationResult> {
  const {
    algorithm = 'hybrid',
    lossFunction = 'log-rmse',
    maxIterations = 150,
    tolerance = 1e-4,
    initialTemp = 1.0,
    coolingRate = 0.95
  } = options;

  let currentLayers = initialLayers.map(l => ({ ...l }));
  const initialCost = evaluateLoss(currentLayers, config, expPoints, lossFunction);
  let bestCost = initialCost;
  let bestLayers = currentLayers.map(l => ({ ...l }));

  const convergenceHistory: { iteration: number; cost: number }[] = [
    { iteration: 0, cost: Number(initialCost.toFixed(4)) }
  ];

  let temp = initialTemp;
  let lmLambda = 0.05;
  let simplexScale = 1.0;
  let iterationsRun = 0;
  const activeParams = getActiveParameters(initialLayers);

  for (let iter = 1; iter <= maxIterations; iter++) {
    iterationsRun = iter;
    const useLMPhase =
      algorithm === 'levenberg-marquardt' ||
      (algorithm === 'hybrid' && iter > Math.floor(maxIterations * 0.65));

    if (useLMPhase && activeParams.length > 0) {
      const lmStep = performLevenbergMarquardtStep(
        bestLayers,
        bestCost,
        config,
        expPoints,
        lossFunction,
        lmLambda
      );
      lmLambda = lmStep.newLambda;
      if (lmStep.accepted) {
        currentLayers = lmStep.layers;
        bestLayers = lmStep.layers.map(l => ({ ...l }));
        bestCost = lmStep.cost;
      }
    } else if (algorithm === 'nelder-mead' && activeParams.length > 0) {
      // Directional coordinate reflection / expansion / contraction cycle
      const pIdx = (iter - 1) % activeParams.length;
      const p = activeParams[pIdx];
      const baseVal = bestLayers[p.layerIndex][p.field];
      const delta = p.stepSize * 3.5 * simplexScale;

      const reflectPlus = applyParamDelta(bestLayers, p, baseVal + delta);
      const costPlus = evaluateLoss(reflectPlus, config, expPoints, lossFunction);

      if (costPlus < bestCost) {
        // Try expansion (1.8x)
        const expandPlus = applyParamDelta(bestLayers, p, baseVal + 1.8 * delta);
        const costExpand = evaluateLoss(expandPlus, config, expPoints, lossFunction);
        if (costExpand < costPlus) {
          bestLayers = expandPlus;
          bestCost = costExpand;
        } else {
          bestLayers = reflectPlus;
          bestCost = costPlus;
        }
        currentLayers = bestLayers.map(l => ({ ...l }));
      } else {
        const reflectMinus = applyParamDelta(bestLayers, p, baseVal - delta);
        const costMinus = evaluateLoss(reflectMinus, config, expPoints, lossFunction);
        if (costMinus < bestCost) {
          bestLayers = reflectMinus;
          bestCost = costMinus;
          currentLayers = bestLayers.map(l => ({ ...l }));
        } else {
          // Contraction
          simplexScale = Math.max(0.08, simplexScale * 0.88);
        }
      }
    } else {
      // Global Simulated Annealing perturbation respecting parameter locks and bounds
      const candidateLayers = currentLayers.map(layer => {
        const isSubstrate = layer.thickness === 0;

        let newThick = layer.thickness;
        if (!isSubstrate && !layer.lockedThickness) {
          const scale = Math.max(0.5, layer.thickness * 0.065 * (temp + 0.06));
          const delta = (Math.random() - 0.5) * 2 * scale;
          const minT = layer.minThickness ?? 5;
          const maxT = layer.maxThickness ?? 1500;
          newThick = Math.min(maxT, Math.max(minT, layer.thickness + delta));
        }

        let newRough = layer.roughness;
        if (!layer.lockedRoughness) {
          const scale = Math.max(0.12, layer.roughness * 0.085 * (temp + 0.06));
          const delta = (Math.random() - 0.5) * 2 * scale;
          const minR = layer.minRoughness ?? 0.2;
          const maxR = layer.maxRoughness ?? 40;
          newRough = Math.min(maxR, Math.max(minR, layer.roughness + delta));
        }

        let newDens = layer.density;
        if (!layer.lockedDensity) {
          const scale = Math.max(0.03, layer.density * 0.05 * (temp + 0.06));
          const delta = (Math.random() - 0.5) * 2 * scale;
          const minD = layer.minDensity ?? 0.1;
          const maxD = layer.maxDensity ?? 24;
          newDens = Math.min(maxD, Math.max(minD, layer.density + delta));
        }

        const ratio = newDens / (layer.density || 1);
        return {
          ...layer,
          thickness: Number(newThick.toFixed(2)),
          roughness: Number(newRough.toFixed(2)),
          density: Number(newDens.toFixed(3)),
          delta: Math.max(0, Number((layer.delta * ratio).toFixed(3))),
          beta: Math.max(0, Number((layer.beta * ratio).toFixed(4)))
        };
      });

      const candidateCost = evaluateLoss(candidateLayers, config, expPoints, lossFunction);
      const deltaCost = candidateCost - bestCost;

      let accept = false;
      if (deltaCost < 0) {
        accept = true;
      } else {
        const p = Math.exp(-deltaCost / Math.max(0.0005, temp * 0.08));
        if (Math.random() < p) {
          accept = true;
        }
      }

      if (accept) {
        currentLayers = candidateLayers;
        if (candidateCost < bestCost) {
          bestCost = candidateCost;
          bestLayers = candidateLayers.map(l => ({ ...l }));
        }
      }

      temp *= coolingRate;
    }

    convergenceHistory.push({ iteration: iter, cost: Number(bestCost.toFixed(4)) });

    if (options.onProgress && iter % 10 === 0) {
      options.onProgress(iter, bestCost, bestLayers);
    }

    if (bestCost < tolerance) {
      break;
    }
  }

  // Calculate final goodness of fit using interpolated alignment
  const finalCurve = calculateReflectivityCurve(bestLayers, config);
  const alignedPoints = finalCurve.map(pt => {
    const matched = expPoints.find(e => Math.abs(e.theta - pt.theta) < config.angleStep * 0.85);
    return {
      ...pt,
      rExp: matched ? matched.intensity : undefined
    };
  });

  const quality = calculateFitQuality(alignedPoints);
  const residualSigma = Math.max(0.008, quality.logRmse || 0.02);

  // Compute physical parameter uncertainties via finite-difference Jacobian sensitivity (J^T J)^-1
  const uncertainties: OptimizationResult['uncertainties'] = {};
  for (let idx = 0; idx < bestLayers.length; idx++) {
    const layer = bestLayers[idx];

    const computeStdErr = (field: 'thickness' | 'roughness' | 'density', step: number): number => {
      if (field === 'thickness' && (layer.thickness === 0 || layer.lockedThickness)) return 0;
      if (field === 'roughness' && layer.lockedRoughness) return 0;
      if (field === 'density' && layer.lockedDensity) return 0;

      const paramRef: ActiveParamRef = {
        layerIndex: idx,
        field,
        min: 0.01,
        max: 5000,
        stepSize: step
      };
      const baseVal = layer[field];
      const perturbedLayers = applyParamDelta(bestLayers, paramRef, baseVal + step);
      const perturbedCurve = calculateReflectivityCurve(perturbedLayers, config);

      let jtj = 0;
      for (let i = 0; i < finalCurve.length; i++) {
        const r0 = finalCurve[i].rCalc;
        const r1 = perturbedCurve[i]?.rCalc ?? r0;
        if (r0 > 1e-10 && r1 > 1e-10) {
          const dLogRdp = (Math.log10(r1) - Math.log10(r0)) / step;
          jtj += dLogRdp * dLogRdp;
        }
      }

      if (jtj <= 1e-10) return Number((baseVal * 0.02).toFixed(3));
      const stdErr = residualSigma / Math.sqrt(jtj);
      return Number(Math.min(baseVal * 0.25, Math.max(step * 0.15, stdErr)).toFixed(3));
    };

    uncertainties[layer.id] = {
      thicknessError: Number(computeStdErr('thickness', Math.max(0.2, layer.thickness * 0.005)).toFixed(2)),
      roughnessError: Number(computeStdErr('roughness', Math.max(0.05, layer.roughness * 0.01)).toFixed(2)),
      densityError: Number(computeStdErr('density', Math.max(0.01, layer.density * 0.005)).toFixed(3))
    };
  }

  return {
    optimizedLayers: bestLayers,
    initialCost: Number(initialCost.toFixed(4)),
    finalCost: Number(bestCost.toFixed(4)),
    iterationsRun,
    convergenceHistory,
    quality,
    uncertainties
  };
}
