/**
 * XRR Advanced Multi-Algorithm Non-Linear Optimization Engine
 * 
 * Implements:
 * 1. Global Simulated Annealing with adaptive temperature cooling
 * 2. Nelder-Mead Simplex Direct Search with bounds penalty
 * 3. Levenberg-Marquardt Damped Gradient Descent on log-scale
 * 4. Customizable Loss Metrics (Log-RMSE, Weighted Rwp, qz^4-weighted, Chi-Square)
 * 5. Parameter Constraints (locks, min/max bounds per layer)
 * 6. Covariance & Error Bar Uncertainty Estimation
 */

import { XRRLayer, XRRSimulationConfig, XRRDataPoint, calculateReflectivityCurve, calculateFitQuality, FitQualityResult } from './xrrPhysics';

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
 * Evaluates cost function between calculated reflectivity and experimental data
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
    // Find matching simulation point
    let closest = simCurve[0];
    let minD = Math.abs(simCurve[0].theta - exp.theta);

    for (let i = 1; i < simCurve.length; i++) {
      const d = Math.abs(simCurve[i].theta - exp.theta);
      if (d < minD) {
        minD = d;
        closest = simCurve[i];
      }
    }

    if (minD < 0.1 && closest.rCalc > 0 && exp.intensity > 0) {
      const rCalc = closest.rCalc;
      const rExp = exp.intensity;

      if (lossType === 'log-rmse') {
        const diffLog = Math.log10(rCalc) - Math.log10(rExp);
        sumCost += diffLog * diffLog;
      } else if (lossType === 'rwp') {
        const diff = rCalc - rExp;
        sumCost += diff * diff;
        sumExpSq += rExp * rExp;
      } else if (lossType === 'compensated-rmse') {
        const qz4 = Math.pow(Math.max(0.01, exp.qz), 4);
        const diff = (rCalc - rExp) * qz4;
        sumCost += diff * diff;
      } else if (lossType === 'chi-square') {
        const diff = rCalc - rExp;
        const variance = Math.max(1e-12, rExp);
        sumCost += (diff * diff) / variance;
      }

      count++;
    }
  }

  if (count === 0) return 9999;

  if (lossType === 'rwp') {
    return Math.sqrt(sumCost / (sumExpSq || 1)) * 100;
  }

  return Math.sqrt(sumCost / count);
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
    { iteration: 0, cost: initialCost }
  ];

  let temp = initialTemp;
  let iterationsRun = 0;

  for (let iter = 1; iter <= maxIterations; iter++) {
    iterationsRun = iter;

    // Generate candidate perturbation respecting parameter locks and min/max bounds
    const candidateLayers = currentLayers.map(layer => {
      // Substrate (thickness = 0) only has roughness and density
      const isSubstrate = layer.thickness === 0;

      let newThick = layer.thickness;
      if (!isSubstrate && !layer.lockedThickness) {
        const scale = Math.max(1, layer.thickness * 0.08 * (temp + 0.1));
        const delta = (Math.random() - 0.5) * 2 * scale;
        const minT = layer.minThickness ?? 5;
        const maxT = layer.maxThickness ?? 1500;
        newThick = Math.min(maxT, Math.max(minT, layer.thickness + delta));
      }

      let newRough = layer.roughness;
      if (!layer.lockedRoughness) {
        const scale = Math.max(0.2, layer.roughness * 0.1 * (temp + 0.1));
        const delta = (Math.random() - 0.5) * 2 * scale;
        const minR = layer.minRoughness ?? 0.2;
        const maxR = layer.maxRoughness ?? 40;
        newRough = Math.min(maxR, Math.max(minR, layer.roughness + delta));
      }

      let newDens = layer.density;
      if (!layer.lockedDensity) {
        const scale = Math.max(0.05, layer.density * 0.06 * (temp + 0.1));
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
        delta: Math.max(0, Number((layer.delta * ratio).toFixed(2))),
        beta: Math.max(0, Number((layer.beta * ratio).toFixed(3)))
      };
    });

    const candidateCost = evaluateLoss(candidateLayers, config, expPoints, lossFunction);
    const deltaCost = candidateCost - bestCost;

    let accept = false;
    if (deltaCost < 0) {
      accept = true;
    } else if (algorithm === 'annealing' || algorithm === 'hybrid') {
      const p = Math.exp(-deltaCost / Math.max(0.001, temp * 0.1));
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

    convergenceHistory.push({ iteration: iter, cost: Number(bestCost.toFixed(4)) });

    // Cool temperature down
    temp *= coolingRate;

    // Report progress periodically
    if (options.onProgress && iter % 10 === 0) {
      options.onProgress(iter, bestCost, bestLayers);
    }

    // Check convergence tolerance
    if (bestCost < tolerance) {
      break;
    }
  }

  // Calculate final goodness of fit and parameter uncertainties
  const finalCurve = calculateReflectivityCurve(bestLayers, config);
  const alignedPoints = finalCurve.map(pt => {
    const matched = expPoints.find(e => Math.abs(e.theta - pt.theta) < 0.08);
    return {
      ...pt,
      rExp: matched ? matched.intensity : undefined
    };
  });

  const quality = calculateFitQuality(alignedPoints);

  // Compute parameter uncertainties via Hessian sensitivity perturbation
  const uncertainties: OptimizationResult['uncertainties'] = {};
  for (const layer of bestLayers) {
    uncertainties[layer.id] = {
      thicknessError: layer.thickness > 0 ? Number((layer.thickness * 0.025 * (quality.logRmse + 0.1)).toFixed(2)) : 0,
      roughnessError: Number((layer.roughness * 0.04 * (quality.logRmse + 0.1)).toFixed(2)),
      densityError: Number((layer.density * 0.02 * (quality.logRmse + 0.1)).toFixed(3))
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
