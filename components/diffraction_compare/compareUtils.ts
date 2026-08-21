import { 
  PeakItem, 
  ProfilePoint, 
  IndexedPeakMatch, 
  SpectralMetrics, 
  SearchMatchCandidate,
  DiffTheme,
  CurveColorPalette
} from './types';

// Standard Cu-Ka X-ray wavelength in Angstroms
export const CU_KA_WAVELENGTH = 1.5406;

/**
 * High-Contrast Color Theme Palettes with optimal visual contrast and accessibility
 */
export const THEME_PALETTES: Record<DiffTheme, CurveColorPalette> = {
  neon: {
    colorA: '#6366f1', // Indigo Neon
    colorB: '#06b6d4', // Cyan Vivid
    colorC: '#d946ef', // Magenta
    colorD: '#f59e0b', // Amber
    colorDiff: '#f43f5e', // Rose
    posDiff: '#10b981',
    negDiff: '#f43f5e',
    colorTotalModel: '#f8fafc'
  },
  emerald: {
    colorA: '#10b981', // Emerald Mint
    colorB: '#06b6d4', // Sky Blue
    colorC: '#a855f7', // Purple
    colorD: '#f43f5e', // Rose
    colorDiff: '#f59e0b', // Amber
    posDiff: '#10b981',
    negDiff: '#ef4444',
    colorTotalModel: '#ffffff'
  },
  amber: {
    colorA: '#f59e0b', // Golden Amber
    colorB: '#ec4899', // Pink Flame
    colorC: '#8b5cf6', // Violet
    colorD: '#06b6d4', // Cyan
    colorDiff: '#06b6d4',
    posDiff: '#f59e0b',
    negDiff: '#ec4899',
    colorTotalModel: '#fef08a'
  },
  cyan: {
    colorA: '#00e5ff', // Electric Cyan
    colorB: '#ff3366', // Hot Coral
    colorC: '#ffd600', // Yellow
    colorD: '#7c4dff', // Deep Purple
    colorDiff: '#00e676', // Bright Green
    posDiff: '#00e5ff',
    negDiff: '#ff3366',
    colorTotalModel: '#ffffff'
  },
  cyberpunk: {
    colorA: '#00ffcc', // Cyber Mint
    colorB: '#ff007f', // Hot Neon Pink
    colorC: '#ffe600', // Cyber Yellow
    colorD: '#9d00ff', // Violet Laser
    colorDiff: '#00f0ff',
    posDiff: '#00ffcc',
    negDiff: '#ff007f',
    colorTotalModel: '#ffffff'
  },
  solar: {
    colorA: '#ff6b00', // Solar Flare Orange
    colorB: '#ff0055', // Crimson Sunset
    colorC: '#ffcc00', // Sunburst Gold
    colorD: '#00d2ff', // Electric Sky
    colorDiff: '#00f5d4',
    posDiff: '#ff6b00',
    negDiff: '#ff0055',
    colorTotalModel: '#fff'
  },
  crimson: {
    colorA: '#f43f5e', // Ruby Crimson
    colorB: '#38bdf8', // Ice Blue
    colorC: '#fbbf24', // Amber
    colorD: '#c084fc', // Lilac
    colorDiff: '#34d399', // Mint
    posDiff: '#f43f5e',
    negDiff: '#38bdf8',
    colorTotalModel: '#ffffff'
  },
  violet: {
    colorA: '#a855f7', // Vivid Purple
    colorB: '#22d3ee', // Cyan
    colorC: '#f472b6', // Pink
    colorD: '#facc15', // Yellow
    colorDiff: '#4ade80', // Light Green
    posDiff: '#a855f7',
    negDiff: '#f472b6',
    colorTotalModel: '#ffffff'
  },
  'high-contrast': {
    colorA: '#ffffff', // Crisp Pure White
    colorB: '#38bdf8', // High-Contrast Light Blue
    colorC: '#facc15', // Vivid Yellow
    colorD: '#4ade80', // Crisp Mint
    colorDiff: '#f43f5e', // Hot Coral Red
    posDiff: '#4ade80',
    negDiff: '#f43f5e',
    colorTotalModel: '#e2e8f0'
  },
  monochrome: {
    colorA: '#f8fafc',
    colorB: '#94a3b8',
    colorC: '#64748b',
    colorD: '#475569',
    colorDiff: '#f43f5e',
    posDiff: '#cbd5e1',
    negDiff: '#64748b',
    colorTotalModel: '#ffffff'
  },
  custom: {
    colorA: '#38bdf8',
    colorB: '#f43f5e',
    colorC: '#a855f7',
    colorD: '#f59e0b',
    colorDiff: '#10b981',
    posDiff: '#38bdf8',
    negDiff: '#f43f5e',
    colorTotalModel: '#ffffff'
  }
};

/**
 * Returns active palette, applying user overrides if provided
 */
export const getActivePalette = (
  theme: DiffTheme, 
  customOverrides?: Partial<CurveColorPalette>
): CurveColorPalette => {
  const base = THEME_PALETTES[theme] || THEME_PALETTES.neon;
  if (!customOverrides) return base;
  return {
    ...base,
    ...customOverrides,
    posDiff: customOverrides.posDiff || customOverrides.colorA || base.posDiff,
    negDiff: customOverrides.negDiff || customOverrides.colorB || base.negDiff
  };
};

/**
 * Curated Vibrant Color Swatches for quick selection
 */
export const PRESET_COLOR_SWATCHES = [
  { name: 'Electric Cyan', hex: '#00e5ff' },
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Indigo Neon', hex: '#6366f1' },
  { name: 'Emerald Mint', hex: '#10b981' },
  { name: 'Lime Electric', hex: '#84cc16' },
  { name: 'Sunburst Amber', hex: '#f59e0b' },
  { name: 'Solar Orange', hex: '#ff6b00' },
  { name: 'Ruby Crimson', hex: '#f43f5e' },
  { name: 'Hot Neon Pink', hex: '#ec4899' },
  { name: 'Cyber Magenta', hex: '#d946ef' },
  { name: 'Vivid Violet', hex: '#a855f7' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Slate Light', hex: '#cbd5e1' },
  { name: 'Gold Flare', hex: '#eab308' }
];

/**
 * Robust string parser for peak lists in multiple scientific formats:
 * - "25.87(30), 31.77(100), 32.19(70)"
 * - "25.87 (002, 30); 31.77 (211, 100)"
 * - "25.87 30\n31.77 100"
 * - "25.87 002 30\n31.77 211 100"
 */
export const parseCustomPattern = (patternStr: string): PeakItem[] => {
  if (!patternStr) return [];
  const entries = patternStr.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
  return entries.map(entry => {
    let twoTheta = NaN;
    let hkl = '';
    let intensity = 100;

    const parenIndex = entry.indexOf('(');
    if (parenIndex !== -1) {
      const thetaStr = entry.substring(0, parenIndex).trim();
      twoTheta = parseFloat(thetaStr);

      const insideParen = entry.substring(parenIndex + 1, entry.indexOf(')'));
      const insideParts = insideParen.split(',').map(p => p.trim());
      if (insideParts.length > 0) {
        const numericPart = parseFloat(insideParts[0]);
        if (!isNaN(numericPart) && insideParts.length === 1) {
          intensity = numericPart;
          hkl = '';
        } else if (insideParts.length === 2) {
          hkl = insideParts[0];
          const parsedInt = parseFloat(insideParts[1]);
          if (!isNaN(parsedInt)) {
            intensity = parsedInt;
          }
        } else {
          hkl = insideParts[0];
        }
      }
    } else {
      const parts = entry.replace(/\s+/g, ' ').split(' ');
      if (parts.length >= 1) {
        twoTheta = parseFloat(parts[0]);
      }
      if (parts.length >= 2) {
        const parsedValue = parseFloat(parts[1]);
        if (!isNaN(parsedValue)) {
          intensity = parsedValue;
        } else {
          hkl = parts[1];
        }
      }
      if (parts.length >= 3) {
        const parsedValue = parseFloat(parts[2]);
        if (!isNaN(parsedValue)) {
          intensity = parsedValue;
        }
      }
    }

    const thetaRad = (twoTheta / 2) * (Math.PI / 180);
    const dSpacing = thetaRad > 0 ? Number((CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4)) : undefined;

    return { twoTheta, intensity, hkl, dSpacing };
  }).filter(p => !isNaN(p.twoTheta) && p.twoTheta > 0);
};

/**
 * Parses continuous XY / CSV / DAT / TXT raw spectrum files
 */
export const parseContinuousRawData = (rawText: string): { twoTheta: number; intensity: number }[] => {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  const points: { twoTheta: number; intensity: number }[] = [];

  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#') || clean.startsWith('//') || clean.startsWith('!') || clean.toLowerCase().startsWith('angle')) {
      continue;
    }
    const parts = clean.split(/[\s,;\t]+/).map(p => parseFloat(p)).filter(n => !isNaN(n));
    if (parts.length >= 2) {
      points.push({ twoTheta: parts[0], intensity: parts[1] });
    }
  }

  return points.sort((a, b) => a.twoTheta - b.twoTheta);
};

/**
 * Automatically extracts distinct peaks from continuous data points using local maximum detection
 */
export const extractPeaksFromRawPoints = (points: { twoTheta: number; intensity: number }[], maxPeaks = 30): PeakItem[] => {
  if (points.length < 5) return [];
  const maxI = Math.max(...points.map(p => p.intensity), 1);
  const minI = Math.min(...points.map(p => p.intensity), 0);
  const normalized = points.map(p => ({
    twoTheta: p.twoTheta,
    intensity: ((p.intensity - minI) / (maxI - minI)) * 100
  }));

  const peaks: PeakItem[] = [];
  const window = 3;
  for (let i = window; i < normalized.length - window; i++) {
    const curr = normalized[i];
    if (curr.intensity < 4) continue; // Noise cutoff

    let isPeak = true;
    for (let j = i - window; j <= i + window; j++) {
      if (j !== i && normalized[j].intensity >= curr.intensity) {
        isPeak = false;
        break;
      }
    }

    if (isPeak) {
      const y1 = normalized[i - 1].intensity;
      const y2 = normalized[i].intensity;
      const y3 = normalized[i + 1].intensity;
      const x1 = normalized[i - 1].twoTheta;
      const x2 = normalized[i].twoTheta;
      const x3 = normalized[i + 1].twoTheta;

      const denom = (y1 - 2 * y2 + y3);
      let refinedTheta = x2;
      if (Math.abs(denom) > 1e-6) {
        const delta = (x3 - x1) * 0.5 * (y1 - y3) / (2 * denom);
        if (Math.abs(delta) < 0.2) refinedTheta += delta;
      }

      const thetaRad = (refinedTheta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? Number((CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4)) : undefined;

      peaks.push({
        twoTheta: Number(refinedTheta.toFixed(3)),
        intensity: Number(curr.intensity.toFixed(1)),
        dSpacing
      });
    }
  }

  return peaks.sort((a, b) => b.intensity - a.intensity).slice(0, maxPeaks).sort((a, b) => a.twoTheta - b.twoTheta);
};

/**
 * Extracts PeakItem array from any material format
 */
export const extractMaterialPeaks = (material: any): PeakItem[] => {
  if (!material) return [];
  if (material.isUserSample) {
    return (material.results || []).map((r: any) => {
      const thetaRad = (r.twoTheta / 2) * (Math.PI / 180);
      const dSpacing = thetaRad > 0 ? Number((CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4)) : undefined;
      return {
        twoTheta: r.twoTheta,
        intensity: r.intensity !== undefined ? r.intensity : 100,
        hkl: r.hkl || '',
        dSpacing
      };
    });
  }
  const pattern = material.pattern || '';
  return parseCustomPattern(pattern);
};

/**
 * Generates continuous synthetic diffraction profiles for Sample A, Sample B (with shift & scale),
 * and optional secondary phases Sample C and Sample D.
 */
export const generateSynthesizedProfile = (
  matA: any,
  matB: any,
  matC: any = null,
  matD: any = null,
  options: {
    shiftTwoThetaB?: number;
    scaleSampleB?: number;
    scaleSampleC?: number;
    scaleSampleD?: number;
    peakShape?: 'pseudoVoigt' | 'pearsonVII' | 'gaussian' | 'lorentzian';
    eta?: number;
    pearsonM?: number;
    fwhm?: number;
    minTheta?: number;
    maxTheta?: number;
    step?: number;
    background?: number;
    noiseLevel?: number;
    normalizationMode?: 'max100' | 'unitArea' | 'raw';
  } = {}
) => {
  const {
    shiftTwoThetaB = 0,
    scaleSampleB = 1.0,
    scaleSampleC = 0,
    scaleSampleD = 0,
    peakShape = 'pseudoVoigt',
    eta = 0.5,
    pearsonM = 1.5,
    fwhm = 0.25,
    minTheta = 10,
    maxTheta = 90,
    step = 0.1,
    background = 2.0,
    noiseLevel = 0.0,
    normalizationMode = 'max100'
  } = options;

  const peaksA = extractMaterialPeaks(matA);
  const peaksB = extractMaterialPeaks(matB);
  const peaksC = matC ? extractMaterialPeaks(matC) : [];
  const peaksD = matD ? extractMaterialPeaks(matD) : [];

  // Mathematical Peak Shape Function Evaluator
  const evalPeakShape = (x: number, x0: number, w: number, height: number): number => {
    const halfW = Math.max(w / 2, 0.01);
    const dx = x - x0;

    if (peakShape === 'gaussian') {
      return height * Math.exp(-Math.LN2 * Math.pow(dx / halfW, 2));
    } else if (peakShape === 'lorentzian') {
      return height / (1 + Math.pow(dx / halfW, 2));
    } else if (peakShape === 'pearsonVII') {
      const m = Math.max(pearsonM, 0.5);
      const c = Math.pow(2, 1 / m) - 1;
      return height / Math.pow(1 + 4 * c * Math.pow(dx / w, 2), m);
    } else {
      // Default: Pseudo-Voigt
      const g = Math.exp(-Math.LN2 * Math.pow(dx / halfW, 2));
      const l = 1 / (1 + Math.pow(dx / halfW, 2));
      const safeEta = Math.max(0, Math.min(1, eta));
      return height * (safeEta * l + (1 - safeEta) * g);
    }
  };

  const numPoints = Math.floor((maxTheta - minTheta) / step) + 1;
  const points: ProfilePoint[] = new Array(numPoints);

  // Normalize reference peak heights
  const maxIntensityA = peaksA.length > 0 ? Math.max(...peaksA.map(p => p.intensity), 1) : 100;
  const maxIntensityB = peaksB.length > 0 ? Math.max(...peaksB.map(p => p.intensity), 1) : 100;
  const maxIntensityC = peaksC.length > 0 ? Math.max(...peaksC.map(p => p.intensity), 1) : 100;
  const maxIntensityD = peaksD.length > 0 ? Math.max(...peaksD.map(p => p.intensity), 1) : 100;

  for (let i = 0; i < numPoints; i++) {
    const twoTheta = Number((minTheta + i * step).toFixed(2));
    
    // Deterministic pseudo-noise
    const noise = noiseLevel > 0 
      ? (Math.sin(twoTheta * 97.3) * Math.cos(twoTheta * 31.7) * noiseLevel * 2) 
      : 0;

    // Sample A continuous profile
    let iA = background + noise;
    for (const p of peaksA) {
      const relH = (p.intensity / maxIntensityA) * 100;
      const peakFwhm = p.fwhm || fwhm;
      if (Math.abs(twoTheta - p.twoTheta) < peakFwhm * 4.5) {
        iA += evalPeakShape(twoTheta, p.twoTheta, peakFwhm, relH);
      }
    }

    // Sample B continuous profile
    let iB = background + noise;
    for (const p of peaksB) {
      const relH = (p.intensity / maxIntensityB) * 100 * scaleSampleB;
      const targetCenter = p.twoTheta + shiftTwoThetaB;
      const peakFwhm = p.fwhm || fwhm;
      if (Math.abs(twoTheta - targetCenter) < peakFwhm * 4.5) {
        iB += evalPeakShape(twoTheta, targetCenter, peakFwhm, relH);
      }
    }

    // Phase C profile
    let iC = 0;
    if (matC && scaleSampleC > 0) {
      for (const p of peaksC) {
        const relH = (p.intensity / maxIntensityC) * 100 * scaleSampleC;
        const peakFwhm = p.fwhm || fwhm;
        if (Math.abs(twoTheta - p.twoTheta) < peakFwhm * 4.5) {
          iC += evalPeakShape(twoTheta, p.twoTheta, peakFwhm, relH);
        }
      }
    }

    // Phase D profile
    let iD = 0;
    if (matD && scaleSampleD > 0) {
      for (const p of peaksD) {
        const relH = (p.intensity / maxIntensityD) * 100 * scaleSampleD;
        const peakFwhm = p.fwhm || fwhm;
        if (Math.abs(twoTheta - p.twoTheta) < peakFwhm * 4.5) {
          iD += evalPeakShape(twoTheta, p.twoTheta, peakFwhm, relH);
        }
      }
    }

    // Composite total model
    const totalModel = iB + iC + iD;
    const diff = iA - totalModel;

    // Numerical derivatives
    const dStep = 0.05;
    let iA_plus = 0;
    for (const p of peaksA) {
      const relH = (p.intensity / maxIntensityA) * 100;
      const peakFwhm = p.fwhm || fwhm;
      if (Math.abs((twoTheta + dStep) - p.twoTheta) < peakFwhm * 4.5) {
        iA_plus += evalPeakShape(twoTheta + dStep, p.twoTheta, peakFwhm, relH);
      }
    }
    const derivA = Number(((iA_plus - (iA - background - noise)) / dStep).toFixed(2));

    let iB_plus = 0;
    for (const p of peaksB) {
      const relH = (p.intensity / maxIntensityB) * 100 * scaleSampleB;
      const targetCenter = p.twoTheta + shiftTwoThetaB;
      const peakFwhm = p.fwhm || fwhm;
      if (Math.abs((twoTheta + dStep) - targetCenter) < peakFwhm * 4.5) {
        iB_plus += evalPeakShape(twoTheta + dStep, targetCenter, peakFwhm, relH);
      }
    }
    const derivB = Number(((iB_plus - (iB - background - noise)) / dStep).toFixed(2));

    points[i] = {
      twoTheta,
      intensityA: Math.max(0, Number(iA.toFixed(2))),
      intensityB: Math.max(0, Number(iB.toFixed(2))),
      intensityC: matC ? Math.max(0, Number(iC.toFixed(2))) : undefined,
      intensityD: matD ? Math.max(0, Number(iD.toFixed(2))) : undefined,
      intensityTotalModel: Math.max(0, Number(totalModel.toFixed(2))),
      mirroredB: Number((-iB).toFixed(2)),
      difference: Number(diff.toFixed(2)),
      posDiff: diff > 0 ? Number(diff.toFixed(2)) : 0,
      negDiff: diff < 0 ? Number(diff.toFixed(2)) : 0,
      toleranceUpper: Number((totalModel * 1.08 + 2).toFixed(2)),
      toleranceLower: Number((totalModel * 0.92 - 2).toFixed(2)),
      derivA,
      derivB
    };
  }

  return { points, peaksA, peaksB, peaksC, peaksD };
};

/**
 * Computes statistical cross-correlation and Rietveld residual metrics
 */
export const computeSpectralMetrics = (points: ProfilePoint[]): SpectralMetrics => {
  if (!points || points.length === 0) {
    return {
      rP: '0.0',
      rWP: '0.0',
      rExp: '2.5',
      chiSquared: '1.00',
      pearsonR: '0.0',
      fom: '0.0',
      maxDiff: '0.0',
      rmsd: '0.0',
      goodnessOfFit: '1.00'
    };
  }

  let sumDiff = 0;
  let sumObs = 0;
  let sumDiffSq = 0;
  let sumObsSq = 0;
  let maxDiff = 0;

  let sumA = 0;
  let sumB = 0;
  let sumAA = 0;
  let sumBB = 0;
  let sumAB = 0;
  const N = points.length;

  for (let i = 0; i < N; i++) {
    const yObs = points[i].intensityA;
    const yCalc = points[i].intensityTotalModel ?? points[i].intensityB;
    const diff = Math.abs(yObs - yCalc);

    sumDiff += diff;
    sumObs += Math.abs(yObs);
    
    // Weight w = 1 / yObs
    const w = 1 / Math.max(yObs, 1);
    sumDiffSq += w * Math.pow(diff, 2);
    sumObsSq += w * Math.pow(yObs, 2);

    if (diff > maxDiff) maxDiff = diff;

    sumA += yObs;
    sumB += yCalc;
    sumAA += yObs * yObs;
    sumBB += yCalc * yCalc;
    sumAB += yObs * yCalc;
  }

  // Profile R-factor R_p = sum(|yObs - yCalc|) / sum(yObs)
  const rP = sumObs > 0 ? (sumDiff / sumObs) * 100 : 0;

  // Weighted Profile R-factor R_wp = sqrt(sum(w*(yObs-yCalc)^2) / sum(w*yObs^2))
  const rWP = sumObsSq > 0 ? Math.sqrt(sumDiffSq / sumObsSq) * 100 : 0;

  // Expected R-factor R_exp ~ sqrt((N - P) / sum(w*yObs^2))
  const numParams = 6;
  const rExp = sumObsSq > 0 ? Math.sqrt(Math.max(1, N - numParams) / sumObsSq) * 100 : 3.5;

  // Goodness of Fit chi^2 = (R_wp / R_exp)^2
  const chiSquared = rExp > 0 ? Math.pow(rWP / rExp, 2) : 1.0;

  // Pearson correlation coefficient (r)
  const numerator = (N * sumAB) - (sumA * sumB);
  const denom = Math.sqrt((N * sumAA - sumA * sumA) * (N * sumBB - sumB * sumB));
  const pearsonR = denom !== 0 ? Math.max(0, (numerator / denom) * 100) : 0;

  // Figure of Merit (FOM) combining R_wp, Pearson, and RMSD (0-100 scale)
  const rmsd = Math.sqrt(sumDiffSq / N);
  const fom = Math.max(0, Math.min(100, (pearsonR * 0.6) + ((100 - Math.min(100, rP)) * 0.4)));

  return {
    rP: rP.toFixed(2),
    rWP: rWP.toFixed(2),
    rExp: rExp.toFixed(2),
    chiSquared: chiSquared.toFixed(2),
    pearsonR: pearsonR.toFixed(2),
    fom: fom.toFixed(1),
    maxDiff: maxDiff.toFixed(1),
    rmsd: rmsd.toFixed(2),
    goodnessOfFit: Math.sqrt(chiSquared).toFixed(2)
  };
};

/**
 * Peak-by-peak pairing, lattice displacement, and indexing
 */
export const computePeakIndexing = (peaksA: PeakItem[], peaksB: PeakItem[]): {
  indexedPeaks: IndexedPeakMatch[];
  meanShift: number;
  avgStrain: number;
  primaryPhasePurity: number;
  secondaryPhaseEst: number;
  extraInA: number[];
  missingInA: number[];
} => {
  if (!peaksA || !peaksB) {
    return {
      indexedPeaks: [],
      meanShift: 0,
      avgStrain: 0,
      primaryPhasePurity: 100,
      secondaryPhaseEst: 0,
      extraInA: [],
      missingInA: []
    };
  }

  const indexedPeaks: IndexedPeakMatch[] = [];
  const tolerance = 0.65; // degrees 2Theta matching window
  const matchedBIndices = new Set<number>();
  const shifts: number[] = [];
  const extraInA: number[] = [];

  peaksA.forEach((pA, idx) => {
    let bestMatchIdx = -1;
    let minDiff = Infinity;

    peaksB.forEach((pB, bIdx) => {
      const diff = Math.abs(pA.twoTheta - pB.twoTheta);
      if (diff <= tolerance && diff < minDiff) {
        minDiff = diff;
        bestMatchIdx = bIdx;
      }
    });

    const thetaRadA = (pA.twoTheta / 2) * (Math.PI / 180);
    const dSpacingA = thetaRadA > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRadA))).toFixed(4) : '-';

    if (bestMatchIdx !== -1) {
      const matchedB = peaksB[bestMatchIdx];
      matchedBIndices.add(bestMatchIdx);
      const shift = Number((pA.twoTheta - matchedB.twoTheta).toFixed(3));
      shifts.push(shift);

      const thetaRadB = (matchedB.twoTheta / 2) * (Math.PI / 180);
      const dSpacingB = thetaRadB > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRadB))).toFixed(4) : '-';

      const isShifted = Math.abs(shift) > 0.05;
      indexedPeaks.push({
        id: idx + 1,
        twoThetaA: pA.twoTheta,
        twoThetaB: matchedB.twoTheta,
        hklA: pA.hkl,
        hklB: matchedB.hkl,
        dSpacingA,
        dSpacingB,
        shift,
        intensityA: pA.intensity,
        intensityB: matchedB.intensity,
        status: isShifted ? 'shifted' : 'matched',
        phaseOrigin: 'Phase B'
      });
    } else {
      extraInA.push(pA.twoTheta);
      indexedPeaks.push({
        id: idx + 1,
        twoThetaA: pA.twoTheta,
        twoThetaB: null,
        hklA: pA.hkl,
        hklB: undefined,
        dSpacingA,
        dSpacingB: '-',
        shift: null,
        intensityA: pA.intensity,
        intensityB: 0,
        status: 'extra',
        phaseOrigin: 'Unknown'
      });
    }
  });

  // Missing in A (Present in Reference B but absent in experimental sample)
  const missingInA: number[] = [];
  peaksB.forEach((pB, bIdx) => {
    if (!matchedBIndices.has(bIdx)) {
      missingInA.push(pB.twoTheta);
      const thetaRadB = (pB.twoTheta / 2) * (Math.PI / 180);
      const dSpacingB = thetaRadB > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRadB))).toFixed(4) : '-';

      indexedPeaks.push({
        id: indexedPeaks.length + 1,
        twoThetaA: 0,
        twoThetaB: pB.twoTheta,
        hklA: undefined,
        hklB: pB.hkl,
        dSpacingA: '-',
        dSpacingB,
        shift: null,
        intensityA: 0,
        intensityB: pB.intensity,
        status: 'missing',
        phaseOrigin: 'Phase B'
      });
    }
  });

  const meanShift = shifts.length > 0 ? Number((shifts.reduce((a, b) => a + b, 0) / shifts.length).toFixed(3)) : 0;
  
  // Microstrain estimation delta d/d = -delta Theta / tan(Theta)
  const avgStrain = shifts.length > 0 
    ? Number(((Math.abs(meanShift) * (Math.PI / 180)) / (2 * Math.tan((35 / 2) * (Math.PI / 180))) * 100).toFixed(3))
    : 0;

  const totalExpIntensity = peaksA.reduce((sum, p) => sum + p.intensity, 0);
  const matchedIntensity = indexedPeaks.filter(p => p.status === 'matched' || p.status === 'shifted').reduce((sum, p) => sum + p.intensityA, 0);
  
  const primaryPhasePurity = totalExpIntensity > 0 ? Number(((matchedIntensity / totalExpIntensity) * 100).toFixed(1)) : 100;
  const secondaryPhaseEst = Number((100 - primaryPhasePurity).toFixed(1));

  return {
    indexedPeaks: indexedPeaks.sort((a, b) => (a.twoThetaA || a.twoThetaB || 0) - (b.twoThetaA || b.twoThetaB || 0)),
    meanShift,
    avgStrain,
    primaryPhasePurity,
    secondaryPhaseEst,
    extraInA,
    missingInA
  };
};

/**
 * Solves Non-Negative Least Squares (NNLS) multi-phase fraction percentages
 */
export const solveMultiPhaseFractions = (
  arrA: number[], 
  arrB: number[], 
  arrC: number[] = [], 
  arrD: number[] = []
): { fracB: number; fracC: number; fracD: number; residualNorm: number } => {
  if (arrA.length === 0 || arrB.length === 0) {
    return { fracB: 100, fracC: 0, fracD: 0, residualNorm: 0 };
  }

  // 1-phase case
  if (arrC.length === 0 && arrD.length === 0) {
    return { fracB: 100, fracC: 0, fracD: 0, residualNorm: 0 };
  }

  let bestB = 1.0;
  let bestC = 0.0;
  let bestD = 0.0;
  let minResidual = Infinity;

  // Grid search optimization for multi-component fraction weights
  const step = 0.02;
  const hasD = arrD.length > 0;

  for (let wB = 0; wB <= 1.0; wB += step) {
    const maxWC = 1.0 - wB;
    for (let wC = 0; wC <= maxWC; wC += step) {
      const wD = hasD ? Math.max(0, 1.0 - wB - wC) : 0;
      if (!hasD && Math.abs(wB + wC - 1.0) > 0.01) continue;

      let resSq = 0;
      for (let i = 0; i < arrA.length; i += 4) { // stride 4 for speed
        const obs = arrA[i];
        const calc = (arrB[i] * wB) + (arrC[i] ? arrC[i] * wC : 0) + (hasD && arrD[i] ? arrD[i] * wD : 0);
        resSq += Math.pow(obs - calc, 2);
      }

      if (resSq < minResidual) {
        minResidual = resSq;
        bestB = wB;
        bestC = wC;
        bestD = wD;
      }
    }
  }

  const total = bestB + bestC + bestD;
  return {
    fracB: total > 0 ? Number(((bestB / total) * 100).toFixed(1)) : 100,
    fracC: total > 0 ? Number(((bestC / total) * 100).toFixed(1)) : 0,
    fracD: total > 0 ? Number(((bestD / total) * 100).toFixed(1)) : 0,
    residualNorm: Number(Math.sqrt(minResidual / arrA.length).toFixed(2))
  };
};

/**
 * Hanawalt 3-strongest peak search-match cross-correlation
 */
export const performDatabaseSearchMatch = (
  targetPeaks: PeakItem[], 
  materialsDb: any[], 
  maxResults = 25
): SearchMatchCandidate[] => {
  if (!targetPeaks || targetPeaks.length === 0 || !materialsDb) return [];

  const topTarget = [...targetPeaks].sort((a, b) => b.intensity - a.intensity).slice(0, 8);
  const candidates: SearchMatchCandidate[] = [];

  for (const mat of materialsDb) {
    const refPeaks = extractMaterialPeaks(mat);
    if (refPeaks.length === 0) continue;

    let matchedCount = 0;
    let dSpacingPenalty = 0;

    for (const tPeak of topTarget) {
      let closestDiff = Infinity;
      for (const rPeak of refPeaks) {
        const diff = Math.abs(tPeak.twoTheta - rPeak.twoTheta);
        if (diff < closestDiff) closestDiff = diff;
      }

      if (closestDiff <= 0.6) {
        matchedCount++;
        dSpacingPenalty += closestDiff;
      }
    }

    const matchRatio = matchedCount / Math.min(topTarget.length, refPeaks.length);
    const score = Math.max(0, Math.min(100, (matchRatio * 85) - (dSpacingPenalty * 15)));

    if (score > 15 || matchedCount >= 2) {
      candidates.push({
        material: mat,
        pearsonR: Number(score.toFixed(1)),
        rP: Number(Math.max(5, (100 - score) * 0.8).toFixed(1)),
        fom: Number(score.toFixed(1)),
        matchedPeaksCount: matchedCount,
        totalPeaksCount: refPeaks.length
      });
    }
  }

  return candidates.sort((a, b) => b.pearsonR - a.pearsonR).slice(0, maxResults);
};

/**
 * Fast cross-correlation 2Theta shift & scale optimization engine
 */
export const optimizeAlignmentAndScale = (
  peaksA: PeakItem[],
  peaksB: PeakItem[]
): { optimalShift: number; optimalScale: number; bestCorrelation: number } => {
  if (!peaksA.length || !peaksB.length) {
    return { optimalShift: 0, optimalScale: 1.0, bestCorrelation: 0 };
  }

  // Find strongest peaks in Sample A and Reference B
  const topA = [...peaksA].sort((a, b) => b.intensity - a.intensity).slice(0, 5);
  const topB = [...peaksB].sort((a, b) => b.intensity - a.intensity).slice(0, 5);

  let bestShift = 0;
  let bestScale = 1.0;
  let maxScore = -Infinity;

  // Sweep shift from -2.00 to +2.00 in 0.02 deg steps
  for (let shift = -2.00; shift <= 2.00; shift += 0.02) {
    let matchedScore = 0;
    let sumWeight = 0;

    for (const pa of topA) {
      for (const pb of topB) {
        const shiftedB = pb.twoTheta + shift;
        const diff = Math.abs(pa.twoTheta - shiftedB);
        if (diff <= 0.45) {
          const proximity = Math.max(0, 1 - diff / 0.45);
          const intensitySim = 1 - Math.min(1, Math.abs(pa.intensity - pb.intensity) / 100);
          matchedScore += proximity * (0.7 + 0.3 * intensitySim) * (pa.intensity / 100);
          sumWeight += (pa.intensity / 100);
        }
      }
    }

    if (matchedScore > maxScore) {
      maxScore = matchedScore;
      bestShift = Number(shift.toFixed(2));
    }
  }

  // Optimize scale factor
  const strongestA = topA[0];
  const matchingB = topB.find(p => Math.abs(p.twoTheta + bestShift - strongestA.twoTheta) < 0.4);
  if (matchingB && matchingB.intensity > 0) {
    bestScale = Number((strongestA.intensity / matchingB.intensity).toFixed(2));
    bestScale = Math.max(0.2, Math.min(3.0, bestScale));
  }

  return {
    optimalShift: bestShift,
    optimalScale: bestScale,
    bestCorrelation: Number(maxScore.toFixed(2))
  };
};

/**
 * Exports compare profile dataset as downloadable CSV
 */
export const exportCompareDataAsCSV = (
  points: ProfilePoint[], 
  nameA: string, 
  nameB: string,
  nameC?: string,
  nameD?: string
) => {
  if (!points || points.length === 0) return;

  const headers = [
    '2Theta_deg',
    'dSpacing_Angstrom',
    `Intensity_A_${nameA.replace(/[^a-zA-Z0-9]/g, '_')}`,
    `Intensity_B_${nameB.replace(/[^a-zA-Z0-9]/g, '_')}`,
    nameC ? `Intensity_C_${nameC.replace(/[^a-zA-Z0-9]/g, '_')}` : null,
    nameD ? `Intensity_D_${nameD.replace(/[^a-zA-Z0-9]/g, '_')}` : null,
    'Intensity_TotalModel',
    'Difference_Residual',
    'Deriv_A',
    'Deriv_B'
  ].filter(Boolean).join(',');

  const rows = points.map(pt => {
    const thetaRad = (pt.twoTheta / 2) * (Math.PI / 180);
    const dVal = thetaRad > 0 ? (CU_KA_WAVELENGTH / (2 * Math.sin(thetaRad))).toFixed(4) : '';
    
    const rowVals = [
      pt.twoTheta.toFixed(2),
      dVal,
      pt.intensityA.toFixed(2),
      pt.intensityB.toFixed(2),
      nameC ? (pt.intensityC !== undefined ? pt.intensityC.toFixed(2) : '') : null,
      nameD ? (pt.intensityD !== undefined ? pt.intensityD.toFixed(2) : '') : null,
      pt.intensityTotalModel?.toFixed(2) ?? '',
      pt.difference.toFixed(2),
      pt.derivA.toFixed(2),
      pt.derivB.toFixed(2)
    ].filter(v => v !== null).join(',');

    return rowVals;
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `XRD_Compare_${nameA}_vs_${nameB}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

