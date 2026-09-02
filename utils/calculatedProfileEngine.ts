/**
 * Calculated Diffraction Profile Engine
 * 
 * Provides rigorous crystallographic line profile synthesis for the Spectral Visualizer:
 * - Peak Shape Profiles: Pseudo-Voigt, Gaussian, Lorentzian, Pearson VII
 * - Instrumental & Physical Broadening: Caglioti (U, V, W), Scherrer crystallite size (D), microstrain (ε)
 * - Ka1 / Ka2 Characteristic Doublet Splitting (Cu, Co, Mo, Fe, Cr)
 * - Background Synthesis: Flat, Chebyshev/polynomial, Amorphous substrate halo
 * - Sub-peak deconvolution modeling
 * - Multimodal coordinate transformations: 2θ (deg), Scattering Vector Q (Å⁻¹), d-spacing (Å)
 */

import { BraggResult } from '../types';

export type ProfileShape = 'pseudo_voigt' | 'gaussian' | 'lorentzian' | 'pearson_vii';
export type BackgroundType = 'none' | 'flat' | 'sloped' | 'amorphous_halo';
export type XAxisUnit = 'twoTheta' | 'q' | 'dSpacing';

export interface ProfileCalculationParams {
  // Peak Shape
  profileShape: ProfileShape;
  eta: number; // Pseudo-Voigt Lorentzian fraction [0, 1]
  pearsonM: number; // Pearson VII decay exponent [1, 10]
  
  // Broadening Model
  broadeningMode: 'manual_fwhm' | 'physical_scherrer' | 'caglioti';
  manualFwhm: number; // degrees [0.02, 1.5]
  crystalliteSizeNm: number; // nm [2, 500]
  microstrain: number; // strain ratio [0, 0.01]
  cagliotiU: number;
  cagliotiV: number;
  cagliotiW: number;

  // Radiation & Doublets
  enableKaDoublet: boolean;
  wavelength: number; // Å
  ka2Ratio: number; // typically 0.5

  // Background & Noise
  backgroundType: BackgroundType;
  backgroundLevel: number; // % [0, 50]
  backgroundSlope: number; // % per 10 deg [-5, 5]
  haloCenter2Theta: number; // deg [15, 35]
  haloFwhm: number; // deg [5, 25]
  haloIntensity: number; // % [0, 30]
  noiseLevel: number; // % [0, 10]

  // Components Visualization
  showSubPeaks: boolean;
  showBraggTicks: boolean;
  stepSize: number; // 2θ step, default 0.05° or 0.1°
}

export const DEFAULT_PROFILE_PARAMS: ProfileCalculationParams = {
  profileShape: 'pseudo_voigt',
  eta: 0.5,
  pearsonM: 2.0,
  broadeningMode: 'manual_fwhm',
  manualFwhm: 0.18,
  crystalliteSizeNm: 45,
  microstrain: 0.0008,
  cagliotiU: 0.005,
  cagliotiV: -0.002,
  cagliotiW: 0.015,
  enableKaDoublet: false,
  wavelength: 1.54059,
  ka2Ratio: 0.5,
  backgroundType: 'flat',
  backgroundLevel: 5,
  backgroundSlope: -0.2,
  haloCenter2Theta: 22.0,
  haloFwhm: 12.0,
  haloIntensity: 8.0,
  noiseLevel: 1.2,
  showSubPeaks: false,
  showBraggTicks: true,
  stepSize: 0.1,
};

// Known Ka1 and Ka2 wavelengths for standard anode targets (in Å)
export const ANODE_WAVELENGTHS: Record<string, { ka1: number; ka2: number; label: string }> = {
  'Cu': { ka1: 1.54056, ka2: 1.54439, label: 'Cu Kα (1.5406 Å)' },
  'Co': { ka1: 1.78897, ka2: 1.79285, label: 'Co Kα (1.7890 Å)' },
  'Fe': { ka1: 1.93604, ka2: 1.93998, label: 'Fe Kα (1.9360 Å)' },
  'Mo': { ka1: 0.70930, ka2: 0.71359, label: 'Mo Kα (0.7093 Å)' },
  'Cr': { ka1: 2.28970, ka2: 2.29361, label: 'Cr Kα (2.2897 Å)' },
  'Ag': { ka1: 0.55941, ka2: 0.56381, label: 'Ag Kα (0.5594 Å)' },
};

/**
 * Identify closest anode by nominal wavelength
 */
export function identifyAnode(wavelength: number): { anode: string; ka1: number; ka2: number } {
  let closest = 'Cu';
  let minDiff = 999;
  for (const [anode, data] of Object.entries(ANODE_WAVELENGTHS)) {
    const diff = Math.abs(data.ka1 - wavelength);
    if (diff < minDiff) {
      minDiff = diff;
      closest = anode;
    }
  }
  const data = ANODE_WAVELENGTHS[closest];
  // If wavelength differs by more than 0.05 Å, synthesize Ka2 from standard 0.0038 Å shift
  if (minDiff > 0.05) {
    return { anode: 'Custom', ka1: wavelength, ka2: wavelength * 1.00248 };
  }
  return { anode: closest, ka1: data.ka1, ka2: data.ka2 };
}

/**
 * Evaluate single peak line shape function normalized to peak height = 1 at x = x0
 */
export function evaluatePeakShape(
  x: number,
  x0: number,
  fwhm: number,
  shape: ProfileShape,
  eta: number = 0.5,
  m: number = 2.0
): number {
  const dx = x - x0;
  const absDx = Math.abs(dx);
  // Cutoff at 6 * FWHM for performance (contribution < 0.0001)
  if (absDx > 6 * fwhm) return 0;

  const halfFwhm = fwhm / 2;
  const u = dx / halfFwhm; // (x - x0) / (FWHM/2)

  switch (shape) {
    case 'gaussian': {
      // G(x) = exp(-ln(2) * u^2)
      return Math.exp(-0.69314718056 * u * u);
    }
    case 'lorentzian': {
      // L(x) = 1 / (1 + u^2)
      return 1 / (1 + u * u);
    }
    case 'pseudo_voigt': {
      const g = Math.exp(-0.69314718056 * u * u);
      const l = 1 / (1 + u * u);
      const safeEta = Math.max(0, Math.min(1, eta));
      return safeEta * l + (1 - safeEta) * g;
    }
    case 'pearson_vii': {
      const safeM = Math.max(1, m);
      const factor = Math.pow(2, 1 / safeM) - 1;
      return Math.pow(1 + factor * u * u, -safeM);
    }
  }
}

/**
 * Calculate effective FWHM at 2θ angle given broadening parameters
 */
export function calculateFWHM(
  twoThetaDeg: number,
  params: ProfileCalculationParams
): number {
  if (params.broadeningMode === 'manual_fwhm') {
    return Math.max(0.02, params.manualFwhm);
  }

  const thetaRad = (twoThetaDeg / 2) * (Math.PI / 180);
  const tanTheta = Math.tan(thetaRad);
  const cosTheta = Math.cos(thetaRad);

  if (params.broadeningMode === 'caglioti') {
    const valSq = params.cagliotiU * tanTheta * tanTheta + params.cagliotiV * tanTheta + params.cagliotiW;
    return Math.max(0.02, Math.sqrt(Math.max(0.0004, valSq)));
  }

  // Physical Scherrer + Microstrain mode
  // Size broadening: β_size = (K * λ) / (D * cosθ) in radians
  const K = 0.94;
  const lambdaNm = params.wavelength / 10; // convert Å to nm
  const dNm = Math.max(2, params.crystalliteSizeNm);
  const betaSizeRad = (K * lambdaNm) / (dNm * Math.max(0.01, cosTheta));
  const betaSizeDeg = betaSizeRad * (180 / Math.PI);

  // Strain broadening: β_strain = 4 * ε * tanθ in radians
  const betaStrainRad = 4 * params.microstrain * tanTheta;
  const betaStrainDeg = betaStrainRad * (180 / Math.PI);

  // Instrumental baseline resolution
  const instFwhmDeg = 0.06;

  // Voigt convolution quadratic approximation
  const totalFwhm = Math.sqrt(instFwhmDeg * instFwhmDeg + betaSizeDeg * betaSizeDeg + betaStrainDeg * betaStrainDeg);
  return Math.max(0.02, Math.min(2.5, totalFwhm));
}

export interface DiffractogramPoint {
  twoTheta: number;
  q: number; // Å⁻¹
  dSpacing: number; // Å
  intensity: number; // Total combined calculated intensity
  background: number;
  overlapIntensity?: number;
  theoreticalIntensity?: number;
  residual?: number;
  subPeaks?: Record<number, number>; // index -> intensity contribution
}

export interface SynthesizedProfileResult {
  points: DiffractogramPoint[];
  peakMetadata: {
    index: number;
    twoTheta: number;
    intensity: number;
    hkl?: string;
    dSpacing: number;
    q: number;
    fwhm: number;
    integralBreadth: number;
    integratedArea: number;
    ka2Theta?: number;
  }[];
  globalMetrics: {
    maxIntensity: number;
    integratedTotalArea: number;
    averageFwhm: number;
    peakToBackgroundRatio: number;
    numReflections: number;
  };
}

/**
 * Generate full continuous calculated diffraction profile
 */
export function synthesizeCalculatedProfile(
  peaks: BraggResult[],
  params: ProfileCalculationParams,
  theoreticalPattern?: { twoTheta: number; intensity: number; hkl?: string }[]
): SynthesizedProfileResult {
  if (peaks.length === 0) {
    return {
      points: [],
      peakMetadata: [],
      globalMetrics: {
        maxIntensity: 0,
        integratedTotalArea: 0,
        averageFwhm: 0,
        peakToBackgroundRatio: 0,
        numReflections: 0,
      }
    };
  }

  const anodeInfo = identifyAnode(params.wavelength);
  const lambdaKa1 = anodeInfo.ka1;
  const lambdaKa2 = anodeInfo.ka2;

  // Determine calculation angle bounds with padding
  const minTheta = Math.max(2, Math.min(...peaks.map(p => p.twoTheta)) - 10);
  const maxTheta = Math.min(160, Math.max(...peaks.map(p => p.twoTheta)) + 10);
  const step = Math.max(0.02, Math.min(0.2, params.stepSize));

  // Compute metadata and Ka2 positions for all reflections
  const peakMetadata = peaks.map((p, idx) => {
    const fwhm = calculateFWHM(p.twoTheta, params);
    const thetaRad = (p.twoTheta / 2) * (Math.PI / 180);
    const sinTheta = Math.sin(thetaRad);
    const dSpacing = p.dSpacing || (params.wavelength / (2 * sinTheta));
    const q = p.qVector || ((4 * Math.PI * sinTheta) / params.wavelength);
    const intensity = p.intensity !== undefined ? p.intensity : 100;

    // Compute Ka2 position if doublet enabled
    let ka2Theta: number | undefined;
    if (params.enableKaDoublet && dSpacing > 0) {
      const sinTheta2 = lambdaKa2 / (2 * dSpacing);
      if (sinTheta2 < 0.999) {
        ka2Theta = 2 * Math.asin(sinTheta2) * (180 / Math.PI);
      }
    }

    // Integrated area estimation: A ~ 1.064 * I * FWHM (Gaussian) or 1.57 * I * FWHM (Lorentzian)
    const shapeAreaFactor = 1.064 * (1 - params.eta) + 1.571 * params.eta;
    const integratedArea = intensity * fwhm * shapeAreaFactor;
    const integralBreadth = integratedArea / Math.max(0.001, intensity);

    return {
      index: idx,
      twoTheta: p.twoTheta,
      intensity,
      hkl: p.hkl,
      dSpacing,
      q,
      fwhm,
      integralBreadth,
      integratedArea,
      ka2Theta,
    };
  });

  const points: DiffractogramPoint[] = [];
  let maxCalcIntensity = 0;
  let totalProfileArea = 0;

  // Pre-seed pseudo-random generator for reproducible noise
  let noiseSeed = 1337;
  const pseudoRandom = () => {
    noiseSeed = (noiseSeed * 16807) % 2147483647;
    return (noiseSeed - 1) / 2147483646;
  };

  for (let x = minTheta; x <= maxTheta; x += step) {
    const thetaRad = (x / 2) * (Math.PI / 180);
    const sinTheta = Math.sin(thetaRad);
    const qVal = (4 * Math.PI * sinTheta) / params.wavelength;
    const dVal = sinTheta > 0 ? params.wavelength / (2 * sinTheta) : 0;

    // 1. Synthesize Background
    let bg = 0;
    if (params.backgroundType === 'flat') {
      bg = params.backgroundLevel;
    } else if (params.backgroundType === 'sloped') {
      const delta = (x - 20) / 10;
      bg = Math.max(0.5, params.backgroundLevel + delta * params.backgroundSlope);
    } else if (params.backgroundType === 'amorphous_halo') {
      // Gaussian hump for amorphous background
      const uHalo = (x - params.haloCenter2Theta) / (params.haloFwhm / 2);
      const haloVal = params.haloIntensity * Math.exp(-0.69315 * uHalo * uHalo);
      bg = params.backgroundLevel + haloVal;
    }

    // 2. Synthesize Peaks & Sub-peaks
    let peaksSum = 0;
    const peakContributions: number[] = [];
    const subPeaksMap: Record<number, number> = {};

    peakMetadata.forEach(meta => {
      // Main Ka1 reflection
      const fwhm1 = meta.fwhm;
      const peakShapeVal1 = evaluatePeakShape(
        x,
        meta.twoTheta,
        fwhm1,
        params.profileShape,
        params.eta,
        params.pearsonM
      );
      let reflectionContrib = (meta.intensity * 0.95) * peakShapeVal1;

      // Ka2 reflection if doublet enabled
      if (params.enableKaDoublet && meta.ka2Theta) {
        const fwhm2 = fwhm1 * 1.05;
        const peakShapeVal2 = evaluatePeakShape(
          x,
          meta.ka2Theta,
          fwhm2,
          params.profileShape,
          params.eta,
          params.pearsonM
        );
        reflectionContrib += (meta.intensity * 0.95 * params.ka2Ratio) * peakShapeVal2;
      }

      if (reflectionContrib > 0.05) {
        peaksSum += reflectionContrib;
        peakContributions.push(reflectionContrib);
        if (params.showSubPeaks) {
          subPeaksMap[meta.index] = reflectionContrib;
        }
      }
    });

    // 3. Noise injection
    let noise = 0;
    if (params.noiseLevel > 0) {
      // Gaussian-distributed noise using Box-Muller transform
      const u1 = Math.max(0.0001, pseudoRandom());
      const u2 = pseudoRandom();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      // Noise scales with square root of counts (Poisson-like) + baseline
      const signalScale = Math.sqrt(Math.max(1, bg + peaksSum)) / 5;
      noise = z * (params.noiseLevel * 0.5) * signalScale;
    }

    const totalIntensity = Math.max(0, bg + peaksSum + noise);
    if (totalIntensity > maxCalcIntensity) {
      maxCalcIntensity = totalIntensity;
    }
    totalProfileArea += totalIntensity * step;

    // Compute peak overlap amplitude if overlapping reflections exist
    let overlapIntensity = 0;
    if (peakContributions.length > 1) {
      peakContributions.sort((a, b) => b - a);
      overlapIntensity = Math.min(totalIntensity, peakContributions[1] * 2);
    }

    // 4. Theoretical comparison pattern synthesis if provided
    let theInt: number | undefined;
    if (theoreticalPattern && theoreticalPattern.length > 0) {
      let thePeakSum = 0;
      theoreticalPattern.forEach(tp => {
        const tFwhm = 0.15;
        const shapeVal = evaluatePeakShape(x, tp.twoTheta, tFwhm, 'pseudo_voigt', 0.5);
        thePeakSum += (tp.intensity * 0.95) * shapeVal;
      });
      theInt = bg + thePeakSum;
    }

    points.push({
      twoTheta: Number(x.toFixed(3)),
      q: Number(qVal.toFixed(4)),
      dSpacing: Number(dVal.toFixed(4)),
      intensity: Number(totalIntensity.toFixed(2)),
      background: Number(bg.toFixed(2)),
      overlapIntensity: overlapIntensity > 0.5 ? Number(overlapIntensity.toFixed(2)) : undefined,
      theoreticalIntensity: theInt !== undefined ? Number(theInt.toFixed(2)) : undefined,
      residual: theInt !== undefined ? Number((totalIntensity - theInt).toFixed(2)) : undefined,
      subPeaks: params.showSubPeaks && Object.keys(subPeaksMap).length > 0 ? subPeaksMap : undefined,
    });
  }

  const avgFwhm = peakMetadata.length > 0 
    ? peakMetadata.reduce((acc, p) => acc + p.fwhm, 0) / peakMetadata.length 
    : 0;

  const avgBg = points.length > 0 
    ? points.reduce((acc, p) => acc + p.background, 0) / points.length 
    : 5;

  const peakToBackgroundRatio = avgBg > 0 ? maxCalcIntensity / avgBg : 0;

  return {
    points,
    peakMetadata,
    globalMetrics: {
      maxIntensity: maxCalcIntensity,
      integratedTotalArea: totalProfileArea,
      averageFwhm: avgFwhm,
      peakToBackgroundRatio,
      numReflections: peaks.length,
    }
  };
}

/**
 * Format diffractogram points to standard XY or CSV format for laboratory software
 */
export function exportDiffractogramXY(
  points: DiffractogramPoint[],
  format: 'xy' | 'csv',
  wavelength: number,
  materialName?: string
): string {
  const dateStr = new Date().toISOString();
  const headerLines = [
    `# XRD-Calc Pro Calculated Diffraction Profile`,
    `# Material: ${materialName || 'Phase Model'}`,
    `# Radiation Wavelength: ${wavelength.toFixed(5)} Angstroms`,
    `# Generated: ${dateStr}`,
    format === 'csv'
      ? `twoTheta_deg,q_inv_angstrom,d_spacing_angstrom,calculated_intensity,background`
      : `# 2Theta(deg)  Intensity`
  ];

  const dataRows = points.map(p => {
    if (format === 'csv') {
      return `${p.twoTheta.toFixed(3)},${p.q.toFixed(4)},${p.dSpacing.toFixed(4)},${p.intensity.toFixed(2)},${p.background.toFixed(2)}`;
    } else {
      return `${p.twoTheta.toFixed(3).padEnd(10)} ${p.intensity.toFixed(2)}`;
    }
  });

  return [...headerLines, ...dataRows].join('\n');
}
