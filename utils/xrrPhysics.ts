/**
 * X-Ray Reflectometry (XRR) Physics & Parratt Recursion Engine
 * Computes theoretical specular reflectivity curves for multilayer thin films
 * on substrates, incorporating Névot-Croce interface roughness corrections,
 * beam divergence convolution, real-space Scattering Length Density (SLD) profiles,
 * Kiessig fringe thickness extraction, critical angle detection, and parameter fitting.
 */

export interface XRRLayer {
  id: string;
  name: string;
  thickness: number;  // in Angstroms (Å) - 0 for substrate/ambient
  roughness: number;  // RMS interface roughness σ in Angstroms (Å)
  density: number;    // Mass density in g/cm³
  delta: number;      // Real part of refractive index dispersion (× 10⁻⁶)
  beta: number;       // Imaginary part of refractive index absorption (× 10⁻⁷)
  gradingThickness?: number; // Interdiffusion / graded interface thickness (Å)
  gradientType?: 'none' | 'linear' | 'exponential' | 'sigmoidal'; // Continuous density profile
  gradientDeltaDensity?: number; // Δρ shift across layer thickness (g/cm³)
  color?: string;
}

export interface XRRMaterialPreset {
  name: string;
  density: number;    // g/cm³
  delta: number;      // × 10⁻⁶ (at Cu K-alpha = 1.5406 Å)
  beta: number;       // × 10⁻⁷
  atomicZ?: number;
  molarMass?: number;
  category: 'Substrates' | 'Oxides' | 'Metals' | 'Semiconductors' | 'Organics' | 'Synthesis / Custom' | string;
  color: string;
  isCustom?: boolean;
  notes?: string;
}

export interface XRRSimulationConfig {
  wavelength: number;     // X-ray wavelength in Å (default 1.5406 Å Cu K-alpha)
  radiationSource?: 'cu-ka1' | 'cu-ka2' | 'mo-ka' | 'co-ka' | 'cr-ka' | 'synchrotron';
  synchrotronEnergyKeV?: number; // Synchrotron X-ray energy in keV
  angleStart: number;     // Incident angle θ start (deg)
  angleEnd: number;       // Incident angle θ end (deg)
  angleStep: number;      // Angle step size (deg)
  angleUnit: 'theta' | 'twoTheta' | 'qz'; // Display x-axis unit
  beamDivergence: number; // Angular resolution FWHM in degrees
  background: number;     // Noise floor background intensity
  roughnessModel?: 'nevot-croce' | 'debye-waller'; // Roughness attenuation damping equation
  intensityScale?: number;// Experimental intensity multiplier scale factor
  angleOffset?: number;   // Angular zero-point error correction (° θ)
  footprintCorrection?: boolean; // Enable beam footprint spillover correction at low angles
  sampleLengthMm?: number;  // Sample length in mm (default 20 mm)
  beamWidthMm?: number;     // X-ray beam height/width in mm (default 0.2 mm)
}

export interface XRRDataPoint {
  theta: number;          // Incident angle θ in degrees
  twoTheta: number;       // Scattering angle 2θ in degrees
  qz: number;             // Scattering vector qz = (4π/λ)sinθ in Å⁻¹
  rCalc: number;          // Calculated specular reflectivity R (0 to 1)
  rCalcMin?: number;       // Monte Carlo 95% lower confidence bound
  rCalcMax?: number;       // Monte Carlo 95% upper confidence bound
  rExp?: number;          // Experimental reflectivity (if imported)
  fresnelR?: number;      // Ideal Fresnel reflectivity for single substrate
  footprintFactor?: number; // Beam footprint spillover factor (0 to 1)
}

export interface SLDPoint {
  z: number;              // Depth in Angstroms (0 = ambient top surface)
  density: number;        // Mass density in g/cm³
  delta: number;          // Dispersion delta (× 10⁻⁶)
  beta: number;           // Absorption beta (× 10⁻⁷)
  electronDensity: number;// Electron density in e⁻/Å³
  layerName: string;
}

export interface KiessigAnalysisResult {
  periodQz: number;          // Kiessig fringe period Δqz in Å⁻¹
  periodTheta: number;       // Kiessig fringe period Δθ in degrees
  estimatedThickness: number;// Extracted total film thickness in Å
  peaks: { qz: number; theta: number; r: number }[];
  valleys: { qz: number; theta: number; r: number }[];
}

export interface CriticalAngleResult {
  thetaCritDeg: number;      // Critical angle θc in degrees
  qzCrit: number;            // Critical momentum transfer qc in Å⁻¹
  densityEst: number;        // Estimated surface/substrate mass density (g/cm³)
}

// Built-in Material Library with optical parameters at Cu K-alpha (1.5406 Å)
export const MATERIAL_PRESETS: XRRMaterialPreset[] = [
  { name: 'Silicon (Si)', density: 2.33, delta: 7.56, beta: 0.173, category: 'Substrates', color: '#3b82f6' },
  { name: 'Quartz / SiO2', density: 2.20, delta: 7.15, beta: 0.155, category: 'Oxides', color: '#06b6d4' },
  { name: 'Sapphire / Al2O3', density: 3.98, delta: 12.8, beta: 0.298, category: 'Substrates', color: '#38bdf8' },
  { name: 'SrTiO3 (STO Substrate)', density: 5.12, delta: 15.6, beta: 1.120, category: 'Substrates', color: '#818cf8' },
  { name: 'MgO Substrate', density: 3.58, delta: 11.4, beta: 0.210, category: 'Substrates', color: '#a7f3d0' },
  { name: 'Germanium (Ge)', density: 5.32, delta: 14.8, beta: 1.620, category: 'Semiconductors', color: '#6366f1' },
  { name: 'Gallium Arsenide (GaAs)', density: 5.32, delta: 14.2, beta: 1.480, category: 'Semiconductors', color: '#8b5cf6' },
  { name: 'Silicon Carbide (3C-SiC)', density: 3.21, delta: 10.1, beta: 0.190, category: 'Semiconductors', color: '#c084fc' },
  { name: 'Titanium Dioxide (TiO2)', density: 4.23, delta: 13.9, beta: 0.520, category: 'Oxides', color: '#10b981' },
  { name: 'Hafnium Oxide (HfO2)', density: 9.68, delta: 28.5, beta: 3.820, category: 'Oxides', color: '#f59e0b' },
  { name: 'Aluminum Oxide (Al2O3)', density: 3.95, delta: 12.7, beta: 0.290, category: 'Oxides', color: '#14b8a6' },
  { name: 'Tantalum Pentoxide (Ta2O5)', density: 8.20, delta: 25.1, beta: 2.950, category: 'Oxides', color: '#eab308' },
  { name: 'Zirconium Dioxide (ZrO2)', density: 5.68, delta: 17.8, beta: 1.250, category: 'Oxides', color: '#f97316' },
  { name: 'Gold (Au)', density: 19.30, delta: 46.8, beta: 4.780, category: 'Metals', color: '#eab308' },
  { name: 'Platinum (Pt)', density: 21.45, delta: 50.1, beta: 5.210, category: 'Metals', color: '#94a3b8' },
  { name: 'Tungsten (W)', density: 19.25, delta: 45.6, beta: 4.120, category: 'Metals', color: '#475569' },
  { name: 'Ruthenium (Ru)', density: 12.45, delta: 31.2, beta: 2.850, category: 'Metals', color: '#64748b' },
  { name: 'Titanium (Ti)', density: 4.51, delta: 14.1, beta: 0.810, category: 'Metals', color: '#64748b' },
  { name: 'Copper (Cu)', density: 8.96, delta: 23.8, beta: 2.150, category: 'Metals', color: '#f97316' },
  { name: 'Nickel (Ni)', density: 8.91, delta: 24.2, beta: 2.210, category: 'Metals', color: '#a855f7' },
  { name: 'Iron (Fe)', density: 7.87, delta: 22.4, beta: 2.450, category: 'Metals', color: '#ef4444' },
  { name: 'Molybdenum (Mo)', density: 10.22, delta: 27.8, beta: 1.950, category: 'Metals', color: '#ec4899' },
  { name: 'Silver (Ag)', density: 10.49, delta: 28.1, beta: 2.340, category: 'Metals', color: '#cbd5e1' },
  { name: 'Polymer (PMMA/Organic)', density: 1.18, delta: 3.85, beta: 0.082, category: 'Organics', color: '#84cc16' },
  { name: 'Perovskite (CsPbBr3)', density: 4.55, delta: 14.9, beta: 1.850, category: 'Organics', color: '#facc15' },
  { name: 'Air / Vacuum', density: 0.00, delta: 0.00, beta: 0.000, category: 'Organics', color: '#94a3b8' },
];

// Complex Number Operations for Parratt Matrix Math
interface Complex {
  re: number;
  im: number;
}

function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

function cDiv(a: Complex, b: Complex): Complex {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) return { re: 0, im: 0 };
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom
  };
}

function cSqrt(z: Complex): Complex {
  const r = Math.sqrt(Math.sqrt(z.re * z.re + z.im * z.im));
  const phi = Math.atan2(z.im, z.re);
  return {
    re: r * Math.cos(phi / 2),
    im: r * Math.sin(phi / 2)
  };
}

function cExp(z: Complex): Complex {
  const scale = Math.exp(z.re);
  return {
    re: scale * Math.cos(z.im),
    im: scale * Math.sin(z.im)
  };
}

function cAbs2(z: Complex): number {
  return z.re * z.re + z.im * z.im;
}

// Error Function Approximation for SLD Interface Profiles
function erf(x: number): number {
  // Abramowitz and Stegun formula 7.1.26
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Parratt Specular Reflectivity Calculation
 * Calculates theoretical reflectivity curve R(θ) for a given multilayer stack using Parratt's recursion formula
 * with Névot-Croce roughness attenuation factor.
 */
export function calculateReflectivityCurve(
  layers: XRRLayer[],
  config: XRRSimulationConfig,
  expData?: { angle: number; intensity: number }[]
): XRRDataPoint[] {
  if (layers.length === 0) return [];

  const {
    wavelength,
    angleStart,
    angleEnd,
    angleStep,
    beamDivergence,
    background,
    roughnessModel,
    angleOffset = 0,
    intensityScale = 1.0,
    footprintCorrection = false,
    sampleLengthMm = 20,
    beamWidthMm = 0.2
  } = config;
  const numSteps = Math.max(10, Math.floor((angleEnd - angleStart) / angleStep) + 1);

  // Expand layers with grading/interdiffusion or density gradients if configured
  const processedLayers: XRRLayer[] = [];
  for (const l of layers) {
    if (l.gradientType && l.gradientType !== 'none' && l.gradientDeltaDensity && l.thickness > 10) {
      // Sub-slice layer with continuous density profile into 5 thin slabs
      const numSlices = 5;
      const subThick = l.thickness / numSlices;
      for (let s = 0; s < numSlices; s++) {
        const normZ = (s + 0.5) / numSlices; // 0 to 1 depth fraction
        let factor = 0;
        if (l.gradientType === 'linear') {
          factor = (normZ - 0.5) * l.gradientDeltaDensity;
        } else if (l.gradientType === 'exponential') {
          factor = (Math.exp(normZ) - 1.718) * l.gradientDeltaDensity;
        } else if (l.gradientType === 'sigmoidal') {
          factor = (1 / (1 + Math.exp(-6 * (normZ - 0.5))) - 0.5) * l.gradientDeltaDensity;
        }

        const slabDensity = Math.max(0.1, l.density + factor);
        const ratio = slabDensity / (l.density || 1);
        processedLayers.push({
          ...l,
          id: `${l.id}-grad-${s}`,
          name: `${l.name} (Slab ${s + 1})`,
          thickness: subThick,
          density: slabDensity,
          delta: Math.max(0, l.delta * ratio),
          beta: Math.max(0, l.beta * ratio),
          roughness: s === 0 ? l.roughness : Math.max(0.8, l.roughness * 0.7)
        });
      }
    } else if (l.gradingThickness && l.gradingThickness > 0 && l.thickness > l.gradingThickness) {
      // Sub-slice interdiffusion zone into 3 graded sub-layers
      const bulkThick = l.thickness - l.gradingThickness;
      processedLayers.push({ ...l, thickness: bulkThick });
      const subThick = l.gradingThickness / 3;
      for (let s = 1; s <= 3; s++) {
        const factor = 1 - (s * 0.15);
        processedLayers.push({
          ...l,
          id: `${l.id}-grad-${s}`,
          name: `${l.name} (Graded ${s})`,
          thickness: subThick,
          density: l.density * factor,
          delta: l.delta * factor,
          beta: l.beta * factor,
          roughness: Math.max(1, l.roughness * 0.8)
        });
      }
    } else {
      processedLayers.push(l);
    }
  }

  // Full stack including Ambient (index 0) and Substrate (index N+1)
  const ambientLayer: XRRLayer = {
    id: 'ambient',
    name: 'Air/Ambient',
    thickness: 0,
    roughness: processedLayers[0]?.roughness || 0,
    density: 0,
    delta: 0,
    beta: 0
  };

  // Stack array: [ambient, ...films, substrate]
  const fullStack = [ambientLayer, ...processedLayers];
  const numLayers = fullStack.length; // N = fullStack.length - 1

  const rawPoints: XRRDataPoint[] = [];

  for (let i = 0; i < numSteps; i++) {
    const rawThetaDeg = angleStart + i * angleStep;
    const thetaDeg = rawThetaDeg + angleOffset; // Apply angular zero-point offset correction
    const thetaRad = (Math.max(0.001, thetaDeg) * Math.PI) / 180;
    const twoThetaDeg = thetaDeg * 2;
    const qz = (4 * Math.PI * Math.sin(thetaRad)) / wavelength;

    // Calculate perpendicular wavevector component kz for each layer
    // kz_j = (2π / λ) * sqrt(sin^2(θ) - 2δ_j - 2iβ_j)
    const sin2Theta = Math.sin(thetaRad) * Math.sin(thetaRad);
    const k0 = (2 * Math.PI) / wavelength;

    const kzLayers: Complex[] = [];
    for (let j = 0; j < numLayers; j++) {
      const deltaVal = fullStack[j].delta * 1e-6;
      const betaVal = fullStack[j].beta * 1e-7;

      // Radicand = sin^2(θ) - 2δ - 2iβ
      const radicand: Complex = {
        re: sin2Theta - 2 * deltaVal,
        im: -2 * betaVal
      };

      const sqrtRad = cSqrt(radicand);
      kzLayers.push({
        re: k0 * sqrtRad.re,
        im: k0 * sqrtRad.im
      });
    }

    // Parratt Recursion from bottom substrate (index numLayers - 1) up to ambient (index 0)
    let R_next: Complex = { re: 0, im: 0 };

    for (let j = numLayers - 2; j >= 0; j--) {
      const kz_j = kzLayers[j];
      const kz_next = kzLayers[j + 1];
      const sigma = fullStack[j + 1].roughness; // Interface roughness

      // Fresnel reflection coefficient: r_j,j+1 = (kz_j - kz_j+1) / (kz_j + kz_j+1)
      const numR = cSub(kz_j, kz_next);
      const denR = cAdd(kz_j, kz_next);
      let r_fresnel = cDiv(numR, denR);

      // Interface Roughness Damping Model (Névot-Croce vs Debye-Waller)
      const isDebyeWaller = roughnessModel === 'debye-waller';
      const roughExpTerm = isDebyeWaller ? cMul(kz_j, kz_j) : cMul(kz_j, kz_next);
      const roughExponent: Complex = {
        re: -2 * roughExpTerm.re * sigma * sigma,
        im: -2 * roughExpTerm.im * sigma * sigma
      };
      const roughDamping = cExp(roughExponent);

      // Rough Fresnel coefficient r_rough = r_fresnel * roughDamping
      const r_rough = cMul(r_fresnel, roughDamping);

      // Layer phase shift term for layer j+1 (if j+1 is not substrate)
      let phaseFactor: Complex = { re: 1, im: 0 };
      if (j + 1 < numLayers - 1) {
        const d_layer = fullStack[j + 1].thickness;
        const phaseExp: Complex = {
          re: -2 * kz_next.im * d_layer,
          im: 2 * kz_next.re * d_layer
        };
        phaseFactor = cExp(phaseExp);
      }

      // Parratt iteration
      const R_phase = cMul(R_next, phaseFactor);
      const topTerm = cAdd(r_rough, R_phase);
      const bottomTerm = cAdd({ re: 1, im: 0 }, cMul(r_rough, R_phase));

      R_next = cDiv(topTerm, bottomTerm);
    }

    // Beam Footprint Correction Factor F(θ) = min(1, (L * sinθ) / w)
    let footprintFactor = 1.0;
    if (footprintCorrection && sampleLengthMm > 0 && beamWidthMm > 0) {
      footprintFactor = Math.min(1.0, (sampleLengthMm * Math.sin(thetaRad)) / beamWidthMm);
      footprintFactor = Math.max(0.01, footprintFactor);
    }

    // Reflectivity = |R_0|^2 * intensityScale * footprintFactor
    let rIntensity = cAbs2(R_next) * intensityScale * footprintFactor;

    // Apply Background Noise Floor
    rIntensity = Math.max(rIntensity, background);

    // Ideal Fresnel Reflectivity for Substrate alone
    const kz0 = kzLayers[0];
    const kzSub = kzLayers[numLayers - 1];
    const numSub = cSub(kz0, kzSub);
    const denSub = cAdd(kz0, kzSub);
    const fresnelSub = cAbs2(cDiv(numSub, denSub)) * intensityScale * footprintFactor;

    rawPoints.push({
      theta: rawThetaDeg,
      twoTheta: rawThetaDeg * 2,
      qz: qz,
      rCalc: rIntensity,
      fresnelR: Math.max(fresnelSub, background),
      footprintFactor: footprintFactor
    });
  }

  // Beam Divergence Convolution (Gaussian Smoothing over Angle)
  let finalPoints = rawPoints;
  if (beamDivergence > 0.001) {
    finalPoints = applyBeamDivergenceConvolution(rawPoints, beamDivergence, angleStep);
  }

  // Attach experimental data points if provided
  if (expData && expData.length > 0) {
    finalPoints = alignExperimentalData(finalPoints, expData, config.angleUnit);
  }

  return finalPoints;
}

/**
 * Beam Divergence Convolution
 * Applies Gaussian instrumental broadening to reflectivity curve
 */
function applyBeamDivergenceConvolution(
  points: XRRDataPoint[],
  divergenceDeg: number,
  stepDeg: number
): XRRDataPoint[] {
  const sigmaDeg = divergenceDeg / (2 * Math.sqrt(2 * Math.log(2)));
  const kernelHalfWidth = Math.min(15, Math.ceil((3 * sigmaDeg) / stepDeg));

  if (kernelHalfWidth <= 0) return points;

  const result: XRRDataPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    let sumIntensity = 0;
    let sumWeight = 0;

    for (let k = -kernelHalfWidth; k <= kernelHalfWidth; k++) {
      const idx = i + k;
      if (idx >= 0 && idx < points.length) {
        const deltaAngle = k * stepDeg;
        const weight = Math.exp(-(deltaAngle * deltaAngle) / (2 * sigmaDeg * sigmaDeg));
        sumIntensity += points[idx].rCalc * weight;
        sumWeight += weight;
      }
    }

    const smoothedCalc = sumWeight > 0 ? sumIntensity / sumWeight : points[i].rCalc;
    result.push({
      ...points[i],
      rCalc: smoothedCalc
    });
  }

  return result;
}

/**
 * Aligns experimental curve onto calculation dataset
 */
function alignExperimentalData(
  calcPoints: XRRDataPoint[],
  expData: { angle: number; intensity: number }[],
  unit: 'theta' | 'twoTheta' | 'qz'
): XRRDataPoint[] {
  return calcPoints.map(pt => {
    let targetX = pt.theta;
    if (unit === 'twoTheta') targetX = pt.twoTheta;
    if (unit === 'qz') targetX = pt.qz;

    // Find nearest experimental point
    let closestExp = expData[0];
    let minDiff = Math.abs(expData[0].angle - targetX);

    for (let j = 1; j < expData.length; j++) {
      const diff = Math.abs(expData[j].angle - targetX);
      if (diff < minDiff) {
        minDiff = diff;
        closestExp = expData[j];
      }
    }

    // Only assign if close enough within step range
    const threshold = 0.05;
    return {
      ...pt,
      rExp: minDiff < threshold ? closestExp.intensity : undefined
    };
  });
}

/**
 * Calculates Scattering Length Density (SLD) / Real-Space Depth Profile z
 */
export function calculateSLDProfile(layers: XRRLayer[], numDepthPoints: number = 300): SLDPoint[] {
  if (layers.length === 0) return [];

  // Total thickness of thin films
  const filmThickness = layers.slice(0, -1).reduce((acc, l) => acc + l.thickness, 0);
  const substrateThickness = 100; // Å padding for substrate
  const ambientPadding = 50;      // Å padding for air above top surface

  const totalDepth = ambientPadding + filmThickness + substrateThickness;
  const zStep = totalDepth / numDepthPoints;

  const result: SLDPoint[] = [];

  // Stack interfaces z positions
  // Surface at z = ambientPadding
  const interfaces: { zPos: number; roughness: number; layerAbove: XRRLayer; layerBelow: XRRLayer }[] = [];

  const ambientLayer: XRRLayer = {
    id: 'air',
    name: 'Air/Ambient',
    thickness: ambientPadding,
    roughness: layers[0]?.roughness || 3,
    density: 0,
    delta: 0,
    beta: 0
  };

  const stack = [ambientLayer, ...layers];

  let currentZ = ambientPadding;
  for (let i = 0; i < stack.length - 1; i++) {
    interfaces.push({
      zPos: currentZ,
      roughness: Math.max(0.5, stack[i + 1].roughness),
      layerAbove: stack[i],
      layerBelow: stack[i + 1]
    });
    if (i < stack.length - 2) {
      currentZ += stack[i + 1].thickness;
    }
  }

  for (let i = 0; i <= numDepthPoints; i++) {
    const z = i * zStep;

    // Calculate smooth error function transition across interfaces
    let currentDensity = 0;
    let currentDelta = 0;
    let currentBeta = 0;
    let activeLayerName = stack[0].name;

    // Find local dominant layer
    for (let s = 0; s < stack.length; s++) {
      let startZ = 0;
      let endZ = totalDepth;

      if (s === 0) {
        endZ = ambientPadding;
      } else if (s === stack.length - 1) {
        startZ = ambientPadding + filmThickness;
      } else {
        startZ = ambientPadding + stack.slice(1, s).reduce((sum, l) => sum + l.thickness, 0);
        endZ = startZ + stack[s].thickness;
      }

      if (z >= startZ && z < endZ) {
        activeLayerName = stack[s].name;
      }
    }

    // Sum error function contributions for each interface
    currentDensity = stack[0].density;
    currentDelta = stack[0].delta;
    currentBeta = stack[0].beta;

    for (const interf of interfaces) {
      const stepFactor = 0.5 * (1 + erf((z - interf.zPos) / (Math.SQRT2 * interf.roughness)));
      currentDensity += (interf.layerBelow.density - interf.layerAbove.density) * stepFactor;
      currentDelta += (interf.layerBelow.delta - interf.layerAbove.delta) * stepFactor;
      currentBeta += (interf.layerBelow.beta - interf.layerAbove.beta) * stepFactor;
    }

    // Electron density approximation: ρ_e ≈ 0.3 * ρ (e⁻/Å³) for typical light elements
    const electronDensity = 0.28 * currentDensity;

    result.push({
      z: z - ambientPadding, // Shift surface z = 0
      density: Math.max(0, currentDensity),
      delta: Math.max(0, currentDelta),
      beta: Math.max(0, currentBeta),
      electronDensity: Math.max(0, electronDensity),
      layerName: activeLayerName
    });
  }

  return result;
}

/**
 * Analyzes Kiessig Fringes to extract film thickness
 */
export function analyzeKiessigFringes(
  dataPoints: XRRDataPoint[],
  wavelength: number
): KiessigAnalysisResult | null {
  if (dataPoints.length < 20) return null;

  // Compensation for Fresnel qz^-4 decay: Intensity * qz^4
  const compensated = dataPoints.map(pt => ({
    qz: pt.qz,
    theta: pt.theta,
    val: pt.rCalc * Math.pow(pt.qz, 4)
  }));

  // Find local maxima and minima above critical angle
  const peaks: { qz: number; theta: number; r: number }[] = [];
  const valleys: { qz: number; theta: number; r: number }[] = [];

  for (let i = 2; i < compensated.length - 2; i++) {
    const prev2 = compensated[i - 2].val;
    const prev1 = compensated[i - 1].val;
    const curr = compensated[i].val;
    const next1 = compensated[i + 1].val;
    const next2 = compensated[i + 2].val;

    if (curr > prev1 && curr > prev2 && curr > next1 && curr > next2 && dataPoints[i].theta > 0.3) {
      peaks.push({ qz: dataPoints[i].qz, theta: dataPoints[i].theta, r: dataPoints[i].rCalc });
    } else if (curr < prev1 && curr < prev2 && curr < next1 && curr < next2 && dataPoints[i].theta > 0.3) {
      valleys.push({ qz: dataPoints[i].qz, theta: dataPoints[i].theta, r: dataPoints[i].rCalc });
    }
  }

  if (peaks.length < 2) return null;

  // Calculate average peak-to-peak distance Δqz
  let sumDeltaQz = 0;
  for (let i = 1; i < peaks.length; i++) {
    sumDeltaQz += (peaks[i].qz - peaks[i - 1].qz);
  }
  const avgDeltaQz = sumDeltaQz / (peaks.length - 1);

  // Thickness d = 2π / Δqz
  const estimatedThickness = (2 * Math.PI) / avgDeltaQz;

  // Δθ period
  let sumDeltaTheta = 0;
  for (let i = 1; i < peaks.length; i++) {
    sumDeltaTheta += (peaks[i].theta - peaks[i - 1].theta);
  }
  const avgDeltaTheta = sumDeltaTheta / (peaks.length - 1);

  return {
    periodQz: avgDeltaQz,
    periodTheta: avgDeltaTheta,
    estimatedThickness: Math.round(estimatedThickness * 10) / 10,
    peaks,
    valleys
  };
}

/**
 * Detects Critical Angle θc and estimates surface density
 */
export function detectCriticalAngle(dataPoints: XRRDataPoint[]): CriticalAngleResult | null {
  if (dataPoints.length < 10) return null;

  // Critical angle corresponds to drop in reflectivity (where R = 0.5) or max slope dR/dθ
  let maxSlopeIdx = 0;
  let maxSlope = 0;

  for (let i = 1; i < dataPoints.length - 1; i++) {
    const slope = Math.abs(dataPoints[i + 1].rCalc - dataPoints[i - 1].rCalc) / (dataPoints[i + 1].theta - dataPoints[i - 1].theta);
    if (slope > maxSlope && dataPoints[i].theta < 1.0) {
      maxSlope = slope;
      maxSlopeIdx = i;
    }
  }

  const critPoint = dataPoints[maxSlopeIdx];
  if (!critPoint) return null;

  // Critical angle formula: θc (rad) ≈ sqrt(2δ)
  // δ ≈ (θc_rad)^2 / 2
  const thetaCritRad = (critPoint.theta * Math.PI) / 180;
  const deltaEst = 0.5 * thetaCritRad * thetaCritRad;

  // Estimate mass density ρ ≈ deltaEst / (3.24e-6) for Si/oxide scale
  const densityEst = Math.min(22, Math.max(1, deltaEst / 3.24e-6));

  return {
    thetaCritDeg: Math.round(critPoint.theta * 1000) / 1000,
    qzCrit: Math.round(critPoint.qz * 10000) / 10000,
    densityEst: Math.round(densityEst * 100) / 100
  };
}

/**
 * Calculates Goodness-of-Fit metrics between experimental and calculated curves
 */
export function calculateFitQuality(
  points: XRRDataPoint[]
): { logRmse: number; rwp: number } {
  const valid = points.filter(p => p.rExp !== undefined && p.rExp > 0 && p.rCalc > 0);
  if (valid.length === 0) return { logRmse: 0, rwp: 0 };

  let sumLogSq = 0;
  let sumDiffSq = 0;
  let sumExpSq = 0;

  for (const p of valid) {
    const logCalc = Math.log10(p.rCalc);
    const logExp = Math.log10(p.rExp!);

    sumLogSq += (logCalc - logExp) * (logCalc - logExp);
    sumDiffSq += (p.rCalc - p.rExp!) * (p.rCalc - p.rExp!);
    sumExpSq += p.rExp! * p.rExp!;
  }

  const logRmse = Math.sqrt(sumLogSq / valid.length);
  const rwp = Math.sqrt(sumDiffSq / (sumExpSq || 1)) * 100;

  return {
    logRmse: Math.round(logRmse * 10000) / 10000,
    rwp: Math.round(rwp * 100) / 100
  };
}

/**
 * Generates automated Python script for XRR analysis with Refnx / SciPy
 */
export function generatePythonXRRScript(layers: XRRLayer[], config: XRRSimulationConfig): string {
  const filmCode = layers.slice(0, -1).map((l, idx) => `
# Layer ${idx + 1}: ${l.name}
layer_${idx + 1} = refnx.reflect.SLD(${l.delta * 1e-2} + ${l.beta * 1e-2}j, name='${l.name}')(${l.thickness}, ${l.roughness})
`).join('');

  const subLayer = layers[layers.length - 1];

  return `import numpy as np
import matplotlib.pyplot as plt

# X-Ray Reflectometry (XRR) Simulation & Parratt Fitting Script
# Generated by XRD-Calc Pro • Quantum Crystallography Labs

try:
    import refnx.reflect
    HAS_REFNX = True
except ImportError:
    HAS_REFNX = False

wavelength = ${config.wavelength}  # Å (Cu K-alpha)
angles = np.linspace(${config.angleStart}, ${config.angleEnd}, 500)  # degrees
qz = (4 * np.pi * np.sin(np.radians(angles))) / wavelength

print(f"XRR Simulation Range: {angles[0]:.2f}° to {angles[-1]:.2f}° 2θ / θ")
print("Structure:")
${layers.map((l, i) => `print(f"  [${i + 1}] ${l.name}: Thickness = ${l.thickness} Å, Roughness = ${l.roughness} Å, Density = ${l.density} g/cm³")`).join('\n')}

if HAS_REFNX:
    print("\nRunning refnx optical reflectometry model...")
    # Ambient
    air = refnx.reflect.SLD(0, name='Air')
    # Substrate
    substrate = refnx.reflect.SLD(${subLayer ? subLayer.delta * 1e-2 : 7.56} + ${subLayer ? subLayer.beta * 1e-2 : 0.17}j, name='${subLayer ? subLayer.name : 'Substrate'}')(0, ${subLayer ? subLayer.roughness : 3.0})
    ${filmCode}
    # Assemble Structure
    structure = air | ${layers.slice(0, -1).map((_, i) => `layer_${i + 1}`).join(' | ')} | substrate
    model = refnx.reflect.ReflectModel(structure, bkg=${config.background}, dq=${config.beamDivergence})
    
    reflectivity = model(qz)
    
    plt.figure(figsize=(8, 5))
    plt.semilogy(angles, reflectivity, 'b-', label='Parratt Model (Refnx)', lw=2)
    plt.xlabel('Incident Angle θ (°)')
    plt.ylabel('Reflectivity R')
    plt.title('XRR Reflectivity Curve')
    plt.grid(True, which='both', ls='--', alpha=0.5)
    plt.legend()
    plt.tight_layout()
    plt.show()
else:
    print("\nNote: Install 'refnx' using 'pip install refnx' for advanced fitting.")
`;
}

export interface SuperlatticePeak {
  order: number;            // Satellite peak order m (+1, +2, +3...)
  thetaDeg: number;         // Calculated Bragg angle θ in degrees
  twoThetaDeg: number;      // Calculated 2θ in degrees
  qz: number;               // Momentum transfer qz in Å⁻¹
  label: string;            // Peak tag (e.g. SL-1, SL-2)
}

/**
 * Superlattice Satellite Bragg Peak Analysis
 * Calculates expected Bragg angles for periodic multilayer superlattices
 */
export function calculateSuperlatticeBraggPeaks(
  layers: XRRLayer[],
  config: XRRSimulationConfig
): { period: number; peaks: SuperlatticePeak[] } | null {
  if (layers.length < 3) return null;

  const films = layers.slice(0, -1);
  if (films.length < 2) return null;

  // Calculate bilayer period (sum of adjacent film thicknesses)
  let period = films[0].thickness + films[1].thickness;
  if (period <= 10) return null;

  const peaks: SuperlatticePeak[] = [];
  const wavelength = config.wavelength;

  // Average delta for refraction correction
  const avgDelta = films.reduce((sum, f) => sum + f.delta * (f.thickness / period), 0) * 1e-6;

  for (let m = 1; m <= 8; m++) {
    // Kinematic approximation: sin(θ_m) ≈ m * λ / (2 * Λ)
    const sinThetaApprox = (m * wavelength) / (2 * period);
    if (sinThetaApprox >= 0.99) break;

    // Refraction corrected angle: sin²(θ_m) = (m λ / 2 Λ)² + 2δ_avg
    const sinThetaCorr = Math.sqrt(sinThetaApprox * sinThetaApprox + 2 * avgDelta);
    if (sinThetaCorr >= 0.99) break;

    const thetaRad = Math.asin(sinThetaCorr);
    const thetaDeg = (thetaRad * 180) / Math.PI;
    const qz = (4 * Math.PI * Math.sin(thetaRad)) / wavelength;

    if (thetaDeg >= config.angleStart && thetaDeg <= config.angleEnd) {
      peaks.push({
        order: m,
        thetaDeg: Math.round(thetaDeg * 1000) / 1000,
        twoThetaDeg: Math.round(thetaDeg * 2 * 1000) / 1000,
        qz: Math.round(qz * 10000) / 10000,
        label: `SL-${m}`
      });
    }
  }

  return { period: Math.round(period * 10) / 10, peaks };
}

/**
 * Estimates optical constants delta (×10⁻⁶) and beta (×10⁻⁷)
 * based on mass density ρ (g/cm³) and wavelength λ (Å)
 */
export function estimateOpticalConstantsFromFormula(
  density: number,
  wavelength: number = 1.5406
): { delta: number; beta: number } {
  // Classical electron radius r_e = 2.818e-15 m = 2.818e-5 Å
  // δ ≈ (r_e * λ² / 2π) * ρ_e
  // Scaling relative to Cu K-alpha (1.5406 Å)
  const wlFactor = (wavelength / 1.5406) * (wavelength / 1.5406);
  const delta = Math.round(3.24 * density * wlFactor * 100) / 100;
  const beta = Math.round(0.075 * density * wlFactor * 1000) / 1000;
  return { delta, beta };
}

/**
 * Monte Carlo Sensitivity Analysis
 * Runs N randomized parameter perturbations to compute 95% confidence limits
 */
export function calculateMonteCarloConfidenceEnvelope(
  layers: XRRLayer[],
  config: XRRSimulationConfig,
  variationPercent: number = 5.0,
  numSimulations: number = 30
): XRRDataPoint[] {
  const baseCurve = calculateReflectivityCurve(layers, config);
  if (baseCurve.length === 0) return [];

  const allCurves: number[][] = [];

  for (let s = 0; s < numSimulations; s++) {
    const perturbedLayers = layers.map(l => {
      if (l.thickness === 0) return l; // Substrate
      const pThick = Math.max(5, l.thickness * (1 + (Math.random() - 0.5) * 2 * (variationPercent / 100)));
      const pRough = Math.max(0.2, l.roughness * (1 + (Math.random() - 0.5) * 2 * (variationPercent / 100)));
      const pDens = Math.max(0.1, l.density * (1 + (Math.random() - 0.5) * 2 * (variationPercent / 100)));
      const ratio = pDens / (l.density || 1);
      return {
        ...l,
        thickness: pThick,
        roughness: pRough,
        density: pDens,
        delta: Math.max(0, l.delta * ratio),
        beta: Math.max(0, l.beta * ratio)
      };
    });

    const sim = calculateReflectivityCurve(perturbedLayers, config);
    allCurves.push(sim.map(pt => pt.rCalc));
  }

  // Calculate 5th and 95th percentiles for each angle point
  return baseCurve.map((pt, i) => {
    const valsAtIndex = allCurves.map(c => c[i] || pt.rCalc).sort((a, b) => a - b);
    const minIdx = Math.floor(valsAtIndex.length * 0.05);
    const maxIdx = Math.floor(valsAtIndex.length * 0.95);
    return {
      ...pt,
      rCalcMin: valsAtIndex[minIdx] ?? pt.rCalc,
      rCalcMax: valsAtIndex[maxIdx] ?? pt.rCalc
    };
  });
}
