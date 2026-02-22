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
  H: -3.74, D: 6.67, Li: -1.90, B: 5.30, C: 6.65, N: 9.36, O: 5.80, F: 5.65, Na: 3.63, Mg: 5.38, Al: 3.45, Si: 4.15, P: 5.13, S: 2.85, Cl: 9.58, K: 3.67, Ca: 4.70, Ti: -3.44, V: -0.38, Cr: 3.64, Mn: -3.73, Fe: 9.45, Co: 2.49, Ni: 10.3, Cu: 7.72, Zn: 5.68, Zr: 7.16, Ag: 5.92, Cd: 4.87, Au: 7.63, Pb: 9.40, U: 8.42
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
          const MdotQ = atom.mx*Qhat.x + atom.my*Qhat.y + atom.mz*Qhat.z;
          const weight = 2.696 * Math.exp(-4*s*s) * T;
          Fm_r.x += weight * (atom.mx - MdotQ*Qhat.x) * Math.cos(phase);
          Fm_i.x += weight * (atom.mx - MdotQ*Qhat.x) * Math.sin(phase);
        }
        const In = (Fn_r*Fn_r + Fn_i*Fn_i); const Im = (Fm_r.x*Fm_r.x + Fm_i.x*Fm_i.x);
        const L = 1 / (sinTheta * Math.sin(2*Math.asin(sinTheta)));
        if (In+Im > 1e-4) results.push({ hkl: [h,k,l], twoTheta: 2*Math.asin(sinTheta)*(180/Math.PI), dSpacing: d, nuclearIntensity: In*L, magneticIntensity: Im*L, totalIntensity: (In+Im)*L });
      }
    }
  }
  const maxI = Math.max(...results.map(r => r.totalIntensity));
  return results.sort((a,b) => a.twoTheta - b.twoTheta).map(r => ({ ...r, nuclearIntensity: (r.nuclearIntensity/maxI)*100, magneticIntensity: (r.magneticIntensity/maxI)*100, totalIntensity: (r.totalIntensity/maxI)*100 }));
};

export const identifyPhasesDL = (inputPoints: { twoTheta: number, intensity: number }[]): DLPhaseResult => {
  const DB = [
    { name: 'Silicon', formula: 'Si', cardId: 'COD-9008566', majorPeaks: [28.44, 47.30, 56.12, 69.13, 76.38] },
    { name: 'Gold', formula: 'Au', cardId: 'COD-9008463', majorPeaks: [38.18, 44.39, 64.57, 77.54] },
    { name: 'Quartz', formula: 'SiO2', cardId: 'COD-1011097', majorPeaks: [20.86, 26.64, 50.14] },
    { name: 'Hydroxyapatite', formula: 'Ca5(PO4)3(OH)', cardId: 'COD-9010051', majorPeaks: [25.87, 31.77, 32.19, 32.90, 34.04, 39.81, 46.71, 49.46] },
    { name: 'Zinc Oxide', formula: 'ZnO', cardId: 'COD-9008877', majorPeaks: [31.77, 34.42, 36.25, 47.54, 56.60, 62.86] }
  ];
  const candidates = DB.map(p => {
    let matches = 0;
    for (const dp of p.majorPeaks) if (inputPoints.find(ip => Math.abs(ip.twoTheta - dp) <= 0.5)) matches++;
    return { phase_name: p.name, formula: p.formula, card_id: p.cardId, confidence_score: (matches/p.majorPeaks.length)*100 };
  }).filter(c => c.confidence_score > 10).sort((a,b) => b.confidence_score - a.confidence_score);
  return { module: "DL-Phase-ID", candidates };
};

export const parseXYData = (input: string) => {
  return input.split('\n').filter(l => l.trim()).map(l => {
    const p = l.split(/[\s,]+/).map(parseFloat);
    return { twoTheta: p[0], intensity: p[1] || 100 };
  }).filter(p => p.twoTheta > 0);
};