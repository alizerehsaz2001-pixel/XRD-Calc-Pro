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
export type IntensityScale = 'linear' | 'log10' | 'sqrt';

export interface ProfileCalculationParams {
  // Peak Shape
  profileShape: ProfileShape;
  eta: number; // Pseudo-Voigt Lorentzian fraction [0, 1]
  pearsonM: number; // Pearson VII decay exponent [1, 10]
  asymmetry: number; // Low-angle axial divergence factor [0, 0.3]
  
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

  // Scaling & Difference curve
  intensityScale: IntensityScale;
  showDifferenceCurve: boolean;

  // Components Visualization
  showSubPeaks: boolean;
  showBraggTicks: boolean;
  stepSize: number; // 2θ step, default 0.05° or 0.1°
}

export const DEFAULT_PROFILE_PARAMS: ProfileCalculationParams = {
  profileShape: 'pseudo_voigt',
  eta: 0.5,
  pearsonM: 2.0,
  asymmetry: 0.04,
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
  intensityScale: 'linear',
  showDifferenceCurve: false,
  showSubPeaks: false,
  showBraggTicks: true,
  stepSize: 0.1,
};

export interface InstrumentPreset {
  id: string;
  name: string;
  description: string;
  params: Partial<ProfileCalculationParams>;
}

export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: 'lab_cu',
    name: 'Laboratory Cu Kα (Bruker/PANalytical)',
    description: 'Standard Bragg-Brentano reflection geometry with Cu Kα doublet, flat baseline & 0.14° instrumental FWHM.',
    params: {
      profileShape: 'pseudo_voigt',
      eta: 0.5,
      broadeningMode: 'manual_fwhm',
      manualFwhm: 0.14,
      enableKaDoublet: true,
      ka2Ratio: 0.5,
      asymmetry: 0.08,
      backgroundType: 'flat',
      backgroundLevel: 5,
      noiseLevel: 1.2,
    }
  },
  {
    id: 'synchrotron',
    name: 'High-Res Synchrotron (Monochromatic)',
    description: 'Parallel beam synchrotron radiation (λ=0.500 Å), ultra-narrow FWHM (0.025°), pure Lorentzian tails, no doublet.',
    params: {
      profileShape: 'pseudo_voigt',
      eta: 0.35,
      broadeningMode: 'manual_fwhm',
      manualFwhm: 0.025,
      enableKaDoublet: false,
      asymmetry: 0,
      backgroundType: 'flat',
      backgroundLevel: 1.5,
      noiseLevel: 0.5,
    }
  },
  {
    id: 'nano_film',
    name: 'Nanocrystal / Thin Film on Substrate',
    description: 'Scherrer crystallite size broadening (15 nm) + microstrain with broad amorphous substrate halo at 22° 2θ.',
    params: {
      profileShape: 'pseudo_voigt',
      eta: 0.65,
      broadeningMode: 'physical_scherrer',
      crystalliteSizeNm: 15,
      microstrain: 0.002,
      enableKaDoublet: false,
      asymmetry: 0.12,
      backgroundType: 'amorphous_halo',
      backgroundLevel: 6,
      haloCenter2Theta: 22.5,
      haloFwhm: 14,
      haloIntensity: 12,
      noiseLevel: 1.8,
    }
  },
  {
    id: 'mo_anode',
    name: 'Molybdenum Microfocus (Mo Kα)',
    description: 'High-energy short wavelength (0.7093 Å) for heavy elements and capillary capillary transmission geometry.',
    params: {
      profileShape: 'pseudo_voigt',
      eta: 0.45,
      broadeningMode: 'manual_fwhm',
      manualFwhm: 0.08,
      enableKaDoublet: true,
      ka2Ratio: 0.5,
      asymmetry: 0.04,
      backgroundType: 'flat',
      backgroundLevel: 3,
      noiseLevel: 1.0,
    }
  },
  {
    id: 'neutron_thermal',
    name: 'Thermal Neutron Diffractometer',
    description: 'Constant wavelength thermal neutrons (λ=1.54 Å), pure Gaussian profile shape with Caglioti instrumental resolution.',
    params: {
      profileShape: 'gaussian',
      eta: 0,
      broadeningMode: 'caglioti',
      cagliotiU: 0.025,
      cagliotiV: -0.015,
      cagliotiW: 0.035,
      enableKaDoublet: false,
      asymmetry: 0,
      backgroundType: 'flat',
      backgroundLevel: 8,
      noiseLevel: 2.2,
    }
  }
];

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
 * Transform intensity value according to selected dynamic range display scale
 */
export function transformIntensity(
  val: number,
  scale: IntensityScale = 'linear',
  maxVal: number = 100
): number {
  if (scale === 'linear') return Number(val.toFixed(2));
  const safeVal = Math.max(0, val);
  const safeMax = Math.max(1, maxVal);
  if (scale === 'log10') {
    // Continuous dynamic range log10 normalized to 0-100 scale: log10(I + 1) / log10(max + 1) * max
    const norm = Math.log10(safeVal + 1) / Math.log10(safeMax + 1);
    return Number((norm * safeMax).toFixed(2));
  } else if (scale === 'sqrt') {
    // Sqrt scale (classical Rietveld powder diffraction scaling)
    const norm = Math.sqrt(safeVal) / Math.sqrt(safeMax);
    return Number((norm * safeMax).toFixed(2));
  }
  return Number(val.toFixed(2));
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
  m: number = 2.0,
  asymmetry: number = 0
): number {
  let effectiveFwhm = fwhm;
  const dx = x - x0;

  // Axial divergence low-angle asymmetry: peak tail extends to lower 2θ
  if (asymmetry > 0 && dx < 0) {
    const thetaRad = Math.max(0.04, (x0 / 2) * (Math.PI / 180));
    const tanTheta = Math.tan(thetaRad);
    const asymFactor = 1 + (asymmetry * 0.15) / Math.max(0.08, tanTheta);
    effectiveFwhm = fwhm * asymFactor;
  }

  const absDx = Math.abs(dx);
  // Cutoff at 6 * FWHM for performance (contribution < 0.0001)
  if (absDx > 6 * effectiveFwhm) return 0;

  const halfFwhm = effectiveFwhm / 2;
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
  intensityDisplay: number; // Scaled according to intensityScale (linear, log10, sqrt)
  background: number;
  backgroundDisplay: number;
  overlapIntensity?: number;
  theoreticalIntensity?: number;
  theoreticalIntensityDisplay?: number;
  residual?: number;
  residualDisplay?: number;
  subPeaks?: Record<number, number>; // index -> intensity contribution
  subPeaksDisplay?: Record<number, number>;
}

export interface CalculatedPeakMetadata {
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
  kaSplitDeg?: number;
  scherrerSizeNm: number;
}

export interface SynthesizedProfileResult {
  points: DiffractogramPoint[];
  peakMetadata: CalculatedPeakMetadata[];
  globalMetrics: {
    maxIntensity: number;
    integratedTotalArea: number;
    averageFwhm: number;
    peakToBackgroundRatio: number;
    numReflections: number;
  };
  agreementMetrics?: {
    rp: number; // Profile R-factor (%)
    rwp: number; // Weighted profile R-factor (%)
    chi2: number; // Goodness of fit χ²
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
    const cosTheta = Math.cos(thetaRad);
    const dSpacing = p.dSpacing || (params.wavelength / (2 * sinTheta));
    const q = p.qVector || ((4 * Math.PI * sinTheta) / params.wavelength);
    const intensity = p.intensity !== undefined ? p.intensity : 100;

    // Compute Ka2 position if doublet enabled
    let ka2Theta: number | undefined;
    let kaSplitDeg: number | undefined;
    if (dSpacing > 0) {
      const sinTheta2 = lambdaKa2 / (2 * dSpacing);
      if (sinTheta2 < 0.999) {
        ka2Theta = 2 * Math.asin(sinTheta2) * (180 / Math.PI);
        kaSplitDeg = Number((ka2Theta - p.twoTheta).toFixed(3));
      }
    }

    // Integrated area estimation: A ~ 1.064 * I * FWHM (Gaussian) or 1.57 * I * FWHM (Lorentzian)
    const shapeAreaFactor = 1.064 * (1 - params.eta) + 1.571 * params.eta;
    const integratedArea = intensity * fwhm * shapeAreaFactor;
    const integralBreadth = integratedArea / Math.max(0.001, intensity);

    // Scherrer crystallite size per individual reflection
    const lambdaNm = params.wavelength / 10;
    const betaRad = (integralBreadth || fwhm) * (Math.PI / 180);
    const scherrerSizeNm = Number(((0.94 * lambdaNm) / Math.max(0.0001, betaRad * cosTheta)).toFixed(1));

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
      kaSplitDeg,
      scherrerSizeNm,
    };
  });

  const rawPoints: {
    x: number;
    qVal: number;
    dVal: number;
    bg: number;
    totalIntensity: number;
    overlapIntensity?: number;
    theInt?: number;
    subPeaksMap?: Record<number, number>;
  }[] = [];

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
      // Main Ka1 reflection with asymmetry
      const fwhm1 = meta.fwhm;
      const peakShapeVal1 = evaluatePeakShape(
        x,
        meta.twoTheta,
        fwhm1,
        params.profileShape,
        params.eta,
        params.pearsonM,
        params.asymmetry
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
          params.pearsonM,
          params.asymmetry
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

    rawPoints.push({
      x,
      qVal,
      dVal,
      bg,
      totalIntensity,
      overlapIntensity: overlapIntensity > 0.5 ? overlapIntensity : undefined,
      theInt,
      subPeaksMap: Object.keys(subPeaksMap).length > 0 ? subPeaksMap : undefined,
    });
  }

  // 5. Build final points with normalized dynamic range scaling
  const effectiveMax = Math.max(10, maxCalcIntensity);
  const points: DiffractogramPoint[] = rawPoints.map(p => {
    const rawInt = p.totalIntensity;
    const intDisplay = transformIntensity(rawInt, params.intensityScale, effectiveMax);
    const bgDisplay = transformIntensity(p.bg, params.intensityScale, effectiveMax);
    const theIntDisplay = p.theInt !== undefined ? transformIntensity(p.theInt, params.intensityScale, effectiveMax) : undefined;
    
    // Residual calculation: Y_calc - Y_theor
    let rawResidual: number | undefined;
    let resDisplay: number | undefined;
    if (p.theInt !== undefined) {
      rawResidual = Number((rawInt - p.theInt).toFixed(2));
      // Base residual around 10% line on chart so difference can swing +/- above zero line
      resDisplay = Number((8 + rawResidual * 0.4).toFixed(2));
    }

    // Scaled sub-peaks for display if active
    let subPeaksDisplay: Record<number, number> | undefined;
    if (p.subPeaksMap) {
      subPeaksDisplay = {};
      for (const [k, v] of Object.entries(p.subPeaksMap)) {
        subPeaksDisplay[Number(k)] = transformIntensity(v, params.intensityScale, effectiveMax);
      }
    }

    return {
      twoTheta: Number(p.x.toFixed(3)),
      q: Number(p.qVal.toFixed(4)),
      dSpacing: Number(p.dVal.toFixed(4)),
      intensity: Number(rawInt.toFixed(2)),
      intensityDisplay: intDisplay,
      background: Number(p.bg.toFixed(2)),
      backgroundDisplay: bgDisplay,
      overlapIntensity: p.overlapIntensity ? Number(p.overlapIntensity.toFixed(2)) : undefined,
      theoreticalIntensity: p.theInt !== undefined ? Number(p.theInt.toFixed(2)) : undefined,
      theoreticalIntensityDisplay: theIntDisplay,
      residual: rawResidual,
      residualDisplay: resDisplay,
      subPeaks: p.subPeaksMap,
      subPeaksDisplay,
    };
  });

  // Calculate Rietveld-style agreement metrics if theoretical pattern was provided
  let agreementMetrics: { rp: number; rwp: number; chi2: number } | undefined;
  if (theoreticalPattern && theoreticalPattern.length > 0) {
    let sumAbsDiff = 0;
    let sumTheor = 0;
    let sumWeightedSq = 0;
    let validCount = 0;

    points.forEach(pt => {
      if (pt.theoreticalIntensity !== undefined) {
        const diff = Math.abs(pt.intensity - pt.theoreticalIntensity);
        sumAbsDiff += diff;
        sumTheor += pt.theoreticalIntensity;
        const w = 1 / Math.max(1, pt.theoreticalIntensity);
        sumWeightedSq += (diff * diff) * w;
        validCount++;
      }
    });

    const rp = sumTheor > 0 ? Number(((sumAbsDiff / sumTheor) * 100).toFixed(2)) : 0;
    const rwp = sumTheor > 0 ? Number((Math.sqrt(sumWeightedSq / sumTheor) * 100).toFixed(2)) : 0;
    const chi2 = validCount > 10 ? Number(Math.max(0.8, sumWeightedSq / (validCount - 5)).toFixed(2)) : 1.0;

    agreementMetrics = { rp, rwp, chi2 };
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
    },
    agreementMetrics,
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
