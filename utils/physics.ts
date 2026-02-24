import { BraggResult, CrystalSystem, SelectionRuleResult, ScherrerInput, ScherrerResult, WHResult, WHPoint, IntegralBreadthInput, IntegralBreadthResult, IBAdvancedInput, IBAdvancedResult, WAInputPoint, WAResult, RietveldSetupInput, RietveldSetupResult, NeutronAtom, NeutronResult, MagneticAtom, MagneticResult, DLPhaseResult, DLPhaseCandidate, FWHMResult } from '../types';

export const calculateBragg = (wavelength: number, twoTheta: number): BraggResult | null => {
  if (wavelength <= 0 || twoTheta <= 0 || twoTheta >= 180) return null;
  const thetaRad = (twoTheta / 2) * (Math.PI / 180);
  const sinTheta = Math.sin(thetaRad);
  if (sinTheta === 0) return null;
  const dSpacing = wavelength / (2 * sinTheta);
  const qVector = (4 * Math.PI * sinTheta) / wavelength;
  const sinThetaOverLambda = sinTheta / wavelength;
  return { twoTheta, dSpacing, qVector, sinThetaOverLambda };
};

// Line Profile Simulation
export const simulatePeak = (
  type: 'Gaussian' | 'Lorentzian' | 'Pseudo-Voigt',
  center: number,
  fwhm: number,
  eta: number, // Mixing factor for Pseudo-Voigt
  amplitude: number,
  range: [number, number],
  steps: number = 200
) => {
  const points = [];
  const start = range[0];
  const end = range[1];
  const stepSize = (end - start) / steps;

  // HWHM = Half Width at Half Maximum
  const gamma = fwhm / 2;
  // Gaussian sigma
  const sigma = fwhm / (2 * Math.sqrt(2 * Math.log(2)));

  for (let i = 0; i <= steps; i++) {
    const x = start + i * stepSize;
    let y = 0;

    if (type === 'Gaussian' || type === 'Pseudo-Voigt') {
      const g = amplitude * Math.exp(-0.5 * Math.pow((x - center) / sigma, 2));
      if (type === 'Gaussian') y = g;
      else y += (1 - eta) * g;
    }

    if (type === 'Lorentzian' || type === 'Pseudo-Voigt') {
      const l = amplitude * (Math.pow(gamma, 2) / (Math.pow(x - center, 2) + Math.pow(gamma, 2)));
      if (type === 'Lorentzian') y = l;
      else y += eta * l;
    }

    points.push({ x, y });
  }

  // Calculate Integral Breadth Area
  // Area_G = amplitude * sigma * sqrt(2*PI)
  // Area_L = amplitude * PI * gamma
  const areaG = amplitude * sigma * Math.sqrt(2 * Math.PI);
  const areaL = amplitude * Math.PI * gamma;
  
  let totalArea = 0;
  if (type === 'Gaussian') totalArea = areaG;
  else if (type === 'Lorentzian') totalArea = areaL;
  else totalArea = (1 - eta) * areaG + eta * areaL;

  const integralBreadth = totalArea / amplitude;
  const shapeFactor = fwhm / integralBreadth;

  const resultStats: FWHMResult = {
    fwhm,
    integralBreadth,
    shapeFactor,
    area: totalArea,
    maxIntensity: amplitude
  };

  return { points, stats: resultStats };
};

export const parsePeakString = (input: string): number[] => {
  return input
    .split(/[\s,]+/)
    .map(s => parseFloat(s))
    .filter(n => !isNaN(n) && n > 0 && n < 180)
    .sort((a, b) => a - b);
};

export const parseHKLString = (input: string): [number, number, number][] => {
  const numbers = input.match(/-?\d+/g);
  if (!numbers) return [];
  const ints = numbers.map(n => parseInt(n, 10));
  const result: [number, number, number][] = [];
  for (let i = 0; i < ints.length; i += 3) {
    if (i + 2 < ints.length) result.push([ints[i], ints[i+1], ints[i+2]]);
  }
  return result;
};

export const validateSelectionRule = (system: CrystalSystem, hkl: [number, number, number]): SelectionRuleResult => {
  const [h, k, l] = hkl;
  const sum = h + k + l;
  const ah = Math.abs(h);
  const ak = Math.abs(k);
  const al = Math.abs(l);

  switch (system) {
    case 'SC':
    case 'Cubic':
      return { hkl, status: 'Allowed', reason: 'Simple Cubic allows all reflections' };
    case 'BCC':
      return sum % 2 === 0 
        ? { hkl, status: 'Allowed', reason: 'Sum is even' }
        : { hkl, status: 'Forbidden', reason: 'Sum is odd (h+k+l must be even)' };
    case 'FCC':
      const isAllEven = (ah % 2 === 0) && (ak % 2 === 0) && (al % 2 === 0);
      const isAllOdd = (ah % 2 !== 0) && (ak % 2 !== 0) && (al % 2 !== 0);
      return (isAllEven || isAllOdd)
        ? { hkl, status: 'Allowed', reason: 'Unmixed parity' }
        : { hkl, status: 'Forbidden', reason: 'Mixed parity' };
    case 'Diamond':
      const dIsAllEven = (ah % 2 === 0) && (ak % 2 === 0) && (al % 2 === 0);
      const dIsAllOdd = (ah % 2 !== 0) && (ak % 2 !== 0) && (al % 2 !== 0);
      if (!dIsAllEven && !dIsAllOdd) return { hkl, status: 'Forbidden', reason: 'Mixed parity' };
      if (dIsAllOdd) return { hkl, status: 'Allowed', reason: 'All odd allowed' };
      return sum % 4 === 0 
        ? { hkl, status: 'Allowed', reason: 'All even & sum divisible by 4' }
        : { hkl, status: 'Forbidden', reason: 'All even but sum not divisible by 4' };
    default:
      return { hkl, status: 'Allowed', reason: 'Complex system rules not implemented' };
  }
};

export const parseScherrerInput = (input: string): ScherrerInput[] => {
  const parts = input.replace(/\n/g, ',').split(/[\s,]+/).filter(s => s.trim() !== '');
  const numbers = parts.map(s => parseFloat(s)).filter(n => !isNaN(n));
  const results: ScherrerInput[] = [];
  for(let i=0; i<numbers.length; i+=2) {
    if (i+1 < numbers.length && numbers[i] > 0 && numbers[i] < 180 && numbers[i+1] > 0) {
      results.push({ twoTheta: numbers[i], fwhmObs: numbers[i+1] });
    }
  }
  return results;
};

export const calculateScherrer = (
  wavelength: number, 
  K: number, 
  instFwhm: number, 
  peak: ScherrerInput
): ScherrerResult | null => {
  if (wavelength <= 0) return null;
  const { twoTheta, fwhmObs } = peak;
  if (twoTheta <= 0 || twoTheta >= 180 || fwhmObs <= 0) return null;
  const thetaRad = (twoTheta / 2) * (Math.PI / 180);
  const betaObsRad = fwhmObs * (Math.PI / 180);
  const betaInstRad = instFwhm * (Math.PI / 180);

  // Enhancement: Use specific user-requested error message when broadening is non-physical
  if (betaObsRad <= betaInstRad) {
    return { 
      twoTheta, 
      fwhmObs, 
      betaCorrected: 0, 
      sizeNm: 0, 
      error: "Corrected FWHM is zero or negative, cannot calculate size for this peak." 
    };
  }

  const betaSq = Math.max(0, betaObsRad * betaObsRad - betaInstRad * betaInstRad);
  const betaSampleRad = Math.sqrt(betaSq);
  const betaCorrectedDeg = betaSampleRad * (180 / Math.PI);

  if (betaSampleRad === 0) {
    return { 
      twoTheta, 
      fwhmObs, 
      betaCorrected: 0, 
      sizeNm: 0, 
      error: "Zero physical broadening detected, size cannot be determined." 
    };
  }

  const cosTheta = Math.cos(thetaRad);
  if (Math.abs(cosTheta) < 1e-10) return null;
  const sizeNm = (K * wavelength) / (betaSampleRad * cosTheta) / 10;
  return { twoTheta, fwhmObs, betaCorrected: betaCorrectedDeg, sizeNm };
};

export const calculateWilliamsonHall = (wavelength: number, K: number, instFwhm: number, peaks: ScherrerInput[]): WHResult | null => {
  if (wavelength <= 0 || peaks.length < 2) return null;
  const points: WHPoint[] = [];
  for (const peak of peaks) {
    const { twoTheta, fwhmObs } = peak;
    const thetaRad = (twoTheta / 2) * (Math.PI / 180);
    const betaObsRad = fwhmObs * (Math.PI / 180);
    const betaInstRad = instFwhm * (Math.PI / 180);
    const betaSq = Math.max(0, betaObsRad * betaObsRad - betaInstRad * betaInstRad);
    const betaSampleRad = Math.sqrt(betaSq);
    if (betaSampleRad <= 0) continue;
    points.push({ x: 4 * Math.sin(thetaRad), y: betaSampleRad * Math.cos(thetaRad), twoTheta });
  }
  if (points.length < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x;
  }
  const n = points.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (const p of points) {
    const yPred = slope * p.x + intercept;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(p.y - yPred, 2);
  }
  return {
    strainPercent: slope * 100,
    sizeInterceptNm: intercept > 0 ? (K * wavelength) / intercept / 10 : 0,
    regression: { slope, intercept, rSquared: ssTot === 0 ? 0 : 1 - (ssRes / ssTot) },
    points
  };
};

export const parseIntegralBreadthInput = (input: string): IntegralBreadthInput[] => {
  const lines = input.split('\n').filter(l => l.trim() !== '');
  const results: IntegralBreadthInput[] = [];
  for (const line of lines) {
    const parts = line.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (parts.length >= 4 && parts[0] > 0 && parts[0] < 180) {
      results.push({ twoTheta: parts[0], fwhm: parts[1], area: parts[2], iMax: parts[3] });
    }
  }
  return results;
};

export const calculateIntegralBreadth = (wavelength: number, K: number, peak: IntegralBreadthInput): IntegralBreadthResult | null => {
  if (wavelength <= 0 || peak.iMax <= 0) return null;
  const { twoTheta, fwhm, area, iMax } = peak;
  const betaIbRad = (area / iMax) * (Math.PI / 180);
  if (betaIbRad <= 0) return null;
  const thetaRad = (twoTheta / 2) * (Math.PI / 180);
  const cosTheta = Math.cos(thetaRad);
  if (Math.abs(cosTheta) < 1e-10) return null;
  return {
    twoTheta, integralBreadthDeg: area/iMax, shapeFactorPhi: fwhm / (area/iMax),
    calcSizeNm: (K * wavelength) / (betaIbRad * cosTheta) / 10
  };
};

// IB Advanced Parsing and Calculation
export const parseIBAdvancedInput = (input: string): IBAdvancedInput[] => {
  const lines = input.split('\n').filter(l => l.trim() !== '');
  const results: IBAdvancedInput[] = [];
  for (const line of lines) {
    const parts = line.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
    // Check if at least 3 parts: 2theta, Area, Imax
    if (parts.length >= 3 && parts[0] > 0 && parts[0] < 180) {
      results.push({ twoTheta: parts[0], area: parts[1], iMax: parts[2] });
    }
  }
  return results;
};

export const calculateIBAdvanced = (
  wavelength: number,
  K: number,
  instBetaIB: number, // in degrees
  peaks: IBAdvancedInput[]
): IBAdvancedResult | null => {
  if (wavelength <= 0 || peaks.length < 2) return null;
  
  const points: { x: number; y: number; twoTheta: number; betaSample: number }[] = [];
  const betaInstRad = instBetaIB * (Math.PI / 180);

  for (const peak of peaks) {
    const { twoTheta, area, iMax } = peak;
    if (iMax === 0) continue;

    const betaObsRad = (area / iMax) * (Math.PI / 180);
    const thetaRad = (twoTheta / 2) * (Math.PI / 180);

    // Linear subtraction correction for Integral Breadth (Lorentzian assumption)
    // Beta_sample = Beta_obs - Beta_inst
    const betaSampleRad = Math.max(0, betaObsRad - betaInstRad);

    if (betaSampleRad <= 0) continue;

    // Standard W-H with IB: Y = beta * cos(theta), X = 4 * sin(theta)
    const y = betaSampleRad * Math.cos(thetaRad);
    const x = 4 * Math.sin(thetaRad);

    points.push({ x, y, twoTheta, betaSample: betaSampleRad * (180/Math.PI) });
  }

  if (points.length < 2) return null;

  // Linear Regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x;
  }
  const n = points.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (const p of points) {
    const yPred = slope * p.x + intercept;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(p.y - yPred, 2);
  }

  return {
    strainPercent: slope * 100, // Slope is Strain
    sizeInterceptNm: intercept > 0 ? (K * wavelength) / intercept / 10 : 0, // Intercept is K*lambda / D
    regression: { slope, intercept, rSquared: ssTot === 0 ? 0 : 1 - (ssRes / ssTot) },
    points
  };
};


export const parseWAInput = (input: string): WAInputPoint[] => {
  const lines = input.split('\n').filter(l => l.trim() !== '');
  const points: WAInputPoint[] = [];
  for (const line of lines) {
    const parts = line.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n));
    if (parts.length >= 3) points.push({ L_nm: parts[0], A1: parts[1], A2: parts[2] });
  }
  return points;
};

export const calculateWarrenAverbach = (d1: number, d2: number, points: WAInputPoint[]): WAResult => {
  const sizeDist = []; const strainDist = [];
  const x1 = 1 / (d1 * d1); const x2 = 1 / (d2 * d2); const dx = x2 - x1;
  if (Math.abs(dx) < 1e-9) return { sizeDistribution: [], strainDistribution: [] };
  for (const p of points) {
    if (p.A1 <= 0 || p.A2 <= 0) continue;
    const slope = (Math.log(p.A2) - Math.log(p.A1)) / dx;
    const intercept = Math.log(p.A1) - slope * x1;
    sizeDist.push({ L_nm: p.L_nm, A_size: Math.exp(intercept) });
    if (p.L_nm > 0) {
      const msStrain = slope / (-2 * Math.PI * Math.PI * p.L_nm * p.L_nm);
      strainDist.push({ L_nm: p.L_nm, rms_strain: msStrain > 0 ? Math.sqrt(msStrain) : 0 });
    } else strainDist.push({ L_nm: 0, rms_strain: 0 });
  }
  return { sizeDistribution: sizeDist, strainDistribution: strainDist };
};

export const generateRietveldSetup = (input: RietveldSetupInput): RietveldSetupResult => {
  const phases = input.phases.map(p => {
    const scaleGuess = input.maxObsIntensity > 0 ? input.maxObsIntensity / 1000 : 1.0;
    return {
      name: p.name, scale_guess: parseFloat(scaleGuess.toExponential(4)),
      lattice: { a: p.a, b: p.b || p.a, c: p.c || p.a, alpha: p.alpha || 90, beta: p.beta || 90, gamma: p.gamma || 90 }
    };
  });
  return {
    module: "Rietveld-Setup",
    initial_parameters: { phases, background_model: input.backgroundModel, profile_shape: input.profileShape },
    refinement_strategy: ["1. Scale", "2. Background", "3. Lattice", "4. Peak Profile", "5. Atomic", "6. ADP"]
  };
};

export const NEUTRON_SCATTERING_LENGTHS: Record<string, number> = {
  H: -3.74, D: 6.67, Li: -1.90, Be: 7.79, B: 5.30, C: 6.65, N: 9.36, O: 5.80, F: 5.65, 
  Na: 3.63, Mg: 5.38, Al: 3.45, Si: 4.15, P: 5.13, S: 2.85, Cl: 9.58, K: 3.67, Ca: 4.70, 
  Ti: -3.44, V: -0.38, Cr: 3.64, Mn: -3.73, Fe: 9.45, Co: 2.49, Ni: 10.3, Cu: 7.72, Zn: 5.68, 
  Zr: 7.16, Ag: 5.92, Cd: 4.87, Au: 7.63, Pb: 9.40, U: 8.42,
  // Additional interesting scatterers
  Gd: 6.5, // High absorption usually, but real part is here
  Sm: 0.8,
  Eu: 7.22,
  W: 4.86,
  Pt: 9.60
};

// Approximate Atomic Numbers for X-ray Form Factor (f ~ Z at theta=0)
export const ATOMIC_NUMBERS: Record<string, number> = {
  H: 1, D: 1, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9,
  Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, K: 19, Ca: 20,
  Ti: 22, V: 23, Cr: 24, Mn: 25, Fe: 26, Co: 27, Ni: 28, Cu: 29, Zn: 30,
  Zr: 40, Ag: 47, Cd: 48, Au: 79, Pb: 82, U: 92,
  Gd: 64, Sm: 62, Eu: 63, W: 74, Pt: 78
};

export const calculateNeutronDiffraction = (wavelength: number, lattice: { a: number }, atoms: NeutronAtom[], maxTwoTheta: number = 100): NeutronResult[] => {
  const results = []; const { a } = lattice; if (a <= 0 || wavelength <= 0) return [];
  const maxSinTheta = Math.sin((maxTwoTheta/2)*(Math.PI/180));
  const maxIndex = Math.floor((2*a*maxSinTheta)/wavelength);
  for (let h = 0; h <= maxIndex; h++) {
    for (let k = 0; k <= maxIndex; k++) {
      for (let l = 0; l <= maxIndex; l++) {
        if (h === 0 && k === 0 && l === 0) continue;
        const d = a / Math.sqrt(h*h + k*k + l*l);
        const sinTheta = wavelength / (2*d);
        if (sinTheta > 1 || sinTheta > maxSinTheta) continue;
        let Fr = 0; let Fi = 0;
        for (const atom of atoms) {
          const phase = 2 * Math.PI * (h*atom.x + k*atom.y + l*atom.z);
          const weight = atom.b * Math.exp(-atom.B_iso * Math.pow(sinTheta/wavelength, 2));
          Fr += weight * Math.cos(phase); Fi += weight * Math.sin(phase);
        }
        const Fsq = Fr*Fr + Fi*Fi;
        const int = Fsq / (sinTheta * Math.sin(2 * Math.asin(sinTheta)));
        if (int > 1e-4) results.push({ hkl: [h,k,l], dSpacing: d, twoTheta: 2*Math.asin(sinTheta)*(180/Math.PI), F_squared: Fsq, intensity: int });
      }
    }
  }
  const maxInt = Math.max(...results.map(r => r.intensity));
  return results.sort((a,b) => a.twoTheta - b.twoTheta).map(r => ({ ...r, intensity: (r.intensity/maxInt)*100 }));
};

export const calculateXRayDiffraction = (wavelength: number, lattice: { a: number }, atoms: NeutronAtom[], maxTwoTheta: number = 100): NeutronResult[] => {
  const results = []; const { a } = lattice; if (a <= 0 || wavelength <= 0) return [];
  const maxSinTheta = Math.sin((maxTwoTheta/2)*(Math.PI/180));
  const maxIndex = Math.floor((2*a*maxSinTheta)/wavelength);
  
  for (let h = 0; h <= maxIndex; h++) {
    for (let k = 0; k <= maxIndex; k++) {
      for (let l = 0; l <= maxIndex; l++) {
        if (h === 0 && k === 0 && l === 0) continue;
        const d = a / Math.sqrt(h*h + k*k + l*l);
        const sinTheta = wavelength / (2*d);
        if (sinTheta > 1 || sinTheta > maxSinTheta) continue;
        
        let Fr = 0; let Fi = 0;
        const s = sinTheta / wavelength; // s = sin(theta)/lambda

        for (const atom of atoms) {
          const phase = 2 * Math.PI * (h*atom.x + k*atom.y + l*atom.z);
          
          // X-ray Form Factor Approximation
          // f(s) approx Z * exp(-B * s^2) is a very rough approx but captures the falloff
          // Better: f(s) = Z / (1 + (s/0.2)^2) or similar.
          // Let's use a simple Gaussian falloff from Z to simulate electron cloud size
          const Z = ATOMIC_NUMBERS[atom.element] || 10;
          // Heuristic falloff: f(s) drops to half at s ~ 0.5 A^-1
          const f0 = Z * Math.exp(-2 * s * s); 

          const weight = f0 * Math.exp(-atom.B_iso * s * s);
          Fr += weight * Math.cos(phase); Fi += weight * Math.sin(phase);
        }
        const Fsq = Fr*Fr + Fi*Fi;
        // LP Factor
        const lp = (1 + Math.cos(2*Math.asin(sinTheta))**2) / (sinTheta * Math.sin(2 * Math.asin(sinTheta)));
        const int = Fsq * lp;

        if (int > 1e-4) results.push({ hkl: [h,k,l], dSpacing: d, twoTheta: 2*Math.asin(sinTheta)*(180/Math.PI), F_squared: Fsq, intensity: int });
      }
    }
  }
  const maxInt = Math.max(...results.map(r => r.intensity));
  return results.sort((a,b) => a.twoTheta - b.twoTheta).map(r => ({ ...r, intensity: (r.intensity/maxInt)*100 }));
};

export const MAGNETIC_FORM_FACTORS: Record<string, { A: number, a: number, B: number, b: number, C: number, c: number, D: number }> = {
  'Mn2+': { A: 0.4191, a: 12.8573, B: 0.2448, b: 4.7851, C: 0.3390, c: 1.5598, D: -0.0028 },
  'Fe3+': { A: 0.3972, a: 13.2442, B: 0.2416, b: 4.9034, C: 0.3618, c: 1.6183, D: -0.0006 },
  'Fe2+': { A: 0.0706, a: 35.008, B: 0.3586, b: 15.358, C: 0.5819, c: 5.561, D: -0.0111 },
  'Co2+': { A: 0.4332, a: 14.2693, B: 0.2559, b: 5.6310, C: 0.3188, c: 2.0163, D: -0.0079 },
  'Ni2+': { A: 0.4242, a: 15.3409, B: 0.2766, b: 6.1528, C: 0.3053, c: 2.2743, D: -0.0061 },
  'Cu2+': { A: 0.0232, a: 35.107, B: 0.4023, b: 16.882, C: 0.5882, c: 6.945, D: -0.0137 },
  'Cr3+': { A: 0.3644, a: 12.441, B: 0.2473, b: 4.492, C: 0.3926, c: 1.458, D: -0.0043 }
};

export const calculateMagneticDiffraction = (wavelength: number, lattice: { a: number }, atoms: MagneticAtom[], maxTwoTheta: number = 100): MagneticResult[] => {
  const results = []; const { a } = lattice; if (a <= 0 || wavelength <= 0) return [];
  const maxSinTheta = Math.sin((maxTwoTheta/2)*(Math.PI/180));
  const maxIndex = Math.floor((2*a*maxSinTheta)/wavelength);
  for (let h = 0; h <= maxIndex; h++) {
    for (let k = 0; k <= maxIndex; k++) {
      for (let l = 0; l <= maxIndex; l++) {
        if (h === 0 && k === 0 && l === 0) continue;
        const d = a / Math.sqrt(h*h + k*k + l*l);
        const sinTheta = wavelength / (2*d);
        if (sinTheta > 1 || sinTheta > maxSinTheta) continue;
        const s = sinTheta/wavelength;
        let Fn_r = 0; let Fn_i = 0; let Fm_r = { x: 0, y: 0, z: 0 }; let Fm_i = { x: 0, y: 0, z: 0 };
        const Qmag = Math.sqrt(h*h + k*k + l*l); const Qhat = { x: h/Qmag, y: k/Qmag, z: l/Qmag };
        for (const atom of atoms) {
          const phase = 2 * Math.PI * (h*atom.x + k*atom.y + l*atom.z);
          const T = Math.exp(-atom.B_iso * s * s);
          Fn_r += atom.b * T * Math.cos(phase); Fn_i += atom.b * T * Math.sin(phase);
          
          // Magnetic Form Factor Calculation
          let f_mag = 0;
          if (atom.ion && MAGNETIC_FORM_FACTORS[atom.ion]) {
             const { A, a, B, b, C, c, D } = MAGNETIC_FORM_FACTORS[atom.ion];
             f_mag = A * Math.exp(-a * s * s) + B * Math.exp(-b * s * s) + C * Math.exp(-c * s * s) + D;
          } else {
             // Fallback to generic Gaussian if no ion specified
             f_mag = Math.exp(-4 * s * s);
          }

          const MdotQ = atom.mx*Qhat.x + atom.my*Qhat.y + atom.mz*Qhat.z;
          const weight = 2.696 * f_mag * T; // 2.696 fm is magnetic scattering length of electron
          
          Fm_r.x += weight * (atom.mx - MdotQ*Qhat.x) * Math.cos(phase);
          Fm_r.y += weight * (atom.my - MdotQ*Qhat.y) * Math.cos(phase);
          Fm_r.z += weight * (atom.mz - MdotQ*Qhat.z) * Math.cos(phase);
          
          Fm_i.x += weight * (atom.mx - MdotQ*Qhat.x) * Math.sin(phase);
          Fm_i.y += weight * (atom.my - MdotQ*Qhat.y) * Math.sin(phase);
          Fm_i.z += weight * (atom.mz - MdotQ*Qhat.z) * Math.sin(phase);
        }
        
        const In = (Fn_r*Fn_r + Fn_i*Fn_i); 
        // Magnetic intensity is sum of squared moduli of vector components
        const Im = (Fm_r.x*Fm_r.x + Fm_i.x*Fm_i.x) + (Fm_r.y*Fm_r.y + Fm_i.y*Fm_i.y) + (Fm_r.z*Fm_r.z + Fm_i.z*Fm_i.z);
        
        const L = 1 / (sinTheta * Math.sin(2*Math.asin(sinTheta)));
        if (In+Im > 1e-4) results.push({ hkl: [h,k,l], twoTheta: 2*Math.asin(sinTheta)*(180/Math.PI), dSpacing: d, nuclearIntensity: In*L, magneticIntensity: Im*L, totalIntensity: (In+Im)*L });
      }
    }
  }
  const maxI = Math.max(...results.map(r => r.totalIntensity));
  return results.sort((a,b) => a.twoTheta - b.twoTheta).map(r => ({ ...r, nuclearIntensity: (r.nuclearIntensity/maxI)*100, magneticIntensity: (r.magneticIntensity/maxI)*100, totalIntensity: (r.totalIntensity/maxI)*100 }));
};

export const identifyPhasesDL = (inputPoints: { twoTheta: number, intensity: number }[]): DLPhaseResult => {
  // Expanded Database of Common Phases
  const DB = [
    { 
      name: 'Silicon', formula: 'Si', cardId: 'COD-9008566', 
      peaks: [{t: 28.44, i: 100}, {t: 47.30, i: 55}, {t: 56.12, i: 30}, {t: 69.13, i: 6}, {t: 76.38, i: 11}, {t: 88.03, i: 12}],
      description: "A hard, brittle crystalline solid with a blue-grey metallic lustre, and is a tetravalent metalloid and semiconductor.",
      crystalSystem: "Cubic (Diamond)", spaceGroup: "Fd-3m", density: 2.329,
      applications: ["Semiconductors", "Solar Cells", "Microchips", "Glass Manufacturing"]
    },
    { 
      name: 'Gold', formula: 'Au', cardId: 'COD-9008463', 
      peaks: [{t: 38.18, i: 100}, {t: 44.39, i: 52}, {t: 64.57, i: 32}, {t: 77.54, i: 36}, {t: 81.72, i: 12}],
      description: "A bright, slightly reddish yellow, dense, soft, malleable, and ductile metal.",
      crystalSystem: "Face-Centered Cubic", spaceGroup: "Fm-3m", density: 19.30,
      applications: ["Jewelry", "Electronics", "Medicine", "Aerospace"]
    },
    { 
      name: 'Silver', formula: 'Ag', cardId: 'COD-9008459', 
      peaks: [{t: 38.11, i: 100}, {t: 44.27, i: 40}, {t: 64.42, i: 25}, {t: 77.47, i: 26}],
      description: "A soft, white, lustrous transition metal, it exhibits the highest electrical conductivity, thermal conductivity, and reflectivity of any metal.",
      crystalSystem: "Face-Centered Cubic", spaceGroup: "Fm-3m", density: 10.49,
      applications: ["Conductors", "Jewelry", "Solar Panels", "Mirrors"]
    },
    { 
      name: 'Quartz', formula: 'SiO2', cardId: 'COD-1011097', 
      peaks: [{t: 20.86, i: 22}, {t: 26.64, i: 100}, {t: 36.54, i: 6}, {t: 39.46, i: 4}, {t: 40.29, i: 3}, {t: 42.45, i: 6}, {t: 45.79, i: 3}, {t: 50.14, i: 14}, {t: 54.87, i: 3}, {t: 59.96, i: 5}, {t: 67.74, i: 4}, {t: 68.14, i: 3}],
      description: "A hard, crystalline mineral composed of silica. It is the second most abundant mineral in Earth's continental crust.",
      crystalSystem: "Trigonal", spaceGroup: "P3(1)21", density: 2.65,
      applications: ["Glass", "Ceramics", "Electronics (Oscillators)", "Gemstones"]
    },
    { 
      name: 'Corundum', formula: 'Al2O3', cardId: 'COD-1000032', 
      peaks: [{t: 25.58, i: 60}, {t: 35.15, i: 100}, {t: 37.78, i: 40}, {t: 43.35, i: 90}, {t: 52.55, i: 45}, {t: 57.50, i: 80}, {t: 61.30, i: 8}, {t: 66.52, i: 35}, {t: 68.21, i: 40}],
      description: "A crystalline form of aluminium oxide typically containing traces of iron, titanium, vanadium and chromium.",
      crystalSystem: "Trigonal", spaceGroup: "R-3c", density: 4.02,
      applications: ["Abrasives", "Refractories", "Gemstones (Ruby/Sapphire)", "Lasers"]
    },
    { 
      name: 'Rutile', formula: 'TiO2', cardId: 'COD-9004141', 
      peaks: [{t: 27.45, i: 100}, {t: 36.09, i: 50}, {t: 39.19, i: 8}, {t: 41.23, i: 25}, {t: 44.05, i: 10}, {t: 54.32, i: 60}, {t: 56.64, i: 20}, {t: 62.74, i: 10}, {t: 64.04, i: 10}, {t: 69.01, i: 20}],
      description: "The most common natural form of TiO2. It has one of the highest refractive indices of any known crystal.",
      crystalSystem: "Tetragonal", spaceGroup: "P4(2)/mnm", density: 4.23,
      applications: ["Pigments", "Welding Rods", "Optical Coatings", "Titanium Metal"]
    },
    { 
      name: 'Anatase', formula: 'TiO2', cardId: 'COD-9009086', 
      peaks: [{t: 25.28, i: 100}, {t: 36.95, i: 10}, {t: 37.80, i: 20}, {t: 38.58, i: 10}, {t: 48.05, i: 35}, {t: 53.89, i: 20}, {t: 55.06, i: 20}, {t: 62.69, i: 15}],
      description: "A metastable mineral form of titanium dioxide. It is favored for photocatalytic applications.",
      crystalSystem: "Tetragonal", spaceGroup: "I4(1)/amd", density: 3.79,
      applications: ["Photocatalysis", "Solar Cells", "Pigments", "Air Purification"]
    },
    { 
      name: 'Magnetite', formula: 'Fe3O4', cardId: 'COD-1011032', 
      peaks: [{t: 18.27, i: 10}, {t: 30.09, i: 30}, {t: 35.42, i: 100}, {t: 37.05, i: 8}, {t: 43.05, i: 20}, {t: 53.39, i: 10}, {t: 56.94, i: 30}, {t: 62.51, i: 40}, {t: 70.92, i: 5}, {t: 73.95, i: 10}],
      description: "A rock mineral and one of the main iron ores. It is ferrimagnetic and the most magnetic of all naturally-occurring minerals.",
      crystalSystem: "Cubic (Spinel)", spaceGroup: "Fd-3m", density: 5.17,
      applications: ["Iron Ore", "Catalysis", "Magnetic Recording", "Heavy Media Separation"]
    },
    { 
      name: 'Hydroxyapatite', formula: 'Ca5(PO4)3(OH)', cardId: 'COD-9010051', 
      peaks: [{t: 25.87, i: 40}, {t: 31.77, i: 100}, {t: 32.19, i: 60}, {t: 32.90, i: 60}, {t: 34.04, i: 25}, {t: 39.81, i: 20}, {t: 46.71, i: 40}, {t: 49.46, i: 30}, {t: 53.14, i: 20}],
      description: "A naturally occurring mineral form of calcium apatite. It is the main mineral component of bone and teeth.",
      crystalSystem: "Hexagonal", spaceGroup: "P6(3)/m", density: 3.16,
      applications: ["Bone Grafts", "Dental Implants", "Drug Delivery", "Chromatography"]
    },
    { 
      name: 'Zinc Oxide', formula: 'ZnO', cardId: 'COD-9008877', 
      peaks: [{t: 31.77, i: 57}, {t: 34.42, i: 44}, {t: 36.25, i: 100}, {t: 47.54, i: 23}, {t: 56.60, i: 32}, {t: 62.86, i: 29}, {t: 66.38, i: 4}, {t: 67.96, i: 23}, {t: 69.10, i: 11}],
      description: "An inorganic compound that is a white powder. It is a wide-bandgap semiconductor.",
      crystalSystem: "Hexagonal (Wurtzite)", spaceGroup: "P6(3)mc", density: 5.61,
      applications: ["Rubber Additive", "Sunscreen", "Varistors", "LEDs"]
    },
    {
      name: 'Calcite', formula: 'CaCO3', cardId: 'COD-1010928',
      peaks: [{t: 23.05, i: 12}, {t: 29.40, i: 100}, {t: 35.97, i: 14}, {t: 39.41, i: 18}, {t: 43.16, i: 18}, {t: 47.50, i: 17}, {t: 48.50, i: 17}],
      description: "A carbonate mineral and the most stable polymorph of calcium carbonate. It is a major constituent of sedimentary rocks.",
      crystalSystem: "Trigonal", spaceGroup: "R-3c", density: 2.71,
      applications: ["Construction", "Soil Remediation", "Pigments", "Pharmaceuticals"]
    },
    {
      name: 'Halite', formula: 'NaCl', cardId: 'COD-9000006',
      peaks: [{t: 27.37, i: 10}, {t: 31.69, i: 100}, {t: 45.43, i: 55}, {t: 56.45, i: 15}, {t: 66.20, i: 5}, {t: 75.26, i: 10}],
      description: "Commonly known as rock salt, it is the mineral form of sodium chloride.",
      crystalSystem: "Cubic", spaceGroup: "Fm-3m", density: 2.16,
      applications: ["Food", "De-icing", "Chemical Industry"]
    },
    {
      name: 'Sylvite', formula: 'KCl', cardId: 'COD-9000008',
      peaks: [{t: 28.35, i: 100}, {t: 40.50, i: 50}, {t: 50.15, i: 15}, {t: 58.60, i: 5}, {t: 66.35, i: 10}, {t: 73.70, i: 5}],
      description: "Potassium chloride is a metal halide salt composed of potassium and chlorine.",
      crystalSystem: "Cubic", spaceGroup: "Fm-3m", density: 1.98,
      applications: ["Fertilizer", "Medicine", "Food Processing"]
    },
    {
      name: 'Fluorite', formula: 'CaF2', cardId: 'COD-9000009',
      peaks: [{t: 28.27, i: 100}, {t: 46.99, i: 55}, {t: 55.75, i: 30}, {t: 68.65, i: 5}, {t: 75.85, i: 10}, {t: 87.45, i: 10}],
      description: "The mineral form of calcium fluoride. It belongs to the halide minerals.",
      crystalSystem: "Cubic", spaceGroup: "Fm-3m", density: 3.18,
      applications: ["Metallurgy", "Optics", "Ceramics"]
    },
    {
      name: 'Hematite', formula: 'Fe2O3', cardId: 'COD-9000139',
      peaks: [{t: 24.14, i: 30}, {t: 33.15, i: 100}, {t: 35.61, i: 70}, {t: 40.85, i: 20}, {t: 49.48, i: 40}, {t: 54.09, i: 45}, {t: 62.45, i: 30}, {t: 64.02, i: 30}],
      description: "One of the most abundant minerals on Earth's surface and an important ore of iron.",
      crystalSystem: "Trigonal", spaceGroup: "R-3c", density: 5.26,
      applications: ["Iron Ore", "Pigments", "Radiation Shielding"]
    },
    {
      name: 'Graphite', formula: 'C', cardId: 'COD-9000046',
      peaks: [{t: 26.54, i: 100}, {t: 42.40, i: 10}, {t: 44.56, i: 10}, {t: 54.65, i: 25}, {t: 77.50, i: 5}],
      description: "A crystalline form of the element carbon with its atoms arranged in a hexagonal structure.",
      crystalSystem: "Hexagonal", spaceGroup: "P63/mmc", density: 2.26,
      applications: ["Lubricants", "Batteries", "Pencils", "Graphene Production"]
    }
  ];

  const TOLERANCE = 0.5; // degrees

  const candidates = DB.map(phase => {
    let matchScore = 0;
    let matchedPeaksCount = 0;
    const matchedDetails = [];

    // 1. Forward Match: Check if Reference Peaks exist in Input
    for (const refPeak of phase.peaks) {
      // Find closest input peak
      const closest = inputPoints.reduce((prev, curr) => {
        return (Math.abs(curr.twoTheta - refPeak.t) < Math.abs(prev.twoTheta - refPeak.t) ? curr : prev);
      });
      
      const diff = Math.abs(closest.twoTheta - refPeak.t);
      
      if (diff <= TOLERANCE) {
        matchedPeaksCount++;
        
        // Weight by intensity importance (major peaks matter more)
        const positionWeight = 1 - (diff / TOLERANCE); // 1.0 if perfect match
        const intensityWeight = Math.log10(refPeak.i + 10) / 2; // Log scale weight for intensity
        
        // Intensity Ratio Check:
        // Ideally, ObsIntensity / RefIntensity should be somewhat constant (scale factor)
        // But here we just check if strong ref peaks are also strong in obs
        // We don't penalize too much for intensity mismatch due to texture/preferred orientation
        
        matchScore += (10 * positionWeight * intensityWeight);

        matchedDetails.push({ refT: refPeak.t, obsT: closest.twoTheta, refI: refPeak.i });
      }
    }

    // 2. Reverse Match Penalty: Check if Input Peaks are unaccounted for (Impurity check)
    // If the input has strong peaks that are NOT in this phase, it might be a mixture or wrong phase.
    // However, for single phase ID, we want to penalize "extra" peaks slightly less than missing peaks.
    let unmatchedInputEnergy = 0;
    for (const inputPeak of inputPoints) {
       const hasMatch = phase.peaks.some(ref => Math.abs(ref.t - inputPeak.twoTheta) <= TOLERANCE);
       if (!hasMatch) {
         unmatchedInputEnergy += inputPeak.intensity;
       }
    }
    
    // Normalize score
    const totalRefPeaks = phase.peaks.length;
    const coverage = matchedPeaksCount / totalRefPeaks;
    
    // Base score from matches
    let confidence = (matchScore / (totalRefPeaks * 3)) * 100;
    
    // Boost if high coverage
    if (coverage > 0.8) confidence *= 1.2;
    if (coverage < 0.2) confidence *= 0.5;

    // Penalize for unmatched input energy (if input has 100% intensity peak unmatched, confidence drops)
    // We normalize unmatched energy by total input energy roughly
    const totalInputEnergy = inputPoints.reduce((sum, p) => sum + p.intensity, 0);
    if (totalInputEnergy > 0) {
      const impurityRatio = unmatchedInputEnergy / totalInputEnergy;
      // If 50% of signal is unaccounted for, reduce confidence by 20%
      confidence *= (1 - (impurityRatio * 0.4));
    }

    // Cap at 99.9
    confidence = Math.min(99.9, Math.max(0, confidence));

    return { 
      phase_name: phase.name, 
      formula: phase.formula, 
      card_id: phase.cardId, 
      confidence_score: parseFloat(confidence.toFixed(1)),
      matched_peaks: matchedDetails,
      description: phase.description,
      crystalSystem: phase.crystalSystem,
      spaceGroup: phase.spaceGroup,
      density: phase.density,
      applications: phase.applications
    };
  }).filter(c => c.confidence_score > 15).sort((a,b) => b.confidence_score - a.confidence_score);

  return { module: "DL-Phase-ID-Smart", candidates };
};

export const parseXYData = (input: string) => {
  return input.split('\n').filter(l => l.trim()).map(l => {
    const p = l.split(/[\s,]+/).map(parseFloat);
    return { twoTheta: p[0], intensity: p[1] || 100 };
  }).filter(p => p.twoTheta > 0);
};